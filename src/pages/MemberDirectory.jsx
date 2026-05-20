import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MemberCard from '../components/MemberCard';
import usePlanLimits from '../hooks/usePlanLimits';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// ── Light theme tokens ────────────────────────────────────────────────────────
var BG      = '#F8FAFC';
var CARD    = '#FFFFFF';
var BDR     = '#E2E8F0';
var ELEVATED = '#F1F5F9';
var TEXT    = '#0E1523';
var TEXT2   = '#475569';
var MUTED   = '#64748B';

// ── Helpers ───────────────────────────────────────────────────────────────────
var UNIT_OPTIONS = [
  { label: 'Days',   value: 'days'   },
  { label: 'Weeks',  value: 'weeks'  },
  { label: 'Months', value: 'months' },
  { label: 'Years',  value: 'years'  },
];

var QUICK_PICKS = [
  { label: '1 Month',  months: 1  },
  { label: '3 Months', months: 3  },
  { label: '6 Months', months: 6  },
  { label: '1 Year',   months: 12 },
];

var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';

function unitToMonths(value, unit) {
  var n = parseInt(value, 10) || 0;
  if (unit === 'days')   return Math.max(1, Math.round(n / 30.4375));
  if (unit === 'weeks')  return Math.max(1, Math.round(n / 4.345));
  if (unit === 'months') return n;
  if (unit === 'years')  return n * 12;
  return n;
}

function addMonthsToDate(date, months) {
  var d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getDuesStatus(membership) {
  if (!membership.dues_paid) return 'unpaid';
  if (membership.dues_paid_until) {
    if (new Date(membership.dues_paid_until) < new Date()) return 'expired';
  }
  return 'paid';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="border rounded-xl p-4 animate-pulse bg-white border-slate-200">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full flex-shrink-0 bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded-full bg-slate-100" />
          <div className="h-3 w-40 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-16 rounded-lg flex-shrink-0 bg-slate-100" />
      </div>
      <div className="mt-3 h-8 rounded-lg border bg-slate-100 border-slate-100" />
    </div>
  );
}

