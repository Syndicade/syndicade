/**
 * PostCard.jsx — Syndicade Community Board
 * Recommendation 4: "Read more" expand toggle for long post bodies.
 */
import { useState } from 'react';
import {
  CARD, BDR, TEXT, TEXT2, MUTED, YELLOW, BLUE, RED,
  getInitials, getExpiryInfo, timeAgo, formatDateTime,
  StatusBadge, ExpiryBadges, OrgAvatar, UnreadBubble, RenewButton,
  IconPin, IconEdit, IconTrash, IconMessageCircle, IconRefresh, IconChevronDown, IconChevronUp
} from './cbUtils';

// Body text character threshold before "Read more" appears.
var BODY_CLAMP_CHARS = 220;

export default function PostCard(props) {
  var post = props.post, cfg = props.config, isOwn = props.isOwn;
  var unreadCount = props.unreadCount || 0;
  var isBoardAdmin = props.isBoardAdmin || false;
  var postReactions = props.reactions || {};
  var expiryInfo = getExpiryInfo(post.expires_at);
  var isExpired = expiryInfo && expiryInfo.isExpired;
  var isExpiringSoon = expiryInfo && expiryInfo.isExpiringSoon && !isExpired;
  var pinShadow = post.is_pinned
    ? '3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05),inset 0 0 0 2px ' + YELLOW
    : '3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)';

  // Recommendation 4: expandable body
  var bodyIsLong = (post.body || '').length > BODY_CLAMP_CHARS;
  var [expanded, setExpanded] = useState(false);

  return (
    <article role="listitem" aria-label={post.org_name + ' ' + post.category + ' post'}
      style={{ background: cfg.cardBg, borderRadius: '12px', padding: '16px', position: 'relative', boxShadow: pinShadow, display: 'flex', flexDirection: 'column', minHeight: '240px', opacity: isExpired ? 0.65 : 1 }}>

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
            <button onClick={function() { props.onEdit(post); }} aria-label="Edit post"
              style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.10)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
              <IconEdit size={11} />
            </button>
            <button onClick={function() { props.onDelete(post); }} aria-label="Delete post"
              style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
              <IconTrash size={11} />
            </button>
          </>
        )}
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', paddingRight: (isBoardAdmin || isOwn) ? '64px' : '0' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: cfg.tagBg, color: cfg.tagText }}>{post.category}</span>
        <StatusBadge status={post.status || 'open'} isOwn={isOwn} onChange={function(s) { props.onStatusChange(post.id, s); }} />
        <ExpiryBadges expiryInfo={isExpired ? expiryInfo : (isExpiringSoon ? expiryInfo : null)} />
      </div>

      {/* Org row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <OrgAvatar name={post.org_name} bg={cfg.tagBg} color={cfg.tagText} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{post.org_name}</span>
      </div>

      {/* Title */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, lineHeight: 1.4, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.title}
      </div>

      {/* Body — Recommendation 4: expand toggle */}
      <div style={{ flex: 1, marginBottom: '10px' }}>
        <div style={{
          fontSize: '17px', fontWeight: 400, color: '#374151', lineHeight: 1.5,
          fontFamily: "'Patrick Hand',sans-serif",
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? undefined : 4,
          WebkitBoxOrient: expanded ? undefined : 'vertical',
          overflow: expanded ? 'visible' : 'hidden',
          wordBreak: 'break-word'
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

      {/* Meta */}
      <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{formatDateTime(post.created_at)}</span>
        {post.response_count > 0 && <span>{'· ' + post.response_count + ' ' + (post.response_count === 1 ? 'response' : 'responses')}</span>}
      </div>

      {/* Quick reactions */}
      {!isOwn && !isExpired && post.status !== 'completed' && cfg.quickReactions && cfg.quickReactions.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {cfg.quickReactions.map(function(rxn) {
            var count = postReactions[rxn.type + '_count'] || 0;
            var hasReacted = postReactions['my_' + rxn.type] || false;
            return (
              <button key={rxn.type} onClick={function() { props.onReact(post.id, rxn.type); }}
                aria-pressed={hasReacted}
                aria-label={(hasReacted ? 'Remove: ' : 'React: ') + rxn.label + (count > 0 ? ', ' + count : '')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, border: '1px solid ' + (hasReacted ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)'), background: hasReacted ? cfg.tagBg : 'rgba(255,255,255,0.55)', color: hasReacted ? cfg.tagText : '#374151', cursor: 'pointer', transition: 'all 0.15s' }}>
                {rxn.label}{count > 0 ? ' · ' + count : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* CTA buttons */}
      {!isOwn && !isExpired && post.status !== 'completed' && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <button onClick={function() { props.onAction(post, 'primary'); }}
            style={{ padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: cfg.tagBg, color: cfg.tagText }}>
            {cfg.primaryAction}
          </button>
          <button onClick={function() { props.onAction(post, 'info'); }}
            style={{ padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.10)', color: '#374151' }}>
            Get More Info
          </button>
        </div>
      )}

      {post.status === 'completed' && (
        <div style={{ fontSize: '11px', color: '#6B7280', fontStyle: 'italic', marginBottom: '8px' }}>This has been fulfilled.</div>
      )}

      {/* Renew button */}
      {isOwn && expiryInfo && (isExpiringSoon || isExpired) && (
        <div style={{ marginBottom: '8px' }}>
          <RenewButton postId={post.id} onRenew={props.onRenew} />
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {isOwn
          ? <div style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic' }}>{'Your post · ' + timeAgo(post.created_at)}</div>
          : <div />
        }
        <UnreadBubble count={unreadCount} onClick={function() { props.onOpenChat(post); }} />
      </div>
    </article>
  );
}