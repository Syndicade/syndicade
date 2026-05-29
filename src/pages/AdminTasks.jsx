import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';

// ─── Icons ────────────────────────────────────────────────────────────────────
function Ico({ d, size }) {
  var paths = Array.isArray(d) ? d : [d];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 16} height={size || 16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      {paths.map(function (p, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />; })}
    </svg>
  );
}
var I = {
  clipboard: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  plus:      'M12 4v16m8-8H4',
  trash:     'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  grip:      null,
  chevDown:  'M19 9l-7 7-7-7',
  chevUp:    'M5 15l7-7 7 7',
  bookmark:  'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  copy:      'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  x:         'M6 18L18 6M6 6l12 12',
  check:     'M5 13l4 4L19 7',
  list:      'M4 6h16M4 10h16M4 14h16M4 18h16',
  pencil:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
};

function GripIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
      <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
function getAvatarColor(name) { return AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length]; }
function getInitials(name) {
  if (!name) return '?';
  var p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}

var PRI = {
  low:    { label:'Low',    bg:'#F1F5F9', color:'#475569', border:'#CBD5E1' },
  normal: { label:'Normal', bg:'#DBEAFE', color:'#1e40af', border:'#BFDBFE' },
  high:   { label:'High',   bg:'#FEE2E2', color:'#b91c1c', border:'#FECACA' },
};

function fmtDue(ds) {
  if (!ds) return null;
  var d = new Date(ds + 'T00:00:00');
  var today = new Date(); today.setHours(0,0,0,0);
  var diff = Math.floor((d - today) / 86400000);
  if (diff < 0)  return { label:'Overdue',  color:'#EF4444', bg:'#FEF2F2' };
  if (diff === 0) return { label:'Today',    color:'#D97706', bg:'#FEF3C7' };
  if (diff === 1) return { label:'Tomorrow', color:'#D97706', bg:'#FEF3C7' };
  return { label: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), color:'#475569', bg:'#F1F5F9' };
}

var OPEN_PAGE = 10;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5" aria-hidden="true">
      <div style={{height:'16px',background:'#E2E8F0',borderRadius:'4px',width:'50%',marginBottom:'10px'}} className="animate-pulse"/>
      <div style={{height:'4px',background:'#F1F5F9',borderRadius:'99px',marginBottom:'10px'}} className="animate-pulse"/>
      <div style={{height:'12px',background:'#F1F5F9',borderRadius:'4px',width:'70%'}} className="animate-pulse"/>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminTasks() {
  var { organizationId } = useParams();
  var ctx = useOutletContext();
  var isAdmin    = ctx.isAdmin;
  var membership = ctx.membership;
  // Editors can also manage tasks
  var canManage  = isAdmin || (membership && (membership.role === 'editor' || membership.role === 'admin'));

  var [tab, setTab]           = useState('lists');
  var [lists, setLists]       = useState([]);
  var [templates, setTmpl]    = useState([]);
  var [tasks, setTasks]       = useState({});
  var [members, setMembers]   = useState([]);
  var [loading, setLoading]   = useState(true);
  var [openId, setOpenId]     = useState(null);

  // per-list expand state
  var [showAllOpen, setShowAllOpen]       = useState({});  // { listId: bool }
  var [showCompleted, setShowCompleted]   = useState({});  // { listId: bool }

  // editable list name
  var [editingListId, setEditingListId]   = useState(null);
  var [editingName, setEditingName]       = useState('');

  // create modal
  var [showCreate, setShowCreate]   = useState(false);
  var [cName, setCName]             = useState('');
  var [cDesc, setCDesc]             = useState('');
  var [cLoading, setCLoading]       = useState(false);

  // add task
  var [newTitle, setNewTitle]         = useState('');
  var [addingFor, setAddingFor]       = useState(null);

  // template use modal
  var [usingTmpl, setUsingTmpl]       = useState(null);
  var [tmplName, setTmplName]         = useState('');
  var [tmplLoading, setTmplLoading]   = useState(false);

  // rename template
  var [renameTmplId, setRenameTmplId] = useState(null);
  var [renameVal, setRenameVal]       = useState('');

  var dragItem = useRef(null);
  var dragOver = useRef(null);

  useEffect(function(){ fetchAll(); }, [organizationId]);

  async function fetchAll() {
    setLoading(true);
    var [lr, tr, mr] = await Promise.all([
      supabase.from('org_task_lists').select('*').eq('organization_id', organizationId).order('created_at',{ascending:false}),
      supabase.from('org_tasks').select('*').eq('organization_id', organizationId).order('display_order',{ascending:true}),
      supabase.from('memberships').select('member_id,role,members(user_id,display_name,first_name,last_name)').eq('organization_id',organizationId).eq('status','active'),
    ]);
    var all = lr.data || [];
    setLists(all.filter(function(l){ return !l.is_template; }));
    setTmpl(all.filter(function(l){ return l.is_template; }));
    var byList = {};
    (tr.data||[]).forEach(function(t){ if(!byList[t.list_id]) byList[t.list_id]=[]; byList[t.list_id].push(t); });
    setTasks(byList);
    setMembers((mr.data||[]).filter(function(m){ return m.member_id && m.members; }).map(function(m){
      var n = m.members;
      return { id: m.member_id, name: n.display_name || ((n.first_name||'')+' '+(n.last_name||'')).trim()||'Unknown', role: m.role };
    }));
    setLoading(false);
  }

  // ── Create list ─────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!cName.trim()){ toast.error('List name required.'); return; }
    setCLoading(true);
    var { data, error } = await supabase.from('org_task_lists').insert({ organization_id:organizationId, name:cName.trim(), description:cDesc.trim()||null, is_template:false }).select().single();
    setCLoading(false);
    if (error){ mascotErrorToast('Failed to create list.'); return; }
    setLists(function(p){ return [data].concat(p); });
    setTasks(function(p){ var n=Object.assign({},p); n[data.id]=[]; return n; });
    setCName(''); setCDesc(''); setShowCreate(false);
    setOpenId(data.id);
    mascotSuccessToast('Task list created!');
  }

  // ── Rename list ─────────────────────────────────────────────────────────────
  async function handleRenameList(list) {
    var val = editingName.trim();
    setEditingListId(null); setEditingName('');
    if (!val || val === list.name) return;
    var { error } = await supabase.from('org_task_lists').update({ name: val }).eq('id', list.id);
    if (error){ toast.error('Failed to rename.'); return; }
    setLists(function(p){ return p.map(function(l){ return l.id===list.id ? Object.assign({},l,{name:val}) : l; }); });
    mascotSuccessToast('List renamed.');
  }

  // ── Delete list ─────────────────────────────────────────────────────────────
  async function handleDeleteList(list) {
    if (!window.confirm('Delete "'+list.name+'" and all its tasks?')) return;
    var { error } = await supabase.from('org_task_lists').delete().eq('id', list.id);
    if (error){ mascotErrorToast('Failed to delete list.'); return; }
    setLists(function(p){ return p.filter(function(l){ return l.id!==list.id; }); });
    setTasks(function(p){ var n=Object.assign({},p); delete n[list.id]; return n; });
    if (openId === list.id) setOpenId(null);
    mascotSuccessToast('List deleted.');
  }

  // ── Add task ────────────────────────────────────────────────────────────────
  async function handleAddTask(listId) {
    var title = newTitle.trim();
    if (!title) return;
    var arr = tasks[listId]||[];
    var maxOrder = arr.reduce(function(m,t){ return Math.max(m,t.display_order); }, -1);
    var { data, error } = await supabase.from('org_tasks').insert({ list_id:listId, organization_id:organizationId, title:title, status:'open', priority:'normal', display_order:maxOrder+1 }).select().single();
    if (error){ toast.error('Failed to add task.'); return; }
    setTasks(function(p){ var n=Object.assign({},p); n[listId]=(p[listId]||[]).concat([data]); return n; });
    setNewTitle('');
  }

  // ── Toggle done ─────────────────────────────────────────────────────────────
  async function handleToggle(task) {
    var ns = task.status==='done' ? 'open' : 'done';
    var { error } = await supabase.from('org_tasks').update({ status:ns, updated_at:new Date().toISOString() }).eq('id',task.id);
    if (error){ toast.error('Failed to update.'); return; }
    setTasks(function(p){
      var n=Object.assign({},p);
      n[task.list_id]=(p[task.list_id]||[]).map(function(t){ return t.id===task.id ? Object.assign({},t,{status:ns}) : t; });
      return n;
    });
  }

  // ── Update task field ────────────────────────────────────────────────────────
  async function handleUpdate(task, updates) {
    var { error } = await supabase.from('org_tasks').update(Object.assign({},updates,{updated_at:new Date().toISOString()})).eq('id',task.id);
    if (error){ toast.error('Failed to update.'); return; }
    // If assigning someone, send a notification
    if (updates.assigned_to && updates.assigned_to !== task.assigned_to) {
      supabase.from('notifications').insert({
        user_id: updates.assigned_to,
        organization_id: organizationId,
        type: 'announcement',
        title: 'Task assigned to you',
        message: task.title,
        is_read: false,
      });
    }
    setTasks(function(p){
      var n=Object.assign({},p);
      n[task.list_id]=(p[task.list_id]||[]).map(function(t){ return t.id===task.id ? Object.assign({},t,updates) : t; });
      return n;
    });
  }

  // ── Delete task ─────────────────────────────────────────────────────────────
  async function handleDeleteTask(task) {
    var { error } = await supabase.from('org_tasks').delete().eq('id',task.id);
    if (error){ toast.error('Failed to delete.'); return; }
    setTasks(function(p){ var n=Object.assign({},p); n[task.list_id]=(p[task.list_id]||[]).filter(function(t){ return t.id!==task.id; }); return n; });
  }

  // ── Drag reorder (open tasks only) ──────────────────────────────────────────
  async function handleDragEnd(listId, openTasks) {
    if (dragItem.current===null || dragOver.current===null || dragItem.current===dragOver.current){ dragItem.current=null; dragOver.current=null; return; }
    var arr = openTasks.slice();
    var moved = arr.splice(dragItem.current,1)[0];
    arr.splice(dragOver.current,0,moved);
    dragItem.current=null; dragOver.current=null;
    var doneTasks = (tasks[listId]||[]).filter(function(t){ return t.status==='done'; });
    var updated = arr.map(function(t,i){ return Object.assign({},t,{display_order:i}); }).concat(
      doneTasks.map(function(t,i){ return Object.assign({},t,{display_order:arr.length+i}); })
    );
    setTasks(function(p){ var n=Object.assign({},p); n[listId]=updated; return n; });
    await supabase.from('org_tasks').upsert(updated.map(function(t){ return {id:t.id,list_id:t.list_id,organization_id:t.organization_id,title:t.title,display_order:t.display_order}; }));
  }

  // ── Save as template ─────────────────────────────────────────────────────────
  async function handleSaveTemplate(list) {
    var { data:tmpl, error } = await supabase.from('org_task_lists').insert({ organization_id:organizationId, name:list.name, description:list.description, is_template:true, template_name:list.name }).select().single();
    if (error){ mascotErrorToast('Failed to save template.'); return; }
    var listTasks = (tasks[list.id]||[]);
    if (listTasks.length>0) {
      var rows = listTasks.map(function(t){ return { list_id:tmpl.id, organization_id:organizationId, title:t.title, description:t.description, priority:t.priority, display_order:t.display_order, status:'open' }; });
      var ins = await supabase.from('org_tasks').insert(rows).select();
      setTasks(function(p){ var n=Object.assign({},p); n[tmpl.id]=ins.data||[]; return n; });
    }
    setTmpl(function(p){ return [tmpl].concat(p); });
    mascotSuccessToast('Template saved!');
  }

  // ── Use template ─────────────────────────────────────────────────────────────
  async function handleUseTmpl() {
    if (!tmplName.trim()){ toast.error('List name required.'); return; }
    setTmplLoading(true);
    var { data:nl, error } = await supabase.from('org_task_lists').insert({ organization_id:organizationId, name:tmplName.trim(), is_template:false }).select().single();
    if (error){ mascotErrorToast('Failed to create.'); setTmplLoading(false); return; }
    var tmplTasks = tasks[usingTmpl.id] || [];
    if (!tmplTasks.length) {
      var fr = await supabase.from('org_tasks').select('*').eq('list_id',usingTmpl.id).order('display_order');
      tmplTasks = fr.data||[];
    }
    var newTasks = [];
    if (tmplTasks.length>0) {
      var ins = await supabase.from('org_tasks').insert(tmplTasks.map(function(t){ return { list_id:nl.id, organization_id:organizationId, title:t.title, description:t.description, priority:t.priority, display_order:t.display_order, status:'open' }; })).select();
      newTasks = ins.data||[];
    }
    setTasks(function(p){ var n=Object.assign({},p); n[nl.id]=newTasks; return n; });
    setLists(function(p){ return [nl].concat(p); });
    setUsingTmpl(null); setTmplName(''); setTmplLoading(false);
    setTab('lists'); setOpenId(nl.id);
    mascotSuccessToast('List created from template!');
  }

  // ── Delete template ─────────────────────────────────────────────────────────
  async function handleDeleteTmpl(tmpl) {
    if (!window.confirm('Delete template "'+tmpl.name+'"?')) return;
    var { error } = await supabase.from('org_task_lists').delete().eq('id',tmpl.id);
    if (error){ mascotErrorToast('Failed to delete.'); return; }
    setTmpl(function(p){ return p.filter(function(t){ return t.id!==tmpl.id; }); });
    mascotSuccessToast('Template deleted.');
  }

  // ── Rename template ─────────────────────────────────────────────────────────
  async function handleRenameTmpl(tmpl) {
    var val = renameVal.trim();
    setRenameTmplId(null); setRenameVal('');
    if (!val) return;
    var { error } = await supabase.from('org_task_lists').update({ name:val, template_name:val }).eq('id',tmpl.id);
    if (error){ toast.error('Failed to rename.'); return; }
    setTmpl(function(p){ return p.map(function(t){ return t.id===tmpl.id ? Object.assign({},t,{name:val,template_name:val}) : t; }); });
    mascotSuccessToast('Template renamed.');
  }

  // ─── Task row ────────────────────────────────────────────────────────────────
  function TaskRow({ task, idx, listId, openTasksArr }) {
    var done       = task.status === 'done';
    var assignee   = members.find(function(m){ return m.id===task.assigned_to; });
    var due        = fmtDue(task.due_date);
    var pc         = PRI[task.priority] || PRI.normal;
    var isOverdue  = due && due.label === 'Overdue';

    return (
      <div
        role="listitem"
        draggable={canManage && !done}
        onDragStart={canManage && !done ? function(){ dragItem.current=idx; } : undefined}
        onDragEnter={canManage && !done ? function(){ dragOver.current=idx; } : undefined}
        onDragEnd={canManage && !done ? function(){ handleDragEnd(listId, openTasksArr); } : undefined}
        onDragOver={function(e){ e.preventDefault(); }}
        style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'9px 14px', borderBottom:'1px solid #F8FAFC', background: done ? '#FAFAFA' : '#fff', opacity: done ? 0.75 : 1 }}
      >
        {canManage && !done && (
          <span style={{ color:'#CBD5E1', cursor:'grab', paddingTop:'2px', flexShrink:0 }} aria-hidden="true">
            <GripIcon />
          </span>
        )}

        {/* Checkbox */}
        <button
          onClick={function(){ handleToggle(task); }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label={(done?'Reopen: ':'Complete: ')+task.title}
          aria-pressed={done}
          style={{ width:'20px', height:'20px', borderRadius:'5px', border: done ? 'none' : '2px solid #CBD5E1', background: done ? '#22C55E' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:'1px' }}
        >
          {done && <span style={{color:'#fff'}}><Ico d={I.check} size={11}/></span>}
        </button>

        {/* Body */}
        <div style={{ flex:1, minWidth:0 }}>
          <div
            contentEditable={canManage ? 'true' : 'false'}
            suppressContentEditableWarning
            onBlur={canManage ? function(e){
              var v=e.currentTarget.textContent.trim();
              if(v && v!==task.title) handleUpdate(task,{title:v});
              if(!v) e.currentTarget.textContent=task.title;
            } : undefined}
            style={{ fontSize:'14px', color: done?'#94A3B8':'#0E1523', textDecoration: done?'line-through':'none', outline:'none', borderRadius:'3px', cursor: canManage?'text':'default', padding:'0 2px', lineHeight:1.4 }}
          >
            {task.title}
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'5px', marginTop:'5px' }}>
            {/* Priority */}
            {canManage ? (
              <select value={task.priority||'normal'} onChange={function(e){ handleUpdate(task,{priority:e.target.value}); }} aria-label="Priority"
                className="focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ fontSize:'11px', fontWeight:700, border:'1px solid '+pc.border, background:pc.bg, color:pc.color, borderRadius:'4px', padding:'1px 5px', cursor:'pointer' }}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            ) : (
              <span style={{ fontSize:'11px', fontWeight:700, border:'1px solid '+pc.border, background:pc.bg, color:pc.color, borderRadius:'4px', padding:'1px 6px' }}>{pc.label}</span>
            )}

            {/* Assignee */}
            {canManage ? (
              <select value={task.assigned_to||''} onChange={function(e){ handleUpdate(task,{assigned_to:e.target.value||null}); }} aria-label="Assign to"
                className="focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ fontSize:'11px', border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#475569', borderRadius:'4px', padding:'1px 5px', cursor:'pointer', maxWidth:'130px' }}>
                <option value="">Unassigned</option>
                {members.map(function(m){ return <option key={m.id} value={m.id}>{m.name}</option>; })}
              </select>
            ) : (
              assignee && (
                <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#64748B' }}>
                  <span style={{ width:'16px', height:'16px', borderRadius:'50%', background:getAvatarColor(assignee.name), color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700 }}>{getInitials(assignee.name)}</span>
                  {assignee.name}
                </span>
              )
            )}

            {/* Due date */}
            {canManage ? (
              <input type="date" value={task.due_date||''} onChange={function(e){ handleUpdate(task,{due_date:e.target.value||null}); }} aria-label="Due date"
                className="focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ fontSize:'11px', border:'1px solid '+(isOverdue?'#FECACA':'#E2E8F0'), background: isOverdue?'#FEF2F2':'#F8FAFC', color: isOverdue?'#b91c1c':'#475569', borderRadius:'4px', padding:'1px 5px' }} />
            ) : (
              due && <span style={{ fontSize:'11px', fontWeight:600, background:due.bg, color:due.color, borderRadius:'4px', padding:'1px 6px' }}>{due.label}</span>
            )}
          </div>
        </div>

        {/* Delete */}
        {canManage && (
          <button onClick={function(){ handleDeleteTask(task); }} aria-label={'Delete: '+task.title}
            className="focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
            style={{ color:'#CBD5E1', cursor:'pointer', padding:'2px 3px', flexShrink:0, background:'none', border:'none', borderRadius:'4px', marginTop:'1px' }}
            onMouseEnter={function(e){ e.currentTarget.style.color='#EF4444'; }}
            onMouseLeave={function(e){ e.currentTarget.style.color='#CBD5E1'; }}>
            <Ico d={I.trash} size={14}/>
          </button>
        )}
      </div>
    );
  }

  // ─── List card ───────────────────────────────────────────────────────────────
  function ListCard({ list }) {
    var all       = tasks[list.id] || [];
    var open      = all.filter(function(t){ return t.status!=='done'; });
    var done      = all.filter(function(t){ return t.status==='done'; });
    var total     = all.length;
    var doneCount = done.length;
    var pct       = total > 0 ? Math.round((doneCount/total)*100) : 0;
    var barColor  = pct===100?'#22C55E':pct>=50?'#3B82F6':'#F59E0B';
    var isOpen    = openId === list.id;

    var showAll   = showAllOpen[list.id];
    var visibleOpen = showAll ? open : open.slice(0, OPEN_PAGE);
    var hiddenCount = open.length - OPEN_PAGE;
    var showDone  = showCompleted[list.id];

    var isEditing = editingListId === list.id;

    // Unique assignee avatars
    var seen = {}; var assigneeIds = [];
    all.forEach(function(t){ if(t.assigned_to && !seen[t.assigned_to]){ seen[t.assigned_to]=true; assigneeIds.push(t.assigned_to); } });
    var shownA = assigneeIds.slice(0,4).map(function(id){ return members.find(function(m){ return m.id===id; })||{id:id,name:'?'}; });

    var overdueCount = open.filter(function(t){ var d=fmtDue(t.due_date); return d&&d.label==='Overdue'; }).length;

    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" style={{ display:'flex', flexDirection:'column' }}>
        {/* Card header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'16px', borderBottom: isOpen?'1px solid #E2E8F0':'none', cursor:'pointer', background:'#fff' }}>
          {/* Expand toggle */}
          <button
            onClick={function(){ setOpenId(isOpen?null:list.id); setNewTitle(''); }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            aria-expanded={isOpen}
            aria-controls={'tl-'+list.id}
            aria-label={(isOpen?'Collapse: ':'Expand: ')+list.name}
            style={{ display:'flex', alignItems:'flex-start', gap:'10px', flex:1, background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:0 }}
          >
            <span style={{ color:'#3B82F6', flexShrink:0, marginTop:'2px' }}><Ico d={I.clipboard} size={18}/></span>
            <div style={{ flex:1, minWidth:0 }}>
              {/* List name — editable */}
              {isEditing && canManage ? (
                <input
                  type="text"
                  value={editingName}
                  autoFocus
                  onClick={function(e){ e.stopPropagation(); }}
                  onChange={function(e){ setEditingName(e.target.value); }}
                  onKeyDown={function(e){ if(e.key==='Enter'){ e.preventDefault(); handleRenameList(list); } if(e.key==='Escape'){ setEditingListId(null); setEditingName(''); } }}
                  onBlur={function(){ handleRenameList(list); }}
                  aria-label="List name"
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontSize:'15px', fontWeight:700, color:'#0E1523', border:'1px solid #3B82F6', borderRadius:'5px', padding:'2px 7px', width:'100%', boxSizing:'border-box' }}
                />
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontWeight:700, fontSize:'15px', color:'#0E1523' }}>{list.name}</span>
                  {overdueCount > 0 && (
                    <span style={{ fontSize:'10px', fontWeight:700, background:'#FEE2E2', color:'#b91c1c', borderRadius:'99px', padding:'1px 6px' }} aria-label={overdueCount+' overdue'}>
                      {overdueCount} overdue
                    </span>
                  )}
                </div>
              )}
              {list.description && !isEditing && (
                <div style={{ fontSize:'12px', color:'#64748B', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{list.description}</div>
              )}
              {total > 0 && !isEditing && (
                <div style={{ marginTop:'8px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                    <span style={{ fontSize:'11px', color:'#64748B' }}>{doneCount} of {total} done</span>
                    <span style={{ fontSize:'11px', fontWeight:700, color: pct===100?'#22C55E':'#475569' }}>{pct}%</span>
                  </div>
                  <div style={{ height:'4px', background:'#E2E8F0', borderRadius:'99px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:pct+'%', background:barColor, borderRadius:'99px', transition:'width 0.3s' }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}/>
                  </div>
                </div>
              )}
              {total === 0 && !isEditing && <div style={{ fontSize:'12px', color:'#94A3B8', marginTop:'4px' }}>No tasks yet</div>}
              {shownA.length > 0 && !isEditing && (
                <div style={{ display:'flex', marginTop:'8px' }}>
                  {shownA.map(function(m){
                    return <div key={m.id} title={m.name} style={{ width:'20px', height:'20px', borderRadius:'50%', background:getAvatarColor(m.name), color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700, border:'2px solid #fff', marginRight:'-4px' }}>{getInitials(m.name)}</div>;
                  })}
                  {assigneeIds.length>4 && <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'#E2E8F0', color:'#475569', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700, border:'2px solid #fff' }}>+{assigneeIds.length-4}</div>}
                </div>
              )}
            </div>
            <span style={{ color:'#94A3B8', flexShrink:0, marginTop:'2px' }}>{isOpen ? <Ico d={I.chevUp}/> : <Ico d={I.chevDown}/>}</span>
          </button>

          {/* Rename button — separate from toggle */}
          {canManage && !isEditing && (
            <button
              onClick={function(e){ e.stopPropagation(); setEditingListId(list.id); setEditingName(list.name); if(!isOpen) setOpenId(list.id); }}
              aria-label={'Rename: '+list.name}
              className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              style={{ color:'#CBD5E1', background:'none', border:'none', cursor:'pointer', padding:'4px', borderRadius:'5px', flexShrink:0, marginTop:'-2px' }}
              onMouseEnter={function(e){ e.currentTarget.style.color='#475569'; }}
              onMouseLeave={function(e){ e.currentTarget.style.color='#CBD5E1'; }}
            >
              <Ico d={I.pencil} size={13}/>
            </button>
          )}
        </div>

        {/* Expanded content */}
        {isOpen && (
          <div id={'tl-'+list.id}>
            {/* Open tasks */}
            {open.length === 0 && done.length === 0 && (
              <div style={{ padding:'16px', textAlign:'center', fontSize:'13px', color:'#94A3B8' }}>No tasks yet — add one below.</div>
            )}

            <div role="list" aria-label={'Open tasks in '+list.name}>
              {visibleOpen.map(function(task, idx){
                return <TaskRow key={task.id} task={task} idx={idx} listId={list.id} openTasksArr={open} />;
              })}
            </div>

            {/* Show more / less open tasks */}
            {open.length > OPEN_PAGE && (
              <button
                onClick={function(){ setShowAllOpen(function(p){ var n=Object.assign({},p); n[list.id]=!p[list.id]; return n; }); }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ width:'100%', padding:'8px', fontSize:'12px', fontWeight:600, color:'#3B82F6', background:'#F8FAFC', border:'none', borderTop:'1px solid #E2E8F0', cursor:'pointer' }}
              >
                {showAll ? 'Show less' : 'Show '+hiddenCount+' more task'+(hiddenCount!==1?'s':'')}
              </button>
            )}

            {/* Completed section */}
            {done.length > 0 && (
              <div style={{ borderTop:'1px solid #E2E8F0' }}>
                <button
                  onClick={function(){ setShowCompleted(function(p){ var n=Object.assign({},p); n[list.id]=!p[list.id]; return n; }); }}
                  className="focus:outline-none focus:ring-2 focus:ring-slate-400"
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', fontSize:'12px', fontWeight:700, color:'#64748B', background:'#F8FAFC', border:'none', cursor:'pointer', textAlign:'left' }}
                  aria-expanded={showDone}
                >
                  <span style={{ width:'16px', height:'16px', borderRadius:'50%', background:'#DCFCE7', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Ico d={I.check} size={9}/>
                  </span>
                  Completed ({done.length})
                  <span style={{ marginLeft:'auto' }}>{showDone ? <Ico d={I.chevUp} size={13}/> : <Ico d={I.chevDown} size={13}/>}</span>
                </button>
                {showDone && (
                  <div role="list" aria-label={'Completed tasks in '+list.name}>
                    {done.map(function(task,idx){ return <TaskRow key={task.id} task={task} idx={idx} listId={list.id} openTasksArr={open}/>; })}
                  </div>
                )}
              </div>
            )}

            {/* Add task */}
            {canManage && (
              <div style={{ padding:'8px 12px 10px', borderTop:'1px solid #F1F5F9', display:'flex', gap:'6px', alignItems:'center' }}>
                <input
                  type="text"
                  value={addingFor===list.id ? newTitle : ''}
                  onFocus={function(){ setAddingFor(list.id); }}
                  onChange={function(e){ setNewTitle(e.target.value); }}
                  onKeyDown={function(e){ if(e.key==='Enter'){ e.preventDefault(); handleAddTask(list.id); } }}
                  placeholder="Add a task..."
                  aria-label={'Add task to '+list.name}
                  style={{ flex:1, border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', color:'#0E1523', outline:'none', background:'#F8FAFC' }}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button onClick={function(){ handleAddTask(list.id); }} aria-label="Add task"
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'6px', fontSize:'13px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                  <Ico d={I.plus} size={13}/> Add
                </button>
              </div>
            )}

            {/* Footer actions */}
            {canManage && (
              <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', padding:'6px 12px 12px', borderTop:'1px solid #F1F5F9' }}>
                <button onClick={function(){ handleSaveTemplate(list); }}
                  className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', fontSize:'12px', fontWeight:600, color:'#475569', background:'#F1F5F9', border:'1px solid #E2E8F0', borderRadius:'6px', cursor:'pointer' }}>
                  <Ico d={I.bookmark} size={13}/> Save as Template
                </button>
                <button onClick={function(){ handleDeleteList(list); }}
                  aria-label={'Delete list: '+list.name}
                  className="focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', fontSize:'12px', fontWeight:600, color:'#EF4444', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', cursor:'pointer' }}>
                  <Ico d={I.trash} size={13}/> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Totals ───────────────────────────────────────────────────────────────────
  var totalTasks = Object.values(tasks).reduce(function(a,arr){ return a+arr.length; }, 0);
  var totalOpen  = Object.values(tasks).reduce(function(a,arr){ return a+arr.filter(function(t){ return t.status!=='done'; }).length; }, 0);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:'#F8FAFC', minHeight:'100vh' }}>
      <div style={{ padding:'24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', marginBottom:'24px', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'30px', fontWeight:800, color:'#0E1523', margin:0 }}>Tasks</h1>
            {!loading && totalTasks > 0 && (
              <p style={{ fontSize:'14px', color:'#64748B', margin:'4px 0 0' }}>
                {lists.length} {lists.length===1?'list':'lists'} · {totalOpen} open · {totalTasks-totalOpen} done
              </p>
            )}
          </div>
          {canManage && (
            <button onClick={function(){ setShowCreate(true); }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
              <Ico d={I.plus} size={15}/> New List
            </button>
          )}
        </div>

        {/* Tabs */}
        <div role="tablist" style={{ display:'flex', borderBottom:'2px solid #E2E8F0', marginBottom:'20px' }}>
          {[['lists','Task Lists','#3B82F6','#DBEAFE','#1e40af',lists.length],['templates','Templates','#8B5CF6','#EDE9FE','#6D28D9',templates.length]].map(function(t){
            var active = tab===t[0];
            return (
              <button key={t[0]} role="tab" aria-selected={active} onClick={function(){ setTab(t[0]); }}
                className="focus:outline-none focus:ring-2 focus:ring-inset"
                style={{ padding:'8px 16px', fontSize:'14px', fontWeight:active?700:500, color:active?t[2]:'#64748B', background:'none', border:'none', borderBottom:active?'2px solid '+t[2]:'2px solid transparent', marginBottom:'-2px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                {t[1]}
                {!loading && t[5]>0 && <span style={{ background:t[3], color:t[4], borderRadius:'99px', fontSize:'11px', fontWeight:700, padding:'1px 7px' }}>{t[5]}</span>}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px' }}><Skel/><Skel/><Skel/><Skel/></div>}

        {/* Lists tab */}
        {!loading && tab==='lists' && (
          lists.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 24px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'56px', height:'56px', background:'#DBEAFE', borderRadius:'14px', marginBottom:'16px', color:'#3B82F6' }}>
                <Ico d={I.clipboard} size={28}/>
              </div>
              <h2 style={{ fontSize:'18px', fontWeight:700, color:'#0E1523', margin:'0 0 8px' }}>No task lists yet</h2>
              <p style={{ fontSize:'14px', color:'#64748B', margin:'0 0 20px', maxWidth:'360px', marginLeft:'auto', marginRight:'auto' }}>
                Create a list to track tasks, action items, and follow-ups for your organization.
              </p>
              {canManage && (
                <button onClick={function(){ setShowCreate(true); }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 20px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>
                  <Ico d={I.plus} size={15}/> Create First List
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))', gap:'16px' }}>
              {lists.map(function(list){ return <ListCard key={list.id} list={list}/>; })}
            </div>
          )
        )}

        {/* Templates tab */}
        {!loading && tab==='templates' && (
          templates.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 24px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'56px', height:'56px', background:'#EDE9FE', borderRadius:'14px', marginBottom:'16px', color:'#8B5CF6' }}>
                <Ico d={I.list} size={28}/>
              </div>
              <h2 style={{ fontSize:'18px', fontWeight:700, color:'#0E1523', margin:'0 0 8px' }}>No templates yet</h2>
              <p style={{ fontSize:'14px', color:'#64748B', margin:0, maxWidth:'380px', marginLeft:'auto', marginRight:'auto' }}>
                Open a task list and click "Save as Template" to reuse it for recurring tasks.
              </p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'16px' }}>
              {templates.map(function(tmpl){
                var tc = (tasks[tmpl.id]||[]).length;
                var isRen = renameTmplId===tmpl.id;
                return (
                  <div key={tmpl.id} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'12px' }}>
                      <span style={{ color:'#8B5CF6', flexShrink:0, marginTop:'2px' }}><Ico d={I.list} size={18}/></span>
                      <div style={{ flex:1, minWidth:0 }}>
                        {isRen ? (
                          <input type="text" value={renameVal} autoFocus aria-label="Template name"
                            onChange={function(e){ setRenameVal(e.target.value); }}
                            onKeyDown={function(e){ if(e.key==='Enter') handleRenameTmpl(tmpl); if(e.key==='Escape'){ setRenameTmplId(null); setRenameVal(''); } }}
                            onBlur={function(){ handleRenameTmpl(tmpl); }}
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ width:'100%', border:'1px solid #3B82F6', borderRadius:'5px', padding:'3px 7px', fontSize:'14px', fontWeight:700, color:'#0E1523', boxSizing:'border-box' }}/>
                        ) : (
                          <div style={{ fontWeight:700, fontSize:'15px', color:'#0E1523' }}>{tmpl.name||tmpl.template_name}</div>
                        )}
                        <div style={{ fontSize:'12px', color:'#94A3B8', marginTop:'2px' }}>{tc>0?tc+' task'+(tc!==1?'s':''):'No tasks'}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                      <button onClick={function(){ setUsingTmpl(tmpl); setTmplName(tmpl.name||''); }}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', fontSize:'12px', fontWeight:700, background:'#3B82F6', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer' }}>
                        <Ico d={I.copy} size={13}/> Use Template
                      </button>
                      {canManage && <>
                        <button onClick={function(){ setRenameTmplId(tmpl.id); setRenameVal(tmpl.name||''); }}
                          className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                          style={{ padding:'6px 10px', fontSize:'12px', fontWeight:600, background:'#F1F5F9', color:'#475569', border:'1px solid #E2E8F0', borderRadius:'6px', cursor:'pointer' }}>
                          Rename
                        </button>
                        <button onClick={function(){ handleDeleteTmpl(tmpl); }}
                          aria-label={'Delete template: '+tmpl.name}
                          className="focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                          style={{ padding:'6px 10px', fontSize:'12px', fontWeight:600, background:'#FEF2F2', color:'#EF4444', border:'1px solid #FECACA', borderRadius:'6px', cursor:'pointer' }}>
                          Delete
                        </button>
                      </>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Create List Modal ───────────────────────────────────────────────────── */}
      {showCreate && (
        <div role="dialog" aria-modal="true" aria-labelledby="cl-title"
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'20px' }}
          onClick={function(e){ if(e.target===e.currentTarget) setShowCreate(false); }}>
          <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'440px', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <h2 id="cl-title" style={{ fontSize:'20px', fontWeight:800, color:'#0E1523', margin:0 }}>New Task List</h2>
              <button onClick={function(){ setShowCreate(false); }} aria-label="Close" className="focus:outline-none focus:ring-2 focus:ring-slate-400" style={{ background:'none', border:'none', cursor:'pointer', color:'#64748B', borderRadius:'6px', padding:'4px', display:'flex' }}><Ico d={I.x} size={18}/></button>
            </div>
            <label htmlFor="cl-n" style={{ fontSize:'13px', fontWeight:700, color:'#0E1523', display:'block', marginBottom:'4px' }}>List Name <span aria-hidden="true" style={{color:'#EF4444'}}>*</span></label>
            <input id="cl-n" type="text" value={cName} autoFocus aria-required="true"
              onChange={function(e){ setCName(e.target.value); }}
              onKeyDown={function(e){ if(e.key==='Enter') handleCreate(); }}
              placeholder="e.g. Board Meeting May 30"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', color:'#0E1523', boxSizing:'border-box', marginBottom:'14px' }}/>
            <label htmlFor="cl-d" style={{ fontSize:'13px', fontWeight:700, color:'#0E1523', display:'block', marginBottom:'4px' }}>Description <span style={{fontSize:'12px',fontWeight:400,color:'#94A3B8'}}>(optional)</span></label>
            <textarea id="cl-d" value={cDesc} onChange={function(e){ setCDesc(e.target.value); }} rows={2} placeholder="What is this list for?"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', color:'#0E1523', boxSizing:'border-box', marginBottom:'22px', resize:'vertical' }}/>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={function(){ setShowCreate(false); setCName(''); setCDesc(''); }}
                className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                style={{ padding:'10px 18px', background:'#F1F5F9', color:'#475569', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={cLoading||!cName.trim()}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                style={{ padding:'10px 18px', background:cLoading||!cName.trim()?'#93C5FD':'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:cLoading||!cName.trim()?'not-allowed':'pointer' }}>
                {cLoading?'Creating...':'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Use Template Modal ──────────────────────────────────────────────────── */}
      {usingTmpl && (
        <div role="dialog" aria-modal="true" aria-labelledby="ut-title"
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'20px' }}
          onClick={function(e){ if(e.target===e.currentTarget){ setUsingTmpl(null); setTmplName(''); } }}>
          <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'440px', padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <h2 id="ut-title" style={{ fontSize:'20px', fontWeight:800, color:'#0E1523', margin:0 }}>Use Template</h2>
              <button onClick={function(){ setUsingTmpl(null); setTmplName(''); }} aria-label="Close" className="focus:outline-none focus:ring-2 focus:ring-slate-400" style={{ background:'none', border:'none', cursor:'pointer', color:'#64748B', borderRadius:'6px', padding:'4px', display:'flex' }}><Ico d={I.x} size={18}/></button>
            </div>
            <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'16px', marginTop:'4px' }}>From: <strong style={{color:'#0E1523'}}>{usingTmpl.name}</strong></p>
            <label htmlFor="ut-n" style={{ fontSize:'13px', fontWeight:700, color:'#0E1523', display:'block', marginBottom:'4px' }}>New List Name <span aria-hidden="true" style={{color:'#EF4444'}}>*</span></label>
            <input id="ut-n" type="text" value={tmplName} autoFocus aria-required="true"
              onChange={function(e){ setTmplName(e.target.value); }}
              onKeyDown={function(e){ if(e.key==='Enter') handleUseTmpl(); }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', color:'#0E1523', boxSizing:'border-box', marginBottom:'22px' }}/>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={function(){ setUsingTmpl(null); setTmplName(''); }}
                className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                style={{ padding:'10px 18px', background:'#F1F5F9', color:'#475569', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleUseTmpl} disabled={tmplLoading||!tmplName.trim()}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                style={{ padding:'10px 18px', background:tmplLoading||!tmplName.trim()?'#93C5FD':'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:tmplLoading||!tmplName.trim()?'not-allowed':'pointer' }}>
                {tmplLoading?'Creating...':'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}