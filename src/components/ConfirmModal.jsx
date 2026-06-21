// src/components/ConfirmModal.jsx
// Syndicade ConfirmModal — Design System §9 / Build List #7
// RENAME, DON'T DUPLICATE: this replaces src/components/ConfirmDeleteModal.jsx. Rename that
// file (or overwrite its contents with this), then update every import of ConfirmDeleteModal
// to ConfirmModal. Existing call sites that don't pass `variant` keep the old red/destructive
// look by default — nothing breaks.
// CODE RULE (§21): var only — never const/let.
//
// CRITICAL: must always render conditionally — {open && <ConfirmModal ... />} — never pass
// `isOpen` as a prop, or it can auto-open on mount. Fixed once in Surveys; per the Build List
// carry-over note, verify this pattern in OrgFunding.jsx, PollCard.jsx, and CreatePoll.jsx too.
//
// FLAGGED FOR REVIEW (not literally in §9, a deliberate exception): §9's "full-screen on
// mobile" rule is written for content-heavy Create/Edit modals. Applying it literally to a
// 3-line confirm dialog would stretch a tiny box to fill the whole mobile screen. This file
// keeps ConfirmModal centered and compact on every breakpoint instead. Flag if you want the
// literal full-screen-on-mobile behavior here too.

// VERIFIED June 21, 2026 against real src/hooks/useModalKeyboard.js source: signature is
// (isOpen, onClose, modalRef) — caller creates the ref and passes it in, hook returns nothing.
// Since ConfirmModal only ever mounts while open, isOpen is passed as a constant `true`.

import { useRef } from 'react';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import Button from './design-system/Button'; // ConfirmModal stays flat in src/components/, Button lives in design-system/
import designTokens from '../lib/designTokens';

var OVERLAY_COLOR = 'rgba(0,0,0,0.5)'; // matches Modal.jsx

// props:
//   title: string
//   message: string
//   confirmLabel: string (e.g. "Delete", "Close Poll")
//   onConfirm: fn
//   onCancel: fn
//   variant: 'destructive' | 'neutral' (default 'destructive' — preserves old ConfirmDeleteModal behavior)

function ConfirmModal(props) {
  var title = props.title;
  var message = props.message;
  var confirmLabel = props.confirmLabel || 'Confirm';
  var variant = props.variant || 'destructive';
  var onCancel = props.onCancel;
  var onConfirm = props.onConfirm;

  var modalRef = useRef(null);
  useModalKeyboard(true, onCancel, modalRef); // ConfirmModal only ever mounts while open

  var confirmButtonVariant = variant === 'destructive' ? 'danger' : 'primary';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: OVERLAY_COLOR,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '16px'
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: '600px',
          borderRadius: '12px',
          border: designTokens.elevation.ELEVATION_FLOATING.border,
          boxShadow: designTokens.elevation.ELEVATION_FLOATING.shadow,
          padding: '20px'
        }}
      >
        <h2 id="confirm-modal-title" style={{ fontSize: '17px', fontWeight: 500, color: '#0E1523', margin: '0 0 8px 0' }}>
          {title}
        </h2>
        <p id="confirm-modal-message" style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px 0' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant={confirmButtonVariant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;