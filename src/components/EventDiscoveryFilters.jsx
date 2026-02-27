import { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { et, EVENT_SUPPORTED_LANGUAGES } from '../lib/eventDiscoveryTranslations';

const EVENT_TYPES = [
  'advocacy-event', 'blood-drive', 'clothing-drive', 'community-meeting',
  'cultural-event', 'education-workshop', 'faith-based-event', 'food-drive',
  'fundraiser', 'health-wellness', 'volunteer-opportunity', 'youth-event',
];

const AUDIENCE = [
  'black', 'families', 'general-public', 'lgbtq', 'latino',
  'seniors', 'veterans', 'women', 'youth',
];

const ORG_TYPES = ['association', 'community_group', 'nonprofit', 'religious'];

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ar', label: 'العربية' },
];

const DATE_OPTIONS = ['today', 'thisWeek', 'thisMonth', 'customRange'];

export default function EventDiscoveryFilters({ lang, filters, onFilterChange, onReset }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function handleMultiSelect(filterKey, value) {
    const current = filters[filterKey] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(filterKey, updated);
  }

  function handleSingleSelect(filterKey, value) {
    onFilterChange(filterKey, filters[filterKey] === value ? '' : value);
  }

  return (
    <aside className="w-full" aria-label={et(lang, 'filtersHeading')}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          {et(lang, 'filtersHeading')}
        </h2>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={et(lang, 'resetFilters')}
        >
          <RotateCcw size={12} aria-hidden="true" />
          {et(lang, 'resetFilters')}
        </button>
      </div>

      <div className="space-y-5">

        {/* Display Language */}
        <div>
          <label htmlFor="event-ui-language" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Display Language
          </label>
          <div className="relative">
            <select
              id="event-ui-language"
              value={lang}
              onChange={(e) => onFilterChange('uiLang', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EVENT_SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

                      {/* Location */}
              <div>
                <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {et(lang, 'locationLabel')}
                </p>
                <div className="space-y-2">
                  <div>
                    <label htmlFor="event-filter-state" className="block text-xs text-gray-500 mb-1">{et(lang, 'stateLabel')}</label>
                    <input
                      id="event-filter-state"
                      type="text"
                      value={filters.state || ''}
                      onChange={(e) => onFilterChange('state', e.target.value)}
                      placeholder="e.g. OH"
                      maxLength={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-filter-city" className="block text-xs text-gray-500 mb-1">{et(lang, 'cityLabel')}</label>
                    <input
                      id="event-filter-city"
                      type="text"
                      value={filters.city || ''}
                      onChange={(e) => onFilterChange('city', e.target.value)}
                      placeholder="e.g. Toledo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="event-filter-zip" className="block text-xs text-gray-500 mb-1">{et(lang, 'zipLabel')}</label>
                    <input
                      id="event-filter-zip"
                      type="text"
                      value={filters.zip || ''}
                      onChange={(e) => onFilterChange('zip', e.target.value)}
                      placeholder="e.g. 43623"
                      maxLength={10}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

        {/* Date Filter */}
        <div>
          <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {et(lang, 'dateLabel')}
          </p>
          <div className="space-y-1.5" role="group" aria-label={et(lang, 'dateLabel')}>
            {DATE_OPTIONS.filter(d => d !== 'customRange').map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.dateRange === opt}
                  onChange={() => handleSingleSelect('dateRange', opt)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  aria-label={et(lang, opt)}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {et(lang, opt)}
                </span>
              </label>
            ))}
            {/* Custom Range */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.dateRange === 'customRange'}
                onChange={() => handleSingleSelect('dateRange', 'customRange')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                aria-label={et(lang, 'customRange')}
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {et(lang, 'customRange')}
              </span>
            </label>
            {filters.dateRange === 'customRange' && (
              <div className="pl-6 space-y-2 pt-1">
                <div>
                  <label htmlFor="date-from" className="block text-xs text-gray-500 mb-1">{et(lang, 'dateFrom')}</label>
                  <input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="date-to" className="block text-xs text-gray-500 mb-1">{et(lang, 'dateTo')}</label>
                  <input
                    id="date-to"
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => onFilterChange('dateTo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Type */}
        <div>
          <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {et(lang, 'eventTypeLabel')}
          </p>
          <div className="space-y-1.5" role="group" aria-label={et(lang, 'eventTypeLabel')}>
            {EVENT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(filters.eventTypes || []).includes(type)}
                  onChange={() => handleMultiSelect('eventTypes', type)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  aria-label={et(lang, type)}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {et(lang, type)}
                </span>
              </label>
            ))}
          </div>
        </div>


        {/* Advanced Filters Toggle */}
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-expanded={advancedOpen}
            aria-controls="advanced-filters"
          >
            {et(lang, 'advancedFilters')}
            {advancedOpen
              ? <ChevronUp size={15} aria-hidden="true" />
              : <ChevronDown size={15} aria-hidden="true" />
            }
          </button>

          {advancedOpen && (
            <div id="advanced-filters" className="space-y-5 mt-4">

              {/* Organization Type */}
              <div>
                <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {et(lang, 'orgTypeLabel')}
                </p>
                <div className="space-y-1.5" role="group" aria-label={et(lang, 'orgTypeLabel')}>
                  {ORG_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.orgType === type}
                        onChange={() => handleSingleSelect('orgType', type)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        aria-label={et(lang, type)}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {et(lang, type)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages Supported */}
              <div>
                <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {et(lang, 'languageLabel')}
                </p>
                <div className="space-y-1.5" role="group" aria-label={et(lang, 'Languages Supported')}>
                  {LANGUAGE_OPTIONS.map((l) => (
                    <label key={l.code} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={(filters.languages || []).includes(l.code)}
                        onChange={() => handleMultiSelect('languages', l.code)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        aria-label={l.label}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {l.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Audience */}
        <div>
          <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {et(lang, 'audienceLabel')}
          </p>
          <div className="space-y-1.5" role="group" aria-label={et(lang, 'audienceLabel')}>
            {AUDIENCE.map((a) => (
              <label key={a} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={(filters.audience || []).includes(a)}
                  onChange={() => handleMultiSelect('audience', a)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  aria-label={et(lang, a)}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {et(lang, a)}
                </span>
              </label>
            ))}
          </div>
        </div>

              {/* Additional Flags */}
              <div>
                <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {et(lang, 'additionalFilters')}
                </p>
                <div className="space-y-1.5" role="group" aria-label={et(lang, 'additionalFilters')}>
                  {[
                    { key: 'requiresRsvp', labelKey: 'rsvpRequired' },
                    { key: 'volunteerSignup', labelKey: 'volunteerSignup' },
                    { key: 'donationDropoff', labelKey: 'donationDropoff' },
                  ].map(({ key, labelKey }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters[key] === true}
                        onChange={() => onFilterChange(key, filters[key] === true ? null : true)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                        aria-label={et(lang, labelKey)}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {et(lang, labelKey)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </aside>
  );
}