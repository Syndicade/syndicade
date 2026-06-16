import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function Footer() {
  var navigate   = useNavigate();
  var year       = new Date().getFullYear();
  var [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      setIsLoggedIn(!!(res.data && res.data.session));
    });
    var sub = supabase.auth.onAuthStateChange(function(_event, session) {
      setIsLoggedIn(!!session);
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  var communityLinks = [
    { label: 'Discover Events',       path: '/discover'       },
    { label: 'Browse Programs',       path: '/programs'       },
    { label: 'Explore Organizations', path: '/explore'        },
    { label: 'Find Opportunities',    path: '/opportunities'  },
    { label: 'Funding Opportunities', path: '/funding'        },
  ];

  var quickLinks = [
    { label: 'Wishlist',     path: '/wishlist'     },
    { label: 'Report a Bug', path: '/report-a-bug' },
  ];

  var legalLinks = [
    { label: 'Terms of Service',  path: '/legal' },
    { label: 'Privacy Policy',    path: '/legal' },
    { label: 'Legal Information', path: '/legal' },
  ];

  var btnStyle = {
    color: '#94A3B8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 500,
  };

  function FooterLink({ label, path }) {
    return (
      <button
        onClick={function() { navigate(path); }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        style={btnStyle}
        onMouseEnter={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
        onMouseLeave={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
      >
        {label}
      </button>
    );
  }

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: '#151B2D', borderColor: '#2A3550' }}
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">

          {/* Logo + tagline */}
          <div>
            <button
              onClick={function() { navigate('/'); }}
              className="flex items-baseline gap-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Go to Syndicade homepage"
            >
              <span className="text-white font-extrabold text-2xl">Syndi</span>
              <span className="font-extrabold text-2xl" style={{ color: '#F5B731' }}>cade</span>
            </button>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Where Community Work Connects.</p>
          </div>

          {/* Nav columns */}
          <nav
            className="flex flex-wrap items-start gap-x-8 gap-y-6"
            aria-label="Footer navigation"
          >
            {/* Community */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731', letterSpacing: '3px' }}>
                Community
              </p>
              <div className="flex flex-col gap-2">
                {communityLinks.map(function(link) {
                  return <FooterLink key={link.path} label={link.label} path={link.path} />;
                })}
              </div>
            </div>

            {/* Quick Links — logged-in only */}
            {isLoggedIn && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731', letterSpacing: '3px' }}>
                  Quick Links
                </p>
                <div className="flex flex-col gap-2">
                  {quickLinks.map(function(link) {
                    return <FooterLink key={link.path} label={link.label} path={link.path} />;
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
                {legalLinks.map(function(link) {
                  return <FooterLink key={link.label} label={link.label} path={link.path} />;
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
          <p className="text-xs" style={{ color: '#475569' }}>
            No ads. No data selling. No revenue cut on payments.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;