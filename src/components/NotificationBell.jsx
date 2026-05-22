import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Icon({ path, className, strokeWidth }) {
  var cls = className || 'h-5 w-5';
  var sw = strokeWidth || 2;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={path} />}
    </svg>
  );
}

var ICONS = {
  bell:          ['M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'],
  megaphone:     ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  calendar:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  userPlus:      ['M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'],
  mail:          ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  folder:        'M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  chevRight:     'M9 5l7 7-7 7',
  check:         'M5 13l4 4L19 7',
  pinboard:      ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'M9 12h6M9 16h4'],
  handshake:     ['M16 11l-4 4-4-4', 'M12 3v12', 'M5 19h14'],
  collab:        ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
};

var TYPE_CONFIG = {
  announcement:            { icon: ICONS.megaphone,  color: '#3B82F6' },
  event:                   { icon: ICONS.calendar,   color: '#22C55E' },
  member:                  { icon: ICONS.userPlus,   color: '#8B5CF6' },
  invitation:              { icon: ICONS.mail,       color: '#F5B731' },
  document:                { icon: ICONS.folder,     color: '#64748B' },
  collaboration_request:   { icon: ICONS.collab,     color: '#8B5CF6' },
  collab_request:          { icon: ICONS.collab,     color: '#8B5CF6' },
  collab_invite:           { icon: ICONS.collab,     color: '#8B5CF6' },
  collab_accepted:         { icon: ICONS.collab,     color: '#22C55E' },
  collab_declined:         { icon: ICONS.collab,     color: '#EF4444' },
  community_board_message: { icon: ICONS.pinboard,   color: '#8B5CF6' },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || { icon: ICONS.bell, color: '#64748B' };
}

function getTimeAgo(timestamp) {
  var seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60)     return 'Just now';
  if (seconds < 3600)   return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400)  return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  return new Date(timestamp).toLocaleDateString();
}

function NotificationSkeleton() {
  return (
    <div style={{borderTop:'1px solid #E2E8F0'}}>
      {[0,1,2,3].map(function(i) {
        return (
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'16px',borderBottom:'1px solid #E2E8F0',animationName:'pulse',animationDuration:'2s',animationIterationCount:'infinite'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#E2E8F0',flexShrink:0}} />
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:'8px'}}>
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

function NotificationBell() {
  var navigate = useNavigate();
  var [notifications, setNotifications] = useState([]);
  var [unreadCount, setUnreadCount] = useState(0);
  var [isOpen, setIsOpen] = useState(false);
  var [loading, setLoading] = useState(false);
  var dropdownRef = useRef(null);
  var channel;
  var broadcastChannel;

useEffect(function() {
  fetchNotifications();

var channel;
var setupSubscription = async function() {
  var authData = await supabase.auth.getUser();
  var user = authData.data.user;
  if (!user) return;

  // postgres_changes as fallback
  channel = supabase
    .channel('notifications-db-' + user.id)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      function() { fetchNotifications(); }
    )
    .subscribe();

  // Broadcast for instant cross-browser delivery
  broadcastChannel = supabase
    .channel('user-notif-' + user.id)
    .on('broadcast', { event: 'new_notification' }, function() { fetchNotifications(); })
    .subscribe();
};
setupSubscription();

  // Polling fallback — trigger-inserted rows don't always fire postgres_changes
  var pollInterval = setInterval(function() { fetchNotifications(); }, 60000);

return function() {
  if (channel) supabase.removeChannel(channel);
  if (broadcastChannel) supabase.removeChannel(broadcastChannel);
  clearInterval(pollInterval);
};
}, []);

  useEffect(function() {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return function() { document.removeEventListener('mousedown', handleClickOutside); };
    }
  }, [isOpen]);

  useEffect(function() {
    function handleNotificationCreated() { fetchNotifications(); }
    window.addEventListener('notificationCreated', handleNotificationCreated);
    return function() { window.removeEventListener('notificationCreated', handleNotificationCreated); };
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      var authData = await supabase.auth.getUser();
      var user = authData.data.user;
      if (!user) return;

      var result = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (result.error) throw result.error;

      var data = result.data || [];
      setNotifications(data);
      setUnreadCount(data.filter(function(n) { return !n.read; }).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    try {
      var result = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      if (result.error) throw result.error;
      setNotifications(function(prev) {
        return prev.map(function(n) { return n.id === notificationId ? Object.assign({}, n, { read: true }) : n; });
      });
      setUnreadCount(function(prev) { return Math.max(0, prev - 1); });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      var authData = await supabase.auth.getUser();
      var user = authData.data.user;
      if (!user) return;
      var result = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (result.error) throw result.error;
      setNotifications(function(prev) {
        return prev.map(function(n) { return Object.assign({}, n, { read: true }); });
      });
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  function handleNotificationClick(notification) {
    markAsRead(notification.id);
    if (notification.link) navigate(notification.link);
    setIsOpen(false);
  }

  var labelText = 'Notifications' + (unreadCount > 0 ? ' (' + unreadCount + ' unread)' : '');

  return (
    <div style={{position:'relative'}} ref={dropdownRef}>
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

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{position:'absolute',right:0,marginTop:'8px',width:'384px',background:'#FFFFFF',borderRadius:'12px',boxShadow:'0 10px 25px rgba(0,0,0,0.12)',border:'1px solid #E2E8F0',zIndex:50,maxHeight:'420px',overflow:'hidden',display:'flex',flexDirection:'column'}}
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #E2E8F0',flexShrink:0}}>
            <h3 style={{fontSize:'15px',fontWeight:700,color:'#0E1523',margin:0}}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'12px',color:'#3B82F6',fontWeight:600,border:'none',background:'transparent',cursor:'pointer',padding:'4px 8px',borderRadius:'6px'}}
                className="hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Icon path={ICONS.check} className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{overflowY:'auto',flex:1}} role="list" aria-label="Notification list">
            {loading ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <div style={{textAlign:'center',padding:'48px 16px'}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:'12px'}}>
                  <Icon path={ICONS.bell} className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <p style={{fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'4px'}}>No notifications yet</p>
                <p style={{fontSize:'12px',color:'#64748B',margin:0}}>You'll see updates for events, announcements, and member activity here.</p>
              </div>
            ) : (
              <div>
                {notifications.map(function(notification) {
                  var cfg = getTypeConfig(notification.type);
                  return (
                    <button
                      key={notification.id}
                      onClick={function() { handleNotificationClick(notification); }}
                      role="listitem"
                      style={{width:'100%',textAlign:'left',padding:'14px 16px',borderBottom:'1px solid #E2E8F0',background:notification.read ? '#FFFFFF' : '#EFF6FF',border:'none',borderBottom:'1px solid #E2E8F0',cursor:'pointer',display:'block'}}
                      className="hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                      aria-label={notification.title + (notification.read ? '' : ' (unread)')}
                    >
                      <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
                        {/* Icon bubble */}
                        <div style={{flexShrink:0,width:'34px',height:'34px',borderRadius:'50%',background:cfg.color + '1A',display:'flex',alignItems:'center',justifyContent:'center',marginTop:'2px'}}>
                          <svg xmlns="http://www.w3.org/2000/svg" style={{width:'16px',height:'16px',color:cfg.color}} fill="none" viewBox="0 0 24 24" stroke={cfg.color} aria-hidden="true">
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