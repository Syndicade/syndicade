import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import OrgOnboardingWizard from '../components/OrgOnboardingWizard';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';
import CreateEvent from '../components/CreateEvent';
import CreateAnnouncement from '../components/CreateAnnouncement';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CommunityBoard from '../pages/CommunityBoard';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import CreatePoll from '../components/CreatePoll';
import CreateSignupForm from '../components/CreateSignupForm';
import GuidedTour from '../components/GuidedTour';

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
  plus:       'M12 4v16m8-8H4',
  x:          'M6 18L18 6M6 6l12 12',
  check:      'M5 13l4 4L19 7',
  trash:      ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  repeat:     ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
  warn:       ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  chevRight:  'M9 5l7 7-7 7',
  chevLeft:   'M15 19l-7-7 7-7',
  dots:       ['M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'],
  location:   ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  video:      'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  shuffle:    ['M7 16V4m0 0L3 8m4-4l4 4', 'M17 8v12m0 0l4-4m-4 4l-4-4'],
  userPlus:   ['M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'],
  mail:       ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  user:       'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock:      ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  eye:        ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  menu:       'M4 6h16M4 12h16M4 18h16',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
var ANN_COLORS = {
  urgent: { bg:'#FFCDD2', pin:'#B71C1C', bdgBg:'#EF5350', bdgTxt:'#FFEBEE', txt:'#1A0000', org:'#7F0000' },
  normal: { bg:'#FFF9C4', pin:'#B8860B', bdgBg:'#F5B731', bdgTxt:'#3A2800', txt:'#1A1500', org:'#8A6F00' },
  low:    { bg:'#DCEDC8', pin:'#2E7D32', bdgBg:'#558B2F', bdgTxt:'#F1F8E9', txt:'#0D1F00', org:'#33691E' },
};
var EVENT_PALETTE = [
  { bg:'#BBDEFB', pin:'#1565C0', bdgBg:'#1E88E5', bdgTxt:'#E3F2FD', txt:'#0A1F3A', org:'#1565C0' },
  { bg:'#FFE0B2', pin:'#BF360C', bdgBg:'#E64A19', bdgTxt:'#FBE9E7', txt:'#1A0A00', org:'#BF360C' },
  { bg:'#E0F7FA', pin:'#006064', bdgBg:'#26C6DA', bdgTxt:'#003A3F', txt:'#00222A', org:'#005A60' },
  { bg:'#F3E5F5', pin:'#6A1B9A', bdgBg:'#AB47BC', bdgTxt:'#F3E5F5', txt:'#1A0025', org:'#6A1B9A' },
  { bg:'#FCE4EC', pin:'#880E4F', bdgBg:'#EC407A', bdgTxt:'#FCE4EC', txt:'#1A0010', org:'#880E4F' },
  { bg:'#DCEDC8', pin:'#2E7D32', bdgBg:'#558B2F', bdgTxt:'#F1F8E9', txt:'#0D1F00', org:'#33691E' },
];

function formatEventDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}
function formatShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function formatWeekdayTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function PostitSkeleton() {
  return (
    <div style={{ marginTop:'12px' }}>
      <div style={{ display:'flex', justifyContent:'center', height:'14px', marginBottom:'-3px' }}>
        <div style={{ width:'13px', height:'13px', borderRadius:'50%', background:'#2A3550' }} />
      </div>
      <div style={{ background:'#1E2845', borderRadius:'6px', padding:'16px' }} className="animate-pulse">
        <div className="h-3 w-16 bg-gray-700 rounded mb-3" />
        <div className="h-3 w-full bg-gray-700 rounded mb-2" />
        <div className="h-3 w-2/3 bg-gray-700 rounded" />
      </div>
    </div>
  );
}

// ── Org tour steps ────────────────────────────────────────────────────────────
var ORG_TOUR_STEPS = [
  {
    target: null,
    title: 'Welcome to your dashboard',
    description: 'You\'re all set up. Let\'s take a 30-second tour so you can hit the ground running.'
  },
  {
    target: 'tour-org-nav',
    title: 'Your navigation',
    description: 'Everything your organization needs is here — members, events, announcements, documents, and more.',
    placement: 'right'
  },
  {
    target: 'tour-members-nav',
    title: 'Manage your members',
    description: 'Invite people, assign admin roles, and see who\'s active in your organization.',
    placement: 'right'
  },
  {
    target: 'tour-events-nav',
    title: 'Create your first event',
    description: 'Schedule events, collect RSVPs, sell tickets, and track attendance — all in one place.',
    placement: 'right'
  },
  {
    target: 'tour-announcements-nav',
    title: 'Keep members informed',
    description: 'Post announcements that show up directly on your members\' unified dashboards.',
    placement: 'right'
  },
{
  target: 'tour-public-page-nav',
  title: 'Your public page',
  description: 'Set up your organization\'s public website — add your logo, mission, events, and a contact form. No coding needed.',
  placement: 'right'
},
  {
    target: null,
    title: 'You\'re ready to go',
    description: 'Start by inviting your first members. They\'ll get a welcome email and can join right away.'
  }
];

