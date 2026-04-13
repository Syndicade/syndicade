import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, CalendarDays, ThumbsUp, Megaphone,
  TrendingUp, RefreshCw, CalendarX, UserX,
  Lock, ArrowRight
} from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#2A3550] bg-[#1A2035] p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-[#1E2845] rounded" />
        <div className="h-6 w-6 bg-[#1E2845] rounded" />
      </div>
      <div className="h-8 w-16 bg-[#1E2845] rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-[#1A2035] rounded-xl border border-[#2A3550] p-6 animate-pulse">
      <div className="h-4 w-40 bg-[#1E2845] rounded mb-2" />
      <div className="h-3 w-64 bg-[#1E2845] rounded mb-6" />
      <div className="h-64 bg-[#1E2845] rounded-lg" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="bg-[#1E2845] rounded-full p-4 mb-4">
        <Icon className="w-8 h-8 text-[#2A3550]" aria-hidden="true" />
      </div>
      <p className="font-semibold text-white text-base mb-1">{title}</p>
      <p className="text-sm text-[#64748B] mb-4 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Chart tooltip styles ──────────────────────────────────────────────────────
var tooltipStyle = {
  contentStyle: { borderRadius: '8px', border: '1px solid #2A3550', fontSize: '13px', background: '#1A2035', color: '#CBD5E1' },
  cursor: { fill: 'rgba(59,130,246,0.08)' }
};

