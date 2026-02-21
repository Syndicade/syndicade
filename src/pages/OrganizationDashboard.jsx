import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';
import CreateEvent from '../components/CreateEvent';
import CreateAnnouncement from '../components/CreateAnnouncement';
import AnnouncementCard from '../components/AnnouncementCard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

// ── Icon primitive ────────────────────────────────────────────────────────────
function Icon({ path, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {Array.isArray(path)
        ? path.map((d, i) => (
            <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
          ))
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={path} />}
    </svg>
  );
}

const ICONS = {
  chart:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  members:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  building:  ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  folder:    'M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  photo:     ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  megaphone: ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  inbox:     ['M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'],
  mail:      ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  trendUp:   'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  settings:  ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clipboard: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  pencil:    ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  globe:     ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  clock:     ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  userPlus:  ['M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'],
  check:     'M5 13l4 4L19 7',
  trash:     ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:         'M6 18L18 6M6 6l12 12',
  location:  ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  video:     'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  shuffle:   ['M7 16V4m0 0L3 8m4-4l4 4', 'M17 8v12m0 0l4-4m-4 4l-4-4'],
  chevRight: 'M9 5l7 7-7 7',
  eye:       ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
};

// ── Toast system ──────────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite" aria-label="Notifications">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium min-w-64 max-w-sm ${
            t.type === 'error' ? 'bg-red-600' : t.type === 'warning' ? 'bg-yellow-600' : 'bg-green-600'
          }`}
          role="alert"
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="text-white/70 hover:text-white flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white rounded"
            aria-label="Dismiss notification"
          >
            <Icon path={ICONS.x} className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton cards ────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-200 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-300 rounded" />
          <div className="h-8 w-12 bg-gray-300 rounded" />
          <div className="h-3 w-20 bg-gray-300 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function OrganizationDashboard() {
  const { organizationId } = useParams();
  const navigate = useNavigate();

  // Core state
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingInvites: 0,
    activeEvents: 0,
    unreadAnnouncements: 0,
    totalGroups: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('admin');

  // Toast
  const [toasts, setToasts] = useState([]);
  function addToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }
  function removeToast(id) { setToasts(prev => prev.filter(t => t.id !== id)); }

  // Modals
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  // Recent activity
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [readActivityIds, setReadActivityIds] = useState(new Set());

  // Inbox
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [unreadInquiriesCount, setUnreadInquiriesCount] = useState(0);

  // Photos
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoError, setPhotoError] = useState(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Tabs — Groups, Members, Announcements removed; accessible via overview cards
  const allTabs = [
    { id: 'overview',   label: 'Overview',   iconKey: 'chart',    roles: ['admin', 'member'] },
    { id: 'documents',  label: 'Documents',  iconKey: 'folder',   roles: ['admin', 'member'] },
    { id: 'photos',     label: 'Photos',     iconKey: 'photo',    roles: ['admin', 'member'] },
    { id: 'inbox',      label: 'Inbox',      iconKey: 'inbox',    badge: unreadInquiriesCount, roles: ['admin'] },
    { id: 'invite',     label: 'Invite',     iconKey: 'mail',     roles: ['admin'] },
    { id: 'analytics',  label: 'Analytics',  iconKey: 'trendUp',  roles: ['admin'] },
    { id: 'settings',   label: 'Settings',   iconKey: 'settings', roles: ['admin'] },
  ];

  const effectiveRole = (membership?.role === 'admin' && viewMode === 'admin') ? 'admin' : 'member';
  const tabs = allTabs.filter(tab => tab.roles.includes(effectiveRole));

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, [organizationId]);
  useEffect(() => { if (activeTab === 'overview' && organizationId) fetchRecentActivity(); }, [activeTab, organizationId]);
  useEffect(() => { if (activeTab === 'inbox' && organizationId) fetchInquiries(); }, [activeTab, organizationId]);
  useEffect(() => { if (activeTab === 'photos' && organizationId) fetchPhotos(); }, [activeTab, organizationId]);

  // ── Data fetchers ────────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) { navigate('/login'); return; }
      setCurrentUserId(user.id);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      if (orgError) throw orgError;
      setOrganization(orgData);

      // Two-step membership check to avoid 400 from complex joins
      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('id, role, status, joined_date, member_id, organization_id')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membershipData) {
        setError('You are not a member of this organization.');
        setLoading(false);
        return;
      }
      setMembership(membershipData);
      await fetchStats(user.id);
      await fetchRecentActivity();

      if (membershipData.role === 'admin') {
        const { count } = await supabase
          .from('contact_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('is_read', false);
        setUnreadInquiriesCount(count || 0);
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats(userId) {
    try {
      const [
        { count: memberCount },
        { count: inviteCount },
        { count: eventCount },
        { count: groupCount },
        { data: allAnnouncements },
      ] = await Promise.all([
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active'),
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'pending'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).gte('start_time', new Date().toISOString()),
        supabase.from('org_groups').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true),
        supabase.from('announcements').select('id').eq('organization_id', organizationId),
      ]);

      const announcementIds = (allAnnouncements || []).map(a => a.id);
      let unreadCount = 0;
      if (announcementIds.length > 0 && userId) {
        const { data: reads } = await supabase
          .from('announcement_reads')
          .select('announcement_id')
          .eq('member_id', userId)
          .in('announcement_id', announcementIds);
        const readIds = new Set((reads || []).map(r => r.announcement_id));
        unreadCount = announcementIds.length - readIds.size;
      }

      setStats({
        totalMembers: memberCount || 0,
        pendingInvites: inviteCount || 0,
        activeEvents: eventCount || 0,
        unreadAnnouncements: unreadCount,
        totalGroups: groupCount || 0,
      });
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  }

  async function fetchRecentActivity() {
    try {
      setActivityLoading(true);
      const activities = [];

      // Events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_time, created_at, event_type')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (events) {
        events.forEach(ev =>
          activities.push({
            id: 'event-' + ev.id,
            type: 'event',
            title: 'New event: ' + ev.title,
            iconKey: ev.event_type === 'virtual' ? 'video' : ev.event_type === 'hybrid' ? 'shuffle' : 'location',
            timestamp: ev.created_at,
          })
        );
      }

      // Announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('id, title, created_at, priority')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (announcementsData) {
        announcementsData.forEach(a =>
          activities.push({
            id: 'announcement-' + a.id,
            type: 'announcement',
            title: a.title,
            iconKey: 'megaphone',
            timestamp: a.created_at,
          })
        );
      }

      // Members — two-step to avoid join 400 errors
      const { data: membershipRows } = await supabase
        .from('memberships')
        .select('id, created_at, member_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (membershipRows && membershipRows.length > 0) {
        const memberIds = membershipRows.map(m => m.member_id);
        const { data: profiles } = await supabase
          .from('members')
          .select('user_id, first_name, last_name')
          .in('user_id', memberIds);
        const profileMap = {};
        (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
        membershipRows.forEach(m => {
          const p = profileMap[m.member_id];
          if (p) {
            activities.push({
              id: 'member-' + m.id,
              type: 'member',
              title: p.first_name + ' ' + p.last_name + ' joined',
              iconKey: 'userPlus',
              timestamp: m.created_at,
            });
          }
        });
      }

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activities.slice(0, 10));
    } catch (err) {
      console.error('fetchRecentActivity error:', err);
    } finally {
      setActivityLoading(false);
    }
  }

  async function fetchInquiries() {
    try {
      setInquiriesLoading(true);
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInquiries(data || []);
      setUnreadInquiriesCount((data || []).filter(i => !i.is_read).length);
    } catch (err) {
      console.error('fetchInquiries error:', err);
    } finally {
      setInquiriesLoading(false);
    }
  }

  async function fetchPhotos() {
    try {
      setPhotosLoading(true);
      const { data, error } = await supabase
        .from('org_photos')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error('fetchPhotos error:', err);
    } finally {
      setPhotosLoading(false);
    }
  }

  // ── Activity actions ─────────────────────────────────────────────────────────
  function handleMarkActivityRead(activityId) {
    setReadActivityIds(prev => new Set([...prev, activityId]));
  }

  function handleMarkAllActivityRead() {
    setReadActivityIds(new Set(recentActivity.map(a => a.id)));
    addToast('All activity marked as read.');
  }

  function handleDismissActivity(activityId) {
    setRecentActivity(prev => prev.filter(a => a.id !== activityId));
  }

  function handleDismissAllActivity() {
    setRecentActivity([]);
    addToast('Activity feed cleared.');
  }

  // ── Inquiry actions ──────────────────────────────────────────────────────────
  async function handleMarkInquiryRead(inquiryId) {
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ is_read: true })
        .eq('id', inquiryId);
      if (error) throw error;
      setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, is_read: true } : i));
      setUnreadInquiriesCount(prev => Math.max(0, prev - 1));
      addToast('Message marked as read.');
    } catch (err) {
      addToast('Could not mark as read.', 'error');
    }
  }

  async function handleDeleteInquiry(inquiryId) {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('contact_inquiries').delete().eq('id', inquiryId);
      if (error) throw error;
      const deleted = inquiries.find(i => i.id === inquiryId);
      setInquiries(prev => prev.filter(i => i.id !== inquiryId));
      if (deleted && !deleted.is_read) setUnreadInquiriesCount(prev => Math.max(0, prev - 1));
      addToast('Message deleted.');
    } catch (err) {
      addToast('Could not delete message.', 'error');
    }
  }

  // ── Photo actions ────────────────────────────────────────────────────────────
  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) { setPhotoError('Only JPG, PNG, GIF, and WebP images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5MB.'); return; }
    try {
      setPhotoUploading(true);
      setPhotoError(null);
      const ext = file.name.split('.').pop();
      const fileName = organizationId + '/' + Date.now() + '.' + ext;
      const { error: uploadError } = await supabase.storage
        .from('organization-images')
        .upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('organization-images').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('org_photos').insert({
        organization_id: organizationId,
        uploaded_by: currentUserId,
        photo_url: urlData.publicUrl,
        caption: photoCaption.trim() || null,
      });
      if (insertError) throw insertError;
      setPhotoCaption('');
      e.target.value = '';
      await fetchPhotos();
      addToast('Photo uploaded successfully.');
    } catch (err) {
      console.error('Photo upload error:', err);
      setPhotoError('Upload failed: ' + err.message);
      addToast('Photo upload failed.', 'error');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleDeletePhoto(photo) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    try {
      setDeletingPhotoId(photo.id);
      const urlParts = photo.photo_url.split('/organization-images/');
      if (urlParts.length === 2) {
        await supabase.storage.from('organization-images').remove([urlParts[1]]);
      }
      const { error } = await supabase.from('org_photos').delete().eq('id', photo.id);
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      addToast('Photo deleted.');
    } catch (err) {
      addToast('Could not delete photo: ' + err.message, 'error');
    } finally {
      setDeletingPhotoId(null);
    }
  }

  // ── Event / announcement callbacks ───────────────────────────────────────────
  async function handleEventCreated() {
    await fetchStats(currentUserId);
    addToast('Event created successfully.');
  }

  async function handleAnnouncementCreated() {
    await fetchStats(currentUserId);
    addToast('Announcement created.');
  }

  // ── Avatar color ─────────────────────────────────────────────────────────────
  function getAvatarColor(name) {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[(name || 'A').charCodeAt(0) % colors.length];
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Icon path={ICONS.building} className="h-16 w-16 text-gray-300" strokeWidth={1} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/organizations')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Org Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {organization.logo_url && (
                <img
                  src={organization.logo_url}
                  alt={organization.name + ' logo'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-600 mt-1">{organization.description}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                    {organization.type}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {membership.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
              </div>
            </div>
            {membership?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <span className={'text-sm font-medium ' + (viewMode === 'admin' ? 'text-purple-700' : 'text-gray-400')}>
                  Admin View
                </span>
                <button
                  onClick={() => setViewMode(viewMode === 'admin' ? 'member' : 'admin')}
                  className={'relative inline-flex h-8 w-14 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors ' +
                    (viewMode === 'member' ? 'bg-blue-600' : 'bg-purple-600')}
                  role="switch"
                  aria-checked={viewMode === 'admin'}
                  aria-label="Toggle between admin and member view"
                >
                  <span className={'inline-block h-6 w-6 transform rounded-full bg-white transition-transform ' +
                    (viewMode === 'admin' ? 'translate-x-1' : 'translate-x-7')} />
                </button>
                <span className={'text-sm font-medium ' + (viewMode === 'member' ? 'text-blue-700' : 'text-gray-400')}>
                  Member View
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            {/* Custom thin scrollbar via inline style */}
            <nav
              className="flex px-4 overflow-x-auto"
              aria-label="Organization tabs"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    'flex-shrink-0 py-4 px-5 border-b-2 font-medium text-sm transition-all relative inline-flex items-center gap-2 ' +
                    (activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
                  }
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon path={ICONS[tab.iconKey]} className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full"
                      aria-label={tab.badge + ' unread'}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <button
                    onClick={() => navigate('/organizations/' + organizationId + '/members')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Members</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalMembers}</p>
                        <p className="text-xs text-blue-700 mt-1">Click to view directory</p>
                      </div>
                      <Icon path={ICONS.members} className="h-10 w-10 text-blue-300" strokeWidth={1.5} />
                    </div>
                  </button>

                  {effectiveRole === 'admin' && (
                    <button
                      onClick={() => setActiveTab('invite')}
                      className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-semibold uppercase tracking-wide">Pending Invites</p>
                          <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingInvites}</p>
                          <p className="text-xs text-yellow-700 mt-1">{stats.pendingInvites === 0 ? 'All caught up!' : 'Click to manage'}</p>
                        </div>
                        <Icon path={ICONS.mail} className="h-10 w-10 text-yellow-300" strokeWidth={1.5} />
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/organizations/' + organizationId + '/events')}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Upcoming Events</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">{stats.activeEvents}</p>
                        <p className="text-xs text-green-700 mt-1">Click to view calendar</p>
                      </div>
                      <Icon path={ICONS.calendar} className="h-10 w-10 text-green-300" strokeWidth={1.5} />
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/organizations/' + organizationId + '/announcements')}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-semibold uppercase tracking-wide">Unread News</p>
                        <p className="text-3xl font-bold text-orange-900 mt-2">{stats.unreadAnnouncements}</p>
                        <p className="text-xs text-orange-700 mt-1">{stats.unreadAnnouncements === 0 ? 'All caught up!' : 'Click to read'}</p>
                      </div>
                      <Icon path={ICONS.megaphone} className="h-10 w-10 text-orange-300" strokeWidth={1.5} />
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/organizations/' + organizationId + '/groups')}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Groups</p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalGroups}</p>
                        <p className="text-xs text-purple-700 mt-1">Click to view all</p>
                      </div>
                      <Icon path={ICONS.building} className="h-10 w-10 text-purple-300" strokeWidth={1.5} />
                    </div>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon path={ICONS.calendar} className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Create Event</span>
                    </button>

                    {effectiveRole === 'admin' && (
                      <button
                        onClick={() => setShowCreateAnnouncement(true)}
                        className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Icon path={ICONS.megaphone} className="h-6 w-6 text-orange-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">Create Announcement</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/members')}
                      className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon path={ICONS.members} className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Member Directory</span>
                    </button>

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/scheduling')}
                      className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon path={ICONS.clock} className="h-6 w-6 text-teal-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Group Scheduling</span>
                    </button>

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/polls')}
                      className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon path={ICONS.chart} className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Polls</span>
                    </button>

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/surveys')}
                      className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon path={ICONS.clipboard} className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Surveys</span>
                    </button>

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/signup-forms')}
                      className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Icon path={ICONS.pencil} className="h-6 w-6 text-indigo-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Sign-Up Forms</span>
                    </button>

                    {effectiveRole === 'admin' && (
                      <button
                        onClick={() => navigate('/organizations/' + organizationId + '/page-editor')}
                        className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Icon path={ICONS.globe} className="h-6 w-6 text-gray-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">Edit Public Page</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                    <div className="flex items-center gap-2">
                      {recentActivity.length > 0 && (
                        <>
                          <button
                            onClick={handleMarkAllActivityRead}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 border border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            Mark All Read
                          </button>
                          <button
                            onClick={handleDismissAllActivity}
                            className="text-xs text-gray-500 hover:text-red-600 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 rounded px-2 py-1 border border-gray-200 hover:bg-red-50 transition-colors"
                          >
                            Clear All
                          </button>
                        </>
                      )}
                      <button
                        onClick={fetchRecentActivity}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 rounded px-2 py-1 border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {activityLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                          <div className="w-5 h-5 bg-gray-200 rounded mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-10">
                      <Icon path={ICONS.clock} className="h-10 w-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-gray-500 text-sm font-medium">No recent activity</p>
                      <p className="text-gray-400 text-xs mt-1">Activity from events, announcements, and members will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2" role="list" aria-label="Recent activity">
                      {recentActivity.map(activity => {
                        const isRead = readActivityIds.has(activity.id);
                        return (
                          <div
                            key={activity.id}
                            role="listitem"
                            className={'flex items-start gap-3 p-3 rounded-lg transition-colors group ' + (isRead ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100')}
                          >
                            <div className={'mt-0.5 flex-shrink-0 ' + (isRead ? 'text-gray-400' : 'text-blue-500')}>
                              <Icon path={ICONS[activity.iconKey] || ICONS.clock} className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={'text-sm font-medium ' + (isRead ? 'text-gray-600' : 'text-gray-900')}>
                                {activity.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                              {!isRead && (
                                <button
                                  onClick={() => handleMarkActivityRead(activity.id)}
                                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  aria-label="Mark as read"
                                  title="Mark as read"
                                >
                                  <Icon path={ICONS.check} className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDismissActivity(activity.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                                aria-label="Dismiss activity"
                                title="Dismiss"
                              >
                                <Icon path={ICONS.x} className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Document Library</h2>
                      <p className="text-gray-600 mt-1">Access organization documents, files, and resources</p>
                    </div>
                    {effectiveRole === 'admin' && (
                      <button
                        onClick={() => navigate('/organizations/' + organizationId + '/documents')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-semibold"
                      >
                        Manage Documents
                      </button>
                    )}
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/documents')}
                      className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      View All Documents
                      <Icon path={ICONS.chevRight} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PHOTOS TAB ── */}
            {activeTab === 'photos' && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Photo Gallery</h2>
                    <p className="text-gray-600 mt-1">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {effectiveRole === 'admin' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                    <h3 className="text-base font-bold text-blue-900 mb-4">Upload Photo</h3>
                    {photoError && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
                        {photoError}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label htmlFor="photo-caption" className="sr-only">Photo caption</label>
                        <input
                          id="photo-caption"
                          type="text"
                          placeholder="Caption (optional)"
                          value={photoCaption}
                          onChange={e => setPhotoCaption(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          maxLength={200}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="photo-upload"
                          className={'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors focus-within:ring-2 focus-within:ring-blue-500 ' +
                            (photoUploading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')}
                        >
                          {photoUploading ? 'Uploading...' : 'Upload Photo'}
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handlePhotoUpload}
                            disabled={photoUploading}
                            className="sr-only"
                            aria-label="Choose a photo to upload"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP · Max 5MB</p>
                      </div>
                    </div>
                  </div>
                )}

                {photosLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="rounded-lg bg-gray-200 animate-pulse h-40" />
                    ))}
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <Icon path={ICONS.photo} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No photos yet</h3>
                    <p className="text-gray-500 text-sm">
                      {effectiveRole === 'admin'
                        ? 'Upload your first photo using the panel above.'
                        : 'No photos have been uploaded yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-label="Photo gallery">
                    {photos.map(photo => (
                      <div
                        key={photo.id}
                        role="listitem"
                        className="relative group rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => setLightboxPhoto(photo)}
                          className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                          aria-label={'View photo' + (photo.caption ? ': ' + photo.caption : '')}
                        >
                          <img
                            src={photo.photo_url}
                            alt={photo.caption || 'Organization photo'}
                            className="w-full h-40 object-cover"
                            loading="lazy"
                          />
                        </button>
                        {photo.caption && (
                          <div className="px-2 py-1.5 bg-white">
                            <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
                          </div>
                        )}
                        {effectiveRole === 'admin' && (
                          <button
                            onClick={() => handleDeletePhoto(photo)}
                            disabled={deletingPhotoId === photo.id}
                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                            aria-label={'Delete photo' + (photo.caption ? ': ' + photo.caption : '')}
                          >
                            <Icon path={ICONS.x} className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {lightboxPhoto && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Photo viewer"
                    onClick={() => setLightboxPhoto(null)}
                  >
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setLightboxPhoto(null)}
                        className="absolute -top-10 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded"
                        aria-label="Close photo viewer"
                      >
                        <Icon path={ICONS.x} className="h-7 w-7" strokeWidth={2.5} />
                      </button>
                      <img
                        src={lightboxPhoto.photo_url}
                        alt={lightboxPhoto.caption || 'Organization photo'}
                        className="w-full max-h-screen object-contain rounded-lg"
                      />
                      {lightboxPhoto.caption && (
                        <p className="text-white text-center mt-3 text-sm">{lightboxPhoto.caption}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── INBOX TAB ── */}
            {activeTab === 'inbox' && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
                    <p className="text-gray-600 mt-1">Messages submitted via the public Join Us form</p>
                  </div>
                  {inquiries.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {inquiries.filter(i => !i.is_read).length} unread &middot; {inquiries.length} total
                    </span>
                  )}
                </div>

                {inquiriesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 p-5 animate-pulse">
                        <div className="flex justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 rounded w-1/4" />
                            <div className="h-3 bg-gray-200 rounded w-full mt-3" />
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="h-8 w-24 bg-gray-200 rounded" />
                            <div className="h-8 w-24 bg-gray-200 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-center mb-4">
                      <Icon path={ICONS.inbox} className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No messages yet</h3>
                    <p className="text-gray-500 text-sm">Messages submitted via your public page will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4" role="list" aria-label="Contact inquiries">
                    {inquiries.map(inquiry => (
                      <div
                        key={inquiry.id}
                        role="listitem"
                        className={'rounded-lg border p-5 transition-all ' + (inquiry.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-300')}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-gray-900">{inquiry.name}</span>
                              {!inquiry.is_read && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">New</span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <a
                              href={'mailto:' + inquiry.email}
                              className="text-blue-600 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            >
                              {inquiry.email}
                            </a>
                            <p className="text-gray-700 mt-3 leading-relaxed">{inquiry.message}</p>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {!inquiry.is_read && (
                              <button
                                onClick={() => handleMarkInquiryRead(inquiry.id)}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all whitespace-nowrap"
                              >
                                Mark Read
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInquiry(inquiry.id)}
                              className="px-3 py-1.5 text-sm bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all whitespace-nowrap"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── INVITE TAB ── */}
            {activeTab === 'invite' && (
              <>
                {membership.role === 'admin' || organization.settings?.allowMemberInvites ? (
                  <InviteMember
                    organizationId={organizationId}
                    organizationName={organization.name}
                    onInviteSent={() => fetchStats(currentUserId)}
                  />
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <Icon path={ICONS.mail} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Permission Required</h3>
                    <p className="text-gray-500 text-sm">Member invitations are disabled. Contact an admin to enable this feature.</p>
                  </div>
                )}
              </>
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'analytics' && <AnalyticsDashboard organizationId={organizationId} />}

            {/* ── SETTINGS TAB ── */}
            {activeTab === 'settings' && (
              <>
                {membership.role === 'admin' ? (
                  <OrganizationSettings
                    organizationId={organizationId}
                    onUpdate={updatedData => setOrganization(prev => ({ ...prev, ...updatedData }))}
                  />
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                    <Icon path={ICONS.settings} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Admin Access Required</h3>
                    <p className="text-gray-500 text-sm">Only organization admins can modify settings.</p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSuccess={handleEventCreated}
        organizationId={organizationId}
        organizationName={organization?.name || 'Your Organization'}
      />
      <CreateAnnouncement
        isOpen={showCreateAnnouncement}
        onClose={() => setShowCreateAnnouncement(false)}
        onSuccess={handleAnnouncementCreated}
        organizationId={organizationId}
        organizationName={organization?.name || 'Your Organization'}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default OrganizationDashboard;