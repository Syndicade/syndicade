import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

function Icon({ path, size }) {
  return (
    <svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} d={d} />; })
        : <path d={path} />}
    </svg>
  );
}

var ICONS = {
  hash:    'M4 9h16M4 15h16M10 3L8 21M16 3l-2 18',
  plus:    'M12 4v16m8-8H4',
  send:    'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z',
  trash:   ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:       'M6 18L18 6M6 6l12 12',
  users:   ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75', 'M9 7a4 4 0 100 8 4 4 0 000-8z'],
  chat:    ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  chevron: 'M9 18l6-6-6-6',
  lock:    ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M7 11V7a5 5 0 0110 0v4'],
};

function SkeletonMessages() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} aria-busy="true" aria-label="Loading messages">
      {[1,2,3,4].map(function(i) {
        return (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2A3550', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '120px', height: '11px', background: '#2A3550', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '80%', height: '13px', background: '#1E2845', borderRadius: '4px', marginBottom: '5px' }} />
              <div style={{ width: '60%', height: '13px', background: '#1E2845', borderRadius: '4px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1E2845', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#64748B' }}>
        {icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#64748B', maxWidth: '280px', lineHeight: 1.6, marginBottom: action ? '20px' : '0' }}>{description}</div>
      {action && (
        <button onClick={onAction} style={{ padding: '8px 20px', background: '#3B82F6', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600 transition-colors">
          {action}
        </button>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return '?';
  var parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var now = new Date();
  var isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateDivider(ts) {
  var d = new Date(ts);
  var now = new Date();
  var isToday = d.toDateString() === now.toDateString();
  var yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  var isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function shouldShowDivider(messages, index) {
  if (index === 0) return true;
  var curr = new Date(messages[index].created_at);
  var prev = new Date(messages[index - 1].created_at);
  return curr.toDateString() !== prev.toDateString();
}

export default function OrgChat() {
  var { organizationId } = useParams();
  var navigate = useNavigate();
  var themeCtx = useTheme();
  var isDark = themeCtx ? themeCtx.isDark : true;

  var pageBg      = isDark ? '#0E1523' : '#F8FAFC';
  var sidebarBg   = isDark ? '#151B2D' : '#F1F5F9';
  var cardBg      = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF'  : '#0E1523';
  var textMuted   = isDark ? '#64748B'  : '#94A3B8';
  var inputBg     = isDark ? '#1E2845'  : '#F8FAFC';

  var [currentUser, setCurrentUser] = useState(null);
  var [currentMember, setCurrentMember] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  var [organization, setOrganization] = useState(null);
  var [channels, setChannels] = useState([]);
  var [selectedChannel, setSelectedChannel] = useState(null);
  var [messages, setMessages] = useState([]);
  var [members, setMembers] = useState({});
  var [loadingChannels, setLoadingChannels] = useState(true);
  var [loadingMessages, setLoadingMessages] = useState(false);
  var [messageInput, setMessageInput] = useState('');
  var [sending, setSending] = useState(false);
  var [showNewChannel, setShowNewChannel] = useState(false);
  var [newChannelName, setNewChannelName] = useState('');
  var [newChannelDesc, setNewChannelDesc] = useState('');
  var [creatingChannel, setCreatingChannel] = useState(false);
  var [unreadCounts, setUnreadCounts] = useState({});

  var messagesEndRef = useRef(null);
  var inputRef = useRef(null);
  var realtimeRef = useRef(null);

  useEffect(function() { fetchInitialData(); }, [organizationId]);

  useEffect(function() {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      markChannelRead(selectedChannel.id);
      setupRealtime(selectedChannel.id);
    }
    return function() {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
  }, [selectedChannel]);

  useEffect(function() {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function fetchInitialData() {
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { navigate('/login'); return; }
      setCurrentUser(authResult.data.user);

      var orgResult = await supabase.from('organizations').select('id, name, logo_url').eq('id', organizationId).single();
      if (orgResult.data) setOrganization(orgResult.data);

      var memberResult = await supabase
        .from('memberships')
        .select('id, role, member_id')
        .eq('organization_id', organizationId)
        .eq('member_id', authResult.data.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!memberResult.data) { navigate('/organizations'); return; }
      setIsAdmin(memberResult.data.role === 'admin');

      var profileResult = await supabase
        .from('members')
        .select('user_id, first_name, last_name, avatar_url, profile_photo_url')
        .eq('user_id', authResult.data.user.id)
        .maybeSingle();
      if (profileResult.data) setCurrentMember(profileResult.data);

      await fetchChannels(authResult.data.user.id);
    } catch (err) {
      toast.error('Failed to load chat');
    }
  }

  async function fetchChannels(userId) {
    setLoadingChannels(true);
    try {
      var result = await supabase
        .from('chat_channels')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (result.error) throw result.error;
      var channelList = result.data || [];
      setChannels(channelList);

      // Fetch unread counts
      if (userId && channelList.length > 0) {
        var counts = {};
        for (var i = 0; i < channelList.length; i++) {
          var ch = channelList[i];
          var readResult = await supabase
            .from('chat_reads')
            .select('last_read_at')
            .eq('channel_id', ch.id)
            .eq('member_id', userId)
            .maybeSingle();

          var lastRead = readResult.data ? readResult.data.last_read_at : null;
          var query = supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', ch.id)
            .eq('is_deleted', false);
          if (lastRead) query = query.gt('created_at', lastRead);
          var countResult = await query;
          counts[ch.id] = countResult.count || 0;
        }
        setUnreadCounts(counts);
      }

      if (channelList.length > 0 && !selectedChannel) {
        setSelectedChannel(channelList[0]);
      }
    } catch (err) {
      toast.error('Failed to load channels');
    } finally {
      setLoadingChannels(false);
    }
  }

  async function fetchMessages(channelId) {
    setLoadingMessages(true);
    try {
      var result = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (result.error) throw result.error;
      var msgs = result.data || [];
      setMessages(msgs);

      // Fetch member profiles for senders
      var senderIds = [...new Set(msgs.map(function(m) { return m.sender_id; }).filter(Boolean))];
      if (senderIds.length > 0) {
        var profilesResult = await supabase
          .from('members')
          .select('user_id, first_name, last_name, avatar_url, profile_photo_url')
          .in('user_id', senderIds);
        var profileMap = {};
        (profilesResult.data || []).forEach(function(p) { profileMap[p.user_id] = p; });
        setMembers(function(prev) { return Object.assign({}, prev, profileMap); });
      }
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }

  async function markChannelRead(channelId) {
    if (!currentUser) return;
    await supabase
      .from('chat_reads')
      .upsert({ channel_id: channelId, member_id: currentUser.id, last_read_at: new Date().toISOString() },
        { onConflict: 'channel_id,member_id' });
    setUnreadCounts(function(prev) { return Object.assign({}, prev, { [channelId]: 0 }); });
  }

  function setupRealtime(channelId) {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
    }
    var channel = supabase
      .channel('chat-' + channelId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: 'channel_id=eq.' + channelId,
      }, async function(payload) {
        var newMsg = payload.new;
        if (newMsg.is_deleted) return;

        // Fetch sender profile if not cached
        if (newMsg.sender_id && !members[newMsg.sender_id]) {
          var profileResult = await supabase
            .from('members')
            .select('user_id, first_name, last_name, avatar_url, profile_photo_url')
            .eq('user_id', newMsg.sender_id)
            .maybeSingle();
          if (profileResult.data) {
            setMembers(function(prev) {
              var updated = Object.assign({}, prev);
              updated[newMsg.sender_id] = profileResult.data;
              return updated;
            });
          }
        }

        setMessages(function(prev) {
          var exists = prev.find(function(m) { return m.id === newMsg.id; });
          if (exists) return prev;
          return prev.concat([newMsg]);
        });

        // Mark as read if this channel is active
        markChannelRead(channelId);
      })
      .subscribe();
    realtimeRef.current = channel;
  }

  async function sendMessage() {
    if (!messageInput.trim() || !selectedChannel || !currentUser) return;
    setSending(true);
    var content = messageInput.trim();
    setMessageInput('');
    try {
      var result = await supabase.from('chat_messages').insert({
        channel_id: selectedChannel.id,
        sender_id: currentUser.id,
        content: content,
      });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error('Failed to send message');
      setMessageInput(content);
    } finally {
      setSending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleDeleteMessage(messageId) {
    var result = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId);
    if (result.error) {
      toast.error('Failed to delete message');
    } else {
      setMessages(function(prev) { return prev.filter(function(m) { return m.id !== messageId; }); });
      toast.success('Message deleted');
    }
  }

  async function handleCreateChannel() {
    if (!newChannelName.trim()) { toast.error('Channel name is required'); return; }
    setCreatingChannel(true);
    try {
      var result = await supabase.from('chat_channels').insert({
        organization_id: organizationId,
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: newChannelDesc.trim() || null,
        created_by: currentUser.id,
      }).select().single();
      if (result.error) throw result.error;
      toast.success('Channel created');
      setShowNewChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setChannels(function(prev) { return prev.concat([result.data]); });
      setSelectedChannel(result.data);
    } catch (err) {
      toast.error('Failed to create channel');
    } finally {
      setCreatingChannel(false);
    }
  }

  async function handleDeleteChannel(channel) {
    if (!window.confirm('Delete #' + channel.name + '? All messages will be lost.')) return;
    var result = await supabase.from('chat_channels').delete().eq('id', channel.id);
    if (result.error) {
      toast.error('Failed to delete channel');
    } else {
      toast.success('Channel deleted');
      var remaining = channels.filter(function(c) { return c.id !== channel.id; });
      setChannels(remaining);
      setSelectedChannel(remaining.length > 0 ? remaining[0] : null);
      setMessages([]);
    }
  }

  function getSenderName(senderId) {
    var m = members[senderId];
    if (!m) return 'Unknown';
    return (m.first_name || '') + ' ' + (m.last_name || '');
  }

  function getSenderAvatar(senderId) {
    var m = members[senderId];
    return m ? (m.avatar_url || m.profile_photo_url || null) : null;
  }

  var isCurrentUser = function(senderId) { return currentUser && senderId === currentUser.id; };

  return (
    <div style={{ background: pageBg, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Page Header */}
      <div style={{ background: isDark ? '#151B2D' : '#FFFFFF', borderBottom: '1px solid ' + borderColor, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#F5B731' }}><Icon path={ICONS.chat} size={20} /></div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: textPrimary, margin: 0 }}>
            {organization ? organization.name + ' — Chat' : 'Chat'}
          </h1>
          <p style={{ fontSize: '12px', color: textMuted, margin: 0 }}>{channels.length} channel{channels.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 69px)', overflow: 'hidden' }}>

        {/* Left — Channel list */}
        <div style={{ width: '240px', flexShrink: 0, background: sidebarBg, borderRight: '1px solid ' + borderColor, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Channels header */}
          <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px' }}>Channels</span>
            {isAdmin && (
              <button
                onClick={function() { setShowNewChannel(true); }}
                aria-label="Create new channel"
                style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Icon path={ICONS.plus} size={14} />
              </button>
            )}
          </div>

          {/* Channel list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }} role="list" aria-label="Channels">
            {loadingChannels ? (
              <div style={{ padding: '8px' }}>
                {[1,2,3].map(function(i) {
                  return <div key={i} style={{ height: '32px', background: borderColor, borderRadius: '6px', marginBottom: '4px' }} />;
                })}
              </div>
            ) : channels.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: textMuted, fontSize: '12px' }}>
                {isAdmin ? 'Create your first channel' : 'No channels yet'}
              </div>
            ) : (
              channels.map(function(ch) {
                var isSelected = selectedChannel && selectedChannel.id === ch.id;
                var unread = unreadCounts[ch.id] || 0;
                return (
                  <button
                    key={ch.id}
                    role="listitem"
                    onClick={function() { setSelectedChannel(ch); }}
                    aria-label={'Channel ' + ch.name + (unread > 0 ? ', ' + unread + ' unread' : '')}
                    aria-current={isSelected ? 'true' : undefined}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                      padding: '7px 10px', borderRadius: '6px', marginBottom: '2px',
                      background: isSelected ? (isDark ? '#1E2845' : '#E2E8F0') : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      color: isSelected ? textPrimary : (unread > 0 ? textPrimary : textMuted),
                      fontWeight: unread > 0 ? 700 : 500,
                      fontSize: '13px',
                    }}
                    className="hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                  >
                    <span style={{ color: isSelected ? '#F5B731' : textMuted, flexShrink: 0 }}>
                      <Icon path={ICONS.hash} size={13} />
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
                    {unread > 0 && (
                      <span style={{ background: '#3B82F6', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', flexShrink: 0 }}>
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right — Message area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: pageBg }}>

          {!selectedChannel ? (
            <EmptyState
              icon={<Icon path={ICONS.chat} size={28} />}
              title="No channel selected"
              description={isAdmin ? 'Create a channel to start chatting with your team.' : 'Select a channel from the list to start reading.'}
              action={isAdmin ? 'Create Channel' : null}
              onAction={function() { setShowNewChannel(true); }}
            />
          ) : (
            <>
              {/* Channel header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + borderColor, display: 'flex', alignItems: 'center', gap: '10px', background: isDark ? '#151B2D' : '#FFFFFF', flexShrink: 0 }}>
                <span style={{ color: '#F5B731' }}><Icon path={ICONS.hash} size={16} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>{selectedChannel.name}</div>
                  {selectedChannel.description && (
                    <div style={{ fontSize: '12px', color: textMuted }}>{selectedChannel.description}</div>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={function() { handleDeleteChannel(selectedChannel); }}
                    aria-label={'Delete channel ' + selectedChannel.name}
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid ' + borderColor, background: 'transparent', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                    className="hover:border-red-500 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  >
                    <Icon path={ICONS.trash} size={13} />
                    Delete
                  </button>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }} role="log" aria-label={'Messages in ' + selectedChannel.name} aria-live="polite">
                {loadingMessages ? (
                  <SkeletonMessages />
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={<Icon path={ICONS.chat} size={24} />}
                    title={'Welcome to #' + selectedChannel.name}
                    description={selectedChannel.description || 'This is the beginning of this channel. Say hello!'}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {messages.map(function(msg, index) {
                      var showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id || shouldShowDivider(messages, index);
                      var avatarUrl = getSenderAvatar(msg.sender_id);
                      var senderName = getSenderName(msg.sender_id);
                      var isMine = isCurrentUser(msg.sender_id);

                      return (
                        <div key={msg.id}>
                          {/* Date divider */}
                          {shouldShowDivider(messages, index) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 12px' }} aria-label={formatDateDivider(msg.created_at)}>
                              <div style={{ flex: 1, height: '1px', background: borderColor }} />
                              <span style={{ fontSize: '11px', fontWeight: 600, color: textMuted, whiteSpace: 'nowrap' }}>{formatDateDivider(msg.created_at)}</span>
                              <div style={{ flex: 1, height: '1px', background: borderColor }} />
                            </div>
                          )}

                          {/* Message */}
                          <div
                            style={{ display: 'flex', gap: '10px', padding: '3px 0', alignItems: 'flex-start' }}
                            className="group"
                          >
                            {/* Avatar */}
                            <div style={{ width: '36px', flexShrink: 0, paddingTop: showAvatar ? '0' : '0' }}>
                              {showAvatar ? (
                                avatarUrl ? (
                                  <img src={avatarUrl} alt={senderName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + borderColor }} />
                                ) : (
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isMine ? '#1D3461' : '#1E2845', border: '1px solid ' + borderColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: isMine ? '#60A5FA' : '#94A3B8' }}>
                                    {getInitials(senderName)}
                                  </div>
                                )
                              ) : (
                                <div style={{ width: '36px' }} />
                              )}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {showAvatar && (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: isMine ? '#60A5FA' : textPrimary }}>{senderName}</span>
                                  <span style={{ fontSize: '11px', color: textMuted }}>{formatTime(msg.created_at)}</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <p style={{ fontSize: '14px', color: isDark ? '#CBD5E1' : '#374151', lineHeight: 1.6, margin: 0, wordBreak: 'break-word', flex: 1, whiteSpace: 'pre-wrap' }}>
                                  {msg.content}
                                </p>
                                {(isMine || isAdmin) && (
                                  <button
                                    onClick={function() { handleDeleteMessage(msg.id); }}
                                    aria-label="Delete message"
                                    style={{ padding: '3px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', opacity: 0, flexShrink: 0 }}
                                    className="group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-opacity"
                                  >
                                    <Icon path={ICONS.trash} size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid ' + borderColor, background: isDark ? '#151B2D' : '#FFFFFF', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '8px 12px' }}>
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={function(e) { setMessageInput(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    placeholder={'Message #' + selectedChannel.name}
                    rows={1}
                    aria-label={'Type a message in ' + selectedChannel.name}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: textPrimary, fontSize: '14px', lineHeight: 1.5, fontFamily: 'inherit', maxHeight: '120px', overflowY: 'auto' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !messageInput.trim()}
                    aria-label="Send message"
                    style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', background: messageInput.trim() ? '#3B82F6' : borderColor, color: messageInput.trim() ? '#FFFFFF' : textMuted, cursor: messageInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, flexShrink: 0, transition: 'all 0.15s' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Icon path={ICONS.send} size={14} />
                    Send
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: textMuted, marginTop: '6px', paddingLeft: '2px' }}>
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
          role="dialog" aria-modal="true" aria-labelledby="new-channel-title">
          <div style={{ background: cardBg, borderRadius: '16px', width: '100%', maxWidth: '440px', border: '1px solid ' + borderColor }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + borderColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 id="new-channel-title" style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, margin: 0 }}>Create Channel</h2>
              <button onClick={function() { setShowNewChannel(false); }} aria-label="Close" style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer' }}
                className="hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Icon path={ICONS.x} size={18} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="channel-name" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
                  Channel Name <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', padding: '8px 12px' }}>
                  <span style={{ color: textMuted }}><Icon path={ICONS.hash} size={14} /></span>
                  <input
                    id="channel-name"
                    type="text"
                    value={newChannelName}
                    onChange={function(e) { setNewChannelName(e.target.value); }}
                    placeholder="e.g. general, board, volunteers"
                    aria-required="true"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: textPrimary, fontSize: '14px', fontFamily: 'inherit' }}
                    onKeyDown={function(e) { if (e.key === 'Enter') handleCreateChannel(); }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="channel-desc" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
                  Description <span style={{ color: textMuted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  id="channel-desc"
                  type="text"
                  value={newChannelDesc}
                  onChange={function(e) { setNewChannelDesc(e.target.value); }}
                  placeholder="What's this channel for?"
                  style={{ width: '100%', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', padding: '8px 12px', color: textPrimary, fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={function() { setShowNewChannel(false); }} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid ' + borderColor, background: 'transparent', color: textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  className="hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400">
                  Cancel
                </button>
                <button onClick={handleCreateChannel} disabled={creatingChannel || !newChannelName.trim()} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: newChannelName.trim() ? '#3B82F6' : borderColor, color: newChannelName.trim() ? '#FFFFFF' : textMuted, fontSize: '13px', fontWeight: 600, cursor: newChannelName.trim() ? 'pointer' : 'not-allowed' }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                  {creatingChannel ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}