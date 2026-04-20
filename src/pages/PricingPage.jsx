import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, Pause } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

var PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    monthly: 29.99,
    annual: 299.90,
    annualMonthly: 24.99,
    members: 50,
    storage: '2 GB',
    pages: 'Public page — 1 scrollable page',
    pagesDetail: 'A public landing page with drag-and-drop sections — hero, about, events, programs, gallery, and more.',
    badge: null,
    isHighlight: false,
    features: [
      'Member directory + profiles',
      'Multi-org unified dashboard',
      'Events, RSVP, recurring events',
      'QR codes + attendance check-in',
      'Public events (no login required)',
      'Announcements + document library',
      'Polls, surveys, sign-up forms',
      'Programs',
      'Chat',
      'Donation pages (no revenue cut)',
      'Basic analytics + CSV exports',
      'orgname.syndicade.com subdomain',
      'Up to 3 admins, 2 editors',
      'Community Board (verified nonprofits)',
      'Email support',
    ],
    locked: [
      'Paid event tickets',
      'Email blasts + newsletters',
      'Full analytics dashboard',
      'Admin inbox',
      'Membership dues + tiers',
      'Custom domain',
    ],
  },
  {
    key: 'growth',
    name: 'Growth',
    monthly: 49.99,
    annual: 499.90,
    annualMonthly: 41.66,
    members: 150,
    storage: '10 GB',
    pages: 'Public page — up to 7 pages',
    pagesDetail: 'A home page plus up to 6 sub-pages. Build out your full org presence — About, Programs, Team, Gallery, Donate, Contact.',
    badge: 'Most Popular',
    isHighlight: true,
    features: [
      'Everything in Starter, plus:',
      'Paid event tickets ($1/ticket flat fee)',
      '200 ticket max per paid event',
      'Membership dues collection',
      'Membership tiers',
      'Email blasts + newsletter builder',
      '500 emails/month',
      'Email analytics (open/click/bounce)',
      'Full analytics dashboard',
      'Attendance + revenue reports',
      'Admin inbox',
      'Up to 5 admins, unlimited editors',
    ],
    addons: [
      'Custom domain: +$50/yr',
      'Remove branding: +$10/mo or $99/yr',
      'Extra storage: +$10/mo per 10 GB',
    ],
    locked: [
      'Unlimited email blasts',
      'Custom checkout fields',
      'Priority support',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    monthly: 69.99,
    annual: 699.90,
    annualMonthly: 58.32,
    members: 300,
    storage: '30 GB',
    pages: 'Public page — Unlimited pages',
    pagesDetail: 'Unlimited pages for campaigns, programs, events, and more. No ceiling — build as your org grows.',
    badge: null,
    isHighlight: false,
    features: [
      'Everything in Growth, plus:',
      '500 ticket max per paid event',
      'Custom checkout fields per event',
      'Unlimited email blasts + newsletter',
      'Unlimited pages',
      'Custom domain — included',
      'Remove Syndicade branding — included',
      '1 free featured event placement/yr',
      'Unlimited admins and editors',
      'Priority support',
    ],
    locked: [],
  },
];

var ADDONS = [
  { name: 'Custom domain', price: '$50/yr', plans: 'Growth+ (included on Pro)' },
  { name: 'Remove branding', price: '$10/mo or $99/yr', plans: 'Growth+ (included on Pro)' },
  { name: 'Extra storage', price: '+$10/mo per 10 GB', plans: 'Growth+' },
  { name: 'Featured event placement', price: '$15/wk or $40/30 days', plans: 'Growth+' },
  { name: 'Additional members', price: '$1/member/mo over cap', plans: 'All plans' },
];

var COMPARE = [
  {
    category: 'Legacy nonprofit platforms',
    price: '$60 – $800+/mo',
    weakness: 'Outdated UI, steep learning curve, poor mobile experience',
    isSelf: false,
  },
  {
    category: 'Creator community tools',
    price: '$40 – $100/mo',
    weakness: 'Built for influencers and courses — not volunteer-run organizations',
    isSelf: false,
  },
  {
    category: 'Free social platforms',
    price: 'Free + data tradeoffs',
    weakness: 'No member management, no events ownership, your audience isn\'t yours',
    isSelf: false,
  },
  {
    category: 'Per-transaction ticketing',
    price: '3 – 5% + per-ticket fees',
    weakness: 'Fees compound fast — selling 50 tickets at $25 can cost $100+ in fees alone',
    isSelf: false,
  },
  {
    category: 'Syndicade',
    price: 'From $29.99/mo',
    weakness: 'Purpose-built for nonprofits. Flat fees. No revenue cut.',
    isSelf: true,
  },
];

