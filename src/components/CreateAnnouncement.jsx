import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { notifyOrganizationMembers } from '../lib/notificationService';
import toast from 'react-hot-toast';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  megaphone: ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  x:         'M6 18L18 6M6 6l12 12',
  pin:       ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
};

function CreateAnnouncement({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  var [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    is_pinned: false,
    expires_at: '',
  });
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);

  var priorityOptions = [
    { value: 'urgent', label: 'Urgent',       description: 'Critical, time-sensitive' },
    { value: 'normal', label: 'Normal',        description: 'Standard announcement' },
    { value: 'low',    label: 'Low Priority',  description: 'FYI, non-urgent' },
  ];

  var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400';
  var labelCls = 'block text-sm font-semibold text-gray-900 mb-2';

  function handleChange(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(function(prev) { return Object.assign({}, prev, { [name]: value }); });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.title.trim().length < 3) throw new Error('Title must be at least 3 characters');
      if (formData.content.trim().length < 10) throw new Error('Content must be at least 10 characters');

      var authResult = await supabase.auth.getUser();
      if (authResult.error) throw authResult.error;
      if (!authResult.data.user) throw new Error('You must be logged in');
      var user = authResult.data.user;

      // Determine approval status based on role
      var memberResult = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      var userRole = memberResult.data ? memberResult.data.role : 'member';
      var approvalStatus = userRole === 'admin' ? 'approved' : 'pending';

      var insertResult = await supabase
        .from('announcements')
        .insert([{
          organization_id: organizationId,
          title: formData.title.trim(),
          content: formData.content.trim(),
          priority: formData.priority,
          is_pinned: formData.is_pinned,
          expires_at: formData.expires_at || null,
          created_by: user.id,
          approval_status: approvalStatus,
        }])
        .select()
        .single();

      if (insertResult.error) throw insertResult.error;
      var newAnnouncement = insertResult.data;

// Send notifications only if approved
      if (approvalStatus === 'approved') {
        try {
          var notificationResult = await notifyOrganizationMembers({
            organizationId: organizationId,
            type: 'announcement',
            title: 'New Announcement',
            message: formData.title,
            link: '/organizations/' + organizationId,
            excludeUserId: null,
          });
          if (!notificationResult.error) {
            window.dispatchEvent(new CustomEvent('notificationCreated'));
          }
        } catch (notifError) {
          console.error('Notification failed (announcement still created):', notifError);
        }

        // Send email to all members if urgent
        if (formData.priority === 'urgent') {
          try {
            var membersRes = await supabase
              .from('memberships')
              .select('members(email)')
              .eq('organization_id', organizationId)
              .eq('status', 'active');

            if (membersRes.data && membersRes.data.length > 0) {
              var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';
              var announcementUrl = window.location.origin + '/organizations/' + organizationId;
              var emailPromises = membersRes.data
                .filter(function(m) { return m.members && m.members.email; })
                .map(function(m) {
                  return fetch(SUPABASE_URL + '/functions/v1/send-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG1ocXJ5Z2tua29keWRidW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzc0NjksImV4cCI6MjA4NDA1MzQ2OX0.B7DsLVNZuG1l39ABXDk1Km_737tCvbWAZGhqVCC3ddE',
                    },
                    body: JSON.stringify({
                      type: 'urgent_announcement',
                      data: {
                        memberEmail: m.members.email,
                        orgName: organizationName,
                        announcementTitle: formData.title,
                        announcementBody: formData.content,
                        announcementUrl: announcementUrl,
                      },
                    }),
                  });
                });
              await Promise.allSettled(emailPromises);
            }
          } catch (emailErr) {
            console.error('Urgent announcement emails failed:', emailErr);
          }
        }
      }

      setFormData({ title: '', content: '', priority: 'normal', is_pinned: false, expires_at: '' });
      if (onSuccess) onSuccess(newAnnouncement);

      if (approvalStatus === 'pending') {
        toast.success('Announcement submitted for admin approval.');
      } else {
        toast.success('Announcement posted successfully.');
      }

      onClose();
    } catch (err) {
      console.error('CreateAnnouncement error:', err);
      toast.error('Failed to create announcement: ' + err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      onKeyDown={function(e) { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-announcement-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={function(e) { e.stopPropagation(); }}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Icon path={ICONS.megaphone} className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 id="create-announcement-title" className="text-xl font-bold text-gray-900">
                Create Announcement
              </h2>
              <p className="text-gray-500 text-sm">{organizationName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Close dialog"
          >
            <Icon path={ICONS.x} className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800 font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="announcement-title" className={labelCls}>
              Title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="announcement-title"
              name="title"
              type="text"
              required
              aria-required="true"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Important Meeting Update"
              className={inputCls}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1" aria-live="polite">{formData.title.length}/200</p>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="announcement-content" className={labelCls}>
              Content <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="announcement-content"
              name="content"
              required
              aria-required="true"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your announcement here..."
              rows={6}
              className={inputCls + ' resize-none'}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1" aria-live="polite">{formData.content.length}/2000</p>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="announcement-priority" className={labelCls}>Priority</label>
            <select
              id="announcement-priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={inputCls}
            >
              {priorityOptions.map(function(opt) {
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label + ' — ' + opt.description}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Pin + Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ' +
              (formData.is_pinned ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50')}>
              <input
                id="announcement-pin"
                name="is_pinned"
                type="checkbox"
                checked={formData.is_pinned}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"
              />
              <div className="flex items-start gap-2">
                <Icon path={ICONS.pin} className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Pin Announcement</p>
                  <p className="text-xs text-gray-500">Keep at top of feed</p>
                </div>
              </div>
            </label>

            <div>
              <label htmlFor="announcement-expires" className={labelCls}>
                Expiration Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="announcement-expires"
                name="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={handleChange}
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1">Auto-hide after this date</p>
            </div>
          </div>

        </div>

        {/* Sticky footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-transparent border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || formData.title.trim().length < 3 || formData.content.trim().length < 10}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Posting...
              </>
            ) : (
              <>
                <Icon path={ICONS.megaphone} className="h-4 w-4" />
                Post Announcement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAnnouncement;