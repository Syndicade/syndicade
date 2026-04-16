import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>'

function brandFooter() {
  return (
    '<tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">' +
    '<p style="font-size:12px;color:#9ca3af;margin:0;">Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#374151;font-weight:700;">cade</span></p>' +
    '</td></tr>'
  )
}

function orgHeader(orgName: string, orgLogoUrl: string) {
  return (
    '<tr><td style="background:#0E1523;padding:24px 32px;text-align:center;">' +
    (orgLogoUrl ? '<img src="' + orgLogoUrl + '" alt="' + orgName + ' logo" style="height:48px;border-radius:50%;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" />' : '') +
    '<span style="font-size:20px;font-weight:800;color:#ffffff;">' + orgName + '</span>' +
    '</td></tr>'
  )
}

function wrapEmail(inner: string) {
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">' +
    inner +
    '</table></td></tr></table></body></html>'
  )
}

function buildRsvpConfirmation(data: any) {
  var subject = 'You\'re going: ' + data.eventTitle
  var inner =
    orgHeader(data.orgName || 'Your Organization', data.orgLogoUrl || '') +
    '<tr><td style="padding:32px;">' +
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">You\'re going!</h2>' +
    '<p style="font-size:15px;color:#374151;margin:0 0 24px;">Your RSVP has been confirmed for <strong>' + data.eventTitle + '</strong>.</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">' +
    '<tr><td style="padding:6px 16px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Date &amp; Time</td></tr>' +
    '<tr><td style="padding:2px 16px 12px;font-size:15px;color:#111827;font-weight:600;">' + data.eventDate + '</td></tr>' +
    (data.eventLocation ? '<tr><td style="padding:6px 16px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Location</td></tr><tr><td style="padding:2px 16px 12px;font-size:15px;color:#111827;font-weight:600;">' + data.eventLocation + '</td></tr>' : '') +
    '</table>' +
    '<p style="text-align:center;margin:0 0 8px;">' +
    '<a href="' + data.eventUrl + '" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">View Event Details</a>' +
    '</p>' +
    '</td></tr>' +
    brandFooter()
  return { subject, html: wrapEmail(inner) }
}

function buildTicketConfirmation(data: any) {
  var subject = 'Ticket confirmed: ' + data.eventTitle
  var lineItemsHtml = ''
  if (Array.isArray(data.lineItems) && data.lineItems.length > 0) {
    lineItemsHtml = '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">'
    for (var item of data.lineItems) {
      var unitPrice = parseFloat(item.unit_price || 0).toFixed(2)
      var itemTotal = parseFloat(item.total_amount || 0).toFixed(2)
      lineItemsHtml +=
        '<tr style="border-bottom:1px solid #e5e7eb;">' +
        '<td style="padding:10px 0;font-size:14px;color:#374151;">' + item.name + ' × ' + item.quantity + '</td>' +
        '<td style="padding:10px 0;font-size:14px;color:#374151;text-align:right;">$' + unitPrice + ' ea — $' + itemTotal + '</td>' +
        '</tr>'
    }
    lineItemsHtml +=
      '<tr><td style="padding:12px 0 0;font-size:15px;font-weight:800;color:#111827;">Total</td>' +
      '<td style="padding:12px 0 0;font-size:15px;font-weight:800;color:#111827;text-align:right;">$' + parseFloat(data.totalAmount || 0).toFixed(2) + '</td></tr>' +
      '</table>'
  }
  var inner =
    orgHeader(data.orgName || 'Your Organization', data.orgLogoUrl || '') +
    '<tr><td style="padding:32px;">' +
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Ticket confirmed!</h2>' +
    '<p style="font-size:15px;color:#374151;margin:0 0 24px;">Your payment was received for <strong>' + data.eventTitle + '</strong>. See you there!</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">' +
    '<tr><td style="padding:6px 16px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Date &amp; Time</td></tr>' +
    '<tr><td style="padding:2px 16px 12px;font-size:15px;color:#111827;font-weight:600;">' + data.eventDate + '</td></tr>' +
    (data.eventLocation ? '<tr><td style="padding:6px 16px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Location</td></tr><tr><td style="padding:2px 16px 12px;font-size:15px;color:#111827;font-weight:600;">' + data.eventLocation + '</td></tr>' : '') +
    '</table>' +
    lineItemsHtml +
    '<p style="text-align:center;margin:0 0 8px;">' +
    '<a href="' + data.eventUrl + '" style="display:inline-block;padding:12px 28px;background:#F5B731;color:#0E1523;font-size:14px;font-weight:800;border-radius:8px;text-decoration:none;">View Event Details</a>' +
    '</p>' +
    '</td></tr>' +
    brandFooter()
  return { subject, html: wrapEmail(inner) }
}

