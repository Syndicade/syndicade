import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { et } from '../lib/eventDiscoveryTranslations';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import DemoBadge from '../components/DemoBadge';

var EVENT_TYPE_COLORS = {
  'advocacy-event':        { bg: '#3B1A1A', color: '#F87171' },
  'blood-drive':           { bg: '#3B1A2A', color: '#FB7185' },
  'clothing-drive':        { bg: '#2D1B4E', color: '#C084FC' },
  'community-meeting':     { bg: '#1D3461', color: '#60A5FA' },
  'cultural-event':        { bg: '#3B2A1A', color: '#FB923C' },
  'education-workshop':    { bg: '#1A2E3B', color: '#22D3EE' },
  'faith-based-event':     { bg: '#1E1B4B', color: '#818CF8' },
  'food-drive':            { bg: '#3B3A1A', color: '#FBBF24' },
  'fundraiser':            { bg: '#1B3A2F', color: '#4ADE80' },
  'health-wellness':       { bg: '#1B3A2F', color: '#34D399' },
  'volunteer-opportunity': { bg: '#1A3B3B', color: '#2DD4BF' },
  'youth-event':           { bg: '#3B1A2E', color: '#F472B6' },
};

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

var LANGUAGE_LABELS = {
  en: 'English', es: 'Español', zh: '中文',
  tl: 'Tagalog', vi: 'Tiếng Việt', ar: 'العربية',
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
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '13px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
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

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '12px', height: '12px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
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

export default function EventDiscoveryCard({ event, lang, session, initialSaved, adminOrgs }) {
  var { isDark } = useTheme();
  var navigate = useNavigate();
  lang = lang || 'en';
  initialSaved = initialSaved || false;
  adminOrgs = adminOrgs || [];

  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var tackCore      = isDark ? '#1D4ED8'  : '#2563EB';

  var [saved, setSaved] = useState(initialSaved);
  var [saveLoading, setSaveLoading] = useState(false);
  var [colabModal, setColabModal] = useState(false);
  var [selectedOrgId, setSelectedOrgId] = useState('');
  var [colabLoading, setColabLoading] = useState(false);

  var isOwnEvent    = adminOrgs.some(function(org) { return org.id === event.organization_id; });
  var showCollaborate = adminOrgs.length > 0 && !isOwnEvent;
  var isFeatured    = event.is_featured;
  var eventUrl      = '/events/' + event.id;
  var typeColors    = isDark ? EVENT_TYPE_COLORS : EVENT_TYPE_COLORS_LIGHT;

  async function handleSave(e) {
    e.stopPropagation();
    if (!session) { toast(et(lang, 'signInToSave') || 'Sign in to save events'); return; }
    setSaveLoading(true);
    try {
      if (saved) {
        var r = await supabase.from('event_saves').delete().eq('event_id', event.id).eq('user_id', session.user.id);
        if (r.error) throw r.error;
        setSaved(false);
        toast('Removed from saved events');
      } else {
        var r2 = await supabase.from('event_saves').insert({ event_id: event.id, user_id: session.user.id });
        if (r2.error) throw r2.error;
        setSaved(true);
        mascotSuccessToast('Event saved!');
      }
    } catch { toast.error('Could not update saved events'); }
    finally { setSaveLoading(false); }
  }

  async function handleShare(e) {
    e.stopPropagation();
    var url = window.location.origin + eventUrl;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(et(lang, 'linkCopied') || 'Link copied!');
    } catch { toast.error('Could not copy link'); }
  }

  function handleAddToCalendar(e) {
    e.stopPropagation();
    try { generateICS(event); toast.success('Calendar file downloaded'); }
    catch { toast.error('Could not generate calendar file'); }
  }

  function handleCardClick(e) {
    /* don't navigate if clicking a button/link inside the card */
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(eventUrl);
  }

  function openColabModal(e) {
    e.stopPropagation();
    if (adminOrgs.length === 1) setSelectedOrgId(adminOrgs[0].id);
    setColabModal(true);
  }

  async function submitCollab() {
    var orgId = selectedOrgId || (adminOrgs.length === 1 ? adminOrgs[0].id : '');
    if (!orgId) { toast.error('Please select an organization'); return; }
    setColabLoading(true);
    try {
      var org = adminOrgs.find(function(o) { return o.id === orgId; });
      var orgName = org ? org.name : 'An organization';
      var collabRes = await supabase.from('event_collaborators').insert({
        event_id: event.id, requesting_org_id: orgId, host_org_id: event.organization_id,
        status: 'pending', message: orgName + ' wants to collaborate on this event.',
      });
      if (collabRes.error) {
        if (collabRes.error.code === '23505') throw new Error('You have already sent a collaboration request for this event');
        throw collabRes.error;
      }
      var hostRes = await supabase.from('memberships').select('member_id').eq('organization_id', event.organization_id).eq('role', 'admin').eq('status', 'active');
      if (hostRes.data && hostRes.data.length > 0) {
        var notifications = hostRes.data.map(function(m) {
          return { user_id: m.member_id, type: 'collaboration_request', title: 'Collaboration Request', message: orgName + ' wants to collaborate on "' + event.title + '"', data: { event_id: event.id, requesting_org_id: orgId }, is_read: false };
        });
        await supabase.from('notifications').insert(notifications);
      }
      mascotSuccessToast('Collaboration request sent!');
      setColabModal(false);
    } catch (err) { toast.error(err.message || 'Could not send request'); }
    finally { setColabLoading(false); }
  }

  var locationDisplay = [event.city, event.state].filter(Boolean).join(', ');

  return (
    <>
      <article
        onClick={handleCardClick}
        style={{
          background: cardBg,
          border: isFeatured ? '2px solid #F5B731' : ('1px solid ' + borderColor),
          borderRadius: '12px',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          marginTop: '10px',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s',
        }}
        aria-label={'Event: ' + event.title}
        role="article"
      >
        {/* Brand tack — same style as org cards */}
        <div aria-hidden="true" style={{
          width: '16px', height: '16px', borderRadius: '50%',
          position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
          background: isFeatured
            ? 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, #B45309 52%, rgba(0,0,0,0.25) 100%)'
            : 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, ' + tackCore + ' 52%, rgba(0,0,0,0.25) 100%)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.35)', zIndex: 2,
        }} />

        <div style={{ padding: '18px 16px 14px', display: 'flex', flexDirection: 'column', gap: '10px', borderRadius: '12px', overflow: 'hidden' }}>

          {/* ── Header: title + org + save/share ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, lineHeight: 1.3 }}>{event.title}</h2>
              {event.org_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <Link
                    to={'/org/' + (event.org_slug || event.organization_id)}
                    onClick={function(e) { e.stopPropagation(); }}
                    style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none' }}
                    aria-label={'Hosted by ' + event.org_name}
                    className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {event.org_name}
                  </Link>
{isFeatured && (
                    <span style={{ marginLeft: 'auto', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.35)', color: '#F5B731', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0 }}>
                      Featured
                    </span>
                  )}
                  {event.is_demo && <DemoBadge size="sm" />}
{event.org_is_verified_nonprofit && (
  <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'10px', fontWeight:700, color:'#22C55E', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'99px', padding:'2px 7px', flexShrink:0 }} aria-label="Verified nonprofit">
    <svg xmlns="http://www.w3.org/2000/svg" style={{width:'9px',height:'9px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
    Verified
  </span>
)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={saveLoading} aria-label={saved ? 'Unsave event' : 'Save event'} aria-pressed={saved}
                style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer', color: saved ? '#F5B731' : textMuted, opacity: saveLoading ? 0.5 : 1 }}
                className="hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <BookmarkIcon filled={saved} />
              </button>
              <button onClick={handleShare} aria-label="Share event"
                style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted }}
                className="hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <ShareIcon />
              </button>
            </div>
          </div>

          {/* ── Date & Location ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: textMuted }}>
              <CalendarIcon />
              {formatEventDate(event.start_time, event.end_time)}
            </span>
            {(locationDisplay || event.is_virtual) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: textMuted }}>
                <MapPinIcon />
                {event.is_virtual
                  ? (event.location ? ('Hybrid \u00b7 ' + locationDisplay) : 'Virtual')
                  : (locationDisplay || event.location || 'Location not listed')}
              </span>
            )}
          </div>

          {/* ── Event type + audience tags ── */}
          {((event.event_types && event.event_types.length > 0) || (event.audience && event.audience.length > 0)) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }} aria-label="Event tags">
              {(event.event_types || []).slice(0, 2).map(function(type) {
                var c = typeColors[type] || { bg: isDark ? '#1A2035' : '#F1F5F9', color: textMuted };
                return (
                  <span key={type} style={{ background: c.bg, color: c.color, fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '99px' }}>
                    {et(lang, type)}
                  </span>
                );
              })}
              {(event.audience || []).slice(0, 2).map(function(a) {
                return (
                  <span key={a} style={{ background: isDark ? '#1E2845' : '#F1F5F9', color: textMuted, fontSize: '11px', fontWeight: 500, padding: '2px 9px', borderRadius: '99px' }}>
                    {et(lang, a)}
                  </span>
                );
              })}
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', marginTop: 'auto', borderTop: '1px solid ' + borderColor, flexWrap: 'wrap', gap: '8px' }}>

            {/* Left meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: textMuted, flexWrap: 'wrap' }}>
              {event.languages && event.languages.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GlobeIcon />
                  {event.languages.map(function(l) { return LANGUAGE_LABELS[l] || l; }).join(', ')}
                </span>
              )}
              {event.volunteer_signup && <span style={{ color: '#2DD4BF', fontWeight: 600 }}>Volunteer</span>}
              {event.donation_dropoff  && <span style={{ color: '#FB923C', fontWeight: 600 }}>Donations</span>}
            </div>

            {/* Right action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={handleAddToCalendar}
                aria-label={'Add ' + event.title + ' to calendar'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid ' + borderColor, color: textSecondary, cursor: 'pointer', whiteSpace: 'nowrap' }}
                className="hover:border-blue-500 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <CalendarAddIcon />
                Add to Calendar
              </button>

              {showCollaborate && (
                <button
                  onClick={openColabModal}
                  style={{ fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  aria-label={'Request to collaborate on ' + event.title}
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Collaborate
                </button>
              )}

              <Link
                to={eventUrl}
                onClick={function(e) { e.stopPropagation(); }}
                style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', padding: '6px 14px', borderRadius: '8px', background: '#3B82F6', textDecoration: 'none', whiteSpace: 'nowrap' }}
                aria-label={'View event: ' + event.title}
                className="hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                View Event
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Collaborate Modal */}
      {colabModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
          onClick={function() { setColabModal(false); }} role="dialog" aria-modal="true" aria-labelledby="collab-modal-title">
          <div style={{ background: isDark ? '#1A2035' : '#FFFFFF', border: '1px solid ' + borderColor, borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxWidth: '448px', width: '100%' }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid ' + borderColor }}>
              <h2 id="collab-modal-title" style={{ fontSize: '18px', fontWeight: 800, color: textPrimary }}>Request Collaboration</h2>
              <p style={{ fontSize: '14px', color: textMuted, marginTop: '4px' }}>{event.title}</p>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: textSecondary }}>Your collaboration request will be sent to the admins of this organization. If accepted, both org names will appear on the event.</p>
              {adminOrgs.length > 1 && (
                <div>
                  <label htmlFor="collab-org-select" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>Requesting as <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                  <select id="collab-org-select" value={selectedOrgId} onChange={function(e) { setSelectedOrgId(e.target.value); }}
                    style={{ width: '100%', padding: '8px 12px', background: isDark ? '#0E1523' : '#F8FAFC', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none' }}
                    aria-required="true" className="focus:ring-2 focus:ring-blue-500">
                    <option value="">Select your organization...</option>
                    {adminOrgs.map(function(org) { return <option key={org.id} value={org.id}>{org.name}</option>; })}
                  </select>
                </div>
              )}
              {adminOrgs.length === 1 && (
                <p style={{ fontSize: '14px', color: textSecondary }}>Requesting as <span style={{ color: textPrimary, fontWeight: 700 }}>{adminOrgs[0].name}</span></p>
              )}
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid ' + borderColor }}>
              <button onClick={function() { setColabModal(false); }} disabled={colabLoading}
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', background: 'transparent', border: '1px solid ' + borderColor, color: textSecondary, cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-gray-500">Cancel</button>
              <button onClick={submitCollab} disabled={colabLoading || (adminOrgs.length > 1 && !selectedOrgId)}
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 700, borderRadius: '8px', background: '#3B82F6', color: '#FFFFFF', border: 'none', cursor: (colabLoading || (adminOrgs.length > 1 && !selectedOrgId)) ? 'not-allowed' : 'pointer', opacity: (colabLoading || (adminOrgs.length > 1 && !selectedOrgId)) ? 0.5 : 1 }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                {colabLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}