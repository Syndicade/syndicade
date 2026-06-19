import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import PollCard from '../components/PollCard';
import CreatePoll from '../components/CreatePoll';
import TemplatePickerModal, { PLATFORM_TEMPLATES } from '../components/TemplatePickerModal';
import PageHeader from '../components/PageHeader';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

// Trimmed to icons still in use — search input icon + stat card icons.
// (Plus/Template/Download/X/Chart/Alert were only used on button labels, now removed per UX/UI Standards §1.)
var ICONS = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  check:  'M5 13l4 4L19 7',
  lock:   'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  pin:    ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
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

var POLL_TEMPLATES = (PLATFORM_TEMPLATES['poll'] || []);

function PollsList() {
  var params = useParams();
  var organizationId = params.organizationId;
  var outletCtx = useOutletContext() || {};
  var isAdmin = outletCtx.isAdmin;

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
  // templateData is separate from editingPoll — keeps CreatePoll in create mode
  // while still pre-filling form fields and questions from the template
  var [templateData, setTemplateData] = useState(null);
  var [showTemplatePicker, setShowTemplatePicker] = useState(false);
  var [orgName, setOrgName] = useState('');
  var [memberCount, setMemberCount] = useState(0);
  var [exporting, setExporting] = useState(false);
  var [selectedIds, setSelectedIds] = useState(new Set());

  var currentUserRef = useRef(null);

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  useEffect(function() {
    applyFiltersAndSort();
  }, [polls, searchTerm, statusFilter, typeFilter, sortBy]);

  useEffect(function() {
    setSelectedIds(new Set());
  }, [searchTerm, statusFilter, typeFilter, sortBy]);

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
      var authRes = await supabase.auth.getUser();
      currentUserRef.current = authRes.data.user;

      var orgResult = await supabase.from('organizations').select('name').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrgName(orgResult.data.name);

      var countResult = await supabase
        .from('memberships').select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId).eq('status', 'active');
      setMemberCount(countResult.count || 0);

      var pollsResult = await supabase.from('polls')
        .select('*, last_reminded_at')
        .eq('organization_id', organizationId)
        .eq('is_template', false)
        .order('created_at', { ascending: false });
      if (pollsResult.error) throw pollsResult.error;
      setPolls(pollsResult.data || []);
    } catch (err) {
      console.error('Error loading polls:', err);
      setError(err.message);
      mascotErrorToast('Failed to load polls.', 'Please try again.');
    } finally { setLoading(false); }
  }

  function toggleSelect(pollId) {
    setSelectedIds(function(prev) {
      var next = new Set(prev);
      if (next.has(pollId)) { next.delete(pollId); } else { next.add(pollId); }
      return next;
    });
  }

  function toggleSelectAll() {
    var allIds = filteredPolls.map(function(p) { return p.id; });
    var allSelected = allIds.every(function(id) { return selectedIds.has(id); });
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  }

  var allFilteredSelected = filteredPolls.length > 0 && filteredPolls.every(function(p) { return selectedIds.has(p.id); });
  var someFilteredSelected = filteredPolls.some(function(p) { return selectedIds.has(p.id); });
  var selectedCount = filteredPolls.filter(function(p) { return selectedIds.has(p.id); }).length;

  async function handleExport() {
    var pollsToExport = selectedCount > 0
      ? filteredPolls.filter(function(p) { return selectedIds.has(p.id); })
      : filteredPolls;
    if (exporting || pollsToExport.length === 0) return;
    setExporting(true);
    var loadId = toast.loading('Preparing export...');
    try {
      var pollIds = pollsToExport.map(function(p) { return p.id; });
      var optsResult = await supabase.from('poll_options').select('id, poll_id, option_text, display_order').in('poll_id', pollIds).order('display_order');
      if (optsResult.error) throw optsResult.error;
      var votesResult = await supabase.from('poll_votes').select('poll_id, option_id').in('poll_id', pollIds);
      if (votesResult.error) throw votesResult.error;
      var optsByPoll = {};
      (optsResult.data || []).forEach(function(o) { if (!optsByPoll[o.poll_id]) optsByPoll[o.poll_id] = []; optsByPoll[o.poll_id].push(o); });
      var votesByPoll = {};
      (votesResult.data || []).forEach(function(v) { if (!votesByPoll[v.poll_id]) votesByPoll[v.poll_id] = []; votesByPoll[v.poll_id].push(v); });
      var rows = [['Poll', 'Status', 'Option', 'Votes', 'Percentage', 'Total Votes']];
      pollsToExport.forEach(function(poll) {
        var pollOpts = optsByPoll[poll.id] || [];
        var pollVotes = votesByPoll[poll.id] || [];
        var total = pollVotes.length;
        var isClosed = poll.status === 'closed' || (poll.closes_at && new Date(poll.closes_at) < new Date());
        var statusLabel = isClosed ? 'Closed' : 'Active';
        var counts = {};
        pollVotes.forEach(function(v) { counts[v.option_id] = (counts[v.option_id] || 0) + 1; });
        if (pollOpts.length === 0) {
          rows.push([poll.title, statusLabel, '(no options)', 0, '0%', total]);
        } else {
          pollOpts.forEach(function(opt, idx) {
            var c = counts[opt.id] || 0;
            var pct = total > 0 ? Math.round((c / total) * 100) : 0;
            rows.push([idx === 0 ? poll.title : '', idx === 0 ? statusLabel : '', opt.option_text, c, pct + '%', idx === 0 ? total : '']);
          });
        }
        rows.push(['', '', '', '', '', '']);
      });
      var csv = rows.map(function(row) { return row.map(function(cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'polls_export_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.dismiss(loadId);
      mascotSuccessToast(pollsToExport.length + ' poll' + (pollsToExport.length !== 1 ? 's' : '') + ' exported!');
      setSelectedIds(new Set());
    } catch (err) {
      toast.dismiss(loadId);
      mascotErrorToast('Export failed.', err.message);
    } finally { setExporting(false); }
  }

  function handlePollDelete(pollId) {
    setPolls(function(prev) { return prev.filter(function(p) { return p.id !== pollId; }); });
    setSelectedIds(function(prev) { var next = new Set(prev); next.delete(pollId); return next; });
  }

  async function handlePollCreated(newPoll) {
    setPolls(function(prev) { return [newPoll].concat(prev); });
    setTemplateData(null);
    try {
      var notifModule = await import('../lib/notificationService');
      var user = currentUserRef.current;
      await notifModule.notifyOrganizationMembers({
        organizationId: organizationId,
        type: 'new_poll',
        title: newPoll.title || 'New Poll',
        message: orgName + ' posted a new poll. Cast your vote!',
        link: '/organizations/' + organizationId + '/polls',
        excludeUserId: user ? user.id : null,
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch(ne){ console.error('Poll notification failed:', ne); }
  }

  function handlePollUpdated(updatedPoll) {
    setPolls(function(prev) {
      return prev.map(function(p) { return p.id === updatedPoll.id ? updatedPoll : p; });
    });
  }

  function handleDuplicate(newPoll) {
    setPolls(function(prev) { return [newPoll].concat(prev); });
  }

  function handleRemind(pollId, timestamp) {
    setPolls(function(prev) {
      return prev.map(function(p) { return p.id === pollId ? Object.assign({}, p, { last_reminded_at: timestamp }) : p; });
    });
  }

  function openCreate() {
    setEditingPoll(null);
    setTemplateData(null);
    setShowCreateModal(true);
  }

  function openEdit(poll) {
    setEditingPoll(poll);
    setTemplateData(null);
    setShowCreateModal(true);
  }

  function closeModal() {
    setShowCreateModal(false);
    setEditingPoll(null);
    setTemplateData(null);
  }

  // Template from TemplatePickerModal — editPoll stays null (create mode)
  // templateData carries the pre-fill payload including _questions
  function handleTemplateSelect(template, name) {
    setShowTemplatePicker(false);
    setEditingPoll(null);
    setTemplateData(Object.assign({}, template, { _templateName: name }));
    setShowCreateModal(true);
  }

  // Template from empty state cards — same pattern
  function handleEmptyStateTemplate(tmpl) {
    setEditingPoll(null);
    setTemplateData(Object.assign({}, tmpl, { _templateName: tmpl.title || tmpl.name }));
    setShowCreateModal(true);
  }

  var activeCount = polls.filter(function(p) { return !isPollClosed(p); }).length;
  var closedCount = polls.filter(function(p) { return isPollClosed(p); }).length;
  var pinnedCount = polls.filter(function(p) { return p.is_pinned; }).length;
  var hasFilters  = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div style={{ padding: '20px 24px 32px' }} className="space-y-6">
          <div className="rounded-xl border p-6 animate-pulse bg-white border-slate-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-7 w-24 rounded bg-gray-200" />
                <div className="h-4 w-52 rounded bg-gray-100" />
              </div>
              <div className="h-10 w-32 rounded-lg bg-gray-200" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4"><StatSkeleton /><StatSkeleton /><StatSkeleton /></div>
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
          <img src="/mascot-error.png" alt="" aria-hidden="true" style={{maxWidth:'200px',margin:'0 auto 16px',display:'block',mixBlendMode:'multiply'}} />
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

      <PageHeader
        title="Polls"
        subtitle={polls.length + ' poll' + (polls.length !== 1 ? 's' : '')}
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && filteredPolls.length > 0 && (
              <button onClick={handleExport} disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors text-sm disabled:opacity-50"
                aria-label={selectedCount > 0 ? 'Export ' + selectedCount + ' selected polls as CSV' : 'Export all polls as CSV'}>
                {exporting
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500" aria-hidden="true" />Exporting...</>
                  : (selectedCount > 0 ? 'Export CSV (' + selectedCount + ' selected)' : 'Export CSV')
                }
              </button>
            )}
            {isAdmin && (
              <button onClick={function() { setShowTemplatePicker(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors text-sm"
                aria-label="Browse poll templates">
                Templates
              </button>
            )}
            {isAdmin && (
              <button onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm">
                Create Poll
              </button>
            )}
          </div>
        }
      />

      <div style={{ padding: '20px 24px 32px' }} className="space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-5 border bg-[#DCFCE7] border-green-200">
            <p className="text-2xl font-extrabold text-green-700">{activeCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.check} className="h-4 w-4 text-green-500" />
              <p className="text-sm font-semibold text-green-600">Active</p>
            </div>
          </div>
          <div className="rounded-xl p-5 border bg-[#F1F5F9] border-slate-200">
            <p className="text-2xl font-extrabold text-slate-600">{closedCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.lock} className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-500">Closed</p>
            </div>
          </div>
          <div className="rounded-xl p-5 border bg-[#FEF9C3] border-yellow-200">
            <p className="text-2xl font-extrabold text-yellow-700">{pinnedCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.pin} className="h-4 w-4 text-yellow-500" />
              <p className="text-sm font-semibold text-yellow-600">Pinned</p>
            </div>
          </div>
        </div>

        {/* Filter bar — flush with page background, bordered chips for Status, counts in parens */}
        {polls.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {isAdmin && filteredPolls.length > 0 && (
              <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                <input id="select-all-polls" type="checkbox" checked={allFilteredSelected}
                  ref={function(el) { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label={allFilteredSelected ? 'Deselect all polls' : 'Select all polls'} />
                <label htmlFor="select-all-polls" className="text-xs font-semibold text-[#475569] cursor-pointer whitespace-nowrap">
                  {selectedCount > 0 ? selectedCount + ' selected' : 'Select all'}
                </label>
              </div>
            )}

            <div className="relative flex-1" style={{ minWidth: '180px' }}>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon path={ICONS.search} className="h-4 w-4 text-gray-400" />
              </div>
              <label htmlFor="search-polls" className="sr-only">Search polls</label>
              <input id="search-polls" type="text" placeholder="Search polls..." value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                className="w-full pl-9 pr-4 py-2 border-[0.5px] border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400" />
            </div>

            <div style={{ display: 'flex', gap: '6px' }} role="group" aria-label="Filter by status">
              {[
                { value: 'all',    label: 'All',    count: polls.length },
                { value: 'active', label: 'Active', count: activeCount },
                { value: 'closed', label: 'Closed', count: closedCount },
              ].map(function(opt) {
                var active = statusFilter === opt.value;
                return (
                  <button key={opt.value} onClick={function() { setStatusFilter(opt.value); }}
                    style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, border: '1px solid ' + (active ? '#3B82F6' : '#E2E8F0'), background: active ? '#EFF6FF' : '#FFFFFF', color: active ? '#3B82F6' : '#64748B', cursor: 'pointer' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>
                    {opt.label + (opt.count > 0 ? ' (' + opt.count + ')' : '')}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="type-filter" className="text-xs font-bold uppercase tracking-wide whitespace-nowrap text-[#F5B731]">Type:</label>
              <select id="type-filter" value={typeFilter} onChange={function(e) { setTypeFilter(e.target.value); }}
                className="px-3 py-2 border-[0.5px] border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900">
                <option value="all">All Types</option>
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="yes_no_abstain">Yes / No / Abstain</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-polls" className="text-xs font-bold uppercase tracking-wide whitespace-nowrap text-[#F5B731]">Sort:</label>
              <select id="sort-polls" value={sortBy} onChange={function(e) { setSortBy(e.target.value); }}
                className="px-3 py-2 border-[0.5px] border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900">
                <option value="pinned_recent">Pinned First</option>
                <option value="recent">Most Recent</option>
                <option value="closing">Closing Soon</option>
              </select>
            </div>

            {hasFilters && (
              <button onClick={function() { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
                className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors whitespace-nowrap"
                aria-label="Clear all filters">
                Clear
              </button>
            )}
          </div>
        )}

        {/* Poll list or empty state */}
        {polls.length === 0 ? (
          <div className="rounded-xl border bg-white border-slate-200 py-12 px-6 text-center">
            <img src="/mascots-empty.png" alt="" aria-hidden="true"
              style={{maxWidth:'200px',margin:'0 auto 16px',display:'block',mixBlendMode:'multiply'}} />
            <h3 className="text-lg font-bold mb-2 text-[#0E1523]">No polls yet</h3>
            <p className="text-sm mb-6 text-[#475569] max-w-xs mx-auto">
              {isAdmin
                ? 'Create your first poll to gather member feedback and make decisions together.'
                : 'Check back soon for polls from your organization.'}
            </p>
            {isAdmin && (
              <div className="flex items-center justify-center gap-3 mb-10">
                <button onClick={openCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm">
                  Create Poll
                </button>
                <button onClick={function() { setShowTemplatePicker(true); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors text-sm">
                  Browse Templates
                </button>
              </div>
            )}
            {isAdmin && POLL_TEMPLATES.length > 0 && (
              <div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',letterSpacing:'4px',textTransform:'uppercase',marginBottom:'12px'}}>
                  Start from a template
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                  {POLL_TEMPLATES.map(function(tmpl) {
                    return (
                      <div key={tmpl._id || tmpl.title} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 flex flex-col gap-2">
                        <p className="text-sm font-semibold text-[#0E1523]">{tmpl.title}</p>
                        <p className="text-xs text-[#64748B] flex-1">{tmpl._desc}</p>
                        <button onClick={function() { handleEmptyStateTemplate(tmpl); }}
                          className="mt-1 text-xs font-semibold text-blue-500 hover:text-blue-700 text-left focus:outline-none focus:underline transition-colors"
                          aria-label={'Use template: ' + tmpl.title}>
                          Use this template
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="rounded-xl border bg-white border-slate-200 py-12 px-6 text-center">
            <img src="/mascots-empty.png" alt="" aria-hidden="true"
              style={{maxWidth:'180px',margin:'0 auto 16px',display:'block',mixBlendMode:'multiply'}} />
            <h3 className="text-lg font-bold mb-2 text-[#0E1523]">No polls match your filters</h3>
            <p className="text-sm mb-6 text-[#475569]">Try adjusting your search or clearing the filters.</p>
            <button onClick={function() { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors text-sm">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list" aria-label="Polls">
            {filteredPolls.map(function(poll) {
              var isSelected = selectedIds.has(poll.id);
              return (
                <div key={poll.id} role="listitem">
                  {isAdmin && (
                    <div className={'flex items-center gap-2 px-3 py-1.5 rounded-t-xl border-x border-t transition-colors ' + (isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200')}>
                      <input id={'select-poll-' + poll.id} type="checkbox" checked={isSelected}
                        onChange={function() { toggleSelect(poll.id); }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        aria-label={'Select poll: ' + poll.title} />
                      <label htmlFor={'select-poll-' + poll.id} className={'text-xs font-semibold cursor-pointer ' + (isSelected ? 'text-blue-600' : 'text-[#64748B]')}>
                        {isSelected ? 'Selected' : 'Select for export'}
                      </label>
                    </div>
                  )}
                  <div className={isAdmin ? 'rounded-b-xl overflow-hidden' + (isSelected ? ' ring-2 ring-blue-300' : '') : ''}>
                    <PollCard
                      poll={poll}
                      onVote={function() {}}
                      onDelete={handlePollDelete}
                      onPollUpdated={handlePollUpdated}
                      onDuplicate={handleDuplicate}
                      onEdit={openEdit}
                      onRemind={handleRemind}
                      isAdmin={isAdmin}
                      showOrganization={false}
                      memberCount={memberCount}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredPolls.length > 0 && (
          <p className="text-center text-xs text-[#64748B]" aria-live="polite">
            {'Showing ' + filteredPolls.length + ' of ' + polls.length + ' poll' + (polls.length !== 1 ? 's' : '')}
            {selectedCount > 0 && ' \u00b7 ' + selectedCount + ' selected'}
          </p>
        )}
      </div>

      {/* Create / Edit modal */}
      <CreatePoll
        isOpen={showCreateModal}
        onClose={closeModal}
        onSuccess={editingPoll ? handlePollUpdated : handlePollCreated}
        editPoll={editingPoll}
        templateData={templateData}
        organizationId={organizationId}
        organizationName={orgName}
      />

      {/* Template picker */}
      {showTemplatePicker && (
        <TemplatePickerModal
          contentType="poll"
          organizationId={organizationId}
          onClose={function() { setShowTemplatePicker(false); }}
          onSelect={handleTemplateSelect}
        />
      )}
    </div>
  );
}

export default PollsList;