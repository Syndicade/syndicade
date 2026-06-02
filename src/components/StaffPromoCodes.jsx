/**
 * StaffPromoCodes.jsx
 * Manages discount/promo codes. Creating a percent_off or flat_off code
 * automatically creates a matching Stripe coupon via the create-stripe-coupon
 * edge function and saves the stripe_coupon_id back to the DB row.
 * months_free codes extend the trial period — no Stripe coupon needed.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import {
  Plus, Copy, Check, Tag, RefreshCw, ToggleLeft, ToggleRight,
  Trash2, ChevronDown, ChevronRight, Info, Search, Download,
  X, AlertTriangle,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

function generateCode(prefix) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var suffix = '';
  for (var i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return (prefix || 'SYNC') + suffix;
}

var BLANK_FORM = {
  code: '',
  type: 'percent_off',
  value: '',
  applicable_plans: ['starter', 'growth', 'pro'],
  max_uses: '',
  expires_at: '',
  campaign: '',
  is_active: true,
};

var TYPE_LABELS = {
  percent_off: 'Percent Off',
  months_free: 'Months Free',
  flat_off: 'Flat Dollar Off',
};

var CAMPAIGN_SUGGESTIONS = [
  'toledo_launch', 'nten2026', 'conference_spring', 'partner_referral',
  'student_orgs', 'annual_switch', 'nonprofit_week',
];

var SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'uses_desc', label: 'Most used' },
  { value: 'expires_asc', label: 'Expiring soon' },
];

var inputCls = 'w-full bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-[#94A3B8]';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(code) {
  var now = new Date();
  var expired = code.expires_at && new Date(code.expires_at) < now;
  var depleted = code.max_uses !== null && code.uses_count >= code.max_uses;
  if (!code.is_active) return { label: 'Inactive', textCls: 'text-[#64748B]',   bgCls: 'bg-slate-100',   borderCls: 'border-slate-200' };
  if (expired)         return { label: 'Expired',  textCls: 'text-red-600',      bgCls: 'bg-red-50',      borderCls: 'border-red-200' };
  if (depleted)        return { label: 'Depleted', textCls: 'text-amber-700',    bgCls: 'bg-amber-50',    borderCls: 'border-amber-200' };
  return                      { label: 'Active',   textCls: 'text-green-700',    bgCls: 'bg-green-50',    borderCls: 'border-green-200' };
}

function formatValue(code) {
  if (code.type === 'percent_off') return code.value + '% off';
  if (code.type === 'months_free') return code.value + (code.value === 1 ? ' month' : ' months') + ' free';
  if (code.type === 'flat_off')    return '$' + code.value + ' off';
  return String(code.value);
}

function getDiscountDescription(form) {
  if (!form.value) return null;
  var plans = form.applicable_plans.map(function(p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join(', ');
  if (!plans) return null;
  if (form.type === 'percent_off') return form.value + '% off ' + plans + ' — applied permanently';
  if (form.type === 'flat_off')    return '$' + form.value + ' off first payment on ' + plans;
  if (form.type === 'months_free') return form.value + ' month' + (parseFloat(form.value) !== 1 ? 's' : '') + ' free trial on ' + plans;
  return null;
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt) - new Date()) / 86400000);
}

function expiryTextCls(days) {
  if (days === null) return 'text-[#64748B]';
  if (days <= 7)  return 'text-red-500';
  if (days <= 30) return 'text-amber-600';
  return 'text-[#64748B]';
}

function sortCodes(codes, sortKey) {
  var arr = codes.slice();
  if (sortKey === 'created_asc')  return arr.sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); });
  if (sortKey === 'uses_desc')    return arr.sort(function(a, b) { return b.uses_count - a.uses_count; });
  if (sortKey === 'expires_asc')  return arr.filter(function(c) { return c.expires_at; }).sort(function(a, b) { return new Date(a.expires_at) - new Date(b.expires_at); }).concat(arr.filter(function(c) { return !c.expires_at; }));
  return arr.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); }); // created_desc
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="grid gap-3 px-5 py-4 border-b border-slate-100 animate-pulse" style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr 100px' }} aria-hidden="true">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="h-4 w-20 rounded bg-slate-100" />
      <div className="h-4 w-16 rounded bg-slate-100" />
      <div className="h-4 w-10 rounded bg-slate-100" />
      <div className="h-4 w-16 rounded bg-slate-100" />
      <div className="h-5 w-14 rounded-full bg-slate-100" />
      <div className="h-4 w-16 rounded bg-slate-100" />
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ code, onClose, onDeleted }) {
  var [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    var { error } = await supabase.from('discount_codes').delete().eq('id', code.id);
    if (error) {
      mascotErrorToast('Failed to delete code.', error.message);
      setDeleting(false);
      return;
    }
    mascotSuccessToast('Code deleted.', code.code + ' has been removed.');
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Confirm delete promo code" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl" onClick={function(e) { e.stopPropagation(); }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-[#0E1523] font-extrabold text-[15px]">Delete Promo Code</h2>
            <p className="text-[12px] text-[#64748B]">This cannot be undone.</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5 font-mono text-[15px] font-bold text-[#0E1523] tracking-wider text-center">
          {code.code}
        </div>
        {code.stripe_coupon_id && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[12px] text-amber-700">This code has a linked Stripe coupon. You'll need to delete it manually in your Stripe dashboard.</p>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-500 text-white text-[14px] font-bold rounded-xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-[#475569] text-[14px] font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaffPromoCodes() {
  var [codes, setCodes] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showCreate, setShowCreate] = useState(false);
  var [expandedCode, setExpandedCode] = useState(null);
  var [codeUses, setCodeUses] = useState({});
  var [loadingUses, setLoadingUses] = useState({});
  var [saving, setSaving] = useState(false);
  var [form, setForm] = useState(BLANK_FORM);
  var [filterStatus, setFilterStatus] = useState('all');
  var [filterCampaign, setFilterCampaign] = useState('');
  var [searchQuery, setSearchQuery] = useState('');
  var [sortKey, setSortKey] = useState('created_desc');
  var [selectedIds, setSelectedIds] = useState([]);
  var [deletingCode, setDeletingCode] = useState(null);
  var [bulkAction, setBulkAction] = useState('');
  var [copiedCode, setCopiedCode] = useState(null);
  var createFormRef = useRef(null);

  useEffect(function() { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    var { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      mascotErrorToast('Failed to load promo codes.', error.message);
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  }

  async function loadCodeUses(codeId) {
    setLoadingUses(function(prev) { return Object.assign({}, prev, { [codeId]: true }); });
    var { data } = await supabase
      .from('discount_code_uses')
      .select('*, organizations(id, name, logo_url)')
      .eq('code_id', codeId)
      .order('used_at', { ascending: false });
    setCodeUses(function(prev) { return Object.assign({}, prev, { [codeId]: data || [] }); });
    setLoadingUses(function(prev) { return Object.assign({}, prev, { [codeId]: false }); });
  }

  function toggleExpand(codeId) {
    if (expandedCode === codeId) {
      setExpandedCode(null);
    } else {
      setExpandedCode(codeId);
      if (!codeUses[codeId]) loadCodeUses(codeId);
    }
  }

  // ── Create code + Stripe coupon ────────────────────────────────────────────

  async function handleCreate() {
    if (!form.code.trim()) { toast.error('Code is required.'); return; }
    if (!form.value) { toast.error('Discount value is required.'); return; }
    if (form.applicable_plans.length === 0) { toast.error('Select at least one plan.'); return; }
    setSaving(true);

    var payload = {
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: parseFloat(form.value),
      applicable_plans: form.applicable_plans,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      campaign: form.campaign.trim() || null,
      is_active: true,
      stripe_coupon_id: null,
    };

    // Insert the code first to get the ID
    var { data: inserted, error: insertError } = await supabase
      .from('discount_codes')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        toast.error('A code with that name already exists.');
      } else {
        mascotErrorToast('Failed to create promo code.', insertError.message);
      }
      setSaving(false);
      return;
    }

    // For percent_off and flat_off — create Stripe coupon
    if (form.type === 'percent_off' || form.type === 'flat_off') {
      try {
        var { data: sessionData } = await supabase.auth.getSession();
        var token = sessionData.session.access_token;
        var couponRes = await fetch(
          'https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-stripe-coupon',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
              code: inserted.code,
              type: form.type,
              value: parseFloat(form.value),
              discount_code_id: inserted.id,
            }),
          }
        );
        var couponData = await couponRes.json();
        if (!couponRes.ok) {
          // Code created in DB but Stripe coupon failed — warn but don't block
          toast.error('Code created, but Stripe coupon failed: ' + (couponData.error || 'Unknown error') + '. Percent/flat discounts won\'t apply in Stripe until fixed.');
        }
      } catch (stripeErr) {
        toast.error('Code created, but Stripe coupon could not be created. Check your connection.');
      }
    }

    mascotSuccessToast('Promo code created!', payload.code + ' is ready to distribute.');
    setSaving(false);
    setShowCreate(false);
    setForm(BLANK_FORM);
    loadCodes();
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  async function toggleActive(code) {
    var { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !code.is_active })
      .eq('id', code.id);
    if (error) {
      mascotErrorToast('Failed to update status.', error.message);
    } else {
      mascotSuccessToast(code.is_active ? 'Code deactivated.' : 'Code activated.');
      loadCodes();
    }
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────

  async function handleBulkAction() {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === 'activate' || bulkAction === 'deactivate') {
      var isActive = bulkAction === 'activate';
      var { error } = await supabase
        .from('discount_codes')
        .update({ is_active: isActive })
        .in('id', selectedIds);
      if (error) {
        mascotErrorToast('Bulk update failed.', error.message);
      } else {
        mascotSuccessToast(selectedIds.length + ' code' + (selectedIds.length !== 1 ? 's' : '') + ' ' + (isActive ? 'activated' : 'deactivated') + '.');
        setSelectedIds([]);
        setBulkAction('');
        loadCodes();
      }
    }
    if (bulkAction === 'delete') {
      var { error } = await supabase
        .from('discount_codes')
        .delete()
        .in('id', selectedIds);
      if (error) {
        mascotErrorToast('Bulk delete failed.', error.message);
      } else {
        mascotSuccessToast(selectedIds.length + ' code' + (selectedIds.length !== 1 ? 's' : '') + ' deleted.');
        setSelectedIds([]);
        setBulkAction('');
        loadCodes();
      }
    }
  }

  // ── Copy with checkmark feedback ───────────────────────────────────────────

  function copyCode(text) {
    navigator.clipboard.writeText(text).then(function() {
      setCopiedCode(text);
      setTimeout(function() { setCopiedCode(null); }, 2000);
    });
  }

  // ── Plan toggle ────────────────────────────────────────────────────────────

  function togglePlan(plan) {
    var plans = form.applicable_plans.slice();
    var idx = plans.indexOf(plan);
    if (idx === -1) { plans.push(plan); } else { plans.splice(idx, 1); }
    setForm(function(prev) { return Object.assign({}, prev, { applicable_plans: plans }); });
  }

  // ── CSV Export ─────────────────────────────────────────────────────────────

  function exportCSV() {
    var rows = [['Code', 'Type', 'Value', 'Campaign', 'Plans', 'Uses', 'Max Uses', 'Expires', 'Status', 'Created', 'Stripe Coupon ID']];
    codes.forEach(function(c) {
      rows.push([
        c.code,
        TYPE_LABELS[c.type] || c.type,
        formatValue(c),
        c.campaign || '',
        (c.applicable_plans || []).join(', '),
        c.uses_count,
        c.max_uses || 'Unlimited',
        c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No expiry',
        getStatus(c).label,
        new Date(c.created_at).toLocaleDateString(),
        c.stripe_coupon_id || '',
      ]);
    });
    var csv = rows.map(function(r) {
      return r.map(function(cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'syndicade_promo_codes_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ── Filtering + sorting ────────────────────────────────────────────────────

  var allCampaigns = Array.from(new Set(codes.map(function(c) { return c.campaign; }).filter(Boolean))).sort();

  var filtered = sortCodes(
    codes.filter(function(c) {
      if (filterStatus !== 'all' && getStatus(c).label.toLowerCase() !== filterStatus) return false;
      if (filterCampaign && c.campaign !== filterCampaign) return false;
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        var searchable = [c.code, c.campaign || '', (c.applicable_plans || []).join(' ')].join(' ').toLowerCase();
        if (searchable.indexOf(q) === -1) return false;
      }
      return true;
    }),
    sortKey
  );

  var allFilteredIds = filtered.map(function(c) { return c.id; });
  var allSelected = allFilteredIds.length > 0 && allFilteredIds.every(function(id) { return selectedIds.indexOf(id) !== -1; });

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(function(prev) { return prev.filter(function(id) { return allFilteredIds.indexOf(id) === -1; }); });
    } else {
      setSelectedIds(function(prev) {
        var next = prev.slice();
        allFilteredIds.forEach(function(id) { if (next.indexOf(id) === -1) next.push(id); });
        return next;
      });
    }
  }

  function toggleSelect(id) {
    setSelectedIds(function(prev) {
      var idx = prev.indexOf(id);
      if (idx === -1) return prev.concat([id]);
      var next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }

  var discountPreview = getDiscountDescription(form);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <p className="text-[13px] text-[#64748B]">
          Create discount codes for campaigns, conferences, and partner orgs. Never post codes publicly.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-[#475569] font-semibold hover:border-blue-300 hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Export promo codes as CSV"
          >
            <Download size={14} aria-hidden="true" /> Export CSV
          </button>
          <button
            onClick={function() { setShowCreate(!showCreate); if (!showCreate) setTimeout(function() { if (createFormRef.current) createFormRef.current.focus(); }, 50); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-[13px] font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-expanded={showCreate}
            aria-label="Create new promo code"
          >
            <Plus size={14} aria-hidden="true" /> New Code
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm" role="region" aria-label="Create promo code form">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-bold text-[#0E1523]">New Promo Code</h3>
            <button onClick={function() { setShowCreate(false); setForm(BLANK_FORM); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#0E1523] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors" aria-label="Close form">
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label htmlFor="pc-code" className="block text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-1.5">
                Code <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  ref={createFormRef}
                  id="pc-code"
                  value={form.code}
                  onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { code: e.target.value.toUpperCase().replace(/\s/g, '') }); }); }}
                  placeholder="e.g. TOLEDO25"
                  maxLength={24}
                  className="flex-1 bg-white border border-slate-200 text-[#0E1523] text-[14px] font-mono tracking-wider rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-[#94A3B8]"
                  aria-required="true"
                />
                <button
                  onClick={function() { setForm(function(p) { return Object.assign({}, p, { code: generateCode() }); }); }}
                  className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-[#475569] hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
                  aria-label="Generate random code"
                  title="Generate random code"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Campaign */}
            <div>
              <label htmlFor="pc-campaign" className="block text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-1.5">Campaign Label</label>
              <input
                id="pc-campaign"
                value={form.campaign}
                onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { campaign: e.target.value }); }); }}
                placeholder="e.g. toledo_launch"
                list="campaign-suggestions"
                className={inputCls}
              />
              <datalist id="campaign-suggestions">
                {CAMPAIGN_SUGGESTIONS.map(function(s) { return <option key={s} value={s} />; })}
              </datalist>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="pc-type" className="block text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-1.5">
                Discount Type <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select id="pc-type" value={form.type} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { type: e.target.value }); }); }} className={'appearance-none ' + inputCls} aria-required="true">
                <option value="percent_off">Percent Off (%) — permanent discount</option>
                <option value="months_free">Months Free — extends trial</option>
                <option value="flat_off">Flat Dollar Off ($) — first payment only</option>
              </select>
            </div>

            {/* Value */}
            <div>
              <label htmlFor="pc-value" className="block text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-1.5">
                {form.type === 'percent_off' ? 'Percent (%)' : form.type === 'months_free' ? 'Number of Months' : 'Amount ($)'}
                <span className="text-red-500" aria-hidden="true"> *</span>
              </label>
              <input
                id="pc-value"
                type="number"
                min="0"
                max={form.type === 'percent_off' ? 100 : undefined}
                value={form.value}
                onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { value: e.target.value }); }); }}
                placeholder={form.type === 'percent_off' ? '25' : form.type === 'months_free' ? '1' : '10'}
                className={inputCls}
                aria-required="true"
              />
            </div>

            {/* Max uses */}
            <div>
              <label htmlFor="pc-max" className="block text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-1.5">
                Max Uses <span className="text-[11px] text-[#94A3B8] font-normal normal-case tracking-normal">(blank = unlimited)</span>
              </label>
              <input id="pc-max" type="number" min="1" value={form.max_uses} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { max_uses: e.target.value }); }); }} placeholder="e.g. 100" className={inputCls} />
            </div>

            {/* Expiry */}
            <div>
              <label htmlFor="pc-expires" className="block text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-1.5">
                Expiration Date <span className="text-[11px] text-[#94A3B8] font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input id="pc-expires" type="date" value={form.expires_at} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { expires_at: e.target.value }); }); }} className={inputCls} />
            </div>
          </div>

          {/* Applicable plans */}
          <div className="mt-4">
            <p className="text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-2">Applicable Plans</p>
            <div className="flex gap-2" role="group" aria-label="Select applicable plans">
              {['starter', 'growth', 'pro'].map(function(plan) {
                var on = form.applicable_plans.indexOf(plan) !== -1;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={function() { togglePlan(plan); }}
                    aria-pressed={on}
                    className={'px-4 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (on ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-white border-slate-200 text-[#64748B] hover:border-slate-300 hover:text-[#0E1523]')}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live preview */}
          {discountPreview && (
            <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <Tag size={13} className="text-green-600 flex-shrink-0" aria-hidden="true" />
              <p className="text-[13px] text-green-700 font-semibold">{discountPreview}</p>
            </div>
          )}

          {/* Stripe note for percent/flat */}
          {(form.type === 'percent_off' || form.type === 'flat_off') && (
            <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
              <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-[12px] text-blue-700">A Stripe coupon will be created automatically when you save this code.</p>
            </div>
          )}

          {/* Form actions */}
          <div className="flex gap-3 mt-5 justify-end">
            <button onClick={function() { setShowCreate(false); setForm(BLANK_FORM); }} className="px-5 py-2 bg-white border border-slate-200 text-[#475569] text-[13px] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-6 py-2 bg-blue-500 text-white text-[13px] font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              aria-busy={saving}
            >
              {saving ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
          <label htmlFor="pc-search" className="sr-only">Search promo codes</label>
          <input
            id="pc-search"
            type="search"
            placeholder="Search code or campaign..."
            value={searchQuery}
            onChange={function(e) { setSearchQuery(e.target.value); }}
            className="w-full bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#94A3B8]"
          />
        </div>

        {/* Campaign filter */}
        {allCampaigns.length > 0 && (
          <div className="relative">
            <label htmlFor="pc-filter-campaign" className="sr-only">Filter by campaign</label>
            <select
              id="pc-filter-campaign"
              value={filterCampaign}
              onChange={function(e) { setFilterCampaign(e.target.value); }}
              className="appearance-none bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Campaigns</option>
              {allCampaigns.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
          </div>
        )}

        {/* Sort */}
        <div className="relative">
          <label htmlFor="pc-sort" className="sr-only">Sort codes</label>
          <select
            id="pc-sort"
            value={sortKey}
            onChange={function(e) { setSortKey(e.target.value); }}
            className="appearance-none bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
        </div>

        {(searchQuery || filterCampaign) && (
          <button onClick={function() { setSearchQuery(''); setFilterCampaign(''); }} className="text-[12px] text-[#64748B] hover:text-[#0E1523] underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            Clear
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap mb-4">
        {[
          { key: 'all',      label: 'All' },
          { key: 'active',   label: 'Active' },
          { key: 'expired',  label: 'Expired' },
          { key: 'inactive', label: 'Inactive' },
          { key: 'depleted', label: 'Depleted' },
        ].map(function(f) {
          var on = filterStatus === f.key;
          return (
            <button
              key={f.key}
              onClick={function() { setFilterStatus(f.key); }}
              aria-pressed={on}
              className={'px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (on ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-white border-slate-200 text-[#64748B] hover:text-[#0E1523]')}
            >
              {f.label}
              {f.key === 'all' && (
                <span className={'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ' + (on ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-[#64748B]')}>
                  {codes.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4" role="status">
          <span className="text-[13px] text-blue-700 font-semibold">{selectedIds.length} selected</span>
          <div className="relative ml-2">
            <select
              value={bulkAction}
              onChange={function(e) { setBulkAction(e.target.value); }}
              className="appearance-none bg-white border border-blue-300 text-[#0E1523] text-[12px] rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Bulk action"
            >
              <option value="">Choose action...</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
              <option value="delete">Delete</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
          </div>
          <button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="px-4 py-1.5 bg-blue-500 text-white text-[12px] font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 transition-colors"
          >
            Apply
          </button>
          <button onClick={function() { setSelectedIds([]); setBulkAction(''); }} className="ml-auto text-[12px] text-[#64748B] hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-slate-400 rounded">
            Clear selection
          </button>
        </div>
      )}

      {/* Codes table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="table" aria-label="Promo codes">

        {/* Header */}
        <div className="hidden md:grid gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200" style={{ gridTemplateColumns: '32px 2fr 1.2fr 1fr 1fr 1fr 1fr 100px' }} role="row">
          <div role="columnheader">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              aria-label="Select all visible codes"
            />
          </div>
          {['Code', 'Campaign', 'Discount', 'Uses', 'Expires', 'Status', 'Actions'].map(function(h) {
            return <span key={h} role="columnheader" className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{h}</span>;
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div role="status" aria-label="Loading promo codes">
            <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="px-6 py-16 text-center" role="status">
            <Tag size={40} className="text-slate-300 mx-auto mb-4" aria-hidden="true" />
            <p className="text-[#0E1523] font-bold text-[16px] mb-2">
              {filterStatus === 'all' && !searchQuery && !filterCampaign ? 'No promo codes yet' : 'No codes match your filters'}
            </p>
            <p className="text-[14px] text-[#64748B] mb-5">
              {filterStatus === 'all' && !searchQuery && !filterCampaign
                ? 'Create your first code to start tracking campaign signups.'
                : 'Try adjusting your search or filters.'}
            </p>
            {filterStatus === 'all' && !searchQuery && !filterCampaign ? (
              <button onClick={function() { setShowCreate(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-[13px] font-bold rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                <Plus size={15} aria-hidden="true" /> Create First Code
              </button>
            ) : (
              <button onClick={function() { setFilterStatus('all'); setSearchQuery(''); setFilterCampaign(''); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[#475569] text-[13px] font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map(function(code) {
          var status  = getStatus(code);
          var days    = daysLeft(code.expires_at);
          var isOpen  = expandedCode === code.id;
          var isSelected = selectedIds.indexOf(code.id) !== -1;
          var usePct = code.max_uses ? Math.min(100, (code.uses_count / code.max_uses) * 100) : null;

          return (
            <div key={code.id} role="rowgroup">
              <div
                className={'grid gap-3 px-5 py-4 border-b border-slate-100 items-center cursor-pointer transition-colors ' + (isSelected ? 'bg-blue-50' : 'hover:bg-slate-50')}
                style={{ gridTemplateColumns: '32px 2fr 1.2fr 1fr 1fr 1fr 1fr 100px' }}
                role="row"
                aria-expanded={isOpen}
                onClick={function() { toggleExpand(code.id); }}
                tabIndex={0}
                onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(code.id); } }}
              >
                {/* Checkbox */}
                <div role="cell" onClick={function(e) { e.stopPropagation(); }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={function() { toggleSelect(code.id); }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                    aria-label={'Select ' + code.code}
                  />
                </div>

                {/* Code */}
                <div className="flex items-center gap-2" role="cell">
                  {isOpen
                    ? <ChevronDown size={13} className="text-[#94A3B8] flex-shrink-0" aria-hidden="true" />
                    : <ChevronRight size={13} className="text-[#94A3B8] flex-shrink-0" aria-hidden="true" />
                  }
                  <span className="font-mono text-[13px] font-bold text-[#0E1523] tracking-wider">{code.code}</span>
                  <button
                    onClick={function(e) { e.stopPropagation(); copyCode(code.code); }}
                    className="p-1 rounded text-[#94A3B8] hover:text-[#0E1523] hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label={'Copy code ' + code.code}
                  >
                    {copiedCode === code.code
                      ? <Check size={11} className="text-green-500" aria-hidden="true" />
                      : <Copy size={11} aria-hidden="true" />
                    }
                  </button>
                  {code.stripe_coupon_id && (
                    <span className="text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide" title={'Stripe coupon: ' + code.stripe_coupon_id}>
                      Stripe
                    </span>
                  )}
                </div>

                {/* Campaign */}
                <span role="cell" className="text-[12px] text-[#64748B]">{code.campaign || '—'}</span>

                {/* Discount */}
                <span role="cell" className="text-[12px] text-[#0E1523] font-semibold">{formatValue(code)}</span>

                {/* Uses */}
                <div role="cell">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-[#0E1523] font-semibold">{code.uses_count}</span>
                    {code.max_uses !== null
                      ? <span className="text-[12px] text-[#64748B]">{' / ' + code.max_uses}</span>
                      : <span className="text-[11px] text-[#94A3B8]"> ∞</span>
                    }
                  </div>
                  {usePct !== null && (
                    <div className="mt-1 h-1 rounded-full bg-slate-200 overflow-hidden w-16">
                      <div
                        className={'h-full rounded-full ' + (usePct >= 90 ? 'bg-red-400' : usePct >= 60 ? 'bg-amber-400' : 'bg-green-400')}
                        style={{ width: usePct + '%' }}
                        role="progressbar"
                        aria-valuenow={Math.round(usePct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={code.code + ' usage'}
                      />
                    </div>
                  )}
                </div>

                {/* Expires */}
                <div role="cell">
                  {code.expires_at ? (
                    <div>
                      <div className={'text-[12px] font-semibold ' + expiryTextCls(days)}>
                        {new Date(code.expires_at).toLocaleDateString()}
                      </div>
                      <div className={'text-[10px] ' + expiryTextCls(days)}>
                        {days !== null && days > 0 ? days + 'd left' : days === 0 ? 'Today' : 'Expired'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[12px] text-[#94A3B8]">No expiry</span>
                  )}
                </div>

                {/* Status */}
                <div role="cell">
                  <span className={'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ' + status.bgCls + ' ' + status.textCls + ' ' + status.borderCls}>
                    {status.label}
                  </span>
                </div>

                {/* Actions */}
                <div role="cell" className="flex items-center gap-1" onClick={function(e) { e.stopPropagation(); }}>
                  <button
                    onClick={function() { toggleActive(code); }}
                    className={'p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ' + (code.is_active ? 'text-green-500 hover:bg-green-50 focus:ring-green-500' : 'text-[#94A3B8] hover:bg-slate-100 focus:ring-slate-400')}
                    aria-label={code.is_active ? 'Deactivate ' + code.code : 'Activate ' + code.code}
                    title={code.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {code.is_active
                      ? <ToggleRight size={18} aria-hidden="true" />
                      : <ToggleLeft  size={18} aria-hidden="true" />
                    }
                  </button>
                  <button
                    onClick={function() { setDeletingCode(code); }}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    aria-label={'Delete code ' + code.code}
                    title="Delete"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Expanded usage */}
              {isOpen && (
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 pl-14" role="region" aria-label={'Usage details for ' + code.code}>
                  <p className="text-[11px] font-bold text-[#F5B731] uppercase tracking-[4px] mb-3">
                    Organizations That Used This Code
                  </p>
                  {loadingUses[code.id] ? (
                    <div className="flex gap-3">
                      {[1, 2, 3].map(function(i) { return <div key={i} className="w-36 h-10 bg-slate-200 rounded-lg animate-pulse" />; })}
                    </div>
                  ) : !codeUses[code.id] || codeUses[code.id].length === 0 ? (
                    <p className="text-[13px] text-[#64748B]">No organizations have used this code yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {codeUses[code.id].map(function(use) {
                        var org = use.organizations;
                        var initials = org ? org.name.substring(0, 2).toUpperCase() : '??';
                        return (
                          <div key={use.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                            {org && org.logo_url ? (
                              <img src={org.logo_url} alt="" aria-hidden="true" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-[#64748B] flex-shrink-0">{initials}</div>
                            )}
                            <div>
                              <p className="text-[12px] font-semibold text-[#0E1523]">{org ? org.name : 'Unknown Org'}</p>
                              <p className="text-[10px] text-[#64748B]">
                                {use.plan && (use.plan.charAt(0).toUpperCase() + use.plan.slice(1))}
                                {use.interval && (' · ' + use.interval)}
                                {' · ' + new Date(use.used_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-[12px] text-[#94A3B8] mt-2 text-right">
          Showing {filtered.length} of {codes.length} code{codes.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Distribution reminder */}
      <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[12px] text-[#475569] leading-relaxed">
          <span className="text-blue-600 font-bold">Distribution rule:</span> Never display promo codes on the public pricing page. Distribute only through direct channels — conferences, partner emails, and referral links.
        </p>
      </div>

      {/* Delete modal */}
      {deletingCode && (
        <DeleteModal
          code={deletingCode}
          onClose={function() { setDeletingCode(null); }}
          onDeleted={function() { setDeletingCode(null); if (expandedCode === deletingCode.id) setExpandedCode(null); loadCodes(); }}
        />
      )}
    </div>
  );
}