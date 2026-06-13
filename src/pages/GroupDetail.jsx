import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { notifyGroupMembers } from '../lib/notificationService';
import CreateEvent from '../components/CreateEvent';
import FileUploadModal from '../components/FileUploadModal';
import MemberCard from '../components/MemberCard';

// ─── Constants ────────────────────────────────────────────────────────────────

var TYPE_LABELS = {
  committee: 'Committee', board: 'Board', team: 'Team', volunteer: 'Volunteer', other: 'Other',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];

function getAvatarColor(name) {
  var char = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[char % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  var parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

var CardGridSkeleton = function(props) {
  var count = props.count || 3;
  var cols = props.cols || 3;
  var gridClass = cols === 4
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
  return (
    <div className={gridClass} aria-busy="true">
      {Array.from({ length: count }).map(function(_, i) {
        return (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
            <div className="h-7 bg-slate-100 rounded-lg w-24 mt-2" />
          </div>
        );
      })}
    </div>
  );
};

var MemberGridSkeleton = function() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" aria-busy="true">
      {Array.from({ length: 6 }).map(function(_, i) {
        return (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="h-3.5 bg-slate-200 rounded w-20" />
            <div className="h-3 bg-slate-100 rounded w-16" />
            <div className="h-7 bg-slate-100 rounded-lg w-full mt-1" />
          </div>
        );
      })}
    </div>
  );
};

var PageSkeleton = function() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="px-6 py-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-100 rounded mb-5" />
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-2">
            <div className="h-8 w-52 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
          </div>
          <div className="h-9 w-28 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-3 mb-5">
          {[1,2,3].map(function(i) { return <div key={i} className="h-14 w-28 bg-slate-100 rounded-xl" />; })}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 flex">
            {[1,2,3,4].map(function(i) { return <div key={i} className="px-5 py-3.5 h-12 w-28 bg-slate-100 m-1 rounded" />; })}
          </div>
          <div className="p-6"><MemberGridSkeleton /></div>
        </div>
      </div>
    </main>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

