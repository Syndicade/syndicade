import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronDown, Building2, AlertCircle, Tag, BadgeCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { t } from '../lib/discoveryTranslations';
import OrgCard from '../components/OrgCard';
import DiscoveryFilters from '../components/DiscoveryFilters';
import Header from '../components/Header';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

var PAGE_SIZE = 20;

var SORT_OPTIONS = [
  { value: 'name',            labelKey: 'alphabetical' },
  { value: 'last_active',     labelKey: 'lastActive' },
  { value: 'upcoming_events', labelKey: 'upcomingEventsSort' },
  { value: 'distance',        labelKey: 'distance' },
];

var DEFAULT_FILTERS = {
  state: '', city: '', county: '', zip: '',
  radius: 25, categories: [], orgType: '',
  languagesServed: [], tags: [], uiLang: 'en',
};

function OrgCardSkeleton({ isDark }) {
  var bg     = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';
  var bone   = isDark ? '#1E2845' : '#F1F5F9';
  return (
    <div style={{ background: bg, border: '1px solid ' + border, borderRadius: '12px', padding: '20px 16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }} aria-hidden="true">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: bone, flexShrink: 0 }} className="animate-pulse" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '14px', borderRadius: '6px', background: bone, width: '70%' }} className="animate-pulse" />
          <div style={{ height: '11px', borderRadius: '6px', background: bone, width: '45%' }} className="animate-pulse" />
        </div>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: bone }} className="animate-pulse" />
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ height: '20px', width: '72px', borderRadius: '99px', background: bone }} className="animate-pulse" />
        <div style={{ height: '20px', width: '60px', borderRadius: '99px', background: bone }} className="animate-pulse" />
        <div style={{ height: '20px', width: '80px', borderRadius: '99px', background: bone }} className="animate-pulse" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid ' + border }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ height: '11px', width: '100px', borderRadius: '6px', background: bone }} className="animate-pulse" />
          <div style={{ height: '11px', width: '80px', borderRadius: '6px', background: bone }} className="animate-pulse" />
        </div>
        <div style={{ height: '32px', width: '80px', borderRadius: '8px', background: bone }} className="animate-pulse" />
      </div>
    </div>
  );
}

export default function OrganizationDiscovery() {
  var { isDark } = useTheme();
  var [session, setSession] = useState(null);
  var [sessionLoading, setSessionLoading] = useState(true);
  var [filters, setFilters] = useState(DEFAULT_FILTERS);
  var [keyword, setKeyword] = useState('');
  var [debouncedKeyword, setDebouncedKeyword] = useState('');
  var [sortBy, setSortBy] = useState('name');
  var [verifiedOnly, setVerifiedOnly] = useState(true);
  var [orgs, setOrgs] = useState([]);
  var [totalCount, setTotalCount] = useState(0);
  var [page, setPage] = useState(1);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [userLocation, setUserLocation] = useState(null);
  var [locationLoading, setLocationLoading] = useState(false);
  var [locationError, setLocationError] = useState(false);
  var [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  var [followedOrgs, setFollowedOrgs] = useState(new Set());
  var searchRef = useRef(null);
  var lang = filters.uiLang || 'en';

  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var topBarBg      = isDark ? '#151B2D' : '#FFFFFF';
  var topBarBorder  = isDark ? '#2A3550' : '#E2E8F0';
  var searchBg      = isDark ? '#1A2035' : '#F1F5F9';
  var searchBorder  = isDark ? '#2A3550' : '#E2E8F0';
  var searchTxt     = isDark ? '#FFFFFF'  : '#0E1523';
  var searchIconClr = isDark ? '#64748B'  : '#94A3B8';
  var sidebarBg     = isDark ? '#1A2035' : '#FFFFFF';
  var sidebarBorder = isDark ? '#2A3550' : '#E2E8F0';
  var headingTxt    = isDark ? '#FFFFFF'  : '#0E1523';
  var subTxt        = isDark ? '#94A3B8'  : '#64748B';
  var sortBg        = isDark ? '#1A2035' : '#FFFFFF';
  var sortBorder    = isDark ? '#2A3550' : '#E2E8F0';
  var sortTxt       = isDark ? '#CBD5E1'  : '#374151';
  var chipBg        = isDark ? '#1E2845' : '#F1F5F9';
  var chipBorder    = isDark ? '#2A3550' : '#E2E8F0';
  var chipTxt       = isDark ? '#CBD5E1'  : '#374151';
  var pageBtnBg     = isDark ? '#1A2035' : '#FFFFFF';
  var pageBtnBorder = isDark ? '#2A3550' : '#E2E8F0';
  var pageBtnTxt    = isDark ? '#CBD5E1'  : '#374151';
  var emptyIconBg   = isDark ? '#1A2035' : '#F1F5F9';
  var emptyIconClr  = isDark ? '#2A3550' : '#CBD5E1';
  var toggleBg      = isDark ? '#151B2D' : '#F1F5F9';
  var toggleBorder  = isDark ? '#2A3550' : '#E2E8F0';

  useEffect(function () {
    supabase.auth.getSession().then(function (r) {
      setSession(r.data.session);
      setSessionLoading(false);
    });
    var sub = supabase.auth.onAuthStateChange(function (_e, s) { setSession(s); });
    return function () { sub.data.subscription.unsubscribe(); };
  }, []);

  useEffect(function () {
    if (!session) return;
    supabase.from('org_followers').select('org_id').eq('user_id', session.user.id)
      .then(function (r) {
        if (r.data) setFollowedOrgs(new Set(r.data.map(function (x) { return x.org_id; })));
      });
  }, [session]);

  useEffect(function () {
    var timer = setTimeout(function () { setDebouncedKeyword(keyword); }, 300);
    return function () { clearTimeout(timer); };
  }, [keyword]);

  useEffect(function () { setPage(1); }, [debouncedKeyword, filters, sortBy, verifiedOnly]);

  var fetchOrgs = useCallback(function () {
    setLoading(true);
    setError(null);
    var offset = (page - 1) * PAGE_SIZE;
    var searchKw   = debouncedKeyword || null;
    var filterTags = (filters.tags || []).length > 0 ? filters.tags : null;

    var run = async function () {
      try {
        if (userLocation && sortBy === 'distance') {
          var r = await supabase.rpc('search_orgs_by_radius', {
            search_lat: userLocation.lat, search_lng: userLocation.lng,
            radius_miles: filters.radius, page_limit: PAGE_SIZE, page_offset: offset,
          });
          if (r.error) throw r.error;
          setOrgs(r.data || []);
          setTotalCount(r.data && r.data.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : offset + ((r.data || []).length));
        } else {
          var r2 = await supabase.rpc('get_public_orgs', {
            search_keyword:       searchKw,
            filter_state:         filters.state || null,
            filter_city:          filters.city || null,
            filter_county:        filters.county || null,
            filter_zip:           filters.zip || null,
            filter_categories:    (filters.categories || []).length > 0 ? filters.categories : null,
            filter_org_type:      filters.orgType || null,
            filter_languages:     (filters.languagesServed || []).length > 0 ? filters.languagesServed : null,
            filter_tags:          filterTags,
            sort_by:              sortBy,
            page_limit:           PAGE_SIZE,
            page_offset:          offset,
            filter_verified_only: verifiedOnly,
          });
          if (r2.error) throw r2.error;
          setOrgs(r2.data || []);
          setTotalCount(r2.data && r2.data.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : offset + ((r2.data || []).length));
        }
      } catch (err) {
        console.error('Discovery fetch error:', err);
        setError(err.message || 'Failed to load organizations');
        toast.error(t(lang, 'errorDesc') || 'Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [page, debouncedKeyword, filters, sortBy, userLocation, lang, verifiedOnly]);

  useEffect(function () { fetchOrgs(); }, [fetchOrgs]);

  function handleFilterChange(key, value) {
    if (key === 'uiLang') { setFilters(function (p) { return Object.assign({}, p, { uiLang: value }); }); return; }
    setFilters(function (p) { return Object.assign({}, p, { [key]: value }); });
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS); setKeyword(''); setSortBy('name'); setUserLocation(null);
    if (searchRef.current) searchRef.current.focus();
  }

  function handleRequestLocation() {
    if (!navigator.geolocation) { setLocationError(true); toast.error(t(lang, 'locationError') || 'Location unavailable'); return; }
    setLocationLoading(true); setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      function (pos) { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSortBy('distance'); setLocationLoading(false); toast.success('Location detected'); },
      function () { setLocationError(true); setLocationLoading(false); toast.error(t(lang, 'locationError') || 'Could not get location'); }
    );
  }

  var activeChips = [];
  (filters.categories || []).forEach(function (c) { activeChips.push({ type: 'category', value: c, label: c.replace(/-/g, ' ') }); });
  if (filters.orgType) activeChips.push({ type: 'orgType', value: filters.orgType, label: filters.orgType.replace(/_/g, ' ') });
  (filters.languagesServed || []).forEach(function (l) { activeChips.push({ type: 'lang', value: l, label: l }); });
  (filters.tags || []).forEach(function (tag) { activeChips.push({ type: 'tag', value: tag, label: tag }); });
  if (filters.state) activeChips.push({ type: 'state', value: filters.state, label: 'State: ' + filters.state.toUpperCase() });
  if (filters.city)  activeChips.push({ type: 'city',  value: filters.city,  label: 'City: ' + filters.city });

  function removeChip(chip) {
    if (chip.type === 'category')  setFilters(function (p) { return Object.assign({}, p, { categories: p.categories.filter(function (c) { return c !== chip.value; }) }); });
    else if (chip.type === 'orgType')   setFilters(function (p) { return Object.assign({}, p, { orgType: '' }); });
    else if (chip.type === 'lang')  setFilters(function (p) { return Object.assign({}, p, { languagesServed: p.languagesServed.filter(function (l) { return l !== chip.value; }) }); });
    else if (chip.type === 'tag')   setFilters(function (p) { return Object.assign({}, p, { tags: p.tags.filter(function (t) { return t !== chip.value; }) }); });
    else if (chip.type === 'state') setFilters(function (p) { return Object.assign({}, p, { state: '' }); });
    else if (chip.type === 'city')  setFilters(function (p) { return Object.assign({}, p, { city: '' }); });
  }

  var totalPages = Math.ceil(totalCount / PAGE_SIZE);
  var isRTL = lang === 'ar';

  var pageContent = (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", transition: 'background 0.2s' }} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Sticky Search + Toggle Bar */}
      <div style={{ background: topBarBg, borderBottom: '1px solid ' + topBarBorder, position: 'sticky', top: session ? 0 : 64, zIndex: 30, transition: 'background 0.2s' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

          {/* Nonprofits / All toggle */}
          <div
            style={{ display: 'inline-flex', background: toggleBg, border: '1px solid ' + toggleBorder, borderRadius: '10px', padding: '3px', flexShrink: 0 }}
            role="group"
            aria-label="Organization type filter"
          >
            <button
              onClick={function () { setVerifiedOnly(true); }}
              aria-pressed={verifiedOnly}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: verifiedOnly ? '#22C55E' : 'transparent',
                color: verifiedOnly ? '#FFFFFF' : subTxt,
              }}
              className="focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <BadgeCheck size={13} aria-hidden="true" />
              Nonprofits
            </button>
            <button
              onClick={function () { setVerifiedOnly(false); }}
              aria-pressed={!verifiedOnly}
              style={{
                padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: !verifiedOnly ? '#3B82F6' : 'transparent',
                color: !verifiedOnly ? '#FFFFFF' : subTxt,
              }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              All Organizations
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={15} color={searchIconClr} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              type="search"
              value={keyword}
              onChange={function (e) { setKeyword(e.target.value); }}
              placeholder={t(lang, 'searchPlaceholder') || 'Search by name or description...'}
              aria-label={t(lang, 'searchPlaceholder') || 'Search organizations'}
              style={{ width: '100%', paddingLeft: '38px', paddingRight: keyword ? '36px' : '14px', paddingTop: '9px', paddingBottom: '9px', background: searchBg, border: '1px solid ' + searchBorder, borderRadius: '10px', fontSize: '13px', color: searchTxt, boxSizing: 'border-box', transition: 'background 0.2s' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {keyword && (
              <button onClick={function () { setKeyword(''); }} aria-label="Clear search" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: searchIconClr, display: 'flex', alignItems: 'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          <button onClick={function () { setMobileFiltersOpen(true); }} aria-label="Open filters" aria-expanded={mobileFiltersOpen} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: sidebarBg, border: '1px solid ' + sidebarBorder, borderRadius: '10px', fontSize: '13px', color: sortTxt, cursor: 'pointer', whiteSpace: 'nowrap' }} className="lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500">
            <SlidersHorizontal size={14} aria-hidden="true" />
            {t(lang, 'filtersHeading') || 'Filters'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block" style={{ width: '240px', flexShrink: 0 }}>
            <div style={{ background: sidebarBg, border: '1px solid ' + sidebarBorder, borderRadius: '12px', padding: '16px', position: 'sticky', top: '120px', transition: 'background 0.2s' }}>
              <DiscoveryFilters lang={lang} filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} onRequestLocation={handleRequestLocation} locationLoading={locationLoading} locationError={locationError} />
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={function () { setMobileFiltersOpen(false); }} aria-hidden="true" />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '300px', maxWidth: '100%', background: isDark ? '#151B2D' : '#FFFFFF', overflowY: 'auto', padding: '16px', boxShadow: '4px 0 24px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: headingTxt }}>Filters</h2>
                  <button onClick={function () { setMobileFiltersOpen(false); }} aria-label="Close filters" style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: subTxt, display: 'flex' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <DiscoveryFilters lang={lang} filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} onRequestLocation={handleRequestLocation} locationLoading={locationLoading} locationError={locationError} />
                <button onClick={function () { setMobileFiltersOpen(false); }} style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Show Results
                </button>
              </div>
            </div>
          )}

          {/* Main */}
          <main style={{ flex: 1, minWidth: 0 }} aria-label="Organization results">

            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: headingTxt, marginBottom: '4px' }}>
                {verifiedOnly ? 'Verified Nonprofits' : (t(lang, 'pageTitle') || 'Discover Local Organizations')}
              </h1>
              <p style={{ fontSize: '13px', color: subTxt }}>
                {verifiedOnly
                  ? 'Verified 501(c)(3) nonprofits in your community.'
                  : (t(lang, 'pageSubtitle') || 'Explore nonprofits and community groups in your area.')}
              </p>
            </div>

            {/* Active chips */}
            {activeChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }} role="list" aria-label="Active filters">
                {activeChips.map(function (chip) {
                  return (
                    <span key={chip.type + '-' + chip.value} role="listitem" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: chipBg, border: '1px solid ' + chipBorder, color: chipTxt, borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 600 }}>
                      {chip.type === 'tag' && <Tag size={9} color="#F5B731" aria-hidden="true" />}
                      {chip.label}
                      <button onClick={function () { removeChip(chip); }} aria-label={'Remove filter: ' + chip.label} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subTxt, display: 'flex', alignItems: 'center', padding: '0' }} className="focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full">
                        <X size={10} aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}
                <button onClick={handleReset} style={{ fontSize: '11px', fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  Clear all
                </button>
              </div>
            )}

            {/* Results + sort */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: subTxt }} aria-live="polite" aria-atomic="true">
                {!loading && !error && <>{totalCount} {t(lang, 'results') || 'results'}</>}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="sort-select" style={{ fontSize: '12px', color: subTxt, whiteSpace: 'nowrap' }}>{t(lang, 'sortBy') || 'Sort by'}:</label>
                <div style={{ position: 'relative' }}>
                  <select id="sort-select" value={sortBy} onChange={function (e) { setSortBy(e.target.value); }} style={{ background: sortBg, border: '1px solid ' + sortBorder, borderRadius: '8px', padding: '6px 28px 6px 10px', fontSize: '12px', color: sortTxt, appearance: 'none', cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {SORT_OPTIONS.map(function (opt) { return <option key={opt.value} value={opt.value}>{t(lang, opt.labelKey) || opt.labelKey}</option>; })}
                  </select>
                  <ChevronDown size={12} color={subTxt} aria-hidden="true" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            {/* Skeletons */}
            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }} aria-label="Loading organizations">
                {Array.from({ length: 6 }).map(function (_, i) { return <OrgCardSkeleton key={i} isDark={isDark} />; })}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
                <AlertCircle size={48} color="#EF4444" aria-hidden="true" style={{ marginBottom: '16px' }} />
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: headingTxt, marginBottom: '8px' }}>{t(lang, 'errorTitle') || 'Something went wrong'}</h2>
                <p style={{ fontSize: '13px', color: subTxt, marginBottom: '24px', maxWidth: '360px' }}>{t(lang, 'errorDesc') || 'Failed to load organizations.'}</p>
                <button onClick={fetchOrgs} style={{ padding: '10px 24px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }} className="hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{t(lang, 'tryAgain') || 'Try Again'}</button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && orgs.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: emptyIconBg, border: '1px solid ' + (isDark ? '#2A3550' : '#E2E8F0'), display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Building2 size={32} color={emptyIconClr} aria-hidden="true" />
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: headingTxt, marginBottom: '8px' }}>
                  {verifiedOnly ? 'No verified nonprofits found' : (t(lang, 'noResults') || 'No organizations found')}
                </h2>
                <p style={{ fontSize: '13px', color: subTxt, marginBottom: '24px', maxWidth: '360px' }}>
                  {verifiedOnly
                    ? 'Try adjusting your filters, or switch to All Organizations to see all groups.'
                    : (t(lang, 'noResultsDesc') || 'Try adjusting your filters or search terms.')}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {verifiedOnly && (
                    <button onClick={function () { setVerifiedOnly(false); }} style={{ padding: '10px 24px', background: '#22C55E', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                      Show All Organizations
                    </button>
                  )}
                  <button onClick={handleReset} style={{ padding: '10px 24px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }} className="hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{t(lang, 'resetFilters') || 'Reset Filters'}</button>
                </div>
              </div>
            )}

            {/* Grid */}
            {!loading && !error && orgs.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                  {orgs.map(function (org) {
                    return <OrgCard key={org.id} org={org} lang={lang} session={session} initialFollowed={followedOrgs.has(org.id)} />;
                  })}
                </div>

                {totalPages > 1 && (
                  <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }} aria-label="Pagination">
                    <button onClick={function () { setPage(function (p) { return Math.max(1, p - 1); }); }} disabled={page === 1} aria-label="Previous page" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', background: pageBtnBg, border: '1px solid ' + pageBtnBorder, borderRadius: '8px', fontSize: '12px', color: page === 1 ? (isDark ? '#2A3550' : '#CBD5E1') : pageBtnTxt, cursor: page === 1 ? 'not-allowed' : 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <ChevronLeft size={13} aria-hidden="true" />
                      {t(lang, 'previous') || 'Prev'}
                    </button>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {Array.from({ length: Math.min(5, totalPages) }, function (_, i) {
                        var pn = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                        return (
                          <button key={pn} onClick={function () { setPage(pn); }} aria-label={'Page ' + pn} aria-current={pn === page ? 'page' : undefined} style={{ width: '34px', height: '34px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid ' + (pn === page ? '#3B82F6' : pageBtnBorder), background: pn === page ? '#3B82F6' : pageBtnBg, color: pn === page ? '#FFFFFF' : pageBtnTxt, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {pn}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={function () { setPage(function (p) { return Math.min(totalPages, p + 1); }); }} disabled={page === totalPages} aria-label="Next page" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', background: pageBtnBg, border: '1px solid ' + pageBtnBorder, borderRadius: '8px', fontSize: '12px', color: page === totalPages ? (isDark ? '#2A3550' : '#CBD5E1') : pageBtnTxt, cursor: page === totalPages ? 'not-allowed' : 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {t(lang, 'next') || 'Next'}
                      <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );

 return (
  <>
    <Header />
    <main id="main-content">
      {pageContent}
    </main>
    <Footer />
  </>
);
}