import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getDiscoveryFilterTags } from '../lib/platformTags';
import { mascotErrorToast } from '../components/MascotToast';
import ProgramDiscoveryCard from '../components/ProgramDiscoveryCard';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BadgeCheck, Search, X, SlidersHorizontal, ChevronDown, AlertCircle } from 'lucide-react';

// ── Tokens ────────────────────────────────────────────────────
var pageBg        = '#F8FAFC';
var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var elevatedBg    = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// ── Constants ─────────────────────────────────────────────────
var PAGE_SIZE = 18;

var PROGRAM_TYPES = [
  'After-School Program',
  'Class / Course',
  'Distribution',
  'Job Training',
  'Support Group',
  'Training',
  'Workshop',
  'Youth Program',
  'Other',
];

var REACH_OPTIONS = [
  { value: 'local',    label: 'Local' },
  { value: 'state',    label: 'Statewide' },
  { value: 'national', label: 'National / Remote' },
];

var COST_OPTIONS = [
  { value: 'free',  label: 'Free' },
  { value: 'paid',  label: 'Paid' },
];

var EMPTY_FILTERS = {
  city: '', state: '', programType: '',
  reach: [], cost: [],
  causeAreas: [], audience: [], languages: [],
};

// ── Skeletons ─────────────────────────────────────────────────
function ProgramCardSkeleton() {
  return (
    <div
      style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      aria-hidden="true"
      className="animate-pulse"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: elevatedBg }} />
        <div style={{ height: '12px', width: '120px', background: elevatedBg, borderRadius: '4px' }} />
      </div>
      <div style={{ height: '18px', width: '65%', background: borderColor, borderRadius: '4px' }} />
      <div style={{ height: '20px', width: '60px', background: elevatedBg, borderRadius: '99px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ height: '12px', background: elevatedBg, borderRadius: '4px' }} />
        <div style={{ height: '12px', width: '85%', background: elevatedBg, borderRadius: '4px' }} />
        <div style={{ height: '12px', width: '70%', background: elevatedBg, borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid ' + borderColor }}>
        <div style={{ height: '11px', width: '80px', background: elevatedBg, borderRadius: '4px' }} />
        <div style={{ height: '28px', width: '96px', background: borderColor, borderRadius: '8px' }} />
      </div>
    </div>
  );
}

// ── Filter section ────────────────────────────────────────────
function FilterSection({ label, children, defaultOpen }) {
  var [open, setOpen] = useState(defaultOpen !== false);
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

// ── Sidebar ───────────────────────────────────────────────────
function SidebarFilters({ filters, onChange, onToggle, onReset, activeCount, tagSets }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: 0 }}>
          Filters
          {activeCount > 0 && (
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 700, background: '#8B5CF6', color: '#fff', borderRadius: '99px', padding: '1px 7px' }} aria-label={activeCount + ' active filters'}>
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            style={{ fontSize: '12px', fontWeight: 700, color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Location */}
      <FilterSection label="Location">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            value={filters.city}
            onChange={function(e) { onChange('city', e.target.value); }}
            placeholder="City (e.g. Toledo)"
            style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '7px', fontSize: '13px', color: textPrimary, background: cardBg, outline: 'none', boxSizing: 'border-box' }}
            aria-label="Filter by city"
            className="focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={filters.state}
            onChange={function(e) { onChange('state', e.target.value); }}
            placeholder="State (e.g. Ohio)"
            style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '7px', fontSize: '13px', color: textPrimary, background: cardBg, outline: 'none', boxSizing: 'border-box' }}
            aria-label="Filter by state"
            className="focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </FilterSection>

      {/* Program Type */}
      <FilterSection label="Program Type">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label htmlFor="prog-type-select" style={{ fontSize: '11px', color: textMuted, display: 'none' }}>Program Type</label>
          <select
            id="prog-type-select"
            value={filters.programType}
            onChange={function(e) { onChange('programType', e.target.value); }}
            style={{ width: '100%', padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '7px', fontSize: '13px', color: filters.programType ? textPrimary : textMuted, background: cardBg, outline: 'none', boxSizing: 'border-box' }}
            className="focus:ring-2 focus:ring-purple-500"
            aria-label="Filter by program type"
          >
            <option value="">All types</option>
            {PROGRAM_TYPES.map(function(t) {
              return <option key={t} value={t}>{t}</option>;
            })}
          </select>
        </div>
      </FilterSection>

      {/* Reach */}
      <FilterSection label="Reach" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {REACH_OPTIONS.map(function(opt) {
            var checked = filters.reach.includes(opt.value);
            return (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 0', fontSize: '13px', color: checked ? textPrimary : textSecondary }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={function() { onToggle('reach', opt.value); }}
                  style={{ width: '14px', height: '14px', accentColor: '#8B5CF6', flexShrink: 0 }}
                  aria-label={opt.label}
                  className="focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Cost */}
      <FilterSection label="Cost" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {COST_OPTIONS.map(function(opt) {
            var checked = filters.cost.includes(opt.value);
            return (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 0', fontSize: '13px', color: checked ? textPrimary : textSecondary }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={function() { onToggle('cost', opt.value); }}
                  style={{ width: '14px', height: '14px', accentColor: '#8B5CF6', flexShrink: 0 }}
                  aria-label={opt.label}
                  className="focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Cause Area */}
      <FilterSection label="Cause Area" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {tagSets.causeAreas.map(function(tag) {
            var active = filters.causeAreas.includes(tag);
            return (
              <button
                key={tag}
                onClick={function() { onToggle('causeAreas', tag); }}
                style={{ padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: active ? 700 : 500, border: '1px solid ' + (active ? '#8B5CF6' : borderColor), background: active ? 'rgba(139,92,246,0.1)' : 'transparent', color: active ? '#8B5CF6' : textSecondary, cursor: 'pointer', transition: 'all 0.1s' }}
                className="focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Audience Served */}
      <FilterSection label="Audience Served" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {tagSets.audience.map(function(tag) {
            var checked = filters.audience.includes(tag);
            return (
              <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: checked ? '#8B5CF6' : textSecondary, fontWeight: checked ? 700 : 400 }} className="hover:bg-slate-50">
                <input type="checkbox" checked={checked} onChange={function() { onToggle('audience', tag); }} style={{ accentColor: '#8B5CF6', width: '13px', height: '13px', flexShrink: 0 }} aria-label={tag} />
                {tag}
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Languages */}
      <FilterSection label="Languages" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {tagSets.languages.map(function(tag) {
            var checked = filters.languages.includes(tag);
            return (
              <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: checked ? '#8B5CF6' : textSecondary, fontWeight: checked ? 700 : 400 }} className="hover:bg-slate-50">
                <input type="checkbox" checked={checked} onChange={function() { onToggle('languages', tag); }} style={{ accentColor: '#8B5CF6', width: '13px', height: '13px', flexShrink: 0 }} aria-label={tag} />
                {tag}
              </label>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ProgramDiscovery() {
  var [session, setSession]               = useState(null);
  var [programs, setPrograms]             = useState([]);
  var [orgs, setOrgs]                     = useState({});
  var [loading, setLoading]               = useState(true);
  var [error, setError]                   = useState(null);
  var [keyword, setKeyword]               = useState('');
  var [debouncedKeyword, setDebouncedKeyword] = useState('');
  var [filters, setFilters]               = useState(EMPTY_FILTERS);
  var [tagSets, setTagSets]               = useState({ causeAreas: [], audience: [], languages: [] });
  var [verifiedOnly, setVerifiedOnly]     = useState(true);
  var [page, setPage]                     = useState(1);
  var [totalCount, setTotalCount]         = useState(0);
  var [savedPrograms, setSavedPrograms]   = useState(new Set());
  var [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  var searchRef = useRef(null);

  // Session
  useEffect(function() {
    supabase.auth.getSession().then(function(res) { setSession(res.data.session); });
    var sub = supabase.auth.onAuthStateChange(function(_e, s) { setSession(s); });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  // Saved programs
  useEffect(function() {
    if (!session) return;
    supabase.from('program_saves').select('program_id').eq('user_id', session.user.id)
      .then(function(res) {
        if (res.data) setSavedPrograms(new Set(res.data.map(function(r) { return r.program_id; })));
      });
  }, [session]);

  // Tags
  useEffect(function() {
    getDiscoveryFilterTags('program').then(function(t) { setTagSets(t); });
  }, []);

  // Debounce keyword
  useEffect(function() {
    var t = setTimeout(function() { setDebouncedKeyword(keyword); }, 300);
    return function() { clearTimeout(t); };
  }, [keyword]);

  // Reset page on filter change
  useEffect(function() { setPage(1); }, [debouncedKeyword, filters, verifiedOnly]);

  // Fetch
  var fetchPrograms = useCallback(async function() {
    setLoading(true);
    setError(null);
    try {
      var offset = (page - 1) * PAGE_SIZE;
      var query = supabase
        .from('org_programs')
        .select('*, organizations!inner(id, name, slug, logo_url, city, state, is_public, is_verified_nonprofit)', { count: 'exact' })
        .eq('is_public', true)
        .eq('registration_open', true)
        .eq('publish_to_discovery', true);

      if (verifiedOnly) query = query.eq('organizations.is_verified_nonprofit', true);
      if (filters.city && filters.city.length >= 2)   query = query.ilike('location_city', '%' + filters.city + '%');
      if (filters.state && filters.state.length >= 2)  query = query.ilike('location_state', '%' + filters.state + '%');
      if (filters.programType)                          query = query.eq('type', filters.programType);
      if (filters.reach.length > 0)                     query = query.in('reach', filters.reach);
      if (debouncedKeyword) {
        query = query.or('name.ilike.%' + debouncedKeyword + '%,description.ilike.%' + debouncedKeyword + '%');
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

      var res = await query;
      if (res.error) throw res.error;

      var data = (res.data || []).filter(function(p) { return p && p.id; });

      // Client-side filters: cost, causeAreas, audience, languages
      data = data.filter(function(p) {
        if (filters.cost.length > 0) {
          var isFree = !p.cost_type || p.cost_type === 'free';
          var wantFree = filters.cost.includes('free');
          var wantPaid = filters.cost.includes('paid');
          if (wantFree && !wantPaid && !isFree) return false;
          if (wantPaid && !wantFree && isFree) return false;
        }
        var tags = (p.tags || []).concat(p.audience || []);
        if (filters.causeAreas.length > 0 && !filters.causeAreas.every(function(t) { return tags.includes(t); })) return false;
        if (filters.audience.length > 0 && !filters.audience.every(function(t) { return tags.includes(t); })) return false;
        if (filters.languages.length > 0 && !filters.languages.every(function(t) { return tags.includes(t); })) return false;
        return true;
      });

      // Normalize org fields onto program object
      var normalized = data.map(function(p) {
        var org = p.organizations || {};
        return Object.assign({}, p, {
          org_name:                  org.name || '',
          org_slug:                  org.slug || '',
          org_logo_url:              org.logo_url || null,
          org_city:                  org.city || '',
          org_state:                 org.state || '',
          org_is_verified_nonprofit: org.is_verified_nonprofit || false,
        });
      });

      setPrograms(normalized);
      setTotalCount(res.count || normalized.length);
    } catch (err) {
      console.error('ProgramDiscovery fetch error:', err);
      setError(err.message || 'Failed to load programs');
      mascotErrorToast('Failed to load programs', 'Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedKeyword, filters, verifiedOnly]);

  useEffect(function() { fetchPrograms(); }, [fetchPrograms]);

  function handleFilterChange(key, val) {
    setFilters(function(prev) { var n = Object.assign({}, prev); n[key] = val; return n; });
  }

  function handleToggle(key, val) {
    setFilters(function(prev) {
      var current = prev[key] || [];
      var next = current.includes(val) ? current.filter(function(v) { return v !== val; }) : current.concat(val);
      var n = Object.assign({}, prev);
      n[key] = next;
      return n;
    });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setKeyword('');
    if (searchRef.current) searchRef.current.focus();
  }

  var activeCount = (
    (filters.city && filters.city.length >= 2 ? 1 : 0) +
    (filters.state && filters.state.length >= 2 ? 1 : 0) +
    (filters.programType ? 1 : 0) +
    filters.reach.length +
    filters.cost.length +
    filters.causeAreas.length +
    filters.audience.length +
    filters.languages.length +
    (keyword ? 1 : 0)
  );

  var totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Active filter chips
  function buildChips() {
    var chips = [];
    if (filters.city && filters.city.length >= 2) chips.push({ key: 'city', label: 'City: ' + filters.city, clear: function() { handleFilterChange('city', ''); } });
    if (filters.state && filters.state.length >= 2) chips.push({ key: 'state', label: 'State: ' + filters.state, clear: function() { handleFilterChange('state', ''); } });
    if (filters.programType) chips.push({ key: 'type', label: filters.programType, clear: function() { handleFilterChange('programType', ''); } });
    filters.reach.forEach(function(r) {
      var opt = REACH_OPTIONS.find(function(o) { return o.value === r; });
      chips.push({ key: 'reach-' + r, label: opt ? opt.label : r, clear: function() { handleToggle('reach', r); } });
    });
    filters.cost.forEach(function(c) {
      var opt = COST_OPTIONS.find(function(o) { return o.value === c; });
      chips.push({ key: 'cost-' + c, label: opt ? opt.label : c, clear: function() { handleToggle('cost', c); } });
    });
    filters.causeAreas.forEach(function(t) { chips.push({ key: 'ca-' + t, label: t, clear: function() { handleToggle('causeAreas', t); } }); });
    filters.audience.forEach(function(t) { chips.push({ key: 'au-' + t, label: t, clear: function() { handleToggle('audience', t); } }); });
    filters.languages.forEach(function(t) { chips.push({ key: 'la-' + t, label: t, clear: function() { handleToggle('languages', t); } }); });
    return chips;
  }

  var chips = buildChips();

  return (
    <>
      <Header />
      <main id="main-content">
        <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

          {/* Sticky search bar */}
          <div style={{ background: pageBg, borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 64, zIndex: 30 }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

              {/* Nonprofits / All toggle */}
              <div style={{ display: 'inline-flex', background: elevatedBg, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '3px', flexShrink: 0 }} role="group" aria-label="Organization type filter">
                <button
                  onClick={function() { setVerifiedOnly(true); }}
                  aria-pressed={verifiedOnly}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: verifiedOnly ? '#22C55E' : 'transparent', color: verifiedOnly ? '#FFFFFF' : textMuted }}
                  className="focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <BadgeCheck size={13} aria-hidden="true" />
                  Nonprofits
                </button>
                <button
                  onClick={function() { setVerifiedOnly(false); }}
                  aria-pressed={!verifiedOnly}
                  style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: !verifiedOnly ? '#8B5CF6' : 'transparent', color: !verifiedOnly ? '#FFFFFF' : textMuted }}
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  All
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={keyword}
                  onChange={function(e) { setKeyword(e.target.value); }}
                  placeholder="Search programs, organizations, or city..."
                  aria-label="Search programs"
                  style={{ width: '100%', paddingLeft: '36px', paddingRight: keyword ? '36px' : '16px', paddingTop: '8px', paddingBottom: '8px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                  className="focus:ring-2 focus:ring-purple-500"
                />
                {keyword && (
                  <button onClick={function() { setKeyword(''); }} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px' }} aria-label="Clear search" className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Mobile filter button */}
              <button
                onClick={function() { setMobileFiltersOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: activeCount > 0 ? 'rgba(139,92,246,0.08)' : cardBg, border: '1px solid ' + (activeCount > 0 ? '#8B5CF6' : borderColor), borderRadius: '8px', fontSize: '13px', color: activeCount > 0 ? '#8B5CF6' : textSecondary, cursor: 'pointer', whiteSpace: 'nowrap' }}
                className="lg:hidden focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={'Open filters' + (activeCount > 0 ? ', ' + activeCount + ' active' : '')}
                aria-expanded={mobileFiltersOpen}
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Filters
                {activeCount > 0 && (
                  <span style={{ background: '#8B5CF6', color: '#fff', borderRadius: '99px', fontSize: '11px', fontWeight: 700, padding: '0px 6px', lineHeight: '18px' }} aria-hidden="true">{activeCount}</span>
                )}
              </button>
            </div>
          </div>

          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>

              {/* Desktop sidebar */}
              <div className="hidden lg:block" style={{ width: '256px', flexShrink: 0 }}>
                <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', position: 'sticky', top: 144 }}>
                  <SidebarFilters filters={filters} onChange={handleFilterChange} onToggle={handleToggle} onReset={handleReset} activeCount={activeCount} tagSets={tagSets} />
                </div>
              </div>

              {/* Mobile filter drawer */}
              {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={function() { setMobileFiltersOpen(false); }} aria-hidden="true" />
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '320px', maxWidth: '100%', background: cardBg, boxShadow: '4px 0 24px rgba(0,0,0,0.15)', overflowY: 'auto', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: 0 }}>Filters</h2>
                      <button onClick={function() { setMobileFiltersOpen(false); }} style={{ padding: '6px', borderRadius: '8px', color: textMuted, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close filters" className="focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <X size={18} />
                      </button>
                    </div>
                    <SidebarFilters filters={filters} onChange={handleFilterChange} onToggle={handleToggle} onReset={handleReset} activeCount={activeCount} tagSets={tagSets} />
                    <button onClick={function() { setMobileFiltersOpen(false); }} style={{ marginTop: '24px', width: '100%', padding: '10px', background: '#8B5CF6', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      Show Results
                    </button>
                  </div>
                </div>
              )}

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }} aria-label="Program listings">

                <div style={{ marginBottom: '16px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: textPrimary, margin: '0 0 4px' }}>
                    {verifiedOnly ? 'Nonprofit Programs' : 'Community Programs'}
                  </h1>
                  <p style={{ color: textMuted, fontSize: '14px', margin: 0 }}>
                    {verifiedOnly
                      ? 'Ongoing programs from verified 501(c)(3) nonprofits — classes, workshops, services, and more.'
                      : 'Ongoing programs from community organizations near you.'}
                  </p>
                </div>

                {/* Active filter chips */}
                {chips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }} role="list" aria-label="Active filters">
                    {chips.map(function(chip) {
                      return (
                        <span key={chip.key} role="listitem" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: elevatedBg, border: '1px solid ' + borderColor, color: '#374151', borderRadius: '99px', padding: '3px 10px', fontSize: '11px', fontWeight: 600 }}>
                          {chip.label}
                          <button onClick={chip.clear} aria-label={'Remove filter: ' + chip.label} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center', padding: '0' }} className="focus:outline-none focus:ring-1 focus:ring-purple-400 rounded-full">
                            <X size={10} aria-hidden="true" />
                          </button>
                        </span>
                      );
                    })}
                    <button onClick={handleReset} style={{ fontSize: '11px', fontWeight: 600, color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px' }} className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">Clear all</button>
                  </div>
                )}

                {/* Result count */}
                <p style={{ fontSize: '14px', color: textMuted, margin: '0 0 16px' }} aria-live="polite" aria-atomic="true">
                  {!loading && !error && (programs.length + ' result' + (programs.length !== 1 ? 's' : ''))}
                </p>

                {/* Loading */}
                {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading programs" aria-busy="true">
                    {[1,2,3,4,5,6].map(function(i) { return <ProgramCardSkeleton key={i} />; })}
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }} role="alert">
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <AlertCircle size={28} color="#EF4444" aria-hidden="true" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Something went wrong</h2>
                    <p style={{ color: textMuted, fontSize: '14px', marginBottom: '24px', maxWidth: '360px' }}>{error}</p>
                    <button onClick={fetchPrograms} style={{ padding: '10px 20px', background: '#8B5CF6', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">Try Again</button>
                  </div>
                )}

                {/* Empty — no programs at all */}
                {!loading && !error && programs.length === 0 && activeCount === 0 && !keyword && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
                    <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ width: '200px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>No programs yet</h2>
                    <p style={{ color: textMuted, fontSize: '14px', maxWidth: '360px', lineHeight: 1.6 }}>
                      {verifiedOnly ? 'Try switching to All to see programs from all organizations.' : 'Nonprofits will post programs here. Check back soon.'}
                    </p>
                    {verifiedOnly && (
                      <button onClick={function() { setVerifiedOnly(false); }} style={{ marginTop: '20px', padding: '10px 20px', background: '#8B5CF6', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">Show All Programs</button>
                    )}
                  </div>
                )}

                {/* Empty — filters/search returned nothing */}
                {!loading && !error && programs.length === 0 && (activeCount > 0 || keyword) && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', textAlign: 'center' }}>
                    <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ width: '200px', height: 'auto', marginBottom: '16px', mixBlendMode: 'multiply' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>No matches found</h2>
                    <p style={{ color: textMuted, fontSize: '14px', marginBottom: '24px' }}>Try adjusting your search or filters.</p>
                    <button onClick={handleReset} style={{ padding: '10px 20px', background: '#8B5CF6', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500">Reset Filters</button>
                  </div>
                )}

                {/* Grid */}
                {!loading && !error && programs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Program listings">
                    {programs.map(function(program) {
                      return (
                        <div key={program.id} role="listitem">
                          <ProgramDiscoveryCard
                            program={program}
                            session={session}
                            initialSaved={savedPrograms.has(program.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {!loading && !error && totalPages > 1 && (
                  <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }} aria-label="Pagination">
                    <button
                      onClick={function() { setPage(function(p) { return Math.max(1, p - 1); }); }}
                      disabled={page === 1}
                      style={{ padding: '8px 16px', fontSize: '14px', border: '1px solid ' + borderColor, borderRadius: '8px', color: textSecondary, background: cardBg, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontWeight: 600 }}
                      aria-label="Previous page"
                      className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      Previous
                    </button>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {Array.from({ length: Math.min(5, totalPages) }, function(_, i) {
                        var pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = page - 2 + i;
                        var isActive = pageNum === page;
                        return (
                          <button
                            key={pageNum}
                            onClick={function() { setPage(pageNum); }}
                            style={{ width: '36px', height: '36px', fontSize: '14px', fontWeight: isActive ? 700 : 500, borderRadius: '8px', border: isActive ? 'none' : '1px solid ' + borderColor, background: isActive ? '#8B5CF6' : cardBg, color: isActive ? '#fff' : textSecondary, cursor: 'pointer' }}
                            aria-label={'Page ' + pageNum}
                            aria-current={isActive ? 'page' : undefined}
                            className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={function() { setPage(function(p) { return Math.min(totalPages, p + 1); }); }}
                      disabled={page === totalPages}
                      style={{ padding: '8px 16px', fontSize: '14px', border: '1px solid ' + borderColor, borderRadius: '8px', color: textSecondary, background: cardBg, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontWeight: 600 }}
                      aria-label="Next page"
                      className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      Next
                    </button>
                  </nav>
                )}

                {!loading && !error && programs.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', marginTop: '24px' }}>
                    All programs are posted by organizations on Syndicade.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}