import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';

function Organizations() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrgs, setFilteredOrgs] = useState([]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredOrgs(
        organizations.filter(org =>
          org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    } else {
      setFilteredOrgs(organizations);
    }
  }, [searchTerm, organizations]);

  async function fetchOrganizations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          *,
          organizations (
            id,
            name,
            description,
            type,
            logo_url,
            created_at
          )
        `)
        .eq('member_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const orgs = memberships?.map(m => ({
        ...m.organizations,
        role: m.role,
        joined_date: m.joined_date
      })) || [];

      setOrganizations(orgs);
      setFilteredOrgs(orgs);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
            role="status"
            aria-label="Loading organizations"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="My Organizations"
          subtitle="Manage and view all your organizations"
          icon="🏢"
          backTo="/dashboard"
          backLabel="Back to Dashboard"
          actions={
            <Link
              to="/organizations/create"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              <span className="text-xl">+</span>
              Create Organization
            </Link>
          }
        />

        {/* Search Bar */}
        <div className="mb-6 mt-6">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search organizations"
          />
        </div>

        {/* Organizations Grid */}
        {filteredOrgs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No Organizations Found' : 'No Organizations Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : "You're not a member of any organizations yet. Create one or join an existing organization."}
            </p>
            {!searchTerm && (
              <Link
                to="/organizations/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                <span className="text-xl">+</span>
                Create Your First Organization
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Organization Header with Logo/Emoji */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white relative">
                  <div className="flex items-center justify-between">
                    <div className="text-5xl">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={`${org.name} logo`}
                          className="w-16 h-16 rounded-lg object-cover bg-white"
                        />
                      ) : (
                        <span role="img" aria-label="Organization icon">
                          {getOrgEmoji(org.type)}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">
                      <span role="img" aria-label="Admin badge">
                        👤
                      </span>
                      {org.role === 'admin' ? 'Admin' : org.role === 'owner' ? 'Owner' : 'Member'}
                    </span>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {org.name}
                  </h3>
                  
                  {org.description ? (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {org.description}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm mb-4 italic">
                      No description available
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="capitalize">{org.type || 'Organization'}</span>
                    <span>
                      Member since {new Date(org.joined_date).getFullYear()}
                    </span>
                  </div>

                  <Link
                    to={`/organizations/${org.id}`}
                    className="block w-full px-4 py-3 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  >
                    View Dashboard →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get emoji based on organization type
function getOrgEmoji(type) {
  const emojiMap = {
    'nonprofit': '🏛️',
    'club': '⚽',
    'association': '🤝',
    'community': '🏘️',
    'religious': '⛪',
    'educational': '🎓',
    'sports': '🏆',
    'arts': '🎨',
    'business': '💼',
    'other': '🏢'
  };
  return emojiMap[type] || '🏢';
}

export default Organizations;