import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
const FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
var bodyText = await req.text();
var parsedBody = JSON.parse(bodyText);

// Contact form shortcut — anonymous, no org_id, internal recipient only
if (parsedBody.type === 'contact_form') {
  var RESEND_API_KEY_CF = Deno.env.get('RESEND_API_KEY');
  var cfRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY_CF, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to: 'hello@syndicade.org', subject: parsedBody.subject, html: parsedBody.html })
  });
  return new Response(JSON.stringify({ success: cfRes.ok }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

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

var body = parsedBody

    // ── Dues payment link shortcut ─────────────────────────────────────────
    if (body.type === 'dues_payment_link') {
      var RESEND_KEY_DPL = Deno.env.get('RESEND_API_KEY');
      var dplHtml =
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
        '<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">' +
        '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">' +
        '<tr><td style="background:#0E1523;padding:24px 32px;text-align:center;">' +
        '<span style="font-size:20px;font-weight:800;color:#ffffff;">' + (body.data.orgName || 'Your Organization') + '</span>' +
        '</td></tr>' +
        '<tr><td style="padding:32px;">' +
        '<p style="font-size:16px;font-weight:700;color:#111827;margin:0 0 8px;">Dues Payment Request</p>' +
        '<p style="font-size:15px;color:#374151;margin:0 0 16px;">Hi ' + (body.data.memberName || 'there') + ',</p>' +
        '<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">' +
        (body.data.orgName || 'Your organization') + ' has sent you a dues payment request' +
        (body.data.amount ? ' for <strong>$' + Number(body.data.amount).toFixed(2) + '</strong>' : '') + '.' +
        '</p>' +
        '<table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;"><tr><td style="background:#3B82F6;border-radius:8px;">' +
        '<a href="' + body.data.paymentUrl + '" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Pay Dues Now</a>' +
        '</td></tr></table>' +
        '<p style="font-size:12px;color:#9ca3af;margin:0;">If you have questions, contact your organization admin.</p>' +
        '</td></tr>' +
        '<tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">' +
        '<p style="font-size:12px;color:#9ca3af;margin:0;">Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#374151;font-weight:700;">cade</span></p>' +
        '</td></tr></table></td></tr></table></body></html>';
      var dplRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_KEY_DPL, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: body.data.memberEmail,
          subject: 'Dues payment request from ' + (body.data.orgName || 'your organization'),
          html: dplHtml,
        }),
      });
      return new Response(JSON.stringify({ success: dplRes.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    var { org_id, subject, html_body, audience, template_name, attachments, test_email } = body

    if (!org_id || !subject || !html_body || !audience) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
    }

    var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // ── Test email ────────────────────────────────────────────────────────────
    if (audience === 'test' && test_email) {
      var testBannerHtml =
        '<tr><td style="background:#F5B731;padding:10px 24px;font-size:12px;font-weight:700;color:#111827;text-align:center;letter-spacing:1px;">' +
        'TEST EMAIL — Not sent to members' +
        '</td></tr>'

      var testFullHtml =
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<style>body{margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;}</style></head>' +
        '<body><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">' +
        '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">' +
        testBannerHtml +
        '<tr><td style="padding:32px;font-size:15px;color:#374151;line-height:1.7;">' + html_body + '</td></tr>' +
        '<tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">' +
        'Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#6b7280;font-weight:700;">cade</span>' +
        '</td></tr>' +
        '</table></td></tr></table></body></html>'

      var testRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_ADDRESS, to: test_email, subject: subject, html: testFullHtml })
      })

      var testOk = testRes.ok
      return new Response(
        JSON.stringify({ success: testOk, sent_count: testOk ? 1 : 0, test: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Validate attachments ──────────────────────────────────────────────────
    var safeAttachments = []
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (var att of attachments) {
        if (!att.filename || !att.content || !att.type) continue
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

    // ── Verify sender is admin ────────────────────────────────────────────────
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

    // ── Get org info ──────────────────────────────────────────────────────────
    var { data: org } = await supabase
      .from('organizations')
      .select('name, logo_url, slug, contact_email')
      .eq('id', org_id)
      .single()

    // ── Get recipients ────────────────────────────────────────────────────────
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

    // ── Create blast record first to get blast_id ─────────────────────────────
    var { data: blastRecord, error: blastInsertError } = await supabase
      .from('email_blasts')
      .insert({
        org_id: org_id,
        subject: subject,
        body: html_body,
        template_name: template_name || null,
        audience: audience,
        recipient_count: 0,
        sent_by: user.id,
        status: 'sending'
      })
      .select('id')
      .single()

    if (blastInsertError || !blastRecord) {
      return new Response(JSON.stringify({ error: 'Failed to create blast record' }), { status: 500, headers: corsHeaders })
    }

    var blastId = blastRecord.id

    // ── Send emails and collect Resend email IDs ──────────────────────────────
    var sentCount = 0
    var errors = []
    var recipientRecords = []

    for (var recipient of recipients) {
      var emailHtml =
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
        '<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">' +
        '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">' +
        '<tr><td style="background:#0E1523;padding:24px 32px;text-align:center;">' +
        (org && org.logo_url ? '<img src="' + org.logo_url + '" alt="' + (org.name || '') + ' logo" style="height:48px;border-radius:50%;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" />' : '') +
        '<span style="font-size:20px;font-weight:800;color:#ffffff;">' + (org ? org.name : 'Your Organization') + '</span>' +
        '</td></tr>' +
        '<tr><td style="padding:32px;">' +
        (recipient.name ? '<p style="font-size:15px;color:#374151;margin:0 0 16px;">Hi ' + recipient.name + ',</p>' : '') +
        '<div style="font-size:15px;color:#374151;line-height:1.7;">' + html_body + '</div>' +
        '</td></tr>' +
        '<tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">' +
        '<p style="font-size:12px;color:#9ca3af;margin:0;">You received this email as a member of <strong>' + (org ? org.name : 'your organization') + '</strong>.<br/>' +
        'Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#374151;font-weight:700;">cade</span></p>' +
        '</td></tr>' +
        '</table></td></tr></table></body></html>'

      var resendBody = {
        from: FROM_ADDRESS,
        to: recipient.email,
        subject: subject,
        html: emailHtml,
        reply_to: (org && org.contact_email) ? org.contact_email : undefined
      }

      if (safeAttachments.length > 0) {
        resendBody.attachments = safeAttachments.map(function(a) {
          return { filename: a.filename, content: a.content }
        })
      }

      var res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(resendBody)
      })

      if (res.ok) {
        var resData = await res.json()
        sentCount++
        recipientRecords.push({
          blast_id: blastId,
          org_id: org_id,
          email: recipient.email,
          name: recipient.name || null,
          resend_email_id: resData.id || null,
          sent_at: new Date().toISOString()
        })
      } else {
        var errBody = await res.json()
        errors.push({ email: recipient.email, error: errBody.message })
      }
    }

    // ── Store recipient records for analytics ─────────────────────────────────
    if (recipientRecords.length > 0) {
      await supabase.from('email_recipients').insert(recipientRecords)
    }

    // ── Update blast with final count ─────────────────────────────────────────
    await supabase
      .from('email_blasts')
      .update({ recipient_count: sentCount, status: sentCount > 0 ? 'sent' : 'failed' })
      .eq('id', blastId)

    return new Response(JSON.stringify({
      success: true,
      sent_count: sentCount,
      total_recipients: recipients.length,
      blast_id: blastId,
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