import { useState } from 'react';

/**
 * GroupCard Component
 *
 * Displays a group/committee card with:
 * - Group name, type, description
 * - Member avatar stack
 * - Member count
 * - Lead designation
 * - Join/Leave/Manage actions
 *
 * Props:
 * - group: object - group data with members array
 * - currentUserId: string - logged-in user's ID
 * - isAdmin: boolean - whether current user is org admin
 * - onManage: function - called when admin clicks Manage
 * - onJoin: function - called when member requests to join
 * - onLeave: function - called when member leaves
 * - onDelete: function - called when admin deletes group
 */
function GroupCard({ group, currentUserId, isAdmin, onManage, onJoin, onLeave, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  if (!group) return null;

  const activeMembers = (group.group_memberships || []).filter(
    (gm) => gm.status === 'active'
  );

  const pendingMembers = (group.group_memberships || []).filter(
    (gm) => gm.status === 'pending'
  );

  const currentUserMembership = (group.group_memberships || []).find(
    (gm) => gm.member_id === currentUserId
  );

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
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500'
  ];

  // Show up to 5 avatars then a +N overflow
  const visibleMembers = activeMembers.slice(0, 5);
  const overflowCount = activeMembers.length - visibleMembers.length;

  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200"
      aria-label={'Group: ' + group.name}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {group.name}
            </h3>
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
            <span
              className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getGroupTypeBadgeColor(group.group_type)}
            >
              {getGroupTypeLabel(group.group_type)}
            </span>
            <span className="text-xs text-gray-500">
              {group.join_mode === 'open' ? 'Open to join' : 'Approval required'}
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
          <div className="flex gap-2 flex-shrink-0">
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
        <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-2">
          {group.description}
        </p>
      )}

      {/* Group Lead */}
      {group.lead_member && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-purple-50 rounded-lg border border-purple-100">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex-shrink-0">
            Lead:
          </span>
          {group.lead_member.profile_photo_url ? (
            <img
              src={group.lead_member.profile_photo_url}
              alt=""
              aria-hidden="true"
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              aria-hidden="true"
            >
              {getInitials(group.lead_member)}
            </div>
          )}
          <span className="text-sm font-medium text-purple-900 truncate">
            {group.lead_member.first_name + ' ' + group.lead_member.last_name}
            {isLead && (
              <span className="ml-1 text-purple-600 text-xs">(You)</span>
            )}
          </span>
        </div>
      )}

      {/* Member Avatar Stack + Count */}
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
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold"
                    aria-label={overflowCount + ' more members'}
                  >
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

        {/* Member Actions */}
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

      {/* Expand toggle for full member list */}
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
            <ul
              id={'member-list-' + group.id}
              className="mt-3 space-y-2"
              aria-label={'Members of ' + group.name}
            >
              {activeMembers.map((gm, index) => (
                <li
                  key={gm.member_id || index}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                >
                  {gm.members?.profile_photo_url ? (
                    <img
                      src={gm.members.profile_photo_url}
                      alt=""
                      aria-hidden="true"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ' + avatarColors[index % avatarColors.length]}
                      aria-hidden="true"
                    >
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