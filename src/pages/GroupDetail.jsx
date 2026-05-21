/**
 * GroupDetail.jsx
 * K1 light-theme audit + feature additions:
 *   - Pending join requests (admin approve/deny) in Members tab
 *   - Header stats strip (members, events, docs — clickable to switch tab)
 *   - Inline Edit Group button in header
 *   - Member search within Members tab
 *   - Link existing org events to group (+ unlink)
 *   - Announcements tab
 *   - "Email this group" button in header
 *
 * DB MIGRATIONS NEEDED (run once in Supabase SQL editor):
 *
 * -- Role column on org_group_members:
 * ALTER TABLE public.org_group_members
 *   ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
 * -- values: 'member' | 'chair' | 'co_chair'
 *
 * -- event_groups junction table (if it doesn't exist):
 * CREATE TABLE IF NOT EXISTS public.event_groups (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
 *   group_id uuid REFERENCES public.org_groups(id) ON DELETE CASCADE NOT NULL,
 *   created_at timestamptz DEFAULT now(),
 *   UNIQUE(event_id, group_id)
 * );
 * ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Org members can view event_groups" ON public.event_groups FOR SELECT
 *   USING (EXISTS (SELECT 1 FROM public.memberships WHERE organization_id =
 *     (SELECT organization_id FROM public.org_groups WHERE id = event_groups.group_id)
 *     AND member_id = auth.uid() AND status = 'active'));
 * CREATE POLICY "Admins can manage event_groups" ON public.event_groups FOR ALL
 *   USING (EXISTS (SELECT 1 FROM public.memberships m
 *     JOIN public.org_groups g ON g.organization_id = m.organization_id
 *     WHERE g.id = event_groups.group_id AND m.member_id = auth.uid()
 *     AND m.role IN ('admin','editor') AND m.status = 'active'));
 *
 * -- NOTE: EmailBlasts.jsx — to support ?group= deep-link, read
 * --   new URLSearchParams(window.location.search).get('group') on mount
 * --   and pre-select that group in the RecipientBuilder.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import CreateEvent from '../components/CreateEvent';
import FileUploadModal from '../components/FileUploadModal';

// ─── Icons ────────────────────────────────────────────────────────────────────

var PlusIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
};

var TrashIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
};

var ChevronRightIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
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

var MailIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
};

var SearchIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
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

var CheckIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
};

var DownloadIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
};

var LinkIcon = function() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
};

var UsersIcon = function(props) {
  var size = props.size || 16;
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

var CalendarIcon = function(props) {
  var size = props.size || 16;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
};

var FolderIcon = function(props) {
  var size = props.size || 16;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
};

var MegaphoneIcon = function(props) {
  var size = props.size || 16;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  );
};

var AlertCircleIcon = function(props) {
  var size = props.size || 40;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────

var TYPE_LABELS = {
  committee: 'Committee', board: 'Board', team: 'Team', volunteer: 'Volunteer', other: 'Other',
};

var ROLE_LABELS = { chair: 'Chair', co_chair: 'Co-Chair', member: 'Member' };

var ROLE_STYLES = {
  chair:    { background: '#EDE9FE', color: '#3b0764' },
  co_chair: { background: '#DBEAFE', color: '#1e3a8a' },
  member:   { background: '#F1F5F9', color: '#475569' },
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

var RowSkeleton = function(props) {
  var count = props.count || 3;
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: count }).map(function(_, i) {
        return (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-36" />
              <div className="h-3 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-7 w-20 bg-slate-100 rounded-lg" />
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
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-2">
            <div className="h-8 w-52 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-100 rounded-lg" />
            <div className="h-9 w-28 bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-3 mb-5">
          {[1,2,3,4].map(function(i) {
            return <div key={i} className="h-14 w-32 bg-slate-100 rounded-xl" />;
          })}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 flex">
            {[1,2,3,4].map(function(i) {
              return <div key={i} className="px-5 py-3.5 h-12 w-28 bg-slate-100 m-1 rounded" />;
            })}
          </div>
          <div className="p-6">
            <RowSkeleton count={4} />
          </div>
        </div>
      </div>
    </main>
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

  var handleSave = async function() {
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    setSaving(true);
    try {
      var res = await supabase.from('org_groups').update({
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        visibility: form.visibility,
        join_approval_required: form.join_approval_required,
        color: form.color,
        updated_at: new Date().toISOString(),
      }).eq('id', group.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Group updated');
      onSaved();
    } catch (e) {
      mascotErrorToast('Failed to update group', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="edit-group-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="edit-group-title" className="text-xl font-bold text-[#0E1523]">Edit Group</h2>
          <button onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close">
            <XIcon />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="eg-name" className="block text-sm font-medium text-[#0E1523] mb-1">
              Group Name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input id="eg-name" type="text" value={form.name}
              onChange={function(e) { updateForm('name', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100} aria-required="true" />
          </div>
          <div>
            <label htmlFor="eg-desc" className="block text-sm font-medium text-[#0E1523] mb-1">Description</label>
            <textarea id="eg-desc" value={form.description}
              onChange={function(e) { updateForm('description', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3} placeholder="What does this group do?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="eg-type" className="block text-sm font-medium text-[#0E1523] mb-1">Type</label>
              <select id="eg-type" value={form.type}
                onChange={function(e) { updateForm('type', e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="committee">Committee</option>
                <option value="board">Board</option>
                <option value="team">Team</option>
                <option value="volunteer">Volunteer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="eg-vis" className="block text-sm font-medium text-[#0E1523] mb-1">Visibility</label>
              <select id="eg-vis" value={form.visibility}
                onChange={function(e) { updateForm('visibility', e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="public">Public</option>
                <option value="members">All Members</option>
                <option value="group_only">Group Members Only</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="eg-color" className="block text-sm font-medium text-[#0E1523] mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input id="eg-color" type="color" value={form.color}
                onChange={function(e) { updateForm('color', e.target.value); }}
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
          <button onClick={onClose}
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-busy={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status">
                  <span className="sr-only">Saving...</span>
                </div>
                Saving...
              </>
            ) : 'Save Changes'}
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
    async function load() {
      var res = await supabase
        .from('memberships')
        .select('member_id, members:member_id(user_id, full_name)')
        .eq('organization_id', organizationId)
        .eq('status', 'active');
      var available = (res.data || []).filter(function(m) {
        return existingMemberIds.indexOf(m.member_id) === -1;
      });
      setOrgMembers(available);
      setLoading(false);
    }
    load();
  }, [groupId, organizationId, existingMemberIds]);

  var handleAdd = async function() {
    if (!selected) { toast.error('Select a member'); return; }
    setSaving(true);
    try {
      var userRes = await supabase.auth.getUser();
      var res = await supabase.from('org_group_members').insert({
        group_id: groupId,
        member_id: selected,
        organization_id: organizationId,
        role: role,
        status: 'active',
        assigned_by: userRes.data.user.id,
      });
      if (res.error) throw res.error;
      mascotSuccessToast('Member added');
      onSaved();
    } catch (e) {
      mascotErrorToast('Failed to add member', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="add-member-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="add-member-title" className="text-xl font-bold text-[#0E1523]">Add Member</h2>
          <button onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close">
            <XIcon />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-200 rounded w-16" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          ) : orgMembers.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex justify-center text-slate-300 mb-3"><UsersIcon size={36} /></div>
              <p className="text-sm font-semibold text-[#0E1523]">Everyone's already in</p>
              <p className="text-sm text-[#475569] mt-1">All active members are already in this group.</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="am-member" className="block text-sm font-medium text-[#0E1523] mb-1">
                  Member <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select id="am-member" value={selected}
                  onChange={function(e) { setSelected(e.target.value); }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required="true">
                  <option value="">— Select a member —</option>
                  {orgMembers.map(function(m) {
                    return (
                      <option key={m.member_id} value={m.member_id}>
                        {m.members ? m.members.full_name : m.member_id}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="am-role" className="block text-sm font-medium text-[#0E1523] mb-1">Role</label>
                <select id="am-role" value={role}
                  onChange={function(e) { setRole(e.target.value); }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="member">Member</option>
                  <option value="chair">Chair</option>
                  <option value="co_chair">Co-Chair</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose}
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Cancel
          </button>
          {orgMembers.length > 0 && (
            <button onClick={handleAdd} disabled={saving || !selected}
              className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-busy={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status">
                    <span className="sr-only">Adding...</span>
                  </div>
                  Adding...
                </>
              ) : 'Add Member'}
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
    async function load() {
      var res = await supabase
        .from('events')
        .select('id, title, start_time')
        .eq('organization_id', organizationId)
        .order('start_time', { ascending: false })
        .limit(50);
      var available = (res.data || []).filter(function(e) {
        return linkedEventIds.indexOf(e.id) === -1;
      });
      setEvents(available);
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
    } catch (e) {
      mascotErrorToast('Failed to link event', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="link-event-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="link-event-title" className="text-xl font-bold text-[#0E1523]">Link Existing Event</h2>
          <button onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close">
            <XIcon />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
          ) : events.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex justify-center text-slate-300 mb-3"><CalendarIcon size={36} /></div>
              <p className="text-sm font-semibold text-[#0E1523]">No events available</p>
              <p className="text-sm text-[#475569] mt-1">All org events are already linked to this group.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="le-event" className="block text-sm font-medium text-[#0E1523] mb-1">
                Select Event <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select id="le-event" value={selected}
                onChange={function(e) { setSelected(e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true">
                <option value="">— Select an event —</option>
                {events.map(function(ev) {
                  return (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {new Date(ev.start_time).toLocaleDateString()}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose}
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Cancel
          </button>
          {events.length > 0 && (
            <button onClick={handleLink} disabled={saving || !selected}
              className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-busy={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status">
                    <span className="sr-only">Linking...</span>
                  </div>
                  Linking...
                </>
              ) : 'Link Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Members Tab ──────────────────────────────────────────────────────────────

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

  var fetchMembers = useCallback(async function() {
    setLoading(true);
    try {
      var [activeRes, pendingRes] = await Promise.all([
        supabase
          .from('org_group_members')
          .select('id, member_id, role, status, created_at, members:member_id(user_id, full_name)')
          .eq('group_id', groupId)
          .eq('status', 'active')
          .order('role')
          .order('created_at'),
        supabase
          .from('org_group_members')
          .select('id, member_id, created_at, members:member_id(user_id, full_name)')
          .eq('group_id', groupId)
          .eq('status', 'pending'),
      ]);
      var activeData = activeRes.data || [];
      var pendingData = pendingRes.data || [];
      setMembers(activeData);
      setPending(pendingData);
      if (onCountChange) onCountChange(activeData.length);
    } catch (_err) {
      mascotErrorToast('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [groupId, onCountChange]);

  useEffect(function() { fetchMembers(); }, [fetchMembers]);

  var handleRemove = async function(gm) {
    var name = gm.members ? gm.members.full_name : 'this member';
    if (!window.confirm('Remove ' + name + ' from this group?')) return;
    try {
      var res = await supabase.from('org_group_members').delete().eq('id', gm.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Member removed');
      fetchMembers();
    } catch (e) {
      mascotErrorToast('Failed to remove member', e.message);
    }
  };

  var handleRoleChange = async function(gm, newRole) {
    try {
      var res = await supabase.from('org_group_members').update({ role: newRole }).eq('id', gm.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Role updated');
      fetchMembers();
    } catch (e) {
      mascotErrorToast('Failed to update role', e.message);
    }
  };

  var handleApprove = async function(row) {
    try {
      var res = await supabase.from('org_group_members').update({ status: 'active' }).eq('id', row.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Request approved');
      fetchMembers();
    } catch (e) {
      mascotErrorToast('Failed to approve request', e.message);
    }
  };

  var handleDeny = async function(row) {
    try {
      var res = await supabase.from('org_group_members').delete().eq('id', row.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Request denied');
      fetchMembers();
    } catch (e) {
      mascotErrorToast('Failed to deny request', e.message);
    }
  };

  var filtered = search
    ? members.filter(function(gm) {
        var name = (gm.members && gm.members.full_name) || '';
        return name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
      })
    : members;

  var existingIds = members.map(function(m) { return m.member_id; });

  return (
    <div>
      {/* Pending requests (admin only) */}
      {isAdmin && pending.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">
            {pending.length} pending join {pending.length === 1 ? 'request' : 'requests'}
          </p>
          <ul className="space-y-2" role="list" aria-label="Pending join requests">
            {pending.map(function(row) {
              var name = (row.members && row.members.full_name) || 'Unknown';
              var bg = getAvatarColor(name);
              return (
                <li key={row.id} className="flex items-center gap-3 bg-white rounded-lg border border-amber-100 p-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: bg }} aria-hidden="true">
                    {getInitials(name)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-[#0E1523]">{name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={function() { handleApprove(row); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                      aria-label={'Approve ' + name}>
                      <CheckIcon />
                      Approve
                    </button>
                    <button onClick={function() { handleDeny(row); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-transparent border border-slate-300 text-[#475569] rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      aria-label={'Deny ' + name}>
                      Deny
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#94A3B8]">
            <SearchIcon />
          </div>
          <input type="search" value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            placeholder="Search members..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search members" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-sm text-[#64748B]">
            {loading ? '' : filtered.length + ' ' + (filtered.length === 1 ? 'member' : 'members')}
          </p>
          {isAdmin && (
            <button onClick={function() { setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add member to group">
              <PlusIcon />
              Add Member
            </button>
          )}
        </div>
      </div>

      {loading ? <RowSkeleton count={3} /> : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="flex justify-center text-slate-300 mb-3"><UsersIcon size={40} /></div>
          <p className="font-semibold text-[#0E1523] mb-1">
            {members.length === 0 ? 'No members yet' : 'No results'}
          </p>
          <p className="text-sm text-[#475569] mb-4">
            {members.length === 0
              ? 'Add organization members to get this group started.'
              : 'No members match your search.'}
          </p>
          {isAdmin && members.length === 0 && (
            <button onClick={function() { setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon />
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Group members">
          {filtered.map(function(gm) {
            var name = (gm.members && gm.members.full_name) || 'Unknown';
            var bg = getAvatarColor(name);
            var roleStyle = ROLE_STYLES[gm.role] || ROLE_STYLES.member;
            return (
              <li key={gm.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: bg }} aria-hidden="true">
                  {getInitials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0E1523] text-sm">{name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdmin ? (
                    <select value={gm.role}
                      onChange={function(e) { handleRoleChange(gm, e.target.value); }}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={'Role for ' + name}>
                      <option value="member">Member</option>
                      <option value="chair">Chair</option>
                      <option value="co_chair">Co-Chair</option>
                    </select>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={roleStyle}>
                      {ROLE_LABELS[gm.role] || gm.role}
                    </span>
                  )}
                  {isAdmin && (
                    <button onClick={function() { handleRemove(gm); }}
                      className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      aria-label={'Remove ' + name}>
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showAddModal && (
        <AddMemberModal
          groupId={groupId}
          organizationId={organizationId}
          existingMemberIds={existingIds}
          onClose={function() { setShowAddModal(false); }}
          onSaved={function() { setShowAddModal(false); fetchMembers(); }}
        />
      )}
    </div>
  );
};

// ─── Events Tab ───────────────────────────────────────────────────────────────

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

  var fetchEvents = useCallback(async function() {
    setLoading(true);
    try {
      var res = await supabase
        .from('event_groups')
        .select('event_id, events(id, title, start_time, location)')
        .eq('group_id', groupId);
      var extracted = (res.data || [])
        .map(function(r) { return r.events; })
        .filter(Boolean)
        .sort(function(a, b) { return new Date(a.start_time) - new Date(b.start_time); });
      setEvents(extracted);
      if (onCountChange) onCountChange(extracted.length);
    } catch (_err) {
      mascotErrorToast('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [groupId, onCountChange]);

  useEffect(function() { fetchEvents(); }, [fetchEvents]);

  var handleUnlink = async function(event) {
    if (!window.confirm('Remove "' + event.title + '" from this group?')) return;
    try {
      var res = await supabase.from('event_groups')
        .delete()
        .eq('event_id', event.id)
        .eq('group_id', groupId);
      if (res.error) throw res.error;
      mascotSuccessToast('Event removed from group');
      fetchEvents();
    } catch (e) {
      mascotErrorToast('Failed to unlink event', e.message);
    }
  };

  var linkedIds = events.map(function(e) { return e.id; });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[#64748B]">
          {loading ? '' : events.length + ' ' + (events.length === 1 ? 'event' : 'events')}
        </p>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button onClick={function() { setShowLinkModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-slate-300 text-[#475569] text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-label="Link existing event to group">
                <LinkIcon />
                Link Event
              </button>
              <button onClick={function() { setShowCreateEvent(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Create new event for group">
                <PlusIcon />
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

      {loading ? <RowSkeleton count={3} /> : events.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="flex justify-center text-slate-300 mb-3"><CalendarIcon size={40} /></div>
          <p className="font-semibold text-[#0E1523] mb-1">No events yet</p>
          <p className="text-sm text-[#475569] mb-4">
            {isAdmin ? 'Create a new event or link an existing one to this group.' : 'No events assigned to this group yet.'}
          </p>
          {isAdmin && (
            <div className="flex justify-center gap-2">
              <button onClick={function() { setShowLinkModal(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-[#475569] text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <LinkIcon />
                Link Event
              </button>
              <button onClick={function() { setShowCreateEvent(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <PlusIcon />
                Create Event
              </button>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Group events">
          {events.map(function(event) {
            return (
              <li key={event.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                <Link
                  to={'/organizations/' + organizationId + '/events/' + event.id}
                  className="flex-1 min-w-0 focus:outline-none focus:underline"
                  aria-label={'View event ' + event.title}>
                  <p className="font-medium text-[#0E1523] text-sm">{event.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {formatDate(event.start_time)}
                    {event.location ? ' — ' + event.location : ''}
                  </p>
                </Link>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isAdmin && (
                    <button onClick={function() { handleUnlink(event); }}
                      className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      aria-label={'Remove ' + event.title + ' from group'}>
                      <TrashIcon />
                    </button>
                  )}
                  <Link to={'/organizations/' + organizationId + '/events/' + event.id}
                    className="p-1.5 text-[#94A3B8] hover:text-blue-500 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label={'View ' + event.title}>
                    <ChevronRightIcon />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CreateEvent isOpen={showCreateEvent}
        onClose={function() { setShowCreateEvent(false); }}
        onSuccess={function() { setShowCreateEvent(false); fetchEvents(); }}
        organizationId={organizationId}
        organizationName={orgName}
        groupId={groupId} />

      {showLinkModal && (
        <LinkEventModal
          groupId={groupId}
          organizationId={organizationId}
          linkedEventIds={linkedIds}
          onClose={function() { setShowLinkModal(false); }}
          onSaved={function() { setShowLinkModal(false); fetchEvents(); }} />
      )}
    </div>
  );
};

// ─── Documents Tab ────────────────────────────────────────────────────────────

var DocumentsTab = function(props) {
  var groupId = props.groupId;
  var organizationId = props.organizationId;
  var isAdmin = props.isAdmin;
  var onCountChange = props.onCountChange;

  var [documents, setDocuments] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showUpload, setShowUpload] = useState(false);
  var [deletingId, setDeletingId] = useState(null);

  var fetchDocs = useCallback(async function() {
    setLoading(true);
    try {
      var res = await supabase
        .from('documents')
        .select('id, title, file_name, file_type, file_size_bytes, uploaded_at, storage_path')
        .eq('organization_id', organizationId)
        .contains('allowed_groups', [groupId])
        .eq('is_current_version', true)
        .order('uploaded_at', { ascending: false });
      var data = res.data || [];
      setDocuments(data);
      if (onCountChange) onCountChange(data.length);
    } catch (_err) {
      mascotErrorToast('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [groupId, organizationId, onCountChange]);

  useEffect(function() { fetchDocs(); }, [fetchDocs]);

  var handleDownload = async function(doc) {
    try {
      var res = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600);
      if (res.error) throw res.error;
      window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (_e) {
      toast.error('Failed to generate download link');
    }
  };

  var handleDelete = async function(doc) {
    if (!window.confirm('Delete "' + doc.title + '"? This cannot be undone.')) return;
    setDeletingId(doc.id);
    try {
      if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path]);
      }
      var res = await supabase.from('documents').delete().eq('id', doc.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Document deleted');
      fetchDocs();
    } catch (e) {
      mascotErrorToast('Failed to delete document', e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[#64748B]">
          {loading ? '' : documents.length + ' ' + (documents.length === 1 ? 'document' : 'documents')}
        </p>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={function() { setShowUpload(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Upload document for group">
              <PlusIcon />
              Upload
            </button>
          )}
          <Link to={'/organizations/' + organizationId + '/documents'}
            className="text-sm text-blue-500 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            Document library
          </Link>
        </div>
      </div>

      {loading ? <RowSkeleton count={3} /> : documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="flex justify-center text-slate-300 mb-3"><FolderIcon size={40} /></div>
          <p className="font-semibold text-[#0E1523] mb-1">No documents yet</p>
          <p className="text-sm text-[#475569] mb-4">
            {isAdmin
              ? 'Upload a document or assign existing ones from the document library.'
              : 'No documents have been shared with this group yet.'}
          </p>
          {isAdmin && (
            <button onClick={function() { setShowUpload(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon />
              Upload Document
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Group documents">
          {documents.map(function(doc) {
            var ext = (doc.file_name || '').split('.').pop().toUpperCase() || 'FILE';
            return (
              <li key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0E1523] text-sm truncate">{doc.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {ext}
                    {doc.file_size_bytes ? ' — ' + formatSize(doc.file_size_bytes) : ''}
                    {' — '}
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={function() { handleDownload(doc); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#475569] border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label={'Download ' + doc.title}>
                    <DownloadIcon />
                    Download
                  </button>
                  {isAdmin && (
                    <button onClick={function() { handleDelete(doc); }}
                      disabled={deletingId === doc.id}
                      className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                      aria-label={'Delete ' + doc.title}>
                      <TrashIcon />
                    </button>
                  )}
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
          organizationId={organizationId}
          folderId={null}
          groupId={groupId} />
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

  function updateForm(key, val) {
    setForm(function(f) { var n = Object.assign({}, f); n[key] = val; return n; });
  }

  var handleSave = async function() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content.trim()) { toast.error('Content is required'); return; }
    setSaving(true);
    try {
      var userRes = await supabase.auth.getUser();
      var payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        is_pinned: form.is_pinned,
        group_id: groupId,
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
      };
      var err;
      if (editAnn) {
        var upd = await supabase.from('announcements').update(payload).eq('id', editAnn.id);
        err = upd.error;
      } else {
        payload.created_by = userRes.data.user.id;
        var ins = await supabase.from('announcements').insert(payload);
        err = ins.error;
      }
      if (err) throw err;
      mascotSuccessToast(editAnn ? 'Announcement updated' : 'Announcement posted');
      onSaved();
    } catch (e) {
      mascotErrorToast('Failed to save announcement', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="ann-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="ann-modal-title" className="text-xl font-bold text-[#0E1523]">
            {editAnn ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close">
            <XIcon />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="ann-title" className="block text-sm font-medium text-[#0E1523] mb-1">
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input id="ann-title" type="text" value={form.title}
              onChange={function(e) { updateForm('title', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Announcement title" maxLength={200} aria-required="true" />
          </div>

          <div>
            <label htmlFor="ann-content" className="block text-sm font-medium text-[#0E1523] mb-1">
              Content <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea id="ann-content" value={form.content}
              onChange={function(e) { updateForm('content', e.target.value); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[#0E1523] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4} placeholder="Write your announcement..." aria-required="true" />
          </div>

          <div className="flex items-center gap-3">
            <input id="ann-pinned" type="checkbox" checked={form.is_pinned}
              onChange={function(e) { updateForm('is_pinned', e.target.checked); }}
              className="w-4 h-4 border-slate-300 rounded text-blue-500 focus:ring-blue-500 cursor-pointer" />
            <label htmlFor="ann-pinned" className="text-sm text-[#475569] cursor-pointer">
              <span className="font-medium text-[#0E1523]">Pin this announcement</span> — shows at the top
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
          <button onClick={onClose}
            className="px-4 py-2 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-busy={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status">
                  <span className="sr-only">Saving...</span>
                </div>
                Saving...
              </>
            ) : (editAnn ? 'Save Changes' : 'Post Announcement')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Announcements Tab ────────────────────────────────────────────────────────

var AnnouncementsTab = function(props) {
  var organizationId = props.organizationId;
  var groupId = props.groupId;
  var isAdmin = props.isAdmin;

  var [announcements, setAnnouncements] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showModal, setShowModal] = useState(false);
  var [editAnn, setEditAnn] = useState(null);
  var [deletingId, setDeletingId] = useState(null);

  var fetchAnnouncements = useCallback(async function() {
    setLoading(true);
    try {
      var res = await supabase
        .from('announcements')
        .select('id, title, content, created_at, is_pinned')
        .eq('organization_id', organizationId)
        .eq('group_id', groupId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      setAnnouncements(res.data || []);
    } catch (_err) {
      mascotErrorToast('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [organizationId, groupId]);

  useEffect(function() { fetchAnnouncements(); }, [fetchAnnouncements]);

  var handleDelete = async function(ann) {
    if (!window.confirm('Delete "' + ann.title + '"? This cannot be undone.')) return;
    setDeletingId(ann.id);
    try {
      var res = await supabase.from('announcements').delete().eq('id', ann.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Announcement deleted');
      fetchAnnouncements();
    } catch (e) {
      mascotErrorToast('Failed to delete announcement', e.message);
    } finally {
      setDeletingId(null);
    }
  };

  var AnnCardSkeleton = function() {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/3 mt-2" />
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-[#64748B]">
          {loading ? '' : announcements.length + ' ' + (announcements.length === 1 ? 'announcement' : 'announcements') + ' for this group'}
        </p>
        {isAdmin && (
          <button
            onClick={function() { setEditAnn(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Create new announcement for this group">
            <PlusIcon />
            New Announcement
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {[1,2,3].map(function(i) { return <AnnCardSkeleton key={i} />; })}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="flex justify-center text-slate-300 mb-3"><MegaphoneIcon size={40} /></div>
          <p className="font-semibold text-[#0E1523] mb-1">No announcements yet</p>
          <p className="text-sm text-[#475569] mb-4">
            {isAdmin ? 'Post the first announcement for this group.' : 'No announcements have been posted to this group yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={function() { setEditAnn(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon />
              Post First Announcement
            </button>
          )}
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
          aria-label="Group announcements">
          {announcements.map(function(ann) {
            return (
              <li key={ann.id}
                className={'rounded-xl border flex flex-col ' + (ann.is_pinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200')}>
                <div className="p-4 flex-1">
                  {/* Title row */}
                  <div className="flex items-start gap-2 mb-2">
                    <p className="font-semibold text-[#0E1523] text-sm flex-1 leading-snug">{ann.title}</p>
                    {ann.is_pinned && (
                      <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  {ann.content && (
                    <p className="text-sm text-[#475569] leading-relaxed line-clamp-3">{ann.content}</p>
                  )}
                </div>

                {/* Footer */}
                <div className={'flex items-center justify-between px-4 py-2.5 border-t ' + (ann.is_pinned ? 'border-amber-200' : 'border-slate-100')}>
                  <span className="text-xs text-[#64748B]">
                    {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={function() { setEditAnn(ann); setShowModal(true); }}
                        className="p-1.5 text-[#94A3B8] hover:text-blue-500 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        aria-label={'Edit ' + ann.title}>
                        <EditIcon />
                      </button>
                      <button
                        onClick={function() { handleDelete(ann); }}
                        disabled={deletingId === ann.id}
                        className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                        aria-label={'Delete ' + ann.title}>
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showModal && (
        <GroupAnnouncementModal
          groupId={groupId}
          organizationId={organizationId}
          editAnn={editAnn}
          onClose={function() { setShowModal(false); setEditAnn(null); }}
          onSaved={function() { setShowModal(false); setEditAnn(null); fetchAnnouncements(); }} />
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

function GroupDetail() {
  var { organizationId, groupId } = useParams();
  var navigate = useNavigate();

  var [group, setGroup] = useState(null);
  var [orgName, setOrgName] = useState('');
  var [loading, setLoading] = useState(true);
  var [isAdmin, setIsAdmin] = useState(false);
  var [activeTab, setActiveTab] = useState('members');
  var [showEditModal, setShowEditModal] = useState(false);

  // Stats for header strip
  var [memberCount, setMemberCount] = useState(0);
  var [eventCount, setEventCount] = useState(0);
  var [docCount, setDocCount] = useState(0);

  var fetchGroup = useCallback(async function() {
    try {
      var userRes = await supabase.auth.getUser();
      var userId = userRes.data.user.id;

      var [groupRes, orgRes, memRes] = await Promise.all([
        supabase.from('org_groups').select('*').eq('id', groupId).single(),
        supabase.from('organizations').select('name').eq('id', organizationId).single(),
        supabase.from('memberships').select('role')
          .eq('organization_id', organizationId)
          .eq('member_id', userId)
          .eq('status', 'active')
          .single(),
      ]);

      setGroup(groupRes.data);
      setOrgName(orgRes.data ? orgRes.data.name : '');
      setIsAdmin(memRes.data ? memRes.data.role === 'admin' : false);
    } catch (_err) {
      mascotErrorToast('Failed to load group', 'Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [organizationId, groupId]);

  useEffect(function() { fetchGroup(); }, [fetchGroup]);

  var tabs = [
    { id: 'members',       label: 'Members',       icon: <UsersIcon size={15} /> },
    { id: 'events',        label: 'Events',         icon: <CalendarIcon size={15} /> },
    { id: 'documents',     label: 'Documents',      icon: <FolderIcon size={15} /> },
    { id: 'announcements', label: 'Announcements',  icon: <MegaphoneIcon size={15} /> },
  ];

  var typeStyle = group ? ({ background: '#F1F5F9', color: '#475569' }) : {};

  if (loading) return <PageSkeleton />;

  if (!group) return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center text-slate-300 mb-4"><AlertCircleIcon size={52} /></div>
        <p className="font-semibold text-lg text-[#0E1523] mb-1">Group not found</p>
        <p className="text-sm text-[#475569] mb-5">This group may have been deleted or you may not have access.</p>
        <button onClick={function() { navigate('/organizations/' + organizationId + '/groups'); }}
          className="px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Back to Groups
        </button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC]" aria-label={group.name + ' detail'}>
      <div className="px-6 py-6">

        {/* ── Back link ── */}
        <div className="mb-4">
          <button
            onClick={function() { navigate('/organizations/' + organizationId + '/groups'); }}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
            aria-label="Back to Groups and Committees"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Groups &amp; Committees
          </button>
        </div>

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: group.color || '#3B82F6' }} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[#0E1523]">{group.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={typeStyle}>
                  {TYPE_LABELS[group.type] || group.type}
                </span>
              </div>
              {group.description && (
                <p className="text-sm text-[#475569] mt-0.5">{group.description}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={function() { navigate('/organizations/' + organizationId + '/email-blasts?group=' + groupId); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-slate-300 text-[#475569] text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              aria-label={'Email ' + group.name}>
              <MailIcon />
              Email Group
            </button>
            {isAdmin && (
              <button onClick={function() { setShowEditModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-slate-300 text-[#475569] text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-label={'Edit ' + group.name}>
                <EditIcon />
                Edit Group
              </button>
            )}
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="flex items-center gap-3 mb-5 flex-wrap" role="list" aria-label="Group statistics">
          {[
            { label: 'Members',   count: memberCount, tab: 'members',   icon: <UsersIcon size={15} /> },
            { label: 'Events',    count: eventCount,  tab: 'events',    icon: <CalendarIcon size={15} /> },
            { label: 'Documents', count: docCount,    tab: 'documents', icon: <FolderIcon size={15} /> },
          ].map(function(stat) {
            return (
              <button
                key={stat.tab}
                role="listitem"
                onClick={function() { setActiveTab(stat.tab); }}
                className={'flex items-center gap-2 px-4 py-3 rounded-xl border text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (activeTab === stat.tab ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300')}
                aria-label={stat.count + ' ' + stat.label + ', switch to ' + stat.label + ' tab'}
              >
                <span className={'flex-shrink-0 ' + (activeTab === stat.tab ? 'text-blue-500' : 'text-[#64748B]')}>
                  {stat.icon}
                </span>
                <div>
                  <p className={'text-xl font-bold leading-none ' + (activeTab === stat.tab ? 'text-blue-600' : 'text-[#0E1523]')}>
                    {stat.count}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">{stat.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200" role="tablist" aria-label="Group sections">
            <div className="flex overflow-x-auto">
              {tabs.map(function(tab) {
                var isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={'tabpanel-' + tab.id}
                    id={'tab-' + tab.id}
                    onClick={function() { setActiveTab(tab.id); }}
                    className={'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ' + (isActive ? 'border-blue-500 text-blue-500' : 'border-transparent text-[#64748B] hover:text-[#475569] hover:border-slate-300')}>
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div id={'tabpanel-' + activeTab} role="tabpanel" aria-labelledby={'tab-' + activeTab} className="p-6">
            {activeTab === 'members' && (
              <MembersTab
                groupId={groupId}
                organizationId={organizationId}
                isAdmin={isAdmin}
                onCountChange={setMemberCount} />
            )}
            {activeTab === 'events' && (
              <EventsTab
                groupId={groupId}
                organizationId={organizationId}
                orgName={orgName}
                isAdmin={isAdmin}
                onCountChange={setEventCount} />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab
                groupId={groupId}
                organizationId={organizationId}
                isAdmin={isAdmin}
                onCountChange={setDocCount} />
            )}
            {activeTab === 'announcements' && (
              <AnnouncementsTab
                organizationId={organizationId}
                groupId={groupId}
                isAdmin={isAdmin} />
            )}
          </div>
        </div>

      </div>

      {showEditModal && (
        <EditGroupModal
          group={group}
          onClose={function() { setShowEditModal(false); }}
          onSaved={function() { setShowEditModal(false); fetchGroup(); }} />
      )}
    </main>
  );
}

export default GroupDetail;