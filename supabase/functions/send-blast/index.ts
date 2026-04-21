import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024 // 5MB per file

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders })
    }

    var supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    var userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    var { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    var body = await req.json()
    var { org_id, subject, html_body, audience, template_name, attachments } = body

    if (!org_id || !subject || !html_body || !audience) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
    }

    // Validate attachments
    // attachments: Array<{ filename: string, content: string (base64), type: string }>
    var safeAttachments = []
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (var att of attachments) {
        if (!att.filename || !att.content || !att.type) continue
        // Check size — base64 is ~4/3 of binary size
        var approxBytes = Math.ceil(att.content.length * 0.75)
        if (approxBytes > MAX_ATTACHMENT_BYTES) {
          return new Response(
            JSON.stringify({ error: 'Attachment "' + att.filename + '" exceeds the 5MB limit.' }),
            { status: 400, headers: corsHeaders }
          )
        }
        safeAttachments.push({ filename: att.filename, content: att.content, type: att.type })
      }
    }

    // Verify sender is admin
    var { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('role')
      .eq('organization_id', org_id)
      .eq('member_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership || membership.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    // Get org info
    var { data: org } = await supabase
      .from('organizations')
      .select('name, logo_url, slug, contact_email')
      .eq('id', org_id)
      .single()

    // Get recipients based on audience
    var membersQuery = supabase
      .from('memberships')
      .select('member_id, members!inner(email, full_name)')
      .eq('organization_id', org_id)
      .eq('status', 'active')

    if (audience === 'admins_only') {
      membersQuery = membersQuery.eq('role', 'admin')
    }

    var { data: memberships, error: membersError } = await membersQuery

    if (membersError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch members' }), { status: 500, headers: corsHeaders })
    }

    var recipients = (memberships || []).map(function(m) {
      return { email: m.members.email, name: m.members.full_name || '' }
    }).filter(function(r) { return !!r.email })

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients found' }), { status: 400, headers: corsHeaders })
    }

    var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    var FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>'

    var sentCount = 0
    var errors = []

    for (var recipient of recipients) {
      var emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Inter',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
                <tr>
                  <td style="background:#0E1523;padding:24px 32px;text-align:center;">
                    ${org?.logo_url
                      ? `<img src="${org.logo_url}" alt="${org?.name || ''} logo" style="height:48px;border-radius:50%;margin-bottom:8px;" /><br/>`
                      : ''
                    }
                    <span style="font-size:20px;font-weight:800;color:#ffffff;">${org?.name || 'Your Organization'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    ${recipient.name ? `<p style="font-size:15px;color:#374151;margin:0 0 16px;">Hi ${recipient.name},</p>` : ''}
                    <div style="font-size:15px;color:#374151;line-height:1.7;">${html_body}</div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="font-size:12px;color:#9ca3af;margin:0;">
                      You received this email as a member of <strong>${org?.name || 'your organization'}</strong>.<br/>
                      Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#374151;font-weight:700;">cade</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `

      var resendBody = {
        from: FROM_ADDRESS,
        to: recipient.email,
        subject: subject,
        html: emailHtml,
        reply_to: org?.contact_email || undefined
      }

      // Attach files if present
      if (safeAttachments.length > 0) {
        resendBody.attachments = safeAttachments.map(function(a) {
          return { filename: a.filename, content: a.content }
        })
      }

      var res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resendBody)
      })

      if (res.ok) {
        sentCount++
      } else {
        var errBody = await res.json()
        errors.push({ email: recipient.email, error: errBody.message })
      }
    }

    // Log the blast
    await supabase.from('email_blasts').insert({
      org_id: org_id,
      subject: subject,
      body: html_body,
      template_name: template_name || null,
      audience: audience,
      recipient_count: sentCount,
      sent_by: user.id,
      status: sentCount > 0 ? 'sent' : 'failed'
    })

    return new Response(JSON.stringify({
      success: true,
      sent_count: sentCount,
      total_recipients: recipients.length,
      errors: errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})