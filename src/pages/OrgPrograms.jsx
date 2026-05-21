import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// ── Light theme tokens ────────────────────────────────────────────────────────
var PAGE_BG  = '#F8FAFC';
var CARD_BG  = '#FFFFFF';
var CARD_ALT = '#F1F5F9';
var ELEVATED = '#F1F5F9';
var BDR      = '#E2E8F0';
var TEXT     = '#0E1523';
var TEXT2    = '#475569';
var MUTED    = '#64748B';
var INPUT_BG = '#F8FAFC';

// ── Predefined tags ───────────────────────────────────────────────────────────
var PROGRAM_TAGS = [
  'Education','Youth','Seniors','Health','Food Access','Housing',
  'Employment','Legal Aid','Arts','Environment','Immigration',
  'Disability','Mental Health','Sports','Technology','Financial Aid',
];

// ── Icon component ────────────────────────────────────────────────────────────
function Icon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={props.className || 'h-5 w-5'}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {Array.isArray(props.path)
        ? props.path.map(function(d, i) {
            return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={props.sw || 2} d={d} />;
          })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={props.sw || 2} d={props.path} />}
    </svg>
  );
}

var ICONS = {
  programs:    ['M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
  plus:        'M12 4v16m8-8H4',
  pencil:      ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  trash:       ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  copy:        ['M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'],
  x:           'M6 18L18 6M6 6l12 12',
  mail:        ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  user:        'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:       ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'],
  clock:       ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  calendar:    ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
  globe:       ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  tag:         ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronUp:   'M5 15l7-7 7 7',
  grip:        'M4 6h16M4 10h16M4 14h16',
  xCircle:     ['M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'],
};

var EMPTY_FORM = {
  name: '', description: '', audience: '', schedule: '',
  start_date: '', end_date: '',
  capacity: '', enrolled_count: '',
  how_to_apply: '', contact_name: '', contact_email: '',
  status: 'active', is_public: true, publish_to_discovery: false,
  tags: [],
};

