/**
 * send-nudge-emails/index.ts
 * Supabase Edge Function — called daily by pg_cron at 9am UTC
 *
 * Logic:
 * - Finds orgs at the 7, 14, and 30 day marks with no active subscription
 * - Skips any org that already received that specific nudge (nudge_log)
 * - Sends a personalized email via Resend
 * - Logs each send to nudge_log
 *
 * Deploy: supabase functions deploy send-nudge-emails --no-verify-jwt
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// While Resend is in test mode, all emails go to this address only.
// Once you verify syndicade.com at resend.com/domains, update FROM_ADDRESS
// and remove the TEST_MODE override.
const FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>';
const TEST_MODE = false; // set to false after domain verification
const TEST_RECIPIENT = 'grades_path9i@icloud.com';

const NUDGE_DAYS = [7, 14, 30];

// ─── Email templates ──────────────────────────────────────────────────────────

function getEmailContent(orgName: string, adminFirstName: string, nudgeDay: number) {
  const firstName = adminFirstName || 'there';

  if (nudgeDay === 7) {
    return {
      subject: `${orgName} — your community board is just getting started`,
      html: `
        <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;background:#0E1523;color:#CBD5E1;border-radius:16px;overflow:hidden;">
          <div style="background:#151B2D;padding:24px 32px;border-bottom:1px solid #2A3550;">
            <span style="font-size:22px;font-weight:800;color:#FFFFFF;">Syndi</span><span style="font-size:22px;font-weight:800;color:#F5B731;">cade</span>
          </div>
          <div style="padding:32px;">
            <p style="font-size:16px;color:#FFFFFF;font-weight:700;margin:0 0 8px;">Hey ${firstName},</p>
            <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">
              It's been one week since <strong style="color:#FFFFFF;">${orgName}</strong> joined Syndicade. You're still in your free trial — no pressure, no credit card needed.
            </p>
            <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">
              Here's a quick reminder of what your members get access to the moment you go live:
            </p>
            <div style="background:#1A2035;border-radius:12px;padding:20px;margin:0 0 24px;">
              ${featureList()}
            </div>
            <p style="font-size:15px;line-height:1.7;margin:0 0 28px;color:#94A3B8;">
              Most organizations are fully set up in under 10 minutes. If you have any questions, just reply to this email.
            </p>
            ${ctaButton('Continue setting up', 'https://syndicade-git-main-syndicades-projects.vercel.app/dashboard')}
            <p style="font-size:12px;color:#64748B;margin-top:28px;">
              You're receiving this because you signed up for Syndicade. Your free trial runs for 30 days from signup.
            </p>
          </div>
        </div>
      `,
    };
  }

  if (nudgeDay === 14) {
    return {
      subject: `${orgName} — 2 weeks in, trial halfway through`,
      html: `
        <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;background:#0E1523;color:#CBD5E1;border-radius:16px;overflow:hidden;">
          <div style="background:#151B2D;padding:24px 32px;border-bottom:1px solid #2A3550;">
            <span style="font-size:22px;font-weight:800;color:#FFFFFF;">Syndi</span><span style="font-size:22px;font-weight:800;color:#F5B731;">cade</span>
          </div>
          <div style="padding:32px;">
            <p style="font-size:16px;color:#FFFFFF;font-weight:700;margin:0 0 8px;">Hey ${firstName},</p>
            <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">
              <strong style="color:#FFFFFF;">${orgName}</strong> is two weeks into your free trial — you're halfway through. We wanted to check in and make sure you're getting the most out of it.
            </p>
            <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">
              When you're ready to invite your members and go fully live, our <strong style="color:#FFFFFF;">Starter plan is $14.99/mo</strong> — less than a tank of gas. Annual billing drops it to <strong style="color:#FFFFFF;">$12.49/mo</strong> (2 months free).
            </p>
            <div style="background:rgba(245,183,49,0.08);border:1px solid rgba(245,183,49,0.2);border-radius:12px;padding:16px 20px;margin:0 0 24px;">
              <p style="font-size:13px;font-weight:700;color:#F5B731;margin:0 0 4px;">Verified 501(c)(3)?</p>
              <p style="font-size:13px;color:#94A3B8;margin:0;">You get an extra free month on top of your trial — just submit your EIN at checkout. That's up to 2 months free before you pay a cent.</p>
            </div>
            ${ctaButton('Choose a plan', 'https://syndicade-git-main-syndicades-projects.vercel.app/pricing')}
            <p style="font-size:12px;color:#64748B;margin-top:28px;">
              No pressure — your trial runs through day 30. Reply anytime if you have questions.
            </p>
          </div>
        </div>
      `,
    };
  }

  // Day 30 — final nudge
  return {
    subject: `${orgName} — your Syndicade trial ends today`,
    html: `
      <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;background:#0E1523;color:#CBD5E1;border-radius:16px;overflow:hidden;">
        <div style="background:#151B2D;padding:24px 32px;border-bottom:1px solid #2A3550;">
          <span style="font-size:22px;font-weight:800;color:#FFFFFF;">Syndi</span><span style="font-size:22px;font-weight:800;color:#F5B731;">cade</span>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#FFFFFF;font-weight:700;margin:0 0 8px;">Hey ${firstName},</p>
          <p style="font-size:15px;line-height:1.7;margin:0 0 20px;">
            Your free trial for <strong style="color:#FFFFFF;">${orgName}</strong> ends today. Everything you've set up — your events, documents, member list, and public page — is still here waiting.
          </p>
          <p style="font-size:15px;line-height:1.7;margin:0 0 24px;">
            To keep your community hub running, choose a plan today. It takes about 2 minutes.
          </p>
          <div style="background:#1A2035;border-radius:12px;padding:20px;margin:0 0 24px;">
            ${pricingList()}
          </div>
          <p style="font-size:14px;line-height:1.7;color:#94A3B8;margin:0 0 24px;">
            We never take a cut of your dues, ticket sales, or donations. Stripe fees only. Cancel anytime.
          </p>
          ${ctaButton('Choose a plan now', 'https://syndicade-git-main-syndicades-projects.vercel.app/pricing')}
          <p style="font-size:12px;color:#64748B;margin-top:28px;">
            If you have questions or need more time, just reply to this email. We're happy to help.
          </p>
        </div>
      </div>
    `,
  };
}

function featureList() {
  const features = [
    'Events & RSVP with check-in',
    'Member directory & profiles',
    'Announcements & polls',
    'Document library',
    'Sign-up sheets & volunteer forms',
    'Your public org page',
  ];
  return features.map(f =>
    `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div style="width:18px;height:18px;border-radius:50%;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="color:#22C55E;font-size:11px;font-weight:700;">✓</span>
      </div>
      <span style="font-size:13px;color:#CBD5E1;">${f}</span>
    </div>`
  ).join('');
}

function pricingList() {
  const plans = [
    { name: 'Starter', price: '$14.99/mo', members: '50 members · 5 GB' },
    { name: 'Growth',  price: '$29/mo',    members: '150 members · 15 GB' },
    { name: 'Pro',     price: '$59/mo',    members: '300 members · 50 GB' },
  ];
  return plans.map(p =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #2A3550;">
      <div>
        <span style="font-size:13px;font-weight:700;color:#FFFFFF;">${p.name}</span>
        <span style="font-size:12px;color:#64748B;margin-left:8px;">${p.members}</span>
      </div>
      <span style="font-size:14px;font-weight:700;color:#F5B731;">${p.price}</span>
    </div>`
  ).join('');
}

function ctaButton(label: string, url: string) {
  return `
    <a href="${url}" style="display:inline-block;padding:14px 28px;background:#F5B731;color:#111827;font-size:15px;font-weight:700;border-radius:12px;text-decoration:none;margin-bottom:8px;">
      ${label} →
    </a>
  `;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    let totalSent = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const nudgeDay of NUDGE_DAYS) {
      // Find orgs created exactly nudgeDay days ago (within a 24hr window)
      const windowStart = new Date(now);
      windowStart.setDate(windowStart.getDate() - nudgeDay - 1);
      const windowEnd = new Date(now);
      windowEnd.setDate(windowEnd.getDate() - nudgeDay);

      // Get orgs in this window with no active subscription
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, contact_email')
        .gte('created_at', windowStart.toISOString())
        .lt('created_at', windowEnd.toISOString());

      if (orgsError) {
        errors.push(`Day ${nudgeDay} orgs query: ${orgsError.message}`);
        continue;
      }

      if (!orgs || orgs.length === 0) continue;

      // Filter to orgs with no active subscription
      const orgIds = orgs.map((o: any) => o.id);
      const { data: activeSubs } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('status', 'active');

      const activeOrgIds = new Set((activeSubs || []).map((s: any) => s.organization_id));
      const eligibleOrgs = orgs.filter((o: any) => !activeOrgIds.has(o.id));

      if (eligibleOrgs.length === 0) continue;

      // Check nudge_log to skip already-sent nudges
      const eligibleIds = eligibleOrgs.map((o: any) => o.id);
      const { data: alreadySent } = await supabase
        .from('nudge_log')
        .select('organization_id')
        .in('organization_id', eligibleIds)
        .eq('nudge_day', nudgeDay);

      const alreadySentIds = new Set((alreadySent || []).map((n: any) => n.organization_id));
      const toNudge = eligibleOrgs.filter((o: any) => !alreadySentIds.has(o.id));

      if (toNudge.length === 0) continue;

      // Get admin first names for personalization
      const { data: adminMemberships } = await supabase
        .from('memberships')
        .select('organization_id, member_id, members(first_name)')
        .in('organization_id', toNudge.map((o: any) => o.id))
        .eq('role', 'admin')
        .eq('status', 'active');

      const adminNameMap: Record<string, string> = {};
      (adminMemberships || []).forEach((m: any) => {
        if (!adminNameMap[m.organization_id]) {
          adminNameMap[m.organization_id] = m.members?.first_name || '';
        }
      });

      // Send emails
      for (const org of toNudge) {
        const recipient = TEST_MODE ? TEST_RECIPIENT : org.contact_email;
        if (!recipient) { totalSkipped++; continue; }

        const adminFirstName = adminNameMap[org.id] || '';
        const { subject, html } = getEmailContent(org.name, adminFirstName, nudgeDay);

        const emailSubject = TEST_MODE
          ? `[TEST - Day ${nudgeDay} nudge for ${org.name}] ${subject}`
          : subject;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_ADDRESS,
            to: recipient,
            subject: emailSubject,
            html,
          }),
        });

        if (res.ok) {
          // Log the send so it never fires again for this org + day
          await supabase.from('nudge_log').insert({
            organization_id: org.id,
            nudge_day: nudgeDay,
            recipient_email: org.contact_email,
          });
          totalSent++;
        } else {
          const err = await res.text();
          errors.push(`Org ${org.id} day ${nudgeDay}: ${err}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, skipped: totalSkipped, errors }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});