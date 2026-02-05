import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PollCard from '../components/PollCard';
import CreatePoll from '../components/CreatePoll';
import PageHeader from '../components/PageHeader';

/**
 * PollsList Page
 * 
 * Displays all polls for an organization with search, filter,
 * and sort capabilities. Shows active polls first, then closed polls.
 * 
 * Route: /organizations/:organizationId/polls
 * 
 * Features:
 * - Display polls sorted by status > date
 * - Search by title/description
 * - Filter by status (all, active, closed)
 * - Filter by poll type
 * - Show voted/unvoted status
 * - Empty states
 * - Loading skeleton
 * - ADA compliant
 */
function PollsList() {
  const { organizationId } = useParams();
  const [polls, setPolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch organization and check admin status
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        // Check if user is admin
        const { data: membership, error: memberError } = await supabase
          .from('memberships')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('member_id', user.id)
          .eq('status', 'active')
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError;
        }

        setIsAdmin(membership?.role === 'admin');
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err.message);
      }
    }

    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  // Fetch polls
  useEffect(() => {
    async function fetchPolls() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch polls
        const { data, error } = await supabase
          .from('polls')
          .select('*')
          .eq('organization_id', organizationId)
          .order('status', { ascending: true }) // active comes before closed
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Check for expired polls and update status
        const now = new Date();
        const updatedPolls = data.map(poll => {
          if (poll.closing_date && new Date(poll.closing_date) < now && poll.status === 'active') {
            return { ...poll, status: 'closed' };
          }
          return poll;
        });

        setPolls(updatedPolls);
        setFilteredPolls(updatedPolls);

      } catch (err) {
        console.error('Error fetching polls:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchPolls();
    }
  }, [organizationId]);

  // Apply search and filter
  useEffect(() => {
    let filtered = [...polls];

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.poll_type === typeFilter);
    }

    // Sort: active first, then by date (newest first)
    filtered.sort((a, b) => {
      // Active polls first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;

      // Then by date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredPolls(filtered);
  }, [polls, searchTerm, statusFilter, typeFilter]);

  // Handle poll vote
  const handlePollVote = (pollId) => {
    // Poll card handles the vote, we just refresh
    console.log('Vote submitted for poll:', pollId);
  };

  // Handle poll delete
  const handlePollDelete = (pollId) => {
    setPolls(prev => prev.filter(p => p.id !== pollId));
  };

  // Handle new poll created
  const handlePollCreated = (newPoll) => {
    setPolls(prev => [newPoll, ...prev]);
    alert('✅ Poll created successfully!');
  };

  // Count active polls
  const activeCount = polls.filter(p => p.status === 'active').length;
  const closedCount = polls.filter(p => p.status === 'closed').length;

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center p-12">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            role="status"
            aria-label="Loading polls"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <p className="text-red-800 font-semibold">Error Loading Polls</p>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
    <PageHeader
      title="Polls"
      subtitle="Create and participate in organization polls"
      icon="📊"
      organizationName={organization?.name}
      organizationId={organizationId}
      backTo={`/organizations/${organizationId}`}
      backLabel="Back to Dashboard"
      actions={
        isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            ➕ Create Poll
          </button>
        )
      }
    />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold text-lg">{activeCount}</p>
          <p className="text-green-600 text-sm">Active Polls</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-800 font-semibold text-lg">{closedCount}</p>
          <p className="text-gray-600 text-sm">Closed Polls</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <label htmlFor="search-polls" className="sr-only">
              Search polls
            </label>
            <input
              id="search-polls"
              type="text"
              placeholder="🔍 Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 items-center">
            <label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({polls.length})</option>
              <option value="active">✅ Active ({activeCount})</option>
              <option value="closed">🔒 Closed ({closedCount})</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 items-center">
            <label htmlFor="type-filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Type:
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="single_choice">⚪ Single Choice</option>
              <option value="multiple_choice">☑️ Multiple Choice</option>
              <option value="yes_no_abstain">✅ Yes/No/Abstain</option>
            </select>
          </div>
        </div>
      </div>

      {/* Polls List */}
      {filteredPolls.length === 0 ? (
        // Empty state
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? '🔍 No polls match your filters'
              : '📊 No polls yet'}
          </p>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : isAdmin
              ? 'Create your first poll to get started!'
              : 'Check back later for polls'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handlePollVote}
              onDelete={handlePollDelete}
              isAdmin={isAdmin}
              showOrganization={false}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredPolls.length > 0 && (
        <p className="text-center text-gray-500 text-sm mt-6">
          Showing {filteredPolls.length} of {polls.length} polls
        </p>
      )}

      {/* Create Poll Modal */}
      <CreatePoll
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handlePollCreated}
        organizationId={organizationId}
        organizationName={organization?.name || 'Organization'}
      />
    </div>
  );
}

export default PollsList;