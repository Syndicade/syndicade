import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

var PRICE_IDS = {
  starter_month:  'price_1TFCIVKcdErNqbVNe5SnUUGX',
  starter_year:   'price_1TFCIVKcdErNqbVNdJCM0hQh',
  growth_month:   'price_1TFCIrKcdErNqbVNmgbJAIpo',
  growth_year:    'price_1TFCJEKcdErNqbVNyXCfyuit',
  pro_month:      'price_1TFCJfKcdErNqbVNZTSGeAaH',
  pro_year:       'price_1TFCJyKcdErNqbVNoBIkHrAJ',
}

var TRIAL_DAYS = 30

serve(async function(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    var supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    var authHeader = req.headers.get('Authorization') || ''
    var token = authHeader.replace('Bearer ', '')
    var { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      })
    }

    var body = await req.json()
    var { organization_id, plan, interval, success_url, cancel_url } = body

    if (!organization_id || !plan || !interval) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      })
    }

    var { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('member_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: 'Must be an admin to manage billing' }), {
        status: 403, headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      })
    }

    var { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organization_id)
      .maybeSingle()

    var customerId = existingSub?.stripe_customer_id

    if (!customerId) {
      var { data: org } = await supabase
        .from('organizations')
        .select('name, contact_email')
        .eq('id', organization_id)
        .single()

      var { data: member } = await supabase
        .from('members')
        .select('email, first_name, last_name')
        .eq('user_id', user.id)
        .single()

      var customer = await stripe.customers.create({
        email: member?.email || '',
        name: org?.name || '',
        metadata: { organization_id: organization_id, user_id: user.id },
      })
      customerId = customer.id
    }

    var priceKey = plan + '_' + interval
    var priceId = PRICE_IDS[priceKey]
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Invalid plan or interval' }), {
        status: 400, headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' })
      })
    }

    var session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { organization_id: organization_id, plan: plan, billing_interval: interval },
      },
      payment_method_collection: 'if_required',
      success_url: success_url || 'https://syndicade-git-main-syndicades-projects.vercel.app/organizations/' + organization_id + '?billing=success',
      cancel_url: cancel_url || 'https://syndicade-git-main-syndicades-projects.vercel.app/organizations/' + organization_id + '?billing=cancelled',
      metadata: { organization_id: organization_id },
    })

    await supabase.from('subscriptions').upsert({
      organization_id: organization_id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan: plan,
      billing_interval: interval,
      status: 'trialing',
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id' })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
      status: 200,
    })

  } catch (err) {
    console.error('Checkout error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
      status: 400,
    })
  }
})
