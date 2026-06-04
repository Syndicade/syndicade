import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AnnouncementCard from '../components/AnnouncementCard';
import CreateAnnouncement from '../components/CreateAnnouncement';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

var TITLE_COLOR    = '#0E1523';
var SUBTITLE_COLOR = '#6B7280';
var CONTROL_BG     = '#FFFFFF';
var CONTROL_BDR    = '#E5E7EB';
var INPUT_BG       = '#F9FAFB';
var INPUT_BDR      = '#D1D5DB';
var INPUT_COLOR    = '#0E1523';
var LABEL_COLOR    = '#374151';
var SKEL_BASE      = '#E5E7EB';

// ── Expiry helper ─────────────────────────────────────────────────────────────
function getExpiryInfo(expiresAt) {
  if (!expiresAt) return null;
  var now = new Date();
  var exp = new Date(expiresAt);
  var diffMs = exp - now;
  var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return null;
  if (diffDays <= 1) return { label: 'Expires today',                                                                  color: '#DC2626', bg: '#FEF2F2', border: 'rgba(239,68,68,0.3)' };
  if (diffDays <= 3) return { label: 'Expires in ' + diffDays + ' day' + (diffDays !== 1 ? 's' : ''), color: '#DC2626', bg: '#FEF2F2', border: 'rgba(239,68,68,0.3)' };
  if (diffDays <= 7) return { label: 'Expires in ' + diffDays + ' days',                                              color: '#D97706', bg: '#FFFBEB', border: 'rgba(217,119,6,0.3)'  };
  return null;
}

