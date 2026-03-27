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
    if (!STRIPE_KEY) throw new Error('STRIPE_SECRET_KEY not set')

    var body = await req.json()
    var amount_cents = Math.round((body.amount || 0) * 100)
    var org_name = body.org_name || 'Organization'
    var org_id = body.org_id || ''
    var success_url = body.success_url || 'https://syndicade-git-main-syndicades-projects.vercel.app'
    var cancel_url = body.cancel_url || success_url

    if (!amount_cents || amount_cents < 100) throw new Error('Minimum donation is $1.00')

    var session = await stripePost('/checkout/sessions', {
      mode: 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': 'Donation to ' + org_name,
      'line_items[0][price_data][product_data][description]': 'Thank you for supporting ' + org_name,
      'line_items[0][price_data][unit_amount]': String(amount_cents),
      'line_items[0][quantity]': '1',
      success_url: success_url + '?donated=true',
      cancel_url: cancel_url,
      'metadata[org_id]': org_id,
      'metadata[type]': 'donation',
    }, STRIPE_KEY)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })

  } catch (err) {
    console.error('Donation error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })
  }
})
