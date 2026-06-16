import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import TemplatePickerModal from '../components/TemplatePickerModal';
import { getContentModalTags } from '../lib/platformTags';
import {
  Briefcase, Plus, X, ChevronDown, Users, Globe, Lock,
  AlertCircle, CheckCircle, Search,
  Upload, DollarSign, Paperclip, Inbox, Tag, Sparkles
} from 'lucide-react';

// ── Tokens ────────────────────────────────────────────────────────────────────
var pageBg        = '#F8FAFC';
var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var elevatedBg    = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';
var textTertiary  = '#94A3B8';

// ── Constants ─────────────────────────────────────────────────────────────────
var COMPENSATION_TYPES = [
  { value: 'paid',    label: 'Paid' },
  { value: 'unpaid',  label: 'Unpaid / Volunteer' },
  { value: 'stipend', label: 'Stipend' },
];

var LOCATION_TYPES = [
  { value: 'in_person', label: 'In-Person' },
  { value: 'remote',    label: 'Remote' },
  { value: 'hybrid',    label: 'Hybrid' },
];

var APPLY_METHODS = [
  { value: 'link', label: 'External link / email' },
  { value: 'form', label: 'In-platform contact form' },
];

var VISIBILITY_META = {
  draft:        { label: 'Draft',        color: '#64748B', bg: '#F1F5F9',              icon: Lock },
  members_only: { label: 'Members Only', color: '#D97706', bg: 'rgba(245,183,49,0.1)', icon: Users },
  groups:       { label: 'Groups',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', icon: Users },
  public:       { label: 'Public',       color: '#16A34A', bg: 'rgba(34,197,94,0.1)',  icon: Globe },
};

var EMPTY_FORM = {
  title: '',
  role_types: [],
  description: '',
  who_is_it_for: '',
  compensation_type: 'unpaid',
  compensation_details: '',
  salary_min: '',
  salary_max: '',
  location_type: 'in_person',
  city: '',
  commitment: '',
  apply_method: 'form',
  apply_url: '',
  tags: [],
  visibility: 'draft',
  deadline: '',
  group_ids: [],
  show_on_website: false,
  show_on_discover: false,
  is_featured: false,
  reach: 'local',
};

// ── Fuzzy match helper ────────────────────────────────────────────────────────
function fuzzyScore(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.85;
  var matches = 0;
  var shorter = a.length < b.length ? a : b;
  var longer  = a.length < b.length ? b : a;
  for (var i = 0; i < shorter.length; i++) { if (longer.includes(shorter[i])) matches++; }
  return matches / longer.length;
}

// ── Visibility badge ──────────────────────────────────────────────────────────
function VisibilityBadge({ visibility }) {
  var meta = VISIBILITY_META[visibility] || VISIBILITY_META.draft;
  var IconComp = meta.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: meta.bg, color: meta.color }}>
      <IconComp size={10} aria-hidden="true" />{meta.label}
    </span>
  );
}

