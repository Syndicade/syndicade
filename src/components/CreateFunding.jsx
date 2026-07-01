// src/components/CreateFunding.jsx
// Syndicade — Funding retrofit, Step 2
// Adapter around shared Modal.jsx (owns TabBar internally). Replaces the hand-built
// FundingModal/ModalTab pair from the monolithic OrgFunding.jsx.
// CODE RULE (§21): var only — never const/let.

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import { getContentModalTags } from '../lib/platformTags';
import Modal from './design-system/Modal';
import {
  DollarSign, X, Users, Globe, Lock,
  AlertCircle, Paperclip, Upload, Tag, Sparkles,
} from 'lucide-react';

var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var elevatedBg    = '#F1F5F9';
var pageBg        = '#F8FAFC';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

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

var VISIBILITY_OPTIONS = [
  { value: 'draft',        label: 'Draft',           desc: 'Only org admins can see this.', icon: Lock,  color: '#64748B', bg: '#F1F5F9' },
  { value: 'members_only', label: 'All Members',     desc: 'All active org members.',        icon: Users, color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'groups',       label: 'Specific Groups', desc: 'Only members of selected groups.', icon: Users, color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'public',       label: 'Public',          desc: 'Anyone can see this.',            icon: Globe, color: '#16A34A', bg: 'rgba(34,197,94,0.08)' },
];

var REACH_OPTIONS = [
  { value: 'local',    label: 'Local',             desc: 'City or region only' },
  { value: 'state',    label: 'Statewide',         desc: 'Available across the state' },
  { value: 'national', label: 'National / Remote', desc: 'Open to anyone, anywhere' },
];

var TABS = [
  { id: 'details',    label: 'Details' },
  { id: 'settings',   label: 'Settings' },
  { id: 'tags',       label: 'Audience & Tags' },
  { id: 'publishing', label: 'Publishing' },
];

var ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

var EMPTY_FORM = {
  title: '',
  funding_type: 'scholarship',
  funding_type_other: '',
  description: '',
  who_is_it_for: '',
  amount_type: 'fixed',
  amount_min: '',
  amount_max: '',
  eligibility: '',
  apply_method: 'form',
  apply_url: '',
  tags: [],
  visibility: 'draft',
  deadline: '',
  group_ids: [],
  show_on_website: false,
  show_on_discover: false,
  is_featured: false,
  reach: 'local',
};

function fuzzyScore(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) { return 1; }
  if (b.includes(a) || a.includes(b)) { return 0.85; }
  var matches = 0;
  var shorter = a.length < b.length ? a : b;
  var longer  = a.length < b.length ? b : a;
  for (var i = 0; i < shorter.length; i++) { if (longer.includes(shorter[i])) { matches++; } }
  return matches / longer.length;
}

// Derives the UI-only 'groups' visibility state from a saved row. 'groups' is never
// persisted to the DB — only members_only + group_ids. See handleSave / Decision carried
// over from Opportunities retrofit.
function deriveFormVisibility(existing) {
  if (existing.visibility === 'members_only' && existing.group_ids && existing.group_ids.length > 0) {
    return 'groups';
  }
  return existing.visibility || 'draft';
}

function buildInitialForm(existing) {
  if (!existing) { return EMPTY_FORM; }
  return {
    title:              existing.title || '',
    funding_type:       existing.funding_type || 'scholarship',
    funding_type_other: existing.funding_type_other || '',
    description:        existing.description || '',
    who_is_it_for:      existing.who_is_it_for || '',
    amount_type:        existing.amount_type || 'fixed',
    amount_min:         existing.amount_min || '',
    amount_max:         existing.amount_max || '',
    eligibility:        existing.eligibility || '',
    apply_method:       existing.apply_method || 'form',
    apply_url:          existing.apply_url || '',
    tags:               existing.tags || [],
    visibility:         deriveFormVisibility(existing),
    deadline:           existing.deadline || '',
    group_ids:          existing.group_ids || [],
    show_on_website:    existing.show_on_website || false,
    show_on_discover:   existing.show_on_discover || false,
    is_featured:        existing.is_featured || false,
    reach:              existing.reach || 'local',
  };
}

