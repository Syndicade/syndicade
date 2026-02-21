import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Icon({ path, className = 'h-6 w-6', strokeWidth = 2 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />)
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={path} />}
    </svg>
  );
}

const ICONS = {
  menu:      'M4 6h16M4 12h16M4 18h16',
  x:         'M6 18L18 6M6 6l12 12',
  check:     'M5 13l4 4L19 7',
  arrow:     'M13 7l5 5m0 0l-5 5m5-5H6',
  dashboard: ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  globe:     ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  users:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  handshake: ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0'],
  bolt:      ['M13 10V3L4 14h7v7l9-11h-7z'],
  shield:    ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  device:    ['M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'],
  lock:      ['M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'],
  clock:     ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  megaphone: ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  warning:   ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  tools:     ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  chevDown:  'M19 9l-7 7-7-7',
  mail:      ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
};

const FEATURES = [
  { iconKey: 'dashboard', color: 'text-blue-600', bg: 'bg-blue-50', label: 'Unified Dashboard', desc: 'See all your organizations, events, and updates in one place.' },
  { iconKey: 'calendar',  color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Combined Calendars', desc: 'Never miss an event across all the organizations you belong to.' },
  { iconKey: 'globe',     color: 'text-violet-600', bg: 'bg-violet-50', label: 'Public Website', desc: 'A polished public page for your org — no developer needed.' },
  { iconKey: 'handshake', color: 'text-orange-600', bg: 'bg-orange-50', label: 'Community Discovery', desc: 'Members find and connect with other local organizations.' },
];

const PAIN_POINTS = [
  { iconKey: 'tools',    label: 'Too many tools', desc: 'Email, spreadsheets, Facebook groups, separate websites — scattered everywhere.' },
  { iconKey: 'warning',  label: 'Missed events', desc: 'Updates buried in inboxes, members showing up to the wrong place.' },
  { iconKey: 'globe',    label: 'Outdated websites', desc: 'No one has time to update the website. It shows.' },
  { iconKey: 'megaphone',label: 'Volunteer burnout', desc: 'Coordinators spend hours on logistics instead of mission work.' },
  { iconKey: 'users',    label: 'No coordination', desc: 'Organizations silo themselves when they could be helping each other.' },
];

const STEPS = [
  { n: '1', label: 'Create your organization', desc: 'Set up your profile in minutes. No tech skills required.' },
  { n: '2', label: 'Add events & invite members', desc: 'Build your calendar and send invitations from one dashboard.' },
  { n: '3', label: 'Everything flows together', desc: 'Members see unified updates across every org they belong to.' },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    features: ['1 organization', 'Up to 25 members', 'Event calendar', 'Announcements', 'Public page'],
    cta: 'Get Started Free',
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    highlight: true,
    features: ['3 organizations', 'Up to 150 members', 'Everything in Free', 'Documents library', 'Polls & surveys', 'Analytics'],
    cta: 'Start Pro Trial',
  },
  {
    name: 'Growth',
    price: '$29',
    period: 'per month',
    highlight: false,
    features: ['Unlimited organizations', 'Unlimited members', 'Everything in Pro', 'Priority support', 'Custom domain', 'Email campaigns'],
    cta: 'Start Growth Trial',
  },
];

