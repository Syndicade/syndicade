import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const TYPE_LABELS = {
  committee: 'Committee',
  board: 'Board',
  team: 'Team',
  volunteer: 'Volunteer',
  other: 'Other',
};

const TYPE_COLORS = {
  committee: 'bg-blue-100 text-blue-800',
  board: 'bg-purple-100 text-purple-800',
  team: 'bg-green-100 text-green-800',
  volunteer: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

function CreateGroupModal({ organizationId, onClose, onSaved, editGroup }) {
  const [form, setForm] = useState({
    name: editGroup?.name || '',
    description: editGroup?.description || '',
    type: editGroup?.type || 'committee',
    visibility: editGroup?.visibility || 'members',
    join_approval_required: editGroup?.join_approval_required ?? true,
    color: editGroup?.color || '#3B82F6',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, organization_id: organizationId, updated_at: new Date().toISOString() };
      let error;
      if (editGroup) {
        ({ error } = await supabase.from('org_groups').update(payload).eq('id', editGroup.id));
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        ({ error } = await supabase.from('org_groups').insert({ ...payload, created_by: user.id }));
      }
      if (error) throw error;
      toast.success(editGroup ? 'Group updated' : 'Group created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900">
            {editGroup ? 'Edit Group' : 'Create Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="group-name"
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Finance Committee"
              maxLength={100}
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="group-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="group-description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What does this group do?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="group-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                id="group-type"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="committee">Committee</option>
                <option value="board">Board</option>
                <option value="team">Team</option>
                <option value="volunteer">Volunteer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="group-visibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                id="group-visibility"
                value={form.visibility}
                onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="members">All Members</option>
                <option value="group_only">Group Members Only</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="group-color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                id="group-color"
                type="color"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                aria-label="Choose group color"
              />
              <span className="text-sm text-gray-500">Used to identify the group</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="join-approval"
              type="checkbox"
              checked={form.join_approval_required}
              onChange={e => setForm(f => ({ ...f, join_approval_required: e.target.checked }))}
              className="mt-1 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="join-approval" className="text-sm text-gray-700">
              <span className="font-medium">Require admin approval</span> for members requesting to join
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
}

function GroupsList() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [memberCounts, setMemberCounts] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const [{ data: org }, { data: membership }, { data: groupsData }] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', organizationId).single(),
        supabase.from('memberships').select('role').eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').single(),
        supabase.from('org_groups').select('*').eq('organization_id', organizationId).eq('is_active', true).order('sort_order').order('name'),
      ]);

      setOrgName(org?.name || '');
      setIsAdmin(membership?.role === 'admin');
      setGroups(groupsData || []);

      if (groupsData?.length) {
        const counts = {};
        await Promise.all(
          groupsData.map(async (g) => {
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', g.id)
              .eq('status', 'active');
            counts[g.id] = count || 0;
          })
        );
        setMemberCounts(counts);
      }
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (group) => {
    if (!window.confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('org_groups').update({ is_active: false }).eq('id', group.id);
      if (error) throw error;
      toast.success('Group deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" role="status" aria-label="Loading groups">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50" aria-label="Groups and Committees">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button
              onClick={() => navigate(`/organizations/${organizationId}`)}
              className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {orgName}
            </button>
            <ChevronRightIcon />
            <span className="text-gray-900 font-medium">Groups & Committees</span>
          </nav>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/organizations/${organizationId}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Back to organization dashboard"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Groups & Committees</h1>
                <p className="text-gray-500 text-sm mt-0.5">{groups.length} {groups.length === 1 ? 'group' : 'groups'}</p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => { setEditGroup(null); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Create new group"
              >
                <PlusIcon />
                New Group
              </button>
            )}
          </div>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-300 flex justify-center mb-4">
              <UsersIcon />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">No groups yet</h2>
            <p className="text-gray-500 text-sm mb-4">
              {isAdmin ? 'Create your first committee or team.' : 'No groups have been created yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => { setEditGroup(null); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create First Group
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3" role="list" aria-label="Groups list">
            {groups.map(group => (
              <li key={group.id}>
                <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4 p-4">
                    {/* Color swatch */}
                    <div
                      className="w-3 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                      aria-hidden="true"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{group.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[group.type] || 'bg-gray-100 text-gray-800'}`}>
                          {TYPE_LABELS[group.type] || group.type}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{group.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <UsersIcon />
                        <span>{memberCounts[group.id] ?? 0} {(memberCounts[group.id] ?? 0) === 1 ? 'member' : 'members'}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => { setEditGroup(group); setShowModal(true); }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            aria-label={`Edit ${group.name}`}
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(group)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            aria-label={`Delete ${group.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </>
                      )}
                      <Link
                        to={`/organizations/${organizationId}/groups/${group.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        aria-label={`View ${group.name} details`}
                      >
                        <ChevronRightIcon />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <CreateGroupModal
          organizationId={organizationId}
          editGroup={editGroup}
          onClose={() => { setShowModal(false); setEditGroup(null); }}
          onSaved={() => { setShowModal(false); setEditGroup(null); fetchData(); }}
        />
      )}
    </main>
  );
}

export default GroupsList;