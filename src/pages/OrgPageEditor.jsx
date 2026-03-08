import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import BlockEditor from '../components/BlockEditor';
import {
  getThemeVars,
  getNavLinks,
  ClassicTemplate,
  ModernTemplate,
  BannerTemplate,
  SidebarTemplate,
  FeaturedTemplate,
} from '../components/OrgTemplates';
import { renderBlock } from '../components/BlockRenderer';
import WebsiteSetupWizard from '../components/WebsiteSetupWizard';

var PREVIEW_WIDTH = 1280;

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
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        <div className="w-48 flex-shrink-0 space-y-2">
          {[1,2,3,4].map(function(i) { return <Skeleton key={i} className="h-14 w-full" />; })}
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[1,2,3,4].map(function(i) { return <Skeleton key={i} className="h-28 w-full" />; })}
          </div>
        </div>
      </div>
    </div>
  );
}

var TEMPLATES = [
  {
    id: 'classic', name: 'Classic', description: 'Simple hero, events list, footer navigation',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/><rect x="8" y="8" width="60" height="10" fill="#d1d5db" rx="2"/><rect x="100" y="8" width="52" height="10" fill="#d1d5db" rx="2"/><rect x="8" y="24" width="80" height="8" fill="#374151" rx="2"/><rect x="8" y="36" width="100" height="5" fill="#9ca3af" rx="2"/><rect x="8" y="44" width="80" height="5" fill="#9ca3af" rx="2"/><rect x="8" y="55" width="50" height="6" fill="#1d4ed8" rx="2"/><rect x="8" y="65" width="70" height="4" fill="#374151" rx="1"/><rect x="8" y="72" width="140" height="3" fill="#e5e7eb" rx="1"/><rect x="8" y="78" width="130" height="3" fill="#e5e7eb" rx="1"/><rect x="8" y="84" width="110" height="3" fill="#e5e7eb" rx="1"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>)
  },
  {
    id: 'modern', name: 'Modern', description: '3-column layout with events, pages, and news',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/><rect x="8" y="6" width="30" height="8" fill="#d1d5db" rx="2"/><rect x="110" y="6" width="42" height="8" fill="#1d4ed8" rx="3"/><rect x="8" y="20" width="100" height="9" fill="#374151" rx="2"/><rect x="8" y="33" width="130" height="4" fill="#9ca3af" rx="1"/><rect x="8" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/><rect x="57" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/><rect x="106" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>)
  },
  {
    id: 'banner', name: 'Banner', description: 'Full-width banner image with name overlay',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/><rect x="8" y="5" width="30" height="7" fill="#d1d5db" rx="2"/><rect x="90" y="5" width="62" height="7" fill="#d1d5db" rx="2"/><rect x="0" y="16" width="160" height="32" fill="#6b7280" rx="2"/><rect x="30" y="24" width="100" height="8" fill="#ffffff" rx="2" opacity="0.9"/><rect x="50" y="35" width="60" height="5" fill="#ffffff" rx="1" opacity="0.6"/><rect x="8" y="54" width="60" height="5" fill="#374151" rx="1"/><rect x="8" y="62" width="68" height="3" fill="#e5e7eb" rx="1"/><rect x="8" y="67" width="68" height="3" fill="#e5e7eb" rx="1"/><rect x="84" y="54" width="60" height="5" fill="#374151" rx="1"/><rect x="84" y="62" width="68" height="3" fill="#e5e7eb" rx="1"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>)
  },
  {
    id: 'sidebar', name: 'Sidebar Nav', description: 'Left sidebar navigation with main content area',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/><rect x="8" y="5" width="30" height="7" fill="#d1d5db" rx="2"/><rect x="90" y="5" width="62" height="7" fill="#1d4ed8" rx="3"/><rect x="0" y="16" width="40" height="84" fill="#f3f4f6" rx="2"/><rect x="4" y="20" width="32" height="4" fill="#374151" rx="1"/><rect x="4" y="27" width="32" height="4" fill="#9ca3af" rx="1"/><rect x="4" y="34" width="32" height="4" fill="#9ca3af" rx="1"/><rect x="4" y="41" width="32" height="4" fill="#9ca3af" rx="1"/><rect x="48" y="20" width="80" height="8" fill="#374151" rx="2"/><rect x="48" y="32" width="104" height="4" fill="#9ca3af" rx="1"/><rect x="48" y="48" width="104" height="4" fill="#e5e7eb" rx="1"/><rect x="48" y="55" width="104" height="4" fill="#e5e7eb" rx="1"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>)
  },
  {
    id: 'featured', name: 'Full Featured', description: 'Events, member spotlight, contact info, and more',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect x="0" y="0" width="160" height="100" fill="#f9fafb" rx="4"/><circle cx="16" cy="9" r="6" fill="#d1d5db"/><rect x="26" y="5" width="30" height="7" fill="#d1d5db" rx="2"/><rect x="110" y="5" width="42" height="7" fill="#1d4ed8" rx="3"/><rect x="30" y="18" width="100" height="8" fill="#374151" rx="2"/><rect x="40" y="30" width="80" height="4" fill="#9ca3af" rx="1"/><rect x="45" y="37" width="32" height="6" fill="#1d4ed8" rx="2"/><rect x="82" y="37" width="36" height="6" fill="#e5e7eb" rx="2"/><rect x="8" y="48" width="68" height="5" fill="#374151" rx="1"/><rect x="8" y="56" width="68" height="20" fill="#e5e7eb" rx="2"/><rect x="84" y="48" width="68" height="5" fill="#374151" rx="1"/><rect x="84" y="56" width="68" height="20" fill="#e5e7eb" rx="2"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>)
  },
];

var FONT_PAIRINGS = [
  { id: 'inter',  label: 'Inter',  description: 'Clean & Modern',   sample: 'Inter / System UI'     },
  { id: 'serif',  label: 'Serif',  description: 'Classic & Formal', sample: 'Georgia / Serif'       },
  { id: 'mono',   label: 'Mono',   description: 'Technical & Bold', sample: 'Fira Code / Monospace' },
];

var BUTTON_STYLES = [
  { id: 'rounded', label: 'Rounded', previewClass: 'rounded-lg'  },
  { id: 'sharp',   label: 'Sharp',   previewClass: 'rounded-none' },
  { id: 'pill',    label: 'Pill',    previewClass: 'rounded-full' },
];

var DEFAULT_NAV_LINKS = [
  { id: 'home',    label: 'Home',    href: '#home',    type: 'anchor', visible: true, system: true },
  { id: 'about',   label: 'About',   href: '#about',   type: 'anchor', visible: true, system: true },
  { id: 'events',  label: 'Events',  href: '#events',  type: 'anchor', visible: true, system: true },
  { id: 'news',    label: 'News',    href: '#news',    type: 'anchor', visible: true, system: true },
  { id: 'contact', label: 'Contact', href: '#contact', type: 'anchor', visible: true, system: true },
];

var PAGE_SECTION_CONFIG = {
  about:         { label: 'About Us',         desc: 'Your mission and description'        },
  events:        { label: 'Upcoming Events',  desc: 'Auto-populated from your events'    },
  announcements: { label: 'Latest News',      desc: 'Recent announcements'               },
  photos:        { label: 'Photo Gallery',    desc: 'Images uploaded via org photos'     },
  members:       { label: 'Member Spotlight', desc: 'Showcase featured members publicly' },
  contact:       { label: 'Contact Info',     desc: 'Email, phone, and address'          },
  join:          { label: 'Join Us Form',     desc: 'Contact form for new members'       },
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
}

var DEFAULT_PAGES = [
  { page_key: 'home',       title: 'Home',             nav_label: 'Home',         sort_order: 0 },
  { page_key: 'about',      title: 'About',            nav_label: 'About',        sort_order: 1 },
  { page_key: 'mission',    title: 'Mission & Values', nav_label: 'Mission',      sort_order: 2 },
  { page_key: 'programs',   title: 'Programs',         nav_label: 'Programs',     sort_order: 3 },
  { page_key: 'events',     title: 'Events',           nav_label: 'Events',       sort_order: 4 },
  { page_key: 'news',       title: 'News & Updates',   nav_label: 'News',         sort_order: 5 },
  { page_key: 'involved',   title: 'Get Involved',     nav_label: 'Get Involved', sort_order: 6 },
  { page_key: 'membership', title: 'Membership',       nav_label: 'Membership',   sort_order: 7 },
  { page_key: 'contact',    title: 'Contact',          nav_label: 'Contact',      sort_order: 8 },
  { page_key: 'resources',  title: 'Resources',        nav_label: 'Resources',    sort_order: 9 },
];

var inputCls = 'w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
var labelCls = 'block text-sm font-semibold text-gray-700 mb-2';

// ── Section divider used inside Appearance tab ──
function AppearanceSection({ label, children }) {
  return (
    <div className="border-t border-gray-100 pt-6 mt-2">
      <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-4">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, id }) {
  return (
    <button
      type="button" role="switch" id={id}
      aria-checked={checked} aria-label={label}
      onClick={onChange}
      className={'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white flex-shrink-0 ' + (checked ? 'bg-blue-500' : 'bg-gray-300')}>
      <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ' + (checked ? 'left-[22px]' : 'left-0.5')} aria-hidden="true" />
    </button>
  );
}

function PreviewNewPage({ org, pages, blocks, primary, secondary, borderRadius, fontFamily }) {
  var enabledPages = (pages || []).filter(function(p) { return p.is_enabled && p.page_key && !p.page_key.startsWith('external-'); });
  var firstPageWithBlocks = enabledPages.find(function(p) { return blocks.some(function(b) { return b.page_id === p.id; }); });
  var [activePage, setActivePage] = useState(firstPageWithBlocks ? firstPageWithBlocks.id : (enabledPages.length > 0 ? enabledPages[0].id : null));
  var activePageBlocks = blocks.filter(function(b) { return b.page_id === activePage; });

  return (
    <div className="min-h-full bg-white" style={{ fontFamily: fontFamily || 'Inter, system-ui, sans-serif' }}>
      {enabledPages.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
          {enabledPages.map(function(page) {
            var isActive = activePage === page.id;
            return (
              <button key={page.id} onClick={function() { setActivePage(page.id); }}
                className={'px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all focus:outline-none ' + (isActive ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-200')}>
                {page.title}
              </button>
            );
          })}
        </div>
      )}
      <div className="px-6 py-10 space-y-10 max-w-4xl mx-auto">
        {activePageBlocks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm font-medium">No blocks on this page yet.</p>
            <p className="text-xs mt-1">Add blocks in the Pages & Content tab.</p>
          </div>
        ) : (
          activePageBlocks.map(function(block) {
            return (
              <div key={block.id}>
                {renderBlock(block, primary || '#3B82F6', secondary || '#1E40AF', borderRadius || '8px', fontFamily || 'Inter, system-ui, sans-serif', org)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function OrgPageEditor() {
  var { organizationId } = useParams();
  var navigate = useNavigate();
  var bannerInputRef = useRef(null);
  var logoInputRef = useRef(null);
  var previewPanelRef = useRef(null);
  var debounceTimers = useRef({});

  var [org, setOrg] = useState(null);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [uploadingBanner, setUploadingBanner] = useState(false);
  var [uploadingLogo, setUploadingLogo] = useState(false);
  var [activeSection, setActiveSection] = useState('overview');
  var [previewOpen, setPreviewOpen] = useState(true);
  var [previewScale, setPreviewScale] = useState(0.5);
  var [sitePages, setSitePages] = useState([]);
  var [siteBlocks, setSiteBlocks] = useState([]);
  var [deleteModal, setDeleteModal] = useState(null);
  var [showWizard, setShowWizard] = useState(false);
  var [footerPage, setFooterPage] = useState(null);

  var [form, setForm] = useState({
    name: '', tagline: '', description: '', contact_email: '', contact_phone: '',
    address: '', city: '', state: '', zip_code: '', website: '',
    logo_url: '', banner_url: '',
    social_links: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
    page_sections: { about: true, events: true, announcements: true, photos: true, members: false, contact: true, join: true },
    is_public: false,
    template: 'classic',
    theme: { primaryColor: '#3B82F6', fontPairing: 'inter', buttonStyle: 'rounded', customColors: ['#3B82F6', '', ''] },
    nav_links: DEFAULT_NAV_LINKS,
    publish_channels: { website: true, discovery: false },
  });

  // ── Scale preview to fit panel width ──
  useEffect(function() {
    function computeScale() {
      if (previewPanelRef.current) {
        var w = previewPanelRef.current.offsetWidth - 24;
        setPreviewScale(Math.max(0.25, w / PREVIEW_WIDTH));
      }
    }
    if (previewOpen) {
      var t = setTimeout(computeScale, 60);
      window.addEventListener('resize', computeScale);
      return function() { clearTimeout(t); window.removeEventListener('resize', computeScale); };
    }
  }, [previewOpen]);

  useEffect(function() { fetchOrg(); }, [organizationId]);

  // ── Page helpers ──
  async function savePageField(pageId, fields) {
    try {
      var result = await supabase.from('org_site_pages').update(
        Object.assign({}, fields, { updated_at: new Date().toISOString() })
      ).eq('id', pageId);
      if (result.error) throw result.error;
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    }
  }

  function savePageDebounced(pageId, fields) {
    var key = pageId + '-' + Object.keys(fields).join(',');
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async function() {
      await savePageField(pageId, fields);
    }, 500);
  }

  async function deletePage(pageId) {
    var updated = sitePages.filter(function(p) { return p.id !== pageId; });
    setSitePages(updated);
    await supabase.from('org_site_pages').delete().eq('id', pageId);
    await saveNavInstant(updated);
    toast.success('Page deleted');
  }

  async function saveNavInstant(pages) {
    var navItems = pages
      .filter(function(p) { return p.is_enabled && p.is_visible_in_nav; })
      .map(function(p) { return { id: p.page_key, label: p.nav_label, type: 'page', page_key: p.page_key }; });
    await supabase.from('org_site_nav').upsert(
      { organization_id: organizationId, items: navItems, updated_at: new Date().toISOString() },
      { onConflict: 'organization_id' }
    );
  }

  // ── Fetch org data ──
  async function fetchOrg() {
    try {
      var userResult = await supabase.auth.getUser();
      var user = userResult.data.user;
      if (!user) { navigate('/login'); return; }

      var memberResult = await supabase.from('memberships').select('role')
        .eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').single();
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
      var savedTheme = savedSettings.theme || {};

      setForm({
        name: data.name || '', tagline: data.tagline || '', description: data.description || '',
        contact_email: data.contact_email || '', contact_phone: data.contact_phone || '',
        address: data.address || '', city: data.city || '', state: data.state || '',
        zip_code: data.zip_code || '', website: data.website || '',
        logo_url: data.logo_url || '', banner_url: data.banner_url || '',
        social_links: data.social_links || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
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
        theme: {
          primaryColor:  savedTheme.primaryColor || '#3B82F6',
          fontPairing:   savedTheme.fontPairing || 'inter',
          buttonStyle:   savedTheme.buttonStyle || 'rounded',
          customColors:  savedTheme.customColors || ['#3B82F6', '', ''],
        },
        nav_links:        savedSettings.nav_links || DEFAULT_NAV_LINKS,
        publish_channels: savedSettings.publish_channels || { website: true, discovery: false },
      });

      // Load or seed site pages
      var pagesResult = await supabase.from('org_site_pages').select('*')
        .eq('organization_id', organizationId).order('sort_order', { ascending: true });
      if (pagesResult.error) throw pagesResult.error;
      var existingPages = pagesResult.data || [];
      if (existingPages.length === 0) {
        var toInsert = DEFAULT_PAGES.map(function(p) {
          return Object.assign({}, p, { organization_id: organizationId });
        });
        var insertResult = await supabase.from('org_site_pages').insert(toInsert).select();
        if (insertResult.error) throw insertResult.error;
        existingPages = insertResult.data;
      }

      // Ensure footer page exists (hidden from nav, never shown in page list)
      var existingFooter = existingPages.find(function(p) { return p.page_key === '__footer__'; });
      if (!existingFooter) {
        var footerInsert = await supabase.from('org_site_pages').insert([{
          organization_id: organizationId,
          page_key: '__footer__',
          title: 'Footer',
          nav_label: 'Footer',
          sort_order: 9999,
          is_enabled: true,
          is_visible_in_nav: false,
        }]).select().single();
        if (!footerInsert.error) existingFooter = footerInsert.data;
      }
      setFooterPage(existingFooter || null);

      // Exclude footer from the normal page list
      setSitePages(existingPages.filter(function(p) { return p.page_key !== '__footer__'; }));

      var blocksResult = await supabase.from('org_site_blocks').select('*')
        .eq('organization_id', organizationId).eq('is_visible', true).order('sort_order', { ascending: true });
      if (!blocksResult.error) setSiteBlocks(blocksResult.data || []);

      var configResult = await supabase.from('org_site_config').select('setup_wizard_dismissed')
        .eq('organization_id', organizationId).maybeSingle();
      if (!configResult.data || !configResult.data.setup_wizard_dismissed) {
        setShowWizard(true);
      }
    } catch (err) {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  // ── Image upload ──
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

  // ── Save ──
  async function handleSave() {
    if (!form.name.trim()) { toast.error('Organization name is required'); return; }
    setSaving(true);
    try {
      var existingResult = await supabase.from('organizations').select('settings').eq('id', organizationId).single();
      var existingSettings = existingResult.data ? (existingResult.data.settings || {}) : {};
      var updatedSettings = Object.assign({}, existingSettings, {
        template: form.template, theme: form.theme,
        nav_links: form.nav_links, publish_channels: form.publish_channels,
      });
      var updateResult = await supabase.from('organizations').update({
        name: form.name.trim(), tagline: form.tagline.trim(), description: form.description.trim(),
        contact_email: form.contact_email.trim(), contact_phone: form.contact_phone.trim(),
        address: form.address.trim(), city: form.city.trim(), state: form.state.trim(),
        zip_code: form.zip_code.trim(), website: form.website.trim(),
        logo_url: form.logo_url, banner_url: form.banner_url,
        social_links: form.social_links, page_sections: form.page_sections,
        is_public: form.is_public, settings: updatedSettings,
      }).eq('id', organizationId);
      if (updateResult.error) throw updateResult.error;
      toast.success('Changes saved!');
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Form helpers ──
  function handleField(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(function(prev) { var u = {}; u[name] = value; return Object.assign({}, prev, u); });
  }
  function handleSocial(e) {
    var name = e.target.name; var value = e.target.value;
    setForm(function(prev) { return Object.assign({}, prev, { social_links: Object.assign({}, prev.social_links, { [name]: value }) }); });
  }
  function toggleSection(key) {
    setForm(function(prev) { var u = Object.assign({}, prev.page_sections); u[key] = !u[key]; return Object.assign({}, prev, { page_sections: u }); });
  }
  function setTheme(key, value) {
    setForm(function(prev) { return Object.assign({}, prev, { theme: Object.assign({}, prev.theme, { [key]: value }) }); });
  }
  function setPublishChannel(key, value) {
    setForm(function(prev) { return Object.assign({}, prev, { publish_channels: Object.assign({}, prev.publish_channels, { [key]: value }) }); });
  }

  // ── Preview org object ──
  var previewOrg = {
    id: organizationId,
    name: form.name || 'Your Organization',
    tagline: form.tagline, description: form.description,
    contact_email: form.contact_email, contact_phone: form.contact_phone,
    address: form.address, city: form.city, state: form.state,
    zip_code: form.zip_code, website: form.website,
    logo_url: form.logo_url, banner_url: form.banner_url,
    social_links: form.social_links, slug: org ? org.slug : '',
    settings: { template: form.template, theme: form.theme, nav_links: form.nav_links, publish_channels: form.publish_channels },
    page_sections: form.page_sections, is_public: form.is_public,
  };

  var previewThemeVars = getThemeVars(previewOrg);
  var previewNavLinks  = getNavLinks(previewOrg);
  var previewJoinProps = {
    joinForm: { name: '', email: '', message: '' },
    joinLoading: false, joinError: null, joinSuccess: false,
    onChange: function() {}, onSubmit: function(e) { e.preventDefault(); },
    onReset: function() {}, isPreview: true,
  };
  var previewTemplateProps = {
    org: previewOrg, events: [], announcements: [], photos: [],
    sections: form.page_sections, joinProps: previewJoinProps,
    openLightbox: function() {}, navLinks: previewNavLinks, themeVars: previewThemeVars,
  };

  // ── 4-tab sidebar ──
  var navSections = [
    { id: 'overview',      label: 'Overview',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'appearance',    label: 'Appearance',      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'pages-content', label: 'Pages & Content', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'publish',       label: 'Publish',         icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
  ];

  if (loading) return <EditorSkeleton />;

  // Derived stats for Overview
  var enabledPageCount = sitePages.filter(function(p) { return p.is_enabled; }).length;
  var blockCount = siteBlocks.length;
  var lastUpdated = org && org.updated_at
    ? new Date(org.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never';

  return (
    <div className={previewOpen ? 'h-screen overflow-hidden flex flex-col bg-gray-50' : 'min-h-screen bg-gray-50'}>

      {/* Setup wizard */}
      {showWizard && (
        <WebsiteSetupWizard
          organizationId={organizationId}
          orgData={form}
          onComplete={function(data) {
            setShowWizard(false);
            setForm(function(prev) { return Object.assign({}, prev, data); });
          }}
          onDismiss={function() { setShowWizard(false); }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={function() { setDeleteModal(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
              <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-8 w-8 text-red-500" />
            </div>
            <h2 id="delete-modal-title" className="text-xl font-bold text-gray-900 mb-2">Delete "{deleteModal.title}"?</h2>
            <p className="text-gray-500 text-sm mb-8">This page will be permanently deleted and <span className="font-semibold text-red-500">cannot be recovered</span>. Any content on this page will be lost.</p>
            <div className="flex gap-3 w-full">
              <button onClick={function() { setDeleteModal(null); }}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
                No, Keep Page
              </button>
              <button onClick={async function() { await deletePage(deleteModal.id); setDeleteModal(null); }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                Yes, Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      <a href="#editor-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none">
        Skip to editor
      </a>

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 flex-shrink-0">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={function() { navigate('/organizations/' + organizationId); }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded p-1 flex-shrink-0 text-sm font-medium transition-colors"
              aria-label="Back to dashboard">
              <Icon path="M15 19l-7-7 7-7" className="h-4 w-4" />
              Back
            </button>
            <div className="w-px h-6 bg-gray-200" aria-hidden="true" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">Website Builder</h1>
              <p className="text-xs text-gray-500 truncate">{org && org.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Preview toggle */}
            <button
              onClick={function() { setPreviewOpen(!previewOpen); }}
              className={'hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 ' + (previewOpen ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}
              aria-label={previewOpen ? 'Hide live preview' : 'Show live preview'}
              aria-pressed={previewOpen}>
              <Icon path={previewOpen ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} className="h-4 w-4" />
              {previewOpen ? 'Hide Preview' : 'Preview'}
            </button>

            {/* Open public page */}
            {org && org.slug && (
              <a href={'/org/' + org.slug} target="_blank" rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                aria-label="Open public page in new tab">
                <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="h-4 w-4" />
                Open Page
              </a>
            )}

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              aria-label={saving ? 'Saving changes' : 'Save changes'} aria-busy={saving}>
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <><Icon path="M5 13l4 4L19 7" className="h-4 w-4" />Save</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={previewOpen ? 'flex flex-1 overflow-hidden' : 'bg-gray-50'}>

        {/* ── Editor panel ── */}
        <div
          className={previewOpen ? 'overflow-auto bg-gray-50 border-r border-gray-200' : 'max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full'}
          style={previewOpen ? { width: '42%', flexShrink: 0, padding: '24px' } : {}}>
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── 4-tab sidebar ── */}
            <aside className="lg:w-48 flex-shrink-0">
              <nav aria-label="Website editor sections">
                <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {navSections.map(function(s) {
                    var isActive = activeSection === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={function() { setActiveSection(s.id); }}
                          className={'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap ' + (isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200')}
                          aria-current={isActive ? 'page' : undefined}>
                          <Icon path={s.icon} className={'h-4 w-4 flex-shrink-0 ' + (isActive ? 'text-white' : 'text-gray-400')} />
                          {s.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* ── Panel content ── */}
            <main id="editor-main" className="flex-1 min-w-0" aria-label="Editor panel">

              {/* ════════════════════════════════════════
                  TAB 1 — OVERVIEW
              ════════════════════════════════════════ */}
              {activeSection === 'overview' && (
                <div className="space-y-4">
                  {/* Status card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Overview</p>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Site Status</h2>
                    <p className="text-gray-500 text-sm mb-6">A quick look at your website and publish state.</p>

                    {/* Status row */}
                    <div className={'flex items-center justify-between p-5 rounded-xl border-2 transition-all ' + (form.is_public ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50')}>
                      <div className="flex items-center gap-4">
                        <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ' + (form.is_public ? 'bg-green-100' : 'bg-gray-200')} aria-hidden="true">
                          <Icon
                            path={form.is_public ? 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' : 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'}
                            className={'h-5 w-5 ' + (form.is_public ? 'text-green-500' : 'text-gray-400')}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{form.is_public ? 'Live — Page is Public' : 'Draft — Page is Private'}</p>
                          <p className="text-sm text-gray-500">{form.is_public ? 'Anyone can find and view your page' : 'Your page is hidden from the public'}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={form.is_public}
                        onChange={function() { setForm(function(prev) { return Object.assign({}, prev, { is_public: !prev.is_public }); }); }}
                        label={form.is_public ? 'Make page private' : 'Make page public'}
                        id="overview-publish-toggle"
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                      <p className="text-2xl font-extrabold text-blue-500">{enabledPageCount}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-1">Active Pages</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                      <p className="text-2xl font-extrabold text-purple-500">{blockCount}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-1">Content Blocks</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                      <div className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ' + (form.publish_channels.discovery ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400')}>
                        <span className={'w-2 h-2 rounded-full ' + (form.publish_channels.discovery ? 'bg-purple-400' : 'bg-gray-300')} aria-hidden="true" />
                        {form.publish_channels.discovery ? 'In Discovery' : 'Not Listed'}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-2">Discovery</p>
                    </div>
                  </div>

                  {/* Last edited + public URL */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Last saved: <span className="font-semibold text-gray-700">{lastUpdated}</span></span>
                      </div>
                      <span className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ' + (form.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        <span className={'w-1.5 h-1.5 rounded-full ' + (form.is_public ? 'bg-green-500' : 'bg-gray-400')} aria-hidden="true" />
                        {form.is_public ? 'Published' : 'Unpublished'}
                      </span>
                    </div>

                    {org && org.slug && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Public URL</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-blue-600 text-xs font-mono truncate">
                            {window.location.origin + '/org/' + org.slug}
                          </code>
                          <a href={'/org/' + org.slug} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            aria-label="Open public page in new tab">
                            <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick navigation cards */}
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: 'Customize Appearance', desc: 'Logo, colors, fonts, and layout', tab: 'appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
                      { label: 'Edit Pages & Content', desc: 'Manage pages, blocks, and footer', tab: 'pages-content', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { label: 'Publish Settings', desc: 'Control visibility and discovery', tab: 'publish', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
                    ].map(function(item) {
                      return (
                        <button key={item.tab} onClick={function() { setActiveSection(item.tab); }}
                          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left group">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors" aria-hidden="true">
                            <Icon path={item.icon} className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <Icon path="M9 5l7 7-7 7" className="h-4 w-4 text-gray-300 group-hover:text-blue-400 ml-auto flex-shrink-0 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════
                  TAB 2 — PAGES & CONTENT
              ════════════════════════════════════════ */}
              {activeSection === 'pages-content' && (
                <div className="space-y-6">

                  {/* Pages list */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Pages</p>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Site Pages</h2>
                    <p className="text-gray-500 text-sm mb-5">Manage page names, nav labels, order, and visibility.</p>

                    <div className="grid grid-cols-12 gap-2 px-3 mb-2">
                      <div className="col-span-1" />
                      <div className="col-span-3"><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Page Name</span></div>
                      <div className="col-span-3"><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nav Label</span></div>
                      <div className="col-span-2 text-center"><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">In Nav</span></div>
                      <div className="col-span-2 text-center"><span className="text-xs font-bold text-gray-400 uppercase tracking-wide">On</span></div>
                      <div className="col-span-1" />
                    </div>

                    <div className="space-y-2" role="list" aria-label="Site pages">
                      {sitePages.map(function(page, index) {
                        return (
                          <div key={page.id} role="listitem"
                            className={'grid grid-cols-12 gap-2 items-center p-3 rounded-xl border transition-colors ' + (page.is_enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60')}
                            aria-label={page.title + ' page row'}>

                            {/* Sort arrows */}
                            <div className="col-span-1 flex flex-col gap-0.5 items-center">
                              <button
                                onClick={async function() {
                                  if (index === 0) return;
                                  var next = sitePages.slice();
                                  var temp = next[index - 1]; next[index - 1] = next[index]; next[index] = temp;
                                  next = next.map(function(p, i) { return Object.assign({}, p, { sort_order: i }); });
                                  setSitePages(next);
                                  await Promise.all(next.map(function(p) { return savePageField(p.id, { sort_order: p.sort_order }); }));
                                  await saveNavInstant(next);
                                }}
                                disabled={index === 0}
                                aria-label={'Move ' + page.title + ' up'}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={async function() {
                                  if (index === sitePages.length - 1) return;
                                  var next = sitePages.slice();
                                  var temp = next[index + 1]; next[index + 1] = next[index]; next[index] = temp;
                                  next = next.map(function(p, i) { return Object.assign({}, p, { sort_order: i }); });
                                  setSitePages(next);
                                  await Promise.all(next.map(function(p) { return savePageField(p.id, { sort_order: p.sort_order }); }));
                                  await saveNavInstant(next);
                                }}
                                disabled={index === sitePages.length - 1}
                                aria-label={'Move ' + page.title + ' down'}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>

                            {/* Page title */}
                            <div className="col-span-3">
                              <input type="text" value={page.title}
                                onChange={function(e) {
                                  var title = e.target.value;
                                  var newKey = slugify(title);
                                  setSitePages(function(prev) {
                                    return prev.map(function(p) {
                                      return p.id === page.id ? Object.assign({}, p, { title: title, page_key: newKey }) : p;
                                    });
                                  });
                                  savePageDebounced(page.id, { title: title, page_key: newKey });
                                }}
                                aria-label={'Page name for ' + page.title}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                maxLength={40}
                              />
                              <p className="text-xs text-gray-400 mt-0.5 px-1">/{page.page_key}</p>
                            </div>

                            {/* Nav label */}
                            <div className="col-span-3">
                              <input type="text" value={page.nav_label}
                                onChange={function(e) {
                                  var label = e.target.value;
                                  setSitePages(function(prev) {
                                    return prev.map(function(p) {
                                      return p.id === page.id ? Object.assign({}, p, { nav_label: label }) : p;
                                    });
                                  });
                                  savePageDebounced(page.id, { nav_label: label });
                                }}
                                aria-label={'Navigation label for ' + page.title}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                maxLength={30}
                              />
                            </div>

                            {/* In nav toggle */}
                            <div className="col-span-2 flex justify-center">
                              <Toggle
                                checked={!!(page.is_visible_in_nav && page.is_enabled)}
                                onChange={async function() {
                                  var updated = sitePages.map(function(p) {
                                    return p.id === page.id ? Object.assign({}, p, { is_visible_in_nav: !p.is_visible_in_nav }) : p;
                                  });
                                  setSitePages(updated);
                                  await savePageField(page.id, { is_visible_in_nav: !page.is_visible_in_nav });
                                  await saveNavInstant(updated);
                                }}
                                label={'Toggle navigation visibility for ' + page.title}
                                id={'nav-toggle-page-' + page.id}
                              />
                            </div>

                            {/* Enabled toggle */}
                            <div className="col-span-2 flex justify-center">
                              <Toggle
                                checked={!!page.is_enabled}
                                onChange={async function() {
                                  var updated = sitePages.map(function(p) {
                                    return p.id === page.id ? Object.assign({}, p, { is_enabled: !p.is_enabled }) : p;
                                  });
                                  setSitePages(updated);
                                  await savePageField(page.id, { is_enabled: !page.is_enabled });
                                  await saveNavInstant(updated);
                                }}
                                label={'Toggle ' + page.title + ' page'}
                                id={'enabled-toggle-page-' + page.id}
                              />
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex items-center justify-center gap-1">
                              <button
                                onClick={async function() {
                                  var updated = sitePages.map(function(p) {
                                    return p.id === page.id ? Object.assign({}, p, { is_enabled: false, is_visible_in_nav: false }) : p;
                                  });
                                  setSitePages(updated);
                                  await savePageField(page.id, { is_enabled: false, is_visible_in_nav: false });
                                  await saveNavInstant(updated);
                                  toast.success(page.title + ' archived');
                                }}
                                aria-label={'Archive ' + page.title + ' page'}
                                className="p-1.5 text-gray-300 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                              </button>
                              <button
                                onClick={function() { setDeleteModal(page); }}
                                aria-label={'Delete ' + page.title + ' page'}
                                className="p-1.5 text-gray-300 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Archived pages */}
                    {sitePages.filter(function(p) { return !p.is_enabled && !p.page_key.startsWith('external-'); }).length > 0 && (
                      <div className="mt-6 border-t border-gray-100 pt-6">
                        <p className="text-sm font-bold text-gray-700 mb-1">Archived Pages</p>
                        <p className="text-xs text-gray-400 mb-4">These pages are hidden from your site.</p>
                        <div className="space-y-2">
                          {sitePages.filter(function(p) { return !p.is_enabled && !p.page_key.startsWith('external-'); }).map(function(page) {
                            return (
                              <div key={page.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-400 truncate">{page.title}</p>
                                  <p className="text-xs text-gray-300">/{page.page_key}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={async function() {
                                      var updated = sitePages.map(function(p) {
                                        return p.id === page.id ? Object.assign({}, p, { is_enabled: true }) : p;
                                      });
                                      setSitePages(updated);
                                      await savePageField(page.id, { is_enabled: true });
                                      await saveNavInstant(updated);
                                      toast.success(page.title + ' restored');
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                                    Restore
                                  </button>
                                  <button
                                    onClick={function() { setDeleteModal(page); }}
                                    aria-label={'Permanently delete ' + page.title}
                                    className="p-1.5 text-gray-300 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* External nav links */}
                    <div className="mt-6 border-t border-gray-100 pt-6">
                      <p className="text-sm font-bold text-gray-700 mb-1">External Links in Nav</p>
                      <p className="text-xs text-gray-400 mb-4">Add links to external sites (e.g. a donation page).</p>
                      {sitePages.filter(function(p) { return p.page_key && p.page_key.startsWith('external-'); }).map(function(page) {
                        return (
                          <div key={page.id} className="flex items-center gap-2 mb-2">
                            <input type="text" value={page.nav_label}
                              onChange={function(e) {
                                var label = e.target.value;
                                setSitePages(function(prev) {
                                  return prev.map(function(p) { return p.id === page.id ? Object.assign({}, p, { nav_label: label }) : p; });
                                });
                                savePageDebounced(page.id, { nav_label: label });
                              }}
                              placeholder="e.g. Donate"
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                            />
                            <input type="text" value={page.title}
                              onChange={function(e) {
                                var url = e.target.value;
                                setSitePages(function(prev) {
                                  return prev.map(function(p) { return p.id === page.id ? Object.assign({}, p, { title: url }) : p; });
                                });
                                savePageDebounced(page.id, { title: url });
                              }}
                              placeholder="https://donate.example.com"
                              className="flex-2 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-48"
                            />
                            <button
                              onClick={async function() {
                                var updated = sitePages.filter(function(p) { return p.id !== page.id; });
                                setSitePages(updated);
                                await supabase.from('org_site_pages').delete().eq('id', page.id);
                                await saveNavInstant(updated);
                                toast.success('Link removed');
                              }}
                              aria-label={'Remove ' + page.nav_label + ' external link'}
                              className="p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors">
                              <Icon path="M6 18L18 6M6 6l12 12" className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        onClick={async function() {
                          var newPage = {
                            organization_id: organizationId,
                            page_key: 'external-' + Date.now(),
                            title: '', nav_label: '',
                            sort_order: sitePages.length,
                            is_enabled: true, is_visible_in_nav: true,
                          };
                          var result = await supabase.from('org_site_pages').insert([newPage]).select().single();
                          if (result.error) { toast.error('Could not add link'); return; }
                          var updated = sitePages.concat([result.data]);
                          setSitePages(updated);
                          await saveNavInstant(updated);
                          toast.success('External link added');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <Icon path="M12 4v16m8-8H4" className="h-4 w-4" />
                        Add External Link
                      </button>
                    </div>
                  </div>

                  {/* Block editor */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-0.5">Content</p>
                      <h2 className="text-xl font-bold text-gray-900">Page Blocks</h2>
                      <p className="text-gray-500 text-sm mt-0.5">Select a page above then add and arrange content blocks.</p>
                    </div>
                    <div className="p-4">
                      <BlockEditor
                        organizationId={organizationId}
                        pages={sitePages}
                        onBlocksChange={function(updated) { setSiteBlocks(updated); }}
                      />
                    </div>
                  </div>

                  {/* Footer block editor */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                          <Icon path="M4 6h16M4 12h16M4 18h7" className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-0.5">Footer</p>
                          <h2 className="text-xl font-bold text-gray-900">Footer Blocks</h2>
                          <p className="text-gray-500 text-sm mt-0.5">
                            These blocks appear at the bottom of every page on your site. Add contact info, social links, a donate button, and more.
                          </p>
                        </div>
                      </div>

                      {/* Footer block type hints */}
                      <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested footer block types">
                        {[
                          { label: 'Contact Info', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                          { label: 'Social Links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
                          { label: 'Donate Button', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                          { label: 'Newsletter', icon: 'M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76' },
                          { label: 'Copyright',   icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                        ].map(function(hint) {
                          return (
                            <span key={hint.label}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              <Icon path={hint.icon} className="h-3.5 w-3.5 text-gray-400" />
                              {hint.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4">
                      {footerPage ? (
                        <BlockEditor
                          organizationId={organizationId}
                          pages={[footerPage]}
                          onBlocksChange={function(updated) { setSiteBlocks(function(prev) { return prev.filter(function(b) { return b.page_id !== footerPage.id; }).concat(updated.filter(function(b) { return b.page_id === footerPage.id; })); }); }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3" aria-hidden="true">
                            <Icon path="M4 6h16M4 12h16M4 18h7" className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Footer not available</p>
                          <p className="text-xs text-gray-400">Reload the page to initialize your footer.</p>
                          <button onClick={function() { window.location.reload(); }}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                            Reload
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════
                  TAB 3 — APPEARANCE
              ════════════════════════════════════════ */}
              {activeSection === 'appearance' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-2">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Appearance</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Customize Your Site</h2>
                  <p className="text-gray-500 text-sm mb-2">Everything that controls how your public page looks.</p>

                  {/* ── Template ── */}
                  <AppearanceSection label="Layout Template">
                    <p className="text-gray-500 text-sm mb-4">Choose how your public organization page is displayed.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Page templates">
                      {TEMPLATES.map(function(t) {
                        var isSel = form.template === t.id;
                        return (
                          <button key={t.id} onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { template: t.id }); }); }}
                            className={'rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (isSel ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-blue-300')}
                            role="radio" aria-checked={isSel} aria-label={'Select ' + t.name + ' template: ' + t.description}>
                            <div className="aspect-video bg-white rounded-lg overflow-hidden mb-3 border border-gray-200">{t.preview}</div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{t.description}</p>
                              </div>
                              {isSel && <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AppearanceSection>

                  {/* ── Logo & Banner ── */}
                  <AppearanceSection label="Logo & Banner">
                    {/* Banner */}
                    <div className="mb-6">
                      <p className="block text-sm font-semibold text-gray-500 mb-1" id="banner-label">
                        Banner Image <span className="ml-2 text-xs font-normal text-gray-400">Recommended: 1200x300px, max 5MB</span>
                      </p>
                      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-blue-500 transition-colors cursor-pointer group" style={{ minHeight: '140px' }}
                        onClick={function() { bannerInputRef.current && bannerInputRef.current.click(); }}
                        onKeyDown={function(e) { e.key === 'Enter' && bannerInputRef.current && bannerInputRef.current.click(); }}
                        tabIndex={0} role="button" aria-labelledby="banner-label">
                        {form.banner_url ? (
                          <div>
                            <img src={form.banner_url} alt="Organization banner" className="w-full h-36 object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white font-semibold text-sm">Change Banner</span>
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
                                <p className="text-xs">PNG, JPG, WebP — max 5MB</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <input ref={bannerInputRef} type="file" accept="image/*" className="sr-only" aria-label="Upload banner image"
                        onChange={function(e) { e.target.files && e.target.files[0] && uploadImage(e.target.files[0], 'banner'); }} />
                      {form.banner_url && (
                        <button onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { banner_url: '' }); }); }}
                          className="mt-2 text-sm text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors" aria-label="Remove banner image">
                          Remove banner
                        </button>
                      )}
                    </div>

                    {/* Logo */}
                    <div>
                      <p className="block text-sm font-semibold text-gray-500 mb-3" id="logo-label">
                        Logo <span className="ml-2 text-xs font-normal text-gray-400">Recommended: 200x200px, max 5MB</span>
                      </p>
                      <div className="flex items-center gap-5">
                        <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-200 hover:border-blue-500 flex items-center justify-center cursor-pointer group overflow-hidden flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={function() { logoInputRef.current && logoInputRef.current.click(); }}
                          onKeyDown={function(e) { e.key === 'Enter' && logoInputRef.current && logoInputRef.current.click(); }}
                          tabIndex={0} role="button" aria-labelledby="logo-label">
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
                          <p className="text-gray-500 text-xs">Displayed as a circle on your public page.</p>
                          {form.logo_url && (
                            <button onClick={function() { setForm(function(prev) { return Object.assign({}, prev, { logo_url: '' }); }); }}
                              className="text-red-400 hover:text-red-500 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors" aria-label="Remove logo">
                              Remove logo
                            </button>
                          )}
                        </div>
                      </div>
                      <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" aria-label="Upload logo image"
                        onChange={function(e) { e.target.files && e.target.files[0] && uploadImage(e.target.files[0], 'logo'); }} />
                    </div>
                  </AppearanceSection>

                  {/* ── Tagline ── */}
                  <AppearanceSection label="Tagline">
                    <label htmlFor="tagline" className={labelCls}>Short Tagline <span className="ml-2 text-xs font-normal text-gray-400">Shown under your organization name</span></label>
                    <input id="tagline" name="tagline" type="text" value={form.tagline} onChange={handleField}
                      placeholder="e.g. Building a stronger community since 2010" maxLength={120} className={inputCls} aria-describedby="tagline-count" />
                    <p id="tagline-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{form.tagline.length}/120</p>
                  </AppearanceSection>

                  {/* ── Theme colors ── */}
                  <AppearanceSection label="Brand Colors">
                    <p className="text-gray-500 text-sm mb-5">Enter up to 3 hex color codes for buttons and accents.</p>
                    <div className="space-y-4">
                      {[0, 1, 2].map(function(i) {
                        var colors = form.theme.customColors || ['#3B82F6', '', ''];
                        var val = colors[i] || '';
                        var isValid = /^#([0-9A-Fa-f]{3}){1,2}$/.test(val);
                        return (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg border-2 border-gray-200 flex-shrink-0 transition-all" style={{ background: isValid ? val : '#f3f4f6' }} aria-hidden="true" />
                            <div className="flex-1">
                              <label htmlFor={'color-' + i} className={labelCls}>{'Brand Color ' + (i + 1) + (i === 0 ? ' (Primary)' : ' (Optional)')}</label>
                              <div className="flex items-center gap-2">
                                <input id={'color-' + i} type="text" value={val}
                                  onChange={function(e) { var nc = (form.theme.customColors || ['#3B82F6', '', '']).slice(); nc[i] = e.target.value; setTheme('customColors', nc); }}
                                  placeholder="#3B82F6" maxLength={7} className={inputCls + ' font-mono uppercase'} aria-describedby={'color-' + i + '-hint'} />
                                <input type="color" value={isValid ? val : '#3B82F6'}
                                  onChange={function(e) { var nc = (form.theme.customColors || ['#3B82F6', '', '']).slice(); nc[i] = e.target.value.toUpperCase(); setTheme('customColors', nc); }}
                                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer flex-shrink-0 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  aria-label={'Color picker for brand color ' + (i + 1)} />
                              </div>
                              <p id={'color-' + i + '-hint'} className="text-xs text-gray-400 mt-1">
                                {val && !isValid ? 'Enter a valid hex code (e.g. #3B82F6)' : 'Enter a hex code or use the color picker'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AppearanceSection>

                  {/* ── Fonts ── */}
                  <AppearanceSection label="Typography">
                    <p className="text-gray-500 text-sm mb-4">Choose the typography style for your public page.</p>
                    <div className="space-y-3" role="radiogroup" aria-label="Font pairing options">
                      {FONT_PAIRINGS.map(function(fp) {
                        var isSel = form.theme.fontPairing === fp.id;
                        return (
                          <button key={fp.id} onClick={function() { setTheme('fontPairing', fp.id); }}
                            className={'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ' + (isSel ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300')}
                            role="radio" aria-checked={isSel} aria-label={fp.label + ': ' + fp.description}>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{fp.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{fp.description}</p>
                              <p className="text-xs text-gray-400 mt-1 font-mono">{fp.sample}</p>
                            </div>
                            {isSel && <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </AppearanceSection>

                  {/* ── Button style ── */}
                  <AppearanceSection label="Button Style">
                    <p className="text-gray-500 text-sm mb-4">Choose how buttons look on your public page.</p>
                    <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Button style options">
                      {BUTTON_STYLES.map(function(bs) {
                        var isSel = form.theme.buttonStyle === bs.id;
                        return (
                          <button key={bs.id} onClick={function() { setTheme('buttonStyle', bs.id); }}
                            className={'p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center ' + (isSel ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300')}
                            role="radio" aria-checked={isSel} aria-label={'Button style: ' + bs.label}>
                            <div className="flex justify-center mb-3">
                              <span className={'px-4 py-1.5 bg-blue-600 text-white text-xs font-bold ' + bs.previewClass} aria-hidden="true">Button</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{bs.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </AppearanceSection>

                  {/* ── Org info ── */}
                  <AppearanceSection label="Organization Info">
                    <p className="text-gray-500 text-sm mb-4">Basic information shown on your public page.</p>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className={labelCls}>Organization Name <span className="text-red-400" aria-hidden="true">*</span></label>
                        <input id="name" name="name" type="text" required aria-required="true" value={form.name} onChange={handleField} maxLength={100} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="description" className={labelCls}>About / Mission Statement</label>
                        <textarea id="description" name="description" value={form.description} onChange={handleField} rows={4} maxLength={1000}
                          placeholder="Tell visitors who you are, what you do, and why it matters..." className={inputCls + ' resize-none'} aria-describedby="desc-count" />
                        <p id="desc-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{form.description.length}/1000</p>
                      </div>
                      <div>
                        <label htmlFor="website" className={labelCls}>Website URL</label>
                        <input id="website" name="website" type="url" value={form.website} onChange={handleField} placeholder="https://yourorg.org" className={inputCls} />
                      </div>
                    </div>
                  </AppearanceSection>

                  {/* ── Contact ── */}
                  <AppearanceSection label="Contact Information">
                    <p className="text-gray-500 text-sm mb-4">How people can reach your organization.</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="contact_email" className={labelCls}>Email Address</label>
                          <input id="contact_email" name="contact_email" type="email" value={form.contact_email} onChange={handleField} placeholder="info@yourorg.org" className={inputCls} />
                        </div>
                        <div>
                          <label htmlFor="contact_phone" className={labelCls}>Phone Number</label>
                          <input id="contact_phone" name="contact_phone" type="tel" value={form.contact_phone} onChange={handleField} placeholder="(555) 123-4567" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="address" className={labelCls}>Street Address</label>
                        <input id="address" name="address" type="text" value={form.address} onChange={handleField} placeholder="123 Main St" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label htmlFor="city" className={labelCls}>City</label>
                          <input id="city" name="city" type="text" value={form.city} onChange={handleField} className={inputCls} />
                        </div>
                        <div>
                          <label htmlFor="state" className={labelCls}>State</label>
                          <input id="state" name="state" type="text" value={form.state} onChange={handleField} maxLength={2} placeholder="OH" className={inputCls + ' uppercase'} />
                        </div>
                        <div>
                          <label htmlFor="zip_code" className={labelCls}>ZIP</label>
                          <input id="zip_code" name="zip_code" type="text" value={form.zip_code} onChange={handleField} maxLength={10} className={inputCls} />
                        </div>
                      </div>
                    </div>
                  </AppearanceSection>

                  {/* ── Social ── */}
                  <AppearanceSection label="Social Media">
                    <p className="text-gray-500 text-sm mb-4">Add links to your social profiles (leave blank to hide).</p>
                    <div className="space-y-4">
                      {[
                        { key: 'facebook',  label: 'Facebook',    placeholder: 'https://facebook.com/yourorg'         },
                        { key: 'instagram', label: 'Instagram',   placeholder: 'https://instagram.com/yourorg'        },
                        { key: 'twitter',   label: 'X / Twitter', placeholder: 'https://twitter.com/yourorg'          },
                        { key: 'linkedin',  label: 'LinkedIn',    placeholder: 'https://linkedin.com/company/yourorg' },
                        { key: 'youtube',   label: 'YouTube',     placeholder: 'https://youtube.com/@yourorg'         },
                      ].map(function(item) {
                        return (
                          <div key={item.key}>
                            <label htmlFor={'social-' + item.key} className={labelCls}>{item.label}</label>
                            <input id={'social-' + item.key} name={item.key} type="url" value={form.social_links[item.key] || ''} onChange={handleSocial} placeholder={item.placeholder} className={inputCls} />
                          </div>
                        );
                      })}
                    </div>
                  </AppearanceSection>

                  {/* ── Page sections ── */}
                  <AppearanceSection label="Page Sections">
                    <p className="text-gray-500 text-sm mb-4">Choose which sections appear on your public page.</p>
                    <ul className="space-y-3" aria-label="Toggle page sections">
                      {Object.entries(PAGE_SECTION_CONFIG).map(function(entry) {
                        var key = entry[0]; var val = entry[1]; var isOn = form.page_sections[key];
                        return (
                          <li key={key}>
                            <div className={'flex items-center justify-between p-4 rounded-xl border-2 transition-all ' + (isOn ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60')}>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{val.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{val.desc}</p>
                              </div>
                              <Toggle checked={isOn} onChange={function() { toggleSection(key); }} label={(isOn ? 'Hide ' : 'Show ') + val.label + ' section'} id={'section-toggle-' + key} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </AppearanceSection>
                </div>
              )}

              {/* ════════════════════════════════════════
                  TAB 4 — PUBLISH
              ════════════════════════════════════════ */}
              {activeSection === 'publish' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Publish</p>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Visibility & Channels</h2>
                    <p className="text-gray-500 text-sm mb-6">Control where your organization and events appear.</p>

                    {/* Public page toggle */}
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Organization Page</h3>
                      <div className={'flex items-center justify-between p-5 rounded-xl border-2 transition-all ' + (form.is_public ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50')}>
                        <div className="flex items-center gap-4">
                          <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ' + (form.is_public ? 'bg-green-100' : 'bg-gray-200')} aria-hidden="true">
                            <Icon
                              path={form.is_public
                                ? ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064']
                                : 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'}
                              className={'h-5 w-5 ' + (form.is_public ? 'text-green-500' : 'text-gray-400')}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{form.is_public ? 'Page is Public' : 'Page is Private'}</p>
                            <p className="text-sm text-gray-500">{form.is_public ? 'Anyone can find and view your public page' : 'Your page is hidden from the public'}</p>
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

                    {/* Event channels */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Event Publish Channels</h3>
                      <p className="text-xs text-gray-400 mb-4">Org-level defaults — individual events can override these.</p>
                      <div className="space-y-3">
                        {/* Website channel */}
                        <div className={'flex items-center justify-between p-4 rounded-xl border transition-all ' + (form.publish_channels.website ? 'border-blue-500/50 bg-gray-100' : 'border-gray-200 bg-gray-50')}>
                          <div className="flex items-center gap-3">
                            <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (form.publish_channels.website ? 'bg-blue-100' : 'bg-gray-200')} aria-hidden="true">
                              <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className={'h-4 w-4 ' + (form.publish_channels.website ? 'text-blue-400' : 'text-gray-400')} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">Org Website</p>
                              <p className="text-xs text-gray-500">Events appear on your public organization page</p>
                            </div>
                          </div>
                          <Toggle checked={form.publish_channels.website} onChange={function() { setPublishChannel('website', !form.publish_channels.website); }}
                            label={form.publish_channels.website ? 'Disable org website channel' : 'Enable org website channel'} id="channel-website-toggle" />
                        </div>

                        {/* Discovery channel */}
                        <div className={'flex items-center justify-between p-4 rounded-xl border transition-all ' + (form.publish_channels.discovery ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50')}>
                          <div className="flex items-center gap-3">
                            <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (form.publish_channels.discovery ? 'bg-purple-100' : 'bg-gray-200')} aria-hidden="true">
                              <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className={'h-4 w-4 ' + (form.publish_channels.discovery ? 'text-purple-400' : 'text-gray-400')} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">Syndicade Discovery</p>
                              <p className="text-xs text-gray-500">Events appear on the public Syndicade discovery page</p>
                            </div>
                          </div>
                          <Toggle checked={form.publish_channels.discovery} onChange={function() { setPublishChannel('discovery', !form.publish_channels.discovery); }}
                            label={form.publish_channels.discovery ? 'Disable discovery channel' : 'Enable discovery channel'} id="channel-discovery-toggle" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Public URL card */}
                  {org && org.slug && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Your Public URL</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <code className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-600 text-sm font-mono break-all flex-1">
                          {window.location.origin + '/org/' + org.slug}
                        </code>
                        <a href={'/org/' + org.slug} target="_blank" rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex-shrink-0"
                          aria-label="Open public page in new tab">
                          Open Page
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </main>
          </div>
        </div>

        {/* ── Live Preview panel ── */}
        {previewOpen && (
          <div ref={previewPanelRef} className="flex-1 overflow-hidden bg-gray-200 flex flex-col border-l border-gray-300" aria-label="Live preview" role="region">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5" aria-hidden="true">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-2">Live Preview</span>
              </div>
              <span className="text-xs text-gray-400">Updates instantly as you edit</span>
            </div>

            <div className="flex-1 overflow-hidden p-3" style={{ position: 'relative' }}>
              <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg" style={{ position: 'relative' }}>
                <div style={{
                  width: PREVIEW_WIDTH + 'px',
                  transform: 'scale(' + previewScale + ')',
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                  {siteBlocks.length > 0 ? (
                    <PreviewNewPage
                      org={previewOrg}
                      pages={sitePages}
                      blocks={siteBlocks}
                      primary={form.theme.customColors[0] || form.theme.primaryColor || '#3B82F6'}
                      borderRadius={form.theme.buttonStyle === 'pill' ? '9999px' : form.theme.buttonStyle === 'sharp' ? '0px' : '8px'}
                      fontFamily={form.theme.fontPairing === 'serif' ? 'Georgia, serif' : form.theme.fontPairing === 'mono' ? '"Roboto Slab", Georgia, serif' : 'Inter, system-ui, sans-serif'}
                    />
                  ) : (
                    <>
                      {form.template === 'classic'  && <ClassicTemplate  {...previewTemplateProps} />}
                      {form.template === 'modern'   && <ModernTemplate   {...previewTemplateProps} />}
                      {form.template === 'banner'   && <BannerTemplate   {...previewTemplateProps} />}
                      {form.template === 'sidebar'  && <SidebarTemplate  {...previewTemplateProps} />}
                      {form.template === 'featured' && <FeaturedTemplate {...previewTemplateProps} />}
                      {form.template !== 'classic' && form.template !== 'modern' && form.template !== 'banner' && form.template !== 'sidebar' && form.template !== 'featured' && <ClassicTemplate {...previewTemplateProps} />}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}