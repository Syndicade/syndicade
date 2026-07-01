// src/pages/OrgPrograms.jsx
// Syndicade — Programs retrofit onto shared ListPageLayout.jsx + Chip.jsx (July 1, 2026)
// Reference implementation followed: Opportunities/Funding.
// CODE RULE (§21): var only — never const/let. String concat for className.

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { getContentModalTags } from '../lib/platformTags';
import TemplatePickerModal, { PLATFORM_TEMPLATES } from '../components/TemplatePickerModal';
import { Users, RefreshCw, X } from 'lucide-react';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import ListPageLayout from '../components/design-system/ListPageLayout';
import Chip from '../components/design-system/Chip';
import { Button } from '../components/design-system/Button';
import ConfirmModal from '../components/ConfirmModal';
import ProgramCard from '../components/ProgramCard';
import CreateProgram from '../components/CreateProgram';

var BDR = '#E2E8F0';
var TEXT = '#0E1523';
var MUTED = '#64748B';
var CARD_BG = '#FFFFFF';
var INPUT_BG = '#F8FAFC';

// ── Registrations drawer (side panel, same category as Opportunities/Funding's
// Applications drawer — Escape/✕ close, no close-on-backdrop-click per Modal convention) ──
function RegistrationsDrawer(props) {
  var program = props.program;
  var modalRef = useRef(null);
  useModalKeyboard(true, props.onClose, modalRef);

  var regState = useState([]);
  var registrations = regState[0];
  var setRegistrations = regState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var editingNoteState = useState(null);
  var editingNoteId = editingNoteState[0];
  var setEditingNoteId = editingNoteState[1];

  var noteTextState = useState('');
  var noteText = noteTextState[0];
  var setNoteText = noteTextState[1];

  useEffect(function () { loadRegistrations(); }, [program.id]);

  async function loadRegistrations() {
    setLoading(true);
    var result = await supabase
      .from('program_registrations')
      .select('id, status, created_at, notes, user_id')
      .eq('program_id', program.id)
      .order('created_at', { ascending: false });
    if (result.error) { mascotErrorToast('Failed to load registrations.'); setLoading(false); return; }

    var rows = result.data || [];
    if (rows.length === 0) { setRegistrations([]); setLoading(false); return; }

    var userIds = rows.map(function (r) { return r.user_id; });
    var membersResult = await supabase.from('members').select('user_id, first_name, last_name').in('user_id', userIds);
    var membersMap = {};
    if (membersResult.data) {
      membersResult.data.forEach(function (m) { membersMap[m.user_id] = m.first_name + ' ' + m.last_name; });
    }
    setRegistrations(rows.map(function (r) {
      return Object.assign({}, r, { member_name: membersMap[r.user_id] || 'Unknown member' });
    }));
    setLoading(false);
  }

  async function updateStatus(regId, newStatus) {
    var authRes = await supabase.auth.getUser();
    var result = await supabase.from('program_registrations')
      .update({ status: newStatus, reviewed_by: authRes.data.user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', regId);
    if (result.error) { mascotErrorToast('Failed to update registration.'); return; }
    mascotSuccessToast(newStatus === 'enrolled' ? 'Registration approved.' : 'Registration declined.');
    loadRegistrations();
  }

  async function saveNote(regId) {
    var result = await supabase.from('program_registrations').update({ notes: noteText, updated_at: new Date().toISOString() }).eq('id', regId);
    if (result.error) { mascotErrorToast('Failed to save note.'); return; }
    mascotSuccessToast('Note saved.');
    setEditingNoteId(null);
    loadRegistrations();
  }

  var enrolled = registrations.filter(function (r) { return r.status === 'enrolled'; });
  var pending = registrations.filter(function (r) { return r.status === 'pending'; });
  var declined = registrations.filter(function (r) { return r.status === 'declined'; });
  var cancelled = registrations.filter(function (r) { return r.status === 'cancelled'; });

  function statusBadge(status) {
    var cfg = {
      enrolled: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E', label: 'Enrolled' },
      pending: { bg: 'rgba(245,183,49,0.15)', color: '#B45309', label: 'Pending' },
      declined: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'Declined' },
      cancelled: { bg: 'rgba(100,116,139,0.1)', color: '#64748B', label: 'Cancelled' }
    };
    var c = cfg[status] || cfg.pending;
    return <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: c.bg, color: c.color }}>{c.label}</span>;
  }

  function RegRow(rowProps) {
    var r = rowProps.reg;
    var isEditing = editingNoteId === r.id;
    return (
      <div style={{ background: rowProps.highlight ? 'rgba(245,183,49,0.06)' : CARD_BG, border: '1px solid ' + (rowProps.highlight ? 'rgba(245,183,49,0.25)' : BDR), borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{r.member_name}</p>
            <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
            {rowProps.showActions ? (
              <>
                <button onClick={function () { updateStatus(r.id, 'enrolled'); }} style={{ padding: '5px 12px', background: '#22C55E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={'Approve ' + r.member_name}>Approve</button>
                <button onClick={function () { updateStatus(r.id, 'declined'); }} style={{ padding: '5px 12px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={'Decline ' + r.member_name}>Decline</button>
              </>
            ) : statusBadge(r.status)}
          </div>
        </div>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <textarea value={noteText} onChange={function (e) { setNoteText(e.target.value); }} rows={2} placeholder="Add a private note..." aria-label={'Note for ' + r.member_name} style={{ width: '100%', padding: '7px 10px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '12px', color: TEXT, resize: 'none', outline: 'none', boxSizing: 'border-box' }} className="focus:ring-2 focus:ring-blue-500" />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={function () { saveNote(r.id); }} style={{ padding: '4px 12px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Save</button>
              <button onClick={function () { setEditingNoteId(null); }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '12px', color: MUTED, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={function () { setEditingNoteId(r.id); setNoteText(r.notes || ''); }} style={{ alignSelf: 'flex-start', fontSize: '11px', color: r.notes ? '#3B82F6' : MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} className="hover:underline focus:outline-none" aria-label={(r.notes ? 'Edit note for ' : 'Add note for ') + r.member_name}>
            {r.notes ? r.notes : '+ Add note'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 55, display: 'flex', justifyContent: 'flex-end' }} role="dialog" aria-modal="true" aria-labelledby="reg-drawer-title">
      <div ref={modalRef} style={{ background: CARD_BG, width: '100%', maxWidth: '480px', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + BDR, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h2 id="reg-drawer-title" style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: '0 0 2px' }}>Registrations</h2>
            <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>{program.name}</p>
          </div>
          <button onClick={props.onClose} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }} className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Close registrations">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: BDR, borderBottom: '1px solid ' + BDR }}>
          {[{ label: 'Enrolled', count: enrolled.length, color: '#22C55E' }, { label: 'Pending', count: pending.length, color: '#F59E0B' }, { label: 'Declined', count: declined.length, color: '#EF4444' }].map(function (s) {
            return (
              <div key={s.label} style={{ background: CARD_BG, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '11px', color: MUTED }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 24px', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-hidden="true">
              {[1, 2, 3].map(function (i) { return <div key={i} style={{ height: '60px', background: '#F1F5F9', borderRadius: '8px' }} className="animate-pulse" />; })}
            </div>
          ) : registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <Users size={36} style={{ color: MUTED, margin: '0 auto 12px' }} aria-hidden="true" />
              <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>No registrations yet</p>
              <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>Members who register will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pending.length > 0 && <p style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px' }}>Needs Review</p>}
              {pending.map(function (r) { return <RegRow key={r.id} reg={r} showActions highlight />; })}
              {enrolled.length > 0 && <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', margin: '8px 0 4px' }}>Enrolled</p>}
              {enrolled.map(function (r) { return <RegRow key={r.id} reg={r} />; })}
              {(declined.length > 0 || cancelled.length > 0) && <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '2px', margin: '8px 0 4px' }}>Other</p>}
              {declined.concat(cancelled).map(function (r) { return <div key={r.id} style={{ opacity: 0.65 }}><RegRow reg={r} /></div>; })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MakeTemplateModal(props) {
  var program = props.program;
  var modalRef = useRef(null);
  useModalKeyboard(true, props.onClose, modalRef);

  var nameState = useState(program.name);
  var name = nameState[0];
  var setName = nameState[1];

  var savingState = useState(false);
  var saving = savingState[0];
  var setSaving = savingState[1];

  async function handleSave() {
    if (!name.trim()) { toast.error('Template name is required.'); return; }
    setSaving(true);
    var payload = Object.assign({}, program, {
      name: name.trim(), is_template: true, is_public: false,
      show_on_website: false, show_on_discover: false, publish_to_discovery: false, is_featured: false,
      updated_at: new Date().toISOString()
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_programs').insert(payload);
    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save template.', result.error.message); return; }
    mascotSuccessToast('Template saved!');
    props.onSaved();
    props.onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }} role="dialog" aria-modal="true" aria-labelledby="tmpl-prog-title">
      <div ref={modalRef} style={{ background: CARD_BG, borderRadius: '12px', padding: '28px', maxWidth: '400px', width: '100%', border: '0.5px solid ' + BDR, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <h3 id="tmpl-prog-title" style={{ fontSize: '16px', fontWeight: 800, color: TEXT, marginBottom: '6px' }}>Save as Template</h3>
        <p style={{ fontSize: '13px', color: MUTED, marginBottom: '20px' }}>This program will be saved as a reusable template for your org.</p>
        <label htmlFor="tmpl-prog-name" style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'block', marginBottom: '6px' }}>Template name</label>
        <input id="tmpl-prog-name" value={name} onChange={function (e) { setName(e.target.value); }} style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT, outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }} className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="ghost" onClick={props.onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Template'}</Button>
        </div>
      </div>
    </div>
  );
}

function OrgPrograms() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();
  var outletCtx = useOutletContext() || {};
  var isAdmin = outletCtx.isAdmin === true;

  var programsState = useState([]);
  var programs = programsState[0];
  var setPrograms = programsState[1];

  var pageStatusState = useState('loading'); // loading | error | ready
  var pageStatus = pageStatusState[0];
  var setPageStatus = pageStatusState[1];

  var organizationState = useState(null);
  var organization = organizationState[0];
  var setOrganization = organizationState[1];

  var currentUserIdState = useState(null);
  var currentUserId = currentUserIdState[0];
  var setCurrentUserId = currentUserIdState[1];

  var orgGroupsState = useState([]);
  var orgGroups = orgGroupsState[0];
  var setOrgGroups = orgGroupsState[1];

  var savedIdsState = useState(new Set());
  var savedIds = savedIdsState[0];
  var setSavedIds = savedIdsState[1];

  var myRegistrationsState = useState({});
  var myRegistrations = myRegistrationsState[0];
  var setMyRegistrations = myRegistrationsState[1];

  var regCountsState = useState({}); // program_id -> pending count (admin)
  var pendingRegCounts = regCountsState[0];
  var setPendingRegCounts = regCountsState[1];

  var showModalState = useState(false);
  var showModal = showModalState[0];
  var setShowModal = showModalState[1];

  var editingProgramState = useState(null);
  var editingProgram = editingProgramState[0];
  var setEditingProgram = editingProgramState[1];

  var templateDataState = useState(null);
  var templateData = templateDataState[0];
  var setTemplateData = templateDataState[1];

  var tagGroupsState = useState({ causeAreas: [], audience: [], activityTypes: [], languages: [] });
  var tagGroups = tagGroupsState[0];
  var setTagGroups = tagGroupsState[1];

  var orgDefaultsState = useState(null);
  var orgDefaults = orgDefaultsState[0];
  var setOrgDefaults = orgDefaultsState[1];

  var confirmModalState = useState({ open: false, title: '', message: '', confirmLabel: '', variant: 'destructive', onConfirm: null });
  var confirmModal = confirmModalState[0];
  var setConfirmModal = confirmModalState[1];

  var drawerProgramState = useState(null);
  var drawerProgram = drawerProgramState[0];
  var setDrawerProgram = drawerProgramState[1];

  var makingTemplateState = useState(null);
  var makingTemplate = makingTemplateState[0];
  var setMakingTemplate = makingTemplateState[1];

  var showTemplatePickerState = useState(false);
  var showTemplatePicker = showTemplatePickerState[0];
  var setShowTemplatePicker = showTemplatePickerState[1];

  var draggingIdState = useState(null);
  var draggingId = draggingIdState[0];
  var setDraggingId = draggingIdState[1];

  var dragOverIdState = useState(null);
  var dragOverId = dragOverIdState[0];
  var setDragOverId = dragOverIdState[1];

  var savingOrderState = useState(false);
  var savingOrder = savingOrderState[0];
  var setSavingOrder = savingOrderState[1];

  var statusFilterState = useState('all');
  var statusFilter = statusFilterState[0];
  var setStatusFilter = statusFilterState[1];

  var sortByState = useState('custom');
  var sortBy = sortByState[0];
  var setSortBy = sortByState[1];

  var searchQueryState = useState('');
  var searchQuery = searchQueryState[0];
  var setSearchQuery = searchQueryState[1];

  function openConfirm(title, message, confirmLabel, onConfirmFn) {
    setConfirmModal({ open: true, title: title, message: message, confirmLabel: confirmLabel, variant: 'destructive', onConfirm: onConfirmFn });
  }
  function closeConfirm() {
    setConfirmModal({ open: false, title: '', message: '', confirmLabel: '', variant: 'destructive', onConfirm: null });
  }

  useEffect(function () { init(); }, [organizationId]);
  useEffect(function () { getContentModalTags('program').then(function (g) { setTagGroups(g); }); }, []);

  async function init() {
    setPageStatus('loading');
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { navigate('/login'); return; }
      setCurrentUserId(authResult.data.user.id);

      var orgResult = await supabase.from('organizations').select('id, name, logo_url, tag_defaults').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);
      setOrgDefaults(orgResult.data.tag_defaults || null);

      var groupsResult = await supabase.from('org_groups').select('id, name').eq('organization_id', organizationId).eq('is_active', true).order('name');
      setOrgGroups(groupsResult.data || []);

      await Promise.all([
        fetchPrograms(),
        fetchSaves(authResult.data.user.id),
        fetchMyRegistrations(authResult.data.user.id)
      ]);
      setPageStatus('ready');
    } catch (err) {
      console.error('OrgPrograms init error:', err);
      setPageStatus('error');
    }
  }

  async function fetchPrograms() {
    var result = await supabase.from('org_programs').select('*').eq('organization_id', organizationId).order('sort_order').order('created_at');
    if (result.error) throw result.error;
    setPrograms(result.data || []);
    if (isAdmin) fetchPendingCounts(result.data || []);
  }

  async function fetchPendingCounts(list) {
    var ids = list.map(function (p) { return p.id; });
    if (ids.length === 0) { setPendingRegCounts({}); return; }
    var result = await supabase.from('program_registrations').select('program_id').eq('status', 'pending').in('program_id', ids);
    if (result.error) return;
    var counts = {};
    (result.data || []).forEach(function (r) { counts[r.program_id] = (counts[r.program_id] || 0) + 1; });
    setPendingRegCounts(counts);
  }

  async function fetchSaves(uid) {
    var result = await supabase.from('program_saves').select('program_id').eq('user_id', uid);
    if (result.error) return;
    setSavedIds(new Set((result.data || []).map(function (r) { return r.program_id; })));
  }

  async function fetchMyRegistrations(uid) {
    var result = await supabase.from('program_registrations').select('program_id, id, status').eq('user_id', uid).eq('organization_id', organizationId);
    if (result.error) return;
    var map = {};
    (result.data || []).forEach(function (r) { map[r.program_id] = r; });
    setMyRegistrations(map);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openNew() {
    setEditingProgram(null);
    setTemplateData(null);
    setShowModal(true);
  }

  function openEdit(program) {
    setEditingProgram(program);
    setTemplateData(null);
    setShowModal(true);
  }

  function handleTemplateSelect(template, name) {
    setShowTemplatePicker(false);
    setEditingProgram(null);
    setTemplateData(Object.assign({}, {
      name: template.name || '',
      description: template.description || '',
      type: template.type || '',
      audience: template.audience || '',
      schedule: template.schedule || '',
      cost_type: template.cost_type || 'free',
      requires_approval: template.requires_approval || false,
      registration_open: template.registration_open !== false,
      apply_method: template.apply_method || 'form',
      tags: template.tags || [],
      _templateName: name
    }));
    setShowModal(true);
  }

  function handleSaved(isNew, name, wasPublished) {
    setShowModal(false);
    fetchPrograms();
    if (isNew && wasPublished) notifyNewProgram(name);
  }

  async function notifyNewProgram(name) {
    try {
      var notifModule = await import('../lib/notificationService');
      var authRes = await supabase.auth.getUser();
      await notifModule.notifyOrganizationMembers({
        organizationId: organizationId,
        type: 'new_program',
        title: name,
        message: (organization ? organization.name : 'Your organization') + ' added a new program.',
        link: '/organizations/' + organizationId + '/programs',
        excludeUserId: authRes.data.user ? authRes.data.user.id : null
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch (ne) { console.error('Program notification failed:', ne); }
  }

  function deleteProgram(id, name) {
    openConfirm('Delete "' + name + '"?', 'This program will be permanently deleted and cannot be recovered.', 'Delete Program', async function () {
      closeConfirm();
      var result = await supabase.from('org_programs').delete().eq('id', id);
      if (result.error) { mascotErrorToast('Failed to delete program.', result.error.message); return; }
      mascotSuccessToast('Program deleted.');
      fetchPrograms();
    });
  }

  async function copyProgram(program) {
    var payload = Object.assign({}, program, {
      name: program.name + ' (Copy)', is_public: false, publish_to_discovery: false,
      show_on_website: false, show_on_discover: false, is_featured: false,
      sort_order: programs.length, updated_at: new Date().toISOString()
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_programs').insert(payload);
    if (result.error) { mascotErrorToast('Failed to copy program.', result.error.message); return; }
    mascotSuccessToast('Program copied — it is saved as a draft.');
    fetchPrograms();
  }

  // ── Bookmark ──────────────────────────────────────────────────────────────
  async function toggleSave(e, programId) {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) return;
    var isSaved = savedIds.has(programId);
    if (isSaved) {
      var r = await supabase.from('program_saves').delete().eq('program_id', programId).eq('user_id', currentUserId);
      if (r.error) { mascotErrorToast('Failed to remove bookmark.'); return; }
      setSavedIds(function (prev) { var next = new Set(prev); next.delete(programId); return next; });
    } else {
      var r2 = await supabase.from('program_saves').insert({ program_id: programId, user_id: currentUserId });
      if (r2.error) { mascotErrorToast('Failed to save program.'); return; }
      setSavedIds(function (prev) { var next = new Set(prev); next.add(programId); return next; });
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────
  async function handleRegister(e, program) {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) { navigate('/login'); return; }

    if (program.cost_type === 'paid' && program.cost_amount && parseFloat(program.cost_amount) > 0) {
      var orgResult = await supabase.from('organizations').select('stripe_connect_account_id, stripe_connect_status').eq('id', organizationId).single();
      var hasConnect = orgResult.data && orgResult.data.stripe_connect_account_id && orgResult.data.stripe_connect_status === 'active';
      if (!hasConnect) { toast.error('This program cannot accept payments right now.'); return; }
      try {
        var authRes = await supabase.auth.getSession();
        var token = authRes.data.session ? authRes.data.session.access_token : '';
        var res = await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            type: 'program', program_id: program.id, organization_id: organizationId,
            success_url: window.location.origin + '/organizations/' + organizationId + '/programs/' + program.id + '?payment=success',
            cancel_url: window.location.origin + '/organizations/' + organizationId + '/programs/' + program.id + '?payment=cancelled'
          })
        });
        var data = await res.json();
        if (!res.ok || !data.url) { mascotErrorToast('Could not start checkout.', data.error || 'Please try again.'); return; }
        window.location.href = data.url;
        return;
      } catch (err) {
        mascotErrorToast('Checkout failed.', 'Check your connection and try again.');
        return;
      }
    }

    var countRes = await supabase.from('program_registrations').select('id', { count: 'exact', head: true }).eq('program_id', program.id).eq('status', 'enrolled');
    var cap = program.capacity;
    if (cap != null && countRes.count >= cap) { toast.error('This program is full.'); return; }
    var status = program.requires_approval ? 'pending' : 'enrolled';
    var result = await supabase.from('program_registrations').insert({ program_id: program.id, user_id: currentUserId, organization_id: organizationId, status: status, payment_status: 'not_required' });
    if (result.error) {
      if (result.error.code === '23505') { toast.error('You are already registered.'); return; }
      mascotErrorToast('Registration failed.', 'Please try again.');
      return;
    }
    setMyRegistrations(function (prev) { var next = Object.assign({}, prev); next[program.id] = { program_id: program.id, status: status }; return next; });
    mascotSuccessToast(status === 'enrolled' ? 'Registered!' : 'Request submitted!', status === 'enrolled' ? 'You are now enrolled in ' + program.name + '.' : 'Your registration is pending approval.');
    try {
      var notifModule = await import('../lib/notificationService');
      var authRes2 = await supabase.auth.getUser();
      var membersRes = await supabase.from('members').select('first_name, last_name').eq('user_id', authRes2.data.user.id).single();
      var memberName = membersRes.data ? membersRes.data.first_name + ' ' + membersRes.data.last_name : 'A member';
      await notifModule.notifyOrgAdmins({ organizationId: organizationId, type: 'program_registration', title: program.name, message: memberName + (status === 'enrolled' ? ' registered for ' : ' requested to join ') + program.name + '.', link: '/organizations/' + organizationId + '/programs', excludeUserId: currentUserId });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch (ne) { console.error('Registration notification failed:', ne); }
  }

  function handleCancelRegistration(e, program) {
    e.preventDefault(); e.stopPropagation();
    var reg = myRegistrations[program.id];
    if (!reg) return;
    setConfirmModal({
      open: true, variant: 'neutral', confirmLabel: 'Cancel Registration',
      title: 'Cancel registration?',
      message: 'You will be removed from ' + program.name + '. You can re-register later if spots are available.',
      onConfirm: async function () {
        closeConfirm();
        var result = await supabase.from('program_registrations').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', reg.id);
        if (result.error) { mascotErrorToast('Failed to cancel registration.'); return; }
        setMyRegistrations(function (prev) { var next = Object.assign({}, prev); delete next[program.id]; return next; });
        mascotSuccessToast('Registration cancelled.');
      }
    });
  }

  // ── Drag & drop (admin, Custom sort, no filters — matches original behavior) ──
  function handleDragStart(id, e) { setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); }
  function handleDragOver(id, e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverId !== id) setDragOverId(id); }
  function handleDrop(targetId) {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    var fromIdx = programs.findIndex(function (p) { return p.id === draggingId; });
    var toIdx = programs.findIndex(function (p) { return p.id === targetId; });
    var arr = programs.slice();
    var moved = arr.splice(fromIdx, 1)[0];
    arr.splice(toIdx, 0, moved);
    var updated = arr.map(function (p, i) { return Object.assign({}, p, { sort_order: i }); });
    setPrograms(updated);
    setDraggingId(null);
    setDragOverId(null);
    saveSortOrder(updated);
  }

  async function saveSortOrder(ordered) {
    setSavingOrder(true);
    var promises = ordered.map(function (p, i) { return supabase.from('org_programs').update({ sort_order: i }).eq('id', p.id); });
    var results = await Promise.all(promises);
    setSavingOrder(false);
    if (results.some(function (r) { return r.error; })) toast.error('Failed to save order — try again');
    else mascotSuccessToast('Order saved.');
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  var isDragEnabled = isAdmin && sortBy === 'custom' && statusFilter === 'all' && !searchQuery.trim();

  var statusCounts = {
    all: programs.length,
    active: programs.filter(function (p) { return p.status === 'active'; }).length,
    upcoming: programs.filter(function (p) { return p.status === 'upcoming'; }).length,
    closed: programs.filter(function (p) { return p.status === 'closed'; }).length
  };

  var displayPrograms = programs
    .filter(function (p) {
      if (!isAdmin && (!p.visibility ? !p.is_public : p.visibility === 'draft')) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        return p.name.toLowerCase().indexOf(q) !== -1 || (p.description || '').toLowerCase().indexOf(q) !== -1 || (p.tags || []).some(function (t) { return t.toLowerCase().indexOf(q) !== -1; });
      }
      return true;
    })
    .slice()
    .sort(function (a, b) {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'start_date') {
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date < b.start_date ? -1 : 1;
      }
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

  var listStatus;
  if (pageStatus === 'loading') listStatus = 'loading';
  else if (pageStatus === 'error') listStatus = 'error';
  else if (programs.length === 0) listStatus = 'empty';
  else if (displayPrograms.length === 0) listStatus = 'no-results';
  else listStatus = 'ready';

  var STATUS_CHIPS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'closed', label: 'Closed' }
  ];

  var filtersContent = (
    <>
      <div role="group" aria-label="Filter by status" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {STATUS_CHIPS.map(function (f) {
          return (
            <Chip key={f.key} selected={statusFilter === f.key} onClick={function () { setStatusFilter(f.key); }}>
              {f.label}{statusCounts[f.key] > 0 ? ' (' + statusCounts[f.key] + ')' : ''}
            </Chip>
          );
        })}
      </div>
      <select
        value={sortBy}
        onChange={function (e) { setSortBy(e.target.value); }}
        aria-label="Sort programs"
        style={{ padding: '7px 10px', background: CARD_BG, border: '0.5px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: '#475569', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
        className="focus:ring-2 focus:ring-blue-500"
      >
        <option value="custom">Custom Order</option>
        <option value="name">Name A–Z</option>
        <option value="start_date">Start Date</option>
      </select>
      {savingOrder && <span style={{ fontSize: '12px', color: MUTED }}>Saving order...</span>}
      {isDragEnabled && !savingOrder && <span style={{ fontSize: '12px', color: MUTED }}>Drag cards to reorder</span>}
    </>
  );

  return (
    <>
      <ListPageLayout
        title="Programs"
        subtitle={programs.length + ' program' + (programs.length !== 1 ? 's' : '')}
        headerActions={isAdmin ? (
          <>
            <Button variant="ghost" onClick={function () { setShowTemplatePicker(true); }}>Templates</Button>
            <Button variant="primary" onClick={openNew}>Add Program</Button>
          </>
        ) : null}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search programs..."
        searchLabel="Search programs"
        filters={filtersContent}
        status={listStatus}
        onRetry={init}
        onClearFilters={function () { setSearchQuery(''); setStatusFilter('all'); }}
        emptyStateConfig={{
          heading: 'No programs yet',
          description: isAdmin ? 'Add your first program to share with your community.' : 'This organization has not added any programs yet.',
          primaryActionLabel: isAdmin ? 'Add Your First Program' : undefined,
          onPrimaryAction: isAdmin ? openNew : undefined,
          secondaryActionLabel: isAdmin ? 'Browse templates' : undefined,
          onSecondaryAction: isAdmin ? function () { setShowTemplatePicker(true); } : undefined
        }}
        itemListLabel="Programs"
      >
        {displayPrograms.map(function (program) {
          var isDragTarget = dragOverId === program.id && draggingId !== program.id;
          var isDragging = draggingId === program.id;
          var cardEl = (
            <ProgramCard
              program={program}
              isAdmin={isAdmin}
              organizationId={organizationId}
              isSaved={savedIds.has(program.id)}
              onToggleSave={toggleSave}
              myRegistration={myRegistrations[program.id]}
              onRegister={handleRegister}
              onCancelRegistration={handleCancelRegistration}
              onEdit={openEdit}
              onDuplicate={copyProgram}
              onMakeTemplate={setMakingTemplate}
              onViewRegistrations={setDrawerProgram}
              onDelete={deleteProgram}
              pendingRegCount={pendingRegCounts[program.id] || 0}
            />
          );

          if (!isDragEnabled) {
            return <div key={program.id}>{cardEl}</div>;
          }

          return (
            <div
              key={program.id}
              draggable
              onDragStart={function (e) { handleDragStart(program.id, e); }}
              onDragOver={function (e) { handleDragOver(program.id, e); }}
              onDrop={function (e) { e.preventDefault(); handleDrop(program.id); }}
              onDragEnd={function () { setDraggingId(null); setDragOverId(null); }}
              style={{
                outline: isDragTarget ? '2px solid #3B82F6' : 'none',
                borderRadius: '12px',
                opacity: isDragging ? 0.4 : 1,
                cursor: 'grab'
              }}
            >
              {cardEl}
            </div>
          );
        })}
      </ListPageLayout>

      {showModal && (
        <CreateProgram
          organizationId={organizationId}
          organization={organization}
          editingProgram={editingProgram}
          templateData={templateData}
          tagGroups={tagGroups}
          orgDefaults={orgDefaults}
          orgGroups={orgGroups}
          onClose={function () { setShowModal(false); }}
          onSaved={handleSaved}
        />
      )}

      {showTemplatePicker && (
        <TemplatePickerModal
          contentType="program"
          organizationId={organizationId}
          onClose={function () { setShowTemplatePicker(false); }}
          onSelect={handleTemplateSelect}
        />
      )}

      {confirmModal.open && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm || function () {}}
          onCancel={closeConfirm}
        />
      )}

      {drawerProgram && (
        <RegistrationsDrawer program={drawerProgram} organizationId={organizationId} onClose={function () { setDrawerProgram(null); }} />
      )}

      {makingTemplate && (
        <MakeTemplateModal program={makingTemplate} onClose={function () { setMakingTemplate(null); }} onSaved={fetchPrograms} />
      )}
    </>
  );
}

export default OrgPrograms;