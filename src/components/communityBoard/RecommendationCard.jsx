/**
 * RecommendationCard.jsx — Syndicade Community Board
 * Recommendation 4: "Read more" expand toggle for long recommendation bodies.
 */
import { useState } from 'react';
import {
  CARD, BDR, TEXT, TEXT2, MUTED, YELLOW, BLUE, RED,
  BOARD_CONFIG, getInitials, getExpiryInfo, timeAgo, formatDateTime, normalizeUrl,
  StatusBadge, ExpiryBadges, OrgAvatar, UnreadBubble, RenewButton,
  IconPin, IconEdit, IconTrash, IconThumbsUp, IconGlobe, IconExternalLink,
  IconMail, IconPhone, IconUser, IconRefresh, IconX, IconChevronDown, IconChevronUp
} from './cbUtils';

var BODY_CLAMP_CHARS = 220;

// ─── VendorContactRow ─────────────────────────────────────────────────────────
export function VendorContactRow(props) {
  var c = props.contact, idx = props.index;
  var inputStyle = { padding: '8px 10px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '7px', color: '#0E1523', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', width: '100%' };
  function update(field, val) { props.onChange(idx, Object.assign({}, c, { [field]: val })); }
  return (
    <div style={{ padding: '12px', background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', position: 'relative' }}>
      <button onClick={function() { props.onRemove(idx); }} aria-label={'Remove contact ' + (idx + 1)}
        style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(239,68,68,0.10)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
        <IconX size={10} />
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingRight: '28px' }}>
        <div>
          <label htmlFor={'vc-name-' + idx} style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '3px' }}>Name <span style={{ color: RED }}>*</span></label>
          <input id={'vc-name-' + idx} type="text" value={c.name || ''} onChange={function(e) { update('name', e.target.value); }} maxLength={80} placeholder="Jane Smith" style={inputStyle} />
        </div>
        <div>
          <label htmlFor={'vc-title-' + idx} style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '3px' }}>Title</label>
          <input id={'vc-title-' + idx} type="text" value={c.title || ''} onChange={function(e) { update('title', e.target.value); }} maxLength={80} placeholder="Account Manager" style={inputStyle} />
        </div>
        <div>
          <label htmlFor={'vc-email-' + idx} style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '3px' }}>Email</label>
          <input id={'vc-email-' + idx} type="email" value={c.email || ''} onChange={function(e) { update('email', e.target.value); }} maxLength={120} placeholder="jane@vendor.com" style={inputStyle} />
        </div>
        <div>
          <label htmlFor={'vc-phone-' + idx} style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '3px' }}>Phone</label>
          <input id={'vc-phone-' + idx} type="tel" value={c.phone || ''} onChange={function(e) { update('phone', e.target.value); }} maxLength={30} placeholder="555-123-4567" style={inputStyle} />
        </div>
      </div>
    </div>
  );
}

