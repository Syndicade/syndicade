import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
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
  chart:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  plus:    'M12 4v16m8-8H4',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  check:   'M5 13l4 4L19 7',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  x:       'M6 18L18 6M6 6l12 12',
  alert:   ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
function StatSkeleton({ isDark }) {
  return (
    <div className={'rounded-xl p-5 animate-pulse border ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-100 border-gray-200')}>
      <div className={'h-7 w-10 rounded mb-2 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-300')} />
      <div className={'h-4 w-24 rounded ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-200')} />
    </div>
  );
}

function PollCardSkeleton({ isDark }) {
  return (
    <div className={'rounded-xl p-5 animate-pulse border ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')}>
      <div className="flex items-center justify-between mb-3">
        <div className={'h-5 w-2/3 rounded ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
        <div className={'h-5 w-16 rounded-full ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
      </div>
      <div className={'h-4 w-1/2 rounded mb-4 ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
      <div className="space-y-2">
        {[1,2,3].map(function(i) {
          return <div key={i} className={'h-8 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />;
        })}
      </div>
    </div>
  );
}

function PollsList() {
  var params = useParams();
  var organizationId = params.organizationId;
  var themeCtx = useTheme();
  var isDark = themeCtx.isDark;

  var [polls, setPolls] = useState([]);
  var [filteredPolls, setFilteredPolls] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [statusFilter, setStatusFilter] = useState('all');
  var [typeFilter, setTypeFilter] = useState('all');
  var [isAdmin, setIsAdmin] = useState(false);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [orgName, setOrgName] = useState('');

  useEffect(function() {
    if (organizationId) loadData();
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

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) throw new Error('Not authenticated');
      var user = authResult.data.user;

      var orgResult = await supabase.from('organizations').select('name').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrgName(orgResult.data.name);

      var memberResult = await supabase
        .from('memberships').select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .single();
      setIsAdmin(memberResult.data && memberResult.data.role === 'admin');

      var pollsResult = await supabase
        .from('polls')
        .select('*')
        .eq('organization_id', organizationId)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });
      if (pollsResult.error) throw pollsResult.error;

      var now = new Date();
      var updated = (pollsResult.data || []).map(function(poll) {
        if (poll.closing_date && new Date(poll.closing_date) < now && poll.status === 'active') {
          return Object.assign({}, poll, { status: 'closed' });
        }
        return poll;
      });

      setPolls(updated);
      setFilteredPolls(updated);
    } catch (err) {
      console.error('Error loading polls:', err);
      setError(err.message);
      mascotErrorToast('Failed to load polls.', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handlePollDelete(pollId) {
    setPolls(function(prev) { return prev.filter(function(p) { return p.id !== pollId; }); });
    mascotSuccessToast('Poll deleted.');
  }

  function handlePollCreated(newPoll) {
    setPolls(function(prev) { return [newPoll].concat(prev); });
  }

  var activeCount = polls.filter(function(p) { return p.status === 'active'; }).length;
  var closedCount = polls.filter(function(p) { return p.status === 'closed'; }).length;
  var hasFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

  // ── Theme shorthands ──────────────────────────────────────────────────────────
  var pageBg    = isDark ? 'bg-[#0E1523]'  : 'bg-gray-50';
  var cardBg    = isDark ? 'bg-[#1A2035]'  : 'bg-white';
  var border    = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var textPri   = isDark ? 'text-white'    : 'text-gray-900';
  var textSec   = isDark ? 'text-[#CBD5E1]' : 'text-[#475569]';
  var textMuted = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  var inputBg   = isDark ? 'bg-[#1E2845] border-[#2A3550] text-white placeholder-[#64748B]' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  var selectBg  = isDark ? 'bg-[#1E2845] border-[#2A3550] text-white' : 'bg-white border-gray-300 text-gray-900';

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={'min-h-screen ' + pageBg}>
        <div className="px-6 py-6 space-y-6">
          <div className={'rounded-xl border p-6 animate-pulse ' + cardBg + ' ' + border}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className={'h-7 w-24 rounded ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
                <div className={'h-4 w-52 rounded ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
              </div>
              <div className={'h-10 w-32 rounded-lg ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatSkeleton isDark={isDark} />
            <StatSkeleton isDark={isDark} />
          </div>
          <div className={'rounded-xl border p-4 animate-pulse ' + cardBg + ' ' + border}>
            <div className={'h-10 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
          </div>
          <div className="space-y-4">
            {[1,2,3].map(function(i) { return <PollCardSkeleton key={i} isDark={isDark} />; })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={'min-h-screen flex items-center justify-center p-6 ' + pageBg}>
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Icon path={ICONS.alert} className={'h-14 w-14 ' + (isDark ? 'text-red-400' : 'text-red-300')} />
          </div>
          <h2 className={'text-xl font-bold mb-2 ' + textPri}>Failed to Load Polls</h2>
          <p className={'text-sm mb-6 ' + textSec}>{error}</p>
          <button
            onClick={function() { setError(null); setLoading(true); loadData(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen ' + pageBg}>
      <div className="px-6 py-6 space-y-6">

        {/* Page header */}
        <div className={'rounded-xl border p-5 ' + cardBg + ' ' + border}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={'p-2 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-blue-50')}>
                <Icon path={ICONS.chart} className={'h-6 w-6 ' + (isDark ? 'text-blue-400' : 'text-blue-500')} />
              </div>
              <div>
                <h1 className={'text-xl font-bold ' + textPri}>Polls</h1>
                <p className={'text-sm ' + textMuted}>Create and manage organization polls</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Create poll button (admin only) */}
              {isAdmin && (
                <button
                  onClick={function() { setShowCreateModal(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  <Icon path={ICONS.plus} className="h-4 w-4" />
                  Create Poll
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={'rounded-xl p-5 border-2 ' + (activeCount > 0
            ? (isDark ? 'bg-[#1B3A2F] border-[#22C55E]/30' : 'bg-green-50 border-green-200')
            : (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-50 border-gray-200'))}>
            <p className={'text-2xl font-extrabold ' + (activeCount > 0
              ? (isDark ? 'text-green-400' : 'text-green-700')
              : (isDark ? 'text-[#CBD5E1]' : 'text-gray-500'))}>{activeCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.check} className={'h-4 w-4 ' + (activeCount > 0
                ? (isDark ? 'text-green-400' : 'text-green-500')
                : (isDark ? 'text-[#64748B]' : 'text-gray-400'))} />
              <p className={'text-sm font-semibold ' + (activeCount > 0
                ? (isDark ? 'text-green-400' : 'text-green-600')
                : (isDark ? 'text-[#94A3B8]' : 'text-gray-500'))}>Active Polls</p>
            </div>
          </div>
          <div className={'rounded-xl p-5 border-2 ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-600')}>{closedCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.lock} className={'h-4 w-4 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>Closed Polls</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={'rounded-xl border p-4 ' + cardBg + ' ' + border}>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">

            {/* Search */}
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon path={ICONS.search} className={'h-4 w-4 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')} />
              </div>
              <label htmlFor="search-polls" className="sr-only">Search polls</label>
              <input
                id="search-polls"
                type="text"
                placeholder="Search polls..."
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                className={'w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ' + inputBg}
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className={'text-xs font-bold uppercase tracking-wide whitespace-nowrap ' + (isDark ? 'text-[#F5B731]' : 'text-gray-500')}>Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={function(e) { setStatusFilter(e.target.value); }}
                className={'px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ' + selectBg}
              >
                <option value="all">{'All (' + polls.length + ')'}</option>
                <option value="active">{'Active (' + activeCount + ')'}</option>
                <option value="closed">{'Closed (' + closedCount + ')'}</option>
              </select>
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="type-filter" className={'text-xs font-bold uppercase tracking-wide whitespace-nowrap ' + (isDark ? 'text-[#F5B731]' : 'text-gray-500')}>Type:</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={function(e) { setTypeFilter(e.target.value); }}
                className={'px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ' + selectBg}
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
                className={'flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors whitespace-nowrap ' + (isDark ? 'border-[#2A3550] text-[#94A3B8] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10' : 'border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50')}
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
          <div className={'text-center py-16 rounded-xl border ' + cardBg + ' ' + border}>
            <div className="flex justify-center mb-4">
              <Icon path={ICONS.chart} className={'h-12 w-12 ' + (isDark ? 'text-[#2A3550]' : 'text-gray-300')} />
            </div>
            <h3 className={'text-lg font-semibold mb-1 ' + textPri}>
              {hasFilters ? 'No polls match your filters' : 'No polls yet'}
            </h3>
            <p className={'text-sm mb-6 ' + textSec}>
              {hasFilters
                ? 'Try adjusting your search or filters.'
                : isAdmin
                ? 'Create your first poll to gather member feedback.'
                : 'Check back later for polls from your organization.'}
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
                className={'inline-flex items-center gap-2 px-5 py-2.5 border font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm ' + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845]' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}
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
                    isDark={isDark}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {filteredPolls.length > 0 && (
          <p className={'text-center text-xs ' + textMuted}>
            {'Showing ' + filteredPolls.length + ' of ' + polls.length + ' poll' + (polls.length !== 1 ? 's' : '')}
          </p>
        )}

      </div>

      {/* Create Poll Modal */}
      <CreatePoll
        isOpen={showCreateModal}
        onClose={function() { setShowCreateModal(false); }}
        onSuccess={handlePollCreated}
        organizationId={organizationId}
        organizationName={orgName}
      />
    </div>
  );
}

export default PollsList;