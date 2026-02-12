import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function OrgPageEditor() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeSection, setActiveSection] = useState('appearance');

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    logo_url: '',
    banner_url: '',
    social_links: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
    page_sections: { about: true, events: true, announcements: true, contact: true, join: true },
    is_public: false,
  });

  useEffect(() => { fetchOrg(); }, [organizationId]);

  async function fetchOrg() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data: membership } = await supabase
        .from('memberships').select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id).eq('status', 'active').single();
      if (!membership || membership.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/organizations/' + organizationId);
        return;
      }
      const { data, error } = await supabase
        .from('organizations').select('*').eq('id', organizationId).single();
      if (error) throw error;
      setOrg(data);
      setForm({
        name: data.name || '',
        tagline: data.tagline || '',
        description: data.description || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        website: data.website || '',
        logo_url: data.logo_url || '',
        banner_url: data.banner_url || '',
        social_links: data.social_links || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
        page_sections: data.page_sections || { about: true, events: true, announcements: true, contact: true, join: true },
        is_public: data.is_public || false,
      });
    } catch (err) {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file, type) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('File must be an image'); return; }
    const setter = type === 'banner' ? setUploadingBanner : setUploadingLogo;
    setter(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = organizationId + '/' + type + '-' + Date.now() + '.' + ext;
      const { error: uploadError } = await supabase.storage
        .from('organization-images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('organization-images').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, [type + '_url']: publicUrl }));
      toast.success((type === 'banner' ? 'Banner' : 'Logo') + ' uploaded!');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setter(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Organization name is required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('organizations').update({
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zip_code.trim(),
        website: form.website.trim(),
        logo_url: form.logo_url,
        banner_url: form.banner_url,
        social_links: form.social_links,
        page_sections: form.page_sections,
        is_public: form.is_public,
      }).eq('id', organizationId);
      if (error) throw error;
      toast.success('Page saved!');
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSocial(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, social_links: { ...prev.social_links, [name]: value } }));
  }

  function toggleSection(key) {
    setForm(prev => ({
      ...prev,
      page_sections: { ...prev.page_sections, [key]: !prev.page_sections[key] }
    }));
  }

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'info', label: 'Info', icon: '📝' },
    { id: 'contact', label: 'Contact', icon: '📬' },
    { id: 'social', label: 'Social', icon: '🔗' },
    { id: 'sections', label: 'Sections', icon: '🧩' },
    { id: 'publish', label: 'Publish', icon: '🌐' },
  ];

  const pageSectionLabels = {
    about: { label: 'About Us', icon: '📖', desc: 'Your mission and description' },
    events: { label: 'Upcoming Events', icon: '📅', desc: 'Auto-populated from your events' },
    announcements: { label: 'Latest News', icon: '📢', desc: 'Recent announcements' },
    contact: { label: 'Contact Info', icon: '📬', desc: 'Email, phone, and address' },
    join: { label: 'Join Us Form', icon: '🙋', desc: 'Contact form for new members' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-label="Loading page editor">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/organizations/' + organizationId)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded p-1 flex-shrink-0"
              aria-label="Back to dashboard"
            >
              Back
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">Edit Public Page</h1>
              <p className="text-sm text-gray-500 truncate">{org && org.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {org && org.slug && (
              <a
                href={"/org/" + org.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label="Preview public page in new tab"
              >
                Preview
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label={saving ? 'Saving changes' : 'Save changes'}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          <aside className="lg:w-48 flex-shrink-0">
            <nav aria-label="Page editor sections">
              <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {sections.map(function(s) {
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setActiveSection(s.id)}
                        className={
                          'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap ' +
                          (activeSection === s.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200')
                        }
                        aria-current={activeSection === s.id ? 'page' : undefined}
                      >
                        <span aria-hidden="true">{s.icon}</span> {s.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="flex-1 min-w-0" aria-label="Editor panel">

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                    <p className="text-gray-500 text-sm mt-1">Upload your logo and banner image</p>
                  </div>

                  <div className="p-6 border-b border-gray-100">
                    <p className="block text-sm font-semibold text-gray-900 mb-3" id="banner-label">
                      Banner Image
                      <span className="ml-2 text-xs font-normal text-gray-500">Recommended: 1200x300px, max 5MB</span>
                    </p>
                    <div
                      className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group"
                      style={{ minHeight: '140px' }}
                      onClick={() => bannerInputRef.current && bannerInputRef.current.click()}
                      onKeyDown={(e) => e.key === 'Enter' && bannerInputRef.current && bannerInputRef.current.click()}
                      tabIndex={0}
                      role="button"
                      aria-labelledby="banner-label"
                    >
                      {form.banner_url ? (
                        <div>
                          <img src={form.banner_url} alt="Organization banner" className="w-full h-36 object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white font-semibold text-sm">Change Banner</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-36 text-gray-400 group-hover:text-blue-500 transition-colors">
                          {uploadingBanner ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-center">Click to upload banner</p>
                              <p className="text-xs mt-1 text-center">PNG, JPG, WebP supported</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Upload banner image"
                      onChange={(e) => e.target.files && e.target.files[0] && uploadImage(e.target.files[0], 'banner')}
                    />
                    {form.banner_url && (
                      <button
                        onClick={() => setForm(prev => ({ ...prev, banner_url: '' }))}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                        aria-label="Remove banner image"
                      >
                        Remove banner
                      </button>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="block text-sm font-semibold text-gray-900 mb-3" id="logo-label">
                      Logo
                      <span className="ml-2 text-xs font-normal text-gray-500">Recommended: 200x200px, max 5MB</span>
                    </p>
                    <div className="flex items-center gap-5">
                      <div
                        className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center cursor-pointer group overflow-hidden flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => logoInputRef.current && logoInputRef.current.click()}
                        onKeyDown={(e) => e.key === 'Enter' && logoInputRef.current && logoInputRef.current.click()}
                        tabIndex={0}
                        role="button"
                        aria-labelledby="logo-label"
                      >
                        {form.logo_url ? (
                          <div>
                            <img src={form.logo_url} alt="Organization logo" className="w-full h-full object-contain bg-white p-1 rounded-full" />
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                              <span className="text-white text-xs font-semibold">Change</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500 transition-colors">
                            {uploadingLogo ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-hidden="true"></div>
                            ) : (
                              <p className="text-xs text-center leading-tight px-1">Add Logo</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">Organization Logo</p>
                        <p className="text-gray-500">Appears as a circle on your public page</p>
                        {form.logo_url && (
                          <button
                            onClick={() => setForm(prev => ({ ...prev, logo_url: '' }))}
                            className="text-red-600 hover:text-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                            aria-label="Remove logo"
                          >
                            Remove logo
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Upload logo image"
                      onChange={(e) => e.target.files && e.target.files[0] && uploadImage(e.target.files[0], 'logo')}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tagline</h3>
                  <label htmlFor="tagline" className="block text-sm font-semibold text-gray-700 mb-2">
                    Short Tagline
                    <span className="ml-2 text-xs font-normal text-gray-400">Shown under your organization name</span>
                  </label>
                  <input
                    id="tagline"
                    name="tagline"
                    type="text"
                    value={form.tagline}
                    onChange={handleField}
                    placeholder="e.g. Building a stronger community since 2010"
                    maxLength={120}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-describedby="tagline-count"
                  />
                  <p id="tagline-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">
                    {form.tagline.length}/120
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'info' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Organization Info</h2>
                  <p className="text-gray-500 text-sm mt-1">Basic information shown on your public page</p>
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="name" name="name" type="text" required aria-required="true"
                    value={form.name} onChange={handleField} maxLength={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    About / Mission Statement
                  </label>
                  <textarea
                    id="description" name="description" value={form.description} onChange={handleField}
                    rows={5} maxLength={1000}
                    placeholder="Tell visitors who you are, what you do, and why it matters..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    aria-describedby="description-count"
                  />
                  <p id="description-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">
                    {form.description.length}/1000
                  </p>
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
                  <input
                    id="website" name="website" type="url" value={form.website} onChange={handleField}
                    placeholder="https://yourorg.org"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {activeSection === 'contact' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
                  <p className="text-gray-500 text-sm mt-1">How people can reach your organization</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input id="contact_email" name="contact_email" type="email" value={form.contact_email} onChange={handleField}
                      placeholder="info@yourorg.org"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label htmlFor="contact_phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input id="contact_phone" name="contact_phone" type="tel" value={form.contact_phone} onChange={handleField}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <input id="address" name="address" type="text" value={form.address} onChange={handleField}
                    placeholder="123 Main St"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input id="city" name="city" type="text" value={form.city} onChange={handleField}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input id="state" name="state" type="text" value={form.state} onChange={handleField}
                      maxLength={2} placeholder="OH"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase" />
                  </div>
                  <div>
                    <label htmlFor="zip_code" className="block text-sm font-semibold text-gray-700 mb-2">ZIP</label>
                    <input id="zip_code" name="zip_code" type="text" value={form.zip_code} onChange={handleField}
                      maxLength={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'social' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Social Media Links</h2>
                  <p className="text-gray-500 text-sm mt-1">Add links to your social profiles (leave blank to hide)</p>
                </div>
                {[
                  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourorg' },
                  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourorg' },
                  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://twitter.com/yourorg' },
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourorg' },
                  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourorg' },
                ].map(function(item) {
                  return (
                    <div key={item.key}>
                      <label htmlFor={'social-' + item.key} className="block text-sm font-semibold text-gray-700 mb-2">
                        {item.label}
                      </label>
                      <input
                        id={'social-' + item.key}
                        name={item.key}
                        type="url"
                        value={form.social_links[item.key] || ''}
                        onChange={handleSocial}
                        placeholder={item.placeholder}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {activeSection === 'sections' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Page Sections</h2>
                  <p className="text-gray-500 text-sm mt-1">Choose which sections appear on your public page</p>
                </div>
                <ul className="space-y-3" aria-label="Toggle page sections">
                  {Object.entries(pageSectionLabels).map(function(entry) {
                    var key = entry[0];
                    var val = entry[1];
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggleSection(key)}
                          className={
                            'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ' +
                            (form.page_sections[key] ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60')
                          }
                          aria-pressed={form.page_sections[key]}
                          aria-label={(form.page_sections[key] ? 'Hide ' : 'Show ') + val.label + ' section'}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl" aria-hidden="true">{val.icon}</span>
                            <div>
                              <p className="font-semibold text-gray-900">{val.label}</p>
                              <p className="text-sm text-gray-500">{val.desc}</p>
                            </div>
                          </div>
                          <div
                            className={'w-12 h-6 rounded-full flex items-center transition-colors flex-shrink-0 ' + (form.page_sections[key] ? 'bg-blue-600' : 'bg-gray-300')}
                            aria-hidden="true"
                          >
                            <div className={'w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-0.5 ' + (form.page_sections[key] ? 'translate-x-6' : 'translate-x-0')} />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {activeSection === 'publish' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Publish Settings</h2>
                  <p className="text-gray-500 text-sm mb-6">Control whether your page is visible to the public</p>
                  <button
                    onClick={() => setForm(prev => ({ ...prev, is_public: !prev.is_public }))}
                    className={
                      'w-full flex items-center justify-between p-5 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
                      (form.is_public ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50')
                    }
                    aria-pressed={form.is_public}
                    aria-label={form.is_public ? 'Page is public, click to make private' : 'Page is private, click to make public'}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-lg font-bold text-gray-900">{form.is_public ? 'Page is Public' : 'Page is Private'}</p>
                        <p className="text-sm text-gray-600">
                          {form.is_public ? 'Anyone can find and view your public page' : 'Your page is hidden from the public'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={'w-14 h-7 rounded-full flex items-center transition-colors flex-shrink-0 ' + (form.is_public ? 'bg-green-500' : 'bg-gray-400')}
                      aria-hidden="true"
                    >
                      <div className={'w-6 h-6 rounded-full bg-white shadow transition-transform mx-0.5 ' + (form.is_public ? 'translate-x-7' : 'translate-x-0')} />
                    </div>
                  </button>
                </div>

                {org && org.slug && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Your Public URL</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-700 text-sm font-mono break-all flex-1">
                        {window.location.origin + "/org/" + org.slug}
                      </code>
                      <a
                        href={"/org/" + org.slug}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex-shrink-0"
                        aria-label="Open public page in new tab"
                      >
                        Open Page
                      </a>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Remember to Save</p>
                  <p className="text-sm text-amber-800">Click the Save button at the top of the page to apply all your changes.</p>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}