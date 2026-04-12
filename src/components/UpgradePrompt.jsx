import { useNavigate } from 'react-router-dom';

/**
 * UpgradePrompt — standalone upgrade CTA card.
 *
 * Props:
 *   plan           — 'growth' | 'pro'
 *   title          — optional override heading
 *   description    — optional override body text
 *   organizationId — string (for billing link)
 *   compact        — bool (smaller inline banner version)
 *   features       — string[] (optional bullet list of what they'd unlock)
 */
export default function UpgradePrompt({ plan, title, description, organizationId, compact, features }) {
  var navigate = useNavigate();

  var planLabel = plan === 'pro' ? 'Pro' : 'Growth';
  var planColor = plan === 'pro' ? '#8B5CF6' : '#F5B731';
  var planBg = plan === 'pro' ? 'rgba(139,92,246,0.1)' : 'rgba(245,183,49,0.08)';
  var planBorder = plan === 'pro' ? 'rgba(139,92,246,0.3)' : 'rgba(245,183,49,0.25)';
  var btnTextColor = plan === 'pro' ? '#FFFFFF' : '#0E1523';

  var defaultTitle = 'Available on ' + planLabel;
  var defaultDesc = plan === 'growth'
    ? 'Upgrade to Growth to unlock email blasts, paid ticketing, membership dues, full analytics, and more.'
    : 'Upgrade to Pro to unlock unlimited pages, AI content assistant, custom domain, and priority support.';

  var heading = title || defaultTitle;
  var body = description || defaultDesc;

  function handleUpgrade() {
    if (organizationId) {
      navigate('/organizations/' + organizationId + '/billing');
    } else {
      navigate('/pricing');
    }
  }

  // ── Compact banner (inline, single line) ─────────────────────────────────
  if (compact) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', padding: '10px 14px',
          background: planBg, border: '1px solid ' + planBorder, borderRadius: '8px',
          flexWrap: 'wrap'
        }}
        role="region"
        aria-label={'Upgrade to ' + planLabel + ' prompt'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={planColor} strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span style={{ fontSize: '13px', color: '#CBD5E1' }}>
            <strong style={{ color: planColor }}>{planLabel} feature — </strong>
            {body}
          </span>
        </div>
        <button
          onClick={handleUpgrade}
          style={{
            padding: '6px 14px', background: planColor, color: btnTextColor,
            fontWeight: 700, fontSize: '12px', borderRadius: '6px',
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
          aria-label={'Upgrade to ' + planLabel}
        >
          Upgrade
        </button>
      </div>
    );
  }

  // ── Full card ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: planBg,
        border: '1px solid ' + planBorder,
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
      }}
      role="region"
      aria-label={'Upgrade to ' + planLabel + ' prompt'}
    >
      {/* Lock icon */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: planBg, border: '1px solid ' + planBorder,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={planColor} strokeWidth="2" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      {/* Plan badge */}
      <span style={{
        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px',
        color: planColor, background: planBg, border: '1px solid ' + planBorder,
        padding: '3px 10px', borderRadius: '99px', display: 'inline-block', marginBottom: '12px'
      }}>
        {planLabel} Plan
      </span>

      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
        {heading}
      </h3>
      <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.6, marginBottom: features && features.length ? '16px' : '20px' }}>
        {body}
      </p>

      {/* Optional feature list */}
      {features && features.length > 0 && (
        <div style={{ textAlign: 'left', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {features.map(function(f, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={planColor} strokeWidth="2.5" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{f}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleUpgrade}
        style={{
          width: '100%', padding: '11px',
          background: planColor, color: btnTextColor,
          fontWeight: 700, fontSize: '14px',
          borderRadius: '8px', border: 'none', cursor: 'pointer',
        }}
        aria-label={'Upgrade to ' + planLabel + ' to unlock this feature'}
      >
        Upgrade to {planLabel}
      </button>

      <p style={{ fontSize: '11px', color: '#64748B', marginTop: '10px' }}>
        No platform fee on dues or donations.
      </p>
    </div>
  );
}
