import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, CalendarDays, ThumbsUp, Megaphone,
  TrendingUp, RefreshCw, CalendarX, UserX, Lock, ArrowRight, Calendar
} from 'lucide-react';

// ── Theme constants ───────────────────────────────────────────────
var BG     = '#F8FAFC';
var CARD   = '#FFFFFF';
var BDR    = '#E2E8F0';
var ELEV   = '#F1F5F9';
var TEXT   = '#0E1523';
var TEXT2  = '#475569';
var MUTED  = '#64748B';
var YELLOW = '#F5B731';

// ── Date range presets (no All Time — replaced by Custom Range) ───
var DATE_RANGES = [
  { value: 'month',  label: 'This Month'     },
  { value: '30d',    label: 'Last 30 Days'   },
  { value: '90d',    label: 'Last 90 Days'   },
  { value: '12m',    label: 'Last 12 Months' },
  { value: 'custom', label: 'Custom Range'   },
];

function getStartDate(range) {
  var now = new Date();
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  if (range === '30d')   return new Date(now.getTime() - 30  * 86400000).toISOString();
  if (range === '90d')   return new Date(now.getTime() - 90  * 86400000).toISOString();
  if (range === '12m')   return new Date(now.getTime() - 365 * 86400000).toISOString();
  return null; // custom handled separately
}

function formatCustomLabel(start, end) {
  if (!start || !end) return '';
  var fmt = function(s) {
    return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  return fmt(start) + ' \u2013 ' + fmt(end);
}

function getGroupKey(dateStr, range, appliedStart, appliedEnd) {
  var d = new Date(dateStr);
  // For short custom ranges (≤60 days) or short presets, group by day
  if (range === 'month' || range === '30d') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (range === 'custom' && appliedStart && appliedEnd) {
    var diffDays = (new Date(appliedEnd) - new Date(appliedStart)) / 86400000;
    if (diffDays <= 60) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Chart tooltip (light) ─────────────────────────────────────────
var tooltipStyle = {
  contentStyle: {
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    fontSize: '13px',
    background: '#FFFFFF',
    color: '#475569',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  cursor: { fill: 'rgba(59,130,246,0.05)' },
};

// ── Skeletons ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse" aria-hidden="true">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-5 w-5 bg-slate-200 rounded" />
      </div>
      <div className="h-8 w-16 bg-slate-100 rounded mt-2" />
      <div className="h-3 w-20 bg-slate-100 rounded mt-2" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse" aria-hidden="true">
      <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-56 bg-slate-100 rounded mb-6" />
      <div className="h-64 bg-slate-100 rounded-lg" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div
        className="rounded-full p-4 mb-4"
        style={{ background: ELEV, border: '1px solid ' + BDR }}
        aria-hidden="true"
      >
        <Icon className="w-8 h-8 text-slate-400" aria-hidden="true" />
      </div>
      <p style={{ color: TEXT }} className="font-semibold text-base mb-1">{title}</p>
      <p style={{ color: TEXT2 }} className="text-sm mb-4 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Starter dimmed preview ────────────────────────────────────────
function StarterPreview({ totals }) {
  var previewCards = [
    { label: 'Members',       value: totals.totalMembers,       bg: 'bg-blue-50',   text: 'text-blue-600'   },
    { label: 'Events',        value: totals.totalEvents,        bg: 'bg-green-50',  text: 'text-green-600'  },
    { label: 'Attendees',     value: totals.totalAttendees,     bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Announcements', value: totals.totalAnnouncements, bg: 'bg-amber-50',  text: 'text-amber-600'  },
  ];
  return (
    <div className="space-y-6 p-6">
      <div>
        <p style={{ color: YELLOW, letterSpacing: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
          Reporting
        </p>
        <h1 style={{ color: TEXT }} className="text-2xl font-extrabold">Analytics</h1>
        <p style={{ color: MUTED }} className="text-sm mt-0.5">Overview of your organization activity</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {DATE_RANGES.map(function(r) {
          return (
            <div key={r.value} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-400">
              {r.label}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {previewCards.map(function(card) {
          return (
            <div key={card.label} className={'rounded-xl p-5 ' + card.bg}>
              <p className={'text-xs font-semibold uppercase tracking-wide mb-2 ' + card.text}>{card.label}</p>
              <p className={'text-3xl font-extrabold ' + card.text}>{card.value}</p>
            </div>
          );
        })}
      </div>
      <div style={{ background: CARD, border: '1px solid ' + BDR }} className="rounded-xl p-6">
        <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-56 bg-slate-100 rounded mb-6" />
        <div className="h-64 bg-slate-100 rounded-lg" />
      </div>
      <div style={{ background: CARD, border: '1px solid ' + BDR }} className="rounded-xl p-6">
        <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-56 bg-slate-100 rounded mb-6" />
        <div className="h-64 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function AnalyticsDashboard({ organizationId, onNavigate }) {
  var navigate = useNavigate();

  var [memberGrowth, setMemberGrowth]       = useState([]);
  var [eventAttendance, setEventAttendance] = useState([]);
  var [totals, setTotals]                   = useState({ totalMembers: 0, totalEvents: 0, totalAttendees: 0, totalAnnouncements: 0 });
  var [loading, setLoading]                 = useState(true);
  var [refreshing, setRefreshing]           = useState(false);
  var [planKey, setPlanKey]                 = useState('starter');
  var [dateRange, setDateRange]             = useState('12m');

  // Custom range inputs (what the user is typing)
  var [customStart, setCustomStart] = useState('');
  var [customEnd, setCustomEnd]     = useState('');

  // Applied custom range (only set when Apply is clicked)
  var [appliedStart, setAppliedStart] = useState(null);
  var [appliedEnd, setAppliedEnd]     = useState(null);

  var today = new Date().toISOString().split('T')[0];

  // Re-fetch when preset changes or when custom range is applied
  useEffect(function() {
    if (dateRange === 'custom') {
      if (appliedStart && appliedEnd) fetchAnalytics(false);
      // else wait for Apply — don't fetch with no dates
    } else {
      fetchAnalytics(false);
    }
  }, [organizationId, dateRange, appliedStart, appliedEnd]);

  function handleApplyCustomRange() {
    if (!customStart || !customEnd) return;
    setAppliedStart(customStart);
    setAppliedEnd(customEnd);
  }

  function handleClearCustomRange() {
    setCustomStart('');
    setCustomEnd('');
    setAppliedStart(null);
    setAppliedEnd(null);
  }

  function handleSelectPreset(value) {
    setDateRange(value);
    // Clear applied custom when switching to a preset
    if (value !== 'custom') {
      setAppliedStart(null);
      setAppliedEnd(null);
    }
  }

  // Resolve start/end ISO strings for the active range
  function resolveStartEnd() {
    if (dateRange === 'custom') {
      var start = appliedStart ? new Date(appliedStart + 'T00:00:00').toISOString() : null;
      var end   = appliedEnd   ? new Date(appliedEnd   + 'T23:59:59').toISOString() : null;
      return { startDate: start, endDate: end };
    }
    return { startDate: getStartDate(dateRange), endDate: null };
  }

  async function fetchAnalytics(isRefresh) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      var { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .maybeSingle();
      var plan = sub ? sub.plan : 'starter';
      setPlanKey(plan);

      var dates = resolveStartEnd();

      if (plan !== 'starter') {
        await Promise.all([
          fetchMemberGrowth(dates.startDate, dates.endDate),
          fetchEventAttendance(dates.startDate, dates.endDate),
          fetchTotals(dates.startDate, dates.endDate),
        ]);
      } else {
        await fetchTotals(null, null);
      }

      if (isRefresh) mascotSuccessToast('Analytics refreshed!');
    } catch (err) {
      console.error('Analytics error:', err);
      if (isRefresh) mascotErrorToast('Failed to refresh analytics.', 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchMemberGrowth(startDate, endDate) {
    var query = supabase
      .from('memberships')
      .select('joined_date')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('joined_date', { ascending: true });

    if (startDate) query = query.gte('joined_date', startDate);
    if (endDate)   query = query.lte('joined_date', endDate);

    var { data } = await query;
    if (!data) return;

    var periodMap = {};
    data.forEach(function(m) {
      if (!m.joined_date) return;
      var key = getGroupKey(m.joined_date, dateRange, appliedStart, appliedEnd);
      periodMap[key] = (periodMap[key] || 0) + 1;
    });

    var running = 0;
    var growth = Object.entries(periodMap).map(function(entry) {
      running += entry[1];
      return { period: entry[0], newMembers: entry[1], totalMembers: running };
    });

    setMemberGrowth(growth);
  }

  async function fetchEventAttendance(startDate, endDate) {
    var query = supabase
      .from('events')
      .select('id, title, start_time')
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: false })
      .limit(10);

    if (startDate) query = query.gte('start_time', startDate);
    if (endDate)   query = query.lte('start_time', endDate);

    var { data: events } = await query;
    if (!events || events.length === 0) { setEventAttendance([]); return; }

    var attendance = await Promise.all(
      events.map(async function(event) {
        var { count } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        return {
          name: event.title.length > 16 ? event.title.slice(0, 16) + '...' : event.title,
          attending: count || 0,
          date: new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        };
      })
    );

    setEventAttendance(attendance.reverse());
  }

  async function fetchTotals(startDate, endDate) {
    var memberQuery = supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    if (startDate) memberQuery = memberQuery.gte('joined_date', startDate);
    if (endDate)   memberQuery = memberQuery.lte('joined_date', endDate);

    var eventsQuery = supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    if (startDate) eventsQuery = eventsQuery.gte('start_time', startDate);
    if (endDate)   eventsQuery = eventsQuery.lte('start_time', endDate);

    var eventIdsQuery = supabase.from('events').select('id').eq('organization_id', organizationId);
    if (startDate) eventIdsQuery = eventIdsQuery.gte('start_time', startDate);
    if (endDate)   eventIdsQuery = eventIdsQuery.lte('start_time', endDate);
    var { data: orgEvents } = await eventIdsQuery;
    var eventIds = (orgEvents || []).map(function(e) { return e.id; });

    var attendeesPromise = eventIds.length > 0
      ? supabase.from('attendance_records').select('*', { count: 'exact', head: true }).in('event_id', eventIds)
      : Promise.resolve({ count: 0 });

    var announcementsQuery = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);
    if (startDate) announcementsQuery = announcementsQuery.gte('created_at', startDate);
    if (endDate)   announcementsQuery = announcementsQuery.lte('created_at', endDate);

    var results = await Promise.all([memberQuery, eventsQuery, attendeesPromise, announcementsQuery]);

    setTotals({
      totalMembers:       results[0].count || 0,
      totalEvents:        results[1].count || 0,
      totalAttendees:     results[2].count || 0,
      totalAnnouncements: results[3].count || 0,
    });
  }

  // Stat card subtitle — what range is active
  var activeRangeLabel = (function() {
    if (dateRange === 'custom' && appliedStart && appliedEnd) {
      return formatCustomLabel(appliedStart, appliedEnd);
    }
    var found = DATE_RANGES.find(function(r) { return r.value === dateRange; });
    return found ? found.label : '';
  })();

  var statCards = [
    { label: 'Members',       value: totals.totalMembers,       icon: Users,        bg: 'bg-blue-50',   val: 'text-blue-600'   },
    { label: 'Events',        value: totals.totalEvents,        icon: CalendarDays, bg: 'bg-green-50',  val: 'text-green-600'  },
    { label: 'Attendees',     value: totals.totalAttendees,     icon: ThumbsUp,     bg: 'bg-purple-50', val: 'text-purple-600' },
    { label: 'Announcements', value: totals.totalAnnouncements, icon: Megaphone,    bg: 'bg-amber-50',  val: 'text-amber-600'  },
  ];

  var isGrowthPlus = planKey === 'growth' || planKey === 'pro';

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: BG }} className="min-h-screen space-y-6 p-6" aria-busy="true" aria-label="Loading analytics">
        <div className="flex items-start justify-between gap-4">
          <div className="animate-pulse space-y-2">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-7 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-56 bg-slate-100 rounded" />
          </div>
          <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map(function(n) {
            return <div key={n} className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />;
          })}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(function(i) { return <SkeletonCard key={i} />; })}
        </div>
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  // ── Starter: dimmed preview + upgrade card ────────────────────────
  if (!isGrowthPlus) {
    return (
      <div style={{ background: BG }} className="relative min-h-screen" aria-label="Analytics — upgrade required">
        <div className="opacity-25 pointer-events-none select-none" aria-hidden="true">
          <StarterPreview totals={totals} />
        </div>
        <div
          className="absolute inset-0 flex items-start justify-center pt-16 px-4"
          style={{ background: 'rgba(248,250,252,0.85)' }}
        >
          <div
            style={{ background: CARD, border: '1px solid ' + BDR }}
            className="w-full max-w-md rounded-2xl shadow-xl p-8 text-center"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: ELEV, border: '1px solid ' + BDR }}
              aria-hidden="true"
            >
              <Lock size={24} className="text-slate-400" />
            </div>
            <span
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', color: '#1D4ED8' }}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            >
              Available on Growth
            </span>
            <h2 style={{ color: TEXT }} className="text-xl font-extrabold mb-2">Full Analytics Dashboard</h2>
            <p style={{ color: TEXT2 }} className="text-sm mb-6 leading-relaxed">
              Unlock detailed member growth charts, event attendance tracking, custom date range filtering, and email performance data.
            </p>
            <ul className="text-left space-y-3 mb-8" role="list" aria-label="Features included with Growth">
              {[
                { icon: Users,        text: 'Member growth trends with custom date ranges' },
                { icon: CalendarDays, text: 'Event attendance tracking per event'           },
                { icon: TrendingUp,   text: 'Revenue analytics and ticket sales data'       },
                { icon: Megaphone,    text: 'Email open rates, clicks, and bounce tracking' },
              ].map(function(item, i) {
                var ItemIcon = item.icon;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                      aria-hidden="true"
                    >
                      <ItemIcon size={13} className="text-blue-500" />
                    </div>
                    <span style={{ color: TEXT2 }} className="text-sm">{item.text}</span>
                  </li>
                );
              })}
            </ul>
            <button
              onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Upgrade to Growth
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <p style={{ color: MUTED }} className="text-xs mt-3">$49.99/mo · or $41.66/mo billed annually</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Growth / Pro: full analytics ──────────────────────────────────
  return (
    <div style={{ background: BG }} className="min-h-screen" aria-label="Analytics dashboard">
      <div className="space-y-6 p-6">

{/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: TEXT, lineHeight: 1.2, margin: 0 }}>Analytics</h1>
            <p style={{ color: MUTED, fontSize: '14px', marginTop: '4px' }}>
              {'Overview of your organization activity'}
            </p>
          </div>
          <button
            onClick={function() { fetchAnalytics(true); }}
            disabled={refreshing}
            style={{ color: TEXT2, background: CARD, border: '1px solid ' + BDR }}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 self-start"
            aria-label="Refresh analytics data"
          >
            <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} aria-hidden="true" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {/* ── Date range filter ──────────────────────────────────── */}
        <div className="space-y-3">
          {/* Preset pills */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select date range">
            {DATE_RANGES.map(function(range) {
              var isActive = dateRange === range.value;
              return (
                <button
                  key={range.value}
                  onClick={function() { handleSelectPreset(range.value); }}
                  aria-pressed={isActive}
                  className={
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border ' +
                    (isActive
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600')
                  }
                >
                  {range.value === 'custom' && (
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                  )}
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Custom date inputs — shown when Custom Range is selected */}
          {dateRange === 'custom' && (
            <div
              style={{ background: CARD, border: '1px solid ' + BDR }}
              className="rounded-xl p-4"
              role="group"
              aria-label="Custom date range picker"
            >
              <div className="flex flex-wrap items-end gap-4">
                {/* From date */}
                <div>
                  <label
                    htmlFor="custom-start"
                    style={{ color: TEXT2 }}
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  >
                    From
                  </label>
                  <input
                    id="custom-start"
                    type="date"
                    value={customStart}
                    onChange={function(e) { setCustomStart(e.target.value); }}
                    max={customEnd || today}
                    aria-required="true"
                    style={{ color: TEXT, border: '1px solid ' + BDR, background: CARD }}
                    className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Arrow divider */}
                <div style={{ color: MUTED }} className="text-sm pb-2.5" aria-hidden="true">
                  &rarr;
                </div>

                {/* To date */}
                <div>
                  <label
                    htmlFor="custom-end"
                    style={{ color: TEXT2 }}
                    className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  >
                    To
                  </label>
                  <input
                    id="custom-end"
                    type="date"
                    value={customEnd}
                    onChange={function(e) { setCustomEnd(e.target.value); }}
                    min={customStart || undefined}
                    max={today}
                    aria-required="true"
                    style={{ color: TEXT, border: '1px solid ' + BDR, background: CARD }}
                    className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Apply */}
                <button
                  onClick={handleApplyCustomRange}
                  disabled={!customStart || !customEnd}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Apply
                </button>

                {/* Clear — only shown after a range has been applied */}
                {appliedStart && appliedEnd && (
                  <button
                    onClick={handleClearCustomRange}
                    style={{ color: MUTED }}
                    className="text-sm hover:text-slate-700 transition-colors focus:outline-none focus:underline pb-0.5"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Applied range confirmation */}
              {appliedStart && appliedEnd && (
                <p style={{ color: MUTED, fontSize: '12px', marginTop: '10px' }}>
                  Showing data from{' '}
                  <span style={{ color: TEXT2, fontWeight: 600 }}>
                    {formatCustomLabel(appliedStart, appliedEnd)}
                  </span>
                </p>
              )}

              {/* Hint — before applying */}
              {(!appliedStart || !appliedEnd) && customStart && !customEnd && (
                <p style={{ color: MUTED, fontSize: '12px', marginTop: '8px' }}>
                  Select an end date then click Apply.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Key statistics">
          {statCards.map(function(card) {
            var CardIcon = card.icon;
            return (
              <div
                key={card.label}
                role="listitem"
                className={'rounded-xl p-5 ' + card.bg}
                aria-label={card.label + ': ' + card.value}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={'text-xs font-semibold uppercase tracking-wide ' + card.val}>
                    {card.label}
                  </span>
                  <CardIcon className={'w-5 h-5 ' + card.val} aria-hidden="true" />
                </div>
                <p className={'text-3xl font-extrabold ' + card.val}>
                  {card.value.toLocaleString()}
                </p>
                {activeRangeLabel && (
                  <p style={{ color: MUTED, fontSize: '11px', marginTop: '4px' }}>
                    {activeRangeLabel}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Member growth chart ────────────────────────────────── */}
        <div style={{ background: CARD, border: '1px solid ' + BDR }} className="rounded-xl p-6">
          <h3 style={{ color: TEXT }} className="text-base font-bold mb-1">Member Growth</h3>
          <p style={{ color: MUTED }} className="text-sm mb-6">
            New and total members
            {activeRangeLabel ? ' \u00B7 ' + activeRangeLabel : ''}
          </p>
          {memberGrowth.length === 0 ? (
            <EmptyState
              icon={UserX}
              title="No membership data for this period"
              description="Try a different date range, or invite members to get started."
              actionLabel="Invite Members"
              onAction={function() { onNavigate && onNavigate('members'); }}
            />
          ) : (
            <div aria-label="Member growth line chart" role="img">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={memberGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px', color: '#475569' }} />
                  <Line type="monotone" dataKey="totalMembers" name="Total Members" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="newMembers"   name="New Members"   stroke="#22C55E" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#22C55E' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Event attendance chart ─────────────────────────────── */}
        <div style={{ background: CARD, border: '1px solid ' + BDR }} className="rounded-xl p-6">
          <h3 style={{ color: TEXT }} className="text-base font-bold mb-1">Event Attendance</h3>
          <p style={{ color: MUTED }} className="text-sm mb-6">
            Checked-in attendees per event
            {activeRangeLabel ? ' \u00B7 ' + activeRangeLabel : ''}
          </p>
          {eventAttendance.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="No attendance data for this period"
              description="Try a different date range, or create events and track attendance."
              actionLabel="Create Event"
              onAction={function() { onNavigate && onNavigate('events'); }}
            />
          ) : (
            <div aria-label="Event attendance bar chart" role="img">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={eventAttendance} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={function(value) { return [value, 'Attended']; }}
                    labelFormatter={function(label) { return 'Event: ' + label; }}
                  />
                  <Bar dataKey="attending" name="Attending" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}