import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async function(req) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  var supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  var RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  var FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>';

  // GET — verify token
  if (req.method === 'GET') {
    var url = new URL(req.url);
    var token = url.searchParams.get('token');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    var { data: org, error: findErr } = await supabase
      .from('organizations')
      .select('id, name, contact_email_verified')
      .eq('contact_email_verify_token', token)
      .maybeSingle();
    if (findErr || !org) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (org.contact_email_verified) {
      return new Response(JSON.stringify({ success: true, already: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    var { error: updateErr } = await supabase
      .from('organizations')
      .update({ contact_email_verified: true, contact_email_verify_token: null })
      .eq('id', org.id);
    if (updateErr) {
      return new Response(JSON.stringify({ error: 'Failed to verify' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // POST — send verification email
  if (req.method === 'POST') {
    var body = await req.json();
    var organization_id = body.organization_id;
    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'Missing organization_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    var { data: org2, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name, contact_email, contact_email_verified')
      .eq('id', organization_id)
      .single();
    if (orgErr || !org2) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (org2.contact_email_verified) {
      return new Response(JSON.stringify({ success: true, already: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!org2.contact_email) {
      return new Response(JSON.stringify({ error: 'No contact email on file' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    var token2 = crypto.randomUUID();
    var { error: tokenErr } = await supabase
      .from('organizations')
      .update({ contact_email_verify_token: token2 })
      .eq('id', organization_id);
    if (tokenErr) {
      return new Response(JSON.stringify({ error: 'Failed to generate token' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    var verifyUrl = 'https://syndicade.org/verify-email?token=' + token2;
    var html = '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">' +
      '<h2 style="color:#0E1523;font-size:22px;font-weight:800;margin-bottom:8px;">Verify your organization email</h2>' +
      '<p style="color:#475569;font-size:15px;line-height:1.6;margin-bottom:24px;">Hi! Please verify the contact email for <strong>' + org2.name + '</strong> on Syndicade.</p>' +
      '<a href="' + verifyUrl + '" style="display:inline-block;background:#3B82F6;color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">Verify Email Address</a>' +
      '<p style="color:#94A3B8;font-size:12px;margin-top:24px;">If you did not create this organization, you can ignore this email.</p>' +
      '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>' +
      '<p style="color:#94A3B8;font-size:11px;">Syndicade &mdash; <a href="https://syndicade.org" style="color:#94A3B8;">syndicade.org</a></p>' +
      '</div>';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_ADDRESS, to: org2.contact_email, subject: 'Verify your Syndicade organization email', html: html }),
    });
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});