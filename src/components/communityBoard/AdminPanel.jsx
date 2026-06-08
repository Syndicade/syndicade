/**
 * AdminPanel.jsx — Syndicade Community Board
 * Recommendation 1: Inbox tab logic noted for future consolidation with AdminInbox.jsx.
 *   The inbox here reads cb_post_messages for this board's posts. AdminInbox reads
 *   contact_inquiries. They are different data sources — consolidation would require
 *   a unified inbox view component, tracked as a future task.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../MascotToast';
import {
  CARD, BDR, ELEV, TEXT, TEXT2, MUTED, YELLOW, BLUE, GREEN, RED, PURPLE,
  THEMES, US_STATES, getAvatarColor, getInitials, timeAgo, formatDateTime,
  OrgAvatar, StatusBadge,
  IconSettings, IconX, IconCheck, IconTrash, IconBell, IconInbox,
  IconGlobe, IconLock, IconShield, IconUsers, IconRefresh
} from './cbUtils';

export default function AdminPanel(props) {
  var board = props.board, boardId = props.boardId, userOrgIds = props.userOrgIds || [];
  var [adminTab, setAdminTab] = useState('requests');
  var [memberships, setMemberships] = useState([]);
  var [loading, setLoading] = useState(true);
  var [processing, setProcessing] = useState({});
  var [inboxMessages, setInboxMessages] = useState([]);
  var [inboxLoading, setInboxLoading] = useState(false);
  var [inboxFilter, setInboxFilter] = useState('all');

  // Settings state
  var [editName, setEditName] = useState(board.name || '');
  var [editDesc, setEditDesc] = useState(board.description || '');
  var [editCity, setEditCity] = useState(board.city || '');
  var [editState, setEditState] = useState(board.state || '');
  var [editCounty, setEditCounty] = useState(board.county || '');
  var [editZip, setEditZip] = useState(board.zip_code || '');
  var [editVisibility, setEditVisibility] = useState(board.visibility || 'public');
  var [editTheme, setEditTheme] = useState(board.theme || 'general');
  var [savingSettings, setSavingSettings] = useState(false);

  // Invite state
  var [inviteExpiry, setInviteExpiry] = useState('30');
  var [customExpiry, setCustomExpiry] = useState('');
  var [generatingLink, setGeneratingLink] = useState(false);
  var [generalInvites, setGeneralInvites] = useState([]);
  var [directInvites, setDirectInvites] = useState([]);
  var [loadingInvites, setLoadingInvites] = useState(false);
  var [orgSearch, setOrgSearch] = useState('');
  var [orgResults, setOrgResults] = useState([]);
  var [selectedInviteOrg, setSelectedInviteOrg] = useState(null);
  var [sendingOrgInvite, setSendingOrgInvite] = useState(false);
  var [copiedId, setCopiedId] = useState(null);

  useEffect(function() { loadMemberships(); }, []);
  useEffect(function() {
    if (adminTab === 'invites') loadInvites();
    if (adminTab === 'inbox') loadInbox();
  }, [adminTab]);

  async function loadMemberships() {
    setLoading(true);
    try {
      var { data, error } = await supabase.rpc('get_board_memberships', { p_board_id: boardId });
      if (error) throw error;
      setMemberships(data || []);
    } catch (err) {
      toast.error('Could not load members.');
    } finally {
      setLoading(false);
    }
  }

  async function loadInbox() {
    if (!userOrgIds || userOrgIds.length === 0) return;
    setInboxLoading(true);
    try {
      var { data: boardPosts } = await supabase.from('community_board_posts').select('id,title,board_type').eq('board_id', boardId).eq('is_active', true);
      var postMap = {};
      (boardPosts || []).forEach(function(p) { postMap[p.id] = p; });
      var postIds = Object.keys(postMap);
      if (postIds.length === 0) { setInboxMessages([]); setInboxLoading(false); return; }
      var { data: msgs } = await supabase.from('cb_post_messages').select('*').in('post_id', postIds).in('to_org_id', userOrgIds).order('created_at', { ascending: false });
      var senderOrgIds = [];
      (msgs || []).forEach(function(m) { if (senderOrgIds.indexOf(m.from_org_id) === -1) senderOrgIds.push(m.from_org_id); });
      var orgMap = {};
      if (senderOrgIds.length > 0) {
        var { data: orgs } = await supabase.from('organizations').select('id,name').in('id', senderOrgIds);
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
      }
      setInboxMessages((msgs || []).map(function(m) {
        return Object.assign({}, m, {
          post_title: postMap[m.post_id] ? postMap[m.post_id].title : 'Unknown Post',
          from_org_name: orgMap[m.from_org_id] || 'Unknown Org'
        });
      }));
    } catch (err) {
      mascotErrorToast('Could not load inbox.');
    } finally {
      setInboxLoading(false);
    }
  }

  async function handleMarkInboxRead(messageId) {
    try {
      await supabase.from('cb_post_messages').update({ is_read: true }).eq('id', messageId);
      setInboxMessages(function(prev) { return prev.map(function(m) { return m.id === messageId ? Object.assign({}, m, { is_read: true }) : m; }); });
    } catch (err) {}
  }

  async function handleMarkAllInboxRead() {
    var unreadIds = inboxMessages.filter(function(m) { return !m.is_read; }).map(function(m) { return m.id; });
    if (unreadIds.length === 0) return;
    try {
      await supabase.from('cb_post_messages').update({ is_read: true }).in('id', unreadIds);
      setInboxMessages(function(prev) { return prev.map(function(m) { return Object.assign({}, m, { is_read: true }); }); });
      mascotSuccessToast('All messages marked as read.');
    } catch (err) {
      mascotErrorToast('Could not mark messages read.');
    }
  }

  var inboxUnreadCount = inboxMessages.filter(function(m) { return !m.is_read; }).length;
  var filteredInboxMessages = inboxFilter === 'unread' ? inboxMessages.filter(function(m) { return !m.is_read; }) : inboxMessages;

  async function handleApprove(membershipId, orgName) {
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: true }); });
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { data, error } = await supabase.rpc('approve_board_membership', { p_membership_id: membershipId, p_reviewer_id: authData.user.id });
      if (error) throw error;
      if (!data) { toast.error('Could not approve.'); return; }
      mascotSuccessToast(orgName + ' approved.');
      loadMemberships(); props.onMembershipChange();
    } catch (err) {
      mascotErrorToast('Could not approve request.');
    } finally {
      setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: false }); });
    }
  }

  async function handleDeny(membershipId, orgName) {
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: true }); });
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { data, error } = await supabase.rpc('deny_board_membership', { p_membership_id: membershipId, p_reviewer_id: authData.user.id });
      if (error) throw error;
      if (!data) { toast.error('Could not deny.'); return; }
      toast.error(orgName + ' request denied.');
      loadMemberships();
    } catch (err) {
      mascotErrorToast('Could not deny request.');
    } finally {
      setProcessing(function(p) { return Object.assign({}, p, { [membershipId]: false }); });
    }
  }

  async function handlePromote(membershipId, orgName, currentRole) {
    var newRole = currentRole === 'admin' ? 'member' : 'admin';
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'r']: true }); });
    try {
      var { error } = await supabase.from('community_board_memberships').update({ role: newRole }).eq('id', membershipId);
      if (error) throw error;
      mascotSuccessToast(orgName + ' is now a board ' + newRole + '.');
      loadMemberships();
    } catch (err) {
      mascotErrorToast('Could not update role.');
    } finally {
      setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'r']: false }); });
    }
  }

  async function handleRemove(membershipId, orgName) {
    setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'x']: true }); });
    try {
      var { error } = await supabase.from('community_board_memberships').delete().eq('id', membershipId);
      if (error) throw error;
      mascotSuccessToast(orgName + ' removed from board.');
      loadMemberships(); props.onMembershipChange();
    } catch (err) {
      mascotErrorToast('Could not remove org.');
    } finally {
      setProcessing(function(p) { return Object.assign({}, p, { [membershipId + 'x']: false }); });
    }
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
    } catch (err) {
      mascotErrorToast('Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function loadInvites() {
    setLoadingInvites(true);
    try {
      var { data, error } = await supabase.from('community_board_invites').select('*').eq('board_id', boardId).order('created_at', { ascending: false });
      if (error) throw error;
      var generals = (data || []).filter(function(i) { return !i.invited_org_id; });
      var directs = (data || []).filter(function(i) { return !!i.invited_org_id; });
      if (directs.length > 0) {
        var orgIds = directs.map(function(i) { return i.invited_org_id; });
        var { data: orgs } = await supabase.from('organizations').select('id,name').in('id', orgIds);
        var orgMap = {};
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
        directs = directs.map(function(i) { return Object.assign({}, i, { org_name: orgMap[i.invited_org_id] || 'Unknown Org' }); });
      }
      setGeneralInvites(generals); setDirectInvites(directs);
    } catch (err) {
      toast.error('Could not load invites.');
    } finally {
      setLoadingInvites(false);
    }
  }

  async function generateInviteLink() {
    setGeneratingLink(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      var expiresAt = null;
      if (inviteExpiry === 'custom' && customExpiry) { expiresAt = new Date(customExpiry).toISOString(); }
      else if (inviteExpiry !== 'none') { var d = new Date(); d.setDate(d.getDate() + parseInt(inviteExpiry)); expiresAt = d.toISOString(); }
      var { data: inv, error } = await supabase.from('community_board_invites').insert({
        board_id: boardId, created_by_user_id: authData.user.id,
        invited_org_id: null, expires_at: expiresAt
      }).select().single();
      if (error) throw error;
      var link = window.location.origin + '/community-board/join?token=' + inv.token;
      try {
        await navigator.clipboard.writeText(link);
        setCopiedId(inv.id); setTimeout(function() { setCopiedId(null); }, 3000);
        mascotSuccessToast('Invite link generated and copied.');
      } catch (clipErr) {
        mascotSuccessToast('Invite link generated.');
      }
      loadInvites();
    } catch (err) {
      mascotErrorToast('Could not generate link.');
    } finally {
      setGeneratingLink(false);
    }
  }

  async function searchOrgs(query) {
    if (!query || query.length < 2) { setOrgResults([]); return; }
    try {
      var { data } = await supabase.from('organizations').select('id,name,type').ilike('name', '%' + query + '%').limit(8);
      setOrgResults(data || []);
    } catch (err) {}
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
      else { mascotErrorToast('Could not send invite.'); }
    } finally {
      setSendingOrgInvite(false);
    }
  }

  async function deleteInvite(inviteId) {
    try {
      var { error } = await supabase.from('community_board_invites').delete().eq('id', inviteId);
      if (error) throw error;
      mascotSuccessToast('Invite removed.');
      loadInvites();
    } catch (err) {
      mascotErrorToast('Could not remove invite.');
    }
  }

  function copyInviteLink(token, id) {
    var link = window.location.origin + '/community-board/join?token=' + token;
    navigator.clipboard.writeText(link).then(function() {
      setCopiedId(id); setTimeout(function() { setCopiedId(null); }, 3000);
      mascotSuccessToast('Link copied.');
    });
  }

  function formatExpiry(dateStr) {
    if (!dateStr) return 'No expiry';
    var d = new Date(dateStr);
    if (d < new Date()) return 'Expired';
    return 'Expires ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  var pending = memberships.filter(function(m) { return m.status === 'pending'; });
  var approved = memberships.filter(function(m) { return m.status === 'approved'; });

  var inputStyle = { width: '100%', padding: '9px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  var labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '4px' };
  var badgeInbox = inboxMessages.length > 0 ? inboxUnreadCount : (props.inboxUnreadCount || 0);

  var adminTabs = [
    { key: 'requests', label: 'Requests', badge: pending.length },
    { key: 'inbox', label: 'Inbox', badge: badgeInbox },
    { key: 'members', label: 'Members', badge: 0 },
    { key: 'invites', label: 'Invites', badge: 0 },
    { key: 'settings', label: 'Settings', badge: 0 }
  ];

  return (
    <>
      <div onClick={props.onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 39 }} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Board Admin Panel"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', maxWidth: '100vw', background: CARD, borderLeft: '1px solid ' + BDR, zIndex: 40, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid ' + BDR }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139,92,246,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PURPLE }}><IconSettings size={14} /></div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: 0 }}>Manage Board</h2>
            </div>
            <button onClick={props.onClose} aria-label="Close admin panel"
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: ELEV, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
              <IconX size={12} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
            {adminTabs.map(function(t) {
              var isActive = adminTab === t.key;
              return (
                <button key={t.key} onClick={function() { setAdminTab(t.key); }}
                  style={{ padding: '8px 10px', border: 'none', background: 'transparent', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: isActive ? BLUE : MUTED, borderBottom: isActive ? '2px solid ' + BLUE : '2px solid transparent', marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {t.label}
                  {t.badge > 0 && <span style={{ background: t.key === 'inbox' ? BLUE : RED, color: '#FFFFFF', borderRadius: '99px', padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}>{t.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* ── Inbox ── */}
          {adminTab === 'inbox' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'unread'].map(function(f) {
                    return (
                      <button key={f} onClick={function() { setInboxFilter(f); }}
                        style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: '1px solid ' + BDR, background: inboxFilter === f ? BLUE : CARD, color: inboxFilter === f ? '#FFFFFF' : TEXT2, cursor: 'pointer' }}>
                        {f === 'all' ? 'All' : 'Unread' + (inboxUnreadCount > 0 ? ' (' + inboxUnreadCount + ')' : '')}
                      </button>
                    );
                  })}
                </div>
                {inboxUnreadCount > 0 && (
                  <button onClick={handleMarkAllInboxRead}
                    style={{ fontSize: '12px', fontWeight: 600, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Mark all read
                  </button>
                )}
              </div>
              {inboxLoading
                ? <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[1, 2, 3].map(function(i) { return <div key={i} style={{ height: '88px', background: ELEV, borderRadius: '10px' }} />; })}</div>
                : filteredInboxMessages.length === 0
                  ? <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ELEV, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, margin: '0 auto 12px' }}><IconInbox size={20} /></div>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>{inboxFilter === 'unread' ? 'No unread messages' : 'No messages yet'}</p>
                      <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.5, margin: 0 }}>{inboxFilter === 'unread' ? "You're all caught up." : 'Messages from other orgs will appear here.'}</p>
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredInboxMessages.map(function(msg) {
                        return (
                          <div key={msg.id} style={{ padding: '12px', background: msg.is_read ? ELEV : 'rgba(59,130,246,0.05)', border: '1px solid ' + (msg.is_read ? BDR : 'rgba(59,130,246,0.22)'), borderRadius: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <OrgAvatar name={msg.from_org_name} size={32} fontSize="10px" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>{msg.from_org_name}</span>
                                  <span style={{ fontSize: '10px', color: MUTED, flexShrink: 0 }}>{timeAgo(msg.created_at)}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: MUTED, marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{'Re: "' + msg.post_title + '"'}</div>
                                <div style={{ fontSize: '12px', color: TEXT2, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.message}</div>
                              </div>
                            </div>
                            {!msg.is_read && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button onClick={function() { handleMarkInboxRead(msg.id); }}
                                  style={{ fontSize: '11px', fontWeight: 600, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  Mark as read
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
              }
            </div>
          )}

          {/* ── Requests ── */}
          {adminTab === 'requests' && (
            loading
              ? <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[1, 2, 3].map(function(i) { return <div key={i} style={{ height: '72px', background: ELEV, borderRadius: '10px' }} />; })}</div>
              : pending.length === 0
                ? <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ELEV, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, margin: '0 auto 12px' }}><IconBell size={20} /></div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>No pending requests</p>
                    <p style={{ fontSize: '13px', color: TEXT2 }}>New join requests will appear here.</p>
                  </div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pending.map(function(m) {
                      var busy = processing[m.id];
                      return (
                        <div key={m.id} style={{ background: ELEV, border: '1px solid ' + BDR, borderRadius: '10px', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <OrgAvatar name={m.org_name} size={36} fontSize="12px" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{m.org_name}</div>
                              <div style={{ fontSize: '11px', color: MUTED }}>{(m.org_type || 'Organization') + ' · ' + timeAgo(m.created_at)}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={function() { handleApprove(m.id, m.org_name); }} disabled={busy}
                              style={{ flex: 1, padding: '7px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: '#16A34A', fontSize: '12px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <IconCheck size={12} />{busy ? '...' : 'Approve'}
                            </button>
                            <button onClick={function() { handleDeny(m.id, m.org_name); }} disabled={busy}
                              style={{ flex: 1, padding: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: RED, fontSize: '12px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <IconX size={11} />{busy ? '...' : 'Deny'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
          )}

          {/* ── Members ── */}
          {adminTab === 'members' && (
            loading
              ? <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[1, 2, 3, 4].map(function(i) { return <div key={i} style={{ height: '64px', background: ELEV, borderRadius: '10px' }} />; })}</div>
              : approved.length === 0
                ? <div role="status" style={{ textAlign: 'center', padding: '40px 16px' }}><p style={{ fontSize: '14px', color: TEXT2 }}>No approved members yet.</p></div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {approved.map(function(m) {
                      var busyR = processing[m.id + 'r'], busyX = processing[m.id + 'x'];
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '10px' }}>
                          <OrgAvatar name={m.org_name} size={36} fontSize="12px" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.org_name}</div>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: m.role === 'admin' ? 'rgba(139,92,246,0.12)' : CARD, border: '1px solid ' + (m.role === 'admin' ? 'rgba(139,92,246,0.3)' : BDR), color: m.role === 'admin' ? PURPLE : MUTED }}>
                              {m.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={function() { handlePromote(m.id, m.org_name, m.role); }} disabled={busyR}
                              style={{ padding: '5px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: '1px solid ' + BDR, background: CARD, color: MUTED, cursor: busyR ? 'not-allowed' : 'pointer', opacity: busyR ? 0.6 : 1 }}>
                              {busyR ? '...' : (m.role === 'admin' ? 'Demote' : 'Make Admin')}
                            </button>
                            <button onClick={function() { handleRemove(m.id, m.org_name); }} disabled={busyX}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: RED, cursor: busyX ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busyX ? 0.6 : 1 }}>
                              <IconTrash size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
          )}

          {/* ── Invites ── */}
          {adminTab === 'invites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 8px' }}>Shareable Link</p>
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
                  <button onClick={generateInviteLink} disabled={generatingLink}
                    style={{ padding: '9px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: generatingLink ? 'not-allowed' : 'pointer', opacity: generatingLink ? 0.7 : 1 }}>
                    {generatingLink ? 'Generating...' : 'Generate & Copy Link'}
                  </button>
                </div>
                {generalInvites.length > 0 && (
                  <div>
                    <p style={Object.assign({}, labelStyle, { marginBottom: '8px' })}>Active Links</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {generalInvites.map(function(inv) {
                        var isCopied = copiedId === inv.id;
                        var isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
                        return (
                          <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', opacity: isExpired ? 0.5 : 1 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{'...' + inv.token.slice(-12)}</div>
                              <div style={{ fontSize: '11px', color: isExpired ? RED : MUTED }}>{formatExpiry(inv.expires_at)}</div>
                            </div>
                            <button onClick={function() { copyInviteLink(inv.token, inv.id); }}
                              style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid ' + BDR, background: isCopied ? 'rgba(34,197,94,0.10)' : CARD, color: isCopied ? GREEN : TEXT2, cursor: 'pointer', flexShrink: 0 }}>
                              {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={function() { deleteInvite(inv.id); }}
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
                <div style={{ position: 'relative' }}>
                  <input type="text" value={orgSearch}
                    onChange={function(e) { setOrgSearch(e.target.value); searchOrgs(e.target.value); }}
                    placeholder="Search organizations by name..." style={inputStyle} />
                  {orgResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', zIndex: 10, maxHeight: '180px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginTop: '4px' }}>
                      {orgResults.map(function(org) {
                        return (
                          <button key={org.id} onClick={function() { setSelectedInviteOrg(org); setOrgSearch(org.name); setOrgResults([]); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                            <OrgAvatar name={org.name} size={28} fontSize="10px" />
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
                    <OrgAvatar name={selectedInviteOrg.name} size={30} fontSize="10px" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT, flex: 1 }}>{selectedInviteOrg.name}</span>
                    <button onClick={function() { setSelectedInviteOrg(null); setOrgSearch(''); }}
                      style={{ width: '22px', height: '22px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
                      <IconX size={10} />
                    </button>
                  </div>
                )}
                <button onClick={sendOrgInvite} disabled={!selectedInviteOrg || sendingOrgInvite}
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
                            <OrgAvatar name={inv.org_name} size={28} fontSize="10px" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.org_name}</div>
                              <div style={{ fontSize: '11px', color: isUsed ? GREEN : MUTED }}>{isUsed ? 'Accepted' : 'Pending'}</div>
                            </div>
                            {!isUsed && (
                              <button onClick={function() { deleteInvite(inv.id); }}
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

          {/* ── Settings ── */}
          {adminTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="s-name" style={labelStyle}>Board Name</label>
                <input id="s-name" type="text" value={editName} onChange={function(e) { setEditName(e.target.value); }} maxLength={80} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="s-desc" style={labelStyle}>Description</label>
                <textarea id="s-desc" value={editDesc} onChange={function(e) { setEditDesc(e.target.value); }} rows={3} maxLength={300} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.5 })} />
              </div>
              <div>
                <label htmlFor="s-theme" style={labelStyle}>Community Focus</label>
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
              <button onClick={handleSaveSettings} disabled={savingSettings}
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