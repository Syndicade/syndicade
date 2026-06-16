import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { getContentModalTags } from '../lib/platformTags';
import TemplatePickerModal from '../components/TemplatePickerModal';
import { AlertTriangle, BookmarkIcon, BookmarkCheck, Users, RefreshCw, Globe, Lock, ChevronDown } from 'lucide-react';

// ── Light theme tokens ────────────────────────────────────────────────────────
var PAGE_BG  = '#F8FAFC';
var CARD_BG  = '#FFFFFF';
var CARD_ALT = '#F1F5F9';
var ELEVATED = '#F1F5F9';
var BDR      = '#E2E8F0';
var TEXT     = '#0E1523';
var TEXT2    = '#475569';
var MUTED    = '#64748B';
var INPUT_BG = '#F8FAFC';

var PROGRAM_TYPES = [
  'After-School Program',
  'Class / Course',
  'Distribution',
  'Job Training',
  'Support Group',
  'Training',
  'Workshop',
  'Youth Program',
  'Other',
];

var US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

var VISIBILITY_META = {
  draft:        { label: 'Draft',         color: '#64748B', bg: '#F1F5F9' },
  members_only: { label: 'Members Only',  color: '#D97706', bg: 'rgba(245,183,49,0.1)' },
  groups:       { label: 'Groups',        color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  public:       { label: 'Public',        color: '#16A34A', bg: 'rgba(34,197,94,0.1)' },
};

var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';

var EMPTY_FORM = {
  name: '', description: '', type: '', audience: '', schedule: '',
  start_date: '', end_date: '', start_time: '', end_time: '',
  location_city: '', location_state: '',
  capacity: '',
  how_to_apply: '', apply_method: 'form', apply_url: '',
  contact_name: '', contact_email: '',
  cost_type: 'free', cost_amount: '',
  status: 'active',
  requires_approval: false, registration_open: true,
  show_enrolled_public: true,
  tags: [],
  image_url: '',
  // publishing
  visibility: 'draft',
  group_ids: [],
  show_on_website: false,
  show_on_discover: false,
  is_featured: false,
  reach: 'local',
};

function formatDate(ds) {
  if (!ds) return null;
  var d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return null;
  var parts = t.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

// ── Focus trap hook ───────────────────────────────────────────────────────────
function useFocusTrap(isActive) {
  var ref = useRef(null);
  useEffect(function() {
    if (!isActive || !ref.current) return;
    var el = ref.current;
    var focusable = el.querySelectorAll(
      'button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    function trap(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    el.addEventListener('keydown', trap);
    if (first) first.focus();
    return function() { el.removeEventListener('keydown', trap); };
  }, [isActive]);
  return ref;
}

// ── SVG Icon ──────────────────────────────────────────────────────────────────
function Icon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={props.className || 'h-5 w-5'}
      style={props.style}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {Array.isArray(props.path)
        ? props.path.map(function(d, i) {
            return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={props.sw || 2} d={d} />;
          })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={props.sw || 2} d={props.path} />}
    </svg>
  );
}

var ICONS = {
  programs:    ['M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
  plus:        'M12 4v16m8-8H4',
  pencil:      ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  trash:       ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  copy:        ['M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'],
  x:           'M6 18L18 6M6 6l12 12',
  user:        'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:       ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'],
  clock:       ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  calendar:    ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
  globe:       ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  tag:         ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  grip:        'M4 6h16M4 10h16M4 14h16',
  check:       'M5 13l4 4L19 7',
  lock:        ['M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'],
  photo:       ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  dollar:      ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  upload:      ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'],
  mapPin:      ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  refresh:     ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle(props) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        position: 'relative', display: 'inline-flex',
        height: props.small ? '20px' : '22px',
        width:  props.small ? '36px' : '40px',
        flexShrink: 0, alignItems: 'center', borderRadius: '99px',
        border: 'none', cursor: props.disabled ? 'not-allowed' : 'pointer',
        background: props.checked ? (props.color || '#3B82F6') : BDR,
        opacity: props.disabled ? 0.45 : 1, transition: 'background 0.2s',
      }}
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      aria-disabled={props.disabled}
      className={'focus:outline-none focus:ring-2 focus:ring-offset-1 ' + (props.ringColor || 'focus:ring-blue-500')}
    >
      <span style={{
        display: 'inline-block',
        height: props.small ? '14px' : '16px',
        width:  props.small ? '14px' : '16px',
        borderRadius: '50%', background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transform: props.checked
          ? (props.small ? 'translateX(19px)' : 'translateX(21px)')
          : 'translateX(3px)',
        transition: 'transform 0.2s',
      }} />
    </button>
  );
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) {
  var trapRef = useFocusTrap(isOpen);
  useEffect(function() {
    if (!isOpen) return;
    function handleKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
      role="dialog" aria-modal="true" aria-labelledby="confirm-prog-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        ref={trapRef}
        style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '3px 4px 14px rgba(0,0,0,0.12)' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-prog-title" style={{ fontSize: '16px', fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>{title}</h2>
            <p style={{ fontSize: '13px', color: TEXT2, margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', border: '1px solid ' + BDR, borderRadius: '8px', background: 'transparent', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#EF4444', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">{confirmLabel || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Actions dropdown ──────────────────────────────────────────────────────────
function ActionsDropdown({ onEdit, onDuplicate, onMakeTemplate, onViewRegistrations, onDelete }) {
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function() {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function handleKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={function() { setOpen(function(v) { return !v; }); }}
        style={{ fontSize: '12px', fontWeight: 500, color: TEXT2, background: PAGE_BG, border: '0.5px solid ' + BDR, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
        aria-haspopup="true" aria-expanded={open} aria-label="Program actions">
        Actions <ChevronDown size={12} aria-hidden="true" />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: '4px', background: CARD_BG, border: '0.5px solid ' + BDR, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 10, padding: '4px 0' }} role="menu">
          <button role="menuitem" onClick={function() { setOpen(false); onEdit(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: TEXT2, background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none">Edit</button>
          <button role="menuitem" onClick={function() { setOpen(false); onDuplicate(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: TEXT2, background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none">Duplicate</button>
          <button role="menuitem" onClick={function() { setOpen(false); onMakeTemplate(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: TEXT2, background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none">Make Template</button>
          <button role="menuitem" onClick={function() { setOpen(false); onViewRegistrations(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:bg-blue-50 focus:outline-none">View Registrations</button>
          <div style={{ height: '1px', background: BDR, margin: '4px 0' }} role="separator" />
          <button role="menuitem" onClick={function() { setOpen(false); onDelete(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:bg-red-50 focus:outline-none">Delete</button>
        </div>
      )}
    </div>
  );
}

// ── PlatformTagPicker ─────────────────────────────────────────────────────────
function PlatformTagPicker({ groups, selectedTags, onChange }) {
  var [customInput, setCustomInput] = useState('');

  var allPlatformTags = groups.reduce(function(acc, g) {
    return acc.concat(g.tags);
  }, []);

  function toggleTag(tag) {
    var tags = selectedTags || [];
    var idx = tags.indexOf(tag);
    onChange(idx === -1 ? tags.concat([tag]) : tags.filter(function(t) { return t !== tag; }));
  }

  function addCustom() {
    var tag = customInput.trim();
    if (!tag) return;
    if ((selectedTags || []).indexOf(tag) === -1) {
      onChange((selectedTags || []).concat([tag]));
    }
    setCustomInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {groups.map(function(group) {
        return (
          <div key={group.label}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '3px', margin: '0 0 8px' }}>{group.label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {group.tags.map(function(tag) {
                var selected = (selectedTags || []).indexOf(tag) !== -1;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={function() { toggleTag(tag); }}
                    style={{
                      padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                      border: selected ? '1.5px solid #3B82F6' : '1px solid ' + BDR,
                      background: selected ? '#EFF6FF' : CARD_BG,
                      color: selected ? '#3B82F6' : TEXT2,
                      cursor: 'pointer',
                    }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-pressed={selected}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Custom tag input */}
      <div style={{ paddingTop: '12px', borderTop: '1px solid ' + BDR }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '3px', margin: '0 0 8px' }}>Custom Tag</p>
        <p style={{ fontSize: '11px', color: MUTED, margin: '0 0 8px' }}>Helps people find this listing on Discover pages.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={customInput}
            onChange={function(e) { setCustomInput(e.target.value); }}
            onKeyDown={function(e) {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Type a tag and press Enter"
            aria-label="Add custom tag"
            style={{ flex: 1, padding: '8px 12px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT, outline: 'none', boxSizing: 'border-box' }}
            className="focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addCustom}
            style={{ padding: '8px 14px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: TEXT2, cursor: 'pointer', whiteSpace: 'nowrap' }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected tags summary */}
      {(selectedTags || []).length > 0 && (
        <div style={{ paddingTop: '12px', borderTop: '1px solid ' + BDR }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '3px', margin: '0 0 8px' }}>Selected Tags</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(selectedTags || []).map(function(tag) {
              var isPlatform = allPlatformTags.indexOf(tag) !== -1;
              return (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                    background: isPlatform ? '#EFF6FF' : '#0E1523',
                    color: isPlatform ? '#3B82F6' : '#FFFFFF',
                    border: isPlatform ? '1px solid #BFDBFE' : 'none',
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={function() { onChange((selectedTags || []).filter(function(t) { return t !== tag; })); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: isPlatform ? '#3B82F6' : 'rgba(255,255,255,0.7)', padding: '0', lineHeight: 1, display: 'flex' }}
                    aria-label={'Remove tag ' + tag}
                    className="focus:outline-none rounded"
                  >
                    <Icon path={ICONS.x} className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={function() { onChange([]); }}
              style={{ fontSize: '11px', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: '4px' }}
              className="hover:text-red-500 focus:outline-none"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Registrations drawer ──────────────────────────────────────────────────────
function RegistrationsDrawer({ program, organizationId, onClose }) {
  var trapRef = useFocusTrap(true);
  var [registrations, setRegistrations] = useState([]);
  var [loading, setLoading]             = useState(true);
  var [editingNoteId, setEditingNoteId] = useState(null);
  var [noteText, setNoteText]           = useState('');

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  useEffect(function() { loadRegistrations(); }, [program.id]);

  async function loadRegistrations() {
    setLoading(true);
    var result = await supabase
      .from('program_registrations')
      .select('id, status, created_at, notes, user_id')
      .eq('program_id', program.id)
      .order('created_at', { ascending: false });
    if (result.error) { mascotErrorToast('Failed to load registrations.'); setLoading(false); return; }

    var rows = result.data || [];
    if (rows.length === 0) { setRegistrations([]); setLoading(false); return; }

    var userIds = rows.map(function(r) { return r.user_id; });
    var membersResult = await supabase.from('members').select('user_id, first_name, last_name').in('user_id', userIds);
    var membersMap = {};
    if (membersResult.data) {
      membersResult.data.forEach(function(m) { membersMap[m.user_id] = m.first_name + ' ' + m.last_name; });
    }
    setRegistrations(rows.map(function(r) {
      return Object.assign({}, r, { member_name: membersMap[r.user_id] || 'Unknown member' });
    }));
    setLoading(false);
  }

  async function updateStatus(regId, newStatus) {
    var authRes = await supabase.auth.getUser();
    var result = await supabase.from('program_registrations')
      .update({ status: newStatus, reviewed_by: authRes.data.user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', regId);
    if (result.error) { mascotErrorToast('Failed to update registration.'); return; }
    mascotSuccessToast(newStatus === 'enrolled' ? 'Registration approved.' : 'Registration declined.');
    loadRegistrations();
  }

  async function saveNote(regId) {
    var result = await supabase.from('program_registrations')
      .update({ notes: noteText, updated_at: new Date().toISOString() })
      .eq('id', regId);
    if (result.error) { mascotErrorToast('Failed to save note.'); return; }
    mascotSuccessToast('Note saved.');
    setEditingNoteId(null);
    loadRegistrations();
  }

  var enrolled  = registrations.filter(function(r) { return r.status === 'enrolled'; });
  var pending   = registrations.filter(function(r) { return r.status === 'pending'; });
  var declined  = registrations.filter(function(r) { return r.status === 'declined'; });
  var cancelled = registrations.filter(function(r) { return r.status === 'cancelled'; });

  function statusBadge(status) {
    var cfg = {
      enrolled:  { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', label: 'Enrolled' },
      pending:   { bg: 'rgba(245,183,49,0.15)',  color: '#B45309', label: 'Pending' },
      declined:  { bg: 'rgba(239,68,68,0.1)',    color: '#EF4444', label: 'Declined' },
      cancelled: { bg: 'rgba(100,116,139,0.1)',  color: '#64748B', label: 'Cancelled' },
    };
    var c = cfg[status] || cfg.pending;
    return <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: c.bg, color: c.color }}>{c.label}</span>;
  }

  function RegRow(props) {
    var r = props.reg;
    var isEditing = editingNoteId === r.id;
    return (
      <div style={{ background: props.highlight ? 'rgba(245,183,49,0.06)' : CARD_BG, border: '1px solid ' + (props.highlight ? 'rgba(245,183,49,0.25)' : BDR), borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{r.member_name}</p>
            <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
            {props.showActions && (
              <>
                <button onClick={function() { updateStatus(r.id, 'enrolled'); }} style={{ padding: '5px 12px', background: '#22C55E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={'Approve ' + r.member_name}>Approve</button>
                <button onClick={function() { updateStatus(r.id, 'declined'); }} style={{ padding: '5px 12px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={'Decline ' + r.member_name}>Decline</button>
              </>
            )}
            {!props.showActions && statusBadge(r.status)}
          </div>
        </div>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <textarea
              value={noteText}
              onChange={function(e) { setNoteText(e.target.value); }}
              rows={2}
              placeholder="Add a private note..."
              aria-label={'Note for ' + r.member_name}
              style={{ width: '100%', padding: '7px 10px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '12px', color: TEXT, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              className="focus:ring-2 focus:ring-blue-500"
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={function() { saveNote(r.id); }} style={{ padding: '4px 12px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Save</button>
              <button onClick={function() { setEditingNoteId(null); }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '12px', color: TEXT2, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={function() { setEditingNoteId(r.id); setNoteText(r.notes || ''); }}
            style={{ alignSelf: 'flex-start', fontSize: '11px', color: r.notes ? '#3B82F6' : MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
            className="hover:underline focus:outline-none"
            aria-label={(r.notes ? 'Edit note for ' : 'Add note for ') + r.member_name}
          >
            {r.notes ? r.notes : '+ Add note'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 55, display: 'flex', justifyContent: 'flex-end' }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-labelledby="reg-drawer-title"
    >
      <div
        ref={trapRef}
        style={{ background: CARD_BG, width: '100%', maxWidth: '480px', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + BDR, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h2 id="reg-drawer-title" style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: '0 0 2px' }}>Registrations</h2>
            <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>{program.name}</p>
          </div>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, flexShrink: 0 }} className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Close registrations">
            <Icon path={ICONS.x} className="h-5 w-5" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: BDR, borderBottom: '1px solid ' + BDR }}>
          {[
            { label: 'Enrolled', count: enrolled.length,  color: '#22C55E' },
            { label: 'Pending',  count: pending.length,   color: '#F59E0B' },
            { label: 'Declined', count: declined.length,  color: '#EF4444' },
          ].map(function(s) {
            return (
              <div key={s.label} style={{ background: CARD_BG, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '11px', color: MUTED }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 24px', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(function(i) { return <div key={i} style={{ height: '60px', background: ELEVATED, borderRadius: '8px' }} className="animate-pulse" />; })}
            </div>
          ) : registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <Users size={36} style={{ color: MUTED, margin: '0 auto 12px' }} aria-hidden="true" />
              <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>No registrations yet</p>
              <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>Members who register will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pending.length > 0 && <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 4px' }}>Needs Review</p>}
              {pending.map(function(r) { return <RegRow key={r.id} reg={r} showActions highlight />; })}
              {enrolled.length > 0 && <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '8px 0 4px' }}>Enrolled</p>}
              {enrolled.map(function(r) { return <RegRow key={r.id} reg={r} />; })}
              {(declined.length > 0 || cancelled.length > 0) && <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '8px 0 4px' }}>Other</p>}
              {declined.concat(cancelled).map(function(r) { return <div key={r.id} style={{ opacity: 0.65 }}><RegRow reg={r} /></div>; })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function MakeTemplateModal({ program, onClose, onSaved }) {
  var [name, setName] = useState(program.name);
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  async function handleSave() {
    if (!name.trim()) { toast.error('Template name is required.'); return; }
    setSaving(true);
    var payload = Object.assign({}, program, {
      name: name.trim(),
      is_template: true,
      is_public: false,
      show_on_website: false,
      show_on_discover: false,
      publish_to_discovery: false,
      is_featured: false,
      updated_at: new Date().toISOString(),
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_programs').insert(payload);
    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save template.', result.error.message); return; }
    mascotSuccessToast('Template saved!');
    onSaved();
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="tmpl-prog-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: CARD_BG, borderRadius: '14px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 id="tmpl-prog-title" style={{ fontSize: '16px', fontWeight: 800, color: TEXT, marginBottom: '6px' }}>Save as Template</h3>
        <p style={{ fontSize: '13px', color: MUTED, marginBottom: '20px' }}>This program will be saved as a reusable template for your org.</p>
        <label htmlFor="tmpl-prog-name" style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'block', marginBottom: '6px' }}>Template name</label>
        <input id="tmpl-prog-name" value={name} onChange={function(e) { setName(e.target.value); }}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT, outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
          className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: TEXT2, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrgPrograms() {
  var params         = useParams();
  var organizationId = params.organizationId;
  var navigate       = useNavigate();
  var outletCtx      = useOutletContext() || {};
  var isAdmin        = outletCtx.isAdmin === true;

  var [programs, setPrograms]           = useState([]);
  var [loading, setLoading]             = useState(true);
  var [loadError, setLoadError]         = useState(false);
  var [organization, setOrganization]   = useState(null);
  var [currentUserId, setCurrentUserId] = useState(null);
  var [orgGroups, setOrgGroups]         = useState([]);

  var [savedIds, setSavedIds]               = useState(new Set());
  var [myRegistrations, setMyRegistrations] = useState({});

  // Modal
  var [showModal, setShowModal]           = useState(false);
  var [editingProgram, setEditingProgram] = useState(null);
  var [form, setForm]                     = useState(EMPTY_FORM);
  var [saving, setSaving]                 = useState(false);
  var [activeTab, setActiveTab]           = useState('details');
  var modalTrapRef = useFocusTrap(showModal);

  // Tag groups from DB
  var [tagGroups, setTagGroups] = useState({ causeAreas: [], audience: [], activityTypes: [], languages: [] });
  // Org default tags
  var [orgDefaults, setOrgDefaults] = useState(null);

  useEffect(function() {
    getContentModalTags('program').then(function(g) { setTagGroups(g); });
  }, []);

  // Image upload
  var [imageFile, setImageFile]       = useState(null);
  var [imagePreview, setImagePreview] = useState('');
  var [uploadingImg, setUploadingImg] = useState(false);
  var imageInputRef = useRef(null);

  var [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });
  var [drawerProgram, setDrawerProgram] = useState(null);
  var [makingTemplate, setMakingTemplate] = useState(null);
  var [showTemplatePicker, setShowTemplatePicker] = useState(false);
  var [templateBanner, setTemplateBanner] = useState(null);

  // Drag & drop
  var [draggingId, setDraggingId]   = useState(null);
  var [dragOverId, setDragOverId]   = useState(null);
  var [savingOrder, setSavingOrder] = useState(false);

  // Filters
  var [statusFilter, setStatusFilter] = useState('all');
  var [sortBy, setSortBy]             = useState('custom');
  var [searchQuery, setSearchQuery]   = useState('');

  function openConfirm(title, message, confirmLabel, onConfirmFn) {
    setConfirmModal({ open: true, title, message, confirmLabel, onConfirm: onConfirmFn });
  }
  function closeConfirm() {
    setConfirmModal({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });
  }

  useEffect(function() { init(); }, [organizationId]);

  useEffect(function() {
    if (!showModal) return;
    function handleKey(e) { if (e.key === 'Escape') setShowModal(false); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [showModal]);

  async function init() {
    setLoadError(false);
    setLoading(true);
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { navigate('/login'); return; }
      setCurrentUserId(authResult.data.user.id);

      var orgResult = await supabase
        .from('organizations')
        .select('id, name, logo_url, tag_defaults')
        .eq('id', organizationId)
        .single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);
      setOrgDefaults(orgResult.data.tag_defaults || null);

      var groupsResult = await supabase
        .from('org_groups')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');
      setOrgGroups(groupsResult.data || []);

      await Promise.all([
        fetchPrograms(),
        fetchSaves(authResult.data.user.id),
        fetchMyRegistrations(authResult.data.user.id),
      ]);
    } catch (err) {
      console.error('OrgPrograms init error:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrograms() {
    var result = await supabase
      .from('org_programs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order')
      .order('created_at');
    if (result.error) throw result.error;
    setPrograms(result.data || []);
  }

  async function fetchSaves(uid) {
    var result = await supabase.from('program_saves').select('program_id').eq('user_id', uid);
    if (result.error) return;
    setSavedIds(new Set((result.data || []).map(function(r) { return r.program_id; })));
  }

  async function fetchMyRegistrations(uid) {
    var result = await supabase
      .from('program_registrations')
      .select('program_id, id, status')
      .eq('user_id', uid)
      .eq('organization_id', organizationId);
    if (result.error) return;
    var map = {};
    (result.data || []).forEach(function(r) { map[r.program_id] = r; });
    setMyRegistrations(map);
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  function handleImageSelect(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return; }
    setImageFile(file);
    var reader = new FileReader();
    reader.onload = function(ev) { setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview('');
    setField('image_url', '');
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  async function uploadImage(programId) {
    if (!imageFile) return form.image_url || null;
    setUploadingImg(true);
    var ext  = imageFile.name.split('.').pop();
    var path = 'program-images/' + programId + '.' + ext;
    var res  = await supabase.storage.from('program-images').upload(path, imageFile, { upsert: true });
    setUploadingImg(false);
    if (res.error) { mascotErrorToast('Image upload failed.', res.error.message); return form.image_url || null; }
    var pub = supabase.storage.from('program-images').getPublicUrl(path);
    return pub.data.publicUrl;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openNew() {
    setEditingProgram(null);
    setForm(EMPTY_FORM);
    setActiveTab('details');
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  }

  function openEdit(program) {
    setEditingProgram(program);
    setForm({
      name:              program.name || '',
      description:       program.description || '',
      type:              program.type || '',
      audience:          program.audience || '',
      schedule:          program.schedule || '',
      start_date:        program.start_date || '',
      end_date:          program.end_date || '',
      start_time:        program.start_time || '',
      end_time:          program.end_time || '',
      location_city:     program.location_city || '',
      location_state:    program.location_state || '',
      capacity:          program.capacity != null ? String(program.capacity) : '',
      how_to_apply:      program.how_to_apply || '',
      apply_method:      program.apply_method || 'form',
      apply_url:         program.apply_url || '',
      contact_name:      program.contact_name || '',
      contact_email:     program.contact_email || '',
      cost_type:         program.cost_type || 'free',
      cost_amount:       program.cost_amount != null ? String(program.cost_amount) : '',
      status:            program.status || 'active',
      requires_approval: program.requires_approval === true,
      registration_open: program.registration_open !== false,
      show_enrolled_public: program.show_enrolled_public !== false,
      tags:              program.tags || [],
      image_url:         program.image_url || '',
      // publishing
      visibility:        program.visibility || (program.is_public ? 'public' : 'draft'),
      group_ids:         program.group_ids || [],
      show_on_website:   program.show_on_website === true,
      show_on_discover:  program.show_on_discover === true,
      is_featured:       program.is_featured === true,
      reach:             program.reach || 'local',
    });
    setActiveTab('details');
    setImageFile(null);
    setImagePreview(program.image_url || '');
    setShowModal(true);
  }

  function handleTemplateSelect(template, name) {
  setShowTemplatePicker(false);
  setEditingProgram(null);
  setForm(Object.assign({}, EMPTY_FORM, {
    name:              template.name || '',
    description:       template.description || '',
    type:              template.type || '',
    audience:          template.audience || '',
    schedule:          template.schedule || '',
    cost_type:         template.cost_type || 'free',
    requires_approval: template.requires_approval || false,
    registration_open: template.registration_open !== false,
    apply_method:      template.apply_method || 'form',
    tags:              template.tags || [],
    reach:             template.reach || 'local',
  }));
  setTemplateBanner(name);
  setActiveTab('details');
  setImageFile(null);
  setImagePreview('');
  setShowModal(true);
}

  function applyDefaultTags() {
    if (!orgDefaults || !orgDefaults.program) return;
    var defaults = orgDefaults.program || [];
    setForm(function(prev) {
      var merged = (prev.tags || []).slice();
      defaults.forEach(function(tag) {
        if (merged.indexOf(tag) === -1) merged.push(tag);
      });
      return Object.assign({}, prev, { tags: merged });
    });
    mascotSuccessToast('Default tags applied.');
  }

  function buildPayload(safeForm, imageUrl) {
    return {
      organization_id:      organizationId,
      name:                 safeForm.name.trim(),
      description:          safeForm.description || null,
      type:                 safeForm.type || null,
      audience:             safeForm.audience || null,
      schedule:             safeForm.schedule || null,
      start_date:           safeForm.start_date || null,
      end_date:             safeForm.end_date || null,
      start_time:           safeForm.start_time || null,
      end_time:             safeForm.end_time || null,
      location_city:        safeForm.location_city || null,
      location_state:       safeForm.location_state || null,
      capacity:             safeForm.capacity !== '' ? parseInt(safeForm.capacity, 10) : null,
      how_to_apply:         safeForm.how_to_apply || null,
      apply_method:         safeForm.apply_method || 'form',
      apply_url:            safeForm.apply_url || null,
      contact_name:         safeForm.contact_name || null,
      contact_email:        safeForm.contact_email || null,
      cost_type:            safeForm.cost_type,
      cost_amount:          safeForm.cost_type !== 'free' && safeForm.cost_amount !== '' ? parseFloat(safeForm.cost_amount) : null,
      status:               safeForm.status,
      requires_approval:    safeForm.requires_approval,
      registration_open:    safeForm.registration_open,
      show_enrolled_public: safeForm.show_enrolled_public,
      tags:                 safeForm.tags || [],
      image_url:            imageUrl,
      // new publishing columns
      group_ids:            safeForm.group_ids || [],
      show_on_website:      safeForm.show_on_website,
      show_on_discover:     safeForm.show_on_discover,
      is_featured:          safeForm.is_featured,
      reach:                safeForm.reach || 'local',
      // keep legacy columns in sync
      is_public:            safeForm.visibility !== 'draft',
      publish_to_discovery: safeForm.show_on_discover,
      updated_at:           new Date().toISOString(),
    };
  }

  async function saveProgram(asDraft) {
    if (!form.name.trim()) { toast.error('Program name is required.'); return; }
    setSaving(true);

    var safeForm = Object.assign({}, form);
    if (asDraft) safeForm.visibility = 'draft';

    var isNew = !editingProgram;
    var programId = editingProgram ? editingProgram.id : null;
    var imageUrl  = form.image_url || null;

    // New program: insert first to get ID for image path
    if (isNew && imageFile) {
      var initPayload = buildPayload(safeForm, null);
      var initRes = await supabase.from('org_programs').insert(initPayload).select('id').single();
      if (initRes.error) { setSaving(false); mascotErrorToast('Failed to save program.', 'Check your connection and try again.'); return; }
      programId = initRes.data.id;
      imageUrl  = await uploadImage(programId);
      await supabase.from('org_programs').update({ image_url: imageUrl }).eq('id', programId);
      setSaving(false);
      mascotSuccessToast(asDraft ? 'Program saved as draft.' : 'Program created!');
      setShowModal(false);
      fetchPrograms();
      if (!asDraft && safeForm.visibility !== 'draft') notifyNewProgram(safeForm.name.trim());
      return;
    }

    if (imageFile) {
      imageUrl = await uploadImage(editingProgram ? editingProgram.id : programId);
    }

    var payload = buildPayload(safeForm, imageUrl);

    var result = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);

    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save program.', 'Check your connection and try again.'); return; }

    mascotSuccessToast(
      asDraft ? 'Program saved as draft.' :
      editingProgram ? 'Program updated!' : 'Program created!'
    );
    setShowModal(false);
    fetchPrograms();
    if (!editingProgram && !asDraft && safeForm.visibility !== 'draft') notifyNewProgram(safeForm.name.trim());
  }

  async function notifyNewProgram(name) {
    try {
      var notifModule = await import('../lib/notificationService');
      var authRes = await supabase.auth.getUser();
      await notifModule.notifyOrganizationMembers({
        organizationId: organizationId,
        type: 'new_program',
        title: name,
        message: (organization ? organization.name : 'Your organization') + ' added a new program.',
        link: '/organizations/' + organizationId + '/programs',
        excludeUserId: authRes.data.user ? authRes.data.user.id : null,
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch(ne) { console.error('Program notification failed:', ne); }
  }

  function deleteProgram(id, name) {
    openConfirm(
      'Delete "' + name + '"?',
      'This program will be permanently deleted and cannot be recovered.',
      'Delete Program',
      async function() {
        closeConfirm();
        var result = await supabase.from('org_programs').delete().eq('id', id);
        if (result.error) { mascotErrorToast('Failed to delete program.', result.error.message); return; }
        mascotSuccessToast('Program deleted.');
        fetchPrograms();
      }
    );
  }

  async function copyProgram(program) {
    var payload = Object.assign({}, program, {
      id: undefined,
      name: program.name + ' (Copy)',
      is_public: false,
      publish_to_discovery: false,
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      sort_order: programs.length,
      updated_at: new Date().toISOString(),
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_programs').insert(payload);
    if (result.error) { mascotErrorToast('Failed to copy program.', result.error.message); return; }
    mascotSuccessToast('Program copied — it is saved as a draft.');
    fetchPrograms();
  }

  // ── Bookmark ──────────────────────────────────────────────────────────────
  async function toggleSave(e, programId) {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) return;
    var isSaved = savedIds.has(programId);
    if (isSaved) {
      var r = await supabase.from('program_saves').delete().eq('program_id', programId).eq('user_id', currentUserId);
      if (r.error) { mascotErrorToast('Failed to remove bookmark.'); return; }
      setSavedIds(function(prev) { var next = new Set(prev); next.delete(programId); return next; });
    } else {
      var r2 = await supabase.from('program_saves').insert({ program_id: programId, user_id: currentUserId });
      if (r2.error) { mascotErrorToast('Failed to save program.'); return; }
      setSavedIds(function(prev) { var next = new Set(prev); next.add(programId); return next; });
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────
  async function handleRegister(e, program) {
    e.preventDefault(); e.stopPropagation();
    if (!currentUserId) { navigate('/login'); return; }

    if (program.cost_type === 'paid' && program.cost_amount && parseFloat(program.cost_amount) > 0) {
      var orgResult = await supabase.from('organizations').select('stripe_connect_account_id, stripe_connect_status').eq('id', organizationId).single();
      var hasConnect = orgResult.data && orgResult.data.stripe_connect_account_id && orgResult.data.stripe_connect_status === 'active';
      if (!hasConnect) { toast.error('This program cannot accept payments right now.'); return; }
      try {
        var authRes = await supabase.auth.getSession();
        var token = authRes.data.session ? authRes.data.session.access_token : '';
        var res = await fetch(SUPABASE_URL + '/functions/v1/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            type: 'program', program_id: program.id, organization_id: organizationId,
            success_url: window.location.origin + '/organizations/' + organizationId + '/programs/' + program.id + '?payment=success',
            cancel_url:  window.location.origin + '/organizations/' + organizationId + '/programs/' + program.id + '?payment=cancelled',
          }),
        });
        var data = await res.json();
        if (!res.ok || !data.url) { mascotErrorToast('Could not start checkout.', data.error || 'Please try again.'); return; }
        window.location.href = data.url;
        return;
      } catch(err) {
        mascotErrorToast('Checkout failed.', 'Check your connection and try again.');
        return;
      }
    }

    var countRes = await supabase.from('program_registrations').select('id', { count: 'exact', head: true }).eq('program_id', program.id).eq('status', 'enrolled');
    var cap = program.capacity;
    if (cap != null && countRes.count >= cap) { toast.error('This program is full.'); return; }
    var status = program.requires_approval ? 'pending' : 'enrolled';
    var result = await supabase.from('program_registrations').insert({
      program_id: program.id, user_id: currentUserId, organization_id: organizationId,
      status: status, payment_status: 'not_required',
    });
    if (result.error) {
      if (result.error.code === '23505') { toast.error('You are already registered.'); return; }
      mascotErrorToast('Registration failed.', 'Please try again.');
      return;
    }
    setMyRegistrations(function(prev) {
      var next = Object.assign({}, prev);
      next[program.id] = { program_id: program.id, status: status };
      return next;
    });
    mascotSuccessToast(
      status === 'enrolled' ? 'Registered!' : 'Request submitted!',
      status === 'enrolled' ? 'You are now enrolled in ' + program.name + '.' : 'Your registration is pending approval.'
    );
    try {
      var notifModule = await import('../lib/notificationService');
      var authRes2 = await supabase.auth.getUser();
      var membersRes = await supabase.from('members').select('first_name, last_name').eq('user_id', authRes2.data.user.id).single();
      var memberName = membersRes.data ? membersRes.data.first_name + ' ' + membersRes.data.last_name : 'A member';
      await notifModule.notifyOrgAdmins({ organizationId, type: 'program_registration', title: program.name, message: memberName + (status === 'enrolled' ? ' registered for ' : ' requested to join ') + program.name + '.', link: '/organizations/' + organizationId + '/programs', excludeUserId: currentUserId });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch(ne) { console.error('Registration notification failed:', ne); }
  }

  async function handleCancelRegistration(e, program) {
    e.preventDefault(); e.stopPropagation();
    var reg = myRegistrations[program.id];
    if (!reg) return;
    openConfirm(
      'Cancel registration?',
      'You will be removed from ' + program.name + '. You can re-register later if spots are available.',
      'Cancel Registration',
      async function() {
        closeConfirm();
        var result = await supabase.from('program_registrations').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', reg.id);
        if (result.error) { mascotErrorToast('Failed to cancel registration.'); return; }
        setMyRegistrations(function(prev) { var next = Object.assign({}, prev); delete next[program.id]; return next; });
        mascotSuccessToast('Registration cancelled.');
      }
    );
  }

  function setField(key, value) {
    setForm(function(prev) {
      var update = {};
      update[key] = value;
      if (key === 'cost_type' && value === 'free') update.cost_amount = '';
      if (key === 'visibility' && value !== 'groups') update.group_ids = [];
      return Object.assign({}, prev, update);
    });
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function handleDragStart(id, e) { setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); }
  function handleDragOver(id, e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverId !== id) setDragOverId(id); }
  function handleDrop(targetId) {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    var fromIdx = programs.findIndex(function(p) { return p.id === draggingId; });
    var toIdx   = programs.findIndex(function(p) { return p.id === targetId; });
    var arr     = programs.slice();
    var moved   = arr.splice(fromIdx, 1)[0];
    arr.splice(toIdx, 0, moved);
    var updated = arr.map(function(p, i) { return Object.assign({}, p, { sort_order: i }); });
    setPrograms(updated);
    setDraggingId(null);
    setDragOverId(null);
    saveSortOrder(updated);
  }

  async function saveSortOrder(ordered) {
    setSavingOrder(true);
    var promises = ordered.map(function(p, i) { return supabase.from('org_programs').update({ sort_order: i }).eq('id', p.id); });
    var results = await Promise.all(promises);
    setSavingOrder(false);
    if (results.some(function(r) { return r.error; })) { toast.error('Failed to save order — try again'); }
    else { mascotSuccessToast('Order saved.'); }
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  var isDragEnabled = isAdmin && sortBy === 'custom' && statusFilter === 'all' && !searchQuery.trim();

  var statusCounts = {
    all:      programs.length,
    active:   programs.filter(function(p) { return p.status === 'active'; }).length,
    upcoming: programs.filter(function(p) { return p.status === 'upcoming'; }).length,
    closed:   programs.filter(function(p) { return p.status === 'closed'; }).length,
  };

  var displayPrograms = programs
    .filter(function(p) {
      if (!isAdmin && p.visibility === 'draft') return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        return p.name.toLowerCase().indexOf(q) !== -1 || (p.description || '').toLowerCase().indexOf(q) !== -1 || (p.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) !== -1; });
      }
      return true;
    })
    .slice()
    .sort(function(a, b) {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'start_date') {
        if (!a.start_date && !b.start_date) return 0;
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date < b.start_date ? -1 : 1;
      }
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

  var inputStyle = {
    width: '100%', padding: '8px 12px', background: INPUT_BG,
    border: '1px solid ' + BDR, borderRadius: '8px',
    fontSize: '14px', color: TEXT, outline: 'none', boxSizing: 'border-box',
  };
  var labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: 600,
    color: TEXT, marginBottom: '6px',
  };

  function costDisplay(program) {
    if (!program.cost_type || program.cost_type === 'free') return { label: 'Free', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (program.cost_type === 'donation') return { label: 'Donation', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' };
    var amt = program.cost_amount ? '$' + parseFloat(program.cost_amount).toFixed(2) : 'Paid';
    return { label: amt, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' };
  }

  // visibility helper — falls back gracefully for old records
  function programVisibility(p) {
    if (p.visibility) return p.visibility;
    if (p.is_public) return 'public';
    return 'draft';
  }

  // ── Tag groups for PlatformTagPicker ──────────────────────────────────────
  var pickerGroups = [
    { label: 'Cause Area',     tags: tagGroups.causeAreas    || [] },
    { label: 'Audience',       tags: tagGroups.audience      || [] },
    { label: 'Activity Type',  tags: tagGroups.activityTypes || [] },
    { label: 'Languages',      tags: tagGroups.languages     || [] },
  ].filter(function(g) { return g.tags.length > 0; });

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: PAGE_BG, padding: '32px 24px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <div style={{ height: '30px', width: '160px', background: BDR, borderRadius: '6px', marginBottom: '8px' }} className="animate-pulse" />
            <div style={{ height: '14px', width: '80px', background: ELEVATED, borderRadius: '4px' }} className="animate-pulse" />
          </div>
          <div style={{ height: '36px', width: '120px', background: BDR, borderRadius: '8px' }} className="animate-pulse" />
        </div>
        <div style={{ height: '52px', background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '10px', marginBottom: '20px' }} className="animate-pulse" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5,6].map(function(i) {
            return (
              <div key={i} style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '12px', overflow: 'hidden' }} className="animate-pulse">
                <div style={{ height: '120px', background: ELEVATED }} />
                <div style={{ padding: '16px' }}>
                  <div style={{ height: '15px', width: '60%', background: BDR, borderRadius: '4px', marginBottom: '10px' }} />
                  <div style={{ height: '12px', width: '90%', background: ELEVATED, borderRadius: '4px', marginBottom: '6px' }} />
                  <div style={{ height: '32px', background: ELEVATED, borderRadius: '8px', marginTop: '12px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '360px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={24} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: '0 0 8px' }}>Failed to load programs</h2>
          <p style={{ fontSize: '13px', color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>Something went wrong. Check your connection and try again.</p>
          <button onClick={init} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <RefreshCw size={14} aria-hidden="true" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ minHeight: '100vh', background: PAGE_BG, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: '32px 24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: TEXT, margin: 0 }}>Programs</h1>
            <p style={{ fontSize: '14px', color: MUTED, margin: '4px 0 0' }}>{programs.length + ' program' + (programs.length !== 1 ? 's' : '')}</p>
          </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={function() { setShowTemplatePicker(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'transparent', color: TEXT2, border: '1px solid ' + BDR, borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">
              Templates
            </button>
            <button
              onClick={openNew}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Icon path={ICONS.plus} className="h-4 w-4" />
              Add Program
            </button>
          </div>
        )}
        </div>

        {/* Filter bar */}
        {programs.length > 0 && (
          <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '160px' }}>
              <Icon path={ICONS.search} className="h-4 w-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
              <input
                type="text" value={searchQuery}
                onChange={function(e) { setSearchQuery(e.target.value); }}
                placeholder="Search programs..."
                aria-label="Search programs"
                style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT, outline: 'none', boxSizing: 'border-box' }}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'closed', label: 'Closed' }].map(function(f) {
                var active = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={function() { setStatusFilter(f.key); }}
                    style={{ padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: active ? '#0E1523' : ELEVATED, color: active ? '#FFFFFF' : TEXT2 }}
                    className="focus:outline-none focus:ring-2 focus:ring-slate-400"
                    aria-pressed={active}
                  >
                    {f.label} <span style={{ marginLeft: '3px', fontSize: '11px', opacity: 0.7 }}>{statusCounts[f.key]}</span>
                  </button>
                );
              })}
            </div>
            <select
              value={sortBy}
              onChange={function(e) { setSortBy(e.target.value); }}
              aria-label="Sort programs"
              style={{ padding: '6px 10px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT2, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              className="focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">Custom Order</option>
              <option value="name">Name A–Z</option>
              <option value="start_date">Start Date</option>
            </select>
            {savingOrder && <span style={{ fontSize: '12px', color: MUTED }}>Saving order...</span>}
            {isDragEnabled && !savingOrder && <span style={{ fontSize: '12px', color: MUTED }}>Drag cards to reorder</span>}
          </div>
        )}

        {/* Empty state */}
        {programs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: CARD_BG, border: '2px dashed ' + BDR, borderRadius: '12px' }} role="region" aria-label="No programs">
            <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '200px', margin: '0 auto 20px', display: 'block', mixBlendMode: 'multiply' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>No programs yet</h2>
            <p style={{ color: MUTED, fontSize: '14px', maxWidth: '280px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              {isAdmin ? 'Add your first program to share with your community.' : 'This organization has not added any programs yet.'}
            </p>
            {isAdmin && (
              <button onClick={openNew} style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Add Your First Program
              </button>
            )}
          </div>
        ) : displayPrograms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '12px' }}>
            <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '160px', margin: '0 auto 16px', display: 'block', mixBlendMode: 'multiply' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>No programs match your filters</h2>
            <p style={{ color: MUTED, fontSize: '13px', marginBottom: '16px' }}>Try adjusting your search or status filter.</p>
            <button
              onClick={function() { setSearchQuery(''); setStatusFilter('all'); }}
              style={{ padding: '8px 16px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: TEXT2, cursor: 'pointer' }}
              className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }} role="list" aria-label="Programs">
            {displayPrograms.map(function(program) {
              var cap          = program.capacity;
              var enrolled     = program.enrolled_count || 0;
              var capPct       = cap ? Math.min(100, Math.round(enrolled / cap * 100)) : null;
              var capBarColor  = capPct >= 100 ? '#EF4444' : capPct >= 75 ? '#F59E0B' : '#22C55E';
              var isClosed     = program.status === 'closed';
              var isDragging   = draggingId === program.id;
              var isDragTarget = dragOverId === program.id && draggingId !== program.id;
              var startFmt     = formatDate(program.start_date);
              var endFmt       = formatDate(program.end_date);
              var startTimeFmt = formatTime(program.start_time);
              var endTimeFmt   = formatTime(program.end_time);
              var isSaved      = savedIds.has(program.id);
              var myReg        = myRegistrations[program.id];
              var isFull       = cap != null && enrolled >= cap;
              var regOpen      = program.registration_open !== false && !isClosed;
              var cost         = costDisplay(program);
              var vis          = programVisibility(program);
              var visMeta      = VISIBILITY_META[vis] || VISIBILITY_META.draft;

              return (
                <article
                  key={program.id}
                  role="listitem"
                  aria-label={program.name + ' program'}
                  draggable={isDragEnabled}
                  onDragStart={function(e) { handleDragStart(program.id, e); }}
                  onDragOver={function(e) { handleDragOver(program.id, e); }}
                  onDrop={function(e) { e.preventDefault(); handleDrop(program.id); }}
                  onDragEnd={function() { setDraggingId(null); setDragOverId(null); }}
                  style={{
                    background:    vis === 'draft' ? CARD_ALT : CARD_BG,
                    border:        isDragTarget ? '2px solid #3B82F6' : '0.5px solid ' + BDR,
                    borderRadius:  '12px',
                    display:       'flex',
                    flexDirection: 'column',
                    position:      'relative',
                    opacity:       isClosed ? 0.7 : isDragging ? 0.4 : 1,
                    cursor:        isDragEnabled ? 'grab' : 'default',
                    transition:    'opacity 0.2s, border-color 0.15s, box-shadow 0.15s',
                  }}
                  className={isDragEnabled ? '' : 'hover:shadow-md'}
                >
                  {/* Program image */}
                  {program.image_url ? (
                    <div style={{ height: '140px', overflow: 'hidden', flexShrink: 0, borderRadius: '12px 12px 0 0' }}>
                      <img src={program.image_url} alt={program.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : null}

                  {/* Card body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 18px', flex: 1 }}>
                    {isDragEnabled && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-4px', color: MUTED, opacity: 0.4 }} aria-hidden="true">
                        <Icon path={ICONS.grip} className="h-4 w-4" />
                      </div>
                    )}

                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.3 }}>
                        <Link
                          to={'/organizations/' + organizationId + '/programs/' + program.id}
                          state={{ from: 'org-programs' }}
                          style={{ color: TEXT, textDecoration: 'none' }}
                          className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          {program.name}
                        </Link>
                      </h2>
                      {!isAdmin && (
                        <button
                          onClick={function(e) { toggleSave(e, program.id); }}
                          style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#F5B731' : MUTED, flexShrink: 0 }}
                          className={'focus:outline-none focus:ring-2 focus:ring-yellow-400 ' + (isSaved ? '' : 'hover:text-yellow-500')}
                          aria-label={isSaved ? 'Remove bookmark for ' + program.name : 'Bookmark ' + program.name}
                          aria-pressed={isSaved}
                        >
                          {isSaved ? <BookmarkCheck size={16} aria-hidden="true" /> : <BookmarkIcon size={16} aria-hidden="true" />}
                        </button>
                      )}
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: program.status === 'active' ? 'rgba(34,197,94,0.12)' : program.status === 'upcoming' ? 'rgba(59,130,246,0.12)' : 'rgba(100,116,139,0.12)', color: program.status === 'active' ? '#22C55E' : program.status === 'upcoming' ? '#3B82F6' : '#64748B' }}>
                        {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: cost.bg, color: cost.color }}>{cost.label}</span>
                      {isAdmin && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: visMeta.bg, color: visMeta.color }}>{visMeta.label}</span>
                      )}
                      {program.show_on_discover && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                          <Icon path={ICONS.globe} className="h-3 w-3" /> On Discover
                        </span>
                      )}
                      {program.requires_approval && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(100,116,139,0.1)', color: '#475569' }}>
                          <Icon path={ICONS.lock} className="h-3 w-3" /> Approval required
                        </span>
                      )}
                      {!program.registration_open && !isClosed && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Registration closed</span>
                      )}
                    </div>

                    {/* Tags */}
                    {program.tags && program.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {program.tags.map(function(tag) {
                          return <span key={tag} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: ELEVATED, color: TEXT2, border: '0.5px solid ' + BDR }}>{tag}</span>;
                        })}
                      </div>
                    )}

                    {/* Capacity bar */}
                    {cap != null && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: MUTED }}>
                            <Icon path={ICONS.users} className="h-3.5 w-3.5" /> Enrolled
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: capPct >= 100 ? '#EF4444' : TEXT2 }}>{capPct >= 100 ? 'Full' : enrolled + ' / ' + cap}</span>
                        </div>
                        <div style={{ height: '6px', background: BDR, borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: capPct + '%', height: '100%', background: capBarColor, borderRadius: '99px', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {program.description && (
                      <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {program.description}
                      </p>
                    )}

                    {/* Date + time */}
                    {(startFmt || endFmt) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                          <Icon path={ICONS.calendar} className="h-3.5 w-3.5" />
                          <span>{startFmt && endFmt ? startFmt + ' – ' + endFmt : startFmt ? 'Starts ' + startFmt : 'Ends ' + endFmt}</span>
                        </div>
                        {(startTimeFmt || endTimeFmt) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED, paddingLeft: '20px' }}>
                            <Icon path={ICONS.clock} className="h-3.5 w-3.5" />
                            <span>{startTimeFmt && endTimeFmt ? startTimeFmt + ' – ' + endTimeFmt : startTimeFmt || endTimeFmt}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location */}
                    {(program.location_city || program.location_state) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                        <Icon path={ICONS.mapPin} className="h-3.5 w-3.5" />
                        <span>{[program.location_city, program.location_state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}

                    {/* Audience / schedule */}
                    {(program.audience || program.schedule) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {program.audience && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}><Icon path={ICONS.user} className="h-3.5 w-3.5" /><span>For: {program.audience}</span></div>}
                        {program.schedule && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}><Icon path={ICONS.clock} className="h-3.5 w-3.5" /><span>{program.schedule}</span></div>}
                      </div>
                    )}
                  </div>

                  {/* Member register footer */}
                  {!isAdmin && (
                    <div style={{ margin: '0 18px 16px', paddingTop: '12px', borderTop: '1px solid ' + BDR, display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {myReg ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', background: myReg.status === 'enrolled' ? 'rgba(34,197,94,0.12)' : myReg.status === 'pending' ? 'rgba(245,183,49,0.15)' : 'rgba(100,116,139,0.1)', color: myReg.status === 'enrolled' ? '#22C55E' : myReg.status === 'pending' ? '#B45309' : '#64748B' }}>
                            {myReg.status === 'enrolled' ? 'Enrolled' : myReg.status === 'pending' ? 'Pending approval' : 'Cancelled'}
                          </span>
                          {(myReg.status === 'enrolled' || myReg.status === 'pending') && (
                            <button onClick={function(e) { handleCancelRegistration(e, program); }} style={{ fontSize: '12px', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }} className="hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400" aria-label={'Cancel registration for ' + program.name}>Cancel</button>
                          )}
                        </div>
                      ) : regOpen && !isFull ? (
                        <button onClick={function(e) { handleRegister(e, program); }} style={{ flex: 1, padding: '8px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={'Register for ' + program.name}>
                          {program.requires_approval ? 'Request to Join' : 'Register'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: MUTED, fontStyle: 'italic' }}>{isFull ? 'Program is full' : 'Registration closed'}</span>
                      )}
                    </div>
                  )}

                  {/* Admin Actions footer */}
                  {isAdmin && (
                    <div style={{ margin: '0 18px 16px', paddingTop: '12px', borderTop: '0.5px solid ' + BDR, display: 'flex', justifyContent: 'flex-end' }}>
                      <ActionsDropdown
                      onEdit={function() { openEdit(program); }}
                      onDuplicate={function() { copyProgram(program); }}
                      onMakeTemplate={function() { setMakingTemplate(program); }}
                      onViewRegistrations={function() { setDrawerProgram(program); }}
                      onDelete={function() { deleteProgram(program.id, program.name); }}
                    />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(14,21,35,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
          role="dialog" aria-modal="true" aria-labelledby="prog-modal-title"
          onClick={function() { setShowModal(false); }}
        >
          <div
            ref={modalTrapRef}
            style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '0.5px solid ' + BDR, flexShrink: 0 }}>
              <div>
                <h2 id="prog-modal-title" style={{ fontSize: '17px', fontWeight: 500, color: TEXT, margin: 0 }}>{editingProgram ? 'Edit Program' : 'Add Program'}</h2>
                {organization && <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>{organization.name}</p>}
              </div>
              <button
                onClick={function() { setShowModal(false); }}
                style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Close modal"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '0.5px solid ' + BDR, flexShrink: 0 }} role="tablist">
              {[
                { key: 'details',   label: 'Details' },
                { key: 'settings',  label: 'Settings' },
                { key: 'tags',      label: 'Audience & Tags' },
                { key: 'publishing',label: 'Publishing' },
              ].map(function(tab) {
                var active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={function() { setActiveTab(tab.key); }}
                    style={{ flex: 1, padding: '12px 8px', fontSize: '13px', fontWeight: 700, color: active ? '#3B82F6' : MUTED, background: 'none', border: 'none', borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    className="hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    role="tab"
                    aria-selected={active}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>

              {/* ── Details tab ─────────────────────────────────────────────── */}
              {activeTab === 'details' && (
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Name */}
                  <div>
                    <label htmlFor="prog-name" style={labelStyle}>
                      Program Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                    </label>
                    <input
                      id="prog-name" type="text" value={form.name}
                      onChange={function(e) { setField('name', e.target.value); }}
                      placeholder="e.g. After School Tutoring"
                      style={inputStyle}
                      className="focus:ring-2 focus:ring-blue-500"
                      aria-required="true"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="prog-desc" style={labelStyle}>Description</label>
                    <textarea
                      id="prog-desc" value={form.description} rows={4}
                      onChange={function(e) { setField('description', e.target.value); }}
                      placeholder="What does this program do?"
                      maxLength={1000}
                      style={Object.assign({}, inputStyle, { resize: 'vertical', minHeight: '80px' })}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                    <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{(form.description || '').length}/1000</p>
                  </div>

                  {/* Type */}
                  <div>
                    <label htmlFor="prog-type" style={labelStyle}>Program Type</label>
                    <select
                      id="prog-type" value={form.type}
                      onChange={function(e) { setField('type', e.target.value); }}
                      style={Object.assign({}, inputStyle, { width: '100%' })}
                      className="focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a type...</option>
                      {PROGRAM_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
                    </select>
                  </div>

                  {/* Start date/time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label htmlFor="prog-start" style={labelStyle}>Start Date</label>
                      <input id="prog-start" type="date" value={form.start_date} onChange={function(e) { setField('start_date', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor="prog-stime" style={labelStyle}>Start Time</label>
                      <input id="prog-stime" type="time" value={form.start_time} onChange={function(e) { setField('start_time', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  {/* End date/time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label htmlFor="prog-end" style={labelStyle}>End Date</label>
                      <input id="prog-end" type="date" value={form.end_date} onChange={function(e) { setField('end_date', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor="prog-etime" style={labelStyle}>End Time</label>
                      <input id="prog-etime" type="time" value={form.end_time} onChange={function(e) { setField('end_time', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  {/* Location */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label htmlFor="prog-city" style={labelStyle}>City</label>
                      <input id="prog-city" type="text" value={form.location_city} onChange={function(e) { setField('location_city', e.target.value); }} placeholder="e.g. Toledo" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor="prog-state" style={labelStyle}>State</label>
                      <select id="prog-state" value={form.location_state} onChange={function(e) { setField('location_state', e.target.value); }} style={Object.assign({}, inputStyle, { width: '100%' })} className="focus:ring-2 focus:ring-blue-500">
                        <option value="">Select...</option>
                        {US_STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                      </select>
                    </div>
                  </div>

                  {/* Cost */}
                  <div>
                    <label style={labelStyle}>Cost</label>
                    <div style={{ display: 'grid', gridTemplateColumns: form.cost_type !== 'free' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                      <select
                        value={form.cost_type}
                        onChange={function(e) { setField('cost_type', e.target.value); }}
                        style={Object.assign({}, inputStyle, { width: '100%' })}
                        className="focus:ring-2 focus:ring-blue-500"
                        aria-label="Cost type"
                      >
                        <option value="free">Free</option>
                        <option value="paid">Paid</option>
                        <option value="donation">Donation / Suggested</option>
                      </select>
                      {form.cost_type !== 'free' && (
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: '14px' }}>$</span>
                          <input
                            type="number" min="0" step="0.01" value={form.cost_amount}
                            onChange={function(e) { setField('cost_amount', e.target.value); }}
                            placeholder={form.cost_type === 'donation' ? 'Suggested amount' : 'Amount'}
                            style={Object.assign({}, inputStyle, { paddingLeft: '24px' })}
                            className="focus:ring-2 focus:ring-blue-500"
                            aria-label="Cost amount"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label htmlFor="prog-capacity" style={labelStyle}>Capacity (Max Spots)</label>
                    <input
                      id="prog-capacity" type="number" min="0" value={form.capacity}
                      onChange={function(e) { setField('capacity', e.target.value); }}
                      placeholder="Leave blank for unlimited"
                      style={inputStyle}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Who is it for */}
                  <div>
                    <label htmlFor="prog-audience" style={labelStyle}>Who Is It For?</label>
                    <input
                      id="prog-audience" type="text" value={form.audience}
                      onChange={function(e) { setField('audience', e.target.value); }}
                      placeholder="e.g. Youth ages 6–18"
                      style={inputStyle}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                    <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0' }}>Free-text description. Use the Audience &amp; Tags tab to add structured audience tags.</p>
                  </div>

                </div>
              )}

              {/* ── Settings tab ─────────────────────────────────────────────── */}
              {activeTab === 'settings' && (
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Registration */}
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'registration_open', label: 'Registration open', desc: 'Members can register or request to join' },
                        { key: 'requires_approval', label: 'Require approval', desc: form.requires_approval ? 'Registrations are held for your review before enrolling' : 'Members are enrolled automatically on registration' },
                        { key: 'show_enrolled_public', label: 'Show enrolled count publicly', desc: form.show_enrolled_public ? 'Members can see how many people are enrolled' : 'Enrollment count is hidden from non-admins' },
                      ].map(function(item) {
                        return (
                          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                            <Toggle
                              checked={form[item.key]}
                              onClick={function() { setField(item.key, !form[item.key]); }}
                              label={'Toggle ' + item.label}
                            />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>{item.label}</p>
                              <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <div>
                      <label htmlFor="prog-schedule" style={labelStyle}>Schedule / Frequency</label>
                      <input
                        id="prog-schedule" type="text" value={form.schedule}
                        onChange={function(e) { setField('schedule', e.target.value); }}
                        placeholder="e.g. Every Monday 3–5pm"
                        style={inputStyle}
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Apply method */}
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label htmlFor="prog-apply-method" style={labelStyle}>Apply Method</label>
                        <select
                          id="prog-apply-method" value={form.apply_method}
                          onChange={function(e) { setField('apply_method', e.target.value); }}
                          style={Object.assign({}, inputStyle, { width: '100%' })}
                          className="focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="form">In-platform registration form</option>
                          <option value="link">External link</option>
                        </select>
                      </div>
                      {form.apply_method === 'link' && (
                        <div>
                          <label htmlFor="prog-apply-url" style={labelStyle}>Apply URL</label>
                          <input
                            id="prog-apply-url" type="url" value={form.apply_url}
                            onChange={function(e) { setField('apply_url', e.target.value); }}
                            placeholder="https://..."
                            style={inputStyle}
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <div>
                        <label htmlFor="prog-apply-notes" style={labelStyle}>Additional Instructions</label>
                        <textarea
                          id="prog-apply-notes" value={form.how_to_apply} rows={2}
                          onChange={function(e) { setField('how_to_apply', e.target.value); }}
                          placeholder="e.g. Fill out form at front desk or call us"
                          style={Object.assign({}, inputStyle, { resize: 'none' })}
                          className="focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label htmlFor="prog-cname" style={labelStyle}>Contact Name</label>
                        <input id="prog-cname" type="text" value={form.contact_name} onChange={function(e) { setField('contact_name', e.target.value); }} placeholder="Jane Smith" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label htmlFor="prog-cemail" style={labelStyle}>Contact Email</label>
                        <input id="prog-cemail" type="email" value={form.contact_email} onChange={function(e) { setField('contact_email', e.target.value); }} placeholder="jane@org.org" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div>
                      <label htmlFor="prog-status" style={labelStyle}>Program Status</label>
                      <select
                        id="prog-status" value={form.status}
                        onChange={function(e) { setField('status', e.target.value); }}
                        style={Object.assign({}, inputStyle, { width: '100%' })}
                        className="focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Image upload — always last on Settings tab */}
                  <div>
                    <label style={labelStyle}>Program Image</label>
                    {imagePreview ? (
                      <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                        <img src={imagePreview} alt="Program preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                        <button
                          type="button" onClick={clearImage}
                          style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          className="hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
                          aria-label="Remove image"
                        >
                          <Icon path={ICONS.x} className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={function() { imageInputRef.current && imageInputRef.current.click(); }}
                        style={{ width: '100%', padding: '24px', border: '1.5px dashed ' + BDR, borderRadius: '8px', background: INPUT_BG, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: MUTED }}
                        className="hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Upload program image"
                      >
                        <Icon path={ICONS.upload} className="h-8 w-8" />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Click to upload image</span>
                        <span style={{ fontSize: '11px' }}>JPG, PNG, WebP or GIF · max 5 MB</span>
                      </button>
                    )}
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleImageSelect} aria-label="Program image file input" />
                  </div>

                </div>
              )}

              {/* ── Audience & Tags tab ──────────────────────────────────────── */}
              {activeTab === 'tags' && (
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Default tags banner */}
                  {orgDefaults && orgDefaults.program && orgDefaults.program.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '8px' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>Your org has default program tags</p>
                        <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>{orgDefaults.program.slice(0, 3).join(', ')}{orgDefaults.program.length > 3 ? ' +' + (orgDefaults.program.length - 3) + ' more' : ''}</p>
                      </div>
                      <button
                        type="button"
                        onClick={applyDefaultTags}
                        style={{ padding: '6px 12px', background: '#F5B731', color: '#0E1523', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        className="hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        Use default tags
                      </button>
                    </div>
                  )}

                  <PlatformTagPicker
                    groups={pickerGroups}
                    selectedTags={form.tags}
                    onChange={function(tags) { setField('tags', tags); }}
                  />

                </div>
              )}

              {/* ── Publishing tab ───────────────────────────────────────────── */}
              {activeTab === 'publishing' && (
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Section 1: Visibility */}
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="radiogroup" aria-label="Visibility">
                      {[
                        { value: 'draft',        label: 'Draft',          desc: 'Only visible to org admins' },
                        { value: 'members_only', label: 'All Members',    desc: 'All active org members' },
                        { value: 'groups',       label: 'Specific Groups',desc: 'Only members of selected groups' },
                        { value: 'public',       label: 'Public',         desc: 'Anyone can see this' },
                      ].map(function(opt) {
                        var selected = form.visibility === opt.value;
                        return (
                          <div key={opt.value}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={function() { setField('visibility', opt.value); }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '12px 14px',
                                background: selected ? '#EFF6FF' : CARD_BG,
                                border: selected ? '1.5px solid #3B82F6' : '1px solid ' + BDR,
                                borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '12px',
                              }}
                              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: selected ? '5px solid #3B82F6' : '2px solid ' + BDR, flexShrink: 0, background: CARD_BG }} />
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>{opt.label}</p>
                                <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>{opt.desc}</p>
                              </div>
                            </button>

                            {/* Group picker */}
                            {opt.value === 'groups' && selected && (
                              <div style={{ marginTop: '8px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                                <label htmlFor="prog-groups" style={Object.assign({}, labelStyle, { marginBottom: '6px' })}>Select groups</label>
                                {orgGroups.length === 0 ? (
                                  <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>No groups found. Create groups first in your org settings.</p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {orgGroups.map(function(g) {
                                      var checked = (form.group_ids || []).indexOf(g.id) !== -1;
                                      return (
                                        <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: TEXT }}>
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={function() {
                                              var ids = form.group_ids || [];
                                              setField('group_ids', checked ? ids.filter(function(id) { return id !== g.id; }) : ids.concat([g.id]));
                                            }}
                                            className="focus:ring-2 focus:ring-blue-500"
                                          />
                                          {g.name}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Also show on */}
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'show_on_website',  label: 'Org website',       desc: 'Appears on your public organization page' },
                        { key: 'show_on_discover', label: 'Discover page',      desc: 'Public listing at /discover' },
                        { key: 'is_featured',      label: 'Feature this listing', desc: 'Highlighted border and Featured badge' },
                      ].map(function(item) {
                        return (
                          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                            <Toggle
                              checked={form[item.key]}
                              onClick={function() { setField(item.key, !form[item.key]); }}
                              label={'Toggle ' + item.label}
                              color="#3B82F6"
                            />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>{item.label}</p>
                              <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Reach */}
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="radiogroup" aria-label="Reach">
                      {[
                        { value: 'local',    label: 'Local',             desc: 'City or region' },
                        { value: 'state',    label: 'Statewide',         desc: 'Available across the state' },
                        { value: 'national', label: 'National / Remote', desc: 'Available nationwide or online' },
                      ].map(function(opt) {
                        var selected = form.reach === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={function() { setField('reach', opt.value); }}
                            style={{
                              width: '100%', textAlign: 'left', padding: '10px 14px',
                              background: selected ? '#EFF6FF' : CARD_BG,
                              border: selected ? '1.5px solid #3B82F6' : '1px solid ' + BDR,
                              borderRadius: '8px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '12px',
                            }}
                            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: selected ? '4px solid #3B82F6' : '2px solid ' + BDR, flexShrink: 0, background: CARD_BG }} />
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{opt.label}</span>
                              <span style={{ fontSize: '12px', color: MUTED, marginLeft: '6px' }}>{opt.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notification note */}
                  <p style={{ fontSize: '12px', color: MUTED, margin: 0, padding: '10px 12px', background: ELEVATED, borderRadius: '6px', border: '1px solid ' + BDR }}>
                    Members are notified once when you first publish. Changing between published states does not re-notify.
                  </p>

                </div>
              )}

            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderTop: '0.5px solid ' + BDR, flexShrink: 0, gap: '8px' }}>
              {/* Left: Save as Draft — only when creating new */}
              {!editingProgram && (
                <button
                  onClick={function() { saveProgram(true); }}
                  disabled={saving || uploadingImg}
                  style={{ padding: '10px 16px', border: '1px solid ' + BDR, color: TEXT2, fontSize: '14px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: (saving || uploadingImg) ? 'not-allowed' : 'pointer', opacity: (saving || uploadingImg) ? 0.6 : 1 }}
                  className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Save as Draft
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={function() { setShowModal(false); }}
                style={{ padding: '10px 16px', border: '1px solid ' + BDR, color: TEXT2, fontSize: '14px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
                className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={function() { saveProgram(false); }}
                disabled={saving || uploadingImg}
                style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: (saving || uploadingImg) ? 'not-allowed' : 'pointer', opacity: (saving || uploadingImg) ? 0.6 : 1 }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uploadingImg ? 'Uploading...' : saving ? 'Saving...' : (editingProgram ? 'Save Changes' : 'Post Program')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplatePicker && (
      <TemplatePickerModal
        contentType="program"
        organizationId={organizationId}
        onClose={function() { setShowTemplatePicker(false); }}
        onSelect={handleTemplateSelect}
      />
    )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm || function() {}}
        onCancel={closeConfirm}
      />

      {drawerProgram && (
        <RegistrationsDrawer
          program={drawerProgram}
          organizationId={organizationId}
          onClose={function() { setDrawerProgram(null); }}
        />
      )}
      {makingTemplate && (
      <MakeTemplateModal program={makingTemplate} onClose={function() { setMakingTemplate(null); }} onSaved={fetchPrograms} />
    )}
    </>
  );
}

export default OrgPrograms;