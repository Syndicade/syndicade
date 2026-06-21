import { Search } from 'lucide-react';
import PageHeader from '../PageHeader';
import { Button } from './Button';
import { Chip } from './Chip';

/**
 * ListPageLayout
 *
 * Internal admin list-page shell per Syndicade Design System §13.1.
 * Used by: Programs, Opportunities, Funding, Polls, Surveys, Sign-Up Forms,
 * Announcements, Member Directory, Document Library.
 *
 * NOT for public discovery pages — see DiscoveryPageLayout for those.
 *
 * Filter scope follows §10 "Internal admin pages" order:
 *   Status chips -> Date/Deadline -> Type/Category -> Audience
 * (No Location filter — content is already scoped to the org.)
 *
 * ASSUMPTIONS FLAGGED FOR REVIEW:
 * 1. Button.jsx's variant prop is assumed to be `variant="ghost"` / "primary" / etc.
 *    (matches Badge.jsx's confirmed `variant` pattern) — please confirm against the
 *    real Button.jsx source.
 * 2. Date/Type/Audience filters render as native <select> dropdowns, not chip rows —
 *    §10 doesn't specify a UI control for these in a horizontal bar (only the sidebar
 *    context describes them), and Audience alone has 25 options, too many for inline
 *    chips. Flagging this as a simplification — a proper multi-select chip popover
 *    would need its own component (doesn't exist yet).
 * 3. Loading state below is a TEMPORARY inline skeleton stub, matching Card anatomy
 *    per §11, but NOT the shared Skeleton component (Skeletons.jsx update is a later
 *    step). Swap this out once that file is updated.
 * 4. Mascot image paths assume /public root convention (confirmed for
 *    mascots-empty.png) — assumed mascot-error.png lives alongside it at the same
 *    path. Please confirm.
 * 5. No mobile "bottom drawer" filter pattern (§13.7) — that's documented for pages
 *    with a real sidebar (Discovery). ListPageLayout's filter bar just wraps on
 *    mobile instead. Flagging in case you want drawer behavior here too.
 *
 * Props:
 * - title, subtitle, headerActions        -> passed straight to PageHeader
 * - searchValue, onSearchChange, searchPlaceholder, searchLabel
 * - statusFilters: [{ key, label, count }], activeStatusFilter, onStatusFilterChange
 * - dateFilterOptions: [{ key, label }], activeDateFilter, onDateFilterChange
 * - typeFilterOptions: [{ key, label }], activeTypeFilter, onTypeFilterChange, typeFilterLabel
 * - audienceFilterOptions: [string], activeAudienceFilters: [string], onAudienceFilterChange
 * - status: 'loading' | 'error' | 'empty' | 'no-results' | 'ready'
 * - onRetry, onClearFilters
 * - emptyStateConfig: { heading, description, primaryActionLabel, onPrimaryAction,
 *                        secondaryActionLabel, onSecondaryAction }
 * - page, totalPages, onPrevPage, onNextPage
 * - itemListLabel  -> aria-label for the card grid's role="list"
 * - children       -> the actual Card components (rendered only when status === 'ready')
 */
function ListPageLayout(props) {
  var title = props.title;
  var subtitle = props.subtitle;
  var headerActions = props.headerActions;

  var searchValue = props.searchValue || '';
  var onSearchChange = props.onSearchChange;
  var searchPlaceholder = props.searchPlaceholder || 'Search...';
  var searchLabel = props.searchLabel || 'Search';

  var statusFilters = props.statusFilters || [];
  var activeStatusFilter = props.activeStatusFilter;
  var onStatusFilterChange = props.onStatusFilterChange;

  var dateFilterOptions = props.dateFilterOptions || [];
  var activeDateFilter = props.activeDateFilter || '';
  var onDateFilterChange = props.onDateFilterChange;

  var typeFilterOptions = props.typeFilterOptions || [];
  var activeTypeFilter = props.activeTypeFilter || '';
  var onTypeFilterChange = props.onTypeFilterChange;
  var typeFilterLabel = props.typeFilterLabel || 'Type';

  var audienceFilterOptions = props.audienceFilterOptions || [];
  var activeAudienceFilters = props.activeAudienceFilters || [];
  var onAudienceFilterChange = props.onAudienceFilterChange;

  var status = props.status || 'ready';
  var onRetry = props.onRetry;
  var onClearFilters = props.onClearFilters;
  var emptyStateConfig = props.emptyStateConfig || {};

  var page = props.page;
  var totalPages = props.totalPages;
  var onPrevPage = props.onPrevPage;
  var onNextPage = props.onNextPage;

  var itemListLabel = props.itemListLabel || 'Items';
  var children = props.children;

  var selectStyle = {
    border: '0.5px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    background: '#FFFFFF',
    color: '#475569'
  };

  function handleAudienceChange(e) {
    var selected = [];
    var options = e.target.options;
    var i;
    for (i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    if (onAudienceFilterChange) {
      onAudienceFilterChange(selected);
    }
  }

  var showFilterRow2 = dateFilterOptions.length > 0 || typeFilterOptions.length > 0 || audienceFilterOptions.length > 0;

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={headerActions} />

      <div style={{ padding: '20px 24px 32px' }}>

        {/* Filter bar — no card wrapper, sits on page bg, per §13.1 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
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
                style={{
                  width: '100%',
                  border: '0.5px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 36px',
                  background: '#FFFFFF',
                  fontSize: '14px',
                  color: '#0E1523'
                }}
              />
            </div>

            {statusFilters.length > 0 && (
              <div role="group" aria-label="Filter by status" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {statusFilters.map(function (f) {
                  var label = f.label + (typeof f.count === 'number' ? ' (' + f.count + ')' : '');
                  return (
                    <Chip
                      key={f.key}
                      selected={activeStatusFilter === f.key}
                      onClick={function () { if (onStatusFilterChange) { onStatusFilterChange(f.key); } }}
                    >
                      {label}
                    </Chip>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date -> Type -> Audience, per §10 order (see assumption #2 above) */}
          {showFilterRow2 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
              {dateFilterOptions.length > 0 && (
                <select
                  value={activeDateFilter}
                  onChange={function (e) { if (onDateFilterChange) { onDateFilterChange(e.target.value); } }}
                  aria-label="Filter by date"
                  style={selectStyle}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any date</option>
                  {dateFilterOptions.map(function (opt) {
                    return <option key={opt.key} value={opt.key}>{opt.label}</option>;
                  })}
                </select>
              )}

              {typeFilterOptions.length > 0 && (
                <select
                  value={activeTypeFilter}
                  onChange={function (e) { if (onTypeFilterChange) { onTypeFilterChange(e.target.value); } }}
                  aria-label={'Filter by ' + typeFilterLabel}
                  style={selectStyle}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All {typeFilterLabel}</option>
                  {typeFilterOptions.map(function (opt) {
                    return <option key={opt.key} value={opt.key}>{opt.label}</option>;
                  })}
                </select>
              )}

              {audienceFilterOptions.length > 0 && (
                <select
                  multiple
                  value={activeAudienceFilters}
                  onChange={handleAudienceChange}
                  aria-label="Filter by audience"
                  style={Object.assign({}, selectStyle, { minWidth: '160px', height: '38px' })}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {audienceFilterOptions.map(function (a) {
                    return <option key={a} value={a}>{a}</option>;
                  })}
                </select>
              )}
            </div>
          )}
        </div>

        {/* No separate result-count line — header subtitle already shows the count, per §13.1 */}

        {status === 'loading' && <LoadingGrid />}

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
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}
            >
              {children}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                <Button variant="ghost" onClick={onPrevPage} disabled={page <= 1} aria-label="Previous page">
                  Prev
                </Button>
                <span style={{ fontSize: '13px', color: '#64748B' }} aria-live="polite">
                  Page {page} of {totalPages}
                </span>
                <Button variant="ghost" onClick={onNextPage} disabled={page >= totalPages} aria-label="Next page">
                  Next
                </Button>
              </nav>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * TEMPORARY inline loading skeleton — mirrors Card anatomy per §11.
 * Replace with the shared Skeleton component once Skeletons.jsx is updated (Build List #13).
 */
function LoadingGrid() {
  var placeholders = [1, 2, 3, 4, 5, 6];
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}
    >
      {placeholders.map(function (n) {
        return (
          <div
            key={n}
            style={{
              border: '0.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div className="animate-pulse" style={{ height: '14px', width: '60%', background: '#F1F5F9', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="animate-pulse" style={{ height: '12px', width: '100%', background: '#F1F5F9', borderRadius: '4px', marginBottom: '6px' }} />
            <div className="animate-pulse" style={{ height: '12px', width: '90%', background: '#F1F5F9', borderRadius: '4px', marginBottom: '14px' }} />
            <div className="animate-pulse" style={{ height: '10px', width: '70%', background: '#F1F5F9', borderRadius: '4px', marginBottom: '8px' }} />
            <div className="animate-pulse" style={{ height: '10px', width: '50%', background: '#F1F5F9', borderRadius: '4px', marginBottom: '16px' }} />
            <div style={{ borderTop: '0.5px solid #E2E8F0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <div className="animate-pulse" style={{ height: '10px', width: '40%', background: '#F1F5F9', borderRadius: '4px' }} />
              <div className="animate-pulse" style={{ height: '24px', width: '70px', background: '#F1F5F9', borderRadius: '6px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Empty/error/no-results state block per §20.
 * Layout: mascot (max 220px, mix-blend-mode: multiply) -> heading -> description -> actions.
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
      <img
        src={mascotSrc}
        alt=""
        aria-hidden="true"
        style={{ maxWidth: '220px', width: '100%', mixBlendMode: 'multiply', marginBottom: '16px' }}
      />
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0E1523', margin: '0 0 8px' }}>
        {heading}
      </h2>
      {description && (
        <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {primaryActionLabel && onPrimaryAction && (
          <Button variant="primary" onClick={onPrimaryAction}>{primaryActionLabel}</Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="ghost" onClick={onSecondaryAction}>{secondaryActionLabel}</Button>
        )}
      </div>
    </div>
  );
}

export default ListPageLayout;