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
  var [discoverOpen, setDiscoverOpen]   = useState(false);
  var userMenuRef    = useRef(null);
  var discoverRef    = useRef(null);

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
      if (discoverRef.current && !discoverRef.current.contains(e.target)) setDiscoverOpen(false);
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

  var DISCOVER_ITEMS = [
    { path: '/discover',      label: 'Events',        sub: 'Upcoming public events',          color: '#3B82F6', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/explore',       label: 'Organizations', sub: 'Verified nonprofits near you',    color: '#22C55E', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/opportunities', label: 'Opportunities', sub: 'Roles, boards, and volunteering', color: '#8B5CF6', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { path: '/funding',       label: 'Funding',       sub: 'Grants and scholarships',         color: '#F5B731', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  function NavBtn({ path, label }) {
    var active = location.pathname === path;
    return (
      <button
        onClick={function() { navigate(path); }}
        style={{ color: active ? textPrimary : textSecondary, background: active ? hoverBg : 'transparent', fontWeight: active ? 700 : 500, fontSize: '14px', padding: '6px 12px', border: 'none', cursor: 'pointer', borderRadius: '8px', transition: 'color 0.15s, background 0.15s' }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        onMouseEnter={function(e) { e.currentTarget.style.color = textPrimary; if (!active) e.currentTarget.style.background = hoverBg; }}
        onMouseLeave={function(e) { e.currentTarget.style.color = active ? textPrimary : textSecondary; e.currentTarget.style.background = active ? hoverBg : 'transparent'; }}
        aria-current={active ? 'page' : undefined}
      >
        {label}
      </button>
    );
  }

  function DiscoverDropdown() {
    var discoverActive = ['/discover', '/explore', '/opportunities', '/funding'].indexOf(location.pathname) !== -1;
    return (
      <div ref={discoverRef} style={{ position: 'relative' }}>
        <button
          onClick={function() { setDiscoverOpen(!discoverOpen); }}
          style={{
            color: discoverActive ? textPrimary : textSecondary,
            background: discoverActive ? hoverBg : 'transparent',
            fontWeight: discoverActive ? 700 : 500,
            fontSize: '14px', padding: '6px 12px', border: 'none', cursor: 'pointer',
            borderRadius: '8px', transition: 'color 0.15s, background 0.15s',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
          onMouseEnter={function(e) { if (!discoverOpen) { e.currentTarget.style.color = textPrimary; if (!discoverActive) e.currentTarget.style.background = hoverBg; } }}
          onMouseLeave={function(e) { if (!discoverOpen) { e.currentTarget.style.color = discoverActive ? textPrimary : textSecondary; e.currentTarget.style.background = discoverActive ? hoverBg : 'transparent'; } }}
          aria-haspopup="true"
          aria-expanded={discoverOpen}
        >
          Discover
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" style={{ transition: 'transform 0.15s', transform: discoverOpen ? 'rotate(180deg)' : 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {discoverOpen && (
          <div
            style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: cardBg, border: '1px solid ' + headerBorder, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: '220px', overflow: 'hidden', zIndex: 100 }}
            role="menu"
            aria-label="Discover navigation"
          >
            {DISCOVER_ITEMS.map(function(item) {
              var itemActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={function() { setDiscoverOpen(false); navigate(item.path); }}
                  role="menuitem"
                  className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', width: '100%', textAlign: 'left', background: itemActive ? hoverBg : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = itemActive ? hoverBg : 'transparent'; }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.color }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: textMuted }}>{item.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <header style={{ background: '#FFFFFF', borderBottom: '1px solid ' + headerBorder }} className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo — always links to landing page */}
          <button
            onClick={function() { navigate('/'); }}
            className="flex items-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Go to Syndicade homepage"
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
                  style={{ color: '#A78BFA', background: location.pathname.startsWith('/community-board') ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', fontWeight: 500, fontSize: '14px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                  aria-current={location.pathname.startsWith('/community-board') ? 'page' : undefined}
                >
                  Community Board
                </button>
              )}
            </nav>
          )}

          {/* Nav — logged out: consistent on ALL pages */}
          {!currentUser && (
            <nav className="hidden md:flex items-center space-x-1 flex-shrink-0" aria-label="Main navigation">
              <NavBtn path="/features"  label="Features" />
              <NavBtn path="/pricing"   label="Pricing" />
              <NavBtn path="/compare"   label="Compare Costs" />
              <DiscoverDropdown />
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
                <button
                  onClick={function() { navigate('/login'); }}
                  className="hidden sm:block text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2 transition-colors"
                  style={{ color: textSecondary }}
                  onMouseEnter={function(e) { e.currentTarget.style.color = textPrimary; }}
                  onMouseLeave={function(e) { e.currentTarget.style.color = textSecondary; }}
                >
                  Log In
                </button>
                <button
                  onClick={function() { navigate('/signup'); }}
                  className="text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg px-4 py-2 transition-colors"
                  style={{ color: '#111827', background: '#F5B731', boxShadow: '0 2px 6px rgba(245,183,49,0.35)' }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = '#E5A820'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = '#F5B731'; }}
                >
                  Get Started Free
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;