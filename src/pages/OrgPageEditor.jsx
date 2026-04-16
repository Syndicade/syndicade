import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { useTheme } from '../context/ThemeContext';
import usePlanLimits from '../hooks/usePlanLimits';
import BlockEditor from '../components/BlockEditor';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getThemeVars, getNavLinks, ClassicTemplate, ModernTemplate,
  BannerTemplate, SidebarTemplate, FeaturedTemplate,
} from '../components/OrgTemplates';
import { renderBlock } from '../components/BlockRenderer';
import WebsiteSetupWizard from '../components/WebsiteSetupWizard';
import { getStorageUsage } from '../lib/storageUtils';

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
  return <div className={'animate-pulse rounded-lg bg-[#1E2845] ' + (className || '')} aria-hidden="true" />;
}

function EditorSkeleton() {
  return (
    <div className="min-h-screen bg-[#0E1523]" aria-busy="true" aria-label="Loading editor">
      <div className="bg-[#151B2D] border-b border-[#2A3550] px-6 py-4 flex items-center justify-between">
        <div className="space-y-1.5"><Skeleton className="h-5 w-40" /><Skeleton className="h-3.5 w-28" /></div>
        <div className="flex items-center gap-3"><Skeleton className="h-9 w-28" /><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-16" /></div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-6">
        <div className="w-48 flex-shrink-0 space-y-2">{[1,2,3,4,5].map(function(i){return <Skeleton key={i} className="h-14 w-full" />;})}</div>
        <div className="flex-1 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /><div className="grid grid-cols-2 gap-4 mt-6">{[1,2,3,4].map(function(i){return <Skeleton key={i} className="h-28 w-full" />;})}</div></div>
      </div>
    </div>
  );
}

var TEMPLATES = [
  { id: 'classic',  name: 'Classic',      description: 'Simple hero, events list, footer navigation',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect width="160" height="100" fill="#f9fafb" rx="4"/><rect x="8" y="8" width="60" height="10" fill="#d1d5db" rx="2"/><rect x="100" y="8" width="52" height="10" fill="#d1d5db" rx="2"/><rect x="8" y="24" width="80" height="8" fill="#374151" rx="2"/><rect x="8" y="36" width="100" height="5" fill="#9ca3af" rx="2"/><rect x="8" y="55" width="50" height="6" fill="#1d4ed8" rx="2"/><rect x="8" y="65" width="70" height="4" fill="#374151" rx="1"/><rect x="8" y="72" width="140" height="3" fill="#e5e7eb" rx="1"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>) },
  { id: 'modern',   name: 'Modern',       description: '3-column layout with events, pages, and news',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect width="160" height="100" fill="#f9fafb" rx="4"/><rect x="8" y="6" width="30" height="8" fill="#d1d5db" rx="2"/><rect x="110" y="6" width="42" height="8" fill="#1d4ed8" rx="3"/><rect x="8" y="20" width="100" height="9" fill="#374151" rx="2"/><rect x="8" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/><rect x="57" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/><rect x="106" y="46" width="44" height="22" fill="#e5e7eb" rx="2"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>) },
  { id: 'banner',   name: 'Banner',       description: 'Full-width banner image with name overlay',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect width="160" height="100" fill="#f9fafb" rx="4"/><rect x="0" y="16" width="160" height="32" fill="#6b7280" rx="2"/><rect x="30" y="24" width="100" height="8" fill="#fff" rx="2" opacity=".9"/><rect x="50" y="35" width="60" height="5" fill="#fff" rx="1" opacity=".6"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>) },
  { id: 'featured', name: 'Full Featured', description: 'Events, member spotlight, contact info, and more',
    preview: (<svg viewBox="0 0 160 100" className="w-full h-full" aria-hidden="true"><rect width="160" height="100" fill="#f9fafb" rx="4"/><rect x="30" y="18" width="100" height="8" fill="#374151" rx="2"/><rect x="45" y="37" width="32" height="6" fill="#1d4ed8" rx="2"/><rect x="8" y="56" width="68" height="20" fill="#e5e7eb" rx="2"/><rect x="84" y="56" width="68" height="20" fill="#e5e7eb" rx="2"/><rect x="0" y="93" width="160" height="7" fill="#1f2937" rx="2"/></svg>) },
];

var FONT_PAIRINGS = [
  { id: 'inter', label: 'Inter', description: 'Clean & Modern',   sample: 'Inter / System UI'     },
  { id: 'serif', label: 'Serif', description: 'Classic & Formal', sample: 'Georgia / Serif'       },
  { id: 'mono',  label: 'Mono',  description: 'Technical & Bold', sample: 'Fira Code / Monospace' },
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
function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'page'; }
var DEFAULT_PAGES = [
  { page_key:'home',       title:'Home',             nav_label:'Home',         sort_order:0 },
  { page_key:'about',      title:'About',            nav_label:'About',        sort_order:1 },
  { page_key:'mission',    title:'Mission & Values', nav_label:'Mission',      sort_order:2 },
  { page_key:'programs',   title:'Programs',         nav_label:'Programs',     sort_order:3 },
  { page_key:'events',     title:'Events',           nav_label:'Events',       sort_order:4 },
  { page_key:'news',       title:'News & Updates',   nav_label:'News',         sort_order:5 },
  { page_key:'involved',   title:'Get Involved',     nav_label:'Get Involved', sort_order:6 },
  { page_key:'membership', title:'Membership',       nav_label:'Membership',   sort_order:7 },
  { page_key:'contact',    title:'Contact',          nav_label:'Contact',      sort_order:8 },
  { page_key:'resources',  title:'Resources',        nav_label:'Resources',    sort_order:9 },
];
function normalizeSections(ps, sv2) {
  if (sv2 && Array.isArray(sv2) && sv2.length > 0) return sv2;
  var raw = ps || {};
  return Object.keys(PAGE_SECTION_CONFIG).map(function(key, i) {
    return { id:key, key:key, label:PAGE_SECTION_CONFIG[key].label, visible:raw[key]!==false, archived:false, order:i, isCustom:false };
  });
}
function sectionsToLegacy(secs) {
  var r = {};
  (secs||[]).forEach(function(s){ r[s.key]=!!(s.visible&&!s.archived); });
  return r;
}

function AppearanceSection({ label, children, d }) {
  return (
    <div className={'border-t pt-6 mt-2 ' + (d ? 'border-[#2A3550]' : 'border-gray-100')}>
      <p className={'text-xs font-bold uppercase tracking-[4px] mb-4 ' + (d ? 'text-[#F5B731]' : 'text-amber-500')}>{label}</p>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, id, d }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} onClick={onChange}
      className={'relative w-8 h-[18px] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex-shrink-0 '
        + (d ? 'focus:ring-offset-[#1A2035] ' : 'focus:ring-offset-white ')
        + (checked ? 'bg-blue-500' : (d ? 'bg-[#2A3550]' : 'bg-gray-300'))}>
      <span className={'absolute top-[1px] w-4 h-4 bg-white rounded-full shadow transition-all ' + (checked ? 'left-[15px]' : 'left-[1px]')} aria-hidden="true" />
    </button>
  );
}

function PreviewNewPage({ org, pages, blocks, primary, borderRadius, fontFamily, activePageId }) {
  var enabledPages = (pages||[]).filter(function(p){ return p.is_enabled && p.page_key && !p.page_key.startsWith('external-'); });
  var activePage = activePageId ? enabledPages.find(function(p){ return p.id===activePageId; }) : enabledPages[0];
  var activePageBlocks = activePage ? blocks.filter(function(b){ return b.page_id===activePage.id; }) : [];
  return (
    <div className="min-h-full bg-white" style={{fontFamily:fontFamily||'Inter,system-ui,sans-serif'}}>
      <div className="px-6 py-10 space-y-10 max-w-4xl mx-auto">
        {activePageBlocks.length===0 ? (
          <div className="text-center py-16 text-gray-400"><p className="text-sm font-medium">No blocks on this page yet.</p><p className="text-xs mt-1">Add blocks in the Pages &amp; Content tab.</p></div>
        ) : (
          activePageBlocks.map(function(block){ return <div key={block.id}>{renderBlock(block,primary||'#3B82F6','#1E40AF',borderRadius||'8px',fontFamily||'Inter,system-ui,sans-serif',org)}</div>; })
        )}
      </div>
    </div>
  );
}

function SortablePageItem({ page, isExpanded, onToggleExpand, navCount, NAV_LIMIT, onNavToggle, onEnabledToggle, onArchive, onDelete, onTitleChange, onNavLabelChange, children, d, planDisabled }) {
  var sortable = useSortable({ id: page.id });
  var style = { transform:CSS.Transform.toString(sortable.transform), transition:sortable.transition, opacity:sortable.isDragging?0.5:1, zIndex:sortable.isDragging?10:undefined };
  var navAtLimit = navCount >= NAV_LIMIT && !page.is_visible_in_nav;
  var cardBg = d ? 'bg-[#1A2035]' : 'bg-white';
  var cardBorder = sortable.isDragging ? 'shadow-xl border-blue-300' : (planDisabled ? (d?'border-[#2A3550] opacity-50':'border-gray-100 opacity-50') : (d ? 'border-[#2A3550]' : 'border-gray-200'));
  var expandBg = d ? 'bg-[#0E1523] border-[#2A3550]' : 'bg-gray-50 border-gray-100';
  var inp = d
    ? 'w-full px-2 py-1 border border-[#2A3550] rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1E2845]'
    : 'w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50';
  var hc = d ? 'text-[#2A3550] hover:text-[#94A3B8]' : 'text-gray-300 hover:text-gray-500';
  var tc = d ? 'text-[#64748B]' : 'text-gray-400';
  return (
    <div ref={sortable.setNodeRef} style={style} role="listitem">
      <div className={'rounded-lg border transition-all ' + cardBg + ' ' + cardBorder}>
        {/* Row 1: drag + page name + expand */}
        <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
          <button {...sortable.attributes} {...sortable.listeners} aria-label={'Drag to reorder ' + page.title}
            className={'p-0.5 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-blue-500 rounded touch-none flex-shrink-0 ' + hc}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 18a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
          </button>
          <input type="text" value={page.title} onChange={function(e){onTitleChange(page.id,e.target.value);}}
            aria-label={'Page name for ' + page.title}
            className={inp + ' flex-1 font-semibold ' + (d?'text-white':'text-gray-900')} maxLength={40} />
          <button onClick={onToggleExpand} aria-label={(isExpanded?'Collapse ':'Expand ')+page.title} aria-expanded={isExpanded}
            className={'p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded transition-colors flex-shrink-0 ' + hc}>
            <Icon path={isExpanded?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'} className="h-3 w-3" />
          </button>
        </div>
        {/* Row 2: slug + nav label + toggles + actions */}
        <div className="flex items-center gap-2 px-2 pb-2 pl-6">
          <p className={'text-[10px] w-16 truncate flex-shrink-0 ' + tc}>/{page.page_key}</p>
          {/* Nav toggle */}
          <div className={'flex items-center gap-1 flex-shrink-0 relative ' + (navAtLimit?'group':'')}>
            <span className={'text-[10px] ' + tc}>Nav</span>
            <Toggle checked={!!(page.is_visible_in_nav&&page.is_enabled)} onChange={navAtLimit?function(){}:onNavToggle}
              label={(page.is_visible_in_nav?'Remove ':'Add ')+page.title+' from navigation'} id={'nav-'+page.id} d={d} />
            {navAtLimit && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10" role="tooltip">Nav full</div>}
          </div>
          {/* On toggle */}
          <div className={'flex items-center gap-1 flex-shrink-0 relative ' + (planDisabled?'group':'')}>
            <span className={'text-[10px] ' + tc}>On</span>
            <Toggle checked={planDisabled ? false : !!page.is_enabled} onChange={planDisabled?function(){}:onEnabledToggle}
              label={'Toggle '+page.title+' on/off'} id={'en-'+page.id} d={d} />
            {planDisabled && <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10" role="tooltip">Growth only</div>}
          </div>
          {/* Actions */}
          <div className="flex items-center flex-shrink-0">
            <button onClick={onArchive} aria-label={'Archive ' + page.title} className={'p-1 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded transition-colors ' + (d?'text-[#2A3550] hover:text-amber-400':'text-gray-300 hover:text-amber-400')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            </button>
            <button onClick={onDelete} aria-label={'Delete ' + page.title} className={'p-1 focus:outline-none focus:ring-1 focus:ring-red-500 rounded transition-colors ' + (d?'text-[#2A3550] hover:text-red-400':'text-gray-300 hover:text-red-400')}>
              <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-3 w-3" />
            </button>
          </div>
        </div>
        {isExpanded && <div className={'border-t px-4 pb-4 pt-3 rounded-b-lg ' + expandBg}>{children}</div>}
      </div>
    </div>
  );
}

function SortableSectionItem({ section, isEditing, editingLabel, onStartEdit, onSaveEdit, onCancelEdit, onEditChange, onToggleVisible, onArchive, onDelete, d }) {
  var sortable = useSortable({ id: section.id });
  var style = { transform:CSS.Transform.toString(sortable.transform), transition:sortable.transition, opacity:sortable.isDragging?0.5:1, zIndex:sortable.isDragging?10:undefined };
  var sectionDesc = PAGE_SECTION_CONFIG[section.key] ? PAGE_SECTION_CONFIG[section.key].desc : 'Custom section';
  var cardBg = d ? 'bg-[#1A2035]' : 'bg-white';
  var cardBorder = sortable.isDragging ? 'shadow-xl border-blue-300' : (d ? 'border-[#2A3550]' : 'border-gray-200');
  var hc = d ? 'text-[#2A3550] hover:text-[#94A3B8]' : 'text-gray-300 hover:text-gray-500';
  return (
    <div ref={sortable.setNodeRef} style={style} role="listitem" className={'rounded-xl border-2 transition-all ' + cardBg + ' ' + cardBorder + (!section.visible?' opacity-60':'')}>
      <div className="flex items-center gap-3 p-3">
        <button {...sortable.attributes} {...sortable.listeners} aria-label={'Drag to reorder '+section.label} className={'p-1.5 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500 rounded touch-none flex-shrink-0 ' + hc}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM8 18a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input type="text" value={editingLabel} onChange={onEditChange} onKeyDown={function(e){if(e.key==='Enter')onSaveEdit();if(e.key==='Escape')onCancelEdit();}}
                className={'flex-1 px-2 py-1 border-2 border-blue-500 rounded-lg text-sm font-semibold focus:outline-none ' + (d?'bg-[#1E2845] text-white':'bg-white text-gray-900')}
                autoFocus maxLength={50} aria-label="Section name" />
              <button onClick={onSaveEdit} aria-label="Save" className="p-1 text-green-400 hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"><Icon path="M5 13l4 4L19 7" className="h-4 w-4"/></button>
              <button onClick={onCancelEdit} aria-label="Cancel" className={'p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded ' + (d?'text-[#64748B]':'text-gray-400')}><Icon path="M6 18L18 6M6 6l12 12" className="h-4 w-4"/></button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className={'text-sm font-semibold ' + (d?'text-white':'text-gray-900')}>{section.label}</span>
                {section.isCustom && <span className={'text-xs px-2 py-0.5 rounded-full font-semibold ' + (d?'bg-purple-500 bg-opacity-20 text-purple-400':'bg-purple-100 text-purple-600')}>Custom</span>}
                {!section.visible && <span className={'text-xs px-2 py-0.5 rounded-full font-semibold ' + (d?'bg-[#1E2845] text-[#64748B]':'bg-gray-100 text-gray-400')}>Hidden</span>}
              </div>
              <p className={'text-xs mt-0.5 ' + (d?'text-[#64748B]':'text-gray-400')}>{sectionDesc}</p>
            </div>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onStartEdit} aria-label={'Rename '+section.label} className={'p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors ' + (d?'text-[#2A3550] hover:text-blue-400':'text-gray-300 hover:text-blue-500')}>
              <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="h-3.5 w-3.5"/>
            </button>
            <Toggle checked={section.visible} onChange={onToggleVisible} label={(section.visible?'Hide ':'Show ')+section.label} id={'sv-'+section.id} d={d} />
            <button onClick={onArchive} aria-label={'Archive '+section.label} className={'p-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg transition-colors ' + (d?'text-[#2A3550] hover:text-amber-400':'text-gray-300 hover:text-amber-500')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            </button>
            <button onClick={onDelete} aria-label={'Delete '+section.label} className={'p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors ' + (d?'text-[#2A3550] hover:text-red-400':'text-gray-300 hover:text-red-500')}>
              <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-3.5 w-3.5"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrgPageEditor() {
  var { organizationId } = useParams();
  var navigate = useNavigate();
  var logoInputRef = useRef(null);
  var previewPanelRef = useRef(null);
  var debounceTimers = useRef({});

  // ── THEME: isDark comes directly from useTheme() ──────────────────────────
  var themeData = useTheme();
  var isDark = themeData ? themeData.isDark : true;

  // ── PLAN LIMITS ───────────────────────────────────────────────────────────
  var planInfo = usePlanLimits(organizationId);
  var plan = (planInfo && planInfo.plan) ? planInfo.plan : 'starter';
  var isStarterPlan = plan === 'starter';
  // Growth: 6 additional pages max; Pro: unlimited (null)
  var additionalPageLimit = plan === 'pro' ? null : plan === 'growth' ? 6 : 0;

  // ── THEME SHORTCUTS ───────────────────────────────────────────────────────
  var bg      = isDark ? 'bg-[#0E1523]'     : 'bg-gray-50';
  var bgCard  = isDark ? 'bg-[#1A2035]'     : 'bg-white';
  var bgSec   = isDark ? 'bg-[#151B2D]'     : 'bg-gray-50';
  var bgEle   = isDark ? 'bg-[#1E2845]'     : 'bg-gray-100';
  var border  = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var borderL = isDark ? 'border-[#2A3550]' : 'border-gray-100';
  var tPri    = isDark ? 'text-white'       : 'text-gray-900';
  var tSec    = isDark ? 'text-[#CBD5E1]'   : 'text-gray-700';
  var tMut    = isDark ? 'text-[#94A3B8]'   : 'text-gray-500';
  var tTer    = isDark ? 'text-[#64748B]'   : 'text-gray-400';
  var tYel    = isDark ? 'text-[#F5B731]'   : 'text-amber-500';
  var inputCls = isDark
    ? 'w-full px-4 py-3 bg-[#1E2845] border border-[#2A3550] text-white placeholder-[#64748B] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
    : 'w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
  var lblCls  = isDark ? 'block text-sm font-semibold text-[#CBD5E1] mb-2' : 'block text-sm font-semibold text-gray-700 mb-2';

  // ── STATE ─────────────────────────────────────────────────────────────────
  var [org, setOrg] = useState(null);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [uploadingLogo, setUploadingLogo] = useState(false);
  var [activeSection, setActiveSection] = useState('overview');
  var [previewOpen, setPreviewOpen] = useState(true);
  var [previewScale, setPreviewScale] = useState(0.5);
  var [sitePages, setSitePages] = useState([]);
  var [previewPageId, setPreviewPageId] = useState(null);
  var [siteBlocks, setSiteBlocks] = useState([]);
  var [deleteModal, setDeleteModal] = useState(null);
  var [showWizard, setShowWizard] = useState(false);
  var [footerPage, setFooterPage] = useState(null);
  var [showLayoutModal, setShowLayoutModal] = useState(false);
  var [sections, setSections] = useState([]);
  var [sectionDeleteModal, setSectionDeleteModal] = useState(null);
  var [editingSectionId, setEditingSectionId] = useState(null);
  var [editingSectionLabel, setEditingSectionLabel] = useState('');
  var [showAddSection, setShowAddSection] = useState(false);
  var [newSectionLabel, setNewSectionLabel] = useState('');
  var [showArchivedSections, setShowArchivedSections] = useState(false);
  var [expandedPageId, setExpandedPageId] = useState(null);
  var [footerOpen, setFooterOpen] = useState(false);
  var NAV_LIMIT = 3;

  // ── SENSORS ───────────────────────────────────────────────────────────────
  var secSensors = useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));
  var pgSensors  = useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));

  // ── FORM ──────────────────────────────────────────────────────────────────
  var [form, setForm] = useState({
    name:'', tagline:'', description:'', contact_email:'', contact_phone:'',
    address:'', city:'', state:'', zip_code:'', website:'', logo_url:'', banner_url:'',
    social_links:{facebook:'',instagram:'',twitter:'',linkedin:'',youtube:''},
    page_sections:{about:true,events:true,announcements:true,photos:true,members:false,contact:true,join:true},
    is_public:false, template:'classic',
    theme:{primaryColor:'#3B82F6',fontPairing:'inter',buttonStyle:'rounded',customColors:['#3B82F6','','']},
    nav_links:DEFAULT_NAV_LINKS, publish_channels:{website:true,discovery:false}, footerColumns:2,
  });

  // ── PREVIEW SCALE ─────────────────────────────────────────────────────────
  useEffect(function() {
    function calc() {
      if (previewPanelRef.current) {
        var w = previewPanelRef.current.offsetWidth - 24;
        setPreviewScale(Math.max(0.25, w / PREVIEW_WIDTH));
      }
    }
    if (previewOpen) { var t=setTimeout(calc,60); window.addEventListener('resize',calc); return function(){clearTimeout(t);window.removeEventListener('resize',calc);}; }
  }, [previewOpen]);

  useEffect(function(){ fetchOrg(); }, [organizationId]);

  // ── PAGE HELPERS ──────────────────────────────────────────────────────────
  async function savePageField(pageId, fields) {
    try {
      var r = await supabase.from('org_site_pages').update(Object.assign({},fields,{updated_at:new Date().toISOString()})).eq('id',pageId);
      if (r.error) throw r.error;
    } catch(err) { mascotErrorToast('Could not save',err.message); }
  }
  function savePageDebounced(pageId, fields) {
    var key = pageId+'-'+Object.keys(fields).join(',');
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async function(){ await savePageField(pageId,fields); }, 500);
  }
  async function deletePage(pageId) {
    var updated = sitePages.filter(function(p){return p.id!==pageId;});
    setSitePages(updated);
    await supabase.from('org_site_pages').delete().eq('id',pageId);
    await saveNavInstant(updated);
    mascotSuccessToast('Page deleted');
  }
  async function saveNavInstant(pages) {
    var items = pages.filter(function(p){return p.is_enabled&&p.is_visible_in_nav;}).map(function(p){return {id:p.page_key,label:p.nav_label,type:'page',page_key:p.page_key};});
    await supabase.from('org_site_nav').upsert({organization_id:organizationId,items:items,updated_at:new Date().toISOString()},{onConflict:'organization_id'});
  }

  // ── PAGE MANAGEMENT ───────────────────────────────────────────────────────
  async function handlePageDragEnd(ev) {
    var active=ev.active, over=ev.over;
    if (!over||active.id===over.id) return;
    var aps=sitePages.filter(function(p){return p.is_enabled && p.page_key !== 'home';});
    var oi=aps.findIndex(function(p){return p.id===active.id;}), ni=aps.findIndex(function(p){return p.id===over.id;});
    if (oi===-1||ni===-1) return;
    var next=aps.slice(); var mv=next.splice(oi,1)[0]; next.splice(ni,0,mv);
    next=next.map(function(p,i){return Object.assign({},p,{sort_order:i});});
    var dis=sitePages.filter(function(p){return !p.is_enabled;}); var merged=next.concat(dis);
    setSitePages(merged);
    await Promise.all(next.map(function(p){return savePageField(p.id,{sort_order:p.sort_order});}));
    await saveNavInstant(merged);
  }
  function handlePageNavToggle(page) {
    var nc=sitePages.filter(function(p){return p.is_visible_in_nav&&p.is_enabled;}).length;
    if (!page.is_visible_in_nav&&nc>=NAV_LIMIT){toast.error('Nav limit reached.');return;}
    var updated=sitePages.map(function(p){return p.id===page.id?Object.assign({},p,{is_visible_in_nav:!p.is_visible_in_nav}):p;});
    setSitePages(updated); savePageField(page.id,{is_visible_in_nav:!page.is_visible_in_nav}); saveNavInstant(updated);
  }
  function handlePageEnabledToggle(page) {
    var enabledCount = sitePages.filter(function(p){return p.is_enabled;}).length;
    if (!page.is_enabled && additionalPageLimit !== null && enabledCount >= additionalPageLimit) {
      toast.error(plan==='starter' ? 'Additional pages require Growth.' : 'Page limit reached. Upgrade to Pro for unlimited pages.');
      return;
    }
    var updated=sitePages.map(function(p){return p.id===page.id?Object.assign({},p,{is_enabled:!p.is_enabled}):p;});
    setSitePages(updated); savePageField(page.id,{is_enabled:!page.is_enabled}); saveNavInstant(updated);
  }
  function handlePageTitleChange(pageId,title) {
    var nk=slugify(title);
    var nl=title.slice(0,20);
    setSitePages(function(prev){return prev.map(function(p){return p.id===pageId?Object.assign({},p,{title:title,page_key:nk,nav_label:nl}):p;});});
    savePageDebounced(pageId,{title:title,page_key:nk,nav_label:nl});
  }
  function handlePageNavLabelChange(pageId,label) {
    setSitePages(function(prev){return prev.map(function(p){return p.id===pageId?Object.assign({},p,{nav_label:label}):p;});});
    savePageDebounced(pageId,{nav_label:label});
  }

  // ── SECTION HELPERS ───────────────────────────────────────────────────────
  function getActiveSections() { return sections.filter(function(s){return !s.archived;}).sort(function(a,b){return a.order-b.order;}); }
  function getArchivedSections() { return sections.filter(function(s){return s.archived;}); }
  function handleSectionDragEnd(ev) {
    var active=ev.active, over=ev.over;
    if (!over||active.id===over.id) return;
    var as=getActiveSections(), oi=as.findIndex(function(s){return s.id===active.id;}), ni=as.findIndex(function(s){return s.id===over.id;});
    if (oi===-1||ni===-1) return;
    var next=as.slice(); var mv=next.splice(oi,1)[0]; next.splice(ni,0,mv);
    setSections(next.map(function(s,i){return Object.assign({},s,{order:i});}).concat(getArchivedSections()));
    mascotSuccessToast('Section order updated');
  }
  function restoreSection(id) {
    var al=getActiveSections();
    setSections(function(prev){return prev.map(function(s){return s.id===id?Object.assign({},s,{archived:false,visible:true,order:al.length}):s;});});
    mascotSuccessToast('Section restored');
  }
  function executeDeleteSection(id) {
    setSections(function(prev){return prev.filter(function(s){return s.id!==id;});});
    setSectionDeleteModal(null); mascotSuccessToast('Section deleted');
  }

  // ── FETCH ─────────────────────────────────────────────────────────────────
  async function fetchOrg() {
    try {
      var ur=await supabase.auth.getUser(); var user=ur.data.user;
      if (!user){navigate('/login');return;}
      var mr=await supabase.from('memberships').select('role').eq('organization_id',organizationId).eq('member_id',user.id).eq('status','active').single();
      if (!mr.data||mr.data.role!=='admin'){toast.error('Admin access required');navigate('/organizations/'+organizationId);return;}
      var or2=await supabase.from('organizations').select('*').eq('id',organizationId).single();
      if (or2.error) throw or2.error;
      var data=or2.data; setOrg(data);
      var ss=data.page_sections||{}, saved=data.settings||{}, st=saved.theme||{};
      setSections(normalizeSections(ss,saved.sections_v2||null));
      setForm({
        name:data.name||'', tagline:data.tagline||'', description:data.description||'',
        contact_email:data.contact_email||'', contact_phone:data.contact_phone||'',
        address:data.address||'', city:data.city||'', state:data.state||'',
        zip_code:data.zip_code||'', website:data.website||'',
        logo_url:data.logo_url||'', banner_url:data.banner_url||'',
        social_links:data.social_links||{facebook:'',instagram:'',twitter:'',linkedin:'',youtube:''},
        page_sections:{about:ss.about!==false,events:ss.events!==false,announcements:ss.announcements!==false,photos:ss.photos!==false,members:ss.members===true,contact:ss.contact!==false,join:ss.join!==false},
        is_public:data.is_public||false, template:saved.template||'classic',
        theme:{primaryColor:st.primaryColor||'#3B82F6',fontPairing:st.fontPairing||'inter',buttonStyle:st.buttonStyle||'rounded',customColors:st.customColors||['#3B82F6','','']},
        nav_links:saved.nav_links||DEFAULT_NAV_LINKS,
        publish_channels:saved.publish_channels||{website:true,discovery:false},
        footerColumns:saved.footerColumns||2,
      });
      var pr=await supabase.from('org_site_pages').select('*').eq('organization_id',organizationId).order('sort_order',{ascending:true});
      if (pr.error) throw pr.error;
      var ep=pr.data||[];
      if (ep.length===0) {
        var ti=DEFAULT_PAGES.map(function(p){return Object.assign({},p,{organization_id:organizationId});});
        var ir=await supabase.from('org_site_pages').insert(ti).select();
        if (ir.error) throw ir.error; ep=ir.data;
      }
      var ef=ep.find(function(p){return p.page_key==='__footer__';});
      if (!ef) {
        var fi=await supabase.from('org_site_pages').insert([{organization_id:organizationId,page_key:'__footer__',title:'Footer',nav_label:'Footer',sort_order:9999,is_enabled:true,is_visible_in_nav:false}]).select().single();
        if (!fi.error) ef=fi.data;
      }
      setFooterPage(ef||null);
      setSitePages(ep.filter(function(p){return p.page_key!=='__footer__';}));
      var br=await supabase.from('org_site_blocks').select('*').eq('organization_id',organizationId).eq('is_visible',true).order('sort_order',{ascending:true});
      if (!br.error) setSiteBlocks(br.data||[]);
      var cr=await supabase.from('org_site_config').select('setup_wizard_dismissed').eq('organization_id',organizationId).maybeSingle();
      if (!cr.data||!cr.data.setup_wizard_dismissed) setShowWizard(true);
    } catch(err){ toast.error('Failed to load organization'); } finally { setLoading(false); }
  }

async function uploadImage(file,type) {
    if (file.size>5*1024*1024){toast.error('Image must be under 5MB');return;}
    if (!file.type.startsWith('image/')){toast.error('File must be an image');return;}
    var storageCheck = await getStorageUsage(organizationId);
    if (storageCheck && storageCheck.isBlocked) {
      toast.error('Storage limit reached. Upgrade your plan to upload images.');
      return;
    }
    if (storageCheck && storageCheck.isWarning) {
      toast('Storage is above 90% — consider upgrading soon.', { icon: null });
    }
    setUploadingLogo(true);
    try {
      var ext=file.name.split('.').pop();
      var fn=organizationId+'/'+type+'-'+Date.now()+'.'+ext;
      var ur=await supabase.storage.from('organization-images').upload(fn,file,{upsert:true});
      if (ur.error) throw ur.error;
      var pu=supabase.storage.from('organization-images').getPublicUrl(fn).data.publicUrl;
      setForm(function(prev){var u={};u[type+'_url']=pu;return Object.assign({},prev,u);});
      mascotSuccessToast((type==='banner'?'Banner':'Logo')+' uploaded!');
    } catch(err){ mascotErrorToast('Upload failed',err.message); } finally { setUploadingLogo(false); }
  }

  async function handleSave() {
    if (!form.name.trim()){toast.error('Organization name is required');return;}
    setSaving(true);
    try {
      var er=await supabase.from('organizations').select('settings').eq('id',organizationId).single();
      var es=er.data?(er.data.settings||{}):{};
      var us=Object.assign({},es,{template:form.template,theme:form.theme,nav_links:form.nav_links,publish_channels:form.publish_channels,sections_v2:sections,footerColumns:form.footerColumns});
      var ur=await supabase.from('organizations').update({
        name:form.name.trim(),tagline:form.tagline.trim(),description:form.description.trim(),
        contact_email:form.contact_email.trim(),contact_phone:form.contact_phone.trim(),
        address:form.address.trim(),city:form.city.trim(),state:form.state.trim(),
        zip_code:form.zip_code.trim(),website:form.website.trim(),
        logo_url:form.logo_url,banner_url:form.banner_url,social_links:form.social_links,
        page_sections:sectionsToLegacy(sections),is_public:form.is_public,settings:us,
      }).eq('id',organizationId);
      if (ur.error) throw ur.error;
      mascotSuccessToast('Changes saved!');
    } catch(err){ mascotErrorToast('Save failed',err.message); } finally { setSaving(false); }
  }

  function handleField(e) { var n=e.target.name,v=e.target.type==='checkbox'?e.target.checked:e.target.value; setForm(function(prev){var u={};u[n]=v;return Object.assign({},prev,u);}); }
  function handleSocial(e) { var n=e.target.name,v=e.target.value; setForm(function(prev){return Object.assign({},prev,{social_links:Object.assign({},prev.social_links,{[n]:v})});}); }
  function setTV(k,v) { setForm(function(prev){return Object.assign({},prev,{theme:Object.assign({},prev.theme,{[k]:v})});}); }
  function setPC(k,v) { setForm(function(prev){return Object.assign({},prev,{publish_channels:Object.assign({},prev.publish_channels,{[k]:v})});}); }

  var cps=sectionsToLegacy(sections);
  var pOrg={id:organizationId,name:form.name||'Your Organization',tagline:form.tagline,description:form.description,contact_email:form.contact_email,contact_phone:form.contact_phone,address:form.address,city:form.city,state:form.state,zip_code:form.zip_code,website:form.website,logo_url:form.logo_url,banner_url:form.banner_url,social_links:form.social_links,slug:org?org.slug:'',settings:{template:form.template,theme:form.theme,nav_links:form.nav_links,publish_channels:form.publish_channels},page_sections:cps,is_public:form.is_public};
  var pTV=getThemeVars(pOrg), pNL=getNavLinks(pOrg);
  var pJP={joinForm:{name:'',email:'',message:''},joinLoading:false,joinError:null,joinSuccess:false,onChange:function(){},onSubmit:function(e){e.preventDefault();},onReset:function(){},isPreview:true};
  var pTP={org:pOrg,events:[],announcements:[],photos:[],sections:cps,joinProps:pJP,openLightbox:function(){},navLinks:pNL,themeVars:pTV};

  var navSecs=[
    {id:'overview',     label:'Overview',        icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'},
    {id:'org-info',     label:'Org Info',        icon:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'},
    {id:'appearance',   label:'Appearance',      icon:'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'},
    {id:'pages-content',label:'Pages & Content', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'},
    {id:'publish',      label:'Publish',         icon:'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064'},
  ];

  if (loading) return <EditorSkeleton />;

  var epc=sitePages.filter(function(p){return p.is_enabled;}).length;
  var bc=siteBlocks.length;
  var lu=org&&org.updated_at?new Date(org.updated_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Never';
  var activeSecs=getActiveSections(), archivedSecs=getArchivedSections();
  var enabledCount = sitePages.filter(function(p){return p.is_enabled;}).length;
  var atPageLimit = additionalPageLimit !== null && enabledCount >= additionalPageLimit;

  return (
    <div className={previewOpen?'h-screen overflow-hidden flex flex-col '+bg:'min-h-screen '+bg}>

      {showWizard && <WebsiteSetupWizard organizationId={organizationId} orgData={form} onComplete={function(data){setShowWizard(false);setForm(function(prev){return Object.assign({},prev,data);});}} onDismiss={function(){setShowWizard(false);}} />}

      {/* Layout modal */}
      {showLayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="lm-title">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={function(){setShowLayoutModal(false);}} />
          <div className={'relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border '+bgCard+' '+border}>
            <div className={'flex items-center justify-between px-6 py-5 border-b flex-shrink-0 '+borderL}>
              <div><p className={'text-xs font-bold uppercase tracking-[4px] mb-0.5 '+tYel}>Layout</p><h2 id="lm-title" className={'text-xl font-bold '+tPri}>Change Layout</h2></div>
              <button onClick={function(){setShowLayoutModal(false);}} aria-label="Close" className={'p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 '+(isDark?'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#1E2845]':'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}><Icon path="M6 18L18 6M6 6l12 12" className="h-5 w-5"/></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Page templates">
                {TEMPLATES.map(function(t){
                  var isSel=form.template===t.id;
                  return (
                    <button key={t.id} onClick={function(){setForm(function(prev){return Object.assign({},prev,{template:t.id});});setShowLayoutModal(false);mascotSuccessToast(t.name+' layout selected');}}
                      className={'rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 '+(isSel?'border-blue-500 '+bgEle:''+border+' '+bgSec+' hover:border-blue-300')}
                      role="radio" aria-checked={isSel} aria-label={'Select '+t.name+' template'}>
                      <div className="aspect-video bg-white rounded-lg overflow-hidden mb-3 border border-gray-200">{t.preview}</div>
                      <div className="flex items-start justify-between gap-2">
                        <div><p className={'font-semibold text-sm '+tPri}>{t.name}</p><p className={'text-xs mt-0.5 leading-snug '+tTer}>{t.description}</p></div>
                        {isSel && <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"/>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={'px-6 py-4 border-t rounded-b-2xl flex-shrink-0 '+bgSec+' '+borderL}><p className={'text-xs text-center '+tTer}>Layout changes are reflected instantly in the preview. Save to make them permanent.</p></div>
          </div>
        </div>
      )}

      {/* Delete page modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dp-title">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={function(){setDeleteModal(null);}} />
          <div className={'relative rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center border '+bgCard+' '+border}>
            <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center mb-5"><Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-8 w-8 text-red-400"/></div>
            <h2 id="dp-title" className={'text-xl font-bold mb-2 '+tPri}>Delete "{deleteModal.title}"?</h2>
            <p className={'text-sm mb-8 '+tMut}>This will be permanently deleted and <span className="font-semibold text-red-400">cannot be recovered</span>.</p>
            <div className="flex gap-3 w-full">
              <button onClick={function(){setDeleteModal(null);}} className={'flex-1 py-3 rounded-xl border-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors '+(isDark?border+' '+tSec+' hover:bg-[#1E2845]':'border-gray-200 text-gray-700 hover:bg-gray-50')}>No, Keep Page</button>
              <button onClick={async function(){await deletePage(deleteModal.id);setDeleteModal(null);}} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">Yes, Delete Forever</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete section modal */}
      {sectionDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ds-title">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={function(){setSectionDeleteModal(null);}} />
          <div className={'relative rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center border '+bgCard+' '+border}>
            <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center mb-5"><Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-8 w-8 text-red-400"/></div>
            <h2 id="ds-title" className={'text-xl font-bold mb-2 '+tPri}>Delete "{sectionDeleteModal.label}"?</h2>
            <p className={'text-sm mb-2 '+tMut}>This section will be permanently removed and <span className="font-semibold text-red-400">cannot be restored</span>.</p>
            <p className={'text-xs mb-8 '+tTer}>Tip: Use Archive instead if you might want it back later.</p>
            <div className="flex gap-3 w-full">
              <button onClick={function(){setSectionDeleteModal(null);}} className={'flex-1 py-3 rounded-xl border-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors '+(isDark?border+' '+tSec+' hover:bg-[#1E2845]':'border-gray-200 text-gray-700 hover:bg-gray-50')}>No, Keep Section</button>
              <button onClick={function(){executeDeleteSection(sectionDeleteModal.id);}} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <a href="#editor-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold">Skip to editor</a>

      {/* Top bar — NO back button */}
      <div className={'border-b sticky top-0 z-10 flex-shrink-0 '+(isDark?'bg-[#151B2D] border-[#2A3550]':'bg-white border-gray-200')}>
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className={'text-base font-bold truncate '+tPri}>Website Builder</h1>
            <p className={'text-xs truncate '+tTer}>{org&&org.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={function(){setPreviewOpen(!previewOpen);}}
              className={'hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 '
                +(previewOpen?(isDark?'bg-blue-600 text-white border-blue-600':'bg-gray-900 text-white border-gray-900'):(isDark?'bg-[#1A2035] text-[#CBD5E1] border-[#2A3550] hover:bg-[#1E2845]':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'))}
              aria-label={previewOpen?'Hide preview':'Show preview'} aria-pressed={previewOpen}>
              <Icon path={previewOpen?'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21':'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'} className="h-4 w-4"/>
              {previewOpen?'Hide Preview':'Preview'}
            </button>
            {org&&org.slug&&(
              <a href={'/org/'+org.slug} target="_blank" rel="noopener noreferrer"
                className={'hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all '+(isDark?'text-blue-400 border-[#2A3550] hover:bg-[#1E2845]':'text-blue-600 border-blue-300 hover:bg-blue-50')}
                aria-label="Open public page in new tab">
                <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="h-4 w-4"/>Open Page
              </a>
            )}
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
              aria-label={saving?'Saving changes':'Save changes'} aria-busy={saving}>
              {saving?(<><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving...</>):(<><Icon path="M5 13l4 4L19 7" className="h-4 w-4"/>Save</>)}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={previewOpen?'flex flex-1 overflow-hidden':bg}>
        {/* Editor */}
        <div className={previewOpen?('overflow-auto border-r '+(isDark?'border-[#2A3550] ':'border-gray-200 ')+bg):('max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full '+bg)}
          style={previewOpen?{width:'42%',flexShrink:0,padding:'24px'}:{}}>
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Sidebar */}
            <aside className="lg:w-36 flex-shrink-0">
              <nav aria-label="Website editor sections">
                <ul className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {navSecs.map(function(s){
                    var isA=activeSection===s.id;
                    return (
                      <li key={s.id}>
                        <button onClick={function(){setActiveSection(s.id);}}
                          className={'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap '
                            +(isA?'bg-blue-600 text-white shadow-sm':(isDark?'bg-[#1A2035] text-[#CBD5E1] hover:bg-[#1E2845] border border-[#2A3550]':'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'))}
                          aria-current={isA?'page':undefined}>
                          <Icon path={s.icon} className={'h-3.5 w-3.5 flex-shrink-0 '+(isA?'text-white':tTer)}/>
                          {s.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* Panel */}
            <main id="editor-main" className="flex-1 min-w-0" aria-label="Editor panel">

              {/* TAB 1 — OVERVIEW */}
              {activeSection==='overview' && (
                <div className="space-y-4">
                  <div className={'rounded-xl border shadow-sm p-6 '+bgCard+' '+border}>
                    <p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>Overview</p>
                    <h2 className={'text-2xl font-bold mb-1 '+tPri}>Site Status</h2>
                    <p className={'text-sm mb-6 '+tMut}>A quick look at your website and publish state.</p>
                    <div className={'flex items-center justify-between p-5 rounded-xl border-2 transition-all '+(form.is_public?'border-green-500 bg-green-500 bg-opacity-10':(isDark?border+' '+bgSec:'border-gray-200 bg-gray-50'))}>
                      <div className="flex items-center gap-4">
                        <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 '+(form.is_public?'bg-green-500 bg-opacity-20':bgEle)} aria-hidden="true">
                          <Icon path={form.is_public?'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064':'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'} className={'h-5 w-5 '+(form.is_public?'text-green-400':tTer)}/>
                        </div>
                        <div>
                          <p className={'font-bold '+tPri}>{form.is_public?'Live — Page is Public':'Draft — Page is Private'}</p>
                          <p className={'text-sm '+tMut}>{form.is_public?'Anyone can find and view your page':'Your page is hidden from the public'}</p>
                        </div>
                      </div>
                      <Toggle checked={form.is_public} onChange={function(){setForm(function(prev){return Object.assign({},prev,{is_public:!prev.is_public});});}} label={form.is_public?'Make page private':'Make page public'} id="ov-pub" d={isDark}/>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className={'rounded-xl border shadow-sm p-4 text-center '+bgCard+' '+border}><p className="text-2xl font-extrabold text-blue-400">{epc}</p><p className={'text-xs font-semibold uppercase tracking-wide mt-1 '+tTer}>Active Pages</p></div>
                    <div className={'rounded-xl border shadow-sm p-4 text-center '+bgCard+' '+border}><p className="text-2xl font-extrabold text-purple-400">{bc}</p><p className={'text-xs font-semibold uppercase tracking-wide mt-1 '+tTer}>Content Blocks</p></div>
                    <div className={'rounded-xl border shadow-sm p-4 text-center '+bgCard+' '+border}>
                      <div className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold '+(form.publish_channels.discovery?'bg-purple-500 bg-opacity-20 text-purple-400':(isDark?bgEle+' '+tTer:'bg-gray-100 text-gray-400'))}>
                        <span className={'w-2 h-2 rounded-full '+(form.publish_channels.discovery?'bg-purple-400':(isDark?'bg-[#2A3550]':'bg-gray-300'))} aria-hidden="true"/>
                        {form.publish_channels.discovery?'In Discovery':'Not Listed'}
                      </div>
                      <p className={'text-xs font-semibold uppercase tracking-wide mt-2 '+tTer}>Discovery</p>
                    </div>
                  </div>
                  <div className={'rounded-xl border shadow-sm p-6 space-y-4 '+bgCard+' '+border}>
                    <div className="flex items-center justify-between">
                      <div className={'flex items-center gap-2 '+tMut}>
                        <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className={'h-4 w-4 '+tTer}/>
                        <span className="text-sm">Last saved: <span className={'font-semibold '+tSec}>{lu}</span></span>
                      </div>
                      <span className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold '+(form.is_public?'bg-green-500 bg-opacity-20 text-green-400':(isDark?bgEle+' '+tTer:'bg-gray-100 text-gray-500'))}>
                        <span className={'w-1.5 h-1.5 rounded-full '+(form.is_public?'bg-green-400':(isDark?'bg-[#2A3550]':'bg-gray-400'))} aria-hidden="true"/>
                        {form.is_public?'Published':'Unpublished'}
                      </span>
                    </div>
                    {org&&org.slug&&(
                      <div>
                        <p className={'text-xs font-semibold mb-2 '+tTer}>Syndicade Page URL</p>
                        <div className="flex items-center gap-2">
                          <code className={'flex-1 rounded-lg px-3 py-2 text-blue-400 text-xs font-mono truncate border '+bgSec+' '+border}>{window.location.origin+'/org/'+org.slug}</code>
                          <a href={'/org/'+org.slug} target="_blank" rel="noopener noreferrer" className={'flex-shrink-0 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all '+(isDark?border+' '+tTer+' hover:text-blue-400 hover:border-blue-500 hover:bg-[#1E2845]':'border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300')} aria-label="Open public page in new tab">
                            <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="h-4 w-4"/>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2 — ORG INFO */}
              {activeSection==='org-info' && (
                <div className="space-y-6">
                  {/* Logo */}
                  <div className={'rounded-xl border shadow-sm p-6 '+bgCard+' '+border}>
                    <p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>Logo</p>
                    <h2 className={'text-xl font-bold mb-1 '+tPri}>Organization Logo</h2>
                    <p className={'text-sm mb-5 '+tMut}>Displayed as a circle on your public page. Max 5MB.</p>
                    <div className="flex items-center gap-6">
                      <div className={'relative w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer group overflow-hidden flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 '+(isDark?'border-[#2A3550] hover:border-blue-500':'border-gray-200 hover:border-blue-500')}
                        onClick={function(){logoInputRef.current&&logoInputRef.current.click();}} onKeyDown={function(e){e.key==='Enter'&&logoInputRef.current&&logoInputRef.current.click();}} tabIndex={0} role="button" aria-label="Upload organization logo">
                        {form.logo_url?(
                          <div className="w-full h-full">
                            <img src={form.logo_url} alt="Organization logo" className="w-full h-full object-contain bg-gray-50 p-1 rounded-full"/>
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity"><span className="text-white text-xs font-semibold">Change</span></div>
                          </div>
                        ):(
                          <div className={'flex flex-col items-center gap-1.5 transition-colors '+(isDark?'text-[#2A3550] group-hover:text-blue-400':'text-gray-400 group-hover:text-blue-400')}>
                            {uploadingLogo?(<svg className="animate-spin h-7 w-7" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>):(<><Icon path="M12 4v16m8-8H4" className="h-7 w-7" strokeWidth={1.5}/><p className="text-xs font-medium text-center px-2">Add Logo</p></>)}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <button onClick={function(){logoInputRef.current&&logoInputRef.current.click();}} className={'px-4 py-2 border text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all '+(isDark?'bg-[#1A2035] border-[#2A3550] text-[#CBD5E1] hover:border-blue-500 hover:bg-[#1E2845]':'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50')}>{form.logo_url?'Change Logo':'Upload Logo'}</button>
                        {form.logo_url&&<button onClick={function(){setForm(function(prev){return Object.assign({},prev,{logo_url:''}); });}} className="text-sm text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded transition-colors" aria-label="Remove logo">Remove logo</button>}
                        <p className={'text-xs '+tTer}>PNG, JPG, WebP — max 5MB</p>
                      </div>
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" aria-label="Upload logo image" onChange={function(e){e.target.files&&e.target.files[0]&&uploadImage(e.target.files[0],'logo');}}/>
                  </div>
                  {/* Basic Info */}
                  <div className={'rounded-xl border shadow-sm p-6 space-y-4 '+bgCard+' '+border}>
                    <div><p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>About</p><h2 className={'text-xl font-bold mb-1 '+tPri}>Basic Info</h2></div>
                    <div><label htmlFor="oi-name" className={lblCls}>Organization Name <span className="text-red-400" aria-hidden="true">*</span></label><input id="oi-name" name="name" type="text" required aria-required="true" value={form.name} onChange={handleField} maxLength={100} className={inputCls}/></div>
                    <div><label htmlFor="oi-tagline" className={lblCls}>Tagline</label><input id="oi-tagline" name="tagline" type="text" value={form.tagline} onChange={handleField} placeholder="e.g. Building a stronger community since 2010" maxLength={120} className={inputCls} aria-describedby="oi-tc"/><p id="oi-tc" className={'text-xs mt-1 text-right '+tTer} aria-live="polite">{form.tagline.length}/120</p></div>
                    <div><label htmlFor="oi-desc" className={lblCls}>About / Mission Statement</label><textarea id="oi-desc" name="description" value={form.description} onChange={handleField} rows={5} maxLength={1000} placeholder="Tell visitors who you are, what you do, and why it matters..." className={inputCls+' resize-none'} aria-describedby="oi-dc"/><p id="oi-dc" className={'text-xs mt-1 text-right '+tTer} aria-live="polite">{form.description.length}/1000</p></div>
                    <div><label htmlFor="oi-web" className={lblCls}>Organization Website</label><input id="oi-web" name="website" type="url" value={form.website} onChange={handleField} placeholder="https://yourorg.org" className={inputCls}/></div>
                  </div>
                  {/* Contact */}
                  <div className={'rounded-xl border shadow-sm p-6 space-y-4 '+bgCard+' '+border}>
                    <div><p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>Contact</p><h2 className={'text-xl font-bold mb-1 '+tPri}>Contact Information</h2></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label htmlFor="oi-em" className={lblCls}>Email Address</label><input id="oi-em" name="contact_email" type="email" value={form.contact_email} onChange={handleField} placeholder="info@yourorg.org" className={inputCls}/></div>
                      <div><label htmlFor="oi-ph" className={lblCls}>Phone Number</label><input id="oi-ph" name="contact_phone" type="tel" value={form.contact_phone} onChange={handleField} placeholder="(555) 123-4567" className={inputCls}/></div>
                    </div>
                    <div><label htmlFor="oi-addr" className={lblCls}>Street Address</label><input id="oi-addr" name="address" type="text" value={form.address} onChange={handleField} placeholder="123 Main St" className={inputCls}/></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-2"><label htmlFor="oi-city" className={lblCls}>City</label><input id="oi-city" name="city" type="text" value={form.city} onChange={handleField} className={inputCls}/></div>
                      <div><label htmlFor="oi-st" className={lblCls}>State</label><input id="oi-st" name="state" type="text" value={form.state} onChange={handleField} maxLength={2} placeholder="OH" className={inputCls+' uppercase'}/></div>
                      <div><label htmlFor="oi-zip" className={lblCls}>ZIP</label><input id="oi-zip" name="zip_code" type="text" value={form.zip_code} onChange={handleField} maxLength={10} className={inputCls}/></div>
                    </div>
                  </div>
                  {/* Social */}
                  <div className={'rounded-xl border shadow-sm p-6 space-y-4 '+bgCard+' '+border}>
                    <div><p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>Social</p><h2 className={'text-xl font-bold mb-1 '+tPri}>Social Media Links</h2></div>
                    {[{k:'facebook',l:'Facebook',p:'https://facebook.com/yourorg'},{k:'instagram',l:'Instagram',p:'https://instagram.com/yourorg'},{k:'twitter',l:'X / Twitter',p:'https://twitter.com/yourorg'},{k:'linkedin',l:'LinkedIn',p:'https://linkedin.com/company/yourorg'},{k:'youtube',l:'YouTube',p:'https://youtube.com/@yourorg'}].map(function(it){
                      return (<div key={it.k}><label htmlFor={'oi-s-'+it.k} className={lblCls}>{it.l}</label><input id={'oi-s-'+it.k} name={it.k} type="url" value={form.social_links[it.k]||''} onChange={handleSocial} placeholder={it.p} className={inputCls}/></div>);
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3 — APPEARANCE */}
              {activeSection==='appearance' && (
                <div className={'rounded-xl border shadow-sm p-6 space-y-2 '+bgCard+' '+border}>
                  <p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>Appearance</p>
                  <h2 className={'text-2xl font-bold mb-1 '+tPri}>Customize Your Site</h2>
                  <p className={'text-sm mb-2 '+tMut}>Everything that controls how your public page looks.</p>
                  <AppearanceSection label="Layout Template" d={isDark}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Page templates">
                      {TEMPLATES.map(function(t){
                        var isSel=form.template===t.id;
                        return (<button key={t.id} onClick={function(){setForm(function(prev){return Object.assign({},prev,{template:t.id});});}}
                          className={'rounded-xl border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 '+(isSel?'border-blue-500 '+bgEle:border+' '+bgSec+' hover:border-blue-300')}
                          role="radio" aria-checked={isSel} aria-label={'Select '+t.name+' template: '+t.description}>
                          <div className="aspect-video bg-white rounded-lg overflow-hidden mb-3 border border-gray-200">{t.preview}</div>
                          <div className="flex items-start justify-between gap-2">
                            <div><p className={'font-semibold text-sm '+tPri}>{t.name}</p><p className={'text-xs mt-0.5 leading-snug '+tTer}>{t.description}</p></div>
                            {isSel&&<Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"/>}
                          </div>
                        </button>);
                      })}
                    </div>
                  </AppearanceSection>
                  <AppearanceSection label="Brand Colors" d={isDark}>
                    <div className="space-y-4">
                      {[0,1,2].map(function(i){
                        var cc=form.theme.customColors||['#3B82F6','',''], val=cc[i]||'', iv=/^#([0-9A-Fa-f]{3}){1,2}$/.test(val);
                        return (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg border-2 flex-shrink-0" style={{background:iv?val:(isDark?'#1E2845':'#f3f4f6'),borderColor:isDark?'#2A3550':'#e5e7eb'}} aria-hidden="true"/>
                            <div className="flex-1">
                              <label htmlFor={'c-'+i} className={lblCls}>{'Brand Color '+(i+1)+(i===0?' (Primary)':' (Optional)')}</label>
                              <div className="flex items-center gap-2">
                                <input id={'c-'+i} type="text" value={val} onChange={function(e){var nc=(form.theme.customColors||['#3B82F6','','']).slice();nc[i]=e.target.value;setTV('customColors',nc);}} placeholder="#3B82F6" maxLength={7} className={inputCls+' font-mono uppercase'}/>
                                <input type="color" value={iv?val:'#3B82F6'} onChange={function(e){var nc=(form.theme.customColors||['#3B82F6','','']).slice();nc[i]=e.target.value.toUpperCase();setTV('customColors',nc);}} className="w-12 h-12 rounded-lg border cursor-pointer flex-shrink-0 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{borderColor:isDark?'#2A3550':'#d1d5db'}} aria-label={'Color picker '+(i+1)}/>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AppearanceSection>
                  <AppearanceSection label="Typography" d={isDark}>
                    <div className="space-y-3" role="radiogroup" aria-label="Font pairing options">
                      {FONT_PAIRINGS.map(function(fp){
                        var isSel=form.theme.fontPairing===fp.id;
                        return (<button key={fp.id} onClick={function(){setTV('fontPairing',fp.id);}} className={'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-left '+(isSel?'border-blue-500 '+bgEle:border+' '+bgCard+' hover:border-blue-300')} role="radio" aria-checked={isSel}>
                          <div><p className={'font-semibold text-sm '+tPri}>{fp.label}</p><p className={'text-xs mt-0.5 '+tMut}>{fp.description}</p><p className={'text-xs mt-1 font-mono '+tTer}>{fp.sample}</p></div>
                          {isSel&&<Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-blue-500 flex-shrink-0"/>}
                        </button>);
                      })}
                    </div>
                  </AppearanceSection>
                  <AppearanceSection label="Button Style" d={isDark}>
                    <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Button style options">
                      {BUTTON_STYLES.map(function(bs){
                        var isSel=form.theme.buttonStyle===bs.id;
                        return (<button key={bs.id} onClick={function(){setTV('buttonStyle',bs.id);}} className={'p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-center '+(isSel?'border-blue-500 '+bgEle:border+' '+bgCard+' hover:border-blue-300')} role="radio" aria-checked={isSel} aria-label={'Button style: '+bs.label}>
                          <div className="flex justify-center mb-3"><span className={'px-4 py-1.5 bg-blue-600 text-white text-xs font-bold '+bs.previewClass} aria-hidden="true">Button</span></div>
                          <p className={'text-sm font-semibold '+tPri}>{bs.label}</p>
                        </button>);
                      })}
                    </div>
                  </AppearanceSection>
                </div>
              )}

              {/* TAB 4 — PAGES & CONTENT */}
              {activeSection==='pages-content' && (
                <div className="space-y-6">
                  <div className={'rounded-xl border shadow-sm p-6 '+bgCard+' '+border}>
                    {/* Header — title + button on one row, description below */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className={'text-xs font-bold uppercase tracking-[4px] mb-0.5 '+tYel}>Pages</p>
                        <h2 className={'text-lg font-bold '+tPri}>Site Pages &amp; Sections</h2>
                      </div>
                      <button onClick={function(){setShowLayoutModal(true);}} aria-label="Change site layout"
                        className={'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 '+(isDark?'bg-[#1A2035] border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845]':'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')}>
                        <Icon path="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-.293.707L13 15.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-5.586L4.293 7.707A1 1 0 014 7V5z" className="h-3.5 w-3.5"/>Change Layout
                      </button>
                    </div>
                    <p className={'text-xs mb-4 '+tMut}>Expand any page row to edit its content blocks. Drag rows to reorder.</p>

                    {/* Status row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {/* Nav counter — only shown on Growth/Pro since Starter = home page only */}
                      {!isStarterPlan && (function(){
                        var nc=sitePages.filter(function(p){return p.is_visible_in_nav&&p.is_enabled;}).length;
                        return (
                          <div className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border '+(nc>=NAV_LIMIT?'bg-amber-500 bg-opacity-10 text-amber-400 border-amber-500 border-opacity-30':(isDark?'bg-[#1E2845] text-[#94A3B8] border-[#2A3550]':'bg-gray-100 text-gray-600 border-gray-200'))}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
                            {nc}/{NAV_LIMIT} in nav{nc>=NAV_LIMIT?' — full':''}
                          </div>
                        );
                      })()}
                      {/* Page counter — Growth only */}
                      {!isStarterPlan && additionalPageLimit !== null && (
                        <div className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border '+(atPageLimit?'bg-amber-500 bg-opacity-10 text-amber-400 border-amber-500 border-opacity-30':(isDark?'bg-[#1E2845] text-[#94A3B8] border-[#2A3550]':'bg-gray-100 text-gray-600 border-gray-200'))}>
                          <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="h-3 w-3"/>
                          {enabledCount}/{additionalPageLimit} pages{atPageLimit?' — limit reached':''}
                        </div>
                      )}
                      {/* Starter badge */}
                      {isStarterPlan && (
                        <div className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-purple-500 bg-opacity-10 text-purple-400 border-purple-500 border-opacity-30'}>
                          <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="h-3 w-3"/>
                          Starter — home page only &middot; <button onClick={function(){navigate('/organizations/'+organizationId+'/billing');}} className="underline focus:outline-none ml-0.5">Upgrade for more pages</button>
                        </div>
                      )}
                    </div>

                    {/* HOME PAGE ROW */}
                    {(function(){
                      var he=expandedPageId==='__home__';
                      return (
                        <div className="mb-2">
                          <div className={'rounded-lg border transition-all '+bgCard+' '+(he?'border-blue-500':border)}>
                            {/* Row 1 */}
                            <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
                              <div className="w-4 flex-shrink-0" aria-hidden="true"/>
                              <p className={'text-xs font-semibold flex-1 '+tPri}>Home Page</p>
                              <button onClick={function(){setExpandedPageId(he?null:'__home__');}} aria-label={he?'Collapse home page sections':'Expand home page sections'} aria-expanded={he}
                                className={'p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded transition-colors flex-shrink-0 '+(isDark?'text-[#2A3550] hover:text-[#94A3B8]':'text-gray-300 hover:text-gray-600')}>
                                <Icon path={he?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'} className="h-3 w-3"/>
                              </button>
                            </div>
                            {/* Row 2 */}
                            <div className="flex items-center gap-2 px-2 pb-2 pl-7">
                              <p className={'text-[10px] '+tTer}>/</p>
                              <span className={'text-[10px] '+tTer}>Always in nav &middot; always on</span>
                            </div>
                            {he&&(
                              <div className={'border-t px-4 pb-4 pt-3 rounded-b-xl '+(isDark?'border-blue-500 border-opacity-30 bg-blue-500 bg-opacity-5':'border-blue-200 bg-blue-50')}>
                                <p className={'text-xs font-bold uppercase tracking-[3px] mb-3 '+tTer}>Home Page Sections</p>
                                <div className={'flex items-center gap-2 p-3 rounded-xl border mb-4 '+bgCard+' '+(isDark?'border-blue-500 border-opacity-20':'border-blue-100')}>
                                  <Icon path="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="h-4 w-4 text-blue-400 flex-shrink-0"/>
                                  <p className={'text-xs '+(isDark?'text-blue-300':'text-blue-700')}>Drag to reorder. Changes save when you click Save.</p>
                                </div>
                                {activeSecs.length===0?(
                                  <div className="text-center py-6"><p className={'text-sm font-semibold mb-1 '+tMut}>No active sections</p><p className={'text-xs '+tTer}>Add a custom section or restore an archived one.</p></div>
                                ):(
                                  <div className="space-y-2" role="list" aria-label="Page sections">
                                    <DndContext sensors={secSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                                      <SortableContext items={activeSecs.map(function(s){return s.id;})} strategy={verticalListSortingStrategy}>
                                        {activeSecs.map(function(section){
                                          return (
                                            <SortableSectionItem key={section.id} section={section} d={isDark}
                                              isEditing={editingSectionId===section.id} editingLabel={editingSectionLabel}
                                              onStartEdit={function(){setEditingSectionId(section.id);setEditingSectionLabel(section.label);}}
                                              onSaveEdit={function(){if(!editingSectionLabel.trim())return;setSections(function(prev){return prev.map(function(s){return s.id===section.id?Object.assign({},s,{label:editingSectionLabel.trim()}):s;});});setEditingSectionId(null);setEditingSectionLabel('');mascotSuccessToast('Section renamed');}}
                                              onCancelEdit={function(){setEditingSectionId(null);setEditingSectionLabel('');}}
                                              onEditChange={function(e){setEditingSectionLabel(e.target.value);}}
                                              onToggleVisible={function(){setSections(function(prev){return prev.map(function(s){return s.id===section.id?Object.assign({},s,{visible:!s.visible}):s;});});}}
                                              onArchive={function(){setSections(function(prev){return prev.map(function(s){return s.id===section.id?Object.assign({},s,{archived:true,visible:false}):s;});});mascotSuccessToast(section.label+' archived');}}
                                              onDelete={function(){setSectionDeleteModal(section);}}/>
                                          );
                                        })}
                                      </SortableContext>
                                    </DndContext>
                                  </div>
                                )}
                                {/* Add custom section */}
                                {showAddSection?(
                                  <div className={'flex items-center gap-2 mt-3 p-3 rounded-xl border '+bgCard+' '+border}>
                                    <input type="text" value={newSectionLabel} onChange={function(e){setNewSectionLabel(e.target.value);}}
                                      onKeyDown={function(e){if(e.key==='Enter'&&newSectionLabel.trim()){setSections(function(prev){return prev.concat([{id:'c-'+Date.now(),key:'c-'+Date.now(),label:newSectionLabel.trim(),visible:true,archived:false,order:getActiveSections().length,isCustom:true}]);});setNewSectionLabel('');setShowAddSection(false);mascotSuccessToast('Section added');}if(e.key==='Escape'){setShowAddSection(false);setNewSectionLabel('');}}}
                                      placeholder="Section name" className={'flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg text-sm focus:outline-none '+(isDark?'bg-[#1E2845] text-white':'text-gray-900')} autoFocus maxLength={50} aria-label="New section name"/>
                                    <button onClick={function(){if(!newSectionLabel.trim())return;setSections(function(prev){return prev.concat([{id:'c-'+Date.now(),key:'c-'+Date.now(),label:newSectionLabel.trim(),visible:true,archived:false,order:getActiveSections().length,isCustom:true}]);});setNewSectionLabel('');setShowAddSection(false);mascotSuccessToast('Section added');}} className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Add</button>
                                    <button onClick={function(){setShowAddSection(false);setNewSectionLabel('');}} aria-label="Cancel" className={'p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-lg '+tTer}><Icon path="M6 18L18 6M6 6l12 12" className="h-4 w-4"/></button>
                                  </div>
                                ):(
                                  <button onClick={function(){setShowAddSection(true);}} className={'w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 '+(isDark?'border-[#2A3550] text-[#64748B] hover:text-blue-400 hover:border-blue-500':'border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400')}>
                                    <Icon path="M12 4v16m8-8H4" className="h-4 w-4"/>Add Custom Section
                                  </button>
                                )}
                                {/* Archived sections */}
                                {archivedSecs.length>0&&(
                                  <div className={'mt-4 border-t pt-4 '+borderL}>
                                    <button onClick={function(){setShowArchivedSections(!showArchivedSections);}} className={'flex items-center gap-2 text-xs font-bold uppercase tracking-[3px] focus:outline-none focus:ring-2 focus:ring-gray-400 rounded w-full text-left '+tTer} aria-expanded={showArchivedSections}>
                                      <span>Archived Sections ({archivedSecs.length})</span>
                                      <Icon path={showArchivedSections?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'} className={'h-4 w-4 flex-shrink-0 '+tTer}/>
                                    </button>
                                    {showArchivedSections&&(
                                      <div className="space-y-2 mt-3">
                                        {archivedSecs.map(function(s){
                                          return (
                                            <div key={s.id} className={'flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed '+bgCard+' '+border}>
                                              <div className="min-w-0">
                                                <p className={'text-sm font-semibold truncate '+tTer}>{s.label}</p>
                                                {s.isCustom&&<span className={'text-xs px-2 py-0.5 rounded-full font-semibold '+(isDark?'bg-purple-500 bg-opacity-20 text-purple-400':'bg-purple-100 text-purple-600')}>Custom</span>}
                                              </div>
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <button onClick={function(){restoreSection(s.id);}} className="px-3 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500 border-opacity-40 rounded-lg hover:bg-blue-500 hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-blue-500">Restore</button>
                                                <button onClick={function(){setSectionDeleteModal(s);}} aria-label={'Delete '+s.label} className={'p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg '+(isDark?'text-[#2A3550] hover:text-red-400':'text-gray-300 hover:text-red-400')}><Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4"/></button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

            {/* Block editor for home page */}
            {(function(){
              var homePage = sitePages.find(function(p){ return p.page_key === 'home'; });
              if (!homePage) return null;
              return (
                <div className={'mt-4 border-t pt-4 ' + borderL}>
                  <p className={'text-xs font-bold uppercase tracking-[3px] mb-3 ' + tTer}>Page Blocks</p>
                  <BlockEditor
                    organizationId={organizationId}
                    pages={[homePage]}
                    onBlocksChange={function(up){ setSiteBlocks(up); }}
                  />
                </div>
              );
            })()}

                    {/* ADDITIONAL PAGES — draggable, always shown, toggle disabled on Starter */}
                    {(function(){
                      var aps=sitePages.filter(function(p){return p.is_enabled;});
                      var nc=sitePages.filter(function(p){return p.is_visible_in_nav&&p.is_enabled;}).length;
                      return (
                        <DndContext sensors={pgSensors} collisionDetection={closestCenter} onDragEnd={handlePageDragEnd}>
                          <SortableContext items={aps.map(function(p){return p.id;})} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2" role="list" aria-label="Site pages">
                              {aps.map(function(page){
                                var isExp=expandedPageId===page.id;
                                var planDisabled=isStarterPlan; // Starter can't enable/disable additional pages
                                return (
                                  <SortablePageItem key={page.id} page={page} isExpanded={isExp} d={isDark} planDisabled={planDisabled}
                                    onToggleExpand={function(){setExpandedPageId(isExp?null:page.id);}}
                                    navCount={nc} NAV_LIMIT={NAV_LIMIT}
                                    onNavToggle={function(){handlePageNavToggle(page);}}
                                    onEnabledToggle={function(){handlePageEnabledToggle(page);}}
                                    onArchive={async function(){var up=sitePages.map(function(p){return p.id===page.id?Object.assign({},p,{is_enabled:false,is_visible_in_nav:false}):p;});setSitePages(up);await savePageField(page.id,{is_enabled:false,is_visible_in_nav:false});await saveNavInstant(up);mascotSuccessToast(page.title+' archived');}}
                                    onDelete={function(){setDeleteModal(page);}}
                                    onTitleChange={handlePageTitleChange}
                                    onNavLabelChange={handlePageNavLabelChange}>
                                    <p className={'text-xs font-bold uppercase tracking-[3px] mb-3 '+tTer}>Page Blocks</p>
                                    <BlockEditor organizationId={organizationId} pages={[page]} onBlocksChange={function(up){setSiteBlocks(up);}}/>
                                  </SortablePageItem>
                                );
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      );
                    })()}

                    {/* Archived pages */}
                    {sitePages.filter(function(p){return !p.is_enabled&&!p.page_key.startsWith('external-');}).length>0&&(
                      <div className={'mt-6 border-t pt-6 '+borderL}>
                        <p className={'text-sm font-bold mb-1 '+tSec}>Archived Pages</p>
                        <p className={'text-xs mb-4 '+tTer}>These pages are hidden from your site.</p>
                        <div className="space-y-2">
                          {sitePages.filter(function(p){return !p.is_enabled&&!p.page_key.startsWith('external-');}).map(function(page){
                            return (
                              <div key={page.id} className={'flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed '+bgSec+' '+border}>
                                <div className="min-w-0"><p className={'text-sm font-semibold truncate '+tTer}>{page.title}</p><p className={'text-xs '+(isDark?'text-[#2A3550]':'text-gray-300')}>/{page.page_key}</p></div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button onClick={async function(){
                                    if (atPageLimit){toast.error(plan==='starter'?'Additional pages require Growth.':'Page limit reached.');return;}
                                    var up=sitePages.map(function(p){return p.id===page.id?Object.assign({},p,{is_enabled:true}):p;});
                                    setSitePages(up);await savePageField(page.id,{is_enabled:true});await saveNavInstant(up);mascotSuccessToast(page.title+' restored');
                                  }} className={'px-3 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors '+(atPageLimit?'opacity-50 cursor-not-allowed text-blue-400 border-blue-500 border-opacity-30':'text-blue-400 border-blue-500 border-opacity-40 hover:bg-blue-500 hover:bg-opacity-10')}>
                                    {atPageLimit?'Limit reached':'Restore'}
                                  </button>
                                  <button onClick={function(){setDeleteModal(page);}} aria-label={'Delete '+page.title} className={'p-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg '+(isDark?'text-[#2A3550] hover:text-red-400':'text-gray-300 hover:text-red-400')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* External links */}
                    <div className={'mt-6 border-t pt-6 '+borderL}>
                      <p className={'text-sm font-bold mb-1 '+tSec}>External Links in Nav</p>
                      <p className={'text-xs mb-4 '+tTer}>Add links to external sites (e.g. a donation page).</p>
                      {sitePages.filter(function(p){return p.page_key&&p.page_key.startsWith('external-');}).map(function(page){
                        var ei=isDark?'px-3 py-2 border border-[#2A3550] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1E2845] text-white':'px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50';
                        return (
                          <div key={page.id} className="flex items-center gap-2 mb-2">
                            <input type="text" value={page.nav_label} onChange={function(e){var l=e.target.value;setSitePages(function(prev){return prev.map(function(p){return p.id===page.id?Object.assign({},p,{nav_label:l}):p;});});savePageDebounced(page.id,{nav_label:l});}} placeholder="e.g. Donate" className={'flex-1 '+ei}/>
                            <input type="text" value={page.title} onChange={function(e){var u=e.target.value;setSitePages(function(prev){return prev.map(function(p){return p.id===page.id?Object.assign({},p,{title:u}):p;});});savePageDebounced(page.id,{title:u});}} placeholder="https://donate.example.com" className={ei+' w-48'}/>
                            <button onClick={async function(){var up=sitePages.filter(function(p){return p.id!==page.id;});setSitePages(up);await supabase.from('org_site_pages').delete().eq('id',page.id);await saveNavInstant(up);mascotSuccessToast('Link removed');}} aria-label={'Remove '+page.nav_label+' link'} className={'p-2 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg '+tTer}><Icon path="M6 18L18 6M6 6l12 12" className="h-4 w-4"/></button>
                          </div>
                        );
                      })}
                      <button onClick={async function(){var np={organization_id:organizationId,page_key:'external-'+Date.now(),title:'',nav_label:'',sort_order:sitePages.length,is_enabled:true,is_visible_in_nav:true};var r=await supabase.from('org_site_pages').insert([np]).select().single();if(r.error){toast.error('Could not add link');return;}var up=sitePages.concat([r.data]);setSitePages(up);await saveNavInstant(up);mascotSuccessToast('External link added');}}
                        className={'w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 '+(isDark?'border-[#2A3550] text-[#64748B] hover:text-blue-400 hover:border-blue-500':'border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400')}>
                        <Icon path="M12 4v16m8-8H4" className="h-4 w-4"/>Add External Link
                      </button>
                    </div>
                  </div>

                  {/* FOOTER block editor */}
                  <div className={'rounded-xl border shadow-sm overflow-hidden '+bgCard+' '+border}>
                    <button onClick={function(){setFooterOpen(!footerOpen);}} aria-expanded={footerOpen} aria-controls="footer-panel"
                      className={'w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors '+(isDark?'hover:bg-[#1E2845]':'hover:bg-gray-50')}>
                      <div className="flex items-start gap-3">
                        <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 '+bgEle} aria-hidden="true"><Icon path="M4 6h16M4 12h16M4 18h7" className={'h-5 w-5 '+tMut}/></div>
                        <div className="text-left">
                          <p className={'text-xs font-bold uppercase tracking-[4px] mb-0.5 '+tYel}>Footer</p>
                          <h2 className={'text-xl font-bold '+tPri}>Footer Blocks</h2>
                          <p className={'text-sm mt-0.5 '+tMut}>Appears at the bottom of every page.</p>
                        </div>
                      </div>
                      <Icon path={footerOpen?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'} className={'h-5 w-5 flex-shrink-0 ml-4 '+tTer}/>
                    </button>
                    {footerOpen&&(
                      <div id="footer-panel" className={'px-6 pb-5 border-t '+borderL}>
                        <div className={'rounded-xl border p-4 mt-4 '+bgSec+' '+border}>
                          <p className={'text-xs font-bold uppercase tracking-[3px] mb-3 '+tTer}>Footer Layout</p>
                          <div className="flex gap-3" role="radiogroup" aria-label="Footer column layout">
                            {[2,3].map(function(n){
                              var isSel=form.footerColumns===n;
                              return (<button key={n} onClick={function(){setForm(function(prev){return Object.assign({},prev,{footerColumns:n});});}}
                                className={'flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 '+(isSel?'border-blue-500 bg-blue-500 bg-opacity-10 text-blue-400':border+' '+bgCard+' '+tMut+' hover:border-blue-400')}
                                role="radio" aria-checked={isSel} aria-label={n+' column footer layout'}>
                                <svg viewBox={'0 0 '+(n*14+(n-1)*3)+' 18'} className="h-4" aria-hidden="true">{Array.from({length:n}).map(function(_,i){return <rect key={i} x={i*17} y="0" width="14" height="18" rx="2" fill={isSel?'#3B82F6':'#4B5563'}/>;})}</svg>
                                {n} Columns
                              </button>);
                            })}
                          </div>
                        </div>
                        <div className="mt-4">
                          {footerPage?(
                            <BlockEditor organizationId={organizationId} pages={[footerPage]} onBlocksChange={function(up){setSiteBlocks(function(prev){return prev.filter(function(b){return b.page_id!==footerPage.id;}).concat(up.filter(function(b){return b.page_id===footerPage.id;}));});}}/>
                          ):(
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <p className={'text-sm font-semibold mb-1 '+tSec}>Footer not available</p>
                              <button onClick={function(){window.location.reload();}} className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Reload</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5 — PUBLISH */}
              {activeSection==='publish' && (
                <div className="space-y-6">
                  <div className={'rounded-xl border shadow-sm p-6 '+bgCard+' '+border}>
                    <p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>Publish</p>
                    <h2 className={'text-2xl font-bold mb-1 '+tPri}>Visibility &amp; Channels</h2>
                    <p className={'text-sm mb-6 '+tMut}>Control where your organization and events appear.</p>
                    <div className="mb-6">
                      <h3 className={'text-xs font-bold uppercase tracking-wider mb-3 '+tTer}>Organization Page</h3>
                      <div className={'flex items-center justify-between p-5 rounded-xl border-2 transition-all '+(form.is_public?'border-green-500 bg-green-500 bg-opacity-10':(isDark?border+' '+bgSec:'border-gray-200 bg-gray-50'))}>
                        <div className="flex items-center gap-4">
                          <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 '+(form.is_public?'bg-green-500 bg-opacity-20':bgEle)} aria-hidden="true">
                            <Icon path={form.is_public?'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064':'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'} className={'h-5 w-5 '+(form.is_public?'text-green-400':tTer)}/>
                          </div>
                          <div>
                            <p className={'font-bold '+tPri}>{form.is_public?'Page is Public':'Page is Private'}</p>
                            <p className={'text-sm '+tMut}>{form.is_public?'Anyone can find and view your public page':'Your page is hidden from the public'}</p>
                          </div>
                        </div>
                        <Toggle checked={form.is_public} onChange={function(){setForm(function(prev){return Object.assign({},prev,{is_public:!prev.is_public});});}} label={form.is_public?'Make page private':'Make page public'} id="pub-tgl" d={isDark}/>
                      </div>
                    </div>
                    <div>
                      <h3 className={'text-xs font-bold uppercase tracking-wider mb-3 '+tTer}>Event Publish Channels</h3>
                      <p className={'text-xs mb-4 '+tTer}>Org-level defaults — individual events can override these.</p>
                      <div className="space-y-3">
                        {[
                          {key:'website', label:'Org Website', desc:'Events appear on your public organization page', icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', ac:'text-blue-400', ab:'bg-blue-500 bg-opacity-20', abr:'border-blue-500 border-opacity-40'},
                          {key:'discovery', label:'Syndicade Discovery', desc:'Events appear on the public Syndicade discovery page', icon:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', ac:'text-purple-400', ab:'bg-purple-500 bg-opacity-20', abr:'border-purple-500 border-opacity-40'},
                        ].map(function(ch){
                          var on=form.publish_channels[ch.key];
                          return (
                            <div key={ch.key} className={'flex items-center justify-between p-4 rounded-xl border transition-all '+(on?ch.abr+' '+ch.ab:(isDark?border+' '+bgSec:'border-gray-200 bg-gray-50'))}>
                              <div className="flex items-center gap-3">
                                <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 '+(on?ch.ab:bgEle)} aria-hidden="true"><Icon path={ch.icon} className={'h-4 w-4 '+(on?ch.ac:tTer)}/></div>
                                <div><p className={'font-semibold text-sm '+tPri}>{ch.label}</p><p className={'text-xs '+tMut}>{ch.desc}</p></div>
                              </div>
                              <Toggle checked={on} onChange={function(){setPC(ch.key,!on);}} label={(on?'Disable ':'Enable ')+ch.label+' channel'} id={'ch-'+ch.key} d={isDark}/>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Domain & Branding */}
                  <div className={'rounded-xl border shadow-sm p-6 '+bgCard+' '+border}>
                    <p className={'text-xs font-bold uppercase tracking-[4px] mb-1 '+tYel}>Domain &amp; Branding</p>
                    <h2 className={'text-xl font-bold mb-1 '+tPri}>Custom Domain &amp; Branding</h2>
                    <p className={'text-sm mb-5 '+tMut}>Control how your organization appears on the web.</p>
                    {/* Custom Domain */}
                    <div className={'rounded-xl border-2 p-5 mb-4 '+(plan==='pro'?'border-green-500 border-opacity-40 bg-green-500 bg-opacity-5':(isDark?border:' border-gray-200')+' '+bgSec)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 '+(plan==='pro'?'bg-green-500 bg-opacity-20':bgEle)}><Icon path="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" className={'h-5 w-5 '+(plan==='pro'?'text-green-400':tMut)}/></div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className={'font-semibold '+tPri}>Custom Domain</p>
                              {plan==='pro'&&<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 bg-opacity-20 text-green-400"><Icon path="M5 13l4 4L19 7" className="h-3 w-3"/>Included on Pro</span>}
                              {plan==='growth'&&<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 bg-opacity-20 text-blue-400">Add-on — $50/year</span>}
                              {plan==='starter'&&<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500 bg-opacity-20 text-purple-400"><Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="h-3 w-3"/>Available on Growth</span>}
                            </div>
                            <p className={'text-sm '+tMut}>Connect a domain you own instead of yourorg.syndicade.com.</p>
                          </div>
                        </div>
                        {plan==='pro'&&<button className={'px-4 py-2 text-sm font-semibold rounded-lg border flex-shrink-0 '+(isDark?border+' '+tSec+' hover:bg-[#1E2845]':'border-gray-200 text-gray-700 hover:bg-gray-50')}>Configure</button>}
                        {plan==='growth'&&<button onClick={function(){navigate('/organizations/'+organizationId+'/billing');}} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0">Add Domain</button>}
                        {plan==='starter'&&<button onClick={function(){navigate('/organizations/'+organizationId+'/billing');}} className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-500 text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0">Upgrade</button>}
                      </div>
                    </div>
                    {/* Remove Branding */}
                    <div className={'rounded-xl border-2 p-5 '+(plan==='pro'?'border-green-500 border-opacity-40 bg-green-500 bg-opacity-5':(isDark?border:' border-gray-200')+' '+bgSec)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 '+(plan==='pro'?'bg-green-500 bg-opacity-20':bgEle)}><Icon path="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className={'h-5 w-5 '+(plan==='pro'?'text-green-400':tMut)}/></div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className={'font-semibold '+tPri}>Remove Syndicade Branding</p>
                              {plan==='pro'&&<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 bg-opacity-20 text-green-400"><Icon path="M5 13l4 4L19 7" className="h-3 w-3"/>Included on Pro</span>}
                              {plan==='growth'&&<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 bg-opacity-20 text-blue-400">Add-on — $10/mo or $99/yr</span>}
                              {plan==='starter'&&<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500 bg-opacity-20 text-purple-400"><Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="h-3 w-3"/>Available on Growth</span>}
                            </div>
                            <p className={'text-sm '+tMut}>Remove "Powered by Syndicade" from your public page footer.</p>
                          </div>
                        </div>
                        {plan==='pro'&&<span className={'px-4 py-2 text-sm font-semibold rounded-lg border flex-shrink-0 '+(isDark?border+' '+tSec:'border-gray-200 text-gray-500')}>Active</span>}
                        {plan==='growth'&&<button onClick={function(){navigate('/organizations/'+organizationId+'/billing');}} className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0">Remove Branding</button>}
                        {plan==='starter'&&<button onClick={function(){navigate('/organizations/'+organizationId+'/billing');}} className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-500 text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0">Upgrade</button>}
                      </div>
                    </div>
                  </div>

                  {org&&org.slug&&(
                    <div className={'rounded-xl border p-5 '+(isDark?'bg-blue-500 bg-opacity-5 border-blue-500 border-opacity-20':'bg-blue-50 border-blue-200')}>
                      <p className={'text-sm font-semibold mb-2 '+(isDark?'text-blue-300':'text-blue-900')}>Your Public URL</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <code className={'rounded-lg px-3 py-2 text-blue-400 text-sm font-mono break-all flex-1 border '+(isDark?'bg-[#0E1523] border-blue-500 border-opacity-20':'bg-white border-blue-200')}>{window.location.origin+'/org/'+org.slug}</code>
                        <a href={'/org/'+org.slug} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0" aria-label="Open public page in new tab">Open Page</a>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </main>
          </div>
        </div>

        {/* Live Preview */}
        {previewOpen&&(
          <div ref={previewPanelRef} className={'flex-1 overflow-hidden flex flex-col border-l '+(isDark?'bg-[#1A2035] border-[#2A3550]':'bg-gray-200 border-gray-300')} aria-label="Live preview" role="region">
            <div className={'flex items-center justify-between px-4 py-2 border-b flex-shrink-0 '+(isDark?'bg-[#151B2D] border-[#2A3550]':'bg-gray-100 border-gray-300')}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5" aria-hidden="true"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
                <span className={'text-xs font-semibold uppercase tracking-widest ml-2 '+tTer}>Live Preview</span>
              </div>
              <span className={'text-xs '+tTer}>Updates instantly as you edit</span>
            </div>
            <div className="flex-1 overflow-hidden p-3" style={{position:'relative'}}>
              <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg flex flex-col" style={{position:'relative'}}>
                {siteBlocks.length>0&&(function(){
                  var pp=sitePages.filter(function(p){return p.is_enabled&&p.page_key&&!p.page_key.startsWith('external-');});
                  var aid=previewPageId||(pp.length>0?pp[0].id:null);
                  if (pp.length<=1) return null;
                  return (
                    <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto flex-shrink-0" role="tablist" aria-label="Preview pages">
                      {pp.map(function(page){
                        var isA=aid===page.id;
                        return (<button key={page.id} role="tab" aria-selected={isA} onClick={function(){setPreviewPageId(page.id);}} className={'px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 '+(isA?'bg-blue-500 text-white':'text-gray-500 hover:bg-gray-200')}>{page.title}</button>);
                      })}
                    </div>
                  );
                })()}
                <div className="flex-1 overflow-hidden" style={{position:'relative'}}>
                  <div style={{width:PREVIEW_WIDTH+'px',transform:'scale('+previewScale+')',transformOrigin:'top left',pointerEvents:'none',userSelect:'none'}}>
                    {siteBlocks.length>0?(
                      <PreviewNewPage org={pOrg} pages={sitePages} blocks={siteBlocks}
                        primary={form.theme.customColors[0]||form.theme.primaryColor||'#3B82F6'}
                        borderRadius={form.theme.buttonStyle==='pill'?'9999px':form.theme.buttonStyle==='sharp'?'0px':'8px'}
                        fontFamily={form.theme.fontPairing==='serif'?'Georgia,serif':form.theme.fontPairing==='mono'?'"Roboto Slab",Georgia,serif':'Inter,system-ui,sans-serif'}
                        activePageId={previewPageId}/>
                    ):(
                      <>
                        {form.template==='classic'&&<ClassicTemplate {...pTP}/>}
                        {form.template==='modern'&&<ModernTemplate {...pTP}/>}
                        {form.template==='banner'&&<BannerTemplate {...pTP}/>}
                        {form.template==='sidebar'&&<SidebarTemplate {...pTP}/>}
                        {form.template==='featured'&&<FeaturedTemplate {...pTP}/>}
                        {!['classic','modern','banner','sidebar','featured'].includes(form.template)&&<ClassicTemplate {...pTP}/>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}