// ── Main ──────────────────────────────────────────────────────────────────────
function OrganizationDashboard() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();

  var themeCtx = useTheme();
  var isDark = themeCtx ? themeCtx.isDark : true;
  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg     = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var elevatedBg    = isDark ? '#1E2845' : '#F1F5F9';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';

  // Core state
  var [organization, setOrganization] = useState(null);
  var [membership, setMembership] = useState(null);
  var [currentUserId, setCurrentUserId] = useState(null);
  var [stats, setStats] = useState({ totalMembers:0, pendingInvites:0, activeEvents:0, unreadAnnouncements:0, myRsvps:0, myGroups:0 });
  var [activeTab, setActiveTab] = useState('overview');
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [viewMode, setViewMode] = useState('admin');
  var [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ── TOUR STATE — triggers tour after wizard completes ─────────────────────
  var [showTour, setShowTour] = useState(false);
  var [showCelebration, setShowCelebration] = useState(false);

  // Overview data
  var [overviewEvents, setOverviewEvents] = useState([]);
  var [overviewAnnouncements, setOverviewAnnouncements] = useState([]);
  var [overviewLoading, setOverviewLoading] = useState(false);

  // Chat preview
  var [chatPreview, setChatPreview] = useState([]);
  var [chatLoading, setChatLoading] = useState(false);

  // Event actions
  var [activeEventMenu, setActiveEventMenu] = useState(null);
  var [editingEvent, setEditingEvent] = useState(null);
  var [showRescheduleModal, setShowRescheduleModal] = useState(false);
  var [rescheduleEvent, setRescheduleEvent] = useState(null);
  var [rescheduleForm, setRescheduleForm] = useState({ start_time:'', end_time:'', location:'' });
  var [rescheduleSaving, setRescheduleSaving] = useState(false);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  var [deletingEvent, setDeletingEvent] = useState(null);
  var [deleteScope, setDeleteScope] = useState('this');
  var [deleteLoading, setDeleteLoading] = useState(false);

  // Modals
  var [showCreateEvent, setShowCreateEvent] = useState(false);
  var [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  var [showCreatePoll, setShowCreatePoll] = useState(false);
  var [showCreateSignupForm, setShowCreateSignupForm] = useState(false);
  var [showInviteModal, setShowInviteModal] = useState(false);

  // Approvals
  var [pendingApprovals, setPendingApprovals] = useState([]);
  var [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(false);
  var [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Inbox
  var [inquiries, setInquiries] = useState([]);
  var [inquiriesLoading, setInquiriesLoading] = useState(false);
  var [unreadInquiriesCount, setUnreadInquiriesCount] = useState(0);

  // Photos
  var [photos, setPhotos] = useState([]);
  var [photosLoading, setPhotosLoading] = useState(false);
  var [photoUploading, setPhotoUploading] = useState(false);
  var [photoCaption, setPhotoCaption] = useState('');
  var [photoError, setPhotoError] = useState(null);
  var [deletingPhotoId, setDeletingPhotoId] = useState(null);
  var [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Program modal
  var [showProgramModal, setShowProgramModal] = useState(false);
  var [editingProgram, setEditingProgram] = useState(null);
  var [programForm, setProgramForm] = useState({ name:'', description:'', audience:'', schedule:'', how_to_apply:'', contact_name:'', contact_email:'', status:'active', is_public:true });
  var [programSaving, setProgramSaving] = useState(false);

  // Preview data for non-overview tabs
  var [previewData, setPreviewData] = useState({});
  var [previewLoading, setPreviewLoading] = useState(false);

  var effectiveRole = (membership && membership.role === 'admin' && viewMode === 'admin') ? 'admin' : 'member';
  var isAdmin = effectiveRole === 'admin';

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(function() { fetchData(); }, [organizationId]);

  useEffect(function() {
    if (activeTab === 'overview' && organizationId) {
      fetchOverviewData();
      fetchChatPreview();
    }
  }, [activeTab, organizationId]);

  useEffect(function() { if (activeTab === 'approvals') fetchPendingApprovals(); }, [activeTab]);
  useEffect(function() { if (activeTab === 'inbox') fetchInquiries(); }, [activeTab]);
  useEffect(function() { if (activeTab === 'photos') fetchPhotos(); }, [activeTab]);

  useEffect(function() {
    var previewTabs = ['announcements','events','members','documents','polls','forms','programs','chat','inbox'];
    if (previewTabs.indexOf(activeTab) !== -1) fetchPreviewData(activeTab);
  }, [activeTab]);

  // ── Data ──────────────────────────────────────────────────────────────────
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
        var readSet = new Set((reads.data || []).map(function(r) { return r.announcement_id; }));
        unread = annIds.length - readSet.size;
      }
      var rsvpRes = userId ? await supabase.from('event_rsvps').select('*', { count:'exact', head:true }).eq('member_id', userId).eq('status', 'going') : { count: 0 };
      var grpRes = userId ? await supabase.from('org_group_members').select('*', { count:'exact', head:true }).eq('member_id', userId) : { count: 0 };
      setStats({
        totalMembers: results[0].count || 0,
        pendingInvites: results[1].count || 0,
        activeEvents: results[2].count || 0,
        unreadAnnouncements: unread,
        myRsvps: rsvpRes.count || 0,
        myGroups: grpRes.count || 0,
      });
    } catch(err) { console.error(err); }
  }

  async function fetchOverviewData() {
    setOverviewLoading(true);
    try {
      var evRes = await supabase.from('events').select('id,title,start_time,end_time,location,event_type,description,recurrence_rule,parent_event_id,is_rescheduled,original_start_time,publish_to_discovery,publish_to_website,volunteer_signup,donation_dropoff,event_types,audience,languages,visibility,require_rsvp,virtual_link,full_address,city,state,zip_code,max_attendees,is_recurring,recurrence_end_date,is_paid,enable_check_in').eq('organization_id', organizationId).gte('start_time', new Date().toISOString()).order('start_time', { ascending:true }).limit(3);
      setOverviewEvents(evRes.data || []);
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
          if (profRes.data) {
            senderName = profRes.data.user_id === currentUserId ? 'You' : profRes.data.first_name + ' ' + (profRes.data.last_name ? profRes.data.last_name.charAt(0) + '.' : '');
          }
        }
        previews.push({ id:ch.id, name:ch.name, lastMsg:lastMsg ? lastMsg.content : null, sender:senderName, time:lastMsg ? lastMsg.created_at : null });
      }
      setChatPreview(previews);
    } catch(err) { console.error(err); }
    finally { setChatLoading(false); }
  }

  async function fetchPendingApprovals() {
    setPendingApprovalsLoading(true);
    try {
      var items = [];
      var tables = [
        { name:'events',        label:'Event',        tf:'title'    },
        { name:'announcements', label:'Announcement', tf:'title'    },
        { name:'polls',         label:'Poll',         tf:'question' },
        { name:'surveys',       label:'Survey',       tf:'title'    },
        { name:'signup_forms',  label:'Sign-Up Form', tf:'title'    },
      ];
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        var r = await supabase.from(t.name).select('id,' + t.tf + ',created_at').eq('organization_id', organizationId).eq('approval_status', 'pending').order('created_at', { ascending:false });
        if (r.data) r.data.forEach(function(item) { items.push({ id:item.id, type:t.label, table:t.name, title:item[t.tf], created_at:item.created_at }); });
      }
      items.sort(function(a,b) { return new Date(b.created_at) - new Date(a.created_at); });
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

  async function fetchPreviewData(tab) {
    setPreviewLoading(true);
    try {
      var result = {};
      if (tab === 'announcements') {
        var r = await supabase.from('announcements').select('id,title,content,priority,created_at,is_pinned').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(5);
        result.items = r.data || [];
      }
      if (tab === 'events') {
        var r2 = await supabase.from('events').select('id,title,start_time,location,visibility,is_virtual').eq('organization_id', organizationId).gte('start_time', new Date().toISOString()).order('start_time', { ascending:true }).limit(6);
        result.items = r2.data || [];
      }
      if (tab === 'members') {
        var r3 = await supabase.from('memberships').select('member_id,role,joined_date,members(first_name,last_name,profile_photo_url)').eq('organization_id', organizationId).eq('status', 'active').order('joined_date', { ascending:false }).limit(12);
        result.items = r3.data || [];
      }
      if (tab === 'documents') {
        var r4 = await supabase.from('documents').select('id,name,file_type,file_size,created_at,folder_id').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(8);
        result.items = r4.data || [];
      }
      if (tab === 'polls') {
        var r5 = await supabase.from('polls').select('id,question,closes_at,approval_status,created_at').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(5);
        result.items = r5.data || [];
      }
      if (tab === 'forms') {
        var r6 = await supabase.from('signup_forms').select('id,title,description,created_at,approval_status').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(5);
        result.items = r6.data || [];
      }
      if (tab === 'programs') {
        var r7 = await supabase.from('org_programs').select('id,name,description,status,audience').eq('organization_id', organizationId).order('sort_order', { ascending:true }).limit(6);
        result.items = r7.data || [];
      }
      if (tab === 'chat') { result.items = chatPreview; }
      if (tab === 'inbox') {
        var r8 = await supabase.from('contact_inquiries').select('id,name,email,message,is_read,created_at').eq('organization_id', organizationId).order('created_at', { ascending:false }).limit(5);
        result.items = r8.data || [];
      }
      setPreviewData(function(prev) { return Object.assign({}, prev, { [tab]: result }); });
    } catch(err) { console.error('Preview fetch error:', err); }
    finally { setPreviewLoading(false); }
  }

  // ── Event actions ─────────────────────────────────────────────────────────
  function handleEditEvent(ev) { setEditingEvent(ev); setShowCreateEvent(true); setActiveEventMenu(null); }

  function handleRescheduleEvent(ev) {
    setRescheduleEvent(ev);
    setRescheduleForm({ start_time:ev.start_time ? ev.start_time.slice(0,16) : '', end_time:ev.end_time ? ev.end_time.slice(0,16) : '', location:ev.location || '' });
    setShowRescheduleModal(true); setActiveEventMenu(null);
  }

  function handleDeleteEvent(ev) { setDeletingEvent(ev); setDeleteScope('this'); setShowDeleteConfirm(true); setActiveEventMenu(null); }

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
      await fetchOverviewData();
      await fetchStats(currentUserId);
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
      var ins = await supabase.from('org_photos').insert({ organization_id:organizationId, uploaded_by:currentUserId, photo_url:urlData.data.publicUrl, caption:photoCaption.trim() || null });
      if (ins.error) throw ins.error;
      setPhotoCaption(''); e.target.value = '';
      await fetchPhotos();
      mascotSuccessToast('Photo uploaded!');
    } catch(err) { setPhotoError('Upload failed: ' + err.message); toast.error('Upload failed.'); }
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
    } catch(err) { toast.error('Could not delete: ' + err.message); }
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

  // ── Generic preview panel wrapper ─────────────────────────────────────────
  function renderPreviewPanel(opts) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:cardBg, border:'1px solid '+borderColor, borderRadius:'10px', padding:'14px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:elevatedBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon path={opts.iconPath} className="h-4 w-4" style={{ color:'#3B82F6' }} />
            </div>
            <div>
              <p style={{ fontSize:'15px', fontWeight:800, color:textPrimary }}>{opts.label}</p>
              {opts.count != null && <p style={{ fontSize:'11px', color:textMuted, marginTop:'1px' }}>{opts.count} total</p>}
            </div>
          </div>
          <button
            onClick={function() { navigate(opts.fullPagePath); }}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}
            className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {'Open ' + opts.label}
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'10px', overflow:'hidden' }}>
          {previewLoading ? (
            <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {[1,2,3,4].map(function(i) { return <div key={i} style={{ height:'48px', background:elevatedBg, borderRadius:'8px' }} className="animate-pulse" />; })}
            </div>
          ) : opts.children}
        </div>
      </div>
    );
  }

  // ── Preview tab renderers ──────────────────────────────────────────────────
  function renderAnnouncementsPreview() {
    var items = (previewData.announcements && previewData.announcements.items) || [];
    var priorityColors = { urgent:'#EF4444', normal:'#F5B731', low:'#22C55E' };
    return renderPreviewPanel({
      label: 'Announcements', iconPath: ICONS.megaphone,
      fullPagePath: '/organizations/'+organizationId+'/announcements',
      count: items.length > 0 ? items.length + ' recent' : null,
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.megaphone} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No announcements yet</p>
        </div>
      ) : (
        <div>
          {items.map(function(ann, i) {
            return (
              <div key={ann.id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 18px', borderBottom: i < items.length - 1 ? '1px solid '+borderColor : 'none' }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: priorityColors[ann.priority] || priorityColors.normal, flexShrink:0, marginTop:'5px' }} aria-hidden="true" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:700, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ann.title}</p>
                  {ann.content && <p style={{ fontSize:'12px', color:textMuted, marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ann.content}</p>}
                </div>
                <span style={{ fontSize:'11px', color:textMuted, flexShrink:0 }}>{formatShortDate(ann.created_at)}</span>
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderEventsPreview() {
    var items = (previewData.events && previewData.events.items) || [];
    return renderPreviewPanel({
      label: 'Events', iconPath: ICONS.calendar,
      fullPagePath: '/organizations/'+organizationId+'/events',
      count: stats.activeEvents + ' upcoming',
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.calendar} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No upcoming events</p>
        </div>
      ) : (
        <div>
          {items.map(function(ev, i) {
            return (
              <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 18px', borderBottom: i < items.length - 1 ? '1px solid '+borderColor : 'none' }}>
                <div style={{ width:'44px', flexShrink:0, textAlign:'center', background:elevatedBg, borderRadius:'8px', padding:'6px 4px' }}>
                  <p style={{ fontSize:'9px', fontWeight:700, color:'#60A5FA', textTransform:'uppercase', letterSpacing:'1px' }}>{new Date(ev.start_time).toLocaleDateString('en-US', { month:'short' })}</p>
                  <p style={{ fontSize:'18px', fontWeight:800, color:textPrimary, lineHeight:1 }}>{new Date(ev.start_time).getDate()}</p>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:700, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</p>
                  <p style={{ fontSize:'11px', color:textMuted, marginTop:'2px' }}>{ev.is_virtual ? 'Virtual' : (ev.location || 'No location set')} · {new Date(ev.start_time).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}</p>
                </div>
                <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'99px', background: ev.visibility === 'public' ? 'rgba(34,197,94,0.1)' : elevatedBg, color: ev.visibility === 'public' ? '#22C55E' : textMuted, fontWeight:600, flexShrink:0 }}>{ev.visibility}</span>
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderMembersPreview() {
    var items = (previewData.members && previewData.members.items) || [];
    return renderPreviewPanel({
      label: 'Members', iconPath: ICONS.members,
      fullPagePath: '/organizations/'+organizationId+'/members',
      count: stats.totalMembers + ' active',
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.members} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No members yet</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1px', background:borderColor }}>
          {items.map(function(m) {
            var member = m.members || {};
            var name = (member.first_name || '') + ' ' + (member.last_name || '');
            var initials = ((member.first_name || '?')[0] + (member.last_name || '?')[0]).toUpperCase();
            return (
              <div key={m.member_id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:cardBg }}>
                {member.profile_photo_url ? (
                  <img src={member.profile_photo_url} alt={name} style={{ width:'32px', height:'32px', borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                ) : (
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:isDark?'#1D3461':'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#60A5FA', flexShrink:0 }}>{initials}</div>
                )}
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:'12px', fontWeight:600, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name.trim() || 'Member'}</p>
                  <p style={{ fontSize:'10px', color: m.role === 'admin' ? '#A78BFA' : textMuted }}>{m.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderDocumentsPreview() {
    var items = (previewData.documents && previewData.documents.items) || [];
    var fileIcons = { pdf:'#EF4444', doc:'#3B82F6', docx:'#3B82F6', xls:'#22C55E', xlsx:'#22C55E', ppt:'#F97316', pptx:'#F97316' };
    return renderPreviewPanel({
      label: 'Documents', iconPath: ICONS.folder,
      fullPagePath: '/organizations/'+organizationId+'/documents',
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.folder} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No documents uploaded yet</p>
        </div>
      ) : (
        <div>
          {items.map(function(doc, i) {
            var ext = (doc.file_type || '').toLowerCase().replace('.', '');
            var dotColor = fileIcons[ext] || '#94A3B8';
            return (
              <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 18px', borderBottom: i < items.length - 1 ? '1px solid '+borderColor : 'none' }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'2px', background:dotColor, flexShrink:0 }} aria-hidden="true" />
                <p style={{ flex:1, fontSize:'13px', fontWeight:600, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.name}</p>
                <span style={{ fontSize:'10px', color:textMuted, flexShrink:0, textTransform:'uppercase' }}>{ext || 'file'}</span>
                <span style={{ fontSize:'11px', color:textMuted, flexShrink:0 }}>{formatShortDate(doc.created_at)}</span>
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderPollsPreview() {
    var items = (previewData.polls && previewData.polls.items) || [];
    return renderPreviewPanel({
      label: 'Polls & Surveys', iconPath: ICONS.polls,
      fullPagePath: '/organizations/'+organizationId+'/polls',
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.polls} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No polls yet</p>
        </div>
      ) : (
        <div>
          {items.map(function(poll, i) {
            var isOpen = !poll.closes_at || new Date(poll.closes_at) > new Date();
            return (
              <div key={poll.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', borderBottom: i < items.length - 1 ? '1px solid '+borderColor : 'none' }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: isOpen ? '#22C55E' : '#64748B', flexShrink:0 }} aria-hidden="true" />
                <p style={{ flex:1, fontSize:'13px', fontWeight:600, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{poll.question}</p>
                <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'99px', background: isOpen ? 'rgba(34,197,94,0.1)' : elevatedBg, color: isOpen ? '#22C55E' : textMuted, fontWeight:600, flexShrink:0 }}>{isOpen ? 'Open' : 'Closed'}</span>
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderFormsPreview() {
    var items = (previewData.forms && previewData.forms.items) || [];
    return renderPreviewPanel({
      label: 'Sign-Up Forms', iconPath: ICONS.forms,
      fullPagePath: '/organizations/'+organizationId+'/signup-forms',
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.forms} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No sign-up forms yet</p>
        </div>
      ) : (
        <div>
          {items.map(function(form, i) {
            return (
              <div key={form.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', borderBottom: i < items.length - 1 ? '1px solid '+borderColor : 'none' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:elevatedBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon path={ICONS.forms} className="h-4 w-4" style={{ color:'#818CF8' }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:700, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{form.title}</p>
                  {form.description && <p style={{ fontSize:'11px', color:textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{form.description}</p>}
                </div>
                <span style={{ fontSize:'11px', color:textMuted, flexShrink:0 }}>{formatShortDate(form.created_at)}</span>
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderProgramsPreview() {
    var items = (previewData.programs && previewData.programs.items) || [];
    var statusColors = { active:'#22C55E', upcoming:'#F5B731', closed:'#94A3B8' };
    return renderPreviewPanel({
      label: 'Programs', iconPath: ICONS.programs,
      fullPagePath: '/organizations/'+organizationId+'/programs',
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.programs} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No programs added yet</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'1px', background:borderColor }}>
          {items.map(function(prog) {
            var sc = statusColors[prog.status] || statusColors.active;
            return (
              <div key={prog.id} style={{ padding:'16px', background:cardBg }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                  <p style={{ fontSize:'13px', fontWeight:700, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{prog.name}</p>
                  <span style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'99px', background:'rgba(34,197,94,0.1)', color:sc, fontWeight:600, marginLeft:'8px', flexShrink:0 }}>{prog.status || 'active'}</span>
                </div>
                {prog.audience && <p style={{ fontSize:'11px', color:textMuted }}>For: {prog.audience}</p>}
                {prog.description && <p style={{ fontSize:'11px', color:textSecondary, marginTop:'4px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{prog.description}</p>}
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderChatPreview() {
    return renderPreviewPanel({
      label: 'Chat', iconPath: ICONS.chat,
      fullPagePath: '/organizations/'+organizationId+'/chat',
      children: chatPreview.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.chat} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No messages yet</p>
        </div>
      ) : (
        <div>
          {chatPreview.map(function(ch, i) {
            return (
              <div key={ch.id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 18px', borderBottom: i < chatPreview.length - 1 ? '1px solid '+borderColor : 'none' }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: ch.lastMsg ? '#22C55E' : '#64748B', flexShrink:0, marginTop:'5px' }} aria-hidden="true" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:textMuted, marginBottom:'2px' }}># {ch.name}</p>
                  {ch.lastMsg ? (
                    <p style={{ fontSize:'13px', color:textSecondary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      <span style={{ fontWeight:600 }}>{ch.sender}:</span> {ch.lastMsg}
                    </p>
                  ) : (
                    <p style={{ fontSize:'12px', color:textMuted, fontStyle:'italic' }}>No messages yet</p>
                  )}
                </div>
                {ch.time && <span style={{ fontSize:'11px', color:textMuted, flexShrink:0 }}>{formatShortDate(ch.time)}</span>}
              </div>
            );
          })}
        </div>
      )
    });
  }

  function renderInboxPreview() {
    var items = (previewData.inbox && previewData.inbox.items) || [];
    var unread = items.filter(function(i) { return !i.is_read; }).length;
    return renderPreviewPanel({
      label: 'Inbox', iconPath: ICONS.inbox,
      fullPagePath: '/organizations/'+organizationId+'/inbox',
      count: unread > 0 ? unread + ' unread' : 'all read',
      children: items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <Icon path={ICONS.inbox} className="h-10 w-10 mx-auto mb-2" style={{ color:textMuted }} strokeWidth={1.5} />
          <p style={{ fontSize:'13px', color:textMuted }}>No messages yet</p>
        </div>
      ) : (
        <div>
          {items.map(function(inq, i) {
            return (
              <div key={inq.id} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px 18px', borderBottom: i < items.length - 1 ? '1px solid '+borderColor : 'none', background: !inq.is_read ? (isDark?'rgba(59,130,246,0.04)':'rgba(59,130,246,0.02)') : 'transparent' }}>
                {!inq.is_read && <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#3B82F6', flexShrink:0, marginTop:'5px' }} aria-label="unread" />}
                {inq.is_read && <span style={{ width:'7px', height:'7px', flexShrink:0 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
                    <p style={{ fontSize:'13px', fontWeight: inq.is_read ? 500 : 700, color:textPrimary }}>{inq.name}</p>
                    <p style={{ fontSize:'11px', color:textMuted }}>{inq.email}</p>
                  </div>
                  <p style={{ fontSize:'12px', color:textSecondary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inq.message}</p>
                </div>
                <span style={{ fontSize:'11px', color:textMuted, flexShrink:0 }}>{formatShortDate(inq.created_at)}</span>
              </div>
            );
          })}
        </div>
      )
    });
  }

  // ── Nav definition ────────────────────────────────────────────────────────
  var NAV_GROUPS = [
{
  label: 'Workspace',
  items: [
    { id:'overview',      label:'Overview',      iconKey:'overview',  roles:['admin','member'] },
    { id:'events',        label:'Events',        iconKey:'calendar',  roles:['admin','member'], tourKey:'tour-events-nav' },
    { id:'announcements', label:'Announcements', iconKey:'megaphone', roles:['admin','member'], tourKey:'tour-announcements-nav' },
    { id:'members',       label:'Members',       iconKey:'members',   roles:['admin','member'], tourKey:'tour-members-nav' },
    { id:'groups',        label:'Groups',        iconKey:'members',   roles:['admin','member'], externalLink: '/organizations/'+organizationId+'/groups' },
    { id:'chat',          label:'Chat',          iconKey:'chat',      roles:['admin','member'] },
    { id:'documents',     label:'Documents',     iconKey:'folder',    roles:['admin','member'] },
    { id:'photos',        label:'Photos',        iconKey:'photo',     roles:['admin','member'] },
  ]
},
    {
      label: 'Tools',
      items: [
        { id:'polls',     label:'Polls & Surveys', iconKey:'polls',    roles:['admin','member'] },
        { id:'forms',     label:'Sign-Up Forms',   iconKey:'forms',    roles:['admin','member'] },
        { id:'programs',  label:'Programs',        iconKey:'programs', roles:['admin','member'] },
      ]
    },
    {
      label: 'Admin',
      adminOnly: true,
      items: [
        { id:'approvals',  label:'Approvals',   iconKey:'approvals', roles:['admin'], badge: pendingApprovalsCount },
        { id:'inbox',      label:'Inbox',        iconKey:'inbox',     roles:['admin'], badge: unreadInquiriesCount },
        { id:'analytics',  label:'Analytics',    iconKey:'analytics', roles:['admin'] },
        { id:'publicpage', label:'Public Page', iconKey:'pencil', roles:['admin'], tourKey:'tour-public-page-nav' },
      ]
    },
    {
      label: 'Platform',
      items: [
        { id:'community-board', label:'Community Board', iconKey:'pinboard', roles:['admin','member'], isPurple:true },
        { id:'settings',        label:'Settings',        iconKey:'settings', roles:['admin','member'] },
        { id:'billing',         label:'Billing',         iconKey:'billing',  roles:['admin'], isSub:true, externalLink:'/organizations/'+organizationId+'/billing' },
      ]
    },
  ];

  function handleNavClick(item) {
    setMobileNavOpen(false);
    if (item.externalLink) { navigate(item.externalLink); return; }
    setActiveTab(item.id);
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: pageBg, minHeight:'100vh', padding:'32px 16px' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
          <div style={{ background:sectionBg, borderRadius:'12px', padding:'24px', border:'1px solid '+borderColor }} className="animate-pulse">
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:elevatedBg }} />
              <div>
                <div style={{ height:'20px', width:'200px', background:elevatedBg, borderRadius:'6px', marginBottom:'8px' }} />
                <div style={{ height:'14px', width:'140px', background:elevatedBg, borderRadius:'6px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
        <div style={{ textAlign:'center', maxWidth:'380px' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:elevatedBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Icon path={ICONS.members} className="h-8 w-8" style={{ color:textMuted }} />
          </div>
          <h1 style={{ fontSize:'20px', fontWeight:800, color:textPrimary, marginBottom:'8px' }}>Access Denied</h1>
          <p style={{ color:textSecondary, marginBottom:'24px' }}>{error}</p>
          <button onClick={function() { navigate('/organizations'); }} style={{ background:'#3B82F6', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 24px', fontWeight:700, cursor:'pointer' }}>
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  // ── Render nav items ──────────────────────────────────────────────────────
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
          <p style={{ fontSize:'8px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#2A3550', padding:'8px 10px 3px' }}>{group.label}</p>
          {visibleItems.map(function(item) {
            var isActive = activeTab === item.id;
            var color = item.isPurple ? '#A78BFA' : isActive ? '#3B82F6' : textMuted;
            var bg = isActive ? 'rgba(59,130,246,0.12)' : 'transparent';
            return (
              <button
                key={item.id}
                onClick={function() { handleNavClick(item); }}
                data-tour={item.tourKey || null}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding: item.isSub ? '7px 10px 7px 26px' : '7px 10px', borderRadius:'7px', fontSize: item.isSub ? '10px' : '11px', fontWeight:600, color:color, background:bg, border:'none', cursor:'pointer', width:'100%', textAlign:'left', position:'relative', whiteSpace:'nowrap' }}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon path={ICONS[item.iconKey]} className="h-3.5 w-3.5" style={{ flexShrink:0, color:color }} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ position:'absolute', right:'8px', background:item.id==='inbox'?'#EF4444':'#F5B731', color:item.id==='inbox'?'#fff':'#1A0000', fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'99px' }} aria-label={item.badge + ' pending'}>
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

  // ── Overview tab ──────────────────────────────────────────────────────────
  function renderOverview() {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'10px', padding:'16px' }}>
          <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
            <button onClick={function() { navigate('/organizations/'+organizationId+'/members'); }} style={{ flex:1, background:isDark?'#0E1523':'#EFF6FF', borderRadius:'8px', padding:'10px 12px', border:'none', cursor:'pointer', textAlign:'left' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-opacity" aria-label="View members">
              <p style={{ fontSize:'8px', fontWeight:700, color:'#60A5FA', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'2px' }}>Members</p>
              <p style={{ fontSize:'20px', fontWeight:800, color:'#60A5FA' }}>{stats.totalMembers}</p>
            </button>
            <button onClick={function() { navigate('/organizations/'+organizationId+'/events'); }} style={{ flex:1, background:isDark?'#0E1523':'#F0FDF4', borderRadius:'8px', padding:'10px 12px', border:'none', cursor:'pointer', textAlign:'left' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-opacity" aria-label="View events">
              <p style={{ fontSize:'8px', fontWeight:700, color:'#34D399', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'2px' }}>{isAdmin ? 'Upcoming Events' : 'My RSVPs'}</p>
              <p style={{ fontSize:'20px', fontWeight:800, color:'#34D399' }}>{isAdmin ? stats.activeEvents : stats.myRsvps}</p>
            </button>
            <button onClick={function() { navigate('/organizations/'+organizationId+'/announcements'); }} style={{ flex:1, background:isDark?'#0E1523':'#FFF7ED', borderRadius:'8px', padding:'10px 12px', border:'none', cursor:'pointer', textAlign:'left' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-opacity" aria-label="View announcements">
              <p style={{ fontSize:'8px', fontWeight:700, color:'#FB923C', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'2px' }}>Unread</p>
              <p style={{ fontSize:'20px', fontWeight:800, color:'#FB923C' }}>{stats.unreadAnnouncements}</p>
            </button>
            {isAdmin ? (
              <button onClick={function() { setActiveTab('invite'); }} style={{ flex:1, background:isDark?'#0E1523':'#FFFBEB', borderRadius:'8px', padding:'10px 12px', border:'none', cursor:'pointer', textAlign:'left' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-opacity" aria-label="View pending invites">
                <p style={{ fontSize:'8px', fontWeight:700, color:'#FBBF24', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'2px' }}>Pending Invites</p>
                <p style={{ fontSize:'20px', fontWeight:800, color:'#FBBF24' }}>{stats.pendingInvites}</p>
              </button>
            ) : (
              <button onClick={function() { navigate('/organizations/'+organizationId+'/groups'); }} style={{ flex:1, background:isDark?'#0E1523':'#F5F3FF', borderRadius:'8px', padding:'10px 12px', border:'none', cursor:'pointer', textAlign:'left' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-opacity" aria-label="View my groups">
                <p style={{ fontSize:'8px', fontWeight:700, color:'#A78BFA', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'2px' }}>My Groups</p>
                <p style={{ fontSize:'20px', fontWeight:800, color:'#A78BFA' }}>{stats.myGroups}</p>
              </button>
            )}
          </div>

          {/* Announcements */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#F5B731' }}>Announcements</p>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/announcements'); }} style={{ fontSize:'10px', color:'#3B82F6', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View all</button>
            </div>
            {overviewLoading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
                <PostitSkeleton /><PostitSkeleton /><PostitSkeleton />
              </div>
            ) : overviewAnnouncements.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px', background:isDark?'#0E1523':'#F9FAFB', borderRadius:'8px', border:'1px dashed '+borderColor }}>
                <Icon path={ICONS.megaphone} className="h-8 w-8 mx-auto mb-2" style={{ color:textMuted }} />
                <p style={{ fontSize:'13px', fontWeight:600, color:textSecondary }}>No announcements yet</p>
                {isAdmin && <button onClick={function() { setShowCreateAnnouncement(true); }} style={{ fontSize:'12px', color:'#3B82F6', background:'none', border:'none', cursor:'pointer', marginTop:'6px', fontWeight:600 }}>Post one</button>}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', paddingTop:'8px' }}>
                {overviewAnnouncements.map(function(ann) {
                  var c = ANN_COLORS[ann.priority] || ANN_COLORS.normal;
                  return (
                    <div key={ann.id} style={{ marginTop:'6px' }}>
                      <div style={{ display:'flex', justifyContent:'center', height:'12px', marginBottom:'-2px' }} aria-hidden="true">
                        <div style={{ width:'11px', height:'11px', borderRadius:'50%', background:'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.6) 0%, '+c.pin+' 52%, rgba(0,0,0,0.25) 100%)', boxShadow:'0 2px 4px rgba(0,0,0,0.35)' }} />
                      </div>
                      <button onClick={function() { navigate('/organizations/'+organizationId+'/announcements'); }} style={{ background:c.bg, borderRadius:'5px', padding:'12px', width:'100%', textAlign:'left', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', minHeight:'80px' }} className="hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400" aria-label={'View announcement: '+ann.title}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                          <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:'3px', fontSize:'9px', fontWeight:700, textTransform:'uppercase', background:c.bdgBg, color:c.bdgTxt }}>{ann.priority === 'urgent' ? 'Urgent' : ann.priority === 'low' ? 'Info' : 'Update'}</span>
                          {ann.is_pinned && <span style={{ fontSize:'9px', fontWeight:700, color:c.org }}>Pinned</span>}
                        </div>
                        <p style={{ fontSize:'11px', fontWeight:800, color:c.txt, lineHeight:1.3, marginBottom:'4px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{ann.title}</p>
                        <p style={{ fontSize:'9px', color:c.org, marginTop:'auto' }}>{formatShortDate(ann.created_at)}</p>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Events */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
              <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#F5B731' }}>Upcoming Events</p>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/events'); }} style={{ fontSize:'10px', color:'#3B82F6', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View all</button>
            </div>
            {overviewLoading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
                <PostitSkeleton /><PostitSkeleton /><PostitSkeleton />
              </div>
            ) : overviewEvents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px', background:isDark?'#0E1523':'#F9FAFB', borderRadius:'8px', border:'1px dashed '+borderColor }}>
                <Icon path={ICONS.calendar} className="h-8 w-8 mx-auto mb-2" style={{ color:textMuted }} />
                <p style={{ fontSize:'13px', fontWeight:600, color:textSecondary }}>No upcoming events</p>
                {isAdmin && <button onClick={function() { setEditingEvent(null); setShowCreateEvent(true); }} style={{ fontSize:'12px', color:'#3B82F6', background:'none', border:'none', cursor:'pointer', marginTop:'6px', fontWeight:600 }}>Create one</button>}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', paddingTop:'8px' }}>
                {overviewEvents.map(function(ev, i) {
                  var c = EVENT_PALETTE[i % EVENT_PALETTE.length];
                  var isRecurring = !!(ev.recurrence_rule || ev.parent_event_id);
                  return (
                    <div key={ev.id} style={{ marginTop:'6px', position:'relative' }}>
                      <div style={{ display:'flex', justifyContent:'center', height:'12px', marginBottom:'-2px' }} aria-hidden="true">
                        <div style={{ width:'11px', height:'11px', borderRadius:'50%', background:'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.6) 0%, '+c.pin+' 52%, rgba(0,0,0,0.25) 100%)', boxShadow:'0 2px 4px rgba(0,0,0,0.35)' }} />
                      </div>
                      <div style={{ background:c.bg, borderRadius:'5px', padding:'12px', minHeight:'80px', display:'flex', flexDirection:'column', position:'relative' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'5px', paddingRight: isAdmin ? '22px' : '0' }}>
                          <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:'3px', fontSize:'9px', fontWeight:700, textTransform:'uppercase', background:c.bdgBg, color:c.bdgTxt }}>{ev.is_virtual ? 'Virtual' : 'Event'}</span>
                          {isRecurring && <span style={{ fontSize:'9px', fontWeight:700, color:c.org }}>Recurring</span>}
                        </div>
                        <p style={{ fontSize:'11px', fontWeight:800, color:c.txt, lineHeight:1.3, marginBottom:'4px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{ev.title}</p>
                        <p style={{ fontSize:'9px', fontWeight:700, color:c.org, marginTop:'auto' }}>{formatShortDate(ev.start_time)}</p>
                        {isAdmin && (
                          <div style={{ position:'absolute', top:'6px', right:'6px' }}>
                            <button onClick={function(e) { e.stopPropagation(); setActiveEventMenu(activeEventMenu === ev.id ? null : ev.id); }} style={{ width:'20px', height:'20px', borderRadius:'4px', border:'none', background:'rgba(0,0,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:c.org }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-black/20" aria-label={'Actions for '+ev.title} aria-haspopup="true" aria-expanded={activeEventMenu === ev.id}>
                              <Icon path={ICONS.dots} className="h-3 w-3" />
                            </button>
                            {activeEventMenu === ev.id && (
                              <div style={{ position:'absolute', right:'0', top:'calc(100% + 4px)', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', zIndex:30, minWidth:'148px', overflow:'hidden' }} role="menu">
                                <button onClick={function() { handleEditEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none" role="menuitem"><Icon path={ICONS.pencil} className="h-4 w-4" />Edit</button>
                                <button onClick={function() { handleRescheduleEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 focus:outline-none" role="menuitem"><Icon path={ICONS.repeat} className="h-4 w-4" />Reschedule</button>
                                <div className="border-t border-gray-100" />
                                <button onClick={function() { handleDeleteEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none" role="menuitem"><Icon path={ICONS.trash} className="h-4 w-4" />Delete</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Chat */}
        <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'10px', padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
            <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#F5B731' }}>Recent Chat</p>
            <button onClick={function() { navigate('/organizations/'+organizationId+'/chat'); }} style={{ fontSize:'10px', color:'#3B82F6', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>Open Chat</button>
          </div>
          {chatLoading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {[1,2,3].map(function(i) { return <div key={i} style={{ height:'64px', background:elevatedBg, borderRadius:'8px' }} className="animate-pulse" />; })}
            </div>
          ) : chatPreview.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px', background:isDark?'#0E1523':'#F9FAFB', borderRadius:'8px', border:'1px dashed '+borderColor }}>
              <Icon path={ICONS.chat} className="h-6 w-6 mx-auto mb-2" style={{ color:textMuted }} />
              <p style={{ fontSize:'12px', color:textMuted }}>No messages yet</p>
              <button onClick={function() { navigate('/organizations/'+organizationId+'/chat'); }} style={{ fontSize:'11px', color:'#3B82F6', background:'none', border:'none', cursor:'pointer', marginTop:'6px', fontWeight:600 }}>Start chatting</button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {chatPreview.map(function(ch) {
                return (
                  <div key={ch.id}>
                    <p style={{ fontSize:'9px', fontWeight:700, color:textMuted, marginBottom:'5px', display:'flex', alignItems:'center', gap:'4px' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: ch.lastMsg ? '#22C55E' : '#64748B', flexShrink:0, display:'inline-block' }} />
                      # {ch.name}
                    </p>
                    <div style={{ background:isDark?'#0E1523':'#F8FAFC', borderRadius:'6px', padding:'8px 10px' }}>
                      {ch.lastMsg ? (
                        <>
                          <p style={{ fontSize:'9px', fontWeight:700, color:textMuted }}>{ch.sender}</p>
                          <p style={{ fontSize:'10px', color:textSecondary, marginTop:'2px', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{ch.lastMsg}</p>
                          <p style={{ fontSize:'8px', color:textMuted, marginTop:'3px' }}>{ch.time ? formatShortDate(ch.time) : ''}</p>
                        </>
                      ) : (
                        <p style={{ fontSize:'10px', color:textMuted, fontStyle:'italic' }}>No messages yet</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'10px', padding:'16px' }}>
          <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'#F5B731', marginBottom:'10px' }}>
            {isAdmin ? 'Quick Actions' : 'Shortcuts'}
          </p>
          {isAdmin ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
              {[
                { label:'Create Event',        color:'#3B82F6', dot:'#3B82F6', bg:'rgba(59,130,246,0.08)', borderClr:'rgba(59,130,246,0.2)', action: function() { setEditingEvent(null); setShowCreateEvent(true); } },
                { label:'Create Announcement', color:textSecondary, dot:'#F5B731', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, action: function() { setShowCreateAnnouncement(true); } },
                { label:'Create Poll',          color:textSecondary, dot:'#A78BFA', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, action: function() { setShowCreatePoll(true); }},
                { label:'Create Sign-Up Form',  color:textSecondary, dot:'#818CF8', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, action: function() { setShowCreateSignupForm(true); } },
                { label:'Invite Members',       color:textSecondary, dot:'#4ADE80', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, action: function() { setShowInviteModal(true); } },
                { label:'Create Program',       color:textSecondary, dot:'#F5B731', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, action: function() { setShowProgramModal(true); setEditingProgram(null); setProgramForm({ name:'', description:'', audience:'', schedule:'', how_to_apply:'', contact_name:'', contact_email:'', status:'active', is_public:true }); } },
              ].map(function(qa) {
                return (
                  <button key={qa.label} onClick={qa.action} style={{ background:qa.bg, border:'1px solid '+qa.borderClr, borderRadius:'8px', padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', width:'100%', textAlign:'left' }} className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-opacity">
                    <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:qa.dot, flexShrink:0, display:'inline-block' }} aria-hidden="true" />
                    <span style={{ fontSize:'11px', fontWeight:600, color:qa.color }}>{qa.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
              {[
                { label:'Browse Events',  dot:'#3B82F6', bg:'rgba(59,130,246,0.08)', borderClr:'rgba(59,130,246,0.2)', color:'#60A5FA', action: function() { navigate('/organizations/'+organizationId+'/events'); } },
                { label:'Announcements', dot:'#F5B731', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, color:textSecondary, action: function() { navigate('/organizations/'+organizationId+'/announcements'); } },
                { label:'Active Polls',  dot:'#A78BFA', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, color:textSecondary, action: function() { navigate('/organizations/'+organizationId+'/polls'); } },
                { label:'Sign-Up Sheets',dot:'#818CF8', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, color:textSecondary, action: function() { navigate('/organizations/'+organizationId+'/signup-forms'); } },
                { label:'Documents',     dot:'#4ADE80', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, color:textSecondary, action: function() { navigate('/organizations/'+organizationId+'/documents'); } },
                { label:'My Profile',    dot:'#94A3B8', bg:isDark?'#0E1523':'#F8FAFC', borderClr:borderColor, color:textSecondary, action: function() { navigate('/profile'); } },
              ].map(function(sc) {
                return (
                  <button key={sc.label} onClick={sc.action} style={{ background:sc.bg, border:'1px solid '+sc.borderClr, borderRadius:'8px', padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', width:'100%', textAlign:'left' }} className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-opacity">
                    <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:sc.dot, flexShrink:0, display:'inline-block' }} aria-hidden="true" />
                    <span style={{ fontSize:'11px', fontWeight:600, color:sc.color }}>{sc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Photos tab ────────────────────────────────────────────────────────────
  function renderPhotos() {
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:800, color:textPrimary }}>Photo Gallery</h2>
            <p style={{ fontSize:'13px', color:textMuted, marginTop:'4px' }}>{photos.length + ' photo' + (photos.length !== 1 ? 's' : '')}</p>
          </div>
        </div>
        {isAdmin && (
          <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'10px', padding:'20px', marginBottom:'20px' }}>
            <h3 style={{ fontSize:'14px', fontWeight:700, color:textPrimary, marginBottom:'14px' }}>Upload Photo</h3>
            {photoError && <div style={{ marginBottom:'12px', padding:'10px 12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', fontSize:'13px', color:'#EF4444' }} role="alert">{photoError}</div>}
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <input type="text" placeholder="Caption (optional)" value={photoCaption} onChange={function(e) { setPhotoCaption(e.target.value); }} maxLength={200} style={{ flex:1, minWidth:'200px', padding:'8px 12px', borderRadius:'8px', border:'1px solid '+borderColor, background:isDark?'#0E1523':'#F8FAFC', color:textPrimary, fontSize:'13px', outline:'none' }} />
              <label htmlFor="photo-upload" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'8px', fontWeight:700, fontSize:'13px', cursor: photoUploading ? 'not-allowed' : 'pointer', background: photoUploading ? elevatedBg : '#3B82F6', color: photoUploading ? textMuted : '#fff' }}>
                {photoUploading ? 'Uploading...' : 'Upload Photo'}
                <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoUpload} disabled={photoUploading} className="sr-only" aria-label="Choose a photo" />
              </label>
            </div>
          </div>
        )}
        {photosLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6].map(function(i) { return <div key={i} style={{ height:'140px', borderRadius:'10px', background:elevatedBg }} className="animate-pulse" />; })}
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:isDark?'#0E1523':'#F9FAFB', borderRadius:'12px', border:'1px dashed '+borderColor }}>
            <Icon path={ICONS.photo} className="h-12 w-12 mx-auto mb-3" style={{ color:textMuted }} strokeWidth={1.5} />
            <p style={{ fontSize:'16px', fontWeight:700, color:textSecondary, marginBottom:'4px' }}>No photos yet</p>
            <p style={{ fontSize:'13px', color:textMuted }}>{isAdmin ? 'Upload your first photo above.' : 'No photos have been added yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-label="Photo gallery">
            {photos.map(function(photo) {
              return (
                <div key={photo.id} role="listitem" style={{ position:'relative', borderRadius:'10px', overflow:'hidden', background:elevatedBg, border:'1px solid '+borderColor }} className="group">
                  <button onClick={function() { setLightboxPhoto(photo); }} style={{ display:'block', width:'100%', background:'none', border:'none', cursor:'pointer', padding:0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" aria-label={'View photo' + (photo.caption ? ': '+photo.caption : '')}>
                    <img src={photo.photo_url} alt={photo.caption || 'Organization photo'} style={{ width:'100%', height:'140px', objectFit:'cover', display:'block' }} loading="lazy" />
                  </button>
                  {photo.caption && <div style={{ padding:'6px 10px', background:cardBg }}><p style={{ fontSize:'11px', color:textSecondary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{photo.caption}</p></div>}
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

  // ── Approvals tab ─────────────────────────────────────────────────────────
  function renderApprovals() {
    return (
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:800, color:textPrimary }}>Pending Approvals</h2>
            <p style={{ fontSize:'13px', color:textMuted, marginTop:'4px' }}>Review content submitted by editors</p>
          </div>
          {pendingApprovals.length > 0 && <span style={{ background:'rgba(245,183,49,0.15)', border:'1px solid rgba(245,183,49,0.3)', color:'#F5B731', fontSize:'12px', fontWeight:700, padding:'4px 12px', borderRadius:'99px' }}>{pendingApprovals.length} pending</span>}
        </div>
        {pendingApprovalsLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[1,2,3].map(function(i) { return <div key={i} style={{ height:'80px', borderRadius:'10px', background:elevatedBg }} className="animate-pulse" />; })}
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:isDark?'#0E1523':'#F9FAFB', borderRadius:'12px', border:'1px dashed '+borderColor }}>
            <Icon path={ICONS.check} className="h-12 w-12 mx-auto mb-3 text-green-400" strokeWidth={1.5} />
            <p style={{ fontSize:'16px', fontWeight:700, color:textSecondary }}>All caught up!</p>
            <p style={{ fontSize:'13px', color:textMuted, marginTop:'4px' }}>No content waiting for approval.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }} role="list" aria-label="Pending approvals">
            {pendingApprovals.map(function(item) {
              return (
                <div key={item.type+'-'+item.id} role="listitem" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', padding:'16px 20px', background:cardBg, border:'1px solid rgba(245,183,49,0.2)', borderRadius:'10px' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:'99px', fontSize:'11px', fontWeight:700, background:isDark?'#1D3461':'#EFF6FF', color:'#60A5FA', marginBottom:'6px' }}>{item.type}</span>
                    <p style={{ fontSize:'14px', fontWeight:700, color:textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</p>
                    <p style={{ fontSize:'11px', color:textMuted, marginTop:'2px' }}>{'Submitted ' + new Date(item.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</p>
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                    <button onClick={function() { handleApprove(item); }} style={{ padding:'7px 16px', background:'#22C55E', color:'#fff', fontSize:'12px', fontWeight:700, border:'none', borderRadius:'8px', cursor:'pointer' }} className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1" aria-label={'Approve '+item.title}>Approve</button>
                    <button onClick={function() { handleReject(item); }} style={{ padding:'7px 16px', background:'transparent', color:'#EF4444', border:'1px solid rgba(239,68,68,0.4)', fontSize:'12px', fontWeight:700, borderRadius:'8px', cursor:'pointer' }} className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1" aria-label={'Reject '+item.title}>Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Invite tab ────────────────────────────────────────────────────────────
  function renderInvite() {
    if (membership.role === 'admin' || (organization.settings && organization.settings.allowMemberInvites)) {
      return <InviteMember organizationId={organizationId} organizationName={organization.name} onInviteSent={function() { fetchStats(currentUserId); }} />;
    }
    return (
      <div style={{ textAlign:'center', padding:'60px 20px', background:isDark?'#0E1523':'#F9FAFB', borderRadius:'12px', border:'1px dashed '+borderColor }}>
        <Icon path={ICONS.mail} className="h-12 w-12 mx-auto mb-3" style={{ color:textMuted }} strokeWidth={1.5} />
        <p style={{ fontSize:'16px', fontWeight:700, color:textSecondary, marginBottom:'4px' }}>Permission Required</p>
        <p style={{ fontSize:'13px', color:textMuted }}>Member invitations are restricted to admins.</p>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  var currentPath = window.location.pathname;
  var pathBase = '/organizations/' + organizationId;
  var subPath = currentPath.replace(pathBase, '').replace(/^\//, '') || 'overview';
  var pathTabMap = { 'photos':'photos', 'approvals':'approvals', 'analytics':'analytics', 'settings':'settings', 'invite':'invite', '':'overview', 'overview':'overview' };
  var resolvedTab = pathTabMap[subPath] || 'overview';

  return (
    <>
      {/* ── Guided Tour — fires after wizard completes ── */}
      {isAdmin && (
        <GuidedTour
          steps={ORG_TOUR_STEPS}
          orgId={organizationId}
          tourType="org"
          show={showTour}
          onDone={function() { setShowTour(false); setShowCelebration(true); }}
        />
      )}

      {resolvedTab === 'overview'   && renderOverview()}
      {resolvedTab === 'photos'     && renderPhotos()}
      {resolvedTab === 'approvals'  && isAdmin && renderApprovals()}
      {resolvedTab === 'analytics'  && isAdmin && <AnalyticsDashboard organizationId={organizationId} />}
      {resolvedTab === 'settings'   && (
        membership.role === 'admin'
          ? <OrganizationSettings organizationId={organizationId} onUpdate={function(u) { setOrganization(function(prev) { return Object.assign({}, prev, u); }); }} />
          : <div style={{ textAlign:'center', padding:'60px 20px', borderRadius:'12px', border:'1px dashed '+borderColor }}>
              <p style={{ fontSize:'16px', fontWeight:700, color:textSecondary }}>Admin Access Required</p>
            </div>
      )}
      {resolvedTab === 'invite' && renderInvite()}

      {/* Event action menu backdrop */}
      {activeEventMenu && <div style={{ position:'fixed', inset:0, zIndex:20 }} onClick={function() { setActiveEventMenu(null); }} aria-hidden="true" />}

      {/* CreateEvent */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={function() { setShowCreateEvent(false); setEditingEvent(null); }}
        onSuccess={async function() {
          setEditingEvent(null);
          await fetchStats(currentUserId);
          await fetchOverviewData();
          mascotSuccessToast(editingEvent ? 'Event updated!' : 'Event created!');
        }}
        organizationId={organizationId}
        organizationName={organization ? organization.name : ''}
        editingEvent={editingEvent}
      />

      {/* CreateAnnouncement */}
      <CreateAnnouncement
        isOpen={showCreateAnnouncement}
        onClose={function() { setShowCreateAnnouncement(false); }}
        onSuccess={async function() {
          await fetchStats(currentUserId);
          await fetchOverviewData();
        }}
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

      {showInviteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:50 }} role="dialog" aria-modal="true" aria-label="Invite member" onClick={function() { setShowInviteModal(false); }}>
          <div style={{ width:'100%', maxWidth:'520px' }} onClick={function(e) { e.stopPropagation(); }}>
            <InviteMember organizationId={organizationId} organizationName={organization ? organization.name : ''} onInviteSent={function() { fetchStats(currentUserId); setShowInviteModal(false); }} />
          </div>
        </div>
      )}

      {showProgramModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="prog-modal-title" onClick={function() { setShowProgramModal(false); }}>
          <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', width:'100%', maxWidth:'512px', maxHeight:'90vh', overflowY:'auto' }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid '+borderColor }}>
              <h2 id="prog-modal-title" style={{ fontSize:'17px', fontWeight:800, color:textPrimary, margin:0 }}>Add Program</h2>
              <button onClick={function() { setShowProgramModal(false); }} style={{ padding:'6px', borderRadius:'8px', background:'none', border:'none', cursor:'pointer', color:textMuted }} className="focus:outline-none focus:ring-2 focus:ring-gray-500" aria-label="Close modal"><Icon path={ICONS.x} className="h-5 w-5" /></button>
            </div>
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label htmlFor="dash-prog-name" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'6px' }}>Program Name <span style={{ color:'#EF4444' }} aria-hidden="true">*</span></label>
                <input id="dash-prog-name" type="text" value={programForm.name} onChange={function(e) { setProgramForm(function(p) { return Object.assign({},p,{name:e.target.value}); }); }} placeholder="e.g. After School Tutoring" style={{ width:'100%', padding:'8px 12px', background:isDark?'#151B2D':'#F8FAFC', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, outline:'none', boxSizing:'border-box' }} className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
              </div>
              <div>
                <label htmlFor="dash-prog-desc" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'6px' }}>Description</label>
                <textarea id="dash-prog-desc" value={programForm.description} onChange={function(e) { setProgramForm(function(p) { return Object.assign({},p,{description:e.target.value}); }); }} rows={3} placeholder="What does this program do?" style={{ width:'100%', padding:'8px 12px', background:isDark?'#151B2D':'#F8FAFC', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, outline:'none', resize:'none', boxSizing:'border-box' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="dash-prog-audience" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'6px' }}>Who Is It For?</label>
                <input id="dash-prog-audience" type="text" value={programForm.audience} onChange={function(e) { setProgramForm(function(p) { return Object.assign({},p,{audience:e.target.value}); }); }} placeholder="e.g. Youth ages 6-18" style={{ width:'100%', padding:'8px 12px', background:isDark?'#151B2D':'#F8FAFC', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, outline:'none', boxSizing:'border-box' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="dash-prog-status" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'6px' }}>Status</label>
                <select id="dash-prog-status" value={programForm.status} onChange={function(e) { setProgramForm(function(p) { return Object.assign({},p,{status:e.target.value}); }); }} style={{ width:'100%', padding:'8px 12px', background:isDark?'#151B2D':'#F8FAFC', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, outline:'none' }} className="focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'12px', padding:'16px 24px', borderTop:'1px solid '+borderColor }}>
              <button onClick={function() { setShowProgramModal(false); }} style={{ flex:1, padding:'10px', border:'1px solid '+borderColor, color:textSecondary, fontSize:'14px', fontWeight:600, borderRadius:'8px', background:'transparent', cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-gray-500">Cancel</button>
              <button onClick={saveProgram} disabled={programSaving} style={{ flex:1, padding:'10px', background:'#3B82F6', color:'#fff', fontSize:'14px', fontWeight:700, borderRadius:'8px', border:'none', cursor:programSaving?'not-allowed':'pointer', opacity:programSaving?0.6:1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">{programSaving ? 'Saving...' : 'Add Program'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {showRescheduleModal && rescheduleEvent && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
          <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', width:'100%', maxWidth:'420px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #F1F5F9' }}>
              <h3 id="reschedule-title" style={{ fontSize:'16px', fontWeight:800, color:'#0E1523' }}>Reschedule Event</h3>
              <button onClick={function() { setShowRescheduleModal(false); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'4px' }} className="hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded" aria-label="Close"><Icon path={ICONS.x} className="h-5 w-5" /></button>
            </div>
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <p style={{ fontSize:'13px', fontWeight:700, color:'#475569' }}>{rescheduleEvent.title}</p>
              <div>
                <label htmlFor="rs-start" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px' }}>New Start <span aria-hidden="true" style={{ color:'#EF4444' }}>*</span></label>
                <input id="rs-start" type="datetime-local" value={rescheduleForm.start_time} onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({}, f, { start_time:e.target.value }); }); }} style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#0E1523' }} className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
              </div>
              <div>
                <label htmlFor="rs-end" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px' }}>New End <span style={{ fontWeight:400, textTransform:'none', color:'#94A3B8' }}>(optional)</span></label>
                <input id="rs-end" type="datetime-local" value={rescheduleForm.end_time} onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({}, f, { end_time:e.target.value }); }); }} style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#0E1523' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="rs-loc" style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px' }}>New Location <span style={{ fontWeight:400, textTransform:'none', color:'#94A3B8' }}>(optional)</span></label>
                <input id="rs-loc" type="text" value={rescheduleForm.location} onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({}, f, { location:e.target.value }); }); }} placeholder={rescheduleEvent.location || 'Keep current location'} style={{ width:'100%', padding:'8px 12px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', outline:'none', color:'#0E1523' }} className="focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', padding:'16px 24px', borderTop:'1px solid #F1F5F9' }}>
              <button onClick={function() { setShowRescheduleModal(false); }} style={{ flex:1, padding:'10px', border:'1px solid #E2E8F0', color:'#475569', fontSize:'13px', fontWeight:700, borderRadius:'8px', cursor:'pointer', background:'#fff' }} className="hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
              <button onClick={handleRescheduleSubmit} disabled={rescheduleSaving || !rescheduleForm.start_time} style={{ flex:1, padding:'10px', background:'#F5B731', color:'#0E1523', fontSize:'13px', fontWeight:800, border:'none', borderRadius:'8px', cursor: rescheduleSaving || !rescheduleForm.start_time ? 'not-allowed' : 'pointer', opacity: rescheduleSaving || !rescheduleForm.start_time ? 0.6 : 1 }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-400">{rescheduleSaving ? 'Saving...' : 'Reschedule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && deletingEvent && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', width:'100%', maxWidth:'420px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #F1F5F9' }}>
              <h3 id="delete-title" style={{ fontSize:'16px', fontWeight:800, color:'#0E1523' }}>Delete Event</h3>
              <button onClick={function() { setShowDeleteConfirm(false); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'4px' }} className="focus:outline-none focus:ring-2 focus:ring-gray-300 rounded" aria-label="Close"><Icon path={ICONS.x} className="h-5 w-5" /></button>
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
                        <label key={opt.value} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', borderRadius:'8px', border:'2px solid', borderColor: deleteScope === opt.value ? '#EF4444' : '#E5E7EB', background: deleteScope === opt.value ? '#FEF2F2' : '#fff', cursor:'pointer' }}>
                          <input type="radio" name="delete-scope" value={opt.value} checked={deleteScope === opt.value} onChange={function(e) { setDeleteScope(e.target.value); }} style={{ marginTop:'2px', accentColor:'#EF4444' }} />
                          <div><p style={{ fontSize:'13px', fontWeight:600, color:'#374151' }}>{opt.label}</p><p style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{opt.desc}</p></div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:'10px', padding:'16px 24px', borderTop:'1px solid #F1F5F9' }}>
              <button onClick={function() { setShowDeleteConfirm(false); }} style={{ flex:1, padding:'10px', border:'1px solid #E2E8F0', color:'#475569', fontSize:'13px', fontWeight:700, borderRadius:'8px', cursor:'pointer', background:'#fff' }} className="hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleteLoading} style={{ flex:1, padding:'10px', background:'#EF4444', color:'#fff', fontSize:'13px', fontWeight:800, border:'none', borderRadius:'8px', cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.6 : 1 }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">{deleteLoading ? 'Deleting...' : 'Delete Event'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Onboarding wizard ──
          onComplete: mark org done locally + trigger the guided tour */}
      {organization && !organization.onboarding_completed && membership && membership.role === 'admin' && (
        <OrgOnboardingWizard
          org={organization}
          onComplete={function() {
            setOrganization(function(prev) { return Object.assign({}, prev, { onboarding_completed: true }); });
            setShowTour(true);
          }}
        />
      )}
      {showCelebration && (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10001, padding:'16px' }} role="dialog" aria-modal="true" aria-labelledby="celebrate-title">
    <div style={{ background:'#1A2035', border:'1px solid #2A3550', borderRadius:'16px', padding:'40px 32px', textAlign:'center', maxWidth:'360px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
      <img src="/mascot-onboarding.png" alt="" aria-hidden="true" style={{ width:'200px', height:'auto', margin:'0 auto 20px', display:'block' }} />
      <h2 id="celebrate-title" style={{ fontSize:'20px', fontWeight:800, color:'#FFFFFF', marginBottom:'8px' }}>You are all set!</h2>
      <p style={{ fontSize:'13px', color:'#CBD5E1', lineHeight:1.65, marginBottom:'24px' }}>Your organization is ready to go. Start by inviting your first members.</p>
      <button onClick={function() { setShowCelebration(false); }} style={{ padding:'10px 28px', background:'#F5B731', color:'#0E1523', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:800, cursor:'pointer', width:'100%' }} className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-400">
        Let us go
      </button>
    </div>
  </div>
)}
    </>
  );
}

export default OrganizationDashboard;