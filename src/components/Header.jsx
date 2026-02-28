import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';

function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const timer = setTimeout(() => runSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function runSearch(q) {
    setSearchLoading(true);
    try {
      const [events, announcements, orgs] = await Promise.all([
        supabase.from('events').select('id, title, start_time, organization_id')
          .ilike('title', '%' + q + '%').limit(4),
        supabase.from('announcements').select('id, title, organization_id')
          .ilike('title', '%' + q + '%').limit(4),
        supabase.from('organizations').select('id, name, type')
          .ilike('name', '%' + q + '%').limit(3),
      ]);

      const results = [];
      (orgs.data || []).forEach(o => results.push({
        id: 'org-' + o.id, type: 'Organization',
        title: o.name, subtitle: o.type,
        path: '/organizations/' + o.id,
      }));
      (events.data || []).forEach(e => results.push({
        id: 'event-' + e.id, type: 'Event',
        title: e.title,
        subtitle: new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        path: '/events/' + e.id,
      }));
      (announcements.data || []).forEach(a => results.push({
        id: 'ann-' + a.id, type: 'Announcement',
        title: a.title, subtitle: 'Announcement',
        path: '/organizations/' + a.organization_id + '/announcements',
      }));

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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Go to dashboard"
            >
              Syndicade
            </button>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-6 flex-shrink-0" aria-label="Main navigation">
            <button onClick={() => navigate('/dashboard')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              Dashboard
            </button>
            <button onClick={() => navigate('/discover')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              Discover Events
            </button>
            <button onClick={() => navigate('/explore')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              Discover Orgs
            </button>
            <button onClick={() => navigate('/calendar')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              Calendar
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-1 justify-end">

            {/* Search */}
            <div className="relative flex-1 max-w-xs" ref={searchRef}>
              <label htmlFor="global-search" className="sr-only">Search events, announcements, organizations</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                  {searchLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  ) : (
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                <input
                  id="global-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  aria-label="Search events, announcements, and organizations"
                  aria-autocomplete="list"
                  aria-controls={searchOpen ? 'search-results' : undefined}
                  aria-expanded={searchOpen}
                  autoComplete="off"
                />
              </div>

              {searchOpen && searchResults.length > 0 && (
                <div id="search-results" role="listbox" aria-label="Search results"
                  className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  {searchResults.map((result) => (
                    <button key={result.id} role="option" aria-selected="false"
                      onClick={() => handleResultClick(result.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                      aria-label={result.type + ': ' + result.title}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 truncate">{result.type} · {result.subtitle}</p>
                      </div>
                    </button>
                  ))}
                  {searchQuery.length >= 2 && (
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-400">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}

              {searchOpen && searchResults.length === 0 && !searchLoading && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 px-4 py-6 text-center z-50">
                  <p className="text-sm text-gray-500">No results for "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Notification bell */}
            <NotificationBell />

            {/* User avatar dropdown */}
            {currentUser && (
              <div className="relative flex-shrink-0" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                  aria-label="Open account menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                    {userInitial}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {userName}
                  </span>
                  <svg className={'h-4 w-4 text-gray-400 transition-transform ' + (userMenuOpen ? 'rotate-180' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                    role="menu" aria-label="Account menu">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/account-settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors text-left"
                      role="menuitem">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50 transition-colors text-left border-t border-gray-100"
                      role="menuitem">
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