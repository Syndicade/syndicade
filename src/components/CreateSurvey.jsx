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
  clipboard:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  plus:       'M12 4v16m8-8H4',
  x:          'M6 18L18 6M6 6l12 12',
  trash:      ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  chevUp:     'M5 15l7-7 7 7',
  chevDown:   'M19 9l-7 7-7-7',
  clock:      ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  eye:        ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  shield:     ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  refresh:    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  users:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  database:   ['M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3M4 7c0-2 1.5-3 3.5-3h9c2 0 3.5 1 3.5 3'],
  repeat:     'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  filter:     'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z',
  template:   ['M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2'],
  pencil:     ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  check:      'M5 13l4 4L19 7',
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

function makeQuestionFromTemplate(tq, orderNumber) {
  return {
    id: Date.now() + Math.random() + orderNumber,
    question_text: tq.question_text || '',
    question_type:  tq.question_type || 'text',
    required:       tq.required !== undefined ? tq.required : true,
    options:        Array.isArray(tq.options) ? tq.options.slice() : [],
    order_number:   orderNumber,
    has_condition:  false,
    condition_question_id: null,
    condition_answer: '',
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

// ─── TemplatePicker ────────────────────────────────────────────────────────────
function TemplatePicker({ organizationId, onLoad, onClose }) {
  var [templates, setTemplates]       = useState([]);
  var [loading, setLoading]           = useState(true);
  var [renamingId, setRenamingId]     = useState(null);
  var [renameValue, setRenameValue]   = useState('');
  var [renameSaving, setRenameSaving] = useState(false);
  var [deletingId, setDeletingId]     = useState(null);

  useEffect(function() { fetchTemplates(); }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      var r = await supabase
        .from('poll_survey_templates')
        .select('id, name, template_data, created_at')
        .eq('organization_id', organizationId)
        .eq('type', 'survey')
        .order('created_at', { ascending: false });
      if (r.error) throw r.error;
      setTemplates(r.data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      toast.error('Could not load templates.');
    } finally {
      setLoading(false);
    }
  }

  function startRename(tmpl) {
    setRenamingId(tmpl.id);
    setRenameValue(tmpl.name);
  }

  async function saveRename(tmplId) {
    var trimmed = renameValue.trim();
    if (!trimmed) { toast.error('Name cannot be empty.'); return; }
    setRenameSaving(true);
    try {
      var r = await supabase
        .from('poll_survey_templates')
        .update({ name: trimmed })
        .eq('id', tmplId);
      if (r.error) throw r.error;
      setTemplates(function(prev) {
        return prev.map(function(t) {
          return t.id === tmplId ? Object.assign({}, t, { name: trimmed }) : t;
        });
      });
      setRenamingId(null);
      mascotSuccessToast('Template renamed.');
    } catch (err) {
      mascotErrorToast('Failed to rename template.', err.message);
    } finally {
      setRenameSaving(false);
    }
  }

  async function deleteTemplate(tmplId) {
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    setDeletingId(tmplId);
    try {
      var r = await supabase
        .from('poll_survey_templates')
        .delete()
        .eq('id', tmplId);
      if (r.error) throw r.error;
      setTemplates(function(prev) { return prev.filter(function(t) { return t.id !== tmplId; }); });
      mascotSuccessToast('Template deleted.');
    } catch (err) {
      mascotErrorToast('Failed to delete template.', err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleRenameKeyDown(e, tmplId) {
    if (e.key === 'Enter') saveRename(tmplId);
    if (e.key === 'Escape') setRenamingId(null);
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-picker-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={function(e) { e.stopPropagation(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon path={ICONS.template} className="h-5 w-5 text-[#64748B]" />
            <h3 id="template-picker-title" className="text-base font-bold text-[#0E1523]">Load Template</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Close template picker"
          >
            <Icon path={ICONS.x} className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(function(i) {
                return (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                    <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                );
              })}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon path={ICONS.template} className="h-6 w-6 text-[#94A3B8]" />
              </div>
              <p className="font-semibold text-[#0E1523] text-sm mb-1">No templates yet</p>
              <p className="text-xs text-[#64748B]">Save a survey as a template from the survey list to reuse it here.</p>
            </div>
          ) : (
            templates.map(function(tmpl) {
              var qCount = (tmpl.template_data && tmpl.template_data.questions) ? tmpl.template_data.questions.length : 0;
              var isDeleting = deletingId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  role="listitem"
                >
                  {renamingId === tmpl.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={function(e) { setRenameValue(e.target.value); }}
                        onKeyDown={function(e) { handleRenameKeyDown(e, tmpl.id); }}
                        className="flex-1 px-3 py-1.5 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#0E1523]"
                        aria-label="Rename template"
                        autoFocus
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={function() { saveRename(tmpl.id); }}
                        disabled={renameSaving}
                        className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        aria-label="Save rename"
                      >
                        <Icon path={ICONS.check} className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={function() { setRenamingId(null); }}
                        className="p-1.5 text-[#64748B] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                        aria-label="Cancel rename"
                      >
                        <Icon path={ICONS.x} className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0E1523] text-sm truncate">{tmpl.name}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{qCount + ' question' + (qCount !== 1 ? 's' : '')}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={function() { onLoad(tmpl); }}
                          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={function() { startRename(tmpl); }}
                          className="p-1.5 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                          aria-label={'Rename template: ' + tmpl.name}
                        >
                          <Icon path={ICONS.pencil} className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={function() { deleteTemplate(tmpl.id); }}
                          disabled={isDeleting}
                          className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 transition-colors"
                          aria-label={'Delete template: ' + tmpl.name}
                        >
                          <Icon path={ICONS.trash} className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CreateSurvey ─────────────────────────────────────────────────────────────
function CreateSurvey({ isOpen, onClose, onSuccess, organizationId, organizationName, editSurvey }) {
  var isEditMode = !!editSurvey;

  var [loading, setLoading]               = useState(false);
  var [editLoading, setEditLoading]       = useState(false);
  var [error, setError]                   = useState(null);
  var [orgRoles, setOrgRoles]             = useState([]);
  var [rolesLoading, setRolesLoading]     = useState(false);
  var [showTemplatePicker, setShowTemplatePicker] = useState(false);
  var [hasResponses, setHasResponses]     = useState(false);

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

  // Load existing survey data when opening in edit mode
  useEffect(function() {
    if (isOpen && isEditMode && editSurvey) {
      loadEditData();
    }
    if (!isOpen) {
      setHasResponses(false);
    }
  }, [isOpen, editSurvey]);

  async function loadEditData() {
    setEditLoading(true);
    try {
      var s = editSurvey;
      // Format closes_at for datetime-local input
      var closesAtValue = '';
      if (s.closes_at) {
        var d = new Date(s.closes_at);
        closesAtValue = d.toISOString().slice(0, 16);
      }
      setFormData({
        title:                         s.title || '',
        description:                   s.description || '',
        anonymous_responses:           s.anonymous_responses || false,
        allow_multiple_responses:      s.allow_multiple_responses || false,
        show_results_after_submission: s.show_results_after_submission !== false,
        closes_at:                     closesAtValue,
        retention_days:                s.retention_days ? String(s.retention_days) : '',
        visibility:                    s.visibility || 'all_members',
        result_visibility:             s.result_visibility || 'full',
        is_recurring:                  !!s.recurring_interval,
        recurring_interval:            s.recurring_interval || 'monthly',
        recurring_ends_at:             s.recurring_ends_at ? s.recurring_ends_at.slice(0, 10) : '',
      });

      // Load questions
      var qR = await supabase.from('survey_questions').select('*').eq('survey_id', s.id).order('order_number');
      if (qR.error) throw qR.error;
      var loadedQs = (qR.data || []).map(function(q, i) {
        return {
          id:                   Date.now() + Math.random() + i,
          _dbId:                q.id,
          question_text:        q.question_text || '',
          question_type:        q.question_type || 'text',
          required:             q.required !== false,
          options:              q.options || [],
          order_number:         q.order_number || i + 1,
          has_condition:        !!(q.condition_question_id),
          condition_question_id: null, // resolved below
          condition_answer:     q.condition_answer || '',
          _rawConditionQId:     q.condition_question_id,
        };
      });
      // Resolve condition_question_id from DB id to local id
      loadedQs.forEach(function(q) {
        if (q._rawConditionQId) {
          var condLocal = loadedQs.find(function(cq) { return cq._dbId === q._rawConditionQId; });
          if (condLocal) q.condition_question_id = condLocal.id;
        }
      });
      setQuestions(loadedQs.length > 0 ? loadedQs : [makeQuestion(1)]);

      // Check if any responses exist
      var respR = await supabase.from('survey_responses').select('*', { count:'exact', head:true }).eq('survey_id', s.id);
      setHasResponses((respR.count || 0) > 0);
    } catch (err) {
      console.error('Error loading survey for edit:', err);
      setError('Failed to load survey data.');
    } finally {
      setEditLoading(false);
    }
  }

  useEffect(function() {
    function handleEscape(e) { if (e.key === 'Escape' && isOpen && !showTemplatePicker) handleClose(); }
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return function() { document.removeEventListener('keydown', handleEscape); };
  }, [isOpen, showTemplatePicker]);

  async function loadOrgRoles() {
    setRolesLoading(true);
    try {
      var r = await supabase.from('membership_tiers').select('id, name')
        .eq('organization_id', organizationId).order('name', { ascending: true });
      if (!r.error && r.data) setOrgRoles(r.data);
    } catch (err) { console.error('Error loading roles:', err); }
    finally { setRolesLoading(false); }
  }

  function getEmptyForm() {
    return {
      title: '', description: '',
      anonymous_responses: false, allow_multiple_responses: false, show_results_after_submission: true,
      closes_at: '', retention_days: '', visibility: 'all_members',
      result_visibility: 'full',
      is_recurring: false, recurring_interval: 'monthly', recurring_ends_at: '',
    };
  }

  function handleClose() {
    setFormData(getEmptyForm());
    setQuestions([makeQuestion(1)]);
    setError(null);
    setShowTemplatePicker(false);
    onClose();
  }

  function updateForm(field, value) {
    setFormData(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  // ── Template apply ────────────────────────────────────────────────────────
  function applyTemplate(tmpl) {
    var data = tmpl.template_data || {};
    setFormData({
      title:                       data.title || '',
      description:                 data.description || '',
      anonymous_responses:         data.anonymous_responses || false,
      allow_multiple_responses:    data.allow_multiple_responses || false,
      show_results_after_submission: data.show_results_after_submission !== undefined ? data.show_results_after_submission : true,
      result_visibility:           data.result_visibility || 'full',
      visibility:                  data.visibility || 'all_members',
      closes_at:                   '',
      retention_days:              '',
      is_recurring:                false,
      recurring_interval:          'monthly',
      recurring_ends_at:           '',
    });

    if (Array.isArray(data.questions) && data.questions.length > 0) {
      setQuestions(data.questions.map(function(tq, i) {
        return makeQuestionFromTemplate(tq, i + 1);
      }));
    } else {
      setQuestions([makeQuestion(1)]);
    }

    setShowTemplatePicker(false);
    mascotSuccessToast('Template loaded: ' + tmpl.name);
  }

  // ── Questions helpers ─────────────────────────────────────────────────────
  function addQuestion() {
    setQuestions(function(prev) { return prev.concat([makeQuestion(prev.length + 1)]); });
  }

  function removeQuestion(qId) {
    if (questions.length === 1) { setError('Survey must have at least one question'); return; }
    setQuestions(function(prev) {
      return prev.filter(function(q) { return q.id !== qId; })
        .map(function(q, i) { return Object.assign({}, q, { order_number: i + 1 }); });
    });
    setError(null);
  }

  function updateQuestion(qId, field, value) {
    setQuestions(function(prev) {
      return prev.map(function(q) { return q.id === qId ? Object.assign({}, q, { [field]: value }) : q; });
    });
  }

  function moveQuestion(qId, direction) {
    var idx  = questions.findIndex(function(q) { return q.id === qId; });
    var nIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nIdx < 0 || nIdx >= questions.length) return;
    var reordered = questions.slice();
    var temp = reordered[idx]; reordered[idx] = reordered[nIdx]; reordered[nIdx] = temp;
    setQuestions(reordered.map(function(q, i) { return Object.assign({}, q, { order_number: i + 1 }); }));
  }

  function addOption(qId) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        return q.id === qId ? Object.assign({}, q, { options: (q.options || []).concat(['']) }) : q;
      });
    });
  }

  function updateOption(qId, oi, value) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        if (q.id !== qId) return q;
        var opts = q.options.slice(); opts[oi] = value;
        return Object.assign({}, q, { options: opts });
      });
    });
  }

  function removeOption(qId, oi) {
    setQuestions(function(prev) {
      return prev.map(function(q) {
        return q.id !== qId ? q : Object.assign({}, q, { options: q.options.filter(function(_, i) { return i !== oi; }) });
      });
    });
  }

  function needsOptions(type) { return ['single_choice', 'multiple_choice'].includes(type); }

  function getConditionableQuestions(currentQId) {
    var idx = questions.findIndex(function(q) { return q.id === currentQId; });
    return questions.slice(0, idx).filter(function(q) {
      return ['single_choice', 'multiple_choice', 'yes_no_abstain', 'rating'].includes(q.question_type) && q.question_text.trim();
    });
  }

  function getConditionAnswers(conditionQId) {
    var q = questions.find(function(q) { return q.id === conditionQId; });
    if (!q) return [];
    if (q.question_type === 'rating') return ['1', '2', '3', '4', '5'];
    return q.options.filter(function(o) { return o.trim(); });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
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

      var auth = await supabase.auth.getUser();
      if (!auth.data.user) throw new Error('You must be logged in');

      var surveyPayload = {
        title:                         formData.title.trim(),
        description:                   formData.description.trim() || null,
        anonymous_responses:           formData.anonymous_responses,
        allow_multiple_responses:      formData.allow_multiple_responses,
        show_results_after_submission: formData.show_results_after_submission,
        closes_at:                     formData.closes_at || null,
        retention_days:                formData.retention_days ? parseInt(formData.retention_days, 10) : null,
        visibility:                    formData.visibility,
        result_visibility:             formData.result_visibility,
        recurring_interval:            formData.is_recurring ? formData.recurring_interval : null,
        recurring_ends_at:             formData.is_recurring && formData.recurring_ends_at ? formData.recurring_ends_at : null,
      };

      var surveyId;

      if (isEditMode) {
        // ── UPDATE path ──
        var upR = await supabase.from('surveys').update(surveyPayload).eq('id', editSurvey.id);
        if (upR.error) throw upR.error;
        surveyId = editSurvey.id;

        // Delete all existing questions and re-insert
        var delR = await supabase.from('survey_questions').delete().eq('survey_id', surveyId);
        if (delR.error) throw delR.error;
      } else {
        // ── INSERT path ──
        var user = auth.data.user;
        var memR = await supabase.from('memberships').select('role')
          .eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').maybeSingle();
        var userRole = memR.data ? memR.data.role : 'member';
        var approvalStatus = userRole === 'admin' ? 'approved' : 'pending';

        var sR = await supabase.from('surveys').insert(Object.assign({}, surveyPayload, {
          organization_id: organizationId,
          status:          'active',
          is_pinned:       false,
          created_by:      user.id,
          approval_status: approvalStatus,
        })).select().single();
        if (sR.error) throw sR.error;
        surveyId = sR.data.id;
      }

      // Insert questions
      var qInserts = questions.map(function(q) {
        return {
          survey_id:             surveyId,
          question_text:         q.question_text.trim(),
          question_type:         q.question_type,
          required:              q.required,
          options:               needsOptions(q.question_type) ? q.options.filter(function(o) { return o.trim(); }) : null,
          order_number:          q.order_number,
          condition_question_id: null,
          condition_answer:      null,
        };
      });

      var qR = await supabase.from('survey_questions').insert(qInserts).select();
      if (qR.error) throw qR.error;

      var insertedQuestions = qR.data;
      var conditionUpdates  = [];
      questions.forEach(function(q, idx) {
        if (q.has_condition && q.condition_question_id && q.condition_answer) {
          var condLocalIdx = questions.findIndex(function(cq) { return cq.id === q.condition_question_id; });
          if (condLocalIdx >= 0 && insertedQuestions[condLocalIdx] && insertedQuestions[idx]) {
            conditionUpdates.push({
              id:                    insertedQuestions[idx].id,
              condition_question_id: insertedQuestions[condLocalIdx].id,
              condition_answer:      q.condition_answer,
            });
          }
        }
      });

      if (conditionUpdates.length > 0) {
        await Promise.all(conditionUpdates.map(function(upd) {
          return supabase.from('survey_questions').update({
            condition_question_id: upd.condition_question_id,
            condition_answer:      upd.condition_answer,
          }).eq('id', upd.id);
        }));
      }

      if (isEditMode) {
        mascotSuccessToast('Survey updated!');
      } else {
        var approvalMsg = (surveyPayload.approval_status === 'pending') ? 'Survey submitted for approval.' : 'Survey created!';
        mascotSuccessToast(isEditMode ? 'Survey updated!' : approvalMsg);
      }
      handleClose();
      if (onSuccess) onSuccess({ id: surveyId });
    } catch (err) {
      console.error('Error saving survey:', err);
      mascotErrorToast(isEditMode ? 'Failed to save changes.' : 'Failed to create survey.', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  var visibilityOptions = [{ value: 'all_members', label: 'All Members' }];
  orgRoles.forEach(function(tier) { visibilityOptions.push({ value: 'tier_' + tier.id, label: tier.name }); });

  return (
    <>
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

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon path={ICONS.clipboard} className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 id="create-survey-title" className="text-xl font-bold text-[#0E1523]">
                  {isEditMode ? 'Edit Survey' : 'Create Survey'}
                </h2>
                <p className="text-[#64748B] text-sm">{organizationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={function() { setShowTemplatePicker(true); }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#475569] bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  aria-label="Load a saved template"
                >
                  <Icon path={ICONS.template} className="h-4 w-4" />
                  Load Template
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Close dialog"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

            {editLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 rounded-lg bg-gray-100" />
                <div className="h-24 rounded-lg bg-gray-100" />
                <div className="h-10 rounded-lg bg-gray-100" />
                <div className="h-32 rounded-lg bg-gray-100" />
                <div className="h-10 rounded-lg bg-gray-100" />
              </div>
            ) : (
            <>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
                <p className="text-red-800 font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* Warning when editing a survey with existing responses */}
            {isEditMode && hasResponses && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4" role="note">
                <p className="text-amber-800 font-semibold text-sm">This survey has existing responses. Editing questions will not affect responses already collected.</p>
              </div>
            )}

            {/* Note when editing a closed survey */}
            {isEditMode && editSurvey && (editSurvey.status === 'closed' || (editSurvey.closes_at && new Date(editSurvey.closes_at) < new Date())) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4" role="note">
                <p className="text-[#475569] text-sm font-semibold">Editing a closed survey — you can update the title, description, visibility, and settings. Reopen the survey from the card if you want members to respond again.</p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-5">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Survey Details</p>

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
                <p className="text-xs text-[#94A3B8] mt-1" aria-live="polite">{formData.title.length}/200</p>
              </div>

              <div>
                <label htmlFor="survey-description" className={labelCls}>
                  Description <span className="text-[#94A3B8] font-normal">(optional)</span>
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
                  <input
                    id="survey-closing"
                    type="datetime-local"
                    value={formData.closes_at}
                    onChange={function(e) { updateForm('closes_at', e.target.value); }}
                    className={inputCls}
                  />
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
                    <select
                      id="survey-visibility"
                      value={formData.visibility}
                      onChange={function(e) { updateForm('visibility', e.target.value); }}
                      className={inputCls}
                    >
                      {visibilityOptions.map(function(opt) {
                        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                      })}
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
                      <label
                        key={opt.value}
                        className={'flex items-start p-3 border-2 rounded-xl cursor-pointer transition-colors ' + (checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}
                      >
                        <input
                          type="radio"
                          name="result_visibility"
                          value={opt.value}
                          checked={checked}
                          onChange={function(e) { updateForm('result_visibility', e.target.value); }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
                        />
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
                <select
                  id="survey-retention"
                  value={formData.retention_days}
                  onChange={function(e) { updateForm('retention_days', e.target.value); }}
                  className={inputCls}
                >
                  {RETENTION_OPTIONS.map(function(opt) {
                    return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                  })}
                </select>
                <p className="text-xs text-[#94A3B8] mt-1">Survey and all responses deleted automatically after this period</p>
              </div>

              {/* Survey Settings */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4">Survey Settings</p>
                <div className="space-y-3">
                  {[
                    { id: 'anon',    field: 'anonymous_responses',           checked: formData.anonymous_responses,           icon: ICONS.shield,  color: 'text-purple-500', label: 'Anonymous Responses',          desc: "Don't record who submitted each response" },
                    { id: 'multi',   field: 'allow_multiple_responses',       checked: formData.allow_multiple_responses,      icon: ICONS.refresh, color: 'text-blue-500',   label: 'Allow Multiple Responses',      desc: 'Members can submit more than once' },
                    { id: 'results', field: 'show_results_after_submission',  checked: formData.show_results_after_submission, icon: ICONS.eye,     color: 'text-green-500',  label: 'Show Results After Submission', desc: 'Respondents see results once they submit' },
                  ].map(function(item) {
                    return (
                      <label
                        key={item.id}
                        className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' + (item.checked ? 'border-blue-300 bg-white' : 'border-transparent hover:bg-white')}
                      >
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
                    <input
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={function(e) { updateForm('is_recurring', e.target.checked); }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
                  </label>
                </div>
                <p className="text-xs text-[#64748B] mb-3">Automatically create a new copy of this survey on a schedule</p>
                {formData.is_recurring && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="recurring-interval" className="block text-xs font-semibold text-[#475569] mb-1">Repeat every</label>
                        <select
                          id="recurring-interval"
                          value={formData.recurring_interval}
                          onChange={function(e) { updateForm('recurring_interval', e.target.value); }}
                          className={inputCls}
                        >
                          {RECURRING_INTERVALS.map(function(opt) {
                            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                          })}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="recurring-ends" className="block text-xs font-semibold text-[#475569] mb-1">
                          Ends on <span className="text-[#94A3B8] font-normal">(optional)</span>
                        </label>
                        <input
                          id="recurring-ends"
                          type="date"
                          value={formData.recurring_ends_at}
                          onChange={function(e) { updateForm('recurring_ends_at', e.target.value); }}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      A new survey will be created automatically when the current one closes.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Questions ── */}
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{'Questions (' + questions.length + ')'}</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <Icon path={ICONS.plus} className="h-4 w-4" />Add Question
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {questions.map(function(q) { return <QuestionSkeleton key={q.id} />; })}
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map(function(question, index) {
                    var showOptions    = needsOptions(question.question_type);
                    var isRating       = question.question_type === 'rating';
                    var conditionableQs = getConditionableQuestions(question.id);
                    var condAnswers    = question.condition_question_id ? getConditionAnswers(question.condition_question_id) : [];

                    return (
                      <div
                        key={question.id}
                        className={'border border-slate-200 rounded-xl p-5 space-y-4 bg-white ' + (question.has_condition ? 'border-l-4 border-l-blue-300' : '')}
                      >
                        {/* Question header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">
                            {'Question ' + (index + 1)}
                            {question.has_condition && <span className="ml-2 text-blue-500 normal-case font-semibold">· conditional</span>}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={function() { moveQuestion(question.id, 'up'); }}
                              disabled={index === 0}
                              className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                              aria-label="Move question up"
                            >
                              <Icon path={ICONS.chevUp} className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={function() { moveQuestion(question.id, 'down'); }}
                              disabled={index === questions.length - 1}
                              className="p-1.5 text-[#94A3B8] hover:text-[#475569] hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                              aria-label="Move question down"
                            >
                              <Icon path={ICONS.chevDown} className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={function() { removeQuestion(question.id); }}
                              className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors ml-1"
                              aria-label={'Delete question ' + (index + 1)}
                            >
                              <Icon path={ICONS.trash} className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question text */}
                        <div>
                          <label htmlFor={'q-text-' + question.id} className="sr-only">{'Question ' + (index + 1) + ' text'}</label>
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
                            <label htmlFor={'q-type-' + question.id} className="block text-xs font-semibold text-[#64748B] mb-1">Question Type</label>
                            <select
                              id={'q-type-' + question.id}
                              value={question.question_type}
                              onChange={function(e) { updateQuestion(question.id, 'question_type', e.target.value); }}
                              className={inputCls}
                            >
                              {QUESTION_TYPES.map(function(t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
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
                            {(question.options || []).map(function(opt, oi) {
                              return (
                                <div key={oi} className="flex items-center gap-2">
                                  <span className="text-[#94A3B8] text-xs font-bold w-5 text-right flex-shrink-0">{oi + 1}.</span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={function(e) { updateOption(question.id, oi, e.target.value); }}
                                    className={inputCls}
                                    placeholder={'Option ' + (oi + 1)}
                                    aria-label={'Option ' + (oi + 1) + ' for question ' + (index + 1)}
                                  />
                                  <button
                                    type="button"
                                    onClick={function() { removeOption(question.id, oi); }}
                                    className="p-2 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors flex-shrink-0"
                                    aria-label={'Remove option ' + (oi + 1)}
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
                              <Icon path={ICONS.plus} className="h-4 w-4" />Add Option
                            </button>
                          </div>
                        )}

                        {/* Conditional logic */}
                        {index > 0 && conditionableQs.length > 0 && (
                          <div className="pt-3 border-t border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                              <input
                                type="checkbox"
                                checked={question.has_condition}
                                onChange={function(e) {
                                  updateQuestion(question.id, 'has_condition', e.target.checked);
                                  if (!e.target.checked) {
                                    updateQuestion(question.id, 'condition_question_id', null);
                                    updateQuestion(question.id, 'condition_answer', '');
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                              />
                              <div className="flex items-center gap-2">
                                <Icon path={ICONS.filter} className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold text-[#0E1523]">Only show if...</span>
                              </div>
                            </label>
                            {question.has_condition && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
                                <div>
                                  <label htmlFor={'cond-q-' + question.id} className="block text-xs font-semibold text-[#64748B] mb-1">Question</label>
                                  <select
                                    id={'cond-q-' + question.id}
                                    value={question.condition_question_id || ''}
                                    onChange={function(e) {
                                      updateQuestion(question.id, 'condition_question_id', e.target.value || null);
                                      updateQuestion(question.id, 'condition_answer', '');
                                    }}
                                    className={inputCls}
                                  >
                                    <option value="">Select a question...</option>
                                    {conditionableQs.map(function(cq) {
                                      return (
                                        <option key={cq.id} value={cq.id}>
                                          {'Q' + (questions.indexOf(cq) + 1) + ': ' + cq.question_text.slice(0, 40) + (cq.question_text.length > 40 ? '...' : '')}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor={'cond-a-' + question.id} className="block text-xs font-semibold text-[#64748B] mb-1">Answer is</label>
                                  {question.condition_question_id && condAnswers.length > 0 ? (
                                    <select
                                      id={'cond-a-' + question.id}
                                      value={question.condition_answer || ''}
                                      onChange={function(e) { updateQuestion(question.id, 'condition_answer', e.target.value); }}
                                      className={inputCls}
                                    >
                                      <option value="">Select an answer...</option>
                                      {condAnswers.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                                    </select>
                                  ) : (
                                    <input
                                      id={'cond-a-' + question.id}
                                      type="text"
                                      value={question.condition_answer || ''}
                                      onChange={function(e) { updateQuestion(question.id, 'condition_answer', e.target.value); }}
                                      placeholder="Expected answer..."
                                      className={inputCls}
                                    />
                                  )}
                                </div>
                                {question.condition_question_id && question.condition_answer && (
                                  <div className="md:col-span-2">
                                    <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                                      <Icon path={ICONS.filter} className="h-3.5 w-3.5 flex-shrink-0" />
                                      {'This question will only appear when the answer to the selected question is \u201c' + question.condition_answer + '\u201d'}
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

              <button
                type="button"
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-gray-300 text-[#64748B] hover:border-blue-400 hover:text-blue-500 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />Add Another Question
              </button>
            </div>

            </>
            )}

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || editLoading || !formData.title.trim()}
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
                  {isEditMode ? 'Save Changes' : 'Create Survey'}
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Template Picker — rendered above the main modal */}
      {showTemplatePicker && (
        <TemplatePicker
          organizationId={organizationId}
          onLoad={applyTemplate}
          onClose={function() { setShowTemplatePicker(false); }}
        />
      )}
    </>
  );
}

export default CreateSurvey;