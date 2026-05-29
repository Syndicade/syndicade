import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
var ADMIN_EMAIL = 'hello@syndicade.org';
var FROM_EMAIL = 'Syndicade Alerts <alerts@syndicade.org>';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  var body = await req.json();
  var { type, record } = body;

  var subject = '';
  var html = '';

  if (type === 'new_org') {
    subject = 'New org signed up: ' + (record.name || 'Unknown');
    html = buildOrgEmail(record);
  } else if (type === 'new_member') {
    subject = 'New member joined: ' + (record.first_name || '') + ' ' + (record.last_name || '');
    html = buildMemberEmail(record);
  } else {
    return new Response('Unknown type', { status: 400 });
  }

  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: subject,
      html: html,
    }),
  });

  if (!res.ok) {
    var err = await res.text();
    return new Response('Email failed: ' + err, { status: 500 });
  }

  return new Response('OK', { status: 200 });
});

function buildOrgEmail(record: any) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#F8FAFC;">
      <div style="margin-bottom:24px;">
        <span style="font-weight:800;font-size:20px;color:#0E1523;">Syndi</span><span style="font-weight:800;font-size:20px;color:#F5B731;">cade</span>
      </div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#F5B731;margin-bottom:12px;">New Organization</div>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0E1523;">${record.name || 'Unnamed Org'}</h2>
        <table style="width:100%;font-size:14px;color:#475569;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#64748B;width:140px;">ID</td><td>${record.id || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Location</td><td>${record.city && record.state ? record.city + ', ' + record.state : '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Type</td><td>${record.type || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Created</td><td>${new Date(record.created_at).toLocaleString()}</td></tr>
        </table>
        <div style="margin-top:20px;">
          <a href="https://app.syndicade.org/staff" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:700;font-size:14px;padding:10px 20px;border-radius:8px;text-decoration:none;">View in Staff Dashboard</a>
        </div>
      </div>
    </div>`;
}

function buildMemberEmail(record: any) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#F8FAFC;">
      <div style="margin-bottom:24px;">
        <span style="font-weight:800;font-size:20px;color:#0E1523;">Syndi</span><span style="font-weight:800;font-size:20px;color:#F5B731;">cade</span>
      </div>
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#F5B731;margin-bottom:12px;">New Member</div>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0E1523;">${(record.first_name || '') + ' ' + (record.last_name || '')}</h2>
        <table style="width:100%;font-size:14px;color:#475569;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#64748B;width:140px;">User ID</td><td>${record.user_id || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Phone</td><td>${record.phone || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Member #</td><td>${record.member_number ? '#' + record.member_number : '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#64748B;">Joined</td><td>${new Date(record.joined_date || record.created_at).toLocaleString()}</td></tr>
        </table>
        <div style="margin-top:20px;">
          <a href="https://app.syndicade.org/staff" style="display:inline-block;background:#3B82F6;color:#fff;font-weight:700;font-size:14px;padding:10px 20px;border-radius:8px;text-decoration:none;">View in Staff Dashboard</a>
        </div>
      </div>
    </div>`;
}