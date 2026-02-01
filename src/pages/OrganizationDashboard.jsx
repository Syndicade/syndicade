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
  
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [announcementFilter, setAnnouncementFilter] = useState('all');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'announcements', label: 'Announcements', icon: '📢', badge: stats.unreadAnnouncements },
    { id: 'invite', label: 'Invite', icon: '✉️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  useEffect(() => {
    if (activeTab === 'announcements' && currentUserId) {
      fetchAnnouncements();
    }
  }, [activeTab, organizationId, currentUserId]);

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
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                
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
                  
                  {membership?.role === 'admin' && (
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-semibold uppercase">Total Members</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalMembers}</p>
                      </div>
                      <div className="text-4xl">👥</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-600 text-sm font-semibold uppercase">Pending Invites</p>
                        <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingInvites}</p>
                      </div>
                      <div className="text-4xl">✉️</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-semibold uppercase">Upcoming Events</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">{stats.activeEvents}</p>
                      </div>
                      <div className="text-4xl">📅</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-semibold uppercase">Unread News</p>
                        <p className="text-3xl font-bold text-orange-900 mt-2">{stats.unreadAnnouncements}</p>
                      </div>
                      <div className="text-4xl">📢</div>
                    </div>
                  </div>
                </div>

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
                      onClick={() => setActiveTab('settings')}
                      className="flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
                      <span className="font-semibold text-gray-900">Organization Settings</span>
                    </button>
                  </div>
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

            {activeTab === 'announcements' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">📢 Announcements</h2>
                  {membership?.role === 'admin' && (
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
                    {!announcementSearch && announcementFilter === 'all' && membership?.role === 'admin' && (
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
                        isAdmin={membership?.role === 'admin'}
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