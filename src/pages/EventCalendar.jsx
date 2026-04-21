import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useNavigate, Link, useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import CreateEvent from '../components/CreateEvent';

var locales = { 'en-US': enUS };
var localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

var orgColors = { 0:'#3b82f6', 1:'#10b981', 2:'#f59e0b', 3:'#ef4444', 4:'#8b5cf6', 5:'#ec4899', 6:'#14b8a6', 7:'#f97316' };

function IconRecurring({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function IconPin({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function IconVirtual({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function IconHybrid({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-3.5 w-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconCalendarEmpty({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-12 w-12'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function IconChevronLeft({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>; }
function IconChevronRight({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>; }
function IconAlert({ cls }) { return <svg xmlns="http://www.w3.org/2000/svg" className={cls||'h-12 w-12'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>; }
function IconPlus() { return <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'15px',height:'15px',flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>; }

function RescheduledBadge({ size }) {
  var s = size || 16;
  return (
    <span title="Rescheduled" aria-label="Rescheduled" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:s+'px', height:s+'px', borderRadius:'50%', border:'2px solid #FFFFFF', color:'#FFFFFF', fontSize:Math.round(s*0.55)+'px', fontWeight:800, flexShrink:0, lineHeight:1 }}>R</span>
  );
}

function CalendarSkeleton({ isDark }) {
  var bg = isDark?'#1A2035':'#FFFFFF', border=isDark?'#2A3550':'#E2E8F0', pulse=isDark?'#2A3550':'#E2E8F0';
  return (
    <div style={{ background:bg, borderRadius:'12px', border:'1px solid '+border, padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'24px', gap:'12px' }}>
        <div style={{ display:'flex', gap:'8px' }}>{[72,36,140,36].map(function(w,i){ return <div key={i} style={{ width:w+'px', height:'36px', background:pulse, borderRadius:'8px' }} className="animate-pulse" />; })}</div>
        <div style={{ display:'flex', gap:'8px' }}>{[160,180].map(function(w,i){ return <div key={i} style={{ width:w+'px', height:'36px', background:pulse, borderRadius:'8px' }} className="animate-pulse" />; })}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'1px', background:border }}>
        {Array.from({length:7}).map(function(_,i){ return <div key={i} style={{ background:bg, padding:'8px', textAlign:'center' }}><div style={{ width:'32px', height:'12px', background:pulse, borderRadius:'4px', margin:'0 auto' }} className="animate-pulse" /></div>; })}
        {Array.from({length:35}).map(function(_,i){ return <div key={i} style={{ background:bg, padding:'8px', minHeight:'80px' }}><div style={{ width:'20px', height:'12px', background:pulse, borderRadius:'4px', marginBottom:'6px' }} className="animate-pulse" />{i%4===0&&<div style={{ width:'90%', height:'18px', background:pulse, borderRadius:'4px' }} className="animate-pulse" />}</div>; })}
      </div>
    </div>
  );
}

function EventCalendar() {
  var navigate = useNavigate();
  var { isDark } = useTheme();
  var { organizationId } = useParams();

  var outletContext = null;
  try { outletContext = useOutletContext(); } catch(e) {}
  var isAdmin  = !!(outletContext && outletContext.isAdmin);
  var orgName  = outletContext && outletContext.organization ? outletContext.organization.name : '';
  var isOrgScoped = !!organizationId;

  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';

  var [events, setEvents]               = useState([]);
  var [organizations, setOrganizations] = useState([]);
  var [selectedOrg, setSelectedOrg]     = useState('all');
  var [view, setView]                   = useState('month');
  var [date, setDate]                   = useState(new Date());
  var [loading, setLoading]             = useState(true);
  var [error, setError]                 = useState(null);
  var [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(function() { fetchOrganizationsAndEvents(); }, [organizationId]);

  async function fetchOrganizationsAndEvents() {
    try {
      setLoading(true); setError(null);
      var userRes = await supabase.auth.getUser();
      if (userRes.error) throw userRes.error;
      if (!userRes.data.user) { navigate('/login'); return; }
      var user = userRes.data.user;

      var { data: memberships, error: membershipsError } = await supabase
        .from('memberships').select('organization_id, organizations(id, name)')
        .eq('member_id', user.id).eq('status', 'active');
      if (membershipsError) throw membershipsError;

      var userOrgs = (memberships || []).map(function(m) { return { id:m.organizations.id, name:m.organizations.name }; });
      setOrganizations(userOrgs);

      var eventsQuery;
      if (isOrgScoped) {
        eventsQuery = supabase.from('events')
          .select('id,title,description,start_time,end_time,location,is_virtual,virtual_link,visibility,organization_id,is_recurring,parent_event_id,recurrence_rule,is_rescheduled,original_start_time,organizations(name)')
          .eq('organization_id', organizationId)
          .order('start_time', { ascending: true });
      } else {
        var orgIds = userOrgs.map(function(o) { return o.id; });
        if (orgIds.length === 0) { setEvents([]); setLoading(false); return; }
        eventsQuery = supabase.from('events')
          .select('id,title,description,start_time,end_time,location,is_virtual,virtual_link,visibility,organization_id,is_recurring,parent_event_id,recurrence_rule,is_rescheduled,original_start_time,organizations(name)')
          .in('organization_id', orgIds)
          .in('visibility', ['public','members'])
          .order('start_time', { ascending: true });
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

  function getEventType(event) {
    if (event.is_virtual && event.location && event.location !== 'Virtual Event') return 'hybrid';
    if (event.is_virtual || event.location === 'Virtual Event') return 'virtual';
    return 'in-person';
  }

  var calendarEvents = useMemo(function() {
    var filtered = events.filter(function(ev) {
      if (!ev.is_recurring) return true;
      if (ev.parent_event_id) return true;
      return false;
    });
    if (!isOrgScoped && selectedOrg !== 'all') {
      filtered = filtered.filter(function(e) { return e.organization_id === selectedOrg; });
    }
    return filtered.map(function(event) {
      var orgIndex = organizations.findIndex(function(org) { return org.id === event.organization_id; });
      var color = orgColors[orgIndex % Object.keys(orgColors).length];
      return {
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: event.end_time ? new Date(event.end_time) : new Date(event.start_time),
        resource: {
          organizationId: event.organization_id,
          organizationName: event.organizations ? event.organizations.name : '',
          location: event.location,
          isVirtual: event.is_virtual,
          visibility: event.visibility,
          color: color,
          isRecurring: event.is_recurring,
          parentEventId: event.parent_event_id,
          recurrenceRule: event.recurrence_rule,
          eventType: getEventType(event),
          isRescheduled: event.is_rescheduled || false,
          originalStartTime: event.original_start_time || null,
        }
      };
    });
  }, [events, selectedOrg, organizations]);

  function eventStyleGetter(event) {
    return { style: { backgroundColor:event.resource.color, borderRadius:'6px', opacity:0.9, color:'white', border:'2px solid '+event.resource.color, display:'block', fontSize:'0.8rem', fontWeight:'500', padding:'2px 5px' } };
  }

  function handleSelectEvent(event) { navigate('/events/' + event.id); }

  function CustomEvent({ event }) {
    var r = event.resource;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'3px', overflow:'hidden' }}>
        {r.isRecurring   && <span title="Recurring"  style={{ flexShrink:0 }}><IconRecurring cls="h-3 w-3" /></span>}
        {r.eventType==='virtual'   && <span title="Virtual"   style={{ flexShrink:0 }}><IconVirtual cls="h-3 w-3" /></span>}
        {r.eventType==='hybrid'    && <span title="Hybrid"    style={{ flexShrink:0 }}><IconHybrid  cls="h-3 w-3" /></span>}
        {r.eventType==='in-person' && <span title="In-Person" style={{ flexShrink:0 }}><IconPin     cls="h-3 w-3" /></span>}
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.78rem', flex:1 }}>{event.title}</span>
        {r.isRescheduled && <RescheduledBadge size={15} />}
      </div>
    );
  }

  function CustomToolbar(toolbar) {
    var listViewPath     = isOrgScoped ? '/organizations/'+organizationId+'/events'   : '/events';
    return (
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <button onClick={function(){ toolbar.onNavigate('TODAY'); }} style={{ padding:'6px 14px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'13px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Go to today">Today</button>
          <button onClick={function(){ toolbar.onNavigate('PREV'); }} style={{ padding:'6px', background:'transparent', border:'1px solid '+borderColor, borderRadius:'8px', cursor:'pointer', color:textSecondary, display:'flex', alignItems:'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Previous"><IconChevronLeft cls="h-4 w-4" /></button>
          <span style={{ fontSize:'16px', fontWeight:700, color:textPrimary, minWidth:'140px', textAlign:'center' }}>{format(toolbar.date, 'MMMM yyyy')}</span>
          <button onClick={function(){ toolbar.onNavigate('NEXT'); }} style={{ padding:'6px', background:'transparent', border:'1px solid '+borderColor, borderRadius:'8px', cursor:'pointer', color:textSecondary, display:'flex', alignItems:'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Next"><IconChevronRight cls="h-4 w-4" /></button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', background:isDark?'#0E1523':'#F1F5F9', borderRadius:'8px', padding:'3px' }}>
            {['month','week','day'].map(function(v) {
              var active = view===v;
              return (
                <button key={v} onClick={function(){ setView(v); toolbar.onView(v); }} style={{ padding:'5px 12px', borderRadius:'6px', fontSize:'13px', fontWeight:600, border:'none', cursor:'pointer', background:active?cardBg:'transparent', color:active?textPrimary:textMuted, boxShadow:active?'0 1px 3px rgba(0,0,0,0.15)':'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={v+' view'} aria-pressed={active}>
                  {v.charAt(0).toUpperCase()+v.slice(1)}
                </button>
              );
            })}
          </div>
          {/* Org filter — only in global multi-org view */}
          {!isOrgScoped && organizations.length > 1 && (
            <select value={selectedOrg} onChange={function(e){ setSelectedOrg(e.target.value); }} style={{ padding:'6px 12px', background:inputBg, border:'1px solid '+borderColor, borderRadius:'8px', color:textPrimary, fontSize:'13px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Filter by organization">
              <option value="all">All Organizations</option>
              {organizations.map(function(org){ return <option key={org.id} value={org.id}>{org.name}</option>; })}
            </select>
          )}
          {/* List View link — stays org-scoped */}
          <Link to={listViewPath} style={{ padding:'6px 14px', background:'transparent', border:'1px solid '+borderColor, borderRadius:'8px', color:textSecondary, fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">List View</Link>
        </div>
      </div>
    );
  }

  var listViewPath     = isOrgScoped ? '/organizations/'+organizationId+'/events'   : '/events';
  var calendarViewPath = isOrgScoped ? '/organizations/'+organizationId+'/calendar' : '/calendar';

  return (
    <div style={{ minHeight:'100vh', background:pageBg }}>
      <style>{`
        .rbc-time-header-content > .rbc-row { min-height: 50px !important; }
        .rbc-header { padding: 8px 4px !important; white-space: normal !important; min-height: 50px !important; color: `+textSecondary+`; background: `+cardBg+`; border-color: `+borderColor+` !important; }
        .rbc-allday-cell { display: none !important; }
        .rbc-month-view, .rbc-time-view { border-color: `+borderColor+` !important; background: `+cardBg+`; }
        .rbc-day-bg { background: `+cardBg+`; }
        .rbc-off-range-bg { background: `+(isDark?'#0E1523':'#F8FAFC')+`; }
        .rbc-today { background: `+(isDark?'#1E2845':'#EFF6FF')+` !important; }
        .rbc-date-cell { color: `+textSecondary+`; padding: 4px 8px; }
        .rbc-date-cell.rbc-off-range { color: `+textMuted+`; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid `+borderColor+`; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid `+borderColor+`; }
        .rbc-time-content { border-color: `+borderColor+` !important; }
        .rbc-time-slot { color: `+textMuted+`; border-color: `+borderColor+`; }
        .rbc-timeslot-group { border-color: `+borderColor+`; }
        .rbc-current-time-indicator { background: #3B82F6; }
      `}</style>

      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'24px 16px' }}>
        <PageHeader
          title="Event Calendar"
          subtitle={isOrgScoped ? 'Showing events for this organization' : 'View events from all your organizations'}
          backTo={null} backLabel={null}
          actions={
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              {isOrgScoped && isAdmin && (
                <button
                  onClick={function(){ setShowCreateModal(true); }}
                  style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#3B82F6', border:'none', borderRadius:'8px', color:'#fff', fontWeight:700, fontSize:'13px', cursor:'pointer' }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Create a new event"
                >
                  <IconPlus /> Create Event
                </button>
              )}
              <Link to={listViewPath} style={{ padding:'8px 16px', background:'transparent', border:'1px solid '+borderColor, borderRadius:'8px', color:textSecondary, fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">List View</Link>
              <Link to={calendarViewPath} style={{ padding:'8px 16px', background:'#3B82F6', border:'none', borderRadius:'8px', color:'#fff', fontWeight:600, fontSize:'13px', textDecoration:'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Calendar View</Link>
            </div>
          }
        />

        {loading ? (
          <div style={{ marginTop:'24px' }}>
            <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'16px', marginBottom:'16px', display:'flex', gap:'12px' }}>
              {[100,130,110].map(function(w,i){ return <div key={i} style={{ width:w+'px', height:'28px', background:isDark?'#2A3550':'#E2E8F0', borderRadius:'8px' }} className="animate-pulse" />; })}
            </div>
            <CalendarSkeleton isDark={isDark} />
          </div>
        ) : error ? (
          <div style={{ marginTop:'48px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', textAlign:'center' }} role="alert">
            <div style={{ color:'#EF4444' }}><IconAlert cls="h-12 w-12" /></div>
            <h2 style={{ fontSize:'20px', fontWeight:700, color:textPrimary }}>Could not load calendar</h2>
            <p style={{ color:textSecondary, maxWidth:'360px' }}>{error}</p>
            <button onClick={fetchOrganizationsAndEvents} style={{ padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Try Again</button>
          </div>
        ) : (
          <>
            {/* Org legend — only in global multi-org view */}
            {!isOrgScoped && organizations.length > 0 && events.length > 0 && (
              <div style={{ marginTop:'24px', background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'16px' }}>
                <p style={{ fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px' }}>Organizations</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                  {organizations.map(function(org, index) {
                    var color = orgColors[index % Object.keys(orgColors).length];
                    var count = events.filter(function(e){ return e.organization_id===org.id; }).length;
                    return (
                      <div key={org.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 12px', background:isDark?'#0E1523':'#F8FAFC', borderRadius:'8px', border:'1px solid '+borderColor }}>
                        <div style={{ width:'12px', height:'12px', borderRadius:'3px', background:color, flexShrink:0 }} aria-hidden="true" />
                        <span style={{ fontSize:'13px', fontWeight:600, color:textPrimary }}>{org.name}</span>
                        <span style={{ fontSize:'12px', color:textMuted }}>({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop:'16px', background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'20px' }}>
              {events.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', padding:'64px 24px', textAlign:'center' }}>
                  <div style={{ color:textMuted }}><IconCalendarEmpty cls="h-14 w-14" /></div>
                  <h3 style={{ fontSize:'20px', fontWeight:700, color:textPrimary }}>No events yet</h3>
                  <p style={{ color:textSecondary, maxWidth:'360px', lineHeight:1.6 }}>
                    {isOrgScoped ? 'No events have been created for this organization yet.' : organizations.length===0 ? "You're not a member of any organizations yet." : "Your organizations haven't created any events yet."}
                  </p>
                  {isOrgScoped && isAdmin && (
                    <button onClick={function(){ setShowCreateModal(true); }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer', marginTop:'8px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      <IconPlus /> Create Your First Event
                    </button>
                  )}
                  {!isOrgScoped && organizations.length > 0 && (
                    <button onClick={function(){ navigate('/organizations'); }} style={{ padding:'10px 24px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontWeight:600, fontSize:'14px', cursor:'pointer', marginTop:'8px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">View Organizations</button>
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
                    components={{ toolbar:CustomToolbar, event:CustomEvent }}
                    popup
                    tooltipAccessor={function(event){ return event.title+' — '+event.resource.organizationName+(event.resource.isRescheduled?' (Rescheduled)':''); }}
                    style={{ height:'100%' }}
                  />
                </div>
              )}
            </div>

            {events.length > 0 && (
              <div style={{ marginTop:'16px', background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'16px' }}>
                <p style={{ fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px' }}>Legend</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'20px' }}>
                  {[
                    { icon:<IconRecurring cls="h-4 w-4" />, label:'Recurring' },
                    { icon:<IconPin       cls="h-4 w-4" />, label:'In-Person' },
                    { icon:<IconVirtual   cls="h-4 w-4" />, label:'Virtual'   },
                    { icon:<IconHybrid    cls="h-4 w-4" />, label:'Hybrid'    },
                    { icon:<RescheduledBadge size={16} />,  label:'Rescheduled' },
                  ].map(function(item, i) {
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ color:textSecondary }}>{item.icon}</span>
                        <span style={{ fontSize:'13px', color:textSecondary }}>{item.label}</span>
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
          onClose={function(){ setShowCreateModal(false); }}
          onSuccess={function(){ setShowCreateModal(false); fetchOrganizationsAndEvents(); }}
          organizationId={organizationId}
          organizationName={orgName}
        />
      )}
    </div>
  );
}

export default EventCalendar;