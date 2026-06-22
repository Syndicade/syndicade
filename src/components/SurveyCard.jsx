import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { notifyUsers } from '../lib/notificationService';
import { useDropdownKeyboard } from '../hooks/useModalKeyboard';
import ConfirmDeleteModal from './ConfirmModal';

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
  clock:     'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  star:      'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  x:         'M6 18L18 6M6 6l12 12',
  chart:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  eyeOff:    ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  eye:       ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  pieChart:  ['M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z', 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'],
  barChart:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  download:  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  filter:    'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  chevUp:    'M5 15l7-7 7 7',
  chevDown:  'M19 9l-7 7-7-7',
  pin:       ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
};

var CHART_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16'];

// ── ActionsDropdown ───────────────────────────────────────────────────────────
// Uses position:fixed so it escapes card overflow/clipping in both collapsed
// and expanded states. Keyboard (Escape/outside-click/Arrow/Home/End/focus-return)
// is handled by useDropdownKeyboard; the dynamic up/down position-flip is custom
// (the hook doesn't cover that), same pattern as PollCard.
function ActionsDropdown({ survey, isClosed, duplicating, reminding, onEdit, onPin, onToggleStatus, onDuplicate, onRemind, onSaveTemplate, onExportCSV, onRequestDelete, canExport }) {
  var [open, setOpen] = useState(false);
  var [menuStyle, setMenuStyle] = useState({});
  var containerRef = useRef(null); // wraps trigger + menu — required by useDropdownKeyboard
  var triggerRef = useRef(null);
  var menuRef = useRef(null);

  function calcMenuPosition() {
    if (!triggerRef.current) return;
    var rect = triggerRef.current.getBoundingClientRect();
    var menuHeight = 260; // generous estimate
    var spaceBelow = window.innerHeight - rect.bottom;
    var openUpward = spaceBelow < menuHeight && rect.top > menuHeight;
    if (openUpward) {
      setMenuStyle({ position:'fixed', bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, top:'auto' });
    } else {
      setMenuStyle({ position:'fixed', top: rect.bottom + 4, right: window.innerWidth - rect.right, bottom:'auto' });
    }
  }

  useEffect(function() {
    if (!open) return;
    calcMenuPosition();
    window.addEventListener('scroll', calcMenuPosition, true);
    window.addEventListener('resize', calcMenuPosition);
    return function() {
      window.removeEventListener('scroll', calcMenuPosition, true);
      window.removeEventListener('resize', calcMenuPosition);
    };
  }, [open]);

  useEffect(function() {
    if (open && menuRef.current) { var first = menuRef.current.querySelector('[role="menuitem"]:not([disabled])'); if (first) first.focus(); }
  }, [open]);

  function closeMenu() { setOpen(false); }
  useDropdownKeyboard(open, closeMenu, containerRef);

  function action(fn) { return function() { setOpen(false); fn(); }; }

  var menuItemBase = { display:'block', width:'100%', textAlign:'left', padding:'7px 14px', fontSize:'13px', fontWeight:500, color:'#475569', background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap' };
  var menuItemCls = 'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400';
  var deleteItemCls = 'hover:bg-red-50 focus:bg-red-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-400';

  return (
    <div ref={containerRef} style={{display:'inline-block'}}>
      <button ref={triggerRef}
        onClick={function(e) { e.stopPropagation(); setOpen(function(v) { return !v; }); }}
        aria-haspopup="true" aria-expanded={open}
        aria-label={'Actions for survey: ' + survey.title}
        style={{fontSize:'12px',fontWeight:500,color:'#475569',background:'#F8FAFC',border:'0.5px solid #E2E8F0',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px'}}
        className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors">
        Actions ▾
      </button>

      {open && (
        <div ref={menuRef} role="menu" aria-label={'Survey actions for ' + survey.title}
          style={Object.assign({background:'#FFFFFF',border:'0.5px solid #E2E8F0',borderRadius:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.12)',minWidth:'160px',zIndex:9999,padding:'4px 0'}, menuStyle)}>

          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(function(){ onEdit(survey); })}>Edit</button>
          <button role="menuitem" style={menuItemBase} className={menuItemCls} disabled={duplicating} onClick={action(onDuplicate)} aria-disabled={duplicating}>{duplicating ? 'Duplicating...' : 'Duplicate'}</button>
          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onSaveTemplate)}>Make Template</button>
          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onPin)}>{survey.is_pinned ? 'Unpin' : 'Pin'}</button>
          {!isClosed && <button role="menuitem" style={menuItemBase} className={menuItemCls} disabled={reminding} onClick={action(onRemind)} aria-disabled={reminding}>{reminding ? 'Sending...' : 'Remind'}</button>}
          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onToggleStatus)}>{isClosed ? 'Reopen' : 'Close'}</button>
          {canExport && <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onExportCSV)}>Export CSV</button>}

          <div style={{borderTop:'0.5px solid #E2E8F0',margin:'4px 0'}} role="separator" />

          <button role="menuitem" style={Object.assign({},menuItemBase,{color:'#EF4444'})} className={deleteItemCls} onClick={action(onRequestDelete)}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
