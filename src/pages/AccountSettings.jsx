import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { Download, AlertTriangle, UserCheck, Trash2, CheckCircle } from 'lucide-react';

function AccountSettings() {
  var navigate = useNavigate();
  var fileInputRef = useRef(null);
  var [activeSection, setActiveSection] = useState('profile');

  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [uploadingPhoto, setUploadingPhoto] = useState(false);
  var [currentUser, setCurrentUser] = useState(null);
  var [memberProfile, setMemberProfile] = useState(null);
  var [photoPreview, setPhotoPreview] = useState(null);
  var [organizations, setOrganizations] = useState([]);
  var [privacySettings, setPrivacySettings] = useState({});
  var [savingPrivacy, setSavingPrivacy] = useState(false);
  var [adminOrgs, setAdminOrgs] = useState([]);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  var [deleteConfirmText, setDeleteConfirmText] = useState('');
  var [deleting, setDeleting] = useState(false);
  var [downloadingData, setDownloadingData] = useState(false);

  // E3: resolution state per admin org
  // shape: { [orgId]: { action, transferTo, resolved, members, loadingMembers, confirmingDelete } }
  var [adminOrgResolutions, setAdminOrgResolutions] = useState({});
  var [resolvingOrg, setResolvingOrg] = useState(null);

  var [form, setForm] = useState({
    full_name: '',
    email: '',
    bio: '',
  });

  var [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  var [changingPassword, setChangingPassword] = useState(false);

  useEffect(function () { fetchProfile(); }, []);

  var fetchProfile = async function () {
    try {
      setLoading(true);
      var authRes = await supabase.auth.getUser();
      if (authRes.error || !authRes.data.user) { navigate('/login'); return; }
      var user = authRes.data.user;
      setCurrentUser(user);

      var memberRes = await supabase.from('members').select('*').eq('user_id', user.id).single();
      var member = memberRes.data;

      if (member) {
        setMemberProfile(member);
        setPhotoPreview(member.profile_photo_url || null);
        setForm({
          full_name: (member.first_name || '') + (member.last_name ? ' ' + member.last_name : ''),
          email: user.email || '',
          bio: member.bio || '',
        });
      } else {
        setForm({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          bio: '',
        });
      }

      var membershipsRes = await supabase
        .from('memberships')
        .select('role, organization_id, organizations(id, name)')
        .eq('member_id', user.id)
        .eq('status', 'active');

      var orgs = ((membershipsRes.data) || []).map(function (m) {
        return { id: m.organizations.id, name: m.organizations.name, role: m.role };
      });
      setOrganizations(orgs);

      var adminOrgList = orgs.filter(function (o) { return o.role === 'admin'; });
      setAdminOrgs(adminOrgList);

      var resolutions = {};
      adminOrgList.forEach(function (org) {
        resolutions[org.id] = {
          action: null, transferTo: '', resolved: false,
          members: [], loadingMembers: false, confirmingDelete: false,
        };
      });
      setAdminOrgResolutions(resolutions);

      var orgIds = orgs.map(function (o) { return o.id; });
      if (orgIds.length > 0) {
        var privacyRes = await supabase
          .from('member_privacy').select('*')
          .eq('user_id', user.id).in('organization_id', orgIds);

        var privacyMap = {};
        orgs.forEach(function (org) {
          var existing = ((privacyRes.data) || []).find(function (p) { return p.organization_id === org.id; });
          privacyMap[org.id] = {
            show_email: existing?.show_email ?? false,
            show_bio: existing?.show_bio ?? true,
          };
        });
        setPrivacySettings(privacyMap);
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  var handleChange = function (e) {
    setForm(function (prev) { return { ...prev, [e.target.name]: e.target.value }; });
  };

  var handlePhotoClick = function () { fileInputRef.current?.click(); };

  var handlePhotoChange = async function (e) {
    var file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setPhotoPreview(URL.createObjectURL(file));
    try {
      setUploadingPhoto(true);
      var authRes2 = await supabase.auth.getUser();
      var user = authRes2.data.user;
      var fileExt = file.name.split('.').pop();
      var filePath = 'profiles/profile-' + user.id + '-' + Date.now() + '.' + fileExt;
      var uploadRes = await supabase.storage.from('member-photos').upload(filePath, file, { upsert: true });
      if (uploadRes.error) throw uploadRes.error;
      var urlRes = supabase.storage.from('member-photos').getPublicUrl(filePath);
      var publicUrl = urlRes.data.publicUrl;
      await supabase.from('members').upsert({ user_id: user.id, profile_photo_url: publicUrl }, { onConflict: 'user_id' });
      setPhotoPreview(publicUrl);
      mascotSuccessToast('Profile photo updated!');
    } catch (err) {
      mascotErrorToast('Failed to upload photo.');
      setPhotoPreview(memberProfile?.profile_photo_url || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  var handleDeletePhoto = async function () {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      var authRes3 = await supabase.auth.getUser();
      var user = authRes3.data.user;
      await supabase.from('members').upsert({ user_id: user.id, profile_photo_url: null }, { onConflict: 'user_id' });
      setPhotoPreview(null);
      mascotSuccessToast('Photo removed.');
    } catch (err) {
      mascotErrorToast('Failed to remove photo.');
    }
  };

  var handleSave = async function (e) {
    e.preventDefault();
    try {
      setSaving(true);
      var nameParts = form.full_name.trim().split(' ');
      var firstName = nameParts[0] || '';
      var lastName = nameParts.slice(1).join(' ') || '';
      var authRes4 = await supabase.auth.getUser();
      var user = authRes4.data.user;
      await supabase.auth.updateUser({ data: { full_name: form.full_name.trim() } });
      if (form.email !== currentUser.email) {
        var emailRes = await supabase.auth.updateUser({ email: form.email });
        if (emailRes.error) throw emailRes.error;
        mascotSuccessToast('Confirmation email sent to ' + form.email);
      }
      var memberRes2 = await supabase.from('members').upsert(
        { user_id: user.id, first_name: firstName, last_name: lastName, bio: form.bio },
        { onConflict: 'user_id' }
      );
      if (memberRes2.error) throw memberRes2.error;
      mascotSuccessToast('Profile saved!');
    } catch (err) {
      mascotErrorToast('Failed to save profile.', err.message || '');
    } finally {
      setSaving(false);
    }
  };

  var handlePasswordChange = async function (e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    try {
      setChangingPassword(true);
      var pwRes = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (pwRes.error) throw pwRes.error;
      mascotSuccessToast('Password updated!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      mascotErrorToast('Failed to update password.', err.message || '');
    } finally {
      setChangingPassword(false);
    }
  };

  var handlePrivacyToggle = function (orgId, field) {
    setPrivacySettings(function (prev) {
      return { ...prev, [orgId]: { ...prev[orgId], [field]: !prev[orgId][field] } };
    });
  };

  var handleSavePrivacy = async function () {
    try {
      setSavingPrivacy(true);
      var authRes5 = await supabase.auth.getUser();
      var user = authRes5.data.user;
      var upserts = Object.entries(privacySettings).map(function ([orgId, settings]) {
        return { user_id: user.id, organization_id: orgId, show_email: settings.show_email, show_bio: settings.show_bio };
      });
      var privRes = await supabase.from('member_privacy').upsert(upserts, { onConflict: 'user_id,organization_id' });
      if (privRes.error) throw privRes.error;
      mascotSuccessToast('Privacy settings saved!');
    } catch (err) {
      mascotErrorToast('Failed to save privacy settings.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  // E2: Download My Data
  var handleDownloadData = async function () {
    var loadingId = null;
    try {
      setDownloadingData(true);
      loadingId = toast.loading('Preparing your data...');
      var authRes6 = await supabase.auth.getUser();
      var user = authRes6.data.user;

      var results = await Promise.allSettled([
        supabase.from('members').select('*').eq('user_id', user.id).single(),
        supabase.from('memberships').select('*, organizations(name)').eq('member_id', user.id),
        supabase.from('attendance_records').select('*').eq('member_id', user.id),
        supabase.from('poll_votes').select('*').eq('user_id', user.id),
        supabase.from('survey_responses').select('*').eq('member_id', user.id),
        supabase.from('signup_responses').select('*').eq('member_id', user.id),
        supabase.from('chat_messages').select('*').eq('sender_id', user.id),
        supabase.from('ticket_purchases').select('*').eq('member_id', user.id),
        supabase.from('notifications').select('*').eq('user_id', user.id),
      ]);

      var getValue = function (result) {
        return (result.status === 'fulfilled' && result.value.data) ? result.value.data : null;
      };

      var profile = getValue(results[0]);
      var exportData = {
        exported_at: new Date().toISOString(),
        profile: profile,
        memberships: getValue(results[1]) || [],
        attendance: getValue(results[2]) || [],
        poll_votes: getValue(results[3]) || [],
        survey_responses: getValue(results[4]) || [],
        signup_responses: getValue(results[5]) || [],
        chat_messages: getValue(results[6]) || [],
        ticket_purchases: getValue(results[7]) || [],
        notifications: getValue(results[8]) || [],
      };

      var firstName = (profile?.first_name || 'user').toLowerCase();
      var lastName = (profile?.last_name || '').toLowerCase();
      var dateStr = new Date().toISOString().split('T')[0];
      var filename = 'syndicade-data-' + firstName + (lastName ? '-' + lastName : '') + '-' + dateStr + '.json';

      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingId);
      mascotSuccessToast('Data exported!', 'Your file is downloading now.');
    } catch (err) {
      if (loadingId) toast.dismiss(loadingId);
      mascotErrorToast('Export failed.', 'Please try again or contact support.');
    } finally {
      setDownloadingData(false);
    }
  };

  // E3: Select action for an admin org; lazy-load members when 'transfer' is chosen
  var handleOrgAction = async function (orgId, action) {
    setAdminOrgResolutions(function (prev) {
      return { ...prev, [orgId]: { ...prev[orgId], action: action, transferTo: '', confirmingDelete: false } };
    });
    if (action === 'transfer') {
      setAdminOrgResolutions(function (prev) {
        return { ...prev, [orgId]: { ...prev[orgId], action: 'transfer', loadingMembers: true } };
      });
      try {
        var membersRes = await supabase
          .from('memberships')
          .select('member_id, role, members(first_name, last_name)')
          .eq('organization_id', orgId)
          .eq('status', 'active')
          .neq('member_id', currentUser.id);
        setAdminOrgResolutions(function (prev) {
          return { ...prev, [orgId]: { ...prev[orgId], members: membersRes.data || [], loadingMembers: false } };
        });
      } catch (err) {
        setAdminOrgResolutions(function (prev) {
          return { ...prev, [orgId]: { ...prev[orgId], loadingMembers: false } };
        });
        toast.error('Failed to load members');
      }
    }
  };

  var handleTransferAdmin = async function (orgId) {
    var resolution = adminOrgResolutions[orgId];
    if (!resolution.transferTo) { toast.error('Please select a member to transfer admin to'); return; }
    try {
      setResolvingOrg(orgId);
      var transferRes = await supabase.from('memberships')
        .update({ role: 'admin' })
        .eq('organization_id', orgId)
        .eq('member_id', resolution.transferTo);
      if (transferRes.error) throw transferRes.error;
      await supabase.from('memberships')
        .update({ role: 'member' })
        .eq('organization_id', orgId)
        .eq('member_id', currentUser.id);
      setAdminOrgResolutions(function (prev) {
        return { ...prev, [orgId]: { ...prev[orgId], resolved: true } };
      });
      mascotSuccessToast('Admin transferred!');
    } catch (err) {
      mascotErrorToast('Transfer failed.', 'Please try again.');
    } finally {
      setResolvingOrg(null);
    }
  };

  var handleDeleteOrg = async function (orgId, orgName) {
    try {
      setResolvingOrg(orgId);
      var deleteRes = await supabase.from('organizations').delete().eq('id', orgId);
      if (deleteRes.error) throw deleteRes.error;
      setAdminOrgResolutions(function (prev) {
        return { ...prev, [orgId]: { ...prev[orgId], resolved: true } };
      });
      mascotSuccessToast(orgName + ' deleted.');
    } catch (err) {
      mascotErrorToast('Failed to delete organization.');
    } finally {
      setResolvingOrg(null);
    }
  };

  var handleDeleteAccount = async function () {
    if (deleteConfirmText !== 'DELETE') { toast.error('Please type DELETE to confirm'); return; }
    try {
      setDeleting(true);
      var authRes7 = await supabase.auth.getUser();
      var user = authRes7.data.user;
      await supabase.from('memberships').delete().eq('member_id', user.id);
      await supabase.from('members').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      mascotErrorToast('Failed to delete account.', 'Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  var allAdminOrgsResolved = adminOrgs.length === 0 ||
    Object.values(adminOrgResolutions).every(function (r) { return r.resolved; });

  var Toggle = function ({ checked, onChange, label, id }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer select-none">{label}</label>
        <button
          id={id} role="switch" aria-checked={checked} onClick={onChange}
          className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ' + (checked ? 'bg-blue-600' : 'bg-gray-200')}
          aria-label={label}
        >
          <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' + (checked ? 'translate-x-6' : 'translate-x-1')} />
        </button>
      </div>
    );
  };

  var initials = form.full_name
    ? form.full_name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2)
    : (currentUser?.email?.charAt(0).toUpperCase() || '?');

  var navItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'password', label: 'Password' },
    { id: 'account', label: 'Account' },
  ];

  // Skeleton loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8" aria-busy="true" aria-label="Loading account settings">
          <div className="mb-6">
            <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-7 w-52 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-6 items-start">
            <div className="w-56 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              {[1, 2, 3, 4].map(function (i) {
                return (
                  <div key={i} className="px-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                );
              })}
            </div>
            <div className="flex-1 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="space-y-2">
                    <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="h-5 w-44 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back + Title */}
        <div className="mb-6">
          <button
            onClick={function () { navigate('/dashboard'); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mb-3"
            aria-label="Back to dashboard"
          >
            <span aria-hidden="true">←</span> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 text-sm mt-1">Manage your profile and account preferences</p>
        </div>

        <div className="flex gap-6 items-start">

          {/* SIDEBAR */}
          <aside className="w-56 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24"
            aria-label="Settings navigation">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {photoPreview ? (
                  <img src={photoPreview} alt="Your profile photo"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    aria-hidden="true">{initials}</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {form.full_name || currentUser?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
            </div>
            <nav aria-label="Account settings sections">
              {navItems.map(function (item) {
                return (
                  <button
                    key={item.id}
                    onClick={function () { setActiveSection(item.id); }}
                    className={'w-full text-left px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 border-l-2 ' +
                      (activeSection === item.id
                        ? 'text-blue-600 bg-blue-50 border-l-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-transparent')}
                    aria-current={activeSection === item.id ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* CONTENT */}
          <div className="flex-1 min-w-0">

            {/* ── PROFILE ── */}
            {activeSection === 'profile' && (
              <div className="space-y-6">

                {/* Photo */}
                <section className="bg-white rounded-lg border border-gray-200 p-6"
                  aria-labelledby="photo-heading">
                  <h2 id="photo-heading" className="text-base font-semibold text-gray-900 mb-4">Profile Photo</h2>
                  <div className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Your profile photo"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold"
                          aria-hidden="true">{initials}</div>
                      )}
                      {uploadingPhoto && (
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*"
                        onChange={handlePhotoChange} className="sr-only"
                        id="photo-upload" aria-label="Upload profile photo" />
                      <button onClick={handlePhotoClick} disabled={uploadingPhoto}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      {photoPreview && (
                        <button onClick={handleDeletePhoto}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                          Remove Photo
                        </button>
                      )}
                      <p className="text-xs text-gray-500">JPG, PNG or GIF · Max 5MB</p>
                    </div>
                  </div>
                </section>

                {/* Profile Info — E1: phone removed */}
                <section className="bg-white rounded-lg border border-gray-200 p-6"
                  aria-labelledby="profile-heading">
                  <h2 id="profile-heading" className="text-base font-semibold text-gray-900 mb-4">Profile Information</h2>
                  <form onSubmit={handleSave} noValidate>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input id="full_name" name="full_name" type="text"
                          value={form.full_name} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Your full name" autoComplete="name" />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input id="email" name="email" type="email"
                          value={form.email} onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="your@email.com" autoComplete="email" />
                        <p className="text-xs text-gray-500 mt-1">
                          Changing email requires confirmation via a link sent to the new address.
                        </p>
                      </div>
                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                          Bio <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea id="bio" name="bio" value={form.bio} onChange={handleChange}
                          rows={3} maxLength={300}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                          placeholder="A short bio visible to organization members" />
                        <p className="text-xs text-gray-500 mt-1 text-right">{form.bio.length}/300</p>
                      </div>
                      <div className="pt-1">
                        <button type="submit" disabled={saving}
                          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </form>
                </section>
              </div>
            )}

            {/* ── PRIVACY — E1: show_phone toggle removed ── */}
            {activeSection === 'privacy' && (
              <section className="bg-white rounded-lg border border-gray-200 p-6"
                aria-labelledby="privacy-heading">
                <h2 id="privacy-heading" className="text-base font-semibold text-gray-900 mb-1">Privacy Settings</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Control what information is visible to members in each organization.
                </p>
                {organizations.length === 0 ? (
                  <p className="text-gray-500 text-sm">You are not a member of any organizations yet.</p>
                ) : (
                  <div className="space-y-5">
                    {organizations.map(function (org) {
                      return (
                        <div key={org.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <p className="font-semibold text-gray-900 text-sm">{org.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{org.role}</p>
                          </div>
                          <Toggle
                            id={'email-' + org.id}
                            label="Share email address with members"
                            checked={privacySettings[org.id]?.show_email ?? false}
                            onChange={function () { handlePrivacyToggle(org.id, 'show_email'); }}
                          />
                          <Toggle
                            id={'bio-' + org.id}
                            label="Share bio with members"
                            checked={privacySettings[org.id]?.show_bio ?? true}
                            onChange={function () { handlePrivacyToggle(org.id, 'show_bio'); }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {organizations.length > 0 && (
                  <div className="mt-6">
                    <button onClick={handleSavePrivacy} disabled={savingPrivacy}
                      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                      {savingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ── PASSWORD ── */}
            {activeSection === 'password' && (
              <section className="bg-white rounded-lg border border-gray-200 p-6"
                aria-labelledby="password-heading">
                <h2 id="password-heading" className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
                <form onSubmit={handlePasswordChange} noValidate className="max-w-sm">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input id="newPassword" name="newPassword" type="password"
                        value={passwordForm.newPassword}
                        onChange={function (e) { setPasswordForm(function (prev) { return { ...prev, newPassword: e.target.value }; }); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Min. 8 characters" autoComplete="new-password" minLength={8} />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input id="confirmPassword" name="confirmPassword" type="password"
                        value={passwordForm.confirmPassword}
                        onChange={function (e) { setPasswordForm(function (prev) { return { ...prev, confirmPassword: e.target.value }; }); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Repeat new password" autoComplete="new-password" />
                    </div>
                    <button type="submit"
                      disabled={changingPassword || !passwordForm.newPassword}
                      className="px-6 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* ── ACCOUNT ── */}
            {activeSection === 'account' && (
              <div className="space-y-6">

                {/* Sign Out */}
                <section className="bg-white rounded-lg border border-gray-200 p-6"
                  aria-labelledby="signout-heading">
                  <h2 id="signout-heading" className="text-base font-semibold text-gray-900 mb-2">Sign Out</h2>
                  <p className="text-sm text-gray-600 mb-4">Sign out of your Syndicade account on this device.</p>
                  <button
                    onClick={async function () { await supabase.auth.signOut(); navigate('/login'); }}
                    className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm">
                    Sign Out
                  </button>
                </section>

                {/* E2: Download My Data */}
                <section className="bg-white rounded-lg border border-gray-200 p-6"
                  aria-labelledby="download-heading">
                  <h2 id="download-heading" className="text-base font-semibold text-gray-900 mb-2">Download My Data</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Export a copy of your Syndicade data — profile, memberships, event history, messages, and more — as a JSON file.
                  </p>
                  <button
                    onClick={handleDownloadData}
                    disabled={downloadingData}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 border border-gray-300 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 text-sm"
                  >
                    <Download size={15} aria-hidden="true" />
                    {downloadingData ? 'Preparing...' : 'Download My Data'}
                  </button>
                </section>

                {/* E3 + Delete Account */}
                <section className="bg-white rounded-lg border border-red-200 p-6"
                  aria-labelledby="delete-heading">
                  <h2 id="delete-heading" className="text-base font-semibold text-red-700 mb-4">Delete Account</h2>

                  {/* E3: Admin org resolution flow */}
                  {adminOrgs.length > 0 && !allAdminOrgsResolved && (
                    <div className="mb-6 space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4" role="alert">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800 mb-1">Action required before deletion</p>
                            <p className="text-sm text-amber-700">
                              You are an admin of the organizations below. Transfer admin rights to another member or permanently delete each organization before your account can be removed.
                            </p>
                          </div>
                        </div>
                      </div>

                      {adminOrgs.map(function (org) {
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
                          <div key={org.id} className="border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-900 mb-3">{org.name}</p>

                            {/* Action toggle */}
                            <div className="flex gap-2 mb-4" role="group" aria-label={'Action for ' + org.name}>
                              <button
                                onClick={function () { handleOrgAction(org.id, 'transfer'); }}
                                aria-pressed={res.action === 'transfer'}
                                className={'px-4 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
                                  (res.action === 'transfer'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}
                              >
                                Transfer Admin
                              </button>
                              <button
                                onClick={function () { handleOrgAction(org.id, 'delete'); }}
                                aria-pressed={res.action === 'delete'}
                                className={'px-4 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ' +
                                  (res.action === 'delete'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}
                              >
                                Delete Organization
                              </button>
                            </div>

                            {/* Transfer panel */}
                            {res.action === 'transfer' && (
                              <div className="space-y-3">
                                {res.loadingMembers ? (
                                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse" aria-label="Loading members" />
                                ) : res.members.length === 0 ? (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-sm text-amber-700">
                                      No other active members in this organization. You must delete it instead.
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <label htmlFor={'transfer-' + org.id} className="block text-sm font-medium text-gray-700 mb-1">
                                        Transfer admin to:
                                      </label>
                                      <select
                                        id={'transfer-' + org.id}
                                        value={res.transferTo}
                                        onChange={function (e) {
                                          var val = e.target.value;
                                          setAdminOrgResolutions(function (prev) {
                                            return { ...prev, [org.id]: { ...prev[org.id], transferTo: val } };
                                          });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                      >
                                        <option value="">Select a member...</option>
                                        {res.members.map(function (m) {
                                          var name = ((m.members?.first_name || '') + ' ' + (m.members?.last_name || '')).trim() || 'Member';
                                          return <option key={m.member_id} value={m.member_id}>{name}</option>;
                                        })}
                                      </select>
                                    </div>
                                    <button
                                      onClick={function () { handleTransferAdmin(org.id); }}
                                      disabled={!res.transferTo || resolvingOrg === org.id}
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
                                      <UserCheck size={14} aria-hidden="true" />
                                      {resolvingOrg === org.id ? 'Transferring...' : 'Confirm Transfer'}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Delete org panel */}
                            {res.action === 'delete' && (
                              <div className="space-y-3">
                                {!res.confirmingDelete ? (
                                  <button
                                    onClick={function () {
                                      setAdminOrgResolutions(function (prev) {
                                        return { ...prev, [org.id]: { ...prev[org.id], confirmingDelete: true } };
                                      });
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                                    <Trash2 size={14} aria-hidden="true" />
                                    Delete {org.name}
                                  </button>
                                ) : (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3" role="alert">
                                    <p className="text-sm font-medium text-red-700">
                                      This will permanently delete <strong>{org.name}</strong> and all its data. This cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={function () { handleDeleteOrg(org.id, org.name); }}
                                        disabled={resolvingOrg === org.id}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50">
                                        {resolvingOrg === org.id ? 'Deleting...' : 'Yes, Delete Organization'}
                                      </button>
                                      <button
                                        onClick={function () {
                                          setAdminOrgResolutions(function (prev) {
                                            return { ...prev, [org.id]: { ...prev[org.id], confirmingDelete: false } };
                                          });
                                        }}
                                        className="px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Delete account — shown only when all admin orgs resolved */}
                  {allAdminOrgsResolved ? (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        Permanently delete your account and all associated data. This cannot be undone.
                      </p>
                      {!showDeleteConfirm ? (
                        <button
                          onClick={function () { setShowDeleteConfirm(true); }}
                          className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm">
                          Delete My Account
                        </button>
                      ) : (
                        <div className="space-y-3 max-w-sm">
                          <p className="text-sm font-medium text-red-700">
                            Type <strong>DELETE</strong> to confirm:
                          </p>
                          <input
                            type="text" value={deleteConfirmText}
                            onChange={function (e) { setDeleteConfirmText(e.target.value); }}
                            className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                            placeholder="Type DELETE here"
                            aria-label="Type DELETE to confirm account deletion"
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={handleDeleteAccount}
                              disabled={deleting || deleteConfirmText !== 'DELETE'}
                              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                              {deleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                              onClick={function () { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                              className="px-6 py-2 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Resolve all organization issues above before deleting your account.
                    </p>
                  )}
                </section>

              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default AccountSettings;