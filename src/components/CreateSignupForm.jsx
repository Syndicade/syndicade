import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import Modal from './design-system/Modal';
import ConfirmModal from './ConfirmModal';

var BDR        = '#E2E8F0';
var BG         = '#F8FAFC';
var TEXT_PRI   = '#0E1523';
var TEXT_SEC   = '#475569';
var TEXT_MUTED = '#64748B';
var BLUE       = '#3B82F6';

var TABS = [
  { id: 'details', label: 'Details' },
  { id: 'settings', label: 'Settings' },
  { id: 'publishing', label: 'Publishing' }
];

/**
 * CreateSignupForm — handles BOTH create and edit.
 * Pass `editingItem` (the full form row, with its `items` array attached) to edit.
 * onSaved(savedForm, { firstPublish }) — firstPublish is true only when this save
 * transitions the form from draft to a published visibility for the first time.
 */
function CreateSignupForm({ organizationId, currentUserId, onClose, onSaved, templateData, editingItem }) {
  var emptyItem = { id: null, item_name: '', description: '', max_slots: 1, order_number: 1, _isNew: true, _deleted: false };

  var isEditing = !!(editingItem && editingItem.id);
  var wasLive = isEditing && editingItem.visibility && editingItem.visibility !== 'draft';

  var [activeTab, setActiveTab] = useState('details');
  var [title, setTitle] = useState('');
  var [description, setDescription] = useState('');
  var [closesAt, setClosesAt] = useState('');
  var [allowMultiple, setAllowMultiple] = useState(false);
  var [showResponses, setShowResponses] = useState(true);
  var [visibilityChoice, setVisibilityChoice] = useState('members_only');
  var [groupIds, setGroupIds] = useState([]);
  var [orgGroups, setOrgGroups] = useState([]);
  var [groupsLoaded, setGroupsLoaded] = useState(false);
  var [items, setItems] = useState([Object.assign({}, emptyItem)]);
  var [errors, setErrors] = useState({});
  var [saving, setSaving] = useState(false);
  var [templateName, setTemplateName] = useState(null);
  var [removeConfirm, setRemoveConfirm] = useState({ open: false, index: null });

  var dragIndex = useRef(null);

  // ── Prefill from editingItem or templateData ────────────────────────────────
  useEffect(function() {
    if (isEditing) {
      setTitle(editingItem.title || '');
      setDescription(editingItem.description || '');
      setClosesAt(editingItem.closes_at ? new Date(editingItem.closes_at).toISOString().slice(0, 16) : '');
      setAllowMultiple(!!editingItem.allow_multiple_signups);
      setShowResponses(editingItem.show_responses !== false);
      setVisibilityChoice(editingItem.visibility || 'members_only');
      setGroupIds(editingItem.group_ids || []);
      var existingItems = (editingItem.items || []).map(function(item, i) {
        return { id: item.id, item_name: item.item_name, description: item.description || '', max_slots: item.max_slots, order_number: item.order_number || i + 1, _isNew: false, _deleted: false };
      });
      setItems(existingItems.length > 0 ? existingItems : [Object.assign({}, emptyItem)]);
      return;
    }

    if (templateData) {
      setTitle(templateData.title || '');
      setDescription(templateData.description || '');
      setAllowMultiple(!!templateData.allow_multiple_signups);
      setShowResponses(templateData.show_responses !== false);
      var tmplItems = templateData._items && templateData._items.length > 0
        ? templateData._items.map(function(item, i) {
            return { id: null, item_name: item.item_name || '', description: item.description || '', max_slots: item.max_slots || 1, order_number: i + 1, _isNew: true, _deleted: false };
          })
        : [Object.assign({}, emptyItem)];
      setItems(tmplItems);
      setTemplateName(templateData._templateName || null);
    }
  }, [editingItem, templateData]);

  // ── Org groups (only fetched if "Specific Groups" selected) ────────────────
  useEffect(function() {
    if (visibilityChoice !== 'group' || groupsLoaded) return;
    supabase
      .from('org_groups')
      .select('id,name')
      .eq('organization_id', organizationId)
      .then(function(res) {
        if (!res.error) setOrgGroups(res.data || []);
        setGroupsLoaded(true);
      });
  }, [visibilityChoice, groupsLoaded, organizationId]);

  // ── Item helpers ─────────────────────────────────────────────────────────────
  var addItem = function() {
    var maxOrder = items.reduce(function(acc, item) { return Math.max(acc, item.order_number || 0); }, 0);
    setItems(items.concat([{ id: null, item_name: '', description: '', max_slots: 1, order_number: maxOrder + 1, _isNew: true, _deleted: false }]));
  };

  var updateItem = function(index, field, value) {
    setItems(items.map(function(item, i) {
      if (i !== index) return item;
      return Object.assign({}, item, { [field]: value });
    }));
  };

  var askRemoveItem = function(index) {
    setRemoveConfirm({ open: true, index: index });
  };

  var confirmRemoveItem = function() {
    var index = removeConfirm.index;
    setItems(items.map(function(item, i) {
      if (i !== index) return item;
      return Object.assign({}, item, { _deleted: true });
    }));
    setRemoveConfirm({ open: false, index: null });
  };

  var handleDragStart = function(e, index) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  var handleDragOver = function(e, index) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    var next = items.slice();
    var dragged = next.splice(dragIndex.current, 1)[0];
    next.splice(index, 0, dragged);
    dragIndex.current = index;
    setItems(next.map(function(item, i) { return Object.assign({}, item, { order_number: i + 1 }); }));
  };

  var handleDragEnd = function() { dragIndex.current = null; };

  var toggleGroup = function(groupId) {
    setGroupIds(groupIds.indexOf(groupId) === -1 ? groupIds.concat([groupId]) : groupIds.filter(function(id) { return id !== groupId; }));
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  var visibleItems = items.filter(function(item) { return !item._deleted; });

  var validate = function() {
    var errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (visibleItems.length === 0) errs.items = 'Add at least one sign-up item.';
    visibleItems.forEach(function(item, i) {
      if (!item.item_name.trim()) errs['item_name_' + i] = 'Item name is required.';
      var slots = parseInt(item.max_slots);
      if (!slots || slots < 1) errs['item_slots_' + i] = 'Must be at least 1.';
    });
    return errs;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  var handleSubmit = async function(action) {
    if (saving) return;
    var errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the errors before saving.');
      setActiveTab('details');
      return;
    }
    setErrors({});

    var finalVisibility = visibilityChoice;
    if (action === 'draft') finalVisibility = 'draft';
    if (action === 'publish' && finalVisibility === 'draft') finalVisibility = 'members_only';

    var firstPublish = action === 'publish';

    try {
      setSaving(true);

      var payload = {
        organization_id: organizationId,
        title: title.trim(),
        description: description.trim() || null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        allow_multiple_signups: allowMultiple,
        show_responses: showResponses,
        visibility: finalVisibility,
        group_ids: finalVisibility === 'group' ? groupIds : [],
        updated_at: new Date().toISOString()
      };

      if (!isEditing) {
        payload.created_by = currentUserId;
        payload.status = 'active';
      }

      var result = isEditing
        ? await supabase.from('signup_forms').update(payload).eq('id', editingItem.id).select().single()
        : await supabase.from('signup_forms').insert(payload).select().single();

      if (result.error) throw result.error;
      var savedForm = result.data;

      var toDelete = items.filter(function(item) { return item._deleted && !item._isNew && item.id; });
      var toInsert = items.filter(function(item) { return item._isNew && !item._deleted; });
      var toUpdate = items.filter(function(item) { return !item._isNew && !item._deleted && item.id; });

      if (toDelete.length > 0) {
        var deleteIds = toDelete.map(function(item) { return item.id; });
        var delRes = await supabase.from('signup_items').delete().in('id', deleteIds);
        if (delRes.error) throw delRes.error;
      }

      if (toInsert.length > 0) {
        var inserts = toInsert.map(function(item) {
          return { form_id: savedForm.id, item_name: item.item_name.trim(), description: item.description.trim() || null, max_slots: parseInt(item.max_slots), current_signups: 0, order_number: item.order_number };
        });
        var insRes = await supabase.from('signup_items').insert(inserts);
        if (insRes.error) throw insRes.error;
      }

      for (var i = 0; i < toUpdate.length; i++) {
        var u = toUpdate[i];
        var updRes = await supabase
          .from('signup_items')
          .update({ item_name: u.item_name.trim(), description: u.description.trim() || null, max_slots: parseInt(u.max_slots), order_number: u.order_number })
          .eq('id', u.id);
        if (updRes.error) throw updRes.error;
      }

      mascotSuccessToast(isEditing ? 'Form saved.' : 'Form created.', savedForm.title);
      if (onSaved) onSaved(savedForm, { firstPublish: firstPublish });
      onClose();
    } catch (err) {
      console.error('Error saving signup form:', err);
      mascotErrorToast('Failed to save sign-up form.', err.message);
    } finally {
      setSaving(false);
    }
  };

  var modalTitle = isEditing ? 'Edit Sign-Up Form' : 'Create Sign-Up Form';
  // Modal footer mode: 'create-draft' (Save as Draft / Cancel / Publish) whenever the form is
  // still a draft (whether brand new or an existing draft being edited); 'edit-live' (Cancel /
  // Save Changes only) once it's already published — unpublishing only happens via the card's
  // Actions menu, never inside this modal (§9).
  var modalMode = wasLive ? 'edit-live' : 'create-draft';

  return (
    <>
      <Modal
        title={modalTitle}
        orgSubtitle={templateName ? 'Starting from "' + templateName + '" template' : undefined}
        onClose={onClose}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mode={modalMode}
        onSaveAsDraft={function() { handleSubmit('draft'); }}
        onCancel={onClose}
        onPublish={function() { handleSubmit('publish'); }}
        onSaveChanges={function() { handleSubmit('save'); }}
      >
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="csf-title-input" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT_PRI, marginBottom: '6px' }}>
                Form Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
              </label>
              <input
                id="csf-title-input"
                type="text"
                value={title}
                onChange={function(e) { setTitle(e.target.value); }}
                placeholder="e.g. Volunteer Sign-Up, Potluck Items"
                aria-required="true"
                aria-describedby={errors.title ? 'csf-title-err' : undefined}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid ' + (errors.title ? '#EF4444' : BDR), borderRadius: '8px', fontSize: '14px', color: TEXT_PRI, boxSizing: 'border-box' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && <p id="csf-title-err" role="alert" style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="csf-desc-input" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT_PRI, marginBottom: '6px' }}>Description</label>
              <textarea
                id="csf-desc-input"
                value={description}
                onChange={function(e) { setDescription(e.target.value); }}
                placeholder="Optional — describe what this sign-up is for."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '0.5px solid ' + BDR, borderRadius: '8px', fontSize: '14px', color: TEXT_PRI, resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: TEXT_PRI, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Sign-Up Items <span style={{ fontWeight: 400, color: TEXT_MUTED, textTransform: 'none' }}>({visibleItems.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  aria-label="Add sign-up item"
                  className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add Item
                </button>
              </div>

              {errors.items && <p role="alert" style={{ fontSize: '12px', color: '#EF4444', marginBottom: '10px' }}>{errors.items}</p>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} role="list" aria-label="Sign-up items">
                {items.map(function(item, index) {
                  if (item._deleted) return null;
                  var visibleIndex = visibleItems.indexOf(item);
                  return (
                    <div
                      key={index}
                      role="listitem"
                      draggable
                      onDragStart={function(e) { handleDragStart(e, index); }}
                      onDragOver={function(e) { handleDragOver(e, index); }}
                      onDragEnd={handleDragEnd}
                      style={{ background: BG, border: '0.5px solid ' + BDR, borderRadius: '10px', padding: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                    >
                      <div style={{ paddingTop: '8px', color: TEXT_MUTED, cursor: 'grab', flexShrink: 0 }} aria-hidden="true">
                        <GripVertical size={16} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label htmlFor={'csf-item-name-' + index} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT_PRI, marginBottom: '4px' }}>
                            Item Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                          </label>
                          <input
                            id={'csf-item-name-' + index}
                            type="text"
                            value={item.item_name}
                            onChange={function(e) { updateItem(index, 'item_name', e.target.value); }}
                            placeholder="e.g. Bring dessert, 9:00 AM slot"
                            aria-required="true"
                            aria-describedby={errors['item_name_' + visibleIndex] ? 'csf-item-name-err-' + index : undefined}
                            style={{ width: '100%', padding: '7px 10px', border: '0.5px solid ' + (errors['item_name_' + visibleIndex] ? '#EF4444' : BDR), borderRadius: '6px', fontSize: '13px', color: TEXT_PRI, boxSizing: 'border-box' }}
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {errors['item_name_' + visibleIndex] && <p id={'csf-item-name-err-' + index} role="alert" style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>{errors['item_name_' + visibleIndex]}</p>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '8px' }}>
                          <div>
                            <label htmlFor={'csf-item-desc-' + index} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT_PRI, marginBottom: '4px' }}>Description</label>
                            <input
                              id={'csf-item-desc-' + index}
                              type="text"
                              value={item.description}
                              onChange={function(e) { updateItem(index, 'description', e.target.value); }}
                              placeholder="Optional"
                              style={{ width: '100%', padding: '7px 10px', border: '0.5px solid ' + BDR, borderRadius: '6px', fontSize: '13px', color: TEXT_PRI, boxSizing: 'border-box' }}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label htmlFor={'csf-item-slots-' + index} style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT_PRI, marginBottom: '4px' }}>
                              Slots <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                            </label>
                            <input
                              id={'csf-item-slots-' + index}
                              type="number"
                              min="1"
                              value={item.max_slots}
                              onChange={function(e) { updateItem(index, 'max_slots', e.target.value); }}
                              aria-required="true"
                              aria-describedby={errors['item_slots_' + visibleIndex] ? 'csf-item-slots-err-' + index : undefined}
                              style={{ width: '100%', padding: '7px 10px', border: '0.5px solid ' + (errors['item_slots_' + visibleIndex] ? '#EF4444' : BDR), borderRadius: '6px', fontSize: '13px', color: TEXT_PRI, boxSizing: 'border-box' }}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errors['item_slots_' + visibleIndex] && <p id={'csf-item-slots-err-' + index} role="alert" style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>{errors['item_slots_' + visibleIndex]}</p>}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={function() { askRemoveItem(index); }}
                        disabled={visibleItems.length <= 1}
                        style={{ marginTop: '6px', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: visibleItems.length <= 1 ? 'not-allowed' : 'pointer', color: '#EF4444', flexShrink: 0, opacity: visibleItems.length <= 1 ? 0.4 : 1 }}
                        aria-label={'Remove item: ' + (item.item_name || 'untitled')}
                        className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="csf-closes" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT_PRI, marginBottom: '6px' }}>Close Date</label>
              <input
                id="csf-closes"
                type="datetime-local"
                value={closesAt}
                onChange={function(e) { setClosesAt(e.target.value); }}
                style={{ padding: '8px 12px', border: '0.5px solid ' + BDR, borderRadius: '8px', fontSize: '14px', color: TEXT_PRI }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '4px' }}>Leave blank for no expiry. The form auto-closes to new sign-ups at this time.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input
                type="checkbox"
                id="csf-allow-multiple"
                checked={allowMultiple}
                onChange={function(e) { setAllowMultiple(e.target.checked); }}
                style={{ marginTop: '2px' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="csf-allow-multiple" style={{ fontSize: '14px', color: TEXT_SEC }}>Allow members to sign up for multiple items</label>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <input
                type="checkbox"
                id="csf-show-responses"
                checked={showResponses}
                onChange={function(e) { setShowResponses(e.target.checked); }}
                style={{ marginTop: '2px' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="csf-show-responses" style={{ fontSize: '14px', color: TEXT_SEC }}>Show who signed up to all members</label>
            </div>
          </div>
        )}

        {activeTab === 'publishing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT_PRI, marginBottom: '10px' }}>Who can see this?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="radiogroup" aria-label="Visibility">
                {!wasLive && (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', border: '0.5px solid ' + BDR, borderRadius: '8px', cursor: 'pointer', background: visibilityChoice === 'draft' ? '#EFF6FF' : 'transparent' }}>
                    <input type="radio" name="csf-visibility" value="draft" checked={visibilityChoice === 'draft'} onChange={function() { setVisibilityChoice('draft'); }} style={{ marginTop: '3px' }} />
                    <span>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: TEXT_PRI }}>Draft</span>
                      <span style={{ display: 'block', fontSize: '12px', color: TEXT_MUTED }}>Only visible to org admins</span>
                    </span>
                  </label>
                )}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', border: '0.5px solid ' + BDR, borderRadius: '8px', cursor: 'pointer', background: visibilityChoice === 'members_only' ? '#EFF6FF' : 'transparent' }}>
                  <input type="radio" name="csf-visibility" value="members_only" checked={visibilityChoice === 'members_only'} onChange={function() { setVisibilityChoice('members_only'); }} style={{ marginTop: '3px' }} />
                  <span>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: TEXT_PRI }}>All Members</span>
                    <span style={{ display: 'block', fontSize: '12px', color: TEXT_MUTED }}>Every org member can see and sign up</span>
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', border: '0.5px solid ' + BDR, borderRadius: '8px', cursor: 'pointer', background: visibilityChoice === 'group' ? '#EFF6FF' : 'transparent' }}>
                  <input type="radio" name="csf-visibility" value="group" checked={visibilityChoice === 'group'} onChange={function() { setVisibilityChoice('group'); }} style={{ marginTop: '3px' }} />
                  <span>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: TEXT_PRI }}>Specific Groups</span>
                    <span style={{ display: 'block', fontSize: '12px', color: TEXT_MUTED }}>Only members of selected groups</span>
                  </span>
                </label>
              </div>

              {visibilityChoice === 'group' && (
                <div style={{ marginTop: '12px', paddingLeft: '4px' }}>
                  {!groupsLoaded ? (
                    <p style={{ fontSize: '13px', color: TEXT_MUTED }}>Loading groups...</p>
                  ) : orgGroups.length === 0 ? (
                    <p style={{ fontSize: '13px', color: TEXT_MUTED }}>No groups exist yet for this organization.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {orgGroups.map(function(group) {
                        return (
                          <label key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: TEXT_SEC }}>
                            <input type="checkbox" checked={groupIds.indexOf(group.id) !== -1} onChange={function() { toggleGroup(group.id); }} />
                            {group.name}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize: '12px', color: TEXT_MUTED, lineHeight: 1.5 }}>
              Members are notified once when you first publish. Changing between published states does not re-notify.
            </p>
          </div>
        )}
      </Modal>

      {removeConfirm.open && (
        <ConfirmModal
          title="Remove this item?"
          message="Any existing sign-ups for this item will also be deleted. This cannot be undone."
          confirmLabel="Remove Item"
          variant="destructive"
          onConfirm={confirmRemoveItem}
          onCancel={function() { setRemoveConfirm({ open: false, index: null }); }}
        />
      )}
    </>
  );
}

export default CreateSignupForm;