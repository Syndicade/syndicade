import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

interface Recipient { email: string; full_name: string }
interface AudienceConfig {
  type: string
  label?: string
  group_id?: string
  event_id?: string
  email?: string
  name?: string
}

function joinName(first: string | null, last: string | null): string {
  return ((first || '') + ' ' + (last || '')).trim()
}

async function resolveAudience(aud: AudienceConfig, org_id: string, supabase: any): Promise<Recipient[]> {
  // NOTE: `members` has first_name + last_name — there is no full_name column.
  if (aud.type === 'all_active') {
    var { data } = await supabase
      .from('memberships')
      .select('members!inner(email, first_name, last_name)')
      .eq('organization_id', org_id)
      .eq('status', 'active')
    return (data || []).map((m: any) => ({ email: m.members.email, full_name: joinName(m.members.first_name, m.members.last_name) }))

  } else if (aud.type === 'all_including_inactive') {
    var { data } = await supabase
      .from('memberships')
      .select('members!inner(email, first_name, last_name)')
      .eq('organization_id', org_id)
    return (data || []).map((m: any) => ({ email: m.members.email, full_name: joinName(m.members.first_name, m.members.last_name) }))

  } else if (aud.type === 'admins_only') {
    var { data } = await supabase
      .from('memberships')
      .select('members!inner(email, first_name, last_name)')
      .eq('organization_id', org_id)
      .eq('status', 'active')
      .eq('role', 'admin')
    return (data || []).map((m: any) => ({ email: m.members.email, full_name: joinName(m.members.first_name, m.members.last_name) }))

  } else if (aud.type === 'group' && aud.group_id) {
    // NOTE: Adjust table name if needed — uses org_group_members joined to members
    var { data } = await supabase
      .from('org_group_members')
      .select('member_id, members!inner(email, first_name, last_name)')
      .eq('group_id', aud.group_id)
    return (data || []).map((m: any) => ({ email: m.members.email, full_name: joinName(m.members.first_name, m.members.last_name) }))

  } else if (aud.type === 'event' && aud.event_id) {
    var allRecs: Recipient[] = []

    // Paid ticket holders — get user_ids then fetch member info
    var { data: tickets } = await supabase
      .from('ticket_purchases')
      .select('user_id')
      .eq('event_id', aud.event_id)

    if (tickets && tickets.length > 0) {
      var userIds = (tickets as any[]).map(t => t.user_id).filter(Boolean)
      if (userIds.length > 0) {
        var { data: memberData } = await supabase
          .from('members')
          .select('email, first_name, last_name')
          .in('user_id', userIds)
        allRecs.push(...(memberData || []).map((m: any) => ({ email: m.email, full_name: joinName(m.first_name, m.last_name) })))
      }
    }

    // Guest RSVPs (non-members with direct email)
    var { data: guests } = await supabase
      .from('guest_rsvps')
      .select('email, name')
      .eq('event_id', aud.event_id)
    allRecs.push(...(guests || []).filter((g: any) => g.email).map((g: any) => ({ email: g.email, full_name: g.name || '' })))

    return allRecs

  } else if (aud.type === 'individual' && aud.email) {
    return [{ email: aud.email, full_name: aud.name || '' }]
  }

  return []
}

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
    var { org_id, subject, html_body, audience, audiences, template_name, attachments } = body

    if (!org_id || !subject || !html_body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
    }

    // Validate attachments
    var safeAttachments: any[] = []
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

    var { data: org } = await supabase
      .from('organizations')
      .select('name, logo_url, slug, contact_email')
      .eq('id', org_id)
      .single()

    // Resolve recipients from new audiences array or legacy audience string
    var allRecipients: Recipient[] = []
    var audienceLabel = ''

    if (Array.isArray(audiences) && audiences.length > 0) {
      for (var aud of audiences as AudienceConfig[]) {
        var recs = await resolveAudience(aud, org_id, supabase)
        allRecipients.push(...recs)
      }
      audienceLabel = (audiences as AudienceConfig[]).map(a => a.label || a.type).join(', ')
    } else if (audience) {
      // Legacy single audience string (backward compat)
      var legacyType = audience === 'admins_only' ? 'admins_only' : 'all_active'
      var recs = await resolveAudience({ type: legacyType }, org_id, supabase)
      allRecipients.push(...recs)
      audienceLabel = audience === 'admins_only' ? 'Admins Only' : 'All Active Members'
    } else {
      return new Response(JSON.stringify({ error: 'No audience specified' }), { status: 400, headers: corsHeaders })
    }

    // De-duplicate by email
    var seen = new Set<string>()
    var recipients = allRecipients.filter(r => {
      if (!r.email) return false
      var key = r.email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients found' }), { status: 400, headers: corsHeaders })
    }

    // Create the blast record FIRST so we have a real blast_id to attach
    // per-recipient rows to as we send (needed for analytics tracking).
    var { data: blastRow, error: blastInsertError } = await supabase
      .from('email_blasts')
      .insert({
        org_id: org_id,
        subject: subject,
        body: html_body,
        template_name: template_name || null,
        audience: audienceLabel,
        recipient_count: 0,
        sent_by: user.id,
        status: 'sending'
      })
      .select()
      .single()

    if (blastInsertError || !blastRow) {
      return new Response(JSON.stringify({ error: 'Failed to create email blast record' }), { status: 500, headers: corsHeaders })
    }

    var blastId = blastRow.id

    var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    var FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>'
    var sentCount = 0
    var errors: any[] = []
    var recipientRows: any[] = []

    for (var recipient of recipients) {
      var nameParts = (recipient.full_name || '').trim().split(' ')
      var firstName = nameParts[0] || ''
      var lastName = nameParts.slice(1).join(' ') || ''

      var personalizedBody = html_body
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{last_name\}\}/g, lastName)

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
                    ${org?.logo_url ? `<img src="${org.logo_url}" alt="${org?.name || ''} logo" style="height:48px;border-radius:50%;margin-bottom:8px;" /><br/>` : ''}
                    <span style="font-size:20px;font-weight:800;color:#ffffff;">${org?.name || 'Your Organization'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <div style="font-size:15px;color:#374151;line-height:1.7;">${personalizedBody}</div>
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

      var resendBody: any = {
        from: FROM_ADDRESS,
        to: recipient.email,
        subject: subject,
        html: emailHtml,
        reply_to: org?.contact_email || undefined
      }

      if (safeAttachments.length > 0) {
        resendBody.attachments = safeAttachments.map((a: any) => ({ filename: a.filename, content: a.content }))
      }

      var res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(resendBody)
      })

      if (res.ok) {
        var resendData = await res.json()
        sentCount++
        recipientRows.push({
          blast_id: blastId,
          org_id: org_id,
          email: recipient.email,
          name: recipient.full_name || null,
          resend_email_id: resendData?.id || null,
          sent_at: new Date().toISOString()
        })
      } else {
        var errBody = await res.json()
        errors.push({ email: recipient.email, error: errBody.message })
      }
    }

    // Write per-recipient rows in one batch so EmailAnalyticsModal has data to read.
    if (recipientRows.length > 0) {
      var { error: recipientsInsertError } = await supabase.from('email_recipients').insert(recipientRows)
      if (recipientsInsertError) {
        errors.push({ email: null, error: 'Failed to save recipient tracking rows: ' + recipientsInsertError.message })
      }
    }

    await supabase
      .from('email_blasts')
      .update({
        recipient_count: sentCount,
        status: sentCount > 0 ? 'sent' : 'failed'
      })
      .eq('id', blastId)

    return new Response(JSON.stringify({
      success: true,
      sent_count: sentCount,
      total_recipients: recipients.length,
      errors: errors
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})