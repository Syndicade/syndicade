import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ── Icon helper ──────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth }) {
  var cls = className || 'h-5 w-5';
  var sw = strokeWidth || 2;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={path} />}
    </svg>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={'animate-pulse rounded-lg bg-gray-200 ' + (className || '')} aria-hidden="true" />;
}

function EditorSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" aria-busy="true" aria-label="Loading editor">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-6 w-px" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        <div className="w-48 flex-shrink-0 space-y-2">
          {[1,2,3,4,5,6,7,8,9].map(function(i) { return <Skeleton key={i} className="h-11 w-full" />; })}
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[1,2,3].map(function(i) { return <Skeleton key={i} className="h-40 w-full" />; })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────
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
        <rect x="8" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/>
        <rect x="57" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/>
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
        <rect x="84" y="54" width="60" height="5" fill="#374151" rx="1"/>
        <rect x="84" y="62" width="68" height="3" fill="#e5e7eb" rx="1"/>
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
        <rect x="48" y="20" width="80" height="8" fill="#374151" rx="2"/>
        <rect x="48" y="32" width="104" height="4" fill="#9ca3af" rx="1"/>
        <rect x="48" y="48" width="104" height="4" fill="#e5e7eb" rx="1"/>
        <rect x="48" y="55" width="104" height="4" fill="#e5e7eb" rx="1"/>
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
        <rect x="8" y="56" width="68" height="20" fill="#e5e7eb" rx="2"/>
        <rect x="84" y="48" width="68" height="5" fill="#374151" rx="1"/>
        <rect x="84" y="56" width="68" height="20" fill="#e5e7eb" rx="2"/>
        <rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/>
      </svg>
    )
  }
];

const FONT_PAIRINGS = [
  { id: 'inter',  label: 'Inter',       description: 'Clean & Modern',    sample: 'Inter / System UI'       },
  { id: 'serif',  label: 'Serif',       description: 'Classic & Formal',   sample: 'Georgia / Serif'         },
  { id: 'mono',   label: 'Mono',        description: 'Technical & Bold',   sample: 'Fira Code / Monospace'   },
];

// Color options replaced by custom hex inputs

const BUTTON_STYLES = [
  { id: 'rounded', label: 'Rounded',  previewClass: 'rounded-lg'  },
  { id: 'sharp',   label: 'Sharp',    previewClass: 'rounded-none' },
  { id: 'pill',    label: 'Pill',     previewClass: 'rounded-full' },
];

const DEFAULT_NAV_LINKS = [
  { id: 'home',    label: 'Home',    href: '#home',    type: 'anchor',   visible: true, system: true  },
  { id: 'about',   label: 'About',   href: '#about',   type: 'anchor',   visible: true, system: true  },
  { id: 'events',  label: 'Events',  href: '#events',  type: 'anchor',   visible: true, system: true  },
  { id: 'news',    label: 'News',    href: '#news',    type: 'anchor',   visible: true, system: true  },
  { id: 'contact', label: 'Contact', href: '#contact', type: 'anchor',   visible: true, system: true  },
];

const PAGE_SECTION_CONFIG = {
  about:         { label: 'About Us',          desc: 'Your mission and description'             },
  events:        { label: 'Upcoming Events',   desc: 'Auto-populated from your events'         },
  announcements: { label: 'Latest News',       desc: 'Recent announcements'                    },
  photos:        { label: 'Photo Gallery',     desc: 'Images uploaded via org photos'          },
  members:       { label: 'Member Spotlight',  desc: 'Showcase featured members publicly'      },
  contact:       { label: 'Contact Info',      desc: 'Email, phone, and address'               },
  join:          { label: 'Join Us Form',      desc: 'Contact form for new members'            },
};

