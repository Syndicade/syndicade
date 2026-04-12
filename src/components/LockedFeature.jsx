/**
 * LockedFeature — wraps any feature that requires a higher plan.
 *
 * Props:
 *   plan       — 'growth' | 'pro'  (minimum plan required)
 *   feature    — string (key from PLAN_LIMITS, e.g. 'can_sell_tickets')
 *   currentPlan — string (org's current plan)
 *   children   — rendered normally if allowed
 *   label      — optional override for the locked label
 *   compact    — bool — shows smaller inline lock instead of full overlay
 */
export default function LockedFeature({ plan, feature, currentPlan, children, label, compact }) {
  var planOrder = { starter: 0, growth: 1, pro: 2 };
  var required = planOrder[plan] !== undefined ? planOrder[plan] : 1;
  var current = planOrder[currentPlan] !== undefined ? planOrder[currentPlan] : 0;
  var isLocked = current < required;

  if (!isLocked) return children;

  var planLabel = plan === 'pro' ? 'Pro' : 'Growth';
  var upgradeText = label || ('Available on ' + planLabel + ' — upgrade to unlock');
  var planColor = plan === 'pro' ? '#8B5CF6' : '#F5B731';
  var planBg = plan === 'pro' ? 'rgba(139,92,246,0.1)' : 'rgba(245,183,49,0.1)';
  var planBorder = plan === 'pro' ? 'rgba(139,92,246,0.3)' : 'rgba(245,183,49,0.3)';

  // ── Compact inline lock (for nav items, small buttons) ───────────────────
  if (compact) {
    return (
      <div
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.45, cursor: 'not-allowed' }}
        aria-disabled="true"
        title={upgradeText}
      >
        {children}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={planColor} strokeWidth="2.5" aria-hidden="true" style={{ flexShrink: 0 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
    );
  }

  // ── Full overlay lock ─────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }} aria-disabled="true">
      {/* Greyed-out children underneath */}
      <div style={{ opacity: 0.25, pointerEvents: 'none', userSelect: 'none', filter: 'grayscale(40%)' }} aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(14,21,35,0.75)',
          backdropFilter: 'blur(2px)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          gap: '10px',
        }}
        role="region"
        aria-label={upgradeText}
      >
        {/* Lock icon */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: planBg, border: '1px solid ' + planBorder,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={planColor} strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        {/* Plan badge */}
        <span style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px',
          color: planColor, background: planBg, border: '1px solid ' + planBorder,
          padding: '3px 10px', borderRadius: '99px'
        }}>
          {planLabel} feature
        </span>

        {/* Message */}
        <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0, lineHeight: 1.5, maxWidth: '220px' }}>
          {upgradeText}
        </p>

        {/* Upgrade CTA */}
        
          href="/pricing"
          style={{
            display: 'inline-block',
            padding: '7px 18px',
            background: planColor,
            color: plan === 'pro' ? '#FFFFFF' : '#0E1523',
            fontWeight: 700,
            fontSize: '12px',
            borderRadius: '6px',
            textDecoration: 'none',
            marginTop: '2px'
          }}
          aria-label={'Upgrade to ' + planLabel + ' to unlock this feature'}
        >
          Upgrade to {planLabel}
        </a>
      </div>
    </div>
  );
}