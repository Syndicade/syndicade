import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';

function OrganizationDashboard() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingInvites: 0,
    activeEvents: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'invite', label: 'Invite', icon: '✉️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  async function fetchData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .single();

      if (membershipError) {
        setError('You are not a member of this organization');
        setLoading(false);
        return;
      }

      setMembership(membershipData);
      await fetchStats();

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const { count: memberCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const { count: inviteCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending');

      setStats({
        totalMembers: memberCount || 0,
        pendingInvites: inviteCount || 0,
        activeEvents: 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-semibold text-lg">Access Denied</p>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => navigate('/organizations')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ← Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 mt-1">{organization.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                  {organization.type}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {membership.role === 'admin' ? '👑 Admin' : '👤 Member'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/organizations')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← All Organizations
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-all
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-semibold uppercase">Total Members</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalMembers}</p>
                      </div>
                      <div className="text-4xl">👥</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-600 text-sm font-semibold uppercase">Pending Invites</p>
                        <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingInvites}</p>
                      </div>
                      <div className="text-4xl">✉️</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-semibold uppercase">Upcoming Events</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">{stats.activeEvents}</p>
                      </div>
                      <div className="text-4xl">📅</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveTab('members')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
                      <span className="font-semibold text-gray-900">View Members</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
                      <span className="font-semibold text-gray-900">Organization Settings</span>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>🚀 Coming Soon:</strong> Member management, event calendar, announcements, and more!
                  </p>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Members</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-600">Member management coming in next phase!</p>
                </div>
              </div>
            )}

            {/* Invite Tab */}
            {activeTab === 'invite' && (
              <>
                {membership.role === 'admin' || organization.settings?.allowMemberInvites ? (
                  <InviteMember
                    organizationId={organizationId}
                    organizationName={organization.name}
                    onInviteSent={(inviteData) => {
                      console.log('Invitation sent:', inviteData);
                      fetchStats();
                    }}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <p className="text-yellow-800 font-semibold">Permission Required</p>
                    <p className="text-yellow-700">
                      Member invitations are disabled. Contact an admin to enable this feature.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <>
                {membership.role === 'admin' ? (
                  <OrganizationSettings
                    organizationId={organizationId}
                    onUpdate={(updatedData) => {
                      setOrganization(prev => ({ ...prev, ...updatedData }));
                    }}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <p className="text-yellow-800 font-semibold">Admin Access Required</p>
                    <p className="text-yellow-700">Only organization admins can modify settings.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizationDashboard;