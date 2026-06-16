import { useState, useEffect } from 'react';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { getDiscoveryFilterTags } from '../lib/platformTags';

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
  var [tagSets, setTagSets] = useState({ causeAreas: [], audience: [], orgTypes: [], languages: [] });

  useEffect(function() {
    getDiscoveryFilterTags('org').then(function(t) { setTagSets(t); });
  }, []);

  function handleCauseArea(tag) {
    var current = filters.causeAreas || [];
    onFilterChange('causeAreas', current.includes(tag)
      ? current.filter(function(t) { return t !== tag; })
      : current.concat([tag]));
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

  function handleLanguageFilter(lang) {
    var current = filters.languagesServed || [];
    onFilterChange('languagesServed', current.includes(lang)
      ? current.filter(function(c) { return c !== lang; })
      : current.concat([lang]));
  }

  var selectedCatCount   = (filters.categories || []).length;
  var selectedCauseCount = (filters.causeAreas || []).length;
  var selectedLangCount  = (filters.languagesServed || []).length;
  var selectedOrgCount   = filters.orgType ? 1 : 0;
  var hasAny = selectedCatCount + selectedCauseCount + selectedLangCount + selectedOrgCount > 0
    || (filters.state && filters.state.length >= 2)
    || (filters.city && filters.city.length >= 2)
    || (filters.zip && filters.zip.length >= 3);

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

        {/* Location — always first, always visible (not collapsible) */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + sectionBdr }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '8px', paddingTop: '10px' }}>
            Location
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'filter-city',  key: 'city',  label: 'City',     ph: 'e.g. Toledo' },
              { id: 'filter-state', key: 'state', label: 'State',    ph: 'e.g. Ohio' },
              { id: 'filter-zip',   key: 'zip',   label: 'ZIP Code', ph: 'e.g. 43604' },
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
                    style={inp}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Cause Area */}
        <FilterSection id="filter-cause-area" label="Cause Area" count={selectedCauseCount}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }} role="group" aria-label="Cause Area">
            {tagSets.causeAreas.map(function(tag) {
              var active = (filters.causeAreas || []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={function() { handleCauseArea(tag); }}
                  style={{
                    padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: active ? 700 : 500,
                    border: '1px solid ' + (active ? '#3B82F6' : '#E2E8F0'),
                    background: active ? '#EFF6FF' : 'transparent',
                    color: active ? '#3B82F6' : '#475569',
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
        </FilterSection>

        {/* Audience Served */}
        <FilterSection id="filter-categories" label="Audience Served" count={selectedCatCount}>
          <div role="group" aria-label="Audience served" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tagSets.audience.map(function(cat) {
              return <CheckItem key={cat} checked={(filters.categories || []).includes(cat)} onChange={function() { handleCategory(cat); }} label={cat} />;
            })}
          </div>
        </FilterSection>

        {/* Organization Type */}
        <FilterSection id="filter-orgtype" label="Organization Type" count={selectedOrgCount}>
          <div role="group" aria-label="Organization type" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tagSets.orgTypes.map(function(type) {
              return <CheckItem key={type} checked={filters.orgType === type} onChange={function() { handleOrgType(type); }} label={type} />;
            })}
          </div>
        </FilterSection>

        {/* Languages Served */}
        <FilterSection id="filter-languages" label="Languages Served" count={selectedLangCount}>
          <div role="group" aria-label="Languages served" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tagSets.languages.map(function(l) {
              return <CheckItem key={l} checked={(filters.languagesServed || []).includes(l)} onChange={function() { handleLanguageFilter(l); }} label={l} />;
            })}
          </div>
        </FilterSection>

      </div>
    </aside>
  );
}