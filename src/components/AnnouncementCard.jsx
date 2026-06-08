import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import { Trash2, Pin, Pencil, AlertTriangle, X } from 'lucide-react';

var CARD_BG     = '#EFF6FF';
var CARD_BDR    = '#BFDBFE';
var TITLE_COLOR = '#1E3A5F';
var BODY_COLOR  = '#374151';
var META_COLOR  = '#6B7280';
var META_VAL    = '#4B5563';
var DIVIDER     = '#BFDBFE';
var CARD_SHADOW = '0 1px 4px rgba(0,0,0,0.08)';

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ac-confirm-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '3px 4px 14px rgba(0,0,0,0.12)' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="ac-confirm-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0E1523', margin: '0 0 4px' }}>{title}</h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            autoFocus
            style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'transparent', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
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

// ── EditAnnouncementModal ─────────────────────────────────────────────────────
function EditAnnouncementModal({ announcement, onClose, onSaved }) {
  var [title, setTitle]       = useState(announcement.title || '');
  var [content, setContent]   = useState(announcement.content || '');
  var [priority, setPriority] = useState(announcement.priority || 'normal');
  var [isPinned, setIsPinned] = useState(announcement.is_pinned || false);
  var [expiresAt, setExpiresAt] = useState(
    announcement.expires_at
      ? new Date(announcement.expires_at).toISOString().slice(0, 16)
      : ''
  );
  var [saving, setSaving]     = useState(false);
  var [errors, setErrors]     = useState({});

  var validate = function() {
    var errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!content.trim()) errs.content = 'Content is required.';
    return errs;
  };

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
      var { error } = await supabase
        .from('announcements')
        .update({
          title: title.trim(),
          content: content.trim(),
          priority: priority,
          is_pinned: isPinned,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', announcement.id);
      if (error) throw error;
      mascotSuccessToast('Announcement updated.');
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Edit announcement error:', err);
      mascotErrorToast('Failed to save announcement.', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-ann-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '3px 4px 24px rgba(0,0,0,0.16)' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
          <h2 id="edit-ann-title" style={{ fontSize: '20px', fontWeight: 800, color: '#0E1523', margin: 0 }}>Edit Announcement</h2>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
            aria-label="Close edit modal"
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

          {/* Title */}
          <div>
            <label htmlFor="ean-title" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0E1523', marginBottom: '6px' }}>
              Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
            </label>
            <input
              id="ean-title"
              type="text"
              value={title}
              onChange={function(e) { setTitle(e.target.value); }}
              aria-required="true"
              aria-describedby={errors.title ? 'ean-title-err' : undefined}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid ' + (errors.title ? '#EF4444' : '#CBD5E1'), borderRadius: '8px', fontSize: '15px', color: '#0E1523', background: '#FFFFFF', boxSizing: 'border-box' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && (
              <p id="ean-title-err" role="alert" style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.title}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="ean-content" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0E1523', marginBottom: '6px' }}>
              Content <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
            </label>
            <textarea
              id="ean-content"
              value={content}
              onChange={function(e) { setContent(e.target.value); }}
              rows={5}
              aria-required="true"
              aria-describedby={errors.content ? 'ean-content-err' : undefined}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid ' + (errors.content ? '#EF4444' : '#CBD5E1'), borderRadius: '8px', fontSize: '14px', color: '#0E1523', background: '#FFFFFF', resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.content && (
              <p id="ean-content-err" role="alert" style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.content}</p>
            )}
          </div>

          {/* Priority + Pinned row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="ean-priority" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0E1523', marginBottom: '6px' }}>Priority</label>
              <select
                id="ean-priority"
                value={priority}
                onChange={function(e) { setPriority(e.target.value); }}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', color: '#0E1523', background: '#FFFFFF', cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="ean-expires" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0E1523', marginBottom: '6px' }}>Expiry Date</label>
              <input
                id="ean-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={function(e) { setExpiresAt(e.target.value); }}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', color: '#0E1523', background: '#FFFFFF', boxSizing: 'border-box' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Leave blank for no expiry.</p>
            </div>
          </div>

          {/* Pinned toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: isPinned ? 'rgba(245,183,49,0.08)' : '#F8FAFC', border: '1px solid ' + (isPinned ? 'rgba(245,183,49,0.35)' : '#E2E8F0'), borderRadius: '10px' }}>
            <button
              id="ean-pinned"
              onClick={function() { setIsPinned(function(prev) { return !prev; }); }}
              role="switch"
              aria-checked={isPinned}
              style={{ width: '40px', height: '22px', borderRadius: '99px', background: isPinned ? '#F5B731' : '#CBD5E1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
              className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              aria-label="Pin this announcement"
            >
              <span style={{ position: 'absolute', top: '3px', left: isPinned ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} aria-hidden="true" />
            </button>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523', margin: 0 }}>Pin announcement</p>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Pinned announcements appear at the top of the feed.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'transparent', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
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
  );
}

// ── AnnouncementCard ──────────────────────────────────────────────────────────
function AnnouncementCard({ announcement, onRead, onDelete, onUpdate, isAdmin, showOrganization }) {
  var [isRead, setIsRead]         = useState(announcement.is_read || false);
  var [isPinned, setIsPinned]     = useState(announcement.is_pinned || false);
  var [marking, setMarking]       = useState(false);
  var [pinning, setPinning]       = useState(false);
  var [showConfirm, setShowConfirm] = useState(false);
  var [showEdit, setShowEdit]     = useState(false);

  var daysSinceCreated = differenceInDays(new Date(), new Date(announcement.created_at));
  var isNew     = !isRead && daysSinceCreated <= 7;
  var isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  var accentLeft = announcement.priority === 'urgent' ? '#EF4444'
    : announcement.priority === 'low' ? '#94A3B8'
    : '#BFDBFE';

  var handleMarkAsRead = async function() {
    if (isRead || marking) return;
    setMarking(true);
    try {
      var authRes = await supabase.auth.getUser();
      var user = authRes.data.user;
      if (!user) throw new Error('Not authenticated');
      var res = await supabase
        .from('announcement_reads')
        .insert([{ announcement_id: announcement.id, member_id: user.id }]);
      if (res.error && res.error.code !== '23505') throw res.error;
      setIsRead(true);
      if (onRead) onRead(announcement.id);
    } catch (err) {
      console.error('Error marking as read:', err);
      toast.error('Could not mark as read. Please try again.');
    } finally {
      setMarking(false);
    }
  };

  var handlePinToggle = async function() {
    if (pinning) return;
    setPinning(true);
    try {
      var newPinned = !isPinned;
      var { error } = await supabase
        .from('announcements')
        .update({ is_pinned: newPinned })
        .eq('id', announcement.id);
      if (error) throw error;
      setIsPinned(newPinned);
      mascotSuccessToast(newPinned ? 'Announcement pinned.' : 'Announcement unpinned.');
      if (onUpdate) onUpdate(announcement.id);
    } catch (err) {
      mascotErrorToast('Failed to update pin.', err.message);
    } finally {
      setPinning(false);
    }
  };

  var handleDelete = async function() {
    try {
      var { error } = await supabase.from('announcements').delete().eq('id', announcement.id);
      if (error) throw error;
      mascotSuccessToast('Announcement deleted.');
      if (onDelete) onDelete(announcement.id);
    } catch (err) {
      console.error('Error deleting:', err);
      mascotErrorToast('Failed to delete announcement.', 'Please try again.');
    } finally {
      setShowConfirm(false);
    }
  };

  var handleEditSaved = function() {
    if (onUpdate) onUpdate(announcement.id);
  };

  return (
    <>
      <article
        role="listitem"
        style={{
          background: CARD_BG,
          border: '1px solid ' + CARD_BDR,
          borderLeft: '4px solid ' + accentLeft,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          opacity: isRead ? 0.65 : 1,
          transition: 'opacity 0.2s',
          height: '100%',
          boxSizing: 'border-box',
          boxShadow: CARD_SHADOW,
        }}
        aria-label={announcement.title + ' announcement'}
      >
        {/* Badge row + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {isPinned && (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(245,183,49,0.15)', border: '1px solid rgba(245,183,49,0.4)', color: '#D97706', fontSize: '11px', fontWeight: 700, borderRadius: '99px' }}
                aria-label="Pinned"
              >
                <Pin size={10} aria-hidden="true" />
                Pinned
              </span>
            )}
            {announcement.priority === 'urgent' && (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', fontSize: '11px', fontWeight: 700, borderRadius: '99px' }}
                aria-label="Priority: Urgent"
              >
                <AlertTriangle size={10} aria-hidden="true" />
                Urgent
              </span>
            )}
            {announcement.priority === 'low' && (
              <span
                style={{ padding: '2px 8px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.25)', color: '#6B7280', fontSize: '11px', fontWeight: 700, borderRadius: '99px' }}
                aria-label="Priority: Low"
              >
                Low
              </span>
            )}
            {isNew && !isExpired && (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#16A34A', fontSize: '11px', fontWeight: 700, borderRadius: '99px' }}
                aria-label="New — unread"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} aria-hidden="true" />
                New
              </span>
            )}
            {isExpired && (
              <span
                style={{ padding: '2px 8px', background: '#F3F4F6', border: '1px solid rgba(100,116,139,0.2)', color: META_COLOR, fontSize: '11px', fontWeight: 700, borderRadius: '99px' }}
                aria-label="Expired"
              >
                Expired
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>

            {/* Mark as read — all users */}
            {!isRead && !isExpired && (
              <button
                onClick={handleMarkAsRead}
                disabled={marking}
                style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 600, color: '#3B82F6', background: 'transparent', border: 'none', borderRadius: '6px', cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.5 : 1, whiteSpace: 'nowrap' }}
                className="hover:bg-blue-500 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Mark announcement as read"
              >
                {marking ? 'Saving...' : 'Mark Read'}
              </button>
            )}

            {/* Admin-only actions */}
            {isAdmin && (
              <>
                <button
                  onClick={function() { setShowEdit(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, color: '#475569', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label={'Edit announcement: ' + announcement.title}
                >
                  <Pencil size={12} aria-hidden="true" />
                  Edit
                </button>

                <button
                  onClick={handlePinToggle}
                  disabled={pinning}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, color: isPinned ? '#D97706' : '#475569', background: isPinned ? 'rgba(245,183,49,0.08)' : 'transparent', border: 'none', borderRadius: '6px', cursor: pinning ? 'not-allowed' : 'pointer', opacity: pinning ? 0.5 : 1, whiteSpace: 'nowrap' }}
                  className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  aria-label={isPinned ? 'Unpin announcement' : 'Pin announcement'}
                >
                  <Pin size={12} aria-hidden="true" />
                  {isPinned ? 'Unpin' : 'Pin'}
                </button>

                <button
                  onClick={function() { setShowConfirm(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, color: '#EF4444', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={'Delete announcement: ' + announcement.title}
                >
                  <Trash2 size={12} aria-hidden="true" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 style={{ color: TITLE_COLOR, fontSize: '16px', fontWeight: 700, lineHeight: 1.35, margin: 0 }}>
          {announcement.title}
        </h3>

        {showOrganization && announcement.organization_name && (
          <p style={{ color: META_COLOR, fontSize: '13px', margin: 0 }}>
            From: <span style={{ fontWeight: 600 }}>{announcement.organization_name}</span>
          </p>
        )}

        <p style={{ color: BODY_COLOR, fontSize: '14px', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {announcement.content}
        </p>

        <div style={{ borderTop: '1px solid ' + DIVIDER, paddingTop: '12px', marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ color: META_COLOR, fontSize: '12px' }}>
            Posted: <span style={{ color: META_VAL }}>{format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}</span>
          </span>
          {announcement.expires_at && (
            <span style={{ color: META_COLOR, fontSize: '12px' }}>
              Expires: <span style={{ color: META_VAL }}>{format(new Date(announcement.expires_at), 'MMM d, yyyy')}</span>
            </span>
          )}
        </div>
      </article>

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={showConfirm}
        title={'Delete "' + announcement.title + '"?'}
        message="This announcement will be permanently removed for all members. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={function() { setShowConfirm(false); }}
      />

      {/* Edit modal */}
      {showEdit && (
        <EditAnnouncementModal
          announcement={Object.assign({}, announcement, { is_pinned: isPinned })}
          onClose={function() { setShowEdit(false); }}
          onSaved={handleEditSaved}
        />
      )}
    </>
  );
}

export default AnnouncementCard;