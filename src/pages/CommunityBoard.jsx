/**
 * Syndicade — CommunityBoard.jsx
 * Three-tab bulletin board for verified org admins.
 * Tabs: Ask Board (purple) | Offer Board (green) | Collaboration Requests (blue)
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
    respondLabel: 'Respond',
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
    respondLabel: 'Respond',
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
    respondLabel: 'Collaborate',
    emptyTitle: 'No collaboration requests yet',
    emptyDesc: 'Invite other orgs to co-host events, build programs, or run joint campaigns together.',
    categories: ['Co-Host', 'Program', 'Campaign', 'Fundraiser', 'Advocacy', 'Other']
  }
};

var TABS = [
  { key: 'ask',   label: 'The Ask Board',           color: '#A78BFA' },
  { key: 'offer', label: 'The Offer Board',          color: '#22C55E' },
  { key: 'collab',label: 'Collaboration Requests',   color: '#3B82F6' }
];

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

function IconShield({ size }) {
  size = size || 14;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function IconLock({ size }) {
  size = size || 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconPlus({ size }) {
  size = size || 13;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconX({ size }) {
  size = size || 12;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconMessage({ size }) {
  size = size || 28;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconDots({ size }) {
  size = size || 14;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="19" cy="12" r="2"/>
    </svg>
  );
}

function IconArrowLeft({ size }) {
  size = size || 16;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
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

function getInitials(name) {
  if (!name) return '??';
  var words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── Tack ──────────────────────────────────────────────────────────────────────

function Tack(props) {
  var color = props.color;
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', justifyContent: 'center', height: '14px', marginBottom: '-3px' }}
    >
      <div style={{
        width: '13px',
        height: '13px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, ' + color + ' 52%, rgba(0,0,0,0.2) 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
        flexShrink: 0
      }} />
    </div>
  );
}

// ─── PostCard ──────────────────────────────────────────────────────────────────

function PostCard(props) {
  var post = props.post;
  var cfg = props.config;
  var onRespond = props.onRespond;
  var onRemove = props.onRemove;
  var isOwn = props.isOwn;

  var [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Tack color={cfg.tackColor} />
      <article
        role="listitem"
        aria-label={post.org_name + ' ' + post.category + ' post on ' + cfg.label}
        style={{
          background: cfg.cardBg,
          borderRadius: '6px',
          padding: '14px',
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(0,0,0,0.06) 24px)',
          backgroundPositionY: '32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '220px'
        }}
      >
        {/* Options button (own posts only) */}
        {isOwn && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
            <button
              onClick={function() { setMenuOpen(!menuOpen); }}
              aria-label="Post options"
              aria-expanded={menuOpen}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.12)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#374151',
                padding: 0
              }}
            >
              <IconDots size={12} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: '26px',
                  right: 0,
                  background: '#1A2035',
                  border: '1px solid #2A3550',
                  borderRadius: '8px',
                  padding: '4px',
                  minWidth: '130px',
                  zIndex: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                }}
              >
                <button
                  role="menuitem"
                  onClick={function() { setMenuOpen(false); onRemove(post.id); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: '6px'
                  }}
                >
                  Remove post
                </button>
              </div>
            )}
          </div>
        )}

        {/* Category tag */}
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
          background: cfg.tagBg,
          color: cfg.tagText,
          alignSelf: 'flex-start'
        }}>
          {post.category}
        </span>

        {/* Org row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: cfg.tagBg,
            color: cfg.tagText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 700,
            flexShrink: 0
          }}>
            {getInitials(post.org_name)}
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#374151',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {post.org_name}
          </span>
        </div>

        {/* Title (serif quote) */}
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.4,
          marginBottom: '8px',
          fontFamily: 'Georgia, serif',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          "{post.title}"
        </div>

        {/* Body */}
        <div style={{
          fontSize: '12px',
          color: '#374151',
          lineHeight: 1.65,
          flex: 1,
          marginBottom: '12px',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {post.body}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>
            {timeAgo(post.created_at)}
            {post.response_count > 0 && (
              <span style={{ marginLeft: '8px' }}>
                {post.response_count} {post.response_count === 1 ? 'response' : 'responses'}
              </span>
            )}
          </span>
          {isOwn ? (
            <span style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic' }}>Your post</span>
          ) : (
            <button
              onClick={function() { onRespond(post); }}
              aria-label={cfg.respondLabel + ' to ' + post.org_name + ' ' + post.category + ' post'}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: cfg.tagBg,
                color: cfg.tagText
              }}
            >
              {cfg.respondLabel}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard(props) {
  var bg = props.cardBg;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ height: '14px', display: 'flex', justifyContent: 'center', marginBottom: '-3px' }}>
        <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
      </div>
      <div style={{ background: bg, borderRadius: '6px', padding: '14px', width: '100%', minHeight: '220px', opacity: 0.45 }}>
        <div style={{ width: '56px', height: '18px', background: 'rgba(0,0,0,0.15)', borderRadius: '3px', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }} />
          <div style={{ width: '110px', height: '11px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }} />
        </div>
        <div style={{ width: '92%', height: '13px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginBottom: '6px' }} />
        <div style={{ width: '78%', height: '13px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginBottom: '6px' }} />
        <div style={{ width: '60%', height: '11px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', marginBottom: '6px' }} />
        <div style={{ width: '85%', height: '11px', background: 'rgba(0,0,0,0.07)', borderRadius: '3px', marginBottom: '6px' }} />
        <div style={{ width: '50%', height: '11px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px' }} />
      </div>
    </div>
  );
}

// ─── Create Post Modal ─────────────────────────────────────────────────────────

function CreatePostModal(props) {
  var boardType = props.boardType;
  var cfg = props.config;
  var userOrgs = props.userOrgs;
  var onClose = props.onClose;
  var onSuccess = props.onSuccess;

  var { isDark } = useTheme();
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var inputBg = isDark ? '#151B2D' : '#F8FAFC';

  var defaultOrg = userOrgs.length === 1 ? userOrgs[0].id : '';
  var [orgId, setOrgId] = useState(defaultOrg);
  var [category, setCategory] = useState(cfg.categories[0]);
  var [title, setTitle] = useState('');
  var [body, setBody] = useState('');
  var [saving, setSaving] = useState(false);

  var inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: inputBg,
    border: '1px solid ' + border,
    borderRadius: '8px',
    color: textPrimary,
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit'
  };

  async function handleSubmit() {
    if (!orgId) { toast.error('Select which org is posting.'); return; }
    if (!title.trim()) { toast.error('Add a headline for your post.'); return; }
    if (!body.trim()) { toast.error('Add some details.'); return; }
    setSaving(true);
    try {
      var { data: { user } } = await supabase.auth.getUser();
      var { error } = await supabase.from('community_board_posts').insert({
        board_type: boardType,
        category: category,
        title: title.trim(),
        body: body.trim(),
        org_id: orgId,
        created_by: user.id
      });
      if (error) throw error;
      toast.success('Post published to the board.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Could not publish post. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={'Create post on ' + cfg.label}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px'
      }}
    >
      <div style={{
        background: cardBg, border: '1px solid ' + border,
        borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, margin: 0 }}>
            {cfg.buttonLabel}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: border, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSecondary
            }}
          >
            <IconX size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Org selector (only if multiple admin orgs) */}
          {userOrgs.length > 1 && (
            <div>
              <label htmlFor="cbp-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
                Posting as
              </label>
              <select
                id="cbp-org"
                value={orgId}
                onChange={function(e) { setOrgId(e.target.value); }}
                style={inputStyle}
              >
                <option value="">Select organization...</option>
                {userOrgs.map(function(org) {
                  return <option key={org.id} value={org.id}>{org.name}</option>;
                })}
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label htmlFor="cbp-cat" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
              Category
            </label>
            <select
              id="cbp-cat"
              value={category}
              onChange={function(e) { setCategory(e.target.value); }}
              style={inputStyle}
            >
              {cfg.categories.map(function(c) {
                return <option key={c} value={c}>{c}</option>;
              })}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="cbp-title" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
              Headline <span style={{ fontWeight: 400, color: '#64748B' }}>(shown as a quote on the card)</span>
            </label>
            <input
              id="cbp-title"
              type="text"
              value={title}
              onChange={function(e) { setTitle(e.target.value); }}
              maxLength={120}
              aria-required="true"
              placeholder={
                boardType === 'ask' ? 'e.g. Need 10 volunteers for our spring food drive'
                : boardType === 'offer' ? 'e.g. 20 surplus winter coats available, free to any org'
                : 'e.g. Looking for a partner org to co-host our summer gala'
              }
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', textAlign: 'right' }}>
              {title.length}/120
            </p>
          </div>

          {/* Body */}
          <div>
            <label htmlFor="cbp-body" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
              Details
            </label>
            <textarea
              id="cbp-body"
              value={body}
              onChange={function(e) { setBody(e.target.value); }}
              rows={4}
              maxLength={500}
              aria-required="true"
              placeholder="Provide context — timeline, logistics, contact preferences, quantities, etc."
              style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })}
            />
            <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', textAlign: 'right' }}>
              {body.length}/500
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            aria-busy={saving}
            className={'w-full py-3 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-600')}
            style={{ background: '#3B82F6', color: '#FFFFFF', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600 }}
          >
            {saving ? 'Publishing...' : 'Publish to Board'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Respond Modal ─────────────────────────────────────────────────────────────

function RespondModal(props) {
  var post = props.post;
  var cfg = props.config;
  var userOrgs = props.userOrgs;
  var onClose = props.onClose;
  var onSuccess = props.onSuccess;

  var { isDark } = useTheme();
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var border = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var inputBg = isDark ? '#151B2D' : '#F8FAFC';

  var defaultOrg = userOrgs.length === 1 ? userOrgs[0].id : '';
  var [orgId, setOrgId] = useState(defaultOrg);
  var [message, setMessage] = useState('');
  var [saving, setSaving] = useState(false);

  var inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: inputBg,
    border: '1px solid ' + border,
    borderRadius: '8px',
    color: textPrimary,
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit'
  };

  async function handleSubmit() {
    if (!orgId) { toast.error('Select which org is responding.'); return; }
    if (!message.trim()) { toast.error('Write a message before sending.'); return; }
    setSaving(true);
    try {
      var { data: { user } } = await supabase.auth.getUser();
      var { error } = await supabase.from('community_board_responses').insert({
        post_id: post.id,
        from_org_id: orgId,
        from_member_id: user.id,
        message: message.trim()
      });
      if (error) throw error;
      await supabase.rpc('increment_post_response_count', { post_id_input: post.id });
      toast.success('Response sent to ' + post.org_name + '.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Could not send response. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={'Respond to ' + post.org_name}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px'
      }}
    >
      <div style={{
        background: cardBg, border: '1px solid ' + border,
        borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '440px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, margin: 0 }}>
            {cfg.respondLabel} to {post.org_name}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: border, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSecondary
            }}
          >
            <IconX size={12} />
          </button>
        </div>

        {/* Post preview */}
        <div style={{
          background: cfg.cardBg, borderRadius: '6px', padding: '12px', marginBottom: '16px'
        }}>
          <span style={{
            display: 'inline-block', padding: '2px 6px', borderRadius: '3px',
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px',
            background: cfg.tagBg, color: cfg.tagText
          }}>{post.category}</span>
          <div style={{
            fontSize: '12px', fontWeight: 700, color: '#111827', fontFamily: 'Georgia, serif'
          }}>"{post.title}"</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {userOrgs.length > 1 && (
            <div>
              <label htmlFor="cbr-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
                Responding as
              </label>
              <select
                id="cbr-org"
                value={orgId}
                onChange={function(e) { setOrgId(e.target.value); }}
                style={inputStyle}
              >
                <option value="">Select organization...</option>
                {userOrgs.map(function(org) {
                  return <option key={org.id} value={org.id}>{org.name}</option>;
                })}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="cbr-msg" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '6px' }}>
              Your message
            </label>
            <textarea
              id="cbr-msg"
              value={message}
              onChange={function(e) { setMessage(e.target.value); }}
              rows={4}
              maxLength={500}
              aria-required="true"
              placeholder="Introduce your org and explain how you can help..."
              style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })}
            />
            <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0', textAlign: 'right' }}>
              {message.length}/500
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            aria-busy={saving}
            style={{
              padding: '12px', background: cfg.tagBg, color: cfg.tagText,
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Sending...' : 'Send Response'}
          </button>
        </div>
      </div>
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

  var [activeTab, setActiveTab]         = useState('ask');
  var [posts, setPosts]                 = useState([]);
  var [loading, setLoading]             = useState(true);
  var [hasAccess, setHasAccess]         = useState(null);
  var [userOrgs, setUserOrgs]           = useState([]);
  var [userOrgIds, setUserOrgIds]       = useState([]);
  var [showCreate, setShowCreate]       = useState(false);
  var [respondingTo, setRespondingTo]   = useState(null);
  var [tabCounts, setTabCounts]         = useState({ ask: 0, offer: 0, collab: 0 });

  var cfg = BOARD_CONFIG[activeTab];

  // ── Check access on mount ──
  useEffect(function() {
    checkAccess();
  }, []);

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

      var orgs = data.map(function(m) {
        return { id: m.organizations.id, name: m.organizations.name };
      });
      var orgIds = orgs.map(function(o) { return o.id; });

      setUserOrgs(orgs);
      setUserOrgIds(orgIds);
      setHasAccess(true);
      loadTabCounts();
    } catch (err) {
      setHasAccess(false);
    }
  }

  // ── Load posts when tab changes ──
  useEffect(function() {
    if (hasAccess) loadPosts(activeTab);
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

      // Fetch org names separately
      var orgIds = [...new Set((data || []).map(function(p) { return p.org_id; }).filter(Boolean))];
      var orgMap = {};
      if (orgIds.length > 0) {
        var { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
      }

      var mapped = (data || []).map(function(p) {
        return Object.assign({}, p, { org_name: orgMap[p.org_id] || 'Unknown Org' });
      });
      setPosts(mapped);
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
      setTabCounts({
        ask:   results[0].count || 0,
        offer: results[1].count || 0,
        collab: results[2].count || 0
      });
    } catch (err) {
      // silent
    }
  }

  async function handleRemovePost(postId) {
    try {
      var { error } = await supabase
        .from('community_board_posts')
        .update({ is_active: false })
        .eq('id', postId);
      if (error) throw error;
      toast.success('Post removed from the board.');
      setPosts(function(prev) { return prev.filter(function(p) { return p.id !== postId; }); });
      loadTabCounts();
    } catch (err) {
      toast.error('Could not remove post.');
    }
  }

  // ── Loading access check ──
  if (hasAccess === null) {
    return (
      <div style={{ background: pageBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div aria-busy="true" aria-label="Checking access" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {[280, 220, 160].map(function(w, i) {
            return (
              <div key={i} style={{
                width: w + 'px', height: '12px',
                background: isDark ? '#1A2035' : '#E2E8F0',
                borderRadius: '6px', opacity: 0.6
              }} />
            );
          })}
        </div>
      </div>
    );
  }

  // ── Access denied ──
  if (hasAccess === false) {
    return (
      <main style={{ background: pageBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: cardBg, border: '1px solid ' + borderColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: textMuted
          }}>
            <IconLock size={26} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: textPrimary, marginBottom: '8px' }}>
            Admin Access Required
          </h1>
          <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.65, marginBottom: '24px', margin: '0 0 24px' }}>
            The Community Board is available to verified org admins only. You need to be an admin of at least one organization to participate.
          </p>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', background: '#3B82F6', color: '#FFFFFF',
              borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none'
            }}
          >
            <IconArrowLeft size={14} />
            Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  // ── Main render ──
  return (
    <main
      style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
      aria-label="Community Board"
    >

      {/* ── Page header ── */}
      <header style={{
        background: sectionBg,
        padding: '24px 24px 0',
        borderBottom: '1px solid ' + borderColor
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0 }}>
              The Community Board
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px',
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '99px',
              fontSize: '11px', fontWeight: 700, color: '#A78BFA'
            }}>
              <IconShield size={11} />
              Verified Org Admins Only
            </span>
          </div>

          <p style={{ fontSize: '13px', color: textMuted, marginBottom: '16px', margin: '0 0 16px' }}>
            A space for verified nonprofits to share needs, offer resources, and find collaboration partners.
          </p>

          {/* Tabs */}
          <nav
            role="tablist"
            aria-label="Community board sections"
            style={{ display: 'flex', overflowX: 'auto', gap: 0 }}
          >
            {TABS.map(function(tab) {
              var isActive = activeTab === tab.key;
              var count = tabCounts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={'panel-' + tab.key}
                  id={'tab-' + tab.key}
                  onClick={function() { setActiveTab(tab.key); }}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: isActive ? tab.color : textMuted,
                    borderBottom: isActive ? ('2px solid ' + tab.color) : '2px solid transparent',
                    marginBottom: '-1px',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    outline: 'none'
                  }}
                  className={'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      borderRadius: '99px',
                      padding: '1px 7px',
                      fontSize: '10px',
                      background: isActive ? 'rgba(167,139,250,0.15)' : (isDark ? '#1A2035' : '#F1F5F9'),
                      color: isActive ? tab.color : textMuted
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Tab panels ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>

        {/* Description + action button */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: '16px', marginBottom: '20px', flexWrap: 'wrap'
        }}>
          <p
            role="region"
            id={'panel-' + activeTab}
            aria-labelledby={'tab-' + activeTab}
            style={{ fontSize: '13px', color: textMuted, flex: 1, margin: 0 }}
          >
            {cfg.description}
          </p>
          <button
            onClick={function() { setShowCreate(true); }}
            aria-label={cfg.buttonLabel}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 16px',
              background: cardBg,
              border: '1px solid ' + borderColor,
              borderRadius: '8px',
              color: textSecondary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              outline: 'none'
            }}
            className={'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:opacity-80'}
          >
            <IconPlus size={13} />
            {cfg.buttonLabel}
          </button>
        </div>

        {/* Posts */}
        {loading ? (
          <div
            aria-busy="true"
            aria-label="Loading posts"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}
          >
            {[1,2,3,4,5,6].map(function(i) {
              return <SkeletonCard key={i} cardBg={cfg.cardBg} />;
            })}
          </div>

        ) : posts.length === 0 ? (
          <div
            role="status"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center', padding: '64px 32px', gap: '12px'
            }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px',
              background: cardBg, border: '1px solid ' + borderColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: textMuted
            }}>
              <IconMessage size={28} />
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>
              {cfg.emptyTitle}
            </h2>
            <p style={{ fontSize: '13px', color: textSecondary, maxWidth: '360px', lineHeight: 1.65, margin: 0 }}>
              {cfg.emptyDesc}
            </p>
            <button
              onClick={function() { setShowCreate(true); }}
              style={{
                marginTop: '8px', padding: '10px 20px',
                background: '#3B82F6', color: '#FFFFFF',
                border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}
              className={'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}
            >
              {cfg.buttonLabel}
            </button>
          </div>

        ) : (
          <div
            role="list"
            aria-label={cfg.label + ' posts'}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}
          >
            {posts.map(function(post) {
              var isOwn = userOrgIds.indexOf(post.org_id) !== -1;
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  config={cfg}
                  isOwn={isOwn}
                  onRespond={function(p) { setRespondingTo(p); }}
                  onRemove={handleRemovePost}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreatePostModal
          boardType={activeTab}
          config={cfg}
          userOrgs={userOrgs}
          onClose={function() { setShowCreate(false); }}
          onSuccess={function() {
            loadPosts(activeTab);
            loadTabCounts();
          }}
        />
      )}

      {respondingTo && (
        <RespondModal
          post={respondingTo}
          config={cfg}
          userOrgs={userOrgs}
          onClose={function() { setRespondingTo(null); }}
          onSuccess={function() { loadPosts(activeTab); }}
        />
      )}
    </main>
  );
}