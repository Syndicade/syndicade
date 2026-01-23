import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function OrganizationMembers() {
  const { organizationId } = useParams();
  const [members, setMembers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);

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
        .select(`
          *,
          member:members(*)
        `)
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
      alert('Failed to update member role');
    }
  }

  async function handleRemoveMember(membershipId) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      
      fetchOrganizationAndMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member');
    }
  }

  async function handleApproveInvitation(membershipId) {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ 
          status: 'active',
          approved_date: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (error) throw error;
      
      fetchOrganizationAndMembers();
    } catch (err) {
      console.error('Error approving invitation:', err);
      alert('Failed to approve invitation');
    }
  }

  async function handleRejectInvitation(membershipId) {
    if (!confirm('Are you sure you want to reject this invitation?')) return;

    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      
      fetchOrganizationAndMembers();
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      alert('Failed to reject invitation');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          role="status"
          aria-label="Loading members"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');
  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link 
          to={`/organizations/${organizationId}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to {organization?.name}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Members
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your organization's members and invitations
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Active Members ({activeMembers.length})
        </h2>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeMembers.map((membership) => (
                <tr key={membership.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {membership.member.first_name[0]}{membership.member.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {membership.member.first_name} {membership.member.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isAdmin ? (
                      <select
                        value={membership.role}
                        onChange={(e) => handleRoleChange(membership.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Change role for ${membership.member.first_name} ${membership.member.last_name}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="guest">Guest</option>
                      </select>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {membership.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(membership.joined_date).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveMember(membership.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                        aria-label={`Remove ${membership.member.first_name} ${membership.member.last_name}`}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && pendingMembers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Pending Invitations ({pendingMembers.length})
          </h2>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingMembers.map((membership) => (
                  <tr key={membership.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {membership.member.first_name} {membership.member.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 capitalize">
                        {membership.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {membership.invited_at ? new Date(membership.invited_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApproveInvitation(membership.id)}
                        className="text-green-600 hover:text-green-900 mr-4 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1"
                        aria-label={`Approve ${membership.member.first_name} ${membership.member.last_name}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(membership.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                        aria-label={`Reject ${membership.member.first_name} ${membership.member.last_name}`}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationMembers;