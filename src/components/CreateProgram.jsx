// src/components/CreateProgram.jsx
// Syndicade — Programs retrofit onto shared Modal.jsx + TabBar.jsx (July 1, 2026)
// CODE RULE (§21): var only — never const/let. String concat for className.

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import Modal from './design-system/Modal';
import { Button } from './design-system/Button';
import { programVisibility } from './ProgramCard';

var BDR = '#E2E8F0';
var TEXT = '#0E1523';
var TEXT2 = '#475569';
var MUTED = '#64748B';
var INPUT_BG = '#F8FAFC';
var ELEVATED = '#F1F5F9';
var CARD_BG = '#FFFFFF';

var PROGRAM_TYPES = [
  'After-School Program', 'Class / Course', 'Distribution', 'Job Training',
  'Support Group', 'Training', 'Workshop', 'Youth Program', 'Other'
];

var US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

var EMPTY_FORM = {
  name: '', description: '', type: '', audience: '', schedule: '',
  start_date: '', end_date: '', start_time: '', end_time: '',
  location_city: '', location_state: '',
  capacity: '',
  how_to_apply: '', apply_method: 'form', apply_url: '',
  contact_name: '', contact_email: '',
  cost_type: 'free', cost_amount: '',
  status: 'active',
  requires_approval: false, registration_open: true,
  show_enrolled_public: true,
  tags: [],
  image_url: '',
  visibility: 'draft',
  group_ids: [],
  show_on_website: false,
  show_on_discover: false,
  is_featured: false
};

var inputStyle = {
  width: '100%', padding: '8px 12px', background: INPUT_BG,
  border: '1px solid ' + BDR, borderRadius: '8px',
  fontSize: '14px', color: TEXT, outline: 'none', boxSizing: 'border-box'
};
var labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT, marginBottom: '6px' };
var errorTextStyle = { fontSize: '12px', color: '#EF4444', margin: '4px 0 0' };

function Toggle(props) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        position: 'relative', display: 'inline-flex', height: '22px', width: '40px', flexShrink: 0,
        alignItems: 'center', borderRadius: '99px', border: 'none', cursor: 'pointer',
        background: props.checked ? '#3B82F6' : BDR, transition: 'background 0.2s'
      }}
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
    >
      <span style={{
        display: 'inline-block', height: '16px', width: '16px', borderRadius: '50%',
        background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transform: props.checked ? 'translateX(21px)' : 'translateX(3px)', transition: 'transform 0.2s'
      }} />
    </button>
  );
}

function PlatformTagPicker(props) {
  var groups = props.groups;
  var selectedTags = props.selectedTags;
  var onChange = props.onChange;
  var customState = useState('');
  var customInput = customState[0];
  var setCustomInput = customState[1];

  function toggleTag(tag) {
    var tags = selectedTags || [];
    var idx = tags.indexOf(tag);
    onChange(idx === -1 ? tags.concat([tag]) : tags.filter(function (t) { return t !== tag; }));
  }

  function addCustom() {
    var tag = customInput.trim();
    if (!tag) return;
    if ((selectedTags || []).indexOf(tag) === -1) {
      onChange((selectedTags || []).concat([tag]));
    }
    setCustomInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {groups.map(function (group) {
        return (
          <div key={group.label}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>{group.label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {group.tags.map(function (tag) {
                var selected = (selectedTags || []).indexOf(tag) !== -1;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={function () { toggleTag(tag); }}
                    style={{
                      padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 500,
                      border: selected ? '1px solid #3B82F6' : '0.5px solid ' + BDR,
                      background: selected ? '#3B82F6' : '#F1F5F9',
                      color: selected ? '#FFFFFF' : '#475569',
                      cursor: 'pointer'
                    }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-pressed={selected}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ paddingTop: '12px', borderTop: '1px solid ' + BDR }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Custom Tag</p>
        <p style={{ fontSize: '11px', color: MUTED, margin: '0 0 8px' }}>Helps people find this listing on Discover pages.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={customInput}
            onChange={function (e) { setCustomInput(e.target.value); }}
            onKeyDown={function (e) { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder="Type a tag and press Enter"
            aria-label="Add custom tag"
            style={inputStyle}
            className="focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={addCustom} style={{ padding: '8px 14px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: TEXT2, cursor: 'pointer', whiteSpace: 'nowrap' }} className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400">
            Add
          </button>
        </div>
      </div>

      {(selectedTags || []).length > 0 && (
        <div style={{ paddingTop: '12px', borderTop: '1px solid ' + BDR }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>Selected Tags</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(selectedTags || []).map(function (tag) {
              return (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '0.5px solid ' + BDR }}>
                  {tag}
                  <button type="button" onClick={function () { onChange((selectedTags || []).filter(function (t) { return t !== tag; })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 0, lineHeight: 1 }} aria-label={'Remove tag ' + tag}>×</button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// props:
//   organizationId, organization
//   editingProgram (null for new)
//   templateData (optional — prefill from a template, stays in create mode)
//   tagGroups: { causeAreas, audience, activityTypes, languages }
//   orgDefaults: { program: [tags] } | null
//   orgGroups: [{ id, name }]
//   onClose: fn
//   onSaved: fn(isNew, name, wasPublished) — called after a successful save
function CreateProgram(props) {
  var editingProgram = props.editingProgram;
  var organizationId = props.organizationId;

  function initialForm() {
    if (editingProgram) {
      return {
        name: editingProgram.name || '',
        description: editingProgram.description || '',
        type: editingProgram.type || '',
        audience: editingProgram.audience || '',
        schedule: editingProgram.schedule || '',
        start_date: editingProgram.start_date || '',
        end_date: editingProgram.end_date || '',
        start_time: editingProgram.start_time || '',
        end_time: editingProgram.end_time || '',
        location_city: editingProgram.location_city || '',
        location_state: editingProgram.location_state || '',
        capacity: editingProgram.capacity != null ? String(editingProgram.capacity) : '',
        how_to_apply: editingProgram.how_to_apply || '',
        apply_method: editingProgram.apply_method || 'form',
        apply_url: editingProgram.apply_url || '',
        contact_name: editingProgram.contact_name || '',
        contact_email: editingProgram.contact_email || '',
        cost_type: editingProgram.cost_type || 'free',
        cost_amount: editingProgram.cost_amount != null ? String(editingProgram.cost_amount) : '',
        status: editingProgram.status || 'active',
        requires_approval: editingProgram.requires_approval === true,
        registration_open: editingProgram.registration_open !== false,
        show_enrolled_public: editingProgram.show_enrolled_public !== false,
        tags: editingProgram.tags || [],
        image_url: editingProgram.image_url || '',
        visibility: programVisibility(editingProgram),
        group_ids: editingProgram.group_ids || [],
        show_on_website: editingProgram.show_on_website === true,
        show_on_discover: editingProgram.show_on_discover === true,
        is_featured: editingProgram.is_featured === true
      };
    }
    if (props.templateData) {
      return Object.assign({}, EMPTY_FORM, props.templateData);
    }
    return EMPTY_FORM;
  }

  var formState = useState(initialForm());
  var form = formState[0];
  var setForm = formState[1];

  var tabState = useState('details');
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];

  var savingState = useState(false);
  var saving = savingState[0];
  var setSaving = savingState[1];

  var uploadingState = useState(false);
  var uploadingImg = uploadingState[0];
  var setUploadingImg = uploadingState[1];

  var errorsState = useState({});
  var errors = errorsState[0];
  var setErrors = errorsState[1];

  var imageFileState = useState(null);
  var imageFile = imageFileState[0];
  var setImageFile = imageFileState[1];

  var imagePreviewState = useState(editingProgram ? (editingProgram.image_url || '') : '');
  var imagePreview = imagePreviewState[0];
  var setImagePreview = imagePreviewState[1];

  var imageInputRef = useRef(null);

  function setField(key, value) {
    setForm(function (prev) {
      var update = {};
      update[key] = value;
      if (key === 'cost_type' && value === 'free') update.cost_amount = '';
      if (key === 'visibility' && value !== 'groups') update.group_ids = [];
      return Object.assign({}, prev, update);
    });
  }

  function validateField(key) {
    if (key === 'name' && !form.name.trim()) {
      setErrors(function (prev) { return Object.assign({}, prev, { name: 'Program name is required.' }); });
      return false;
    }
    setErrors(function (prev) { var next = Object.assign({}, prev); delete next.name; return next; });
    return true;
  }

  function handleImageSelect(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }
    setImageFile(file);
    var reader = new FileReader();
    reader.onload = function (ev) { setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview('');
    setField('image_url', '');
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  async function uploadImage(programId) {
    if (!imageFile) return form.image_url || null;
    setUploadingImg(true);
    var ext = imageFile.name.split('.').pop();
    var path = 'program-images/' + programId + '.' + ext;
    var res = await supabase.storage.from('program-images').upload(path, imageFile, { upsert: true });
    setUploadingImg(false);
    if (res.error) { mascotErrorToast('Image upload failed.', res.error.message); return form.image_url || null; }
    var pub = supabase.storage.from('program-images').getPublicUrl(path);
    return pub.data.publicUrl;
  }

  function buildPayload(safeForm, imageUrl) {
    return {
      organization_id: organizationId,
      name: safeForm.name.trim(),
      description: safeForm.description || null,
      type: safeForm.type || null,
      audience: safeForm.audience || null,
      schedule: safeForm.schedule || null,
      start_date: safeForm.start_date || null,
      end_date: safeForm.end_date || null,
      start_time: safeForm.start_time || null,
      end_time: safeForm.end_time || null,
      location_city: safeForm.location_city || null,
      location_state: safeForm.location_state || null,
      capacity: safeForm.capacity !== '' ? parseInt(safeForm.capacity, 10) : null,
      how_to_apply: safeForm.how_to_apply || null,
      apply_method: safeForm.apply_method || 'form',
      apply_url: safeForm.apply_url || null,
      contact_name: safeForm.contact_name || null,
      contact_email: safeForm.contact_email || null,
      cost_type: safeForm.cost_type,
      cost_amount: safeForm.cost_type !== 'free' && safeForm.cost_amount !== '' ? parseFloat(safeForm.cost_amount) : null,
      status: safeForm.status,
      requires_approval: safeForm.requires_approval,
      registration_open: safeForm.registration_open,
      show_enrolled_public: safeForm.show_enrolled_public,
      tags: safeForm.tags || [],
      image_url: imageUrl,
      group_ids: safeForm.group_ids || [],
      show_on_website: safeForm.show_on_website,
      show_on_discover: safeForm.show_on_discover,
      is_featured: safeForm.is_featured,
      // legacy columns kept in sync until PROG-VIS-COL adds a real `visibility` column
      is_public: safeForm.visibility !== 'draft',
      publish_to_discovery: safeForm.show_on_discover,
      updated_at: new Date().toISOString()
    };
  }

  async function save(mode) {
    // mode: 'draft' | 'publish' | 'save-changes'
    if (!validateField('name')) { toast.error('Program name is required.'); return; }
    setSaving(true);

    var safeForm = Object.assign({}, form);
    if (mode === 'draft') {
      safeForm.visibility = 'draft';
    } else if (mode === 'publish' && safeForm.visibility === 'draft') {
      // PUBLISH-DRAFT-BUG fix, applied from the start here: if the Publishing tab was
      // never touched, Publish must not silently save as Draft.
      safeForm.visibility = 'members_only';
    }

    var isNew = !editingProgram;
    var programId = editingProgram ? editingProgram.id : null;
    var imageUrl = form.image_url || null;

    if (isNew && imageFile) {
      var initPayload = buildPayload(safeForm, null);
      var initRes = await supabase.from('org_programs').insert(initPayload).select('id').single();
      if (initRes.error) { setSaving(false); mascotErrorToast('Failed to save program.', 'Check your connection and try again.'); return; }
      programId = initRes.data.id;
      imageUrl = await uploadImage(programId);
      await supabase.from('org_programs').update({ image_url: imageUrl }).eq('id', programId);
      setSaving(false);
      mascotSuccessToast(mode === 'draft' ? 'Program saved as draft.' : 'Program created!');
      props.onSaved(true, safeForm.name.trim(), mode !== 'draft');
      return;
    }

    if (imageFile) {
      imageUrl = await uploadImage(editingProgram ? editingProgram.id : programId);
    }

    var payload = buildPayload(safeForm, imageUrl);
    var result = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);

    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save program.', 'Check your connection and try again.'); return; }

    mascotSuccessToast(mode === 'draft' ? 'Program saved as draft.' : editingProgram ? 'Program updated!' : 'Program created!');
    props.onSaved(isNew, safeForm.name.trim(), !editingProgram && mode !== 'draft');
  }

  function applyDefaultTags() {
    if (!props.orgDefaults || !props.orgDefaults.program) return;
    var defaults = props.orgDefaults.program || [];
    setForm(function (prev) {
      var merged = (prev.tags || []).slice();
      defaults.forEach(function (tag) { if (merged.indexOf(tag) === -1) merged.push(tag); });
      return Object.assign({}, prev, { tags: merged });
    });
    mascotSuccessToast('Default tags applied.');
  }

  var tagGroups = props.tagGroups || {};
  var pickerGroups = [
    { label: 'Cause Area', tags: tagGroups.causeAreas || [] },
    { label: 'Audience', tags: tagGroups.audience || [] },
    { label: 'Activity Type', tags: tagGroups.activityTypes || [] },
    { label: 'Languages', tags: tagGroups.languages || [] }
  ].filter(function (g) { return g.tags.length > 0; });

  var isDraft = programVisibility(form) === 'draft' || form.visibility === 'draft';
  var modalMode = (!editingProgram || isDraft) ? 'create-draft' : 'edit-live';

  var tabs = [
    { id: 'details', label: 'Details' },
    { id: 'settings', label: 'Settings' },
    { id: 'tags', label: 'Audience & Tags' },
    { id: 'publishing', label: 'Publishing' }
  ];

  return (
    <Modal
      title={editingProgram ? 'Edit Program' : 'Add Program'}
      orgSubtitle={props.organization ? props.organization.name : undefined}
      onClose={props.onClose}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      mode={modalMode}
      onSaveAsDraft={function () { save('draft'); }}
      onCancel={props.onClose}
      onPublish={function () { save('publish'); }}
      onSaveChanges={function () { save('save-changes'); }}
      saving={saving || uploadingImg}
    >
      {props.templateData && !editingProgram && (
        <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'rgba(59,130,246,0.08)', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '12px', color: '#1E40AF' }}>
          Started from template: {props.templateData._templateName || 'Template'} — feel free to edit anything.
        </div>
      )}

      {/* Details tab */}
      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="prog-name" style={labelStyle}>Program Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
            <input
              id="prog-name" type="text" value={form.name}
              onChange={function (e) { setField('name', e.target.value); }}
              onBlur={function () { validateField('name'); }}
              placeholder="e.g. After School Tutoring"
              style={Object.assign({}, inputStyle, errors.name ? { borderColor: '#EF4444' } : {})}
              className="focus:ring-2 focus:ring-blue-500"
              aria-required="true"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'prog-name-error' : undefined}
            />
            {errors.name && <p id="prog-name-error" role="alert" style={errorTextStyle}>{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="prog-desc" style={labelStyle}>Description</label>
            <textarea
              id="prog-desc" value={form.description} rows={4}
              onChange={function (e) { setField('description', e.target.value); }}
              placeholder="What does this program do?"
              maxLength={1000}
              style={Object.assign({}, inputStyle, { resize: 'vertical', minHeight: '80px' })}
              className="focus:ring-2 focus:ring-blue-500"
            />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{(form.description || '').length}/1000</p>
          </div>

          <div>
            <label htmlFor="prog-type" style={labelStyle}>Program Type</label>
            <select id="prog-type" value={form.type} onChange={function (e) { setField('type', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
              <option value="">Select a type...</option>
              {PROGRAM_TYPES.map(function (t) { return <option key={t} value={t}>{t}</option>; })}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="prog-start" style={labelStyle}>Start Date</label>
              <input id="prog-start" type="date" value={form.start_date} onChange={function (e) { setField('start_date', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="prog-stime" style={labelStyle}>Start Time</label>
              <input id="prog-stime" type="time" value={form.start_time} onChange={function (e) { setField('start_time', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="prog-end" style={labelStyle}>End Date</label>
              <input id="prog-end" type="date" value={form.end_date} onChange={function (e) { setField('end_date', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="prog-etime" style={labelStyle}>End Time</label>
              <input id="prog-etime" type="time" value={form.end_time} onChange={function (e) { setField('end_time', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="prog-city" style={labelStyle}>City</label>
              <input id="prog-city" type="text" value={form.location_city} onChange={function (e) { setField('location_city', e.target.value); }} placeholder="e.g. Toledo" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="prog-state" style={labelStyle}>State</label>
              <select id="prog-state" value={form.location_state} onChange={function (e) { setField('location_state', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
                <option value="">Select...</option>
                {US_STATES.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Cost</label>
            <div style={{ display: 'grid', gridTemplateColumns: form.cost_type !== 'free' ? '1fr 1fr' : '1fr', gap: '12px' }}>
              <select value={form.cost_type} onChange={function (e) { setField('cost_type', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" aria-label="Cost type">
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="donation">Donation / Suggested</option>
              </select>
              {form.cost_type !== 'free' && (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: '14px' }}>$</span>
                  <input type="number" min="0" step="0.01" value={form.cost_amount} onChange={function (e) { setField('cost_amount', e.target.value); }} placeholder={form.cost_type === 'donation' ? 'Suggested amount' : 'Amount'} style={Object.assign({}, inputStyle, { paddingLeft: '24px' })} className="focus:ring-2 focus:ring-blue-500" aria-label="Cost amount" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="prog-capacity" style={labelStyle}>Capacity (Max Spots)</label>
            <input id="prog-capacity" type="number" min="0" value={form.capacity} onChange={function (e) { setField('capacity', e.target.value); }} placeholder="Leave blank for unlimited" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="prog-audience" style={labelStyle}>Who Is It For?</label>
            <input id="prog-audience" type="text" value={form.audience} onChange={function (e) { setField('audience', e.target.value); }} placeholder="e.g. Youth ages 6–18" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0' }}>Free-text description. Use the Audience &amp; Tags tab to add structured audience tags.</p>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'registration_open', label: 'Registration open', desc: 'Members can register or request to join' },
              { key: 'requires_approval', label: 'Require approval', desc: form.requires_approval ? 'Registrations are held for your review before enrolling' : 'Members are enrolled automatically on registration' },
              { key: 'show_enrolled_public', label: 'Show enrolled count publicly', desc: form.show_enrolled_public ? 'Members can see how many people are enrolled' : 'Enrollment count is hidden from non-admins' }
            ].map(function (item) {
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                  <Toggle checked={form[item.key]} onClick={function () { setField(item.key, !form[item.key]); }} label={'Toggle ' + item.label} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="prog-schedule" style={labelStyle}>Schedule / Frequency</label>
            <input id="prog-schedule" type="text" value={form.schedule} onChange={function (e) { setField('schedule', e.target.value); }} placeholder="e.g. Every Monday 3–5pm" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label htmlFor="prog-apply-method" style={labelStyle}>Apply Method</label>
              <select id="prog-apply-method" value={form.apply_method} onChange={function (e) { setField('apply_method', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
                <option value="form">In-platform registration form</option>
                <option value="link">External link</option>
              </select>
            </div>
            {form.apply_method === 'link' && (
              <div>
                <label htmlFor="prog-apply-url" style={labelStyle}>Apply URL</label>
                <input id="prog-apply-url" type="url" value={form.apply_url} onChange={function (e) { setField('apply_url', e.target.value); }} placeholder="https://..." style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label htmlFor="prog-apply-notes" style={labelStyle}>Additional Instructions</label>
              <textarea id="prog-apply-notes" value={form.how_to_apply} rows={2} onChange={function (e) { setField('how_to_apply', e.target.value); }} placeholder="e.g. Fill out form at front desk or call us" style={Object.assign({}, inputStyle, { resize: 'none' })} className="focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="prog-cname" style={labelStyle}>Contact Name</label>
              <input id="prog-cname" type="text" value={form.contact_name} onChange={function (e) { setField('contact_name', e.target.value); }} placeholder="Jane Smith" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="prog-cemail" style={labelStyle}>Contact Email</label>
              <input id="prog-cemail" type="email" value={form.contact_email} onChange={function (e) { setField('contact_email', e.target.value); }} placeholder="jane@org.org" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label htmlFor="prog-status" style={labelStyle}>Program Status</label>
            <select id="prog-status" value={form.status} onChange={function (e) { setField('status', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* File upload — always last field on Settings tab, per §9 */}
          <div>
            <label style={labelStyle}>Program Image</label>
            {imagePreview ? (
              <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                <img src={imagePreview} alt="Program preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={clearImage} style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', color: '#FFFFFF', display: 'flex' }} className="hover:bg-black focus:outline-none focus:ring-2 focus:ring-white" aria-label="Remove image">×</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={function () { imageInputRef.current && imageInputRef.current.click(); }}
                style={{ width: '100%', padding: '24px', border: '1.5px dashed ' + BDR, borderRadius: '8px', background: INPUT_BG, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: MUTED }}
                className="hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Upload program image"
              >
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Click to upload image</span>
                <span style={{ fontSize: '11px' }}>JPG, PNG, WebP or GIF · max 5 MB</span>
              </button>
            )}
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleImageSelect} aria-label="Program image file input" />
          </div>
        </div>
      )}

      {/* Audience & Tags tab */}
      {activeTab === 'tags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {props.orgDefaults && props.orgDefaults.program && props.orgDefaults.program.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '8px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>Your org has default program tags</p>
                <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>{props.orgDefaults.program.slice(0, 3).join(', ')}{props.orgDefaults.program.length > 3 ? ' +' + (props.orgDefaults.program.length - 3) + ' more' : ''}</p>
              </div>
              <button type="button" onClick={applyDefaultTags} style={{ padding: '6px 12px', background: '#F5B731', color: '#0E1523', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }} className="hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                Use default tags
              </button>
            </div>
          )}
          <PlatformTagPicker groups={pickerGroups} selectedTags={form.tags} onChange={function (tags) { setField('tags', tags); }} />
        </div>
      )}

      {/* Publishing tab — no Reach section here: Reach is Opportunities/Funding only (§9) */}
      {activeTab === 'publishing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="radiogroup" aria-label="Visibility">
            {[
              { value: 'draft', label: 'Draft', desc: 'Only visible to org admins' },
              { value: 'members_only', label: 'All Members', desc: 'All active org members' },
              { value: 'groups', label: 'Specific Groups', desc: 'Only members of selected groups' },
              { value: 'public', label: 'Public', desc: 'Anyone can see this' }
            ].map(function (opt) {
              var selected = form.visibility === opt.value;
              return (
                <div key={opt.value}>
                  <button
                    type="button" role="radio" aria-checked={selected}
                    onClick={function () { setField('visibility', opt.value); }}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: selected ? '#EFF6FF' : CARD_BG, border: selected ? '1.5px solid #3B82F6' : '1px solid ' + BDR, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                    className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: selected ? '5px solid #3B82F6' : '2px solid ' + BDR, flexShrink: 0, background: CARD_BG }} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>{opt.label}</p>
                      <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>{opt.desc}</p>
                    </div>
                  </button>

                  {opt.value === 'groups' && selected && (
                    <div style={{ marginTop: '8px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                      <label style={Object.assign({}, labelStyle, { marginBottom: '6px' })}>Select groups</label>
                      {props.orgGroups.length === 0 ? (
                        <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>No groups found. Create groups first in your org settings.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {props.orgGroups.map(function (g) {
                            var checked = (form.group_ids || []).indexOf(g.id) !== -1;
                            return (
                              <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: TEXT }}>
                                <input
                                  type="checkbox" checked={checked}
                                  onChange={function () {
                                    var ids = form.group_ids || [];
                                    setField('group_ids', checked ? ids.filter(function (id) { return id !== g.id; }) : ids.concat([g.id]));
                                  }}
                                  className="focus:ring-2 focus:ring-blue-500"
                                />
                                {g.name}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'show_on_website', label: 'Org website', desc: 'Appears on your public organization page' },
              { key: 'show_on_discover', label: 'Discover page', desc: 'Public listing at /discover' },
              { key: 'is_featured', label: 'Feature this listing', desc: 'Highlighted border and Featured badge' }
            ].map(function (item) {
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                  <Toggle checked={form[item.key]} onClick={function () { setField(item.key, !form[item.key]); }} label={'Toggle ' + item.label} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '12px', color: MUTED, margin: 0, padding: '10px 12px', background: ELEVATED, borderRadius: '6px', border: '1px solid ' + BDR }}>
            Members are notified once when you first publish. Changing between published states does not re-notify.
          </p>
        </div>
      )}
    </Modal>
  );
}

export default CreateProgram;