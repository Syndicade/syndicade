import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  clipboard: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  plus:      'M12 4v16m8-8H4',
  x:         'M6 18L18 6M6 6l12 12',
  trash:     ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  chevUp:    'M5 15l7-7 7 7',
  chevDown:  'M19 9l-7 7-7-7',
  clock:     ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  eye:       ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  shield:    ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  refresh:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  users:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
};

var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900';
var labelCls = 'block text-sm font-semibold text-gray-900 mb-2';

var QUESTION_TYPES = [
  { value: 'text',            label: 'Short Text'      },
  { value: 'textarea',        label: 'Long Text'       },
  { value: 'single_choice',   label: 'Single Choice'   },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating',          label: 'Rating (1–5)'    },
  { value: 'date',            label: 'Date'            },
];

var VISIBILITY_OPTIONS = [
  { value: 'all_members', label: 'All Members' },
  { value: 'board_only',  label: 'Board Only'  },
  { value: 'public',      label: 'Public'      },
];

function makeQuestion(orderNumber) {
  return { id: Date.now() + Math.random(), question_text: '', question_type: 'text', required: true, options: [], order_number: orderNumber };
}

function QuestionSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-7 w-7 bg-gray-200 rounded" />
          <div className="h-7 w-7 bg-gray-200 rounded" />
          <div className="h-7 w-7 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="h-10 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function CreateSurvey({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);

  var [formData, setFormData] = useState({
    title: '',
    description: '',
    anonymous_responses: false,
    allow_multiple_responses: false,
    show_results_after_submission: true,
    closing_date: '',
    visibility: 'all_members',
  });

  var [questions, setQuestions] = useState([makeQuestion(1)]);

  useEffect(function() {
    function handleEscape(e) { if (e.key === 'Escape' && isOpen) handleClose(); }
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return function() { document.removeEventListener('keydown', handleEscape); };
  }, [isOpen]);

  function handleClose() {
    setFormData({ title: '', description: '', anonymous_responses: false, allow_multiple_responses: false, show_results_after_submission: true, closing_date: '', visibility: 'all_members' });
    setQuestions([makeQuestion(1)]);
    setError(null);
    onClose();
  }

  function updateForm(field, value) {
    setFormData(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  function addQuestion() {
    setQuestions(function(prev) { return prev.concat([makeQuestion(prev.length + 1)]); });
  }

  function removeQuestion(questionId) {
    if (questions.length === 1) { setError('Survey must have at least one question'); return; }
    setQuestions(function(prev) {
      return prev.filter(function(q) { return q.id !== questionId; })
        .map(function(q, i) { return Object.assign({}, q, { order_number: i + 1 }); });
    });
    setError(null);
  }

  function updateQuestion(questionId, field, value) {
    setQuestions(function(prev) {
      return prev.map(function(q) { return q.id === questionId ? Object.assign({}, q, { [field]: value }) : q; });
    });
  }

  function moveQuestion(questionId, direction) {
    var currentIndex = questions.findIndex(function(q) { return q.id === questionId; });
    var newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    var reordered = questions.slice();
    var temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[newIndex];
    reordered[newIndex] = temp;
    setQuestions(reordered.map(function(q, i) { return Object.assign({}, q, { order_number: i + 1 }); }));
  }

  function addOption(questionId) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        return q.id === questionId ? Object.assign({}, q, { options: (q.options || []).concat(['']) }) : q;
      });
    });
  }

  function updateOption(questionId, optIndex, value) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        if (q.id !== questionId) return q;
        var opts = q.options.slice();
        opts[optIndex] = value;
        return Object.assign({}, q, { options: opts });
      });
    });
  }

  function removeOption(questionId, optIndex) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        return q.id !== questionId ? q : Object.assign({}, q, { options: q.options.filter(function(_, i) { return i !== optIndex; }) });
      });
    });
  }

  function needsOptions(type) { return ['single_choice', 'multiple_choice'].includes(type); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) throw new Error('Please enter a survey title');
      if (questions.length === 0) throw new Error('Survey must have at least one question');

      for (var i = 0; i < questions.length; i++) {
        var q = questions[i];
        if (!q.question_text.trim()) throw new Error('Question ' + (i + 1) + ' is empty');
        if (needsOptions(q.question_type)) {
          if (!q.options || q.options.length < 2) throw new Error('Question ' + (i + 1) + ' needs at least 2 options');
          if (q.options.some(function(o) { return !o.trim(); })) throw new Error('Question ' + (i + 1) + ' has empty options');
        }
      }

      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) throw new Error('You must be logged in');
      var user = authResult.data.user;

      // Check role to determine approval status
      var memberResult = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      var userRole = memberResult.data ? memberResult.data.role : 'member';
      var approvalStatus = userRole === 'admin' ? 'approved' : 'pending';

      var surveyResult = await supabase
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
          created_by: user.id,
          approval_status: approvalStatus,
        })
        .select()
        .single();

      if (surveyResult.error) throw surveyResult.error;
      var survey = surveyResult.data;

      var questionInserts = questions.map(function(q) {
        return {
          survey_id: survey.id,
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          required: q.required,
          options: needsOptions(q.question_type) ? q.options.filter(function(o) { return o.trim(); }) : null,
          order_number: q.order_number,
        };
      });

      var questionsResult = await supabase.from('survey_questions').insert(questionInserts);
      if (questionsResult.error) throw questionsResult.error;

      if (approvalStatus === 'pending') {
        toast.success('Survey submitted for admin approval.');
      } else {
        toast.success('Survey created successfully.');
      }

      handleClose();
      if (onSuccess) onSuccess(survey);
    } catch (err) {
      console.error('Error creating survey:', err);
      toast.error('Failed to create survey: ' + err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-survey-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col"
        onClick={function(e) { e.stopPropagation(); }}
      >

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon path={ICONS.clipboard} className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 id="create-survey-title" className="text-xl font-bold text-gray-900">Create Survey</h2>
              <p className="text-gray-500 text-sm">{organizationName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Close dialog"
          >
            <Icon path={ICONS.x} className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800 font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* ── Survey Details ── */}
          <div className="space-y-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Survey Details</p>

            <div>
              <label htmlFor="survey-title" className={labelCls}>
                Survey Title <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="survey-title"
                type="text"
                value={formData.title}
                onChange={function(e) { updateForm('title', e.target.value); }}
                maxLength={200}
                className={inputCls}
                placeholder="e.g., Annual Member Satisfaction Survey"
                required
                aria-required="true"
              />
              <p className="text-xs text-gray-400 mt-1" aria-live="polite">{formData.title.length}/200</p>
            </div>

            <div>
              <label htmlFor="survey-description" className={labelCls}>
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="survey-description"
                value={formData.description}
                onChange={function(e) { updateForm('description', e.target.value); }}
                rows={3}
                maxLength={1000}
                className={inputCls + ' resize-none'}
                placeholder="What is this survey about?"
              />
              <p className="text-xs text-gray-400 mt-1" aria-live="polite">{formData.description.length}/1000</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="survey-closing" className={labelCls}>
                  <span className="flex items-center gap-2">
                    <Icon path={ICONS.clock} className="h-4 w-4 text-gray-400" />
                    Closing Date <span className="text-gray-400 font-normal">(optional)</span>
                  </span>
                </label>
                <input
                  id="survey-closing"
                  type="datetime-local"
                  value={formData.closing_date}
                  onChange={function(e) { updateForm('closing_date', e.target.value); }}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="survey-visibility" className={labelCls}>
                  <span className="flex items-center gap-2">
                    <Icon path={ICONS.users} className="h-4 w-4 text-gray-400" />
                    Visibility
                  </span>
                </label>
                <select
                  id="survey-visibility"
                  value={formData.visibility}
                  onChange={function(e) { updateForm('visibility', e.target.value); }}
                  className={inputCls}
                >
                  {VISIBILITY_OPTIONS.map(function(opt) {
                    return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Settings checkboxes */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Survey Settings</p>
              <div className="space-y-3">
                {[
                  { id: 'anon',     field: 'anonymous_responses',         checked: formData.anonymous_responses,         icon: ICONS.shield,  color: 'text-purple-500', label: 'Anonymous Responses',            desc: "Don't record who submitted each response" },
                  { id: 'multi',    field: 'allow_multiple_responses',     checked: formData.allow_multiple_responses,    icon: ICONS.refresh, color: 'text-blue-500',   label: 'Allow Multiple Responses',       desc: 'Members can submit more than once' },
                  { id: 'results',  field: 'show_results_after_submission',checked: formData.show_results_after_submission,icon: ICONS.eye,    color: 'text-green-500',  label: 'Show Results After Submission',  desc: 'Respondents see results once they submit' },
                ].map(function(item) {
                  return (
                    <label key={item.id}
                      className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' +
                        (item.checked ? 'border-blue-300 bg-white' : 'border-transparent hover:bg-white')}>
                      <input
                        id={'survey-' + item.id}
                        type="checkbox"
                        checked={item.checked}
                        onChange={function(e) { updateForm(item.field, e.target.checked); }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon path={item.icon} className={'h-4 w-4 flex-shrink-0 ' + item.color} />
                          <span className="font-semibold text-gray-900 text-sm">{item.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Questions ── */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {'Questions (' + questions.length + ')'}
              </p>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Add Question
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {questions.map(function(q) { return <QuestionSkeleton key={q.id} />; })}
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map(function(question, index) {
                  var showOptions = needsOptions(question.question_type);
                  var isRating = question.question_type === 'rating';

                  return (
                    <div key={question.id} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
                      {/* Question header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          {'Question ' + (index + 1)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={function() { moveQuestion(question.id, 'up'); }}
                            disabled={index === 0}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                            aria-label="Move question up"
                          >
                            <Icon path={ICONS.chevUp} className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={function() { moveQuestion(question.id, 'down'); }}
                            disabled={index === questions.length - 1}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                            aria-label="Move question down"
                          >
                            <Icon path={ICONS.chevDown} className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={function() { removeQuestion(question.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors ml-1"
                            aria-label={'Delete question ' + (index + 1)}
                          >
                            <Icon path={ICONS.trash} className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question text */}
                      <div>
                        <label htmlFor={'q-text-' + question.id} className="sr-only">
                          {'Question ' + (index + 1) + ' text'}
                        </label>
                        <input
                          id={'q-text-' + question.id}
                          type="text"
                          value={question.question_text}
                          onChange={function(e) { updateQuestion(question.id, 'question_text', e.target.value); }}
                          className={inputCls}
                          placeholder="Enter your question"
                          required
                          aria-required="true"
                        />
                      </div>

                      {/* Type + Required */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor={'q-type-' + question.id} className="block text-xs font-semibold text-gray-500 mb-1">Question Type</label>
                          <select
                            id={'q-type-' + question.id}
                            value={question.question_type}
                            onChange={function(e) { updateQuestion(question.id, 'question_type', e.target.value); }}
                            className={inputCls}
                          >
                            {QUESTION_TYPES.map(function(t) {
                              return <option key={t.value} value={t.value}>{t.label}</option>;
                            })}
                          </select>
                        </div>
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              id={'q-req-' + question.id}
                              type="checkbox"
                              checked={question.required}
                              onChange={function(e) { updateQuestion(question.id, 'required', e.target.checked); }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                            />
                            <div>
                              <span className="text-sm font-semibold text-gray-900">Required</span>
                              <p className="text-xs text-gray-400">Must be answered</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Rating info */}
                      {isRating && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 font-medium">Rating scale: 1 (lowest) to 5 (highest) — options are generated automatically.</p>
                        </div>
                      )}

                      {/* Options for choice questions */}
                      {showOptions && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold text-gray-500">Options</p>
                          {(question.options || []).map(function(opt, optIndex) {
                            return (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs font-bold w-5 text-right flex-shrink-0">{optIndex + 1}.</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={function(e) { updateOption(question.id, optIndex, e.target.value); }}
                                  className={inputCls}
                                  placeholder={'Option ' + (optIndex + 1)}
                                  aria-label={'Option ' + (optIndex + 1) + ' for question ' + (index + 1)}
                                />
                                <button
                                  type="button"
                                  onClick={function() { removeOption(question.id, optIndex); }}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors flex-shrink-0"
                                  aria-label={'Remove option ' + (optIndex + 1)}
                                >
                                  <Icon path={ICONS.x} className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={function() { addOption(question.id); }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mt-1"
                          >
                            <Icon path={ICONS.plus} className="h-4 w-4" />
                            Add Option
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Question button at bottom of list */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Icon path={ICONS.plus} className="h-4 w-4" />
              Add Another Question
            </button>
          </div>

        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-3 bg-transparent border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <Icon path={ICONS.clipboard} className="h-4 w-4" />
                Create Survey
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreateSurvey;