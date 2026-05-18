import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import CreateEvent from '../components/CreateEvent';

var PALETTE = [
  { color:'#3B82F6', card:'#DBEAFE', tagText:'#1e3a8a' },
  { color:'#10B981', card:'#D1FAE5', tagText:'#064e3b' },
  { color:'#F59E0B', card:'#FEF3C7', tagText:'#78350f' },
  { color:'#EF4444', card:'#FEE2E2', tagText:'#7f1d1d' },
  { color:'#8B5CF6', card:'#EDE9FE', tagText:'#3b0764' },
  { color:'#EC4899', card:'#FCE7F3', tagText:'#831843' },
  { color:'#14B8A6', card:'#CCFBF1', tagText:'#134e4a' },
  { color:'#F97316', card:'#FFEDD5', tagText:'#7c2d12' },
  { color:'#6366F1', card:'#E0E7FF', tagText:'#3730a3' },
  { color:'#84CC16', card:'#ECFCCB', tagText:'#365314' },
  { color:'#06B6D4', card:'#CFFAFE', tagText:'#164e63' },
  { color:'#F43F5E', card:'#FFE4E6', tagText:'#881337' },
];

function getColorScheme(savedColor, fallbackIndex) {
  if (savedColor) {
    var match = PALETTE.find(function(p) { return p.color === savedColor; });
    if (match) return { card: match.card, tag: match.color, tagText: match.tagText };
  }
  var p = PALETTE[fallbackIndex % PALETTE.length];
  return { card: p.card, tag: p.color, tagText: p.tagText };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconCalendarSmall() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'14px',height:'14px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function IconPin() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'14px',height:'14px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconVirtual() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'14px',height:'14px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function IconGlobe() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'14px',height:'14px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconRecurring() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'13px',height:'13px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function IconUsers() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'14px',height:'14px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconSearch() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'16px',height:'16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function IconClose() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'12px',height:'12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>; }
function IconEmptyCalendar() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'56px',height:'56px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function IconAlert() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'40px',height:'40px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>; }
function IconPlus() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'15px',height:'15px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>; }
function IconPalette() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'13px',height:'13px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>; }

function formatDate(isoStr) { if (!isoStr) return ''; return new Date(isoStr).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' }); }
function formatTime(isoStr) { if (!isoStr) return ''; return new Date(isoStr).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }); }
function getEventType(event) {
  if (event.is_virtual && event.location && event.location !== 'Virtual Event') return 'hybrid';
  if (event.is_virtual || event.location === 'Virtual Event') return 'virtual';
  return 'in-person';
}
function getEventTypeLabel(event) {
  var t = getEventType(event);
  if (t === 'virtual') return 'Virtual';
  if (t === 'hybrid')  return 'Hybrid';
  return 'In-Person';
}

var cardShadow = '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)';

function EventListSkeleton() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'24px', marginTop:'20px' }}>
      {[1,2,3,4,5,6].map(function(n) {
        return (
          <div key={n} className="animate-pulse" style={{ background:'#E2E8F0', borderRadius:'12px', padding:'16px', minHeight:'180px', boxShadow:cardShadow }}>
            <div style={{ width:'60px', height:'18px', background:'#CBD5E1', borderRadius:'3px', marginBottom:'10px' }} />
            <div style={{ width:'90%', height:'16px', background:'#CBD5E1', borderRadius:'3px', marginBottom:'8px' }} />
            <div style={{ width:'70%', height:'14px', background:'#CBD5E1', borderRadius:'3px', marginBottom:'6px' }} />
            <div style={{ width:'50%', height:'14px', background:'#CBD5E1', borderRadius:'3px', marginBottom:'16px' }} />
            <div style={{ width:'80px', height:'28px', background:'#CBD5E1', borderRadius:'4px', marginLeft:'auto' }} />
          </div>
        );
      })}
    </div>
  );
}

