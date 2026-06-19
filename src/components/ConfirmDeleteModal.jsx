import { useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useModalKeyboard } from '../hooks/useModalKeyboard';

var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// Shared confirm-delete dialog. Pass a JSX/string `message` and a `title`;
// `onConfirm`/`onCancel` are called with no arguments — close the modal yourself
// from the caller's state before performing the delete.
function ConfirmDeleteModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  var modalRef = useRef(null);
  useModalKeyboard(true, onCancel, modalRef);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}>
      <div ref={modalRef} style={{ background: cardBg, borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
          <AlertCircle size={22} color="#EF4444" />
        </div>
        <h3 id="confirm-delete-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, textAlign: 'center', marginBottom: '8px' }}>
          {title || 'Delete this item?'}
        </h3>
        <p style={{ fontSize: '13px', color: textSecondary, textAlign: 'center', lineHeight: 1.6, marginBottom: '24px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: textMuted, cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">{confirmLabel || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;