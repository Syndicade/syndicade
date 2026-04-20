import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Days before expiry to send countdown emails
const COUNTDOWN_DAYS = [7, 5, 3, 2, 1];
// Days after expiry to send post-expiry emails
const POST_EXPIRY_DAYS = [0, 25, 30];

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html })
  });
}

async function logEvent(orgId: string, eventType: string, notificationSent?: string, token?: string, tokenExpiresAt?: string) {
  await supabase.from('enforcement_log').insert({
    org_id: orgId,
    event_type: eventType,
    notification_sent: notificationSent || null,
    token: token || null,
    token_expires_at: tokenExpiresAt || null
  });
}

async function alreadySent(orgId: string, eventType: string): Promise<boolean> {
  const { data } = await supabase
    .from('enforcement_log')
    .select('id')
    .eq('org_id', orgId)
    .eq('event_type', eventType)
    .maybeSingle();
  return !!data;
}

serve(async (req) => {
  try {
    // Fetch all orgs with trial_started_at set and no active subscription
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, contact_email, trial_started_at, trial_length_days, account_status')
      .not('trial_started_at', 'is', null);

    if (error) throw error;

    const now = new Date();

    for (const org of orgs || []) {
      // Check for active subscription — skip if subscribed
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', org.id)
        .eq('status', 'active')
        .maybeSingle();

      if (sub) continue;

      const trialDays = org.trial_length_days || 14;
      const trialStart = new Date(org.trial_started_at);
      const trialEnd = new Date(trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);
      const msLeft = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      const daysPast = Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24));

      // ── Pro upsell — Day 2 of trial ──────────────────────────────────────
      const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysSinceStart >= 1) {
        const eventType = 'pro_upsell_day2';
        const alreadyDone = await alreadySent(org.id, eventType);
        if (!alreadyDone && org.contact_email) {
          // Generate token and store it
          const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
          await supabase.from('pro_upsell_tokens').insert({
            organization_id: org.id,
            token: token
          });
          const activateUrl = 'https://syndicade.org/activate-pro?token=' + token + '&org=' + org.id;
          await sendEmail(
            org.contact_email,
            'Unlock everything — upgrade to Pro free for 30 days',
            '<p>Hi ' + org.name + ',</p>' +
            '<p>You\'re 2 days into your Syndicade trial — great start! We\'d love to show you what <strong>Pro</strong> can do.</p>' +
            '<p>For a limited time, you can activate a <strong>free 30-day Pro trial</strong> — no credit card required. Get unlimited emails, AI content assistant, custom domain, and priority support.</p>' +
            '<p><a href="' + activateUrl + '" style="background:#F5B731;color:#111827;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Activate Free Pro Trial</a></p>' +
            '<p>This link is unique to your account and expires with your trial.</p>' +
            '<p>— The Syndicade Team</p>'
          );
          await logEvent(org.id, eventType, 'pro_upsell_day2');
        }
      }

      // ── Countdown emails (before expiry) ──────────────────────────────────
      if (daysLeft > 0 && COUNTDOWN_DAYS.includes(daysLeft)) {
        const eventType = 'countdown_' + daysLeft + 'd';
        const alreadyDone = await alreadySent(org.id, eventType);
        if (!alreadyDone && org.contact_email) {
          await sendEmail(
            org.contact_email,
            'Your Syndicade trial ends in ' + daysLeft + (daysLeft === 1 ? ' day' : ' days'),
            '<p>Hi ' + org.name + ',</p>' +
            '<p>Your free trial ends in <strong>' + daysLeft + (daysLeft === 1 ? ' day' : ' days') + '</strong>.</p>' +
            '<p>Subscribe now to keep full access to your member portal, events, announcements, and more.</p>' +
            '<p><a href="https://syndicade.com/pricing" style="background:#3B82F6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Choose a Plan</a></p>' +
            '<p>Questions? Reply to this email — we\'re happy to help.</p>' +
            '<p>— The Syndicade Team</p>'
          );
          await logEvent(org.id, eventType, 'countdown_' + daysLeft + 'd');
        }
      }

      // ── Day of expiry ─────────────────────────────────────────────────────
      if (daysLeft <= 0 && daysPast === 0) {
        const eventType = 'expired_day0';
        const alreadyDone = await alreadySent(org.id, eventType);
        if (!alreadyDone && org.contact_email) {
          await sendEmail(
            org.contact_email,
            'Your Syndicade trial has ended — keep your community going',
            '<p>Hi ' + org.name + ',</p>' +
            '<p>Your free trial has ended. Your org is now in <strong>read-only mode</strong> for up to 30 days.</p>' +
            '<p>Subscribe now to restore full access instantly.</p>' +
            '<p><a href="https://syndicade.com/pricing" style="background:#3B82F6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Reactivate Now</a></p>' +
            '<p>— The Syndicade Team</p>'
          );
          await logEvent(org.id, eventType, 'expired_day0');
        }

        // Update account_status to expired
        await supabase.from('organizations').update({ account_status: 'expired' }).eq('id', org.id);
      }

      // ── Grace period emails (day 25 and 30) ───────────────────────────────
      if (daysPast === 25) {
        const eventType = 'grace_day25';
        const alreadyDone = await alreadySent(org.id, eventType);
        if (!alreadyDone && org.contact_email) {
          await sendEmail(
            org.contact_email,
            'Your Syndicade account will be frozen in 5 days',
            '<p>Hi ' + org.name + ',</p>' +
            '<p>Your account will be <strong>frozen in 5 days</strong>. After that, all features will be locked until you subscribe.</p>' +
            '<p>Your data is safe — but act now to avoid any interruption.</p>' +
            '<p><a href="https://syndicade.com/pricing" style="background:#EF4444;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Subscribe Before It\'s Frozen</a></p>' +
            '<p>— The Syndicade Team</p>'
          );
          await logEvent(org.id, eventType, 'grace_day25');
        }
      }

      if (daysPast >= 30) {
        const eventType = 'iced_day30';
        const alreadyDone = await alreadySent(org.id, eventType);
        if (!alreadyDone && org.contact_email) {
          await sendEmail(
            org.contact_email,
            'Your Syndicade account is now frozen',
            '<p>Hi ' + org.name + ',</p>' +
            '<p>Your account is now <strong>frozen</strong>. All features are locked, but your data is safe.</p>' +
            '<p>Subscribe at any time to restore full access instantly.</p>' +
            '<p><a href="https://syndicade.com/pricing" style="background:#3B82F6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Reactivate Your Account</a></p>' +
            '<p>— The Syndicade Team</p>'
          );
          await logEvent(org.id, eventType, 'iced_day30');
        }
        // Update account_status to iced
        await supabase.from('organizations').update({ account_status: 'iced' }).eq('id', org.id);
      }
      // ── Student plan pause activation ─────────────────────────────────────
      if (org.account_status !== 'paused') {
        const { data: pauseOrg } = await supabase
          .from('organizations')
          .select('pause_starts_at, pause_months_used_this_year, pause_year, edu_email_verified')
          .eq('id', org.id)
          .maybeSingle();

        if (pauseOrg && pauseOrg.pause_starts_at) {
          const pauseStart = new Date(pauseOrg.pause_starts_at);
          if (pauseStart <= now) {
            // Check 6-month annual limit
            const currentYear = now.getFullYear();
            var monthsUsed = (pauseOrg.pause_year === currentYear ? pauseOrg.pause_months_used_this_year : 0) || 0;
            if (monthsUsed < 6) {
              // Pause the Stripe subscription
              const { data: subRow } = await supabase
                .from('subscriptions')
                .select('stripe_subscription_id, stripe_customer_id')
                .eq('organization_id', org.id)
                .eq('status', 'active')
                .maybeSingle();

              if (subRow && subRow.stripe_subscription_id) {
                try {
                  await fetch('https://api.stripe.com/v1/subscriptions/' + subRow.stripe_subscription_id, {
                    method: 'POST',
                    headers: {
                      'Authorization': 'Bearer ' + Deno.env.get('STRIPE_SECRET_KEY'),
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      'pause_collection[behavior]': 'void',
                    }).toString(),
                  });
                } catch (stripeErr) {
                  console.error('Stripe pause error:', stripeErr);
                }
              }

              await supabase.from('organizations').update({
                account_status: 'paused',
                pause_year: currentYear,
              }).eq('id', org.id);

              await logEvent(org.id, 'student_pause_activated');

              if (org.contact_email) {
                await sendEmail(
                  org.contact_email,
                  'Your Syndicade account is now paused',
                  '<p>Hi ' + org.name + ',</p>' +
                  '<p>Your account has been paused as requested. You won\'t be charged while your account is paused.</p>' +
                  '<p>Your data is safe and waiting for you. Log in any time to resume your account.</p>' +
                  '<p><a href="https://syndicade.org" style="background:#3B82F6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Resume My Account</a></p>' +
                  '<p>— The Syndicade Team</p>'
                );
              }
            }
          }
        }
      }

      // ── Student plan pause resume ──────────────────────────────────────────
      if (org.account_status === 'paused') {
        const { data: pauseOrg } = await supabase
          .from('organizations')
          .select('pause_starts_at, pause_resumes_at, pause_months_used_this_year, pause_year')
          .eq('id', org.id)
          .maybeSingle();

        if (pauseOrg && pauseOrg.pause_resumes_at) {
          const resumeDate = new Date(pauseOrg.pause_resumes_at);
          if (resumeDate <= now) {
            // Calculate months paused
            var monthsPaused = 0;
            if (pauseOrg.pause_starts_at) {
              var pausedMs = resumeDate.getTime() - new Date(pauseOrg.pause_starts_at).getTime();
              monthsPaused = Math.ceil(pausedMs / (1000 * 60 * 60 * 24 * 30));
            }

            const currentYear = now.getFullYear();
            var monthsUsed = (pauseOrg.pause_year === currentYear ? pauseOrg.pause_months_used_this_year : 0) || 0;

            // Resume Stripe subscription
            const { data: subRow } = await supabase
              .from('subscriptions')
              .select('stripe_subscription_id')
              .eq('organization_id', org.id)
              .maybeSingle();

            if (subRow && subRow.stripe_subscription_id) {
              try {
                await fetch('https://api.stripe.com/v1/subscriptions/' + subRow.stripe_subscription_id, {
                  method: 'POST',
                  headers: {
                    'Authorization': 'Bearer ' + Deno.env.get('STRIPE_SECRET_KEY'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    'pause_collection': '',
                  }).toString(),
                });
              } catch (stripeErr) {
                console.error('Stripe resume error:', stripeErr);
              }
            }

            await supabase.from('organizations').update({
              account_status: 'subscribed',
              pause_starts_at: null,
              pause_resumes_at: null,
              pause_scheduled_at: null,
              pause_months_used_this_year: monthsUsed + monthsPaused,
              pause_year: currentYear,
            }).eq('id', org.id);

            await logEvent(org.id, 'student_pause_resumed');

            if (org.contact_email) {
              await sendEmail(
                org.contact_email,
                'Welcome back — your Syndicade account is active',
                '<p>Hi ' + org.name + ',</p>' +
                '<p>Your account has been resumed and billing is active again. Welcome back!</p>' +
                '<p><a href="https://syndicade.org" style="background:#22C55E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:700;">Go to My Dashboard</a></p>' +
                '<p>— The Syndicade Team</p>'
              );
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: orgs?.length || 0 }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('enforce-subscriptions error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
