import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * CreatePoll Component
 * 
 * Modal form for creating new polls with options.
 */
function CreatePoll({ 
  isOpen, 
  onClose, 
  onSuccess, 
  organizationId, 
  organizationName 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    poll_type: 'single_choice',
    visibility: 'all_members',
    allow_anonymous: false,
    show_results_before_close: false,
    allow_vote_changes: true,
    closing_date: ''
  });
  
  const [options, setOptions] = useState(['', '']); // Start with 2 empty options
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollTypeOptions = [
    { value: 'single_choice', label: '⚪ Single Choice', description: 'Members pick one option' },
    { value: 'multiple_choice', label: '☑️ Multiple Choice', description: 'Members pick multiple options' },
    { value: 'yes_no_abstain', label: '✅ Yes/No/Abstain', description: 'Simple voting' }
  ];

  const visibilityOptions = [
    { value: 'all_members', label: '👥 All Members' },
    { value: 'board_only', label: '👔 Board Only' },
    { value: 'public', label: '🌐 Public' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (formData.title.trim().length < 3) {
        throw new Error('Title must be at least 3 characters');
      }

      // Validate options based on poll type
      if (formData.poll_type !== 'yes_no_abstain') {
        const filledOptions = options.filter(opt => opt.trim().length > 0);
        if (filledOptions.length < 2) {
          throw new Error('Please provide at least 2 options');
        }
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in');

      // Create poll
      const { data: newPoll, error: createError } = await supabase
        .from('polls')
        .insert([{
          organization_id: organizationId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          poll_type: formData.poll_type,
          visibility: formData.visibility,
          allow_anonymous: formData.allow_anonymous,
          show_results_before_close: formData.show_results_before_close,
          allow_vote_changes: formData.allow_vote_changes,
          closing_date: formData.closing_date || null,
          status: 'active',
          created_by: user.id
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Create poll options
      let optionsToInsert;
      
      if (formData.poll_type === 'yes_no_abstain') {
        optionsToInsert = [
          { poll_id: newPoll.id, option_text: 'Yes', display_order: 0 },
          { poll_id: newPoll.id, option_text: 'No', display_order: 1 },
          { poll_id: newPoll.id, option_text: 'Abstain', display_order: 2 }
        ];
      } else {
        optionsToInsert = options
          .filter(opt => opt.trim().length > 0)
          .map((opt, index) => ({
            poll_id: newPoll.id,
            option_text: opt.trim(),
            display_order: index
          }));
      }

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      // Success!
      if (onSuccess) {
        onSuccess(newPoll);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        poll_type: 'single_choice',
        visibility: 'all_members',
        allow_anonymous: false,
        show_results_before_close: false,
        allow_vote_changes: true,
        closing_date: ''
      });
      setOptions(['', '']);
      onClose();

    } catch (err) {
      console.error('Error creating poll:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-poll-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2
            id="create-poll-title"
            className="text-2xl font-bold text-gray-900"
          >
            📊 Create Poll
          </h2>
          <p className="text-gray-600 mt-1">
            Create a poll for {organizationName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
            >
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="poll-title"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Poll Question *
            </label>
            <input
              id="poll-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., What time should we meet?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="poll-description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="poll-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add context or additional information..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Poll Type */}
          <div>
            <label
              htmlFor="poll-type"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Poll Type *
            </label>
            <select
              id="poll-type"
              name="poll_type"
              required
              value={formData.poll_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pollTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Poll Options (only show for non-yes/no polls) */}
          {formData.poll_type !== 'yes_no_abstain' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Poll Options *
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500 font-semibold w-6">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={100}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Remove option ${index + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold"
                >
                  + Add Option
                </button>
              )}
            </div>
          )}

          {/* Visibility */}
          <div>
            <label
              htmlFor="poll-visibility"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Who Can Vote *
            </label>
            <select
              id="poll-visibility"
              name="visibility"
              required
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {visibilityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Settings row */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-900">Poll Settings</p>
            
            {/* Allow vote changes */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="allow-changes"
                  name="allow_vote_changes"
                  type="checkbox"
                  checked={formData.allow_vote_changes}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="allow-changes" className="font-semibold text-gray-900">
                  🔄 Allow Vote Changes
                </label>
                <p className="text-sm text-gray-600">
                  Members can change their vote before poll closes
                </p>
              </div>
            </div>

            {/* Show results */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="show-results"
                  name="show_results_before_close"
                  type="checkbox"
                  checked={formData.show_results_before_close}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="show-results" className="font-semibold text-gray-900">
                  📊 Show Live Results
                </label>
                <p className="text-sm text-gray-600">
                  Display results while poll is active
                </p>
              </div>
            </div>

            {/* Anonymous voting */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="allow-anonymous"
                  name="allow_anonymous"
                  type="checkbox"
                  checked={formData.allow_anonymous}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="allow-anonymous" className="font-semibold text-gray-900">
                  🎭 Anonymous Voting
                </label>
                <p className="text-sm text-gray-600">
                  Don't show who voted for what
                </p>
              </div>
            </div>
          </div>

          {/* Closing date */}
          <div>
            <label
              htmlFor="poll-closing"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Closing Date (Optional)
            </label>
            <input
              id="poll-closing"
              name="closing_date"
              type="datetime-local"
              value={formData.closing_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Poll closes automatically at this time
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.title.trim().length < 3}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>
                  📊 Create Poll
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePoll;
