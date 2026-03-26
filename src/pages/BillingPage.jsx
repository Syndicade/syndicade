import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
  check:   'M5 13l4 4L19 7',
  star:    ['M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'],
  credit:  ['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
  alert:   ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  x:       'M6 18L18 6M6 6l12 12',
};

var PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 14.99,
    annualPrice: 149.88,
    annualMonthly: 12.49,
    members: 50,
    storage: '5 GB',
    features: ['Events, polls, surveys, announcements', 'Document library', 'Member directory & sign-up forms', 'RSVP & check-in', 'Recurring events', 'orgname.syndicade.com subdomain'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 29.00,
    annualPrice: 290.00,
    annualMonthly: 24.17,
    members: 150,
    storage: '15 GB',
    popular: true,
    features: ['Everything in Starter', 'Payment processing (0% platform fee)', 'Basic analytics & reports', 'Email notifications', 'Raffle & event planning tools'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 59.00,
    annualPrice: 590.00,
    annualMonthly: 49.17,
    members: 300,
    storage: '50 GB',
    features: ['Everything in Growth', 'Custom domain', 'Remove Syndicade branding', 'Advanced analytics & exports', 'Email marketing blasts'],
  },
];

var STATUS_LABELS = {
  trialing:  { label: 'Free Trial',    color: 'bg-blue-100 text-blue-800'   },
  active:    { label: 'Active',        color: 'bg-green-100 text-green-800' },
  past_due:  { label: 'Past Due',      color: 'bg-red-100 text-red-800'     },
  canceled:  { label: 'Canceled',      color: 'bg-gray-100 text-gray-600'   },
  incomplete:{ label: 'Incomplete',    color: 'bg-yellow-100 text-yellow-800'},
};

function Skeleton({ className }) {
  return <div className={'animate-pulse rounded bg-gray-200 ' + (className || '')} aria-hidden="true" />;
}

