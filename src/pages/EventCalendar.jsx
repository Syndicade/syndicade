import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function EventCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Organization colors for visual distinction
  const orgColors = {
    0: '#3b82f6', // blue
    1: '#10b981', // green
    2: '#f59e0b', // amber
    3: '#ef4444', // red
    4: '#8b5cf6', // purple
    5: '#ec4899', // pink
    6: '#14b8a6', // teal
    7: '#f97316', // orange
  };

  useEffect(() => {
    fetchOrganizationsAndEvents();
  }, []);

  const fetchOrganizationsAndEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch user's organizations
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          organization_id,
          organizations (
            id,
            name
          )
        `)
        .eq('member_id', user.id)
        .eq('status', 'active');

      if (membershipsError) throw membershipsError;

      const userOrgs = memberships?.map(m => ({
        id: m.organizations.id,
        name: m.organizations.name
      })) || [];

      setOrganizations(userOrgs);

      // Fetch events from all user's organizations
      const orgIds = userOrgs.map(org => org.id);
      
      if (orgIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Fetch events with recurring fields and event_type
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          location,
          is_virtual,
          virtual_link,
          visibility,
          organization_id,
          is_recurring,
          parent_event_id,
          recurrence_rule,
          organizations (
            name
          )
        `)
        .in('organization_id', orgIds)
        .in('visibility', ['public', 'members'])
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      setEvents(eventsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine event type
  const getEventType = (event) => {
    // Check if it's a hybrid event (has both location and virtual_link)
    if (event.is_virtual && event.location && event.location !== 'Virtual Event') {
      return 'hybrid';
    }
    // Virtual only
    if (event.is_virtual || event.location === 'Virtual Event') {
      return 'virtual';
    }
    // In-person
    return 'in-person';
  };

  // Transform events for calendar display
  const calendarEvents = useMemo(() => {
    let filteredEvents = events;

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

    // Filter by selected organization
    if (selectedOrg !== 'all') {
      filteredEvents = filteredEvents.filter(e => e.organization_id === selectedOrg);
    }

    return filteredEvents.map((event, index) => {
      // Assign color based on organization
      const orgIndex = organizations.findIndex(org => org.id === event.organization_id);
      const color = orgColors[orgIndex % Object.keys(orgColors).length];

      const eventType = getEventType(event);

      // Build title with icons
      let iconPrefix = '';
      
      // Add recurring icon
      if (event.is_recurring && event.parent_event_id) {
        iconPrefix += '🔄 '; // Recurring instance
      } else if (event.is_recurring && !event.parent_event_id) {
        iconPrefix += '🔄 '; // Recurring series (parent)
      }

      // Add event type icon
      if (eventType === 'virtual') {
        iconPrefix += '💻 ';
      } else if (eventType === 'hybrid') {
        iconPrefix += '🌐 ';
      } else {
        iconPrefix += '📍 ';
      }

      return {
        id: event.id,
        title: `${iconPrefix}${event.title}`,
        start: new Date(event.start_time),
        end: event.end_time ? new Date(event.end_time) : new Date(event.start_time),
        resource: {
          organizationId: event.organization_id,
          organizationName: event.organizations?.name,
          location: event.location,
          isVirtual: event.is_virtual,
          visibility: event.visibility,
          color: color,
          isRecurring: event.is_recurring,
          parentEventId: event.parent_event_id,
          recurrenceRule: event.recurrence_rule,
          eventType: eventType
        }
      };
    });
  }, [events, selectedOrg, organizations]);

  // Event style getter - simpler now, just organization colors
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: `2px solid ${event.resource.color}`,
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        padding: '2px 5px'
      }
    };
  };

  // Handle event click
  const handleSelectEvent = (event) => {
    navigate(`/events/${event.id}`);
  };

  // Handle slot selection (create new event)
  const handleSelectSlot = (slotInfo) => {
    // Could open create event modal here
    console.log('Selected slot:', slotInfo);
  };

  // Custom toolbar with filters
  const CustomToolbar = (toolbar) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = toolbar.date;
      return (
        <span className="text-lg font-bold text-gray-900">
          {format(date, 'MMMM yyyy')}
        </span>
      );
    };

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        {/* Navigation and Date */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm font-medium"
            aria-label="Go to today"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToBack}
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {label()}
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              aria-label="Next month"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Toggle and Org Filter */}
        <div className="flex items-center gap-3">
          {/* View Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Month view"
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Week view"
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Day view"
            >
              Day
            </button>
          </div>

          {/* Organization Filter */}
          {organizations.length > 1 && (
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
              aria-label="Filter by organization"
            >
              <option value="all">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div 
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
            role="status"
            aria-label="Loading calendar"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-gray-600 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md" role="alert">
          <h2 className="text-red-800 font-bold text-lg mb-2">Error Loading Calendar</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchOrganizationsAndEvents}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="Event Calendar"
          subtitle="View and manage events from all your organizations"
          icon="📅"
          backTo="/organizations"
          backLabel="My Organizations"
          actions={
            <div className="flex items-center gap-3">
              <Link 
                to="/events"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium inline-flex items-center gap-2"
              >
                <span>📋</span>
                List View
              </Link>
              <Link 
                to="/calendar"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium inline-flex items-center gap-2"
              >
                <span>📅</span>
                Calendar View
              </Link>
            </div>
          }
        />

        {/* Calendar Container */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Events Yet
              </h3>
              <p className="text-gray-600 mb-6">
                {organizations.length === 0
                  ? "You're not a member of any organizations yet."
                  : "Your organizations haven't created any events yet."}
              </p>
              {organizations.length > 0 && (
                <button
                  onClick={() => navigate('/organizations')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all inline-flex items-center gap-2"
                >
                  <span>View Organizations</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div style={{ height: '700px' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                components={{
                  toolbar: CustomToolbar
                }}
                popup
                tooltipAccessor={(event) => {
                  return `${event.title} - ${event.resource.organizationName}`;
                }}
                style={{ height: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Icon Legend */}
        {events.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Event Icons</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <span className="text-sm text-gray-700">Recurring Event</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <span className="text-sm text-gray-700">In-Person</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💻</span>
                <span className="text-sm text-gray-700">Virtual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <span className="text-sm text-gray-700">Hybrid</span>
              </div>
            </div>
          </div>
        )}

        {/* Organization Legend */}
        {organizations.length > 0 && events.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Organizations</h3>
            <div className="flex flex-wrap gap-3">
              {organizations.map((org, index) => {
                const color = orgColors[index % Object.keys(orgColors).length];
                const eventCount = events.filter(e => e.organization_id === org.id).length;
                return (
                  <div
                    key={org.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    ></div>
                    <span className="text-sm text-gray-700 font-medium">
                      {org.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({eventCount} {eventCount === 1 ? 'event' : 'events'})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventCalendar;