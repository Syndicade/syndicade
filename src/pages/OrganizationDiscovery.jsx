import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Building2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { t } from '../lib/discoveryTranslations';
import OrgCard from '../components/OrgCard';
import DiscoveryFilters from '../components/DiscoveryFilters';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'name', labelKey: 'alphabetical' },
  { value: 'last_active', labelKey: 'lastActive' },
  { value: 'upcoming_events', labelKey: 'upcomingEventsSort' },
  { value: 'distance', labelKey: 'distance' },
];

const DEFAULT_FILTERS = {
  state: '',
  city: '',
  county: '',
  zip: '',
  radius: 25,
  categories: [],
  orgType: '',
  languagesServed: [],
  uiLang: 'en',
};

function OrgCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 animate-pulse" aria-hidden="true">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-4/5" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-1 border-t border-gray-100">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-7 w-28 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function OrganizationDiscovery() {
  const [session, setSession] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [orgs, setOrgs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [followedOrgs, setFollowedOrgs] = useState(new Set());
  const searchRef = useRef(null);
  const lang = filters.uiLang || 'en';

  // Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Load followed orgs for logged-in users
  useEffect(() => {
    if (!session) return;
    supabase
      .from('org_followers')
      .select('org_id')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        if (data) setFollowedOrgs(new Set(data.map((r) => r.org_id)));
      });
  }, [session]);

  // Debounce keyword
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Reset to page 1 on filter/keyword/sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, filters, sortBy]);

  // Fetch orgs
  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;

      // Use radius RPC if we have user location and distance sort
      if (userLocation && sortBy === 'distance') {
        const { data, error: rpcError } = await supabase.rpc('search_orgs_by_radius', {
          search_lat: userLocation.lat,
          search_lng: userLocation.lng,
          radius_miles: filters.radius,
          page_limit: PAGE_SIZE,
          page_offset: offset,
        });
        if (rpcError) throw rpcError;
        setOrgs(data || []);
        setTotalCount(data?.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : offset + (data?.length || 0));
      } else {
        const { data, error: rpcError } = await supabase.rpc('get_public_orgs', {
          search_keyword: debouncedKeyword || null,
          filter_state: filters.state || null,
          filter_city: filters.city || null,
          filter_county: filters.county || null,
          filter_zip: filters.zip || null,
          filter_categories: filters.categories.length > 0 ? filters.categories : null,
          filter_org_type: filters.orgType || null,
          filter_languages: filters.languagesServed.length > 0 ? filters.languagesServed : null,
          sort_by: sortBy,
          page_limit: PAGE_SIZE,
          page_offset: offset,
        });
        if (rpcError) throw rpcError;
        setOrgs(data || []);
        setTotalCount(data?.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : offset + (data?.length || 0));
      }
    } catch (err) {
      console.error('Discovery fetch error:', err);
      setError(err.message || 'Failed to load organizations');
      toast.error(t(lang, 'errorDesc'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedKeyword, filters, sortBy, userLocation, lang]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  function handleFilterChange(key, value) {
    if (key === 'uiLang') {
      setFilters((prev) => ({ ...prev, uiLang: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setKeyword('');
    setSortBy('name');
    setUserLocation(null);
    searchRef.current?.focus();
  }

  function handleRequestLocation() {
    if (!navigator.geolocation) {
      setLocationError(true);
      toast.error(t(lang, 'locationError'));
      return;
    }
    setLocationLoading(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('distance');
        setLocationLoading(false);
        toast.success('Location detected');
      },
      () => {
        setLocationError(true);
        setLocationLoading(false);
        toast.error(t(lang, 'locationError'));
      }
    );
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isRTL = lang === 'ar';

  return (
    <>
      <Helmet>
        <title>Discover Local Organizations | Syndicade</title>
        <meta name="description" content="Explore nonprofits and community groups in your area. Filter by location, services, and language." />
        <meta property="og:title" content="Discover Local Organizations | Syndicade" />
        <meta property="og:description" content="Find nonprofits, community groups, and associations near you on Syndicade." />
        <link rel="canonical" href="https://syndicade.com/explore" />
      </Helmet>

      <div className={`min-h-screen bg-gray-50 ${isRTL ? 'dir-rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Top Search Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t(lang, 'searchPlaceholder')}
                aria-label={t(lang, 'searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              {keyword && (
                <button
                  onClick={() => setKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open filters"
              aria-expanded={mobileFiltersOpen}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              {t(lang, 'filtersHeading')}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">

            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
                <DiscoveryFilters
                  lang={lang}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                  onRequestLocation={handleRequestLocation}
                  locationLoading={locationLoading}
                  locationError={locationError}
                />
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t(lang, 'filtersHeading')}>
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute left-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">{t(lang, 'filtersHeading')}</h2>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Close filters"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <DiscoveryFilters
                    lang={lang}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleReset}
                    onRequestLocation={handleRequestLocation}
                    locationLoading={locationLoading}
                    locationError={locationError}
                  />
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="mt-6 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {t(lang, 'results')}
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <main className="flex-1 min-w-0" aria-label="Organization results">

              {/* Page Header */}
              <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">{t(lang, 'pageTitle')}</h1>
                <p className="text-gray-500 text-sm mt-1">{t(lang, 'pageSubtitle')}</p>
              </div>

              {/* Results Bar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
                  {!loading && !error && (
                    <>{totalCount} {t(lang, 'results')}</>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm text-gray-600 whitespace-nowrap">
                    {t(lang, 'sortBy')}:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(lang, opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading Skeletons */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Loading organizations">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <OrgCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertCircle size={48} className="text-red-400 mb-4" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{t(lang, 'errorTitle')}</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm">{t(lang, 'errorDesc')}</p>
                  <button
                    onClick={fetchOrgs}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {t(lang, 'tryAgain')}
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && orgs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Building2 size={48} className="text-gray-300 mb-4" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{t(lang, 'noResults')}</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm">{t(lang, 'noResultsDesc')}</p>
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {t(lang, 'resetFilters')}
                  </button>
                </div>
              )}

              {/* Org Grid */}
              {!loading && !error && orgs.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgs.map((org) => (
                      <OrgCard
                        key={org.id}
                        org={org}
                        lang={lang}
                        session={session}
                        initialFollowed={followedOrgs.has(org.id)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav
                      className="flex items-center justify-center gap-2 mt-8"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={t(lang, 'previous')}
                      >
                        <ChevronLeft size={15} aria-hidden="true" />
                        {t(lang, 'previous')}
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-9 h-9 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                pageNum === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                              aria-label={`${t(lang, 'page')} ${pageNum}`}
                              aria-current={pageNum === page ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={t(lang, 'next')}
                      >
                        {t(lang, 'next')}
                        <ChevronRight size={15} aria-hidden="true" />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}