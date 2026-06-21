import toast from 'react-hot-toast';

// Light theme per Floating elevation (§1 token): white card, neutral hairline
// border by default. §5 specifically calls out that mascotErrorToast's
// red-tinted border must be KEPT (a meaningful signal, not overridden by the
// neutral hairline) — so error gets its colored border, everything else uses
// the standard neutral one.
function MascotToast({ t, imgSrc, borderColor, messageColor, message, subtext, keepColoredBorder }) {
  var borderStyle = keepColoredBorder ? ('2px solid ' + borderColor) : '0.5px solid #E2E8F0';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: '#FFFFFF',
      border: borderStyle,
      borderRadius: '12px', padding: '14px 16px',
      minWidth: '320px', maxWidth: '420px',
      opacity: t.visible ? 1 : 0,
      transition: 'opacity 0.2s',
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    }}>
      <img src={imgSrc} alt="" aria-hidden="true" style={{ width: '48px', height: 'auto', objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: messageColor, marginBottom: '2px' }}>{message}</div>
        {subtext && <div style={{ fontSize: '12px', color: '#64748B' }}>{subtext}</div>}
      </div>
      <button
        onClick={function() { toast.dismiss(t.id); }}
        style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#94A3B8', fontSize: '10px' }}
        aria-label="Dismiss notification"
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export function mascotSuccessToast(message, subtext) {
  toast.custom(function(t) {
    return (
      <MascotToast
        t={t}
        imgSrc="/mascot-success.png"
        borderColor="rgba(245,183,49,0.3)"
        messageColor="#F5B731"
        message={message}
        subtext={subtext}
      />
    );
  }, { duration: 4000 });
}

export function mascotErrorToast(message, subtext) {
  toast.custom(function(t) {
    return (
      <MascotToast
        t={t}
        imgSrc="/mascot-error.png"
        borderColor="rgba(239,68,68,0.3)"
        messageColor="#EF4444"
        message={message}
        subtext={subtext}
        keepColoredBorder={true}
      />
    );
  }, { duration: 5000 });
}