import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'

var PRICE_TO_PLAN = {
  'price_1TFCIVKcdErNqbVNe5SnUUGX': { plan: 'starter', interval: 'month' },
  'price_1TFCIVKcdErNqbVNdJCM0hQh': { plan: 'starter', interval: 'year'  },
  'price_1TFCIrKcdErNqbVNmgbJAIpo': { plan: 'growth',  interval: 'month' },
  'price_1TFCJEKcdErNqbVNyXCfyuit': { plan: 'growth',  interval: 'year'  },
  'price_1TFCJfKcdErNqbVNZTSGeAaH': { plan: 'pro',     interval: 'month' },
  'price_1TFCJyKcdErNqbVNoBIkHrAJ': { plan: 'pro',     interval: 'year'  },
}

serve(async function(req) {
  var stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  var supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  var signature = req.headers.get('stripe-signature')
  var webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  var body = await req.text()

  var event
  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } else {
      event = JSON.parse(body)
    }
  } catch (err) {
    console.error('Webhook signature error:', err)
    return new Response('Webhook error: ' + err.message, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      var session = event.data.object
      var organizationId = session.metadata?.organization_id
      if (!organizationId) return new Response('ok', { status: 200 })

      var subscription = await stripe.subscriptions.retrieve(session.subscription)
      var priceId = subscription.items.data[0]?.price?.id
      var planInfo = PRICE_TO_PLAN[priceId] || { plan: 'starter', interval: 'month' }

      await supabase.from('subscriptions').upsert({
        organization_id: organizationId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        stripe_price_id: priceId,
        plan: planInfo.plan,
        billing_interval: planInfo.interval,
        status: subscription.status,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' })
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      var subscription = event.data.object
      var organizationId = subscription.metadata?.organization_id
      if (!organizationId) {
        var { data: sub } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()
        organizationId = sub?.organization_id
      }
      if (!organizationId) return new Response('ok', { status: 200 })

      var priceId = subscription.items.data[0]?.price?.id
      var planInfo = PRICE_TO_PLAN[priceId] || { plan: 'starter', interval: 'month' }

      await supabase.from('subscriptions').upsert({
        organization_id: organizationId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        plan: planInfo.plan,
        billing_interval: planInfo.interval,
        status: event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' })
    }

    if (event.type === 'invoice.payment_failed') {
      var invoice = event.data.object
      var { data: sub } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .eq('stripe_customer_id', invoice.customer)
        .single()
      if (sub) {
        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('organization_id', sub.organization_id)
      }
    }

  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response('Handler error: ' + err.message, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
