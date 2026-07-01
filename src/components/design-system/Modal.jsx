// src/components/design-system/Modal.jsx
// Syndicade Modal — Design System §9 / Build List #7
// CODE RULE (§21): var only — never const/let.
//
// UPDATED July 1, 2026 (Programs retrofit follow-up) — added optional `saving` prop.
// Fixes a gap found during the Programs retrofit: footer buttons had no way to reflect
// an in-flight save, so a double-click (or a slow network) could fire the save handler
// twice. Fully backward-compatible — omit `saving` and nothing changes. When `saving`
// is true, all footer buttons (Save as Draft / Cancel / Publish / Save Changes) become
// disabled via Button's existing `disabled` prop (opacity 0.5, aria-disabled, still
// focusable — no new pattern introduced). The ✕ close button and Escape/backdrop
// behavior are intentionally left alone — closing mid-save is still allowed.
//
// Same gap likely exists wherever Opportunities/Funding call this Modal without
// passing `saving` — see Pending Tasks Group 2, MODAL-SAVING-PROP.

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
//   tabs: [{ id, label }] (optional)
//   activeTab, onTabChange: required if tabs is provided
//   mode: 'create-draft' | 'edit-live' (default 'edit-live')
//   onSaveAsDraft, onCancel, onPublish: used when mode='create-draft'
//   onCancel, onSaveChanges: used when mode='edit-live'
//   saving: bool (optional, default false) — disables all footer action buttons while true
//   children: body content

function Modal(props) {
  var title = props.title;
  var orgSubtitle = props.orgSubtitle;
  var onClose = props.onClose;
  var tabs = props.tabs;
  var activeTab = props.activeTab;
  var onTabChange = props.onTabChange;
  var mode = props.mode || 'edit-live';
  var saving = props.saving || false;

  var modalRef = useRef(null);
  useModalKeyboard(true, onClose, modalRef);

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
          <Button variant="ghost" onClick={props.onSaveAsDraft} disabled={saving}>Save as Draft</Button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="ghost" onClick={props.onCancel} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={props.onPublish} disabled={saving}>{saving ? 'Saving...' : 'Publish'}</Button>
          </div>
        </div>
      );
    }

    return (
      <div style={footerStyle}>
        <Button variant="ghost" onClick={props.onCancel} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={props.onSaveChanges} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
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