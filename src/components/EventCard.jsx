import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconClock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconVirtual() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconHybrid() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconRecurring() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function IconDraft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '13px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getEventType(event) {
  if (event.is_virtual && event.location && event.location !== 'Virtual Event') return 'hybrid';
  if (event.is_virtual || event.location === 'Virtual Event') return 'virtual';
  return 'in-person';
}

function formatTime(timestamp, eventTimezone) {
  if (!timestamp) return '';
  try {
    var date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    var tz = eventTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    var timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz });
    var tzAbbr = date.toLocaleTimeString('en-US', { timeZoneName: 'short', timeZone: tz }).split(' ').pop();
    return timeStr + ' ' + tzAbbr;
  } catch (e) { return ''; }
}

function formatDateShort(isoStr) {
  if (!isoStr) return '';
  var d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main Component ─────────────────────────────────────────────────────────────
function EventCard({ event, showOrganization, compact }) {
  var { isDark } = useTheme();

  if (!event || !event.id) return null;

  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var footerBg      = isDark ? '#151B2D' : '#F8FAFC';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';

  var eventType = getEventType(event);
  var startDate = event.start_time ? new Date(event.start_time) : new Date();
  var orgName   = event.organizations ? event.organizations.name : null;

  // Visibility config
  var visibilityMap = {
    public:  { icon: <IconGlobe />,    label: 'Public',       bg: isDark ? 'rgba(34,197,94,0.15)'  : '#DCFCE7', color: '#22C55E' },
    members: { icon: <IconUsers />,    label: 'Members Only', bg: isDark ? 'rgba(59,130,246,0.15)' : '#DBEAFE', color: '#3B82F6' },
    groups:  { icon: <IconLock />,     label: 'Groups Only',  bg: isDark ? 'rgba(139,92,246,0.15)' : '#EDE9FE', color: '#8B5CF6' },
    draft:   { icon: <IconDraft />,    label: 'Draft',        bg: isDark ? 'rgba(100,116,139,0.15)': '#F1F5F9', color: '#64748B' },
  };
  var vis = visibilityMap[event.visibility] || visibilityMap.members;

  // Event type config
  var typeMap = {
    'in-person': { icon: <IconPin />,     label: event.location || 'In-Person' },
    'virtual':   { icon: <IconVirtual />, label: 'Virtual Event'               },
    'hybrid':    { icon: <IconHybrid />,  label: event.location || 'Hybrid'    },
  };
  var typeDisplay = typeMap[eventType];

  // ── Compact version ──────────────────────────────────────────────────────────
  if (compact) {
    return (
      <Link
        to={'/events/' + event.id}
        style={{
          display: 'block', textDecoration: 'none',
          background: cardBg, border: '1px solid ' + borderColor,
          borderRadius: '10px', padding: '12px',
        }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-md transition-shadow"
        aria-label={'View details for ' + event.title}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          {/* Date badge */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ background: '#3B82F6', color: '#fff', borderRadius: '8px', padding: '6px 8px', textAlign: 'center', minWidth: '48px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                {startDate.toLocaleDateString('en-US', { month: 'short' })}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>
                {startDate.getDate()}
              </div>
            </div>
            {event.is_recurring && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px', color: textMuted }} title="Recurring">
                <IconRecurring />
              </div>
            )}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, color: textPrimary, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </p>
            {event.start_time && (
              <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>
                {formatTime(event.start_time, event.event_timezone)}
              </p>
            )}
            {showOrganization && orgName && (
              <p style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>{orgName}</p>
            )}
            {event.is_rescheduled && (
              <span style={{
                display: 'inline-block', marginTop: '4px',
                padding: '1px 6px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
                background: 'rgba(245,183,49,0.15)', border: '1px solid rgba(245,183,49,0.4)', color: '#F5B731',
              }}>Rescheduled</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // ── Full card version ────────────────────────────────────────────────────────
  return (
    <Link
      to={'/events/' + event.id}
      style={{
        display: 'block', textDecoration: 'none',
        background: cardBg,
        border: event.is_featured ? '2px solid #F5B731' : ('1px solid ' + borderColor),
        borderRadius: '12px', overflow: 'hidden',
      }}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:shadow-lg transition-shadow"
      aria-label={'View details for ' + event.title}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', gap: '14px' }}>
        {/* Date badge */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ background: '#3B82F6', color: '#fff', borderRadius: '10px', padding: '8px 10px', textAlign: 'center', minWidth: '56px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {startDate.toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.1 }}>
              {startDate.getDate()}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.85 }}>
              {startDate.getFullYear()}
            </div>
          </div>
          {event.is_recurring && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px', color: textMuted }} title="Recurring event">
              <IconRecurring />
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Org + Featured pill row */}
          {(showOrganization && orgName) || event.is_featured ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {showOrganization && orgName && (
                <span style={{ fontSize: '12px', color: textMuted, fontWeight: 600 }}>{orgName}</span>
              )}
              {event.is_featured && (
                <span style={{
                  marginLeft: 'auto', flexShrink: 0,
                  background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.35)',
                  color: '#F5B731', fontSize: '10px', fontWeight: 700,
                  padding: '2px 8px', borderRadius: '99px',
                  textTransform: 'uppercase', letterSpacing: '1px',
                }}>Featured</span>
              )}
            </div>
          ) : null}

          {/* Title */}
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, marginBottom: '8px', lineHeight: 1.3 }}>
            {event.title}
          </h3>

          {/* Rescheduled */}
          {event.is_rescheduled && (
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                background: 'rgba(245,183,49,0.15)', border: '1px solid rgba(245,183,49,0.4)', color: '#F5B731',
              }}>Rescheduled</span>
              {event.original_start_time && (
                <span style={{ fontSize: '12px', color: textMuted, textDecoration: 'line-through' }}>
                  Was: {formatDateShort(event.original_start_time)}
                </span>
              )}
            </div>
          )}

          {/* Time */}
          {event.start_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: textSecondary, marginBottom: '5px' }}>
              <IconClock />
              <span>
                {formatTime(event.start_time, event.event_timezone)}
                {event.end_time ? ' – ' + formatTime(event.end_time, event.event_timezone) : ''}
              </span>
            </div>
          )}

          {/* Location / type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: textSecondary, marginBottom: '5px' }}>
            {typeDisplay.icon}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{typeDisplay.label}</span>
          </div>

          {/* Description */}
          {event.description && (
            <p style={{ fontSize: '13px', color: textMuted, marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', background: footerBg,
        borderTop: '1px solid ' + borderColor,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Visibility badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
            background: vis.bg, color: vis.color,
          }}>
            {vis.icon}
            {vis.label}
          </span>
          {/* Max attendees */}
          {event.max_attendees && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
              background: isDark ? 'rgba(100,116,139,0.15)' : '#F1F5F9',
              border: '1px solid ' + borderColor, color: textMuted,
            }}>
              <IconUsers />
              Max {event.max_attendees}
            </span>
          )}
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: textMuted, fontWeight: 500 }}>
          Details <IconChevronRight />
        </span>
      </div>
    </Link>
  );
}

export default EventCard;