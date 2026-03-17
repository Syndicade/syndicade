import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

/**
 * PageHeader Component
 *
 * Props:
 * - title: string (required)
 * - subtitle: string (optional)
 * - icon: ReactNode (optional) — SVG icon node
 * - backTo: string (optional)
 * - backLabel: string (optional, default: "Back")
 * - organizationName: string (optional)
 * - organizationId: string (optional)
 * - actions: ReactNode (optional)
 */
function PageHeader({
  title,
  subtitle,
  icon,
  backTo,
  backLabel,
  organizationName,
  organizationId,
  actions
}) {
  var navigate = useNavigate();
  var { isDark } = useTheme();
  var resolvedBackLabel = backLabel || 'Back';

  var bgColor      = isDark ? '#151B2D' : '#FFFFFF';
  var borderColor  = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary  = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary= isDark ? '#CBD5E1'  : '#475569';
  var textMuted    = isDark ? '#94A3B8'  : '#64748B';
  var hoverBg      = isDark ? '#1E2845'  : '#F1F5F9';

  function handleBack() {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  }

  return (
    <div style={{ background: bgColor, borderBottom: '1px solid ' + borderColor }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px' }}>

        {/* Back button + breadcrumbs */}
        {(backTo || organizationName) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
            <button
              onClick={handleBack}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: textSecondary, background: 'transparent', border: 'none',
                fontWeight: 600, cursor: 'pointer', padding: '4px 8px', borderRadius: '6px',
              }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-opacity-10"
              onMouseEnter={function(e) { e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
              aria-label={resolvedBackLabel}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {resolvedBackLabel}
            </button>

            {organizationName && (
              <>
                <span style={{ color: textMuted }}>/</span>
                {organizationId ? (
                  <button
                    onClick={function() { navigate('/organizations/' + organizationId); }}
                    style={{ color: '#3B82F6', background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {organizationName}
                  </button>
                ) : (
                  <span style={{ color: textSecondary, fontWeight: 600 }}>{organizationName}</span>
                )}
                <span style={{ color: textMuted }}>/</span>
                <span style={{ color: textPrimary, fontWeight: 700 }}>{title}</span>
              </>
            )}
          </div>
        )}

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {icon && (
                <span style={{ color: '#F5B731', flexShrink: 0 }} aria-hidden="true">
                  {icon}
                </span>
              )}
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: textPrimary, margin: 0, lineHeight: 1.2 }}>
                  {title}
                </h1>
                {subtitle && (
                  <p style={{ marginTop: '4px', color: textSecondary, fontSize: '14px', lineHeight: 1.5 }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {actions && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {actions}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default PageHeader;