import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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
  check:    'M5 13l4 4L19 7',
  lock:     'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  unlock:   'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
  trash:    ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  chart:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:    ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
  pin:      ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
  pinOff:   ['M6.75 4.5h10.5M12 4.5V9m0 0l3 3m-3-3l-3 3M4.5 19.5l15-15'],
  copy:     ['M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'],
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  eye:      ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  eyeOff:   ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  pieChart: ['M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z', 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'],
  barChart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  repeat:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  alert:    ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

var CHART_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16'];

var POLL_TYPE_LABELS = {
  single_choice:   'Single Choice',
  multiple_choice: 'Multiple Choice',
  yes_no_abstain:  'Yes / No / Abstain',
};

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ options, results, totalVotes }) {
  var CX = 60; var CY = 60; var R = 45; var IR = 28;
  var segments = [];
  var angle = -90;

  options.forEach(function(opt, i) {
    var result = results.find(function(r) { return r.option_id === opt.id; });
    var pct = result ? Number(result.percentage) : 0;
    if (pct <= 0) return;
    var sweep = (pct / 100) * 360;
    var s = angle * Math.PI / 180;
    var e = (angle + sweep) * Math.PI / 180;
    var large = sweep > 180 ? 1 : 0;
    var d = [
      'M', CX + R * Math.cos(s), CY + R * Math.sin(s),
      'A', R, R, 0, large, 1, CX + R * Math.cos(e), CY + R * Math.sin(e),
      'L', CX + IR * Math.cos(e), CY + IR * Math.sin(e),
      'A', IR, IR, 0, large, 0, CX + IR * Math.cos(s), CY + IR * Math.sin(s),
      'Z',
    ].join(' ');
    segments.push({ d: d, color: CHART_COLORS[i % CHART_COLORS.length], label: opt.option_text, pct: pct });
    angle += sweep;
  });

  return (
    <div className="flex items-center gap-6 py-2">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true" className="flex-shrink-0">
        {segments.length > 0
          ? segments.map(function(s, i) { return <path key={i} d={s.d} fill={s.color} />; })
          : <circle cx={CX} cy={CY} r={R} fill="#E2E8F0" />}
        <circle cx={CX} cy={CY} r={IR} fill="white" />
        <text x={CX} y={CY - 3} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0E1523">{totalVotes}</text>
        <text x={CX} y={CY + 11} textAnchor="middle" fontSize="9" fill="#64748B">votes</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {options.map(function(opt, i) {
          var result = results.find(function(r) { return r.option_id === opt.id; });
          var pct = result ? Number(result.percentage) : 0;
          var count = result ? Number(result.vote_count) : 0;
          return (
            <div key={opt.id} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
              <span className="text-[#475569] flex-1 truncate">{opt.option_text}</span>
              <span className="text-[#64748B] font-semibold tabular-nums">{count} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PollCard ──────────────────────────────────────────────────────────────────
function PollCard({ poll, onVote, onDelete, onPollUpdated, onDuplicate, isAdmin, showOrganization, memberCount }) {
  var [options, setOptions] = useState([]);
  var [userVotes, setUserVotes] = useState([]);
  var [results, setResults] = useState([]);
  var [loading, setLoading] = useState(true);
  var [voting, setVoting] = useState(false);
  var [hasVoted, setHasVoted] = useState(false);
  var [selectedOptions, setSelectedOptions] = useState([]);
  var [confirmDelete, setConfirmDelete] = useState(false);
  var [deleting, setDeleting] = useState(false);
  var [duplicating, setDuplicating] = useState(false);
  var [chartMode, setChartMode] = useState('bar'); // 'bar' | 'pie'

  var isExpired = poll.closes_at && new Date(poll.closes_at) < new Date();
  var isClosed = poll.status === 'closed' || isExpired;

  // Can this user see results at all?
  var canSeeResults = isAdmin || isClosed ||
    (poll.show_results_before_close && hasVoted);

  // What visibility level applies (admin always gets full)
  var effectiveVisibility = isAdmin ? 'full' : (poll.result_visibility || 'full');

  var canVote = !isClosed && (!hasVoted || poll.allow_vote_changes);
  var totalVotes = results.reduce(function(sum, r) { return sum + Number(r.vote_count); }, 0);

  useEffect(function() { loadPollData(); }, [poll.id]);

  async function loadPollData() {
    setLoading(true);
    try {
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;

      // Load options
      var optResult = await supabase
        .from('poll_options').select('*')
        .eq('poll_id', poll.id).order('display_order');
      if (optResult.error) throw optResult.error;
      var loadedOptions = optResult.data || [];
      setOptions(loadedOptions);

      if (!user) { setLoading(false); return; }

      // Load user's votes
      var uvResult = await supabase
        .from('poll_votes').select('option_id')
        .eq('poll_id', poll.id).eq('member_id', user.id);
      if (uvResult.error) throw uvResult.error;
      var uvData = uvResult.data || [];
      setUserVotes(uvData);
      var voted = uvData.length > 0;
      setHasVoted(voted);

      // Load all votes for results (if user can see them)
      var shouldLoad = isAdmin || isClosed ||
        (poll.show_results_before_close && voted);
      if (shouldLoad) {
        var allVotes = await supabase
          .from('poll_votes').select('option_id')
          .eq('poll_id', poll.id);
        if (allVotes.error) throw allVotes.error;
        var votes = allVotes.data || [];
        var total = votes.length;
        var counts = {};
        votes.forEach(function(v) { counts[v.option_id] = (counts[v.option_id] || 0) + 1; });
        var computed = loadedOptions.map(function(opt) {
          var c = counts[opt.id] || 0;
          return { option_id: opt.id, vote_count: c, percentage: total > 0 ? Math.round((c / total) * 100) : 0 };
        });
        setResults(computed);
      }
    } catch (err) {
      console.error('Error loading poll:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(optionId) {
    if (poll.poll_type === 'single_choice' || poll.poll_type === 'yes_no_abstain') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions(function(prev) {
        return prev.includes(optionId)
          ? prev.filter(function(id) { return id !== optionId; })
          : prev.concat([optionId]);
      });
    }
  }

  async function handleSubmitVote() {
    if (selectedOptions.length === 0 || voting) return;
    if (hasVoted && !poll.allow_vote_changes) {
      toast.error('You cannot change your vote on this poll.');
      return;
    }
    setVoting(true);
    var loadingToast = toast.loading('Submitting vote...');
    try {
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;
      if (!user) throw new Error('You must be logged in to vote.');

      if (hasVoted && poll.allow_vote_changes) {
        var del = await supabase.from('poll_votes').delete().eq('poll_id', poll.id).eq('member_id', user.id);
        if (del.error) throw del.error;
      }

      var inserts = selectedOptions.map(function(optId) {
        return { poll_id: poll.id, option_id: optId, member_id: user.id, is_anonymous: poll.allow_anonymous };
      });
      var ins = await supabase.from('poll_votes').insert(inserts);
      if (ins.error) throw ins.error;

      toast.dismiss(loadingToast);
      mascotSuccessToast(hasVoted ? 'Vote updated!' : 'Vote submitted!');
      setSelectedOptions([]);
      await loadPollData();
      if (onVote) onVote(poll.id);
    } catch (err) {
      toast.dismiss(loadingToast);
      mascotErrorToast('Failed to submit vote.', err.message);
    } finally {
      setVoting(false);
    }
  }

  async function handlePin() {
    try {
      var next = !poll.is_pinned;
      var r = await supabase.from('polls').update({ is_pinned: next }).eq('id', poll.id);
      if (r.error) throw r.error;
      mascotSuccessToast(next ? 'Poll pinned.' : 'Poll unpinned.');
      if (onPollUpdated) onPollUpdated(Object.assign({}, poll, { is_pinned: next }));
    } catch (err) {
      mascotErrorToast('Failed to update poll.');
    }
  }

  async function handleToggleStatus() {
    try {
      var next = isClosed ? 'active' : 'closed';
      var r = await supabase.from('polls').update({ status: next }).eq('id', poll.id);
      if (r.error) throw r.error;
      mascotSuccessToast(next === 'closed' ? 'Poll closed.' : 'Poll reopened.');
      if (onPollUpdated) onPollUpdated(Object.assign({}, poll, { status: next }));
      await loadPollData();
    } catch (err) {
      mascotErrorToast('Failed to update poll status.');
    }
  }

  async function handleDuplicate() {
    if (duplicating) return;
    setDuplicating(true);
    try {
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;

      var newPoll = await supabase.from('polls').insert({
        organization_id: poll.organization_id,
        title: poll.title + ' (Copy)',
        description: poll.description,
        poll_type: poll.poll_type,
        visibility: poll.visibility,
        allow_anonymous: poll.allow_anonymous,
        show_results_before_close: poll.show_results_before_close,
        allow_vote_changes: poll.allow_vote_changes,
        closes_at: null,
        retention_days: poll.retention_days,
        result_visibility: poll.result_visibility || 'full',
        status: 'active',
        is_pinned: false,
        created_by: user.id,
        approval_status: 'approved',
      }).select().single();
      if (newPoll.error) throw newPoll.error;

      var optInserts = options.map(function(opt, i) {
        return { poll_id: newPoll.data.id, option_text: opt.option_text, display_order: i };
      });
      var optsR = await supabase.from('poll_options').insert(optInserts);
      if (optsR.error) throw optsR.error;

      mascotSuccessToast('Poll duplicated!', poll.title + ' (Copy) created.');
      if (onDuplicate) onDuplicate(newPoll.data);
    } catch (err) {
      mascotErrorToast('Failed to duplicate poll.', err.message);
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDelete() {
    if (!isAdmin || deleting) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      var r = await supabase.from('polls').delete().eq('id', poll.id);
      if (r.error) throw r.error;
      if (onDelete) onDelete(poll.id);
    } catch (err) {
      mascotErrorToast('Failed to delete poll.', 'Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function handleExportCSV() {
    var rows = [['Option', 'Votes', 'Percentage']];
    options.forEach(function(opt) {
      var result = results.find(function(r) { return r.option_id === opt.id; });
      rows.push([opt.option_text, result ? result.vote_count : 0, (result ? result.percentage : 0) + '%']);
    });
    rows.push(['TOTAL', totalVotes, '100%']);
    var csv = rows.map(function(row) {
      return row.map(function(cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = poll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Leading option for summary visibility
  var leadingOption = results.length > 0
    ? results.reduce(function(best, r) { return Number(r.vote_count) > Number(best.vote_count) ? r : best; }, results[0])
    : null;
  var leadingOptionText = leadingOption
    ? (options.find(function(o) { return o.id === leadingOption.option_id; }) || {}).option_text
    : null;

  // Response rate
  var responseRate = memberCount > 0 ? Math.round((totalVotes / memberCount) * 100) : null;

  if (loading) {
    return (
      <div className="rounded-xl border p-5 animate-pulse bg-white border-slate-200">
        <div className="h-5 w-2/3 rounded mb-3 bg-gray-200" />
        <div className="h-4 w-1/2 rounded mb-4 bg-gray-100" />
        {[1,2,3].map(function(i) { return <div key={i} className="h-8 rounded-lg mb-2 bg-gray-100" />; })}
      </div>
    );
  }

  return (
    <article
      className={'rounded-xl border p-5 transition-shadow hover:shadow-md bg-white ' + (poll.is_pinned ? 'border-[#F5B731] border-2' : 'border-slate-200')}
      aria-label={poll.title + ' poll'}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {poll.is_pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                <Icon path={ICONS.pin} className="h-3 w-3" />
                Pinned
              </span>
            )}
            <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isClosed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700')}>
              <Icon path={isClosed ? ICONS.lock : ICONS.check} className="h-3 w-3" />
              {isClosed ? 'Closed' : 'Active'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {POLL_TYPE_LABELS[poll.poll_type] || poll.poll_type}
            </span>
            {hasVoted && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                <Icon path={ICONS.check} className="h-3 w-3" />
                Voted
              </span>
            )}
            {poll.recurring_interval && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                <Icon path={ICONS.repeat} className="h-3 w-3" />
                Recurring
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-[#0E1523]">{poll.title}</h3>
          {poll.description && <p className="text-sm mt-1 text-[#475569]">{poll.description}</p>}
          {showOrganization && poll.organization_name && (
            <p className="text-xs mt-1 text-[#64748B]"><span className="font-semibold">From:</span> {poll.organization_name}</p>
          )}
        </div>

        {/* Admin delete controls */}
        {isAdmin && !confirmDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors flex-shrink-0"
            aria-label={'Delete poll: ' + poll.title}
          >
            <Icon path={ICONS.trash} className="h-4 w-4" />
          </button>
        )}
        {isAdmin && confirmDelete && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={function() { setConfirmDelete(false); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors">
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Admin action bar */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-slate-100">
          {/* Pin */}
          <button
            onClick={handlePin}
            className={'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ' + (poll.is_pinned ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}
            aria-label={poll.is_pinned ? 'Unpin poll' : 'Pin poll'}
          >
            <Icon path={poll.is_pinned ? ICONS.pinOff : ICONS.pin} className="h-3.5 w-3.5" />
            {poll.is_pinned ? 'Unpin' : 'Pin'}
          </button>

          {/* Close / Reopen */}
          <button
            onClick={handleToggleStatus}
            className={'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 ' + (isClosed ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            <Icon path={isClosed ? ICONS.unlock : ICONS.lock} className="h-3.5 w-3.5" />
            {isClosed ? 'Reopen' : 'Close Now'}
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            <Icon path={ICONS.copy} className="h-3.5 w-3.5" />
            {duplicating ? 'Copying...' : 'Duplicate'}
          </button>

          {/* Export CSV (only when results exist) */}
          {canSeeResults && totalVotes > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <Icon path={ICONS.download} className="h-3.5 w-3.5" />
              Export CSV
            </button>
          )}
        </div>
      )}

      {/* Results — full visibility */}
      {canSeeResults && effectiveVisibility === 'full' && (
        <div className="mb-4">
          {/* Bar / Pie toggle */}
          {totalVotes > 0 && (
            <div className="flex items-center justify-end gap-1 mb-3">
              <button
                onClick={function() { setChartMode('bar'); }}
                className={'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ' + (chartMode === 'bar' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100')}
                aria-label="Bar chart view" aria-pressed={chartMode === 'bar'}
              >
                <Icon path={ICONS.barChart} className="h-4 w-4" />
              </button>
              <button
                onClick={function() { setChartMode('pie'); }}
                className={'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ' + (chartMode === 'pie' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100')}
                aria-label="Pie chart view" aria-pressed={chartMode === 'pie'}
              >
                <Icon path={ICONS.pieChart} className="h-4 w-4" />
              </button>
            </div>
          )}

          {chartMode === 'pie' && totalVotes > 0 ? (
            <DonutChart options={options} results={results} totalVotes={totalVotes} />
          ) : (
            <div className="space-y-2">
              {options.map(function(option) {
                var result = results.find(function(r) { return r.option_id === option.id; });
                var voteCount = result ? Number(result.vote_count) : 0;
                var percentage = result ? Number(result.percentage) : 0;
                var isUserVote = userVotes.some(function(v) { return v.option_id === option.id; });
                return (
                  <div key={option.id} className="rounded-lg p-3 border bg-slate-50 border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={'text-sm font-semibold flex items-center gap-1.5 ' + (isUserVote ? 'text-purple-700' : 'text-[#0E1523]')}>
                        {isUserVote && <Icon path={ICONS.check} className="h-3.5 w-3.5" />}
                        {option.option_text}
                      </span>
                      <span className="text-xs text-[#64748B] tabular-nums">{voteCount} vote{voteCount !== 1 ? 's' : ''} &middot; {percentage}%</span>
                    </div>
                    <div className="w-full rounded-full h-2 overflow-hidden bg-gray-200">
                      <div
                        className={'h-full rounded-full transition-all ' + (isUserVote ? 'bg-purple-500' : 'bg-blue-500')}
                        style={{ width: percentage + '%' }}
                        role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}
                        aria-label={option.option_text + ': ' + percentage + '%'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Results — summary visibility */}
      {canSeeResults && effectiveVisibility === 'summary' && (
        <div className="mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-sm font-semibold text-[#0E1523] mb-1">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
          </p>
          {leadingOptionText && totalVotes > 0 && (
            <p className="text-sm text-[#475569]">
              Leading: <span className="font-semibold text-[#0E1523]">{leadingOptionText}</span>
              {' '}({leadingOption ? leadingOption.percentage : 0}%)
            </p>
          )}
          {totalVotes === 0 && <p className="text-sm text-[#64748B]">No votes yet.</p>}
        </div>
      )}

      {/* Results — none visibility (non-admin) */}
      {canSeeResults && effectiveVisibility === 'none' && !isAdmin && (
        <div className="mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
          <Icon path={ICONS.eyeOff} className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-[#64748B]">Results are not shared for this poll.</p>
        </div>
      )}

      {/* Voting interface (when not showing results or can still vote) */}
      {canVote && !canSeeResults && (
        <div className="space-y-2 mb-4">
          {options.map(function(option) {
            var isSelected = selectedOptions.includes(option.id);
            var inputType = poll.poll_type === 'multiple_choice' ? 'checkbox' : 'radio';
            var optId = 'poll-' + poll.id + '-opt-' + option.id;
            return (
              <label key={option.id} htmlFor={optId}
                className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ' + (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}>
                <input id={optId} type={inputType} name={'poll-' + poll.id} checked={isSelected}
                  onChange={function() { handleOptionSelect(option.id); }}
                  className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-[#0E1523]">{option.option_text}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Allow vote change: show options even after voting if show_results_before_close */}
      {canVote && canSeeResults && poll.allow_vote_changes && hasVoted && (
        <div className="mt-3 space-y-2 mb-4">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Change your vote</p>
          {options.map(function(option) {
            var isSelected = selectedOptions.includes(option.id);
            var optId = 'poll-change-' + poll.id + '-opt-' + option.id;
            return (
              <label key={option.id} htmlFor={optId}
                className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ' + (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}>
                <input id={optId} type="radio" name={'poll-change-' + poll.id} checked={isSelected}
                  onChange={function() { handleOptionSelect(option.id); }}
                  className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-[#0E1523]">{option.option_text}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Closed, no results visible — just show options as display */}
      {!canVote && !canSeeResults && (
        <div className="space-y-2 mb-4">
          {options.map(function(option) {
            return (
              <div key={option.id} className="p-3 border rounded-lg bg-slate-50 border-slate-200">
                <span className="text-sm text-[#475569]">{option.option_text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit vote button */}
      {canVote && selectedOptions.length > 0 && (
        <div className="mt-2 mb-4">
          <button
            onClick={handleSubmitVote} disabled={voting}
            className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {voting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />Submitting...</>
            ) : (
              <><Icon path={ICONS.chart} className="h-4 w-4" />{hasVoted ? 'Change Vote' : 'Submit Vote'}</>
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] border-t border-slate-100 pt-3 mt-2">
        <span>Created {format(new Date(poll.created_at), 'MMM d, yyyy')}</span>
        {canSeeResults && totalVotes > 0 && (
          <span className="flex items-center gap-1">
            <Icon path={ICONS.users} className="h-3 w-3" />
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            {responseRate !== null && ' (' + responseRate + '% of members)'}
          </span>
        )}
        {poll.closes_at && (
          <span className="flex items-center gap-1">
            <Icon path={ICONS.clock} className="h-3 w-3" />
            {isClosed ? 'Closed' : 'Closes'} {format(new Date(poll.closes_at), 'MMM d, yyyy h:mm a')}
          </span>
        )}
        {poll.retention_days && (
          <span className="flex items-center gap-1">
            <Icon path={ICONS.alert} className="h-3 w-3" />
            Deletes after {poll.retention_days === 365 ? '1 year' : poll.retention_days + ' days'}
          </span>
        )}
      </div>
    </article>
  );
}

export default PollCard;