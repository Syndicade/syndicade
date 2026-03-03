import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function Icon({ path, className }) {
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
            return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />;
          })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  globe:    ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  palette:  ['M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'],
  eye:      ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  upload:   ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'],
  chevLeft: 'M15 19l-7-7 7-7',
  page:     ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  warning:  ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

var TABS = [
  { id: 'pages',      label: 'Pages',      iconKey: 'page'    },
  { id: 'appearance', label: 'Appearance', iconKey: 'palette' },
  { id: 'publish',    label: 'Publish',    iconKey: 'upload'  },
];

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

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
}

function HeaderSkeleton() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-5 w-48 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="p-8 animate-pulse space-y-4">
      <div className="h-6 w-40 bg-gray-200 rounded" />
      <div className="h-4 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[1, 2, 3, 4].map(function(i) {
          return <div key={i} className="h-24 bg-gray-100 rounded-xl border border-gray-200" />;
        })}
      </div>
    </div>
  );
}

// ── Pages Tab ────────────────────────────────────────────────────────────────
function PagesTab({ pages, orgId, onPagesChanged, onOrderChanged, onLivePagesChange }) {
  var [localPages, setLocalPages] = useState(pages);
  var [saving, setSaving] = useState(null);
  var [savingOrder, setSavingOrder] = useState(false);

  useEffect(function() { setLocalPages(pages); }, [pages]);

  function updateLocal(newPages) {
    setLocalPages(newPages);
    onLivePagesChange(newPages);
  }

  async function togglePage(page) {
    var newVal = !page.is_enabled;
    var updated = localPages.map(function(p) {
      return p.id === page.id ? Object.assign({}, p, { is_enabled: newVal }) : p;
    });
    updateLocal(updated);
    setSaving(page.id);
    try {
      var result = await supabase
        .from('org_site_pages')
        .update({ is_enabled: newVal, updated_at: new Date().toISOString() })
        .eq('id', page.id);
      if (result.error) throw result.error;
      onPagesChanged(page.id, { is_enabled: newVal });
    } catch (err) {
      updateLocal(localPages);
      toast.error('Could not update page: ' + err.message);
    } finally {
      setSaving(null);
    }
  }

  async function toggleNav(page) {
    var newVal = !page.is_visible_in_nav;
    var updated = localPages.map(function(p) {
      return p.id === page.id ? Object.assign({}, p, { is_visible_in_nav: newVal }) : p;
    });
    updateLocal(updated);
    setSaving(page.id + '-nav');
    try {
      var result = await supabase
        .from('org_site_pages')
        .update({ is_visible_in_nav: newVal, updated_at: new Date().toISOString() })
        .eq('id', page.id);
      if (result.error) throw result.error;
      onPagesChanged(page.id, { is_visible_in_nav: newVal });
    } catch (err) {
      updateLocal(localPages);
      toast.error('Could not update navigation: ' + err.message);
    } finally {
      setSaving(null);
    }
  }

  function updateTitle(pageId, title) {
    var newKey = slugify(title);
    var updated = localPages.map(function(p) {
      return p.id === pageId ? Object.assign({}, p, { title: title, page_key: newKey }) : p;
    });
    updateLocal(updated);
  }

  function updateLabel(pageId, label) {
    var updated = localPages.map(function(p) {
      return p.id === pageId ? Object.assign({}, p, { nav_label: label }) : p;
    });
    updateLocal(updated);
  }

  function moveUp(index) {
    if (index === 0) return;
    var next = localPages.slice();
    var temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    next = next.map(function(p, i) { return Object.assign({}, p, { sort_order: i }); });
    updateLocal(next);
  }

  function moveDown(index) {
    if (index === localPages.length - 1) return;
    var next = localPages.slice();
    var temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    next = next.map(function(p, i) { return Object.assign({}, p, { sort_order: i }); });
    updateLocal(next);
  }

  async function saveOrder() {
    setSavingOrder(true);
    try {
      var updates = localPages.map(function(p) {
        return supabase
          .from('org_site_pages')
          .update({
            sort_order: p.sort_order,
            nav_label: p.nav_label,
            title: p.title,
            page_key: p.page_key,
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.id);
      });
      var results = await Promise.all(updates);
      var failed = results.find(function(r) { return r.error; });
      if (failed) throw failed.error;

      var navItems = localPages
        .filter(function(p) { return p.is_enabled && p.is_visible_in_nav; })
        .map(function(p) { return { id: p.page_key, label: p.nav_label, type: 'page', page_key: p.page_key }; });

      await supabase
        .from('org_site_nav')
        .upsert({ organization_id: orgId, items: navItems, updated_at: new Date().toISOString() }, { onConflict: 'organization_id' });

      toast.success('Pages saved.');
      onOrderChanged();
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    } finally {
      setSavingOrder(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Pages</h2>
        <p className="text-gray-500 mt-1 text-sm">Customize page names, nav labels, order, and visibility.</p>
      </div>

      <div className="grid grid-cols-12 gap-2 px-3 mb-2">
        <div className="col-span-1" />
        <div className="col-span-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Page Name</span>
        </div>
        <div className="col-span-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nav Label</span>
        </div>
        <div className="col-span-2 text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">In Nav</span>
        </div>
        <div className="col-span-2 text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">On</span>
        </div>
      </div>

      <div className="space-y-2" role="list" aria-label="Site pages">
        {localPages.map(function(page, index) {
          return (
            <div
              key={page.id}
              role="listitem"
              className={'grid grid-cols-12 gap-2 items-center p-3 rounded-xl border transition-colors ' +
                (page.is_enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60')}
            >
              {/* Reorder arrows */}
              <div className="col-span-1 flex flex-col gap-0.5 items-center">
                <button
                  onClick={function() { moveUp(index); }}
                  disabled={index === 0}
                  aria-label={'Move ' + page.title + ' up'}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={function() { moveDown(index); }}
                  disabled={index === localPages.length - 1}
                  aria-label={'Move ' + page.title + ' down'}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Page title (editable) + auto slug */}
              <div className="col-span-4">
                <input
                  type="text"
                  value={page.title}
                  onChange={function(e) { updateTitle(page.id, e.target.value); }}
                  aria-label={'Page name for ' + page.title}
                  disabled={!page.is_enabled}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:opacity-40"
                  maxLength={40}
                />
                <p className="text-xs text-gray-400 mt-0.5 px-1">/{page.page_key}</p>
              </div>

              {/* Nav label */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={page.nav_label}
                  onChange={function(e) { updateLabel(page.id, e.target.value); }}
                  aria-label={'Navigation label for ' + page.title}
                  disabled={!page.is_enabled}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 disabled:opacity-40"
                  maxLength={30}
                />
              </div>

              {/* In nav toggle */}
              <div className="col-span-2 flex justify-center">
                <button
                  role="switch"
                  aria-checked={page.is_visible_in_nav}
                  aria-label={'Toggle navigation visibility for ' + page.title}
                  disabled={!page.is_enabled || saving === page.id + '-nav'}
                  onClick={function() { toggleNav(page); }}
                  className={'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ' +
                    (page.is_visible_in_nav && page.is_enabled ? 'bg-blue-500' : 'bg-gray-300')}
                >
                  <span className={'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ' +
                    (page.is_visible_in_nav && page.is_enabled ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
              </div>

              {/* Enabled toggle */}
              <div className="col-span-2 flex justify-center">
                <button
                  role="switch"
                  aria-checked={page.is_enabled}
                  aria-label={'Toggle ' + page.title + ' page'}
                  disabled={saving === page.id}
                  onClick={function() { togglePage(page); }}
                  className={'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ' +
                    (page.is_enabled ? 'bg-green-500' : 'bg-gray-300')}
                >
                  <span className={'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ' +
                    (page.is_enabled ? 'translate-x-4' : 'translate-x-0.5')} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <button
          onClick={saveOrder}
          disabled={savingOrder}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {savingOrder ? 'Saving...' : 'Save Pages & Navigation'}
        </button>
      </div>
    </div>
  );
}

// ── Appearance Tab ────────────────────────────────────────────────────────────
function AppearanceTab({ config, orgId, onConfigUpdated, onLiveChange }) {
  var [form, setForm] = useState({
    template_id:     config.template_id     || 'modern',
    primary_color:   config.primary_color   || '#3B82F6',
    secondary_color: config.secondary_color || '#1E40AF',
    font_pairing:    config.font_pairing    || 'inter',
    button_style:    config.button_style    || 'rounded',
    header_style:    config.header_style    || 'light',
  });
  var [saving, setSaving] = useState(false);

  function handleChange(key, value) {
    setForm(function(prev) {
      var next = Object.assign({}, prev, { [key]: value });
      onLiveChange(next);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      var result = await supabase
        .from('org_site_config')
        .update(Object.assign({}, form, { updated_at: new Date().toISOString() }))
        .eq('organization_id', orgId);
      if (result.error) throw result.error;
      toast.success('Appearance saved.');
      onConfigUpdated();
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  var templates = [
    { id: 'modern',  label: 'Modern',  desc: 'Clean, minimal with card sections' },
    { id: 'classic', label: 'Classic', desc: 'Full-width banner with sidebar'     },
    { id: 'impact',  label: 'Impact',  desc: 'Bold dark hero, high contrast'      },
  ];

  var fonts = [
    { id: 'inter', label: 'Inter',        sample: 'Modern & Clean'    },
    { id: 'serif', label: 'Merriweather', sample: 'Classic & Elegant' },
    { id: 'mono',  label: 'Roboto Slab',  sample: 'Strong & Bold'     },
  ];

  var buttonStyles = [
    {
      id: 'rounded', label: 'Rounded',
      preview: <span className="px-4 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: form.primary_color, borderRadius: '8px' }}>Button</span>,
    },
    {
      id: 'pill', label: 'Pill',
      preview: <span className="px-4 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: form.primary_color, borderRadius: '999px' }}>Button</span>,
    },
    {
      id: 'sharp', label: 'Sharp',
      preview: <span className="px-4 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: form.primary_color, borderRadius: '0px' }}>Button</span>,
    },
  ];

  var headerStyles = [
    {
      id: 'light', label: 'Light',
      preview: (
        <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
            <span className="text-xs font-bold text-gray-900">Org Name</span>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-500">Home</span>
              <span className="text-xs text-gray-500">About</span>
              <span className="text-xs font-semibold text-white px-2 py-0.5" style={{ backgroundColor: form.primary_color, borderRadius: '4px' }}>Join</span>
            </div>
          </div>
          <div className="h-6 bg-gray-50" />
        </div>
      ),
    },
    {
      id: 'dark', label: 'Dark',
      preview: (
        <div className="w-full rounded-lg border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
            <span className="text-xs font-bold text-white">Org Name</span>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-400">Home</span>
              <span className="text-xs text-gray-400">About</span>
              <span className="text-xs font-semibold text-white px-2 py-0.5" style={{ backgroundColor: form.primary_color, borderRadius: '4px' }}>Join</span>
            </div>
          </div>
          <div className="h-6 bg-gray-800" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
        <p className="text-gray-500 mt-1 text-sm">Customize how your public website looks.</p>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Template</h3>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Template selection">
          {templates.map(function(t) {
            var isSelected = form.template_id === t.id;
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={isSelected}
                onClick={function() { handleChange('template_id', t.id); }}
                className={'p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
                  (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}
              >
                <p className={'font-bold text-sm ' + (isSelected ? 'text-blue-700' : 'text-gray-900')}>{t.label}</p>
                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Brand Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                id="primary-color"
                type="color"
                value={form.primary_color}
                onChange={function(e) { handleChange('primary_color', e.target.value); }}
                className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Primary color picker"
              />
              <span className="text-sm text-gray-500 font-mono">{form.primary_color}</span>
            </div>
          </div>
          <div>
            <label htmlFor="secondary-color" className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                id="secondary-color"
                type="color"
                value={form.secondary_color}
                onChange={function(e) { handleChange('secondary_color', e.target.value); }}
                className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Secondary color picker"
              />
              <span className="text-sm text-gray-500 font-mono">{form.secondary_color}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Font Pairing</h3>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Font selection">
          {fonts.map(function(f) {
            var isSelected = form.font_pairing === f.id;
            return (
              <button
                key={f.id}
                role="radio"
                aria-checked={isSelected}
                onClick={function() { handleChange('font_pairing', f.id); }}
                className={'p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
                  (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}
              >
                <p className={'font-bold text-sm ' + (isSelected ? 'text-blue-700' : 'text-gray-900')}>{f.label}</p>
                <p className="text-xs text-gray-500 mt-1">{f.sample}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Button Style</h3>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Button style selection">
          {buttonStyles.map(function(b) {
            var isSelected = form.button_style === b.id;
            return (
              <button
                key={b.id}
                role="radio"
                aria-checked={isSelected}
                onClick={function() { handleChange('button_style', b.id); }}
                className={'p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
                  (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}
              >
                <div className="mb-3">{b.preview}</div>
                <p className={'text-xs font-bold ' + (isSelected ? 'text-blue-700' : 'text-gray-600')}>{b.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Header Style</h3>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Header style selection">
          {headerStyles.map(function(h) {
            var isSelected = form.header_style === h.id;
            return (
              <button
                key={h.id}
                role="radio"
                aria-checked={isSelected}
                onClick={function() { handleChange('header_style', h.id); }}
                className={'p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
                  (isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300')}
              >
                <div className="mb-3">{h.preview}</div>
                <p className={'text-xs font-bold ' + (isSelected ? 'text-blue-700' : 'text-gray-600')}>{h.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Save Appearance'}
      </button>
    </div>
  );
}

// ── Publish Tab ───────────────────────────────────────────────────────────────
function PublishTab({ org, config, orgId, onPublished }) {
  var [publishing, setPublishing] = useState(false);
  var [unpublishing, setUnpublishing] = useState(false);

  async function handlePublish() {
    setPublishing(true);
    try {
      var userResult = await supabase.auth.getUser();
      if (userResult.error) throw userResult.error;
      var snapshot = { org_id: orgId, published_at: new Date().toISOString(), template: config.template_id };
      var logResult = await supabase.from('org_site_publish_log').insert({
        organization_id: orgId,
        published_by: userResult.data.user.id,
        snapshot: snapshot,
      });
      if (logResult.error) throw logResult.error;
      var configResult = await supabase
        .from('org_site_config')
        .update({ is_published: true, published_at: new Date().toISOString(), published_by: userResult.data.user.id, updated_at: new Date().toISOString() })
        .eq('organization_id', orgId);
      if (configResult.error) throw configResult.error;
      var orgResult = await supabase.from('organizations').update({ is_published: true, is_public: true }).eq('id', orgId);
      if (orgResult.error) throw orgResult.error;
      toast.success('Site published successfully.');
      onPublished();
    } catch (err) {
      toast.error('Publish failed: ' + err.message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!window.confirm('Unpublish your site? It will no longer be visible to the public.')) return;
    setUnpublishing(true);
    try {
      await supabase.from('org_site_config').update({ is_published: false, updated_at: new Date().toISOString() }).eq('organization_id', orgId);
      await supabase.from('organizations').update({ is_published: false, is_public: false }).eq('id', orgId);
      toast.success('Site unpublished.');
      onPublished();
    } catch (err) {
      toast.error('Could not unpublish: ' + err.message);
    } finally {
      setUnpublishing(false);
    }
  }

  var isPublished = config.is_published;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Publish</h2>
        <p className="text-gray-500 mt-1 text-sm">Control your site's public visibility.</p>
      </div>

      <div className={'p-5 rounded-xl border-2 ' + (isPublished ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50')}>
        <div className="flex items-center gap-3 mb-2">
          <div className={'w-3 h-3 rounded-full ' + (isPublished ? 'bg-green-500' : 'bg-gray-400')} aria-hidden="true" />
          <p className={'font-bold ' + (isPublished ? 'text-green-800' : 'text-gray-700')}>
            {isPublished ? 'Your site is live' : 'Your site is not published'}
          </p>
        </div>
        {isPublished && org.slug && (
          <a
            href={'/org/' + org.slug}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 underline hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
          >
            {window.location.origin + '/org/' + org.slug}
          </a>
        )}
        {isPublished && config.published_at && (
          <p className="text-xs text-green-600 mt-1">
            {'Last published: ' + new Date(config.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
      </div>

      {!org.slug && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <Icon path={ICONS.warning} className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">Your organization needs a slug (URL) before you can publish. Set it in the Org Profile settings.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePublish}
          disabled={publishing || !org.slug}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {publishing ? 'Publishing...' : (isPublished ? 'Republish' : 'Publish Site')}
        </button>
        {isPublished && (
          <button
            onClick={handleUnpublish}
            disabled={unpublishing}
            className="px-6 py-3 bg-white text-red-600 border border-red-300 font-semibold rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {unpublishing ? 'Unpublishing...' : 'Unpublish'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Live Preview ──────────────────────────────────────────────────────────────
function LivePreview({ org, liveConfig, pages, navItems }) {
  var enabledNavItems;
  if (navItems.length > 0) {
    enabledNavItems = navItems;
  } else {
    enabledNavItems = pages
      .filter(function(p) { return p.is_enabled && p.is_visible_in_nav; })
      .map(function(p) { return { label: p.nav_label, page_key: p.page_key }; });
  }

  var primary = liveConfig.primary_color || '#3B82F6';
  var secondary = liveConfig.secondary_color || '#1E40AF';
  var headerDark = liveConfig.header_style === 'dark';
  var template = liveConfig.template_id || 'modern';

  var borderRadius;
  if (liveConfig.button_style === 'pill') { borderRadius = '999px'; }
  else if (liveConfig.button_style === 'sharp') { borderRadius = '0px'; }
  else { borderRadius = '8px'; }

  var fontFamily;
  if (liveConfig.font_pairing === 'serif') { fontFamily = 'Georgia, serif'; }
  else if (liveConfig.font_pairing === 'mono') { fontFamily = '"Roboto Slab", Georgia, serif'; }
  else { fontFamily = 'Inter, system-ui, sans-serif'; }

  var enabledPages = pages.filter(function(p) { return p.is_enabled && p.page_key !== 'home'; }).slice(0, 3);
  var navBg = headerDark ? '#111827' : '#ffffff';
  var navBorder = headerDark ? '#374151' : '#e5e7eb';
  var navTextColor = headerDark ? '#d1d5db' : '#374151';
  var logoTextColor = headerDark ? '#ffffff' : '#111827';

  var navBar = (
    <div style={{ backgroundColor: navBg, borderBottom: '1px solid ' + navBorder }} className="sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name + ' logo'} className="h-6 w-6 rounded-full object-cover" />
            : <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: primary }}>{(org.name || 'O').charAt(0)}</div>
          }
          <span style={{ color: logoTextColor, fontWeight: 700, fontSize: '12px' }}>{org.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {enabledNavItems.slice(0, 4).map(function(item) {
            return <span key={item.page_key || item.id} style={{ color: navTextColor, fontSize: '10px' }}>{item.label}</span>;
          })}
          <span className="text-white font-semibold px-2 py-0.5" style={{ backgroundColor: primary, borderRadius: borderRadius, fontSize: '10px' }}>Join</span>
        </div>
      </div>
    </div>
  );

  var footer = (
    <div className="px-6 py-4 text-center border-t border-gray-200" style={{ backgroundColor: headerDark ? '#111827' : '#f9fafb' }}>
      <p style={{ color: headerDark ? '#9ca3af' : '#6b7280', fontSize: '10px' }}>
        {'© ' + new Date().getFullYear() + ' ' + org.name + '. Powered by Syndicade.'}
      </p>
    </div>
  );

  if (template === 'modern') {
    return (
      <div className="flex-1 overflow-y-auto" style={{ fontFamily: fontFamily, fontSize: '12px' }}>
        {navBar}
        <div className="px-6 py-10 text-center" style={{ background: 'linear-gradient(135deg, ' + primary + '15 0%, ' + secondary + '08 100%)' }}>
          {org.logo_url && <img src={org.logo_url} alt={org.name} className="h-12 w-12 rounded-full object-cover mx-auto mb-3 border-2 border-white shadow" />}
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: fontFamily }}>{org.name}</h1>
          {org.tagline && <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>{org.tagline}</p>}
          <div className="flex items-center justify-center gap-2">
            <span className="text-white font-semibold px-4 py-1.5" style={{ backgroundColor: primary, borderRadius: borderRadius, fontSize: '11px' }}>Get Involved</span>
            <span className="font-semibold px-4 py-1.5" style={{ color: primary, border: '2px solid ' + primary, borderRadius: borderRadius, fontSize: '11px' }}>Learn More</span>
          </div>
        </div>
        {org.description && (
          <div className="px-6 py-6 bg-white">
            <div className="max-w-sm mx-auto text-center">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>Our Mission</p>
              <p style={{ color: '#374151', lineHeight: 1.7, fontSize: '11px' }}>{org.description}</p>
            </div>
          </div>
        )}
        <div className="px-6 py-6 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            {enabledPages.map(function(page) {
              return (
                <div key={page.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: primary, fontSize: '9px' }}>{page.title}</p>
                  <div className="h-1.5 bg-gray-200 rounded w-full mb-1.5" />
                  <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1.5" />
                  <div className="h-1.5 bg-gray-200 rounded w-1/2" />
                </div>
              );
            })}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  if (template === 'classic') {
    return (
      <div className="flex-1 overflow-y-auto" style={{ fontFamily: fontFamily, fontSize: '12px' }}>
        {navBar}
        <div className="w-full py-12 px-6 relative overflow-hidden" style={{ backgroundColor: primary }}>
          <div className="relative z-10 max-w-xs">
            {org.logo_url && <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded object-cover mb-3 border-2 border-white shadow" />}
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px', fontFamily: fontFamily, lineHeight: 1.2 }}>{org.name}</h1>
            {org.tagline && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginBottom: '16px' }}>{org.tagline}</p>}
            <span className="font-semibold px-4 py-1.5 bg-white" style={{ color: primary, borderRadius: borderRadius, fontSize: '11px' }}>Learn More</span>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10" style={{ backgroundColor: secondary }} />
        </div>
        <div className="flex">
          <div className="flex-1 px-6 py-6 bg-white">
            {org.description && (
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary, fontSize: '9px' }}>Our Mission</p>
                <p style={{ color: '#374151', lineHeight: 1.7, fontSize: '11px' }}>{org.description}</p>
              </div>
            )}
            {enabledPages.slice(0, 2).map(function(page) {
              return (
                <div key={page.id} className="mb-4 pb-4 border-b border-gray-100">
                  <p className="font-bold mb-1.5" style={{ color: primary, fontSize: '11px' }}>{page.title}</p>
                  <div className="h-1.5 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                </div>
              );
            })}
          </div>
          <div className="w-36 flex-shrink-0 bg-gray-50 border-l border-gray-200 px-4 py-6">
            <p className="font-bold uppercase tracking-wide text-gray-500 mb-3" style={{ fontSize: '9px' }}>Quick Links</p>
            {enabledNavItems.slice(0, 6).map(function(item) {
              return (
                <p key={item.page_key || item.id} className="py-1 border-b border-gray-200" style={{ color: primary, fontSize: '10px' }}>{item.label}</p>
              );
            })}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ fontFamily: fontFamily, fontSize: '12px' }}>
      {navBar}
      <div className="px-6 py-14 text-center relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 60% 50%, ' + primary + ', transparent 70%)' }} />
        <div className="relative z-10">
          {org.logo_url && <img src={org.logo_url} alt={org.name} className="h-14 w-14 rounded-full object-cover mx-auto mb-4 border-4 shadow-xl" style={{ borderColor: primary }} />}
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', marginBottom: '8px', fontFamily: fontFamily, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>{org.name}</h1>
          {org.tagline && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>{org.tagline}</p>}
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold px-4 py-1.5" style={{ backgroundColor: primary, color: '#ffffff', borderRadius: borderRadius, fontSize: '11px' }}>Take Action</span>
            <span className="font-bold px-4 py-1.5" style={{ border: '2px solid rgba(255,255,255,0.4)', color: '#ffffff', borderRadius: borderRadius, fontSize: '11px' }}>Our Story</span>
          </div>
        </div>
      </div>
      {org.description && (
        <div className="px-6 py-6" style={{ backgroundColor: primary }}>
          <div className="max-w-sm mx-auto text-center">
            <p style={{ color: '#ffffff', lineHeight: 1.7, fontSize: '11px', fontWeight: 500 }}>{org.description}</p>
          </div>
        </div>
      )}
      <div className="bg-white">
        {enabledPages.map(function(page, i) {
          return (
            <div
              key={page.id}
              className="flex items-center gap-4 px-6 py-4 border-b border-gray-100"
              style={{ borderLeft: '4px solid ' + (i === 0 ? primary : secondary) }}
            >
              <div className="flex-1">
                <p className="font-black uppercase tracking-wide mb-1.5" style={{ color: '#111827', fontSize: '11px' }}>{page.title}</p>
                <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1" />
                <div className="h-1.5 bg-gray-200 rounded w-1/2" />
              </div>
              <span className="font-bold px-2 py-0.5" style={{ backgroundColor: primary + '15', color: primary, borderRadius: borderRadius, fontSize: '10px' }}>View</span>
            </div>
          );
        })}
      </div>
      {footer}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function WebsiteBuilder() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();

  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [org, setOrg] = useState(null);
  var [config, setConfig] = useState(null);
  var [pages, setPages] = useState([]);
  var [livePages, setLivePages] = useState([]);
  var [navItems, setNavItems] = useState([]);
  var [activeTab, setActiveTab] = useState('pages');
  var [liveConfig, setLiveConfig] = useState(null);

  useEffect(function() { fetchAll(); }, [organizationId]);

  async function fetchAll() {
    setLoading(true);
    try {
      var userResult = await supabase.auth.getUser();
      if (userResult.error) throw userResult.error;
      if (!userResult.data.user) { navigate('/login'); return; }

      var memberResult = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', userResult.data.user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (!memberResult.data || memberResult.data.role !== 'admin') {
        setError('Admin access required to use the Website Builder.');
        setLoading(false);
        return;
      }

      var orgResult = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrg(orgResult.data);

      var configResult = await supabase.from('org_site_config').select('*').eq('organization_id', organizationId).maybeSingle();
      if (configResult.error) throw configResult.error;
      var siteConfig = configResult.data;
      if (!siteConfig) {
        var insertResult = await supabase
          .from('org_site_config')
          .upsert({ organization_id: organizationId }, { onConflict: 'organization_id' })
          .select()
          .single();
        if (insertResult.error) throw insertResult.error;
        siteConfig = insertResult.data;
      }
      setConfig(siteConfig);
      setLiveConfig(siteConfig);

      var pagesResult = await supabase
        .from('org_site_pages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order', { ascending: true });
      if (pagesResult.error) throw pagesResult.error;
      var existingPages = pagesResult.data || [];
      if (existingPages.length === 0) {
        var toInsert = DEFAULT_PAGES.map(function(p) {
          return Object.assign({}, p, { organization_id: organizationId });
        });
        var insertPagesResult = await supabase.from('org_site_pages').insert(toInsert).select();
        if (insertPagesResult.error) throw insertPagesResult.error;
        existingPages = insertPagesResult.data;
      }
      setPages(existingPages);
      setLivePages(existingPages);

      var navResult = await supabase.from('org_site_nav').select('*').eq('organization_id', organizationId).maybeSingle();
      if (navResult.data) setNavItems(navResult.data.items || []);

    } catch (err) {
      console.error('WebsiteBuilder fetchAll error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePagesChanged(pageId, updates) {
    setPages(function(prev) {
      return prev.map(function(p) { return p.id === pageId ? Object.assign({}, p, updates) : p; });
    });
  }

  function handleLivePagesChange(updated) {
    setLivePages(updated);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderSkeleton />
        <div className="max-w-4xl mx-auto px-4 py-8"><ContentSkeleton /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Icon path={ICONS.warning} className="h-14 w-14 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cannot Access Website Builder</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={function() { navigate('/organizations/' + organizationId); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={function() { navigate('/organizations/' + organizationId); }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Back to dashboard"
            >
              <Icon path={ICONS.chevLeft} className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Website Builder</h1>
              <p className="text-xs text-gray-400">{org.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {config.is_published && org.slug && (
              <a
                href={'/org/' + org.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                <Icon path={ICONS.eye} className="h-4 w-4" />
                View Live Site
              </a>
            )}
            <span className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ' +
              (config.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
              <span className={'w-1.5 h-1.5 rounded-full ' + (config.is_published ? 'bg-green-500' : 'bg-gray-400')} aria-hidden="true" />
              {config.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 65px)' }}>

        {/* Sidebar */}
        <nav className="w-44 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto" aria-label="Website builder sections">
          {TABS.map(function(tab) {
            var isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={function() { setActiveTab(tab.id); }}
                aria-current={isActive ? 'page' : undefined}
                className={'w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left border-l-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ' +
                  (isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900')}
              >
                <Icon path={ICONS[tab.iconKey]} className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content panel — fixed narrower width */}
        <main id="main-content" className="flex-1 bg-white border-r border-gray-200 overflow-y-auto p-6">
          {activeTab === 'pages' && (
            <PagesTab
              pages={pages}
              orgId={organizationId}
              onPagesChanged={handlePagesChanged}
              onOrderChanged={fetchAll}
              onLivePagesChange={handleLivePagesChange}
            />
          )}
          {activeTab === 'appearance' && (
            <AppearanceTab
              config={config}
              orgId={organizationId}
              onConfigUpdated={fetchAll}
              onLiveChange={function(updated) { setLiveConfig(updated); }}
            />
          )}
          {activeTab === 'publish' && (
            <PublishTab
              org={org}
              config={config}
              orgId={organizationId}
              onPublished={fetchAll}
            />
          )}
        </main>

        {/* Preview panel — flex-1 so it fills available space  */}
        <div className="w-96 flex-shrink-0 flex flex-col bg-gray-100 border-l border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</span>
            {org.slug && (
              <a
                href={'/org/' + org.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Open public page in new tab"
              >
                Open live site
              </a>
            )}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col bg-white shadow-inner">
            {liveConfig
              ? <LivePreview org={org} liveConfig={liveConfig} pages={livePages} navItems={navItems} />
              : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <Icon path={ICONS.globe} className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-semibold text-sm">Loading preview...</p>
                  </div>
                </div>
              )
            }
          </div>
        </div>

      </div>
    </div>
  );
}

export default WebsiteBuilder;