// src/components/Skeletons.jsx
// Syndicade Skeleton Loading — Design System §11 / Build List #13
// Fixed in place June 21, 2026. Filename/exports unchanged (per Build List #13
// decision — no separate Skeleton.jsx). Fixes applied:
//   - Real tokens (#F1F5F9 / #E2E8F0) + gradient-sweep animation, replacing
//     Tailwind gray-200/animate-pulse (which is an opacity pulse, not a sweep)
//   - aria-hidden="true" on every skeleton element — not announced (was
//     role="status" + aria-label="Loading" + sr-only text, which IS announced;
//     §11/§20 call for aria-hidden specifically)
//   - var only, string-concat className — no const/let, no template literals (§21)
//   - Card-shaped skeletons now mirror the real List Card anatomy (§8): title ->
//     2 description lines -> 2-3 metadata rows -> footer divider + button ghost

var SWEEP_CSS = '@keyframes skeleton-sweep { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }';

function SkeletonKeyframes() {
  return <style>{SWEEP_CSS}</style>;
}

function sweepStyle(extra) {
  var base = {
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 37%, #F1F5F9 63%)',
    backgroundSize: '400% 100%',
    animation: 'skeleton-sweep 1.5s ease-in-out infinite',
    borderRadius: '6px'
  };
  return Object.assign({}, base, extra || {});
}

var VARIANT_STYLES = {
  default: { height: '16px', width: '100%' },
  title: { height: '32px', width: '66%', marginBottom: '16px' },
  text: { height: '16px', width: '100%' },
  card: { height: '192px', width: '100%' },
  avatar: { height: '48px', width: '48px', borderRadius: '50%' },
  button: { height: '40px', width: '96px' }
};

// Generic single skeleton block — simple shape primitives for ad hoc
// loading bits (not full Card mirrors; see CardSkeleton below for that).
export function Skeleton(props) {
  var variant = props.variant || 'default';
  var className = props.className || '';
  var variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <div aria-hidden="true" className={className}>
      <SkeletonKeyframes />
      <div style={sweepStyle(variantStyle)} />
    </div>
  );
}

/**
 * CardSkeleton — mirrors the real List Card anatomy exactly, per §8/§11:
 * title -> 2 description lines -> 2-3 metadata rows -> footer divider +
 * button-shaped ghost. Used only where the real component is a Card.jsx
 * (List Card) instance — confirmed that's Announcements only among these
 * three (Organization/Event cards are not in the §8/§9 List Card consumer
 * list, so they keep their own bespoke shapes below).
 */
export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl p-4" style={{ border: '0.5px solid #E2E8F0' }}>
      <SkeletonKeyframes />
      <div style={sweepStyle({ height: '15px', width: '60%', marginBottom: '10px' })} />
      <div style={sweepStyle({ height: '12px', width: '100%', marginBottom: '6px' })} />
      <div style={sweepStyle({ height: '12px', width: '85%', marginBottom: '14px' })} />
      <div style={sweepStyle({ height: '10px', width: '70%', marginBottom: '8px' })} />
      <div style={sweepStyle({ height: '10px', width: '50%', marginBottom: '16px' })} />
      <div className="flex items-center justify-between" style={{ borderTop: '0.5px solid #E2E8F0', paddingTop: '12px' }}>
        <div style={sweepStyle({ height: '10px', width: '30%' })} />
        <div style={sweepStyle({ height: '24px', width: '72px', borderRadius: '8px' })} />
      </div>
    </div>
  );
}

