/**
 * PostChatPanel.jsx — Syndicade Community Board
 * Recommendation 2: loadConversations debounced via useRef timer to avoid
 * rapid re-fetches when myOrgId changes quickly (multi-org users switching selector).
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../MascotToast';
import {
  CARD, BDR, ELEV, TEXT, TEXT2, MUTED, BLUE,
  getAvatarColor, getInitials, timeAgo, insertCBNotifications,
  OrgAvatar, IconX, IconChevronLeft, IconMessageCircle, IconSend
} from './cbUtils';

// Debounce delay for loadConversations (ms) — prevents thrashing on org selector change.
var CONV_DEBOUNCE_MS = 300;

export default function PostChatPanel(props) {
  var boardName = props.boardName, post = props.post, isOwn = props.isOwn;
  var userOrgs = props.userOrgs, onClose = props.onClose, onMarkRead = props.onMarkRead;
  var approvedOrgIds = props.approvedOrgIds || [];

  var otherOrgs = userOrgs.filter(function(o) { return o.id !== post.org_id; });
  var canReply = otherOrgs.length > 0;

  var [replyMode, setReplyMode] = useState(false);
  var [myOrgId, setMyOrgId] = useState(isOwn ? post.org_id : (userOrgs.length === 1 ? userOrgs[0].id : null));
  var [view, setView] = useState(isOwn ? 'list' : 'thread');
  var [partnerOrgId, setPartnerOrgId] = useState(isOwn ? null : post.org_id);
  var [partnerOrgName, setPartnerOrgName] = useState(isOwn ? null : post.org_name);
  var [messages, setMessages] = useState([]);
  var [conversations, setConversations] = useState([]);
  var [loading, setLoading] = useState(true);
  var [newMsg, setNewMsg] = useState('');
  var [sending, setSending] = useState(false);

  var messagesEndRef = useRef(null);
  var channelRef = useRef(null);
  // Recommendation 2: debounce timer for loadConversations
  var convDebounceRef = useRef(null);

  function enterReplyMode() {
    var eligibleOrgs = otherOrgs.filter(function(o) { return approvedOrgIds.indexOf(o.id) !== -1; });
    var replyOrgId = eligibleOrgs.length === 1 ? eligibleOrgs[0].id : null;
    setReplyMode(true); setMyOrgId(replyOrgId); setPartnerOrgId(post.org_id);
    setPartnerOrgName(post.org_name); setView('thread'); setMessages([]);
  }
  function exitReplyMode() {
    setReplyMode(false); setMyOrgId(post.org_id); setPartnerOrgId(null);
    setPartnerOrgName(null); setView('list'); setMessages([]);
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  }

  useEffect(function() {
    if (!myOrgId) { setLoading(false); return; }
    if (view === 'thread' && partnerOrgId) {
      loadThread();
      subscribeToThread();
    } else if (view === 'list') {
      // Recommendation 2: debounce to avoid rapid re-fetches on org switch
      if (convDebounceRef.current) clearTimeout(convDebounceRef.current);
      convDebounceRef.current = setTimeout(function() { loadConversations(); }, CONV_DEBOUNCE_MS);
    }
    return function() {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
      if (convDebounceRef.current) clearTimeout(convDebounceRef.current);
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
      var { data, error } = await supabase.from('cb_post_messages').select('*')
        .eq('post_id', post.id)
        .or('and(from_org_id.eq.' + myOrgId + ',to_org_id.eq.' + partnerOrgId + '),and(from_org_id.eq.' + partnerOrgId + ',to_org_id.eq.' + myOrgId + ')')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      var unreadIds = (data || []).filter(function(m) { return !m.is_read && m.to_org_id === myOrgId; }).map(function(m) { return m.id; });
      if (unreadIds.length > 0) {
        await supabase.from('cb_post_messages').update({ is_read: true }).in('id', unreadIds);
        if (onMarkRead) onMarkRead(post.id, unreadIds.length);
      }
    } catch (err) {
      mascotErrorToast('Could not load messages.', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations() {
    setLoading(true);
    try {
      var { data, error } = await supabase.from('cb_post_messages').select('*')
        .eq('post_id', post.id)
        .or('from_org_id.eq.' + myOrgId + ',to_org_id.eq.' + myOrgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      var convMap = {};
      (data || []).forEach(function(m) {
        var partnerId = m.from_org_id === myOrgId ? m.to_org_id : m.from_org_id;
        if (!convMap[partnerId]) convMap[partnerId] = { orgId: partnerId, orgName: '', messages: [], unread: 0 };
        convMap[partnerId].messages.push(m);
        if (!m.is_read && m.to_org_id === myOrgId) convMap[partnerId].unread++;
      });
      var partnerIds = Object.keys(convMap);
      if (partnerIds.length > 0) {
        var { data: orgs } = await supabase.from('organizations').select('id,name').in('id', partnerIds);
        (orgs || []).forEach(function(o) { if (convMap[o.id]) convMap[o.id].orgName = o.name; });
      }
      setConversations(Object.values(convMap).map(function(c) { return Object.assign({}, c, { lastMessage: c.messages[0] }); }));
    } catch (err) {
      mascotErrorToast('Could not load conversations.', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function subscribeToThread() {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase.channel('cb-thread-' + post.id + '-' + myOrgId + '-' + (partnerOrgId || ''))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cb_post_messages', filter: 'post_id=eq.' + post.id }, function(payload) {
        var msg = payload.new;
        var isRelevant = (msg.from_org_id === myOrgId && msg.to_org_id === partnerOrgId) || (msg.from_org_id === partnerOrgId && msg.to_org_id === myOrgId);
        if (!isRelevant) return;
        setMessages(function(prev) {
          var exists = prev.find(function(m) { return m.id === msg.id; });
          if (exists) return prev;
          return prev.concat([msg]);
        });
        if (msg.to_org_id === myOrgId) {
          supabase.from('cb_post_messages').update({ is_read: true }).eq('id', msg.id);
          if (onMarkRead) onMarkRead(post.id, 1);
        }
      }).subscribe();
  }

  async function handleSend() {
    if (!newMsg.trim()) return;
    if (!myOrgId) { toast.error('Select which org you are chatting as.'); return; }
    setSending(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { error } = await supabase.from('cb_post_messages').insert({
        post_id: post.id, from_org_id: myOrgId, to_org_id: partnerOrgId,
        sender_user_id: authData.user.id, message: newMsg.trim(), is_read: false
      });
      if (error) throw error;
      setNewMsg('');
      insertCBNotifications(myOrgId, partnerOrgId, boardName, post.board_id, userOrgs);
      supabase.from('community_board_posts').update({ last_activity_at: new Date().toISOString() }).eq('id', post.id).then(function() {});
    } catch (err) {
      mascotErrorToast('Could not send message.', 'Please try again.');
    } finally {
      setSending(false);
    }
  }

  function openThread(conv) { setPartnerOrgId(conv.orgId); setPartnerOrgName(conv.orgName); setView('thread'); }
  function goBackToList() {
    setView('list'); setPartnerOrgId(null); setPartnerOrgName(null); setMessages([]);
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    loadConversations();
  }

  var inputStyle = { width: '100%', padding: '9px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  var headerTitle = view === 'thread' ? (partnerOrgName || 'Chat') : 'Messages';
  var showBackButton = (view === 'thread' && isOwn && !replyMode) || (view === 'thread' && replyMode && otherOrgs.length > 1);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.20)', zIndex: 35 }} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={'Chat: ' + post.title}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', maxWidth: '100vw', background: CARD, borderLeft: '1px solid ' + BDR, zIndex: 36, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid ' + BDR, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            {showBackButton && (
              <button onClick={replyMode ? exitReplyMode : goBackToList} aria-label="Back"
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: ELEV, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2, flexShrink: 0 }}>
                <IconChevronLeft size={14} />
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headerTitle}</h2>
              <p style={{ fontSize: '11px', color: MUTED, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{"\"" + post.title + "\""}</p>
            </div>
            <button onClick={onClose} aria-label="Close chat"
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: ELEV, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, flexShrink: 0 }}>
              <IconX size={12} />
            </button>
          </div>

          {/* Received / Reply as Org toggle */}
          {isOwn && canReply && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: ELEV, borderRadius: '8px', padding: '3px' }}>
              <button onClick={exitReplyMode} aria-pressed={!replyMode}
                style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: !replyMode ? CARD : 'transparent', color: !replyMode ? TEXT : MUTED, boxShadow: !replyMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                Received
              </button>
              <button onClick={enterReplyMode} aria-pressed={replyMode}
                style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: replyMode ? CARD : 'transparent', color: replyMode ? TEXT : MUTED, boxShadow: replyMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                Reply as Org
              </button>
            </div>
          )}

          {/* Org selectors */}
          {replyMode && otherOrgs.length > 1 && (
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="cp-reply-org" style={{ fontSize: '10px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Replying as</label>
              <select id="cp-reply-org" value={myOrgId || ''} onChange={function(e) { setMyOrgId(e.target.value); setMessages([]); }}
                style={Object.assign({}, inputStyle, { fontSize: '12px', padding: '6px 10px' })}>
                <option value="">Select...</option>
                {otherOrgs.map(function(o) {
                  var isMember = approvedOrgIds.indexOf(o.id) !== -1;
                  return <option key={o.id} value={o.id} disabled={!isMember}>{o.name}</option>;
                })}
              </select>
            </div>
          )}
          {!isOwn && !replyMode && userOrgs.length > 1 && (
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="cp-org" style={{ fontSize: '10px', fontWeight: 600, color: MUTED, display: 'block', marginBottom: '4px' }}>Chatting as</label>
              <select id="cp-org" value={myOrgId || ''} onChange={function(e) { setMyOrgId(e.target.value); setMessages([]); }}
                style={Object.assign({}, inputStyle, { fontSize: '12px', padding: '6px 10px' })}>
                <option value="">Select...</option>
                {userOrgs.map(function(o) { return <option key={o.id} value={o.id}>{o.name}</option>; })}
              </select>
            </div>
          )}
        </div>

        {/* Message area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading
            ? <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{[1, 2, 3].map(function(i) { return <div key={i} style={{ height: '52px', background: ELEV, borderRadius: '10px' }} />; })}</div>
            : view === 'list'
              ? (conversations.length === 0
                  ? <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ELEV, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, margin: '0 auto 12px' }}><IconMessageCircle size={22} /></div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>No messages yet</p>
                      <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0 }}>When other orgs respond, messages will appear here.</p>
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {conversations.map(function(conv) {
                        return (
                          <button key={conv.orgId} onClick={function() { openThread(conv); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                            <OrgAvatar name={conv.orgName} size={36} fontSize="11px" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.orgName}</div>
                              <div style={{ fontSize: '11px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage ? conv.lastMessage.message : ''}</div>
                            </div>
                            {conv.unread > 0 && <span style={{ background: BLUE, color: '#FFFFFF', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 700 }}>{conv.unread}</span>}
                          </button>
                        );
                      })}
                    </div>
                )
              : (messages.length === 0
                  ? <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ELEV, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, margin: '0 auto 12px' }}><IconMessageCircle size={22} /></div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Start the conversation</p>
                      <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0 }}>{'Send a message to ' + (partnerOrgName || 'this org') + '.'}</p>
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {messages.map(function(msg) {
                        var isMine = msg.from_org_id === myOrgId;
                        return (
                          <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px' }}>
                            {!isMine && <OrgAvatar name={partnerOrgName || ''} size={26} fontSize="9px" />}
                            <div style={{ maxWidth: '75%' }}>
                              <div style={{ padding: '8px 12px', borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMine ? BLUE : ELEV, color: isMine ? '#FFFFFF' : TEXT, fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                                {msg.message}
                              </div>
                              <div style={{ fontSize: '10px', color: MUTED, marginTop: '3px', textAlign: isMine ? 'right' : 'left' }}>{timeAgo(msg.created_at)}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                )
          }
        </div>

        {/* Send area */}
        {view === 'thread' && myOrgId && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid ' + BDR, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea value={newMsg} onChange={function(e) { setNewMsg(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message..." rows={2} maxLength={500}
                style={{ flex: 1, padding: '8px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '13px', resize: 'none', lineHeight: 1.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={handleSend} disabled={sending || !newMsg.trim()} aria-label="Send"
                style={{ width: '36px', height: '36px', borderRadius: '8px', background: (newMsg.trim() && !sending) ? BLUE : ELEV, border: 'none', color: (newMsg.trim() && !sending) ? '#FFFFFF' : MUTED, cursor: (newMsg.trim() && !sending) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconSend size={14} />
              </button>
            </div>
            <p style={{ fontSize: '10px', color: MUTED, margin: '4px 0 0' }}>Enter to send · Shift+Enter for new line</p>
          </div>
        )}
        {view === 'thread' && !myOrgId && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid ' + BDR }}>
            <p style={{ fontSize: '12px', color: MUTED, margin: 0, textAlign: 'center' }}>Select an organization above to chat.</p>
          </div>
        )}
      </div>
    </>
  );
}