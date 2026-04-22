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
  check:   'M5 13l4 4L19 7',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  pencil:  'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash:   ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  chart:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  list:    ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  alert:   ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

var POLL_TYPE_LABELS = {
  single_choice:   'Single Choice',
  multiple_choice: 'Multiple Choice',
  yes_no_abstain:  'Yes / No / Abstain',
};

function PollCard({ poll, onVote, onDelete, isAdmin, showOrganization, isDark }) {
  var [options, setOptions] = useState([]);
  var [userVotes, setUserVotes] = useState([]);
  var [results, setResults] = useState([]);
  var [loading, setLoading] = useState(true);
  var [voting, setVoting] = useState(false);
  var [deleting, setDeleting] = useState(false);
  var [hasVoted, setHasVoted] = useState(false);
  var [selectedOptions, setSelectedOptions] = useState([]);
  var [confirmDelete, setConfirmDelete] = useState(false);

  // ── Theme shorthands ────────────────────────────────────────────────────────
  var cardBg    = isDark ? 'bg-[#1A2035]'   : 'bg-white';
  var border    = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var textPri   = isDark ? 'text-white'      : 'text-gray-900';
  var textSec   = isDark ? 'text-[#CBD5E1]'  : 'text-[#475569]';
  var textMuted = isDark ? 'text-[#94A3B8]'  : 'text-[#64748B]';
  var divider   = isDark ? 'border-[#2A3550]' : 'border-gray-100';
  var optionBg  = isDark ? 'bg-[#0E1523]'   : 'bg-gray-50';
  var barBg     = isDark ? 'bg-[#2A3550]'   : 'bg-gray-200';

  useEffect(function() {
    loadPollData();
  }, [poll.id]);

  async function loadPollData() {
    setLoading(true);
    try {
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;

      var optionsResult = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll.id)
        .order('display_order');
      if (optionsResult.error) throw optionsResult.error;
      setOptions(optionsResult.data || []);

      if (!user) { setLoading(false); return; }

      var votesResult = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('member_id', user.id);
      if (votesResult.error) throw votesResult.error;

      setUserVotes(votesResult.data || []);
      setHasVoted(votesResult.data && votesResult.data.length > 0);

      if (poll.show_results_before_close || poll.status === 'closed' || (votesResult.data && votesResult.data.length > 0)) {
        await loadResults();
      }
    } catch (err) {
      console.error('Error loading poll data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadResults() {
    try {
      var resultsResult = await supabase.rpc('get_poll_results', { poll_uuid: poll.id });
      if (resultsResult.error) throw resultsResult.error;
      setResults(resultsResult.data || []);
    } catch (err) {
      console.error('Error loading results:', err);
    }
  }

  function handleOptionSelect(optionId) {
    if (poll.poll_type === 'single_choice' || poll.poll_type === 'yes_no_abstain') {
      setSelectedOptions([optionId]);
    } else {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(function(id) { return id !== optionId; }));
      } else {
        setSelectedOptions(selectedOptions.concat([optionId]));
      }
    }
  }

  async function handleSubmitVote() {
    if (selectedOptions.length === 0 || voting) return;

    if (hasVoted && !poll.allow_vote_changes) {
      toast.error('You have already voted and cannot change your vote.');
      return;
    }

    setVoting(true);
    var loadingToast = toast.loading('Submitting vote...');
    try {
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;
      if (!user) throw new Error('You must be logged in to vote.');

      if (hasVoted && poll.allow_vote_changes) {
        var deleteResult = await supabase
          .from('poll_votes').delete()
          .eq('poll_id', poll.id).eq('member_id', user.id);
        if (deleteResult.error) throw deleteResult.error;
      }

      var votesToInsert = selectedOptions.map(function(optionId) {
        return { poll_id: poll.id, option_id: optionId, member_id: user.id, is_anonymous: poll.allow_anonymous };
      });

      var voteResult = await supabase.from('poll_votes').insert(votesToInsert);
      if (voteResult.error) throw voteResult.error;

      toast.dismiss(loadingToast);
      mascotSuccessToast(hasVoted ? 'Vote updated!' : 'Vote submitted!');
      setHasVoted(true);
      setSelectedOptions([]);
      await loadPollData();
      if (onVote) onVote(poll.id);
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Error submitting vote:', err);
      mascotErrorToast('Failed to submit vote.', 'Please try again.');
    } finally {
      setVoting(false);
    }
  }

  async function handleDelete() {
    if (!isAdmin || deleting) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }

    setDeleting(true);
    try {
      var result = await supabase.from('polls').delete().eq('id', poll.id);
      if (result.error) throw result.error;
      if (onDelete) onDelete(poll.id);
    } catch (err) {
      console.error('Error deleting poll:', err);
      mascotErrorToast('Failed to delete poll.', 'Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  var isExpired = poll.closing_date && new Date(poll.closing_date) < new Date();
  var canVote = poll.status === 'active' && !isExpired && (!hasVoted || poll.allow_vote_changes);
  var showResults = (poll.show_results_before_close && hasVoted) || poll.status === 'closed' || isExpired;
  var totalVotes = results.reduce(function(sum, r) { return sum + Number(r.vote_count); }, 0);

  // ── Status badge config ────────────────────────────────────────────────────
  var statusBadge = poll.status === 'active'
    ? { label: 'Active', cls: 'bg-[#1B3A2F] text-green-400', icon: ICONS.check }
    : { label: 'Closed', cls: isDark ? 'bg-[#1E2845] text-[#94A3B8]' : 'bg-gray-100 text-gray-600', icon: ICONS.lock };

  if (loading) {
    return (
      <div className={'rounded-xl border p-5 animate-pulse ' + cardBg + ' ' + border}>
        <div className={'h-5 w-2/3 rounded mb-3 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
        <div className={'h-4 w-1/2 rounded mb-4 ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
        {[1,2,3].map(function(i) {
          return <div key={i} className={'h-8 rounded-lg mb-2 ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />;
        })}
      </div>
    );
  }

  return (
    <article
      className={'rounded-xl border p-5 transition-shadow hover:shadow-md ' + cardBg + ' ' + border}
      aria-label={poll.title + ' poll'}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + statusBadge.cls}>
              <Icon path={statusBadge.icon} className="h-3 w-3" />
              {statusBadge.label}
            </span>

            <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#1D3461] text-blue-400' : 'bg-blue-50 text-blue-700')}>
              {POLL_TYPE_LABELS[poll.poll_type] || poll.poll_type}
            </span>

            {hasVoted && (
              <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#2D1B4E] text-purple-400' : 'bg-purple-50 text-purple-700')}>
                <Icon path={ICONS.check} className="h-3 w-3" />
                Voted
              </span>
            )}

            {isExpired && (
              <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600')}>
                <Icon path={ICONS.clock} className="h-3 w-3" />
                Expired
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={'text-base font-bold ' + textPri}>{poll.title}</h3>
          {poll.description && (
            <p className={'text-sm mt-1 ' + textSec}>{poll.description}</p>
          )}
          {showOrganization && poll.organization_name && (
            <p className={'text-xs mt-1 ' + textMuted}>
              <span className="font-semibold">From:</span> {poll.organization_name}
            </p>
          )}
        </div>

        {/* Delete button */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {confirmDelete ? (
              <>
                <button
                  onClick={function() { setConfirmDelete(false); }}
                  className={'text-xs px-3 py-1.5 rounded-lg border font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors ' + (isDark ? 'border-[#2A3550] text-[#94A3B8] hover:bg-[#1E2845]' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                className={'p-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ' + (isDark ? 'border-[#2A3550] text-[#94A3B8] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50')}
                aria-label={'Delete poll: ' + poll.title}
              >
                <Icon path={ICONS.trash} className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map(function(option) {
          var result = results.find(function(r) { return r.option_id === option.id; });
          var voteCount = result ? Number(result.vote_count) : 0;
          var percentage = result ? Number(result.percentage) : 0;
          var isUserVote = userVotes.some(function(v) { return v.option_id === option.id; });

          if (showResults) {
            return (
              <div key={option.id} className={'rounded-lg p-3 border ' + optionBg + ' ' + border}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={'text-sm font-semibold flex items-center gap-1.5 ' + (isUserVote ? (isDark ? 'text-purple-400' : 'text-purple-700') : textPri)}>
                    {isUserVote && <Icon path={ICONS.check} className="h-3.5 w-3.5" />}
                    {option.option_text}
                  </span>
                  <span className={'text-xs ' + textMuted}>{voteCount} vote{voteCount !== 1 ? 's' : ''} &middot; {percentage}%</span>
                </div>
                <div className={'w-full rounded-full h-2 overflow-hidden ' + barBg}>
                  <div
                    className={'h-full rounded-full transition-all ' + (isUserVote ? 'bg-purple-500' : 'bg-blue-500')}
                    style={{ width: percentage + '%' }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={option.option_text + ': ' + percentage + '%'}
                  />
                </div>
              </div>
            );
          }

          if (canVote) {
            var isSelected = selectedOptions.includes(option.id);
            var inputType = poll.poll_type === 'multiple_choice' ? 'checkbox' : 'radio';
            var optionId = 'poll-' + poll.id + '-opt-' + option.id;

            return (
              <label
                key={option.id}
                htmlFor={optionId}
                className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ' + (isSelected
                  ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50')
                  : (isDark ? 'border-[#2A3550] hover:border-blue-500/40 hover:bg-[#1E2845]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'))}
              >
                <input
                  id={optionId}
                  type={inputType}
                  name={'poll-' + poll.id}
                  checked={isSelected}
                  onChange={function() { handleOptionSelect(option.id); }}
                  className={'h-4 w-4 text-blue-500 focus:ring-2 focus:ring-blue-500 ' + (isDark ? 'border-[#2A3550] bg-[#1E2845]' : 'border-gray-300')}
                />
                <span className={'text-sm font-semibold ' + textPri}>{option.option_text}</span>
              </label>
            );
          }

          // Closed, no results
          return (
            <div key={option.id} className={'p-3 border rounded-lg ' + optionBg + ' ' + border}>
              <span className={'text-sm ' + textSec}>{option.option_text}</span>
            </div>
          );
        })}
      </div>

      {/* Vote submit button */}
      {canVote && selectedOptions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={handleSubmitVote}
            disabled={voting}
            className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {voting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Submitting...
              </>
            ) : (
              <>
                <Icon path={ICONS.chart} className="h-4 w-4" />
                {hasVoted ? 'Change Vote' : 'Submit Vote'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className={'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs border-t pt-3 mt-4 ' + textMuted + ' ' + divider}>
        <span>Created {format(new Date(poll.created_at), 'MMM d, yyyy')}</span>
        {showResults && (
          <span className="flex items-center gap-1">
            <Icon path={ICONS.user} className="h-3 w-3" />
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
          </span>
        )}
        {poll.closing_date && (
          <span className="flex items-center gap-1">
            <Icon path={ICONS.clock} className="h-3 w-3" />
            {isExpired ? 'Closed' : 'Closes'} {format(new Date(poll.closing_date), 'MMM d, yyyy h:mm a')}
          </span>
        )}
      </div>
    </article>
  );
}

export default PollCard;