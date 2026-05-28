import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_ADDRESS = 'Syndicade <noreply@syndicade.org>';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
await supabase.from('login_log').delete().lt('logged_in_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
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

function getNextCloseDate(closedAt: Date, interval: string): Date | null {
  var next = new Date(closedAt);
  if (interval === 'weekly')    { next.setDate(next.getDate() + 7); return next; }
  if (interval === 'monthly')   { next.setMonth(next.getMonth() + 1); return next; }
  if (interval === 'quarterly') { next.setMonth(next.getMonth() + 3); return next; }
  if (interval === 'yearly')    { next.setFullYear(next.getFullYear() + 1); return next; }
  return null;
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

    // ── Dues renewal reminders (7 days before dues_paid_until) ───────────────
    var reminderWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    var { data: duesSoon } = await supabase
      .from('memberships')
      .select('id, member_id, organization_id, tier_id, dues_amount, dues_paid_until, members(email, first_name, last_name, display_name), organizations(name, logo_url, stripe_connect_status, manual_payment_instructions)')
      .eq('dues_paid', true)
      .gte('dues_paid_until', now.toISOString())
      .lte('dues_paid_until', reminderWindow.toISOString());

    for (const membership of duesSoon || []) {
      var duesUntilDate = new Date(membership.dues_paid_until);
      var duesKey = 'dues_reminder_' + membership.id + '_' + duesUntilDate.getFullYear() + '_' + (duesUntilDate.getMonth() + 1);
      var { data: alreadySentDues } = await supabase
        .from('enforcement_log')
        .select('id')
        .eq('event_type', duesKey)
        .maybeSingle();
      if (alreadySentDues) continue;

      var memberEmail = membership.members?.email;
      if (!memberEmail) continue;

      var memberName = membership.members?.display_name ||
        ((membership.members?.first_name || '') + ' ' + (membership.members?.last_name || '')).trim();
      var orgName = membership.organizations?.name || 'Your organization';
      var orgLogoUrl = membership.organizations?.logo_url || '';
      var daysUntilExpiry = Math.ceil((duesUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      var untilStr = duesUntilDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      var paymentSection = '';
      if (membership.organizations?.stripe_connect_status === 'active' && membership.dues_amount && parseFloat(membership.dues_amount) > 0) {
        try {
          var duesSessionRes = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-dues-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organization_id: membership.organization_id,
              member_id: membership.member_id,
              tier_id: membership.tier_id || null,
              amount: membership.dues_amount,
              member_name: memberName,
              member_email: memberEmail,
            }),
          });
          if (duesSessionRes.ok) {
            var duesSessionData = await duesSessionRes.json();
            if (duesSessionData.url) {
              paymentSection =
                '<p style="text-align:center;margin:24px 0 0;">' +
                '<a href="' + duesSessionData.url + '" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">Renew Membership</a>' +
                '</p>';
            }
          }
        } catch (duesLinkErr) {
          console.error('Dues reminder link error:', duesLinkErr);
        }
      }
      if (!paymentSection && membership.organizations?.manual_payment_instructions) {
        paymentSection =
          '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:24px;">' +
          '<p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 8px;">Payment Instructions</p>' +
          '<p style="font-size:13px;color:#6b7280;margin:0;white-space:pre-wrap;">' + membership.organizations.manual_payment_instructions + '</p>' +
          '</div>';
      }

      var duesReminderHtml =
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
        '<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">' +
        '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">' +
        '<tr><td style="background:#0E1523;padding:24px 32px;text-align:center;">' +
        (orgLogoUrl ? '<img src="' + orgLogoUrl + '" alt="' + orgName + '" style="height:48px;border-radius:50%;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" />' : '') +
        '<span style="font-size:20px;font-weight:800;color:#ffffff;">' + orgName + '</span>' +
        '</td></tr>' +
        '<tr><td style="padding:32px;">' +
        '<h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Your membership renews soon</h2>' +
        '<p style="font-size:15px;color:#374151;margin:0 0 8px;">Hi ' + (memberName || 'there') + ', your membership dues expire in <strong>' + daysUntilExpiry + (daysUntilExpiry === 1 ? ' day' : ' days') + '</strong> on ' + untilStr + '.</p>' +
        paymentSection +
        '</td></tr>' +
        '<tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">' +
        '<p style="font-size:12px;color:#9ca3af;margin:0;">Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#374151;font-weight:700;">cade</span></p>' +
        '</td></tr></table></td></tr></table></body></html>';

      await sendEmail(
        memberEmail,
        'Your ' + orgName + ' membership renews in ' + daysUntilExpiry + (daysUntilExpiry === 1 ? ' day' : ' days'),
        duesReminderHtml
      );

      await supabase.from('enforcement_log').insert({
        org_id: membership.organization_id,
        event_type: duesKey,
        notification_sent: 'dues_renewal_reminder',
      });
    }

    // ── K4: Recurring Polls ──────────────────────────────────────────────────
    var yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    var { data: recurringPolls } = await supabase
      .from('polls')
      .select('id, organization_id, title, description, poll_type, visibility, allow_anonymous, show_results_before_close, allow_vote_changes, closes_at, retention_days, result_visibility, recurring_interval, recurring_ends_at, created_by')
      .not('recurring_interval', 'is', null)
      .lt('closes_at', now.toISOString())
      .gte('closes_at', yesterday.toISOString());

    for (var rp of (recurringPolls || [])) {
      if (rp.recurring_ends_at && new Date(rp.recurring_ends_at) <= now) continue;
      var nextClose = getNextCloseDate(new Date(rp.closes_at), rp.recurring_interval);
      if (!nextClose) continue;

      var rpKey = 'recurring_poll_' + rp.id;
      var { data: alreadyCreated } = await supabase
        .from('enforcement_log')
        .select('id')
        .eq('event_type', rpKey)
        .maybeSingle();
      if (alreadyCreated) continue;

      var { data: newPoll } = await supabase
        .from('polls')
        .insert({
          organization_id: rp.organization_id,
          title: rp.title,
          description: rp.description,
          poll_type: rp.poll_type,
          visibility: rp.visibility,
          allow_anonymous: rp.allow_anonymous,
          show_results_before_close: rp.show_results_before_close,
          allow_vote_changes: rp.allow_vote_changes,
          closes_at: nextClose.toISOString(),
          retention_days: rp.retention_days,
          result_visibility: rp.result_visibility,
          recurring_interval: rp.recurring_interval,
          recurring_ends_at: rp.recurring_ends_at,
          status: 'active',
          is_pinned: false,
          created_by: rp.created_by,
          approval_status: 'approved',
        })
        .select('id')
        .single();

      if (newPoll) {
        var { data: srcOptions } = await supabase
          .from('poll_options')
          .select('option_text, display_order')
          .eq('poll_id', rp.id);

        if (srcOptions && srcOptions.length > 0) {
          await supabase.from('poll_options').insert(
            srcOptions.map(function(o: any) {
              return { poll_id: newPoll.id, option_text: o.option_text, display_order: o.display_order };
            })
          );
        }
        await supabase.from('enforcement_log').insert({
          org_id: rp.organization_id,
          event_type: rpKey,
          notification_sent: 'recurring_poll_created',
        });
      }
    }

    // ── K4: Recurring Surveys ────────────────────────────────────────────────
    var { data: recurringSurveys } = await supabase
      .from('surveys')
      .select('id, organization_id, title, description, anonymous_responses, allow_multiple_responses, show_results_after_submission, closes_at, retention_days, visibility, result_visibility, recurring_interval, recurring_ends_at, created_by')
      .not('recurring_interval', 'is', null)
      .lt('closes_at', now.toISOString())
      .gte('closes_at', yesterday.toISOString());

    for (var rs of (recurringSurveys || [])) {
      if (rs.recurring_ends_at && new Date(rs.recurring_ends_at) <= now) continue;
      var nextSurveyClose = getNextCloseDate(new Date(rs.closes_at), rs.recurring_interval);
      if (!nextSurveyClose) continue;

      var rsKey = 'recurring_survey_' + rs.id;
      var { data: surveyAlreadyCreated } = await supabase
        .from('enforcement_log')
        .select('id')
        .eq('event_type', rsKey)
        .maybeSingle();
      if (surveyAlreadyCreated) continue;

      var { data: newSurvey } = await supabase
        .from('surveys')
        .insert({
          organization_id: rs.organization_id,
          title: rs.title,
          description: rs.description,
          anonymous_responses: rs.anonymous_responses,
          allow_multiple_responses: rs.allow_multiple_responses,
          show_results_after_submission: rs.show_results_after_submission,
          closes_at: nextSurveyClose.toISOString(),
          retention_days: rs.retention_days,
          visibility: rs.visibility,
          result_visibility: rs.result_visibility,
          recurring_interval: rs.recurring_interval,
          recurring_ends_at: rs.recurring_ends_at,
          status: 'active',
          is_pinned: false,
          created_by: rs.created_by,
          approval_status: 'approved',
        })
        .select('id')
        .single();

      if (newSurvey) {
        var { data: srcQuestions } = await supabase
          .from('survey_questions')
          .select('question_text, question_type, required, options, order_number')
          .eq('survey_id', rs.id)
          .order('order_number', { ascending: true });

        if (srcQuestions && srcQuestions.length > 0) {
          await supabase.from('survey_questions').insert(
            srcQuestions.map(function(q: any) {
              return {
                survey_id: newSurvey.id,
                question_text: q.question_text,
                question_type: q.question_type,
                required: q.required,
                options: q.options,
                order_number: q.order_number,
                condition_question_id: null,
                condition_answer: null,
              };
            })
          );
        }
        await supabase.from('enforcement_log').insert({
          org_id: rs.organization_id,
          event_type: rsKey,
          notification_sent: 'recurring_survey_created',
        });
      }
    }

    // ── Document Pre-Deletion Warning Email (≤3 days before auto-delete) ────────
    var warnTodayStr = now.toISOString().split('T')[0];
    var warnDateStr = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    var { data: warnDocs } = await supabase
      .from('documents')
      .select('id, organization_id, title, delete_after')
      .eq('auto_delete_notified', false)
      .not('delete_after', 'is', null)
      .gt('delete_after', warnTodayStr)
      .lte('delete_after', warnDateStr);

    for (var warnDoc of (warnDocs || [])) {
      // Get org admin emails
      var { data: adminRows } = await supabase
        .from('memberships')
        .select('member_id, members(email, display_name, first_name)')
        .eq('organization_id', warnDoc.organization_id)
        .eq('role', 'admin')
        .eq('status', 'active');

      var deleteDate = new Date(warnDoc.delete_after + 'T00:00:00');
      var daysUntilDelete = Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      var deleteDateStr = deleteDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      var libUrl = 'https://syndicade.org/organizations/' + warnDoc.organization_id + '/documents';

      for (var adminRow of (adminRows || [])) {
        var adminEmail = (adminRow.members as any)?.email;
        if (!adminEmail) continue;

        await sendEmail(
          adminEmail,
          'Document expiring in ' + daysUntilDelete + (daysUntilDelete === 1 ? ' day' : ' days') + ': ' + warnDoc.title,
          '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
          '<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">' +
          '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;"><tr><td align="center">' +
          '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">' +
          '<tr><td style="background:#0E1523;padding:24px 32px;text-align:center;">' +
          '<span style="font-size:20px;font-weight:800;color:#F5B731;">Syndi</span><span style="font-size:20px;font-weight:800;color:#ffffff;">cade</span>' +
          '</td></tr>' +
          '<tr><td style="padding:32px;">' +
          '<h2 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111827;">Document scheduled for deletion</h2>' +
          '<p style="font-size:15px;color:#374151;margin:0 0 16px;">The following document will be <strong>automatically deleted on ' + deleteDateStr + '</strong> (' + daysUntilDelete + (daysUntilDelete === 1 ? ' day' : ' days') + ' away):</p>' +
          '<div style="background:#FEF9C3;border:1px solid rgba(245,183,49,0.3);border-radius:8px;padding:16px;margin:0 0 16px;">' +
          '<p style="font-size:15px;font-weight:700;color:#0E1523;margin:0;">' + warnDoc.title + '</p>' +
          '</div>' +
          '<p style="font-size:14px;color:#475569;margin:0 0 24px;">To keep this document, open the Document Library and remove the auto-delete date.</p>' +
          '<p style="text-align:center;margin:0;">' +
          '<a href="' + libUrl + '" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">Go to Document Library</a>' +
          '</p>' +
          '</td></tr>' +
          '<tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">' +
          '<p style="font-size:12px;color:#9ca3af;margin:0;">Powered by <span style="color:#F5B731;font-weight:700;">Syndi</span><span style="color:#374151;font-weight:700;">cade</span></p>' +
          '</td></tr></table></td></tr></table></body></html>'
        );
      }

      // Mark as notified — prevents duplicate emails even if cron runs again
      await supabase
        .from('documents')
        .update({ auto_delete_notified: true })
        .eq('id', warnDoc.id);

      console.log('Pre-deletion warning sent for: "' + warnDoc.title + '" (' + warnDoc.id + ')');
    }

