import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MemberCard from '../components/MemberCard';

/**
 * MemberDirectory Page
 * 
 * Shows all members of a specific organization with:
 * - Search functionality (by name, email, location)
 * - Role filtering
 * - Alphabetical sorting
 * - Loading and error states
 */
function MemberDirectory() {
  const { organizationId } = useParams();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [organizationName, setOrganizationName] = useState('');

  // Fetch organization details
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single();

        if (error) throw error;
        setOrganizationName(data.name);
      } catch (err) {
        console.error('Error fetching organization:', err);
      }
    }

    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  // Fetch members
  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true);
        setError(null);

        // Query: Get all active members of this organization
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            role,
            member_id,
            members (
              user_id,
              first_name,
              last_name,
              display_name,
              email,
              bio,
              profile_photo_url,
              city,
              state,
              phone,
              location_visibility,
              phone_visibility,
              email_visibility
            )
          `)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .order('members(last_name)', { ascending: true });

        if (error) throw error;

        // Transform data to flat structure
        const membersList = data
          .filter(item => item.members !== null) // Filter out any null members
          .map(item => ({
            ...item.members,
            role: item.role
          }));

        setMembers(membersList);
        setFilteredMembers(membersList);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchMembers();
    }
  }, [organizationId]);

  // Filter and search members
  useEffect(() => {
    let result = [...members];

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(member => member.role === roleFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(member => {
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        const displayName = member.display_name?.toLowerCase() || '';
        const email = member.email?.toLowerCase() || '';
        const city = member.city?.toLowerCase() || '';
        
        return fullName.includes(query) || 
               displayName.includes(query) || 
               email.includes(query) ||
               city.includes(query);
      });
    }

    setFilteredMembers(result);
  }, [searchQuery, roleFilter, members]);

  // Handle clearing filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="sr-only">Loading members...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <h2 className="text-red-800 font-semibold text-xl mb-2">Error Loading Members</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {organizationName} Members
        </h1>
        <p className="text-gray-600">
          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          {searchQuery && ` matching "${searchQuery}"`}
          {roleFilter !== 'all' && ` with role: ${roleFilter}`}
        </p>
      </header>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label 
              htmlFor="member-search" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Members
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="member-search"
                type="text"
                placeholder="Search by name, email, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="search-help"
              />
            </div>
            <p id="search-help" className="sr-only">
              Search for members by their name, email, or location
            </p>
          </div>

          {/* Role Filter */}
          <div>
            <label 
              htmlFor="role-filter" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filter by Role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              aria-label="Filter members by their role"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="moderator">Moderators</option>
              <option value="member">Members</option>
              <option value="guest">Guests</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || roleFilter !== 'all') && (
          <div className="mt-4 flex items-center">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label="Clear all filters and show all members"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
          <p className="text-gray-600">
            {searchQuery || roleFilter !== 'all' 
              ? 'No members match your current filters. Try adjusting your search or filters.' 
              : 'This organization doesn\'t have any members yet.'}
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          role="list"
          aria-label="List of organization members"
        >
          {filteredMembers.map(member => (
            <div key={member.user_id} role="listitem">
              <MemberCard 
                member={member} 
                role={member.role}
                organizationId={organizationId}
              />
            </div>
          ))}
        </div>
      )}

      {/* Member Count Footer */}
      {filteredMembers.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredMembers.length} of {members.length} total members
        </div>
      )}
    </div>
  );
}

export default MemberDirectory;