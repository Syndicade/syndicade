import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  check:    'M5 13l4 4L19 7',
  star:     ['M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'],
  alert:    ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  settings: ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  back:     'M15 19l-7-7 7-7',
  pause:    'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
  play:     'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

var PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29.99,
    annualPrice: 299.90,
    annualMonthly: 24.99,
    members: 50,
    storage: '2 GB',
    features: ['Events, polls, surveys, announcements', 'Document library', 'Member directory & sign-up forms', 'RSVP & check-in', 'Recurring events', 'orgname.syndicade.org subdomain'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 49.99,
    annualPrice: 499.90,
    annualMonthly: 41.66,
    members: 150,
    storage: '10 GB',
    popular: true,
    features: ['Everything in Starter', 'Paid event tickets', 'Email blasts & newsletter builder', 'Full analytics & reports', 'Membership dues collection', 'Admin inbox'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 69.99,
    annualPrice: 699.90,
    annualMonthly: 58.32,
    members: 300,
    storage: '30 GB',
    features: ['Everything in Growth', 'Custom domain included', 'Remove Syndicade branding', 'Unlimited email blasts', 'AI content assistant', 'Priority support'],
  },
  {
    id: 'student',
    name: 'Student',
    monthlyPrice: 19.99,
    annualPrice: null,
    annualMonthly: null,
    members: 50,
    storage: '2 GB',
    popular: false,
    isStudent: true,
    features: ['All Starter features included', 'Pause up to 6 months/year', 'No charges while paused', '.edu email required'],
  },
];

var STATUS_LABELS = {
  trialing:   { label: 'Free Trial',  color: 'bg-blue-100 text-blue-700'    },
  active:     { label: 'Active',      color: 'bg-green-100 text-green-700'  },
  paused:     { label: 'Paused',      color: 'bg-yellow-100 text-yellow-700'},
  past_due:   { label: 'Past Due',    color: 'bg-red-100 text-red-700'      },
  canceled:   { label: 'Canceled',    color: 'bg-slate-100 text-slate-600'  },
  incomplete: { label: 'Incomplete',  color: 'bg-yellow-100 text-yellow-700'},
};

