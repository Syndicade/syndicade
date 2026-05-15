import { useNavigate, Link } from 'react-router-dom';
import { et } from '../lib/eventDiscoveryTranslations';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import DemoBadge from '../components/DemoBadge';

// NOTE: Collaborate button + modal → EventDetails.jsx (admin-only)
// NOTE: Save/Bookmark → EventDetails.jsx (all logged-in users, event_saves table)
// NOTE: Co-hosts → EventDetails.jsx
// NOTE: Remove "Featured events are promoted by their organizations for 7 days." from EventDiscovery.jsx

var EVENT_TYPE_COLORS_LIGHT = {
  'advocacy-event':        { bg: '#FEE2E2', color: '#B91C1C' },
  'blood-drive':           { bg: '#FFE4E6', color: '#BE123C' },
  'clothing-drive':        { bg: '#F3E8FF', color: '#7E22CE' },
  'community-meeting':     { bg: '#DBEAFE', color: '#1D4ED8' },
  'cultural-event':        { bg: '#FFEDD5', color: '#C2410C' },
  'education-workshop':    { bg: '#CFFAFE', color: '#0E7490' },
  'faith-based-event':     { bg: '#EDE9FE', color: '#5B21B6' },
  'food-drive':            { bg: '#FEF9C3', color: '#B45309' },
  'fundraiser':            { bg: '#DCFCE7', color: '#15803D' },
  'health-wellness':       { bg: '#D1FAE5', color: '#065F46' },
  'volunteer-opportunity': { bg: '#CCFBF1', color: '#0F766E' },
  'youth-event':           { bg: '#FCE7F3', color: '#BE185D' },
};

function formatICSDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateICS(event) {
  var start = formatICSDate(event.start_time);
  var end   = event.end_time ? formatICSDate(event.end_time) : formatICSDate(event.start_time);
  var location = [event.location, event.city, event.state].filter(Boolean).join(', ');
  var description = (event.description || '').replace(/\n/g, '\\n');
  var url = window.location.origin + '/events/' + event.id;
  var ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Syndicade//EN',
    'BEGIN:VEVENT',
    'UID:' + event.id + '@syndicade.com',
    'DTSTAMP:' + formatICSDate(new Date().toISOString()),
    'DTSTART:' + start, 'DTEND:' + end,
    'SUMMARY:' + (event.title || 'Event'),
    'DESCRIPTION:' + description,
    'LOCATION:' + location, 'URL:' + url,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = (event.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/* ── Icons ── */
function CalendarIcon() {
  return (
function VerifiedDot() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '15px', height: '15px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2} aria-label="Verified nonprofit" title="Verified nonprofit">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
  );
}

function CalendarAddIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '13px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v3m0 0v3m0-3h3m-3 0H9" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '13px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function VerifiedDot() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '15px', height: '15px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2} aria-label="Verified nonprofit" title="Verified nonprofit">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function formatEventDate(startTime, endTime) {
  if (!startTime) return '';
  var start = new Date(startTime);
  var dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  var timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (endTime) {
    var end = new Date(endTime);
    var endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return dateStr + ' \u00b7 ' + timeStr + ' \u2013 ' + endTimeStr;
  }
  return dateStr + ' \u00b7 ' + timeStr;
}

export default function EventDiscoveryCard({ event, lang }) {
  var navigate = useNavigate();
  lang = lang || 'en';

  var borderColor = '#E2E8F0';
  var isFeatured  = event.is_featured;
  var eventUrl    = '/events/' + event.id;

  // Location: prefer venue/address, fall back to city+state, then virtual
  var locationDisplay = '';
  if (event.is_virtual) {
    locationDisplay = event.location ? ('Hybrid \u00b7 ' + event.location) : 'Virtual';
  } else {
    locationDisplay = event.location || [event.city, event.state].filter(Boolean).join(', ') || '';
  }

  async function handleShare(e) {
    e.stopPropagation();
    var url = window.location.origin + eventUrl;
    try {
      await navigator.clipboard.writeText(url);
      mascotSuccessToast(et(lang, 'linkCopied') || 'Link copied!');
    } catch { toast.error('Could not copy link'); }
  }

  function handleAddToCalendar(e) {
    e.stopPropagation();
    try { generateICS(event); mascotSuccessToast('Calendar file downloaded'); }
    catch { toast.error('Could not generate calendar file'); }
  }

  function handleCardClick(e) {
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(eventUrl);
  }

  return (
    <article
      onClick={handleCardClick}
      style={{
        background: '#FFFFFF',
        border: isFeatured ? '2px solid #F5B731' : ('1px solid ' + borderColor),
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        boxShadow: '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s',
      }}
      aria-label={'Event: ' + event.title}
      role="article"
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* ── Header: featured pill + title + org + share ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isFeatured && (
              <span style={{ display: 'inline-block', marginBottom: '5px', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.35)', color: '#B45309', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Featured
              </span>
            )}
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523', lineHeight: 1.3, margin: 0 }}>{event.title}</h2>
            {event.org_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <Link
                  to={'/org/' + (event.org_slug || event.organization_id)}
                  onClick={function(e) { e.stopPropagation(); }}
                  style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none' }}
                  aria-label={'Hosted by ' + event.org_name}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  {event.org_name}
                </Link>
                {event.org_is_verified_nonprofit && <VerifiedDot />}
                {event.is_demo && (
  <span style={{ fontSize: '10px', fontWeight: 700, color: '#92400E', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', padding: '2px 7px', borderRadius: '99px', flexShrink: 0 }}>
    Sample Data
  </span>
)}
              </div>
            )}
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            aria-label="Share event"
            style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', flexShrink: 0 }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ShareIcon />
          </button>
        </div>

        {/* ── Location (venue first) ── */}
        {locationDisplay && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
            <MapPinIcon />
            {locationDisplay}
          </span>
        )}

        {/* ── Date row with inline action buttons ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', marginTop: '4px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
            <CalendarIcon />
            {formatEventDate(event.start_time, event.end_time)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleAddToCalendar}
              aria-label={'Add ' + event.title + ' to calendar'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'transparent', border: '1px solid ' + borderColor, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}
              className="hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <CalendarAddIcon />
              Add to Calendar
            </button>
            <Link
              to={eventUrl}
              onClick={function(e) { e.stopPropagation(); }}
              style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', padding: '4px 12px', borderRadius: '6px', background: '#3B82F6', textDecoration: 'none', whiteSpace: 'nowrap' }}
              aria-label={'View event: ' + event.title}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View
            </Link>
          </div>
        </div>

        {/* ── Description ── */}
        {event.description && (
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {event.description}
          </p>
        )}

        {/* ── Event type + audience tags ── */}
        {((event.event_types && event.event_types.length > 0) || (event.audience && event.audience.length > 0)) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', marginTop: '4px' }}>
            {(event.event_types || []).slice(0, 2).map(function(type) {
              var c = EVENT_TYPE_COLORS_LIGHT[type] || { bg: '#F1F5F9', color: '#64748B' };
              return (
                <span key={type} style={{ background: c.bg, color: c.color, fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '99px' }}>
                  {et(lang, type)}
                </span>
              );
            })}
            {(event.audience || []).slice(0, 2).map(function(a) {
              return (
                <span key={a} style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 500, padding: '2px 9px', borderRadius: '99px' }}>
                  {et(lang, a)}
                </span>
              );
            })}
          </div>
        )}

      </div>
    </article>
  );
}