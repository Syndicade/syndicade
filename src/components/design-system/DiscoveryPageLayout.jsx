import { useState, useRef, cloneElement } from 'react';
import { Search } from 'lucide-react';
import { Button } from './Button';
import { Chip } from './Chip';
import { mascotErrorToast } from '../MascotToast';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';

/**
 * DiscoveryPageLayout
 *
 * Public discovery page shell per Syndicade Design System §13.2.
 * Used by: /discover, /explore, /programs, /opportunities, /funding.
 *
 * Distinct from ListPageLayout — this is a REAL fixed 200px sidebar with
 * checkbox groups (§10 "Public discovery pages" order), not an inline
 * wrapping filter row. Does NOT use the shared PageHeader (own hero header
 * instead, per §13.2 item 1).
 *
 * Filter order, per §10:
 *   1. Location (city/zip + "Use my location" + Reach chips)
 *   2. Date/Deadline
 *   3. Type/Category (page-specific — Event Type / Role Type / Funding Type / Org Type)
 *   4. Audience served (checkboxes)
 *   5. Languages (checkboxes)
 *   6. Additional filters (page-specific, collapsible)
 *
 * Mobile (§13.7 — confirmed this applies to Discovery's literal sidebar):
 * sidebar collapses to a "Filters (N active)" trigger above the search bar,
 * opening a full-width bottom drawer with the same content.
 *
 * ASSUMPTIONS FLAGGED FOR REVIEW:
 * 1. Discovery hero badge filename is not specified anywhere in the docs
 *    (§5's mascot table names every other asset except this one — it just
 *    says "one shared generic small badge"). Using a placeholder path
 *    "/mascot-discovery-badge.png" below — please confirm the real filename
 *    (or tell me which existing asset doubles as this badge).
 * 2. Hero badge size: §5 only defines Hero (280-320px) / Empty state
 *    (200-240px) / Loading (180px) sizes — none labeled "small badge" for a
 *    hero context. Using 64px as a reasonable "small" size; flag if wrong.
 * 3. Type/Category treated as multi-select checkboxes, matching the visual
 *    treatment of Audience/Languages immediately below it in the same list —
 *    §10 doesn't explicitly state single vs. multi-select for this one.
 * 4. "Custom" date range: §10 lists it as an option but doesn't specify a
 *    UI for the actual range inputs. Exposed via `customDateRangeContent`
 *    (page-supplied) shown only when the active Date filter is custom,
 *    rather than building an undefined date-range picker here.
 * 5. "Additional filters" disclosure uses a text-label toggle ("Show
 *    additional filters" / "Hide additional filters"), not a chevron icon —
 *    a generic disclosure chevron isn't in the §3 icon allowlist.
 * 6. Card grid reuses the standard `repeat(auto-fit, minmax(280px, 1fr))`
 *    3/2/1-col pattern (§8/§13.7) since §13.2 doesn't specify a different one.
 * 7. Loading skeleton: §9's Card.jsx (List Card) consumer list does not
 *    include Discovery's public cards, so this does NOT use the shared
 *    CardSkeleton. Instead the page passes its own `loadingSkeleton` example
 *    node (e.g. <EventCardSkeleton /> from Skeletons.jsx) to repeat.
 *
 * Props:
 * - title, subtitle                         -> hero header (NOT PageHeader)
 * - searchValue, onSearchChange, searchPlaceholder, searchLabel
 * - resultCount: number
 * - locationValue, onLocationChange, locationPlaceholder, onUseMyLocation(coords)
 * - reachOptions: [string] (default Near me/Statewide/National/All), activeReach, onReachChange
 * - dateFilterOptions: [{key,label}] (default Today/This week/This month/Custom),
 *   activeDateFilter, onDateFilterChange, customDateRangeContent: ReactNode
 * - typeFilterLabel (e.g. "Event Type"), typeFilterOptions: [{key,label}],
 *   activeTypeFilters: [string], onTypeFilterChange
 * - audienceOptions: [string] (default Group 2 full list), activeAudienceFilters,
 *   onAudienceFilterChange
 * - languageOptions: [string] (default Group 7 full list), activeLanguageFilters,
 *   onLanguageFilterChange
 * - additionalFiltersLabel (default "Additional filters"), additionalFilters: ReactNode,
 *   defaultAdditionalFiltersOpen: bool
 * - onResetAll
 * - status: 'loading' | 'error' | 'empty' | 'no-results' | 'ready'
 * - onRetry, onClearFilters
 * - emptyStateConfig: { heading, description, primaryActionLabel, onPrimaryAction,
 *                        secondaryActionLabel, onSecondaryAction }
 * - loadingSkeleton: ReactNode (single example card, repeated), loadingCount (default 6)
 * - page, totalPages, onPrevPage, onNextPage
 * - itemListLabel  -> aria-label for the card grid's role="list"
 * - children       -> Card components (rendered only when status === 'ready')
 */

