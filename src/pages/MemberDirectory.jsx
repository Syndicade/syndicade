import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import MemberCard from '../components/MemberCard';
import usePlanLimits from '../hooks/usePlanLimits';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';

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

function CardSkeleton({ isDark }) {
  var shimmer = isDark ? 'bg-[#2A3550]' : 'bg-gray-200';
  var shimmerLight = isDark ? 'bg-[#1E2845]' : 'bg-gray-100';
  var card = isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200';
  return (
    <div className={'border rounded-xl p-4 animate-pulse ' + card}>
      <div className="flex items-start gap-4">
        <div className={'w-14 h-14 rounded-full flex-shrink-0 ' + shimmer} />
        <div className="flex-1 space-y-2">
          <div className={'h-4 w-32 rounded ' + shimmer} />
          <div className={'h-3 w-20 rounded-full ' + shimmerLight} />
          <div className={'h-3 w-40 rounded ' + shimmerLight} />
        </div>
        <div className={'h-9 w-16 rounded-lg flex-shrink-0 ' + shimmerLight} />
      </div>
      <div className={'mt-3 h-8 rounded-lg border ' + shimmerLight + ' ' + (isDark ? 'border-[#2A3550]' : 'border-gray-100')} />
    </div>
  );
}

// ── Mark Paid Modal ───────────────────────────────────────────────────────────
function MarkPaidModal({ member, tiers, onConfirm, onClose }) {
  var [selectedTierId, setSelectedTierId] = useState(member.tier_id || null);
  var [customValue, setCustomValue] = useState('12');
  var [customUnit, setCustomUnit] = useState('months');
  var [useCustom, setUseCustom] = useState(false);
  var [quickMonths, setQuickMonths] = useState(12);

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
        <p className="text-sm text-gray-500 mb-5">
          {'For '}
          <strong className="text-gray-700">{member.displayName}</strong>
        </p>

        {tiers.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Membership Tier <span className="font-normal normal-case text-gray-400">(optional)</span></p>
            <div className="space-y-1.5">
              {tiers.map(function(tier) {
                var isSelected = selectedTierId === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={function() { isSelected ? clearTier() : selectTier(tier); }}
                    className={'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')}
                    aria-pressed={isSelected}
                  >
                    <span className={'font-medium ' + (isSelected ? 'text-blue-700' : 'text-gray-700')}>{tier.name}</span>
                    <span className="text-xs text-gray-400">
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration</p>
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {QUICK_PICKS.map(function(pick) {
              var isActive = !useCustom && quickMonths === pick.months;
              return (
                <button
                  key={pick.months}
                  onClick={function() { setQuickMonths(pick.months); setUseCustom(false); }}
                  className={'px-2 py-2 rounded-lg border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50')}
                  aria-pressed={isActive}
                >
                  {pick.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={function() { setUseCustom(!useCustom); }}
            className={'w-full px-3 py-2 rounded-lg border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (useCustom ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50')}
            aria-expanded={useCustom}
          >
            {useCustom ? 'Custom duration' : '+ Custom duration'}
          </button>
          {useCustom && (
            <div className="mt-2 flex gap-2">
              <input
                type="number" min="1" value={customValue}
                onChange={function(e) { setCustomValue(e.target.value); }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Custom duration amount"
              />
              <select
                value={customUnit}
                onChange={function(e) { setCustomUnit(e.target.value); }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Custom duration unit"
              >
                {UNIT_OPTIONS.map(function(u) { return <option key={u.value} value={u.value}>{u.label}</option>; })}
              </select>
            </div>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Paid through</span>
            <span className="text-sm font-semibold text-gray-800">{untilStr}</span>
          </div>
          {previewAmount != null && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Amount</span>
              <span className="text-sm font-semibold text-gray-800">{'$' + Number(previewAmount).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
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
function DuesRow({ membership, tiers, isAdmin, onMarkPaid, onMarkUnpaid, toggling, isDark }) {
  var status = getDuesStatus(membership);
  var until = membership.dues_paid_until ? new Date(membership.dues_paid_until) : null;
  var untilStr = until ? until.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  var amount = membership.dues_amount;
  var tier = tiers.find(function(t) { return t.id === membership.tier_id; }) || null;

  var rowBg = isDark
    ? (status === 'paid' ? 'bg-green-900/20 border-green-800/40' : status === 'expired' ? 'bg-orange-900/20 border-orange-800/40' : 'bg-yellow-900/20 border-yellow-800/40')
    : (status === 'paid' ? 'bg-green-50 border-green-100' : status === 'expired' ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100');

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
        <span className={'text-xs ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>
          {amount ? '$' + Number(amount).toFixed(2) : ''}
          {untilStr && status === 'paid' ? (amount ? ' · ' : '') + 'Through ' + untilStr : ''}
          {untilStr && status === 'expired' ? (amount ? ' · ' : '') + 'Expired ' + untilStr : ''}
        </span>
      </div>
      {isAdmin && (
        <div className="flex items-center gap-2">
          {status !== 'paid' ? (
            <button
              onClick={onMarkPaid}
              disabled={toggling}
              className="text-xs font-semibold px-3 py-1 rounded-lg border border-green-400 text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 transition-colors disabled:opacity-50"
              aria-label={membership.displayName + ': mark as paid'}
            >
              {toggling ? 'Saving...' : 'Mark Paid'}
            </button>
          ) : (
            <button
              onClick={onMarkUnpaid}
              disabled={toggling}
              className={'text-xs font-semibold px-3 py-1 rounded-lg border transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ' + (isDark ? 'border-[#2A3550] text-[#94A3B8] hover:bg-[#1E2845]' : 'border-gray-300 text-gray-500 hover:bg-gray-100')}
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
function RoleRow({ member, adminAtCap, editorAtCap, onRoleChange, changingRoleId, isDark }) {
  var isChanging = changingRoleId === member.user_id;
  return (
    <div className={'flex items-center gap-2 px-4 py-2 border-t ' + (isDark ? 'border-[#2A3550] bg-[#151B2D]' : 'border-gray-100 bg-gray-50')}>
      <label htmlFor={'role-' + member.user_id} className={'text-xs font-medium ' + (isDark ? 'text-[#64748B]' : 'text-gray-500')}>
        Role:
      </label>
      <select
        id={'role-' + member.user_id}
        value={member.role}
        disabled={isChanging}
        onChange={function(e) { onRoleChange(member, e.target.value); }}
        className={'text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ' + (isDark ? 'bg-[#1A2035] border-[#2A3550] text-white' : 'bg-white border-gray-200 text-gray-700')}
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
      {isChanging && <span className={'text-xs ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>Saving...</span>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function MemberDirectory() {
  var params = useParams();
  var organizationId = params.organizationId;
  var { isDark } = useTheme();
  var outletContext = useOutletContext();

  var [members, setMembers] = useState([]);
  var [filteredMembers, setFilteredMembers] = useState([]);
  var [orgTags, setOrgTags] = useState([]);
  var [tiers, setTiers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var isAdmin = outletContext ? outletContext.isAdmin : false;
  var [currentUserId, setCurrentUserId] = useState(null);
  var [organizationName, setOrganizationName] = useState('');
  var [collectDues, setCollectDues] = useState(true);
  var [togglingId, setTogglingId] = useState(null);
  var [changingRoleId, setChangingRoleId] = useState(null);
  var [sendingReminder, setSendingReminder] = useState(false);
  var [markPaidTarget, setMarkPaidTarget] = useState(null);

  var [searchQuery, setSearchQuery] = useState('');
  var [roleFilter, setRoleFilter] = useState('all');
  var [tagFilter, setTagFilter] = useState('all');
  var [duesFilter, setDuesFilter] = useState('all');

  // Plan limits
  var { limits } = usePlanLimits(organizationId);
  var memberLimit = limits ? limits.members : null;
  var memberCount = members.length;
  var memberPercent = memberLimit ? Math.min(Math.round((memberCount / memberLimit) * 100), 100) : 0;
  var isOverLimit = memberLimit !== null && memberCount > memberLimit;
  var overageCount = isOverLimit ? memberCount - memberLimit : 0;

  var adminCount = members.filter(function(m) { return m.role === 'admin'; }).length;
  var editorCount = members.filter(function(m) { return m.role === 'editor'; }).length;
  var adminLimit = limits ? limits.admin_limit : null;
  var editorLimit = limits ? limits.editor_limit : null;
  var adminAtCap = adminLimit !== null && adminCount >= adminLimit;
  var editorAtCap = editorLimit !== null && editorCount >= editorLimit;

  // Theme tokens
  var pageBg     = isDark ? 'bg-[#0E1523]'     : 'bg-gray-50';
  var cardBg     = isDark ? 'bg-[#1A2035]'     : 'bg-white';
  var cardBorder = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var textPrimary   = isDark ? 'text-white'     : 'text-gray-900';
  var textMuted     = isDark ? 'text-[#94A3B8]' : 'text-gray-500';
  var inputBg    = isDark ? 'bg-[#1A2035] border-[#2A3550] text-white placeholder-[#64748B]' : 'bg-white border-gray-300 text-gray-900';
  var labelText  = isDark ? 'text-[#94A3B8]'   : 'text-gray-500';

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

      var [orgResult, membershipResult, membersResult, tagsResult, tiersResult] = await Promise.all([
        supabase.from('organizations').select('id, name, contact_email, collect_dues').eq('id', organizationId).single(),
        user ? supabase.from('memberships').select('role').eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('memberships').select('id, role, member_id, tier_id, dues_paid, dues_paid_at, dues_paid_until, dues_amount, members(user_id, first_name, last_name, display_name, email, bio, profile_photo_url, avatar_url, city, state, phone, location_visibility, phone_visibility, email_visibility)').eq('organization_id', organizationId).eq('status', 'active').order('members(last_name)', { ascending: true }),
        supabase.from('member_tags').select('id, name, color').eq('organization_id', organizationId).order('name'),
        supabase.from('membership_tiers').select('*').eq('organization_id', organizationId).order('name'),
      ]);

      if (orgResult.error) throw orgResult.error;
      if (membersResult.error) throw membersResult.error;

      setOrganizationName(orgResult.data.name);
      setCollectDues(orgResult.data.collect_dues !== false);
      setOrgTags(tagsResult.data || []);
      setTiers(tiersResult.data || []);

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
            displayName: displayName,
          });
        });

      setMembers(membersList);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err.message);
      toast.error('Failed to load members.');
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
        var display = (m.display_name || '').toLowerCase();
        var email = (m.email || '').toLowerCase();
        var city = (m.city || '').toLowerCase();
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
      toast.error('Failed to update role.');
    } finally {
      setChangingRoleId(null);
    }
  }

  async function handleConfirmMarkPaid(membership, opts) {
    setMarkPaidTarget(null);
    setTogglingId(membership.user_id);
    try {
      var now = new Date();
      var until = addMonthsToDate(now, opts.months);
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
      toast.error('Failed to update dues status.');
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
      toast.error('Failed to update dues status.');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSendReminders() {
    var unpaid = members.filter(function(m) { return getDuesStatus(m) !== 'paid' && m.email; });
    if (unpaid.length === 0) {
      toast('No unpaid members with email addresses found.');
      return;
    }
    setSendingReminder(true);
    var successCount = 0;
    var failCount = 0;
    var sessionResult = await supabase.auth.getSession();
    var token = sessionResult.data.session ? sessionResult.data.session.access_token : '';

    var promises = unpaid.map(async function(member) {
      try {
        var response = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            type: 'dues_reminder',
            data: { memberEmail: member.email, memberName: member.displayName, orgName: organizationName, duesAmount: member.dues_amount, message: null },
          }),
        });
        if (response.ok) { successCount++; } else { failCount++; }
      } catch (e) { failCount++; }
    });

    await Promise.allSettled(promises);
    setSendingReminder(false);

    if (successCount > 0 && failCount === 0) {
      mascotSuccessToast('Reminder sent to ' + successCount + ' ' + (successCount === 1 ? 'member' : 'members') + '.');
    } else if (successCount > 0) {
      mascotSuccessToast(successCount + ' sent, ' + failCount + ' failed.');
    } else {
      toast.error('Failed to send reminders.');
    }
  }

  function handleClearFilters() {
    setSearchQuery('');
    setRoleFilter('all');
    setTagFilter('all');
    setDuesFilter('all');
  }

  var hasFilters = searchQuery || roleFilter !== 'all' || tagFilter !== 'all' || duesFilter !== 'all';
  var unpaidCount = members.filter(function(m) { return getDuesStatus(m) !== 'paid'; }).length;

  if (loading) {
    return (
      <div className={'min-h-screen ' + pageBg}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className={'rounded-xl border p-6 animate-pulse ' + cardBg + ' ' + cardBorder}>
            <div className={'h-7 w-32 rounded mb-2 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
            <div className={'h-4 w-24 rounded ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
          </div>
          <div className={'rounded-xl border p-6 animate-pulse space-y-3 ' + cardBg + ' ' + cardBorder}>
            <div className={'h-10 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
            <div className="grid grid-cols-4 gap-3">
              {[1,2,3,4].map(function(i) { return <div key={i} className={'h-10 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />; })}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2,3,4].map(function(i) { return <CardSkeleton key={i} isDark={isDark} />; })}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={'min-h-screen flex items-center justify-center p-4 ' + pageBg}>
        <div className="text-center max-w-md">
          <h3 className={'text-lg font-semibold mb-1 ' + textPrimary}>Failed to Load Members</h3>
          <p className={'text-sm mb-6 ' + textMuted}>{error}</p>
          <button onClick={function() { setError(null); loadData(); }} className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen ' + pageBg}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Page title */}
        <div>
          <h1 className={'text-2xl font-bold ' + textPrimary}>Members</h1>
          <p className={'text-sm mt-1 ' + textMuted}>
            {filteredMembers.length + ' ' + (filteredMembers.length === 1 ? 'member' : 'members')}
            {searchQuery ? ' matching "' + searchQuery + '"' : ''}
            {duesFilter !== 'all' ? ' · dues: ' + duesFilter : ''}
          </p>
        </div>

        <div className={'rounded-xl border p-5 space-y-4 ' + cardBg + ' ' + cardBorder}>

          {/* Member count progress bar */}
          {isAdmin && memberLimit !== null && (
            <div
              className={'flex items-center gap-3 p-3 border rounded-lg ' + (isOverLimit || memberPercent >= 90 ? (isDark ? 'bg-red-900/20 border-red-800/40' : 'bg-red-50 border-red-200') : memberPercent >= 80 ? (isDark ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200') : (isDark ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-100'))}
              role="status"
              aria-label={'Member usage: ' + memberCount + ' of ' + memberLimit}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={'text-xs font-semibold ' + (isOverLimit || memberPercent >= 90 ? 'text-red-600' : memberPercent >= 80 ? 'text-amber-600' : (isDark ? 'text-blue-400' : 'text-blue-700'))}>
                    {memberCount + ' / ' + memberLimit + ' members'}
                    {isOverLimit ? (' — ' + overageCount + ' over limit') : ''}
                  </span>
                  <span className={'text-xs ' + (isOverLimit || memberPercent >= 90 ? 'text-red-500' : memberPercent >= 80 ? 'text-amber-500' : (isDark ? 'text-blue-400' : 'text-blue-500'))}>
                    {memberPercent + '%'}
                  </span>
                </div>
                <div className={'w-full rounded-full h-1.5 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} role="progressbar" aria-valuenow={memberPercent} aria-valuemin={0} aria-valuemax={100}>
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

{isAdmin && isOverLimit && (
  <div
    className={'flex items-start justify-between gap-3 p-3 rounded-lg border ' + (isDark ? 'bg-red-900/20 border-red-800/40' : 'bg-red-50 border-red-200')}
    role="alert"
    aria-label="Member overage billing notice"
  >
    <div>
      <p className={'text-sm font-semibold ' + (isDark ? 'text-red-400' : 'text-red-700')}>
        {'You have ' + overageCount + ' ' + (overageCount === 1 ? 'member' : 'members') + ' over your plan limit of ' + memberLimit + '.'}
      </p>
      <p className={'text-xs mt-0.5 ' + (isDark ? 'text-red-400/70' : 'text-red-600')}>
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
                  className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ' + (adminAtCap ? 'bg-red-50 border-red-200 text-red-700' : (isDark ? 'bg-[#2D1B4E] border-purple-800/40 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'))}
                  aria-label={'Admin role usage: ' + adminCount + ' of ' + adminLimit}
                >
                  {adminCount + ' / ' + adminLimit + ' admins'}
                  {adminAtCap && <span className="ml-0.5 font-bold">· at limit</span>}
                </span>
              )}
              {editorLimit !== null && (
                <span
                  className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ' + (editorAtCap ? 'bg-red-50 border-red-200 text-red-700' : (isDark ? 'bg-[#1D3461] border-blue-800/40 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'))}
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
              className={'flex items-center justify-between p-3 rounded-lg border ' + (isDark ? 'bg-yellow-900/20 border-yellow-800/40' : 'bg-yellow-50 border-yellow-200')}
              role="region"
              aria-label="Dues reminder"
            >
              <span className={'text-sm font-medium ' + (isDark ? 'text-yellow-300' : 'text-yellow-800')}>
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
              <label htmlFor="member-search" className={'block text-xs font-bold uppercase tracking-wide mb-1.5 ' + labelText}>Search</label>
              <input
                id="member-search"
                type="text"
                placeholder="Name, email, location..."
                value={searchQuery}
                onChange={function(e) { setSearchQuery(e.target.value); }}
                className={'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ' + inputBg}
              />
            </div>

          {isAdmin && (
            <div>
              <label htmlFor="role-filter" className={'block text-xs font-bold uppercase tracking-wide mb-1.5 ' + labelText}>Role</label>
              <select id="role-filter" value={roleFilter} onChange={function(e) { setRoleFilter(e.target.value); }} className={'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ' + inputBg}>
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
              <label htmlFor="tag-filter" className={'block text-xs font-bold uppercase tracking-wide mb-1.5 ' + labelText}>Tag</label>
              <select id="tag-filter" value={tagFilter} onChange={function(e) { setTagFilter(e.target.value); }} className={'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ' + inputBg} disabled={orgTags.length === 0}>
                <option value="all">All Tags</option>
                {orgTags.map(function(tag) { return <option key={tag.id} value={tag.id}>{tag.name}</option>; })}
              </select>
            </div>
            )}

          {isAdmin && collectDues && (
              <div>
                <label htmlFor="dues-filter" className={'block text-xs font-bold uppercase tracking-wide mb-1.5 ' + labelText}>Dues Status</label>
                <select id="dues-filter" value={duesFilter} onChange={function(e) { setDuesFilter(e.target.value); }} className={'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ' + inputBg}>
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
              className={'inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ' + (isDark ? 'text-[#94A3B8] border-[#2A3550] hover:text-red-400 hover:border-red-800 hover:bg-red-900/20' : 'text-gray-500 border-gray-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50')}
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredMembers.length === 0 ? (
          <div className={'text-center py-16 rounded-xl border ' + cardBg + ' ' + cardBorder}>
            <h3 className={'text-lg font-semibold mb-1 ' + textPrimary}>No Members Found</h3>
            <p className={'text-sm mb-6 ' + textMuted}>{hasFilters ? 'No members match your current filters.' : 'This organization has no members yet.'}</p>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className={'px-5 py-2.5 border font-semibold rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors ' + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845]' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="list" aria-label="Organization members">
              {filteredMembers.map(function(member) {
                var showDuesRow = collectDues && isAdmin;
                var showRoleRow = isAdmin && member.user_id !== currentUserId;
                return (
                  <div key={member.user_id} role="listitem" className={'flex flex-col rounded-xl overflow-hidden border shadow-sm ' + cardBorder}>
                    <MemberCard member={member} role={member.role} organizationId={organizationId} isAdmin={isAdmin} />
                    {showRoleRow && (
                      <RoleRow
                        member={member}
                        adminAtCap={adminAtCap}
                        editorAtCap={editorAtCap}
                        onRoleChange={handleRoleChange}
                        changingRoleId={changingRoleId}
                        isDark={isDark}
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
                        isDark={isDark}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <p className={'text-center text-xs pb-4 ' + textMuted}>
              {'Showing ' + filteredMembers.length + ' of ' + members.length + ' member' + (members.length !== 1 ? 's' : '')}
            </p>
          </>
        )}

      </div>

      {markPaidTarget && (
        <MarkPaidModal
          member={markPaidTarget}
          tiers={tiers}
          onConfirm={function(opts) { handleConfirmMarkPaid(markPaidTarget, opts); }}
          onClose={function() { setMarkPaidTarget(null); }}
        />
      )}
    </div>
  );
}

export default MemberDirectory;