import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PollCard from '../components/PollCard';
import CreatePoll from '../components/CreatePoll';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  chart:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  plus:    'M12 4v16m8-8H4',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  filter:  'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  check:   'M5 13l4 4L19 7',
  x:       'M6 18L18 6M6 6l12 12',
  alert:   ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="h-7 w-10 bg-gray-300 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>
  );
}

function PollCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-5 w-2/3 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-1/2 bg-gray-100 rounded" />
      <div className="space-y-2 pt-2">
        {[1,2,3].map(function(i) { return <div key={i} className="h-8 bg-gray-100 rounded-lg" />; })}
      </div>
    </div>
  );
}

function PollsList() {
  var params = useParams();
  var organizationId = params.organizationId;

  var [polls, setPolls] = useState([]);
  var [filteredPolls, setFilteredPolls] = useState([]);
  var [organization, setOrganization] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [statusFilter, setStatusFilter] = useState('all');
  var [typeFilter, setTypeFilter] = useState('all');
  var [isAdmin, setIsAdmin] = useState(false);
  var [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(function() {
    if (organizationId) fetchOrganization();
  }, [organizationId]);

  useEffect(function() {
    if (organizationId) fetchPolls();
  }, [organizationId]);

  useEffect(function() {
    var filtered = polls.slice();
    if (searchTerm.trim()) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function(p) {
        return p.title.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term));
      });
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(function(p) { return p.status === statusFilter; });
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(function(p) { return p.poll_type === typeFilter; });
    }
    filtered.sort(function(a, b) {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    setFilteredPolls(filtered);
  }, [polls, searchTerm, statusFilter, typeFilter]);

  async function fetchOrganization() {
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) throw new Error('Not authenticated');
      var user = authResult.data.user;

      var orgResult = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memberResult = await supabase
        .from('memberships').select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .single();

      setIsAdmin(memberResult.data && memberResult.data.role === 'admin');
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message);
    }
  }

  async function fetchPolls() {
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) throw new Error('Not authenticated');

      var result = await supabase
        .from('polls')
        .select('*')
        .eq('organization_id', organizationId)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;

      var now = new Date();
      var updated = (result.data || []).map(function(poll) {
        if (poll.closing_date && new Date(poll.closing_date) < now && poll.status === 'active') {
          return Object.assign({}, poll, { status: 'closed' });
        }
        return poll;
      });

      setPolls(updated);
      setFilteredPolls(updated);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError(err.message);
      toast.error('Failed to load polls.');
    } finally {
      setLoading(false);
    }
  }

  function handlePollDelete(pollId) {
    setPolls(function(prev) { return prev.filter(function(p) { return p.id !== pollId; }); });
    toast.success('Poll deleted.');
  }

  function handlePollCreated(newPoll) {
    setPolls(function(prev) { return [newPoll].concat(prev); });
    // toast is handled inside CreatePoll
  }

  var activeCount = polls.filter(function(p) { return p.status === 'active'; }).length;
  var closedCount = polls.filter(function(p) { return p.status === 'closed'; }).length;
  var hasFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-56 bg-gray-100 rounded" />
            </div>
            <div className="h-11 w-32 bg-gray-200 rounded-lg" />
          </div>
        </div>
        {/* Stat skeletons */}
        <div className="grid grid-cols-2 gap-4">
          <StatSkeleton />
          <StatSkeleton />
        </div>
        {/* Controls skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>
        {/* Poll card skeletons */}
        <div className="space-y-4">
          {[1,2,3].map(function(i) { return <PollCardSkeleton key={i} />; })}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex justify-center mb-3">
            <Icon path={ICONS.alert} className="h-12 w-12 text-red-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Failed to Load Polls</h3>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={function() { setError(null); setLoading(true); fetchPolls(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      <PageHeader
        title="Polls"
        subtitle="Create and participate in organization polls"
        icon={<Icon path={ICONS.chart} className="h-7 w-7 text-blue-500" />}
        organizationName={organization ? organization.name : ''}
        organizationId={organizationId}
        backTo={'/organizations/' + organizationId}
        backLabel="Back to Dashboard"
        actions={
          isAdmin && (
            <button
              onClick={function() { setShowCreateModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
            >
              <Icon path={ICONS.plus} className="h-4 w-4" />
              Create Poll
            </button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={'rounded-xl p-5 border-2 ' + (activeCount > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200')}>
          <p className={'text-2xl font-extrabold ' + (activeCount > 0 ? 'text-green-700' : 'text-gray-500')}>{activeCount}</p>
          <div className="flex items-center gap-2 mt-1">
            <Icon path={ICONS.check} className={'h-4 w-4 ' + (activeCount > 0 ? 'text-green-500' : 'text-gray-400')} />
            <p className={'text-sm font-semibold ' + (activeCount > 0 ? 'text-green-600' : 'text-gray-500')}>Active Polls</p>
          </div>
        </div>
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
          <p className="text-2xl font-extrabold text-gray-600">{closedCount}</p>
          <div className="flex items-center gap-2 mt-1">
            <Icon path={ICONS.lock} className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-500">Closed Polls</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">

          {/* Search */}
          <div className="flex-1 w-full relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Icon path={ICONS.search} className="h-4 w-4 text-gray-400" />
            </div>
            <label htmlFor="search-polls" className="sr-only">Search polls</label>
            <input
              id="search-polls"
              type="text"
              placeholder="Search polls..."
              value={searchTerm}
              onChange={function(e) { setSearchTerm(e.target.value); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={function(e) { setStatusFilter(e.target.value); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="all">{'All (' + polls.length + ')'}</option>
              <option value="active">{'Active (' + activeCount + ')'}</option>
              <option value="closed">{'Closed (' + closedCount + ')'}</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Type:</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={function(e) { setTypeFilter(e.target.value); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="all">All Types</option>
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="yes_no_abstain">Yes / No / Abstain</option>
            </select>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={function() { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
              className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors whitespace-nowrap"
              aria-label="Clear all filters"
            >
              <Icon path={ICONS.x} className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Poll list or empty state */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex justify-center mb-3">
            <Icon path={ICONS.chart} className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {hasFilters ? 'No polls match your filters' : 'No polls yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {hasFilters
              ? 'Try adjusting your search or filters.'
              : isAdmin
              ? 'Create your first poll to get started.'
              : 'Check back later for polls.'}
          </p>
          {isAdmin && !hasFilters && (
            <button
              onClick={function() { setShowCreateModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
            >
              <Icon path={ICONS.plus} className="h-4 w-4" />
              Create Poll
            </button>
          )}
          {hasFilters && (
            <button
              onClick={function() { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
            >
              <Icon path={ICONS.x} className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4" role="list" aria-label="Polls">
          {filteredPolls.map(function(poll) {
            return (
              <div key={poll.id} role="listitem">
                <PollCard
                  poll={poll}
                  onVote={function(pollId) { console.log('Vote submitted for poll:', pollId); }}
                  onDelete={handlePollDelete}
                  isAdmin={isAdmin}
                  showOrganization={false}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {filteredPolls.length > 0 && (
        <p className="text-center text-gray-400 text-xs">
          {'Showing ' + filteredPolls.length + ' of ' + polls.length + ' poll' + (polls.length !== 1 ? 's' : '')}
        </p>
      )}

      {/* Create Poll Modal */}
      <CreatePoll
        isOpen={showCreateModal}
        onClose={function() { setShowCreateModal(false); }}
        onSuccess={handlePollCreated}
        organizationId={organizationId}
        organizationName={organization ? organization.name : 'Organization'}
      />

    </div>
  );
}

export default PollsList;