var DEFAULT_AUDIENCE_OPTIONS = [
  'Adults (18+)', 'Black Community', 'Children (under 13)', 'English Learners', 'Families',
  'First-Generation Students', 'Foster Youth', 'General Public', 'Immigrants & Refugees',
  'Indigenous Communities', 'Justice-Involved Individuals', 'Latino Community', 'LGBTQ+ Community',
  'Low-Income Individuals', 'Men', 'People with Disabilities', 'Rural Communities', 'Seniors (65+)',
  'Single Parents', 'Students', 'Survivors of Domestic Violence', 'Unhoused Individuals',
  'Veterans', 'Women', 'Youth (13–17)'
];

var DEFAULT_LANGUAGE_OPTIONS = [
  'Arabic (العربية)', 'Bengali', 'Bosnian', 'Burmese', 'Chinese (Cantonese, 廣東話)',
  'Chinese (Mandarin, 中文)', 'English', 'French', 'German', 'Greek',
  'Haitian Creole (Kreyòl ayisyen)', 'Hindi (हिन्दी)', 'Hmong', 'Italian', 'Japanese', 'Karen',
  'Khmer', 'Korean (한국어)', 'Nepali', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Somali',
  'Spanish (Español)', 'Swahili', 'Tagalog', 'Tigrinya', 'Ukrainian', 'Urdu', 'Vietnamese (Tiếng Việt)'
];

var DEFAULT_DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'custom', label: 'Custom' }
];

var DEFAULT_REACH_OPTIONS = ['Near me', 'Statewide', 'National', 'All'];

function FilterSectionLabel(props) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
      {props.children}
    </div>
  );
}

function CheckboxRow(props) {
  var id = props.id;
  var label = props.label;
  var checked = props.checked;
  var onChange = props.onChange;
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', padding: '4px 0', cursor: 'pointer' }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
      />
      {label}
    </label>
  );
}

