import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';

var CARD_BG      = '#EFF6FF';
var CARD_BDR     = '#BFDBFE';
var TITLE_COLOR  = '#1E3A5F';
var BODY_COLOR   = '#374151';
var META_COLOR   = '#6B7280';
var META_VAL     = '#4B5563';
var DIVIDER      = '#BFDBFE';
var CARD_SHADOW  = '0 1px 4px rgba(0,0,0,0.08)';

function AnnouncementCard({
  announcement,
  onRead,
  onDelete,
  isAdmin,
  showOrganization
}) {
  var [isRead, setIsRead] = useState(announcement.is_read || false);
  var [marking, setMarking] = useState(false);
  var [deleting, setDeleting] = useState(false);
  var [confirmDelete, setConfirmDelete] = useState(false);

  var daysSinceCreated = differenceInDays(new Date(), new Date(announcement.created_at));
  var isNew = !isRead && daysSinceCreated <= 7;
  var isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  var accentLeft = announcement.priority === 'urgent' ? '#EF4444'
    : announcement.priority === 'low' ? '#94A3B8'
    : '#BFDBFE';

  async function handleMarkAsRead() {
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
    } finally {
      setMarking(false);
    }
  }

  async function handleDelete() {
    if (!isAdmin || deleting) return;
    setDeleting(true);
    try {
      var res = await supabase.from('announcements').delete().eq('id', announcement.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Announcement deleted.');
      if (onDelete) onDelete(announcement.id);
    } catch (err) {
      console.error('Error deleting:', err);
      mascotErrorToast('Failed to delete announcement.', 'Please try again.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <article
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>

          {announcement.is_pinned && (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(245,183,49,0.15)', border: '1px solid rgba(245,183,49,0.4)', color: '#D97706', fontSize: '11px', fontWeight: 700, borderRadius: '99px' }}
              aria-label="Pinned"
            >
              <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Pinned
            </span>
          )}

          {announcement.priority === 'urgent' && (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', fontSize: '11px', fontWeight: 700, borderRadius: '99px' }}
              aria-label="Priority: Urgent"
            >
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {!isRead && !isExpired && (
            <button
              onClick={handleMarkAsRead}
              disabled={marking}
              style={{ padding: '3px 10px', fontSize: '12px', fontWeight: 600, color: '#3B82F6', background: 'transparent', border: 'none', borderRadius: '6px', cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.5 : 1 }}
              className="hover:bg-blue-500 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Mark announcement as read"
            >
              {marking ? 'Saving...' : 'Mark Read'}
            </button>
          )}

          {isAdmin && !confirmDelete && (
            <button
              onClick={function() { setConfirmDelete(true); }}
              disabled={deleting}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, color: '#EF4444', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              className="hover:bg-red-500 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Delete announcement"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}

          {isAdmin && confirmDelete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 600 }}>Sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, color: '#FFFFFF', background: '#EF4444', border: 'none', borderRadius: '6px', cursor: deleting ? 'not-allowed' : 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Confirm delete"
              >
                {deleting ? '...' : 'Yes'}
              </button>
              <button
                onClick={function() { setConfirmDelete(false); }}
                style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, color: META_COLOR, background: 'transparent', border: '1px solid ' + DIVIDER, borderRadius: '6px', cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Cancel delete"
              >
                No
              </button>
            </div>
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
  );
}

export default AnnouncementCard;