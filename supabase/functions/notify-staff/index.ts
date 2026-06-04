import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const STAFF_EMAIL = 'hello@syndicade.org';
const APP_URL = Deno.env.get('APP_URL') || 'https://app.syndicade.com';

Deno.serve(async (req) => {
  try {
    var body = await req.json();
    var type = body.type;

    if (type === 'new_verification') {
      var supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      var orgRes = await supabase.from('organizations').select('name, city, state').eq('id', body.org_id).single();
      var org = orgRes.data || {};
      var orgName = org.name || 'Unknown Organization';
      var location = org.city && org.state ? org.city + ', ' + org.state : '';
      var submittedAt = body.submitted_at ? new Date(body.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Just now';

      var html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter','Segoe UI',system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
    <div style="background:#0E1523;padding:24px 32px;text-align:center;">
      <span style="color:#FFFFFF;font-weight:800;font-size:20px;">Syndi</span><span style="color:#F5B731;font-weight:800;font-size:20px;">cade</span>
      <p style="color:#94A3B8;font-size:12px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Staff Notification</p>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:#EDE9FE;border:1px solid #DDD6FE;border-radius:99px;padding:4px 12px;font-size:11px;font-weight:700;color:#7C3AED;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;">New Verification Request</div>
      <h2 style="font-size:20px;font-weight:800;color:#0E1523;margin:0 0 8px;">${orgName}</h2>
      ${location ? `<p style="font-size:14px;color:#64748B;margin:0 0 20px;">${location}</p>` : ''}
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:13px;color:#64748B;">EIN</span><span style="font-size:13px;color:#0E1523;font-weight:600;">${body.ein || 'Not provided'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:#64748B;">Submitted</span><span style="font-size:13px;color:#0E1523;font-weight:600;">${submittedAt}</span></div>
      </div>
      <a href="${APP_URL}/staff" style="display:block;text-align:center;background:#3B82F6;color:#FFFFFF;font-weight:700;font-size:14px;padding:14px 24px;border-radius:8px;text-decoration:none;">Review in Staff Dashboard</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #E2E8F0;text-align:center;"><p style="font-size:11px;color:#94A3B8;margin:0;">Syndicade Staff Portal</p></div>
  </div>
</body></html>`;

      await sendEmail('New Verification Request: ' + orgName, html,
        'New nonprofit verification request from ' + orgName + (body.ein ? ' (EIN: ' + body.ein + ')' : '') + '. Review at ' + APP_URL + '/staff');

    } else if (type === 'new_contact') {
      var submittedAt = body.submitted_at ? new Date(body.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Just now';

      var html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter','Segoe UI',system-ui,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
    <div style="background:#0E1523;padding:24px 32px;text-align:center;">
      <span style="color:#FFFFFF;font-weight:800;font-size:20px;">Syndi</span><span style="color:#F5B731;font-weight:800;font-size:20px;">cade</span>
      <p style="color:#94A3B8;font-size:12px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Staff Notification</p>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:#DBEAFE;border:1px solid #BFDBFE;border-radius:99px;padding:4px 12px;font-size:11px;font-weight:700;color:#1D4ED8;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;">New Contact Submission</div>
      <h2 style="font-size:20px;font-weight:800;color:#0E1523;margin:0 0 4px;">${body.name || 'Unknown'}</h2>
      <a href="mailto:${body.email}" style="font-size:14px;color:#3B82F6;text-decoration:none;">${body.email || ''}</a>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin:20px 0;">
        ${body.organization ? `<div style="margin-bottom:12px;"><p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Organization</p><p style="font-size:14px;color:#0E1523;margin:0;">${body.organization}</p></div>` : ''}
        ${body.message ? `<div><p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;margin:0 0 4px;">Message</p><p style="font-size:14px;color:#475569;margin:0;line-height:1.6;">${body.message}</p></div>` : ''}
      </div>
      <p style="font-size:12px;color:#94A3B8;margin:0 0 20px;">Submitted ${submittedAt}</p>
      <a href="${APP_URL}/staff" style="display:block;text-align:center;background:#3B82F6;color:#FFFFFF;font-weight:700;font-size:14px;padding:14px 24px;border-radius:8px;text-decoration:none;">View in Staff Dashboard</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #E2E8F0;text-align:center;"><p style="font-size:11px;color:#94A3B8;margin:0;">Syndicade Staff Portal</p></div>
  </div>
</body></html>`;

      await sendEmail('New Contact: ' + (body.name || body.email || 'Unknown'), html,
        'New contact from ' + (body.name || 'Unknown') + ' (' + (body.email || '') + ')' + (body.organization ? ' at ' + body.organization : '') + '.');
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
  } catch (err) {
    console.error('notify-staff error:', err);
    return new Response(JSON.stringify({ error: err.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
});

async function sendEmail(subject, html, text) {
  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_API_KEY },
    body: JSON.stringify({ from: 'Syndicade <notifications@syndicade.org>', to: [STAFF_EMAIL], subject, html, text }),
  });
  if (!res.ok) { var err = await res.text(); throw new Error('Resend error: ' + err); }
  return res.json();
}