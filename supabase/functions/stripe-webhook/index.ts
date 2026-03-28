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
      // Simple manual signature check
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
        // Fetch line items from Stripe to get quantities + amounts
        var lineItemsRes = await fetch(
          'https://api.stripe.com/v1/checkout/sessions/' + session.id + '/line_items?limit=100',
          { headers: { 'Authorization': 'Bearer ' + stripeKey } }
        )
        var lineItemsData = await lineItemsRes.json()
        var lineItems = lineItemsData.data || []

        // Parse ticket type IDs from metadata (tt_0, tt_1, etc.)
        var ttMap = {}
        Object.keys(metadata).forEach(function(key) {
          if (key.startsWith('tt_')) {
            var val = metadata[key] // format: "ticket_type_id:quantity"
            var parts = val.split(':')
            var ttId = parts[0]
            var qty = parseInt(parts[1]) || 1
            ttMap[key.replace('tt_', '')] = { ticket_type_id: ttId, quantity: qty }
          }
        })

        // Fetch ticket types for this event
        var { data: ticketTypes } = await supabase
          .from('event_ticket_types')
          .select('*')
          .eq('event_id', eventId)

        var ttById = {}
        if (ticketTypes) {
          ticketTypes.forEach(function(tt) { ttById[tt.id] = tt })
        }

        // Build purchase records from metadata map
        var purchaseRows = []
        var ttKeys = Object.keys(ttMap).sort(function(a, b) { return parseInt(a) - parseInt(b) })

        for (var i = 0; i < ttKeys.length; i++) {
          var entry = ttMap[ttKeys[i]]
          var tt = ttById[entry.ticket_type_id]
          if (!tt) continue

          // Determine price used (early bird or regular)
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

          // Increment quantity_sold on ticket type
          await supabase
            .from('event_ticket_types')
            .update({ quantity_sold: (tt.quantity_sold || 0) + entry.quantity })
            .eq('id', tt.id)
        }

        if (purchaseRows.length > 0) {
          await supabase.from('ticket_purchases').insert(purchaseRows)
        }
      }
    }

    // ── Handle subscription events ────────────────────────────────────────
    if (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted') {

      var subscription = event.data.object
      var customerId = subscription.customer

      // Find org by Stripe customer ID
      var { data: subRecord } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subRecord) {
        var status = subscription.status
        var priceId = subscription.items?.data?.[0]?.price?.id
        var planName = 'starter'
        if (priceId && priceId.includes('growth')) planName = 'growth'
        else if (priceId && priceId.includes('pro')) planName = 'pro'

        await supabase.from('subscriptions').update({
          status: status,
          plan: planName,
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