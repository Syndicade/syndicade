import { useState } from 'react';
import { et, EVENT_SUPPORTED_LANGUAGES } from '../lib/eventDiscoveryTranslations';
import { useTheme } from '../context/ThemeContext';

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

function ResetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

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

export default function EventDiscoveryFilters({ lang, filters, onFilterChange, onReset }) {
  var { isDark } = useTheme();
  var [advancedOpen, setAdvancedOpen] = useState(false);

  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF' : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var textMuted     = isDark ? '#94A3B8' : '#64748B';
  var inputBg       = isDark ? '#0E1523' : '#F8FAFC';
  var labelColor    = isDark ? '#F5B731' : '#64748B';

  var inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: inputBg,
    border: '1px solid ' + borderColor,
    borderRadius: '8px',
    fontSize: '14px',
    color: textPrimary,
    outline: 'none',
    boxSizing: 'border-box',
  };

  var sectionLabelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: labelColor,
    textTransform: 'uppercase',
    letterSpacing: '4px',
    marginBottom: '8px',
  };

  function handleMultiSelect(filterKey, value) {
    var current = filters[filterKey] || [];
    var updated = current.includes(value)
      ? current.filter(function(v) { return v !== value; })
      : current.concat([value]);
    onFilterChange(filterKey, updated);
  }

  function handleSingleSelect(filterKey, value) {
    onFilterChange(filterKey, filters[filterKey] === value ? '' : value);
  }

  function CheckItem({ checked, onChange, label }) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ width: '16px', height: '16px', flexShrink: 0, accentColor: '#3B82F6' }}
          aria-label={label}
          className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
        <span style={{ fontSize: '14px', color: textSecondary }}>{label}</span>
      </label>
    );
  }

  return (
    <aside style={{ width: '100%' }} aria-label={et(lang, 'filtersHeading')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>
          {et(lang, 'filtersHeading')}
        </h2>
        <button
          onClick={onReset}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          aria-label={et(lang, 'resetFilters')}
          className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          <ResetIcon />
          {et(lang, 'resetFilters')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Display Language */}
        <div>
          <label htmlFor="event-ui-language" style={sectionLabelStyle}>Display Language</label>
          <div style={{ position: 'relative' }}>
            <select
              id="event-ui-language"
              value={lang}
              onChange={function(e) { onFilterChange('uiLang', e.target.value); }}
              style={Object.assign({}, inputStyle, { paddingRight: '32px', appearance: 'none' })}
              className="focus:ring-2 focus:ring-blue-500"
            >
              {EVENT_SUPPORTED_LANGUAGES.map(function(l) {
                return <option key={l.code} value={l.code}>{l.label}</option>;
              })}
            </select>
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }}>
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        {/* Location */}
        <div>
          <p style={sectionLabelStyle}>{et(lang, 'locationLabel')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'event-filter-state', key: 'state', label: et(lang, 'stateLabel'), placeholder: 'E.G. OH', maxLength: 2 },
              { id: 'event-filter-city',  key: 'city',  label: et(lang, 'cityLabel'),  placeholder: 'e.g. Toledo' },
              { id: 'event-filter-zip',   key: 'zip',   label: et(lang, 'zipLabel'),   placeholder: 'e.g. 43623', maxLength: 10 },
            ].map(function(f) {
              return (
                <div key={f.id}>
                  <label htmlFor={f.id} style={{ display: 'block', fontSize: '12px', color: textMuted, marginBottom: '4px' }}>{f.label}</label>
                  <input
                    id={f.id}
                    type="text"
                    value={filters[f.key] || ''}
                    onChange={function(e) { onFilterChange(f.key, e.target.value); }}
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    style={inputStyle}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div>
          <p style={sectionLabelStyle}>{et(lang, 'dateLabel')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'dateLabel')}>
            {['today', 'thisWeek', 'thisMonth', 'customRange'].map(function(opt) {
              return (
                <CheckItem
                  key={opt}
                  checked={filters.dateRange === opt}
                  onChange={function() { handleSingleSelect('dateRange', opt); }}
                  label={et(lang, opt)}
                />
              );
            })}
            {filters.dateRange === 'customRange' && (
              <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'date-from', key: 'dateFrom', label: et(lang, 'dateFrom') },
                  { id: 'date-to',   key: 'dateTo',   label: et(lang, 'dateTo') },
                ].map(function(f) {
                  return (
                    <div key={f.id}>
                      <label htmlFor={f.id} style={{ display: 'block', fontSize: '12px', color: textMuted, marginBottom: '4px' }}>{f.label}</label>
                      <input
                        id={f.id}
                        type="date"
                        value={filters[f.key] || ''}
                        onChange={function(e) { onFilterChange(f.key, e.target.value); }}
                        style={inputStyle}
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Event Type */}
        <div>
          <p style={sectionLabelStyle}>{et(lang, 'eventTypeLabel')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'eventTypeLabel')}>
            {EVENT_TYPES.map(function(type) {
              return (
                <CheckItem
                  key={type}
                  checked={(filters.eventTypes || []).includes(type)}
                  onChange={function() { handleMultiSelect('eventTypes', type); }}
                  label={et(lang, type)}
                />
              );
            })}
          </div>
        </div>

        {/* Advanced Filters */}
        <div style={{ borderTop: '1px solid ' + borderColor, paddingTop: '16px' }}>
          <button
            onClick={function() { setAdvancedOpen(function(v) { return !v; }); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '14px', fontWeight: 700, color: textPrimary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-expanded={advancedOpen}
            aria-controls="advanced-filters"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {et(lang, 'advancedFilters')}
            {advancedOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>

          {advancedOpen && (
            <div id="advanced-filters" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>

              {/* Org Type */}
              <div>
                <p style={sectionLabelStyle}>{et(lang, 'orgTypeLabel')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'orgTypeLabel')}>
                  {ORG_TYPES.map(function(type) {
                    return (
                      <CheckItem
                        key={type}
                        checked={filters.orgType === type}
                        onChange={function() { handleSingleSelect('orgType', type); }}
                        label={et(lang, type)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div>
                <p style={sectionLabelStyle}>{et(lang, 'languageLabel')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label="Languages Supported">
                  {LANGUAGE_OPTIONS.map(function(l) {
                    return (
                      <CheckItem
                        key={l.code}
                        checked={(filters.languages || []).includes(l.code)}
                        onChange={function() { handleMultiSelect('languages', l.code); }}
                        label={l.label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Audience */}
              <div>
                <p style={sectionLabelStyle}>{et(lang, 'audienceLabel')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'audienceLabel')}>
                  {AUDIENCE.map(function(a) {
                    return (
                      <CheckItem
                        key={a}
                        checked={(filters.audience || []).includes(a)}
                        onChange={function() { handleMultiSelect('audience', a); }}
                        label={et(lang, a)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Additional Flags */}
              <div>
                <p style={sectionLabelStyle}>{et(lang, 'additionalFilters')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'additionalFilters')}>
                  {[
                    { key: 'requiresRsvp',    labelKey: 'rsvpRequired' },
                    { key: 'volunteerSignup', labelKey: 'volunteerSignup' },
                    { key: 'donationDropoff', labelKey: 'donationDropoff' },
                  ].map(function(item) {
                    return (
                      <CheckItem
                        key={item.key}
                        checked={filters[item.key] === true}
                        onChange={function() { onFilterChange(item.key, filters[item.key] === true ? null : true); }}
                        label={et(lang, item.labelKey)}
                      />
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </aside>
  );
}