import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    var payload = await req.text()
    var signature = req.headers.get('stripe-signature') || ''
    var webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    var stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || ''

    var supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    var supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    var supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse event (skip signature verification if no secret set)
    var event
    if (webhookSecret && signature) {
      var parts = signature.split(',')
      var tPart = parts.find(function(p) { return p.startsWith('t='); })
      if (!tPart) throw new Error('Invalid signature')
      var timestamp = tPart.substring(2)
      var encoder = new TextEncoder()
      var keyData = encoder.encode(webhookSecret)
      var msgData = encoder.encode(timestamp + '.' + payload)
      var cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      var sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
      var hexSig = Array.from(new Uint8Array(sig)).map(function(b) { return b.toString(16).padStart(2, '0') }).join('')
      var v1Part = parts.find(function(p) { return p.startsWith('v1='); })
      if (!v1Part || v1Part.substring(3) !== hexSig) throw new Error('Signature mismatch')
    }

    event = JSON.parse(payload)

    // ── Handle checkout.session.completed (ticket purchases) ──────────────
    if (event.type === 'checkout.session.completed') {
      var session = event.data.object
      var metadata = session.metadata || {}
      var eventId = metadata.event_id
      var memberId = metadata.member_id
      var sessionType = metadata.type

      if (sessionType === 'event_ticket' && eventId && memberId) {
        var lineItemsRes = await fetch(
          'https://api.stripe.com/v1/checkout/sessions/' + session.id + '/line_items?limit=100',
          { headers: { 'Authorization': 'Bearer ' + stripeKey } }
        )
        var lineItemsData = await lineItemsRes.json()
        var lineItems = lineItemsData.data || []

        var ttMap = {}
        Object.keys(metadata).forEach(function(key) {
          if (key.startsWith('tt_')) {
            var val = metadata[key]
            var parts = val.split(':')
            var ttId = parts[0]
            var qty = parseInt(parts[1]) || 1
            ttMap[key.replace('tt_', '')] = { ticket_type_id: ttId, quantity: qty }
          }
        })

        var { data: ticketTypes } = await supabase
          .from('event_ticket_types')
          .select('*')
          .eq('event_id', eventId)

        var ttById = {}
        if (ticketTypes) {
          ticketTypes.forEach(function(tt) { ttById[tt.id] = tt })
        }

        var purchaseRows = []
        var ttKeys = Object.keys(ttMap).sort(function(a, b) { return parseInt(a) - parseInt(b) })

        for (var i = 0; i < ttKeys.length; i++) {
          var entry = ttMap[ttKeys[i]]
          var tt = ttById[entry.ticket_type_id]
          if (!tt) continue

          var now = new Date()
          var useEarlyBird = tt.early_bird_price != null &&
            tt.early_bird_ends_at != null &&
            new Date(tt.early_bird_ends_at) > now
          var unitPrice = useEarlyBird ? tt.early_bird_price : tt.price

          purchaseRows.push({
            event_id: eventId,
            member_id: memberId,
            ticket_type_id: tt.id,
            ticket_type_name: tt.name,
            quantity: entry.quantity,
            unit_price: parseFloat(unitPrice),
            total_amount: parseFloat(unitPrice) * entry.quantity,
            stripe_session_id: session.id,
          })

          await supabase
            .from('event_ticket_types')
            .update({ quantity_sold: (tt.quantity_sold || 0) + entry.quantity })
            .eq('id', tt.id)
        }

        if (purchaseRows.length > 0) {
          await supabase.from('ticket_purchases').insert(purchaseRows)
        }
      }

      // DUES PAYMENT
      if (session.metadata?.type === 'dues') {
        var duesMemberId = session.metadata.member_id;
        var duesOrgId = session.metadata.organization_id;
        var duesTierId = session.metadata.tier_id || null;
        var duesAmount = parseFloat(session.metadata.amount || '0');
        var paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null;

        await supabase.from('dues_payments').insert({
          member_id: duesMemberId,
          organization_id: duesOrgId,
          tier_id: duesTierId || null,
          amount: duesAmount,
          stripe_payment_intent_id: paymentIntentId,
          paid_at: new Date().toISOString(),
        });

        var duesPaidUntil = new Date();
        duesPaidUntil.setFullYear(duesPaidUntil.getFullYear() + 1);

        await supabase
          .from('memberships')
          .update({
            dues_paid: true,
            dues_paid_until: duesPaidUntil.toISOString(),
          })
          .eq('member_id', duesMemberId)
          .eq('organization_id', duesOrgId);

        try {
          var { data: duesMember } = await supabase
            .from('members')
            .select('email, first_name, last_name, display_name')
            .eq('user_id', duesMemberId)
            .single();
          var { data: duesOrg } = await supabase
            .from('organizations')
            .select('name, logo_url')
            .eq('id', duesOrgId)
            .single();
          var duesTier = null;
          if (duesTierId) {
            var { data: tierData } = await supabase
              .from('membership_tiers')
              .select('name')
              .eq('id', duesTierId)
              .single();
            duesTier = tierData;
          }
          if (duesMember && duesMember.email) {
            var memberDisplayName = duesMember.display_name ||
              ((duesMember.first_name || '') + ' ' + (duesMember.last_name || '')).trim();
            await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/send-transactional', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'dues_confirmation',
                data: {
                  memberEmail: duesMember.email,
                  memberName: memberDisplayName,
                  orgName: duesOrg ? duesOrg.name : '',
                  orgLogoUrl: duesOrg ? duesOrg.logo_url : '',
                  amount: duesAmount,
                  tierName: duesTier ? duesTier.name : null,
                  duesPaidUntil: duesPaidUntil.toISOString(),
                },
              }),
            });
          }
        } catch (emailErr) {
          console.error('Dues confirmation email error:', emailErr);
        }
      }
    }

    // ── Handle subscription events ────────────────────────────────────────
    if (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted') {

      var subscription = event.data.object
      var customerId = subscription.customer

      var { data: subRecord } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subRecord) {
        var status = subscription.status
        var priceId = subscription.items?.data?.[0]?.price?.id
        var stripeSubId = subscription.id

        // ── Price ID → plan name mapping (update placeholders when Listed IDs are created in Stripe)
        var PRICE_TO_PLAN: Record<string, string> = {
         'price_1TbJvlKMpHjSZayWgtSa1gIH': 'listed',
'price_1TbJwAKMpHjSZayWQ2REzDyi': 'listed',
          'price_1TMnuAKMpHjSZayWhfMtS8AB':    'starter',
          'price_1TMnuAKMpHjSZayWbYHYUoS8':    'starter',
          'price_1TOKEKKMpHjSZayWoryYepSM':    'growth',
          'price_1TMnu9KMpHjSZayW67fBSDzC':    'growth',
          'price_1TMnu8KMpHjSZayWRcSF5Qez':    'pro',
          'price_1TMnu7KMpHjSZayW34qmec4T':    'pro',
          'price_1TOKB2KMpHjSZayWoq7QSqOA':    'student',
        }
        var planName = (priceId && PRICE_TO_PLAN[priceId]) || 'starter'

        // ── Annual price IDs (used to set billing_interval = 'year')
        var yearlyPrices = [
          'price_1TbJwAKMpHjSZayWQ2REzDyi',
          'price_1TMnuAKMpHjSZayWbYHYUoS8',
          'price_1TMnu9KMpHjSZayW67fBSDzC',
          'price_1TMnu7KMpHjSZayW34qmec4T',
        ]
        var billingInterval = (priceId && yearlyPrices.includes(priceId)) ? 'year' : 'month'

        await supabase.from('subscriptions').update({
          status: status,
          plan: planName,
          billing_interval: billingInterval,
          stripe_subscription_id: stripeSubId,
          stripe_price_id: priceId || null,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error('Webhook error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})