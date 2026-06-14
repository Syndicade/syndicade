import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import {
  DollarSign, Search, Calendar, ExternalLink, Mail,
  X, AlertCircle, Paperclip, SlidersHorizontal,
  BadgeCheck, ChevronDown
} from 'lucide-react';

// ── Tokens ────────────────────────────────────────────────────────────────────
var pageBg        = '#F8FAFC';
var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var elevatedBg    = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';
var textTertiary  = '#94A3B8';

// ── Constants ─────────────────────────────────────────────────────────────────
var FUNDING_TYPES = [
  { value: 'scholarship',    label: 'Scholarship' },
  { value: 'grant',          label: 'Grant' },
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'fellowship',     label: 'Fellowship' },
  { value: 'award',          label: 'Award / Recognition' },
  { value: 'other',          label: 'Other' },
];

var FUNDING_TYPE_COLORS = {
  scholarship:    { bg: '#EFF6FF', color: '#3B82F6' },
  grant:          { bg: '#F0FDF4', color: '#16A34A' },
  emergency_fund: { bg: '#FEF2F2', color: '#DC2626' },
  fellowship:     { bg: '#F5F3FF', color: '#8B5CF6' },
  award:          { bg: 'rgba(245,183,49,0.12)', color: '#B45309' },
  other:          { bg: '#F1F5F9', color: '#64748B' },
};

var CAUSE_AREA_TAGS = [
  'Animal Welfare', 'Arts & Culture', 'Civic Engagement', 'Civil Rights',
  'Community Building', 'Criminal Justice Reform', 'Disability Services',
  'Disaster Relief', 'Domestic Violence', 'Economic Development', 'Education',
  'Emergency Assistance', 'Employment & Workforce', 'Environment & Conservation',
  'Faith & Spirituality', 'Financial Literacy', 'Food Access', 'Food Security',
  'Health & Wellness', 'Homeless Services', 'Housing', 'Human Trafficking',
  'Immigration & Refugee Services', 'Language Access', 'Legal Aid', 'LGBTQ+ Rights',
  'Mental Health', 'Neighborhood Revitalization', 'Nutrition', 'Poverty Reduction',
  'Public Safety', 'Racial Equity', 'Senior Services', 'Substance Use Recovery',
  'Transportation Access', 'Veterans Services', 'Violence Prevention', 'Voting Rights',
  'Water Access', "Women's Rights", 'Workforce Development', 'Youth Development',
];

var AUDIENCE_TAGS = [
  'Adults (18+)', 'Black Community', 'Children (under 13)', 'English Learners',
  'Families', 'First-Generation Students', 'Foster Youth', 'General Public',
  'Immigrants & Refugees', 'Indigenous Communities', 'Justice-Involved Individuals',
  'Latino Community', 'LGBTQ+ Community', 'Low-Income Individuals', 'Men',
  'Older Adults (65+)', 'People with Disabilities', 'Rural Communities', 'Seniors',
  'Single Parents', 'Students', 'Survivors of Domestic Violence',
  'Unhoused Individuals', 'Veterans', 'Women', 'Youth (13-17)',
];

var LANGUAGE_TAGS = [
  'Arabic', 'Bengali', 'Bosnian', 'Burmese', 'Chinese (Cantonese)', 'Chinese (Mandarin)',
  'English', 'French', 'German', 'Greek', 'Haitian Creole', 'Hindi', 'Hmong',
  'Italian', 'Japanese', 'Karen', 'Khmer', 'Korean', 'Nepali', 'Polish',
  'Portuguese', 'Romanian', 'Russian', 'Somali',
];

