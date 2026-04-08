import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function Footer() {
  var navigate  = useNavigate();
  var year      = new Date().getFullYear();
  var [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(function() {
    supabase.auth.getSession().then(function({ data: { session } }) {
      setIsLoggedIn(!!session);
    });
    var { data: { subscription } } = supabase.auth.onAuthStateChange(function(_event, session) {
      setIsLoggedIn(!!session);
    });
    return function() { subscription.unsubscribe(); };
  }, []);

  var publicLinks = [
    { label: 'Discover Events',       path: '/discover'  },
    { label: 'Explore Organizations', path: '/explore'   },
  ];

  var authLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Calendar',  path: '/calendar'  },
  ];

  var navLinks = isLoggedIn
    ? publicLinks.concat(authLinks)
    : publicLinks;

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: '#151B2D', borderColor: '#2A3550' }}
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Top row: logo + nav */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">

          {/* Logo + tagline */}
          <div>
            <button
              onClick={function() { navigate(isLoggedIn ? '/dashboard' : '/'); }}
              className="flex items-baseline gap-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={isLoggedIn ? 'Go to dashboard' : 'Go to Syndicade homepage'}
            >
              <span className="text-white font-extrabold text-2xl">Syndi</span>
              <span className="font-extrabold text-2xl" style={{ color: '#F5B731' }}>cade</span>
            </button>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Where Community Work Connects.</p>
          </div>

          {/* Nav links */}
          <nav
            className="flex flex-wrap items-start gap-x-8 gap-y-3"
            aria-label="Footer navigation"
          >
            {/* Community */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731', letterSpacing: '3px' }}>
                Community
              </p>
              <div className="flex flex-col gap-2">
                {publicLinks.map(function(link) {
                  return (
                    <button
                      key={link.path}
                      onClick={function() { navigate(link.path); }}
                      className="text-sm font-medium text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseEnter={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account — only for logged-in users */}
            {isLoggedIn && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731', letterSpacing: '3px' }}>
                  My Account
                </p>
                <div className="flex flex-col gap-2">
                  {authLinks.map(function(link) {
                    return (
                      <button
                        key={link.path}
                        onClick={function() { navigate(link.path); }}
                        className="text-sm font-medium text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseEnter={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
                      >
                        {link.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731', letterSpacing: '3px' }}>
                Legal
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Terms of Service',  path: '/legal' },
                  { label: 'Privacy Policy',    path: '/legal' },
                  { label: 'Legal Information', path: '/legal' },
                ].map(function(link) {
                  return (
                    <button
                      key={link.label}
                      onClick={function() { navigate(link.path); }}
                      className="text-sm font-medium text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onMouseEnter={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </nav>
        </div>

        {/* Divider */}
        <div className="border-t" style={{ borderColor: '#2A3550' }} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs" style={{ color: '#64748B' }}>
            {'© ' + year + ' Syndicade. All rights reserved.'}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: '#475569' }}>
              No ads. No data selling. No revenue cut on payments.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;