/**
 * Syndicade — CommunityBoard.jsx
 * Individual board page. Scoped to a single community board by boardId.
 * Tabs: Ask · Offer · Collaboration · Recommendations
 * Board admin panel: approve/deny requests, manage members, edit settings.
 * Step 8: Post Chat — private per-org threads per post with realtime.
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// ─── Patrick Hand font ─────────────────────────────────────────────────────────

function usePatrickHand() {
  useEffect(function() {
    if (document.getElementById('patrick-hand-font')) return;
    var link = document.createElement('link');
    link.id = 'patrick-hand-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ─── Light theme tokens ────────────────────────────────────────────────────────

var BG     = '#F8FAFC';
var CARD   = '#FFFFFF';
var BDR    = '#E2E8F0';
var ELEV   = '#F1F5F9';
var TEXT   = '#0E1523';
var TEXT2  = '#475569';
var MUTED  = '#64748B';
var YELLOW = '#F5B731';
var BLUE   = '#3B82F6';
var GREEN  = '#22C55E';
var RED    = '#EF4444';
var PURPLE = '#8B5CF6';

// ─── Avatar helpers ────────────────────────────────────────────────────────────

var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
function getAvatarColor(name) {
  var char = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[char % AVATAR_COLORS.length];
}
function getInitials(name) {
  if (!name) return '??';
  var words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── Board config ──────────────────────────────────────────────────────────────

var BOARD_CONFIG = {
  ask: {
    label: 'Ask Board',
    tabColor: '#A78BFA',
    description: 'Post what your org needs — supplies, volunteers, skills, or anything a fellow member might have.',
    buttonLabel: 'Post an Ask',
    cardBg: '#E1BEE7',
    tagBg: '#9C27B0',
    tagText: '#F3E5F5',
    emptyTitle: 'No asks posted yet',
    emptyDesc: 'Be the first to post something your org needs.',
    categories: ['Supplies','Volunteers','Skills','Space','Equipment','Funding','Other'],
    primaryAction: 'Offer Help'
  },
  offer: {
    label: 'Offer Board',
    tabColor: '#22C55E',
    description: 'Share what your org has to give — surplus donations, unused equipment, available expertise.',
    buttonLabel: 'Post an Offer',
    cardBg: '#C8E6C9',
    tagBg: '#66BB6A',
    tagText: '#1B5E20',
    emptyTitle: 'No offers posted yet',
    emptyDesc: 'Share surplus supplies, skills, or equipment with fellow board members.',
    categories: ['Supplies','Volunteers','Skills','Space','Equipment','Other'],
    primaryAction: 'Claim This'
  },
  collab: {
    label: 'Collaboration',
    tabColor: '#3B82F6',
    description: 'Find partner orgs to co-host events, run joint programs, or pool resources.',
    buttonLabel: 'Post a Request',
    cardBg: '#BBDEFB',
    tagBg: '#42A5F5',
    tagText: '#0D47A1',
    emptyTitle: 'No collaboration requests yet',
    emptyDesc: 'Invite board members to co-host events or build programs together.',
    categories: ['Co-Host','Program','Campaign','Fundraiser','Advocacy','Other'],
    primaryAction: "I'm Interested"
  },
  recommendations: {
    label: 'Recommendations',
    tabColor: '#F59E0B',
    description: 'Share trusted vendors, sponsors, and service providers your org has worked with.',
    buttonLabel: 'Add a Recommendation',
    cardBg: '#FFF3E0',
    tagBg: '#FB8C00',
    tagText: '#FFF8E1',
    emptyTitle: 'No recommendations yet',
    emptyDesc: 'Share vendors, sponsors, or services your org trusts.',
    categories: ['Vendor','Sponsor','Contractor','Tech & Software','Legal','Financial','Printing','Catering','Other'],
    primaryAction: 'Endorse'
  }
};

var TABS = [
  { key: 'ask',             label: 'Ask Board',      color: '#A78BFA' },
  { key: 'offer',           label: 'Offer Board',     color: '#22C55E' },
  { key: 'collab',          label: 'Collaboration',   color: '#3B82F6' },
  { key: 'recommendations', label: 'Recommendations', color: '#F59E0B' }
];

var STATUS_CONFIG = {
  open:      { label: 'Open',      bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.4)',   text: '#16A34A' },
  pending:   { label: 'Pending',   bg: 'rgba(245,183,49,0.15)',  border: 'rgba(245,183,49,0.4)',  text: '#B45309' },
  completed: { label: 'Completed', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)', text: '#64748B' }
};

var THEMES = [
  { value: 'general',    label: 'General' },
  { value: 'latino',     label: 'Latino' },
  { value: 'black',      label: 'Black-led' },
  { value: 'lgbtq',      label: 'LGBTQ+' },
  { value: 'faith',      label: 'Faith-based' },
  { value: 'immigrant',  label: 'Immigrant' },
  { value: 'women',      label: 'Women-led' },
  { value: 'disability', label: 'Disability' },
  { value: 'asian',      label: 'Asian & AAPI' },
  { value: 'indigenous', label: 'Indigenous' },
  { value: 'youth',      label: 'Youth' },
  { value: 'other',      label: 'Other' }
];

var US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconArrowLeft(p) { return <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
function IconPlus(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconX(p) { return <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconSettings(p) { return <svg width={p.size||15} height={p.size||15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconUsers(p) { return <svg width={p.size||15} height={p.size||15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconBell(p) { return <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IconEdit(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function IconChevronDown(p) { return <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>; }
function IconChevronLeft(p) { return <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>; }
function IconCheck(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconLock(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IconGlobe(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function IconMapPin(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconMessage(p) { return <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function IconMessageCircle(p) { return <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>; }
function IconShield(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconClock(p) { return <svg width={p.size||26} height={p.size||26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconSend(p) { return <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  var now = new Date(), then = new Date(dateStr);
  var s = Math.floor((now - then) / 1000);
  if (s < 60) return 'just now';
  var m = Math.floor(s / 60);
  if (m < 60) return m + (m === 1 ? ' min ago' : ' mins ago');
  var h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  var d = Math.floor(h / 24);
  if (d < 7) return d + (d === 1 ? ' day ago' : ' days ago');
  return Math.floor(d / 7) + (Math.floor(d / 7) === 1 ? ' week ago' : ' weeks ago');
}
function formatDateTime(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function getThemeLabel(value) {
  var t = THEMES.find(function(t) { return t.value === value; });
  return t ? t.label : 'General';
}

async function insertCBNotifications(fromOrgId, toOrgId, boardName, boardId, userOrgs) {
  try {
    var sendingOrg = (userOrgs || []).find(function(o) { return o.id === fromOrgId; });
    var sendingOrgName = sendingOrg ? sendingOrg.name : 'An organization';

    var { data: adminIds, error } = await supabase.rpc('get_org_admin_user_ids', { p_org_id: toOrgId });
    if (error || !adminIds || adminIds.length === 0) return;

    var rows = adminIds.map(function(r) {
      return {
        user_id: r.user_id,
        type: 'community_board_message',
        title: sendingOrgName + ' sent you a message',
        message: 'New message on ' + boardName + ' Community Board.',
        link: '/community-board/' + boardId,
        read: false
      };
    });

    await supabase.from('notifications').insert(rows);

    // Instant delivery: same-browser window event
    window.dispatchEvent(new Event('notificationCreated'));

    // Instant delivery: broadcast to each recipient's personal channel
    for (var i = 0; i < adminIds.length; i++) {
      (function(userId) {
        var bc = supabase.channel('user-notif-' + userId);
        bc.subscribe(function(status) {
          if (status === 'SUBSCRIBED') {
            bc.send({
              type: 'broadcast',
              event: 'new_notification',
              payload: {}
            }).then(function() {
              supabase.removeChannel(bc);
            });
          }
        });
      })(adminIds[i].user_id);
    }
  } catch (err) {
    console.error('Could not insert CB notifications:', err);
  }
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge(props) {
  var s = STATUS_CONFIG[props.status] || STATUS_CONFIG.open;
  var [open, setOpen] = useState(false);
  if (!props.isOwn) {
    return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: s.bg, border: '1px solid ' + s.border, color: s.text }}>{s.label}</span>;
  }
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={function(e) { e.stopPropagation(); setOpen(!open); }} aria-label={'Change status, currently ' + s.label} aria-expanded={open}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: s.bg, border: '1px solid ' + s.border, color: s.text, cursor: 'pointer', outline: 'none' }}>
        {s.label}<IconChevronDown size={9} />
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', top: '26px', left: 0, zIndex: 20, background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', padding: '4px', minWidth: '120px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
          {Object.keys(STATUS_CONFIG).map(function(key) {
            var sc = STATUS_CONFIG[key];
            return <button key={key} role="menuitem" onClick={function(e) { e.stopPropagation(); setOpen(false); props.onChange(key); }}
              style={{ display: 'flex', width: '100%', padding: '7px 10px', background: 'none', border: 'none', color: sc.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px', textAlign: 'left' }}>{sc.label}</button>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Post Card (V3) ────────────────────────────────────────────────────────────

function PostCard(props) {
  var post = props.post, cfg = props.config, isOwn = props.isOwn;
  var unreadCount = props.unreadCount || 0;
  return (
    <article role="listitem" aria-label={post.org_name + ' ' + post.category + ' post'}
      style={{ background: cfg.cardBg, borderRadius: '12px', padding: '16px', position: 'relative', boxShadow: '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: '240px' }}>
      {isOwn && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 2 }}>
          <button onClick={function() { props.onEdit(post); }} aria-label="Edit post" className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.10)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}><IconEdit size={11} /></button>
          <button onClick={function() { props.onDelete(post); }} aria-label="Delete post" className="focus:outline-none focus:ring-2 focus:ring-red-500"
            style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED }}><IconTrash size={11} /></button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: cfg.tagBg, color: cfg.tagText }}>{post.category}</span>
        <StatusBadge status={post.status || 'open'} isOwn={isOwn} onChange={function(s) { props.onStatusChange(post.id, s); }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: cfg.tagBg, color: cfg.tagText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>{getInitials(post.org_name)}</div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{post.org_name}</span>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.4, marginBottom: '8px', fontFamily: 'Georgia, serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {'"' + post.title + '"'}
      </div>
      <div style={{ fontSize: '17px', fontWeight: 400, color: '#374151', lineHeight: 1.5, flex: 1, marginBottom: '10px', fontFamily: "'Patrick Hand', sans-serif", display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {post.body}
      </div>
      <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '8px' }}>
        {formatDateTime(post.created_at)}
        {post.response_count > 0 && <span style={{ marginLeft: '8px' }}>{'· ' + post.response_count + ' ' + (post.response_count === 1 ? 'response' : 'responses')}</span>}
      </div>
      {!isOwn && post.status !== 'completed' && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <button onClick={function() { props.onAction(post, 'primary'); }} aria-label={cfg.primaryAction + ' for ' + post.org_name}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: cfg.tagBg, color: cfg.tagText }}>{cfg.primaryAction}</button>
          <button onClick={function() { props.onAction(post, 'info'); }} aria-label={'Get more info from ' + post.org_name}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.10)', color: '#374151' }}>Get More Info</button>
        </div>
      )}
      {post.status === 'completed' && <div style={{ fontSize: '11px', color: '#6B7280', fontStyle: 'italic', marginBottom: '8px' }}>This has been fulfilled.</div>}

      {/* ── Card footer: own label + chat button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {isOwn
          ? <div style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic' }}>{'Your post · ' + timeAgo(post.created_at)}</div>
          : <div />
        }
        <button onClick={function(e) { e.stopPropagation(); props.onOpenChat(post); }}
          aria-label={'Open chat for this post' + (unreadCount > 0 ? ', ' + unreadCount + ' unread' : '')}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ position: 'relative', width: '30px', height: '30px', borderRadius: '50%', background: unreadCount > 0 ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: unreadCount > 0 ? BLUE : '#6B7280', flexShrink: 0 }}>
          <IconMessageCircle size={14} />
          {unreadCount > 0 && (
            <span aria-hidden="true" style={{ position: 'absolute', top: '-2px', right: '-2px', background: BLUE, color: '#FFFFFF', borderRadius: '99px', padding: '0 4px', fontSize: '9px', fontWeight: 700, minWidth: '14px', textAlign: 'center', lineHeight: '14px' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </article>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard(props) {
  return (
    <div aria-hidden="true" style={{ background: props.cardBg, borderRadius: '12px', padding: '16px', minHeight: '240px', boxShadow: '3px 4px 14px rgba(0,0,0,0.08)', opacity: 0.5 }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <div style={{ width: '56px', height: '18px', background: 'rgba(0,0,0,0.12)', borderRadius: '3px' }} />
        <div style={{ width: '48px', height: '18px', background: 'rgba(0,0,0,0.08)', borderRadius: '99px' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
        <div style={{ width: '110px', height: '11px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px' }} />
      </div>
      <div style={{ width: '92%', height: '13px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', marginBottom: '6px' }} />
      <div style={{ width: '78%', height: '13px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', marginBottom: '6px' }} />
      <div style={{ width: '85%', height: '11px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px' }} />
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal(props) {
  var [deleting, setDeleting] = useState(false);
  async function handleConfirm() { setDeleting(true); await props.onConfirm(props.post.id); setDeleting(false); }
  return (
    <div role="dialog" aria-modal="true" aria-label="Confirm delete post"
      onClick={function(e) { if (e.target === e.currentTarget) props.onCancel(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, flexShrink: 0 }}><IconTrash size={16} /></div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>Remove this post?</h2>
        </div>
        <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, marginBottom: '6px' }}>"{props.post.title}"</p>
        <p style={{ fontSize: '12px', color: MUTED, marginBottom: '20px' }}>{formatDateTime(props.post.created_at) + '. This cannot be undone.'}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={props.onCancel} className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Keep Post</button>
          <button onClick={handleConfirm} disabled={deleting} aria-busy={deleting} className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            style={{ flex: 1, padding: '10px', background: RED, border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
            {deleting ? 'Removing...' : 'Remove Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Action Modal ──────────────────────────────────────────────────────────────

function ActionModal(props) {
  var post = props.post, cfg = props.config, userOrgs = props.userOrgs, actionType = props.actionType;
  var titles = { primary: cfg.primaryAction, info: 'Request More Information' };
  var [orgId, setOrgId] = useState(userOrgs.length === 1 ? userOrgs[0].id : '');
  var [message, setMessage] = useState('');
  var [sending, setSending] = useState(false);
  var boardName = props.boardName;
  var approvedOrgIds = props.approvedOrgIds || [];
  var inputStyle = { width: '100%', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

async function handleSend() {
  if (!orgId) { toast.error('Select which org is sending this.'); return; }
  if (!message.trim()) { toast.error('Write a message first.'); return; }
  setSending(true);
  try {
    var { data: authData } = await supabase.auth.getUser();
    var { error } = await supabase.from('cb_post_messages').insert({
      post_id: post.id,
      from_org_id: orgId,
      to_org_id: post.org_id,
      sender_user_id: authData.user.id,
      message: '[' + titles[actionType] + '] ' + message.trim(),
      is_read: false
    });
    if (error) throw error;
    await supabase.from('community_board_posts').update({ status: 'pending' }).eq('id', post.id).eq('status', 'open');
    await insertCBNotifications(orgId, post.org_id, boardName, post.board_id, userOrgs);
    mascotSuccessToast('Message sent to ' + post.org_name + '.');
    props.onSuccess(); props.onClose();
  } catch (err) {
    mascotErrorToast('Could not send message.', 'Please try again.');
  } finally { setSending(false); }
}

  return (
    <div role="dialog" aria-modal="true" aria-label={titles[actionType] + ' — ' + post.org_name}
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>{titles[actionType]}</h2>
          <button onClick={props.onClose} aria-label="Close" className="focus:outline-none focus:ring-2 focus:ring-slate-400"
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2 }}><IconX size={12} /></button>
        </div>
        <div style={{ background: cfg.cardBg, borderRadius: '8px', padding: '10px', marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px', background: cfg.tagBg, color: cfg.tagText }}>{post.category}</span>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', fontFamily: 'Georgia, serif' }}>"{post.title}"</div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>{post.org_name + ' · ' + timeAgo(post.created_at)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
{userOrgs.length > 1 && (
  <div>
    <label htmlFor="am-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>From</label>
    <select id="am-org" value={orgId} onChange={function(e) { setOrgId(e.target.value); }} style={inputStyle}>
      <option value="">Select organization...</option>
      {userOrgs.map(function(o) {
        var isMember = approvedOrgIds.indexOf(o.id) !== -1;
        return (
          <option key={o.id} value={o.id} disabled={!isMember}>
            {o.name + (!isMember ? ' (not on this board)' : '')}
          </option>
        );
      })}
    </select>
    {orgId && approvedOrgIds.indexOf(orgId) === -1 && (
      <p style={{ fontSize: '11px', color: RED, margin: '4px 0 0' }}>
        This org is not a member of this board.
      </p>
    )}
  </div>
)}
          <div>
            <label htmlFor="am-msg" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Message</label>
            <textarea id="am-msg" value={message} onChange={function(e) { setMessage(e.target.value); }} rows={4} maxLength={500} aria-required="true"
              placeholder="Write your message..." style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{message.length + '/500'}</p>
          </div>
          <button onClick={handleSend} disabled={sending} aria-busy={sending} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ padding: '12px', background: cfg.tagBg, color: cfg.tagText, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Modal ────────────────────────────────────────────────────────────────

function PostModal(props) {
  var cfg = props.config, userOrgs = props.userOrgs, editingPost = props.editingPost;
  var isEditing = !!editingPost;
  var [orgId, setOrgId] = useState(editingPost ? editingPost.org_id : (userOrgs.length === 1 ? userOrgs[0].id : ''));
  var [category, setCategory] = useState(editingPost ? editingPost.category : cfg.categories[0]);
  var [title, setTitle] = useState(editingPost ? editingPost.title : '');
  var [body, setBody] = useState(editingPost ? editingPost.body : '');
  var [saving, setSaving] = useState(false);
  var inputStyle = { width: '100%', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  async function handleSubmit() {
    if (!orgId) { toast.error('Select which org is posting.'); return; }
    if (!title.trim()) { toast.error('Add a headline.'); return; }
    if (!body.trim()) { toast.error('Add some details.'); return; }
    setSaving(true);
    try {
      if (isEditing) {
        var { error } = await supabase.from('community_board_posts').update({ category: category, title: title.trim(), body: body.trim() }).eq('id', editingPost.id);
        if (error) throw error;
        mascotSuccessToast('Post updated.');
      } else {
        var { data: authData } = await supabase.auth.getUser();
        var { error: ie } = await supabase.from('community_board_posts').insert({
          board_id: props.boardId, board_type: props.boardType, category: category,
          title: title.trim(), body: body.trim(), org_id: orgId,
          created_by: authData.user.id, status: 'open', is_active: true, response_count: 0
        });
        if (ie) throw ie;
        mascotSuccessToast('Post published to the board.');
      }
      props.onSuccess(); props.onClose();
    } catch (err) {
      mascotErrorToast('Could not save post.', 'Please try again.');
    } finally { setSaving(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={(isEditing ? 'Edit post on ' : 'Post to ') + cfg.label}
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>{isEditing ? 'Edit Post' : cfg.buttonLabel}</h2>
          <button onClick={props.onClose} aria-label="Close" className="focus:outline-none focus:ring-2 focus:ring-slate-400"
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2 }}><IconX size={12} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isEditing && userOrgs.length > 1 && (
            <div>
              <label htmlFor="pm-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Posting as</label>
              <select id="pm-org" value={orgId} onChange={function(e) { setOrgId(e.target.value); }} style={inputStyle}>
                <option value="">Select organization...</option>
                {userOrgs.map(function(o) { return <option key={o.id} value={o.id}>{o.name}</option>; })}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="pm-cat" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Category</label>
            <select id="pm-cat" value={category} onChange={function(e) { setCategory(e.target.value); }} style={inputStyle}>
              {cfg.categories.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
          <div>
            <label htmlFor="pm-title" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>
              Headline <span style={{ fontWeight: 400, color: MUTED }}>(shown as quote on card)</span>
            </label>
            <input id="pm-title" type="text" value={title} onChange={function(e) { setTitle(e.target.value); }} maxLength={120} aria-required="true"
              placeholder="e.g. Looking for a printing vendor under $500" style={inputStyle} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{title.length + '/120'}</p>
          </div>
          <div>
            <label htmlFor="pm-body" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Details</label>
            <textarea id="pm-body" value={body} onChange={function(e) { setBody(e.target.value); }} rows={4} maxLength={500} aria-required="true"
              placeholder="Provide context — timeline, quantities, contact preferences..." style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{body.length + '/500'}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving} aria-busy={saving} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ padding: '12px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish to Board')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Chat Panel ───────────────────────────────────────────────────────────

function PostChatPanel(props) {
var boardName = props.boardName;
  var post       = props.post;
  var isOwn      = props.isOwn;
  var userOrgs   = props.userOrgs;
  var onClose    = props.onClose;
  var onMarkRead = props.onMarkRead;
  var approvedOrgIds = props.approvedOrgIds || [];

  // Orgs the user admins that are NOT the post owner
  var otherOrgs = userOrgs.filter(function(o) { return o.id !== post.org_id; });
  // Can the user also reply as a non-owner org?
  var canReply = otherOrgs.length > 0;

  var [replyMode, setReplyMode]           = useState(false);
  var [myOrgId, setMyOrgId]               = useState(isOwn ? post.org_id : (userOrgs.length === 1 ? userOrgs[0].id : null));
  var [view, setView]                     = useState(isOwn ? 'list' : 'thread');
  var [partnerOrgId, setPartnerOrgId]     = useState(isOwn ? null : post.org_id);
  var [partnerOrgName, setPartnerOrgName] = useState(isOwn ? null : post.org_name);
  var [messages, setMessages]             = useState([]);
  var [conversations, setConversations]   = useState([]);
  var [loading, setLoading]               = useState(true);
  var [newMsg, setNewMsg]                 = useState('');
  var [sending, setSending]               = useState(false);
  var messagesEndRef = useRef(null);
  var channelRef     = useRef(null);

function enterReplyMode() {
  var eligibleOrgs = otherOrgs.filter(function(o) { return approvedOrgIds.indexOf(o.id) !== -1; });
  var replyOrgId = eligibleOrgs.length === 1 ? eligibleOrgs[0].id : null;
  setReplyMode(true);
  setMyOrgId(replyOrgId);
  setPartnerOrgId(post.org_id);
  setPartnerOrgName(post.org_name);
  setView('thread');
  setMessages([]);
}

  function exitReplyMode() {
    setReplyMode(false);
    setMyOrgId(post.org_id);
    setPartnerOrgId(null);
    setPartnerOrgName(null);
    setView('list');
    setMessages([]);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }

  useEffect(function() {
    if (!myOrgId) { setLoading(false); return; }
    if (view === 'thread' && partnerOrgId) {
      loadThread();
      subscribeToThread();
    } else if (view === 'list') {
      loadConversations();
    }
    return function() {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [view, myOrgId, partnerOrgId]);

  useEffect(function() {
    if (view === 'thread' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function loadThread() {
    setLoading(true);
    try {
      var { data, error } = await supabase
        .from('cb_post_messages')
        .select('*')
        .eq('post_id', post.id)
        .or(
          'and(from_org_id.eq.' + myOrgId + ',to_org_id.eq.' + partnerOrgId + '),' +
          'and(from_org_id.eq.' + partnerOrgId + ',to_org_id.eq.' + myOrgId + ')'
        )
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      var unreadIds = (data || [])
        .filter(function(m) { return !m.is_read && m.to_org_id === myOrgId; })
        .map(function(m) { return m.id; });
      if (unreadIds.length > 0) {
        await supabase.from('cb_post_messages').update({ is_read: true }).in('id', unreadIds);
        if (onMarkRead) onMarkRead(post.id, unreadIds.length);
      }
    } catch (err) {
      toast.error('Could not load messages.');
    } finally { setLoading(false); }
  }

  async function loadConversations() {
    setLoading(true);
    try {
      var { data, error } = await supabase
        .from('cb_post_messages')
        .select('*')
        .eq('post_id', post.id)
        .or('from_org_id.eq.' + myOrgId + ',to_org_id.eq.' + myOrgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      var convMap = {};
      (data || []).forEach(function(m) {
        var partnerId = m.from_org_id === myOrgId ? m.to_org_id : m.from_org_id;
        if (!convMap[partnerId]) {
          convMap[partnerId] = { orgId: partnerId, orgName: '', messages: [], unread: 0 };
        }
        convMap[partnerId].messages.push(m);
        if (!m.is_read && m.to_org_id === myOrgId) convMap[partnerId].unread++;
      });
      var partnerIds = Object.keys(convMap);
      if (partnerIds.length > 0) {
        var { data: orgs } = await supabase.from('organizations').select('id, name').in('id', partnerIds);
        (orgs || []).forEach(function(o) { if (convMap[o.id]) convMap[o.id].orgName = o.name; });
      }
      setConversations(Object.values(convMap).map(function(c) {
        return Object.assign({}, c, { lastMessage: c.messages[0] });
      }));
    } catch (err) {
      toast.error('Could not load conversations.');
    } finally { setLoading(false); }
  }

  function subscribeToThread() {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel('cb-thread-' + post.id + '-' + myOrgId + '-' + (partnerOrgId || ''))
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'cb_post_messages',
        filter: 'post_id=eq.' + post.id
      }, function(payload) {
        var msg = payload.new;
        var isRelevant =
          (msg.from_org_id === myOrgId && msg.to_org_id === partnerOrgId) ||
          (msg.from_org_id === partnerOrgId && msg.to_org_id === myOrgId);
        if (!isRelevant) return;
        setMessages(function(prev) { return prev.concat([msg]); });
        if (msg.to_org_id === myOrgId) {
          supabase.from('cb_post_messages').update({ is_read: true }).eq('id', msg.id);
          if (onMarkRead) onMarkRead(post.id, 1);
        }
      })
      .subscribe();
  }

async function handleSend() {
    if (!newMsg.trim()) return;
    if (!myOrgId) { toast.error('Select which org you are chatting as.'); return; }
    setSending(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { error } = await supabase.from('cb_post_messages').insert({
        post_id: post.id,
        from_org_id: myOrgId,
        to_org_id: partnerOrgId,
        sender_user_id: authData.user.id,
        message: newMsg.trim(),
        is_read: false
      });
if (error) throw error;
      setNewMsg('');
      insertCBNotifications(myOrgId, partnerOrgId, boardName, post.board_id, userOrgs);
} catch (err) {
      mascotErrorToast('Could not send message.', 'Please try again.');
    } finally { setSending(false); }
  }

  function openThread(conv) {
    setPartnerOrgId(conv.orgId);
    setPartnerOrgName(conv.orgName);
    setView('thread');
  }

  function goBackToList() {
    setView('list');
    setPartnerOrgId(null);
    setPartnerOrgName(null);
    setMessages([]);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    loadConversations();
  }

  var inputStyle = {
    width: '100%', padding: '9px 12px', background: ELEV,
    border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT,
    fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  };

  // Header title logic
  var headerTitle = 'Messages';
  if (replyMode) {
    headerTitle = view === 'thread' ? (partnerOrgName || 'Chat') : 'Reply as your org';
  } else if (!isOwn) {
    headerTitle = view === 'thread' ? (partnerOrgName || 'Chat') : 'Messages';
  }

  var showBackButton = (view === 'thread' && isOwn && !replyMode) || (view === 'thread' && replyMode && otherOrgs.length > 1);

  return (
    <>
      <div onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.20)', zIndex: 35 }}
        aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-label={'Chat: ' + post.title}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', maxWidth: '100vw', background: CARD, borderLeft: '1px solid ' + BDR, zIndex: 36, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>

        {/* ── Panel header ── */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid ' + BDR, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            {showBackButton && (
              <button
                onClick={replyMode ? exitReplyMode : goBackToList}
                aria-label="Back"
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: ELEV, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2, flexShrink: 0 }}>
                <IconChevronLeft size={14} />
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {headerTitle}
              </h2>
              <p style={{ fontSize: '11px', color: MUTED, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {'"' + post.title + '"'}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close chat"
              className="focus:outline-none focus:ring-2 focus:ring-slate-400"
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: ELEV, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, flexShrink: 0 }}>
              <IconX size={12} />
            </button>
          </div>

          {/* Mode toggle — shown when user is owner but also admins other orgs */}
          {isOwn && canReply && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: ELEV, borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={exitReplyMode}
                aria-pressed={!replyMode}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: !replyMode ? CARD : 'transparent', color: !replyMode ? TEXT : MUTED, boxShadow: !replyMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                Received
              </button>
              <button
                onClick={enterReplyMode}
                aria-pressed={replyMode}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: replyMode ? CARD : 'transparent', color: replyMode ? TEXT : MUTED, boxShadow: replyMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                Reply as Org
              </button>
            </div>
          )}

          {/* Org picker for reply mode with multiple non-owner orgs */}
          {replyMode && otherOrgs.length > 1 && (
<div style={{ marginBottom: '12px' }}>
  <label htmlFor="cp-reply-org" style={{ fontSize: '10px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Replying as</label>
  <select id="cp-reply-org" value={myOrgId || ''} onChange={function(e) { setMyOrgId(e.target.value); setMessages([]); }}
    style={Object.assign({}, inputStyle, { fontSize: '12px', padding: '6px 10px' })}>
    <option value="">Select organization...</option>
    {otherOrgs.map(function(o) {
      var isMember = approvedOrgIds.indexOf(o.id) !== -1;
      return (
        <option key={o.id} value={o.id} disabled={!isMember}>
          {o.name + (!isMember ? ' (not on this board)' : '')}
        </option>
      );
    })}
  </select>
  {myOrgId && approvedOrgIds.indexOf(myOrgId) === -1 && (
    <p style={{ fontSize: '11px', color: RED, margin: '4px 0 0' }}>
      This org is not a member of this board and cannot send messages.
    </p>
  )}
</div>
          )}

          {/* Org picker for non-owners with multiple orgs */}
          {!isOwn && !replyMode && userOrgs.length > 1 && (
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="cp-org" style={{ fontSize: '10px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Chatting as</label>
              <select id="cp-org" value={myOrgId || ''} onChange={function(e) { setMyOrgId(e.target.value); setMessages([]); }}
                style={Object.assign({}, inputStyle, { fontSize: '12px', padding: '6px 10px' })}>
                <option value="">Select organization...</option>
                {userOrgs.map(function(o) { return <option key={o.id} value={o.id}>{o.name}</option>; })}
              </select>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(function(i) { return <div key={i} style={{ height: '52px', background: ELEV, borderRadius: '10px' }} />; })}
            </div>

          ) : view === 'list' ? (
            conversations.length === 0 ? (
              <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ELEV, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, margin: '0 auto 12px' }}>
                  <IconMessageCircle size={22} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>No messages yet</p>
                <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0 }}>When other orgs respond to this post, their messages will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {conversations.map(function(conv) {
                  return (
                    <button key={conv.orgId} onClick={function() { openThread(conv); }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getAvatarColor(conv.orgName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                        {getInitials(conv.orgName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.orgName}</div>
                        <div style={{ fontSize: '11px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.lastMessage ? conv.lastMessage.message : ''}
                        </div>
                      </div>
                      {conv.unread > 0 && (
                        <span style={{ background: BLUE, color: '#FFFFFF', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )

          ) : (
            messages.length === 0 ? (
              <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ELEV, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, margin: '0 auto 12px' }}>
                  <IconMessageCircle size={22} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Start the conversation</p>
                <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0 }}>
                  {'Send a message to ' + (partnerOrgName || 'this org') + ' about this post.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.map(function(msg) {
                  var isMine = msg.from_org_id === myOrgId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px' }}>
                      {!isMine && (
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: getAvatarColor(partnerOrgName || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                          {getInitials(partnerOrgName || '')}
                        </div>
                      )}
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{ padding: '8px 12px', borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMine ? BLUE : ELEV, color: isMine ? '#FFFFFF' : TEXT, fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                          {msg.message}
                        </div>
                        <div style={{ fontSize: '10px', color: MUTED, marginTop: '3px', textAlign: isMine ? 'right' : 'left' }}>
                          {timeAgo(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )
          )}
        </div>

        {/* ── Input (thread view only) ── */}
        {view === 'thread' && myOrgId && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid ' + BDR, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea
                value={newMsg}
                onChange={function(e) { setNewMsg(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message..."
                rows={2}
                maxLength={500}
                aria-label="Message input"
                style={{ flex: 1, padding: '8px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '13px', resize: 'none', lineHeight: 1.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              <button onClick={handleSend} disabled={sending || !newMsg.trim()} aria-label="Send message"
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ width: '36px', height: '36px', borderRadius: '8px', background: (newMsg.trim() && !sending) ? BLUE : ELEV, border: 'none', color: (newMsg.trim() && !sending) ? '#FFFFFF' : MUTED, cursor: (newMsg.trim() && !sending) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                <IconSend size={14} />
              </button>
            </div>
            <p style={{ fontSize: '10px', color: MUTED, margin: '4px 0 0' }}>Enter to send · Shift+Enter for new line</p>
          </div>
        )}
        {view === 'thread' && !myOrgId && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid ' + BDR, flexShrink: 0 }}>
            <p style={{ fontSize: '12px', color: MUTED, margin: 0, textAlign: 'center' }}>Select an organization above to chat.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Admin Panel ───────────────────────────────────────────────────────────────

function AdminPanel(props) {
  var board = props.board, boardId = props.boardId;
  var [adminTab, setAdminTab] = useState('requests');
  var [memberships, setMemberships] = useState([]);
  var [loading, setLoading] = useState(true);
  var [processing, setProcessing] = useState({});
  var [editName, setEditName] = useState(board.name || '');
  var [editDesc, setEditDesc] = useState(board.description || '');
  var [editCity, setEditCity] = useState(board.city || '');
  var [editState, setEditState] = useState(board.state || '');
  var [editCounty, setEditCounty] = useState(board.county || '');
  var [editZip, setEditZip] = useState(board.zip_code || '');
  var [editVisibility, setEditVisibility] = useState(board.visibility || 'public');
  var [editTheme, setEditTheme] = useState(board.theme || 'general');
  var [savingSettings, setSavingSettings] = useState(false);

  var [inviteExpiry, setInviteExpiry]           = useState('30');
  var [customExpiry, setCustomExpiry]           = useState('');
  var [generatingLink, setGeneratingLink]       = useState(false);
  var [generalInvites, setGeneralInvites]       = useState([]);
  var [directInvites, setDirectInvites]         = useState([]);
  var [loadingInvites, setLoadingInvites]       = useState(false);
  var [orgSearch, setOrgSearch]                 = useState('');
  var [orgResults, setOrgResults]               = useState([]);
  var [selectedInviteOrg, setSelectedInviteOrg] = useState(null);
  var [sendingOrgInvite, setSendingOrgInvite]   = useState(false);
  var [copiedId, setCopiedId]                   = useState(null);

  useEffect(function() { loadMemberships(); }, []);
  useEffect(function() { if (adminTab === 'invites') loadInvites(); }, [adminTab]);

  async function loadMemberships() {
    setLoading(true);
    try {
      var { data, error } = await supabase.rpc('get_board_memberships', { p_board_id: boardId });
      if (error) throw error;
      setMemberships(data || []);
    } catch (err) { toast.error('Could not load members.'); } finally { setLoading(false); }
  }

  async function handleApprove(membershipId, orgName) {
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: true }); });
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { data, error } = await supabase.rpc('approve_board_membership', {
        p_membership_id: membershipId,
        p_reviewer_id: authData.user.id
      });
      if (error) throw error;
      if (!data) { toast.error('Could not approve — permission denied.'); return; }
      mascotSuccessToast(orgName + ' approved.');
      loadMemberships(); props.onMembershipChange();
    } catch (err) { mascotErrorToast('Could not approve request.'); }
    finally { setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: false }); }); }
  }

  async function handleDeny(membershipId, orgName) {
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: true }); });
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { data, error } = await supabase.rpc('deny_board_membership', {
        p_membership_id: membershipId,
        p_reviewer_id: authData.user.id
      });
      if (error) throw error;
      if (!data) { toast.error('Could not deny — permission denied.'); return; }
      toast.error(orgName + ' request denied.');
      loadMemberships();
    } catch (err) { mascotErrorToast('Could not deny request.'); }
    finally { setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: false }); }); }
  }

  async function handlePromote(membershipId, orgName, currentRole) {
    var newRole = currentRole === 'admin' ? 'member' : 'admin';
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'r']: true }); });
    try {
      var { error } = await supabase.from('community_board_memberships').update({ role: newRole }).eq('id', membershipId);
      if (error) throw error;
      mascotSuccessToast(orgName + ' is now a board ' + newRole + '.');
      loadMemberships();
    } catch (err) { mascotErrorToast('Could not update role.'); }
    finally { setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'r']: false }); }); }
  }

  async function handleRemove(membershipId, orgName) {
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'x']: true }); });
    try {
      var { error } = await supabase.from('community_board_memberships').delete().eq('id', membershipId);
      if (error) throw error;
      mascotSuccessToast(orgName + ' removed from board.');
      loadMemberships(); props.onMembershipChange();
    } catch (err) { mascotErrorToast('Could not remove org.'); }
    finally { setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'x']: false }); }); }
  }

  async function handleSaveSettings() {
    if (!editName.trim()) { toast.error('Board name is required.'); return; }
    setSavingSettings(true);
    try {
      var { error } = await supabase.from('community_boards').update({
        name: editName.trim(), description: editDesc.trim() || null,
        city: editCity.trim() || null, state: editState || null,
        county: editCounty.trim() || null, zip_code: editZip.trim() || null,
        visibility: editVisibility, theme: editTheme, updated_at: new Date().toISOString()
      }).eq('id', boardId);
      if (error) throw error;
      mascotSuccessToast('Board settings saved.');
      props.onSettingsChange();
    } catch (err) { mascotErrorToast('Could not save settings.', 'Please try again.'); }
    finally { setSavingSettings(false); }
  }

  async function loadInvites() {
    setLoadingInvites(true);
    try {
      var { data, error } = await supabase.from('community_board_invites').select('*').eq('board_id', boardId).order('created_at', { ascending: false });
      if (error) throw error;
      var generals = (data || []).filter(function(i) { return !i.invited_org_id; });
      var directs  = (data || []).filter(function(i) { return !!i.invited_org_id; });
      if (directs.length > 0) {
        var orgIds = directs.map(function(i) { return i.invited_org_id; });
        var { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
        var orgMap = {};
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
        directs = directs.map(function(i) { return Object.assign({}, i, { org_name: orgMap[i.invited_org_id] || 'Unknown Org' }); });
      }
      setGeneralInvites(generals);
      setDirectInvites(directs);
    } catch (err) { toast.error('Could not load invites.'); }
    finally { setLoadingInvites(false); }
  }

  async function generateInviteLink() {
    setGeneratingLink(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      var expiresAt = null;
      if (inviteExpiry === 'custom' && customExpiry) {
        expiresAt = new Date(customExpiry).toISOString();
      } else if (inviteExpiry !== 'none') {
        var d = new Date();
        d.setDate(d.getDate() + parseInt(inviteExpiry));
        expiresAt = d.toISOString();
      }
      var { data: inv, error } = await supabase.from('community_board_invites').insert({
        board_id: boardId, created_by_user_id: authData.user.id,
        invited_org_id: null, expires_at: expiresAt
      }).select().single();
      if (error) throw error;
      var link = window.location.origin + '/community-board/join?token=' + inv.token;
      try {
        await navigator.clipboard.writeText(link);
        setCopiedId(inv.id);
        setTimeout(function() { setCopiedId(null); }, 3000);
        mascotSuccessToast('Invite link generated and copied.');
      } catch (clipErr) {
        mascotSuccessToast('Invite link generated.', 'Use the Copy button to copy it.');
      }
      loadInvites();
    } catch (err) { mascotErrorToast('Could not generate link.', 'Please try again.'); }
    finally { setGeneratingLink(false); }
  }

  async function searchOrgs(query) {
    if (!query || query.length < 2) { setOrgResults([]); return; }
    try {
      var { data } = await supabase.from('organizations').select('id, name, type').ilike('name', '%' + query + '%').limit(8);
      setOrgResults(data || []);
    } catch (err) { /* silent */ }
  }

  async function sendOrgInvite() {
    if (!selectedInviteOrg) return;
    setSendingOrgInvite(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { error } = await supabase.from('community_board_invites').insert({
        board_id: boardId, created_by_user_id: authData.user.id,
        invited_org_id: selectedInviteOrg.id, expires_at: null
      });
      if (error) throw error;
      mascotSuccessToast('Invite sent to ' + selectedInviteOrg.name + '.');
      setSelectedInviteOrg(null); setOrgSearch(''); setOrgResults([]);
      loadInvites();
    } catch (err) {
      if (err.code === '23505') { toast.error('This org has already been invited.'); }
      else { mascotErrorToast('Could not send invite.', 'Please try again.'); }
    } finally { setSendingOrgInvite(false); }
  }

  async function deleteInvite(inviteId) {
    try {
      var { error } = await supabase.from('community_board_invites').delete().eq('id', inviteId);
      if (error) throw error;
      mascotSuccessToast('Invite removed.');
      loadInvites();
    } catch (err) { mascotErrorToast('Could not remove invite.'); }
  }

  function copyInviteLink(token, id) {
    var link = window.location.origin + '/community-board/join?token=' + token;
    navigator.clipboard.writeText(link).then(function() {
      setCopiedId(id);
      setTimeout(function() { setCopiedId(null); }, 3000);
      mascotSuccessToast('Link copied to clipboard.');
    });
  }

  function formatExpiry(dateStr) {
    if (!dateStr) return 'No expiry';
    var d = new Date(dateStr);
    if (d < new Date()) return 'Expired';
    return 'Expires ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  var pending  = memberships.filter(function(m) { return m.status === 'pending'; });
  var approved = memberships.filter(function(m) { return m.status === 'approved'; });
  var inputStyle = { width: '100%', padding: '9px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  var labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '4px' };
  var adminTabs = [
    { key: 'requests', label: 'Requests', badge: pending.length },
    { key: 'members',  label: 'Members',  badge: 0 },
    { key: 'invites',  label: 'Invites',  badge: 0 },
    { key: 'settings', label: 'Settings', badge: 0 }
  ];

  return (
    <>
      <div onClick={props.onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 39 }} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Board Admin Panel"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', maxWidth: '100vw', background: CARD, borderLeft: '1px solid ' + BDR, zIndex: 40, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>

        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid ' + BDR }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139,92,246,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PURPLE }}><IconSettings size={14} /></div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: 0 }}>Manage Board</h2>
            </div>
            <button onClick={props.onClose} aria-label="Close admin panel" className="focus:outline-none focus:ring-2 focus:ring-slate-400"
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: ELEV, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><IconX size={12} /></button>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {adminTabs.map(function(t) {
              var isActive = adminTab === t.key;
              return (
                <button key={t.key} onClick={function() { setAdminTab(t.key); }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  style={{ padding: '8px 14px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: isActive ? BLUE : MUTED, borderBottom: isActive ? '2px solid ' + BLUE : '2px solid transparent', marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {t.label}
                  {t.badge > 0 && <span style={{ background: RED, color: '#FFFFFF', borderRadius: '99px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>{t.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {adminTab === 'requests' && (
            loading ? (
              <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1,2,3].map(function(i) { return <div key={i} style={{ height: '72px', background: ELEV, borderRadius: '10px' }} />; })}
              </div>
            ) : pending.length === 0 ? (
              <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ELEV, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, margin: '0 auto 12px' }}><IconBell size={20} /></div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>No pending requests</p>
                <p style={{ fontSize: '13px', color: TEXT2 }}>New join requests will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pending.map(function(m) {
                  var busy = processing[m.id];
                  return (
                    <div key={m.id} style={{ background: ELEV, border: '1px solid ' + BDR, borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getAvatarColor(m.org_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>{getInitials(m.org_name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{m.org_name}</span>
                            {m.is_verified_nonprofit && (
                              <svg style={{ width: '13px', height: '13px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2} aria-label="Verified nonprofit">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: MUTED }}>{(m.org_type || 'Organization') + ' · requested ' + timeAgo(m.created_at)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={function() { handleApprove(m.id, m.org_name); }} disabled={busy}
                          className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                          style={{ flex: 1, padding: '7px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: '#16A34A', fontSize: '12px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <IconCheck size={12} />{busy ? '...' : 'Approve'}
                        </button>
                        <button onClick={function() { handleDeny(m.id, m.org_name); }} disabled={busy}
                          className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                          style={{ flex: 1, padding: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: RED, fontSize: '12px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <IconX size={11} />{busy ? '...' : 'Deny'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {adminTab === 'members' && (
            loading ? (
              <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1,2,3,4].map(function(i) { return <div key={i} style={{ height: '64px', background: ELEV, borderRadius: '10px' }} />; })}
              </div>
            ) : approved.length === 0 ? (
              <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                <p style={{ fontSize: '14px', color: TEXT2 }}>No approved members yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {approved.map(function(m) {
                  var busyR = processing[m.id + 'r'];
                  var busyX = processing[m.id + 'x'];
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getAvatarColor(m.org_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>{getInitials(m.org_name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.org_name}</div>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: m.role === 'admin' ? 'rgba(139,92,246,0.12)' : CARD, border: '1px solid ' + (m.role === 'admin' ? 'rgba(139,92,246,0.3)' : BDR), color: m.role === 'admin' ? PURPLE : MUTED }}>
                          {m.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button onClick={function() { handlePromote(m.id, m.org_name, m.role); }} disabled={busyR}
                          aria-label={(m.role === 'admin' ? 'Demote ' : 'Make admin: ') + m.org_name}
                          className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                          style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid ' + BDR, background: CARD, color: MUTED, cursor: busyR ? 'not-allowed' : 'pointer', opacity: busyR ? 0.6 : 1 }}>
                          {busyR ? '...' : (m.role === 'admin' ? 'Demote' : 'Make Admin')}
                        </button>
                        <button onClick={function() { handleRemove(m.id, m.org_name); }} disabled={busyX}
                          aria-label={'Remove ' + m.org_name + ' from board'}
                          className="focus:outline-none focus:ring-2 focus:ring-red-500"
                          style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: RED, cursor: busyX ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busyX ? 0.6 : 1 }}>
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {adminTab === 'invites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 8px' }}>Shareable Link</p>
                <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: '0 0 14px' }}>
                  Anyone with this link can request to join the board. Board admins still approve each request.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label htmlFor="inv-expiry" style={labelStyle}>Link expires</label>
                    <select id="inv-expiry" value={inviteExpiry} onChange={function(e) { setInviteExpiry(e.target.value); }} style={inputStyle}>
                      <option value="none">Never</option>
                      <option value="7">In 7 days</option>
                      <option value="30">In 30 days</option>
                      <option value="60">In 60 days</option>
                      <option value="custom">Custom date</option>
                    </select>
                  </div>
                  {inviteExpiry === 'custom' && (
                    <div>
                      <label htmlFor="inv-date" style={labelStyle}>Expiry date</label>
                      <input id="inv-date" type="date" value={customExpiry} onChange={function(e) { setCustomExpiry(e.target.value); }}
                        min={new Date().toISOString().split('T')[0]} style={inputStyle} />
                    </div>
                  )}
                  <button onClick={generateInviteLink} disabled={generatingLink} aria-busy={generatingLink}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    style={{ padding: '9px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: generatingLink ? 'not-allowed' : 'pointer', opacity: generatingLink ? 0.7 : 1 }}>
                    {generatingLink ? 'Generating...' : 'Generate & Copy Link'}
                  </button>
                </div>
                {loadingInvites ? (
                  <div style={{ height: '40px', background: ELEV, borderRadius: '8px' }} aria-hidden="true" />
                ) : generalInvites.length > 0 && (
                  <div>
                    <p style={Object.assign({}, labelStyle, { marginBottom: '8px' })}>Active Links</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {generalInvites.map(function(inv) {
                        var isCopied = copiedId === inv.id;
                        var isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
                        return (
                          <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', opacity: isExpired ? 0.5 : 1 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {'...' + inv.token.slice(-12)}
                              </div>
                              <div style={{ fontSize: '11px', color: isExpired ? RED : MUTED }}>{formatExpiry(inv.expires_at)}</div>
                            </div>
                            <button onClick={function() { copyInviteLink(inv.token, inv.id); }}
                              aria-label="Copy invite link" className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid ' + BDR, background: isCopied ? 'rgba(34,197,94,0.10)' : CARD, color: isCopied ? GREEN : TEXT2, cursor: 'pointer', flexShrink: 0 }}>
                              {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={function() { deleteInvite(inv.id); }}
                              aria-label="Delete invite link" className="focus:outline-none focus:ring-2 focus:ring-red-500"
                              style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: RED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconTrash size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: BDR }} />

              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 8px' }}>Invite an Organization</p>
                <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: '0 0 14px' }}>
                  Send a direct invite to a specific org. They will be auto-approved when they accept.
                </p>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={orgSearch}
                    onChange={function(e) { setOrgSearch(e.target.value); searchOrgs(e.target.value); }}
                    placeholder="Search organizations by name..."
                    aria-label="Search organizations to invite"
                    style={inputStyle} />
                  {orgResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', zIndex: 10, maxHeight: '180px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginTop: '4px' }}>
                      {orgResults.map(function(org) {
                        return (
                          <button key={org.id} onClick={function() { setSelectedInviteOrg(org); setOrgSearch(org.name); setOrgResults([]); }}
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                            onMouseEnter={function(e) { e.currentTarget.style.background = ELEV; }}
                            onMouseLeave={function(e) { e.currentTarget.style.background = 'none'; }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(org.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                              {getInitials(org.name)}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{org.name}</div>
                              <div style={{ fontSize: '11px', color: MUTED }}>{org.type || 'Organization'}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedInviteOrg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', marginTop: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: getAvatarColor(selectedInviteOrg.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                      {getInitials(selectedInviteOrg.name)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT, flex: 1 }}>{selectedInviteOrg.name}</span>
                    <button onClick={function() { setSelectedInviteOrg(null); setOrgSearch(''); }} aria-label="Clear selection"
                      style={{ width: '22px', height: '22px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
                      <IconX size={10} />
                    </button>
                  </div>
                )}
                <button onClick={sendOrgInvite} disabled={!selectedInviteOrg || sendingOrgInvite} aria-busy={sendingOrgInvite}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{ width: '100%', padding: '9px', background: selectedInviteOrg ? BLUE : ELEV, color: selectedInviteOrg ? '#FFFFFF' : MUTED, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: (selectedInviteOrg && !sendingOrgInvite) ? 'pointer' : 'not-allowed', marginTop: '10px', opacity: sendingOrgInvite ? 0.7 : 1 }}>
                  {sendingOrgInvite ? 'Sending...' : 'Send Direct Invite'}
                </button>
                {directInvites.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={Object.assign({}, labelStyle, { marginBottom: '8px' })}>Sent Invites</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {directInvites.map(function(inv) {
                        var isUsed = !!inv.used_at;
                        return (
                          <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(inv.org_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                              {getInitials(inv.org_name)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.org_name}</div>
                              <div style={{ fontSize: '11px', color: isUsed ? GREEN : MUTED }}>{isUsed ? 'Accepted' : 'Pending'}</div>
                            </div>
                            {!isUsed && (
                              <button onClick={function() { deleteInvite(inv.id); }} aria-label={'Cancel invite to ' + inv.org_name}
                                className="focus:outline-none focus:ring-2 focus:ring-red-500"
                                style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: RED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IconX size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {adminTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="s-name" style={labelStyle}>Board Name</label>
                <input id="s-name" type="text" value={editName} onChange={function(e) { setEditName(e.target.value); }} maxLength={80} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="s-desc" style={labelStyle}>Description</label>
                <textarea id="s-desc" value={editDesc} onChange={function(e) { setEditDesc(e.target.value); }} rows={3} maxLength={300}
                  style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.5 })} />
              </div>
              <div>
                <label htmlFor="s-theme" style={labelStyle}>Theme</label>
                <select id="s-theme" value={editTheme} onChange={function(e) { setEditTheme(e.target.value); }} style={inputStyle}>
                  {THEMES.map(function(t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="s-city" style={labelStyle}>City</label>
                  <input id="s-city" type="text" value={editCity} onChange={function(e) { setEditCity(e.target.value); }} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="s-state" style={labelStyle}>State</label>
                  <select id="s-state" value={editState} onChange={function(e) { setEditState(e.target.value); }} style={inputStyle}>
                    <option value="">Select...</option>
                    {US_STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                  </select>
                </div>
                <div>
                  <label htmlFor="s-county" style={labelStyle}>County</label>
                  <input id="s-county" type="text" value={editCounty} onChange={function(e) { setEditCounty(e.target.value); }} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="s-zip" style={labelStyle}>ZIP</label>
                  <input id="s-zip" type="text" value={editZip} onChange={function(e) { setEditZip(e.target.value); }} maxLength={10} style={inputStyle} />
                </div>
              </div>
              <div>
                <p style={Object.assign({}, labelStyle, { marginBottom: '8px' })}>Visibility</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[{ value: 'public', label: 'Public', desc: 'Appears in search', icon: IconGlobe }, { value: 'hidden', label: 'Private', desc: 'Invite only', icon: IconLock }].map(function(opt) {
                    var isSelected = editVisibility === opt.value;
                    var Ic = opt.icon;
                    return (
                      <button key={opt.value} onClick={function() { setEditVisibility(opt.value); }} aria-pressed={isSelected}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: isSelected ? 'rgba(59,130,246,0.06)' : ELEV, border: '1px solid ' + (isSelected ? 'rgba(59,130,246,0.35)' : BDR), borderRadius: '8px', cursor: 'pointer', textAlign: 'left' }}>
                        <Ic size={13} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? BLUE : TEXT }}>{opt.label}</div>
                          <div style={{ fontSize: '11px', color: MUTED }}>{opt.desc}</div>
                        </div>
                        {isSelected && <IconCheck size={13} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={handleSaveSettings} disabled={savingSettings} aria-busy={savingSettings}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{ padding: '11px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: savingSettings ? 'not-allowed' : 'pointer', opacity: savingSettings ? 0.7 : 1 }}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CommunityBoard() {
  usePatrickHand();
  var { boardId } = useParams();
  var navigate = useNavigate();

  var [board, setBoard]                   = useState(null);
  var [pageLoading, setPageLoading]       = useState(true);
  var [userOrgs, setUserOrgs]             = useState([]);
  var [userOrgIds, setUserOrgIds]         = useState([]);
  var [membership, setMembership]         = useState(null);
  var [isBoardAdmin, setIsBoardAdmin]     = useState(false);
  var [activeTab, setActiveTab]           = useState('ask');
  var [posts, setPosts]                   = useState([]);
  var [postsLoading, setPostsLoading]     = useState(false);
  var [tabCounts, setTabCounts]           = useState({});
  var [showAdminPanel, setShowAdminPanel] = useState(false);
  var [showCreate, setShowCreate]         = useState(false);
  var [editingPost, setEditingPost]       = useState(null);
  var [deletingPost, setDeletingPost]     = useState(null);
  var [actionModal, setActionModal]       = useState(null);
  var [chatState, setChatState]           = useState({ post: null, isOwn: false });
  var [unreadCounts, setUnreadCounts]     = useState({});
  var [approvedOrgIds, setApprovedOrgIds] = useState([]);

  var cfg = BOARD_CONFIG[activeTab] || BOARD_CONFIG.ask;

  useEffect(function() { loadPage(); }, [boardId]);

  async function loadPage() {
    setPageLoading(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { navigate('/login'); return; }

      var { data: memberData } = await supabase
        .from('memberships')
        .select('organization_id, organizations(id, name, logo_url)')
        .eq('member_id', authData.user.id)
        .eq('role', 'admin')
        .eq('status', 'active');
      var orgs = (memberData || []).map(function(m) { return m.organizations; });
      var ids = orgs.map(function(o) { return o.id; });
      setUserOrgs(orgs);
      setUserOrgIds(ids);

      var { data: boardData, error: be } = await supabase.from('community_boards').select('*').eq('id', boardId).single();
      if (be || !boardData) { setBoard(null); setPageLoading(false); return; }
      setBoard(boardData);

      if (ids.length > 0) {
        var { data: mems } = await supabase.from('community_board_memberships').select('id, org_id, role, status').eq('board_id', boardId).in('org_id', ids);
        var best = null;
        var rank = { approved: 3, pending: 2, invited: 2, denied: 1 };
        (mems || []).forEach(function(m) {
          if (!best || (rank[m.status] || 0) > (rank[best.status] || 0)) best = m;
        });
        setMembership(best);
        setIsBoardAdmin(!!best && best.status === 'approved' && best.role === 'admin');
        var approved = (mems || []).filter(function(m) { return m.status === 'approved'; }).map(function(m) { return m.org_id; });
setApprovedOrgIds(approved);
      }
    } catch (err) { /* silent */ }
    finally { setPageLoading(false); }
  }

  useEffect(function() {
    if (membership && membership.status === 'approved') {
      loadPosts(activeTab);
      loadTabCounts();
      loadUnreadCounts();
    }
  }, [activeTab, membership]);

  async function loadPosts(boardType) {
    setPostsLoading(true);
    try {
      var { data, error } = await supabase.from('community_board_posts').select('*').eq('board_id', boardId).eq('board_type', boardType).eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      var orgIds = [];
      (data || []).forEach(function(p) { if (p.org_id && orgIds.indexOf(p.org_id) === -1) orgIds.push(p.org_id); });
      var orgMap = {};
      if (orgIds.length > 0) {
        var { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
      }
      setPosts((data || []).map(function(p) { return Object.assign({}, p, { org_name: orgMap[p.org_id] || 'Unknown Org' }); }));
    } catch (err) { mascotErrorToast('Could not load posts.'); setPosts([]); }
    finally { setPostsLoading(false); }
  }

  async function loadTabCounts() {
    try {
      var results = await Promise.all(TABS.map(function(t) {
        return supabase.from('community_board_posts').select('id', { count: 'exact', head: true }).eq('board_id', boardId).eq('board_type', t.key).eq('is_active', true);
      }));
      var counts = {};
      TABS.forEach(function(t, i) { counts[t.key] = results[i].count || 0; });
      setTabCounts(counts);
    } catch (err) { /* silent */ }
  }

  async function loadUnreadCounts() {
    if (!userOrgIds || userOrgIds.length === 0) return;
    try {
      var { data } = await supabase
        .from('cb_post_messages')
        .select('post_id')
        .in('to_org_id', userOrgIds)
        .eq('is_read', false);
      var counts = {};
      (data || []).forEach(function(m) {
        counts[m.post_id] = (counts[m.post_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (err) { /* silent */ }
  }

  async function handleStatusChange(postId, newStatus) {
    try {
      var { error } = await supabase.from('community_board_posts').update({ status: newStatus }).eq('id', postId);
      if (error) throw error;
      setPosts(function(prev) { return prev.map(function(p) { return p.id === postId ? Object.assign({}, p, { status: newStatus }) : p; }); });
      mascotSuccessToast('Status updated.');
    } catch (err) { mascotErrorToast('Could not update status.'); }
  }

  async function handleDeleteConfirm(postId) {
    try {
      var { error } = await supabase.from('community_board_posts').update({ is_active: false }).eq('id', postId);
      if (error) throw error;
      mascotSuccessToast('Post removed.');
      setPosts(function(prev) { return prev.filter(function(p) { return p.id !== postId; }); });
      setDeletingPost(null);
      loadTabCounts();
    } catch (err) { mascotErrorToast('Could not remove post.', 'Please try again.'); }
  }

  function handleOpenChat(post) {
    var isOwn = userOrgIds.indexOf(post.org_id) !== -1;
    setChatState({ post: post, isOwn: isOwn });
  }

  function handleMarkRead(postId, count) {
    setUnreadCounts(function(prev) {
      var next = Object.assign({}, prev);
      next[postId] = Math.max(0, (next[postId] || 0) - count);
      return next;
    });
  }

  var locationStr = [board && board.city, board && board.state].filter(Boolean).join(', ');
  if (board && board.county && !board.city) locationStr = board.county + ' County' + (board.state ? ', ' + board.state : '');

  // ── Loading ──
  if (pageLoading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div aria-busy="true" aria-label="Loading board" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {[280,220,160].map(function(w,i) { return <div key={i} style={{ width: w+'px', height: '12px', background: BDR, borderRadius: '6px' }} />; })}
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!board) {
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ width: '140px', mixBlendMode: 'multiply', margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Board Not Found</h1>
          <p style={{ fontSize: '14px', color: TEXT2, marginBottom: '24px' }}>This board may have been removed or the link has expired.</p>
          <button onClick={function() { navigate('/community-board/hub'); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <IconArrowLeft size={14} />Back to Boards
          </button>
        </div>
      </main>
    );
  }

  // ── Pending ──
  if (membership && membership.status === 'pending') {
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: YELLOW }}>
            <IconClock size={26} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Request Pending</h1>
          <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, marginBottom: '8px' }}>Your request to join <strong>{board.name}</strong> is waiting for board admin approval.</p>
          <p style={{ fontSize: '13px', color: MUTED, marginBottom: '24px' }}>You will be able to participate once approved.</p>
          <button onClick={function() { navigate('/community-board/hub'); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <IconArrowLeft size={14} />Back to Boards
          </button>
        </div>
      </main>
    );
  }

  // ── No access ──
  if (!membership || membership.status === 'denied') {
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: CARD, border: '1px solid ' + BDR, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: MUTED }}>
            <IconLock size={26} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>{board.name}</h1>
          <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, marginBottom: '24px' }}>
            {membership && membership.status === 'denied'
              ? 'Your request to join this board was not approved.'
              : board.visibility === 'hidden'
                ? 'This is a private board. You need an invite to join.'
                : 'You are not a member of this board yet.'}
          </p>
          <button onClick={function() { navigate('/community-board/hub'); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            <IconArrowLeft size={14} />Back to Boards
          </button>
        </div>
      </main>
    );
  }

  // ── Main board ──
  return (
    <main style={{ background: BG, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }} aria-label={board.name + ' community board'}>

      <header style={{ background: CARD, borderBottom: '1px solid ' + BDR, padding: '20px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <button onClick={function() { navigate('/community-board/hub'); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <IconArrowLeft size={14} />All Boards
            </button>
            {isBoardAdmin && (
              <button onClick={function() { setShowAdminPanel(true); }} className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '8px', color: PURPLE, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                <IconSettings size={14} />Manage Board
              </button>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: TEXT, margin: 0 }}>{board.name}</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: board.visibility === 'hidden' ? MUTED : GREEN }}>
                {board.visibility === 'hidden' ? <IconLock size={11} /> : <IconGlobe size={11} />}
                {board.visibility === 'hidden' ? 'Private' : 'Public'}
              </span>
              {isBoardAdmin && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '99px', fontSize: '10px', fontWeight: 700, color: PURPLE }}>
                  <IconShield size={10} />Board Admin
                </span>
              )}
            </div>
            {board.description && <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: '0 0 8px' }}>{board.description}</p>}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {locationStr && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: MUTED }}><IconMapPin size={12} />{locationStr}</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: MUTED }}><IconUsers size={12} />{(board.member_count || 1) + ' ' + ((board.member_count || 1) === 1 ? 'org' : 'orgs')}</span>
              <span style={{ fontSize: '12px', color: MUTED }}>{getThemeLabel(board.theme)}</span>
            </div>
          </div>

          <nav role="tablist" aria-label="Board sections" style={{ display: 'flex', overflowX: 'auto', marginTop: '4px' }}>
            {TABS.map(function(tab) {
              var isActive = activeTab === tab.key;
              var count = tabCounts[tab.key] || 0;
              return (
                <button key={tab.key} role="tab" aria-selected={isActive} id={'tab-' + tab.key}
                  onClick={function() { setActiveTab(tab.key); }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  style={{ padding: '10px 18px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: isActive ? tab.color : MUTED, borderBottom: isActive ? '2px solid ' + tab.color : '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {tab.label}
                  {count > 0 && <span style={{ borderRadius: '99px', padding: '1px 7px', fontSize: '10px', background: isActive ? 'rgba(0,0,0,0.08)' : ELEV, color: isActive ? tab.color : MUTED }}>{count}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '13px', color: MUTED, flex: 1, margin: 0 }}>{cfg.description}</p>
          <button onClick={function() { setShowCreate(true); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <IconPlus size={13} />{cfg.buttonLabel}
          </button>
        </div>

        {postsLoading ? (
          <div aria-busy="true" aria-label="Loading posts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {[1,2,3,4,5,6].map(function(i) { return <SkeletonCard key={i} cardBg={cfg.cardBg} />; })}
          </div>
        ) : posts.length === 0 ? (
          <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '64px 32px', gap: '12px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: CARD, border: '1px solid ' + BDR, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><IconMessage size={28} /></div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: TEXT, margin: 0 }}>{cfg.emptyTitle}</h2>
            <p style={{ fontSize: '13px', color: TEXT2, maxWidth: '360px', lineHeight: 1.65, margin: 0 }}>{cfg.emptyDesc}</p>
            <button onClick={function() { setShowCreate(true); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ marginTop: '8px', padding: '10px 20px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconPlus size={13} />{cfg.buttonLabel}
            </button>
          </div>
        ) : (
          <div role="list" aria-label={cfg.label + ' posts'} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {posts.map(function(post) {
              var isOwn = userOrgIds.indexOf(post.org_id) !== -1;
              return (
                <PostCard key={post.id} post={post} config={cfg} isOwn={isOwn}
                  unreadCount={unreadCounts[post.id] || 0}
                  onAction={function(p, type) { setActionModal({ post: p, type: type }); }}
                  onEdit={function(p) { setEditingPost(p); }}
                  onDelete={function(p) { setDeletingPost(p); }}
                  onStatusChange={handleStatusChange}
                  onOpenChat={handleOpenChat}
                />
              );
            })}
          </div>
        )}
      </div>

      {(showCreate || editingPost) && (
        <PostModal boardId={boardId} boardType={activeTab} config={cfg} userOrgs={userOrgs} editingPost={editingPost || null}
          onClose={function() { setShowCreate(false); setEditingPost(null); }}
          onSuccess={function() { loadPosts(activeTab); loadTabCounts(); }} />
      )}
      {deletingPost && (
        <DeleteConfirmModal post={deletingPost} onConfirm={handleDeleteConfirm} onCancel={function() { setDeletingPost(null); }} />
      )}
      {actionModal && (
        <ActionModal post={actionModal.post} actionType={actionModal.type} config={cfg} userOrgs={userOrgs} boardName={board.name} approvedOrgIds={approvedOrgIds} s
          onClose={function() { setActionModal(null); }}
          onSuccess={function() { loadPosts(activeTab); }} />
      )}
      {showAdminPanel && (
        <AdminPanel board={board} boardId={boardId}
          onClose={function() { setShowAdminPanel(false); }}
          onMembershipChange={function() { loadPage(); }}
          onSettingsChange={function() { loadPage(); setShowAdminPanel(false); }} />
      )}
      {chatState.post && (
        <PostChatPanel
          post={chatState.post}
          isOwn={chatState.isOwn}
          userOrgs={userOrgs}
          boardName={board.name}
          onClose={function() { setChatState({ post: null, isOwn: false }); }}
          onMarkRead={handleMarkRead}
          approvedOrgIds={approvedOrgIds}
        />
      )}
    </main>
  );
}