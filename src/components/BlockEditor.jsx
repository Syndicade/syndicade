import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { BlockPreview } from '../components/BlockRenderer';

// ── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ path, className, strokeWidth }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
    </svg>
  );
}

function Toggle({ checked, onChange, label, id }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} onClick={onChange}
      className={'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ' + (checked ? 'bg-blue-500' : 'bg-gray-300')}>
      <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ' + (checked ? 'left-[22px]' : 'left-0.5')} aria-hidden="true" />
    </button>
  );
}

var inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
var labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide';

// ── Block type definitions ────────────────────────────────────────────────────
var BLOCK_CATEGORIES = [
  {
    label: 'Core',
    blocks: [
      { type: 'hero',            label: 'Hero',              icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',          desc: 'Big headline with CTA button'         },
      { type: 'rich_text',       label: 'Rich Text',         icon: 'M4 6h16M4 12h16M4 18h7',                                                                                                                                                                                          desc: 'Formatted text content'              },
      { type: 'image_text',      label: 'Image + Text',      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',                                                    desc: 'Side-by-side image and text'         },
      { type: 'full_width_image',label: 'Full-Width Image',  icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',                                               desc: 'Full-width banner image'             },
      { type: 'video',           label: 'Video Embed',       icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',                                                                             desc: 'YouTube or Vimeo embed'              },
      { type: 'quote',           label: 'Quote/Testimonial', icon: 'M8 10.5H6a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1.5a4 4 0 01-4 4M18 10.5h-2a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1.5a4 4 0 01-4 4',                                                                       desc: 'Pull quote with attribution'         },
      { type: 'stats',           label: 'Stats/Impact',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',        desc: 'Impact numbers and metrics'         },
    ],
  },
  {
    label: 'Engagement',
    blocks: [
      { type: 'cta_banner',      label: 'CTA Banner',        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.952 9.168-5',                                                                          desc: 'Call-to-action strip with button'    },
      { type: 'email_signup',    label: 'Email Signup',      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',                                                                                                           desc: 'Email newsletter signup form'        },
      { type: 'contact_form',    label: 'Contact Form',      icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',                                                                                                      desc: 'Contact message form'               },
      { type: 'donation_button', label: 'Donation Button',   icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',                                                                                     desc: 'Donation CTA (placeholder)'         },
      { type: 'volunteer_signup',label: 'Volunteer Signup',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',      desc: 'Volunteer form (placeholder)'       },
      { type: 'petition',        label: 'Petition/Action',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',                                                                                           desc: 'Petition form (placeholder)'        },
    ],
  },
  {
    label: 'Org-Specific',
    blocks: [
      { type: 'events_list',     label: 'Events List',       icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',                                                                                                                         desc: 'Pulls from your events'             },
      { type: 'programs_list',   label: 'Programs List',     icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',                                                         desc: 'Showcase your programs'             },
      { type: 'team_grid',       label: 'Team/Leadership',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',      desc: 'Team member grid'                   },
      { type: 'membership_tiers',label: 'Membership Tiers',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',                                                                                                                         desc: 'Membership plans and pricing'       },
      { type: 'faq',             label: 'FAQ Accordion',     icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',                                                        desc: 'Frequently asked questions'         },
      { type: 'partner_logos',   label: 'Partner Logos',     icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',                                   desc: 'Partner and sponsor logos'          },
    ],
  },
  {
    label: 'Utility',
    blocks: [
      { type: 'divider',         label: 'Divider/Spacer',    icon: 'M5 12h14',                                                                                                                                                                                                        desc: 'Visual separator or spacing'        },
      { type: 'social_links',    label: 'Social Media Links', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',                                                                             desc: 'Social media link bar'              },
    ],
  },
];

// ── Default content per block type ───────────────────────────────────────────
function defaultContent(type) {
  var defaults = {
    hero:             { headline: '', subtext: '', cta_label: '', cta_url: '', image_url: '', image_alt: '', align: 'center' },
    rich_text:        { body: '' },
    image_text:       { image_url: '', image_alt: '', heading: '', body: '', image_position: 'left' },
    full_width_image: { image_url: '', image_alt: '', caption: '', height: 'medium' },
    video:            { url: '', caption: '' },
    quote:            { quote: '', attribution: '', role: '' },
    stats:            { heading: '', items: [{ label: 'Members', value: '0', prefix: '', suffix: '' }] },
    cta_banner:       { heading: '', subtext: '', cta_label: '', cta_url: '', bg_color: '#3B82F6' },
    email_signup:     { heading: 'Stay in the Loop', subtext: '', button_label: 'Subscribe', placeholder: 'Enter your email' },
    contact_form:     { heading: 'Get in Touch', subtext: '' },
    donation_button:  { heading: 'Support Our Mission', subtext: '', button_label: 'Donate Now', url: '' },
    volunteer_signup: { heading: 'Volunteer With Us', subtext: '', button_label: 'Sign Up to Volunteer' },
    petition:         { heading: 'Take Action', subtext: '', button_label: 'Sign the Petition', goal: '' },
    events_list:      { heading: 'Upcoming Events', limit: 3, show_past: false },
    programs_list:    { heading: 'Our Programs', items: [] },
    team_grid:        { heading: 'Our Team', members: [] },
    membership_tiers: { heading: 'Membership', tiers: [] },
    faq:              { heading: 'Frequently Asked Questions', items: [] },
    partner_logos:    { heading: 'Our Partners', partners: [] },
    divider:          { style: 'line', size: 'medium' },
    social_links:     { heading: '', links: [] },
  };
  return defaults[type] || {};
}

// ── Block label lookup ────────────────────────────────────────────────────────
function blockLabel(type) {
  for (var i = 0; i < BLOCK_CATEGORIES.length; i++) {
    for (var j = 0; j < BLOCK_CATEGORIES[i].blocks.length; j++) {
      if (BLOCK_CATEGORIES[i].blocks[j].type === type) return BLOCK_CATEGORIES[i].blocks[j].label;
    }
  }
  return type;
}

// ── Image uploader ────────────────────────────────────────────────────────────
function ImageUploader({ value, onChange, organizationId, label, fieldKey }) {
  var inputRef = useRef(null);
  var [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('File must be an image'); return; }
    setUploading(true);
    try {
      var ext = file.name.split('.').pop();
      var fileName = organizationId + '/blocks/' + fieldKey + '-' + Date.now() + '.' + ext;
      var uploadResult = await supabase.storage.from('organization-images').upload(fileName, file, { upsert: true });
      if (uploadResult.error) throw uploadResult.error;
      var urlResult = supabase.storage.from('organization-images').getPublicUrl(fileName);
      onChange(urlResult.data.publicUrl);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className={labelCls}>{label || 'Image'}</p>
      <div
        className="relative rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors cursor-pointer group overflow-hidden"
        style={{ minHeight: '100px' }}
        onClick={function() { inputRef.current && inputRef.current.click(); }}
        onKeyDown={function(e) { if (e.key === 'Enter') inputRef.current && inputRef.current.click(); }}
        tabIndex={0}
        role="button"
        aria-label={'Upload ' + (label || 'image')}>
        {value ? (
          <div>
            <img src={value} alt="Uploaded" className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white font-semibold text-sm">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400 group-hover:text-blue-400 transition-colors gap-1">
            {uploading
              ? <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              : <><Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="h-6 w-6" strokeWidth={1.5} /><p className="text-xs font-medium">Click to upload</p></>
            }
          </div>
        )}
      </div>
      {value && (
        <button onClick={function() { onChange(''); }} className="mt-1 text-xs text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded" aria-label="Remove image">
          Remove image
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={function(e) { e.target.files && e.target.files[0] && handleFile(e.target.files[0]); }} />
    </div>
  );
}
// ── Rich Text Editor ──────────────────────────────────────────────────────────
function RichTextEditor({ value, onChange }) {
  var editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
    ],
    content: value || '',
    onUpdate: function(ref) { onChange(ref.editor.getHTML()); },
  });

  if (!editor) return null;

  function ToolbarButton({ onClick, active, label, children }) {
    return (
      <button type="button" onMouseDown={function(e) { e.preventDefault(); onClick(); }}
        aria-label={label} aria-pressed={active}
        className={'p-1.5 rounded text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900')}>
        {children}
      </button>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarButton onClick={function() { editor.chain().focus().toggleBold().run(); }} active={editor.isActive('bold')} label="Bold">
          <span className="font-extrabold">B</span>
        </ToolbarButton>
        <ToolbarButton onClick={function() { editor.chain().focus().toggleItalic().run(); }} active={editor.isActive('italic')} label="Italic">
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton onClick={function() { editor.chain().focus().toggleUnderline().run(); }} active={editor.isActive('underline')} label="Underline">
          <span className="underline">U</span>
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />
        <ToolbarButton onClick={function() { editor.chain().focus().toggleHeading({ level: 2 }).run(); }} active={editor.isActive('heading', { level: 2 })} label="Heading 2">
          <span className="text-xs">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={function() { editor.chain().focus().toggleHeading({ level: 3 }).run(); }} active={editor.isActive('heading', { level: 3 })} label="Heading 3">
          <span className="text-xs">H3</span>
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />
        <ToolbarButton onClick={function() { editor.chain().focus().toggleBulletList().run(); }} active={editor.isActive('bulletList')} label="Bullet list">
          <Icon path="M4 6h16M4 12h10M4 18h12" className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={function() { editor.chain().focus().toggleOrderedList().run(); }} active={editor.isActive('orderedList')} label="Numbered list">
          <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={function() { editor.chain().focus().toggleBlockquote().run(); }} active={editor.isActive('blockquote')} label="Blockquote">
          <Icon path="M8 10.5H6a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1.5a4 4 0 01-4 4M18 10.5h-2a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1.5a4 4 0 01-4 4" className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />
        <ToolbarButton onClick={function() {
          var url = window.prompt('Enter URL:');
          if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }} active={editor.isActive('link')} label="Add link">
          <Icon path="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" className="h-3.5 w-3.5" />
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton onClick={function() { editor.chain().focus().unsetLink().run(); }} active={false} label="Remove link">
            <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" className="h-3.5 w-3.5 text-red-400" />
          </ToolbarButton>
        )}
        <div className="w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />
        <ToolbarButton onClick={function() { editor.chain().focus().undo().run(); }} active={false} label="Undo">
          <Icon path="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={function() { editor.chain().focus().redo().run(); }} active={false} label="Redo">
          <Icon path="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      {/* Editor area */}
      <EditorContent editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 min-h-[160px] text-gray-800 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[140px]" />
    </div>
  );
}
// ── Block edit forms ──────────────────────────────────────────────────────────
function BlockForm({ block, onChange, organizationId }) {
  var c = block.content;

  function set(key, value) {
    onChange(Object.assign({}, c, { [key]: value }));
  }

  function setNested(key, index, field, value) {
    var arr = (c[key] || []).slice();
    arr[index] = Object.assign({}, arr[index], { [field]: value });
    onChange(Object.assign({}, c, { [key]: arr }));
  }

  function addItem(key, defaults) {
    var arr = (c[key] || []).slice();
    arr.push(defaults);
    onChange(Object.assign({}, c, { [key]: arr }));
  }

  function removeItem(key, index) {
    var arr = (c[key] || []).filter(function(_, i) { return i !== index; });
    onChange(Object.assign({}, c, { [key]: arr }));
  }

  var type = block.block_type;

  // HERO
  if (type === 'hero') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-headline-' + block.id} className={labelCls}>Headline</label>
        <input id={'block-headline-' + block.id} type="text" value={c.headline || ''} onChange={function(e) { set('headline', e.target.value); }} placeholder="Your Organization's Big Headline" className={inputCls} maxLength={120} />
      </div>
      <div>
        <label htmlFor={'block-subtext-' + block.id} className={labelCls}>Subtext</label>
        <textarea id={'block-subtext-' + block.id} value={c.subtext || ''} onChange={function(e) { set('subtext', e.target.value); }} rows={2} placeholder="A brief supporting statement..." className={inputCls + ' resize-none'} maxLength={300} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'block-cta-label-' + block.id} className={labelCls}>CTA Button Label</label>
          <input id={'block-cta-label-' + block.id} type="text" value={c.cta_label || ''} onChange={function(e) { set('cta_label', e.target.value); }} placeholder="Get Involved" className={inputCls} />
        </div>
        <div>
          <label htmlFor={'block-cta-url-' + block.id} className={labelCls}>CTA Button URL</label>
          <input id={'block-cta-url-' + block.id} type="text" value={c.cta_url || ''} onChange={function(e) { set('cta_url', e.target.value); }} placeholder="#contact or https://..." className={inputCls} />
        </div>
      </div>
      <ImageUploader value={c.image_url || ''} onChange={function(v) { set('image_url', v); }} organizationId={organizationId} label="Background / Hero Image (optional)" fieldKey={'hero-' + block.id} />
      {c.image_url && (
        <div>
          <label htmlFor={'block-img-alt-' + block.id} className={labelCls}>Image Alt Text <span className="text-blue-500 font-normal normal-case tracking-normal">(Accessibility)</span></label>
          <input id={'block-img-alt-' + block.id} type="text" value={c.image_alt || ''} onChange={function(e) { set('image_alt', e.target.value); }} placeholder={'e.g. Volunteers at our annual fundraiser event'} className={inputCls} maxLength={200} />
          <p className="text-xs text-gray-400 mt-1">Describe the image for screen readers and search engines. Leave blank to use a default description. <a href="https://www.w3.org/WAI/tutorials/images/informative/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Why this matters</a></p>
        </div>
      )}
      <div>
        <p className={labelCls}>Text Alignment</p>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map(function(a) {
            return (
              <button key={a} onClick={function() { set('align', a); }}
                className={'flex-1 py-2 text-xs font-semibold rounded-lg border-2 capitalize transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (c.align === a ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                {a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

// RICH TEXT
  if (type === 'rich_text') return (
    <div>
      <p className={labelCls}>Content</p>
      <RichTextEditor value={c.body || ''} onChange={function(html) { set('body', html); }} />
    </div>
  );

  // IMAGE + TEXT
  if (type === 'image_text') return (
    <div className="space-y-4">
      <ImageUploader value={c.image_url || ''} onChange={function(v) { set('image_url', v); }} organizationId={organizationId} label="Image" fieldKey={'imgtext-' + block.id} />
      {c.image_url && (
        <div>
          <label htmlFor={'block-img-alt-imgtext-' + block.id} className={labelCls}>Image Alt Text <span className="text-blue-500 font-normal normal-case tracking-normal">(Accessibility)</span></label>
          <input id={'block-img-alt-imgtext-' + block.id} type="text" value={c.image_alt || ''} onChange={function(e) { set('image_alt', e.target.value); }} placeholder="e.g. Volunteers working together at our community garden event" className={inputCls} maxLength={200} />
          <p className="text-xs text-gray-400 mt-1">Describe what's in the image for screen readers. <a href="https://www.w3.org/WAI/tutorials/images/informative/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Why this matters</a></p>
        </div>
      )}
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Section Heading" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-body-' + block.id} className={labelCls}>Body Text</label>
        <textarea id={'block-body-' + block.id} value={c.body || ''} onChange={function(e) { set('body', e.target.value); }} rows={4} placeholder="Supporting text..." className={inputCls + ' resize-none'} />
      </div>
      <div>
        <p className={labelCls}>Image Position</p>
        <div className="flex gap-2">
          {['left', 'right'].map(function(pos) {
            return (
              <button key={pos} onClick={function() { set('image_position', pos); }}
                className={'flex-1 py-2 text-xs font-semibold rounded-lg border-2 capitalize transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (c.image_position === pos ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                Image {pos}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // FULL WIDTH IMAGE
  if (type === 'full_width_image') return (
    <div className="space-y-4">
      <ImageUploader value={c.image_url || ''} onChange={function(v) { set('image_url', v); }} organizationId={organizationId} label="Image" fieldKey={'fwimg-' + block.id} />
      {c.image_url && (
        <div>
          <label htmlFor={'block-img-alt-fwimg-' + block.id} className={labelCls}>Image Alt Text <span className="text-blue-500 font-normal normal-case tracking-normal">(Accessibility)</span></label>
          <input id={'block-img-alt-fwimg-' + block.id} type="text" value={c.image_alt || ''} onChange={function(e) { set('image_alt', e.target.value); }} placeholder="e.g. Aerial view of our annual community cleanup event at Riverside Park"className={inputCls} maxLength={200} />
          <p className="text-xs text-gray-400 mt-1">Describe the image for screen readers. <a href="https://www.w3.org/WAI/tutorials/images/informative/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">Why this matters</a></p>
        </div>
      )}
      <div>
        <label htmlFor={'block-caption-' + block.id} className={labelCls}>Caption (optional)</label>
        <input id={'block-caption-' + block.id} type="text" value={c.caption || ''} onChange={function(e) { set('caption', e.target.value); }} placeholder="Image caption..." className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Height</p>
        <div className="flex gap-2">
          {[{id: 'small', label: 'Small'}, {id: 'medium', label: 'Medium'}, {id: 'large', label: 'Large'}].map(function(h) {
            return (
              <button key={h.id} onClick={function() { set('height', h.id); }}
                className={'flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (c.height === h.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                {h.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // VIDEO
  if (type === 'video') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-url-' + block.id} className={labelCls}>YouTube or Vimeo URL</label>
        <input id={'block-url-' + block.id} type="url" value={c.url || ''} onChange={function(e) { set('url', e.target.value); }} placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
        <p className="text-xs text-gray-400 mt-1">Paste a YouTube or Vimeo link. It will be embedded automatically.</p>
      </div>
      <div>
        <label htmlFor={'block-caption-' + block.id} className={labelCls}>Caption (optional)</label>
        <input id={'block-caption-' + block.id} type="text" value={c.caption || ''} onChange={function(e) { set('caption', e.target.value); }} placeholder="Video caption..." className={inputCls} />
      </div>
    </div>
  );

  // QUOTE
  if (type === 'quote') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-quote-' + block.id} className={labelCls}>Quote</label>
        <textarea id={'block-quote-' + block.id} value={c.quote || ''} onChange={function(e) { set('quote', e.target.value); }} rows={3} placeholder="The quote text..." className={inputCls + ' resize-none'} maxLength={500} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'block-attr-' + block.id} className={labelCls}>Attribution (Name)</label>
          <input id={'block-attr-' + block.id} type="text" value={c.attribution || ''} onChange={function(e) { set('attribution', e.target.value); }} placeholder="Jane Smith" className={inputCls} />
        </div>
        <div>
          <label htmlFor={'block-role-' + block.id} className={labelCls}>Role / Title</label>
          <input id={'block-role-' + block.id} type="text" value={c.role || ''} onChange={function(e) { set('role', e.target.value); }} placeholder="Community Member" className={inputCls} />
        </div>
      </div>
    </div>
  );

  // STATS
  if (type === 'stats') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Section Heading (optional)</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Our Impact" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Stats</p>
        <div className="space-y-2">
          {(c.items || []).map(function(item, i) {
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400">Prefix</label>
                  <input type="text" value={item.prefix || ''} onChange={function(e) { setNested('items', i, 'prefix', e.target.value); }} placeholder="$" className={inputCls} maxLength={5} />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-gray-400">Value</label>
                  <input type="text" value={item.value || ''} onChange={function(e) { setNested('items', i, 'value', e.target.value); }} placeholder="500" className={inputCls} maxLength={10} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400">Suffix</label>
                  <input type="text" value={item.suffix || ''} onChange={function(e) { setNested('items', i, 'suffix', e.target.value); }} placeholder="+" className={inputCls} maxLength={5} />
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-gray-400">Label</label>
                  <input type="text" value={item.label || ''} onChange={function(e) { setNested('items', i, 'label', e.target.value); }} placeholder="Members" className={inputCls} />
                </div>
                <div className="col-span-1 flex items-end justify-center pb-0.5">
                  <button onClick={function() { removeItem('items', i); }} aria-label={'Remove stat ' + (i + 1)} className="p-1.5 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors">
                    <Icon path="M6 18L18 6M6 6l12 12" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {(c.items || []).length < 6 && (
          <button onClick={function() { addItem('items', { label: '', value: '', prefix: '', suffix: '' }); }}
            className="mt-2 w-full py-2 text-xs font-semibold text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
            + Add Stat
          </button>
        )}
      </div>
    </div>
  );

  // CTA BANNER
  if (type === 'cta_banner') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Ready to make a difference?" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-subtext-' + block.id} className={labelCls}>Subtext (optional)</label>
        <input id={'block-subtext-' + block.id} type="text" value={c.subtext || ''} onChange={function(e) { set('subtext', e.target.value); }} placeholder="Join us today." className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'block-cta-label-' + block.id} className={labelCls}>Button Label</label>
          <input id={'block-cta-label-' + block.id} type="text" value={c.cta_label || ''} onChange={function(e) { set('cta_label', e.target.value); }} placeholder="Get Started" className={inputCls} />
        </div>
        <div>
          <label htmlFor={'block-cta-url-' + block.id} className={labelCls}>Button URL</label>
          <input id={'block-cta-url-' + block.id} type="text" value={c.cta_url || ''} onChange={function(e) { set('cta_url', e.target.value); }} placeholder="#contact or https://..." className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor={'block-bg-' + block.id} className={labelCls}>Background Color</label>
        <div className="flex items-center gap-3">
          <input id={'block-bg-' + block.id} type="text" value={c.bg_color || '#3B82F6'} onChange={function(e) { set('bg_color', e.target.value); }} placeholder="#3B82F6" className={inputCls + ' font-mono flex-1'} maxLength={7} />
          <input type="color" value={c.bg_color || '#3B82F6'} onChange={function(e) { set('bg_color', e.target.value); }} className="w-12 h-10 rounded-lg border border-gray-300 p-1 cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Pick background color" />
        </div>
      </div>
    </div>
  );

  // EMAIL SIGNUP (placeholder)
  if (type === 'email_signup') return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs font-semibold text-amber-700">Placeholder — Integration Required</p>
        <p className="text-xs text-amber-600 mt-0.5">Email provider integration (Mailchimp, etc.) needed to activate signups.</p>
      </div>
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Stay in the Loop" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-subtext-' + block.id} className={labelCls}>Subtext</label>
        <input id={'block-subtext-' + block.id} type="text" value={c.subtext || ''} onChange={function(e) { set('subtext', e.target.value); }} placeholder="Get our latest updates." className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'block-btn-' + block.id} className={labelCls}>Button Label</label>
          <input id={'block-btn-' + block.id} type="text" value={c.button_label || ''} onChange={function(e) { set('button_label', e.target.value); }} placeholder="Subscribe" className={inputCls} />
        </div>
        <div>
          <label htmlFor={'block-ph-' + block.id} className={labelCls}>Input Placeholder</label>
          <input id={'block-ph-' + block.id} type="text" value={c.placeholder || ''} onChange={function(e) { set('placeholder', e.target.value); }} placeholder="Enter your email" className={inputCls} />
        </div>
      </div>
    </div>
  );

  // CONTACT FORM (placeholder)
  if (type === 'contact_form') return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-700">Uses Syndicade Contact System</p>
        <p className="text-xs text-blue-600 mt-0.5">Messages are saved to your contact inquiries inbox.</p>
      </div>
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Get in Touch" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-subtext-' + block.id} className={labelCls}>Subtext</label>
        <textarea id={'block-subtext-' + block.id} value={c.subtext || ''} onChange={function(e) { set('subtext', e.target.value); }} rows={2} placeholder="We'd love to hear from you." className={inputCls + ' resize-none'} />
      </div>
    </div>
  );

  // DONATION BUTTON (placeholder)
  if (type === 'donation_button') return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs font-semibold text-amber-700">Placeholder — Integration Required</p>
        <p className="text-xs text-amber-600 mt-0.5">Connect a donation processor (Stripe, PayPal, etc.) to activate.</p>
      </div>
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Support Our Mission" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-subtext-' + block.id} className={labelCls}>Subtext</label>
        <input id={'block-subtext-' + block.id} type="text" value={c.subtext || ''} onChange={function(e) { set('subtext', e.target.value); }} placeholder="Your donation makes a difference." className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'block-btn-' + block.id} className={labelCls}>Button Label</label>
          <input id={'block-btn-' + block.id} type="text" value={c.button_label || ''} onChange={function(e) { set('button_label', e.target.value); }} placeholder="Donate Now" className={inputCls} />
        </div>
        <div>
          <label htmlFor={'block-url-' + block.id} className={labelCls}>Donation URL</label>
          <input id={'block-url-' + block.id} type="url" value={c.url || ''} onChange={function(e) { set('url', e.target.value); }} placeholder="https://donate.example.com" className={inputCls} />
        </div>
      </div>
    </div>
  );

  // VOLUNTEER SIGNUP (placeholder)
  if (type === 'volunteer_signup') return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs font-semibold text-amber-700">Placeholder — Integration Required</p>
        <p className="text-xs text-amber-600 mt-0.5">Volunteer management integration needed to activate signups.</p>
      </div>
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Volunteer With Us" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-subtext-' + block.id} className={labelCls}>Subtext</label>
        <textarea id={'block-subtext-' + block.id} value={c.subtext || ''} onChange={function(e) { set('subtext', e.target.value); }} rows={2} placeholder="Make a difference in your community." className={inputCls + ' resize-none'} />
      </div>
      <div>
        <label htmlFor={'block-btn-' + block.id} className={labelCls}>Button Label</label>
        <input id={'block-btn-' + block.id} type="text" value={c.button_label || ''} onChange={function(e) { set('button_label', e.target.value); }} placeholder="Sign Up to Volunteer" className={inputCls} />
      </div>
    </div>
  );

  // PETITION (placeholder)
  if (type === 'petition') return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs font-semibold text-amber-700">Placeholder — Syndicade Integration Required</p>
        <p className="text-xs text-amber-600 mt-0.5">Petition/action system integration needed to activate.</p>
      </div>
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Take Action" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-subtext-' + block.id} className={labelCls}>Subtext</label>
        <textarea id={'block-subtext-' + block.id} value={c.subtext || ''} onChange={function(e) { set('subtext', e.target.value); }} rows={2} placeholder="Add your voice to ours." className={inputCls + ' resize-none'} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={'block-btn-' + block.id} className={labelCls}>Button Label</label>
          <input id={'block-btn-' + block.id} type="text" value={c.button_label || ''} onChange={function(e) { set('button_label', e.target.value); }} placeholder="Sign the Petition" className={inputCls} />
        </div>
        <div>
          <label htmlFor={'block-goal-' + block.id} className={labelCls}>Signature Goal</label>
          <input id={'block-goal-' + block.id} type="text" value={c.goal || ''} onChange={function(e) { set('goal', e.target.value); }} placeholder="1000" className={inputCls} />
        </div>
      </div>
    </div>
  );

  // EVENTS LIST
  if (type === 'events_list') return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-700">Auto-populated from your Events</p>
        <p className="text-xs text-blue-600 mt-0.5">Events are pulled from your Syndicade events — no manual entry needed.</p>
      </div>
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Section Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Upcoming Events" className={inputCls} />
      </div>
      <div>
        <label htmlFor={'block-limit-' + block.id} className={labelCls}>Number of Events to Show</label>
        <select id={'block-limit-' + block.id} value={c.limit || 3} onChange={function(e) { set('limit', parseInt(e.target.value)); }} className={inputCls}>
          <option value={3}>3 events</option>
          <option value={6}>6 events</option>
          <option value={9}>9 events</option>
        </select>
      </div>
    </div>
  );

  // PROGRAMS LIST
  if (type === 'programs_list') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Section Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Our Programs" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Programs</p>
        <div className="space-y-3">
          {(c.items || []).map(function(item, i) {
            return (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Program {i + 1}</span>
                  <button onClick={function() { removeItem('items', i); }} aria-label={'Remove program ' + (i + 1)} className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors">
                    <Icon path="M6 18L18 6M6 6l12 12" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input type="text" value={item.name || ''} onChange={function(e) { setNested('items', i, 'name', e.target.value); }} placeholder="Program Name" className={inputCls} />
                <textarea value={item.description || ''} onChange={function(e) { setNested('items', i, 'description', e.target.value); }} rows={2} placeholder="Brief description..." className={inputCls + ' resize-none'} />
              </div>
            );
          })}
        </div>
        <button onClick={function() { addItem('items', { name: '', description: '', image_url: '' }); }}
          className="mt-2 w-full py-2 text-xs font-semibold text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          + Add Program
        </button>
      </div>
    </div>
  );

// TEAM GRID
  if (type === 'team_grid') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Section Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Our Team" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Data Source</p>
        <div className="flex gap-2">
          {[{id: 'auto', label: 'Auto (from members)'}, {id: 'manual', label: 'Manual entry'}].map(function(m) {
            return (
              <button key={m.id} onClick={function() { set('mode', m.id); }}
                className={'flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' + ((c.mode || 'auto') === m.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                {m.label}
              </button>
            );
          })}
        </div>
        {(c.mode || 'auto') === 'auto' && (
          <p className="text-xs text-gray-400 mt-1.5">Pulls members with public profiles and "show in profile" enabled in their membership settings.</p>
        )}
      </div>
      {(c.mode || 'auto') === 'manual' && <div>
        <p className={labelCls}>Team Members</p>
        <div className="space-y-3">
          {(c.members || []).map(function(member, i) {
            return (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Member {i + 1}</span>
                  <button onClick={function() { removeItem('members', i); }} aria-label={'Remove member ' + (i + 1)} className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors">
                    <Icon path="M6 18L18 6M6 6l12 12" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={member.name || ''} onChange={function(e) { setNested('members', i, 'name', e.target.value); }} placeholder="Full Name" className={inputCls} />
                  <input type="text" value={member.title || ''} onChange={function(e) { setNested('members', i, 'title', e.target.value); }} placeholder="Title / Role" className={inputCls} />
                </div>
                <textarea value={member.bio || ''} onChange={function(e) { setNested('members', i, 'bio', e.target.value); }} rows={2} placeholder="Short bio..." className={inputCls + ' resize-none'} />
                <ImageUploader value={member.photo_url || ''} onChange={function(v) { setNested('members', i, 'photo_url', v); }} organizationId={organizationId} label="Photo" fieldKey={'team-member-' + block.id + '-' + i} />
                {member.photo_url && (
                <div>
                  <label className={labelCls}>Photo Alt Text <span className="text-blue-500 font-normal normal-case tracking-normal">(Accessibility)</span></label>
                  <input type="text" value={member.photo_alt || ''} onChange={function(e) { setNested('members', i, 'photo_alt', e.target.value); }} placeholder={member.name ? 'Photo of ' + member.name + (member.title ? ', ' + member.title : '') : 'e.g. Photo of Jane Smith, Executive Director'} className={inputCls} maxLength={200} />
                  <p className="text-xs text-gray-400 mt-1">Describe the photo for screen readers.</p>
                </div>
              )}
              </div>
            );
          })}
        </div>
        <button onClick={function() { addItem('members', { name: '', title: '', bio: '', photo_url: '' }); }}
          className="mt-2 w-full py-2 text-xs font-semibold text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          + Add Team Member
        </button>
      </div>
    }
    </div>
  );

  // MEMBERSHIP TIERS
  if (type === 'membership_tiers') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Section Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Membership" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Membership Tiers</p>
        <div className="space-y-3">
          {(c.tiers || []).map(function(tier, i) {
            return (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Tier {i + 1}</span>
                  <button onClick={function() { removeItem('tiers', i); }} aria-label={'Remove tier ' + (i + 1)} className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors">
                    <Icon path="M6 18L18 6M6 6l12 12" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={tier.name || ''} onChange={function(e) { setNested('tiers', i, 'name', e.target.value); }} placeholder="Tier Name" className={inputCls} />
                  <input type="text" value={tier.price || ''} onChange={function(e) { setNested('tiers', i, 'price', e.target.value); }} placeholder="$50" className={inputCls} />
                  <select value={tier.period || 'year'} onChange={function(e) { setNested('tiers', i, 'period', e.target.value); }} className={inputCls}>
                    <option value="year">/ year</option>
                    <option value="month">/ month</option>
                    <option value="one-time">one-time</option>
                  </select>
                </div>
                <textarea value={(tier.features || []).join('\n')} onChange={function(e) { setNested('tiers', i, 'features', e.target.value.split('\n')); }} rows={3} placeholder={"Feature 1\nFeature 2\nFeature 3"} className={inputCls + ' resize-none'} />
                <p className="text-xs text-gray-400">One feature per line</p>
                <input type="text" value={tier.cta_label || ''} onChange={function(e) { setNested('tiers', i, 'cta_label', e.target.value); }} placeholder="Join Now" className={inputCls} />
              </div>
            );
          })}
        </div>
        <button onClick={function() { addItem('tiers', { name: '', price: '', period: 'year', features: [], cta_label: 'Join Now' }); }}
          className="mt-2 w-full py-2 text-xs font-semibold text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          + Add Tier
        </button>
      </div>
    </div>
  );

  // FAQ
  if (type === 'faq') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Section Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Frequently Asked Questions" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Questions & Answers</p>
        <div className="space-y-3">
          {(c.items || []).map(function(item, i) {
            return (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Q{i + 1}</span>
                  <button onClick={function() { removeItem('items', i); }} aria-label={'Remove FAQ ' + (i + 1)} className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors">
                    <Icon path="M6 18L18 6M6 6l12 12" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input type="text" value={item.question || ''} onChange={function(e) { setNested('items', i, 'question', e.target.value); }} placeholder="Question?" className={inputCls} />
                <textarea value={item.answer || ''} onChange={function(e) { setNested('items', i, 'answer', e.target.value); }} rows={2} placeholder="Answer..." className={inputCls + ' resize-none'} />
              </div>
            );
          })}
        </div>
        <button onClick={function() { addItem('items', { question: '', answer: '' }); }}
          className="mt-2 w-full py-2 text-xs font-semibold text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          + Add Question
        </button>
      </div>
    </div>
  );

  // PARTNER LOGOS
  if (type === 'partner_logos') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Section Heading</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Our Partners" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Partners</p>
        <div className="space-y-3">
          {(c.partners || []).map(function(partner, i) {
            return (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Partner {i + 1}</span>
                  <button onClick={function() { removeItem('partners', i); }} aria-label={'Remove partner ' + (i + 1)} className="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors">
                    <Icon path="M6 18L18 6M6 6l12 12" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={partner.name || ''} onChange={function(e) { setNested('partners', i, 'name', e.target.value); }} placeholder="Organization Name" className={inputCls} />
                  <input type="url" value={partner.url || ''} onChange={function(e) { setNested('partners', i, 'url', e.target.value); }} placeholder="https://partner.org" className={inputCls} />
                </div>
                <ImageUploader value={partner.logo_url || ''} onChange={function(v) { setNested('partners', i, 'logo_url', v); }} organizationId={organizationId} label="Logo" fieldKey={'partner-' + block.id + '-' + i} />
                {partner.logo_url && (
                <div>
                  <label className={labelCls}>Logo Alt Text <span className="text-blue-500 font-normal normal-case tracking-normal">(Accessibility)</span></label>
                  <input type="text" value={partner.logo_alt || ''} onChange={function(e) { setNested('partners', i, 'logo_alt', e.target.value); }} placeholder={partner.name ? partner.name + ' logo' : 'e.g. United Way logo'} className={inputCls} maxLength={200} />
                  <p className="text-xs text-gray-400 mt-1">Describe the logo for screen readers.</p>
                </div>
              )}
              </div>
            );
          })}
        </div>
        <button onClick={function() { addItem('partners', { name: '', url: '', logo_url: '' }); }}
          className="mt-2 w-full py-2 text-xs font-semibold text-blue-600 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          + Add Partner
        </button>
      </div>
    </div>
  );

  // DIVIDER
  if (type === 'divider') return (
    <div className="space-y-4">
      <div>
        <p className={labelCls}>Style</p>
        <div className="flex gap-2">
          {['line', 'space'].map(function(s) {
            return (
              <button key={s} onClick={function() { set('style', s); }}
                className={'flex-1 py-2 text-xs font-semibold rounded-lg border-2 capitalize transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (c.style === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                {s === 'line' ? 'Horizontal Line' : 'Empty Space'}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className={labelCls}>Size</p>
        <div className="flex gap-2">
          {['small', 'medium', 'large'].map(function(s) {
            return (
              <button key={s} onClick={function() { set('size', s); }}
                className={'flex-1 py-2 text-xs font-semibold rounded-lg border-2 capitalize transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (c.size === s ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // SOCIAL LINKS
  if (type === 'social_links') return (
    <div className="space-y-4">
      <div>
        <label htmlFor={'block-heading-' + block.id} className={labelCls}>Heading (optional)</label>
        <input id={'block-heading-' + block.id} type="text" value={c.heading || ''} onChange={function(e) { set('heading', e.target.value); }} placeholder="Follow Us" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>Social Links</p>
        {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].map(function(platform) {
          var existing = (c.links || []).find(function(l) { return l.platform === platform; });
          var val = existing ? existing.url : '';
          return (
            <div key={platform} className="mb-2">
              <label htmlFor={'social-' + platform + '-' + block.id} className="block text-xs font-medium text-gray-500 mb-1 capitalize">{platform === 'twitter' ? 'X / Twitter' : platform}</label>
              <input
                id={'social-' + platform + '-' + block.id}
                type="url"
                value={val}
                onChange={function(e) {
                  var url = e.target.value;
                  var links = (c.links || []).filter(function(l) { return l.platform !== platform; });
                  if (url) links.push({ platform: platform, url: url });
                  set('links', links);
                }}
                placeholder={'https://' + platform + '.com/yourorg'}
                className={inputCls}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return <p className="text-sm text-gray-400 italic">No editor available for this block type.</p>;
}

// ── Add Block Modal ───────────────────────────────────────────────────────────
function AddBlockModal({ onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="add-block-title">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 id="add-block-title" className="text-lg font-bold text-gray-900">Add a Block</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg transition-colors">
            <Icon path="M6 18L18 6M6 6l12 12" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-6">
          {BLOCK_CATEGORIES.map(function(cat) {
            return (
              <div key={cat.label}>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-3">{cat.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cat.blocks.map(function(block) {
                    return (
                      <button
                        key={block.type}
                        onClick={function() { onAdd(block.type); onClose(); }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 group">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:border-blue-300 transition-colors">
                          <Icon path={block.icon} className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 leading-tight">{block.label}</p>
                          <p className="text-xs text-gray-400 leading-tight mt-0.5 truncate">{block.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ── Sortable Block Wrapper ────────────────────────────────────────────────────
function SortableBlock({ block, index, totalBlocks, expandedBlock, setExpandedBlock, saving, toggleVisible, setDeleteModal, handleContentChange, organizationId }) {
  var { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  var [previewMode, setPreviewMode] = useState(false);

  var style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  var isExpanded = expandedBlock === block.id;
  var isSavingBlock = saving[block.id];

  return (
    <div ref={setNodeRef} style={style} role="listitem"
      className={'rounded-xl border-2 transition-all ' + (isExpanded ? 'border-blue-400 shadow-sm' : 'border-gray-200') + ' ' + (!block.is_visible ? 'opacity-60' : '') + ' ' + (isDragging ? 'shadow-xl bg-white' : 'bg-white')}>
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          aria-label={'Drag to reorder ' + blockLabel(block.block_type)}
          className="p-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors flex-shrink-0 touch-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 18a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
          </svg>
        </button>
        {/* Block info */}
        <button onClick={function() { setExpandedBlock(isExpanded ? null : block.id); }}
          className="flex-1 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
          aria-expanded={isExpanded} aria-label={'Toggle ' + blockLabel(block.block_type) + ' block editor'}>
          <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Icon path={BLOCK_CATEGORIES.flatMap(function(cat) { return cat.blocks; }).find(function(b) { return b.type === block.block_type; })?.icon || 'M4 6h16M4 12h16M4 18h7'} className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{blockLabel(block.block_type)}</p>
            {!block.is_visible && <span className="text-xs text-gray-400">Hidden</span>}
          </div>
          {isSavingBlock && <span className="text-xs text-blue-400 font-medium">Saving...</span>}
          <Icon path={isExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </button>
        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Toggle checked={block.is_visible} onChange={function() { toggleVisible(block); }} label={(block.is_visible ? 'Hide' : 'Show') + ' ' + blockLabel(block.block_type) + ' block'} id={'block-vis-' + block.id} />
          <button onClick={function() { setDeleteModal(block.id); }} aria-label={'Delete ' + blockLabel(block.block_type) + ' block'}
            className="p-1.5 text-gray-300 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors">
            <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4" />
          </button>
        </div>
      </div>
{isExpanded && (
        <div className="border-t border-gray-100">
          <div className="flex border-b border-gray-100">
            <button onClick={function() { setPreviewMode(false); }}
              className={'flex-1 py-2.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ' + (!previewMode ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'bg-gray-50 text-gray-400 hover:text-gray-600')}
              aria-pressed={!previewMode}>
              Edit
            </button>
            <button onClick={function() { setPreviewMode(true); }}
              className={'flex-1 py-2.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ' + (previewMode ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'bg-gray-50 text-gray-400 hover:text-gray-600')}
              aria-pressed={previewMode}>
              Preview
            </button>
          </div>
          <div className="px-4 pb-4 pt-4">
            {previewMode
              ? <BlockPreview block={block} primary="#3B82F6" secondary="#1E40AF" borderRadius="8px" fontFamily="Inter, system-ui, sans-serif" org={{}} />
              : <BlockForm block={block} onChange={function(content) { handleContentChange(block.id, content); }} organizationId={organizationId} />
            }
          </div>
        </div>
      )}
    </div>
  );
}
// ── Main BlockEditor Export ───────────────────────────────────────────────────
export default function BlockEditor({ organizationId, pages, onBlocksChange }) {
  var [selectedPageId, setSelectedPageId] = useState(null);
  var [blocks, setBlocks] = useState([]);
  var [loading, setLoading] = useState(false);
  var [showAddModal, setShowAddModal] = useState(false);
  var [expandedBlock, setExpandedBlock] = useState(null);
  var [saving, setSaving] = useState({});
  var [deleteModal, setDeleteModal] = useState(null);
  var debounceTimers = useRef({});
  var sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  var enabledPages = (pages || []).filter(function(p) { return p.is_enabled && p.page_key && !p.page_key.startsWith('external-'); });

  useEffect(function() {
    if (!selectedPageId && enabledPages.length > 0) {
      setSelectedPageId(enabledPages[0].id);
    }
  }, [pages]);

  useEffect(function() {
    if (selectedPageId) fetchBlocks(selectedPageId);
  }, [selectedPageId]);

  async function fetchBlocks(pageId) {
    setLoading(true);
    try {
      var result = await supabase.from('org_site_blocks').select('*').eq('page_id', pageId).order('sort_order', { ascending: true });
      if (result.error) throw result.error;
      setBlocks(result.data || []);
      if (onBlocksChange) onBlocksChange(result.data || []);
    } catch (err) {
      toast.error('Could not load blocks');
    } finally {
      setLoading(false);
    }
  }

  async function addBlock(type) {
    try {
      var newBlock = {
        organization_id: organizationId,
        page_id: selectedPageId,
        block_type: type,
        sort_order: blocks.length,
        content: defaultContent(type),
        is_visible: true,
      };
      var result = await supabase.from('org_site_blocks').insert([newBlock]).select().single();
      if (result.error) throw result.error;
      setBlocks(function(prev) { return prev.concat([result.data]); });
      setExpandedBlock(result.data.id);
      if (onBlocksChange) onBlocksChange(blocks.concat([result.data]));
      toast.success(blockLabel(type) + ' block added');
    } catch (err) {
      toast.error('Could not add block: ' + err.message);
    }
  }

  async function saveBlockContent(blockId, content) {
    setSaving(function(prev) { return Object.assign({}, prev, { [blockId]: true }); });
    try {
      var result = await supabase.from('org_site_blocks').update({ content: content, updated_at: new Date().toISOString() }).eq('id', blockId);
      if (result.error) throw result.error;
    } catch (err) {
      toast.error('Could not save block');
    } finally {
      setSaving(function(prev) { return Object.assign({}, prev, { [blockId]: false }); });
    }
  }

  function handleContentChange(blockId, content) {
    setBlocks(function(prev) { return prev.map(function(b) { return b.id === blockId ? Object.assign({}, b, { content: content }) : b; }); });
    if (debounceTimers.current[blockId]) clearTimeout(debounceTimers.current[blockId]);
    debounceTimers.current[blockId] = setTimeout(function() { saveBlockContent(blockId, content); }, 600);
  }

  async function toggleVisible(block) {
    var updated = !block.is_visible;
    setBlocks(function(prev) { return prev.map(function(b) { return b.id === block.id ? Object.assign({}, b, { is_visible: updated }) : b; }); });
if (onBlocksChange) onBlocksChange(blocks.map(function(b) { return b.id === block.id ? Object.assign({}, b, { is_visible: !block.is_visible }) : b; }));
    await supabase.from('org_site_blocks').update({ is_visible: updated, updated_at: new Date().toISOString() }).eq('id', block.id);
  }

async function handleDragEnd(event) {
    var active = event.active;
    var over = event.over;
    if (!over || active.id === over.id) return;
    var oldIndex = blocks.findIndex(function(b) { return b.id === active.id; });
    var newIndex = blocks.findIndex(function(b) { return b.id === over.id; });
    if (oldIndex === -1 || newIndex === -1) return;
    var next = blocks.slice();
    var removed = next.splice(oldIndex, 1)[0];
    next.splice(newIndex, 0, removed);
    next = next.map(function(b, i) { return Object.assign({}, b, { sort_order: i }); });
    setBlocks(next);
    if (onBlocksChange) onBlocksChange(next);
    await Promise.all(next.map(function(b) { return supabase.from('org_site_blocks').update({ sort_order: b.sort_order }).eq('id', b.id); }));
  }

  async function deleteBlock(blockId) {
    setBlocks(function(prev) { return prev.filter(function(b) { return b.id !== blockId; }); });
    if (onBlocksChange) onBlocksChange(blocks.filter(function(b) { return b.id !== blockId; }));
    await supabase.from('org_site_blocks').delete().eq('id', blockId);
    toast.success('Block deleted');
  }

  var selectedPage = enabledPages.find(function(p) { return p.id === selectedPageId; });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-block-title">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={function() { setDeleteModal(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-7 w-7 text-red-500" />
            </div>
            <h2 id="delete-block-title" className="text-lg font-bold text-gray-900 mb-2">Delete this block?</h2>
            <p className="text-sm text-gray-500 mb-6">This <span className="font-semibold text-red-500">cannot be recovered</span>.</p>
            <div className="flex gap-3 w-full">
              <button onClick={function() { setDeleteModal(null); }} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">Cancel</button>
              <button onClick={async function() { await deleteBlock(deleteModal); setDeleteModal(null); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && <AddBlockModal onAdd={addBlock} onClose={function() { setShowAddModal(false); }} />}

      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <p className="text-xs font-bold text-amber-500 uppercase tracking-[4px] mb-1">Content</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Page Content</h2>
        <p className="text-gray-500 text-sm">Add and arrange content blocks for each page.</p>
      </div>

      {/* Page selector */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <p className={labelCls}>Select Page</p>
        {enabledPages.length === 0 ? (
          <p className="text-sm text-gray-400">No enabled pages yet. Enable pages in the Pages tab first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {enabledPages.map(function(page) {
              var isSel = selectedPageId === page.id;
              return (
                <button key={page.id} onClick={function() { setSelectedPageId(page.id); setExpandedBlock(null); }}
                  className={'px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isSel ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300')}
                  aria-pressed={isSel}>
                  {page.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Block list */}
      {selectedPageId && (
        <div className="p-6">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(function(i) { return <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />; })}
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-500 mb-1">No blocks yet</p>
              <p className="text-sm text-gray-400 mb-4">Add your first content block to {selectedPage && selectedPage.title}.</p>
              <button onClick={function() { setShowAddModal(true); }}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Add First Block
              </button>
            </div>
          ) : (
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(function(b) { return b.id; })} strategy={verticalListSortingStrategy}>
                <div className="space-y-2" role="list" aria-label="Content blocks">
                  {blocks.map(function(block, index) {
                    return (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        index={index}
                        totalBlocks={blocks.length}
                        expandedBlock={expandedBlock}
                        setExpandedBlock={setExpandedBlock}
                        saving={saving}
                        toggleVisible={toggleVisible}
                        setDeleteModal={setDeleteModal}
                        handleContentChange={handleContentChange}
                        organizationId={organizationId}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
          {/* Add block button */}
          {blocks.length > 0 && (
            <button onClick={function() { setShowAddModal(true); }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Icon path="M12 4v16m8-8H4" className="h-4 w-4" />
              Add Block
            </button>
          )}
        </div>
      )}
    </div>
  );
}