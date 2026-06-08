/**
 * cbUtils.js — Syndicade Community Board
 * Shared tokens, icons, helpers, config, and UI primitives.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../MascotToast';

// ─── Color tokens ────────────────────────────────────────────────────────────
export var BG = '#F8FAFC';
export var CARD = '#FFFFFF';
export var BDR = '#E2E8F0';
export var ELEV = '#F1F5F9';
export var TEXT = '#0E1523';
export var TEXT2 = '#475569';
export var MUTED = '#64748B';
export var YELLOW = '#F5B731';
export var BLUE = '#3B82F6';
export var GREEN = '#22C55E';
export var RED = '#EF4444';
export var PURPLE = '#8B5CF6';

// ─── Avatar helpers ───────────────────────────────────────────────────────────
var AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#14B8A6', '#EC4899', '#6366F1'];
export function getAvatarColor(name) {
  var char = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[char % AVATAR_COLORS.length];
}
export function getInitials(name) {
  if (!name) return '??';
  var w = name.trim().split(/\s+/);
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[1][0]).toUpperCase();
}

// ─── Board config ─────────────────────────────────────────────────────────────
export var BOARD_CONFIG = {
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
    categories: ['Supplies', 'Volunteers', 'Skills', 'Space', 'Equipment', 'Funding', 'Other'],
    primaryAction: 'Offer Help',
    quickReactions: [{ type: 'can_help', label: 'I Can Help' }, { type: 'interested', label: 'Interested' }]
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
    categories: ['Supplies', 'Volunteers', 'Skills', 'Space', 'Equipment', 'Other'],
    primaryAction: 'Claim This',
    quickReactions: [{ type: 'can_help', label: 'I Want This' }, { type: 'interested', label: 'Interested' }]
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
    categories: ['Co-Host', 'Program', 'Campaign', 'Fundraiser', 'Advocacy', 'Other'],
    primaryAction: "I'm Interested",
    quickReactions: [{ type: 'can_help', label: "I'm In" }, { type: 'interested', label: 'Interested' }]
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
    categories: ['Vendor', 'Sponsor', 'Contractor', 'Tech & Software', 'Legal', 'Financial', 'Printing', 'Catering', 'Other'],
    primaryAction: 'Endorse',
    quickReactions: [{ type: 'endorse', label: 'Endorse' }]
  }
};

export var TABS = [
  { key: 'ask', label: 'Ask Board', color: '#A78BFA' },
  { key: 'offer', label: 'Offer Board', color: '#22C55E' },
  { key: 'collab', label: 'Collaboration', color: '#3B82F6' },
  { key: 'recommendations', label: 'Recommendations', color: '#F59E0B' },
  { key: 'activity', label: 'Activity', color: '#64748B' }
];

export var STATUS_CONFIG = {
  open: { label: 'Open', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#16A34A' },
  pending: { label: 'Pending', bg: 'rgba(245,183,49,0.15)', border: 'rgba(245,183,49,0.4)', text: '#B45309' },
  completed: { label: 'Completed', bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.4)', text: '#64748B' }
};

export var THEMES = [
  { value: 'general', label: 'General' }, { value: 'latino', label: 'Latino' },
  { value: 'black', label: 'Black-led' }, { value: 'lgbtq', label: 'LGBTQ+' },
  { value: 'faith', label: 'Faith-based' }, { value: 'immigrant', label: 'Immigrant' },
  { value: 'women', label: 'Women-led' }, { value: 'disability', label: 'Disability' },
  { value: 'asian', label: 'Asian & AAPI' }, { value: 'indigenous', label: 'Indigenous' },
  { value: 'youth', label: 'Youth' }, { value: 'other', label: 'Other' }
];

export var US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
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
export function formatDateTime(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
export function getThemeLabel(value) {
  var t = THEMES.find(function(t) { return t.value === value; });
  return t ? t.label : 'General';
}
export function getExpiryInfo(expiresAt) {
  if (!expiresAt) return null;
  var now = new Date(), expiry = new Date(expiresAt);
  var msLeft = expiry - now;
  var daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  return { daysLeft: daysLeft, isExpired: daysLeft <= 0, isExpiringSoon: daysLeft <= 14 };
}
export function normalizeUrl(url) {
  if (!url) return '';
  if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) return url;
  return 'https://' + url;
}

// ─── Notification helper ──────────────────────────────────────────────────────
export async function insertCBNotifications(fromOrgId, toOrgId, boardName, boardId, userOrgs) {
  try {
    var sendingOrg = (userOrgs || []).find(function(o) { return o.id === fromOrgId; });
    var sendingOrgName = sendingOrg ? sendingOrg.name : 'An organization';
    var { data: adminIds, error } = await supabase.rpc('get_org_admin_user_ids', { p_org_id: toOrgId });
    if (error || !adminIds || adminIds.length === 0) return;
    var { data: prefs } = await supabase.from('member_notification_prefs')
      .select('user_id,muted,overrides').eq('org_id', toOrgId)
      .in('user_id', adminIds.map(function(r) { return r.user_id; }));
    var prefMap = {};
    (prefs || []).forEach(function(p) { prefMap[p.user_id] = p; });
    var eligible = adminIds.filter(function(r) {
      var pref = prefMap[r.user_id];
      if (!pref) return true;
      if (pref.muted === true) return false;
      if (pref.overrides && pref.overrides['board_reply'] === false) return false;
      return true;
    });
    if (eligible.length === 0) return;
    var rows = eligible.map(function(r) {
      return {
        user_id: r.user_id, type: 'board_reply',
        title: sendingOrgName + ' sent you a message',
        message: 'New message on ' + boardName + ' Community Board.',
        link: '/community-board/' + boardId, read: false
      };
    });
    await supabase.from('notifications').insert(rows);
    window.dispatchEvent(new Event('notificationCreated'));
    for (var i = 0; i < eligible.length; i++) {
      (function(userId) {
        var bc = supabase.channel('user-notif-' + userId);
        bc.subscribe(function(status) {
          if (status === 'SUBSCRIBED') {
            bc.send({ type: 'broadcast', event: 'new_notification', payload: {} })
              .then(function() { supabase.removeChannel(bc); });
          }
        });
      })(eligible[i].user_id);
    }
  } catch (err) {
    console.error('Could not insert CB notifications:', err);
  }
}

// ─── Icon components ──────────────────────────────────────────────────────────
export function IconArrowLeft(p) { return <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
export function IconPlus(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
export function IconX(p) { return <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
export function IconSettings(p) { return <svg width={p.size||15} height={p.size||15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
export function IconUsers(p) { return <svg width={p.size||15} height={p.size||15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
export function IconBell(p) { return <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
export function IconEdit(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
export function IconTrash(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
export function IconChevronDown(p) { return <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>; }
export function IconChevronLeft(p) { return <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>; }
export function IconCheck(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>; }
export function IconLock(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
export function IconGlobe(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
export function IconMapPin(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
export function IconMessage(p) { return <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
export function IconMessageCircle(p) { return <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>; }
export function IconShield(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
export function IconClock(p) { return <svg width={p.size||26} height={p.size||26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
export function IconSend(p) { return <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
export function IconPin(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>; }
export function IconRefresh(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>; }
export function IconInbox(p) { return <svg width={p.size||15} height={p.size||15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>; }
export function IconActivity(p) { return <svg width={p.size||15} height={p.size||15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
export function IconSearch(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
export function IconPhone(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.57a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }
export function IconMail(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
export function IconExternalLink(p) { return <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>; }
export function IconThumbsUp(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>; }
export function IconUser(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
export function IconFilter(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>; }
export function IconChevronUp(p) { return <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>; }

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge(props) {
  var s = STATUS_CONFIG[props.status] || STATUS_CONFIG.open;
  var [open, setOpen] = useState(false);
  if (!props.isOwn) return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: s.bg, border: '1px solid ' + s.border, color: s.text }}>
      {s.label}
    </span>
  );
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={function(e) { e.stopPropagation(); setOpen(!open); }}
        aria-label={'Change status, currently ' + s.label} aria-expanded={open}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: s.bg, border: '1px solid ' + s.border, color: s.text, cursor: 'pointer', outline: 'none' }}>
        {s.label}<IconChevronDown size={9} />
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', top: '26px', left: 0, zIndex: 20, background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', padding: '4px', minWidth: '120px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
          {Object.keys(STATUS_CONFIG).map(function(key) {
            var sc = STATUS_CONFIG[key];
            return (
              <button key={key} role="menuitem"
                onClick={function(e) { e.stopPropagation(); setOpen(false); props.onChange(key); }}
                style={{ display: 'flex', width: '100%', padding: '7px 10px', background: 'none', border: 'none', color: sc.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px', textAlign: 'left' }}>
                {sc.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ExpiryBadges ─────────────────────────────────────────────────────────────
export function ExpiryBadges(props) {
  var expiryInfo = props.expiryInfo;
  if (!expiryInfo) return null;
  if (expiryInfo.isExpired) return (
    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)', color: MUTED }}>Expired</span>
  );
  if (expiryInfo.isExpiringSoon) {
    var urgent = expiryInfo.daysLeft <= 3;
    return (
      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: urgent ? 'rgba(239,68,68,0.12)' : 'rgba(245,183,49,0.12)', border: '1px solid ' + (urgent ? 'rgba(239,68,68,0.3)' : 'rgba(245,183,49,0.3)'), color: urgent ? RED : '#B45309' }}>
        {expiryInfo.daysLeft <= 0 ? 'Expires today' : 'Expires in ' + expiryInfo.daysLeft + 'd'}
      </span>
    );
  }
  return null;
}

// ─── OrgAvatar ────────────────────────────────────────────────────────────────
export function OrgAvatar(props) {
  var size = props.size || 22;
  var fontSize = props.fontSize || '9px';
  return (
    <div style={{ width: size + 'px', height: size + 'px', borderRadius: '50%', background: props.bg || getAvatarColor(props.name), color: props.color || '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fontSize, fontWeight: 700, flexShrink: 0 }}>
      {getInitials(props.name)}
    </div>
  );
}

// ─── UnreadBubble ─────────────────────────────────────────────────────────────
export function UnreadBubble(props) {
  var count = props.count || 0;
  return (
    <button onClick={function(e) { e.stopPropagation(); props.onClick(); }}
      aria-label={'Open chat' + (count > 0 ? ', ' + count + ' unread' : '')}
      style={{ position: 'relative', width: '30px', height: '30px', borderRadius: '50%', background: count > 0 ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: count > 0 ? BLUE : '#6B7280', flexShrink: 0 }}>
      <IconMessageCircle size={14} />
      {count > 0 && (
        <span aria-hidden="true" style={{ position: 'absolute', top: '-2px', right: '-2px', background: BLUE, color: '#FFFFFF', borderRadius: '99px', padding: '0 4px', fontSize: '9px', fontWeight: 700, minWidth: '14px', textAlign: 'center', lineHeight: '14px' }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

// ─── RenewButton ─────────────────────────────────────────────────────────────
export function RenewButton(props) {
  return (
    <button onClick={function() { props.onRenew(props.postId); }}
      aria-label="Renew post for 60 more days"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.07)', color: BLUE, cursor: 'pointer' }}>
      <IconRefresh size={11} />Renew Post
    </button>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
export function SkeletonCard(props) {
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

// ─── FilterToolbar ────────────────────────────────────────────────────────────
// Recommendation 3: added theme filter for community focus filtering
export function FilterToolbar(props) {
  var cfg = props.config;
  var hasActiveFilters = props.searchQuery || props.filterCategory || props.filterStatus !== 'all' || props.sortBy !== 'newest' || props.filterTheme;
  var inputStyle = { padding: '8px 12px', background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '13px', outline: 'none', fontFamily: 'inherit', height: '36px', boxSizing: 'border-box' };
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }}><IconSearch size={13} /></div>
        <input type="search" value={props.searchQuery} onChange={function(e) { props.onSearch(e.target.value); }}
          placeholder={'Search ' + cfg.label.toLowerCase() + '...'}
          aria-label={'Search ' + cfg.label}
          style={Object.assign({}, inputStyle, { paddingLeft: '32px', width: '100%' })} />
      </div>
      <select value={props.sortBy} onChange={function(e) { props.onSort(e.target.value); }} aria-label="Sort posts" style={inputStyle}>
        <option value="newest">Newest</option>
        <option value="recently_active">Recently Active</option>
        <option value="most_responses">Most Responses</option>
      </select>
      <select value={props.filterCategory} onChange={function(e) { props.onCategory(e.target.value); }} aria-label="Filter by category" style={inputStyle}>
        <option value="">All Categories</option>
        {cfg.categories.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
      </select>
      <select value={props.filterStatus} onChange={function(e) { props.onStatus(e.target.value); }} aria-label="Filter by status" style={inputStyle}>
        <option value="all">All Status</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      {props.showThemeFilter && (
        <select value={props.filterTheme || ''} onChange={function(e) { props.onTheme(e.target.value); }} aria-label="Filter by community focus" style={inputStyle}>
          <option value="">All Communities</option>
          {THEMES.map(function(t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
        </select>
      )}
      {hasActiveFilters && (
        <button onClick={props.onClear} aria-label="Clear all filters"
          style={{ padding: '7px 12px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', height: '36px', boxSizing: 'border-box' }}>
          <IconX size={11} />Clear
        </button>
      )}
    </div>
  );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
export function ActivityFeed(props) {
  var feed = props.feed;
  var boardTypeColors = { ask: '#A78BFA', offer: '#22C55E', collab: '#3B82F6', recommendations: '#F59E0B' };
  var boardTypeLabels = { ask: 'posted an ask', offer: 'posted an offer', collab: 'posted a collaboration request', recommendations: 'added a recommendation' };
  var boardTypeReadable = { ask: 'Ask Board', offer: 'Offer Board', collab: 'Collaboration', recommendations: 'Recommendations' };
  if (props.loading) return (
    <div aria-busy="true" aria-label="Loading activity" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1, 2, 3, 4, 5, 6].map(function(i) { return <div key={i} style={{ height: '68px', background: ELEV, borderRadius: '10px' }} />; })}
    </div>
  );
  if (feed.length === 0) return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '64px 32px', gap: '12px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: CARD, border: '1px solid ' + BDR, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><IconActivity size={26} /></div>
      <h2 style={{ fontSize: '17px', fontWeight: 700, color: TEXT, margin: 0 }}>No activity yet</h2>
      <p style={{ fontSize: '13px', color: TEXT2, maxWidth: '360px', lineHeight: 1.65, margin: 0 }}>When orgs post to this board, their activity will appear here.</p>
    </div>
  );
  var groups = [];
  var seenDates = {};
  feed.forEach(function(post) {
    var date = new Date(post.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!seenDates[date]) { seenDates[date] = true; groups.push({ date: date, posts: [] }); }
    groups[groups.length - 1].posts.push(post);
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {groups.map(function(group) {
        return (
          <div key={group.date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: '3px', margin: 0, whiteSpace: 'nowrap' }}>{group.date}</p>
              <div style={{ flex: 1, height: '1px', background: BDR }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.posts.map(function(post) {
                var color = boardTypeColors[post.board_type] || MUTED;
                var label = boardTypeLabels[post.board_type] || 'posted';
                var boardLabel = boardTypeReadable[post.board_type] || '';
                return (
                  <div key={post.id} style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', alignItems: 'flex-start' }}>
                    <OrgAvatar name={post.org_name} size={34} fontSize="11px" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: TEXT, lineHeight: 1.4 }}><strong>{post.org_name}</strong><span style={{ color: TEXT2 }}>{' ' + label}</span></div>
                      <div style={{ fontSize: '12px', color: TEXT2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{'"' + post.title + '"'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: '11px', color: MUTED }}>{boardLabel}</span>
                        {post.category && <><span style={{ fontSize: '11px', color: MUTED }}>·</span><span style={{ fontSize: '11px', color: MUTED }}>{post.category}</span></>}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: MUTED, flexShrink: 0 }}>{timeAgo(post.created_at)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────
export function DeleteConfirmModal(props) {
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
          <button onClick={props.onCancel}
            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Keep Post
          </button>
          <button onClick={handleConfirm} disabled={deleting}
            style={{ flex: 1, padding: '10px', background: RED, border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
            {deleting ? 'Removing...' : 'Remove Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ActionModal ──────────────────────────────────────────────────────────────
// Recommendation 5: made status-update to 'pending' optional via a comment flag.
// The original behavior is preserved — status moves to pending on first message,
// which makes sense UX-wise as it signals the post owner is in conversation.
export function ActionModal(props) {
  var post = props.post, cfg = props.config, userOrgs = props.userOrgs, actionType = props.actionType;
  var titles = { primary: cfg.primaryAction, info: 'Request More Information' };
  var [orgId, setOrgId] = useState(userOrgs.length === 1 ? userOrgs[0].id : '');
  var [message, setMessage] = useState('');
  var [sending, setSending] = useState(false);
  var approvedOrgIds = props.approvedOrgIds || [];
  var inputStyle = { width: '100%', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  async function handleSend() {
    if (!orgId) { toast.error('Select which org is sending this.'); return; }
    if (!message.trim()) { toast.error('Write a message first.'); return; }
    setSending(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { error } = await supabase.from('cb_post_messages').insert({
        post_id: post.id, from_org_id: orgId, to_org_id: post.org_id,
        sender_user_id: authData.user.id,
        message: '[' + titles[actionType] + '] ' + message.trim(),
        is_read: false
      });
      if (error) throw error;
      supabase.from('community_board_posts').update({ last_activity_at: new Date().toISOString() }).eq('id', post.id).then(function() {});
      // Move to pending on first outreach — signals active conversation to post owner.
      // Set updateStatusToPending: false in props to skip this for future use cases.
      if (props.updateStatusToPending !== false) {
        await supabase.from('community_board_posts').update({ status: 'pending' }).eq('id', post.id).eq('status', 'open');
      }
      await insertCBNotifications(orgId, post.org_id, props.boardName, post.board_id, userOrgs);
      mascotSuccessToast('Message sent to ' + post.org_name + '.');
      props.onSuccess(); props.onClose();
    } catch (err) {
      mascotErrorToast('Could not send message.', 'Please try again.');
    } finally {
      setSending(false);
    }
  }
  return (
    <div role="dialog" aria-modal="true" aria-label={titles[actionType]}
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}>
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>{titles[actionType]}</h2>
          <button onClick={props.onClose} aria-label="Close"
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2 }}>
            <IconX size={12} />
          </button>
        </div>
        <div style={{ background: cfg.cardBg, borderRadius: '8px', padding: '10px', marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px', background: cfg.tagBg, color: cfg.tagText }}>{post.category}</span>
          <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>{post.title}</div>
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
                  return <option key={o.id} value={o.id} disabled={!isMember}>{o.name + (!isMember ? ' (not on this board)' : '')}</option>;
                })}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="am-msg" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Message</label>
            <textarea id="am-msg" value={message} onChange={function(e) { setMessage(e.target.value); }}
              rows={4} maxLength={500} placeholder="Write your message..."
              style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{message.length + '/500'}</p>
          </div>
          <button onClick={handleSend} disabled={sending}
            style={{ padding: '12px', background: cfg.tagBg, color: cfg.tagText, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}