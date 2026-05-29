import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Ico({ d, size }) {
  var paths = Array.isArray(d) ? d : [d];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size||14} height={size||14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      {paths.map(function(p,i){ return <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p}/>; })}
    </svg>
  );
}
var iClip  = ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'];
var iCheck = 'M5 13l4 4L19 7';
var iArrow = 'M13 7l5 5m0 0l-5 5m5-5H6';

function fmtDue(ds) {
  if (!ds) return null;
  var d = new Date(ds + 'T00:00:00');
  var today = new Date(); today.setHours(0,0,0,0);
  var diff = Math.floor((d - today) / 86400000);
  if (diff < 0)  return { label:'Overdue',  color:'#EF4444', bg:'#FEF2F2' };
  if (diff === 0) return { label:'Today',    color:'#D97706', bg:'#FEF3C7' };
  if (diff === 1) return { label:'Tomorrow', color:'#D97706', bg:'#FEF3C7' };
  return { label: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), color:'#94A3B8', bg:'#F1F5F9' };
}

function SkeletonRow() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 0' }} aria-hidden="true">
      <div style={{ width:'18px', height:'18px', borderRadius:'4px', background:'#E2E8F0', flexShrink:0 }} className="animate-pulse"/>
      <div style={{ flex:1 }}>
        <div style={{ height:'12px', background:'#E2E8F0', borderRadius:'4px', width:'60%', marginBottom:'5px' }} className="animate-pulse"/>
        <div style={{ height:'10px', background:'#F1F5F9', borderRadius:'4px', width:'35%' }} className="animate-pulse"/>
      </div>
    </div>
  );
}

export default function TasksWidget() {
  var navigate = useNavigate();
  var [tasks, setTasks]     = useState([]);
  var [loading, setLoading] = useState(true);
  var [userId, setUserId]   = useState(null);

  useEffect(function(){ init(); }, []);

  async function init() {
    var { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    fetchTasks(user.id);
  }

  async function fetchTasks(uid) {
    // Fetch tasks assigned to this user across all orgs, open only, due soonest first
    var { data, error } = await supabase
      .from('org_tasks')
      .select('id, title, status, priority, due_date, list_id, organization_id, org_task_lists(name, organization_id), organizations(id, name)')
      .eq('assigned_to', uid)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(20);

    if (error) { setLoading(false); return; }
    setTasks(data || []);
    setLoading(false);
  }

  async function handleComplete(task) {
    var { error } = await supabase.from('org_tasks').update({ status:'done', updated_at:new Date().toISOString() }).eq('id', task.id);
    if (error) return;
    setTasks(function(p){ return p.filter(function(t){ return t.id !== task.id; }); });
  }

  if (!loading && tasks.length === 0) return null; // Hide widget entirely when no tasks

  // Group by org
  var byOrg = {};
  tasks.forEach(function(t) {
    var orgId   = t.organization_id;
    var orgName = (t.organizations && t.organizations.name) || 'Unknown Org';
    if (!byOrg[orgId]) byOrg[orgId] = { orgId: orgId, orgName: orgName, tasks: [] };
    byOrg[orgId].tasks.push(t);
  });
  var orgGroups = Object.values(byOrg);

  var overdueCount = tasks.filter(function(t){ var d=fmtDue(t.due_date); return d&&d.label==='Overdue'; }).length;

  return (
    <section
      aria-labelledby="tasks-widget-title"
      style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'12px', overflow:'hidden' }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'14px 16px 12px', borderBottom:'1px solid #F1F5F9' }}>
        <span style={{ color:'#3B82F6' }}><Ico d={iClip} size={16}/></span>
        <h2 id="tasks-widget-title" style={{ fontSize:'14px', fontWeight:700, color:'#0E1523', margin:0, flex:1 }}>
          My Tasks
        </h2>
        {overdueCount > 0 && (
          <span style={{ fontSize:'10px', fontWeight:700, background:'#FEE2E2', color:'#b91c1c', borderRadius:'99px', padding:'2px 7px' }}>
            {overdueCount} overdue
          </span>
        )}
        {!loading && tasks.length > 0 && (
          <span style={{ fontSize:'11px', color:'#94A3B8' }}>{tasks.length} open</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:'4px 16px 8px' }}>
        {loading ? (
          <><SkeletonRow/><SkeletonRow/><SkeletonRow/></>
        ) : (
          orgGroups.map(function(group) {
            return (
              <div key={group.orgId} style={{ marginBottom:'4px' }}>
                {/* Org label (only shown when tasks span multiple orgs) */}
                {orgGroups.length > 1 && (
                  <div style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'2px', padding:'8px 0 4px' }}>
                    {group.orgName}
                  </div>
                )}
                {group.tasks.map(function(task) {
                  var due = fmtDue(task.due_date);
                  var listName = task.org_task_lists && task.org_task_lists.name;
                  return (
                    <div key={task.id} role="listitem"
                      style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'8px 0', borderBottom:'1px solid #F8FAFC' }}>
                      {/* Check button */}
                      <button
                        onClick={function(){ handleComplete(task); }}
                        aria-label={'Mark complete: ' + task.title}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        style={{ width:'18px', height:'18px', borderRadius:'4px', border:'2px solid #CBD5E1', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:'2px', transition:'all 0.1s' }}
                        onMouseEnter={function(e){ e.currentTarget.style.borderColor='#22C55E'; e.currentTarget.style.background='#F0FDF4'; }}
                        onMouseLeave={function(e){ e.currentTarget.style.borderColor='#CBD5E1'; e.currentTarget.style.background='transparent'; }}
                      >
                        <span style={{ color:'#22C55E', opacity:0 }} className="hover:opacity-100"><Ico d={iCheck} size={10}/></span>
                      </button>

                      {/* Text */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', color:'#0E1523', fontWeight:500, lineHeight:1.35, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {task.title}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'3px', flexWrap:'wrap' }}>
                          {listName && (
                            <span style={{ fontSize:'11px', color:'#94A3B8' }}>{listName}</span>
                          )}
                          {due && (
                            <span style={{ fontSize:'10px', fontWeight:700, background:due.bg, color:due.color, borderRadius:'3px', padding:'1px 5px' }}>
                              {due.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Go to org tasks */}
                      <button
                        onClick={function(){ navigate('/organizations/'+task.organization_id+'/tasks'); }}
                        aria-label={'View in ' + group.orgName}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        style={{ color:'#CBD5E1', background:'none', border:'none', cursor:'pointer', padding:'3px', borderRadius:'4px', flexShrink:0, marginTop:'1px', transition:'color 0.1s' }}
                        onMouseEnter={function(e){ e.currentTarget.style.color='#3B82F6'; }}
                        onMouseLeave={function(e){ e.currentTarget.style.color='#CBD5E1'; }}
                      >
                        <Ico d={iArrow} size={13}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}