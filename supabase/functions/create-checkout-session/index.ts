var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

var PRICE_IDS = {
  starter_month: 'price_1TFCIVKcdErNqbVNe5SnUUGX',
  starter_year:  'price_1TFCIVKcdErNqbVNdJCM0hQh',
  growth_month:  'price_1TFCIrKcdErNqbVNmgbJAIpo',
  growth_year:   'price_1TFCJEKcdErNqbVNyXCfyuit',
  pro_month:     'price_1TFCJfKcdErNqbVNZTSGeAaH',
  pro_year:      'price_1TFCJyKcdErNqbVNoBIkHrAJ',
}

var TRIAL_DAYS = 30

async function sbGet(path, serviceKey, supabaseUrl) {
  var res = await fetch(supabaseUrl + '/rest/v1' + path, {
    headers: { 'Authorization': 'Bearer ' + serviceKey, 'apikey': serviceKey },
  })
  return res.json()
}

async function sbUpsert(path, data, serviceKey, supabaseUrl) {
  await fetch(supabaseUrl + '/rest/v1' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + serviceKey,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(data),
  })
}

async function stripePost(path, body, secretKey) {
  var res = await fetch('https://api.stripe.com/v1' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + secretKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  })
  var data = await res.json()
  if (!res.ok) throw new Error(data.error ? data.error.message : 'Stripe error')
  return data
}

Deno.serve(async function(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    var SB_URL = Deno.env.get('SUPABASE_URL')
    var SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    var token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG1ocXJ5Z2tua29keWRidW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzc0NjksImV4cCI6MjA4NDA1MzQ2OX0.B7DsLVNZuG1l39ABXDk1Km_737tCvbWAZGhqVCC3ddE'
var userRes = await fetch(SB_URL + '/auth/v1/user', {
  headers: { 'Authorization': 'Bearer ' + token, 'apikey': ANON_KEY },
})
    var user = await userRes.json()
    if (!user.id) throw new Error('Unauthorized')

    var body = await req.json()
    var org_id = body.organization_id
    var plan = body.plan
    var interval = body.interval

    if (!org_id || !plan || !interval) throw new Error('Missing fields')

    var memberships = await sbGet('/memberships?organization_id=eq.' + org_id + '&member_id=eq.' + user.id + '&status=eq.active&select=role&limit=1', SB_KEY, SB_URL)
    var membership = memberships && memberships[0]
    if (!membership || !['admin','owner'].includes(membership.role)) throw new Error('Admin required')

    var subs = await sbGet('/subscriptions?organization_id=eq.' + org_id + '&select=stripe_customer_id&limit=1', SB_KEY, SB_URL)
    var customerId = subs && subs[0] && subs[0].stripe_customer_id

    if (!customerId) {
      var orgs = await sbGet('/organizations?id=eq.' + org_id + '&select=name&limit=1', SB_KEY, SB_URL)
      var members = await sbGet('/members?user_id=eq.' + user.id + '&select=email&limit=1', SB_KEY, SB_URL)
      var customer = await stripePost('/customers', {
        email: (members && members[0] && members[0].email) || '',
        name: (orgs && orgs[0] && orgs[0].name) || '',
        'metadata[organization_id]': org_id,
      }, STRIPE_KEY)
      customerId = customer.id
    }

    var priceId = PRICE_IDS[plan + '_' + interval]
    if (!priceId) throw new Error('Invalid plan')

    var successUrl = body.success_url || 'https://syndicade-git-main-syndicades-projects.vercel.app/organizations/' + org_id + '/billing?billing=success'
    var cancelUrl = body.cancel_url || 'https://syndicade-git-main-syndicades-projects.vercel.app/organizations/' + org_id + '/billing?billing=cancelled'

    var session = await stripePost('/checkout/sessions', {
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': String(TRIAL_DAYS),
      'subscription_data[metadata][organization_id]': org_id,
      payment_method_collection: 'if_required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'metadata[organization_id]': org_id,
    }, STRIPE_KEY)

    await sbUpsert('/subscriptions', {
      organization_id: org_id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan: plan,
      billing_interval: interval,
      status: 'trialing',
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, SB_KEY, SB_URL)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })

  } catch (err) {
    console.error('Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })
  }
})
