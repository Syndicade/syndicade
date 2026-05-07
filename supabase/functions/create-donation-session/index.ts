import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    var success_url = body.success_url || 'https://syndicade.org'
    var cancel_url = body.cancel_url || success_url

    if (!amount_cents || amount_cents < 100) throw new Error('Minimum donation is $1.00')

    // Fetch org Stripe Connect details
    var donationSupabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    var { data: donationOrg } = await donationSupabase
      .from('organizations')
      .select('stripe_connect_status, stripe_account_id')
      .eq('id', org_id)
      .maybeSingle()
    var donationConnectedId = (donationOrg && donationOrg.stripe_connect_status === 'active') ? donationOrg.stripe_account_id : null

    var donationParams = {
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
    }

    var donationHeaders = {
      'Authorization': 'Bearer ' + STRIPE_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
    if (donationConnectedId) {
      donationHeaders['Stripe-Account'] = donationConnectedId
    }

    var donationRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: donationHeaders,
      body: new URLSearchParams(donationParams).toString(),
    })
    var donationData = await donationRes.json()
    if (!donationRes.ok) throw new Error(donationData.error ? donationData.error.message : 'Stripe error')

    return new Response(JSON.stringify({ url: donationData.url }), {
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