var ConfirmModal = function(props) {
  var title = props.title;
  var message = props.message;
  var confirmLabel = props.confirmLabel || 'Delete';
  var confirmClass = props.confirmClass || 'bg-red-500 hover:bg-red-600 focus:ring-red-500';
  var onConfirm = props.onConfirm;
  var onCancel = props.onCancel;

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4"
      role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="mb-5">
          <h2 id="confirm-modal-title" className="text-base font-bold text-[#0E1523] mb-1">{title}</h2>
          <p className="text-sm text-[#475569]">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} autoFocus
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={'px-4 py-2 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ' + confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Actions Dropdown ─────────────────────────────────────────────────────────
// openDir: 'up' (default) or 'down'

var ActionsDropdown = function(props) {
  var items = props.items;
  var label = props.label || 'Actions';
  var openDir = props.openDir || 'up';
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function() {
    if (!open) return;
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', outside);
    return function() { document.removeEventListener('mousedown', outside); };
  }, [open]);

  useEffect(function() {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [open]);

  var menuPositionClass = openDir === 'up'
    ? 'right-0 bottom-full mb-1.5'
    : 'right-0 top-full mt-1.5';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={function(e) { e.stopPropagation(); setOpen(function(v) { return !v; }); }}
        className={'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ' + (open ? 'bg-slate-100 border-slate-300 text-[#0E1523]' : 'bg-white border-slate-200 text-[#475569] hover:bg-slate-50 hover:border-slate-300')}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          className={'absolute w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden ' + menuPositionClass}
          role="menu"
        >
          {items.map(function(item, i) {
            if (item.separator) return <div key={i} className="h-px bg-slate-100 mx-3 my-1" role="separator" />;
            return (
              <button key={i} role="menuitem"
                onClick={function(e) { e.stopPropagation(); setOpen(false); item.onClick(); }}
                className={'w-full text-left px-4 py-2.5 text-sm transition-colors focus:outline-none ' + (item.danger ? 'text-red-500 hover:bg-red-50 focus:bg-red-50' : 'text-[#475569] hover:bg-slate-50 hover:text-[#0E1523] focus:bg-slate-50')}>
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── XIcon (modal close only) ─────────────────────────────────────────────────

var XIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
};

// ─── Edit Group Modal ─────────────────────────────────────────────────────────

var EditGroupModal = function(props) {
  var group = props.group;
  var onClose = props.onClose;
  var onSaved = props.onSaved;

  var [form, setForm] = useState({
    name: group.name || '',
    description: group.description || '',
    type: group.type || 'committee',
    visibility: group.visibility || 'members',
    join_approval_required: group.join_approval_required !== false,
    color: group.color || '#3B82F6',
  });
  var [saving, setSaving] = useState(false);

  function updateForm(key, val) {
    setForm(function(f) { var n = Object.assign({}, f); n[key] = val; return n; });
  }

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  var handleSave = async function() {
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    setSaving(true);
    try {
      var res = await supabase.from('org_groups').update({
        name: form.name.trim(), description: form.description.trim(),
        type: form.type, visibility: form.visibility,
        join_approval_required: form.join_approval_required,
        color: form.color, updated_at: new Date().toISOString(),
      }).eq('id', group.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Group updated');
      onSaved();
    } catch (e) { mascotErrorToast('Failed to update group', e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="edit-group-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="edit-group-title" className="text-xl font-bold text-[#0E1523]">Edit Group</h2>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close"><XIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="eg-name" className="block text-sm font-medium text-[#0E1523] mb-1">Group Name <span className="text-red-500" aria-hidden="true">*</span></label>
            <input id="eg-name" type="text" value={form.name} onChange={function(e) { updateForm('name', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxLength={100} aria-required="true" />
          </div>
          <div>
            <label htmlFor="eg-desc" className="block text-sm font-medium text-[#0E1523] mb-1">Description</label>
            <textarea id="eg-desc" value={form.description} onChange={function(e) { updateForm('description', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="eg-type" className="block text-sm font-medium text-[#0E1523] mb-1">Type</label>
              <select id="eg-type" value={form.type} onChange={function(e) { updateForm('type', e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="committee">Committee</option><option value="board">Board</option>
                <option value="team">Team</option><option value="volunteer">Volunteer</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="eg-vis" className="block text-sm font-medium text-[#0E1523] mb-1">Visibility</label>
              <select id="eg-vis" value={form.visibility} onChange={function(e) { updateForm('visibility', e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="public">Public</option><option value="members">All Members</option><option value="group_only">Group Members Only</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="eg-color" className="block text-sm font-medium text-[#0E1523] mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input id="eg-color" type="color" value={form.color} onChange={function(e) { updateForm('color', e.target.value); }}
                className="w-10 h-10 border border-slate-300 rounded cursor-pointer p-0.5" />
              <span className="text-sm text-[#64748B]">Group identifier color</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input id="eg-approval" type="checkbox" checked={form.join_approval_required}
              onChange={function(e) { updateForm('join_approval_required', e.target.checked); }}
              className="mt-0.5 w-4 h-4 border-slate-300 rounded text-blue-500 focus:ring-blue-500 cursor-pointer" />
            <label htmlFor="eg-approval" className="text-sm text-[#475569] cursor-pointer">
              <span className="font-medium text-[#0E1523]">Require admin approval</span> for join requests
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2" aria-busy={saving}>
            {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status"><span className="sr-only">Saving...</span></div>Saving...</>) : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add Member Modal ─────────────────────────────────────────────────────────

var AddMemberModal = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var existingMemberIds = props.existingMemberIds;
  var onClose = props.onClose;
  var onSaved = props.onSaved;

  var [orgMembers, setOrgMembers] = useState([]);
  var [selected, setSelected] = useState('');
  var [role, setRole] = useState('member');
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(function() {
    async function load() {
      try {
        var memRes = await supabase.from('memberships').select('member_id').eq('organization_id', organizationId).eq('status', 'active');
        if (memRes.error) throw memRes.error;
        var allIds = (memRes.data || []).map(function(m) { return m.member_id; });
        var availableIds = allIds.filter(function(id) { return existingMemberIds.indexOf(id) === -1; });
        if (availableIds.length === 0) { setOrgMembers([]); setLoading(false); return; }
        var namesRes = await supabase.from('members').select('user_id, first_name, last_name').in('user_id', availableIds);
        if (namesRes.error) throw namesRes.error;
        setOrgMembers((namesRes.data || []).map(function(m) {
          return {
            member_id: m.user_id,
            full_name: ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || m.user_id,
          };
        }).filter(function(m) {
          // Only show members who have an actual name (not just a UUID fallback)
          return m.full_name && m.full_name !== m.member_id && m.full_name.trim() !== '';
        }).sort(function(a, b) { return a.full_name.localeCompare(b.full_name); }));
      } catch (e) { mascotErrorToast('Failed to load members', e.message); }
      finally { setLoading(false); }
    }
    load();
  }, [groupId, organizationId, existingMemberIds]);

  var handleAdd = async function() {
    if (!selected) { toast.error('Select a member'); return; }
    setSaving(true);
    try {
      var res = await supabase.from('org_group_members').insert({ group_id: groupId, member_id: selected, organization_id: organizationId, role: role.trim() || 'Member' });
      if (res.error) throw res.error;
      mascotSuccessToast('Member added');
      onSaved();
    } catch (e) { mascotErrorToast('Failed to add member', e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="add-member-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="add-member-title" className="text-xl font-bold text-[#0E1523]">Add Member</h2>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close"><XIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24" /><div className="h-10 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-200 rounded w-16" /><div className="h-10 bg-slate-200 rounded" />
            </div>
          ) : orgMembers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-[#0E1523]">Everyone's already in</p>
              <p className="text-sm text-[#475569] mt-1">All active members are already in this group.</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="am-member" className="block text-sm font-medium text-[#0E1523] mb-1">Member <span className="text-red-500" aria-hidden="true">*</span></label>
                <select id="am-member" value={selected} onChange={function(e) { setSelected(e.target.value); }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" aria-required="true">
                  <option value="">— Select a member —</option>
                  {orgMembers.map(function(m) { return <option key={m.member_id} value={m.member_id}>{m.full_name}</option>; })}
                </select>
              </div>
              <div>
                <label htmlFor="am-role" className="block text-sm font-medium text-[#0E1523] mb-1">Role</label>
                <input id="am-role" type="text" value={role} onChange={function(e) { setRole(e.target.value); }}
                  list="am-role-suggestions" placeholder="e.g. Member, Chair, Treasurer..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <datalist id="am-role-suggestions">
                  <option value="Member" /><option value="Chair" /><option value="Co-Chair" />
                  <option value="Vice Chair" /><option value="Secretary" /><option value="Treasurer" />
                  <option value="President" /><option value="Vice President" /><option value="Coordinator" />
                </datalist>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          {orgMembers.length > 0 && (
            <button onClick={handleAdd} disabled={saving || !selected}
              className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2" aria-busy={saving}>
              {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status"><span className="sr-only">Adding...</span></div>Adding...</>) : 'Add Member'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Link Event Modal ─────────────────────────────────────────────────────────

var LinkEventModal = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var linkedEventIds = props.linkedEventIds;
  var onClose = props.onClose;
  var onSaved = props.onSaved;
  var [events, setEvents] = useState([]);
  var [selected, setSelected] = useState('');
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  useEffect(function() {
    async function load() {
      var res = await supabase.from('events').select('id, title, start_time').eq('organization_id', organizationId).order('start_time', { ascending: false }).limit(50);
      setEvents((res.data || []).filter(function(e) { return linkedEventIds.indexOf(e.id) === -1; }));
      setLoading(false);
    }
    load();
  }, [organizationId, linkedEventIds]);

  var handleLink = async function() {
    if (!selected) { toast.error('Select an event'); return; }
    setSaving(true);
    try {
      var res = await supabase.from('event_groups').insert({ event_id: selected, group_id: groupId });
      if (res.error) throw res.error;
      mascotSuccessToast('Event linked to group');
      onSaved();
    } catch (e) { mascotErrorToast('Failed to link event', e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="link-event-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="link-event-title" className="text-xl font-bold text-[#0E1523]">Link Existing Event</h2>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close"><XIcon /></button>
        </div>
        <div className="p-6">
          {loading ? <div className="h-10 bg-slate-200 rounded animate-pulse" />
          : events.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-[#0E1523]">No events available</p>
              <p className="text-sm text-[#475569] mt-1">All org events are already linked to this group.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="le-event" className="block text-sm font-medium text-[#0E1523] mb-1">Select Event <span className="text-red-500" aria-hidden="true">*</span></label>
              <select id="le-event" value={selected} onChange={function(e) { setSelected(e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" aria-required="true">
                <option value="">— Select an event —</option>
                {events.map(function(ev) { return <option key={ev.id} value={ev.id}>{ev.title} — {new Date(ev.start_time).toLocaleDateString()}</option>; })}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          {events.length > 0 && (
            <button onClick={handleLink} disabled={saving || !selected}
              className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2" aria-busy={saving}>
              {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status"><span className="sr-only">Linking...</span></div>Linking...</>) : 'Link Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── EditRoleModal ────────────────────────────────────────────────────────────

var EditRoleModal = function(props) {
  var gm = props.gm;
  var name = props.name;
  var onClose = props.onClose;
  var onSaved = props.onSaved;
  var [role, setRole] = useState(gm.role || 'Member');
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  var handleSave = async function() {
    setSaving(true);
    try {
      var res = await supabase.from('org_group_members').update({ role: role.trim() || 'Member' }).eq('id', gm.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Role updated');
      onSaved();
    } catch (e) {
      mascotErrorToast('Failed to update role', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4"
      role="dialog" aria-modal="true" aria-labelledby="edit-role-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 id="edit-role-title" className="text-base font-bold text-[#0E1523] mb-1">Edit Role</h2>
        <p className="text-sm text-[#64748B] mb-4">{name}</p>
        <input
          type="text"
          value={role}
          onChange={function(e) { setRole(e.target.value); }}
          list="er-role-suggestions"
          placeholder="e.g. Member, Chair, Treasurer..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          aria-label={'Role for ' + name}
          autoFocus
        />
        <datalist id="er-role-suggestions">
          <option value="Member" /><option value="Chair" /><option value="Co-Chair" />
          <option value="Vice Chair" /><option value="Secretary" /><option value="Treasurer" />
          <option value="President" /><option value="Vice President" /><option value="Coordinator" />
        </datalist>
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
            aria-busy={saving}>
            {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status"><span className="sr-only">Saving...</span></div>Saving...</>) : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MemberCardModal ──────────────────────────────────────────────────────────

var MemberCardModal = function(props) {
  var gm = props.gm;
  var onClose = props.onClose;

  var profile = gm.profile || {};
  var member = Object.assign({}, profile, { user_id: gm.member_id });
  var name = member.display_name || (((member.first_name || '') + ' ' + (member.last_name || '')).trim()) || member.user_id;
  var avatarUrl = member.avatar_url || member.profile_photo_url;

  var AVATAR_BG = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
  var avatarBg = AVATAR_BG[(name.charCodeAt(0) || 65) % AVATAR_BG.length];

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="gd-member-modal-name">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">

        {/* Gradient header */}
        <div className="px-6 pt-6 pb-10 flex-shrink-0" style={{ background: 'linear-gradient(135deg, ' + avatarBg + ' 0%, ' + avatarBg + 'cc 100%)' }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
            aria-label="Close member profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0" style={{ color: avatarBg }} aria-hidden="true">
                {getInitials(name)}
              </div>
            )}
            <div>
              <h2 id="gd-member-modal-name" className="text-2xl font-bold text-white">{name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {gm.role && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white bg-opacity-25 text-white">
                    {gm.role}
                  </span>
                )}
                {member.pronouns && member.show_pronouns && (
                  <span className="text-white text-opacity-75 text-xs">{member.pronouns}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 -mt-4 mx-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 space-y-4">

            {/* Contact */}
            {(member.city && member.state) && (
              <p className="text-sm text-[#475569]">{member.city + ', ' + member.state}</p>
            )}

            {/* Bio */}
            {member.bio && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">About</p>
                <p className="text-sm text-[#475569] leading-relaxed">{member.bio}</p>
              </div>
            )}

            {/* Interests */}
            {member.interests && member.interests.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.interests.map(function(interest) {
                    return <span key={interest} className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#475569] border border-slate-200">{interest}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Group role context */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Role in this group</p>
              <p className="text-sm font-semibold text-[#0E1523]">{gm.role || 'Member'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex-shrink-0 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-[#475569] text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Manage Members Modal ─────────────────────────────────────────────────────
// Admin-only drawer for editing roles and removing members from the group.

var ManageMembersModal = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var onClose = props.onClose;
  var onChanged = props.onChanged; // called when any change is made so MembersTab refetches

  var [members, setMembers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [editingRole, setEditingRole] = useState({});
  var [confirmRemove, setConfirmRemove] = useState(null);
  var [hasChanges, setHasChanges] = useState(false);

  var COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];

  var getProfileName = function(gm) {
    var p = gm.profile;
    if (!p) return 'Unknown';
    return p.display_name || (((p.first_name || '') + ' ' + (p.last_name || '')).trim()) || p.user_id || 'Unknown';
  };

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(hasChanges); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose, hasChanges]);

  var fetchMembers = useCallback(async function() {
    setLoading(true);
    try {
      var res = await supabase.from('org_group_members')
        .select('id, member_id, role, status, created_at')
        .eq('group_id', groupId).eq('status', 'active').order('created_at');
      var activeData = res.data || [];
      var ids = activeData.map(function(r) { return r.member_id; });

      var profileMap = {};
      if (ids.length > 0) {
        var rpcRes = await supabase.rpc('get_member_profiles', { member_ids: ids });
        if (!rpcRes.error) {
          (rpcRes.data || []).forEach(function(m) { profileMap[m.user_id] = m; });
        }
      }

      var withProfiles = activeData.map(function(r) {
        return Object.assign({}, r, {
          profile: profileMap[r.member_id] || { user_id: r.member_id, first_name: '', last_name: '' }
        });
      });
      setMembers(withProfiles);
      var roles = {};
      activeData.forEach(function(r) { roles[r.id] = r.role || 'Member'; });
      setEditingRole(roles);
    } catch (_err) { mascotErrorToast('Failed to load members'); }
    finally { setLoading(false); }
  }, [groupId]);

  useEffect(function() { fetchMembers(); }, [fetchMembers]);

  var handleRoleSave = async function(gm) {
    var newRole = (editingRole[gm.id] || '').trim() || 'Member';
    try {
      var res = await supabase.from('org_group_members').update({ role: newRole }).eq('id', gm.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Role updated');
      setHasChanges(true);
    } catch (e) { mascotErrorToast('Failed to update role', e.message); }
  };

  var handleRemoveConfirmed = async function() {
    if (!confirmRemove) return;
    var gmId = confirmRemove.id;
    setConfirmRemove(null);
    try {
      var res = await supabase.from('org_group_members').delete().eq('id', gmId);
      if (res.error) throw res.error;
      mascotSuccessToast('Member removed');
      setHasChanges(true);
      fetchMembers(); // refresh the list inside the modal — do NOT close
    } catch (e) { mascotErrorToast('Failed to remove member', e.message); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby="manage-members-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(hasChanges); }}>
      <div className="bg-white w-full sm:rounded-xl sm:max-w-lg shadow-xl flex flex-col max-h-[90vh] rounded-t-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 id="manage-members-title" className="text-lg font-bold text-[#0E1523]">Manage Members</h2>
            <p className="text-sm text-[#64748B] mt-0.5">Edit roles or remove members from this group</p>
          </div>
          <button onClick={function() { onClose(hasChanges); }}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Member list */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(function(i) {
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-slate-200 rounded w-32" />
                      <div className="h-3 bg-slate-100 rounded w-20" />
                    </div>
                    <div className="h-8 w-28 bg-slate-100 rounded-lg" />
                  </div>
                );
              })}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-semibold text-[#0E1523]">No members yet</p>
              <p className="text-xs text-[#64748B] mt-1">Add members from the Members tab.</p>
            </div>
          ) : (
            <ul className="space-y-2" role="list" aria-label="Manage group members">
              {members.map(function(gm) {
                var name = getProfileName(gm);
                var avatarUrl = gm.profile && (gm.profile.avatar_url || gm.profile.profile_photo_url);
                var bg = COLORS[(name.charCodeAt(0) || 65) % COLORS.length];
                var isDirty = editingRole[gm.id] !== (gm.role || 'Member');

                return (
                  <li key={gm.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: bg }} aria-hidden="true">
                        {getInitials(name)}
                      </div>
                    )}

                    {/* Name */}
                    <p className="font-medium text-[#0E1523] text-sm flex-1 min-w-0 truncate">{name}</p>

                    {/* Role input + Save */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <input
                        type="text"
                        value={editingRole[gm.id] || ''}
                        onChange={function(e) {
                          var val = e.target.value;
                          setEditingRole(function(prev) {
                            var next = Object.assign({}, prev);
                            next[gm.id] = val;
                            return next;
                          });
                        }}
                        list="mm-role-suggestions"
                        placeholder="Role"
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
                        aria-label={'Role for ' + name}
                      />
                      {isDirty && (
                        <button onClick={function() { handleRoleSave(gm); }}
                          className="px-2 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={'Save role for ' + name}>
                          Save
                        </button>
                      )}
                      <button onClick={function() { setConfirmRemove({ id: gm.id, name: name }); }}
                        className="px-2 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        aria-label={'Remove ' + name + ' from group'}>
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <datalist id="mm-role-suggestions">
            <option value="Member" /><option value="Chair" /><option value="Co-Chair" />
            <option value="Vice Chair" /><option value="Secretary" /><option value="Treasurer" />
            <option value="President" /><option value="Vice President" /><option value="Coordinator" />
          </datalist>
        </div>

        <div className="p-4 border-t border-slate-200 flex-shrink-0">
          <button onClick={function() { if (props.onClose) props.onClose(true); }}
            className="w-full px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Done
          </button>
        </div>
      </div>

      {confirmRemove && (
        <ConfirmModal title={'Remove ' + confirmRemove.name + '?'}
          message="They will be removed from this group. They can be re-added at any time."
          confirmLabel="Remove" confirmClass="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          onConfirm={handleRemoveConfirmed} onCancel={function() { setConfirmRemove(null); }} />
      )}
    </div>
  );
};

// ─── Members Tab — responsive card grid ──────────────────────────────────────

var MembersTab = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var isAdmin = props.isAdmin;
  var onCountChange = props.onCountChange;

  var [members, setMembers] = useState([]);
  var [pending, setPending] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showAddModal, setShowAddModal] = useState(false);
  var [search, setSearch] = useState('');
  var [profileModal, setProfileModal] = useState(null);

  var COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];

  var getProfileName = function(gm) {
    var p = gm.profile;
    if (!p) return 'Unknown';
    var n = p.display_name || (((p.first_name || '') + ' ' + (p.last_name || '')).trim());
    return (n && n.length > 0) ? n : 'Unknown';
  };

  var fetchMembers = useCallback(async function() {
    setLoading(true);
    try {
      var [activeRes, pendingRes] = await Promise.all([
        supabase.from('org_group_members')
          .select('id, member_id, role, status, created_at')
          .eq('group_id', groupId).eq('status', 'active').order('created_at'),
        supabase.from('org_group_members')
          .select('id, member_id, status, created_at')
          .eq('group_id', groupId).eq('status', 'pending'),
      ]);
      var activeData = activeRes.data || [];
      var pendingData = pendingRes.data || [];
      var allIds = activeData.map(function(r) { return r.member_id; })
        .concat(pendingData.map(function(r) { return r.member_id; }));

      var profileMap = {};
      if (allIds.length > 0) {
        var rpcRes = await supabase.rpc('get_member_profiles', { member_ids: allIds });
        if (!rpcRes.error) {
          (rpcRes.data || []).forEach(function(m) { profileMap[m.user_id] = m; });
        }
      }

      var normalize = function(rows) {
        return rows.map(function(r) {
          return Object.assign({}, r, {
            profile: profileMap[r.member_id] || { user_id: r.member_id, first_name: '', last_name: '' }
          });
        });
      };
      setMembers(normalize(activeData));
      setPending(normalize(pendingData));
      if (onCountChange) onCountChange(activeData.length);
    } catch (_err) { mascotErrorToast('Failed to load members'); }
    finally { setLoading(false); }
  }, [groupId, onCountChange]);

  useEffect(function() { fetchMembers(); }, [fetchMembers]);

  var handleApprove = async function(row) {
    try {
      var res = await supabase.from('org_group_members').update({ status: 'active' }).eq('id', row.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Request approved');
      fetchMembers();
    } catch (e) { mascotErrorToast('Failed to approve', e.message); }
  };

  var handleDeny = async function(row) {
    try {
      var res = await supabase.from('org_group_members').delete().eq('id', row.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Request denied');
      fetchMembers();
    } catch (e) { mascotErrorToast('Failed to deny', e.message); }
  };

  var filtered = search
    ? members.filter(function(gm) { return getProfileName(gm).toLowerCase().indexOf(search.toLowerCase()) !== -1; })
    : members;

  var existingIds = members.map(function(m) { return m.member_id; });

  return (
    <div>
      {isAdmin && pending.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">
            {pending.length} pending join {pending.length === 1 ? 'request' : 'requests'}
          </p>
          <ul className="space-y-2" role="list" aria-label="Pending join requests">
            {pending.map(function(row) {
              var name = getProfileName(row);
              var bg = COLORS[(name.charCodeAt(0) || 65) % COLORS.length];
              return (
                <li key={row.id} className="flex items-center gap-3 bg-white rounded-lg border border-amber-100 p-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: bg }} aria-hidden="true">{getInitials(name)}</div>
                  <span className="flex-1 text-sm font-medium text-[#0E1523]">{name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={function() { handleApprove(row); }}
                      className="px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                      aria-label={'Approve ' + name}>Approve</button>
                    <button onClick={function() { handleDeny(row); }}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-300 text-[#475569] rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      aria-label={'Deny ' + name}>Deny</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <input type="search" value={search} onChange={function(e) { setSearch(e.target.value); }}
            placeholder="Search members..."
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            aria-label="Search members" />
          <span className="text-sm text-[#64748B]">
            {loading ? '' : filtered.length + ' ' + (filtered.length === 1 ? 'member' : 'members')}
          </span>
        </div>
        {isAdmin && (
          <button onClick={function() { setShowAddModal(true); }}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Add Member
          </button>
        )}
      </div>

      {loading ? <MemberGridSkeleton /> : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="font-semibold text-[#0E1523] mb-1">{members.length === 0 ? 'No members yet' : 'No results'}</p>
          <p className="text-sm text-[#475569] mb-4">
            {members.length === 0 ? 'Add organization members to get this group started.' : 'No members match your search.'}
          </p>
          {isAdmin && members.length === 0 && (
            <button onClick={function() { setShowAddModal(true); }}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          role="list" aria-label="Group members">
          {filtered.map(function(gm) {
            var name = getProfileName(gm);
            var avatarUrl = gm.profile && (gm.profile.avatar_url || gm.profile.profile_photo_url);
            var bg = COLORS[(name.charCodeAt(0) || 65) % COLORS.length];
            var roleLabel = gm.role || 'Member';
            return (
              <li key={gm.id}
                className="bg-white rounded-xl border border-slate-200 flex flex-col items-center text-center p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                onClick={function() { setProfileModal(gm); }}
                role="button"
                tabIndex={0}
                aria-label={'View profile for ' + name}
                onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileModal(gm); } }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover mb-2 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2 flex-shrink-0"
                    style={{ background: bg }} aria-hidden="true">
                    {getInitials(name)}
                  </div>
                )}
                <p className="font-semibold text-[#0E1523] text-sm leading-snug mb-1 w-full truncate">{name}</p>
                <p className="text-xs text-[#64748B]">{roleLabel}</p>
              </li>
            );
          })}
        </ul>
      )}

      {showAddModal && (
        <AddMemberModal groupId={groupId} organizationId={organizationId} existingMemberIds={existingIds}
          onClose={function() { setShowAddModal(false); }}
          onSaved={function() { setShowAddModal(false); fetchMembers(); }} />
      )}
      {profileModal && (
        <MemberCardModal gm={profileModal} onClose={function() { setProfileModal(null); }} />
      )}

    </div>
  );
};

// ─── Events Tab — grid cards ──────────────────────────────────────────────────

var EventsTab = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var orgName = props.orgName;
  var isAdmin = props.isAdmin;
  var onCountChange = props.onCountChange;

  var [events, setEvents] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showCreateEvent, setShowCreateEvent] = useState(false);
  var [showLinkModal, setShowLinkModal] = useState(false);
  var [confirmUnlink, setConfirmUnlink] = useState(null);

  var fetchEvents = useCallback(async function() {
    setLoading(true);
    try {
      var res = await supabase.from('event_groups').select('event_id, events(id, title, start_time, location)').eq('group_id', groupId);
      var extracted = (res.data || []).map(function(r) { return r.events; }).filter(Boolean)
        .sort(function(a, b) { return new Date(a.start_time) - new Date(b.start_time); });
      setEvents(extracted);
      if (onCountChange) onCountChange(extracted.length);
    } catch (_err) { mascotErrorToast('Failed to load events'); }
    finally { setLoading(false); }
  }, [groupId, onCountChange]);

  useEffect(function() { fetchEvents(); }, [fetchEvents]);

  var handleUnlinkConfirmed = async function() {
    if (!confirmUnlink) return;
    var eventId = confirmUnlink.id;
    setConfirmUnlink(null);
    try {
      var res = await supabase.from('event_groups').delete().eq('event_id', eventId).eq('group_id', groupId);
      if (res.error) throw res.error;
      mascotSuccessToast('Event removed from group');
      fetchEvents();
    } catch (e) { mascotErrorToast('Failed to unlink event', e.message); }
  };

  var linkedIds = events.map(function(e) { return e.id; });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[#64748B]">{loading ? '' : events.length + ' ' + (events.length === 1 ? 'event' : 'events')}</p>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button onClick={function() { setShowLinkModal(true); }}
                className="px-3 py-1.5 border border-slate-300 text-[#475569] text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                Link Event
              </button>
              <button onClick={function() { setShowCreateEvent(true); }}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Create Event
              </button>
            </>
          )}
          <Link to={'/organizations/' + organizationId + '/events'}
            className="text-sm text-blue-500 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            All events
          </Link>
        </div>
      </div>

      {loading ? <CardGridSkeleton count={3} cols={3} /> : events.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="font-semibold text-[#0E1523] mb-1">No events yet</p>
          <p className="text-sm text-[#475569] mb-4">
            {isAdmin ? 'Create a new event or link an existing one to this group.' : 'No events assigned to this group yet.'}
          </p>
          {isAdmin && (
            <div className="flex justify-center gap-2">
              <button onClick={function() { setShowLinkModal(true); }}
                className="px-4 py-2 border border-slate-300 text-[#475569] text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">
                Link Event
              </button>
              <button onClick={function() { setShowCreateEvent(true); }}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Create Event
              </button>
            </div>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Group events">
          {events.map(function(event) {
            var isPast = new Date(event.start_time) < new Date();
            var actions = [];
            if (isAdmin) {
              actions.push({ label: 'View', onClick: function() { window.location.href = '/organizations/' + organizationId + '/events/' + event.id; } });
              actions.push({ separator: true });
              actions.push({ label: 'Remove from group', danger: true, onClick: function() { setConfirmUnlink({ id: event.id, title: event.title }); } });
            } else {
              actions.push({ label: 'View', onClick: function() { window.location.href = '/organizations/' + organizationId + '/events/' + event.id; } });
            }
            return (
              <li key={event.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-[#0E1523] text-sm leading-snug flex-1">{event.title}</p>
                  {isPast && <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-[#64748B] flex-shrink-0">Past</span>}
                </div>
                <p className="text-xs text-[#64748B] mb-1">{formatDate(event.start_time)}</p>
                {event.location && <p className="text-xs text-[#94A3B8] mb-3 line-clamp-1">{event.location}</p>}
                <div className="flex-1" />
                <div className="pt-3 mt-2 border-t border-slate-100">
                  <ActionsDropdown label="Actions" openDir="up" items={actions} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CreateEvent isOpen={showCreateEvent}
        onClose={function() { setShowCreateEvent(false); }}
        onSuccess={async function(newEvent) {
          setShowCreateEvent(false);
          fetchEvents();
          try {
            var evRes = await supabase.auth.getUser();
            await notifyGroupMembers({
              groupId: groupId, organizationId: organizationId, type: 'new_event',
              title: (newEvent && newEvent.title) ? newEvent.title : 'New Event',
              message: 'A new event has been added to your group.',
              link: '/organizations/' + organizationId + '/groups/' + groupId,
              excludeUserId: evRes.data.user ? evRes.data.user.id : null,
            });
            window.dispatchEvent(new CustomEvent('notificationCreated'));
          } catch (_err) { console.error('Group event notification failed'); }
        }}
        organizationId={organizationId} organizationName={orgName} groupId={groupId} />

      {showLinkModal && (
        <LinkEventModal groupId={groupId} organizationId={organizationId} linkedEventIds={linkedIds}
          onClose={function() { setShowLinkModal(false); }}
          onSaved={function() { setShowLinkModal(false); fetchEvents(); }} />
      )}
      {confirmUnlink && (
        <ConfirmModal title={'Remove "' + confirmUnlink.title + '" from this group?'}
          message="The event itself won't be deleted — it will just be unlinked from this group."
          confirmLabel="Remove" confirmClass="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          onConfirm={handleUnlinkConfirmed} onCancel={function() { setConfirmUnlink(null); }} />
      )}
    </div>
  );
};

// ─── Documents Tab — grid cards ───────────────────────────────────────────────

var DocumentsTab = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var isAdmin = props.isAdmin;
  var onCountChange = props.onCountChange;

  var [documents, setDocuments] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showUpload, setShowUpload] = useState(false);
  var [confirmDelete, setConfirmDelete] = useState(null);

  var fetchDocs = useCallback(async function() {
    setLoading(true);
    try {
      var res = await supabase.from('documents')
        .select('id, title, file_name, file_type, file_size_bytes, uploaded_at, storage_path')
        .eq('organization_id', organizationId)
        .contains('allowed_groups', [groupId])
        .eq('is_current_version', true)
        .order('uploaded_at', { ascending: false });
      var data = res.data || [];
      setDocuments(data);
      if (onCountChange) onCountChange(data.length);
    } catch (_err) { mascotErrorToast('Failed to load documents'); }
    finally { setLoading(false); }
  }, [groupId, organizationId, onCountChange]);

  useEffect(function() { fetchDocs(); }, [fetchDocs]);

  var handleDownload = async function(doc) {
    try {
      var res = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600);
      if (res.error) throw res.error;
      window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (_e) { toast.error('Failed to generate download link'); }
  };

  var handleDeleteConfirmed = async function() {
    if (!confirmDelete) return;
    var doc = confirmDelete;
    setConfirmDelete(null);
    try {
      if (doc.storage_path) await supabase.storage.from('documents').remove([doc.storage_path]);
      var res = await supabase.from('documents').delete().eq('id', doc.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Document deleted');
      fetchDocs();
    } catch (e) { mascotErrorToast('Failed to delete document', e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[#64748B]">{loading ? '' : documents.length + ' ' + (documents.length === 1 ? 'document' : 'documents')}</p>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={function() { setShowUpload(true); }}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Upload
            </button>
          )}
          <Link to={'/organizations/' + organizationId + '/documents'}
            className="text-sm text-blue-500 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            Document library
          </Link>
        </div>
      </div>

      {loading ? <CardGridSkeleton count={3} cols={3} /> : documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="font-semibold text-[#0E1523] mb-1">No documents yet</p>
          <p className="text-sm text-[#475569] mb-4">
            {isAdmin ? 'Upload a document or assign existing ones from the document library.' : 'No documents have been shared with this group yet.'}
          </p>
          {isAdmin && (
            <button onClick={function() { setShowUpload(true); }}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Upload Document
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Group documents">
          {documents.map(function(doc) {
            var ext = (doc.file_name || '').split('.').pop().toUpperCase() || 'FILE';
            var actions = [
              { label: 'Download', onClick: function() { handleDownload(doc); } },
            ];
            if (isAdmin) {
              actions.push({ separator: true });
              actions.push({ label: 'Delete', danger: true, onClick: function() { setConfirmDelete({ id: doc.id, title: doc.title, storage_path: doc.storage_path }); } });
            }
            return (
              <li key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col hover:shadow-sm transition-shadow">
                {/* File type badge */}
                <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#475569] mb-2 self-start">
                  {ext}
                </span>
                <p className="font-semibold text-[#0E1523] text-sm leading-snug mb-1 line-clamp-2">{doc.title}</p>
                <p className="text-xs text-[#94A3B8] mb-3">
                  {doc.file_size_bytes ? formatSize(doc.file_size_bytes) + ' — ' : ''}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
                <div className="flex-1" />
                <div className="pt-3 mt-2 border-t border-slate-100">
                  <ActionsDropdown label="Actions" openDir="up" items={actions} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showUpload && (
        <FileUploadModal isOpen={showUpload}
          onClose={function() { setShowUpload(false); }}
          onSuccess={function() { setShowUpload(false); mascotSuccessToast('Document uploaded'); fetchDocs(); }}
          organizationId={organizationId} folderId={null} groupId={groupId} />
      )}
      {confirmDelete && (
        <ConfirmModal title={'Delete "' + confirmDelete.title + '"?'}
          message="This document will be permanently deleted and cannot be recovered."
          confirmLabel="Delete Document" confirmClass="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          onConfirm={handleDeleteConfirmed} onCancel={function() { setConfirmDelete(null); }} />
      )}
    </div>
  );
};

// ─── Group Announcement Modal ─────────────────────────────────────────────────

var GroupAnnouncementModal = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var editAnn = props.editAnn;
  var onClose = props.onClose;
  var onSaved = props.onSaved;

  var [form, setForm] = useState({
    title: editAnn ? editAnn.title : '',
    content: editAnn ? (editAnn.content || '') : '',
    is_pinned: editAnn ? !!editAnn.is_pinned : false,
  });
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  function updateForm(key, val) { setForm(function(f) { var n = Object.assign({}, f); n[key] = val; return n; }); }

  var handleSave = async function() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content.trim()) { toast.error('Content is required'); return; }
    setSaving(true);
    try {
      var userRes = await supabase.auth.getUser();
      var payload = { title: form.title.trim(), content: form.content.trim(), is_pinned: form.is_pinned, group_id: groupId, organization_id: organizationId, updated_at: new Date().toISOString() };
      var err;
      if (editAnn) { var upd = await supabase.from('announcements').update(payload).eq('id', editAnn.id); err = upd.error; }
      else { payload.created_by = userRes.data.user.id; var ins = await supabase.from('announcements').insert(payload); err = ins.error; }
      if (err) throw err;
      mascotSuccessToast(editAnn ? 'Announcement updated' : 'Announcement posted');
      if (!editAnn) {
        try {
          await notifyGroupMembers({ groupId, organizationId, type: 'new_announcement', title: form.title.trim(), message: 'A new announcement has been posted to your group.', link: '/organizations/' + organizationId + '/groups/' + groupId, excludeUserId: userRes.data.user.id });
          window.dispatchEvent(new CustomEvent('notificationCreated'));
        } catch (_err) {}
      }
      onSaved();
    } catch (e) { mascotErrorToast('Failed to save announcement', e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="ann-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="ann-modal-title" className="text-xl font-bold text-[#0E1523]">{editAnn ? 'Edit Announcement' : 'New Announcement'}</h2>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Close"><XIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="ann-title" className="block text-sm font-medium text-[#0E1523] mb-1">Title <span className="text-red-500" aria-hidden="true">*</span></label>
            <input id="ann-title" type="text" value={form.title} onChange={function(e) { updateForm('title', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Announcement title" maxLength={200} aria-required="true" />
          </div>
          <div>
            <label htmlFor="ann-content" className="block text-sm font-medium text-[#0E1523] mb-1">Content <span className="text-red-500" aria-hidden="true">*</span></label>
            <textarea id="ann-content" value={form.content} onChange={function(e) { updateForm('content', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4} placeholder="Write your announcement..." aria-required="true" />
          </div>
          <div className="flex items-center gap-3">
            <input id="ann-pinned" type="checkbox" checked={form.is_pinned} onChange={function(e) { updateForm('is_pinned', e.target.checked); }}
              className="w-4 h-4 border-slate-300 rounded text-blue-500 focus:ring-blue-500 cursor-pointer" />
            <label htmlFor="ann-pinned" className="text-sm text-[#475569] cursor-pointer">
              <span className="font-medium text-[#0E1523]">Pin this announcement</span> — shows at the top
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2" aria-busy={saving}>
            {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status"><span className="sr-only">Saving...</span></div>Saving...</>) : (editAnn ? 'Save Changes' : 'Post Announcement')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Announcements Tab — grid cards ──────────────────────────────────────────

var AnnouncementsTab = function(props) {
  var organizationId = props.organizationId;
  var groupId = props.groupId;
  var isAdmin = props.isAdmin;

  var [announcements, setAnnouncements] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showModal, setShowModal] = useState(false);
  var [editAnn, setEditAnn] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(null);

  var fetchAnnouncements = useCallback(async function() {
    setLoading(true);
    try {
      var res = await supabase.from('announcements').select('id, title, content, created_at, is_pinned')
        .eq('organization_id', organizationId).eq('group_id', groupId)
        .order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      setAnnouncements(res.data || []);
    } catch (_err) { mascotErrorToast('Failed to load announcements'); }
    finally { setLoading(false); }
  }, [organizationId, groupId]);

  useEffect(function() { fetchAnnouncements(); }, [fetchAnnouncements]);

  var handleDeleteConfirmed = async function() {
    if (!confirmDelete) return;
    var annId = confirmDelete.id;
    setConfirmDelete(null);
    try {
      var res = await supabase.from('announcements').delete().eq('id', annId);
      if (res.error) throw res.error;
      mascotSuccessToast('Announcement deleted');
      fetchAnnouncements();
    } catch (e) { mascotErrorToast('Failed to delete announcement', e.message); }
  };

  var AnnCardSkeleton = function() {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-7 bg-slate-100 rounded-lg w-20 mt-3" />
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[#64748B]">{loading ? '' : announcements.length + ' ' + (announcements.length === 1 ? 'announcement' : 'announcements')}</p>
        {isAdmin && (
          <button onClick={function() { setEditAnn(null); setShowModal(true); }}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {[1,2,3].map(function(i) { return <AnnCardSkeleton key={i} />; })}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="font-semibold text-[#0E1523] mb-1">No announcements yet</p>
          <p className="text-sm text-[#475569] mb-4">
            {isAdmin ? 'Post the first announcement for this group.' : 'No announcements have been posted to this group yet.'}
          </p>
          {isAdmin && (
            <button onClick={function() { setEditAnn(null); setShowModal(true); }}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Post First Announcement
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Group announcements">
          {announcements.map(function(ann) {
            return (
              <li key={ann.id} className={'rounded-xl border flex flex-col ' + (ann.is_pinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200')}>
                <div className="p-4 flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <p className="font-semibold text-[#0E1523] text-sm flex-1 leading-snug">{ann.title}</p>
                    {ann.is_pinned && <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pinned</span>}
                  </div>
                  {ann.content && <p className="text-sm text-[#475569] leading-relaxed line-clamp-3">{ann.content}</p>}
                </div>
                <div className={'flex items-center justify-between px-4 py-2.5 border-t ' + (ann.is_pinned ? 'border-amber-200' : 'border-slate-100')}>
                  <span className="text-xs text-[#64748B]">
                    {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {isAdmin && (
                    <ActionsDropdown label="Actions" openDir="up"
                      items={[
                        { label: 'Edit', onClick: function() { setEditAnn(ann); setShowModal(true); } },
                        { separator: true },
                        { label: 'Delete', danger: true, onClick: function() { setConfirmDelete({ id: ann.id, title: ann.title }); } },
                      ]}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showModal && (
        <GroupAnnouncementModal groupId={groupId} organizationId={organizationId} editAnn={editAnn}
          onClose={function() { setShowModal(false); setEditAnn(null); }}
          onSaved={function() { setShowModal(false); setEditAnn(null); fetchAnnouncements(); }} />
      )}
      {confirmDelete && (
        <ConfirmModal title={'Delete "' + confirmDelete.title + '"?'}
          message="This announcement will be permanently deleted."
          confirmLabel="Delete" confirmClass="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          onConfirm={handleDeleteConfirmed} onCancel={function() { setConfirmDelete(null); }} />
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

function GroupDetail() {
  var { organizationId, groupId } = useParams();
  var [searchParams] = useSearchParams();
  var navigate = useNavigate();
  var context = useOutletContext();
  var isAdmin = context ? context.isAdmin : false;

  var [group, setGroup] = useState(null);
  var [orgName, setOrgName] = useState('');
  var [loading, setLoading] = useState(true);
  var [showEditModal, setShowEditModal] = useState(false);
  var [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  var [showManageMembers, setShowManageMembers] = useState(false);

  var [activeTab, setActiveTab] = useState('members');
  useEffect(function() {
    if (searchParams.get('tab') === 'pending') setActiveTab('members');
  }, [searchParams]);

  var [memberCount, setMemberCount] = useState(0);
  var [memberRefreshKey, setMemberRefreshKey] = useState(0);
  var [eventCount, setEventCount] = useState(0);
  var [docCount, setDocCount] = useState(0);

  var fetchGroup = useCallback(async function() {
    try {
      var [groupRes, orgRes] = await Promise.all([
        supabase.from('org_groups').select('*').eq('id', groupId).single(),
        supabase.from('organizations').select('name').eq('id', organizationId).single(),
      ]);
      setGroup(groupRes.data);
      setOrgName(orgRes.data ? orgRes.data.name : '');
    } catch (_err) { mascotErrorToast('Failed to load group', 'Please try refreshing.'); }
    finally { setLoading(false); }
  }, [organizationId, groupId]);

  useEffect(function() { fetchGroup(); }, [fetchGroup]);

  var handleDeleteGroupConfirmed = async function() {
    setConfirmDeleteGroup(false);
    try {
      var res = await supabase.from('org_groups').update({ is_active: false }).eq('id', groupId);
      if (res.error) throw res.error;
      mascotSuccessToast('Group deleted');
      navigate('/organizations/' + organizationId + '/groups');
    } catch (e) { mascotErrorToast('Failed to delete group', e.message); }
  };

  var tabs = [
    { id: 'members', label: 'Members' },
    { id: 'events', label: 'Events' },
    { id: 'documents', label: 'Documents' },
    { id: 'announcements', label: 'Announcements' },
  ];

  if (loading) return <PageSkeleton />;

  if (!group) return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <p className="font-semibold text-lg text-[#0E1523] mb-1">Group not found</p>
        <p className="text-sm text-[#475569] mb-5">This group may have been deleted or you may not have access.</p>
        <button onClick={function() { navigate('/organizations/' + organizationId + '/groups'); }}
          className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Back to Groups
        </button>
      </div>
    </main>
  );

  var typeStyle = { background: '#F1F5F9', color: '#475569' };

  var headerActions = [
    { label: 'Email Group', onClick: function() { navigate('/organizations/' + organizationId + '/email-blasts?group=' + groupId); } },
  ];
  if (isAdmin) {
    headerActions.push({ label: 'Edit Group', onClick: function() { setShowEditModal(true); } });
    headerActions.push({ label: 'Manage Members', onClick: function() { setShowManageMembers(true); } });
    headerActions.push({ separator: true });
    headerActions.push({ label: 'Delete Group', danger: true, onClick: function() { setConfirmDeleteGroup(true); } });
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]" aria-label={group.name + ' detail'}>
      <div className="px-6 py-6">

        <div className="mb-4">
          <button onClick={function() { navigate('/organizations/' + organizationId + '/groups'); }}
            className="text-sm text-[#64748B] hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
            aria-label="Back to Groups and Committees">
            ← Groups &amp; Committees
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: group.color || '#3B82F6' }} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0E1523', lineHeight: 1.15 }}>{group.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={typeStyle}>{TYPE_LABELS[group.type] || group.type}</span>
              </div>
              <p className="text-sm text-[#64748B] mt-1">{memberCount + ' ' + (memberCount === 1 ? 'member' : 'members')}</p>
            </div>
          </div>
          <ActionsDropdown label="Actions" openDir="down" items={headerActions} />
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap" role="list" aria-label="Group statistics">
          {[
            { label: 'Members', count: memberCount, tab: 'members' },
            { label: 'Events', count: eventCount, tab: 'events' },
            { label: 'Documents', count: docCount, tab: 'documents' },
          ].map(function(stat) {
            return (
              <button key={stat.tab} role="listitem" onClick={function() { setActiveTab(stat.tab); }}
                className={'px-5 py-3 rounded-xl border text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (activeTab === stat.tab ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300')}
                aria-label={stat.count + ' ' + stat.label + ', switch to ' + stat.label + ' tab'}>
                <p className={'text-xl font-bold leading-none ' + (activeTab === stat.tab ? 'text-blue-600' : 'text-[#0E1523]')}>{stat.count}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{stat.label}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200" role="tablist" aria-label="Group sections">
            <div className="flex overflow-x-auto">
              {tabs.map(function(tab) {
                var isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} role="tab" aria-selected={isActive}
                    aria-controls={'tabpanel-' + tab.id} id={'tab-' + tab.id}
                    onClick={function() { setActiveTab(tab.id); }}
                    className={'px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ' + (isActive ? 'border-blue-500 text-blue-500' : 'border-transparent text-[#64748B] hover:text-[#475569] hover:border-slate-300')}>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div id={'tabpanel-' + activeTab} role="tabpanel" aria-labelledby={'tab-' + activeTab} className="p-6">
            {activeTab === 'members' && <MembersTab key={memberRefreshKey} groupId={groupId} organizationId={organizationId} isAdmin={isAdmin} onCountChange={setMemberCount} />}
            {activeTab === 'events' && <EventsTab groupId={groupId} organizationId={organizationId} orgName={orgName} isAdmin={isAdmin} onCountChange={setEventCount} />}
            {activeTab === 'documents' && <DocumentsTab groupId={groupId} organizationId={organizationId} isAdmin={isAdmin} onCountChange={setDocCount} />}
            {activeTab === 'announcements' && <AnnouncementsTab organizationId={organizationId} groupId={groupId} isAdmin={isAdmin} />}
          </div>
        </div>

      </div>

      {showEditModal && (
        <EditGroupModal group={group}
          onClose={function() { setShowEditModal(false); }}
          onSaved={function() { setShowEditModal(false); fetchGroup(); }} />
      )}

      {showManageMembers && (
        <ManageMembersModal
          groupId={groupId}
          organizationId={organizationId}
          onClose={function(didChange) {
            setShowManageMembers(false);
            if (didChange) {
              setMemberRefreshKey(function(k) { return k + 1; });
            }
          }} />
      )}

      {confirmDeleteGroup && (
        <ConfirmModal title={'Delete "' + group.name + '"?'}
          message="This group will be deactivated and removed from all member views. This cannot be undone."
          confirmLabel="Delete Group" confirmClass="bg-red-500 hover:bg-red-600 focus:ring-red-500"
          onConfirm={handleDeleteGroupConfirmed} onCancel={function() { setConfirmDeleteGroup(false); }} />
      )}
    </main>
  );
}

export default GroupDetail;