function BillingPage() {
  var { organizationId } = useParams();
  var navigate = useNavigate();
  var [searchParams] = useSearchParams();

  var [subscription, setSubscription] = useState(null);
  var [orgData, setOrgData] = useState(null);
  var [loading, setLoading] = useState(true);
  var [checkoutLoading, setCheckoutLoading] = useState(null);
  var [billingInterval, setBillingInterval] = useState('month');
  var [memberCount, setMemberCount] = useState(0);

  // Pause scheduling state
  var [showPauseModal, setShowPauseModal] = useState(false);
  var [pauseResumeDate, setPauseResumeDate] = useState('');
  var [pauseLoading, setPauseLoading] = useState(false);

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  useEffect(function() {
    var billing = searchParams.get('billing');
    if (billing === 'success') {
      mascotSuccessToast('Subscription started!', 'Welcome to Syndicade.');
      loadData();
    } else if (billing === 'cancelled') {
      toast('Checkout cancelled.');
    }
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    try {
      var [orgResult, subResult, memberCountResult] = await Promise.all([
        supabase.from('organizations').select('name, account_status, pause_starts_at, pause_resumes_at, pause_months_used_this_year, pause_year, pause_scheduled_at').eq('id', organizationId).single(),
        supabase.from('subscriptions').select('*').eq('organization_id', organizationId).maybeSingle(),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active'),
      ]);
      if (orgResult.data) setOrgData(orgResult.data);
      setSubscription(subResult.data || null);
      setMemberCount(memberCountResult.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlan(planId) {
    var interval = (planId === 'student') ? 'month' : billingInterval;
    setCheckoutLoading(planId);
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please log in to continue.'); return; }

      var response = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({
          organization_id: organizationId,
          plan: planId,
          interval: interval,
          success_url: window.location.origin + '/organizations/' + organizationId + '/billing?billing=success',
          cancel_url: window.location.origin + '/organizations/' + organizationId + '/billing?billing=cancelled',
        }),
      });

      var data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      mascotErrorToast(err.message || 'Failed to start checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageSubscription() {
    setCheckoutLoading('portal');
    try {
      var { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please log in to continue.'); return; }

      var response = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({ organization_id: organizationId, return_url: window.location.href }),
      });

      var data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to open billing portal');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      mascotErrorToast(err.message || 'Failed to open billing portal.');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleSchedulePause() {
    if (!pauseResumeDate) { toast.error('Please select a resume date.'); return; }
    setPauseLoading(true);
    try {
      var now = new Date();
      var pauseStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      var currentYear = now.getFullYear();
      var monthsUsed = (orgData.pause_year === currentYear ? orgData.pause_months_used_this_year : 0) || 0;
      var resumeDate = new Date(pauseResumeDate);
      var monthsRequested = Math.ceil((resumeDate - pauseStart) / (1000 * 60 * 60 * 24 * 30));
      if (monthsUsed + monthsRequested > 6) {
        toast.error('You can only pause up to 6 months per year. You have ' + (6 - monthsUsed) + ' months remaining.');
        return;
      }

      var { error } = await supabase.from('organizations').update({
        pause_scheduled_at: new Date().toISOString(),
        pause_starts_at: pauseStart.toISOString(),
        pause_resumes_at: resumeDate.toISOString(),
      }).eq('id', organizationId);

      if (error) throw error;
      mascotSuccessToast('Pause scheduled!', 'Billing stops ' + pauseStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + '.');
      setShowPauseModal(false);
      setPauseResumeDate('');
      loadData();
    } catch (err) {
      mascotErrorToast('Failed to schedule pause. Try again.');
    } finally {
      setPauseLoading(false);
    }
  }

  async function handleCancelPause() {
    setPauseLoading(true);
    try {
      var { error } = await supabase.from('organizations').update({
        pause_scheduled_at: null,
        pause_starts_at: null,
        pause_resumes_at: null,
      }).eq('id', organizationId);
      if (error) throw error;
      mascotSuccessToast('Pause cancelled.', 'Your billing will continue as normal.');
      loadData();
    } catch (err) {
      mascotErrorToast('Failed to cancel pause.');
    } finally {
      setPauseLoading(false);
    }
  }

  var currentPlan = PLANS.find(function(p) { return p.id === (subscription && subscription.plan); }) || null;
  var statusInfo = subscription ? (STATUS_LABELS[subscription.status] || STATUS_LABELS['active']) : null;
  var orgStatus = orgData && orgData.account_status;
  var isPaused = orgStatus === 'paused';
  var hasPauseScheduled = orgData && orgData.pause_starts_at && !isPaused;
  var isStudent = subscription && subscription.plan === 'student';
  var trialEnds = subscription && subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  var periodEnds = subscription && subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  var daysLeftInTrial = trialEnds ? Math.max(0, Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  var planMemberLimit = currentPlan ? currentPlan.members : null;
  var memberOverage = planMemberLimit !== null && memberCount > planMemberLimit ? memberCount - planMemberLimit : 0;
  var overageCost = memberOverage * 1;

  var currentYear = new Date().getFullYear();
  var monthsUsedThisYear = (orgData && orgData.pause_year === currentYear ? orgData.pause_months_used_this_year : 0) || 0;
  var pauseMonthsRemaining = Math.max(0, 6 - monthsUsedThisYear);

  var minResumeDate = new Date();
  minResumeDate.setMonth(minResumeDate.getMonth() + 2);
  minResumeDate.setDate(1);
  var minResumeDateStr = minResumeDate.toISOString().split('T')[0];

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen py-8 bg-[#F8FAFC]" aria-busy="true" aria-label="Loading billing">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <div className="animate-pulse rounded h-6 w-16 bg-slate-200" aria-hidden="true" />
          <div className="animate-pulse rounded-xl h-32 w-full bg-slate-200" aria-hidden="true" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(function(i) { return <div key={i} className="animate-pulse rounded-xl h-80 bg-slate-200" aria-hidden="true" />; })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 space-y-8">

        {/* Header */}
        <div>
          <button
            onClick={function() { navigate(-1); }}
            className="text-sm flex items-center gap-1 mb-4 text-[#475569] hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
            aria-label="Go back"
          >
            <Icon path={ICONS.back} className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-[#0E1523]">Billing &amp; Subscription</h1>
          <p className="text-sm mt-1 text-[#475569]">{orgData && orgData.name}</p>
        </div>

        {/* Current subscription status card */}
        {subscription && (
          <div className={'p-5 rounded-xl border-2 ' + (subscription.status === 'past_due'
            ? 'border-red-300 bg-red-50'
            : isPaused
              ? 'border-yellow-300 bg-yellow-50'
              : 'border-blue-200 bg-blue-50')}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-base font-bold text-[#0E1523]">
                    {currentPlan ? currentPlan.name : 'Unknown'} Plan
                  </span>
                  {statusInfo && (
                    <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' + statusInfo.color}>
                      {isPaused ? 'Paused' : statusInfo.label}
                    </span>
                  )}
                  {isStudent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      .edu
                    </span>
                  )}
                </div>

                {isPaused && orgData && orgData.pause_resumes_at && (
                  <p className="text-sm flex items-center gap-1 text-yellow-700">
                    <Icon path={ICONS.play} className="h-4 w-4" />
                    {'Resumes ' + new Date(orgData.pause_resumes_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                {hasPauseScheduled && (
                  <p className="text-sm flex items-center gap-1 text-yellow-700">
                    <Icon path={ICONS.pause} className="h-4 w-4" />
                    {'Pause scheduled ' + new Date(orgData.pause_starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' · Resumes ' + new Date(orgData.pause_resumes_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                {subscription.status === 'trialing' && trialEnds && !isPaused && (
                  <p className="text-sm flex items-center gap-1 text-blue-700">
                    <Icon path={ICONS.clock} className="h-4 w-4" />
                    {daysLeftInTrial > 0 ? daysLeftInTrial + ' days left in your free trial' : 'Trial ending soon'}
                    {' · No credit card required yet'}
                  </p>
                )}

                {subscription.status === 'active' && periodEnds && !isPaused && !hasPauseScheduled && (
                  <p className="text-sm text-[#475569]">
                    {'Renews ' + periodEnds.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {subscription.cancel_at_period_end ? ' · Cancels at end of period' : ''}
                  </p>
                )}

                {subscription.status === 'past_due' && (
                  <p className="text-sm flex items-center gap-1 text-red-700">
                    <Icon path={ICONS.alert} className="h-4 w-4" />
                    Payment failed. Please update your payment method.
                  </p>
                )}

                {memberOverage > 0 && (
                  <div className="mt-3 p-3 rounded-lg border bg-red-50 border-red-200">
                    <p className="text-sm font-semibold text-red-700">
                      {'Member overage: ' + memberOverage + ' ' + (memberOverage === 1 ? 'member' : 'members') + ' over plan limit'}
                    </p>
                    <p className="text-xs mt-0.5 text-red-600">
                      {'$' + overageCost + '/mo extra · $1 per member over your ' + planMemberLimit + '-member limit. Upgrade to avoid overage charges.'}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={handleManageSubscription}
                    disabled={checkoutLoading === 'portal'}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#0E1523] hover:bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    aria-label="Manage subscription in Stripe portal"
                  >
                    <Icon path={ICONS.settings} className="h-4 w-4" />
                    {checkoutLoading === 'portal' ? 'Loading...' : 'Manage Subscription'}
                  </button>

                  {isStudent && !isPaused && !hasPauseScheduled && pauseMonthsRemaining > 0 && (
                    <button
                      onClick={function() { setShowPauseModal(true); }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-yellow-400 text-yellow-700 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                      aria-label="Schedule a pause for your account"
                    >
                      <Icon path={ICONS.pause} className="h-4 w-4" />
                      Schedule Pause
                    </button>
                  )}

                  {isStudent && hasPauseScheduled && (
                    <button
                      onClick={handleCancelPause}
                      disabled={pauseLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                      aria-label="Cancel scheduled pause"
                    >
                      {pauseLoading ? 'Cancelling...' : 'Cancel Pause'}
                    </button>
                  )}
                </div>

                {isStudent && (
                  <p className="text-xs mt-3 text-[#94A3B8]">
                    {'Pause available: ' + pauseMonthsRemaining + ' of 6 months remaining this year'}
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xs uppercase tracking-wide font-semibold text-[#64748B]">
                  {subscription.billing_interval === 'year' ? 'Annual billing' : 'Monthly billing'}
                </p>
                {currentPlan && (
                  <p className="text-lg font-bold text-[#0E1523]">
                    {'$' + (subscription.billing_interval === 'year' ? currentPlan.annualPrice.toFixed(2) + '/yr' : currentPlan.monthlyPrice.toFixed(2) + '/mo')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pause scheduling modal */}
        {showPauseModal && (
          <div
            style={{ background:'rgba(0,0,0,0.45)' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 p-6 bg-white shadow-xl">
              <h2 id="pause-modal-title" className="text-lg font-bold mb-2 text-[#0E1523]">Schedule Account Pause</h2>
              <p className="text-sm mb-4 text-[#475569]">
                Billing stops at the start of your next billing cycle. Select the date you want to resume — your account reactivates automatically.
              </p>

              <div className="p-3 rounded-lg mb-4 bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold mb-1 text-[#64748B]">Pause starts</p>
                <p className="text-sm font-bold text-[#0E1523]">
                  {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs mt-1 text-[#94A3B8]">Billing stops on this date. Current month is not refunded.</p>
              </div>

              <label htmlFor="resume-date" className="block text-sm font-semibold mb-1 text-[#0E1523]">
                Resume date
              </label>
              <input
                id="resume-date"
                type="date"
                min={minResumeDateStr}
                value={pauseResumeDate}
                onChange={function(e) { setPauseResumeDate(e.target.value); }}
                aria-required="true"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[#0E1523] text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs mb-5 text-[#94A3B8]">
                {'You have ' + pauseMonthsRemaining + ' pause months remaining this year.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleSchedulePause}
                  disabled={pauseLoading || !pauseResumeDate}
                  className="flex-1 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50"
                  aria-label="Confirm pause schedule"
                >
                  {pauseLoading ? 'Scheduling...' : 'Schedule Pause'}
                </button>
                <button
                  onClick={function() { setShowPauseModal(false); setPauseResumeDate(''); }}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  aria-label="Cancel and close"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No subscription — trial callout */}
        {!subscription && (
          <div className="p-5 rounded-xl border-2 border-yellow-300 bg-yellow-50">
            <div className="flex items-center gap-3">
              <Icon path={ICONS.star} className="h-6 w-6 flex-shrink-0 text-yellow-500" />
              <div>
                <p className="font-bold text-[#0E1523]">Start your 14-day free trial</p>
                <p className="text-sm mt-0.5 text-[#475569]">No credit card required. Full access to all features during your trial.</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing interval toggle — hidden for student plan */}
        {subscription && subscription.plan !== 'student' && (
          <div className="flex items-center justify-center gap-3">
            <span className={'text-sm font-medium ' + (billingInterval === 'month' ? 'text-[#0E1523]' : 'text-[#94A3B8]')}>Monthly</span>
            <button
              onClick={function() { setBillingInterval(billingInterval === 'month' ? 'year' : 'month'); }}
              role="switch"
              aria-checked={billingInterval === 'year'}
              aria-label="Toggle annual billing"
              className={'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (billingInterval === 'year' ? 'bg-blue-500' : 'bg-slate-300')}
            >
              <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ' + (billingInterval === 'year' ? 'left-[26px]' : 'left-0.5')} aria-hidden="true" />
            </button>
            <span className={'text-sm font-medium ' + (billingInterval === 'year' ? 'text-[#0E1523]' : 'text-[#94A3B8]')}>
              Annual
              <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">2 months free</span>
            </span>
          </div>
        )}

        {/* Also show toggle when no subscription yet */}
        {!subscription && (
          <div className="flex items-center justify-center gap-3">
            <span className={'text-sm font-medium ' + (billingInterval === 'month' ? 'text-[#0E1523]' : 'text-[#94A3B8]')}>Monthly</span>
            <button
              onClick={function() { setBillingInterval(billingInterval === 'month' ? 'year' : 'month'); }}
              role="switch"
              aria-checked={billingInterval === 'year'}
              aria-label="Toggle annual billing"
              className={'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (billingInterval === 'year' ? 'bg-blue-500' : 'bg-slate-300')}
            >
              <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ' + (billingInterval === 'year' ? 'left-[26px]' : 'left-0.5')} aria-hidden="true" />
            </button>
            <span className={'text-sm font-medium ' + (billingInterval === 'year' ? 'text-[#0E1523]' : 'text-[#94A3B8]')}>
              Annual
              <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">2 months free</span>
            </span>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Available plans">
          {PLANS.map(function(plan) {
            var isCurrent = subscription && subscription.plan === plan.id && subscription.status !== 'canceled';
            var isLoading = checkoutLoading === plan.id;
            var price = (plan.isStudent || billingInterval === 'month') ? plan.monthlyPrice : plan.annualMonthly;
            var totalPrice = (!plan.isStudent && billingInterval === 'year') ? plan.annualPrice : null;

            return (
              <div
                key={plan.id}
                role="listitem"
                className={'relative flex flex-col rounded-xl border-2 overflow-hidden bg-white ' + (plan.popular ? 'border-blue-500 shadow-md' : 'border-slate-200') + (isCurrent ? ' ring-2 ring-green-400' : '')}
              >
                {plan.popular && !isCurrent && (
                  <div className="bg-blue-500 text-white text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    Most Popular
                  </div>
                )}
                {plan.isStudent && !isCurrent && (
                  <div className="bg-blue-100 text-blue-700 text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    Student — .edu required
                  </div>
                )}
                {isCurrent && (
                  <div className="bg-green-500 text-white text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    Current Plan
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold mb-1 text-[#0E1523]">{plan.name}</h3>
                  <p className="text-xs mb-4 text-[#64748B]">Up to {plan.members} members · {plan.storage}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-[#0E1523]">{'$' + price.toFixed(2)}</span>
                    <span className="text-sm text-[#475569]">/mo</span>
                    {totalPrice && (
                      <p className="text-xs mt-0.5 text-[#94A3B8]">{'$' + totalPrice.toFixed(2) + ' billed annually'}</p>
                    )}
                    {plan.isStudent && (
                      <p className="text-xs mt-0.5 text-[#94A3B8]">Monthly only · Pause up to 6 mo/yr</p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1" aria-label={plan.name + ' features'}>
                    {plan.features.map(function(feature, i) {
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                          <Icon path={ICONS.check} className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    onClick={function() { if (!isCurrent) handleSelectPlan(plan.id); }}
                    disabled={isCurrent || isLoading || isPaused}
                    className={'w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ' + (isCurrent
                      ? 'bg-green-100 text-green-700 border border-green-300 focus:ring-green-500'
                      : plan.popular
                        ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500'
                        : 'bg-[#0E1523] hover:bg-slate-800 text-white focus:ring-slate-500'
                    )}
                    aria-label={isCurrent ? 'Current plan' : 'Select ' + plan.name + ' plan'}
                  >
                    {isLoading ? 'Loading...' : isCurrent ? 'Current Plan' : subscription ? 'Switch to ' + plan.name : 'Start Free Trial'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fine print */}
        <div className="text-center space-y-1 pb-8">
          <p className="text-xs text-[#94A3B8]">14-day free trial on all plans. No credit card required to start.</p>
          <p className="text-xs text-[#94A3B8]">No revenue cut on payments. Stripe processing fees apply.</p>
          <p className="text-xs text-[#94A3B8]">Verified 501(c)(3) nonprofits receive an additional free month.</p>
          <p className="text-xs text-[#94A3B8]">Student plan requires a valid .edu email. Monthly billing only. Pause up to 6 months/year.</p>
        </div>

      </div>
    </div>
  );
}

export default BillingPage;