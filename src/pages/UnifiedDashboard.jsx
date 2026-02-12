import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CreateOrganization from '../components/CreateOrganization';
import CreateEvent from '../components/CreateEvent.jsx';
import EventCard from '../components/EventCard';
import MySignups from '../components/MySignups';

function UnifiedDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dismissedActivities, setDismissedActivities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedActivities') || '[]');
    } catch { return []; }
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedOrgForEvent, setSelectedOrgForEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchDashboardData();
      } else if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchDashboardData();
      } else {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
    return () => { subscription?.unsubscribe(); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) { setLoading(false); throw new Error('Auth session missing!'); }

      setCurrentUser(user);

      const { data: orgsData, error: orgsError } = await supabase
        .from('memberships')
        .select(`
          id, role, status, custom_title, joined_date,
          organization:organizations (id, name, description, type, logo_url)
        `)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .order('joined_date', { ascending: false });

      if (orgsError) throw orgsError;

      const orgsWithStats = await Promise.all(
        (orgsData || []).map(async (membership) => {
          const orgId = membership.organization.id;

          const { count: memberCount } = await supabase
            .from('memberships').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId).eq('status', 'active');

          const { count: eventCount } = await supabase
            .from('events').select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .gte('start_time', new Date().toISOString())
            .in('visibility', ['public', 'members']);

          const { data: announcements } = await supabase
            .from('announcements').select('id')
            .eq('organization_id', orgId)
            .in('visibility', ['public', 'members']);

          const announcementIds = (announcements || []).map(a => a.id);
          let unreadCount = 0;
          if (announcementIds.length > 0) {
            const { data: reads } = await supabase
              .from('announcement_reads').select('announcement_id')
              .eq('member_id', user.id).in('announcement_id', announcementIds);
            const readIds = new Set((reads || []).map(r => r.announcement_id));
            unreadCount = announcementIds.length - readIds.size;
          }

          return {
            ...membership.organization,
            role: membership.role,
            custom_title: membership.custom_title,
            memberCount: memberCount || 0,
            eventCount: eventCount || 0,
            unreadCount
          };
        })
      );

      setOrganizations(orgsWithStats);

      const orgIds = orgsWithStats.map(org => org.id);
      if (orgIds.length > 0) {
        const { data: eventsData } = await supabase
          .from('events')
          .select(`id, title, start_time, location, organization:organizations (id, name, type)`)
          .in('organization_id', orgIds)
          .gte('start_time', new Date().toISOString())
          .in('visibility', ['public', 'members'])
          .order('start_time', { ascending: true })
          .limit(5);
        setUpcomingEvents(eventsData || []);

        const { data: recentAnnouncements } = await supabase
          .from('announcements')
          .select(`id, title, created_at, priority, organization:organizations (id, name)`)
          .in('organization_id', orgIds)
          .in('visibility', ['public', 'members'])
          .order('created_at', { ascending: false })
          .limit(10);

        setActivities(
          (recentAnnouncements || []).map(item => ({
            id: item.id,
            type: 'announcement',
            title: item.title,
            organizationName: item.organization.name,
            organizationId: item.organization.id,
            timestamp: item.created_at,
            priority: item.priority
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissActivity = (activityId) => {
    const updated = [...dismissedActivities, activityId];
    setDismissedActivities(updated);
    localStorage.setItem('dismissedActivities', JSON.stringify(updated));
  };

  const visibleActivities = activities.filter(a => !dismissedActivities.includes(a.id));

  const handleOrganizationCreated = () => {
    fetchDashboardData();
    setShowCreateModal(false);
  };

  const handleEventCreated = () => { fetchDashboardData(); };

  const getOrgTypeIcon = (type) => {
    const icons = { nonprofit: '🤝', club: '🎭', association: '💼', community: '🏘️', other: '📋' };
    return icons[type] || icons.other;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      member: 'bg-blue-100 text-blue-800 border-blue-200',
      guest: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role] || colors.member;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + 'm ago';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays < 7) return diffDays + 'd ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"
            role="status" aria-label="Loading dashboard">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md" role="alert">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Title + User Profile Row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {organizations.length === 0
                ? 'Welcome! Create or join an organization to get started.'
                : 'Managing ' + organizations.length + ' organization' + (organizations.length !== 1 ? 's' : '')}
            </p>
          </div>

          {/* User Profile Pill */}
          {currentUser && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/account-settings')}
                className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Go to account settings"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {currentUser.email?.charAt(0).toUpperCase() || '👤'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-blue-600">Account Settings</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {organizations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🏘️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Organizations Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first organization or ask an admin to invite you to join one.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Organization
              </button>
              <button
                onClick={() => navigate('/organizations/discover')}
                className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Discover Organizations
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT: Orgs + Events */}
            <div className="lg:col-span-2 space-y-6">

              {/* My Organizations */}
              <section aria-labelledby="organizations-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="organizations-heading" className="text-xl font-bold text-gray-900">
                    My Organizations
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 flex items-center gap-1"
                    aria-label="Create a new organization"
                  >
                    <span aria-hidden="true">+</span> New Organization
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizations.map((org) => (
                    <Link
                      key={org.id}
                      to={'/organizations/' + org.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={'Go to ' + org.name + ' dashboard'}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name + ' logo'} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl flex-shrink-0">
                            {getOrgTypeIcon(org.type)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900">{org.name}</h3>
                          <span className={'inline-block px-2 py-0.5 text-xs font-semibold rounded border ' + getRoleBadgeColor(org.role)}>
                            {org.custom_title || org.role.charAt(0).toUpperCase() + org.role.slice(1)}
                          </span>
                        </div>
                      </div>

                      {org.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{org.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span><span aria-label="Members">👥</span> {org.memberCount}</span>
                        <span><span aria-label="Upcoming events">📅</span> {org.eventCount}</span>
                        {org.unreadCount > 0 && (
                          <span className="text-orange-600 font-semibold">
                            <span aria-label="Unread announcements">🔔</span> {org.unreadCount} new
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <section aria-labelledby="events-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 id="events-heading" className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
                  <div className="space-y-4 mb-4">
                    {upcomingEvents.slice(0, 3).map((event) => (
                      <EventCard key={event.id} event={event} showOrganization={true} />
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <Link to="/events"
                      className="flex-1 text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold">
                      📋 View All Events
                    </Link>
                    <Link to="/calendar"
                      className="flex-1 text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-semibold">
                      📅 View Calendar
                    </Link>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">

              {/* Recent Activity */}
              <section aria-labelledby="activity-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 id="activity-heading" className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                {visibleActivities.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">No recent activity</p>
                ) : (
                  <div className="space-y-1">
                    {visibleActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2 group pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                        <Link
                          to={'/organizations/' + activity.organizationId + '/announcements'}
                          className="flex items-start gap-3 flex-1 hover:bg-gray-50 -ml-2 pl-2 pr-1 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={'View announcement: ' + activity.title}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm" aria-hidden="true">
                            📢
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{activity.title}</p>
                            <p className="text-xs text-gray-600">{activity.organizationName}</p>
                            <p className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</p>
                          </div>
                          {activity.priority === 'urgent' && (
                            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 rounded border border-red-200">
                              URGENT
                            </span>
                          )}
                        </Link>
                        <button
                          onClick={() => handleDismissActivity(activity.id)}
                          className="flex-shrink-0 mt-1 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={'Dismiss notification: ' + activity.title}
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {dismissedActivities.length > 0 && (
                  <button
                    onClick={() => {
                      setDismissedActivities([]);
                      localStorage.removeItem('dismissedActivities');
                    }}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                  >
                    Show {dismissedActivities.length} hidden item{dismissedActivities.length !== 1 ? 's' : ''}
                  </button>
                )}
              </section>

              {/* My Sign-Ups */}
              <MySignups showFilter={true} />
            </div>
          </div>
        )}
      </main>

      <CreateOrganization
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleOrganizationCreated}
      />

      {selectedOrgForEvent && (
        <CreateEvent
          isOpen={showCreateEvent}
          onClose={() => { setShowCreateEvent(false); setSelectedOrgForEvent(null); }}
          onSuccess={handleEventCreated}
          organizationId={selectedOrgForEvent.id}
          organizationName={selectedOrgForEvent.name}
        />
      )}
    </div>
  );
}

export default UnifiedDashboard;