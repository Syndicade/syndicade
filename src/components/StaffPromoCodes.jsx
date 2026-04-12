import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import {
  Plus, Copy, Tag, RefreshCw, ToggleLeft, ToggleRight,
  Trash2, ChevronDown, ChevronRight, Info
} from 'lucide-react';

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
  is_active: true
};

var TYPE_LABELS = {
  percent_off: 'Percent Off',
  months_free: 'Months Free',
  flat_off: 'Flat Dollar Off'
};

var CAMPAIGN_SUGGESTIONS = [
  'toledo_launch', 'nten2026', 'conference_spring', 'partner_referral',
  'student_orgs', 'annual_switch', 'nonprofit_week'
];

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

  useEffect(function () { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    var { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load promo codes.');
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  }

  async function loadCodeUses(codeId) {
    setLoadingUses(function (prev) {
      var next = Object.assign({}, prev);
      next[codeId] = true;
      return next;
    });
    var { data } = await supabase
      .from('discount_code_uses')
      .select('*, organizations(id, name, logo_url)')
      .eq('code_id', codeId)
      .order('used_at', { ascending: false });
    setCodeUses(function (prev) {
      var next = Object.assign({}, prev);
      next[codeId] = data || [];
      return next;
    });
    setLoadingUses(function (prev) {
      var next = Object.assign({}, prev);
      next[codeId] = false;
      return next;
    });
  }

  function toggleExpand(codeId) {
    if (expandedCode === codeId) {
      setExpandedCode(null);
    } else {
      setExpandedCode(codeId);
      if (!codeUses[codeId]) loadCodeUses(codeId);
    }
  }

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
      is_active: true
    };
    var { error } = await supabase.from('discount_codes').insert(payload);
    if (error) {
      if (error.code === '23505') {
        toast.error('A code with that name already exists.');
      } else {
        mascotErrorToast('Failed to create promo code.', error.message);
      }
    } else {
      mascotSuccessToast('Promo code created!', payload.code + ' is ready to distribute.');
      setShowCreate(false);
      setForm(BLANK_FORM);
      loadCodes();
    }
    setSaving(false);
  }

  async function toggleActive(code) {
    var { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !code.is_active })
      .eq('id', code.id);
    if (error) {
      toast.error('Failed to update status.');
    } else {
      mascotSuccessToast(code.is_active ? 'Code deactivated.' : 'Code activated.');
      loadCodes();
    }
  }

  async function deleteCode(codeId, codeText) {
    if (!window.confirm('Delete ' + codeText + '? This cannot be undone.')) return;
    var { error } = await supabase.from('discount_codes').delete().eq('id', codeId);
    if (error) {
      mascotErrorToast('Failed to delete code.');
    } else {
      mascotSuccessToast('Code deleted.');
      if (expandedCode === codeId) setExpandedCode(null);
      loadCodes();
    }
  }

  function copyCode(text) {
    navigator.clipboard.writeText(text).then(function () {
      mascotSuccessToast('Copied!', text + ' copied to clipboard.');
    });
  }

  function togglePlan(plan) {
    var plans = form.applicable_plans.slice();
    var idx = plans.indexOf(plan);
    if (idx === -1) { plans.push(plan); } else { plans.splice(idx, 1); }
    setForm(function (prev) { return Object.assign({}, prev, { applicable_plans: plans }); });
  }

  function getStatus(code) {
    var now = new Date();
    var expired = code.expires_at && new Date(code.expires_at) < now;
    var depleted = code.max_uses !== null && code.uses_count >= code.max_uses;
    if (!code.is_active) return { label: 'Inactive', color: '#64748B', bg: 'rgba(100,116,139,0.15)' };
    if (expired)         return { label: 'Expired',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    if (depleted)        return { label: 'Depleted', color: '#F5B731', bg: 'rgba(245,183,49,0.12)' };
    return { label: 'Active', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };
  }

  function formatValue(code) {
    if (code.type === 'percent_off') return code.value + '% off';
    if (code.type === 'months_free') return code.value + (code.value === 1 ? ' month' : ' months') + ' free';
    if (code.type === 'flat_off')    return '$' + code.value + ' off';
    return String(code.value);
  }

  function daysLeft(expiresAt) {
    if (!expiresAt) return null;
    return Math.ceil((new Date(expiresAt) - new Date()) / 86400000);
  }

  function expiryColor(days) {
    if (days === null) return '#64748B';
    if (days <= 0)  return '#EF4444';
    if (days <= 7)  return '#EF4444';
    if (days <= 30) return '#F5B731';
    return '#94A3B8';
  }

  function filteredCodes() {
    if (filterStatus === 'all') return codes;
    return codes.filter(function (c) { return getStatus(c).label.toLowerCase() === filterStatus; });
  }

  var filtered = filteredCodes();

  // ── Skeleton ──────────────────────────────────────────────────
  function SkeletonRow() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 96px', gap: '8px', padding: '14px 20px', borderBottom: '1px solid #2A3550', alignItems: 'center' }}>
        <div style={{ height: '14px', width: '100px', background: '#1E2845', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '80px',  background: '#1E2845', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '60px',  background: '#1E2845', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '40px',  background: '#1E2845', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '70px',  background: '#1E2845', borderRadius: '4px' }} />
        <div style={{ height: '20px', width: '56px',  background: '#1E2845', borderRadius: '99px' }} />
        <div style={{ height: '14px', width: '60px',  background: '#1E2845', borderRadius: '4px' }} />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Promo Codes</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: '4px 0 0' }}>
            Create discount codes for campaigns, conferences, and partner orgs. Never post codes publicly.
          </p>
        </div>
        <button
          onClick={function () { setShowCreate(!showCreate); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#3B82F6', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          aria-expanded={showCreate}
          aria-label="Create new promo code"
        >
          <Plus size={14} aria-hidden="true" />
          New Code
        </button>
      </div>

      {/* ── Create form ── */}
      {showCreate && (
        <div
          style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}
          role="region"
          aria-label="Create promo code form"
        >
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px' }}>New Promo Code</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

            {/* Code */}
            <div>
              <label htmlFor="pc-code" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Code <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  id="pc-code"
                  value={form.code}
                  onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { code: e.target.value.toUpperCase().replace(/\s/g, '') }); }); }}
                  placeholder="e.g. TOLEDO25"
                  maxLength={24}
                  style={{ flex: 1, background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '8px 12px', color: '#FFFFFF', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '2px' }}
                  aria-required="true"
                />
                <button
                  onClick={function () { setForm(function (p) { return Object.assign({}, p, { code: generateCode() }); }); }}
                  style={{ padding: '8px 10px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  aria-label="Generate random code"
                  title="Generate random code"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Campaign */}
            <div>
              <label htmlFor="pc-campaign" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Campaign Label
              </label>
              <input
                id="pc-campaign"
                value={form.campaign}
                onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { campaign: e.target.value }); }); }}
                placeholder="e.g. toledo_launch"
                list="campaign-suggestions"
                style={{ width: '100%', boxSizing: 'border-box', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px' }}
              />
              <datalist id="campaign-suggestions">
                {CAMPAIGN_SUGGESTIONS.map(function (s) { return <option key={s} value={s} />; })}
              </datalist>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="pc-type" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Discount Type <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                id="pc-type"
                value={form.type}
                onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { type: e.target.value }); }); }}
                style={{ width: '100%', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px' }}
                aria-required="true"
              >
                <option value="percent_off">Percent Off (%)</option>
                <option value="months_free">Months Free</option>
                <option value="flat_off">Flat Dollar Off ($)</option>
              </select>
            </div>

            {/* Value */}
            <div>
              <label htmlFor="pc-value" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                {form.type === 'percent_off' ? 'Percent (%)' : form.type === 'months_free' ? 'Number of Months' : 'Amount ($)'}
                <span aria-hidden="true" style={{ color: '#EF4444' }}> *</span>
              </label>
              <input
                id="pc-value"
                type="number"
                min="0"
                max={form.type === 'percent_off' ? 100 : undefined}
                value={form.value}
                onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { value: e.target.value }); }); }}
                placeholder={form.type === 'percent_off' ? '25' : form.type === 'months_free' ? '1' : '10'}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px' }}
                aria-required="true"
              />
            </div>

            {/* Max uses */}
            <div>
              <label htmlFor="pc-max" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Max Uses <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(blank = unlimited)</span>
              </label>
              <input
                id="pc-max"
                type="number"
                min="1"
                value={form.max_uses}
                onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { max_uses: e.target.value }); }); }}
                placeholder="e.g. 100"
                style={{ width: '100%', boxSizing: 'border-box', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px' }}
              />
            </div>

            {/* Expiry */}
            <div>
              <label htmlFor="pc-expires" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Expiration Date <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                id="pc-expires"
                type="date"
                value={form.expires_at}
                onChange={function (e) { setForm(function (p) { return Object.assign({}, p, { expires_at: e.target.value }); }); }}
                style={{ width: '100%', boxSizing: 'border-box', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '6px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Applicable plans */}
          <div style={{ marginTop: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Applicable Plans</p>
            <div style={{ display: 'flex', gap: '8px' }} role="group" aria-label="Select applicable plans">
              {['starter', 'growth', 'pro'].map(function (plan) {
                var on = form.applicable_plans.indexOf(plan) !== -1;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={function () { togglePlan(plan); }}
                    aria-pressed={on}
                    style={{
                      padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                      background: on ? 'rgba(59,130,246,0.15)' : 'transparent',
                      borderColor: on ? '#3B82F6' : '#2A3550',
                      color: on ? '#3B82F6' : '#64748B'
                    }}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '18px', justifyContent: 'flex-end' }}>
            <button
              onClick={function () { setShowCreate(false); setForm(BLANK_FORM); }}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2A3550', borderRadius: '8px', color: '#94A3B8', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ padding: '8px 18px', background: saving ? '#1E2845' : '#3B82F6', border: 'none', borderRadius: '8px', color: saving ? '#64748B' : '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              aria-busy={saving}
            >
              {saving ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {[
          { key: 'all',      label: 'All' },
          { key: 'active',   label: 'Active' },
          { key: 'expired',  label: 'Expired' },
          { key: 'inactive', label: 'Inactive' },
          { key: 'depleted', label: 'Depleted' },
        ].map(function (f) {
          var on = filterStatus === f.key;
          return (
            <button
              key={f.key}
              onClick={function () { setFilterStatus(f.key); }}
              aria-pressed={on}
              style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: on ? 'rgba(59,130,246,0.12)' : 'transparent',
                borderColor: on ? '#3B82F6' : '#2A3550',
                color: on ? '#3B82F6' : '#64748B'
              }}
            >
              {f.label}
              {f.key === 'all' && (
                <span style={{ marginLeft: '5px', fontSize: '10px', padding: '1px 6px', borderRadius: '99px', background: on ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.15)', color: on ? '#3B82F6' : '#64748B' }}>
                  {codes.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Codes table ── */}
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', overflow: 'hidden' }} role="table" aria-label="Promo codes">

        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 96px', gap: '8px', padding: '10px 20px', background: '#1E2845', borderBottom: '1px solid #2A3550' }} role="row">
          {['Code', 'Campaign', 'Discount', 'Uses', 'Expires', 'Status', 'Actions'].map(function (h) {
            return (
              <span key={h} role="columnheader" style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {h}
              </span>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div role="status" aria-label="Loading promo codes">
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '52px 24px', textAlign: 'center' }} role="status">
            <Tag size={32} color="#2A3550" aria-hidden="true" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: '#FFFFFF', fontWeight: 700, margin: '0 0 4px' }}>
              {filterStatus === 'all' ? 'No promo codes yet' : 'No ' + filterStatus + ' codes'}
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              {filterStatus === 'all'
                ? 'Create your first code to start tracking campaign signups.'
                : 'Try a different filter.'}
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map(function (code) {
          var status  = getStatus(code);
          var days    = daysLeft(code.expires_at);
          var isOpen  = expandedCode === code.id;

          return (
            <div key={code.id} role="rowgroup">

              {/* Main row */}
              <div
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 96px', gap: '8px', padding: '14px 20px', borderBottom: '1px solid #2A3550', alignItems: 'center', cursor: 'pointer' }}
                role="row"
                aria-expanded={isOpen}
                onClick={function () { toggleExpand(code.id); }}
                tabIndex={0}
                onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(code.id); } }}
              >

                {/* Code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} role="cell">
                  {isOpen
                    ? <ChevronDown size={13} color="#64748B" aria-hidden="true" />
                    : <ChevronRight size={13} color="#64748B" aria-hidden="true" />
                  }
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '1px' }}>{code.code}</span>
                  <button
                    onClick={function (e) { e.stopPropagation(); copyCode(code.code); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '3px' }}
                    aria-label={'Copy code ' + code.code}
                    title="Copy to clipboard"
                  >
                    <Copy size={11} aria-hidden="true" />
                  </button>
                </div>

                {/* Campaign */}
                <span role="cell" style={{ fontSize: '12px', color: '#94A3B8' }}>{code.campaign || '—'}</span>

                {/* Discount */}
                <span role="cell" style={{ fontSize: '12px', color: '#CBD5E1' }}>{formatValue(code)}</span>

                {/* Uses */}
                <div role="cell">
                  <span style={{ fontSize: '12px', color: '#CBD5E1' }}>{code.uses_count}</span>
                  {code.max_uses !== null
                    ? <span style={{ fontSize: '12px', color: '#64748B' }}>{' / ' + code.max_uses}</span>
                    : <span style={{ fontSize: '11px', color: '#64748B' }}> &infin;</span>
                  }
                </div>

                {/* Expires */}
                <div role="cell">
                  {code.expires_at ? (
                    <div>
                      <div style={{ fontSize: '12px', color: expiryColor(days) }}>
                        {new Date(code.expires_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '10px', color: expiryColor(days) }}>
                        {days === null ? '' : days > 0 ? days + 'd left' : 'Expired'}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#64748B' }}>No expiry</span>
                  )}
                </div>

                {/* Status */}
                <div role="cell">
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>

                {/* Actions */}
                <div
                  role="cell"
                  style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
                  onClick={function (e) { e.stopPropagation(); }}
                >
                  <button
                    onClick={function () { toggleActive(code); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: code.is_active ? '#22C55E' : '#64748B', padding: '5px', display: 'flex', alignItems: 'center', borderRadius: '5px' }}
                    aria-label={code.is_active ? 'Deactivate ' + code.code : 'Activate ' + code.code}
                    title={code.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {code.is_active
                      ? <ToggleRight size={17} aria-hidden="true" />
                      : <ToggleLeft  size={17} aria-hidden="true" />
                    }
                  </button>
                  <button
                    onClick={function () { deleteCode(code.id, code.code); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '5px', display: 'flex', alignItems: 'center', borderRadius: '5px' }}
                    aria-label={'Delete code ' + code.code}
                    title="Delete"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Expanded: org usage */}
              {isOpen && (
                <div style={{ background: '#0E1523', borderBottom: '1px solid #2A3550', padding: '16px 20px 16px 52px' }} role="region" aria-label={'Usage details for ' + code.code}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>
                    Organizations That Used This Code
                  </p>

                  {loadingUses[code.id] ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {[1, 2, 3].map(function (i) {
                        return <div key={i} style={{ width: '140px', height: '36px', background: '#1A2035', borderRadius: '6px' }} />;
                      })}
                    </div>
                  ) : !codeUses[code.id] || codeUses[code.id].length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>No organizations have used this code yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {codeUses[code.id].map(function (use) {
                        var org = use.organizations;
                        var initials = org ? org.name.substring(0, 2).toUpperCase() : '??';
                        return (
                          <div key={use.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: '#1A2035', borderRadius: '8px', border: '1px solid #2A3550' }}>
                            {org && org.logo_url ? (
                              <img src={org.logo_url} alt="" aria-hidden="true" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2A3550', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#94A3B8', flexShrink: 0 }}>
                                {initials}
                              </div>
                            )}
                            <div>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{org ? org.name : 'Unknown Org'}</p>
                              <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>
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

      {/* Distribution reminder */}
      <div style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Info size={14} color="#3B82F6" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
          <span style={{ color: '#3B82F6', fontWeight: 700 }}>Distribution rule:</span> Never display promo codes on the public pricing page. Distribute only through direct channels — conferences, partner emails, and referral links.
        </p>
      </div>

    </div>
  );
}