import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';

// ── Color tokens ──────────────────────────────────────────────────────────────
var pageBg      = '#F8FAFC';
var cardBg      = '#FFFFFF';
var borderColor = '#E2E8F0';
var elevated    = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function submissionStatusBadge(status) {
  var map = {
    submitted: { bg: '#EFF6FF', color: '#3B82F6', label: 'Submitted' },
    pending:   { bg: '#FEF9C3', color: '#A16207', label: 'Pending' },
    approved:  { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
    rejected:  { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
  };
  var s = map[status] || map.submitted;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {s.label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      {[1, 2, 3].map(function(i) {
        return (
          <div key={i} style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '18px 20px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ width: '80px', height: '10px', background: elevated, borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '50%', height: '13px', background: elevated, borderRadius: '4px', marginBottom: '6px' }} />
              <div style={{ width: '30%', height: '10px', background: elevated, borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '72px', height: '32px', background: elevated, borderRadius: '8px' }} />
              <div style={{ width: '72px', height: '32px', background: elevated, borderRadius: '8px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function AllCaughtUp({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px' }}>
      <div style={{ width: '56px', height: '56px', background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 style={{ fontSize: '17px', fontWeight: 800, color: textPrimary, marginBottom: '6px' }}>All caught up!</h2>
      <p style={{ fontSize: '14px', color: textMuted }}>{message || 'No items pending review.'}</p>
    </div>
  );
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(function() {
    if (!isOpen) return;
    function handleKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
      role="dialog" aria-modal="true" aria-labelledby="confirm-approvals-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={function(e) { e.stopPropagation(); }}>
        <h2 id="confirm-approvals-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>{title}</h2>
        <p style={{ fontSize: '13px', color: textSecondary, marginBottom: '20px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} autoFocus style={{ flex: 1, padding: '10px', border: '1px solid ' + borderColor, borderRadius: '8px', background: 'transparent', color: textSecondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#EF4444', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">{confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Submission detail drawer ──────────────────────────────────────────────────
function SubmissionDetailDrawer({ submission, fields, memberName, onClose, onReview, reviewing }) {
  var [adminNotes, setAdminNotes] = useState(submission.admin_notes || '');
  var requiresApproval = submission._requiresApproval;

  function renderResponse(field, responses) {
    var val = responses[field.id];
    if (val === undefined || val === null || val === '') return <span style={{ color: textMuted, fontStyle: 'italic' }}>No response</span>;
    if (Array.isArray(val)) return <span>{val.join(', ')}</span>;
    return <span style={{ whiteSpace: 'pre-wrap' }}>{String(val)}</span>;
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="sub-detail-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '520px', background: cardBg, borderLeft: '1px solid ' + borderColor, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + borderColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 id="sub-detail-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, margin: 0 }}>{submission._formTitle}</h2>
            <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>Submitted by {memberName} · {formatDateTime(submission.created_at)}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {submissionStatusBadge(submission.status)}
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textMuted, fontSize: '20px', lineHeight: 1, padding: '4px' }} aria-label="Close" className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded">✕</button>
          </div>
        </div>

        {/* Responses */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {fields.length === 0 ? (
            <p style={{ color: textMuted, fontSize: '13px' }}>No fields defined for this form.</p>
          ) : (
            fields.map(function(field) {
              return (
                <div key={field.id} style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{field.label}</p>
                  <p style={{ fontSize: '14px', color: textPrimary, margin: 0, lineHeight: 1.5 }}>{renderResponse(field, submission.responses || {})}</p>
                </div>
              );
            })
          )}

          {/* Admin notes + review actions */}
          {requiresApproval && (submission.status === 'pending' || submission.status === 'submitted') && (
            <div style={{ borderTop: '1px solid ' + borderColor, paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: textSecondary, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }} htmlFor="drawer-notes">
                Admin Notes (optional)
              </label>
              <textarea
                id="drawer-notes"
                value={adminNotes}
                onChange={function(e) { setAdminNotes(e.target.value); }}
                rows={3}
                placeholder="Optional note to include with your decision..."
                style={{ width: '100%', border: '1px solid ' + borderColor, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: textPrimary, background: cardBg, boxSizing: 'border-box', resize: 'vertical', outline: 'none', marginBottom: '12px' }}
                className="focus:ring-2 focus:ring-blue-500"
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={function() { onReview('approved', adminNotes); }}
                  disabled={reviewing}
                  style={{ flex: 1, padding: '10px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#16A34A', opacity: reviewing ? 0.6 : 1 }}
                  className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                >
                  Approve
                </button>
                <button
                  onClick={function() { onReview('rejected', adminNotes); }}
                  disabled={reviewing}
                  style={{ flex: 1, padding: '10px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#DC2626', opacity: reviewing ? 0.6 : 1 }}
                  className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Read-only note if already reviewed */}
          {submission.admin_notes && (submission.status === 'approved' || submission.status === 'rejected') && (
            <div style={{ borderTop: '1px solid ' + borderColor, paddingTop: '16px', marginTop: '8px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Admin Note</p>
              <p style={{ fontSize: '13px', color: textPrimary, lineHeight: 1.5 }}>{submission.admin_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function Approvals() {
  var { organizationId, isAdmin } = useOutletContext();
  var [activeTab, setActiveTab] = useState('content');

  // Content approvals
  var [contentItems, setContentItems] = useState([]);
  var [contentLoading, setContentLoading] = useState(true);

  // Form submissions
  var [submissions, setSubmissions] = useState([]);
  var [submissionsLoading, setSubmissionsLoading] = useState(true);
  var [formFieldsCache, setFormFieldsCache] = useState({});
  var [formTitles, setFormTitles] = useState({});
  var [memberNames, setMemberNames] = useState({});
  var [selectedSubmission, setSelectedSubmission] = useState(null);
  var [reviewing, setReviewing] = useState(false);

  // Confirm modal
  var [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });

  // Filter
  var [submissionFilter, setSubmissionFilter] = useState('pending');

  useEffect(function() { loadContentApprovals(); }, [organizationId]);
  useEffect(function() { loadFormSubmissions(); }, [organizationId]);

  // ── Content approvals ─────────────────────────────────────────────────────
  async function loadContentApprovals() {
    setContentLoading(true);
    try {
      var tables = [
        { name: 'events',       label: 'Event',        tf: 'title' },
        { name: 'announcements', label: 'Announcement', tf: 'title' },
        { name: 'polls',        label: 'Poll',         tf: 'title' },
        { name: 'surveys',      label: 'Survey',       tf: 'title' },
        { name: 'signup_forms', label: 'Sign-Up Form', tf: 'title' },
      ];
      var items = [];
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        var r = await supabase.from(t.name).select('id,' + t.tf + ',created_at').eq('organization_id', organizationId).eq('approval_status', 'pending').order('created_at', { ascending: false });
        if (!r.error && r.data) {
          r.data.forEach(function(item) {
            items.push({ id: item.id, type: t.label, table: t.name, title: item[t.tf], created_at: item.created_at });
          });
        }
      }
      items.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      setContentItems(items);
    } catch(e) {
      mascotErrorToast('Failed to load approvals.', e.message);
    } finally {
      setContentLoading(false);
    }
  }

  async function handleApprove(item) {
    try {
      var r = await supabase.from(item.table).update({ approval_status: 'approved' }).eq('id', item.id);
      if (r.error) throw r.error;
      setContentItems(function(prev) { return prev.filter(function(i) { return !(i.id === item.id && i.type === item.type); }); });
      mascotSuccessToast(item.type + ' approved.');
    } catch(e) {
      toast.error('Could not approve: ' + e.message);
    }
  }

  function handleReject(item) {
    setConfirmModal({
      open: true,
      title: 'Reject ' + item.type + '?',
      message: '"' + item.title + '" will be rejected. This cannot be undone.',
      confirmLabel: 'Reject',
      onConfirm: async function() {
        setConfirmModal(function(p) { return Object.assign({}, p, { open: false }); });
        try {
          var r = await supabase.from(item.table).update({ approval_status: 'rejected' }).eq('id', item.id);
          if (r.error) throw r.error;
          setContentItems(function(prev) { return prev.filter(function(i) { return !(i.id === item.id && i.type === item.type); }); });
          mascotSuccessToast(item.type + ' rejected.');
        } catch(e) {
          toast.error('Could not reject: ' + e.message);
        }
      },
    });
  }

  // ── Form submissions ──────────────────────────────────────────────────────
  async function loadFormSubmissions() {
    setSubmissionsLoading(true);
    try {
      // Get all forms for this org
      var formsRes = await supabase.from('org_forms').select('id,title,requires_approval,status').eq('organization_id', organizationId);
      if (formsRes.error) throw formsRes.error;
      var forms = formsRes.data || [];
      if (forms.length === 0) { setSubmissions([]); setSubmissionsLoading(false); return; }

      var titleMap = {};
      var requiresApprovalMap = {};
      forms.forEach(function(f) { titleMap[f.id] = f.title; requiresApprovalMap[f.id] = f.requires_approval; });
      setFormTitles(titleMap);

      var formIds = forms.map(function(f) { return f.id; });
      var subRes = await supabase.from('org_form_submissions').select('*').in('form_id', formIds).order('created_at', { ascending: false });
      if (subRes.error) throw subRes.error;

      var subs = (subRes.data || []).map(function(s) {
        return Object.assign({}, s, { _formTitle: titleMap[s.form_id] || 'Unknown Form', _requiresApproval: requiresApprovalMap[s.form_id] });
      });
      setSubmissions(subs);

      // Load member names
      var userIds = subs.map(function(s) { return s.submitted_by; }).filter(Boolean);
      if (userIds.length > 0) {
        var memberRes = await supabase.from('members').select('user_id,first_name,last_name').in('user_id', userIds);
        if (!memberRes.error && memberRes.data) {
          var nameMap = {};
          memberRes.data.forEach(function(m) { nameMap[m.user_id] = m.first_name + ' ' + m.last_name; });
          setMemberNames(nameMap);
        }
      }
    } catch(e) {
      mascotErrorToast('Failed to load form submissions.', e.message);
    } finally {
      setSubmissionsLoading(false);
    }
  }

  async function loadFieldsForForm(formId) {
    if (formFieldsCache[formId]) return formFieldsCache[formId];
    var r = await supabase.from('org_form_fields').select('*').eq('form_id', formId).order('display_order');
    var fields = (!r.error && r.data) ? r.data : [];
    setFormFieldsCache(function(prev) { return Object.assign({}, prev, { [formId]: fields }); });
    return fields;
  }

  async function openSubmission(sub) {
    await loadFieldsForForm(sub.form_id);
    setSelectedSubmission(sub);
  }

  async function handleReviewSubmission(newStatus, adminNotes) {
    if (!selectedSubmission) return;
    setReviewing(true);
    try {
      var authR = await supabase.auth.getUser();
      var reviewerId = authR.data && authR.data.user ? authR.data.user.id : null;
      var upd = await supabase.from('org_form_submissions').update({
        status: newStatus,
        admin_notes: adminNotes || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedSubmission.id);
      if (upd.error) throw upd.error;
      mascotSuccessToast('Submission ' + newStatus + '.');
      setSubmissions(function(prev) {
        return prev.map(function(s) {
          return s.id === selectedSubmission.id ? Object.assign({}, s, { status: newStatus, admin_notes: adminNotes || null }) : s;
        });
      });
      setSelectedSubmission(null);
    } catch(e) {
      mascotErrorToast('Failed to update submission.', e.message);
    } finally {
      setReviewing(false);
    }
  }

  // ── Derived counts for tab badges ─────────────────────────────────────────
  var pendingSubmissions = submissions.filter(function(s) { return s.status === 'pending' || s.status === 'submitted'; });
  var filteredSubmissions = submissionFilter === 'all' ? submissions : submissionFilter === 'pending' ? pendingSubmissions : submissions.filter(function(s) { return s.status === submissionFilter; });

  var TABS = [
    { key: 'content',     label: 'Content Approvals',  count: contentItems.length },
    { key: 'submissions', label: 'Form Submissions',   count: pendingSubmissions.length },
  ];

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: textSecondary }}>Admin access required.</p>
      </div>
    );
  }

  return (
    <div style={{ background: pageBg, minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: textPrimary, margin: 0 }}>Approvals</h1>
        {!contentLoading && !submissionsLoading && (
          <p style={{ fontSize: '14px', color: textMuted, marginTop: '4px' }}>
            {contentItems.length + ' content item' + (contentItems.length !== 1 ? 's' : '') + ' · ' + pendingSubmissions.length + ' form submission' + (pendingSubmissions.length !== 1 ? 's' : '') + ' pending'}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid ' + borderColor, marginBottom: '20px' }} role="tablist" aria-label="Approval sections">
        {TABS.map(function(tab) {
          var isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={function() { setActiveTab(tab.key); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: isActive ? '#3B82F6' : textMuted, borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent', marginBottom: '-1px' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{ background: isActive ? '#3B82F6' : elevated, color: isActive ? '#FFFFFF' : textMuted, fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content approvals tab */}
      {activeTab === 'content' && (
        contentLoading ? <Skeleton /> : contentItems.length === 0 ? (
          <AllCaughtUp message="No content waiting for approval." />
        ) : (
          <div role="list" aria-label="Content pending approval">
            {contentItems.map(function(item) {
              return (
                <div
                  key={item.type + '-' + item.id}
                  role="listitem"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', background: cardBg, border: '1px solid rgba(245,183,49,0.2)', borderRadius: '10px', marginBottom: '8px', boxShadow: '3px 4px 14px rgba(0,0,0,0.04)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: '#DBEAFE', color: '#1E40AF', marginBottom: '6px' }}>{item.type}</span>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{item.title}</p>
                    <p style={{ fontSize: '11px', color: textMuted, marginTop: '3px' }}>Submitted {formatDate(item.created_at)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={function() { handleApprove(item); }}
                      style={{ padding: '7px 16px', background: '#22C55E', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                      aria-label={'Approve ' + item.title}
                    >
                      Approve
                    </button>
                    <button
                      onClick={function() { handleReject(item); }}
                      style={{ padding: '7px 16px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.35)', fontSize: '12px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                      className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      aria-label={'Reject ' + item.title}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Form submissions tab */}
      {activeTab === 'submissions' && (
        <div>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'all', label: 'All' },
            ].map(function(f) {
              var isActive = submissionFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={function() { setSubmissionFilter(f.key); }}
                  style={{ padding: '5px 14px', border: '1px solid ' + (isActive ? '#3B82F6' : borderColor), borderRadius: '99px', background: isActive ? '#EFF6FF' : cardBg, color: isActive ? '#3B82F6' : textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  aria-pressed={isActive}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {submissionsLoading ? <Skeleton /> : filteredSubmissions.length === 0 ? (
            <AllCaughtUp message={submissionFilter === 'pending' ? 'No pending form submissions.' : 'No submissions match this filter.'} />
          ) : (
            <div role="list" aria-label="Form submissions">
              {filteredSubmissions.map(function(sub) {
                var memberName = memberNames[sub.submitted_by] || 'Member';
                return (
                  <button
                    key={sub.id}
                    role="listitem"
                    onClick={function() { openSubmission(sub); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '10px', marginBottom: '8px', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    className="hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    aria-label={'View submission from ' + memberName + ' for form ' + sub._formTitle}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, margin: 0 }}>{sub._formTitle}</p>
                      <p style={{ fontSize: '12px', color: textSecondary, marginTop: '3px' }}>{memberName}</p>
                      <p style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>Submitted {formatDateTime(sub.created_at)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      {submissionStatusBadge(sub.status)}
                      <span style={{ fontSize: '12px', color: textMuted }}>View →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submission detail drawer */}
      {selectedSubmission && (
        <SubmissionDetailDrawer
          submission={selectedSubmission}
          fields={formFieldsCache[selectedSubmission.form_id] || []}
          memberName={memberNames[selectedSubmission.submitted_by] || 'Member'}
          onClose={function() { setSelectedSubmission(null); }}
          onReview={handleReviewSubmission}
          reviewing={reviewing}
        />
      )}

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm || function() {}}
        onCancel={function() { setConfirmModal(function(p) { return Object.assign({}, p, { open: false }); }); }}
      />
    </div>
  );
}

export default Approvals;