// ── Input style helper ───────────────────────────────────────────────────────
var inputCls = 'w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
var labelCls = 'block text-sm font-semibold text-gray-700 mb-2';

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, id }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white flex-shrink-0 ' + (checked ? 'bg-blue-500' : 'bg-gray-300')}
    >
      <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ' + (checked ? 'left-[22px]' : 'left-0.5')} aria-hidden="true" />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrgPageEditor() {
  var { organizationId } = useParams();
  var navigate = useNavigate();
  var bannerInputRef = useRef(null);
  var logoInputRef = useRef(null);

  var [org, setOrg] = useState(null);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [uploadingBanner, setUploadingBanner] = useState(false);
  var [uploadingLogo, setUploadingLogo] = useState(false);
  var [activeSection, setActiveSection] = useState('template');
  var [newNavLink, setNewNavLink] = useState({ label: '', href: '' });
  var [showAddNav, setShowAddNav] = useState(false);

  var [form, setForm] = useState({
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
    theme: { primaryColor: '#3B82F6', fontPairing: 'inter', buttonStyle: 'rounded' },
    nav_links: DEFAULT_NAV_LINKS,
    publish_channels: { website: true, discovery: false },
  });

  useEffect(function() { fetchOrg(); }, [organizationId]);

  async function fetchOrg() {
    try {
      var userResult = await supabase.auth.getUser();
      var user = userResult.data.user;
      if (!user) { navigate('/login'); return; }

      var memberResult = await supabase
        .from('memberships').select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active').single();

      if (!memberResult.data || memberResult.data.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/organizations/' + organizationId);
        return;
      }

      var orgResult = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;

      var data = orgResult.data;
      setOrg(data);

      var savedSections = data.page_sections || {};
      var savedSettings = data.settings || {};

      setForm({
        name:          data.name || '',
        tagline:       data.tagline || '',
        description:   data.description || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        address:       data.address || '',
        city:          data.city || '',
        state:         data.state || '',
        zip_code:      data.zip_code || '',
        website:       data.website || '',
        logo_url:      data.logo_url || '',
        banner_url:    data.banner_url || '',
        social_links:  data.social_links || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
        page_sections: {
          about:         savedSections.about !== false,
          events:        savedSections.events !== false,
          announcements: savedSections.announcements !== false,
          photos:        savedSections.photos !== false,
          members:       savedSections.members === true,
          contact:       savedSections.contact !== false,
          join:          savedSections.join !== false,
        },
        is_public:        data.is_public || false,
        template:         savedSettings.template || 'classic',
        theme:            savedSettings.theme || { primaryColor: '#3B82F6', fontPairing: 'inter', buttonStyle: 'rounded' },
        nav_links:        savedSettings.nav_links || DEFAULT_NAV_LINKS,
        publish_channels: savedSettings.publish_channels || { website: true, discovery: false },
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
    var setter = type === 'banner' ? setUploadingBanner : setUploadingLogo;
    setter(true);
    try {
      var ext = file.name.split('.').pop();
      var fileName = organizationId + '/' + type + '-' + Date.now() + '.' + ext;
      var uploadResult = await supabase.storage.from('organization-images').upload(fileName, file, { upsert: true });
      if (uploadResult.error) throw uploadResult.error;
      var urlResult = supabase.storage.from('organization-images').getPublicUrl(fileName);
      var publicUrl = urlResult.data.publicUrl;
      setForm(function(prev) {
        var update = {};
        update[type + '_url'] = publicUrl;
        return Object.assign({}, prev, update);
      });
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
      var existingResult = await supabase.from('organizations').select('settings').eq('id', organizationId).single();
      var existingSettings = existingResult.data ? (existingResult.data.settings || {}) : {};

      var updatedSettings = Object.assign({}, existingSettings, {
        template:         form.template,
        theme:            form.theme,
        nav_links:        form.nav_links,
        publish_channels: form.publish_channels,
      });

      var updateResult = await supabase.from('organizations').update({
        name:          form.name.trim(),
        tagline:       form.tagline.trim(),
        description:   form.description.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        address:       form.address.trim(),
        city:          form.city.trim(),
        state:         form.state.trim(),
        zip_code:      form.zip_code.trim(),
        website:       form.website.trim(),
        logo_url:      form.logo_url,
        banner_url:    form.banner_url,
        social_links:  form.social_links,
        page_sections: form.page_sections,
        is_public:     form.is_public,
        settings:      updatedSettings,
      }).eq('id', organizationId);

      if (updateResult.error) throw updateResult.error;
      toast.success('Page saved!');
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleField(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(function(prev) {
      var update = {};
      update[name] = value;
      return Object.assign({}, prev, update);
    });
  }

  function handleSocial(e) {
    var name = e.target.name;
    var value = e.target.value;
    setForm(function(prev) {
      return Object.assign({}, prev, { social_links: Object.assign({}, prev.social_links, { [name]: value }) });
    });
  }

  function toggleSection(key) {
    setForm(function(prev) {
      var updated = Object.assign({}, prev.page_sections);
      updated[key] = !updated[key];
      return Object.assign({}, prev, { page_sections: updated });
    });
  }

  function setTheme(key, value) {
    setForm(function(prev) {
      return Object.assign({}, prev, { theme: Object.assign({}, prev.theme, { [key]: value }) });
    });
  }

  function setPublishChannel(key, value) {
    setForm(function(prev) {
      return Object.assign({}, prev, { publish_channels: Object.assign({}, prev.publish_channels, { [key]: value }) });
    });
  }

  // ── Nav link helpers ──────────────────────────────────────────────────────
  function moveNavLink(index, direction) {
    var links = form.nav_links.slice();
    var target = index + direction;
    if (target < 0 || target >= links.length) return;
    var temp = links[index];
    links[index] = links[target];
    links[target] = temp;
    setForm(function(prev) { return Object.assign({}, prev, { nav_links: links }); });
  }

  function toggleNavLink(index) {
    var links = form.nav_links.slice();
    links[index] = Object.assign({}, links[index], { visible: !links[index].visible });
    setForm(function(prev) { return Object.assign({}, prev, { nav_links: links }); });
  }

  function renameNavLink(index, label) {
    var links = form.nav_links.slice();
    links[index] = Object.assign({}, links[index], { label: label });
    setForm(function(prev) { return Object.assign({}, prev, { nav_links: links }); });
  }

  function removeNavLink(index) {
    var links = form.nav_links.filter(function(_, i) { return i !== index; });
    setForm(function(prev) { return Object.assign({}, prev, { nav_links: links }); });
  }

  function addExternalLink() {
    if (!newNavLink.label.trim() || !newNavLink.href.trim()) {
      toast.error('Please enter both a label and URL');
      return;
    }
    var href = newNavLink.href.trim();
    if (!href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#')) {
      href = 'https://' + href;
    }
    var newLink = {
      id: 'custom-' + Date.now(),
      label: newNavLink.label.trim(),
      href: href,
      type: 'external',
      visible: true,
      system: false,
    };
    setForm(function(prev) {
      return Object.assign({}, prev, { nav_links: prev.nav_links.concat([newLink]) });
    });
    setNewNavLink({ label: '', href: '' });
    setShowAddNav(false);
    toast.success('Link added');
  }

  // ── Sidebar nav sections ─────────────────────────────────────────────────
  var navSections = [
    { id: 'template',   label: 'Template'    },
    { id: 'appearance', label: 'Appearance'  },
    { id: 'theme',      label: 'Theme'       },
    { id: 'navigation', label: 'Navigation'  },
    { id: 'info',       label: 'Info'        },
    { id: 'contact',    label: 'Contact'     },
    { id: 'social',     label: 'Social'      },
    { id: 'sections',   label: 'Sections'    },
    { id: 'publish',    label: 'Publish'     },
  ];

  if (loading) return <EditorSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Skip link */}
      <a
        href="#editor-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none"
      >
        Skip to editor
      </a>

      {/* ── Sticky top bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={function() { navigate('/organizations/' + organizationId); }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded p-1 flex-shrink-0 text-sm font-medium transition-colors"
              aria-label="Back to dashboard"
            >
              <Icon path="M15 19l-7-7 7-7" className="h-4 w-4" />
              Back
            </button>
            <div className="w-px h-6 bg-gray-200" aria-hidden="true" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">Website Builder</h1>
              <p className="text-xs text-gray-500 truncate">{org && org.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {org && org.slug && (
              <a
                href={'/org/' + org.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label="Preview public page in new tab"
              >
                <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="h-4 w-4" />
                Preview
              </a>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              aria-label={saving ? 'Saving changes' : 'Save changes'}
              aria-busy={saving}
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
                  <Icon path="M5 13l4 4L19 7" className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar nav ── */}
          <aside className="lg:w-48 flex-shrink-0">
            <nav aria-label="Page editor sections">
              <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {navSections.map(function(s) {
                  var isActive = activeSection === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={function() { setActiveSection(s.id); }}
                        className={
                          'flex items-center px-4 py-3 rounded-lg text-sm font-medium w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap ' +
                          (isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200')
                        }
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {s.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* ── Main panel ── */}
          <main id="editor-main" className="flex-1 min-w-0" aria-label="Editor panel">

            {/* ════════════════════ TEMPLATE ════════════════════ */}
            {activeSection === 'template' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Template</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose a Layout</h2>
                <p className="text-gray-500 text-sm mb-6">Select how your public organization page is displayed</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="radiogroup" aria-label="Page templates">
                  {TEMPLATES.map(function(t) {
                    var isSelected = form.template === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { template: t.id }); }); }}
                        className={
                          'rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white ' +
                          (isSelected ? 'border-blue-500 bg-gray-100 shadow-lg shadow-blue-500/10' : 'border-gray-200 bg-gray-50 hover:border-[#3B82F6]')
                        }
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={'Select ' + t.name + ' template: ' + t.description}
                      >
                        <div className="aspect-video bg-white rounded-lg overflow-hidden mb-3 border border-gray-200">
                          {t.preview}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t.description}</p>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                              <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-blue-400" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-amber-600">Tip:</span> Save after selecting a template, then use Preview to see your page.
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════ APPEARANCE ════════════════════ */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Appearance</p>
                    <h2 className="text-2xl font-bold text-gray-900">Logo & Banner</h2>
                    <p className="text-gray-500 text-sm mt-1">Upload your organization's visual identity</p>
                  </div>

                  {/* Banner */}
                  <div className="p-6 border-b border-gray-200">
                    <p className="block text-sm font-semibold text-gray-500 mb-1" id="banner-label">
                      Banner Image
                      <span className="ml-2 text-xs font-normal text-gray-400">Recommended: 1200x300px, max 5MB</span>
                    </p>
                    <div
                      className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-500 transition-colors cursor-pointer group"
                      style={{ minHeight: '140px' }}
                      onClick={function() { bannerInputRef.current && bannerInputRef.current.click(); }}
                      onKeyDown={function(e) { e.key === 'Enter' && bannerInputRef.current && bannerInputRef.current.click(); }}
                      tabIndex={0}
                      role="button"
                      aria-labelledby="banner-label"
                    >
                      {form.banner_url ? (
                        <div>
                          <img src={form.banner_url} alt="Organization banner" className="w-full h-36 object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-gray-900 font-semibold text-sm">Change Banner</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-36 text-gray-400 group-hover:text-blue-400 transition-colors gap-2">
                          {uploadingBanner ? (
                            <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <>
                              <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="h-8 w-8" strokeWidth={1.5} />
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
                      onChange={function(e) { e.target.files && e.target.files[0] && uploadImage(e.target.files[0], 'banner'); }}
                    />
                    {form.banner_url && (
                      <button
                        onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { banner_url: '' }); }); }}
                        className="mt-2 text-sm text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors"
                        aria-label="Remove banner image"
                      >
                        Remove banner
                      </button>
                    )}
                  </div>

                  {/* Logo */}
                  <div className="p-6">
                    <p className="block text-sm font-semibold text-gray-500 mb-3" id="logo-label">
                      Logo
                      <span className="ml-2 text-xs font-normal text-gray-400">Recommended: 200x200px, max 5MB</span>
                    </p>
                    <div className="flex items-center gap-5">
                      <div
                        className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-200 hover:border-blue-500 flex items-center justify-center cursor-pointer group overflow-hidden flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={function() { logoInputRef.current && logoInputRef.current.click(); }}
                        onKeyDown={function(e) { e.key === 'Enter' && logoInputRef.current && logoInputRef.current.click(); }}
                        tabIndex={0}
                        role="button"
                        aria-labelledby="logo-label"
                      >
                        {form.logo_url ? (
                          <div>
                            <img src={form.logo_url} alt="Organization logo" className="w-full h-full object-contain bg-gray-100 p-1 rounded-full" />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                              <span className="text-white text-xs font-semibold">Change</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-400 transition-colors gap-1">
                            {uploadingLogo ? (
                              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                            ) : (
                              <>
                                <Icon path="M12 4v16m8-8H4" className="h-6 w-6" strokeWidth={1.5} />
                                <p className="text-xs text-center leading-tight px-1">Add Logo</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-gray-900">Organization Logo</p>
                        <p className="text-gray-500 text-xs">Appears as a circle on your public page</p>
                        {form.logo_url && (
                          <button
                            onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { logo_url: '' }); }); }}
                            className="text-red-400 hover:text-red-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors"
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
                      onChange={function(e) { e.target.files && e.target.files[0] && uploadImage(e.target.files[0], 'logo'); }}
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tagline</h3>
                  <label htmlFor="tagline" className={labelCls}>
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
                    className={inputCls}
                    aria-describedby="tagline-count"
                  />
                  <p id="tagline-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">
                    {form.tagline.length}/120
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════ THEME ════════════════════ */}
            {activeSection === 'theme' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Theme</p>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Brand Colors</h2>
                  <p className="text-gray-500 text-sm mb-6">Enter up to 3 hex color codes for your public page buttons and accents</p>
                  <div className="space-y-4">
                    {[0, 1, 2].map(function(i) {
                      var colors = form.theme.customColors || ['#3B82F6', '', ''];
                      var val = colors[i] || '';
                      var isValid = /^#([0-9A-Fa-f]{3}){1,2}$/.test(val);
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-gray-200 flex-shrink-0 transition-all"
                            style={{ background: isValid ? val : '#f3f4f6' }}
                            aria-hidden="true"
                          />
                          <div className="flex-1">
                            <label htmlFor={'color-' + i} className={labelCls}>
                              {'Brand Color ' + (i + 1) + (i === 0 ? ' (Primary)' : ' (Optional)')}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                id={'color-' + i}
                                type="text"
                                value={val}
                                onChange={function(e) {
                                  var newColors = (form.theme.customColors || ['#3B82F6', '', '']).slice();
                                  newColors[i] = e.target.value;
                                  setTheme('customColors', newColors);
                                }}
                                placeholder="#3B82F6"
                                maxLength={7}
                                className={inputCls + ' font-mono uppercase'}
                                aria-describedby={'color-' + i + '-hint'}
                              />
                              <input
                                type="color"
                                value={isValid ? val : '#3B82F6'}
                                onChange={function(e) {
                                  var newColors = (form.theme.customColors || ['#3B82F6', '', '']).slice();
                                  newColors[i] = e.target.value.toUpperCase();
                                  setTheme('customColors', newColors);
                                }}
                                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer flex-shrink-0 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label={'Color picker for brand color ' + (i + 1)}
                              />
                            </div>
                            <p id={'color-' + i + '-hint'} className="text-xs text-gray-400 mt-1">
                              {val && !isValid ? 'Enter a valid hex code (e.g. #3B82F6)' : 'Enter a hex code or use the color picker'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Font Pairing</h3>
                  <p className="text-gray-500 text-sm mb-5">Choose the typography style for your public page</p>
                  <div className="space-y-3" role="radiogroup" aria-label="Font pairing options">
                    {FONT_PAIRINGS.map(function(fp) {
                      var isSelected = form.theme.fontPairing === fp.id;
                      return (
                        <button
                          key={fp.id}
                          onClick={function() { setTheme('fontPairing', fp.id); }}
                          className={
                            'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ' +
                            (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300')
                          }
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={fp.label + ': ' + fp.description}
                        >
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{fp.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{fp.description}</p>
                            <p className="text-xs text-gray-400 mt-1 font-mono">{fp.sample}</p>
                          </div>
                          {isSelected && <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Button Style</h3>
                  <p className="text-gray-500 text-sm mb-5">Choose how buttons look on your public page</p>
                  <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Button style options">
                    {BUTTON_STYLES.map(function(bs) {
                      var isSelected = form.theme.buttonStyle === bs.id;
                      return (
                        <button
                          key={bs.id}
                          onClick={function() { setTheme('buttonStyle', bs.id); }}
                          className={
                            'p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center ' +
                            (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300')
                          }
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={'Button style: ' + bs.label}
                        >
                          <div className="flex justify-center mb-3">
                            <span className={'px-4 py-1.5 bg-blue-600 text-white text-xs font-bold ' + bs.previewClass} aria-hidden="true">
                              Button
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{bs.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Note:</span> Theme settings are saved with your page. Click Save at the top to apply.
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════ NAVIGATION ════════════════════ */}
            {activeSection === 'navigation' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Navigation</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Manage Nav Links</h2>
                  <p className="text-gray-500 text-sm mb-6">Control which links appear in your public page navigation</p>

                  <ul className="space-y-2" aria-label="Navigation links">
                    {form.nav_links.map(function(link, index) {
                      return (
                        <li
                          key={link.id}
                          className={'rounded-xl border p-4 transition-all ' + (link.visible ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-100 opacity-60')}
                        >
                          <div className="flex items-center gap-3">
                            {/* Up/Down */}
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={function() { moveNavLink(index, -1); }}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 rounded transition-colors"
                                aria-label={'Move ' + link.label + ' up'}
                              >
                                <Icon path="M5 15l7-7 7 7" className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={function() { moveNavLink(index, 1); }}
                                disabled={index === form.nav_links.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 rounded transition-colors"
                                aria-label={'Move ' + link.label + ' down'}
                              >
                                <Icon path="M19 9l-7 7-7-7" className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Label input */}
                            <div className="flex-1 min-w-0">
                              <label htmlFor={'nav-label-' + index} className="sr-only">Navigation label for {link.label}</label>
                              <input
                                id={'nav-label-' + index}
                                type="text"
                                value={link.label}
                                onChange={function(e) { renameNavLink(index, e.target.value); }}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                aria-label={'Label for navigation link ' + (index + 1)}
                              />
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                {link.type === 'external' ? 'External: ' : 'Anchor: '}{link.href}
                              </p>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {link.system && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                  System
                                </span>
                              )}
                              {link.type === 'external' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  External
                                </span>
                              )}
                            </div>

                            {/* Toggle */}
                            <Toggle
                              checked={link.visible}
                              onChange={function() { toggleNavLink(index); }}
                              label={(link.visible ? 'Hide ' : 'Show ') + link.label + ' in navigation'}
                              id={'nav-toggle-' + index}
                            />

                            {/* Delete (custom links only) */}
                            {!link.system && (
                              <button
                                onClick={function() { removeNavLink(index); }}
                                className="p-1.5 text-gray-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors flex-shrink-0"
                                aria-label={'Remove ' + link.label + ' link'}
                              >
                                <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Add external link */}
                  <div className="mt-4">
                    {!showAddNav ? (
                      <button
                        onClick={function() { setShowAddNav(true); }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Icon path="M12 4v16m8-8H4" className="h-4 w-4" />
                        Add External Link
                      </button>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-gray-900">Add External Link</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="new-nav-label" className={labelCls}>Label</label>
                            <input
                              id="new-nav-label"
                              type="text"
                              placeholder="e.g. Donate"
                              value={newNavLink.label}
                              onChange={function(e) { setNewNavLink(function(prev) { return Object.assign({}, prev, { label: e.target.value }); }); }}
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label htmlFor="new-nav-href" className={labelCls}>URL</label>
                            <input
                              id="new-nav-href"
                              type="text"
                              placeholder="https://donate.example.com"
                              value={newNavLink.href}
                              onChange={function(e) { setNewNavLink(function(prev) { return Object.assign({}, prev, { href: e.target.value }); }); }}
                              className={inputCls}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={addExternalLink}
                            className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          >
                            Add Link
                          </button>
                          <button
                            onClick={function() { setShowAddNav(false); setNewNavLink({ label: '', href: '' }); }}
                            className="px-4 py-2 bg-transparent border border-gray-200 text-gray-500 text-sm font-semibold rounded-lg hover:text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-amber-600">Note:</span> System links can be hidden but not deleted. Nav order and labels will be applied in an upcoming update to your public page.
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════ INFO ════════════════════ */}
            {activeSection === 'info' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Info</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Organization Info</h2>
                  <p className="text-gray-500 text-sm">Basic information shown on your public page</p>
                </div>
                <div>
                  <label htmlFor="name" className={labelCls}>
                    Organization Name <span className="text-red-400" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="name" name="name" type="text" required aria-required="true"
                    value={form.name} onChange={handleField} maxLength={100}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="description" className={labelCls}>About / Mission Statement</label>
                  <textarea
                    id="description" name="description" value={form.description} onChange={handleField}
                    rows={5} maxLength={1000}
                    placeholder="Tell visitors who you are, what you do, and why it matters..."
                    className={inputCls + ' resize-none'}
                    aria-describedby="description-count"
                  />
                  <p id="description-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">
                    {form.description.length}/1000
                  </p>
                </div>
                <div>
                  <label htmlFor="website" className={labelCls}>Website URL</label>
                  <input
                    id="website" name="website" type="url" value={form.website} onChange={handleField}
                    placeholder="https://yourorg.org"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* ════════════════════ CONTACT ════════════════════ */}
            {activeSection === 'contact' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Contact</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Contact Information</h2>
                  <p className="text-gray-500 text-sm">How people can reach your organization</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact_email" className={labelCls}>Email Address</label>
                    <input id="contact_email" name="contact_email" type="email" value={form.contact_email} onChange={handleField}
                      placeholder="info@yourorg.org" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="contact_phone" className={labelCls}>Phone Number</label>
                    <input id="contact_phone" name="contact_phone" type="tel" value={form.contact_phone} onChange={handleField}
                      placeholder="(555) 123-4567" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="address" className={labelCls}>Street Address</label>
                  <input id="address" name="address" type="text" value={form.address} onChange={handleField}
                    placeholder="123 Main St" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="city" className={labelCls}>City</label>
                    <input id="city" name="city" type="text" value={form.city} onChange={handleField} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="state" className={labelCls}>State</label>
                    <input id="state" name="state" type="text" value={form.state} onChange={handleField}
                      maxLength={2} placeholder="OH" className={inputCls + ' uppercase'} />
                  </div>
                  <div>
                    <label htmlFor="zip_code" className={labelCls}>ZIP</label>
                    <input id="zip_code" name="zip_code" type="text" value={form.zip_code} onChange={handleField}
                      maxLength={10} className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ SOCIAL ════════════════════ */}
            {activeSection === 'social' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Social</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Social Media Links</h2>
                  <p className="text-gray-500 text-sm">Add links to your social profiles (leave blank to hide)</p>
                </div>
                {[
                  { key: 'facebook',  label: 'Facebook',   placeholder: 'https://facebook.com/yourorg'          },
                  { key: 'instagram', label: 'Instagram',  placeholder: 'https://instagram.com/yourorg'         },
                  { key: 'twitter',   label: 'X / Twitter', placeholder: 'https://twitter.com/yourorg'          },
                  { key: 'linkedin',  label: 'LinkedIn',   placeholder: 'https://linkedin.com/company/yourorg'  },
                  { key: 'youtube',   label: 'YouTube',    placeholder: 'https://youtube.com/@yourorg'          },
                ].map(function(item) {
                  return (
                    <div key={item.key}>
                      <label htmlFor={'social-' + item.key} className={labelCls}>{item.label}</label>
                      <input
                        id={'social-' + item.key}
                        name={item.key}
                        type="url"
                        value={form.social_links[item.key] || ''}
                        onChange={handleSocial}
                        placeholder={item.placeholder}
                        className={inputCls}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ════════════════════ SECTIONS ════════════════════ */}
            {activeSection === 'sections' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Sections</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Page Sections</h2>
                  <p className="text-gray-500 text-sm">Choose which sections appear on your public page</p>
                </div>
                <ul className="space-y-3" aria-label="Toggle page sections">
                  {Object.entries(PAGE_SECTION_CONFIG).map(function(entry) {
                    var key = entry[0];
                    var val = entry[1];
                    var isOn = form.page_sections[key];
                    return (
                      <li key={key}>
                        <div
                          className={
                            'flex items-center justify-between p-4 rounded-xl border-2 transition-all ' +
                            (isOn ? 'border-blue-500 bg-gray-100' : 'border-gray-200 bg-gray-50 opacity-60')
                          }
                        >
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{val.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{val.desc}</p>
                          </div>
                          <Toggle
                            checked={isOn}
                            onChange={function() { toggleSection(key); }}
                            label={(isOn ? 'Hide ' : 'Show ') + val.label + ' section'}
                            id={'section-toggle-' + key}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ════════════════════ PUBLISH ════════════════════ */}
            {activeSection === 'publish' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Publish</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Visibility & Channels</h2>
                  <p className="text-gray-500 text-sm mb-6">Control where your organization and events appear</p>

                  {/* Public toggle */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Organization Page</h3>
                    <div
                      className={
                        'flex items-center justify-between p-5 rounded-xl border-2 transition-all ' +
                        (form.is_public ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50')
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className={
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ' +
                          (form.is_public ? 'bg-green-100' : 'bg-gray-200')
                        } aria-hidden="true">
                          <Icon
                            path={['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064']}
                            className={'h-5 w-5 ' + (form.is_public ? 'text-[#22C55E]' : 'text-gray-400')}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{form.is_public ? 'Page is Public' : 'Page is Private'}</p>
                          <p className="text-sm text-gray-500">
                            {form.is_public ? 'Anyone can find and view your public page' : 'Your page is hidden from the public'}
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={form.is_public}
                        onChange={function() { setForm(function(prev) { return Object.assign({}, prev, { is_public: !prev.is_public }); }); }}
                        label={form.is_public ? 'Make page private' : 'Make page public'}
                        id="publish-public-toggle"
                      />
                    </div>
                  </div>

                  {/* Publish channels */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Event Publish Channels</h3>
                    <p className="text-xs text-gray-400 mb-4">These are org-level defaults. Individual events can override these settings.</p>
                    <div className="space-y-3">
                      {/* Org website channel */}
                      <div className={
                        'flex items-center justify-between p-4 rounded-xl border transition-all ' +
                        (form.publish_channels.website ? 'border-blue-500/50 bg-gray-100' : 'border-gray-200 bg-gray-50')
                      }>
                        <div className="flex items-center gap-3">
                          <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (form.publish_channels.website ? 'bg-blue-100' : 'bg-gray-200')} aria-hidden="true">
                            <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className={'h-4 w-4 ' + (form.publish_channels.website ? 'text-blue-400' : 'text-gray-400')} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Org Website</p>
                            <p className="text-xs text-gray-500">Events appear on your public organization page</p>
                          </div>
                        </div>
                        <Toggle
                          checked={form.publish_channels.website}
                          onChange={function() { setPublishChannel('website', !form.publish_channels.website); }}
                          label={form.publish_channels.website ? 'Disable org website channel' : 'Enable org website channel'}
                          id="channel-website-toggle"
                        />
                      </div>

                      {/* Discovery channel */}
                      <div className={
                        'flex items-center justify-between p-4 rounded-xl border transition-all ' +
                        (form.publish_channels.discovery ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50')
                      }>
                        <div className="flex items-center gap-3">
                          <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (form.publish_channels.discovery ? 'bg-purple-100' : 'bg-gray-200')} aria-hidden="true">
                            <Icon path={['M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z']} className={'h-4 w-4 ' + (form.publish_channels.discovery ? 'text-purple-400' : 'text-gray-400')} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">Syndicade Discovery</p>
                            <p className="text-xs text-gray-500">Events appear on the public Syndicade discovery page</p>
                          </div>
                        </div>
                        <Toggle
                          checked={form.publish_channels.discovery}
                          onChange={function() { setPublishChannel('discovery', !form.publish_channels.discovery); }}
                          label={form.publish_channels.discovery ? 'Disable discovery channel' : 'Enable discovery channel'}
                          id="channel-discovery-toggle"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Public URL */}
                {org && org.slug && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Your Public URL</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-blue-600 text-sm font-mono break-all flex-1">
                        {window.location.origin + '/org/' + org.slug}
                      </code>
                      <a
                        href={'/org/' + org.slug}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex-shrink-0"
                        aria-label="Open public page in new tab"
                      >
                        Open Page
                      </a>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-amber-600">Remember:</span> Click Save at the top to apply all publish settings.
                  </p>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}