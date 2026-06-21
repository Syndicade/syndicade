// src/components/design-system/Chip.jsx
// Syndicade Chip — Design System §7 / Build List #4
// Interactive/toggle, squarish, distinct from Badge. CODE RULE (§21): var only — never const/let.

import designTokens from '../../lib/designTokens';

// Decided June 21, 2026 — NOT specified in §7, confirmed with user, needs adding to Design System next session:
//   - Unselected/default style: #F1F5F9 bg / #475569 text / 0.5px solid #E2E8F0 border
//     (reuses Badge "neutral" variant + ELEVATED token — one consistent neutral look platform-wide)
//   - Default active color for generic filter chips (outside Community Board / tag-picker): Primary Blue #3B82F6
//     (consistent with §1: blue already means "interactive / selected" everywhere else)

var ACTIVE_COLOR_MAP = {
  blue: '#3B82F6',   // default / Collaboration board / tag-picker (universal selection color)
  purple: '#A78BFA', // Ask Board
  green: '#22C55E'   // Offer Board
};

var NEUTRAL_BG = '#F1F5F9';
var NEUTRAL_TEXT = '#475569';
var NEUTRAL_BORDER = '0.5px solid #E2E8F0';

// props:
//   selected: bool
//   onClick: fn
//   activeColor: 'blue' | 'purple' | 'green' (default 'blue') — ignored when variant="custom"
//   variant: 'platform' | 'custom' (default 'platform') — 'custom' stays grey even when selected
//     (tag-picker non-platform/custom tags, §17)
//   children: label text — include counts inline, e.g. "All (12)"
//   ariaLabel: optional override for screen readers

function Chip(props) {
  var selected = props.selected || false;
  var variant = props.variant || 'platform';
  var activeColorKey = props.activeColor || 'blue';
  var activeHex = ACTIVE_COLOR_MAP[activeColorKey] || ACTIVE_COLOR_MAP.blue;
  var showActive = selected && variant !== 'custom';

  var style = {
    padding: designTokens.chip.CHIP_PADDING,
    borderRadius: designTokens.chip.CHIP_RADIUS,
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    border: showActive ? ('1px solid ' + activeHex) : NEUTRAL_BORDER,
    background: showActive ? activeHex : NEUTRAL_BG,
    color: showActive ? '#FFFFFF' : NEUTRAL_TEXT
  };

  function handleClick(e) {
    if (props.onClick) {
      props.onClick(e);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={handleClick}
      style={style}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      aria-label={props.ariaLabel || undefined}
    >
      {props.children}
    </button>
  );
}

export default Chip;