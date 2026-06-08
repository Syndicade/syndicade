/**
 * CommunityBoard.jsx — Syndicade Community Board
 * Slim orchestrator. All sub-components live in src/components/communityBoard/.
 *
 * Task 28: Split from ~1400-line monolith into:
 *   cbUtils.js            — tokens, icons, helpers, shared UI primitives
 *   PostCard.jsx          — Post-it card (ask / offer / collab)
 *   RecommendationCard.jsx — Vendor recommendation card + VendorContactRow
 *   PostModal.jsx         — Create / edit post modal
 *   PostChatPanel.jsx     — Slide-in per-post chat panel
 *   AdminPanel.jsx        — Slide-in board admin panel
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import PostCard from '../components/communityBoard/PostCard';
import RecommendationCard from '../components/communityBoard/RecommendationCard';
import PostModal from '../components/communityBoard/PostModal';
import PostChatPanel from '../components/communityBoard/PostChatPanel';
import AdminPanel from '../components/communityBoard/AdminPanel';
import {
  BG, CARD, BDR, ELEV, TEXT, TEXT2, MUTED, YELLOW, BLUE, GREEN, RED, PURPLE,
  BOARD_CONFIG, TABS, STATUS_CONFIG, getAvatarColor, getInitials, getThemeLabel,
  getExpiryInfo, timeAgo,
  FilterToolbar, ActivityFeed, SkeletonCard, DeleteConfirmModal, ActionModal,
  IconArrowLeft, IconPlus, IconSettings, IconUsers, IconBell, IconLock,
  IconGlobe, IconMapPin, IconShield, IconClock, IconActivity, IconSearch, IconX, IconPin
} from '../components/communityBoard/cbUtils';

// ─── Patrick Hand font loader ─────────────────────────────────────────────────
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

export default function CommunityBoard() {
  usePatrickHand();
  var { boardId } = useParams();
  var navigate = useNavigate();

  var [board, setBoard] = useState(null);
  var [pageLoading, setPageLoading] = useState(true);
  var [userOrgs, setUserOrgs] = useState([]);
  var [userOrgIds, setUserOrgIds] = useState([]);
  var [membership, setMembership] = useState(null);
  var [isBoardAdmin, setIsBoardAdmin] = useState(false);
  var [activeTab, setActiveTab] = useState('ask');
  var [posts, setPosts] = useState([]);
  var [postsLoading, setPostsLoading] = useState(false);
  var [tabCounts, setTabCounts] = useState({});
  var [showAdminPanel, setShowAdminPanel] = useState(false);
  var [showCreate, setShowCreate] = useState(false);
  var [editingPost, setEditingPost] = useState(null);
  var [deletingPost, setDeletingPost] = useState(null);
  var [actionModal, setActionModal] = useState(null);
  var [chatState, setChatState] = useState({ post: null, isOwn: false });
  var [unreadCounts, setUnreadCounts] = useState({});
  var [approvedOrgIds, setApprovedOrgIds] = useState([]);
  var [reactions, setReactions] = useState({});
  var [vendorContacts, setVendorContacts] = useState({});
  var [searchQuery, setSearchQuery] = useState('');
  var [sortBy, setSortBy] = useState('newest');
  var [filterCategory, setFilterCategory] = useState('');
  var [filterStatus, setFilterStatus] = useState('all');
  var [activityFeed, setActivityFeed] = useState([]);
  var [activityLoading, setActivityLoading] = useState(false);

  var cfg = BOARD_CONFIG[activeTab] || BOARD_CONFIG.ask;
  var isRec = activeTab === 'recommendations';

  useEffect(function() { setSearchQuery(''); setFilterCategory(''); setFilterStatus('all'); }, [activeTab]);
  useEffect(function() { loadPage(); }, [boardId]);

  async function loadPage() {
    setPageLoading(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { navigate('/login'); return; }
      var { data: memberData } = await supabase.from('memberships')
        .select('organization_id,organizations(id,name,logo_url)')
        .eq('member_id', authData.user.id).eq('role', 'admin').eq('status', 'active');
      var orgs = (memberData || []).map(function(m) { return m.organizations; });
      var ids = orgs.map(function(o) { return o.id; });
      setUserOrgs(orgs); setUserOrgIds(ids);
      var { data: boardData, error: be } = await supabase.from('community_boards').select('*').eq('id', boardId).single();
      if (be || !boardData) { setBoard(null); setPageLoading(false); return; }
      setBoard(boardData);
      if (ids.length > 0) {
        var { data: mems } = await supabase.from('community_board_memberships').select('id,org_id,role,status').eq('board_id', boardId).in('org_id', ids);
        var best = null;
        var rank = { approved: 3, pending: 2, invited: 2, denied: 1 };
        (mems || []).forEach(function(m) { if (!best || (rank[m.status] || 0) > (rank[best.status] || 0)) best = m; });
        setMembership(best);
        setIsBoardAdmin(!!best && best.status === 'approved' && best.role === 'admin');
        var approvedList = (mems || []).filter(function(m) { return m.status === 'approved'; }).map(function(m) { return m.org_id; });
        setApprovedOrgIds(approvedList);
      }
    } catch (err) {
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(function() {
    if (membership && membership.status === 'approved') {
      if (activeTab === 'activity') { loadActivityFeed(); }
      else { loadPosts(activeTab); }
      loadTabCounts();
      loadUnreadCounts();
    }
  }, [activeTab, membership]);

  async function loadPosts(boardType) {
    setPostsLoading(true);
    try {
      var { data, error } = await supabase.from('community_board_posts').select('*')
        .eq('board_id', boardId).eq('board_type', boardType).eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      var orgIds = [];
      (data || []).forEach(function(p) { if (p.org_id && orgIds.indexOf(p.org_id) === -1) orgIds.push(p.org_id); });
      var orgMap = {};
      if (orgIds.length > 0) {
        var { data: orgs } = await supabase.from('organizations').select('id,name').in('id', orgIds);
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
      }
      var enriched = (data || []).map(function(p) { return Object.assign({}, p, { org_name: orgMap[p.org_id] || 'Unknown Org' }); });
      setPosts(enriched);
      var postIds = enriched.map(function(p) { return p.id; });
      if (postIds.length > 0) {
        loadReactions(postIds);
        if (boardType === 'recommendations') loadVendorContacts(postIds);
      }
    } catch (err) {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }

  async function loadVendorContacts(postIds) {
    try {
      var { data, error } = await supabase.from('vendor_contacts').select('*').in('post_id', postIds).order('display_order', { ascending: true });
      if (error) throw error;
      var map = {};
      (data || []).forEach(function(c) { if (!map[c.post_id]) map[c.post_id] = []; map[c.post_id].push(c); });
      setVendorContacts(map);
    } catch (err) {
      console.error('Could not load vendor contacts:', err);
    }
  }

  async function loadActivityFeed() {
    setActivityLoading(true);
    try {
      var { data, error } = await supabase.from('community_board_posts').select('*')
        .eq('board_id', boardId).eq('is_active', true)
        .order('created_at', { ascending: false }).limit(60);
      if (error) throw error;
      var orgIds = [];
      (data || []).forEach(function(p) { if (p.org_id && orgIds.indexOf(p.org_id) === -1) orgIds.push(p.org_id); });
      var orgMap = {};
      if (orgIds.length > 0) {
        var { data: orgs } = await supabase.from('organizations').select('id,name').in('id', orgIds);
        (orgs || []).forEach(function(o) { orgMap[o.id] = o.name; });
      }
      setActivityFeed((data || []).map(function(p) { return Object.assign({}, p, { org_name: orgMap[p.org_id] || 'Unknown Org' }); }));
    } catch (err) {
      setActivityFeed([]);
    } finally {
      setActivityLoading(false);
    }
  }

  async function loadTabCounts() {
    try {
      var boardTabs = TABS.filter(function(t) { return t.key !== 'activity'; });
      var results = await Promise.all(boardTabs.map(function(t) {
        return supabase.from('community_board_posts').select('id', { count: 'exact', head: true })
          .eq('board_id', boardId).eq('board_type', t.key).eq('is_active', true);
      }));
      var counts = {};
      boardTabs.forEach(function(t, i) { counts[t.key] = results[i].count || 0; });
      setTabCounts(counts);
    } catch (err) {}
  }

  async function loadUnreadCounts() {
    if (!userOrgIds || userOrgIds.length === 0) return;
    try {
      var { data } = await supabase.from('cb_post_messages').select('post_id').in('to_org_id', userOrgIds).eq('is_read', false);
      var counts = {};
      (data || []).forEach(function(m) { counts[m.post_id] = (counts[m.post_id] || 0) + 1; });
      setUnreadCounts(counts);
    } catch (err) {}
  }

  async function loadReactions(postIds) {
    if (!userOrgIds || userOrgIds.length === 0 || !postIds || postIds.length === 0) return;
    try {
      var { data } = await supabase.from('cb_post_reactions').select('*').in('post_id', postIds);
      var reactionMap = {};
      (data || []).forEach(function(r) {
        if (!reactionMap[r.post_id]) reactionMap[r.post_id] = {};
        var countKey = r.reaction_type + '_count';
        reactionMap[r.post_id][countKey] = (reactionMap[r.post_id][countKey] || 0) + 1;
        if (userOrgIds.indexOf(r.org_id) !== -1) reactionMap[r.post_id]['my_' + r.reaction_type] = true;
      });
      setReactions(reactionMap);
    } catch (err) {}
  }

  async function handleStatusChange(postId, newStatus) {
    try {
      var { error } = await supabase.from('community_board_posts').update({ status: newStatus }).eq('id', postId);
      if (error) throw error;
      setPosts(function(prev) { return prev.map(function(p) { return p.id === postId ? Object.assign({}, p, { status: newStatus }) : p; }); });
    } catch (err) {}
  }

  async function handleDeleteConfirm(postId) {
    try {
      var { error } = await supabase.from('community_board_posts').update({ is_active: false }).eq('id', postId);
      if (error) throw error;
      setPosts(function(prev) { return prev.filter(function(p) { return p.id !== postId; }); });
      setDeletingPost(null);
      loadTabCounts();
    } catch (err) {}
  }

  async function handleTogglePin(post) {
    try {
      var { data: authData } = await supabase.auth.getUser();
      if (post.is_pinned) {
        await supabase.rpc('unpin_board_post', { p_post_id: post.id });
        setPosts(function(prev) { return prev.map(function(p) { return p.id === post.id ? Object.assign({}, p, { is_pinned: false }) : p; }); });
      } else {
        await supabase.rpc('pin_board_post', { p_post_id: post.id, p_board_id: boardId, p_board_type: activeTab, p_user_id: authData.user.id });
        setPosts(function(prev) { return prev.map(function(p) {
          if (p.id === post.id) return Object.assign({}, p, { is_pinned: true });
          return Object.assign({}, p, { is_pinned: false });
        }); });
      }
    } catch (err) {}
  }

  async function handleRenew(postId) {
    try {
      var { data: authData } = await supabase.auth.getUser();
      await supabase.rpc('renew_board_post', { p_post_id: postId, p_user_id: authData.user.id });
      var newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 60);
      setPosts(function(prev) { return prev.map(function(p) { return p.id === postId ? Object.assign({}, p, { expires_at: newExpiry.toISOString() }) : p; }); });
    } catch (err) {}
  }

  async function handleReact(postId, reactionType) {
    var myOrgId = approvedOrgIds.find(function(id) { return userOrgIds.indexOf(id) !== -1; });
    if (!myOrgId) return;
    var postReactions = reactions[postId] || {};
    var hasReacted = postReactions['my_' + reactionType] || false;
    setReactions(function(prev) {
      var next = Object.assign({}, prev);
      var pr = Object.assign({}, next[postId] || {});
      if (hasReacted) { pr['my_' + reactionType] = false; pr[reactionType + '_count'] = Math.max(0, (pr[reactionType + '_count'] || 0) - 1); }
      else { pr['my_' + reactionType] = true; pr[reactionType + '_count'] = (pr[reactionType + '_count'] || 0) + 1; }
      next[postId] = pr;
      return next;
    });
    try {
      var { data: authData } = await supabase.auth.getUser();
      if (hasReacted) {
        await supabase.from('cb_post_reactions').delete().eq('post_id', postId).eq('org_id', myOrgId).eq('reaction_type', reactionType);
      } else {
        await supabase.from('cb_post_reactions').insert({ post_id: postId, org_id: myOrgId, user_id: authData.user.id, reaction_type: reactionType });
      }
    } catch (err) {
      loadReactions(posts.map(function(p) { return p.id; }));
    }
  }

  function handleOpenChat(post) { var isOwn = userOrgIds.indexOf(post.org_id) !== -1; setChatState({ post: post, isOwn: isOwn }); }
  function handleMarkRead(postId, count) {
    setUnreadCounts(function(prev) {
      var next = Object.assign({}, prev);
      next[postId] = Math.max(0, (next[postId] || 0) - count);
      return next;
    });
  }

  // Task 26 fix: pinned post now computed in same filter pass — respects active filters.
  var pinnedPost = null;
  var filteredPosts = posts.filter(function(p) {
    var q = searchQuery.toLowerCase().trim();
    var matchesSearch = true;
    if (q) {
      var inTitle = p.title.toLowerCase().indexOf(q) !== -1;
      var inBody = p.body.toLowerCase().indexOf(q) !== -1;
      var inOrg = (p.org_name || '').toLowerCase().indexOf(q) !== -1;
      matchesSearch = inTitle || inBody || inOrg;
    }
    var matchesCategory = !filterCategory || p.category === filterCategory;
    var matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    var passes = matchesSearch && matchesCategory && matchesStatus;
    if (p.is_pinned) { if (passes) pinnedPost = p; return false; }
    return passes;
  });

  var displayPosts = filteredPosts.slice().sort(function(a, b) {
    if (sortBy === 'most_responses') return (b.response_count || 0) - (a.response_count || 0);
    if (sortBy === 'recently_active') return new Date(b.last_activity_at || b.created_at) - new Date(a.last_activity_at || a.created_at);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  var totalUnreadInbox = Object.values(unreadCounts).reduce(function(sum, c) { return sum + c; }, 0);
  var locationStr = [board && board.city, board && board.state].filter(Boolean).join(', ');
  if (board && board.county && !board.city) locationStr = board.county + ' County' + (board.state ? ', ' + board.state : '');
  var hasActiveFilters = searchQuery || filterCategory || filterStatus !== 'all' || sortBy !== 'newest';

  // Shared props builder for PostCard / RecommendationCard
  function renderPostCard(post) {
    var isOwn = userOrgIds.indexOf(post.org_id) !== -1;
    var sharedProps = {
      key: post.id, post: post, isOwn: isOwn, isBoardAdmin: isBoardAdmin,
      unreadCount: unreadCounts[post.id] || 0, reactions: reactions[post.id] || {},
      onEdit: function(p) { setEditingPost(p); },
      onDelete: function(p) { setDeletingPost(p); },
      onStatusChange: handleStatusChange,
      onOpenChat: handleOpenChat,
      onTogglePin: handleTogglePin,
      onRenew: handleRenew,
      onReact: handleReact
    };
    if (isRec) return <RecommendationCard {...sharedProps} contacts={vendorContacts[post.id] || []} />;
    return <PostCard {...sharedProps} config={cfg} onAction={function(p, type) { setActionModal({ post: p, type: type }); }} />;
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (pageLoading) return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div aria-busy="true" aria-label="Loading board" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <img src="/mascot-loading.png" alt="" aria-hidden="true" style={{ width: '180px', mixBlendMode: 'multiply' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {[200, 160, 120].map(function(w, i) { return <div key={i} style={{ width: w + 'px', height: '10px', background: BDR, borderRadius: '6px' }} />; })}
        </div>
      </div>
    </div>
  );

  // ── Board not found ───────────────────────────────────────────────────────
  if (!board) return (
    <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
        <img src="/mascot-error.png" alt="" aria-hidden="true" style={{ width: '160px', mixBlendMode: 'multiply', margin: '0 auto 16px', display: 'block' }} />
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Board Not Found</h1>
        <p style={{ fontSize: '14px', color: TEXT2, marginBottom: '24px' }}>This board may have been removed or the link has expired.</p>
        <button onClick={function() { navigate('/community-board/hub'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <IconArrowLeft size={14} />Back to Boards
        </button>
      </div>
    </main>
  );

  // ── Pending approval ──────────────────────────────────────────────────────
  if (membership && membership.status === 'pending') return (
    <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: YELLOW }}>
          <IconClock size={26} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Request Pending</h1>
        <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, marginBottom: '8px' }}>Your request to join <strong>{board.name}</strong> is waiting for board admin approval.</p>
        <p style={{ fontSize: '13px', color: MUTED, marginBottom: '24px' }}>You will be able to participate once approved.</p>
        <button onClick={function() { navigate('/community-board/hub'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <IconArrowLeft size={14} />Back to Boards
        </button>
      </div>
    </main>
  );

  // ── Not a member / denied ─────────────────────────────────────────────────
  if (!membership || membership.status === 'denied') return (
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
        <button onClick={function() { navigate('/community-board/hub'); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          <IconArrowLeft size={14} />Back to Boards
        </button>
      </div>
    </main>
  );

  // ── Main board view ───────────────────────────────────────────────────────
  return (
    <main style={{ background: BG, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }} aria-label={board.name + ' community board'}>
      <header style={{ background: CARD, borderBottom: '1px solid ' + BDR, padding: '20px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <button onClick={function() { navigate('/community-board/hub'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <IconArrowLeft size={14} />All Boards
            </button>
            {isBoardAdmin && (
              <button onClick={function() { setShowAdminPanel(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '8px', color: PURPLE, fontSize: '13px', fontWeight: 700, cursor: 'pointer', position: 'relative' }}>
                <IconSettings size={14} />Manage Board
                {totalUnreadInbox > 0 && (
                  <span aria-label={totalUnreadInbox + ' unread messages'}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: BLUE, color: '#FFFFFF', borderRadius: '99px', padding: '1px 5px', fontSize: '10px', fontWeight: 700 }}>
                    {totalUnreadInbox > 9 ? '9+' : totalUnreadInbox}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Board identity */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <img src="/mascot-community-board.png" alt="" aria-hidden="true" style={{ width: '36px', height: '36px', mixBlendMode: 'multiply', flexShrink: 0 }} />
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

          {/* Tab nav */}
          <nav role="tablist" aria-label="Board sections" style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map(function(tab) {
              var isActive = activeTab === tab.key;
              var count = tabCounts[tab.key] || 0;
              return (
                <button key={tab.key} role="tab" aria-selected={isActive} id={'tab-' + tab.key}
                  onClick={function() { setActiveTab(tab.key); }}
                  style={{ padding: '10px 16px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: isActive ? tab.color : MUTED, borderBottom: isActive ? '2px solid ' + tab.color : '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {tab.key === 'activity' && <IconActivity size={13} />}
                  {tab.label}
                  {count > 0 && tab.key !== 'activity' && (
                    <span style={{ borderRadius: '99px', padding: '1px 7px', fontSize: '10px', background: isActive ? 'rgba(0,0,0,0.08)' : ELEV, color: isActive ? tab.color : MUTED }}>{count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Board content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
        {activeTab === 'activity' ? (
          <ActivityFeed feed={activityFeed} loading={activityLoading} />
        ) : (
          <>
            {/* Description + post CTA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '13px', color: MUTED, flex: 1, margin: 0 }}>{cfg.description}</p>
              <button onClick={function() { setShowCreate(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <IconPlus size={13} />{cfg.buttonLabel}
              </button>
            </div>

            <FilterToolbar
              config={cfg}
              searchQuery={searchQuery} sortBy={sortBy} filterCategory={filterCategory} filterStatus={filterStatus}
              onSearch={setSearchQuery} onSort={setSortBy} onCategory={setFilterCategory} onStatus={setFilterStatus}
              onClear={function() { setSearchQuery(''); setSortBy('newest'); setFilterCategory(''); setFilterStatus('all'); }}
            />

            {/* Posts */}
            {postsLoading ? (
              <div aria-busy="true" aria-label="Loading posts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '20px' }}>
                {[1, 2, 3, 4, 5, 6].map(function(i) { return <SkeletonCard key={i} cardBg={cfg.cardBg} />; })}
              </div>
            ) : posts.length === 0 ? (
              <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '64px 32px', gap: '16px' }}>
                <img src="/mascot-firstpost.png" alt="" aria-hidden="true" style={{ width: '160px', mixBlendMode: 'multiply' }} />
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: TEXT, margin: 0 }}>{cfg.emptyTitle}</h2>
                <p style={{ fontSize: '13px', color: TEXT2, maxWidth: '360px', lineHeight: 1.65, margin: 0 }}>{cfg.emptyDesc}</p>
                <button onClick={function() { setShowCreate(true); }}
                  style={{ marginTop: '4px', padding: '10px 20px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconPlus size={13} />{cfg.buttonLabel}
                </button>
              </div>
            ) : (
              <>
                {hasActiveFilters && (
                  <p role="status" style={{ fontSize: '12px', color: MUTED, marginBottom: '12px' }}>
                    {'Showing ' + (displayPosts.length + (pinnedPost ? 1 : 0)) + ' of ' + posts.length + ' post' + (posts.length === 1 ? '' : 's')}
                  </p>
                )}
                {displayPosts.length === 0 && !pinnedPost ? (
                  <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 32px', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: CARD, border: '1px solid ' + BDR, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><IconSearch size={20} /></div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: 0 }}>No results found</h2>
                    <p style={{ fontSize: '13px', color: TEXT2, maxWidth: '320px', lineHeight: 1.6, margin: 0 }}>Try adjusting your search or filters.</p>
                    <button onClick={function() { setSearchQuery(''); setSortBy('newest'); setFilterCategory(''); setFilterStatus('all'); }}
                      style={{ padding: '8px 16px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconX size={11} />Clear filters
                    </button>
                  </div>
                ) : (
                  <div role="list" aria-label={cfg.label + ' posts'} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '20px' }}>
                    {pinnedPost && renderPostCard(pinnedPost)}
                    {displayPosts.map(function(post) { return renderPostCard(post); })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modals — approvedOrgIds passed so modals can gray out non-member orgs */}
      {(showCreate || editingPost) && (
        <PostModal
          boardId={boardId} boardType={activeTab} config={cfg}
          userOrgs={userOrgs} approvedOrgIds={approvedOrgIds}
          editingPost={editingPost || null}
          onClose={function() { setShowCreate(false); setEditingPost(null); }}
          onSuccess={function() { loadPosts(activeTab); loadTabCounts(); }}
        />
      )}
      {deletingPost && (
        <DeleteConfirmModal post={deletingPost} onConfirm={handleDeleteConfirm} onCancel={function() { setDeletingPost(null); }} />
      )}
      {actionModal && (
        <ActionModal
          post={actionModal.post} actionType={actionModal.type} config={cfg}
          userOrgs={userOrgs.filter(function(o) { return approvedOrgIds.indexOf(o.id) !== -1; })}
          boardName={board.name} approvedOrgIds={approvedOrgIds}
          onClose={function() { setActionModal(null); }}
          onSuccess={function() { loadPosts(activeTab); }}
        />
      )}
      {showAdminPanel && (
        <AdminPanel
          board={board} boardId={boardId} userOrgIds={userOrgIds}
          inboxUnreadCount={totalUnreadInbox}
          onClose={function() { setShowAdminPanel(false); }}
          onMembershipChange={function() { loadPage(); }}
          onSettingsChange={function() { loadPage(); setShowAdminPanel(false); }}
        />
      )}
      {chatState.post && (
        <PostChatPanel
          post={chatState.post} isOwn={chatState.isOwn}
          userOrgs={userOrgs} approvedOrgIds={approvedOrgIds}
          onClose={function() { setChatState({ post: null, isOwn: false }); }}
          onMarkRead={handleMarkRead}
        />
      )}
    </main>
  );
}