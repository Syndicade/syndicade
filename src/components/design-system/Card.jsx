// src/components/design-system/Card.jsx
// Syndicade Card (List Card variant) — Design System §8 / Build List #9
// Pure presentational shell — no type-specific business logic. Existing per-type card files
// (AnnouncementCard.jsx, PollCard.jsx, SurveyCard.jsx, SignupFormCard.jsx, DocumentCard.jsx,
// MemberCard.jsx) become thin adapters: keep their own data shaping, map it into these props,
// render <Card /> instead of hand-rolled markup. Per §8: Programs, Opportunities, Funding,
// Polls, Surveys, Sign-Up Forms, Announcements, Member Directory, Document Library.
// Post-it cards are explicitly out of scope — they keep their own hand-built pattern.
// CODE RULE (§21): var only — never const/let.
// Icons: lucide-react (confirmed installed, ^0.562.0).
//
// NOTE: this renders ONE card only. The grid (repeat(auto-fit, minmax(280px,1fr)), 3/2/1-col)
// belongs to the parent layout (ListPageLayout.jsx, Build List #10) — not duplicated here.
//
// ADDED June 22, 2026 (Sign-Up Forms retrofit) — two new, fully optional, backward-compatible
// capabilities. Every existing consumer that doesn't pass these props renders exactly as before:
//   1. `pinned` — Pin icon next to title, per §8's "Pinned" row (Polls/Surveys/Announcements/
//      Sign-Up Forms). Generic on purpose — any consumer can use it, not type-specific.
//   2. `expandable` + `isExpanded` + `onToggleExpand` + `expandableContent` — lets a card reveal
//      extra content (e.g. Sign-Up Forms' items/responses panel) without that content living in
//      the shared component. The footer (incl. Actions) always renders regardless of expand
//      state — same fix already applied per-module for "Actions hidden behind expand" (§8 known
//      violation) now lives here once, for everyone.

import { Pin, ChevronDown, ChevronRight, Clock, Calendar, MapPin } from 'lucide-react';
import Badge from './Badge';
import designTokens from '../../lib/designTokens';

var METADATA_ICONS = {
  clock: Clock,
  calendar: Calendar,
  location: MapPin
  // People/person icons intentionally NOT mapped here — banned per §3/§8. Any other
  // `type` value just renders as plain text with no icon, by design.
};

// props:
//   title: string (required) — always rendered first
//   description: string — 2-line clamp, shown whenever provided
//   metadata: [{ type: 'clock' | 'calendar' | 'location' | 'text', text: string }]
//     (max 2–3 rows recommended per §8; unrecognized/omitted type = text only, no icon)
//   badges: [{ variant, label }] — rendered via Badge, shown above the footer divider
//   pinned: bool (optional) — Pin icon next to title, sorting is the consumer's job
//   expandable: bool (optional) — shows a chevron toggle next to title
//   isExpanded: bool — required if expandable is true
//   onToggleExpand: fn — required if expandable is true
//   expandableContent: node — rendered between badges and footer, only while isExpanded
//   footerLeft: string | node — count/status text
//   footerRight: node — pass an <ActionsDropdown /> (admin) or a "View details" <Button /> (public/member), per §19
//   ariaLabel: string — optional override, defaults to title

function Card(props) {
  var title = props.title;
  var description = props.description;
  var metadata = props.metadata || [];
  var badges = props.badges || [];
  var pinned = props.pinned || false;
  var expandable = props.expandable || false;
  var isExpanded = props.isExpanded || false;
  var onToggleExpand = props.onToggleExpand;
  var expandableContent = props.expandableContent;

  var cardStyle = {
    background: '#FFFFFF',
    border: designTokens.elevation.ELEVATION_FLAT.border,
    borderRadius: designTokens.elevation.ELEVATION_FLAT.radius,
    boxShadow: designTokens.elevation.ELEVATION_FLAT.shadow,
    padding: '16px', // gap-4 / p-4 token — §1 "Card padding, form fields"
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
        <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#0E1523', margin: 0 }}>{title}</h3>
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