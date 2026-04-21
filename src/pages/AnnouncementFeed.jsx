import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import AnnouncementCard from '../components/AnnouncementCard';
import CreateAnnouncement from '../components/CreateAnnouncement';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

function AnnouncementFeed() {
  var { organizationId } = useParams();
  var { isDark } = useTheme();

  var [announcements, setAnnouncements] = useState([]);
  var [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  var [organization, setOrganization] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [priorityFilter, setPriorityFilter] = useState('all');
  var [unreadCount, setUnreadCount] = useState(0);
  var [isAdmin, setIsAdmin] = useState(false);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [markingAllRead, setMarkingAllRead] = useState(false);

  // Theme tokens
  var pageBg       = isDark ? 'transparent' : 'transparent';
  var titleColor   = isDark ? '#FFFFFF' : '#111827';
  var subtitleColor = isDark ? '#94A3B8' : '#6B7280';
  var controlBg    = isDark ? '#1A2035' : '#FFFFFF';
  var controlBorder = isDark ? '#2A3550' : '#E5E7EB';
  var inputBg      = isDark ? '#0E1523' : '#F9FAFB';
  var inputBorder  = isDark ? '#2A3550' : '#D1D5DB';
  var inputColor   = isDark ? '#FFFFFF' : '#111827';
  var labelColor   = isDark ? '#CBD5E1' : '#374151';
  var skelBase     = isDark ? '#1E2845' : '#E5E7EB';

  useEffect(function () {
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
        setIsAdmin(memberRes.data?.role === 'admin');
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err.message);
      }
    }

    if (organizationId) fetchOrganization();
  }, [organizationId]);

  useEffect(function () {
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

        var processed = annRes.data.map(function (a) {
          return Object.assign({}, a, {
            is_read: a.announcement_reads?.some(function (r) { return r.member_id === user.id; }) || false
          });
        });

        var active = processed.filter(function (a) {
          return !a.expires_at || new Date(a.expires_at) > new Date();
        });

        setAnnouncements(active);
        setFilteredAnnouncements(active);
        setUnreadCount(active.filter(function (a) { return !a.is_read; }).length);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) fetchAnnouncements();
  }, [organizationId]);

  useEffect(function () {
    var filtered = announcements.slice();

    if (searchTerm.trim()) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function (a) {
        return a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term);
      });
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(function (a) { return a.priority === priorityFilter; });
    }

    filtered.sort(function (a, b) {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      var order = { urgent: 0, normal: 1, low: 2 };
      var diff = order[a.priority] - order[b.priority];
      if (diff !== 0) return diff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, priorityFilter]);

  function handleAnnouncementRead(announcementId) {
    setAnnouncements(function (prev) {
      return prev.map(function (a) {
        return a.id === announcementId ? Object.assign({}, a, { is_read: true }) : a;
      });
    });
    setUnreadCount(function (prev) { return Math.max(0, prev - 1); });
  }

  function handleAnnouncementDelete(announcementId) {
    setAnnouncements(function (prev) { return prev.filter(function (a) { return a.id !== announcementId; }); });
  }

  function handleAnnouncementCreated(newAnnouncement) {
    setAnnouncements(function (prev) {
      return [Object.assign({}, newAnnouncement, { is_read: false }), ...prev];
    });
    mascotSuccessToast('Announcement posted!', 'Your members will see it now.');
  }

  async function handleMarkAllAsRead() {
    var authRes = await supabase.auth.getUser();
    var user = authRes.data.user;
    if (!user) return;

    var unread = announcements.filter(function (a) { return !a.is_read; });
    if (unread.length === 0) { toast.error('All announcements are already read.'); return; }

    setMarkingAllRead(true);
    var loadingToast = toast.loading('Marking all as read...');

    try {
      var records = unread.map(function (a) { return { announcement_id: a.id, member_id: user.id }; });
      var res = await supabase.from('announcement_reads').insert(records);
      if (res.error) throw res.error;

      setAnnouncements(function (prev) {
        return prev.map(function (a) { return Object.assign({}, a, { is_read: true }); });
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ padding: '24px 32px' }} aria-label="Loading announcements">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ background: skelBase, borderRadius: '8px', height: '32px', width: '200px', marginBottom: '8px' }} aria-hidden="true" />
            <div style={{ background: skelBase, borderRadius: '6px', height: '16px', width: '140px' }} aria-hidden="true" />
          </div>
          <div style={{ background: skelBase, borderRadius: '8px', height: '44px', width: '190px' }} aria-hidden="true" />
        </div>
        <div style={{ background: controlBg, border: '1px solid ' + controlBorder, borderRadius: '12px', padding: '16px', marginBottom: '24px' }} aria-hidden="true">
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: skelBase, borderRadius: '8px', height: '40px', flex: 1 }} />
            <div style={{ background: skelBase, borderRadius: '8px', height: '40px', width: '160px' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map(function (n) {
            return (
              <div key={n} style={{ background: isDark ? '#1A2035' : '#EFF6FF', border: '1px solid ' + (isDark ? '#2A3550' : '#BFDBFE'), borderRadius: '12px', padding: '24px' }} aria-hidden="true">
                <div style={{ background: skelBase, borderRadius: '99px', height: '22px', width: '64px', marginBottom: '14px' }} />
                <div style={{ background: skelBase, borderRadius: '6px', height: '22px', width: '80%', marginBottom: '10px' }} />
                <div style={{ background: skelBase, borderRadius: '6px', height: '14px', width: '100%', marginBottom: '6px' }} />
                <div style={{ background: skelBase, borderRadius: '6px', height: '14px', width: '70%', marginBottom: '16px' }} />
                <div style={{ background: skelBase, borderRadius: '6px', height: '13px', width: '110px' }} />
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main style={{ padding: '24px 32px' }}>
        <div
          style={{ background: isDark ? '#1A2035' : '#FEF2F2', border: '1px solid #EF4444', borderRadius: '12px', padding: '48px 32px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}
          role="alert" aria-live="assertive"
        >
          <svg style={{ margin: '0 auto 16px', color: '#EF4444' }} width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p style={{ color: isDark ? '#FFFFFF' : '#111827', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Failed to Load Announcements</p>
          <p style={{ color: isDark ? '#94A3B8' : '#6B7280', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={function () { window.location.reload(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <main style={{ padding: '24px 32px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: titleColor, fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>Announcements</h1>
          <p style={{ color: subtitleColor, fontSize: '14px' }}>
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
            {unreadCount > 0 ? ' — ' + unreadCount + ' unread' : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={function () { setShowCreateModal(true); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
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

      {/* Controls */}
      <div
        style={{ background: controlBg, border: '1px solid ' + controlBorder, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}
        role="search"
        aria-label="Announcement filters"
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <label htmlFor="search-announcements" className="sr-only">Search announcements</label>
            <svg
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}
              width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-announcements"
              type="search"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={function (e) { setSearchTerm(e.target.value); }}
              style={{
                width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px',
                background: inputBg, border: '1px solid ' + inputBorder, borderRadius: '8px',
                color: inputColor, fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
              onFocus={function (e) { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.2)'; }}
              onBlur={function (e) { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="priority-filter" style={{ color: labelColor, fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Filter:
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={function (e) { setPriorityFilter(e.target.value); }}
              style={{ padding: '10px 12px', background: inputBg, border: '1px solid ' + inputBorder, borderRadius: '8px', color: inputColor, fontSize: '14px', cursor: 'pointer' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({announcements.length})</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px',
                background: isDark ? '#1B3A2F' : '#F0FDF4',
                border: '1px solid ' + (isDark ? '#22C55E' : '#86EFAC'),
                borderRadius: '8px', color: '#16A34A', fontSize: '14px', fontWeight: 600,
                cursor: markingAllRead ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                opacity: markingAllRead ? 0.6 : 1
              }}
              className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label={'Mark all ' + unreadCount + ' announcements as read'}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Announcements */}
      {filteredAnnouncements.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px', paddingBottom: '64px' }} role="region" aria-label="No announcements found">
          <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '220px', margin: '0 auto 24px' }} />
          <h2 style={{ color: titleColor, fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
            {searchTerm || priorityFilter !== 'all' ? 'No announcements match your filters' : 'No announcements yet'}
          </h2>
          <p style={{ color: subtitleColor, maxWidth: '380px', margin: '0 auto 32px' }}>
            {searchTerm || priorityFilter !== 'all'
              ? 'Try adjusting your search or clearing the filters.'
              : isAdmin ? 'Post your first announcement to keep members informed.'
              : 'Check back later for updates from your organization.'}
          </p>
          {isAdmin && !searchTerm && priorityFilter === 'all' && (
            <button
              onClick={function () { setShowCreateModal(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Announcement
            </button>
          )}
          {(searchTerm || priorityFilter !== 'all') && (
            <button
              onClick={function () { setSearchTerm(''); setPriorityFilter('all'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}
              className="px-6 py-3 bg-transparent border border-gray-400 text-gray-500 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}
            role="list"
            aria-label="Announcements"
            aria-live="polite"
            aria-atomic="false"
          >
            {filteredAnnouncements.map(function (announcement) {
              return (
                <div key={announcement.id} role="listitem">
                  <AnnouncementCard
                    announcement={announcement}
                    onRead={handleAnnouncementRead}
                    onDelete={handleAnnouncementDelete}
                    isAdmin={isAdmin}
                    showOrganization={false}
                  />
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: 'center', color: subtitleColor, fontSize: '13px', marginTop: '24px' }} aria-live="polite">
            Showing {filteredAnnouncements.length} of {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
          </p>
        </>
      )}

      {/* Create modal */}
      <CreateAnnouncement
        isOpen={showCreateModal}
        onClose={function () { setShowCreateModal(false); }}
        onSuccess={handleAnnouncementCreated}
        organizationId={organizationId}
        organizationName={organization?.name || 'Organization'}
      />
    </main>
  );
}

export default AnnouncementFeed;