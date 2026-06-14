import { useState } from 'react';
import { et } from '../lib/eventDiscoveryTranslations';

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

var borderColor = '#E2E8F0';
var inputStyle = {
  width: '100%', padding: '8px 12px', background: '#FFFFFF',
  border: '1px solid #D1D5DB', borderRadius: '8px',
  fontSize: '13px', color: '#111827', outline: 'none',
  boxSizing: 'border-box',
};

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

function FilterSection({ id, label, count, children }) {
  var [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid ' + borderColor, paddingBottom: '12px' }}>
      <button
        id={id + '-toggle'}
        aria-expanded={open}
        aria-controls={id + '-panel'}
        onClick={function() { setOpen(function(p) { return !p; }); }}
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
          <span style={{ color: '#94A3B8' }}>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
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
        style={{ width: '15px', height: '15px', flexShrink: 0, accentColor: '#3B82F6', cursor: 'pointer' }}
        aria-label={label}
        className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
      />
      <span style={{ fontSize: '13px', color: checked ? '#0E1523' : '#475569' }}>{label}</span>
    </label>
  );
}

export default function EventDiscoveryFilters({ lang, filters, onFilterChange, onReset }) {
  function handleMultiSelect(filterKey, value) {
    var current = filters[filterKey] || [];
    onFilterChange(filterKey, current.includes(value)
      ? current.filter(function(v) { return v !== value; })
      : current.concat([value]));
  }

  function handleSingleSelect(filterKey, value) {
    onFilterChange(filterKey, filters[filterKey] === value ? '' : value);
  }

  function toggleCauseArea(tag) {
    var current = filters.causeAreas || [];
    onFilterChange('causeAreas', current.includes(tag)
      ? current.filter(function(t) { return t !== tag; })
      : current.concat([tag]));
  }

  var eventTypeCount  = (filters.eventTypes  || []).length;
  var audienceCount   = (filters.audience    || []).length;
  var langCount       = (filters.languages   || []).length;
  var orgTypeCount    = filters.orgType ? 1 : 0;
  var causeAreaCount  = (filters.causeAreas  || []).length;

  return (
    <aside style={{ width: '100%', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }} aria-label={et(lang, 'filtersHeading')}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523' }}>{et(lang, 'filtersHeading')}</h2>
        <button
          onClick={onReset}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          aria-label={et(lang, 'resetFilters')}
          className="hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          <ResetIcon />{et(lang, 'resetFilters')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Location — always first per UX/UI Standards §6 */}
        <div style={{ paddingBottom: '12px', borderBottom: '1px solid ' + borderColor }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px', paddingTop: '10px' }}>
            {et(lang, 'locationLabel')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'event-filter-state', key: 'state', label: et(lang, 'stateLabel'), placeholder: 'e.g. Ohio' },
              { id: 'event-filter-city',  key: 'city',  label: et(lang, 'cityLabel'),  placeholder: 'e.g. Toledo' },
              { id: 'event-filter-zip',   key: 'zip',   label: et(lang, 'zipLabel'),   placeholder: 'e.g. 43623', maxLength: 10 },
            ].map(function(f) {
              return (
                <div key={f.id}>
                  <label htmlFor={f.id} style={{ display: 'block', fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{f.label}</label>
                  <input
                    id={f.id}
                    type="text"
                    value={filters[f.key] || ''}
                    onChange={function(e) { onFilterChange(f.key, e.target.value); }}
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    style={Object.assign({}, inputStyle, f.upper ? { textTransform: 'uppercase' } : {})}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <FilterSection id="filter-date" label={et(lang, 'dateLabel')} count={filters.dateRange ? 1 : 0}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'dateLabel')}>
            {['today', 'thisWeek', 'thisMonth', 'customRange'].map(function(opt) {
              return <CheckItem key={opt} checked={filters.dateRange === opt} onChange={function() { handleSingleSelect('dateRange', opt); }} label={et(lang, opt)} />;
            })}
            {filters.dateRange === 'customRange' && (
              <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {[{ id: 'date-from', key: 'dateFrom', label: et(lang, 'dateFrom') }, { id: 'date-to', key: 'dateTo', label: et(lang, 'dateTo') }].map(function(f) {
                  return (
                    <div key={f.id}>
                      <label htmlFor={f.id} style={{ display: 'block', fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{f.label}</label>
                      <input id={f.id} type="date" value={filters[f.key] || ''} onChange={function(e) { onFilterChange(f.key, e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FilterSection>

        {/* Event Type */}
        <FilterSection id="filter-event-type" label={et(lang, 'eventTypeLabel')} count={eventTypeCount}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'eventTypeLabel')}>
            {EVENT_TYPES.map(function(type) {
              return <CheckItem key={type} checked={(filters.eventTypes || []).includes(type)} onChange={function() { handleMultiSelect('eventTypes', type); }} label={et(lang, type)} />;
            })}
          </div>
        </FilterSection>

        {/* Cause Area — chip style, client-side filter on cause_areas column */}
        <FilterSection id="filter-cause-area" label="Cause Area" count={causeAreaCount}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }} role="group" aria-label="Cause Area">
            {CAUSE_AREA_TAGS.map(function(tag) {
              var active = (filters.causeAreas || []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={function() { toggleCauseArea(tag); }}
                  style={{
                    padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: active ? 700 : 500,
                    border: '1px solid ' + (active ? '#3B82F6' : borderColor),
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

        {/* Audience */}
        <FilterSection id="filter-audience" label={et(lang, 'audienceLabel')} count={audienceCount}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'audienceLabel')}>
            {AUDIENCE.map(function(a) {
              return <CheckItem key={a} checked={(filters.audience || []).includes(a)} onChange={function() { handleMultiSelect('audience', a); }} label={et(lang, a)} />;
            })}
          </div>
        </FilterSection>

        {/* Languages */}
        <FilterSection id="filter-ev-languages" label={et(lang, 'languageLabel')} count={langCount}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label="Languages Supported">
            {LANGUAGE_OPTIONS.map(function(l) {
              return <CheckItem key={l.code} checked={(filters.languages || []).includes(l.code)} onChange={function() { handleMultiSelect('languages', l.code); }} label={l.label} />;
            })}
          </div>
        </FilterSection>

        {/* Org Type */}
        <FilterSection id="filter-ev-orgtype" label={et(lang, 'orgTypeLabel')} count={orgTypeCount}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'orgTypeLabel')}>
            {ORG_TYPES.map(function(type) {
              return <CheckItem key={type} checked={filters.orgType === type} onChange={function() { handleSingleSelect('orgType', type); }} label={et(lang, type)} />;
            })}
          </div>
        </FilterSection>

        {/* Additional flags */}
        <FilterSection id="filter-ev-additional" label={et(lang, 'additionalFilters')} count={[filters.requiresRsvp, filters.volunteerSignup, filters.donationDropoff].filter(Boolean).length}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="group" aria-label={et(lang, 'additionalFilters')}>
            {[
              { key: 'requiresRsvp',    labelKey: 'rsvpRequired' },
              { key: 'volunteerSignup', labelKey: 'volunteerSignup' },
              { key: 'donationDropoff', labelKey: 'donationDropoff' },
            ].map(function(item) {
              return (
                <CheckItem key={item.key} checked={filters[item.key] === true}
                  onChange={function() { onFilterChange(item.key, filters[item.key] === true ? null : true); }}
                  label={et(lang, item.labelKey)} />
              );
            })}
          </div>
        </FilterSection>

      </div>
    </aside>
  );
}