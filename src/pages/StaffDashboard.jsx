/**
 * StaffDashboard.jsx — Light Theme (V3.0)
 * Rebuilt May 29, 2026
 *
 * Tabs:
 * 1. Overview    — metrics, pending actions, at-risk orgs, verification queue
 * 2. Members     — search, staff filter, account tools
 * 3. Orgs        — search + recent signups on load, plan adjustment
 * 4. Content     — zero-code content editing (ContentEditor — pending light theme)
 * 5. Financials  — revenue (StaffFinancials — pending light theme)
 * 6. Promo Codes — discount codes (StaffPromoCodes — pending light theme)
 * 7. Goals       — revenue goals (StaffGoals — pending light theme)
 * 8. Contacts    — marketing contacts
 * 9. Bug Reports — bug_reports table, filters, inline status update, expandable rows
 *
 * Pending light theme rewrites (touch on next session):
 * - ContentEditor.jsx
 * - StaffFinancials.jsx
 * - StaffPromoCodes.jsx
 * - StaffGoals.jsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import ContentEditor from '../components/ContentEditor';
import StaffFinancials from '../components/StaffFinancials';
import StaffPromoCodes from '../components/StaffPromoCodes';
import StaffGoals from '../components/StaffGoals';
import {
  Users, Building2, DollarSign, ShieldCheck, Tag, TrendingUp, AlertTriangle,
  Calendar, Activity, Clock, CheckCircle, XCircle, RefreshCw, ChevronDown,
  MapPin, BarChart2, UserX, Zap, Search, KeyRound, Ban, ChevronRight, X,
  FileText, Download, Mail, Bug, ChevronUp, ExternalLink, Image, Filter,
  Receipt, AlertCircle,
} from 'lucide-react';

// ─── Plan config (locked May 22, 2026) ───────────────────────────────────────
var PLAN_PRICES = {
  listed_month: 10.00,   listed_year: 8.33,
  starter_month: 29.99,  starter_year: 24.99,
  growth_month: 49.99,   growth_year: 41.66,
  pro_month: 69.99,      pro_year: 58.33,
  student_month: 19.99,
};
var PLAN_LABELS = {
  listed_month: 'Listed (Monthly)',   listed_year: 'Listed (Annual)',
  starter_month: 'Starter (Monthly)', starter_year: 'Starter (Annual)',
  growth_month: 'Growth (Monthly)',   growth_year: 'Growth (Annual)',
  pro_month: 'Pro (Monthly)',         pro_year: 'Pro (Annual)',
  student_month: 'Student (Monthly)',
};
var ALL_PLANS = Object.keys(PLAN_LABELS).map(function(k) { return { value: k, label: PLAN_LABELS[k] }; });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  var diff = Date.now() - new Date(dateStr).getTime();
  var days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return days + ' days ago';
}
function formatMRR(val) {
  return '$' + parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getInitials(name) {
  if (!name) return '??';
  var parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
async function logAction(action, targetType, targetId, details) {
  var res = await supabase.auth.getUser();
  var user = res.data && res.data.user;
  await supabase.from('staff_audit_log').insert({
    staff_user_id: user.id, action: action,
    target_type: targetType, target_id: targetId, details: details || {},
  });
}

// ─── Severity config ──────────────────────────────────────────────────────────
var SEVERITY_CONFIG = {
  critical: { label: 'Critical', bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  high:     { label: 'High',     bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  medium:   { label: 'Medium',   bg: '#DBEAFE', color: '#2563EB', border: '#BFDBFE' },
  low:      { label: 'Low',      bg: '#DCFCE7', color: '#16A34A', border: '#BBF7D0' },
};
var BUG_STATUS_OPTIONS = ['new', 'in_review', 'resolved', 'closed'];
var BUG_STATUS_CONFIG = {
  new:       { label: 'New',       bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  in_review: { label: 'In Review', bg: '#DBEAFE', color: '#2563EB', border: '#BFDBFE' },
  resolved:  { label: 'Resolved',  bg: '#DCFCE7', color: '#16A34A', border: '#BBF7D0' },
  closed:    { label: 'Closed',    bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' },
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
function MetricSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse" aria-hidden="true">
      <div className="w-9 h-9 rounded-lg bg-slate-100 mb-3" />
      <div className="h-3 w-20 rounded bg-slate-100 mb-2" />
      <div className="h-8 w-16 rounded bg-slate-100 mb-2" />
      <div className="h-3 w-28 rounded bg-slate-100" />
    </div>
  );
}
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse" aria-hidden="true">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 w-40 rounded bg-slate-100 mb-1" />
        <div className="h-3 w-24 rounded bg-slate-100" />
      </div>
      <div className="h-6 w-16 rounded bg-slate-100" />
    </div>
  );
}
function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-hidden="true">
      {Array.from({ length: 4 }).map(function(_, i) {
        return (
          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-48 rounded bg-slate-100 mb-2" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-20 rounded bg-slate-100" />
            <div className="h-8 w-20 rounded bg-slate-100" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '16px' }}>
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, iconBg, iconColor, alert }) {
  return (
    <div className={'bg-white rounded-xl p-5 border ' + (alert ? 'border-yellow-300' : 'border-slate-200')} role="region" aria-label={label + ' metric'}>
      <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-3 ' + iconBg}>
        <Icon size={18} className={iconColor} aria-hidden="true" />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#0E1523', marginBottom: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#64748B' }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="px-6 py-12 text-center">
      <Icon size={36} className="text-slate-300 mx-auto mb-3" aria-hidden="true" />
      <p style={{ fontWeight: 700, fontSize: '15px', color: '#0E1523', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: action ? '16px' : '0' }}>{description}</p>
      {action && onAction && (
        <button onClick={onAction} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {action}
        </button>
      )}
    </div>
  );
}

// ─── Member drawer ────────────────────────────────────────────────────────────
function MemberDrawer({ member, onClose, onAction }) {
  var [memberships, setMemberships] = useState([]);
  var [loadingMemberships, setLoadingMemberships] = useState(true);
  var [actionLoading, setActionLoading] = useState(null);

  useEffect(function() {
    supabase.from('memberships')
      .select('role, status, organizations(name, city, state)')
      .eq('member_id', member.user_id)
      .then(function(res) { setMemberships(res.data || []); setLoadingMemberships(false); });
  }, [member.user_id]);

  async function handleResetPassword() {
    setActionLoading('reset');
    var res = await supabase.auth.resetPasswordForEmail(member.email, { redirectTo: window.location.origin + '/reset-password' });
    if (res.error) { toast.error('Failed to send reset email.'); }
    else { mascotSuccessToast('Password reset email sent.'); await logAction('password_reset_sent', 'member', member.user_id, { email: member.email }); }
    setActionLoading(null);
  }

  async function handleToggleSuspend() {
    var newStatus = member.account_status === 'suspended' ? 'active' : 'suspended';
    setActionLoading('suspend');
    var res = await supabase.from('members').update({ account_status: newStatus }).eq('user_id', member.user_id);
    if (res.error) { mascotErrorToast('Failed to update account.'); }
    else {
      mascotSuccessToast(newStatus === 'suspended' ? 'Account suspended.' : 'Account reactivated.');
      await logAction(newStatus === 'suspended' ? 'account_suspended' : 'account_reactivated', 'member', member.user_id);
      onAction();
    }
    setActionLoading(null);
  }

  async function handleImpersonate() {
    setActionLoading('impersonate');
    var sessionRes = await supabase.auth.getSession();
    var accessToken = sessionRes.data && sessionRes.data.session && sessionRes.data.session.access_token;
    if (!accessToken) { toast.error('Could not get session token.'); setActionLoading(null); return; }
    var res = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/impersonate-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
      body: JSON.stringify({ target_user_id: member.user_id }),
    });
    var json = await res.json();
    if (!res.ok || !json.link) {
      toast.error(json.error || 'Failed to generate impersonation link.');
      setActionLoading(null);
      return;
    }
    navigator.clipboard.writeText(json.link).catch(function() {});
    window.open(json.link, '_blank', 'noopener,noreferrer');
    mascotSuccessToast('Impersonation link opened.', 'Link copied to clipboard.');
    setActionLoading(null);
  }

  var isSuspended = member.account_status === 'suspended';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={'Member details: ' + member.first_name + ' ' + member.last_name}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '16px', color: '#0E1523' }}>{member.first_name} {member.last_name}</h2>
            <p style={{ fontSize: '12px', color: '#64748B' }}>{member.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ' + (isSuspended ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200')}>
              {isSuspended ? 'Suspended' : 'Active'}
            </span>
            {member.is_staff && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Staff</span>}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Joined</span><span style={{ color: '#475569' }}>{member.joined_date ? new Date(member.joined_date).toLocaleDateString() : '—'}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Member #</span><span style={{ color: '#475569', fontWeight: 600 }}>{'#' + (member.member_number || '—')}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Phone</span><span style={{ color: '#475569' }}>{member.phone || '—'}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Organizations</span><span style={{ color: '#475569' }}>{memberships.length}</span></div>
          </div>
          <div>
            <SectionLabel>Account Tools</SectionLabel>
            <div className="space-y-3">
              <button onClick={handleResetPassword} disabled={actionLoading !== null} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors text-left">
                <KeyRound size={16} className="text-blue-500 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div>{actionLoading === 'reset' ? 'Sending...' : 'Send Password Reset Email'}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Sends a link to {member.email}</div>
                </div>
              </button>
              <button onClick={handleToggleSuspend} disabled={actionLoading !== null} className={'w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors text-left ' + (isSuspended ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 focus:ring-green-500' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 focus:ring-red-500')} aria-label={isSuspended ? 'Reactivate account' : 'Suspend account'}>
                <Ban size={16} className="flex-shrink-0" aria-hidden="true" />
                <div>
                  <div>{actionLoading === 'suspend' ? 'Updating...' : (isSuspended ? 'Reactivate Account' : 'Suspend Account')}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>{isSuspended ? 'Restore full access' : 'Block login immediately'}</div>
                </div>
              </button>
              <button onClick={handleImpersonate} disabled={actionLoading !== null} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-yellow-300 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 transition-colors text-left">
                <Zap size={16} className="text-yellow-500 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div>{actionLoading === 'impersonate' ? 'Generating link...' : 'Impersonate User'}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Opens login link — logged to audit trail</div>
                </div>
              </button>
            </div>
          </div>
          <div>
            <SectionLabel>Organization Memberships</SectionLabel>
            {loadingMemberships ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map(function(_, i) { return <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />; })}</div>
            ) : memberships.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748B' }}>Not a member of any organizations.</p>
            ) : memberships.map(function(m, i) {
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl mb-2">
                  <div>
                    <p style={{ fontSize: '13px', color: '#0E1523', fontWeight: 600 }}>{m.organizations && m.organizations.name || 'Unknown'}</p>
                    <p style={{ fontSize: '11px', color: '#64748B' }}>{m.organizations && m.organizations.city && m.organizations.state ? m.organizations.city + ', ' + m.organizations.state : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (m.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>{m.role}</span>
                    <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>{m.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Org drawer ───────────────────────────────────────────────────────────────
function OrgDrawer({ org, subscription, onClose, onAction }) {
  var [members, setMembers] = useState([]);
  var [loadingMembers, setLoadingMembers] = useState(true);
  var [selectedPlan, setSelectedPlan] = useState(subscription && subscription.plan_id || '');
  var [planLoading, setPlanLoading] = useState(false);

  useEffect(function() {
    supabase.from('memberships')
      .select('role, members(first_name, last_name, email)')
      .eq('organization_id', org.id).eq('status', 'active').limit(10)
      .then(function(res) { setMembers(res.data || []); setLoadingMembers(false); });
  }, [org.id]);

  async function handlePlanChange() {
    if (selectedPlan === (subscription && subscription.plan_id || '')) return;
    setPlanLoading(true);
    var payload = { organization_id: org.id, plan_id: selectedPlan || null, status: selectedPlan ? 'active' : 'canceled' };
    var op = subscription && subscription.organization_id
      ? supabase.from('subscriptions').update({ plan_id: selectedPlan || null, status: selectedPlan ? 'active' : 'canceled' }).eq('organization_id', org.id)
      : supabase.from('subscriptions').insert(payload);
    var res = await op;
    if (res.error) { mascotErrorToast('Failed to update plan.'); setPlanLoading(false); return; }
    await logAction('plan_changed', 'organization', org.id, { old_plan: subscription && subscription.plan_id || 'none', new_plan: selectedPlan || 'none', org_name: org.name });
    mascotSuccessToast(selectedPlan ? 'Plan updated to ' + PLAN_LABELS[selectedPlan] : 'Plan removed.');
    setPlanLoading(false);
    onAction();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={'Org details: ' + org.name}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '16px', color: '#0E1523' }}>{org.name}</h2>
            <p style={{ fontSize: '12px', color: '#64748B' }}>{org.city && org.state ? org.city + ', ' + org.state : 'Location not set'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">
          <div className="flex gap-2 flex-wrap">
            {org.is_verified_nonprofit && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle size={11} aria-hidden="true" /> Verified Nonprofit
              </span>
            )}
            {org.edu_email && !org.edu_email_verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                <AlertTriangle size={11} aria-hidden="true" /> .edu Unverified
              </span>
            )}
            {org.edu_email && org.edu_email_verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle size={11} aria-hidden="true" /> .edu Verified
              </span>
            )}
            <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ' + (subscription && subscription.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : subscription && subscription.status === 'trialing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200')}>
              {subscription && subscription.status === 'active' ? 'Paid' : subscription && subscription.status === 'trialing' ? 'Trial' : 'Free'}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Current Plan</span><span style={{ color: '#475569', fontWeight: 600 }}>{subscription ? (PLAN_LABELS[subscription.plan_id] || subscription.plan_id) : 'Free'}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Created</span><span style={{ color: '#475569' }}>{new Date(org.created_at).toLocaleDateString()}</span></div>
            {subscription && subscription.current_period_end && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Renews</span><span style={{ color: '#475569' }}>{new Date(subscription.current_period_end).toLocaleDateString()}</span></div>}
            {subscription && subscription.trial_ends_at && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Trial ends</span><span style={{ color: '#475569' }}>{new Date(subscription.trial_ends_at).toLocaleDateString()}</span></div>}
          </div>
          <div>
            <SectionLabel>Adjust Plan</SectionLabel>
            <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>Manually override plan tier. All changes are logged.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label htmlFor={'plan-' + org.id} className="sr-only">Plan for {org.name}</label>
                <select id={'plan-' + org.id} value={selectedPlan} onChange={function(e) { setSelectedPlan(e.target.value); }} className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No plan (free)</option>
                  {ALL_PLANS.map(function(p) { return <option key={p.value} value={p.value}>{p.label}</option>; })}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
              </div>
              <button onClick={handlePlanChange} disabled={planLoading || selectedPlan === (subscription && subscription.plan_id || '')} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 transition-colors">
                {planLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <div>
            <SectionLabel>Active Members</SectionLabel>
            {loadingMembers ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map(function(_, i) { return <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />; })}</div>
            ) : members.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748B' }}>No active members found.</p>
            ) : members.map(function(m, i) {
              var name = m.members ? m.members.first_name + ' ' + m.members.last_name : 'Unknown';
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl mb-2">
                  <div>
                    <p style={{ fontSize: '13px', color: '#0E1523', fontWeight: 600 }}>{name}</p>
                    <p style={{ fontSize: '11px', color: '#64748B' }}>{m.members && m.members.email || ''}</p>
                  </div>
                  <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (m.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>{m.role}</span>
                </div>
              );
            })}
            {members.length === 10 && <p style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>Showing first 10 members</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────
function MembersTab() {
  var [query, setQuery] = useState('');
  var [staffOnly, setStaffOnly] = useState(false);
  var [results, setResults] = useState([]);
  var [loading, setLoading] = useState(false);
  var [searched, setSearched] = useState(false);
  var [selected, setSelected] = useState(null);

  async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true); setSearched(true);
    var q = supabase.from('members')
      .select('user_id, first_name, last_name, email, phone, joined_date, is_staff, account_status, member_number');
    if (staffOnly) {
      q = q.eq('is_staff', true);
    } else if (query.trim()) {
      var isNumber = /^\d+$/.test(query.trim());
      if (isNumber) {
        q = q.eq('member_number', parseInt(query.trim()));
      } else {
        var words = query.trim().split(/\s+/);
        var filters = [];
        words.forEach(function(word) {
          filters.push('first_name.ilike.%' + word + '%');
          filters.push('last_name.ilike.%' + word + '%');
          filters.push('phone.ilike.%' + word + '%');
        });
        q = q.or(filters.join(','));
      }
    } else {
      setLoading(false);
      return;
    }
    var res = await q.limit(25);
    if (res.error) { toast.error('Search failed: ' + res.error.message); }
    else { setResults(res.data || []); }
    setLoading(false);
  }

  function handleStaffToggle() {
    var next = !staffOnly;
    setStaffOnly(next);
    setQuery('');
    setSearched(true);
    setLoading(true);
    var q = supabase.from('members')
      .select('user_id, first_name, last_name, email, phone, joined_date, is_staff, account_status, member_number');
    if (next) q = q.eq('is_staff', true);
    q.limit(25).then(function(res) {
      setResults(res.data || []);
      setLoading(false);
    });
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-4" role="search" aria-label="Search members">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="member-search" className="sr-only">Search by name, phone, or member number</label>
          <input id="member-search" type="search" value={query} onChange={function(e) { setQuery(e.target.value); setStaffOnly(false); }} placeholder="Search by name, phone, or member number..." className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400" autoComplete="off" />
        </div>
        <button type="submit" disabled={loading || (!query.trim() && !staffOnly)} className="px-6 py-3 bg-blue-500 text-white font-semibold text-sm rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={handleStaffToggle} className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ' + (staffOnly ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50')} aria-pressed={staffOnly}>
          <ShieldCheck size={14} aria-hidden="true" /> Staff only
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : !searched ? <EmptyState icon={Search} title="Search for a member" description="Enter a name, phone number, or member number." />
          : results.length === 0 ? <EmptyState icon={UserX} title="No members found" description={staffOnly ? 'No staff accounts found.' : 'No results for "' + query + '".'} />
          : (
            <div role="list" aria-label="Member search results">
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
                <span style={{ fontSize: '12px', color: '#64748B' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
              </div>
              {results.map(function(m) {
                var isSuspended = m.account_status === 'suspended';
                return (
                  <div key={m.user_id} role="listitem" className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-100 text-blue-700" aria-hidden="true">{(m.first_name && m.first_name[0] || '') + (m.last_name && m.last_name[0] || '')}</div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '14px', color: '#0E1523', fontWeight: 600 }}>
                        {m.first_name} {m.last_name}
                        {m.is_staff && <span className="ml-2 text-xs font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">Staff</span>}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748B' }} className="truncate">{'#' + (m.member_number || '—') + (m.phone ? ' · ' + m.phone : '')}</p>
                    </div>
                    <span className={'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 border ' + (isSuspended ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200')}>
                      {isSuspended ? 'Suspended' : 'Active'}
                    </span>
                    <button onClick={function() { setSelected(m); }} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex-shrink-0" aria-label={'Open details for ' + m.first_name + ' ' + m.last_name}>
                      View <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
      </div>
      {selected && <MemberDrawer member={selected} onClose={function() { setSelected(null); }} onAction={function() { setSelected(null); handleSearch(null); }} />}
    </div>
  );
}

// ─── Orgs tab ─────────────────────────────────────────────────────────────────
function OrgsTab() {
  var [query, setQuery] = useState('');
  var [results, setResults] = useState([]);
  var [subsMap, setSubsMap] = useState({});
  var [loading, setLoading] = useState(true);
  var [searched, setSearched] = useState(false);
  var [selected, setSelected] = useState(null);

  useEffect(function() { loadRecent(); }, []);

  async function loadRecent() {
    setLoading(true);
    var res = await supabase.from('organizations')
      .select('id, name, slug, org_number, city, state, created_at, is_verified_nonprofit, edu_email, edu_email_verified')
      .order('created_at', { ascending: false }).limit(10);
    var orgs = res.data || [];
    setResults(orgs);
    if (orgs.length > 0) {
      var ids = orgs.map(function(o) { return o.id; });
      var subRes = await supabase.from('subscriptions').select('organization_id, plan_id, status, trial_ends_at, current_period_end').in('organization_id', ids);
      var map = {};
      (subRes.data || []).forEach(function(s) { map[s.organization_id] = s; });
      setSubsMap(map);
    }
    setLoading(false);
  }

  async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    var res = await supabase.from('organizations')
      .select('id, name, slug, org_number, city, state, created_at, is_verified_nonprofit, edu_email, edu_email_verified')
      .or('name.ilike.%' + query + '%,city.ilike.%' + query + '%,state.ilike.%' + query + '%').limit(25);
    if (res.error) { toast.error('Search failed.'); setLoading(false); return; }
    var orgs = res.data || [];
    setResults(orgs);
    if (orgs.length > 0) {
      var ids = orgs.map(function(o) { return o.id; });
      var subRes = await supabase.from('subscriptions').select('organization_id, plan_id, status, trial_ends_at, current_period_end').in('organization_id', ids);
      var map = {};
      (subRes.data || []).forEach(function(s) { map[s.organization_id] = s; });
      setSubsMap(map);
    }
    setLoading(false);
  }

  function renderOrgList(label) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : results.length === 0 ? <EmptyState icon={Building2} title="No organizations found" description={searched ? 'No results for "' + query + '".' : 'No organizations yet.'} />
          : (
            <div role="list" aria-label={label}>
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
                <span style={{ fontSize: '12px', color: '#64748B' }}>{searched ? results.length + ' result' + (results.length !== 1 ? 's' : '') : 'Showing ' + results.length + ' most recent'}</span>
              </div>
              {results.map(function(org) {
                var sub = subsMap[org.id];
                var statusColor = sub && sub.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : sub && sub.status === 'trialing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200';
                return (
                  <div key={org.id} role="listitem" className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-purple-100 text-purple-700" aria-hidden="true">{org.name && org.name[0] && org.name[0].toUpperCase() || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{ fontSize: '14px', color: '#0E1523', fontWeight: 600 }} className="truncate">{org.name}</p>
                        {org.is_verified_nonprofit && <CheckCircle size={13} className="text-green-600 flex-shrink-0" aria-label="Verified nonprofit" />}
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>
                        {org.org_number ? org.org_number + ' · ' : ''}
                        {org.city && org.state ? org.city + ', ' + org.state + ' · ' : ''}
                        {sub ? (PLAN_LABELS[sub.plan_id] || sub.plan_id) : 'Free'}
                      </p>
                    </div>
                    <span className={'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 border ' + statusColor}>
                      {sub && sub.status === 'active' ? 'Paid' : sub && sub.status === 'trialing' ? 'Trial' : 'Free'}
                    </span>
                    <button onClick={function() { setSelected({ org: org, sub: sub || null }); }} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex-shrink-0" aria-label={'Open details for ' + org.name}>
                      View <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6" role="search" aria-label="Search organizations">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="org-search" className="sr-only">Search by name, city, or state</label>
          <input id="org-search" type="search" value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Search by name, city, or state..." className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400" autoComplete="off" />
        </div>
        <button type="submit" disabled={loading || !query.trim()} className="px-6 py-3 bg-blue-500 text-white font-semibold text-sm rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
          {loading ? 'Searching...' : 'Search'}
        </button>
        {searched && (
          <button type="button" onClick={function() { setQuery(''); setSearched(false); loadRecent(); }} className="px-4 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors">
            Clear
          </button>
        )}
      </form>
      {!searched && <SectionLabel>Recent Signups</SectionLabel>}
      {renderOrgList(searched ? 'Org search results' : 'Recent signups')}
      {selected && <OrgDrawer org={selected.org} subscription={selected.sub} onClose={function() { setSelected(null); }} onAction={function() { setSelected(null); searched ? handleSearch(null) : loadRecent(); }} />}
    </div>
  );
}

// ─── Bug Reports tab ──────────────────────────────────────────────────────────
function BugReportsTab() {
  var [reports, setReports] = useState([]);
  var [loading, setLoading] = useState(true);
  var [filterStatus, setFilterStatus] = useState('');
  var [filterType, setFilterType] = useState('');
  var [filterSeverity, setFilterSeverity] = useState('');
  var [expandedId, setExpandedId] = useState(null);
  var [updatingId, setUpdatingId] = useState(null);

  useEffect(function() { loadReports(); }, []);

  async function loadReports() {
    setLoading(true);
    var res = await supabase.from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (res.error) { mascotErrorToast('Failed to load bug reports.'); }
    else { setReports(res.data || []); }
    setLoading(false);
  }

  async function handleStatusChange(id, newStatus) {
    setUpdatingId(id);
    var res = await supabase.from('bug_reports').update({ status: newStatus }).eq('id', id);
    if (res.error) { toast.error('Failed to update status.'); }
    else {
      setReports(function(prev) {
        return prev.map(function(r) { return r.id === id ? Object.assign({}, r, { status: newStatus }) : r; });
      });
      mascotSuccessToast('Status updated to ' + BUG_STATUS_CONFIG[newStatus].label + '.');
    }
    setUpdatingId(null);
  }

  var filtered = reports.filter(function(r) {
    return (!filterStatus || r.status === filterStatus)
      && (!filterType || r.type === filterType)
      && (!filterSeverity || r.severity === filterSeverity);
  });

  var newCount = reports.filter(function(r) { return r.status === 'new'; }).length;
  var criticalCount = reports.filter(function(r) { return r.severity === 'critical' && r.status !== 'resolved' && r.status !== 'closed'; }).length;

  return (
    <div>
      {/* Summary strip */}
      {!loading && reports.length > 0 && (
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {newCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <AlertCircle size={14} className="text-purple-600" aria-hidden="true" />
              <span style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 600 }}>{newCount} new report{newCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={14} className="text-red-600" aria-hidden="true" />
              <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>{criticalCount} critical open</span>
            </div>
          )}
          <span style={{ fontSize: '13px', color: '#64748B' }}>{reports.length} total report{reports.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter size={14} className="text-slate-400" aria-hidden="true" />
        <div className="relative">
          <label htmlFor="bug-filter-status" className="sr-only">Filter by status</label>
          <select id="bug-filter-status" value={filterStatus} onChange={function(e) { setFilterStatus(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All statuses</option>
            {BUG_STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{BUG_STATUS_CONFIG[s].label}</option>; })}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="bug-filter-type" className="sr-only">Filter by type</label>
          <select id="bug-filter-type" value={filterType} onChange={function(e) { setFilterType(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All types</option>
            <option value="bug">Bug</option>
            <option value="suggestion">Suggestion</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="bug-filter-severity" className="sr-only">Filter by severity</label>
          <select id="bug-filter-severity" value={filterSeverity} onChange={function(e) { setFilterSeverity(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        {(filterStatus || filterType || filterSeverity) && (
          <button onClick={function() { setFilterStatus(''); setFilterType(''); setFilterSeverity(''); }} className="text-sm text-slate-500 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : reports.length === 0 ? (
            <EmptyState icon={Bug} title="No bug reports yet" description="Reports submitted through the beta form will appear here." />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Filter} title="No reports match your filters" description="Try adjusting the status, type, or severity filter." action="Clear filters" onAction={function() { setFilterStatus(''); setFilterType(''); setFilterSeverity(''); }} />
          ) : (
            <div role="list" aria-label="Bug reports">
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
                <span style={{ fontSize: '12px', color: '#64748B' }}>{filtered.length} of {reports.length} report{reports.length !== 1 ? 's' : ''}</span>
              </div>
              {filtered.map(function(report) {
                var isExpanded = expandedId === report.id;
                var sev = report.severity && SEVERITY_CONFIG[report.severity];
                var stat = BUG_STATUS_CONFIG[report.status] || BUG_STATUS_CONFIG['new'];

                return (
                  <div key={report.id} role="listitem" className="border-b border-slate-100 last:border-b-0">
                    {/* Main row */}
                    <div className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      {/* Type + severity badges */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0 pt-0.5">
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px', background: report.type === 'bug' ? '#FEE2E2' : '#EDE9FE', color: report.type === 'bug' ? '#DC2626' : '#7C3AED', border: '1px solid ' + (report.type === 'bug' ? '#FECACA' : '#DDD6FE') }}>
                          {report.type === 'bug' ? 'Bug' : 'Suggestion'}
                        </span>
                        {sev && (
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px', background: sev.bg, color: sev.color, border: '1px solid ' + sev.border }}>
                            {sev.label}
                          </span>
                        )}
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0E1523', marginBottom: '4px' }}>{report.title}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          {report.app_area && <span style={{ fontSize: '12px', color: '#64748B' }}>{report.app_area === 'other' && report.other_area ? report.other_area : report.app_area}</span>}
                          {report.reporter_email && (
                            <a href={'mailto:' + report.reporter_email} style={{ fontSize: '12px', color: '#3B82F6' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Email ' + report.reporter_email}>
                              {report.reporter_email}
                            </a>
                          )}
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>{timeAgo(report.created_at)}</span>
                        </div>
                      </div>

                      {/* Screenshot thumbnail */}
                      {report.screenshot_url && (
                        <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="View screenshot">
                          <img src={report.screenshot_url} alt="Bug screenshot" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }} />
                        </a>
                      )}

                      {/* Status dropdown */}
                      <div className="relative flex-shrink-0">
                        <label htmlFor={'status-' + report.id} className="sr-only">Status for {report.title}</label>
                        <select
                          id={'status-' + report.id}
                          value={report.status}
                          onChange={function(e) { handleStatusChange(report.id, e.target.value); }}
                          disabled={updatingId === report.id}
                          style={{ fontSize: '12px', fontWeight: 600, padding: '4px 24px 4px 10px', borderRadius: '99px', background: stat.bg, color: stat.color, border: '1px solid ' + stat.border, appearance: 'none', cursor: 'pointer', opacity: updatingId === report.id ? 0.5 : 1 }}
                          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {BUG_STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{BUG_STATUS_CONFIG[s].label}</option>; })}
                        </select>
                        <ChevronDown size={10} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: stat.color }} aria-hidden="true" />
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={function() { setExpandedId(isExpanded ? null : report.id); }}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
                      </button>
                    </div>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {report.description && (
                            <div>
                              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Description</p>
                              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{report.description}</p>
                            </div>
                          )}
                          {report.steps_to_reproduce && (
                            <div>
                              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Steps to Reproduce</p>
                              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.steps_to_reproduce}</p>
                            </div>
                          )}
                          <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Technical Details</p>
                            <div className="space-y-1">
                              {report.reported_url && (
                                <div className="flex items-start gap-2">
                                  <ExternalLink size={12} className="text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                  <a href={report.reported_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3B82F6', wordBreak: 'break-all' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                                    {report.reported_url}
                                  </a>
                                </div>
                              )}
                              {report.user_agent && (
                                <div className="flex items-start gap-2">
                                  <Activity size={12} className="text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                  <p style={{ fontSize: '11px', color: '#94A3B8', wordBreak: 'break-all' }}>{report.user_agent}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          {report.screenshot_url && (
                            <div>
                              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Screenshot</p>
                              <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="View full screenshot">
                                <img src={report.screenshot_url} alt="Bug screenshot" style={{ maxWidth: '240px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── Contacts tab ─────────────────────────────────────────────────────────────
function ContactsTab() {
  var [contacts, setContacts] = useState([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');

  useEffect(function() { loadContacts(); }, []);

  function loadContacts() {
    setLoading(true);
    supabase.from('marketing_contacts').select('*').order('created_at', { ascending: false })
      .then(function(result) {
        if (result.error) { mascotErrorToast('Failed to load contacts.'); }
        else { setContacts(result.data || []); }
        setLoading(false);
      });
  }

  function handleExportCSV() {
    var rows = [['Name', 'Email', 'Organization', 'Message', 'Date']];
    contacts.forEach(function(c) {
      rows.push([
        '"' + (c.name || '').replace(/"/g, '""') + '"',
        '"' + (c.email || '').replace(/"/g, '""') + '"',
        '"' + (c.organization || '').replace(/"/g, '""') + '"',
        '"' + (c.message || '').replace(/"/g, '""') + '"',
        c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
      ]);
    });
    var csv = rows.map(function(r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'syndicade_contacts.csv'; a.click();
    URL.revokeObjectURL(url);
    mascotSuccessToast('CSV exported!', contacts.length + ' contacts downloaded.');
  }

  var filtered = contacts.filter(function(c) {
    var q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.organization || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0E1523' }}>Marketing Contacts</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{loading ? '—' : contacts.length + ' total contact' + (contacts.length !== 1 ? 's' : '') + ' from the landing page'}</p>
        </div>
        <button onClick={handleExportCSV} disabled={loading || contacts.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Export contacts as CSV">
          <Download size={14} aria-hidden="true" /> Export CSV
        </button>
      </div>
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <label htmlFor="contacts-search" className="sr-only">Search contacts</label>
        <input id="contacts-search" type="search" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search by name, email, or organization..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {loading && <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" aria-busy="true" aria-label="Loading contacts"><TableSkeleton /></div>}
      {!loading && contacts.length === 0 && <div className="bg-white border border-slate-200 rounded-xl"><EmptyState icon={Mail} title="No contacts yet" description="Contacts appear when people submit the landing page form." /></div>}
      {!loading && contacts.length > 0 && filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl">
          <EmptyState icon={Search} title="No contacts match your search" description="Try a different name, email, or organization." action="Clear search" onAction={function() { setSearch(''); }} />
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="region" aria-label="Marketing contacts table">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <span style={{ fontSize: '12px', color: '#64748B' }}>{search ? filtered.length + ' of ' + contacts.length + ' contacts' : contacts.length + ' contact' + (contacts.length !== 1 ? 's' : '')}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100" role="row">
                  <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">Name</th>
                  <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">Email</th>
                  <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">Organization</th>
                  <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">Message</th>
                  <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(function(c, idx) {
                  return (
                    <tr key={c.id} className={'border-t border-slate-100 hover:bg-slate-50 transition-colors ' + (idx % 2 === 0 ? '' : 'bg-slate-50/50')} role="row">
                      <td className="px-6 py-4" style={{ fontWeight: 600, color: '#0E1523', whiteSpace: 'nowrap' }}>{c.name || '—'}</td>
                      <td className="px-6 py-4">
                        <a href={'mailto:' + c.email} className="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Email ' + (c.name || c.email)}>{c.email || '—'}</a>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#475569' }}>{c.organization || '—'}</td>
                      <td className="px-6 py-4 max-w-xs" style={{ color: '#64748B' }}>
                        {c.message ? <span className="line-clamp-2" title={c.message}>{c.message}</span> : <span style={{ color: '#94A3B8' }}>—</span>}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
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
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [metrics, setMetrics] = useState(null);
  var [planBreakdown, setPlanBreakdown] = useState([]);
  var [atRiskOrgs, setAtRiskOrgs] = useState([]);
  var [pendingVerifications, setPendingVerifications] = useState([]);
  var [recentOrgs, setRecentOrgs] = useState([]);
  var [openBugs, setOpenBugs] = useState(0);
  var [criticalBugs, setCriticalBugs] = useState(0);
  var [states, setStates] = useState([]);
  var [cities, setCities] = useState([]);
  var [filterState, setFilterState] = useState('');
  var [filterCity, setFilterCity] = useState('');
  var [actionLoading, setActionLoading] = useState(null);

  useEffect(function() { loadAll(false); loadLocationOptions(); }, []);
  useEffect(function() { if (!loading) loadMetrics(); }, [filterState, filterCity]);

  async function loadAll(showRefresh) {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    await Promise.all([loadMetrics(), loadPendingVerifications(), loadBugSummary()]);
    setLoading(false); setRefreshing(false);
  }

  async function loadBugSummary() {
    var res = await supabase.from('bug_reports').select('status, severity').in('status', ['new', 'in_review']);
    var bugs = res.data || [];
    setOpenBugs(bugs.length);
    setCriticalBugs(bugs.filter(function(b) { return b.severity === 'critical'; }).length);
  }

  async function getSignedUrl(path) {
    var res = await supabase.storage.from('verification-docs').createSignedUrl(path, 60);
    if (res.error || !res.data) { toast.error('Could not open document.'); return; }
    window.open(res.data.signedUrl, '_blank');
  }

  async function loadMetrics() {
    var now = new Date();
    var weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    var monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    var fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    var orgQuery = supabase.from('organizations').select('id, name, created_at, city, state, is_verified_nonprofit');
    if (filterState) orgQuery = orgQuery.eq('state', filterState);
    if (filterCity) orgQuery = orgQuery.eq('city', filterCity);
    var results = await Promise.all([
      supabase.from('members').select('user_id', { count: 'exact', head: true }),
      orgQuery,
      supabase.from('subscriptions').select('organization_id, plan_id, status, trial_ends_at, current_period_end'),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('members').select('user_id', { count: 'exact', head: true }).gte('joined_date', weekAgo),
      supabase.from('members').select('user_id', { count: 'exact', head: true }).gte('joined_date', monthAgo),
    ]);
    var mr = results[0]; var or = results[1]; var sr = results[2]; var er = results[3]; var mw = results[4]; var mm = results[5];
    var allOrgs = or.data || [];
    var allSubs = sr.data || [];
    var activeSubs = allSubs.filter(function(s) { return s.status === 'active'; });
    var trialSubs = allSubs.filter(function(s) { return s.status === 'trialing'; });
    var canceledSubs = allSubs.filter(function(s) { return s.status === 'canceled'; });
    var paidIds = new Set(activeSubs.map(function(s) { return s.organization_id; }));
    var trialIds = new Set(trialSubs.map(function(s) { return s.organization_id; }));
    var mrr = activeSubs.reduce(function(acc, s) { return acc + (PLAN_PRICES[s.plan_id] || 0); }, 0);
    var planMap = {};
    activeSubs.forEach(function(s) { planMap[s.plan_id] = (planMap[s.plan_id] || 0) + 1; });
    setPlanBreakdown(Object.keys(planMap).map(function(k) { return { plan: k, label: PLAN_LABELS[k] || k, count: planMap[k], mrr: (planMap[k] * (PLAN_PRICES[k] || 0)).toFixed(2) }; }));
    var newOrgsWeek = allOrgs.filter(function(o) { return o.created_at > weekAgo; }).length;
    var newOrgsMonth = allOrgs.filter(function(o) { return o.created_at > monthAgo; }).length;
    var atRisk = allOrgs.filter(function(o) { return o.created_at < fourteenDaysAgo && !paidIds.has(o.id) && !trialIds.has(o.id); }).slice(0, 10);
    setAtRiskOrgs(atRisk);
    setRecentOrgs(allOrgs.slice().sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); }).slice(0, 5));
    setMetrics({
      totalMembers: mr.count || 0, totalOrgs: allOrgs.length,
      newMembersWeek: mw.count || 0, newMembersMonth: mm.count || 0,
      newOrgsWeek, newOrgsMonth,
      paidOrgs: allOrgs.filter(function(o) { return paidIds.has(o.id); }).length,
      trialOrgs: allOrgs.filter(function(o) { return trialIds.has(o.id); }).length,
      freeOrgs: allOrgs.length - allOrgs.filter(function(o) { return paidIds.has(o.id) || trialIds.has(o.id); }).length,
      canceledSubs: canceledSubs.length, mrr: mrr.toFixed(2),
      totalEvents: er.count || 0,
      atRiskCount: atRisk.length,
      verifiedNonprofits: allOrgs.filter(function(o) { return o.is_verified_nonprofit; }).length,
    });
  }

  async function loadPendingVerifications() {
    var res = await supabase.from('nonprofit_verifications')
      .select('id, ein, document_url, submitted_at, organization_id, organizations(name, city, state)')
      .eq('status', 'pending').order('submitted_at', { ascending: true });
    setPendingVerifications(res.data || []);
  }

  async function loadLocationOptions() {
    var res = await supabase.from('organizations').select('state, city').not('state', 'is', null);
    if (!res.data) return;
    var ss = new Set(); var cs = new Set();
    res.data.forEach(function(o) { if (o.state) ss.add(o.state); if (o.city) cs.add(o.city); });
    setStates(Array.from(ss).sort()); setCities(Array.from(cs).sort());
  }

  async function handleVerification(id, orgId, action) {
    setActionLoading(id + action);
    var status = action === 'approve' ? 'approved' : 'rejected';
    var res = await supabase.from('nonprofit_verifications').update({ status: status, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (res.error) { toast.error('Failed.'); setActionLoading(null); return; }
    if (action === 'approve') await supabase.from('organizations').update({ is_verified_nonprofit: true, trial_length_days: 30 }).eq('id', orgId);
    await logAction('verification_' + action, 'verification', id, { organization_id: orgId });
    mascotSuccessToast(action === 'approve' ? 'Nonprofit verified.' : 'Verification rejected.');
    setActionLoading(null); loadPendingVerifications(); loadMetrics();
  }

  var pendingActionsCount = (pendingVerifications.length) + (criticalBugs) + (metrics && metrics.atRiskCount || 0);

  return (
    <div>
      {/* Pending Actions summary */}
      {!loading && pendingActionsCount > 0 && (
        <section aria-label="Pending actions" className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-yellow-600" aria-hidden="true" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#92400E' }}>Needs your attention</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {pendingVerifications.length > 0 && (
                <span style={{ fontSize: '13px', color: '#92400E' }}>
                  {pendingVerifications.length} pending verification{pendingVerifications.length !== 1 ? 's' : ''}
                </span>
              )}
              {criticalBugs > 0 && (
                <span style={{ fontSize: '13px', color: '#DC2626' }}>
                  {criticalBugs} critical bug{criticalBugs !== 1 ? 's' : ''} open
                </span>
              )}
              {metrics && metrics.atRiskCount > 0 && (
                <span style={{ fontSize: '13px', color: '#B45309' }}>
                  {metrics.atRiskCount} at-risk org{metrics.atRiskCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Filters + refresh */}
      <div className="flex items-center gap-4 flex-wrap mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin size={14} aria-hidden="true" />Filter by location:</div>
        <div className="relative">
          <label htmlFor="filter-state" className="sr-only">State</label>
          <select id="filter-state" value={filterState} onChange={function(e) { setFilterState(e.target.value); setFilterCity(''); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="">All States</option>
            {states.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="filter-city" className="sr-only">City</label>
          <select id="filter-city" value={filterCity} onChange={function(e) { setFilterCity(e.target.value); }} disabled={!filterState} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-40">
            <option value="">All Cities</option>
            {cities.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        {(filterState || filterCity) && <button onClick={function() { setFilterState(''); setFilterCity(''); }} className="text-sm text-slate-500 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Clear</button>}
        <div className="ml-auto">
          <button onClick={function() { loadAll(true); }} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <section aria-label="Key metrics" className="mb-10">
        <SectionLabel>Platform Overview</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading ? Array.from({ length: 10 }).map(function(_, i) { return <MetricSkeleton key={i} />; })
            : metrics ? (
              <>
                <MetricCard icon={Users} label="Total Members" value={metrics.totalMembers.toLocaleString()} sub={'+' + metrics.newMembersWeek + ' this week'} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <MetricCard icon={Building2} label="Total Orgs" value={metrics.totalOrgs.toLocaleString()} sub={'+' + metrics.newOrgsWeek + ' this week'} iconBg="bg-purple-50" iconColor="text-purple-500" />
                <MetricCard icon={DollarSign} label="Est. MRR" value={formatMRR(metrics.mrr)} sub={metrics.paidOrgs + ' paying orgs'} iconBg="bg-green-50" iconColor="text-green-600" />
                <MetricCard icon={Activity} label="Paid Orgs" value={metrics.paidOrgs} sub={metrics.trialOrgs + ' on trial · ' + metrics.freeOrgs + ' free'} iconBg="bg-green-50" iconColor="text-green-600" />
                <MetricCard icon={ShieldCheck} label="Pending Verif." value={pendingVerifications.length} sub="Awaiting review" iconBg="bg-purple-50" iconColor="text-purple-500" alert={pendingVerifications.length > 0} />
                <MetricCard icon={Calendar} label="Total Events" value={metrics.totalEvents.toLocaleString()} sub="Across all orgs" iconBg="bg-blue-50" iconColor="text-blue-500" />
                <MetricCard icon={TrendingUp} label="New Orgs (Month)" value={metrics.newOrgsMonth} sub={metrics.newOrgsWeek + ' in past 7 days'} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <MetricCard icon={CheckCircle} label="Verified Nonprofits" value={metrics.verifiedNonprofits} sub="Approved 501(c)(3)" iconBg="bg-green-50" iconColor="text-green-600" />
                <MetricCard icon={Bug} label="Open Bug Reports" value={openBugs} sub={criticalBugs + ' critical'} iconBg="bg-red-50" iconColor="text-red-500" alert={criticalBugs > 0} />
                <MetricCard icon={AlertTriangle} label="At-Risk Orgs" value={metrics.atRiskCount} sub="14+ days, no plan" iconBg="bg-yellow-50" iconColor="text-yellow-600" alert={metrics.atRiskCount > 0} />
              </>
            ) : null}
        </div>
      </section>

      {/* Plan breakdown */}
      <section className="mb-10" aria-label="Revenue by plan">
        <SectionLabel>Revenue by Plan</SectionLabel>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? <div className="p-6">{Array.from({ length: 3 }).map(function(_, i) { return <div key={i} className="mb-3"><RowSkeleton /></div>; })}</div>
            : planBreakdown.length === 0 ? <EmptyState icon={Zap} title="No paid subscriptions yet" description="Revenue breakdown appears once orgs start paying." />
            : (
              <table className="w-full" role="table" aria-label="Plan revenue breakdown">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">Plan</th>
                    <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">Orgs</th>
                    <th className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {planBreakdown.map(function(row, i) {
                    return (
                      <tr key={row.plan} className={'border-b border-slate-100 ' + (i % 2 === 1 ? 'bg-slate-50/50' : '')}>
                        <td className="px-6 py-3 text-sm font-semibold" style={{ color: '#0E1523' }}>{row.label}</td>
                        <td className="px-6 py-3 text-sm" style={{ color: '#475569' }}>{row.count}</td>
                        <td className="px-6 py-3 text-sm font-bold" style={{ color: '#16A34A' }}>{formatMRR(row.mrr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </section>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <section aria-label="At-risk organizations">
          <SectionLabel>At-Risk Orgs</SectionLabel>
          <div className="bg-white border border-yellow-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-yellow-50">
              <AlertTriangle size={13} className="text-yellow-600" aria-hidden="true" />
              <span style={{ fontSize: '12px', color: '#92400E' }}>14+ days since signup — no plan</span>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 3 }).map(function(_, i) { return <div key={i} className="px-5 py-3"><RowSkeleton /></div>; })
                : atRiskOrgs.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <CheckCircle size={26} className="text-green-500 mx-auto mb-2" aria-hidden="true" />
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#0E1523' }}>No at-risk orgs</p>
                  </div>
                ) : atRiskOrgs.map(function(org) {
                  return (
                    <div key={org.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-yellow-100 text-yellow-700" aria-hidden="true">{getInitials(org.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '13px', color: '#0E1523', fontWeight: 600 }} className="truncate">{org.name}</p>
                        <p style={{ fontSize: '11px', color: '#64748B' }}>{org.city && org.state ? org.city + ', ' + org.state + ' · ' : ''}Joined {timeAgo(org.created_at)}</p>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', flexShrink: 0 }}>No Plan</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
        <section aria-label="Recent signups">
          <SectionLabel>Recent Signups</SectionLabel>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <Clock size={13} className="text-slate-400" aria-hidden="true" />
              <span style={{ fontSize: '12px', color: '#64748B' }}>Most recently created orgs</span>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 3 }).map(function(_, i) { return <div key={i} className="px-5 py-3"><RowSkeleton /></div>; })
                : recentOrgs.length === 0 ? <EmptyState icon={Building2} title="No organizations yet" description="New orgs will appear here." />
                : recentOrgs.map(function(org) {
                  return (
                    <div key={org.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-100 text-blue-700" aria-hidden="true">{getInitials(org.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '13px', color: '#0E1523', fontWeight: 600 }} className="truncate">{org.name}</p>
                        <p style={{ fontSize: '11px', color: '#64748B' }}>{org.city && org.state ? org.city + ', ' + org.state + ' · ' : ''}{timeAgo(org.created_at)}</p>
                      </div>
                      {org.is_verified_nonprofit && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0', flexShrink: 0 }}>Verified</span>}
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      </div>

      {/* Verification queue */}
      <section aria-label="Pending verifications" className="mb-10">
        <SectionLabel>Verification Queue</SectionLabel>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? <div className="p-6">{Array.from({ length: 2 }).map(function(_, i) { return <div key={i} className="mb-3"><RowSkeleton /></div>; })}</div>
            : pendingVerifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle size={36} className="text-green-500 mx-auto mb-3" aria-hidden="true" />
                <p style={{ fontWeight: 700, fontSize: '15px', color: '#0E1523', marginBottom: '4px' }}>Queue is clear</p>
                <p style={{ fontSize: '13px', color: '#64748B' }}>No pending requests.</p>
              </div>
            ) : (
              <div role="list" aria-label="Pending verification requests">
                {pendingVerifications.map(function(v) {
                  var orgName = v.organizations && v.organizations.name || 'Unknown';
                  var location = v.organizations && v.organizations.city && v.organizations.state ? v.organizations.city + ', ' + v.organizations.state : '';
                  return (
                    <div key={v.id} role="listitem" className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 flex-wrap hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-purple-100 text-purple-700" aria-hidden="true">{getInitials(orgName)}</div>
                        <div className="min-w-0">
                          <p style={{ fontSize: '14px', color: '#0E1523', fontWeight: 700 }} className="truncate">{orgName}</p>
                          <p style={{ fontSize: '12px', color: '#64748B' }}>{location && location + ' · '}EIN: {v.ein || 'Not provided'} · {timeAgo(v.submitted_at)}</p>
                        </div>
                      </div>
                      {v.document_url && (
                        <button onClick={function() { var path = v.document_url.split('/verification-docs/')[1]; getSignedUrl(path); }} className="text-sm text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded flex-shrink-0" aria-label={'View IRS letter for ' + orgName}>
                          View Document
                        </button>
                      )}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={function() { handleVerification(v.id, v.organization_id, 'approve'); }} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors" aria-label={'Approve ' + orgName}>
                          <CheckCircle size={13} aria-hidden="true" />{actionLoading === v.id + 'approve' ? 'Approving...' : 'Approve'}
                        </button>
                        <button onClick={function() { handleVerification(v.id, v.organization_id, 'reject'); }} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors" aria-label={'Reject ' + orgName}>
                          <XCircle size={13} aria-hidden="true" />{actionLoading === v.id + 'reject' ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function StaffDashboard() {
  var navigate = useNavigate();
  var [staffMember, setStaffMember] = useState(null);
  var [authChecked, setAuthChecked] = useState(false);
  var [activeTab, setActiveTab] = useState('overview');

  var TABS = [
    { key: 'overview',    label: 'Overview',       icon: BarChart2 },
    { key: 'members',     label: 'Members',         icon: Users },
    { key: 'orgs',        label: 'Organizations',   icon: Building2 },
    { key: 'content',     label: 'Content',         icon: FileText },
    { key: 'financials',  label: 'Financials',      icon: Receipt },
    { key: 'promo_codes', label: 'Promo Codes',     icon: Tag },
    { key: 'goals',       label: 'Goals',           icon: TrendingUp },
    { key: 'contacts',    label: 'Contacts',        icon: Mail },
    { key: 'bug_reports', label: 'Bug Reports',     icon: Bug },
  ];

  useEffect(function() {
    supabase.auth.getUser().then(function(res) {
      var user = res.data && res.data.user;
      if (!user) { navigate('/login'); return; }
      supabase.from('members').select('user_id, first_name, last_name, is_staff').eq('user_id', user.id).single().then(function(r) {
        if (r.error || !r.data || !r.data.is_staff) { toast.error('Access denied.'); navigate('/dashboard'); return; }
        setStaffMember(r.data); setAuthChecked(true);
      });
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse mx-auto mb-4" aria-hidden="true" />
          <p style={{ fontSize: '13px', color: '#64748B' }}>Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm" role="banner">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#0E1523', fontWeight: 800, fontSize: '18px' }}>Syndi</span>
              <span style={{ color: '#F5B731', fontWeight: 800, fontSize: '18px' }}>cade</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 ml-1">Staff Portal</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{staffMember.first_name} {staffMember.last_name}</p>
          </div>
          <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" aria-label="Open Vercel Analytics">
            <BarChart2 size={15} aria-hidden="true" /> Website Traffic
          </a>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-white border-b border-slate-200 px-6" aria-label="Staff dashboard sections" role="tablist">
        <div className="max-w-[1600px] mx-auto flex overflow-x-auto">
          {TABS.map(function(tab) {
            var Icon = tab.icon;
            var isActive = activeTab === tab.key;
            return (
              <button key={tab.key} role="tab" aria-selected={isActive} onClick={function() { setActiveTab(tab.key); }} className={'flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset whitespace-nowrap ' + (isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}>
                <Icon size={15} aria-hidden="true" />{tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8" role="main">
        {activeTab === 'overview'    && <OverviewTab />}
        {activeTab === 'members'     && <MembersTab />}
        {activeTab === 'orgs'        && <OrgsTab />}
        {activeTab === 'content'     && <ContentEditor staffUserId={staffMember && staffMember.user_id} />}
        {activeTab === 'financials'  && <StaffFinancials staffUserId={staffMember && staffMember.user_id} />}
        {activeTab === 'promo_codes' && <StaffPromoCodes />}
        {activeTab === 'goals'       && <StaffGoals />}
        {activeTab === 'contacts'    && <ContactsTab />}
        {activeTab === 'bug_reports' && <BugReportsTab />}
      </main>
    </div>
  );
}