const FAQS = [
  { q: 'Is it really free to start?', a: 'Yes. The Free plan is free forever with no credit card required. You can upgrade any time as your organization grows.' },
  { q: 'Can members belong to multiple organizations?', a: 'Absolutely — that is one of our core features. Members get a unified dashboard showing updates from every organization they belong to.' },
  { q: 'Do we need technical skills?', a: 'None at all. If you can send an email, you can set up Syndicade. Most organizations are fully running within 10 minutes.' },
  { q: 'Is our data secure?', a: 'Yes. All data is encrypted in transit and at rest. We use Supabase infrastructure with enterprise-grade security and role-level access controls.' },
  { q: 'Can we use our own domain?', a: 'Yes on the Growth plan. Free and Pro plans get a clean syndicade.com/org/your-name public URL.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', organization: '', message: '' });
  const [contactStatus, setContactStatus] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(id) {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleContactSubmit(e) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    try {
      setContactLoading(true);
      const { error } = await supabase.from('marketing_contacts').insert([contactForm]);
      if (error) throw error;
      setContactStatus('success');
      setContactForm({ name: '', email: '', organization: '', message: '' });
    } catch {
      setContactStatus('error');
    } finally {
      setContactLoading(false);
    }
  }

  return (
<div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        
          <a href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold"
        >
          Skip to main content
        </a>

      {/* ── Sticky Nav ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-gray-100' : 'bg-transparent'}`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-2xl font-black tracking-tight text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Syndicade — go to top"
            >
              Syndi<span className="text-blue-600">cade</span>
            </button>

            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              >
                Start Free
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              <Icon path={mobileMenuOpen ? ICONS.x : ICONS.menu} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg px-4 pb-4 pt-2" role="navigation" aria-label="Mobile navigation">
            {[['features','Features'],['how-it-works','How It Works'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left py-3 text-sm font-medium text-gray-700 hover:text-blue-600 border-b border-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {label}
              </button>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => navigate('/login')} className="flex-1 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">Log In</button>
              <button onClick={() => navigate('/login')} className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Start Free</button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content">

        {/* ── Hero ── */}
        <section
          className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden"
          aria-labelledby="hero-heading"
          style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #f5f0ff 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
            <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-violet-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
                  Built for nonprofits and community groups
                </div>
                <h1 id="hero-heading" className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight mb-6">
                  Where Community<br />
                  <span className="text-blue-600">Work Connects.</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
                  Syndicade brings websites, members, events, and communication into one unified system — so your community can focus on its mission, not its software.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Start Free
                    <Icon path={ICONS.arrow} className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollTo('how-it-works')}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    See How It Works
                  </button>
                </div>
                <p className="mt-5 text-sm text-gray-500">Free forever plan available. No credit card required.</p>
              </div>

              {/* Dashboard mockup */}
              <div className="relative" aria-hidden="true">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-4 text-xs text-slate-400 font-mono">syndicade.com/dashboard</span>
                  </div>
                  <div className="p-5 bg-gray-50">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {['Members','Events','Orgs'].map((label, i) => (
                        <div key={label} className={`rounded-lg p-3 text-center ${['bg-blue-50','bg-emerald-50','bg-violet-50'][i]}`}>
                          <div className={`text-xl font-black ${['text-blue-700','text-emerald-700','text-violet-700'][i]}`}>{['24','8','3'][i]}</div>
                          <div className="text-xs text-gray-500 font-medium">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-semibold text-gray-700">Toledo Food Bank</span>
                      </div>
                      <div className="h-2 bg-blue-100 rounded w-3/4 mb-1.5" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-xs font-semibold text-gray-700">Community Garden Club</span>
                      </div>
                      <div className="h-2 bg-violet-100 rounded w-2/3 mb-1.5" />
                      <div className="h-2 bg-gray-100 rounded w-5/6" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl" aria-hidden="true">
                  <Icon path={ICONS.users} className="h-10 w-10 text-white" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pain Points ── */}
        <section className="py-16 bg-slate-900" aria-labelledby="pain-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p id="pain-heading" className="text-center text-gray-400 text-sm font-semibold uppercase tracking-widest mb-10">Sound familiar?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {PAIN_POINTS.map(p => (
                <div key={p.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon path={ICONS[p.iconKey]} className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span className="text-white text-sm font-bold">{p.label}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400 mt-10 text-base max-w-xl mx-auto">
              Community work is hard enough. <span className="text-white font-semibold">Your software shouldn't make it harder.</span>
            </p>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-20 bg-white" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 id="features-heading" className="text-4xl font-black text-slate-900 mb-4">The Syndicade Solution</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">One connected ecosystem — not a collection of disconnected tools.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(f => (
                <div key={f.label} className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-100 transition-all">
                  <div className={`inline-flex p-3 rounded-xl ${f.bg} mb-4`}>
                    <Icon path={ICONS[f.iconKey]} className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{f.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Killer Feature Spotlight ── */}
        <section className="py-20" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)' }} aria-labelledby="spotlight-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <h2 id="spotlight-heading" className="text-4xl font-black text-slate-900 leading-tight mb-6">
                  One login.<br />
                  <span className="text-blue-600">Every organization.</span><br />
                  Total clarity.
                </h2>
                <div className="space-y-4 mb-8">
                  {[
                    ['No missed commitments', 'Your unified calendar shows events from every org you belong to.'],
                    ['Less email clutter', 'Announcements and updates live in one clean feed.'],
                    ['Better participation', 'When members stay informed, they show up more.'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                        <Icon path={ICONS.check} className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{title}</span>
                        <p className="text-gray-500 text-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Try It Free
                  <Icon path={ICONS.arrow} className="h-4 w-4" />
                </button>
              </div>

              {/* Multi-org mockup */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5" aria-hidden="true">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <Icon path={ICONS.users} className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">My Dashboard</div>
                    <div className="text-xs text-gray-400">3 organizations</div>
                  </div>
                  <div className="ml-auto flex gap-1.5">
                    {['bg-blue-500','bg-violet-500','bg-emerald-500'].map((c,i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { color: 'bg-blue-500', org: 'Toledo Food Bank', event: 'Volunteer Day — Sat 10am', type: 'event' },
                    { color: 'bg-violet-500', org: 'Garden Club', event: 'Spring Planting Update', type: 'announcement' },
                    { color: 'bg-emerald-500', org: 'Youth League', event: 'Game Night — Fri 7pm', type: 'event' },
                    { color: 'bg-blue-500', org: 'Toledo Food Bank', event: 'New member joined', type: 'member' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.event}</div>
                        <div className="text-xs text-gray-400">{item.org}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.type === 'event' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'announcement' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Built For Section ── */}
        <section className="py-20 bg-white" aria-labelledby="built-for-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="built-for-heading" className="text-4xl font-black text-slate-900 mb-4">
              Built for <span className="text-blue-600">Small Nonprofits</span>
            </h2>
            <p className="text-gray-500 text-lg mb-12">No IT department needed. No months-long implementation. Just results.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: 'clock',   text: 'Setup in under 10 minutes' },
                { icon: 'device',  text: 'Mobile-first experience' },
                { icon: 'lock',    text: 'Privacy controls built-in' },
                { icon: 'shield',  text: 'Accessibility built-in (ADA)' },
                { icon: 'bolt',    text: 'No developer needed' },
                { icon: 'users',   text: 'Multi-organization support' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left">
                  <div className="flex-shrink-0 w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon path={ICONS[icon]} className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-10 inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try It Free
              <Icon path={ICONS.arrow} className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-20 bg-slate-50" aria-labelledby="how-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 id="how-heading" className="text-4xl font-black text-slate-900 mb-4">How It Works</h2>
              <p className="text-gray-500 text-lg">Three steps to a fully connected community organization.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map(s => (
                <div key={s.n} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-black flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
                    {s.n}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{s.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started Now
                <Icon path={ICONS.arrow} className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-20 bg-white" aria-labelledby="pricing-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 id="pricing-heading" className="text-4xl font-black text-slate-900 mb-4">Simple, Honest Pricing</h2>
              <p className="text-gray-500 text-lg">No hidden fees. Cancel any time.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {PRICING.map(plan => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-7 border-2 flex flex-col ${plan.highlight ? 'border-blue-500 bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105' : 'border-gray-100 bg-white text-slate-900'}`}
                >
                  {plan.highlight && (
                    <div className="text-xs font-bold bg-white text-blue-600 rounded-full px-3 py-1 self-start mb-4">Most Popular</div>
                  )}
                  <h3 className={`text-xl font-black mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 my-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Icon path={ICONS.check} className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-blue-600'}`} strokeWidth={3} />
                        <span className={plan.highlight ? 'text-blue-100' : 'text-gray-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      plan.highlight
                        ? 'bg-white text-blue-600 hover:bg-blue-50 focus:ring-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 bg-slate-50" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="faq-heading" className="text-4xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left font-bold text-slate-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                  >
                    <span className="text-sm">{faq.q}</span>
                    <Icon
                      path={ICONS.chevDown}
                      className={`h-4 w-4 text-gray-400 flex-shrink-0 ml-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div id={`faq-answer-${i}`} className="px-6 pb-5">
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="py-20 bg-white" aria-labelledby="contact-heading">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 id="contact-heading" className="text-4xl font-black text-slate-900 mb-4">Get In Touch</h2>
              <p className="text-gray-500">Questions? We'd love to hear from you.</p>
            </div>
            {contactStatus === 'success' ? (
              <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon path={ICONS.check} className="h-7 w-7 text-green-600" strokeWidth={3} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm">We'll get back to you within one business day.</p>
                <button
                  onClick={() => setContactStatus(null)}
                  className="mt-6 text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} noValidate className="space-y-4" aria-label="Contact form">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Name <span aria-hidden="true">*</span></label>
                    <input
                      id="contact-name"
                      type="text"
                      value={contactForm.name}
                      onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span aria-hidden="true">*</span></label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-org" className="block text-sm font-semibold text-gray-700 mb-1.5">Organization <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    id="contact-org"
                    type="text"
                    value={contactForm.organization}
                    onChange={e => setContactForm(p => ({ ...p, organization: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your organization name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-semibold text-gray-700 mb-1.5">Message <span aria-hidden="true">*</span></label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                {contactStatus === 'error' && (
                  <p className="text-sm text-red-600" role="alert">Something went wrong. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={contactLoading || !contactForm.name || !contactForm.email || !contactForm.message}
                  className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg shadow-blue-200"
                >
                  {contactLoading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 bg-blue-600" aria-labelledby="final-cta-heading">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 id="final-cta-heading" className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Ready to simplify<br />community coordination?
            </h2>
            <p className="text-blue-200 text-lg mb-10">Join nonprofits and community organizations already using Syndicade.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                Start Free
                <Icon path={ICONS.arrow} className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 border-2 border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                Create Your Organization
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-gray-400 py-10" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xl font-black text-white">
              Syndi<span className="text-blue-400">cade</span>
            </div>
            <nav className="flex flex-wrap gap-5 text-sm" aria-label="Footer navigation">
              {[['features','Features'],['pricing','Pricing'],['faq','FAQ'],['contact','Contact']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  {label}
                </button>
              ))}
              <button onClick={() => navigate('/login')} className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Log In</button>
            </nav>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Syndicade. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Skip to main content for ADA */}
      
    </div>
  );
}