import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';
import CreateEvent from '../components/CreateEvent';
import CreateAnnouncement from '../components/CreateAnnouncement';
import AnnouncementCard from '../components/AnnouncementCard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

function OrganizationDashboard() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingInvites: 0,
    activeEvents: 0,
    unreadAnnouncements: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [viewMode, setViewMode] = useState('admin');

  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Inbox state
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [unreadInquiriesCount, setUnreadInquiriesCount] = useState(0);

  // Define all available tabs
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: '📊', roles: ['admin', 'member'] },
    { id: 'members', label: 'Members', icon: '👥', roles: ['admin', 'member'] },
    { id: 'documents', label: 'Documents', icon: '📁', roles: ['admin', 'member'] },
    { id: 'announcements', label: 'Announcements', icon: '📢', badge: stats.unreadAnnouncements, roles: ['admin', 'member'] },
    { id: 'inbox', label: 'Inbox', icon: '📬', badge: unreadInquiriesCount, roles: ['admin'] },
    { id: 'invite', label: 'Invite', icon: '✉️', roles: ['admin'] },
    { id: 'analytics', label: 'Analytics', icon: '📈', roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: '⚙️', roles: ['admin'] }
  ];

  const effectiveRole = (membership?.role === 'admin' && viewMode === 'admin')
    ? 'admin'
    : 'member';

  const tabs = allTabs.filter(tab => tab.roles.includes(effectiveRole));

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  useEffect(() => {
    if (activeTab === 'announcements' && currentUserId) {
      fetchAnnouncements();
    }
  }, [activeTab, organizationId, currentUserId]);

  useEffect(() => {
    if (activeTab === 'overview' && organizationId) {
      fetchRecentActivity();
    }
  }, [activeTab, organizationId]);

  useEffect(() => {
    if (activeTab === 'inbox' && organizationId) {
      fetchInquiries();
    }
  }, [activeTab, organizationId]);

  async function fetchData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      const { data: membershipData, error: membershipError } = await supabase
        .from('memberships')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .single();

      if (membershipError) {
        setError('You are not a member of this organization');
        setLoading(false);
        return;
      }

      setMembership(membershipData);
      await fetchStats(user.id);
      await fetchRecentActivity();

      // Fetch unread inquiry count for badge
      if (membershipData.role === 'admin') {
        const { count } = await supabase
          .from('contact_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('is_read', false);
        setUnreadInquiriesCount(count || 0);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      console.error('Error fetching inquiries:', err);
    } finally {
      setInquiriesLoading(false);
    }
  }

  async function handleMarkInquiryRead(inquiryId) {
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ is_read: true })
        .eq('id', inquiryId);

      if (error) throw error;

      setInquiries(prev =>
        prev.map(i => i.id === inquiryId ? { ...i, is_read: true } : i)
      );
      setUnreadInquiriesCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking inquiry as read:', err);
    }
  }

  async function handleDeleteInquiry(inquiryId) {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .delete()
        .eq('id', inquiryId);

      if (error) throw error;

      const deleted = inquiries.find(i => i.id === inquiryId);
      setInquiries(prev => prev.filter(i => i.id !== inquiryId));
      if (deleted && !deleted.is_read) {
        setUnreadInquiriesCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting inquiry:', err);
    }
  }

  async function fetchStats(userId) {
    try {
      const { count: memberCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const { count: inviteCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending');

      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('start_time', new Date().toISOString());

      const { data: allAnnouncements } = await supabase
        .from('announcements')
        .select('id')
        .eq('organization_id', organizationId);

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
        unreadAnnouncements: unreadCount
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  async function fetchRecentActivity() {
    try {
      setActivityLoading(true);
      const activities = [];

      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_time, created_at, event_type')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (events) {
        events.forEach(event => {
          activities.push({
            id: 'event-' + event.id,
            type: 'event',
            title: 'New event: ' + event.title,
            icon: event.event_type === 'in_person' ? '📍' : event.event_type === 'virtual' ? '💻' : '🔀',
            timestamp: event.created_at,
            color: 'green'
          });
        });
      }

      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('id, title, created_at, priority')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementsData) {
        announcementsData.forEach(announcement => {
          activities.push({
            id: 'announcement-' + announcement.id,
            type: 'announcement',
            title: announcement.title,
            icon: announcement.priority === 'urgent' ? '🚨' : '📢',
            timestamp: announcement.created_at,
            color: announcement.priority === 'urgent' ? 'red' : 'purple'
          });
        });
      }

      const { data: newMembers } = await supabase
        .from('memberships')
        .select('id, created_at, members!inner(first_name, last_name)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (newMembers) {
        newMembers.forEach(membership => {
          activities.push({
            id: 'member-' + membership.id,
            type: 'member',
            title: membership.members.first_name + ' ' + membership.members.last_name + ' joined',
            icon: '👋',
            timestamp: membership.created_at,
            color: 'blue'
          });
        });
      }

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activities.slice(0, 10));

    } catch (err) {
      console.error('Error fetching recent activity:', err);
    } finally {
      setActivityLoading(false);
    }
  }

  async function fetchAnnouncements() {
    try {
      setAnnouncementsLoading(true);

      const { data, error } = await supabase
        .from('announcements')
        .select('*, announcement_reads!left(id, member_id)')
        .eq('organization_id', organizationId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedAnnouncements = (data || []).map(announcement => ({
        ...announcement,
        is_read: announcement.announcement_reads?.some(
          read => read.member_id === currentUserId
        ) || false
      }));

      setAnnouncements(processedAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setAnnouncementsLoading(false);
    }
  }

  async function handleEventCreated(newEvent) {
    await fetchStats(currentUserId);
  }

  async function handleAnnouncementCreated(newAnnouncement) {
    setAnnouncements(prev => [{ ...newAnnouncement, is_read: false }, ...prev]);
    await fetchStats(currentUserId);
  }

  async function handleAnnouncementRead(announcementId) {
    setAnnouncements(prev =>
      prev.map(a => a.id === announcementId ? { ...a, is_read: true } : a)
    );
    setStats(prev => ({
      ...prev,
      unreadAnnouncements: Math.max(0, prev.unreadAnnouncements - 1)
    }));
  }

  async function handleAnnouncementDelete(announcementId) {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    await fetchStats(currentUserId);
  }

  async function handleMarkAllAsRead() {
    if (!currentUserId) return;
    const unreadAnnouncements = announcements.filter(a => !a.is_read);
    if (unreadAnnouncements.length === 0) return;

    try {
      const readsToInsert = unreadAnnouncements.map(a => ({
        announcement_id: a.id,
        member_id: currentUserId
      }));

      const { error } = await supabase
        .from('announcement_reads')
        .insert(readsToInsert);

      if (error && error.code !== '23505') throw error;

      setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
      setStats(prev => ({ ...prev, unreadAnnouncements: 0 }));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcementSearch === '' ||
      announcement.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      announcement.content.toLowerCase().includes(announcementSearch.toLowerCase());
    const matchesPriority = announcementFilter === 'all' ||
      announcement.priority === announcementFilter;
    const isExpired = announcement.expires_at &&
      new Date(announcement.expires_at) < new Date();
    return matchesSearch && matchesPriority && !isExpired;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" role="status" aria-label="Loading dashboard">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <p className="text-red-800 font-semibold text-lg">Access Denied</p>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => navigate('/organizations')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            ← Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                    {organization.type}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {membership.role === 'admin' ? '👑 Admin' : '👤 Member'}
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode Toggle - Admin Only */}
            {membership?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <span className={'text-sm font-medium ' + (viewMode === 'admin' ? 'text-purple-700' : 'text-gray-500')}>
                  Admin View
                </span>
                <button
                  onClick={() => setViewMode(viewMode === 'admin' ? 'member' : 'admin')}
                  className={'relative inline-flex h-8 w-14 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors ' + (viewMode === 'member' ? 'bg-blue-600' : 'bg-purple-600')}
                  role="switch"
                  aria-checked={viewMode === 'admin'}
                  aria-label="Toggle between admin and member view"
                >
                  <span className={'inline-block h-6 w-6 transform rounded-full bg-white transition-transform ' + (viewMode === 'admin' ? 'translate-x-1' : 'translate-x-7')} />
                </button>
                <span className={'text-sm font-medium ' + (viewMode === 'member' ? 'text-blue-700' : 'text-gray-500')}>
                  Member View
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Organization tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={'py-4 px-1 border-b-2 font-medium text-sm transition-all relative whitespace-nowrap ' + (activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span className="ml-1">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span
                      className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full"
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

            {/* ── INBOX TAB ── */}
            {activeTab === 'inbox' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">📬 Inbox</h2>
                    <p className="text-gray-600 mt-1">
                      Messages submitted via the public Join Us form
                    </p>
                  </div>
                  {inquiries.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {inquiries.filter(i => !i.is_read).length} unread · {inquiries.length} total
                    </span>
                  )}
                </div>

                {inquiriesLoading ? (
                  <div className="flex justify-center items-center py-12" role="status" aria-label="Loading messages">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" aria-hidden="true"></div>
                    <span className="sr-only">Loading messages...</span>
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <p className="text-5xl mb-4" aria-hidden="true">📭</p>
                    <p className="text-gray-600 font-semibold text-lg">No messages yet</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Messages submitted via your public page will appear here.
                    </p>
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
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                        href={'mailto:' + inquiry.email}
                              className="text-blue-600 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                              aria-label={'Email ' + inquiry.name + ' at ' + inquiry.email}
                            >
                              {inquiry.email}
                            <p className="text-gray-700 mt-3 leading-relaxed">{inquiry.message}</p>
                          </div>

                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {!inquiry.is_read && (
                              <button
                                onClick={() => handleMarkInquiryRead(inquiry.id)}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all whitespace-nowrap"
                                aria-label={'Mark message from ' + inquiry.name + ' as read'}
                              >
                                ✓ Mark Read
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInquiry(inquiry.id)}
                              className="px-3 py-1.5 text-sm bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all whitespace-nowrap"
                              aria-label={'Delete message from ' + inquiry.name}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <button
                    onClick={() => setActiveTab('members')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={'View ' + stats.totalMembers + ' total members'}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Members</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalMembers}</p>
                        <p className="text-xs text-blue-700 mt-1">Click to view directory</p>
                      </div>
                      <div className="text-4xl" aria-hidden="true">👥</div>
                    </div>
                  </button>

                  {effectiveRole === 'admin' && (
                    <button
                      onClick={() => setActiveTab('invite')}
                      className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                      aria-label={'Manage ' + stats.pendingInvites + ' pending invitations'}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-semibold uppercase tracking-wide">Pending Invites</p>
                          <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingInvites}</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            {stats.pendingInvites === 0 ? 'All caught up!' : 'Click to manage'}
                          </p>
                        </div>
                        <div className="text-4xl" aria-hidden="true">✉️</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/organizations/' + organizationId + '/events')}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    aria-label={'View ' + stats.activeEvents + ' upcoming events'}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Upcoming Events</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">{stats.activeEvents}</p>
                        <p className="text-xs text-green-700 mt-1">Click to view calendar</p>
                      </div>
                      <div className="text-4xl" aria-hidden="true">📅</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    aria-label={'Read ' + stats.unreadAnnouncements + ' unread announcements'}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-semibold uppercase tracking-wide">Unread News</p>
                        <p className="text-3xl font-bold text-orange-900 mt-2">{stats.unreadAnnouncements}</p>
                        <p className="text-xs text-orange-700 mt-1">
                          {stats.unreadAnnouncements === 0 ? 'All caught up!' : 'Click to read'}
                        </p>
                      </div>
                      <div className="text-4xl" aria-hidden="true">📢</div>
                    </div>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">📅</span>
                      <span className="font-semibold text-gray-900">Create Event</span>
                    </button>

                    {effectiveRole === 'admin' && (
                      <button
                        onClick={() => setShowCreateAnnouncement(true)}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">📢</span>
                        <span className="font-semibold text-gray-900">Create Announcement</span>
                      </button>
                    )}

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/members')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">👥</span>
                      <span className="font-semibold text-gray-900">View Member Directory</span>
                    </button>

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/polls')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">📊</span>
                     <span className="font-semibold text-gray-900">Polls</span>
                    </button>

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/surveys')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">📋</span>
                      <span className="font-semibold text-gray-900">Surveys</span>
                    </button>

                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/signup-forms')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="View sign-up forms"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">📝</span>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">Sign-Up Forms</div>
                        <div className="text-sm text-gray-600">Volunteer lists & time slots</div>
                      </div>
                    </button>

                    {effectiveRole === 'admin' && (
                      <button
                        onClick={() => navigate('/organizations/' + organizationId + '/page-editor')}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Edit public page"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">🌐</span>
                        <span className="font-semibold text-gray-900">Edit Public Page</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-2xl" aria-hidden="true">📊</span>
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => fetchRecentActivity()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      aria-label="Refresh activity feed"
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  {activityLoading ? (
                    <div className="flex justify-center items-center py-8" role="status">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
                      <span className="sr-only">Loading activity...</span>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="text-2xl flex-shrink-0" aria-hidden="true">
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric',
                                hour: 'numeric', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Members</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-3" aria-hidden="true">👥</div>
                  <p className="text-gray-600">Member management coming in next phase!</p>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">📁 Document Library</h2>
                      <p className="text-gray-600 mt-1">Access organization documents, files, and resources</p>
                    </div>
                    {effectiveRole === 'admin' && (
                      <button
                        onClick={() => navigate('/organizations/' + organizationId + '/documents')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        📂 Manage Documents
                      </button>
                    )}
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigate('/organizations/' + organizationId + '/documents')}
                      className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      View All Documents <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">📢 Announcements</h2>
                  {effectiveRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setShowCreateAnnouncement(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all font-semibold"
                    >
                      ➕ Create Announcement
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Search announcements..."
                      value={announcementSearch}
                      onChange={(e) => setAnnouncementSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Search announcements"
                    />
                  </div>
                  <select
                    value={announcementFilter}
                    onChange={(e) => setAnnouncementFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter by priority"
                  >
                    <option value="all">All ({announcements.length})</option>
                    <option value="urgent">🚨 Urgent</option>
                    <option value="normal">ℹ️ Normal</option>
                    <option value="low">📋 Low</option>
                  </select>
                  {stats.unreadAnnouncements > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all whitespace-nowrap"
                    >
                      Mark All Read ({stats.unreadAnnouncements})
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Showing {filteredAnnouncements.length} of {announcements.length} announcements
                </p>

                {announcementsLoading ? (
                  <div className="flex justify-center items-center py-12" role="status">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
                    <span className="sr-only">Loading announcements...</span>
                  </div>
                ) : filteredAnnouncements.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <div className="text-4xl mb-3" aria-hidden="true">
                      {announcementSearch || announcementFilter !== 'all' ? '🔍' : '📭'}
                    </div>
                    <p className="text-gray-600 font-semibold">
                      {announcementSearch || announcementFilter !== 'all'
                        ? 'No announcements match your filters'
                        : 'No announcements yet'}
                    </p>
                    {!announcementSearch && announcementFilter === 'all' && effectiveRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setShowCreateAnnouncement(true)}
                        className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        Create First Announcement
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAnnouncements.map((announcement) => (
                      <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        onRead={handleAnnouncementRead}
                        onDelete={handleAnnouncementDelete}
                        isAdmin={effectiveRole === 'admin'}
                        showOrganization={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invite' && (
              <>
                {membership.role === 'admin' || organization.settings?.allowMemberInvites ? (
                  <InviteMember
                    organizationId={organizationId}
                    organizationName={organization.name}
                    onInviteSent={() => fetchStats(currentUserId)}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" role="alert">
                    <p className="text-yellow-800 font-semibold">Permission Required</p>
                    <p className="text-yellow-700">
                      Member invitations are disabled. Contact an admin to enable this feature.
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard organizationId={organizationId} />
            )}  
            {activeTab === 'settings' && (
              <>
                {membership.role === 'admin' ? (
                  <OrganizationSettings
                    organizationId={organizationId}
                    onUpdate={(updatedData) => {
                      setOrganization(prev => ({ ...prev, ...updatedData }));
                    }}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" role="alert">
                    <p className="text-yellow-800 font-semibold">Admin Access Required</p>
                    <p className="text-yellow-700">Only organization admins can modify settings.</p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

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
    </div>
  );
}

export default OrganizationDashboard;