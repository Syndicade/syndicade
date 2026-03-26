import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MemberCard from '../components/MemberCard';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  users:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  x:       'M6 18L18 6M6 6l12 12',
  alert:   ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  check:   'M5 13l4 4L19 7',
  mail:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  dollar:  ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  tag:     ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
};

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

function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded-full" />
          <div className="h-3 w-40 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-16 bg-gray-100 rounded-lg flex-shrink-0" />
      </div>
      <div className="mt-3 h-8 bg-gray-50 rounded-lg border border-gray-100" />
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

  // When a tier is selected, sync quick months to tier duration
  function selectTier(tier) {
    setSelectedTierId(tier.id);
    setQuickMonths(tier.duration_months || 12);
    setUseCustom(false);
  }

  function clearTier() {
    setSelectedTierId(null);
  }

  var activeMonths = useCustom
    ? unitToMonths(customValue, customUnit)
    : quickMonths;

  var until = addMonthsToDate(new Date(), activeMonths);
  var untilStr = until.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  var previewAmount = selectedTier && selectedTier.dues_amount != null ? selectedTier.dues_amount : null;

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  function handleConfirm() {
    onConfirm({ months: activeMonths, tierId: selectedTierId, amount: previewAmount });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="mark-paid-title">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
        <h2 id="mark-paid-title" className="text-lg font-bold text-gray-900 mb-1">Mark Dues Paid</h2>
        <p className="text-sm text-gray-500 mb-5">
          {'For '}
          <strong className="text-gray-700">{member.displayName}</strong>
        </p>

        {/* Tier selection */}
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
                      {tier.duration_months + (tier.duration_months === 1 ? ' mo' : ' mo')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Duration section */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration</p>

          {/* Quick picks */}
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

          {/* Custom toggle */}
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
                type="number"
                min="1"
                value={customValue}
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

        {/* Preview */}
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
            onClick={handleConfirm}
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
function DuesRow({ membership, tiers, isAdmin, onMarkPaid, onMarkUnpaid, toggling }) {
  var status = getDuesStatus(membership);
  var until = membership.dues_paid_until ? new Date(membership.dues_paid_until) : null;
  var untilStr = until ? until.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  var amount = membership.dues_amount;
  var tier = tiers.find(function(t) { return t.id === membership.tier_id; }) || null;

  var rowBg = status === 'paid'
    ? 'bg-green-50 border-green-100'
    : status === 'expired'
      ? 'bg-orange-50 border-orange-100'
      : 'bg-yellow-50 border-yellow-100';

  return (
    <div className={'flex items-center justify-between px-4 py-2 border-t flex-wrap gap-2 ' + rowBg}>
      <div className="flex items-center gap-2 flex-wrap">
        {status === 'paid' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <Icon path={ICONS.check} className="h-3 w-3" />
            Paid
          </span>
        )}
        {status === 'expired' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            <Icon path={ICONS.clock} className="h-3 w-3" />
            Expired
          </span>
        )}
        {status === 'unpaid' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Icon path={ICONS.dollar} className="h-3 w-3" />
            Unpaid
          </span>
        )}
        {tier && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <Icon path={ICONS.tag} className="h-3 w-3" />
            {tier.name}
          </span>
        )}
        <span className="text-xs text-gray-400">
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
              className="text-xs font-semibold px-3 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors disabled:opacity-50"
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

// ── Main ──────────────────────────────────────────────────────────────────────
function MemberDirectory() {
  var params = useParams();
  var organizationId = params.organizationId;

  var [members, setMembers] = useState([]);
  var [filteredMembers, setFilteredMembers] = useState([]);
  var [orgTags, setOrgTags] = useState([]);
  var [tiers, setTiers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  var [currentUserId, setCurrentUserId] = useState(null);
  var [organizationName, setOrganizationName] = useState('');
  var [collectDues, setCollectDues] = useState(true);
  var [togglingId, setTogglingId] = useState(null);
  var [sendingReminder, setSendingReminder] = useState(false);
  var [markPaidTarget, setMarkPaidTarget] = useState(null);

  var [searchQuery, setSearchQuery] = useState('');
  var [roleFilter, setRoleFilter] = useState('all');
  var [tagFilter, setTagFilter] = useState('all');
  var [duesFilter, setDuesFilter] = useState('all');

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
      setIsAdmin(membershipResult.data && ['admin', 'owner'].includes(membershipResult.data.role));
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

      toast.success(membership.displayName + ' marked as paid through ' + until.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
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
      toast.success(membership.displayName + ' marked as unpaid');
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
            data: {
              memberEmail: member.email,
              memberName: member.displayName,
              orgName: organizationName,
              duesAmount: member.dues_amount,
              message: null,
            },
          }),
        });
        if (response.ok) { successCount++; } else { failCount++; }
      } catch (e) { failCount++; }
    });

    await Promise.allSettled(promises);
    setSendingReminder(false);

    if (successCount > 0 && failCount === 0) {
      toast.success('Reminder sent to ' + successCount + ' ' + (successCount === 1 ? 'member' : 'members') + '.');
    } else if (successCount > 0) {
      toast.success(successCount + ' sent, ' + failCount + ' failed.');
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-3">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="grid grid-cols-4 gap-3">
              {[1,2,3,4].map(function(i) { return <div key={i} className="h-10 bg-gray-100 rounded-lg" />; })}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2,3,4].map(function(i) { return <CardSkeleton key={i} />; })}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Icon path={ICONS.alert} className="h-12 w-12 text-red-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Failed to Load Members</h3>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={function() { setError(null); loadData(); }} className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <PageHeader
          title="Members"
          subtitle={filteredMembers.length + ' ' + (filteredMembers.length === 1 ? 'member' : 'members') + (searchQuery ? ' matching "' + searchQuery + '"' : '') + (duesFilter !== 'all' ? ' · dues: ' + duesFilter : '')}
          icon={<Icon path={ICONS.users} className="h-7 w-7 text-blue-600" />}
          organizationName={organizationName}
          organizationId={organizationId}
          backTo={'/organizations/' + organizationId}
          backLabel="Back to Dashboard"
        />

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">

          {isAdmin && collectDues && unpaidCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg" role="region" aria-label="Dues reminder">
              <div className="flex items-center gap-2">
                <Icon path={ICONS.dollar} className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {unpaidCount + ' ' + (unpaidCount === 1 ? 'member has' : 'members have') + ' outstanding dues'}
                </span>
              </div>
              <button
                onClick={handleSendReminders}
                disabled={sendingReminder}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
                aria-label={'Send dues reminder to ' + unpaidCount + ' unpaid members'}
              >
                <Icon path={ICONS.mail} className="h-3.5 w-3.5" />
                {sendingReminder ? 'Sending...' : 'Send Reminder'}
              </button>
            </div>
          )}

          <div className={'grid grid-cols-1 gap-3 ' + (collectDues ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
            <div className="relative">
              <label htmlFor="member-search" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Icon path={ICONS.search} className="h-4 w-4 text-gray-400" />
                </div>
                <input id="member-search" type="text" placeholder="Name, email, location..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>

            <div>
              <label htmlFor="role-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Role</label>
              <select id="role-filter" value={roleFilter} onChange={function(e) { setRoleFilter(e.target.value); }} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="moderator">Moderators</option>
                <option value="member">Members</option>
                <option value="guest">Guests</option>
              </select>
            </div>

            <div>
              <label htmlFor="tag-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tag</label>
              <select id="tag-filter" value={tagFilter} onChange={function(e) { setTagFilter(e.target.value); }} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" disabled={orgTags.length === 0}>
                <option value="all">All Tags</option>
                {orgTags.map(function(tag) { return <option key={tag.id} value={tag.id}>{tag.name}</option>; })}
              </select>
            </div>

            {collectDues && (
              <div>
                <label htmlFor="dues-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Dues Status</label>
                <select id="dues-filter" value={duesFilter} onChange={function(e) { setDuesFilter(e.target.value); }} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="all">All Members</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid / Expired</option>
                </select>
              </div>
            )}
          </div>

          {hasFilters && (
            <button onClick={handleClearFilters} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors">
              <Icon path={ICONS.x} className="h-3.5 w-3.5" />
              Clear All Filters
            </button>
          )}
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Icon path={ICONS.users} className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Members Found</h3>
            <p className="text-gray-500 text-sm mb-6">{hasFilters ? 'No members match your current filters.' : 'This organization has no members yet.'}</p>
            {hasFilters && (
              <button onClick={handleClearFilters} className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm">
                <Icon path={ICONS.x} className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="list" aria-label="Organization members">
              {filteredMembers.map(function(member) {
                var showDuesRow = collectDues && (isAdmin || member.user_id === currentUserId);
                return (
                  <div key={member.user_id} role="listitem" className="flex flex-col rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <MemberCard member={member} role={member.role} organizationId={organizationId} isAdmin={isAdmin} />
                    {showDuesRow && (
                      <DuesRow
                        membership={member}
                        tiers={tiers}
                        isAdmin={isAdmin}
                        onMarkPaid={function() { setMarkPaidTarget(member); }}
                        onMarkUnpaid={function() { handleMarkUnpaid(member); }}
                        toggling={togglingId === member.user_id}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400 pb-4">
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