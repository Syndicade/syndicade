import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '../lib/supabase';
import { et } from '../lib/eventDiscoveryTranslations';
import EventDiscoveryCard from '../components/EventDiscoveryCard';
import EventDiscoveryFilters from '../components/EventDiscoveryFilters';
import ProgramDiscoveryCard from '../components/ProgramDiscoveryCard';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

var PAGE_SIZE = 20;

var SORT_OPTIONS = [
  { value: 'start_time', labelKey: 'soonest' },
  { value: 'ending_soon', labelKey: 'endingSoon' },
  { value: 'recently_added', labelKey: 'recentlyAdded' },
];

var PROGRAM_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'closed', label: 'Closed' },
];

var DEFAULT_FILTERS = {
  eventTypes: [],
  audience: [],
  languages: [],
  orgType: '',
  dateRange: '',
  dateFrom: '',
  dateTo: '',
  state: '',
  city: '',
  zip: '',
  requiresRsvp: null,
  volunteerSignup: null,
  donationDropoff: null,
  uiLang: 'en',
};

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  );
}

function XIcon({ size }) {
  var cls = size === 14 ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CalendarXIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ProgramsEmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function EventCardSkeleton({ isDark }) {
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor = isDark ? '#2A3550' : '#E2E8F0';
  var shimmer1 = isDark ? '#1E2845' : '#F1F5F9';
  var shimmer2 = isDark ? '#2A3550' : '#E2E8F0';
  return (
    <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-hidden="true" className="animate-pulse">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '16px', background: shimmer2, borderRadius: '4px', width: '75%' }} />
          <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '33%' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ width: '28px', height: '28px', background: shimmer1, borderRadius: '8px' }} />
          <div style={{ width: '28px', height: '28px', background: shimmer1, borderRadius: '8px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '66%' }} />
        <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '50%' }} />
      </div>
      <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '100%' }} />
      <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '80%' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ height: '20px', width: '80px', background: shimmer1, borderRadius: '99px' }} />
        <div style={{ height: '20px', width: '80px', background: shimmer1, borderRadius: '99px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid ' + borderColor }}>
        <div style={{ height: '12px', width: '96px', background: shimmer1, borderRadius: '4px' }} />
        <div style={{ height: '28px', width: '96px', background: shimmer2, borderRadius: '8px' }} />
      </div>
    </div>
  );
}

