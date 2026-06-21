import { Search } from 'lucide-react';
import PageHeader from '../PageHeader';
import { Button } from './Button';
import { CardSkeleton } from '../Skeletons';

/**
 * ListPageLayout
 *
 * Internal admin list-page shell per Syndicade Design System §13.1.
 * Used by: Programs, Opportunities, Funding, Polls, Surveys, Sign-Up Forms,
 * Announcements, Member Directory, Document Library, Groups & Committees,
 * Photo Gallery, Members.
 *
 * NOT for public discovery pages — see DiscoveryPageLayout for those.
 *
 * ARCHITECTURE (decided June 21, 2026): this is a STRUCTURAL SHELL, not a fixed
 * filter taxonomy. It standardizes placement only — header, optional stat-card
 * row, search bar position, filter-row container. It does NOT hardcode specific
 * filter control types (no built-in status-chip loop, date select, type select,
 * etc.) because §10 confirms every module already uses a different filter set
 * (Programs: status chips only; Polls/Surveys: chips + Type + Sort + stat cards;
 * Members: Role/Tag/Group/Dues dropdowns + Sort; etc.). Each page builds its own
 * filter content (Chip rows, <select> dropdowns, toggles — whatever fits) and
 * passes it in via the `filters` prop.
 *
 * Audience filter REMOVED (decided June 21, 2026): Audience filtering is
 * Discovery-only (§10) — does not apply to internal admin pages at all, so
 * there is no Audience slot or prop here anymore.
 *
 * ASSUMPTIONS FLAGGED FOR REVIEW:
 * 1. Mascot image paths assume /public root convention (confirmed for
 *    mascots-empty.png) — assumed mascot-error.png lives alongside it at the
 *    same path. Please confirm.
 * 2. No mobile "bottom drawer" filter pattern (§13.7) — that's documented for
 *    pages with a real sidebar (Discovery). ListPageLayout's filter bar just
 *    wraps on mobile instead.
 *
 * Props:
 * - title, subtitle, headerActions        -> passed straight to PageHeader
 * - searchValue, onSearchChange, searchPlaceholder, searchLabel
 * - filters: ReactNode                    -> page-supplied filter content (Chip rows,
 *                                             dropdowns, toggles), rendered right of the
 *                                             search bar, same row, wraps on mobile
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

  var filters = props.filters;

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

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={headerActions} />

      <div style={{ padding: '20px 24px 32px' }}>

        {/* Filter bar — no card wrapper, sits on page bg, per §13.1.
            Search (left) + page-supplied filter content (right), same row, wraps on mobile. */}
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

            {filters && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {filters}
              </div>
            )}
          </div>
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
 * Loading grid — renders the real CardSkeleton (Skeletons.jsx), matching
 * exact List Card anatomy per §11. Build List #13/#10 step: temporary stub
 * removed now that Skeletons.jsx is fixed.
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
        return <CardSkeleton key={n} />;
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