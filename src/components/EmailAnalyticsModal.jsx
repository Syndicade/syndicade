import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  X, Mail, MousePointer, AlertCircle, TrendingUp,
  ThumbsDown, UserMinus
} from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={'animate-pulse bg-slate-100 rounded ' + (className || '')} aria-hidden="true" />;
}

// ── Empty state (mascot pattern) ───────────────────────────────────────────────
function EmptyState({ heading, description }) {
  return (
    <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
      <img src="/mascots-empty.png" alt="" aria-hidden="true"
        style={{ maxWidth: '160px', margin: '0 auto 16px', display: 'block', mixBlendMode: 'multiply' }} />
      <p className="text-sm font-bold text-slate-900 mb-1">{heading}</p>
      <p className="text-xs text-slate-500 max-w-xs mx-auto">{description}</p>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, Icon, pct }) {
  var colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   bar: 'bg-blue-500' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  bar: 'bg-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    bar: 'bg-red-500' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500' },
    gray:   { bg: 'bg-slate-50',  text: 'text-slate-500',  bar: 'bg-slate-300' }
  };
  var c = colorMap[color] || colorMap.gray;

  return (
    <div className={'rounded-xl p-4 flex flex-col gap-1 ' + c.bg}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">{label}</span>
        <Icon size={14} className={c.text} aria-hidden="true" />
      </div>
      <div className={'text-2xl font-extrabold ' + c.text}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
      {pct !== undefined && (
        <div className="mt-1 w-full bg-white rounded-full h-1.5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className={'h-1.5 rounded-full transition-all duration-700 ' + c.bar} style={{ width: Math.min(pct, 100) + '%' }} />
        </div>
      )}
    </div>
  );
}

// ── Recipient status badge ────────────────────────────────────────────────────
function StatusBadge({ type }) {
  var configs = {
    opened:       { label: 'Opened',       cls: 'bg-green-100 text-green-700' },
    clicked:      { label: 'Clicked',      cls: 'bg-blue-100 text-blue-700' },
    delivered:    { label: 'Delivered',    cls: 'bg-slate-100 text-slate-600' },
    bounced:      { label: 'Bounced',      cls: 'bg-red-100 text-red-600' },
    complained:   { label: 'Spam',         cls: 'bg-yellow-100 text-yellow-700' },
    unsubscribed: { label: 'Unsubscribed', cls: 'bg-slate-100 text-slate-500' },
    delayed:      { label: 'Delayed',      cls: 'bg-yellow-100 text-yellow-700' },
    sent:         { label: 'Sent',         cls: 'bg-slate-100 text-slate-600' }
  };
  var cfg = configs[type] || { label: type, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ' + cfg.cls}>
      {cfg.label}
    </span>
  );
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCsv(recipients, recipientEventMap, blast) {
  var headers = ['Name', 'Email', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Complained', 'Unsubscribed'];
  var rows = recipients.map(function(r) {
    var events = recipientEventMap[r.resend_email_id] || [];
    var has = function(type) { return events.includes(type) ? 'Yes' : 'No'; };
    return [
      '"' + (r.name || '') + '"',
      '"' + r.email + '"',
      has('delivered'),
      has('opened'),
      has('clicked'),
      has('bounced'),
      has('complained'),
      has('unsubscribed')
    ].join(',');
  });
  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'email-analytics-' + (blast.subject || 'blast').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function EmailAnalyticsModal({ blast, planKey, onClose }) {
  var isGrowthPlus = planKey === 'growth' || planKey === 'pro';

  var [loading, setLoading] = useState(true);
  var [recipients, setRecipients] = useState([]);
  var [events, setEvents] = useState([]);
  var [activeTab, setActiveTab] = useState('overview');

  useEffect(function() {
    if (blast && isGrowthPlus) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [blast]);

  useEffect(function() {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      var [recipientsRes, eventsRes] = await Promise.all([
        supabase
          .from('email_recipients')
          .select('*')
          .eq('blast_id', blast.id)
          .order('sent_at', { ascending: true }),
        supabase
          .from('email_events')
          .select('*')
          .eq('blast_id', blast.id)
          .order('occurred_at', { ascending: true })
      ]);
      setRecipients(recipientsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (err) {
      // silent — empty state covers this
    } finally {
      setLoading(false);
    }
  }

  // ── Compute stats ─────────────────────────────────────────────────────────
  var total = blast.recipient_count || recipients.length || 0;

  function countEvent(type) {
    var seen = new Set();
    events.forEach(function(e) {
      if (e.event_type === type && e.resend_email_id) seen.add(e.resend_email_id);
    });
    return seen.size;
  }

  var delivered    = countEvent('delivered');
  var opened       = countEvent('opened');
  var clicked      = countEvent('clicked');
  var bounced      = countEvent('bounced');
  var complained   = countEvent('complained');
  var unsubscribed = countEvent('unsubscribed');

  var openRate    = total > 0 ? Math.round((opened / total) * 100) : 0;
  var clickRate   = total > 0 ? Math.round((clicked / total) * 100) : 0;
  var bounceRate  = total > 0 ? Math.round((bounced / total) * 100) : 0;

  // ── Per-recipient event map ────────────────────────────────────────────────
  var recipientEventMap = {};
  events.forEach(function(e) {
    if (!e.resend_email_id) return;
    if (!recipientEventMap[e.resend_email_id]) recipientEventMap[e.resend_email_id] = [];
    if (!recipientEventMap[e.resend_email_id].includes(e.event_type)) {
      recipientEventMap[e.resend_email_id].push(e.event_type);
    }
  });

  // ── Best status per recipient ──────────────────────────────────────────────
  var STATUS_PRIORITY = ['bounced', 'complained', 'unsubscribed', 'clicked', 'opened', 'delivered', 'delayed', 'sent'];
  function bestStatus(resendId) {
    if (!resendId) return 'sent';
    var recipEvents = recipientEventMap[resendId] || [];
    for (var s of STATUS_PRIORITY) {
      if (recipEvents.includes(s)) return s;
    }
    return 'sent';
  }

  // ── Sent date ─────────────────────────────────────────────────────────────
  var sentDate = blast.sent_at
    ? new Date(blast.sent_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analytics-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#F5B731] mb-1">Email Analytics</p>
            <h2 id="analytics-title" className="text-base font-bold text-slate-900 truncate">{blast.subject}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sent {sentDate} · {total} recipient{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isGrowthPlus && !loading && recipients.length > 0 && (
              <button
                onClick={function() { exportCsv(recipients, recipientEventMap, blast); }}
                className="px-3 py-2 bg-transparent border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400 text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close analytics"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Plan gate */}
        {!isGrowthPlus ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: '#7C3AED', background: 'rgba(139,92,246,0.1)', border: '0.5px solid rgba(139,92,246,0.3)' }}>
              Growth+
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Analytics is a Growth feature</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">Upgrade to Growth or Pro to see open rates, click tracking, bounce reports, and per-recipient status for every email you send.</p>
            <ul className="flex flex-col gap-2 text-sm text-slate-600" role="list">
              {['Open rate & click rate', 'Per-recipient status', 'Bounce & spam reports', 'CSV export'].map(function(f) {
                return (
                  <li key={f} className="flex items-center gap-2 justify-center">
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5B731' }} aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6 flex-shrink-0" role="tablist">
              {[
                { key: 'overview',    label: 'Overview' },
                { key: 'recipients',  label: 'Recipients' + (recipients.length > 0 ? ' (' + recipients.length + ')' : '') }
              ].map(function(t) {
                var active = activeTab === t.key;
                return (
                  <button key={t.key} role="tab" aria-selected={active} onClick={function() { setActiveTab(t.key); }}
                    className={'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (active ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-700')}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── Overview tab ─────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[1,2,3,4,5,6].map(function(i) { return <Skeleton key={i} className="h-24" />; })}
                    </div>
                  ) : (
                    <>
                      {/* Stat cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="list" aria-label="Email statistics">
                        <div role="listitem">
                          <StatCard label="Sent" value={total} sub="total recipients" color="blue" Icon={Mail} />
                        </div>
                        <div role="listitem">
                          <StatCard label="Opened" value={opened} sub={openRate + '% open rate'} color="green" Icon={TrendingUp} pct={openRate} />
                        </div>
                        <div role="listitem">
                          <StatCard label="Clicked" value={clicked} sub={clickRate + '% click rate'} color="purple" Icon={MousePointer} pct={clickRate} />
                        </div>
                        <div role="listitem">
                          <StatCard label="Bounced" value={bounced} sub={bounceRate + '% bounce rate'} color={bounced > 0 ? 'red' : 'gray'} Icon={AlertCircle} />
                        </div>
                        <div role="listitem">
                          <StatCard label="Complaints" value={complained} sub="marked as spam" color={complained > 0 ? 'yellow' : 'gray'} Icon={ThumbsDown} />
                        </div>
                        <div role="listitem">
                          <StatCard label="Unsubscribed" value={unsubscribed} sub="opted out" color={unsubscribed > 0 ? 'yellow' : 'gray'} Icon={UserMinus} />
                        </div>
                      </div>

                      {/* Engagement bars */}
                      {total > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#F5B731]">Engagement Breakdown</p>
                          {[
                            { label: 'Open Rate',    value: openRate,   count: opened,   color: '#22C55E' },
                            { label: 'Click Rate',   value: clickRate,  count: clicked,  color: '#8B5CF6' },
                            { label: 'Bounce Rate',  value: bounceRate, count: bounced,  color: '#EF4444' }
                          ].map(function(row) {
                            return (
                              <div key={row.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm text-slate-600">{row.label}</span>
                                  <span className="text-sm font-semibold text-slate-900">{row.value}% <span className="text-xs text-slate-400 font-normal">({row.count} of {total})</span></span>
                                </div>
                                <div className="w-full bg-white border border-slate-200 rounded-full h-2" role="progressbar" aria-valuenow={row.value} aria-valuemin={0} aria-valuemax={100} aria-label={row.label + ': ' + row.value + '%'}>
                                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: Math.min(row.value, 100) + '%', background: row.color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* No data yet */}
                      {events.length === 0 && (
                        <EmptyState
                          heading="No event data yet"
                          description="Analytics arrive via webhook as recipients open and click. Check back in a few minutes."
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Recipients tab ───────────────────────────────────────── */}
              {activeTab === 'recipients' && (
                <div>
                  {loading ? (
                    <div className="space-y-2">
                      {[1,2,3,4,5].map(function(i) { return <Skeleton key={i} className="h-12" />; })}
                    </div>
                  ) : recipients.length === 0 ? (
                    <EmptyState
                      heading="No recipient data"
                      description="Recipient tracking is available for emails sent after analytics was enabled."
                    />
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {/* Filter summary */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 flex-wrap bg-slate-50">
                        {[
                          { key: 'all',          label: 'All',          count: recipients.length },
                          { key: 'opened',       label: 'Opened',       count: opened },
                          { key: 'clicked',      label: 'Clicked',      count: clicked },
                          { key: 'bounced',      label: 'Bounced',      count: bounced },
                          { key: 'complained',   label: 'Spam',         count: complained },
                          { key: 'unsubscribed', label: 'Unsubscribed', count: unsubscribed }
                        ].filter(function(f) { return f.count > 0 || f.key === 'all'; }).map(function(f) {
                          return (
                            <span key={f.key} className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">{f.count}</span> {f.label}
                            </span>
                          );
                        })}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full" role="table" aria-label="Recipient analytics">
                          <thead>
                            <tr className="bg-slate-50">
                              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#F5B731]">Recipient</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#F5B731]">Status</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-[#F5B731]">Activity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipients.map(function(r) {
                              var evts = r.resend_email_id ? (recipientEventMap[r.resend_email_id] || []) : [];
                              var primary = bestStatus(r.resend_email_id);
                              return (
                                <tr key={r.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">{r.name || '—'}</p>
                                    <p className="text-xs text-slate-500">{r.email}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <StatusBadge type={primary} />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {evts.length === 0
                                        ? <span className="text-xs text-slate-400">No data yet</span>
                                        : evts.map(function(evt) {
                                            return <StatusBadge key={evt} type={evt} />;
                                          })
                                      }
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}