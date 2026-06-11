var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

var PRICE_IDS = {
  listed_month: 'price_1TbJvlKMpHjSZayWgtSa1gIH',
  listed_year:  'price_1TbJwAKMpHjSZayWQ2REzDyi',
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

async function sbPatch(path, data, serviceKey, supabaseUrl) {
  var res = await fetch(supabaseUrl + '/rest/v1' + path, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + serviceKey,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return res
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

  if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
    return { valid: false, reason: 'Code has expired' }
  }

  if (dc.max_uses !== null && dc.uses_count >= dc.max_uses) {
    return { valid: false, reason: 'Code has reached its usage limit' }
  }

  if (dc.applicable_plans && !dc.applicable_plans.includes(plan)) {
    return { valid: false, reason: 'Code is not valid for this plan' }
  }

  return { valid: true, discount: dc }
}

// ── Record promo code use and increment counter ───────────────────────────────
async function recordPromoCodeUse(codeId, orgId, plan, interval, serviceKey, supabaseUrl) {
  await sbPost('/discount_code_uses', {
    code_id: codeId,
    org_id: orgId,
    plan: plan,
    interval: interval,
    used_at: new Date().toISOString(),
  }, serviceKey, supabaseUrl)

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

    // ── PROGRAM PAYMENT BRANCH ────────────────────────────────────────────────
    // Triggered when body.type === 'program'
    if (body.type === 'program') {
      var programId    = body.program_id
      var orgId        = body.organization_id
      var successUrl   = body.success_url
      var cancelUrl    = body.cancel_url

      if (!programId || !orgId) throw new Error('Missing program_id or organization_id')

      // Fetch program details
      var programs = await sbGet(
        '/org_programs?id=eq.' + programId + '&select=id,name,cost_amount,cost_type,organization_id&limit=1',
        SB_KEY, SB_URL
      )
      var program = programs && programs[0]
      if (!program) throw new Error('Program not found')
      if (program.organization_id !== orgId) throw new Error('Program does not belong to this organization')
      if (program.cost_type !== 'paid') throw new Error('Program is not a paid program')
      if (!program.cost_amount || parseFloat(program.cost_amount) <= 0) throw new Error('Invalid program price')

      // Fetch org's connected Stripe account
      var orgs = await sbGet(
        '/organizations?id=eq.' + orgId + '&select=name,stripe_connect_account_id,stripe_connect_status&limit=1',
        SB_KEY, SB_URL
      )
      var org = orgs && orgs[0]
      if (!org) throw new Error('Organization not found')
      if (!org.stripe_connect_account_id || org.stripe_connect_status !== 'active') {
        throw new Error('Organization does not have an active Stripe Connect account')
      }

      var amountCents = Math.round(parseFloat(program.cost_amount) * 100)
      // $1.00 platform fee in cents
      var platformFeeCents = 100

      var defaultSuccess = successUrl || ('https://syndicade.org/organizations/' + orgId + '/programs/' + programId + '?payment=success')
      var defaultCancel  = cancelUrl  || ('https://syndicade.org/organizations/' + orgId + '/programs/' + programId + '?payment=cancelled')

      var sessionParams = {
        mode: 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': program.name,
        'line_items[0][price_data][unit_amount]': String(amountCents),
        'line_items[0][quantity]': '1',
        'payment_intent_data[application_fee_amount]': String(platformFeeCents),
        'payment_intent_data[transfer_data][destination]': org.stripe_connect_account_id,
        'payment_intent_data[metadata][type]': 'program',
        'payment_intent_data[metadata][program_id]': programId,
        'payment_intent_data[metadata][organization_id]': orgId,
        'payment_intent_data[metadata][user_id]': user.id,
        success_url: defaultSuccess + (defaultSuccess.includes('?') ? '&' : '?') + 'session_id={CHECKOUT_SESSION_ID}',
        cancel_url: defaultCancel,
        'metadata[type]': 'program',
        'metadata[program_id]': programId,
        'metadata[organization_id]': orgId,
        'metadata[user_id]': user.id,
      }

      var stripeSession = await stripePost('/checkout/sessions', sessionParams, STRIPE_KEY)

      // Insert registration row with payment_status = 'pending'
      // Use upsert to handle duplicate gracefully
      await fetch(SB_URL + '/rest/v1/program_registrations', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + SB_KEY,
          'apikey': SB_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          program_id: programId,
          user_id: user.id,
          organization_id: orgId,
          status: 'pending',
          payment_status: 'pending',
          payment_intent_id: stripeSession.payment_intent || null,
          updated_at: new Date().toISOString(),
        }),
      })

      return new Response(JSON.stringify({ url: stripeSession.url }), {
        headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
      })
    }

    // ── SUBSCRIPTION / PLAN BRANCH (existing logic unchanged) ────────────────
    var org_id = body.organization_id
    var plan = body.plan
    var interval = body.interval
    var promo_code = body.promo_code || null

    if (!org_id || !plan || !interval) throw new Error('Missing fields')

    var memberships = await sbGet(
      '/memberships?organization_id=eq.' + org_id + '&member_id=eq.' + user.id + '&status=eq.active&select=role&limit=1',
      SB_KEY, SB_URL
    )
    var membership = memberships && memberships[0]
    if (!membership || !['admin','owner'].includes(membership.role)) throw new Error('Admin required')

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
      var subOrgs = await sbGet('/organizations?id=eq.' + org_id + '&select=name&limit=1', SB_KEY, SB_URL)
      var members = await sbGet('/members?user_id=eq.' + user.id + '&select=email&limit=1', SB_KEY, SB_URL)
      var customer = await stripePost('/customers', {
        email: (members && members[0] && members[0].email) || '',
        name: (subOrgs && subOrgs[0] && subOrgs[0].name) || '',
        'metadata[organization_id]': org_id,
      }, STRIPE_KEY)
      customerId = customer.id
    }

    if (plan === 'student' && interval === 'year') throw new Error('Student plan is monthly only')

    var priceId = PRICE_IDS[plan + '_' + interval]
    if (!priceId) throw new Error('Invalid plan or interval')

    var defaultSuccess2 = plan === 'listed'
      ? 'https://syndicade.org/organizations/' + org_id + '/listing?billing=success'
      : 'https://syndicade.org/organizations/' + org_id + '/billing?billing=success'
    var defaultCancel2 = plan === 'listed'
      ? 'https://syndicade.org/organizations/' + org_id + '/listing?billing=cancelled'
      : 'https://syndicade.org/organizations/' + org_id + '/billing?billing=cancelled'

    var successUrl2 = body.success_url || defaultSuccess2
    var cancelUrl2  = body.cancel_url  || defaultCancel2

    var trialDays = TRIAL_DAYS
    if (validatedCode && validatedCode.type === 'months_free') {
      trialDays = Math.max(TRIAL_DAYS, Math.round(validatedCode.value * 30))
    }

    var sessionParams2 = {
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': String(trialDays),
      'subscription_data[metadata][organization_id]': org_id,
      payment_method_collection: 'if_required',
      success_url: successUrl2,
      cancel_url: cancelUrl2,
      'metadata[organization_id]': org_id,
    }

    if (validatedCode && (validatedCode.type === 'percent_off' || validatedCode.type === 'flat_off')) {
      if (validatedCode.stripe_coupon_id) {
        sessionParams2['discounts[0][coupon]'] = validatedCode.stripe_coupon_id
      } else {
        console.warn('Promo code ' + validatedCode.code + ' has no stripe_coupon_id — discount not applied in Stripe')
      }
    }

    if (validatedCode) {
      sessionParams2['metadata[promo_code]'] = validatedCode.code
      sessionParams2['metadata[promo_code_id]'] = validatedCode.id
    }

    var session = await stripePost('/checkout/sessions', sessionParams2, STRIPE_KEY)

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

    if (validatedCode) {
      try {
        await recordPromoCodeUse(validatedCode.id, org_id, plan, interval, SB_KEY, SB_URL)
      } catch (codeErr) {
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