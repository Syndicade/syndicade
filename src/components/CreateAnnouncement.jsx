import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { notifyOrganizationMembers } from '../lib/notificationService';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';

function Icon({ path, size }) {
  var s = size || 18;
  return (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function (d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  megaphone: ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  x:         'M6 18L18 6M6 6l12 12',
  pin:       'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  check:     'M5 13l4 4L19 7',
  spinner:   null,
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
    { value: 'urgent', label: 'Urgent',      description: 'Critical, time-sensitive' },
    { value: 'normal', label: 'Normal',       description: 'Standard announcement' },
    { value: 'low',    label: 'Low Priority', description: 'FYI, non-urgent' },
  ];

  function handleChange(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(function (prev) { return Object.assign({}, prev, { [name]: value }); });
  }

  function resetForm() {
    setFormData({ title: '', content: '', priority: 'normal', is_pinned: false, expires_at: '' });
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (formData.title.trim().length < 3) {
      toast.error('Title must be at least 3 characters.');
      return;
    }
    if (formData.content.trim().length < 10) {
      toast.error('Content must be at least 10 characters.');
      return;
    }

    setLoading(true);
    var loadingToast = toast.loading('Posting announcement...');

    try {
      var authRes = await supabase.auth.getUser();
      if (authRes.error) throw authRes.error;
      var user = authRes.data.user;
      if (!user) throw new Error('You must be logged in');

      var memberRes = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      var userRole = memberRes.data ? memberRes.data.role : 'member';
      var approvalStatus = userRole === 'admin' ? 'approved' : 'pending';

      var insertRes = await supabase
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

      if (insertRes.error) throw insertRes.error;
      var newAnnouncement = insertRes.data;

      if (approvalStatus === 'approved') {
        // In-app notifications
        try {
          var notifRes = await notifyOrganizationMembers({
            organizationId: organizationId,
            type: 'announcement',
            title: 'New Announcement',
            message: formData.title,
            link: '/organizations/' + organizationId,
            excludeUserId: null,
          });
          if (!notifRes.error) {
            window.dispatchEvent(new CustomEvent('notificationCreated'));
          }
        } catch (notifErr) {
          console.error('Notification failed (announcement still created):', notifErr);
        }

        // Email all members if urgent
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
                .filter(function (m) { return m.members && m.members.email; })
                .map(function (m) {
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
            console.error('Urgent emails failed:', emailErr);
          }
        }
      }

      toast.dismiss(loadingToast);

      if (approvalStatus === 'pending') {
        mascotSuccessToast('Announcement submitted!', 'Waiting for admin approval.');
      } else {
        mascotSuccessToast('Announcement posted!', 'Your members will see it now.');
      }

      if (onSuccess) onSuccess(newAnnouncement);
      resetForm();
      onClose();
    } catch (err) {
      console.error('CreateAnnouncement error:', err);
      toast.dismiss(loadingToast);
      mascotErrorToast('Failed to post announcement.', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  var isSubmitDisabled = loading || formData.title.trim().length < 3 || formData.content.trim().length < 10;

  // Shared input style
  var inputStyle = {
    width: '100%', padding: '12px 16px', background: '#0E1523', border: '1px solid #2A3550',
    borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  var labelStyle = { display: 'block', color: '#CBD5E1', fontSize: '13px', fontWeight: 600, marginBottom: '6px' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
      onClick={handleClose}
      onKeyDown={function (e) { if (e.key === 'Escape') handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-announcement-title"
    >
      <div
        style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={function (e) { e.stopPropagation(); }}
      >

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #2A3550', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(59,130,246,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', flexShrink: 0 }} aria-hidden="true">
              <Icon path={ICONS.megaphone} size={18} />
            </div>
            <div>
              <h2 id="create-announcement-title" style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Create Announcement
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>{organizationName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ padding: '8px', color: '#64748B', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="hover:bg-white hover:bg-opacity-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close dialog"
          >
            <Icon path={ICONS.x} size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {error && (
            <div
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px' }}
              role="alert"
            >
              <p style={{ color: '#EF4444', fontSize: '14px', margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="ann-title" style={labelStyle}>
              Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
            </label>
            <input
              id="ann-title"
              name="title"
              type="text"
              required
              aria-required="true"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Important Meeting Update"
              style={inputStyle}
              maxLength={200}
              onFocus={function (e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function (e) { e.target.style.borderColor = '#2A3550'; }}
            />
            <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }} aria-live="polite">{formData.title.length}/200</p>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="ann-content" style={labelStyle}>
              Content <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
            </label>
            <textarea
              id="ann-content"
              name="content"
              required
              aria-required="true"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your announcement here..."
              rows={6}
              style={Object.assign({}, inputStyle, { resize: 'none' })}
              maxLength={2000}
              onFocus={function (e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function (e) { e.target.style.borderColor = '#2A3550'; }}
            />
            <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }} aria-live="polite">{formData.content.length}/2000</p>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="ann-priority" style={labelStyle}>Priority</label>
            <select
              id="ann-priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={Object.assign({}, inputStyle, { cursor: 'pointer' })}
              onFocus={function (e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function (e) { e.target.style.borderColor = '#2A3550'; }}
            >
              {priorityOptions.map(function (opt) {
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label + ' — ' + opt.description}
                  </option>
                );
              })}
            </select>
            {formData.priority === 'urgent' && (
              <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px' }}>
                Urgent announcements send an email notification to all members.
              </p>
            )}
          </div>

          {/* Pin + Expiry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Pin toggle */}
            <label
              htmlFor="ann-pin"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px',
                background: formData.is_pinned ? 'rgba(59,130,246,0.08)' : '#0E1523',
                border: '1px solid ' + (formData.is_pinned ? '#3B82F6' : '#2A3550'),
                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <input
                id="ann-pin"
                name="is_pinned"
                type="checkbox"
                checked={formData.is_pinned}
                onChange={handleChange}
                style={{ marginTop: '2px', flexShrink: 0, accentColor: '#3B82F6' }}
                className="focus:ring-2 focus:ring-blue-500"
              />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: '#3B82F6', flexShrink: 0, marginTop: '1px' }}>
                  <Icon path={ICONS.pin} size={15} />
                </span>
                <div>
                  <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, margin: 0 }}>Pin Announcement</p>
                  <p style={{ color: '#64748B', fontSize: '12px', margin: '2px 0 0' }}>Keep at top of feed</p>
                </div>
              </div>
            </label>

            {/* Expiry */}
            <div>
              <label htmlFor="ann-expires" style={labelStyle}>
                Expiration <span style={{ color: '#64748B', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="ann-expires"
                name="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={handleChange}
                style={Object.assign({}, inputStyle, { colorScheme: 'dark' })}
                onFocus={function (e) { e.target.style.borderColor = '#3B82F6'; }}
                onBlur={function (e) { e.target.style.borderColor = '#2A3550'; }}
              />
              <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>Auto-hide after this date</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #2A3550', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2A3550', color: '#CBD5E1', fontWeight: 600, borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.5 : 1 }}
            className="hover:bg-white hover:bg-opacity-5 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: isSubmitDisabled ? '#1E2845' : '#3B82F6', border: 'none', color: isSubmitDisabled ? '#64748B' : '#FFFFFF', fontWeight: 600, borderRadius: '8px', cursor: isSubmitDisabled ? 'not-allowed' : 'pointer', fontSize: '14px', transition: 'background 0.15s' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Posting...
              </>
            ) : (
              <>
                <Icon path={ICONS.megaphone} size={16} />
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