// ── Format amount helper ──────────────────────────────────────────────────────
function formatAmount(item) {
  if (item.amount_type === 'varies') return 'Varies';
  if (item.amount_type === 'fixed' && item.amount_min) return '$' + Number(item.amount_min).toLocaleString();
  if (item.amount_type === 'range') {
    if (item.amount_min && item.amount_max) return '$' + Number(item.amount_min).toLocaleString() + ' - $' + Number(item.amount_max).toLocaleString();
    if (item.amount_min) return 'From $' + Number(item.amount_min).toLocaleString();
    if (item.amount_max) return 'Up to $' + Number(item.amount_max).toLocaleString();
  }
  return null;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FundingCardSkeleton() {
  return (
    <div
      style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '20px', marginBottom: '10px' }}
      aria-hidden="true"
      className="animate-pulse"
    >
      <div style={{ display: 'flex', gap: '14px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: elevatedBg, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '16px', width: '50%', background: elevatedBg, borderRadius: '6px', marginBottom: '8px' }} />
          <div style={{ height: '12px', width: '25%', background: elevatedBg, borderRadius: '6px', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <div style={{ height: '20px', width: '90px', background: elevatedBg, borderRadius: '99px' }} />
            <div style={{ height: '20px', width: '70px', background: elevatedBg, borderRadius: '99px' }} />
          </div>
          <div style={{ height: '12px', width: '90%', background: elevatedBg, borderRadius: '6px', marginBottom: '6px' }} />
          <div style={{ height: '12px', width: '65%', background: elevatedBg, borderRadius: '6px' }} />
        </div>
      </div>
    </div>
  );
}

// ── Sidebar filters ───────────────────────────────────────────────────────────
function FundFilterSection({ label, children, defaultOpen }) {
  var [open, setOpen] = useState(defaultOpen === true);
  return (
    <div style={{ borderBottom: '1px solid ' + borderColor, paddingBottom: '12px', marginBottom: '12px' }}>
      <button
        onClick={function() { setOpen(!open); }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: open ? '10px' : 0 }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        aria-expanded={open}
      >
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#F5B731', letterSpacing: '3px', textTransform: 'uppercase' }}>{label}</span>
        <ChevronDown size={13} style={{ color: textMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} aria-hidden="true" />
      </button>
      {open && children}
    </div>
  );
}

function SidebarFilters({ filters, onChange, onToggleTag, onReset, activeCount }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: 0 }}>
          Filters
          {activeCount > 0 && (
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 700, background: '#3B82F6', color: '#fff', borderRadius: '99px', padding: '1px 7px' }} aria-label={activeCount + ' active filters'}>
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button onClick={onReset} style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            Reset all
          </button>
        )}
      </div>

      {/* ── Location (always first, open by default) ── */}
      <FundFilterSection label="Location" defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            value={filters.city}
            onChange={function(e) { onChange('city', e.target.value); }}
            placeholder="City (e.g. Toledo)"
            style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '7px', fontSize: '13px', color: textPrimary, background: cardBg, outline: 'none', boxSizing: 'border-box' }}
            aria-label="Filter by city"
            className="focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={filters.state || ''}
            onChange={function(e) { onChange('state', e.target.value); }}
            placeholder="State (e.g. Ohio)"
            style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '7px', fontSize: '13px', color: textPrimary, background: cardBg, outline: 'none', boxSizing: 'border-box' }}
            aria-label="Filter by state"
            className="focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={filters.zip || ''}
            onChange={function(e) { onChange('zip', e.target.value); }}
            placeholder="ZIP Code"
            style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '7px', fontSize: '13px', color: textPrimary, background: cardBg, outline: 'none', boxSizing: 'border-box' }}
            aria-label="Filter by ZIP code"
            className="focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </FundFilterSection>

      {/* ── Deadline ── */}
      <FundFilterSection label="Deadline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { value: 'week',  label: 'Closing this week' },
            { value: 'month', label: 'Closing this month' },
            { value: 'open',  label: 'No deadline' },
          ].map(function(opt) {
            var checked = (filters.deadlines || []).includes(opt.value);
            return (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 0', fontSize: '13px', color: checked ? '#0E1523' : textSecondary }}>
                <input type="checkbox" checked={checked} onChange={function() { onToggleTag('deadlines', opt.value); }} style={{ width: '14px', height: '14px', accentColor: '#3B82F6', flexShrink: 0 }} aria-label={opt.label} className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-0" />
                {opt.label}
              </label>
            );
          })}
        </div>
      </FundFilterSection>

      {/* ── Funding Type ── */}
      <FundFilterSection label="Funding Type">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {FUNDING_TYPES.map(function(opt) {
            var checked = (filters.fundingTypes || []).includes(opt.value);
            return (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 0', fontSize: '13px', color: checked ? '#0E1523' : textSecondary }}>
                <input type="checkbox" checked={checked} onChange={function() { onToggleTag('fundingTypes', opt.value); }} style={{ width: '14px', height: '14px', accentColor: '#3B82F6', flexShrink: 0 }} aria-label={opt.label} className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-0" />
                {opt.label}
              </label>
            );
          })}
        </div>
      </FundFilterSection>

      {/* ── Cause Area ── */}
      <FundFilterSection label="Cause Area" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {CAUSE_AREA_TAGS.map(function(tag) {
            var active = filters.causeAreas.includes(tag);
            return (
              <button
                key={tag}
                onClick={function() { onToggleTag('causeAreas', tag); }}
                style={{
                  padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: active ? 700 : 500,
                  border: '1px solid ' + (active ? '#3B82F6' : borderColor),
                  background: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#3B82F6' : textSecondary,
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </FundFilterSection>

      {/* ── Audience Served ── */}
      <FundFilterSection label="Audience Served" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {AUDIENCE_TAGS.map(function(tag) {
            var checked = filters.audience.includes(tag);
            return (
              <label
                key={tag}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: checked ? '#3B82F6' : textSecondary, fontWeight: checked ? 700 : 400 }}
                className="hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={function() { onToggleTag('audience', tag); }}
                  style={{ accentColor: '#3B82F6', width: '13px', height: '13px', flexShrink: 0 }}
                  aria-label={tag}
                />
                {tag}
              </label>
            );
          })}
        </div>
      </FundFilterSection>

      {/* ── Languages ── */}
      <FundFilterSection label="Languages" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {LANGUAGE_TAGS.map(function(tag) {
            var checked = filters.languages.includes(tag);
            return (
              <label
                key={tag}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: checked ? '#3B82F6' : textSecondary, fontWeight: checked ? 700 : 400 }}
                className="hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={function() { onToggleTag('languages', tag); }}
                  style={{ accentColor: '#3B82F6', width: '13px', height: '13px', flexShrink: 0 }}
                  aria-label={tag}
                />
                {tag}
              </label>
            );
          })}
        </div>
      </FundFilterSection>
    </div>
  );
}

