import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

// ─── Icon ────────────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth, style }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'h-5 w-5'}
      style={style || {}}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {Array.isArray(path)
        ? path.map(function(d, i) {
            return (
              <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />
            );
          })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
    </svg>
  );
}

// ─── Mascot ──────────────────────────────────────────────────────────────────
function MascotPair({ width, height }) {
  return (
    <svg
      width={width || 200}
      height={height || 140}
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shadows */}
      <ellipse cx="48" cy="128" rx="30" ry="6" fill="#000000" opacity="0.10" />
      <ellipse cx="152" cy="128" rx="30" ry="6" fill="#000000" opacity="0.10" />

      {/* === Yellow Post-it character === */}
      <rect x="8" y="10" width="68" height="82" rx="7" fill="#F5B731" />
      <path d="M60 10 L76 10 L76 26 Z" fill="#B8750A" opacity="0.25" />
      <circle cx="32" cy="38" r="6" fill="#111827" />
      <circle cx="56" cy="38" r="6" fill="#111827" />
      <circle cx="34.5" cy="36" r="2.5" fill="white" />
      <circle cx="58.5" cy="36" r="2.5" fill="white" />
      <path d="M30 54 Q44 65 58 54" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Left arm */}
      <rect x="-4" y="54" width="16" height="11" rx="5.5" fill="#111827" />
      {/* Right arm toward blue */}
      <rect x="72" y="54" width="34" height="11" rx="5.5" fill="#111827" />
      {/* Legs */}
      <rect x="14" y="90" width="16" height="28" rx="8" fill="#111827" />
      <rect x="54" y="90" width="16" height="28" rx="8" fill="#111827" />

      {/* === Blue Post-it character === */}
      <rect x="124" y="10" width="68" height="82" rx="7" fill="#3B82F6" />
      <path d="M176 10 L192 10 L192 26 Z" fill="#1E40AF" opacity="0.25" />
      <circle cx="144" cy="38" r="6" fill="#111827" />
      <circle cx="168" cy="38" r="6" fill="#111827" />
      <circle cx="146.5" cy="36" r="2.5" fill="white" />
      <circle cx="170.5" cy="36" r="2.5" fill="white" />
      <path d="M142 54 Q156 65 170 54" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Left arm toward yellow */}
      <rect x="94" y="54" width="34" height="11" rx="5.5" fill="#111827" />
      {/* Right arm */}
      <rect x="188" y="54" width="16" height="11" rx="5.5" fill="#111827" />
      {/* Legs */}
      <rect x="130" y="90" width="16" height="28" rx="8" fill="#111827" />
      <rect x="170" y="90" width="16" height="28" rx="8" fill="#111827" />

      {/* Clasped hands overlap zone */}
      <rect x="100" y="54" width="16" height="11" rx="5.5" fill="#111827" />
      <rect x="101" y="55" width="7" height="9" rx="3.5" fill="#F5B731" opacity="0.8" />
      <rect x="108" y="55" width="7" height="9" rx="3.5" fill="#3B82F6" opacity="0.8" />
    </svg>
  );
}

// ─── Icons map ───────────────────────────────────────────────────────────────
var ICONS = {
  menu:       'M4 6h16M4 12h16M4 18h16',
  x:          'M6 18L18 6M6 6l12 12',
  check:      'M5 13l4 4L19 7',
  arrow:      'M13 7l5 5m0 0l-5 5m5-5H6',
  chevDown:   'M19 9l-7 7-7-7',
  sun:        'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z',
  moon:       'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  megaphone:  ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  calendar:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  users:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  document:   ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  chart:      ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
  clipboard:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  chat:       ['M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'],
  globe:      ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  shield:     ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  tools:      ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  warning:    ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  bolt:       ['M13 10V3L4 14h7v7l9-11h-7z'],
  lock:       ['M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'],
  device:     ['M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'],
  clock:      ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  mail:       ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  dashboard:  ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
};

