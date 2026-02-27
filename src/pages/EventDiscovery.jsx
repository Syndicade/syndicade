import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, CalendarX, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { et } from '../lib/eventDiscoveryTranslations';
import EventDiscoveryCard from '../components/EventDiscoveryCard';
import EventDiscoveryFilters from '../components/EventDiscoveryFilters';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'start_time', labelKey: 'soonest' },
  { value: 'ending_soon', labelKey: 'endingSoon' },
  { value: 'recently_added', labelKey: 'recentlyAdded' },
];

const DEFAULT_FILTERS = {
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

function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 animate-pulse" aria-hidden="true">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="flex gap-1">
          <div className="w-7 h-7 bg-gray-100 rounded-lg" />
          <div className="w-7 h-7 bg-gray-100 rounded-lg" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-4/5" />
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-7 w-24 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function EventDiscovery() {
  const [session, setSession] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [sortBy, setSortBy] = useState('start_time');
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [savedEvents, setSavedEvents] = useState(new Set());

  // Guest RSVP modal state (preserved from original)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [guestRSVPModal, setGuestRSVPModal] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '', status: 'interested', guestCount: 1 });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  const searchRef = useRef(null);
  const lang = filters.uiLang || 'en';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('event_saves')
      .select('event_id')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        if (data) setSavedEvents(new Set(data.map((r) => r.event_id)));
      });
  }, [session]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => { setPage(1); }, [debouncedKeyword, filters, sortBy]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const { data, error: rpcError } = await supabase.rpc('get_public_events', {
        search_keyword: debouncedKeyword || null,
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
      if (rpcError) throw rpcError;
      setEvents(data || []);
      setTotalCount(data?.length === PAGE_SIZE ? page * PAGE_SIZE + 1 : offset + (data?.length || 0));
    } catch (err) {
      console.error('Event discovery fetch error:', err);
      setError(err.message || 'Failed to load events');
      toast.error(et(lang, 'errorDesc'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedKeyword, filters, sortBy, lang]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

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
    setSortBy('start_time');
    searchRef.current?.focus();
  }

  // Guest RSVP handlers (preserved from original)
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestInfo.email)) throw new Error('Please enter a valid email address');
      const { error: rsvpError } = await supabase
        .from('guest_rsvps')
        .insert([{
          event_id: selectedEvent.id,
          guest_email: guestInfo.email.toLowerCase().trim(),
          guest_name: guestInfo.name.trim(),
          guest_phone: guestInfo.phone.trim() || null,
          status: guestInfo.status,
          guest_count: parseInt(guestInfo.guestCount) || 1,
        }]);
      if (rsvpError) {
        if (rsvpError.code === '23505') throw new Error('You have already RSVP\'d to this event');
        throw rsvpError;
      }
      setRsvpSuccess(true);
      setGuestInfo({ name: '', email: '', phone: '', status: 'interested', guestCount: 1 });
      toast.success('RSVP submitted successfully!');
      setTimeout(() => { setGuestRSVPModal(false); setRsvpSuccess(false); }, 3000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRsvpLoading(false);
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isRTL = lang === 'ar';

  return (
    <>
      <Helmet>
        <title>Discover Local Events | Syndicade</title>
        <meta name="description" content="Find food drives, volunteer opportunities, community meetings, and more near you." />
        <meta property="og:title" content="Discover Local Events | Syndicade" />
        <link rel="canonical" href="https://syndicade.com/discover" />
      </Helmet>

      <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Top Search Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={et(lang, 'searchPlaceholder')}
                aria-label={et(lang, 'searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              {keyword && (
                <button onClick={() => setKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Clear search">
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open filters"
              aria-expanded={mobileFiltersOpen}
            >
              <SlidersHorizontal size={15} aria-hidden="true" />
              {et(lang, 'filtersHeading')}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">

            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
                <EventDiscoveryFilters
                  lang={lang}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                />
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={et(lang, 'filtersHeading')}>
                <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} aria-hidden="true" />
                <div className="absolute left-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">{et(lang, 'filtersHeading')}</h2>
                    <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close filters">
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <EventDiscoveryFilters
                    lang={lang}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleReset}
                  />
                  <button onClick={() => setMobileFiltersOpen(false)} className="mt-6 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {et(lang, 'results')}
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <main className="flex-1 min-w-0" aria-label="Event results">
              <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">{et(lang, 'pageTitle')}</h1>
                <p className="text-gray-500 text-sm mt-1">{et(lang, 'pageSubtitle')}</p>
              </div>

              {/* Results Bar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <p className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
                  {!loading && !error && <>{totalCount} {et(lang, 'results')}</>}
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="event-sort-select" className="text-sm text-gray-600 whitespace-nowrap">
                    {et(lang, 'sortBy')}:
                  </label>
                  <select
                    id="event-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{et(lang, opt.labelKey)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skeletons */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Loading events">
                  {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <AlertCircle size={48} className="text-red-400 mb-4" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{et(lang, 'errorTitle')}</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm">{et(lang, 'errorDesc')}</p>
                  <button onClick={fetchEvents} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {et(lang, 'tryAgain')}
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && events.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <CalendarX size={48} className="text-gray-300 mb-4" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{et(lang, 'noResults')}</h2>
                  <p className="text-gray-500 text-sm mb-6 max-w-sm">{et(lang, 'noResultsDesc')}</p>
                  <button onClick={handleReset} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {et(lang, 'resetFilters')}
                  </button>
                </div>
              )}

              {/* Event Grid */}
              {!loading && !error && events.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                      <EventDiscoveryCard
                        key={event.id}
                        event={event}
                        lang={lang}
                        session={session}
                        initialSaved={savedEvents.has(event.id)}
                        onRSVP={handleGuestRSVP}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={et(lang, 'previous')}
                      >
                        <ChevronLeft size={15} aria-hidden="true" />
                        {et(lang, 'previous')}
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (page <= 3) pageNum = i + 1;
                          else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = page - 2 + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-9 h-9 text-sm rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${pageNum === page ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                              aria-label={`${et(lang, 'page')} ${pageNum}`}
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
                        aria-label={et(lang, 'next')}
                      >
                        {et(lang, 'next')}
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

      {/* Guest RSVP Modal */}
      {guestRSVPModal && selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => !rsvpSuccess && setGuestRSVPModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rsvp-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 id="rsvp-modal-title" className="text-xl font-bold text-gray-900">RSVP to Event</h2>
              <p className="text-gray-600 text-sm mt-1">{selectedEvent.title}</p>
            </div>

            {rsvpSuccess ? (
              <div className="px-6 py-10 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">You're All Set!</h3>
                <p className="text-gray-600 text-sm">We've received your RSVP.</p>
              </div>
            ) : (
              <form onSubmit={submitGuestRSVP} className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="guest-name" className="block text-sm font-semibold text-gray-900 mb-1.5">Your Name *</label>
                  <input id="guest-name" type="text" required value={guestInfo.name} onChange={(e) => setGuestInfo(p => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="guest-email" className="block text-sm font-semibold text-gray-900 mb-1.5">Your Email *</label>
                  <input id="guest-email" type="email" required value={guestInfo.email} onChange={(e) => setGuestInfo(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="guest-phone" className="block text-sm font-semibold text-gray-900 mb-1.5">Phone (Optional)</label>
                  <input id="guest-phone" type="tel" value={guestInfo.phone} onChange={(e) => setGuestInfo(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="guest-status" className="block text-sm font-semibold text-gray-900 mb-1.5">RSVP Status</label>
                  <select id="guest-status" value={guestInfo.status} onChange={(e) => setGuestInfo(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="interested">Interested</option>
                    <option value="going">Going</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="guest-count" className="block text-sm font-semibold text-gray-900 mb-1.5">Number of Guests</label>
                  <input id="guest-count" type="number" min="1" max="10" value={guestInfo.guestCount} onChange={(e) => setGuestInfo(p => ({ ...p, guestCount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                  <button type="button" onClick={() => setGuestRSVPModal(false)} disabled={rsvpLoading} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancel
                  </button>
                  <button type="submit" disabled={rsvpLoading} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
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