function BillingPage() {
  var { organizationId } = useParams();
  var navigate = useNavigate();
  var [searchParams] = useSearchParams();

  var [subscription, setSubscription] = useState(null);
  var [loading, setLoading] = useState(true);
  var [checkoutLoading, setCheckoutLoading] = useState(null);
  var [interval, setInterval] = useState('month');
  var [orgName, setOrgName] = useState('');

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  useEffect(function() {
    var billing = searchParams.get('billing');
    if (billing === 'success') {
      toast.success('Subscription started! Welcome to Syndicade.');
      loadData();
    } else if (billing === 'cancelled') {
      toast('Checkout cancelled.');
    }
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    try {
      var [orgResult, subResult] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', organizationId).single(),
        supabase.from('subscriptions').select('*').eq('organization_id', organizationId).maybeSingle(),
      ]);
      if (orgResult.data) setOrgName(orgResult.data.name);
      setSubscription(subResult.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlan(planId) {
    setCheckoutLoading(planId);
    try {
      var { data: { session } } = await supabase.auth.getSession();
      var token = session ? session.access_token : '';

      var response = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
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
      console.error(err);
      toast.error(err.message || 'Failed to start checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  }

  var currentPlan = PLANS.find(function(p) { return p.id === subscription?.plan; }) || null;
  var statusInfo = subscription ? (STATUS_LABELS[subscription.status] || STATUS_LABELS['active']) : null;

  var trialEnds = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  var periodEnds = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  var daysLeftInTrial = trialEnds ? Math.max(0, Math.ceil((trialEnds - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-8">

        {/* Header */}
        <div>
          <button
            onClick={function() { navigate('/organizations/' + organizationId); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <Icon path="M15 19l-7-7 7-7" className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-500 text-sm mt-1">{orgName}</p>
        </div>

        {/* Current subscription status */}
        {subscription && (
          <div className={'p-5 rounded-xl border-2 ' + (subscription.status === 'past_due' ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50')}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-gray-900">
                    {currentPlan ? currentPlan.name : 'Unknown'} Plan
                  </span>
                  <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (statusInfo ? statusInfo.color : '')}>
                    {statusInfo ? statusInfo.label : subscription.status}
                  </span>
                </div>
                {subscription.status === 'trialing' && trialEnds && (
                  <p className="text-sm text-blue-700 flex items-center gap-1">
                    <Icon path={ICONS.clock} className="h-4 w-4" />
                    {daysLeftInTrial > 0 ? daysLeftInTrial + ' days left in your free trial' : 'Trial ending soon'}
                    {' · No credit card required yet'}
                  </p>
                )}
                {subscription.status === 'active' && periodEnds && (
                  <p className="text-sm text-gray-600">
                    {'Renews ' + periodEnds.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {subscription.cancel_at_period_end ? ' · Cancels at end of period' : ''}
                  </p>
                )}
                {subscription.status === 'past_due' && (
                  <p className="text-sm text-red-700 flex items-center gap-1">
                    <Icon path={ICONS.alert} className="h-4 w-4" />
                    Payment failed. Please update your payment method.
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                  {subscription.billing_interval === 'year' ? 'Annual billing' : 'Monthly billing'}
                </p>
                {currentPlan && (
                  <p className="text-lg font-bold text-gray-900">
                    {'$' + (subscription.billing_interval === 'year' ? currentPlan.annualPrice.toFixed(2) + '/yr' : currentPlan.monthlyPrice.toFixed(2) + '/mo')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trial callout for no subscription */}
        {!subscription && (
          <div className="p-5 rounded-xl border-2 border-yellow-300 bg-yellow-50">
            <div className="flex items-center gap-3">
              <Icon path={ICONS.star} className="h-6 w-6 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-900">Start your 30-day free trial</p>
                <p className="text-sm text-gray-600 mt-0.5">No credit card required. Full access to all features during your trial.</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing interval toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={'text-sm font-medium ' + (interval === 'month' ? 'text-gray-900' : 'text-gray-400')}>Monthly</span>
          <button
            onClick={function() { setInterval(interval === 'month' ? 'year' : 'month'); }}
            role="switch"
            aria-checked={interval === 'year'}
            aria-label="Toggle annual billing"
            className={'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (interval === 'year' ? 'bg-blue-500' : 'bg-gray-300')}
          >
            <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ' + (interval === 'year' ? 'left-[26px]' : 'left-0.5')} aria-hidden="true" />
          </button>
          <span className={'text-sm font-medium ' + (interval === 'year' ? 'text-gray-900' : 'text-gray-400')}>
            Annual
            <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">2 months free</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list" aria-label="Available plans">
          {PLANS.map(function(plan) {
            var isCurrent = subscription?.plan === plan.id && subscription?.status !== 'canceled';
            var isLoading = checkoutLoading === plan.id;
            var price = interval === 'year' ? plan.annualMonthly : plan.monthlyPrice;
            var totalPrice = interval === 'year' ? plan.annualPrice : null;

            return (
              <div
                key={plan.id}
                role="listitem"
                className={'relative flex flex-col rounded-xl border-2 overflow-hidden ' + (plan.popular ? 'border-blue-500' : 'border-gray-200') + (isCurrent ? ' ring-2 ring-green-400' : '')}
              >
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="bg-green-500 text-white text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    Current Plan
                  </div>
                )}

                <div className="bg-white p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">Up to {plan.members} members · {plan.storage} storage</p>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-gray-900">{'$' + price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">/mo</span>
                    {totalPrice && (
                      <p className="text-xs text-gray-400 mt-0.5">{'$' + totalPrice.toFixed(2) + ' billed annually'}</p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1" aria-label={plan.name + ' features'}>
                    {plan.features.map(function(feature, i) {
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Icon path={ICONS.check} className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    onClick={function() { if (!isCurrent) handleSelectPlan(plan.id); }}
                    disabled={isCurrent || isLoading}
                    className={'w-full py-3 px-4 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ' + (isCurrent
                      ? 'bg-green-100 text-green-700 border border-green-300 focus:ring-green-500'
                      : plan.popular
                        ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500'
                        : 'bg-gray-900 hover:bg-gray-800 text-white focus:ring-gray-500'
                    )}
                    aria-label={isCurrent ? 'Current plan' : 'Start ' + plan.name + ' plan'}
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
          <p className="text-xs text-gray-400">30-day free trial on all plans. No credit card required to start.</p>
          <p className="text-xs text-gray-400">0% platform fee on all payments. Stripe processing fees apply.</p>
          <p className="text-xs text-gray-400">Verified 501(c)(3) nonprofits receive 1 additional free month.</p>
        </div>

      </div>
    </div>
  );
}

export default BillingPage;