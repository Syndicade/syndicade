import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// Light theme tokens — no dark theme
var BG         = '#F8FAFC';
var SIDEBAR_BG = '#F1F5F9';
var CARD_BG    = '#FFFFFF';
var BORDER     = '#E2E8F0';
var TEXT       = '#0E1523';
var TEXT2      = '#475569';
var MUTED      = '#64748B';
var INPUT_BG   = '#F8FAFC';

var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
function getAvatarColor(name) {
  var char = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[char % AVATAR_COLORS.length];
}

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
  plus:    'M12 4v16m8-8H4',
  send:    'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z',
  trash:   ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:       'M6 18L18 6M6 6l12 12',
  users:   ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75', 'M9 7a4 4 0 100 8 4 4 0 000-8z'],
  chat:    ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  lock:    ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M7 11V7a5 5 0 0110 0v4'],
  shield:  ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  globe:   'M12 2a10 10 0 100 20A10 10 0 0012 2z',
  tag:     ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z', 'M7 7h.01'],
};

function SkeletonMessages() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} aria-busy="true" aria-label="Loading messages">
      {[1,2,3,4].map(function(i) {
        return (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '120px', height: '11px', background: '#E2E8F0', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '80%', height: '13px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '5px' }} />
              <div style={{ width: '60%', height: '13px', background: '#F1F5F9', borderRadius: '4px' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonMembers() {
  return (
    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1,2,3,4,5].map(function(i) {
        return (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E2E8F0', flexShrink: 0 }} />
            <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '4px', width: '70%' }} />
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon, title, description, action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: MUTED }}>
        {icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: MUTED, maxWidth: '280px', lineHeight: 1.6, marginBottom: action ? '20px' : '0' }}>{description}</div>
      {action && (
        <button onClick={onAction}
          style={{ padding: '8px 20px', background: '#3B82F6', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          className={'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600 transition-colors'}>
          {action}
        </button>
      )}
    </div>
  );
}

function MemberRow({ membership }) {
  var profile = membership.members;
  if (!profile) return null;
  var name = (((profile.first_name || '') + ' ' + (profile.last_name || '')).trim()) || 'Unknown';
  var avatarUrl = profile.avatar_url || profile.profile_photo_url || null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px' }}
      className={'hover:bg-slate-50'}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name}
          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + BORDER, flexShrink: 0 }} />
      ) : (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: getAvatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
          {getInitials(name)}
        </div>
      )}
      <span style={{ fontSize: '12px', fontWeight: membership.role === 'admin' ? 600 : 500, color: membership.role === 'admin' ? TEXT : TEXT2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
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

function getAudienceLabel(ch) {
  if (!ch || !ch.visibility || ch.visibility === 'all') return null;
  if (ch.visibility === 'admins') return 'Admins Only';
  if (ch.audience_label) return ch.audience_label;
  if (ch.visibility === 'group') return 'Group';
  if (ch.visibility === 'tier') return 'Tier';
  return null;
}

export default function OrgChat() {
  var { organizationId } = useParams();
  var navigate = useNavigate();

  var [currentUser,       setCurrentUser]       = useState(null);
  var [currentMember,     setCurrentMember]     = useState(null);
  var [isAdmin,           setIsAdmin]           = useState(false);
  var [organization,      setOrganization]      = useState(null);
  var [channels,          setChannels]          = useState([]);
  var [selectedChannel,   setSelectedChannel]   = useState(null);
  var [messages,          setMessages]          = useState([]);
  var [memberProfiles,    setMemberProfiles]    = useState({});
  var [loadingChannels,   setLoadingChannels]   = useState(true);
  var [loadingMessages,   setLoadingMessages]   = useState(false);
  var [messageInput,      setMessageInput]      = useState('');
  var [sending,           setSending]           = useState(false);
  var [unreadCounts,      setUnreadCounts]      = useState({});

  // New channel modal
  var [showNewChannel,        setShowNewChannel]        = useState(false);
  var [newChannelName,        setNewChannelName]        = useState('');
  var [newChannelDesc,        setNewChannelDesc]        = useState('');
  var [newChannelVisibility,  setNewChannelVisibility]  = useState('all');
  var [newChannelAudienceId,  setNewChannelAudienceId]  = useState('');
  var [creatingChannel,       setCreatingChannel]       = useState(false);

  // Members panel
  var [showMembersPanel,  setShowMembersPanel]  = useState(false);
  var [orgMembers,        setOrgMembers]        = useState([]);
  var [loadingMembers,    setLoadingMembers]    = useState(false);

  // Audience options for channel creation
  var [orgGroups,         setOrgGroups]         = useState([]);
  var [membershipTiers,   setMembershipTiers]   = useState([]);

  var messagesEndRef = useRef(null);
  var inputRef       = useRef(null);
  var realtimeRef    = useRef(null);

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

  useEffect(function() { scrollToBottom(); }, [messages]);

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

      // Load groups for channel audience picker
      try {
        var groupsResult = await supabase.from('org_groups').select('id, name').eq('organization_id', organizationId).order('name');
        if (groupsResult.data) setOrgGroups(groupsResult.data);
      } catch(e) { /* table may not exist */ }

      // Load membership tiers
      try {
        var tiersResult = await supabase.from('membership_tiers').select('id, name').eq('organization_id', organizationId).order('name');
        if (tiersResult.data) setMembershipTiers(tiersResult.data);
      } catch(e) { /* ignore */ }

      await fetchChannels(authResult.data.user.id);
    } catch (err) {
      mascotErrorToast('Failed to load chat');
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
          var q = supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', ch.id)
            .eq('is_deleted', false);
          if (lastRead) q = q.gt('created_at', lastRead);
          var countResult = await q;
          counts[ch.id] = countResult.count || 0;
        }
        setUnreadCounts(counts);
      }

      if (channelList.length > 0 && !selectedChannel) {
        setSelectedChannel(channelList[0]);
      }
    } catch (err) {
      mascotErrorToast('Failed to load channels');
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

      var senderIds = [];
      var seen = {};
      msgs.forEach(function(m) {
        if (m.sender_id && !seen[m.sender_id]) { senderIds.push(m.sender_id); seen[m.sender_id] = true; }
      });

      if (senderIds.length > 0) {
        var profilesResult = await supabase
          .from('members')
          .select('user_id, first_name, last_name, avatar_url, profile_photo_url')
          .in('user_id', senderIds);
        var profileMap = {};
        (profilesResult.data || []).forEach(function(p) { profileMap[p.user_id] = p; });
        setMemberProfiles(function(prev) { return Object.assign({}, prev, profileMap); });
      }
    } catch (err) {
      mascotErrorToast('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }

  async function fetchOrgMembers() {
    setLoadingMembers(true);
    try {
      var result = await supabase
        .from('memberships')
        .select('role, member_id, members(user_id, first_name, last_name, avatar_url, profile_photo_url)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('role');
      if (result.error) throw result.error;
      setOrgMembers(result.data || []);
    } catch(err) {
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  }

  function handleToggleMembersPanel() {
    setShowMembersPanel(function(prev) {
      if (!prev && orgMembers.length === 0) fetchOrgMembers();
      return !prev;
    });
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
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    var channel = supabase
      .channel('chat-' + channelId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: 'channel_id=eq.' + channelId,
      }, async function(payload) {
        var newMsg = payload.new;
        if (newMsg.is_deleted) return;
        if (newMsg.sender_id && !memberProfiles[newMsg.sender_id]) {
          var pr = await supabase.from('members')
            .select('user_id, first_name, last_name, avatar_url, profile_photo_url')
            .eq('user_id', newMsg.sender_id).maybeSingle();
          if (pr.data) {
            setMemberProfiles(function(prev) {
              var u = Object.assign({}, prev);
              u[newMsg.sender_id] = pr.data;
              return u;
            });
          }
        }
        setMessages(function(prev) {
          if (prev.find(function(m) { return m.id === newMsg.id; })) return prev;
          return prev.concat([newMsg]);
        });
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function handleDeleteMessage(messageId) {
    var result = await supabase.from('chat_messages').update({ is_deleted: true }).eq('id', messageId);
    if (result.error) {
      mascotErrorToast('Failed to delete message');
    } else {
      setMessages(function(prev) { return prev.filter(function(m) { return m.id !== messageId; }); });
      mascotSuccessToast('Message deleted');
    }
  }

  async function handleCreateChannel() {
    if (!newChannelName.trim()) { toast.error('Channel name is required'); return; }
    setCreatingChannel(true);
    try {
      // Build audience_label for display
      var audienceLabel = null;
      if (newChannelVisibility === 'admins') audienceLabel = 'Admins Only';
      if (newChannelVisibility === 'group' && newChannelAudienceId) {
        var grp = orgGroups.find(function(g) { return g.id === newChannelAudienceId; });
        audienceLabel = grp ? grp.name : 'Group';
      }
      if (newChannelVisibility === 'tier' && newChannelAudienceId) {
        var tier = membershipTiers.find(function(t) { return t.id === newChannelAudienceId; });
        audienceLabel = tier ? tier.name : 'Tier';
      }

      var insertData = {
        organization_id: organizationId,
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
        description: newChannelDesc.trim() || null,
        created_by: currentUser.id,
        visibility: newChannelVisibility,
        audience_id: newChannelAudienceId || null,
        audience_label: audienceLabel,
      };

      var result = await supabase.from('chat_channels').insert(insertData).select().single();
      if (result.error) throw result.error;

      mascotSuccessToast('Chat created', result.data.name + ' is ready to use.');
      setShowNewChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelVisibility('all');
      setNewChannelAudienceId('');
      setChannels(function(prev) { return prev.concat([result.data]); });
      setSelectedChannel(result.data);
    } catch (err) {
      mascotErrorToast('Failed to create chat');
    } finally {
      setCreatingChannel(false);
    }
  }

  async function handleDeleteChannel(channel) {
    if (!window.confirm('Delete ' + channel.name + '? All messages will be lost.')) return;
    var result = await supabase.from('chat_channels').delete().eq('id', channel.id);
    if (result.error) {
      mascotErrorToast('Failed to delete chat');
    } else {
      mascotSuccessToast('Chat deleted');
      var remaining = channels.filter(function(c) { return c.id !== channel.id; });
      setChannels(remaining);
      setSelectedChannel(remaining.length > 0 ? remaining[0] : null);
      setMessages([]);
    }
  }

  function getSenderName(senderId) {
    var m = memberProfiles[senderId];
    if (!m) return 'Unknown';
    return (((m.first_name || '') + ' ' + (m.last_name || '')).trim()) || 'Unknown';
  }

  function getSenderAvatar(senderId) {
    var m = memberProfiles[senderId];
    return m ? (m.avatar_url || m.profile_photo_url || null) : null;
  }

  var isMe = function(senderId) { return currentUser && senderId === currentUser.id; };

  var adminMembers   = orgMembers.filter(function(m) { return m.role === 'admin'; });
  var regularMembers = orgMembers.filter(function(m) { return m.role !== 'admin'; });

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Page header */}
      <div style={{ background: CARD_BG, borderBottom: '1px solid ' + BORDER, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ color: '#F5B731' }}><Icon path={ICONS.chat} size={20} /></div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: TEXT, margin: 0 }}>
            {organization ? organization.name + ' \u2014 Chat' : 'Chat'}
          </h1>
          <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>
            {channels.length} chat{channels.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 69px)', overflow: 'hidden' }}>

        {/* Left sidebar — channel list */}
        <div style={{ width: '240px', flexShrink: 0, background: SIDEBAR_BG, borderRight: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px' }}>Chats</span>
            {isAdmin && (
              <button
                onClick={function() { setShowNewChannel(true); }}
                aria-label="Create new chat"
                style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'transparent', color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className={'hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'}>
                <Icon path={ICONS.plus} size={14} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }} role="list" aria-label="Chats">
            {loadingChannels ? (
              <div style={{ padding: '8px' }}>
                {[1,2,3].map(function(i) {
                  return <div key={i} style={{ height: '32px', background: BORDER, borderRadius: '6px', marginBottom: '4px' }} />;
                })}
              </div>
            ) : channels.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: MUTED, fontSize: '12px' }}>
                {isAdmin ? 'Create your first chat' : 'No chats yet'}
              </div>
            ) : (
              channels.map(function(ch) {
                var isSelected = selectedChannel && selectedChannel.id === ch.id;
                var unread = unreadCounts[ch.id] || 0;
                var restricted = !!(ch.visibility && ch.visibility !== 'all');
                return (
                  <button
                    key={ch.id}
                    role="listitem"
                    onClick={function() { setSelectedChannel(ch); }}
                    aria-label={ch.name + (unread > 0 ? ', ' + unread + ' unread' : '') + (restricted ? ', restricted' : '')}
                    aria-current={isSelected ? 'true' : undefined}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                      padding: '7px 10px', borderRadius: '6px', marginBottom: '2px',
                      background: isSelected ? '#E2E8F0' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      color: isSelected ? TEXT : (unread > 0 ? TEXT : MUTED),
                      fontWeight: unread > 0 ? 700 : 500, fontSize: '13px',
                    }}
                    className={'hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors'}>
                    {restricted && (
                      <span style={{ color: isSelected ? '#F5B731' : MUTED, flexShrink: 0 }}>
                        <Icon path={ICONS.lock} size={13} />
                      </span>
                    )}
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

        {/* Center + right */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Message area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: BG }}>
            {!selectedChannel ? (
              <EmptyState
                icon={<Icon path={ICONS.chat} size={28} />}
                title="No chat selected"
                description={isAdmin ? 'Create a chat to start messaging with your team.' : 'Select a chat from the list.'}
                action={isAdmin ? 'Create Chat' : null}
                onAction={function() { setShowNewChannel(true); }}
              />
            ) : (
              <>
                {/* Channel header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', gap: '10px', background: CARD_BG, flexShrink: 0 }}>
                  {getAudienceLabel(selectedChannel) && (
                    <span style={{ color: '#F5B731', flexShrink: 0 }}>
                      <Icon path={ICONS.lock} size={16} />
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>{selectedChannel.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedChannel.description && (
                        <span style={{ fontSize: '12px', color: MUTED }}>{selectedChannel.description}</span>
                      )}
                      {getAudienceLabel(selectedChannel) && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#7C3AED', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', padding: '1px 7px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                          {getAudienceLabel(selectedChannel)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Members toggle */}
                  <button
                    onClick={handleToggleMembersPanel}
                    aria-label={showMembersPanel ? 'Hide members' : 'Show members'}
                    aria-pressed={showMembersPanel}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid ' + (showMembersPanel ? '#3B82F6' : BORDER), background: showMembersPanel ? 'rgba(59,130,246,0.08)' : 'transparent', color: showMembersPanel ? '#3B82F6' : TEXT2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}
                    className={'hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'}>
                    <Icon path={ICONS.users} size={14} />
                    Members
                    {orgMembers.length > 0 && (
                      <span style={{ fontSize: '11px', color: showMembersPanel ? '#3B82F6' : MUTED }}>({orgMembers.length})</span>
                    )}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={function() { handleDeleteChannel(selectedChannel); }}
                      aria-label={'Delete chat ' + selectedChannel.name}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid ' + BORDER, background: 'transparent', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}
                      className={'hover:border-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors'}>
                      <Icon path={ICONS.trash} size={13} />
                      Delete
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}
                  role="log" aria-label={'Messages in ' + selectedChannel.name} aria-live="polite">
                  {loadingMessages ? (
                    <SkeletonMessages />
                  ) : messages.length === 0 ? (
                    <EmptyState
                      icon={<Icon path={ICONS.chat} size={24} />}
                      title={'Welcome to ' + selectedChannel.name}
                      description={selectedChannel.description || 'This is the beginning of this channel. Say hello!'}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {messages.map(function(msg, index) {
                        var showHeader = index === 0 || messages[index - 1].sender_id !== msg.sender_id || shouldShowDivider(messages, index);
                        var avatarUrl  = getSenderAvatar(msg.sender_id);
                        var senderName = getSenderName(msg.sender_id);
                        var mine       = isMe(msg.sender_id);
                        var avatarColor = getAvatarColor(senderName);

                        return (
                          <div key={msg.id}>
                            {shouldShowDivider(messages, index) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 12px' }}
                                aria-label={formatDateDivider(msg.created_at)}>
                                <div style={{ flex: 1, height: '1px', background: BORDER }} />
                                <span style={{ fontSize: '11px', fontWeight: 600, color: MUTED, whiteSpace: 'nowrap' }}>
                                  {formatDateDivider(msg.created_at)}
                                </span>
                                <div style={{ flex: 1, height: '1px', background: BORDER }} />
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', padding: '3px 0', alignItems: 'flex-start' }} className="group">
                              <div style={{ width: '36px', flexShrink: 0 }}>
                                {showHeader ? (
                                  avatarUrl ? (
                                    <img src={avatarUrl} alt={senderName}
                                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + BORDER }} />
                                  ) : (
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                                      {getInitials(senderName)}
                                    </div>
                                  )
                                ) : (
                                  <div style={{ width: '36px' }} />
                                )}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                {showHeader && (
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: mine ? '#3B82F6' : TEXT }}>{senderName}</span>
                                    {mine && (
                                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '1px 6px', borderRadius: '99px' }}>You</span>
                                    )}
                                    <span style={{ fontSize: '11px', color: MUTED }}>{formatTime(msg.created_at)}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0, wordBreak: 'break-word', flex: 1, whiteSpace: 'pre-wrap' }}>
                                    {msg.content}
                                  </p>
                                  {(mine || isAdmin) && (
                                    <button
                                      onClick={function() { handleDeleteMessage(msg.id); }}
                                      aria-label="Delete message"
                                      style={{ padding: '3px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', opacity: 0, flexShrink: 0 }}
                                      className={'group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-opacity'}>
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
                <div style={{ padding: '12px 20px', borderTop: '1px solid ' + BORDER, background: CARD_BG, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: INPUT_BG, border: '1px solid ' + BORDER, borderRadius: '10px', padding: '8px 12px' }}>
                    <textarea
                      ref={inputRef}
                      value={messageInput}
                      onChange={function(e) { setMessageInput(e.target.value); }}
                      onKeyDown={handleKeyDown}
                      placeholder={'Message ' + selectedChannel.name}
                      rows={1}
                      aria-label={'Type a message in ' + selectedChannel.name}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: TEXT, fontSize: '14px', lineHeight: 1.5, fontFamily: 'inherit', maxHeight: '120px', overflowY: 'auto' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !messageInput.trim()}
                      aria-label="Send message"
                      style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', background: messageInput.trim() ? '#3B82F6' : BORDER, color: messageInput.trim() ? '#FFFFFF' : MUTED, cursor: messageInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, flexShrink: 0, transition: 'all 0.15s' }}
                      className={'focus:outline-none focus:ring-2 focus:ring-blue-500'}>
                      <Icon path={ICONS.send} size={14} />
                      Send
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: MUTED, marginTop: '6px', paddingLeft: '2px' }}>
                    Press Enter to send &middot; Shift+Enter for new line
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right — Members panel */}
          {showMembersPanel && (
            <div style={{ width: '220px', flexShrink: 0, background: CARD_BG, borderLeft: '1px solid ' + BORDER, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              role="complementary" aria-label="Members panel">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px' }}>
                  Members {(!loadingMembers && orgMembers.length > 0) ? '(' + orgMembers.length + ')' : ''}
                </span>
                <button
                  onClick={function() { setShowMembersPanel(false); }}
                  aria-label="Close members panel"
                  style={{ padding: '3px', borderRadius: '4px', border: 'none', background: 'transparent', color: MUTED, cursor: 'pointer' }}
                  className={'hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'}>
                  <Icon path={ICONS.x} size={15} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loadingMembers ? (
                  <SkeletonMembers />
                ) : orgMembers.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: MUTED, fontSize: '12px' }}>No members found</div>
                ) : (
                  <div style={{ padding: '8px' }}>
                    {adminMembers.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px 6px' }}>
                          Admins &mdash; {adminMembers.length}
                        </div>
                        {adminMembers.map(function(m) {
                          return <MemberRow key={m.member_id} membership={m} />;
                        })}
                      </div>
                    )}
                    {regularMembers.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px 6px' }}>
                          Members &mdash; {regularMembers.length}
                        </div>
                        {regularMembers.map(function(m) {
                          return <MemberRow key={m.member_id} membership={m} />;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
          role="dialog" aria-modal="true" aria-labelledby="new-channel-title">
          <div style={{ background: CARD_BG, borderRadius: '16px', width: '100%', maxWidth: '500px', border: '1px solid ' + BORDER, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: CARD_BG, zIndex: 1 }}>
              <h2 id="new-channel-title" style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>Create Chat</h2>
              <button onClick={function() { setShowNewChannel(false); }} aria-label="Close"
                style={{ padding: '4px', borderRadius: '6px', border: 'none', background: 'transparent', color: MUTED, cursor: 'pointer' }}
                className={'hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'}>
                <Icon path={ICONS.x} size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="chat-name" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
                  Chat Name <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: INPUT_BG, border: '1px solid ' + BORDER, borderRadius: '8px', padding: '8px 12px' }}>
                  <input
                    id="chat-name"
                    type="text"
                    value={newChannelName}
                    onChange={function(e) { setNewChannelName(e.target.value); }}
                    placeholder="e.g. general, board, volunteers"
                    aria-required="true"
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: TEXT, fontSize: '14px', fontFamily: 'inherit' }}
                    onKeyDown={function(e) { if (e.key === 'Enter') handleCreateChannel(); }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="chat-desc" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
                  Description <span style={{ color: MUTED, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input
                  id="chat-desc"
                  type="text"
                  value={newChannelDesc}
                  onChange={function(e) { setNewChannelDesc(e.target.value); }}
                  placeholder="What's this chat for?"
                  style={{ width: '100%', background: INPUT_BG, border: '1px solid ' + BORDER, borderRadius: '8px', padding: '8px 12px', color: TEXT, fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  className={'focus:ring-2 focus:ring-blue-500'}
                />
              </div>

              {/* Audience */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '10px' }}>
                  Audience
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="radiogroup" aria-label="Channel audience">

                  {/* All Members */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: '1px solid ' + (newChannelVisibility === 'all' ? '#3B82F6' : BORDER), background: newChannelVisibility === 'all' ? 'rgba(59,130,246,0.05)' : CARD_BG, cursor: 'pointer' }}>
                    <input type="radio" name="channel-visibility" value="all"
                      checked={newChannelVisibility === 'all'}
                      onChange={function() { setNewChannelVisibility('all'); setNewChannelAudienceId(''); }}
                      style={{ accentColor: '#3B82F6' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon path={ICONS.users} size={13} /> All Members
                      </div>
                      <div style={{ fontSize: '11px', color: MUTED }}>Visible to everyone in this organization</div>
                    </div>
                  </label>

                  {/* Admins Only */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: '1px solid ' + (newChannelVisibility === 'admins' ? '#3B82F6' : BORDER), background: newChannelVisibility === 'admins' ? 'rgba(59,130,246,0.05)' : CARD_BG, cursor: 'pointer' }}>
                    <input type="radio" name="channel-visibility" value="admins"
                      checked={newChannelVisibility === 'admins'}
                      onChange={function() { setNewChannelVisibility('admins'); setNewChannelAudienceId(''); }}
                      style={{ accentColor: '#3B82F6' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon path={ICONS.shield} size={13} /> Admins Only
                      </div>
                      <div style={{ fontSize: '11px', color: MUTED }}>Only organization admins can see and post</div>
                    </div>
                  </label>

                  {/* Specific Group */}
                  {orgGroups.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: '1px solid ' + (newChannelVisibility === 'group' ? '#3B82F6' : BORDER), background: newChannelVisibility === 'group' ? 'rgba(59,130,246,0.05)' : CARD_BG, cursor: 'pointer' }}>
                      <input type="radio" name="channel-visibility" value="group"
                        checked={newChannelVisibility === 'group'}
                        onChange={function() { setNewChannelVisibility('group'); }}
                        style={{ accentColor: '#3B82F6', marginTop: '3px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: newChannelVisibility === 'group' ? '8px' : '0' }}>
                          <Icon path={ICONS.lock} size={13} /> Specific Group or Committee
                        </div>
                        {newChannelVisibility !== 'group' && (
                          <div style={{ fontSize: '11px', color: MUTED }}>Restrict to a group or committee</div>
                        )}
                        {newChannelVisibility === 'group' && (
                          <select
                            value={newChannelAudienceId}
                            onChange={function(e) { setNewChannelAudienceId(e.target.value); }}
                            aria-label="Select group"
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid ' + BORDER, background: INPUT_BG, color: TEXT, fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                            className={'focus:ring-2 focus:ring-blue-500'}>
                            <option value="">Select a group...</option>
                            {orgGroups.map(function(g) {
                              return <option key={g.id} value={g.id}>{g.name}</option>;
                            })}
                          </select>
                        )}
                      </div>
                    </label>
                  )}

                  {/* Membership Tier */}
                  {membershipTiers.length > 0 && (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: '1px solid ' + (newChannelVisibility === 'tier' ? '#3B82F6' : BORDER), background: newChannelVisibility === 'tier' ? 'rgba(59,130,246,0.05)' : CARD_BG, cursor: 'pointer' }}>
                      <input type="radio" name="channel-visibility" value="tier"
                        checked={newChannelVisibility === 'tier'}
                        onChange={function() { setNewChannelVisibility('tier'); }}
                        style={{ accentColor: '#3B82F6', marginTop: '3px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: newChannelVisibility === 'tier' ? '8px' : '0' }}>
                          <Icon path={ICONS.tag} size={13} /> Membership Tier
                        </div>
                        {newChannelVisibility !== 'tier' && (
                          <div style={{ fontSize: '11px', color: MUTED }}>Restrict to a specific membership tier</div>
                        )}
                        {newChannelVisibility === 'tier' && (
                          <select
                            value={newChannelAudienceId}
                            onChange={function(e) { setNewChannelAudienceId(e.target.value); }}
                            aria-label="Select membership tier"
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid ' + BORDER, background: INPUT_BG, color: TEXT, fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                            className={'focus:ring-2 focus:ring-blue-500'}>
                            <option value="">Select a tier...</option>
                            {membershipTiers.map(function(t) {
                              return <option key={t.id} value={t.id}>{t.name}</option>;
                            })}
                          </select>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={function() { setShowNewChannel(false); }}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid ' + BORDER, background: 'transparent', color: MUTED, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  className={'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400'}>
                  Cancel
                </button>
                <button onClick={handleCreateChannel}
                  disabled={creatingChannel || !newChannelName.trim()}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: newChannelName.trim() ? '#3B82F6' : BORDER, color: newChannelName.trim() ? '#FFFFFF' : MUTED, fontSize: '13px', fontWeight: 600, cursor: newChannelName.trim() ? 'pointer' : 'not-allowed' }}
                  className={'focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'}>
                  {creatingChannel ? 'Creating...' : 'Create Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}