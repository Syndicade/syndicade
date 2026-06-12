import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';

// ── Color tokens ──────────────────────────────────────────────────────────────
var pageBg      = '#F8FAFC';
var cardBg      = '#FFFFFF';
var borderColor = '#E2E8F0';
var elevated    = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// ── Field type options ────────────────────────────────────────────────────────
var FIELD_TYPES = [
  { value: 'text',     label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio',    label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'date',     label: 'Date' },
  { value: 'file',     label: 'File Upload' },
];

var HAS_OPTIONS = ['dropdown', 'radio', 'checkbox'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status) {
  var map = {
    draft:   { bg: '#F1F5F9', color: '#64748B', label: 'Draft' },
    active:  { bg: '#DCFCE7', color: '#16A34A', label: 'Active' },
    closed:  { bg: '#FEE2E2', color: '#DC2626', label: 'Closed' },
  };
  var s = map[status] || map.draft;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {s.label}
    </span>
  );
}

function submissionStatusBadge(status) {
  var map = {
    submitted: { bg: '#EFF6FF', color: '#3B82F6', label: 'Submitted' },
    pending:   { bg: '#FEF9C3', color: '#A16207', label: 'Pending' },
    approved:  { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
    rejected:  { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
  };
  var s = map[status] || map.submitted;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {s.label}
    </span>
  );
}

function inputStyle(extra) {
  return Object.assign({
    width: '100%',
    border: '1px solid ' + borderColor,
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: textPrimary,
    background: cardBg,
    boxSizing: 'border-box',
    outline: 'none',
  }, extra || {});
}

function labelStyle() {
  return { fontSize: '11px', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading forms">
      {[1,2,3].map(function(i) {
        return (
          <div key={i} style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ width: '40%', height: '14px', background: elevated, borderRadius: '6px', marginBottom: '10px' }} />
            <div style={{ width: '70%', height: '10px', background: elevated, borderRadius: '6px', marginBottom: '8px' }} />
            <div style={{ width: '25%', height: '10px', background: elevated, borderRadius: '6px' }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Field builder row ─────────────────────────────────────────────────────────
function FieldRow({ field, index, total, allFields, onChange, onRemove, onMoveUp, onMoveDown }) {
  var [optionInput, setOptionInput] = useState('');
  var showOptions = HAS_OPTIONS.includes(field.field_type);

  // Conditional logic state
  var hasConditional = !!(field.conditional_logic && field.conditional_logic.field_id);
  var eligibleTriggers = allFields.filter(function(f) {
    return f.id !== field.id && HAS_OPTIONS.includes(f.field_type);
  });

  function addOption() {
    var trimmed = optionInput.trim();
    if (!trimmed) return;
    var opts = (field.options || []).concat([trimmed]);
    onChange(field.id, 'options', opts);
    setOptionInput('');
  }

  function removeOption(idx) {
    var opts = (field.options || []).filter(function(_, i) { return i !== idx; });
    onChange(field.id, 'options', opts);
  }

  return (
    <div style={{ background: elevated, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: textMuted, minWidth: '20px' }}>#{index + 1}</span>
        <select
          value={field.field_type}
          onChange={function(e) { onChange(field.id, 'field_type', e.target.value); }}
          style={Object.assign(inputStyle(), { width: 'auto', flex: 1 })}
          aria-label={'Field ' + (index + 1) + ' type'}
        >
          {FIELD_TYPES.map(function(t) {
            return <option key={t.value} value={t.value}>{t.label}</option>;
          })}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: textSecondary, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={function(e) { onChange(field.id, 'required', e.target.checked); }}
            aria-label="Required field"
          />
          Required
        </label>
        {/* Reorder buttons */}
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            style={{ padding: '4px 8px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '6px', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#CBD5E1' : textSecondary, fontSize: '12px' }}
            aria-label="Move field up"
          >↑</button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            style={{ padding: '4px 8px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '6px', cursor: index === total - 1 ? 'default' : 'pointer', color: index === total - 1 ? '#CBD5E1' : textSecondary, fontSize: '12px' }}
            aria-label="Move field down"
          >↓</button>
        </div>
        <button
          onClick={function() { onRemove(field.id); }}
          style={{ padding: '4px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', cursor: 'pointer', color: '#DC2626', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}
          aria-label="Remove field"
        >
          Remove
        </button>
      </div>

      {/* Label */}
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle()} htmlFor={'field-label-' + field.id}>Label</label>
        <input
          id={'field-label-' + field.id}
          type="text"
          value={field.label}
          onChange={function(e) { onChange(field.id, 'label', e.target.value); }}
          placeholder="e.g. What is your request?"
          style={inputStyle()}
          aria-required="true"
        />
      </div>

      {/* Placeholder (text/textarea only) */}
      {(field.field_type === 'text' || field.field_type === 'textarea') && (
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle()} htmlFor={'field-ph-' + field.id}>Placeholder text</label>
          <input
            id={'field-ph-' + field.id}
            type="text"
            value={field.placeholder || ''}
            onChange={function(e) { onChange(field.id, 'placeholder', e.target.value); }}
            placeholder="Optional hint text"
            style={inputStyle()}
          />
        </div>
      )}

      {/* Options (dropdown, radio, checkbox) */}
      {showOptions && (
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle()}>Options</label>
          {(field.options || []).map(function(opt, oi) {
            return (
              <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ flex: 1, fontSize: '12px', color: textPrimary, padding: '5px 10px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '6px' }}>{opt}</span>
                <button
                  onClick={function() { removeOption(oi); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '12px', padding: '4px 8px', borderRadius: '4px' }}
                  aria-label={'Remove option ' + opt}
                >✕</button>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input
              type="text"
              value={optionInput}
              onChange={function(e) { setOptionInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              placeholder="Add option..."
              style={inputStyle({ flex: 1 })}
              aria-label="New option text"
            />
            <button
              onClick={addOption}
              style={{ padding: '8px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#3B82F6', flexShrink: 0 }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Conditional logic */}
      {eligibleTriggers.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid ' + borderColor }}>
          <label style={Object.assign({}, labelStyle(), { color: '#8B5CF6' })}>Conditional logic (show this field only if...)</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={(field.conditional_logic && field.conditional_logic.field_id) || ''}
              onChange={function(e) {
                var fid = e.target.value;
                onChange(field.id, 'conditional_logic', fid ? { field_id: fid, value: '' } : null);
              }}
              style={inputStyle({ flex: 1, minWidth: '140px' })}
              aria-label="Trigger field for conditional logic"
            >
              <option value="">No condition</option>
              {eligibleTriggers.map(function(tf) {
                return <option key={tf.id} value={tf.id}>{tf.label || 'Untitled field'}</option>;
              })}
            </select>
            {hasConditional && (function() {
              var trigger = allFields.find(function(f) { return f.id === field.conditional_logic.field_id; });
              var opts = (trigger && trigger.options) || [];
              return (
                <select
                  value={field.conditional_logic.value || ''}
                  onChange={function(e) {
                    onChange(field.id, 'conditional_logic', Object.assign({}, field.conditional_logic, { value: e.target.value }));
                  }}
                  style={inputStyle({ flex: 1, minWidth: '120px' })}
                  aria-label="Trigger value for conditional logic"
                >
                  <option value="">Any value</option>
                  {opts.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
                </select>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Form modal (create / edit) ────────────────────────────────────────────────
function FormModal({ form, organizationId, currentUserId, onClose, onSaved }) {
  var isEdit = !!(form && form.id);
  var [title, setTitle] = useState((form && form.title) || '');
  var [description, setDescription] = useState((form && form.description) || '');
  var [status, setStatus] = useState((form && form.status) || 'draft');
  var [requiresApproval, setRequiresApproval] = useState(!!(form && form.requires_approval));
  var [fields, setFields] = useState([]);
  var [saving, setSaving] = useState(false);
  var [loadingFields, setLoadingFields] = useState(isEdit);

  useEffect(function() {
    if (isEdit) { loadFields(); }
  }, []);

  async function loadFields() {
    var r = await supabase.from('org_form_fields').select('*').eq('form_id', form.id).order('display_order');
    if (!r.error && r.data) {
      setFields(r.data.map(function(f) { return Object.assign({}, f, { options: f.options || [] }); }));
    }
    setLoadingFields(false);
  }

  function addField() {
    var newField = {
      id: 'new-' + Date.now(),
      field_type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      conditional_logic: null,
      display_order: fields.length,
      _isNew: true,
    };
    setFields(fields.concat([newField]));
  }

  function updateField(id, key, value) {
    setFields(fields.map(function(f) {
      if (f.id !== id) return f;
      return Object.assign({}, f, { [key]: value });
    }));
  }

  function removeField(id) {
    setFields(fields.filter(function(f) { return f.id !== id; }));
  }

  function moveField(index, direction) {
    var newFields = fields.slice();
    var swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= newFields.length) return;
    var temp = newFields[index];
    newFields[index] = newFields[swapIdx];
    newFields[swapIdx] = temp;
    setFields(newFields);
  }

  async function handleSave() {
    if (!title.trim()) { toast.error('Form title is required.'); return; }
    var emptyLabel = fields.some(function(f) { return !f.label.trim(); });
    if (emptyLabel) { toast.error('All fields must have a label.'); return; }

    setSaving(true);
    try {
      var formId;
      if (isEdit) {
        var upd = await supabase.from('org_forms').update({
          title: title.trim(),
          description: description.trim() || null,
          status: status,
          requires_approval: requiresApproval,
          updated_at: new Date().toISOString(),
        }).eq('id', form.id);
        if (upd.error) throw upd.error;
        formId = form.id;

        // Delete all existing fields and re-insert (simplest approach for reorder + edit)
        await supabase.from('org_form_fields').delete().eq('form_id', formId);
      } else {
        var ins = await supabase.from('org_forms').insert({
          organization_id: organizationId,
          created_by: currentUserId,
          title: title.trim(),
          description: description.trim() || null,
          status: status,
          requires_approval: requiresApproval,
        }).select('id').single();
        if (ins.error) throw ins.error;
        formId = ins.data.id;
      }

      // Insert fields
      if (fields.length > 0) {
        var fieldRows = fields.map(function(f, idx) {
          return {
            form_id: formId,
            field_type: f.field_type,
            label: f.label.trim(),
            placeholder: f.placeholder || null,
            required: !!f.required,
            options: HAS_OPTIONS.includes(f.field_type) ? (f.options || []) : null,
            conditional_logic: f.conditional_logic || null,
            display_order: idx,
          };
        });
        var fIns = await supabase.from('org_form_fields').insert(fieldRows);
        if (fIns.error) throw fIns.error;
      }

      mascotSuccessToast(isEdit ? 'Form updated.' : 'Form created!');
      onSaved();
    } catch(e) {
      mascotErrorToast('Failed to save form.', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', zIndex: 60, overflowY: 'auto' }}
      role="dialog" aria-modal="true" aria-labelledby="form-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '16px', width: '100%', maxWidth: '680px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', marginBottom: '24px' }}>
        <h2 id="form-modal-title" style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, marginBottom: '20px' }}>
          {isEdit ? 'Edit Form' : 'Create Form'}
        </h2>

        {/* Title */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle()} htmlFor="form-title">Form Title</label>
          <input id="form-title" type="text" value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="e.g. Marketing Flier Request" style={inputStyle()} aria-required="true" />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle()} htmlFor="form-desc">Description (optional)</label>
          <textarea id="form-desc" value={description} onChange={function(e) { setDescription(e.target.value); }} placeholder="Explain what this form is for..." rows={2} style={Object.assign(inputStyle(), { resize: 'vertical' })} />
        </div>

        {/* Status + Approval row */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={labelStyle()} htmlFor="form-status">Status</label>
            <select id="form-status" value={status} onChange={function(e) { setStatus(e.target.value); }} style={inputStyle()}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '8px' }}>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={function(e) { setRequiresApproval(e.target.checked); }}
                aria-describedby="approval-hint"
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>Require admin approval</span>
            </label>
            <p id="approval-hint" style={{ fontSize: '11px', color: textMuted, margin: 0, lineHeight: 1.4 }}>
              Submissions will show as Pending until you approve or reject them.
            </p>
          </div>
        </div>

        {/* Fields section */}
        <div style={{ borderTop: '1px solid ' + borderColor, paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: textPrimary, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Form Fields {fields.length > 0 && <span style={{ color: textMuted, fontWeight: 400 }}>({fields.length})</span>}
            </h3>
            <button
              onClick={addField}
              style={{ padding: '7px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#3B82F6' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              + Add Field
            </button>
          </div>

          {loadingFields ? (
            <div style={{ padding: '20px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>Loading fields...</div>
          ) : fields.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: elevated, borderRadius: '10px', border: '1px dashed ' + borderColor }}>
              <p style={{ color: textMuted, fontSize: '13px', margin: 0 }}>No fields yet. Add a field to get started.</p>
            </div>
          ) : (
            fields.map(function(field, idx) {
              return (
                <FieldRow
                  key={field.id}
                  field={field}
                  index={idx}
                  total={fields.length}
                  allFields={fields}
                  onChange={updateField}
                  onRemove={removeField}
                  onMoveUp={function() { moveField(idx, -1); }}
                  onMoveDown={function() { moveField(idx, 1); }}
                />
              );
            })
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid ' + borderColor, paddingTop: '20px' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: textMuted }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 24px', background: '#3B82F6', border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', opacity: saving ? 0.7 : 1 }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Form')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Submissions drawer ────────────────────────────────────────────────────────
function SubmissionsDrawer({ form, organizationId, onClose }) {
  var [submissions, setSubmissions] = useState([]);
  var [fields, setFields] = useState([]);
  var [loading, setLoading] = useState(true);
  var [selected, setSelected] = useState(null);
  var [adminNotes, setAdminNotes] = useState('');
  var [reviewing, setReviewing] = useState(false);
  var [memberNames, setMemberNames] = useState({});

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    var [subRes, fieldRes] = await Promise.all([
      supabase.from('org_form_submissions').select('*').eq('form_id', form.id).order('created_at', { ascending: false }),
      supabase.from('org_form_fields').select('*').eq('form_id', form.id).order('display_order'),
    ]);
    if (!subRes.error) { setSubmissions(subRes.data || []); loadMemberNames(subRes.data || []); }
    if (!fieldRes.error) { setFields(fieldRes.data || []); }
    setLoading(false);
  }

  async function loadMemberNames(subs) {
    var userIds = subs.map(function(s) { return s.submitted_by; }).filter(Boolean);
    if (!userIds.length) return;
    var r = await supabase.from('members').select('user_id,first_name,last_name').in('user_id', userIds);
    if (!r.error && r.data) {
      var map = {};
      r.data.forEach(function(m) { map[m.user_id] = m.first_name + ' ' + m.last_name; });
      setMemberNames(map);
    }
  }

  function selectSubmission(sub) {
    setSelected(sub);
    setAdminNotes(sub.admin_notes || '');
  }

  async function handleReview(newStatus) {
    if (!selected) return;
    setReviewing(true);
    try {
      var authR = await supabase.auth.getUser();
      var reviewerId = authR.data && authR.data.user ? authR.data.user.id : null;
      var upd = await supabase.from('org_form_submissions').update({
        status: newStatus,
        admin_notes: adminNotes.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', selected.id);
      if (upd.error) throw upd.error;
      mascotSuccessToast('Submission ' + newStatus + '.');
      setSelected(null);
      loadData();
    } catch(e) {
      mascotErrorToast('Failed to update submission.', e.message);
    } finally {
      setReviewing(false);
    }
  }

  function formatDate(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function renderResponse(field, responses) {
    var val = responses[field.id];
    if (val === undefined || val === null || val === '') return <span style={{ color: textMuted, fontStyle: 'italic' }}>No response</span>;
    if (Array.isArray(val)) return <span>{val.join(', ')}</span>;
    return <span style={{ whiteSpace: 'pre-wrap' }}>{String(val)}</span>;
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="submissions-drawer-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '560px', background: cardBg, borderLeft: '1px solid ' + borderColor, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* Drawer header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + borderColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 id="submissions-drawer-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, margin: 0 }}>Submissions</h2>
            <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{form.title}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted, fontSize: '20px', lineHeight: 1, padding: '4px' }}
            aria-label="Close submissions drawer"
            className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div aria-busy="true" aria-label="Loading submissions">
              {[1,2,3].map(function(i) {
                return <div key={i} style={{ height: '60px', background: elevated, borderRadius: '8px', marginBottom: '8px' }} />;
              })}
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>No submissions yet</p>
              <p style={{ fontSize: '13px', color: textMuted }}>Submissions will appear here once members fill out this form.</p>
            </div>
          ) : (
            submissions.map(function(sub) {
              var isSelected = selected && selected.id === sub.id;
              return (
                <div key={sub.id} style={{ border: '1px solid ' + (isSelected ? '#3B82F6' : borderColor), borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', cursor: 'pointer', background: isSelected ? '#EFF6FF' : cardBg, transition: 'border-color 0.15s' }}
                  onClick={function() { selectSubmission(sub); }}
                  role="button" tabIndex={0}
                  onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') selectSubmission(sub); }}
                  aria-expanded={isSelected}
                  aria-label={'Submission from ' + (memberNames[sub.submitted_by] || 'Member') + ', ' + (sub.status)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isSelected ? '12px' : 0 }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>{memberNames[sub.submitted_by] || 'Member'}</p>
                      <p style={{ fontSize: '11px', color: textMuted, margin: '2px 0 0' }}>{formatDate(sub.created_at)}</p>
                    </div>
                    {submissionStatusBadge(sub.status)}
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div>
                      <div style={{ borderTop: '1px solid ' + borderColor, paddingTop: '12px', marginTop: '4px' }}>
                        {fields.map(function(field) {
                          return (
                            <div key={field.id} style={{ marginBottom: '10px' }}>
                              <p style={{ fontSize: '11px', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>{field.label}</p>
                              <p style={{ fontSize: '13px', color: textPrimary, margin: 0 }}>{renderResponse(field, sub.responses || {})}</p>
                            </div>
                          );
                        })}
                      </div>

                      {form.requires_approval && (
                        <div style={{ borderTop: '1px solid ' + borderColor, paddingTop: '12px', marginTop: '8px' }}>
                          <label style={labelStyle()} htmlFor={'notes-' + sub.id}>Admin Notes (optional)</label>
                          <textarea
                            id={'notes-' + sub.id}
                            value={adminNotes}
                            onChange={function(e) { setAdminNotes(e.target.value); }}
                            rows={2}
                            placeholder="Optional note to member..."
                            style={Object.assign(inputStyle(), { resize: 'vertical', marginBottom: '10px' })}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={function(e) { e.stopPropagation(); handleReview('approved'); }}
                              disabled={reviewing}
                              style={{ flex: 1, padding: '9px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#16A34A' }}
                              className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                            >
                              Approve
                            </button>
                            <button
                              onClick={function(e) { e.stopPropagation(); handleReview('rejected'); }}
                              disabled={reviewing}
                              style={{ flex: 1, padding: '9px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#DC2626' }}
                              className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
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

// ── Member submit form modal ──────────────────────────────────────────────────
function SubmitFormModal({ form, organizationId, currentUserId, onClose, onSubmitted }) {
  var [fields, setFields] = useState([]);
  var [responses, setResponses] = useState({});
  var [loading, setLoading] = useState(true);
  var [submitting, setSubmitting] = useState(false);

  useEffect(function() { loadFields(); }, []);

  async function loadFields() {
    var r = await supabase.from('org_form_fields').select('*').eq('form_id', form.id).order('display_order');
    if (!r.error && r.data) {
      setFields(r.data);
      // Initialize responses
      var init = {};
      r.data.forEach(function(f) {
        init[f.id] = f.field_type === 'checkbox' ? [] : '';
      });
      setResponses(init);
    }
    setLoading(false);
  }

  function isFieldVisible(field) {
    var cl = field.conditional_logic;
    if (!cl || !cl.field_id) return true;
    var triggerVal = responses[cl.field_id];
    if (!cl.value) return !!triggerVal;
    if (Array.isArray(triggerVal)) return triggerVal.includes(cl.value);
    return triggerVal === cl.value;
  }

  function setResponse(fieldId, value) {
    setResponses(function(prev) { return Object.assign({}, prev, { [fieldId]: value }); });
  }

  function toggleCheckbox(fieldId, opt) {
    var current = responses[fieldId] || [];
    var updated = current.includes(opt) ? current.filter(function(v) { return v !== opt; }) : current.concat([opt]);
    setResponse(fieldId, updated);
  }

  async function handleSubmit() {
    // Validate required visible fields
    var missing = fields.filter(function(f) {
      if (!isFieldVisible(f)) return false;
      if (!f.required) return false;
      var val = responses[f.id];
      if (Array.isArray(val)) return val.length === 0;
      return !val || !String(val).trim();
    });
    if (missing.length > 0) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      // Only include responses for visible fields
      var visibleResponses = {};
      fields.forEach(function(f) {
        if (isFieldVisible(f)) visibleResponses[f.id] = responses[f.id];
      });

      var initialStatus = form.requires_approval ? 'pending' : 'submitted';
      var ins = await supabase.from('org_form_submissions').insert({
        form_id: form.id,
        organization_id: organizationId,
        submitted_by: currentUserId,
        responses: visibleResponses,
        status: initialStatus,
      });
      if (ins.error) throw ins.error;

      // Notify admins
      try {
        var { notifyOrgAdmins } = await import("../lib/notificationService");
        await notifyOrgAdmins({
          organizationId: organizationId,
          type: 'form_submission',
          title: 'New form submission',
          message: 'A member submitted: ' + form.title,
          link: '/organizations/' + organizationId + '/approvals',
        });
      } catch(notifErr) {
        console.warn('Notification failed:', notifErr);
      }

      mascotSuccessToast(form.requires_approval ? 'Submitted! Pending admin review.' : 'Form submitted successfully!');
      onSubmitted();
    } catch(e) {
      mascotErrorToast('Failed to submit form.', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field) {
    var val = responses[field.id];
    var opts = field.options || [];

    if (field.field_type === 'text') {
      return (
        <input
          id={'resp-' + field.id}
          type="text"
          value={val || ''}
          onChange={function(e) { setResponse(field.id, e.target.value); }}
          placeholder={field.placeholder || ''}
          style={inputStyle()}
          aria-required={field.required}
        />
      );
    }
    if (field.field_type === 'textarea') {
      return (
        <textarea
          id={'resp-' + field.id}
          value={val || ''}
          onChange={function(e) { setResponse(field.id, e.target.value); }}
          placeholder={field.placeholder || ''}
          rows={3}
          style={Object.assign(inputStyle(), { resize: 'vertical' })}
          aria-required={field.required}
        />
      );
    }
    if (field.field_type === 'dropdown') {
      return (
        <select
          id={'resp-' + field.id}
          value={val || ''}
          onChange={function(e) { setResponse(field.id, e.target.value); }}
          style={inputStyle()}
          aria-required={field.required}
        >
          <option value="">Select an option...</option>
          {opts.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
        </select>
      );
    }
    if (field.field_type === 'radio') {
      return (
        <div role="radiogroup" aria-labelledby={'label-' + field.id}>
          {opts.map(function(o) {
            return (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer', fontSize: '13px', color: textPrimary }}>
                <input
                  type="radio"
                  name={'radio-' + field.id}
                  value={o}
                  checked={val === o}
                  onChange={function() { setResponse(field.id, o); }}
                  aria-required={field.required}
                />
                {o}
              </label>
            );
          })}
        </div>
      );
    }
    if (field.field_type === 'checkbox') {
      return (
        <div role="group" aria-labelledby={'label-' + field.id}>
          {opts.map(function(o) {
            return (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer', fontSize: '13px', color: textPrimary }}>
                <input
                  type="checkbox"
                  checked={(val || []).includes(o)}
                  onChange={function() { toggleCheckbox(field.id, o); }}
                />
                {o}
              </label>
            );
          })}
        </div>
      );
    }
    if (field.field_type === 'date') {
      return (
        <input
          id={'resp-' + field.id}
          type="date"
          value={val || ''}
          onChange={function(e) { setResponse(field.id, e.target.value); }}
          style={inputStyle()}
          aria-required={field.required}
        />
      );
    }
    if (field.field_type === 'file') {
      return (
        <div style={{ padding: '12px', background: elevated, borderRadius: '8px', border: '1px dashed ' + borderColor }}>
          <p style={{ fontSize: '12px', color: textMuted, margin: 0 }}>File upload fields require you to share files via the Documents section or email. Contact your admin for details.</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', zIndex: 60, overflowY: 'auto' }}
      role="dialog" aria-modal="true" aria-labelledby="submit-form-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', marginBottom: '24px' }}>
        <h2 id="submit-form-title" style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, marginBottom: '4px' }}>{form.title}</h2>
        {form.description && <p style={{ fontSize: '13px', color: textSecondary, marginBottom: '20px', lineHeight: 1.5 }}>{form.description}</p>}
        {form.requires_approval && (
          <div style={{ padding: '10px 14px', background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#92400E', margin: 0 }}>This form requires admin approval. You'll be notified once your submission is reviewed.</p>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: textMuted }}>Loading form...</div>
        ) : fields.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: textMuted }}>This form has no fields yet.</div>
        ) : (
          fields.filter(isFieldVisible).map(function(field) {
            return (
              <div key={field.id} style={{ marginBottom: '18px' }}>
                <label
                  id={'label-' + field.id}
                  htmlFor={'resp-' + field.id}
                  style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '6px' }}
                >
                  {field.label}
                  {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }} aria-hidden="true">*</span>}
                </label>
                {renderField(field)}
              </div>
            );
          })
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid ' + borderColor, paddingTop: '20px' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: textMuted }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            style={{ padding: '10px 24px', background: '#3B82F6', border: 'none', borderRadius: '8px', cursor: submitting ? 'default' : 'pointer', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', opacity: submitting ? 0.7 : 1 }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form card with Actions dropdown ──────────────────────────────────────────
function FormCard({ form, isAdmin, subCount, duplicating, onEdit, onDuplicate, onSubmissions, onDelete, onSubmit, formatDate }) {
  var [menuOpen, setMenuOpen] = useState(false);
  var menuRef = useRef(null);

  useEffect(function() {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, [menuOpen]);

  return (
    <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: textPrimary, margin: 0, flex: 1 }}>{form.title}</h3>
        {isAdmin && statusBadge(form.status)}
      </div>

      {/* Description */}
      {form.description && (
        <p style={{ fontSize: '13px', color: textSecondary, margin: 0, lineHeight: 1.5 }}>{form.description}</p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        {form.requires_approval && (
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8B5CF6', background: '#F5F3FF', padding: '2px 8px', borderRadius: '99px' }}>Requires Approval</span>
        )}
        {isAdmin && subCount > 0 && (
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6', background: '#EFF6FF', padding: '2px 8px', borderRadius: '99px' }}>
            {subCount} {subCount === 1 ? 'submission' : 'submissions'}
          </span>
        )}
        <span style={{ fontSize: '11px', color: textMuted, marginLeft: 'auto' }}>Created {formatDate(form.created_at)}</span>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', borderTop: '1px solid ' + borderColor, paddingTop: '12px' }}>
        {isAdmin ? (
          <>
            <button
              onClick={onSubmissions}
              style={{ flex: 1, padding: '8px 14px', background: elevated, border: '1px solid ' + borderColor, borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: textSecondary, textAlign: 'center' }}
              className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
            >
              Submissions{subCount > 0 ? ' (' + subCount + ')' : ''}
            </button>

            {/* Actions dropdown */}
            <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={function() { setMenuOpen(function(p) { return !p; }); }}
                style={{ padding: '8px 14px', background: elevated, border: '1px solid ' + borderColor, borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="Form actions"
                className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              >
                Actions
                <span aria-hidden="true" style={{ fontSize: '10px' }}>{menuOpen ? '▲' : '▼'}</span>
              </button>

              {menuOpen && (
                <div
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: '160px', zIndex: 30, overflow: 'hidden' }}
                  role="menu"
                >
                  {[
                    { label: 'Edit', action: function() { setMenuOpen(false); onEdit(); } },
                    { label: duplicating === form.id ? 'Duplicating...' : 'Duplicate', action: function() { setMenuOpen(false); onDuplicate(); }, disabled: duplicating === form.id },
                    { label: 'Delete', action: function() { setMenuOpen(false); onDelete(); }, danger: true },
                  ].map(function(item) {
                    return (
                      <button
                        key={item.label}
                        onClick={item.action}
                        disabled={item.disabled}
                        role="menuitem"
                        style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: item.danger ? '#EF4444' : textSecondary, cursor: item.disabled ? 'default' : 'pointer', opacity: item.disabled ? 0.5 : 1 }}
                        className={item.danger ? 'hover:bg-red-50 focus:outline-none focus:bg-red-50' : 'hover:bg-slate-50 focus:outline-none focus:bg-slate-50'}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={onSubmit}
            style={{ flex: 1, padding: '8px 18px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Fill Out Form
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function OrgForms() {
  var { organizationId, isAdmin } = useOutletContext();
  var [forms, setForms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [currentUserId, setCurrentUserId] = useState(null);
  var [showFormModal, setShowFormModal] = useState(false);
  var [editingForm, setEditingForm] = useState(null);
  var [viewingSubmissions, setViewingSubmissions] = useState(null);
  var [submittingForm, setSubmittingForm] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(null);
  var [deleting, setDeleting] = useState(false);
  var [duplicating, setDuplicating] = useState(null);
  var [subCounts, setSubCounts] = useState({});

  useEffect(function() {
    supabase.auth.getUser().then(function(r) {
      if (r.data && r.data.user) setCurrentUserId(r.data.user.id);
    });
    loadForms();
  }, [organizationId, isAdmin]);

  async function loadForms() {
    setLoading(true);
    try {
      var query = supabase.from('org_forms').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false });
      if (!isAdmin) { query = query.eq('status', 'active'); }
      var r = await query;
      if (r.error) throw r.error;
      var formList = r.data || [];
      setForms(formList);

      // Load submission counts for admins
      if (isAdmin && formList.length > 0) {
        var formIds = formList.map(function(f) { return f.id; });
        var countRes = await supabase.from('org_form_submissions').select('form_id').in('form_id', formIds);
        if (!countRes.error && countRes.data) {
          var counts = {};
          countRes.data.forEach(function(s) { counts[s.form_id] = (counts[s.form_id] || 0) + 1; });
          setSubCounts(counts);
        }
      }
    } catch(e) {
      mascotErrorToast('Failed to load forms.', e.message);
    } finally {
      setLoading(false);
    }
  }

  // Submission counts loaded above for admin cards

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      var d = await supabase.from('org_forms').delete().eq('id', confirmDelete.id);
      if (d.error) throw d.error;
      mascotSuccessToast('Form deleted.');
      setConfirmDelete(null);
      loadForms();
    } catch(e) {
      mascotErrorToast('Failed to delete form.', e.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(form) {
    setDuplicating(form.id);
    try {
      var ins = await supabase.from('org_forms').insert({
        organization_id: organizationId,
        created_by: currentUserId,
        title: 'Copy of ' + form.title,
        description: form.description || null,
        status: 'draft',
        requires_approval: form.requires_approval,
      }).select('id').single();
      if (ins.error) throw ins.error;
      var newFormId = ins.data.id;

      var fieldRes = await supabase.from('org_form_fields').select('*').eq('form_id', form.id).order('display_order');
      if (!fieldRes.error && fieldRes.data && fieldRes.data.length > 0) {
        var newFields = fieldRes.data.map(function(f) {
          return {
            form_id: newFormId,
            field_type: f.field_type,
            label: f.label,
            placeholder: f.placeholder,
            required: f.required,
            options: f.options,
            conditional_logic: f.conditional_logic,
            display_order: f.display_order,
          };
        });
        var fIns = await supabase.from('org_form_fields').insert(newFields);
        if (fIns.error) throw fIns.error;
      }

      mascotSuccessToast('Form duplicated as draft.');
      loadForms();
    } catch(e) {
      mascotErrorToast('Failed to duplicate form.', e.message);
    } finally {
      setDuplicating(null);
    }
  }

  function formatDate(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div style={{ background: pageBg, minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ padding: '0 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: textPrimary, margin: 0 }}>Forms</h1>
            {!loading && (
              <p style={{ fontSize: '14px', color: textMuted, marginTop: '4px' }}>
                {isAdmin
                  ? (forms.length + (forms.length === 1 ? ' form' : ' forms'))
                  : (forms.length + ' available')}
              </p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={function() { setEditingForm(null); setShowFormModal(true); }}
              style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              New Form
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : forms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px' }}>
          <div style={{ width: '56px', height: '56px', background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #BFDBFE' }} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>
            {isAdmin ? 'No forms yet' : 'No forms available'}
          </h2>
          <p style={{ fontSize: '14px', color: textMuted, marginBottom: isAdmin ? '24px' : 0, maxWidth: '320px', margin: '0 auto' }}>
            {isAdmin
              ? 'Create your first form so members can submit requests like flier designs, PR statements, and more.'
              : 'Your organization hasn\'t published any forms yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={function() { setEditingForm(null); setShowFormModal(true); }}
              style={{ marginTop: '20px', padding: '10px 24px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create First Form
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {forms.map(function(form) {
            var subCount = subCounts[form.id] || 0;
            return (
              <FormCard
                key={form.id}
                form={form}
                isAdmin={isAdmin}
                subCount={subCount}
                duplicating={duplicating}
                onEdit={function() { setEditingForm(form); setShowFormModal(true); }}
                onDuplicate={function() { handleDuplicate(form); }}
                onSubmissions={function() { setViewingSubmissions(form); }}
                onDelete={function() { setConfirmDelete(form); }}
                onSubmit={function() { setSubmittingForm(form); }}
                formatDate={formatDate}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showFormModal && (
        <FormModal
          form={editingForm}
          organizationId={organizationId}
          currentUserId={currentUserId}
          onClose={function() { setShowFormModal(false); setEditingForm(null); }}
          onSaved={function() { setShowFormModal(false); setEditingForm(null); loadForms(); }}
        />
      )}

      {viewingSubmissions && (
        <SubmissionsDrawer
          form={viewingSubmissions}
          organizationId={organizationId}
          onClose={function() { setViewingSubmissions(null); }}
        />
      )}

      {submittingForm && (
        <SubmitFormModal
          form={submittingForm}
          organizationId={organizationId}
          currentUserId={currentUserId}
          onClose={function() { setSubmittingForm(null); }}
          onSubmitted={function() { setSubmittingForm(null); loadForms(); }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 70 }}
          role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title"
          onClick={function(e) { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '14px', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 id="delete-confirm-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginBottom: '10px' }}>Delete Form?</h3>
            <p style={{ fontSize: '13px', color: textSecondary, marginBottom: '20px', lineHeight: 1.5 }}>
              Deleting <strong>{confirmDelete.title}</strong> will permanently remove it and all its submissions. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={function() { setConfirmDelete(null); }}
                style={{ padding: '9px 18px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: textMuted }}
                className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '9px 18px', background: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', opacity: deleting ? 0.7 : 1 }}
                className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgForms;