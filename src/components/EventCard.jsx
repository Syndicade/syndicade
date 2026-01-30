import { Link } from 'react-router-dom';

/**
 * EventCard Component
 * 
 * Displays a summary card for an event with key information.
 * Uses start_time and end_time as full timestamps (not separate date/time fields).
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
  
  // Safety check: ensure event object exists
  if (!event || !event.id) {
    console.error('EventCard: Invalid event object', event);
    return null;
  }

  // Helper function to determine event type
  const getEventType = () => {
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

  // Get event type icon and label
  const getEventTypeDisplay = () => {
    const eventType = getEventType();
    
    const displays = {
      'hybrid': { icon: '🌐', label: 'Hybrid Event' },
      'virtual': { icon: '💻', label: 'Virtual Event' },
      'in-person': { icon: '📍', label: event.location || 'In-Person Event' }
    };
    
    return displays[eventType];
  };

  // Parse start_time timestamp
  const getStartDate = () => {
    if (!event.start_time) {
      console.warn('EventCard: No start_time for event', event.id);
      return new Date();
    }
    return new Date(event.start_time);
  };

  // Format time from timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error('EventCard: Error formatting time', error, timestamp);
      return '';
    }
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

  const visibilityBadge = getVisibilityBadge();
  const eventTypeDisplay = getEventTypeDisplay();
  const startDate = getStartDate();

  // Get organization name from event.organizations (already included in query)
  const organizationName = event.organizations?.name || null;

  // Compact version for sidebars
  if (compact) {
    return (
      <Link
        to={`/events/${event.id}`}
        className="block bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`View details for ${event.title}`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Date Badge with Recurring Icon */}
          <div className="flex-shrink-0">
            <div className="bg-blue-600 text-white rounded-lg p-2 text-center w-14">
              <div className="text-xs font-semibold">
                {startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </div>
              <div className="text-xl font-bold">
                {startDate.getDate()}
              </div>
            </div>
            {event.is_recurring && (
              <div className="text-center mt-1" title="Recurring Event">
                <span className="text-xs">🔄</span>
              </div>
            )}
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {event.title}
            </h4>
            {event.start_time && (
              <p className="text-xs text-gray-600 mt-1">
                {formatTime(event.start_time)}
              </p>
            )}
            {showOrganization && organizationName && (
              <p className="text-xs text-gray-500 mt-1">
                {organizationName}
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
        {/* Date Badge with Recurring Icon Below */}
        <div className="flex-shrink-0">
          <div className="bg-blue-600 text-white rounded-lg p-3 text-center w-16">
            <div className="text-xs font-semibold">
              {startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
            </div>
            <div className="text-2xl font-bold">
              {startDate.getDate()}
            </div>
            <div className="text-xs">
              {startDate.getFullYear()}
            </div>
          </div>
          {/* Recurring Icon */}
          {event.is_recurring && (
            <div className="text-center mt-2" title="Recurring Event">
              <span className="text-lg">🔄</span>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">
            {event.title}
          </h3>

          {/* Organization Name */}
          {showOrganization && organizationName && (
            <p className="text-sm text-gray-600 mb-2">
              {organizationName}
            </p>
          )}

          {/* Time */}
          {event.start_time && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <span className="mr-2">🕐</span>
              <span>
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </span>
            </div>
          )}

          {/* Location with event type icon */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span className="mr-2">{eventTypeDisplay.icon}</span>
            <span className="line-clamp-1">{eventTypeDisplay.label}</span>
          </div>

          {/* Description Preview */}
          {event.description && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer with Badges */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visibility Badge */}
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${visibilityBadge.color}`}>
            {visibilityBadge.text}
          </span>

          {/* Max Attendees Badge */}
          {event.max_attendees && (
            <span className="text-xs text-gray-600 px-2 py-1 bg-white border border-gray-300 rounded-full">
              👥 Max {event.max_attendees}
            </span>
          )}
        </div>

        {/* Click for details */}
        <span className="text-xs text-gray-500">
          Click for details →
        </span>
      </div>
    </Link>
  );
}

export default EventCard;