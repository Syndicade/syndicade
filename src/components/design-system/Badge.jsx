// src/components/design-system/Badge.jsx
// Syndicade Badge — Design System §7 / Build List #3
// Passive, non-interactive, pill-shaped, colored by meaning only. No icons (not on the §3 allowlist).
// CODE RULE (§21): var only — never const/let.

import designTokens from '../../lib/designTokens';

var VARIANT_STYLES = {
  active: { color: '#166534', background: '#DCFCE7' },
  open: { color: '#166534', background: '#DCFCE7' }, // alias — §7 table lists "Active / Open" as one row, same style
  featured: { color: '#92400E', background: 'rgba(245,183,49,0.15)', border: '1px solid #F5B731' },
  urgent: { color: '#991B1B', background: '#FEE2E2' },
  paid: { color: '#1E40AF', background: '#DBEAFE' },
  pending: { color: '#92400E', background: '#FEF3C7' },
  neutral: { color: '#475569', background: '#F1F5F9', border: '0.5px solid #E2E8F0' } // Draft, Members Only, Public, Free, Scholarship, Volunteer, etc.
};

// props:
//   variant: 'active' | 'open' | 'featured' | 'urgent' | 'paid' | 'pending' | 'neutral' (default 'neutral')
//   children: label text (always required — badges never rely on color alone, §20)

function Badge(props) {
  var variant = props.variant || 'neutral';
  var variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;

  var style = {
    display: 'inline-block',
    padding: designTokens.badge.BADGE_PADDING,
    borderRadius: designTokens.badge.BADGE_RADIUS,
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    color: variantStyle.color,
    background: variantStyle.background,
    border: variantStyle.border || 'none'
  };

  return <span style={style}>{props.children}</span>;
}

export default Badge;