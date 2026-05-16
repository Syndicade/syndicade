import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
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
  database:  ['M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3'],
  repeat:    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  filter:    'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
};

var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900';
var labelCls = 'block text-sm font-semibold text-[#0E1523] mb-2';

var QUESTION_TYPES = [
  { value:'text',            label:'Short Text' },
  { value:'textarea',        label:'Long Text' },
  { value:'single_choice',   label:'Single Choice' },
  { value:'multiple_choice', label:'Multiple Choice' },
  { value:'rating',          label:'Rating (1–5)' },
  { value:'date',            label:'Date' },
];

var RETENTION_OPTIONS = [
  { value:'',    label:'Keep forever' },
  { value:'30',  label:'30 days' },
  { value:'90',  label:'90 days' },
  { value:'365', label:'1 year' },
];

var RESULT_VISIBILITY_OPTIONS = [
  { value:'full',    label:'Full results',  desc:'Members see all responses with breakdowns' },
  { value:'summary', label:'Summary only',  desc:'Members see response count only' },
  { value:'none',    label:'Hidden',        desc:'Only admins can view results' },
];

var RECURRING_INTERVALS = [
  { value:'weekly',    label:'Weekly' },
  { value:'monthly',   label:'Monthly' },
  { value:'quarterly', label:'Quarterly' },
  { value:'yearly',    label:'Yearly' },
];

function makeQuestion(orderNumber) {
  return {
    id: Date.now() + Math.random(),
    question_text: '', question_type: 'text', required: true,
    options: [], order_number: orderNumber,
    has_condition: false, condition_question_id: null, condition_answer: '',
  };
}

function QuestionSkeleton() {
  return (
    <div className="border border-slate-200 rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="flex gap-2"><div className="h-7 w-7 bg-gray-200 rounded" /><div className="h-7 w-7 bg-gray-200 rounded" /></div>
      </div>
      <div className="h-10 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-2 gap-3"><div className="h-10 bg-gray-100 rounded-lg" /><div className="h-10 bg-gray-100 rounded-lg" /></div>
    </div>
  );
}

function CreateSurvey({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [orgRoles, setOrgRoles] = useState([]);
  var [rolesLoading, setRolesLoading] = useState(false);

  var [formData, setFormData] = useState({
    title: '', description: '',
    anonymous_responses: false, allow_multiple_responses: false, show_results_after_submission: true,
    closes_at: '', retention_days: '', visibility: 'all_members',
    result_visibility: 'full',
    is_recurring: false, recurring_interval: 'monthly', recurring_ends_at: '',
  });

  var [questions, setQuestions] = useState([makeQuestion(1)]);

  useEffect(function() {
    if (isOpen && organizationId) loadOrgRoles();
  }, [isOpen, organizationId]);

  useEffect(function() {
    function handleEscape(e) { if (e.key === 'Escape' && isOpen) handleClose(); }
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return function() { document.removeEventListener('keydown', handleEscape); };
  }, [isOpen]);

  async function loadOrgRoles() {
    setRolesLoading(true);
    try {
      var r = await supabase.from('membership_tiers').select('id, name')
        .eq('organization_id', organizationId).order('name', { ascending:true });
      if (!r.error && r.data) setOrgRoles(r.data);
    } catch (err) { console.error('Error loading roles:', err); }
    finally { setRolesLoading(false); }
  }

  function handleClose() {
    setFormData({ title:'', description:'', anonymous_responses:false, allow_multiple_responses:false,
      show_results_after_submission:true, closes_at:'', retention_days:'', visibility:'all_members',
      result_visibility:'full', is_recurring:false, recurring_interval:'monthly', recurring_ends_at:'' });
    setQuestions([makeQuestion(1)]); setError(null); onClose();
  }

  function updateForm(field, value) {
    setFormData(function(prev) { return Object.assign({}, prev, { [field]:value }); });
  }

  function addQuestion() {
    setQuestions(function(prev) { return prev.concat([makeQuestion(prev.length + 1)]); });
  }

  function removeQuestion(qId) {
    if (questions.length === 1) { setError('Survey must have at least one question'); return; }
    setQuestions(function(prev) {
      return prev.filter(function(q) { return q.id !== qId; })
        .map(function(q, i) { return Object.assign({}, q, { order_number:i+1 }); });
    });
    setError(null);
  }

  function updateQuestion(qId, field, value) {
    setQuestions(function(prev) {
      return prev.map(function(q) { return q.id === qId ? Object.assign({}, q, { [field]:value }) : q; });
    });
  }

  function moveQuestion(qId, direction) {
    var idx = questions.findIndex(function(q){return q.id===qId;});
    var nIdx = direction==='up' ? idx-1 : idx+1;
    if (nIdx < 0 || nIdx >= questions.length) return;
    var reordered = questions.slice();
    var temp = reordered[idx]; reordered[idx] = reordered[nIdx]; reordered[nIdx] = temp;
    setQuestions(reordered.map(function(q,i){return Object.assign({},q,{order_number:i+1});}));
  }

  function addOption(qId) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        return q.id===qId ? Object.assign({},q,{options:(q.options||[]).concat([''])}) : q;
      });
    });
  }

  function updateOption(qId, oi, value) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        if (q.id!==qId) return q;
        var opts = q.options.slice(); opts[oi] = value;
        return Object.assign({},q,{options:opts});
      });
    });
  }

  function removeOption(qId, oi) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        return q.id!==qId ? q : Object.assign({},q,{options:q.options.filter(function(_,i){return i!==oi;})});
      });
    });
  }

  function needsOptions(type) { return ['single_choice','multiple_choice'].includes(type); }

  // Get questions that can be used as conditions (previous questions with selectable answers)
  function getConditionableQuestions(currentQId) {
    var idx = questions.findIndex(function(q){return q.id===currentQId;});
    return questions.slice(0, idx).filter(function(q) {
      return ['single_choice','multiple_choice','yes_no_abstain','rating'].includes(q.question_type) && q.question_text.trim();
    });
  }

  // Get answer options for a condition question
  function getConditionAnswers(conditionQId) {
    var q = questions.find(function(q){return q.id===conditionQId;});
    if (!q) return [];
    if (q.question_type === 'rating') return ['1','2','3','4','5'];
    return q.options.filter(function(o){return o.trim();});
  }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      if (!formData.title.trim()) throw new Error('Please enter a survey title');
      if (questions.length === 0) throw new Error('Survey must have at least one question');
      for (var i = 0; i < questions.length; i++) {
        var q = questions[i];
        if (!q.question_text.trim()) throw new Error('Question ' + (i+1) + ' is empty');
        if (needsOptions(q.question_type)) {
          if (!q.options || q.options.length < 2) throw new Error('Question ' + (i+1) + ' needs at least 2 options');
          if (q.options.some(function(o){return !o.trim();})) throw new Error('Question ' + (i+1) + ' has empty options');
        }
      }

      var auth = await supabase.auth.getUser();
      if (!auth.data.user) throw new Error('You must be logged in');
      var user = auth.data.user;

      var memR = await supabase.from('memberships').select('role')
        .eq('organization_id',organizationId).eq('member_id',user.id).eq('status','active').maybeSingle();
      var userRole = memR.data ? memR.data.role : 'member';
      var approvalStatus = userRole==='admin' ? 'approved' : 'pending';

      var sR = await supabase.from('surveys').insert({
        organization_id: organizationId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        anonymous_responses: formData.anonymous_responses,
        allow_multiple_responses: formData.allow_multiple_responses,
        show_results_after_submission: formData.show_results_after_submission,
        closes_at: formData.closes_at || null,
        retention_days: formData.retention_days ? parseInt(formData.retention_days, 10) : null,
        visibility: formData.visibility,
        result_visibility: formData.result_visibility,
        recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
        recurring_ends_at: formData.is_recurring && formData.recurring_ends_at ? formData.recurring_ends_at : null,
        status: 'active', is_pinned: false,
        created_by: user.id, approval_status: approvalStatus,
      }).select().single();
      if (sR.error) throw sR.error;

      // Insert questions — conditions reference other questions by local id, we need to map to real ids
      // First insert without conditions, then update conditions after all are inserted
      var qInserts = questions.map(function(q) {
        return {
          survey_id: sR.data.id,
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          required: q.required,
          options: needsOptions(q.question_type) ? q.options.filter(function(o){return o.trim();}) : null,
          order_number: q.order_number,
          condition_question_id: null, // set after we have real IDs
          condition_answer: null,
        };
      });

      var qR = await supabase.from('survey_questions').insert(qInserts).select();
      if (qR.error) throw qR.error;

      // Now apply conditions: map local question ids to real db ids by order_number
      var insertedQuestions = qR.data;
      var conditionUpdates = [];
      questions.forEach(function(q, idx) {
        if (q.has_condition && q.condition_question_id && q.condition_answer) {
          var condLocalIdx = questions.findIndex(function(cq){return cq.id===q.condition_question_id;});
          if (condLocalIdx >= 0 && insertedQuestions[condLocalIdx] && insertedQuestions[idx]) {
            conditionUpdates.push({
              id: insertedQuestions[idx].id,
              condition_question_id: insertedQuestions[condLocalIdx].id,
              condition_answer: q.condition_answer,
            });
          }
        }
      });

      if (conditionUpdates.length > 0) {
        await Promise.all(conditionUpdates.map(function(upd) {
          return supabase.from('survey_questions').update({
            condition_question_id: upd.condition_question_id,
            condition_answer: upd.condition_answer,
          }).eq('id', upd.id);
        }));
      }

      mascotSuccessToast(approvalStatus==='pending' ? 'Survey submitted for approval.' : 'Survey created!');
      handleClose();
      if (onSuccess) onSuccess(sR.data);
    } catch (err) {
      console.error('Error creating survey:', err);
      mascotErrorToast('Failed to create survey.', err.message);
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (!isOpen) return null;

  var visibilityOptions = [{ value:'all_members', label:'All Members' }];
  orgRoles.forEach(function(tier) { visibilityOptions.push({ value:'tier_'+tier.id, label:tier.name }); });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="create-survey-title">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col"
        onClick={function(e){e.stopPropagation();}}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon path={ICONS.clipboard} className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 id="create-survey-title" className="text-xl font-bold text-[#0E1523]">Create Survey</h2>
              <p className="text-[#64748B] text-sm">{organizationName}</p>
            </div>
          </div>
          <button type="button" onClick={handleClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Close dialog">
            <Icon path={ICONS.x} className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800 font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Details */}
          <div className="space-y-5">
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Survey Details</p>

            <div>
              <label htmlFor="survey-title" className={labelCls}>Survey Title <span className="text-red-500" aria-hidden="true">*</span></label>
              <input id="survey-title" type="text" value={formData.title}
                onChange={function(e){updateForm('title',e.target.value);}}
                maxLength={200} className={inputCls} placeholder="e.g., Annual Member Satisfaction Survey"
                required aria-required="true" />
              <p className="text-xs text-[#94A3B8] mt-1" aria-live="polite">{formData.title.length}/200</p>
            </div>

            <div>
              <label htmlFor="survey-description" className={labelCls}>Description <span className="text-[#94A3B8] font-normal">(optional)</span></label>
              <textarea id="survey-description" value={formData.description}
                onChange={function(e){updateForm('description',e.target.value);}}
                rows={3} maxLength={1000} className={inputCls+' resize-none'} placeholder="What is this survey about?" />
              <p className="text-xs text-[#94A3B8] mt-1" aria-live="polite">{formData.description.length}/1000</p>
            </div>

            {/* Closing + Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="survey-closing" className={labelCls}>
                  <span className="flex items-center gap-2">
                    <Icon path={ICONS.clock} className="h-4 w-4 text-[#94A3B8]" />
                    Closing Date <span className="text-[#94A3B8] font-normal">(optional)</span>
                  </span>
                </label>
                <input id="survey-closing" type="datetime-local" value={formData.closes_at}
                  onChange={function(e){updateForm('closes_at',e.target.value);}} className={inputCls} />
                <p className="text-xs text-[#94A3B8] mt-1">Survey closes automatically at this time</p>
              </div>
              <div>
                <label htmlFor="survey-visibility" className={labelCls}>
                  <span className="flex items-center gap-2">
                    <Icon path={ICONS.users} className="h-4 w-4 text-[#94A3B8]" />
                    Who Can Respond
                  </span>
                </label>
                {rolesLoading ? (
                  <div className="h-12 bg-slate-100 rounded-lg animate-pulse" aria-hidden="true" />
                ) : (
                  <select id="survey-visibility" value={formData.visibility}
                    onChange={function(e){updateForm('visibility',e.target.value);}} className={inputCls}>
                    {visibilityOptions.map(function(opt){return <option key={opt.value} value={opt.value}>{opt.label}</option>;})}
                  </select>
                )}
                <p className="text-xs text-[#94A3B8] mt-1">Roles managed in Organization Settings</p>
              </div>
            </div>

            {/* Result Visibility */}
            <div>
              <p className={labelCls} id="result-vis-label">
                <span className="flex items-center gap-2">
                  <Icon path={ICONS.eye} className="h-4 w-4 text-[#94A3B8]" />
                  Result Visibility
                </span>
              </p>
              <div className="space-y-2" role="radiogroup" aria-labelledby="result-vis-label">
                {RESULT_VISIBILITY_OPTIONS.map(function(opt) {
                  var checked = formData.result_visibility === opt.value;
                  return (
                    <label key={opt.value} className={'flex items-start p-3 border-2 rounded-xl cursor-pointer transition-colors ' + (checked?'border-blue-500 bg-blue-50':'border-slate-200 hover:bg-slate-50')}>
                      <input type="radio" name="result_visibility" value={opt.value} checked={checked}
                        onChange={function(e){updateForm('result_visibility',e.target.value);}}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="font-semibold text-[#0E1523] text-sm">{opt.label}</p>
                        <p className="text-xs text-[#64748B]">{opt.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Retention */}
            <div>
              <label htmlFor="survey-retention" className={labelCls}>
                <span className="flex items-center gap-2">
                  <Icon path={ICONS.database} className="h-4 w-4 text-[#94A3B8]" />
                  Data Retention
                </span>
              </label>
              <select id="survey-retention" value={formData.retention_days}
                onChange={function(e){updateForm('retention_days',e.target.value);}} className={inputCls}>
                {RETENTION_OPTIONS.map(function(opt){return <option key={opt.value} value={opt.value}>{opt.label}</option>;})}
              </select>
              <p className="text-xs text-[#94A3B8] mt-1">Survey and all responses deleted automatically after this period</p>
            </div>

            {/* Survey Settings */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4">Survey Settings</p>
              <div className="space-y-3">
                {[
                  { id:'anon',    field:'anonymous_responses',           checked:formData.anonymous_responses,           icon:ICONS.shield,  color:'text-purple-500', label:'Anonymous Responses',           desc:"Don't record who submitted each response" },
                  { id:'multi',   field:'allow_multiple_responses',       checked:formData.allow_multiple_responses,      icon:ICONS.refresh, color:'text-blue-500',   label:'Allow Multiple Responses',       desc:'Members can submit more than once' },
                  { id:'results', field:'show_results_after_submission',  checked:formData.show_results_after_submission, icon:ICONS.eye,     color:'text-green-500',  label:'Show Results After Submission',  desc:'Respondents see results once they submit' },
                ].map(function(item) {
                  return (
                    <label key={item.id} className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' + (item.checked?'border-blue-300 bg-white':'border-transparent hover:bg-white')}>
                      <input id={'survey-'+item.id} type="checkbox" checked={item.checked}
                        onChange={function(e){updateForm(item.field,e.target.checked);}}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon path={item.icon} className={'h-4 w-4 flex-shrink-0 ' + item.color} />
                          <span className="font-semibold text-[#0E1523] text-sm">{item.label}</span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Recurring */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon path={ICONS.repeat} className="h-4 w-4 text-[#94A3B8]" />
                  <span className="text-sm font-semibold text-[#0E1523]">Recurring Survey</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle recurring">
                  <input type="checkbox" checked={formData.is_recurring}
                    onChange={function(e){updateForm('is_recurring',e.target.checked);}} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
                </label>
              </div>
              <p className="text-xs text-[#64748B] mb-3">Automatically create a new copy of this survey on a schedule</p>
              {formData.is_recurring && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="recurring-interval" className="block text-xs font-semibold text-[#475569] mb-1">Repeat every</label>
                      <select id="recurring-interval" value={formData.recurring_interval}
                        onChange={function(e){updateForm('recurring_interval',e.target.value);}} className={inputCls}>
                        {RECURRING_INTERVALS.map(function(opt){return <option key={opt.value} value={opt.value}>{opt.label}</option>;})}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="recurring-ends" className="block text-xs font-semibold text-[#475569] mb-1">Ends on <span className="text-[#94A3B8] font-normal">(optional)</span></label>
                      <input id="recurring-ends" type="date" value={formData.recurring_ends_at}
                        onChange={function(e){updateForm('recurring_ends_at',e.target.value);}} className={inputCls} />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    A new survey will be created automatically when the current one closes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{'Questions (' + questions.length + ')'}</p>
              <button type="button" onClick={addQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                <Icon path={ICONS.plus} className="h-4 w-4" />Add Question
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">{questions.map(function(q){return <QuestionSkeleton key={q.id} />;})}</div>
            ) : (
              <div className="space-y-4">
                {questions.map(function(question, index) {
                  var showOptions = needsOptions(question.question_type);
                  var isRating = question.question_type === 'rating';
                  var conditionableQs = getConditionableQuestions(question.id);
                  var condAnswers = question.condition_question_id ? getConditionAnswers(question.condition_question_id) : [];

                  return (
                    <div key={question.id} className={'border border-slate-200 rounded-xl p-5 space-y-4 bg-white ' + (question.has_condition ? 'border-l-4 border-l-blue-300' : '')}>
                      {/* Question header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">
                          {'Question ' + (index + 1)}
                          {question.has_condition && <span className="ml-2 text-blue-500 normal-case font-semibold">· conditional</span>}
                        </span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={function(){moveQuestion(question.id,'up');}} disabled={index===0}
                            className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                            aria-label="Move question up">
                            <Icon path={ICONS.chevUp} className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={function(){moveQuestion(question.id,'down');}} disabled={index===questions.length-1}
                            className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                            aria-label="Move question down">
                            <Icon path={ICONS.chevDown} className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={function(){removeQuestion(question.id);}}
                            className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors ml-1"
                            aria-label={'Delete question ' + (index + 1)}>
                            <Icon path={ICONS.trash} className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question text */}
                      <div>
                        <label htmlFor={'q-text-'+question.id} className="sr-only">{'Question ' + (index+1) + ' text'}</label>
                        <input id={'q-text-'+question.id} type="text" value={question.question_text}
                          onChange={function(e){updateQuestion(question.id,'question_text',e.target.value);}}
                          className={inputCls} placeholder="Enter your question" required aria-required="true" />
                      </div>

                      {/* Type + Required */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor={'q-type-'+question.id} className="block text-xs font-semibold text-[#64748B] mb-1">Question Type</label>
                          <select id={'q-type-'+question.id} value={question.question_type}
                            onChange={function(e){updateQuestion(question.id,'question_type',e.target.value);}}
                            className={inputCls}>
                            {QUESTION_TYPES.map(function(t){return <option key={t.value} value={t.value}>{t.label}</option>;})}
                          </select>
                        </div>
                        <div className="flex items-end pb-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input id={'q-req-'+question.id} type="checkbox" checked={question.required}
                              onChange={function(e){updateQuestion(question.id,'required',e.target.checked);}}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                            <div>
                              <span className="text-sm font-semibold text-[#0E1523]">Required</span>
                              <p className="text-xs text-[#94A3B8]">Must be answered</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {isRating && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 font-medium">Rating scale: 1 (lowest) to 5 (highest) — options are generated automatically.</p>
                        </div>
                      )}

                      {showOptions && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold text-[#64748B]">Options</p>
                          {(question.options||[]).map(function(opt, oi) {
                            return (
                              <div key={oi} className="flex items-center gap-2">
                                <span className="text-[#94A3B8] text-xs font-bold w-5 text-right flex-shrink-0">{oi+1}.</span>
                                <input type="text" value={opt}
                                  onChange={function(e){updateOption(question.id,oi,e.target.value);}}
                                  className={inputCls} placeholder={'Option '+(oi+1)}
                                  aria-label={'Option '+(oi+1)+' for question '+(index+1)} />
                                <button type="button" onClick={function(){removeOption(question.id,oi);}}
                                  className="p-2 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors flex-shrink-0"
                                  aria-label={'Remove option '+(oi+1)}>
                                  <Icon path={ICONS.x} className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                          <button type="button" onClick={function(){addOption(question.id);}}
                            className="inline-flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mt-1">
                            <Icon path={ICONS.plus} className="h-4 w-4" />Add Option
                          </button>
                        </div>
                      )}

                      {/* Conditional logic — only available for questions after the first */}
                      {index > 0 && conditionableQs.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <label className="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" checked={question.has_condition}
                              onChange={function(e){
                                updateQuestion(question.id,'has_condition',e.target.checked);
                                if (!e.target.checked) {
                                  updateQuestion(question.id,'condition_question_id',null);
                                  updateQuestion(question.id,'condition_answer','');
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                            <div className="flex items-center gap-2">
                              <Icon path={ICONS.filter} className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-semibold text-[#0E1523]">Only show if...</span>
                            </div>
                          </label>
                          {question.has_condition && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                              <div>
                                <label htmlFor={'cond-q-'+question.id} className="block text-xs font-semibold text-[#64748B] mb-1">Question</label>
                                <select id={'cond-q-'+question.id} value={question.condition_question_id||''}
                                  onChange={function(e){
                                    updateQuestion(question.id,'condition_question_id',e.target.value||null);
                                    updateQuestion(question.id,'condition_answer','');
                                  }}
                                  className={inputCls}>
                                  <option value="">Select a question...</option>
                                  {conditionableQs.map(function(cq,ci){
                                    return <option key={cq.id} value={cq.id}>{'Q'+(questions.indexOf(cq)+1)+': '+cq.question_text.slice(0,40)+(cq.question_text.length>40?'...':'')}</option>;
                                  })}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={'cond-a-'+question.id} className="block text-xs font-semibold text-[#64748B] mb-1">Answer is</label>
                                {question.condition_question_id && condAnswers.length > 0 ? (
                                  <select id={'cond-a-'+question.id} value={question.condition_answer||''}
                                    onChange={function(e){updateQuestion(question.id,'condition_answer',e.target.value);}}
                                    className={inputCls}>
                                    <option value="">Select an answer...</option>
                                    {condAnswers.map(function(a){return <option key={a} value={a}>{a}</option>;})}
                                  </select>
                                ) : (
                                  <input id={'cond-a-'+question.id} type="text" value={question.condition_answer||''}
                                    onChange={function(e){updateQuestion(question.id,'condition_answer',e.target.value);}}
                                    placeholder="Expected answer..." className={inputCls} />
                                )}
                              </div>
                              {question.condition_question_id && question.condition_answer && (
                                <div className="md:col-span-2">
                                  <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <Icon path={ICONS.filter} className="h-3.5 w-3.5 flex-shrink-0" />
                                    This question will only appear when the answer to the selected question is &ldquo;{question.condition_answer}&rdquo;
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={addQuestion}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-[#64748B] hover:border-blue-400 hover:text-blue-500 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-center gap-2">
              <Icon path={ICONS.plus} className="h-4 w-4" />Add Another Question
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <button type="button" onClick={handleClose} disabled={loading}
            className="px-6 py-3 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading || !formData.title.trim()}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2 text-sm">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Creating...</>
            ) : (
              <><Icon path={ICONS.clipboard} className="h-4 w-4" />Create Survey</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreateSurvey;