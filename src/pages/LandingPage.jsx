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

function NavMascot() {
  return (
    <div aria-hidden="true" style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-end', gap: '2px', background: '#FEF9C3', borderRadius: '3px', padding: '3px 5px 4px', boxShadow: '1px 1px 4px rgba(0,0,0,0.18)', marginTop: '4px' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', position: 'absolute', top: '-3px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, #D4A017 52%, rgba(0,0,0,0.2) 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
      <div style={{ width: '13px', height: '16px', background: '#F5B731', borderRadius: '2px', position: 'relative' }}>
        <div style={{ width: '2.5px', height: '2.5px', borderRadius: '50%', background: '#111', position: 'absolute', top: '4px', left: '3px' }} />
        <div style={{ width: '2.5px', height: '2.5px', borderRadius: '50%', background: '#111', position: 'absolute', top: '4px', left: '7px' }} />
      </div>
      <div style={{ width: '11px', height: '14px', background: '#3B82F6', borderRadius: '2px', position: 'relative', marginLeft: '-3px' }}>
        <div style={{ width: '2.5px', height: '2.5px', borderRadius: '50%', background: '#111', position: 'absolute', top: '4px', left: '2px' }} />
        <div style={{ width: '2.5px', height: '2.5px', borderRadius: '50%', background: '#111', position: 'absolute', top: '4px', left: '6px' }} />
      </div>
    </div>
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
  menu:     'M4 6h16M4 12h16M4 18h16',
  x:        'M6 18L18 6M6 6l12 12',
  check:    'M5 13l4 4L19 7',
  arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
  chevDown: 'M19 9l-7 7-7-7',
  sun:      'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z',
  moon:     'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  shield:   ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  megaphone:['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  document: ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  chart:    ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
  globe:    ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
};

var FEATURES = [
  { iconKey: 'megaphone', color: '#F5B731', bg: 'rgba(245,183,49,0.12)',  label: 'Announcements',  desc: 'Pinned updates visible to all members instantly.' },
  { iconKey: 'calendar',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Events & RSVP',   desc: 'Post and manage events with real-time RSVP tracking.' },
  { iconKey: 'users',     color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: 'Sign-Up Sheets', desc: 'Volunteer slots with live spot counts — no phone tag.' },
  { iconKey: 'document',  color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'Documents',       desc: 'Meeting minutes, budgets, and shared resources.' },
  { iconKey: 'chart',     color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'Polls & Surveys', desc: 'Make decisions together. Results in real time.' },
  { iconKey: 'globe',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Public Website',  desc: 'Your org\'s public page — no developer needed.' },
];

var STEPS = [
  { n: '1', label: 'Create your organization', desc: 'Set up your profile in minutes. No tech skills required.' },
  { n: '2', label: 'Invite members and post', desc: 'Build your calendar and send invitations from one dashboard.' },
  { n: '3', label: 'Everything flows together', desc: 'Members see unified updates across every org they belong to.' },
];

var FAQS = [
  { q: 'Is there a free trial?', a: 'Yes. All plans include a 1-month free trial with no credit card required. Verified 501(c)(3) nonprofits get an additional free month stacked on top.' },
  { q: 'Can members belong to multiple organizations?', a: 'Absolutely — that is one of our core features. Members get a unified dashboard showing updates from every organization they belong to, all in one place.' },
  { q: 'Do we need technical skills?', a: 'None at all. If you can send an email, you can set up Syndicade. Most organizations are fully running within 10 minutes.' },
  { q: 'Do you take a cut of payments or donations?', a: 'Never. We pass through Stripe fees only and take 0% of your dues, ticket sales, or donations. Payment processing is available on Growth and above.' },
  { q: 'Is our data secure?', a: 'Yes. All data is encrypted in transit and at rest. We use Supabase infrastructure with enterprise-grade security and row-level access controls.' },
  { q: 'Can we use our own domain?', a: 'Yes on the Pro plan ($59/mo). Starter and Growth plans get a clean orgname.syndicade.com subdomain included.' },
];

export default function LandingPage() {
  var navigate = useNavigate();
  var { isDark, toggle } = useTheme();

  var [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  var [openFaq, setOpenFaq]               = useState(null);
  var [contactForm, setContactForm]       = useState({ name: '', email: '', organization: '', message: '' });
  var [contactStatus, setContactStatus]   = useState(null);
  var [contactLoading, setContactLoading] = useState(false);
  var [scrolled, setScrolled]             = useState(false);

  // ── Editable content from Supabase (staff edits via /staff → Content tab) ──
  // Fallback values = current hardcoded text, so page never shows blank.
  // Update values in the Content Editor — changes go live on next page load.
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
    hero_cta_primary:        'Pin Your Org Free',
    hero_cta_secondary:      'See How It Works',
    features_section_label:  'Everything on one board',
    features_headline:       'All the tools your community needs',
    features_subheadline:    "No training required. If you've used a bulletin board, you already know how to use Syndicade.",
    spotlight_label:         'Killer feature',
    pricing_section_label:   'Pricing',
    pricing_headline:        'Funded by communities, not investors',
    pricing_subheadline:     'No ads. No data selling. A fair price to keep the board running.',
    pricing_trial_badge:     'Annual billing = 2 months free. We never take a cut of your donations or ticket sales.',
    final_cta_headline:      'Bring your community board online.',
    final_cta_body:          'Join nonprofits and community organizations already using Syndicade.',
    final_cta_button:        'Pin Your Org Free',
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

  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg     = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';
  var navBg         = scrolled ? (isDark ? 'rgba(14,21,35,0.96)' : 'rgba(248,250,252,0.97)') : (isDark ? '#0E1523' : '#FFFFFF');

  return (
    <div style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: textPrimary, transition: 'background 0.2s, color 0.2s' }}>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none" style={{ background: '#F5B731', color: '#111827' }}>
        Skip to main content
      </a>

      {/* Nav */}
      <header role="banner" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: navBg, borderBottom: '1px solid ' + (scrolled ? borderColor : 'transparent'), backdropFilter: scrolled ? 'blur(12px)' : 'none', transition: 'all 0.25s' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          <button onClick={function() { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" aria-label="Syndicade — scroll to top" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0E1523' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
          </button>

          <nav className="hidden md:flex" style={{ alignItems: 'center', gap: '28px' }} aria-label="Main navigation">
            {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(function(item) {
              return (
                <button key={item[0]} onClick={function() { scrollTo(item[0]); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '14px', fontWeight: 500, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; }}>
                  {item[1]}
                </button>
              );
            })}
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
            <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-xl" style={{ fontSize: '14px', fontWeight: 700, color: '#111827', background: '#F5B731', border: 'none', cursor: 'pointer', padding: '9px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(245,183,49,0.4)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
              Get Started Free
            </button>
          </div>

          <button className="md:hidden focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" onClick={function() { setMobileMenuOpen(!mobileMenuOpen); }} aria-expanded={mobileMenuOpen} aria-label="Toggle mobile menu" style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textSecondary }}>
            <Icon path={mobileMenuOpen ? ICONS.x : ICONS.menu} size={20} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div role="navigation" aria-label="Mobile navigation" style={{ background: cardBg, borderTop: '1px solid ' + borderColor, padding: '12px 24px 20px' }}>
            {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(function(item) {
              return <button key={item[0]} onClick={function() { scrollTo(item[0]); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 0', fontSize: '14px', fontWeight: 500, color: textSecondary, background: 'none', border: 'none', borderBottom: '1px solid ' + borderColor, cursor: 'pointer' }}>{item[1]}</button>;
            })}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 600, color: textSecondary, background: 'none', border: '1px solid ' + borderColor, borderRadius: '10px', cursor: 'pointer' }}>Log In</button>
              <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 700, color: '#111827', background: '#F5B731', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Get Started Free</button>
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
                  Starts at $14.99/mo · 1 month free trial
                </div>

                {/* Headline — line 1 and 2 are editable, "brought online." is line 3 */}
                <h1 id="hero-heading" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: '18px', color: textPrimary }}>
                  {content['hero_headline_main']}<br />
                  <span style={{ color: '#F5B731' }}>{content['hero_headline_accent']}</span><br />
                  brought online.
                </h1>

                {/* Subheadline — editable */}
                <p style={{ fontSize: '16px', color: textSecondary, lineHeight: 1.7, marginBottom: '32px' }}>
                  {content['hero_subheadline']}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  {/* Primary CTA — editable */}
                  <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: 700, background: '#0E1523', color: '#F5B731', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', transition: 'opacity 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.opacity = '0.88'; }} onMouseOut={function(e) { e.currentTarget.style.opacity = '1'; }}>
                    {content['hero_cta_primary']} <Icon path={ICONS.arrow} size={16} />
                  </button>
                  {/* Secondary CTA — editable */}
                  <button onClick={function() { scrollTo('how-it-works'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', fontSize: '15px', fontWeight: 600, background: 'none', color: textSecondary, border: '1px solid ' + borderColor, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = textPrimary; e.currentTarget.style.borderColor = '#94A3B8'; }} onMouseOut={function(e) { e.currentTarget.style.color = textSecondary; e.currentTarget.style.borderColor = borderColor; }}>
                    {content['hero_cta_secondary']}
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: textMuted }}>No credit card&nbsp;&middot;&nbsp;No ads&nbsp;&middot;&nbsp;No platform fees on payments</p>
              </div>
            </div>

            {/* Right — post-it board (decorative, not editable) */}
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

        {/* Stats bar — always dark, not editable (pricing-driven) */}
        <div style={{ background: '#0E1523', borderTop: '1px solid #2A3550', borderBottom: '1px solid #2A3550' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[{ val: '$14.99/mo', label: 'Starting price' },{ val: '1 month', label: 'Free trial, all plans' },{ val: '0%', label: 'Platform fee on payments' },{ val: '0', label: 'Ads. Ever.' }].map(function(stat, i) {
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
              {/* Section label — editable */}
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                {content['features_section_label']}
              </p>
              {/* Headline — editable */}
              <h2 id="features-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '14px' }}>
                {content['features_headline']}
              </h2>
              {/* Subheadline — editable */}
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
          </div>
        </section>

        {/* ── Multi-org spotlight ── */}
        <section aria-labelledby="spotlight-heading" style={{ padding: '80px 24px 0px', background: pageBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'start', marginBottom: '52px' }}>
              <div>
                {/* Spotlight label — editable */}
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '16px' }}>
                  {content['spotlight_label']}
                </p>
                {/* Spotlight headline — kept structured for the blue span styling */}
                <h2 id="spotlight-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, lineHeight: 1.2, marginBottom: '24px' }}>
                  One login.<br /><span style={{ color: '#3B82F6' }}>Every organization.</span><br />Total clarity.
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                  {[['No missed commitments','Your unified calendar shows events from every org you belong to.'],['Less email clutter','Announcements and updates live in one clean feed.'],['Better participation','When members stay informed, they show up more.']].map(function(item) {
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
                <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, background: '#3B82F6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.4)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#2563EB'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#3B82F6'; }}>
                  Try It Free <Icon path={ICONS.arrow} size={16} />
                </button>
              </div>
              <div aria-hidden="true" style={{ paddingTop: '8px' }}>
                <p style={{ fontSize: '12px', color: textMuted, marginBottom: '4px', textAlign: 'right' }}>Live activity across multiple organizations</p>
                <PostIt large={true} bg="#FEF9C3" tackColor="#D4A017" badgeBg="#22C55E" badgeText="white" category="ANNOUNCEMENT" title="Spring Meeting Recap Posted" body="Minutes and action items from last Tuesday's board meeting." org="Toledo Food Bank" orgColor="#D97706" date="1h ago" />
                <div style={{ textAlign: 'center', marginTop: '-120px', marginBottom: '-200px', position: 'relative', zIndex: 1 }}>
                  <img src="/mascot-pair.png" alt="" aria-hidden="true" style={{ width: '640px', height: 'auto', display: 'inline-block', maxWidth: '100%' }} onError={function(e) { e.currentTarget.style.display = 'none'; }} />
                </div>
              </div>
            </div>

            {/* Post-it board grid */}
            <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', marginTop: '0' }}>
              {[
                { bg: '#DBEAFE', tack: '#1D4ED8', badgeBg: '#3B82F6', badgeText: 'white', cat: 'EVENT',     title: 'Volunteer Orientation — April 8',  body: '6pm at Community Center Room B. Refreshments provided.',   org: 'Riverside NA',    orgColor: '#1D4ED8', date: '3h ago' },
                { bg: '#DCFCE7', tack: '#16A34A', badgeBg: '#22C55E', badgeText: 'white', cat: 'VOLUNTEER', title: '10 Spots Left: Food Drive',         body: 'Sorting donations April 12–13. Sign up by Friday!',         org: 'Toledo Food Bank', orgColor: '#15803D', date: '5h ago' },
                { bg: '#FCE7F3', tack: '#DB2777', badgeBg: '#EC4899', badgeText: 'white', cat: 'POLL',      title: 'Vote: Summer Gala Theme',           body: 'Garden Party · Masquerade · Under the Stars.',             org: 'Arts Alliance',   orgColor: '#DB2777', date: '1d ago' },
                { bg: '#FEF3C7', tack: '#D97706', badgeBg: '#F59E0B', badgeText: 'white', cat: 'EVENT',     title: 'Neighborhood Watch Meeting',        body: 'Every 3rd Tuesday. April 15 at 7pm.',                       org: 'Riverside NA',    orgColor: '#D97706', date: '2d ago' },
                { bg: '#EDE9FE', tack: '#7C3AED', badgeBg: '#8B5CF6', badgeText: 'white', cat: 'DOCUMENT',  title: '2025 Q1 Financial Report',          body: "Treasurer's budget vs. actuals through March 31st.",        org: 'Arts Alliance',   orgColor: '#7C3AED', date: '3d ago' },
                { bg: '#CCFBF1', tack: '#0F766E', badgeBg: '#14B8A6', badgeText: 'white', cat: 'VOLUNTEER', title: 'Garden Workday — April 26',         body: 'Spring planting. Bring gloves. Lunch provided!',            org: 'Garden Club',     orgColor: '#0F766E', date: '4d ago' },
              ].map(function(card) {
                return <PostIt key={card.title} bg={card.bg} tackColor={card.tack} badgeBg={card.badgeBg} badgeText={card.badgeText} category={card.cat} title={card.title} body={card.body} org={card.org} orgColor={card.orgColor} date={card.date} />;
              })}
            </div>
            <div style={{ height: '80px' }} />
          </div>
        </section>

        {/* ── How It Works ── (labels kept hardcoded — rarely change) */}
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
              <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,183,49,0.35)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Get Started Now <Icon path={ICONS.arrow} size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" aria-labelledby="pricing-heading" style={{ padding: '80px 24px', background: pageBg, borderBottom: '1px solid ' + borderColor }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              {/* Section label — editable */}
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '12px' }}>
                {content['pricing_section_label']}
              </p>
              {/* Headline — editable */}
              <h2 id="pricing-heading" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: textPrimary, marginBottom: '12px' }}>
                {content['pricing_headline']}
              </h2>
              {/* Subheadline — editable */}
              <p style={{ fontSize: '16px', color: textSecondary }}>
                {content['pricing_subheadline']}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {[
                { bg: '#FEF9C3', tack: '#D4A017', nameColor: '#92700A', pop: false, name: 'Starter', price: '$14.99', meta: '50 members · 5 GB', tagline: 'Events, polls, docs, member directory, RSVP, and your orgname.syndicade.com subdomain.', btnBg: '#0E1523', btnColor: '#F5B731' },
                { bg: '#DBEAFE', tack: '#1D4ED8', nameColor: '#1E40AF', pop: true,  name: 'Growth',  price: '$29',    meta: '150 members · 15 GB', tagline: 'Everything in Starter + Stripe payments (0% platform fee), analytics, and email notifications.', btnBg: '#3B82F6', btnColor: 'white' },
                { bg: '#DCFCE7', tack: '#16A34A', nameColor: '#166534', pop: false, name: 'Pro',     price: '$59',    meta: '300 members · 50 GB', tagline: 'Everything in Growth + custom domain, remove Syndicade branding, and email marketing blasts.', btnBg: '#16A34A', btnColor: 'white' },
              ].map(function(plan) {
                return (
                  <div key={plan.name} style={{ background: plan.bg, borderRadius: '4px', padding: '20px', position: 'relative', marginTop: '12px', boxShadow: '3px 4px 12px rgba(0,0,0,0.18)', backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.05) 24px)', backgroundPositionY: '32px' }}>
                    <div aria-hidden="true" style={{ width: '14px', height: '14px', borderRadius: '50%', position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, ' + plan.tack + ' 52%, rgba(0,0,0,0.25) 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.4)' }} />
                    {plan.pop && <div style={{ display: 'inline-block', background: '#3B82F6', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', marginBottom: '8px' }}>Most Popular</div>}
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: plan.nameColor, marginBottom: '8px' }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '38px', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{plan.price}</span>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>/mo</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '14px' }}>{plan.meta}</div>
                    <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, marginBottom: '16px' }}>{plan.tagline}</p>
                    <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ width: '100%', padding: '9px', fontSize: '13px', fontWeight: 700, background: plan.btnBg, color: plan.btnColor, border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'opacity 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.opacity = '0.88'; }} onMouseOut={function(e) { e.currentTarget.style.opacity = '1'; }}>
                      Start Free Trial
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button onClick={function() { navigate('/pricing'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', fontSize: '14px', fontWeight: 600, background: cardBg, color: textPrimary, border: '1px solid ' + borderColor, borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#3B82F6'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = borderColor; }}>
                Compare all plans in detail <Icon path={ICONS.arrow} size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', background: 'rgba(245,183,49,0.06)', border: '1px solid rgba(245,183,49,0.2)', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,183,49,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5B731' }}>
                <Icon path={ICONS.shield} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '2px' }}>Verified nonprofit rate</p>
                <p style={{ fontSize: '12px', color: textMuted }}>Verified 501(c)(3) orgs get 1 extra month free at signup on any plan, and your org and events appear on the public discovery board.</p>
              </div>
              <button onClick={function() { navigate('/pricing'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg" style={{ flexShrink: 0, padding: '7px 16px', fontSize: '12px', fontWeight: 700, background: 'none', color: '#F5B731', border: '1px solid rgba(245,183,49,0.4)', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Learn More</button>
            </div>
            {/* Trial badge — editable */}
            <p style={{ textAlign: 'center', fontSize: '12px', color: textMuted, marginTop: '14px' }}>
              {content['pricing_trial_badge']}
            </p>
          </div>
        </section>

        {/* ── FAQ ── (kept hardcoded — structural content, rarely changes) */}
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
            {/* Headline — editable */}
            <h2 id="final-cta-heading" style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px' }}>
              {content['final_cta_headline']}
            </h2>
            {/* Body — editable */}
            <p style={{ fontSize: '16px', color: '#CBD5E1', marginBottom: '36px', lineHeight: 1.6 }}>
              {content['final_cta_body']}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              {/* Primary button — editable */}
              <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '16px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,183,49,0.4)', transition: 'background 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                {content['final_cta_button']} <Icon path={ICONS.arrow} size={18} />
              </button>
              <button onClick={function() { navigate('/pricing'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '16px', fontWeight: 600, background: 'none', color: '#CBD5E1', border: '1px solid #2A3550', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.borderColor = '#2A3550'; e.currentTarget.style.color = '#CBD5E1'; }}>
                View Pricing
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer role="contentinfo" style={{ background: '#060E1A', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
          </div>
          <nav aria-label="Footer navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {[['features','Features'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(function(item) {
              return <button key={item[0]} onClick={function() { scrollTo(item[0]); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>{item[1]}</button>;
            })}
            <button onClick={function() { navigate('/login'); }} className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>Log In</button>
            <Link to="/wishlist" className="focus:outline-none focus:ring-2 focus:ring-amber-400 rounded" style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'none', transition: 'color 0.15s' }} onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; }} onMouseOut={function(e) { e.currentTarget.style.color = '#94A3B8'; }}>Wishlist</Link>
          </nav>
          {/* Copyright — editable */}
          <p style={{ fontSize: '12px', color: '#475569' }}>&copy; {content['footer_copyright']}</p>
        </div>
      </footer>

    </div>
  );
}