import { useState, useEffect, useCallback } from 'react';
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
  clipboard:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  check:      'M5 13l4 4L19 7',
  lock:       'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  user:       'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:      ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
  question:   ['M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  chart:      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  trash:      ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  eye:        ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  eyeOff:     ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  clock:      'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  star:       'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  x:          'M6 18L18 6M6 6l12 12',
};

function StarRating({ value, onChange, disabled, isDark }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1,2,3,4,5].map(function(rating) {
        var filled = value >= rating;
        return (
          <button
            key={rating}
            type="button"
            onClick={function() { if (!disabled) onChange(String(rating)); }}
            disabled={disabled}
            aria-label={'Rate ' + rating + ' out of 5'}
            aria-pressed={value === rating}
            className={'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors disabled:cursor-default ' + (filled ? 'text-[#F5B731]' : (isDark ? 'text-[#2A3550]' : 'text-gray-300'))}
          >
            <Icon path={ICONS.star} className="h-7 w-7" />
          </button>
        );
      })}
    </div>
  );
}

function SurveyCard({ survey, onDelete, isAdmin, isDark }) {
  var [loading, setLoading] = useState(false);
  var [questions, setQuestions] = useState([]);
  var [answers, setAnswers] = useState({});
  var [showForm, setShowForm] = useState(false);
  var [hasResponded, setHasResponded] = useState(false);
  var [responseCount, setResponseCount] = useState(0);
  var [showResults, setShowResults] = useState(false);
  var [results, setResults] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(false);
  var [formError, setFormError] = useState(null);

  // ── Theme shorthands ────────────────────────────────────────────────────────
  var cardBg    = isDark ? 'bg-[#1A2035]'    : 'bg-white';
  var border    = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var textPri   = isDark ? 'text-white'       : 'text-gray-900';
  var textSec   = isDark ? 'text-[#CBD5E1]'  : 'text-[#475569]';
  var textMuted = isDark ? 'text-[#94A3B8]'  : 'text-[#64748B]';
  var divider   = isDark ? 'border-[#2A3550]' : 'border-gray-100';
  var elevBg    = isDark ? 'bg-[#1E2845]'    : 'bg-gray-50';
  var inputCls  = isDark
    ? 'bg-[#0E1523] border-[#2A3550] text-white placeholder-[#64748B] focus:ring-blue-500 focus:border-blue-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500';
  var barBg     = isDark ? 'bg-[#2A3550]'   : 'bg-gray-200';

  useEffect(function() {
    if (survey) {
      loadQuestions();
      checkUserResponse();
      loadResponseCount();
    }
  }, [survey.id]);

  async function loadQuestions() {
    try {
      var result = await supabase
        .from('survey_questions').select('*')
        .eq('survey_id', survey.id)
        .order('order_number');
      if (result.error) throw result.error;
      var qs = result.data || [];
      setQuestions(qs);

      var initial = {};
      qs.forEach(function(q) {
        initial[q.id] = q.question_type === 'multiple_choice' ? [] : '';
      });
      setAnswers(initial);
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  }

  async function checkUserResponse() {
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) return;
      var result = await supabase
        .from('survey_responses').select('id')
        .eq('survey_id', survey.id)
        .eq('member_id', authResult.data.user.id)
        .maybeSingle();
      if (result.error) throw result.error;
      setHasResponded(!!result.data);
    } catch (err) {
      console.error('Error checking response:', err);
    }
  }

  async function loadResponseCount() {
    try {
      var result = await supabase
        .from('survey_responses').select('*', { count: 'exact', head: true })
        .eq('survey_id', survey.id);
      if (result.error) throw result.error;
      setResponseCount(result.count || 0);
    } catch (err) {
      console.error('Error loading response count:', err);
    }
  }

  async function loadResults() {
    try {
      setLoading(true);
      var responsesResult = await supabase
        .from('survey_responses').select('id')
        .eq('survey_id', survey.id);
      if (responsesResult.error) throw responsesResult.error;
      var responses = responsesResult.data || [];

      if (responses.length === 0) {
        setResults({ questions: [], totalResponses: 0 });
        return;
      }

      var answersResult = await supabase
        .from('survey_answers').select('*')
        .in('response_id', responses.map(function(r) { return r.id; }));
      if (answersResult.error) throw answersResult.error;
      var allAnswers = answersResult.data || [];

      var questionResults = questions.map(function(question) {
        var questionAnswers = allAnswers.filter(function(a) { return a.question_id === question.id; });

        if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
          var optionCounts = {};
          question.options.forEach(function(opt) { optionCounts[opt] = 0; });
          questionAnswers.forEach(function(answer) {
            if (question.question_type === 'multiple_choice') {
              var selected = answer.answer_text ? JSON.parse(answer.answer_text) : [];
              selected.forEach(function(opt) { if (optionCounts.hasOwnProperty(opt)) optionCounts[opt]++; });
            } else {
              if (optionCounts.hasOwnProperty(answer.answer_text)) optionCounts[answer.answer_text]++;
            }
          });
          return {
            question: question.question_text,
            type: question.question_type,
            options: question.options.map(function(opt) {
              return {
                option: opt,
                count: optionCounts[opt],
                percentage: responses.length > 0 ? Math.round((optionCounts[opt] / responses.length) * 100) : 0
              };
            })
          };
        }

        if (question.question_type === 'rating') {
          var ratings = questionAnswers.map(function(a) { return parseInt(a.answer_text); }).filter(function(r) { return !isNaN(r); });
          var average = ratings.length > 0 ? (ratings.reduce(function(s, r) { return s + r; }, 0) / ratings.length).toFixed(1) : 0;
          var ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          ratings.forEach(function(r) { if (ratingCounts.hasOwnProperty(r)) ratingCounts[r]++; });
          return {
            question: question.question_text,
            type: 'rating',
            average: average,
            totalRatings: ratings.length,
            distribution: Object.entries(ratingCounts).map(function(entry) {
              return {
                rating: parseInt(entry[0]),
                count: entry[1],
                percentage: ratings.length > 0 ? Math.round((entry[1] / ratings.length) * 100) : 0
              };
            })
          };
        }

        return {
          question: question.question_text,
          type: question.question_type,
          responses: questionAnswers.map(function(a) { return a.answer_text; }).filter(Boolean)
        };
      });

      setResults({ questions: questionResults, totalResponses: responses.length });
    } catch (err) {
      console.error('Error loading results:', err);
      mascotErrorToast('Failed to load results.', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  var handleAnswerChange = useCallback(function(questionId, value, questionType) {
    if (questionType === 'multiple_choice') {
      setAnswers(function(prev) {
        var current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        var next = current.includes(value)
          ? current.filter(function(v) { return v !== value; })
          : current.concat([value]);
        return Object.assign({}, prev, { [questionId]: next });
      });
    } else {
      setAnswers(function(prev) { return Object.assign({}, prev, { [questionId]: value }); });
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    // Validate required questions
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (q.required) {
        var ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          var msg = 'Please answer: ' + q.question_text;
          setFormError(msg);
          toast.error(msg);
          return;
        }
      }
    }

    setLoading(true);
    var loadingToast = toast.loading('Submitting survey...');
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) throw new Error('You must be logged in.');

      if (!survey.allow_multiple_responses && hasResponded) {
        throw new Error('You have already responded to this survey.');
      }

      var responseResult = await supabase
        .from('survey_responses')
        .insert({ survey_id: survey.id, member_id: survey.anonymous_responses ? null : authResult.data.user.id })
        .select().single();
      if (responseResult.error) throw responseResult.error;

      var answerInserts = questions.map(function(question) {
        var answerText = answers[question.id];
        if (question.question_type === 'multiple_choice') answerText = JSON.stringify(answerText || []);
        else if (question.question_type === 'date' && answerText) answerText = new Date(answerText).toISOString();
        return { response_id: responseResult.data.id, question_id: question.id, answer_text: answerText || null };
      });

      var answersRes = await supabase.from('survey_answers').insert(answerInserts);
      if (answersRes.error) throw answersRes.error;

      toast.dismiss(loadingToast);
      mascotSuccessToast('Survey submitted!', 'Thank you for your response.');
      setShowForm(false);
      setHasResponded(true);
      loadResponseCount();

      if (survey.show_results_after_submission) {
        setShowResults(true);
        loadResults();
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Error submitting survey:', err);
      mascotErrorToast('Failed to submit survey.', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setLoading(true);
    try {
      var result = await supabase.from('surveys').delete().eq('id', survey.id);
      if (result.error) throw result.error;
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting survey:', err);
      mascotErrorToast('Failed to delete survey.', 'Please try again.');
      setLoading(false);
      setConfirmDelete(false);
    }
  }

  var isExpired = survey.closing_date && new Date(survey.closing_date) < new Date();
  var isClosed = survey.status === 'closed' || isExpired;
  var canTakeSurvey = !isClosed && (!hasResponded || survey.allow_multiple_responses);

  return (
    <article className={'rounded-xl border p-5 ' + cardBg + ' ' + border} aria-label={survey.title + ' survey'}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={'text-base font-bold mb-1 ' + textPri}>{survey.title}</h3>
          {survey.description && (
            <p className={'text-sm ' + textSec}>{survey.description}</p>
          )}
        </div>

        {/* Delete controls */}
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
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                className={'p-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ' + (isDark ? 'border-[#2A3550] text-[#94A3B8] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50')}
                aria-label={'Delete survey: ' + survey.title}
              >
                <Icon path={ICONS.trash} className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {isClosed ? (
          <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#1E2845] text-[#94A3B8]' : 'bg-gray-100 text-gray-600')}>
            <Icon path={ICONS.lock} className="h-3 w-3" />
            Closed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1B3A2F] text-green-400">
            <Icon path={ICONS.check} className="h-3 w-3" />
            Active
          </span>
        )}

        {hasResponded && (
          <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#2D1B4E] text-purple-400' : 'bg-purple-50 text-purple-700')}>
            <Icon path={ICONS.check} className="h-3 w-3" />
            Responded
          </span>
        )}

        {survey.anonymous_responses && (
          <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#1D3461] text-blue-400' : 'bg-blue-50 text-blue-700')}>
            <Icon path={ICONS.user} className="h-3 w-3" />
            Anonymous
          </span>
        )}

        <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#1E2845] text-[#CBD5E1]' : 'bg-gray-100 text-gray-600')}>
          <Icon path={ICONS.users} className="h-3 w-3" />
          {responseCount} {responseCount === 1 ? 'Response' : 'Responses'}
        </span>

        {questions.length > 0 && (
          <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#1E2845] text-[#CBD5E1]' : 'bg-gray-100 text-gray-600')}>
            <Icon path={ICONS.question} className="h-3 w-3" />
            {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
          </span>
        )}

        {survey.closing_date && (
          <span className={'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ' + (isDark ? 'bg-[#1E2845] text-[#94A3B8]' : 'bg-gray-100 text-gray-500')}>
            <Icon path={ICONS.clock} className="h-3 w-3" />
            {isClosed ? 'Closed' : 'Closes'} {format(new Date(survey.closing_date), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {canTakeSurvey && !showForm && (
          <button
            onClick={function() { setShowForm(true); setFormError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Icon path={ICONS.clipboard} className="h-4 w-4" />
            Take Survey
          </button>
        )}

        {(hasResponded || isClosed || isAdmin) && (
          <button
            onClick={function() {
              if (!showResults) { setShowResults(true); loadResults(); }
              else { setShowResults(false); }
            }}
            className={'inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors ' + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845]' : 'border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100')}
          >
            <Icon path={showResults ? ICONS.eyeOff : ICONS.eye} className="h-4 w-4" />
            {showResults ? 'Hide Results' : 'View Results'}
          </button>
        )}
      </div>

      {/* Survey form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={'border-t mt-5 pt-5 space-y-6 ' + divider} noValidate>
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30" role="alert">
              <Icon path={ICONS.x} className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{formError}</p>
            </div>
          )}

          {questions.map(function(question, index) {
            return (
              <div key={question.id} className="space-y-2">
                <label
                  htmlFor={'sq-' + question.id}
                  className={'block text-sm font-semibold ' + textPri}
                >
                  {index + 1}. {question.question_text}
                  {question.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
                  {question.required && <span className="sr-only"> (required)</span>}
                </label>

                {question.question_type === 'text' && (
                  <input
                    id={'sq-' + question.id}
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={function(e) { handleAnswerChange(question.id, e.target.value, 'text'); }}
                    required={question.required}
                    aria-required={question.required}
                    className={'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ' + inputCls}
                  />
                )}

                {question.question_type === 'textarea' && (
                  <textarea
                    id={'sq-' + question.id}
                    value={answers[question.id] || ''}
                    onChange={function(e) { handleAnswerChange(question.id, e.target.value, 'textarea'); }}
                    rows={4}
                    required={question.required}
                    aria-required={question.required}
                    className={'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none ' + inputCls}
                  />
                )}

                {question.question_type === 'single_choice' && (
                  <div className="space-y-2" role="radiogroup" aria-labelledby={'sq-label-' + question.id}>
                    {question.options.map(function(option, optIndex) {
                      var radioId = 'sq-' + question.id + '-opt-' + optIndex;
                      return (
                        <label
                          key={optIndex}
                          htmlFor={radioId}
                          className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ' + (answers[question.id] === option
                            ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50')
                            : (isDark ? 'border-[#2A3550] hover:border-blue-500/40 hover:bg-[#1E2845]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'))}
                        >
                          <input
                            id={radioId}
                            type="radio"
                            name={'sq-' + question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={function(e) { handleAnswerChange(question.id, e.target.value, 'single_choice'); }}
                            required={question.required}
                            className={'h-4 w-4 text-blue-500 focus:ring-2 focus:ring-blue-500 ' + (isDark ? 'border-[#2A3550]' : 'border-gray-300')}
                          />
                          <span className={'text-sm font-medium ' + textPri}>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {question.question_type === 'multiple_choice' && (
                  <div className="space-y-2" role="group" aria-labelledby={'sq-label-' + question.id}>
                    {question.options.map(function(option, optIndex) {
                      var checkId = 'sq-' + question.id + '-opt-' + optIndex;
                      var isChecked = Array.isArray(answers[question.id]) && answers[question.id].includes(option);
                      return (
                        <label
                          key={optIndex}
                          htmlFor={checkId}
                          className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ' + (isChecked
                            ? (isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50')
                            : (isDark ? 'border-[#2A3550] hover:border-blue-500/40 hover:bg-[#1E2845]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'))}
                        >
                          <input
                            id={checkId}
                            type="checkbox"
                            checked={isChecked}
                            onChange={function() { handleAnswerChange(question.id, option, 'multiple_choice'); }}
                            className={'h-4 w-4 text-blue-500 focus:ring-2 focus:ring-blue-500 rounded ' + (isDark ? 'border-[#2A3550]' : 'border-gray-300')}
                          />
                          <span className={'text-sm font-medium ' + textPri}>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {question.question_type === 'rating' && (
                  <StarRating
                    value={parseInt(answers[question.id]) || 0}
                    onChange={function(val) { handleAnswerChange(question.id, val, 'rating'); }}
                    isDark={isDark}
                  />
                )}

                {question.question_type === 'date' && (
                  <input
                    id={'sq-' + question.id}
                    type="date"
                    value={answers[question.id] || ''}
                    onChange={function(e) { handleAnswerChange(question.id, e.target.value, 'date'); }}
                    required={question.required}
                    aria-required={question.required}
                    className={'px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ' + inputCls}
                  />
                )}
              </div>
            );
          })}

          <div className={'flex gap-3 pt-2 border-t ' + divider}>
            <button
              type="button"
              onClick={function() { setShowForm(false); setFormError(null); }}
              disabled={loading}
              className={'px-4 py-2 border text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 ' + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845]' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Submitting...
                </>
              ) : 'Submit Survey'}
            </button>
          </div>
        </form>
      )}

      {/* Results */}
      {showResults && (
        <div className={'border-t mt-5 pt-5 space-y-6 ' + divider}>
          <div className="flex items-center gap-2">
            <Icon path={ICONS.chart} className={'h-5 w-5 ' + (isDark ? 'text-blue-400' : 'text-blue-500')} />
            <h4 className={'font-bold ' + textPri}>
              {'Survey Results — ' + (results ? results.totalResponses : 0) + ' ' + (results && results.totalResponses === 1 ? 'Response' : 'Responses')}
            </h4>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(function(i) {
                return <div key={i} className={'h-16 rounded-lg animate-pulse ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />;
              })}
            </div>
          ) : !results || results.totalResponses === 0 ? (
            <div className={'text-center py-8 rounded-lg ' + elevBg}>
              <Icon path={ICONS.chart} className={'h-8 w-8 mx-auto mb-2 ' + (isDark ? 'text-[#2A3550]' : 'text-gray-300')} />
              <p className={'text-sm ' + textMuted}>No responses yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.questions.map(function(result, index) {
                return (
                  <div key={index} className={'rounded-lg p-4 border ' + elevBg + ' ' + border}>
                    <h5 className={'text-sm font-bold mb-3 ' + textPri}>{index + 1}. {result.question}</h5>

                    {result.type === 'rating' && (
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-[#F5B731]">{result.average}</span>
                          <span className={'text-sm ' + textMuted}>/ 5 &middot; {result.totalRatings} rating{result.totalRatings !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-1.5">
                          {result.distribution.map(function(dist) {
                            return (
                              <div key={dist.rating} className="flex items-center gap-2">
                                <span className={'w-8 text-xs text-right flex-shrink-0 ' + textMuted}>{dist.rating}</span>
                                <Icon path={ICONS.star} className="h-3.5 w-3.5 text-[#F5B731] flex-shrink-0" />
                                <div className={'flex-1 rounded-full h-2 overflow-hidden ' + barBg}>
                                  <div className="bg-[#F5B731] h-2 rounded-full transition-all" style={{ width: dist.percentage + '%' }} />
                                </div>
                                <span className={'w-20 text-xs flex-shrink-0 ' + textMuted}>{dist.count} ({dist.percentage}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(result.type === 'single_choice' || result.type === 'multiple_choice') && (
                      <div className="space-y-2">
                        {result.options.map(function(opt, optIndex) {
                          return (
                            <div key={optIndex}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className={textSec}>{opt.option}</span>
                                <span className={textMuted}>{opt.count} ({opt.percentage}%)</span>
                              </div>
                              <div className={'rounded-full h-2 overflow-hidden ' + barBg}>
                                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: opt.percentage + '%' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(result.type === 'text' || result.type === 'textarea' || result.type === 'date') && (
                      <div className="space-y-2">
                        {result.responses.length === 0 ? (
                          <p className={'text-sm italic ' + textMuted}>No responses yet.</p>
                        ) : (
                          result.responses.map(function(response, respIndex) {
                            return (
                              <div key={respIndex} className={'text-sm p-3 rounded-lg border ' + (isDark ? 'bg-[#0E1523] border-[#2A3550] text-[#CBD5E1]' : 'bg-white border-gray-200 text-gray-700')}>
                                {response}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default SurveyCard;