function formatDate(ds) {
  if (!ds) return null;
  var d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle(props) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        position: 'relative', display: 'inline-flex', height: props.small ? '20px' : '22px',
        width: props.small ? '36px' : '40px', flexShrink: 0,
        alignItems: 'center', borderRadius: '99px', border: 'none',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        background: props.checked ? (props.color || '#3B82F6') : BDR,
        opacity: props.disabled ? 0.45 : 1, transition: 'background 0.2s',
      }}
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      aria-disabled={props.disabled}
      className={'focus:outline-none focus:ring-2 focus:ring-offset-1 ' + (props.ringColor || 'focus:ring-blue-500')}
    >
      <span style={{
        display: 'inline-block',
        height: props.small ? '14px' : '16px',
        width:  props.small ? '14px' : '16px',
        borderRadius: '50%', background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transform: props.checked
          ? (props.small ? 'translateX(19px)' : 'translateX(21px)')
          : 'translateX(3px)',
        transition: 'transform 0.2s',
      }} />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function OrgPrograms() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();

  var [programs, setPrograms]           = useState([]);
  var [loading, setLoading]             = useState(true);
  var [organization, setOrganization]   = useState(null);
  var [effectiveRole, setEffectiveRole] = useState('member');

  // Modal
  var [showModal, setShowModal]         = useState(false);
  var [editingProgram, setEditingProgram] = useState(null);
  var [form, setForm]                   = useState(EMPTY_FORM);
  var [saving, setSaving]               = useState(false);
  var [newTagInput, setNewTagInput]     = useState('');

  // Card UI
  var [expandedId, setExpandedId]       = useState(null);

  // Drag & drop
  var [draggingId, setDraggingId]       = useState(null);
  var [dragOverId, setDragOverId]       = useState(null);
  var [savingOrder, setSavingOrder]     = useState(false);

  // Filters
  var [statusFilter, setStatusFilter]   = useState('all');
  var [sortBy, setSortBy]               = useState('custom');
  var [searchQuery, setSearchQuery]     = useState('');

  useEffect(function() { init(); }, [organizationId]);

  async function init() {
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { navigate('/login'); return; }

      var orgResult = await supabase
        .from('organizations').select('id, name, logo_url')
        .eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memberResult = await supabase
        .from('memberships').select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', authResult.data.user.id)
        .eq('status', 'active').maybeSingle();
      if (memberResult.data) setEffectiveRole(memberResult.data.role);

      await fetchPrograms();
    } catch (err) {
      console.error('OrgPrograms init error:', err);
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrograms() {
    var result = await supabase
      .from('org_programs').select('*')
      .eq('organization_id', organizationId)
      .order('sort_order').order('created_at');
    if (result.error) { toast.error('Failed to load programs'); return; }
    setPrograms(result.data || []);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openNew() { setEditingProgram(null); setForm(EMPTY_FORM); setNewTagInput(''); setShowModal(true); }

  function openEdit(program) {
    setEditingProgram(program);
    setForm({
      name:                 program.name || '',
      description:          program.description || '',
      audience:             program.audience || '',
      schedule:             program.schedule || '',
      start_date:           program.start_date || '',
      end_date:             program.end_date || '',
      capacity:             program.capacity != null ? String(program.capacity) : '',
      enrolled_count:       program.enrolled_count != null ? String(program.enrolled_count) : '',
      how_to_apply:         program.how_to_apply || '',
      contact_name:         program.contact_name || '',
      contact_email:        program.contact_email || '',
      status:               program.status || 'active',
      is_public:            program.is_public !== false,
      publish_to_discovery: program.publish_to_discovery === true,
      tags:                 program.tags || [],
    });
    setNewTagInput('');
    setShowModal(true);
  }

  async function saveProgram() {
    if (!form.name.trim()) { toast.error('Program name is required'); return; }
    setSaving(true);
    var safeForm = Object.assign({}, form);
    if (!safeForm.is_public) safeForm.publish_to_discovery = false;
    var payload = {
      organization_id:      organizationId,
      name:                 safeForm.name.trim(),
      description:          safeForm.description || null,
      audience:             safeForm.audience || null,
      schedule:             safeForm.schedule || null,
      start_date:           safeForm.start_date || null,
      end_date:             safeForm.end_date || null,
      capacity:             safeForm.capacity !== '' ? parseInt(safeForm.capacity, 10) : null,
      enrolled_count:       safeForm.enrolled_count !== '' ? parseInt(safeForm.enrolled_count, 10) : 0,
      how_to_apply:         safeForm.how_to_apply || null,
      contact_name:         safeForm.contact_name || null,
      contact_email:        safeForm.contact_email || null,
      status:               safeForm.status,
      is_public:            safeForm.is_public,
      publish_to_discovery: safeForm.publish_to_discovery,
      tags:                 safeForm.tags || [],
      updated_at:           new Date().toISOString(),
    };
    var result = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);
    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save program', 'Check your connection and try again.'); return; }
    mascotSuccessToast(editingProgram ? 'Program updated' : 'Program created');
    setShowModal(false);
    fetchPrograms();
  }

  async function deleteProgram(id) {
    if (!window.confirm('Delete this program? This cannot be undone.')) return;
    var result = await supabase.from('org_programs').delete().eq('id', id);
    if (result.error) { mascotErrorToast('Failed to delete program'); return; }
    mascotSuccessToast('Program deleted');
    fetchPrograms();
  }

  async function copyProgram(program) {
    var payload = {
      organization_id:      organizationId,
      name:                 program.name + ' (Copy)',
      description:          program.description || null,
      audience:             program.audience || null,
      schedule:             program.schedule || null,
      start_date:           program.start_date || null,
      end_date:             program.end_date || null,
      capacity:             program.capacity || null,
      enrolled_count:       0,
      how_to_apply:         program.how_to_apply || null,
      contact_name:         program.contact_name || null,
      contact_email:        program.contact_email || null,
      status:               program.status,
      is_public:            false,
      publish_to_discovery: false,
      tags:                 program.tags || [],
      sort_order:           programs.length,
      updated_at:           new Date().toISOString(),
    };
    var result = await supabase.from('org_programs').insert(payload);
    if (result.error) { mascotErrorToast('Failed to copy program'); return; }
    mascotSuccessToast('Program copied — it is hidden until you publish it');
    fetchPrograms();
  }

  // ── Visibility toggles ────────────────────────────────────────────────────
  async function togglePublic(program) {
    var updates = { is_public: !program.is_public };
    if (!updates.is_public) updates.publish_to_discovery = false;
    var result = await supabase.from('org_programs').update(updates).eq('id', program.id);
    if (result.error) { toast.error('Failed to update program'); return; }
    setPrograms(function(prev) {
      return prev.map(function(p) { return p.id === program.id ? Object.assign({}, p, updates) : p; });
    });
  }

  async function toggleDiscovery(program) {
    if (!program.is_public) { toast.error('Enable "Show on org page" first'); return; }
    var newVal = !program.publish_to_discovery;
    var result = await supabase.from('org_programs').update({ publish_to_discovery: newVal }).eq('id', program.id);
    if (result.error) { toast.error('Failed to update program'); return; }
    setPrograms(function(prev) {
      return prev.map(function(p) { return p.id === program.id ? Object.assign({}, p, { publish_to_discovery: newVal }) : p; });
    });
    mascotSuccessToast(newVal ? 'Added to Discover' : 'Removed from Discover');
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  function toggleTag(tag) {
    setForm(function(prev) {
      var tags = prev.tags || [];
      var idx  = tags.indexOf(tag);
      return Object.assign({}, prev, {
        tags: idx === -1 ? tags.concat([tag]) : tags.filter(function(t) { return t !== tag; }),
      });
    });
  }

  function addCustomTag() {
    var tag = newTagInput.trim();
    if (!tag) return;
    setForm(function(prev) {
      var tags = prev.tags || [];
      if (tags.indexOf(tag) === -1) tags = tags.concat([tag]);
      return Object.assign({}, prev, { tags: tags });
    });
    setNewTagInput('');
  }

  function removeTag(tag) {
    setForm(function(prev) {
      return Object.assign({}, prev, { tags: (prev.tags || []).filter(function(t) { return t !== tag; }) });
    });
  }

  // ── Form field helper ─────────────────────────────────────────────────────
  function setField(key, value) {
    setForm(function(prev) {
      var update = {};
      update[key] = value;
      if (key === 'is_public' && !value) update.publish_to_discovery = false;
      return Object.assign({}, prev, update);
    });
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function handleDragStart(id, e) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }

  function handleDragOver(id, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  }

  function handleDrop(targetId) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null); setDragOverId(null); return;
    }
    var fromIdx = programs.findIndex(function(p) { return p.id === draggingId; });
    var toIdx   = programs.findIndex(function(p) { return p.id === targetId; });
    var arr     = programs.slice();
    var moved   = arr.splice(fromIdx, 1)[0];
    arr.splice(toIdx, 0, moved);
    var updated = arr.map(function(p, i) { return Object.assign({}, p, { sort_order: i }); });
    setPrograms(updated);
    setDraggingId(null);
    setDragOverId(null);
    saveSortOrder(updated);
  }

  async function saveSortOrder(ordered) {
    setSavingOrder(true);
    var promises = ordered.map(function(p, i) {
      return supabase.from('org_programs').update({ sort_order: i }).eq('id', p.id);
    });
    var results = await Promise.all(promises);
    setSavingOrder(false);
    var failed = results.some(function(r) { return r.error; });
    if (failed) toast.error('Failed to save order — try again');
  }

  // ── Computed view ─────────────────────────────────────────────────────────
  var isAdmin      = effectiveRole === 'admin';
  var isDragEnabled = isAdmin && sortBy === 'custom' && statusFilter === 'all' && !searchQuery.trim();

  var statusCounts = {
    all:     programs.length,
    active:  programs.filter(function(p) { return p.status === 'active'; }).length,
    upcoming: programs.filter(function(p) { return p.status === 'upcoming'; }).length,
    closed:  programs.filter(function(p) { return p.status === 'closed'; }).length,
  };

  var displayPrograms = programs
    .filter(function(p) {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().indexOf(q) !== -1 ||
          (p.description || '').toLowerCase().indexOf(q) !== -1 ||
          (p.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) !== -1; })
        );
      }
      return true;
    })
    .slice()
    .sort(function(a, b) {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'start_date') {
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date < b.start_date ? -1 : 1;
      }
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

  // ── Input style helper ────────────────────────────────────────────────────
  var inputStyle = { width: '100%', padding: '8px 12px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '14px', color: TEXT, outline: 'none', boxSizing: 'border-box' };
  var labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: PAGE_BG, padding: '32px 24px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ height: '28px', width: '160px', background: BDR, borderRadius: '8px' }} className="animate-pulse" />
          <div style={{ height: '36px', width: '120px', background: BDR, borderRadius: '8px' }} className="animate-pulse" />
        </div>
        <div style={{ height: '44px', background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '10px', marginBottom: '20px' }} className="animate-pulse" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1,2,3,4,5,6].map(function(i) {
            return (
              <div key={i} style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '12px', padding: '20px' }} className="animate-pulse">
                <div style={{ height: '16px', width: '60%', background: BDR, borderRadius: '4px', marginBottom: '10px' }} />
                <div style={{ height: '20px', width: '80px', background: ELEVATED, borderRadius: '99px', marginBottom: '12px' }} />
                <div style={{ height: '12px', width: '90%', background: ELEVATED, borderRadius: '4px', marginBottom: '6px' }} />
                <div style={{ height: '12px', width: '70%', background: ELEVATED, borderRadius: '4px' }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ minHeight: '100vh', background: PAGE_BG, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: '32px 24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: TEXT, margin: 0 }}>Programs</h1>
            {organization && <p style={{ fontSize: '13px', color: MUTED, margin: '4px 0 0' }}>{organization.name}</p>}
          </div>
          {isAdmin && (
            <button
              onClick={openNew}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Icon path={ICONS.plus} className="h-4 w-4" />
              Add Program
            </button>
          )}
        </div>

        {/* Filter / sort bar */}
        {programs.length > 0 && (
          <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>

            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
              <Icon path={ICONS.search} className="h-4 w-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={function(e) { setSearchQuery(e.target.value); }}
                placeholder="Search programs..."
                aria-label="Search programs"
                style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT, outline: 'none', boxSizing: 'border-box' }}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { key: 'all',      label: 'All' },
                { key: 'active',   label: 'Active' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'closed',   label: 'Closed' },
              ].map(function(f) {
                var active = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={function() { setStatusFilter(f.key); }}
                    style={{
                      padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer',
                      background: active ? '#0E1523' : ELEVATED,
                      color:      active ? '#FFFFFF' : TEXT2,
                    }}
                    className="focus:outline-none focus:ring-2 focus:ring-slate-400"
                    aria-pressed={active}
                  >
                    {f.label}
                    <span style={{ marginLeft: '5px', fontSize: '11px', opacity: 0.7 }}>{statusCounts[f.key]}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={function(e) { setSortBy(e.target.value); }}
              aria-label="Sort programs"
              style={{ padding: '6px 10px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT2, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              className="focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">Custom Order</option>
              <option value="name">Name A–Z</option>
              <option value="start_date">Start Date</option>
            </select>

            {/* Saving order indicator */}
            {savingOrder && (
              <span style={{ fontSize: '12px', color: MUTED }}>Saving order...</span>
            )}
            {isDragEnabled && !savingOrder && (
              <span style={{ fontSize: '12px', color: MUTED }}>Drag cards to reorder</span>
            )}
          </div>
        )}

        {/* Empty state */}
        {programs.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '80px 24px', background: CARD_BG, border: '2px dashed ' + BDR, borderRadius: '12px' }}
            role="region" aria-label="No programs"
          >
            <div style={{ color: MUTED, marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Icon path={ICONS.programs} className="h-14 w-14" sw={1} />
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>No programs yet</h2>
            <p style={{ color: MUTED, fontSize: '13px', maxWidth: '280px', margin: '0 auto 24px' }}>
              {isAdmin ? 'Add your first program to share with your community.' : 'This organization has not added any programs yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={openNew}
                style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Your First Program
              </button>
            )}
          </div>
        ) : displayPrograms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '12px' }}>
            <div style={{ color: MUTED, marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <Icon path={ICONS.search} className="h-10 w-10" sw={1} />
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>No programs match your filters</h2>
            <p style={{ color: MUTED, fontSize: '13px' }}>Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}
            role="list"
            aria-label="Programs"
          >
            {displayPrograms.map(function(program) {
              var enrolled     = program.enrolled_count || 0;
              var cap          = program.capacity;
              var capPct       = cap ? Math.min(100, Math.round(enrolled / cap * 100)) : null;
              var capBarColor  = capPct >= 100 ? '#EF4444' : capPct >= 75 ? '#F59E0B' : '#22C55E';
              var isClosed     = program.status === 'closed';
              var isExpanded   = expandedId === program.id;
              var isDragging   = draggingId === program.id;
              var isDragTarget = dragOverId === program.id && draggingId !== program.id;
              var startFmt     = formatDate(program.start_date);
              var endFmt       = formatDate(program.end_date);
              var hasExpand    = !!(program.how_to_apply || program.contact_name);

              return (
                <article
                  key={program.id}
                  role="listitem"
                  aria-label={program.name + ' program'}
                  draggable={isDragEnabled}
                  onDragStart={function(e) { handleDragStart(program.id, e); }}
                  onDragOver={function(e) { handleDragOver(program.id, e); }}
                  onDrop={function(e) { e.preventDefault(); handleDrop(program.id); }}
                  onDragEnd={function() { setDraggingId(null); setDragOverId(null); }}
                  style={{
                    background:    program.is_public ? CARD_BG : CARD_ALT,
                    border:        isDragTarget ? '2px solid #3B82F6' : '1px solid ' + BDR,
                    borderRadius:  '12px',
                    padding:       '20px',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           '10px',
                    opacity:       isClosed ? 0.65 : isDragging ? 0.4 : 1,
                    cursor:        isDragEnabled ? 'grab' : 'default',
                    transition:    'opacity 0.2s, border-color 0.15s',
                  }}
                >
                  {/* Drag handle hint */}
                  {isDragEnabled && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-4px', color: MUTED, opacity: 0.4 }} aria-hidden="true">
                      <Icon path={ICONS.grip} className="h-4 w-4" />
                    </div>
                  )}

                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.3 }}>{program.name}</h2>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button
                          onClick={function(e) { e.stopPropagation(); openEdit(program); }}
                          style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                          className="hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={'Edit ' + program.name}
                        >
                          <Icon path={ICONS.pencil} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={function(e) { e.stopPropagation(); copyProgram(program); }}
                          style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                          className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                          aria-label={'Copy ' + program.name}
                        >
                          <Icon path={ICONS.copy} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={function(e) { e.stopPropagation(); deleteProgram(program.id); }}
                          style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                          className="hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={'Delete ' + program.name}
                        >
                          <Icon path={ICONS.trash} className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status + visibility badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px',
                      background: program.status === 'active'   ? 'rgba(34,197,94,0.12)'
                                : program.status === 'upcoming' ? 'rgba(59,130,246,0.12)'
                                :                                  'rgba(100,116,139,0.12)',
                      color:      program.status === 'active'   ? '#22C55E'
                                : program.status === 'upcoming' ? '#3B82F6'
                                :                                  '#64748B',
                    }}>
                      {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                    </span>
                    {program.publish_to_discovery && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                        <Icon path={ICONS.globe} className="h-3 w-3" />
                        On Discover
                      </span>
                    )}
                    {isAdmin && !program.is_public && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(245,183,49,0.12)', color: '#B45309' }}>Hidden</span>
                    )}
                  </div>

                  {/* Tags */}
                  {program.tags && program.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {program.tags.map(function(tag) {
                        return (
                          <span key={tag} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: ELEVATED, color: TEXT2, border: '1px solid ' + BDR }}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Capacity bar */}
                  {cap != null && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: MUTED }}>
                          <Icon path={ICONS.users} className="h-3.5 w-3.5" />
                          <span>Enrolled</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: capPct >= 100 ? '#EF4444' : TEXT2 }}>
                          {capPct >= 100 ? 'Full' : enrolled + ' / ' + cap}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: BDR, borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: capPct + '%', height: '100%', background: capBarColor, borderRadius: '99px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  {/* Description (clamped when collapsed) */}
                  {program.description && (
                    <p style={{
                      fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0,
                      overflow: isExpanded ? 'visible' : 'hidden',
                      display: isExpanded ? 'block' : '-webkit-box',
                      WebkitLineClamp: isExpanded ? 'unset' : 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {program.description}
                    </p>
                  )}

                  {/* Date range */}
                  {(startFmt || endFmt) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                      <Icon path={ICONS.calendar} className="h-3.5 w-3.5" />
                      <span>
                        {startFmt && endFmt ? startFmt + ' – ' + endFmt : startFmt ? 'Starts ' + startFmt : 'Ends ' + endFmt}
                      </span>
                    </div>
                  )}

                  {/* Audience / schedule */}
                  {(program.audience || program.schedule) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {program.audience && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                          <Icon path={ICONS.user} className="h-3.5 w-3.5" />
                          <span>For: {program.audience}</span>
                        </div>
                      )}
                      {program.schedule && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                          <Icon path={ICONS.clock} className="h-3.5 w-3.5" />
                          <span>{program.schedule}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable section */}
                  {hasExpand && (
                    <>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {program.how_to_apply && (
                            <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '8px' }}>
                              <p style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 4px' }}>How to Apply</p>
                              <p style={{ fontSize: '13px', color: TEXT2, margin: 0 }}>{program.how_to_apply}</p>
                            </div>
                          )}
                          {program.contact_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                              <Icon path={ICONS.user} className="h-3.5 w-3.5" />
                              <span>Contact: {program.contact_name}</span>
                              {program.contact_email && (
                                <a
                                  href={'mailto:' + program.contact_email}
                                  style={{ color: '#3B82F6', display: 'flex', marginLeft: '2px' }}
                                  className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                                  aria-label={'Email ' + program.contact_name}
                                >
                                  <Icon path={ICONS.mail} className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={function(e) { e.stopPropagation(); setExpandedId(isExpanded ? null : program.id); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', alignSelf: 'flex-start' }}
                        className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse ' + program.name + ' details' : 'Expand ' + program.name + ' details'}
                      >
                        <Icon path={isExpanded ? ICONS.chevronUp : ICONS.chevronDown} className="h-3.5 w-3.5" />
                        {isExpanded ? 'Show less' : 'View details'}
                      </button>
                    </>
                  )}

                  {/* Admin toggles footer */}
                  {isAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid ' + BDR }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: MUTED }}>Org page</span>
                        <Toggle
                          small checked={program.is_public}
                          onClick={function(e) { e.stopPropagation(); togglePublic(program); }}
                          label={'Toggle ' + program.name + ' org page visibility'}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: MUTED }}>Discover</span>
                        <Toggle
                          small checked={program.publish_to_discovery}
                          disabled={!program.is_public}
                          onClick={function(e) { e.stopPropagation(); toggleDiscovery(program); }}
                          label={'Toggle ' + program.name + ' on Discover'}
                          color="#8B5CF6"
                          ringColor="focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(14,21,35,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
          role="dialog" aria-modal="true" aria-labelledby="prog-modal-title"
          onClick={function() { setShowModal(false); }}
        >
          <div
            style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + BDR }}>
              <h2 id="prog-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: 0 }}>
                {editingProgram ? 'Edit Program' : 'Add Program'}
              </h2>
              <button
                onClick={function() { setShowModal(false); }}
                style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Close modal"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Name */}
              <div>
                <label htmlFor="prog-name" style={labelStyle}>
                  Program Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                </label>
                <input
                  id="prog-name" type="text" value={form.name}
                  onChange={function(e) { setField('name', e.target.value); }}
                  placeholder="e.g. After School Tutoring"
                  style={inputStyle} className="focus:ring-2 focus:ring-blue-500" aria-required="true"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="prog-desc" style={labelStyle}>Description</label>
                <textarea
                  id="prog-desc" value={form.description} rows={3}
                  onChange={function(e) { setField('description', e.target.value); }}
                  placeholder="What does this program do?"
                  style={Object.assign({}, inputStyle, { resize: 'none' })}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Start / End dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="prog-start" style={labelStyle}>Start Date</label>
                  <input
                    id="prog-start" type="date" value={form.start_date}
                    onChange={function(e) { setField('start_date', e.target.value); }}
                    style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="prog-end" style={labelStyle}>End Date</label>
                  <input
                    id="prog-end" type="date" value={form.end_date}
                    onChange={function(e) { setField('end_date', e.target.value); }}
                    style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Capacity / Enrolled */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="prog-capacity" style={labelStyle}>Capacity (Max Spots)</label>
                  <input
                    id="prog-capacity" type="number" min="0" value={form.capacity}
                    onChange={function(e) { setField('capacity', e.target.value); }}
                    placeholder="e.g. 30"
                    style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="prog-enrolled" style={labelStyle}>Currently Enrolled</label>
                  <input
                    id="prog-enrolled" type="number" min="0" value={form.enrolled_count}
                    onChange={function(e) { setField('enrolled_count', e.target.value); }}
                    placeholder="e.g. 12"
                    style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>Tags</label>
                {/* Predefined tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {PROGRAM_TAGS.map(function(tag) {
                    var sel = (form.tags || []).indexOf(tag) !== -1;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={function() { toggleTag(tag); }}
                        style={{
                          padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          border: sel ? 'none' : '1px solid ' + BDR,
                          background: sel ? '#3B82F6' : 'transparent',
                          color:      sel ? '#FFFFFF' : TEXT2,
                        }}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-pressed={sel}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Custom tag input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text" value={newTagInput}
                    onChange={function(e) { setNewTagInput(e.target.value); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                    placeholder="Custom tag — press Enter to add"
                    aria-label="Add custom tag"
                    style={Object.assign({}, inputStyle, { flex: 1 })}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button" onClick={addCustomTag}
                    style={{ padding: '8px 14px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: TEXT2, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    Add
                  </button>
                </div>

                {/* Custom tags (not in predefined list) */}
                {(form.tags || []).filter(function(t) { return PROGRAM_TAGS.indexOf(t) === -1; }).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {(form.tags || []).filter(function(t) { return PROGRAM_TAGS.indexOf(t) === -1; }).map(function(tag) {
                      return (
                        <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: '#0E1523', color: '#FFFFFF' }}>
                          {tag}
                          <button
                            type="button"
                            onClick={function() { removeTag(tag); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', color: 'rgba(255,255,255,0.7)' }}
                            className="hover:text-white focus:outline-none"
                            aria-label={'Remove tag ' + tag}
                          >
                            <Icon path={ICONS.x} className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Audience */}
              <div>
                <label htmlFor="prog-audience" style={labelStyle}>Who Is It For?</label>
                <input
                  id="prog-audience" type="text" value={form.audience}
                  onChange={function(e) { setField('audience', e.target.value); }}
                  placeholder="e.g. Youth ages 6–18"
                  style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Schedule */}
              <div>
                <label htmlFor="prog-schedule" style={labelStyle}>Schedule</label>
                <input
                  id="prog-schedule" type="text" value={form.schedule}
                  onChange={function(e) { setField('schedule', e.target.value); }}
                  placeholder="e.g. Every Monday 3–5pm"
                  style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* How to apply */}
              <div>
                <label htmlFor="prog-apply" style={labelStyle}>How To Apply / Sign Up</label>
                <textarea
                  id="prog-apply" value={form.how_to_apply} rows={2}
                  onChange={function(e) { setField('how_to_apply', e.target.value); }}
                  placeholder="e.g. Fill out form at front desk or call us"
                  style={Object.assign({}, inputStyle, { resize: 'none' })}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="prog-cname" style={labelStyle}>Contact Name</label>
                  <input
                    id="prog-cname" type="text" value={form.contact_name}
                    onChange={function(e) { setField('contact_name', e.target.value); }}
                    placeholder="Jane Smith"
                    style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="prog-cemail" style={labelStyle}>Contact Email</label>
                  <input
                    id="prog-cemail" type="email" value={form.contact_email}
                    onChange={function(e) { setField('contact_email', e.target.value); }}
                    placeholder="jane@org.org"
                    style={inputStyle} className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="prog-status" style={labelStyle}>Status</label>
                <select
                  id="prog-status" value={form.status}
                  onChange={function(e) { setField('status', e.target.value); }}
                  style={Object.assign({}, inputStyle, { width: '100%' })}
                  className="focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Visibility toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                  <Toggle
                    checked={form.is_public}
                    onClick={function() { setField('is_public', !form.is_public); }}
                    label="Toggle visibility on org page"
                  />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>Show on org page</p>
                    <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>Visitors to your public page will see this program</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR, opacity: form.is_public ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                  <Toggle
                    checked={form.publish_to_discovery}
                    disabled={!form.is_public}
                    onClick={function() { setField('publish_to_discovery', !form.publish_to_discovery); }}
                    label="Toggle visibility on Discover page"
                    color="#8B5CF6"
                    ringColor="focus:ring-purple-500"
                  />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>Show on Discover</p>
                    <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>
                      {form.is_public ? 'Anyone browsing /discover can find this program' : 'Enable "Show on org page" first'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid ' + BDR }}>
              <button
                onClick={function() { setShowModal(false); }}
                style={{ flex: 1, padding: '10px', border: '1px solid ' + BDR, color: TEXT2, fontSize: '14px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
                className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={saveProgram} disabled={saving}
                style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {saving ? 'Saving...' : (editingProgram ? 'Save Changes' : 'Add Program')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrgPrograms;