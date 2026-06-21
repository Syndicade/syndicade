// src/components/design-system/Modal.jsx
// Syndicade Modal — Design System §9 / Build List #7
// Shell + owns the tab bar (via TabBar). Built on useModalKeyboard (existing hook).
// CODE RULE (§21): var only — never const/let.
//
// CRITICAL: must always render conditionally — {open && <Modal ... />} — never pass an
// `isOpen` prop and keep this always mounted (same bug class fixed in ConfirmModal).
//
// Decided June 21, 2026 — NOT specified in §9, confirmed with user:
//   Backdrop overlay: rgba(0,0,0,0.5) — matches the neutral-black convention already used
//   for every shadow value in the Design System, rather than a new tinted color.
//   Backdrop click does NOT close the modal — only Escape and the close button do
//   (prevents accidental loss of unsaved form data in Create/Edit modals).
//
// VERIFIED June 21, 2026 against real src/hooks/useModalKeyboard.js source:
// signature is (isOpen, onClose, modalRef) — the caller creates the ref and passes it in;
// the hook does not return one. It auto-captures the trigger element via document.activeElement
// at mount and restores focus to it on cleanup, and Tab-traps focus inside modalRef. Since this
// Modal only ever mounts while open, isOpen is passed as a constant `true`.

import { useRef } from 'react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import TabBar from './TabBar';
import Button from './Button';
import designTokens from '../../lib/designTokens';

var OVERLAY_COLOR = 'rgba(0,0,0,0.5)';

var RESPONSIVE_STYLE = '\
  .syn-modal-container { width: 100%; max-width: 600px; max-height: 90vh; border-radius: 12px; }\
  @media (max-width: 767px) {\
    .syn-modal-overlay { padding: 0 !important; align-items: stretch !important; }\
    .syn-modal-container { max-width: 100% !important; max-height: 100vh !important; height: 100vh; border-radius: 0 !important; }\
  }\
';

// props:
//   title: string (required)
//   orgSubtitle: string (optional)
//   onClose: fn (required)
//   tabs: [{ id, label }] (optional — omit for single-section modals)
//   activeTab, onTabChange: required if tabs is provided
//   mode: 'create-draft' | 'edit-live' (default 'edit-live')
//   onSaveAsDraft, onCancel, onPublish: used when mode='create-draft'
//   onCancel, onSaveChanges: used when mode='edit-live'
//   children: body content

function Modal(props) {
  var title = props.title;
  var orgSubtitle = props.orgSubtitle;
  var onClose = props.onClose;
  var tabs = props.tabs;
  var activeTab = props.activeTab;
  var onTabChange = props.onTabChange;
  var mode = props.mode || 'edit-live';

  var modalRef = useRef(null);
  useModalKeyboard(true, onClose, modalRef); // Modal only ever mounts while open

  function renderFooter() {
    var footerStyle = {
      borderTop: '0.5px solid #E2E8F0',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: mode === 'create-draft' ? 'space-between' : 'flex-end',
      gap: '12px',
      flexShrink: 0
    };

    if (mode === 'create-draft') {
      return (
        <div style={footerStyle}>
          <Button variant="ghost" onClick={props.onSaveAsDraft}>Save as Draft</Button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="ghost" onClick={props.onCancel}>Cancel</Button>
            <Button variant="primary" onClick={props.onPublish}>Publish</Button>
          </div>
        </div>
      );
    }

    return (
      <div style={footerStyle}>
        <Button variant="ghost" onClick={props.onCancel}>Cancel</Button>
        <Button variant="primary" onClick={props.onSaveChanges}>Save Changes</Button>
      </div>
    );
  }

  return (
    <div
      className="syn-modal-overlay"
      style={{
        position: 'fixed', inset: 0, background: OVERLAY_COLOR,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px'
      }}
    >
      <style>{RESPONSIVE_STYLE}</style>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="syn-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          background: '#FFFFFF',
          border: designTokens.elevation.ELEVATION_FLOATING.border,
          boxShadow: designTokens.elevation.ELEVATION_FLOATING.shadow,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 20px 0 20px', flexShrink: 0 }}>
          <div>
            <h2 id="modal-title" style={{ fontSize: '17px', fontWeight: 500, color: '#0E1523', margin: 0 }}>{title}</h2>
            {orgSubtitle ? <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>{orgSubtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748B', lineHeight: 1, padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {tabs ? (
          <div style={{ padding: '12px 20px 0 20px', flexShrink: 0 }}>
            <TabBar tabs={tabs} activeTab={activeTab} onChange={onTabChange} ariaLabel={title + ' sections'} />
          </div>
        ) : null}

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {props.children}
        </div>

        {renderFooter()}
      </div>
    </div>
  );
}

export default Modal;