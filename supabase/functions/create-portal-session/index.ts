var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    var ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

    var token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    var userRes = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': ANON_KEY || SB_KEY },
    })
    var user = await userRes.json()
    if (!user.id) throw new Error('Unauthorized')

    var body = await req.json()
    var organization_id = body.organization_id
    var return_url = body.return_url || 'https://syndicade-git-main-syndicades-projects.vercel.app'

    var subRes = await fetch(SB_URL + '/rest/v1/subscriptions?organization_id=eq.' + organization_id + '&select=stripe_customer_id&limit=1', {
      headers: { 'Authorization': 'Bearer ' + SB_KEY, 'apikey': SB_KEY },
    })
    var subs = await subRes.json()
    var customerId = subs && subs[0] && subs[0].stripe_customer_id
    if (!customerId) throw new Error('No billing account found for this organization.')

    var session = await stripePost('/billing_portal/sessions', {
      customer: customerId,
      return_url: return_url,
    }, STRIPE_KEY)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })

  } catch (err) {
    console.error('Portal error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })
  }
})
