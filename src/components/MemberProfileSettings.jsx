import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ── Icon primitive ────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
    </svg>
  );
}

var ICONS = {
  user:      ['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
  camera:    ['M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z', 'M15 13a3 3 0 11-6 0 3 3 0 016 0'],
  phone:     'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  location:  ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  link:      'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  bell:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  shield:    ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  building:  ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  plus:      'M12 4v16m8-8H4',
  trash:     ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  save:      ['M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'],
  cake:      ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  eye:       ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  eyeOff:    ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  check:     'M5 13l4 4L19 7',
  globe:     ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
};

var inputCls = 'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
var labelCls = 'block text-sm font-semibold text-gray-900 mb-1.5';
var sectionLabelCls = 'text-xs font-bold uppercase tracking-widest mb-4';

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FieldSkeleton({ wide }) {
  return <div className={'h-11 bg-gray-200 rounded-lg animate-pulse ' + (wide ? 'w-full' : 'w-1/2')} />;
}

function SectionSkeleton({ rows }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 animate-pulse">
      <div className="h-4 w-32 bg-gray-300 rounded" />
      {Array.from({ length: rows || 2 }).map(function(_, i) { return <FieldSkeleton key={i} wide />; })}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ id, checked, onChange, label, desc }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-gray-900 cursor-pointer">{label}</label>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={function() { onChange(!checked); }}
        className={'relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ' +
          (checked ? 'bg-blue-500' : 'bg-gray-300')}
      >
        <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
          (checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon, iconColor, label, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (iconColor || 'bg-blue-100')}>
          <Icon path={icon} className="h-4 w-4 text-blue-600" />
        </div>
        <p className={sectionLabelCls + ' text-blue-600 mb-0'} style={{ color: '#F5B731' }}>{label}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function MemberProfileSettings() {
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [avatarUploading, setAvatarUploading] = useState(false);
  var [currentUser, setCurrentUser] = useState(null);
  var [memberships, setMemberships] = useState([]);

  var [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    email: '',
    bio: '',
    birthday: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    website: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    twitter: '',
    avatar_url: '',
  });

  var [notifPrefs, setNotifPrefs] = useState({
    email_announcements: true,
    email_events: true,
    email_invites: true,
    in_app_all: true,
  });

  var [privacy, setPrivacy] = useState({
    show_email: false,
    show_phone: false,
    show_address: false,
    show_social: true,
    show_birthday: false,
    share_with_groups: false,
  });

  // External orgs: [{ id, name, role, duration }]
  var [externalOrgs, setExternalOrgs] = useState([]);

  var fileInputRef = useRef(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(function() { loadProfile(); }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { toast.error('Not logged in.'); return; }
      var user = authResult.data.user;
      setCurrentUser(user);

      var memberResult = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (memberResult.error) throw memberResult.error;
      var m = memberResult.data;

      setProfile({
        first_name:   m.first_name   || '',
        last_name:    m.last_name    || '',
        display_name: m.display_name || '',
        email:        m.email        || user.email || '',
        bio:          m.bio          || '',
        birthday:     m.birthday     || '',
        phone:        m.phone        || '',
        address_line1:m.address_line1|| '',
        address_line2:m.address_line2|| '',
        city:         m.city         || '',
        state:        m.state        || '',
        zip:          m.zip          || '',
        country:      m.country      || 'US',
        website:      m.website      || '',
        linkedin:     m.linkedin     || '',
        instagram:    m.instagram    || '',
        facebook:     m.facebook     || '',
        twitter:      m.twitter      || '',
        avatar_url:   m.avatar_url   || m.profile_photo_url || '',
      });

      if (m.notification_prefs) setNotifPrefs(Object.assign({}, notifPrefs, m.notification_prefs));
      if (m.privacy_settings)   setPrivacy(Object.assign({}, privacy, m.privacy_settings));
      if (m.external_orgs && Array.isArray(m.external_orgs)) {
        setExternalOrgs(m.external_orgs.map(function(o, i) { return Object.assign({ id: i + '_' + Date.now() }, o); }));
      }

      // Load memberships to show org roles in privacy section
      var membershipResult = await supabase
        .from('memberships')
        .select('role, organizations(id, name)')
        .eq('member_id', user.id)
        .eq('status', 'active');
      setMemberships(membershipResult.data || []);

    } catch (err) {
      toast.error('Failed to load profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Avatar upload ───────────────────────────────────────────────────────────
  async function handleAvatarUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, or WebP allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }

    try {
      setAvatarUploading(true);
      var ext = file.name.split('.').pop();
      var fileName = currentUser.id + '/avatar.' + ext;
      var uploadResult = await supabase.storage.from('member-avatars').upload(fileName, file, { upsert: true });
      if (uploadResult.error) throw uploadResult.error;
      var urlData = supabase.storage.from('member-avatars').getPublicUrl(fileName);
      var url = urlData.data.publicUrl + '?t=' + Date.now();
      setProfile(function(prev) { return Object.assign({}, prev, { avatar_url: url }); });
      toast.success('Photo updated.');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!profile.first_name.trim()) { toast.error('First name is required.'); return; }
    if (!profile.last_name.trim())  { toast.error('Last name is required.'); return; }

    try {
      setSaving(true);
      var cleanOrgs = externalOrgs
        .filter(function(o) { return o.name && o.name.trim(); })
        .map(function(o) { return { name: o.name.trim(), role: o.role || '', duration: o.duration || '' }; });

      var updateResult = await supabase
        .from('members')
        .update({
          first_name:    profile.first_name.trim(),
          last_name:     profile.last_name.trim(),
          display_name:  profile.display_name.trim() || null,
          bio:           profile.bio.trim() || null,
          birthday:      profile.birthday || null,
          phone:         profile.phone.trim() || null,
          address_line1: profile.address_line1.trim() || null,
          address_line2: profile.address_line2.trim() || null,
          city:          profile.city.trim() || null,
          state:         profile.state.trim() || null,
          zip:           profile.zip.trim() || null,
          country:       profile.country || 'US',
          website:       profile.website.trim() || null,
          linkedin:      profile.linkedin.trim() || null,
          instagram:     profile.instagram.trim() || null,
          facebook:      profile.facebook.trim() || null,
          twitter:       profile.twitter.trim() || null,
          avatar_url:    profile.avatar_url || null,
          notification_prefs: notifPrefs,
          privacy_settings:   privacy,
          external_orgs:      cleanOrgs,
        })
        .eq('user_id', currentUser.id);

      if (updateResult.error) throw updateResult.error;
      toast.success('Profile saved successfully.');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── External orgs helpers ───────────────────────────────────────────────────
  function addExternalOrg() {
    setExternalOrgs(function(prev) { return prev.concat([{ id: Date.now().toString(), name: '', role: '', duration: '' }]); });
  }

  function updateExternalOrg(id, field, value) {
    setExternalOrgs(function(prev) {
      return prev.map(function(o) { return o.id === id ? Object.assign({}, o, { [field]: value }) : o; });
    });
  }

  function removeExternalOrg(id) {
    setExternalOrgs(function(prev) { return prev.filter(function(o) { return o.id !== id; }); });
  }

  function updateProfile(field, value) {
    setProfile(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  function updatePrivacy(field, value) {
    setPrivacy(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  function updateNotif(field, value) {
    setNotifPrefs(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  var initials = ((profile.first_name.charAt(0) || '') + (profile.last_name.charAt(0) || '')).toUpperCase() || '?';

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar skeleton */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6 animate-pulse">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-56 bg-gray-100 rounded" />
            <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          </div>
        </div>
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={4} />
        <SectionSkeleton rows={3} />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your personal information and preferences.</p>
      </div>

      {/* ── Avatar ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Avatar preview */}
          <div className="relative flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.first_name + ' ' + profile.last_name + ' avatar'}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-extrabold border-4 border-white shadow-md" aria-hidden="true">
                {initials}
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-lg">
              {(profile.first_name + ' ' + profile.last_name).trim() || 'Your Name'}
            </p>
            <p className="text-gray-500 text-sm mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <label
                htmlFor="avatar-upload"
                className={'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors focus-within:ring-2 focus-within:ring-blue-500 ' +
                  (avatarUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600')}
              >
                <Icon path={ICONS.camera} className="h-4 w-4" />
                {avatarUploading ? 'Uploading...' : 'Change Photo'}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                  className="sr-only"
                  aria-label="Upload profile photo"
                />
              </label>
              {profile.avatar_url && (
                <button
                  onClick={function() { updateProfile('avatar_url', ''); }}
                  className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-gray-400">JPG, PNG, GIF, WebP · Max 5MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Basic Info ── */}
      <Section icon={ICONS.user} label="Basic Information">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className={labelCls}>
                First Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="first-name"
                type="text"
                value={profile.first_name}
                onChange={function(e) { updateProfile('first_name', e.target.value); }}
                className={inputCls}
                aria-required="true"
                maxLength={50}
                placeholder="First name"
              />
            </div>
            <div>
              <label htmlFor="last-name" className={labelCls}>
                Last Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="last-name"
                type="text"
                value={profile.last_name}
                onChange={function(e) { updateProfile('last_name', e.target.value); }}
                className={inputCls}
                aria-required="true"
                maxLength={50}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="display-name" className={labelCls}>
              Display Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="display-name"
              type="text"
              value={profile.display_name}
              onChange={function(e) { updateProfile('display_name', e.target.value); }}
              className={inputCls}
              maxLength={80}
              placeholder="How your name appears to others (e.g. nickname)"
            />
          </div>

          <div>
            <label htmlFor="bio" className={labelCls}>Bio <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={function(e) { updateProfile('bio', e.target.value); }}
              rows={4}
              className={inputCls + ' resize-none'}
              maxLength={500}
              placeholder="Tell your organization a little about yourself..."
            />
            <p className="text-xs text-gray-400 mt-1" aria-live="polite">{profile.bio.length}/500</p>
          </div>

          <div>
            <label htmlFor="birthday" className={labelCls}>
              <span className="flex items-center gap-2">
                <Icon path={ICONS.cake} className="h-4 w-4 text-gray-400" />
                Birthday <span className="text-gray-400 font-normal">(optional)</span>
              </span>
            </label>
            <input
              id="birthday"
              type="date"
              value={profile.birthday}
              onChange={function(e) { updateProfile('birthday', e.target.value); }}
              className={inputCls}
              aria-describedby="birthday-hint"
            />
            <p id="birthday-hint" className="text-xs text-gray-400 mt-1">Your birthday will only be shown based on your privacy settings.</p>
          </div>
        </div>
      </Section>

      {/* ── Contact ── */}
      <Section icon={ICONS.phone} label="Contact & Address">
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className={labelCls}>Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={function(e) { updateProfile('phone', e.target.value); }}
              className={inputCls}
              placeholder="(555) 555-5555"
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="address-line1" className={labelCls}>Address Line 1</label>
            <input
              id="address-line1"
              type="text"
              value={profile.address_line1}
              onChange={function(e) { updateProfile('address_line1', e.target.value); }}
              className={inputCls}
              placeholder="123 Main Street"
              autoComplete="address-line1"
            />
          </div>

          <div>
            <label htmlFor="address-line2" className={labelCls}>Address Line 2 <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              id="address-line2"
              type="text"
              value={profile.address_line2}
              onChange={function(e) { updateProfile('address_line2', e.target.value); }}
              className={inputCls}
              placeholder="Apt, Suite, Unit..."
              autoComplete="address-line2"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label htmlFor="city" className={labelCls}>City</label>
              <input id="city" type="text" value={profile.city} onChange={function(e) { updateProfile('city', e.target.value); }} className={inputCls} placeholder="City" autoComplete="address-level2" />
            </div>
            <div>
              <label htmlFor="state" className={labelCls}>State</label>
              <input id="state" type="text" value={profile.state} onChange={function(e) { updateProfile('state', e.target.value); }} className={inputCls} placeholder="OH" maxLength={2} autoComplete="address-level1" />
            </div>
            <div>
              <label htmlFor="zip" className={labelCls}>ZIP</label>
              <input id="zip" type="text" value={profile.zip} onChange={function(e) { updateProfile('zip', e.target.value); }} className={inputCls} placeholder="43402" maxLength={10} autoComplete="postal-code" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Social / Web ── */}
      <Section icon={ICONS.link} label="Social Links">
        <div className="space-y-4">
          {[
            { id: 'website',   field: 'website',   label: 'Website',   placeholder: 'https://yoursite.com' },
            { id: 'linkedin',  field: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/username' },
            { id: 'instagram', field: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
            { id: 'facebook',  field: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/username' },
            { id: 'twitter',   field: 'twitter',   label: 'X / Twitter', placeholder: 'https://x.com/username' },
          ].map(function(item) {
            return (
              <div key={item.id}>
                <label htmlFor={item.id} className={labelCls}>{item.label}</label>
                <input
                  id={item.id}
                  type="url"
                  value={profile[item.field]}
                  onChange={function(e) { updateProfile(item.field, e.target.value); }}
                  className={inputCls}
                  placeholder={item.placeholder}
                />
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── External Orgs ── */}
      <Section icon={ICONS.building} label="Other Organizations & Groups">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">List organizations or groups you are part of outside of Syndicade.</p>

          {externalOrgs.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Icon path={ICONS.building} className="h-8 w-8 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No external organizations added yet.</p>
            </div>
          )}

          {externalOrgs.map(function(org) {
            return (
              <div key={org.id} className="relative bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <button
                  onClick={function() { removeExternalOrg(org.id); }}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                  aria-label="Remove organization"
                >
                  <Icon path={ICONS.trash} className="h-4 w-4" />
                </button>

                <div>
                  <label htmlFor={'ext-name-' + org.id} className={labelCls}>Organization Name <span className="text-red-500" aria-hidden="true">*</span></label>
                  <input
                    id={'ext-name-' + org.id}
                    type="text"
                    value={org.name}
                    onChange={function(e) { updateExternalOrg(org.id, 'name', e.target.value); }}
                    className={inputCls}
                    placeholder="e.g., NAACP, Local Chamber of Commerce"
                    maxLength={100}
                    aria-required="true"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={'ext-role-' + org.id} className={labelCls}>Your Role</label>
                    <input
                      id={'ext-role-' + org.id}
                      type="text"
                      value={org.role}
                      onChange={function(e) { updateExternalOrg(org.id, 'role', e.target.value); }}
                      className={inputCls}
                      placeholder="e.g., Chapter President, Volunteer"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label htmlFor={'ext-duration-' + org.id} className={labelCls}>How Long</label>
                    <input
                      id={'ext-duration-' + org.id}
                      type="text"
                      value={org.duration}
                      onChange={function(e) { updateExternalOrg(org.id, 'duration', e.target.value); }}
                      className={inputCls}
                      placeholder="e.g., 3 years, Since 2019"
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={addExternalOrg}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full justify-center"
          >
            <Icon path={ICONS.plus} className="h-4 w-4" />
            Add Organization
          </button>
        </div>
      </Section>

      {/* ── Notifications ── */}
      <Section icon={ICONS.bell} label="Notification Preferences">
        <div className="divide-y divide-gray-100">
          <Toggle
            id="notif-email-ann"
            checked={notifPrefs.email_announcements}
            onChange={function(v) { updateNotif('email_announcements', v); }}
            label="Email — Announcements"
            desc="Receive email when new announcements are posted"
          />
          <Toggle
            id="notif-email-events"
            checked={notifPrefs.email_events}
            onChange={function(v) { updateNotif('email_events', v); }}
            label="Email — Events"
            desc="Receive email when new events are created"
          />
          <Toggle
            id="notif-email-invites"
            checked={notifPrefs.email_invites}
            onChange={function(v) { updateNotif('email_invites', v); }}
            label="Email — Invitations"
            desc="Receive email when you are invited to an organization"
          />
          <Toggle
            id="notif-in-app"
            checked={notifPrefs.in_app_all}
            onChange={function(v) { updateNotif('in_app_all', v); }}
            label="In-App Notifications"
            desc="Show notifications inside the Syndicade platform"
          />
        </div>
      </Section>

      {/* ── Privacy ── */}
      <Section icon={ICONS.shield} label="Privacy Settings">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 mb-4">Control what other members can see on your profile.</p>

          <div className="divide-y divide-gray-100">
            <Toggle
              id="priv-email"
              checked={privacy.show_email}
              onChange={function(v) { updatePrivacy('show_email', v); }}
              label="Show Email Address"
              desc="Allow other members to see your email"
            />
            <Toggle
              id="priv-phone"
              checked={privacy.show_phone}
              onChange={function(v) { updatePrivacy('show_phone', v); }}
              label="Show Phone Number"
              desc="Allow other members to see your phone"
            />
            <Toggle
              id="priv-address"
              checked={privacy.show_address}
              onChange={function(v) { updatePrivacy('show_address', v); }}
              label="Show Address"
              desc="Allow other members to see your address"
            />
            <Toggle
              id="priv-social"
              checked={privacy.show_social}
              onChange={function(v) { updatePrivacy('show_social', v); }}
              label="Show Social Links"
              desc="Allow other members to see your social profiles"
            />
            <Toggle
              id="priv-birthday"
              checked={privacy.show_birthday}
              onChange={function(v) { updatePrivacy('show_birthday', v); }}
              label="Show Birthday"
              desc="Allow other members to see your birthday"
            />
            <Toggle
              id="priv-groups"
              checked={privacy.share_with_groups}
              onChange={function(v) { updatePrivacy('share_with_groups', v); }}
              label="Share Profile with Groups"
              desc="Allow group leaders to see your full profile details"
            />
          </div>

          {/* Per-org membership roles */}
          {memberships.length > 0 && (
            <div className="pt-5 mt-4 border-t border-gray-100">
              <p className={sectionLabelCls + ' text-gray-500'}>Your Role in Each Organization</p>
              <div className="space-y-2 mt-2">
                {memberships.map(function(m, i) {
                  var orgName = m.organizations ? m.organizations.name : 'Unknown Org';
                  var role = m.role || 'member';
                  return (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-semibold text-gray-700 truncate">{orgName}</span>
                      <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' +
                        (role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Save button ── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={loadProfile}
          disabled={saving}
          className="px-6 py-3 bg-transparent border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm"
        >
          Discard Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Icon path={ICONS.save} className="h-4 w-4" />
              Save Profile
            </>
          )}
        </button>
      </div>

    </div>
  );
}

export default MemberProfileSettings;