// ─── RecommendationCard ───────────────────────────────────────────────────────
export default function RecommendationCard(props) {
  var post = props.post, cfg = BOARD_CONFIG.recommendations, isOwn = props.isOwn;
  var isBoardAdmin = props.isBoardAdmin || false;
  var contacts = props.contacts || [];
  var unreadCount = props.unreadCount || 0;
  var postReactions = props.reactions || {};
  var endorseCount = postReactions['endorse_count'] || 0;
  var hasEndorsed = postReactions['my_endorse'] || false;
  var expiryInfo = getExpiryInfo(post.expires_at);
  var isExpired = expiryInfo && expiryInfo.isExpired;
  var isExpiringSoon = expiryInfo && expiryInfo.isExpiringSoon && !isExpired;
  var pinShadow = post.is_pinned
    ? '3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05),inset 0 0 0 2px ' + YELLOW
    : '3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)';
  var websiteUrl = post.website_url ? normalizeUrl(post.website_url) : null;

  // Recommendation 4: expandable body
  var bodyIsLong = (post.body || '').length > BODY_CLAMP_CHARS;
  var [expanded, setExpanded] = useState(false);

  return (
    <article role="listitem" aria-label={post.org_name + ' recommendation: ' + post.title}
      style={{ background: cfg.cardBg, borderRadius: '12px', padding: '16px', position: 'relative', boxShadow: pinShadow, display: 'flex', flexDirection: 'column', opacity: isExpired ? 0.65 : 1 }}>

      {post.is_pinned && (
        <div aria-label="Pinned post" style={{ position: 'absolute', top: '-9px', left: '14px', display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', background: YELLOW, borderRadius: '99px', fontSize: '9px', fontWeight: 800, color: '#111827', letterSpacing: '0.5px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
          <IconPin size={8} />PINNED
        </div>
      )}

      {/* Action buttons */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 2 }}>
        {isBoardAdmin && (
          <button onClick={function() { props.onTogglePin(post); }}
            aria-label={post.is_pinned ? 'Unpin post' : 'Pin post to top'}
            style={{ width: '24px', height: '24px', borderRadius: '50%', background: post.is_pinned ? 'rgba(245,183,49,0.25)' : 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: post.is_pinned ? '#B45309' : '#6B7280' }}>
            <IconPin size={11} />
          </button>
        )}
        {isOwn && (
          <>
            <button onClick={function() { props.onEdit(post); }} aria-label="Edit recommendation"
              style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.10)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
              <IconEdit size={11} />
            </button>
            <button onClick={function() { props.onDelete(post); }} aria-label="Delete recommendation"
              style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
              <IconTrash size={11} />
            </button>
          </>
        )}
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap', paddingRight: (isBoardAdmin || isOwn) ? '64px' : '0' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: cfg.tagBg, color: cfg.tagText }}>{post.category}</span>
        <StatusBadge status={post.status || 'open'} isOwn={isOwn} onChange={function(s) { props.onStatusChange(post.id, s); }} />
        <ExpiryBadges expiryInfo={isExpired ? expiryInfo : (isExpiringSoon ? expiryInfo : null)} />
      </div>

      {/* Org row + endorse count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <OrgAvatar name={post.org_name} bg={cfg.tagBg} color={cfg.tagText} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{post.org_name}</span>
        {endorseCount > 0 && (
          <div aria-label={endorseCount + ' endorsement' + (endorseCount === 1 ? '' : 's')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: 'rgba(251,140,0,0.15)', border: '1px solid rgba(251,140,0,0.35)', color: '#E65100', flexShrink: 0 }}>
            <IconThumbsUp size={11} />{endorseCount}
          </div>
        )}
      </div>

      {/* Vendor name */}
      <div style={{ fontSize: '15px', fontWeight: 800, color: TEXT, lineHeight: 1.3, marginBottom: '6px', paddingRight: '4px' }}>{post.title}</div>

      {/* Website */}
      {websiteUrl && (
        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={'Visit ' + post.title + ' website'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: BLUE, marginBottom: '8px', textDecoration: 'none', fontWeight: 500 }}>
          <IconGlobe size={11} />{post.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}<IconExternalLink size={11} />
        </a>
      )}

      {/* Body — Recommendation 4 */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          fontSize: '17px', fontWeight: 400, color: '#374151', lineHeight: 1.5,
          fontFamily: "'Patrick Hand',sans-serif",
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? undefined : 3,
          WebkitBoxOrient: expanded ? undefined : 'vertical',
          overflow: expanded ? 'visible' : 'hidden'
        }}>
          {post.body}
        </div>
        {bodyIsLong && (
          <button onClick={function() { setExpanded(!expanded); }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Show less' : 'Read more'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', background: 'none', border: 'none', color: MUTED, fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
            {expanded ? <><IconChevronUp size={11} />Show less</> : <><IconChevronDown size={11} />Read more</>}
          </button>
        )}
      </div>

      {/* Contacts */}
      {contacts.length > 0 && (
        <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px' }}>Contacts</p>
          {contacts.map(function(c, i) {
            return (
              <div key={c.id || i} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 10px', background: 'rgba(255,255,255,0.65)', borderRadius: '8px', border: '1px solid rgba(251,140,0,0.20)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: cfg.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconUser size={10} /></div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>{c.name}</span>
                  {c.title && <span style={{ fontSize: '11px', color: MUTED }}>{'· ' + c.title}</span>}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingLeft: '26px' }}>
                  {c.email && <a href={'mailto:' + c.email} aria-label={'Email ' + c.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: BLUE, textDecoration: 'none' }}><IconMail size={11} />{c.email}</a>}
                  {c.phone && <a href={'tel:' + c.phone} aria-label={'Call ' + c.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: TEXT2, textDecoration: 'none' }}><IconPhone size={11} />{c.phone}</a>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meta */}
      <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{formatDateTime(post.created_at)}</span>
        {post.response_count > 0 && <span>{'· ' + post.response_count + ' ' + (post.response_count === 1 ? 'response' : 'responses')}</span>}
      </div>

      {/* Endorse button */}
      {!isOwn && !isExpired && post.status !== 'completed' && (
        <div style={{ marginBottom: '8px' }}>
          <button onClick={function() { props.onReact(post.id, 'endorse'); }}
            aria-pressed={hasEndorsed}
            aria-label={(hasEndorsed ? 'Remove endorsement' : 'Endorse this vendor') + (endorseCount > 0 ? ', ' + endorseCount + ' total' : '')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, border: '1px solid ' + (hasEndorsed ? 'rgba(251,140,0,0.5)' : 'rgba(0,0,0,0.15)'), background: hasEndorsed ? 'rgba(251,140,0,0.15)' : 'rgba(255,255,255,0.55)', color: hasEndorsed ? '#E65100' : '#374151', cursor: 'pointer', transition: 'all 0.15s' }}>
            <IconThumbsUp size={12} />{hasEndorsed ? 'Endorsed' : 'Endorse'}{endorseCount > 0 ? ' · ' + endorseCount : ''}
          </button>
        </div>
      )}

      {/* Renew */}
      {isOwn && expiryInfo && (isExpiringSoon || isExpired) && (
        <div style={{ marginBottom: '8px' }}>
          <RenewButton postId={post.id} onRenew={props.onRenew} />
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {isOwn
          ? <div style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic' }}>{'Your recommendation · ' + timeAgo(post.created_at)}</div>
          : <div />
        }
        <UnreadBubble count={unreadCount} onClick={function() { props.onOpenChat(post); }} />
      </div>
    </article>
  );
}