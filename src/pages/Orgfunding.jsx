import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import {
  DollarSign, Plus, X, ChevronDown, ChevronUp, Users, Globe, Lock,
  Pencil, Trash2, FileText, Calendar, ExternalLink, Mail,
  AlertCircle, CheckCircle, Search, Paperclip, Upload, BookOpen, Inbox
} from 'lucide-react';

// ── Tokens ────────────────────────────────────────────────────────────────────
var pageBg        = '#F8FAFC';
var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var elevatedBg    = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';
var textTertiary  = '#94A3B8';

// ── Constants ─────────────────────────────────────────────────────────────────
var FUNDING_TYPES = [
  { value: 'scholarship',    label: 'Scholarship' },
  { value: 'grant',          label: 'Grant' },
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'fellowship',     label: 'Fellowship' },
  { value: 'award',          label: 'Award / Recognition' },
  { value: 'other',          label: 'Other' },
];

var AMOUNT_TYPES = [
  { value: 'fixed',  label: 'Fixed amount' },
  { value: 'range',  label: 'Amount range' },
  { value: 'varies', label: 'Varies' },
];

var APPLY_METHODS = [
  { value: 'link', label: 'External link / email' },
  { value: 'form', label: 'In-platform contact form' },
];

var VISIBILITY_META = {
  draft:        { label: 'Draft',        color: '#64748B', bg: '#F1F5F9',              icon: Lock },
  members_only: { label: 'Members Only', color: '#D97706', bg: 'rgba(245,183,49,0.1)', icon: Users },
  public:       { label: 'Public',       color: '#16A34A', bg: 'rgba(34,197,94,0.1)',  icon: Globe },
};

var FUNDING_TYPE_COLORS = {
  scholarship:    { bg: '#EFF6FF', color: '#3B82F6' },
  grant:          { bg: '#F0FDF4', color: '#16A34A' },
  emergency_fund: { bg: '#FEF2F2', color: '#DC2626' },
  fellowship:     { bg: '#F5F3FF', color: '#8B5CF6' },
  award:          { bg: 'rgba(245,183,49,0.1)', color: '#B45309' },
  other:          { bg: '#F1F5F9', color: '#64748B' },
};

var EMPTY_FORM = {
  title: '',
  funding_type: 'scholarship',
  funding_type_other: '',
  description: '',
  amount_type: 'fixed',
  amount_min: '',
  amount_max: '',
  eligibility: '',
  apply_method: 'form',
  apply_url: '',
  tags: [],
  visibility: 'draft',
  deadline: '',
};

// ── Visibility badge ──────────────────────────────────────────────────────────
function VisibilityBadge({ visibility }) {
  var meta = VISIBILITY_META[visibility] || VISIBILITY_META.draft;
  var IconComp = meta.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: meta.bg, color: meta.color }}>
      <IconComp size={10} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────
var TAG_SUGGESTIONS = [
  'volunteer','fundraising','nonprofit','community','education','youth',
  'environment','health','arts','housing','food','legal','mentorship',
  'advocacy','senior','veterans','disability','literacy','job-training','stem',
];

