import { useNavigate } from 'react-router-dom';

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
  arrow:   'M13 7l5 5m0 0l-5 5m5-5H6',
  heart:   'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  users:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  globe:   ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  shield:  ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  bolt:    ['M13 10V3L4 14h7v7l9-11h-7z'],
  mail:    ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  check:   'M5 13l4 4L19 7',
  home:    ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
};

const TEAM = [
  { initials: 'IA', name: 'Irma Acuna', role: 'Founder & CEO', bio: 'Community organizer turned technologist. Built Syndicade after spending years watching nonprofits struggle with disconnected tools.', color: 'bg-blue-600' },
  { initials: 'MR', name: 'Marcus Rivera', role: 'Head of Product', bio: 'Former nonprofit executive director. Brings deep empathy for the real challenges organizations face every day.', color: 'bg-violet-600' },
  { initials: 'AK', name: 'Aisha Kamara', role: 'Lead Engineer', bio: 'Passionate about building accessible software that works for everyone, regardless of technical background.', color: 'bg-emerald-600' },
];

const VALUES = [
  { icon: 'heart',  title: 'Mission first',       desc: 'Every feature we build is evaluated against one question: does this help communities do more good in the world?' },
  { icon: 'users',  title: 'Built for everyone',   desc: 'We design for the volunteer coordinator, the board member, and the first-time user — not just the tech-savvy admin.' },
  { icon: 'shield', title: 'Privacy by default',   desc: 'Member data belongs to your organization. We never sell it, share it, or use it to train AI models.' },
  { icon: 'bolt',   title: 'Simple on purpose',    desc: 'We deliberately leave out features that add complexity without adding value. Less clutter means more focus.' },
  { icon: 'globe',  title: 'Community ownership',  desc: 'We partner with the organizations we serve. Their feedback shapes every release.' },
  { icon: 'check',  title: 'Accessible always',    desc: 'ADA compliance is not a checkbox. Every screen is built to work for users of all abilities.' },
];

const MILESTONES = [
  { year: '2023', label: 'Founded', desc: 'Syndicade was born out of frustration with fragmented nonprofit software.' },
  { year: '2024', label: 'First 100 orgs', desc: 'Reached 100 organizations across Northwest Ohio, all on the free plan.' },
  { year: '2024', label: 'Pro launch', desc: 'Launched paid plans with documents, polls, surveys, and advanced member management.' },
  { year: '2025', label: '2,400+ orgs', desc: 'Expanded nationally with organizations in 38 states using Syndicade daily.' },
  { year: '2026', label: 'What\'s next', desc: 'Mobile apps, email campaigns, and deeper integrations — all driven by community feedback.' },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0d1526', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Skip link */}
        <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-slate-900 focus:rounded-lg focus:font-semibold focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ── Nav ── */}
      <header className="border-b border-white/10" style={{ background: 'rgba(13,21,38,0.98)' }} role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-black tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
              aria-label="Syndicade home"
            >
              Syndi<span className="text-amber-400">cade</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 rounded px-2 py-1"
              >
                <Icon path={ICONS.home} className="h-4 w-4" />
                Home
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Start Free
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">

        {/* ── Hero ── */}
        <section className="relative py-20 md:py-28 overflow-hidden" aria-labelledby="about-heading">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-20 left-1/3 w-80 h-80 rounded-full filter blur-3xl opacity-15" style={{ background: '#1d4ed8' }} />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full filter blur-3xl opacity-10" style={{ background: '#7c3aed' }} />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 border text-xs font-semibold px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }}>
              Our story
            </div>
            <h1 id="about-heading" className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
              Built by community.<br />
              <span className="text-amber-400">For community.</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Syndicade exists because great organizations deserve great tools. We started with one nonprofit struggling to coordinate volunteers across three spreadsheets — and we have not stopped building since.
            </p>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="py-20 border-y border-white/10" style={{ background: '#0a1220' }} aria-labelledby="mission-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Our mission</p>
                <h2 id="mission-heading" className="text-4xl font-black text-white leading-tight mb-6">
                  Make organized communities the norm, not the exception.
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Too many nonprofits and community groups are doing extraordinary work with ordinary — and often broken — tools. They deserve software that respects their time, their budget, and the people they serve.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Syndicade is that software. A unified platform that handles the operational complexity so organizations can focus entirely on their mission.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: '2,400+', label: 'Organizations', color: 'text-blue-400' },
                  { num: '48K',    label: 'Active members', color: 'text-emerald-400' },
                  { num: '38',     label: 'States',         color: 'text-violet-400' },
                  { num: '99.9%',  label: 'Uptime',         color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border border-white/10 p-6 text-center" style={{ background: '#111d35' }}>
                    <div className={`text-4xl font-black mb-2 ${s.color}`}>{s.num}</div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="py-20" style={{ background: '#0d1526' }} aria-labelledby="values-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">What we believe</p>
              <h2 id="values-heading" className="text-4xl font-black text-white">Our values</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VALUES.map(v => (
                <div key={v.title} className="rounded-2xl border border-white/10 p-6 transition-all hover:border-white/20" style={{ background: '#111d35' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-blue-900/50">
                    <Icon path={ICONS[v.icon]} className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section className="py-20 border-y border-white/10" style={{ background: '#0a1220' }} aria-labelledby="timeline-heading">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">How we got here</p>
              <h2 id="timeline-heading" className="text-4xl font-black text-white">Our journey</h2>
            </div>
            <ol className="relative" aria-label="Company milestones">
              {MILESTONES.map((m, i) => (
                <li key={m.year + m.label} className="flex gap-6 mb-10 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg shadow-blue-900/60">
                      {i + 1}
                    </div>
                    {i < MILESTONES.length - 1 && (
                      <div className="w-px flex-1 mt-2 bg-white/10" aria-hidden="true" />
                    )}
                  </div>
                  <div className="pb-10 last:pb-0">
                    <div className="text-xs font-semibold text-amber-400 mb-1">{m.year}</div>
                    <h3 className="text-base font-bold text-white mb-1">{m.label}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="py-20" style={{ background: '#0d1526' }} aria-labelledby="team-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">The people behind it</p>
              <h2 id="team-heading" className="text-4xl font-black text-white">Our team</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TEAM.map(t => (
                <div key={t.name} className="rounded-2xl border border-white/10 p-6 text-center transition-all hover:border-white/20" style={{ background: '#111d35' }}>
                  <div className={`w-16 h-16 rounded-full ${t.color} flex items-center justify-center text-white text-xl font-black mx-auto mb-4`} aria-hidden="true">
                    {t.initials}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{t.name}</h3>
                  <p className="text-xs font-semibold text-blue-400 mb-3 uppercase tracking-wide">{t.role}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{t.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 border-t border-white/10" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0d1526 100%)' }} aria-labelledby="about-cta-heading">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 id="about-cta-heading" className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Join the community.
            </h2>
            <p className="text-slate-300 text-lg mb-10">
              Free to start. No credit card. Setup in under 10 minutes.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-blue-900"
              >
                Start Free
                <Icon path={ICONS.arrow} className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-8 py-4 font-bold rounded-xl border-2 border-white/30 text-white hover:border-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-blue-900"
              >
                Back to home
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-10" style={{ background: '#060e1a' }} role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xl font-black text-white">
              Syndi<span className="text-amber-400">cade</span>
            </div>
            <nav className="flex flex-wrap gap-5 text-sm" aria-label="Footer navigation">
              <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 rounded">Home</button>
              <button onClick={() => navigate('/login')} className="text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 rounded">Log In</button>
            </nav>
            <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} Syndicade. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}