var CHART_COLORS_REF = CHART_COLORS;

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
    segments.push({ d:d, color:CHART_COLORS_REF[i % CHART_COLORS_REF.length], label:label, pct:pct, count:values[i] });
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
        {segments.map(function(s,i) { return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:s.color}} aria-hidden="true" />
            <span className="text-[#475569] flex-1 truncate">{s.label}</span>
            <span className="text-[#64748B] font-semibold tabular-nums">{s.count} ({s.pct}%)</span>
          </div>
        ); })}
      </div>
    </div>
  );
}

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

function shouldShowQuestion(question, answers, allQuestions) {
  if (!question.condition_question_id) return true;
  var condQ = allQuestions.find(function(q) { return q.id === question.condition_question_id; });
  if (!condQ) return true;
  var ans = answers[question.condition_question_id];
  if (ans === undefined || ans === null || ans === '') return false;
  if (Array.isArray(ans)) return ans.includes(question.condition_answer);
  return ans === question.condition_answer;
}

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
        <div className={'h-1.5 rounded-full transition-all ' + barCls} style={{width:pct + '%'}} />
      </div>
    </div>
  );
}

// ── SurveyCard ────────────────────────────────────────────────────────────────
function SurveyCard({ survey, onDelete, onSurveyUpdated, onDuplicate, onEdit, onRemind, isAdmin, memberCount }) {
  var [loading, setLoading]               = useState(false);
  var [questions, setQuestions]           = useState([]);
  var [answers, setAnswers]               = useState({});
  var [showForm, setShowForm]             = useState(false);
  var [hasResponded, setHasResponded]     = useState(false);
  var [responseCount, setResponseCount]   = useState(0);
  var [showResults, setShowResults]       = useState(false);
  var [results, setResults]               = useState(null);
  var [duplicating, setDuplicating]       = useState(false);
  var [formError, setFormError]           = useState(null);
  var [chartMode, setChartMode]           = useState('bar');
  var [reminding, setReminding]           = useState(false);
  var [lastRemindedAt, setLastRemindedAt] = useState(survey.last_reminded_at || null);
  var [showSaveTemplate, setShowSaveTemplate] = useState(false);
  var [templateName, setTemplateName]     = useState('');
  var [savingTemplate, setSavingTemplate] = useState(false);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Both admin and member start collapsed
  var [expanded, setExpanded]             = useState(false);

  var isExpired = survey.closes_at && new Date(survey.closes_at) < new Date();
  var isClosed  = survey.status === 'closed' || isExpired;
  var isUrgent  = !isClosed && survey.closes_at && ((new Date(survey.closes_at) - new Date()) / (1000*60*60)) <= 72;
  var canSeeResults = isAdmin || isClosed || hasResponded;
  var effectiveVisibility = isAdmin ? 'full' : (survey.result_visibility || 'full');
  var responseRate = memberCount > 0 ? Math.round((responseCount / memberCount) * 100) : null;

  useEffect(function() { setLastRemindedAt(survey.last_reminded_at || null); }, [survey.last_reminded_at]);
  useEffect(function() { if (survey) { loadQuestions(); checkUserResponse(); loadResponseCount(); } }, [survey.id]);

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
      if (!r.error) setHasResponded(!!r.data);
    } catch (err) { console.error('Error checking response:', err); }
  }

  async function loadResponseCount() {
    try {
      var r = await supabase.from('survey_responses').select('*', { count:'exact', head:true }).eq('survey_id', survey.id);
      if (!r.error) setResponseCount(r.count || 0);
    } catch (err) { console.error('Error loading count:', err); }
  }

  async function loadResults() {
    try {
      setLoading(true);
      var respR = await supabase.from('survey_responses').select('id').eq('survey_id', survey.id);
      if (respR.error) throw respR.error;
      var responses = respR.data || [];
      if (responses.length === 0) { setResults({ questions:[], totalResponses:0 }); return; }
      var ansR = await supabase.from('survey_answers').select('*').in('response_id', responses.map(function(r){ return r.id; }));
      if (ansR.error) throw ansR.error;
      var allAnswers = ansR.data || [];
      var questionResults = questions.map(function(question) {
        var qAnswers = allAnswers.filter(function(a){ return a.question_id === question.id; });
        if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
          var counts = {};
          question.options.forEach(function(opt){ counts[opt] = 0; });
          qAnswers.forEach(function(a){
            if (question.question_type === 'multiple_choice') { var sel=a.answer_text?JSON.parse(a.answer_text):[]; sel.forEach(function(opt){if(counts.hasOwnProperty(opt))counts[opt]++;}); }
            else { if(counts.hasOwnProperty(a.answer_text))counts[a.answer_text]++; }
          });
          return { question:question.question_text, type:question.question_type, options:question.options.map(function(opt){ return {option:opt,count:counts[opt],percentage:responses.length>0?Math.round((counts[opt]/responses.length)*100):0}; }) };
        }
        if (question.question_type === 'rating') {
          var ratings=qAnswers.map(function(a){return parseInt(a.answer_text);}).filter(function(r){return !isNaN(r);});
          var avg=ratings.length>0?(ratings.reduce(function(s,r){return s+r;},0)/ratings.length).toFixed(1):0;
          var rCounts={1:0,2:0,3:0,4:0,5:0};
          ratings.forEach(function(r){if(rCounts.hasOwnProperty(r))rCounts[r]++;});
          return { question:question.question_text, type:'rating', average:avg, totalRatings:ratings.length, distribution:Object.entries(rCounts).map(function(e){return{rating:parseInt(e[0]),count:e[1],percentage:ratings.length>0?Math.round((e[1]/ratings.length)*100):0};}) };
        }
        return { question:question.question_text, type:question.question_type, responses:qAnswers.map(function(a){return a.answer_text;}).filter(Boolean) };
      });
      setResults({ questions:questionResults, totalResponses:responses.length });
    } catch (err) { console.error('Error loading results:', err); mascotErrorToast('Failed to load results.', 'Please try again.'); }
    finally { setLoading(false); }
  }

  var handleAnswerChange = useCallback(function(questionId, value, questionType) {
    if (questionType === 'multiple_choice') {
      setAnswers(function(prev){ var cur=Array.isArray(prev[questionId])?prev[questionId]:[]; var next=cur.includes(value)?cur.filter(function(v){return v!==value;}):cur.concat([value]); return Object.assign({},prev,{[questionId]:next}); });
    } else { setAnswers(function(prev){return Object.assign({},prev,{[questionId]:value});}); }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(null);
    var visibleQuestions = questions.filter(function(q){ return shouldShowQuestion(q, answers, questions); });
    for (var i=0;i<visibleQuestions.length;i++) {
      var q=visibleQuestions[i];
      if(q.required){var ans=answers[q.id];if(!ans||(Array.isArray(ans)&&ans.length===0)){var msg='Please answer: '+q.question_text;setFormError(msg);toast.error(msg);return;}}
    }
    setLoading(true); var lt=toast.loading('Submitting survey...');
    try {
      var auth=await supabase.auth.getUser(); if(!auth.data.user)throw new Error('You must be logged in.');
      if(!survey.allow_multiple_responses&&hasResponded)throw new Error('You have already responded.');
      var rR=await supabase.from('survey_responses').insert({survey_id:survey.id,member_id:survey.anonymous_responses?null:auth.data.user.id}).select().single();
      if(rR.error)throw rR.error;
      var inserts=questions.map(function(q){var at=answers[q.id];if(q.question_type==='multiple_choice')at=JSON.stringify(at||[]);else if(q.question_type==='date'&&at)at=new Date(at).toISOString();return{response_id:rR.data.id,question_id:q.id,answer_text:at||null};});
      var aR=await supabase.from('survey_answers').insert(inserts); if(aR.error)throw aR.error;
      toast.dismiss(lt);
      mascotSuccessToast('Survey submitted!','Thank you for your response.');
      setShowForm(false); setHasResponded(true); loadResponseCount();
      if(survey.show_results_after_submission){setShowResults(true);loadResults();}
    } catch(err){toast.dismiss(lt);mascotErrorToast('Failed to submit survey.',err.message);}
    finally{setLoading(false);}
  }

  async function handlePin() { try{var next=!survey.is_pinned;var r=await supabase.from('surveys').update({is_pinned:next}).eq('id',survey.id);if(r.error)throw r.error;mascotSuccessToast(next?'Survey pinned.':'Survey unpinned.');if(onSurveyUpdated)onSurveyUpdated(Object.assign({},survey,{is_pinned:next}));}catch(err){mascotErrorToast('Failed to update survey.');} }
  async function handleToggleStatus() { try{var next=isClosed?'active':'closed';var r=await supabase.from('surveys').update({status:next}).eq('id',survey.id);if(r.error)throw r.error;mascotSuccessToast(next==='closed'?'Survey closed.':'Survey reopened.');if(onSurveyUpdated)onSurveyUpdated(Object.assign({},survey,{status:next}));}catch(err){mascotErrorToast('Failed to update survey status.');} }

  async function handleDuplicate() {
    if(duplicating)return;setDuplicating(true);
    try{
      var auth=await supabase.auth.getUser();var user=auth.data.user;
      var sR=await supabase.from('surveys').insert({organization_id:survey.organization_id,title:survey.title+' (Copy)',description:survey.description,anonymous_responses:survey.anonymous_responses,allow_multiple_responses:survey.allow_multiple_responses,show_results_after_submission:survey.show_results_after_submission,closes_at:null,retention_days:survey.retention_days,result_visibility:survey.result_visibility||'full',visibility:survey.visibility,status:'active',is_pinned:false,created_by:user.id,approval_status:'approved'}).select().single();
      if(sR.error)throw sR.error;
      var qR=await supabase.from('survey_questions').select('*').eq('survey_id',survey.id).order('order_number');
      if(qR.error)throw qR.error;
      if(qR.data&&qR.data.length>0){var qiR=await supabase.from('survey_questions').insert(qR.data.map(function(q){return{survey_id:sR.data.id,question_text:q.question_text,question_type:q.question_type,required:q.required,options:q.options,order_number:q.order_number,condition_question_id:null,condition_answer:null};}));if(qiR.error)throw qiR.error;}
      mascotSuccessToast('Survey duplicated!',survey.title+' (Copy) created.');
      if(onDuplicate)onDuplicate(sR.data);
    }catch(err){mascotErrorToast('Failed to duplicate survey.',err.message);}
    finally{setDuplicating(false);}
  }

  function openSaveTemplate(){setTemplateName(survey.title||'My Survey Template');setShowSaveTemplate(true);}

  async function handleSaveAsTemplate() {
    var name=templateName.trim();if(!name){toast.error('Template name cannot be empty.');return;}setSavingTemplate(true);
    try{
      var auth=await supabase.auth.getUser();var user=auth.data.user;
      var qR=await supabase.from('survey_questions').select('*').eq('survey_id',survey.id).order('order_number');if(qR.error)throw qR.error;
      var templateQuestions=(qR.data||[]).map(function(q){return{question_text:q.question_text,question_type:q.question_type,required:q.required,options:q.options||[]};});
      var r=await supabase.from('poll_survey_templates').insert({organization_id:survey.organization_id,type:'survey',name:name,template_data:{title:survey.title,description:survey.description||'',anonymous_responses:survey.anonymous_responses,allow_multiple_responses:survey.allow_multiple_responses,show_results_after_submission:survey.show_results_after_submission,result_visibility:survey.result_visibility||'full',visibility:survey.visibility||'all_members',questions:templateQuestions},created_by:user.id});
      if(r.error)throw r.error;
      mascotSuccessToast('Template saved!','"'+name+'" added to your templates.');
      setShowSaveTemplate(false);setTemplateName('');
    }catch(err){mascotErrorToast('Failed to save template.',err.message);}
    finally{setSavingTemplate(false);}
  }

  async function handleRemind() {
    setReminding(true);var loadId=toast.loading('Sending reminders...');
    try{
      var memR=await supabase.from('memberships').select('member_id').eq('organization_id',survey.organization_id).eq('status','active');if(memR.error)throw memR.error;
      var respR=await supabase.from('survey_responses').select('member_id').eq('survey_id',survey.id);if(respR.error)throw respR.error;
      var respondedIds=new Set((respR.data||[]).map(function(r){return r.member_id;}));
      var auth=await supabase.auth.getUser();var currentUserId=auth.data.user?auth.data.user.id:null;
      var recipientIds=(memR.data||[]).map(function(m){return m.member_id;}).filter(function(id){return id!=null&&!respondedIds.has(id)&&id!==currentUserId;});
      toast.dismiss(loadId);
      if(recipientIds.length===0){toast.error('All members have already responded.');return;}
      await notifyUsers({userIds:recipientIds,organizationId:survey.organization_id,type:'new_survey',title:'Survey reminder: '+survey.title,message:'You have not yet responded to this survey. Your feedback matters!',link:'/organizations/'+survey.organization_id+'/surveys'});
      var now=new Date().toISOString();
      await supabase.from('surveys').update({last_reminded_at:now}).eq('id',survey.id);
      setLastRemindedAt(now);if(onRemind)onRemind(survey.id,now);
      window.dispatchEvent(new CustomEvent('notificationCreated'));
      mascotSuccessToast('Reminders sent!',recipientIds.length+' member'+(recipientIds.length!==1?'s':'')+' notified.');
    }catch(err){toast.dismiss(loadId);mascotErrorToast('Failed to send reminders.',err.message);}
    finally{setReminding(false);}
  }

  async function handleDelete() {
    try{var r=await supabase.from('surveys').delete().eq('id',survey.id);if(r.error)throw r.error;if(onDelete)onDelete();}
    catch(err){mascotErrorToast('Failed to delete survey.','Please try again.');}
  }

  function handleExportCSV() {
    if(!results)return;
    var rows=[['Question','Type','Option / Response','Count','Percentage']];
    results.questions.forEach(function(result){
      if(result.type==='single_choice'||result.type==='multiple_choice'){result.options.forEach(function(opt){rows.push([result.question,result.type,opt.option,opt.count,opt.percentage+'%']);});}
      else if(result.type==='rating'){rows.push([result.question,'rating','Average',result.average,result.totalRatings+' ratings']);result.distribution.forEach(function(d){rows.push([result.question,'rating',d.rating+' stars',d.count,d.percentage+'%']);});}
      else{result.responses.forEach(function(resp){rows.push([result.question,result.type,resp,'','']);});}
    });
    var csv=rows.map(function(row){return row.map(function(cell){return'"'+String(cell||'').replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=survey.title.replace(/[^a-z0-9]/gi,'_').toLowerCase()+'_results.csv';a.click();URL.revokeObjectURL(url);
  }

  var canTakeSurvey = !isClosed && (!hasResponded || survey.allow_multiple_responses);
  var visibleQuestions = questions.filter(function(q){ return shouldShowQuestion(q, answers, questions); });
  var borderCls = survey.is_pinned ? 'border-[#F5B731] border-2' : isUrgent ? 'border-orange-300 border-2' : 'border-slate-200';

  // ── Collapsed header (shared) ─────────────────────────────────────────────
  function renderCollapsedHeader() {
    return (
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none rounded-xl focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
        onClick={function(e){ if(e.target.closest('[data-no-collapse]'))return; setExpanded(function(v){return !v;}); }}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={function(e){ if(e.key===' '||e.key==='Enter'){e.preventDefault();setExpanded(function(v){return !v;});} }}
      >
        <div className="flex-shrink-0 text-[#94A3B8]">
          <Icon path={expanded ? ICONS.chevUp : ICONS.chevDown} className="h-4 w-4"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {survey.is_pinned && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">Pinned</span>}
            <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold '+(isClosed?'bg-gray-100 text-gray-600':'bg-green-100 text-green-700')}>{isClosed?'Closed':'Active'}</span>
            {isUrgent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                {((new Date(survey.closes_at)-new Date())/(1000*60*60))<24
                  ?'Closes in '+Math.ceil((new Date(survey.closes_at)-new Date())/(1000*60*60))+'h'
                  :'Closes in '+Math.ceil((new Date(survey.closes_at)-new Date())/(1000*60*60*24))+'d'}
              </span>
            )}
            {hasResponded && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700"><Icon path={ICONS.check} className="h-3 w-3"/>Responded</span>}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {responseCount} {responseCount===1?'Response':'Responses'}
              {responseRate!==null?' ('+responseRate+'%)':''}
            </span>
            {questions.length > 0 && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{questions.length} {questions.length===1?'Question':'Questions'}</span>}
          </div>
          <h3 style={{fontSize:'15px',fontWeight:500,color:'#0E1523',margin:0,lineHeight:1.3}}>{survey.title}</h3>
          {isAdmin && !isClosed && memberCount > 0 && <ResponseBar count={responseCount} total={memberCount}/>}
        </div>
        {isAdmin && (
          <div data-no-collapse="true" onClick={function(e){e.stopPropagation();}}>
            <ActionsDropdown
              survey={survey} isClosed={isClosed} duplicating={duplicating} reminding={reminding}
              onEdit={onEdit} onPin={handlePin} onToggleStatus={handleToggleStatus}
              onDuplicate={handleDuplicate} onRemind={handleRemind}
              onSaveTemplate={openSaveTemplate} onExportCSV={handleExportCSV}
              onRequestDelete={function(){ setShowDeleteConfirm(true); }} canExport={!!(results&&results.totalResponses>0)}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Expanded body (shared) ────────────────────────────────────────────────
  function renderExpandedBody() {
    return (
      <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">

        {survey.description && <p className="text-sm text-[#475569]">{survey.description}</p>}

        {/* Make Template inline panel — admin only */}
        {isAdmin && showSaveTemplate && (
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2" data-no-collapse="true">
            <p className="text-xs font-semibold text-[#0E1523]">Save as Template</p>
            <div className="flex items-center gap-2">
              <label htmlFor={'sname-'+survey.id} className="sr-only">Template name</label>
              <input id={'sname-'+survey.id} type="text" value={templateName} onChange={function(e){setTemplateName(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter'){e.preventDefault();handleSaveAsTemplate();}if(e.key==='Escape'){setShowSaveTemplate(false);setTemplateName('');}}} maxLength={100} autoFocus placeholder="Template name" className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900"/>
              <button type="button" onClick={handleSaveAsTemplate} disabled={savingTemplate||!templateName.trim()} className="px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">{savingTemplate?'Saving...':'Save'}</button>
              <button type="button" onClick={function(){setShowSaveTemplate(false);setTemplateName('');}} className="p-1.5 text-[#94A3B8] hover:text-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cancel"><Icon path={ICONS.x} className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}

        {/* Take Survey / View Results buttons */}
        <div className="flex gap-3">
          {canTakeSurvey && !showForm && (
            <button onClick={function(){setShowForm(true);setFormError(null);}} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              Take Survey
            </button>
          )}
          {canSeeResults && (
            <button onClick={function(){if(!showResults){setShowResults(true);loadResults();}else{setShowResults(false);}}} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
              {showResults?'Hide Results':'View Results'}
            </button>
          )}
        </div>

        {/* Survey form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="border-t mt-2 pt-5 space-y-6 border-slate-100" noValidate>
            {formError && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200" role="alert"><Icon path={ICONS.x} className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0"/><p className="text-sm text-red-700">{formError}</p></div>}
            {visibleQuestions.map(function(question,index){
              var hasCondition=!!question.condition_question_id;
              return(
                <div key={question.id} className={'space-y-2 '+(hasCondition?'pl-4 border-l-2 border-blue-200':'')}>
                  {hasCondition&&<span className="inline-flex items-center gap-1 text-xs text-blue-500 font-semibold"><Icon path={ICONS.filter} className="h-3 w-3"/>Conditional question</span>}
                  <label htmlFor={'sq-'+question.id} className="block text-sm font-semibold text-[#0E1523]">
                    {index+1}. {question.question_text}
                    {question.required&&<span className="text-red-500 ml-1" aria-hidden="true">*</span>}
                    {question.required&&<span className="sr-only"> (required)</span>}
                  </label>
                  {question.question_type==='text'&&<input id={'sq-'+question.id} type="text" value={answers[question.id]||''} onChange={function(e){handleAnswerChange(question.id,e.target.value,'text');}} required={question.required} aria-required={question.required} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"/>}
                  {question.question_type==='textarea'&&<textarea id={'sq-'+question.id} value={answers[question.id]||''} onChange={function(e){handleAnswerChange(question.id,e.target.value,'textarea');}} rows={4} required={question.required} aria-required={question.required} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900"/>}
                  {question.question_type==='single_choice'&&(
                    <div className="space-y-2" role="radiogroup">
                      {question.options.map(function(option,oi){var rid='sq-'+question.id+'-opt-'+oi;return(
                        <label key={oi} htmlFor={rid} className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all '+(answers[question.id]===option?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}>
                          <input id={rid} type="radio" name={'sq-'+question.id} value={option} checked={answers[question.id]===option} onChange={function(e){handleAnswerChange(question.id,e.target.value,'single_choice');}} required={question.required} className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500"/>
                          <span className="text-sm font-medium text-[#0E1523]">{option}</span>
                        </label>
                      );})}
                    </div>
                  )}
                  {question.question_type==='multiple_choice'&&(
                    <div className="space-y-2" role="group">
                      {question.options.map(function(option,oi){var cid='sq-'+question.id+'-opt-'+oi;var isChecked=Array.isArray(answers[question.id])&&answers[question.id].includes(option);return(
                        <label key={oi} htmlFor={cid} className={'flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all '+(isChecked?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}>
                          <input id={cid} type="checkbox" checked={isChecked} onChange={function(){handleAnswerChange(question.id,option,'multiple_choice');}} className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded"/>
                          <span className="text-sm font-medium text-[#0E1523]">{option}</span>
                        </label>
                      );})}
                    </div>
                  )}
                  {question.question_type==='rating'&&<StarRating value={parseInt(answers[question.id])||0} onChange={function(v){handleAnswerChange(question.id,v,'rating');}}/>}
                  {question.question_type==='date'&&<input id={'sq-'+question.id} type="date" value={answers[question.id]||''} onChange={function(e){handleAnswerChange(question.id,e.target.value,'date');}} required={question.required} aria-required={question.required} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"/>}
                </div>
              );
            })}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={function(){setShowForm(false);setFormError(null);}} disabled={loading} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
                {loading?<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"/>Submitting...</>:'Submit Survey'}
              </button>
            </div>
          </form>
        )}

        {/* Results */}
        {showResults && (
          <div className="border-t mt-4 pt-5 space-y-4 border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#0E1523]">{'Results \u2014 '+(results?results.totalResponses:0)+' '+(results&&results.totalResponses===1?'Response':'Responses')}</h4>
              {results&&results.totalResponses>0&&(
                <div className="flex items-center gap-1">
                  <button onClick={function(){setChartMode('bar');}} className={'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 '+(chartMode==='bar'?'bg-blue-50 text-blue-600':'text-gray-400 hover:bg-gray-100')} aria-label="Bar chart" aria-pressed={chartMode==='bar'}><Icon path={ICONS.barChart} className="h-4 w-4"/></button>
                  <button onClick={function(){setChartMode('pie');}} className={'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 '+(chartMode==='pie'?'bg-blue-50 text-blue-600':'text-gray-400 hover:bg-gray-100')} aria-label="Pie chart" aria-pressed={chartMode==='pie'}><Icon path={ICONS.pieChart} className="h-4 w-4"/></button>
                  {isAdmin&&<button onClick={handleExportCSV} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Export results as CSV"><Icon path={ICONS.download} className="h-4 w-4"/></button>}
                </div>
              )}
            </div>
            {effectiveVisibility==='none'&&!isAdmin?(
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3"><Icon path={ICONS.eyeOff} className="h-5 w-5 text-gray-400 flex-shrink-0"/><p className="text-sm text-[#64748B]">Results are not shared for this survey.</p></div>
            ):loading?(
              <div className="space-y-3">{[1,2,3].map(function(i){return<div key={i} className="h-16 rounded-lg animate-pulse bg-gray-100"/>;})}</div>
            ):!results||results.totalResponses===0?(
              <div className="text-center py-8 rounded-lg bg-slate-50"><Icon path={ICONS.chart} className="h-8 w-8 mx-auto mb-2 text-gray-300"/><p className="text-sm text-[#64748B]">No responses yet.</p></div>
            ):effectiveVisibility==='summary'?(
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200"><p className="text-sm font-semibold text-[#0E1523]">{results.totalResponses} response{results.totalResponses!==1?'s':''} collected</p><p className="text-xs text-[#64748B] mt-1">Full results are not shared for this survey.</p></div>
            ):(
              <div className="space-y-5">
                {results.questions.map(function(result,index){return(
                  <div key={index} className="rounded-lg p-4 border bg-slate-50 border-slate-200">
                    <h5 className="text-sm font-bold mb-3 text-[#0E1523]">{index+1}. {result.question}</h5>
                    {result.type==='rating'&&(
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2"><span className="text-2xl font-extrabold text-[#F5B731]">{result.average}</span><span className="text-sm text-[#64748B]">/ 5 &middot; {result.totalRatings} rating{result.totalRatings!==1?'s':''}</span></div>
                        {chartMode==='pie'?<DonutChart labels={result.distribution.map(function(d){return d.rating+' stars';})} values={result.distribution.map(function(d){return d.count;})} total={result.totalRatings}/>:(
                          <div className="space-y-1.5">{result.distribution.map(function(d){return(<div key={d.rating} className="flex items-center gap-2"><span className="w-8 text-xs text-right flex-shrink-0 text-[#64748B]">{d.rating}</span><Icon path={ICONS.star} className="h-3.5 w-3.5 text-[#F5B731] flex-shrink-0"/><div className="flex-1 rounded-full h-2 overflow-hidden bg-gray-200"><div className="bg-[#F5B731] h-2 rounded-full" style={{width:d.percentage+'%'}}/></div><span className="w-20 text-xs flex-shrink-0 text-[#64748B]">{d.count} ({d.percentage}%)</span></div>);})}</div>
                        )}
                      </div>
                    )}
                    {(result.type==='single_choice'||result.type==='multiple_choice')&&(
                      chartMode==='pie'?<DonutChart labels={result.options.map(function(o){return o.option;})} values={result.options.map(function(o){return o.count;})} total={results.totalResponses}/>:(
                        <div className="space-y-2">{result.options.map(function(opt,oi){return(<div key={oi}><div className="flex justify-between text-sm mb-1"><span className="text-[#475569]">{opt.option}</span><span className="text-[#64748B]">{opt.count} ({opt.percentage}%)</span></div><div className="rounded-full h-2 overflow-hidden bg-gray-200"><div className="bg-blue-500 h-2 rounded-full" style={{width:opt.percentage+'%'}}/></div></div>);})}</div>
                      )
                    )}
                    {(result.type==='text'||result.type==='textarea'||result.type==='date')&&(
                      <div className="space-y-2">{result.responses.length===0?<p className="text-sm italic text-[#64748B]">No responses yet.</p>:result.responses.map(function(resp,ri){return<div key={ri} className="text-sm p-3 rounded-lg border bg-white border-gray-200 text-gray-700">{resp}</div>;})}</div>
                    )}
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* Footer meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] border-t border-slate-100 pt-3">
          <span>Created {format(new Date(survey.created_at),'MMM d, yyyy')}</span>
          {survey.closes_at&&<span>{isClosed?'Closed':'Closes'} {format(new Date(survey.closes_at),'MMM d, yyyy')}</span>}
          {isAdmin&&lastRemindedAt&&<span>{'Reminded '+formatDistanceToNow(new Date(lastRemindedAt),{addSuffix:true})}</span>}
        </div>
      </div>
    );
  }

return (
  <>
    <article className={'rounded-xl border bg-white '+borderCls} aria-label={survey.title+' survey'}>
      {renderCollapsedHeader()}
      {expanded && renderExpandedBody()}
    </article>
    {showDeleteConfirm && (
      <ConfirmDeleteModal
        title="Delete this survey?"
        message={'Delete "'+survey.title+'"? This will also delete all responses. This cannot be undone.'}
        confirmLabel="Delete"
        onConfirm={function(){ setShowDeleteConfirm(false); handleDelete(); }}
        onCancel={function(){ setShowDeleteConfirm(false); }}
      />
    )}
  </>
);
}

export default SurveyCard;