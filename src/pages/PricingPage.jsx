import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSiteContentMap } from '../hooks/useSiteContent';

// ─── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ path, size, style }) {
  var s = size || 16;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" style={style || {}}>
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
var ICONS = {
  check:    'M5 13l4 4L19 7',
  x:        'M6 18L18 6M6 6l12 12',
  arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
  chevDown: 'M19 9l-7 7-7-7',
  sun:      'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z',
  moon:     'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  shield:   ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  credit:   ['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
  storage:  ['M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'],
  globe:    ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  mail:     ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  chart:    ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
  tag:      ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'],
  zap:      ['M13 10V3L4 14h7v7l9-11h-7z'],
  megaphone:['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  document: ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  clipboard:['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  refresh:  ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
  raffle:   ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
};

// ─── Feature row data ─────────────────────────────────────────────────────────
var FEATURE_ROWS = [
  { label: 'Members',                           starter: '50',   growth: '150',  pro: '300',  icon: 'users' },
  { label: 'Storage',                           starter: '5 GB', growth: '15 GB',pro: '50 GB',icon: 'storage' },
  { label: 'Events & calendar',                 starter: true,   growth: true,   pro: true,   icon: 'calendar' },
  { label: 'Announcements',                     starter: true,   growth: true,   pro: true,   icon: 'megaphone' },
  { label: 'Polls & surveys',                   starter: true,   growth: true,   pro: true,   icon: 'clipboard' },
  { label: 'Document library',                  starter: true,   growth: true,   pro: true,   icon: 'document' },
  { label: 'Member directory',                  starter: true,   growth: true,   pro: true,   icon: 'users' },
  { label: 'Sign-up forms',                     starter: true,   growth: true,   pro: true,   icon: 'clipboard' },
  { label: 'RSVP & check-in',                   starter: true,   growth: true,   pro: true,   icon: 'check' },
  { label: 'Recurring events',                  starter: true,   growth: true,   pro: true,   icon: 'refresh' },
  { label: 'Subdomain (orgname.syndicade.com)', starter: true,   growth: true,   pro: true,   icon: 'globe' },
  { label: 'Payment processing (Stripe, 0% fee)', starter: false, growth: true,  pro: true,   icon: 'credit' },
  { label: 'Basic analytics & reports',         starter: false,  growth: true,   pro: true,   icon: 'chart' },
  { label: 'Email notifications',               starter: false,  growth: true,   pro: true,   icon: 'mail' },
  { label: 'Raffle & event tools',              starter: false,  growth: true,   pro: true,   icon: 'raffle' },
  { label: 'Custom domain',                     starter: false,  growth: false,  pro: true,   icon: 'globe' },
  { label: 'Remove Syndicade branding',         starter: false,  growth: false,  pro: true,   icon: 'tag' },
  { label: 'Advanced analytics & exports',      starter: false,  growth: false,  pro: true,   icon: 'chart' },
  { label: 'Email marketing blasts',            starter: false,  growth: false,  pro: true,   icon: 'mail' },
];

var FAQS = [
  { q: 'Is there really a free trial?', a: 'Yes — all plans include a 1-month free trial with no credit card required. Verified 501(c)(3) nonprofits stack an extra free month on top of that at signup.' },
  { q: 'What happens when I hit my member limit?', a: 'You will be notified when you reach 80% of your member limit. You can upgrade at any time. We never cut off access — we give you time to decide.' },
  { q: 'Can I switch plans?', a: 'Yes, anytime. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.' },
  { q: 'Do you take a cut of payments?', a: 'Never. We pass through Stripe fees only (typically 2.9% + 30¢ per transaction). Syndicade takes 0% of your dues, ticket sales, or donation revenue.' },
  { q: 'What counts as a member?', a: 'Any person with an active account in your organization. Pending invitations and deactivated accounts do not count against your limit.' },
  { q: 'Is annual billing required?', a: 'No — monthly billing is available on all plans. Annual billing saves you 2 months (17% off) and is billed as a single charge once per year.' },
  { q: 'Can multiple people manage the account?', a: 'Yes. All plans support multiple admins. There is no per-seat admin fee — add as many admins as your org needs.' },
  { q: 'What is the nonprofit verification process?', a: 'At signup, upload your EIN or IRS determination letter. We review and approve within 48 hours. Verified orgs get 1 extra free month and appear on the public discovery board.' },
];

var COMPETITORS = [
  { name: 'Syndicade',       price: '$14.99/mo', highlight: true,  note: 'Purpose-built for nonprofits & community orgs' },
  { name: 'Wild Apricot',    price: '$60/mo',    highlight: false, note: 'Outdated UI, poor support since Personify acquisition' },
  { name: 'MemberPlanet',    price: 'Free + 4%', highlight: false, note: 'Platform fee stings at scale — $1,000 fee on $25K raised' },
  { name: 'Mighty Networks', price: '$41/mo',    highlight: false, note: 'Built for creators, not nonprofits' },
  { name: 'Hivebrite',       price: '$799/mo',   highlight: false, note: 'Enterprise only — out of reach for most orgs' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  var navigate = useNavigate();
  var { isDark, toggle } = useTheme();

  var [annual, setAnnual]   = useState(true);
  var [openFaq, setOpenFaq] = useState(null);

  // ── Editable content from Supabase (staff edits via /staff → Content tab) ──
  var content = useSiteContentMap([
    'pricing_hero_label',
    'pricing_hero_headline_main',
    'pricing_hero_headline_accent',
    'pricing_hero_subheadline',
    'pricing_compete_label',
    'pricing_compete_headline',
    'pricing_compete_subheadline',
    'pricing_final_cta_headline',
    'pricing_final_cta_body',
    'pricing_final_cta_np_note',
    'footer_copyright',
  ], {
    pricing_hero_label:           'Pricing',
    pricing_hero_headline_main:   'Funded by communities,',
    pricing_hero_headline_accent: 'not investors.',
    pricing_hero_subheadline:     'No ads. No data selling. No cut of your donations. Just a fair price to keep the board running.',
    pricing_compete_label:        'How we compare',
    pricing_compete_headline:     'More affordable. More purpose-built.',
    pricing_compete_subheadline:  'Wild Apricot charges 4\u00d7 more. MemberPlanet takes a cut of every dollar you raise. We don\u2019t.',
    pricing_final_cta_headline:   'Ready to pin your org\nto the board?',
    pricing_final_cta_body:       '1 month free. No credit card. Cancel anytime.',
    pricing_final_cta_np_note:    'Verified 501(c)(3)? You get an extra month free. Submit your EIN at signup.',
    footer_copyright:             new Date().getFullYear() + ' Syndicade. All rights reserved.',
  });

  // ── Tokens ──────────────────────────────────────────────────────────────────
  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg     = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var tableAlt      = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  // ── Plans ────────────────────────────────────────────────────────────────────
  var plans = [
    { key: 'starter', name: 'Starter', monthly: '$14.99', annual: '$12.49', annualTotal: '$149.88', members: '50',  storage: '5 GB',  tagline: 'Everything a small org needs to get organized and stay connected.',          bg: '#FEF9C3', tack: '#D4A017', nameColor: '#92700A', btnBg: '#0E1523', btnColor: '#F5B731', pop: false },
    { key: 'growth',  name: 'Growth',  monthly: '$29',    annual: '$24.17', annualTotal: '$290.00', members: '150', storage: '15 GB', tagline: 'For orgs ready to collect payments and track engagement.',                   bg: '#DBEAFE', tack: '#1D4ED8', nameColor: '#1E40AF', btnBg: '#3B82F6', btnColor: 'white',   pop: true  },
    { key: 'pro',     name: 'Pro',     monthly: '$59',    annual: '$49.17', annualTotal: '$590.00', members: '300', storage: '50 GB', tagline: 'Full control — custom domain, your branding, advanced analytics.',           bg: '#DCFCE7', tack: '#16A34A', nameColor: '#166534', btnBg: '#16A34A', btnColor: 'white',   pop: false },
  ];

  function renderCell(val) {
    if (val === true) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
            <Icon path={ICONS.check} size={12} />
          </div>
        </div>
      );
    }
    if (val === false) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted }}>
            <Icon path={ICONS.x} size={11} />
          </div>
        </div>
      );
    }
    return <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: textPrimary }}>{val}</div>;
  }

  return (
    <div style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: textPrimary }}>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none" style={{ background: '#F5B731', color: '#111827' }}>
        Skip to main content
      </a>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header role="banner" style={{ background: isDark ? '#0E1523' : '#FFFFFF', borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" aria-label="Back to Syndicade home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: textSecondary, fontSize: '14px', fontWeight: 500 }}>
            <Icon path="M15 19l-7-7 7-7" size={16} />
            <span style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0E1523' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div role="group" aria-label="Color theme" style={{ display: 'flex', alignItems: 'center', background: isDark ? '#0E1523' : '#E2E8F0', border: '1px solid ' + borderColor, borderRadius: '99px', padding: '3px', gap: '2px' }}>
              {[{ val: false, icon: ICONS.sun, label: 'Light' }, { val: true, icon: ICONS.moon, label: 'Dark' }].map(function(opt) {
                var active = isDark === opt.val;
                return (
                  <button key={opt.label} onClick={function() { if (!active) toggle(); }} aria-pressed={active} aria-label={'Switch to ' + opt.label + ' mode'} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: active ? (isDark ? '#1A2035' : '#FFFFFF') : 'transparent', color: active ? textPrimary : textMuted, border: 'none', cursor: active ? 'default' : 'pointer', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.15s' }}>
                    <Icon path={opt.icon} size={12} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }}>Log In</button>
            <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-xl" style={{ fontSize: '14px', fontWeight: 700, color: '#111827', background: '#F5B731', border: 'none', cursor: 'pointer', padding: '9px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(245,183,49,0.35)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section aria-labelledby="pricing-hero-heading" style={{ padding: '64px 24px 48px', background: isDark ? '#0E1523' : '#F8FAFC', borderBottom: '1px solid ' + borderColor, textAlign: 'center' }}>
          {/* Section label — editable */}
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '14px' }}>
            {content['pricing_hero_label']}
          </p>
          {/* Headline — editable (two lines, second in yellow) */}
          <h1 id="pricing-hero-heading" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: textPrimary, lineHeight: 1.15, marginBottom: '16px' }}>
            {content['pricing_hero_headline_main']}<br />
            <span style={{ color: '#F5B731' }}>{content['pricing_hero_headline_accent']}</span>
          </h1>
          {/* Subheadline — editable */}
          <p style={{ fontSize: '17px', color: textSecondary, maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            {content['pricing_hero_subheadline']}
          </p>

          {/* Billing toggle — not editable, pricing-driven */}
          <div role="group" aria-label="Billing period" style={{ display: 'inline-flex', alignItems: 'center', background: isDark ? '#1A2035' : '#FFFFFF', border: '1px solid ' + borderColor, borderRadius: '99px', padding: '4px', gap: '2px', marginBottom: '12px' }}>
            {[{ val: false, label: 'Monthly' }, { val: true, label: 'Annual — 2 months free' }].map(function(opt) {
              var active = annual === opt.val;
              return (
                <button key={opt.label} onClick={function() { setAnnual(opt.val); }} aria-pressed={active} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '99px', fontSize: '13px', fontWeight: 600, background: active ? '#F5B731' : 'transparent', color: active ? '#111827' : textMuted, border: 'none', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  {opt.label}
                  {opt.val && !active && <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#22C55E', padding: '1px 6px', borderRadius: '99px' }}>17% off</span>}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '12px', color: textMuted }}>1-month free trial on all plans · No credit card required</p>
        </section>

        {/* ── Plan cards ───────────────────────────────────────────────────── */}
        <section aria-labelledby="plans-heading" style={{ padding: '32px 24px 64px', background: pageBg, borderBottom: '1px solid ' + borderColor }}>
          <h2 id="plans-heading" className="sr-only">Pricing plans</h2>
          <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '28px' }}>
            {plans.map(function(plan) {
              return (
                <div key={plan.key} style={{ background: plan.bg, borderRadius: '4px', padding: '24px', position: 'relative', marginTop: '14px', boxShadow: plan.pop ? '4px 6px 20px rgba(0,0,0,0.22), 0 2px 4px rgba(0,0,0,0.14)' : '3px 4px 14px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.10)', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.048) 28px)', backgroundPositionY: '36px' }}>
                  <div aria-hidden="true" style={{ width: '15px', height: '15px', borderRadius: '50%', position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, ' + plan.tack + ' 52%, rgba(0,0,0,0.25) 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
                  {plan.pop && <div style={{ display: 'inline-block', background: '#3B82F6', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Most Popular</div>}
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: plan.nameColor, marginBottom: '10px' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '44px', fontWeight: 800, color: '#111827', lineHeight: 1, fontFamily: 'Georgia, serif' }}>{annual ? plan.annual : plan.monthly}</span>
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>/mo</span>
                  </div>
                  {annual && <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px' }}>Billed as {plan.annualTotal}/yr</p>}
                  <div style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#374151', background: 'rgba(0,0,0,0.07)', padding: '3px 8px', borderRadius: '4px' }}>
                      <Icon path={ICONS.users} size={11} style={{ color: '#6B7280' }} />{plan.members} members
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#374151', background: 'rgba(0,0,0,0.07)', padding: '3px 8px', borderRadius: '4px' }}>
                      <Icon path={ICONS.storage} size={11} style={{ color: '#6B7280' }} />{plan.storage}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '20px', fontFamily: 'Georgia, serif' }}>{plan.tagline}</p>
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', marginBottom: '16px' }} />
                  <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400" aria-label={'Start ' + plan.name + ' free trial'} style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 700, background: plan.btnBg, color: plan.btnColor, border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'opacity 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.opacity = '0.88'; }} onMouseOut={function(e) { e.currentTarget.style.opacity = '1'; }}>
                    Start Free Trial
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '8px' }}>No credit card required</p>
                </div>
              );
            })}
          </div>
          {annual && <p style={{ textAlign: 'center', fontSize: '12px', color: textMuted, marginTop: '24px' }}>Annual billing = 2 months free (17% off). Switch to monthly anytime.</p>}
        </section>

        {/* ── Nonprofit callout ─────────────────────────────────────────────── */}
        <section aria-labelledby="nonprofit-heading" style={{ padding: '48px 24px', background: isDark ? '#0A1020' : '#FEFBF0', borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px', background: 'rgba(245,183,49,0.07)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245,183,49,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5B731' }}>
                <Icon path={ICONS.shield} size={22} />
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h2 id="nonprofit-heading" style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>Verified nonprofit rate</h2>
                <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.7, marginBottom: '16px' }}>
                  Verified 501(c)(3) organizations get <strong style={{ color: textPrimary }}>1 extra month free</strong> at signup on any plan — stacks with annual billing. That's up to 3 months free before you pay a cent.
                </p>
                <p style={{ fontSize: '13px', color: textMuted, marginBottom: '16px' }}>
                  Verified nonprofits also appear on the public discovery board, so local community members can find your events and organization.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {[{ name: 'Starter', year1: '$134.89', period: 'year 1 (annual)' },{ name: 'Growth', year1: '$261.00', period: 'year 1 (annual)' },{ name: 'Pro', year1: '$531.00', period: 'year 1 (annual)' }].map(function(p) {
                    return (
                      <div key={p.name} style={{ background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.18)', borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#F5B731', marginBottom: '4px' }}>{p.name}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: textPrimary }}>{p.year1}</div>
                        <div style={{ fontSize: '11px', color: textMuted }}>{p.period}</div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '12px', color: textMuted, marginTop: '14px' }}>Submit your EIN or IRS determination letter at signup. Approved within 48 hours. After the free month, full price same as everyone else.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature comparison table ──────────────────────────────────────── */}
        <section aria-labelledby="compare-heading" style={{ padding: '64px 24px', background: sectionBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>Compare plans</p>
              <h2 id="compare-heading" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: textPrimary }}>Everything side by side</h2>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid ' + borderColor }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }} role="table" aria-label="Feature comparison by plan">
                <thead>
                  <tr style={{ background: isDark ? '#1E2845' : '#F1F5F9' }}>
                    <th scope="col" style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: textPrimary, width: '45%' }}>Feature</th>
                    {['Starter', 'Growth', 'Pro'].map(function(name) {
                      return (
                        <th key={name} scope="col" style={{ padding: '16px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: textPrimary }}>
                          {name}
                          <div style={{ fontSize: '11px', fontWeight: 400, color: textMuted, marginTop: '2px' }}>
                            {name === 'Starter' ? (annual ? '$12.49/mo' : '$14.99/mo') : name === 'Growth' ? (annual ? '$24.17/mo' : '$29/mo') : (annual ? '$49.17/mo' : '$59/mo')}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map(function(row, i) {
                    return (
                      <tr key={row.label} style={{ background: i % 2 === 1 ? tableAlt : 'transparent', borderTop: '1px solid ' + borderColor }}>
                        <td style={{ padding: '13px 20px', fontSize: '13px', color: textSecondary }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: textMuted, flexShrink: 0 }}><Icon path={ICONS[row.icon] || ICONS.check} size={14} /></span>
                            {row.label}
                          </div>
                        </td>
                        <td style={{ padding: '13px 12px' }}>{renderCell(row.starter)}</td>
                        <td style={{ padding: '13px 12px' }}>{renderCell(row.growth)}</td>
                        <td style={{ padding: '13px 12px' }}>{renderCell(row.pro)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'center', marginTop: '28px' }}>
              <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,183,49,0.35)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Start your free trial <Icon path={ICONS.arrow} size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Competitor comparison ─────────────────────────────────────────── */}
        <section aria-labelledby="compete-heading" style={{ padding: '64px 24px', background: pageBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              {/* Label — editable */}
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                {content['pricing_compete_label']}
              </p>
              {/* Headline — editable */}
              <h2 id="compete-heading" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: textPrimary, marginBottom: '12px' }}>
                {content['pricing_compete_headline']}
              </h2>
              {/* Subheadline — editable */}
              <p style={{ fontSize: '15px', color: textSecondary }}>
                {content['pricing_compete_subheadline']}
              </p>
            </div>
            <div style={{ borderRadius: '14px', border: '1px solid ' + borderColor, overflow: 'hidden' }}>
              {COMPETITORS.map(function(comp, i) {
                return (
                  <div key={comp.name} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', padding: '18px 24px', background: comp.highlight ? (isDark ? 'rgba(245,183,49,0.07)' : 'rgba(245,183,49,0.05)') : (i % 2 === 1 ? tableAlt : 'transparent'), borderTop: i > 0 ? '1px solid ' + borderColor : 'none' }}>
                    <div style={{ flex: '0 0 160px' }}>
                      <span style={{ fontSize: '14px', fontWeight: comp.highlight ? 800 : 600, color: comp.highlight ? textPrimary : textSecondary }}>
                        {comp.name}
                        {comp.highlight && <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, background: '#F5B731', color: '#111827', padding: '2px 7px', borderRadius: '99px' }}>You</span>}
                      </span>
                    </div>
                    <div style={{ flex: '0 0 120px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: comp.highlight ? '#F5B731' : textPrimary }}>{comp.price}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <span style={{ fontSize: '13px', color: textMuted }}>{comp.note}</span>
                    </div>
                    {comp.highlight && (
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#22C55E', fontSize: '12px', fontWeight: 700 }}>
                        <Icon path={ICONS.check} size={14} /> Best value
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '20px', background: isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
                <Icon path={ICONS.zap} size={18} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '2px' }}>0% platform fee on all payments</p>
                <p style={{ fontSize: '12px', color: textMuted }}>MemberPlanet charges 4% on every transaction. On $25,000 raised, that's $1,000 gone. We charge nothing. Stripe fees only.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section aria-labelledby="faq-heading" style={{ padding: '64px 24px', background: sectionBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>FAQ</p>
              <h2 id="faq-heading" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: textPrimary }}>Pricing questions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FAQS.map(function(faq, i) {
                return (
                  <div key={i} style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', overflow: 'hidden' }}>
                    <button onClick={function() { setOpenFaq(openFaq === i ? null : i); }} aria-expanded={openFaq === i} aria-controls={'faq-' + i} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, paddingRight: '16px' }}>{faq.q}</span>
                      <span style={{ color: textMuted, flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
                        <Icon path={ICONS.chevDown} size={16} />
                      </span>
                    </button>
                    {openFaq === i && (
                      <div id={'faq-' + i} style={{ padding: '0 20px 18px' }}>
                        <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.7 }}>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="cta-heading" style={{ padding: '80px 24px', background: '#0E1523', textAlign: 'center' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div aria-hidden="true" style={{ width: '16px', height: '16px', borderRadius: '50%', margin: '0 auto 24px', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, #F5B731 52%, rgba(0,0,0,0.2) 100%)', boxShadow: '0 3px 8px rgba(0,0,0,0.5)' }} />
            {/* CTA headline — editable */}
            <h2 id="cta-heading" style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px', whiteSpace: 'pre-line' }}>
              {content['pricing_final_cta_headline']}
            </h2>
            {/* CTA body — editable */}
            <p style={{ fontSize: '16px', color: '#CBD5E1', marginBottom: '36px', lineHeight: 1.6 }}>
              {content['pricing_final_cta_body']}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
              <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '16px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,183,49,0.4)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Start free trial <Icon path={ICONS.arrow} size={18} />
              </button>
              <button onClick={function() { navigate('/'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px', fontSize: '16px', fontWeight: 600, background: 'none', color: '#CBD5E1', border: '1px solid #2A3550', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = '#2A3550'; e.currentTarget.style.color = '#CBD5E1'; }}>
                Learn more
              </button>
            </div>
            {/* NP note — editable */}
            <p style={{ fontSize: '12px', color: '#64748B' }}>
              {content['pricing_final_cta_np_note']}
            </p>
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer role="contentinfo" style={{ background: '#060E1A', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
          <nav aria-label="Footer navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {[['/', 'Home'], ['/pricing', 'Pricing']].map(function(item) {
              return <Link key={item[0]} to={item[0]} style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>{item[1]}</Link>;
            })}
            <button onClick={function() { navigate('/login'); }} style={{ fontSize: '13px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>Log In</button>
          </nav>
          {/* Copyright — editable (shared key with LandingPage) */}
          <p style={{ fontSize: '12px', color: '#475569' }}>&copy; {content['footer_copyright']}</p>
        </div>
      </footer>

    </div>
  );
}