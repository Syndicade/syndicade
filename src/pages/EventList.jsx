import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';

// Matches orgColors in EventCalendar.jsx — index must stay in sync
var ORG_POSTIT_COLORS = [
  { card: '#DBEAFE', tag: '#3b82f6', tagText: '#1e3a8a', tack: '#2563eb' }, // blue
  { card: '#D1FAE5', tag: '#10b981', tagText: '#064e3b', tack: '#059669' }, // green
  { card: '#FEF3C7', tag: '#f59e0b', tagText: '#78350f', tack: '#d97706' }, // amber
  { card: '#FEE2E2', tag: '#ef4444', tagText: '#7f1d1d', tack: '#dc2626' }, // red
  { card: '#EDE9FE', tag: '#8b5cf6', tagText: '#3b0764', tack: '#7c3aed' }, // purple
  { card: '#FCE7F3', tag: '#ec4899', tagText: '#831843', tack: '#db2777' }, // pink
  { card: '#CCFBF1', tag: '#14b8a6', tagText: '#134e4a', tack: '#0d9488' }, // teal
  { card: '#FFEDD5', tag: '#f97316', tagText: '#7c2d12', tack: '#ea580c' }, // orange
];

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function IconRecurring() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '13px', height: '13px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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

function IconSearch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconEmptyCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '56px', height: '56px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(isoStr) {
  if (!isoStr) return '';
  var d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  var d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getEventType(event) {
  if (event.is_virtual && event.location && event.location !== 'Virtual Event') return 'hybrid';
  if (event.is_virtual || event.location === 'Virtual Event') return 'virtual';
  return 'in-person';
}

