import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';
import OrgInviteMemberModal from '../components/OrgInviteMemberModal';
import CreateEvent from '../components/CreateEvent';
import CreateAnnouncement from '../components/CreateAnnouncement';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CommunityBoard from '../pages/CommunityBoard';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import CreatePoll from '../components/CreatePoll';
import CreateSignupForm from '../components/CreateSignupForm';
import GuidedTour from '../components/GuidedTour';
import { Lock } from 'lucide-react';
import usePlanLimits from '../hooks/usePlanLimits';
import StorageMeter from '../components/StorageMeter';

// ── Icon ──────────────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth, style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-4 w-4'} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
    growth:   { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  text: '#2563EB' },
    pro:      { bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.25)',  text: '#7C3AED' },
    verified: { bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)',   text: '#15803D' },
  };
  var c = colors[requiredPlan] || colors.growth;
  return (
    <span style={{ background:c.bg, border:'1px solid '+c.border, color:c.text, fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px', marginLeft:'4px', textTransform:'uppercase', letterSpacing:'0.5px', lineHeight:1, flexShrink:0 }} aria-hidden="true">
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
  scheduling: ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
  approvals:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  inbox:      ['M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'],
  analytics:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  contacts:   ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
  pencil:     ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  pinboard:   ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  settings:   ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  billing:    ['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
  plus:       'M12 4v16m8-8H4',
  x:          'M6 18L18 6M6 6l12 12',
  check:      'M5 13l4 4L19 7',
  trash:      ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  repeat:     ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
  warn:       ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  chevRight:  'M9 5l7 7-7 7',
  dots:       ['M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'],
  mail:       ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  userPlus:   ['M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'],
  fileUp:     ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
var ANN_COLORS = {
  urgent: { bg:'#FFCDD2', bdgBg:'#EF5350', bdgTxt:'#FFEBEE', txt:'#1A0000', org:'#7F0000' },
  normal: { bg:'#FFF9C4', bdgBg:'#F5B731', bdgTxt:'#3A2800', txt:'#1A1500', org:'#8A6F00' },
  low:    { bg:'#DCEDC8', bdgBg:'#558B2F', bdgTxt:'#F1F8E9', txt:'#0D1F00', org:'#33691E' },
};

function formatShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function formatEventDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}
function formatWeekdayTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}
function timeAgo(iso) {
  if (!iso) return '';
  var diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 3600) return Math.max(1, Math.round(diff / 60)) + ' min ago';
  if (diff < 86400) return Math.round(diff / 3600) + 'h ago';
  if (diff < 172800) return 'Yesterday';
  return formatShortDate(iso);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function PostitSkeleton() {
  return (
    <div style={{ background:'#F1F5F9', borderRadius:'12px', padding:'16px', boxShadow:'3px 4px 14px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04)' }} className="animate-pulse">
      <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
      <div className="h-3 w-full bg-slate-200 rounded mb-2" />
      <div className="h-3 w-2/3 bg-slate-200 rounded" />
    </div>
  );
}

// ── Org tour steps ────────────────────────────────────────────────────────────
var ORG_TOUR_STEPS = [
  { target:null, title:'Welcome to your dashboard', description:'You\'re all set up. Let\'s take a 30-second tour so you can hit the ground running.' },
  { target:'tour-org-nav', title:'Your navigation', description:'Everything your organization needs is here — members, events, announcements, documents, and more.', placement:'right' },
  { target:'tour-members-nav', title:'Manage your members', description:'Invite people, assign admin roles, and see who\'s active in your organization.', placement:'right' },
  { target:'tour-events-nav', title:'Create your first event', description:'Schedule events, collect RSVPs, sell tickets, and track attendance — all in one place.', placement:'right' },
  { target:'tour-announcements-nav', title:'Keep members informed', description:'Post announcements that show up directly on your members\' unified dashboards.', placement:'right' },
  { target:'tour-public-page-nav', title:'Your public page', description:'Set up your organization\'s public website — add your logo, mission, events, and a contact form.', placement:'right' },
  { target:null, title:'You\'re ready to go', description:'Start by inviting your first members. They\'ll get a welcome email and can join right away.' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
function OrganizationDashboard() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();

  // Light theme tokens
  var cardBg      = '#FFFFFF';
  var elevatedBg  = '#F1F5F9';
  var borderColor = '#E2E8F0';
  var textPrimary = '#0E1523';
  var textSecondary = '#475569';
  var textMuted   = '#64748B';
  var inputBg     = '#F8FAFC';

  var planData = usePlanLimits(organizationId);
  var plan     = planData ? planData.plan   : 'starter';
  var limits   = planData ? planData.limits : null;
  var isAllowed = planData ? planData.isAllowed : function() { return false; };

  var [organization, setOrganization]   = useState(null);
  var [membership, setMembership]       = useState(null);
  var [currentUserId, setCurrentUserId] = useState(null);
  var [stats, setStats] = useState({ totalMembers:0, pendingInvites:0, activeEvents:0, unreadAnnouncements:0, myRsvps:0, myGroups:0 });
  var [activeTab, setActiveTab]         = useState('overview');
  var [loading, setLoading]             = useState(true);
  var [error, setError]                 = useState(null);
  var [viewMode, setViewMode]           = useState('admin');
  var [mobileNavOpen, setMobileNavOpen] = useState(false);
  var [showInviteModal, setShowInviteModal]   = useState(false);
  var [lockedNavTarget, setLockedNavTarget]   = useState(null);
  var [showTour, setShowTour]                 = useState(false);
  var [showCelebration, setShowCelebration]   = useState(false);
  var [showCreateDropdown, setShowCreateDropdown] = useState(false);

  var [overviewEvents, setOverviewEvents]             = useState([]);
  var [overviewAnnouncements, setOverviewAnnouncements] = useState([]);
  var [overviewLoading, setOverviewLoading]           = useState(false);
  var [chatPreview, setChatPreview]                   = useState([]);
  var [chatLoading, setChatLoading]                   = useState(false);
  var [recentActivity, setRecentActivity]             = useState([]);
  var [activityLoading, setActivityLoading]           = useState(false);
  var [activeEventMenu, setActiveEventMenu]           = useState(null);
  var [editingEvent, setEditingEvent]                 = useState(null);
  var [showRescheduleModal, setShowRescheduleModal]   = useState(false);
  var [rescheduleEvent, setRescheduleEvent]           = useState(null);
  var [rescheduleForm, setRescheduleForm]             = useState({ start_time:'', end_time:'', location:'' });
  var [rescheduleSaving, setRescheduleSaving]         = useState(false);
  var [showDeleteConfirm, setShowDeleteConfirm]       = useState(false);
  var [deletingEvent, setDeletingEvent]               = useState(null);
  var [deleteScope, setDeleteScope]                   = useState('this');
  var [deleteLoading, setDeleteLoading]               = useState(false);
  var [showCreateEvent, setShowCreateEvent]           = useState(false);
  var [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  var [showCreatePoll, setShowCreatePoll]             = useState(false);
  var [showCreateSignupForm, setShowCreateSignupForm] = useState(false);
  var [pendingApprovals, setPendingApprovals]         = useState([]);
  var [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(false);
  var [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  var [inquiries, setInquiries]                       = useState([]);
  var [inquiriesLoading, setInquiriesLoading]         = useState(false);
  var [unreadInquiriesCount, setUnreadInquiriesCount] = useState(0);
  var [photos, setPhotos]                             = useState([]);
  var [photosLoading, setPhotosLoading]               = useState(false);
  var [photoUploading, setPhotoUploading]             = useState(false);
  var [photoCaption, setPhotoCaption]                 = useState('');
  var [photoError, setPhotoError]                     = useState(null);
  var [deletingPhotoId, setDeletingPhotoId]           = useState(null);
  var [lightboxPhoto, setLightboxPhoto]               = useState(null);
  var [showProgramModal, setShowProgramModal]         = useState(false);
  var [editingProgram, setEditingProgram]             = useState(null);
  var [programForm, setProgramForm] = useState({ name:'', description:'', audience:'', schedule:'', how_to_apply:'', contact_name:'', contact_email:'', status:'active', is_public:true });
  var [programSaving, setProgramSaving]               = useState(false);
  var [collabRequests, setCollabRequests]             = useState([]);
  var [collabRequestsLoading, setCollabRequestsLoading] = useState(false);
  var [respondingCollab, setRespondingCollab]         = useState(null);
  var [collabResponseExpanded, setCollabResponseExpanded] = useState(null);
  var [collabResponseMessage, setCollabResponseMessage] = useState('');
  var [collabResponseAction, setCollabResponseAction] = useState(null);

  var outletCtx   = useOutletContext() || {};
  var orgViewMode = outletCtx.viewMode || 'admin';
  var effectiveRole = (membership && membership.role === 'admin' && orgViewMode === 'member') ? 'member' : (membership ? membership.role : 'member');
  var isAdmin       = effectiveRole === 'admin';
  var canCreate     = (membership && (membership.role === 'admin' || membership.role === 'editor')) && orgViewMode !== 'member';

  useEffect(function() {
    var p = new URLSearchParams(window.location.search);
    if (p.get('tour') === '1') { setShowTour(true); window.history.replaceState({}, '', window.location.pathname); }
  }, []);

  useEffect(function() { fetchData(); }, [organizationId]);

  useEffect(function() {
    if (activeTab === 'overview' && organizationId) {
      fetchOverviewData();
      fetchChatPreview();
      fetchRecentActivity();
    }
  }, [activeTab, organizationId]);

  useEffect(function() { if (activeTab === 'approvals') fetchPendingApprovals(); }, [activeTab]);
  useEffect(function() { if (activeTab === 'inbox') fetchInquiries(); }, [activeTab]);
  useEffect(function() { if (activeTab === 'photos') fetchPhotos(); }, [activeTab]);

  useEffect(function() {
    if (organization && membership && membership.role === 'admin') fetchCollaborationRequests();
  }, [organization, membership]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      var authResult = await supabase.auth.getUser();
      if (authResult.error) throw authResult.error;
      if (!authResult.data.user) { navigate('/login'); return; }
      setCurrentUserId(authResult.data.user.id);

      var orgResult = await supabase.from('organizations').select('id,name,type,logo_url,description,is_verified_nonprofit').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memberResult = await supabase.from('memberships').select('id,role,status,joined_date,member_id,organization_id').eq('organization_id', organizationId).eq('member_id', authResult.data.user.id).eq('status', 'active').maybeSingle();
      if (memberResult.error) throw memberResult.error;
      if (!memberResult.data) { setError('You are not a member of this organization.'); setLoading(false); return; }
      setMembership(memberResult.data);

      await fetchStats(authResult.data.user.id);
      await fetchOverviewData();
      await fetchChatPreview();
      await fetchRecentActivity();

      if (memberResult.data.role === 'admin') {
        var inboxCount = await supabase.from('contact_inquiries').select('*', { count:'exact', head:true }).eq('organization_id', organizationId).eq('is_read', false);
        setUnreadInquiriesCount(inboxCount.count || 0);
        var tables = ['events','announcements','polls','surveys','signup_forms'];
        var total = 0;
        for (var i = 0; i < tables.length; i++) {
          var r = await supabase.from(tables[i]).select('id', { count:'exact', head:true }).eq('organization_id', organizationId).eq('approval_status', 'pending');
          total += (r.count || 0);
        }
        setPendingApprovalsCount(total);
      }
    } catch(err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats(userId) {
    try {
      var results = await Promise.all([
        supabase.from('memberships').select('*', { count:'exact', head:true }).eq('organization_id', organizationId).eq('status', 'active'),
        supabase.from('memberships').select('*', { count:'exact', head:true }).eq('organization_id', organizationId).eq('status', 'pending'),
        supabase.from('events').select('*', { count:'exact', head:true }).eq('organization_id', organizationId).gte('start_time', new Date().toISOString()),
        supabase.from('announcements').select('id').eq('organization_id', organizationId),
      ]);
      var annIds = (results[3].data || []).map(function(a) { return a.id; });
      var unread = 0;
      if (annIds.length > 0 && userId) {
        var reads = await supabase.from('announcement_reads').select('announcement_id').eq('member_id', userId).in('announcement_id', annIds);
        var readSet = new Set((reads.data || []).map(function(r2) { return r2.announcement_id; }));
        unread = annIds.length - readSet.size;
      }
      var rsvpRes  = userId ? await supabase.from('event_rsvps').select('*', { count:'exact', head:true }).eq('member_id', userId).eq('status', 'going') : { count:0 };
      var grpRes   = userId ? await supabase.from('org_group_members').select('*', { count:'exact', head:true }).eq('member_id', userId) : { count:0 };
      setStats({ totalMembers:results[0].count||0, pendingInvites:results[1].count||0, activeEvents:results[2].count||0, unreadAnnouncements:unread, myRsvps:rsvpRes.count||0, myGroups:grpRes.count||0 });
    } catch(err) { console.error(err); }
  }

  async function fetchOverviewData() {
    setOverviewLoading(true);
    try {
      var evRes = await supabase.from('events').select('id,title,start_time,end_time,location,event_type,recurrence_rule,parent_event_id,is_rescheduled,is_virtual,is_paid,is_recurring,is_co_hosted').eq('organization_id', organizationId).gte('start_time', new Date().toISOString()).order('start_time', { ascending:true }).limit(3);
      var ownEv = evRes.data || [];
      var { data: coHostRows } = await supabase.from('event_collaborators').select('event_id').eq('requesting_org_id', organizationId).eq('status', 'accepted');
      if (coHostRows && coHostRows.length > 0) {
        var coIds = coHostRows.map(function(row) { return row.event_id; });
        var coEvRes = await supabase.from('events').select('id,title,start_time,end_time,location,event_type,is_virtual,is_paid').in('id', coIds).gte('start_time', new Date().toISOString()).order('start_time', { ascending:true });
        var coEv = (coEvRes.data || []).map(function(e) { return Object.assign({}, e, { is_co_hosted:true }); });
        var merged = ownEv.concat(coEv);
        var seen = {};
        var deduped = merged.filter(function(e) { if (seen[e.id]) return false; seen[e.id]=true; return true; });
        deduped.sort(function(a, b) { return new Date(a.start_time) - new Date(b.start_time); });
        setOverviewEvents(deduped.slice(0, 3));
      } else {
        setOverviewEvents(ownEv);
      }
      var annRes = await supabase.from('announcements').select('id,title,content,priority,created_at,is_pinned').eq('organization_id', organizationId).order('is_pinned', { ascending:false }).order('created_at', { ascending:false }).limit(3);
      setOverviewAnnouncements(annRes.data || []);
    } catch(err) { console.error(err); }
    finally { setOverviewLoading(false); }
  }

  async function fetchChatPreview() {
    setChatLoading(true);
    try {
      var chRes = await supabase.from('chat_channels').select('id,name').eq('organization_id', organizationId).order('name').limit(3);
      if (!chRes.data || chRes.data.length === 0) { setChatPreview([]); return; }
      var previews = [];
      for (var i = 0; i < chRes.data.length; i++) {
        var ch = chRes.data[i];
        var msgRes = await supabase.from('chat_messages').select('content,created_at,sender_id').eq('channel_id', ch.id).eq('is_deleted', false).order('created_at', { ascending:false }).limit(1);
        var lastMsg = msgRes.data && msgRes.data[0] ? msgRes.data[0] : null;
        var senderName = 'Someone';
        if (lastMsg) {
          var profRes = await supabase.from('members').select('first_name,last_name,user_id').eq('user_id', lastMsg.sender_id).maybeSingle();
          if (profRes.data) senderName = profRes.data.user_id === currentUserId ? 'You' : profRes.data.first_name + ' ' + (profRes.data.last_name ? profRes.data.last_name.charAt(0) + '.' : '');
        }
        previews.push({ id:ch.id, name:ch.name, lastMsg:lastMsg ? lastMsg.content : null, sender:senderName, time:lastMsg ? lastMsg.created_at : null });
      }
      setChatPreview(previews);
    } catch(err) { console.error(err); }
    finally { setChatLoading(false); }
  }

  async function fetchRecentActivity() {
    setActivityLoading(true);
    try {
      var items = [];

      var membRes = await supabase.from('memberships').select('member_id,joined_date,members(first_name,last_name)').eq('organization_id', organizationId).eq('status', 'active').order('joined_date', { ascending:false }).limit(3);
      if (membRes.data) {
        membRes.data.forEach(function(m) {
          var mem = m.members || {};
          var name = ((mem.first_name || '') + ' ' + (mem.last_name || '')).trim() || 'New member';
          items.push({ type:'member', label:name + ' joined the organization', sub:'New member', time:m.joined_date, bg:'#DCFCE7', iconColor:'#16A34A', iconPath:ICONS.userPlus });
        });
      }

      var docRes = await supabase.from('documents').select('id,name,created_at').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(3);
      if (docRes.data) {
        docRes.data.forEach(function(d) {
          items.push({ type:'document', label:d.name + ' uploaded', sub:'Document', time:d.created_at, bg:'#DBEAFE', iconColor:'#2563EB', iconPath:ICONS.fileUp });
        });
      }

      var pollRes = await supabase.from('polls').select('id,question,created_at').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(2);
      if (pollRes.data) {
        pollRes.data.forEach(function(p) {
          items.push({ type:'poll', label:'"' + p.question + '" poll created', sub:'Poll', time:p.created_at, bg:'#EDE9FE', iconColor:'#7C3AED', iconPath:ICONS.polls });
        });
      }

      try {
        var schedRes = await supabase.from('scheduling_polls').select('id,title,created_at').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(2);
        if (schedRes.data) {
          schedRes.data.forEach(function(s) {
            items.push({ type:'scheduling', label:'"' + s.title + '" scheduling poll opened', sub:'Scheduling', time:s.created_at, bg:'#FEF9C3', iconColor:'#B45309', iconPath:ICONS.scheduling });
          });
        }
      } catch(e) { /* table may not exist yet */ }

      items.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
      setRecentActivity(items.slice(0, 6));
    } catch(err) { console.error('fetchRecentActivity error:', err); }
    finally { setActivityLoading(false); }
  }

  async function fetchPendingApprovals() {
    setPendingApprovalsLoading(true);
    try {
      var items = [];
      var tables = [
        { name:'events', label:'Event', tf:'title' }, { name:'announcements', label:'Announcement', tf:'title' },
        { name:'polls', label:'Poll', tf:'question' }, { name:'surveys', label:'Survey', tf:'title' },
        { name:'signup_forms', label:'Sign-Up Form', tf:'title' },
      ];
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        var r = await supabase.from(t.name).select('id,' + t.tf + ',created_at').eq('organization_id', organizationId).eq('approval_status', 'pending').order('created_at', { ascending:false });
        if (r.data) r.data.forEach(function(item) { items.push({ id:item.id, type:t.label, table:t.name, title:item[t.tf], created_at:item.created_at }); });
      }
      items.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      setPendingApprovals(items);
      setPendingApprovalsCount(items.length);
    } catch(err) { console.error(err); }
    finally { setPendingApprovalsLoading(false); }
  }

  async function fetchInquiries() {
    try {
      setInquiriesLoading(true);
      var r = await supabase.from('contact_inquiries').select('*').eq('organization_id', organizationId).order('created_at', { ascending:false });
      if (r.error) throw r.error;
      setInquiries(r.data || []);
      setUnreadInquiriesCount((r.data || []).filter(function(i) { return !i.is_read; }).length);
    } catch(err) { console.error(err); }
    finally { setInquiriesLoading(false); }
  }

  async function fetchPhotos() {
    try {
      setPhotosLoading(true);
      var r = await supabase.from('org_photos').select('*').eq('organization_id', organizationId).order('sort_order', { ascending:true }).order('created_at', { ascending:false });
      if (r.error) throw r.error;
      setPhotos(r.data || []);
    } catch(err) { console.error(err); }
    finally { setPhotosLoading(false); }
  }

  async function fetchCollaborationRequests() {
    setCollabRequestsLoading(true);
    try {
      var { data:requests, error:reqErr } = await supabase.from('event_collaborators').select('*').eq('host_org_id', organizationId).eq('status', 'pending');
      if (reqErr) throw reqErr;
      if (requests && requests.length > 0) {
        var eventIds = requests.map(function(r2) { return r2.event_id; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
        var orgIds   = requests.map(function(r2) { return r2.requesting_org_id; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
        var eventsRes = await supabase.from('events').select('id,title').in('id', eventIds);
        var orgsRes   = await supabase.from('organizations').select('id,name').in('id', orgIds);
        var eventMap = {}; if (eventsRes.data) eventsRes.data.forEach(function(e) { eventMap[e.id] = e; });
        var orgMap   = {}; if (orgsRes.data)   orgsRes.data.forEach(function(o)   { orgMap[o.id]   = o; });
        setCollabRequests(requests.map(function(r2) { return Object.assign({}, r2, { event:eventMap[r2.event_id]||null, requesting_org:orgMap[r2.requesting_org_id]||null }); }));
      } else {
        setCollabRequests([]);
      }
    } catch(err) { console.error(err); }
    finally { setCollabRequestsLoading(false); }
  }

  async function respondToCollabRequest(request, status, message) {
    setRespondingCollab(request.id);
    try {
      var { error:updateErr } = await supabase.from('event_collaborators').update({ status:status, updated_at:new Date().toISOString() }).eq('id', request.id);
      if (updateErr) throw updateErr;
      var { data:reqAdmins } = await supabase.from('memberships').select('member_id').eq('organization_id', request.requesting_org_id).eq('role', 'admin').eq('status', 'active');
      if (reqAdmins && reqAdmins.length > 0) {
        var orgName = organization ? organization.name : 'The host organization';
        var eventTitle = request.event ? request.event.title : 'an event';
        var notifMsg = orgName + ' ' + (status === 'accepted' ? 'accepted' : 'declined') + ' your co-host request for "' + eventTitle + '"';
        if (message && message.trim()) notifMsg += ' — "' + message.trim() + '"';
        var notifications = reqAdmins.map(function(a) { return { user_id:a.member_id, organization_id:request.requesting_org_id, type:status === 'accepted' ? 'collab_accepted' : 'collab_declined', title:status === 'accepted' ? 'Collaboration Accepted' : 'Collaboration Declined', message:notifMsg, link:'/org/'+request.requesting_org_id+'/events', read:false }; });
        await supabase.from('notifications').insert(notifications);
      }
      mascotSuccessToast(status === 'accepted' ? 'Co-host accepted!' : 'Request declined.');
      window.dispatchEvent(new CustomEvent('notificationCreated'));
      setCollabRequests(function(prev) { return prev.filter(function(r2) { return r2.id !== request.id; }); });
      setCollabResponseExpanded(null); setCollabResponseMessage(''); setCollabResponseAction(null);
    } catch(err) { toast.error('Could not update request'); }
    finally { setRespondingCollab(null); }
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  function handleEditEvent(ev)       { setEditingEvent(ev); setShowCreateEvent(true); setActiveEventMenu(null); }
  function handleRescheduleEvent(ev) { setRescheduleEvent(ev); setRescheduleForm({ start_time:ev.start_time?ev.start_time.slice(0,16):'', end_time:ev.end_time?ev.end_time.slice(0,16):'', location:ev.location||'' }); setShowRescheduleModal(true); setActiveEventMenu(null); }
  function handleDeleteEvent(ev)     { setDeletingEvent(ev); setDeleteScope('this'); setShowDeleteConfirm(true); setActiveEventMenu(null); }

  async function handleRescheduleSubmit() {
    if (!rescheduleForm.start_time) { toast.error('New start time is required'); return; }
    setRescheduleSaving(true);
    try {
      var payload = { is_rescheduled:true, original_start_time:rescheduleEvent.start_time, start_time:new Date(rescheduleForm.start_time).toISOString() };
      if (rescheduleForm.end_time) payload.end_time = new Date(rescheduleForm.end_time).toISOString();
      if (rescheduleForm.location.trim()) payload.location = rescheduleForm.location.trim();
      var r = await supabase.from('events').update(payload).eq('id', rescheduleEvent.id);
      if (r.error) throw r.error;
      mascotSuccessToast('Event rescheduled!');
      setShowRescheduleModal(false); setRescheduleEvent(null);
      await fetchOverviewData();
    } catch(err) { toast.error('Could not reschedule: ' + err.message); }
    finally { setRescheduleSaving(false); }
  }

  async function handleDeleteConfirm() {
    setDeleteLoading(true);
    try {
      var groupId = deletingEvent.parent_event_id || deletingEvent.id;
      var isRecurring = !!(deletingEvent.recurrence_rule || deletingEvent.parent_event_id);
      var r;
      if (isRecurring && deleteScope === 'all') {
        r = await supabase.from('events').delete().or('id.eq.' + groupId + ',parent_event_id.eq.' + groupId);
      } else if (isRecurring && deleteScope === 'future') {
        r = await supabase.from('events').delete().or('id.eq.' + groupId + ',parent_event_id.eq.' + groupId).gte('start_time', deletingEvent.start_time);
      } else {
        r = await supabase.from('events').delete().eq('id', deletingEvent.id);
      }
      if (r.error) throw r.error;
      mascotSuccessToast('Event deleted.');
      setShowDeleteConfirm(false); setDeletingEvent(null);
      await fetchOverviewData(); await fetchStats(currentUserId);
    } catch(err) { toast.error('Could not delete: ' + err.message); }
    finally { setDeleteLoading(false); }
  }

  async function handleApprove(item) {
    try {
      var r = await supabase.from(item.table).update({ approval_status:'approved' }).eq('id', item.id);
      if (r.error) throw r.error;
      setPendingApprovals(function(prev) { return prev.filter(function(i) { return !(i.id === item.id && i.type === item.type); }); });
      setPendingApprovalsCount(function(p) { return Math.max(0, p - 1); });
      mascotSuccessToast(item.type + ' approved.');
    } catch(err) { toast.error('Could not approve: ' + err.message); }
  }

  async function handleReject(item) {
    if (!window.confirm('Reject this ' + item.type.toLowerCase() + '?')) return;
    try {
      var r = await supabase.from(item.table).update({ approval_status:'rejected' }).eq('id', item.id);
      if (r.error) throw r.error;
      setPendingApprovals(function(prev) { return prev.filter(function(i) { return !(i.id === item.id && i.type === item.type); }); });
      setPendingApprovalsCount(function(p) { return Math.max(0, p - 1); });
      mascotSuccessToast(item.type + ' rejected.');
    } catch(err) { toast.error('Could not reject: ' + err.message); }
  }

  async function handleMarkInquiryRead(id) {
    try {
      var r = await supabase.from('contact_inquiries').update({ is_read:true }).eq('id', id);
      if (r.error) throw r.error;
      setInquiries(function(prev) { return prev.map(function(i) { return i.id === id ? Object.assign({}, i, { is_read:true }) : i; }); });
      setUnreadInquiriesCount(function(p) { return Math.max(0, p - 1); });
    } catch(err) { toast.error('Could not update.'); }
  }

  async function handleDeleteInquiry(id) {
    if (!window.confirm('Delete this message?')) return;
    try {
      var deleted = inquiries.find(function(i) { return i.id === id; });
      var r = await supabase.from('contact_inquiries').delete().eq('id', id);
      if (r.error) throw r.error;
      setInquiries(function(prev) { return prev.filter(function(i) { return i.id !== id; }); });
      if (deleted && !deleted.is_read) setUnreadInquiriesCount(function(p) { return Math.max(0, p - 1); });
      mascotSuccessToast('Message deleted.');
    } catch(err) { toast.error('Could not delete.'); }
  }

  async function handlePhotoUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    var allowed = ['image/jpeg','image/png','image/gif','image/webp'];
    if (!allowed.includes(file.type)) { setPhotoError('Only JPG, PNG, GIF, WebP allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5MB.'); return; }
    try {
      setPhotoUploading(true); setPhotoError(null);
      var ext = file.name.split('.').pop();
      var fileName = organizationId + '/' + Date.now() + '.' + ext;
      var upResult = await supabase.storage.from('organization-images').upload(fileName, file, { upsert:false });
      if (upResult.error) throw upResult.error;
      var urlData = supabase.storage.from('organization-images').getPublicUrl(fileName);
      var ins = await supabase.from('org_photos').insert({ organization_id:organizationId, uploaded_by:currentUserId, photo_url:urlData.data.publicUrl, caption:photoCaption.trim()||null });
      if (ins.error) throw ins.error;
      setPhotoCaption(''); e.target.value = '';
      await fetchPhotos();
      mascotSuccessToast('Photo uploaded!');
    } catch(err) { setPhotoError('Upload failed: ' + err.message); mascotErrorToast('Upload failed.', 'Please try again.'); }
    finally { setPhotoUploading(false); }
  }

  async function handleDeletePhoto(photo) {
    if (!window.confirm('Delete this photo?')) return;
    try {
      setDeletingPhotoId(photo.id);
      var parts = photo.photo_url.split('/organization-images/');
      if (parts.length === 2) await supabase.storage.from('organization-images').remove([parts[1]]);
      var r = await supabase.from('org_photos').delete().eq('id', photo.id);
      if (r.error) throw r.error;
      setPhotos(function(prev) { return prev.filter(function(p) { return p.id !== photo.id; }); });
      mascotSuccessToast('Photo deleted.');
    } catch(err) { mascotErrorToast('Could not delete photo.'); }
    finally { setDeletingPhotoId(null); }
  }

  async function saveProgram() {
    if (!programForm.name.trim()) { toast.error('Program name is required'); return; }
    setProgramSaving(true);
    var payload = Object.assign({}, programForm, { organization_id:organizationId, updated_at:new Date().toISOString() });
    var r = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);
    setProgramSaving(false);
    if (r.error) { toast.error('Failed to save program'); return; }
    mascotSuccessToast(editingProgram ? 'Program updated!' : 'Program created!');
    setShowProgramModal(false);
  }

  // ── NAV ───────────────────────────────────────────────────────────────────
  var NAV_GROUPS = [
    {
      label: 'Workspace',
      items: [
        { id:'overview',      label:'Overview',       iconKey:'overview',   roles:['admin','member'], tourKey:'tour-org-nav' },
        { id:'events',        label:'Events',         iconKey:'calendar',   roles:['admin','member'], tourKey:'tour-events-nav' },
        { id:'announcements', label:'Announcements',  iconKey:'megaphone',  roles:['admin','member'], tourKey:'tour-announcements-nav' },
        { id:'members',       label:'Members',        iconKey:'members',    roles:['admin','member'], tourKey:'tour-members-nav' },
        { id:'groups',        label:'Groups',         iconKey:'groups',     roles:['admin','member'], externalLink:'/organizations/'+organizationId+'/groups' },
        { id:'chat',          label:'Chat',           iconKey:'chat',       roles:['admin','member'] },
        { id:'documents',     label:'Documents',      iconKey:'folder',     roles:['admin','member'] },
        { id:'photos',        label:'Photos',         iconKey:'photo',      roles:['admin','member'] },
      ],
    },
    {
      label: 'Tools',
      items: [
        { id:'polls',       label:'Polls & Surveys', iconKey:'polls',      roles:['admin','member'] },
        { id:'forms',       label:'Sign-Up Forms',   iconKey:'forms',      roles:['admin','member'] },
        { id:'programs',    label:'Programs',        iconKey:'programs',   roles:['admin','member'] },
        { id:'scheduling',  label:'Scheduling',      iconKey:'scheduling', roles:['admin','member'], externalLink:'/organizations/'+organizationId+'/scheduling' },
      ],
    },
    {
      label: 'Admin',
      adminOnly: true,
      items: [
        { id:'approvals', label:'Approvals',   iconKey:'approvals', roles:['admin'], badge:pendingApprovalsCount },
        { id:'inbox',     label:'Inbox',       iconKey:'inbox',     roles:['admin'], badge:unreadInquiriesCount, lock:'growth' },
        { id:'analytics', label:'Analytics',   iconKey:'analytics', roles:['admin'], lock:'growth' },
        { id:'contacts',  label:'Contacts',    iconKey:'contacts',  roles:['admin'], comingSoon:true },
        { id:'publicpage',label:'Public Page', iconKey:'pencil',    roles:['admin'], tourKey:'tour-public-page-nav' },
      ],
    },
    {
      label: 'Platform',
      adminOnly: true,
      items: [
        { id:'community-board', label:'Community Board', iconKey:'pinboard', roles:['admin'], isPurple:true, lock:'verified' },
        { id:'settings',        label:'Settings',        iconKey:'settings', roles:['admin'] },
        { id:'billing',         label:'Billing',         iconKey:'billing',  roles:['admin'], isSub:true, externalLink:'/organizations/'+organizationId+'/billing' },
      ],
    },
  ];

  function handleNavClick(item) {
    setMobileNavOpen(false);
    if (item.externalLink) { navigate(item.externalLink); return; }
    setActiveTab(item.id);
  }

  function getNavLockState(item) {
    if (!item.lock) return { locked:false, reason:null };
    if (item.lock === 'growth') { var l = !isAllowed('has_full_analytics'); return { locked:l, reason:l?'growth':null }; }
    if (item.lock === 'pro')    { var l2 = !isAllowed('has_ai_assistant'); return { locked:l2, reason:l2?'pro':null }; }
    if (item.lock === 'verified') { var l3 = !(organization && organization.is_verified_nonprofit); return { locked:l3, reason:l3?'verified':null }; }
    return { locked:false, reason:null };
  }

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8" aria-busy="true" aria-label="Loading dashboard">
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-5xl mx-auto animate-pulse" style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.06)'}}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div><div className="h-5 w-48 bg-slate-200 rounded mb-2" /><div className="h-3 w-32 bg-slate-200 rounded" /></div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(function(i) { return <div key={i} className="h-20 bg-slate-200 rounded-xl" />; })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-slate-200 rounded-xl" />
            <div className="h-48 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-sm w-full" role="alert" style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.06)'}}>
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <Icon path={ICONS.warn} className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-[#0E1523] mb-2">Access Denied</h1>
          <p className="text-sm text-[#64748B] mb-5">{error}</p>
          <button onClick={function() { navigate('/organizations'); }} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Back to Organizations
          </button>
        </div>
      </main>
    );
  }

  // ── renderNavItems ────────────────────────────────────────────────────────
  function renderNavItems() {
    return NAV_GROUPS.map(function(group) {
      if (group.adminOnly && !isAdmin) return null;
      var visibleItems = group.items.filter(function(item) {
        if (!isAdmin && item.roles && !item.roles.includes('member')) return false;
        if (item.isSub && !isAdmin) return false;
        return true;
      });
      if (visibleItems.length === 0) return null;
      return (
        <div key={group.label}>
          <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#94A3B8', padding:'10px 10px 3px' }}>{group.label}</p>
          {visibleItems.map(function(item) {
            var isActive  = activeTab === item.id;
            var lockState = getNavLockState(item);
            var isLocked  = lockState.locked;
            var lockReason = lockState.reason;
            var activeColor  = item.isPurple ? '#8B5CF6' : '#3B82F6';
            var color = isLocked ? '#CBD5E1' : (isActive ? activeColor : '#475569');
            var bg    = isActive && !isLocked ? (item.isPurple ? 'rgba(139,92,246,0.08)' : 'rgba(59,130,246,0.08)') : 'transparent';
            return (
              <button
                key={item.id}
                onClick={function() {
                  if (item.comingSoon) return;
                  if (isLocked) { setLockedNavTarget(lockReason); return; }
                  handleNavClick(item);
                }}
                data-tour={item.tourKey || null}
                style={{ display:'flex', alignItems:'center', gap:'9px', padding:item.isSub?'7px 10px 7px 26px':'7px 10px', borderRadius:'7px', fontSize:'13px', fontWeight:600, color:color, background:bg, border:'none', cursor:item.comingSoon?'default':'pointer', width:'100%', textAlign:'left', opacity:isLocked?0.5:1, whiteSpace:'nowrap' }}
                aria-current={isActive && !isLocked ? 'page' : undefined}
                aria-disabled={isLocked || item.comingSoon || undefined}
                aria-label={isLocked ? (item.label + ' — requires ' + (lockReason||'upgrade')) : item.label}
              >
                <Icon path={ICONS[item.iconKey]} className="h-4 w-4" style={{ flexShrink:0, color:color }} />
                <span style={{ flex:1 }}>{item.label}</span>
                {item.comingSoon && (
                  <span style={{ background:'#F1F5F9', color:'#94A3B8', fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px', letterSpacing:'0.5px' }}>Soon</span>
                )}
                {isLocked && <Lock size={10} style={{ color:'#CBD5E1', flexShrink:0 }} aria-hidden="true" />}
                {isLocked && lockReason && <LockedNavBadge requiredPlan={lockReason} />}
                {!isLocked && !item.comingSoon && item.badge > 0 && (
                  <span style={{ background:item.id==='inbox'?'#EF4444':'#FEF9C3', color:item.id==='inbox'?'#fff':'#B45309', border:item.id==='inbox'?'none':'1px solid rgba(245,183,49,0.4)', fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'99px', flexShrink:0 }} aria-label={item.badge + ' pending'}>
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

  // ── renderOverview ────────────────────────────────────────────────────────
  function renderOverview() {
    var memberLimit = (limits && limits.members) ? limits.members : 50;
    var memberPct   = memberLimit ? Math.min(Math.round((stats.totalMembers / memberLimit) * 100), 100) : 0;
    var memberBarColor = memberPct >= 90 ? '#EF4444' : memberPct >= 80 ? '#F5B731' : '#22C55E';

    var cardStyle = { background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'18px', boxShadow:'3px 4px 14px rgba(0,0,0,0.05)' };
    var sectionLbl = { fontSize:'10px', fontWeight:700, letterSpacing:'4px', textTransform:'uppercase', color:'#F5B731', marginBottom:'12px' };

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'#0E1523' }}>Overview</h1>
          {canCreate && (
            <div style={{ position:'relative' }}>
              <button
                onClick={function() { setShowCreateDropdown(function(p) { return !p; }); }}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 18px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-haspopup="true"
                aria-expanded={showCreateDropdown}
                aria-label="Create new item"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Create
              </button>
              {showCreateDropdown && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:40 }} onClick={function() { setShowCreateDropdown(false); }} aria-hidden="true" />
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:41, minWidth:'220px', overflow:'hidden' }} role="menu" aria-label="Create options">
                    <div style={{ padding:'8px 14px', borderBottom:'1px solid #F1F5F9' }}>
                      <p style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'2px' }}>Create new</p>
                    </div>
                    {[
                      { label:'Event',         dot:'#3B82F6', desc:'Schedule a new event',        action:function() { setEditingEvent(null); setShowCreateEvent(true); setShowCreateDropdown(false); } },
                      { label:'Announcement',  dot:'#F5B731', desc:'Post an update to members',   action:function() { setShowCreateAnnouncement(true); setShowCreateDropdown(false); } },
                      { label:'Poll',          dot:'#A78BFA', desc:'Gather member feedback',      action:function() { setShowCreatePoll(true); setShowCreateDropdown(false); } },
                      { label:'Program',       dot:'#22C55E', desc:'Add an org program',          action:function() { setShowProgramModal(true); setEditingProgram(null); setProgramForm({ name:'', description:'', audience:'', schedule:'', how_to_apply:'', contact_name:'', contact_email:'', status:'active', is_public:true }); setShowCreateDropdown(false); } },
                      { label:'Sign-Up Form',  dot:'#06B6D4', desc:'Collect volunteer sign-ups',  action:function() { setShowCreateSignupForm(true); setShowCreateDropdown(false); } },
                    ].map(function(opt, i) {
                      return (
                        <button
                          key={opt.label}
                          onClick={opt.action}
                          role="menuitem"
                          style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 16px', background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', borderBottom: i < 4 ? '1px solid #F8FAFC' : 'none' }}
                          className="hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                        >
                          <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:opt.dot, flexShrink:0 }} aria-hidden="true" />
                          <div>
                            <p style={{ fontSize:'13px', fontWeight:700, color:'#0E1523' }}>{opt.label}</p>
                            <p style={{ fontSize:'11px', color:'#64748B', marginTop:'1px' }}>{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:'10px' }}>
          {isAdmin ? (
            <>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/members'); }} style={{ flex:1, background:'#DBEAFE', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'14px 16px', textAlign:'left', cursor:'pointer' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2" aria-label="View members">
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#1E40AF', marginBottom:'5px' }}>Members</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#1D4ED8', lineHeight:1 }}>{stats.totalMembers}</p>
                <p style={{ fontSize:'10px', color:'#3B82F6', marginTop:'4px' }}>{stats.totalMembers} of {memberLimit}</p>
                <div style={{ marginTop:'6px', background:'rgba(59,130,246,0.2)', borderRadius:'99px', height:'3px' }} role="meter" aria-valuenow={stats.totalMembers} aria-valuemin={0} aria-valuemax={memberLimit} aria-label={'Member usage ' + stats.totalMembers + ' of ' + memberLimit}>
                  <div style={{ width:memberPct+'%', background:memberBarColor, height:'3px', borderRadius:'99px' }} />
                </div>
              </button>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/events'); }} style={{ flex:1, background:'#DCFCE7', border:'1px solid #BBF7D0', borderRadius:'10px', padding:'14px 16px', textAlign:'left', cursor:'pointer' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2" aria-label="View events">
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#166534', marginBottom:'5px' }}>Upcoming Events</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#15803D', lineHeight:1 }}>{stats.activeEvents}</p>
              </button>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/announcements'); }} style={{ flex:1, background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'10px', padding:'14px 16px', textAlign:'left', cursor:'pointer' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2" aria-label="View unread announcements">
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#92400E', marginBottom:'5px' }}>Unread</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#C2410C', lineHeight:1 }}>{stats.unreadAnnouncements}</p>
              </button>
              <button onClick={function() { setActiveTab('approvals'); }} style={{ flex:1, background:'#EDE9FE', border:'1px solid #DDD6FE', borderRadius:'10px', padding:'14px 16px', textAlign:'left', cursor:'pointer' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2" aria-label="View pending approvals">
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#5B21B6', marginBottom:'5px' }}>Pending</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#7C3AED', lineHeight:1 }}>{pendingApprovalsCount}</p>
              </button>
            </>
          ) : (
            <>
              <div style={{ flex:1, background:'#DCFCE7', border:'1px solid #BBF7D0', borderRadius:'10px', padding:'14px 16px' }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#166534', marginBottom:'5px' }}>My RSVPs</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#15803D', lineHeight:1 }}>{stats.myRsvps}</p>
              </div>
              <div style={{ flex:1, background:'#DBEAFE', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'14px 16px' }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#1E40AF', marginBottom:'5px' }}>Upcoming Events</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#1D4ED8', lineHeight:1 }}>{stats.activeEvents}</p>
              </div>
              <div style={{ flex:1, background:'#FEF3C7', border:'1px solid #FDE68A', borderRadius:'10px', padding:'14px 16px' }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#92400E', marginBottom:'5px' }}>Unread</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#C2410C', lineHeight:1 }}>{stats.unreadAnnouncements}</p>
              </div>
              <div style={{ flex:1, background:'#EDE9FE', border:'1px solid #DDD6FE', borderRadius:'10px', padding:'14px 16px' }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#5B21B6', marginBottom:'5px' }}>My Groups</p>
                <p style={{ fontSize:'26px', fontWeight:800, color:'#7C3AED', lineHeight:1 }}>{stats.myGroups}</p>
              </div>
            </>
          )}
        </div>

        {/* 2-col grid: Announcements | Events */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

          {/* Announcements card */}
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <p style={sectionLbl}>Announcements</p>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/announcements'); }} style={{ fontSize:'11px', color:'#3B82F6', fontWeight:600, background:'none', border:'none', cursor:'pointer' }} className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-400 rounded">View all</button>
            </div>
            {overviewLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}><PostitSkeleton /><PostitSkeleton /></div>
            ) : overviewAnnouncements.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 16px', background:'#F8FAFC', borderRadius:'10px', border:'1px dashed #E2E8F0' }}>
                <Icon path={ICONS.megaphone} className="h-8 w-8 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                <p style={{ fontSize:'13px', fontWeight:600, color:'#475569' }}>No announcements yet</p>
                {isAdmin && <button onClick={function() { setShowCreateAnnouncement(true); }} style={{ fontSize:'12px', color:'#3B82F6', background:'none', border:'none', cursor:'pointer', marginTop:'6px', fontWeight:600 }}>Post one</button>}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {overviewAnnouncements.map(function(ann) {
                  var c = ANN_COLORS[ann.priority] || ANN_COLORS.normal;
                  return (
                    <button key={ann.id} onClick={function() { navigate('/organizations/'+organizationId+'/announcements'); }} style={{ background:c.bg, borderRadius:'12px', padding:'14px', width:'100%', textAlign:'left', border:'none', cursor:'pointer', boxShadow:'3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1" aria-label={'View announcement: '+ann.title}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
                        <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:'3px', fontSize:'9px', fontWeight:700, textTransform:'uppercase', background:c.bdgBg, color:c.bdgTxt }}>
                          {ann.priority === 'urgent' ? 'Urgent' : ann.priority === 'low' ? 'Info' : 'Update'}
                        </span>
                        {ann.is_pinned && <span style={{ fontSize:'9px', fontWeight:700, color:c.org }}>Pinned</span>}
                      </div>
                      <p style={{ fontSize:'13px', fontWeight:800, color:c.txt, lineHeight:1.4, marginBottom:'5px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{ann.title}</p>
                      <p style={{ fontSize:'10px', color:c.org }}>{formatShortDate(ann.created_at)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Events card */}
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <p style={sectionLbl}>Upcoming Events</p>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/events'); }} style={{ fontSize:'11px', color:'#3B82F6', fontWeight:600, background:'none', border:'none', cursor:'pointer' }} className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-400 rounded">View all</button>
            </div>
            {overviewLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}><PostitSkeleton /><PostitSkeleton /><PostitSkeleton /></div>
            ) : overviewEvents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 16px', background:'#F8FAFC', borderRadius:'10px', border:'1px dashed #E2E8F0' }}>
                <Icon path={ICONS.calendar} className="h-8 w-8 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                <p style={{ fontSize:'13px', fontWeight:600, color:'#475569' }}>No upcoming events</p>
                {isAdmin && <button onClick={function() { setEditingEvent(null); setShowCreateEvent(true); }} style={{ fontSize:'12px', color:'#3B82F6', background:'none', border:'none', cursor:'pointer', marginTop:'6px', fontWeight:600 }}>Create one</button>}
              </div>
            ) : (
              <div>
                {overviewEvents.map(function(ev, i) {
                  var isLast = i === overviewEvents.length - 1;
                  var d = new Date(ev.start_time);
                  return (
                    <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 0', borderBottom: isLast ? 'none' : '1px solid #F1F5F9' }}>
                      <div style={{ width:'44px', flexShrink:0, textAlign:'center', background:'#F1F5F9', borderRadius:'8px', padding:'6px 4px' }}>
                        <p style={{ fontSize:'8px', fontWeight:700, color:'#3B82F6', textTransform:'uppercase', letterSpacing:'1px' }}>{d.toLocaleDateString('en-US', { month:'short' })}</p>
                        <p style={{ fontSize:'18px', fontWeight:800, color:'#0E1523', lineHeight:1 }}>{d.getDate()}</p>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'13px', fontWeight:700, color:'#0E1523', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</p>
                        <p style={{ fontSize:'11px', color:'#64748B', marginTop:'2px' }}>
                          {ev.is_virtual ? 'Virtual' : (ev.location || 'No location')} · {d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}
                          {ev.is_co_hosted ? ' · Co-host' : ''}
                        </p>
                      </div>
                      {isAdmin && !ev.is_co_hosted && (
                        <div style={{ position:'relative', flexShrink:0 }}>
                          <button onClick={function(e) { e.stopPropagation(); setActiveEventMenu(activeEventMenu === ev.id ? null : ev.id); }} style={{ width:'28px', height:'28px', borderRadius:'6px', background:'#F1F5F9', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748B' }} className="hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label={'Actions for '+ev.title} aria-haspopup="true" aria-expanded={activeEventMenu === ev.id}>
                            <Icon path={ICONS.dots} className="h-3.5 w-3.5" />
                          </button>
                          {activeEventMenu === ev.id && (
                            <div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', zIndex:30, minWidth:'140px', overflow:'hidden' }} role="menu">
                              <button onClick={function() { handleEditEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none" role="menuitem"><Icon path={ICONS.pencil} className="h-4 w-4" />Edit</button>
                              <button onClick={function() { handleRescheduleEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 focus:outline-none" role="menuitem"><Icon path={ICONS.repeat} className="h-4 w-4" />Reschedule</button>
                              <div className="border-t border-gray-100" />
                              <button onClick={function() { handleDeleteEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none" role="menuitem"><Icon path={ICONS.trash} className="h-4 w-4" />Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={cardStyle}>
          <p style={sectionLbl}>Recent Activity</p>
          {activityLoading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {[1,2,3].map(function(i) { return <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />; })}
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px', background:'#F8FAFC', borderRadius:'10px', border:'1px dashed #E2E8F0' }}>
              <p style={{ fontSize:'13px', color:'#94A3B8' }}>No recent activity yet</p>
            </div>
          ) : (
            <div role="list" aria-label="Recent activity">
              {recentActivity.map(function(act, i) {
                var isLast = i === recentActivity.length - 1;
                return (
                  <div key={i} role="listitem" style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'10px 0', borderBottom: isLast ? 'none' : '1px solid #F8FAFC' }}>
                    <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:act.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} aria-hidden="true">
                      <Icon path={act.iconPath} className="h-4 w-4" style={{ color:act.iconColor }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'#0E1523', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{act.label}</p>
                      <p style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{act.sub} · {timeAgo(act.time)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Collaboration Requests — admin only */}
        {isAdmin && (collabRequests.length > 0 || collabRequestsLoading) && (
          <div style={{ background:'#FFFFFF', border:'1px solid rgba(139,92,246,0.25)', borderRadius:'12px', padding:'18px', boxShadow:'3px 4px 14px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'4px', textTransform:'uppercase', color:'#8B5CF6' }}>Co-Host Requests</p>
              {collabRequests.length > 0 && (
                <span style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)', color:'#7C3AED', fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'99px' }}>{collabRequests.length}</span>
              )}
            </div>
            {collabRequestsLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[1,2].map(function(i) { return <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />; })}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }} role="list" aria-label="Co-host requests">
                {collabRequests.map(function(req) {
                  var orgName    = req.requesting_org ? req.requesting_org.name : 'Unknown organization';
                  var eventTitle = req.event ? req.event.title : 'an event';
                  var isResponding = respondingCollab === req.id;
                  var isExpanded   = collabResponseExpanded === req.id;
                  return (
                    <div key={req.id} role="listitem" style={{ padding:'12px 14px', background:'#F8FAFC', borderRadius:'8px', border:'1px solid ' + (isExpanded ? (collabResponseAction === 'accepted' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(139,92,246,0.12)') }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                            <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'#8B5CF6', flexShrink:0 }} aria-hidden="true">{orgName.charAt(0).toUpperCase()}</div>
                            <p style={{ fontSize:'12px', fontWeight:700, color:'#0E1523' }}>{orgName}</p>
                          </div>
                          <p style={{ fontSize:'11px', color:'#64748B', paddingLeft:'28px' }}>wants to co-host <span style={{ color:'#475569', fontWeight:600 }}>"{eventTitle}"</span></p>
                          {req.message && <p style={{ fontSize:'11px', color:'#64748B', paddingLeft:'28px', marginTop:'3px', fontStyle:'italic' }}>"{req.message}"</p>}
                        </div>
                        {!isExpanded && (
                          <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                            <button onClick={function() { setCollabResponseExpanded(req.id); setCollabResponseAction('accepted'); setCollabResponseMessage(''); }} disabled={isResponding} style={{ padding:'5px 12px', background:'#22C55E', color:'#fff', fontSize:'11px', fontWeight:700, border:'none', borderRadius:'6px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={'Accept co-host request from ' + orgName}>Accept</button>
                            <button onClick={function() { setCollabResponseExpanded(req.id); setCollabResponseAction('declined'); setCollabResponseMessage(''); }} disabled={isResponding} style={{ padding:'5px 12px', background:'transparent', color:'#EF4444', border:'1px solid rgba(239,68,68,0.4)', fontSize:'11px', fontWeight:700, borderRadius:'6px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={'Decline co-host request from ' + orgName}>Decline</button>
                          </div>
                        )}
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid ' + (collabResponseAction === 'accepted' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') }}>
                          <label htmlFor={'collab-msg-' + req.id} style={{ display:'block', fontSize:'10px', fontWeight:700, color:collabResponseAction === 'accepted' ? '#15803D' : '#DC2626', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'2px' }}>
                            {collabResponseAction === 'accepted' ? 'Accept' : 'Decline'} — Optional Note
                          </label>
                          <textarea id={'collab-msg-' + req.id} value={collabResponseMessage} onChange={function(e) { setCollabResponseMessage(e.target.value); }} maxLength={500} rows={2} placeholder={'Add an optional note for ' + orgName + '...'} style={{ width:'100%', padding:'8px 10px', background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'6px', fontSize:'12px', color:'#0E1523', resize:'none', outline:'none', boxSizing:'border-box' }} className="focus:ring-2 focus:ring-blue-500" />
                          <div style={{ display:'flex', gap:'6px', marginTop:'8px' }}>
                            <button onClick={function() { respondToCollabRequest(req, collabResponseAction, collabResponseMessage); }} disabled={isResponding} style={{ padding:'7px 16px', background:collabResponseAction === 'accepted' ? '#22C55E' : '#EF4444', color:'#fff', fontSize:'11px', fontWeight:700, border:'none', borderRadius:'6px', cursor:isResponding?'not-allowed':'pointer', opacity:isResponding?0.6:1 }} className={'focus:outline-none focus:ring-2 ' + (collabResponseAction === 'accepted' ? 'focus:ring-green-500' : 'focus:ring-red-500')}>
                              {isResponding ? 'Sending...' : 'Confirm ' + (collabResponseAction === 'accepted' ? 'Accept' : 'Decline')}
                            </button>
                            <button onClick={function() { setCollabResponseExpanded(null); setCollabResponseMessage(''); setCollabResponseAction(null); }} style={{ padding:'7px 14px', background:'transparent', color:'#64748B', border:'1px solid #E2E8F0', fontSize:'11px', fontWeight:600, borderRadius:'6px', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recent Chat */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <p style={sectionLbl}>Recent Chat</p>
            <button onClick={function() { navigate('/organizations/'+organizationId+'/chat'); }} style={{ fontSize:'11px', color:'#3B82F6', fontWeight:600, background:'none', border:'none', cursor:'pointer' }} className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-400 rounded">Open Chat</button>
          </div>
          {chatLoading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
              {[1,2,3].map(function(i) { return <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />; })}
            </div>
          ) : chatPreview.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', background:'#F8FAFC', borderRadius:'10px', border:'1px dashed #E2E8F0' }}>
              <Icon path={ICONS.chat} className="h-6 w-6 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
              <p style={{ fontSize:'12px', color:'#94A3B8' }}>No messages yet</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
              {chatPreview.map(function(ch) {
                return (
                  <div key={ch.id} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px' }}>
                    <p style={{ fontSize:'10px', fontWeight:700, color:'#64748B', marginBottom:'4px', display:'flex', alignItems:'center', gap:'4px' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:ch.lastMsg?'#22C55E':'#CBD5E1', display:'inline-block', flexShrink:0 }} aria-hidden="true" />
                      # {ch.name}
                    </p>
                    {ch.lastMsg
                      ? <p style={{ fontSize:'11px', color:'#475569', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}><span style={{ fontWeight:600 }}>{ch.sender}:</span> {ch.lastMsg}</p>
                      : <p style={{ fontSize:'11px', color:'#94A3B8', fontStyle:'italic' }}>No messages yet</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Storage — admin only */}
        {isAdmin && (
          <div style={cardStyle}>
            <StorageMeter organizationId={organizationId} compact={true} isAdmin={true} />
          </div>
        )}

      </div>
    );
  }

  // ── renderPhotos ──────────────────────────────────────────────────────────
  function renderPhotos() {
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:800, color:'#0E1523' }}>Photo Gallery</h2>
            <p style={{ fontSize:'13px', color:'#64748B', marginTop:'4px' }}>{photos.length + ' photo' + (photos.length !== 1 ? 's' : '')}</p>
          </div>
        </div>
        {isAdmin && (
          <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'12px', padding:'20px', marginBottom:'20px', boxShadow:'3px 4px 14px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize:'14px', fontWeight:700, color:'#0E1523', marginBottom:'14px' }}>Upload Photo</h3>
            {photoError && <div style={{ marginBottom:'12px', padding:'10px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px', fontSize:'13px', color:'#DC2626' }} role="alert">{photoError}</div>}
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <input type="text" placeholder="Caption (optional)" value={photoCaption} onChange={function(e) { setPhotoCaption(e.target.value); }} maxLength={200} style={{ flex:1, minWidth:'200px', padding:'8px 12px', borderRadius:'8px', border:'1px solid #E2E8F0', background:'#F8FAFC', color:'#0E1523', fontSize:'13px', outline:'none' }} className="focus:ring-2 focus:ring-blue-500" aria-label="Photo caption" />
              <label htmlFor="photo-upload" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'8px', fontWeight:700, fontSize:'13px', cursor:photoUploading?'not-allowed':'pointer', background:photoUploading?'#F1F5F9':'#3B82F6', color:photoUploading?'#64748B':'#fff' }}>
                {photoUploading ? 'Uploading...' : 'Upload Photo'}
                <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoUpload} disabled={photoUploading} className="sr-only" aria-label="Choose a photo" />
              </label>
            </div>
          </div>
        )}
        {photosLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6].map(function(i) { return <div key={i} style={{ height:'140px', borderRadius:'10px', background:'#F1F5F9' }} className="animate-pulse" />; })}
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#F8FAFC', borderRadius:'12px', border:'1px dashed #E2E8F0' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#F1F5F9', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Icon path={ICONS.photo} className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize:'16px', fontWeight:700, color:'#475569', marginBottom:'4px' }}>No photos yet</p>
            <p style={{ fontSize:'13px', color:'#64748B' }}>{isAdmin ? 'Upload your first photo above.' : 'No photos have been added yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-label="Photo gallery">
            {photos.map(function(photo) {
              return (
                <div key={photo.id} role="listitem" style={{ position:'relative', borderRadius:'10px', overflow:'hidden', background:'#F1F5F9', border:'1px solid #E2E8F0', boxShadow:'3px 4px 14px rgba(0,0,0,0.06)' }} className="group">
                  <button onClick={function() { setLightboxPhoto(photo); }} style={{ display:'block', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" aria-label={'View photo' + (photo.caption ? ': '+photo.caption : '')}>
                    <img src={photo.photo_url} alt={photo.caption || 'Organization photo'} style={{ width:'100%', height:'140px', objectFit:'cover', display:'block' }} loading="lazy" />
                  </button>
                  {photo.caption && <div style={{ padding:'6px 10px', background:'#FFFFFF' }}><p style={{ fontSize:'11px', color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{photo.caption}</p></div>}
                  {isAdmin && (
                    <button onClick={function() { handleDeletePhoto(photo); }} disabled={deletingPhotoId === photo.id} style={{ position:'absolute', top:'8px', right:'8px', width:'26px', height:'26px', background:'#EF4444', color:'#fff', borderRadius:'50%', border:'none', cursor:'pointer', display:'none', alignItems:'center', justifyContent:'center', opacity:0 }} className="group-hover:flex group-hover:opacity-100 focus:flex focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-opacity" aria-label={'Delete photo' + (photo.caption ? ': '+photo.caption : '')}>
                      <Icon path={ICONS.x} className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {lightboxPhoto && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'16px' }} role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={function() { setLightboxPhoto(null); }}>
            <div style={{ position:'relative', maxWidth:'900px', width:'100%' }} onClick={function(e) { e.stopPropagation(); }}>
              <button onClick={function() { setLightboxPhoto(null); }} style={{ position:'absolute', top:'-36px', right:'0', background:'none', border:'none', color:'#fff', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-white rounded" aria-label="Close photo viewer">
                <Icon path={ICONS.x} className="h-7 w-7" strokeWidth={2.5} />
              </button>
              <img src={lightboxPhoto.photo_url} alt={lightboxPhoto.caption || 'Organization photo'} style={{ width:'100%', maxHeight:'80vh', objectFit:'contain', borderRadius:'10px' }} />
              {lightboxPhoto.caption && <p style={{ color:'#fff', textAlign:'center', marginTop:'12px', fontSize:'13px' }}>{lightboxPhoto.caption}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── renderApprovals ───────────────────────────────────────────────────────
  function renderApprovals() {
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:800, color:'#0E1523' }}>Pending Approvals</h2>
            <p style={{ fontSize:'13px', color:'#64748B', marginTop:'4px' }}>Review content submitted by editors</p>
          </div>
          {pendingApprovals.length > 0 && <span style={{ background:'rgba(245,183,49,0.12)', border:'1px solid rgba(245,183,49,0.35)', color:'#B45309', fontSize:'12px', fontWeight:700, padding:'4px 12px', borderRadius:'99px' }}>{pendingApprovals.length} pending</span>}
        </div>
        {pendingApprovalsLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[1,2,3].map(function(i) { return <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />; })}
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#F8FAFC', borderRadius:'12px', border:'1px dashed #E2E8F0' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#DCFCE7', border:'1px solid #BBF7D0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Icon path={ICONS.check} className="h-7 w-7 text-green-500" strokeWidth={2} />
            </div>
            <p style={{ fontSize:'16px', fontWeight:700, color:'#475569' }}>All caught up!</p>
            <p style={{ fontSize:'13px', color:'#64748B', marginTop:'4px' }}>No content waiting for approval.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }} role="list" aria-label="Pending approvals">
            {pendingApprovals.map(function(item) {
              return (
                <div key={item.type+'-'+item.id} role="listitem" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', padding:'16px 20px', background:'#FFFFFF', border:'1px solid rgba(245,183,49,0.2)', borderRadius:'10px', boxShadow:'3px 4px 14px rgba(0,0,0,0.04)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:'99px', fontSize:'11px', fontWeight:700, background:'#DBEAFE', color:'#1E40AF', marginBottom:'6px' }}>{item.type}</span>
                    <p style={{ fontSize:'14px', fontWeight:700, color:'#0E1523', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</p>
                    <p style={{ fontSize:'11px', color:'#64748B', marginTop:'2px' }}>{'Submitted ' + new Date(item.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</p>
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                    <button onClick={function() { handleApprove(item); }} style={{ padding:'7px 16px', background:'#22C55E', color:'#fff', fontSize:'12px', fontWeight:700, border:'none', borderRadius:'8px', cursor:'pointer' }} className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1" aria-label={'Approve '+item.title}>Approve</button>
                    <button onClick={function() { handleReject(item); }} style={{ padding:'7px 16px', background:'transparent', color:'#EF4444', border:'1px solid rgba(239,68,68,0.35)', fontSize:'12px', fontWeight:700, borderRadius:'8px', cursor:'pointer' }} className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1" aria-label={'Reject '+item.title}>Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── renderInvite ──────────────────────────────────────────────────────────
  function renderInvite() {
    if (membership.role === 'admin' || (organization.settings && organization.settings.allowMemberInvites)) {
      return <InviteMember organizationId={organizationId} organizationName={organization.name} onInviteSent={function() { fetchStats(currentUserId); }} />;
    }
    return (
      <div style={{ textAlign:'center', padding:'60px 20px', background:'#F8FAFC', borderRadius:'12px', border:'1px dashed #E2E8F0' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#F1F5F9', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
          <Icon path={ICONS.mail} className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
        </div>
        <p style={{ fontSize:'16px', fontWeight:700, color:'#475569', marginBottom:'4px' }}>Permission Required</p>
        <p style={{ fontSize:'13px', color:'#64748B' }}>Member invitations are restricted to admins.</p>
      </div>
    );
  }

  // ── Route resolution ──────────────────────────────────────────────────────
  var currentPath = window.location.pathname;
  var pathBase    = '/organizations/' + organizationId;
  var subPath     = currentPath.replace(pathBase, '').replace(/^\//, '') || 'overview';
  var pathTabMap  = { 'photos':'photos', 'approvals':'approvals', 'analytics':'analytics', 'settings':'settings', 'invite':'invite', '':'overview', 'overview':'overview' };
  var resolvedTab = pathTabMap[subPath] || 'overview';

  var upgradePromptConfig = {
    growth:   { title:'Available on Growth',      description:'Upgrade to Growth to unlock inbox, full analytics, email blasts, and more.' },
    pro:      { title:'Available on Pro',          description:'Upgrade to Pro to unlock the AI content assistant and priority support.' },
    verified: { title:'Verified Nonprofits Only',  description:'This feature is available to verified 501(c)(3) organizations. Submit your EIN to get verified.' },
  };
  var activePromptConfig = lockedNavTarget ? (upgradePromptConfig[lockedNavTarget] || upgradePromptConfig.growth) : null;

  return (
    <>
      {isAdmin && (
        <GuidedTour steps={ORG_TOUR_STEPS} orgId={organizationId} tourType="org" show={showTour} onDone={function() { setShowTour(false); setShowCelebration(true); }} />
      )}

      {/* Lock modal */}
      {lockedNavTarget && activePromptConfig && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:60 }} role="dialog" aria-modal="true" aria-labelledby="lock-prompt-title" onClick={function() { setLockedNavTarget(null); }}>
          <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:'400px', padding:'24px' }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:lockedNavTarget==='verified'?'rgba(34,197,94,0.1)':lockedNavTarget==='pro'?'rgba(139,92,246,0.1)':'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Lock size={18} style={{ color:lockedNavTarget==='verified'?'#22C55E':lockedNavTarget==='pro'?'#8B5CF6':'#3B82F6' }} aria-hidden="true" />
                </div>
                <h2 id="lock-prompt-title" style={{ fontSize:'16px', fontWeight:800, color:'#0E1523', margin:0 }}>{activePromptConfig.title}</h2>
              </div>
              <button onClick={function() { setLockedNavTarget(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'4px', borderRadius:'6px' }} className="focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Dismiss">
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>
            <p style={{ fontSize:'14px', color:'#475569', lineHeight:1.6, marginBottom:'20px' }}>{activePromptConfig.description}</p>
            <div style={{ display:'flex', gap:'10px' }}>
              {lockedNavTarget !== 'verified' && (
                <button onClick={function() { setLockedNavTarget(null); navigate('/organizations/'+organizationId+'/billing'); }} style={{ flex:1, padding:'10px 16px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">View Plans</button>
              )}
              {lockedNavTarget === 'verified' && (
                <button onClick={function() { setLockedNavTarget(null); navigate('/organizations/'+organizationId+'/settings?tab=verification'); }} style={{ flex:1, padding:'10px 16px', background:'#22C55E', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }} className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1">Get Verified</button>
              )}
              <button onClick={function() { setLockedNavTarget(null); }} style={{ padding:'10px 16px', background:'transparent', color:'#64748B', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      {resolvedTab === 'overview'  && renderOverview()}
      {resolvedTab === 'photos'    && renderPhotos()}
      {resolvedTab === 'approvals' && isAdmin && renderApprovals()}
      {resolvedTab === 'analytics' && isAdmin && <AnalyticsDashboard organizationId={organizationId} />}
      {resolvedTab === 'settings'  && (
        membership.role === 'admin'
          ? <OrganizationSettings organizationId={organizationId} onUpdate={function(u) { setOrganization(function(prev) { return Object.assign({}, prev, u); }); }} />
          : <div style={{ textAlign:'center', padding:'60px 20px', borderRadius:'12px', border:'1px dashed #E2E8F0' }}><p style={{ fontSize:'16px', fontWeight:700, color:'#475569' }}>Admin Access Required</p></div>
      )}
      {resolvedTab === 'invite' && renderInvite()}

      {activeEventMenu && <div style={{ position:'fixed', inset:0, zIndex:20 }} onClick={function() { setActiveEventMenu(null); }} aria-hidden="true" />}

      <CreateEvent
        isOpen={showCreateEvent}
        onClose={function() { setShowCreateEvent(false); setEditingEvent(null); }}
        onSuccess={async function() { setEditingEvent(null); await fetchStats(currentUserId); await fetchOverviewData(); mascotSuccessToast(editingEvent ? 'Event updated!' : 'Event created!'); }}
        organizationId={organizationId}
        organizationName={organization ? organization.name : ''}
        editingEvent={editingEvent}
      />
      <CreateAnnouncement
        isOpen={showCreateAnnouncement}
        onClose={function() { setShowCreateAnnouncement(false); }}
        onSuccess={async function() { await fetchStats(currentUserId); await fetchOverviewData(); }}
        organizationId={organizationId}
        organizationName={organization ? organization.name : ''}
      />
      <CreatePoll
        isOpen={showCreatePoll}
        onClose={function() { setShowCreatePoll(false); }}
        onSuccess={function() { setShowCreatePoll(false); }}
        organizationId={organizationId}
        organizationName={organization ? organization.name : ''}
      />
      {showCreateSignupForm && (
        <CreateSignupForm
          organizationId={organizationId}
          onClose={function() { setShowCreateSignupForm(false); }}
          onFormCreated={function() { setShowCreateSignupForm(false); mascotSuccessToast('Sign-up form created!'); }}
        />
      )}
      <OrgInviteMemberModal
        isOpen={showInviteModal}
        onClose={function() { setShowInviteModal(false); }}
        organizationId={organizationId}
        organizationName={organization ? organization.name : ''}
        currentUserId={currentUserId}
      />

      {/* Program modal */}
      {showProgramModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="prog-modal-title" onClick={function() { setShowProgramModal(false); }}>
          <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:'512px', maxHeight:'90vh', overflowY:'auto' }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #F1F5F9' }}>
              <h2 id="prog-modal-title" style={{ fontSize:'17px', fontWeight:800, color:'#0E1523', margin:0 }}>Add Program</h2>
              <button onClick={function() { setShowProgramModal(false); }} style={{ padding:'6px', borderRadius:'8px', background:'none', border:'none', cursor:'pointer', color:'#94A3B8' }} className="focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Close modal"><Icon path={ICONS.x} className="h-5 w-5" /></button>
            </div>
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'16px' }}>
              {[
                { id:'dash-prog-name', label:'Program Name', key:'name', required:true, type:'text', placeholder:'e.g. After School Tutoring' },
                { id:'dash-prog-audience', label:'Who Is It For?', key:'audience', required:false, type:'text', placeholder:'e.g. Youth ages 6-18' },
              ].map(function(field) {
                return (
                  <div key={field.id}>
                    <label htmlFor={field.id} style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'6px' }}>{field.label}{field.required && <span style={{ color:'#EF4444' }} aria-hidden="true"> *</span>}</label>
                    <input id={field.id} type="text" value={programForm[field.key]} onChange={function(e) { var k = field.key; setProgramForm(function(p) { return Object.assign({},p,{[k]:e.target.value}); }); }} placeholder={field.placeholder} style={{ width:'100%', padding:'8px 12px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'14px', color:'#0E1523', outline:'none', boxSizing:'border-box' }} className="focus:ring-2 focus:ring-blue-500" aria-required={field.required} />
                  </div>
                );
              })}
              <div>
                <label htmlFor="dash-prog-desc" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'6px' }}>Description</label>
                <textarea id="dash-prog-desc" value={programForm.description} onChange={function(e) { setProgramForm(function(p) { return Object.assign({},p,{description:e.target.value}); }); }} rows={3} placeholder="What does this program do?" style={{ width:'100%', padding:'8px 12px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'14px', color:'#0E1523', outline:'none', resize:'none', boxSizing:'border-box' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="dash-prog-status" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'6px' }}>Status</label>
                <select id="dash-prog-status" value={programForm.status} onChange={function(e) { setProgramForm(function(p) { return Object.assign({},p,{status:e.target.value}); }); }} style={{ width:'100%', padding:'8px 12px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'14px', color:'#0E1523', outline:'none' }} className="focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'12px', padding:'16px 24px', borderTop:'1px solid #F1F5F9' }}>
              <button onClick={function() { setShowProgramModal(false); }} style={{ flex:1, padding:'10px', border:'1px solid #E2E8F0', color:'#475569', fontSize:'14px', fontWeight:600, borderRadius:'8px', background:'transparent', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
              <button onClick={saveProgram} disabled={programSaving} style={{ flex:1, padding:'10px', background:'#3B82F6', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor:programSaving?'not-allowed':'pointer', opacity:programSaving?0.6:1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">{programSaving ? 'Saving...' : 'Add Program'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {showRescheduleModal && rescheduleEvent && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
          <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:'420px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #F1F5F9' }}>
              <h3 id="reschedule-title" style={{ fontSize:'16px', fontWeight:800, color:'#0E1523' }}>Reschedule Event</h3>
              <button onClick={function() { setShowRescheduleModal(false); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'4px' }} className="focus:outline-none focus:ring-2 focus:ring-slate-300 rounded" aria-label="Close"><Icon path={ICONS.x} className="h-5 w-5" /></button>
            </div>
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <p style={{ fontSize:'13px', fontWeight:700, color:'#475569' }}>{rescheduleEvent.title}</p>
              <div>
                <label htmlFor="rs-start" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px' }}>New Start <span aria-hidden="true" style={{ color:'#EF4444' }}>*</span></label>
                <input id="rs-start" type="datetime-local" value={rescheduleForm.start_time} onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({},f,{start_time:e.target.value}); }); }} style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#0E1523' }} className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
              </div>
              <div>
                <label htmlFor="rs-end" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px' }}>New End <span style={{ fontWeight:400, textTransform:'none', color:'#94A3B8' }}>(optional)</span></label>
                <input id="rs-end" type="datetime-local" value={rescheduleForm.end_time} onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({},f,{end_time:e.target.value}); }); }} style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#0E1523' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="rs-loc" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px' }}>New Location <span style={{ fontWeight:400, textTransform:'none', color:'#94A3B8' }}>(optional)</span></label>
                <input id="rs-loc" type="text" value={rescheduleForm.location} onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({},f,{location:e.target.value}); }); }} placeholder={rescheduleEvent.location || 'Keep current location'} style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#0E1523' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', padding:'16px 24px', borderTop:'1px solid #F1F5F9' }}>
              <button onClick={function() { setShowRescheduleModal(false); }} style={{ flex:1, padding:'10px', border:'1px solid #E2E8F0', color:'#475569', fontSize:'13px', fontWeight:700, borderRadius:'8px', cursor:'pointer', background:'#fff' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300">Cancel</button>
              <button onClick={handleRescheduleSubmit} disabled={rescheduleSaving || !rescheduleForm.start_time} style={{ flex:1, padding:'10px', background:'#F5B731', color:'#0E1523', fontSize:'13px', fontWeight:800, border:'none', borderRadius:'8px', cursor:rescheduleSaving||!rescheduleForm.start_time?'not-allowed':'pointer', opacity:rescheduleSaving||!rescheduleForm.start_time?0.6:1 }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                {rescheduleSaving ? 'Saving...' : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && deletingEvent && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', width:'100%', maxWidth:'420px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #F1F5F9' }}>
              <h3 id="delete-title" style={{ fontSize:'16px', fontWeight:800, color:'#0E1523' }}>Delete Event</h3>
              <button onClick={function() { setShowDeleteConfirm(false); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'4px' }} className="focus:outline-none focus:ring-2 focus:ring-slate-300 rounded" aria-label="Close"><Icon path={ICONS.x} className="h-5 w-5" /></button>
            </div>
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div style={{ padding:'14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'10px' }}>
                <p style={{ fontSize:'13px', fontWeight:700, color:'#991B1B' }}>Delete "{deletingEvent.title}"?</p>
                <p style={{ fontSize:'12px', color:'#EF4444', marginTop:'4px' }}>{formatEventDate(deletingEvent.start_time)}</p>
                <p style={{ fontSize:'12px', color:'#B91C1C', marginTop:'6px' }}>This cannot be undone.</p>
              </div>
              {(deletingEvent.recurrence_rule || deletingEvent.parent_event_id) && (
                <div>
                  <p style={{ fontSize:'13px', fontWeight:700, color:'#374151', marginBottom:'8px' }}>This is a recurring event. Delete:</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }} role="radiogroup" aria-label="Delete scope">
                    {[
                      { value:'this',   label:'This event only',          desc:'Just this occurrence' },
                      { value:'future', label:'This and future events',   desc:'This and all upcoming' },
                      { value:'all',    label:'All events in the series', desc:'Every occurrence' },
                    ].map(function(opt) {
                      return (
                        <label key={opt.value} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:'2px solid', borderColor:deleteScope===opt.value?'#EF4444':'#E5E7EB', background:deleteScope===opt.value?'#FEF2F2':'#fff', cursor:'pointer' }}>
                          <input type="radio" name="delete-scope" value={opt.value} checked={deleteScope===opt.value} onChange={function(e) { setDeleteScope(e.target.value); }} style={{ marginTop:'2px', accentColor:'#EF4444' }} />
                          <div><p style={{ fontSize:'13px', fontWeight:600, color:'#374151' }}>{opt.label}</p><p style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{opt.desc}</p></div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:'10px', padding:'16px 24px', borderTop:'1px solid #F1F5F9' }}>
              <button onClick={function() { setShowDeleteConfirm(false); }} style={{ flex:1, padding:'10px', border:'1px solid #E2E8F0', color:'#475569', fontSize:'13px', fontWeight:700, borderRadius:'8px', cursor:'pointer', background:'#fff' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleteLoading} style={{ flex:1, padding:'10px', background:'#EF4444', color:'#fff', fontSize:'13px', fontWeight:800, border:'none', borderRadius:'8px', cursor:deleteLoading?'not-allowed':'pointer', opacity:deleteLoading?0.6:1 }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">
                {deleteLoading ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration modal */}
      {showCelebration && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10001, padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="celebrate-title">
          <div style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'16px', padding:'32px', maxWidth:'400px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.15)' }}>
            <img src="/mascot-onboarding.png" alt="" aria-hidden="true" style={{ width:'160px', height:'auto', margin:'0 auto 16px', display:'block', mixBlendMode:'multiply' }} />
            <h2 id="celebrate-title" style={{ fontSize:'20px', fontWeight:800, color:'#0E1523', marginBottom:'8px', textAlign:'center' }}>You're all set!</h2>
            <p style={{ fontSize:'13px', color:'#64748B', lineHeight:1.65, marginBottom:'20px', textAlign:'center' }}>What do you want to do first?</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {[
                { key:'event',        label:'Create an Event',      desc:'Schedule your first meeting or activity', color:'#3B82F6', path:'/organizations/'+organizationId+'/events?create=true' },
                { key:'invite',       label:'Invite Members',       desc:'Add people to your organization by email', color:'#22C55E', path:'/organizations/'+organizationId+'/members?invite=true' },
                { key:'announcement', label:'Post an Announcement', desc:'Share news or a welcome message',          color:'#F5B731', path:'/organizations/'+organizationId+'/announcements?create=true' },
                { key:'dashboard',    label:'Explore My Dashboard', desc:'See everything your org has to offer',     color:'#8B5CF6', path:'/organizations/'+organizationId },
              ].map(function(a) {
                return (
                  <button key={a.key} onClick={function() { setShowCelebration(false); navigate(a.path); }} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'12px', width:'100%' }} className="hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" aria-label={a.label}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'#0E1523', margin:'0 0 2px' }}>{a.label}</p>
                      <p style={{ fontSize:'12px', color:'#64748B', margin:0 }}>{a.desc}</p>
                    </div>
                    <Icon path={ICONS.chevRight} className="h-4 w-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrganizationDashboard;