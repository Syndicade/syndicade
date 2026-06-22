import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Icon({ path, className, strokeWidth }) {
  var cls = className || 'h-5 w-5';
  var sw  = strokeWidth || 2;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={path} />}
    </svg>
  );
}

var ICONS = {
  bell:      ['M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'],
  megaphone: ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  userPlus:  ['M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'],
  mail:      ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  folder:    'M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  chevRight: 'M9 5l7 7-7 7',
  x:         'M6 18L18 6M6 6l12 12',
  pinboard:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'M9 12h6M9 16h4'],
  collab:    ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
  poll:      ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'M9 12h3m0 0h3m-3 0v3m0-3V9'],
  photo:     ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  program:   ['M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'],
  signup:    ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 11v4m-2-2h4'],
  document:  ['M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'],
};

// ── Type → icon / color / link ─────────────────────────────────────────────
// IMPORTANT: all linkFn references use n.organization_id (not n.org_id).
// The notifications table column is organization_id.
var TYPE_CONFIG = {
  announcement:            { icon: ICONS.megaphone, color: '#3B82F6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/announcements' : (n.link || null); } },
  new_announcement:        { icon: ICONS.megaphone, color: '#3B82F6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/announcements' : (n.link || null); } },
  event:                   { icon: ICONS.calendar,  color: '#22C55E',  linkFn: function(n) { return n.link || null; } },
  new_event:               { icon: ICONS.calendar,  color: '#22C55E',  linkFn: function(n) { return n.link || null; } },
  event_reminder:          { icon: ICONS.calendar,  color: '#F5B731',  linkFn: function(n) { return n.link || null; } },
  event_rsvp:              { icon: ICONS.calendar,  color: '#22C55E',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : (n.link || null); } },
  member:                  { icon: ICONS.userPlus,  color: '#8B5CF6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/members' : (n.link || null); } },
  member_joined:           { icon: ICONS.userPlus,  color: '#8B5CF6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/members' : (n.link || null); } },
  invitation:              { icon: ICONS.mail,      color: '#F5B731',  linkFn: function(n) { return n.link || null; } },
  invite_received:         { icon: ICONS.mail,      color: '#F5B731',  linkFn: function(n) { return n.link || null; } },
  document:                { icon: ICONS.document,  color: '#64748B',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/documents' : (n.link || null); } },
  new_document:            { icon: ICONS.document,  color: '#64748B',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/documents' : (n.link || null); } },
  collaboration_request:   { icon: ICONS.collab,    color: '#8B5CF6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : (n.link || null); } },
  collab_request:          { icon: ICONS.collab,    color: '#8B5CF6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : (n.link || null); } },
  collab_invite:           { icon: ICONS.collab,    color: '#8B5CF6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : (n.link || null); } },
  collab_accepted:         { icon: ICONS.collab,    color: '#22C55E',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : (n.link || null); } },
  collab_declined:         { icon: ICONS.collab,    color: '#EF4444',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : (n.link || null); } },
  community_board_message: { icon: ICONS.pinboard,  color: '#8B5CF6',  linkFn: function(n) { return n.link || null; } },
  board_reply:             { icon: ICONS.pinboard,  color: '#8B5CF6',  linkFn: function(n) { return n.link || null; } },
  new_poll:                { icon: ICONS.poll,      color: '#3B82F6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/polls' : (n.link || null); } },
  new_survey:              { icon: ICONS.poll,      color: '#8B5CF6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/surveys' : (n.link || null); } },
  new_photo:               { icon: ICONS.photo,     color: '#22C55E',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/photos' : (n.link || null); } },
  new_program:             { icon: ICONS.program,   color: '#F5B731',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/programs' : (n.link || null); } },
  program_registration:    { icon: ICONS.program,   color: '#F5B731',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/programs' : (n.link || null); } },
  new_signup_form:         { icon: ICONS.signup,    color: '#3B82F6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/signup-forms' : (n.link || null); } },
  inbox_message:           { icon: ICONS.mail,      color: '#3B82F6',  linkFn: function(n) { return n.organization_id ? '/organizations/' + n.organization_id + '/inbox' : (n.link || null); } },
  new_opportunity:         { icon: ICONS.program,   color: '#3B82F6', linkFn: function(n) { return n.link || (n.organization_id ? '/organizations/' + n.organization_id + '/opportunities' : null); } },
  new_funding:             { icon: ICONS.program,   color: '#16A34A', linkFn: function(n) { return n.link || (n.organization_id ? '/organizations/' + n.organization_id + '/funding' : null); } },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || { icon: ICONS.bell, color: '#64748B', linkFn: function(n) { return n.link || null; } };
}

function resolveLink(notification) {
  var cfg = getTypeConfig(notification.type);
  return (cfg.linkFn && cfg.linkFn(notification)) || notification.link || null;
}

// ── Time helpers ──────────────────────────────────────────────────────────────
function getTimeAgo(timestamp) {
  var seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60)     return 'Just now';
  if (seconds < 3600)   return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400)  return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  return new Date(timestamp).toLocaleDateString();
}

function getDayBucket(timestamp) {
  var now  = new Date();
  var date = new Date(timestamp);
  var diffD = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000);
  if (diffD === 0) return 'Today';
  if (diffD === 1) return 'Yesterday';
  return 'Earlier';
}

function groupNotifications(list) {
  var order   = ['Today', 'Yesterday', 'Earlier'];
  var buckets = { Today: [], Yesterday: [], Earlier: [] };
  list.forEach(function(n) { buckets[getDayBucket(n.created_at)].push(n); });
  return order.filter(function(k) { return buckets[k].length > 0; }).map(function(k) { return { label: k, items: buckets[k] }; });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function NotificationSkeleton() {
  return (
    <div style={{borderTop:'1px solid #E2E8F0'}}>
      {[0,1,2,3].map(function(i) {
        return (
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'16px',borderBottom:'1px solid #E2E8F0'}}>
            <div className="animate-pulse" style={{width:'32px',height:'32px',borderRadius:'50%',background:'#E2E8F0',flexShrink:0}} />
            <div className="animate-pulse" style={{flex:1,display:'flex',flexDirection:'column',gap:'8px'}}>
              <div style={{height:'12px',background:'#E2E8F0',borderRadius:'4px',width:'75%'}} />
              <div style={{height:'12px',background:'#E2E8F0',borderRadius:'4px',width:'100%'}} />
              <div style={{height:'10px',background:'#E2E8F0',borderRadius:'4px',width:'33%'}} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function NotificationBell() {
  var navigate     = useNavigate();
  var dropdownRef  = useRef(null);
  var lastFetchRef = useRef(null);

  var [notifications, setNotifications] = useState([]);
  var [unreadCount,   setUnreadCount]   = useState(0);
  var [isOpen,        setIsOpen]        = useState(false);
  var [loading,       setLoading]       = useState(false);
  var [newIds,        setNewIds]        = useState({});

  var fetchAll = useCallback(async function() {
    try {
      setLoading(true);
      var authData = await supabase.auth.getUser();
      var user = authData.data && authData.data.user;
      if (!user) return;

      var result = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (result.error) throw result.error;
      var data = result.data || [];

      setNotifications(data);
      setUnreadCount(data.filter(function(n) { return !n.read; }).length);
      if (data.length > 0) lastFetchRef.current = data[0].created_at;
    } catch (err) {
      console.error('NotificationBell fetchAll error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  var fetchIncremental = useCallback(async function() {
    try {
      var authData = await supabase.auth.getUser();
      var user = authData.data && authData.data.user;
      if (!user) return;

      var query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (lastFetchRef.current) {
        query = query.gt('created_at', lastFetchRef.current);
      }

      var result = await query;
      if (result.error) throw result.error;
      var incoming = result.data || [];
      if (incoming.length === 0) return;

      var newIdMap = {};
      incoming.forEach(function(n) { newIdMap[n.id] = true; });
      setNewIds(function(prev) { return Object.assign({}, prev, newIdMap); });

      setTimeout(function() {
        setNewIds(function(prev) {
          var next = Object.assign({}, prev);
          incoming.forEach(function(n) { delete next[n.id]; });
          return next;
        });
      }, 3000);

      setNotifications(function(prev) {
        var existingIds = {};
        prev.forEach(function(n) { existingIds[n.id] = true; });
        var truly_new = incoming.filter(function(n) { return !existingIds[n.id]; });
        if (truly_new.length === 0) return prev;
        var merged = truly_new.concat(prev).slice(0, 30);
        lastFetchRef.current = merged[0].created_at;
        return merged;
      });

      setUnreadCount(function(prev) {
        var newUnread = incoming.filter(function(n) { return !n.read; }).length;
        return prev + newUnread;
      });
    } catch (err) {
      console.error('NotificationBell fetchIncremental error:', err);
    }
  }, []);

  useEffect(function() {
    fetchAll();

    var dbChannel        = null;
    var broadcastChannel = null;
    var pollInterval     = null;

    async function setup() {
      var authData = await supabase.auth.getUser();
      var user = authData.data && authData.data.user;
      if (!user) return;
      var userId = user.id;

      dbChannel = supabase
        .channel('notif-db-' + userId)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + userId },
          function() { fetchIncremental(); }
        )
        .subscribe(function(status) {
          if (status === 'SUBSCRIBED' && dbChannel._prevStatus === 'CLOSED') fetchIncremental();
          dbChannel._prevStatus = status;
        });

      broadcastChannel = supabase
        .channel('notif-broadcast-' + userId)
        .on('broadcast', { event: 'new_notification' }, function() { fetchIncremental(); })
        .subscribe();

      pollInterval = setInterval(function() { fetchIncremental(); }, 30000);
    }

    setup();

    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchIncremental();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    function handleCustomEvent() { fetchIncremental(); }
    window.addEventListener('notificationCreated', handleCustomEvent);

    return function() {
      if (dbChannel)        supabase.removeChannel(dbChannel);
      if (broadcastChannel) supabase.removeChannel(broadcastChannel);
      if (pollInterval)     clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('notificationCreated', handleCustomEvent);
    };
  }, [fetchAll, fetchIncremental]);

  useEffect(function() {
    if (isOpen) fetchAll();
  }, [isOpen, fetchAll]);

  useEffect(function() {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return function() { document.removeEventListener('mousedown', handleClickOutside); };
    }
  }, [isOpen]);

  async function markAsRead(notificationId) {
    try {
      var result = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      if (result.error) throw result.error;
      setNotifications(function(prev) {
        return prev.map(function(n) { return n.id === notificationId ? Object.assign({}, n, { read: true }) : n; });
      });
      setUnreadCount(function(prev) { return Math.max(0, prev - 1); });
    } catch (err) { console.error('markAsRead error:', err); }
  }

  async function markAllAsRead() {
    try {
      var authData = await supabase.auth.getUser();
      var user = authData.data && authData.data.user;
      if (!user) return;
      var result = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      if (result.error) throw result.error;
      setNotifications(function(prev) { return prev.map(function(n) { return Object.assign({}, n, { read: true }); }); });
      setUnreadCount(0);
    } catch (err) { console.error('markAllAsRead error:', err); }
  }

  async function dismissNotification(e, notificationId) {
    e.stopPropagation();
    setNotifications(function(prev) { return prev.filter(function(n) { return n.id !== notificationId; }); });
    setUnreadCount(function(prev) {
      var wasUnread = notifications.find(function(n) { return n.id === notificationId && !n.read; });
      return wasUnread ? Math.max(0, prev - 1) : prev;
    });
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
    } catch (err) { console.error('dismissNotification error:', err); }
  }

  function handleNotificationClick(notification) {
    if (!notification.read) markAsRead(notification.id);
    var link = resolveLink(notification);
    if (link) navigate(link);
    setIsOpen(false);
  }

  var groups = groupNotifications(notifications);
  var labelText = 'Notifications' + (unreadCount > 0 ? ' (' + unreadCount + ' unread)' : '');

  return (
    <div style={{position:'relative'}} ref={dropdownRef}>

      {/* Shared sweep keyframe for "new" notification rows — hoisted out of
          the row loop (was previously injected once per row). */}
      <style>{'@keyframes slideInLeft{from{transform:translateX(-12px);opacity:0}to{transform:translateX(0);opacity:1}}'}</style>

      {/* Bell button */}
      <button
        onClick={function() { setIsOpen(!isOpen); }}
        style={{position:'relative',padding:'8px',color:'#475569',borderRadius:'8px',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
        aria-label={labelText}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Icon path={ICONS.bell} className="w-6 h-6" />
        {unreadCount > 0 && (
          <span
            style={{position:'absolute',top:0,right:0,minWidth:'20px',height:'20px',padding:'0 4px',fontSize:'11px',fontWeight:700,color:'#FFFFFF',background:'#EF4444',borderRadius:'99px',border:'2px solid #FFFFFF',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}
            aria-hidden="true"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — Floating elevation per §12: 380px width, 0.5px border, exact shadow token */}
      {isOpen && (
        <div
          style={{position:'absolute',right:0,marginTop:'8px',width:'380px',background:'#FFFFFF',borderRadius:'12px',boxShadow:'0 4px 24px rgba(0,0,0,0.12)',border:'0.5px solid #E2E8F0',zIndex:50,maxHeight:'480px',overflow:'hidden',display:'flex',flexDirection:'column'}}
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #E2E8F0',flexShrink:0}}>
            <h3 style={{fontSize:'15px',fontWeight:700,color:'#0E1523',margin:0}}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{display:'inline-flex',alignItems:'center',fontSize:'12px',color:'#3B82F6',fontWeight:600,border:'none',background:'transparent',cursor:'pointer',padding:'4px 8px',borderRadius:'6px'}}
                className="hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{overflowY:'auto',flex:1}} role="list" aria-label="Notification list">
            {loading && notifications.length === 0 ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <div style={{textAlign:'center',padding:'48px 16px'}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:'12px',color:'#CBD5E1'}}>
                  <Icon path={ICONS.bell} className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <p style={{fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'4px'}}>No notifications yet</p>
                <p style={{fontSize:'12px',color:'#64748B',margin:0}}>You'll see updates for events, announcements, and member activity here.</p>
              </div>
            ) : (
              <div>
                {groups.map(function(group) {
                  return (
                    <div key={group.label}>
                      <div style={{padding:'8px 16px 4px',background:'#F8FAFC',borderBottom:'1px solid #E2E8F0',borderTop:'1px solid #E2E8F0'}}>
                        <span style={{fontSize:'11px',fontWeight:700,color:'#64748B',letterSpacing:'4px',textTransform:'uppercase'}}>{group.label}</span>
                      </div>

                      {group.items.map(function(notification) {
                        var cfg   = getTypeConfig(notification.type);
                        var isNew = newIds[notification.id] || false;
                        return (
                          <div
                            key={notification.id}
                            role="listitem"
                            style={{
                              position:'relative',
                              background: isNew ? '#F0FDF4' : (notification.read ? '#FFFFFF' : '#EFF6FF'),
                              borderBottom:'1px solid #E2E8F0',
                              transition:'background 0.4s ease',
                              animation: isNew ? 'slideInLeft 0.3s ease' : 'none',
                            }}
                          >
                            <button
                              onClick={function() { handleNotificationClick(notification); }}
                              style={{width:'100%',textAlign:'left',padding:'14px 40px 14px 16px',background:'transparent',border:'none',cursor:'pointer',display:'block'}}
                              className="hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                              aria-label={notification.title + (notification.read ? '' : ' (unread)')}
                            >
                              <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
                                {/* Icon bubble */}
                                <div style={{flexShrink:0,width:'34px',height:'34px',borderRadius:'50%',background:cfg.color + '1A',display:'flex',alignItems:'center',justifyContent:'center',marginTop:'2px'}}>
                                  <svg xmlns="http://www.w3.org/2000/svg" style={{width:'16px',height:'16px'}} fill="none" viewBox="0 0 24 24" stroke={cfg.color} aria-hidden="true">
                                    {Array.isArray(cfg.icon)
                                      ? cfg.icon.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
                                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />}
                                  </svg>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <p style={{fontSize:'13px',fontWeight:notification.read ? 400 : 700,color:'#0E1523',margin:'0 0 2px 0',lineHeight:1.4}}>
                                    {notification.title}
                                  </p>
                                  <p style={{fontSize:'12px',color:'#475569',margin:'0 0 4px 0',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                                    {notification.message}
                                  </p>
                                  <p style={{fontSize:'11px',color:'#94A3B8',margin:0}}>
                                    {getTimeAgo(notification.created_at)}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <span style={{width:'8px',height:'8px',background:'#3B82F6',borderRadius:'50%',flexShrink:0,marginTop:'6px'}} aria-hidden="true" />
                                )}
                              </div>
                            </button>

                            {/* Dismiss */}
                            <button
                              onClick={function(e) { dismissNotification(e, notification.id); }}
                              style={{position:'absolute',top:'12px',right:'10px',padding:'4px',color:'#CBD5E1',background:'transparent',border:'none',cursor:'pointer',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center'}}
                              className="hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                              aria-label={'Dismiss notification: ' + notification.title}
                            >
                              <Icon path={ICONS.x} className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{padding:'12px 16px',borderTop:'1px solid #E2E8F0',flexShrink:0}}>
              <button
                onClick={function() { navigate('/notifications'); setIsOpen(false); }}
                style={{width:'100%',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'4px',fontSize:'13px',color:'#3B82F6',fontWeight:600,border:'none',background:'transparent',cursor:'pointer',padding:'6px',borderRadius:'6px'}}
                className="hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                View all notifications
                <Icon path={ICONS.chevRight} className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;