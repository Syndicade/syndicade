import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async function(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var body = await req.json()
    var { type, data } = body

    var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    var emailPayload = buildEmail(type, data)
    if (!emailPayload) {
      throw new Error('Unknown email type: ' + type)
    }

    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: emailPayload.to,
        subject: emailPayload.subject,
        html: emailPayload.html,
      }),
    })

    var resData = await res.json()

    if (!res.ok) {
      throw new Error('Resend error: ' + JSON.stringify(resData))
    }

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: Object.assign({}, corsHeaders, { 'Content-Type': 'application/json' }),
      status: 400,
    })
  }
})

function buildEmail(type, data) {
  if (type === 'contact_inquiry') {
    return {
      to: data.adminEmail,
      subject: 'New contact inquiry for ' + data.orgName,
      html: contactInquiryTemplate(data),
    }
  }

if (type === 'rsvp_confirmation') {
    var startDate = data.startISO ? new Date(data.startISO).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : '';
    var endDate = data.endISO ? new Date(data.endISO).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : startDate;
    var gcalUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(data.eventTitle) +
      '&dates=' + startDate + '/' + endDate +
      '&location=' + encodeURIComponent(data.eventLocation || '') +
      '&details=' + encodeURIComponent('View event: ' + data.eventUrl);
var icsUrl = data.eventId ? 'https://zktmhqrygknkodydbumq.supabase.co/functions/v1/event-ics?event_id=' + data.eventId : ''
    return {
      to: data.memberEmail,
      subject: "You're registered: " + data.eventTitle,
      html: rsvpConfirmationTemplate(Object.assign({}, data, { googleCalendarUrl: gcalUrl, icsUrl: icsUrl })),
    }
  }

  if (type === 'member_invite') {
    return {
      to: data.inviteeEmail,
      subject: "You've been invited to join " + data.orgName + " on Syndicade",
      html: memberInviteTemplate(data),
    }
  }

  if (type === 'urgent_announcement') {
    return {
      to: data.memberEmail,
      subject: '[Urgent] ' + data.orgName + ': ' + data.announcementTitle,
      html: urgentAnnouncementTemplate(data),
    }
  }

    if (type === 'dues_reminder') {
    return {
      to: data.memberEmail,
      subject: 'Dues Reminder — ' + data.orgName,
      html: duesReminderTemplate(data),
    }
  }

  return null
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseTemplate(content) {
  return (
    '<div style="font-family:Inter,Helvetica,sans-serif;background:#f8fafc;padding:32px 0;min-height:100vh;">' +
    '  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">' +
'    <div style="background:#0E1523;padding:24px 32px;">' +
'      <span style="font-size:20px;font-weight:800;color:#ffffff;">Syndi</span><span style="font-size:20px;font-weight:800;color:#F5B731;">cade</span>' +
'    </div>' +
    '    <div style="padding:32px;">' +
    content +
    '    </div>' +
    '    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">' +
    '      <p style="font-size:12px;color:#94a3b8;margin:0;">You are receiving this because you are a member of an organization on Syndicade.</p>' +
    '      <p style="font-size:12px;color:#94a3b8;margin:4px 0 0;">Where Community Work Connects.</p>' +
    '    </div>' +
    '  </div>' +
    '</div>'
  )
}

function contactInquiryTemplate(data) {
  return baseTemplate(
    '<h2 style="font-size:20px;font-weight:700;color:#0e1523;margin:0 0 8px;">New Contact Inquiry</h2>' +
    '<p style="font-size:14px;color:#475569;margin:0 0 24px;">Someone submitted a message through your public page on Syndicade.</p>' +
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">' +
    '  <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">From</p>' +
    '  <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0e1523;">' + escapeHtml(data.senderName) + '</p>' +
    '  <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</p>' +
    '  <p style="margin:0 0 16px;font-size:15px;color:#0e1523;">' + escapeHtml(data.senderEmail) + '</p>' +
    '  <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>' +
    '  <p style="margin:0;font-size:15px;color:#0e1523;line-height:1.6;">' + escapeHtml(data.message) + '</p>' +
    '</div>' +
    '<a href="' + data.inboxUrl + '" style="display:inline-block;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">View in Admin Inbox</a>'
  )
}

function rsvpConfirmationTemplate(data) {
  return baseTemplate(
    '<h2 style="font-size:20px;font-weight:700;color:#0e1523;margin:0 0 8px;">You\'re registered!</h2>' +
    '<p style="font-size:14px;color:#475569;margin:0 0 24px;">Your spot is confirmed for the following event.</p>' +
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">' +
    '  <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0e1523;">' + escapeHtml(data.eventTitle) + '</p>' +
    '  <p style="margin:0 0 12px;font-size:13px;color:#64748b;">' + escapeHtml(data.orgName) + '</p>' +
    '  <p style="margin:0 0 6px;font-size:14px;color:#475569;">' +
    '    <span style="font-weight:600;">Date:</span> ' + escapeHtml(data.eventDate) +
    '  </p>' +
    '  <p style="margin:0;font-size:14px;color:#475569;">' +
    '    <span style="font-weight:600;">Location:</span> ' + escapeHtml(data.eventLocation || 'See event page for details') +
    '  </p>' +
    '</div>' +
'<a href="' + data.eventUrl + '" style="display:inline-block;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:12px;">View Event Details</a>' +
    '<div style="margin-top:16px;">' +
    '<p style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Add to Calendar</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
    '<a href="' + data.googleCalendarUrl + '" style="display:inline-block;background:#ffffff;color:#374151;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none;border:1px solid #d1d5db;">Google Calendar</a>' +
    '<a href="' + data.icsUrl + '" style="display:inline-block;background:#ffffff;color:#374151;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none;border:1px solid #d1d5db;">Apple Calendar</a>' +
    '<a href="' + data.icsUrl + '" style="display:inline-block;background:#ffffff;color:#374151;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none;border:1px solid #d1d5db;">Outlook</a>' +
    '</div>' +
    '</div>'
  )
}

function memberInviteTemplate(data) {
  return baseTemplate(
    '<h2 style="font-size:20px;font-weight:700;color:#0e1523;margin:0 0 8px;">You\'ve been invited</h2>' +
    '<p style="font-size:14px;color:#475569;margin:0 0 24px;">' +
    '  <strong>' + escapeHtml(data.inviterName) + '</strong> has invited you to join ' +
    '  <strong>' + escapeHtml(data.orgName) + '</strong> on Syndicade.' +
    '</p>' +
    (data.orgDescription
      ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #F5B731;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">' +
        '  <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">' + escapeHtml(data.orgDescription) + '</p>' +
        '</div>'
      : '') +
    '<a href="' + data.acceptUrl + '" style="display:inline-block;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">Accept Invitation</a>' +
    '<p style="font-size:12px;color:#94a3b8;margin:16px 0 0;">This invitation was sent to ' + escapeHtml(data.inviteeEmail) + '. If you did not expect this, you can safely ignore this email.</p>'
  )
}

function urgentAnnouncementTemplate(data) {
  return baseTemplate(
    '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">' +
    '  <span style="font-size:13px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.5px;">Urgent Announcement</span>' +
    '</div>' +
    '<h2 style="font-size:20px;font-weight:700;color:#0e1523;margin:0 0 4px;">' + escapeHtml(data.announcementTitle) + '</h2>' +
    '<p style="font-size:13px;color:#64748b;margin:0 0 20px;">' + escapeHtml(data.orgName) + '</p>' +
    '<div style="font-size:15px;color:#475569;line-height:1.7;margin-bottom:24px;">' + escapeHtml(data.announcementBody) + '</div>' +
    '<a href="' + data.announcementUrl + '" style="display:inline-block;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">Read Full Announcement</a>'
  )
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function duesReminderTemplate(data) {
  return baseTemplate(
    '<h2 style="font-size:20px;font-weight:700;color:#0e1523;margin:0 0 8px;">Dues Reminder</h2>' +
    '<p style="font-size:14px;color:#475569;margin:0 0 24px;">Hi <strong>' + escapeHtml(data.memberName) + '</strong>,</p>' +
    '<p style="font-size:14px;color:#475569;margin:0 0 16px;">This is a friendly reminder that your dues for <strong>' + escapeHtml(data.orgName) + '</strong> are currently outstanding.</p>' +
    (data.duesAmount ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #F5B731;border-radius:0 8px 8px 0;padding:16px;margin-bottom:20px;"><p style="margin:0;font-size:15px;color:#0e1523;">Amount due: <strong>$' + escapeHtml(String(data.duesAmount)) + '</strong></p></div>' : '') +
    (data.message ? '<p style="font-size:14px;color:#475569;margin:0 0 16px;">' + escapeHtml(data.message) + '</p>' : '') +
    '<p style="font-size:14px;color:#475569;margin:0;">Please contact your organization admin if you have questions.</p>'
  )
}