// ── Document Auto-Delete ─────────────────────────────────────────────────
    // Deletes any document whose delete_after date is today or in the past
    var todayDateStr = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    var { data: expiredDocs } = await supabase
      .from('documents')
      .select('id, organization_id, storage_path, title')
      .not('delete_after', 'is', null)
      .lte('delete_after', todayDateStr);

    for (var expDoc of (expiredDocs || [])) {
      var docKey = 'doc_autodelete_' + expDoc.id;

      // Idempotency — skip if already processed
      var { data: alreadyAutoDeleted } = await supabase
        .from('enforcement_log')
        .select('id')
        .eq('event_type', docKey)
        .maybeSingle();
      if (alreadyAutoDeleted) continue;

      // 1. Delete the file from storage bucket
      if (expDoc.storage_path) {
        var { error: storageErr } = await supabase.storage
          .from('documents')
          .remove([expDoc.storage_path]);
        if (storageErr) {
          console.error('Storage delete failed for doc ' + expDoc.id + ':', storageErr.message);
        }
      }

      // 2. Delete the DB record
      var { error: docDbErr } = await supabase
        .from('documents')
        .delete()
        .eq('id', expDoc.id);

      if (docDbErr) {
        console.error('DB delete failed for doc ' + expDoc.id + ':', docDbErr.message);
        continue;
      }

      // 3. Log the deletion
      await supabase.from('enforcement_log').insert({
        org_id: expDoc.organization_id,
        event_type: docKey,
        notification_sent: 'doc_autodelete',
      });
      console.log('Auto-deleted document: "' + expDoc.title + '" (' + expDoc.id + ')');
    }
    return new Response(JSON.stringify({ ok: true, processed: orgs?.length || 0 }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('enforce-subscriptions error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
