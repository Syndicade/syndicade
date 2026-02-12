import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function AnalyticsDashboard({ organizationId }) {
  const [memberGrowth, setMemberGrowth] = useState([]);
  const [eventAttendance, setEventAttendance] = useState([]);
  const [totals, setTotals] = useState({
    totalMembers: 0,
    totalEvents: 0,
    totalRSVPs: 0,
    totalAnnouncements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [organizationId]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      await Promise.all([
        fetchMemberGrowth(),
        fetchEventAttendance(),
        fetchTotals(),
      ]);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMemberGrowth() {
    const { data } = await supabase
      .from('memberships')
      .select('created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (!data) return;

    const monthMap = {};
    data.forEach(m => {
      const date = new Date(m.created_at);
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
    const [members, events, rsvps, announcements] = await Promise.all([
      supabase.from('memberships').select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId).eq('status', 'active'),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase.from('event_rsvps').select('event_id, events!inner(organization_id)', { count: 'exact', head: true })
        .eq('events.organization_id', organizationId).eq('status', 'going'),
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
    { label: 'Total Members', value: totals.totalMembers, icon: '👥', color: 'blue' },
    { label: 'Total Events', value: totals.totalEvents, icon: '📅', color: 'green' },
    { label: 'Total RSVPs', value: totals.totalRSVPs, icon: '✋', color: 'purple' },
    { label: 'Announcements', value: totals.totalAnnouncements, icon: '📢', color: 'orange' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-600 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-600 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-600 text-orange-900',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16" role="status" aria-label="Loading analytics">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8" aria-label="Analytics dashboard">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📈 Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Overview of your organization activity</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          aria-label="Refresh analytics data"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Key statistics">
        {statCards.map(card => {
          const colors = colorMap[card.color].split(' ');
          return (
            <div
              key={card.label}
              role="listitem"
              className={'rounded-xl border p-5 ' + colors[0] + ' ' + colors[1]}
              aria-label={card.label + ': ' + card.value}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={'text-sm font-semibold uppercase tracking-wide ' + colors[2]}>
                  {card.label}
                </span>
                <span className="text-2xl" aria-hidden="true">{card.icon}</span>
              </div>
              <p className={'text-3xl font-bold ' + colors[3]}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Member Growth</h3>
        <p className="text-sm text-gray-500 mb-6">New and total members over the last 12 months</p>
        {memberGrowth.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-4xl mb-3" aria-hidden="true">👥</p>
            <p className="font-medium">No membership data yet</p>
          </div>
        ) : (
          <div aria-label="Member growth chart" role="img">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={memberGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="totalMembers"
                  name="Total Members"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="newMembers"
                  name="New Members"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Event Attendance</h3>
        <p className="text-sm text-gray-500 mb-6">Number of RSVPs per recent event</p>
        {eventAttendance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-4xl mb-3" aria-hidden="true">📅</p>
            <p className="font-medium">No event data yet</p>
          </div>
        ) : (
          <div aria-label="Event attendance chart" role="img">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={eventAttendance} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value) => [value, 'Attending']}
                  labelFormatter={(label) => 'Event: ' + label}
                />
                <Bar
                  dataKey="attending"
                  name="Attending"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}