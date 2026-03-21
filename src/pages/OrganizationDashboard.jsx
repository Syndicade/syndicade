import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';
import CreateEvent from '../components/CreateEvent';
import CreateAnnouncement from '../components/CreateAnnouncement';
import AnnouncementCard from '../components/AnnouncementCard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import Footer from '../components/Footer';

// ── Icon primitive ─────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'h-5 w-5'}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {Array.isArray(path)
        ? path.map(function(d, i) {
            return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />;
          })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
    </svg>
  );
}

var ICONS = {
  chart:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  members:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  building:  ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  folder:    'M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  photo:     ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  megaphone: ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  inbox:     ['M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'],
  mail:      ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  trendUp:   'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  settings:  ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clipboard: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  pencil:    ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  globe:     ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  clock:     ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  userPlus:  ['M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'],
  check:     'M5 13l4 4L19 7',
  trash:     ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:         'M6 18L18 6M6 6l12 12',
  location:  ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  video:     'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  shuffle:   ['M7 16V4m0 0L3 8m4-4l4 4', 'M17 8v12m0 0l4-4m-4 4l-4-4'],
  chevRight: 'M9 5l7 7-7 7',
  chevLeft:  'M15 19l-7-7 7-7',
  eye:       ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  pending:   ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'],
  programs:  ['M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
  plus:      'M12 4v16m8-8H4',
  dots:      ['M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'],
  warn:      ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  chat:      ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  repeat:    ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
  pinboard:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
};

var ACTIVITY_PER_PAGE = 5;

// ── Post-it color palette ──────────────────────────────────────────────────────
var ANN_COLORS = {
  urgent: { bg: '#FFCDD2', pin: '#B71C1C', bdgBg: '#EF5350', bdgTxt: '#FFEBEE', txt: '#1A0000', org: '#7F0000' },
  normal: { bg: '#FFF9C4', pin: '#B8860B', bdgBg: '#F5B731', bdgTxt: '#3A2800', txt: '#1A1500', org: '#8A6F00' },
  low:    { bg: '#DCEDC8', pin: '#2E7D32', bdgBg: '#558B2F', bdgTxt: '#F1F8E9', txt: '#0D1F00', org: '#33691E' },
};

var EVENT_PALETTE = [
  { bg: '#BBDEFB', pin: '#1565C0', bdgBg: '#1E88E5', bdgTxt: '#E3F2FD', txt: '#0A1F3A', org: '#1565C0' },
  { bg: '#FFE0B2', pin: '#BF360C', bdgBg: '#E64A19', bdgTxt: '#FBE9E7', txt: '#1A0A00', org: '#BF360C' },
  { bg: '#E0F7FA', pin: '#006064', bdgBg: '#26C6DA', bdgTxt: '#003A3F', txt: '#00222A', org: '#005A60' },
  { bg: '#F3E5F5', pin: '#6A1B9A', bdgBg: '#AB47BC', bdgTxt: '#F3E5F5', txt: '#1A0025', org: '#6A1B9A' },
  { bg: '#FCE4EC', pin: '#880E4F', bdgBg: '#EC407A', bdgTxt: '#FCE4EC', txt: '#1A0010', org: '#880E4F' },
  { bg: '#DCEDC8', pin: '#2E7D32', bdgBg: '#558B2F', bdgTxt: '#F1F8E9', txt: '#0D1F00', org: '#33691E' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatEventDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekdayTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatTimeOnly(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ── Toast system ───────────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite" aria-label="Notifications">
      {toasts.map(function(t) {
        return (
          <div
            key={t.id}
            className={'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium min-w-64 max-w-sm ' +
              (t.type === 'error' ? 'bg-red-600' : t.type === 'warning' ? 'bg-yellow-600' : 'bg-green-600')}
            role="alert"
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={function() { removeToast(t.id); }}
              className="text-white/70 hover:text-white flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white rounded"
              aria-label="Dismiss notification"
            >
              <Icon path={ICONS.x} className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton cards ─────────────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="bg-gray-100 rounded-xl p-6 border-2 border-gray-200 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-300 rounded" />
          <div className="h-8 w-12 bg-gray-300 rounded" />
          <div className="h-3 w-20 bg-gray-300 rounded" />
        </div>
        <div className="h-10 w-10 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}

function PostitSkeleton() {
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', height: '14px', marginBottom: '-3px' }}>
        <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#E5E7EB' }} />
      </div>
      <div className="animate-pulse" style={{ background: '#F3F4F6', borderRadius: '6px', padding: '16px' }}>
        <div className="h-4 w-16 bg-gray-300 rounded mb-3" />
        <div className="h-4 w-full bg-gray-300 rounded mb-2" />
        <div className="h-4 w-3/4 bg-gray-300 rounded mb-4" />
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-gray-300 rounded" />
          <div className="h-3 w-12 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function OrganizationDashboard() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();

  var themeCtx = useTheme();
  var isDark = themeCtx ? themeCtx.isDark : false;
  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var sectionBg     = isDark ? '#151B2D' : '#FFFFFF';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';
  var hoverBg       = isDark ? '#1E2845'  : '#F1F5F9';
  var toolsBg       = isDark ? '#0E1523'  : '#F8FAFC';
  var toolsBorder   = isDark ? '#2A3550'  : '#E5E7EB';
  var toolsBtnBg    = isDark ? '#1A2035'  : '#FFFFFF';
  var toolsBtnBdr   = isDark ? '#2A3550'  : '#E5E7EB';
  var toolsBtnTxt   = isDark ? '#94A3B8'  : '#374151';

  // Core state
  var [organization, setOrganization] = useState(null);
  var [membership, setMembership] = useState(null);
  var [currentUserId, setCurrentUserId] = useState(null);
  var [stats, setStats] = useState({
    totalMembers: 0, pendingInvites: 0, activeEvents: 0,
    unreadAnnouncements: 0, totalGroups: 0,
  });
  var [activeTab, setActiveTab] = useState('overview');
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [viewMode, setViewMode] = useState('admin');

  // Overview board data
  var [overviewEvents, setOverviewEvents] = useState([]);
  var [overviewAnnouncements, setOverviewAnnouncements] = useState([]);
  var [overviewLoading, setOverviewLoading] = useState(false);

  // Event action menu
  var [activeEventMenu, setActiveEventMenu] = useState(null);

  // Event edit
  var [editingEvent, setEditingEvent] = useState(null);

  // Reschedule modal
  var [showRescheduleModal, setShowRescheduleModal] = useState(false);
  var [rescheduleEvent, setRescheduleEvent] = useState(null);
  var [rescheduleForm, setRescheduleForm] = useState({ start_time: '', end_time: '' });
  var [rescheduleSaving, setRescheduleSaving] = useState(false);

  // Delete confirm modal
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  var [deletingEvent, setDeletingEvent] = useState(null);
  var [deleteScope, setDeleteScope] = useState('this');
  var [deleteLoading, setDeleteLoading] = useState(false);

  // Programs
  var [showProgramModal, setShowProgramModal] = useState(false);
  var [editingProgram, setEditingProgram] = useState(null);
  var [programForm, setProgramForm] = useState({
    name: '', description: '', audience: '', schedule: '',
    how_to_apply: '', contact_name: '', contact_email: '',
    status: 'active', is_public: true,
  });
  var [programSaving, setProgramSaving] = useState(false);

  // Toast
  var [toasts, setToasts] = useState([]);
  function addToast(message, type) {
    var id = Date.now() + Math.random();
    setToasts(function(prev) { return prev.concat([{ id: id, message: message, type: type || 'success' }]); });
    setTimeout(function() { setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }, 4000);
  }
  function removeToast(id) { setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }

  // Create modals
  var [showCreateEvent, setShowCreateEvent] = useState(false);
  var [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  // Recent activity
  var [recentActivity, setRecentActivity] = useState([]);
  var [activityLoading, setActivityLoading] = useState(false);
  var [activityPage, setActivityPage] = useState(1);
  var [readActivityIds, setReadActivityIds] = useState(new Set());

  // Pending approvals
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

  // Tabs
  var allTabs = [
    { id: 'overview',         label: 'Overview',         iconKey: 'chart',    roles: ['admin', 'member'] },
    { id: 'documents',        label: 'Documents',        iconKey: 'folder',   roles: ['admin', 'member'] },
    { id: 'photos',           label: 'Photos',           iconKey: 'photo',    roles: ['admin', 'member'] },
    { id: 'approvals',        label: 'Approvals',        iconKey: 'pending',  badge: pendingApprovalsCount, roles: ['admin'] },
    { id: 'inbox',            label: 'Inbox',            iconKey: 'inbox',    badge: unreadInquiriesCount, roles: ['admin'], isLink: true },
    { id: 'chat', label: 'Chat', iconKey: 'chat', roles: ['admin', 'member'], isLink: true },
    { id: 'invite',           label: 'Invite',           iconKey: 'mail',     roles: ['admin'] },
    { id: 'analytics',        label: 'Analytics',        iconKey: 'trendUp',  roles: ['admin'] },
    { id: 'community-board',  label: 'Community Board',  iconKey: 'pinboard', roles: ['admin'], isLink: true },
    { id: 'settings',         label: 'Settings',         iconKey: 'settings', roles: ['admin'] },
  ];

  var effectiveRole = (membership && membership.role === 'admin' && viewMode === 'admin') ? 'admin' : 'member';
  var tabs = allTabs.filter(function(tab) { return tab.roles.includes(effectiveRole); });

  // ── Effects ────────────────────────────────────────────────────────────────────
  useEffect(function() { fetchData(); }, [organizationId]);

  useEffect(function() {
    if (activeTab === 'overview' && organizationId) {
      fetchRecentActivity();
      fetchOverviewData();
    }
  }, [activeTab, organizationId]);

  useEffect(function() { if (activeTab === 'inbox' && organizationId) fetchInquiries(); }, [activeTab, organizationId]);
  useEffect(function() { if (activeTab === 'photos' && organizationId) fetchPhotos(); }, [activeTab, organizationId]);
  useEffect(function() { if (activeTab === 'approvals' && organizationId) fetchPendingApprovals(); }, [activeTab, organizationId]);

  // ── Data fetchers ──────────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      var authResult = await supabase.auth.getUser();
      if (authResult.error) throw authResult.error;
      if (!authResult.data.user) { navigate('/login'); return; }
      setCurrentUserId(authResult.data.user.id);

      var orgResult = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memberResult = await supabase
        .from('memberships')
        .select('id, role, status, joined_date, member_id, organization_id')
        .eq('organization_id', organizationId)
        .eq('member_id', authResult.data.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (memberResult.error) throw memberResult.error;
      if (!memberResult.data) {
        setError('You are not a member of this organization.');
        setLoading(false);
        return;
      }
      setMembership(memberResult.data);
      await fetchStats(authResult.data.user.id);
      await fetchOverviewData();
      await fetchRecentActivity();

      if (memberResult.data.role === 'admin') {
        var inboxResult = await supabase
          .from('contact_inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('is_read', false);
        setUnreadInquiriesCount(inboxResult.count || 0);

        var pendingCountItems = [];
        var tables = ['events', 'announcements', 'polls', 'surveys', 'signup_forms'];
        for (var i = 0; i < tables.length; i++) {
          var countResult = await supabase
            .from(tables[i])
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('approval_status', 'pending');
          pendingCountItems.push(countResult.count || 0);
        }
        setPendingApprovalsCount(pendingCountItems.reduce(function(a, b) { return a + b; }, 0));
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats(userId) {
    try {
      var results = await Promise.all([
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active'),
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'pending'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).gte('start_time', new Date().toISOString()),
        supabase.from('org_groups').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_active', true),
        supabase.from('announcements').select('id').eq('organization_id', organizationId),
      ]);

      var announcementIds = (results[4].data || []).map(function(a) { return a.id; });
      var unreadCount = 0;
      if (announcementIds.length > 0 && userId) {
        var readsResult = await supabase
          .from('announcement_reads')
          .select('announcement_id')
          .eq('member_id', userId)
          .in('announcement_id', announcementIds);
        var readIds = new Set((readsResult.data || []).map(function(r) { return r.announcement_id; }));
        unreadCount = announcementIds.length - readIds.size;
      }

      setStats({
        totalMembers: results[0].count || 0,
        pendingInvites: results[1].count || 0,
        activeEvents: results[2].count || 0,
        totalGroups: results[3].count || 0,
        unreadAnnouncements: unreadCount,
      });
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  }

  async function fetchOverviewData() {
    setOverviewLoading(true);
    try {
      var evRes = await supabase
        .from('events')
        .select('id, title, start_time, end_time, location, event_type, description, recurrence_rule, parent_event_id, is_rescheduled, original_start_time, original_end_time')
        .eq('organization_id', organizationId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);
      setOverviewEvents(evRes.data || []);

      var annRes = await supabase
        .from('announcements')
        .select('id, title, content, priority, created_at, is_pinned')
        .eq('organization_id', organizationId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);
      setOverviewAnnouncements(annRes.data || []);
    } catch (err) {
      console.error('fetchOverviewData error:', err);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function fetchRecentActivity() {
    try {
      setActivityLoading(true);
      var activities = [];

      var eventsResult = await supabase
        .from('events')
        .select('id, title, start_time, created_at, event_type')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (eventsResult.data) {
        eventsResult.data.forEach(function(ev) {
          activities.push({
            id: 'event-' + ev.id,
            type: 'event',
            title: 'New event: ' + ev.title,
            iconKey: ev.event_type === 'virtual' ? 'video' : ev.event_type === 'hybrid' ? 'shuffle' : 'location',
            timestamp: ev.created_at,
            link: '/organizations/' + organizationId + '/events',
          });
        });
      }

      var annResult = await supabase
        .from('announcements')
        .select('id, title, created_at, priority')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (annResult.data) {
        annResult.data.forEach(function(a) {
          activities.push({
            id: 'announcement-' + a.id,
            type: 'announcement',
            title: a.title,
            iconKey: 'megaphone',
            timestamp: a.created_at,
            link: '/organizations/' + organizationId + '/announcements',
          });
        });
      }

      var memberRows = await supabase
        .from('memberships')
        .select('id, joined_date, member_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('joined_date', { ascending: false })
        .limit(5);

      if (memberRows.data && memberRows.data.length > 0) {
        var memberIds = memberRows.data.map(function(m) { return m.member_id; });
        var profilesResult = await supabase.from('members').select('user_id, first_name, last_name').in('user_id', memberIds);
        var profileMap = {};
        (profilesResult.data || []).forEach(function(p) { profileMap[p.user_id] = p; });
        memberRows.data.forEach(function(m) {
          var p = profileMap[m.member_id];
          if (p) {
            activities.push({
              id: 'member-' + m.id,
              type: 'member',
              title: p.first_name + ' ' + p.last_name + ' joined',
              iconKey: 'userPlus',
              timestamp: m.joined_date,
              link: '/organizations/' + organizationId + '/members',
            });
          }
        });
      }

      activities.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
      setRecentActivity(activities.slice(0, 20));
      setActivityPage(1);
    } catch (err) {
      console.error('fetchRecentActivity error:', err);
    } finally {
      setActivityLoading(false);
    }
  }

  async function fetchPendingApprovals() {
    setPendingApprovalsLoading(true);
    try {
      var items = [];
      var tables = [
        { name: 'events',        label: 'Event',        titleField: 'title'    },
        { name: 'announcements', label: 'Announcement', titleField: 'title'    },
        { name: 'polls',         label: 'Poll',         titleField: 'question' },
        { name: 'surveys',       label: 'Survey',       titleField: 'title'    },
        { name: 'signup_forms',  label: 'Sign-Up Form', titleField: 'title'    },
      ];
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        var result = await supabase
          .from(t.name)
          .select('id, ' + t.titleField + ', created_at')
          .eq('organization_id', organizationId)
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });
        if (result.data) {
          result.data.forEach(function(item) {
            items.push({ id: item.id, type: t.label, table: t.name, title: item[t.titleField], created_at: item.created_at });
          });
        }
      }
      items.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      setPendingApprovals(items);
      setPendingApprovalsCount(items.length);
    } catch (err) {
      console.error('fetchPendingApprovals error:', err);
    } finally {
      setPendingApprovalsLoading(false);
    }
  }

  async function fetchInquiries() {
    try {
      setInquiriesLoading(true);
      var result = await supabase
        .from('contact_inquiries')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (result.error) throw result.error;
      setInquiries(result.data || []);
      setUnreadInquiriesCount((result.data || []).filter(function(i) { return !i.is_read; }).length);
    } catch (err) {
      console.error('fetchInquiries error:', err);
    } finally {
      setInquiriesLoading(false);
    }
  }

  async function fetchPhotos() {
    try {
      setPhotosLoading(true);
      var result = await supabase
        .from('org_photos')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (result.error) throw result.error;
      setPhotos(result.data || []);
    } catch (err) {
      console.error('fetchPhotos error:', err);
    } finally {
      setPhotosLoading(false);
    }
  }

  async function fetchPrograms() {
    var result = await supabase
      .from('org_programs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order')
      .order('created_at');
    if (result.error) { addToast('Failed to load programs', 'error'); }
  }

  function openNewProgram() {
    setEditingProgram(null);
    setProgramForm({ name: '', description: '', audience: '', schedule: '', how_to_apply: '', contact_name: '', contact_email: '', status: 'active', is_public: true });
    setShowProgramModal(true);
  }

  function openEditProgram(program) {
    setEditingProgram(program);
    setProgramForm({
      name: program.name || '', description: program.description || '', audience: program.audience || '',
      schedule: program.schedule || '', how_to_apply: program.how_to_apply || '',
      contact_name: program.contact_name || '', contact_email: program.contact_email || '',
      status: program.status || 'active', is_public: program.is_public !== false,
    });
    setShowProgramModal(true);
  }

  async function saveProgram() {
    if (!programForm.name.trim()) { addToast('Program name is required', 'error'); return; }
    setProgramSaving(true);
    var payload = Object.assign({}, programForm, { organization_id: organizationId, updated_at: new Date().toISOString() });
    var result = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);
    setProgramSaving(false);
    if (result.error) { addToast('Failed to save program', 'error'); return; }
    addToast(editingProgram ? 'Program updated' : 'Program created', 'success');
    setShowProgramModal(false);
    fetchPrograms();
  }

  // ── Event action handlers ──────────────────────────────────────────────────────
  function openEventMenu(eventId) {
    setActiveEventMenu(activeEventMenu === eventId ? null : eventId);
  }

  function handleEditEvent(ev) {
    setEditingEvent(ev);
    setShowCreateEvent(true);
    setActiveEventMenu(null);
  }

  function handleRescheduleEvent(ev) {
    setRescheduleEvent(ev);
    setRescheduleForm({
      start_time: ev.start_time ? ev.start_time.slice(0, 16) : '',
      end_time: ev.end_time ? ev.end_time.slice(0, 16) : '',
      location: ev.location || '',
    });
    setShowRescheduleModal(true);
    setActiveEventMenu(null);
  }

  function handleDeleteEvent(ev) {
    setDeletingEvent(ev);
    setDeleteScope('this');
    setShowDeleteConfirm(true);
    setActiveEventMenu(null);
  }

  async function handleRescheduleSubmit() {
    if (!rescheduleForm.start_time) { addToast('New start time is required', 'error'); return; }
    setRescheduleSaving(true);
    try {
      var updatePayload = {
        is_rescheduled: true,
        original_start_time: rescheduleEvent.start_time,
        original_end_time: rescheduleEvent.end_time,
        start_time: new Date(rescheduleForm.start_time).toISOString(),
      };
      if (rescheduleForm.end_time) {
        updatePayload.end_time = new Date(rescheduleForm.end_time).toISOString();
      }
      if (rescheduleForm.location.trim()) {
        updatePayload.location = rescheduleForm.location.trim();
      }
      var res = await supabase.from('events').update(updatePayload).eq('id', rescheduleEvent.id);
      if (res.error) throw res.error;
      addToast('Event rescheduled successfully.');
      setShowRescheduleModal(false);
      setRescheduleEvent(null);
      await fetchOverviewData();
      await fetchStats(currentUserId);
    } catch (err) {
      addToast('Could not reschedule: ' + err.message, 'error');
    } finally {
      setRescheduleSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    setDeleteLoading(true);
    try {
      var res;
      var isRecurring = !!(deletingEvent.recurrence_rule || deletingEvent.parent_event_id);
      var groupId = deletingEvent.parent_event_id || deletingEvent.id;

      if (isRecurring && deleteScope === 'all') {
        res = await supabase.from('events').delete()
          .or('id.eq.' + groupId + ',parent_event_id.eq.' + groupId);
      } else if (isRecurring && deleteScope === 'future') {
        res = await supabase.from('events').delete()
          .or('id.eq.' + groupId + ',parent_event_id.eq.' + groupId)
          .gte('start_time', deletingEvent.start_time);
      } else {
        res = await supabase.from('events').delete().eq('id', deletingEvent.id);
      }

      if (res.error) throw res.error;
      addToast('Event deleted.');
      setShowDeleteConfirm(false);
      setDeletingEvent(null);
      await fetchOverviewData();
      await fetchStats(currentUserId);
    } catch (err) {
      addToast('Could not delete event: ' + err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleEventCreated() {
    await fetchStats(currentUserId);
    await fetchOverviewData();
    addToast('Event created successfully.');
  }

  async function handleEventUpdated() {
    setEditingEvent(null);
    await fetchStats(currentUserId);
    await fetchOverviewData();
    addToast('Event updated successfully.');
  }

  async function handleAnnouncementCreated() {
    await fetchStats(currentUserId);
    await fetchOverviewData();
    addToast('Announcement created.');
  }

  // ── Approval actions ───────────────────────────────────────────────────────────
  async function handleApprove(item) {
    try {
      var result = await supabase.from(item.table).update({ approval_status: 'approved' }).eq('id', item.id);
      if (result.error) throw result.error;
      setPendingApprovals(function(prev) { return prev.filter(function(i) { return !(i.id === item.id && i.type === item.type); }); });
      setPendingApprovalsCount(function(prev) { return Math.max(0, prev - 1); });
      addToast(item.type + ' approved.');
    } catch (err) {
      addToast('Could not approve: ' + err.message, 'error');
    }
  }

  async function handleReject(item) {
    if (!window.confirm('Reject this ' + item.type.toLowerCase() + '? It will be marked as rejected.')) return;
    try {
      var result = await supabase.from(item.table).update({ approval_status: 'rejected' }).eq('id', item.id);
      if (result.error) throw result.error;
      setPendingApprovals(function(prev) { return prev.filter(function(i) { return !(i.id === item.id && i.type === item.type); }); });
      setPendingApprovalsCount(function(prev) { return Math.max(0, prev - 1); });
      addToast(item.type + ' rejected.');
    } catch (err) {
      addToast('Could not reject: ' + err.message, 'error');
    }
  }

  // ── Activity actions ───────────────────────────────────────────────────────────
  function handleMarkActivityRead(activityId) {
    setReadActivityIds(function(prev) { return new Set(Array.from(prev).concat([activityId])); });
  }
  function handleMarkAllActivityRead() {
    setReadActivityIds(new Set(recentActivity.map(function(a) { return a.id; })));
    addToast('All activity marked as read.');
  }
  function handleDismissAllActivity() {
    setRecentActivity([]);
    addToast('Activity feed cleared.');
  }

  // ── Inquiry actions ────────────────────────────────────────────────────────────
  async function handleMarkInquiryRead(inquiryId) {
    try {
      var result = await supabase.from('contact_inquiries').update({ is_read: true }).eq('id', inquiryId);
      if (result.error) throw result.error;
      setInquiries(function(prev) { return prev.map(function(i) { return i.id === inquiryId ? Object.assign({}, i, { is_read: true }) : i; }); });
      setUnreadInquiriesCount(function(prev) { return Math.max(0, prev - 1); });
      addToast('Message marked as read.');
    } catch (err) {
      addToast('Could not mark as read.', 'error');
    }
  }

  async function handleDeleteInquiry(inquiryId) {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      var result = await supabase.from('contact_inquiries').delete().eq('id', inquiryId);
      if (result.error) throw result.error;
      var deleted = inquiries.find(function(i) { return i.id === inquiryId; });
      setInquiries(function(prev) { return prev.filter(function(i) { return i.id !== inquiryId; }); });
      if (deleted && !deleted.is_read) setUnreadInquiriesCount(function(prev) { return Math.max(0, prev - 1); });
      addToast('Message deleted.');
    } catch (err) {
      addToast('Could not delete message.', 'error');
    }
  }

  // ── Photo actions ──────────────────────────────────────────────────────────────
  async function handlePhotoUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    var allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) { setPhotoError('Only JPG, PNG, GIF, and WebP images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5MB.'); return; }
    try {
      setPhotoUploading(true);
      setPhotoError(null);
      var ext = file.name.split('.').pop();
      var fileName = organizationId + '/' + Date.now() + '.' + ext;
      var uploadResult = await supabase.storage.from('organization-images').upload(fileName, file, { upsert: false });
      if (uploadResult.error) throw uploadResult.error;
      var urlData = supabase.storage.from('organization-images').getPublicUrl(fileName);
      var insertResult = await supabase.from('org_photos').insert({
        organization_id: organizationId,
        uploaded_by: currentUserId,
        photo_url: urlData.data.publicUrl,
        caption: photoCaption.trim() || null,
      });
      if (insertResult.error) throw insertResult.error;
      setPhotoCaption('');
      e.target.value = '';
      await fetchPhotos();
      addToast('Photo uploaded successfully.');
    } catch (err) {
      setPhotoError('Upload failed: ' + err.message);
      addToast('Photo upload failed.', 'error');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleDeletePhoto(photo) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    try {
      setDeletingPhotoId(photo.id);
      var urlParts = photo.photo_url.split('/organization-images/');
      if (urlParts.length === 2) {
        await supabase.storage.from('organization-images').remove([urlParts[1]]);
      }
      var result = await supabase.from('org_photos').delete().eq('id', photo.id);
      if (result.error) throw result.error;
      setPhotos(function(prev) { return prev.filter(function(p) { return p.id !== photo.id; }); });
      addToast('Photo deleted.');
    } catch (err) {
      addToast('Could not delete photo: ' + err.message, 'error');
    } finally {
      setDeletingPhotoId(null);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(function(i) { return <StatCardSkeleton key={i} />; })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Icon path={ICONS.building} className="h-16 w-16 text-gray-300" strokeWidth={1} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={function() { navigate('/organizations'); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  var totalActivityPages = Math.ceil(recentActivity.length / ACTIVITY_PER_PAGE);

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen" style={{ background: pageBg }}>
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* ── Org Header ── */}
            <div className="rounded-xl shadow-sm p-6 mb-6" style={{ background: sectionBg, border: '1px solid ' + borderColor }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.name + ' logo'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border-2 border-blue-200"
                      aria-hidden="true"
                    >
                      <span className="text-blue-600 font-extrabold text-xl">{(organization.name || 'O').charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold" style={{ color: textPrimary }}>{organization.name}</h1>
                    <p className="mt-1" style={{ color: textMuted }}>{organization.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                        {organization.type}
                      </span>
                      <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ' +
                        (membership.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600')}>
                        {membership.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  </div>
                </div>

                {membership && membership.role === 'admin' && (
                  <div className="flex items-center gap-3">
                    <span className={'text-sm font-semibold ' + (viewMode === 'admin' ? 'text-purple-600' : 'text-gray-400')}>Admin</span>
                    <button
                      onClick={function() { setViewMode(viewMode === 'admin' ? 'member' : 'admin'); }}
                      className={'relative inline-flex h-8 w-14 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ' +
                        (viewMode === 'member' ? 'bg-blue-500 focus:ring-blue-500' : 'bg-purple-500 focus:ring-purple-500')}
                      role="switch"
                      aria-checked={viewMode === 'admin'}
                      aria-label="Toggle between admin and member view"
                    >
                      <span className={'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ' +
                        (viewMode === 'admin' ? 'translate-x-1' : 'translate-x-7')} />
                    </button>
                    <span className={'text-sm font-semibold ' + (viewMode === 'member' ? 'text-blue-600' : 'text-gray-400')}>Member</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tabs + Tools ── */}
            <div className="rounded-xl shadow-sm mb-6" style={{ background: sectionBg, border: '1px solid ' + borderColor }}>

              {/* Tab nav */}
              <div style={{ borderBottom: '1px solid ' + borderColor }}>
                <nav
                  className="flex px-4 overflow-x-auto"
                  aria-label="Organization tabs"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: borderColor + ' transparent' }}
                >
                  {tabs.map(function(tab) {
                    var isActive = activeTab === tab.id;
                    var isCB = tab.id === 'community-board';
                    return (
                      <button
                        key={tab.id}
onClick={function() {
  if (tab.isLink) {
    if (tab.id === 'community-board') { navigate('/organizations/' + organizationId + '/community-board'); return; }
    if (tab.id === 'inbox') { navigate('/organizations/' + organizationId + '/inbox'); return; }
    if (tab.id === 'chat') { navigate('/organizations/' + organizationId + '/chat'); return; }
    return;
  }
  setActiveTab(tab.id);
}}
                        className={'flex-shrink-0 py-4 px-5 border-b-2 font-semibold text-sm transition-all relative inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ' +
                          (isActive
                            ? (isCB ? 'border-purple-500' : 'border-blue-500')
                            : 'border-transparent')}
                        style={{ color: isActive ? (isCB ? '#A78BFA' : '#3B82F6') : textMuted }}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {isCB && (
                          <span className="inline-block w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" aria-hidden="true" />
                        )}
                        {!isCB && <Icon path={ICONS[tab.iconKey]} className="h-4 w-4 flex-shrink-0" />}
                        <span className="whitespace-nowrap">{tab.label}</span>
                        {tab.badge > 0 && (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-yellow-500 rounded-full"
                            aria-label={tab.badge + ' pending'}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* ── Tools strip ── */}
              <div
                className="overflow-x-auto"
                style={{ background: toolsBg, borderBottom: '1px solid ' + toolsBorder, scrollbarWidth: 'thin' }}
              >
                <div className="flex items-center gap-2 px-5 py-2">
                  <span className="text-xs font-bold uppercase tracking-widest flex-shrink-0 mr-1" style={{ color: textMuted }}>Tools</span>
                  {[
                    { label: 'Create Event',    dot: '#3B82F6', hover: 'blue',   onClick: function() { setEditingEvent(null); setShowCreateEvent(true); }, adminOnly: false },
                    { label: 'Announcement',    dot: '#F97316', hover: 'orange', onClick: function() { setShowCreateAnnouncement(true); },             adminOnly: true  },
                    { label: 'Members',         dot: '#60A5FA', hover: 'blue',   onClick: function() { navigate('/organizations/' + organizationId + '/members'); }, adminOnly: false },
                    { label: 'Scheduling',      dot: '#14B8A6', hover: 'teal',   onClick: function() { navigate('/organizations/' + organizationId + '/scheduling'); }, adminOnly: false },
                    { label: 'Polls',           dot: '#3B82F6', hover: 'blue',   onClick: function() { navigate('/organizations/' + organizationId + '/polls'); }, adminOnly: false },
                    { label: 'Surveys',         dot: '#22C55E', hover: 'green',  onClick: function() { navigate('/organizations/' + organizationId + '/surveys'); }, adminOnly: false },
                    { label: 'Sign-Up Forms',   dot: '#6366F1', hover: 'indigo', onClick: function() { navigate('/organizations/' + organizationId + '/signup-forms'); }, adminOnly: false },
                    { label: 'Programs',        dot: '#8B5CF6', hover: 'purple', onClick: function() { navigate('/organizations/' + organizationId + '/programs'); }, adminOnly: false },
                    { label: 'Edit Public Page',dot: '#64748B', hover: 'gray',   onClick: function() { navigate('/organizations/' + organizationId + '/page-editor'); }, adminOnly: true  },
                  ].filter(function(t) { return !t.adminOnly || effectiveRole === 'admin'; }).map(function(t) {
                    return (
                      <button
                        key={t.label}
                        onClick={t.onClick}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ background: toolsBtnBg, border: '1px solid ' + toolsBtnBdr, color: toolsBtnTxt }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.dot }} aria-hidden="true" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Tab content ── */}
              <div className="p-6" style={{ color: textPrimary }}>

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        onClick={function() { navigate('/organizations/' + organizationId + '/members'); }}
                        className="bg-blue-50 rounded-xl p-5 border-2 border-blue-100 hover:border-blue-400 hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <p className="text-blue-600 text-xs font-bold uppercase tracking-widest">Members</p>
                        <p className="text-3xl font-extrabold text-blue-700 mt-1">{stats.totalMembers}</p>
                        <p className="text-xs text-blue-500 mt-1">View directory</p>
                      </button>

                      <button
                        onClick={function() { navigate('/organizations/' + organizationId + '/events'); }}
                        className="bg-green-50 rounded-xl p-5 border-2 border-green-100 hover:border-green-400 hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        <p className="text-green-600 text-xs font-bold uppercase tracking-widest">Upcoming Events</p>
                        <p className="text-3xl font-extrabold text-green-700 mt-1">{stats.activeEvents}</p>
                        <p className="text-xs text-green-500 mt-1">View calendar</p>
                      </button>

                      <button
                        onClick={function() { navigate('/organizations/' + organizationId + '/announcements'); }}
                        className="bg-orange-50 rounded-xl p-5 border-2 border-orange-100 hover:border-orange-400 hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        <p className="text-orange-600 text-xs font-bold uppercase tracking-widest">Unread News</p>
                        <p className="text-3xl font-extrabold text-orange-700 mt-1">{stats.unreadAnnouncements}</p>
                        <p className="text-xs text-orange-500 mt-1">{stats.unreadAnnouncements === 0 ? 'All caught up' : 'Read now'}</p>
                      </button>

                      {effectiveRole === 'admin' && (
                        <button
                          onClick={function() { setActiveTab('invite'); }}
                          className="bg-yellow-50 rounded-xl p-5 border-2 border-yellow-100 hover:border-yellow-400 hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        >
                          <p className="text-yellow-600 text-xs font-bold uppercase tracking-widest">Pending Invites</p>
                          <p className="text-3xl font-extrabold text-yellow-700 mt-1">{stats.pendingInvites}</p>
                          <p className="text-xs text-yellow-500 mt-1">{stats.pendingInvites === 0 ? 'All caught up' : 'Manage'}</p>
                        </button>
                      )}

                      {effectiveRole !== 'admin' && (
                        <button
                          onClick={function() { navigate('/organizations/' + organizationId + '/groups'); }}
                          className="bg-purple-50 rounded-xl p-5 border-2 border-purple-100 hover:border-purple-400 hover:shadow-md transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest">Groups</p>
                          <p className="text-3xl font-extrabold text-purple-700 mt-1">{stats.totalGroups}</p>
                          <p className="text-xs text-purple-500 mt-1">View all</p>
                        </button>
                      )}
                    </div>

                    {/* ── Bulletin board ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                      {/* Announcements column */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F5B731' }}>Announcements</h3>
                          <button onClick={function() { navigate('/organizations/' + organizationId + '/announcements'); }} className="text-xs font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1" style={{ color: '#3B82F6' }}>View all</button>
                        </div>
                        {overviewLoading ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', paddingTop: '12px', paddingLeft: '8px', paddingRight: '8px' }}>
                            <PostitSkeleton /><PostitSkeleton />
                          </div>
                        ) : overviewAnnouncements.length === 0 ? (
                          <div className="mt-4 text-center py-10 rounded-xl border border-dashed" style={{ background: isDark ? '#1A2035' : '#F9FAFB', borderColor: borderColor }}>
                            <Icon path={ICONS.megaphone} className="h-8 w-8 mx-auto mb-2" style={{ color: textMuted }} strokeWidth={1.5} />
                            <p className="text-sm font-semibold" style={{ color: textSecondary }}>No announcements yet</p>
                            <p className="text-xs mt-1" style={{ color: textMuted }}>Post an update for your members</p>
                            {effectiveRole === 'admin' && <button onClick={function() { setShowCreateAnnouncement(true); }} className="mt-3 text-xs font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" style={{ color: '#3B82F6' }}>Create announcement</button>}
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', paddingTop: '12px', paddingLeft: '8px', paddingRight: '8px' }}>
                            {overviewAnnouncements.map(function(ann) {
                              var c = ANN_COLORS[ann.priority] || ANN_COLORS.normal;
                              return (
                                <div key={ann.id} style={{ marginTop: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', height: '14px', marginBottom: '-3px' }} aria-hidden="true">
                                    <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.6) 0%, ' + c.pin + ' 52%, rgba(0,0,0,0.25) 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.35)' }} />
                                  </div>
                                  <button onClick={function() { navigate('/organizations/' + organizationId + '/announcements'); }} style={{ background: c.bg, borderRadius: '6px', padding: '14px', width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', aspectRatio: '1 / 1' }} className="hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label={'View announcement: ' + ann.title}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: c.bdgBg, color: c.bdgTxt }}>{ann.priority === 'urgent' ? 'Urgent' : ann.priority === 'low' ? 'Info' : 'Update'}</span>
                                        {ann.is_pinned && <span style={{ fontSize: '9px', fontWeight: 700, color: c.org }}>Pinned</span>}
                                      </div>
                                      <p style={{ fontSize: '12px', fontWeight: 800, color: c.txt, lineHeight: 1.3, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ann.title}</p>
                                      {ann.content && <p style={{ fontSize: '10px', color: c.txt, opacity: 0.75, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ann.content}</p>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: '10px', fontWeight: 600, color: c.org, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{organization.name}</span>
                                      <span style={{ fontSize: '10px', color: c.org, opacity: 0.7, flexShrink: 0 }}>{formatShortDate(ann.created_at)}</span>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Events column */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F5B731' }}>Upcoming Events</h3>
                          <button onClick={function() { navigate('/organizations/' + organizationId + '/events'); }} className="text-xs font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1" style={{ color: '#3B82F6' }}>View all</button>
                        </div>
                        {overviewLoading ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', paddingTop: '12px', paddingLeft: '8px', paddingRight: '8px' }}>
                            <PostitSkeleton /><PostitSkeleton />
                          </div>
                        ) : overviewEvents.length === 0 ? (
                          <div className="mt-4 text-center py-10 rounded-xl border border-dashed" style={{ background: isDark ? '#1A2035' : '#F9FAFB', borderColor: borderColor }}>
                            <Icon path={ICONS.calendar} className="h-8 w-8 mx-auto mb-2" style={{ color: textMuted }} strokeWidth={1.5} />
                            <p className="text-sm font-semibold" style={{ color: textSecondary }}>No upcoming events</p>
                            <p className="text-xs mt-1" style={{ color: textMuted }}>Schedule your next gathering</p>
                            <button onClick={function() { setEditingEvent(null); setShowCreateEvent(true); }} className="mt-3 text-xs font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" style={{ color: '#3B82F6' }}>Create event</button>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', paddingTop: '12px', paddingLeft: '8px', paddingRight: '8px' }}>
                            {overviewEvents.map(function(ev, i) {
                              var c = EVENT_PALETTE[i % EVENT_PALETTE.length];
                              var isRecurring = !!(ev.recurrence_rule || ev.parent_event_id);
                              var evTypeLbl = ev.event_type === 'virtual' ? 'Virtual' : ev.event_type === 'hybrid' ? 'Hybrid' : 'Event';
                              return (
                                <div key={ev.id} style={{ marginTop: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', height: '14px', marginBottom: '-3px' }} aria-hidden="true">
                                    <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.6) 0%, ' + c.pin + ' 52%, rgba(0,0,0,0.25) 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.35)' }} />
                                  </div>
                                  <div style={{ background: c.bg, borderRadius: '6px', padding: '14px', position: 'relative', aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div style={{ paddingRight: effectiveRole === 'admin' ? '22px' : '0' }}>
                                      {/* Badge row */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                        <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: c.bdgBg, color: c.bdgTxt }}>{evTypeLbl}</span>
                                        {isRecurring && (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 700, color: c.org }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '9px', height: '9px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Recurring
                                          </span>
                                        )}
                                      </div>
                                      {/* Title */}
                                      <p style={{ fontSize: '12px', fontWeight: 800, color: c.txt, lineHeight: 1.3, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.title}</p>
                                      {/* Rescheduled original date struck */}
                                      {ev.is_rescheduled && ev.original_start_time && <p style={{ fontSize: '10px', color: c.org, textDecoration: 'line-through', opacity: 0.6 }}>{formatWeekdayTime(ev.original_start_time)}</p>}
                                      {/* Date — full weekday for recurring, short for one-off */}
                                      <p style={{ fontSize: '10px', fontWeight: 700, color: c.org, marginTop: '3px', lineHeight: 1.3 }}>
                                        {ev.is_rescheduled && <span style={{ background: c.bdgBg, color: c.bdgTxt, fontSize: '8px', fontWeight: 700, padding: '1px 4px', borderRadius: '2px', marginRight: '4px', textTransform: 'uppercase' }}>New</span>}
                                        {isRecurring ? formatWeekdayTime(ev.start_time) : formatEventDate(ev.start_time)}
                                      </p>
                                      {/* Location */}
                                      {ev.location && <p style={{ fontSize: '10px', color: c.org, opacity: 0.8, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.location}</p>}
                                      {/* Description */}
                                      {ev.description && <p style={{ fontSize: '10px', color: c.txt, opacity: 0.75, marginTop: '4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</p>}
                                    </div>
                                    <div style={{ marginTop: '4px' }}>
                                      {/* Nothing needed at bottom — content fills the card */}
                                    </div>
                                    {effectiveRole === 'admin' && (
                                      <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                        <button onClick={function(e) { e.stopPropagation(); openEventMenu(ev.id); }} style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.org }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-black/20 transition-colors" aria-label={'Actions for ' + ev.title} aria-haspopup="true" aria-expanded={activeEventMenu === ev.id}>
                                          <Icon path={ICONS.dots} className="h-3 w-3" />
                                        </button>
                                        {activeEventMenu === ev.id && (
                                          <div style={{ position: 'absolute', right: '0', top: 'calc(100% + 4px)', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 30, minWidth: '152px', overflow: 'hidden' }} role="menu" aria-label={'Actions for ' + ev.title}>
                                            <button onClick={function() { handleEditEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none transition-colors" role="menuitem"><Icon path={ICONS.pencil} className="h-4 w-4 flex-shrink-0" />Edit Event</button>
                                            <button onClick={function() { handleRescheduleEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 focus:outline-none transition-colors" role="menuitem"><Icon path={ICONS.repeat} className="h-4 w-4 flex-shrink-0" />Reschedule</button>
                                            <div className="border-t border-gray-100" />
                                            <button onClick={function() { handleDeleteEvent(ev); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none transition-colors" role="menuitem"><Icon path={ICONS.trash} className="h-4 w-4 flex-shrink-0" />Delete</button>
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

                    {/* Recent Activity — Bulletin Board */}
                    <div className="rounded-xl p-6" style={{ background: cardBg, border: '1px solid ' + borderColor }}>
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h3 className="text-lg font-bold" style={{ color: textPrimary }}>Recent Activity</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {recentActivity.length > 0 && (
                            <>
                              <button onClick={handleMarkAllActivityRead} className="text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-1.5 transition-colors" style={{ color: '#3B82F6', border: '1px solid #3B82F6', background: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }}>Mark All Read</button>
                              <button onClick={handleDismissAllActivity} className="text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg px-3 py-1.5 transition-colors" style={{ color: textMuted, border: '1px solid ' + borderColor, background: 'transparent' }}>Clear</button>
                            </>
                          )}
                          <button onClick={fetchRecentActivity} className="text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg px-3 py-1.5 transition-colors" style={{ color: textMuted, border: '1px solid ' + borderColor, background: 'transparent' }}>Refresh</button>
                        </div>
                      </div>

                      {activityLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 pt-2">
                          {[1,2,3,4,5].map(function(i) {
                            return (
                              <div key={i} style={{ marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', height: '14px', marginBottom: '-3px' }}>
                                  <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: isDark ? '#2A3550' : '#E5E7EB' }} />
                                </div>
                                <div className="animate-pulse" style={{ background: isDark ? '#1E2845' : '#F3F4F6', borderRadius: '6px', padding: '14px', aspectRatio: '1/1' }}>
                                  <div style={{ height: '10px', width: '60%', background: isDark ? '#2A3550' : '#D1D5DB', borderRadius: '4px', marginBottom: '10px' }} />
                                  <div style={{ height: '13px', width: '90%', background: isDark ? '#2A3550' : '#D1D5DB', borderRadius: '4px', marginBottom: '6px' }} />
                                  <div style={{ height: '13px', width: '70%', background: isDark ? '#2A3550' : '#D1D5DB', borderRadius: '4px' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : recentActivity.length === 0 ? (
                        <div className="text-center py-10">
                          <Icon path={ICONS.clock} className="h-10 w-10 mx-auto mb-2" style={{ color: textMuted }} strokeWidth={1.5} />
                          <p className="text-sm font-semibold" style={{ color: textSecondary }}>No recent activity</p>
                          <p className="text-xs mt-1" style={{ color: textMuted }}>Events, announcements, and new members will appear here.</p>
                        </div>
                      ) : (
                        <div>
                          {/* Post-it grid */}
                          <div
                            className="grid gap-5 pt-2"
                            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
                            role="list"
                            aria-label="Recent activity"
                          >
                            {recentActivity
                              .slice((activityPage - 1) * ACTIVITY_PER_PAGE, activityPage * ACTIVITY_PER_PAGE)
                              .map(function(activity, idx) {
                                var isRead = readActivityIds.has(activity.id);

                                // Assign Post-it color by activity type
                                var noteColors = {
                                  event:        { bg: '#FFF9C4', pin: '#B8860B', bdgBg: '#F5B731', bdgTxt: '#3A2800', txt: '#1A1500', org: '#8A6F00' },
                                  announcement: { bg: '#FFF9C4', pin: '#B8860B', bdgBg: '#F5B731', bdgTxt: '#3A2800', txt: '#1A1500', org: '#8A6F00' },
                                  member:       { bg: '#FFF9C4', pin: '#B8860B', bdgBg: '#F5B731', bdgTxt: '#3A2800', txt: '#1A1500', org: '#8A6F00' },
                                };
                                var c = noteColors[activity.type] || noteColors.event;
                                var typeLabel = activity.type === 'event' ? 'Event' : activity.type === 'announcement' ? 'Update' : 'Member';

                                return (
                                  <div key={activity.id} role="listitem" style={{ marginTop: '12px', position: 'relative' }}>
                                    {/* Tack */}
                                    <div style={{ display: 'flex', justifyContent: 'center', height: '14px', marginBottom: '-3px' }} aria-hidden="true">
                                      <div style={{
                                        width: '13px', height: '13px', borderRadius: '50%',
                                        background: isRead
                                          ? (isDark ? '#2A3550' : '#D1D5DB')
                                          : 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.6) 0%, ' + c.pin + ' 52%, rgba(0,0,0,0.25) 100%)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
                                      }} />
                                    </div>
                                    {/* Card */}
                                    <div style={{
                                      background: isRead ? (isDark ? '#1A2035' : '#F3F4F6') : c.bg,
                                      borderRadius: '4px',
                                      padding: '14px',
                                      aspectRatio: '1 / 1',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      boxShadow: isRead ? 'none' : '0 2px 6px rgba(0,0,0,0.12)',
                                      opacity: isRead ? 0.55 : 1,
                                      position: 'relative',
                                    }}>
                                      {/* X delete button */}
                                      <button
                                        onClick={function(e) { e.stopPropagation(); handleMarkActivityRead(activity.id); setRecentActivity(function(prev) { return prev.filter(function(a) { return a.id !== activity.id; }); }); }}
                                        style={{
                                          position: 'absolute', top: '6px', right: '6px',
                                          width: '18px', height: '18px', borderRadius: '50%',
                                          background: 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: c.org, flexShrink: 0,
                                        }}
                                        className="focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 hover:bg-black/25 transition-colors"
                                        aria-label={'Dismiss: ' + activity.title}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>

                                      {/* Clickable area */}
                                      <button
                                        onClick={function() { if (activity.link) navigate(activity.link); handleMarkActivityRead(activity.id); }}
                                        className="focus:outline-none w-full text-left"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        aria-label={'View activity: ' + activity.title}
                                      >
                                        <span style={{
                                          display: 'inline-block', padding: '2px 6px', borderRadius: '3px',
                                          fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                                          marginBottom: '8px',
                                          background: isRead ? (isDark ? '#2A3550' : '#E5E7EB') : c.bdgBg,
                                          color: isRead ? (isDark ? '#64748B' : '#6B7280') : c.bdgTxt,
                                        }}>
                                          {typeLabel}
                                        </span>
                                        <p style={{
                                          fontSize: '12px', fontWeight: 700, lineHeight: 1.35,
                                          color: isRead ? (isDark ? '#4B5563' : '#9CA3AF') : c.txt,
                                          display: '-webkit-box',
                                          WebkitLineClamp: 3,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                        }}>
                                          {activity.title}
                                        </p>
                                      </button>

                                      {/* Timestamp */}
                                      <p style={{
                                        fontSize: '10px', fontWeight: 600, marginTop: '8px',
                                        color: isRead ? (isDark ? '#374151' : '#9CA3AF') : c.org,
                                      }}>
                                        {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          {/* Pagination */}
                          <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid ' + borderColor }}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={function() { setActivityPage(function(p) { return Math.max(1, p - 1); }); }}
                                disabled={activityPage === 1}
                                className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                style={{ border: '1px solid ' + borderColor, color: textMuted, background: 'transparent' }}
                                aria-label="Previous page"
                              >
                                <Icon path={ICONS.chevLeft} className="h-4 w-4" />
                              </button>
                              <span className="text-xs font-semibold min-w-12 text-center" style={{ color: textMuted }}>{activityPage} / {Math.max(1, totalActivityPages)}</span>
                              <button
                                onClick={function() { setActivityPage(function(p) { return Math.min(totalActivityPages, p + 1); }); }}
                                disabled={activityPage >= totalActivityPages}
                                className="p-1.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                style={{ border: '1px solid ' + borderColor, color: textMuted, background: 'transparent' }}
                                aria-label="Next page"
                              >
                                <Icon path={ICONS.chevRight} className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── DOCUMENTS TAB ── */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Document Library</h2>
                          <p className="text-gray-500 mt-1">Access organization documents, files, and resources</p>
                        </div>
                        {effectiveRole === 'admin' && (
                          <button
                            onClick={function() { navigate('/organizations/' + organizationId + '/documents'); }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold text-sm"
                          >
                            Manage Documents
                          </button>
                        )}
                      </div>
                      <div className="mt-6 text-center">
                        <button
                          onClick={function() { navigate('/organizations/' + organizationId + '/documents'); }}
                          className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          View All Documents
                          <Icon path={ICONS.chevRight} className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PHOTOS TAB ── */}
                {activeTab === 'photos' && (
                  <div>
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Photo Gallery</h2>
                        <p className="text-gray-500 mt-1">{photos.length + ' photo' + (photos.length !== 1 ? 's' : '')}</p>
                      </div>
                    </div>

                    {effectiveRole === 'admin' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                        <h3 className="text-base font-bold text-blue-900 mb-4">Upload Photo</h3>
                        {photoError && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">{photoError}</div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <label htmlFor="photo-caption" className="sr-only">Photo caption</label>
                            <input
                              id="photo-caption"
                              type="text"
                              placeholder="Caption (optional)"
                              value={photoCaption}
                              onChange={function(e) { setPhotoCaption(e.target.value); }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                              maxLength={200}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="photo-upload"
                              className={'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors focus-within:ring-2 focus-within:ring-blue-500 ' +
                                (photoUploading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600')}
                            >
                              {photoUploading ? 'Uploading...' : 'Upload Photo'}
                              <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoUpload} disabled={photoUploading} className="sr-only" aria-label="Choose a photo to upload" />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP · Max 5MB</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {photosLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1,2,3,4,5,6,7,8].map(function(i) { return <div key={i} className="rounded-xl bg-gray-200 animate-pulse h-40" />; })}
                      </div>
                    ) : photos.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <Icon path={ICONS.photo} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No photos yet</h3>
                        <p className="text-gray-500 text-sm">{effectiveRole === 'admin' ? 'Upload your first photo using the panel above.' : 'No photos have been uploaded yet.'}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-label="Photo gallery">
                        {photos.map(function(photo) {
                          return (
                            <div key={photo.id} role="listitem" className="relative group rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <button onClick={function() { setLightboxPhoto(photo); }} className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" aria-label={'View photo' + (photo.caption ? ': ' + photo.caption : '')}>
                                <img src={photo.photo_url} alt={photo.caption || 'Organization photo'} className="w-full h-40 object-cover" loading="lazy" />
                              </button>
                              {photo.caption && (
                                <div className="px-2 py-1.5 bg-white"><p className="text-xs text-gray-600 truncate">{photo.caption}</p></div>
                              )}
                              {effectiveRole === 'admin' && (
                                <button
                                  onClick={function() { handleDeletePhoto(photo); }}
                                  disabled={deletingPhotoId === photo.id}
                                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                  aria-label={'Delete photo' + (photo.caption ? ': ' + photo.caption : '')}
                                >
                                  <Icon path={ICONS.x} className="h-3.5 w-3.5" strokeWidth={2.5} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {lightboxPhoto && (
                      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={function() { setLightboxPhoto(null); }}>
                        <div className="relative max-w-4xl w-full" onClick={function(e) { e.stopPropagation(); }}>
                          <button onClick={function() { setLightboxPhoto(null); }} className="absolute -top-10 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded" aria-label="Close photo viewer">
                            <Icon path={ICONS.x} className="h-7 w-7" strokeWidth={2.5} />
                          </button>
                          <img src={lightboxPhoto.photo_url} alt={lightboxPhoto.caption || 'Organization photo'} className="w-full max-h-screen object-contain rounded-xl" />
                          {lightboxPhoto.caption && <p className="text-white text-center mt-3 text-sm">{lightboxPhoto.caption}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── APPROVALS TAB ── */}
                {activeTab === 'approvals' && (
                  <div>
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
                        <p className="text-gray-500 mt-1">Review and approve content submitted by editors.</p>
                      </div>
                      {pendingApprovals.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">{pendingApprovals.length} pending</span>
                      )}
                    </div>

                    {pendingApprovalsLoading ? (
                      <div className="space-y-3">
                        {[1,2,3].map(function(i) {
                          return (
                            <div key={i} className="rounded-xl border border-gray-200 p-5 animate-pulse">
                              <div className="flex justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                                </div>
                                <div className="flex gap-2">
                                  <div className="h-9 w-20 bg-gray-200 rounded-lg" />
                                  <div className="h-9 w-20 bg-gray-200 rounded-lg" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : pendingApprovals.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <Icon path={ICONS.check} className="h-12 w-12 text-green-400 mx-auto mb-3" strokeWidth={1.5} />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">All caught up!</h3>
                        <p className="text-gray-500 text-sm">No content waiting for approval.</p>
                      </div>
                    ) : (
                      <div className="space-y-3" role="list" aria-label="Pending approvals">
                        {pendingApprovals.map(function(item) {
                          return (
                            <div key={item.type + '-' + item.id} role="listitem" className="flex items-center justify-between gap-4 p-5 bg-white border border-yellow-200 rounded-xl hover:border-yellow-300 transition-colors">
                              <div className="flex-1 min-w-0">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 mb-2">{item.type}</span>
                                <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{'Submitted ' + new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={function() { handleApprove(item); }} className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors" aria-label={'Approve ' + item.title}>Approve</button>
                                <button onClick={function() { handleReject(item); }} className="px-4 py-2 bg-white text-red-600 border border-red-300 text-sm font-semibold rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors" aria-label={'Reject ' + item.title}>Reject</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── INBOX TAB ── */}
                {activeTab === 'inbox' && (
                  <div>
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
                        <p className="text-gray-500 mt-1">Messages submitted via the public Join Us form</p>
                      </div>
                      {inquiries.length > 0 && (
                        <span className="text-sm text-gray-500">{inquiries.filter(function(i) { return !i.is_read; }).length + ' unread · ' + inquiries.length + ' total'}</span>
                      )}
                    </div>

                    {inquiriesLoading ? (
                      <div className="space-y-4">
                        {[1,2,3].map(function(i) {
                          return (
                            <div key={i} className="rounded-xl border border-gray-200 p-5 animate-pulse">
                              <div className="flex justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                                  <div className="h-3 bg-gray-200 rounded w-full mt-3" />
                                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="h-8 w-24 bg-gray-200 rounded" />
                                  <div className="h-8 w-24 bg-gray-200 rounded" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : inquiries.length === 0 ? (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <Icon path={ICONS.inbox} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No messages yet</h3>
                        <p className="text-gray-500 text-sm">Messages submitted via your public page will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4" role="list" aria-label="Contact inquiries">
                        {inquiries.map(function(inquiry) {
                          return (
                            <div key={inquiry.id} role="listitem" className={'rounded-xl border p-5 transition-all ' + (inquiry.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200')}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-bold text-gray-900">{inquiry.name}</span>
                                    {!inquiry.is_read && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">New</span>}
                                    <span className="text-sm text-gray-400">{new Date(inquiry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                  <a href={'mailto:' + inquiry.email} className="text-blue-600 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{inquiry.email}</a>
                                  <p className="text-gray-700 mt-3 leading-relaxed text-sm">{inquiry.message}</p>
                                </div>
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  {!inquiry.is_read && (
                                    <button onClick={function() { handleMarkInquiryRead(inquiry.id); }} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors whitespace-nowrap font-semibold">Mark Read</button>
                                  )}
                                  <button onClick={function() { handleDeleteInquiry(inquiry.id); }} className="px-3 py-1.5 text-sm bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors whitespace-nowrap font-semibold">Delete</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── INVITE TAB ── */}
                {activeTab === 'invite' && (
                  <div>
                    {membership.role === 'admin' || (organization.settings && organization.settings.allowMemberInvites) ? (
                      <InviteMember organizationId={organizationId} organizationName={organization.name} onInviteSent={function() { fetchStats(currentUserId); }} />
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <Icon path={ICONS.mail} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">Permission Required</h3>
                        <p className="text-gray-500 text-sm">Member invitations are disabled. Contact an admin to enable this feature.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ANALYTICS TAB ── */}
                {activeTab === 'analytics' && <AnalyticsDashboard organizationId={organizationId} />}

                {/* ── SETTINGS TAB ── */}
                {activeTab === 'settings' && (
                  <div>
                    {membership.role === 'admin' ? (
                      <OrganizationSettings organizationId={organizationId} onUpdate={function(updatedData) { setOrganization(function(prev) { return Object.assign({}, prev, updatedData); }); }} />
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                        <Icon path={ICONS.settings} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">Admin Access Required</h3>
                        <p className="text-gray-500 text-sm">Only organization admins can modify settings.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Event action menu backdrop ── */}
      {activeEventMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={function() { setActiveEventMenu(null); }}
          aria-hidden="true"
        />
      )}

      {/* ── CreateEvent modal ── */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={function() { setShowCreateEvent(false); setEditingEvent(null); }}
        onSuccess={editingEvent ? handleEventUpdated : handleEventCreated}
        organizationId={organizationId}
        organizationName={organization ? organization.name : 'Your Organization'}
        editingEvent={editingEvent}
      />

      {/* ── CreateAnnouncement modal ── */}
      <CreateAnnouncement
        isOpen={showCreateAnnouncement}
        onClose={function() { setShowCreateAnnouncement(false); }}
        onSuccess={handleAnnouncementCreated}
        organizationId={organizationId}
        organizationName={organization ? organization.name : 'Your Organization'}
      />

      {/* ── Reschedule modal ── */}
      {showRescheduleModal && rescheduleEvent && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Icon path={ICONS.repeat} className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 id="reschedule-modal-title" className="text-lg font-bold text-gray-900">Reschedule Event</h3>
              </div>
              <button
                onClick={function() { setShowRescheduleModal(false); setRescheduleEvent(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Event name */}
              <p className="text-sm font-semibold text-gray-700 truncate">{rescheduleEvent.title}</p>

              {/* Current date */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Date</p>
                <p className="text-sm text-gray-700 line-through opacity-60">{formatEventDate(rescheduleEvent.start_time)}</p>
              </div>

              {/* New start time */}
              <div>
                <label htmlFor="reschedule-start" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  New Start Date &amp; Time <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="reschedule-start"
                  type="datetime-local"
                  value={rescheduleForm.start_time}
                  onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({}, f, { start_time: e.target.value }); }); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required="true"
                />
              </div>

              {/* New end time */}
              <div>
                <label htmlFor="reschedule-end" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  New End Date &amp; Time <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  id="reschedule-end"
                  type="datetime-local"
                  value={rescheduleForm.end_time}
                  onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({}, f, { end_time: e.target.value }); }); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* New location */}
              <div>
                <label htmlFor="reschedule-location" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  New Location <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  id="reschedule-location"
                  type="text"
                  value={rescheduleForm.location}
                  onChange={function(e) { setRescheduleForm(function(f) { return Object.assign({}, f, { location: e.target.value }); }); }}
                  placeholder={rescheduleEvent.location || 'Leave blank to keep current location'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {rescheduleEvent.location && (
                  <p className="text-xs text-gray-400 mt-1">Current: {rescheduleEvent.location}</p>
                )}
              </div>

              <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                The original date will be preserved and shown with a strikethrough wherever this event appears.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={function() { setShowRescheduleModal(false); setRescheduleEvent(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={rescheduleSaving || !rescheduleForm.start_time}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {rescheduleSaving ? 'Saving...' : 'Reschedule Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {showDeleteConfirm && deletingEvent && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-title"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Icon path={ICONS.trash} className="h-5 w-5 text-red-600" />
                </div>
                <h3 id="delete-event-title" className="text-lg font-bold text-gray-900">Delete Event</h3>
              </div>
              <button
                onClick={function() { setShowDeleteConfirm(false); setDeletingEvent(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                <Icon path={ICONS.warn} className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">Delete "{deletingEvent.title}"?</p>
                  <p className="text-xs text-red-600 mt-1">
                    {formatEventDate(deletingEvent.start_time)}
                  </p>
                  <p className="text-xs text-red-500 mt-2">This action cannot be undone.</p>
                </div>
              </div>

              {/* Recurring scope selector */}
              {(deletingEvent.recurrence_rule || deletingEvent.parent_event_id) && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">This is a recurring event. What would you like to delete?</p>
                  <div className="space-y-2" role="radiogroup" aria-label="Delete scope">
                    {[
                      { value: 'this',   label: 'This event only',            desc: 'Only this occurrence will be removed' },
                      { value: 'future', label: 'This and future events',     desc: 'This occurrence and all future ones' },
                      { value: 'all',    label: 'All events in the series',   desc: 'Every occurrence of this event' },
                    ].map(function(opt) {
                      return (
                        <label
                          key={opt.value}
                          className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' +
                            (deleteScope === opt.value ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300')}
                        >
                          <input
                            type="radio"
                            name="delete-scope"
                            value={opt.value}
                            checked={deleteScope === opt.value}
                            onChange={function(e) { setDeleteScope(e.target.value); }}
                            className="mt-0.5 accent-red-500 focus:ring-red-500"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={function() { setShowDeleteConfirm(false); setDeletingEvent(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Program modal ── */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="program-modal-title">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 id="program-modal-title" className="text-lg font-bold text-gray-900">{editingProgram ? 'Edit Program' : 'Add Program'}</h3>
              <button onClick={function() { setShowProgramModal(false); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300" aria-label="Close modal">
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="prog-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Program Name <span className="text-red-500" aria-hidden="true">*</span></label>
                <input id="prog-name" type="text" value={programForm.name} onChange={function(e) { setProgramForm(function(p) { return Object.assign({}, p, { name: e.target.value }); }); }} placeholder="e.g. After School Tutoring" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" aria-required="true" />
              </div>
              <div>
                <label htmlFor="prog-desc" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
                <textarea id="prog-desc" value={programForm.description} onChange={function(e) { setProgramForm(function(p) { return Object.assign({}, p, { description: e.target.value }); }); }} rows={3} placeholder="What does this program do?" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label htmlFor="prog-audience" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Who Is It For?</label>
                <input id="prog-audience" type="text" value={programForm.audience} onChange={function(e) { setProgramForm(function(p) { return Object.assign({}, p, { audience: e.target.value }); }); }} placeholder="e.g. Youth ages 6-18" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="prog-schedule" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Schedule</label>
                <input id="prog-schedule" type="text" value={programForm.schedule} onChange={function(e) { setProgramForm(function(p) { return Object.assign({}, p, { schedule: e.target.value }); }); }} placeholder="e.g. Every Monday 3-5pm" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prog-contact-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Contact Name</label>
                  <input id="prog-contact-name" type="text" value={programForm.contact_name} onChange={function(e) { setProgramForm(function(p) { return Object.assign({}, p, { contact_name: e.target.value }); }); }} placeholder="Jane Smith" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="prog-contact-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Contact Email</label>
                  <input id="prog-contact-email" type="email" value={programForm.contact_email} onChange={function(e) { setProgramForm(function(p) { return Object.assign({}, p, { contact_email: e.target.value }); }); }} placeholder="jane@org.org" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label htmlFor="prog-status" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Status</label>
                <select id="prog-status" value={programForm.status} onChange={function(e) { setProgramForm(function(p) { return Object.assign({}, p, { status: e.target.value }); }); }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={function() { setProgramForm(function(p) { return Object.assign({}, p, { is_public: !p.is_public }); }); }}
                  className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (programForm.is_public ? 'bg-blue-600' : 'bg-gray-200')}
                  role="switch" aria-checked={programForm.is_public} aria-label="Toggle public visibility"
                >
                  <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' + (programForm.is_public ? 'translate-x-6' : 'translate-x-1')} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Show on public website</p>
                  <p className="text-xs text-gray-400">Visitors to your page will see this program</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={function() { setShowProgramModal(false); }} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
              <button onClick={saveProgram} disabled={programSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {programSaving ? 'Saving...' : (editingProgram ? 'Save Changes' : 'Add Program')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notifications ── */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default OrganizationDashboard;