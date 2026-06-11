import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';

function Header() {
  var navigate  = useNavigate();
  var location  = useLocation();

  var [currentUser, setCurrentUser]     = useState(null);
  var [userMenuOpen, setUserMenuOpen]   = useState(false);
  var [firstAdminOrg, setFirstAdminOrg] = useState(null);

  var userMenuRef = useRef(null);

  useEffect(function() {
    supabase.auth.getUser().then(function(result) { setCurrentUser(result.data.user || null); });
    var sub = supabase.auth.onAuthStateChange(function(_event, session) {
      setCurrentUser(session ? session.user : null);
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  useEffect(function() {
    if (!currentUser) return;
    supabase
      .from('memberships')
      .select('organization_id, organizations(id, name)')
      .eq('member_id', currentUser.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .limit(1)
      .single()
      .then(function(result) { if (result.data) setFirstAdminOrg(result.data.organizations); });
  }, [currentUser]);

  useEffect(function() {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return function() { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  var userInitial = (currentUser && currentUser.user_metadata && currentUser.user_metadata.full_name)
    ? currentUser.user_metadata.full_name.charAt(0).toUpperCase()
    : (currentUser && currentUser.email ? currentUser.email.charAt(0).toUpperCase() : '?');

  var userName = (currentUser && currentUser.user_metadata && currentUser.user_metadata.full_name)
    ? currentUser.user_metadata.full_name
    : (currentUser && currentUser.email ? currentUser.email.split('@')[0] : 'User');

  var headerBorder  = '#E2E8F0';
  var textSecondary = '#475569';
  var textPrimary   = '#0E1523';
  var textMuted     = '#94A3B8';
  var cardBg        = '#FFFFFF';
  var hoverBg       = '#F1F5F9';

  function NavBtn({ path, label, style, hoverStyle }) {
    var active = location.pathname === path;
    return (
      <button
        onClick={function() { navigate(path); }}
        style={Object.assign({ color: active ? textPrimary : textSecondary, background: active ? hoverBg : 'transparent', fontWeight: active ? 700 : 500 }, style)}
        className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        onMouseEnter={function(e) { e.currentTarget.style.color = textPrimary; e.currentTarget.style.background = (hoverStyle && hoverStyle.background) || hoverBg; }}
        onMouseLeave={function(e) { e.currentTarget.style.color = active ? textPrimary : (style && style.color) || textSecondary; e.currentTarget.style.background = active ? hoverBg : (style && style.background) || 'transparent'; }}
        aria-current={active ? 'page' : undefined}
      >
        {label}
      </button>
    );
  }

  return (
    <header style={{ background: '#FFFFFF', borderBottom: '1px solid ' + headerBorder }} className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <button
            onClick={function() { navigate(currentUser ? '/dashboard' : '/'); }}
            className="flex items-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={currentUser ? 'Go to dashboard' : 'Go to Syndicade homepage'}
          >
            <span style={{ color: '#0E1523', fontWeight: 800, fontSize: '22px' }}>Syndi</span>
            <span style={{ color: '#F5B731', fontWeight: 800, fontSize: '22px' }}>cade</span>
          </button>

          {/* Nav — logged in */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-1 flex-shrink-0" aria-label="Main navigation">
              <NavBtn path="/dashboard"     label="Dashboard" />
              <NavBtn path="/discover"      label="Discover Events" />
              <NavBtn path="/explore"       label="Explore Orgs" />
              <NavBtn path="/opportunities" label="Opportunities" />
              <NavBtn path="/funding"       label="Funding" />
              {firstAdminOrg && (
                <button
                  onClick={function() { navigate('/community-board/hub'); }}
                  style={{ color: '#A78BFA', background: location.pathname.startsWith('/community-board') ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', fontWeight: 500 }}
                  className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                  aria-current={location.pathname.startsWith('/community-board') ? 'page' : undefined}
                >
                  Community Board
                </button>
              )}
            </nav>
          )}

          {/* Nav — logged out */}
          {!currentUser && (
            <nav className="hidden md:flex items-center space-x-1 flex-shrink-0" aria-label="Main navigation">
              {location.pathname !== '/features' && (
                <NavBtn path="/features" label="Features" />
              )}
              {location.pathname !== '/pricing' && (
                <NavBtn path="/pricing" label="Pricing" />
              )}
              {location.pathname !== '/compare' && (
                <NavBtn path="/compare" label="Compare Costs" />
              )}
              <NavBtn path="/discover"      label="Discover Events" />
              <NavBtn path="/explore"       label="Explore Orgs" />
              <NavBtn path="/opportunities" label="Opportunities" />
              <NavBtn path="/funding"       label="Funding" />
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">

            {currentUser && (
              <>
                <NotificationBell />

                <div className="relative flex-shrink-0" ref={userMenuRef}>
                  <button
                    onClick={function() { setUserMenuOpen(!userMenuOpen); }}
                    className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                    aria-label="Open account menu"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {userInitial}
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate" style={{ color: textSecondary }}>
                      {userName}
                    </span>
                    <svg className={'h-4 w-4 transition-transform ' + (userMenuOpen ? 'rotate-180' : '')} style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50"
                      style={{ background: cardBg, border: '1px solid ' + headerBorder }}
                      role="menu"
                      aria-label="Account menu"
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid ' + headerBorder }}>
                        <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{userName}</p>
                        <p className="text-xs truncate" style={{ color: textMuted }}>{currentUser.email}</p>
                      </div>

                      <button
                        onClick={function() { setUserMenuOpen(false); navigate('/account-settings'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm focus:outline-none transition-colors text-left"
                        style={{ color: textSecondary }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = hoverBg; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                        role="menuitem"
                      >
                        <svg className="h-4 w-4" style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Settings
                      </button>

                      <button
                        onClick={function() { setUserMenuOpen(false); handleSignOut(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm focus:outline-none transition-colors text-left"
                        style={{ color: '#EF4444', borderTop: '1px solid ' + headerBorder }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = '#FEF2F2'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                        role="menuitem"
                      >
                        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!currentUser && (
              <div className="flex items-center gap-2">
                <button onClick={function() { navigate('/login'); }} className="hidden sm:block text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2 transition-colors" style={{ color: textSecondary }} onMouseEnter={function(e) { e.currentTarget.style.color = textPrimary; }} onMouseLeave={function(e) { e.currentTarget.style.color = textSecondary; }}>Log In</button>
                <button onClick={function() { navigate('/signup'); }} className="text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg px-4 py-2 transition-colors" style={{ color: '#111827', background: '#F5B731', boxShadow: '0 2px 6px rgba(245,183,49,0.35)' }} onMouseEnter={function(e) { e.currentTarget.style.background = '#E5A820'; }} onMouseLeave={function(e) { e.currentTarget.style.background = '#F5B731'; }}>Get Started Free</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;