function ProgramCardSkeleton({ isDark }) {
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor = isDark ? '#2A3550' : '#E2E8F0';
  var shimmer1 = isDark ? '#1E2845' : '#F1F5F9';
  var shimmer2 = isDark ? '#2A3550' : '#E2E8F0';
  return (
    <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-hidden="true" className="animate-pulse">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: shimmer2 }} />
        <div style={{ height: '12px', width: '120px', background: shimmer1, borderRadius: '4px' }} />
      </div>
      <div style={{ height: '18px', width: '65%', background: shimmer2, borderRadius: '4px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '100%' }} />
        <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '85%' }} />
        <div style={{ height: '12px', background: shimmer1, borderRadius: '4px', width: '70%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ height: '11px', width: '50%', background: shimmer1, borderRadius: '4px' }} />
        <div style={{ height: '11px', width: '40%', background: shimmer1, borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid ' + borderColor }}>
        <div style={{ height: '11px', width: '80px', background: shimmer1, borderRadius: '4px' }} />
        <div style={{ height: '28px', width: '96px', background: shimmer2, borderRadius: '8px' }} />
      </div>
    </div>
  );
}

export default function EventDiscovery() {
  var { isDark } = useTheme();

  var pageBg        = isDark ? '#0E1523' : '#FFFFFF';
  var sectionBg     = isDark ? '#151B2D' : '#F8FAFC';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';

  var [session, setSession] = useState(null);
  var [viewMode, setViewMode] = useState('events');
  var [filters, setFilters] = useState(DEFAULT_FILTERS);
  var [keyword, setKeyword] = useState('');
  var [debouncedKeyword, setDebouncedKeyword] = useState('');
  var [sortBy, setSortBy] = useState('start_time');
  var [programStatus, setProgramStatus] = useState('');

  var [events, setEvents] = useState([]);
  var [totalCount, setTotalCount] = useState(0);
  var [page, setPage] = useState(1);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  var [programs, setPrograms] = useState([]);
  var [programsTotalCount, setProgramsTotalCount] = useState(0);
  var [programsPage, setProgramsPage] = useState(1);
  var [programsLoading, setProgramsLoading] = useState(false);
  var [programsError, setProgramsError] = useState(null);
  var [savedPrograms, setSavedPrograms] = useState(new Set());

  var [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  var [savedEvents, setSavedEvents] = useState(new Set());
  var [adminOrgs, setAdminOrgs] = useState([]);

  var [selectedEvent, setSelectedEvent] = useState(null);
  var [guestRSVPModal, setGuestRSVPModal] = useState(false);
  var [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '', status: 'interested', guestCount: 1 });
  var [rsvpLoading, setRsvpLoading] = useState(false);
  var [rsvpSuccess, setRsvpSuccess] = useState(false);

  var searchRef = useRef(null);
  var lang = filters.uiLang || 'en';

  useEffect(function() {
    supabase.auth.getSession().then(function(res) { setSession(res.data.session); });
    var sub = supabase.auth.onAuthStateChange(function(_e, s) { setSession(s); });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  useEffect(function() {
    if (!session) return;
    supabase.from('memberships').select('organization_id, organizations(id, name)')
      .eq('member_id', session.user.id).eq('role', 'admin').eq('status', 'active')
      .then(function(res) {
        if (res.data) setAdminOrgs(res.data.map(function(m) { return { id: m.organization_id, name: m.organizations && m.organizations.name }; }));
      });
  }, [session]);

  useEffect(function() {
    if (!session) return;
    supabase.from('event_saves').select('event_id').eq('user_id', session.user.id)
      .then(function(res) {
        if (res.data) setSavedEvents(new Set(res.data.map(function(r) { return r.event_id; })));
      });
    supabase.from('program_saves').select('program_id').eq('user_id', session.user.id)
      .then(function(res) {
        if (res.data) setSavedPrograms(new Set(res.data.map(function(r) { return r.program_id; })));
      });
  }, [session]);

  useEffect(function() {
    var timer = setTimeout(function() { setDebouncedKeyword(keyword); }, 300);
    return function() { clearTimeout(timer); };
  }, [keyword]);

  useEffect(function() { setPage(1); setProgramsPage(1); }, [debouncedKeyword, filters, sortBy, programStatus, viewMode]);

  var fetchEvents = useCallback(async function() {
    if (viewMode !== 'events') return;
    setLoading(true);
    setError(null);
    try {
      var offset = (page - 1) * PAGE_SIZE;
      var res = await supabase.rpc('get_public_events', {
        search_keyword: debouncedKeyword || null,
        filter_tags: (filters.tags || []).length > 0 ? filters.tags : null,
        filter_event_types: filters.eventTypes.length > 0 ? filters.eventTypes : null,
        filter_audience: filters.audience.length > 0 ? filters.audience : null,
        filter_languages: filters.languages.length > 0 ? filters.languages : null,
        filter_org_type: filters.orgType || null,
        filter_state: filters.state || null,
        filter_city: filters.city || null,
        filter_zip: filters.zip || null,
        filter_volunteer: filters.volunteerSignup || null,
        filter_donation: filters.donationDropoff || null,
        filter_rsvp: filters.requiresRsvp || null,
        filter_date_range: filters.dateRange
          ? (filters.dateRange === 'thisWeek' ? 'this_week'
            : filters.dateRange === 'thisMonth' ? 'this_month'
            : filters.dateRange === 'customRange' ? 'custom'
            : filters.dateRange)
          : null,
        filter_date_from: filters.dateRange === 'customRange' && filters.dateFrom ? filters.dateFrom : null,
        filter_date_to: filters.dateRange === 'customRange' && filters.dateTo ? filters.dateTo : null,
        sort_by: sortBy,
        page_limit: PAGE_SIZE,
        page_offset: offset,
      });
      if (res.error) throw res.error;
      setEvents(res.data || []);
      setTotalCount(res.data && res.data.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : offset + (res.data ? res.data.length : 0));
    } catch (err) {
      console.error('Event discovery fetch error:', err);
      setError(err.message || 'Failed to load events');
      toast.error(et(lang, 'errorDesc'));
    } finally {
      setLoading(false);
    }
  }, [viewMode, page, debouncedKeyword, filters, sortBy, lang]);

var fetchPrograms = useCallback(async function() {
  if (viewMode !== 'programs') return;
  setProgramsLoading(true);
  setProgramsError(null);
  try {
    var offset = (programsPage - 1) * PAGE_SIZE;
    var query = supabase
      .from('org_programs')
      .select('*, organizations!inner(id, name, slug, logo_url, type, city, state, county, is_public)')
      .eq('is_public', true)
      .eq('publish_to_discovery', true)
      .eq('organizations.is_public', true)
      .range(offset, offset + PAGE_SIZE - 1)
      .order('created_at', { ascending: false });

    if (programStatus) query = query.eq('status', programStatus);
    if (filters.state) query = query.ilike('organizations.state', filters.state);
    if (filters.city) query = query.ilike('organizations.city', '%' + filters.city + '%');
    if (debouncedKeyword) query = query.or('name.ilike.%' + debouncedKeyword + '%,description.ilike.%' + debouncedKeyword + '%');

    var res = await query;
    if (res.error) throw res.error;
    var safeData = (res.data || []).filter(function(p) { return p && p.id; }).map(function(p) {
      return Object.assign({}, p, {
        org_name: p.organizations ? p.organizations.name : '',
        org_slug: p.organizations ? p.organizations.slug : '',
        org_logo_url: p.organizations ? p.organizations.logo_url : null,
        org_type: p.organizations ? p.organizations.type : '',
        org_city: p.organizations ? p.organizations.city : '',
        org_state: p.organizations ? p.organizations.state : '',
        org_county: p.organizations ? p.organizations.county : '',
      });
    });
    setPrograms(safeData);
    setProgramsTotalCount(safeData.length === PAGE_SIZE ? programsPage * PAGE_SIZE + 1 : offset + safeData.length);
  } catch (err) {
    console.error('Program discovery fetch error:', err);
    setProgramsError(err.message || 'Failed to load programs');
    toast.error('Failed to load programs');
  } finally {
    setProgramsLoading(false);
  }
}, [viewMode, programsPage, debouncedKeyword, filters, programStatus]);

  useEffect(function() { fetchEvents(); }, [fetchEvents]);
  useEffect(function() { fetchPrograms(); }, [fetchPrograms]);

  function handleFilterChange(key, value) {
    setFilters(function(prev) { var u = {}; u[key] = value; return Object.assign({}, prev, u); });
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setKeyword('');
    setSortBy('start_time');
    setProgramStatus('');
    if (searchRef.current) searchRef.current.focus();
  }

  function handleGuestRSVP(event) {
    setSelectedEvent(event);
    setGuestRSVPModal(true);
    setRsvpSuccess(false);
  }

  async function submitGuestRSVP(e) {
    e.preventDefault();
    setRsvpLoading(true);
    try {
      if (!guestInfo.name.trim() || !guestInfo.email.trim()) throw new Error('Please provide your name and email');
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestInfo.email)) throw new Error('Please enter a valid email address');
      var rsvpRes = await supabase.from('guest_rsvps').insert([{
        event_id: selectedEvent.id,
        guest_email: guestInfo.email.toLowerCase().trim(),
        guest_name: guestInfo.name.trim(),
        guest_phone: guestInfo.phone.trim() || null,
        status: guestInfo.status,
        guest_count: parseInt(guestInfo.guestCount) || 1,
      }]);
      if (rsvpRes.error) {
        if (rsvpRes.error.code === '23505') throw new Error("You have already RSVP'd to this event");
        throw rsvpRes.error;
      }
      setRsvpSuccess(true);
      setGuestInfo({ name: '', email: '', phone: '', status: 'interested', guestCount: 1 });
      toast.success('RSVP submitted successfully!');
      setTimeout(function() { setGuestRSVPModal(false); setRsvpSuccess(false); }, 3000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRsvpLoading(false);
    }
  }

  var isLoading = viewMode === 'events' ? loading : programsLoading;
  var currentError = viewMode === 'events' ? error : programsError;
  var currentTotal = viewMode === 'events' ? totalCount : programsTotalCount;
  var currentPage = viewMode === 'events' ? page : programsPage;
  var setCurrentPage = viewMode === 'events' ? setPage : setProgramsPage;
  var totalPages = Math.ceil(currentTotal / PAGE_SIZE);
  var isRTL = lang === 'ar';

  return (
    <>
      <Helmet>
        <title>Discover Local Events & Programs | Syndicade</title>
        <meta name="description" content="Find food drives, volunteer opportunities, community meetings, programs, and more near you." />
        <meta property="og:title" content="Discover Local Events & Programs | Syndicade" />
        <link rel="canonical" href="https://syndicade.com/discover" />
      </Helmet>

      <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }} dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Sticky Search Bar */}
        <div style={{ background: sectionBg, borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none', display: 'flex' }}>
                <SearchIcon />
              </span>
              <input
                ref={searchRef}
                type="search"
                value={keyword}
                onChange={function(e) { setKeyword(e.target.value); }}
                placeholder={viewMode === 'events' ? et(lang, 'searchPlaceholder') : 'Search programs, organizations...'}
                aria-label={viewMode === 'events' ? et(lang, 'searchPlaceholder') : 'Search programs'}
                style={{ width: '100%', paddingLeft: '36px', paddingRight: keyword ? '36px' : '16px', paddingTop: '8px', paddingBottom: '8px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none' }}
                className="focus:ring-2 focus:ring-blue-500"
              />
              {keyword && (
                <button
                  onClick={function() { setKeyword(''); }}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }}
                  aria-label="Clear search"
                  className="hover:text-white focus:outline-none"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
            <button
              onClick={function() { setMobileFiltersOpen(true); }}
              style={{ display: window.innerWidth >= 1024 ? 'none' : 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textSecondary, cursor: 'pointer', whiteSpace: 'nowrap' }}
              className="lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open filters"
              aria-expanded={mobileFiltersOpen}
            >
              <FilterIcon />
              {et(lang, 'filtersHeading')}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block" style={{ width: '256px', flexShrink: 0 }}>
              <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', position: 'sticky', top: '80px' }}>
                <EventDiscoveryFilters
                  lang={lang}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={et(lang, 'filtersHeading')}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={function() { setMobileFiltersOpen(false); }} aria-hidden="true" />
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '320px', maxWidth: '100%', background: cardBg, boxShadow: '4px 0 24px rgba(0,0,0,0.4)', overflowY: 'auto', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>{et(lang, 'filtersHeading')}</h2>
                    <button
                      onClick={function() { setMobileFiltersOpen(false); }}
                      style={{ padding: '6px', borderRadius: '8px', color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label="Close filters"
                      className="hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <XIcon size={18} />
                    </button>
                  </div>
                  <EventDiscoveryFilters
                    lang={lang}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleReset}
                    isDark={isDark}
                  />
                  <button
                    onClick={function() { setMobileFiltersOpen(false); }}
                    style={{ marginTop: '24px', width: '100%', padding: '10px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {et(lang, 'results')}
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <main style={{ flex: 1, minWidth: 0 }} aria-label="Discovery results">

              <div style={{ marginBottom: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary }}>{et(lang, 'pageTitle')}</h1>
                <p style={{ color: textMuted, fontSize: '14px', marginTop: '4px' }}>{et(lang, 'pageSubtitle')}</p>
              </div>

              {/* Events / Programs toggle */}
              <div style={{ display: 'inline-flex', background: sectionBg, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '3px', marginBottom: '20px' }} role="tablist" aria-label="View mode">
                <button
                  role="tab"
                  aria-selected={viewMode === 'events'}
                  onClick={function() { setViewMode('events'); }}
                  style={{
                    padding: '7px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: viewMode === 'events' ? '#3B82F6' : 'transparent',
                    color: viewMode === 'events' ? '#FFFFFF' : textMuted,
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Events
                </button>
                <button
                  role="tab"
                  aria-selected={viewMode === 'programs'}
                  onClick={function() { setViewMode('programs'); }}
                  style={{
                    padding: '7px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: viewMode === 'programs' ? '#8B5CF6' : 'transparent',
                    color: viewMode === 'programs' ? '#FFFFFF' : textMuted,
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Programs
                </button>
              </div>

              {/* Results bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <p style={{ fontSize: '14px', color: textMuted }} aria-live="polite" aria-atomic="true">
                  {!isLoading && !currentError && (currentTotal + ' ' + et(lang, 'results'))}
                </p>
                {viewMode === 'events' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="event-sort-select" style={{ fontSize: '14px', color: textSecondary, whiteSpace: 'nowrap' }}>{et(lang, 'sortBy')}:</label>
                    <select
                      id="event-sort-select"
                      value={sortBy}
                      onChange={function(e) { setSortBy(e.target.value); }}
                      style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '8px', padding: '6px 12px', fontSize: '14px', color: textPrimary, outline: 'none' }}
                      className="focus:ring-2 focus:ring-blue-500"
                    >
                      {SORT_OPTIONS.map(function(opt) {
                        return <option key={opt.value} value={opt.value}>{et(lang, opt.labelKey)}</option>;
                      })}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label htmlFor="program-status-select" style={{ fontSize: '14px', color: textSecondary, whiteSpace: 'nowrap' }}>Status:</label>
                    <select
                      id="program-status-select"
                      value={programStatus}
                      onChange={function(e) { setProgramStatus(e.target.value); }}
                      style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '8px', padding: '6px 12px', fontSize: '14px', color: textPrimary, outline: 'none' }}
                      className="focus:ring-2 focus:ring-purple-500"
                    >
                      {PROGRAM_STATUS_OPTIONS.map(function(opt) {
                        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Skeletons */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label={'Loading ' + viewMode}>
                  {[1,2,3,4,5,6].map(function(i) {
                    return viewMode === 'events'
                      ? <EventCardSkeleton key={i} isDark={isDark} />
                      : <ProgramCardSkeleton key={i} isDark={isDark} />;
                  })}
                </div>
              )}

              {/* Error */}
              {!isLoading && currentError && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
                  <span style={{ color: '#EF4444', marginBottom: '16px' }}><AlertCircleIcon /></span>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>{et(lang, 'errorTitle')}</h2>
                  <p style={{ color: textMuted, fontSize: '14px', marginBottom: '24px', maxWidth: '360px' }}>{et(lang, 'errorDesc')}</p>
                  <button
                    onClick={viewMode === 'events' ? fetchEvents : fetchPrograms}
                    style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {et(lang, 'tryAgain')}
                  </button>
                </div>
              )}

              {/* Empty — events */}
              {!isLoading && !currentError && viewMode === 'events' && events.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
                  <span style={{ color: textMuted, marginBottom: '16px' }}><CalendarXIcon /></span>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>{et(lang, 'noResults')}</h2>
                  <p style={{ color: textMuted, fontSize: '14px', marginBottom: '24px', maxWidth: '360px' }}>{et(lang, 'noResultsDesc')}</p>
                  <button onClick={handleReset} style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {et(lang, 'resetFilters')}
                  </button>
                </div>
              )}

              {/* Empty — programs */}
              {!isLoading && !currentError && viewMode === 'programs' && programs.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
                  <span style={{ color: textMuted, marginBottom: '16px' }}><ProgramsEmptyIcon /></span>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>No programs found</h2>
                  <p style={{ color: textMuted, fontSize: '14px', marginBottom: '24px', maxWidth: '360px' }}>Try adjusting your search or filters. Organizations can add programs from their dashboard.</p>
                  <button onClick={handleReset} style={{ padding: '10px 20px', background: '#8B5CF6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {et(lang, 'resetFilters')}
                  </button>
                </div>
              )}

              {/* Events grid */}
              {!isLoading && !currentError && viewMode === 'events' && events.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map(function(event) {
                      return (
                        <EventDiscoveryCard
                          key={event.id}
                          event={event}
                          lang={lang}
                          session={session}
                          initialSaved={savedEvents.has(event.id)}
                          onRSVP={handleGuestRSVP}
                          adminOrgs={adminOrgs}
                        />
                      );
                    })}
                  </div>
                  <p style={{ padding: '4px 0 16px', fontSize: '12px', color: textMuted }}>
                    Featured events are promoted by their organizations for 7 days.
                  </p>
                </>
              )}

              {/* Programs grid */}
              {!isLoading && !currentError && viewMode === 'programs' && programs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {programs.filter(function(p) { return p && p.id; }).map(function(program) {
                    return (
                      <ProgramDiscoveryCard
                        key={program.id}
                        program={program}
                        session={session}
                        isDark={isDark}
                        initialSaved={savedPrograms.has(program.id)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && !currentError && totalPages > 1 && (
                <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }} aria-label="Pagination">
                  <button
                    onClick={function() { setCurrentPage(function(p) { return Math.max(1, p - 1); }); }}
                    disabled={currentPage === 1}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', fontSize: '14px', border: '1px solid ' + borderColor, borderRadius: '8px', color: textSecondary, background: cardBg, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
                    aria-label={et(lang, 'previous')}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ChevronLeftIcon />
                    {et(lang, 'previous')}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {Array.from({ length: Math.min(5, totalPages) }, function(_, i) {
                      var pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      var isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={function() { setCurrentPage(pageNum); }}
                          style={{ width: '36px', height: '36px', fontSize: '14px', fontWeight: isActive ? 700 : 500, borderRadius: '8px', border: isActive ? 'none' : ('1px solid ' + borderColor), background: isActive ? (viewMode === 'programs' ? '#8B5CF6' : '#3B82F6') : cardBg, color: isActive ? '#FFFFFF' : textSecondary, cursor: 'pointer' }}
                          aria-label={(et(lang, 'page') + ' ' + pageNum)}
                          aria-current={isActive ? 'page' : undefined}
                          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={function() { setCurrentPage(function(p) { return Math.min(totalPages, p + 1); }); }}
                    disabled={currentPage === totalPages}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', fontSize: '14px', border: '1px solid ' + borderColor, borderRadius: '8px', color: textSecondary, background: cardBg, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}
                    aria-label={et(lang, 'next')}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {et(lang, 'next')}
                    <ChevronRightIcon />
                  </button>
                </nav>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Guest RSVP Modal */}
      {guestRSVPModal && selectedEvent && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
          onClick={function() { if (!rsvpSuccess) setGuestRSVPModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rsvp-modal-title"
        >
          <div
            style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxWidth: '448px', width: '100%' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            <div style={{ borderBottom: '1px solid ' + borderColor, padding: '16px 24px' }}>
              <h2 id="rsvp-modal-title" style={{ fontSize: '20px', fontWeight: 800, color: textPrimary }}>RSVP to Event</h2>
              <p style={{ color: textMuted, fontSize: '14px', marginTop: '4px' }}>{selectedEvent.title}</p>
            </div>
            {rsvpSuccess ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>You're All Set!</h3>
                <p style={{ color: textMuted, fontSize: '14px' }}>We've received your RSVP.</p>
              </div>
            ) : (
              <form onSubmit={submitGuestRSVP} style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { id: 'guest-name', label: 'Your Name', type: 'text', required: true, value: guestInfo.name, key: 'name', placeholder: 'Jane Doe' },
                    { id: 'guest-email', label: 'Your Email', type: 'email', required: true, value: guestInfo.email, key: 'email', placeholder: 'jane@example.com' },
                    { id: 'guest-phone', label: 'Phone (Optional)', type: 'tel', required: false, value: guestInfo.phone, key: 'phone', placeholder: '(555) 123-4567' },
                  ].map(function(f) {
                    return (
                      <div key={f.id}>
                        <label htmlFor={f.id} style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>
                          {f.label}{f.required && <span style={{ color: '#EF4444' }} aria-hidden="true"> *</span>}
                        </label>
                        <input
                          id={f.id}
                          type={f.type}
                          required={f.required}
                          value={f.value}
                          placeholder={f.placeholder}
                          onChange={function(e) { var u = {}; u[f.key] = e.target.value; setGuestInfo(function(p) { return Object.assign({}, p, u); }); }}
                          style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                          className="focus:ring-2 focus:ring-blue-500"
                          aria-required={f.required}
                        />
                      </div>
                    );
                  })}
                  <div>
                    <label htmlFor="guest-status" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>RSVP Status</label>
                    <select id="guest-status" value={guestInfo.status} onChange={function(e) { setGuestInfo(function(p) { return Object.assign({}, p, { status: e.target.value }); }); }} style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none' }} className="focus:ring-2 focus:ring-blue-500">
                      <option value="interested">Interested</option>
                      <option value="going">Going</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="guest-count" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>Number of Guests</label>
                    <input id="guest-count" type="number" min="1" max="10" value={guestInfo.guestCount} onChange={function(e) { setGuestInfo(function(p) { return Object.assign({}, p, { guestCount: e.target.value }); }); }} style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }} className="focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', marginTop: '16px', borderTop: '1px solid ' + borderColor }}>
                  <button type="button" onClick={function() { setGuestRSVPModal(false); }} disabled={rsvpLoading} style={{ padding: '8px 16px', border: '1px solid ' + borderColor, color: textSecondary, fontSize: '14px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: 'pointer' }} className="hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">Cancel</button>
                  <button type="submit" disabled={rsvpLoading} style={{ padding: '8px 16px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: rsvpLoading ? 'not-allowed' : 'pointer', opacity: rsvpLoading ? 0.6 : 1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {rsvpLoading ? 'Submitting...' : 'Submit RSVP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}