// src/components/design-system/ActionsDropdown.jsx
// Syndicade ActionsDropdown — Design System §8 / Build List #8
// Built on the verified useDropdownKeyboard(isOpen, onClose, containerRef) from
// src/hooks/useModalKeyboard.js — containerRef wraps BOTH the trigger button and the menu panel.
// CODE RULE (§21): var only — never const/let.
//
// Canonical order is fixed here, not per-consumer — that's the entire point of this shared
// component (§8): one place owns the order so it can't drift per file again. Each item only
// renders if the consumer passes its handler; visibility is controlled that way, never by
// reordering. No icons anywhere in this menu, including Export and Delete (§8).
//
// props:
//   triggerLabel: string — aria-label for the trigger, e.g. "Actions for Spring Food Drive"
//   onEdit, onDuplicate, onExport, onMakeTemplate, onSavePost, onRemind, onDelete: fn — item
//     hidden if omitted. (Export acts on this single item only, never bulk.)
//   pinState: 'pinned' | 'unpinned' — Pin/Unpin hidden unless this AND onPinToggle are set
//   onPinToggle: fn
//   closeState: 'open' | 'closed' — Close/Reopen hidden unless this AND onCloseToggle are set
//   onCloseToggle: fn
//   isLive: bool — Unpublish only shows when true AND onUnpublish is set (live items only, §8)
//   onUnpublish: fn

import { useState, useRef, useLayoutEffect, Fragment } from 'react';
import { useDropdownKeyboard } from '../../hooks/useModalKeyboard';
import designTokens from '../../lib/designTokens';

var MENU_ITEM_STYLE = {
  display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
  fontSize: '14px', fontWeight: 400, color: '#0E1523', background: 'transparent',
  border: 'none', cursor: 'pointer'
};
var DELETE_ITEM_STYLE = {
  display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
  fontSize: '14px', fontWeight: 400, color: '#EF4444', background: 'transparent',
  border: 'none', cursor: 'pointer'
};

function ActionsDropdown(props) {
  var openState = useState(false);
  var isOpen = openState[0];
  var setIsOpen = openState[1];

  var dropUpState = useState(false);
  var dropUp = dropUpState[0];
  var setDropUp = dropUpState[1];

  var containerRef = useRef(null); // wraps trigger button + menu panel together
  var triggerButtonRef = useRef(null);
  var menuRef = useRef(null);

  function close() {
    setIsOpen(false);
  }

  useDropdownKeyboard(isOpen, close, containerRef);

  // Auto-flip: opens downward by default, flips upward only if there's no room below (§8).
  useLayoutEffect(function () {
    if (!isOpen || !triggerButtonRef.current || !menuRef.current) {
      return;
    }
    var triggerRect = triggerButtonRef.current.getBoundingClientRect();
    var menuHeight = menuRef.current.offsetHeight;
    var spaceBelow = window.innerHeight - triggerRect.bottom;
    var spaceAbove = triggerRect.top;
    setDropUp(spaceBelow < menuHeight && spaceAbove > spaceBelow);
  }, [isOpen]);

  function toggleOpen() {
    setIsOpen(!isOpen);
  }

  function makeHandler(fn) {
    return function () {
      close();
      if (fn) {
        fn();
      }
    };
  }

  var pinLabel = props.pinState === 'pinned' ? 'Unpin' : 'Pin';
  var closeLabel = props.closeState === 'closed' ? 'Reopen' : 'Close';

  var items = [];
  if (props.onEdit) { items.push({ key: 'edit', label: 'Edit', onClick: makeHandler(props.onEdit), style: MENU_ITEM_STYLE }); }
  if (props.onDuplicate) { items.push({ key: 'duplicate', label: 'Duplicate', onClick: makeHandler(props.onDuplicate), style: MENU_ITEM_STYLE }); }
  if (props.onExport) { items.push({ key: 'export', label: 'Export', onClick: makeHandler(props.onExport), style: MENU_ITEM_STYLE }); }
  if (props.onMakeTemplate) { items.push({ key: 'make-template', label: 'Make Template', onClick: makeHandler(props.onMakeTemplate), style: MENU_ITEM_STYLE }); }
  if (props.pinState && props.onPinToggle) { items.push({ key: 'pin', label: pinLabel, onClick: makeHandler(props.onPinToggle), style: MENU_ITEM_STYLE }); }
  if (props.onSavePost) { items.push({ key: 'save-post', label: 'Save Post', onClick: makeHandler(props.onSavePost), style: MENU_ITEM_STYLE }); }
  if (props.onRemind) { items.push({ key: 'remind', label: 'Remind', onClick: makeHandler(props.onRemind), style: MENU_ITEM_STYLE }); }
  if (props.closeState && props.onCloseToggle) { items.push({ key: 'close-reopen', label: closeLabel, onClick: makeHandler(props.onCloseToggle), style: MENU_ITEM_STYLE }); }

  var unpublishShown = props.isLive && props.onUnpublish;
  if (unpublishShown) { items.push({ key: 'unpublish', label: 'Unpublish', onClick: makeHandler(props.onUnpublish), style: MENU_ITEM_STYLE, dividerBefore: true }); }
  if (props.onDelete) { items.push({ key: 'delete', label: 'Delete', onClick: makeHandler(props.onDelete), style: DELETE_ITEM_STYLE, dividerBefore: !unpublishShown }); }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        ref={triggerButtonRef}
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={props.triggerLabel || 'Actions'}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '16px', color: '#64748B' }}
      >
        ▾
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={props.triggerLabel || 'Actions'}
          style={{
            position: 'absolute',
            right: 0,
            top: dropUp ? 'auto' : 'calc(100% + 4px)',
            bottom: dropUp ? 'calc(100% + 4px)' : 'auto',
            minWidth: '180px',
            background: '#FFFFFF',
            border: designTokens.elevation.ELEVATION_FLOATING.border,
            boxShadow: designTokens.elevation.ELEVATION_FLOATING.shadow,
            borderRadius: '12px',
            padding: '4px',
            zIndex: 40
          }}
        >
          {items.map(function (item) {
            return (
              <Fragment key={item.key}>
                {item.dividerBefore ? <div role="separator" style={{ borderTop: '0.5px solid #E2E8F0', margin: '4px 0' }} /> : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={item.onClick}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  style={item.style}
                >
                  {item.label}
                </button>
              </Fragment>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default ActionsDropdown;