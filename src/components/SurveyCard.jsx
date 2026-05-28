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
  clipboard: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  check:     'M5 13l4 4L19 7',
  lock:      'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  unlock:    'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
  user:      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:     ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
  question:  ['M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  chart:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  trash:     ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  eye:       ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  eyeOff:    ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  clock:     'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  star:      'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  x:         'M6 18L18 6M6 6l12 12',
  pin:       ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
  pinOff:    ['M6.75 4.5h10.5M12 4.5V9m0 0l3 3m-3-3l-3 3M4.5 19.5l15-15'],
  copy:      ['M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'],
  download:  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  pieChart:  ['M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z', 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'],
  barChart:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  repeat:    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  filter:    'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
  template:  ['M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2'],
  pencil:    ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
};

var CHART_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16'];

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ labels, values, total }) {
  var CX = 60; var CY = 60; var R = 45; var IR = 28;
  var segments = []; var angle = -90;
  labels.forEach(function(label, i) {
    var pct = total > 0 ? Math.round((values[i] / total) * 100) : 0;
    if (pct <= 0) return;
    var sweep = (pct / 100) * 360;
    var s = angle * Math.PI / 180; var e = (angle + sweep) * Math.PI / 180;
    var large = sweep > 180 ? 1 : 0;
    var d = ['M',CX+R*Math.cos(s),CY+R*Math.sin(s),'A',R,R,0,large,1,CX+R*Math.cos(e),CY+R*Math.sin(e),'L',CX+IR*Math.cos(e),CY+IR*Math.sin(e),'A',IR,IR,0,large,0,CX+IR*Math.cos(s),CY+IR*Math.sin(s),'Z'].join(' ');
    segments.push({ d:d, color:CHART_COLORS[i % CHART_COLORS.length], label:label, pct:pct, count:values[i] });
    angle += sweep;
  });
  return (
    <div className="flex items-center gap-6 py-2">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true" className="flex-shrink-0">
        {segments.length > 0 ? segments.map(function(s,i) { return <path key={i} d={s.d} fill={s.color} />; }) : <circle cx={CX} cy={CY} r={R} fill="#E2E8F0" />}
        <circle cx={CX} cy={CY} r={IR} fill="white" />
        <text x={CX} y={CY-3} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0E1523">{total}</text>
        <text x={CX} y={CY+11} textAnchor="middle" fontSize="9" fill="#64748B">resp.</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.map(function(s,i) {
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:s.color }} aria-hidden="true" />
              <span className="text-[#475569] flex-1 truncate">{s.label}</span>
              <span className="text-[#64748B] font-semibold tabular-nums">{s.count} ({s.pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Star rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1,2,3,4,5].map(function(r) {
        return (
          <button key={r} type="button" onClick={function() { if (!disabled) onChange(String(r)); }} disabled={disabled}
            aria-label={'Rate ' + r + ' out of 5'} aria-pressed={value === r}
            className={'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors disabled:cursor-default ' + (value >= r ? 'text-[#F5B731]' : 'text-gray-300')}>
            <Icon path={ICONS.star} className="h-7 w-7" />
          </button>
        );
      })}
    </div>
  );
}

// ── Conditional logic helper ──────────────────────────────────────────────────
function shouldShowQuestion(question, answers, allQuestions) {
  if (!question.condition_question_id) return true;
  var condQ = allQuestions.find(function(q) { return q.id === question.condition_question_id; });
  if (!condQ) return true;
  var ans = answers[question.condition_question_id];
  if (ans === undefined || ans === null || ans === '') return false;
  if (Array.isArray(ans)) return ans.includes(question.condition_answer);
  return ans === question.condition_answer;
}

// ── Closing countdown badge ───────────────────────────────────────────────────
function ClosingBadge({ closesAt }) {
  if (!closesAt) return null;
  var now = new Date();
  var closes = new Date(closesAt);
  if (closes <= now) return null;
  var hoursLeft = (closes - now) / (1000 * 60 * 60);
  var daysLeft  = hoursLeft / 24;
  if (daysLeft > 3) return null;
  var label = hoursLeft < 24
    ? 'Closes in ' + Math.ceil(hoursLeft) + 'h'
    : 'Closes in ' + Math.ceil(daysLeft) + 'd';
  var cls = hoursLeft < 24
    ? 'bg-red-50 text-red-600 border-red-200'
    : 'bg-orange-50 text-orange-600 border-orange-200';
  return (
    <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ' + cls}>
      <Icon path={ICONS.clock} className="h-3 w-3" />{label}
    </span>
  );
}

