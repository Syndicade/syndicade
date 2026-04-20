var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

var PRICE_IDS = {
  starter_month: 'price_1TMnuAKMpHjSZayWhfMtS8AB',
  starter_year:  'price_1TMnuAKMpHjSZayWbYHYUoS8',
  growth_month:  'price_1TOKEKKMpHjSZayWoryYepSM',
  growth_year:   'price_1TMnu9KMpHjSZayW67fBSDzC',
  pro_month:     'price_1TMnu8KMpHjSZayWRcSF5Qez',
  pro_year:      'price_1TMnu7KMpHjSZayW34qmec4T',
  student_month: 'price_1TOKB2KMpHjSZayWoq7QSqOA',
}

var TRIAL_DAYS = 14

async function sbGet(path, serviceKey, supabaseUrl) {
  var res = await fetch(supabaseUrl + '/rest/v1' + path, {
    headers: { 'Authorization': 'Bearer ' + serviceKey, 'apikey': serviceKey },
  })
  return res.json()
}

async function sbPost(path, data, serviceKey, supabaseUrl) {
  var res = await fetch(supabaseUrl + '/rest/v1' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + serviceKey,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return res
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

async function sbRpc(fnName, params, serviceKey, supabaseUrl) {
  var res = await fetch(supabaseUrl + '/rest/v1/rpc/' + fnName, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + serviceKey,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  return res.json()
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

// ── Validate a promo code against the discount_codes table ───────────────────
async function validatePromoCode(code, plan, serviceKey, supabaseUrl) {
  if (!code) return null

  var encoded = encodeURIComponent(code.toUpperCase().trim())
  var rows = await sbGet(
    '/discount_codes?code=eq.' + encoded + '&is_active=eq.true&select=*&limit=1',
    serviceKey, supabaseUrl
  )

  if (!rows || rows.length === 0) return { valid: false, reason: 'Code not found' }

  var dc = rows[0]

  // Check expiry
  if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
    return { valid: false, reason: 'Code has expired' }
  }

  // Check max uses
  if (dc.max_uses !== null && dc.uses_count >= dc.max_uses) {
    return { valid: false, reason: 'Code has reached its usage limit' }
  }

  // Check applicable plans
  if (dc.applicable_plans && !dc.applicable_plans.includes(plan)) {
    return { valid: false, reason: 'Code is not valid for this plan' }
  }

  return { valid: true, discount: dc }
}

// ── Record promo code use and increment counter ───────────────────────────────
async function recordPromoCodeUse(codeId, orgId, plan, interval, serviceKey, supabaseUrl) {
  // Insert into discount_code_uses
  await sbPost('/discount_code_uses', {
    code_id: codeId,
    org_id: orgId,
    plan: plan,
    interval: interval,
    used_at: new Date().toISOString(),
  }, serviceKey, supabaseUrl)

  // Increment uses_count via RPC (avoids race condition vs read-modify-write)
  // Falls back to a direct update if the RPC doesn't exist yet
  try {
    await fetch(supabaseUrl + '/rest/v1/rpc/increment_discount_code_uses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + serviceKey,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code_id: codeId }),
    })
  } catch (_) {
    // Fallback: direct increment via PATCH
    await fetch(supabaseUrl + '/rest/v1/discount_codes?id=eq.' + codeId, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + serviceKey,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uses_count: '(uses_count + 1)' }),
    })
  }
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
    var promo_code = body.promo_code || null  // optional

    if (!org_id || !plan || !interval) throw new Error('Missing fields')

    var memberships = await sbGet(
      '/memberships?organization_id=eq.' + org_id + '&member_id=eq.' + user.id + '&status=eq.active&select=role&limit=1',
      SB_KEY, SB_URL
    )
    var membership = memberships && memberships[0]
    if (!membership || !['admin','owner'].includes(membership.role)) throw new Error('Admin required')

    // ── Validate promo code if provided ──────────────────────────────────────
    var validatedCode = null
    if (promo_code) {
      var codeResult = await validatePromoCode(promo_code, plan, SB_KEY, SB_URL)
      if (!codeResult.valid) {
        return new Response(JSON.stringify({ error: codeResult.reason || 'Invalid promo code' }), {
          status: 400,
          headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
        })
      }
      validatedCode = codeResult.discount
    }

    var subs = await sbGet(
      '/subscriptions?organization_id=eq.' + org_id + '&select=stripe_customer_id&limit=1',
      SB_KEY, SB_URL
    )
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

    var successUrl = body.success_url || 'https://syndicade.org/organizations/' + org_id + '/billing?billing=success'
var cancelUrl  = body.cancel_url  || 'https://syndicade.org/organizations/' + org_id + '/billing?billing=cancelled'

    // ── Calculate trial days (promo code can extend trial) ───────────────────
    var trialDays = TRIAL_DAYS
    if (validatedCode && validatedCode.type === 'months_free') {
      // months_free codes extend the trial — convert months to days
      trialDays = Math.max(TRIAL_DAYS, Math.round(validatedCode.value * 30))
    }

    // ── Build Stripe session params ───────────────────────────────────────────
    var sessionParams = {
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': String(trialDays),
      'subscription_data[metadata][organization_id]': org_id,
      payment_method_collection: 'if_required',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'metadata[organization_id]': org_id,
    }

    // Add promo code metadata to Stripe session for reference
    if (validatedCode) {
      sessionParams['metadata[promo_code]'] = validatedCode.code
      sessionParams['metadata[promo_code_id]'] = validatedCode.id
    }

    var session = await stripePost('/checkout/sessions', sessionParams, STRIPE_KEY)

    // ── Save subscription record ──────────────────────────────────────────────
    await sbUpsert('/subscriptions', {
      organization_id: org_id,
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      plan: plan,
      billing_interval: interval,
      status: 'trialing',
      trial_ends_at: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, SB_KEY, SB_URL)

    // ── Record promo code use AFTER successful session creation ───────────────
    if (validatedCode) {
      try {
        await recordPromoCodeUse(validatedCode.id, org_id, plan, interval, SB_KEY, SB_URL)
      } catch (codeErr) {
        // Don't fail the checkout if code tracking fails — just log it
        console.error('Failed to record promo code use:', codeErr.message)
      }
    }

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