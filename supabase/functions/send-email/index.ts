import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
var FROM_ADDRESS = 'onboarding@resend.dev'

async function sendEmail(to: string, subject: string, html: string) {
  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  })
  return res.json()
}

function baseTemplate(content: string, orgName?: string, orgLogoUrl?: string, orgUrl?: string) {
  var orgLink = orgUrl || 'https://syndicade-git-main-syndicades-projects.vercel.app'
  var orgDisplay = orgName || 'Syndicade'

  var headerContent = orgLogoUrl
    ? `<table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle" style="padding-right:12px;">
            <a href="${orgLink}" style="text-decoration:none;">
              <img src="${orgLogoUrl}" alt="${orgDisplay}" width="48" height="48" style="border-radius:8px;display:block;object-fit:contain;"/>
            </a>
          </td>
          <td valign="middle">
            <a href="${orgLink}" style="text-decoration:none;">
              <span style="font-size:18px;font-weight:800;color:#FFFFFF;">${orgDisplay}</span>
            </a>
          </td>
        </tr>
      </table>`
    : `<a href="${orgLink}" style="text-decoration:none;">
        <span style="font-size:22px;font-weight:800;color:#FFFFFF;">${orgDisplay}</span>
      </a>`

  return `
    <div style="background:#0E1523;min-height:100vh;padding:40px 0;font-family:'Inter',system-ui,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#1A2035;border-radius:16px;overflow:hidden;border:1px solid #2A3550;">

        <!-- Org header -->
        <div style="background:#151B2D;padding:24px 32px;border-bottom:1px solid #2A3550;">
          ${headerContent}
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          ${content}
        </div>

        <!-- Syndicade footer -->
        <div style="padding:16px 32px;border-top:1px solid #2A3550;text-align:center;">
          <p style="color:#64748B;font-size:12px;margin:0 0 4px;">Powered by</p>
          <a href="https://syndicade-git-main-syndicades-projects.vercel.app" style="text-decoration:none;">
            <span style="font-size:15px;font-weight:800;color:#FFFFFF;">Syndi</span><span style="font-size:15px;font-weight:800;color:#F5B731;">cade</span>
          </a>
          <p style="color:#64748B;font-size:11px;margin:4px 0 0;">Where Community Work Connects</p>
        </div>
      </div>
    </div>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    var body = await req.json()
    var { type, data } = body
    var result

    // ── Contact Inquiry ──────────────────────────────────────────────────
    if (type === 'contact_inquiry') {
      var html = baseTemplate(`
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">New Contact Inquiry</h2>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">Someone submitted a message through your organization's public page.</p>
        <div style="background:#0E1523;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 8px;">From</p>
          <p style="color:#fff;font-size:15px;font-weight:600;margin:0;">${data.senderName || 'Unknown'}</p>
          <p style="color:#94A3B8;font-size:13px;margin:4px 0 0;">${data.senderEmail || ''}</p>
        </div>
        <div style="background:#0E1523;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 8px;">Message</p>
          <p style="color:#CBD5E1;font-size:14px;line-height:1.6;margin:0;">${data.message || ''}</p>
        </div>
        <a href="mailto:${data.senderEmail}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Reply to ${data.senderName || 'Sender'}</a>
      `, data.orgName, data.orgLogoUrl, data.orgUrl)
      result = await sendEmail(data.adminEmail, 'New message from ' + (data.senderName || 'a visitor') + ' — ' + (data.orgName || 'Syndicade'), html)
    }

    // ── RSVP Confirmation ────────────────────────────────────────────────
    else if (type === 'rsvp_confirmation') {
      var calGoogle = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(data.eventTitle) + '&dates=' + (data.startISO || '').replace(/[-:]/g,'').replace('.000','') + '/' + (data.endISO || '').replace(/[-:]/g,'').replace('.000','') + '&details=' + encodeURIComponent('RSVP confirmed via Syndicade') + '&location=' + encodeURIComponent(data.eventLocation || '')
      var icsUrl = 'https://zktmhqrygknkodydbumq.supabase.co/functions/v1/event-ics?event_id=' + (data.eventId || '')
      var html = baseTemplate(`
        <div style="background:#1B3A2F;border:1px solid #22C55E;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <p style="color:#22C55E;font-weight:700;font-size:15px;margin:0;">You're going!</p>
        </div>
        <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 4px;">${data.eventTitle || ''}</h2>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">${data.orgName || ''}</p>
        <div style="background:#0E1523;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;">Event Details</p>
          <p style="color:#CBD5E1;font-size:14px;margin:0 0 6px;"><strong style="color:#fff;">Date & Time:</strong> ${data.eventDate || ''}</p>
          <p style="color:#CBD5E1;font-size:14px;margin:0;"><strong style="color:#fff;">Location:</strong> ${data.eventLocation || ''}</p>
        </div>
        <div style="margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;">Add to Calendar</p>
          <a href="${calGoogle}" style="display:inline-block;background:#0E1523;border:1px solid #2A3550;color:#CBD5E1;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;margin-right:8px;margin-bottom:8px;">Google Calendar</a>
          <a href="${icsUrl}" style="display:inline-block;background:#0E1523;border:1px solid #2A3550;color:#CBD5E1;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;margin-right:8px;margin-bottom:8px;">Apple Calendar</a>
          <a href="${icsUrl}" style="display:inline-block;background:#0E1523;border:1px solid #2A3550;color:#CBD5E1;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;margin-bottom:8px;">Outlook</a>
        </div>
        <a href="${data.eventUrl || ''}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">View Event Details</a>
      `, data.orgName, data.orgLogoUrl, data.orgUrl)
      result = await sendEmail(data.memberEmail, 'You\'re going to ' + (data.eventTitle || 'the event') + '!', html)
    }

    // ── Ticket Confirmation ──────────────────────────────────────────────
    else if (type === 'ticket_confirmation') {
      var lineItemsHtml = (data.lineItems || []).map(function(item: any) {
        return `
          <tr>
            <td style="color:#CBD5E1;font-size:14px;padding:10px 0;border-bottom:1px solid #2A3550;">${item.name}</td>
            <td style="color:#CBD5E1;font-size:14px;padding:10px 0;border-bottom:1px solid #2A3550;text-align:center;">${item.quantity}</td>
            <td style="color:#CBD5E1;font-size:14px;padding:10px 0;border-bottom:1px solid #2A3550;text-align:right;">$${parseFloat(item.unit_price).toFixed(2)}</td>
            <td style="color:#fff;font-size:14px;font-weight:700;padding:10px 0;border-bottom:1px solid #2A3550;text-align:right;">$${parseFloat(item.total_amount).toFixed(2)}</td>
          </tr>
        `
      }).join('')

      var checkInPayload = JSON.stringify({ event_id: data.eventId, member_id: data.memberId })
      var checkInEncoded = encodeURIComponent(checkInPayload)
      var shortCode = data.eventId ? data.eventId.substring(0, 8).toUpperCase() : ''

      var calGoogle2 = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(data.eventTitle || '') + '&dates=' + (data.startISO || '').replace(/[-:]/g,'').replace('.000','') + '/' + (data.endISO || '').replace(/[-:]/g,'').replace('.000','') + '&location=' + encodeURIComponent(data.eventLocation || '')
      var icsUrl2 = 'https://zktmhqrygknkodydbumq.supabase.co/functions/v1/event-ics?event_id=' + (data.eventId || '')

      var html = baseTemplate(`
        <div style="background:#2A1F00;border:1px solid #F5B731;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <p style="color:#F5B731;font-weight:700;font-size:15px;margin:0;">Ticket Confirmed</p>
          <p style="color:#94A3B8;font-size:13px;margin:4px 0 0;">Payment processed successfully via Stripe.</p>
        </div>
        <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 4px;">${data.eventTitle || ''}</h2>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">${data.orgName || ''}</p>
        <div style="background:#0E1523;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;">Event Details</p>
          <p style="color:#CBD5E1;font-size:14px;margin:0 0 6px;"><strong style="color:#fff;">Date & Time:</strong> ${data.eventDate || ''}</p>
          <p style="color:#CBD5E1;font-size:14px;margin:0;"><strong style="color:#fff;">Location:</strong> ${data.eventLocation || ''}</p>
        </div>
        <div style="background:#0E1523;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;">Receipt</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="color:#64748B;font-size:11px;text-align:left;padding-bottom:8px;">Ticket</th>
                <th style="color:#64748B;font-size:11px;text-align:center;padding-bottom:8px;">Qty</th>
                <th style="color:#64748B;font-size:11px;text-align:right;padding-bottom:8px;">Price</th>
                <th style="color:#64748B;font-size:11px;text-align:right;padding-bottom:8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="color:#94A3B8;font-size:13px;font-weight:600;padding-top:12px;text-align:right;">Total Paid</td>
                <td style="color:#F5B731;font-size:16px;font-weight:800;padding-top:12px;text-align:right;">$${parseFloat(data.totalAmount || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="text-align:center;background:#0E1523;border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 16px;">Your Check-In QR Code</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=000000&bgcolor=ffffff&data=${checkInEncoded}&format=png" alt="Check-in QR code" width="180" height="180" style="display:block;margin:0 auto;border-radius:4px;background:#fff;padding:8px;"/>
          <p style="color:#94A3B8;font-size:12px;margin:12px 0 4px;">Show this QR code at the door to check in.</p>
          <p style="color:#64748B;font-size:12px;margin:0;">If the QR code doesn't display, show this code:<br/><strong style="color:#F5B731;font-family:monospace;font-size:18px;letter-spacing:2px;">${shortCode}</strong></p>
        </div>
        <div style="margin-bottom:24px;">
          <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;">Add to Calendar</p>
          <a href="${calGoogle2}" style="display:inline-block;background:#0E1523;border:1px solid #2A3550;color:#CBD5E1;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;margin-right:8px;margin-bottom:8px;">Google Calendar</a>
          <a href="${icsUrl2}" style="display:inline-block;background:#0E1523;border:1px solid #2A3550;color:#CBD5E1;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;margin-right:8px;margin-bottom:8px;">Apple Calendar</a>
          <a href="${icsUrl2}" style="display:inline-block;background:#0E1523;border:1px solid #2A3550;color:#CBD5E1;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;margin-bottom:8px;">Outlook</a>
        </div>
        <a href="${data.eventUrl || ''}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">View Event Details</a>
      `, data.orgName, data.orgLogoUrl, data.orgUrl)
      result = await sendEmail(data.memberEmail, 'Your ticket for ' + (data.eventTitle || 'the event') + ' is confirmed!', html)
    }

    // ── Member Invite ────────────────────────────────────────────────────
    else if (type === 'member_invite') {
      var html = baseTemplate(`
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">You've been invited to join ${data.orgName || 'an organization'} on Syndicade</h2>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">Invited by ${data.inviterName || 'an admin'}${data.message ? ': "' + data.message + '"' : '.'}</p>
        <a href="${data.inviteUrl || 'https://syndicade-git-main-syndicades-projects.vercel.app'}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Accept Invitation</a>
      `, data.orgName, data.orgLogoUrl, data.orgUrl)
      result = await sendEmail(data.inviteeEmail, 'You\'ve been invited to ' + (data.orgName || 'an organization') + ' on Syndicade', html)
    }

    // ── Member Invite Onboarding ─────────────────────────────────────────
    else if (type === 'member_invite_onboarding') {
      const { org_name, org_logo_url, inviter_name, invite_name, token, org_id } = data
      const baseUrl = 'https://syndicade-git-main-syndicades-projects.vercel.app'
      const signupUrl = baseUrl + '/signup?invite_token=' + token + '&org_id=' + org_id
      const loginUrl = baseUrl + '/login?invite_token=' + token + '&org_id=' + org_id
      const greeting = invite_name ? 'Hi ' + invite_name + ',' : 'Hi there,'
      var html = baseTemplate(`
        <p style="color:#CBD5E1;font-size:15px;margin:0 0 8px;">${greeting}</p>
        <p style="color:#CBD5E1;font-size:15px;margin:0 0 24px;line-height:1.6;">
          <strong style="color:#FFFFFF;">${inviter_name}</strong> has invited you to join
          <strong style="color:#FFFFFF;">${org_name}</strong> on Syndicade — a platform for community organizations to manage members, events, and more.
        </p>
        <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 10px;">New to Syndicade?</p>
        <a href="${signupUrl}" style="display:block;background:#3B82F6;color:#FFFFFF;text-align:center;padding:14px 24px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:16px;">Create my Syndicade account</a>
        <p style="color:#64748B;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:4px;margin:0 0 10px;">Already have an account?</p>
        <a href="${loginUrl}" style="display:block;background:#1A2035;color:#FFFFFF;text-align:center;padding:14px 24px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;border:1px solid #2A3550;margin-bottom:24px;">Log in and add ${org_name}</a>
        <p style="color:#64748B;font-size:12px;margin:0;line-height:1.6;">This invitation was sent by ${inviter_name} on behalf of ${org_name}. If you weren't expecting this, you can safely ignore this email.</p>
      `, org_name, org_logo_url)
      result = await sendEmail(data.to, 'You\'ve been invited to join ' + org_name + ' on Syndicade', html)
    }

    // ── Urgent Announcement ──────────────────────────────────────────────
    else if (type === 'urgent_announcement') {
      var html = baseTemplate(`
        <div style="background:#7F1D1D;border:1px solid #EF4444;border-radius:12px;padding:12px 16px;margin-bottom:24px;">
          <p style="color:#FCA5A5;font-weight:700;font-size:13px;margin:0;">URGENT ANNOUNCEMENT</p>
        </div>
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 4px;">${data.title || ''}</h2>
        <p style="color:#94A3B8;font-size:13px;margin:0 0 20px;">${data.orgName || ''}</p>
        <p style="color:#CBD5E1;font-size:14px;line-height:1.6;margin:0 0 24px;">${data.body || ''}</p>
        <a href="${data.announcementUrl || ''}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Read Full Announcement</a>
      `, data.orgName, data.orgLogoUrl, data.orgUrl)
      result = await sendEmail(data.memberEmail, 'Urgent: ' + (data.title || '') + ' — ' + (data.orgName || ''), html)
    }

    // ── Dues Reminder ────────────────────────────────────────────────────
    else if (type === 'dues_reminder') {
      var html = baseTemplate(`
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">Membership Dues Reminder</h2>
        <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">This is a friendly reminder from ${data.orgName || 'your organization'} that your membership dues are due.</p>
        ${data.amount ? '<p style="color:#F5B731;font-size:28px;font-weight:800;margin:0 0 24px;">$' + parseFloat(data.amount).toFixed(2) + '</p>' : ''}
        <a href="${data.paymentUrl || ''}" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Pay Dues Now</a>
      `, data.orgName, data.orgLogoUrl, data.orgUrl)
      result = await sendEmail(data.memberEmail, 'Membership dues reminder — ' + (data.orgName || ''), html)
    }

    else {
      throw new Error('Unknown email type: ' + type)
    }

    return new Response(JSON.stringify({ success: true, result }), {
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