// ── Response rate bar ─────────────────────────────────────────────────────────
function ResponseBar({ count, total }) {
  if (!total || total === 0) return null;
  var pct = Math.min(100, Math.round((count / total) * 100));
  var barCls = pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-orange-400';
  return (
    <div className="mt-3 mb-1">
      <div className="flex justify-between text-xs mb-1 text-[#64748B]">
        <span>{count} of {total} members responded</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-gray-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={'h-1.5 rounded-full transition-all ' + barCls} style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

// ── SurveyCard ────────────────────────────────────────────────────────────────
function SurveyCard({ survey, onDelete, onSurveyUpdated, onDuplicate, onEdit, isAdmin, memberCount }) {
  var [loading, setLoading]         = useState(false);
  var [questions, setQuestions]     = useState([]);
  var [answers, setAnswers]         = useState({});
  var [showForm, setShowForm]       = useState(false);
  var [hasResponded, setHasResponded] = useState(false);
  var [responseCount, setResponseCount] = useState(0);
  var [showResults, setShowResults] = useState(false);
  var [results, setResults]         = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(false);
  var [deleting, setDeleting]       = useState(false);
  var [duplicating, setDuplicating] = useState(false);
  var [savingTemplate, setSavingTemplate] = useState(false);
  var [formError, setFormError]     = useState(null);
  var [chartMode, setChartMode]     = useState('bar');
  var [reminding, setReminding]     = useState(false);

  var isExpired = survey.closes_at && new Date(survey.closes_at) < new Date();
  var isClosed  = survey.status === 'closed' || isExpired;
  var isUrgent  = !isClosed && survey.closes_at && ((new Date(survey.closes_at) - new Date()) / (1000*60*60)) <= 72;
  var canSeeResults = isAdmin || isClosed || hasResponded;
  var effectiveVisibility = isAdmin ? 'full' : (survey.result_visibility || 'full');
  var responseRate = memberCount > 0 ? Math.round((responseCount / memberCount) * 100) : null;

  useEffect(function() {
    if (survey) { loadQuestions(); checkUserResponse(); loadResponseCount(); }
  }, [survey.id]);

  async function loadQuestions() {
    try {
      var r = await supabase.from('survey_questions').select('*').eq('survey_id', survey.id).order('order_number');
      if (r.error) throw r.error;
      var qs = r.data || [];
      setQuestions(qs);
      var init = {};
      qs.forEach(function(q) { init[q.id] = q.question_type === 'multiple_choice' ? [] : ''; });
      setAnswers(init);
    } catch (err) { console.error('Error loading questions:', err); }
  }

  async function checkUserResponse() {
    try {
      var auth = await supabase.auth.getUser();
      if (!auth.data.user) return;
      var r = await supabase.from('survey_responses').select('id').eq('survey_id', survey.id).eq('member_id', auth.data.user.id).maybeSingle();
      if (r.error) throw r.error;
      setHasResponded(!!r.data);
    } catch (err) { console.error('Error checking response:', err); }
  }

  async function loadResponseCount() {
    try {
      var r = await supabase.from('survey_responses').select('*', { count:'exact', head:true }).eq('survey_id', survey.id);
      if (r.error) throw r.error;
      setResponseCount(r.count || 0);
    } catch (err) { console.error('Error loading count:', err); }
  }

  async function loadResults() {
    try {
      setLoading(true);
      var respR = await supabase.from('survey_responses').select('id').eq('survey_id', survey.id);
      if (respR.error) throw respR.error;
      var responses = respR.data || [];
      if (responses.length === 0) { setResults({ questions:[], totalResponses:0 }); return; }

      var ansR = await supabase.from('survey_answers').select('*').in('response_id', responses.map(function(r) { return r.id; }));
      if (ansR.error) throw ansR.error;
      var allAnswers = ansR.data || [];

      var questionResults = questions.map(function(question) {
        var qAnswers = allAnswers.filter(function(a) { return a.question_id === question.id; });
        if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
          var counts = {};
          question.options.forEach(function(opt) { counts[opt] = 0; });
          qAnswers.forEach(function(a) {
            if (question.question_type === 'multiple_choice') {
              var sel = a.answer_text ? JSON.parse(a.answer_text) : [];
              sel.forEach(function(opt) { if (counts.hasOwnProperty(opt)) counts[opt]++; });
            } else { if (counts.hasOwnProperty(a.answer_text)) counts[a.answer_text]++; }
          });
          return { question:question.question_text, type:question.question_type,
            options: question.options.map(function(opt) {
              return { option:opt, count:counts[opt], percentage:responses.length > 0 ? Math.round((counts[opt]/responses.length)*100) : 0 };
            }) };
        }
        if (question.question_type === 'rating') {
          var ratings = qAnswers.map(function(a) { return parseInt(a.answer_text); }).filter(function(r) { return !isNaN(r); });
          var avg = ratings.length > 0 ? (ratings.reduce(function(s,r){return s+r;},0)/ratings.length).toFixed(1) : 0;
          var rCounts = {1:0,2:0,3:0,4:0,5:0};
          ratings.forEach(function(r) { if (rCounts.hasOwnProperty(r)) rCounts[r]++; });
          return { question:question.question_text, type:'rating', average:avg, totalRatings:ratings.length,
            distribution:Object.entries(rCounts).map(function(e) {
              return { rating:parseInt(e[0]), count:e[1], percentage:ratings.length>0?Math.round((e[1]/ratings.length)*100):0 };
            }) };
        }
        return { question:question.question_text, type:question.question_type,
          responses:qAnswers.map(function(a){return a.answer_text;}).filter(Boolean) };
      });
      setResults({ questions:questionResults, totalResponses:responses.length });
    } catch (err) {
      console.error('Error loading results:', err);
      mascotErrorToast('Failed to load results.', 'Please try again.');
    } finally { setLoading(false); }
  }

  var handleAnswerChange = useCallback(function(questionId, value, questionType) {
    if (questionType === 'multiple_choice') {
      setAnswers(function(prev) {
        var cur = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        var next = cur.includes(value) ? cur.filter(function(v){return v!==value;}) : cur.concat([value]);
        return Object.assign({}, prev, { [questionId]:next });
      });
    } else { setAnswers(function(prev){return Object.assign({},prev,{[questionId]:value});}); }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(null);
    var visibleQuestions = questions.filter(function(q) { return shouldShowQuestion(q, answers, questions); });
    for (var i = 0; i < visibleQuestions.length; i++) {
      var q = visibleQuestions[i];
      if (q.required) {
        var ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          var msg = 'Please answer: ' + q.question_text;
          setFormError(msg); toast.error(msg); return;
        }
      }
    }
    setLoading(true);
    var lt = toast.loading('Submitting survey...');
    try {
      var auth = await supabase.auth.getUser();
      if (!auth.data.user) throw new Error('You must be logged in.');
      if (!survey.allow_multiple_responses && hasResponded) throw new Error('You have already responded.');
      var rR = await supabase.from('survey_responses')
        .insert({ survey_id:survey.id, member_id:survey.anonymous_responses?null:auth.data.user.id })
        .select().single();
      if (rR.error) throw rR.error;
      var inserts = questions.map(function(q) {
        var at = answers[q.id];
        if (q.question_type === 'multiple_choice') at = JSON.stringify(at||[]);
        else if (q.question_type === 'date' && at) at = new Date(at).toISOString();
        return { response_id:rR.data.id, question_id:q.id, answer_text:at||null };
      });
      var aR = await supabase.from('survey_answers').insert(inserts);
      if (aR.error) throw aR.error;
      toast.dismiss(lt);
      mascotSuccessToast('Survey submitted!', 'Thank you for your response.');
      setShowForm(false); setHasResponded(true); loadResponseCount();
      if (survey.show_results_after_submission) { setShowResults(true); loadResults(); }
    } catch (err) {
      toast.dismiss(lt); console.error('Error submitting:', err);
      mascotErrorToast('Failed to submit survey.', err.message);
    } finally { setLoading(false); }
  }

  async function handlePin() {
    try {
      var next = !survey.is_pinned;
      var r = await supabase.from('surveys').update({ is_pinned:next }).eq('id', survey.id);
      if (r.error) throw r.error;
      mascotSuccessToast(next ? 'Survey pinned.' : 'Survey unpinned.');
      if (onSurveyUpdated) onSurveyUpdated(Object.assign({}, survey, { is_pinned:next }));
    } catch (err) { mascotErrorToast('Failed to update survey.'); }
  }

  async function handleToggleStatus() {
    try {
      var next = isClosed ? 'active' : 'closed';
      var r = await supabase.from('surveys').update({ status:next }).eq('id', survey.id);
      if (r.error) throw r.error;
      mascotSuccessToast(next==='closed' ? 'Survey closed.' : 'Survey reopened.');
      if (onSurveyUpdated) onSurveyUpdated(Object.assign({}, survey, { status:next }));
    } catch (err) { mascotErrorToast('Failed to update survey status.'); }
  }

  async function handleDuplicate() {
    if (duplicating) return;
    setDuplicating(true);
    try {
      var auth = await supabase.auth.getUser();
      var user = auth.data.user;
      var sR = await supabase.from('surveys').insert({
        organization_id: survey.organization_id,
        title: survey.title + ' (Copy)',
        description: survey.description,
        anonymous_responses: survey.anonymous_responses,
        allow_multiple_responses: survey.allow_multiple_responses,
        show_results_after_submission: survey.show_results_after_submission,
        closes_at: null, retention_days: survey.retention_days,
        result_visibility: survey.result_visibility || 'full',
        visibility: survey.visibility, status: 'active',
        is_pinned: false, created_by: user.id, approval_status: 'approved',
      }).select().single();
      if (sR.error) throw sR.error;
      var qR = await supabase.from('survey_questions').select('*').eq('survey_id', survey.id).order('order_number');
      if (qR.error) throw qR.error;
      if (qR.data && qR.data.length > 0) {
        var qInserts = qR.data.map(function(q) {
          return { survey_id:sR.data.id, question_text:q.question_text, question_type:q.question_type,
            required:q.required, options:q.options, order_number:q.order_number,
            condition_question_id:null, condition_answer:null };
        });
        var qiR = await supabase.from('survey_questions').insert(qInserts);
        if (qiR.error) throw qiR.error;
      }
      mascotSuccessToast('Survey duplicated!', survey.title + ' (Copy) created.');
      if (onDuplicate) onDuplicate(sR.data);
    } catch (err) { mascotErrorToast('Failed to duplicate survey.', err.message); }
    finally { setDuplicating(false); }
  }

  async function handleSaveAsTemplate() {
    setSavingTemplate(true);
    try {
      var auth = await supabase.auth.getUser();
      var user = auth.data.user;

      // Fetch questions fresh
      var qR = await supabase.from('survey_questions').select('*').eq('survey_id', survey.id).order('order_number');
      if (qR.error) throw qR.error;
      var templateQuestions = (qR.data || []).map(function(q) {
        return { question_text: q.question_text, question_type: q.question_type,
          required: q.required, options: q.options || [] };
      });
      var templateData = {
        title:                         survey.title,
        description:                   survey.description || '',
        anonymous_responses:           survey.anonymous_responses,
        allow_multiple_responses:      survey.allow_multiple_responses,
        show_results_after_submission: survey.show_results_after_submission,
        result_visibility:             survey.result_visibility || 'full',
        visibility:                    survey.visibility || 'all_members',
        questions:                     templateQuestions,
      };

      // Check for an existing template with the same name in this org
      var dupR = await supabase.from('poll_survey_templates')
        .select('id, name')
        .eq('organization_id', survey.organization_id)
        .eq('type', 'survey')
        .ilike('name', survey.title)
        .maybeSingle();
      if (dupR.error) throw dupR.error;

      if (dupR.data) {
        // Duplicate found — ask the user what to do
        var choice = window.confirm(
          'A template named "' + dupR.data.name + '" already exists.\n\n' +
          'Click OK to replace it, or Cancel to save as a new copy.'
        );
        if (choice) {
          // Replace existing template
          var upR = await supabase.from('poll_survey_templates')
            .update({ name: survey.title, template_data: templateData })
            .eq('id', dupR.data.id);
          if (upR.error) throw upR.error;
          mascotSuccessToast('Template updated!', '"' + survey.title + '" has been replaced.');
          return;
        }
        // Fall through to save as copy with "(2)", "(3)", etc.
        var copyName = survey.title + ' (2)';
        var n = 2;
        // Keep incrementing until the name is free
        var checkLoop = true;
        while (checkLoop) {
          var cR = await supabase.from('poll_survey_templates')
            .select('id')
            .eq('organization_id', survey.organization_id)
            .eq('type', 'survey')
            .ilike('name', copyName)
            .maybeSingle();
          if (cR.error) throw cR.error;
          if (!cR.data) { checkLoop = false; }
          else { n++; copyName = survey.title + ' (' + n + ')'; }
        }
        templateData.title = copyName;
        var insR = await supabase.from('poll_survey_templates').insert({
          organization_id: survey.organization_id,
          type:            'survey',
          name:            copyName,
          template_data:   templateData,
          created_by:      user.id,
        });
        if (insR.error) throw insR.error;
        mascotSuccessToast('Template saved!', '"' + copyName + '" saved as a new template.');
        return;
      }

      // No duplicate — plain insert
      var r = await supabase.from('poll_survey_templates').insert({
        organization_id: survey.organization_id,
        type:            'survey',
        name:            survey.title,
        template_data:   templateData,
        created_by:      user.id,
      });
      if (r.error) throw r.error;
      mascotSuccessToast('Template saved!', '"' + survey.title + '" saved as a template.');
    } catch (err) {
      mascotErrorToast('Failed to save template.', err.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleRemind() {
    setReminding(true);
    try {
      // Get all active members
      var memR = await supabase.from('memberships').select('member_id')
        .eq('organization_id', survey.organization_id).eq('status', 'active');
      if (memR.error) throw memR.error;
      var allMemberIds = (memR.data || []).map(function(m) { return m.member_id; });

      // Get members who already responded
      var respR = await supabase.from('survey_responses').select('member_id').eq('survey_id', survey.id);
      if (respR.error) throw respR.error;
      var respondedIds = new Set((respR.data || []).map(function(r) { return r.member_id; }));

      var nonRespondents = allMemberIds.filter(function(id) { return !respondedIds.has(id); });
      if (nonRespondents.length === 0) {
        toast.error('All members have already responded.');
        return;
      }

var nonRespondents = allMemberIds.filter(function(id) {
  return id != null && !respondedIds.has(id);
});
if (nonRespondents.length === 0) {
  toast.error('All members have already responded.');
  return;
}

var notifications = nonRespondents.map(function(memberId) {
  return {
    user_id:         memberId,   // ← fixed
    organization_id: survey.organization_id,
    type:            'announcement',
    title:           'Survey reminder: ' + survey.title,
    message:         'You have not yet responded to this survey. Your feedback matters!',
    read:            false,
  };
});

      var nR = await supabase.from('notifications').insert(notifications);
      if (nR.error) throw nR.error;
      mascotSuccessToast('Reminders sent!', nonRespondents.length + ' member' + (nonRespondents.length !== 1 ? 's' : '') + ' notified.');
    } catch (err) {
      mascotErrorToast('Failed to send reminders.', err.message);
    } finally {
      setReminding(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      var r = await supabase.from('surveys').delete().eq('id', survey.id);
      if (r.error) throw r.error;
      if (onDelete) onDelete();
    } catch (err) {
      mascotErrorToast('Failed to delete survey.', 'Please try again.');
      setDeleting(false); setConfirmDelete(false);
    }
  }

  function handleExportCSV() {
    if (!results) return;
    var rows = [['Question', 'Type', 'Option / Response', 'Count', 'Percentage']];
    results.questions.forEach(function(result) {
      if (result.type === 'single_choice' || result.type === 'multiple_choice') {
        result.options.forEach(function(opt) {
          rows.push([result.question, result.type, opt.option, opt.count, opt.percentage + '%']);
        });
      } else if (result.type === 'rating') {
        rows.push([result.question, 'rating', 'Average', result.average, result.totalRatings + ' ratings']);
        result.distribution.forEach(function(d) {
          rows.push([result.question, 'rating', d.rating + ' stars', d.count, d.percentage + '%']);
        });
      } else {
        result.responses.forEach(function(resp) {
          rows.push([result.question, result.type, resp, '', '']);
        });
      }
    });
    var csv = rows.map(function(row) {
      return row.map(function(cell) { return '"' + String(cell || '').replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type:'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = survey.title.replace(/[^a-z0-9]/gi,'_').toLowerCase() + '_results.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  var canTakeSurvey = !isClosed && (!hasResponded || survey.allow_multiple_responses);
  var visibleQuestions = questions.filter(function(q) { return shouldShowQuestion(q, answers, questions); });

  // Urgent card border
  var borderCls = survey.is_pinned
    ? 'border-[#F5B731] border-2'
    : isUrgent
      ? 'border-orange-300 border-2'
      : 'border-slate-200';

  return (
    <article className={'rounded-xl border p-5 bg-white ' + borderCls} aria-label={survey.title + ' survey'}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {survey.is_pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                <Icon path={ICONS.pin} className="h-3 w-3" />Pinned
              </span>
            )}
            {isClosed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                <Icon path={ICONS.lock} className="h-3 w-3" />Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <Icon path={ICONS.check} className="h-3 w-3" />Active
              </span>
            )}
            <ClosingBadge closesAt={survey.closes_at} />
            {hasResponded && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                <Icon path={ICONS.check} className="h-3 w-3" />Responded
              </span>
            )}
            {survey.anonymous_responses && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                <Icon path={ICONS.user} className="h-3 w-3" />Anonymous
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              <Icon path={ICONS.users} className="h-3 w-3" />
              {responseCount} {responseCount===1?'Response':'Responses'}
              {responseRate !== null && ' (' + responseRate + '%)'}
            </span>
            {questions.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                <Icon path={ICONS.question} className="h-3 w-3" />
                {questions.length} {questions.length===1?'Question':'Questions'}
              </span>
            )}
            {survey.closes_at && !isUrgent && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                <Icon path={ICONS.clock} className="h-3 w-3" />
                {isClosed?'Closed':'Closes'} {format(new Date(survey.closes_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[#0E1523]">{survey.title}</h3>
          {survey.description && <p className="text-sm mt-1 text-[#475569]">{survey.description}</p>}
          {/* Response rate bar — admin only, active surveys */}
          {isAdmin && !isClosed && memberCount > 0 && (
            <ResponseBar count={responseCount} total={memberCount} />
          )}
        </div>

        {isAdmin && !confirmDelete && (
          <button onClick={handleDelete}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors flex-shrink-0"
            aria-label={'Delete survey: ' + survey.title}>
            <Icon path={ICONS.trash} className="h-4 w-4" />
          </button>
        )}
        {isAdmin && confirmDelete && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={function(){setConfirmDelete(false);}}
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
          <button onClick={handlePin}
            className={'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ' + (survey.is_pinned ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}
            aria-label={survey.is_pinned ? 'Unpin survey' : 'Pin survey'}>
            <Icon path={survey.is_pinned ? ICONS.pinOff : ICONS.pin} className="h-3.5 w-3.5" />
            {survey.is_pinned ? 'Unpin' : 'Pin'}
          </button>
          <button onClick={handleToggleStatus}
            className={'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 ' + (isClosed ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}>
            <Icon path={isClosed ? ICONS.unlock : ICONS.lock} className="h-3.5 w-3.5" />
            {isClosed ? 'Reopen' : 'Close Now'}
          </button>
          {/* Edit button — available on all surveys (title/description/settings can always be updated) */}
          {onEdit && (
            <button onClick={function() { onEdit(survey); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
              <Icon path={ICONS.pencil} className="h-3.5 w-3.5" />Edit
            </button>
          )}
          <button onClick={handleDuplicate} disabled={duplicating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
            <Icon path={ICONS.copy} className="h-3.5 w-3.5" />
            {duplicating ? 'Copying...' : 'Duplicate'}
          </button>
          {/* Save as Template */}
          <button onClick={handleSaveAsTemplate} disabled={savingTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
            <Icon path={ICONS.template} className="h-3.5 w-3.5" />
            {savingTemplate ? 'Saving...' : 'Save as Template'}
          </button>
          {/* Remind non-respondents — active surveys only */}
          {!isClosed && (
            <button onClick={handleRemind} disabled={reminding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50">
              <Icon path={ICONS.bell} className="h-3.5 w-3.5" />
              {reminding ? 'Sending...' : 'Remind'}
            </button>
          )}
          {results && results.totalResponses > 0 && (
            <button onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
              <Icon path={ICONS.download} className="h-3.5 w-3.5" />Export CSV
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        {canTakeSurvey && !showForm && (
          <button onClick={function(){ setShowForm(true); setFormError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            <Icon path={ICONS.clipboard} className="h-4 w-4" />Take Survey
          </button>
        )}
        {canSeeResults && (
          <button onClick={function(){
              if (!showResults) { setShowResults(true); loadResults(); }
              else { setShowResults(false); }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
            <Icon path={showResults ? ICONS.eyeOff : ICONS.eye} className="h-4 w-4" />
            {showResults ? 'Hide Results' : 'View Results'}
          </button>
        )}
      </div>

      {/* Survey form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-t mt-2 pt-5 space-y-6 border-slate-100" noValidate>
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
              <Icon path={ICONS.x} className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          {visibleQuestions.map(function(question, index) {
            var hasCondition = !!question.condition_question_id;
            return (
              <div key={question.id} className={'space-y-2 ' + (hasCondition ? 'pl-4 border-l-2 border-blue-200' : '')}>
                {hasCondition && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-semibold">
                    <Icon path={ICONS.filter} className="h-3 w-3" />Conditional question
                  </span>
                )}
                <label htmlFor={'sq-' + question.id} className="block text-sm font-semibold text-[#0E1523]">
                  {index + 1}. {question.question_text}
                  {question.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
                  {question.required && <span className="sr-only"> (required)</span>}
                </label>

                {question.question_type === 'text' && (
                  <input id={'sq-'+question.id} type="text" value={answers[question.id]||''}
                    onChange={function(e){handleAnswerChange(question.id,e.target.value,'text');}}
                    required={question.required} aria-required={question.required}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
                )}
                {question.question_type === 'textarea' && (
                  <textarea id={'sq-'+question.id} value={answers[question.id]||''}
                    onChange={function(e){handleAnswerChange(question.id,e.target.value,'textarea');}}
                    rows={4} required={question.required} aria-required={question.required}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900" />
                )}
                {question.question_type === 'single_choice' && (
                  <div className="space-y-2" role="radiogroup">
                    {question.options.map(function(option, oi) {
                      var rid = 'sq-'+question.id+'-opt-'+oi;
                      return (
                        <label key={oi} htmlFor={rid}
                          className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ' + (answers[question.id]===option?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}>
                          <input id={rid} type="radio" name={'sq-'+question.id} value={option}
                            checked={answers[question.id]===option}
                            onChange={function(e){handleAnswerChange(question.id,e.target.value,'single_choice');}}
                            required={question.required}
                            className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500" />
                          <span className="text-sm font-medium text-[#0E1523]">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {question.question_type === 'multiple_choice' && (
                  <div className="space-y-2" role="group">
                    {question.options.map(function(option, oi) {
                      var cid = 'sq-'+question.id+'-opt-'+oi;
                      var isChecked = Array.isArray(answers[question.id]) && answers[question.id].includes(option);
                      return (
                        <label key={oi} htmlFor={cid}
                          className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ' + (isChecked?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}>
                          <input id={cid} type="checkbox" checked={isChecked}
                            onChange={function(){handleAnswerChange(question.id,option,'multiple_choice');}}
                            className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded" />
                          <span className="text-sm font-medium text-[#0E1523]">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {question.question_type === 'rating' && (
                  <StarRating value={parseInt(answers[question.id])||0}
                    onChange={function(v){handleAnswerChange(question.id,v,'rating');}} />
                )}
                {question.question_type === 'date' && (
                  <input id={'sq-'+question.id} type="date" value={answers[question.id]||''}
                    onChange={function(e){handleAnswerChange(question.id,e.target.value,'date');}}
                    required={question.required} aria-required={question.required}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" />
                )}
              </div>
            );
          })}

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={function(){setShowForm(false);setFormError(null);}} disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
              {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />Submitting...</> : 'Submit Survey'}
            </button>
          </div>
        </form>
      )}

      {/* Results */}
      {showResults && (
        <div className="border-t mt-4 pt-5 space-y-4 border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon path={ICONS.chart} className="h-5 w-5 text-blue-500" />
              <h4 className="font-bold text-[#0E1523]">
                {'Results \u2014 ' + (results?results.totalResponses:0) + ' ' + (results&&results.totalResponses===1?'Response':'Responses')}
              </h4>
            </div>
            {results && results.totalResponses > 0 && (
              <div className="flex items-center gap-1">
                <button onClick={function(){setChartMode('bar');}}
                  className={'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ' + (chartMode==='bar'?'bg-blue-50 text-blue-600':'text-gray-400 hover:bg-gray-100')}
                  aria-label="Bar chart" aria-pressed={chartMode==='bar'}>
                  <Icon path={ICONS.barChart} className="h-4 w-4" />
                </button>
                <button onClick={function(){setChartMode('pie');}}
                  className={'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ' + (chartMode==='pie'?'bg-blue-50 text-blue-600':'text-gray-400 hover:bg-gray-100')}
                  aria-label="Pie chart" aria-pressed={chartMode==='pie'}>
                  <Icon path={ICONS.pieChart} className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button onClick={handleExportCSV}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Export results as CSV">
                    <Icon path={ICONS.download} className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {effectiveVisibility === 'none' && !isAdmin ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Icon path={ICONS.eyeOff} className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-[#64748B]">Results are not shared for this survey.</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1,2,3].map(function(i){return <div key={i} className="h-16 rounded-lg animate-pulse bg-gray-100" />;})}
            </div>
          ) : !results || results.totalResponses === 0 ? (
            <div className="text-center py-8 rounded-lg bg-slate-50">
              <Icon path={ICONS.chart} className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-[#64748B]">No responses yet.</p>
            </div>
          ) : effectiveVisibility === 'summary' ? (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm font-semibold text-[#0E1523]">{results.totalResponses} response{results.totalResponses!==1?'s':''} collected</p>
              <p className="text-xs text-[#64748B] mt-1">Full results are not shared for this survey.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {results.questions.map(function(result, index) {
                return (
                  <div key={index} className="rounded-lg p-4 border bg-slate-50 border-slate-200">
                    <h5 className="text-sm font-bold mb-3 text-[#0E1523]">{index+1}. {result.question}</h5>
                    {result.type === 'rating' && (
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-[#F5B731]">{result.average}</span>
                          <span className="text-sm text-[#64748B]">/ 5 &middot; {result.totalRatings} rating{result.totalRatings!==1?'s':''}</span>
                        </div>
                        {chartMode === 'pie' ? (
                          <DonutChart labels={result.distribution.map(function(d){return d.rating+' stars';})}
                            values={result.distribution.map(function(d){return d.count;})} total={result.totalRatings} />
                        ) : (
                          <div className="space-y-1.5">
                            {result.distribution.map(function(d) {
                              return (
                                <div key={d.rating} className="flex items-center gap-2">
                                  <span className="w-8 text-xs text-right flex-shrink-0 text-[#64748B]">{d.rating}</span>
                                  <Icon path={ICONS.star} className="h-3.5 w-3.5 text-[#F5B731] flex-shrink-0" />
                                  <div className="flex-1 rounded-full h-2 overflow-hidden bg-gray-200">
                                    <div className="bg-[#F5B731] h-2 rounded-full" style={{width:d.percentage+'%'}} />
                                  </div>
                                  <span className="w-20 text-xs flex-shrink-0 text-[#64748B]">{d.count} ({d.percentage}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {(result.type==='single_choice'||result.type==='multiple_choice') && (
                      chartMode === 'pie' ? (
                        <DonutChart labels={result.options.map(function(o){return o.option;})}
                          values={result.options.map(function(o){return o.count;})} total={results.totalResponses} />
                      ) : (
                        <div className="space-y-2">
                          {result.options.map(function(opt,oi) {
                            return (
                              <div key={oi}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-[#475569]">{opt.option}</span>
                                  <span className="text-[#64748B]">{opt.count} ({opt.percentage}%)</span>
                                </div>
                                <div className="rounded-full h-2 overflow-hidden bg-gray-200">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{width:opt.percentage+'%'}} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                    {(result.type==='text'||result.type==='textarea'||result.type==='date') && (
                      <div className="space-y-2">
                        {result.responses.length===0 ? (
                          <p className="text-sm italic text-[#64748B]">No responses yet.</p>
                        ) : result.responses.map(function(resp,ri) {
                          return <div key={ri} className="text-sm p-3 rounded-lg border bg-white border-gray-200 text-gray-700">{resp}</div>;
                        })}
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