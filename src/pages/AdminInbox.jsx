import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

function IconInbox({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  );
}
function IconMessage({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function IconUsers({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconHandshake({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l1.06 1.06L12 21.23l7.77-7.94 1.06-1.06a5.4 5.4 0 000-7.65z" />
    </svg>
  );
}
function IconMail({ size }) {
  return (
    <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconCircle({ size }) {
  return <svg width={size || 8} height={size || 8} viewBox="0 0 8 8" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="4" /></svg>;
}
function IconCheck({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconCalendar({ size }) {
  return (
    <svg width={size || 14} height={size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconArrowIn({ size }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="17 8 21 12 17 16" /><line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}
function IconArrowOut({ size }) {
  return (
    <svg width={size || 12} height={size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="7 16 3 12 7 8" /><line x1="21" y1="12" x2="3" y2="12" />
    </svg>
  );
}
function IconX({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconSend({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function IconChat({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <line x1="9" y1="10" x2="15" y2="10" /><line x1="9" y1="14" x2="13" y2="14" />
    </svg>
  );
}
function IconSearch({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconArchive({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}
function IconCheckAll({ size }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" /><polyline points="16 6 12 10" />
    </svg>
  );
}

// ── Light theme tokens ────────────────────────────────────────────────────────
var t = {
  bgPage:        '#F8FAFC',
  bgHeader:      '#FFFFFF',
  bgCard:        '#FFFFFF',
  bgElevated:    '#F1F5F9',
  bgSecondary:   '#F1F5F9',
  bgInput:       '#FFFFFF',
  bgChatBox:     '#F8FAFC',
  border:        '#E2E8F0',
  textPrimary:   '#0E1523',
  textSecondary: '#475569',
  textMuted:     '#64748B',
  textTertiary:  '#94A3B8',
  selectedBg:    '#EFF6FF',
  unreadBg:      'rgba(59,130,246,0.04)',
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
function SkeletonList() {
  return (
    <div aria-label="Loading messages" aria-busy="true">
      {[1, 2, 3, 4].map(function(i) {
        return (
          <div key={i} style={{ padding: '16px', borderBottom: '1px solid ' + t.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: t.border }} className="animate-pulse" />
              <div>
                <div style={{ width: '120px', height: '12px', background: t.border, borderRadius: '4px', marginBottom: '6px' }} className="animate-pulse" />
                <div style={{ width: '80px', height: '10px', background: t.bgElevated, borderRadius: '4px' }} className="animate-pulse" />
              </div>
            </div>
            <div style={{ width: '90%', height: '10px', background: t.bgElevated, borderRadius: '4px' }} className="animate-pulse" />
          </div>
        );
      })}
    </div>
  );
}

function SkeletonChat() {
  return (
    <div aria-label="Loading chat" aria-busy="true" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1, 2, 3].map(function(i) {
        var isRight = i % 2 === 0;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '60%' }}>
              <div style={{ width: '60px', height: '9px', background: t.border, borderRadius: '4px', marginBottom: '5px', marginLeft: isRight ? 'auto' : '0' }} className="animate-pulse" />
              <div style={{ height: '36px', background: t.bgElevated, borderRadius: '10px', width: '180px' }} className="animate-pulse" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, description }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: t.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: t.textTertiary }}>
        {icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: t.textPrimary, marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: t.textTertiary, maxWidth: '260px', lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var now = new Date();
  var diff = now - d;
  var mins = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  if (hours < 24) return hours + 'h ago';
  if (days < 7) return days + 'd ago';
  return d.toLocaleDateString();
}

function formatChatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var now = new Date();
  var isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatEventDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getInitials(name) {
  if (!name) return '?';
  var parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

var STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: 'rgba(245,183,49,0.12)',  border: 'rgba(245,183,49,0.3)',  color: '#F5B731' },
  accepted:  { label: 'Accepted',  bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   color: '#22C55E' },
  declined:  { label: 'Declined',  bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   color: '#EF4444' },
  withdrawn: { label: 'Withdrawn', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', color: '#64748B' },
};

function StatusBadge({ status }) {
  var cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: cfg.bg, border: '1px solid ' + cfg.border, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminInbox({ organizationId: propOrgId }) {
  var { organizationId: paramOrgId } = useParams();
  var orgId = propOrgId || paramOrgId;

  var [activeTab, setActiveTab] = useState('inquiries');

  // Inquiries
  var [inquiries, setInquiries]         = useState([]);
  var [loading, setLoading]             = useState(true);
  var [selected, setSelected]           = useState(null);
  var [markingRead, setMarkingRead]     = useState(false);
  var [markingAllRead, setMarkingAllRead] = useState(false);
  var [archivingId, setArchivingId]     = useState(null);

  // Inquiry filters
  var [searchQuery, setSearchQuery]     = useState('');
  var [archiveFilter, setArchiveFilter] = useState('active'); // 'active' | 'archived'

  // Collaboration
  var [collabItems, setCollabItems]                       = useState([]);
  var [collabLoading, setCollabLoading]                   = useState(false);
  var [selectedCollab, setSelectedCollab]                 = useState(null);
  var [collabRespondExpanded, setCollabRespondExpanded]   = useState(false);
  var [collabRespondAction, setCollabRespondAction]       = useState(null);
  var [collabRespondMessage, setCollabRespondMessage]     = useState('');
  var [collabActionLoading, setCollabActionLoading]       = useState(false);
  var [currentOrgName, setCurrentOrgName]                 = useState('');

  // Chat
  var [chatMessages, setChatMessages]   = useState([]);
  var [chatLoading, setChatLoading]     = useState(false);
  var [chatInput, setChatInput]         = useState('');
  var [chatSending, setChatSending]     = useState(false);
  var chatChannelRef                    = useRef(null);

  // Unread tracking
  var [latestMsgMap, setLatestMsgMap]   = useState({});
  var lastVisitedMapRef                 = useRef({});
  var prevMsgCountRef                   = useRef(0);
  var selectedCollabIdRef               = useRef(null);
  var hasDispatchedRef                  = useRef(false);

  useEffect(function() {
    selectedCollabIdRef.current = selectedCollab ? selectedCollab.id : null;
  }, [selectedCollab]);

  // ── Derived counts ────────────────────────────────────────────────────────
  var activeInquiries  = inquiries.filter(function(i) { return !i.is_archived; });
  var unreadCount      = activeInquiries.filter(function(i) { return !i.is_read; }).length;
  var pendingCollabCount   = collabItems.filter(function(c) { return c.direction === 'incoming' && c.status === 'pending'; }).length;

  function isUnread(item) {
    var latest = latestMsgMap[item.id];
    if (!latest) return false;
    if (latest.sender_org_id === orgId) return false;
    var lastVisited = lastVisitedMapRef.current[item.id];
    if (!lastVisited) return true;
    return latest.created_at > lastVisited;
  }

  var unreadCollabCount = collabItems.filter(function(c) { return isUnread(c); }).length;

  // ── Filtered inquiry list ─────────────────────────────────────────────────
  var displayedInquiries = inquiries.filter(function(inq) {
    var isArchived = inq.is_archived || false;
    if (archiveFilter === 'active' && isArchived) return false;
    if (archiveFilter === 'archived' && !isArchived) return false;
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      return (
        (inq.name || '').toLowerCase().indexOf(q) !== -1 ||
        (inq.email || '').toLowerCase().indexOf(q) !== -1 ||
        (inq.message || '').toLowerCase().indexOf(q) !== -1
      );
    }
    return true;
  });

  var sortedCollabItems = collabItems.slice().sort(function(a, b) {
    var aU = isUnread(a), bU = isUnread(b);
    if (aU && !bU) return -1;
    if (!aU && bU) return 1;
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    var aTime = latestMsgMap[a.id] ? latestMsgMap[a.id].created_at : a.created_at;
    var bTime = latestMsgMap[b.id] ? latestMsgMap[b.id].created_at : b.created_at;
    return new Date(bTime) - new Date(aTime);
  });

  // ── Chat scroll ───────────────────────────────────────────────────────────
  useEffect(function() {
    if (chatMessages.length > prevMsgCountRef.current) {
      prevMsgCountRef.current = chatMessages.length;
      var container = document.getElementById('chat-scroll-container');
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(function() {
    var collabId     = selectedCollab ? selectedCollab.id : null;
    var collabStatus = selectedCollab ? selectedCollab.status : null;
    var chatActive   = collabStatus === 'accepted' || collabStatus === 'pending';

    if (chatChannelRef.current) { clearInterval(chatChannelRef.current); chatChannelRef.current = null; }
    if (!collabId) { setChatMessages([]); prevMsgCountRef.current = 0; return; }

    lastVisitedMapRef.current[collabId] = new Date().toISOString();
    prevMsgCountRef.current = 0;
    fetchChatMessages(collabId);

    if (!chatActive) return;

    chatChannelRef.current = setInterval(function() { fetchChatMessages(collabId); }, 4000);
    return function() { if (chatChannelRef.current) { clearInterval(chatChannelRef.current); chatChannelRef.current = null; } };
  }, [selectedCollab ? selectedCollab.id : null, selectedCollab ? selectedCollab.status : null]);

  useEffect(function() {
    if (!orgId || collabItems.length === 0) return;

    function checkAllCollabs() {
      var ids = collabItems
        .filter(function(c) { return c.status === 'accepted' || c.status === 'pending'; })
        .map(function(c) { return c.id; });
      if (ids.length === 0) return;
      supabase
        .from('collab_messages')
        .select('collaborator_id, sender_org_id, created_at')
        .in('collaborator_id', ids)
        .order('created_at', { ascending: false })
        .then(function(res) {
          if (!res.data) return;
          var newMap = {};
          res.data.forEach(function(msg) {
            if (!newMap[msg.collaborator_id]) {
              newMap[msg.collaborator_id] = { created_at: msg.created_at, sender_org_id: msg.sender_org_id };
            }
          });
          setLatestMsgMap(function(prev) { return Object.assign({}, prev, newMap); });
        });
    }

    checkAllCollabs();
    var bgInterval = setInterval(checkAllCollabs, 10000);
    return function() { clearInterval(bgInterval); };
  }, [orgId, activeTab, collabItems.length]);

  async function fetchChatMessages(collabId) {
    try {
      var { data, error } = await supabase
        .from('collab_messages').select('*').eq('collaborator_id', collabId).order('created_at', { ascending: true });
      if (error) throw error;
      var msgs = data || [];
      if (msgs.length > 0) {
        var latest = msgs[msgs.length - 1];
        setLatestMsgMap(function(prev) {
          return Object.assign({}, prev, { [collabId]: { created_at: latest.created_at, sender_org_id: latest.sender_org_id } });
        });
      }
      if (collabId === selectedCollabIdRef.current) {
        lastVisitedMapRef.current[collabId] = new Date().toISOString();
      }
      setChatMessages(function(prev) {
        var optimistic = prev.filter(function(m) { return m._optimistic; });
        return msgs.concat(optimistic);
      });
    } catch (err) {
      // silent on poll
    } finally {
      setChatLoading(false);
    }
  }

  async function sendChatMessage() {
    var text = chatInput.trim();
    if (!text || !selectedCollab || chatSending) return;
    setChatSending(true);
    setChatInput('');

    var { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated.'); setChatSending(false); return; }

    var optimistic = {
      id: 'optimistic-' + Date.now(),
      collaborator_id: selectedCollab.id,
      sender_org_id: orgId,
      sender_user_id: user.id,
      message: text,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setChatMessages(function(prev) { return prev.concat([optimistic]); });
    lastVisitedMapRef.current[selectedCollab.id] = new Date().toISOString();

    try {
      var { data, error } = await supabase
        .from('collab_messages')
        .insert({ collaborator_id: selectedCollab.id, sender_org_id: orgId, sender_user_id: user.id, message: text })
        .select().single();
      if (error) throw error;
      setChatMessages(function(prev) {
        return prev.filter(function(m) { return m.id !== optimistic.id; }).concat([data]);
      });
    } catch (err) {
      setChatMessages(function(prev) { return prev.filter(function(m) { return m.id !== optimistic.id; }); });
      setChatInput(text);
      toast.error('Failed to send message.');
    } finally {
      setChatSending(false);
    }
  }

  function handleChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  }

  useEffect(function() { if (orgId) fetchInquiries(); }, [orgId]);
  useEffect(function() { if (orgId) fetchCollabData(); }, [orgId]);
  useEffect(function() { if (orgId && activeTab === 'collab' && collabItems.length === 0) fetchCollabData(); }, [activeTab]);

  useEffect(function() {
    var total = unreadCount + unreadCollabCount;
    if (total > 0 || hasDispatchedRef.current) {
      hasDispatchedRef.current = true;
      window.dispatchEvent(new CustomEvent('inboxUnreadUpdate', { detail: { total: total } }));
    }
  }, [unreadCount, unreadCollabCount]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  async function fetchInquiries() {
    setLoading(true);
    var { data, error } = await supabase
      .from('contact_inquiries')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load inquiries');
    } else {
      setInquiries(data || []);
      // Auto-select first active inquiry
      var firstActive = (data || []).find(function(i) { return !i.is_archived; });
      if (firstActive && !selected) setSelected(firstActive);
    }
    setLoading(false);
  }

  async function fetchCollabData() {
    setCollabLoading(true);
    try {
      var orgRes = await supabase.from('organizations').select('id, name').eq('id', orgId).single();
      if (orgRes.data) setCurrentOrgName(orgRes.data.name);

      var { data: incoming } = await supabase.from('event_collaborators').select('*').eq('host_org_id', orgId).order('created_at', { ascending: false });
      var { data: outgoing } = await supabase.from('event_collaborators').select('*').eq('requesting_org_id', orgId).order('created_at', { ascending: false });

      var allRows = [];
      if (incoming) incoming.forEach(function(r) { allRows.push(Object.assign({}, r, { direction: 'incoming' })); });
      if (outgoing) outgoing.forEach(function(r) { allRows.push(Object.assign({}, r, { direction: 'outgoing' })); });
      if (allRows.length === 0) { setCollabItems([]); setCollabLoading(false); return; }

      var eventIds = allRows.map(function(r) { return r.event_id; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
      var eventsRes = await supabase.from('events').select('id, title, start_time, location').in('id', eventIds);
      var eventMap = {};
      if (eventsRes.data) eventsRes.data.forEach(function(e) { eventMap[e.id] = e; });

      var otherOrgIds = [];
      allRows.forEach(function(r) {
        var otherId = r.direction === 'incoming' ? r.requesting_org_id : r.host_org_id;
        if (otherOrgIds.indexOf(otherId) === -1) otherOrgIds.push(otherId);
      });
      var orgsRes = await supabase.from('organizations').select('id, name, logo_url').in('id', otherOrgIds);
      var orgMap = {};
      if (orgsRes.data) orgsRes.data.forEach(function(o) { orgMap[o.id] = o; });

      var enriched = allRows.map(function(r) {
        var otherId = r.direction === 'incoming' ? r.requesting_org_id : r.host_org_id;
        return Object.assign({}, r, { event: eventMap[r.event_id] || null, other_org: orgMap[otherId] || null });
      });

      enriched.sort(function(a, b) {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setCollabItems(enriched);
      if (!selectedCollab && enriched.length > 0) setSelectedCollab(enriched[0]);

      var collabIds = enriched.map(function(r) { return r.id; });
      if (collabIds.length > 0) {
        var { data: latestMsgs } = await supabase
          .from('collab_messages').select('collaborator_id, sender_org_id, created_at')
          .in('collaborator_id', collabIds).order('created_at', { ascending: false });
        if (latestMsgs) {
          var latestMap = {};
          latestMsgs.forEach(function(msg) {
            if (!latestMap[msg.collaborator_id]) {
              latestMap[msg.collaborator_id] = { created_at: msg.created_at, sender_org_id: msg.sender_org_id };
            }
          });
          setLatestMsgMap(latestMap);
        }
      }
    } catch (err) {
      toast.error('Failed to load collaboration requests');
    } finally {
      setCollabLoading(false);
    }
  }

  // ── Inquiry actions ───────────────────────────────────────────────────────
  async function handleSelect(inquiry) {
    setSelected(inquiry);
    if (!inquiry.is_read) {
      var { error } = await supabase.from('contact_inquiries').update({ is_read: true }).eq('id', inquiry.id);
      if (!error) {
        setInquiries(function(prev) { return prev.map(function(i) { return i.id === inquiry.id ? Object.assign({}, i, { is_read: true }) : i; }); });
        setSelected(Object.assign({}, inquiry, { is_read: true }));
      }
    }
  }

  async function handleMarkUnread() {
    if (!selected) return;
    setMarkingRead(true);
    var { error } = await supabase.from('contact_inquiries').update({ is_read: false }).eq('id', selected.id);
    if (error) { toast.error('Failed to update'); }
    else {
      setInquiries(function(prev) { return prev.map(function(i) { return i.id === selected.id ? Object.assign({}, i, { is_read: false }) : i; }); });
      setSelected(Object.assign({}, selected, { is_read: false }));
    }
    setMarkingRead(false);
  }

  async function handleMarkAllRead() {
    var unreadIds = activeInquiries.filter(function(i) { return !i.is_read; }).map(function(i) { return i.id; });
    if (unreadIds.length === 0) return;
    setMarkingAllRead(true);
    try {
      var { error } = await supabase.from('contact_inquiries').update({ is_read: true }).in('id', unreadIds);
      if (error) throw error;
      setInquiries(function(prev) {
        return prev.map(function(i) {
          return unreadIds.indexOf(i.id) !== -1 ? Object.assign({}, i, { is_read: true }) : i;
        });
      });
      if (selected && unreadIds.indexOf(selected.id) !== -1) {
        setSelected(Object.assign({}, selected, { is_read: true }));
      }
      mascotSuccessToast('All caught up!', unreadIds.length + ' ' + (unreadIds.length === 1 ? 'inquiry' : 'inquiries') + ' marked as read.');
    } catch (err) {
      mascotErrorToast('Failed to mark all as read.', err.message);
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleArchive(inquiry) {
    setArchivingId(inquiry.id);
    try {
      var { error } = await supabase.from('contact_inquiries').update({ is_archived: true }).eq('id', inquiry.id);
      if (error) throw error;
      setInquiries(function(prev) { return prev.map(function(i) { return i.id === inquiry.id ? Object.assign({}, i, { is_archived: true }) : i; }); });
      // Move selection to next active inquiry
      var remaining = activeInquiries.filter(function(i) { return i.id !== inquiry.id; });
      setSelected(remaining.length > 0 ? remaining[0] : null);
      mascotSuccessToast('Inquiry archived.');
    } catch (err) {
      mascotErrorToast('Failed to archive inquiry.', err.message);
    } finally {
      setArchivingId(null);
    }
  }

  async function handleUnarchive(inquiry) {
    setArchivingId(inquiry.id);
    try {
      var { error } = await supabase.from('contact_inquiries').update({ is_archived: false }).eq('id', inquiry.id);
      if (error) throw error;
      setInquiries(function(prev) { return prev.map(function(i) { return i.id === inquiry.id ? Object.assign({}, i, { is_archived: false }) : i; }); });
      mascotSuccessToast('Inquiry restored to inbox.');
    } catch (err) {
      mascotErrorToast('Failed to unarchive inquiry.', err.message);
    } finally {
      setArchivingId(null);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!window.confirm('Delete this inquiry? This cannot be undone.')) return;
    var { error } = await supabase.from('contact_inquiries').delete().eq('id', selected.id);
    if (error) { toast.error('Failed to delete'); }
    else {
      mascotSuccessToast('Inquiry deleted.');
      var remaining = inquiries.filter(function(i) { return i.id !== selected.id; });
      setInquiries(remaining);
      var nextActive = remaining.find(function(i) { return !i.is_archived; });
      setSelected(nextActive || null);
    }
  }

  // ── Collab actions ────────────────────────────────────────────────────────
  function markCollabAsUnread(collabId) {
    lastVisitedMapRef.current[collabId] = '2000-01-01T00:00:00.000Z';
    setLatestMsgMap(function(prev) { return Object.assign({}, prev); });
  }

  async function respondToCollab(item, action, message) {
    setCollabActionLoading(true);
    try {
      var { error: updateErr } = await supabase.from('event_collaborators').update({ status: action, updated_at: new Date().toISOString() }).eq('id', item.id);
      if (updateErr) throw updateErr;
      var { data: reqAdmins } = await supabase.from('memberships').select('member_id').eq('organization_id', item.requesting_org_id).eq('role', 'admin').eq('status', 'active');
      if (reqAdmins && reqAdmins.length > 0) {
        var eventTitle = item.event ? item.event.title : 'an event';
        var orgName = currentOrgName || 'The host organization';
        var notifMsg = orgName + ' ' + (action === 'accepted' ? 'accepted' : 'declined') + ' your co-host request for "' + eventTitle + '"';
        if (message && message.trim()) notifMsg += ' — "' + message.trim() + '"';
        await supabase.from('notifications').insert(reqAdmins.map(function(a) {
          return { user_id: a.member_id, organization_id: item.requesting_org_id, type: action === 'accepted' ? 'collab_accepted' : 'collab_declined', title: action === 'accepted' ? 'Collaboration Accepted' : 'Collaboration Declined', message: notifMsg, link: '/organizations/' + item.requesting_org_id, read: false };
        }));
      }
      mascotSuccessToast(action === 'accepted' ? 'Co-host accepted!' : 'Request declined.');
      window.dispatchEvent(new CustomEvent('notificationCreated'));
      setCollabItems(function(prev) { return prev.map(function(c) { return c.id === item.id ? Object.assign({}, c, { status: action }) : c; }); });
      setSelectedCollab(function(prev) { return prev && prev.id === item.id ? Object.assign({}, prev, { status: action }) : prev; });
      setCollabRespondExpanded(false); setCollabRespondMessage(''); setCollabRespondAction(null);
    } catch (err) { mascotErrorToast('Could not update request.'); }
    finally { setCollabActionLoading(false); }
  }

  async function withdrawCollab(item) {
    if (!window.confirm('Withdraw your co-host request for "' + (item.event ? item.event.title : 'this event') + '"?')) return;
    setCollabActionLoading(true);
    try {
      var { error } = await supabase.from('event_collaborators').update({ status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', item.id);
      if (error) throw error;
      mascotSuccessToast('Request withdrawn.');
      setCollabItems(function(prev) { return prev.map(function(c) { return c.id === item.id ? Object.assign({}, c, { status: 'withdrawn' }) : c; }); });
      setSelectedCollab(function(prev) { return prev && prev.id === item.id ? Object.assign({}, prev, { status: 'withdrawn' }) : prev; });
    } catch (err) { toast.error('Could not withdraw request.'); }
    finally { setCollabActionLoading(false); }
  }

  async function reRequestCollab(item) {
    setCollabActionLoading(true);
    try {
      var { error } = await supabase.from('event_collaborators').update({ status: 'pending', message: item.message, updated_at: new Date().toISOString() }).eq('id', item.id);
      if (error) throw error;
      var { data: hostAdmins } = await supabase.from('memberships').select('member_id').eq('organization_id', item.host_org_id).eq('role', 'admin').eq('status', 'active');
      if (hostAdmins && hostAdmins.length > 0) {
        var eventTitle = item.event ? item.event.title : 'an event';
        var reqOrgName = currentOrgName || 'An organization';
        await supabase.from('notifications').insert(hostAdmins.map(function(a) {
          return { user_id: a.member_id, organization_id: item.host_org_id, type: 'collab_request', title: 'New Co-Host Request', message: reqOrgName + ' re-sent a co-host request for "' + eventTitle + '"', link: '/organizations/' + item.host_org_id, read: false };
        }));
      }
      mascotSuccessToast('Request re-sent!');
      window.dispatchEvent(new CustomEvent('notificationCreated'));
      setCollabItems(function(prev) { return prev.map(function(c) { return c.id === item.id ? Object.assign({}, c, { status: 'pending' }) : c; }); });
      setSelectedCollab(function(prev) { return prev && prev.id === item.id ? Object.assign({}, prev, { status: 'pending' }) : prev; });
    } catch (err) { toast.error('Could not re-send request.'); }
    finally { setCollabActionLoading(false); }
  }

  // ── Tab config ────────────────────────────────────────────────────────────
  var tabs = [
    { key: 'inquiries', label: 'Inquiries',       icon: <IconInbox size={15} />,     count: unreadCount },
    { key: 'members',   label: 'Member Messages', icon: <IconMessage size={15} />,   count: 0 },
    { key: 'collab',    label: 'Collaboration',   icon: <IconHandshake size={15} />, count: pendingCollabCount + unreadCollabCount },
  ];

  // ── Collab list item ──────────────────────────────────────────────────────
  function renderCollabListItem(item) {
    var isSelected  = selectedCollab && selectedCollab.id === item.id;
    var orgName     = item.other_org ? item.other_org.name : 'Unknown Organization';
    var eventTitle  = item.event ? item.event.title : 'Unknown Event';
    var isIncoming  = item.direction === 'incoming';
    var dirColor    = isIncoming ? '#A78BFA' : '#60A5FA';
    var dirBg       = isIncoming ? 'rgba(167,139,250,0.1)' : 'rgba(96,165,250,0.1)';
    var hasUnread   = isUnread(item);

    return (
      <button
        key={item.id}
        onClick={function() {
          setSelectedCollab(item);
          setCollabRespondExpanded(false);
          setCollabRespondMessage('');
          setCollabRespondAction(null);
          lastVisitedMapRef.current[item.id] = new Date().toISOString();
          setLatestMsgMap(function(prev) { return Object.assign({}, prev); });
        }}
        aria-label={(isIncoming ? 'Incoming' : 'Outgoing') + ' co-host request: ' + eventTitle + (hasUnread ? ', unread messages' : '')}
        style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '14px 16px', background: isSelected ? t.selectedBg : hasUnread ? t.unreadBg : 'transparent', borderBottom: '1px solid ' + t.border, borderLeft: (isSelected || hasUnread) ? '3px solid #3B82F6' : '3px solid transparent', display: 'block' }}
        className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: dirBg, border: '1px solid ' + dirColor + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: dirColor }}>
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', fontWeight: hasUnread ? 800 : 700, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>{eventTitle}</span>
              <span style={{ fontSize: '10px', color: t.textTertiary, flexShrink: 0 }}>{formatTime(item.created_at)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, color: dirColor, background: dirBg, padding: '1px 6px', borderRadius: '99px' }}>
                {isIncoming ? <IconArrowIn size={9} /> : <IconArrowOut size={9} />}
                {isIncoming ? 'Incoming' : 'Outgoing'}
              </span>
              <StatusBadge status={item.status} />
            </div>
            <div style={{ fontSize: '11px', color: t.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {hasUnread && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0, display: 'inline-block' }} aria-hidden="true" />}
              {isIncoming ? orgName + ' wants to co-host' : 'Your request to ' + orgName}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // ── Chat thread ───────────────────────────────────────────────────────────
  function renderChatThread(item, chatActive) {
    var otherOrgName   = item.other_org ? item.other_org.name : 'Co-host';
    var myOrgInitial   = currentOrgName ? currentOrgName.charAt(0).toUpperCase() : '?';
    var otherOrgInitial = otherOrgName.charAt(0).toUpperCase();

    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ color: t.textTertiary }}><IconChat size={14} /></div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: '3px' }}>Co-host Chat</span>
          <div style={{ flex: 1, height: '1px', background: t.border }} />
          <span style={{ fontSize: '10px', color: t.textTertiary }}>Only visible to org admins</span>
        </div>

        <div id="chat-scroll-container" role="log" aria-label="Co-host chat messages" aria-live="polite" style={{ background: t.bgChatBox, border: '1px solid ' + t.border, borderRadius: '10px', minHeight: '160px', maxHeight: '280px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
          {chatLoading ? <SkeletonChat /> : chatMessages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px', textAlign: 'center' }}>
              <div style={{ color: t.border, marginBottom: '8px' }}><IconChat size={22} /></div>
              <p style={{ fontSize: '12px', color: t.textTertiary, margin: 0 }}>No messages yet. Start the conversation.</p>
            </div>
          ) : (
            chatMessages.map(function(msg) {
              var isMine         = msg.sender_org_id === orgId;
              var senderLabel    = isMine ? currentOrgName || 'You' : otherOrgName;
              var avatarInitial  = isMine ? myOrgInitial : otherOrgInitial;
              var avatarBg       = isMine ? 'rgba(59,130,246,0.15)' : 'rgba(167,139,250,0.12)';
              var avatarColor    = isMine ? '#3B82F6' : '#A78BFA';
              var bubbleBg       = isMine ? '#EFF6FF' : '#F1F5F9';
              var bubbleBorder   = isMine ? '1px solid rgba(59,130,246,0.2)' : '1px solid ' + t.border;

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', opacity: msg._optimistic ? 0.65 : 1 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: avatarBg, border: '1px solid ' + avatarColor + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: avatarColor }} aria-hidden="true">
                    {avatarInitial}
                  </div>
                  <div style={{ maxWidth: '68%' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: t.textTertiary, marginBottom: '3px', textAlign: isMine ? 'right' : 'left' }}>{senderLabel}</div>
                    <div style={{ background: bubbleBg, border: bubbleBorder, borderRadius: isMine ? '10px 10px 2px 10px' : '10px 10px 10px 2px', padding: '8px 12px' }}>
                      <p style={{ fontSize: '13px', color: t.textSecondary, margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.message}</p>
                    </div>
                    <div style={{ fontSize: '10px', color: t.textTertiary, marginTop: '3px', textAlign: isMine ? 'right' : 'left' }}>
                      {msg._optimistic ? 'Sending...' : formatChatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {chatActive ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              value={chatInput}
              onChange={function(e) { setChatInput(e.target.value); }}
              onKeyDown={handleChatKeyDown}
              rows={1} maxLength={1000}
              placeholder={'Message ' + otherOrgName + '... (Enter to send)'}
              disabled={chatSending}
              aria-label={'Chat message to ' + otherOrgName}
              style={{ flex: 1, padding: '9px 12px', background: t.bgInput, border: '1px solid ' + t.border, borderRadius: '8px', fontSize: '13px', color: t.textPrimary, resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", opacity: chatSending ? 0.6 : 1 }}
              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatSending} aria-label="Send message" style={{ width: '38px', height: '38px', flexShrink: 0, background: chatInput.trim() && !chatSending ? '#3B82F6' : t.bgElevated, border: '1px solid ' + (chatInput.trim() && !chatSending ? '#3B82F6' : t.border), borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() && !chatSending ? 'pointer' : 'not-allowed', color: chatInput.trim() && !chatSending ? '#FFFFFF' : t.textTertiary, transition: 'background 0.15s, border-color 0.15s' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
              <IconSend size={15} />
            </button>
          </div>
        ) : (
          <div style={{ padding: '10px 14px', background: t.bgSecondary, border: '1px solid ' + t.border, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: t.textTertiary }}>
            <IconChat size={13} />
            <span style={{ fontSize: '12px' }}>Chat is read-only — this collaboration is no longer active.</span>
          </div>
        )}
      </div>
    );
  }

  // ── Collab detail panel ───────────────────────────────────────────────────
  function renderCollabDetail() {
    if (!selectedCollab) return <EmptyState icon={<IconHandshake size={28} />} title="Select a collaboration request" description="Choose a request from the list to view details and take action." />;

    var item       = selectedCollab;
    var isIncoming = item.direction === 'incoming';
    var orgName    = item.other_org ? item.other_org.name : 'Unknown Organization';
    var eventTitle = item.event ? item.event.title : 'Unknown Event';
    var isPending  = item.status === 'pending';
    var isAccepted = item.status === 'accepted';
    var chatActive = isPending || isAccepted;
    var dirColor   = isIncoming ? '#A78BFA' : '#60A5FA';
    var dirBg      = isIncoming ? 'rgba(167,139,250,0.1)' : 'rgba(96,165,250,0.1)';

    return (
      <div style={{ padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, background: dirBg, border: '1px solid ' + dirColor + '50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: dirColor }}>
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: t.textPrimary }}>{orgName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: dirColor, background: dirBg, padding: '2px 8px', borderRadius: '99px' }}>
                {isIncoming ? <IconArrowIn size={10} /> : <IconArrowOut size={10} />}
                {isIncoming ? 'Incoming Request' : 'Outgoing Request'}
              </span>
              <StatusBadge status={item.status} />
            </div>
          </div>
        </div>

        {latestMsgMap[item.id] && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={function() { markCollabAsUnread(item.id); }} style={{ padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: 'transparent', border: '1px solid ' + t.border, color: t.textMuted, cursor: 'pointer' }} className="hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Mark conversation as unread">
              Mark as unread
            </button>
          </div>
        )}

        {/* Event Info */}
        <div style={{ background: t.bgCard, border: '1px solid ' + t.border, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '10px' }}>Event</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: t.textPrimary, marginBottom: '6px' }}>{eventTitle}</div>
          {item.event && item.event.start_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: t.textMuted }}>
              <IconCalendar size={13} />
              {formatEventDate(item.event.start_time)}
              {item.event.location && <span style={{ color: t.textTertiary }}> · {item.event.location}</span>}
            </div>
          )}
        </div>

        {item.message && (
          <div style={{ background: t.bgSecondary, border: '1px solid ' + t.border, borderLeft: '3px solid ' + dirColor, borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: t.textTertiary, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>
              {isIncoming ? 'Their Message' : 'Your Message'}
            </div>
            <p style={{ fontSize: '14px', color: t.textSecondary, lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>"{item.message}"</p>
          </div>
        )}

        {renderChatThread(item, chatActive)}

        <div style={{ fontSize: '12px', color: t.textTertiary, marginBottom: '24px' }}>
          {isIncoming ? 'Received' : 'Sent'} {new Date(item.created_at).toLocaleString()}
          {item.updated_at && item.updated_at !== item.created_at && <span> · Updated {new Date(item.updated_at).toLocaleString()}</span>}
        </div>

        <div style={{ borderTop: '1px solid ' + t.border, marginBottom: '20px' }} />

        {isIncoming && isPending && !collabRespondExpanded && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={function() { setCollabRespondExpanded(true); setCollabRespondAction('accepted'); setCollabRespondMessage(''); }} style={{ padding: '9px 20px', background: '#22C55E', color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={'Accept co-host request from ' + orgName}>Accept</button>
            <button onClick={function() { setCollabRespondExpanded(true); setCollabRespondAction('declined'); setCollabRespondMessage(''); }} style={{ padding: '9px 20px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.4)', fontSize: '13px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }} className="hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={'Decline co-host request from ' + orgName}>Decline</button>
          </div>
        )}

        {isIncoming && isPending && collabRespondExpanded && (
          <div style={{ background: t.bgSecondary, border: '1px solid ' + (collabRespondAction === 'accepted' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'), borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: collabRespondAction === 'accepted' ? '#22C55E' : '#EF4444', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {collabRespondAction === 'accepted' ? 'Accept' : 'Decline'} — Optional Note
              </span>
              <button onClick={function() { setCollabRespondExpanded(false); setCollabRespondMessage(''); setCollabRespondAction(null); }} style={{ background: 'none', border: 'none', color: t.textTertiary, cursor: 'pointer', padding: '2px' }} className="focus:outline-none focus:ring-2 focus:ring-gray-500 rounded" aria-label="Cancel"><IconX size={14} /></button>
            </div>
            <textarea id="collab-inbox-msg" value={collabRespondMessage} onChange={function(e) { setCollabRespondMessage(e.target.value); }} maxLength={500} rows={3} placeholder={'Add an optional note for ' + orgName + '...'} style={{ width: '100%', padding: '10px 12px', background: t.bgInput, border: '1px solid ' + t.border, borderRadius: '8px', fontSize: '13px', color: t.textPrimary, resize: 'none', outline: 'none', boxSizing: 'border-box' }} className="focus:ring-2 focus:ring-blue-500" aria-label={'Optional note for ' + orgName} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: t.textTertiary }}>{collabRespondMessage.length}/500</span>
              <button onClick={function() { respondToCollab(item, collabRespondAction, collabRespondMessage); }} disabled={collabActionLoading} style={{ padding: '8px 20px', background: collabRespondAction === 'accepted' ? '#22C55E' : '#EF4444', color: '#fff', fontSize: '12px', fontWeight: 700, border: 'none', borderRadius: '7px', cursor: collabActionLoading ? 'not-allowed' : 'pointer', opacity: collabActionLoading ? 0.6 : 1 }} className={'focus:outline-none focus:ring-2 ' + (collabRespondAction === 'accepted' ? 'focus:ring-green-500' : 'focus:ring-red-500')} aria-label={'Confirm ' + (collabRespondAction === 'accepted' ? 'acceptance' : 'decline')}>
                {collabActionLoading ? 'Sending...' : 'Confirm ' + (collabRespondAction === 'accepted' ? 'Accept' : 'Decline')}
              </button>
            </div>
          </div>
        )}

        {isIncoming && !isPending && (
          <div style={{ padding: '14px 16px', background: t.bgSecondary, borderRadius: '8px', border: '1px solid ' + t.border }}>
            <p style={{ fontSize: '13px', color: t.textMuted, margin: 0 }}>
              {item.status === 'accepted' && 'You accepted this co-host request. ' + orgName + ' now appears as a co-host on the event.'}
              {item.status === 'declined' && 'You declined this request.'}
              {item.status === 'withdrawn' && orgName + ' withdrew their request.'}
            </p>
          </div>
        )}

        {!isIncoming && isPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, padding: '12px 16px', background: 'rgba(245,183,49,0.06)', border: '1px solid rgba(245,183,49,0.2)', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: t.textMuted, margin: 0 }}>Waiting for <span style={{ color: t.textPrimary, fontWeight: 600 }}>{orgName}</span> to respond.</p>
            </div>
            <button onClick={function() { withdrawCollab(item); }} disabled={collabActionLoading} style={{ padding: '9px 16px', background: 'transparent', color: t.textTertiary, border: '1px solid ' + t.border, fontSize: '12px', fontWeight: 600, borderRadius: '8px', cursor: collabActionLoading ? 'not-allowed' : 'pointer', opacity: collabActionLoading ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }} className="hover:border-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Withdraw co-host request">Withdraw</button>
          </div>
        )}

        {!isIncoming && (item.status === 'declined' || item.status === 'withdrawn') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, padding: '12px 16px', background: t.bgSecondary, border: '1px solid ' + t.border, borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: t.textMuted, margin: 0 }}>
                {item.status === 'declined' ? orgName + ' declined your request.' : 'You withdrew this request.'}
              </p>
            </div>
            <button onClick={function() { reRequestCollab(item); }} disabled={collabActionLoading} style={{ padding: '9px 16px', background: '#3B82F6', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 700, borderRadius: '8px', cursor: collabActionLoading ? 'not-allowed' : 'pointer', opacity: collabActionLoading ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Re-send co-host request">
              {collabActionLoading ? 'Sending...' : 'Re-send Request'}
            </button>
          </div>
        )}

        {!isIncoming && isAccepted && (
          <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconCheck size={14} />
              <p style={{ fontSize: '13px', color: '#22C55E', margin: 0, fontWeight: 600 }}>{orgName} accepted your co-host request.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bgPage, height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Page Header (standard: 30px / 800 / no icon) ── */}
      <div style={{ background: t.bgHeader, borderBottom: '1px solid ' + t.border, padding: '24px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: t.textPrimary, margin: 0 }}>Inbox</h1>
            <p style={{ fontSize: '14px', color: t.textMuted, margin: '4px 0 0' }}>
              {(function() {
                var total = unreadCount + unreadCollabCount;
                var totalInquiries = activeInquiries.length;
                if (total > 0) return total + ' unread · ' + totalInquiries + ' total';
                return totalInquiries + ' total · all caught up';
              })()}
            </p>
          </div>
          {/* Mark all read — only shown on inquiries tab when there are unread */}
          {activeTab === 'inquiries' && unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              aria-label={'Mark all ' + unreadCount + ' inquiries as read'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'transparent', border: '1px solid ' + t.border, borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: t.textMuted, cursor: markingAllRead ? 'not-allowed' : 'pointer', opacity: markingAllRead ? 0.6 : 1, flexShrink: 0 }}
              className="hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <IconCheckAll size={14} />
              {markingAllRead ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ background: t.bgHeader, borderBottom: '1px solid ' + t.border, display: 'flex', padding: '0 24px' }} role="tablist" aria-label="Inbox sections">
        {tabs.map(function(tab) {
          var isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={'panel-' + tab.key}
              onClick={function() { setActiveTab(tab.key); setSelected(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: isActive ? '#3B82F6' : t.textTertiary, borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap', outline: 'none' }}
              className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', minWidth: '18px', textAlign: 'center' }} aria-label={tab.count + ' unread'}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Two-Panel Layout (flex: 1 eliminates magic number) ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left Panel */}
        <div role="tabpanel" id={'panel-' + activeTab} style={{ width: '320px', flexShrink: 0, borderRight: '1px solid ' + t.border, overflowY: 'auto', background: t.bgPage, display: 'flex', flexDirection: 'column' }}>

          {activeTab === 'inquiries' && (
            <>
              {/* Search + archive toggle toolbar */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid ' + t.border, background: t.bgHeader, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: t.textTertiary, pointerEvents: 'none' }}>
                    <IconSearch size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search inquiries..."
                    value={searchQuery}
                    onChange={function(e) { setSearchQuery(e.target.value); }}
                    aria-label="Search inquiries by name, email, or message"
                    style={{ width: '100%', paddingLeft: '30px', paddingRight: searchQuery ? '28px' : '10px', paddingTop: '7px', paddingBottom: '7px', background: t.bgElevated, border: '1px solid ' + t.border, borderRadius: '7px', fontSize: '12px', color: t.textPrimary, outline: 'none', boxSizing: 'border-box' }}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={function() { setSearchQuery(''); }}
                      aria-label="Clear search"
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textTertiary, padding: '2px', display: 'flex', alignItems: 'center' }}
                      className="focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    >
                      <IconX size={12} />
                    </button>
                  )}
                </div>
                {/* Archive toggle */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['active', 'archived'].map(function(filter) {
                    var isActive = archiveFilter === filter;
                    var label = filter === 'active' ? 'Inbox' : 'Archived';
                    var count = filter === 'active' ? activeInquiries.length : inquiries.filter(function(i) { return i.is_archived; }).length;
                    return (
                      <button
                        key={filter}
                        onClick={function() { setArchiveFilter(filter); setSelected(null); }}
                        aria-pressed={isActive}
                        style={{ flex: 1, padding: '5px 8px', border: '1px solid ' + (isActive ? '#3B82F6' : t.border), borderRadius: '6px', background: isActive ? '#EFF6FF' : 'transparent', color: isActive ? '#3B82F6' : t.textMuted, fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {filter === 'archived' && <IconArchive size={11} />}
                        {label}
                        {count > 0 && (
                          <span style={{ background: isActive ? '#3B82F6' : t.bgElevated, color: isActive ? '#fff' : t.textMuted, fontSize: '10px', fontWeight: 700, padding: '0 5px', borderRadius: '99px' }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List */}
              {loading ? <SkeletonList /> : displayedInquiries.length === 0 ? (
                <EmptyState
                  icon={searchQuery ? <IconSearch size={24} /> : archiveFilter === 'archived' ? <IconArchive size={24} /> : <IconMail size={24} />}
                  title={searchQuery ? 'No results' : archiveFilter === 'archived' ? 'No archived inquiries' : 'No inquiries yet'}
                  description={searchQuery ? 'No inquiries match "' + searchQuery + '".' : archiveFilter === 'archived' ? 'Archived inquiries will appear here.' : 'When someone submits your public Join Us form, their message will appear here.'}
                />
              ) : (
                <div role="list" aria-label="Contact inquiries" style={{ flex: 1 }}>
                  {displayedInquiries.map(function(inq) {
                    var isSelected = selected && selected.id === inq.id;
                    return (
                      <button
                        key={inq.id}
                        role="listitem"
                        onClick={function() { handleSelect(inq); }}
                        aria-label={'Inquiry from ' + inq.name + (inq.is_read ? '' : ', unread') + (inq.is_archived ? ', archived' : '')}
                        style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '14px 16px', background: isSelected ? t.selectedBg : 'transparent', borderBottom: '1px solid ' + t.border, borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent', display: 'block' }}
                        className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: t.bgElevated, border: '1px solid ' + t.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: t.textMuted }}>
                            {getInitials(inq.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontSize: '13px', fontWeight: inq.is_read ? 600 : 700, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inq.name}</span>
                              <span style={{ fontSize: '11px', color: t.textTertiary, flexShrink: 0, marginLeft: '8px' }}>{formatTime(inq.created_at)}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: t.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inq.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              {!inq.is_read && <span style={{ color: '#3B82F6', display: 'flex', alignItems: 'center' }}><IconCircle size={7} /></span>}
                              <span style={{ fontSize: '12px', color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {inq.message ? inq.message.substring(0, 60) + (inq.message.length > 60 ? '…' : '') : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'members' && <EmptyState icon={<IconUsers size={24} />} title="Member messaging coming soon" description="Direct messages between members will appear here once the chat feature is live." />}

          {activeTab === 'collab' && (
            <>
              {collabLoading ? <SkeletonList /> : collabItems.length === 0 ? (
                <EmptyState icon={<IconHandshake size={24} />} title="No collaboration requests" description="Co-host requests you send or receive will appear here." />
              ) : (
                <div role="list" aria-label="Collaboration requests">
                  {sortedCollabItems.map(function(item) { return renderCollabListItem(item); })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, overflowY: 'auto', background: t.bgPage }}>
          {activeTab === 'inquiries' && !selected && !loading && (
            <EmptyState icon={<IconInbox size={28} />} title="Select an inquiry" description="Choose a message from the list to read it here." />
          )}

          {activeTab === 'inquiries' && selected && (
            <div style={{ padding: '28px 32px', maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: t.bgElevated, border: '1px solid ' + t.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: t.textMuted }}>
                    {getInitials(selected.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: t.textPrimary }}>{selected.name}</div>
                    <a href={'mailto:' + selected.email} style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none' }}>{selected.email}</a>
                  </div>
                </div>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {selected.is_read && (
                    <button onClick={handleMarkUnread} disabled={markingRead} aria-label="Mark as unread" style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'transparent', border: '1px solid ' + t.border, color: t.textMuted, cursor: 'pointer' }} className="hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      Mark unread
                    </button>
                  )}
                  {!selected.is_archived ? (
                    <button
                      onClick={function() { handleArchive(selected); }}
                      disabled={archivingId === selected.id}
                      aria-label="Archive inquiry"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'transparent', border: '1px solid ' + t.border, color: t.textMuted, cursor: archivingId === selected.id ? 'not-allowed' : 'pointer', opacity: archivingId === selected.id ? 0.6 : 1 }}
                      className="hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <IconArchive size={13} />
                      {archivingId === selected.id ? 'Archiving...' : 'Archive'}
                    </button>
                  ) : (
                    <button
                      onClick={function() { handleUnarchive(selected); }}
                      disabled={archivingId === selected.id}
                      aria-label="Restore inquiry to inbox"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'transparent', border: '1px solid #3B82F6', color: '#3B82F6', cursor: archivingId === selected.id ? 'not-allowed' : 'pointer', opacity: archivingId === selected.id ? 0.6 : 1 }}
                      className="hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <IconArchive size={13} />
                      {archivingId === selected.id ? 'Restoring...' : 'Restore'}
                    </button>
                  )}
                  <a href={'mailto:' + selected.email} aria-label={'Reply to ' + selected.name + ' by email'} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#3B82F6', border: '1px solid #3B82F6', color: '#FFFFFF', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconMail size={13} />Reply via Email
                  </a>
                  <button onClick={handleDelete} aria-label="Delete inquiry" style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'transparent', border: '1px solid ' + t.border, color: '#EF4444', cursor: 'pointer' }} className="hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: t.textTertiary }}>
                  <span>Received:</span>
                  <span style={{ color: t.textSecondary }}>{new Date(selected.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selected.is_read
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#22C55E' }}><IconCheck size={12} />Read</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3B82F6' }}><IconCircle size={7} />Unread</span>
                  }
                </div>
                {selected.is_archived && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: t.textTertiary }}>
                    <IconArchive size={12} />Archived
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid ' + t.border, marginBottom: '24px' }} />

              <div style={{ background: t.bgCard, border: '1px solid ' + t.border, borderRadius: '12px', padding: '20px 24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px' }}>Message</div>
                <p style={{ fontSize: '15px', color: t.textSecondary, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: t.bgSecondary, borderRadius: '8px', border: '1px dashed ' + t.border }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: t.textTertiary, fontSize: '12px' }}>
                  <IconMessage size={14} />
                  Reply threading coming with the chat feature — use the email button above to respond for now.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && <EmptyState icon={<IconMessage size={28} />} title="Coming soon" description="This will be wired up as part of the chat feature in the next build session." />}

          {activeTab === 'collab' && renderCollabDetail()}
        </div>
      </div>
    </div>
  );
}