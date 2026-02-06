import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';
import CreateEvent from '../components/CreateEvent';
import CreateAnnouncement from '../components/CreateAnnouncement';
import AnnouncementCard from '../components/AnnouncementCard';

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

  // Define all available tabs
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: '📊', roles: ['admin', 'member'] },
    { id: 'members', label: 'Members', icon: '👥', roles: ['admin', 'member'] },
    { id: 'documents', label: 'Documents', icon: '📁', roles: ['admin', 'member'] },
    { id: 'announcements', label: 'Announcements', icon: '📢', badge: stats.unreadAnnouncements, roles: ['admin', 'member'] },
    { id: 'invite', label: 'Invite', icon: '✉️', roles: ['admin'] }, // Admin only
    { id: 'settings', label: 'Settings', icon: '⚙️', roles: ['admin'] } // Admin only
  ];

  // Determine effective role based on view mode
  const effectiveRole = (membership?.role === 'admin' && viewMode === 'admin')
    ? 'admin' 
    : 'member';

  // Filter tabs based on effective role
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

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

      // Fetch recent events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_time, created_at, event_type')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (events) {
        events.forEach(event => {
          activities.push({
            id: `event-${event.id}`,
            type: 'event',
            title: `New event: ${event.title}`,
            icon: event.event_type === 'in_person' ? '📍' : event.event_type === 'virtual' ? '💻' : '🔀',
            timestamp: event.created_at,
            color: 'green'
          });
        });
      }

      // Fetch recent announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('id, title, created_at, priority')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementsData) {
        announcementsData.forEach(announcement => {
          activities.push({
            id: `announcement-${announcement.id}`,
            type: 'announcement',
            title: announcement.title,
            icon: announcement.priority === 'urgent' ? '🚨' : '📢',
            timestamp: announcement.created_at,
            color: announcement.priority === 'urgent' ? 'red' : 'purple'
          });
        });
      }

      // Fetch recent members
      const { data: newMembers } = await supabase
        .from('memberships')
        .select(`
          id,
          created_at,
          members!inner(first_name, last_name)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (newMembers) {
        newMembers.forEach(membership => {
          activities.push({
            id: `member-${membership.id}`,
            type: 'member',
            title: `${membership.members.first_name} ${membership.members.last_name} joined`,
            icon: '👋',
            timestamp: membership.created_at,
            color: 'blue'
          });
        });
      }

      // Sort all activities by timestamp and take top 10
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
        .select(`
          *,
          announcement_reads!left(id, member_id)
        `)
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-semibold text-lg">Access Denied</p>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => navigate('/organizations')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
            <button
              onClick={() => navigate('/organizations')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← All Organizations
            </button>
          </div>
        </div>

        {/* View Mode Toggle - Only visible to admins */}
        {membership?.role === 'admin' && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">👁️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">View Mode</h3>
                  <p className="text-sm text-gray-600">
                    Switch between admin and member perspective
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  viewMode === 'admin' ? 'text-purple-700' : 'text-gray-500'
                }`}>
                  Admin
                </span>
                
                <button
                  onClick={() => setViewMode(viewMode === 'admin' ? 'member' : 'admin')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors ${
                    viewMode === 'member' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}
                  role="switch"
                  aria-checked={viewMode === 'admin'}
                  aria-label="Toggle between admin and member view"
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      viewMode === 'admin' ? 'translate-x-1' : 'translate-x-7'
                    }`}
                  />
                </button>
                
                <span className={`text-sm font-medium ${
                  viewMode === 'member' ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  Member
                </span>
              </div>
            </div>
            
            <div className="mt-3 text-sm">
              {viewMode === 'admin' ? (
                <p className="text-purple-700">
                  <span className="font-medium">Admin View:</span> Full access to all management features, settings, and member data
                </p>
              ) : (
                <p className="text-blue-700">
                  <span className="font-medium">Member View:</span> See exactly what regular members see (limited features)
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-all relative
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {effectiveRole === 'admin' ? '👑 Admin Dashboard' : '👤 Member Dashboard'}
                  </h2>
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                    {effectiveRole === 'admin' ? 'Administrator View' : 'Member View'}
                  </span>
                </div>
                
                {/* Action Buttons - Different for Admin vs Member */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateEvent(true)}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center gap-2"
                    aria-label="Create new event"
                  >
                    <span>📅</span>
                    Create Event
                  </button>
                  
                  {effectiveRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setShowCreateAnnouncement(true)}
                      className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all flex items-center gap-2"
                      aria-label="Create new announcement"
                    >
                      <span>📢</span>
                      Create Announcement
                    </button>
                  )}
                </div>
                
                {/* Enhanced Stats Grid - Clickable Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Members Card */}
                  <button
                    onClick={() => setActiveTab('members')}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={`View ${stats.totalMembers} total members`}
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

                  {/* Pending Invites Card - Admin Only */}
                  {effectiveRole === 'admin' && (
                    <button
                      onClick={() => setActiveTab('invite')}
                      className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                      aria-label={`Manage ${stats.pendingInvites} pending invitations`}
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

                  {/* Upcoming Events Card */}
                  <button
                    onClick={() => navigate(`/organizations/${organizationId}/events`)}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    aria-label={`View ${stats.activeEvents} upcoming events`}
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

                  {/* Unread Announcements Card */}
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    aria-label={`Read ${stats.unreadAnnouncements} unread announcements`}
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

                {/* Quick Actions - Different for Admin vs Member */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => navigate(`/organizations/${organizationId}/members`)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
                      <span className="font-semibold text-gray-900">View Member Directory</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('announcements')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">📢</span>
                      <span className="font-semibold text-gray-900">View Announcements</span>
                      {stats.unreadAnnouncements > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-orange-500 rounded-full">
                          {stats.unreadAnnouncements}
                        </span>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/organizations/${organizationId}/events`)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">📅</span>
                      <span className="font-semibold text-gray-900">View Events</span>
                    </button>

                    <button 
                      onClick={() => navigate(`/organizations/${organizationId}/polls`)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                      <span className="font-semibold text-gray-900">View Polls</span>
                    </button>

                    <button 
                      onClick={() => navigate(`/organizations/${organizationId}/surveys`)}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                      <span className="font-semibold text-gray-900">View Surveys</span>
                    </button>
                    
                    <button
                      onClick={() => navigate(`/organizations/${organizationId}/signup-forms`)}
                      className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      aria-label="View sign-up forms"
                    >
                      <span className="text-2xl">📝</span>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Sign-Up Forms</div>
                        <div className="text-sm text-gray-600">Volunteer lists & time slots</div>
                      </div>
                    </button>

                    {effectiveRole === 'admin' && (
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
                        <span className="font-semibold text-gray-900">Organization Settings</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Admin-only section */}
                {effectiveRole === 'admin' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                      <span>👑</span>
                      Admin Tools
                    </h3>
                    <p className="text-purple-700 text-sm mb-4">
                      These management features are only visible to administrators.
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setActiveTab('invite')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold"
                      >
                        ✉️ Invite Members
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold"
                      >
                        ⚙️ Manage Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Activity Feed */}
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
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                          <div 
                            className={`text-2xl flex-shrink-0 ${
                              activity.color === 'green' ? 'text-green-600' :
                              activity.color === 'blue' ? 'text-blue-600' :
                              activity.color === 'purple' ? 'text-purple-600' :
                              activity.color === 'red' ? 'text-red-600' :
                              'text-gray-600'
                            }`}
                            aria-hidden="true"
                          >
                            {activity.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
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
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-600">Member management coming in next phase!</p>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        📁 Document Library
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Access organization documents, files, and resources
                      </p>
                    </div>
                    {effectiveRole === 'admin' && (
                      <button
                        onClick={() => navigate(`/organizations/${organizationId}/documents`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        aria-label="Manage documents"
                      >
                        📂 Manage Documents
                      </button>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Recent Documents
                    </h3>
                    
                    <div className="space-y-3">
                      <p className="text-gray-500 text-sm">
                        Loading recent documents...
                      </p>
                    </div>

                    <div className="mt-6 text-center">
                      <button
                        onClick={() => navigate(`/organizations/${organizationId}/documents`)}
                        className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2"
                        aria-label="View all documents"
                      >
                        View All Documents
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>

                  {effectiveRole === 'admin' && (
                    <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">-</p>
                        <p className="text-sm text-gray-600">Total Files</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">-</p>
                        <p className="text-sm text-gray-600">Folders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">- MB</p>
                        <p className="text-sm text-gray-600">Storage Used</p>
                      </div>
                    </div>
                  )}
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
                      aria-label="Create new announcement"
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
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredAnnouncements.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <div className="text-4xl mb-3">
                      {announcementSearch || announcementFilter !== 'all' ? '🔍' : '📭'}
                    </div>
                    <p className="text-gray-600 font-semibold">
                      {announcementSearch || announcementFilter !== 'all' 
                        ? 'No announcements match your filters'
                        : 'No announcements yet'
                      }
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
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <p className="text-yellow-800 font-semibold">Permission Required</p>
                    <p className="text-yellow-700">
                      Member invitations are disabled. Contact an admin to enable this feature.
                    </p>
                  </div>
                )}
              </>
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
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
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