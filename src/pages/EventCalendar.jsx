import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useNavigate, Link, useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import CreateEvent from '../components/CreateEvent';

var locales = { 'en-US': enUS };
var localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

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

function IconRecurring({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function IconPin({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconVirtual({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function IconHybrid({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconCalendarEmpty({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-12 w-12'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function IconChevronLeft({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>; }
function IconChevronRight({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>; }
function IconAlert({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-10 w-10'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>; }
function IconPlus() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'15px',height:'15px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>; }
function IconPalette() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'13px',height:'13px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>; }

function RescheduledBadge({ size }) {
  var s = size || 16;
  return <span title="Rescheduled" aria-label="Rescheduled" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:s+'px', height:s+'px', borderRadius:'50%', border:'2px solid #FFFFFF', color:'#FFFFFF', fontSize:Math.round(s*0.55)+'px', fontWeight:800, flexShrink:0, lineHeight:1 }}>R</span>;
}

function CalendarSkeleton() {
  return (
    <div style={{ background:'#FFFFFF', borderRadius:'12px', border:'1px solid #E2E8F0', padding:'24px', boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'24px', gap:'12px' }}>
        <div style={{ display:'flex', gap:'8px' }}>{[72,36,140,36].map(function(w,i){ return <div key={i} style={{ width:w+'px', height:'36px', background:'#E2E8F0', borderRadius:'8px' }} className="animate-pulse" />; })}</div>
        <div style={{ display:'flex', gap:'8px' }}>{[160,180].map(function(w,i){ return <div key={i} style={{ width:w+'px', height:'36px', background:'#E2E8F0', borderRadius:'8px' }} className="animate-pulse" />; })}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'1px', background:'#E2E8F0' }}>
        {Array.from({length:7}).map(function(_,i){ return <div key={i} style={{ background:'#FFFFFF', padding:'8px', textAlign:'center' }}><div style={{ width:'32px', height:'12px', background:'#F1F5F9', borderRadius:'4px', margin:'0 auto' }} className="animate-pulse" /></div>; })}
        {Array.from({length:35}).map(function(_,i){ return <div key={i} style={{ background:'#FFFFFF', padding:'8px', minHeight:'80px' }}><div style={{ width:'20px', height:'12px', background:'#F1F5F9', borderRadius:'4px', marginBottom:'6px' }} className="animate-pulse" />{i%4===0&&<div style={{ width:'90%', height:'18px', background:'#F1F5F9', borderRadius:'4px' }} className="animate-pulse" />}</div>; })}
      </div>
    </div>
  );
}

var cardShadow = '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)';

function EventCalendar() {
  var navigate = useNavigate();
  var { organizationId } = useParams();

  var outletContext = null;
  try { outletContext = useOutletContext(); } catch(e) {}
  var isAdmin    = !!(outletContext && outletContext.isAdmin);
  var orgName    = outletContext && outletContext.organization ? outletContext.organization.name : '';
  var isOrgScoped = !!organizationId;

  var [events, setEvents]                   = useState([]);
  var [organizations, setOrganizations]     = useState([]);
  var [currentUserId, setCurrentUserId]     = useState(null);
  var [savedOrgColors, setSavedOrgColors]   = useState({});
  var [selectedOrg, setSelectedOrg]         = useState('all');
  var [view, setView]                       = useState('month');
  var [date, setDate]                       = useState(new Date());
  var [loading, setLoading]                 = useState(true);
  var [error, setError]                     = useState(null);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [openPickerFor, setOpenPickerFor]     = useState(null);

  useEffect(function() { fetchOrganizationsAndEvents(); }, [organizationId]);

  async function fetchOrganizationsAndEvents() {
    try {
      setLoading(true); setError(null);
      var userRes = await supabase.auth.getUser();
      if (userRes.error) throw userRes.error;
      if (!userRes.data.user) { navigate('/login'); return; }
      var user = userRes.data.user;
      setCurrentUserId(user.id);

      var { data: prefData } = await supabase
        .from('dashboard_preferences').select('org_colors').eq('user_id', user.id).single();
      if (prefData && prefData.org_colors) setSavedOrgColors(prefData.org_colors);

      var { data: memberships, error: membershipsError } = await supabase
        .from('memberships').select('organization_id, organizations(id, name)')
        .eq('member_id', user.id).eq('status', 'active');
      if (membershipsError) throw membershipsError;

      var userOrgs = (memberships || []).map(function(m) { return { id:m.organizations.id, name:m.organizations.name }; });
      setOrganizations(userOrgs);

      var eventsQuery;
      if (isOrgScoped) {
        eventsQuery = supabase.from('events')
          .select('id,title,start_time,end_time,location,is_virtual,organization_id,is_recurring,parent_event_id,is_rescheduled,organizations(name)')
          .eq('organization_id', organizationId).order('start_time', { ascending:true });
      } else {
        var orgIds = userOrgs.map(function(o) { return o.id; });
        if (orgIds.length === 0) { setEvents([]); setLoading(false); return; }
        eventsQuery = supabase.from('events')
          .select('id,title,start_time,end_time,location,is_virtual,organization_id,is_recurring,parent_event_id,is_rescheduled,organizations(name)')
          .in('organization_id', orgIds).in('visibility', ['public','members']).order('start_time', { ascending:true });
      }

      var { data: eventsData, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch(err) {
      console.error('Error fetching data:', err);
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

  function getOrgColor(orgId, fallbackIndex) {
    return savedOrgColors[orgId] || PALETTE[fallbackIndex % PALETTE.length].color;
  }

  function getEventType(ev) {
    if (ev.is_virtual && ev.location && ev.location !== 'Virtual Event') return 'hybrid';
    if (ev.is_virtual || ev.location === 'Virtual Event') return 'virtual';
    return 'in-person';
  }

  var calendarEvents = useMemo(function() {
    var filtered = events.filter(function(ev) { return !ev.is_recurring || ev.parent_event_id; });
    if (!isOrgScoped && selectedOrg !== 'all') {
      filtered = filtered.filter(function(e) { return e.organization_id === selectedOrg; });
    }
    return filtered.map(function(ev) {
      var orgIndex = organizations.findIndex(function(o) { return o.id === ev.organization_id; });
      var color = getOrgColor(ev.organization_id, orgIndex >= 0 ? orgIndex : 0);
      return {
        id: ev.id, title: ev.title,
        start: new Date(ev.start_time),
        end: ev.end_time ? new Date(ev.end_time) : new Date(ev.start_time),
        resource: {
          organizationName: ev.organizations ? ev.organizations.name : '',
          color: color,
          isRecurring: ev.is_recurring,
          eventType: getEventType(ev),
          isRescheduled: ev.is_rescheduled || false,
        }
      };
    });
  }, [events, selectedOrg, organizations, savedOrgColors]);

  function eventStyleGetter(event) {
    return { style: { backgroundColor:event.resource.color, borderRadius:'6px', opacity:0.9, color:'white', border:'2px solid '+event.resource.color, display:'block', fontSize:'0.8rem', fontWeight:'500', padding:'2px 5px' } };
  }

  function handleSelectEvent(event) { navigate('/events/' + event.id); }

  function CustomEvent({ event }) {
    var r = event.resource;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'3px', overflow:'hidden' }}>
        {r.isRecurring             && <span title="Recurring"  style={{ flexShrink:0 }}><IconRecurring cls="h-3 w-3" /></span>}
        {r.eventType==='virtual'   && <span title="Virtual"    style={{ flexShrink:0 }}><IconVirtual   cls="h-3 w-3" /></span>}
        {r.eventType==='hybrid'    && <span title="Hybrid"     style={{ flexShrink:0 }}><IconHybrid    cls="h-3 w-3" /></span>}
        {r.eventType==='in-person' && <span title="In-Person"  style={{ flexShrink:0 }}><IconPin       cls="h-3 w-3" /></span>}
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.78rem', flex:1 }}>{event.title}</span>
        {r.isRescheduled && <RescheduledBadge size={15} />}
      </div>
    );
  }

  // Defined inside component so it closes over view, setView, isOrgScoped, organizationId,
  // organizations, selectedOrg, setSelectedOrg — passed via components prop so RBC
  // supplies correct onNavigate('PREV'/'NEXT'/'TODAY') and onView.
  function CustomToolbar(toolbar) {
    var listViewPath = isOrgScoped ? '/organizations/' + organizationId + '/events' : '/events';
    return (
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <button onClick={function() { toolbar.onNavigate('TODAY'); }} style={{ padding:'6px 14px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'13px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Go to today">Today</button>
          <button onClick={function() { toolbar.onNavigate('PREV'); }} style={{ padding:'6px', background:'transparent', border:'1px solid #E2E8F0', borderRadius:'8px', cursor:'pointer', color:'#475569', display:'flex', alignItems:'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Previous"><IconChevronLeft cls="h-4 w-4" /></button>
          <span style={{ fontSize:'16px', fontWeight:700, color:'#0E1523', minWidth:'140px', textAlign:'center' }}>{format(toolbar.date, 'MMMM yyyy')}</span>
          <button onClick={function() { toolbar.onNavigate('NEXT'); }} style={{ padding:'6px', background:'transparent', border:'1px solid #E2E8F0', borderRadius:'8px', cursor:'pointer', color:'#475569', display:'flex', alignItems:'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Next"><IconChevronRight cls="h-4 w-4" /></button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', background:'#F1F5F9', borderRadius:'8px', padding:'3px' }}>
            {['month','week','day'].map(function(v) {
              var active = view === v;
              return (
                <button key={v} onClick={function() { setView(v); toolbar.onView(v); }} style={{ padding:'5px 12px', borderRadius:'6px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', background:active?'#FFFFFF':'transparent', color:active?'#0E1523':'#64748B', boxShadow:active?'0 1px 3px rgba(0,0,0,0.12)':'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={v+' view'} aria-pressed={active}>
                  {v.charAt(0).toUpperCase()+v.slice(1)}
                </button>
              );
            })}
          </div>
          {!isOrgScoped && organizations.length > 1 && (
            <select value={selectedOrg} onChange={function(e) { setSelectedOrg(e.target.value); }} style={{ padding:'6px 12px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#0E1523', fontSize:'13px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Filter by organization">
              <option value="all">All Organizations</option>
              {organizations.map(function(org) { return <option key={org.id} value={org.id}>{org.name}</option>; })}
            </select>
          )}
          <Link to={listViewPath} style={{ padding:'6px 14px', background:'transparent', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#475569', fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">List View</Link>
        </div>
      </div>
    );
  }

  var listViewPath     = isOrgScoped ? '/organizations/' + organizationId + '/events'   : '/events';
  var calendarViewPath = isOrgScoped ? '/organizations/' + organizationId + '/calendar' : '/calendar';

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC' }}>
      <style>{
        '.rbc-time-header-content > .rbc-row { min-height: 50px !important; }' +
        '.rbc-header { padding: 8px 4px !important; white-space: normal !important; min-height: 50px !important; color: #475569; background: #FFFFFF; border-color: #E2E8F0 !important; }' +
        '.rbc-allday-cell { display: none !important; }' +
        '.rbc-month-view, .rbc-time-view { border-color: #E2E8F0 !important; background: #FFFFFF; }' +
        '.rbc-day-bg { background: #FFFFFF; }' +
        '.rbc-off-range-bg { background: #F8FAFC; }' +
        '.rbc-today { background: #EFF6FF !important; }' +
        '.rbc-date-cell { color: #475569; padding: 4px 8px; }' +
        '.rbc-date-cell.rbc-off-range { color: #94A3B8; }' +
        '.rbc-month-row + .rbc-month-row { border-top: 1px solid #E2E8F0; }' +
        '.rbc-day-bg + .rbc-day-bg { border-left: 1px solid #E2E8F0; }' +
        '.rbc-time-content { border-color: #E2E8F0 !important; }' +
        '.rbc-time-slot { color: #94A3B8; border-color: #E2E8F0; }' +
        '.rbc-timeslot-group { border-color: #E2E8F0; }' +
        '.rbc-current-time-indicator { background: #3B82F6; }' +
        '.rbc-show-more { color: #3B82F6; font-weight: 600; font-size: 12px; }' +
        '.rbc-event:focus { outline: 2px solid #3B82F6; outline-offset: 2px; }'
      }</style>

      {/* Click-outside overlay for color picker */}
      {openPickerFor && (
        <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={function() { setOpenPickerFor(null); }} aria-hidden="true" />
      )}

      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'24px 16px' }}>
        <PageHeader
          title="Event Calendar"
          subtitle={isOrgScoped ? 'Showing events for this organization' : 'View events from all your organizations'}
          backTo={null} backLabel={null}
          actions={
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              {isOrgScoped && isAdmin && (
                <button onClick={function() { setShowCreateModal(true); }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#3B82F6', border:'none', borderRadius:'8px', color:'#fff', fontWeight:700, fontSize:'13px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Create a new event">
                  <IconPlus /> Create Event
                </button>
              )}
              <Link to={listViewPath} style={{ padding:'8px 16px', background:'transparent', border:'1px solid #E2E8F0', borderRadius:'8px', color:'#475569', fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">List View</Link>
              <Link to={calendarViewPath} style={{ padding:'8px 16px', background:'#3B82F6', border:'none', borderRadius:'8px', color:'#fff', fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Calendar View</Link>
            </div>
          }
        />

        {loading ? (
          <div style={{ marginTop:'24px' }} aria-busy="true" aria-label="Loading calendar">
            <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'16px', marginBottom:'16px', display:'flex', gap:'12px', boxShadow:cardShadow }}>
              {[100,130,110].map(function(w,i) { return <div key={i} style={{ width:w+'px', height:'28px', background:'#E2E8F0', borderRadius:'8px' }} className="animate-pulse" />; })}
            </div>
            <CalendarSkeleton />
          </div>

        ) : error ? (
          <div style={{ marginTop:'48px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', textAlign:'center' }} role="alert">
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'#FEF2F2', border:'1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', color:'#EF4444' }}>
              <IconAlert cls="h-8 w-8" />
            </div>
            <h2 style={{ fontSize:'20px', fontWeight:700, color:'#0E1523' }}>Could not load calendar</h2>
            <p style={{ color:'#475569', maxWidth:'360px' }}>{error}</p>
            <button onClick={fetchOrganizationsAndEvents} style={{ padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Try Again</button>
          </div>

        ) : (
          <>
            {/* Org legend + color pickers */}
            {organizations.length > 0 && events.length > 0 && (
              <div style={{ marginTop:'24px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'16px', boxShadow:cardShadow }}>
                <p style={{ fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px' }}>Organizations</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                  {organizations.map(function(org, index) {
                    var color = getOrgColor(org.id, index);
                    var count = events.filter(function(e) { return e.organization_id===org.id; }).length;
                    var isOpen = openPickerFor === org.id;
                    return (
                      <div key={org.id} style={{ position:'relative' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 10px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid #E2E8F0' }}>
                          <div style={{ width:'12px', height:'12px', borderRadius:'3px', background:color, flexShrink:0 }} aria-hidden="true" />
                          <span style={{ fontSize:'13px', fontWeight:600, color:'#0E1523' }}>{org.name}</span>
                          <span style={{ fontSize:'12px', color:'#64748B' }}>({count})</span>
                          <button
                            onClick={function(e) { e.stopPropagation(); setOpenPickerFor(isOpen ? null : org.id); }}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', display:'flex', alignItems:'center', padding:'2px' }}
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            aria-label={'Change color for ' + org.name}
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
                              var selected = color === p.color;
                              return (
                                <button
                                  key={p.color}
                                  role="option"
                                  aria-selected={selected}
                                  onClick={function() { handleColorPick(org.id, p.color); }}
                                  style={{ width:'22px', height:'22px', borderRadius:'5px', background:p.color, border:selected?'3px solid #0E1523':'2px solid transparent', cursor:'pointer' }}
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

            {/* Calendar */}
            <div style={{ marginTop:'16px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'20px', boxShadow:cardShadow }}>
              {events.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', padding:'64px 24px', textAlign:'center' }}>
                  <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'#EFF6FF', border:'1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:'#3B82F6' }}>
                    <IconCalendarEmpty cls="h-9 w-9" />
                  </div>
                  <h3 style={{ fontSize:'20px', fontWeight:700, color:'#0E1523' }}>No events yet</h3>
                  <p style={{ color:'#475569', maxWidth:'360px', lineHeight:1.6 }}>
                    {isOrgScoped ? 'No events have been created for this organization yet.' : organizations.length===0 ? "You're not a member of any organizations yet." : "Your organizations haven't created any events yet."}
                  </p>
                  {isOrgScoped && isAdmin && (
                    <button onClick={function() { setShowCreateModal(true); }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer', marginTop:'8px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      <IconPlus /> Create Your First Event
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ height:'680px' }}>
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
                    selectable
                    eventPropGetter={eventStyleGetter}
                    components={{ toolbar: CustomToolbar, event: CustomEvent }}
                    popup
                    tooltipAccessor={function(event) { return event.title+' — '+event.resource.organizationName+(event.resource.isRescheduled?' (Rescheduled)':''); }}
                    style={{ height:'100%' }}
                  />
                </div>
              )}
            </div>

            {/* Legend */}
            {events.length > 0 && (
              <div style={{ marginTop:'16px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'16px', boxShadow:cardShadow }}>
                <p style={{ fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px' }}>Legend</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'20px' }}>
                  {[
                    { icon:<IconRecurring cls="h-4 w-4" />, label:'Recurring'   },
                    { icon:<IconPin       cls="h-4 w-4" />, label:'In-Person'   },
                    { icon:<IconVirtual   cls="h-4 w-4" />, label:'Virtual'     },
                    { icon:<IconHybrid    cls="h-4 w-4" />, label:'Hybrid'      },
                    { icon:<RescheduledBadge size={16} />,  label:'Rescheduled' },
                  ].map(function(item, i) {
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ color:'#475569' }}>{item.icon}</span>
                        <span style={{ fontSize:'13px', color:'#475569' }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isOrgScoped && (
        <CreateEvent
          isOpen={showCreateModal}
          onClose={function() { setShowCreateModal(false); }}
          onSuccess={function() { setShowCreateModal(false); fetchOrganizationsAndEvents(); }}
          organizationId={organizationId}
          organizationName={orgName}
        />
      )}
    </div>
  );
}

export default EventCalendar;