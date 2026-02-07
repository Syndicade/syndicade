import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { notifyOrganizationMembers } from '../lib/notificationService';

/**
 * CreateAnnouncement Component
 * 
 * Modal form for creating new announcements.
 */
function CreateAnnouncement({ 
  isOpen, 
  onClose, 
  onSuccess, 
  organizationId, 
  organizationName 
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    is_pinned: false,
    expires_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const priorityOptions = [
    { value: 'urgent', label: '🚨 Urgent', description: 'Critical, time-sensitive' },
    { value: 'normal', label: 'ℹ️ Normal', description: 'Standard announcement' },
    { value: 'low', label: '📋 Low Priority', description: 'FYI, non-urgent' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (formData.title.trim().length < 3) {
        throw new Error('Title must be at least 3 characters');
      }
      if (formData.content.trim().length < 10) {
        throw new Error('Content must be at least 10 characters');
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in');

      // Create announcement
      const { data: newAnnouncement, error: createError } = await supabase
        .from('announcements')
        .insert([{
          organization_id: organizationId,
          title: formData.title.trim(),
          content: formData.content.trim(),
          priority: formData.priority,
          is_pinned: formData.is_pinned,
          expires_at: formData.expires_at || null,
          created_by: user.id
        }])
        .select()
        .single();

      if (createError) throw createError;

      console.log('✅ Announcement created:', newAnnouncement);

      // Send notifications to all organization members (don't let errors break the flow)
      try {
        console.log('🔔 Attempting to notify organization members...');
        const notificationResult = await notifyOrganizationMembers({
          organizationId: organizationId,
          type: 'announcement',
          title: '📢 New Announcement',
          message: formData.title,
          link: `/organizations/${organizationId}`,
          excludeUserId: null // Include all members
        });
        
        if (notificationResult.error) {
          console.error('⚠️ Notification error:', notificationResult.error);
        } else {
          console.log('✅ Notifications sent:', notificationResult.data?.length || 0);
              // Trigger event for bell to refresh
              window.dispatchEvent(new CustomEvent('notificationCreated'));
        }
      } catch (notifError) {
        // Log but don't fail the announcement
        console.error('⚠️ Failed to send notifications (announcement still created):', notifError);
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        is_pinned: false,
        expires_at: ''
      });

      // Success callback
      if (onSuccess) {
        onSuccess(newAnnouncement);
      }

      // Close modal
      onClose();

    } catch (err) {
      console.error('❌ Error creating announcement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-announcement-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2
            id="create-announcement-title"
            className="text-2xl font-bold text-gray-900"
          >
            📢 Create Announcement
          </h2>
          <p className="text-gray-600 mt-1">
            Post an announcement to {organizationName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
            >
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="announcement-title"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Title *
            </label>
            <input
              id="announcement-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Important Meeting Update"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="announcement-content"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Content *
            </label>
            <textarea
              id="announcement-content"
              name="content"
              required
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your announcement here..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              aria-required="true"
              maxLength={2000}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.content.length}/2000 characters
            </p>
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="announcement-priority"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Priority Level *
            </label>
            <select
              id="announcement-priority"
              name="priority"
              required
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pin checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="announcement-pin"
                  name="is_pinned"
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="announcement-pin" className="font-semibold text-gray-900">
                  📌 Pin Announcement
                </label>
                <p className="text-sm text-gray-600">
                  Keep at top of feed
                </p>
              </div>
            </div>

            {/* Expiration date */}
            <div>
              <label
                htmlFor="announcement-expires"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Expiration Date (Optional)
              </label>
              <input
                id="announcement-expires"
                name="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Auto-hide after this date
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.title.trim().length < 3 || formData.content.trim().length < 10}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>
                  📢 Post Announcement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAnnouncement;