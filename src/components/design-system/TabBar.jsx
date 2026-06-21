// src/components/design-system/TabBar.jsx
// Syndicade TabBar — Design System §9 / Build List #6
// Standalone — consumed by Modal internally AND directly on Settings pages (§13.4).
// CODE RULE (§21): var only — never const/let.

import { useRef } from 'react';

var ACTIVE_COLOR = '#3B82F6';
var INACTIVE_COLOR = '#475569'; // Text Secondary — §9 says "default text color", this is that token

// Decided June 21, 2026 — NOT specified in §9, confirmed with user, needs adding to Design System next session:
//   font: 14px / weight 600 active, 500 inactive
//   gap: 24px between tabs (existing gap-6 token)
//   underline: 2px solid #3B82F6 active / 2px solid transparent inactive (no separate full-width divider)

// props:
//   tabs: [{ id, label }]
//   activeTab: string — id of the active tab
//   onChange: fn(id)
//   ariaLabel: string — label for the tablist, e.g. "Event settings sections"

function TabBar(props) {
  var tabs = props.tabs || [];
  var activeTab = props.activeTab;
  var tabRefs = useRef({});

  function focusTab(id) {
    var el = tabRefs.current[id];
    if (el) {
      el.focus();
    }
  }

  function handleChange(id) {
    if (props.onChange) {
      props.onChange(id);
    }
  }

  function handleKeyDown(e, index) {
    var lastIndex = tabs.length - 1;
    var nextIndex = null;

    if (e.key === 'ArrowRight') {
      nextIndex = index === lastIndex ? 0 : index + 1;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = index === 0 ? lastIndex : index - 1;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = lastIndex;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      var nextTab = tabs[nextIndex];
      handleChange(nextTab.id);
      focusTab(nextTab.id);
    }
  }

  var containerStyle = { display: 'flex', gap: '24px' };

  return (
    <div role="tablist" aria-label={props.ariaLabel || 'Tabs'} style={containerStyle}>
      {tabs.map(function (tab, index) {
        var isActive = tab.id === activeTab;
        var tabStyle = {
          padding: '12px 4px',
          fontSize: '14px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
          background: 'transparent',
          border: 'none',
          borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
          cursor: 'pointer'
        };

        function setRef(el) {
          tabRefs.current[tab.id] = el;
        }
        function onClick() {
          handleChange(tab.id);
        }
        function onKeyDown(e) {
          handleKeyDown(e, index);
        }

        return (
          <button
            key={tab.id}
            ref={setRef}
            role="tab"
            id={'tab-' + tab.id}
            aria-selected={isActive}
            aria-controls={'tabpanel-' + tab.id}
            tabIndex={isActive ? 0 : -1}
            onClick={onClick}
            onKeyDown={onKeyDown}
            style={tabStyle}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default TabBar;