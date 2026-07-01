// src/components/design-system/Card.jsx
// Syndicade Card (List Card variant) — Design System §8 / Build List #9
// CODE RULE (§21): var only — never const/let.
//
// UPDATED July 1, 2026 (Programs retrofit) — added optional `titleAction` prop.
// Fully backward-compatible: existing consumers that don't pass it render unchanged.
// Renders a small action slot at the end of the title row (e.g. a bookmark toggle
// on member-facing cards). Generic on purpose, like `pinned`/`expandable` before it —
// any consumer can use it, not type-specific.

import { Pin, ChevronDown, ChevronRight, Clock, Calendar, MapPin } from 'lucide-react';
import Badge from './Badge';
import designTokens from '../../lib/designTokens';

var METADATA_ICONS = {
  clock: Clock,
  calendar: Calendar,
  location: MapPin
  // People/person icons intentionally NOT mapped here — banned per §3/§8.
};

// props:
//   title: string (required)
//   description: string
//   metadata: [{ type: 'clock' | 'calendar' | 'location' | 'text', text: string }]
//   badges: [{ variant, label }]
//   pinned: bool (optional)
//   titleAction: node (optional) — small action rendered at the end of the title row
//     (e.g. bookmark toggle). Does not affect layout when omitted.
//   expandable: bool (optional)
//   isExpanded: bool
//   onToggleExpand: fn
//   expandableContent: node
//   footerLeft: string | node
//   footerRight: node
//   ariaLabel: string

function Card(props) {
  var title = props.title;
  var description = props.description;
  var metadata = props.metadata || [];
  var badges = props.badges || [];
  var pinned = props.pinned || false;
  var titleAction = props.titleAction;
  var expandable = props.expandable || false;
  var isExpanded = props.isExpanded || false;
  var onToggleExpand = props.onToggleExpand;
  var expandableContent = props.expandableContent;

  var cardStyle = {
    background: '#FFFFFF',
    border: designTokens.elevation.ELEVATION_FLAT.border,
    borderRadius: designTokens.elevation.ELEVATION_FLAT.radius,
    boxShadow: designTokens.elevation.ELEVATION_FLAT.shadow,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column'
  };

  var descriptionStyle = {
    fontSize: '13px',
    fontWeight: 400,
    color: '#475569',
    margin: '4px 0 8px 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };

  function handleToggle() {
    if (onToggleExpand) {
      onToggleExpand();
    }
  }

  function handleToggleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }

  var headerContent = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {pinned ? <Pin size={15} fill="#F5B731" style={{ color: '#B45309', flexShrink: 0 }} aria-hidden="true" /> : null}
        <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#0E1523', margin: 0, flex: 1, minWidth: 0 }}>{title}</h3>
        {titleAction ? <span style={{ flexShrink: 0 }}>{titleAction}</span> : null}
      </div>

      {description ? <p style={descriptionStyle}>{description}</p> : null}

      {metadata.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
          {metadata.map(function (row, index) {
            var IconComponent = METADATA_ICONS[row.type] || null;
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 400, color: '#64748B' }}>
                {IconComponent ? <IconComponent size={14} aria-hidden="true" /> : null}
                <span>{row.text}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {badges.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
          {badges.map(function (badge, index) {
            return <Badge key={index} variant={badge.variant}>{badge.label}</Badge>;
          })}
        </div>
      ) : null}
    </div>
  );

  return (
    <article role="listitem" aria-label={props.ariaLabel || title} style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: badges.length > 0 ? '8px' : '0' }}>
        {expandable ? (
          <button
            type="button"
            onClick={handleToggle}
            onKeyDown={handleToggleKeyDown}
            aria-expanded={isExpanded}
            aria-label={(isExpanded ? 'Collapse ' : 'Expand ') + title}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            style={{ background: 'transparent', border: 'none', padding: '2px 0 0 0', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}
          >
            {isExpanded ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
          </button>
        ) : null}
        {headerContent}
      </div>

      {expandable && isExpanded && expandableContent ? (
        <div style={{ marginBottom: '12px' }}>
          {expandableContent}
        </div>
      ) : null}

      <div style={{
        marginTop: 'auto',
        borderTop: '0.5px solid #E2E8F0',
        paddingTop: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '13px', color: '#64748B' }}>{props.footerLeft}</span>
        {props.footerRight}
      </div>
    </article>
  );
}

export default Card;