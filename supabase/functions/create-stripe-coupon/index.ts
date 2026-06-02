/**
 * create-stripe-coupon/index.ts
 * Creates a Stripe coupon for percent_off and flat_off discount codes.
 * Called from StaffPromoCodes.jsx when a new code is created.
 * months_free codes do NOT need a Stripe coupon — they extend the trial period.
 *
 * Coupon durations:
 *   percent_off → duration: forever  (keeps discount permanently)
 *   flat_off    → duration: once     (first payment only)
 */

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function stripePost(path: string, body: Record<string, string>, secretKey: string) {
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

Deno.serve(async function(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    var SB_URL = Deno.env.get('SUPABASE_URL')
    var SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG1ocXJ5Z2tua29keWRidW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzc0NjksImV4cCI6MjA4NDA1MzQ2OX0.B7DsLVNZuG1l39ABXDk1Km_737tCvbWAZGhqVCC3ddE'

    // Verify staff user
    var token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    var userRes = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': ANON_KEY },
    })
    var user = await userRes.json()
    if (!user.id) throw new Error('Unauthorized')

    // Verify staff role
    var memberRes = await fetch(SB_URL + '/rest/v1/members?user_id=eq.' + user.id + '&select=is_staff&limit=1', {
      headers: { 'Authorization': 'Bearer ' + SB_KEY, 'apikey': SB_KEY },
    })
    var members = await memberRes.json()
    if (!members || !members[0] || !members[0].is_staff) throw new Error('Staff access required')

    var body = await req.json()
    var { code, type, value, discount_code_id } = body

    if (!code || !type || value === undefined || value === null) {
      throw new Error('Missing required fields: code, type, value')
    }

    // months_free uses trial extension — no Stripe coupon needed
    if (type === 'months_free') {
      return new Response(JSON.stringify({ stripe_coupon_id: null, skipped: true }), {
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
      })
    }

    // Build Stripe coupon params
    var couponParams: Record<string, string> = {
      id: 'SYNC_' + code, // Prefix to avoid collisions in Stripe dashboard
      name: code,
      'metadata[syndicade_code]': code,
      'metadata[discount_code_id]': discount_code_id || '',
    }

    if (type === 'percent_off') {
      couponParams.percent_off = String(value)
      couponParams.duration = 'forever'
    } else if (type === 'flat_off') {
      // Stripe uses cents
      couponParams.amount_off = String(Math.round(value * 100))
      couponParams.currency = 'usd'
      couponParams.duration = 'once'
    } else {
      throw new Error('Invalid discount type: ' + type)
    }

    var coupon = await stripePost('/coupons', couponParams, STRIPE_KEY)

    // Save stripe_coupon_id back to discount_codes row
    if (discount_code_id) {
      await fetch(SB_URL + '/rest/v1/discount_codes?id=eq.' + discount_code_id, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + SB_KEY,
          'apikey': SB_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stripe_coupon_id: coupon.id }),
      })
    }

    return new Response(JSON.stringify({ stripe_coupon_id: coupon.id }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })

  } catch (err) {
    console.error('create-stripe-coupon error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
    })
  }
})