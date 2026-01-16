import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CreateOrganization from '../components/CreateOrganization';

/**
 * OrganizationList Page
 * 
 * Displays all organizations the user is a member of.
 * Allows creating new organizations.
 */
function OrganizationList() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch organizations user is a member of
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          role,
          status,
          joined_date,
          organizations (
            id,
            name,
            description,
            type,
            created_at
          )
        `)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .order('joined_date', { ascending: false });

      if (error) throw error;

      // Extract and flatten organization data
      const orgs = data.map(item => ({
        ...item.organizations,
        userRole: item.role,
        memberSince: item.joined_date
      }));

      setOrganizations(orgs);

    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOrgCreated = (newOrg) => {
    // Refresh list and navigate to new org
    fetchOrganizations();
    navigate(`/organizations/${newOrg.id}`);
  };

  const getTypeIcon = (type) => {
    const icons = {
      nonprofit: '🤝',
      club: '🎭',
      association: '💼',
      community: '🏘️'
    };
    return icons[type] || '🏢';
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { icon: '👑', label: 'Admin', className: 'bg-purple-100 text-purple-800' },
      member: { icon: '👤', label: 'Member', className: 'bg-blue-100 text-blue-800' },
      guest: { icon: '👁️', label: 'Guest', className: 'bg-gray-100 text-gray-800' }
    };
    return badges[role] || badges.member;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"
          role="status"
          aria-label="Loading organizations"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Organizations</h1>
            <p className="text-gray-600 mt-1">
              Manage and view all your organizations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center gap-2"
          >
            <span>➕</span>
            Create Organization
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search organizations"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            role="alert"
          >
            <p className="text-red-800 font-semibold">Error loading organizations</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Organizations Grid */}
        {filteredOrganizations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No organizations found' : 'No organizations yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first organization to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
              >
                ➕ Create Your First Organization
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map(org => (
              <div
                key={org.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden cursor-pointer group"
                onClick={() => navigate(`/organizations/${org.id}`)}
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl">
                      {getTypeIcon(org.type)}
                    </div>
                    <span className={`
                      inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                      ${getRoleBadge(org.userRole).className}
                    `}>
                      <span className="mr-1">{getRoleBadge(org.userRole).icon}</span>
                      {getRoleBadge(org.userRole).label}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {org.description || 'No description available'}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{org.type}</span>
                    <span>Member since {new Date(org.memberSince || org.created_at).getFullYear()}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    className="w-full px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/organizations/${org.id}`);
                    }}
                  >
                    View Dashboard →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganization
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleOrgCreated}
      />
    </div>
  );
}

export default OrganizationList;