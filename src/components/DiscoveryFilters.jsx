import { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, X, Tag } from 'lucide-react';
import { t, SUPPORTED_LANGUAGES } from '../lib/discoveryTranslations';

var CATEGORIES = [
  { value: 'black',           label: 'Black' },
  { value: 'education',       label: 'Education' },
  { value: 'faith-based',     label: 'Faith-Based' },
  { value: 'food-assistance', label: 'Food Assistance' },
  { value: 'health',          label: 'Health & Wellness' },
  { value: 'housing',         label: 'Housing' },
  { value: 'latino',          label: 'Latino' },
  { value: 'lgbtq',           label: 'LGBTQ+' },
  { value: 'veteran',         label: 'Veteran Services' },
  { value: 'women',           label: 'Women' },
  { value: 'youth',           label: 'Youth & Families' },
];

var ORG_TYPES = [
  { value: 'nonprofit',       label: 'Nonprofit (501c3)' },
  { value: 'community_group', label: 'Community Group' },
  { value: 'association',     label: 'Association' },
  { value: 'religious',       label: 'Religious Organization' },
];

var LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ar', label: 'العربية' },
];

var sectionBdr = '#E5E7EB';

var inp = {
  width: '100%', background: '#FFFFFF', border: '1px solid #D1D5DB',
  borderRadius: '8px', padding: '8px 10px', fontSize: '13px', color: '#111827',
  boxSizing: 'border-box', outline: 'none',
};

