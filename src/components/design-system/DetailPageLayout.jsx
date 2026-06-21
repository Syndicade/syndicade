import { BadgeCheck } from 'lucide-react';
import PageHeader from '../PageHeader';
import { Button } from './Button';
import { Skeleton } from '../Skeletons';

/**
 * DetailPageLayout
 *
 * Standalone detail page shell per Syndicade Design System §13.3.
 * Used by: EventDetails, ProgramDetail (standalone, outside OrgLayout).
 *
 * Per §13.3:
 * 1. PageHeader reused (30px/800) + back-button/breadcrumb — this is the
 *    documented exception to the "no back-link on internal pages" rule (§14),
 *    since these are standalone pages outside OrgLayout.
 * 2. No full-width hero image — optional small image fine, but NEVER a
 *    placeholder if absent.
 * 3. 2-column: main content + sticky sidebar (organizer card + primary CTA).
 *
 * ASSUMPTIONS FLAGGED FOR REVIEW:
 * 1. §13.3 doesn't define a loading/error state for this layout (unlike
 *    List/Discovery layouts). Added `status` ('loading' | 'error' | 'ready')
 *    for completeness since real detail pages need a fetch state — flag if
 *    you'd rather this be handled entirely by the consuming page instead.
 * 2. Sidebar width: not specified anywhere — using 320px as a reasonable
 *    width for an organizer card + CTA. Flag if a different width is wanted.
 * 3. Organizer logo fallback (no logoUrl): §4 says "show fallback gradient
 *    or initials" but doesn't give exact colors — using Accent Purple
 *    (#8B5CF6) background with white initials.
 * 4. Mobile: sidebar stacks below main content (not explicitly specified,
 *    but consistent with the rest of the app's responsive patterns).
 *
 * Props:
 * - title, subtitle                          -> PageHeader
 * - backTo, backLabel                        -> PageHeader (back-button/breadcrumb)
 * - organizationName, organizationId         -> PageHeader (standalone-page props)
 * - headerActions                            -> PageHeader actions
 * - imageSrc, imageAlt                       -> optional small supporting image,
 *                                                rendered inline above children;
 *                                                omitted entirely if no imageSrc
 * - status: 'loading' | 'error' | 'ready' (default 'ready')
 * - errorConfig: { heading, description, primaryActionLabel, onPrimaryAction }
 * - organizer: { name, logoUrl, verified, onView } -> organizer card in sidebar
 * - ctaLabel, onCtaClick, ctaDisabled        -> primary CTA button (RSVP/Register/Apply)
 * - sidebarContent: ReactNode                -> extra sidebar content below the CTA
 * - children                                  -> main content (rendered when status === 'ready')
 */
function DetailPageLayout(props) {
  var title = props.title;
  var subtitle = props.subtitle;
  var backTo = props.backTo;
  var backLabel = props.backLabel;
  var organizationName = props.organizationName;
  var organizationId = props.organizationId;
  var headerActions = props.headerActions;

  var imageSrc = props.imageSrc;
  var imageAlt = props.imageAlt || '';

  var status = props.status || 'ready';
  var errorConfig = props.errorConfig || {};

  var organizer = props.organizer;
  var ctaLabel = props.ctaLabel;
  var onCtaClick = props.onCtaClick;
  var ctaDisabled = props.ctaDisabled || false;

  var sidebarContent = props.sidebarContent;
  var children = props.children;

  function getInitials(name) {
    if (!name) {
      return '';
    }
    var parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        backTo={backTo}
        backLabel={backLabel}
        organizationName={organizationName}
        organizationId={organizationId}
        actions={headerActions}
      />

      <div className="flex flex-col lg:flex-row" style={{ gap: '24px', padding: '20px 24px 32px' }}>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {status === 'loading' && (
            <div aria-hidden="true">
              <Skeleton variant="title" />
              <Skeleton variant="text" className="mb-2" />
              <Skeleton variant="text" className="mb-2" />
              <Skeleton variant="text" />
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '420px', margin: '0 auto' }}>
              <img src="/mascot-error.png" alt="" aria-hidden="true" style={{ maxWidth: '220px', width: '100%', mixBlendMode: 'multiply', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0E1523', margin: '0 0 8px' }}>
                {errorConfig.heading || 'Something went wrong'}
              </h2>
              <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>
                {errorConfig.description || "We couldn't load this page."}
              </p>
              {errorConfig.primaryActionLabel && errorConfig.onPrimaryAction && (
                <Button variant="primary" onClick={errorConfig.onPrimaryAction}>{errorConfig.primaryActionLabel}</Button>
              )}
            </div>
          )}

          {status === 'ready' && (
            <div>
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }}
                />
              )}
              {children}
            </div>
          )}
        </div>

        {/* Sticky sidebar — organizer card + primary CTA */}
        {status === 'ready' && (organizer || ctaLabel || sidebarContent) && (
          <aside style={{ width: '320px', flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '20px' }}>

              {organizer && (
                <div style={{ border: '0.5px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: organizer.onView ? '12px' : 0 }}>
                    {organizer.logoUrl ? (
                      <img
                        src={organizer.logoUrl}
                        alt=""
                        aria-hidden="true"
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: '#8B5CF6', color: '#FFFFFF', fontWeight: 700, fontSize: '14px' }}
                      >
                        {getInitials(organizer.name)}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0E1523' }}>{organizer.name}</span>
                      {organizer.verified && <BadgeCheck size={14} color="#3B82F6" aria-label="Verified organization" />}
                    </div>
                  </div>
                  {organizer.onView && (
                    <Button variant="secondary" onClick={organizer.onView} className="w-full">
                      View organization
                    </Button>
                  )}
                </div>
              )}

              {ctaLabel && onCtaClick && (
                <Button variant="primary" onClick={onCtaClick} disabled={ctaDisabled} className="w-full">
                  {ctaLabel}
                </Button>
              )}

              {sidebarContent && <div style={{ marginTop: '16px' }}>{sidebarContent}</div>}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default DetailPageLayout;