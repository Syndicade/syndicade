import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import {
  Bell, Megaphone, Calendar, Users, Mail,
  FileText, Handshake, MessageSquare, CheckCheck,
  Inbox, Trash2, MoreVertical, Search, X,
  ChevronDown, Eye, EyeOff, Image, BookOpen, ClipboardList,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
var PAGE_SIZE = 20;

var TYPE_CONFIG = {
  announcement:            { icon: Megaphone,      color: '#F5B731', bg: 'rgba(245,183,49,0.12)',  label: 'Announcement',    linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/announcements' : null; } },
  event:                   { icon: Calendar,       color: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  label: 'Event',           linkFn: function(n) { return n.link || null; } },
  member:                  { icon: Users,          color: '#22C55E', bg: 'rgba(34,197,94,0.10)',   label: 'Member',          linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/members' : null; } },
  invitation:              { icon: Mail,           color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', label: 'Invitation',      linkFn: function(n) { return n.link || null; } },
  document:                { icon: FileText,       color: '#64748B', bg: 'rgba(100,116,139,0.10)',label: 'Document',        linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/documents' : null; } },
  collaboration_request:   { icon: Handshake,      color: '#F97316', bg: 'rgba(249,115,22,0.10)', label: 'Collaboration',   linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : null; } },
  collab_request:          { icon: Handshake,      color: '#F97316', bg: 'rgba(249,115,22,0.10)', label: 'Collaboration',   linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : null; } },
  collab_invite:           { icon: Handshake,      color: '#F97316', bg: 'rgba(249,115,22,0.10)', label: 'Collaboration',   linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : null; } },
  collab_accepted:         { icon: Handshake,      color: '#22C55E', bg: 'rgba(34,197,94,0.10)',  label: 'Collaboration',   linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : null; } },
  collab_declined:         { icon: Handshake,      color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  label: 'Collaboration',   linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : null; } },
  community_board_message: { icon: MessageSquare,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', label: 'Community Board', linkFn: function(n) { return n.link || null; } },
  board_reply:             { icon: MessageSquare,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', label: 'Community Board', linkFn: function(n) { return n.link || null; } },
  new_poll:                { icon: ClipboardList,  color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', label: 'Poll',            linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/polls' : null; } },
  new_survey:              { icon: ClipboardList,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', label: 'Survey',          linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/surveys' : null; } },
  new_photo:               { icon: Image,          color: '#22C55E', bg: 'rgba(34,197,94,0.10)',  label: 'Photo',           linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/photos' : null; } },
  new_program:             { icon: BookOpen,       color: '#F5B731', bg: 'rgba(245,183,49,0.12)', label: 'Program',         linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/programs' : null; } },
  inbox_message:           { icon: Mail,           color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', label: 'Inbox',           linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : null; } },
};

var DEFAULT_CONFIG = { icon: Bell, color: '#64748B', bg: 'rgba(100,116,139,0.10)', label: 'Notification', linkFn: function(n) { return n.link || null; } };

var COLLAB_TYPES = ['collaboration_request','collab_request','collab_invite','collab_accepted','collab_declined'];

var TYPE_OPTIONS = [
  { value: '',                        label: 'All Types' },
  { value: 'announcement',            label: 'Announcements' },
  { value: 'event',                   label: 'Events' },
  { value: 'member',                  label: 'Members' },
  { value: 'invitation',              label: 'Invitations' },
  { value: 'document',                label: 'Documents' },
  { value: 'collab_request',          label: 'Collaboration' },
  { value: 'community_board_message', label: 'Community Board' },
  { value: 'new_poll',                label: 'Polls' },
  { value: 'new_survey',              label: 'Surveys' },
  { value: 'new_photo',               label: 'Photos' },
  { value: 'new_program',             label: 'Programs' },
];

var GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGroup(dateStr) {
  var now      = new Date();
  var d        = new Date(dateStr);
  var diffDays = Math.floor((now - d) / 86400000);
  if (now.toDateString() === d.toDateString()) return 'Today';
  if (diffDays === 1)  return 'Yesterday';
  if (diffDays <= 7)   return 'This Week';
  return 'Older';
}

function groupNotifications(list) {
  var groups = {};
  list.forEach(function(n) {
    var g = getGroup(n.created_at);
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  });
  return groups;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function typeMatchesFilter(notifType, filterValue) {
  if (!filterValue) return true;
  if (filterValue === 'collab_request') return COLLAB_TYPES.includes(notifType);
  return notifType === filterValue;
}

function resolveLink(n) {
  var cfg = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
  return (cfg.linkFn && cfg.linkFn(n)) || n.link || null;
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse" aria-hidden="true">
      <div style={{width:'16px',height:'16px',borderRadius:'3px',background:'#E2E8F0',flexShrink:0,marginTop:'14px'}} />
      <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#E2E8F0',flexShrink:0,marginTop:'2px'}} />
      <div style={{flex:1,paddingTop:'4px'}}>
        <div style={{height:'14px',background:'#E2E8F0',borderRadius:'4px',width:'65%',marginBottom:'8px'}} />
        <div style={{height:'12px',background:'#E2E8F0',borderRadius:'4px',width:'45%',marginBottom:'6px'}} />
        <div style={{height:'11px',background:'#E2E8F0',borderRadius:'4px',width:'25%'}} />
      </div>
    </div>
  );
}

// ── Filter select ─────────────────────────────────────────────────────────────
function FilterSelect(props) {
  return (
    <div style={{position:'relative'}}>
      <select
        value={props.value}
        onChange={props.onChange}
        aria-label={props.ariaLabel}
        style={{
          padding:'7px 28px 7px 10px',
          fontSize:'13px',
          border:'1px solid #E2E8F0',
          borderRadius:'8px',
          background:'#FFFFFF',
          color: props.value ? '#0E1523' : '#64748B',
          fontWeight: props.value ? 600 : 400,
          appearance:'none',
          cursor:'pointer',
          outline:'none',
          fontFamily:"'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
        }}
        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {props.children}
      </select>
      <ChevronDown size={13} color="#94A3B8" aria-hidden="true"
        style={{position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  var navigate       = useNavigate();
  var offsetRef      = useRef(0);
  var lastFetchRef   = useRef(null);
  var menuRef        = useRef(null);
  var openMenuIdRef  = useRef(null);

  var [notifications, setNotifications] = useState([]);
  var [loading,       setLoading]       = useState(true);
  var [loadingMore,   setLoadingMore]   = useState(false);
  var [hasMore,       setHasMore]       = useState(false);
  var [userId,        setUserId]        = useState(null);
  var [orgs,          setOrgs]          = useState([]);

  // Filters
  var [readFilter, setReadFilter] = useState('all');
  var [typeFilter, setTypeFilter] = useState('');
  var [orgFilter,  setOrgFilter]  = useState('');
  var [search,     setSearch]     = useState('');

  // Selection
  var [selectedIds, setSelectedIds] = useState(new Set());

  // 3-dot menu
  var [openMenuId, setOpenMenuId] = useState(null);

  // Loading states
  var [bulkLoading,    setBulkLoading]    = useState(false);
  var [deletingOlder,  setDeletingOlder]  = useState(false);

  // ── Close menu on outside click + Escape key ──────────────────────────────
  useEffect(function() {
    function handleOutside(e) {
      if (openMenuIdRef.current !== null) {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setOpenMenuId(null);
          openMenuIdRef.current = null;
        }
      }
    }
    function handleKeydown(e) {
      if (e.key === 'Escape' && openMenuIdRef.current !== null) {
        setOpenMenuId(null);
        openMenuIdRef.current = null;
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeydown);
    return function() {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(function() {
    supabase.auth.getUser().then(function(res) {
      if (res.data && res.data.user) {
        setUserId(res.data.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  function fetchOrgsForNotifs(data) {
    var orgIds = [];
    data.forEach(function(n) {
      if (n.organization_id && !orgIds.includes(n.organization_id)) {
        orgIds.push(n.organization_id);
      }
    });
    if (orgIds.length === 0) return;
    supabase.from('organizations').select('id, name').in('id', orgIds).then(function(res) {
      if (!res.error && res.data) {
        setOrgs(function(prev) {
          var merged = prev.slice();
          res.data.forEach(function(o) {
            if (!merged.find(function(x) { return x.id === o.id; })) merged.push(o);
          });
          return merged;
        });
      }
    });
  }

  // Full paginated fetch
  function doFetch(fromOffset, isReset) {
    if (!userId) return;
    if (isReset) setLoading(true);
    else setLoadingMore(true);

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(fromOffset, fromOffset + PAGE_SIZE - 1)
      .then(function(res) {
        setLoading(false);
        setLoadingMore(false);
        if (res.error) { toast.error('Could not load notifications.'); return; }
        var data = res.data || [];
        var nextOffset = fromOffset + data.length;
        offsetRef.current = nextOffset;

        if (isReset) {
          setNotifications(data);
          if (data.length > 0) lastFetchRef.current = data[0].created_at;
        } else {
          setNotifications(function(prev) { return prev.concat(data); });
        }
        setHasMore(data.length === PAGE_SIZE);
        fetchOrgsForNotifs(data);
      });
  }

  // Incremental fetch — only new rows since lastFetchRef
  var fetchIncremental = useCallback(function() {
    if (!userId) return;
    var query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (lastFetchRef.current) {
      query = query.gt('created_at', lastFetchRef.current);
    }

    query.then(function(res) {
      if (res.error || !res.data || res.data.length === 0) return;
      var incoming = res.data;
      setNotifications(function(prev) {
        var existingIds = {};
        prev.forEach(function(n) { existingIds[n.id] = true; });
        var truly_new = incoming.filter(function(n) { return !existingIds[n.id]; });
        if (truly_new.length === 0) return prev;
        var merged = truly_new.concat(prev);
        lastFetchRef.current = merged[0].created_at;
        return merged;
      });
      fetchOrgsForNotifs(incoming);
    });
  }, [userId]);

  // Initial load
  useEffect(function() {
    if (userId) {
      offsetRef.current = 0;
      doFetch(0, true);
    }
  }, [userId]); // eslint-disable-line

  // ── Realtime subscription + polling + visibility ──────────────────────────
  useEffect(function() {
    if (!userId) return;

    var dbChannel        = null;
    var broadcastChannel = null;
    var pollInterval     = null;

    // postgres_changes with user_id filter
    dbChannel = supabase
      .channel('notifpage-db-' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + userId },
        function() { fetchIncremental(); }
      )
      .subscribe(function(status) {
        if (status === 'SUBSCRIBED' && dbChannel._prevStatus === 'CLOSED') fetchIncremental();
        dbChannel._prevStatus = status;
      });

    // Broadcast channel
    broadcastChannel = supabase
      .channel('notifpage-broadcast-' + userId)
      .on('broadcast', { event: 'new_notification' }, function() { fetchIncremental(); })
      .subscribe();

    // 30s poll
    pollInterval = setInterval(function() { fetchIncremental(); }, 30000);

    // Tab visibility
    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchIncremental();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return function() {
      if (dbChannel)        supabase.removeChannel(dbChannel);
      if (broadcastChannel) supabase.removeChannel(broadcastChannel);
      if (pollInterval)     clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId, fetchIncremental]);

  function loadMore() { doFetch(offsetRef.current, false); }

  // ── Single-row actions ────────────────────────────────────────────────────
  function updateOne(id, patch) {
    setNotifications(function(prev) {
      return prev.map(function(n) { return n.id === id ? Object.assign({}, n, patch) : n; });
    });
  }

  function closeMenu() {
    setOpenMenuId(null);
    openMenuIdRef.current = null;
  }

  function markAsRead(id) {
    supabase.from('notifications').update({ read: true }).eq('id', id)
      .then(function(res) { if (!res.error) updateOne(id, { read: true }); });
    closeMenu();
  }

  function markAsUnread(id) {
    supabase.from('notifications').update({ read: false }).eq('id', id)
      .then(function(res) { if (!res.error) updateOne(id, { read: false }); });
    closeMenu();
  }

  function deleteOne(id) {
    supabase.from('notifications').delete().eq('id', id).then(function(res) {
      if (res.error) { toast.error('Could not delete notification.'); return; }
      setNotifications(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
      setSelectedIds(function(prev) { var s = new Set(prev); s.delete(id); return s; });
    });
    closeMenu();
  }

  function handleRowClick(n) {
    if (!n.read) markAsRead(n.id);
    var link = resolveLink(n);
    if (link) navigate(link);
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelectedIds(function(prev) {
      var s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function toggleSelectAll(visibleIds) {
    var allSel = visibleIds.every(function(id) { return selectedIds.has(id); });
    setSelectedIds(allSel ? new Set() : new Set(visibleIds));
  }

  function bulkUpdate(patch, successMsg) {
    var ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkLoading(true);
    supabase.from('notifications').update(patch).in('id', ids).then(function(res) {
      setBulkLoading(false);
      if (res.error) { toast.error('Could not update notifications.'); return; }
      setNotifications(function(prev) {
        return prev.map(function(n) { return ids.includes(n.id) ? Object.assign({}, n, patch) : n; });
      });
      setSelectedIds(new Set());
      mascotSuccessToast(successMsg);
    });
  }

  function bulkDelete() {
    var ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkLoading(true);
    supabase.from('notifications').delete().in('id', ids).then(function(res) {
      setBulkLoading(false);
      if (res.error) { toast.error('Could not delete notifications.'); return; }
      setNotifications(function(prev) { return prev.filter(function(n) { return !ids.includes(n.id); }); });
      setSelectedIds(new Set());
      mascotSuccessToast(ids.length + ' notifications deleted.');
    });
  }

  function markAllRead() {
    var ids = notifications.filter(function(n) { return !n.read; }).map(function(n) { return n.id; });
    if (!ids.length) return;
    supabase.from('notifications').update({ read: true }).in('id', ids).then(function(res) {
      if (res.error) { toast.error('Could not mark all as read.'); return; }
      setNotifications(function(prev) {
        return prev.map(function(n) { return Object.assign({}, n, { read: true }); });
      });
      mascotSuccessToast('All notifications marked as read.');
    });
  }

  function deleteAllOlder() {
    var ids = notifications
      .filter(function(n) { return getGroup(n.created_at) === 'Older'; })
      .map(function(n) { return n.id; });
    if (!ids.length) return;
    setDeletingOlder(true);
    supabase.from('notifications').delete().in('id', ids).then(function(res) {
      setDeletingOlder(false);
      if (res.error) { toast.error('Could not clear older notifications.'); return; }
      setNotifications(function(prev) { return prev.filter(function(n) { return !ids.includes(n.id); }); });
      setSelectedIds(function(prev) {
        var s = new Set(prev);
        ids.forEach(function(id) { s.delete(id); });
        return s;
      });
      mascotSuccessToast('Older notifications cleared.');
    });
  }

  // ── Client-side filtering ─────────────────────────────────────────────────
  var filtered = notifications.filter(function(n) {
    if (readFilter === 'unread' && n.read) return false;
    if (typeFilter && !typeMatchesFilter(n.type, typeFilter)) return false;
    if (orgFilter && n.organization_id !== orgFilter) return false;
    if (search) {
      var q      = search.toLowerCase();
      var inTitle   = (n.title   || '').toLowerCase().includes(q);
      var inMessage = (n.message || '').toLowerCase().includes(q);
      if (!inTitle && !inMessage) return false;
    }
    return true;
  });

  var groups        = groupNotifications(filtered);
  var visibleIds    = filtered.map(function(n) { return n.id; });
  var allSelected   = visibleIds.length > 0 && visibleIds.every(function(id) { return selectedIds.has(id); });
  var someSelected  = visibleIds.some(function(id) { return selectedIds.has(id); });
  var unreadCount   = notifications.filter(function(n) { return !n.read; }).length;
  var hasOlder      = notifications.some(function(n) { return getGroup(n.created_at) === 'Older'; });
  var activeFilters = (readFilter !== 'all' ? 1 : 0) + (typeFilter ? 1 : 0) + (orgFilter ? 1 : 0) + (search ? 1 : 0);

  function clearFilters() {
    setReadFilter('all');
    setTypeFilter('');
    setOrgFilter('');
    setSearch('');
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{background:'#F8FAFC',minHeight:'100vh',fontFamily:"'Inter','Segoe UI',system-ui,-apple-system,sans-serif"}}>

      {/* Page header */}
      <header style={{background:'#FFFFFF',borderBottom:'1px solid #E2E8F0',padding:'20px 24px'}} role="banner">
        <div style={{maxWidth:'760px',margin:'0 auto'}}>

          {/* Title row */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',marginBottom:'16px'}}>
            <div>
              <h1 style={{fontSize:'28px',fontWeight:800,color:'#0E1523',margin:0,lineHeight:1.2}}>Notifications</h1>
              {unreadCount > 0 && (
                <p style={{fontSize:'13px',color:'#64748B',margin:'4px 0 0'}} aria-live="polite" aria-atomic="true">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {/* Only show Mark all read in header — Clear older lives in group only */}
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                style={{fontSize:'13px',fontWeight:600,cursor:'pointer',flexShrink:0,marginTop:'2px'}}
                aria-label="Mark all notifications as read"
              >
                <CheckCheck size={14} aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filters row */}
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>

            {/* Search */}
            <div style={{position:'relative',flex:'1 1 180px',minWidth:'0'}}>
              <Search size={14} color="#94A3B8" aria-hidden="true"
                style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
              <input
                id="notif-search"
                type="search"
                placeholder="Search notifications..."
                value={search}
                onChange={function(e) { setSearch(e.target.value); }}
                style={{
                  width:'100%',
                  paddingLeft:'32px',
                  paddingRight: search ? '32px' : '12px',
                  paddingTop:'8px',paddingBottom:'8px',
                  fontSize:'13px',
                  border:'1px solid #E2E8F0',
                  borderRadius:'8px',
                  background:'#F8FAFC',
                  color:'#0E1523',
                  outline:'none',
                  boxSizing:'border-box',
                  fontFamily:"'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
                }}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Search notifications"
              />
              {search && (
                <button
                  onClick={function() { setSearch(''); }}
                  style={{position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',padding:'2px',color:'#94A3B8',display:'flex',alignItems:'center'}}
                  aria-label="Clear search"
                  className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Unread only toggle */}
            <button
              onClick={function() { setReadFilter(readFilter === 'unread' ? 'all' : 'unread'); }}
              className={'flex items-center gap-1.5 px-3 py-2 rounded-lg border font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ' +
                (readFilter === 'unread' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}
              style={{fontSize:'13px',whiteSpace:'nowrap'}}
              aria-pressed={readFilter === 'unread'}
            >
              <Eye size={13} aria-hidden="true" />
              Unread only
            </button>

            {/* Type filter */}
            <FilterSelect value={typeFilter} onChange={function(e) { setTypeFilter(e.target.value); }} ariaLabel="Filter by notification type">
              {TYPE_OPTIONS.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
            </FilterSelect>

            {/* Org filter */}
            {orgs.length > 0 && (
              <FilterSelect value={orgFilter} onChange={function(e) { setOrgFilter(e.target.value); }} ariaLabel="Filter by organization">
                <option value="">All Orgs</option>
                {orgs.map(function(o) { return <option key={o.id} value={o.id}>{o.name}</option>; })}
              </FilterSelect>
            )}

            {/* Clear filters */}
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                style={{fontSize:'12px',fontWeight:600,color:'#64748B',background:'none',border:'none',cursor:'pointer',padding:'4px 6px',display:'flex',alignItems:'center',gap:'4px',borderRadius:'6px'}}
                className="hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label={'Clear all filters (' + activeFilters + ' active)'}
              >
                <X size={12} aria-hidden="true" />
                Clear{activeFilters > 1 ? ' (' + activeFilters + ')' : ''}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{maxWidth:'760px',margin:'0 auto',padding:'24px 24px 80px'}}>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div
            style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'10px',marginBottom:'16px'}}
            role="toolbar"
            aria-label="Bulk notification actions"
          >
            <span style={{fontSize:'13px',fontWeight:600,color:'#1D4ED8',flex:1}}>{selectedIds.size} selected</span>
            <button
              onClick={function() { bulkUpdate({ read: true }, 'Marked as read.'); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              style={{fontSize:'12px',fontWeight:600,opacity:bulkLoading?0.6:1,cursor:bulkLoading?'not-allowed':'pointer'}}
            >
              <Eye size={13} aria-hidden="true" /> Mark read
            </button>
            <button
              onClick={function() { bulkUpdate({ read: false }, 'Marked as unread.'); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              style={{fontSize:'12px',fontWeight:600,opacity:bulkLoading?0.6:1,cursor:bulkLoading?'not-allowed':'pointer'}}
            >
              <EyeOff size={13} aria-hidden="true" /> Mark unread
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              style={{fontSize:'12px',fontWeight:600,opacity:bulkLoading?0.6:1,cursor:bulkLoading?'not-allowed':'pointer'}}
            >
              <Trash2 size={13} aria-hidden="true" /> Delete
            </button>
            <button
              onClick={function() { setSelectedIds(new Set()); }}
              style={{background:'none',border:'none',cursor:'pointer',color:'#94A3B8',padding:'4px',display:'flex',alignItems:'center'}}
              className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
              aria-label="Cancel selection"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" aria-busy="true" aria-label="Loading notifications">
            {[1,2,3,4,5].map(function(i) { return <SkeletonRow key={i} />; })}
          </div>
        )}

        {/* Empty — no notifications at all */}
        {!loading && notifications.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <Inbox size={28} color="#94A3B8" aria-hidden="true" />
            </div>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#0E1523',marginBottom:'8px'}}>All caught up</h2>
            <p style={{fontSize:'15px',color:'#64748B',maxWidth:'300px',margin:'0 auto 24px',lineHeight:1.6}}>
              You have no notifications yet. Activity from your orgs and community boards will appear here.
            </p>
            <button
              onClick={function() { navigate('/dashboard'); }}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{fontSize:'14px'}}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Empty — filters returned nothing */}
        {!loading && notifications.length > 0 && filtered.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'#F1F5F9',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
              <Bell size={22} color="#94A3B8" aria-hidden="true" />
            </div>
            <h2 style={{fontSize:'16px',fontWeight:700,color:'#0E1523',marginBottom:'6px'}}>No matching notifications</h2>
            <p style={{fontSize:'14px',color:'#64748B',marginBottom:'16px'}}>Try adjusting your filters or search.</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              style={{fontSize:'13px',fontWeight:600}}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Notification groups */}
        {!loading && filtered.length > 0 && (
          <div style={{display:'flex',flexDirection:'column',gap:'28px'}}>

            {/* Select all row */}
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <input
                type="checkbox"
                id="select-all-notifs"
                checked={allSelected}
                ref={function(el) { if (el) el.indeterminate = someSelected && !allSelected; }}
                onChange={function() { toggleSelectAll(visibleIds); }}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Select all visible notifications"
              />
              <label htmlFor="select-all-notifs" style={{fontSize:'13px',color:'#64748B',cursor:'pointer',userSelect:'none'}}>
                Select all ({filtered.length})
              </label>
            </div>

            {GROUP_ORDER.map(function(groupName) {
              if (!groups[groupName] || groups[groupName].length === 0) return null;

              return (
                <section key={groupName} aria-label={groupName + ' notifications'}>

                  {/* Group header */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                    <span style={{fontSize:'11px',fontWeight:700,color:'#F5B731',letterSpacing:'4px',textTransform:'uppercase'}}>
                      {groupName}
                    </span>
                    {groupName === 'Older' && (
                      <button
                        onClick={deleteAllOlder}
                        disabled={deletingOlder}
                        style={{fontSize:'12px',fontWeight:600,color:'#EF4444',background:'none',border:'none',cursor:deletingOlder?'not-allowed':'pointer',opacity:deletingOlder?0.6:1,display:'flex',alignItems:'center',gap:'4px',padding:'2px 4px',borderRadius:'4px'}}
                        className="hover:underline focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label="Delete all older notifications"
                      >
                        <Trash2 size={12} aria-hidden="true" /> Clear all older
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" role="list" aria-label={groupName + ' notifications'}>
                    {groups[groupName].map(function(n, idx) {
                      var cfg          = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
                      var IconComp     = cfg.icon;
                      var isLast       = idx === groups[groupName].length - 1;
                      var isNearBottom = idx >= groups[groupName].length - 2;
                      var isSelected   = selectedIds.has(n.id);
                      var menuOpen     = openMenuId === n.id;
                      var link         = resolveLink(n);

                      return (
                        <div
                          key={n.id}
                          role="listitem"
                          style={{
                            display:'flex',
                            alignItems:'flex-start',
                            gap:'12px',
                            padding:'14px 16px',
                            background: isSelected ? '#EFF6FF' : (n.read ? '#FFFFFF' : '#F8FAFC'),
                            borderBottom: isLast ? 'none' : '1px solid #E2E8F0',
                            borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                            transition:'background 0.1s',
                            position:'relative',
                          }}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={function() { toggleSelect(n.id); }}
                            onClick={function(e) { e.stopPropagation(); }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                            style={{marginTop:'12px'}}
                            aria-label={'Select: ' + (n.title || cfg.label)}
                          />

                          {/* Type icon */}
                          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'2px'}}>
                            <IconComp size={16} color={cfg.color} aria-hidden="true" />
                          </div>

                          {/* Text body */}
                          <div
                            style={{flex:1,minWidth:0,cursor:link?'pointer':'default'}}
                            onClick={link ? function() { handleRowClick(n); } : undefined}
                            onKeyDown={link ? function(e) { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); handleRowClick(n); } } : undefined}
                            tabIndex={link ? 0 : undefined}
                            role={link ? 'button' : undefined}
                            aria-label={link ? ('Open: ' + (n.title || cfg.label)) : undefined}
                            className={link ? 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded' : ''}
                          >
                            <div style={{display:'flex',alignItems:'flex-start',gap:'8px'}}>
                              <p style={{fontSize:'14px',fontWeight:n.read ? 400 : 600,color:'#0E1523',margin:0,lineHeight:1.45,flex:1}}>
                                {n.title || cfg.label}
                              </p>
                              {!n.read && (
                                <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#3B82F6',flexShrink:0,marginTop:'5px'}} aria-label="Unread" />
                              )}
                            </div>
                            {n.message && (
                              <p style={{fontSize:'13px',color:'#475569',margin:'4px 0 0',lineHeight:1.5}}>{n.message}</p>
                            )}
                            <p style={{fontSize:'11px',color:'#94A3B8',margin:'5px 0 0'}}>{formatTime(n.created_at)}</p>
                          </div>

                          {/* 3-dot menu */}
                          <div
                            style={{position:'relative',flexShrink:0}}
                            ref={menuOpen ? menuRef : undefined}
                          >
                            <button
                              onClick={function(e) {
                                e.stopPropagation();
                                var next = menuOpen ? null : n.id;
                                setOpenMenuId(next);
                                openMenuIdRef.current = next;
                              }}
                              style={{padding:'6px',background:'none',border:'none',cursor:'pointer',color:'#94A3B8',borderRadius:'6px',display:'flex',alignItems:'center'}}
                              className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                              aria-label={'Actions for: ' + (n.title || cfg.label)}
                              aria-expanded={menuOpen}
                              aria-haspopup="menu"
                            >
                              <MoreVertical size={16} aria-hidden="true" />
                            </button>

                            {menuOpen && (
                              <div
                                style={{position:'absolute',right:0,top:isNearBottom?'auto':'34px',bottom:isNearBottom?'34px':'auto',background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'10px',boxShadow:'0 4px 16px rgba(0,0,0,0.10)',zIndex:50,minWidth:'168px',overflow:'hidden'}}
                                role="menu"
                                aria-label="Notification actions"
                              >
                                {n.read ? (
                                  <button
                                    onClick={function(e) { e.stopPropagation(); markAsUnread(n.id); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                                    style={{fontSize:'13px',fontWeight:500,color:'#475569',background:'none',border:'none',cursor:'pointer'}}
                                    role="menuitem"
                                  >
                                    <EyeOff size={14} aria-hidden="true" /> Mark as unread
                                  </button>
                                ) : (
                                  <button
                                    onClick={function(e) { e.stopPropagation(); markAsRead(n.id); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                                    style={{fontSize:'13px',fontWeight:500,color:'#475569',background:'none',border:'none',cursor:'pointer'}}
                                    role="menuitem"
                                  >
                                    <Eye size={14} aria-hidden="true" /> Mark as read
                                  </button>
                                )}
                                <div style={{height:'1px',background:'#E2E8F0',margin:'2px 0'}} />
                                <button
                                  onClick={function(e) { e.stopPropagation(); deleteOne(n.id); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-red-50 focus:outline-none focus:bg-red-50"
                                  style={{fontSize:'13px',fontWeight:500,color:'#EF4444',background:'none',border:'none',cursor:'pointer'}}
                                  role="menuitem"
                                >
                                  <Trash2 size={14} aria-hidden="true" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <div style={{textAlign:'center',paddingTop:'8px'}}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  style={{fontSize:'14px',opacity:loadingMore?0.6:1,cursor:loadingMore?'not-allowed':'pointer'}}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}