function buildGuestRsvpConfirmation(data: any) {
  var subject = 'RSVP confirmed: ' + data.eventTitle
  var inner =
    orgHeader(data.orgName || 'Your Organization', data.orgLogoUrl || '') +
    '<tr><td style="padding:32px;">' +
    '<h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Your RSVP is confirmed!</h2>' +
    '<p style="font-size:15px;color:#374151;margin:0 0 24px;">Hi ' + (data.guestName || 'there') + ', we\'ve received your RSVP for <strong>' + data.eventTitle + '</strong>.</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">' +
    '<tr><td style="padding:6px 16px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Date &amp; Time</td></tr>' +
    '<tr><td style="padding:2px 16px 12px;font-size:15px;color:#111827;font-weight:600;">' + data.eventDate + '</td></tr>' +
    (data.eventLocation ? '<tr><td style="padding:6px 16px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Location</td></tr><tr><td style="padding:2px 16px 12px;font-size:15px;color:#111827;font-weight:600;">' + data.eventLocation + '</td></tr>' : '') +
    (data.guestCount && data.guestCount > 1 ? '<tr><td style="padding:6px 16px;font-size:13px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Guests</td></tr><tr><td style="padding:2px 16px 12px;font-size:15px;color:#111827;font-weight:600;">' + data.guestCount + ' people</td></tr>' : '') +
    '</table>' +
    '<p style="font-size:13px;color:#6b7280;text-align:center;margin:0 0 16px;">Organized by ' + (data.orgName || 'the hosting organization') + '</p>' +
    '<p style="text-align:center;margin:0 0 8px;">' +
    '<a href="' + data.eventUrl + '" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">View Event Details</a>' +
    '</p>' +
    '</td></tr>' +
    brandFooter()
  return { subject, html: wrapEmail(inner) }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: corsHeaders })
    }

    var body = await req.json()
    var { type, data } = body

    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'Missing type or data' }), { status: 400, headers: corsHeaders })
    }

    var toEmail: string | null = null
    var emailContent: { subject: string, html: string } | null = null

    if (type === 'rsvp_confirmation') {
      toEmail = data.memberEmail
      emailContent = buildRsvpConfirmation(data)
    } else if (type === 'ticket_confirmation') {
      toEmail = data.memberEmail
      emailContent = buildTicketConfirmation(data)
    } else if (type === 'guest_rsvp_confirmation') {
      toEmail = data.guestEmail
      emailContent = buildGuestRsvpConfirmation(data)
    } else {
      return new Response(JSON.stringify({ error: 'Unknown email type: ' + type }), { status: 400, headers: corsHeaders })
    }

    if (!toEmail) {
      return new Response(JSON.stringify({ error: 'No recipient email provided' }), { status: 400, headers: corsHeaders })
    }

    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: toEmail,
        subject: emailContent!.subject,
        html: emailContent!.html,
      }),
    })

    var resData = await res.json()

    if (!res.ok) {
      console.error('Resend error:', resData)
      return new Response(JSON.stringify({ error: 'Email send failed', details: resData }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('send-transactional error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})