export function OrganizationCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-white rounded-lg shadow-md p-6" style={{ border: '0.5px solid #E2E8F0' }}>
      <SkeletonKeyframes />
      <div className="flex items-start justify-between mb-3">
        <div style={sweepStyle({ height: '24px', width: '75%' })} />
        <div style={sweepStyle({ height: '24px', width: '64px' })} />
      </div>
      <div className="mb-4">
        <div style={sweepStyle({ height: '16px', width: '100%', marginBottom: '8px' })} />
        <div style={sweepStyle({ height: '16px', width: '67%' })} />
      </div>
      <div className="flex items-center gap-4">
        <div style={sweepStyle({ height: '16px', width: '96px' })} />
        <div style={sweepStyle({ height: '16px', width: '96px' })} />
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-white rounded-lg shadow-md p-6" style={{ border: '0.5px solid #E2E8F0' }}>
      <SkeletonKeyframes />
      <div className="flex items-start gap-4 mb-4">
        <div style={sweepStyle({ width: '64px', height: '64px', flexShrink: 0, borderRadius: '8px' })} />
        <div className="flex-1">
          <div style={sweepStyle({ height: '24px', width: '75%', marginBottom: '8px' })} />
          <div style={sweepStyle({ height: '16px', width: '50%' })} />
        </div>
      </div>
      <div className="mb-4">
        <div style={sweepStyle({ height: '16px', width: '100%', marginBottom: '8px' })} />
        <div style={sweepStyle({ height: '16px', width: '83%' })} />
      </div>
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '0.5px solid #E2E8F0' }}>
        <div style={sweepStyle({ height: '16px', width: '128px' })} />
        <div style={sweepStyle({ height: '32px', width: '80px', borderRadius: '8px' })} />
      </div>
    </div>
  );
}

// Announcements ARE a List Card (Card.jsx) consumer per §8/§9 — mirror the
// real anatomy.
export function AnnouncementCardSkeleton() {
  return <CardSkeleton />;
}

// Activity feed row (Org Dashboard activity list) — not a Card, own shape kept.
export function ActivityItemSkeleton() {
  return (
    <div aria-hidden="true" className="p-4">
      <SkeletonKeyframes />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div style={sweepStyle({ height: '14px', width: '75%', marginBottom: '8px' })} />
          <div style={sweepStyle({ height: '11px', width: '45%' })} />
        </div>
        <div style={sweepStyle({ height: '11px', width: '60px', flexShrink: 0 })} />
      </div>
    </div>
  );
}

// Stat card skeleton (§13.5 pages only)
export function StatCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl p-5" style={{ background: '#F8FAFC', border: '0.5px solid #E2E8F0' }}>
      <SkeletonKeyframes />
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div style={sweepStyle({ height: '12px', width: '90px', marginBottom: '12px' })} />
          <div style={sweepStyle({ height: '28px', width: '64px' })} />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-hidden="true" className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <SkeletonKeyframes />
      <div style={{ background: '#FFFFFF', borderBottom: '0.5px solid #E2E8F0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div style={sweepStyle({ height: '28px', width: '192px', marginBottom: '8px' })} />
              <div style={sweepStyle({ height: '14px', width: '128px' })} />
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block" style={sweepStyle({ height: '56px', width: '192px', borderRadius: '8px' })} />
              <div style={sweepStyle({ height: '40px', width: '96px', borderRadius: '8px' })} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div style={sweepStyle({ height: '28px', width: '192px', marginBottom: '16px' })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OrganizationCardSkeleton />
                <OrganizationCardSkeleton />
              </div>
            </section>

            <section>
              <div style={sweepStyle({ height: '28px', width: '192px', marginBottom: '16px' })} />
              <div className="space-y-4">
                <EventCardSkeleton />
                <EventCardSkeleton />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <div style={sweepStyle({ height: '28px', width: '160px', marginBottom: '16px' })} />
              <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '0.5px solid #E2E8F0' }}>
                <ActivityItemSkeleton />
                <div style={{ borderTop: '0.5px solid #E2E8F0' }}><ActivityItemSkeleton /></div>
                <div style={{ borderTop: '0.5px solid #E2E8F0' }}><ActivityItemSkeleton /></div>
                <div style={{ borderTop: '0.5px solid #E2E8F0' }}><ActivityItemSkeleton /></div>
                <div style={{ borderTop: '0.5px solid #E2E8F0' }}><ActivityItemSkeleton /></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * RESOLVED per your decision: kept as a skeleton, not the mascot — the app
 * uses skeletons for full-page loads in practice today. §11 currently says
 * full-page loads should use mascot-loading.png only; recommend updating
 * that line in the Design System doc to match this actual standard
 * (skeleton for full-page too) so it stops flagging as a conflict.
 */
export function PageLoadingSkeleton() {
  return (
    <div aria-hidden="true" className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
      <SkeletonKeyframes />
      <div className="text-center">
        <div style={sweepStyle({ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px' })} />
        <div style={sweepStyle({ height: '16px', width: '192px', margin: '0 auto' })} />
      </div>
    </div>
  );
}