function PostItEventCard({ event, colorScheme, isOrgScoped }) {
  var navigate = useNavigate();
  var type = getEventType(event);
  return (
    <article
      role="listitem"
      style={{ background:colorScheme.card, borderRadius:'12px', padding:'16px', position:'relative', cursor:'pointer', boxShadow:cardShadow, transition:'box-shadow 0.15s ease' }}
      onClick={function() { navigate('/events/' + event.id); }}
      tabIndex={0}
      onKeyDown={function(e) { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); navigate('/events/'+event.id); } }}
      onMouseEnter={function(e) { e.currentTarget.style.boxShadow = '4px 6px 18px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)'; }}
      onMouseLeave={function(e) { e.currentTarget.style.boxShadow = cardShadow; }}
      aria-label={event.title + ' event'}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'3px', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', background:colorScheme.tag, color:colorScheme.tagText }}>
          {type==='virtual'   && <IconVirtual />}
          {type==='hybrid'    && <IconGlobe />}
          {type==='in-person' && <IconPin />}
          {getEventTypeLabel(event)}
        </span>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          {event.is_recurring && <span title="Recurring event" style={{ color:'#374151' }}><IconRecurring /></span>}
          {event.is_rescheduled && <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'16px', height:'16px', borderRadius:'50%', border:'2px solid #374151', color:'#374151', fontSize:'9px', fontWeight:800 }} title="Rescheduled" aria-label="Rescheduled">R</span>}
        </div>
      </div>

      <div style={{ fontSize:'17px', fontWeight:400, color:'#374151', lineHeight:1.5, marginBottom:'10px', fontFamily:"'Patrick Hand', sans-serif" }}>{event.title}</div>

      <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#374151', marginBottom:'5px' }}>
        <IconCalendarSmall />
        <span>{formatDate(event.start_time)}{event.start_time ? ' · ' + formatTime(event.start_time) : ''}</span>
      </div>

      {event.location && event.location !== 'Virtual Event' && (
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#374151', marginBottom:'5px' }}>
          <IconPin />
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event.location}</span>
        </div>
      )}

      {!isOrgScoped && event.organizations && (
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'#6B7280', marginBottom:'12px' }}>
          <IconUsers />
          <span>{event.organizations.name}</span>
        </div>
      )}

      {event.is_rescheduled && event.original_start_time && (
        <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'10px' }}>
          <span style={{ textDecoration:'line-through' }}>Was: {formatDate(event.original_start_time)}</span>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'4px' }}>
        <button onClick={function(e) { e.stopPropagation(); navigate('/events/'+event.id); }} style={{ padding:'5px 12px', borderRadius:'4px', fontSize:'11px', fontWeight:700, border:'none', cursor:'pointer', background:colorScheme.tag, color:colorScheme.tagText }} aria-label={'View '+event.title} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
          View Event
        </button>
      </div>
    </article>
  );
}

