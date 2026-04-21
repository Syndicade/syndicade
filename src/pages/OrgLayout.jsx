import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Lock } from 'lucide-react';
import useOrgAccess from '../hooks/useOrgAccess';
import SubscriptionBanner from '../components/SubscriptionBanner';
import OrgUnavailable from '../pages/OrgUnavailable';
import OrgIced from '../pages/OrgIced';
import usePlanLimits from '../hooks/usePlanLimits';

// ── Icon ──────────────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
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
};

// ── Nav groups ────────────────────────────────────────────────────────────────
function buildNavGroups(organizationId, pendingCount, unreadCount) {
  var base = '/organizations/' + organizationId;
  return [
    {
      label: 'Workspace',
      items: [
        { id:'overview',      label:'Overview',      iconKey:'overview',  route:'',              path: base,                      roles:['admin','member'] },
        { id:'events',        label:'Events',        iconKey:'calendar',  route:'events',        path: base + '/events',          roles:['admin','member'], tourKey:'tour-events-nav' },
        { id:'announcements', label:'Announcements', iconKey:'megaphone', route:'announcements', path: base + '/announcements',   roles:['admin','member'], tourKey:'tour-announcements-nav' },
        { id:'members',       label:'Members',       iconKey:'members',   route:'members',       path: base + '/members',         roles:['admin','member'], tourKey:'tour-members-nav' },
        { id:'groups',        label:'Groups',        iconKey:'groups',    route:'groups',        path: base + '/groups',          roles:['admin','member'] },
        { id:'chat',          label:'Chat',          iconKey:'chat',      route:'chat',          path: base + '/chat',            roles:['admin','member'] },
        { id:'documents',     label:'Documents',     iconKey:'folder',    route:'documents',     path: base + '/documents',       roles:['admin','member'] },
        { id:'photos',        label:'Photos',        iconKey:'photo',     route:'photos',        path: base + '/photos',          roles:['admin','member'] },
      ]
    },
    {
      label: 'Tools',
      items: [
        { id:'polls',    label:'Polls & Surveys', iconKey:'polls',    route:'polls',        path: base + '/polls' },
        { id:'forms',    label:'Sign-Up Forms',   iconKey:'forms',    route:'signup-forms', path: base + '/signup-forms' },
        { id:'programs', label:'Programs',        iconKey:'programs', route:'programs',     path: base + '/programs' },
      ]
    },
    {
      label: 'Admin',
      adminOnly: true,
      items: [
        { id:'approvals',    label:'Approvals',    iconKey:'approvals', route:'approvals',    path: base + '/approvals',    badge: pendingCount },
        { id:'inbox',        label:'Inbox',        iconKey:'inbox',     route:'inbox',        path: base + '/inbox',        badge: unreadCount },
        { id:'analytics',    label:'Analytics',    iconKey:'analytics', route:'analytics',    path: base + '/analytics',    lock:'growth' },
        { id:'publicpage',   label:'Public Page',  iconKey:'pencil',    route:'page-editor',  path: base + '/page-editor',  tourKey:'tour-public-page-nav', adminOnly: true },
        { id:'email-blasts', label:'Email Blasts', iconKey:'email',     route:'email-blasts', path: base + '/email-blasts', adminOnly: true, lock:'growth' },
      ]
    },
    {
      label: 'Platform',
      items: [
        { id:'community-board', label:'Community Board', iconKey:'pinboard', route:'community-board', path: base + '/community-board', isPurple: true, lock:'verified' },
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

  var themeCtx = useTheme();
  var isDark = themeCtx ? themeCtx.isDark : true;
  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg     = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var elevatedBg    = isDark ? '#1E2845' : '#F1F5F9';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';

  var [organization, setOrganization] = useState(null);
  var [membership, setMembership] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [viewMode, setViewMode] = useState('admin');
  var [pendingCount, setPendingCount] = useState(0);
  var [unreadCount, setUnreadCount] = useState(0);
  var [mobileNavOpen, setMobileNavOpen] = useState(false);
  var [lockedNavTarget, setLockedNavTarget] = useState(null);

  var access = useOrgAccess(organizationId);
  var accessStatus = access.status;
  var accessDaysLeft = access.daysLeft;

  var planData = usePlanLimits(organizationId);
  var isAllowed = planData ? planData.isAllowed : function() { return false; };

  var isAdmin = !!(membership && membership.role === 'admin' && viewMode === 'admin');

  useEffect(function() { fetchLayout(); }, [organizationId]);

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
      if (!memResult.data) { setError('You are not a member of this organization.'); setLoading(false); return; }
      setMembership(memResult.data);

      if (memResult.data.role === 'admin') {
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
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Active route detection ─────────────────────────────────────────────────
  function isActive(item) {
    var base = '/organizations/' + organizationId;
    var pathname = location.pathname.replace(/\/$/, '');
    if (item.route === '') return pathname === base;
    return pathname === base + '/' + item.route || pathname.startsWith(base + '/' + item.route + '/');
  }

  // ── Nav renderer ───────────────────────────────────────────────────────────
  function renderNav() {
    var navGroups = buildNavGroups(organizationId, pendingCount, unreadCount);
    return navGroups.map(function(group) {
      if (group.adminOnly && !isAdmin) return null;
      var visibleItems = group.items.filter(function(item) {
        if (item.adminOnly && !isAdmin) return false;
        if (!isAdmin && group.label === 'Admin') return false;
        return true;
      });
      if (visibleItems.length === 0) return null;
      return (
        <div key={group.label}>
          <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#FFFFFF', padding:'8px 10px 3px' }}>{group.label}</p>
          {visibleItems.map(function(item) {
            var active = isActive(item);

            // ── Lock logic ──────────────────────────────────────────────────
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
              ? '#3A4A65'
              : (item.isPurple ? '#A78BFA' : active ? '#3B82F6' : textMuted);
            var bg = active && !isLocked ? 'rgba(59,130,246,0.12)' : 'transparent';

            return (
              <button
                key={item.id}
                onClick={function() {
                  // Only 'verified' lock shows a popup — all others navigate normally
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
                  border:'none', cursor:'pointer', width:'100%', textAlign:'left',
                  position:'relative', whiteSpace:'nowrap',
                  opacity: isLocked && lockReason === 'verified' ? 0.55 : 1,
                }}
                aria-current={active && !isLocked ? 'page' : undefined}
                aria-disabled={isLocked && lockReason === 'verified' ? true : undefined}
                aria-label={isLocked && lockReason === 'verified'
                  ? (item.label + ' — available to verified nonprofits')
                  : item.label
                }
              >
                <Icon path={ICONS[item.iconKey]} className="h-3.5 w-3.5" style={{ flexShrink:0, color:color }} />
                <span style={{ flex:1 }}>{item.label}</span>

                {isLocked && (
                  <Lock size={10} style={{ color:'#3A4A65', flexShrink:0 }} aria-hidden="true" />
                )}
                {isLocked && lockReason && (
                  <LockedNavBadge requiredPlan={lockReason} />
                )}

                {!isLocked && item.badge > 0 && (
                  <span
                    style={{ position:'absolute', right:'8px', background: item.id === 'inbox' ? '#EF4444' : '#F5B731', color: item.id === 'inbox' ? '#fff' : '#1A0000', fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px' }}
                    aria-label={item.badge + ' pending'}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    });
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', alignItems:'center' }}>
          {[240, 180, 120].map(function(w, i) { return <div key={i} style={{ width:w+'px', height:'12px', background:isDark?'#1A2035':'#E2E8F0', borderRadius:'6px', opacity:0.6 }} />; })}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
        <div style={{ textAlign:'center', maxWidth:'380px' }}>
          <h1 style={{ fontSize:'20px', fontWeight:800, color:textPrimary, marginBottom:'8px' }}>Access Denied</h1>
          <p style={{ color:textSecondary, marginBottom:'24px' }}>{error}</p>
          <button onClick={function() { navigate('/dashboard'); }} style={{ background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 24px', fontWeight:700, cursor:'pointer', fontSize:'13px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Access gates ───────────────────────────────────────────────────────────
  if (!access.loading && accessStatus === 'iced' && isAdmin) {
    return <OrgIced orgName={organization && organization.name} orgId={organizationId} />;
  }
  if (!access.loading && (accessStatus === 'expired' || accessStatus === 'iced') && !isAdmin) {
    return <OrgUnavailable orgName={organization && organization.name} />;
  }

  // ── Email verification gate ────────────────────────────────────────────────
  if (!access.loading && organization && organization.contact_email_verified === false && isAdmin) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', padding:'40px 32px', maxWidth:'460px', width:'100%', textAlign:'center' }}>
          <div style={{ width:'56px', height:'56px', background:'rgba(245,183,49,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#F5B731" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
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
              style={{ background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', padding:'12px 24px', fontWeight:700, cursor:'pointer', fontSize:'14px' }}
            >
              Resend Verification Email
            </button>
            <button
              onClick={function() { navigate('/dashboard'); }}
              style={{ background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', padding:'12px 24px', fontWeight:600, cursor:'pointer', fontSize:'14px' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ── Render ─────────────────────────────────────────────────────────────────
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

          {/* Org header */}
          <div style={{ background:sectionBg, borderRadius:'12px', padding:'12px 18px', marginBottom:'12px', border:'1px solid '+borderColor, display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
            {organization && organization.logo_url ? (
              <img src={organization.logo_url} alt={organization.name + ' logo'} style={{ width:'38px', height:'38px', borderRadius:'50%', objectFit:'cover', border:'2px solid '+borderColor, flexShrink:0 }} />
            ) : (
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:isDark?'#1D3461':'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'2px solid '+borderColor }}>
                <span style={{ color:'#60A5FA', fontWeight:800, fontSize:'14px' }}>{organization ? (organization.name || 'O').charAt(0) : 'O'}</span>
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ fontSize:'17px', fontWeight:800, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{organization ? organization.name : ''}</h1>
              <div style={{ display:'flex', gap:'6px', marginTop:'3px', flexWrap:'wrap' }}>
                {organization && (
                  <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:700, background:isDark?'rgba(59,130,246,0.15)':'#EFF6FF', color:'#60A5FA', textTransform:'capitalize' }}>{organization.type}</span>
                )}
                <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:700, background: isAdmin ? (isDark?'rgba(139,92,246,0.15)':'#F5F3FF') : (isDark?'rgba(59,130,246,0.12)':'#EFF6FF'), color: isAdmin ? '#A78BFA' : '#60A5FA' }}>
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
                {organization && organization.is_verified_nonprofit && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 8px', borderRadius:'99px', fontSize:'10px', fontWeight:700, background:'rgba(34,197,94,0.15)', color:'#22C55E', border:'1px solid rgba(34,197,94,0.3)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width:'10px', height:'10px', flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
            {membership && membership.role === 'admin' && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                <span style={{ fontSize:'11px', color:'#A78BFA', fontWeight:600 }}>Admin</span>
                <button
                  onClick={function() { setViewMode(viewMode === 'admin' ? 'member' : 'admin'); }}
                  style={{ position:'relative', display:'inline-flex', alignItems:'center', width:'40px', height:'22px', borderRadius:'99px', background: viewMode === 'admin' ? '#8B5CF6' : '#3B82F6', border:'none', cursor:'pointer', padding:0 }}
                  role="switch" aria-checked={viewMode === 'admin'} aria-label="Toggle admin/member view"
                >
                  <span style={{ position:'absolute', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.3)', transition:'transform 0.2s', transform: viewMode === 'admin' ? 'translateX(2px)' : 'translateX(18px)' }} />
                </button>
                <span style={{ fontSize:'11px', color:textMuted, fontWeight:600 }}>Member</span>
              </div>
            )}
            <button
              onClick={function() { setMobileNavOpen(!mobileNavOpen); }}
              style={{ background:'none', border:'1px solid '+borderColor, borderRadius:'8px', padding:'6px', cursor:'pointer', color:textSecondary }}
              className="lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open navigation" aria-expanded={mobileNavOpen}
            >
              <Icon path={ICONS.menu} className="h-5 w-5" />
            </button>
          </div>

          {/* Main layout */}
          <div style={{ display:'flex', gap:'16px', alignItems:'flex-start' }}>

            {/* LEFT NAV */}
            <aside
              data-tour="tour-org-nav"
              style={{ width:'240px', flexShrink:0, background:sectionBg, border:'1px solid '+borderColor, borderRadius:'10px', padding:'10px 8px', display:'flex', flexDirection:'column', gap:'1px', position:'sticky', top:'20px' }}
              aria-label="Organization navigation"
              role="navigation"
            >
              {renderNav()}
            </aside>

            {/* PAGE CONTENT */}
            <main style={{ flex:1, minWidth:0 }} role="main">
              <Outlet context={{ organization:organization, membership:membership, isAdmin:isAdmin, viewMode:viewMode, organizationId:organizationId, accessStatus:accessStatus }} />
            </main>

          </div>
        </div>
      </div>

      {/* ── Locked nav upgrade modal ── */}
      {lockedNavTarget && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:60 }}
          role="dialog" aria-modal="true" aria-labelledby="lock-modal-title"
          onClick={function() { setLockedNavTarget(null); }}
        >
          <div
            style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', width:'100%', maxWidth:'380px', padding:'24px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background: lockedNavTarget === 'verified' ? 'rgba(34,197,94,0.1)' : lockedNavTarget === 'pro' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Lock size={18} style={{ color: lockedNavTarget === 'verified' ? '#22C55E' : lockedNavTarget === 'pro' ? '#8B5CF6' : '#3B82F6' }} aria-hidden="true" />
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
                  style={{ flex:1, padding:'10px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                  className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  View Plans
                </button>
              )}
              {lockedNavTarget === 'verified' && (
                <button
                  onClick={function() { setLockedNavTarget(null); navigate('/organizations/'+organizationId+'/settings'); }}
                  style={{ flex:1, padding:'10px', background:'#22C55E', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                  className="focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Get Verified
                </button>
              )}
              <button
                onClick={function() { setLockedNavTarget(null); }}
                style={{ padding:'10px 16px', background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }} role="dialog" aria-modal="true" aria-label="Navigation">
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} onClick={function() { setMobileNavOpen(false); }} aria-hidden="true" />
          <div style={{ position:'relative', width:'240px', background:sectionBg, borderRight:'1px solid '+borderColor, padding:'16px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'2px', zIndex:1 }}>
            <button onClick={function() { setMobileNavOpen(false); }} style={{ position:'absolute', top:'12px', right:'12px', background:'none', border:'none', cursor:'pointer', color:textMuted }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close navigation">
              <Icon path={ICONS.x} className="h-5 w-5" />
            </button>
            <div style={{ marginBottom:'8px', paddingBottom:'12px', borderBottom:'1px solid '+borderColor }}>
              <p style={{ fontSize:'13px', fontWeight:800, color:textPrimary }}>{organization ? organization.name : ''}</p>
            </div>
            {renderNav()}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgLayout;