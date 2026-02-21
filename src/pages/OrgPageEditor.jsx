import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Simple hero, events list, footer navigation',
    preview: (
      <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
        <rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/>
        <rect x="8" y="8" width="60" height="10" fill="#d1d5db" rx="2"/>
        <rect x="100" y="8" width="52" height="10" fill="#d1d5db" rx="2"/>
        <rect x="8" y="24" width="80" height="8" fill="#374151" rx="2"/>
        <rect x="8" y="36" width="100" height="5" fill="#9ca3af" rx="2"/>
        <rect x="8" y="44" width="80" height="5" fill="#9ca3af" rx="2"/>
        <rect x="8" y="55" width="50" height="6" fill="#1d4ed8" rx="2"/>
        <rect x="8" y="65" width="70" height="4" fill="#374151" rx="1"/>
        <rect x="8" y="72" width="140" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="8" y="78" width="130" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="8" y="84" width="110" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/>
      </svg>
    )
  },
  {
    id: 'modern',
    name: 'Modern',
    description: '3-column layout with events, pages, and news',
    preview: (
      <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
        <rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/>
        <rect x="8" y="6" width="30" height="8" fill="#d1d5db" rx="2"/>
        <rect x="110" y="6" width="42" height="8" fill="#1d4ed8" rx="3"/>
        <rect x="8" y="20" width="100" height="9" fill="#374151" rx="2"/>
        <rect x="8" y="33" width="130" height="4" fill="#9ca3af" rx="1"/>
        <rect x="8" y="41" width="30" height="3" fill="#6b7280" rx="1"/>
        <rect x="8" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/>
        <rect x="57" y="41" width="30" height="3" fill="#6b7280" rx="1"/>
        <rect x="57" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/>
        <rect x="106" y="41" width="30" height="3" fill="#6b7280" rx="1"/>
        <rect x="106" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/>
        <rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/>
      </svg>
    )
  },
  {
    id: 'banner',
    name: 'Banner',
    description: 'Full-width banner image with name overlay',
    preview: (
      <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
        <rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/>
        <rect x="8" y="5" width="30" height="7" fill="#d1d5db" rx="2"/>
        <rect x="90" y="5" width="62" height="7" fill="#d1d5db" rx="2"/>
        <rect x="0" y="16" width="160" height="32" fill="#6b7280" rx="2"/>
        <rect x="30" y="24" width="100" height="8" fill="#ffffff" rx="2" opacity="0.9"/>
        <rect x="50" y="35" width="60" height="5" fill="#ffffff" rx="1" opacity="0.6"/>
        <rect x="8" y="54" width="60" height="5" fill="#374151" rx="1"/>
        <rect x="8" y="62" width="68" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="8" y="67" width="68" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="8" y="72" width="68" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="84" y="54" width="60" height="5" fill="#374151" rx="1"/>
        <rect x="84" y="62" width="68" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="84" y="67" width="50" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="84" y="72" width="58" height="3" fill="#e5e7eb" rx="1"/>
        <rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/>
      </svg>
    )
  },
  {
    id: 'sidebar',
    name: 'Sidebar Nav',
    description: 'Left sidebar navigation with main content area',
    preview: (
      <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
        <rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/>
        <rect x="8" y="5" width="30" height="7" fill="#d1d5db" rx="2"/>
        <rect x="90" y="5" width="62" height="7" fill="#1d4ed8" rx="3"/>
        <rect x="0" y="16" width="40" height="84" fill="#f3f4f6" rx="2"/>
        <rect x="4" y="20" width="32" height="4" fill="#374151" rx="1"/>
        <rect x="4" y="27" width="32" height="4" fill="#9ca3af" rx="1"/>
        <rect x="4" y="34" width="32" height="4" fill="#9ca3af" rx="1"/>
        <rect x="4" y="41" width="32" height="4" fill="#9ca3af" rx="1"/>
        <rect x="4" y="48" width="32" height="4" fill="#9ca3af" rx="1"/>
        <rect x="4" y="55" width="32" height="4" fill="#9ca3af" rx="1"/>
        <rect x="48" y="20" width="80" height="8" fill="#374151" rx="2"/>
        <rect x="48" y="32" width="104" height="4" fill="#9ca3af" rx="1"/>
        <rect x="48" y="40" width="55" height="5" fill="#6b7280" rx="1"/>
        <rect x="48" y="48" width="104" height="4" fill="#e5e7eb" rx="1"/>
        <rect x="48" y="55" width="104" height="4" fill="#e5e7eb" rx="1"/>
        <rect x="48" y="62" width="90" height="4" fill="#e5e7eb" rx="1"/>
        <rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/>
      </svg>
    )
  },
  {
    id: 'featured',
    name: 'Full Featured',
    description: 'Events, member spotlight, contact info, and more',
    preview: (
      <svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true">
        <rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/>
        <circle cx="16" cy="9" r="6" fill="#d1d5db"/>
        <rect x="26" y="5" width="30" height="7" fill="#d1d5db" rx="2"/>
        <rect x="110" y="5" width="42" height="7" fill="#1d4ed8" rx="3"/>
        <rect x="30" y="18" width="100" height="8" fill="#374151" rx="2"/>
        <rect x="40" y="30" width="80" height="4" fill="#9ca3af" rx="1"/>
        <rect x="45" y="37" width="32" height="6" fill="#1d4ed8" rx="2"/>
        <rect x="82" y="37" width="36" height="6" fill="#e5e7eb" rx="2"/>
        <rect x="8" y="48" width="68" height="5" fill="#374151" rx="1"/>
        <rect x="8" y="56" width="68" height="4" fill="#e5e7eb" rx="1"/>
        <rect x="8" y="62" width="68" height="4" fill="#e5e7eb" rx="1"/>
        <rect x="8" y="68" width="68" height="4" fill="#e5e7eb" rx="1"/>
        <rect x="84" y="48" width="68" height="5" fill="#374151" rx="1"/>
        <rect x="84" y="56" width="68" height="10" fill="#e5e7eb" rx="2"/>
        <rect x="84" y="70" width="68" height="10" fill="#e5e7eb" rx="2"/>
        <rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/>
      </svg>
    )
  }
];

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
  const [activeSection, setActiveSection] = useState('template');

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
    page_sections: { about: true, events: true, announcements: true, photos: true, members: false, contact: true, join: true },
    is_public: false,
    template: 'classic',
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
      const savedSections = data.page_sections || {};
      const savedSettings = data.settings || {};
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
        page_sections: {
          about: savedSections.about !== false,
          events: savedSections.events !== false,
          announcements: savedSections.announcements !== false,
          photos: savedSections.photos !== false,
          members: savedSections.members === true,
          contact: savedSections.contact !== false,
          join: savedSections.join !== false,
        },
        is_public: data.is_public || false,
        template: savedSettings.template || 'classic',
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
      const { data: existingOrg } = await supabase
        .from('organizations').select('settings').eq('id', organizationId).single();
      const updatedSettings = Object.assign({}, existingOrg ? existingOrg.settings || {} : {}, { template: form.template });

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
        settings: updatedSettings,
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

  const navSections = [
    { id: 'template', label: 'Template' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'info', label: 'Info' },
    { id: 'contact', label: 'Contact' },
    { id: 'social', label: 'Social' },
    { id: 'sections', label: 'Sections' },
    { id: 'publish', label: 'Publish' },
  ];

  const pageSectionLabels = {
    about: {
      label: 'About Us',
      desc: 'Your mission and description',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    events: {
      label: 'Upcoming Events',
      desc: 'Auto-populated from your events',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    announcements: {
      label: 'Latest News',
      desc: 'Recent announcements',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    photos: {
      label: 'Photo Gallery',
      desc: 'Images uploaded via org photos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    members: {
      label: 'Member Spotlight',
      desc: 'Showcase featured members publicly',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    contact: {
      label: 'Contact Info',
      desc: 'Email, phone, and address',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    join: {
      label: 'Join Us Form',
      desc: 'Contact form for new members',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-label="Loading page editor">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600 font-medium">Loading editor...</p>
        </div>
        <span className="sr-only">Loading page editor</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/organizations/' + organizationId)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded p-1 flex-shrink-0 text-sm font-medium"
              aria-label="Back to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="w-px h-6 bg-gray-200" aria-hidden="true"></div>
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
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
    Preview
  </a>
)}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label={saving ? 'Saving changes' : 'Save changes'}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar nav */}
          <aside className="lg:w-48 flex-shrink-0">
            <nav aria-label="Page editor sections">
              <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {navSections.map(function(s) {
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
                        {s.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main panel */}
          <main className="flex-1 min-w-0" aria-label="Editor panel">

            {/* TEMPLATE SECTION */}
            {activeSection === 'template' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Choose a Template</h2>
                <p className="text-gray-500 text-sm mb-6">Select the layout for your public organization page</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="radiogroup" aria-label="Page templates">
                  {TEMPLATES.map(function(t) {
                    var isSelected = form.template === t.id;
                    return (
                      <div key={t.id}>
                        <button
                          onClick={() => setForm(prev => ({ ...prev, template: t.id }))}
                          className={
                            'w-full rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
                            (isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm')
                          }
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={'Select ' + t.name + ' template: ' + t.description}
                        >
                          <div className="aspect-video bg-gray-50 rounded-lg overflow-hidden mb-3 border border-gray-100">
                            {t.preview}
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t.description}</p>
                            </div>
                            {isSelected && (
                              <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Tip:</span> Click Save after selecting a template, then use the Preview button to see how your page looks.
                  </p>
                </div>
              </div>
            )}

            {/* APPEARANCE SECTION */}
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
                        <div className="flex flex-col items-center justify-center h-36 text-gray-400 group-hover:text-blue-500 transition-colors gap-2">
                          {uploadingBanner ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm font-medium">Click to upload banner</p>
                              <p className="text-xs">PNG, JPG, WebP supported</p>
                            </>
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
                          <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500 transition-colors gap-1">
                            {uploadingLogo ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-hidden="true"></div>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                </svg>
                                <p className="text-xs text-center leading-tight px-1">Add Logo</p>
                              </>
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

            {/* INFO SECTION */}
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

            {/* CONTACT SECTION */}
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

            {/* SOCIAL SECTION */}
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

            {/* SECTIONS PANEL */}
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
                    var isOn = form.page_sections[key];
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggleSection(key)}
                          className={
                            'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ' +
                            (isOn ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60')
                          }
                          aria-pressed={isOn}
                          aria-label={(isOn ? 'Hide ' : 'Show ') + val.label + ' section'}
                        >
                          <div className="flex items-center gap-3">
                            {val.icon}
                            <div>
                              <p className="font-semibold text-gray-900">{val.label}</p>
                              <p className="text-sm text-gray-500">{val.desc}</p>
                            </div>
                          </div>
                          <div
                            className={'w-12 h-6 rounded-full flex items-center transition-colors flex-shrink-0 ' + (isOn ? 'bg-blue-600' : 'bg-gray-300')}
                            aria-hidden="true"
                          >
                            <div className={'w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-0.5 ' + (isOn ? 'translate-x-6' : 'translate-x-0')} />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* PUBLISH SECTION */}
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
                      <div className={
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ' +
                        (form.is_public ? 'bg-green-100' : 'bg-gray-200')
                      } aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" className={'h-5 w-5 ' + (form.is_public ? 'text-green-600' : 'text-gray-500')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                        </svg>
                      </div>
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