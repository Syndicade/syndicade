import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

/**
 * PollCard Component
 * 
 * Displays a poll with voting interface and results.
 */
function PollCard({ 
  poll, 
  onVote, 
  onDelete, 
  isAdmin = false,
  showOrganization = false 
}) {
  const [options, setOptions] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Status styling
  const statusConfig = {
    active: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-600 text-white',
      icon: '✅',
      label: 'Active'
    },
    closed: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      badge: 'bg-gray-600 text-white',
      icon: '🔒',
      label: 'Closed'
    },
    draft: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-600 text-white',
      icon: '📝',
      label: 'Draft'
    }
  };

  const config = statusConfig[poll.status] || statusConfig.active;

  // Poll type labels
  const pollTypeLabels = {
    single_choice: '⚪ Single Choice',
    multiple_choice: '☑️ Multiple Choice',
    yes_no_abstain: '✅ Yes/No/Abstain'
  };

  // Load poll data
  useEffect(() => {
    loadPollData();
  }, [poll.id]);

  const loadPollData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Load options
      const { data: optionsData, error: optionsError } = await supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll.id)
        .order('display_order');

      if (optionsError) throw optionsError;
      setOptions(optionsData || []);

      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user has voted
      const { data: votesData, error: votesError } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('member_id', user.id);

      if (votesError) throw votesError;
      
      setUserVotes(votesData || []);
      setHasVoted(votesData && votesData.length > 0);

      // Load results if allowed
      if (poll.show_results_before_close || poll.status === 'closed' || hasVoted) {
        await loadResults();
      }

    } catch (err) {
      console.error('Error loading poll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const { data: resultsData, error: resultsError } = await supabase
        .rpc('get_poll_results', { poll_uuid: poll.id });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);
    } catch (err) {
      console.error('Error loading results:', err);
    }
  };

  // Handle vote selection
  const handleOptionSelect = (optionId) => {
    if (poll.poll_type === 'single_choice') {
      setSelectedOptions([optionId]);
    } else if (poll.poll_type === 'multiple_choice') {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      // yes_no_abstain
      setSelectedOptions([optionId]);
    }
  };

  // Submit vote
  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || voting) return;

    setVoting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to vote');

      // If user has voted and changes are not allowed, prevent voting
      if (hasVoted && !poll.allow_vote_changes) {
        alert('You have already voted and cannot change your vote.');
        setVoting(false);
        return;
      }

      // Delete existing votes if changing
      if (hasVoted && poll.allow_vote_changes) {
        const { error: deleteError } = await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('member_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Insert new votes
      const votesToInsert = selectedOptions.map(optionId => ({
        poll_id: poll.id,
        option_id: optionId,
        member_id: user.id,
        is_anonymous: poll.allow_anonymous
      }));

      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert(votesToInsert);

      if (voteError) throw voteError;

      // Update state
      setHasVoted(true);
      setSelectedOptions([]);
      await loadPollData();

      if (onVote) {
        onVote(poll.id);
      }

    } catch (err) {
      console.error('Error submitting vote:', err);
      alert('Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  // Delete poll (admin only)
  const handleDelete = async () => {
    if (!isAdmin || deleting) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${poll.title}"?\n\nThis will also delete all votes. This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', poll.id);

      if (error) throw error;

      if (onDelete) {
        onDelete(poll.id);
      }
    } catch (err) {
      console.error('Error deleting poll:', err);
      alert('Failed to delete poll. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Check if poll is expired
  const isExpired = poll.closing_date && new Date(poll.closing_date) < new Date();
  const canVote = poll.status === 'active' && !isExpired && (!hasVoted || poll.allow_vote_changes);
const showResults = (poll.show_results_before_close && hasVoted) || poll.status === 'closed' || isExpired;
  // Calculate total votes
  const totalVotes = results.reduce((sum, result) => sum + Number(result.vote_count), 0);

  if (loading) {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <article
      className={`rounded-lg border-2 ${config.border} ${config.bg} p-4 shadow-sm transition-all hover:shadow-md`}
      aria-label={`${poll.title} poll`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 ${config.badge} text-xs font-semibold rounded`}
              aria-label={`Status: ${config.label}`}
            >
              <span aria-hidden="true">{config.icon}</span>
              {config.label}
            </span>

            {/* Poll type */}
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
              {pollTypeLabels[poll.poll_type]}
            </span>

            {/* Voted indicator */}
            {hasVoted && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded"
                aria-label="You voted"
              >
                ✓ Voted
              </span>
            )}

            {/* Expired indicator */}
            {isExpired && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded"
                aria-label="Expired"
              >
                ⏱️ Expired
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900">
            {poll.title}
          </h3>

          {/* Description */}
          {poll.description && (
            <p className="text-gray-700 mt-2">
              {poll.description}
            </p>
          )}

          {/* Organization name */}
          {showOrganization && poll.organization_name && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">From:</span> {poll.organization_name}
            </p>
          )}
        </div>

        {/* Delete button (admin only) */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete poll"
          >
            {deleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        )}
      </div>

      {/* Voting Interface or Results */}
      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const result = results.find(r => r.option_id === option.id);
          const voteCount = result ? Number(result.vote_count) : 0;
          const percentage = result ? Number(result.percentage) : 0;
          const isUserVote = userVotes.some(v => v.option_id === option.id);

          if (showResults) {
            // Show results
            return (
              <div key={option.id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 flex items-center gap-2">
                    {isUserVote && <span className="text-purple-600">✓</span>}
                    {option.option_text}
                  </span>
                  <span className="text-sm text-gray-600">
                    {voteCount} vote{voteCount !== 1 ? 's' : ''} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isUserVote ? 'bg-purple-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${option.option_text}: ${percentage}%`}
                  />
                </div>
              </div>
            );
          } else if (canVote) {
            // Show voting interface
            const isSelected = selectedOptions.includes(option.id);
            const inputType = poll.poll_type === 'single_choice' || poll.poll_type === 'yes_no_abstain' ? 'radio' : 'checkbox';

            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type={inputType}
                  name="poll-option"
                  checked={isSelected}
                  onChange={() => handleOptionSelect(option.id)}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="font-semibold text-gray-900">
                  {option.option_text}
                </span>
              </label>
            );
          } else {
            // Poll closed, no results shown
            return (
              <div key={option.id} className="p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                <span className="text-gray-600">{option.option_text}</span>
              </div>
            );
          }
        })}
      </div>

      {/* Vote button */}
      {canVote && selectedOptions.length > 0 && (
        <div className="mt-4">
          <button
            onClick={handleSubmitVote}
            disabled={voting}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {voting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Submitting...
              </>
            ) : (
              <>
                📊 {hasVoted ? 'Change Vote' : 'Submit Vote'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-3 mt-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Created date */}
          <span>
            <span className="font-semibold">Created:</span>{' '}
            {format(new Date(poll.created_at), 'MMM d, yyyy')}
          </span>

          {/* Total votes */}
          {showResults && (
            <span>
              <span className="font-semibold">Total Votes:</span> {totalVotes}
            </span>
          )}

          {/* Closing date */}
          {poll.closing_date && (
            <span>
              <span className="font-semibold">{isExpired ? 'Closed:' : 'Closes:'}</span>{' '}
              {format(new Date(poll.closing_date), 'MMM d, yyyy h:mm a')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default PollCard;