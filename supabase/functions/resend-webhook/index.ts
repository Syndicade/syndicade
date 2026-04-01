import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

// Maps Resend event types to our internal event_type values
var EVENT_TYPE_MAP = {
  'email.sent':             'sent',
  'email.delivered':        'delivered',
  'email.delivery_delayed': 'delayed',
  'email.bounced':          'bounced',
  'email.complained':       'complained',
  'email.opened':           'opened',
  'email.clicked':          'clicked',
  'email.unsubscribed':     'unsubscribed'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the webhook payload from Resend
    var payload = await req.json()

    // Resend webhook payload shape:
    // {
    //   type: 'email.opened',
    //   created_at: '2024-...',
    //   data: {
    //     email_id: 'resend_email_id',
    //     from: '...',
    //     to: ['recipient@example.com'],
    //     subject: '...',
    //     click?: { link: '...' }
    //   }
    // }

    var eventType = payload.type
    var data = payload.data

    if (!eventType || !data || !data.email_id) {
      // Not a recognized event shape — return 200 to prevent Resend retries
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    var resendEmailId = data.email_id
    var internalType = EVENT_TYPE_MAP[eventType] || eventType
    var recipientEmail = Array.isArray(data.to) ? data.to[0] : (data.to || null)

    // Look up the recipient record to get blast_id and org_id
    var { data: recipientRecord } = await supabase
      .from('email_recipients')
      .select('blast_id, org_id, email')
      .eq('resend_email_id', resendEmailId)
      .maybeSingle()

    var blastId = recipientRecord ? recipientRecord.blast_id : null
    var orgId = recipientRecord ? recipientRecord.org_id : null

    // Build metadata — capture click URLs, bounce reasons, etc.
    var metadata = {}
    if (data.click && data.click.link) {
      metadata.link = data.click.link
    }
    if (data.bounce && data.bounce.type) {
      metadata.bounce_type = data.bounce.type
      metadata.bounce_message = data.bounce.message || null
    }
    if (data.complaint && data.complaint.type) {
      metadata.complaint_type = data.complaint.type
    }

    // Insert the event
    var { error: insertError } = await supabase.from('email_events').insert({
      resend_email_id: resendEmailId,
      blast_id: blastId,
      org_id: orgId,
      recipient_email: recipientEmail || (recipientRecord ? recipientRecord.email : null),
      event_type: internalType,
      occurred_at: payload.created_at || new Date().toISOString(),
      metadata: metadata
    })

    if (insertError) {
      console.error('Failed to insert email event:', insertError.message)
      // Still return 200 — we don't want Resend to retry endlessly
    }

    return new Response(JSON.stringify({ received: true, event: internalType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Webhook error:', err.message)
    // Return 200 even on error — Resend will retry on non-2xx
    return new Response(JSON.stringify({ received: true, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})