function getEventTypeLabel(event) {
  var t = getEventType(event);
  if (t === 'virtual') return 'Virtual';
  if (t === 'hybrid') return 'Hybrid';
  return 'In-Person';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function EventListSkeleton({ isDark }) {
  var pulse = isDark ? '#2A3550' : '#E2E8F0';
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '20px' }}>
      {[1, 2, 3, 4, 5, 6].map(function(n) {
        return (
          <div key={n} style={{ background: pulse, borderRadius: '4px', padding: '16px', position: 'relative', marginTop: '12px', minHeight: '180px' }} className="animate-pulse">
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)', background: isDark ? '#3A4560' : '#CBD5E1' }} />
            <div style={{ width: '60px', height: '18px', background: isDark ? '#3A4560' : '#CBD5E1', borderRadius: '3px', marginBottom: '10px' }} />
            <div style={{ width: '90%', height: '16px', background: isDark ? '#3A4560' : '#CBD5E1', borderRadius: '3px', marginBottom: '8px' }} />
            <div style={{ width: '70%', height: '14px', background: isDark ? '#3A4560' : '#CBD5E1', borderRadius: '3px', marginBottom: '6px' }} />
            <div style={{ width: '80%', height: '14px', background: isDark ? '#3A4560' : '#CBD5E1', borderRadius: '3px', marginBottom: '6px' }} />
            <div style={{ width: '50%', height: '14px', background: isDark ? '#3A4560' : '#CBD5E1', borderRadius: '3px', marginBottom: '16px' }} />
            <div style={{ width: '80px', height: '28px', background: isDark ? '#3A4560' : '#CBD5E1', borderRadius: '4px', marginLeft: 'auto' }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Post-it Event Card ────────────────────────────────────────────────────────
function PostItEventCard({ event, colorScheme }) {
  var navigate = useNavigate();
  var type = getEventType(event);

  return (
    <article
      role="listitem"
      style={{
        background: colorScheme.card,
        borderRadius: '4px',
        padding: '16px',
        position: 'relative',
        marginTop: '12px',
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.05) 24px)',
        backgroundPositionY: '32px',
        cursor: 'pointer',
      }}
      onClick={function() { navigate('/events/' + event.id); }}
      tabIndex={0}
      onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/events/' + event.id); } }}
      aria-label={event.title + ' event'}
    >
      {/* Tack */}
      <div aria-hidden="true" style={{
        width: '14px', height: '14px', borderRadius: '50%',
        position: 'absolute', top: '-7px', left: '50%', transform: 'translateX(-50%)',
        background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, ' + colorScheme.tack + ' 52%, rgba(0,0,0,0.2) 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
      }} />

      {/* Type tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 8px', borderRadius: '3px',
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
          background: colorScheme.tag, color: colorScheme.tagText,
        }}>
          {type === 'virtual'   && <IconVirtual />}
          {type === 'hybrid'    && <IconGlobe />}
          {type === 'in-person' && <IconPin />}
          {getEventTypeLabel(event)}
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {event.is_recurring && (
            <span title="Recurring event" style={{ color: '#374151' }}><IconRecurring /></span>
          )}
          {event.is_rescheduled && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid #374151', color: '#374151',
              fontSize: '9px', fontWeight: 800,
            }} title="Rescheduled">R</span>
          )}
        </div>
      </div>

      {/* Title — serif */}
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1.4, marginBottom: '10px', fontFamily: 'Georgia, serif' }}>
        {event.title}
      </div>

      {/* Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', marginBottom: '5px' }}>
        <IconCalendar />
        <span>{formatDate(event.start_time)}{event.start_time ? ' · ' + formatTime(event.start_time) : ''}</span>
      </div>

      {/* Location */}
      {event.location && event.location !== 'Virtual Event' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', marginBottom: '5px' }}>
          <IconPin />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.location}</span>
        </div>
      )}

      {/* Org name */}
      {event.organizations && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6B7280', marginBottom: '12px' }}>
          <IconUsers />
          <span>{event.organizations.name}</span>
        </div>
      )}

      {/* Rescheduled original date */}
      {event.is_rescheduled && event.original_start_time && (
        <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '10px' }}>
          <span style={{ textDecoration: 'line-through' }}>Was: {formatDate(event.original_start_time)}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          onClick={function(e) { e.stopPropagation(); navigate('/events/' + event.id); }}
          style={{
            padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            border: 'none', cursor: 'pointer',
            background: colorScheme.tag, color: colorScheme.tagText,
          }}
          aria-label={'View ' + event.title}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          View Event
        </button>
      </div>
    </article>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function EventList() {
  var { organizationId } = useParams();
  var { isDark } = useTheme();

  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#FFFFFF';

  var [events, setEvents]               = useState([]);
  var [filteredEvents, setFilteredEvents] = useState([]);
  var [organizations, setOrganizations] = useState([]);
  var [loading, setLoading]             = useState(true);
  var [error, setError]                 = useState(null);
  var [searchTerm, setSearchTerm]       = useState('');
  var [selectedOrg, setSelectedOrg]     = useState('all');
  var [dateFilter, setDateFilter]       = useState('upcoming');
  var [sortOrder, setSortOrder]         = useState('asc');

  useEffect(function() {
    fetchEventsAndOrganizations();
  }, [organizationId]);

  async function fetchEventsAndOrganizations() {
    try {
      setLoading(true);
      setError(null);

      var userRes = await supabase.auth.getUser();
      if (userRes.error) throw userRes.error;
      if (!userRes.data.user) { setError('You must be logged in to view events'); setLoading(false); return; }
      var user = userRes.data.user;

      var { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('organization_id, organizations(id, name)')
        .eq('member_id', user.id)
        .eq('status', 'active');
      if (membershipError) throw membershipError;

      var userOrgs = (memberships || []).map(function(m) { return m.organizations; });
      setOrganizations(userOrgs);

      var orgIds;
      if (organizationId) {
        orgIds = [organizationId];
        setSelectedOrg(organizationId);
      } else {
        orgIds = userOrgs.map(function(org) { return org.id; });
      }

      if (orgIds.length === 0) { setEvents([]); setFilteredEvents([]); setLoading(false); return; }

      var { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*, organizations(name)')
        .or('organization_id.in.(' + orgIds.join(',') + '),visibility.eq.public')
        .order('start_time', { ascending: true });
      if (eventsError) throw eventsError;

      var visibleEvents = (eventsData || []).filter(function(event) {
        if (!event.is_recurring) return true;
        if (event.parent_event_id) return true;
        return false;
      });

      setEvents(visibleEvents);
      setFilteredEvents(visibleEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function() {
    var filtered = events.slice();
    var now = new Date();

    if (searchTerm) {
      filtered = filtered.filter(function(event) {
        return event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }

    if (selectedOrg !== 'all') {
      filtered = filtered.filter(function(event) { return event.organization_id === selectedOrg; });
    }

    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(function(event) { return new Date(event.start_time) >= now; });
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(function(event) { return new Date(event.start_time) < now; });
    }

    filtered.sort(function(a, b) {
      var da = new Date(a.start_time), db = new Date(b.start_time);
      return sortOrder === 'asc' ? da - db : db - da;
    });

    setFilteredEvents(filtered);
  }, [searchTerm, selectedOrg, dateFilter, sortOrder, events]);

  var hasActiveFilters = searchTerm || selectedOrg !== 'all' || dateFilter !== 'upcoming';

  function clearAll() {
    setSearchTerm('');
    setSelectedOrg('all');
    setDateFilter('upcoming');
  }

  var inputStyle = {
    width: '100%', padding: '8px 12px', fontSize: '13px',
    background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px',
    color: textPrimary, outline: 'none',
  };

  var labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: pageBg }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        <PageHeader
          title="All Events"
          subtitle={loading ? 'Loading events...' : filteredEvents.length + ' event' + (filteredEvents.length !== 1 ? 's' : '') + ' found'}
          backTo={null}
          backLabel={null}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link to="/events"
                style={{ padding: '8px 14px', background: '#3B82F6', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                List View
              </Link>
              <Link to="/calendar"
                style={{ padding: '8px 14px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', color: textSecondary, fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                Calendar View
              </Link>
            </div>
          }
        />

        {/* Filters */}
        <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>

            <div>
              <label htmlFor="search" style={labelStyle}>Search</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted }}>
                  <IconSearch />
                </span>
                <input id="search" type="text" placeholder="Name, location..." value={searchTerm}
                  onChange={function(e) { setSearchTerm(e.target.value); }}
                  style={Object.assign({}, inputStyle, { paddingLeft: '32px' })}
                  aria-label="Search events" />
              </div>
            </div>

            <div>
              <label htmlFor="org-filter" style={labelStyle}>Organization</label>
              <select id="org-filter" value={selectedOrg}
                onChange={function(e) { setSelectedOrg(e.target.value); }}
                style={inputStyle}
                aria-label="Filter by organization">
                <option value="all">All Organizations</option>
                {organizations.map(function(org) {
                  return <option key={org.id} value={org.id}>{org.name}</option>;
                })}
              </select>
            </div>

            <div>
              <label htmlFor="date-filter" style={labelStyle}>Time Period</label>
              <select id="date-filter" value={dateFilter}
                onChange={function(e) { setDateFilter(e.target.value); }}
                style={inputStyle}
                aria-label="Filter by time period">
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="all">All Events</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort-order" style={labelStyle}>Sort</label>
              <select id="sort-order" value={sortOrder}
                onChange={function(e) { setSortOrder(e.target.value); }}
                style={inputStyle}
                aria-label="Sort events">
                <option value="asc">Earliest First</option>
                <option value="desc">Latest First</option>
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid ' + borderColor }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: textMuted }}>Filters:</span>
              {searchTerm && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '99px', fontSize: '12px', color: '#3B82F6' }}>
                  "{searchTerm}"
                  <button onClick={function() { setSearchTerm(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '0', display: 'flex' }} aria-label="Clear search"><IconClose /></button>
                </span>
              )}
              {selectedOrg !== 'all' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '99px', fontSize: '12px', color: '#3B82F6' }}>
                  {(organizations.find(function(o) { return o.id === selectedOrg; }) || {}).name || 'Org'}
                  <button onClick={function() { setSelectedOrg('all'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '0', display: 'flex' }} aria-label="Clear org filter"><IconClose /></button>
                </span>
              )}
              {dateFilter !== 'upcoming' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '99px', fontSize: '12px', color: '#3B82F6' }}>
                  {dateFilter === 'past' ? 'Past Events' : 'All Events'}
                  <button onClick={function() { setDateFilter('upcoming'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '0', display: 'flex' }} aria-label="Clear date filter"><IconClose /></button>
                </span>
              )}
              <button onClick={clearAll}
                style={{ fontSize: '12px', fontWeight: 600, color: textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <EventListSkeleton isDark={isDark} />
        ) : error ? (
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }} role="alert">
            <div style={{ color: '#EF4444' }}><IconAlert /></div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary }}>Could not load events</h2>
            <p style={{ color: textSecondary, maxWidth: '360px' }}>{error}</p>
            <button onClick={function() { window.location.reload(); }}
              style={{ padding: '10px 24px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              Try Again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div style={{ color: textMuted }}><IconEmptyCalendar /></div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary }}>No events found</h3>
            <p style={{ color: textSecondary, maxWidth: '360px', lineHeight: 1.6 }}>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more events.'
                : 'No events available yet. Check back soon!'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAll}
                style={{ padding: '10px 24px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div
            role="list"
            aria-label="Events"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '20px' }}>
{filteredEvents.map(function(event, index) {
            var orgIndex = organizations.findIndex(function(o) { return o.id === event.organization_id; });
            var colorScheme = ORG_POSTIT_COLORS[orgIndex >= 0 ? orgIndex % ORG_POSTIT_COLORS.length : index % ORG_POSTIT_COLORS.length];
            return (
              <PostItEventCard key={event.id} event={event} colorScheme={colorScheme} />
            );
          })}
          </div>
        )}

      </div>
    </div>
  );
}

export default EventList;