function FilterSection({ id, label, count, children }) {
  var [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid ' + sectionBdr, paddingBottom: '12px' }}>
      <button
        id={id + '-toggle'}
        aria-expanded={open}
        aria-controls={id + '-panel'}
        onClick={function() { setOpen(function(p) { return !p; }); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 2px' }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731' }}>
          {label}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {count > 0 && (
            <span style={{ background: '#3B82F6', color: '#fff', borderRadius: '99px', fontSize: '10px', fontWeight: 700, padding: '1px 7px', lineHeight: 1.6 }}>
              {count}
            </span>
          )}
          <span style={{ color: '#94A3B8' }}>
            {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          </span>
        </span>
      </button>
      {open && (
        <div id={id + '-panel'} role="region" aria-labelledby={id + '-toggle'} style={{ marginTop: '10px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function CheckItem({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ width: '15px', height: '15px', accentColor: '#3B82F6', cursor: 'pointer', flexShrink: 0 }}
        aria-label={label}
        className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
      />
      <span style={{ fontSize: '13px', color: checked ? '#111827' : '#475569' }}>{label}</span>
    </label>
  );
}

export default function DiscoveryFilters({ lang, filters, onFilterChange, onReset }) {
  var [tagInput, setTagInput] = useState('');

  function handleTagKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      var val = tagInput.trim().replace(/,$/, '');
      if (!val) return;
      var current = filters.tags || [];
      if (!current.includes(val)) onFilterChange('tags', current.concat([val]));
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput) {
      var current = filters.tags || [];
      if (current.length > 0) onFilterChange('tags', current.slice(0, -1));
    }
  }

  function removeTag(tag) {
    onFilterChange('tags', (filters.tags || []).filter(function(t) { return t !== tag; }));
  }

  function handleCategory(cat) {
    var current = filters.categories || [];
    onFilterChange('categories', current.includes(cat)
      ? current.filter(function(c) { return c !== cat; })
      : current.concat([cat]));
  }

  function handleOrgType(type) {
    onFilterChange('orgType', filters.orgType === type ? '' : type);
  }

  function handleLanguageFilter(code) {
    var current = filters.languagesServed || [];
    onFilterChange('languagesServed', current.includes(code)
      ? current.filter(function(c) { return c !== code; })
      : current.concat([code]));
  }

  var selectedCatCount  = (filters.categories || []).length;
  var selectedLangCount = (filters.languagesServed || []).length;
  var selectedOrgCount  = filters.orgType ? 1 : 0;
  var hasAny = selectedCatCount + selectedLangCount + selectedOrgCount + (filters.tags || []).length > 0
    || filters.state || filters.city || filters.zip;

  return (
    <aside aria-label="Filters" style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523' }}>Filters</span>
        {hasAny && (
          <button
            onClick={onReset}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
            aria-label="Reset filters"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded hover:text-blue-700"
          >
            <RotateCcw size={11} aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Display Language */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + sectionBdr }}>
          <label htmlFor="ui-language" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '8px', paddingTop: '10px' }}>
            Display Language
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="ui-language"
              value={lang}
              onChange={function(e) { onFilterChange('uiLang', e.target.value); }}
              style={Object.assign({}, inp, { paddingRight: '28px', appearance: 'none', cursor: 'pointer' })}
              className="focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_LANGUAGES.map(function(l) {
                return <option key={l.code} value={l.code}>{l.label}</option>;
              })}
            </select>
            <ChevronDown size={13} color="#94A3B8" aria-hidden="true" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Keywords / Tags */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + sectionBdr }}>
          <label htmlFor="keyword-tags" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '8px', paddingTop: '10px' }}>
            Keywords / Tags
          </label>
          <div
            style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '5px', minHeight: '40px', alignItems: 'center', cursor: 'text' }}
            onClick={function() { document.getElementById('keyword-tags').focus(); }}
          >
            {(filters.tags || []).map(function(tag) {
              return (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DBEAFE', border: '1px solid #BFDBFE', color: '#1E40AF', borderRadius: '99px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
                  <Tag size={9} aria-hidden="true" />
                  {tag}
                  <button
                    onClick={function(e) { e.stopPropagation(); removeTag(tag); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1E40AF', padding: '0', display: 'flex', alignItems: 'center' }}
                    aria-label={'Remove keyword ' + tag}
                    className="focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full"
                  >
                    <X size={9} aria-hidden="true" />
                  </button>
                </span>
              );
            })}
            <input
              id="keyword-tags"
              type="text"
              value={tagInput}
              onChange={function(e) { setTagInput(e.target.value); }}
              onKeyDown={handleTagKeyDown}
              placeholder={(filters.tags || []).length === 0 ? 'Type and press Enter...' : ''}
              style={{ flex: 1, minWidth: '80px', background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: '#111827', padding: '2px 4px' }}
              aria-label="Add keyword tag"
            />
          </div>
          <p style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>Press Enter or comma to add</p>
        </div>

        {/* Location */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + sectionBdr }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '8px', paddingTop: '10px' }}>
            Location
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'filter-state', key: 'state', label: 'State',    ph: 'e.g. OH',    max: 2,  upper: true },
              { id: 'filter-city',  key: 'city',  label: 'City',     ph: 'e.g. Toledo' },
              { id: 'filter-zip',   key: 'zip',   label: 'ZIP Code', ph: 'e.g. 43604', max: 10 },
            ].map(function(f) {
              return (
                <div key={f.id}>
                  <label htmlFor={f.id} style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input
                    id={f.id}
                    type="text"
                    value={filters[f.key] || ''}
                    onChange={function(e) { onFilterChange(f.key, e.target.value); }}
                    placeholder={f.ph}
                    maxLength={f.max}
                    style={Object.assign({}, inp, f.upper ? { textTransform: 'uppercase' } : {})}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Audience Served */}
        <FilterSection id="filter-categories" label="Audience Served" count={selectedCatCount}>
          <div role="group" aria-label="Audience served" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CATEGORIES.map(function(cat) {
              return <CheckItem key={cat.value} checked={(filters.categories || []).includes(cat.value)} onChange={function() { handleCategory(cat.value); }} label={cat.label} />;
            })}
          </div>
        </FilterSection>

        {/* Organization Type */}
        <FilterSection id="filter-orgtype" label="Organization Type" count={selectedOrgCount}>
          <div role="group" aria-label="Organization type" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ORG_TYPES.map(function(type) {
              return <CheckItem key={type.value} checked={filters.orgType === type.value} onChange={function() { handleOrgType(type.value); }} label={type.label} />;
            })}
          </div>
        </FilterSection>

        {/* Languages Served */}
        <FilterSection id="filter-languages" label="Languages Served" count={selectedLangCount}>
          <div role="group" aria-label="Languages served" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {LANGUAGE_OPTIONS.map(function(l) {
              return <CheckItem key={l.code} checked={(filters.languagesServed || []).includes(l.code)} onChange={function() { handleLanguageFilter(l.code); }} label={l.label} />;
            })}
          </div>
        </FilterSection>

      </div>
    </aside>
  );
}