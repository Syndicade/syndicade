import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EventCard from '../components/EventCard';

function EventList() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    async function fetchEventsAndOrganizations() {
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          setError('You must be logged in to view events');
          setLoading(false);
          return;
        }

        const { data: memberships, error: membershipError } = await supabase
          .from('memberships')
          .select('organization_id, organizations(id, name)')
          .eq('member_id', user.id)
          .eq('status', 'active');

        if (membershipError) throw membershipError;

        const userOrgs = memberships.map(m => m.organizations);
        setOrganizations(userOrgs);

        const orgIds = userOrgs.map(org => org.id);

        if (orgIds.length === 0) {
          setEvents([]);
          setFilteredEvents([]);
          setLoading(false);
          return;
        }

        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*, organizations(name)')
          .or(`organization_id.in.(${orgIds.join(',')}),visibility.eq.public`)
          .order('start_time', { ascending: true });

        if (eventsError) throw eventsError;

        setEvents(eventsData || []);
        setFilteredEvents(eventsData || []);

      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEventsAndOrganizations();
  }, []);

  useEffect(() => {
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedOrg !== 'all') {
      filtered = filtered.filter(event => event.organization_id === selectedOrg);
    }

    const now = new Date();
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.start_time) >= now);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(event => new Date(event.start_time) < now);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.start_time);
      const dateB = new Date(b.start_time);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredEvents(filtered);
  }, [searchTerm, selectedOrg, dateFilter, sortOrder, events]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"
            role="status"
            aria-label="Loading events"
          >
            <span className="sr-only">Loading events...</span>
          </div>
          <p className="mt-4 text-gray-600 font-semibold">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full" role="alert">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-red-800">Error Loading Events</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
              <p className="text-gray-600 mt-1">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link 
                to="/events"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium inline-flex items-center gap-2"
              >
                <span>📋</span>
                List View
              </Link>
              <Link 
                to="/calendar"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium inline-flex items-center gap-2"
              >
                <span>📅</span>
                Calendar View
              </Link>
            </div>

            <Link 
              to="/discover"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all font-semibold inline-flex items-center gap-2 shadow-md"
            >
              <span>🌍</span>
              Discover Public Events
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-1">
                Search Events
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search events by name or description"
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 mb-1">
                Organization
              </label>
              <select
                id="organization"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter events by organization"
              >
                <option value="all">All Organizations</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date-filter" className="block text-sm font-semibold text-gray-700 mb-1">
                Time Period
              </label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter events by time period"
              >
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
                <option value="all">All Events</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort-order" className="block text-sm font-semibold text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Sort events by date"
              >
                <option value="asc">Date (Earliest First)</option>
                <option value="desc">Date (Latest First)</option>
              </select>
            </div>

          </div>

          {(searchTerm || selectedOrg !== 'all' || dateFilter !== 'upcoming') && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-blue-200 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Clear search filter"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedOrg !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Org: {organizations.find(o => o.id === selectedOrg)?.name}
                  <button
                    onClick={() => setSelectedOrg('all')}
                    className="hover:bg-blue-200 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Clear organization filter"
                  >
                    ×
                  </button>
                </span>
              )}

              {dateFilter !== 'upcoming' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {dateFilter === 'past' ? 'Past Events' : 'All Events'}
                  <button
                    onClick={() => setDateFilter('upcoming')}
                    className="hover:bg-blue-200 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Clear date filter"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedOrg('all');
                  setDateFilter('upcoming');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Events Found</h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedOrg !== 'all' || dateFilter !== 'upcoming'
                ? "Try adjusting your filters to see more events."
                : "No events available yet. Check back soon!"}
            </p>
            {(searchTerm || selectedOrg !== 'all' || dateFilter !== 'upcoming') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedOrg('all');
                  setDateFilter('upcoming');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                showOrganization={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventList;