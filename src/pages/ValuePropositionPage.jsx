import { useState } from 'react';
import {
  Calculator,
  Download,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Users,
  Mail,
  Globe,
  FileText,
  Folder,
  Tag,
  ArrowRight,
  Info,
  RotateCcw,
} from 'lucide-react';

// ─── Syndicade plan data (matches Master Status pricing) ──────────────────────
var PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29.99,
    annualPrice: 299.90,
    annualMonthlyRate: 24.99,
    color: '#3B82F6',
    highlight: false,
    memberLimit: '50 members',
    features: [
      'Up to 50 members',
      '1 public page',
      '2 GB document storage',
      'Events & RSVPs',
      'Polls, surveys & forms',
      'Announcements',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 49.99,
    annualPrice: 499.90,
    annualMonthlyRate: 41.66,
    color: '#22C55E',
    highlight: true,
    memberLimit: '150 members',
    features: [
      'Up to 150 members',
      '7 public pages',
      '10 GB document storage',
      'Email blasts (500/mo)',
      'Newsletter builder',
      'Paid ticketing & dues',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 69.99,
    annualPrice: 699.90,
    annualMonthlyRate: 58.32,
    color: '#8B5CF6',
    highlight: false,
    memberLimit: '300 members',
    features: [
      'Up to 300 members',
      'Unlimited pages',
      '30 GB document storage',
      'Unlimited email blasts',
      'AI assistant',
      'Priority support',
    ],
  },
];

// ─── Standard tool categories ──────────────────────────────────────────────────
var CATEGORIES = [
  { id: 'member_mgmt', label: 'Member Management',      hint: 'Wild Apricot, MemberClicks, Neon CRM', Icon: Users    },
  { id: 'email',       label: 'Email Marketing',         hint: 'Mailchimp, Constant Contact, Klaviyo',  Icon: Mail     },
  { id: 'website',     label: 'Website / Page Builder',  hint: 'Squarespace, Wix, WordPress',           Icon: Globe    },
  { id: 'forms',       label: 'Forms & Surveys',         hint: 'Typeform, SurveyMonkey, Jotform',       Icon: FileText },
  { id: 'storage',     label: 'Document Storage',        hint: 'Google Drive, Dropbox, Box',            Icon: Folder   },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
  return '$' + Math.round(val).toLocaleString('en-US');
}
function fmtDec(val) {
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function buildInitialCosts() {
  var obj = {};
  CATEGORIES.forEach(function (c) { obj[c.id] = { monthly: '', toolName: '' }; });
  return obj;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ValuePropositionPage() {
  var [orgName,         setOrgName]         = useState('');
  var [billingCycle,    setBillingCycle]    = useState('annual');
  var [costs,           setCosts]           = useState(buildInitialCosts);
  var [ticketing,       setTicketing]       = useState({
    toolName: '', flatFeePerTicket: '', pctFeePerTicket: '', avgTicketPrice: '', ticketsPerYear: '',
  });
  var [additionalCosts, setAdditionalCosts] = useState([]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  function updateCost(catId, field, value) {
    setCosts(function (prev) {
      var next = Object.assign({}, prev);
      next[catId] = Object.assign({}, prev[catId], { [field]: value });
      return next;
    });
  }
  function updateTicketing(field, value) {
    setTicketing(function (prev) { return Object.assign({}, prev, { [field]: value }); });
  }
  function addAdditional() {
    setAdditionalCosts(function (prev) {
      return prev.concat([{ id: Date.now(), label: '', monthly: '' }]);
    });
  }
  function removeAdditional(id) {
    setAdditionalCosts(function (prev) { return prev.filter(function (i) { return i.id !== id; }); });
  }
  function updateAdditional(id, field, value) {
    setAdditionalCosts(function (prev) {
      return prev.map(function (item) {
        return item.id === id ? Object.assign({}, item, { [field]: value }) : item;
      });
    });
  }
  function handleReset() {
    setCosts(buildInitialCosts());
    setTicketing({ toolName: '', flatFeePerTicket: '', pctFeePerTicket: '', avgTicketPrice: '', ticketsPerYear: '' });
    setAdditionalCosts([]);
    setOrgName('');
  }

  // ── Calculations ─────────────────────────────────────────────────────────────
  function getTicketingAnnualCost() {
    var tickets = parseFloat(ticketing.ticketsPerYear)   || 0;
    var flat    = parseFloat(ticketing.flatFeePerTicket) || 0;
    var pct     = parseFloat(ticketing.pctFeePerTicket)  || 0;
    var avg     = parseFloat(ticketing.avgTicketPrice)   || 0;
    return (tickets * flat) + (tickets * avg * (pct / 100));
  }
  function getCurrentAnnualTotal() {
    var total = 0;
    CATEGORIES.forEach(function (c) { total += (parseFloat(costs[c.id].monthly) || 0) * 12; });
    additionalCosts.forEach(function (i) { total += (parseFloat(i.monthly) || 0) * 12; });
    total += getTicketingAnnualCost();
    return total;
  }
  function getSyndicadeAnnualCost(plan) {
    var base    = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice * 12;
    var tickets = parseFloat(ticketing.ticketsPerYear) || 0;
    return base + (tickets * 1.00);
  }
  function getSavings(plan) {
    return getCurrentAnnualTotal() - getSyndicadeAnnualCost(plan);
  }

  var currentTotal = getCurrentAnnualTotal();
  var hasData      = currentTotal > 0;
  var today        = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Shared inline styles ─────────────────────────────────────────────────────
  var inputBase = {
    padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px',
    fontSize: '14px', background: '#FFFFFF', color: '#0E1523',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
  };
  var inputWithDollar = Object.assign({}, inputBase, { paddingLeft: '24px' });
  var labelSm = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main
      style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif" }}
      aria-label="Syndicade cost comparison tool"
    >

      {/* ── Global styles (print + focus) ────────────────────────────────────── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #syndicade-print { display: block !important; position: static !important; }
          @page { margin: 0.65in; size: letter; }
        }
        @media screen { #syndicade-print { display: none; } }
        .vp-focus:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; border-radius: 4px; }
        .vp-input:focus { border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
      `}</style>

      {/* ── Main screen content ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '56px 24px 88px' }}>

        {/* Page header */}
        <header style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '14px' }}>
            Cost Comparison Tool
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#0E1523', lineHeight: 1.15, marginBottom: '18px', margin: '0 0 18px' }}>
            Build Your Case for{' '}
            <span style={{ color: '#0E1523' }}>Syndi</span><span style={{ color: '#F5B731' }}>cade</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', maxWidth: '580px', lineHeight: 1.65, margin: 0 }}>
            Enter what you currently pay for separate tools. See exactly how much your organization could save — then download a PDF to share with your board.
          </p>
        </header>

        {/* Org name + billing row */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '44px', flexWrap: 'wrap' }}>
          <div>
            <label htmlFor="org-name" style={labelSm}>Organization name (shown on PDF)</label>
            <input
              id="org-name"
              type="text"
              className="vp-input"
              value={orgName}
              onChange={function (e) { setOrgName(e.target.value); }}
              placeholder="e.g. Toledo Food Bank"
              aria-label="Organization name for PDF report"
              style={Object.assign({}, inputBase, { width: '260px' })}
            />
          </div>

          <div>
            <div style={labelSm} id="billing-cycle-label">Compare on</div>
            <div role="group" aria-labelledby="billing-cycle-label" style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
              {['annual', 'monthly'].map(function (cycle) {
                var isActive = billingCycle === cycle;
                return (
                  <button
                    key={cycle}
                    onClick={function () { setBillingCycle(cycle); }}
                    aria-pressed={isActive}
                    className="vp-focus"
                    style={{
                      padding: '9px 20px', fontSize: '14px', fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      background: isActive ? '#0E1523' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#475569',
                    }}
                  >
                    {cycle === 'annual' ? 'Annual' : 'Monthly'}
                  </button>
                );
              })}
            </div>
          </div>

          {billingCycle === 'annual' && (
            <div style={{ paddingBottom: '8px', fontSize: '13px', color: '#22C55E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle size={13} aria-hidden="true" />
              Annual saves 2 months vs monthly
            </div>
          )}

          <button
            onClick={handleReset}
            className="vp-focus"
            aria-label="Reset all cost inputs"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#64748B', cursor: 'pointer', marginLeft: 'auto' }}
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-8" style={{ alignItems: 'start' }}>

          {/* ── LEFT: Inputs ──────────────────────────────────────────────────── */}
          <section aria-label="Enter current tool costs">
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Calculator size={20} color="#3B82F6" aria-hidden="true" />
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0E1523', margin: 0 }}>Your Current Tools</h2>
              </div>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px', lineHeight: 1.5 }}>
                Enter your current monthly cost for each category. Leave blank for tools you don't use.
              </p>

              {/* Standard categories */}
              {CATEGORIES.map(function (cat) {
                var IconComp = cat.Icon;
                return (
                  <div key={cat.id} style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                      <IconComp size={14} color="#94A3B8" aria-hidden="true" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0E1523' }}>{cat.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: '0 0 112px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px', pointerEvents: 'none' }}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="vp-input"
                          value={costs[cat.id].monthly}
                          onChange={function (e) { updateCost(cat.id, 'monthly', e.target.value); }}
                          placeholder="0.00"
                          aria-label={cat.label + ' monthly cost'}
                          style={Object.assign({}, inputWithDollar)}
                        />
                      </div>
                      <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>/mo</span>
                      <input
                        type="text"
                        className="vp-input"
                        value={costs[cat.id].toolName}
                        onChange={function (e) { updateCost(cat.id, 'toolName', e.target.value); }}
                        placeholder={cat.hint}
                        aria-label={cat.label + ' tool name'}
                        style={Object.assign({}, inputBase, { flex: 1, fontSize: '13px', color: '#475569' })}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Event ticketing */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '22px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                  <Tag size={14} color="#94A3B8" aria-hidden="true" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0E1523' }}>Event Ticketing Fees</span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px', lineHeight: 1.5 }}>
                  Eventbrite charges ~$0.99–$1.79 flat + 3.7% per ticket. Enter whatever your platform charges.
                </p>

                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="ticketing-tool" style={labelSm}>Ticketing platform (optional)</label>
                  <input
                    id="ticketing-tool"
                    type="text"
                    className="vp-input"
                    value={ticketing.toolName}
                    onChange={function (e) { updateTicketing('toolName', e.target.value); }}
                    placeholder="e.g. Eventbrite"
                    style={Object.assign({}, inputBase, { fontSize: '13px' })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label htmlFor="flat-fee" style={labelSm}>Flat fee / ticket</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px', pointerEvents: 'none' }}>$</span>
                      <input id="flat-fee" type="number" min="0" step="0.01" className="vp-input"
                        value={ticketing.flatFeePerTicket}
                        onChange={function (e) { updateTicketing('flatFeePerTicket', e.target.value); }}
                        placeholder="0.99"
                        style={Object.assign({}, inputWithDollar, { fontSize: '13px' })}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pct-fee" style={labelSm}>Percentage fee / ticket</label>
                    <div style={{ position: 'relative' }}>
                      <input id="pct-fee" type="number" min="0" step="0.1" className="vp-input"
                        value={ticketing.pctFeePerTicket}
                        onChange={function (e) { updateTicketing('pctFeePerTicket', e.target.value); }}
                        placeholder="3.7"
                        style={Object.assign({}, inputBase, { paddingRight: '28px', fontSize: '13px' })}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px', pointerEvents: 'none' }}>%</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="avg-price" style={labelSm}>Avg ticket price</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px', pointerEvents: 'none' }}>$</span>
                      <input id="avg-price" type="number" min="0" step="1" className="vp-input"
                        value={ticketing.avgTicketPrice}
                        onChange={function (e) { updateTicketing('avgTicketPrice', e.target.value); }}
                        placeholder="25"
                        style={Object.assign({}, inputWithDollar, { fontSize: '13px' })}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="tickets-year" style={labelSm}>Tickets sold / year</label>
                    <input id="tickets-year" type="number" min="0" step="1" className="vp-input"
                      value={ticketing.ticketsPerYear}
                      onChange={function (e) { updateTicketing('ticketsPerYear', e.target.value); }}
                      placeholder="200"
                      style={Object.assign({}, inputBase, { fontSize: '13px' })}
                    />
                  </div>
                </div>

                {getTicketingAnnualCost() > 0 && (
                  <div style={{ fontSize: '13px', color: '#475569', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={13} color="#94A3B8" aria-hidden="true" />
                    Estimated annual ticketing cost:{' '}
                    <strong style={{ color: '#0E1523' }}>{fmt(getTicketingAnnualCost())}</strong>
                  </div>
                )}
              </div>

              {/* Custom additional rows */}
              {additionalCosts.map(function (item) {
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <input type="text" className="vp-input"
                      value={item.label}
                      onChange={function (e) { updateAdditional(item.id, 'label', e.target.value); }}
                      placeholder="Tool name"
                      aria-label="Additional tool name"
                      style={Object.assign({}, inputBase, { flex: 1, fontSize: '13px' })}
                    />
                    <div style={{ position: 'relative', flex: '0 0 100px' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px', pointerEvents: 'none' }}>$</span>
                      <input type="number" min="0" step="0.01" className="vp-input"
                        value={item.monthly}
                        onChange={function (e) { updateAdditional(item.id, 'monthly', e.target.value); }}
                        placeholder="0.00"
                        aria-label="Additional tool monthly cost"
                        style={Object.assign({}, inputWithDollar, { fontSize: '13px' })}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>/mo</span>
                    <button
                      onClick={function () { removeAdditional(item.id); }}
                      aria-label="Remove this additional cost"
                      className="vp-focus"
                      style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFFFFF', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={addAdditional}
                className="vp-focus"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', border: '1px dashed #CBD5E1', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#64748B', marginTop: '4px' }}
              >
                <Plus size={13} aria-hidden="true" />
                Add another tool
              </button>
            </div>
          </section>

          {/* ── RIGHT: Live results ───────────────────────────────────────────── */}
          <section aria-label="Cost comparison results">

            {/* Current total */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
                Your Current Annual Spend
              </div>
              <div
                aria-live="polite"
                aria-label={'Current annual spend: ' + (hasData ? fmt(currentTotal) : 'not yet calculated')}
                style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1, color: hasData ? '#EF4444' : '#CBD5E1' }}
              >
                {hasData ? fmt(currentTotal) : '$—'}
              </div>
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>
                {hasData
                  ? fmt(currentTotal / 12) + '/month across all tools'
                  : 'Enter your current tool costs to see a comparison'}
              </div>
            </div>

            {/* Plan comparison cards */}
            {PLANS.map(function (plan) {
              var synCost  = getSyndicadeAnnualCost(plan);
              var savings  = getSavings(plan);
              var pctSaved = currentTotal > 0 ? Math.round((savings / currentTotal) * 100) : 0;

              return (
                <article
                  key={plan.id}
                  aria-label={'Syndicade ' + plan.name + ' plan'}
                  style={{
                    background: '#FFFFFF',
                    border: plan.highlight ? ('2px solid ' + plan.color) : '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '16px',
                    position: 'relative',
                  }}
                >
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: '-12px', left: '24px', background: plan.color, color: '#FFFFFF', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Most Popular
                    </div>
                  )}

                  {/* Plan name + cost */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '19px', fontWeight: 700, color: '#0E1523' }}>{plan.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                        {billingCycle === 'annual'
                          ? (fmtDec(plan.annualPrice) + '/yr  \u00b7  ' + fmtDec(plan.annualMonthlyRate) + '/mo effective')
                          : (fmtDec(plan.monthlyPrice) + '/month')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div aria-live="polite" style={{ fontSize: '30px', fontWeight: 800, color: plan.color, lineHeight: 1 }}>{fmt(synCost)}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>per year total</div>
                    </div>
                  </div>

                  {/* Savings callout */}
                  {hasData && (
                    <div style={{
                      background: savings > 0 ? '#F0FDF4' : '#FEF2F2',
                      border: '1px solid ' + (savings > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'),
                      borderRadius: '10px', padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      marginBottom: '16px',
                    }}>
                      {savings > 0
                        ? <TrendingDown size={16} color="#22C55E" aria-hidden="true" />
                        : <TrendingUp   size={16} color="#EF4444" aria-hidden="true" />
                      }
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: savings > 0 ? '#15803D' : '#DC2626' }}>
                          {savings > 0
                            ? ('Save ' + fmt(savings) + '/yr  (' + pctSaved + '% less)')
                            : ('Costs ' + fmt(Math.abs(savings)) + ' more per year')}
                        </div>
                        {savings > 0 && (
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            That's {fmt(savings / 12)}/month back in your mission budget
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: hasData && parseFloat(ticketing.ticketsPerYear) > 0 ? '12px' : '0' }}>
                    {plan.features.map(function (f) {
                      return (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                          <CheckCircle size={12} color={plan.color} aria-hidden="true" />
                          {f}
                        </div>
                      );
                    })}
                  </div>

                  {parseFloat(ticketing.ticketsPerYear) > 0 && (
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
                      Ticket fees: {parseFloat(ticketing.ticketsPerYear) || 0} tickets &times; $1 flat ={' '}
                      <strong style={{ color: '#0E1523' }}>{fmt((parseFloat(ticketing.ticketsPerYear) || 0) * 1)}</strong>{' '}
                      — no percentage cut on your revenue
                    </div>
                  )}
                </article>
              );
            })}

            {/* PDF download */}
            {hasData && (
              <>
                <button
                  onClick={function () { window.print(); }}
                  className="vp-focus"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', width: '100%', padding: '14px',
                    background: '#0E1523', color: '#FFFFFF',
                    border: 'none', borderRadius: '12px',
                    fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  <Download size={17} aria-hidden="true" />
                  Download PDF Comparison
                </button>
                <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', marginBottom: '12px', margin: '0 0 12px' }}>
                  A print dialog will open — choose "Save as PDF" to download.
                </p>
              </>
            )}

            <a
              href="/signup"
              className="vp-focus"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', width: '100%', padding: '14px',
                background: '#F5B731', color: '#0E1523',
                borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
              }}
            >
              Start Your Free Trial
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </section>
        </div>

        {/* ── How pricing works callout ──────────────────────────────────────── */}
        <section
          aria-label="How Syndicade pricing works"
          style={{ marginTop: '56px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '40px' }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0E1523', marginBottom: '28px', margin: '0 0 28px' }}>
            How Syndicade's Pricing Works
          </h2>
          <div className="grid md:grid-cols-3 grid-cols-1 gap-8">
            {[
              {
                label: 'No Revenue Cut',
                body: 'We charge a flat $1 per paid ticket — no percentage of your ticket sales. Your members\' money stays in your organization.',
              },
              {
                label: 'Everything Included',
                body: 'Member management, events, a public website, email marketing, forms, announcements, and document storage — one flat monthly fee.',
              },
              {
                label: '14-Day Free Trial',
                body: 'Start free, no credit card required. Verified 501(c)(3) nonprofits receive a 30-day trial.',
              },
            ].map(function (item) {
              return (
                <div key={item.label}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {item.label}
                  </div>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PRINT-ONLY LAYOUT
          Hidden on screen via CSS. Only visible when window.print() fires.
      ════════════════════════════════════════════════════════════════════════ */}
      <div id="syndicade-print" style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: '#0E1523' }}>
        <div style={{ padding: '0' }}>

          {/* Print header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #F5B731', paddingBottom: '18px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                <span style={{ color: '#0E1523' }}>Syndi</span><span style={{ color: '#F5B731' }}>cade</span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>Cost Comparison Report</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {orgName && <div style={{ fontSize: '14px', fontWeight: 700, color: '#0E1523' }}>{orgName}</div>}
              <div style={{ fontSize: '12px', color: '#64748B' }}>{today}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>syndicade.org</div>
            </div>
          </div>

          {/* Current costs table */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Current Annual Software Costs
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                {['Category', 'Tool / Platform', 'Monthly', 'Annual'].map(function (h, idx) {
                  return (
                    <th key={h} style={{ padding: '9px 14px', textAlign: idx >= 2 ? 'right' : 'left', color: '#475569', fontWeight: 600, border: '1px solid #E2E8F0', fontSize: '12px' }}>
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(function (cat) {
                var monthly = parseFloat(costs[cat.id].monthly) || 0;
                if (monthly === 0 && !costs[cat.id].toolName) return null;
                return (
                  <tr key={cat.id}>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0' }}>{cat.label}</td>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', color: '#475569' }}>{costs[cat.id].toolName || '—'}</td>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', textAlign: 'right' }}>{monthly > 0 ? fmtDec(monthly) : '—'}</td>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', textAlign: 'right' }}>{monthly > 0 ? fmt(monthly * 12) : '—'}</td>
                  </tr>
                );
              })}
              {additionalCosts.map(function (item) {
                var monthly = parseFloat(item.monthly) || 0;
                if (monthly === 0 && !item.label) return null;
                return (
                  <tr key={item.id}>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0' }}>{item.label || 'Other'}</td>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', color: '#475569' }}>—</td>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', textAlign: 'right' }}>{monthly > 0 ? fmtDec(monthly) : '—'}</td>
                    <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', textAlign: 'right' }}>{monthly > 0 ? fmt(monthly * 12) : '—'}</td>
                  </tr>
                );
              })}
              {getTicketingAnnualCost() > 0 && (
                <tr>
                  <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0' }}>Event Ticketing Fees</td>
                  <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '12px' }}>
                    {ticketing.toolName || 'Current platform'} &mdash;{' '}
                    {parseFloat(ticketing.ticketsPerYear) || 0} tickets/yr
                    {parseFloat(ticketing.flatFeePerTicket) > 0 ? (' @ $' + ticketing.flatFeePerTicket + '/ticket') : ''}
                    {parseFloat(ticketing.pctFeePerTicket) > 0 ? (' + ' + ticketing.pctFeePerTicket + '% of face value') : ''}
                    {parseFloat(ticketing.avgTicketPrice) > 0 ? (' · avg price $' + ticketing.avgTicketPrice) : ''}
                  </td>
                  <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', textAlign: 'right' }}>—</td>
                  <td style={{ padding: '9px 14px', border: '1px solid #E2E8F0', textAlign: 'right' }}>{fmt(getTicketingAnnualCost())}</td>
                </tr>
              )}
              <tr style={{ background: '#FEF2F2' }}>
                <td colSpan="3" style={{ padding: '11px 14px', border: '1px solid #E2E8F0', fontWeight: 700 }}>
                  Total Current Annual Cost
                </td>
                <td style={{ padding: '11px 14px', border: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 800, fontSize: '16px', color: '#DC2626' }}>
                  {fmt(currentTotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Syndicade comparison table */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Syndicade Cost Comparison &mdash; {billingCycle === 'annual' ? 'Annual Billing' : 'Monthly Billing'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                {['Plan', 'Included', billingCycle === 'annual' ? 'Annual Plan' : 'Plan (×12mo)', '$1 Ticket Fees', 'Total Annual', 'Annual Savings'].map(function (h, idx) {
                  return (
                    <th key={h} style={{ padding: '9px 12px', textAlign: idx >= 2 ? 'right' : 'left', color: '#475569', fontWeight: 600, border: '1px solid #E2E8F0', fontSize: '11px' }}>
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PLANS.map(function (plan) {
                var synCost    = getSyndicadeAnnualCost(plan);
                var savings    = getSavings(plan);
                var pctSaved   = currentTotal > 0 ? Math.round((savings / currentTotal) * 100) : 0;
                var baseCost   = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice * 12;
                var tickets    = parseFloat(ticketing.ticketsPerYear) || 0;
                var ticketCost = tickets * 1.00;
                return (
                  <tr key={plan.id} style={{ background: plan.highlight ? '#F0FDF4' : 'transparent' }}>
                    <td style={{ padding: '9px 12px', border: '1px solid #E2E8F0', fontWeight: plan.highlight ? 700 : 400 }}>
                      {plan.name}{plan.highlight ? ' (Recommended)' : ''}
                    </td>
                    <td style={{ padding: '9px 12px', border: '1px solid #E2E8F0', fontSize: '11px', color: '#475569' }}>
                      {plan.memberLimit} &middot; email &middot; website &middot; storage &middot; events
                    </td>
                    <td style={{ padding: '9px 12px', border: '1px solid #E2E8F0', textAlign: 'right' }}>{fmtDec(baseCost)}</td>
                    <td style={{ padding: '9px 12px', border: '1px solid #E2E8F0', textAlign: 'right' }}>{ticketCost > 0 ? fmt(ticketCost) : '—'}</td>
                    <td style={{ padding: '9px 12px', border: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 700 }}>{fmt(synCost)}</td>
                    <td style={{ padding: '9px 12px', border: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 700, color: savings > 0 ? '#15803D' : '#DC2626' }}>
                      {savings > 0
                        ? ('Save ' + fmt(savings) + ' (' + pctSaved + '%)')
                        : ('+' + fmt(Math.abs(savings)))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Print footer note */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 18px', fontSize: '12px', color: '#475569', lineHeight: 1.65, marginBottom: '20px' }}>
            <strong style={{ color: '#0E1523' }}>About Syndicade: </strong>
            Syndicade charges a flat $1 per paid ticket with no percentage cut on revenue, keeping more money in your organization.
            Every plan includes member management, event tools, a public website, email marketing, polls, surveys, announcements, and document storage.
            {billingCycle === 'annual' ? ' Annual billing above saves the equivalent of 2 months vs monthly.' : ''}
            {' '}14-day free trial available, no credit card required. Verified 501(c)(3) organizations receive a 30-day trial.
          </div>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
            syndicade.org &mdash; Nonprofit community management, built for organizations like yours.
          </div>
        </div>
      </div>

    </main>
  );
}