function DiscoveryPageLayout(props) {
  var title = props.title;
  var subtitle = props.subtitle;

  var searchValue = props.searchValue || '';
  var onSearchChange = props.onSearchChange;
  var searchPlaceholder = props.searchPlaceholder || 'Search...';
  var searchLabel = props.searchLabel || 'Search';
  var resultCount = props.resultCount;

  var locationValue = props.locationValue || '';
  var onLocationChange = props.onLocationChange;
  var locationPlaceholder = props.locationPlaceholder || 'City or zip code';
  var onUseMyLocation = props.onUseMyLocation;

  var reachOptions = props.reachOptions || DEFAULT_REACH_OPTIONS;
  var activeReach = props.activeReach || '';
  var onReachChange = props.onReachChange;

  var dateFilterOptions = props.dateFilterOptions || DEFAULT_DATE_OPTIONS;
  var activeDateFilter = props.activeDateFilter || '';
  var onDateFilterChange = props.onDateFilterChange;
  var customDateRangeContent = props.customDateRangeContent;

  var typeFilterLabel = props.typeFilterLabel || 'Type';
  var typeFilterOptions = props.typeFilterOptions || [];
  var activeTypeFilters = props.activeTypeFilters || [];
  var onTypeFilterChange = props.onTypeFilterChange;

  var audienceOptions = props.audienceOptions || DEFAULT_AUDIENCE_OPTIONS;
  var activeAudienceFilters = props.activeAudienceFilters || [];
  var onAudienceFilterChange = props.onAudienceFilterChange;

  var languageOptions = props.languageOptions || DEFAULT_LANGUAGE_OPTIONS;
  var activeLanguageFilters = props.activeLanguageFilters || [];
  var onLanguageFilterChange = props.onLanguageFilterChange;

  var additionalFiltersLabel = props.additionalFiltersLabel || 'Additional filters';
  var additionalFilters = props.additionalFilters;

  var onResetAll = props.onResetAll;

  var status = props.status || 'ready';
  var onRetry = props.onRetry;
  var onClearFilters = props.onClearFilters;
  var emptyStateConfig = props.emptyStateConfig || {};

  var loadingSkeleton = props.loadingSkeleton;
  var loadingCount = props.loadingCount || 6;

  var page = props.page;
  var totalPages = props.totalPages;
  var onPrevPage = props.onPrevPage;
  var onNextPage = props.onNextPage;

  var itemListLabel = props.itemListLabel || 'Results';
  var children = props.children;

  var additionalOpenState = useState(props.defaultAdditionalFiltersOpen || false);
  var additionalOpen = additionalOpenState[0];
  var setAdditionalOpen = additionalOpenState[1];

  var drawerOpenState = useState(false);
  var drawerOpen = drawerOpenState[0];
  var setDrawerOpen = drawerOpenState[1];

  var drawerRef = useRef(null);
  useModalKeyboard(drawerOpen, function () { setDrawerOpen(false); }, drawerRef);

  function toggleArrayValue(arr, value) {
    var idx = arr.indexOf(value);
    var next = arr.slice();
    if (idx === -1) {
      next.push(value);
    } else {
      next.splice(idx, 1);
    }
    return next;
  }

  function handleUseMyLocation() {
    if (!onUseMyLocation) {
      return;
    }
    if (!navigator.geolocation) {
      mascotErrorToast('Location not available.', 'Try entering a city or zip code instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (position) {
        onUseMyLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      function () {
        mascotErrorToast("Couldn't get your location.", 'Try entering a city or zip code instead.');
      }
    );
  }

  var activeFilterCount =
    (locationValue ? 1 : 0) +
    (activeReach ? 1 : 0) +
    (activeDateFilter ? 1 : 0) +
    activeTypeFilters.length +
    activeAudienceFilters.length +
    activeLanguageFilters.length;

  function renderFilterContent() {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0E1523' }}>Filters</span>
          {onResetAll && (
            <button
              type="button"
              onClick={onResetAll}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: '12px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset all
            </button>
          )}
        </div>

        {/* 1. Location */}
        <div style={{ marginBottom: '24px' }}>
          <FilterSectionLabel>Location</FilterSectionLabel>
          <input
            type="text"
            value={locationValue}
            onChange={function (e) { if (onLocationChange) { onLocationChange(e.target.value); } }}
            placeholder={locationPlaceholder}
            aria-label="City or zip code"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', border: '0.5px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', color: '#0E1523', marginBottom: '8px' }}
          />
          {onUseMyLocation && (
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: '12px', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, marginBottom: '12px', display: 'block' }}
            >
              Use my location
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {reachOptions.map(function (opt) {
              return (
                <Chip key={opt} selected={activeReach === opt} onClick={function () { if (onReachChange) { onReachChange(opt); } }}>
                  {opt}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* 2. Date/Deadline */}
        <div style={{ marginBottom: '24px' }}>
          <FilterSectionLabel>Date</FilterSectionLabel>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: activeDateFilter === 'custom' ? '12px' : 0 }}>
            {dateFilterOptions.map(function (opt) {
              return (
                <Chip key={opt.key} selected={activeDateFilter === opt.key} onClick={function () { if (onDateFilterChange) { onDateFilterChange(opt.key); } }}>
                  {opt.label}
                </Chip>
              );
            })}
          </div>
          {activeDateFilter === 'custom' && customDateRangeContent}
        </div>

        {/* 3. Type/Category */}
        {typeFilterOptions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <FilterSectionLabel>{typeFilterLabel}</FilterSectionLabel>
            {typeFilterOptions.map(function (opt) {
              var checked = activeTypeFilters.indexOf(opt.key) !== -1;
              return (
                <CheckboxRow
                  key={opt.key}
                  id={'type-' + opt.key}
                  label={opt.label}
                  checked={checked}
                  onChange={function () { if (onTypeFilterChange) { onTypeFilterChange(toggleArrayValue(activeTypeFilters, opt.key)); } }}
                />
              );
            })}
          </div>
        )}

        {/* 4. Audience served */}
        <div style={{ marginBottom: '24px' }}>
          <FilterSectionLabel>Audience served</FilterSectionLabel>
          {audienceOptions.map(function (opt) {
            var checked = activeAudienceFilters.indexOf(opt) !== -1;
            return (
              <CheckboxRow
                key={opt}
                id={'audience-' + opt}
                label={opt}
                checked={checked}
                onChange={function () { if (onAudienceFilterChange) { onAudienceFilterChange(toggleArrayValue(activeAudienceFilters, opt)); } }}
              />
            );
          })}
        </div>

        {/* 5. Languages */}
        <div style={{ marginBottom: '24px' }}>
          <FilterSectionLabel>Languages</FilterSectionLabel>
          {languageOptions.map(function (opt) {
            var checked = activeLanguageFilters.indexOf(opt) !== -1;
            return (
              <CheckboxRow
                key={opt}
                id={'language-' + opt}
                label={opt}
                checked={checked}
                onChange={function () { if (onLanguageFilterChange) { onLanguageFilterChange(toggleArrayValue(activeLanguageFilters, opt)); } }}
              />
            );
          })}
        </div>

        {/* 6. Additional filters — page-specific, collapsible */}
        {additionalFilters && (
          <div>
            <button
              type="button"
              onClick={function () { setAdditionalOpen(!additionalOpen); }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={additionalOpen}
              style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '12px' }}
            >
              {additionalOpen ? 'Hide ' + additionalFiltersLabel.toLowerCase() : 'Show ' + additionalFiltersLabel.toLowerCase()}
            </button>
            {additionalOpen && <div>{additionalFilters}</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Hero header — distinct, NOT shared PageHeader, per §13.2 item 1 */}
      <div style={{ textAlign: 'center', padding: '40px 24px 32px' }}>
        <img
          src="/mascot-discovery-badge.png"
          alt=""
          aria-hidden="true"
          style={{ width: '64px', margin: '0 auto 16px', display: 'block', mixBlendMode: 'multiply' }}
        />
        <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#0E1523', margin: '0 0 8px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '16px', color: '#475569', margin: 0, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', gap: '24px', padding: '0 24px 32px', alignItems: 'flex-start' }}>

        {/* Real fixed sidebar — desktop only */}
        <aside
          className="hidden lg:block"
          aria-label="Filters"
          style={{ width: '200px', flexShrink: 0, position: 'sticky', top: '20px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', padding: '20px 16px' }}
        >
          {renderFilterContent()}
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, padding: '20px 0 0' }}>

          {/* Mobile filters trigger — opens bottom drawer (§13.7) */}
          <button
            type="button"
            onClick={function () { setDrawerOpen(true); }}
            className="lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '100%', textAlign: 'left', marginBottom: '12px', border: '0.5px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#475569', background: '#FFFFFF' }}
          >
            Filters{activeFilterCount > 0 ? ' (' + activeFilterCount + ' active)' : ''}
          </button>

          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              color="#94A3B8"
              aria-hidden="true"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <input
              type="text"
              value={searchValue}
              onChange={function (e) { if (onSearchChange) { onSearchChange(e.target.value); } }}
              placeholder={searchPlaceholder}
              aria-label={searchLabel}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: '100%', border: '0.5px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px 8px 36px', background: '#FFFFFF', fontSize: '14px', color: '#0E1523' }}
            />
          </div>

          {typeof resultCount === 'number' && (
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }} aria-live="polite">
              {resultCount} result{resultCount === 1 ? '' : 's'}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>

            {status === 'loading' && (
              <div
                aria-hidden="true"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}
              >
                {loadingSkeleton && Array.from({ length: loadingCount }).map(function (_, i) {
                  return cloneElement(loadingSkeleton, { key: 'discovery-skeleton-' + i });
                })}
              </div>
            )}

            {status === 'error' && (
              <EmptyStateBlock
                mascotSrc="/mascot-error.png"
                heading="Something went wrong"
                description="We couldn't load this page. Please try again."
                primaryActionLabel="Try again"
                onPrimaryAction={onRetry}
              />
            )}

            {status === 'empty' && (
              <EmptyStateBlock
                mascotSrc="/mascots-empty.png"
                heading={emptyStateConfig.heading || 'Nothing here yet'}
                description={emptyStateConfig.description || ''}
                primaryActionLabel={emptyStateConfig.primaryActionLabel}
                onPrimaryAction={emptyStateConfig.onPrimaryAction}
                secondaryActionLabel={emptyStateConfig.secondaryActionLabel}
                onSecondaryAction={emptyStateConfig.onSecondaryAction}
              />
            )}

            {status === 'no-results' && (
              <EmptyStateBlock
                mascotSrc="/mascots-empty.png"
                heading="No results found"
                description="Try adjusting your filters or search terms."
                primaryActionLabel="Clear filters"
                onPrimaryAction={onClearFilters}
              />
            )}

            {status === 'ready' && (
              <div>
                <div
                  role="list"
                  aria-label={itemListLabel}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}
                >
                  {children}
                </div>

                {totalPages > 1 && (
                  <nav aria-label="Pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                    <Button variant="ghost" onClick={onPrevPage} disabled={page <= 1} aria-label="Previous page">Prev</Button>
                    <span style={{ fontSize: '13px', color: '#64748B' }} aria-live="polite">Page {page} of {totalPages}</span>
                    <Button variant="ghost" onClick={onNextPage} disabled={page >= totalPages} aria-label="Next page">Next</Button>
                  </nav>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile bottom drawer — same filter content, per §13.7 */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }} className="lg:hidden">
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '85vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '16px 16px 0 0', padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '17px', fontWeight: 500, color: '#0E1523' }}>Filters</span>
              <button
                type="button"
                onClick={function () { setDrawerOpen(false); }}
                aria-label="Close"
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#475569' }}
              >
                ✕
              </button>
            </div>
            {renderFilterContent()}
            <div style={{ marginTop: '16px' }}>
              <Button variant="primary" onClick={function () { setDrawerOpen(false); }} className="w-full">
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty/error/no-results state block per §20.
 * Duplicated from ListPageLayout's local version — flagging as a candidate
 * to extract into one shared exported component later, since this is now
 * the second copy.
 */
function EmptyStateBlock(props) {
  var mascotSrc = props.mascotSrc;
  var heading = props.heading;
  var description = props.description;
  var primaryActionLabel = props.primaryActionLabel;
  var onPrimaryAction = props.onPrimaryAction;
  var secondaryActionLabel = props.secondaryActionLabel;
  var onSecondaryAction = props.onSecondaryAction;

  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '420px', margin: '0 auto' }}>
      <img src={mascotSrc} alt="" aria-hidden="true" style={{ maxWidth: '220px', width: '100%', mixBlendMode: 'multiply', marginBottom: '16px' }} />
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0E1523', margin: '0 0 8px' }}>{heading}</h2>
      {description && <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>{description}</p>}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {primaryActionLabel && onPrimaryAction && <Button variant="primary" onClick={onPrimaryAction}>{primaryActionLabel}</Button>}
        {secondaryActionLabel && onSecondaryAction && <Button variant="ghost" onClick={onSecondaryAction}>{secondaryActionLabel}</Button>}
      </div>
    </div>
  );
}

export default DiscoveryPageLayout;