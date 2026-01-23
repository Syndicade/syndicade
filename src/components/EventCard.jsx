import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * EventCard Component
 * 
 * Displays a summary card for an event with key information.
 * Used in event lists, dashboards, and search results.
 * 
 * Props:
 * - event: object - Event data from database
 * - showOrganization: boolean - Whether to display org name (default: false)
 * - compact: boolean - Smaller version for sidebars (default: false)
 * 
 * ADA Compliance:
 * - Semantic HTML with proper heading hierarchy
 * - ARIA labels for all interactive elements
 * - Keyboard accessible (can tab to link)
 * - Focus indicators visible
 * - Color contrast meets WCAG AA standards
 */
function EventCard({ event, showOrganization = false, compact = false }) {
  const [organization, setOrganization] = useState(null);
  const [rsvpCount, setRsvpCount] = useState({ going: 0, maybe: 0 });
  const [userRsvp, setUserRsvp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch organization details if showOrganization is true
  useEffect(() => {
    async function fetchEventDetails() {
      try {
        // Get organization if needed
        if (showOrganization && event.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', event.organization_id)
            .single();

          if (!orgError && orgData) {
            setOrganization(orgData);
          }
        }

        // Get RSVP counts
        const { data: rsvps, error: rsvpError } = await supabase
          .from('event_rsvps')
          .select('status, member_id')
          .eq('event_id', event.id);

        if (!rsvpError && rsvps) {
          const counts = {
            going: rsvps.filter(r => r.status === 'going').length,
            maybe: rsvps.filter(r => r.status === 'maybe').length
          };
          setRsvpCount(counts);

          // Check if current user has RSVP'd
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const userResponse = rsvps.find(r => r.member_id === user.id);
            if (userResponse) {
              setUserRsvp(userResponse.status);
            }
          }
        }

      } catch (err) {
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEventDetails();
  }, [event.id, event.organization_id, showOrganization]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get visibility badge
  const getVisibilityBadge = () => {
    const badges = {
      public: { text: '🌍 Public', color: 'bg-green-100 text-green-800' },
      members: { text: '👥 Members Only', color: 'bg-blue-100 text-blue-800' },
      groups: { text: '🔒 Groups Only', color: 'bg-purple-100 text-purple-800' },
      draft: { text: '📝 Draft', color: 'bg-gray-100 text-gray-800' }
    };
    return badges[event.visibility] || badges.members;
  };

  // Get RSVP status badge
  const getRsvpBadge = () => {
    if (!userRsvp) return null;
    
    const badges = {
      going: { text: '✓ Going', color: 'bg-green-100 text-green-800 border border-green-300' },
      maybe: { text: '? Maybe', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
      not_going: { text: '✗ Not Going', color: 'bg-red-100 text-red-800 border border-red-300' }
    };
    return badges[userRsvp];
  };

  const visibilityBadge = getVisibilityBadge();
  const rsvpBadge = getRsvpBadge();

  // Compact version for sidebars
  if (compact) {
    return (
      <Link
        to={`/events/${event.id}`}
        className="block bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`View details for ${event.title}`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Date Badge */}
          <div className="flex-shrink-0 bg-blue-600 text-white rounded-lg p-2 text-center w-14">
            <div className="text-xs font-semibold">
              {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </div>
            <div className="text-xl font-bold">
              {new Date(event.start_time).getDate()}
            </div>
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {event.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {formatTime(event.start_time)}
            </p>
            {showOrganization && organization && (
              <p className="text-xs text-gray-500 mt-1">
                {organization.name}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Full card version
  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`View details for ${event.title}`}
    >
      {/* Card Header with Date Badge */}
      <div className="flex items-start p-4 gap-4">
        {/* Date Badge */}
        <div className="flex-shrink-0 bg-blue-600 text-white rounded-lg p-3 text-center w-16">
          <div className="text-xs font-semibold">
            {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
          </div>
          <div className="text-2xl font-bold">
            {new Date(event.start_time).getDate()}
          </div>
          <div className="text-xs">
            {new Date(event.start_time).getFullYear()}
          </div>
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
            {event.title}
          </h3>

          {/* Organization Name */}
          {showOrganization && organization && (
            <p className="text-sm text-gray-600 mb-2">
              {organization.name}
            </p>
          )}

          {/* Time */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span className="mr-2">🕐</span>
            <span>
              {formatTime(event.start_time)}
              {event.end_time && ` - ${formatTime(event.end_time)}`}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            {event.is_virtual ? (
              <>
                <span className="mr-2">💻</span>
                <span>Virtual Event</span>
              </>
            ) : (
              <>
                <span className="mr-2">📍</span>
                <span className="line-clamp-1">{event.location}</span>
              </>
            )}
          </div>

          {/* Description Preview */}
          {event.description && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer with Badges and RSVP Count */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
        {/* Left Side: Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visibility Badge */}
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${visibilityBadge.color}`}>
            {visibilityBadge.text}
          </span>

          {/* User RSVP Badge */}
          {rsvpBadge && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rsvpBadge.color}`}>
              {rsvpBadge.text}
            </span>
          )}

          {/* Max Attendees Badge */}
          {event.max_attendees && (
            <span className="text-xs text-gray-600 px-2 py-1 bg-white border border-gray-300 rounded-full">
              👥 Limited to {event.max_attendees}
            </span>
          )}
        </div>

        {/* Right Side: RSVP Count */}
        {!loading && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {rsvpCount.going > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-green-600 font-semibold">✓</span>
                <span>{rsvpCount.going} going</span>
              </span>
            )}
            {rsvpCount.maybe > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-600 font-semibold">?</span>
                <span>{rsvpCount.maybe} maybe</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default EventCard;