function TagInput({ tags, onChange }) {
  var [input, setInput] = useState('');

  var suggestions = input.length > 0
    ? TAG_SUGGESTIONS.filter(function(s) {
        return s.includes(input.toLowerCase()) && !tags.includes(s);
      }).slice(0, 5)
    : [];

  function addTag(val) {
    var trimmed = val.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange(tags.concat([trimmed]));
    setInput('');
  }

  function removeTag(tag) {
    onChange(tags.filter(function(t) { return t !== tag; }));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    else if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', border: '1px solid ' + borderColor, borderRadius: '8px', background: cardBg, minHeight: '42px', cursor: 'text' }}
        onClick={function(e) { e.currentTarget.querySelector('input').focus(); }}
      >
        {tags.map(function(tag) {
          return (
            <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', background: '#EFF6FF', color: '#3B82F6', fontSize: '12px', fontWeight: 600 }}>
              {tag}
              <button type="button" onClick={function() { removeTag(tag); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '0', lineHeight: 1, display: 'flex' }} aria-label={'Remove tag ' + tag}>
                <X size={10} />
              </button>
            </span>
          );
        })}
        <input
          value={input}
          onChange={function(e) { setInput(e.target.value); }}
          onKeyDown={handleKeyDown}
          onBlur={function() { if (input) addTag(input); }}
          placeholder={tags.length ? '' : 'Type a tag and press Enter'}
          style={{ border: 'none', outline: 'none', fontSize: '13px', color: textPrimary, flex: 1, minWidth: '120px', background: 'transparent' }}
          aria-label="Add tags"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
        />
      </div>
      {suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 10, overflow: 'hidden' }} role="listbox" aria-label="Tag suggestions">
          {suggestions.map(function(s) {
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected="false"
                onMouseDown={function(e) { e.preventDefault(); addTag(s); }}
                style={{ width: '100%', padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: textPrimary, textAlign: 'left' }}
                className="hover:bg-slate-50"
              >
                {s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading funding listings">
      {[1, 2, 3].map(function(i) {
        return (
          <div key={i} style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: '16px', width: '55%', background: elevatedBg, borderRadius: '6px', marginBottom: '10px' }} />
                <div style={{ height: '12px', width: '30%', background: elevatedBg, borderRadius: '6px', marginBottom: '8px' }} />
                <div style={{ height: '12px', width: '80%', background: elevatedBg, borderRadius: '6px' }} />
              </div>
              <div style={{ width: '70px', height: '22px', background: elevatedBg, borderRadius: '99px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd, isVerified }) {
  if (!isVerified) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
          <CheckCircle size={24} color="#22C55E" />
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>Verified Nonprofits Only</h3>
        <p style={{ fontSize: '14px', color: textSecondary, maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.6 }}>
          Posting grants and scholarships is available to verified 501(c)(3) organizations. Get verified to share your funding opportunities with the community.
        </p>
        <a href="settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }} className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          Get Verified
        </a>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
        <DollarSign size={24} color="#16A34A" />
      </div>
      <h3 style={{ fontSize: '17px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>No funding listings yet</h3>
      <p style={{ fontSize: '14px', color: textSecondary, maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.6 }}>
        Post your scholarships, grants, and funding opportunities here. Share them with members first or publish to the public directory.
      </p>
      <button onClick={onAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }} className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
        <Plus size={15} aria-hidden="true" />
        Post Funding
      </button>
    </div>
  );
}

// ── Funding form modal ────────────────────────────────────────────────────────
function FundingModal({ organizationId, currentUserId, existing, onClose, onSaved }) {
  var [form, setForm] = useState(existing ? {
    title: existing.title || '',
    funding_type: existing.funding_type || 'scholarship',
    funding_type_other: existing.funding_type_other || '',
    description: existing.description || '',
    amount_type: existing.amount_type || 'fixed',
    amount_min: existing.amount_min || '',
    amount_max: existing.amount_max || '',
    eligibility: existing.eligibility || '',
    apply_method: existing.apply_method || 'form',
    apply_url: existing.apply_url || '',
    tags: existing.tags || [],
    visibility: existing.visibility || 'draft',
    deadline: existing.deadline || '',
  } : EMPTY_FORM);

  var [saving, setSaving] = useState(false);
  var [errors, setErrors] = useState({});
  var [postingFile, setPostingFile] = useState(null);
  var [existingPostingUrl, setExistingPostingUrl] = useState(existing ? existing.posting_url || null : null);
  var fileInputRef = useRef(null);

  var ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

  function setField(key, val) {
    setForm(function(prev) { var n = Object.assign({}, prev); n[key] = val; return n; });
    if (errors[key]) setErrors(function(prev) { var n = Object.assign({}, prev); delete n[key]; return n; });
  }

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error('Please upload a PDF, Word document, or image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB.'); return; }
    setPostingFile(file);
  }

  function removeFile() {
    setPostingFile(null);
    setExistingPostingUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    var errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (form.apply_method === 'link' && !form.apply_url.trim()) errs.apply_url = 'Provide an apply URL or email address.';
    if (form.amount_type === 'fixed' && !form.amount_min) errs.amount_min = 'Enter an amount.';
    return errs;
  }

  async function handleSave() {
    var errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    var toastId = toast.loading(existing ? 'Saving...' : 'Posting...');

    var postingUrl = existingPostingUrl || null;
    if (postingFile) {
      var fileExt = postingFile.name.split('.').pop();
      var filePath = organizationId + '/' + Date.now() + '.' + fileExt;
      var uploadResult = await supabase.storage.from('funding-docs').upload(filePath, postingFile, { upsert: true });
      if (uploadResult.error) {
        toast.dismiss(toastId);
        setSaving(false);
        mascotErrorToast('File upload failed.', uploadResult.error.message);
        return;
      }
      postingUrl = supabase.storage.from('funding-docs').getPublicUrl(filePath).data.publicUrl;
    }

    var payload = {
      organization_id: organizationId,
      title: form.title.trim(),
      funding_type: form.funding_type,
      funding_type_other: form.funding_type_other.trim() || null,
      description: form.description.trim(),
      amount_type: form.amount_type,
      amount_min: form.amount_min ? parseFloat(form.amount_min) : null,
      amount_max: form.amount_max ? parseFloat(form.amount_max) : null,
      eligibility: form.eligibility.trim() || null,
      apply_method: form.apply_method,
      apply_url: form.apply_url.trim() || null,
      tags: form.tags,
      visibility: form.visibility,
      deadline: form.deadline || null,
      posting_url: postingUrl,
      updated_at: new Date().toISOString(),
    };

    if (!existing) {
      payload.created_by = currentUserId;
    }

    var result = existing
      ? await supabase.from('org_funding').update(payload).eq('id', existing.id)
      : await supabase.from('org_funding').insert(payload);

    toast.dismiss(toastId);
    setSaving(false);

    if (result.error) { mascotErrorToast('Failed to save listing.', result.error.message); return; }
    mascotSuccessToast(existing ? 'Listing updated!' : 'Funding posted!');
    onSaved();
    onClose();
  }

  var inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, background: cardBg, boxSizing: 'border-box', outline: 'none' };
  var labelStyle = { fontSize: '12px', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '5px' };
  var fieldStyle = { marginBottom: '16px' };
  var errorStyle = { fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', zIndex: 50, overflowY: 'auto' }}
      role="dialog" aria-modal="true" aria-labelledby="funding-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: cardBg, borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', marginTop: '16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + borderColor }}>
          <h2 id="funding-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: textPrimary, margin: 0 }}>
            {existing ? 'Edit Funding Listing' : 'Post Funding Opportunity'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '4px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>

          <div style={fieldStyle}>
            <label htmlFor="fund-title" style={labelStyle}>Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
            <input id="fund-title" value={form.title} onChange={function(e) { setField('title', e.target.value); }} placeholder="e.g. Community Impact Scholarship" style={Object.assign({}, inputStyle, errors.title ? { borderColor: '#EF4444' } : {})} aria-required="true" className="focus:ring-2 focus:ring-blue-500" />
            {errors.title && <p style={errorStyle} role="alert"><AlertCircle size={11} />{errors.title}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="fund-type" style={labelStyle}>Funding Type</label>
            <select id="fund-type" value={form.funding_type} onChange={function(e) { setField('funding_type', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
              {FUNDING_TYPES.map(function(t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
            </select>
          </div>

          {form.funding_type === 'other' && (
            <div style={fieldStyle}>
              <label htmlFor="fund-type-other" style={labelStyle}>Describe the funding type</label>
              <input id="fund-type-other" value={form.funding_type_other} onChange={function(e) { setField('funding_type_other', e.target.value); }} placeholder="e.g. Microgrant, Seed funding..." style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div style={fieldStyle}>
            <label htmlFor="fund-desc" style={labelStyle}>Description <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
            <textarea id="fund-desc" value={form.description} onChange={function(e) { setField('description', e.target.value); }} placeholder="Describe what this funding is for, who it supports, and why your organization offers it..." rows={5} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 }, errors.description ? { borderColor: '#EF4444' } : {})} aria-required="true" className="focus:ring-2 focus:ring-blue-500" />
            {errors.description && <p style={errorStyle} role="alert"><AlertCircle size={11} />{errors.description}</p>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Amount</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {AMOUNT_TYPES.map(function(t) {
                var active = form.amount_type === t.value;
                return (
                  <button key={t.value} type="button" onClick={function() { setField('amount_type', t.value); }}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '2px solid ' + (active ? '#16A34A' : borderColor), background: active ? '#F0FDF4' : cardBg, color: active ? '#16A34A' : textMuted, cursor: 'pointer' }}
                    className="focus:outline-none focus:ring-2 focus:ring-green-500" aria-pressed={active}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {form.amount_type === 'fixed' && (
              <div style={{ position: 'relative' }}>
                <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                <input id="fund-amount-min" type="number" min="0" value={form.amount_min} onChange={function(e) { setField('amount_min', e.target.value); }} placeholder="Amount" style={Object.assign({}, inputStyle, { paddingLeft: '28px' }, errors.amount_min ? { borderColor: '#EF4444' } : {})} aria-label="Fixed amount" className="focus:ring-2 focus:ring-blue-500" />
                {errors.amount_min && <p style={errorStyle} role="alert"><AlertCircle size={11} />{errors.amount_min}</p>}
              </div>
            )}

            {form.amount_type === 'range' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                  <input type="number" min="0" value={form.amount_min} onChange={function(e) { setField('amount_min', e.target.value); }} placeholder="Min" style={Object.assign({}, inputStyle, { paddingLeft: '28px' })} aria-label="Minimum amount" className="focus:ring-2 focus:ring-blue-500" />
                </div>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                  <input type="number" min="0" value={form.amount_max} onChange={function(e) { setField('amount_max', e.target.value); }} placeholder="Max" style={Object.assign({}, inputStyle, { paddingLeft: '28px' })} aria-label="Maximum amount" className="focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}

            {form.amount_type === 'varies' && (
              <p style={{ fontSize: '12px', color: textMuted, padding: '8px 12px', background: elevatedBg, borderRadius: '8px' }}>Amount will be shown as "Varies" on the public listing.</p>
            )}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="fund-eligibility" style={labelStyle}>
              Eligibility <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span>
            </label>
            <textarea id="fund-eligibility" value={form.eligibility} onChange={function(e) { setField('eligibility', e.target.value); }} placeholder="Who is eligible to apply? e.g. Toledo-area high school seniors, nonprofits serving Lucas County..." rows={3} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} className="focus:ring-2 focus:ring-blue-500" />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="fund-deadline" style={labelStyle}>Application Deadline</label>
            <input id="fund-deadline" type="date" value={form.deadline} onChange={function(e) { setField('deadline', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>How should people apply?</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {APPLY_METHODS.map(function(m) {
                var active = form.apply_method === m.value;
                return (
                  <button key={m.value} type="button" onClick={function() { setField('apply_method', m.value); }}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '2px solid ' + (active ? '#3B82F6' : borderColor), background: active ? '#EFF6FF' : cardBg, color: active ? '#3B82F6' : textSecondary, cursor: 'pointer' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {form.apply_method === 'link' && (
            <div style={fieldStyle}>
              <label htmlFor="fund-url" style={labelStyle}>Apply URL or Email <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
              <input id="fund-url" value={form.apply_url} onChange={function(e) { setField('apply_url', e.target.value); }} placeholder="https://yourorg.org/apply or grants@yourorg.org" style={Object.assign({}, inputStyle, errors.apply_url ? { borderColor: '#EF4444' } : {})} className="focus:ring-2 focus:ring-blue-500" />
              {errors.apply_url && <p style={errorStyle} role="alert"><AlertCircle size={11} />{errors.apply_url}</p>}
            </div>
          )}

          <div style={fieldStyle}>
            <label style={labelStyle}>Supporting Document <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span></label>
            {(postingFile || existingPostingUrl) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid ' + borderColor, borderRadius: '8px', background: '#F0FDF4' }}>
                <Paperclip size={14} color="#16A34A" aria-hidden="true" />
                <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {postingFile ? postingFile.name : 'Existing document attached'}
                </span>
                {existingPostingUrl && !postingFile && (
                  <a href={existingPostingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>View</a>
                )}
                <button type="button" onClick={removeFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '2px', display: 'flex', flexShrink: 0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Remove file">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', border: '2px dashed ' + borderColor, borderRadius: '8px', cursor: 'pointer', background: pageBg }}
                role="button" tabIndex={0}
                onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (fileInputRef.current) fileInputRef.current.click(); } }}
                aria-label="Upload supporting document"
              >
                <Upload size={20} color={textMuted} aria-hidden="true" />
                <p style={{ fontSize: '13px', color: textSecondary, margin: 0, fontWeight: 600 }}>Click to upload</p>
                <p style={{ fontSize: '11px', color: textMuted, margin: 0 }}>PDF, Word, or image — max 10 MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Tags</label>
            <TagInput tags={form.tags} onChange={function(v) { setField('tags', v); }} />
            <p style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>Press Enter or comma to add. Helps people find this listing.</p>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Visibility</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.keys(VISIBILITY_META).map(function(v) {
                var meta = VISIBILITY_META[v];
                var active = form.visibility === v;
                var IconComp = meta.icon;
                return (
                  <button key={v} type="button" onClick={function() { setField('visibility', v); }}
                    style={{ flex: 1, minWidth: '100px', padding: '10px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '2px solid ' + (active ? meta.color : borderColor), background: active ? meta.bg : cardBg, color: active ? meta.color : textMuted, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>
                    <IconComp size={14} aria-hidden="true" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '11px', color: textMuted, marginTop: '6px', lineHeight: 1.5 }}>
              {form.visibility === 'draft' && 'Only you can see this. Save your work and publish when ready.'}
              {form.visibility === 'members_only' && 'Visible to your members in their org dashboard. Not listed publicly.'}
              {form.visibility === 'public' && 'Listed on the public /funding directory. Anyone can find it.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid ' + borderColor }}>
          <button onClick={onClose} style={{ padding: '9px 20px', background: 'transparent', color: textMuted, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }} className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
            {saving ? 'Saving...' : existing ? 'Save Changes' : 'Post Funding'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Funding card ──────────────────────────────────────────────────────────────
function FundingCard({ item, appCount, onEdit, onDelete, onVisibilityChange, onViewApps }) {
  var [menuOpen, setMenuOpen] = useState(false);
  var menuRef = useRef(null);

  useEffect(function() {
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  var isExpired = item.deadline && new Date(item.deadline) < new Date();
  var typeLabel = FUNDING_TYPES.find(function(t) { return t.value === item.funding_type; });
  var typeColor = FUNDING_TYPE_COLORS[item.funding_type] || FUNDING_TYPE_COLORS.other;
  var hasFormApply = item.apply_method === 'form';

  function formatAmount() {
    if (item.amount_type === 'varies') return 'Varies';
    if (item.amount_type === 'fixed' && item.amount_min) return '$' + Number(item.amount_min).toLocaleString();
    if (item.amount_type === 'range') {
      if (item.amount_min && item.amount_max) return '$' + Number(item.amount_min).toLocaleString() + ' – $' + Number(item.amount_max).toLocaleString();
      if (item.amount_min) return 'From $' + Number(item.amount_min).toLocaleString();
      if (item.amount_max) return 'Up to $' + Number(item.amount_max).toLocaleString();
    }
    return null;
  }

  return (
    <article style={{ background: cardBg, border: '1px solid ' + (isExpired ? '#FECACA' : borderColor), borderRadius: '12px', padding: '18px 20px', marginBottom: '10px' }} aria-label={item.title + ' funding listing'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: textPrimary, margin: 0 }}>{item.title}</h3>
            <VisibilityBadge visibility={item.visibility} />
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: typeColor.bg, color: typeColor.color }}>
              {typeLabel ? typeLabel.label : item.funding_type}
            </span>
            {isExpired && <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>Expired</span>}
            {/* Application count badge — only for form-apply listings */}
            {hasFormApply && appCount > 0 && (
              <button
                onClick={function() { onViewApps(item); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', cursor: 'pointer' }}
                className="hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={'View ' + appCount + ' application' + (appCount !== 1 ? 's' : '')}
              >
                <Inbox size={10} aria-hidden="true" />
                {appCount} {appCount === 1 ? 'application' : 'applications'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            {formatAmount() && (
              <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={12} aria-hidden="true" />{formatAmount()}
              </span>
            )}
            {item.deadline && (
              <span style={{ fontSize: '12px', color: isExpired ? '#DC2626' : textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} aria-hidden="true" />
                Deadline: {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          {item.description && (
            <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.description}
            </p>
          )}

          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {item.tags.map(function(tag) {
                return <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#F1F5F9', color: textMuted, fontWeight: 600 }}>{tag}</span>;
              })}
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={function() { setMenuOpen(!menuOpen); }}
            style={{ background: elevatedBg, border: '1px solid ' + borderColor, borderRadius: '7px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Listing actions" aria-haspopup="true" aria-expanded={menuOpen}
          >
            Actions <ChevronDown size={12} aria-hidden="true" />
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: '190px', zIndex: 20, overflow: 'hidden' }} role="menu">
              <button onClick={function() { setMenuOpen(false); onEdit(item); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: textPrimary, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover:bg-slate-50 focus:outline-none" role="menuitem">
                <Pencil size={13} aria-hidden="true" /> Edit
              </button>

              {/* View Applications — only shown for in-platform form */}
              {hasFormApply && (
                <button onClick={function() { setMenuOpen(false); onViewApps(item); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#3B82F6', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover:bg-blue-50 focus:outline-none" role="menuitem">
                  <Inbox size={13} aria-hidden="true" />
                  View Applications
                  {appCount > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: '#EFF6FF', color: '#3B82F6', padding: '1px 7px', borderRadius: '99px' }}>
                      {appCount}
                    </span>
                  )}
                </button>
              )}

              <div style={{ height: '1px', background: borderColor, margin: '4px 0' }} role="separator" />

              {item.visibility === 'draft' && (
                <button onClick={function() { setMenuOpen(false); onVisibilityChange(item, 'members_only'); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#D97706', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover:bg-amber-50 focus:outline-none" role="menuitem">
                  <Users size={13} aria-hidden="true" /> Share with Members
                </button>
              )}
              {item.visibility !== 'public' && (
                <button onClick={function() { setMenuOpen(false); onVisibilityChange(item, 'public'); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#16A34A', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover:bg-green-50 focus:outline-none" role="menuitem">
                  <Globe size={13} aria-hidden="true" /> Publish Publicly
                </button>
              )}
              {item.visibility === 'public' && (
                <button onClick={function() { setMenuOpen(false); onVisibilityChange(item, 'members_only'); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#D97706', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover:bg-amber-50 focus:outline-none" role="menuitem">
                  <Lock size={13} aria-hidden="true" /> Unpublish
                </button>
              )}
              {item.visibility !== 'draft' && (
                <button onClick={function() { setMenuOpen(false); onVisibilityChange(item, 'draft'); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: textMuted, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover:bg-slate-50 focus:outline-none" role="menuitem">
                  <Lock size={13} aria-hidden="true" /> Move to Draft
                </button>
              )}
              <div style={{ height: '1px', background: borderColor, margin: '4px 0' }} role="separator" />
              <button onClick={function() { setMenuOpen(false); onDelete(item); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#EF4444', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }} className="hover:bg-red-50 focus:outline-none" role="menuitem">
                <Trash2 size={13} aria-hidden="true" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Confirm delete ────────────────────────────────────────────────────────────
function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }} role="dialog" aria-modal="true" aria-labelledby="confirm-del-title">
      <div style={{ background: cardBg, borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
          <Trash2 size={22} color="#EF4444" />
        </div>
        <h3 id="confirm-del-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, textAlign: 'center', marginBottom: '8px' }}>Delete Listing?</h3>
        <p style={{ fontSize: '13px', color: textSecondary, textAlign: 'center', lineHeight: 1.6, marginBottom: '24px' }}>
          <strong style={{ color: textPrimary }}>{item.title}</strong> will be permanently removed.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: textMuted, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Applications drawer ───────────────────────────────────────────────────────
function ApplicationsDrawer({ item, onClose }) {
  var [apps, setApps] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    async function load() {
      var r = await supabase.from('funding_applications').select('*').eq('funding_id', item.id).order('created_at', { ascending: false });
      setApps(r.data || []);
      setLoading(false);
    }
    load();
  }, [item.id]);

  async function updateStatus(appId, status) {
    var r = await supabase.from('funding_applications').update({ status: status }).eq('id', appId);
    if (r.error) { toast.error('Failed to update status.'); return; }
    setApps(function(prev) { return prev.map(function(a) { return a.id === appId ? Object.assign({}, a, { status: status }) : a; }); });
    mascotSuccessToast('Status updated.');
  }

  var STATUS_COLORS = { new: '#3B82F6', reviewed: '#D97706', contacted: '#8B5CF6', closed: '#64748B' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }} role="dialog" aria-modal="true" aria-labelledby="fund-apps-title" onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '460px', background: cardBg, height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 0, background: cardBg, zIndex: 1 }}>
          <div>
            <h2 id="fund-apps-title" style={{ fontSize: '15px', fontWeight: 800, color: textPrimary, margin: 0 }}>Applications</h2>
            <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{item.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {loading && [1,2,3].map(function(i) { return <div key={i} style={{ height: '80px', background: elevatedBg, borderRadius: '10px', marginBottom: '10px' }} />; })}
          {!loading && apps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Inbox size={32} color={textTertiary} style={{ margin: '0 auto 12px', display: 'block' }} aria-hidden="true" />
              <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>No applications yet</p>
              <p style={{ fontSize: '13px', color: textMuted }}>Applications submitted through the platform will appear here.</p>
            </div>
          )}
          {!loading && apps.map(function(app) {
            return (
              <div key={app.id} style={{ background: pageBg, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>{app.applicant_name}</p>
                    <a href={'mailto:' + app.applicant_email} style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>{app.applicant_email}</a>
                  </div>
                  <select value={app.status} onChange={function(e) { updateStatus(app.id, e.target.value); }} style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', border: '1px solid ' + borderColor, background: cardBg, color: STATUS_COLORS[app.status] || textMuted, cursor: 'pointer' }} aria-label={'Status for ' + app.applicant_name} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                {app.message && <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.5, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{app.message}</p>}
                <p style={{ fontSize: '11px', color: textTertiary, marginTop: '8px' }}>{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function OrgFunding() {
  var context = useOutletContext();
  var organizationId = context.organizationId;
  var organization   = context.organization;
  var isAdmin        = context.isAdmin;
  var isVerified     = !!(organization && organization.is_verified_nonprofit);

  var [currentUserId, setCurrentUserId] = useState(null);
  var [items, setItems]             = useState([]);
  var [appCounts, setAppCounts]     = useState({});
  var [loading, setLoading]         = useState(true);
  var [showModal, setShowModal]     = useState(false);
  var [editing, setEditing]         = useState(null);
  var [deleting, setDeleting]       = useState(null);
  var [viewingApps, setViewingApps] = useState(null);
  var [search, setSearch]           = useState('');
  var [filterVis, setFilterVis]     = useState('all');

  useEffect(function() {
    supabase.auth.getUser().then(function(r) {
      if (r.data && r.data.user) setCurrentUserId(r.data.user.id);
    });
  }, []);

  useEffect(function() { loadItems(); }, [organizationId]);

  async function loadItems() {
    setLoading(true);
    var r = await supabase.from('org_funding').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false });
    var rows = r.data || [];
    setItems(rows);

    // Load application counts for all form-apply listings
    var formIds = rows.filter(function(i) { return i.apply_method === 'form'; }).map(function(i) { return i.id; });
    if (formIds.length > 0) {
      var countResult = await supabase
        .from('funding_applications')
        .select('funding_id')
        .in('funding_id', formIds);
      var counts = {};
      (countResult.data || []).forEach(function(row) {
        counts[row.funding_id] = (counts[row.funding_id] || 0) + 1;
      });
      setAppCounts(counts);
    }

    setLoading(false);
  }

  async function handleVisibilityChange(item, newVisibility) {
    var r = await supabase.from('org_funding').update({ visibility: newVisibility, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (r.error) { mascotErrorToast('Failed to update visibility.'); return; }

    // Only notify when publishing from draft for the first time
    var wasUnpublished = item.visibility === 'draft';
    if (wasUnpublished && (newVisibility === 'members_only' || newVisibility === 'public')) {
      try {
        var { notifyOrganizationMembers } = await import('../lib/notificationService');
        await notifyOrganizationMembers(
          organizationId,
          'new_funding',
          'New Funding: ' + item.title,
          item.title + ' is now available. Check it out.',
          '/organizations/' + organizationId + '/funding'
        );
      } catch (e) { console.warn('Notification failed:', e); }
    }

    var label = VISIBILITY_META[newVisibility] ? VISIBILITY_META[newVisibility].label : newVisibility;
    mascotSuccessToast('Visibility updated to ' + label + '.');
    loadItems();
  }

  async function handleDelete() {
    if (!deleting) return;
    var r = await supabase.from('org_funding').delete().eq('id', deleting.id);
    if (r.error) { mascotErrorToast('Failed to delete.'); setDeleting(null); return; }
    mascotSuccessToast('Listing deleted.');
    setDeleting(null);
    loadItems();
  }

  var filtered = items.filter(function(item) {
    var matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    var matchVis = filterVis === 'all' || item.visibility === filterVis;
    return matchSearch && matchVis;
  });

  var counts = { all: items.length, draft: 0, members_only: 0, public: 0 };
  items.forEach(function(item) { if (counts[item.visibility] !== undefined) counts[item.visibility]++; });

  return (
    <div style={{ background: pageBg, minHeight: '100vh' }}>

      <div style={{ padding: '0 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: textPrimary, margin: '0 0 4px' }}>Funding</h1>
            <p style={{ fontSize: '14px', color: textMuted, margin: 0 }}>
              {items.length > 0 ? items.length + ' listing' + (items.length !== 1 ? 's' : '') : 'Post grants, scholarships, and funding opportunities'}
            </p>
          </div>
          {isAdmin && isVerified && (
            <button
              onClick={function() { setEditing(null); setShowModal(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}
              className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Plus size={15} aria-hidden="true" />
              Post Funding
            </button>
          )}
        </div>
      </div>

      {!isVerified && isAdmin && (
        <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '24px' }}>
          <EmptyState onAdd={function() {}} isVerified={false} />
        </div>
      )}

      {isVerified && (
        <>
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search funding listings..." style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, background: cardBg, boxSizing: 'border-box', outline: 'none' }} aria-label="Search listings" className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div style={{ display: 'flex', gap: '6px' }} role="group" aria-label="Filter by visibility">
                {['all', 'draft', 'members_only', 'public'].map(function(v) {
                  var active = filterVis === v;
                  var meta = VISIBILITY_META[v];
                  var label = v === 'all' ? 'All' : meta ? meta.label : v;
                  return (
                    <button key={v} onClick={function() { setFilterVis(v); }}
                      style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, border: '1px solid ' + (active ? '#16A34A' : borderColor), background: active ? '#F0FDF4' : cardBg, color: active ? '#16A34A' : textMuted, cursor: 'pointer' }}
                      className="focus:outline-none focus:ring-2 focus:ring-green-500" aria-pressed={active}>
                      {label} {counts[v] > 0 ? '(' + counts[v] + ')' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading && <Skeleton />}

          {!loading && items.length === 0 && (
            <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '24px' }}>
              <EmptyState onAdd={function() { setEditing(null); setShowModal(true); }} isVerified={true} />
            </div>
          )}

          {!loading && items.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px' }}>
              <Search size={28} color={textTertiary} style={{ margin: '0 auto 12px', display: 'block' }} aria-hidden="true" />
              <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>No results</p>
              <p style={{ fontSize: '13px', color: textMuted }}>Try a different search or filter.</p>
            </div>
          )}

          {!loading && filtered.map(function(item) {
            return (
              <FundingCard
                key={item.id}
                item={item}
                appCount={appCounts[item.id] || 0}
                onEdit={function(i) { setEditing(i); setShowModal(true); }}
                onDelete={function(i) { setDeleting(i); }}
                onVisibilityChange={handleVisibilityChange}
                onViewApps={function(i) { setViewingApps(i); }}
              />
            );
          })}
        </>
      )}

      {showModal && (
        <FundingModal
          organizationId={organizationId}
          currentUserId={currentUserId}
          existing={editing}
          onClose={function() { setShowModal(false); setEditing(null); }}
          onSaved={function() { loadItems(); }}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          item={deleting}
          onConfirm={handleDelete}
          onCancel={function() { setDeleting(null); }}
        />
      )}

      {viewingApps && (
        <ApplicationsDrawer
          item={viewingApps}
          onClose={function() { setViewingApps(null); }}
        />
      )}
    </div>
  );
}

export default OrgFunding;