// ── Mark Paid Modal ───────────────────────────────────────────────────────────
function MarkPaidModal({ member, tiers, onConfirm, onClose }) {
  var [selectedTierId, setSelectedTierId] = useState(member.tier_id || null);
  var [customValue, setCustomValue]       = useState('12');
  var [customUnit, setCustomUnit]         = useState('months');
  var [useCustom, setUseCustom]           = useState(false);
  var [quickMonths, setQuickMonths]       = useState(12);

  var selectedTier = tiers.find(function(t) { return t.id === selectedTierId; }) || null;

  function selectTier(tier) {
    setSelectedTierId(tier.id);
    setQuickMonths(tier.duration_months || 12);
    setUseCustom(false);
  }

  function clearTier() { setSelectedTierId(null); }

  var activeMonths = useCustom ? unitToMonths(customValue, customUnit) : quickMonths;
  var until = addMonthsToDate(new Date(), activeMonths);
  var untilStr = until.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  var previewAmount = selectedTier && selectedTier.dues_amount != null ? selectedTier.dues_amount : null;

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="mark-paid-title">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
        <h2 id="mark-paid-title" className="text-lg font-bold text-gray-900 mb-1">Mark Dues Paid</h2>
        <p className="text-sm text-slate-500 mb-5">
          {'For '}
          <strong className="text-slate-700">{member.displayName}</strong>
        </p>

        {tiers.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Membership Tier <span className="font-normal normal-case text-slate-400">(optional)</span>
            </p>
            <div className="space-y-1.5">
              {tiers.map(function(tier) {
                var isSelected = selectedTierId === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={function() { isSelected ? clearTier() : selectTier(tier); }}
                    className={'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')}
                    aria-pressed={isSelected}
                  >
                    <span className={'font-medium ' + (isSelected ? 'text-blue-700' : 'text-slate-700')}>{tier.name}</span>
                    <span className="text-xs text-slate-400">
                      {tier.dues_amount != null ? '$' + Number(tier.dues_amount).toFixed(2) + ' · ' : ''}
                      {tier.duration_months + ' mo'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Duration</p>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {QUICK_PICKS.map(function(pick) {
              var isActive = !useCustom && quickMonths === pick.months;
              return (
                <button
                  key={pick.months}
                  onClick={function() { setQuickMonths(pick.months); setUseCustom(false); }}
                  className={'px-2 py-2 rounded-lg border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50')}
                  aria-pressed={isActive}
                >
                  {pick.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={function() { setUseCustom(!useCustom); }}
            className={'w-full px-3 py-2 rounded-lg border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (useCustom ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50')}
            aria-expanded={useCustom}
          >
            {useCustom ? 'Custom duration' : '+ Custom duration'}
          </button>
          {useCustom && (
            <div className="mt-2 flex gap-2">
              <input
                type="number" min="1" value={customValue}
                onChange={function(e) { setCustomValue(e.target.value); }}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Custom duration amount"
              />
              <select
                value={customUnit}
                onChange={function(e) { setCustomUnit(e.target.value); }}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Custom duration unit"
              >
                {UNIT_OPTIONS.map(function(u) { return <option key={u.value} value={u.value}>{u.label}</option>; })}
              </select>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Paid through</span>
            <span className="text-sm font-semibold text-slate-800">{untilStr}</span>
          </div>
          {previewAmount != null && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500">Amount</span>
              <span className="text-sm font-semibold text-slate-800">{'$' + Number(previewAmount).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={function() { onConfirm({ months: activeMonths, tierId: selectedTierId, amount: previewAmount }); }}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
          >
            Confirm Paid
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dues Row ──────────────────────────────────────────────────────────────────
function DuesRow({ membership, tiers, isAdmin, onMarkPaid, onMarkUnpaid, toggling, onSendPaymentLink, sendingPaymentLink, canSendPaymentLink }) {
  var status   = getDuesStatus(membership);
  var until    = membership.dues_paid_until ? new Date(membership.dues_paid_until) : null;
  var untilStr = until ? until.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  var amount   = membership.dues_amount;
  var tier     = tiers.find(function(t) { return t.id === membership.tier_id; }) || null;

  var rowBg = status === 'paid'
    ? 'bg-green-50 border-green-100'
    : status === 'expired'
      ? 'bg-orange-50 border-orange-100'
      : 'bg-yellow-50 border-yellow-100';

  return (
    <div className={'flex items-center justify-between px-4 py-2 border-t flex-wrap gap-2 ' + rowBg}>
      <div className="flex items-center gap-2 flex-wrap">
        {status === 'paid' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Paid</span>
        )}
        {status === 'expired' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Expired</span>
        )}
        {status === 'unpaid' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Unpaid</span>
        )}
        {tier && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{tier.name}</span>
        )}
        <span className="text-xs text-slate-400">
          {amount ? '$' + Number(amount).toFixed(2) : ''}
          {untilStr && status === 'paid'    ? (amount ? ' · ' : '') + 'Through ' + untilStr : ''}
          {untilStr && status === 'expired' ? (amount ? ' · ' : '') + 'Expired ' + untilStr : ''}
        </span>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2">
          {status !== 'paid' && canSendPaymentLink && (
            <button
              onClick={onSendPaymentLink}
              disabled={sendingPaymentLink || toggling}
              className="text-xs font-medium px-2 py-0.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
              aria-label={'Send payment link to ' + membership.displayName}
            >
              {sendingPaymentLink ? 'Sending...' : 'Send Pay Link'}
            </button>
          )}
          {status !== 'paid' ? (
            <button
              onClick={onMarkPaid}
              disabled={toggling}
              className="text-xs font-medium px-2 py-0.5 rounded border border-green-400 text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 transition-colors disabled:opacity-50"
              aria-label={membership.displayName + ': mark as paid'}
            >
              {toggling ? 'Saving...' : 'Mark Paid'}
            </button>
          ) : (
            <button
              onClick={onMarkUnpaid}
              disabled={toggling}
              className="text-xs font-medium px-2 py-0.5 rounded border border-slate-300 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 transition-colors disabled:opacity-50"
              aria-label={membership.displayName + ': mark as unpaid'}
            >
              {toggling ? 'Saving...' : 'Mark Unpaid'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Role Row ──────────────────────────────────────────────────────────────────
function RoleRow({ member, adminAtCap, editorAtCap, onRoleChange, changingRoleId }) {
  var isChanging = changingRoleId === member.user_id;
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-100 bg-slate-50">
      <label htmlFor={'role-' + member.user_id} className="text-xs font-medium text-slate-500">
        Role:
      </label>
      <select
        id={'role-' + member.user_id}
        value={member.role}
        disabled={isChanging}
        onChange={function(e) { onRoleChange(member, e.target.value); }}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        aria-label={'Change role for ' + member.displayName}
      >
        <option value="member">Member</option>
        <option value="editor" disabled={editorAtCap && member.role !== 'editor'}>
          {'Editor' + (editorAtCap && member.role !== 'editor' ? ' (limit reached)' : '')}
        </option>
        <option value="admin" disabled={adminAtCap && member.role !== 'admin'}>
          {'Administrator' + (adminAtCap && member.role !== 'admin' ? ' (limit reached)' : '')}
        </option>
        <option value="guest">Guest</option>
      </select>
      {isChanging && <span className="text-xs text-slate-400">Saving...</span>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function MemberDirectory() {
  var params         = useParams();
  var organizationId = params.organizationId;
  var outletContext  = useOutletContext();

  var [members, setMembers]                         = useState([]);
  var [filteredMembers, setFilteredMembers]         = useState([]);
  var [orgTags, setOrgTags]                         = useState([]);
  var [tiers, setTiers]                             = useState([]);
  var [allGroups, setAllGroups]                     = useState([]);
  var [loading, setLoading]                         = useState(true);
  var [error, setError]                             = useState(null);
  var isAdmin                                       = outletContext ? outletContext.isAdmin : false;
  var [currentUserId, setCurrentUserId]             = useState(null);
  var [currentUserRole, setCurrentUserRole]         = useState(null);
  var [organizationName, setOrganizationName]       = useState('');
  var [collectDues, setCollectDues]                 = useState(true);
  var [togglingId, setTogglingId]                   = useState(null);
  var [changingRoleId, setChangingRoleId]           = useState(null);
  var [sendingReminder, setSendingReminder]         = useState(false);
  var [markPaidTarget, setMarkPaidTarget]           = useState(null);
  var [stripeConnectStatus, setStripeConnectStatus] = useState('not_connected');
  var [manualPaymentInstructions, setManualPaymentInstructions] = useState('');
  var [sendingPaymentLinkId, setSendingPaymentLinkId] = useState(null);
  var [manualInstructionsTarget, setManualInstructionsTarget]   = useState(null);

  var [searchQuery, setSearchQuery] = useState('');
  var [roleFilter, setRoleFilter]   = useState('all');
  var [tagFilter, setTagFilter]     = useState('all');
  var [duesFilter, setDuesFilter]   = useState('all');

  var { limits }     = usePlanLimits(organizationId);
  var memberLimit    = limits ? limits.members : null;
  var memberCount    = members.length;
  var memberPercent  = memberLimit ? Math.min(Math.round((memberCount / memberLimit) * 100), 100) : 0;
  var isOverLimit    = memberLimit !== null && memberCount > memberLimit;
  var overageCount   = isOverLimit ? memberCount - memberLimit : 0;

  var adminCount  = members.filter(function(m) { return m.role === 'admin'; }).length;
  var editorCount = members.filter(function(m) { return m.role === 'editor'; }).length;
  var adminLimit  = limits ? limits.admin_limit : null;
  var editorLimit = limits ? limits.editor_limit : null;
  var adminAtCap  = adminLimit !== null && adminCount >= adminLimit;
  var editorAtCap = editorLimit !== null && editorCount >= editorLimit;

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  useEffect(function() {
    applyFilters();
  }, [searchQuery, roleFilter, tagFilter, duesFilter, members]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;
      setCurrentUserId(user ? user.id : null);

      var [orgResult, membersResult, tagsResult, tiersResult, groupsResult, groupMembersResult, privacyResult] = await Promise.all([
        supabase.from('organizations').select('id, name, contact_email, collect_dues, stripe_connect_status, manual_payment_instructions').eq('id', organizationId).single(),
        supabase.from('memberships').select('id, role, member_id, tier_id, dues_paid, dues_paid_at, dues_paid_until, dues_amount, show_affiliations, members(user_id, first_name, last_name, display_name, email, bio, pronouns, interests, profile_photo_url, avatar_url, city, state, phone, location_visibility, phone_visibility, email_visibility)').eq('organization_id', organizationId).eq('status', 'active').order('members(last_name)', { ascending: true }),
        supabase.from('member_tags').select('id, name, color').eq('organization_id', organizationId).order('name'),
        supabase.from('membership_tiers').select('*').eq('organization_id', organizationId).order('name'),
        supabase.from('org_groups').select('id, name, color').eq('organization_id', organizationId).eq('is_active', true).order('sort_order'),
        supabase.from('org_group_members').select('group_id, member_id').eq('organization_id', organizationId),
        supabase.from('member_privacy').select('user_id, show_pronouns').eq('organization_id', organizationId),
      ]);

      if (orgResult.error) throw orgResult.error;
      if (membersResult.error) throw membersResult.error;

      setOrganizationName(orgResult.data.name);
      setCollectDues(orgResult.data.collect_dues !== false);
      setStripeConnectStatus(orgResult.data.stripe_connect_status || 'not_connected');
      setManualPaymentInstructions(orgResult.data.manual_payment_instructions || '');
      setOrgTags(tagsResult.data || []);
      setTiers(tiersResult.data || []);

      var groups       = groupsResult.data || [];
      var groupMembers = groupMembersResult.data || [];
      setAllGroups(groups);

      // Build show_pronouns map: user_id → boolean
      var pronounsMap = {};
      (privacyResult.data || []).forEach(function(p) { pronounsMap[p.user_id] = p.show_pronouns || false; });

      var assignmentsResult = await supabase
        .from('member_tag_assignments')
        .select('member_id, tag_id')
        .eq('organization_id', organizationId);
      var assignments = assignmentsResult.data || [];

      var membersList = (membersResult.data || [])
        .filter(function(item) { return item.members !== null; })
        .map(function(item) {
          var tagIds = assignments
            .filter(function(a) { return a.member_id === item.members.user_id; })
            .map(function(a) { return a.tag_id; });
          var memberGroupObjects = groups.filter(function(g) {
            return groupMembers.some(function(gm) {
              return gm.group_id === g.id && gm.member_id === item.members.user_id;
            });
          });
          var displayName = item.members.display_name || ((item.members.first_name || '') + ' ' + (item.members.last_name || '')).trim();
          return Object.assign({}, item.members, {
            role: item.role,
            tagIds: tagIds,
            membership_id: item.id,
            tier_id: item.tier_id || null,
            dues_paid: item.dues_paid || false,
            dues_paid_at: item.dues_paid_at || null,
            dues_paid_until: item.dues_paid_until || null,
            dues_amount: item.dues_amount || null,
            show_affiliations: item.show_affiliations || false,
            show_pronouns: pronounsMap[item.members.user_id] || false,
            interests: item.members.interests || [],
            groups: memberGroupObjects,
            affiliations: [],
            displayName: displayName,
          });
        });

      // Set current viewer's role for editor-level access checks
      var currentMember = membersList.find(function(m) { return user && m.user_id === user.id; });
      setCurrentUserRole(currentMember ? currentMember.role : null);

      // Fetch affiliations (with joined_year) for members who opted in
      var visibleUserIds = membersList
        .filter(function(m) { return m.show_affiliations; })
        .map(function(m) { return m.user_id; });

      if (visibleUserIds.length > 0) {
        var affResult = await supabase
          .from('member_affiliations')
          .select('id, user_id, org_name, role_title, joined_year')
          .in('user_id', visibleUserIds);
        if (!affResult.error) {
          var affMap = {};
          (affResult.data || []).forEach(function(aff) {
            if (!affMap[aff.user_id]) affMap[aff.user_id] = [];
            affMap[aff.user_id].push(aff);
          });
          membersList = membersList.map(function(m) {
            return Object.assign({}, m, { affiliations: affMap[m.user_id] || [] });
          });
        }
      }

      setMembers(membersList);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err.message);
      mascotErrorToast('Failed to load members.', err.message);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    var result = members.slice();
    if (roleFilter !== 'all') {
      result = result.filter(function(m) { return m.role === roleFilter; });
    }
    if (tagFilter !== 'all') {
      result = result.filter(function(m) { return m.tagIds && m.tagIds.includes(tagFilter); });
    }
    if (duesFilter === 'paid') {
      result = result.filter(function(m) { return getDuesStatus(m) === 'paid'; });
    } else if (duesFilter === 'unpaid') {
      result = result.filter(function(m) { return getDuesStatus(m) !== 'paid'; });
    }
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      result = result.filter(function(m) {
        var fullName = ((m.first_name || '') + ' ' + (m.last_name || '')).toLowerCase();
        var display  = (m.display_name || '').toLowerCase();
        var email    = (m.email || '').toLowerCase();
        var city     = (m.city || '').toLowerCase();
        return fullName.includes(q) || display.includes(q) || email.includes(q) || city.includes(q);
      });
    }
    setFilteredMembers(result);
  }

  async function handleRoleChange(member, newRole) {
    if (newRole === 'admin' && adminAtCap && member.role !== 'admin') {
      toast.error('Admin limit reached for your plan. Upgrade to add more admins.');
      return;
    }
    if (newRole === 'editor' && editorAtCap && member.role !== 'editor') {
      toast.error('Editor limit reached for your plan. Upgrade to add more editors.');
      return;
    }
    setChangingRoleId(member.user_id);
    try {
      var result = await supabase.from('memberships').update({ role: newRole }).eq('id', member.membership_id);
      if (result.error) throw result.error;
      setMembers(function(prev) {
        return prev.map(function(m) {
          return m.user_id === member.user_id ? Object.assign({}, m, { role: newRole }) : m;
        });
      });
      mascotSuccessToast('Role updated for ' + member.displayName + '.');
    } catch (err) {
      console.error('Role change error:', err);
      mascotErrorToast('Failed to update role.', err.message);
    } finally {
      setChangingRoleId(null);
    }
  }

  async function handleConfirmMarkPaid(membership, opts) {
    setMarkPaidTarget(null);
    setTogglingId(membership.user_id);
    try {
      var now    = new Date();
      var until  = addMonthsToDate(now, opts.months);
      var updateData = {
        dues_paid: true,
        dues_paid_at: now.toISOString(),
        dues_paid_until: until.toISOString(),
      };
      if (opts.tierId !== undefined) updateData.tier_id = opts.tierId;
      if (opts.amount != null) updateData.dues_amount = opts.amount;

      var result = await supabase.from('memberships').update(updateData).eq('id', membership.membership_id);
      if (result.error) throw result.error;

      setMembers(function(prev) {
        return prev.map(function(m) {
          if (m.user_id === membership.user_id) {
            return Object.assign({}, m, {
              dues_paid: true,
              dues_paid_at: now.toISOString(),
              dues_paid_until: until.toISOString(),
              tier_id: opts.tierId !== undefined ? opts.tierId : m.tier_id,
              dues_amount: opts.amount != null ? opts.amount : m.dues_amount,
            });
          }
          return m;
        });
      });
      mascotSuccessToast(membership.displayName + ' marked as paid through ' + until.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) + '.');
    } catch (err) {
      console.error('Mark paid error:', err);
      mascotErrorToast('Failed to update dues status.', err.message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleMarkUnpaid(membership) {
    setTogglingId(membership.user_id);
    try {
      var result = await supabase.from('memberships').update({ dues_paid: false, dues_paid_at: null, dues_paid_until: null }).eq('id', membership.membership_id);
      if (result.error) throw result.error;
      setMembers(function(prev) {
        return prev.map(function(m) {
          if (m.user_id === membership.user_id) {
            return Object.assign({}, m, { dues_paid: false, dues_paid_at: null, dues_paid_until: null });
          }
          return m;
        });
      });
      mascotSuccessToast(membership.displayName + ' marked as unpaid.');
    } catch (err) {
      console.error('Mark unpaid error:', err);
      mascotErrorToast('Failed to update dues status.', err.message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSendPaymentLink(member) {
    if (!member.email) {
      toast.error('This member has no email address on file.');
      return;
    }
    var tier   = tiers.find(function(t) { return t.id === member.tier_id; }) || null;
    var amount = (tier && tier.dues_amount != null) ? tier.dues_amount : (member.dues_amount || 0);
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('No dues amount set. Assign a tier with a dues amount first.');
      return;
    }
    setSendingPaymentLinkId(member.user_id);
    try {
      var sessionResult = await supabase.auth.getSession();
      var token = sessionResult.data.session ? sessionResult.data.session.access_token : '';

      var sessionRes = await fetch(SUPABASE_URL + '/functions/v1/create-dues-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          organization_id: organizationId,
          member_id: member.user_id,
          tier_id: member.tier_id || null,
          amount: amount,
          member_name: member.displayName,
          member_email: member.email,
        }),
      });
      var sessionData = await sessionRes.json();
      if (!sessionRes.ok || !sessionData.url) {
        throw new Error(sessionData.error || 'Failed to generate payment link.');
      }

      var emailRes = await fetch(SUPABASE_URL + '/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          type: 'dues_payment_link',
          data: {
            memberEmail: member.email,
            memberName: member.displayName,
            orgName: organizationName,
            amount: amount,
            paymentUrl: sessionData.url,
          },
        }),
      });
      if (emailRes.ok) {
        mascotSuccessToast('Payment link sent!', 'Email sent to ' + member.displayName + '.');
      } else {
        await navigator.clipboard.writeText(sessionData.url).catch(function() {});
        mascotSuccessToast('Link copied!', 'Email failed — link copied to clipboard.');
      }
    } catch (err) {
      console.error('Send payment link error:', err);
      mascotErrorToast('Failed to send payment link.', err.message);
    } finally {
      setSendingPaymentLinkId(null);
    }
  }

  // Send dues reminders — uses send-blast with a targeted audience
  async function handleSendReminders() {
    var unpaid = members.filter(function(m) { return getDuesStatus(m) !== 'paid' && m.email; });
    if (unpaid.length === 0) {
      toast.error('No unpaid members with email addresses found.');
      return;
    }

    var loadingId = toast.loading('Sending ' + unpaid.length + ' reminder' + (unpaid.length !== 1 ? 's' : '') + '...');
    setSendingReminder(true);

    try {
      var sessionResult = await supabase.auth.getSession();
      var token = sessionResult.data.session ? sessionResult.data.session.access_token : '';

      // Build individual audience entries for each unpaid member
      var audiences = unpaid.map(function(m) {
        return { type: 'individual', member_id: m.user_id, label: m.displayName };
      });

      var subject = 'Your dues for ' + organizationName + ' are outstanding';
      var body = '<p>Hi {{first_name}},</p><p>This is a friendly reminder that your membership dues for <strong>' + organizationName + '</strong> are outstanding.</p><p>Please reach out to your organization admin if you have questions.</p>';

      var res = await fetch(SUPABASE_URL + '/functions/v1/send-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          organization_id: organizationId,
          subject: subject,
          html_body: body,
          audiences: audiences,
        }),
      });

      toast.dismiss(loadingId);

      if (!res.ok) {
        var errData = await res.json().catch(function() { return {}; });
        throw new Error(errData.error || 'Server returned ' + res.status);
      }

      var data = await res.json();
      var sent = data.sent || unpaid.length;
      mascotSuccessToast('Reminders sent!', sent + ' ' + (sent === 1 ? 'member' : 'members') + ' notified.');
    } catch (err) {
      toast.dismiss(loadingId);
      console.error('Send reminder error:', err);
      mascotErrorToast('Failed to send reminders.', err.message);
    } finally {
      setSendingReminder(false);
    }
  }

  function handleClearFilters() {
    setSearchQuery('');
    setRoleFilter('all');
    setTagFilter('all');
    setDuesFilter('all');
  }

  var hasFilters  = searchQuery || roleFilter !== 'all' || tagFilter !== 'all' || duesFilter !== 'all';
  var unpaidCount = members.filter(function(m) { return getDuesStatus(m) !== 'paid'; }).length;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: BG }} className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
            <div className="h-7 w-32 rounded mb-2 bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-100" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse space-y-3">
            <div className="h-10 rounded-lg bg-slate-100" />
            <div className="grid grid-cols-4 gap-3">
              {[1,2,3,4].map(function(i) { return <div key={i} className="h-10 rounded-lg bg-slate-100" />; })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(function(i) { return <CardSkeleton key={i} />; })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ background: BG }} className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>Failed to Load Members</h3>
          <p className="text-sm mb-6" style={{ color: MUTED }}>{error}</p>
          <button
            onClick={function() { setError(null); loadData(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={{ background: BG }} className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Members</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            {filteredMembers.length + ' ' + (filteredMembers.length === 1 ? 'member' : 'members')}
            {searchQuery ? ' matching "' + searchQuery + '"' : ''}
            {isAdmin && duesFilter !== 'all' ? ' · dues: ' + duesFilter : ''}
          </p>
        </div>

        {/* Filters card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">

          {/* Member count progress bar */}
          {isAdmin && memberLimit !== null && (
            <div
              className={'flex items-center gap-3 p-3 border rounded-lg ' + (isOverLimit || memberPercent >= 90 ? 'bg-red-50 border-red-200' : memberPercent >= 80 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100')}
              role="status"
              aria-label={'Member usage: ' + memberCount + ' of ' + memberLimit}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={'text-xs font-semibold ' + (isOverLimit || memberPercent >= 90 ? 'text-red-600' : memberPercent >= 80 ? 'text-amber-600' : 'text-blue-700')}>
                    {memberCount + ' / ' + memberLimit + ' members'}
                    {isOverLimit ? (' — ' + overageCount + ' over limit') : ''}
                  </span>
                  <span className={'text-xs ' + (isOverLimit || memberPercent >= 90 ? 'text-red-500' : memberPercent >= 80 ? 'text-amber-500' : 'text-blue-500')}>
                    {memberPercent + '%'}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5 bg-slate-200" role="progressbar" aria-valuenow={memberPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={'h-1.5 rounded-full transition-all ' + (isOverLimit || memberPercent >= 90 ? 'bg-red-500' : memberPercent >= 80 ? 'bg-amber-500' : 'bg-blue-500')}
                    style={{ width: memberPercent + '%' }}
                  />
                </div>
              </div>
              {isOverLimit && (
                <a
                  href={'/organizations/' + organizationId + '/billing'}
                  className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                  aria-label="Upgrade plan to add more members"
                >
                  Upgrade
                </a>
              )}
            </div>
          )}

          {/* Overage alert */}
          {isAdmin && isOverLimit && (
            <div
              className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-red-50 border-red-200"
              role="alert"
            >
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {'You have ' + overageCount + ' ' + (overageCount === 1 ? 'member' : 'members') + ' over your plan limit of ' + memberLimit + '.'}
                </p>
                <p className="text-xs mt-0.5 text-red-600">
                  {'You are being charged $' + overageCount + '/mo in overage fees. Upgrade to include them in your plan.'}
                </p>
              </div>
              <a
                href={'/organizations/' + organizationId + '/billing'}
                className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
              >
                Upgrade
              </a>
            </div>
          )}

          {/* Role cap indicators */}
          {isAdmin && (adminLimit !== null || editorLimit !== null) && (
            <div className="flex items-center gap-2 flex-wrap">
              {adminLimit !== null && (
                <span
                  className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ' + (adminAtCap ? 'bg-red-50 border-red-200 text-red-700' : 'bg-purple-50 border-purple-200 text-purple-700')}
                  aria-label={'Admin role usage: ' + adminCount + ' of ' + adminLimit}
                >
                  {adminCount + ' / ' + adminLimit + ' admins'}
                  {adminAtCap && <span className="ml-0.5 font-bold">· at limit</span>}
                </span>
              )}
              {editorLimit !== null && (
                <span
                  className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ' + (editorAtCap ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-100 text-blue-700')}
                  aria-label={'Editor role usage: ' + editorCount + ' of ' + editorLimit}
                >
                  {editorCount + ' / ' + editorLimit + ' editors'}
                  {editorAtCap && <span className="ml-0.5 font-bold">· at limit</span>}
                </span>
              )}
            </div>
          )}

          {/* Dues reminder banner */}
          {isAdmin && collectDues && unpaidCount > 0 && (
            <div
              className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 border-yellow-200"
              role="region"
              aria-label="Dues reminder"
            >
              <span className="text-sm font-medium text-yellow-800">
                {unpaidCount + ' ' + (unpaidCount === 1 ? 'member has' : 'members have') + ' outstanding dues'}
              </span>
              <button
                onClick={handleSendReminders}
                disabled={sendingReminder}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                aria-label={'Send dues reminder to ' + unpaidCount + ' unpaid members'}
              >
                {sendingReminder ? 'Sending...' : 'Send Reminder'}
              </button>
            </div>
          )}

          {/* Filters */}
          <div className={'grid grid-cols-1 gap-3 ' + (isAdmin ? (collectDues ? 'md:grid-cols-4' : 'md:grid-cols-3') : '')}>
            <div>
              <label htmlFor="member-search" className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">
                Search
              </label>
              <input
                id="member-search"
                type="text"
                placeholder="Name, email, location..."
                value={searchQuery}
                onChange={function(e) { setSearchQuery(e.target.value); }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isAdmin && (
              <div>
                <label htmlFor="role-filter" className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">Role</label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={function(e) { setRoleFilter(e.target.value); }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="editor">Editors</option>
                  <option value="member">Members</option>
                  <option value="guest">Guests</option>
                </select>
              </div>
            )}

            {isAdmin && (
              <div>
                <label htmlFor="tag-filter" className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">Tag</label>
                <select
                  id="tag-filter"
                  value={tagFilter}
                  onChange={function(e) { setTagFilter(e.target.value); }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={orgTags.length === 0}
                >
                  <option value="all">All Tags</option>
                  {orgTags.map(function(tag) { return <option key={tag.id} value={tag.id}>{tag.name}</option>; })}
                </select>
              </div>
            )}

            {isAdmin && collectDues && (
              <div>
                <label htmlFor="dues-filter" className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-slate-500">Dues Status</label>
                <select
                  id="dues-filter"
                  value={duesFilter}
                  onChange={function(e) { setDuesFilter(e.target.value); }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Members</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid / Expired</option>
                </select>
              </div>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Member grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-slate-200 bg-white">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.356-3.765M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a4 4 0 015.356-3.765M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>No Members Found</h3>
            <p className="text-sm mb-6" style={{ color: MUTED }}>
              {hasFilters ? 'No members match your current filters.' : 'This organization has no members yet.'}
            </p>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 border border-slate-300 font-semibold rounded-lg text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
              role="list"
              aria-label="Organization members"
            >
              {filteredMembers.map(function(member) {
                var showDuesRow = collectDues && isAdmin;
                var showRoleRow = isAdmin && member.user_id !== currentUserId;
                var isAdminOrEditor = isAdmin || currentUserRole === 'editor';
                return (
                  <div key={member.user_id} role="listitem" className="flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                    <MemberCard
                      member={member}
                      role={member.role}
                      organizationId={organizationId}
                      isAdmin={isAdmin}
                      isAdminOrEditor={isAdminOrEditor}
                      allGroups={allGroups}
                    />
                    {showRoleRow && (
                      <RoleRow
                        member={member}
                        adminAtCap={adminAtCap}
                        editorAtCap={editorAtCap}
                        onRoleChange={handleRoleChange}
                        changingRoleId={changingRoleId}
                      />
                    )}
                    {showDuesRow && (
                      <DuesRow
                        membership={member}
                        tiers={tiers}
                        isAdmin={isAdmin}
                        onMarkPaid={function() { setMarkPaidTarget(member); }}
                        onMarkUnpaid={function() { handleMarkUnpaid(member); }}
                        toggling={togglingId === member.user_id}
                        onSendPaymentLink={function() {
                          if (stripeConnectStatus === 'active') {
                            handleSendPaymentLink(member);
                          } else {
                            setManualInstructionsTarget(member);
                          }
                        }}
                        sendingPaymentLink={sendingPaymentLinkId === member.user_id}
                        canSendPaymentLink={!!(limits && limits.can_collect_dues)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs pb-4" style={{ color: MUTED }}>
              {'Showing ' + filteredMembers.length + ' of ' + members.length + ' member' + (members.length !== 1 ? 's' : '')}
            </p>
          </>
        )}

      </div>

      {/* Manual payment instructions modal */}
      {manualInstructionsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="manual-pay-title">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={function() { setManualInstructionsTarget(null); }} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 id="manual-pay-title" className="text-lg font-bold text-slate-900 mb-1">Payment Instructions</h2>
            <p className="text-sm text-slate-500 mb-4">{'Share these instructions with ' + manualInstructionsTarget.displayName + '.'}</p>
            {manualPaymentInstructions ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{manualPaymentInstructions}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-5">No manual payment instructions have been set. Add them in Organization Settings under Payments.</p>
            )}
            <button
              onClick={function() { setManualInstructionsTarget(null); }}
              className="w-full px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Mark Paid modal */}
      {markPaidTarget && (
        <MarkPaidModal
          member={markPaidTarget}
          tiers={tiers}
          onConfirm={function(opts) { handleConfirmMarkPaid(markPaidTarget, opts); }}
          onClose={function() { setMarkPaidTarget(null); }}
        />
      )}
    </main>
  );
}

export default MemberDirectory;