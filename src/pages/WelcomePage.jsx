import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Icon({ path, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />)
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={path} />}
    </svg>
  );
}

const ICONS = {
  arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
  building: ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  search:   'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  check:    'M5 13l4 4L19 7',
};

export default function WelcomePage() {
  const navigate  = useNavigate();
  const [user, setUser]   = useState(null);
  const [orgs, setOrgs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch orgs this member belongs to
        const { data } = await supabase
          .from('memberships')
          .select('organization_id, role, organizations(id, name, location, type)')
          .eq('member_id', user.id)
          .eq('status', 'active');
        setOrgs(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1526' }}>
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" aria-label="Loading">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#0d1526', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <a
        href="#welcome-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-slate-900 focus:rounded-lg focus:font-semibold focus:outline-none"
      >
        Skip to content
      </a>

      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-2xl font-black text-white mb-1">
            Syndi<span className="text-amber-400">cade</span>
          </div>
        </div>

        {/* Card */}
        <main
          id="welcome-main"
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: '#111d35' }}
        >
          {/* Card top */}
          <div className="p-8 pb-6 border-b border-white/10" style={{ background: '#0a1220' }}>
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-black mx-auto mb-5"
              aria-hidden="true"
            >
              {firstName[0].toUpperCase()}
            </div>
            <h1 className="text-2xl font-black text-white text-center mb-2">
              Welcome, {firstName}!
            </h1>
            <p className="text-slate-400 text-sm text-center">
              You're now part of the Syndicade community.
            </p>
          </div>

          {/* Orgs section */}
          <div className="p-6">
            {orgs.length > 0 ? (
              <>
                <p
                  className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4"
                  id="orgs-label"
                >
                  You belong to {orgs.length} organization{orgs.length !== 1 ? 's' : ''}
                </p>
                <ul role="list" aria-labelledby="orgs-label" className="space-y-3 mb-6">
                  {orgs.map(m => (
                    <li key={m.organization_id}>
                      <button
                        onClick={() => navigate(`/organizations/${m.organization_id}`)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-blue-800/50 text-left transition-all hover:border-blue-600/70 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        style={{ background: 'rgba(30,58,138,0.2)' }}
                        aria-label={`Go to ${m.organizations?.name}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <Icon path={ICONS.building} className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">{m.organizations?.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {m.organizations?.type}{m.organizations?.location ? ` · ${m.organizations.location}` : ''}
                          </div>
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(37,99,235,0.3)', color: '#93c5fd' }}
                        >
                          {m.role}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="text-center py-6 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  aria-hidden="true"
                >
                  <Icon path={ICONS.building} className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-white font-semibold text-sm mb-1">No organizations yet</p>
                <p className="text-slate-400 text-xs">Search below to find and join one.</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4" role="separator">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">Discover more</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Search */}
            <button
              onClick={() => navigate('/discover')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/15 text-slate-400 hover:text-white hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2"
              style={{ background: '#0d1526' }}
              aria-label="Search for organizations to join"
            >
              <Icon path={ICONS.search} className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Search for organizations to join…</span>
            </button>

            <p className="text-xs text-slate-500 text-center mt-3 leading-relaxed">
              You can also ask an admin for an invite link, or browse public organizations in your area.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2 text-sm"
              aria-label="Continue to your dashboard"
            >
              Continue to dashboard
              <Icon path={ICONS.arrow} className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}