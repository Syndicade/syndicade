import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import PollCard from '../components/PollCard';
import CreatePoll from '../components/CreatePoll';

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
  chart:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  plus:   'M12 4v16m8-8H4',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  check:  'M5 13l4 4L19 7',
  lock:   'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  pin:    ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
  x:      'M6 18L18 6M6 6l12 12',
  alert:  ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

function StatSkeleton() {
  return (
    <div className="rounded-xl p-5 animate-pulse border bg-gray-100 border-gray-200">
      <div className="h-7 w-10 rounded mb-2 bg-gray-300" />
      <div className="h-4 w-24 rounded bg-gray-200" />
    </div>
  );
}

function PollCardSkeleton() {
  return (
    <div className="rounded-xl p-5 animate-pulse border bg-white border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-2/3 rounded bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="h-4 w-1/2 rounded mb-4 bg-gray-100" />
      <div className="space-y-2">
        {[1,2,3].map(function(i) { return <div key={i} className="h-8 rounded-lg bg-gray-100" />; })}
      </div>
    </div>
  );
}

function PollsList() {
  var params = useParams();
  var organizationId = params.organizationId;
  var { isAdmin } = useOutletContext();

  var [polls, setPolls] = useState([]);
  var [filteredPolls, setFilteredPolls] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [statusFilter, setStatusFilter] = useState('all');
  var [typeFilter, setTypeFilter] = useState('all');
  var [sortBy, setSortBy] = useState('pinned_recent');
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [editingPoll, setEditingPoll] = useState(null);
  var [orgName, setOrgName] = useState('');
  var [memberCount, setMemberCount] = useState(0);

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  useEffect(function() {
    applyFiltersAndSort();
  }, [polls, searchTerm, statusFilter, typeFilter, sortBy]);

  function isPollClosed(p) {
    var expired = p.closes_at && new Date(p.closes_at) < new Date();
    return p.status === 'closed' || expired;
  }

  function applyFiltersAndSort() {
    var filtered = polls.slice();

    if (searchTerm.trim()) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function(p) {
        return p.title.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term));
      });
    }

    if (statusFilter === 'active') filtered = filtered.filter(function(p) { return !isPollClosed(p); });
    if (statusFilter === 'closed') filtered = filtered.filter(function(p) { return isPollClosed(p); });
    if (typeFilter !== 'all') filtered = filtered.filter(function(p) { return p.poll_type === typeFilter; });

    filtered.sort(function(a, b) {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      if (sortBy === 'closing') {
        if (!a.closes_at && !b.closes_at) return new Date(b.created_at) - new Date(a.created_at);
        if (!a.closes_at) return 1;
        if (!b.closes_at) return -1;
        return new Date(a.closes_at) - new Date(b.closes_at);
      }

      var aClosed = isPollClosed(a);
      var bClosed = isPollClosed(b);
      if (!aClosed && bClosed) return -1;
      if (aClosed && !bClosed) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredPolls(filtered);
  }

  async function loadData() {
    try {
      setLoading(true); setError(null);

      var orgResult = await supabase.from('organizations').select('name').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrgName(orgResult.data.name);

      var countResult = await supabase
        .from('memberships').select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId).eq('status', 'active');
      setMemberCount(countResult.count || 0);

      var pollsResult = await supabase.from('polls').select('*')
        .eq('organization_id', organizationId).order('created_at', { ascending: false });
      if (pollsResult.error) throw pollsResult.error;
      setPolls(pollsResult.data || []);

    } catch (err) {
      console.error('Error loading polls:', err);
      setError(err.message);
      mascotErrorToast('Failed to load polls.', 'Please try again.');
    } finally { setLoading(false); }
  }

  function handlePollDelete(pollId) {
    setPolls(function(prev) { return prev.filter(function(p) { return p.id !== pollId; }); });
  }

  function handlePollCreated(newPoll) {
    setPolls(function(prev) { return [newPoll].concat(prev); });
  }

  function handlePollUpdated(updatedPoll) {
    setPolls(function(prev) {
      return prev.map(function(p) { return p.id === updatedPoll.id ? updatedPoll : p; });
    });
  }

  function handleDuplicate(newPoll) {
    setPolls(function(prev) { return [newPoll].concat(prev); });
  }

  function openCreate() {
    setEditingPoll(null);
    setShowCreateModal(true);
  }

  function openEdit(poll) {
    setEditingPoll(poll);
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
    setEditingPoll(null);
  }

  var activeCount  = polls.filter(function(p) { return !isPollClosed(p); }).length;
  var closedCount  = polls.filter(function(p) { return isPollClosed(p); }).length;
  var pinnedCount  = polls.filter(function(p) { return p.is_pinned; }).length;
  var hasFilters   = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="px-6 py-6 space-y-6">
          <div className="rounded-xl border p-6 animate-pulse bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-7 w-24 rounded bg-gray-200" />
                <div className="h-4 w-52 rounded bg-gray-100" />
              </div>
              <div className="h-10 w-32 rounded-lg bg-gray-200" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatSkeleton /><StatSkeleton /><StatSkeleton />
          </div>
          <div className="rounded-xl border p-4 animate-pulse bg-white border-slate-200">
            <div className="h-10 rounded-lg bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(function(i) { return <PollCardSkeleton key={i} />; })}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Icon path={ICONS.alert} className="h-14 w-14 text-red-300" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#0E1523]">Failed to Load Polls</h2>
          <p className="text-sm mb-6 text-[#475569]">{error}</p>
          <button onClick={function() { setError(null); loadData(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="px-6 py-6 space-y-6">

        {/* Page header */}
        <div className="rounded-xl border p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Icon path={ICONS.chart} className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0E1523]">Polls</h1>
                <p className="text-sm text-[#64748B]">
                  {polls.length + ' poll' + (polls.length !== 1 ? 's' : '') + ' · ' + activeCount + ' active'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm">
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Create Poll
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className={'rounded-xl p-5 border-2 ' + (activeCount > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (activeCount > 0 ? 'text-green-700' : 'text-gray-500')}>{activeCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.check} className={'h-4 w-4 ' + (activeCount > 0 ? 'text-green-500' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (activeCount > 0 ? 'text-green-600' : 'text-gray-500')}>Active</p>
            </div>
          </div>
          <div className="rounded-xl p-5 border-2 bg-gray-50 border-gray-200">
            <p className="text-2xl font-extrabold text-gray-600">{closedCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.lock} className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-500">Closed</p>
            </div>
          </div>
          <div className={'rounded-xl p-5 border-2 ' + (pinnedCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (pinnedCount > 0 ? 'text-yellow-700' : 'text-gray-500')}>{pinnedCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.pin} className={'h-4 w-4 ' + (pinnedCount > 0 ? 'text-yellow-500' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (pinnedCount > 0 ? 'text-yellow-600' : 'text-gray-500')}>Pinned</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-xl border p-4 bg-white border-slate-200">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
            <div className="flex-1 w-full relative min-w-[160px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon path={ICONS.search} className="h-4 w-4 text-gray-400" />
              </div>
              <label htmlFor="search-polls" className="sr-only">Search polls</label>
              <input id="search-polls" type="text" placeholder="Search polls..."
                value={searchTerm} onChange={function(e) { setSearchTerm(e.target.value); }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-xs font-bold uppercase tracking-wide whitespace-nowrap text-[#F5B731]">Status:</label>
              <select id="status-filter" value={statusFilter} onChange={function(e) { setStatusFilter(e.target.value); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900">
                <option value="all">{'All (' + polls.length + ')'}</option>
                <option value="active">{'Active (' + activeCount + ')'}</option>
                <option value="closed">{'Closed (' + closedCount + ')'}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="type-filter" className="text-xs font-bold uppercase tracking-wide whitespace-nowrap text-[#F5B731]">Type:</label>
              <select id="type-filter" value={typeFilter} onChange={function(e) { setTypeFilter(e.target.value); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900">
                <option value="all">All Types</option>
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="yes_no_abstain">Yes / No / Abstain</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-polls" className="text-xs font-bold uppercase tracking-wide whitespace-nowrap text-[#F5B731]">Sort:</label>
              <select id="sort-polls" value={sortBy} onChange={function(e) { setSortBy(e.target.value); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900">
                <option value="pinned_recent">Pinned First</option>
                <option value="recent">Most Recent</option>
                <option value="closing">Closing Soon</option>
              </select>
            </div>
            {hasFilters && (
              <button onClick={function() { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
                className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors whitespace-nowrap"
                aria-label="Clear all filters">
                <Icon path={ICONS.x} className="h-3.5 w-3.5" />Clear
              </button>
            )}
          </div>
        </div>

        {/* Poll list or empty state */}
        {filteredPolls.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white border-slate-200">
            <div className="flex justify-center mb-4">
              <Icon path={ICONS.chart} className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-[#0E1523]">
              {hasFilters ? 'No polls match your filters' : 'No polls yet'}
            </h3>
            <p className="text-sm mb-6 text-[#475569]">
              {hasFilters ? 'Try adjusting your search or filters.'
                : isAdmin ? 'Create your first poll to gather member feedback.'
                : 'Check back later for polls from your organization.'}
            </p>
            {isAdmin && !hasFilters && (
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm">
                <Icon path={ICONS.plus} className="h-4 w-4" />Create Poll
              </button>
            )}
            {hasFilters && (
              <button onClick={function() { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm">
                <Icon path={ICONS.x} className="h-4 w-4" />Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list" aria-label="Polls">
            {filteredPolls.map(function(poll) {
              return (
                <div key={poll.id} role="listitem">
                  <PollCard
                    poll={poll}
                    onVote={function() {}}
                    onDelete={handlePollDelete}
                    onPollUpdated={handlePollUpdated}
                    onDuplicate={handleDuplicate}
                    onEdit={openEdit}
                    isAdmin={isAdmin}
                    showOrganization={false}
                    memberCount={memberCount}
                  />
                </div>
              );
            })}
          </div>
        )}

        {filteredPolls.length > 0 && (
          <p className="text-center text-xs text-[#64748B]">
            {'Showing ' + filteredPolls.length + ' of ' + polls.length + ' poll' + (polls.length !== 1 ? 's' : '')}
          </p>
        )}

      </div>

      <CreatePoll
        isOpen={showCreateModal}
        onClose={closeModal}
        onSuccess={editingPoll ? handlePollUpdated : handlePollCreated}
        editPoll={editingPoll}
        organizationId={organizationId}
        organizationName={orgName}
      />
    </div>
  );
}

export default PollsList;