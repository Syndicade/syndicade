/**
 * StaffDashboard.jsx — V4.1
 * Updated June 14, 2026
 *
 * Tab order:
 * 1. Overview       — metrics, at-risk, recent signups
 * 2. Members        — search, staff filter, account tools
 * 3. Organizations  — full table with all new filters + member counts
 * 4. Verifications  — dedicated tab with pending/approved/rejected filter
 * 5. Financials     — StaffFinancials
 * 6. Promo Codes    — StaffPromoCodes
 * 7. Goals          — StaffGoals
 * 8. Contacts       — custom categories, date range inputs, CategoryModal
 * 9. Manage Tags    — TAG6: add/retire platform_tags, usage counts, custom keyword insights
 * 10. Bug Reports   — unchanged
 * 11. Content       — ContentEditor
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
  FileText, Download, Mail, Bug, ChevronUp, ExternalLink, Filter,
  Receipt, AlertCircle, Pin, PinOff, Trash2, Eye, EyeOff, StickyNote,
  CheckSquare, Square, Tag as TagIcon, Pencil, Plus, Check, Globe,
  Layers, TrendingDown, BarChart, Sparkles, ArrowUpCircle,
} from 'lucide-react';

// ─── Plan config ──────────────────────────────────────────────────────────────
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
var PLAN_TIER_ORDER = { pro: 0, growth: 1, starter: 2, student: 3, listed: 4, free: 5 };

var ORG_TYPE_LABELS = {
  nonprofit_501c3: '501(c)(3) Nonprofit',
  nonprofit_other: 'Nonprofit (Other)',
  faith:           'Faith Organization',
  club:            'Club',
  association:     'Association',
  community:       'Community Group',
  hoa:             'HOA',
  school:          'School',
  sports:          'Sports',
  pta:             'PTA',
  union:           'Union',
};

// ─── Tag system config ────────────────────────────────────────────────────────
var TAG_GROUP_NAMES = [
  'Cause Area',
  'Audience Served',
  'Activity Type',
  'Role Type',
  'Funding Type',
  'Format',
  'Language',
  'Organization Type',
];

var TAG_APPLIES_TO_OPTIONS = [
  { value: 'event',       label: 'Events' },
  { value: 'program',     label: 'Programs' },
  { value: 'opportunity', label: 'Opportunities' },
  { value: 'funding',     label: 'Funding' },
  { value: 'org',         label: 'Organizations' },
];

// ─── Contact categories ───────────────────────────────────────────────────────
var DEFAULT_CATEGORIES = [
  { id: 'general',     label: 'General',     color: '#475569' },
  { id: 'hot_lead',    label: 'Hot Lead',    color: '#B45309' },
  { id: 'partnership', label: 'Partnership', color: '#1D4ED8' },
  { id: 'support',     label: 'Support',     color: '#7C3AED' },
  { id: 'spam',        label: 'Spam',        color: '#DC2626' },
];
var CATEGORY_COLORS = [
  '#475569', '#B45309', '#1D4ED8', '#7C3AED',
  '#DC2626', '#16A34A', '#0891B2', '#9333EA', '#EA580C',
];
var CATEGORY_BG_MAP = {
  '#475569': '#F1F5F9', '#B45309': '#FEF3C7', '#1D4ED8': '#DBEAFE',
  '#7C3AED': '#EDE9FE', '#DC2626': '#FEE2E2', '#16A34A': '#DCFCE7',
  '#0891B2': '#CFFAFE', '#9333EA': '#F3E8FF', '#EA580C': '#FFEDD5',
};
var CATEGORY_BORDER_MAP = {
  '#475569': '#E2E8F0', '#B45309': '#FDE68A', '#1D4ED8': '#BFDBFE',
  '#7C3AED': '#DDD6FE', '#DC2626': '#FECACA', '#16A34A': '#BBF7D0',
  '#0891B2': '#A5F3FC', '#9333EA': '#E9D5FF', '#EA580C': '#FED7AA',
};
function getCategoryStyle(color) {
  return {
    bg: CATEGORY_BG_MAP[color] || '#F1F5F9',
    border: CATEGORY_BORDER_MAP[color] || '#E2E8F0',
    color: color,
  };
}

// ─── Bug/severity config ──────────────────────────────────────────────────────
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
function getPlanBase(planId) {
  if (!planId) return 'free';
  if (planId.startsWith('listed')) return 'listed';
  if (planId.startsWith('starter')) return 'starter';
  if (planId.startsWith('growth')) return 'growth';
  if (planId.startsWith('pro')) return 'pro';
  if (planId.startsWith('student')) return 'student';
  return 'free';
}
function getBillingInterval(planId) {
  if (!planId) return '';
  if (planId.endsWith('_year')) return 'Annual';
  if (planId.endsWith('_month')) return 'Monthly';
  return '';
}
function slugifyCategoryId(label) {
  return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

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
      {[1,2,3,4].map(function(i) {
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
function TagGroupSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse" aria-hidden="true">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="h-4 w-32 rounded bg-slate-200" />
      </div>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {[1,2,3,4,5].map(function(i) { return <div key={i} className="h-7 rounded-full bg-slate-100" style={{ width: (60 + i * 12) + 'px' }} />; })}
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionLabel(props) {
  return <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '16px' }}>{props.children}</div>;
}
function MetricCard(props) {
  var Icon = props.icon;
  return (
    <div className={'bg-white rounded-xl p-5 border ' + (props.alert ? 'border-yellow-300' : 'border-slate-200')} role="region" aria-label={props.label + ' metric'}>
      <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-3 ' + props.iconBg}>
        <Icon size={18} className={props.iconColor} aria-hidden="true" />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '4px' }}>{props.label}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#0E1523', marginBottom: '4px' }}>{props.value}</div>
      {props.sub && <div style={{ fontSize: '12px', color: '#64748B' }}>{props.sub}</div>}
    </div>
  );
}
function EmptyState(props) {
  return (
    <div className="px-6 py-12 text-center">
      <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ width: '160px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply', display: 'block', margin: '0 auto 16px' }} />
      <p style={{ fontWeight: 700, fontSize: '15px', color: '#0E1523', marginBottom: '4px' }}>{props.title}</p>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: props.action ? '16px' : '0' }}>{props.description}</p>
      {props.action && props.onAction && (
        <button onClick={props.onAction} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{props.action}</button>
      )}
    </div>
  );
}

// ─── Member drawer ────────────────────────────────────────────────────────────
function MemberDrawer(props) {
  var member = props.member;
  var [memberships, setMemberships] = useState([]);
  var [loadingMemberships, setLoadingMemberships] = useState(true);
  var [actionLoading, setActionLoading] = useState(null);
  useEffect(function() {
    supabase.from('memberships').select('role, status, organizations(name, city, state)').eq('member_id', member.user_id)
      .then(function(res) { setMemberships(res.data || []); setLoadingMemberships(false); });
  }, [member.user_id]);
  async function handleResetPassword() {
    setActionLoading('reset');
    var res = await supabase.auth.resetPasswordForEmail(member.email, { redirectTo: window.location.origin + '/reset-password' });
    if (res.error) { toast.error('Failed to send reset email.'); } else { mascotSuccessToast('Password reset email sent.'); await logAction('password_reset_sent', 'member', member.user_id, { email: member.email }); }
    setActionLoading(null);
  }
  async function handleToggleSuspend() {
    var newStatus = member.account_status === 'suspended' ? 'active' : 'suspended';
    setActionLoading('suspend');
    var res = await supabase.from('members').update({ account_status: newStatus }).eq('user_id', member.user_id);
    if (res.error) { mascotErrorToast('Failed to update account.'); } else { mascotSuccessToast(newStatus === 'suspended' ? 'Account suspended.' : 'Account reactivated.'); await logAction(newStatus === 'suspended' ? 'account_suspended' : 'account_reactivated', 'member', member.user_id); props.onAction(); }
    setActionLoading(null);
  }
  async function handleImpersonate() {
    setActionLoading('impersonate');
    var sessionRes = await supabase.auth.getSession();
    var accessToken = sessionRes.data && sessionRes.data.session && sessionRes.data.session.access_token;
    if (!accessToken) { toast.error('Could not get session token.'); setActionLoading(null); return; }
    var res = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/impersonate-user', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken }, body: JSON.stringify({ target_user_id: member.user_id }) });
    var json = await res.json();
    if (!res.ok || !json.link) { toast.error(json.error || 'Failed to generate impersonation link.'); setActionLoading(null); return; }
    navigator.clipboard.writeText(json.link).catch(function() {});
    window.open(json.link, '_blank', 'noopener,noreferrer');
    mascotSuccessToast('Impersonation link opened.', 'Link copied to clipboard.');
    setActionLoading(null);
  }
  var isSuspended = member.account_status === 'suspended';
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={'Member details: ' + member.first_name + ' ' + member.last_name}>
      <div className="absolute inset-0 bg-black/40" onClick={props.onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '16px', color: '#0E1523' }}>{member.first_name} {member.last_name}</h2>
            <p style={{ fontSize: '12px', color: '#64748B' }}>{member.email}</p>
          </div>
          <button onClick={props.onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Close"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ' + (isSuspended ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200')}>{isSuspended ? 'Suspended' : 'Active'}</span>
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
                <div><div>{actionLoading === 'reset' ? 'Sending...' : 'Send Password Reset Email'}</div><div style={{ fontSize: '11px', color: '#64748B' }}>Sends a link to {member.email}</div></div>
              </button>
              <button onClick={handleToggleSuspend} disabled={actionLoading !== null} className={'w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors text-left ' + (isSuspended ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 focus:ring-green-500' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 focus:ring-red-500')} aria-label={isSuspended ? 'Reactivate account' : 'Suspend account'}>
                <Ban size={16} className="flex-shrink-0" aria-hidden="true" />
                <div><div>{actionLoading === 'suspend' ? 'Updating...' : (isSuspended ? 'Reactivate Account' : 'Suspend Account')}</div><div style={{ fontSize: '11px', opacity: 0.7 }}>{isSuspended ? 'Restore full access' : 'Block login immediately'}</div></div>
              </button>
              <button onClick={handleImpersonate} disabled={actionLoading !== null} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-yellow-300 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 transition-colors text-left">
                <Zap size={16} className="text-yellow-500 flex-shrink-0" aria-hidden="true" />
                <div><div>{actionLoading === 'impersonate' ? 'Generating link...' : 'Impersonate User'}</div><div style={{ fontSize: '11px', color: '#64748B' }}>Opens login link — logged to audit trail</div></div>
              </button>
            </div>
          </div>
          <div>
            <SectionLabel>Organization Memberships</SectionLabel>
            {loadingMemberships ? (
              <div className="space-y-2">{[1,2].map(function(i) { return <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />; })}</div>
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
function OrgDrawer(props) {
  var org = props.org;
  var subscription = props.subscription;
  var memberCount = props.memberCount || 0;
  var [members, setMembers] = useState([]);
  var [loadingMembers, setLoadingMembers] = useState(true);
  var [selectedPlan, setSelectedPlan] = useState(subscription && subscription.plan_id || '');
  var [planLoading, setPlanLoading] = useState(false);
  useEffect(function() {
    supabase.from('memberships').select('role, members(first_name, last_name, email)').eq('organization_id', org.id).eq('status', 'active').limit(10)
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
    setPlanLoading(false); props.onAction();
  }
  var publicPageUrl = 'https://app.syndicade.com/org/' + (org.slug || org.id);
  var billingInterval = getBillingInterval(subscription && subscription.plan_id);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={'Org details: ' + org.name}>
      <div className="absolute inset-0 bg-black/40" onClick={props.onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '16px', color: '#0E1523' }}>{org.name}</h2>
            <p style={{ fontSize: '12px', color: '#64748B' }}>{org.city && org.state ? org.city + ', ' + org.state : 'Location not set'}</p>
          </div>
          <button onClick={props.onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Close"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className="flex-1 px-6 py-5 space-y-6">
          <div className="flex gap-2 flex-wrap">
            {org.is_verified_nonprofit && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle size={11} aria-hidden="true" /> Verified Nonprofit</span>}
            {org.edu_email && !org.edu_email_verified && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200"><AlertTriangle size={11} aria-hidden="true" /> .edu Unverified</span>}
            {org.edu_email && org.edu_email_verified && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle size={11} aria-hidden="true" /> .edu Verified</span>}
            <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ' + (subscription && subscription.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : subscription && subscription.status === 'trialing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200')}>
              {subscription && subscription.status === 'active' ? 'Paid' : subscription && subscription.status === 'trialing' ? 'Trial' : 'Free'}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            {org.org_number && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Org #</span><span style={{ color: '#475569', fontWeight: 600 }}>{org.org_number}</span></div>}
            {org.type && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Type</span><span style={{ color: '#475569' }}>{ORG_TYPE_LABELS[org.type] || org.type}</span></div>}
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Members</span><span style={{ color: '#475569', fontWeight: 600 }}>{memberCount}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Current Plan</span><span style={{ color: '#475569', fontWeight: 600 }}>{subscription ? (PLAN_LABELS[subscription.plan_id] || subscription.plan_id) : 'Free'}</span></div>
            {billingInterval && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Billing</span><span style={{ color: '#475569' }}>{billingInterval}</span></div>}
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Created</span><span style={{ color: '#475569' }}>{new Date(org.created_at).toLocaleDateString()}</span></div>
            {subscription && subscription.current_period_end && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Renews</span><span style={{ color: '#475569' }}>{new Date(subscription.current_period_end).toLocaleDateString()}</span></div>}
            {subscription && subscription.trial_ends_at && <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>Trial ends</span><span style={{ color: '#475569' }}>{new Date(subscription.trial_ends_at).toLocaleDateString()}</span></div>}
          </div>
          <a href={publicPageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label={'View public page for ' + org.name}>
            <Globe size={14} className="text-blue-500" aria-hidden="true" /> View Public Page
          </a>
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
              <button onClick={handlePlanChange} disabled={planLoading || selectedPlan === (subscription && subscription.plan_id || '')} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 transition-colors">{planLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
          <div>
            <SectionLabel>Active Members</SectionLabel>
            {loadingMembers ? (
              <div className="space-y-2">{[1,2,3].map(function(i) { return <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" aria-hidden="true" />; })}</div>
            ) : members.length === 0 ? <p style={{ fontSize: '13px', color: '#64748B' }}>No active members found.</p>
            : members.map(function(m, i) {
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
    var q = supabase.from('members').select('user_id, first_name, last_name, email, phone, joined_date, is_staff, account_status, member_number');
    if (staffOnly) { q = q.eq('is_staff', true); }
    else if (query.trim()) {
      var isNumber = /^\d+$/.test(query.trim());
      if (isNumber) { q = q.eq('member_number', parseInt(query.trim())); }
      else {
        var words = query.trim().split(/\s+/);
        var filters = [];
        words.forEach(function(word) { filters.push('first_name.ilike.%' + word + '%'); filters.push('last_name.ilike.%' + word + '%'); filters.push('phone.ilike.%' + word + '%'); });
        q = q.or(filters.join(','));
      }
    } else { setLoading(false); return; }
    var res = await q.limit(25);
    if (res.error) { toast.error('Search failed: ' + res.error.message); } else { setResults(res.data || []); }
    setLoading(false);
  }
  function handleStaffToggle() {
    var next = !staffOnly; setStaffOnly(next); setQuery(''); setSearched(true); setLoading(true);
    var q = supabase.from('members').select('user_id, first_name, last_name, email, phone, joined_date, is_staff, account_status, member_number');
    if (next) q = q.eq('is_staff', true);
    q.limit(25).then(function(res) { setResults(res.data || []); setLoading(false); });
  }
  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-4" role="search" aria-label="Search members">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="member-search" className="sr-only">Search by name, phone, or member number</label>
          <input id="member-search" type="search" value={query} onChange={function(e) { setQuery(e.target.value); setStaffOnly(false); }} placeholder="Search by name, phone, or member number..." className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400" autoComplete="off" />
        </div>
        <button type="submit" disabled={loading || (!query.trim() && !staffOnly)} className="px-6 py-3 bg-blue-500 text-white font-semibold text-sm rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">{loading ? 'Searching...' : 'Search'}</button>
      </form>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={handleStaffToggle} className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ' + (staffOnly ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50')} aria-pressed={staffOnly}>
          <ShieldCheck size={14} aria-hidden="true" /> Staff only
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : !searched ? <EmptyState title="Search for a member" description="Enter a name, phone number, or member number." />
          : results.length === 0 ? <EmptyState title="No members found" description={staffOnly ? 'No staff accounts found.' : 'No results for "' + query + '".'} />
          : (
            <div role="list" aria-label="Member search results">
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50"><span style={{ fontSize: '12px', color: '#64748B' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span></div>
              {results.map(function(m) {
                var isSuspended = m.account_status === 'suspended';
                return (
                  <div key={m.user_id} role="listitem" className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-100 text-blue-700" aria-hidden="true">{(m.first_name && m.first_name[0] || '') + (m.last_name && m.last_name[0] || '')}</div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '14px', color: '#0E1523', fontWeight: 600 }}>{m.first_name} {m.last_name}{m.is_staff && <span className="ml-2 text-xs font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">Staff</span>}</p>
                      <p style={{ fontSize: '12px', color: '#64748B' }} className="truncate">{'#' + (m.member_number || '—') + (m.phone ? ' · ' + m.phone : '')}</p>
                    </div>
                    <span className={'text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 border ' + (isSuspended ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200')}>{isSuspended ? 'Suspended' : 'Active'}</span>
                    <button onClick={function() { setSelected(m); }} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex-shrink-0" aria-label={'Open details for ' + m.first_name + ' ' + m.last_name}>View <ChevronRight size={13} aria-hidden="true" /></button>
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
  var [filterPlan, setFilterPlan] = useState('');
  var [filterType, setFilterType] = useState('');
  var [filterState, setFilterState] = useState('');
  var [filterVerified, setFilterVerified] = useState(false);
  var [filterPaid, setFilterPaid] = useState(false);
  var [sortBy, setSortBy] = useState('newest');
  var [results, setResults] = useState([]);
  var [subsMap, setSubsMap] = useState({});
  var [memberCountMap, setMemberCountMap] = useState({});
  var [stateOptions, setStateOptions] = useState([]);
  var [loading, setLoading] = useState(true);
  var [searched, setSearched] = useState(false);
  var [selected, setSelected] = useState(null);

  useEffect(function() { loadRecent(); loadStateOptions(); }, []);

  async function loadStateOptions() {
    var res = await supabase.from('organizations').select('state').not('state', 'is', null);
    if (!res.data) return;
    var ss = new Set();
    res.data.forEach(function(o) { if (o.state) ss.add(o.state); });
    setStateOptions(Array.from(ss).sort());
  }

  async function loadRecent() {
    setLoading(true);
    var res = await supabase.from('organizations')
      .select('id, name, slug, org_number, type, city, state, zip_code, created_at, is_verified_nonprofit, edu_email, edu_email_verified')
      .order('created_at', { ascending: false }).limit(50);
    await hydrateOrgs(res.data || []);
    setLoading(false);
  }

  async function hydrateOrgs(orgs) {
    setResults(orgs);
    if (orgs.length === 0) return;
    var ids = orgs.map(function(o) { return o.id; });
    var memRes = await supabase.from('memberships').select('organization_id').in('organization_id', ids).eq('status', 'active');
    var memMap = {};
    (memRes.data || []).forEach(function(m) { memMap[m.organization_id] = (memMap[m.organization_id] || 0) + 1; });
    setMemberCountMap(memMap);
    var subRes = await supabase.from('subscriptions').select('organization_id, plan_id, status, trial_ends_at, current_period_end').in('organization_id', ids);
    var map = {};
    (subRes.data || []).forEach(function(s) { map[s.organization_id] = s; });
    setSubsMap(map);
  }

  async function handleSearch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!query.trim()) { loadRecent(); return; }
    setLoading(true); setSearched(true);
    var res = await supabase.from('organizations')
      .select('id, name, slug, org_number, type, city, state, zip_code, created_at, is_verified_nonprofit, edu_email, edu_email_verified')
      .or('name.ilike.%' + query + '%,city.ilike.%' + query + '%,state.ilike.%' + query + '%,zip_code.ilike.%' + query + '%').limit(50);
    if (res.error) { mascotErrorToast('Search failed.', 'Check your connection and try again.'); setLoading(false); return; }
    await hydrateOrgs(res.data || []);
    setLoading(false);
  }

  var filteredResults = results.filter(function(org) {
    var sub = subsMap[org.id];
    var planBase = getPlanBase(sub && sub.plan_id);
    if (filterVerified && !org.is_verified_nonprofit) return false;
    if (filterPaid && !(sub && sub.status === 'active')) return false;
    if (filterPlan) {
      if (filterPlan === 'free' && sub && sub.status === 'active') return false;
      if (filterPlan !== 'free' && planBase !== filterPlan) return false;
    }
    if (filterType && org.type !== filterType) return false;
    if (filterState && org.state !== filterState) return false;
    return true;
  });

  var sortedResults = filteredResults.slice().sort(function(a, b) {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'members') return (memberCountMap[b.id] || 0) - (memberCountMap[a.id] || 0);
    if (sortBy === 'plan') {
      var aBase = getPlanBase(subsMap[a.id] && subsMap[a.id].plan_id);
      var bBase = getPlanBase(subsMap[b.id] && subsMap[b.id].plan_id);
      return (PLAN_TIER_ORDER[aBase] || 5) - (PLAN_TIER_ORDER[bBase] || 5);
    }
    return 0;
  });

  var hasFilters = filterPlan || filterType || filterState || filterVerified || filterPaid;
  function clearFilters() { setFilterPlan(''); setFilterType(''); setFilterState(''); setFilterVerified(false); setFilterPaid(false); }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-4" role="search" aria-label="Search organizations">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="org-search" className="sr-only">Search by name, city, state, or zip</label>
          <input id="org-search" type="search" value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Search by name, city, state, or zip..." className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400" autoComplete="off" />
        </div>
        <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-500 text-white font-semibold text-sm rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">{loading ? 'Searching...' : 'Search'}</button>
        {searched && <button type="button" onClick={function() { setQuery(''); setSearched(false); clearFilters(); setSortBy('newest'); loadRecent(); }} className="px-4 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors">Clear</button>}
      </form>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter size={14} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
        <div className="relative">
          <label htmlFor="org-filter-plan" className="sr-only">Filter by plan</label>
          <select id="org-filter-plan" value={filterPlan} onChange={function(e) { setFilterPlan(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="listed">Listed</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
            <option value="student">Student</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="org-filter-type" className="sr-only">Filter by org type</label>
          <select id="org-filter-type" value={filterType} onChange={function(e) { setFilterType(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All types</option>
            {Object.keys(ORG_TYPE_LABELS).map(function(k) { return <option key={k} value={k}>{ORG_TYPE_LABELS[k]}</option>; })}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="org-filter-state" className="sr-only">Filter by state</label>
          <select id="org-filter-state" value={filterState} onChange={function(e) { setFilterState(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All states</option>
            {stateOptions.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <button onClick={function() { setFilterVerified(!filterVerified); }} className={'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ' + (filterVerified ? 'bg-green-50 text-green-700 border-green-300' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:bg-green-50')} aria-pressed={filterVerified}>
          <CheckCircle size={13} aria-hidden="true" /> Verified only
        </button>
        <button onClick={function() { setFilterPaid(!filterPaid); }} className={'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (filterPaid ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50')} aria-pressed={filterPaid}>
          <DollarSign size={13} aria-hidden="true" /> Paid only
        </button>
        <div className="relative ml-auto">
          <label htmlFor="org-sort" className="sr-only">Sort organizations</label>
          <select id="org-sort" value={sortBy} onChange={function(e) { setSortBy(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
            <option value="members">Most members</option>
            <option value="plan">By plan tier</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      {!searched && <SectionLabel>Recent Signups</SectionLabel>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : sortedResults.length === 0 ? <EmptyState title="No organizations found" description={searched ? 'No results match your search or filters.' : 'No organizations yet.'} action={hasFilters ? 'Clear filters' : null} onAction={clearFilters} />
          : (
            <div>
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span style={{ fontSize: '12px', color: '#64748B' }}>{sortedResults.length} org{sortedResults.length !== 1 ? 's' : ''}{sortedResults.length === 50 ? ' (capped at 50)' : ''}</span>
                {hasFilters && <button onClick={clearFilters} style={{ fontSize: '12px', color: '#3B82F6' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Clear filters</button>}
              </div>
              <div className="hidden md:grid grid-cols-[2fr_1fr_70px_1fr_1fr_80px_70px] gap-4 px-6 py-2 border-b border-slate-100 bg-slate-50/50">
                {['Name', 'Type', 'Members', 'Plan / Billing', 'Location', 'Joined', ''].map(function(h, i) { return <span key={i} style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8' }}>{h}</span>; })}
              </div>
              <div role="list" aria-label={searched ? 'Org search results' : 'Recent signups'}>
                {sortedResults.map(function(org) {
                  var sub = subsMap[org.id];
                  var planBase = getPlanBase(sub && sub.plan_id);
                  var billingInterval = getBillingInterval(sub && sub.plan_id);
                  var mCount = memberCountMap[org.id] || 0;
                  var statusColor = sub && sub.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : sub && sub.status === 'trialing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200';
                  return (
                    <div key={org.id} role="listitem" className="flex md:grid md:grid-cols-[2fr_1fr_70px_1fr_1fr_80px_70px] gap-4 items-center px-6 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-purple-100 text-purple-700" aria-hidden="true">{org.name && org.name[0] && org.name[0].toUpperCase() || '?'}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p style={{ fontSize: '13px', color: '#0E1523', fontWeight: 600 }} className="truncate">{org.name}</p>
                            {org.is_verified_nonprofit && <CheckCircle size={12} className="text-green-600 flex-shrink-0" aria-label="Verified nonprofit" />}
                          </div>
                          {org.org_number && <p style={{ fontSize: '11px', color: '#94A3B8' }}>#{org.org_number}</p>}
                        </div>
                      </div>
                      <div className="hidden md:block"><span style={{ fontSize: '12px', color: '#475569' }}>{ORG_TYPE_LABELS[org.type] || org.type || '—'}</span></div>
                      <div className="hidden md:block"><span style={{ fontSize: '13px', fontWeight: 600, color: '#0E1523' }}>{mCount}</span></div>
                      <div className="hidden md:flex items-center gap-2">
                        <span className={'text-xs font-semibold px-2 py-0.5 rounded-full border ' + statusColor}>{sub && sub.status === 'active' ? (PLAN_LABELS[sub.plan_id] || sub.plan_id) : sub && sub.status === 'trialing' ? 'Trial' : 'Free'}</span>
                        {billingInterval && <span style={{ fontSize: '11px', color: '#94A3B8' }}>{billingInterval}</span>}
                      </div>
                      <div className="hidden md:block"><span style={{ fontSize: '12px', color: '#64748B' }}>{org.city && org.state ? org.city + ', ' + org.state : '—'}</span></div>
                      <div className="hidden md:block"><span style={{ fontSize: '12px', color: '#64748B' }}>{timeAgo(org.created_at)}</span></div>
                      <div>
                        <button onClick={function() { setSelected({ org: org, sub: sub || null, memberCount: mCount }); }} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label={'Open details for ' + org.name}>View <ChevronRight size={12} aria-hidden="true" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>
      {selected && <OrgDrawer org={selected.org} subscription={selected.sub} memberCount={selected.memberCount} onClose={function() { setSelected(null); }} onAction={function() { setSelected(null); searched ? handleSearch(null) : loadRecent(); }} />}
    </div>
  );
}

// ─── Verifications tab ────────────────────────────────────────────────────────
function VerificationsTab(props) {
  var [verifications, setVerifications] = useState([]);
  var [loading, setLoading] = useState(true);
  var [filterStatus, setFilterStatus] = useState('pending');
  var [actionLoading, setActionLoading] = useState(null);

  useEffect(function() { loadVerifications(); }, [filterStatus]);

  async function loadVerifications() {
    setLoading(true);
    var q = supabase.from('nonprofit_verifications')
      .select('id, ein, document_url, submitted_at, reviewed_at, organization_id, organizations(name, city, state, type)')
      .order('submitted_at', { ascending: filterStatus === 'pending' });
    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    var res = await q;
    if (res.error) { mascotErrorToast('Failed to load verifications.'); } else { setVerifications(res.data || []); }
    setLoading(false);
  }

  async function getSignedUrl(path) {
    var res = await supabase.storage.from('verification-docs').createSignedUrl(path, 60);
    if (res.error || !res.data) { toast.error('Could not open document.'); return; }
    window.open(res.data.signedUrl, '_blank');
  }

  async function handleVerification(id, orgId, action) {
    setActionLoading(id + action);
    var status = action === 'approve' ? 'approved' : 'rejected';
    var res = await supabase.from('nonprofit_verifications').update({ status: status, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (res.error) { toast.error('Failed.'); setActionLoading(null); return; }
    if (action === 'approve') await supabase.from('organizations').update({ is_verified_nonprofit: true, trial_length_days: 30 }).eq('id', orgId);
    await logAction('verification_' + action, 'verification', id, { organization_id: orgId });
    mascotSuccessToast(action === 'approve' ? 'Nonprofit verified.' : 'Verification rejected.');
    setActionLoading(null);
    if (props.onCountChange) props.onCountChange();
    loadVerifications();
  }

  var statusOptions = [
    { value: 'pending',  label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all',      label: 'All' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6" role="group" aria-label="Filter verification status">
        {statusOptions.map(function(opt) {
          var isActive = filterStatus === opt.value;
          return (
            <button key={opt.value} onClick={function() { setFilterStatus(opt.value); }} className={'px-4 py-2 text-sm font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isActive ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50')} aria-pressed={isActive}>
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : verifications.length === 0 ? (
            filterStatus === 'pending'
              ? <div className="px-6 py-12 text-center"><CheckCircle size={36} className="text-green-500 mx-auto mb-3" aria-hidden="true" /><p style={{ fontWeight: 700, fontSize: '15px', color: '#0E1523', marginBottom: '4px' }}>Queue is clear</p><p style={{ fontSize: '13px', color: '#64748B' }}>No pending verification requests.</p></div>
              : <EmptyState title={'No ' + filterStatus + ' verifications'} description="None found for this filter." />
          ) : (
            <div role="list" aria-label="Verification requests">
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50"><span style={{ fontSize: '12px', color: '#64748B' }}>{verifications.length} {filterStatus !== 'all' ? filterStatus : ''} request{verifications.length !== 1 ? 's' : ''}</span></div>
              {verifications.map(function(v) {
                var orgName = v.organizations && v.organizations.name || 'Unknown';
                var orgType = v.organizations && v.organizations.type;
                var location = v.organizations && v.organizations.city && v.organizations.state ? v.organizations.city + ', ' + v.organizations.state : '';
                return (
                  <div key={v.id} role="listitem" className="flex items-start gap-4 px-6 py-5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors flex-wrap">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-purple-100 text-purple-700" aria-hidden="true">{getInitials(orgName)}</div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '14px', color: '#0E1523', fontWeight: 700, marginBottom: '4px' }}>{orgName}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {location && <span style={{ fontSize: '12px', color: '#64748B' }}>{location}</span>}
                        {orgType && <span style={{ fontSize: '12px', color: '#64748B' }}>{ORG_TYPE_LABELS[orgType] || orgType}</span>}
                        {v.ein && <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>EIN: {v.ein}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Submitted {timeAgo(v.submitted_at)}</span>
                        {v.reviewed_at && <span style={{ fontSize: '12px', color: '#94A3B8' }}>Reviewed {timeAgo(v.reviewed_at)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {v.document_url && (
                        <button onClick={function() { var path = v.document_url.split('/verification-docs/')[1]; getSignedUrl(path); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label={'View IRS letter for ' + orgName}>
                          <FileText size={12} aria-hidden="true" /> View Document
                        </button>
                      )}
                      {filterStatus === 'pending' && (
                        <>
                          <button onClick={function() { handleVerification(v.id, v.organization_id, 'approve'); }} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors" aria-label={'Approve ' + orgName}>
                            <CheckCircle size={12} aria-hidden="true" />{actionLoading === v.id + 'approve' ? 'Approving...' : 'Approve'}
                          </button>
                          <button onClick={function() { handleVerification(v.id, v.organization_id, 'reject'); }} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors" aria-label={'Reject ' + orgName}>
                            <XCircle size={12} aria-hidden="true" />{actionLoading === v.id + 'reject' ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {filterStatus !== 'pending' && (
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full border ' + (filterStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200')}>
                          {filterStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

// ─── Category modal ───────────────────────────────────────────────────────────
function CategoryModal(props) {
  var [cats, setCats] = useState(props.categories.map(function(c) { return Object.assign({}, c); }));
  var [editingId, setEditingId] = useState(null);
  var [editLabel, setEditLabel] = useState('');
  var [editColor, setEditColor] = useState('');
  var [newLabel, setNewLabel] = useState('');
  var [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  var [saving, setSaving] = useState(false);

  function startEdit(cat) { setEditingId(cat.id); setEditLabel(cat.label); setEditColor(cat.color); }
  function saveEdit(id) { setCats(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { label: editLabel, color: editColor }) : c; }); }); setEditingId(null); }
  function deleteCategory(id) {
    if (id === 'general') { toast.error('Cannot delete the General category.'); return; }
    setCats(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  }
  function addCategory() {
    if (!newLabel.trim()) { toast.error('Label is required.'); return; }
    var id = slugifyCategoryId(newLabel);
    if (cats.find(function(c) { return c.id === id; })) { toast.error('A category with that name already exists.'); return; }
    setCats(function(prev) { return prev.concat([{ id: id, label: newLabel.trim(), color: newColor }]); });
    setNewLabel(''); setNewColor(CATEGORY_COLORS[0]);
  }
  async function handleSave() {
    setSaving(true);
    await props.onSave(cats);
    setSaving(false);
    mascotSuccessToast('Categories saved.');
    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Manage contact categories">
      <div className="absolute inset-0 bg-black/40" onClick={props.onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden mx-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 style={{ fontWeight: 800, fontSize: '16px', color: '#0E1523' }}>Manage Categories</h2>
          <button onClick={props.onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Close"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2 mb-6">
            {cats.map(function(cat) {
              var isEditing = editingId === cat.id;
              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <label htmlFor={'edit-label-' + cat.id} className="sr-only">Category label</label>
                      <input id={'edit-label-' + cat.id} type="text" value={editLabel} onChange={function(e) { setEditLabel(e.target.value); }} className="flex-1 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="flex gap-1">
                        {CATEGORY_COLORS.map(function(col) {
                          return <button key={col} onClick={function() { setEditColor(col); }} style={{ width: '18px', height: '18px', borderRadius: '50%', background: col, border: editColor === col ? '2px solid #0E1523' : '2px solid transparent', flexShrink: 0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" aria-label={'Color ' + col} aria-pressed={editColor === col} />;
                        })}
                      </div>
                      <button onClick={function() { saveEdit(cat.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label="Save"><Check size={12} aria-hidden="true" /></button>
                      <button onClick={function() { setEditingId(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors" aria-label="Cancel"><X size={12} aria-hidden="true" /></button>
                    </div>
                  ) : (
                    <>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0E1523', flex: 1 }}>{cat.label}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={function() { startEdit(cat); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label={'Edit ' + cat.label}><Pencil size={13} aria-hidden="true" /></button>
                        {cat.id !== 'general' && <button onClick={function() { deleteCategory(cat.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label={'Delete ' + cat.label}><Trash2 size={13} aria-hidden="true" /></button>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-200 pt-4">
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '10px' }}>Add New Category</p>
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="new-cat-label" className="sr-only">New category label</label>
                <input id="new-cat-label" type="text" value={newLabel} onChange={function(e) { setNewLabel(e.target.value); }} placeholder="Category name..." className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {CATEGORY_COLORS.map(function(col) {
                  return <button key={col} onClick={function() { setNewColor(col); }} style={{ width: '20px', height: '20px', borderRadius: '50%', background: col, border: newColor === col ? '2px solid #0E1523' : '2px solid transparent', flexShrink: 0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" aria-label={'Select color ' + col} aria-pressed={newColor === col} />;
                })}
              </div>
              <button onClick={addCategory} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors self-start">
                <Plus size={14} aria-hidden="true" /> Add Category
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={props.onClose} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Contacts tab ─────────────────────────────────────────────────────────────
function ContactsTab() {
  var [contacts, setContacts] = useState([]);
  var [loading, setLoading] = useState(true);
  var [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  var [showCategoryModal, setShowCategoryModal] = useState(false);
  var [search, setSearch] = useState('');
  var [filterCategory, setFilterCategory] = useState('');
  var [filterRead, setFilterRead] = useState('');
  var [dateFrom, setDateFrom] = useState('');
  var [dateTo, setDateTo] = useState('');
  var [expandedId, setExpandedId] = useState(null);
  var [expandedMessageId, setExpandedMessageId] = useState(null);
  var [editingNoteId, setEditingNoteId] = useState(null);
  var [noteValues, setNoteValues] = useState({});
  var [savingNoteId, setSavingNoteId] = useState(null);
  var [actionLoading, setActionLoading] = useState(null);
  var [selected, setSelected] = useState({});
  var [deleteConfirmId, setDeleteConfirmId] = useState(null);
  var [showBulkCategoryPicker, setShowBulkCategoryPicker] = useState(false);

  useEffect(function() { loadCategories(); loadContacts(); }, []);

  async function loadCategories() {
    var res = await supabase.from('site_content').select('value').eq('key', 'contact_categories').maybeSingle();
    if (res.data && res.data.value) {
      try {
        var parsed = JSON.parse(res.data.value);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      } catch(e) {}
    }
  }

  async function saveCategories(newCats) {
    setCategories(newCats);
    await supabase.from('site_content').upsert({ key: 'contact_categories', value: JSON.stringify(newCats), updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }

  async function loadContacts() {
    setLoading(true);
    var result = await supabase.from('marketing_contacts').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (result.error) { mascotErrorToast('Failed to load contacts.'); }
    else {
      var data = result.data || [];
      setContacts(data);
      var notes = {};
      data.forEach(function(c) { notes[c.id] = c.notes || ''; });
      setNoteValues(notes);
    }
    setLoading(false);
  }

  async function patchContact(id, patch) {
    var res = await supabase.from('marketing_contacts').update(patch).eq('id', id);
    if (res.error) { mascotErrorToast('Failed to update contact.'); return false; }
    setContacts(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, patch) : c; }); });
    return true;
  }

  async function handleToggleRead(contact) {
    setActionLoading(contact.id + '_read');
    var ok = await patchContact(contact.id, { is_read: !contact.is_read });
    if (ok) mascotSuccessToast(contact.is_read ? 'Marked as unread.' : 'Marked as read.');
    setActionLoading(null);
  }

  async function handleTogglePin(contact) {
    setActionLoading(contact.id + '_pin');
    var ok = await patchContact(contact.id, { is_pinned: !contact.is_pinned });
    if (ok) {
      mascotSuccessToast(contact.is_pinned ? 'Unpinned.' : 'Pinned to top.');
      setContacts(function(prev) {
        return prev.slice().sort(function(a, b) {
          var aPin = a.id === contact.id ? !contact.is_pinned : a.is_pinned;
          var bPin = b.id === contact.id ? !contact.is_pinned : b.is_pinned;
          if (aPin && !bPin) return -1;
          if (!aPin && bPin) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      });
    }
    setActionLoading(null);
  }

  async function handleCategoryChange(id, categoryId) {
    var ok = await patchContact(id, { category: categoryId });
    if (ok) mascotSuccessToast('Category updated.');
  }

  async function handleSaveNote(id) {
    setSavingNoteId(id);
    var ok = await patchContact(id, { notes: noteValues[id] || '' });
    if (ok) mascotSuccessToast('Note saved.');
    setSavingNoteId(null); setEditingNoteId(null);
  }

  async function handleDelete(id) {
    setActionLoading(id + '_delete');
    var res = await supabase.from('marketing_contacts').delete().eq('id', id);
    if (res.error) { mascotErrorToast('Failed to delete contact.'); }
    else {
      setContacts(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
      mascotSuccessToast('Contact deleted.');
      setDeleteConfirmId(null);
      var ns = Object.assign({}, selected); delete ns[id]; setSelected(ns);
    }
    setActionLoading(null);
  }

  async function handleBulkAction(action, catValue) {
    var ids = Object.keys(selected).filter(function(id) { return selected[id]; });
    if (ids.length === 0) return;
    if (action === 'read' || action === 'unread') {
      var res = await supabase.from('marketing_contacts').update({ is_read: action === 'read' }).in('id', ids);
      if (res.error) { mascotErrorToast('Bulk update failed.'); return; }
      setContacts(function(prev) { return prev.map(function(c) { return ids.includes(c.id) ? Object.assign({}, c, { is_read: action === 'read' }) : c; }); });
      mascotSuccessToast('Marked ' + ids.length + ' contact' + (ids.length !== 1 ? 's' : '') + ' as ' + action + '.');
      setSelected({});
    } else if (action === 'categorize' && catValue) {
      var res = await supabase.from('marketing_contacts').update({ category: catValue }).in('id', ids);
      if (res.error) { mascotErrorToast('Bulk categorize failed.'); return; }
      setContacts(function(prev) { return prev.map(function(c) { return ids.includes(c.id) ? Object.assign({}, c, { category: catValue }) : c; }); });
      mascotSuccessToast('Updated category for ' + ids.length + ' contact' + (ids.length !== 1 ? 's' : '') + '.');
      setSelected({}); setShowBulkCategoryPicker(false);
    } else if (action === 'delete') {
      var res = await supabase.from('marketing_contacts').delete().in('id', ids);
      if (res.error) { mascotErrorToast('Bulk delete failed.'); return; }
      setContacts(function(prev) { return prev.filter(function(c) { return !ids.includes(c.id); }); });
      mascotSuccessToast('Deleted ' + ids.length + ' contact' + (ids.length !== 1 ? 's' : '') + '.');
      setSelected({});
    }
  }

  function getCatById(id) { return categories.find(function(c) { return c.id === id; }) || categories[0] || DEFAULT_CATEGORIES[0]; }

  function handleExportCSV() {
    var rows = [['Name', 'Email', 'Organization', 'Message', 'Category', 'Pinned', 'Read', 'Notes', 'Date']];
    filtered.forEach(function(c) {
      rows.push(['"' + (c.name || '').replace(/"/g, '""') + '"', '"' + (c.email || '').replace(/"/g, '""') + '"', '"' + (c.organization || '').replace(/"/g, '""') + '"', '"' + (c.message || '').replace(/"/g, '""') + '"', '"' + (c.category || 'general') + '"', c.is_pinned ? 'Yes' : 'No', c.is_read ? 'Yes' : 'No', '"' + (c.notes || '').replace(/"/g, '""') + '"', c.created_at ? new Date(c.created_at).toLocaleDateString() : '']);
    });
    var csv = rows.map(function(r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'syndicade_contacts.csv'; a.click();
    URL.revokeObjectURL(url);
    mascotSuccessToast('CSV exported!', filtered.length + ' contacts downloaded.');
  }

  var filtered = contacts.filter(function(c) {
    var q = search.toLowerCase();
    var matchSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.organization || '').toLowerCase().includes(q);
    var matchCategory = !filterCategory || (c.category || 'general') === filterCategory;
    var matchRead = !filterRead || (filterRead === 'unread' ? !c.is_read : c.is_read);
    var matchFrom = !dateFrom || new Date(c.created_at) >= new Date(dateFrom);
    var matchTo = !dateTo || new Date(c.created_at) <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchCategory && matchRead && matchFrom && matchTo;
  });

  var unreadCount = contacts.filter(function(c) { return !c.is_read; }).length;
  var selectedIds = Object.keys(selected).filter(function(id) { return selected[id]; });
  var allFilteredSelected = filtered.length > 0 && filtered.every(function(c) { return selected[c.id]; });
  function toggleSelectAll() {
    if (allFilteredSelected) { setSelected({}); }
    else { var next = {}; filtered.forEach(function(c) { next[c.id] = true; }); setSelected(next); }
  }
  var hasFilters = search || filterCategory || filterRead || dateFrom || dateTo;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0E1523' }}>
            Marketing Contacts
            {unreadCount > 0 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white" aria-label={unreadCount + ' unread'}>{unreadCount}</span>}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{loading ? '—' : hasFilters ? filtered.length + ' of ' + contacts.length + ' contacts' : contacts.length + ' total contact' + (contacts.length !== 1 ? 's' : '')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={function() { setShowCategoryModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors" aria-label="Manage contact categories">
            <TagIcon size={14} aria-hidden="true" /> Categories
          </button>
          <button onClick={handleExportCSV} disabled={loading || filtered.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Export filtered contacts as CSV">
            <Download size={14} aria-hidden="true" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="contacts-search" className="sr-only">Search contacts</label>
          <input id="contacts-search" type="search" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search by name, email, or organization..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="relative">
          <label htmlFor="contacts-filter-category" className="sr-only">Filter by category</label>
          <select id="contacts-filter-category" value={filterCategory} onChange={function(e) { setFilterCategory(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All categories</option>
            {categories.map(function(cat) { return <option key={cat.id} value={cat.id}>{cat.label}</option>; })}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="contacts-filter-read" className="sr-only">Filter by read status</label>
          <select id="contacts-filter-read" value={filterRead} onChange={function(e) { setFilterRead(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="contacts-date-from" className="sr-only">From date</label>
          <input id="contacts-date-from" type="date" value={dateFrom} onChange={function(e) { setDateFrom(e.target.value); }} className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ width: '140px' }} aria-label="Filter from date" />
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>to</span>
          <label htmlFor="contacts-date-to" className="sr-only">To date</label>
          <input id="contacts-date-to" type="date" value={dateTo} onChange={function(e) { setDateTo(e.target.value); }} className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ width: '140px' }} aria-label="Filter to date" />
          {(dateFrom || dateTo) && <button onClick={function() { setDateFrom(''); setDateTo(''); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors" aria-label="Clear date range"><X size={13} aria-hidden="true" /></button>}
        </div>
        {hasFilters && <button onClick={function() { setSearch(''); setFilterCategory(''); setFilterRead(''); setDateFrom(''); setDateTo(''); }} className="text-sm text-slate-500 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded self-center">Clear all</button>}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex-wrap">
          <span style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: 600 }}>{selectedIds.length} selected</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={function() { handleBulkAction('read'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"><Eye size={12} aria-hidden="true" /> Mark read</button>
            <button onClick={function() { handleBulkAction('unread'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"><EyeOff size={12} aria-hidden="true" /> Mark unread</button>
            <div className="relative">
              <button onClick={function() { setShowBulkCategoryPicker(!showBulkCategoryPicker); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-expanded={showBulkCategoryPicker}><TagIcon size={12} aria-hidden="true" /> Categorize</button>
              {showBulkCategoryPicker && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1" style={{ minWidth: '160px' }}>
                  {categories.map(function(cat) {
                    var style = getCategoryStyle(cat.color);
                    return <button key={cat.id} onClick={function() { setShowBulkCategoryPicker(false); handleBulkAction('categorize', cat.id); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:bg-slate-50 flex items-center gap-2"><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />{cat.label}</button>;
                  })}
                </div>
              )}
            </div>
            <button onClick={function() { handleBulkAction('delete'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"><Trash2 size={12} aria-hidden="true" /> Delete</button>
          </div>
          <button onClick={function() { setSelected({}); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Deselect all"><X size={14} aria-hidden="true" /></button>
        </div>
      )}

      {loading && <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" aria-busy="true"><TableSkeleton /></div>}
      {!loading && contacts.length === 0 && <div className="bg-white border border-slate-200 rounded-xl"><EmptyState title="No contacts yet" description="Contacts appear when people submit the landing page form." /></div>}
      {!loading && contacts.length > 0 && filtered.length === 0 && <div className="bg-white border border-slate-200 rounded-xl"><EmptyState title="No contacts match your filters" description="Try adjusting your search or filters." action="Clear filters" onAction={function() { setSearch(''); setFilterCategory(''); setFilterRead(''); setDateFrom(''); setDateTo(''); }} /></div>}
      {!loading && filtered.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="region" aria-label="Marketing contacts">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <button onClick={toggleSelectAll} className="w-5 h-5 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded flex-shrink-0" aria-label={allFilteredSelected ? 'Deselect all' : 'Select all'}>
              {allFilteredSelected ? <CheckSquare size={16} className="text-blue-500" aria-hidden="true" /> : <Square size={16} className="text-slate-300" aria-hidden="true" />}
            </button>
            <span style={{ fontSize: '12px', color: '#64748B', flex: 1 }}>{filtered.length} contact{filtered.length !== 1 ? 's' : ''}{selectedIds.length > 0 && ' · ' + selectedIds.length + ' selected'}</span>
          </div>
          <div role="list" aria-label="Contact list">
            {filtered.map(function(c) {
              var isExpanded = expandedId === c.id;
              var isMessageExpanded = expandedMessageId === c.id;
              var isEditingNote = editingNoteId === c.id;
              var cat = getCatById(c.category || 'general');
              var catStyle = getCategoryStyle(cat.color);
              var isUnread = !c.is_read;
              var isPinned = c.is_pinned;
              return (
                <div key={c.id} role="listitem" style={{ borderBottom: '1px solid #F1F5F9', background: isUnread ? '#FAFBFF' : '#FFFFFF' }}>
                  <div className="flex items-start gap-3 px-4 py-4">
                    <button onClick={function() { var id = c.id; setSelected(function(prev) { var next = Object.assign({}, prev); next[id] = !prev[id]; return next; }); }} className="w-5 h-5 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded flex-shrink-0 mt-0.5" aria-label={(selected[c.id] ? 'Deselect' : 'Select') + ' ' + (c.name || c.email)}>
                      {selected[c.id] ? <CheckSquare size={16} className="text-blue-500" aria-hidden="true" /> : <Square size={16} className="text-slate-300" aria-hidden="true" />}
                    </button>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: catStyle.bg, color: catStyle.color, border: '1px solid ' + catStyle.border }} aria-hidden="true">{getInitials(c.name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {isPinned && <Pin size={12} className="text-yellow-500 flex-shrink-0" aria-label="Pinned" />}
                        <span style={{ fontSize: '14px', fontWeight: isUnread ? 700 : 600, color: '#0E1523' }}>{c.name || '—'}</span>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" aria-label="Unread" />}
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: catStyle.bg, color: catStyle.color, border: '1px solid ' + catStyle.border, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <a href={'mailto:' + c.email} style={{ fontSize: '13px', color: '#3B82F6' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Email ' + (c.name || c.email)}>{c.email}</a>
                        {c.organization && <span style={{ fontSize: '12px', color: '#64748B' }}>{c.organization}</span>}
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>{timeAgo(c.created_at)}</span>
                      </div>
                      {c.message && (
                        <div style={{ marginTop: '6px' }}>
                          {isMessageExpanded ? <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{c.message}</p> : <p style={{ fontSize: '13px', color: '#475569', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.message}</p>}
                          {c.message.length > 120 && <button onClick={function() { setExpandedMessageId(isMessageExpanded ? null : c.id); }} style={{ fontSize: '12px', color: '#3B82F6', marginTop: '2px' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{isMessageExpanded ? 'Show less' : 'Read more'}</button>}
                        </div>
                      )}
                      {c.notes && !isExpanded && (
                        <div className="flex items-start gap-1.5 mt-2">
                          <StickyNote size={11} className="text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }} className="line-clamp-1">{c.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={function() { handleTogglePin(c); }} disabled={actionLoading === c.id + '_pin'} className={'w-8 h-8 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 ' + (isPinned ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-slate-300 hover:text-yellow-500 hover:bg-yellow-50')} aria-label={isPinned ? 'Unpin contact' : 'Pin contact'}>{isPinned ? <PinOff size={14} aria-hidden="true" /> : <Pin size={14} aria-hidden="true" />}</button>
                      <button onClick={function() { handleToggleRead(c); }} disabled={actionLoading === c.id + '_read'} className={'w-8 h-8 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isUnread ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100')} aria-label={isUnread ? 'Mark as read' : 'Mark as unread'}>{isUnread ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}</button>
                      <button onClick={function() { setExpandedId(isExpanded ? null : c.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" aria-expanded={isExpanded} aria-label={isExpanded ? 'Collapse details' : 'Expand details'}>{isExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}</button>
                      {deleteConfirmId === c.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={function() { handleDelete(c.id); }} disabled={actionLoading === c.id + '_delete'} className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label="Confirm delete">{actionLoading === c.id + '_delete' ? '...' : 'Delete'}</button>
                          <button onClick={function() { setDeleteConfirmId(null); }} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors" aria-label="Cancel delete">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={function() { setDeleteConfirmId(c.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={'Delete ' + (c.name || c.email)}><Trash2 size={14} aria-hidden="true" /></button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ background: '#F8FAFC', borderTop: '1px solid #F1F5F9', padding: '16px 20px 20px 56px' }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '8px' }}>Category</p>
                          <div className="flex flex-wrap gap-2">
                            {categories.map(function(cat) {
                              var style = getCategoryStyle(cat.color);
                              var isActive = (c.category || 'general') === cat.id;
                              return <button key={cat.id} onClick={function() { handleCategoryChange(c.id, cat.id); }} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '99px', background: isActive ? style.bg : '#FFFFFF', color: isActive ? style.color : '#64748B', border: '1px solid ' + (isActive ? style.border : '#E2E8F0'), cursor: 'pointer', outline: 'none' }} className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" aria-pressed={isActive}>{cat.label}</button>;
                            })}
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '8px' }}>Internal Notes</p>
                          {isEditingNote ? (
                            <div>
                              <label htmlFor={'note-' + c.id} className="sr-only">Internal note for {c.name || c.email}</label>
                              <textarea id={'note-' + c.id} value={noteValues[c.id] || ''} onChange={function(e) { var id = c.id; var val = e.target.value; setNoteValues(function(prev) { var next = Object.assign({}, prev); next[id] = val; return next; }); }} rows={3} placeholder="Add an internal note..." style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', color: '#475569', resize: 'vertical', outline: 'none' }} className="focus:ring-2 focus:ring-blue-500" />
                              <div className="flex gap-2 mt-2">
                                <button onClick={function() { handleSaveNote(c.id); }} disabled={savingNoteId === c.id} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">{savingNoteId === c.id ? 'Saving...' : 'Save'}</button>
                                <button onClick={function() { setEditingNoteId(null); }} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {noteValues[c.id] ? <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '8px' }}>{noteValues[c.id]}</p> : <p style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic', marginBottom: '8px' }}>No note yet.</p>}
                              <button onClick={function() { setEditingNoteId(c.id); }} className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"><StickyNote size={11} aria-hidden="true" />{noteValues[c.id] ? 'Edit note' : 'Add note'}</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showCategoryModal && <CategoryModal categories={categories} onSave={saveCategories} onClose={function() { setShowCategoryModal(false); }} />}
    </div>
  );
}

// ─── Manage Tags tab (TAG6) ───────────────────────────────────────────────────
function ManageTagsTab() {
  var [tags, setTags] = useState([]);
  var [usageCounts, setUsageCounts] = useState({});
  var [customKeywords, setCustomKeywords] = useState([]);
  var [loading, setLoading] = useState(true);
  var [loadingUsage, setLoadingUsage] = useState(true);
  var [filterGroup, setFilterGroup] = useState('');
  var [filterUnused, setFilterUnused] = useState(false);
  var [search, setSearch] = useState('');
  var [deleteConfirmId, setDeleteConfirmId] = useState(null);
  var [deletingId, setDeletingId] = useState(null);
  var [promoting, setPromoting] = useState(null);

  // Add form state
  var [newLabel, setNewLabel] = useState('');
  var [newGroup, setNewGroup] = useState(TAG_GROUP_NAMES[0]);
  var [newAppliesTo, setNewAppliesTo] = useState([]);
  var [saving, setSaving] = useState(false);

  // Stats
  var [totalContentItems, setTotalContentItems] = useState(0);

  useEffect(function() { loadTags(); loadUsageCounts(); }, []);

  async function loadTags() {
    setLoading(true);
    var res = await supabase.from('platform_tags').select('*').order('group_name').order('sort_order').order('label');
    if (res.error) { mascotErrorToast('Failed to load tags.', 'Check your connection.'); }
    else { setTags(res.data || []); }
    setLoading(false);
  }

  async function loadUsageCounts() {
    setLoadingUsage(true);
    try {
      // Fetch all tags arrays from all content tables in parallel
      var results = await Promise.all([
        supabase.from('events').select('tags, cause_areas'),
        supabase.from('org_programs').select('tags'),
        supabase.from('org_opportunities').select('tags'),
        supabase.from('org_funding').select('tags'),
        supabase.from('organizations').select('tags'),
      ]);

      var counts = {};
      var allCustom = {};
      var totalItems = 0;

      // Load platform tag labels for custom keyword detection
      var platformLabelsRes = await supabase.from('platform_tags').select('label');
      var platformLabelSet = new Set((platformLabelsRes.data || []).map(function(t) { return t.label.toLowerCase(); }));

      results.forEach(function(res) {
        if (res.error || !res.data) return;
        res.data.forEach(function(row) {
          totalItems++;
          // Handle both tags and cause_areas columns
          var allTagArrays = [row.tags, row.cause_areas].filter(Boolean);
          allTagArrays.forEach(function(tagArray) {
            if (!Array.isArray(tagArray)) return;
            tagArray.forEach(function(tag) {
              if (!tag) return;
              var tagLower = tag.toLowerCase();
              // Count usage for all tags
              counts[tag] = (counts[tag] || 0) + 1;
              // Track custom keywords (not in platform_tags)
              if (!platformLabelSet.has(tagLower)) {
                allCustom[tag] = (allCustom[tag] || 0) + 1;
              }
            });
          });
        });
      });

      setUsageCounts(counts);
      setTotalContentItems(totalItems);

      // Top custom keywords sorted by frequency
      var customList = Object.keys(allCustom).map(function(k) { return { keyword: k, count: allCustom[k] }; });
      customList.sort(function(a, b) { return b.count - a.count; });
      setCustomKeywords(customList.slice(0, 20));

    } catch(err) {
      mascotErrorToast('Failed to load usage data.');
    }
    setLoadingUsage(false);
  }

  async function handleAdd() {
    if (!newLabel.trim()) { toast.error('Tag label is required.'); return; }
    if (newAppliesTo.length === 0) { toast.error('Select at least one content type.'); return; }
    // Check for duplicate
    var duplicate = tags.find(function(t) { return t.label.toLowerCase() === newLabel.trim().toLowerCase() && t.group_name === newGroup; });
    if (duplicate) { toast.error('A tag with that label already exists in this group.'); return; }
    setSaving(true);
    var res = await supabase.from('platform_tags').insert({
      label: newLabel.trim(),
      group_name: newGroup,
      applies_to: newAppliesTo,
      sort_order: 0,
    }).select().single();
    if (res.error) { mascotErrorToast('Failed to add tag.', res.error.message); setSaving(false); return; }
    setTags(function(prev) { return prev.concat([res.data]).sort(function(a, b) { return a.group_name.localeCompare(b.group_name) || a.label.localeCompare(b.label); }); });
    setNewLabel(''); setNewAppliesTo([]);
    mascotSuccessToast('Tag added!', '"' + res.data.label + '" is now available as a platform tag.');
    setSaving(false);
  }

  async function handleDelete(tag) {
    setDeletingId(tag.id);
    var res = await supabase.from('platform_tags').delete().eq('id', tag.id);
    if (res.error) { mascotErrorToast('Failed to delete tag.', res.error.message); setDeletingId(null); return; }
    setTags(function(prev) { return prev.filter(function(t) { return t.id !== tag.id; }); });
    setDeleteConfirmId(null);
    mascotSuccessToast('Tag retired.', '"' + tag.label + '" removed from platform tags.');
    setDeletingId(null);
  }

  async function handlePromoteKeyword(keyword) {
    setPromoting(keyword);
    // Pre-fill the add form with the keyword
    setNewLabel(keyword);
    setNewGroup(TAG_GROUP_NAMES[0]);
    setNewAppliesTo([]);
    // Scroll to add form
    var el = document.getElementById('add-tag-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setPromoting(null);
  }

  function toggleAppliesTo(val) {
    setNewAppliesTo(function(prev) {
      if (prev.includes(val)) return prev.filter(function(v) { return v !== val; });
      return prev.concat([val]);
    });
  }

  // Group tags
  var groupedTags = {};
  var filteredTags = tags.filter(function(t) {
    var matchGroup = !filterGroup || t.group_name === filterGroup;
    var matchSearch = !search || t.label.toLowerCase().includes(search.toLowerCase());
    var matchUnused = !filterUnused || !(usageCounts[t.label] > 0);
    return matchGroup && matchSearch && matchUnused;
  });
  filteredTags.forEach(function(t) {
    if (!groupedTags[t.group_name]) groupedTags[t.group_name] = [];
    groupedTags[t.group_name].push(t);
  });

  var totalTags = tags.length;
  var unusedCount = tags.filter(function(t) { return !usageCounts[t.label]; }).length;
  var usedCount = totalTags - unusedCount;
  var topTagsByUsage = Object.keys(usageCounts)
    .filter(function(label) { return tags.find(function(t) { return t.label === label; }); })
    .map(function(label) { return { label: label, count: usageCounts[label] }; })
    .sort(function(a, b) { return b.count - a.count; })
    .slice(0, 10);

  return (
    <div>
      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0E1523' }}>{totalTags}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginTop: '4px' }}>Platform Tags</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A' }}>{loadingUsage ? '—' : usedCount}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginTop: '4px' }}>In Use</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div style={{ fontSize: '28px', fontWeight: 800, color: unusedCount > 0 ? '#D97706' : '#0E1523' }}>{loadingUsage ? '—' : unusedCount}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginTop: '4px' }}>Never Used</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#3B82F6' }}>{loadingUsage ? '—' : customKeywords.length}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginTop: '4px' }}>Custom Tags in Use</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ── Left: Tag list ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1" style={{ minWidth: '200px' }}>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <label htmlFor="tag-search" className="sr-only">Search tags</label>
              <input id="tag-search" type="search" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search tags..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <label htmlFor="tag-filter-group" className="sr-only">Filter by group</label>
              <select id="tag-filter-group" value={filterGroup} onChange={function(e) { setFilterGroup(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All groups</option>
                {TAG_GROUP_NAMES.map(function(g) { return <option key={g} value={g}>{g}</option>; })}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            </div>
            <button onClick={function() { setFilterUnused(!filterUnused); }} className={'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ' + (filterUnused ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50')} aria-pressed={filterUnused}>
              <TrendingDown size={13} aria-hidden="true" /> Never used only
            </button>
            <button onClick={function() { setSearch(''); setFilterGroup(''); setFilterUnused(false); loadTags(); loadUsageCounts(); }} className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors" aria-label="Refresh tag data">
              <RefreshCw size={13} aria-hidden="true" /> Refresh
            </button>
          </div>

          {/* Tag groups */}
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(function(i) { return <TagGroupSkeleton key={i} />; })}
            </div>
          ) : filteredTags.length === 0 ? (
            <EmptyState title="No tags found" description={filterUnused ? 'All tags have been used at least once.' : 'No tags match your search or filters.'} action={(search || filterGroup || filterUnused) ? 'Clear filters' : null} onAction={function() { setSearch(''); setFilterGroup(''); setFilterUnused(false); }} />
          ) : (
            <div className="space-y-4" role="list" aria-label="Platform tags by group">
              {Object.keys(groupedTags).sort().map(function(groupName) {
                var groupTags = groupedTags[groupName];
                return (
                  <div key={groupName} className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="listitem">
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-slate-400" aria-hidden="true" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523' }}>{groupName}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '99px', padding: '1px 8px' }}>{groupTags.length}</span>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="flex flex-wrap gap-2" role="list" aria-label={groupName + ' tags'}>
                        {groupTags.map(function(tag) {
                          var count = usageCounts[tag.label] || 0;
                          var isUnused = count === 0;
                          var isDeleting = deletingId === tag.id;
                          var isConfirming = deleteConfirmId === tag.id;
                          return (
                            <div key={tag.id} role="listitem" className={'flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full border transition-colors ' + (isUnused ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200')} style={{ maxWidth: '100%' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: isUnused ? '#94A3B8' : '#1D4ED8', whiteSpace: 'nowrap' }}>{tag.label}</span>
                              {/* Usage count badge */}
                              {loadingUsage ? (
                                <span className="w-8 h-4 rounded-full bg-slate-100 animate-pulse inline-block" aria-hidden="true" />
                              ) : count > 0 ? (
                                <span style={{ fontSize: '10px', fontWeight: 700, background: '#3B82F6', color: '#FFFFFF', borderRadius: '99px', padding: '1px 6px', whiteSpace: 'nowrap' }} aria-label={count + ' uses'}>{count}</span>
                              ) : (
                                <span style={{ fontSize: '10px', fontWeight: 600, background: '#F1F5F9', color: '#94A3B8', borderRadius: '99px', padding: '1px 6px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }} aria-label="Unused">0</span>
                              )}
                              {/* Applies-to dots */}
                              <div className="flex gap-0.5 ml-0.5" aria-label={'Applies to: ' + (tag.applies_to || []).join(', ')}>
                                {(tag.applies_to || []).map(function(type) {
                                  var colors = { event: '#3B82F6', program: '#8B5CF6', opportunity: '#22C55E', funding: '#F59E0B', org: '#EF4444' };
                                  return <span key={type} style={{ width: '5px', height: '5px', borderRadius: '50%', background: colors[type] || '#94A3B8', display: 'inline-block', flexShrink: 0 }} title={type} />;
                                })}
                              </div>
                              {/* Delete action */}
                              {isConfirming ? (
                                <div className="flex items-center gap-1 ml-0.5">
                                  <button onClick={function() { handleDelete(tag); }} disabled={isDeleting} className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors" aria-label={'Confirm retire ' + tag.label}>{isDeleting ? '...' : 'Retire'}</button>
                                  <button onClick={function() { setDeleteConfirmId(null); }} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-full hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors" aria-label="Cancel">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={function() { setDeleteConfirmId(tag.id); }} className="w-5 h-5 flex items-center justify-center rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors ml-0.5 flex-shrink-0" aria-label={'Retire tag: ' + tag.label}>
                                  <X size={10} aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add new tag form ── */}
          <div id="add-tag-form" className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="region" aria-label="Add new platform tag">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Plus size={14} className="text-blue-500" aria-hidden="true" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523' }}>Add New Platform Tag</span>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-tag-label" style={{ fontSize: '13px', fontWeight: 600, color: '#0E1523', display: 'block', marginBottom: '6px' }}>
                    Tag Label <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="new-tag-label"
                    type="text"
                    value={newLabel}
                    onChange={function(e) { setNewLabel(e.target.value); }}
                    placeholder="e.g. Food Justice"
                    className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-required="true"
                    onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                  />
                  <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Exact label shown to admins in content forms.</p>
                </div>
                <div>
                  <label htmlFor="new-tag-group" style={{ fontSize: '13px', fontWeight: 600, color: '#0E1523', display: 'block', marginBottom: '6px' }}>
                    Group <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="new-tag-group"
                      value={newGroup}
                      onChange={function(e) { setNewGroup(e.target.value); }}
                      className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-required="true"
                    >
                      {TAG_GROUP_NAMES.map(function(g) { return <option key={g} value={g}>{g}</option>; })}
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0E1523', marginBottom: '8px' }}>
                  Applies to <span style={{ color: '#EF4444' }}>*</span>
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Content types this tag applies to">
                  {TAG_APPLIES_TO_OPTIONS.map(function(opt) {
                    var isChecked = newAppliesTo.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={function() { toggleAppliesTo(opt.value); }}
                        className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isChecked ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50')}
                        aria-pressed={isChecked}
                      >
                        {isChecked ? <Check size={12} aria-hidden="true" /> : <Square size={12} aria-hidden="true" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>Controls which content type modals show this tag group.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAdd}
                  disabled={saving || !newLabel.trim() || newAppliesTo.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={14} aria-hidden="true" />
                  {saving ? 'Adding...' : 'Add Tag'}
                </button>
                {newLabel && (
                  <button onClick={function() { setNewLabel(''); setNewAppliesTo([]); }} className="text-sm text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded underline transition-colors">Clear</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Insights panel ── */}
        <div className="space-y-6">

          {/* Top used platform tags */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="region" aria-label="Top used platform tags">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <BarChart size={14} className="text-blue-500" aria-hidden="true" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523' }}>Top Used Platform Tags</span>
            </div>
            {loadingUsage ? (
              <div className="px-5 py-4 space-y-3">
                {[1,2,3,4,5].map(function(i) { return <div key={i} className="h-6 rounded bg-slate-100 animate-pulse" aria-hidden="true" />; })}
              </div>
            ) : topTagsByUsage.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p style={{ fontSize: '13px', color: '#94A3B8' }}>No tag usage data yet.</p>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-2" role="list" aria-label="Most used tags">
                {topTagsByUsage.map(function(item, idx) {
                  var maxCount = topTagsByUsage[0].count;
                  var pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <div key={item.label} role="listitem" className="flex items-center gap-3">
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', width: '16px', textAlign: 'right', flexShrink: 0 }}>{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0E1523' }} className="truncate">{item.label}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', flexShrink: 0, marginLeft: '8px' }}>{item.count}</span>
                        </div>
                        <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: '#3B82F6', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Never used tags */}
          {!loadingUsage && unusedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden" role="region" aria-label="Unused platform tags">
              <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" aria-hidden="true" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>{unusedCount} Never Used</span>
                <span style={{ fontSize: '11px', color: '#B45309' }}>— consider retiring</span>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {tags.filter(function(t) { return !usageCounts[t.label]; }).slice(0, 15).map(function(t) {
                    return (
                      <span key={t.id} style={{ fontSize: '11px', fontWeight: 600, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '99px', padding: '2px 8px' }}>
                        {t.label}
                      </span>
                    );
                  })}
                  {unusedCount > 15 && <span style={{ fontSize: '11px', color: '#B45309' }}>+{unusedCount - 15} more — use "Never used only" filter</span>}
                </div>
              </div>
            </div>
          )}

          {/* Trending custom keywords */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="region" aria-label="Trending custom tags from admins">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Sparkles size={14} className="text-yellow-500" aria-hidden="true" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523' }}>Trending Custom Tags</span>
            </div>
            <div className="px-5 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: '12px', color: '#64748B' }}>Tags admins are adding that are NOT platform tags. Promote frequently-used ones to platform tags.</p>
            </div>
            {loadingUsage ? (
              <div className="px-5 py-4 space-y-2">
                {[1,2,3,4].map(function(i) { return <div key={i} className="h-8 rounded bg-slate-100 animate-pulse" aria-hidden="true" />; })}
              </div>
            ) : customKeywords.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p style={{ fontSize: '13px', color: '#94A3B8' }}>No custom tags found. All tags in use are platform tags.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100" role="list" aria-label="Custom keywords used by admins">
                {customKeywords.map(function(item) {
                  return (
                    <div key={item.keyword} role="listitem" className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0E1523' }} className="truncate">{item.keyword}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '99px', padding: '1px 6px', flexShrink: 0 }}>{item.count}x</span>
                      </div>
                      <button
                        onClick={function() { handlePromoteKeyword(item.keyword); }}
                        disabled={promoting === item.keyword}
                        className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex-shrink-0 ml-2"
                        aria-label={'Promote ' + item.keyword + ' to platform tag'}
                      >
                        <ArrowUpCircle size={11} aria-hidden="true" />
                        Promote
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4" role="region" aria-label="Tag color legend">
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '10px' }}>Content Type Legend</p>
            <div className="space-y-1.5">
              {TAG_APPLIES_TO_OPTIONS.map(function(opt) {
                var colors = { event: '#3B82F6', program: '#8B5CF6', opportunity: '#22C55E', funding: '#F59E0B', org: '#EF4444' };
                return (
                  <div key={opt.value} className="flex items-center gap-2">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[opt.value], flexShrink: 0, display: 'inline-block' }} aria-hidden="true" />
                    <span style={{ fontSize: '12px', color: '#475569' }}>{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
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
    var res = await supabase.from('bug_reports').select('*').order('created_at', { ascending: false });
    if (res.error) { mascotErrorToast('Failed to load bug reports.'); } else { setReports(res.data || []); }
    setLoading(false);
  }
  async function handleStatusChange(id, newStatus) {
    setUpdatingId(id);
    var res = await supabase.from('bug_reports').update({ status: newStatus }).eq('id', id);
    if (res.error) { toast.error('Failed to update status.'); } else {
      setReports(function(prev) { return prev.map(function(r) { return r.id === id ? Object.assign({}, r, { status: newStatus }) : r; }); });
      mascotSuccessToast('Status updated to ' + BUG_STATUS_CONFIG[newStatus].label + '.');
    }
    setUpdatingId(null);
  }
  var filtered = reports.filter(function(r) { return (!filterStatus || r.status === filterStatus) && (!filterType || r.type === filterType) && (!filterSeverity || r.severity === filterSeverity); });
  var newCount = reports.filter(function(r) { return r.status === 'new'; }).length;
  var criticalCount = reports.filter(function(r) { return r.severity === 'critical' && r.status !== 'resolved' && r.status !== 'closed'; }).length;
  return (
    <div>
      {!loading && reports.length > 0 && (
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {newCount > 0 && <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg"><AlertCircle size={14} className="text-purple-600" aria-hidden="true" /><span style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 600 }}>{newCount} new report{newCount !== 1 ? 's' : ''}</span></div>}
          {criticalCount > 0 && <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg"><AlertTriangle size={14} className="text-red-600" aria-hidden="true" /><span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>{criticalCount} critical open</span></div>}
          <span style={{ fontSize: '13px', color: '#64748B' }}>{reports.length} total report{reports.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter size={14} className="text-slate-400" aria-hidden="true" />
        <div className="relative"><label htmlFor="bug-filter-status" className="sr-only">Filter by status</label><select id="bug-filter-status" value={filterStatus} onChange={function(e) { setFilterStatus(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">All statuses</option>{BUG_STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{BUG_STATUS_CONFIG[s].label}</option>; })}</select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" /></div>
        <div className="relative"><label htmlFor="bug-filter-type" className="sr-only">Filter by type</label><select id="bug-filter-type" value={filterType} onChange={function(e) { setFilterType(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">All types</option><option value="bug">Bug</option><option value="suggestion">Suggestion</option></select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" /></div>
        <div className="relative"><label htmlFor="bug-filter-severity" className="sr-only">Filter by severity</label><select id="bug-filter-severity" value={filterSeverity} onChange={function(e) { setFilterSeverity(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" /></div>
        {(filterStatus || filterType || filterSeverity) && <button onClick={function() { setFilterStatus(''); setFilterType(''); setFilterSeverity(''); }} className="text-sm text-slate-500 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Clear filters</button>}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? <TableSkeleton />
          : reports.length === 0 ? <EmptyState title="No bug reports yet" description="Reports submitted through the beta form will appear here." />
          : filtered.length === 0 ? <EmptyState title="No reports match your filters" description="Try adjusting the status, type, or severity filter." action="Clear filters" onAction={function() { setFilterStatus(''); setFilterType(''); setFilterSeverity(''); }} />
          : (
            <div role="list" aria-label="Bug reports">
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50"><span style={{ fontSize: '12px', color: '#64748B' }}>{filtered.length} of {reports.length} report{reports.length !== 1 ? 's' : ''}</span></div>
              {filtered.map(function(report) {
                var isExpanded = expandedId === report.id;
                var sev = report.severity && SEVERITY_CONFIG[report.severity];
                var stat = BUG_STATUS_CONFIG[report.status] || BUG_STATUS_CONFIG['new'];
                return (
                  <div key={report.id} role="listitem" className="border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col gap-1.5 flex-shrink-0 pt-0.5">
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px', background: report.type === 'bug' ? '#FEE2E2' : '#EDE9FE', color: report.type === 'bug' ? '#DC2626' : '#7C3AED', border: '1px solid ' + (report.type === 'bug' ? '#FECACA' : '#DDD6FE') }}>{report.type === 'bug' ? 'Bug' : 'Suggestion'}</span>
                        {sev && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px', background: sev.bg, color: sev.color, border: '1px solid ' + sev.border }}>{sev.label}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0E1523', marginBottom: '4px' }}>{report.title}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          {report.app_area && <span style={{ fontSize: '12px', color: '#64748B' }}>{report.app_area === 'other' && report.other_area ? report.other_area : report.app_area}</span>}
                          {report.reporter_email && <a href={'mailto:' + report.reporter_email} style={{ fontSize: '12px', color: '#3B82F6' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{report.reporter_email}</a>}
                          <span style={{ fontSize: '12px', color: '#94A3B8' }}>{timeAgo(report.created_at)}</span>
                        </div>
                      </div>
                      {report.screenshot_url && <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="View screenshot"><img src={report.screenshot_url} alt="Bug screenshot" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }} /></a>}
                      <div className="relative flex-shrink-0">
                        <label htmlFor={'status-' + report.id} className="sr-only">Status for {report.title}</label>
                        <select id={'status-' + report.id} value={report.status} onChange={function(e) { handleStatusChange(report.id, e.target.value); }} disabled={updatingId === report.id} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 24px 4px 10px', borderRadius: '99px', background: stat.bg, color: stat.color, border: '1px solid ' + stat.border, appearance: 'none', cursor: 'pointer', opacity: updatingId === report.id ? 0.5 : 1 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {BUG_STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{BUG_STATUS_CONFIG[s].label}</option>; })}
                        </select>
                        <ChevronDown size={10} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: stat.color }} aria-hidden="true" />
                      </div>
                      <button onClick={function() { setExpandedId(isExpanded ? null : report.id); }} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-expanded={isExpanded} aria-label={isExpanded ? 'Collapse details' : 'Expand details'}>{isExpanded ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}</button>
                    </div>
                    {isExpanded && (
                      <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {report.description && <div><p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Description</p><p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{report.description}</p></div>}
                          {report.steps_to_reproduce && <div><p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Steps to Reproduce</p><p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.steps_to_reproduce}</p></div>}
                          <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Technical Details</p>
                            <div className="space-y-1">
                              {report.reported_url && <div className="flex items-start gap-2"><ExternalLink size={12} className="text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true" /><a href={report.reported_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3B82F6', wordBreak: 'break-all' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{report.reported_url}</a></div>}
                              {report.user_agent && <div className="flex items-start gap-2"><Activity size={12} className="text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true" /><p style={{ fontSize: '11px', color: '#94A3B8', wordBreak: 'break-all' }}>{report.user_agent}</p></div>}
                            </div>
                          </div>
                          {report.screenshot_url && <div><p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '6px' }}>Screenshot</p><a href={report.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="View full screenshot"><img src={report.screenshot_url} alt="Bug screenshot" style={{ maxWidth: '240px', borderRadius: '8px', border: '1px solid #E2E8F0' }} /></a></div>}
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

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab(props) {
  var pendingVerifCount = props.pendingVerifCount || 0;
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [metrics, setMetrics] = useState(null);
  var [planBreakdown, setPlanBreakdown] = useState([]);
  var [atRiskOrgs, setAtRiskOrgs] = useState([]);
  var [recentOrgs, setRecentOrgs] = useState([]);
  var [openBugs, setOpenBugs] = useState(0);
  var [criticalBugs, setCriticalBugs] = useState(0);
  var [states, setStates] = useState([]);
  var [cities, setCities] = useState([]);
  var [filterState, setFilterState] = useState('');
  var [filterCity, setFilterCity] = useState('');

  useEffect(function() { loadAll(false); loadLocationOptions(); }, []);
  useEffect(function() { if (!loading) loadMetrics(); }, [filterState, filterCity]);

  async function loadAll(showRefresh) {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    await Promise.all([loadMetrics(), loadBugSummary()]);
    setLoading(false); setRefreshing(false);
  }

  async function loadBugSummary() {
    var res = await supabase.from('bug_reports').select('status, severity').in('status', ['new', 'in_review']);
    var bugs = res.data || [];
    setOpenBugs(bugs.length);
    setCriticalBugs(bugs.filter(function(b) { return b.severity === 'critical'; }).length);
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
      totalEvents: er.count || 0, atRiskCount: atRisk.length,
      verifiedNonprofits: allOrgs.filter(function(o) { return o.is_verified_nonprofit; }).length,
    });
  }

  async function loadLocationOptions() {
    var res = await supabase.from('organizations').select('state, city').not('state', 'is', null);
    if (!res.data) return;
    var ss = new Set(); var cs = new Set();
    res.data.forEach(function(o) { if (o.state) ss.add(o.state); if (o.city) cs.add(o.city); });
    setStates(Array.from(ss).sort()); setCities(Array.from(cs).sort());
  }

  var pendingActionsCount = pendingVerifCount + criticalBugs + (metrics && metrics.atRiskCount || 0);

  return (
    <div>
      {!loading && pendingActionsCount > 0 && (
        <section aria-label="Pending actions" className="mb-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-yellow-600" aria-hidden="true" /><span style={{ fontSize: '14px', fontWeight: 700, color: '#92400E' }}>Needs your attention</span></div>
            <div className="flex items-center gap-4 flex-wrap">
              {pendingVerifCount > 0 && <span style={{ fontSize: '13px', color: '#92400E' }}>{pendingVerifCount} pending verification{pendingVerifCount !== 1 ? 's' : ''} — check Verifications tab</span>}
              {criticalBugs > 0 && <span style={{ fontSize: '13px', color: '#DC2626' }}>{criticalBugs} critical bug{criticalBugs !== 1 ? 's' : ''} open</span>}
              {metrics && metrics.atRiskCount > 0 && <span style={{ fontSize: '13px', color: '#B45309' }}>{metrics.atRiskCount} at-risk org{metrics.atRiskCount !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        </section>
      )}
      <div className="flex items-center gap-4 flex-wrap mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500"><MapPin size={14} aria-hidden="true" />Filter by location:</div>
        <div className="relative">
          <label htmlFor="filter-state" className="sr-only">State</label>
          <select id="filter-state" value={filterState} onChange={function(e) { setFilterState(e.target.value); setFilterCity(''); }} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"><option value="">All States</option>{states.map(function(s) { return <option key={s} value={s}>{s}</option>; })}</select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        <div className="relative">
          <label htmlFor="filter-city" className="sr-only">City</label>
          <select id="filter-city" value={filterCity} onChange={function(e) { setFilterCity(e.target.value); }} disabled={!filterState} className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-40"><option value="">All Cities</option>{cities.map(function(c) { return <option key={c} value={c}>{c}</option>; })}</select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
        </div>
        {(filterState || filterCity) && <button onClick={function() { setFilterState(''); setFilterCity(''); }} className="text-sm text-slate-500 hover:text-slate-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Clear</button>}
        <div className="ml-auto">
          <button onClick={function() { loadAll(true); }} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />{refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      <section aria-label="Key metrics" className="mb-10">
        <SectionLabel>Platform Overview</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading ? [1,2,3,4,5,6,7,8,9,10].map(function(i) { return <MetricSkeleton key={i} />; })
            : metrics ? (
              <>
                <MetricCard icon={Users} label="Total Members" value={metrics.totalMembers.toLocaleString()} sub={'+' + metrics.newMembersWeek + ' this week'} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <MetricCard icon={Building2} label="Total Orgs" value={metrics.totalOrgs.toLocaleString()} sub={'+' + metrics.newOrgsWeek + ' this week'} iconBg="bg-purple-50" iconColor="text-purple-500" />
                <MetricCard icon={DollarSign} label="Est. MRR" value={formatMRR(metrics.mrr)} sub={metrics.paidOrgs + ' paying orgs'} iconBg="bg-green-50" iconColor="text-green-600" />
                <MetricCard icon={Activity} label="Paid Orgs" value={metrics.paidOrgs} sub={metrics.trialOrgs + ' on trial · ' + metrics.freeOrgs + ' free'} iconBg="bg-green-50" iconColor="text-green-600" />
                <MetricCard icon={ShieldCheck} label="Pending Verif." value={pendingVerifCount} sub="Awaiting review" iconBg="bg-purple-50" iconColor="text-purple-500" alert={pendingVerifCount > 0} />
                <MetricCard icon={Calendar} label="Total Events" value={metrics.totalEvents.toLocaleString()} sub="Across all orgs" iconBg="bg-blue-50" iconColor="text-blue-500" />
                <MetricCard icon={TrendingUp} label="New Orgs (Month)" value={metrics.newOrgsMonth} sub={metrics.newOrgsWeek + ' in past 7 days'} iconBg="bg-blue-50" iconColor="text-blue-500" />
                <MetricCard icon={CheckCircle} label="Verified Nonprofits" value={metrics.verifiedNonprofits} sub="Approved 501(c)(3)" iconBg="bg-green-50" iconColor="text-green-600" />
                <MetricCard icon={Bug} label="Open Bug Reports" value={openBugs} sub={criticalBugs + ' critical'} iconBg="bg-red-50" iconColor="text-red-500" alert={criticalBugs > 0} />
                <MetricCard icon={AlertTriangle} label="At-Risk Orgs" value={metrics.atRiskCount} sub="14+ days, no plan" iconBg="bg-yellow-50" iconColor="text-yellow-600" alert={metrics.atRiskCount > 0} />
              </>
            ) : null}
        </div>
      </section>
      <section className="mb-10" aria-label="Revenue by plan">
        <SectionLabel>Revenue by Plan</SectionLabel>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? <div className="p-6">{[1,2,3].map(function(i) { return <div key={i} className="mb-3"><RowSkeleton /></div>; })}</div>
            : planBreakdown.length === 0 ? <EmptyState title="No paid subscriptions yet" description="Revenue breakdown appears once orgs start paying." />
            : (
              <table className="w-full" role="table" aria-label="Plan revenue breakdown">
                <thead><tr className="bg-slate-50 border-b border-slate-100">{['Plan', 'Orgs', 'MRR'].map(function(h) { return <th key={h} className="text-left px-6 py-3" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731' }} scope="col">{h}</th>; })}</tr></thead>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <section aria-label="At-risk organizations">
          <SectionLabel>At-Risk Orgs</SectionLabel>
          <div className="bg-white border border-yellow-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-yellow-50"><AlertTriangle size={13} className="text-yellow-600" aria-hidden="true" /><span style={{ fontSize: '12px', color: '#92400E' }}>14+ days since signup — no plan</span></div>
            <div className="divide-y divide-slate-100">
              {loading ? [1,2,3].map(function(i) { return <div key={i} className="px-5 py-3"><RowSkeleton /></div>; })
                : atRiskOrgs.length === 0 ? <div className="px-5 py-8 text-center"><CheckCircle size={26} className="text-green-500 mx-auto mb-2" aria-hidden="true" /><p style={{ fontWeight: 600, fontSize: '14px', color: '#0E1523' }}>No at-risk orgs</p></div>
                : atRiskOrgs.map(function(org) {
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
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50"><Clock size={13} className="text-slate-400" aria-hidden="true" /><span style={{ fontSize: '12px', color: '#64748B' }}>Most recently created orgs</span></div>
            <div className="divide-y divide-slate-100">
              {loading ? [1,2,3].map(function(i) { return <div key={i} className="px-5 py-3"><RowSkeleton /></div>; })
                : recentOrgs.length === 0 ? <EmptyState title="No organizations yet" description="New orgs will appear here." />
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
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function StaffDashboard() {
  var navigate = useNavigate();
  var [staffMember, setStaffMember] = useState(null);
  var [authChecked, setAuthChecked] = useState(false);
  var [activeTab, setActiveTab] = useState('overview');
  var [pendingVerifCount, setPendingVerifCount] = useState(0);
  var [unreadContactCount, setUnreadContactCount] = useState(0);

  var TABS = [
    { key: 'overview',      label: 'Overview',      icon: BarChart2 },
    { key: 'members',       label: 'Members',        icon: Users },
    { key: 'orgs',          label: 'Organizations',  icon: Building2 },
    { key: 'verifications', label: 'Verifications',  icon: ShieldCheck, badgeKey: 'verif' },
    { key: 'financials',    label: 'Financials',     icon: Receipt },
    { key: 'promo_codes',   label: 'Promo Codes',    icon: Tag },
    { key: 'goals',         label: 'Goals',          icon: TrendingUp },
    { key: 'contacts',      label: 'Contacts',       icon: Mail, badgeKey: 'contacts' },
    { key: 'manage_tags',   label: 'Manage Tags',    icon: TagIcon },
    { key: 'bug_reports',   label: 'Bug Reports',    icon: Bug },
    { key: 'content',       label: 'Content',        icon: FileText },
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

  useEffect(function() {
    if (!authChecked) return;
    loadBadgeCounts();
    var channel = supabase.channel('staff-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nonprofit_verifications' }, loadBadgeCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_contacts' }, loadBadgeCounts)
      .subscribe();
    return function() { supabase.removeChannel(channel); };
  }, [authChecked]);

  async function loadBadgeCounts() {
    var verifRes = await supabase.from('nonprofit_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    var contactRes = await supabase.from('marketing_contacts').select('id', { count: 'exact', head: true }).eq('is_read', false);
    setPendingVerifCount(verifRes.count || 0);
    setUnreadContactCount(contactRes.count || 0);
  }

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
      <nav className="bg-white border-b border-slate-200 px-6" aria-label="Staff dashboard sections" role="tablist">
        <div className="max-w-[1600px] mx-auto flex overflow-x-auto">
          {TABS.map(function(tab) {
            var Icon = tab.icon;
            var isActive = activeTab === tab.key;
            var badgeCount = tab.badgeKey === 'verif' ? pendingVerifCount : tab.badgeKey === 'contacts' ? unreadContactCount : 0;
            return (
              <button key={tab.key} role="tab" aria-selected={isActive} onClick={function() { setActiveTab(tab.key); }} className={'relative flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset whitespace-nowrap ' + (isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300')}>
                <Icon size={15} aria-hidden="true" />
                {tab.label}
                {badgeCount > 0 && (
                  <span className={'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ' + (isActive ? 'bg-blue-500 text-white' : 'bg-red-500 text-white')} aria-label={badgeCount + ' pending'}>{badgeCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
      <main className="max-w-[1600px] mx-auto px-6 py-8" role="main">
        {activeTab === 'overview'      && <OverviewTab pendingVerifCount={pendingVerifCount} />}
        {activeTab === 'members'       && <MembersTab />}
        {activeTab === 'orgs'          && <OrgsTab />}
        {activeTab === 'verifications' && <VerificationsTab onCountChange={loadBadgeCounts} />}
        {activeTab === 'financials'    && <StaffFinancials staffUserId={staffMember && staffMember.user_id} />}
        {activeTab === 'promo_codes'   && <StaffPromoCodes />}
        {activeTab === 'goals'         && <StaffGoals />}
        {activeTab === 'contacts'      && <ContactsTab />}
        {activeTab === 'manage_tags'   && <ManageTagsTab />}
        {activeTab === 'bug_reports'   && <BugReportsTab />}
        {activeTab === 'content'       && <ContentEditor staffUserId={staffMember && staffMember.user_id} />}
      </main>
    </div>
  );
}