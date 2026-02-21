import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, CalendarDays, ThumbsUp, Megaphone,
  TrendingUp, RefreshCw, CalendarX, UserX
} from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-6 w-6 bg-gray-200 rounded" />
      </div>
      <div className="h-8 w-16 bg-gray-200 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-64 bg-gray-100 rounded mb-6" />
      <div className="h-64 bg-gray-100 rounded-lg" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <Icon className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <p className="font-semibold text-gray-700 text-base mb-1">{title}</p>
      <p className="text-sm text-gray-400 mb-4 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function AnalyticsDashboard({ organizationId, onNavigate }) {
  const [memberGrowth, setMemberGrowth] = useState([]);
  const [eventAttendance, setEventAttendance] = useState([]);
  const [totals, setTotals] = useState({
    totalMembers: 0,
    totalEvents: 0,
    totalRSVPs: 0,
    totalAnnouncements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [organizationId]);

  async function fetchAnalytics(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      await Promise.all([
        fetchMemberGrowth(),
        fetchEventAttendance(),
        fetchTotals(),
      ]);

      if (isRefresh) toast.success('Analytics refreshed');
    } catch (err) {
      console.error('Analytics error:', err);
      if (isRefresh) toast.error('Failed to refresh analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchMemberGrowth() {
    const { data } = await supabase
      .from('memberships')
      .select('joined_date')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('joined_date', { ascending: true });

    if (!data) return;

    const monthMap = {};
    data.forEach(m => {
      const date = new Date(m.joined_date);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthMap[key] = (monthMap[key] || 0) + 1;
    });

    let running = 0;
    const growth = Object.entries(monthMap).map(([month, count]) => {
      running += count;
      return { month, newMembers: count, totalMembers: running };
    });

    setMemberGrowth(growth.slice(-12));
  }

  async function fetchEventAttendance() {
    const { data: events } = await supabase
      .from('events')
      .select('id, title, start_time')
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: false })
      .limit(8);

    if (!events || events.length === 0) return;

    const attendance = await Promise.all(
      events.map(async event => {
        const { count } = await supabase
          .from('event_rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'going');

        return {
          name: event.title.length > 16 ? event.title.slice(0, 16) + '...' : event.title,
          attending: count || 0,
          date: new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
      })
    );

    setEventAttendance(attendance.reverse());
  }

async function fetchTotals() {
  const { data: orgEvents } = await supabase
    .from('events')
    .select('id')
    .eq('organization_id', organizationId);

  const eventIds = (orgEvents || []).map(e => e.id);

  const [members, events, rsvps, announcements] = await Promise.all([
    supabase.from('memberships').select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId).eq('status', 'active'),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    eventIds.length > 0
      ? supabase.from('event_rsvps').select('*', { count: 'exact', head: true })
          .in('event_id', eventIds).eq('status', 'going')
      : Promise.resolve({ count: 0 }),
    supabase.from('announcements').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
  ]);

  setTotals({
    totalMembers: members.count || 0,
    totalEvents: events.count || 0,
    totalRSVPs: rsvps.count || 0,
    totalAnnouncements: announcements.count || 0,
  });
}

  const statCards = [
    { label: 'Total Members', value: totals.totalMembers, icon: Users, color: 'blue' },
    { label: 'Total Events', value: totals.totalEvents, icon: CalendarDays, color: 'green' },
{ label: 'Total RSVPs', value: totals.totalRSVPs, icon: ThumbsUp, color: 'purple' },
    { label: 'Announcements', value: totals.totalAnnouncements, icon: Megaphone, color: 'orange' },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50 border-blue-200', label: 'text-blue-600', value: 'text-blue-900', icon: 'text-blue-400' },
    green: { bg: 'bg-green-50 border-green-200', label: 'text-green-600', value: 'text-green-900', icon: 'text-green-400' },
    purple: { bg: 'bg-purple-50 border-purple-200', label: 'text-purple-600', value: 'text-purple-900', icon: 'text-purple-400' },
    orange: { bg: 'bg-orange-50 border-orange-200', label: 'text-orange-600', value: 'text-orange-900', icon: 'text-orange-400' },
  };

  if (loading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading analytics">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-56 bg-gray-100 rounded" />
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  return (
    <div className="space-y-8" aria-label="Analytics dashboard">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" aria-hidden="true" />
            Analytics
          </h2>
          <p className="text-gray-500 text-sm mt-1">Overview of your organization activity</p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          aria-label="Refresh analytics data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Key statistics">
        {statCards.map(card => {
          const c = colorMap[card.color];
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              role="listitem"
              className={`rounded-xl border p-5 ${c.bg}`}
              aria-label={`${card.label}: ${card.value}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wide ${c.label}`}>
                  {card.label}
                </span>
                <Icon className={`w-5 h-5 ${c.icon}`} aria-hidden="true" />
              </div>
              <p className={`text-3xl font-bold ${c.value}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Member Growth</h3>
        <p className="text-sm text-gray-500 mb-6">New and total members over the last 12 months</p>
        {memberGrowth.length === 0 ? (
          <EmptyState
            icon={UserX}
            title="No membership data yet"
            description="Member growth will appear here once people start joining your organization."
            actionLabel="Invite Members"
            onAction={() => onNavigate && onNavigate('members')}
          />
        ) : (
          <div aria-label="Member growth chart" role="img">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={memberGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
                <Line type="monotone" dataKey="totalMembers" name="Total Members" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="newMembers" name="New Members" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Event Attendance</h3>
        <p className="text-sm text-gray-500 mb-6">Number of RSVPs per recent event</p>
        {eventAttendance.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="No event data yet"
            description="Attendance charts will appear here once events have RSVPs."
            actionLabel="Create Event"
            onAction={() => onNavigate && onNavigate('events')}
          />
        ) : (
          <div aria-label="Event attendance chart" role="img">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={eventAttendance} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value) => [value, 'Attending']}
                  labelFormatter={(label) => 'Event: ' + label}
                />
                <Bar dataKey="attending" name="Attending" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}