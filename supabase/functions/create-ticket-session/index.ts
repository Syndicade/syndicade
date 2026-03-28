import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var body = await req.json()
    var { event_id, member_id, member_email, selections, success_url, cancel_url } = body
    // selections = [{ ticket_type_id, quantity }]

    var stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY')

var supabaseUrl = Deno.env.get('SUPABASE_URL')
    var supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    var supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    // Use service role if available, fall back to anon
    var supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

    // Fetch event
    var { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, is_paid')
      .eq('id', event_id)
      .single()

    if (eventError || !event) throw new Error('Event not found: ' + (eventError ? eventError.message : 'no data') + ' | event_id=' + event_id)
    if (!event.is_paid) throw new Error('Event is not a paid event')

    // Fetch ticket types for this event
    var { data: ticketTypes, error: ttError } = await supabase
      .from('event_ticket_types')
      .select('*')
      .eq('event_id', event_id)

    if (ttError || !ticketTypes) throw new Error('Could not load ticket types: ' + (ttError ? ttError.message : 'no data'))

    // Build a map for quick lookup
    var ttMap = {}
    ticketTypes.forEach(function(tt) { ttMap[tt.id] = tt })

    // Validate selections and build line items
    var params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('customer_email', member_email || '')
    params.append('success_url', success_url)
    params.append('cancel_url', cancel_url)
    params.append('metadata[event_id]', event_id)
    params.append('metadata[member_id]', member_id)
    params.append('metadata[type]', 'event_ticket')

    var lineIndex = 0
    for (var i = 0; i < selections.length; i++) {
      var sel = selections[i]
      var tt = ttMap[sel.ticket_type_id]
      if (!tt) throw new Error('Ticket type not found: ' + sel.ticket_type_id)
      if (sel.quantity < 1) continue

      // Check quantity available
      if (tt.quantity_available != null) {
        var remaining = tt.quantity_available - (tt.quantity_sold || 0)
        if (sel.quantity > remaining) {
          throw new Error('Not enough tickets available for: ' + tt.name)
        }
      }

      // Determine price — early bird if active
      var now = new Date()
      var useEarlyBird = tt.early_bird_price != null &&
        tt.early_bird_ends_at != null &&
        new Date(tt.early_bird_ends_at) > now

      var unitPrice = useEarlyBird ? tt.early_bird_price : tt.price
      var amountCents = Math.round(parseFloat(unitPrice) * 100)

      var productName = tt.name + ' — ' + event.title
      if (useEarlyBird) productName = productName + ' (Early Bird)'

      params.append('line_items[' + lineIndex + '][quantity]', String(sel.quantity))
      params.append('line_items[' + lineIndex + '][price_data][currency]', 'usd')
      params.append('line_items[' + lineIndex + '][price_data][unit_amount]', String(amountCents))
      params.append('line_items[' + lineIndex + '][price_data][product_data][name]', productName)
      params.append('metadata[tt_' + lineIndex + ']', tt.id + ':' + sel.quantity)

      lineIndex++
    }

    if (lineIndex === 0) throw new Error('No tickets selected')

    var stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + stripeKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    var session = await stripeRes.json()
    if (!stripeRes.ok) throw new Error(session.error?.message || 'Stripe error')

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})