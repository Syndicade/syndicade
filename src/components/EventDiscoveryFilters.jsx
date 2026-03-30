import { useState } from 'react';
import { et, EVENT_SUPPORTED_LANGUAGES } from '../lib/eventDiscoveryTranslations';
import { useTheme } from '../context/ThemeContext';
import { X, Tag } from 'lucide-react';

var EVENT_TYPES = [
  'advocacy-event', 'blood-drive', 'clothing-drive', 'community-meeting',
  'cultural-event', 'education-workshop', 'faith-based-event', 'food-drive',
  'fundraiser', 'health-wellness', 'volunteer-opportunity', 'youth-event',
];

var AUDIENCE = [
  'black', 'families', 'general-public', 'lgbtq', 'latino',
  'seniors', 'veterans', 'women', 'youth',
];

var ORG_TYPES = ['association', 'community_group', 'nonprofit', 'religious'];

var LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ar', label: 'العربية' },
];

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function FilterSection({ id, label, count, metaClr, borderColor, children }) {
  var [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid ' + borderColor, paddingBottom: '12px' }}>
      <button
        id={id + '-toggle'} aria-expanded={open} aria-controls={id + '-panel'}
        onClick={function () { setOpen(function (p) { return !p; }); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 2px' }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#F5B731' }}>
          {label}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {count > 0 && (
            <span style={{ background: '#3B82F6', color: '#fff', borderRadius: '99px', fontSize: '10px', fontWeight: 700, padding: '1px 7px', lineHeight: 1.6 }}>
              {count}
            </span>
          )}
          <span style={{ color: metaClr }}>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
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

export default function EventDiscoveryFilters({ lang, filters, onFilterChange, onReset }) {
  var { isDark } = useTheme();
  var [tagInput, setTagInput] = useState('');

  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#1E2845'  : '#FFFFFF';
  var inputBorder   = isDark ? '#2A3550'  : '#D1D5DB';
  var inputTxt      = isDark ? '#CBD5E1'  : '#111827';
  var metaClr       = isDark ? '#64748B'  : '#94A3B8';
  var subLblClr     = isDark ? '#94A3B8'  : '#64748B';
  var tagPillBg     = isDark ? 'rgba(59,130,246,0.15)' : '#DBEAFE';
  var tagPillBdr    = isDark ? 'rgba(59,130,246,0.35)' : '#BFDBFE';
  var tagPillTxt    = isDark ? '#93C5FD'  : '#1E40AF';

  var inputStyle = {
    width: '100%', padding: '8px 12px', background: inputBg,
    border: '1px solid ' + inputBorder, borderRadius: '8px',
    fontSize: '13px', color: inputTxt, outline: 'none',
    boxSizing: 'border-box', transition: 'background 0.2s, border-color 0.2s',
  };

  /* tag handlers */
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
    onFilterChange('tags', (filters.tags || []).filter(function (t) { return t !== tag; }));
  }

  function handleMultiSelect(filterKey, value) {
    var current = filters[filterKey] || [];
    onFilterChange(filterKey, current.includes(value)
      ? current.filter(function (v) { return v !== value; })
      : current.concat([value]));
  }

  function handleSingleSelect(filterKey, value) {
    onFilterChange(filterKey, filters[filterKey] === value ? '' : value);
  }

  function CheckItem({ checked, onChange, label }) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={onChange}
          style={{ width: '15px', height: '15px', flexShrink: 0, accentColor: '#3B82F6', cursor: 'pointer' }}
          aria-label={label} className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-0" />
        <span style={{ fontSize: '13px', color: checked ? (isDark ? '#CBD5E1' : '#111827') : textSecondary }}>{label}</span>
      </label>
    );
  }

  var eventTypeCount = (filters.eventTypes || []).length;
  var audienceCount  = (filters.audience   || []).length;
  var langCount      = (filters.languages  || []).length;
  var orgTypeCount   = filters.orgType ? 1 : 0;
  var tagCount       = (filters.tags || []).length;

  return (
    <aside style={{ width: '100%', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }} aria-label={et(lang, 'filtersHeading')}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>{et(lang, 'filtersHeading')}</h2>
        <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          aria-label={et(lang, 'resetFilters')} className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
          <ResetIcon />{et(lang, 'resetFilters')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Display Language */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + borderColor }}>
          <label htmlFor="event-ui-language" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px', paddingTop: '10px' }}>
            Display Language
          </label>
          <div style={{ position: 'relative' }}>
            <select id="event-ui-language" value={lang} onChange={function (e) { onFilterChange('uiLang', e.target.value); }}
              style={Object.assign({}, inputStyle, { paddingRight: '32px', appearance: 'none', cursor: 'pointer' })}
              className="focus:ring-2 focus:ring-blue-500">
              {EVENT_SUPPORTED_LANGUAGES.map(function (l) { return <option key={l.code} value={l.code}>{l.label}</option>; })}
            </select>
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: metaClr, pointerEvents: 'none' }}>
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* ── Keywords / Tags ── */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + borderColor }}>
          <label htmlFor="event-keyword-tags" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px', paddingTop: '10px' }}>
            Keywords / Tags
          </label>
          <div
            style={{ background: inputBg, border: '1px solid ' + inputBorder, borderRadius: '8px', padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '5px', minHeight: '40px', alignItems: 'center', cursor: 'text', transition: 'background 0.2s' }}
            onClick={function () { document.getElementById('event-keyword-tags').focus(); }}
          >
            {(filters.tags || []).map(function (tag) {
              return (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: tagPillBg, border: '1px solid ' + tagPillBdr, color: tagPillTxt, borderRadius: '99px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
                  <Tag size={9} aria-hidden="true" />
                  {tag}
                  <button onClick={function (e) { e.stopPropagation(); removeTag(tag); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: tagPillTxt, padding: '0', display: 'flex', alignItems: 'center' }}
                    aria-label={'Remove keyword ' + tag} className="focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full">
                    <X size={9} aria-hidden="true" />
                  </button>
                </span>
              );
            })}
            <input id="event-keyword-tags" type="text" value={tagInput}
              onChange={function (e) { setTagInput(e.target.value); }}
              onKeyDown={handleTagKeyDown}
              placeholder={(filters.tags || []).length === 0 ? 'Type and press Enter...' : ''}
              style={{ flex: 1, minWidth: '80px', background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: inputTxt, padding: '2px 4px' }}
              aria-label="Add keyword tag" />
          </div>
          <p style={{ fontSize: '10px', color: subLblClr, marginTop: '4px' }}>Press Enter or comma to add</p>
        </div>

        {/* Location */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + borderColor }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px', paddingTop: '10px' }}>
            {et(lang, 'locationLabel')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'event-filter-state', key: 'state', label: et(lang, 'stateLabel'), placeholder: 'E.G. OH', maxLength: 2, upper: true },
              { id: 'event-filter-city',  key: 'city',  label: et(lang, 'cityLabel'),  placeholder: 'e.g. Toledo' },
              { id: 'event-filter-zip',   key: 'zip',   label: et(lang, 'zipLabel'),   placeholder: 'e.g. 43623', maxLength: 10 },
            ].map(function (f) {
              return (
                <div key={f.id}>
                  <label htmlFor={f.id} style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '4px' }}>{f.label}</label>
                  <input id={f.id} type="text" value={filters[f.key] || ''} onChange={function (e) { onFilterChange(f.key, e.target.value); }}
                    placeholder={f.placeholder} maxLength={f.maxLength}
                    style={Object.assign({}, inputStyle, f.upper ? { textTransform: 'uppercase' } : {})}
                    className="focus:ring-2 focus:ring-blue-500" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Date — collapsible */}
        <FilterSection id="filter-date" label={et(lang, 'dateLabel')} count={filters.dateRange ? 1 : 0} metaClr={metaClr} borderColor={borderColor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'dateLabel')}>
            {['today', 'thisWeek', 'thisMonth', 'customRange'].map(function (opt) {
              return (
                <CheckItem key={opt} checked={filters.dateRange === opt} onChange={function () { handleSingleSelect('dateRange', opt); }} label={et(lang, opt)} />
              );
            })}
            {filters.dateRange === 'customRange' && (
              <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {[{ id: 'date-from', key: 'dateFrom', label: et(lang, 'dateFrom') }, { id: 'date-to', key: 'dateTo', label: et(lang, 'dateTo') }].map(function (f) {
                  return (
                    <div key={f.id}>
                      <label htmlFor={f.id} style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '4px' }}>{f.label}</label>
                      <input id={f.id} type="date" value={filters[f.key] || ''} onChange={function (e) { onFilterChange(f.key, e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FilterSection>

        {/* Event Type — collapsible */}
        <FilterSection id="filter-event-type" label={et(lang, 'eventTypeLabel')} count={eventTypeCount} metaClr={metaClr} borderColor={borderColor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'eventTypeLabel')}>
            {EVENT_TYPES.map(function (type) {
              return <CheckItem key={type} checked={(filters.eventTypes || []).includes(type)} onChange={function () { handleMultiSelect('eventTypes', type); }} label={et(lang, type)} />;
            })}
          </div>
        </FilterSection>

        {/* Audience — collapsible */}
        <FilterSection id="filter-audience" label={et(lang, 'audienceLabel')} count={audienceCount} metaClr={metaClr} borderColor={borderColor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'audienceLabel')}>
            {AUDIENCE.map(function (a) {
              return <CheckItem key={a} checked={(filters.audience || []).includes(a)} onChange={function () { handleMultiSelect('audience', a); }} label={et(lang, a)} />;
            })}
          </div>
        </FilterSection>

        {/* Languages — collapsible */}
        <FilterSection id="filter-ev-languages" label={et(lang, 'languageLabel')} count={langCount} metaClr={metaClr} borderColor={borderColor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label="Languages Supported">
            {LANGUAGE_OPTIONS.map(function (l) {
              return <CheckItem key={l.code} checked={(filters.languages || []).includes(l.code)} onChange={function () { handleMultiSelect('languages', l.code); }} label={l.label} />;
            })}
          </div>
        </FilterSection>

        {/* Org Type — collapsible */}
        <FilterSection id="filter-ev-orgtype" label={et(lang, 'orgTypeLabel')} count={orgTypeCount} metaClr={metaClr} borderColor={borderColor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'orgTypeLabel')}>
            {ORG_TYPES.map(function (type) {
              return <CheckItem key={type} checked={filters.orgType === type} onChange={function () { handleSingleSelect('orgType', type); }} label={et(lang, type)} />;
            })}
          </div>
        </FilterSection>

        {/* Additional flags — collapsible */}
        <FilterSection id="filter-ev-additional" label={et(lang, 'additionalFilters')} count={[filters.requiresRsvp, filters.volunteerSignup, filters.donationDropoff].filter(Boolean).length} metaClr={metaClr} borderColor={borderColor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'additionalFilters')}>
            {[
              { key: 'requiresRsvp',    labelKey: 'rsvpRequired' },
              { key: 'volunteerSignup', labelKey: 'volunteerSignup' },
              { key: 'donationDropoff', labelKey: 'donationDropoff' },
            ].map(function (item) {
              return (
                <CheckItem key={item.key} checked={filters[item.key] === true}
                  onChange={function () { onFilterChange(item.key, filters[item.key] === true ? null : true); }}
                  label={et(lang, item.labelKey)} />
              );
            })}
          </div>
        </FilterSection>

      </div>
    </aside>
  );
}