function AnnouncementFeed() {
  var { organizationId } = useParams();

  var [announcements, setAnnouncements]                 = useState([]);
  var [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  var [organization, setOrganization]                   = useState(null);
  var [loading, setLoading]                             = useState(true);
  var [error, setError]                                 = useState(null);
  var [searchTerm, setSearchTerm]                       = useState('');
  var [priorityFilter, setPriorityFilter]               = useState('all');
  var [unreadOnly, setUnreadOnly]                       = useState(false);
  var [pinnedOnly, setPinnedOnly]                       = useState(false);
  var [unreadCount, setUnreadCount]                     = useState(0);
  var [isAdmin, setIsAdmin]                             = useState(false);
  var [showCreateModal, setShowCreateModal]             = useState(false);
  var [markingAllRead, setMarkingAllRead]               = useState(false);
  var [bulkMode, setBulkMode]                           = useState(false);
  var [selectedIds, setSelectedIds]                     = useState([]);
  var [bulkDeleting, setBulkDeleting]                   = useState(false);
  var [bulkMarkingRead, setBulkMarkingRead]             = useState(false);
  var [togglingPinId, setTogglingPinId]                 = useState(null);

  // ── Fetch org + role ────────────────────────────────────────────────────────
  useEffect(function() {
    async function fetchOrganization() {
      try {
        var authRes = await supabase.auth.getUser();
        var user = authRes.data.user;
        if (!user) throw new Error('Not authenticated');

        var orgRes = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();
        if (orgRes.error) throw orgRes.error;
        setOrganization(orgRes.data);

        var memberRes = await supabase
          .from('memberships')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('member_id', user.id)
          .eq('status', 'active')
          .single();
        if (memberRes.error && memberRes.error.code !== 'PGRST116') throw memberRes.error;
        setIsAdmin(memberRes.data && memberRes.data.role === 'admin');
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err.message);
      }
    }
    if (organizationId) fetchOrganization();
  }, [organizationId]);

  // ── Fetch announcements ─────────────────────────────────────────────────────
  useEffect(function() {
    async function fetchAnnouncements() {
      try {
        var authRes = await supabase.auth.getUser();
        var user = authRes.data.user;
        if (!user) throw new Error('Not authenticated');

        var annRes = await supabase
          .from('announcements')
          .select('*, announcement_reads!left(id, member_id)')
          .eq('organization_id', organizationId)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
        if (annRes.error) throw annRes.error;

        var processed = annRes.data.map(function(a) {
          return Object.assign({}, a, {
            is_read: a.announcement_reads && a.announcement_reads.some(function(r) { return r.member_id === user.id; }) || false
          });
        });

        var active = processed.filter(function(a) {
          return !a.expires_at || new Date(a.expires_at) > new Date();
        });

        setAnnouncements(active);
        setFilteredAnnouncements(active);
        setUnreadCount(active.filter(function(a) { return !a.is_read; }).length);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (organizationId) fetchAnnouncements();
  }, [organizationId]);

  // ── Filter logic ────────────────────────────────────────────────────────────
  useEffect(function() {
    var filtered = announcements.slice();

    if (searchTerm.trim()) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function(a) {
        return a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term);
      });
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(function(a) { return a.priority === priorityFilter; });
    }

    if (unreadOnly) {
      filtered = filtered.filter(function(a) { return !a.is_read; });
    }

    if (pinnedOnly) {
      filtered = filtered.filter(function(a) { return a.is_pinned; });
    }

    filtered.sort(function(a, b) {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      var order = { urgent: 0, normal: 1, low: 2 };
      var diff = (order[a.priority] || 0) - (order[b.priority] || 0);
      if (diff !== 0) return diff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, priorityFilter, unreadOnly, pinnedOnly]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleAnnouncementRead(announcementId) {
    setAnnouncements(function(prev) {
      return prev.map(function(a) {
        return a.id === announcementId ? Object.assign({}, a, { is_read: true }) : a;
      });
    });
    setUnreadCount(function(prev) { return Math.max(0, prev - 1); });
  }

  function handleAnnouncementDelete(announcementId) {
    setAnnouncements(function(prev) { return prev.filter(function(a) { return a.id !== announcementId; }); });
  }

async function handleAnnouncementCreated(newAnnouncement) {
    setAnnouncements(function(prev) {
      return [Object.assign({}, newAnnouncement, { is_read: false }), ...prev];
    });
    setUnreadCount(function(prev) { return prev + 1; });
    try {
      var notifModule = await import('../lib/notificationService');
      var authRes = await supabase.auth.getUser();
      var user = authRes.data.user;
      await notifModule.notifyOrganizationMembers({
        organizationId: organizationId,
        type: 'new_announcement',
        title: newAnnouncement.title || 'New Announcement',
        message: (organization ? organization.name : 'Your organization') + ' posted a new announcement.',
        link: '/organizations/' + organizationId + '/announcements',
        excludeUserId: user ? user.id : null,
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch(ne){ console.error('Announcement notification failed:', ne); }
  }

  async function handleMarkAllAsRead() {
    var authRes = await supabase.auth.getUser();
    var user = authRes.data.user;
    if (!user) return;

    var unread = announcements.filter(function(a) { return !a.is_read; });
    if (unread.length === 0) { toast.error('All announcements are already read.'); return; }

    setMarkingAllRead(true);
    var loadingToast = toast.loading('Marking all as read...');

    try {
      var records = unread.map(function(a) { return { announcement_id: a.id, member_id: user.id }; });
      var res = await supabase.from('announcement_reads').insert(records);
      if (res.error) throw res.error;
      setAnnouncements(function(prev) {
        return prev.map(function(a) { return Object.assign({}, a, { is_read: true }); });
      });
      setUnreadCount(0);
      toast.dismiss(loadingToast);
      mascotSuccessToast('All caught up!', 'All announcements marked as read.');
    } catch (err) {
      toast.dismiss(loadingToast);
      mascotErrorToast('Failed to mark as read.', 'Please try again.');
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handlePinToggle(ann) {
    if (togglingPinId) return;
    setTogglingPinId(ann.id);
    try {
      var r = await supabase.from('announcements').update({ is_pinned: !ann.is_pinned }).eq('id', ann.id);
      if (r.error) throw r.error;
      setAnnouncements(function(prev) {
        return prev.map(function(a) {
          return a.id === ann.id ? Object.assign({}, a, { is_pinned: !ann.is_pinned }) : a;
        });
      });
      mascotSuccessToast(ann.is_pinned ? 'Unpinned.' : 'Pinned to top!');
    } catch (err) {
      toast.error('Could not update pin status.');
    } finally {
      setTogglingPinId(null);
    }
  }

  function toggleSelectId(id) {
    setSelectedIds(function(prev) {
      if (prev.indexOf(id) !== -1) return prev.filter(function(i) { return i !== id; });
      return prev.concat([id]);
    });
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredAnnouncements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAnnouncements.map(function(a) { return a.id; }));
    }
  }

  async function handleBulkMarkRead() {
    var authRes = await supabase.auth.getUser();
    var user = authRes.data.user;
    if (!user) return;

    var unreadSelected = announcements.filter(function(a) {
      return selectedIds.indexOf(a.id) !== -1 && !a.is_read;
    });

    if (unreadSelected.length === 0) { toast.error('Selected items are already read.'); return; }

    setBulkMarkingRead(true);
    try {
      var records = unreadSelected.map(function(a) { return { announcement_id: a.id, member_id: user.id }; });
      var r = await supabase.from('announcement_reads').insert(records);
      if (r.error) throw r.error;
      setAnnouncements(function(prev) {
        return prev.map(function(a) {
          return selectedIds.indexOf(a.id) !== -1 ? Object.assign({}, a, { is_read: true }) : a;
        });
      });
      setUnreadCount(function(prev) { return Math.max(0, prev - unreadSelected.length); });
      setSelectedIds([]);
      setBulkMode(false);
      mascotSuccessToast(unreadSelected.length + ' marked as read.');
    } catch (err) {
      mascotErrorToast('Failed to mark as read.');
    } finally {
      setBulkMarkingRead(false);
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm('Delete ' + selectedIds.length + ' announcement' + (selectedIds.length !== 1 ? 's' : '') + '? This cannot be undone.')) return;
    setBulkDeleting(true);
    try {
      var r = await supabase.from('announcements').delete().in('id', selectedIds);
      if (r.error) throw r.error;
      setAnnouncements(function(prev) {
        return prev.filter(function(a) { return selectedIds.indexOf(a.id) === -1; });
      });
      setSelectedIds([]);
      setBulkMode(false);
      mascotSuccessToast(selectedIds.length + ' announcement' + (selectedIds.length !== 1 ? 's' : '') + ' deleted.');
    } catch (err) {
      mascotErrorToast('Failed to delete.', 'Please try again.');
    } finally {
      setBulkDeleting(false);
    }
  }

  function clearAllFilters() {
    setSearchTerm('');
    setPriorityFilter('all');
    setUnreadOnly(false);
    setPinnedOnly(false);
  }

  var hasActiveFilters = searchTerm || priorityFilter !== 'all' || unreadOnly || pinnedOnly;
  var allSelected = filteredAnnouncements.length > 0 && selectedIds.length === filteredAnnouncements.length;
  var someSelected = selectedIds.length > 0 && !allSelected;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ padding: '24px' }} aria-label="Loading announcements" aria-busy="true">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ background: SKEL_BASE, borderRadius: '8px', height: '36px', width: '240px', marginBottom: '10px' }} className="animate-pulse" aria-hidden="true" />
            <div style={{ background: SKEL_BASE, borderRadius: '6px', height: '16px', width: '160px' }} className="animate-pulse" aria-hidden="true" />
          </div>
          <div style={{ background: SKEL_BASE, borderRadius: '8px', height: '44px', width: '200px' }} className="animate-pulse" aria-hidden="true" />
        </div>
        <div style={{ background: CONTROL_BG, border: '1px solid ' + CONTROL_BDR, borderRadius: '12px', padding: '16px', marginBottom: '24px' }} aria-hidden="true">
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: SKEL_BASE, borderRadius: '8px', height: '40px', flex: 1 }} className="animate-pulse" />
            <div style={{ background: SKEL_BASE, borderRadius: '8px', height: '40px', width: '140px' }} className="animate-pulse" />
            <div style={{ background: SKEL_BASE, borderRadius: '8px', height: '40px', width: '100px' }} className="animate-pulse" />
            <div style={{ background: SKEL_BASE, borderRadius: '8px', height: '40px', width: '90px' }} className="animate-pulse" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(function(n) {
            return (
              <div key={n} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '24px' }} aria-hidden="true">
                <div style={{ background: SKEL_BASE, borderRadius: '99px', height: '22px', width: '64px', marginBottom: '14px' }} className="animate-pulse" />
                <div style={{ background: SKEL_BASE, borderRadius: '6px', height: '22px', width: '80%', marginBottom: '10px' }} className="animate-pulse" />
                <div style={{ background: SKEL_BASE, borderRadius: '6px', height: '14px', width: '100%', marginBottom: '6px' }} className="animate-pulse" />
                <div style={{ background: SKEL_BASE, borderRadius: '6px', height: '14px', width: '70%', marginBottom: '16px' }} className="animate-pulse" />
                <div style={{ background: SKEL_BASE, borderRadius: '6px', height: '13px', width: '110px' }} className="animate-pulse" />
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main style={{ padding: '24px' }}>
        <div
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '48px 32px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}
          role="alert"
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEE2E2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#EF4444" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p style={{ color: '#0E1523', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Failed to Load Announcements</p>
          <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '14px' }}>{error}</p>
          <button
            onClick={function() { window.location.reload(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <main style={{ padding: '24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: TITLE_COLOR, fontSize: '30px', fontWeight: 800, marginBottom: '4px' }}>Announcements</h1>
          <p style={{ color: SUBTITLE_COLOR, fontSize: '14px' }}>
            {announcements.length + ' announcement' + (announcements.length !== 1 ? 's' : '')}
            {unreadCount > 0 ? ' · ' + unreadCount + ' unread' : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={function() { setShowCreateModal(true); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Create a new announcement"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Announcement
          </button>
        )}
      </div>

      {/* Controls bar */}
      <div
        style={{ background: CONTROL_BG, border: '1px solid ' + CONTROL_BDR, borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}
        role="search"
        aria-label="Announcement filters"
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <label htmlFor="search-announcements" className="sr-only">Search announcements</label>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-announcements"
              type="search"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={function(e) { setSearchTerm(e.target.value); }}
              style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', background: INPUT_BG, border: '1px solid ' + INPUT_BDR, borderRadius: '8px', color: INPUT_COLOR, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)'; }}
              onBlur={function(e) { e.target.style.borderColor = INPUT_BDR; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Priority filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="priority-filter" style={{ color: LABEL_COLOR, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Priority:</label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={function(e) { setPriorityFilter(e.target.value); }}
              style={{ padding: '9px 12px', background: INPUT_BG, border: '1px solid ' + INPUT_BDR, borderRadius: '8px', color: INPUT_COLOR, fontSize: '13px', cursor: 'pointer' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Unread only toggle */}
          <button
            onClick={function() { setUnreadOnly(function(p) { return !p; }); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 13px',
              background: unreadOnly ? 'rgba(245,183,49,0.1)' : INPUT_BG,
              border: '1px solid ' + (unreadOnly ? 'rgba(245,183,49,0.5)' : INPUT_BDR),
              borderRadius: '8px',
              color: unreadOnly ? '#B45309' : LABEL_COLOR,
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}
            className="focus:outline-none focus:ring-2 focus:ring-yellow-400"
            aria-pressed={unreadOnly}
            aria-label="Filter unread only"
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: unreadOnly ? '#F5B731' : '#CBD5E1', display: 'inline-block', flexShrink: 0 }} aria-hidden="true" />
            Unread
            {unreadCount > 0 && (
              <span style={{ background: 'rgba(245,183,49,0.2)', color: '#92400E', fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '99px', lineHeight: 1.4 }}>{unreadCount}</span>
            )}
          </button>

          {/* Pinned only toggle */}
          <button
            onClick={function() { setPinnedOnly(function(p) { return !p; }); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 13px',
              background: pinnedOnly ? 'rgba(59,130,246,0.08)' : INPUT_BG,
              border: '1px solid ' + (pinnedOnly ? 'rgba(59,130,246,0.4)' : INPUT_BDR),
              borderRadius: '8px',
              color: pinnedOnly ? '#1D4ED8' : LABEL_COLOR,
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-pressed={pinnedOnly}
            aria-label="Filter pinned only"
          >
            <svg width="12" height="12" fill={pinnedOnly ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Pinned
          </button>

          {/* Mark all read */}
          {unreadCount > 0 && !bulkMode && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 13px',
                background: '#F0FDF4', border: '1px solid #86EFAC',
                borderRadius: '8px', color: '#16A34A', fontSize: '13px', fontWeight: 600,
                cursor: markingAllRead ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                opacity: markingAllRead ? 0.6 : 1
              }}
              className="focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label={'Mark all ' + unreadCount + ' announcements as read'}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark All Read ({unreadCount})
            </button>
          )}

          {/* Bulk select toggle — admin only */}
          {isAdmin && announcements.length > 0 && (
            <button
              onClick={function() { setBulkMode(function(p) { return !p; }); setSelectedIds([]); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 13px',
                background: bulkMode ? '#EDE9FE' : INPUT_BG,
                border: '1px solid ' + (bulkMode ? 'rgba(139,92,246,0.4)' : INPUT_BDR),
                borderRadius: '8px',
                color: bulkMode ? '#7C3AED' : LABEL_COLOR,
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
              }}
              className="focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-pressed={bulkMode}
              aria-label={bulkMode ? 'Cancel bulk selection' : 'Enable bulk selection'}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {bulkMode ? 'Cancel' : 'Select'}
            </button>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{ padding: '8px 13px', background: 'transparent', border: '1px solid ' + INPUT_BDR, borderRadius: '8px', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              className="focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Clear all filters"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkMode && (
        <div
          style={{
            background: '#EDE9FE', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '10px',
            padding: '12px 16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
          }}
          role="toolbar"
          aria-label="Bulk actions"
        >
          {/* Select all */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#5B21B6', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              style={{ width: '15px', height: '15px', accentColor: '#8B5CF6', cursor: 'pointer' }}
              aria-label="Select all visible announcements"
            />
            {selectedIds.length === 0 ? 'Select all' : selectedIds.length + ' selected'}
          </label>

          {selectedIds.length > 0 && (
            <>
              <div style={{ width: '1px', height: '20px', background: 'rgba(139,92,246,0.2)', flexShrink: 0 }} aria-hidden="true" />

              <button
                onClick={handleBulkMarkRead}
                disabled={bulkMarkingRead}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '6px', color: '#15803D', fontSize: '12px', fontWeight: 700, cursor: bulkMarkingRead ? 'not-allowed' : 'pointer', opacity: bulkMarkingRead ? 0.6 : 1 }}
                className="focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Mark selected as read"
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {bulkMarkingRead ? 'Marking...' : 'Mark Read'}
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#DC2626', fontSize: '12px', fontWeight: 700, cursor: bulkDeleting ? 'not-allowed' : 'pointer', opacity: bulkDeleting ? 0.6 : 1 }}
                className="focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={'Delete ' + selectedIds.length + ' selected announcements'}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {bulkDeleting ? 'Deleting...' : 'Delete (' + selectedIds.length + ')'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Announcements grid */}
      {filteredAnnouncements.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px', paddingBottom: '64px' }} role="region" aria-label="No announcements found">
          <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '220px', margin: '0 auto 24px', mixBlendMode: 'multiply', display: 'block' }} />
          <h2 style={{ color: TITLE_COLOR, fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
            {hasActiveFilters ? 'No announcements match your filters' : 'No announcements yet'}
          </h2>
          <p style={{ color: SUBTITLE_COLOR, maxWidth: '380px', margin: '0 auto 28px', fontSize: '14px', lineHeight: 1.6 }}>
            {hasActiveFilters
              ? 'Try adjusting your search or clearing the filters.'
              : isAdmin
                ? 'Post your first announcement to keep members informed.'
                : 'Check back later for updates from your organization.'}
          </p>
          {isAdmin && !hasActiveFilters && (
            <button
              onClick={function() { setShowCreateModal(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Announcement
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              className="px-6 py-3 bg-transparent border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}
            role="list"
            aria-label="Announcements"
            aria-live="polite"
            aria-atomic="false"
          >
            {filteredAnnouncements.map(function(ann) {
              var expiryInfo = getExpiryInfo(ann.expires_at);
              var isSelected = selectedIds.indexOf(ann.id) !== -1;
              var isPinToggling = togglingPinId === ann.id;

              return (
                <div
                  key={ann.id}
                  role="listitem"
                  style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                >
                  {/* Per-card meta row: checkbox + NEW badge + pin toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '22px', paddingLeft: '2px', paddingRight: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={function() { toggleSelectId(ann.id); }}
                          style={{ width: '15px', height: '15px', accentColor: '#8B5CF6', cursor: 'pointer', flexShrink: 0 }}
                          aria-label={'Select: ' + ann.title}
                        />
                      )}
                      {!ann.is_read && (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#B45309', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', padding: '1px 7px', borderRadius: '99px', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.6 }}>
                          New
                        </span>
                      )}
                    </div>

                    {/* Pin toggle — admin only */}
                    {isAdmin && (
                      <button
                        onClick={function() { handlePinToggle(ann); }}
                        disabled={isPinToggling}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '2px 8px',
                          background: ann.is_pinned ? 'rgba(59,130,246,0.08)' : 'transparent',
                          border: '1px solid ' + (ann.is_pinned ? 'rgba(59,130,246,0.3)' : 'transparent'),
                          borderRadius: '99px',
                          color: ann.is_pinned ? '#1D4ED8' : '#94A3B8',
                          fontSize: '10px', fontWeight: 700,
                          cursor: isPinToggling ? 'not-allowed' : 'pointer',
                          opacity: isPinToggling ? 0.5 : 1,
                          letterSpacing: '0.3px'
                        }}
                        className="hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
                        aria-label={(ann.is_pinned ? 'Unpin: ' : 'Pin to top: ') + ann.title}
                        aria-pressed={ann.is_pinned}
                      >
                        <svg width="10" height="10" fill={ann.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {ann.is_pinned ? 'Pinned' : 'Pin'}
                      </button>
                    )}
                  </div>

                  {/* Card with unread yellow outline */}
                  <div style={{
                    borderRadius: '13px',
                    outline: !ann.is_read ? '2px solid rgba(245,183,49,0.4)' : '2px solid transparent',
                    outlineOffset: '1px'
                  }}>
                    <AnnouncementCard
                      announcement={ann}
                      onRead={handleAnnouncementRead}
                      onDelete={handleAnnouncementDelete}
                      isAdmin={isAdmin}
                      showOrganization={false}
                    />
                  </div>

                  {/* Expiry badge — only shown within 7 days */}
                  {expiryInfo && (
                    <div style={{ paddingLeft: '4px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        fontSize: '10px', fontWeight: 700,
                        color: expiryInfo.color,
                        background: expiryInfo.bg,
                        border: '1px solid ' + expiryInfo.border,
                        padding: '2px 8px', borderRadius: '99px'
                      }}>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {expiryInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ textAlign: 'center', color: SUBTITLE_COLOR, fontSize: '13px', marginTop: '24px' }} aria-live="polite">
            {'Showing ' + filteredAnnouncements.length + ' of ' + announcements.length + ' announcement' + (announcements.length !== 1 ? 's' : '')}
          </p>
        </>
      )}

      {/* Create modal */}
      <CreateAnnouncement
        isOpen={showCreateModal}
        onClose={function() { setShowCreateModal(false); }}
        onSuccess={handleAnnouncementCreated}
        organizationId={organizationId}
        organizationName={organization ? organization.name : 'Organization'}
      />
    </main>
  );
}

export default AnnouncementFeed;