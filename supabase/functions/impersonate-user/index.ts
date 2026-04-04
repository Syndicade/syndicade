import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async function (req) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    var authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    var supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    var supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    );

    var { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    var { data: staffMember } = await supabaseAdmin
      .from('members')
      .select('is_staff, first_name, last_name')
      .eq('user_id', user.id)
      .single();

    if (!staffMember?.is_staff) {
      return new Response(JSON.stringify({ error: 'Access denied — staff only' }), { status: 403, headers: corsHeaders });
    }

    var { target_user_id } = await req.json();
    if (!target_user_id) return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: corsHeaders });

    var { data: targetMember } = await supabaseAdmin
      .from('members')
      .select('first_name, last_name')
      .eq('user_id', target_user_id)
      .single();

    var { data: targetAuthUser } = await supabaseAdmin.auth.admin.getUserById(target_user_id);
    if (!targetAuthUser?.user?.email) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), { status: 404, headers: corsHeaders });
    }

    var { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetAuthUser.user.email,
    });

    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: 'Failed to generate impersonation link' }), { status: 500, headers: corsHeaders });
    }

    await supabaseAdmin.from('staff_audit_log').insert({
      staff_user_id: user.id,
      action: 'impersonation_link_generated',
      target_type: 'member',
      target_id: target_user_id,
      details: {
        staff_name: staffMember.first_name + ' ' + staffMember.last_name,
        target_name: targetMember ? targetMember.first_name + ' ' + targetMember.last_name : 'Unknown',
        target_email: targetAuthUser.user.email,
        generated_at: new Date().toISOString(),
      },
    });

var rawLink = linkData.properties.action_link;
    var fixedLink = rawLink.replace('http://localhost:3000', 'https://syndicade-git-main-syndicades-projects.vercel.app');
    return new Response(
      JSON.stringify({ link: fixedLink }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
