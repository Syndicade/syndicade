import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function AccountSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('profile');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [privacySettings, setPrivacySettings] = useState({});
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [adminOrgs, setAdminOrgs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { navigate('/login'); return; }
      setCurrentUser(user);

      const { data: member } = await supabase
        .from('members').select('*').eq('user_id', user.id).single();

      if (member) {
        setMemberProfile(member);
        setPhotoPreview(member.profile_photo_url || null);
        setForm({
          full_name: (member.first_name || '') + (member.last_name ? ' ' + member.last_name : ''),
          email: user.email || '',
          phone: member.phone || '',
          bio: member.bio || '',
        });
      } else {
        setForm({
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: '',
          bio: '',
        });
      }

      const { data: memberships } = await supabase
        .from('memberships')
        .select('role, organization_id, organizations(id, name)')
        .eq('member_id', user.id)
        .eq('status', 'active');

      const orgs = (memberships || []).map(m => ({
        id: m.organizations.id,
        name: m.organizations.name,
        role: m.role,
      }));
      setOrganizations(orgs);
      setAdminOrgs(orgs.filter(o => o.role === 'admin'));

      const orgIds = orgs.map(o => o.id);
      if (orgIds.length > 0) {
        const { data: privacy } = await supabase
          .from('member_privacy').select('*')
          .eq('user_id', user.id).in('organization_id', orgIds);

        const privacyMap = {};
        orgs.forEach(org => {
          const existing = (privacy || []).find(p => p.organization_id === org.id);
          privacyMap[org.id] = {
            show_email: existing?.show_email ?? false,
            show_phone: existing?.show_phone ?? false,
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

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoClick = () => { fileInputRef.current?.click(); };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setPhotoPreview(URL.createObjectURL(file));
    try {
      setUploadingPhoto(true);
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const filePath = 'profiles/profile-' + user.id + '-' + Date.now() + '.' + fileExt;
      const { error: uploadError } = await supabase.storage
        .from('member-photos').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('member-photos').getPublicUrl(filePath);
      await supabase.from('members')
        .upsert({ user_id: user.id, profile_photo_url: publicUrl }, { onConflict: 'user_id' });
      setPhotoPreview(publicUrl);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error('Failed to upload photo');
      setPhotoPreview(memberProfile?.profile_photo_url || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('members')
        .upsert({ user_id: user.id, profile_photo_url: null }, { onConflict: 'user_id' });
      setPhotoPreview(null);
      toast.success('Photo removed');
    } catch (err) {
      toast.error('Failed to remove photo');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const nameParts = form.full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.auth.updateUser({ data: { full_name: form.full_name.trim() } });
      if (form.email !== currentUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: form.email });
        if (emailError) throw emailError;
        toast.success('Confirmation email sent to ' + form.email);
      }
      const { error: memberError } = await supabase.from('members').upsert({
        user_id: user.id, first_name: firstName, last_name: lastName,
        phone: form.phone, bio: form.bio,
      }, { onConflict: 'user_id' });
      if (memberError) throw memberError;
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    try {
      setChangingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success('Password updated!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePrivacyToggle = (orgId, field) => {
    setPrivacySettings(prev => ({
      ...prev,
      [orgId]: { ...prev[orgId], [field]: !prev[orgId][field] }
    }));
  };

  const handleSavePrivacy = async () => {
    try {
      setSavingPrivacy(true);
      const { data: { user } } = await supabase.auth.getUser();
      const upserts = Object.entries(privacySettings).map(([orgId, settings]) => ({
        user_id: user.id, organization_id: orgId,
        show_email: settings.show_email,
        show_phone: settings.show_phone,
        show_bio: settings.show_bio,
      }));
      const { error } = await supabase.from('member_privacy')
        .upsert(upserts, { onConflict: 'user_id,organization_id' });
      if (error) throw error;
      toast.success('Privacy settings saved!');
    } catch (err) {
      toast.error('Failed to save privacy settings');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') { toast.error('Please type DELETE to confirm'); return; }
    try {
      setDeleting(true);
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('memberships').delete().eq('member_id', user.id);
      await supabase.from('members').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      toast.success('Account data removed.');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setDeleting(false);
    }
  };

  const Toggle = ({ checked, onChange, label, id }) => (
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

  const initials = form.full_name
    ? form.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (currentUser?.email?.charAt(0).toUpperCase() || '?');

  const navItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'password', label: 'Password' },
    { id: 'account', label: 'Account' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"
          role="status" aria-label="Loading account settings">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Back + Title */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
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

            {/* User info */}
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

            {/* Nav */}
            <nav aria-label="Account settings sections">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={'w-full text-left px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 border-l-2 ' +
                    (activeSection === item.id
                      ? 'text-blue-600 bg-blue-50 border-l-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-transparent')}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* CONTENT */}
          <div className="flex-1 min-w-0">

            {/* PROFILE SECTION */}
            {activeSection === 'profile' && (
              <div className="space-y-6">

                {/* Photo */}
                <section className="bg-white rounded-lg border border-gray-200 p-6"
                  aria-labelledby="photo-heading">
                  <h2 id="photo-heading" className="text-base font-semibold text-gray-900 mb-4">
                    Profile Photo
                  </h2>
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
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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

                {/* Profile Info */}
                <section className="bg-white rounded-lg border border-gray-200 p-6"
                  aria-labelledby="profile-heading">
                  <h2 id="profile-heading" className="text-base font-semibold text-gray-900 mb-4">
                    Profile Information
                  </h2>
                  <form onSubmit={handleSave} noValidate>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input id="full_name" name="full_name" type="text"
                            value={form.full_name} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Your full name" autoComplete="name" />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <input id="phone" name="phone" type="tel"
                            value={form.phone} onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="(555) 555-5555" autoComplete="tel" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
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

            {/* PRIVACY SECTION */}
            {activeSection === 'privacy' && (
              <section className="bg-white rounded-lg border border-gray-200 p-6"
                aria-labelledby="privacy-heading">
                <h2 id="privacy-heading" className="text-base font-semibold text-gray-900 mb-1">
                  Privacy Settings
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Control what information is visible to members in each organization.
                </p>

                {organizations.length === 0 ? (
                  <p className="text-gray-500 text-sm">You are not a member of any organizations yet.</p>
                ) : (
                  <div className="space-y-5">
                    {organizations.map((org) => (
                      <div key={org.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3 pb-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900 text-sm">{org.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{org.role}</p>
                        </div>
                        <Toggle
                          id={'email-' + org.id}
                          label="Share email address with members"
                          checked={privacySettings[org.id]?.show_email ?? false}
                          onChange={() => handlePrivacyToggle(org.id, 'show_email')}
                        />
                        <Toggle
                          id={'phone-' + org.id}
                          label="Share phone number with members"
                          checked={privacySettings[org.id]?.show_phone ?? false}
                          onChange={() => handlePrivacyToggle(org.id, 'show_phone')}
                        />
                        <Toggle
                          id={'bio-' + org.id}
                          label="Share bio with members"
                          checked={privacySettings[org.id]?.show_bio ?? true}
                          onChange={() => handlePrivacyToggle(org.id, 'show_bio')}
                        />
                      </div>
                    ))}
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

            {/* PASSWORD SECTION */}
            {activeSection === 'password' && (
              <section className="bg-white rounded-lg border border-gray-200 p-6"
                aria-labelledby="password-heading">
                <h2 id="password-heading" className="text-base font-semibold text-gray-900 mb-4">
                  Change Password
                </h2>
                <form onSubmit={handlePasswordChange} noValidate className="max-w-sm">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input id="newPassword" name="newPassword" type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Min. 8 characters" autoComplete="new-password" minLength={8} />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input id="confirmPassword" name="confirmPassword" type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
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

            {/* ACCOUNT SECTION */}
            {activeSection === 'account' && (
              <div className="space-y-6">

                {/* Sign Out */}
                <section className="bg-white rounded-lg border border-gray-200 p-6"
                  aria-labelledby="signout-heading">
                  <h2 id="signout-heading" className="text-base font-semibold text-gray-900 mb-2">
                    Sign Out
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign out of your Syndicade account on this device.
                  </p>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
                    className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm">
                    Sign Out
                  </button>
                </section>

                {/* Delete Account */}
                <section className="bg-white rounded-lg border border-red-200 p-6"
                  aria-labelledby="delete-heading">
                  <h2 id="delete-heading" className="text-base font-semibold text-red-700 mb-2">
                    Delete Account
                  </h2>

                  {adminOrgs.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4" role="alert">
                      <p className="text-sm font-semibold text-amber-800 mb-2">
                        You are an admin of the following organizations:
                      </p>
                      <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 mb-3">
                        {adminOrgs.map(org => (
                          <li key={org.id}>
                            <button
                              onClick={() => navigate('/organizations/' + org.id)}
                              className="underline hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded">
                              {org.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-amber-700">
                        Before deleting your account, please transfer admin rights to another member
                        or delete the organization if it no longer exists.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm">
                      Delete My Account
                    </button>
                  ) : (
                    <div className="space-y-3 max-w-sm">
                      <p className="text-sm font-medium text-red-700">
                        Type <strong>DELETE</strong> to confirm:
                      </p>
                      <input type="text" value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        placeholder="Type DELETE here"
                        aria-label="Type DELETE to confirm account deletion" />
                      <div className="flex gap-3">
                        <button onClick={handleDeleteAccount}
                          disabled={deleting || deleteConfirmText !== 'DELETE'}
                          className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 text-sm">
                          {deleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                          className="px-6 py-2 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
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