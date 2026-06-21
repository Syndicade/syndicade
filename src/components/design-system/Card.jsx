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

import { Clock, Calendar, MapPin } from 'lucide-react';
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
//   footerLeft: string | node — count/status text
//   footerRight: node — pass an <ActionsDropdown /> (admin) or a "View details" <Button /> (public/member), per §19
//   ariaLabel: string — optional override, defaults to title

function Card(props) {
  var title = props.title;
  var description = props.description;
  var metadata = props.metadata || [];
  var badges = props.badges || [];

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

  return (
    <article role="listitem" aria-label={props.ariaLabel || title} style={cardStyle}>
      <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#0E1523', margin: 0 }}>{title}</h3>

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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {badges.map(function (badge, index) {
            return <Badge key={index} variant={badge.variant}>{badge.label}</Badge>;
          })}
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