// ── Apply modal ───────────────────────────────────────────────────────────────
function ApplyModal({ item, onClose, currentUser }) {
  var [form, setForm] = useState({
    name: (currentUser && (currentUser.first_name || currentUser.last_name))
      ? ((currentUser.first_name || '') + ' ' + (currentUser.last_name || '')).trim()
      : '',
    email: (currentUser && currentUser.email) ? currentUser.email : '',
    message: '',
  });
  var [saving, setSaving]       = useState(false);
  var [submitted, setSubmitted] = useState(false);
  var [errors, setErrors]       = useState({});
  var firstFieldRef             = useRef(null);

  useEffect(function() {
    if (firstFieldRef.current) firstFieldRef.current.focus();
  }, []);

  useEffect(function() {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return function() { document.removeEventListener('keydown', handleKeyDown); };
  }, [onClose]);

  function setField(key, val) {
    setForm(function(prev) { var n = Object.assign({}, prev); n[key] = val; return n; });
    if (errors[key]) setErrors(function(prev) { var n = Object.assign({}, prev); delete n[key]; return n; });
  }

  function validate() {
    var errs = {};
    if (!form.name.trim()) errs.name = 'Your name is required.';
    if (!form.email.trim()) errs.email = 'Your email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    return errs;
  }

  async function handleSubmit() {
    var errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    var payload = {
      funding_id: item.id,
      organization_id: item.organization_id,
      applicant_name: form.name.trim(),
      applicant_email: form.email.trim(),
      message: form.message.trim() || null,
    };
    if (currentUser && currentUser.id) payload.user_id = currentUser.id;
    var r = await supabase.from('funding_applications').insert(payload);
    setSaving(false);
    if (r.error) {
      mascotErrorToast('Application failed.', 'Something went wrong. Please try again.');
      setErrors({ submit: 'Something went wrong. Please try again.' });
      return;
    }
    mascotSuccessToast('Application sent!', 'The organization will be in touch.');
    setSubmitted(true);
  }

  var inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, background: cardBg, boxSizing: 'border-box', outline: 'none' };
  var labelStyle = { fontSize: '12px', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '5px' };
  var errorStyle = { fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
      role="dialog" aria-modal="true" aria-labelledby="fund-apply-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: cardBg, borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + borderColor }}>
          <div>
            <h2 id="fund-apply-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, margin: 0 }}>Apply for Funding</h2>
            <p style={{ fontSize: '12px', color: textMuted, margin: '3px 0 0' }}>{item.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '4px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>Application Sent!</h3>
              <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6, marginBottom: '20px' }}>
                The organization will be in touch at <strong>{form.email}</strong>.
              </p>
              <button onClick={onClose} style={{ padding: '10px 24px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">Done</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="fund-apply-name" style={labelStyle}>Your Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                <input
                  ref={firstFieldRef}
                  id="fund-apply-name"
                  value={form.name}
                  onChange={function(e) { setField('name', e.target.value); }}
                  placeholder="Jane Smith"
                  style={Object.assign({}, inputStyle, errors.name ? { borderColor: '#EF4444' } : {})}
                  aria-required="true"
                  aria-describedby={errors.name ? 'fund-name-error' : undefined}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p id="fund-name-error" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.name}</p>}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="fund-apply-email" style={labelStyle}>Email Address <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                <input
                  id="fund-apply-email"
                  type="email"
                  value={form.email}
                  onChange={function(e) { setField('email', e.target.value); }}
                  placeholder="jane@example.com"
                  style={Object.assign({}, inputStyle, errors.email ? { borderColor: '#EF4444' } : {})}
                  aria-required="true"
                  aria-describedby={errors.email ? 'fund-email-error' : undefined}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <p id="fund-email-error" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.email}</p>}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="fund-apply-message" style={labelStyle}>Message <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span></label>
                <textarea
                  id="fund-apply-message"
                  value={form.message}
                  onChange={function(e) { setField('message', e.target.value); }}
                  placeholder="Tell the organization about yourself and why you're applying..."
                  rows={4}
                  style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.submit && <p style={Object.assign({}, errorStyle, { marginBottom: '12px' })} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.submit}</p>}
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ width: '100%', padding: '11px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit Application'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ item, orgName, onClose, onApply }) {
  var typeColor = FUNDING_TYPE_COLORS[item.funding_type] || FUNDING_TYPE_COLORS.other;
  var typeLabel = FUNDING_TYPES.find(function(t) { return t.value === item.funding_type; });
  var amount    = formatAmount(item);
  var isExpired = item.deadline && new Date(item.deadline) < new Date();

  useEffect(function() {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return function() { document.removeEventListener('keydown', handleKeyDown); };
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}
      role="dialog" aria-modal="true" aria-labelledby="fund-detail-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '520px', background: cardBg, height: '100%', overflowY: 'auto', boxShadow: '-4px 0 32px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 0, background: cardBg, zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <h2 id="fund-detail-title" style={{ fontSize: '20px', fontWeight: 800, color: textPrimary, margin: '0 0 4px', lineHeight: 1.3 }}>{item.title}</h2>
              <p style={{ fontSize: '13px', color: textMuted, margin: 0, fontWeight: 600 }}>{orgName}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '4px', flexShrink: 0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: typeColor.bg, color: typeColor.color }}>
              {typeLabel ? typeLabel.label : item.funding_type}
            </span>
            {amount && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: '#F0FDF4', color: '#16A34A' }}>{amount}</span>
            )}
            {item.deadline && !isExpired && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: elevatedBg, color: textMuted }}>
                Due {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {isExpired && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: '#FEF2F2', color: '#DC2626' }}>Closed</span>
            )}
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {amount && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DollarSign size={24} color="#16A34A" aria-hidden="true" />
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Award Amount</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#16A34A', margin: 0 }}>{amount}</p>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>About this Funding</h3>
            <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{item.description}</p>
          </div>

          {item.eligibility && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Eligibility</h3>
              <div style={{ background: pageBg, borderRadius: '10px', padding: '14px 16px', border: '1px solid ' + borderColor }}>
                <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{item.eligibility}</p>
              </div>
            </div>
          )}

          {item.tags && item.tags.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {item.tags.map(function(tag) {
                  return <span key={tag} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '99px', background: elevatedBg, color: textMuted, fontWeight: 600 }}>{tag}</span>;
                })}
              </div>
            </div>
          )}

          {item.posting_url && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: textPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Supporting Document</h3>
              <a
                href={item.posting_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: pageBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#3B82F6', textDecoration: 'none' }}
                className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Paperclip size={14} aria-hidden="true" />View Document<ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          )}

          <div style={{ borderTop: '1px solid ' + borderColor, paddingTop: '20px' }}>
            {!isExpired ? (
              item.apply_method === 'form' ? (
                <button
                  onClick={onApply}
                  style={{ width: '100%', padding: '13px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}
                  className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Apply for this Funding
                </button>
              ) : (
                <a
                  href={item.apply_url && item.apply_url.includes('@') ? 'mailto:' + item.apply_url : item.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', background: '#16A34A', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: 800, textDecoration: 'none', boxSizing: 'border-box' }}
                  className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {item.apply_url && item.apply_url.includes('@') ? <Mail size={16} aria-hidden="true" /> : <ExternalLink size={16} aria-hidden="true" />}
                  Apply Now
                </a>
              )
            ) : (
              <p style={{ fontSize: '13px', color: '#DC2626', fontWeight: 700, textAlign: 'center' }}>This funding opportunity has closed.</p>
            )}
            <p style={{ fontSize: '11px', color: textMuted, textAlign: 'center', marginTop: '10px' }}>Posted by a verified nonprofit on Syndicade</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Funding card ──────────────────────────────────────────────────────────────
function FundingCard({ item, orgName, onClick }) {
  var typeColor = FUNDING_TYPE_COLORS[item.funding_type] || FUNDING_TYPE_COLORS.other;
  var typeLabel = FUNDING_TYPES.find(function(t) { return t.value === item.funding_type; });
  var amount    = formatAmount(item);
  var isExpired = item.deadline && new Date(item.deadline) < new Date();
  var daysLeft  = item.deadline && !isExpired ? Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <article
      style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '18px 20px', cursor: 'pointer', boxShadow: '3px 4px 14px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)', height: '100%', boxSizing: 'border-box' }}
      onClick={onClick}
      onMouseEnter={function(e) { e.currentTarget.style.borderColor = '#BBF7D0'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
      onMouseLeave={function(e) { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.boxShadow = '3px 4px 14px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)'; }}
      role="button" tabIndex={0}
      onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={'View details for ' + item.title}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: typeColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
          <DollarSign size={18} color={typeColor.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: textPrimary, margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
            {daysLeft !== null && daysLeft <= 7 && (
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: '#FEF2F2', color: '#DC2626', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {daysLeft === 0 ? 'Last day' : daysLeft + 'd left'}
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: textMuted, margin: '0 0 10px', fontWeight: 600 }}>{orgName}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: typeColor.bg, color: typeColor.color }}>
              {typeLabel ? typeLabel.label : item.funding_type}
            </span>
            {amount && (
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', background: '#F0FDF4', color: '#16A34A' }}>{amount}</span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', borderTop: '1px solid ' + borderColor, paddingTop: '10px' }}>
            {item.deadline && !isExpired && (
              <span style={{ fontSize: '12px', color: textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} aria-hidden="true" />Due {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {item.posting_url && (
              <span style={{ fontSize: '12px', color: textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Paperclip size={11} aria-hidden="true" />Document attached
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>View details</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FundingDiscovery() {
  var [items, setItems]                         = useState([]);
  var [orgs, setOrgs]                           = useState({});
  var [loading, setLoading]                     = useState(true);
  var [error, setError]                         = useState(null);
  var [keyword, setKeyword]                     = useState('');
  var [debouncedKeyword, setDebouncedKeyword]   = useState('');
  var [filters, setFilters]                     = useState({
    fundingTypes: [], city: '', state: '', zip: '', deadlines: [],
    causeAreas: [], audience: [], languages: [],
  });
  var [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  var [selected, setSelected]                   = useState(null);
  var [applying, setApplying]                   = useState(null);
  var [currentUser, setCurrentUser]             = useState(null);
  var searchRef = useRef(null);

  useEffect(function() {
    var t = setTimeout(function() { setDebouncedKeyword(keyword); }, 300);
    return function() { clearTimeout(t); };
  }, [keyword]);

  useEffect(function() {
    loadItems();
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    var sessionRes = await supabase.auth.getSession();
    var session = sessionRes.data && sessionRes.data.session;
    if (!session) return;
    var userId = session.user.id;
    var profileRes = await supabase
      .from('members')
      .select('user_id,first_name,last_name')
      .eq('user_id', userId)
      .single();
    setCurrentUser({
      id: userId,
      email: session.user.email,
      first_name: profileRes.data ? profileRes.data.first_name : '',
      last_name: profileRes.data ? profileRes.data.last_name : '',
    });
  }

  async function loadItems() {
    setLoading(true);
    setError(null);
    var r = await supabase
      .from('org_funding')
      .select('*')
      .eq('visibility', 'public')
      .is('closed_at', null)
      .order('created_at', { ascending: false });

    if (r.error) { setError(r.error.message); setLoading(false); return; }

    var data = (r.data || []).filter(function(item) {
      if (!item.deadline) return true;
      return new Date(item.deadline) >= new Date();
    });

    setItems(data);

    var orgIds = Array.from(new Set(data.map(function(i) { return i.organization_id; })));
    if (orgIds.length > 0) {
      var orgRes = await supabase.from('organizations').select('id,name').in('id', orgIds);
      var map = {};
      (orgRes.data || []).forEach(function(o) { map[o.id] = o.name; });
      setOrgs(map);
    }
    setLoading(false);
  }

  function handleFilterChange(key, val) {
    setFilters(function(prev) { var n = Object.assign({}, prev); n[key] = val; return n; });
  }

  function handleToggleTag(key, tag) {
    setFilters(function(prev) {
      var current = prev[key] || [];
      var next = current.includes(tag)
        ? current.filter(function(t) { return t !== tag; })
        : current.concat(tag);
      var n = Object.assign({}, prev);
      n[key] = next;
      return n;
    });
  }

  function handleReset() {
    setFilters({ fundingTypes: [], city: '', state: '', zip: '', deadlines: [], causeAreas: [], audience: [], languages: [] });
    setKeyword('');
    if (searchRef.current) searchRef.current.focus();
  }

  var activeCount = (
    (filters.fundingTypes || []).length +
    (filters.city && filters.city.length >= 2 ? 1 : 0) +
    (filters.state && filters.state.length >= 2 ? 1 : 0) +
    (filters.zip && filters.zip.length >= 3 ? 1 : 0) +
    (filters.deadlines || []).length +
    filters.causeAreas.length +
    filters.audience.length +
    filters.languages.length +
    (keyword ? 1 : 0)
  );

  var filtered = items.filter(function(item) {
    var kw = debouncedKeyword.toLowerCase();
    var matchSearch = !kw ||
      item.title.toLowerCase().includes(kw) ||
      (item.description && item.description.toLowerCase().includes(kw)) ||
      (item.eligibility && item.eligibility.toLowerCase().includes(kw)) ||
      (orgs[item.organization_id] && orgs[item.organization_id].toLowerCase().includes(kw)) ||
      (item.tags && item.tags.some(function(t) { return t.toLowerCase().includes(kw); }));

    var matchType = (filters.fundingTypes || []).length === 0 || (filters.fundingTypes || []).includes(item.funding_type);
    var matchCity = !filters.city || (item.city && item.city.toLowerCase().includes(filters.city.toLowerCase()));
    var matchState = !filters.state || (item.state && item.state.toLowerCase().includes(filters.state.toLowerCase()));
    var matchZip = !filters.zip || (item.zip && item.zip.includes(filters.zip));

    var matchDeadline = true;
    if ((filters.deadlines || []).length > 0) {
      matchDeadline = (filters.deadlines || []).some(function(dl) {
        if (dl === 'week') { var weekOut = new Date(); weekOut.setDate(weekOut.getDate() + 7); return item.deadline && new Date(item.deadline) <= weekOut; }
        if (dl === 'month') { var monthOut = new Date(); monthOut.setMonth(monthOut.getMonth() + 1); return item.deadline && new Date(item.deadline) <= monthOut; }
        if (dl === 'open') { return !item.deadline; }
        return true;
      });
    }

    var matchCause = filters.causeAreas.length === 0 || filters.causeAreas.every(function(t) {
      return (item.tags || []).includes(t);
    });
    var matchAudience = filters.audience.length === 0 || filters.audience.every(function(t) {
      return (item.tags || []).includes(t);
    });
    var matchLanguages = filters.languages.length === 0 || filters.languages.every(function(t) {
      return (item.tags || []).includes(t);
    });

    return matchSearch && matchType && matchCity && matchState && matchZip && matchDeadline && matchCause && matchAudience && matchLanguages;
  });

  return (
    <>
      <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

        {/* Sticky search bar */}
        <div style={{ background: pageBg, borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 64, zIndex: 30 }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', flexShrink: 0 }}>
              <BadgeCheck size={13} color="#16A34A" aria-hidden="true" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>Verified Nonprofits</span>
            </div>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={keyword}
                onChange={function(e) { setKeyword(e.target.value); }}
                placeholder="Search scholarships, grants, organizations..."
                aria-label="Search funding opportunities"
                style={{ width: '100%', paddingLeft: '36px', paddingRight: keyword ? '36px' : '16px', paddingTop: '8px', paddingBottom: '8px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                className="focus:ring-2 focus:ring-blue-500"
              />
              {keyword && (
                <button onClick={function() { setKeyword(''); }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }} aria-label="Clear search" className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Mobile filter button with active count badge */}
            <button
              onClick={function() { setMobileFiltersOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: activeCount > 0 ? '#EFF6FF' : cardBg, border: '1px solid ' + (activeCount > 0 ? '#3B82F6' : borderColor), borderRadius: '8px', fontSize: '13px', color: activeCount > 0 ? '#3B82F6' : textSecondary, cursor: 'pointer', whiteSpace: 'nowrap' }}
              className="lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={'Open filters' + (activeCount > 0 ? ', ' + activeCount + ' active' : '')}
              aria-expanded={mobileFiltersOpen}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              Filters
              {activeCount > 0 && (
                <span style={{ background: '#3B82F6', color: '#fff', borderRadius: '99px', fontSize: '11px', fontWeight: 700, padding: '0px 6px', lineHeight: '18px' }} aria-hidden="true">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>

            {/* Desktop sidebar */}
            <div className="hidden lg:block" style={{ width: '256px', flexShrink: 0 }}>
              <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', position: 'sticky', top: 144 }}>
                <SidebarFilters
                  filters={filters}
                  onChange={handleFilterChange}
                  onToggleTag={handleToggleTag}
                  onReset={handleReset}
                  activeCount={activeCount}
                />
              </div>
            </div>

            {/* Mobile filter drawer */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={function() { setMobileFiltersOpen(false); }} aria-hidden="true" />
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '320px', maxWidth: '100%', background: cardBg, boxShadow: '4px 0 24px rgba(0,0,0,0.15)', overflowY: 'auto', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: 0 }}>Filters</h2>
                    <button onClick={function() { setMobileFiltersOpen(false); }} style={{ padding: '6px', borderRadius: '8px', color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close filters" className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <X size={18} />
                    </button>
                  </div>
                  <SidebarFilters
                    filters={filters}
                    onChange={handleFilterChange}
                    onToggleTag={handleToggleTag}
                    onReset={handleReset}
                    activeCount={activeCount}
                  />
                  <button onClick={function() { setMobileFiltersOpen(false); }} style={{ marginTop: '24px', width: '100%', padding: '10px', background: '#16A34A', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">Show Results</button>
                </div>
              </div>
            )}

            {/* Main content */}
            <main style={{ flex: 1, minWidth: 0 }} aria-label="Funding listings">
              <div style={{ marginBottom: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, margin: '0 0 4px' }}>Grants &amp; Scholarships</h1>
                <p style={{ color: textMuted, fontSize: '14px', margin: 0 }}>Funding opportunities from verified nonprofits — scholarships, grants, emergency funds, and more.</p>
              </div>

              {/* Active filter chips */}
              {(function() {
                var chips = [];
                var dlLabels = { week: 'Closing this week', month: 'Closing this month', open: 'No deadline' };
                (filters.fundingTypes || []).forEach(function(f) { var ft = FUNDING_TYPES.find(function(x) { return x.value === f; }); chips.push({ key: 'ft-' + f, label: ft ? ft.label : f, clear: function() { handleToggleTag('fundingTypes', f); } }); });
                (filters.deadlines || []).forEach(function(d) { chips.push({ key: 'dl-' + d, label: dlLabels[d] || d, clear: function() { handleToggleTag('deadlines', d); } }); });
                if (filters.city && filters.city.length >= 2) chips.push({ key: 'city', label: 'City: ' + filters.city, clear: function() { handleFilterChange('city', ''); } });
                if (filters.state && filters.state.length >= 2) chips.push({ key: 'state', label: 'State: ' + filters.state, clear: function() { handleFilterChange('state', ''); } });
                if (filters.zip && filters.zip.length >= 3) chips.push({ key: 'zip', label: 'ZIP: ' + filters.zip, clear: function() { handleFilterChange('zip', ''); } });
                (filters.causeAreas || []).forEach(function(t) { chips.push({ key: 'ca-' + t, label: t, clear: function() { handleToggleTag('causeAreas', t); } }); });
                (filters.audience || []).forEach(function(t) { chips.push({ key: 'au-' + t, label: t, clear: function() { handleToggleTag('audience', t); } }); });
                (filters.languages || []).forEach(function(t) { chips.push({ key: 'la-' + t, label: t, clear: function() { handleToggleTag('languages', t); } }); });
                if (chips.length === 0) return null;
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }} role='list' aria-label='Active filters'>
                    {chips.map(function(chip) {
                      return (
                        <span key={chip.key} role='listitem' style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#374151', borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 600 }}>
                          {chip.label}
                          <button onClick={chip.clear} aria-label={'Remove filter: ' + chip.label} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: '0' }} className='focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full'>
                            <X size={10} aria-hidden='true' />
                          </button>
                        </span>
                      );
                    })}
                    <button onClick={handleReset} style={{ fontSize: '11px', fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px' }} className='focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'>Clear all</button>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: textMuted, margin: 0 }} aria-live="polite" aria-atomic="true">
                  {!loading && !error && (filtered.length + ' ' + (filtered.length === 1 ? 'result' : 'results'))}
                </p>
              </div>

              {loading && (
                <div aria-label="Loading funding" aria-busy="true">
                  {[1,2,3,4,5,6].map(function(i) { return <FundingCardSkeleton key={i} />; })}
                </div>
              )}

              {!loading && error && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }} role="alert">
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <AlertCircle size={28} color="#EF4444" aria-hidden="true" />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Something went wrong</h2>
                  <p style={{ color: textMuted, fontSize: '14px', marginBottom: '24px' }}>{error}</p>
                  <button onClick={loadItems} style={{ padding: '10px 20px', background: '#16A34A', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">Try Again</button>
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
                  <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ width: '180px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>No funding listed yet</h2>
                  <p style={{ color: textMuted, fontSize: '14px', maxWidth: '400px', lineHeight: 1.6 }}>Verified nonprofits will post scholarships, grants, and funding here. Check back soon.</p>
                </div>
              )}

              {!loading && !error && items.length > 0 && filtered.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
                  <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ width: '180px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>No matches found</h2>
                  <p style={{ color: textMuted, fontSize: '14px', marginBottom: '24px' }}>Try adjusting your search or filters.</p>
                  <button onClick={handleReset} style={{ padding: '10px 20px', background: '#16A34A', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">Reset Filters</button>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Funding listings">
                  {filtered.map(function(item) {
                    return (
                      <div key={item.id} role="listitem">
                        <FundingCard item={item} orgName={orgs[item.organization_id] || 'Verified Nonprofit'} onClick={function() { setSelected(item); }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <p style={{ fontSize: '12px', color: textTertiary, textAlign: 'center', marginTop: '24px' }}>All funding is posted by verified nonprofits on Syndicade.</p>
              )}
            </main>
          </div>
        </div>
      </div>

      {selected && (
        <DetailDrawer
          item={selected}
          orgName={orgs[selected.organization_id] || 'Verified Nonprofit'}
          onClose={function() { setSelected(null); }}
          onApply={function() { setApplying(selected); }}
        />
      )}
      {applying && (
        <ApplyModal
          item={applying}
          currentUser={currentUser}
          onClose={function() { setApplying(null); }}
        />
      )}
    </>
  );
}