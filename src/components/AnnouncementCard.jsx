import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

/**
 * AnnouncementCard Component
 * 
 * Displays a single announcement with priority indicator, read status,
 * and pin functionality.
 */
function AnnouncementCard({ 
  announcement, 
  onRead, 
  onDelete, 
  isAdmin = false,
  showOrganization = false 
}) {
  const [isRead, setIsRead] = useState(announcement.is_read || false);
  const [marking, setMarking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Priority styling and icons
  const priorityConfig = {
    urgent: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-600 text-white',
      icon: '🚨',
      label: 'Urgent'
    },
    normal: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-600 text-white',
      icon: 'ℹ️',
      label: 'Normal'
    },
    low: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      badge: 'bg-gray-600 text-white',
      icon: '📋',
      label: 'Low Priority'
    }
  };

  const config = priorityConfig[announcement.priority] || priorityConfig.normal;

  // Mark announcement as read
  const handleMarkAsRead = async () => {
    if (isRead || marking) return;

    setMarking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('announcement_reads')
        .insert([{
          announcement_id: announcement.id,
          member_id: user.id
        }]);

      if (error && error.code !== '23505') {
        throw error;
      }

      setIsRead(true);
      if (onRead) {
        onRead(announcement.id);
      }
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    } finally {
      setMarking(false);
    }
  };

  // Delete announcement (admin only)
  const handleDelete = async () => {
    if (!isAdmin || deleting) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${announcement.title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (error) throw error;

      if (onDelete) {
        onDelete(announcement.id);
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Check if announcement is expired
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  return (
    <article
      className={`rounded-lg border-2 ${config.border} ${config.bg} p-4 shadow-sm transition-all hover:shadow-md ${
        isRead ? 'opacity-75' : ''
      }`}
      aria-label={`${announcement.title} announcement`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {/* Pin indicator */}
            {announcement.is_pinned && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded"
                aria-label="Pinned announcement"
              >
                📌 Pinned
              </span>
            )}

            {/* Priority badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 ${config.badge} text-xs font-semibold rounded`}
              aria-label={`Priority: ${config.label}`}
            >
              <span aria-hidden="true">{config.icon}</span>
              {config.label}
            </span>

            {/* Read status */}
            {!isRead && !isExpired && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded"
                aria-label="Unread"
              >
                🔵 New
              </span>
            )}

            {/* Expired indicator */}
            {isExpired && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded"
                aria-label="Expired"
              >
                ⏱️ Expired
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900">
            {announcement.title}
          </h3>

          {/* Organization name */}
          {showOrganization && announcement.organization_name && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">From:</span> {announcement.organization_name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mark as read button */}
          {!isRead && !isExpired && (
            <button
              onClick={handleMarkAsRead}
              disabled={marking}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Mark as read"
            >
              {marking ? 'Marking...' : 'Mark Read'}
            </button>
          )}

          {/* Delete button (admin only) */}
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete announcement"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Content preview */}
      <p className="text-gray-700 mb-3 line-clamp-3">
        {announcement.content}
      </p>

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 pt-2">
        <div className="flex items-center gap-4">
          {/* Posted date */}
          <span>
            <span className="font-semibold">Posted:</span>{' '}
            {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
          </span>

          {/* Expiration date */}
          {announcement.expires_at && (
            <span>
              <span className="font-semibold">Expires:</span>{' '}
              {format(new Date(announcement.expires_at), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default AnnouncementCard;