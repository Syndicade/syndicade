/**
 * GroupsList.jsx
 * Task 13 changes:
 *   - Page header: 30px / weight 800 / #0E1523, count-based subtitle
 *   - window.confirm → ConfirmModal
 *   - Auto-create chat channel in CreateGroupModal after group insert
 *   - var only, string concat className, no template literals
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// ─── Icons ────────────────────────────────────────────────────────────────────

var UsersIcon = function(props) {
  var size = props.size || 20;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
};

var PlusIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
};

var EditIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
};

var TrashIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
};

var SearchIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
};

var XIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
};

var GripIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="7" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="7" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9" cy="17" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="17" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
};

var CheckIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
};

var LockIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
};

var AlertTriangleIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────

var TYPE_LABELS = {
  committee: 'Committee',
  board: 'Board',
  team: 'Team',
  volunteer: 'Volunteer',
  other: 'Other',
};

var TYPE_STYLES = {
  committee: { background: '#DBEAFE', color: '#1e3a8a' },
  board:     { background: '#EDE9FE', color: '#3b0764' },
  team:      { background: '#DCFCE7', color: '#064e3b' },
  volunteer: { background: '#FFEDD5', color: '#7c2d12' },
  other:     { background: '#F1F5F9', color: '#475569' },
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

// ─── Card Skeleton ────────────────────────────────────────────────────────────

var CardSkeleton = function() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 flex overflow-hidden animate-pulse" style={{ minHeight: '160px' }}>
      <div className="w-1.5 bg-slate-200 flex-shrink-0" />
      <div className="flex-1 flex flex-col p-4 gap-2">
        <div className="h-5 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded-full w-1/3" />
        <div className="h-3.5 bg-slate-100 rounded w-full" />
        <div className="h-3.5 bg-slate-100 rounded w-4/5" />
        <div className="flex-1" />
        <div className="h-px bg-slate-100 w-full" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3.5 bg-slate-100 rounded w-20" />
          <div className="flex gap-1">
            <div className="w-7 h-7 bg-slate-100 rounded-lg" />
            <div className="w-7 h-7 bg-slate-100 rounded-lg" />
            <div className="w-7 h-7 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

var ConfirmModal = function(props) {
  var title = props.title;
  var message = props.message;
  var confirmLabel = props.confirmLabel || 'Delete';
  var onConfirm = props.onConfirm;
  var onCancel = props.onCancel;

  // Close on Escape
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
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangleIcon />
          </div>
          <div>
            <h2 id="confirm-modal-title" className="text-base font-bold text-[#0E1523] mb-1">{title}</h2>
            <p className="text-sm text-[#475569]">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            autoFocus
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Members Modal ────────────────────────────────────────────────────────────

var MembersModal = function(props) {
  var group = props.group;
  var onClose = props.onClose;
  var [members, setMembers] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    async function load() {
      try {
        var gmRes = await supabase
          .from('org_group_members')
          .select('member_id')
          .eq('group_id', group.id);
        var ids = (gmRes.data || []).map(function(r) { return r.member_id; });
        if (ids.length === 0) { setMembers([]); setLoading(false); return; }
        var namesRes = await supabase
          .from('members')
          .select('user_id, first_name, last_name')
          .in('user_id', ids);
        var normalized = (namesRes.data || []).map(function(m) {
          return {
            member_id: m.user_id,
            full_name: ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || m.user_id,
          };
        });
        setMembers(normalized);
      } catch (_err) {
        // show empty state silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [group.id]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="members-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 id="members-modal-title" className="text-lg font-bold text-[#0E1523]">
              {group.name}
            </h2>
            <p className="text-sm text-[#64748B] mt-0.5">Group Members</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close members list"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading members">
              {[1, 2, 3].map(function(i) {
                return (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="h-4 w-36 bg-slate-200 rounded" />
                  </div>
                );
              })}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex justify-center text-slate-300 mb-3">
                <UsersIcon size={40} />
              </div>
              <p className="text-sm font-semibold text-[#0E1523]">No members yet</p>
              <p className="text-xs text-[#64748B] mt-1">Members assigned to this group will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-2" role="list" aria-label="Group member list">
              {members.map(function(m) {
                var name = m.full_name || 'Unknown';
                var bg = getAvatarColor(name);
                return (
                  <li key={m.member_id} className="flex items-center gap-3 py-1">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: bg }}
                      aria-hidden="true"
                    >
                      {getInitials(name)}
                    </div>
                    <span className="text-sm font-medium text-[#0E1523]">{name}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

var CreateGroupModal = function(props) {
  var organizationId = props.organizationId;
  var onClose = props.onClose;
  var onSaved = props.onSaved;
  var editGroup = props.editGroup;

  var [form, setForm] = useState({
    name: editGroup ? editGroup.name : '',
    description: editGroup ? (editGroup.description || '') : '',
    type: editGroup ? editGroup.type : 'committee',
    visibility: editGroup ? editGroup.visibility : 'members',
    join_approval_required: editGroup ? (editGroup.join_approval_required !== false) : true,
    color: editGroup ? (editGroup.color || '#3B82F6') : '#3B82F6',
  });
  var [saving, setSaving] = useState(false);

  function updateForm(key, value) {
    setForm(function(f) {
      var next = Object.assign({}, f);
      next[key] = value;
      return next;
    });
  }

  var handleSubmit = async function() {
    if (!form.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    setSaving(true);
    try {
      var userRes = await supabase.auth.getUser();
      var userId = userRes.data.user.id;

      var payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        visibility: form.visibility,
        join_approval_required: form.join_approval_required,
        color: form.color,
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
      };

      var err;
      var newGroupId = null;

      if (editGroup) {
        var upd = await supabase.from('org_groups').update(payload).eq('id', editGroup.id);
        err = upd.error;
      } else {
        payload.created_by = userId;
        var ins = await supabase.from('org_groups').insert(payload).select('id').single();
        err = ins.error;
        if (!err && ins.data) {
          newGroupId = ins.data.id;
        }
      }
      if (err) throw err;

      // Auto-create a chat channel when a new group is created
      if (newGroupId) {
        var channelRes = await supabase.from('org_chat_channels').insert({
          name: form.name.trim(),
          organization_id: organizationId,
          group_id: newGroupId,
          created_by: userId,
          is_private: form.visibility === 'group_only',
        });
        // Non-fatal: log but don't block the success toast
        if (channelRes.error) {
          console.warn('Could not auto-create chat channel:', channelRes.error.message);
        }
      }

      mascotSuccessToast(editGroup ? 'Group updated' : 'Group created');
      onSaved();
    } catch (e) {
      mascotErrorToast('Failed to save group', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="create-group-title" className="text-xl font-bold text-[#0E1523]">
            {editGroup ? 'Edit Group' : 'Create Group'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="g-name" className="block text-sm font-medium text-[#0E1523] mb-1">
              Group Name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="g-name"
              type="text"
              value={form.name}
              onChange={function(e) { updateForm('name', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Finance Committee"
              maxLength={100}
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="g-desc" className="block text-sm font-medium text-[#0E1523] mb-1">
              Description
            </label>
            <textarea
              id="g-desc"
              value={form.description}
              onChange={function(e) { updateForm('description', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="What does this group do?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="g-type" className="block text-sm font-medium text-[#0E1523] mb-1">Type</label>
              <select
                id="g-type"
                value={form.type}
                onChange={function(e) { updateForm('type', e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="committee">Committee</option>
                <option value="board">Board</option>
                <option value="team">Team</option>
                <option value="volunteer">Volunteer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="g-vis" className="block text-sm font-medium text-[#0E1523] mb-1">Visibility</label>
              <select
                id="g-vis"
                value={form.visibility}
                onChange={function(e) { updateForm('visibility', e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="members">All Members</option>
                <option value="group_only">Group Members Only</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="g-color" className="block text-sm font-medium text-[#0E1523] mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                id="g-color"
                type="color"
                value={form.color}
                onChange={function(e) { updateForm('color', e.target.value); }}
                className="w-10 h-10 border border-slate-300 rounded cursor-pointer p-0.5"
                aria-label="Choose group color"
              />
              <span className="text-sm text-[#64748B]">Used to identify the group in lists</span>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              id="g-approval"
              type="checkbox"
              checked={form.join_approval_required}
              onChange={function(e) { updateForm('join_approval_required', e.target.checked); }}
              className="mt-0.5 w-4 h-4 border-slate-300 rounded text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="g-approval" className="text-sm text-[#475569] cursor-pointer">
              <span className="font-medium text-[#0E1523]">Require admin approval</span> when members request to join
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-busy={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status">
                  <span className="sr-only">Saving...</span>
                </div>
                Saving...
              </>
            ) : (editGroup ? 'Save Changes' : 'Create Group')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

function GroupsList() {
  var { organizationId } = useParams();
  var context = useOutletContext();
  var isAdmin = context ? context.isAdmin : false;

  var [groups, setGroups] = useState([]);
  var [loading, setLoading] = useState(true);
  var [currentUserId, setCurrentUserId] = useState(null);
  var [memberCounts, setMemberCounts] = useState({});
  var [userGroupIds, setUserGroupIds] = useState(new Set());
  var [pendingGroupIds, setPendingGroupIds] = useState(new Set());

  var [showModal, setShowModal] = useState(false);
  var [editGroup, setEditGroup] = useState(null);
  var [membersModal, setMembersModal] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

  var [search, setSearch] = useState('');
  var [typeFilter, setTypeFilter] = useState('all');
  var [myGroupsOnly, setMyGroupsOnly] = useState(false);

  var [savingOrder, setSavingOrder] = useState(false);
  var dragSrcIndexRef = useRef(null);
  var [dragOverIndex, setDragOverIndex] = useState(null);

  var filtersActive = search !== '' || typeFilter !== 'all' || myGroupsOnly;
  var canDrag = isAdmin && !filtersActive && !loading && groups.length > 1;

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  var fetchData = useCallback(async function() {
    setLoading(true);
    try {
      var userRes = await supabase.auth.getUser();
      var userId = userRes.data.user.id;
      setCurrentUserId(userId);

      var groupsRes = await supabase
        .from('org_groups')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      var groupsData = groupsRes.data || [];
      setGroups(groupsData);

      if (groupsData.length) {
        var counts = {};
        var userSet = new Set();
        var pendingSet = new Set();

        await Promise.all(
          groupsData.map(async function(g) {
            var cntRes = await supabase
              .from('org_group_members')
              .select('member_id', { count: 'exact', head: true })
              .eq('group_id', g.id);
            counts[g.id] = cntRes.count || 0;

            var myRow = await supabase
              .from('org_group_members')
              .select('member_id, status')
              .eq('group_id', g.id)
              .eq('member_id', userId)
              .maybeSingle();
            if (myRow.data) {
              if (myRow.data.status === 'pending') {
                pendingSet.add(g.id);
              } else {
                userSet.add(g.id);
              }
            }
          })
        );

        setMemberCounts(counts);
        setUserGroupIds(userSet);
        setPendingGroupIds(pendingSet);
      }
    } catch (_err) {
      mascotErrorToast('Failed to load groups', 'Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(function() { fetchData(); }, [fetchData]);

  // ─── Drag to Reorder ───────────────────────────────────────────────────────

  var handleDragStart = function(index) {
    dragSrcIndexRef.current = index;
  };

  var handleDragOver = function(e, index) {
    e.preventDefault();
    setDragOverIndex(index);
  };

  var handleDragLeave = function() {
    setDragOverIndex(null);
  };

  var handleDrop = async function(dropIndex) {
    setDragOverIndex(null);
    var srcIndex = dragSrcIndexRef.current;
    dragSrcIndexRef.current = null;
    if (srcIndex === null || srcIndex === dropIndex) return;

    var reordered = groups.slice();
    var moved = reordered.splice(srcIndex, 1)[0];
    reordered.splice(dropIndex, 0, moved);
    setGroups(reordered);

    setSavingOrder(true);
    try {
      await Promise.all(
        reordered.map(function(g, i) {
          return supabase.from('org_groups').update({ sort_order: i }).eq('id', g.id);
        })
      );
      mascotSuccessToast('Order saved');
    } catch (_err) {
      mascotErrorToast('Failed to save order', 'Please try again.');
      fetchData();
    } finally {
      setSavingOrder(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  var handleDeleteConfirmed = async function() {
    if (!confirmDelete) return;
    var groupId = confirmDelete.id;
    setConfirmDelete(null);
    try {
      var res = await supabase.from('org_groups').update({ is_active: false }).eq('id', groupId);
      if (res.error) throw res.error;
      mascotSuccessToast('Group deleted');
      fetchData();
    } catch (e) {
      mascotErrorToast('Failed to delete group', e.message);
    }
  };

  // ─── Request to Join ───────────────────────────────────────────────────────

  var handleRequestJoin = async function(group) {
    try {
      var payload = {
        group_id: group.id,
        member_id: currentUserId,
        organization_id: organizationId,
        status: group.join_approval_required ? 'pending' : 'active',
      };
      var res = await supabase.from('org_group_members').insert(payload);
      if (res.error) throw res.error;
      if (group.join_approval_required) {
        mascotSuccessToast('Request sent', 'An admin will review your request.');
        setPendingGroupIds(function(prev) {
          var next = new Set(prev);
          next.add(group.id);
          return next;
        });
      } else {
        mascotSuccessToast('Joined ' + group.name);
        setUserGroupIds(function(prev) {
          var next = new Set(prev);
          next.add(group.id);
          return next;
        });
        setMemberCounts(function(prev) {
          var next = Object.assign({}, prev);
          next[group.id] = (prev[group.id] || 0) + 1;
          return next;
        });
      }
    } catch (e) {
      mascotErrorToast('Could not join group', e.message);
    }
  };

  // ─── Filter ────────────────────────────────────────────────────────────────

  var filteredGroups = groups.filter(function(g) {
    if (search && g.name.toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
    if (typeFilter !== 'all' && g.type !== typeFilter) return false;
    if (myGroupsOnly && !userGroupIds.has(g.id)) return false;
    return true;
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#F8FAFC]" aria-label="Groups and Committees">
      <div className="px-6 py-6">

        {/* ── Page Header (standard: 30px/800, count-based subtitle) ── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0E1523', lineHeight: 1.15 }}>
              Groups &amp; Committees
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              {loading
                ? 'Loading...'
                : groups.length + ' ' + (groups.length === 1 ? 'group' : 'groups')}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={function() { setEditGroup(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex-shrink-0"
            >
              <PlusIcon />
              New Group
            </button>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#94A3B8]">
              <SearchIcon />
            </div>
            <input
              type="search"
              value={search}
              onChange={function(e) { setSearch(e.target.value); }}
              placeholder="Search groups..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-[#0E1523] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search groups by name"
            />
            {search && (
              <button
                onClick={function() { setSearch(''); }}
                className="absolute inset-y-0 right-3 flex items-center text-[#94A3B8] hover:text-[#475569] focus:outline-none"
                aria-label="Clear search"
              >
                <XIcon />
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={function(e) { setTypeFilter(e.target.value); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by group type"
          >
            <option value="all">All Types</option>
            <option value="committee">Committee</option>
            <option value="board">Board</option>
            <option value="team">Team</option>
            <option value="volunteer">Volunteer</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={function() { setMyGroupsOnly(function(v) { return !v; }); }}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ' + (myGroupsOnly ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-[#475569] border-slate-200 hover:bg-slate-50')}
            aria-pressed={myGroupsOnly}
          >
            <UsersIcon size={14} />
            My Groups
          </button>
        </div>

        {/* Drag hint */}
        {canDrag && (
          <p className="text-xs text-[#94A3B8] mb-3 flex items-center gap-1.5" aria-live="polite">
            <GripIcon />
            {savingOrder ? 'Saving order...' : 'Drag cards to reorder. Disabled while filters are active.'}
          </p>
        )}
        {isAdmin && filtersActive && !loading && groups.length > 1 && (
          <p className="text-xs text-[#94A3B8] mb-3 flex items-center gap-1.5">
            <GripIcon />
            Clear filters to enable drag-to-reorder.
          </p>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading groups">
            {[1, 2, 3, 4].map(function(i) { return <CardSkeleton key={i} />; })}
          </div>

        ) : filteredGroups.length === 0 && groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="flex justify-center text-slate-300 mb-4">
              <UsersIcon size={52} />
            </div>
            <h2 className="text-lg font-semibold text-[#0E1523] mb-2">No groups yet</h2>
            <p className="text-sm text-[#475569] max-w-xs mx-auto mb-6">
              {isAdmin
                ? 'Create committees, boards, and teams to organize your members.'
                : 'No groups have been set up for this organization yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={function() { setEditGroup(null); setShowModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon />
                Create First Group
              </button>
            )}
          </div>

        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="flex justify-center text-slate-300 mb-4">
              <SearchIcon />
            </div>
            <h2 className="text-lg font-semibold text-[#0E1523] mb-2">No results found</h2>
            <p className="text-sm text-[#475569] mb-6">
              {myGroupsOnly
                ? "You're not in any groups that match those filters."
                : 'No groups match your current filters.'}
            </p>
            <button
              onClick={function() { setSearch(''); setTypeFilter('all'); setMyGroupsOnly(false); }}
              className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Clear Filters
            </button>
          </div>

        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="list"
            aria-label="Groups list"
          >
            {filteredGroups.map(function(group, index) {
              var isMember = userGroupIds.has(group.id);
              var isPending = pendingGroupIds.has(group.id);
              var canJoin = !isAdmin && !isMember && !isPending && group.visibility !== 'group_only';
              var typeStyle = TYPE_STYLES[group.type] || TYPE_STYLES.other;
              var isDragTarget = dragOverIndex === index;
              var count = memberCounts[group.id] || 0;

              return (
                <div
                  key={group.id}
                  role="listitem"
                  draggable={canDrag}
                  onDragStart={canDrag ? function() { handleDragStart(index); } : undefined}
                  onDragOver={canDrag ? function(e) { handleDragOver(e, index); } : undefined}
                  onDragLeave={canDrag ? handleDragLeave : undefined}
                  onDrop={canDrag ? function() { handleDrop(index); } : undefined}
                  className={'bg-white rounded-xl border flex overflow-hidden transition-all ' + (isDragTarget ? 'border-blue-400 shadow-lg' : 'border-slate-200 hover:shadow-md hover:border-slate-300')}
                  style={Object.assign({ minHeight: '160px' }, isDragTarget ? { opacity: 0.85 } : {})}
                >
                  <div
                    className="w-1.5 flex-shrink-0"
                    style={{ backgroundColor: group.color || '#3B82F6' }}
                    aria-hidden="true"
                  />

                  {/* Entire card body is a link */}
                  <Link
                    to={'/organizations/' + organizationId + '/groups/' + group.id}
                    className="flex-1 flex flex-col p-4 min-w-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    aria-label={'Open ' + group.name}
                  >
                    {canDrag && (
                      <div className="flex justify-end mb-1">
                        <div className="text-[#CBD5E1] hover:text-[#94A3B8] cursor-grab active:cursor-grabbing" aria-hidden="true" title="Drag to reorder">
                          <GripIcon />
                        </div>
                      </div>
                    )}

                    <p className="font-bold text-[#0E1523] text-base leading-snug mb-1.5">{group.name}</p>

                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={typeStyle}>
                        {TYPE_LABELS[group.type] || group.type}
                      </span>
                      {group.visibility === 'group_only' && (
                        <span className="flex items-center gap-1 text-xs text-[#64748B]">
                          <LockIcon />
                          Private
                        </span>
                      )}
                      {isMember && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <CheckIcon />
                          Member
                        </span>
                      )}
                      {isPending && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>

                    {group.description && (
                      <p className="text-sm text-[#475569] line-clamp-2 mb-2">{group.description}</p>
                    )}

                    <div className="flex-1" />

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                      <button
                        onClick={function(e) { e.preventDefault(); e.stopPropagation(); setMembersModal(group); }}
                        className="flex items-center gap-1 text-xs text-[#64748B] hover:text-blue-500 focus:outline-none focus:underline transition-colors"
                        aria-label={'View ' + count + ' ' + (count === 1 ? 'member' : 'members') + ' in ' + group.name}
                      >
                        <UsersIcon size={12} />
                        <span>{count} {count === 1 ? 'member' : 'members'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {canJoin && (
                          <button
                            onClick={function(e) { e.preventDefault(); e.stopPropagation(); handleRequestJoin(group); }}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                            aria-label={(group.join_approval_required ? 'Request to join ' : 'Join ') + group.name}
                          >
                            {group.join_approval_required ? 'Request' : 'Join'}
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button
                              onClick={function(e) { e.preventDefault(); e.stopPropagation(); setEditGroup(group); setShowModal(true); }}
                              className="p-1.5 text-[#94A3B8] hover:text-blue-500 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                              aria-label={'Edit ' + group.name}
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={function(e) { e.preventDefault(); e.stopPropagation(); setConfirmDelete({ id: group.id, name: group.name }); }}
                              className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                              aria-label={'Delete ' + group.name}
                            >
                              <TrashIcon />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {showModal && (
        <CreateGroupModal
          organizationId={organizationId}
          editGroup={editGroup}
          onClose={function() { setShowModal(false); setEditGroup(null); }}
          onSaved={function() { setShowModal(false); setEditGroup(null); fetchData(); }}
        />
      )}

      {membersModal && (
        <MembersModal
          group={membersModal}
          organizationId={organizationId}
          onClose={function() { setMembersModal(null); }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={'Delete "' + confirmDelete.name + '"?'}
          message="This group will be deactivated and removed from all member views. This cannot be undone."
          confirmLabel="Delete Group"
          onConfirm={handleDeleteConfirmed}
          onCancel={function() { setConfirmDelete(null); }}
        />
      )}
    </main>
  );
}

export default GroupsList;