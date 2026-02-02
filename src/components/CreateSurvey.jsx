import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function CreateSurvey({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    anonymous_responses: false,
    allow_multiple_responses: false,
    show_results_after_submission: true,
    closing_date: '',
    visibility: 'all_members'
  });

  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      question_text: '',
      question_type: 'text',
      required: true,
      options: [],
      order_number: 1
    }
  ]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      anonymous_responses: false,
      allow_multiple_responses: false,
      show_results_after_submission: true,
      closing_date: '',
      visibility: 'all_members'
    });
    setQuestions([{
      id: Date.now(),
      question_text: '',
      question_type: 'text',
      required: true,
      options: [],
      order_number: 1
    }]);
    setError(null);
    onClose();
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        question_text: '',
        question_type: 'text',
        required: true,
        options: [],
        order_number: questions.length + 1
      }
    ]);
  };

  const removeQuestion = (questionId) => {
    if (questions.length === 1) {
      setError('Survey must have at least one question');
      return;
    }
    const updatedQuestions = questions
      .filter(q => q.id !== questionId)
      .map((q, index) => ({ ...q, order_number: index + 1 }));
    setQuestions(updatedQuestions);
    setError(null);
  };

  const updateQuestion = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [...(q.options || []), '']
        };
      }
      return q;
    }));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.filter((_, index) => index !== optionIndex)
        };
      }
      return q;
    }));
  };

  const moveQuestion = (questionId, direction) => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    const reordered = [...questions];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];
    
    const updated = reordered.map((q, index) => ({ ...q, order_number: index + 1 }));
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Please enter a survey title');
      }

      if (questions.length === 0) {
        throw new Error('Survey must have at least one question');
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) {
          throw new Error(`Question ${i + 1} is empty`);
        }
        if (['single_choice', 'multiple_choice', 'rating'].includes(q.question_type)) {
          if (!q.options || q.options.length < 2) {
            throw new Error(`Question ${i + 1} needs at least 2 options`);
          }
          if (q.options.some(opt => !opt.trim())) {
            throw new Error(`Question ${i + 1} has empty options`);
          }
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in');

      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          organization_id: organizationId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          anonymous_responses: formData.anonymous_responses,
          allow_multiple_responses: formData.allow_multiple_responses,
          show_results_after_submission: formData.show_results_after_submission,
          closing_date: formData.closing_date || null,
          visibility: formData.visibility,
          status: 'active',
          created_by: user.id
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      const questionInserts = questions.map(q => ({
        survey_id: survey.id,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        required: q.required,
        options: ['single_choice', 'multiple_choice', 'rating'].includes(q.question_type) 
          ? q.options.filter(opt => opt.trim()) 
          : null,
        order_number: q.order_number
      }));

      const { error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionInserts);

      if (questionsError) throw questionsError;

      alert('✅ Survey created successfully!');
      handleClose();
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Error creating survey:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const needsOptions = (type) => ['single_choice', 'multiple_choice', 'rating'].includes(type);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-survey-title"
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 id="create-survey-title" className="text-2xl font-bold text-gray-900">
            Create Survey
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Survey Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Survey Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Annual Member Satisfaction Survey"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What is this survey about?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.closing_date}
                  onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all_members">All Members</option>
                  <option value="board_only">Board Only</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.anonymous_responses}
                  onChange={(e) => setFormData({ ...formData, anonymous_responses: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Anonymous responses</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allow_multiple_responses}
                  onChange={(e) => setFormData({ ...formData, allow_multiple_responses: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Allow multiple responses per person</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_results_after_submission}
                  onChange={(e) => setFormData({ ...formData, show_results_after_submission: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Show results after submission</span>
              </label>
            </div>
          </div>

          {/* Questions */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-700">
                      Question {index + 1}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        aria-label="Move question up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, 'down')}
                        disabled={index === questions.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        aria-label="Move question down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700 ml-2"
                        aria-label="Delete question"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your question"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={question.question_type}
                        onChange={(e) => updateQuestion(question.id, 'question_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="single_choice">Single Choice</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="rating">Rating (1-5)</option>
                        <option value="date">Date</option>
                      </select>
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Required</span>
                    </label>
                  </div>

                  {needsOptions(question.question_type) && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {question.question_type === 'rating' ? 'Rating Labels' : 'Options'}
                      </label>
                      {question.question_type === 'rating' ? (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          Rating scale: 1 (lowest) to 5 (highest)
                        </div>
                      ) : (
                        <>
                          {(question.options || []).map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Option ${optIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(question.id, optIndex)}
                                className="text-red-600 hover:text-red-700"
                                aria-label="Remove option"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(question.id)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Option
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSurvey;