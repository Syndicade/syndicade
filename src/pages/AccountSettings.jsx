import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import {
  Download, AlertTriangle, UserCheck, Trash2, CheckCircle,
  Plus, X, Pencil, Building2, Camera, Bell, Mail, ChevronDown, ChevronUp, VolumeX,
} from 'lucide-react';

// ── Light theme tokens ────────────────────────────────────────────────────────
var BG    = '#F8FAFC';
var TEXT  = '#0E1523';
var MUTED = '#64748B';

var NAV_ITEMS = [
  { id: 'profile',       label: 'Profile'       },
  { id: 'account',       label: 'Account'       },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy',       label: 'Privacy'       },
  { id: 'danger',        label: 'Danger Zone'   },
];

var inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';
var labelCls = 'block text-sm font-medium text-slate-700 mb-1';

// ── Notification type definitions ─────────────────────────────────────────────
var MEMBER_NOTIF_TYPES = [
  { key: 'new_event',        label: 'New event posted',         desc: 'When a new event is added to your org' },
  { key: 'new_announcement', label: 'New announcement',         desc: 'When a new announcement is posted' },
  { key: 'event_reminder',   label: 'Event reminder',           desc: '24 hours before an event you have RSVPd to' },
  { key: 'board_reply',      label: 'Community Board reply',    desc: 'When someone replies to your post' },
  { key: 'new_poll',         label: 'New poll',                 desc: 'When a new poll is created in your org' },
  { key: 'new_survey',       label: 'New survey',               desc: 'When a new survey is created in your org' },
  { key: 'new_signup_form',  label: 'New sign-up form',         desc: 'When a new sign-up form is created' },
  { key: 'new_program',      label: 'New program added',        desc: 'When a new program is listed in your org' },
  { key: 'new_document',     label: 'New document uploaded',    desc: 'When a file is added to your org library' },
  { key: 'new_photo',        label: 'New photo added',          desc: 'When a new photo is added to the gallery' },
];

var ADMIN_NOTIF_TYPES = [
  { key: 'member_joined', label: 'Member joined',           desc: 'When someone joins your org' },
  { key: 'event_rsvp',    label: 'Member RSVPd to event',   desc: 'When a member RSVPs to one of your events' },
  { key: 'inbox_message', label: 'New inbox message',       desc: 'When you receive an inquiry or collaboration request' },
];

function buildDefaultPrefs() {
  var prefs = {};
  MEMBER_NOTIF_TYPES.concat(ADMIN_NOTIF_TYPES).forEach(function(t) {
    prefs[t.key] = { bell: true, email: true };
  });
  return prefs;
}

// ── Reusable Toggle ───────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, desc, id }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 cursor-pointer select-none">{label}</label>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        id={id} role="switch" aria-checked={checked} onClick={onChange}
        className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ' + (checked ? 'bg-blue-600' : 'bg-slate-200')}
        aria-label={label}
      >
        <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' + (checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}

function SectionCard({ id, title, subtitle, children, danger }) {
  return (
    <section className={'bg-white rounded-xl border p-6 ' + (danger ? 'border-red-200' : 'border-slate-200')} aria-labelledby={id + '-heading'}>
      <h2 id={id + '-heading'} className={'text-base font-semibold mb-1 ' + (danger ? 'text-red-700' : 'text-slate-900')}>{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mb-5">{subtitle}</p>}
      {children}
    </section>
  );
}

// ── Notification grid row (Bell + Email toggles) ───────────────────────────────
function NotifRow({ typeKey, label, desc, prefs, onChange, idPrefix }) {
  var bell  = (prefs[typeKey] && prefs[typeKey].bell  !== undefined) ? prefs[typeKey].bell  : true;
  var email = (prefs[typeKey] && prefs[typeKey].email !== undefined) ? prefs[typeKey].email : true;
  return (
    <div className="grid grid-cols-[1fr_56px_56px] items-center gap-2 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {/* Bell toggle */}
      <div className="flex justify-center">
        <button
          role="switch" aria-checked={bell}
          aria-label={label + ' — bell notification'}
          onClick={function() { onChange(typeKey, 'bell', !bell); }}
          className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (bell ? 'bg-blue-600' : 'bg-slate-200')}
        >
          <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' + (bell ? 'translate-x-6' : 'translate-x-1')} />
        </button>
      </div>
      {/* Email toggle */}
      <div className="flex justify-center">
        <button
          role="switch" aria-checked={email}
          aria-label={label + ' — email notification'}
          onClick={function() { onChange(typeKey, 'email', !email); }}
          className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (email ? 'bg-blue-600' : 'bg-slate-200')}
        >
          <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' + (email ? 'translate-x-6' : 'translate-x-1')} />
        </button>
      </div>
    </div>
  );
}

// ── Column header for the notif grid ──────────────────────────────────────────
function NotifGridHeader() {
  return (
    <div className="grid grid-cols-[1fr_56px_56px] gap-2 pb-2 border-b border-slate-200 mb-1" aria-hidden="true">
      <div />
      <div className="flex flex-col items-center gap-1">
        <Bell size={13} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bell</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Mail size={13} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8" aria-busy="true">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="h-7 w-52 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-6">
          <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
            {[1,2,3,4,5].map(function(i) {
              return <div key={i} className="px-4 py-3 border-b border-slate-100"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></div>;
            })}
          </div>
          <div className="flex-1 space-y-4">
            {[1,2,3].map(function(i) {
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 animate-pulse">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-10 bg-slate-100 rounded-lg" />
                  <div className="h-10 bg-slate-100 rounded-lg" />
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function AccountSettings() {
  var navigate     = useNavigate();
  var fileInputRef = useRef(null);
  var [activeSection, setActiveSection] = useState('profile');

  var [loading, setLoading]               = useState(true);
  var [saving, setSaving]                 = useState(false);
  var [uploadingPhoto, setUploadingPhoto] = useState(false);
  var [currentUser, setCurrentUser]       = useState(null);
  var [organizations, setOrganizations]   = useState([]);

  // ── Profile form ──
  var [profile, setProfile] = useState({
    first_name: '', last_name: '', display_name: '', pronouns: '', bio: '', birthday: '',
    phone: '', address_line1: '', address_line2: '', city: '', state: '', zip: '',
    website: '', linkedin: '', instagram: '', facebook: '', twitter: '',
    avatar_url: '',
  });

  // ── Interests ──
  var [interests, setInterests]         = useState([]);
  var [interestInput, setInterestInput] = useState('');

  // ── Affiliations ──
  var [affiliations, setAffiliations]   = useState([]);
  var [affForm, setAffForm]             = useState({ org_name: '', role_title: '', joined_year: '' });
  var [editingAffId, setEditingAffId]   = useState(null);
  var [editAffForm, setEditAffForm]     = useState({ org_name: '', role_title: '', joined_year: '' });
  var [savingAff, setSavingAff]         = useState(false);

  // ── Account tab ──
  var [emailForm, setEmailForm]               = useState('');
  var [savingEmail, setSavingEmail]           = useState(false);
  var [passwordForm, setPasswordForm]         = useState({ newPassword: '', confirmPassword: '' });
  var [changingPassword, setChangingPassword] = useState(false);

  // ── Notifications ──
  // globalNotifPrefs: { [typeKey]: { bell: bool, email: bool } }
  var [globalNotifPrefs, setGlobalNotifPrefs] = useState(buildDefaultPrefs());
  // orgNotifPrefs: { [orgId]: { muted: bool, overrides: { [typeKey]: { bell, email } } } }
  var [orgNotifPrefs, setOrgNotifPrefs]       = useState({});
  var [expandedOrgs, setExpandedOrgs]         = useState({});
  var [savingNotif, setSavingNotif]           = useState(false);
  var [savingOrgNotif, setSavingOrgNotif]     = useState(null); // orgId currently saving

  // ── Privacy tab ──
  var [privacySettings, setPrivacySettings] = useState({});
  var [affVisibility, setAffVisibility]     = useState({});
  var [globalPrivacy, setGlobalPrivacy]     = useState({
    show_phone: false, show_address: false, show_social: true,
    show_birthday: false, share_with_groups: false,
  });
  var [savingPrivacy, setSavingPrivacy]       = useState(false);
  var [downloadingData, setDownloadingData]   = useState(false);

  // ── Danger Zone ──
  var [adminOrgs, setAdminOrgs]                     = useState([]);
  var [showDeleteConfirm, setShowDeleteConfirm]     = useState(false);
  var [deleteConfirmText, setDeleteConfirmText]     = useState('');
  var [deleting, setDeleting]                       = useState(false);
  var [adminOrgResolutions, setAdminOrgResolutions] = useState({});
  var [resolvingOrg, setResolvingOrg]               = useState(null);

  useEffect(function() { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      var authRes = await supabase.auth.getUser();
      if (authRes.error || !authRes.data.user) { navigate('/login'); return; }
      var user = authRes.data.user;
      setCurrentUser(user);
      setEmailForm(user.email || '');

      var [memberRes, membershipsRes, affRes] = await Promise.all([
        supabase.from('members').select('*').eq('user_id', user.id).single(),
        supabase.from('memberships').select('role, organization_id, show_affiliations, organizations(id, name)').eq('member_id', user.id).eq('status', 'active'),
        supabase.from('member_affiliations').select('id, org_name, role_title, joined_year').eq('user_id', user.id).order('created_at'),
      ]);

      var m = memberRes.data;
      if (m) {
        setProfile({
          first_name:    m.first_name    || '',
          last_name:     m.last_name     || '',
          display_name:  m.display_name  || '',
          pronouns:      m.pronouns      || '',
          bio:           m.bio           || '',
          birthday:      m.birthday      || '',
          phone:         m.phone         || '',
          address_line1: m.address_line1 || '',
          address_line2: m.address_line2 || '',
          city:          m.city          || '',
          state:         m.state         || '',
          zip:           m.zip           || '',
          website:       m.website       || '',
          linkedin:      m.linkedin      || '',
          instagram:     m.instagram     || '',
          facebook:      m.facebook      || '',
          twitter:       m.twitter       || '',
          avatar_url:    m.avatar_url    || m.profile_photo_url || '',
        });
        setInterests(m.interests || []);
        if (m.privacy_settings) setGlobalPrivacy(Object.assign({}, globalPrivacy, m.privacy_settings));

        // Load global notification prefs — merge saved over defaults
        if (m.notification_prefs && typeof m.notification_prefs === 'object') {
          setGlobalNotifPrefs(Object.assign({}, buildDefaultPrefs(), m.notification_prefs));
        }
      }

      setAffiliations(affRes.data || []);

      var orgs = ((membershipsRes.data) || []).map(function(ms) {
        return { id: ms.organizations.id, name: ms.organizations.name, role: ms.role, show_affiliations: ms.show_affiliations || false };
      });
      setOrganizations(orgs);

      var adminOrgList = orgs.filter(function(o) { return o.role === 'admin'; });
      setAdminOrgs(adminOrgList);
      var resolutions = {};
      adminOrgList.forEach(function(org) {
        resolutions[org.id] = { action: null, transferTo: '', resolved: false, members: [], loadingMembers: false, confirmingDelete: false };
      });
      setAdminOrgResolutions(resolutions);

      var affVisMap = {};
      orgs.forEach(function(org) { affVisMap[org.id] = org.show_affiliations; });
      setAffVisibility(affVisMap);

      var orgIds = orgs.map(function(o) { return o.id; });
      if (orgIds.length > 0) {
        var [privacyRes, orgNotifRes] = await Promise.all([
          supabase.from('member_privacy').select('*').eq('user_id', user.id).in('organization_id', orgIds),
          supabase.from('member_notification_prefs').select('*').eq('user_id', user.id).in('org_id', orgIds),
        ]);

        var privacyMap = {};
        orgs.forEach(function(org) {
          var existing = ((privacyRes.data) || []).find(function(p) { return p.organization_id === org.id; });
          privacyMap[org.id] = {
            show_email:    existing ? existing.show_email    : false,
            show_bio:      existing ? existing.show_bio      : true,
            show_pronouns: existing ? (existing.show_pronouns || false) : false,
          };
        });
        setPrivacySettings(privacyMap);

        // Build orgNotifPrefs map
        var notifMap = {};
        orgs.forEach(function(org) {
          var existing = ((orgNotifRes.data) || []).find(function(p) { return p.org_id === org.id; });
          notifMap[org.id] = {
            muted:     existing ? existing.muted     : false,
            overrides: existing ? (existing.overrides || {}) : {},
          };
        });
        setOrgNotifPrefs(notifMap);
      }
    } catch (err) {
      mascotErrorToast('Failed to load profile.', err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateProfile(field, value) {
    setProfile(function(prev) {
      var next = {};
      Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      next[field] = value;
      return next;
    });
  }

  // ── Photo ─────────────────────────────────────────────────────────────────
  function handlePhotoClick() { if (fileInputRef.current) fileInputRef.current.click(); }

  async function handlePhotoChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
    try {
      setUploadingPhoto(true);
      var authRes  = await supabase.auth.getUser();
      var user     = authRes.data.user;
      var ext      = file.name.split('.').pop();
      var filePath = user.id + '/avatar.' + ext;
      var uploadRes = await supabase.storage.from('member-avatars').upload(filePath, file, { upsert: true });
      if (uploadRes.error) throw uploadRes.error;
      var publicUrl = supabase.storage.from('member-avatars').getPublicUrl(filePath).data.publicUrl + '?t=' + Date.now();
      await supabase.from('members').upsert({ user_id: user.id, avatar_url: publicUrl }, { onConflict: 'user_id' });
      updateProfile('avatar_url', publicUrl);
      mascotSuccessToast('Photo updated!');
    } catch (err) {
      mascotErrorToast('Failed to upload photo.', err.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleDeletePhoto() {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      var authRes = await supabase.auth.getUser();
      await supabase.from('members').upsert({ user_id: authRes.data.user.id, avatar_url: null }, { onConflict: 'user_id' });
      updateProfile('avatar_url', '');
      mascotSuccessToast('Photo removed.');
    } catch (err) {
      mascotErrorToast('Failed to remove photo.', err.message);
    }
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  async function handleSaveProfile(e) {
    if (e) e.preventDefault();
    if (!profile.first_name.trim()) { toast.error('First name is required.'); return; }
    if (!profile.last_name.trim())  { toast.error('Last name is required.'); return; }
    try {
      setSaving(true);
      var authRes = await supabase.auth.getUser();
      var user    = authRes.data.user;
      await supabase.auth.updateUser({ data: { full_name: (profile.first_name + ' ' + profile.last_name).trim() } });
      var res = await supabase.from('members').upsert({
        user_id:       user.id,
        first_name:    profile.first_name.trim(),
        last_name:     profile.last_name.trim(),
        display_name:  profile.display_name.trim()  || null,
        pronouns:      profile.pronouns.trim()      || null,
        bio:           profile.bio.trim()            || null,
        birthday:      profile.birthday             || null,
        phone:         profile.phone.trim()          || null,
        address_line1: profile.address_line1.trim() || null,
        address_line2: profile.address_line2.trim() || null,
        city:          profile.city.trim()           || null,
        state:         profile.state.trim()          || null,
        zip:           profile.zip.trim()            || null,
        website:       profile.website.trim()        || null,
        linkedin:      profile.linkedin.trim()       || null,
        instagram:     profile.instagram.trim()      || null,
        facebook:      profile.facebook.trim()       || null,
        twitter:       profile.twitter.trim()        || null,
        interests:     interests,
      }, { onConflict: 'user_id' });
      if (res.error) throw res.error;
      mascotSuccessToast('Profile saved!');
    } catch (err) {
      mascotErrorToast('Failed to save profile.', err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Interests ─────────────────────────────────────────────────────────────
  function handleAddInterest() {
    var val = interestInput.trim();
    if (!val || interests.includes(val)) { setInterestInput(''); return; }
    setInterests(interests.concat([val]));
    setInterestInput('');
  }

  // ── Affiliations ──────────────────────────────────────────────────────────
  async function handleAddAffiliation(e) {
    e.preventDefault();
    if (!affForm.org_name.trim()) { toast.error('Organization name is required.'); return; }
    setSavingAff(true);
    try {
      var authRes = await supabase.auth.getUser();
      var res = await supabase.from('member_affiliations').insert({
        user_id:     authRes.data.user.id,
        org_name:    affForm.org_name.trim(),
        role_title:  affForm.role_title.trim() || null,
        joined_year: affForm.joined_year ? parseInt(affForm.joined_year, 10) : null,
      }).select().single();
      if (res.error) throw res.error;
      setAffiliations(affiliations.concat([res.data]));
      setAffForm({ org_name: '', role_title: '', joined_year: '' });
      mascotSuccessToast('Affiliation added!');
    } catch (err) {
      mascotErrorToast('Failed to add affiliation.', err.message);
    } finally {
      setSavingAff(false);
    }
  }

  async function handleSaveEditAff(id) {
    if (!editAffForm.org_name.trim()) { toast.error('Organization name is required.'); return; }
    setSavingAff(true);
    try {
      var res = await supabase.from('member_affiliations').update({
        org_name:    editAffForm.org_name.trim(),
        role_title:  editAffForm.role_title.trim() || null,
        joined_year: editAffForm.joined_year ? parseInt(editAffForm.joined_year, 10) : null,
      }).eq('id', id).select().single();
      if (res.error) throw res.error;
      setAffiliations(affiliations.map(function(a) { return a.id === id ? res.data : a; }));
      setEditingAffId(null);
      mascotSuccessToast('Updated!');
    } catch (err) {
      mascotErrorToast('Failed to update.', err.message);
    } finally {
      setSavingAff(false);
    }
  }

  async function handleDeleteAff(id) {
    if (!window.confirm('Remove this affiliation?')) return;
    var res = await supabase.from('member_affiliations').delete().eq('id', id);
    if (res.error) { mascotErrorToast('Failed to remove.', res.error.message); return; }
    setAffiliations(affiliations.filter(function(a) { return a.id !== id; }));
    mascotSuccessToast('Removed.');
  }

  // ── Account: email + password ─────────────────────────────────────────────
  async function handleSaveEmail(e) {
    e.preventDefault();
    if (emailForm === (currentUser && currentUser.email)) { toast.error('That is already your email.'); return; }
    try {
      setSavingEmail(true);
      var res = await supabase.auth.updateUser({ email: emailForm });
      if (res.error) throw res.error;
      mascotSuccessToast('Confirmation sent!', 'Check ' + emailForm + ' to confirm the change.');
    } catch (err) {
      mascotErrorToast('Failed to update email.', err.message);
    } finally {
      setSavingEmail(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (passwordForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    try {
      setChangingPassword(true);
      var res = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (res.error) throw res.error;
      mascotSuccessToast('Password updated!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      mascotErrorToast('Failed to update password.', err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  // ── Notifications: global prefs ───────────────────────────────────────────
  function handleGlobalNotifChange(typeKey, channel, value) {
    setGlobalNotifPrefs(function(prev) {
      var next = Object.assign({}, prev);
      next[typeKey] = Object.assign({}, prev[typeKey] || { bell: true, email: true });
      next[typeKey][channel] = value;
      return next;
    });
  }

  async function handleSaveGlobalNotifPrefs() {
    try {
      setSavingNotif(true);
      var authRes = await supabase.auth.getUser();
      var res = await supabase.from('members').upsert(
        { user_id: authRes.data.user.id, notification_prefs: globalNotifPrefs },
        { onConflict: 'user_id' }
      );
      if (res.error) throw res.error;
      mascotSuccessToast('Notification preferences saved!');
    } catch (err) {
      mascotErrorToast('Failed to save notification preferences.', err.message);
    } finally {
      setSavingNotif(false);
    }
  }

  // ── Notifications: per-org prefs ──────────────────────────────────────────
  function handleOrgNotifChange(orgId, typeKey, channel, value) {
    setOrgNotifPrefs(function(prev) {
      var orgEntry = Object.assign({}, prev[orgId] || { muted: false, overrides: {} });
      var overrides = Object.assign({}, orgEntry.overrides);
      overrides[typeKey] = Object.assign({}, overrides[typeKey] || { bell: true, email: true });
      overrides[typeKey][channel] = value;
      orgEntry.overrides = overrides;
      var next = Object.assign({}, prev);
      next[orgId] = orgEntry;
      return next;
    });
  }

  function handleOrgMuteToggle(orgId) {
    setOrgNotifPrefs(function(prev) {
      var orgEntry = Object.assign({}, prev[orgId] || { muted: false, overrides: {} });
      orgEntry.muted = !orgEntry.muted;
      var next = Object.assign({}, prev);
      next[orgId] = orgEntry;
      return next;
    });
  }

  async function handleSaveOrgNotifPrefs(orgId) {
    try {
      setSavingOrgNotif(orgId);
      var authRes  = await supabase.auth.getUser();
      var orgEntry = orgNotifPrefs[orgId] || { muted: false, overrides: {} };
      var res = await supabase.from('member_notification_prefs').upsert(
        {
          user_id:   authRes.data.user.id,
          org_id:    orgId,
          muted:     orgEntry.muted,
          overrides: orgEntry.overrides,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,org_id' }
      );
      if (res.error) throw res.error;
      mascotSuccessToast('Org notification settings saved!');
    } catch (err) {
      mascotErrorToast('Failed to save org notification settings.', err.message);
    } finally {
      setSavingOrgNotif(null);
    }
  }

  function toggleOrgExpanded(orgId) {
    setExpandedOrgs(function(prev) {
      var next = Object.assign({}, prev);
      next[orgId] = !prev[orgId];
      return next;
    });
  }

  // ── Privacy ───────────────────────────────────────────────────────────────
  async function handleSavePrivacy() {
    try {
      setSavingPrivacy(true);
      var authRes = await supabase.auth.getUser();
      var user    = authRes.data.user;

      var memberRes = await supabase.from('members').upsert({ user_id: user.id, privacy_settings: globalPrivacy }, { onConflict: 'user_id' });
      if (memberRes.error) throw memberRes.error;

      var upserts = Object.keys(privacySettings).map(function(orgId) {
        return { user_id: user.id, organization_id: orgId, show_email: privacySettings[orgId].show_email, show_bio: privacySettings[orgId].show_bio, show_pronouns: privacySettings[orgId].show_pronouns || false };
      });
      if (upserts.length > 0) {
        var privRes = await supabase.from('member_privacy').upsert(upserts, { onConflict: 'user_id,organization_id' });
        if (privRes.error) throw privRes.error;
      }

      var affUpdates = Object.keys(affVisibility).map(function(orgId) {
        return supabase.from('memberships').update({ show_affiliations: affVisibility[orgId] }).eq('organization_id', orgId).eq('member_id', user.id);
      });
      await Promise.all(affUpdates);

      mascotSuccessToast('Privacy settings saved!');
    } catch (err) {
      mascotErrorToast('Failed to save privacy settings.', err.message);
    } finally {
      setSavingPrivacy(false);
    }
  }

  // ── Download data ─────────────────────────────────────────────────────────
  async function handleDownloadData() {
    var loadingId = null;
    try {
      setDownloadingData(true);
      loadingId = toast.loading('Preparing your data...');
      var authRes = await supabase.auth.getUser();
      var user    = authRes.data.user;
      var results = await Promise.allSettled([
        supabase.from('members').select('*').eq('user_id', user.id).single(),
        supabase.from('memberships').select('*, organizations(name)').eq('member_id', user.id),
        supabase.from('member_affiliations').select('*').eq('user_id', user.id),
        supabase.from('attendance_records').select('*').eq('member_id', user.id),
        supabase.from('poll_votes').select('*').eq('user_id', user.id),
        supabase.from('survey_responses').select('*').eq('member_id', user.id),
        supabase.from('ticket_purchases').select('*').eq('member_id', user.id),
        supabase.from('notifications').select('*').eq('user_id', user.id),
      ]);
      function getValue(r) { return (r.status === 'fulfilled' && r.value.data) ? r.value.data : null; }
      var p = getValue(results[0]);
      var exportData = {
        exported_at: new Date().toISOString(), profile: p,
        memberships: getValue(results[1]) || [], affiliations: getValue(results[2]) || [],
        attendance: getValue(results[3]) || [], poll_votes: getValue(results[4]) || [],
        survey_responses: getValue(results[5]) || [], ticket_purchases: getValue(results[6]) || [],
        notifications: getValue(results[7]) || [],
      };
      var fn   = 'syndicade-data-' + (p && p.first_name ? p.first_name.toLowerCase() : 'user') + '-' + new Date().toISOString().split('T')[0] + '.json';
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a'); a.href = url; a.download = fn;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.dismiss(loadingId);
      mascotSuccessToast('Data exported!', 'Your file is downloading.');
    } catch (err) {
      if (loadingId) toast.dismiss(loadingId);
      mascotErrorToast('Export failed.', 'Please try again or contact support.');
    } finally {
      setDownloadingData(false);
    }
  }

  // ── Danger Zone ───────────────────────────────────────────────────────────
  function setOrgResolution(orgId, patch) {
    setAdminOrgResolutions(function(prev) {
      var next  = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      var entry = {}; Object.keys(prev[orgId]).forEach(function(k) { entry[k] = prev[orgId][k]; });
      Object.keys(patch).forEach(function(k) { entry[k] = patch[k]; });
      next[orgId] = entry; return next;
    });
  }

  async function handleOrgAction(orgId, action) {
    setOrgResolution(orgId, { action: action, transferTo: '', confirmingDelete: false });
    if (action === 'transfer') {
      setOrgResolution(orgId, { action: 'transfer', loadingMembers: true });
      try {
        var res = await supabase.from('memberships').select('member_id, role, members(first_name, last_name)').eq('organization_id', orgId).eq('status', 'active').neq('member_id', currentUser.id);
        setOrgResolution(orgId, { members: res.data || [], loadingMembers: false });
      } catch (err) {
        setOrgResolution(orgId, { loadingMembers: false });
        toast.error('Failed to load members.');
      }
    }
  }

  async function handleTransferAdmin(orgId) {
    var res = adminOrgResolutions[orgId];
    if (!res.transferTo) { toast.error('Please select a member.'); return; }
    try {
      setResolvingOrg(orgId);
      var r = await supabase.from('memberships').update({ role: 'admin' }).eq('organization_id', orgId).eq('member_id', res.transferTo);
      if (r.error) throw r.error;
      await supabase.from('memberships').update({ role: 'member' }).eq('organization_id', orgId).eq('member_id', currentUser.id);
      setOrgResolution(orgId, { resolved: true });
      mascotSuccessToast('Admin transferred!');
    } catch (err) {
      mascotErrorToast('Transfer failed.', err.message);
    } finally {
      setResolvingOrg(null);
    }
  }

  async function handleDeleteOrg(orgId, orgName) {
    try {
      setResolvingOrg(orgId);
      var r = await supabase.from('organizations').delete().eq('id', orgId);
      if (r.error) throw r.error;
      setOrgResolution(orgId, { resolved: true });
      mascotSuccessToast(orgName + ' deleted.');
    } catch (err) {
      mascotErrorToast('Failed to delete.', err.message);
    } finally {
      setResolvingOrg(null);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') { toast.error('Please type DELETE to confirm.'); return; }
    try {
      setDeleting(true);
      var authRes = await supabase.auth.getUser();
      var user    = authRes.data.user;
      await supabase.from('memberships').delete().eq('member_id', user.id);
      await supabase.from('members').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      mascotErrorToast('Failed to delete account.', 'Please contact support.');
    } finally {
      setDeleting(false);
    }
  }

  var allAdminOrgsResolved = adminOrgs.length === 0 || Object.values(adminOrgResolutions).every(function(r) { return r.resolved; });

  var initials = ((profile.first_name.charAt(0) || '') + (profile.last_name.charAt(0) || '')).toUpperCase()
    || (currentUser && currentUser.email ? currentUser.email.charAt(0).toUpperCase() : '?');

  var displayName = (profile.first_name + ' ' + profile.last_name).trim()
    || (currentUser && currentUser.email && currentUser.email.split('@')[0]) || '';

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <button onClick={function() { navigate('/dashboard'); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mb-3" aria-label="Back to dashboard">
            <span aria-hidden="true">←</span> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Account Settings</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your profile, privacy, and account preferences</p>
        </div>

        <div className="flex gap-6 items-start">

          {/* SIDEBAR */}
          <aside className="w-56 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-24" aria-label="Settings navigation">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Your profile photo" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">{initials}</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser && currentUser.email}</p>
                </div>
              </div>
            </div>
            <nav aria-label="Account settings sections">
              {NAV_ITEMS.map(function(item) {
                var isActive = activeSection === item.id;
                return (
                  <button key={item.id} onClick={function() { setActiveSection(item.id); }}
                    className={'w-full text-left px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 border-l-2 ' + (isActive ? 'text-blue-600 bg-blue-50 border-l-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-transparent') + (item.id === 'danger' && !isActive ? ' text-red-500' : '')}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* CONTENT */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── PROFILE ── */}
            {activeSection === 'profile' && (
              <>
                {/* Photo */}
                <SectionCard id="photo" title="Profile Photo">
                  <div className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Your profile photo" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold" aria-hidden="true">{initials}</div>
                      )}
                      {uploadingPhoto && (
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" id="photo-upload" aria-label="Upload profile photo" />
                      <button onClick={handlePhotoClick} disabled={uploadingPhoto} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                        <Camera size={14} aria-hidden="true" />
                        {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                      </button>
                      {profile.avatar_url && (
                        <button onClick={handleDeletePhoto} className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Remove Photo</button>
                      )}
                      <p className="text-xs text-slate-400">JPG, PNG, GIF, WebP · Max 5MB</p>
                    </div>
                  </div>
                </SectionCard>

                {/* Basic info */}
                <SectionCard id="basic" title="Basic Information">
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5" role="note">
                    <svg className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      This information is visible to admins and members of organizations you belong to. You can adjust what's shown per organization in the{' '}
                      <button onClick={function() { setActiveSection('privacy'); }} className="underline font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded">Privacy tab</button>.
                    </p>
                  </div>
                  <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first_name" className={labelCls}>First Name <span className="text-red-500" aria-hidden="true">*</span></label>
                        <input id="first_name" type="text" value={profile.first_name} onChange={function(e) { updateProfile('first_name', e.target.value); }} className={inputCls} placeholder="First name" aria-required="true" maxLength={50} />
                      </div>
                      <div>
                        <label htmlFor="last_name" className={labelCls}>Last Name <span className="text-red-500" aria-hidden="true">*</span></label>
                        <input id="last_name" type="text" value={profile.last_name} onChange={function(e) { updateProfile('last_name', e.target.value); }} className={inputCls} placeholder="Last name" aria-required="true" maxLength={50} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="display_name" className={labelCls}>Display Name <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input id="display_name" type="text" value={profile.display_name} onChange={function(e) { updateProfile('display_name', e.target.value); }} className={inputCls} placeholder="How your name appears to others (e.g. nickname)" maxLength={80} />
                    </div>
                    <div>
                      <label htmlFor="pronouns" className={labelCls}>Pronouns <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input id="pronouns" type="text" value={profile.pronouns} onChange={function(e) { updateProfile('pronouns', e.target.value); }} className={inputCls} placeholder="e.g. she/her, he/him, they/them" maxLength={40} />
                      <p className="text-xs text-slate-400 mt-1">Control who can see your pronouns in the Privacy tab.</p>
                    </div>
                    <div>
                      <label htmlFor="bio" className={labelCls}>Bio <span className="text-slate-400 font-normal">(optional)</span></label>
                      <textarea id="bio" value={profile.bio} onChange={function(e) { updateProfile('bio', e.target.value); }} rows={4} maxLength={500} className={inputCls + ' resize-none'} placeholder="Tell your organization a little about yourself..." />
                      <p className="text-xs text-slate-400 mt-1 text-right">{profile.bio.length}/500</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className={labelCls}>City <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input id="city" type="text" value={profile.city} onChange={function(e) { updateProfile('city', e.target.value); }} className={inputCls} placeholder="Toledo" autoComplete="address-level2" />
                      </div>
                      <div>
                        <label htmlFor="state" className={labelCls}>State <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input id="state" type="text" value={profile.state} onChange={function(e) { updateProfile('state', e.target.value); }} className={inputCls} placeholder="OH" maxLength={2} autoComplete="address-level1" />
                      </div>
                    </div>
                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                </SectionCard>

                {/* Interests */}
                <SectionCard id="interests" title="Interests" subtitle="Help other members find you. These show on your profile.">
                  <div className="flex flex-wrap gap-2 mb-3" aria-label="Your interests">
                    {interests.map(function(interest) {
                      return (
                        <span key={interest} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {interest}
                          <button onClick={function() { setInterests(interests.filter(function(i) { return i !== interest; })); }} className="ml-0.5 text-blue-400 hover:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full" aria-label={'Remove ' + interest}>
                            <X size={12} aria-hidden="true" />
                          </button>
                        </span>
                      );
                    })}
                    {interests.length === 0 && <p className="text-sm text-slate-400">No interests added yet.</p>}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={interestInput} onChange={function(e) { setInterestInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); } }} placeholder="e.g. Volunteer coordination" className={inputCls + ' flex-1'} aria-label="Add an interest" />
                    <button onClick={handleAddInterest} className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                      <Plus size={14} aria-hidden="true" /> Add
                    </button>
                  </div>
                  <div className="mt-4">
                    <button onClick={handleSaveProfile} disabled={saving} className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                      {saving ? 'Saving...' : 'Save Interests'}
                    </button>
                  </div>
                </SectionCard>

                {/* Affiliations */}
                <SectionCard id="affiliations" title="Memberships" subtitle="Share the organizations and groups you belong to — it helps other members discover communities they might want to join. Control visibility per org in the Privacy tab.">
                  <div className="space-y-2 mb-4">
                    {affiliations.length === 0 && <p className="text-sm text-slate-400">No affiliations added yet.</p>}
                    {affiliations.map(function(aff) {
                      var isEditing = editingAffId === aff.id;
                      return (
                        <div key={aff.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                          <Building2 size={15} className="text-slate-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                          {isEditing ? (
                            <div className="flex-1 space-y-2">
                              <input type="text" value={editAffForm.org_name} onChange={function(e) { setEditAffForm(function(prev) { return { org_name: e.target.value, role_title: prev.role_title, joined_year: prev.joined_year }; }); }} className={inputCls} placeholder="Organization name" aria-label="Organization name" />
                              <input type="text" value={editAffForm.role_title} onChange={function(e) { setEditAffForm(function(prev) { return { org_name: prev.org_name, role_title: e.target.value, joined_year: prev.joined_year }; }); }} className={inputCls} placeholder="Your role (optional)" aria-label="Your role" />
                              <input type="number" value={editAffForm.joined_year} onChange={function(e) { setEditAffForm(function(prev) { return { org_name: prev.org_name, role_title: prev.role_title, joined_year: e.target.value }; }); }} className={inputCls} placeholder={'Year joined (optional, e.g. ' + (new Date().getFullYear() - 2) + ')'} aria-label="Year joined" min="1900" max={new Date().getFullYear()} />
                              <div className="flex gap-2">
                                <button onClick={function() { handleSaveEditAff(aff.id); }} disabled={savingAff} className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">{savingAff ? 'Saving...' : 'Save'}</button>
                                <button onClick={function() { setEditingAffId(null); }} className="px-3 py-1 border border-slate-300 text-slate-600 text-xs font-semibold rounded focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">{aff.org_name}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                {aff.role_title && <p className="text-xs text-slate-500">{aff.role_title}</p>}
                                {aff.role_title && aff.joined_year && <span className="text-xs text-slate-300">·</span>}
                                {aff.joined_year && <p className="text-xs text-slate-400">{'Member since ' + aff.joined_year}</p>}
                              </div>
                            </div>
                          )}
                          {!isEditing && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={function() { setEditingAffId(aff.id); setEditAffForm({ org_name: aff.org_name, role_title: aff.role_title || '', joined_year: aff.joined_year ? String(aff.joined_year) : '' }); }} className="p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded" aria-label={'Edit ' + aff.org_name}>
                                <Pencil size={13} aria-hidden="true" />
                              </button>
                              <button onClick={function() { handleDeleteAff(aff.id); }} className="p-1 text-slate-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded" aria-label={'Remove ' + aff.org_name}>
                                <X size={13} aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <form onSubmit={handleAddAffiliation} noValidate className="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add affiliation</p>
                    <input type="text" value={affForm.org_name} onChange={function(e) { setAffForm(function(p) { return { org_name: e.target.value, role_title: p.role_title, joined_year: p.joined_year }; }); }} className={inputCls} placeholder="Organization name" aria-label="Organization name" required />
                    <input type="text" value={affForm.role_title} onChange={function(e) { setAffForm(function(p) { return { org_name: p.org_name, role_title: e.target.value, joined_year: p.joined_year }; }); }} className={inputCls} placeholder="Your role (optional, e.g. VP, Member, Chair)" aria-label="Your role" />
                    <input type="number" value={affForm.joined_year} onChange={function(e) { setAffForm(function(p) { return { org_name: p.org_name, role_title: p.role_title, joined_year: e.target.value }; }); }} className={inputCls} placeholder={'Year joined (optional, e.g. ' + (new Date().getFullYear() - 2) + ')'} aria-label="Year joined" min="1900" max={new Date().getFullYear()} />
                    <button type="submit" disabled={savingAff || !affForm.org_name.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                      <Plus size={14} aria-hidden="true" />
                      {savingAff ? 'Adding...' : 'Add Affiliation'}
                    </button>
                  </form>
                </SectionCard>
              </>
            )}

            {/* ── ACCOUNT ── */}
            {activeSection === 'account' && (
              <>
                <SectionCard id="email" title="Email Address" subtitle="Changing your email requires confirmation via a link sent to the new address.">
                  <form onSubmit={handleSaveEmail} noValidate className="space-y-4 max-w-sm">
                    <div>
                      <label htmlFor="email" className={labelCls}>Email</label>
                      <input id="email" type="email" value={emailForm} onChange={function(e) { setEmailForm(e.target.value); }} className={inputCls} placeholder="your@email.com" autoComplete="email" />
                    </div>
                    <button type="submit" disabled={savingEmail || emailForm === (currentUser && currentUser.email)} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                      {savingEmail ? 'Sending...' : 'Update Email'}
                    </button>
                  </form>
                </SectionCard>

                <SectionCard id="password" title="Change Password">
                  <form onSubmit={handlePasswordChange} noValidate className="space-y-4 max-w-sm">
                    <div>
                      <label htmlFor="newPassword" className={labelCls}>New Password</label>
                      <input id="newPassword" type="password" value={passwordForm.newPassword} onChange={function(e) { setPasswordForm(function(p) { return { newPassword: e.target.value, confirmPassword: p.confirmPassword }; }); }} className={inputCls} placeholder="Min. 8 characters" autoComplete="new-password" minLength={8} />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className={labelCls}>Confirm Password</label>
                      <input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={function(e) { setPasswordForm(function(p) { return { newPassword: p.newPassword, confirmPassword: e.target.value }; }); }} className={inputCls} placeholder="Repeat new password" autoComplete="new-password" />
                    </div>
                    <button type="submit" disabled={changingPassword || !passwordForm.newPassword} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </SectionCard>
              </>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeSection === 'notifications' && (
              <>
                {/* Global defaults */}
                <SectionCard id="notif-global" title="Default Notification Preferences" subtitle="These apply to all organizations unless you override them below.">
                  <NotifGridHeader />
                  {MEMBER_NOTIF_TYPES.map(function(t) {
                    return (
                      <NotifRow
                        key={t.key}
                        typeKey={t.key}
                        label={t.label}
                        desc={t.desc}
                        prefs={globalNotifPrefs}
                        onChange={handleGlobalNotifChange}
                      />
                    );
                  })}
                  <div className="mt-5">
                    <button onClick={handleSaveGlobalNotifPrefs} disabled={savingNotif} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                      {savingNotif ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </SectionCard>

                {/* Per-org overrides */}
                <SectionCard id="notif-orgs" title="Per-Organization Overrides" subtitle="Customize or silence notifications for a specific organization.">
                  {organizations.length === 0 ? (
                    <p className="text-sm text-slate-400">You are not a member of any organizations yet.</p>
                  ) : (
                    <div className="space-y-3" role="list" aria-label="Organization notification overrides">
                      {organizations.map(function(org) {
                        var orgPrefs   = orgNotifPrefs[org.id] || { muted: false, overrides: {} };
                        var isExpanded = expandedOrgs[org.id] || false;
                        var isAdmin    = org.role === 'admin';
                        var isSaving   = savingOrgNotif === org.id;

                        // Effective prefs for this org — merge global defaults with org overrides
                        var effectivePrefs = Object.assign({}, globalNotifPrefs, orgPrefs.overrides);

                        return (
                          <div key={org.id} className={'border rounded-xl overflow-hidden ' + (orgPrefs.muted ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white')} role="listitem">
                            {/* Org header row */}
                            <div className="flex items-center gap-3 px-4 py-3">
                              {/* Org initials avatar */}
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={'text-sm font-semibold ' + (orgPrefs.muted ? 'text-slate-400' : 'text-slate-900')}>{org.name}</p>
                                <p className="text-xs text-slate-400 capitalize">{org.role}</p>
                              </div>
                              {/* Mute toggle */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {orgPrefs.muted && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-500">
                                    <VolumeX size={10} aria-hidden="true" /> Muted
                                  </span>
                                )}
                                <button
                                  role="switch"
                                  aria-checked={!orgPrefs.muted}
                                  aria-label={'Mute all notifications from ' + org.name}
                                  onClick={function() { handleOrgMuteToggle(org.id); }}
                                  title={orgPrefs.muted ? 'Unmute this org' : 'Mute this org'}
                                  className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (!orgPrefs.muted ? 'bg-blue-600' : 'bg-slate-200')}
                                >
                                  <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' + (!orgPrefs.muted ? 'translate-x-6' : 'translate-x-1')} />
                                </button>
                                {/* Expand toggle */}
                                <button
                                  onClick={function() { toggleOrgExpanded(org.id); }}
                                  aria-expanded={isExpanded}
                                  aria-controls={'org-notif-' + org.id}
                                  aria-label={(isExpanded ? 'Collapse' : 'Expand') + ' notification settings for ' + org.name}
                                  className="p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                >
                                  {isExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                                </button>
                              </div>
                            </div>

                            {/* Expanded overrides */}
                            {isExpanded && (
                              <div id={'org-notif-' + org.id} className={'border-t border-slate-100 px-4 pt-3 pb-4 ' + (orgPrefs.muted ? 'opacity-40 pointer-events-none' : '')} aria-hidden={orgPrefs.muted}>
                                <p className="text-xs text-slate-500 mb-3">These override your global defaults for <strong>{org.name}</strong> only.</p>
                                <NotifGridHeader />

                                {/* Member notification types */}
                                {MEMBER_NOTIF_TYPES.map(function(t) {
                                  return (
                                    <NotifRow
                                      key={t.key}
                                      typeKey={t.key}
                                      label={t.label}
                                      desc={t.desc}
                                      prefs={effectivePrefs}
                                      onChange={function(typeKey, channel, value) { handleOrgNotifChange(org.id, typeKey, channel, value); }}
                                    />
                                  );
                                })}

                                {/* Admin-only types — only show for admin orgs */}
                                {isAdmin && (
                                  <>
                                    <div className="mt-4 mb-2 pt-3 border-t border-slate-100">
                                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F5B731', letterSpacing: '4px' }}>Admin Only</p>
                                    </div>
                                    {ADMIN_NOTIF_TYPES.map(function(t) {
                                      return (
                                        <NotifRow
                                          key={t.key}
                                          typeKey={t.key}
                                          label={t.label}
                                          desc={t.desc}
                                          prefs={effectivePrefs}
                                          onChange={function(typeKey, channel, value) { handleOrgNotifChange(org.id, typeKey, channel, value); }}
                                        />
                                      );
                                    })}
                                  </>
                                )}

                                <div className="mt-4">
                                  <button
                                    onClick={function() { handleSaveOrgNotifPrefs(org.id); }}
                                    disabled={isSaving}
                                    className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm"
                                  >
                                    {isSaving ? 'Saving...' : 'Save ' + org.name + ' Settings'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              </>
            )}

            {/* ── PRIVACY ── */}
            {activeSection === 'privacy' && (
              <>
                <SectionCard id="org-privacy" title="Visibility by Organization" subtitle="Control what members in each organization can see.">
                  {organizations.length === 0 ? (
                    <p className="text-sm text-slate-400">You are not a member of any organizations yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {organizations.map(function(org) {
                        return (
                          <div key={org.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="mb-2 pb-2 border-b border-slate-100">
                              <p className="font-semibold text-slate-900 text-sm">{org.name}</p>
                              <p className="text-xs text-slate-400 capitalize">{org.role}</p>
                            </div>
                            <Toggle id={'email-' + org.id} label="Share email address" checked={(privacySettings[org.id] && privacySettings[org.id].show_email) || false} onChange={function() { setPrivacySettings(function(prev) { var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; }); next[org.id] = Object.assign({}, prev[org.id], { show_email: !((prev[org.id] || {}).show_email) }); return next; }); }} />
                            <Toggle id={'bio-' + org.id}   label="Share bio"           checked={privacySettings[org.id] ? privacySettings[org.id].show_bio : true} onChange={function() { setPrivacySettings(function(prev) { var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; }); next[org.id] = Object.assign({}, prev[org.id], { show_bio: !(privacySettings[org.id] ? privacySettings[org.id].show_bio : true) }); return next; }); }} />
                            <Toggle id={'pronouns-' + org.id} label="Show pronouns" desc="Let members in this org see your pronouns on your member card" checked={(privacySettings[org.id] && privacySettings[org.id].show_pronouns) || false} onChange={function() { setPrivacySettings(function(prev) { var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; }); next[org.id] = Object.assign({}, prev[org.id], { show_pronouns: !((prev[org.id] || {}).show_pronouns) }); return next; }); }} />
                            <Toggle id={'aff-' + org.id}   label="Show my other memberships on member card" checked={affVisibility[org.id] || false} onChange={function() { setAffVisibility(function(prev) { var next = {}; Object.keys(prev).forEach(function(k) { next[k] = prev[k]; }); next[org.id] = !prev[org.id]; return next; }); }} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {organizations.length > 0 && (
                    <div className="mt-5">
                      <button onClick={handleSavePrivacy} disabled={savingPrivacy} className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                        {savingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                      </button>
                    </div>
                  )}
                </SectionCard>

                <SectionCard id="download" title="Download My Data" subtitle="Export a copy of your Syndicade data as a JSON file.">
                  <button onClick={handleDownloadData} disabled={downloadingData} className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                    <Download size={15} aria-hidden="true" />
                    {downloadingData ? 'Preparing...' : 'Download My Data'}
                  </button>
                </SectionCard>
              </>
            )}

            {/* ── DANGER ZONE ── */}
            {activeSection === 'danger' && (
              <>
                {adminOrgs.length > 0 && !allAdminOrgsResolved && (
                  <SectionCard id="org-resolution" title="Resolve Organization Admin Roles" danger>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5" role="alert">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-amber-800">You are the admin of the organizations below. Transfer admin rights or delete each organization before you can delete your account.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {adminOrgs.map(function(org) {
                        var res = adminOrgResolutions[org.id] || {};
                        if (res.resolved) {
                          return (
                            <div key={org.id} className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center gap-3">
                              <CheckCircle size={15} className="text-green-600 flex-shrink-0" aria-hidden="true" />
                              <p className="text-sm font-medium text-green-800">{org.name} — resolved</p>
                            </div>
                          );
                        }
                        return (
                          <div key={org.id} className="border border-slate-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-slate-900 mb-3">{org.name}</p>
                            <div className="flex gap-2 mb-4" role="group" aria-label={'Action for ' + org.name}>
                              <button onClick={function() { handleOrgAction(org.id, 'transfer'); }} aria-pressed={res.action === 'transfer'} className={'px-4 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (res.action === 'transfer' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50')}>Transfer Admin</button>
                              <button onClick={function() { handleOrgAction(org.id, 'delete'); }} aria-pressed={res.action === 'delete'} className={'px-4 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ' + (res.action === 'delete' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50')}>Delete Organization</button>
                            </div>
                            {res.action === 'transfer' && (
                              <div className="space-y-3">
                                {res.loadingMembers ? (<div className="h-10 bg-slate-100 rounded-lg animate-pulse" />) : res.members.length === 0 ? (
                                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">No other active members. You must delete this organization instead.</p>
                                ) : (
                                  <>
                                    <div>
                                      <label htmlFor={'transfer-' + org.id} className={labelCls}>Transfer admin to:</label>
                                      <select id={'transfer-' + org.id} value={res.transferTo} onChange={function(e) { setOrgResolution(org.id, { transferTo: e.target.value }); }} className={inputCls}>
                                        <option value="">Select a member...</option>
                                        {res.members.map(function(m) {
                                          var name = ((m.members && m.members.first_name ? m.members.first_name : '') + ' ' + (m.members && m.members.last_name ? m.members.last_name : '')).trim() || 'Member';
                                          return <option key={m.member_id} value={m.member_id}>{name}</option>;
                                        })}
                                      </select>
                                    </div>
                                    <button onClick={function() { handleTransferAdmin(org.id); }} disabled={!res.transferTo || resolvingOrg === org.id} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                                      <UserCheck size={14} aria-hidden="true" />
                                      {resolvingOrg === org.id ? 'Transferring...' : 'Confirm Transfer'}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            {res.action === 'delete' && (
                              <div className="space-y-3">
                                {!res.confirmingDelete ? (
                                  <button onClick={function() { setOrgResolution(org.id, { confirmingDelete: true }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                                    <Trash2 size={14} aria-hidden="true" /> Delete {org.name}
                                  </button>
                                ) : (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3" role="alert">
                                    <p className="text-sm font-medium text-red-700">This permanently deletes <strong>{org.name}</strong> and all its data. This cannot be undone.</p>
                                    <div className="flex gap-2">
                                      <button onClick={function() { handleDeleteOrg(org.id, org.name); }} disabled={resolvingOrg === org.id} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50">{resolvingOrg === org.id ? 'Deleting...' : 'Yes, Delete'}</button>
                                      <button onClick={function() { setOrgResolution(org.id, { confirmingDelete: false }); }} className="px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}

                <SectionCard id="delete" title="Delete Account" danger>
                  {!allAdminOrgsResolved ? (
                    <p className="text-sm text-slate-500 italic">Resolve all organization issues above before deleting your account.</p>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
                      {!showDeleteConfirm ? (
                        <button onClick={function() { setShowDeleteConfirm(true); }} className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm">Delete My Account</button>
                      ) : (
                        <div className="space-y-3 max-w-sm">
                          <p className="text-sm font-medium text-red-700">Type <strong>DELETE</strong> to confirm:</p>
                          <input type="text" value={deleteConfirmText} onChange={function(e) { setDeleteConfirmText(e.target.value); }} className={inputCls + ' border-2 border-red-300'} placeholder="Type DELETE here" aria-label="Type DELETE to confirm account deletion" />
                          <div className="flex gap-3">
                            <button onClick={handleDeleteAccount} disabled={deleting || deleteConfirmText !== 'DELETE'} className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 text-sm">{deleting ? 'Deleting...' : 'Confirm Delete'}</button>
                            <button onClick={function() { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} className="px-6 py-2 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 text-sm">Cancel</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </SectionCard>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default AccountSettings;