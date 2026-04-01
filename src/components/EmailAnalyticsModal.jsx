import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  X, Mail, MousePointer, AlertTriangle, TrendingUp,
  Users, CheckCircle, AlertCircle, ThumbsDown, UserMinus,
  Clock, Download, Zap
} from 'lucide-react';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={'animate-pulse bg-[#1E2845] rounded ' + (className || '')} aria-hidden="true" />;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, Icon, pct }) {
  var colorMap = {
    blue:   { bg: 'bg-[#1D3461]', text: 'text-blue-400',   icon: 'text-blue-400' },
    green:  { bg: 'bg-[#1B3A2F]', text: 'text-green-400',  icon: 'text-green-400' },
    purple: { bg: 'bg-[#2D1B4E]', text: 'text-purple-400', icon: 'text-purple-400' },
    red:    { bg: 'bg-[#3B1A1A]', text: 'text-red-400',    icon: 'text-red-400' },
    yellow: { bg: 'bg-[#2D2310]', text: 'text-yellow-400', icon: 'text-yellow-400' },
    gray:   { bg: 'bg-[#1A2035]', text: 'text-[#94A3B8]',  icon: 'text-[#64748B]' }
  };
  var c = colorMap[color] || colorMap.gray;

  return (
    <div className={'rounded-xl p-4 flex flex-col gap-1 ' + c.bg}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-700 uppercase tracking-widest text-[#64748B]">{label}</span>
        <Icon size={14} className={c.icon} aria-hidden="true" />
      </div>
      <div className={'text-2xl font-800 ' + c.text}>{value}</div>
      {sub && <div className="text-xs text-[#64748B]">{sub}</div>}
      {pct !== undefined && (
        <div className="mt-1 w-full bg-[#0E1523] rounded-full h-1.5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className={'h-1.5 rounded-full transition-all duration-700 ' + c.icon.replace('text-', 'bg-')} style={{ width: Math.min(pct, 100) + '%' }} />
        </div>
      )}
    </div>
  );
}

// ── Recipient status badge ────────────────────────────────────────────────────
function StatusBadge({ type }) {
  var configs = {
    opened:       { label: 'Opened',       cls: 'bg-[#1B3A2F] text-green-400' },
    clicked:      { label: 'Clicked',      cls: 'bg-[#1D3461] text-blue-400' },
    delivered:    { label: 'Delivered',    cls: 'bg-[#1A2035] text-[#94A3B8]' },
    bounced:      { label: 'Bounced',      cls: 'bg-[#3B1A1A] text-red-400' },
    complained:   { label: 'Spam',         cls: 'bg-[#2D2310] text-yellow-400' },
    unsubscribed: { label: 'Unsubscribed', cls: 'bg-[#1A2035] text-[#64748B]' },
    delayed:      { label: 'Delayed',      cls: 'bg-[#2D2310] text-yellow-400' },
    sent:         { label: 'Sent',         cls: 'bg-[#1A2035] text-[#94A3B8]' }
  };
  var cfg = configs[type] || { label: type, cls: 'bg-[#1A2035] text-[#94A3B8]' };
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
      // silent — show empty state
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
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div className="bg-[#1A2035] border border-[#2A3550] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#2A3550] flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-1">Email Analytics</p>
            <h2 id="analytics-title" className="text-base font-700 text-white truncate">{blast.subject}</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Sent {sentDate} · {total} recipient{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isGrowthPlus && !loading && recipients.length > 0 && (
              <button
                onClick={function() { exportCsv(recipients, recipientEventMap, blast); }}
                aria-label="Export analytics as CSV"
                className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[#2A3550] text-[#94A3B8] hover:text-white hover:border-[#94A3B8] text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Download size={13} aria-hidden="true" />
                Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close analytics"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Plan gate */}
        {!isGrowthPlus ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F5B731] bg-opacity-10 flex items-center justify-center mb-4">
              <Zap size={24} className="text-[#F5B731]" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-700 text-white mb-2">Analytics is a Growth feature</h3>
            <p className="text-sm text-[#94A3B8] max-w-sm mb-6">Upgrade to Growth or Pro to see open rates, click tracking, bounce reports, and per-recipient status for every email you send.</p>
            <div className="flex flex-col gap-2 text-sm text-[#64748B]">
              {['Open rate & click rate', 'Per-recipient status', 'Bounce & spam reports', 'CSV export'].map(function(f) {
                return (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-[#F5B731]" aria-hidden="true" />
                    <span>{f}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-[#2A3550] px-6 flex-shrink-0" role="tablist">
              {[
                { key: 'overview',    label: 'Overview' },
                { key: 'recipients',  label: 'Recipients' + (recipients.length > 0 ? ' (' + recipients.length + ')' : '') }
              ].map(function(t) {
                var active = activeTab === t.key;
                return (
                  <button key={t.key} role="tab" aria-selected={active} onClick={function() { setActiveTab(t.key); }}
                    className={'px-4 py-3 text-sm font-600 border-b-2 -mb-px transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (active ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#64748B] hover:text-[#94A3B8]')}>
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
                        <div className="bg-[#151B2D] border border-[#2A3550] rounded-xl p-5 space-y-4">
                          <p className="text-xs font-700 uppercase tracking-widest text-[#F5B731]">Engagement Breakdown</p>
                          {[
                            { label: 'Open Rate',    value: openRate,   count: opened,   color: '#22C55E' },
                            { label: 'Click Rate',   value: clickRate,  count: clicked,  color: '#8B5CF6' },
                            { label: 'Bounce Rate',  value: bounceRate, count: bounced,  color: '#EF4444' }
                          ].map(function(row) {
                            return (
                              <div key={row.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm text-[#CBD5E1]">{row.label}</span>
                                  <span className="text-sm font-semibold text-white">{row.value}% <span className="text-xs text-[#64748B] font-400">({row.count} of {total})</span></span>
                                </div>
                                <div className="w-full bg-[#0E1523] rounded-full h-2" role="progressbar" aria-valuenow={row.value} aria-valuemin={0} aria-valuemax={100} aria-label={row.label + ': ' + row.value + '%'}>
                                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: Math.min(row.value, 100) + '%', background: row.color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* No data yet */}
                      {events.length === 0 && (
                        <div className="text-center py-10 bg-[#151B2D] border border-[#2A3550] rounded-xl">
                          <Clock size={32} className="text-[#2A3550] mx-auto mb-3" aria-hidden="true" />
                          <p className="text-sm font-semibold text-white mb-1">No event data yet</p>
                          <p className="text-xs text-[#64748B]">Analytics arrive via webhook as recipients open and click. Check back in a few minutes.</p>
                        </div>
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
                    <div className="text-center py-12 bg-[#151B2D] border border-[#2A3550] rounded-xl">
                      <Users size={36} className="text-[#2A3550] mx-auto mb-3" aria-hidden="true" />
                      <p className="text-sm font-semibold text-white mb-1">No recipient data</p>
                      <p className="text-xs text-[#64748B]">Recipient tracking is available for emails sent after analytics was enabled.</p>
                    </div>
                  ) : (
                    <div className="bg-[#151B2D] border border-[#2A3550] rounded-xl overflow-hidden">
                      {/* Filter summary */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A3550] flex-wrap">
                        {[
                          { key: 'all',          label: 'All',          count: recipients.length },
                          { key: 'opened',       label: 'Opened',       count: opened },
                          { key: 'clicked',      label: 'Clicked',      count: clicked },
                          { key: 'bounced',      label: 'Bounced',      count: bounced },
                          { key: 'complained',   label: 'Spam',         count: complained },
                          { key: 'unsubscribed', label: 'Unsubscribed', count: unsubscribed }
                        ].filter(function(f) { return f.count > 0 || f.key === 'all'; }).map(function(f) {
                          return (
                            <span key={f.key} className="text-xs text-[#64748B]">
                              <span className="font-semibold text-[#CBD5E1]">{f.count}</span> {f.label}
                            </span>
                          );
                        })}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full" role="table" aria-label="Recipient analytics">
                          <thead>
                            <tr className="bg-[#1E2845]">
                              <th scope="col" className="px-4 py-3 text-left text-xs font-700 uppercase tracking-widest text-[#F5B731]">Recipient</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-700 uppercase tracking-widest text-[#F5B731]">Status</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-700 uppercase tracking-widest text-[#F5B731]">Activity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipients.map(function(r) {
                              var evts = r.resend_email_id ? (recipientEventMap[r.resend_email_id] || []) : [];
                              var primary = bestStatus(r.resend_email_id);
                              return (
                                <tr key={r.id} className="border-t border-[#2A3550] hover:bg-[#1E2845] transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-semibold text-white">{r.name || '—'}</p>
                                    <p className="text-xs text-[#64748B]">{r.email}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <StatusBadge type={primary} />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {evts.length === 0
                                        ? <span className="text-xs text-[#64748B]">No data yet</span>
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