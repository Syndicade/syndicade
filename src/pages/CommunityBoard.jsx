/**
 * Syndicade — CommunityBoard.jsx v2
 * - Status badges (Open / Pending / Completed)
 * - Post date/time on every card
 * - Edit (poster only) + Delete with confirmation (poster only)
 * - Action buttons: Offer Help / Get More Info / Message Org Admin
 * - Member Orgs tab — opted-in orgs filtered by county + opt-in toggle
 * - Responding auto-sets post to Pending
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

// ─── Board config ──────────────────────────────────────────────────────────────

var BOARD_CONFIG = {
  ask: {
    label: 'The Ask Board',
    tabColor: '#A78BFA',
    description: 'Post what your community needs — supplies, volunteers, skills, or anything else a fellow org might have.',
    buttonLabel: 'Post an Ask',
    cardBg: '#E1BEE7',
    tagBg: '#9C27B0',
    tagText: '#F3E5F5',
    tackColor: '#6A1B9A',
    emptyTitle: 'No asks posted yet',
    emptyDesc: 'Be the first to post something your org needs. Fellow admins are here to help.',
    categories: ['Supplies', 'Volunteers', 'Skills', 'Space', 'Equipment', 'Funding', 'Other']
  },
  offer: {
    label: 'The Offer Board',
    tabColor: '#22C55E',
    description: 'Share what your org has to give — surplus donations, unused equipment, available expertise.',
    buttonLabel: 'Post an Offer',
    cardBg: '#C8E6C9',
    tagBg: '#66BB6A',
    tagText: '#1B5E20',
    tackColor: '#2E7D32',
    emptyTitle: 'No offers posted yet',
    emptyDesc: 'Share surplus supplies, skills, or equipment with fellow nonprofits in your community.',
    categories: ['Supplies', 'Volunteers', 'Skills', 'Space', 'Equipment', 'Other']
  },
  collab: {
    label: 'Collaboration Requests',
    tabColor: '#3B82F6',
    description: 'Find partner orgs to co-host events, run joint programs, or pool resources on larger projects.',
    buttonLabel: 'Post a Request',
    cardBg: '#BBDEFB',
    tagBg: '#42A5F5',
    tagText: '#0D47A1',
    tackColor: '#1565C0',
    emptyTitle: 'No collaboration requests yet',
    emptyDesc: 'Invite other orgs to co-host events, build programs, or run joint campaigns together.',
    categories: ['Co-Host', 'Program', 'Campaign', 'Fundraiser', 'Advocacy', 'Other']
  }
};

var TABS = [
  { key: 'ask',    label: 'The Ask Board',         color: '#A78BFA' },
  { key: 'offer',  label: 'The Offer Board',        color: '#22C55E' },
  { key: 'collab', label: 'Collaboration Requests', color: '#3B82F6' },
  { key: 'orgs',   label: 'Member Orgs',            color: '#F5B731' }
];

var STATUS_CONFIG = {
  open:      { label: 'Open',      bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.4)',   text: '#22C55E' },
  pending:   { label: 'Pending',   bg: 'rgba(245,183,49,0.15)',  border: 'rgba(245,183,49,0.4)',  text: '#F5B731' },
  completed: { label: 'Completed', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)', text: '#94A3B8' }
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconShield(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconLock(p) {
  return (
    <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconPlus(p) {
  return (
    <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconX(p) {
  return (
    <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconMessage(p) {
  return (
    <svg width={p.size||28} height={p.size||28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function IconEdit(p) {
  return (
    <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash(p) {
  return (
    <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function IconBuilding(p) {
  return (
    <svg width={p.size||28} height={p.size||28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 21h18M9 21V7l6-4v18M9 7H3v14M15 11h.01M15 15h.01M9 11h.01M9 15h.01"/>
    </svg>
  );
}
function IconChevronDown(p) {
  return (
    <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function IconArrowLeft(p) {
  return (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  var now = new Date();
  var then = new Date(dateStr);
  var s = Math.floor((now - then) / 1000);
  if (s < 60) return 'just now';
  var m = Math.floor(s / 60);
  if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
  var h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  var d = Math.floor(h / 24);
  if (d < 7) return d + (d === 1 ? ' day ago' : ' days ago');
  var w = Math.floor(d / 7);
  return w + (w === 1 ? ' week ago' : ' weeks ago');
}

function formatDateTime(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getInitials(name) {
  if (!name) return '??';
  var words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── Tack ──────────────────────────────────────────────────────────────────────

function Tack(props) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', height: '14px', marginBottom: '-3px' }}>
      <div style={{
        width: '13px', height: '13px', borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, ' + props.color + ' 52%, rgba(0,0,0,0.2) 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.35)', flexShrink: 0
      }} />
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge(props) {
  var s = STATUS_CONFIG[props.status] || STATUS_CONFIG.open;
  var [open, setOpen] = useState(false);

  if (!props.isOwn) {
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
        fontSize: '10px', fontWeight: 700,
        background: s.bg, border: '1px solid ' + s.border, color: s.text
      }}>
        {s.label}
      </span>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={function(e) { e.stopPropagation(); setOpen(!open); }}
        aria-label={'Change status, currently ' + s.label}
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700,
          background: s.bg, border: '1px solid ' + s.border, color: s.text, cursor: 'pointer'
        }}
      >
        {s.label}
        <IconChevronDown size={9} />
      </button>
      {open && (
        <div role="menu" style={{
          position: 'absolute', top: '24px', left: 0, zIndex: 20,
          background: '#1A2035', border: '1px solid #2A3550', borderRadius: '8px',
          padding: '4px', minWidth: '120px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}>
          {Object.keys(STATUS_CONFIG).map(function(key) {
            var sc = STATUS_CONFIG[key];
            return (
              <button
                key={key}
                role="menuitem"
                onClick={function(e) { e.stopPropagation(); setOpen(false); props.onChange(key); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '7px 10px', background: 'none', border: 'none',
                  color: sc.text, fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', borderRadius: '6px', textAlign: 'left'
                }}
              >
                {sc.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

function PostCard(props) {
  var post = props.post;
  var cfg = props.config;
  var isOwn = props.isOwn;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Tack color={cfg.tackColor} />
      <article
        role="listitem"
        aria-label={post.org_name + ' ' + post.category + ' post'}
        style={{
          background: cfg.cardBg, borderRadius: '6px', padding: '14px',
          position: 'relative', width: '100%', boxSizing: 'border-box',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.06) 24px)',
          backgroundPositionY: '32px',
          display: 'flex', flexDirection: 'column', minHeight: '240px'
        }}
      >
        {/* Edit / Delete controls */}
        {isOwn && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 2 }}>
            <button
              onClick={function() { props.onEdit(post); }}
              aria-label="Edit post"
              style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151'
              }}
            >
              <IconEdit size={11} />
            </button>
            <button
              onClick={function() { props.onDelete(post); }}
              aria-label="Delete post"
              style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444'
              }}
            >
              <IconTrash size={11} />
            </button>
          </div>
        )}

        {/* Category + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '3px',
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: cfg.tagBg, color: cfg.tagText
          }}>
            {post.category}
          </span>
          <StatusBadge
            status={post.status || 'open'}
            isOwn={isOwn}
            onChange={function(newStatus) { props.onStatusChange(post.id, newStatus); }}
          />
        </div>

        {/* Org row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: cfg.tagBg, color: cfg.tagText,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 700, flexShrink: 0
          }}>
            {getInitials(post.org_name)}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {post.org_name}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.4,
          marginBottom: '8px', fontFamily: 'Georgia, serif',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          "{post.title}"
        </div>

        {/* Body */}
        <div style={{
          fontSize: '12px', color: '#374151', lineHeight: 1.65, flex: 1, marginBottom: '10px',
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {post.body}
        </div>

        {/* Posted date + response count */}
        <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '8px' }}>
          Posted {formatDateTime(post.created_at)}
          {post.response_count > 0 && (
            <span style={{ marginLeft: '8px' }}>
              · {post.response_count} {post.response_count === 1 ? 'response' : 'responses'}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isOwn && post.status !== 'completed' && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { key: 'offer',   label: 'Offer Help',    primary: true },
              { key: 'info',    label: 'Get More Info',  primary: false },
              { key: 'message', label: 'Message Admin',  primary: false }
            ].map(function(action) {
              return (
                <button
                  key={action.key}
                  onClick={function() { props.onAction(post, action.key); }}
                  aria-label={action.label + ' for ' + post.org_name}
                  style={{
                    padding: '4px 9px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    background: action.primary ? cfg.tagBg : 'rgba(0,0,0,0.12)',
                    color: action.primary ? cfg.tagText : '#374151'
                  }}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}

        {post.status === 'completed' && (
          <div style={{ fontSize: '11px', color: '#6B7280', fontStyle: 'italic' }}>This request has been fulfilled.</div>
        )}

        {isOwn && (
          <div style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic', marginTop: '4px' }}>
            Your post · {timeAgo(post.created_at)}
          </div>
        )}
      </article>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard(props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ height: '14px', display: 'flex', justifyContent: 'center', marginBottom: '-3px' }}>
        <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
      </div>
      <div style={{ background: props.cardBg, borderRadius: '6px', padding: '14px', width: '100%', minHeight: '240px', opacity: 0.45 }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          <div style={{ width: '56px', height: '18px', background: 'rgba(0,0,0,0.15)', borderRadius: '3px' }} />
          <div style={{ width: '48px', height: '18px', background: 'rgba(0,0,0,0.1)', borderRadius: '99px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }} />
          <div style={{ width: '110px', height: '11px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }} />
        </div>
        <div style={{ width: '92%', height: '13px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginBottom: '6px' }} />
        <div style={{ width: '78%', height: '13px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', marginBottom: '6px' }} />
        <div style={{ width: '85%', height: '11px', background: 'rgba(0,0,0,0.07)', borderRadius: '3px', marginBottom: '6px' }} />
        <div style={{ width: '50%', height: '11px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px' }} />
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal(props) {
  var post = props.post;
  var { isDark } = useTheme();
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    await props.onConfirm(post.id);
    setDeleting(false);
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Confirm delete post"
      onClick={function(e) { if (e.target === e.currentTarget) props.onCancel(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
    >
      <div style={{ background: cardBg, border: '1px solid ' + border, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
            <IconTrash size={16} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, margin: 0 }}>Remove this post?</h2>
        </div>
        <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6, marginBottom: '6px' }}>"{post.title}"</p>
        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '20px' }}>
          Posted {formatDateTime(post.created_at)}. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={props.onCancel}
            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + border, borderRadius: '8px', color: textSecondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Keep Post
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            aria-busy={deleting}
            style={{ flex: 1, padding: '10px', background: '#EF4444', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? 'Removing...' : 'Remove Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Modal ──────────────────────────────────────────────────────────────

function ActionModal(props) {
  var post = props.post;
  var actionType = props.actionType;
  var cfg = props.config;
  var userOrgs = props.userOrgs;
  var { isDark } = useTheme();
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var inputBg = isDark ? '#151B2D' : '#F8FAFC';

  var titles = { offer: 'Offer Help', info: 'Request More Information', message: 'Message Org Admin' };
  var placeholders = {
    offer:   'Describe how your org can help — what you can provide, timeline, any conditions...',
    info:    'What would you like to know more about? Be specific so they can respond usefully...',
    message: 'Introduce your org and write your message...'
  };

  var defaultOrg = userOrgs.length === 1 ? userOrgs[0].id : '';
  var [orgId, setOrgId] = useState(defaultOrg);
  var [message, setMessage] = useState('');
  var [sending, setSending] = useState(false);

  var inputStyle = {
    width: '100%', padding: '10px 12px', background: inputBg, border: '1px solid ' + border,
    borderRadius: '8px', color: textPrimary, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  };

  async function handleSend() {
    if (!orgId) { toast.error('Select which org is sending this.'); return; }
    if (!message.trim()) { toast.error('Write a message first.'); return; }
    setSending(true);
    try {
      var { data: { user } } = await supabase.auth.getUser();
      var { error } = await supabase.from('community_board_responses').insert({
        post_id: post.id, from_org_id: orgId, from_member_id: user.id,
        message: '[' + titles[actionType] + '] ' + message.trim()
      });
      if (error) throw error;
      await supabase.rpc('increment_post_response_count', { post_id_input: post.id });
      await supabase.from('community_board_posts').update({ status: 'pending' }).eq('id', post.id).eq('status', 'open');
      toast.success('Message sent to ' + post.org_name + '.');
      props.onSuccess();
      props.onClose();
    } catch (err) {
      toast.error('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label={titles[actionType] + ' — ' + post.org_name}
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
    >
      <div style={{ background: cardBg, border: '1px solid ' + border, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, margin: 0 }}>{titles[actionType]}</h2>
          <button onClick={props.onClose} aria-label="Close" style={{ width: '28px', height: '28px', borderRadius: '50%', background: border, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSecondary }}>
            <IconX size={12} />
          </button>
        </div>

        {/* Post preview */}
        <div style={{ background: cfg.cardBg, borderRadius: '6px', padding: '10px', marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px', background: cfg.tagBg, color: cfg.tagText }}>{post.category}</span>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', fontFamily: 'Georgia, serif' }}>"{post.title}"</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{post.org_name} · {timeAgo(post.created_at)}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {userOrgs.length > 1 && (
            <div>
              <label htmlFor="am-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>From</label>
              <select id="am-org" value={orgId} onChange={function(e) { setOrgId(e.target.value); }} style={inputStyle}>
                <option value="">Select organization...</option>
                {userOrgs.map(function(org) { return <option key={org.id} value={org.id}>{org.name}</option>; })}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="am-msg" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>Message</label>
            <textarea id="am-msg" value={message} onChange={function(e) { setMessage(e.target.value); }} rows={4} maxLength={500} aria-required="true" placeholder={placeholders[actionType]} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
            <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', textAlign: 'right' }}>{message.length}/500</p>
          </div>
          <button
            onClick={handleSend} disabled={sending} aria-busy={sending}
            style={{ padding: '12px', background: cfg.tagBg, color: cfg.tagText, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Modal (Create + Edit) ────────────────────────────────────────────────

function PostModal(props) {
  var boardType = props.boardType;
  var cfg = props.config;
  var userOrgs = props.userOrgs;
  var editingPost = props.editingPost;
  var { isDark } = useTheme();
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var inputBg = isDark ? '#151B2D' : '#F8FAFC';

  var isEditing = !!editingPost;
  var defaultOrg = editingPost ? editingPost.org_id : (userOrgs.length === 1 ? userOrgs[0].id : '');
  var [orgId, setOrgId] = useState(defaultOrg);
  var [category, setCategory] = useState(editingPost ? editingPost.category : cfg.categories[0]);
  var [title, setTitle] = useState(editingPost ? editingPost.title : '');
  var [body, setBody] = useState(editingPost ? editingPost.body : '');
  var [saving, setSaving] = useState(false);

  var inputStyle = {
    width: '100%', padding: '10px 12px', background: inputBg, border: '1px solid ' + border,
    borderRadius: '8px', color: textPrimary, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  };

  async function handleSubmit() {
    if (!orgId) { toast.error('Select which org is posting.'); return; }
    if (!title.trim()) { toast.error('Add a headline for your post.'); return; }
    if (!body.trim()) { toast.error('Add some details.'); return; }
    setSaving(true);
    try {
      if (isEditing) {
        var { error } = await supabase.from('community_board_posts').update({ category: category, title: title.trim(), body: body.trim() }).eq('id', editingPost.id);
        if (error) throw error;
        toast.success('Post updated.');
      } else {
        var { data: { user } } = await supabase.auth.getUser();
        var { error: ie } = await supabase.from('community_board_posts').insert({
          board_type: boardType, category: category, title: title.trim(), body: body.trim(),
          org_id: orgId, created_by: user.id, status: 'open'
        });
        if (ie) throw ie;
        toast.success('Post published to the board.');
      }
      props.onSuccess();
      props.onClose();
    } catch (err) {
      toast.error('Could not save post. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label={(isEditing ? 'Edit post on ' : 'Create post on ') + cfg.label}
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
    >
      <div style={{ background: cardBg, border: '1px solid ' + border, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, margin: 0 }}>{isEditing ? 'Edit Post' : cfg.buttonLabel}</h2>
          <button onClick={props.onClose} aria-label="Close" style={{ width: '28px', height: '28px', borderRadius: '50%', background: border, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSecondary }}>
            <IconX size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isEditing && userOrgs.length > 1 && (
            <div>
              <label htmlFor="pm-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>Posting as</label>
              <select id="pm-org" value={orgId} onChange={function(e) { setOrgId(e.target.value); }} style={inputStyle}>
                <option value="">Select organization...</option>
                {userOrgs.map(function(org) { return <option key={org.id} value={org.id}>{org.name}</option>; })}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="pm-cat" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>Category</label>
            <select id="pm-cat" value={category} onChange={function(e) { setCategory(e.target.value); }} style={inputStyle}>
              {cfg.categories.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
          <div>
            <label htmlFor="pm-title" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
              Headline <span style={{ fontWeight: 400, color: '#64748B' }}>(shown as a quote on the card)</span>
            </label>
            <input id="pm-title" type="text" value={title} onChange={function(e) { setTitle(e.target.value); }} maxLength={120} aria-required="true"
              placeholder={boardType === 'ask' ? 'e.g. Need 10 volunteers for our spring food drive' : boardType === 'offer' ? 'e.g. 20 surplus winter coats available, free to any org' : 'e.g. Looking for a partner org to co-host our summer gala'}
              style={inputStyle} />
            <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', textAlign: 'right' }}>{title.length}/120</p>
          </div>
          <div>
            <label htmlFor="pm-body" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>Details</label>
            <textarea id="pm-body" value={body} onChange={function(e) { setBody(e.target.value); }} rows={4} maxLength={500} aria-required="true" placeholder="Provide context — timeline, logistics, contact preferences, quantities, etc." style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
            <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', textAlign: 'right' }}>{body.length}/500</p>
          </div>
          <button
            onClick={handleSubmit} disabled={saving} aria-busy={saving}
            style={{ padding: '12px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish to Board')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member Orgs Tab ───────────────────────────────────────────────────────────

function MemberOrgsTab(props) {
  var userOrgs = props.userOrgs;
  var userOrgIds = props.userOrgIds;
  var { isDark } = useTheme();
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var border        = isDark ? '#2A3550' : '#E2E8F0';
  var sectionBg     = isDark ? '#151B2D' : '#F8FAFC';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';

  var [orgs, setOrgs]               = useState([]);
  var [loading, setLoading]         = useState(true);
  var [toggling, setToggling]       = useState({});
  var [userOrgOptIns, setUserOrgOptIns] = useState({});

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      var { data, error } = await supabase
        .from('organizations')
        .select('id, name, type, county, community_board_opt_in')
        .eq('community_board_opt_in', true)
        .order('name');
      if (error) throw error;
      setOrgs(data || []);

      if (userOrgIds.length > 0) {
        var { data: myOrgs } = await supabase.from('organizations').select('id, community_board_opt_in').in('id', userOrgIds);
        var map = {};
        (myOrgs || []).forEach(function(o) { map[o.id] = o.community_board_opt_in; });
        setUserOrgOptIns(map);
      }
    } catch (err) {
      toast.error('Could not load organizations.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(orgId, current) {
    setToggling(function(prev) { return Object.assign({}, prev, { [orgId]: true }); });
    try {
      var { error } = await supabase.from('organizations').update({ community_board_opt_in: !current }).eq('id', orgId);
      if (error) throw error;
      toast.success(!current ? 'Your org is now on the Community Board.' : 'Your org has been removed from the Community Board.');
      setUserOrgOptIns(function(prev) { return Object.assign({}, prev, { [orgId]: !current }); });
      loadData();
    } catch (err) {
      toast.error('Could not update opt-in status.');
    } finally {
      setToggling(function(prev) { return Object.assign({}, prev, { [orgId]: false }); });
    }
  }

  return (
    <div>
      {/* Your orgs section */}
      {userOrgs.length > 0 && (
        <div style={{ background: sectionBg, border: '1px solid ' + border, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 12px' }}>
            Your Organizations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {userOrgs.map(function(org) {
              var isOptedIn = userOrgOptIns[org.id] || false;
              var isBusy = toggling[org.id];
              return (
                <div key={org.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', background: cardBg, border: '1px solid ' + (isOptedIn ? 'rgba(245,183,49,0.3)' : border), borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: isOptedIn ? 'rgba(245,183,49,0.15)' : (isDark ? '#1E2845' : '#F1F5F9'), border: '1px solid ' + (isOptedIn ? 'rgba(245,183,49,0.4)' : border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: isOptedIn ? '#F5B731' : textMuted }}>
                      {getInitials(org.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</div>
                      <div style={{ fontSize: '11px', color: textMuted }}>{isOptedIn ? 'Participating in Community Board' : 'Not on the Community Board'}</div>
                    </div>
                  </div>
                  <button
                    onClick={function() { handleToggle(org.id, isOptedIn); }}
                    disabled={isBusy}
                    aria-label={(isOptedIn ? 'Remove ' : 'Add ') + org.name + ' to Community Board'}
                    aria-pressed={isOptedIn}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: isOptedIn ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(245,183,49,0.4)', background: isOptedIn ? 'rgba(239,68,68,0.1)' : 'rgba(245,183,49,0.1)', color: isOptedIn ? '#EF4444' : '#F5B731', cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {isBusy ? '...' : (isOptedIn ? 'Leave Board' : 'Join Board')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All opted-in orgs */}
      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 14px' }}>
        Organizations on the Board
      </h3>

      {loading ? (
        <div aria-busy="true" aria-label="Loading organizations" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3,4].map(function(i) {
            return <div key={i} style={{ height: '60px', background: cardBg, border: '1px solid ' + border, borderRadius: '10px', opacity: 0.5 }} />;
          })}
        </div>
      ) : orgs.length === 0 ? (
        <div role="status" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: cardBg, border: '1px solid ' + border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, margin: '0 auto 12px' }}>
            <IconBuilding size={22} />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: '0 0 6px' }}>No organizations yet</h4>
          <p style={{ fontSize: '13px', color: textSecondary, maxWidth: '300px', margin: '0 auto', lineHeight: 1.65 }}>
            Be the first to join the Community Board using the toggle above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {orgs.map(function(org) {
            var isYours = userOrgIds.indexOf(org.id) !== -1;
            return (
              <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: cardBg, border: '1px solid ' + (isYours ? 'rgba(245,183,49,0.3)' : border), borderRadius: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: isYours ? 'rgba(245,183,49,0.12)' : (isDark ? '#1E2845' : '#F1F5F9'), border: '1px solid ' + (isYours ? 'rgba(245,183,49,0.3)' : border), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: isYours ? '#F5B731' : textMuted }}>
                  {getInitials(org.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{org.name}</span>
                    {isYours && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', color: '#F5B731' }}>
                        Your Org
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: textMuted, marginTop: '1px' }}>
                    {org.type || 'Organization'}{org.county ? ' · ' + org.county + ' County' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CommunityBoard() {
  var { isDark } = useTheme();
  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg     = isDark ? '#151B2D' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var cardBg        = isDark ? '#1A2035'  : '#FFFFFF';

  var [activeTab, setActiveTab]       = useState('ask');
  var [posts, setPosts]               = useState([]);
  var [loading, setLoading]           = useState(true);
  var [hasAccess, setHasAccess]       = useState(null);
  var [userOrgs, setUserOrgs]         = useState([]);
  var [userOrgIds, setUserOrgIds]     = useState([]);
  var [showCreate, setShowCreate]     = useState(false);
  var [editingPost, setEditingPost]   = useState(null);
  var [deletingPost, setDeletingPost] = useState(null);
  var [actionModal, setActionModal]   = useState(null);
  var [tabCounts, setTabCounts]       = useState({ ask: 0, offer: 0, collab: 0 });

  var cfg = BOARD_CONFIG[activeTab] || BOARD_CONFIG.ask;

  useEffect(function() { checkAccess(); }, []);

  async function checkAccess() {
    try {
      var { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasAccess(false); return; }
      var { data, error } = await supabase
        .from('memberships')
        .select('organization_id, organizations(id, name)')
        .eq('member_id', user.id)
        .eq('role', 'admin')
        .eq('status', 'active');
      if (error) throw error;
      if (!data || data.length === 0) { setHasAccess(false); return; }
      var orgs = data.map(function(m) { return { id: m.organizations.id, name: m.organizations.name }; });
      setUserOrgs(orgs);
      setUserOrgIds(orgs.map(function(o) { return o.id; }));
      setHasAccess(true);
      loadTabCounts();
    } catch (err) {
      setHasAccess(false);
    }
  }

  useEffect(function() {
    if (hasAccess && activeTab !== 'orgs') loadPosts(activeTab);
  }, [activeTab, hasAccess]);

  async function loadPosts(boardType) {
    setLoading(true);
    try {
      var { data, error } = await supabase
        .from('community_board_posts')
        .select('*')
        .eq('board_type', boardType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      var orgIds = [...new Set((data || []).map(function(p) { return p.org_id; }).filter(Boolean))];
      var orgMap = {};
      if (orgIds.length > 0) {
        var { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
      }
      setPosts((data || []).map(function(p) { return Object.assign({}, p, { org_name: orgMap[p.org_id] || 'Unknown Org' }); }));
    } catch (err) {
      toast.error('Could not load posts.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTabCounts() {
    try {
      var results = await Promise.all([
        supabase.from('community_board_posts').select('id', { count: 'exact', head: true }).eq('board_type', 'ask').eq('is_active', true),
        supabase.from('community_board_posts').select('id', { count: 'exact', head: true }).eq('board_type', 'offer').eq('is_active', true),
        supabase.from('community_board_posts').select('id', { count: 'exact', head: true }).eq('board_type', 'collab').eq('is_active', true)
      ]);
      setTabCounts({ ask: results[0].count || 0, offer: results[1].count || 0, collab: results[2].count || 0 });
    } catch (err) { /* silent */ }
  }

  async function handleStatusChange(postId, newStatus) {
    try {
      var { error } = await supabase.from('community_board_posts').update({ status: newStatus }).eq('id', postId);
      if (error) throw error;
      setPosts(function(prev) { return prev.map(function(p) { return p.id === postId ? Object.assign({}, p, { status: newStatus }) : p; }); });
      toast.success('Status updated to ' + newStatus + '.');
    } catch (err) {
      toast.error('Could not update status.');
    }
  }

  async function handleDeleteConfirm(postId) {
    try {
      var { error } = await supabase.from('community_board_posts').update({ is_active: false }).eq('id', postId);
      if (error) throw error;
      toast.success('Post removed from the board.');
      setPosts(function(prev) { return prev.filter(function(p) { return p.id !== postId; }); });
      setDeletingPost(null);
      loadTabCounts();
    } catch (err) {
      toast.error('Could not remove post.');
    }
  }

  // ── Loading ──
  if (hasAccess === null) {
    return (
      <div style={{ background: pageBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div aria-busy="true" aria-label="Checking access" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {[280, 220, 160].map(function(w, i) { return <div key={i} style={{ width: w + 'px', height: '12px', background: isDark ? '#1A2035' : '#E2E8F0', borderRadius: '6px', opacity: 0.6 }} />; })}
        </div>
      </div>
    );
  }

  // ── Access denied ──
  if (!hasAccess) {
    return (
      <main style={{ background: pageBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: cardBg, border: '1px solid ' + borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: textMuted }}>
            <IconLock size={26} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>Admin Access Required</h1>
          <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.65, margin: '0 0 24px' }}>
            The Community Board is available to verified org admins only.
          </p>
          <a href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#3B82F6', color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            <IconArrowLeft size={14} />Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  // ── Main ──
  return (
    <main style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }} aria-label="Community Board">

      <header style={{ background: sectionBg, padding: '24px 24px 0', borderBottom: '1px solid ' + borderColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0 }}>The Community Board</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '99px', fontSize: '11px', fontWeight: 700, color: '#A78BFA' }}>
              <IconShield size={11} />Verified Org Admins Only
            </span>
          </div>
          <p style={{ fontSize: '13px', color: textMuted, margin: '0 0 16px' }}>
            A space for verified nonprofits to share needs, offer resources, and find collaboration partners.
          </p>
          <nav role="tablist" aria-label="Community board sections" style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map(function(tab) {
              var isActive = activeTab === tab.key;
              var count = tabCounts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  id={'tab-' + tab.key}
                  onClick={function() { setActiveTab(tab.key); }}
                  className={'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'}
                  style={{ padding: '12px 20px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: isActive ? tab.color : textMuted, borderBottom: isActive ? ('2px solid ' + tab.color) : '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {tab.label}
                  {tab.key !== 'orgs' && count > 0 && (
                    <span style={{ borderRadius: '99px', padding: '1px 7px', fontSize: '10px', background: isActive ? 'rgba(167,139,250,0.15)' : (isDark ? '#1A2035' : '#F1F5F9'), color: isActive ? tab.color : textMuted }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
        {activeTab === 'orgs' ? (
          <MemberOrgsTab userOrgs={userOrgs} userOrgIds={userOrgIds} />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '13px', color: textMuted, flex: 1, margin: 0 }}>{cfg.description}</p>
              <button
                onClick={function() { setShowCreate(true); }}
                aria-label={cfg.buttonLabel}
                className={'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '8px', color: textSecondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <IconPlus size={13} />{cfg.buttonLabel}
              </button>
            </div>

            {loading ? (
              <div aria-busy="true" aria-label="Loading posts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {[1,2,3,4,5,6].map(function(i) { return <SkeletonCard key={i} cardBg={cfg.cardBg} />; })}
              </div>
            ) : posts.length === 0 ? (
              <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 32px', gap: '12px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: cardBg, border: '1px solid ' + borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted }}>
                  <IconMessage size={28} />
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>{cfg.emptyTitle}</h2>
                <p style={{ fontSize: '13px', color: textSecondary, maxWidth: '360px', lineHeight: 1.65, margin: 0 }}>{cfg.emptyDesc}</p>
                <button onClick={function() { setShowCreate(true); }} className={'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'} style={{ marginTop: '8px', padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {cfg.buttonLabel}
                </button>
              </div>
            ) : (
              <div role="list" aria-label={cfg.label + ' posts'} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {posts.map(function(post) {
                  var isOwn = userOrgIds.indexOf(post.org_id) !== -1;
                  return (
                    <PostCard
                      key={post.id}
                      post={post}
                      config={cfg}
                      isOwn={isOwn}
                      onAction={function(p, type) { setActionModal({ post: p, type: type }); }}
                      onEdit={function(p) { setEditingPost(p); }}
                      onDelete={function(p) { setDeletingPost(p); }}
                      onStatusChange={handleStatusChange}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {(showCreate || editingPost) && (
        <PostModal
          boardType={activeTab}
          config={cfg}
          userOrgs={userOrgs}
          editingPost={editingPost || null}
          onClose={function() { setShowCreate(false); setEditingPost(null); }}
          onSuccess={function() { loadPosts(activeTab); loadTabCounts(); }}
        />
      )}
      {deletingPost && (
        <DeleteConfirmModal
          post={deletingPost}
          onConfirm={handleDeleteConfirm}
          onCancel={function() { setDeletingPost(null); }}
        />
      )}
      {actionModal && (
        <ActionModal
          post={actionModal.post}
          actionType={actionModal.type}
          config={cfg}
          userOrgs={userOrgs}
          onClose={function() { setActionModal(null); }}
          onSuccess={function() { loadPosts(activeTab); }}
        />
      )}
    </main>
  );
}