// ─── Data ────────────────────────────────────────────────────────────────────
var FEATURES = [
  { iconKey: 'megaphone', color: '#F5B731', bg: 'rgba(245,183,49,0.12)',  label: 'Announcements', desc: 'Pinned updates visible to all members instantly.' },
  { iconKey: 'calendar',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Events',         desc: 'Post and manage events with RSVP tracking.' },
  { iconKey: 'users',     color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: 'Volunteers',     desc: 'Sign-up sheets with real-time spot counts.' },
  { iconKey: 'document',  color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'Documents',      desc: 'Meeting minutes, budgets, and shared resources.' },
  { iconKey: 'chart',     color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'Polls',          desc: 'Make decisions together. Results in real time.' },
  { iconKey: 'clipboard', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Sign-Up Forms',  desc: 'Potluck lists, time slots, committee sign-ups.' },
];

var PAIN_POINTS = [
  { iconKey: 'tools',    label: 'Too many tools',    desc: 'Email, spreadsheets, Facebook groups, separate websites — scattered everywhere.' },
  { iconKey: 'warning',  label: 'Missed events',     desc: 'Updates buried in inboxes, members showing up to the wrong place.' },
  { iconKey: 'globe',    label: 'Outdated websites', desc: 'No one has time to update the website. It shows.' },
  { iconKey: 'megaphone',label: 'Volunteer burnout', desc: 'Coordinators spend hours on logistics instead of mission work.' },
  { iconKey: 'users',    label: 'No coordination',   desc: 'Organizations silo themselves when they could be helping each other.' },
];

var STEPS = [
  { n: '1', label: 'Create your organization', desc: 'Set up your profile in minutes. No tech skills required.' },
  { n: '2', label: 'Invite members and post events', desc: 'Build your calendar and send invitations from one dashboard.' },
  { n: '3', label: 'Everything flows together', desc: 'Members see unified updates across every org they belong to.' },
];

var PRICING_PREVIEW = [
  {
    name: 'Starter', price: '$14.99', period: '/mo', highlight: false,
    members: '50 members', storage: '5 GB',
    tagline: 'Everything you need to get started.',
  },
  {
    name: 'Growth', price: '$29', period: '/mo', highlight: true,
    members: '150 members', storage: '15 GB',
    tagline: 'Payments, analytics, and email notifications.',
  },
  {
    name: 'Pro', price: '$59', period: '/mo', highlight: false,
    members: '300 members', storage: '50 GB',
    tagline: 'Custom domain, no branding, email marketing.',
  },
];

var FAQS = [
  { q: 'Is there a free trial?', a: 'Yes. All plans include a 1-month free trial with no credit card required. Verified 501(c)(3) nonprofits get an extra free month stacked on top.' },
  { q: 'Can members belong to multiple organizations?', a: 'Absolutely — that is one of our core features. Members get a unified dashboard showing updates from every organization they belong to, in one place.' },
  { q: 'Do we need technical skills?', a: 'None at all. If you can send an email, you can set up Syndicade. Most organizations are fully running within 10 minutes.' },
  { q: 'Do you take a cut of payments or donations?', a: 'Never. We pass through Stripe fees only and take 0% of your dues, ticket sales, or donations. Payment processing is available on the Growth plan and above.' },
  { q: 'Is our data secure?', a: 'Yes. All data is encrypted in transit and at rest. We use Supabase infrastructure with enterprise-grade security and role-level access controls.' },
  { q: 'Can we use our own domain?', a: 'Yes on the Pro plan ($59/mo). Starter and Growth plans get a clean orgname.syndicade.com subdomain.' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  var navigate = useNavigate();
  var { isDark, toggle } = useTheme();

  var [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  var [openFaq, setOpenFaq]               = useState(null);
  var [contactForm, setContactForm]       = useState({ name: '', email: '', organization: '', message: '' });
  var [contactStatus, setContactStatus]   = useState(null);
  var [contactLoading, setContactLoading] = useState(false);
  var [scrolled, setScrolled]             = useState(false);

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

  async function handleContactSubmit(e) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    try {
      setContactLoading(true);
      var result = await supabase.from('marketing_contacts').insert([contactForm]);
      if (result.error) throw result.error;
      setContactStatus('success');
      setContactForm({ name: '', email: '', organization: '', message: '' });
    } catch (_) {
      setContactStatus('error');
    } finally {
      setContactLoading(false);
    }
  }

  // ── Theme tokens ──────────────────────────────────────────────────────────
  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionAltBg  = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';
  var navBg         = scrolled ? (isDark ? 'rgba(14,21,35,0.96)' : 'rgba(248,250,252,0.96)') : 'transparent';
  var navBorder     = scrolled ? borderColor : 'transparent';

  return (
    <div style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: textPrimary, transition: 'background 0.2s, color 0.2s' }}>

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none"
        style={{ background: '#F5B731', color: '#111827' }}
      >
        Skip to main content
      </a>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header
        role="banner"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: navBg, borderBottom: '1px solid ' + navBorder,
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* Logo */}
          <button
            onClick={function() { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
            aria-label="Syndicade — scroll to top"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <MascotPair width={36} height={28} />
            <span style={{ fontSize: '22px', fontWeight: 800, color: textPrimary }}>
              Syndi<span style={{ color: '#F5B731' }}>cade</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: '24px' }} aria-label="Main navigation">
            {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(function(item) {
              return (
                <button
                  key={item[0]}
                  onClick={function() { scrollTo(item[0]); }}
                  className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                  style={{ fontSize: '14px', fontWeight: 500, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }}
                  onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}
                >
                  {item[1]}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '12px' }}>
            {/* Theme toggle */}
            <button
              onClick={toggle}
              role="switch"
              aria-checked={!isDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                border: '1px solid ' + borderColor, background: cardBg, color: textSecondary,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Icon path={isDark ? ICONS.moon : ICONS.sun} className="h-3.5 w-3.5" />
              {isDark ? 'Dark' : 'Light'}
            </button>

            <button
              onClick={function() { navigate('/login'); }}
              className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
              style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', transition: 'color 0.15s' }}
              onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }}
              onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}
            >
              Log In
            </button>

            <button
              onClick={function() { navigate('/login'); }}
              className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-xl"
              style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#111827' : '#FFFFFF', background: '#F5B731', border: 'none', cursor: 'pointer', padding: '9px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(245,183,49,0.4)', transition: 'background 0.15s' }}
              onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }}
              onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
            onClick={function() { setMobileMenuOpen(!mobileMenuOpen); }}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}
          >
            <Icon path={mobileMenuOpen ? ICONS.x : ICONS.menu} className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            role="navigation"
            aria-label="Mobile navigation"
            style={{ background: cardBg, borderTop: '1px solid ' + borderColor, padding: '12px 24px 20px' }}
          >
            {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(function(item) {
              return (
                <button
                  key={item[0]}
                  onClick={function() { scrollTo(item[0]); }}
                  className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 0', fontSize: '14px', fontWeight: 500, color: textSecondary, background: 'none', border: 'none', borderBottom: '1px solid ' + borderColor, cursor: 'pointer' }}
                >
                  {item[1]}
                </button>
              );
            })}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={function() { navigate('/login'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
                style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 600, color: textSecondary, background: 'none', border: '1px solid ' + borderColor, borderRadius: '10px', cursor: 'pointer' }}
              >
                Log In
              </button>
              <button
                onClick={function() { navigate('/login'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
                style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 700, color: '#111827', background: '#F5B731', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-heading"
          style={{ paddingTop: '96px', paddingBottom: '64px', position: 'relative', overflow: 'hidden' }}
        >
          {/* Background blobs */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '80px', left: '20%', width: '400px', height: '400px', borderRadius: '50%', filter: 'blur(80px)', opacity: isDark ? 0.15 : 0.08, background: '#3B82F6' }} />
            <div style={{ position: 'absolute', bottom: '40px', right: '15%', width: '300px', height: '300px', borderRadius: '50%', filter: 'blur(60px)', opacity: isDark ? 0.10 : 0.06, background: '#F5B731' }} />
          </div>

          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>

              {/* Left column */}
              <div>
                {/* Mascot + badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <MascotPair width={80} height={56} />
                  <div
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                      background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', color: '#F5B731',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5B731', display: 'inline-block', animation: 'pulse 2s infinite' }}
                    />
                    Free for community organizations
                  </div>
                </div>

                <h1
                  id="hero-heading"
                  style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', color: textPrimary }}
                >
                  Your community's<br />
                  <span style={{ color: '#F5B731' }}>bulletin board,</span><br />
                  brought online.
                </h1>

                <p style={{ fontSize: '17px', color: textSecondary, lineHeight: 1.7, marginBottom: '32px', maxWidth: '460px' }}>
                  Before the internet, communities organized on bulletin boards. Syndicade brings that board online — without the corporate software or the ads.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                  <button
                    onClick={function() { navigate('/login'); }}
                    className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '13px 28px', fontSize: '15px', fontWeight: 700,
                      background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px',
                      cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,183,49,0.35)', transition: 'background 0.15s',
                    }}
                    onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }}
                    onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}
                  >
                    Pin Your Org Free
                    <Icon path={ICONS.arrow} className="h-4 w-4" />
                  </button>
                  <button
                    onClick={function() { scrollTo('how-it-works'); }}
                    className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '13px 24px', fontSize: '15px', fontWeight: 600,
                      background: 'none', color: textSecondary,
                      border: '1px solid ' + borderColor, borderRadius: '12px',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; e.currentTarget.style.borderColor = isDark ? '#94A3B8' : '#94A3B8'; }}
                    onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; e.currentTarget.style.borderColor = borderColor; }}
                  >
                    See How It Works
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: textMuted }}>
                  No credit card&nbsp;&middot;&nbsp;No ads&nbsp;&middot;&nbsp;Funded by member organizations
                </p>
              </div>

              {/* Right column — bulletin board mockup */}
              <div aria-hidden="true" style={{ position: 'relative' }}>
                <div
                  style={{
                    background: isDark ? '#111827' : '#1A2035',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)'),
                    boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Browser chrome */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F5B731' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E' }} />
                    <span style={{ marginLeft: '10px', fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>syndicade.com/board</span>
                  </div>

                  {/* Post-it grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { bg: '#FEF9C3', tack: '#D4A017', badgeBg: '#22C55E', badgeText: 'white', category: 'EVENT',     title: 'Spring Meeting — April 8 at 6pm' },
                      { bg: '#DBEAFE', tack: '#3B82F6', badgeBg: '#3B82F6', badgeText: 'white', category: 'VOLUNTEER', title: '10 volunteers needed for Food Drive' },
                      { bg: '#DCFCE7', tack: '#16A34A', badgeBg: '#22C55E', badgeText: 'white', category: 'DOCUMENT',  title: 'Q1 Budget now in Documents' },
                      { bg: '#FCE7F3', tack: '#DB2777', badgeBg: '#EC4899', badgeText: 'white', category: 'POLL',       title: 'Vote: Summer Gala theme closes Sunday' },
                    ].map(function(card) {
                      return (
                        <div
                          key={card.category}
                          style={{
                            background: card.bg, borderRadius: '4px', padding: '12px',
                            position: 'relative', marginTop: '10px',
                            backgroundImage: 'repeating-linear-gradient(transparent,transparent 21px,rgba(0,0,0,0.05) 22px)',
                            backgroundPositionY: '28px',
                          }}
                        >
                          {/* Tack */}
                          <div
                            style={{
                              width: '12px', height: '12px', borderRadius: '50%',
                              position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)',
                              background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, ' + card.tack + ' 52%, rgba(0,0,0,0.2) 100%)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            }}
                          />
                          <span
                            style={{
                              display: 'inline-block', padding: '2px 7px', borderRadius: '3px',
                              fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                              marginBottom: '7px', background: card.badgeBg, color: card.badgeText,
                            }}
                          >
                            {card.category}
                          </span>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', lineHeight: 1.4, fontFamily: 'Georgia, serif' }}>
                            {card.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Org name footer */}
                  <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: '#64748B', textTransform: 'uppercase' }}>
                    Riverside Neighborhood Assoc.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid ' + borderColor, borderBottom: '1px solid ' + borderColor,
            background: sectionAltBg, padding: '20px 24px',
          }}
        >
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0' }}>
            {[
              { val: '$14.99/mo', label: 'Starting price' },
              { val: '1 month',   label: 'Free trial, all plans' },
              { val: '0%',        label: 'Platform fees on payments' },
              { val: '0',         label: 'Ads. Ever.' },
            ].map(function(stat, i) {
              return (
                <div
                  key={stat.label}
                  style={{
                    flex: '1 1 150px', textAlign: 'center', padding: '12px 24px',
                    borderRight: i < 3 ? ('1px solid ' + borderColor) : 'none',
                  }}
                >
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#F5B731', lineHeight: 1 }}>{stat.val}</div>
                  <div style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Pain Points ───────────────────────────────────────────────────── */}
        <section aria-labelledby="pain-heading" style={{ padding: '64px 24px', background: pageBg }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <p
              id="pain-heading"
              style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: textMuted, marginBottom: '40px' }}
            >
              Sound familiar?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {PAIN_POINTS.map(function(p) {
                return (
                  <div
                    key={p.label}
                    style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '20px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Icon path={ICONS[p.iconKey]} className="h-4 w-4" style={{ color: '#EF4444', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>{p.label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: textMuted, lineHeight: 1.6 }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>
            <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '16px', color: textSecondary, maxWidth: '500px', margin: '40px auto 0' }}>
              Community work is hard enough.{' '}
              <span style={{ color: textPrimary, fontWeight: 600 }}>Your software shouldn't make it harder.</span>
            </p>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section
          id="features"
          aria-labelledby="features-heading"
          style={{ padding: '80px 24px', background: sectionAltBg }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                Everything on one board
              </p>
              <h2 id="features-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '16px' }}>
                All the tools your community needs
              </h2>
              <p style={{ fontSize: '16px', color: textSecondary, maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                No training required. If you've used a bulletin board, you already know how to use Syndicade.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {FEATURES.map(function(f) {
                return (
                  <div
                    key={f.label}
                    style={{
                      background: cardBg, borderRadius: '14px', padding: '24px',
                      border: '1px solid ' + borderColor,
                      borderLeft: '4px solid ' + f.color,
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseOver={function(e) { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)'; }}
                    onMouseOut={function(e) { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div
                      style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: f.bg, marginBottom: '14px',
                      }}
                    >
                      <Icon path={ICONS[f.iconKey]} className="h-5 w-5" style={{ color: f.color }} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>{f.label}</h3>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Spotlight — Multi-org ─────────────────────────────────────────── */}
        <section
          aria-labelledby="spotlight-heading"
          style={{ padding: '80px 24px', background: pageBg, borderTop: '1px solid ' + borderColor }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '56px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '16px' }}>
                Killer feature
              </p>
              <h2 id="spotlight-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, lineHeight: 1.2, marginBottom: '24px' }}>
                One login.<br />
                <span style={{ color: '#3B82F6' }}>Every organization.</span><br />
                Total clarity.
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {[
                  ['No missed commitments', 'Your unified calendar shows events from every org you belong to.'],
                  ['Less email clutter', 'Announcements and updates live in one clean feed.'],
                  ['Better participation', 'When members stay informed, they show up more.'],
                ].map(function(item) {
                  return (
                    <div key={item[0]} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }} aria-hidden="true">
                        <Icon path={ICONS.check} className="h-3 w-3" style={{ color: 'white' }} strokeWidth={3} />
                      </div>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>{item[0]}</span>
                        <p style={{ fontSize: '13px', color: textSecondary, marginTop: '2px' }}>{item[1]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={function() { navigate('/login'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                  background: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.4)', transition: 'background 0.15s',
                }}
                onMouseOver={function(e) { e.currentTarget.style.background = '#2563EB'; }}
                onMouseOut={function(e) { e.currentTarget.style.background = '#3B82F6'; }}
              >
                Try It Free
                <Icon path={ICONS.arrow} className="h-4 w-4" />
              </button>
            </div>

            {/* Multi-org feed mockup */}
            <div
              aria-hidden="true"
              style={{ background: cardBg, borderRadius: '16px', padding: '20px', border: '1px solid ' + borderColor }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid ' + borderColor }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon path={ICONS.users} className="h-4 w-4" style={{ color: 'white' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>My Dashboard</div>
                  <div style={{ fontSize: '11px', color: textMuted }}>3 organizations</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }} aria-hidden="true">
                  {['#3B82F6','#8B5CF6','#22C55E'].map(function(c, i) {
                    return <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />;
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { dot: '#3B82F6', org: 'Toledo Food Bank',    event: 'Volunteer Day — Sat 10am',    badge: 'event',        badgeBg: 'rgba(59,130,246,0.15)',  badgeColor: '#3B82F6' },
                  { dot: '#8B5CF6', org: 'Garden Club',          event: 'Spring Planting Update',      badge: 'announcement', badgeBg: 'rgba(139,92,246,0.15)', badgeColor: '#8B5CF6' },
                  { dot: '#22C55E', org: 'Youth League',          event: 'Game Night — Fri 7pm',        badge: 'event',        badgeBg: 'rgba(34,197,94,0.15)',  badgeColor: '#22C55E' },
                  { dot: '#3B82F6', org: 'Toledo Food Bank',      event: 'New member joined',           badge: 'member',       badgeBg: 'rgba(34,197,94,0.15)',  badgeColor: '#22C55E' },
                ].map(function(item, i) {
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px', border: '1px solid ' + borderColor,
                        background: pageBg,
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: item.dot }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.event}</div>
                        <div style={{ fontSize: '11px', color: textMuted }}>{item.org}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: item.badgeBg, color: item.badgeColor, flexShrink: 0 }}>{item.badge}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          style={{ padding: '80px 24px', background: sectionAltBg, borderTop: '1px solid ' + borderColor }}
        >
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                Ready?
              </p>
              <h2 id="how-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '12px' }}>
                How It Works
              </h2>
              <p style={{ fontSize: '16px', color: textSecondary }}>Three steps to a fully connected community organization.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '48px' }}>
              {STEPS.map(function(s) {
                return (
                  <div key={s.n} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: '#F5B731', color: '#111827',
                        fontSize: '22px', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(245,183,49,0.35)',
                      }}
                    >
                      {s.n}
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>{s.label}</h3>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={function() { navigate('/login'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '13px 28px', fontSize: '15px', fontWeight: 700,
                  background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px',
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,183,49,0.35)', transition: 'background 0.15s',
                }}
                onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }}
                onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}
              >
                Get Started Now
                <Icon path={ICONS.arrow} className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Pricing Preview ───────────────────────────────────────────────── */}
        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          style={{ padding: '80px 24px', background: pageBg, borderTop: '1px solid ' + borderColor }}
        >
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                Pricing
              </p>
              <h2 id="pricing-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '12px' }}>
                Simple, honest pricing
              </h2>
              <p style={{ fontSize: '16px', color: textSecondary }}>
                1-month free trial on all plans. No credit card required.
              </p>
            </div>

            {/* 3 plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {PRICING_PREVIEW.map(function(plan) {
                return (
                  <div
                    key={plan.name}
                    style={{
                      background: plan.highlight ? '#1D4ED8' : cardBg,
                      border: plan.highlight ? '2px solid #3B82F6' : ('1px solid ' + borderColor),
                      borderRadius: '16px', padding: '28px',
                      transform: plan.highlight ? 'scale(1.03)' : 'none',
                      boxShadow: plan.highlight ? '0 12px 40px rgba(29,78,216,0.35)' : 'none',
                    }}
                  >
                    {plan.highlight && (
                      <div style={{ display: 'inline-block', background: 'white', color: '#1D4ED8', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', marginBottom: '14px' }}>
                        Most Popular
                      </div>
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: plan.highlight ? 'white' : textPrimary, marginBottom: '4px' }}>{plan.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '36px', fontWeight: 800, color: plan.highlight ? 'white' : textPrimary }}>{plan.price}</span>
                      <span style={{ fontSize: '14px', color: plan.highlight ? 'rgba(255,255,255,0.7)' : textMuted }}>{plan.period}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: plan.highlight ? 'rgba(255,255,255,0.6)' : textMuted, marginBottom: '16px' }}>
                      {plan.members}&nbsp;&middot;&nbsp;{plan.storage}
                    </p>
                    <p style={{ fontSize: '13px', color: plan.highlight ? 'rgba(255,255,255,0.85)' : textSecondary, lineHeight: 1.5 }}>
                      {plan.tagline}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              <button
                onClick={function() { navigate('/pricing'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                  background: cardBg, color: textPrimary, border: '1px solid ' + borderColor, borderRadius: '10px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseOver={function(e) { e.currentTarget.style.borderColor = '#3B82F6'; }}
                onMouseOut={function(e) { e.currentTarget.style.borderColor = borderColor; }}
              >
                Compare all plans
                <Icon path={ICONS.arrow} className="h-4 w-4" />
              </button>
              <button
                onClick={function() { navigate('/login'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                  background: '#F5B731', color: '#111827', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }}
                onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}
              >
                Start free trial
              </button>
            </div>

            {/* Nonprofit callout */}
            <div
              style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px',
                background: 'rgba(245,183,49,0.06)', border: '1px solid rgba(245,183,49,0.2)',
                borderRadius: '12px', padding: '18px 24px',
              }}
            >
              <div
                style={{
                  flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(245,183,49,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon path={ICONS.shield} className="h-4 w-4" style={{ color: '#F5B731' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '2px' }}>Verified nonprofit rate</p>
                <p style={{ fontSize: '12px', color: textMuted }}>
                  Verified 501(c)(3) orgs get 1 extra month free and appear on the public discovery board.
                </p>
              </div>
              <button
                onClick={function() { navigate('/pricing'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
                style={{
                  flexShrink: 0, padding: '8px 16px', fontSize: '12px', fontWeight: 700,
                  background: 'none', color: '#F5B731', border: '1px solid rgba(245,183,49,0.4)', borderRadius: '8px',
                  cursor: 'pointer', transition: 'border-color 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseOver={function(e) { e.currentTarget.style.borderColor = '#F5B731'; }}
                onMouseOut={function(e) { e.currentTarget.style.borderColor = 'rgba(245,183,49,0.4)'; }}
              >
                Learn More
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: textMuted, marginTop: '16px' }}>
              We never take a cut of your donations or ticket sales. Stripe pass-through only.
            </p>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          style={{ padding: '80px 24px', background: sectionAltBg, borderTop: '1px solid ' + borderColor }}
        >
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 id="faq-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FAQS.map(function(faq, i) {
                return (
                  <div
                    key={i}
                    style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', overflow: 'hidden' }}
                  >
                    <button
                      onClick={function() { setOpenFaq(openFaq === i ? null : i); }}
                      aria-expanded={openFaq === i}
                      aria-controls={'faq-' + i}
                      className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '18px 20px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseOver={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseOut={function(e) { e.currentTarget.style.background = 'none'; }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, paddingRight: '16px' }}>{faq.q}</span>
                      <Icon
                        path={ICONS.chevDown}
                        className="h-4 w-4"
                        style={{ color: textMuted, flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      />
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

        {/* ── Contact ───────────────────────────────────────────────────────── */}
        <section
          id="contact"
          aria-labelledby="contact-heading"
          style={{ padding: '80px 24px', background: pageBg, borderTop: '1px solid ' + borderColor }}
        >
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 id="contact-heading" style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: textPrimary, marginBottom: '10px' }}>
                Get In Touch
              </h2>
              <p style={{ fontSize: '15px', color: textSecondary }}>Questions? We'd love to hear from you.</p>
            </div>

            {contactStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '48px', borderRadius: '16px', background: cardBg, border: '1px solid ' + borderColor }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Icon path={ICONS.check} className="h-7 w-7" style={{ color: '#22C55E' }} strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ fontSize: '14px', color: textSecondary, marginBottom: '24px' }}>We'll get back to you within one business day.</p>
                <button
                  onClick={function() { setContactStatus(null); }}
                  className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                  style={{ fontSize: '13px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} noValidate aria-label="Contact form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { id: 'contact-name',  label: 'Name',  type: 'text',  key: 'name',  placeholder: 'Your name', required: true },
                    { id: 'contact-email', label: 'Email', type: 'email', key: 'email', placeholder: 'you@example.com', required: true },
                  ].map(function(field) {
                    return (
                      <div key={field.id}>
                        <label htmlFor={field.id} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
                          {field.label} {field.required && <span aria-hidden="true">*</span>}
                        </label>
                        <input
                          id={field.id}
                          type={field.type}
                          value={contactForm[field.key]}
                          onChange={function(e) { var v = e.target.value; setContactForm(function(p) { var n = Object.assign({}, p); n[field.key] = v; return n; }); }}
                          required={field.required}
                          placeholder={field.placeholder}
                          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '14px',
                            background: inputBg, color: textPrimary, border: '1px solid ' + borderColor,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div>
                  <label htmlFor="contact-org" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
                    Organization <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span>
                  </label>
                  <input
                    id="contact-org"
                    type="text"
                    value={contactForm.organization}
                    onChange={function(e) { var v = e.target.value; setContactForm(function(p) { var n = Object.assign({}, p); n.organization = v; return n; }); }}
                    placeholder="Your organization name"
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', background: inputBg, color: textPrimary, border: '1px solid ' + borderColor, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
                    Message <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={contactForm.message}
                    onChange={function(e) { var v = e.target.value; setContactForm(function(p) { var n = Object.assign({}, p); n.message = v; return n; }); }}
                    required
                    placeholder="How can we help?"
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', background: inputBg, color: textPrimary, border: '1px solid ' + borderColor, resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {contactStatus === 'error' && (
                  <p role="alert" style={{ fontSize: '13px', color: '#EF4444' }}>Something went wrong. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={contactLoading || !contactForm.name || !contactForm.email || !contactForm.message}
                  className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                  style={{
                    width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700,
                    background: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px',
                    cursor: contactLoading ? 'not-allowed' : 'pointer',
                    opacity: (contactLoading || !contactForm.name || !contactForm.email || !contactForm.message) ? 0.5 : 1,
                    transition: 'background 0.15s',
                  }}
                >
                  {contactLoading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="final-cta-heading"
          style={{
            padding: '96px 24px',
            background: isDark
              ? 'linear-gradient(135deg, #1A2035 0%, #0E1523 100%)'
              : 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)',
            borderTop: '1px solid ' + borderColor,
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <MascotPair width={120} height={88} />
            </div>
            <h2
              id="final-cta-heading"
              style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: textPrimary, lineHeight: 1.2, marginBottom: '16px' }}
            >
              Bring your community board online.
            </h2>
            <p style={{ fontSize: '16px', color: textSecondary, marginBottom: '36px', lineHeight: 1.6 }}>
              Join nonprofits and community organizations already using Syndicade.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={function() { navigate('/login'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 32px', fontSize: '16px', fontWeight: 700,
                  background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px',
                  cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,183,49,0.4)', transition: 'background 0.15s',
                }}
                onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }}
                onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}
              >
                Pin Your Org Free
                <Icon path={ICONS.arrow} className="h-5 w-5" />
              </button>
              <button
                onClick={function() { navigate('/pricing'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 28px', fontSize: '16px', fontWeight: 600,
                  background: 'none', color: textSecondary, border: '1px solid ' + borderColor, borderRadius: '12px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; e.currentTarget.style.borderColor = isDark ? '#94A3B8' : '#94A3B8'; }}
                onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; e.currentTarget.style.borderColor = borderColor; }}
              >
                View Pricing
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer
        role="contentinfo"
        style={{ background: isDark ? '#060E1A' : '#0E1523', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 24px' }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MascotPair width={32} height={24} />
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
              Syndi<span style={{ color: '#F5B731' }}>cade</span>
            </span>
          </div>
          <nav aria-label="Footer navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {[['features','Features'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(function(item) {
              return (
                <button
                  key={item[0]}
                  onClick={function() { scrollTo(item[0]); }}
                  className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                  style={{ fontSize: '13px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
                >
                  {item[1]}
                </button>
              );
            })}
            <button
              onClick={function() { navigate('/login'); }}
              className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
              style={{ fontSize: '13px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
            >
              Log In
            </button>
            <Link
              to="/wishlist"
              className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
              style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
            >
              Wishlist
            </Link>
          </nav>
          <p style={{ fontSize: '12px', color: '#475569' }}>
            &copy; {new Date().getFullYear()} Syndicade. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}