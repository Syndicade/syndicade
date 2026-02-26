import { RotateCcw, ChevronDown } from 'lucide-react';
import { t, SUPPORTED_LANGUAGES } from '../lib/discoveryTranslations';

const CATEGORIES = [
  'black', 'education', 'faith-based', 'food-assistance',
  'health', 'housing', 'latino', 'lgbtq',
  'veteran', 'women', 'youth',
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

export default function DiscoveryFilters({ lang, filters, onFilterChange, onReset }) {
  function handleCategory(cat) {
    const current = filters.categories || [];
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    onFilterChange('categories', updated);
  }

  function handleOrgType(type) {
    onFilterChange('orgType', filters.orgType === type ? '' : type);
  }

  function handleLanguageFilter(code) {
    const current = filters.languagesServed || [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    onFilterChange('languagesServed', updated);
  }

  return (
    <aside className="w-full" aria-label={t(lang, 'filtersHeading')}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          {t(lang, 'filtersHeading')}
        </h2>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={t(lang, 'resetFilters')}
        >
          <RotateCcw size={12} aria-hidden="true" />
          {t(lang, 'resetFilters')}
        </button>
      </div>

      <div className="space-y-5">

        {/* Display Language */}
        <div>
          <label htmlFor="ui-language" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Display Language
          </label>
          <div className="relative">
            <select
              id="ui-language"
              value={lang}
              onChange={(e) => onFilterChange('uiLang', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
          </div>
        </div>

        {/* State */}
        <div>
          <label htmlFor="filter-state" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {t(lang, 'stateLabel')}
          </label>
          <input
            id="filter-state"
            type="text"
            value={filters.state}
            onChange={(e) => onFilterChange('state', e.target.value)}
            placeholder="e.g. TX"
            maxLength={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          />
        </div>

        {/* City */}
        <div>
          <label htmlFor="filter-city" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {t(lang, 'cityLabel')}
          </label>
          <input
            id="filter-city"
            type="text"
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            placeholder="e.g. Dallas"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* County */}
        <div>
          <label htmlFor="filter-county" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {t(lang, 'countyLabel')}
          </label>
          <input
            id="filter-county"
            type="text"
            value={filters.county}
            onChange={(e) => onFilterChange('county', e.target.value)}
            placeholder="e.g. Dallas County"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* ZIP */}
        <div>
          <label htmlFor="filter-zip" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {t(lang, 'zipLabel')}
          </label>
          <input
            id="filter-zip"
            type="text"
            value={filters.zip}
            onChange={(e) => onFilterChange('zip', e.target.value)}
            placeholder="e.g. 75001"
            maxLength={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Categories */}
        <div>
          <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t(lang, 'categoriesLabel')}
          </p>
          <div className="space-y-1.5" role="group" aria-label={t(lang, 'categoriesLabel')}>
            {CATEGORIES.map((cat) => {
              const checked = (filters.categories || []).includes(cat);
              return (
                <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleCategory(cat)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    aria-label={t(lang, cat)}
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {t(lang, cat)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Organization Type */}
        <div>
          <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t(lang, 'orgTypeLabel')}
          </p>
          <div className="space-y-1.5" role="group" aria-label={t(lang, 'orgTypeLabel')}>
            {ORG_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.orgType === type}
                  onChange={() => handleOrgType(type)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  aria-label={t(lang, type)}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {t(lang, type)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Languages Served */}
        <div>
          <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {t(lang, 'languageFilterLabel')}
          </p>
          <div className="space-y-1.5" role="group" aria-label={t(lang, 'languageFilterLabel')}>
            {LANGUAGE_OPTIONS.map((l) => {
              const checked = (filters.languagesServed || []).includes(l.code);
              return (
                <label key={l.code} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleLanguageFilter(l.code)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    aria-label={l.label}
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {l.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
}