// ── Platform Tag Picker ───────────────────────────────────────────────────────
function PlatformTagPicker({ tags, onChange, groups }) {
  var [customInput, setCustomInput]                 = useState('');
  var [softBlockSuggestion, setSoftBlockSuggestion] = useState(null);

  var allPlatformLabels = [];
  groups.forEach(function(g) { (g.tags || []).forEach(function(t) { allPlatformLabels.push(t); }); });

  function toggleTag(label) {
    onChange(tags.includes(label) ? tags.filter(function(t) { return t !== label; }) : tags.concat([label]));
  }

  function handleCustomInput(val) {
    setCustomInput(val);
    if (!val.trim()) { setSoftBlockSuggestion(null); return; }
    var best = null; var bestScore = 0;
    allPlatformLabels.forEach(function(label) {
      var score = fuzzyScore(val.trim(), label);
      if (score > bestScore && score >= 0.8 && !tags.includes(label)) { bestScore = score; best = label; }
    });
    setSoftBlockSuggestion(best);
  }

  function addCustomTag(val) {
    var trimmed = (val || customInput).trim();
    if (!trimmed || tags.includes(trimmed)) { setCustomInput(''); setSoftBlockSuggestion(null); return; }
    onChange(tags.concat([trimmed])); setCustomInput(''); setSoftBlockSuggestion(null);
  }

  return (
    <div>
      {groups.map(function(group, gi) {
        if (!group.tags || group.tags.length === 0) return null;
        return (
          <div key={group.label} style={{ marginBottom: gi < groups.length - 1 ? '16px' : '0' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>{group.label}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {group.tags.map(function(label) {
                var selected = tags.includes(label);
                return (
                  <button key={label} type="button" onClick={function() { toggleTag(label); }}
                    style={{ padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, border: '1px solid ' + (selected ? '#3B82F6' : borderColor), background: selected ? '#EFF6FF' : cardBg, color: selected ? '#3B82F6' : textSecondary, cursor: 'pointer' }}
                    className={'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400'} aria-pressed={selected}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid ' + borderColor }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Custom Tag</p>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input value={customInput} onChange={function(e) { handleCustomInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCustomTag(); } }}
            onBlur={function() { if (customInput.trim() && !softBlockSuggestion) addCustomTag(); }}
            placeholder="Type a tag and press Enter..." aria-label="Add custom tag"
            style={{ flex: 1, padding: '7px 10px', border: '1px solid ' + borderColor, borderRadius: '6px', fontSize: '13px', color: textPrimary, outline: 'none', background: cardBg }}
            className="focus:ring-2 focus:ring-blue-400" />
          <button type="button" onClick={function() { addCustomTag(); }}
            style={{ padding: '7px 14px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500">Add</button>
        </div>
        {softBlockSuggestion && (
          <div style={{ marginTop: '8px', padding: '8px 10px', background: '#FFFBEB', border: '1px solid rgba(245,183,49,0.4)', borderRadius: '6px', fontSize: '12px', color: '#92400E' }}>
            Did you mean <strong>"{softBlockSuggestion}"</strong>? Using platform tags improves discoverability.
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <button type="button" onClick={function() { toggleTag(softBlockSuggestion); setCustomInput(''); setSoftBlockSuggestion(null); }}
                style={{ padding: '3px 10px', background: '#F5B731', color: '#0E1523', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-yellow-400">Use "{softBlockSuggestion}"</button>
              <button type="button" onClick={function() { addCustomTag(customInput); }}
                style={{ padding: '3px 10px', background: 'transparent', color: textMuted, border: '1px solid ' + borderColor, borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-slate-400">Keep my tag</button>
            </div>
          </div>
        )}
        {tags.filter(function(t) { return !allPlatformLabels.includes(t); }).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {tags.filter(function(t) { return !allPlatformLabels.includes(t); }).map(function(tag) {
              return (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: '#F1F5F9', color: textSecondary, border: '1px solid ' + borderColor }}>
                  {tag}
                  <button type="button" onClick={function() { onChange(tags.filter(function(t2) { return t2 !== tag; })); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '0', lineHeight: 1, display: 'flex' }}
                    aria-label={'Remove tag ' + tag} className="focus:outline-none rounded"><X size={10} /></button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Role type multi-select ────────────────────────────────────────────────────
function RoleTypeSelect({ selected, onChange, roleTypeOptions }) {
  var [open, setOpen]               = useState(false);
  var [customInput, setCustomInput] = useState('');
  var ref = useRef(null);

  useEffect(function() {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') setOpen(false); }
    if (open) document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [open]);

  function toggleOption(opt) {
    onChange(selected.includes(opt) ? selected.filter(function(s) { return s !== opt; }) : selected.concat([opt]));
  }

  function addCustom() {
    var val = customInput.trim();
    if (!val || selected.includes(val)) return;
    onChange(selected.concat([val])); setCustomInput('');
  }

  var options = roleTypeOptions && roleTypeOptions.length > 0 ? roleTypeOptions : [
    'Administrative','Advocacy','Board Member','Communications & Marketing',
    'Community Outreach','Data & Research','Event Support','Executive Director',
    'Finance & Accounting','Fundraising','Grant Writing','Graphic Design',
    'Human Resources','IT & Technology','Legal','Mentorship',
    'Photography / Videography','Program Coordination','Social Media',
    'Teaching & Tutoring','Translation & Interpretation','Transportation',
    'Volunteer Coordination','Web Development',
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={function() { setOpen(!open); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: '1px solid ' + borderColor, borderRadius: '8px', background: cardBg, fontSize: '13px', color: selected.length ? textPrimary : textMuted, cursor: 'pointer', textAlign: 'left' }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-haspopup="listbox" aria-expanded={open}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected.length ? selected.join(', ') : 'Select role types'}
        </span>
        <ChevronDown size={14} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '4px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }}
          role="listbox" aria-multiselectable="true" aria-label="Role types">
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {options.map(function(opt) {
              var checked = selected.includes(opt);
              return (
                <button key={opt} type="button" role="option" aria-selected={checked} onClick={function() { toggleOption(opt); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', background: checked ? '#EFF6FF' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: checked ? '#3B82F6' : textPrimary, textAlign: 'left' }}
                  className={'hover:bg-slate-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-400'}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, border: '2px solid ' + (checked ? '#3B82F6' : borderColor), background: checked ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                    {checked && <CheckCircle size={10} color="#fff" />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
          <div style={{ padding: '8px 12px', borderTop: '1px solid ' + borderColor, display: 'flex', gap: '6px' }}>
            <input value={customInput} onChange={function(e) { setCustomInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder="Add custom role type..." aria-label="Custom role type"
              style={{ flex: 1, fontSize: '12px', padding: '5px 8px', border: '1px solid ' + borderColor, borderRadius: '6px', outline: 'none', color: textPrimary }}
              className="focus:ring-2 focus:ring-blue-400" />
            <button type="button" onClick={addCustom}
              style={{ padding: '5px 10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500">Add</button>
            <button type="button" onClick={function() { setOpen(false); }}
              style={{ padding: '5px 10px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              className="focus:outline-none focus:ring-2 focus:ring-slate-400">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading opportunities">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {[1, 2, 3].map(function(i) {
          return (
            <div key={i} style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-pulse">
              <div style={{ height: '15px', width: '60%', background: elevatedBg, borderRadius: '6px' }} />
              <div style={{ height: '22px', width: '80px', background: elevatedBg, borderRadius: '99px' }} />
              <div style={{ height: '12px', width: '40%', background: elevatedBg, borderRadius: '6px' }} />
              <div style={{ height: '12px', width: '55%', background: elevatedBg, borderRadius: '6px' }} />
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid ' + borderColor, height: '28px', background: elevatedBg, borderRadius: '6px' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd, isVerified }) {
  if (!isVerified) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '200px', margin: '0 auto 20px', display: 'block', mixBlendMode: 'multiply' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Verified Nonprofits Only</h3>
        <p style={{ fontSize: '14px', color: textSecondary, maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.6 }}>
          Posting opportunities is available to verified 501(c)(3) organizations. Get verified to connect with job seekers, volunteers, and board candidates.
        </p>
        <a href="settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
          className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Get Verified</a>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '200px', margin: '0 auto 20px', display: 'block', mixBlendMode: 'multiply' }} />
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>No opportunities yet</h3>
      <p style={{ fontSize: '14px', color: textSecondary, maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.6 }}>
        Post roles, board positions, internships, and volunteer opportunities to share with members or publish to the public directory.
      </p>
      <button onClick={onAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
        className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <Plus size={15} aria-hidden="true" />Post an Opportunity
      </button>
    </div>
  );
}

// ── Modal tab button ──────────────────────────────────────────────────────────
function ModalTab({ id, label, active, onClick, hasError }) {
  return (
    <button type="button" onClick={function() { onClick(id); }}
      style={{ padding: '10px 16px', fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#3B82F6' : textMuted, background: 'none', border: 'none', borderBottom: '2px solid ' + (active ? '#3B82F6' : 'transparent'), cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
      className="focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset" aria-current={active ? 'true' : undefined}>
      {label}
      {hasError && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} aria-label="Has errors" />}
    </button>
  );
}

// ── Opportunity form modal ────────────────────────────────────────────────────
function OpportunityModal({ organizationId, currentUserId, existing, onClose, onSaved, templateBanner }) {
  var [activeTab, setActiveTab] = useState('details');
  var [form, setForm] = useState(existing ? {
    title:                existing.title || '',
    role_types:           existing.role_types || [],
    description:          existing.description || '',
    who_is_it_for:        existing.who_is_it_for || '',
    compensation_type:    existing.compensation_type || 'unpaid',
    compensation_details: existing.compensation_details || '',
    salary_min:           existing.salary_min || '',
    salary_max:           existing.salary_max || '',
    location_type:        existing.location_type || 'in_person',
    city:                 existing.city || '',
    commitment:           existing.commitment || '',
    apply_method:         existing.apply_method || 'form',
    apply_url:            existing.apply_url || '',
    tags:                 existing.tags || [],
    visibility:           existing.visibility || 'draft',
    deadline:             existing.deadline || '',
    group_ids:            existing.group_ids || [],
    show_on_website:      existing.show_on_website || false,
    show_on_discover:     existing.show_on_discover || false,
    is_featured:          existing.is_featured || false,
    reach:                existing.reach || 'local',
  } : EMPTY_FORM);

  var [saving, setSaving]           = useState(false);
  var [errors, setErrors]           = useState({});
  var [tagGroups, setTagGroups]     = useState({ causeAreas: [], audience: [], roleTypes: [], formats: [], languages: [] });
  var [defaultTags, setDefaultTags] = useState([]);
  var [orgGroups, setOrgGroups]     = useState([]);
  var [postingFile, setPostingFile]               = useState(null);
  var [existingPostingUrl, setExistingPostingUrl] = useState(existing ? existing.posting_url || null : null);
  var fileInputRef = useRef(null);

  useEffect(function() {
    getContentModalTags('opportunity').then(function(g) { setTagGroups(g); });
  }, []);

  useEffect(function() {
    supabase.from('organizations').select('tag_defaults').eq('id', organizationId).single()
      .then(function(r) {
        if (r.data && r.data.tag_defaults && r.data.tag_defaults.opportunity) {
          setDefaultTags(r.data.tag_defaults.opportunity);
        }
      });
  }, [organizationId]);

  useEffect(function() {
    supabase.from('org_groups').select('id, name, description, type')
      .eq('organization_id', organizationId).eq('is_active', true).order('name')
      .then(function(r) { setOrgGroups(r.data || []); });
  }, [organizationId]);

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  var ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
  var ACCEPTED_EXT   = '.pdf, .docx, .jpg, .jpeg, .png';

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error('Please upload a PDF, Word document, or image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB.'); return; }
    setPostingFile(file);
  }

  function removeFile() {
    setPostingFile(null); setExistingPostingUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function setField(key, val) {
    setForm(function(prev) { var next = Object.assign({}, prev); next[key] = val; return next; });
    if (errors[key]) setErrors(function(prev) { var next = Object.assign({}, prev); delete next[key]; return next; });
  }

  function applyDefaultTags() {
    if (!defaultTags.length) return;
    var merged = form.tags.slice();
    defaultTags.forEach(function(t) { if (!merged.includes(t)) merged.push(t); });
    setField('tags', merged);
    mascotSuccessToast('Default tags applied!');
  }

  function validate() {
    var errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.role_types.length) errs.role_types = 'Select at least one role type.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (form.apply_method === 'link' && !form.apply_url.trim()) errs.apply_url = 'Provide an apply URL or email address.';
    if (form.visibility === 'groups' && form.group_ids.length === 0) errs.group_ids = 'Select at least one group.';
    return errs;
  }

  async function handleSave(targetVisibility) {
    var errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.title || errs.role_types || errs.description) { setActiveTab('details'); }
      else if (errs.apply_url) { setActiveTab('settings'); }
      else if (errs.group_ids) { setActiveTab('publishing'); }
      return;
    }
    setSaving(true);
    var toastId = toast.loading(existing ? 'Saving...' : 'Posting...');
    var vis = targetVisibility || form.visibility;

    var postingUrl = existingPostingUrl || null;
    if (postingFile) {
      var fileExt  = postingFile.name.split('.').pop();
      var filePath = organizationId + '/' + Date.now() + '.' + fileExt;
      var uploadResult = await supabase.storage.from('opportunity-docs').upload(filePath, postingFile, { upsert: true });
      if (uploadResult.error) {
        toast.dismiss(toastId); setSaving(false);
        mascotErrorToast('File upload failed.', uploadResult.error.message); return;
      }
      postingUrl = supabase.storage.from('opportunity-docs').getPublicUrl(filePath).data.publicUrl;
    }

    var payload = {
      organization_id:      organizationId,
      title:                form.title.trim(),
      role_types:           form.role_types,
      role_type_other:      null,
      description:          form.description.trim(),
      who_is_it_for:        form.who_is_it_for.trim() || null,
      compensation_type:    form.compensation_type,
      compensation_details: form.compensation_details.trim() || null,
      salary_min:           form.salary_min ? parseFloat(form.salary_min) : null,
      salary_max:           form.salary_max ? parseFloat(form.salary_max) : null,
      location_type:        form.location_type,
      city:                 form.city.trim() || null,
      commitment:           form.commitment.trim() || null,
      apply_method:         form.apply_method,
      apply_url:            form.apply_url.trim() || null,
      tags:                 form.tags,
      visibility:           vis,
      deadline:             form.deadline || null,
      posting_url:          postingUrl,
      group_ids:            form.group_ids,
      show_on_website:      form.show_on_website,
      show_on_discover:     form.show_on_discover,
      is_featured:          form.is_featured,
      reach:                form.reach,
      updated_at:           new Date().toISOString(),
    };
    if (!existing || !existing.id) payload.created_by = currentUserId;

      var result = (existing && existing.id)
        ? await supabase.from('org_opportunities').update(payload).eq('id', existing.id)
        : await supabase.from('org_opportunities').insert(payload);

    toast.dismiss(toastId); setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save opportunity.', result.error.message); return; }
    mascotSuccessToast(existing ? 'Opportunity updated!' : 'Opportunity posted!');
    onSaved(); onClose();
  }

  var inputStyle  = { width: '100%', padding: '9px 12px', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, background: cardBg, boxSizing: 'border-box', outline: 'none' };
  var labelStyle  = { fontSize: '13px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: '5px' };
  var fieldStyle  = { marginBottom: '16px' };
  var errorStyle  = { fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' };
  var helperStyle = { fontSize: '11px', color: textMuted, marginTop: '4px' };

  var detailsHasError  = !!(errors.title || errors.role_types || errors.description);
  var settingsHasError = !!(errors.apply_url);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', zIndex: 50, overflowY: 'auto' }}
      role="dialog" aria-modal="true" aria-labelledby="opp-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: cardBg, borderRadius: '16px', width: '100%', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', marginTop: '16px', marginBottom: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div>
            <h2 id="opp-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: textPrimary, margin: 0 }}>
              {existing ? 'Edit Opportunity' : 'Post an Opportunity'}
            </h2>
            {form.title && <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{form.title}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '4px' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close"><X size={18} /></button>
        </div>

        {/* Template banner */}
        {templateBanner && (
          <div style={{ margin: '12px 24px 0', padding: '10px 14px', background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.3)', borderRadius: '8px', fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
            Started from template: {templateBanner} — feel free to edit anything.
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid ' + borderColor, paddingLeft: '24px', marginTop: '12px', overflowX: 'auto' }}>
          <ModalTab id="details"    label="Details"         active={activeTab === 'details'}    onClick={setActiveTab} hasError={detailsHasError} />
          <ModalTab id="settings"   label="Settings"        active={activeTab === 'settings'}   onClick={setActiveTab} hasError={settingsHasError} />
          <ModalTab id="tags"       label="Audience & Tags" active={activeTab === 'tags'}       onClick={setActiveTab} />
          <ModalTab id="publishing" label="Publishing"      active={activeTab === 'publishing'} onClick={setActiveTab} />
        </div>

        {/* Tab content */}
        <div style={{ padding: '24px' }}>

          {/* ── DETAILS ── */}
          {activeTab === 'details' && (
            <div>
              <div style={fieldStyle}>
                <label htmlFor="opp-title" style={labelStyle}>Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                <input id="opp-title" value={form.title} onChange={function(e) { setField('title', e.target.value); }}
                  placeholder="e.g. Board Member — Finance Committee"
                  style={Object.assign({}, inputStyle, errors.title ? { borderColor: '#EF4444' } : {})}
                  aria-required="true" aria-describedby={errors.title ? 'err-opp-title' : undefined}
                  className="focus:ring-2 focus:ring-blue-500" />
                {errors.title && <p id="err-opp-title" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.title}</p>}
              </div>

              <div style={fieldStyle}>
                <label htmlFor="opp-desc" style={labelStyle}>Description <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                <textarea id="opp-desc" value={form.description} onChange={function(e) { setField('description', e.target.value); }}
                  placeholder="Describe the role, responsibilities, and qualifications..."
                  rows={5} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 }, errors.description ? { borderColor: '#EF4444' } : {})}
                  aria-required="true" aria-describedby={errors.description ? 'err-opp-desc' : 'opp-desc-count'}
                  className="focus:ring-2 focus:ring-blue-500" />
                <p id="opp-desc-count" style={helperStyle} aria-live="polite">{form.description.length} / 1000</p>
                {errors.description && <p id="err-opp-desc" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.description}</p>}
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Role Type <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                <RoleTypeSelect selected={form.role_types} onChange={function(v) { setField('role_types', v); }} roleTypeOptions={tagGroups.roleTypes} />
                {errors.role_types && <p style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.role_types}</p>}
              </div>

              <div style={fieldStyle}>
                <label htmlFor="opp-deadline" style={labelStyle}>Application Deadline</label>
                <input id="opp-deadline" type="date" value={form.deadline} onChange={function(e) { setField('deadline', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="opp-who" style={labelStyle}>Who is it for?</label>
                <textarea id="opp-who" value={form.who_is_it_for} onChange={function(e) { setField('who_is_it_for', e.target.value); }}
                  placeholder="e.g. We're looking for a finance professional with nonprofit board experience..."
                  rows={3} style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })}
                  className="focus:ring-2 focus:ring-blue-500" />
                <p style={helperStyle}>Optional free-text description of the ideal applicant.</p>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label htmlFor="opp-comp" style={labelStyle}>Compensation</label>
                  <select id="opp-comp" value={form.compensation_type} onChange={function(e) { setField('compensation_type', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
                    {COMPENSATION_TYPES.map(function(c) { return <option key={c.value} value={c.value}>{c.label}</option>; })}
                  </select>
                </div>
                <div>
                  <label htmlFor="opp-loc" style={labelStyle}>Location</label>
                  <select id="opp-loc" value={form.location_type} onChange={function(e) { setField('location_type', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500">
                    {LOCATION_TYPES.map(function(l) { return <option key={l.value} value={l.value}>{l.label}</option>; })}
                  </select>
                </div>
              </div>

              {(form.compensation_type === 'paid' || form.compensation_type === 'stipend') && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>{form.compensation_type === 'paid' ? 'Salary / Wage Range' : 'Stipend Range'} <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                      <input type="number" min="0" value={form.salary_min} onChange={function(e) { setField('salary_min', e.target.value); }} placeholder="Min" style={Object.assign({}, inputStyle, { paddingLeft: '28px' })} aria-label="Minimum salary" className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <DollarSign size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                      <input type="number" min="0" value={form.salary_max} onChange={function(e) { setField('salary_max', e.target.value); }} placeholder="Max" style={Object.assign({}, inputStyle, { paddingLeft: '28px' })} aria-label="Maximum salary" className="focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <p style={helperStyle}>Annual salary or hourly rate — leave blank if not disclosing.</p>
                </div>
              )}

              {(form.compensation_type === 'paid' || form.compensation_type === 'stipend') && (
                <div style={fieldStyle}>
                  <label htmlFor="opp-comp-detail" style={labelStyle}>{form.compensation_type === 'paid' ? 'Additional Pay Details' : 'Stipend Details'} <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span></label>
                  <input id="opp-comp-detail" value={form.compensation_details} onChange={function(e) { setField('compensation_details', e.target.value); }} placeholder="e.g. plus benefits, travel reimbursement" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label htmlFor="opp-city" style={labelStyle}>City / Region</label>
                  <input id="opp-city" value={form.city} onChange={function(e) { setField('city', e.target.value); }} placeholder="e.g. Toledo, OH" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="opp-commit" style={labelStyle}>Time Commitment</label>
                  <input id="opp-commit" value={form.commitment} onChange={function(e) { setField('commitment', e.target.value); }} placeholder="e.g. 5–8 hrs/month" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>How should people apply?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {APPLY_METHODS.map(function(m) {
                    var active = form.apply_method === m.value;
                    return (
                      <button key={m.value} type="button" onClick={function() { setField('apply_method', m.value); }}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '2px solid ' + (active ? '#3B82F6' : borderColor), background: active ? '#EFF6FF' : cardBg, color: active ? '#3B82F6' : textSecondary, cursor: 'pointer' }}
                        className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>{m.label}</button>
                    );
                  })}
                </div>
              </div>

              {form.apply_method === 'link' && (
                <div style={fieldStyle}>
                  <label htmlFor="opp-url" style={labelStyle}>Apply URL or Email <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                  <input id="opp-url" value={form.apply_url} onChange={function(e) { setField('apply_url', e.target.value); }}
                    placeholder="https://yourorg.org/apply or hiring@yourorg.org"
                    style={Object.assign({}, inputStyle, errors.apply_url ? { borderColor: '#EF4444' } : {})}
                    aria-describedby={errors.apply_url ? 'err-opp-url' : undefined} className="focus:ring-2 focus:ring-blue-500" />
                  {errors.apply_url && <p id="err-opp-url" style={errorStyle} role="alert"><AlertCircle size={11} aria-hidden="true" />{errors.apply_url}</p>}
                </div>
              )}

              <div style={fieldStyle}>
                <label style={labelStyle}>Job Posting Document <span style={{ fontWeight: 400, color: textMuted }}>(optional)</span></label>
                {(postingFile || existingPostingUrl) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid ' + borderColor, borderRadius: '8px', background: '#F0FDF4' }}>
                    <Paperclip size={14} color="#16A34A" aria-hidden="true" />
                    <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {postingFile ? postingFile.name : 'Existing document attached'}
                    </span>
                    {existingPostingUrl && !postingFile && (
                      <a href={existingPostingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }} aria-label="View current posting document">View</a>
                    )}
                    <button type="button" onClick={removeFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: '2px', display: 'flex', flexShrink: 0 }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Remove file"><X size={14} /></button>
                  </div>
                ) : (
                  <div onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', border: '2px dashed ' + borderColor, borderRadius: '8px', cursor: 'pointer', background: pageBg }}
                    role="button" tabIndex={0}
                    onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (fileInputRef.current) fileInputRef.current.click(); } }}
                    aria-label="Upload job posting document">
                    <Upload size={20} color={textMuted} aria-hidden="true" />
                    <p style={{ fontSize: '13px', color: textSecondary, margin: 0, fontWeight: 600 }}>Click to upload a posting</p>
                    <p style={{ fontSize: '11px', color: textMuted, margin: 0 }}>PDF, Word, or image — max 10 MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept={ACCEPTED_EXT} onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" />
              </div>
            </div>
          )}

          {/* ── AUDIENCE & TAGS ── */}
          {activeTab === 'tags' && (
            <div>
              {defaultTags.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '12px 14px', background: '#FFFBEB', border: '1px solid rgba(245,183,49,0.4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', margin: '0 0 2px' }}>Your organization has default tags for opportunities</p>
                    <p style={{ fontSize: '11px', color: '#B45309', margin: 0 }}>
                      {defaultTags.slice(0, 3).join(', ')}{defaultTags.length > 3 ? ' +' + (defaultTags.length - 3) + ' more' : ''}
                    </p>
                  </div>
                  <button type="button" onClick={applyDefaultTags}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: '#F5B731', color: '#0E1523', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    className="hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    <Sparkles size={12} aria-hidden="true" />Use default tags
                  </button>
                </div>
              )}

              {form.tags.length > 0 && (
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid ' + borderColor }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Selected Tags</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {form.tags.map(function(tag) {
                      return (
                        <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE' }}>
                          {tag}
                          <button type="button" onClick={function() { setField('tags', form.tags.filter(function(t) { return t !== tag; })); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', padding: '0', lineHeight: 1, display: 'flex' }}
                            aria-label={'Remove ' + tag} className="focus:outline-none rounded"><X size={10} /></button>
                        </span>
                      );
                    })}
                    <button type="button" onClick={function() { setField('tags', []); }}
                      style={{ fontSize: '11px', color: textMuted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded">Clear all</button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={13} color={textMuted} aria-hidden="true" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>Tags &amp; Keywords</span>
              </div>
              <PlatformTagPicker
                tags={form.tags}
                onChange={function(v) { setField('tags', v); }}
                groups={[
                  { label: 'Cause Area',      tags: tagGroups.causeAreas },
                  { label: 'Audience Served', tags: tagGroups.audience   },
                  { label: 'Role Type',       tags: tagGroups.roleTypes  },
                  { label: 'Format',          tags: tagGroups.formats    },
                  { label: 'Language',        tags: tagGroups.languages  },
                ]}
              />
              <p style={{ fontSize: '11px', color: textMuted, marginTop: '10px' }}>Platform tags improve discoverability on the public directory. Custom tags appear in search.</p>
            </div>
          )}

          {/* ── PUBLISHING ── */}
          {activeTab === 'publishing' && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '12px' }}>Who can see this?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {[
                  { value: 'draft',        label: 'Draft',           desc: 'Only org admins can see this.' },
                  { value: 'members_only', label: 'All Members',     desc: 'All active org members.' },
                  { value: 'groups',       label: 'Specific Groups', desc: 'Only members of selected groups.' },
                  { value: 'public',       label: 'Public',          desc: 'Anyone can see this.' },
                ].map(function(opt) {
                  var active = form.visibility === opt.value;
                  var IconComp = opt.value === 'draft' ? Lock : opt.value === 'public' ? Globe : Users;
                  var color = opt.value === 'draft' ? '#64748B' : opt.value === 'public' ? '#16A34A' : '#3B82F6';
                  var bg    = opt.value === 'draft' ? '#F1F5F9' : opt.value === 'public' ? 'rgba(34,197,94,0.08)' : '#EFF6FF';
                  return (
                    <button key={opt.value} type="button" onClick={function() { setField('visibility', opt.value); }}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', textAlign: 'left', border: '2px solid ' + (active ? color : borderColor), background: active ? bg : cardBg, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: active ? color : elevatedBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
                        <IconComp size={15} color={active ? '#fff' : textMuted} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: active ? color : textPrimary, margin: '0 0 2px' }}>{opt.label}</p>
                        <p style={{ fontSize: '12px', color: textSecondary, margin: 0 }}>{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.visibility === 'groups' && (
                <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED', marginBottom: '12px' }}>
                    Select groups <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                  </p>
                  {errors.group_ids && (
                    <p style={Object.assign({}, errorStyle, { marginBottom: '10px' })} role="alert">
                      <AlertCircle size={11} aria-hidden="true" />{errors.group_ids}
                    </p>
                  )}
                  {orgGroups.length === 0 ? (
                    <p style={{ fontSize: '13px', color: textMuted }}>No active groups found. Create groups in the Groups section first.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="group" aria-label="Select groups">
                      {orgGroups.map(function(group) {
                        var checked = form.group_ids.includes(group.id);
                        return (
                          <label key={group.id}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', border: '1px solid ' + (checked ? 'rgba(139,92,246,0.4)' : borderColor), borderRadius: '8px', background: checked ? 'rgba(139,92,246,0.06)' : cardBg, cursor: 'pointer' }}>
                            <input type="checkbox" checked={checked}
                              onChange={function() {
                                var next = checked
                                  ? form.group_ids.filter(function(id) { return id !== group.id; })
                                  : form.group_ids.concat([group.id]);
                                setField('group_ids', next);
                              }}
                              style={{ marginTop: '2px', flexShrink: 0 }}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              aria-label={group.name} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>{group.name}</p>
                              {group.description && <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{group.description}</p>}
                              {!group.description && group.type && <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0', textTransform: 'capitalize' }}>{group.type}</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '10px' }}>Also show on</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'show_on_website',  label: 'Org website',         desc: 'Appears on your public organization page' },
                    { key: 'show_on_discover', label: 'Discover page',        desc: 'Public listing at /opportunities · Org must be verified' },
                    { key: 'is_featured',      label: 'Feature this listing', desc: 'Highlighted border and Featured badge on the directory' },
                  ].map(function(row) {
                    var on = form[row.key];
                    return (
                      <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid ' + borderColor, borderRadius: '8px', background: cardBg }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0 }}>{row.label}</p>
                          <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{row.desc}</p>
                        </div>
                        <button type="button" role="switch" aria-checked={on} aria-label={row.label}
                          onClick={function() { setField(row.key, !on); }}
                          style={{ width: '44px', height: '24px', borderRadius: '99px', background: on ? '#3B82F6' : '#CBD5E1', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
                          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                          <span style={{ position: 'absolute', top: '2px', left: on ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '10px' }}>Reach</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="radiogroup" aria-label="Listing reach">
                  {[
                    { value: 'local',    label: 'Local',             desc: 'City or region only' },
                    { value: 'state',    label: 'Statewide',         desc: 'Available across the state' },
                    { value: 'national', label: 'National / Remote', desc: 'Open to anyone, anywhere' },
                  ].map(function(opt) {
                    var active = form.reach === opt.value;
                    return (
                      <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '1px solid ' + (active ? '#3B82F6' : borderColor), borderRadius: '8px', background: active ? '#EFF6FF' : cardBg, cursor: 'pointer' }}>
                        <input type="radio" name="opp-reach" value={opt.value} checked={active}
                          onChange={function() { setField('reach', opt.value); }}
                          className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#3B82F6' : textPrimary, margin: 0 }}>{opt.label}</p>
                          <p style={{ fontSize: '12px', color: textMuted, margin: 0 }}>{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: elevatedBg, borderRadius: '8px', fontSize: '12px', color: textMuted, lineHeight: 1.6 }}>
                Members are notified once when you first publish. Changing visibility between published states does not re-notify.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '16px 24px', borderTop: '1px solid ' + borderColor }}>
          <div>
            {!existing && (
              <button type="button" onClick={function() { handleSave('draft'); }} disabled={saving}
                style={{ padding: '9px 16px', background: 'transparent', color: textMuted, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">
                Save as Draft
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 20px', background: 'transparent', color: textMuted, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
            <button type="button" onClick={function() { handleSave(); }} disabled={saving}
              style={{ padding: '9px 24px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {saving ? 'Saving...' : existing ? 'Save Changes' : 'Post Opportunity'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Opportunity card ──────────────────────────────────────────────────────────
function OpportunityCard({ item, appCount, onEdit, onDelete, onDuplicate, onMakeTemplate, onViewApps }) {
  var [menuOpen, setMenuOpen] = useState(false);
  var menuRef = useRef(null);

  useEffect(function() {
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') setMenuOpen(false); }
    if (menuOpen) document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [menuOpen]);

  var isExpired    = item.deadline && new Date(item.deadline) < new Date();
  var hasFormApply = item.apply_method === 'form';
  var compLabel    = COMPENSATION_TYPES.find(function(c) { return c.value === item.compensation_type; });

  return (
    <article style={{ background: cardBg, border: '0.5px solid ' + (isExpired ? '#FECACA' : borderColor), borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', boxSizing: 'border-box' }}
      aria-label={item.title + ' opportunity'}>

      {/* Title */}
      <h3 style={{ fontSize: '15px', fontWeight: 500, color: textPrimary, margin: 0, lineHeight: 1.4 }}>{item.title}</h3>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        <VisibilityBadge visibility={item.visibility} />
        {isExpired && <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>Expired</span>}
        {hasFormApply && appCount > 0 && (
          <button onClick={function() { onViewApps(item); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', cursor: 'pointer' }}
            className="hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={'View ' + appCount + ' application' + (appCount !== 1 ? 's' : '')}>
            {appCount} {appCount === 1 ? 'application' : 'applications'}
          </button>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {item.role_types && item.role_types.length > 0 && (
          <p style={{ fontSize: '12px', color: textSecondary, margin: 0 }}>
            {item.role_types.slice(0, 2).join(', ')}{item.role_types.length > 2 ? ' +' + (item.role_types.length - 2) : ''}
          </p>
        )}
        {compLabel && <p style={{ fontSize: '12px', color: textMuted, margin: 0 }}>{compLabel.label}</p>}
        {item.deadline && (
          <p style={{ fontSize: '11px', color: isExpired ? '#DC2626' : textMuted, margin: 0 }}>
            {'Deadline: ' + new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Description */}
      {item.description && (
        <p style={{ fontSize: '13px', color: textSecondary, margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.description}
        </p>
      )}

      {/* Footer — Actions bottom-right */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '0.5px solid ' + borderColor, display: 'flex', justifyContent: 'flex-end' }}>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={function() { setMenuOpen(!menuOpen); }}
            style={{ background: pageBg, border: '0.5px solid ' + borderColor, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={'Actions for ' + item.title} aria-haspopup="menu" aria-expanded={menuOpen}>
            Actions <ChevronDown size={12} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: '4px', background: cardBg, border: '0.5px solid ' + borderColor, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 20, padding: '4px 0' }} role="menu">
              <button onClick={function() { setMenuOpen(false); onEdit(item); }}
                style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: textPrimary, textAlign: 'left' }}
                className="hover:bg-slate-50 focus:outline-none" role="menuitem">Edit</button>
              <button onClick={function() { setMenuOpen(false); onDuplicate(item); }}
                style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: textPrimary, textAlign: 'left' }}
                className="hover:bg-slate-50 focus:outline-none" role="menuitem">Duplicate</button>
              <button onClick={function() { setMenuOpen(false); onMakeTemplate(item); }}
                style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: textPrimary, textAlign: 'left' }}
                className="hover:bg-slate-50 focus:outline-none" role="menuitem">Make Template</button>
              {hasFormApply && (
                <button onClick={function() { setMenuOpen(false); onViewApps(item); }}
                  style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#3B82F6', textAlign: 'left' }}
                  className="hover:bg-blue-50 focus:outline-none" role="menuitem">
                  View Applications{appCount > 0 ? ' (' + appCount + ')' : ''}
                </button>
              )}
              <div style={{ height: '1px', background: borderColor, margin: '4px 0' }} role="separator" />
              {item.visibility === 'public' && (
                <button onClick={function() { setMenuOpen(false); onEdit(Object.assign({}, item, { _openTab: 'publishing' })); }}
                  style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: textMuted, textAlign: 'left' }}
                  className="hover:bg-slate-50 focus:outline-none" role="menuitem">Unpublish</button>
              )}
              <div style={{ height: '1px', background: borderColor, margin: '4px 0' }} role="separator" />
              <button onClick={function() { setMenuOpen(false); onDelete(item); }}
                style={{ width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#EF4444', textAlign: 'left' }}
                className="hover:bg-red-50 focus:outline-none" role="menuitem">Delete</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Confirm delete modal ──────────────────────────────────────────────────────
function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background: cardBg, borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
          <AlertCircle size={22} color="#EF4444" />
        </div>
        <h3 id="confirm-delete-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, textAlign: 'center', marginBottom: '8px' }}>Delete Opportunity?</h3>
        <p style={{ fontSize: '13px', color: textSecondary, textAlign: 'center', lineHeight: 1.6, marginBottom: '24px' }}>
          <strong style={{ color: textPrimary }}>{item.title}</strong> will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button autoFocus onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: textMuted, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Make Template modal ───────────────────────────────────────────────────────
function MakeTemplateModal({ item, onClose, onSaved }) {
  var [name, setName] = useState(item.title);
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  async function handleSave() {
    if (!name.trim()) { toast.error('Template name is required.'); return; }
    setSaving(true);
    var payload = Object.assign({}, item, {
      id: undefined,
      title: name.trim(),
      is_template: true,
      visibility: 'draft',
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      updated_at: new Date().toISOString(),
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_opportunities').insert(payload);
    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save template.', result.error.message); return; }
    mascotSuccessToast('Template saved!');
    onSaved();
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="tmpl-opp-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: cardBg, borderRadius: '14px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 id="tmpl-opp-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginBottom: '6px' }}>Save as Template</h3>
        <p style={{ fontSize: '13px', color: textMuted, marginBottom: '20px' }}>This opportunity will be saved as a reusable template for your org.</p>
        <label htmlFor="tmpl-opp-name" style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: '6px' }}>Template name</label>
        <input id="tmpl-opp-name" value={name} onChange={function(e) { setName(e.target.value); }}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
          className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: textMuted, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Applications drawer ───────────────────────────────────────────────────────
function ApplicationsDrawer({ item, onClose }) {
  var [apps, setApps]       = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  useEffect(function() {
    async function load() {
      var r = await supabase.from('opportunity_applications').select('*').eq('opportunity_id', item.id).order('created_at', { ascending: false });
      setApps(r.data || []); setLoading(false);
    }
    load();
  }, [item.id]);

  async function updateStatus(appId, status) {
    var r = await supabase.from('opportunity_applications').update({ status: status }).eq('id', appId);
    if (r.error) { toast.error('Failed to update status.'); return; }
    setApps(function(prev) { return prev.map(function(a) { return a.id === appId ? Object.assign({}, a, { status: status }) : a; }); });
    mascotSuccessToast('Status updated.');
  }

  var STATUS_COLORS = { new: '#3B82F6', reviewed: '#D97706', contacted: '#8B5CF6', closed: '#64748B' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}
      role="dialog" aria-modal="true" aria-labelledby="apps-drawer-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '460px', background: cardBg, height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 0, background: cardBg, zIndex: 1 }}>
          <div>
            <h2 id="apps-drawer-title" style={{ fontSize: '15px', fontWeight: 800, color: textPrimary, margin: 0 }}>Applications</h2>
            <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{item.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close drawer"><X size={18} /></button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {loading && (
            <div aria-busy="true" aria-label="Loading applications">
              {[1, 2, 3].map(function(i) { return <div key={i} style={{ height: '80px', background: elevatedBg, borderRadius: '10px', marginBottom: '10px' }} className="animate-pulse" />; })}
            </div>
          )}
          {!loading && apps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Inbox size={32} color={textTertiary} style={{ margin: '0 auto 12px', display: 'block' }} aria-hidden="true" />
              <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>No applications yet</p>
              <p style={{ fontSize: '13px', color: textMuted }}>Applications submitted through the platform will appear here.</p>
            </div>
          )}
          {!loading && apps.map(function(app) {
            return (
              <div key={app.id} style={{ background: pageBg, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>{app.applicant_name}</p>
                    <a href={'mailto:' + app.applicant_email} style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>{app.applicant_email}</a>
                  </div>
                  <select value={app.status} onChange={function(e) { updateStatus(app.id, e.target.value); }}
                    style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', border: '1px solid ' + borderColor, background: cardBg, color: STATUS_COLORS[app.status] || textMuted, cursor: 'pointer' }}
                    aria-label={'Status for ' + app.applicant_name} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                {app.message && <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.5, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{app.message}</p>}
                <p style={{ fontSize: '11px', color: textTertiary, marginTop: '8px' }}>
                  {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function OrgOpportunities() {
  var context        = useOutletContext();
  var organizationId = context.organizationId;
  var organization   = context.organization;
  var isAdmin        = context.isAdmin;
  var isVerified     = !!(organization && organization.is_verified_nonprofit);

  var [currentUserId, setCurrentUserId]   = useState(null);
  var [items, setItems]                   = useState([]);
  var [appCounts, setAppCounts]           = useState({});
  var [loading, setLoading]               = useState(true);
  var [showModal, setShowModal]           = useState(false);
  var [editing, setEditing]               = useState(null);
  var [templateBanner, setTemplateBanner] = useState(null);
  var [templateData, setTemplateData] = useState(null);
  var [showTemplatePicker, setShowTemplatePicker] = useState(false);
  var [deleting, setDeleting]             = useState(null);
  var [makingTemplate, setMakingTemplate] = useState(null);
  var [viewingApps, setViewingApps]       = useState(null);
  var [search, setSearch]                 = useState('');
  var [filterVis, setFilterVis]           = useState('all');

  useEffect(function() {
    supabase.auth.getUser().then(function(r) { if (r.data && r.data.user) setCurrentUserId(r.data.user.id); });
  }, []);

  useEffect(function() { loadItems(); }, [organizationId, isAdmin]);

  async function loadItems() {
    setLoading(true);
    var query = supabase.from('org_opportunities').select('*')
      .eq('organization_id', organizationId)
      .eq('is_template', false)
      .order('created_at', { ascending: false });
    if (!isAdmin) query = query.neq('visibility', 'draft');
    var r = await query;
    var rows = r.data || [];
    setItems(rows);

    var formIds = rows.filter(function(i) { return i.apply_method === 'form'; }).map(function(i) { return i.id; });
    if (formIds.length > 0) {
      var countResult = await supabase.from('opportunity_applications').select('opportunity_id').in('opportunity_id', formIds);
      var counts = {};
      (countResult.data || []).forEach(function(row) { counts[row.opportunity_id] = (counts[row.opportunity_id] || 0) + 1; });
      setAppCounts(counts);
    }
    setLoading(false);
  }

  function openEdit(item) {
    var tab = item._openTab || 'details';
    var clean = Object.assign({}, item);
    delete clean._openTab;
    setEditing(clean);
    setTemplateBanner(null);
    setShowModal(true);
  }

function handleTemplateSelect(template, name) {
  setShowTemplatePicker(false);
  var clean = Object.assign({}, template);
  delete clean._id;
  delete clean._desc;
  delete clean.id;
  setEditing(clean);
  setTemplateBanner(name);
  setShowModal(true);
}

  async function handleDuplicate(item) {
    var payload = Object.assign({}, item, {
      title: item.title + ' (Copy)',
      visibility: 'draft',
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      is_template: false,
      updated_at: new Date().toISOString(),
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_opportunities').insert(payload);
    if (result.error) { mascotErrorToast('Failed to duplicate.', result.error.message); return; }
    mascotSuccessToast('Opportunity duplicated — saved as draft.');
    loadItems();
  }

  async function handleDelete() {
    if (!deleting) return;
    var r = await supabase.from('org_opportunities').delete().eq('id', deleting.id);
    if (r.error) { mascotErrorToast('Failed to delete.'); setDeleting(null); return; }
    mascotSuccessToast('Opportunity deleted.');
    setDeleting(null); loadItems();
  }

  var filtered = items.filter(function(item) {
    var matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    var matchVis    = filterVis === 'all' || item.visibility === filterVis;
    return matchSearch && matchVis;
  });

  var counts = { all: items.length, draft: 0, members_only: 0, public: 0 };
  items.forEach(function(item) { if (counts[item.visibility] !== undefined) counts[item.visibility]++; });

  return (
    <div style={{ background: pageBg, minHeight: '100vh' }}>
      <div style={{ padding: '0 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: textPrimary, margin: '0 0 4px' }}>Opportunities</h1>
            <p style={{ fontSize: '14px', color: textMuted, margin: 0 }}>
              {items.length > 0 ? items.length + ' listing' + (items.length !== 1 ? 's' : '') : 'Post roles, board seats, and volunteer opportunities'}
            </p>
          </div>
              {isAdmin && isVerified && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={function() { setShowTemplatePicker(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'transparent', color: textSecondary, border: '1px solid ' + borderColor, borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">
            Templates
          </button>
          <button onClick={function() { setEditing(null); setTemplateBanner(null); setShowModal(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Plus size={15} aria-hidden="true" />Post Opportunity
          </button>
        </div>
      )}
        </div>
      </div>

      {!isVerified && isAdmin && (
        <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '24px' }}>
          <EmptyState onAdd={function() {}} isVerified={false} />
        </div>
      )}

      {isVerified && (
        <>
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
                <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search opportunities..."
                  style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '0.5px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, background: cardBg, boxSizing: 'border-box', outline: 'none' }}
                  aria-label="Search opportunities" className="focus:ring-2 focus:ring-blue-500" />
              </div>
              <div style={{ display: 'flex', gap: '6px' }} role="group" aria-label="Filter by visibility">
                {(isAdmin ? ['all', 'draft', 'members_only', 'public'] : ['all', 'members_only', 'public']).map(function(v) {
                  var active = filterVis === v;
                  var meta   = VISIBILITY_META[v];
                  var label  = v === 'all' ? 'All' : meta ? meta.label : v;
                  return (
                    <button key={v} onClick={function(val) { return function() { setFilterVis(val); }; }(v)}
                      style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, border: '1px solid ' + (active ? '#3B82F6' : borderColor), background: active ? '#EFF6FF' : cardBg, color: active ? '#3B82F6' : textMuted, cursor: 'pointer' }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={active}>
                      {label}{counts[v] > 0 ? ' (' + counts[v] + ')' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading && <Skeleton />}

          {!loading && items.length === 0 && (
            <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '24px' }}>
              <EmptyState onAdd={function() { setEditing(null); setTemplateBanner(null); setShowModal(true); }} isVerified={true} />
            </div>
          )}

          {!loading && items.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px' }}>
              <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '160px', margin: '0 auto 16px', display: 'block', mixBlendMode: 'multiply' }} />
              <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>No results found</p>
              <p style={{ fontSize: '13px', color: textMuted, marginBottom: '16px' }}>Try a different search or filter.</p>
              <button onClick={function() { setSearch(''); setFilterVis('all'); }}
                style={{ padding: '8px 16px', background: elevatedBg, border: '0.5px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: textSecondary, cursor: 'pointer' }}
                className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400">Clear filters</button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }} role="list" aria-label="Opportunities">
              {filtered.map(function(item) {
                return (
                  <div key={item.id} role="listitem">
                    <OpportunityCard item={item} appCount={appCounts[item.id] || 0}
                      onEdit={openEdit}
                      onDuplicate={handleDuplicate}
                      onMakeTemplate={function(i) { setMakingTemplate(i); }}
                      onDelete={function(i) { setDeleting(i); }}
                      onViewApps={function(i) { setViewingApps(i); }} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <OpportunityModal organizationId={organizationId} currentUserId={currentUserId} existing={editing}
          templateBanner={templateBanner}
          onClose={function() { setShowModal(false); setEditing(null); setTemplateBanner(null); }} onSaved={loadItems} />
      )}

{showTemplatePicker && (
  <TemplatePickerModal
    contentType="opportunity"
    organizationId={organizationId}
    onClose={function() { setShowTemplatePicker(false); }}
    onSelect={handleTemplateSelect}
  />
)}

      {deleting && <ConfirmDeleteModal item={deleting} onConfirm={handleDelete} onCancel={function() { setDeleting(null); }} />}

      {makingTemplate && (
        <MakeTemplateModal item={makingTemplate} onClose={function() { setMakingTemplate(null); }} onSaved={loadItems} />
      )}

      {viewingApps && <ApplicationsDrawer item={viewingApps} onClose={function() { setViewingApps(null); }} />}
    </div>
  );
}

export default OrgOpportunities;