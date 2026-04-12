import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast } from './MascotToast';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, Info, TrendingUp, DollarSign, Users, Percent, Minus } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

// ── Constants ─────────────────────────────────────────────────────────────────

var PLAN_PRICES = {
  starter: { monthly: 19.99, annual_mo: 16.66 },
  growth:  { monthly: 39.00, annual_mo: 32.50 },
  pro:     { monthly: 69.00, annual_mo: 57.50 }
};

var PLAN_COLORS = { starter: '#3B82F6', growth: '#8B5CF6', pro: '#F5B731' };

var MILESTONES = [
  { label: 'Break-even (~3 Starter orgs)', target: 47,    type: 'mrr' },
  { label: 'First $500 MRR',               target: 500,   type: 'mrr' },
  { label: 'First $1,000 MRR',             target: 1000,  type: 'mrr' },
  { label: 'First $2,500 MRR',             target: 2500,  type: 'mrr' },
  { label: 'First $5,000 MRR',             target: 5000,  type: 'mrr' },
  { label: 'First $10,000 MRR',            target: 10000, type: 'mrr' },
  { label: 'First $25,000 MRR',            target: 25000, type: 'mrr' },
  { label: '100 paying orgs',              target: 100,   type: 'orgs' },
  { label: '250 paying orgs',              target: 250,   type: 'orgs' },
  { label: '500 paying orgs',              target: 500,   type: 'orgs' },
];

var INFRA_DEFAULTS = { supabase_cost: 25, vercel_cost: 20, resend_cost: 0, other_cost: 0 };

var CONTENT_KEYS = ['infra_cost_supabase', 'infra_cost_vercel', 'infra_cost_resend', 'infra_cost_other', 'revenue_monthly_goal'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return '$' + Math.round(n).toLocaleString();
}

function fmtDecimal(n) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function goalBarColor(pct) {
  if (pct < 25) return '#64748B';
  if (pct < 50) return '#F5B731';
  if (pct < 80) return '#3B82F6';
  return '#22C55E';
}

function subMRR(sub) {
  var p = PLAN_PRICES[sub.plan];
  if (!p) return 0;
  return sub.billing_interval === 'annual' ? p.annual_mo : p.monthly;
}

// ── Custom tooltip for recharts ───────────────────────────────────────────────

function ChartTooltip(props) {
  var active = props.active;
  var payload = props.payload;
  var label = props.label;
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '8px', padding: '10px 14px' }}>
      <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
      {payload.map(function (entry) {
        return (
          <p key={entry.name} style={{ fontSize: '14px', fontWeight: 700, color: entry.color, margin: 0 }}>
            {fmtDecimal(entry.value)}
          </p>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StaffGoals() {
  var [loading,     setLoading]     = useState(true);
  var [subs,        setSubs]        = useState([]);
  var [historyData, setHistoryData] = useState([]);
  var [infra,       setInfra]       = useState({ supabase_cost: 25, vercel_cost: 20, resend_cost: 0, other_cost: 0 });
  var [monthlyGoal, setMonthlyGoal] = useState(5000);
  var [proj,        setProj]        = useState({ starter: 0, growth: 0, pro: 0, tickets: 0 });
  var [period,      setPeriod]      = useState('monthly'); // monthly | quarterly | yearly
  var [savingKey,   setSavingKey]   = useState(null);

  useEffect(function () { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadSubs(), loadSiteContent()]);
    setLoading(false);
  }

  async function loadSubs() {
    var { data, error } = await supabase
      .from('subscriptions')
      .select('plan, billing_interval, status, created_at, canceled_at')
      .eq('status', 'active');
    if (error) { toast.error('Failed to load subscription data.'); return; }
    var rows = data || [];
    setSubs(rows);
    buildHistory(rows);
  }

  async function loadSiteContent() {
    var { data } = await supabase
      .from('site_content')
      .select('key, value')
      .in('key', CONTENT_KEYS);
    if (!data) return;
    var map = {};
    data.forEach(function (row) { map[row.key] = row.value; });
    setInfra({
      supabase_cost: parseFloat(map['infra_cost_supabase'] || 25),
      vercel_cost:   parseFloat(map['infra_cost_vercel']   || 20),
      resend_cost:   parseFloat(map['infra_cost_resend']   || 0),
      other_cost:    parseFloat(map['infra_cost_other']    || 0),
    });
    if (map['revenue_monthly_goal']) setMonthlyGoal(parseFloat(map['revenue_monthly_goal']));
  }

async function saveContent(key, value) {
    setSavingKey(key);
    var { data: { user } } = await supabase.auth.getUser();

    var { data: existing } = await supabase
      .from('site_content')
      .select('id')
      .eq('key', key)
      .maybeSingle();

    var error;
    if (existing) {
      var res = await supabase
        .from('site_content')
        .update({ value: String(value), updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('key', key);
      error = res.error;
    } else {
      var res = await supabase
        .from('site_content')
        .insert({
          key: key,
          value: String(value),
          label: key,
          section: 'staff',
          field_type: 'text',
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        });
      error = res.error;
    }

    setSavingKey(null);
    if (error) { toast.error('Failed to save.'); } else { mascotSuccessToast('Saved.'); }
  }

  // Build 12-month history from subscription created_at / canceled_at
  function buildHistory(rows) {
    var now = new Date();
    var months = [];
    for (var i = 11; i >= 0; i--) {
      var start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      var mrr   = 0;
      rows.forEach(function (sub) {
        var created   = new Date(sub.created_at);
        var canceled = sub.canceled_at ? new Date(sub.canceled_at) : null;
        var activeInMonth = created <= end && (!canceled || canceled > start);
        if (activeInMonth) mrr += subMRR(sub);
      });
      months.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        mrr:   Math.round(mrr * 100) / 100
      });
    }
    setHistoryData(months);
  }

  // ── Derived numbers ────────────────────────────────────────────────────────

  function computeMRR() {
    var total = 0;
    var byPlan = {
      starter: { count: 0, mrr: 0, mo: 0, yr: 0 },
      growth:  { count: 0, mrr: 0, mo: 0, yr: 0 },
      pro:     { count: 0, mrr: 0, mo: 0, yr: 0 },
    };
    subs.forEach(function (sub) {
      var rev = subMRR(sub);
      total += rev;
      var b = byPlan[sub.plan];
      if (!b) return;
      b.count++;
      b.mrr += rev;
      var isAnnual = sub.billing_interval === 'annual' || sub.interval === 'annual';
      if (isAnnual) { b.yr++; } else { b.mo++; }
    });
    return { total: Math.round(total * 100) / 100, byPlan: byPlan };
  }

  var mrrData    = computeMRR();
  var totalInfra = infra.supabase_cost + infra.vercel_cost + infra.resend_cost + infra.other_cost;
  var netMRR     = mrrData.total - totalInfra;
  var margin     = mrrData.total > 0 ? Math.round((netMRR / mrrData.total) * 100) : 0;
  var totalOrgs  = subs.length;
  var goalPct    = monthlyGoal > 0 ? Math.min(100, Math.round((mrrData.total / monthlyGoal) * 100)) : 0;

  var periodMultiplier = period === 'yearly' ? 12 : period === 'quarterly' ? 3 : 1;
  var periodLabel      = period === 'yearly' ? 'Year' : period === 'quarterly' ? 'Quarter' : 'Month';

  // Projection
  var projAdded = proj.starter * PLAN_PRICES.starter.monthly
                + proj.growth  * PLAN_PRICES.growth.monthly
                + proj.pro     * PLAN_PRICES.pro.monthly
                + proj.tickets;
  var projTotal  = mrrData.total + projAdded;
  var projNet    = projTotal - totalInfra;
  var projMargin = projTotal > 0 ? Math.round((projNet / projTotal) * 100) : 0;

  // Insights
  function getInsights() {
    var list = [];
    var gShare  = mrrData.total > 0 ? Math.round((mrrData.byPlan.growth.mrr / mrrData.total) * 100) : 0;
    var gOrgPct = totalOrgs > 0 ? Math.round((mrrData.byPlan.growth.count / totalOrgs) * 100) : 0;
    if (gShare > gOrgPct && gShare > 0) {
      list.push('Growth plan orgs generate ' + gShare + '% of MRR despite being only ' + gOrgPct + '% of org count. Prioritize Growth conversions.');
    }
    var gap = monthlyGoal - mrrData.total;
    if (gap > 0 && monthlyGoal > 0) {
      var gNeeded = Math.ceil(gap / PLAN_PRICES.growth.monthly);
      var pNeeded = Math.ceil(gap / PLAN_PRICES.pro.monthly);
      list.push(fmt(gap) + ' away from your ' + fmt(monthlyGoal) + ' goal. Adding ' + gNeeded + ' Growth or ' + pNeeded + ' Pro orgs would get you there.');
    }
    if (mrrData.byPlan.pro.count > 0 && mrrData.byPlan.starter.count > 0) {
      list.push('Pro subscriptions generate ' + fmt(PLAN_PRICES.pro.monthly) + '/org — Starter requires 3.5x more customers for equivalent revenue.');
    }
    if (margin < 0) {
      list.push('Infrastructure costs currently exceed revenue. You need ' + Math.ceil(totalInfra / PLAN_PRICES.starter.monthly) + ' Starter orgs just to break even on infra.');
    }
    return list;
  }

  // ── Skeleton pieces ────────────────────────────────────────────────────────

  function KpiSkeleton() {
    return (
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '10px', padding: '16px', height: '80px' }}>
        <div style={{ width: '60%', height: '22px', background: '#1E2845', borderRadius: '4px', margin: '0 auto 8px' }} />
        <div style={{ width: '40%', height: '12px', background: '#1E2845', borderRadius: '4px', margin: '0 auto' }} />
      </div>
    );
  }

  // ── KPI card ───────────────────────────────────────────────────────────────

  function KpiCard(props) {
    var label = props.label;
    var value = props.value;
    var sub   = props.sub;
    var color = props.color || '#FFFFFF';
    var Icon  = props.icon;
    return (
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
        {Icon && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <Icon size={16} color={color} aria-hidden="true" />
          </div>
        )}
        <div style={{ fontSize: '22px', fontWeight: 800, color: color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{sub}</div>}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Revenue Goals</h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>Live MRR, projections, milestones, and growth tracking.</p>
        </div>

        {/* Period toggle */}
        <div style={{ display: 'flex', gap: '4px', background: '#1A2035', border: '1px solid #2A3550', borderRadius: '8px', padding: '3px' }} role="group" aria-label="Select time period">
          {['monthly', 'quarterly', 'yearly'].map(function (p) {
            var on = period === p;
            return (
              <button
                key={p}
                onClick={function () { setPeriod(p); }}
                aria-pressed={on}
                style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: on ? '#3B82F6' : 'transparent',
                  color: on ? '#FFFFFF' : '#64748B'
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {loading ? (
          [1,2,3,4,5].map(function (i) { return <KpiSkeleton key={i} />; })
        ) : (
          <>
            <KpiCard
              label={periodLabel + ' Revenue'}
              value={fmtDecimal(mrrData.total * periodMultiplier)}
              sub={'actual from subscriptions'}
              color="#3B82F6"
              icon={DollarSign}
            />
            <KpiCard
              label="ARR"
              value={fmtDecimal(mrrData.total * 12)}
              sub="MRR × 12"
              color="#8B5CF6"
              icon={TrendingUp}
            />
            <KpiCard
              label={'Net / ' + periodLabel}
              value={fmtDecimal(netMRR * periodMultiplier)}
              sub={'after $' + Math.round(totalInfra) + '/mo infra'}
              color={netMRR >= 0 ? '#22C55E' : '#EF4444'}
              icon={Minus}
            />
            <KpiCard
              label="Margin"
              value={margin + '%'}
              color={margin >= 70 ? '#22C55E' : margin >= 40 ? '#F5B731' : '#EF4444'}
              icon={Percent}
            />
            <KpiCard
              label="Active Orgs"
              value={totalOrgs}
              sub={'paying subscribers'}
              color="#F5B731"
              icon={Users}
            />
          </>
        )}
      </div>

      {/* ── Monthly goal + progress ── */}
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
            Monthly Revenue Goal
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>$</span>
            <input
              type="number"
              min="0"
              value={monthlyGoal}
              onChange={function (e) { setMonthlyGoal(parseFloat(e.target.value) || 0); }}
              onBlur={function () { saveContent('revenue_monthly_goal', monthlyGoal); }}
              aria-label="Monthly revenue goal in dollars"
              style={{ width: '90px', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '5px 8px', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, textAlign: 'right', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
            />
            <span style={{ fontSize: '11px', color: '#64748B' }}>{savingKey === 'revenue_monthly_goal' ? 'saving…' : ''}</span>
          </div>
        </div>
        <div
          style={{ background: '#0E1523', borderRadius: '99px', height: '10px', overflow: 'hidden' }}
          role="progressbar"
          aria-valuenow={goalPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={'Revenue goal progress: ' + goalPct + '%'}
        >
          <div style={{ width: goalPct + '%', height: '100%', background: goalBarColor(goalPct), borderRadius: '99px', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>{fmtDecimal(mrrData.total)} actual MRR</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: goalBarColor(goalPct) }}>{goalPct}% of {fmt(monthlyGoal)} goal</span>
        </div>
      </div>

      {/* ── Plan breakdown + Infra costs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Plan breakdown */}
        <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>
            Plan Breakdown
          </p>
          {loading ? (
            [1,2,3].map(function (i) { return <div key={i} style={{ height: '56px', background: '#0E1523', borderRadius: '8px', marginBottom: '8px' }} />; })
          ) : (
            ['starter', 'growth', 'pro'].map(function (plan) {
              var d = mrrData.byPlan[plan];
              var pct = mrrData.total > 0 ? Math.round((d.mrr / mrrData.total) * 100) : 0;
              return (
                <div key={plan} style={{ padding: '11px 14px', background: '#0E1523', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: PLAN_COLORS[plan], textTransform: 'capitalize' }}>{plan}</span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>{d.count} org{d.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{fmtDecimal(d.mrr * periodMultiplier)}</span>
                      <span style={{ fontSize: '10px', color: '#64748B', marginLeft: '4px' }}>/{periodLabel.toLowerCase()}</span>
                    </div>
                  </div>
                  <div style={{ background: '#1A2035', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: PLAN_COLORS[plan], borderRadius: '99px' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                    {d.mo} monthly · {d.yr} annual · {pct}% of MRR
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Infrastructure costs */}
        <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>
            Infrastructure Costs
          </p>
          {[
            { key: 'supabase_cost', label: 'Supabase',  dbKey: 'infra_cost_supabase' },
            { key: 'vercel_cost',   label: 'Vercel',    dbKey: 'infra_cost_vercel' },
            { key: 'resend_cost',   label: 'Resend',    dbKey: 'infra_cost_resend' },
            { key: 'other_cost',    label: 'Other',     dbKey: 'infra_cost_other' },
          ].map(function (row) {
            return (
              <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <label htmlFor={'infra-' + row.key} style={{ fontSize: '12px', color: '#94A3B8', width: '68px' }}>{row.label}</label>
                <span style={{ fontSize: '12px', color: '#64748B' }}>$</span>
                <input
                  id={'infra-' + row.key}
                  type="text" inputMode="numeric"
                  min="0"
                  value={infra[row.key]}
                  onChange={function (e) {
                    var k = row.key;
                    var v = parseFloat(e.target.value) || 0;
                    setInfra(function (p) { var n = Object.assign({}, p); n[k] = v; return n; });
                  }}
                  onBlur={function () { saveContent(row.dbKey, infra[row.key]); }}
                  style={{ width: '72px', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '5px 8px', color: '#FFFFFF', fontSize: '13px', textAlign: 'right', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  aria-label={row.label + ' monthly cost in dollars'}
                />
                <span style={{ fontSize: '12px', color: '#64748B' }}>/mo</span>
              </div>
            );
          })}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #2A3550', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Total infra / mo</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444' }}>-${Math.round(totalInfra)}</span>
          </div>
          <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Net MRR</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: netMRR >= 0 ? '#22C55E' : '#EF4444' }}>{fmtDecimal(netMRR)}</span>
          </div>
        </div>
      </div>

      {/* ── MRR history chart ── */}
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>
          MRR — Last 12 Months
        </p>
        {loading ? (
          <div style={{ height: '200px', background: '#0E1523', borderRadius: '8px' }} aria-label="Loading chart" role="status" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3550" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={function (v) { return '$' + v; }} width={48} />
              <Tooltip content={ChartTooltip} />
              {monthlyGoal > 0 && (
                <ReferenceLine y={monthlyGoal} stroke="#22C55E" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#22C55E', fontSize: 10, position: 'insideTopRight' }} />
              )}
              <Line type="monotone" dataKey="mrr" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} name="MRR" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Projection simulator ── */}
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>
          Revenue Projection Simulator
        </p>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px' }}>
          Model growth scenarios on top of actual data. Sliders use monthly billing rates.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          {[
            { key: 'starter', label: 'Additional Starter Orgs',  max: 500, rate: PLAN_PRICES.starter.monthly, prefix: '' },
            { key: 'growth',  label: 'Additional Growth Orgs',   max: 300, rate: PLAN_PRICES.growth.monthly,  prefix: '' },
            { key: 'pro',     label: 'Additional Pro Orgs',      max: 200, rate: PLAN_PRICES.pro.monthly,     prefix: '' },
            { key: 'tickets', label: 'Est. Ticket Fees / month', max: 5000, rate: 1, prefix: '$' },
          ].map(function (s) {
            var added = s.key === 'tickets' ? proj[s.key] : proj[s.key] * s.rate;
            return (
              <div key={s.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label htmlFor={'proj-' + s.key} style={{ fontSize: '12px', color: '#94A3B8' }}>{s.label}</label>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: PLAN_COLORS[s.key] || '#3B82F6' }}>
                      {s.prefix}{proj[s.key]}
                    </span>
                    {added > 0 && (
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '5px' }}>+{fmt(added)}/mo</span>
                    )}
                  </div>
                </div>
                <input
                  id={'proj-' + s.key}
                  type="range"
                  min="0"
                  max={s.max}
                  value={proj[s.key]}
                  onChange={function (e) {
                    var k = s.key;
                    var v = parseInt(e.target.value);
                    setProj(function (p) { var n = Object.assign({}, p); n[k] = v; return n; });
                  }}
                  style={{ width: '100%', accentColor: PLAN_COLORS[s.key] || '#3B82F6', cursor: 'pointer' }}
                  aria-label={s.label}
                  aria-valuemin={0}
                  aria-valuemax={s.max}
                  aria-valuenow={proj[s.key]}
                />
              </div>
            );
          })}
        </div>

        {/* Projection result */}
        {projAdded > 0 && (
          <div style={{ marginTop: '18px', padding: '14px 18px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>
              Projected Outcome (Monthly)
            </p>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Projected MRR</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#3B82F6' }}>{fmtDecimal(projTotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Projected Net</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: projNet >= 0 ? '#22C55E' : '#EF4444' }}>{fmtDecimal(projNet)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Projected Margin</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F5B731' }}>{projMargin}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Added MRR</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#8B5CF6' }}>+{fmt(projAdded)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Milestone tracker ── */}
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>
          Milestones
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {MILESTONES.map(function (m) {
            var achieved = m.type === 'mrr' ? mrrData.total >= m.target : totalOrgs >= m.target;
            var current  = m.type === 'mrr' ? mrrData.total : totalOrgs;
            var pct      = Math.min(100, Math.round((current / m.target) * 100));
            return (
              <div
                key={m.label}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 13px', background: '#0E1523', borderRadius: '8px', border: '1px solid ' + (achieved ? 'rgba(34,197,94,0.2)' : '#1E2845') }}
              >
                {achieved
                  ? <CheckCircle size={16} color="#22C55E" aria-label="Achieved" style={{ flexShrink: 0, marginTop: '1px' }} />
                  : <Circle     size={16} color="#2A3550" aria-label="Not yet achieved" style={{ flexShrink: 0, marginTop: '1px' }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: achieved ? '#FFFFFF' : '#64748B', margin: '0 0 4px' }}>{m.label}</p>
                  {!achieved && (
                    <div>
                      <div style={{ background: '#1A2035', borderRadius: '99px', height: '3px', overflow: 'hidden', marginBottom: '2px' }}>
                        <div style={{ width: pct + '%', height: '100%', background: '#2A3550', borderRadius: '99px' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748B' }}>{pct}% there</span>
                    </div>
                  )}
                  {achieved && <span style={{ fontSize: '11px', color: '#22C55E' }}>Achieved</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Insights ── */}
      {!loading && getInsights().length > 0 && (
        <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>
            Insights
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {getInsights().map(function (insight, i) {
              return (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '11px 13px', background: '#0E1523', borderRadius: '8px' }}>
                  <Info size={14} color="#3B82F6" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.55 }}>{insight}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}