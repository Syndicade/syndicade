import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useSiteContentMap } from '../hooks/useSiteContent';

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

function PostIt({ bg, tackColor, badgeBg, badgeText, category, title, body, org, orgColor, date, btnLabel, btnBg, btnTextColor, large }) {
  return (
    <div style={{
      background: bg, borderRadius: '4px',
      padding: large ? '16px' : '12px',
      position: 'relative', marginTop: '14px',
      boxShadow: '2px 3px 10px rgba(0,0,0,0.22)',
      backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, rgba(0,0,0,0.055) 20px)',
      backgroundPositionY: large ? '28px' : '24px',
    }}>
      <div aria-hidden="true" style={{ width: '13px', height: '13px', borderRadius: '50%', position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, ' + tackColor + ' 52%, rgba(0,0,0,0.25) 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.35)' }} />
      <div style={{ marginBottom: '7px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: badgeBg, color: badgeText }}>{category}</span>
      </div>
      <div style={{ fontSize: large ? '15px' : '13px', fontWeight: 700, color: '#111827', lineHeight: 1.35, fontFamily: 'Georgia, serif', marginBottom: body ? '8px' : '0' }}>{title}</div>
      {body && <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, marginBottom: '10px' }}>{body}</div>}
      {(org || date || btnLabel) && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '8px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            {org && <div style={{ fontSize: '11px', fontWeight: 700, color: orgColor || '#6B7280' }}>{org}</div>}
            {date && <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>{date}</div>}
          </div>
          {btnLabel && (
            <button style={{ padding: '4px 12px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, border: 'none', cursor: 'pointer', background: btnBg || badgeBg, color: btnTextColor || badgeText, flexShrink: 0 }}>
              {btnLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

var ICONS = {
  menu:        'M4 6h16M4 12h16M4 18h16',
  x:           'M6 18L18 6M6 6l12 12',
  check:       'M5 13l4 4L19 7',
  arrow:       'M13 7l5 5m0 0l-5 5m5-5H6',
  chevDown:    'M19 9l-7 7-7-7',
  sun:         'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z',
  moon:        'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  shield:      ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  megaphone:   ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  calendar:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  users:       'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  document:    ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  chart:       ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
  globe:       ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  mail:        'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  creditCard:  'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  monitor:     'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  qrCode:      ['M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 4h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'],
  lock:        'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  eye:         'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  eyeOff:      ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  trendingUp:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
};

var FEATURES = [
  { iconKey: 'users',      color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: 'Multi-Org Dashboard',    desc: 'Members who belong to multiple organizations log in once and see everything in one unified view. No other platform does this.' },
  { iconKey: 'calendar',   color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: 'Events + Ticketing',     desc: 'Run free or paid events. Sell tickets with no revenue cut — just a flat $1/ticket fee. You keep far more than legacy event platforms.' },
  { iconKey: 'globe',      color: '#F5B731', bg: 'rgba(245,183,49,0.12)',  label: 'Public Discovery Board', desc: 'Verified nonprofits appear publicly so community members can find your org and events without needing an account.' },
  { iconKey: 'megaphone',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Community Board',        desc: 'A private space for verified org admins to post needs, share surplus resources, and find collaboration partners.' },
  { iconKey: 'mail',       color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'Email + Newsletters',    desc: 'Send announcements and beautifully designed newsletters directly to your member list. No third-party subscription needed.' },
  { iconKey: 'creditCard', color: '#14B8A6', bg: 'rgba(20,184,166,0.12)', label: 'Payments — No Revenue Cut', desc: 'We never take a percentage of your dues, donations, or ticket sales. Paid events have a flat $1/ticket fee. Only Stripe processing applies.' },
  { iconKey: 'monitor',    color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'Public Website Included', desc: 'Every org gets a public-facing website. Starter gets a full scrollable page. Growth gets 7 pages. Pro gets unlimited.' },
  { iconKey: 'qrCode',     color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: 'QR Check-In',           desc: 'Day-of attendance check-in via QR scan. Works on any device. No extra app or hardware required.' },
];

var STEPS = [
  { n: '1', label: 'Create your organization', desc: 'Set up your profile in minutes. No tech skills required.' },
  { n: '2', label: 'Invite members and post', desc: 'Build your calendar and send invitations from one dashboard.' },
  { n: '3', label: 'Everything flows together', desc: 'Members see unified updates across every org they belong to.' },
];

var FAQS = [
  { q: 'Is there a free trial?', a: 'Yes. All plans include a 14-day free trial with no credit card required. Verified 501(c)(3) nonprofits automatically get 30 days. Promo codes (distributed at events and through partners) can extend your trial to 30 days as well.' },
  { q: 'Can members belong to multiple organizations?', a: 'Absolutely — that is one of our core features. Members get a unified dashboard showing updates from every organization they belong to, all in one place.' },
  { q: 'Do we need technical skills?', a: 'None at all. If you can send an email, you can set up Syndicade. Most organizations are fully running within 10 minutes.' },
  { q: 'Do you take a cut of payments or donations?', a: 'We never take a percentage of your revenue. Dues and donations pass through Stripe only. Paid event tickets have a flat $1/ticket fee — not a percentage cut. For context, selling 50 tickets at $25 costs you $50 flat vs. $137+ on Eventbrite. Payment processing requires Growth plan or above.' },
  { q: 'Is our data secure?', a: 'Yes. All data is encrypted in transit and at rest. We use Supabase infrastructure with enterprise-grade security and row-level access controls. Your member data is never sold, shared with advertisers, or used to train AI models.' },
  { q: 'Can we use our own domain?', a: 'Yes on Growth ($50/yr add-on) and included free on Pro ($69/mo). All plans get a clean orgname.syndicade.com subdomain at no extra cost.' },
  { q: 'What happens when we hit our member limit?', a: 'You can add members above your plan cap at $1/member/month, making the next tier the obvious choice. You\'re never cut off — we just make upgrading the clear value move.' },
];

var PRIVACY_POINTS = [
  { iconKey: 'lock',      color: '#22C55E', title: 'Your member data is yours', desc: 'We never sell, rent, or share your member list with advertisers or third parties. Ever.' },
  { iconKey: 'eyeOff',    color: '#3B82F6', title: 'No ads between your announcements', desc: 'When you post an update, every member sees it — not the ones who engaged last week. No algorithm decides who gets your message.' },
  { iconKey: 'trendingUp',color: '#F5B731', title: 'Events reach real people', desc: 'Your RSVP list is your actual members. No bots, no ghost accounts, no inflated numbers. Just the people who said they\'d show up.' },
  { iconKey: 'shield',    color: '#8B5CF6', title: 'You own your community', desc: 'Export your member list any time. If you ever leave, your data leaves with you. No lock-in, no hostage situations.' },
];

export default function LandingPage() {
  var navigate = useNavigate();
  var { isDark, toggle } = useTheme();

  var [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  var [openFaq, setOpenFaq]                 = useState(null);
  var [contactForm, setContactForm]         = useState({ name: '', email: '', organization: '', message: '' });
  var [contactStatus, setContactStatus]     = useState(null);
  var [contactLoading, setContactLoading]   = useState(false);
  var [scrolled, setScrolled]               = useState(false);
  var [billingInterval, setBillingInterval] = useState('monthly');

  var content = useSiteContentMap([
    'hero_headline_main',
    'hero_headline_accent',
    'hero_subheadline',
    'hero_cta_primary',
    'hero_cta_secondary',
    'features_section_label',
    'features_headline',
    'features_subheadline',
    'spotlight_label',
    'pricing_section_label',
    'pricing_headline',
    'pricing_subheadline',
    'pricing_trial_badge',
    'final_cta_headline',
    'final_cta_body',
    'final_cta_button',
    'footer_tagline',
    'footer_contact_email',
    'footer_copyright',
  ], {
    hero_headline_main:      "Your community's",
    hero_headline_accent:    'bulletin board,',
    hero_subheadline:        'Before the internet, communities organized on bulletin boards. Syndicade brings that board online — without the corporate software, the ads, or taking a cut of your donations.',
    hero_cta_primary:        'Start Free — 14 Days',
    hero_cta_secondary:      'See How It Works',
    features_section_label:  'Everything on one board',
    features_headline:       'All the tools your community needs',
    features_subheadline:    "Purpose-built for nonprofits and volunteer orgs. Not adapted from corporate tools.",
    spotlight_label:         'Killer feature',
    pricing_section_label:   'Pricing',
    pricing_headline:        'Funded by communities, not investors',
    pricing_subheadline:     'No ads. No data selling. A fair price to keep the board running.',
    pricing_trial_badge:     'Annual billing saves 2 months. We never take a cut of your donations or ticket sales.',
    final_cta_headline:      'Bring your community board online.',
    final_cta_body:          'Join nonprofits and community organizations already using Syndicade.',
    final_cta_button:        'Start Free — 14 Days',
    footer_tagline:          'Where Community Work Connects.',
    footer_contact_email:    'hello@syndicade.com',
    footer_copyright:        new Date().getFullYear() + ' Syndicade. All rights reserved.',
  });

  useEffect(function() {
    var onScroll = function() { setScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return function() { window.removeEventListener('scroll', onScroll); };
  }, []);

  function scrollTo(id) {
    setMobileMenuOpen(false);
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function goToSignup() {
    navigate('/signup');
  }

  function goToPricing() {
    window.scrollTo({ top: 0 });
    navigate('/pricing');
  }

async function handleContactSubmit(e) {
  e.preventDefault();
  if (!contactForm.name || !contactForm.email || !contactForm.message) return;
  try {
    setContactLoading(true);
    var result = await supabase.from('marketing_contacts').insert([contactForm]);
    if (result.error) throw result.error;

    // Send email notification to hello@syndicade.org
await supabase.functions.invoke('send-email', {
  body: {
    to: 'hello@syndicade.org',
    subject: 'New Contact Form Submission — ' + contactForm.name,
    html: '<p><strong>Name:</strong> ' + contactForm.name + '</p>' +
          '<p><strong>Email:</strong> ' + contactForm.email + '</p>' +
          (contactForm.organization ? '<p><strong>Organization:</strong> ' + contactForm.organization + '</p>' : '') +
          '<p><strong>Message:</strong></p><p>' + contactForm.message + '</p>',
  },
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG1ocXJ5Z2tua29keWRidW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzc0NjksImV4cCI6MjA4NDA1MzQ2OX0.B7DsLVNZuG1l39ABXDk1Km_737tCvbWAZGhqVCC3ddE'
  }
});

    setContactStatus('success');
    setContactForm({ name: '', email: '', organization: '', message: '' });
  } catch (_) {
    setContactStatus('error');
  } finally {
    setContactLoading(false);
  }
}

  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg     = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';
  var navBg         = scrolled ? (isDark ? 'rgba(14,21,35,0.96)' : 'rgba(248,250,252,0.97)') : (isDark ? '#0E1523' : '#FFFFFF');

  // Pricing data
var PLANS = [
  {
    name: 'Starter',
    monthlyPrice: '$29.99',
    annualPrice: '$24.99',
    annualTotal: '$299.90/yr',
    meta: '50 members · 2 GB storage · 1 page',
    tagline: 'Events, RSVP, recurring events, polls, surveys, announcements, document library, sign-up forms, programs, chat, donation pages, and your orgname.syndicade.com subdomain.',
    btnBg: '#0E1523',
    btnColor: '#F5B731',
    tack: '#D4A017',
    cardBgColor: '#FEF9C3',
    nameColor: '#92700A',
    pop: false,
  },
  {
    name: 'Growth',
    monthlyPrice: '$49.99',
    annualPrice: '$41.66',
    annualTotal: '$499.90/yr',
    meta: '150 members · 10 GB storage · 7 pages',
    tagline: 'Everything in Starter + paid event tickets (flat $1/ticket, no revenue cut), membership dues, email blasts + newsletter builder (500/mo), full analytics, and admin inbox.',
    btnBg: '#3B82F6',
    btnColor: 'white',
    tack: '#1D4ED8',
    cardBgColor: '#DBEAFE',
    nameColor: '#1E40AF',
    pop: true,
  },
  {
    name: 'Pro',
    monthlyPrice: '$69.99',
    annualPrice: '$58.32',
    annualTotal: '$699.90/yr',
    meta: '300 members · 30 GB storage · Unlimited pages',
    tagline: 'Everything in Growth + custom domain (included), remove Syndicade branding (included), unlimited email blasts, AI content assistant, and priority support.',
    btnBg: '#16A34A',
    btnColor: 'white',
    tack: '#16A34A',
    cardBgColor: '#DCFCE7',
    nameColor: '#166534',
    pop: false,
  },
  {
  name: 'Student',
  monthlyPrice: '$19.99',
  annualPrice: null,
  annualTotal: null,
  meta: '50 members · 2 GB storage · Monthly only',
  tagline: 'Same features as Starter. For student organizations and campus groups. Requires a verified .edu email address. Pause up to 6 months per year.',
  btnBg: '#EA580C',
  btnColor: 'white',
  tack: '#C2410C',
  cardBgColor: '#FEF3C7',
  nameColor: '#92400E',
  pop: false,
  studentOnly: true,
},
];

  return (
    <div style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: textPrimary, transition: 'background 0.2s, color 0.2s' }}>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none" style={{ background: '#F5B731', color: '#111827' }}>
        Skip to main content
      </a>

      {/* ── Nav ── */}
      <header role="banner" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: navBg, borderBottom: '1px solid ' + (scrolled ? borderColor : 'transparent'), backdropFilter: scrolled ? 'blur(12px)' : 'none', transition: 'all 0.25s' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          <button onClick={function() { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" aria-label="Syndicade — scroll to top" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0E1523' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
          </button>

          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: '4px' }} aria-label="Main navigation">
            <Link to="/features" className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 500, color: textSecondary, padding: '6px 12px', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}>Features</Link>
            <Link to="/pricing" className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 500, color: textSecondary, padding: '6px 12px', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}>Pricing</Link>
            {[['faq','FAQ'],['contact','Contact']].map(function(item) {
              return (
                <button key={item[0]} onClick={function() { scrollTo(item[0]); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 500, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}>
                  {item[1]}
                </button>
              );
            })}
            <div style={{ width: '1px', height: '16px', background: borderColor, margin: '0 4px' }} aria-hidden="true" />
            <Link to="/discover" className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 500, color: '#3B82F6', padding: '6px 12px', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#93C5FD'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#3B82F6'; }}>
              Discover Events
            </Link>
            <Link to="/explore" className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 500, color: '#22C55E', padding: '6px 12px', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#86EFAC'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#22C55E'; }}>
              Explore Orgs
            </Link>
          </nav>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '10px' }}>
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
            <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}>
              Log In
            </button>
            <button onClick={function() { goToSignup(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-xl" style={{ fontSize: '14px', fontWeight: 700, color: '#111827', background: '#F5B731', border: 'none', cursor: 'pointer', padding: '9px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(245,183,49,0.4)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
              Start Free — 14 Days
            </button>
          </div>

          <button className="md:hidden focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" onClick={function() { setMobileMenuOpen(!mobileMenuOpen); }} aria-expanded={mobileMenuOpen} aria-label="Toggle mobile menu" style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}>
            <Icon path={mobileMenuOpen ? ICONS.x : ICONS.menu} size={20} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div role="navigation" aria-label="Mobile navigation" style={{ background: cardBg, borderTop: '1px solid ' + borderColor, padding: '12px 24px 20px' }}>
            <Link to="/features" onClick={function() { setMobileMenuOpen(false); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ display: 'block', padding: '12px 0', fontSize: '14px', fontWeight: 500, color: textSecondary, borderBottom: '1px solid ' + borderColor, textDecoration: 'none' }}>Features</Link>
            {[['how-it-works','How It Works'],['faq','FAQ'],['contact','Contact']].map(function(item) {
              return <button key={item[0]} onClick={function() { scrollTo(item[0]); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 0', fontSize: '14px', fontWeight: 500, color: textSecondary, background: 'none', border: 'none', borderBottom: '1px solid ' + borderColor, cursor: 'pointer' }}>{item[1]}</button>;
            })}
            <Link to="/pricing" onClick={function() { setMobileMenuOpen(false); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ display: 'block', padding: '12px 0', fontSize: '14px', fontWeight: 500, color: textSecondary, borderBottom: '1px solid ' + borderColor, textDecoration: 'none' }}>Pricing</Link>
            <Link to="/discover" onClick={function() { setMobileMenuOpen(false); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ display: 'block', padding: '12px 0', fontSize: '14px', fontWeight: 500, color: '#3B82F6', borderBottom: '1px solid ' + borderColor, textDecoration: 'none' }}>Discover Events</Link>
            <Link to="/explore" onClick={function() { setMobileMenuOpen(false); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ display: 'block', padding: '12px 0', fontSize: '14px', fontWeight: 500, color: '#22C55E', borderBottom: '1px solid ' + borderColor, textDecoration: 'none' }}>Explore Organizations</Link>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 600, color: textSecondary, background: 'none', border: '1px solid ' + borderColor, borderRadius: '10px', cursor: 'pointer' }}>Log In</button>
              <button onClick={function() { goToSignup(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 700, color: '#111827', background: '#F5B731', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Start Free</button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content">

        {/* ── Hero ── */}
        <section aria-labelledby="hero-heading" style={{ paddingTop: '64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

            {/* Left — copy */}
            <div style={{ background: pageBg, padding: '24px 48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ maxWidth: '520px', marginLeft: 'auto' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', color: '#F5B731', marginBottom: '20px' }}>
                  <span aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5B731', display: 'inline-block' }} />
                  Starts at $29.99/mo · 14-day free trial
                </div>

                <h1 id="hero-heading" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '18px', color: textPrimary }}>
                  {content['hero_headline_main']}<br />
                  <span style={{ color: '#F5B731' }}>{content['hero_headline_accent']}</span><br />
                  brought online.
                </h1>

                <p style={{ fontSize: '16px', color: textSecondary, lineHeight: 1.7, marginBottom: '32px' }}>
                  {content['hero_subheadline']}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <button onClick={function() { goToSignup(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: 700, background: '#0E1523', color: '#F5B731', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', transition: 'opacity 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.opacity = '0.88'; }} onMouseOut={function(e) { e.currentTarget.style.opacity = '1'; }}>
                    {content['hero_cta_primary']} <Icon path={ICONS.arrow} size={16} />
                  </button>
                  <button onClick={function() { scrollTo('how-it-works'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', fontSize: '15px', fontWeight: 600, background: 'none', color: textSecondary, border: '1px solid ' + borderColor, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; e.currentTarget.style.borderColor = '#94A3B8'; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; e.currentTarget.style.borderColor = borderColor; }}>
                    {content['hero_cta_secondary']}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: textMuted }}>No credit card&nbsp;&middot;&nbsp;No ads&nbsp;&middot;&nbsp;No revenue cut on payments</p>
              </div>
            </div>

            {/* Right — post-it board */}
            <div aria-hidden="true" style={{ background: '#1A2035', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: '#64748B', textTransform: 'uppercase' }}>
                  Riverside Neighborhood Assoc.
                </div>
                <PostIt large={true} bg="#FEF9C3" tackColor="#D4A017" badgeBg="#22C55E" badgeText="white" category="EVENT" title="Spring Volunteer Drive — April 20, 9am–noon" body="We need 12 volunteers for our spring food drive. Tools provided, coffee and breakfast for all helpers." org="Toledo Food Bank" orgColor="#D97706" date="2 hours ago" btnLabel="RSVP" btnBg="#D4A017" btnTextColor="white" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <PostIt bg="#DBEAFE" tackColor="#1D4ED8" badgeBg="#3B82F6" badgeText="white" category="POLL" title="Vote: Summer Gala theme closes Sunday" org="Riverside NA" orgColor="#1D4ED8" date="1 day ago" />
                  <PostIt bg="#DCFCE7" tackColor="#16A34A" badgeBg="#22C55E" badgeText="white" category="DOCUMENT" title="Q1 Budget now in Documents" org="Arts Alliance" orgColor="#15803D" date="3 days ago" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Stats bar ── */}
        <div style={{ background: '#0E1523', borderTop: '1px solid #2A3550', borderBottom: '1px solid #2A3550' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { val: '$29.99/mo', label: 'Starting price' },
              { val: '14 days',   label: 'Free trial, no card needed' },
              { val: '$1/ticket',  label: 'Flat fee on paid events (no % cut)' },
              { val: '0',         label: 'Ads. Ever.' },
            ].map(function(stat, i) {
              return (
                <div key={stat.label} style={{ textAlign: 'center', padding: '18px 16px', borderRight: i < 3 ? '1px solid #2A3550' : 'none' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#F5B731', lineHeight: 1 }}>{stat.val}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Features ── */}
        <section id="features" aria-labelledby="features-heading" style={{ padding: '80px 24px', background: sectionBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                {content['features_section_label']}
              </p>
              <h2 id="features-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '14px' }}>
                {content['features_headline']}
              </h2>
              <p style={{ fontSize: '16px', color: textSecondary, maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                {content['features_subheadline']}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {FEATURES.map(function(f) {
                return (
                  <div key={f.label} style={{ background: cardBg, borderRadius: '14px', padding: '24px', border: '1px solid ' + borderColor, borderLeft: '4px solid ' + f.color }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.bg, marginBottom: '14px', color: f.color }}>
                      <Icon path={ICONS[f.iconKey]} size={20} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>{f.label}</h3>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link to="/features" className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-xl" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: 600, background: cardBg, color: textPrimary, border: '1px solid ' + borderColor, borderRadius: '10px', textDecoration: 'none', transition: 'border-color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#F5B731'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = borderColor; }}>
                View all features in detail <Icon path={ICONS.arrow} size={15} />
              </Link>
            </div>
          </div>
        </section>
        <section aria-labelledby="privacy-heading" style={{ padding: '80px 24px', background: '#0E1523', borderBottom: '1px solid #2A3550' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>Your community deserves better</p>
              <h2 id="privacy-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
                A social feed is not a community platform
              </h2>
              <p style={{ fontSize: '16px', color: '#CBD5E1', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
                Generic social tools were built to keep people scrolling — not to help your organization get things done. Here's what makes Syndicade different.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {PRIVACY_POINTS.map(function(p) {
                return (
                  <div key={p.title} style={{ background: '#1A2035', borderRadius: '14px', padding: '28px 24px', border: '1px solid #2A3550' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', marginBottom: '16px', color: p.color, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Icon path={ICONS[p.iconKey]} size={22} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px', lineHeight: 1.3 }}>{p.title}</h3>
                    <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.65 }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Comparison callout */}
            <div style={{ marginTop: '40px', background: '#151B2D', border: '1px solid #2A3550', borderRadius: '16px', padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0' }}>
              <div style={{ padding: '8px 24px 8px 0', borderRight: '1px solid #2A3550' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#64748B', marginBottom: '16px' }}>Generic social tools</p>
                {['Algorithm decides who sees your posts','Member data used to target ads','RSVP counts include bots and lurkers','Your member list lives on their servers','Events buried under sponsored content'].map(function(item) {
                  return (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <span aria-hidden="true" style={{ flexShrink: 0, width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                        <Icon path={ICONS.x} size={9} style={{ color: '#EF4444' }} />
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>{item}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '8px 0 8px 24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '16px' }}>Syndicade</p>
                {['Every member sees every announcement you post','Your data is never sold or shared with advertisers','RSVPs are verified members — real people','Export your member list any time you want','Events appear on a real discovery board for your community'].map(function(item) {
                  return (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <span aria-hidden="true" style={{ flexShrink: 0, width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                        <Icon path={ICONS.check} size={9} style={{ color: '#22C55E' }} />
                      </span>
                      <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Discovery Section ── */}
        <section aria-labelledby="discovery-heading" style={{ padding: '80px 24px', background: sectionBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>Open to the community</p>
              <h2 id="discovery-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '14px' }}>
                Find events and organizations near you
              </h2>
              <p style={{ fontSize: '16px', color: textSecondary, maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
                No account needed. Verified nonprofits and their public events are searchable by anyone in the community. Show up. Get involved.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>

              {/* Discover Events card */}
              <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #1D3461 0%, #1A2035 100%)', padding: '32px 28px 24px', borderBottom: '1px solid ' + borderColor }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#3B82F6' }}>
                    <Icon path={ICONS.calendar} size={24} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>Discover Events</h3>
                  <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6 }}>Browse upcoming public events from verified nonprofits in your community. Filter by date, type, or neighborhood.</p>
                </div>
                <div style={{ padding: '20px 28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {['Food drives, fundraisers, volunteer opportunities','RSVP directly — no account needed for public events','Events from verified orgs only — no spam, no fakes','See what\'s happening across your whole city'].map(function(item) {
                      return (
                        <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span aria-hidden="true" style={{ flexShrink: 0, marginTop: '3px', color: '#3B82F6' }}><Icon path={ICONS.check} size={14} /></span>
                          <span style={{ fontSize: '13px', color: textSecondary }}>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Link to="/discover" className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, background: '#3B82F6', color: 'white', borderRadius: '10px', textDecoration: 'none', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#2563EB'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#3B82F6'; }}>
                    Browse Events <Icon path={ICONS.arrow} size={15} />
                  </Link>
                </div>
              </div>

              {/* Find Organizations card */}
              <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, #1B3A2F 0%, #1A2035 100%)', padding: '32px 28px 24px', borderBottom: '1px solid ' + borderColor }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#22C55E' }}>
                    <Icon path={ICONS.globe} size={24} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>Find Organizations</h3>
                  <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6 }}>Explore verified nonprofits and community groups in your area. Follow orgs you care about and never miss an update.</p>
                </div>
                <div style={{ padding: '20px 28px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {['Search by cause, neighborhood, or keyword','Verified 501(c)(3) badge — know you\'re supporting a real org','Follow organizations to get their public updates','Discover collaboration between orgs working on similar causes'].map(function(item) {
                      return (
                        <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span aria-hidden="true" style={{ flexShrink: 0, marginTop: '3px', color: '#22C55E' }}><Icon path={ICONS.check} size={14} /></span>
                          <span style={{ fontSize: '13px', color: textSecondary }}>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Link to="/explore" className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700, background: '#22C55E', color: '#111827', borderRadius: '10px', textDecoration: 'none', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.color = 'white'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.color = '#111827'; }}>
                    Explore Organizations <Icon path={ICONS.arrow} size={15} />
                  </Link>
                </div>
              </div>

            </div>

            {/* Community callout bar */}
            <div style={{ background: isDark ? '#151B2D' : '#F1F5F9', border: '1px solid ' + borderColor, borderRadius: '14px', padding: '24px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245,183,49,0.15)', border: '1px solid rgba(245,183,49,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5B731', flexShrink: 0 }}>
                  <Icon path={ICONS.users} size={22} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '2px' }}>The Community Board — for verified org admins</p>
                  <p style={{ fontSize: '13px', color: textMuted }}>A private space where verified nonprofits post needs, share surplus resources, and find collaboration partners. No social feed. No noise.</p>
                </div>
              </div>
              <button onClick={goToSignup} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ flexShrink: 0, padding: '10px 20px', fontSize: '13px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Get Verified Access
              </button>
            </div>
          </div>
        </section>


        <section aria-labelledby="spotlight-heading" style={{ padding: '80px 24px 0px', background: pageBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'start', marginBottom: '52px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '16px' }}>
                  {content['spotlight_label']}
                </p>
                <h2 id="spotlight-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, lineHeight: 1.2, marginBottom: '24px' }}>
                  One login.<br /><span style={{ color: '#3B82F6' }}>Every organization.</span><br />Total clarity.
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                  {[
                    ['No missed commitments','Your unified calendar shows events from every org you belong to.'],
                    ['Less email clutter','Announcements and updates live in one clean feed.'],
                    ['Better participation','When members stay informed, they show up more.'],
                  ].map(function(item) {
                    return (
                      <div key={item[0]} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div aria-hidden="true" style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', color: 'white' }}>
                          <Icon path={ICONS.check} size={13} />
                        </div>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>{item[0]}</span>
                          <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>{item[1]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={function() { goToSignup(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, background: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.4)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#2563EB'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#3B82F6'; }}>
                  Try It Free <Icon path={ICONS.arrow} size={16} />
                </button>
              </div>

              {/* Mascot — fixed size, no overlap */}
              <div aria-hidden="true" style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <p style={{ fontSize: '12px', color: textMuted, textAlign: 'center' }}>Live activity across multiple organizations</p>
                <PostIt large={true} bg="#FEF9C3" tackColor="#D4A017" badgeBg="#22C55E" badgeText="white" category="ANNOUNCEMENT" title="Spring Meeting Recap Posted" body="Minutes and action items from last Tuesday's board meeting." org="Toledo Food Bank" orgColor="#D97706" date="1h ago" />
                <img src="/mascot-pair.png" alt="" aria-hidden="true" style={{ width: '280px', height: 'auto', display: 'block' }} onError={function(e) { e.currentTarget.style.display = 'none'; }} />
              </div>
            </div>

            {/* Post-it board grid */}
            <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {[
                { bg: '#DBEAFE', tack: '#1D4ED8', badgeBg: '#3B82F6', badgeText: 'white', cat: 'EVENT',     title: 'Volunteer Orientation — April 8',  body: '6pm at Community Center Room B. Refreshments provided.',    org: 'Riverside NA',     orgColor: '#1D4ED8', date: '3h ago' },
                { bg: '#DCFCE7', tack: '#16A34A', badgeBg: '#22C55E', badgeText: 'white', cat: 'VOLUNTEER', title: '10 Spots Left: Food Drive',         body: 'Sorting donations April 12–13. Sign up by Friday!',          org: 'Toledo Food Bank', orgColor: '#15803D', date: '5h ago' },
                { bg: '#FCE7F3', tack: '#DB2777', badgeBg: '#EC4899', badgeText: 'white', cat: 'POLL',      title: 'Vote: Summer Gala Theme',           body: 'Garden Party · Masquerade · Under the Stars.',              org: 'Arts Alliance',    orgColor: '#DB2777', date: '1d ago' },
                { bg: '#FEF3C7', tack: '#D97706', badgeBg: '#F59E0B', badgeText: 'white', cat: 'EVENT',     title: 'Neighborhood Watch Meeting',        body: 'Every 3rd Tuesday. April 15 at 7pm.',                        org: 'Riverside NA',     orgColor: '#D97706', date: '2d ago' },
                { bg: '#EDE9FE', tack: '#7C3AED', badgeBg: '#8B5CF6', badgeText: 'white', cat: 'DOCUMENT',  title: '2025 Q1 Financial Report',          body: "Treasurer's budget vs. actuals through March 31st.",         org: 'Arts Alliance',    orgColor: '#7C3AED', date: '3d ago' },
                { bg: '#CCFBF1', tack: '#0F766E', badgeBg: '#14B8A6', badgeText: 'white', cat: 'VOLUNTEER', title: 'Garden Workday — April 26',         body: 'Spring planting. Bring gloves. Lunch provided!',             org: 'Garden Club',      orgColor: '#0F766E', date: '4d ago' },
              ].map(function(card) {
                return <PostIt key={card.title} bg={card.bg} tackColor={card.tack} badgeBg={card.badgeBg} badgeText={card.badgeText} category={card.cat} title={card.title} body={card.body} org={card.org} orgColor={card.orgColor} date={card.date} />;
              })}
            </div>
            <div style={{ height: '80px' }} />
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" aria-labelledby="how-heading" style={{ padding: '80px 24px', background: sectionBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>Ready?</p>
              <h2 id="how-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '12px' }}>How It Works</h2>
              <p style={{ fontSize: '16px', color: textSecondary }}>Three steps to a fully connected community organization.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '48px' }}>
              {STEPS.map(function(s) {
                return (
                  <div key={s.n} style={{ textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#F5B731', color: '#111827', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(245,183,49,0.35)' }}>{s.n}</div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>{s.label}</h3>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={function() { goToSignup(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,183,49,0.35)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Get Started Now <Icon path={ICONS.arrow} size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" aria-labelledby="pricing-heading" style={{ padding: '80px 24px', background: pageBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                {content['pricing_section_label']}
              </p>
              <h2 id="pricing-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '12px' }}>
                {content['pricing_headline']}
              </h2>
              <p style={{ fontSize: '16px', color: textSecondary, marginBottom: '28px' }}>
                {content['pricing_subheadline']}
              </p>

              {/* Billing interval toggle */}
              <div role="group" aria-label="Billing interval" style={{ display: 'inline-flex', background: isDark ? '#151B2D' : '#F1F5F9', border: '1px solid ' + borderColor, borderRadius: '12px', padding: '4px', gap: '4px' }}>
                {[['monthly','Monthly'],['annual','Annual']].map(function(opt) {
                  var isActive = billingInterval === opt[0];
                  return (
                    <button
                      key={opt[0]}
                      onClick={function() { setBillingInterval(opt[0]); }}
                      aria-pressed={isActive}
                      className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
                      style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', background: isActive ? (isDark ? '#1E2845' : '#FFFFFF') : 'transparent', color: isActive ? textPrimary : textMuted, boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {opt[1]}
                      {opt[0] === 'annual' && (
                        <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', padding: '1px 6px', borderRadius: '99px' }}>
                          Save 2 months
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px', justifyItems: 'center' }}>
              {PLANS.map(function(plan) {
                var displayPrice = (plan.studentOnly || billingInterval === 'monthly') ? plan.monthlyPrice : plan.annualPrice;
                return (
                  <div key={plan.name} style={{ background: plan.cardBgColor, borderRadius: '4px', padding: '24px', position: 'relative', marginTop: '12px', boxShadow: plan.pop ? '4px 6px 20px rgba(0,0,0,0.22)' : '3px 4px 12px rgba(0,0,0,0.15)', backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.05) 24px)', backgroundPositionY: '32px', border: plan.pop ? '2px solid rgba(59,130,246,0.5)' : 'none', gridColumn: plan.studentOnly ? '2' : 'auto' }}>
                    <div aria-hidden="true" style={{ width: '14px', height: '14px', borderRadius: '50%', position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, ' + plan.tack + ' 52%, rgba(0,0,0,0.25) 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
                    {plan.pop && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59,130,246,0.15)', color: '#1D4ED8', border: '1px solid rgba(59,130,246,0.3)', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', marginBottom: '10px' }}>
                        Most Popular
                      </div>
                    )}
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: plan.nameColor, marginBottom: '10px' }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '40px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{displayPrice}</span>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>/mo</span>
                    </div>
                    {billingInterval === 'annual' && !plan.studentOnly && (
  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>billed as {plan.annualTotal}</div>
)}
{plan.studentOnly && (
  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>Requires .edu email · Monthly only</div>
)}
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '14px' }}>{plan.meta}</div>
                    <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, marginBottom: '18px' }}>{plan.tagline}</p>
                    <button onClick={function() { goToSignup(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 700, background: plan.btnBg, color: plan.btnColor, border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'opacity 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.opacity = '0.88'; }} onMouseOut={function(e) { e.currentTarget.style.opacity = '1'; }}>
                      Start Free — 14 Days
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add-ons */}
            <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '16px' }}>Flexible add-ons</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Custom domain', price: '$50/yr', note: 'Growth+ (included on Pro)' },
                  { label: 'Remove branding', price: '$10/mo', note: 'Growth+ (included on Pro)' },
                  { label: 'Extra storage', price: '+$10/mo per 10 GB', note: 'Growth+' },
                  { label: 'Featured event', price: '$15/wk or $40/30 days', note: 'Growth+' },
                  { label: 'Extra members', price: '$1/member/mo over cap', note: 'All plans' },
                ].map(function(addon) {
                  return (
                    <div key={addon.label} style={{ padding: '12px 14px', background: isDark ? '#151B2D' : '#F8FAFC', borderRadius: '10px', border: '1px solid ' + borderColor }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '2px' }}>{addon.label}</div>
                      <div style={{ fontSize: '12px', color: '#F5B731', fontWeight: 600, marginBottom: '2px' }}>{addon.price}</div>
                      <div style={{ fontSize: '11px', color: textMuted }}>{addon.note}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '12px', color: textMuted, marginTop: '14px' }}>Have a promo code? Apply it at checkout for an extended 30-day free trial.</p>
            </div>

            {/* Compare plans link */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button onClick={function() { goToPricing(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', fontSize: '14px', fontWeight: 600, background: cardBg, color: textPrimary, border: '1px solid ' + borderColor, borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#3B82F6'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = borderColor; }}>
                Compare all plans in detail <Icon path={ICONS.arrow} size={15} />
              </button>
            </div>

            {/* Nonprofit callout */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', background: 'rgba(245,183,49,0.06)', border: '1px solid rgba(245,183,49,0.2)', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,183,49,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5B731' }}>
                <Icon path={ICONS.shield} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '2px' }}>Verified nonprofit rate</p>
                <p style={{ fontSize: '12px', color: textMuted }}>Verified 501(c)(3) orgs get a 30-day free trial (vs standard 14 days), a public discovery board listing, a verified badge, and access to the Community Board.</p>
              </div>
              <button onClick={function() { goToPricing(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ flexShrink: 0, padding: '7px 16px', fontSize: '12px', fontWeight: 700, background: 'none', color: '#F5B731', border: '1px solid rgba(245,183,49,0.4)', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Learn More</button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: textMuted, marginTop: '14px' }}>
              {content['pricing_trial_badge']}
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" aria-labelledby="faq-heading" style={{ padding: '80px 24px', background: sectionBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 id="faq-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary }}>Frequently Asked Questions</h2>
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

        {/* ── Contact ── */}
        <section id="contact" aria-labelledby="contact-heading" style={{ padding: '80px 24px', background: pageBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 id="contact-heading" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: textPrimary, marginBottom: '10px' }}>Get In Touch</h2>
              <p style={{ fontSize: '15px', color: textSecondary }}>Questions? We'd love to hear from you.</p>
            </div>
            {contactStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '48px', borderRadius: '16px', background: cardBg, border: '1px solid ' + borderColor }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#22C55E' }}>
                  <Icon path={ICONS.check} size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ fontSize: '14px', color: textSecondary, marginBottom: '24px' }}>We'll get back to you within one business day.</p>
                <button onClick={function() { setContactStatus(null); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} noValidate aria-label="Contact form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[{ id: 'contact-name', label: 'Name', type: 'text', key: 'name', placeholder: 'Your name', req: true },{ id: 'contact-email', label: 'Email', type: 'email', key: 'email', placeholder: 'you@example.com', req: true }].map(function(field) {
                    return (
                      <div key={field.id}>
                        <label htmlFor={field.id} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>{field.label}{field.req && <span aria-hidden="true"> *</span>}</label>
                        <input id={field.id} type={field.type} value={contactForm[field.key]} onChange={function(e) { var v = e.target.value; setContactForm(function(p) { var n = Object.assign({}, p); n[field.key] = v; return n; }); }} required={field.req} placeholder={field.placeholder} aria-required={field.req} className="focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', background: inputBg, color: textPrimary, border: '1px solid ' + borderColor, boxSizing: 'border-box' }} />
                      </div>
                    );
                  })}
                </div>
                <div>
                  <label htmlFor="contact-org" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>Organization <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span></label>
                  <input id="contact-org" type="text" value={contactForm.organization} onChange={function(e) { var v = e.target.value; setContactForm(function(p) { var n = Object.assign({}, p); n.organization = v; return n; }); }} placeholder="Your organization name" className="focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', background: inputBg, color: textPrimary, border: '1px solid ' + borderColor, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label htmlFor="contact-message" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>Message <span aria-hidden="true">*</span></label>
                  <textarea id="contact-message" rows={4} value={contactForm.message} onChange={function(e) { var v = e.target.value; setContactForm(function(p) { var n = Object.assign({}, p); n.message = v; return n; }); }} required aria-required="true" placeholder="How can we help?" className="focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', background: inputBg, color: textPrimary, border: '1px solid ' + borderColor, resize: 'none', boxSizing: 'border-box' }} />
                </div>
                {contactStatus === 'error' && <p role="alert" style={{ fontSize: '13px', color: '#EF4444' }}>Something went wrong. Please try again.</p>}
                <button type="submit" disabled={contactLoading || !contactForm.name || !contactForm.email || !contactForm.message} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, background: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', cursor: (contactLoading || !contactForm.name || !contactForm.email || !contactForm.message) ? 'not-allowed' : 'pointer', opacity: (contactLoading || !contactForm.name || !contactForm.email || !contactForm.message) ? 0.5 : 1, transition: 'background 0.15s' }}>
                  {contactLoading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section aria-labelledby="final-cta-heading" style={{ padding: '96px 24px', background: '#0E1523', textAlign: 'center' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <img src="/mascot-pair.png" alt="" aria-hidden="true" style={{ width: '140px', height: 'auto', marginBottom: '28px' }} onError={function(e) { e.currentTarget.style.display = 'none'; }} />
            <h2 id="final-cta-heading" style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px' }}>
              {content['final_cta_headline']}
            </h2>
            <p style={{ fontSize: '16px', color: '#CBD5E1', marginBottom: '12px', lineHeight: 1.6 }}>
              {content['final_cta_body']}
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '36px' }}>14-day free trial · No credit card · Cancel any time</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <button onClick={function() { goToSignup(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '16px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,183,49,0.4)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                {content['final_cta_button']} <Icon path={ICONS.arrow} size={18} />
              </button>
              <button onClick={function() { goToPricing(); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '16px', fontWeight: 600, background: 'none', color: '#CBD5E1', border: '1px solid #2A3550', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = '#2A3550'; e.currentTarget.style.color = '#CBD5E1'; }}>
                View Pricing
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer role="contentinfo" style={{ background: '#060E1A', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          {/* Top row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '40px', marginBottom: '40px' }}>

            {/* Logo + tagline */}
            <div>
              <button onClick={function() { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" aria-label="Scroll to top" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
              </button>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Where Community Work Connects.</p>
            </div>

            {/* Link columns */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px' }}>

              {/* Community */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '14px' }}>Community</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[['Discover Events','/discover'],['Explore Organizations','/explore']].map(function(item) {
                    return (
                      <Link key={item[0]} to={item[1]} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>
                        {item[0]}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Platform */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '14px' }}>Platform</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[['Features','/features'],['Pricing','/pricing'],['About','/about']].map(function(item) {
                    return (
                      <Link key={item[0]} to={item[1]} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>
                        {item[0]}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Legal */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '14px' }}>Legal</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[['Terms of Service','/legal'],['Privacy Policy','/legal'],['Legal Information','/legal']].map(function(item) {
                    return (
                      <Link key={item[0]} to={item[1]} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>
                        {item[0]}
                      </Link>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: '#475569' }}>&copy; {content['footer_copyright']}</p>
            <p style={{ fontSize: '12px', color: '#475569' }}>No ads &middot; No data selling &middot; No revenue cut on payments</p>
          </div>

        </div>
      </footer>

    </div>
  );
}