export default function AnalyticsDashboard({ organizationId, onNavigate }) {
  var navigate = useNavigate();
  var [memberGrowth, setMemberGrowth] = useState([]);
  var [eventAttendance, setEventAttendance] = useState([]);
  var [totals, setTotals] = useState({ totalMembers: 0, totalEvents: 0, totalRSVPs: 0, totalAnnouncements: 0 });
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [planKey, setPlanKey] = useState('starter');

  useEffect(function() {
    fetchAnalytics();
  }, [organizationId]);

  async function fetchAnalytics(isRefresh) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Always fetch plan first
      var { data: sub } = await supabase
        .from('subscriptions').select('plan').eq('organization_id', organizationId).eq('status', 'active').maybeSingle();
      var plan = sub ? sub.plan : 'starter';
      setPlanKey(plan);

      // Only fetch full analytics data for Growth+
      if (plan !== 'starter') {
        await Promise.all([fetchMemberGrowth(), fetchEventAttendance(), fetchTotals()]);
      } else {
        // Fetch only totals for Starter (shown dimmed)
        await fetchTotals();
      }

      if (isRefresh) toast('Analytics refreshed', { icon: null, style: { background: '#1A2035', color: '#CBD5E1', border: '1px solid #2A3550' } });
    } catch (err) {
      console.error('Analytics error:', err);
      if (isRefresh) toast.error('Failed to refresh analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchMemberGrowth() {
    var { data } = await supabase
      .from('memberships')
      .select('joined_date')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('joined_date', { ascending: true });

    if (!data) return;

    var monthMap = {};
    data.forEach(function(m) {
      var date = new Date(m.joined_date);
      var key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthMap[key] = (monthMap[key] || 0) + 1;
    });

    var running = 0;
    var growth = Object.entries(monthMap).map(function(entry) {
      running += entry[1];
      return { month: entry[0], newMembers: entry[1], totalMembers: running };
    });

    setMemberGrowth(growth.slice(-12));
  }

  async function fetchEventAttendance() {
    var { data: events } = await supabase
      .from('events')
      .select('id, title, start_time')
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: false })
      .limit(8);

    if (!events || events.length === 0) return;

    var attendance = await Promise.all(
      events.map(async function(event) {
        var { count } = await supabase
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
    var { data: orgEvents } = await supabase.from('events').select('id').eq('organization_id', organizationId);
    var eventIds = (orgEvents || []).map(function(e) { return e.id; });

    var results = await Promise.all([
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active'),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
      eventIds.length > 0
        ? supabase.from('event_rsvps').select('*', { count: 'exact', head: true }).in('event_id', eventIds).eq('status', 'going')
        : Promise.resolve({ count: 0 }),
      supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
    ]);

    setTotals({
      totalMembers:       results[0].count || 0,
      totalEvents:        results[1].count || 0,
      totalRSVPs:         results[2].count || 0,
      totalAnnouncements: results[3].count || 0,
    });
  }

  var statCards = [
    { label: 'Total Members',    value: totals.totalMembers,       icon: Users,       bg: '#1D3461', text: '#60A5FA' },
    { label: 'Total Events',     value: totals.totalEvents,        icon: CalendarDays,bg: '#1B3A2F', text: '#34D399' },
    { label: 'Total RSVPs',      value: totals.totalRSVPs,         icon: ThumbsUp,    bg: '#2D1B4E', text: '#A78BFA' },
    { label: 'Announcements',    value: totals.totalAnnouncements, icon: Megaphone,   bg: '#3B2A14', text: '#FBBF24' },
  ];

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8 p-6" aria-busy="true" aria-label="Loading analytics">
        <div className="flex items-center justify-between">
          <div className="animate-pulse space-y-2">
            <div className="h-7 w-32 bg-[#1E2845] rounded" />
            <div className="h-4 w-56 bg-[#1E2845] rounded" />
          </div>
          <div className="h-9 w-24 bg-[#1E2845] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(function(i) { return <SkeletonCard key={i} />; })}
        </div>
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  var isGrowthPlus = planKey === 'growth' || planKey === 'pro';

  // ── Shared page content (used both for full view and dimmed background) ──
  function PageContent() {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-1">Reporting</p>
            <h1 className="text-2xl font-800 text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" aria-hidden="true" />
              Analytics
            </h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Overview of your organization activity</p>
          </div>
          {isGrowthPlus && (
            <button
              onClick={function() { fetchAnalytics(true); }}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 border border-[#2A3550] rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
              aria-label="Refresh analytics data"
            >
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} aria-hidden="true" />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Key statistics">
          {statCards.map(function(card) {
            var Icon = card.icon;
            return (
              <div
                key={card.label}
                role="listitem"
                className="rounded-xl border border-[#2A3550] p-5"
                style={{ background: card.bg }}
                aria-label={card.label + ': ' + card.value}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-700 uppercase tracking-widest" style={{ color: card.text }}>{card.label}</span>
                  <Icon className="w-5 h-5" style={{ color: card.text }} aria-hidden="true" />
                </div>
                <p className="text-3xl font-800 text-white">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Member growth chart */}
        <div className="bg-[#1A2035] rounded-xl border border-[#2A3550] p-6">
          <h3 className="text-base font-700 text-white mb-1">Member Growth</h3>
          <p className="text-sm text-[#64748B] mb-6">New and total members over the last 12 months</p>
          {memberGrowth.length === 0 ? (
            <EmptyState
              icon={UserX}
              title="No membership data yet"
              description="Member growth will appear here once people start joining your organization."
              actionLabel="Invite Members"
              onAction={function() { onNavigate && onNavigate('members'); }}
            />
          ) : (
            <div aria-label="Member growth chart" role="img">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={memberGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3550" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px', color: '#94A3B8' }} />
                  <Line type="monotone" dataKey="totalMembers" name="Total Members" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="newMembers" name="New Members" stroke="#22C55E" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#22C55E' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Event attendance chart */}
        <div className="bg-[#1A2035] rounded-xl border border-[#2A3550] p-6">
          <h3 className="text-base font-700 text-white mb-1">Event Attendance</h3>
          <p className="text-sm text-[#64748B] mb-6">Number of RSVPs per recent event</p>
          {eventAttendance.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="No event data yet"
              description="Attendance charts will appear here once events have RSVPs."
              actionLabel="Create Event"
              onAction={function() { onNavigate && onNavigate('events'); }}
            />
          ) : (
            <div aria-label="Event attendance chart" role="img">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={eventAttendance} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3550" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={function(value) { return [value, 'Attending']; }} labelFormatter={function(label) { return 'Event: ' + label; }} />
                  <Bar dataKey="attending" name="Attending" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Starter: dimmed page + overlay ────────────────────────────────────────
  if (!isGrowthPlus) {
    return (
      <div className="relative bg-[#0E1523] min-h-screen" aria-label="Analytics">
        {/* Dimmed background — non-interactive */}
        <div className="opacity-20 pointer-events-none select-none" aria-hidden="true">
          <PageContent />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-start justify-center pt-24 px-4" style={{ background: 'rgba(14,21,35,0.6)' }}>
          <div className="w-full max-w-md bg-[#1A2035] border border-[#2A3550] rounded-2xl p-8 shadow-2xl text-center">

            <div className="w-14 h-14 rounded-2xl bg-[#1E2845] border border-[#2A3550] flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <Lock size={24} className="text-[#64748B]" />
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-700 uppercase tracking-widest bg-blue-500 bg-opacity-15 border border-blue-500 border-opacity-30 text-blue-400 mb-4">
              Available on Growth
            </span>

            <h2 className="text-xl font-800 text-white mb-2">Full Analytics Dashboard</h2>
            <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
              Unlock detailed member growth charts, event attendance tracking, revenue reports, and email performance data.
            </p>

            <ul className="text-left space-y-3 mb-8" role="list" aria-label="Features included with Growth">
              {[
                { icon: Users,       text: 'Member growth trends over the last 12 months' },
                { icon: CalendarDays,text: 'Event attendance tracking per event' },
                { icon: TrendingUp,  text: 'Revenue analytics and ticket sales data' },
                { icon: Megaphone,   text: 'Email open rates, clicks, and bounce tracking' },
              ].map(function(item, i) {
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#1E2845] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                      <item.icon size={13} className="text-blue-400" />
                    </div>
                    <span className="text-sm text-[#CBD5E1]">{item.text}</span>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-colors"
            >
              Upgrade to Growth
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <p className="text-xs text-[#64748B] mt-3">$39/mo — or $390/yr (2 months free)</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Growth / Pro: full page ───────────────────────────────────────────────
  return (
    <div className="bg-[#0E1523] min-h-screen" aria-label="Analytics dashboard">
      <PageContent />
    </div>
  );
}