import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';
import useOrgAccess from '../hooks/useOrgAccess';
import SubscriptionBanner from '../components/SubscriptionBanner';
import OrgUnavailable from '../pages/OrgUnavailable';
import OrgIced from '../pages/OrgIced';
import usePlanLimits from '../hooks/usePlanLimits';

// ── Light theme tokens ────────────────────────────────────────────────────────
var pageBg      = '#F8FAFC';
var sectionBg   = '#FFFFFF';
var cardBg      = '#FFFFFF';
var borderColor = '#E2E8F0';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// ── Items that can never be hidden ───────────────────────────────────────────
var ALWAYS_VISIBLE = ['overview', 'settings', 'billing'];

// ── Icon ──────────────────────────────────────────────────────────────────────
function Icon({ path, className, style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" style={style}>
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

// ── Locked nav badge ──────────────────────────────────────────────────────────
function LockedNavBadge({ requiredPlan }) {
  var label = requiredPlan === 'pro' ? 'Pro' : requiredPlan === 'verified' ? 'Verified' : 'Growth';
  var colors = {
    growth:   { bg:'rgba(59,130,246,0.15)',  border:'rgba(59,130,246,0.3)',  text:'#3B82F6' },
    pro:      { bg:'rgba(139,92,246,0.15)',  border:'rgba(139,92,246,0.3)',  text:'#8B5CF6' },
    verified: { bg:'rgba(34,197,94,0.15)',   border:'rgba(34,197,94,0.3)',   text:'#22C55E' },
  };
  var c = colors[requiredPlan] || colors.growth;
  return (
    <span
      style={{ background:c.bg, border:'1px solid '+c.border, color:c.text, fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px', marginLeft:'4px', textTransform:'uppercase', letterSpacing:'0.5px', lineHeight:1, flexShrink:0 }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

// ── Icon paths ────────────────────────────────────────────────────────────────
var ICONS = {
  overview:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  calendar:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  megaphone:  ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  members:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  groups:     ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'],
  chat:       ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  folder:     'M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  photo:      ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  polls:      ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7H9m3 0h.01M9 16h.01'],
  surveys:    ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'],
  forms:      ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  programs:   ['M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
  approvals:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  inbox:      ['M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'],
  analytics:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  pencil:     ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  pinboard:   ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  settings:   ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  billing:    ['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
  x:          'M6 18L18 6M6 6l12 12',
  menu:       'M4 6h16M4 12h16M4 18h16',
  email:      'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  contacts:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  tasks:      ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  scheduling: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  opportunities: ['M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
funding:       ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  // eye / eye-off for hide/show
  eye:        ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  eyeOff:     ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  pencilEdit: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
};

// ── Nav groups builder ────────────────────────────────────────────────────────
function buildNavGroups(organizationId, pendingCount, unreadCount) {
  var base = '/organizations/' + organizationId;
  return [
    {
      label: 'Workspace',
      items: [
        { id:'overview',      label:'Overview',      iconKey:'overview',   route:'',              path: base,                            roles:['admin','member'] },
        { id:'events',        label:'Events',        iconKey:'calendar',   route:'events',        path: base + '/events',                roles:['admin','member'], tourKey:'tour-events-nav' },
        { id:'members',       label:'Members',       iconKey:'members',    route:'members',       path: base + '/members',               roles:['admin','member'], tourKey:'tour-members-nav' },
        { id:'groups',        label:'Groups',        iconKey:'groups',     route:'groups',        path: base + '/groups',                roles:['admin','member'] },
        { id:'chat',          label:'Chat',          iconKey:'chat',       route:'chat',          path: base + '/chat',                  roles:['admin','member'] },
        { id:'documents',     label:'Documents',     iconKey:'folder',     route:'documents',     path: base + '/documents',             roles:['admin','member'] },
        { id:'photos',        label:'Photos',        iconKey:'photo',      route:'photos',        path: base + '/photos',                roles:['admin','member'] },
        { id:'forms', label:'Forms', iconKey:'forms', route:'forms', path: base + '/forms', roles:['admin','member'] },
      ]
    },
    {
      label: 'Community',
      items: [
        { id:'programs',      label:'Programs',      iconKey:'programs',   route:'programs',      path: base + '/programs' },
        { id:'opportunities', label:'Opportunities', iconKey:'opportunities', route:'opportunities', path: base + '/opportunities', lock:'verified' },
        { id:'funding',       label:'Funding',       iconKey:'funding',    route:'funding',       path: base + '/funding',       lock:'verified' },
      ]
    },
    {
      label: 'Engagement',
      items: [
        { id:'announcements', label:'Announcements', iconKey:'megaphone',  route:'announcements', path: base + '/announcements',         roles:['admin','member'], tourKey:'tour-announcements-nav' },
        { id:'polls',         label:'Polls',         iconKey:'polls',      route:'polls',         path: base + '/polls' },
        { id:'surveys',       label:'Surveys',       iconKey:'surveys',    route:'surveys',       path: base + '/surveys' },
        { id:'forms',         label:'Sign-Up Forms', iconKey:'forms',      route:'signup-forms',  path: base + '/signup-forms' },
        { id:'scheduling',    label:'Scheduling',    iconKey:'scheduling', route:'scheduling',    path: base + '/scheduling' },
      ]
    },
    {
      label: 'Admin',
      adminOnly: true,
      items: [
        { id:'approvals',    label:'Approvals',    iconKey:'approvals', route:'approvals',    path: base + '/approvals',    badge: pendingCount },
        { id:'inbox',        label:'Inbox',        iconKey:'inbox',     route:'inbox',        path: base + '/inbox',        badge: unreadCount },
        { id:'tasks',        label:'Tasks',        iconKey:'tasks',     route:'tasks',        path: base + '/tasks' },
        { id:'contacts',     label:'Contacts',     iconKey:'contacts',  route:'contacts',     path: base + '/contacts' },
        { id:'analytics',    label:'Analytics',    iconKey:'analytics', route:'analytics',    path: base + '/analytics',    lock:'growth' },
        { id:'publicpage',   label:'Public Page',  iconKey:'pencil',    route:'page-editor',  path: base + '/page-editor',  tourKey:'tour-public-page-nav', adminOnly: true },
        { id:'email-blasts', label:'Email Blasts', iconKey:'email',     route:'email-blasts', path: base + '/email-blasts', adminOnly: true, lock:'growth' },
      ]
    },
    {
      label: 'Platform',
      adminOnly: true,
      items: [
        { id:'community-board', label:'Community Board', iconKey:'pinboard', route:'community-board', path: '/community-board/hub', activePath: '/community-board', isPurple: true, lock:'verified' },
        { id:'settings',        label:'Settings',        iconKey:'settings', route:'settings',        path: base + '/settings' },
        { id:'billing',         label:'Billing',         iconKey:'billing',  route:'billing',         path: base + '/billing', isSub: true, adminOnly: true },
      ]
    },
  ];
}

// ── Layout ────────────────────────────────────────────────────────────────────
function OrgLayout() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();
  var location = useLocation();

  var [organization, setOrganization] = useState(null);
  var [membership, setMembership] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [viewMode, setViewMode] = useState('admin');
  var [pendingCount, setPendingCount] = useState(0);
  var [unreadCount, setUnreadCount] = useState(0);
  var [mobileNavOpen, setMobileNavOpen] = useState(false);
  var [lockedNavTarget, setLockedNavTarget] = useState(null);

  // ── Nav edit state ────────────────────────────────────────────────────────
  var [editingNav, setEditingNav] = useState(false);
  var [hiddenNavItems, setHiddenNavItems] = useState([]);
  var [navSaving, setNavSaving] = useState(false);

  var access = useOrgAccess(organizationId);
  var accessStatus = access.status;
  var accessDaysLeft = access.daysLeft;

  var planData = usePlanLimits(organizationId);
  var currentPlan = planData ? planData.plan : null;
  var isAllowed = planData ? planData.isAllowed : function() { return false; };

  var isAdmin = !!(membership && membership.role === 'admin' && viewMode === 'admin');

  useEffect(function() { fetchLayout(); }, [organizationId]);

  useEffect(function() {
    function handleInboxUpdate(e) {
      setUnreadCount(e.detail.total);
    }
    window.addEventListener('inboxUnreadUpdate', handleInboxUpdate);
    return function() { window.removeEventListener('inboxUnreadUpdate', handleInboxUpdate); };
  }, []);

  // ── Fetch nav preferences ─────────────────────────────────────────────────
  async function fetchHiddenNavItems() {
    try {
      var key = 'nav_hidden_items_' + organizationId;
      var r = await supabase.from('site_content').select('value').eq('key', key).maybeSingle();
      if (r.data && r.data.value) {
        var parsed = JSON.parse(r.data.value);
        setHiddenNavItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      // No saved prefs yet — default to nothing hidden
      setHiddenNavItems([]);
    }
  }

  async function saveHiddenNavItems(items) {
    setNavSaving(true);
    try {
      var key = 'nav_hidden_items_' + organizationId;
      var value = JSON.stringify(items);
      // Check if row exists first
      var existing = await supabase.from('site_content').select('id').eq('key', key).maybeSingle();
      if (existing.data) {
        await supabase.from('site_content').update({ value: value, updated_at: new Date().toISOString() }).eq('key', key);
      } else {
        await supabase.from('site_content').insert({ key: key, value: value, label: 'Nav Hidden Items', section: 'navigation', field_type: 'json' });
      }
    } catch (e) {
      console.error('Failed to save nav prefs:', e);
    } finally {
      setNavSaving(false);
    }
  }

  function toggleNavItem(itemId) {
    var updated;
    if (hiddenNavItems.includes(itemId)) {
      updated = hiddenNavItems.filter(function(id) { return id !== itemId; });
    } else {
      updated = hiddenNavItems.concat([itemId]);
    }
    setHiddenNavItems(updated);
    saveHiddenNavItems(updated);
  }

  function isItemHidden(itemId) {
    return hiddenNavItems.includes(itemId);
  }

  async function fetchLayout() {
    try {
      var authResult = await supabase.auth.getUser();
      if (authResult.error || !authResult.data.user) { navigate('/login'); return; }
      var userId = authResult.data.user.id;

      var orgResult = await supabase.from('organizations').select('id,name,type,logo_url,description,is_verified_nonprofit,contact_email,contact_email_verified').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memResult = await supabase.from('memberships').select('id,role,status').eq('organization_id', organizationId).eq('member_id', userId).eq('status', 'active').maybeSingle();
      if (memResult.error) throw memResult.error;

      // Allow non-members to view program detail pages when navigating from discover
      var isProgramDetailRoute = location.pathname.match(/\/programs\/[^/]+$/);
      if (!memResult.data && !isProgramDetailRoute) { setError('You are not a member of this organization.'); setLoading(false); return; }
      setMembership(memResult.data || null);

      if (memResult.data && memResult.data.role === 'admin') {
        supabase.from('contact_inquiries').select('*', { count:'exact', head:true }).eq('organization_id', organizationId).eq('is_read', false).then(function(r) { setUnreadCount(r.count || 0); });
        var tables = ['events','announcements','polls','surveys','signup_forms'];
        var total = 0;
        Promise.all(tables.map(function(t) {
          return supabase.from(t).select('id', { count:'exact', head:true }).eq('organization_id', organizationId).eq('approval_status', 'pending');
        })).then(function(results) {
          results.forEach(function(r) { total += (r.count || 0); });
          setPendingCount(total);
        });
      }

      // Always fetch nav prefs (applies to all users)
      await fetchHiddenNavItems();

    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function isActive(item) {
    var base = '/organizations/' + organizationId;
    var pathname = location.pathname.replace(/\/$/, '');
    if (item.activePath) {
      return pathname === item.activePath || pathname.startsWith(item.activePath + '/');
    }
    if (item.route === '') return pathname === base;
    return pathname === base + '/' + item.route || pathname.startsWith(base + '/' + item.route + '/');
  }

  // ── Render nav ────────────────────────────────────────────────────────────
  function renderNav() {
    var navGroups = buildNavGroups(organizationId, pendingCount, unreadCount);

    // Collect all hidden items from all groups for the Platform section footer
    var hiddenItemDefs = [];
    navGroups.forEach(function(group) {
      group.items.forEach(function(item) {
        if (isItemHidden(item.id) && !ALWAYS_VISIBLE.includes(item.id)) {
          hiddenItemDefs.push(item);
        }
      });
    });

    return (
      <>
        {navGroups.map(function(group) {
          if (group.adminOnly && !isAdmin) return null;

          var visibleItems = group.items.filter(function(item) {
            if (item.adminOnly && !isAdmin) return false;
            if (!isAdmin && group.label === 'Admin') return false;
            // Members never see hidden items
            if (!isAdmin && isItemHidden(item.id)) return false;
            // Admins: hide from normal groups — they'll appear in Platform footer
            if (isAdmin && !editingNav && isItemHidden(item.id) && group.label !== 'Platform') return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} style={{ marginBottom:'4px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 10px 4px', marginTop:'2px' }}>
              <div style={{ height:'1px', width:'8px', background:'#E2E8F0', flexShrink:0 }} aria-hidden="true" />
              <p style={{ fontSize:'9px', fontWeight:800, letterSpacing:'3px', textTransform:'uppercase', color:'#94A3B8', margin:0, whiteSpace:'nowrap' }}>{group.label}</p>
              <div style={{ height:'1px', flex:1, background:'#E2E8F0' }} aria-hidden="true" />
            </div>
              {visibleItems.map(function(item) {
                var active = isActive(item);
                var hidden = isItemHidden(item.id);
                var canHide = !ALWAYS_VISIBLE.includes(item.id);

                var isLocked = false;
                var lockReason = null;
                if (item.lock === 'growth') {
                  isLocked = !isAllowed('has_full_analytics');
                  lockReason = isLocked ? 'growth' : null;
                } else if (item.lock === 'pro') {
                  isLocked = !isAllowed('has_ai_assistant');
                  lockReason = isLocked ? 'pro' : null;
                } else if (item.lock === 'verified') {
                  isLocked = !(organization && organization.is_verified_nonprofit);
                  lockReason = isLocked ? 'verified' : null;
                }

                var color = isLocked
                  ? '#94A3B8'
                  : (item.isPurple ? '#A78BFA' : active ? '#3B82F6' : textSecondary);
                var bg = active && !isLocked ? 'rgba(59,130,246,0.08)' : 'transparent';

                return (
                  <div key={item.id} style={{ position:'relative', display:'flex', alignItems:'center', gap:'2px' }}>
                    <button
                      onClick={function() {
                        if (editingNav) return;
                        if (item.comingSoon) return;
                        if (isLocked && lockReason === 'verified') {
                          setLockedNavTarget(lockReason);
                          return;
                        }
                        setMobileNavOpen(false);
                        if (item.path) navigate(item.path);
                      }}
                      data-tour={item.tourKey || undefined}
                      style={{
                        display:'flex', alignItems:'center', gap:'8px',
                        padding: item.isSub ? '7px 10px 7px 26px' : '7px 10px',
                        borderRadius:'7px',
                        fontSize: item.isSub ? '11px' : '12px',
                        fontWeight: 600,
                        color: color,
                        background: bg,
                        border:'none',
                        cursor: editingNav ? 'default' : (item.comingSoon ? 'default' : 'pointer'),
                        flex: 1,
                        textAlign:'left',
                        whiteSpace:'nowrap',
                        opacity: isLocked ? 0.5 : 1,
                        transition: 'background 0.15s',
                      }}
                      aria-current={active && !isLocked ? 'page' : undefined}
                      aria-disabled={isLocked || item.comingSoon ? true : undefined}
                      aria-label={
                        isLocked && lockReason === 'verified'
                          ? (item.label + ' — available to verified nonprofits')
                          : item.comingSoon
                            ? (item.label + ' — coming soon')
                            : item.label
                      }
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                      <Icon path={ICONS[item.iconKey]} className="h-3.5 w-3.5" style={{ flexShrink:0, color:color }} />
                      <span style={{ flex:1 }}>{item.label}</span>

                      {item.comingSoon && !editingNav && (
                        <span style={{ fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px', background:'#F1F5F9', color:'#64748B', border:'1px solid #E2E8F0', textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }} aria-hidden="true">
                          Soon
                        </span>
                      )}

                      {isLocked && lockReason && !editingNav && (
                        <>
                          <Lock size={10} style={{ color:'#94A3B8', flexShrink:0 }} aria-hidden="true" />
                          <LockedNavBadge requiredPlan={lockReason} />
                        </>
                      )}

                      {!isLocked && !item.comingSoon && item.badge > 0 && !editingNav && (
                        <span
                          style={{ background: item.id === 'inbox' ? '#EF4444' : '#F5B731', color: item.id === 'inbox' ? '#FFFFFF' : '#1A0000', fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px', flexShrink:0 }}
                          aria-label={item.badge + ' pending'}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Eye toggle — only shown in edit mode for hideable items */}
                    {editingNav && isAdmin && canHide && (
                      <button
                        onClick={function() { toggleNavItem(item.id); }}
                        style={{
                          width:'26px', height:'26px', flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          background: 'transparent',
                          border:'none', borderRadius:'6px', cursor:'pointer',
                          color: hidden ? '#CBD5E1' : '#3B82F6',
                          marginRight:'4px',
                        }}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label={(hidden ? 'Show ' : 'Hide ') + item.label + ' from navigation'}
                        aria-pressed={!hidden}
                        title={hidden ? 'Show in nav' : 'Hide from nav'}
                      >
                        <Icon path={hidden ? ICONS.eyeOff : ICONS.eye} className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Lock icon placeholder when edit mode but not hideable */}
                    {editingNav && isAdmin && !canHide && (
                      <div style={{ width:'26px', height:'26px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginRight:'4px' }} aria-hidden="true">
                        <Lock size={11} style={{ color:'#CBD5E1' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Hidden items section — admin only, shown when not in edit mode */}
        {isAdmin && !editingNav && hiddenItemDefs.length > 0 && (
          <div style={{ marginTop:'4px', marginBottom:'4px' }}>
            <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#CBD5E1', padding:'8px 10px 3px' }}>Hidden Pages</p>
            {hiddenItemDefs.map(function(item) {
              var hiddenActive = isActive(item);
              return (
                <div key={'hidden-' + item.id} style={{ display:'flex', alignItems:'center', gap:'2px' }}>
                  <button
                    onClick={function() { if (item.path) navigate(item.path); }}
                    style={{
                      display:'flex', alignItems:'center', gap:'8px',
                      padding:'6px 10px',
                      borderRadius:'7px',
                      fontSize:'12px', fontWeight:500,
                      color: hiddenActive ? '#94A3B8' : '#CBD5E1',
                      background: hiddenActive ? 'rgba(148,163,184,0.08)' : 'transparent',
                      border:'none',
                      cursor:'pointer',
                      flex:1,
                      whiteSpace:'nowrap',
                      textAlign:'left',
                    }}
                    aria-label={'View ' + item.label + ' (currently hidden from members)'}
                    className="focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 hover:text-slate-400"
                  >
                    <Icon path={ICONS[item.iconKey]} className="h-3.5 w-3.5" style={{ flexShrink:0, color:'#CBD5E1' }} />
                    <span style={{ flex:1 }}>{item.label}</span>
                    <span style={{ fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px', background:'#F1F5F9', color:'#CBD5E1', border:'1px solid #E2E8F0', textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>
                      Hidden
                    </span>
                  </button>
                  <button
                    onClick={function() { toggleNavItem(item.id); }}
                    style={{
                      width:'26px', height:'26px', flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background:'transparent', border:'none', borderRadius:'6px',
                      cursor:'pointer', color:'#94A3B8', marginRight:'4px',
                    }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label={'Show ' + item.label + ' in navigation'}
                    title="Show in nav"
                  >
                    <Icon path={ICONS.eye} className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit nav toggle button — admin only */}
        {isAdmin && (
          <div style={{ marginTop:'8px', paddingTop:'8px', borderTop:'1px solid #F1F5F9' }}>
            <button
              onClick={function() { setEditingNav(function(p) { return !p; }); }}
              style={{
                display:'flex', alignItems:'center', gap:'6px',
                width:'100%', padding:'6px 10px',
                background: editingNav ? 'rgba(59,130,246,0.06)' : 'transparent',
                border: editingNav ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                borderRadius:'7px',
                fontSize:'11px', fontWeight:700,
                color: editingNav ? '#3B82F6' : '#94A3B8',
                cursor:'pointer', textAlign:'left',
              }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 hover:text-slate-500"
              aria-pressed={editingNav}
              aria-label={editingNav ? 'Done editing navigation' : 'Edit navigation visibility'}
            >
              <Icon
                path={editingNav ? ICONS.x : ICONS.pencilEdit}
                className="h-3 w-3"
                style={{ flexShrink:0 }}
              />
              {editingNav ? 'Done editing' : 'Edit nav'}
              {navSaving && (
                <span style={{ marginLeft:'auto', fontSize:'9px', color:'#94A3B8', fontWeight:400 }}>Saving...</span>
              )}
            </button>

            {editingNav && (
              <p style={{ fontSize:'10px', color:'#94A3B8', padding:'4px 10px 2px', lineHeight:1.4 }}>
                Toggle pages to show or hide them from members.
              </p>
            )}
          </div>
        )}
      </>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading || planData.loading) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh' }} aria-busy="true" aria-label="Loading organization">
        <div style={{ padding:'20px 8px' }}>
          <div style={{ maxWidth:'1600px', margin:'0 auto' }}>
            <div style={{ background:'#FFFFFF', borderRadius:'12px', padding:'12px 18px', marginBottom:'12px', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#E2E8F0' }} />
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
                <div style={{ width:'160px', height:'12px', background:'#E2E8F0', borderRadius:'6px' }} />
                <div style={{ width:'80px', height:'10px', background:'#F1F5F9', borderRadius:'6px' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'16px' }}>
              <div style={{ width:'240px', flexShrink:0, background:'#FFFFFF', borderRadius:'10px', border:'1px solid #E2E8F0', padding:'10px 8px', display:'flex', flexDirection:'column', gap:'6px' }}>
                {[100, 80, 90, 70, 85, 75, 60].map(function(w, i) {
                  return <div key={i} style={{ height:'28px', background:'#F1F5F9', borderRadius:'7px', width: w + '%' }} />;
                })}
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ height:'120px', background:'#FFFFFF', borderRadius:'12px', border:'1px solid #E2E8F0' }} />
                <div style={{ height:'200px', background:'#FFFFFF', borderRadius:'12px', border:'1px solid #E2E8F0' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
        <div style={{ textAlign:'center', maxWidth:'380px' }}>
          <div style={{ width:'56px', height:'56px', background:'#FEF2F2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'1px solid #FECACA' }} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 style={{ fontSize:'20px', fontWeight:800, color:textPrimary, marginBottom:'8px' }}>Access Denied</h1>
          <p style={{ color:textSecondary, marginBottom:'24px', fontSize:'14px', lineHeight:1.6 }}>{error}</p>
          <button
            onClick={function() { navigate('/dashboard'); }}
            style={{ background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'10px 24px', fontWeight:700, cursor:'pointer', fontSize:'13px' }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Trial / access gates ──────────────────────────────────────────────────
  if (!access.loading && accessStatus === 'iced' && isAdmin) {
    return <OrgIced orgName={organization && organization.name} orgId={organizationId} />;
  }
  if (!access.loading && (accessStatus === 'expired' || accessStatus === 'iced') && !isAdmin) {
    return <OrgUnavailable orgName={organization && organization.name} />;
  }

  // ── Listed plan gate ──────────────────────────────────────────────────────
  if (!planData.loading && currentPlan === 'listed') {
    var listingPath = '/organizations/' + organizationId + '/listing';
    if (location.pathname !== listingPath) {
      navigate(listingPath, { replace: true });
      return null;
    }
  }

  // ── Email verification gate ───────────────────────────────────────────────
  if (!access.loading && organization && organization.contact_email_verified === false && isAdmin) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', padding:'40px 32px', maxWidth:'460px', width:'100%', textAlign:'center', boxShadow:'0 4px 24px rgba(14,21,35,0.06)' }}>
          <div style={{ width:'56px', height:'56px', background:'rgba(245,183,49,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#F5B731" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h1 style={{ fontSize:'20px', fontWeight:800, color:textPrimary, marginBottom:'10px' }}>Verify Your Contact Email</h1>
          <p style={{ color:textSecondary, fontSize:'14px', lineHeight:1.6, marginBottom:'8px' }}>
            A verification email was sent to <strong style={{ color:textPrimary }}>{organization.contact_email}</strong>.
          </p>
          <p style={{ color:textMuted, fontSize:'13px', lineHeight:1.6, marginBottom:'28px' }}>
            Please check your inbox and click the link to verify your organization's contact email before accessing your workspace.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <button
              onClick={async function() {
                var res = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/verify-contact-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ organization_id: organizationId })
                });
                var data = await res.json();
                if (data.success) {
                  alert('Verification email sent! Please check your inbox.');
                } else {
                  alert('Could not send email. Please try again.');
                }
              }}
              style={{ background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'12px 24px', fontWeight:700, cursor:'pointer', fontSize:'14px' }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Resend Verification Email
            </button>
            <button
              onClick={function() { navigate('/dashboard'); }}
              style={{ background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', padding:'12px 24px', fontWeight:600, cursor:'pointer', fontSize:'14px' }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div style={{ background:pageBg, minHeight:'100vh' }}>
      <SubscriptionBanner
        status={accessStatus}
        daysLeft={accessDaysLeft}
        orgId={organizationId}
        isAdmin={isAdmin}
      />
      <div style={{ padding:'20px 8px' }}>
        <div style={{ maxWidth:'1600px', margin:'0 auto' }}>

          {/* Org header bar */}
          <div style={{ background:sectionBg, borderRadius:'12px', padding:'12px 18px', marginBottom:'12px', border:'1px solid '+borderColor, display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
            {organization && organization.logo_url ? (
              <img src={organization.logo_url} alt={organization.name + ' logo'} style={{ width:'38px', height:'38px', borderRadius:'50%', objectFit:'cover', border:'2px solid #E2E8F0', flexShrink:0 }} />
            ) : (
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'2px solid #E2E8F0' }} aria-hidden="true">
                <span style={{ color:'#3B82F6', fontWeight:800, fontSize:'14px' }}>{organization ? (organization.name || 'O').charAt(0) : 'O'}</span>
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:'17px', fontWeight:800, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>{organization ? organization.name : ''}</p>
              <div style={{ display:'flex', gap:'6px', marginTop:'3px', flexWrap:'wrap' }}>
                {organization && (
                  <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:700, background:'#EFF6FF', color:'#3B82F6', textTransform:'capitalize' }}>{organization.type}</span>
                )}
                <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:700, background: isAdmin ? '#F5F3FF' : '#EFF6FF', color: isAdmin ? '#8B5CF6' : '#3B82F6' }}>
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
                {organization && organization.is_verified_nonprofit && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:700, background:'rgba(34,197,94,0.1)', color:'#16A34A', border:'1px solid rgba(34,197,94,0.25)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'10px', height:'10px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Admin / Member view toggle */}
            {membership && membership.role === 'admin' && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                <span style={{ fontSize:'11px', color:'#8B5CF6', fontWeight:600 }}>Admin</span>
                <button
                  onClick={function() { setViewMode(viewMode === 'admin' ? 'member' : 'admin'); }}
                  style={{ position:'relative', display:'inline-flex', alignItems:'center', width:'40px', height:'22px', borderRadius:'99px', background: viewMode === 'admin' ? '#8B5CF6' : '#3B82F6', border:'none', cursor:'pointer', padding:0, transition:'background 0.2s' }}
                  role="switch" aria-checked={viewMode === 'admin'} aria-label="Toggle admin or member view"
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <span style={{ position:'absolute', width:'18px', height:'18px', borderRadius:'50%', background:'#FFFFFF', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'transform 0.2s', transform: viewMode === 'admin' ? 'translateX(2px)' : 'translateX(18px)' }} />
                </button>
                <span style={{ fontSize:'11px', color:textMuted, fontWeight:600 }}>Member</span>
              </div>
            )}

            {/* Mobile nav toggle */}
            <button
              onClick={function() { setMobileNavOpen(!mobileNavOpen); }}
              style={{ background:'transparent', border:'1px solid '+borderColor, borderRadius:'8px', padding:'6px', cursor:'pointer', color:textSecondary }}
              className="lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileNavOpen}
            >
              <Icon path={ICONS.menu} className="h-5 w-5" />
            </button>
          </div>

          {/* Main content + sidebar */}
          <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>

            {/* Sidebar nav */}
            <aside
              data-tour="tour-org-nav"
              style={{ width:'240px', flexShrink:0, background:sectionBg, border:'1px solid '+borderColor, borderRadius:'10px', padding:'10px 8px', display:'flex', flexDirection:'column', gap:'1px', position:'sticky', top:'20px' }}
              aria-label="Organization navigation"
              role="navigation"
            >
              {renderNav()}
            </aside>

            {/* Page content */}
            <main style={{ flex:1, minWidth:0 }} role="main">
              {(function() {
                // Detect if the current route is a hidden page — admin-only banner
                if (!isAdmin || hiddenNavItems.length === 0) return null;
                var allItems = [];
                buildNavGroups(organizationId, 0, 0).forEach(function(g) { g.items.forEach(function(i) { allItems.push(i); }); });
                var currentHiddenItem = allItems.find(function(item) {
                  return isItemHidden(item.id) && isActive(item);
                });
                if (!currentHiddenItem) return null;
                return (
                  <div
                    style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 16px', marginBottom:'16px', background:'rgba(148,163,184,0.08)', border:'1px solid rgba(148,163,184,0.25)', borderRadius:'10px' }}
                    role="status"
                    aria-label="This page is hidden from members"
                  >
                    <Icon path={ICONS.eyeOff} className="h-4 w-4" style={{ color:'#94A3B8', flexShrink:0 }} />
                    <p style={{ fontSize:'12px', color:'#64748B', flex:1, margin:0, lineHeight:1.5 }}>
                      <strong style={{ color:'#475569' }}>{currentHiddenItem.label}</strong> is hidden from members — only you can see this page.
                    </p>
                    <button
                      onClick={function() { toggleNavItem(currentHiddenItem.id); }}
                      style={{ fontSize:'11px', fontWeight:700, color:'#3B82F6', background:'none', border:'none', cursor:'pointer', flexShrink:0, padding:'3px 8px', borderRadius:'6px' }}
                      className="hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label={'Make ' + currentHiddenItem.label + ' visible to members'}
                    >
                      Unhide
                    </button>
                  </div>
                );
              })()}
              <Outlet context={{ organization:organization, membership:membership, isAdmin:isAdmin, viewMode:viewMode, organizationId:organizationId, accessStatus:accessStatus }} />
            </main>

          </div>
        </div>
      </div>

      {/* Locked feature modal */}
      {lockedNavTarget && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:60 }}
          role="dialog" aria-modal="true" aria-labelledby="lock-modal-title"
          onClick={function() { setLockedNavTarget(null); }}
        >
          <div
            style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', width:'100%', maxWidth:'380px', padding:'24px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background: lockedNavTarget === 'verified' ? 'rgba(34,197,94,0.1)' : lockedNavTarget === 'pro' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} aria-hidden="true">
                <Lock size={18} style={{ color: lockedNavTarget === 'verified' ? '#22C55E' : lockedNavTarget === 'pro' ? '#8B5CF6' : '#3B82F6' }} />
              </div>
              <h2 id="lock-modal-title" style={{ fontSize:'15px', fontWeight:800, color:textPrimary, margin:0 }}>
                {lockedNavTarget === 'verified' ? 'Verified Nonprofits Only' : lockedNavTarget === 'pro' ? 'Available on Pro' : 'Available on Growth'}
              </h2>
            </div>
            <p style={{ fontSize:'13px', color:textSecondary, lineHeight:1.6, marginBottom:'20px' }}>
              {lockedNavTarget === 'verified'
                ? 'This feature is available to verified 501(c)(3) organizations. Submit your EIN to get verified.'
                : lockedNavTarget === 'pro'
                  ? 'Upgrade to Pro to unlock the AI content assistant and priority support.'
                  : 'Upgrade to Growth to unlock analytics, email blasts, paid ticketing, and more.'
              }
            </p>
            <div style={{ display:'flex', gap:'10px' }}>
              {lockedNavTarget !== 'verified' && (
                <button
                  onClick={function() { setLockedNavTarget(null); navigate('/organizations/'+organizationId+'/billing'); }}
                  style={{ flex:1, padding:'10px', background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                  className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  View Plans
                </button>
              )}
              {lockedNavTarget === 'verified' && (
                <button
                  onClick={function() { setLockedNavTarget(null); navigate('/organizations/'+organizationId+'/settings'); }}
                  style={{ flex:1, padding:'10px', background:'#22C55E', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                  className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                >
                  Get Verified
                </button>
              )}
              <button
                onClick={function() { setLockedNavTarget(null); }}
                style={{ padding:'10px 16px', background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
                className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }} role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} onClick={function() { setMobileNavOpen(false); }} aria-hidden="true" />
          <div style={{ position:'relative', width:'240px', background:sectionBg, borderRight:'1px solid '+borderColor, padding:'16px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'2px', zIndex:1 }}>
            <button
              onClick={function() { setMobileNavOpen(false); }}
              style={{ position:'absolute', top:'12px', right:'12px', background:'transparent', border:'none', cursor:'pointer', color:textMuted, padding:'4px' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close navigation"
            >
              <Icon path={ICONS.x} className="h-5 w-5" />
            </button>
            <div style={{ marginBottom:'8px', paddingBottom:'12px', borderBottom:'1px solid '+borderColor }}>
              <p style={{ fontSize:'13px', fontWeight:800, color:textPrimary, margin:0 }}>{organization ? organization.name : ''}</p>
            </div>
            {renderNav()}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgLayout;