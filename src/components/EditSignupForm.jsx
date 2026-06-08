import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react';

var MODAL_BG   = '#FFFFFF';
var BDR        = '#E2E8F0';
var BG         = '#F8FAFC';
var TEXT_PRI   = '#0E1523';
var TEXT_SEC   = '#475569';
var TEXT_MUTED = '#64748B';

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(function() {
    if (!isOpen) return;
    function handleKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: '16px' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="esf-confirm-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{ background: MODAL_BG, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '3px 4px 24px rgba(0,0,0,0.16)' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="esf-confirm-title" style={{ fontSize: '16px', fontWeight: 800, color: TEXT_PRI, margin: '0 0 4px' }}>{title}</h2>
            <p style={{ fontSize: '13px', color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            autoFocus
            style={{ flex: 1, padding: '10px', border: '1px solid ' + BDR, borderRadius: '8px', background: 'transparent', color: TEXT_SEC, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#EF4444', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditSignupForm ────────────────────────────────────────────────────────────
function EditSignupForm({ form, items: initialItems, onClose, onSaved }) {
  var [title, setTitle]           = useState(form.title || '');
  var [description, setDescription] = useState(form.description || '');
  var [closesAt, setClosesAt]     = useState(
    form.closes_at ? new Date(form.closes_at).toISOString().slice(0, 16) : ''
  );
  var [items, setItems]           = useState(
    (initialItems || []).map(function(item) {
      return { id: item.id, item_name: item.item_name, description: item.description || '', max_slots: item.max_slots, order_number: item.order_number, _isNew: false, _deleted: false };
    })
  );
  var [saving, setSaving]         = useState(false);
  var [errors, setErrors]         = useState({});
  var [confirmModal, setConfirmModal] = useState({ open: false, itemIndex: null });

  var dragIndex = useRef(null);
  var firstInputRef = useRef(null);

  // Focus trap on mount
  useEffect(function() {
    if (firstInputRef.current) firstInputRef.current.focus();
  }, []);

  // Escape to close
  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  // ── Item helpers ────────────────────────────────────────────────────────────

  var addItem = function() {
    var maxOrder = items.reduce(function(acc, item) { return Math.max(acc, item.order_number || 0); }, 0);
    setItems(function(prev) {
      return prev.concat([{ id: null, item_name: '', description: '', max_slots: 1, order_number: maxOrder + 1, _isNew: true, _deleted: false }]);
    });
  };

  var updateItem = function(index, field, value) {
    setItems(function(prev) {
      return prev.map(function(item, i) {
        if (i !== index) return item;
        return Object.assign({}, item, { [field]: value });
      });
    });
  };

  var markDeleted = function(index) {
    setConfirmModal({ open: true, itemIndex: index });
  };

  var confirmDelete = function() {
    var index = confirmModal.itemIndex;
    setItems(function(prev) {
      return prev.map(function(item, i) {
        if (i !== index) return item;
        // New unsaved items can be spliced out entirely
        if (item._isNew) return Object.assign({}, item, { _deleted: true });
        return Object.assign({}, item, { _deleted: true });
      });
    });
    setConfirmModal({ open: false, itemIndex: null });
  };

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────

  var handleDragStart = function(e, index) {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  var handleDragOver = function(e, index) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    setItems(function(prev) {
      var next = prev.slice();
      var dragged = next.splice(dragIndex.current, 1)[0];
      next.splice(index, 0, dragged);
      dragIndex.current = index;
      return next.map(function(item, i) { return Object.assign({}, item, { order_number: i + 1 }); });
    });
  };

  var handleDragEnd = function() { dragIndex.current = null; };

  // ── Validation ──────────────────────────────────────────────────────────────

  var validate = function() {
    var errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    var visibleItems = items.filter(function(item) { return !item._deleted; });
    visibleItems.forEach(function(item, i) {
      if (!item.item_name.trim()) errs['item_name_' + i] = 'Item name is required.';
      var slots = parseInt(item.max_slots);
      if (!slots || slots < 1) errs['item_slots_' + i] = 'Must be at least 1.';
    });
    return errs;
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  var handleSave = async function() {
    var errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the errors before saving.');
      return;
    }
    setErrors({});

    try {
      setSaving(true);

      // 1. Update the form record
      var formUpdate = {
        title: title.trim(),
        description: description.trim() || null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        updated_at: new Date().toISOString()
      };
      var { error: formErr } = await supabase
        .from('signup_forms')
        .update(formUpdate)
        .eq('id', form.id);
      if (formErr) throw formErr;

      // 2. Handle items
      var toDelete  = items.filter(function(item) { return item._deleted && !item._isNew && item.id; });
      var toInsert  = items.filter(function(item) { return item._isNew && !item._deleted; });
      var toUpdate  = items.filter(function(item) { return !item._isNew && !item._deleted && item.id; });

      // Deletes
      if (toDelete.length > 0) {
        var deleteIds = toDelete.map(function(item) { return item.id; });
        var { error: delErr } = await supabase.from('signup_items').delete().in('id', deleteIds);
        if (delErr) throw delErr;
      }

      // Inserts
      if (toInsert.length > 0) {
        var inserts = toInsert.map(function(item) {
          return { form_id: form.id, item_name: item.item_name.trim(), description: item.description.trim() || null, max_slots: parseInt(item.max_slots), current_signups: 0, order_number: item.order_number };
        });
        var { error: insErr } = await supabase.from('signup_items').insert(inserts);
        if (insErr) throw insErr;
      }

      // Updates (sequential to avoid conflicts)
      for (var i = 0; i < toUpdate.length; i++) {
        var item = toUpdate[i];
        var { error: updErr } = await supabase
          .from('signup_items')
          .update({ item_name: item.item_name.trim(), description: item.description.trim() || null, max_slots: parseInt(item.max_slots), order_number: item.order_number })
          .eq('id', item.id);
        if (updErr) throw updErr;
      }

      mascotSuccessToast('Form saved.', title.trim());
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('EditSignupForm save error:', err);
      mascotErrorToast('Failed to save form.', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  var visibleItems = items.filter(function(item) { return !item._deleted; });

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="esf-modal-title"
        onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{ background: MODAL_BG, borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '3px 4px 24px rgba(0,0,0,0.16)' }}
          onClick={function(e) { e.stopPropagation(); }}
        >
          {/* Modal header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + BDR, flexShrink: 0 }}>
            <h2 id="esf-modal-title" style={{ fontSize: '20px', fontWeight: 800, color: TEXT_PRI, margin: 0 }}>Edit Sign-Up Form</h2>
            <button
              onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid ' + BDR, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TEXT_MUTED }}
              aria-label="Close edit form modal"
              className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

            {/* Title */}
            <div>
              <label htmlFor="esf-title" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: TEXT_PRI, marginBottom: '6px' }}>
                Form Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
              </label>
              <input
                id="esf-title"
                ref={firstInputRef}
                type="text"
                value={title}
                onChange={function(e) { setTitle(e.target.value); }}
                placeholder="e.g. Potluck Sign-Up"
                aria-required="true"
                aria-describedby={errors.title ? 'esf-title-err' : undefined}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid ' + (errors.title ? '#EF4444' : '#CBD5E1'), borderRadius: '8px', fontSize: '15px', color: TEXT_PRI, background: '#FFFFFF', boxSizing: 'border-box' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p id="esf-title-err" role="alert" style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="esf-desc" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: TEXT_PRI, marginBottom: '6px' }}>Description</label>
              <textarea
                id="esf-desc"
                value={description}
                onChange={function(e) { setDescription(e.target.value); }}
                placeholder="Optional — describe what this form is for."
                rows={3}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', color: TEXT_PRI, background: '#FFFFFF', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Close date */}
            <div>
              <label htmlFor="esf-closes" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: TEXT_PRI, marginBottom: '6px' }}>Close Date</label>
              <input
                id="esf-closes"
                type="datetime-local"
                value={closesAt}
                onChange={function(e) { setClosesAt(e.target.value); }}
                style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', color: TEXT_PRI, background: '#FFFFFF' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '4px' }}>Leave blank for no expiry.</p>
            </div>

            {/* Items */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRI, margin: 0 }}>
                  Sign-Up Items
                  <span style={{ fontSize: '13px', fontWeight: 400, color: TEXT_MUTED, marginLeft: '8px' }}>({visibleItems.length})</span>
                </h3>
                <button
                  onClick={addItem}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  aria-label="Add new sign-up item"
                  className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add Item
                </button>
              </div>

              {visibleItems.length === 0 ? (
                <div style={{ background: BG, border: '1px dashed ' + BDR, borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: TEXT_MUTED }}>No items yet. Add at least one sign-up slot.</p>
                </div>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                  role="list"
                  aria-label="Sign-up items"
                >
                  {items.map(function(item, index) {
                    if (item._deleted) return null;

                    // Map visible index for error keys
                    var visibleIndex = visibleItems.indexOf(item);

                    return (
                      <div
                        key={index}
                        role="listitem"
                        draggable
                        onDragStart={function(e) { handleDragStart(e, index); }}
                        onDragOver={function(e) { handleDragOver(e, index); }}
                        onDragEnd={handleDragEnd}
                        style={{ background: BG, border: '1px solid ' + BDR, borderRadius: '10px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                        aria-label={'Sign-up item ' + (visibleIndex + 1)}
                      >
                        {/* Drag handle */}
                        <div
                          style={{ paddingTop: '10px', color: TEXT_MUTED, cursor: 'grab', flexShrink: 0 }}
                          aria-hidden="true"
                        >
                          <GripVertical size={16} />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Item name */}
                          <div>
                            <label
                              htmlFor={'esf-item-name-' + index}
                              style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: TEXT_PRI, marginBottom: '4px' }}
                            >
                              Item Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                            </label>
                            <input
                              id={'esf-item-name-' + index}
                              type="text"
                              value={item.item_name}
                              onChange={function(e) { updateItem(index, 'item_name', e.target.value); }}
                              placeholder="e.g. Salad, 3–4pm shift"
                              aria-required="true"
                              aria-describedby={errors['item_name_' + visibleIndex] ? 'esf-item-name-err-' + index : undefined}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid ' + (errors['item_name_' + visibleIndex] ? '#EF4444' : '#CBD5E1'), borderRadius: '6px', fontSize: '14px', color: TEXT_PRI, background: '#FFFFFF', boxSizing: 'border-box' }}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errors['item_name_' + visibleIndex] && (
                              <p id={'esf-item-name-err-' + index} role="alert" style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>
                                {errors['item_name_' + visibleIndex]}
                              </p>
                            )}
                          </div>

                          {/* Description + slots row */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
                            <div>
                              <label
                                htmlFor={'esf-item-desc-' + index}
                                style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: TEXT_PRI, marginBottom: '4px' }}
                              >
                                Description
                              </label>
                              <input
                                id={'esf-item-desc-' + index}
                                type="text"
                                value={item.description}
                                onChange={function(e) { updateItem(index, 'description', e.target.value); }}
                                placeholder="Optional details"
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', color: TEXT_PRI, background: '#FFFFFF', boxSizing: 'border-box' }}
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={'esf-item-slots-' + index}
                                style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: TEXT_PRI, marginBottom: '4px' }}
                              >
                                Slots <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                              </label>
                              <input
                                id={'esf-item-slots-' + index}
                                type="number"
                                min="1"
                                value={item.max_slots}
                                onChange={function(e) { updateItem(index, 'max_slots', e.target.value); }}
                                aria-required="true"
                                aria-describedby={errors['item_slots_' + visibleIndex] ? 'esf-item-slots-err-' + index : undefined}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid ' + (errors['item_slots_' + visibleIndex] ? '#EF4444' : '#CBD5E1'), borderRadius: '6px', fontSize: '14px', color: TEXT_PRI, background: '#FFFFFF', boxSizing: 'border-box' }}
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {errors['item_slots_' + visibleIndex] && (
                                <p id={'esf-item-slots-err-' + index} role="alert" style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>
                                  {errors['item_slots_' + visibleIndex]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete item */}
                        <button
                          onClick={function() { markDeleted(index); }}
                          style={{ marginTop: '8px', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444', flexShrink: 0 }}
                          aria-label={'Remove item: ' + (item.item_name || 'untitled')}
                          className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid ' + BDR, flexShrink: 0 }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{ flex: 1, padding: '11px', border: '1px solid ' + BDR, borderRadius: '8px', background: 'transparent', color: TEXT_SEC, fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', background: saving ? '#93C5FD' : '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
              aria-busy={saving}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        title="Remove this item?"
        message="Any existing sign-ups for this item will also be deleted. This cannot be undone."
        confirmLabel="Remove Item"
        onConfirm={confirmDelete}
        onCancel={function() { setConfirmModal({ open: false, itemIndex: null }); }}
      />
    </>
  );
}

export default EditSignupForm;