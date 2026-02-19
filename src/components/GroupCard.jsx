import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * GroupCard Component
 *
 * Displays a group/committee card with:
 * - Group name, type, description
 * - Member avatar stack + count
 * - Lead designation
 * - Join/Leave/Manage/Edit/Delete actions
 * - Inline edit form for admins
 */
function GroupCard({ group, currentUserId, isAdmin, onManage, onJoin, onLeave, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({
    name: group.name || '',
    description: group.description || '',
    join_mode: group.join_mode || 'open',
    lead_member_id: group.lead_member_id || ''
  });

  if (!group) return null;

  const activeMembers = (group.group_memberships || []).filter(gm => gm.status === 'active');
  const pendingMembers = (group.group_memberships || []).filter(gm => gm.status === 'pending');
  const currentUserMembership = (group.group_memberships || []).find(gm => gm.member_id === currentUserId);
  const isMember = currentUserMembership?.status === 'active';
  const isPending = currentUserMembership?.status === 'pending';
  const isLead = group.lead_member_id === currentUserId;

  const getGroupTypeLabel = (type) => {
    const labels = {
      committee: 'Committee',
      board: 'Board',
      volunteer_team: 'Volunteer Team',
      working_group: 'Working Group',
      other: 'Group'
    };
    return labels[type] || 'Group';
  };

  const getGroupTypeBadgeColor = (type) => {
    const colors = {
      committee: 'bg-blue-100 text-blue-800',
      board: 'bg-purple-100 text-purple-800',
      volunteer_team: 'bg-green-100 text-green-800',
      working_group: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (member) => {
    const first = member?.first_name?.charAt(0) || '';
    const last = member?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const avatarColors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
  ];

  const visibleMembers = activeMembers.slice(0, 5);
  const overflowCount = activeMembers.length - visibleMembers.length;

  function handleEditOpen() {
    setEditForm({
      name: group.name || '',
      description: group.description || '',
      join_mode: group.join_mode || 'open',
      lead_member_id: group.lead_member_id || ''
    });
    setEditError(null);
    setEditing(true);
  }

  async function handleEditSave() {
    if (!editForm.name.trim()) {
      setEditError('Group name is required.');
      return;
    }
    try {
      setEditLoading(true);
      setEditError(null);

      const updates = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        join_mode: editForm.join_mode,
        lead_member_id: editForm.lead_member_id || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', group.id)
        .select()
        .single();

      if (error) throw error;

      setEditing(false);
      if (onUpdate) onUpdate({ ...group, ...data });
    } catch (err) {
      console.error('Error updating group:', err);
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200"
      aria-label={'Group: ' + group.name}
    >
      {/* ── EDIT FORM ── */}
      {editing && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg" role="region" aria-label="Edit group form">
          <h4 className="text-sm font-bold text-blue-900 mb-3">Edit Group</h4>

          {editError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700" role="alert">
              {editError}
            </div>
          )}

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label htmlFor={'edit-name-' + group.id} className="block text-xs font-semibold text-gray-700 mb-1">
                Group Name <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id={'edit-name-' + group.id}
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                maxLength={100}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor={'edit-desc-' + group.id} className="block text-xs font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id={'edit-desc-' + group.id}
                value={editForm.description}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Join Mode */}
            <div>
              <label htmlFor={'edit-join-' + group.id} className="block text-xs font-semibold text-gray-700 mb-1">
                Join Mode
              </label>
              <select
                id={'edit-join-' + group.id}
                value={editForm.join_mode}
                onChange={e => setEditForm(prev => ({ ...prev, join_mode: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="open">Open — anyone can join</option>
                <option value="approval">Approval required</option>
                <option value="invite_only">Invite only</option>
              </select>
            </div>

            {/* Lead Member */}
            <div>
              <label htmlFor={'edit-lead-' + group.id} className="block text-xs font-semibold text-gray-700 mb-1">
                Group Lead
              </label>
              <select
                id={'edit-lead-' + group.id}
                value={editForm.lead_member_id}
                onChange={e => setEditForm(prev => ({ ...prev, lead_member_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— No lead assigned —</option>
                {activeMembers.map(gm => (
                  gm.members && (
                    <option key={gm.member_id} value={gm.member_id}>
                      {gm.members.first_name + ' ' + gm.members.last_name}
                    </option>
                  )
                ))}
              </select>
              {activeMembers.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Add members to the group first to assign a lead.</p>
              )}
            </div>
          </div>

          {/* Edit Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleEditSave}
              disabled={editLoading}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Save group changes"
            >
              {editLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={editLoading}
              className="px-4 py-1.5 text-sm bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 font-medium transition-colors"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-bold text-gray-900 truncate">{group.name}</h3>
            {(isMember || isLead) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                Joined
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                Pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getGroupTypeBadgeColor(group.group_type)}>
              {getGroupTypeLabel(group.group_type)}
            </span>
            <span className="text-xs text-gray-500">
              {group.join_mode === 'open' ? 'Open to join' : group.join_mode === 'invite_only' ? 'Invite only' : 'Approval required'}
            </span>
            {pendingMembers.length > 0 && isAdmin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                {pendingMembers.length} pending request{pendingMembers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={handleEditOpen}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-colors font-medium"
              aria-label={'Edit group: ' + group.name}
            >
              Edit
            </button>
            <button
              onClick={() => onManage && onManage(group)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors font-medium"
              aria-label={'Manage group: ' + group.name}
            >
              Manage
            </button>
            <button
              onClick={() => onDelete && onDelete(group)}
              className="px-3 py-1.5 text-sm bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition-colors font-medium"
              aria-label={'Delete group: ' + group.name}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">{group.description}</p>
      )}

      {/* Group Lead */}
      {group.lead_member && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-purple-50 rounded-lg border border-purple-100">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex-shrink-0">Lead:</span>
          {group.lead_member.profile_photo_url ? (
            <img src={group.lead_member.profile_photo_url} alt="" aria-hidden="true" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0" aria-hidden="true">
              {getInitials(group.lead_member)}
            </div>
          )}
          <span className="text-sm font-medium text-purple-900 truncate">
            {group.lead_member.first_name + ' ' + group.lead_member.last_name}
            {isLead && <span className="ml-1 text-purple-600 text-xs">(You)</span>}
          </span>
        </div>
      )}

      {/* Member Avatar Stack */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeMembers.length > 0 ? (
            <div className="flex items-center" aria-label={activeMembers.length + ' active members'}>
              <div className="flex -space-x-2">
                {visibleMembers.map((gm, index) => (
                  <div key={gm.member_id || index} className="relative">
                    {gm.members?.profile_photo_url ? (
                      <img
                        src={gm.members.profile_photo_url}
                        alt={gm.members.first_name + ' ' + gm.members.last_name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                        title={gm.members.first_name + ' ' + gm.members.last_name}
                      />
                    ) : (
                      <div
                        className={'w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold ' + avatarColors[index % avatarColors.length]}
                        title={gm.members ? gm.members.first_name + ' ' + gm.members.last_name : 'Member'}
                        aria-hidden="true"
                      >
                        {gm.members ? getInitials(gm.members) : '?'}
                      </div>
                    )}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold" aria-label={overflowCount + ' more members'}>
                    +{overflowCount}
                  </div>
                )}
              </div>
              <span className="ml-3 text-sm text-gray-600 font-medium">
                {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">No members yet</span>
          )}
        </div>

        {/* Member Actions (non-admin) */}
        {!isAdmin && (
          <div>
            {isMember ? (
              <button
                onClick={() => onLeave && onLeave(group)}
                className="px-3 py-1.5 text-sm bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-red-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors font-medium"
                aria-label={'Leave group: ' + group.name}
              >
                Leave
              </button>
            ) : isPending ? (
              <button
                disabled
                className="px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg font-medium cursor-not-allowed"
                aria-label="Join request pending approval"
              >
                Requested
              </button>
            ) : (
              <button
                onClick={() => onJoin && onJoin(group)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors font-medium"
                aria-label={'Join group: ' + group.name}
              >
                {group.join_mode === 'open' ? 'Join' : 'Request to Join'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expand toggle */}
      {activeMembers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-expanded={expanded}
            aria-controls={'member-list-' + group.id}
          >
            {expanded ? 'Hide members' : 'Show all members'}
          </button>

          {expanded && (
            <ul id={'member-list-' + group.id} className="mt-3 space-y-2" aria-label={'Members of ' + group.name}>
              {activeMembers.map((gm, index) => (
                <li key={gm.member_id || index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  {gm.members?.profile_photo_url ? (
                    <img src={gm.members.profile_photo_url} alt="" aria-hidden="true" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className={'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ' + avatarColors[index % avatarColors.length]} aria-hidden="true">
                      {gm.members ? getInitials(gm.members) : '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {gm.members ? gm.members.first_name + ' ' + gm.members.last_name : 'Unknown'}
                    </p>
                    {group.lead_member_id === gm.member_id && (
                      <p className="text-xs text-purple-600 font-semibold">Group Lead</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

export default GroupCard;