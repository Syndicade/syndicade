import toast from 'react-hot-toast';

export function mascotSuccessToast(message, subtext) {
  toast.custom(function(t) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: '#1A2035', border: '2px solid rgba(245,183,49,0.3)',
        borderRadius: '12px', padding: '14px 16px',
        minWidth: '300px', maxWidth: '400px',
        opacity: t.visible ? 1 : 0,
        transition: 'opacity 0.2s',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
      }}>
<img
  src="/mascot-pair.png"
  alt=""
  style={{ width: '64px', height: '64px', objectFit: 'contain', flexShrink: 0 }}
/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F5B731', marginBottom: '2px' }}>{message}</div>
          {subtext && <div style={{ fontSize: '12px', color: '#94A3B8' }}>{subtext}</div>}
        </div>
        <button
          onClick={function() { toast.dismiss(t.id); }}
          style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#94A3B8', fontSize: '10px' }}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    );
  }, { duration: 4000 });
}