function PlatformTagPicker(props) {
  var tags = props.tags;
  var onChange = props.onChange;
  var groups = props.groups;

  var customInputState = useState('');
  var customInput = customInputState[0];
  var setCustomInput = customInputState[1];

  var suggestionState = useState(null);
  var softBlockSuggestion = suggestionState[0];
  var setSoftBlockSuggestion = suggestionState[1];

  var allPlatformLabels = [];
  (groups || []).forEach(function (g) { (g.tags || []).forEach(function (t) { allPlatformLabels.push(t); }); });

  function toggleTag(label) {
    onChange(tags.includes(label) ? tags.filter(function (t) { return t !== label; }) : tags.concat([label]));
  }

  function handleCustomInput(val) {
    setCustomInput(val);
    if (!val.trim()) { setSoftBlockSuggestion(null); return; }
    var best = null; var bestScore = 0;
    allPlatformLabels.forEach(function (label) {
      var score = fuzzyScore(val.trim(), label);
      if (score > bestScore && score >= 0.8 && !tags.includes(label)) { bestScore = score; best = label; }
    });
    setSoftBlockSuggestion(best);
  }

  function addCustomTag(val) {
    var trimmed = (val || customInput).trim();
    if (!trimmed || tags.includes(trimmed)) { setCustomInput(''); setSoftBlockSuggestion(null); return; }
    onChange(tags.concat([trimmed])); setCustomInput(''); setSoftBlockSuggestion(null);
  }

  return (
    <div>
      {(groups || []).map(function (group, gi) {
        if (!group.tags || group.tags.length === 0) { return null; }
        return (
          <div key={group.label} style={{ marginBottom: gi < groups.length - 1 ? '16px' : '0' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>{group.label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {group.tags.map(function (label) {
                var selected = tags.includes(label);
                return (
                  <button key={label} type="button" onClick={function () { toggleTag(label); }}
                    style={{ padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, border: '1px solid ' + (selected ? '#3B82F6' : borderColor), background: selected ? '#EFF6FF' : cardBg, color: selected ? '#3B82F6' : textSecondary, cursor: 'pointer' }}
                    className="hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-pressed={selected}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid ' + borderColor }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Custom Tag</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          <label htmlFor="fund-custom-tag" className="sr-only">Add a custom tag</label>
          <input id="fund-custom-tag" value={customInput} onChange={function (e) { handleCustomInput(e.target.value); }}
            onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustomTag(); } }}
            onBlur={function () { if (customInput.trim() && !softBlockSuggestion) { addCustomTag(); } }}
            placeholder="Type a tag and press Enter..."
            style={{ flex: 1, padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '6px', fontSize: '13px', color: textPrimary, outline: 'none', background: cardBg }}
            className="focus:ring-2 focus:ring-blue-400" />
          <button type="button" onClick={function () { addCustomTag(); }}
            style={{ padding: '7px 14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500">Add</button>
        </div>
        {softBlockSuggestion && (
          <div style={{ marginTop: '8px', padding: '8px 10px', background: '#FFFBEB', border: '1px solid rgba(245,183,49,0.4)', borderRadius: '6px', fontSize: '12px', color: '#92400E' }}>
            Did you mean <strong>"{softBlockSuggestion}"</strong>? Using platform tags improves discoverability.
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <button type="button" onClick={function () { toggleTag(softBlockSuggestion); setCustomInput(''); setSoftBlockSuggestion(null); }}
                style={{ padding: '3px 10px', background: '#F5B731', color: '#0E1523', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-yellow-400">Use "{softBlockSuggestion}"</button>
              <button type="button" onClick={function () { addCustomTag(customInput); }}
                style={{ padding: '3px 10px', background: 'transparent', color: textMuted, border: '1px solid ' + borderColor, borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-slate-400">Keep my tag</button>
            </div>
          </div>
        )}
        {tags.filter(function (t) { return !allPlatformLabels.includes(t); }).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {tags.filter(function (t) { return !allPlatformLabels.includes(t); }).map(function (tag) {
              return (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: '#F1F5F9', color: textSecondary, border: '1px solid ' + borderColor }}>
                  {tag}
                  {/* FIX: focus-ring bug — was focus:outline-none with no replacement ring */}
                  <button type="button" onClick={function () { onChange(tags.filter(function (t2) { return t2 !== tag; })); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '0', lineHeight: 1, display: 'flex' }}
                    aria-label={'Remove tag ' + tag}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"><X size={10} /></button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton rows for the Specific Groups checklist while orgGroups is fetching.
// FIX: previously "No active groups found" could flash before data arrived.
function GroupsSkeleton() {
  var rows = [1, 2, 3];
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {rows.map(function (n) {
        return (
          <div key={n} className="animate-pulse" style={{ height: '52px', borderRadius: '8px', background: elevatedBg }} />
        );
      })}
    </div>
  );
}

// props:
//   organizationId, currentUserId: string
//   existing: funding row | null (null = create mode)
//   templateBanner: string | null — name of template this was started from
//   onClose: fn
//   onSaved: fn — refetch trigger

function CreateFunding(props) {
  var organizationId = props.organizationId;
  var currentUserId = props.currentUserId;
  var existing = props.existing;
  var templateBanner = props.templateBanner;
  var onClose = props.onClose;
  var onSaved = props.onSaved;

  var tabState = useState('details');
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];

  var formState = useState(function () { return buildInitialForm(existing); });
  var form = formState[0];
  var setForm = formState[1];

  var savingState = useState(false);
  var saving = savingState[0];
  var setSaving = savingState[1];

  var errorsState = useState({});
  var errors = errorsState[0];
  var setErrors = errorsState[1];

  var tagGroupsState = useState({ causeAreas: [], audience: [], fundingTypes: [], languages: [] });
  var tagGroups = tagGroupsState[0];
  var setTagGroups = tagGroupsState[1];

  var defaultTagsState = useState([]);
  var defaultTags = defaultTagsState[0];
  var setDefaultTags = defaultTagsState[1];

  var orgGroupsState = useState([]);
  var orgGroups = orgGroupsState[0];
  var setOrgGroups = orgGroupsState[1];

  var groupsLoadingState = useState(true);
  var groupsLoading = groupsLoadingState[0];
  var setGroupsLoading = groupsLoadingState[1];

  var fileState = useState(null);
  var postingFile = fileState[0];
  var setPostingFile = fileState[1];

  var existingUrlState = useState(existing ? existing.posting_url || null : null);
  var existingPostingUrl = existingUrlState[0];
  var setExistingPostingUrl = existingUrlState[1];

  var fileInputRef = useRef(null);

  useEffect(function () {
    getContentModalTags('funding').then(function (g) { setTagGroups(g); });
  }, []);

  useEffect(function () {
    supabase.from('organizations').select('tag_defaults').eq('id', organizationId).single()
      .then(function (r) {
        if (r.data && r.data.tag_defaults && r.data.tag_defaults.funding) {
          setDefaultTags(r.data.tag_defaults.funding);
        }
      });
  }, [organizationId]);

  useEffect(function () {
    setGroupsLoading(true);
    supabase.from('org_groups').select('id, name, description, type')
      .eq('organization_id', organizationId).eq('is_active', true).order('name')
      .then(function (r) {
        setOrgGroups(r.data || []);
        setGroupsLoading(false);
      });
  }, [organizationId]);

  function setField(key, val) {
    setForm(function (prev) { var n = Object.assign({}, prev); n[key] = val; return n; });
    if (errors[key]) { setErrors(function (prev) { var n = Object.assign({}, prev); delete n[key]; return n; }); }
  }

  function selectVisibility(value) {
    // 'groups' is a UI-only value — never persisted. See handleSave.
    setField('visibility', value);
    if (value !== 'groups') { setField('group_ids', []); }
  }

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (!file) { return; }
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error('Please upload a PDF, Word document, or image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB.'); return; }
    setPostingFile(file);
  }

  function removeFile() {
    setPostingFile(null); setExistingPostingUrl(null);
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  }

  function applyDefaultTags() {
    if (!defaultTags.length) { return; }
    var merged = form.tags.slice();
    defaultTags.forEach(function (t) { if (!merged.includes(t)) { merged.push(t); } });
    setField('tags', merged);
    mascotSuccessToast('Default tags applied!');
  }

  function validate() {
    var errs = {};
    if (!form.title.trim()) { errs.title = 'Title is required.'; }
    if (!form.description.trim()) { errs.description = 'Description is required.'; }
    if (form.apply_method === 'link' && !form.apply_url.trim()) { errs.apply_url = 'Provide an apply URL or email address.'; }
    if (form.amount_type === 'fixed' && !form.amount_min) { errs.amount_min = 'Enter an amount.'; }
    if (form.visibility === 'groups' && form.group_ids.length === 0) { errs.group_ids = 'Select at least one group.'; }
    return errs;
  }

  // FIX (Publish button semantics — Option B, confirmed with user): the "Publish" button
  // must always actually publish. If the Publishing tab was never touched (still 'draft'),
  // bump to 'members_only' rather than silently re-saving as Draft under a "Publish" label.
  // Mirrors the existing Unpublish rule elsewhere (steps down to members_only, never to
  // draft). Explicit selections (members_only / groups / public) are always respected as-is.
  // 'draft' is only ever persisted via the explicit "Save as Draft" button.
  function handlePublishClick() {
    var vis = form.visibility === 'draft' ? 'members_only' : form.visibility;
    handleSave(vis);
  }

  async function handleSave(targetVisibility) {
    var errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.title || errs.description) { setActiveTab('details'); }
      else if (errs.apply_url || errs.amount_min) { setActiveTab('settings'); }
      else if (errs.group_ids) { setActiveTab('publishing'); }
      return;
    }
    setSaving(true);
    var toastId = toast.loading(existing ? 'Saving...' : 'Posting...');

    // FIX (visibility/group_ids save-path bug): 'groups' is UI-only. Persist as
    // members_only + group_ids array — never write the literal 'groups' value to the DB.
    var chosenVis = targetVisibility || form.visibility;
    var persistVis = chosenVis === 'groups' ? 'members_only' : chosenVis;
    var persistGroupIds = chosenVis === 'groups' ? form.group_ids : [];

    var postingUrl = existingPostingUrl || null;
    if (postingFile) {
      var fileExt = postingFile.name.split('.').pop();
      var filePath = organizationId + '/' + Date.now() + '.' + fileExt;
      var uploadResult = await supabase.storage.from('funding-docs').upload(filePath, postingFile, { upsert: true });
      if (uploadResult.error) {
        toast.dismiss(toastId); setSaving(false);
        mascotErrorToast('File upload failed.', uploadResult.error.message); return;
      }
      postingUrl = supabase.storage.from('funding-docs').getPublicUrl(filePath).data.publicUrl;
    }

    var payload = {
      organization_id:    organizationId,
      title:              form.title.trim(),
      funding_type:       form.funding_type,
      funding_type_other: form.funding_type_other.trim() || null,
      description:        form.description.trim(),
      who_is_it_for:      form.who_is_it_for.trim() || null,
      amount_type:        form.amount_type,
      amount_min:         form.amount_min ? parseFloat(form.amount_min) : null,
      amount_max:         form.amount_max ? parseFloat(form.amount_max) : null,
      eligibility:        form.eligibility.trim() || null,
      apply_method:       form.apply_method,
      apply_url:          form.apply_url.trim() || null,
      tags:               form.tags,
      visibility:         persistVis,
      deadline:           form.deadline || null,
      posting_url:        postingUrl,
      group_ids:          persistGroupIds,
      show_on_website:    form.show_on_website,
      show_on_discover:   form.show_on_discover,
      is_featured:        form.is_featured,
      reach:              form.reach,
      updated_at:         new Date().toISOString(),
    };
    if (!existing || !existing.id) { payload.created_by = currentUserId; }

    var result = (existing && existing.id)
      ? await supabase.from('org_funding').update(payload).eq('id', existing.id)
      : await supabase.from('org_funding').insert(payload);

    toast.dismiss(toastId); setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save listing.', result.error.message); return; }
    mascotSuccessToast(existing ? 'Listing updated!' : 'Funding posted!');
    onSaved(); onClose();
  }

  var inputStyle  = { width: '100%', padding: '9px 12px', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, background: cardBg, boxSizing: 'border-box', outline: 'none' };
  var labelStyle  = { fontSize: '13px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: '5px' };
  var fieldStyle  = { marginBottom: '16px' };
  var errorStyle  = { fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' };
  var helperStyle = { fontSize: '11px', color: textMuted, marginTop: '4px' };

  var isEditingDraft = !existing || existing.visibility === 'draft';
  var modalMode = isEditingDraft ? 'create-draft' : 'edit-live';

  return (
    <Modal
      title={existing ? 'Edit Funding Listing' : 'Post Funding Opportunity'}
      orgSubtitle={form.title || undefined}
      onClose={onClose}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      mode={modalMode}
      onSaveAsDraft={function () { handleSave('draft'); }}
      onCancel={onClose}
      onPublish={handlePublishClick}
      onSaveChanges={function () { handleSave(); }}
    >
      {templateBanner && (
        <div style={{ margin: '0 0 16px', padding: '10px 14px', background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.3)', borderRadius: '8px', fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
          Started from template: {templateBanner} — feel free to edit anything.
        </div>
      )}

      {activeTab === 'details' && (
        <div>
          <div style={fieldStyle}>
            <label htmlFor="fund-title" style={labelStyle}>Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
            <input id="fund-title" value={form.title} onChange={function (e) { setField('title', e.target.value); }}
              placeholder="e.g. Community Impact Scholarship"
              style={Object.assign({}, inputStyle, errors.title ? { borderColor: '#EF4444' } : {})}
              aria-required="true" aria-describedby={errors.title ? 'err-fund-title' : undefined}
              className="focus:ring-2 focus:ring-blue-500" />
            {errors.title && <p id="err-fund-title" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.title}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="fund-desc" style={labelStyle}>Description <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
            <textarea id="fund-desc" value={form.description} onChange={function (e) { setField('description', e.target.value); }}
              placeholder="Describe what this funding is for, who it supports, and why your organization offers it..."
              rows={5} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 }, errors.description ? { borderColor: '#EF4444' } : {})}
              aria-required="true" aria-describedby={errors.description ? 'err-fund-desc' : 'fund-desc-count'}
              className="focus:ring-2 focus:ring-blue-500" />
            <p id="fund-desc-count" style={helperStyle} aria-live="polite">{form.description.length} / 1000</p>
            {errors.description && <p id="err-fund-desc" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.description}</p>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="fund-type" style={labelStyle}>Funding Type</label>
            <select id="fund-type" value={form.funding_type} onChange={function (e) { setField('funding_type', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
              {FUNDING_TYPES.map(function (t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
            </select>
          </div>

          {form.funding_type === 'other' && (
            <div style={fieldStyle}>
              <label htmlFor="fund-type-other" style={labelStyle}>Describe the funding type</label>
              <input id="fund-type-other" value={form.funding_type_other} onChange={function (e) { setField('funding_type_other', e.target.value); }}
                placeholder="e.g. Microgrant, Seed funding..." style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div style={fieldStyle}>
            <label htmlFor="fund-deadline" style={labelStyle}>Application Deadline</label>
            <input id="fund-deadline" type="date" value={form.deadline} onChange={function (e) { setField('deadline', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="fund-who" style={labelStyle}>Who is it for?</label>
            <textarea id="fund-who" value={form.who_is_it_for} onChange={function (e) { setField('who_is_it_for', e.target.value); }}
              placeholder="e.g. Toledo-area high school seniors with demonstrated financial need..."
              rows={3} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })}
              className="focus:ring-2 focus:ring-blue-500" />
            <p style={helperStyle}>Optional free-text description of the ideal applicant.</p>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Amount</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {AMOUNT_TYPES.map(function (t) {
                var active = form.amount_type === t.value;
                return (
                  <button key={t.value} type="button" onClick={function () { setField('amount_type', t.value); }}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '2px solid ' + (active ? '#3B82F6' : borderColor), background: active ? '#EFF6FF' : cardBg, color: active ? '#3B82F6' : textMuted, cursor: 'pointer' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>{t.label}</button>
                );
              })}
            </div>
            {form.amount_type === 'fixed' && (
              <div style={{ position: 'relative' }}>
                <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                <label htmlFor="fund-amount-fixed" className="sr-only">Fixed amount</label>
                <input id="fund-amount-fixed" type="number" min="0" value={form.amount_min} onChange={function (e) { setField('amount_min', e.target.value); }}
                  placeholder="Amount"
                  style={Object.assign({}, inputStyle, { paddingLeft: '28px' }, errors.amount_min ? { borderColor: '#EF4444' } : {})}
                  aria-describedby={errors.amount_min ? 'err-fund-amount' : undefined}
                  className="focus:ring-2 focus:ring-blue-500" />
                {errors.amount_min && <p id="err-fund-amount" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.amount_min}</p>}
              </div>
            )}
            {form.amount_type === 'range' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                  <label htmlFor="fund-amount-min" className="sr-only">Minimum amount</label>
                  <input id="fund-amount-min" type="number" min="0" value={form.amount_min} onChange={function (e) { setField('amount_min', e.target.value); }} placeholder="Min" style={Object.assign({}, inputStyle, { paddingLeft: '28px' })} className="focus:ring-2 focus:ring-blue-500" />
                </div>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                  <label htmlFor="fund-amount-max" className="sr-only">Maximum amount</label>
                  <input id="fund-amount-max" type="number" min="0" value={form.amount_max} onChange={function (e) { setField('amount_max', e.target.value); }} placeholder="Max" style={Object.assign({}, inputStyle, { paddingLeft: '28px' })} className="focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}
            {form.amount_type === 'varies' && (
              <p style={{ fontSize: '12px', color: textMuted, padding: '8px 12px', background: elevatedBg, borderRadius: '8px' }}>Amount will be shown as "Varies" on the public listing.</p>
            )}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="fund-eligibility" style={labelStyle}>Eligibility <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span></label>
            <textarea id="fund-eligibility" value={form.eligibility} onChange={function (e) { setField('eligibility', e.target.value); }}
              placeholder="Who is eligible to apply? e.g. Toledo-area high school seniors, nonprofits serving Lucas County..."
              rows={3} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })}
              className="focus:ring-2 focus:ring-blue-500" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>How should people apply?</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {APPLY_METHODS.map(function (m) {
                var active = form.apply_method === m.value;
                return (
                  <button key={m.value} type="button" onClick={function () { setField('apply_method', m.value); }}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '2px solid ' + (active ? '#3B82F6' : borderColor), background: active ? '#EFF6FF' : cardBg, color: active ? '#3B82F6' : textSecondary, cursor: 'pointer' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>{m.label}</button>
                );
              })}
            </div>
          </div>

          {form.apply_method === 'link' && (
            <div style={fieldStyle}>
              <label htmlFor="fund-url" style={labelStyle}>Apply URL or Email <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
              <input id="fund-url" value={form.apply_url} onChange={function (e) { setField('apply_url', e.target.value); }}
                placeholder="https://yourorg.org/apply or grants@yourorg.org"
                style={Object.assign({}, inputStyle, errors.apply_url ? { borderColor: '#EF4444' } : {})}
                aria-describedby={errors.apply_url ? 'err-fund-url' : undefined} className="focus:ring-2 focus:ring-blue-500" />
              {errors.apply_url && <p id="err-fund-url" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.apply_url}</p>}
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
                  <a href={existingPostingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }} aria-label="View current document">View</a>
                )}
                <button type="button" onClick={removeFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '2px', display: 'flex', flexShrink: 0 }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Remove file"><X size={14} /></button>
              </div>
            ) : (
              <div onClick={function () { if (fileInputRef.current) { fileInputRef.current.click(); } }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', border: '2px dashed ' + borderColor, borderRadius: '8px', cursor: 'pointer', background: pageBg }}
                role="button" tabIndex={0}
                onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (fileInputRef.current) { fileInputRef.current.click(); } } }}
                aria-label="Upload supporting document">
                <Upload size={20} color={textMuted} aria-hidden="true" />
                <p style={{ fontSize: '13px', color: textSecondary, margin: 0, fontWeight: 600 }}>Click to upload</p>
                <p style={{ fontSize: '11px', color: textMuted, margin: 0 }}>PDF, Word, or image — max 10 MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" />
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div>
          {defaultTags.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '12px 14px', background: '#FFFBEB', border: '1px solid rgba(245,183,49,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', margin: '0 0 2px' }}>Your organization has default tags for funding</p>
                <p style={{ fontSize: '11px', color: '#B45309', margin: 0 }}>
                  {defaultTags.slice(0, 3).join(', ')}{defaultTags.length > 3 ? ' +' + (defaultTags.length - 3) + ' more' : ''}
                </p>
              </div>
              <button type="button" onClick={applyDefaultTags}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: '#F5B731', color: '#0E1523', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                className="hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <Sparkles size={12} aria-hidden="true" />Use default tags
              </button>
            </div>
          )}

          {form.tags.length > 0 && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid ' + borderColor }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Selected Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {form.tags.map(function (tag) {
                  return (
                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE' }}>
                      {tag}
                      {/* FIX: focus-ring bug */}
                      <button type="button" onClick={function () { setField('tags', form.tags.filter(function (t) { return t !== tag; })); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', padding: '0', lineHeight: 1, display: 'flex' }}
                        aria-label={'Remove ' + tag}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"><X size={10} /></button>
                    </span>
                  );
                })}
                <button type="button" onClick={function () { setField('tags', []); }}
                  style={{ fontSize: '11px', color: textMuted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded">Clear all</button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={13} color={textMuted} aria-hidden="true" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>Tags &amp; Keywords</span>
          </div>
          <PlatformTagPicker
            tags={form.tags}
            onChange={function (v) { setField('tags', v); }}
            groups={[
              { label: 'Cause Area',      tags: tagGroups.causeAreas   },
              { label: 'Audience Served', tags: tagGroups.audience     },
              { label: 'Funding Type',    tags: tagGroups.fundingTypes },
              { label: 'Language',        tags: tagGroups.languages    },
            ]}
          />
          <p style={{ fontSize: '11px', color: textMuted, marginTop: '10px' }}>Platform tags improve discoverability on the public directory. Custom tags appear in search.</p>
        </div>
      )}

      {activeTab === 'publishing' && (
        <div>
          <p id="fund-visibility-label" style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '12px' }}>Who can see this?</p>
          {/* FIX: real role="radiogroup"/role="radio" semantics, matching Reach section below */}
          <div role="radiogroup" aria-labelledby="fund-visibility-label" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {VISIBILITY_OPTIONS.map(function (opt) {
              var active = form.visibility === opt.value;
              var IconComp = opt.icon;
              return (
                <label key={opt.value}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '2px solid ' + (active ? opt.color : borderColor), background: active ? opt.bg : cardBg, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input type="radio" role="radio" name="fund-visibility" value={opt.value} checked={active}
                    onChange={function () { selectVisibility(opt.value); }}
                    aria-checked={active}
                    className="w-4 h-4 mt-1 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 flex-shrink-0" />
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: active ? opt.color : elevatedBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
                    <IconComp size={15} color={active ? '#fff' : textMuted} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: active ? opt.color : textPrimary, margin: '0 0 2px' }}>{opt.label}</p>
                    <p style={{ fontSize: '12px', color: textSecondary, margin: 0 }}>{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {form.visibility === 'groups' && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', marginBottom: '12px' }}>
                Select groups <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
              </p>
              {errors.group_ids && (
                <p style={Object.assign({}, errorStyle, { marginBottom: '10px' })} role="alert">
                  <AlertCircle size={11} aria-hidden="true" />{errors.group_ids}
                </p>
              )}
              {groupsLoading ? (
                <GroupsSkeleton />
              ) : orgGroups.length === 0 ? (
                <p style={{ fontSize: '13px', color: textMuted }}>No active groups found. Create groups in the Groups section first.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="group" aria-label="Select groups">
                  {orgGroups.map(function (group) {
                    var checked = form.group_ids.includes(group.id);
                    return (
                      <label key={group.id}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', border: '1px solid ' + (checked ? 'rgba(139,92,246,0.4)' : borderColor), borderRadius: '8px', background: checked ? 'rgba(139,92,246,0.06)' : cardBg, cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked}
                          onChange={function () {
                            var next = checked
                              ? form.group_ids.filter(function (id) { return id !== group.id; })
                              : form.group_ids.concat([group.id]);
                            setField('group_ids', next);
                          }}
                          style={{ marginTop: '2px', flexShrink: 0 }}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                          aria-label={group.name} />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>{group.name}</p>
                          {group.description && <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{group.description}</p>}
                          {!group.description && group.type && <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0', textTransform: 'capitalize' }}>{group.type}</p>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '10px' }}>Also show on</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'show_on_website',  label: 'Org website',          desc: 'Appears on your public organization page' },
                { key: 'show_on_discover', label: 'Discover page',        desc: 'Public listing at /funding · Org must be verified' },
                { key: 'is_featured',      label: 'Feature this listing', desc: 'Highlighted border and Featured badge on the directory' },
              ].map(function (row) {
                var on = form[row.key];
                return (
                  <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid ' + borderColor, borderRadius: '8px', background: cardBg }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0 }}>{row.label}</p>
                      <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{row.desc}</p>
                    </div>
                    <button type="button" role="switch" aria-checked={on} aria-label={row.label}
                      onClick={function () { setField(row.key, !on); }}
                      style={{ width: '44px', height: '24px', borderRadius: '99px', background: on ? '#3B82F6' : '#CBD5E1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      <span style={{ position: 'absolute', top: '2px', left: on ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p id="fund-reach-label" style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '10px' }}>Reach</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="radiogroup" aria-labelledby="fund-reach-label">
              {REACH_OPTIONS.map(function (opt) {
                var active = form.reach === opt.value;
                return (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '1px solid ' + (active ? '#3B82F6' : borderColor), borderRadius: '8px', background: active ? '#EFF6FF' : cardBg, cursor: 'pointer' }}>
                    <input type="radio" name="fund-reach" value={opt.value} checked={active}
                      onChange={function () { setField('reach', opt.value); }}
                      className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 flex-shrink-0" />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#3B82F6' : textPrimary, margin: 0 }}>{opt.label}</p>
                      <p style={{ fontSize: '12px', color: textMuted, margin: 0 }}>{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: elevatedBg, borderRadius: '8px', fontSize: '12px', color: textMuted, lineHeight: 1.6 }}>
            Members are notified once when you first publish. Changing visibility between published states does not re-notify.
          </div>
        </div>
      )}
    </Modal>
  );
}

export default CreateFunding;