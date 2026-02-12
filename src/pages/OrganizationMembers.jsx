import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';

// Generate a consistent color from a name
const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const roleBadge = {
  admin: 'bg-purple-100 text-purple-800',
  member: 'bg-blue-100 text-blue-800',
  guest: 'bg-gray-100 text-gray-700'
};

const roleIcon = {
  admin: '👑',
  member: '👤',
  guest: '👁️'
};

function OrganizationMembers() {
  const { organizationId } = useParams();
  const [members, setMembers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchOrganizationAndMembers();
  }, [organizationId]);

  async function fetchOrganizationAndMembers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      setOrganization(org);

      const { data: userMembership } = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .single();

      setCurrentUserRole(userMembership?.role);

      const { data: membersData, error: membersError } = await supabase
        .from('memberships')
        .select(`*, member:members(*)`)
        .eq('organization_id', organizationId)
        .order('status', { ascending: false })
        .order('joined_date', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(membershipId, newRole) {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', membershipId);
      if (error) throw error;
      fetchOrganizationAndMembers();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  }

  async function handleRemoveMember(membershipId, memberName) {
    if (!window.confirm(`Remove ${memberName} from this organization?`)) return;
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);
      if (error) throw error;
      fetchOrganizationAndMembers();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  }

  async function handleApproveInvitation(membershipId) {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ status: 'active', approved_date: new Date().toISOString() })
        .eq('id', membershipId);
      if (error) throw error;
      fetchOrganizationAndMembers();
    } catch (err) {
      console.error('Error approving invitation:', err);
    }
  }

  async function handleRejectInvitation(membershipId) {
    if (!window.confirm('Reject this invitation?')) return;
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);
      if (error) throw error;
      fetchOrganizationAndMembers();
    } catch (err) {
      console.error('Error rejecting invitation:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" role="status" aria-label="Loading members">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');
  const isAdmin = currentUserRole === 'admin';

  const filteredMembers = activeMembers.filter(m => {
    const fullName = `${m.member.first_name} ${m.member.last_name}`.toLowerCase();
    const matchesSearch = search === '' || fullName.includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="Members"
          subtitle={`${activeMembers.length} ${activeMembers.length === 1 ? 'member' : 'members'}`}
          icon="👥"
          organizationName={organization?.name}
          organizationId={organizationId}
          backTo={`/organizations/${organizationId}`}
          backLabel="Back to Dashboard"
        />

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <label htmlFor="member-search" className="sr-only">Search members</label>
            <input
              id="member-search"
              type="text"
              placeholder="🔍 Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search members by name"
            />
          </div>
          <div>
            <label htmlFor="role-filter" className="sr-only">Filter by role</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter members by role"
            >
              <option value="all">All Roles ({activeMembers.length})</option>
              <option value="admin">👑 Admin ({activeMembers.filter(m => m.role === 'admin').length})</option>
              <option value="member">👤 Member ({activeMembers.filter(m => m.role === 'member').length})</option>
              <option value="guest">👁️ Guest ({activeMembers.filter(m => m.role === 'guest').length})</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-600 mb-4" aria-live="polite">
          Showing {filteredMembers.length} of {activeMembers.length} members
        </p>

        {/* Active Members Grid */}
        <section aria-labelledby="active-members-heading" className="mb-10">
          <h2 id="active-members-heading" className="text-xl font-bold text-gray-900 mb-4">
            Active Members ({activeMembers.length})
          </h2>

          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-4xl mb-3" aria-hidden="true">🔍</p>
              <p className="text-gray-600 font-semibold">No members match your search</p>
              <button
                onClick={() => { setSearch(''); setRoleFilter('all'); }}
                className="mt-3 text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              role="list"
              aria-label="Active members"
            >
              {filteredMembers.map((membership) => {
                const fullName = `${membership.member.first_name} ${membership.member.last_name}`;
                const initials = `${membership.member.first_name[0]}${membership.member.last_name[0]}`;
                const avatarColor = getAvatarColor(fullName);
                const joinDate = membership.joined_date
                  ? new Date(membership.joined_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Unknown';

                return (
                  <div
                    key={membership.id}
                    role="listitem"
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 h-14 w-14 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                        aria-hidden="true"
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{fullName}</p>
                        {membership.member.email && (
                          <p className="text-sm text-gray-500 truncate">{membership.member.email}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Joined {joinDate}</p>

                        {/* Role */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {isAdmin ? (
                            <select
                              value={membership.role}
                              onChange={(e) => handleRoleChange(membership.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              aria-label={`Change role for ${fullName}`}
                            >
                              <option value="admin">👑 Admin</option>
                              <option value="member">👤 Member</option>
                              <option value="guest">👁️ Guest</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge[membership.role] || roleBadge.member}`}>
                              <span aria-hidden="true">{roleIcon[membership.role]}</span>
                              <span className="capitalize">{membership.role}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Remove Button */}
                    {isAdmin && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => handleRemoveMember(membership.id, fullName)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
                          aria-label={`Remove ${fullName} from organization`}
                        >
                          Remove member
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending Invitations */}
        {isAdmin && pendingMembers.length > 0 && (
          <section aria-labelledby="pending-heading">
            <h2 id="pending-heading" className="text-xl font-bold text-gray-900 mb-4">
              Pending Invitations ({pendingMembers.length})
            </h2>
            <div className="space-y-3" role="list" aria-label="Pending invitations">
              {pendingMembers.map((membership) => {
                const fullName = `${membership.member.first_name} ${membership.member.last_name}`;
                const initials = `${membership.member.first_name[0]}${membership.member.last_name[0]}`;
                const avatarColor = getAvatarColor(fullName);
                return (
                  <div
                    key={membership.id}
                    role="listitem"
                    className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`} aria-hidden="true">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-500">
                          Invited {membership.invited_at ? new Date(membership.invited_at).toLocaleDateString() : 'N/A'}
                          {' · '}
                          <span className="capitalize">{membership.role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveInvitation(membership.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
                        aria-label={`Approve invitation for ${fullName}`}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(membership.id)}
                        className="px-4 py-2 bg-white text-red-600 border border-red-300 text-sm font-semibold rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
                        aria-label={`Reject invitation for ${fullName}`}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

export default OrganizationMembers;