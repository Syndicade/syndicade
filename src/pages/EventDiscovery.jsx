import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

function EventDiscovery() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(25);
  const [filters, setFilters] = useState({
    organizationType: 'all',
    dateRange: 'all'
  });
  const [viewMode, setViewMode] = useState('list');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [guestRSVPModal, setGuestRSVPModal] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'interested',
    guestCount: 1
  });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  const orgTypes = [
    { value: 'all', label: 'All Organizations' },
    { value: 'nonprofit', label: 'Nonprofits' },
    { value: 'club', label: 'Clubs' },
    { value: 'association', label: 'Associations' },
    { value: 'community', label: 'Community Groups' }
  ];

  const geocodeLocation = async (location) => {
    try {
      // Add USA to search query for better results
      const searchQuery = location.includes('USA') || location.includes('US') 
        ? location 
        : `${location}, USA`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      console.log('Geocoding search for:', searchQuery);

      if (!response.ok) {
        throw new Error('Location search failed');
      }

      const data = await response.json();
      console.log('Geocoding results:', data);
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }

      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(coords);
          fetchEvents(coords.latitude, coords.longitude, radius);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Unable to get your location. Please enter a city or ZIP code.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please enter a city or ZIP code.');
      setLoading(false);
    }
  };

  const fetchEvents = async (lat, lon, searchRadius) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching events near:', { lat, lon, radius: searchRadius });

      const { data, error: fetchError } = await supabase
        .rpc('search_public_events', {
          search_lat: lat,
          search_lon: lon,
          radius_miles: searchRadius,
          limit_results: 100
        });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

     console.log('Raw events from database:', data);
      console.log('Number of events found:', data?.length || 0);

      let filteredEvents = data || [];

      // Filter out parent events (they're just templates, not actual events)
      // Only show: instances (has parent_event_id) OR non-recurring events
      filteredEvents = filteredEvents.filter(event => {
        // If it's not recurring, show it
        if (!event.is_recurring) return true;
        // If it's recurring but has a parent_event_id, it's an instance - show it
        if (event.parent_event_id) return true;
        // If it's recurring with no parent_event_id, it's a parent template - hide it
        return false;
      });

      // Log before other filters
      console.log('Events after parent filter:', filteredEvents.length);
      console.log('Events before other filters:', filteredEvents.length);

      if (filters.organizationType !== 'all') {
        filteredEvents = filteredEvents.filter(
          event => event.organization_type === filters.organizationType
        );
        console.log('After org type filter:', filteredEvents.length);
      }

      if (filters.dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.start_time);
          return eventDate >= today && eventDate < tomorrow;
        });
        console.log('After today filter:', filteredEvents.length);
      } else if (filters.dateRange === 'week') {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.start_time);
          return eventDate >= today && eventDate <= nextWeek;
        });
        console.log('After week filter:', filteredEvents.length);
      } else if (filters.dateRange === 'month') {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.start_time);
          return eventDate >= today && eventDate <= nextMonth;
        });
        console.log('After month filter:', filteredEvents.length);
      }

      console.log('Final filtered events:', filteredEvents.length);
      setEvents(filteredEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    
    if (!searchLocation.trim()) {
      setError('Please enter a city or ZIP code');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('Searching for location:', searchLocation);
    const coords = await geocodeLocation(searchLocation);
    
    if (coords) {
      console.log('Found coordinates:', coords);
      setUserLocation(coords);
      fetchEvents(coords.latitude, coords.longitude, radius);
    } else {
      setError(`Could not find location "${searchLocation}". Try: "Toledo, OH" or "43623, OH"`);
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (userLocation) {
      fetchEvents(userLocation.latitude, userLocation.longitude, newRadius);
    }
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    if (userLocation) {
      fetchEvents(userLocation.latitude, userLocation.longitude, radius);
    }
  };

  const handleGuestRSVP = (event) => {
    setSelectedEvent(event);
    setGuestRSVPModal(true);
    setRsvpSuccess(false);
  };

  const submitGuestRSVP = async (e) => {
    e.preventDefault();
    setRsvpLoading(true);
    setError(null);

    try {
      if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
        throw new Error('Please provide your name and email');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestInfo.email)) {
        throw new Error('Please enter a valid email address');
      }

      const { error: rsvpError } = await supabase
        .from('guest_rsvps')
        .insert([{
          event_id: selectedEvent.id,
          guest_email: guestInfo.email.toLowerCase().trim(),
          guest_name: guestInfo.name.trim(),
          guest_phone: guestInfo.phone.trim() || null,
          status: guestInfo.status,
          guest_count: parseInt(guestInfo.guestCount) || 1
        }]);

      if (rsvpError) {
        if (rsvpError.code === '23505') {
          throw new Error('You have already RSVP\'d to this event');
        }
        throw rsvpError;
      }

      setRsvpSuccess(true);
      setGuestInfo({
        name: '',
        email: '',
        phone: '',
        status: 'interested',
        guestCount: 1
      });

      setTimeout(() => {
        setGuestRSVPModal(false);
        setRsvpSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('RSVP error:', err);
      setError(err.message);
    } finally {
      setRsvpLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">
            🗺️ Discover Community Events
          </h1>
          <p className="text-xl text-blue-100">
            Find and connect with local nonprofit events and community activities near you
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleLocationSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label 
                  htmlFor="location-search"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Search Location
                </label>
                <input
                  id="location-search"
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Enter city or ZIP code (e.g., Toledo, OH or 43604)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label 
                  htmlFor="radius-slider"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Radius: {radius} miles
                </label>
                <input
                  id="radius-slider"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  aria-label={`Search radius: ${radius} miles`}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 mi</span>
                  <span>100 mi</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                🔍 Search Events
              </button>

              <button
                type="button"
                onClick={getUserLocation}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
              >
                📍 Use My Location
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label htmlFor="org-type-filter" className="sr-only">
                  Filter by organization type
                </label>
                <select
                  id="org-type-filter"
                  value={filters.organizationType}
                  onChange={(e) => handleFilterChange('organizationType', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {orgTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date-filter" className="sr-only">
                  Filter by date range
                </label>
                <select
                  id="date-filter"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="List view"
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Map view"
                >
                  🗺️ Map
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div 
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            role="alert"
          >
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
              role="status"
              aria-label="Loading events"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-700">
                <span className="font-semibold">{events.length}</span> events found
              </p>
            </div>

            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No Events Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try expanding your search radius or changing your filters
                </p>
                <button
                  onClick={() => handleRadiusChange(radius + 25)}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Expand to {radius + 25} miles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <div 
                    key={event.id}
                    className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                          {event.distance_miles ? `${Math.round(event.distance_miles)} mi away` : 'Nearby'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {event.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-3">
                        by <span className="font-semibold">{event.organization_name}</span>
                      </p>

                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">📅</span>
                          <div>
                            <p className="font-semibold">
                              {new Date(event.start_time).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p>
                              {new Date(event.start_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-lg">{event.is_virtual ? '💻' : '📍'}</span>
                          <p>
                            {event.is_virtual ? 'Virtual Event' : (
                              <>
                                {event.location}
                                {event.city && event.state && (
                                  <span className="block text-gray-500">
                                    {event.city}, {event.state}
                                  </span>
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {event.description}
                        </p>
                      )}

                      <button
                        onClick={() => handleGuestRSVP(event)}
                        className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
                      >
                        ✨ I'm Interested
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Map View Coming Soon!
            </h3>
            <p className="text-gray-600 mb-4">
              We're working on an interactive map to show all events. For now, use the list view to browse events.
            </p>
            <button
              onClick={() => setViewMode('list')}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Switch to List View
            </button>
          </div>
        )}
      </div>

      {guestRSVPModal && selectedEvent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => !rsvpSuccess && setGuestRSVPModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rsvp-modal-title"
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 
                id="rsvp-modal-title"
                className="text-2xl font-bold text-gray-900"
              >
                RSVP to Event
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedEvent.title}
              </p>
            </div>

            {rsvpSuccess ? (
              <div className="px-6 py-8 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  You're All Set!
                </h3>
                <p className="text-gray-600">
                  We've sent a confirmation to your email with event details.
                </p>
              </div>
            ) : (
              <form onSubmit={submitGuestRSVP} className="px-6 py-4 space-y-4">
                <div>
                  <label 
                    htmlFor="guest-name"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Your Name *
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    required
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="guest-email"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Your Email *
                  </label>
                  <input
                    id="guest-email"
                    type="email"
                    required
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="guest-phone"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Phone Number (Optional)
                  </label>
                  <input
                    id="guest-phone"
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="guest-status"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    RSVP Status
                  </label>
                  <select
                    id="guest-status"
                    value={guestInfo.status}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="interested">Interested</option>
                    <option value="going">Going</option>
                  </select>
                </div>

                <div>
                  <label 
                    htmlFor="guest-count"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Number of Guests (Including You)
                  </label>
                  <input
                    id="guest-count"
                    type="number"
                    min="1"
                    max="10"
                    value={guestInfo.guestCount}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, guestCount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setGuestRSVPModal(false)}
                    disabled={rsvpLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rsvpLoading}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rsvpLoading ? 'Submitting...' : '✨ Submit RSVP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDiscovery;