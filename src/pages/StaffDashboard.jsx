/**
 * StaffDashboard.jsx
 * Internal Syndicade staff-only page — gated by members.is_staff = true
 * Route: /staff
 *
 * Tabs:
 * 1. Overview    — metrics, at-risk orgs, verification queue
 * 2. Members     — search, view, account tools (reset password, suspend, impersonate)
 * 3. Orgs        — search, view, manually adjust plan
 * 4. Content     — zero-code content editing
 * 5. Financials  — revenue, expenses, and tax summary
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ContentEditor from '../components/ContentEditor';
import StaffFinancials from '../components/StaffFinancials';
import StaffPromoCodes from '../components/StaffPromoCodes';
import StaffGoals from '../components/StaffGoals';
import {
  Users, Building2, DollarSign, ShieldCheck, Tag, TrendingUp, AlertTriangle,
  Calendar, Activity, Clock, CheckCircle, XCircle, RefreshCw, ChevronDown,
  MapPin, BarChart2, UserX, Zap, Search, KeyRound, Ban, ChevronRight, X,
  FileText, Download, Receipt, PlusCircle, Trash2,
} from 'lucide-react';

// ─── Plan config ──────────────────────────────────────────────────────────────
var PLAN_PRICES = {
  starter_month: 14.99, starter_year: 12.49,
  growth_month: 29.00,  growth_year: 24.17,
  pro_month: 59.00,     pro_year: 49.17,
};
var ANNUAL_PRICES = {
  starter_year: 149.88,
  growth_year:  290.00,
  pro_year:     590.00,
};
var PLAN_LABELS = {
  starter_month: 'Starter (Monthly)', starter_year: 'Starter (Annual)',
  growth_month:  'Growth (Monthly)',  growth_year:  'Growth (Annual)',
  pro_month:     'Pro (Monthly)',     pro_year:     'Pro (Annual)',
};
var ALL_PLANS = Object.keys(PLAN_LABELS).map(function (k) { return { value: k, label: PLAN_LABELS[k] }; });

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
function formatCurrency(val) {
  return '$' + parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getInitials(name) {
  if (!name) return '??';
  var parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
async function logAction(action, targetType, targetId, details) {
  var { data: { user } } = await supabase.auth.getUser();
  await supabase.from('staff_audit_log').insert({
    staff_user_id: user.id, action: action,
    target_type: targetType, target_id: targetId, details: details || {},
  });
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function MetricSkeleton() {
  return (
    <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-5 animate-pulse" aria-hidden="true">
      <div className="w-9 h-9 rounded-lg bg-[#2A3550] mb-3" />
      <div className="h-3 w-20 rounded bg-[#2A3550] mb-2" />
      <div className="h-8 w-16 rounded bg-[#2A3550] mb-2" />
      <div className="h-3 w-28 rounded bg-[#2A3550]" />
    </div>
  );
}
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse" aria-hidden="true">
      <div className="w-8 h-8 rounded-full bg-[#2A3550] flex-shrink-0" />
      <div className="flex-1"><div className="h-3 w-40 rounded bg-[#2A3550] mb-1" /><div className="h-3 w-24 rounded bg-[#2A3550]" /></div>
      <div className="h-6 w-16 rounded bg-[#2A3550]" />
    </div>
  );
}
function TableSkeleton() {
  return (
    <div className="divide-y divide-[#2A3550]" aria-hidden="true">
      {Array.from({ length: 4 }).map(function (_, i) {
        return (
          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-[#2A3550] flex-shrink-0" />
            <div className="flex-1"><div className="h-3 w-48 rounded bg-[#2A3550] mb-2" /><div className="h-3 w-32 rounded bg-[#2A3550]" /></div>
            <div className="h-6 w-20 rounded bg-[#2A3550]" />
            <div className="h-8 w-20 rounded bg-[#2A3550]" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div className="text-[11px] font-700 uppercase tracking-[4px] text-[#F5B731] mb-4">{children}</div>;
}
function MetricCard({ icon: Icon, label, value, sub, iconBg, iconColor, alert }) {
  return (
    <div className={'bg-[#1A2035] border rounded-xl p-5 ' + (alert ? 'border-yellow-500/40' : 'border-[#2A3550]')} role="region" aria-label={label + ' metric'}>
      <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-3 ' + iconBg}>
        <Icon size={18} className={iconColor} aria-hidden="true" />
      </div>
      <div className="text-[11px] font-700 uppercase tracking-widest text-[#F5B731] mb-1">{label}</div>
      <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
      {sub && <div className="text-[12px] text-[#94A3B8]">{sub}</div>}
    </div>
  );
}
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="px-6 py-12 text-center">
      <Icon size={36} className="text-[#2A3550] mx-auto mb-3" aria-hidden="true" />
      <p className="text-white font-700 text-[15px] mb-1">{title}</p>
      <p className="text-[13px] text-[#64748B]">{description}</p>
    </div>
  );
}

// ─── Member drawer ────────────────────────────────────────────────────────────
function MemberDrawer({ member, onClose, onAction }) {
  var [memberships, setMemberships] = useState([]);
  var [loadingMemberships, setLoadingMemberships] = useState(true);
  var [actionLoading, setActionLoading] = useState(null);

  useEffect(function () {
    supabase.from('memberships')
      .select('role, status, organizations(name, city, state)')
      .eq('member_id', member.user_id)
      .then(function (res) { setMemberships(res.data || []); setLoadingMemberships(false); });
  }, [member.user_id]);

  async function handleResetPassword() {
    setActionLoading('reset');
    var { error } = await supabase.auth.resetPasswordForEmail(member.email, { redirectTo: window.location.origin + '/reset-password' });
    if (error) { toast.error('Failed to send reset email.'); }
    else { toast.success('Password reset email sent.'); await logAction('password_reset_sent', 'member', member.user_id, { email: member.email }); }
    setActionLoading(null);
  }

  async function handleToggleSuspend() {
    var newStatus = member.account_status === 'suspended' ? 'active' : 'suspended';
    setActionLoading('suspend');
    var { error } = await supabase.from('members').update({ account_status: newStatus }).eq('user_id', member.user_id);
    if (error) { toast.error('Failed to update account.'); }
    else {
      toast.success(newStatus === 'suspended' ? 'Account suspended.' : 'Account reactivated.');
      await logAction(newStatus === 'suspended' ? 'account_suspended' : 'account_reactivated', 'member', member.user_id);
      onAction();
    }
    setActionLoading(null);
  }

  async function handleImpersonate() {
    setActionLoading('impersonate');
    var sessionRes = await supabase.auth.getSession();
    var accessToken = sessionRes.data?.session?.access_token;
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
    navigator.clipboard.writeText(json.link).catch(function () {});
    window.open(json.link, '_blank', 'noopener,noreferrer');
    toast.success('Impersonation link opened and copied to clipboard.');
    setActionLoading(null);
  }

  var isSuspended = member.account_status === 'suspended';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={'Member details: ' + member.first_name + ' ' + member.last_name}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-[#151B2D] border-l border-[#2A3550] h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2A3550]">
          <div>
            <h2 className="text-white font-extrabold text-[16px]">{member.first_name} {member.last_name}</h2>
            <p className="text-[12px] text-[#64748B]">{member.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-white hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={'inline-flex items-center px-3 py-1 rounded-full text-[12px] font-700 border ' + (isSuspended ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20')}>
              {isSuspended ? 'Suspended' : 'Active'}
            </span>
            {member.is_staff && <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-700 bg-[#2D1B4E] text-purple-400 border border-purple-500/20">Staff</span>}
          </div>
          {/* Info */}
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Joined</span><span className="text-[#CBD5E1]">{member.joined_date ? new Date(member.joined_date).toLocaleDateString() : '—'}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Member #</span><span className="text-[#CBD5E1] font-600">{'#' + (member.member_number || '—')}</span></div>
<div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Phone</span><span className="text-[#CBD5E1]">{member.phone || '—'}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Organizations</span><span className="text-[#CBD5E1]">{memberships.length}</span></div>
          </div>
          {/* Tools */}
          <div>
            <SectionLabel>Account Tools</SectionLabel>
            <div className="space-y-3">
              <button onClick={handleResetPassword} disabled={actionLoading !== null} className="w-full flex items-center gap-3 px-4 py-3 bg-[#1A2035] border border-[#2A3550] rounded-xl text-[13px] text-[#CBD5E1] font-600 hover:border-blue-500/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors text-left">
                <KeyRound size={16} className="text-blue-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div>{actionLoading === 'reset' ? 'Sending...' : 'Send Password Reset Email'}</div>
                  <div className="text-[11px] text-[#64748B]">Sends a link to {member.email}</div>
                </div>
              </button>
              <button onClick={handleToggleSuspend} disabled={actionLoading !== null} className={'w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-[13px] font-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#151B2D] disabled:opacity-50 transition-colors text-left ' + (isSuspended ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 focus:ring-green-500' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 focus:ring-red-500')} aria-label={isSuspended ? 'Reactivate account' : 'Suspend account'}>
                <Ban size={16} className="flex-shrink-0" aria-hidden="true" />
                <div>
                  <div>{actionLoading === 'suspend' ? 'Updating...' : (isSuspended ? 'Reactivate Account' : 'Suspend Account')}</div>
                  <div className="text-[11px] opacity-70">{isSuspended ? 'Restore full access' : 'Block login immediately'}</div>
                </div>
              </button>
              <button onClick={handleImpersonate} disabled={actionLoading !== null} className="w-full flex items-center gap-3 px-4 py-3 bg-[#1A2035] border border-[#2A3550] rounded-xl text-[13px] text-[#CBD5E1] font-600 hover:border-yellow-500/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors text-left">
                <Zap size={16} className="text-yellow-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <div>{actionLoading === 'impersonate' ? 'Generating link...' : 'Impersonate User'}</div>
                  <div className="text-[11px] text-[#64748B]">Opens login link — logged to audit trail</div>
                </div>
              </button>
            </div>
          </div>
          {/* Memberships */}
          <div>
            <SectionLabel>Organization Memberships</SectionLabel>
            {loadingMemberships ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map(function (_, i) { return <div key={i} className="h-12 rounded-xl bg-[#1A2035] animate-pulse" aria-hidden="true" />; })}</div>
            ) : memberships.length === 0 ? (
              <p className="text-[13px] text-[#64748B]">Not a member of any organizations.</p>
            ) : memberships.map(function (m, i) {
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-[#1A2035] border border-[#2A3550] rounded-xl mb-2">
                  <div>
                    <p className="text-[13px] text-white font-600">{m.organizations?.name || 'Unknown'}</p>
                    <p className="text-[11px] text-[#64748B]">{m.organizations?.city && m.organizations?.state ? m.organizations.city + ', ' + m.organizations.state : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={'text-[10px] font-700 px-2 py-0.5 rounded-full ' + (m.role === 'admin' ? 'bg-[#2D1B4E] text-purple-400' : 'bg-[#1D3461] text-blue-400')}>{m.role}</span>
                    <span className={'text-[10px] font-700 px-2 py-0.5 rounded-full ' + (m.status === 'active' ? 'bg-[#1B3A2F] text-green-400' : 'bg-[#2A1A1A] text-red-400')}>{m.status}</span>
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
  var [selectedPlan, setSelectedPlan] = useState(subscription?.plan_id || '');
  var [planLoading, setPlanLoading] = useState(false);

  useEffect(function () {
    supabase.from('memberships')
      .select('role, members(first_name, last_name, email)')
      .eq('organization_id', org.id).eq('status', 'active').limit(10)
      .then(function (res) { setMembers(res.data || []); setLoadingMembers(false); });
  }, [org.id]);

  async function handlePlanChange() {
    if (selectedPlan === (subscription?.plan_id || '')) return;
    setPlanLoading(true);
    var payload = { organization_id: org.id, plan_id: selectedPlan || null, status: selectedPlan ? 'active' : 'canceled' };
    var op = subscription?.organization_id
      ? supabase.from('subscriptions').update({ plan_id: selectedPlan || null, status: selectedPlan ? 'active' : 'canceled' }).eq('organization_id', org.id)
      : supabase.from('subscriptions').insert(payload);
    var { error } = await op;
    if (error) { toast.error('Failed to update plan.'); setPlanLoading(false); return; }
    await logAction('plan_changed', 'organization', org.id, { old_plan: subscription?.plan_id || 'none', new_plan: selectedPlan || 'none', org_name: org.name });
    toast.success(selectedPlan ? 'Plan updated to ' + PLAN_LABELS[selectedPlan] : 'Plan removed.');
    setPlanLoading(false);
    onAction();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={'Org details: ' + org.name}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-[#151B2D] border-l border-[#2A3550] h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2A3550]">
          <div>
            <h2 className="text-white font-extrabold text-[16px]">{org.name}</h2>
            <p className="text-[12px] text-[#64748B]">{org.city && org.state ? org.city + ', ' + org.state : 'Location not set'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#64748B] hover:text-white hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {org.is_verified_nonprofit && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-700 bg-green-500/10 text-green-400 border border-green-500/20">
                <CheckCircle size={11} aria-hidden="true" /> Verified Nonprofit
              </span>
            )}
            <span className={'inline-flex items-center px-3 py-1 rounded-full text-[12px] font-700 border ' + (subscription?.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : subscription?.status === 'trialing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-[#2A3550] text-[#64748B] border-[#2A3550]')}>
              {subscription?.status === 'active' ? 'Paid' : subscription?.status === 'trialing' ? 'Trial' : 'Free'}
            </span>
          </div>
          {/* Info */}
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Current Plan</span><span className="text-[#CBD5E1] font-600">{subscription ? (PLAN_LABELS[subscription.plan_id] || subscription.plan_id) : 'Free'}</span></div>
            <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Created</span><span className="text-[#CBD5E1]">{new Date(org.created_at).toLocaleDateString()}</span></div>
            {subscription?.current_period_end && <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Renews</span><span className="text-[#CBD5E1]">{new Date(subscription.current_period_end).toLocaleDateString()}</span></div>}
            {subscription?.trial_ends_at && <div className="flex justify-between text-[13px]"><span className="text-[#64748B]">Trial ends</span><span className="text-[#CBD5E1]">{new Date(subscription.trial_ends_at).toLocaleDateString()}</span></div>}
          </div>
          {/* Plan adjustment */}
          <div>
            <SectionLabel>Adjust Plan</SectionLabel>
            <p className="text-[12px] text-[#64748B] mb-3">Manually override plan tier. All changes are logged.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label htmlFor={'plan-' + org.id} className="sr-only">Plan for {org.name}</label>
                <select id={'plan-' + org.id} value={selectedPlan} onChange={function (e) { setSelectedPlan(e.target.value); }} className="w-full appearance-none bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-[13px] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No plan (free)</option>
                  {ALL_PLANS.map(function (p) { return <option key={p.value} value={p.value}>{p.label}</option>; })}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" aria-hidden="true" />
              </div>
              <button onClick={handlePlanChange} disabled={planLoading || selectedPlan === (subscription?.plan_id || '')} className="px-4 py-2 bg-blue-500 text-white text-[13px] font-700 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D] disabled:opacity-40 transition-colors">
                {planLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          {/* Members */}
          <div>
            <SectionLabel>Active Members</SectionLabel>
            {loadingMembers ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map(function (_, i) { return <div key={i} className="h-10 rounded-xl bg-[#1A2035] animate-pulse" aria-hidden="true" />; })}</div>
            ) : members.length === 0 ? (
              <p className="text-[13px] text-[#64748B]">No active members found.</p>
            ) : members.map(function (m, i) {
              var name = m.members ? m.members.first_name + ' ' + m.members.last_name : 'Unknown';
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-[#1A2035] border border-[#2A3550] rounded-xl mb-2">
                  <div><p className="text-[13px] text-white font-600">{name}</p><p className="text-[11px] text-[#64748B]">{m.members?.email || ''}</p></div>
                  <span className={'text-[10px] font-700 px-2 py-0.5 rounded-full ' + (m.role === 'admin' ? 'bg-[#2D1B4E] text-purple-400' : 'bg-[#1D3461] text-blue-400')}>{m.role}</span>
                </div>
              );
            })}
            {members.length === 10 && <p className="text-[11px] text-[#64748B] text-center">Showing first 10 members</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Members tab ──────────────────────────────────────────────────────────────
function MembersTab() {
  var [query, setQuery] = useState('');
  var [results, setResults] = useState([]);
  var [loading, setLoading] = useState(false);
  var [searched, setSearched] = useState(false);
  var [selected, setSelected] = useState(null);

async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    var isNumber = /^\d+$/.test(query.trim());
    var q = supabase.from('members')
      .select('user_id, first_name, last_name, phone, joined_date, is_staff, account_status, member_number');
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
    var { data, error } = await q.limit(25);
    if (error) { toast.error('Search failed: ' + error.message); }
    else { setResults(data || []); }
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6" role="search" aria-label="Search members">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
          <label htmlFor="member-search" className="sr-only">Search by name or email</label>
          <input id="member-search" type="search" value={query} onChange={function (e) { setQuery(e.target.value); }} placeholder="Search by name, phone, or member number..." className="w-full bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-[14px] rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[#64748B]" autoComplete="off" />
        </div>
        <button type="submit" disabled={loading || !query.trim()} className="px-6 py-3 bg-blue-500 text-white font-700 text-[14px] rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0E1523] disabled:opacity-50 transition-colors">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : !searched ? <EmptyState icon={Search} title="Search for a member" description="Enter a name or email to look up any account." />
          : results.length === 0 ? <EmptyState icon={UserX} title="No members found" description={'No results for "' + query + '".'} />
          : (
            <div role="list" aria-label="Member search results">
              <div className="px-6 py-3 border-b border-[#2A3550]"><span className="text-[12px] text-[#64748B]">{results.length} result{results.length !== 1 ? 's' : ''}</span></div>
              {results.map(function (m) {
                var isSuspended = m.account_status === 'suspended';
                return (
                  <div key={m.user_id} role="listitem" className="flex items-center gap-4 px-6 py-4 border-b border-[#2A3550] last:border-b-0 hover:bg-[#1E2845] transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-700 flex-shrink-0 bg-[#1D3461] text-blue-400" aria-hidden="true">{(m.first_name?.[0] || '') + (m.last_name?.[0] || '')}</div>
<div className="flex-1 min-w-0">
                      <p className="text-[14px] text-white font-600">
                        {m.first_name} {m.last_name}
                        {m.is_staff && <span className="ml-2 text-[10px] font-700 text-purple-400 bg-[#2D1B4E] px-1.5 py-0.5 rounded-full">Staff</span>}
                      </p>
                      <p className="text-[12px] text-[#64748B] truncate">{'#' + (m.member_number || '—') + (m.phone ? ' · ' + m.phone : '')}</p>
                    </div>
                    <span className={'text-[11px] font-700 px-2.5 py-1 rounded-full flex-shrink-0 border ' + (isSuspended ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20')}>
                      {isSuspended ? 'Suspended' : 'Active'}
                    </span>
                    <button onClick={function () { setSelected(m); }} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E2845] border border-[#2A3550] text-[#CBD5E1] text-[12px] font-600 rounded-lg hover:border-blue-500/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex-shrink-0" aria-label={'Open details for ' + m.first_name + ' ' + m.last_name}>
                      View <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
      </div>
      {selected && <MemberDrawer member={selected} onClose={function () { setSelected(null); }} onAction={function () { setSelected(null); handleSearch(null); }} />}
    </div>
  );
}

// ─── Orgs tab ─────────────────────────────────────────────────────────────────
function OrgsTab() {
  var [query, setQuery] = useState('');
  var [results, setResults] = useState([]);
  var [subsMap, setSubsMap] = useState({});
  var [loading, setLoading] = useState(false);
  var [searched, setSearched] = useState(false);
  var [selected, setSelected] = useState(null);

  async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    var { data: orgs, error } = await supabase.from('organizations')
      .select('id, name, city, state, created_at, is_verified_nonprofit')
      .ilike('name', '%' + query + '%').limit(25);
    if (error) { toast.error('Search failed.'); setLoading(false); return; }
    setResults(orgs || []);
    if (orgs && orgs.length > 0) {
      var ids = orgs.map(function (o) { return o.id; });
      var { data: subs } = await supabase.from('subscriptions').select('organization_id, plan_id, status, trial_ends_at, current_period_end').in('organization_id', ids);
      var map = {};
      (subs || []).forEach(function (s) { map[s.organization_id] = s; });
      setSubsMap(map);
    }
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6" role="search" aria-label="Search organizations">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
          <label htmlFor="org-search" className="sr-only">Search by organization name</label>
          <input id="org-search" type="search" value={query} onChange={function (e) { setQuery(e.target.value); }} placeholder="Search by organization name..." className="w-full bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-[14px] rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[#64748B]" autoComplete="off" />
        </div>
        <button type="submit" disabled={loading || !query.trim()} className="px-6 py-3 bg-blue-500 text-white font-700 text-[14px] rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0E1523] disabled:opacity-50 transition-colors">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : !searched ? <EmptyState icon={Search} title="Search for an organization" description="Enter an org name to view its plan, members, and details." />
          : results.length === 0 ? <EmptyState icon={Building2} title="No organizations found" description={'No results for "' + query + '".'} />
          : (
            <div role="list" aria-label="Org search results">
              <div className="px-6 py-3 border-b border-[#2A3550]"><span className="text-[12px] text-[#64748B]">{results.length} result{results.length !== 1 ? 's' : ''}</span></div>
              {results.map(function (org) {
                var sub = subsMap[org.id];
                var statusColor = sub?.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : sub?.status === 'trialing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-[#2A3550] text-[#64748B] border-[#2A3550]';
                return (
                  <div key={org.id} role="listitem" className="flex items-center gap-4 px-6 py-4 border-b border-[#2A3550] last:border-b-0 hover:bg-[#1E2845] transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-700 flex-shrink-0 bg-[#2D1B4E] text-purple-400" aria-hidden="true">{org.name?.[0]?.toUpperCase() || '?'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] text-white font-600 truncate">{org.name}</p>
                        {org.is_verified_nonprofit && <CheckCircle size={13} className="text-green-400 flex-shrink-0" aria-label="Verified nonprofit" />}
                      </div>
                      <p className="text-[12px] text-[#64748B]">{org.city && org.state ? org.city + ', ' + org.state + ' · ' : ''}{sub ? (PLAN_LABELS[sub.plan] || sub.plan) : 'Free'}</p>
                    </div>
                    <span className={'text-[11px] font-700 px-2.5 py-1 rounded-full flex-shrink-0 border ' + statusColor}>
                      {sub?.status === 'active' ? 'Paid' : sub?.status === 'trialing' ? 'Trial' : 'Free'}
                    </span>
                    <button onClick={function () { setSelected({ org: org, sub: sub || null }); }} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E2845] border border-[#2A3550] text-[#CBD5E1] text-[12px] font-600 rounded-lg hover:border-blue-500/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex-shrink-0" aria-label={'Open details for ' + org.name}>
                      View <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
      </div>
      {selected && <OrgDrawer org={selected.org} subscription={selected.sub} onClose={function () { setSelected(null); }} onAction={function () { setSelected(null); handleSearch(null); }} />}
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
  var [states, setStates] = useState([]);
  var [cities, setCities] = useState([]);
  var [filterState, setFilterState] = useState('');
  var [filterCity, setFilterCity] = useState('');
  var [actionLoading, setActionLoading] = useState(null);

  useEffect(function () { loadAll(false); loadLocationOptions(); }, []);
  useEffect(function () { if (!loading) loadMetrics(); }, [filterState, filterCity]);

  async function loadAll(showRefresh) {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    await Promise.all([loadMetrics(), loadPendingVerifications()]);
    setLoading(false); setRefreshing(false);
  }

  async function getSignedUrl(path) {
    var { data, error } = await supabase.storage.from('verification-docs').createSignedUrl(path, 60);
    if (error || !data) { toast.error('Could not open document.'); return; }
    window.open(data.signedUrl, '_blank');
  }

  async function loadMetrics() {
    var now = new Date();
    var weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    var monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    var fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    var orgQuery = supabase.from('organizations').select('id, name, created_at, city, state, is_verified_nonprofit');
    if (filterState) orgQuery = orgQuery.eq('state', filterState);
    if (filterCity) orgQuery = orgQuery.eq('city', filterCity);
    var [mr, or, sr, er, mw, mm] = await Promise.all([
      supabase.from('members').select('user_id', { count: 'exact', head: true }),
      orgQuery,
     supabase.from('subscriptions').select('organization_id, plan, status, trial_ends_at, current_period_end'),
      supabase.from('events').select('id', { count: 'exact', head: true }),
supabase.from('members').select('user_id', { count: 'exact', head: true }).gte('joined_date', weekAgo),
      supabase.from('members').select('user_id', { count: 'exact', head: true }).gte('joined_date', monthAgo),
    ]);
    var allOrgs = or.data || [];
    var allSubs = sr.data || [];
    var activeSubs = allSubs.filter(function (s) { return s.status === 'active'; });
    var trialSubs = allSubs.filter(function (s) { return s.status === 'trialing'; });
    var canceledSubs = allSubs.filter(function (s) { return s.status === 'canceled'; });
    var paidIds = new Set(activeSubs.map(function (s) { return s.organization_id; }));
    var trialIds = new Set(trialSubs.map(function (s) { return s.organization_id; }));
    var mrr = activeSubs.reduce(function (acc, s) { return acc + (PLAN_PRICES[s.plan] || 0); }, 0);
    var planMap = {};
    activeSubs.forEach(function (s) { planMap[s.plan] = (planMap[s.plan] || 0) + 1; });
    setPlanBreakdown(Object.keys(planMap).map(function (k) { return { plan: k, label: PLAN_LABELS[k] || k, count: planMap[k], mrr: (planMap[k] * (PLAN_PRICES[k] || 0)).toFixed(2) }; }));
    var newOrgsWeek = allOrgs.filter(function (o) { return o.created_at > weekAgo; }).length;
    var newOrgsMonth = allOrgs.filter(function (o) { return o.created_at > monthAgo; }).length;
    var inactive = allOrgs.filter(function (o) { return o.created_at < monthAgo && !paidIds.has(o.id) && !trialIds.has(o.id); });
    var atRisk = allOrgs.filter(function (o) { return o.created_at < fourteenDaysAgo && !paidIds.has(o.id) && !trialIds.has(o.id); }).slice(0, 10);
    setAtRiskOrgs(atRisk);
    setRecentOrgs(allOrgs.slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }).slice(0, 5));
    setMetrics({
      totalMembers: mr.count || 0, totalOrgs: allOrgs.length,
      newMembersWeek: mw.count || 0, newMembersMonth: mm.count || 0,
      newOrgsWeek, newOrgsMonth,
      paidOrgs: allOrgs.filter(function (o) { return paidIds.has(o.id); }).length,
      trialOrgs: allOrgs.filter(function (o) { return trialIds.has(o.id); }).length,
      freeOrgs: allOrgs.length - allOrgs.filter(function (o) { return paidIds.has(o.id) || trialIds.has(o.id); }).length,
      canceledSubs: canceledSubs.length, mrr: mrr.toFixed(2),
      totalEvents: er.count || 0, inactiveOrgs: inactive.length, atRiskCount: atRisk.length,
      verifiedNonprofits: allOrgs.filter(function (o) { return o.is_verified_nonprofit; }).length,
    });
  }

  async function loadPendingVerifications() {
    var { data } = await supabase.from('nonprofit_verifications')
      .select('id, ein, document_url, submitted_at, organization_id, organizations(name, city, state)')
      .eq('status', 'pending').order('submitted_at', { ascending: true });
    setPendingVerifications(data || []);
  }

  async function loadLocationOptions() {
    var { data } = await supabase.from('organizations').select('state, city').not('state', 'is', null);
    if (!data) return;
    var ss = new Set(); var cs = new Set();
    data.forEach(function (o) { if (o.state) ss.add(o.state); if (o.city) cs.add(o.city); });
    setStates(Array.from(ss).sort()); setCities(Array.from(cs).sort());
  }

  async function handleVerification(id, orgId, action) {
    setActionLoading(id + action);
    var status = action === 'approve' ? 'approved' : 'rejected';
    var { error } = await supabase.from('nonprofit_verifications').update({ status: status, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed.'); setActionLoading(null); return; }
    if (action === 'approve') await supabase.from('organizations').update({ is_verified_nonprofit: true, trial_length_days: 30 }).eq('id', orgId);
    await logAction('verification_' + action, 'verification', id, { organization_id: orgId });
    toast.success(action === 'approve' ? 'Nonprofit verified.' : 'Rejected.');
    setActionLoading(null); loadPendingVerifications(); loadMetrics();
  }

  return (
    <div>
      {/* Filters + refresh */}
      <div className="flex items-center gap-4 flex-wrap mb-8">
        <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]"><MapPin size={14} aria-hidden="true" />Filter by location:</div>
        <div className="relative">
          <label htmlFor="filter-state" className="sr-only">State</label>
          <select id="filter-state" value={filterState} onChange={function (e) { setFilterState(e.target.value); setFilterCity(''); }} className="appearance-none bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-[13px] rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="">All States</option>
            {states.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="filter-city" className="sr-only">City</label>
          <select id="filter-city" value={filterCity} onChange={function (e) { setFilterCity(e.target.value); }} disabled={!filterState} className="appearance-none bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-[13px] rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <option value="">All Cities</option>
            {cities.map(function (c) { return <option key={c} value={c}>{c}</option>; })}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" aria-hidden="true" />
        </div>
        {(filterState || filterCity) && <button onClick={function () { setFilterState(''); setFilterCity(''); }} className="text-[12px] text-[#94A3B8] hover:text-white underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Clear</button>}
        <div className="ml-auto">
          <button onClick={function () { loadAll(true); }} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-[#1A2035] border border-[#2A3550] rounded-lg text-[13px] text-[#CBD5E1] font-600 hover:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <section aria-label="Key metrics" className="mb-10">
        <SectionLabel>Platform Overview</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading ? Array.from({ length: 10 }).map(function (_, i) { return <MetricSkeleton key={i} />; })
            : metrics ? (
              <>
                <MetricCard icon={Users} label="Total Members" value={metrics.totalMembers.toLocaleString()} sub={'+' + metrics.newMembersWeek + ' this week · +' + metrics.newMembersMonth + ' this month'} iconBg="bg-[#1D3461]" iconColor="text-blue-400" />
                <MetricCard icon={Building2} label="Total Orgs" value={metrics.totalOrgs.toLocaleString()} sub={'+' + metrics.newOrgsWeek + ' this week · +' + metrics.newOrgsMonth + ' this month'} iconBg="bg-[#2D1B4E]" iconColor="text-purple-400" />
                <MetricCard icon={DollarSign} label="Est. MRR" value={formatMRR(metrics.mrr)} sub={metrics.paidOrgs + ' paying orgs'} iconBg="bg-[#1B3A2F]" iconColor="text-green-400" />
                <MetricCard icon={Activity} label="Paid Orgs" value={metrics.paidOrgs} sub={metrics.trialOrgs + ' on trial · ' + metrics.freeOrgs + ' free'} iconBg="bg-[#1B3A2F]" iconColor="text-green-400" />
                <MetricCard icon={ShieldCheck} label="Pending Verifications" value={pendingVerifications.length} sub="Awaiting review" iconBg="bg-[#2D1B4E]" iconColor="text-purple-400" alert={pendingVerifications.length > 0} />
                <MetricCard icon={Calendar} label="Total Events" value={metrics.totalEvents.toLocaleString()} sub="Across all orgs" iconBg="bg-[#1B3A2F]" iconColor="text-green-400" />
                <MetricCard icon={TrendingUp} label="New Orgs (Month)" value={metrics.newOrgsMonth} sub={metrics.newOrgsWeek + ' in past 7 days'} iconBg="bg-[#1D3461]" iconColor="text-blue-400" />
                <MetricCard icon={CheckCircle} label="Verified Nonprofits" value={metrics.verifiedNonprofits} sub="Approved 501(c)(3) orgs" iconBg="bg-[#1B3A2F]" iconColor="text-green-400" />
                <MetricCard icon={UserX} label="Inactive Orgs" value={metrics.inactiveOrgs} sub="30+ days, no subscription" iconBg="bg-[#2A1A1A]" iconColor="text-red-400" alert={metrics.inactiveOrgs > 5} />
                <MetricCard icon={AlertTriangle} label="At-Risk Orgs" value={metrics.atRiskCount} sub="14+ days, no plan" iconBg="bg-[#2A1E10]" iconColor="text-yellow-400" alert={metrics.atRiskCount > 0} />
              </>
            ) : null}
        </div>
      </section>

      {/* Plan breakdown */}
      <section className="mb-10" aria-label="Revenue by plan">
        <SectionLabel>Revenue by Plan</SectionLabel>
        <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl overflow-hidden">
          {loading ? <div className="p-6">{Array.from({ length: 3 }).map(function (_, i) { return <div key={i} className="mb-3"><RowSkeleton /></div>; })}</div>
            : planBreakdown.length === 0 ? <EmptyState icon={Zap} title="No paid subscriptions yet" description="Revenue breakdown appears once orgs start paying." />
            : (
              <table className="w-full" role="table" aria-label="Plan revenue breakdown">
                <thead>
                  <tr className="bg-[#1E2845] border-b border-[#2A3550]">
                    <th className="text-left text-[11px] font-700 uppercase tracking-widest text-[#64748B] px-6 py-3" scope="col">Plan</th>
                    <th className="text-left text-[11px] font-700 uppercase tracking-widest text-[#64748B] px-6 py-3" scope="col">Orgs</th>
                    <th className="text-left text-[11px] font-700 uppercase tracking-widest text-[#64748B] px-6 py-3" scope="col">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {planBreakdown.map(function (row, i) {
                    return (
                      <tr key={row.plan} className={'border-b border-[#2A3550] ' + (i % 2 === 1 ? 'bg-[#151B2D]' : '')}>
                        <td className="px-6 py-3 text-[13px] text-[#CBD5E1] font-600">{row.label}</td>
                        <td className="px-6 py-3 text-[13px] text-[#CBD5E1]">{row.count}</td>
                        <td className="px-6 py-3 text-[13px] text-green-400 font-700">{formatMRR(row.mrr)}</td>
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
          <div className="bg-[#1A2035] border border-yellow-500/20 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2A3550] flex items-center gap-2">
              <AlertTriangle size={13} className="text-yellow-400" aria-hidden="true" />
              <span className="text-[12px] text-[#94A3B8]">14+ days since signup — no plan</span>
            </div>
            <div className="divide-y divide-[#2A3550]">
              {loading ? Array.from({ length: 3 }).map(function (_, i) { return <div key={i} className="px-5 py-3"><RowSkeleton /></div>; })
                : atRiskOrgs.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <CheckCircle size={26} className="text-green-400 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-white font-600 text-[14px]">No at-risk orgs</p>
                  </div>
                ) : atRiskOrgs.map(function (org) {
                  return (
                    <div key={org.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-700 flex-shrink-0 bg-yellow-400/10 text-yellow-400" aria-hidden="true">{getInitials(org.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white font-600 truncate">{org.name}</p>
                        <p className="text-[11px] text-[#64748B]">{org.city && org.state ? org.city + ', ' + org.state + ' · ' : ''}Joined {timeAgo(org.created_at)}</p>
                      </div>
                      <span className="text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full font-700 flex-shrink-0">No Plan</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
        <section aria-label="Recent signups">
          <SectionLabel>Recent Signups</SectionLabel>
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2A3550] flex items-center gap-2">
              <Clock size={13} className="text-[#64748B]" aria-hidden="true" />
              <span className="text-[12px] text-[#94A3B8]">Most recently created orgs</span>
            </div>
            <div className="divide-y divide-[#2A3550]">
              {loading ? Array.from({ length: 3 }).map(function (_, i) { return <div key={i} className="px-5 py-3"><RowSkeleton /></div>; })
                : recentOrgs.length === 0 ? <EmptyState icon={Building2} title="No organizations yet" description="New orgs will appear here." />
                : recentOrgs.map(function (org) {
                  return (
                    <div key={org.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-700 flex-shrink-0 bg-[#1D3461] text-blue-400" aria-hidden="true">{getInitials(org.name)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white font-600 truncate">{org.name}</p>
                        <p className="text-[11px] text-[#64748B]">{org.city && org.state ? org.city + ', ' + org.state + ' · ' : ''}{timeAgo(org.created_at)}</p>
                      </div>
                      {org.is_verified_nonprofit && <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full font-700 flex-shrink-0">Verified</span>}
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
        <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl overflow-hidden">
          {loading ? <div className="p-6">{Array.from({ length: 2 }).map(function (_, i) { return <div key={i} className="mb-3"><RowSkeleton /></div>; })}</div>
            : pendingVerifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle size={36} className="text-green-400 mx-auto mb-3" aria-hidden="true" />
                <p className="text-white font-700 text-[15px] mb-1">Queue is clear</p>
                <p className="text-[13px] text-[#64748B]">No pending requests.</p>
              </div>
            ) : (
              <div role="list" aria-label="Pending verification requests">
                {pendingVerifications.map(function (v) {
                  var orgName = v.organizations?.name || 'Unknown';
                  var location = v.organizations?.city && v.organizations?.state ? v.organizations.city + ', ' + v.organizations.state : '';
                  return (
                    <div key={v.id} role="listitem" className="flex items-center gap-4 px-6 py-4 border-b border-[#2A3550] last:border-b-0 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-700 flex-shrink-0 bg-[#2D1B4E] text-purple-400" aria-hidden="true">{getInitials(orgName)}</div>
                        <div className="min-w-0">
                          <p className="text-[14px] text-white font-700 truncate">{orgName}</p>
                          <p className="text-[12px] text-[#64748B]">{location && location + ' · '}EIN: {v.ein || 'Not provided'} · {timeAgo(v.submitted_at)}</p>
                        </div>
                      </div>
                      {v.document_url && (
                        <button onClick={function () { var path = v.document_url.split('/verification-docs/')[1]; getSignedUrl(path); }} className="text-[12px] text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded flex-shrink-0" aria-label={'View IRS letter for ' + orgName}>
                          View Document
                        </button>
                      )}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={function () { handleVerification(v.id, v.organization_id, 'approve'); }} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-[12px] font-700 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50 transition-colors" aria-label={'Approve ' + orgName}>
                          <CheckCircle size={13} aria-hidden="true" />{actionLoading === v.id + 'approve' ? 'Approving...' : 'Approve'}
                        </button>
                        <button onClick={function () { handleVerification(v.id, v.organization_id, 'reject'); }} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 bg-[#1A2035] border border-red-500/40 text-red-400 text-[12px] font-700 rounded-lg hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50 transition-colors" aria-label={'Reject ' + orgName}>
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
    { key: 'overview',   label: 'Overview',       icon: BarChart2 },
    { key: 'members',    label: 'Members',         icon: Users },
    { key: 'orgs',       label: 'Organizations',   icon: Building2 },
    { key: 'content',    label: 'Content',         icon: FileText },
    { key: 'financials',   label: 'Financials',   icon: Receipt },
    { key: 'promo_codes',  label: 'Promo Codes',  icon: Tag },
    { key: 'goals',        label: 'Goals',        icon: TrendingUp },
  ];

  useEffect(function () {
    supabase.auth.getUser().then(function (res) {
      var user = res.data?.user;
      if (!user) { navigate('/login'); return; }
      supabase.from('members').select('user_id, first_name, last_name, is_staff').eq('user_id', user.id).single().then(function (r) {
        if (r.error || !r.data?.is_staff) { toast.error('Access denied.'); navigate('/dashboard'); return; }
        setStaffMember(r.data); setAuthChecked(true);
      });
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0E1523] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-[#1A2035] animate-pulse mx-auto mb-4" aria-hidden="true" />
          <p className="text-[#64748B] text-[13px]">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1523]" style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <header className="bg-[#151B2D] border-b border-[#2A3550] px-6 py-4" role="banner">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-lg">Syndi</span>
              <span className="font-extrabold text-lg" style={{ color: '#F5B731' }}>cade</span>
              <span className="text-[10px] font-700 uppercase tracking-widest text-[#8B5CF6] bg-[#2D1B4E] border border-[#8B5CF6]/30 px-2 py-0.5 rounded-full ml-1">Staff Portal</span>
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5">{staffMember.first_name} {staffMember.last_name}</p>
          </div>
          <a href="https://vercel.com/analytics" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#1A2035] border border-[#2A3550] rounded-lg text-[13px] text-[#CBD5E1] font-600 hover:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D] transition-colors" aria-label="Open Vercel Analytics">
            <BarChart2 size={15} aria-hidden="true" /> Website Traffic
          </a>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-[#151B2D] border-b border-[#2A3550] px-6" aria-label="Staff dashboard sections" role="tablist">
        <div className="max-w-[1600px] mx-auto flex overflow-x-auto">
          {TABS.map(function (tab) {
            var Icon = tab.icon;
            var isActive = activeTab === tab.key;
            return (
              <button key={tab.key} role="tab" aria-selected={isActive} onClick={function () { setActiveTab(tab.key); }} className={'flex items-center gap-2 px-5 py-4 text-[13px] font-600 border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset whitespace-nowrap ' + (isActive ? 'border-blue-500 text-white' : 'border-transparent text-[#64748B] hover:text-[#CBD5E1]')}>
                <Icon size={15} aria-hidden="true" />{tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8" role="main">
        {activeTab === 'overview'   && <OverviewTab />}
        {activeTab === 'members'    && <MembersTab />}
        {activeTab === 'orgs'       && <OrgsTab />}
        {activeTab === 'content'    && <ContentEditor staffUserId={staffMember?.user_id} />}
        {activeTab === 'financials'  && <StaffFinancials staffUserId={staffMember?.user_id} />}
        {activeTab === 'promo_codes' && <StaffPromoCodes />}
        {activeTab === 'goals'       && <StaffGoals />}
      </main>
    </div>
  );
}