function EventList() {
var params = useParams();
  var organizationId = params.organizationId || params.id || null;

  var outletContext = null;
  try { outletContext = useOutletContext(); } catch(e) {}
  var isAdmin    = !!(outletContext && outletContext.isAdmin);
  var orgName    = outletContext && outletContext.organization ? outletContext.organization.name : '';
  if (!organizationId && outletContext && outletContext.organization) {
    organizationId = outletContext.organization.id;
  }
  var isOrgScoped = !!organizationId;

  var [events, setEvents]                   = useState([]);
  var [filteredEvents, setFilteredEvents]   = useState([]);
  var [organizations, setOrganizations]     = useState([]);
  var [currentUserId, setCurrentUserId]     = useState(null);
  var [savedOrgColors, setSavedOrgColors]   = useState({});
  var [loading, setLoading]                 = useState(true);
  var [error, setError]                     = useState(null);
  var [searchTerm, setSearchTerm]           = useState('');
  var [selectedOrg, setSelectedOrg]         = useState('all');
  var [dateFilter, setDateFilter]           = useState('upcoming');
  var [sortOrder, setSortOrder]             = useState('asc');
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [openPickerFor, setOpenPickerFor]     = useState(null);

  useEffect(function() {
    var link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(function() { fetchEventsAndOrganizations(); }, [organizationId]);

  async function fetchEventsAndOrganizations() {
    try {
      setLoading(true); setError(null);
      var userRes = await supabase.auth.getUser();
      if (userRes.error) throw userRes.error;
      if (!userRes.data.user) { setError('You must be logged in to view events'); setLoading(false); return; }
      var user = userRes.data.user;
      setCurrentUserId(user.id);

      var { data: prefData } = await supabase
        .from('dashboard_preferences').select('org_colors').eq('user_id', user.id).single();
      if (prefData && prefData.org_colors) setSavedOrgColors(prefData.org_colors);

      var { data: memberships, error: membershipError } = await supabase
        .from('memberships').select('organization_id, organizations(id, name)')
        .eq('member_id', user.id).eq('status', 'active');
      if (membershipError) throw membershipError;

      var userOrgs = (memberships || []).map(function(m) { return m.organizations; });
      setOrganizations(userOrgs);

      var eventsQuery;
      if (isOrgScoped) {
        eventsQuery = supabase.from('events').select('*, organizations(name)').eq('organization_id', organizationId).order('start_time', { ascending:true });
      } else {
        var orgIds = userOrgs.map(function(o) { return o.id; });
        if (orgIds.length === 0) { setEvents([]); setFilteredEvents([]); setLoading(false); return; }
        eventsQuery = supabase.from('events').select('*, organizations(name)').in('organization_id', orgIds).order('start_time', { ascending:true });
      }

      var { data: eventsData, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;

      var visibleEvents = (eventsData || []).filter(function(ev) { return !ev.is_recurring || ev.parent_event_id; });
      setEvents(visibleEvents);
      setFilteredEvents(visibleEvents);
    } catch(err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleColorPick(orgId, color) {
    var newColors = Object.assign({}, savedOrgColors, { [orgId]: color });
    setSavedOrgColors(newColors);
    setOpenPickerFor(null);
    if (!currentUserId) return;
    await supabase.from('dashboard_preferences').upsert(
      { user_id: currentUserId, org_colors: newColors, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  }

  useEffect(function() {
    var filtered = events.slice();
    var now = new Date();
    if (searchTerm) {
      filtered = filtered.filter(function(ev) {
        return ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ev.description && ev.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (ev.location && ev.location.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }
    if (!isOrgScoped && selectedOrg !== 'all') {
      filtered = filtered.filter(function(ev) { return ev.organization_id === selectedOrg; });
    }
    if (dateFilter === 'upcoming') { filtered = filtered.filter(function(ev) { return new Date(ev.start_time) >= now; }); }
    else if (dateFilter === 'past') { filtered = filtered.filter(function(ev) { return new Date(ev.start_time) < now; }); }
    filtered.sort(function(a, b) { var da=new Date(a.start_time), db=new Date(b.start_time); return sortOrder==='asc'?da-db:db-da; });
    setFilteredEvents(filtered);
  }, [searchTerm, selectedOrg, dateFilter, sortOrder, events]);

  var hasActiveFilters = searchTerm || (!isOrgScoped && selectedOrg !== 'all') || dateFilter !== 'upcoming';
  function clearAll() { setSearchTerm(''); setSelectedOrg('all'); setDateFilter('upcoming'); }

  var listViewPath     = isOrgScoped ? '/organizations/' + organizationId + '/events'   : '/events';
  var calendarViewPath = isOrgScoped ? '/organizations/' + organizationId + '/calendar' : '/calendar';

  var inputStyle = { width:'100%', padding:'8px 12px', fontSize:'13px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#0E1523', outline:'none' };
  var labelStyle = { display:'block', fontSize:'12px', fontWeight:700, color:'#475569', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' };

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC' }}>

      {/* Click-outside overlay for color picker */}
      {openPickerFor && (
        <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={function() { setOpenPickerFor(null); }} aria-hidden="true" />
      )}

      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'24px 16px' }}>
        <PageHeader
          title={isOrgScoped ? 'Events' : 'All Events'}
          subtitle={loading ? 'Loading events...' : filteredEvents.length+' event'+(filteredEvents.length!==1?'s':'')+(dateFilter==='upcoming'?' upcoming':dateFilter==='past'?' past':' total')}
          backTo={null} backLabel={null}
          actions={
            <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
              {isOrgScoped && isAdmin && (
                <button onClick={function() { setShowCreateModal(true); }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#3B82F6', border:'none', borderRadius:'8px', color:'#fff', fontWeight:700, fontSize:'13px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Create a new event">
                  <IconPlus /> Create Event
                </button>
              )}
              <Link to={listViewPath} style={{ padding:'8px 14px', background:'#3B82F6', border:'none', borderRadius:'8px', color:'#fff', fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-current="page">List View</Link>
              <Link to={calendarViewPath} style={{ padding:'8px 14px', background:'transparent', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#475569', fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Calendar View</Link>
            </div>
          }
        />

        {/* Filters */}
        <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'16px', marginTop:'20px', boxShadow:cardShadow }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'16px' }}>
            <div>
              <label htmlFor="el-search" style={labelStyle}>Search</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#64748B' }}><IconSearch /></span>
                <input id="el-search" type="text" placeholder="Name, location..." value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }} style={Object.assign({}, inputStyle, { paddingLeft:'32px' })} aria-label="Search events" className="focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {!isOrgScoped && organizations.length > 1 && (
              <div>
                <label htmlFor="el-org-filter" style={labelStyle}>Organization</label>
                <select id="el-org-filter" value={selectedOrg} onChange={function(e) { setSelectedOrg(e.target.value); }} style={inputStyle} aria-label="Filter by organization" className="focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Organizations</option>
                  {organizations.map(function(org) { return <option key={org.id} value={org.id}>{org.name}</option>; })}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="el-date-filter" style={labelStyle}>Time Period</label>
              <select id="el-date-filter" value={dateFilter} onChange={function(e) { setDateFilter(e.target.value); }} style={inputStyle} aria-label="Filter by time period" className="focus:ring-2 focus:ring-blue-500">
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="all">All Events</option>
              </select>
            </div>
            <div>
              <label htmlFor="el-sort-order" style={labelStyle}>Sort</label>
              <select id="el-sort-order" value={sortOrder} onChange={function(e) { setSortOrder(e.target.value); }} style={inputStyle} aria-label="Sort events" className="focus:ring-2 focus:ring-blue-500">
                <option value="asc">Earliest First</option>
                <option value="desc">Latest First</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'8px', marginTop:'14px', paddingTop:'14px', borderTop:'1px solid #E2E8F0' }}>
              <span style={{ fontSize:'12px', fontWeight:700, color:'#64748B' }}>Filters:</span>
              {searchTerm && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'99px', fontSize:'12px', color:'#3B82F6' }}>
                  "{searchTerm}"
                  <button onClick={function() { setSearchTerm(''); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#3B82F6', padding:'0', display:'flex' }} aria-label="Clear search"><IconClose /></button>
                </span>
              )}
              {!isOrgScoped && selectedOrg !== 'all' && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'99px', fontSize:'12px', color:'#3B82F6' }}>
                  {(organizations.find(function(o) { return o.id===selectedOrg; })||{}).name||'Org'}
                  <button onClick={function() { setSelectedOrg('all'); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#3B82F6', padding:'0', display:'flex' }} aria-label="Clear org filter"><IconClose /></button>
                </span>
              )}
              {dateFilter !== 'upcoming' && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'99px', fontSize:'12px', color:'#3B82F6' }}>
                  {dateFilter==='past' ? 'Past Events' : 'All Events'}
                  <button onClick={function() { setDateFilter('upcoming'); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#3B82F6', padding:'0', display:'flex' }} aria-label="Clear date filter"><IconClose /></button>
                </span>
              )}
              <button onClick={clearAll} style={{ fontSize:'12px', fontWeight:600, color:'#64748B', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:'4px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Clear all</button>
            </div>
          )}
        </div>

{/* Org color customizer — only shown on unified list view */}
        {!isOrgScoped && !loading && organizations.length > 0 && (
          <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'16px', marginTop:'12px', boxShadow:cardShadow }}>
            <p style={{ fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px' }}>Card Colors</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
              {organizations.map(function(org, index) {
                var scheme = getColorScheme(savedOrgColors[org.id], index);
                var isOpen = openPickerFor === org.id;
                return (
                  <div key={org.id} style={{ position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 10px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0' }}>
                      <div style={{ width:'14px', height:'14px', borderRadius:'4px', background:scheme.card, border:'1px solid '+scheme.tag, flexShrink:0 }} aria-hidden="true" />
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#0E1523' }}>{org.name}</span>
                      <button
                        onClick={function(e) { e.stopPropagation(); setOpenPickerFor(isOpen ? null : org.id); }}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', alignItems:'center', padding:'2px' }}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        aria-label={'Change card color for ' + org.name}
                        title="Change color">
                        <IconPalette />
                      </button>
                    </div>
                    {isOpen && (
                      <div
                        onClick={function(e) { e.stopPropagation(); }}
                        style={{ position:'absolute', top:'calc(100% + 8px)', left:0, zIndex:11, background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'10px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'6px', width:'172px' }}
                        role="listbox"
                        aria-label={'Color options for ' + org.name}>
                        {PALETTE.map(function(p) {
                          var selected = (savedOrgColors[org.id] || PALETTE[index % PALETTE.length].color) === p.color;
                          return (
                            <button
                              key={p.color}
                              role="option"
                              aria-selected={selected}
                              onClick={function() { handleColorPick(org.id, p.color); }}
                              style={{ width:'22px', height:'22px', borderRadius:'5px', background:p.card, border:selected?'3px solid #0E1523':'2px solid '+p.color, cursor:'pointer' }}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label={p.color}
                              title={p.color}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <EventListSkeleton />
        ) : error ? (
          <div style={{ marginTop:'48px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', textAlign:'center' }} role="alert">
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'#FEF2F2', border:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', color:'#EF4444' }}>
              <IconAlert />
            </div>
            <h2 style={{ fontSize:'20px', fontWeight:700, color:'#0E1523' }}>Could not load events</h2>
            <p style={{ color:'#475569', maxWidth:'360px' }}>{error}</p>
            <button onClick={fetchEventsAndOrganizations} style={{ padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Try Again</button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ marginTop:'48px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', textAlign:'center' }}>
            <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'#EFF6FF', border:'1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:'#3B82F6' }}>
              <IconEmptyCalendar />
            </div>
            <h3 style={{ fontSize:'20px', fontWeight:700, color:'#0E1523' }}>No events found</h3>
            <p style={{ color:'#475569', maxWidth:'360px', lineHeight:1.6 }}>
              {hasActiveFilters ? 'Try adjusting your filters to see more events.' : isOrgScoped ? 'No events have been created for this organization yet.' : 'No events available yet. Check back soon!'}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearAll} style={{ padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer', marginTop:'8px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Clear All Filters</button>
            ) : isOrgScoped && isAdmin ? (
              <button onClick={function() { setShowCreateModal(true); }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer', marginTop:'8px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <IconPlus /> Create Your First Event
              </button>
            ) : null}
          </div>
        ) : (
          <div role="list" aria-label="Events" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'24px', marginTop:'20px' }}>
            {filteredEvents.map(function(event, index) {
              var orgIndex = organizations.findIndex(function(o) { return o.id === event.organization_id; });
              var fallback = orgIndex >= 0 ? orgIndex : index;
              var scheme = getColorScheme(savedOrgColors[event.organization_id], fallback);
              return <PostItEventCard key={event.id} event={event} colorScheme={scheme} isOrgScoped={isOrgScoped} />;
            })}
          </div>
        )}
      </div>

      {isOrgScoped && (
        <CreateEvent
          isOpen={showCreateModal}
          onClose={function() { setShowCreateModal(false); }}
          onSuccess={function() { setShowCreateModal(false); fetchEventsAndOrganizations(); }}
          organizationId={organizationId}
          organizationName={orgName}
        />
      )}
    </div>
  );
}

export default EventList;