export default function PricingPage() {
  var [billingInterval, setBillingInterval] = useState('monthly');
  var [showStudent, setShowStudent] = useState(false);

  function getPrice(plan) {
    if (billingInterval === 'annual') {
      return plan.annualMonthly.toFixed(2);
    }
    return plan.monthly % 1 === 0 ? plan.monthly.toString() : plan.monthly.toFixed(2);
  }

  return (
    <div className="bg-[#0E1523] min-h-screen flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">

        {/* Hero */}
        <section className="py-20 px-6 text-center" aria-labelledby="pricing-heading">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4" aria-hidden="true">PRICING</p>
          <h1 id="pricing-heading" className="text-4xl font-extrabold text-white mb-4">
            Simple pricing for every org
          </h1>
          <p className="text-lg text-[#94A3B8] max-w-xl mx-auto mb-10">
            14-day free trial. No credit card required. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div
            className="inline-flex items-center gap-1 bg-[#151B2D] border border-[#2A3550] rounded-lg p-1"
            role="group"
            aria-label="Billing interval"
          >
            <button
              onClick={function() { setBillingInterval('monthly'); }}
              aria-pressed={billingInterval === 'monthly'}
              className={'px-5 py-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ' + (billingInterval === 'monthly' ? 'bg-[#1A2035] text-white' : 'text-[#94A3B8] hover:text-white')}
            >
              Monthly
            </button>
            <button
              onClick={function() { setBillingInterval('annual'); }}
              aria-pressed={billingInterval === 'annual'}
              className={'px-5 py-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ' + (billingInterval === 'annual' ? 'bg-[#1A2035] text-white' : 'text-[#94A3B8] hover:text-white')}
            >
              Annual
              <span className="ml-2 text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">Save 2 months</span>
            </button>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="px-6 pb-8 max-w-6xl mx-auto" aria-label="Pricing plans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(function(plan) {
              return (
                <article
                  key={plan.key}
                  className={'bg-[#1A2035] rounded-2xl border p-8 flex flex-col relative ' + (plan.isHighlight ? 'border-blue-500' : 'border-[#2A3550]')}
                  aria-label={plan.name + ' plan'}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">{plan.badge}</span>
                    </div>
                  )}

                  <h2 className="text-xl font-extrabold text-white mb-2">{plan.name}</h2>

                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">${getPrice(plan)}</span>
                    <span className="text-[#64748B] text-sm mb-1">/mo</span>
                  </div>

                  {billingInterval === 'annual' && (
                    <p className="text-xs text-green-400 mb-4">Billed as ${plan.annual.toFixed(2)}/yr — 2 months free</p>
                  )}
                  {billingInterval === 'monthly' && <div className="mb-4" />}

                  <div className="mb-6">
                    <div className="text-sm text-[#94A3B8] space-y-1 mb-3">
                      <p>Up to {plan.members} members</p>
                      <p>{plan.storage} storage</p>
                    </div>
                    <div className="bg-[#0E1523] border border-[#2A3550] rounded-lg p-3">
                      <p className="text-white text-xs font-semibold mb-1">{plan.pages}</p>
                      <p className="text-[#64748B] text-xs leading-relaxed">{plan.pagesDetail}</p>
                    </div>
                  </div>

                  <Link
                    to="/signup"
                    className={'block text-center py-3 px-6 rounded-lg font-bold text-sm mb-8 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] ' + (plan.isHighlight ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500' : 'bg-[#1E2845] hover:bg-[#2A3550] text-white focus:ring-blue-500')}
                    aria-label={'Get started with ' + plan.name + ' — 14 day free trial'}
                  >
                    Start free — 14 days
                  </Link>

                  <ul className="space-y-3 flex-1" role="list" aria-label={plan.name + ' included features'}>
                    {plan.features.map(function(f, i) {
                      var isHeader = f.startsWith('Everything');
                      return (
                        <li key={i} className={'flex items-start gap-2 text-sm ' + (isHeader ? 'text-yellow-400 font-semibold' : 'text-[#CBD5E1]')}>
                          {!isHeader && <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" aria-hidden="true" />}
                          {f}
                        </li>
                      );
                    })}
                    {plan.locked && plan.locked.map(function(f, i) {
                      return (
                        <li key={'locked-' + i} className="flex items-start gap-2 text-sm text-[#475569]" aria-label={f + ' — requires upgrade'}>
                          <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          {f}
                        </li>
                      );
                    })}
                  </ul>

                  {plan.addons && (
                    <div className="mt-6 pt-5 border-t border-[#2A3550]">
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Add-ons available</p>
                      {plan.addons.map(function(a, i) {
                        return <p key={i} className="text-xs text-[#94A3B8] mb-1">{a}</p>;
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-[#64748B]">
              All features are visible on all plans. Unavailable features are clearly marked — you always know what's ahead.
            </p>
            <div className="flex justify-center">
              <Link
                to="/features"
                onClick={function() { window.scrollTo(0, 0); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2035] border border-[#3B82F6] text-blue-400 hover:bg-[#1E2845] hover:text-blue-300 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0E1523]"
              >
                See all available features in detail →
              </Link>
            </div>
            <p className="text-xs text-[#64748B]">
              Have a promo code? Apply it at checkout for an extended free trial.
            </p>
          </div>
        </section>

        {/* Student plan */}
        <section className="px-6 pb-16 max-w-6xl mx-auto" aria-labelledby="student-heading">
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-yellow-400" aria-hidden="true">STUDENT PLAN</p>
                  <span className="text-xs bg-[#1D3461] text-blue-400 px-2 py-0.5 rounded-full font-semibold">.edu email required</span>
                </div>
                <h2 id="student-heading" className="text-2xl font-extrabold text-white mb-2">
                  Built for student organizations
                </h2>
                <p className="text-[#94A3B8] text-sm mb-4 max-w-xl">
                  All the features of Starter at a price built for student budgets. Pause your account over the summer or winter break — no charges while paused, your data stays safe.
                </p>

                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-extrabold text-white">$19.99</span>
                  <span className="text-[#64748B] text-sm mb-1">/mo — monthly only</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Link
                    to="/signup"
                    className="inline-block text-center px-6 py-3 bg-[#1E2845] hover:bg-[#2A3550] text-white font-bold rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]"
                    aria-label="Get started with the Student plan"
                  >
                    Start free — 14 days
                  </Link>
                  <button
                    onClick={function() { setShowStudent(!showStudent); }}
                    className="inline-block text-center px-6 py-3 border border-[#2A3550] text-[#94A3B8] hover:text-white hover:border-[#3B82F6] font-semibold rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]"
                    aria-expanded={showStudent}
                  >
                    {showStudent ? 'Hide features' : 'See included features'}
                  </button>
                </div>

                {showStudent && (
                  <ul className="space-y-2 mb-4" role="list" aria-label="Student plan included features">
                    {[
                      'All Starter features included',
                      'Member directory + profiles',
                      'Events, RSVP, recurring events',
                      'QR codes + attendance check-in',
                      'Polls, surveys, sign-up forms',
                      'Document library + chat',
                      'Donation pages (no revenue cut)',
                      'orgname.syndicade.com subdomain',
                      'Up to 3 admins, 2 editors',
                    ].map(function(f, i) {
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                          <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                          {f}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Pause perk callout */}
              <div className="md:w-64 bg-[#0E1523] border border-[#2A3550] rounded-xl p-5 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Pause className="w-4 h-4 text-yellow-400" aria-hidden="true" />
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Pause anytime</p>
                </div>
                <p className="text-white text-sm font-semibold mb-2">Summer break? Pause your account.</p>
                <p className="text-[#94A3B8] text-xs leading-relaxed mb-3">
                  Schedule a pause and billing stops at the start of your next billing cycle. Resume whenever you're back. Up to 6 months per year.
                </p>
                <div className="space-y-2">
                  {[
                    'No charges while paused',
                    'Data stays safe',
                    'Resume with one click',
                    'Up to 6 months/year',
                  ].map(function(item, i) {
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-400 shrink-0" aria-hidden="true" />
                        <span className="text-xs text-[#CBD5E1]">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#2A3550]">
              <p className="text-xs text-[#64748B]">
                Requires a valid .edu email address for verification. One student subscription per organization. Cannot be combined with annual billing.
              </p>
            </div>
          </div>
        </section>

        {/* Add-ons */}
        <section className="bg-[#151B2D] py-16 px-6" aria-labelledby="addons-heading">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-3 text-center" aria-hidden="true">ADD-ONS</p>
            <h2 id="addons-heading" className="text-2xl font-extrabold text-white text-center mb-10">
              Flexible add-ons — pay only for what you need
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ADDONS.map(function(addon, i) {
                return (
                  <div key={i} className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-5">
                    <p className="text-white font-semibold mb-1">{addon.name}</p>
                    <p className="text-yellow-400 font-bold text-sm mb-2">{addon.price}</p>
                    <p className="text-[#64748B] text-xs">{addon.plans}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Verified nonprofit */}
        <section className="py-16 px-6" aria-labelledby="nonprofit-heading">
          <div className="max-w-2xl mx-auto bg-[#1A2035] border border-[#2A3550] rounded-2xl p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-3" aria-hidden="true">VERIFIED 501(c)(3)</p>
            <h2 id="nonprofit-heading" className="text-xl font-extrabold text-white mb-4">
              Get extra perks on any plan
            </h2>
            <ul className="space-y-3 mb-6" role="list">
              {[
                '30-day free trial (vs standard 14 days)',
                'Public discovery board listing — get found by your community',
                'Verified nonprofit badge on your org page',
                'Community Board access — share resources with other verified orgs',
              ].map(function(item, i) {
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                    {item}
                  </li>
                );
              })}
            </ul>
            <Link
              to="/signup"
              className="text-sm text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Learn about nonprofit verification →
            </Link>
          </div>
        </section>

        {/* Comparison table */}
        <section className="bg-[#151B2D] py-16 px-6" aria-labelledby="compare-heading">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-3 text-center" aria-hidden="true">COMPARISON</p>
            <h2 id="compare-heading" className="text-2xl font-extrabold text-white text-center mb-10">How we compare</h2>
            <div className="overflow-x-auto rounded-xl border border-[#2A3550]">
              <table className="w-full text-sm" role="table" aria-label="Platform comparison">
                <thead>
                  <tr className="border-b border-[#2A3550] bg-[#1E2845]">
                    <th scope="col" className="text-left py-3 px-4 text-[#94A3B8] font-semibold">Alternative</th>
                    <th scope="col" className="text-left py-3 px-4 text-[#94A3B8] font-semibold">The catch</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(function(row, i) {
                    return (
                      <tr key={i} className={'border-b border-[#2A3550] last:border-0 ' + (row.isSelf ? 'bg-[#1A2035]' : '')}>
                        <td className="py-4 px-4">
                          {row.isSelf
                            ? <span className="text-yellow-400 font-bold">Syndicade — {row.price}</span>
                            : <span><span className="text-white font-semibold">{row.category}</span><span className="text-[#64748B] ml-2">{row.price}</span></span>
                          }
                        </td>
                        <td className={'py-4 px-4 ' + (row.isSelf ? 'text-green-400' : 'text-[#94A3B8]')}>{row.weakness}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-5">
                <p className="text-white font-semibold text-sm mb-2">The ticketing math</p>
                <p className="text-[#94A3B8] text-sm">
                  Selling 50 tickets at $25? Per-transaction platforms charge $100+ in fees. Syndicade charges $50 flat — $1/ticket — plus standard Stripe processing paid by the buyer. You keep more of every dollar.
                </p>
              </div>
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-5">
                <p className="text-white font-semibold text-sm mb-2">Create once, share on your terms</p>
                <p className="text-[#94A3B8] text-sm">
                  Create an event or program and share it with your members instantly. Want to reach beyond your org? Opt in to publish it on your public landing page and the Syndicade discovery board — no duplicate entry, no copy-paste.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 text-center" aria-labelledby="cta-heading">
          <img src="/mascot-pair.png" alt="" aria-hidden="true" className="mx-auto mb-8" style={{maxWidth:'200px'}} />
          <h2 id="cta-heading" className="text-3xl font-extrabold text-white mb-4">Ready to replace your fragmented stack?</h2>
          <p className="text-[#94A3B8] mb-8">14-day free trial. No credit card. Cancel anytime.</p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-lg text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-[#0E1523]"
          >
            Start free — 14 days
          </Link>
          <p className="text-xs text-[#64748B] mt-4">Have a promo code? Apply it at checkout for 30 days free.</p>
        </section>

      </main>

      <Footer />
    </div>
  );
}