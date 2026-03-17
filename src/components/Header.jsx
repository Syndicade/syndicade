import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

function Header() {
  var navigate = useNavigate();
  var { isDark, toggle } = useTheme();

  var [searchQuery, setSearchQuery] = useState('');
  var [searchResults, setSearchResults] = useState([]);
  var [searchLoading, setSearchLoading] = useState(false);
  var [searchOpen, setSearchOpen] = useState(false);
  var [currentUser, setCurrentUser] = useState(null);
  var [userMenuOpen, setUserMenuOpen] = useState(false);
  var [firstAdminOrg, setFirstAdminOrg] = useState(null);

  var searchRef = useRef(null);
  var userMenuRef = useRef(null);

  useEffect(function() {
    supabase.auth.getUser().then(function({ data: { user } }) {
      setCurrentUser(user);
    });
    var { data: { subscription } } = supabase.auth.onAuthStateChange(function(_event, session) {
      setCurrentUser(session?.user || null);
    });
    return function() { subscription.unsubscribe(); };
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
      .then(function({ data }) {
        if (data) setFirstAdminOrg(data.organizations);
      });
  }, [currentUser]);

  useEffect(function() {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return function() { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  useEffect(function() {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    var timer = setTimeout(function() { runSearch(searchQuery.trim()); }, 300);
    return function() { clearTimeout(timer); };
  }, [searchQuery]);

  async function runSearch(q) {
    setSearchLoading(true);
    try {
      var [events, announcements, orgs] = await Promise.all([
        supabase.from('events').select('id, title, start_time, organization_id').ilike('title', '%' + q + '%').limit(4),
        supabase.from('announcements').select('id, title, organization_id').ilike('title', '%' + q + '%').limit(4),
        supabase.from('organizations').select('id, name, type').ilike('name', '%' + q + '%').limit(3),
      ]);
      var results = [];
      (orgs.data || []).forEach(function(o) {
        results.push({ id: 'org-' + o.id, type: 'Organization', title: o.name, subtitle: o.type, path: '/organizations/' + o.id });
      });
      (events.data || []).forEach(function(e) {
        results.push({ id: 'event-' + e.id, type: 'Event', title: e.title, subtitle: new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), path: '/events/' + e.id });
      });
      (announcements.data || []).forEach(function(a) {
        results.push({ id: 'ann-' + a.id, type: 'Announcement', title: a.title, subtitle: 'Announcement', path: '/organizations/' + a.organization_id + '/announcements' });
      });
      setSearchResults(results);
      setSearchOpen(results.length > 0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleResultClick(path) {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    navigate(path);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  var userInitial = currentUser?.user_metadata?.full_name?.charAt(0).toUpperCase()
    || currentUser?.email?.charAt(0).toUpperCase()
    || '?';
  var userName = currentUser?.user_metadata?.full_name
    || currentUser?.email?.split('@')[0]
    || 'User';

  var headerBg = isDark ? '#0E1523' : '#FFFFFF';
  var headerBorder = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var textMuted = isDark ? '#64748B' : '#94A3B8';
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var inputBg = isDark ? '#151B2D' : '#F8FAFC';
  var inputBorder = isDark ? '#2A3550' : '#E2E8F0';
  var hoverBg = isDark ? '#1E2845' : '#F1F5F9';

  return (
    <header style={{ background: headerBg, borderBottom: '1px solid ' + headerBorder }} className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <button
            onClick={function() { navigate('/dashboard'); }}
            className="flex items-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Go to dashboard"
          >
            <span style={{ color: isDark ? '#FFFFFF' : '#1A2035', fontWeight: 800, fontSize: '22px' }}>Syndi</span>
            <span style={{ color: '#F5B731', fontWeight: 800, fontSize: '22px' }}>cade</span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-1 flex-shrink-0" aria-label="Main navigation">
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Discover Events', path: '/discover' },
              { label: 'Discover Orgs', path: '/explore' },
              { label: 'Programs', path: '/programs' },
              { label: 'Calendar', path: '/calendar' },
            ].map(function(item) {
              return (
                <button
                  key={item.path}
                  onClick={function() { navigate(item.path); }}
                  style={{ color: textSecondary }}
                  className="font-medium text-sm px-3 py-2 rounded-lg hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  onMouseEnter={function(e) { e.currentTarget.style.color = textPrimary; e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={function(e) { e.currentTarget.style.color = textSecondary; e.currentTarget.style.background = 'transparent'; }}
                >
                  {item.label}
                </button>
              );
            })}
            {firstAdminOrg && (
              <button
                onClick={function() { navigate('/community-board'); }}
                style={{ color: '#A78BFA', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                className="font-medium text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
              >
                Community Board
              </button>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-1 justify-end">

            {/* Search */}
            <div className="relative flex-1 max-w-xs" ref={searchRef}>
              <label htmlFor="global-search" className="sr-only">Search events, announcements, organizations</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                  {searchLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  ) : (
                    <svg className="h-4 w-4" style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <input
                  id="global-search"
                  type="search"
                  value={searchQuery}
                  onChange={function(e) { setSearchQuery(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  style={{ background: inputBg, border: '1px solid ' + inputBorder, color: textPrimary }}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  aria-label="Search events, announcements, and organizations"
                  aria-autocomplete="list"
                  aria-controls={searchOpen ? 'search-results' : undefined}
                  aria-expanded={searchOpen}
                  autoComplete="off"
                />
              </div>

              {/* Search results dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div
                  id="search-results"
                  role="listbox"
                  aria-label="Search results"
                  style={{ background: cardBg, border: '1px solid ' + headerBorder }}
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {searchResults.map(function(result) {
                    return (
                      <button
                        key={result.id}
                        role="option"
                        aria-selected="false"
                        onClick={function() { handleResultClick(result.path); }}
                        style={{ borderBottom: '1px solid ' + headerBorder, color: textPrimary }}
                        className="w-full flex items-center gap-3 px-4 py-3 focus:outline-none transition-colors text-left"
                        onMouseEnter={function(e) { e.currentTarget.style.background = hoverBg; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                        aria-label={result.type + ': ' + result.title}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{result.title}</p>
                          <p className="text-xs truncate" style={{ color: textMuted }}>{result.type} · {result.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                  <div className="px-4 py-2" style={{ background: inputBg, borderTop: '1px solid ' + headerBorder }}>
                    <p className="text-xs" style={{ color: textMuted }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
                  </div>
                </div>
              )}
              {searchOpen && searchResults.length === 0 && !searchLoading && searchQuery.length >= 2 && (
                <div
                  style={{ background: cardBg, border: '1px solid ' + headerBorder }}
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl px-4 py-6 text-center z-50"
                >
                  <p className="text-sm" style={{ color: textMuted }}>No results for "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Dark/Light toggle pill */}
            <div
              role="group"
              aria-label="Color theme toggle"
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '99px',
                padding: '2px',
                background: isDark ? '#151B2D' : '#E2E8F0',
                border: '1px solid ' + (isDark ? '#2A3550' : '#CBD5E1'),
                flexShrink: 0,
              }}
            >
              <button
                onClick={toggle}
                aria-pressed={isDark}
                aria-label="Switch to dark mode"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isDark ? '#0E1523' : 'transparent',
                  color: isDark ? '#CBD5E1' : '#64748B',
                  boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
                Dark
              </button>
              <button
                onClick={toggle}
                aria-pressed={!isDark}
                aria-label="Switch to light mode"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isDark ? 'transparent' : '#FFFFFF',
                  color: isDark ? '#64748B' : '#0E1523',
                  boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.12)',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Light
              </button>
            </div>

            {/* Notification bell */}
            <NotificationBell />

            {/* User avatar dropdown */}
            {currentUser && (
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
                  <svg
                    className={'h-4 w-4 transition-transform ' + (userMenuOpen ? 'rotate-180' : '')}
                    style={{ color: textMuted }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                  >
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
                      onClick={function() { setUserMenuOpen(false); navigate('/profile/settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm focus:outline-none transition-colors text-left"
                      style={{ color: textSecondary }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = hoverBg; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                      role="menuitem"
                    >
                      <svg className="h-4 w-4" style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </button>

                    <button
                      onClick={function() { setUserMenuOpen(false); navigate('/account-settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm focus:outline-none transition-colors text-left"
                      style={{ color: textSecondary }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = hoverBg; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
                      role="menuitem"
                    >
                      <svg className="h-4 w-4" style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </button>

                    <button
                      onClick={function() { setUserMenuOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm focus:outline-none transition-colors text-left"
                      style={{ color: '#EF4444', borderTop: '1px solid ' + headerBorder }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2'; }}
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;