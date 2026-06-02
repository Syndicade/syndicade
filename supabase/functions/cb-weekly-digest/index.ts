import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = 'Syndicade <noreply@syndicade.com>';

const BOARD_TYPE_LABELS: Record<string, string> = {
  ask: 'Asks',
  offer: 'Offers',
  collab: 'Collaboration',
  recommendations: 'Recommendations',
};

const BOARD_TYPE_COLORS: Record<string, string> = {
  ask: '#9C27B0',
  offer: '#66BB6A',
  collab: '#42A5F5',
  recommendations: '#FB8C00',
};

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function buildEmailHtml(
  boardName: string,
  boardId: string,
  orgName: string,
  postsByType: Record<string, any[]>,
  appUrl: string
): string {
  const boardUrl = `${appUrl}/community-board/${boardId}`;
  const totalPosts = Object.values(postsByType).reduce((sum, arr) => sum + arr.length, 0);

  const sectionsHtml = Object.entries(postsByType)
    .filter(([, posts]) => posts.length > 0)
    .map(([boardType, posts]) => {
      const label = BOARD_TYPE_LABELS[boardType] || boardType;
      const color = BOARD_TYPE_COLORS[boardType] || '#64748B';
      const postsHtml = posts.slice(0, 5).map((post) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;">
            <div style="font-size:13px;font-weight:700;color:#0E1523;margin-bottom:3px;">${escapeHtml(post.title)}</div>
            <div style="font-size:12px;color:#475569;margin-bottom:3px;">${escapeHtml(post.org_name)}</div>
            <div style="font-size:11px;color:#94A3B8;">${formatDate(post.created_at)}</div>
          </td>
        </tr>`).join('');
      const moreCount = posts.length > 5 ? posts.length - 5 : 0;
      return `
        <div style="margin-bottom:28px;">
          <div style="display:inline-block;padding:3px 10px;border-radius:4px;background:${color};color:#ffffff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">${label}</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${postsHtml}
          </table>
          ${moreCount > 0 ? `<div style="font-size:12px;color:#64748B;margin-top:8px;">+ ${moreCount} more ${label.toLowerCase()}</div>` : ''}
        </div>`;
    }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#0E1523;border-radius:12px 12px 0 0;padding:24px 32px;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;">Syndi<span style="color:#F5B731;">cade</span></div>
            <div style="font-size:13px;color:#94A3B8;margin-top:4px;">Community Board Weekly Digest</div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
            <p style="font-size:15px;font-weight:700;color:#0E1523;margin:0 0 6px;">Hi ${escapeHtml(orgName)},</p>
            <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
              Here's what's been posted on <strong>${escapeHtml(boardName)}</strong> in the past week —
              <strong>${totalPosts} new post${totalPosts === 1 ? '' : 's'}</strong> across the board.
            </p>
            ${sectionsHtml}
            <div style="margin-top:8px;text-align:center;">
              <a href="${boardUrl}" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:#ffffff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">View the Board</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#F1F5F9;border-radius:0 0 12px 12px;border:1px solid #E2E8F0;border-top:none;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#94A3B8;margin:0 0 6px;">You're receiving this because your organization is a member of the ${escapeHtml(boardName)} community board.</p>
            <p style="font-size:11px;color:#94A3B8;margin:0;">Syndicade · Toledo, OH</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    console.error(`Resend error for ${to}:`, await res.text());
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const appUrl = Deno.env.get('APP_URL') || 'https://app.syndicade.com';
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: boards, error: boardsError } = await supabase
      .from('community_boards')
      .select('id, name')
      .eq('is_active', true);

    if (boardsError) throw boardsError;
    if (!boards || boards.length === 0) {
      return new Response(JSON.stringify({ message: 'No active boards.' }), { status: 200 });
    }

    let totalEmailsSent = 0;

    for (const board of boards) {
      // Get new posts in last 7 days
      const { data: posts } = await supabase
        .from('community_board_posts')
        .select('id, title, body, board_type, category, org_id, created_at')
        .eq('board_id', board.id)
        .eq('is_active', true)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (!posts || posts.length === 0) continue;

      // Enrich with org names
      const orgIds = [...new Set(posts.map((p) => p.org_id))];
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      const orgMap: Record<string, string> = {};
      (orgs || []).forEach((o) => { orgMap[o.id] = o.name; });
      const enrichedPosts = posts.map((p) => ({ ...p, org_name: orgMap[p.org_id] || 'Unknown Org' }));

      // Group by board type
      const postsByType: Record<string, any[]> = {};
      for (const post of enrichedPosts) {
        if (!postsByType[post.board_type]) postsByType[post.board_type] = [];
        postsByType[post.board_type].push(post);
      }

      // Get approved member orgs
      const { data: memberships } = await supabase
        .from('community_board_memberships')
        .select('org_id, organizations(id, name)')
        .eq('board_id', board.id)
        .eq('status', 'approved');

      if (!memberships || memberships.length === 0) continue;

      for (const membership of memberships) {
        const memberOrg = membership.organizations as any;
        if (!memberOrg) continue;

        // Get admin user IDs for this org
        const { data: adminMembers } = await supabase
          .from('memberships')
          .select('member_id')
          .eq('organization_id', memberOrg.id)
          .eq('role', 'admin')
          .eq('status', 'active');

        if (!adminMembers || adminMembers.length === 0) continue;

        // Get emails via auth admin API
        const emailList: string[] = [];
        for (const m of adminMembers) {
          const { data: userData } = await supabase.auth.admin.getUserById(m.member_id);
          if (userData?.user?.email) emailList.push(userData.user.email);
        }

        if (emailList.length === 0) continue;

        const subject = `[${board.name}] Weekly digest — ${posts.length} new post${posts.length === 1 ? '' : 's'}`;
        const html = buildEmailHtml(board.name, board.id, memberOrg.name, postsByType, appUrl);

        for (const email of emailList) {
          await sendEmail(email, subject, html);
          totalEmailsSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Digest complete.', totalEmailsSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('cb-weekly-digest error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});