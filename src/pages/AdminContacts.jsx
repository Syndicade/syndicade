import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import { mascotErrorToast } from '../components/MascotToast';

// ── Light theme tokens ────────────────────────────────────────────────────────
var pageBg        = '#F8FAFC';
var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// ── Category color palette (cycles by index) ─────────────────────────────────
var CAT_PALETTE = [
  { bg: '#DBEAFE', color: '#1D4ED8' },
  { bg: '#DCFCE7', color: '#15803D' },
  { bg: '#EDE9FE', color: '#6D28D9' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#FFE4E6', color: '#9F1239' },
  { bg: '#CCFBF1', color: '#0F766E' },
  { bg: '#FEE2E2', color: '#B91C1C' },
  { bg: '#F0FDF4', color: '#166534' },
];

// ── Card color palette (pastel) ───────────────────────────────────────────────
var CARD_PALETTE = [
  '#FEF9C3', // yellow (brand default)
  '#EDE9FE', // purple (brand)
  '#DBEAFE', // blue
  '#DCFCE7', // green
  '#FFE4E6', // pink
  '#CCFBF1', // teal
  '#FFEDD5', // orange
  '#E0E7FF', // indigo
  '#FCE7F3', // rose
  '#ECFCCB', // lime
  '#CFFAFE', // cyan
  '#FEE2E2', // red
];
var DEFAULT_COLOR = '#FEF9C3';
function getCategoryStyle(value) {
  if (!value) return { bg: '#F1F5F9', color: '#475569' };
  var hash = 0;
  for (var i = 0; i < value.length; i++) { hash = value.charCodeAt(i) + ((hash << 5) - hash); }
  return CAT_PALETTE[Math.abs(hash) % CAT_PALETTE.length];
}

// ── Icon ──────────────────────────────────────────────────────────────────────
function Icon({ d, size }) {
  var s = size || 16;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      {Array.isArray(d)
        ? d.map(function(p, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" d={d} />}
    </svg>
  );
}

var ICONS = {
  plus:    'M12 4v16m8-8H4',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  pencil:  ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  trash:   ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:       'M6 18L18 6M6 6l12 12',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  mail:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:   'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z',
  building: ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  notes:   ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ContactSkeleton() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px' }} aria-busy="true" aria-label="Loading contacts">
      {[1,2,3,4,5,6,7,8].map(function(i) {
        return (
          <div key={i} style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'16px', display:'flex', flexDirection:'column', gap:'10px', boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#E2E8F0', flexShrink:0 }} />
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
                <div style={{ width:'80%', height:'12px', background:'#E2E8F0', borderRadius:'6px' }} />
                <div style={{ width:'50%', height:'10px', background:'#F1F5F9', borderRadius:'6px' }} />
              </div>
            </div>
            <div style={{ width:'60px', height:'18px', background:'#F1F5F9', borderRadius:'99px' }} />
            <div style={{ width:'90%', height:'10px', background:'#F1F5F9', borderRadius:'6px' }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ filtered, onAdd }) {
  return (
    <div style={{ textAlign:'center', padding:'64px 24px' }}>
      <div style={{ width:'56px', height:'56px', background:'#EFF6FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'1px solid #DBEAFE' }} aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {filtered ? (
        <>
          <h2 style={{ fontSize:'17px', fontWeight:800, color:textPrimary, marginBottom:'8px' }}>No contacts match your filters</h2>
          <p style={{ color:textSecondary, fontSize:'14px', lineHeight:1.6 }}>Try adjusting your search or category filter.</p>
        </>
      ) : (
        <>
          <h2 style={{ fontSize:'17px', fontWeight:800, color:textPrimary, marginBottom:'8px' }}>No contacts yet</h2>
          <p style={{ color:textSecondary, fontSize:'14px', lineHeight:1.6, marginBottom:'24px' }}>
            Store vendor, partner, government, and media contacts here — visible only to org admins.
          </p>
          <button
            onClick={onAdd}
            style={{ background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'10px 20px', fontWeight:700, fontSize:'13px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px' }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Icon d={ICONS.plus} size={15} />
            Add First Contact
          </button>
        </>
      )}
    </div>
  );
}

// ── Contact form modal ────────────────────────────────────────────────────────
function ContactModal({ contact, organizationId, categories, onClose, onSaved }) {
  var isEdit = !!(contact && contact.id);
  var [form, setForm] = useState({
    name:       (contact && contact.name)       || '',
    company:    (contact && contact.company)    || '',
    role_title: (contact && contact.role_title) || '',
    email:      (contact && contact.email)      || '',
    phone:      (contact && contact.phone)      || '',
    notes:      (contact && contact.notes)      || '',
    category:   (contact && contact.category)   || '',
    color:      (contact && contact.color)      || DEFAULT_COLOR,
  });
  var [saving, setSaving] = useState(false);
  var firstInputRef = useRef(null);

  useEffect(function() {
    if (firstInputRef.current) firstInputRef.current.focus();
  }, []);

  function set(key, val) {
    setForm(function(prev) {
      var next = {};
      Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
      next[key] = val;
      return next;
    });
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    setSaving(true);
    try {
      var payload = {
        organization_id: organizationId,
        name:       form.name.trim(),
        company:    form.company.trim()    || null,
        role_title: form.role_title.trim() || null,
        email:      form.email.trim()      || null,
        phone:      form.phone.trim()      || null,
        notes:      form.notes.trim()      || null,
        category:   form.category.trim().toLowerCase() || null,
        color:      form.color || DEFAULT_COLOR,
        updated_at: new Date().toISOString(),
      };
      var result;
      if (isEdit) {
        result = await supabase.from('org_contacts').update(payload).eq('id', contact.id).select().single();
      } else {
        result = await supabase.from('org_contacts').insert(payload).select().single();
      }
      if (result.error) throw result.error;
      mascotSuccessToast(isEdit ? 'Contact updated!' : 'Contact added!');
      onSaved(result.data, isEdit);
    } catch(err) {
      mascotErrorToast('Failed to save contact.', err.message);
    } finally {
      setSaving(false);
    }
  }

  var inputStyle = { width:'100%', padding:'9px 12px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', color:textPrimary, background:'#FFFFFF', outline:'none', boxSizing:'border-box' };
  var labelStyle = { display:'block', fontSize:'12px', fontWeight:700, color:textSecondary, marginBottom:'5px' };

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:60 }}
      role="dialog" aria-modal="true" aria-labelledby="contact-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', width:'100%', maxWidth:'480px', padding:'24px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <h2 id="contact-modal-title" style={{ fontSize:'17px', fontWeight:800, color:textPrimary, margin:0 }}>
            {isEdit ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button
            onClick={onClose}
            style={{ background:'transparent', border:'none', cursor:'pointer', color:textMuted, padding:'4px', borderRadius:'6px' }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {/* Name */}
          <div>
            <label htmlFor="contact-name" style={labelStyle}>Name <span style={{ color:'#EF4444' }} aria-hidden="true">*</span></label>
            <input
              id="contact-name" ref={firstInputRef} type="text"
              value={form.name} onChange={function(e) { set('name', e.target.value); }}
              placeholder="Full name"
              style={inputStyle}
              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-required="true"
            />
          </div>

          {/* Company + Role side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label htmlFor="contact-company" style={labelStyle}>Organization / Company</label>
              <input
                id="contact-company" type="text"
                value={form.company} onChange={function(e) { set('company', e.target.value); }}
                placeholder="Organization name"
                style={inputStyle}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="contact-role" style={labelStyle}>Role / Title</label>
              <input
                id="contact-role" type="text"
                value={form.role_title} onChange={function(e) { set('role_title', e.target.value); }}
                placeholder="e.g. Director"
                style={inputStyle}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Email + Phone side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label htmlFor="contact-email" style={labelStyle}>Email</label>
              <input
                id="contact-email" type="email"
                value={form.email} onChange={function(e) { set('email', e.target.value); }}
                placeholder="email@example.com"
                style={inputStyle}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" style={labelStyle}>Phone</label>
              <input
                id="contact-phone" type="tel"
                value={form.phone} onChange={function(e) { set('phone', e.target.value); }}
                placeholder="(555) 000-0000"
                style={inputStyle}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="contact-category" style={labelStyle}>Category <span style={{ color:textMuted, fontWeight:400 }}>(optional)</span></label>
            <input
              id="contact-category"
              type="text"
              list="category-options"
              value={form.category}
              onChange={function(e) { set('category', e.target.value); }}
              placeholder="e.g. Vendor, Partner, Media..."
              style={inputStyle}
              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
            />
            <datalist id="category-options">
              {(categories || []).map(function(cat) {
                return <option key={cat} value={cat.charAt(0).toUpperCase() + cat.slice(1)} />;
              })}
            </datalist>
          </div>

          {/* Card color */}
          <div>
            <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:textSecondary, marginBottom:'8px' }}>Card Color</label>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {CARD_PALETTE.map(function(c) {
                var selected = form.color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={function() { set('color', c); }}
                    style={{ width:'28px', height:'28px', borderRadius:'50%', background:c, border: selected ? '3px solid #0E1523' : '2px solid #E2E8F0', cursor:'pointer', flexShrink:0, transition:'transform 0.1s', transform: selected ? 'scale(1.15)' : 'scale(1)' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={'Select color ' + c}
                    aria-pressed={selected}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="contact-notes" style={labelStyle}>Notes</label>
            <textarea
              id="contact-notes"
              value={form.notes} onChange={function(e) { set('notes', e.target.value); }}
              placeholder="Any additional notes..."
              rows={3}
              style={Object.assign({}, inputStyle, { resize:'vertical', fontFamily:'inherit' })}
              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'10px', marginTop:'22px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex:1, padding:'11px', background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-busy={saving}
          >
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Contact')}
          </button>
          <button
            onClick={onClose}
            style={{ padding:'11px 18px', background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ contact, onClose, onDeleted }) {
  var [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      var result = await supabase.from('org_contacts').delete().eq('id', contact.id);
      if (result.error) throw result.error;
      mascotSuccessToast('Contact deleted.');
      onDeleted(contact.id);
    } catch(err) {
      mascotErrorToast('Failed to delete contact.', err.message);
      setDeleting(false);
    }
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:60 }}
      role="dialog" aria-modal="true" aria-labelledby="delete-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', width:'100%', maxWidth:'380px', padding:'24px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ width:'44px', height:'44px', background:'#FEF2F2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 0 14px', border:'1px solid #FECACA' }} aria-hidden="true">
          <Icon d={ICONS.trash} size={20} />
        </div>
        <h2 id="delete-modal-title" style={{ fontSize:'17px', fontWeight:800, color:textPrimary, marginBottom:'8px' }}>Delete Contact?</h2>
        <p style={{ fontSize:'13px', color:textSecondary, lineHeight:1.6, marginBottom:'22px' }}>
          <strong style={{ color:textPrimary }}>{contact.name}</strong> will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display:'flex', gap:'10px' }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ flex:1, padding:'10px', background:'#EF4444', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
            className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-busy={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            style={{ padding:'10px 18px', background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View modal ────────────────────────────────────────────────────────────────
function ViewModal({ contact, categories, onClose, onEdit, onDelete }) {
  var cardColor = contact.color || DEFAULT_COLOR;
  var cat = getCategoryStyle(contact.category);
  var initials = (contact.name || '?').split(' ').slice(0,2).map(function(w) { return w[0]; }).join('').toUpperCase();
  var categoryLabel = contact.category
    ? (contact.category.charAt(0).toUpperCase() + contact.category.slice(1))
    : null;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:60 }}
      role="dialog" aria-modal="true" aria-labelledby="view-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'16px', width:'100%', maxWidth:'420px', padding:'24px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:cardColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid '+borderColor }} aria-hidden="true">
              <span style={{ fontSize:'16px', fontWeight:800, color:'#0E1523' }}>{initials}</span>
            </div>
            <div>
              <h2 id="view-modal-title" style={{ fontSize:'17px', fontWeight:800, color:textPrimary, margin:'0 0 3px' }}>{contact.name}</h2>
              {(contact.role_title || contact.company) && (
                <p style={{ fontSize:'12px', color:textSecondary, margin:0 }}>
                  {[contact.role_title, contact.company].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background:'transparent', border:'none', cursor:'pointer', color:textMuted, padding:'4px', borderRadius:'6px', flexShrink:0 }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        {/* Category badge */}
        {categoryLabel && (
          <div style={{ marginBottom:'16px' }}>
            <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 10px', borderRadius:'99px', background:cardColor, color:'#0E1523', textTransform:'uppercase', letterSpacing:'0.5px', border:'1px solid '+borderColor }}>
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Detail rows */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'20px' }}>
          {contact.email && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ color:textMuted, flexShrink:0 }}><Icon d={ICONS.mail} size={15} /></span>
              <a href={'mailto:' + contact.email} style={{ fontSize:'13px', color:'#3B82F6', textDecoration:'none' }} className="hover:underline">{contact.email}</a>
            </div>
          )}
          {contact.phone && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ color:textMuted, flexShrink:0 }}><Icon d={ICONS.phone} size={15} /></span>
              <a href={'tel:' + contact.phone} style={{ fontSize:'13px', color:textSecondary, textDecoration:'none' }} className="hover:underline">{contact.phone}</a>
            </div>
          )}
          {contact.notes && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
              <span style={{ color:textMuted, flexShrink:0, marginTop:'2px' }}><Icon d={ICONS.notes} size={15} /></span>
              <p style={{ fontSize:'13px', color:textSecondary, margin:0, lineHeight:1.6 }}>{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'8px', paddingTop:'16px', borderTop:'1px solid '+borderColor }}>
          <button
            onClick={function() { onClose(); onEdit(contact); }}
            style={{ flex:1, padding:'10px', background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Icon d={ICONS.pencil} size={14} />
            Edit
          </button>
          <button
            onClick={function() { onClose(); onDelete(contact); }}
            style={{ padding:'10px 16px', background:'transparent', color:'#EF4444', border:'1px solid #FECACA', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}
            className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Icon d={ICONS.trash} size={14} />
            Delete
          </button>
          <button
            onClick={onClose}
            style={{ padding:'10px 16px', background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ contact, onView }) {
  var cardColor = contact.color || DEFAULT_COLOR;
  var initials = (contact.name || '?').split(' ').slice(0,2).map(function(w) { return w[0]; }).join('').toUpperCase();
  var categoryLabel = contact.category
    ? (contact.category.charAt(0).toUpperCase() + contact.category.slice(1))
    : null;

  return (
    <article
      style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'16px', display:'flex', flexDirection:'column', gap:'10px', boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', height:'100%', boxSizing:'border-box' }}
      aria-label={contact.name + ' contact card'}
    >
      {/* Avatar + name */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:cardColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid '+borderColor }} aria-hidden="true">
          <span style={{ fontSize:'12px', fontWeight:800, color:'#0E1523' }}>{initials}</span>
        </div>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:'13px', fontWeight:700, color:textPrimary, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{contact.name}</p>
          {(contact.role_title || contact.company) && (
            <p style={{ fontSize:'11px', color:textSecondary, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {[contact.role_title, contact.company].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Category badge */}
      {categoryLabel && (
        <div>
          <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:cardColor, color:'#0E1523', textTransform:'uppercase', letterSpacing:'0.5px', border:'1px solid '+borderColor }}>
            {categoryLabel}
          </span>
        </div>
      )}

      {/* Contact info */}
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        {contact.email && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', color:textSecondary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            <Icon d={ICONS.mail} size={12} />
            <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{contact.email}</span>
          </span>
        )}
        {contact.phone && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', color:textSecondary }}>
            <Icon d={ICONS.phone} size={12} />
            {contact.phone}
          </span>
        )}
      </div>

      {/* View button */}
      <div style={{ marginTop:'auto' }}>
        <button
          onClick={function() { onView(contact); }}
          style={{ width:'100%', padding:'7px', background:'#F8FAFC', color:textSecondary, border:'1px solid '+borderColor, borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}
          className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={'View ' + contact.name}
        >
          View
        </button>
      </div>
    </article>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function AdminContacts() {
  var context = useOutletContext();
  var organizationId = context.organizationId;
  var isAdmin = context.isAdmin;

  var [contacts, setContacts]           = useState([]);
  var [loading, setLoading]             = useState(true);
  var [search, setSearch]               = useState('');
  var [categoryFilter, setCategoryFilter] = useState('all');
  var [showModal, setShowModal]         = useState(false);
  var [editContact, setEditContact]     = useState(null);
  var [deleteContact, setDeleteContact] = useState(null);
  var [viewContact, setViewContact]     = useState(null);

  useEffect(function() {
    if (organizationId) fetchContacts();
  }, [organizationId]);

  async function fetchContacts() {
    setLoading(true);
    try {
      var result = await supabase
        .from('org_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });
      if (result.error) throw result.error;
      setContacts(result.data || []);
    } catch(err) {
      mascotErrorToast('Failed to load contacts.', err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(saved, isEdit) {
    if (isEdit) {
      setContacts(function(prev) {
        return prev.map(function(c) { return c.id === saved.id ? saved : c; });
      });
    } else {
      setContacts(function(prev) {
        return [saved].concat(prev).sort(function(a,b) { return a.name.localeCompare(b.name); });
      });
    }
    setShowModal(false);
    setEditContact(null);
  }

  function handleDeleted(id) {
    setContacts(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
    setDeleteContact(null);
  }

  function openAdd() {
    setEditContact(null);
    setShowModal(true);
  }

  function openEdit(contact) {
    setEditContact(contact);
    setShowModal(true);
  }

  // Filter
  var filtered = contacts.filter(function(c) {
    var matchSearch = !search || (
      c.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
      (c.company && c.company.toLowerCase().indexOf(search.toLowerCase()) > -1) ||
      (c.email && c.email.toLowerCase().indexOf(search.toLowerCase()) > -1) ||
      (c.role_title && c.role_title.toLowerCase().indexOf(search.toLowerCase()) > -1)
    );
    var matchCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchSearch && matchCat;
  });

  var isFiltered = search.trim() !== '' || categoryFilter !== 'all';

  // Unique categories from loaded data (for dynamic filter pills)
  var uniqueCategories = contacts.reduce(function(acc, c) {
    if (c.category && acc.indexOf(c.category) === -1) acc.push(c.category);
    return acc;
  }, []).sort();

  if (!isAdmin) {
    return (
      <div style={{ textAlign:'center', padding:'64px 24px' }}>
        <div style={{ width:'56px', height:'56px', background:'#FEF2F2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'1px solid #FECACA' }} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 style={{ fontSize:'17px', fontWeight:800, color:textPrimary, marginBottom:'8px' }}>Admin Access Required</h2>
        <p style={{ color:textSecondary, fontSize:'14px' }}>Contacts are only visible to org admins.</p>
      </div>
    );
  }

  return (
    <div style={{ background:pageBg, minHeight:'100vh' }}>
      <main role="main" aria-label="Admin contacts">
        {/* Page header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <p style={{ fontSize:'11px', fontWeight:700, color:'#F5B731', letterSpacing:'4px', textTransform:'uppercase', margin:'0 0 4px' }}>Admin</p>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:textPrimary, margin:0 }}>Contacts</h1>
            <p style={{ fontSize:'13px', color:textMuted, marginTop:'2px' }}>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} · visible to admins only
            </p>
          </div>
          <button
            onClick={openAdd}
            style={{ background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'10px 18px', fontWeight:700, fontSize:'13px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px', flexShrink:0 }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Icon d={ICONS.plus} size={15} />
            Add Contact
          </button>
        </div>

        {/* Search + filter bar */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
            <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:textMuted, pointerEvents:'none', display:'flex' }} aria-hidden="true">
              <Icon d={ICONS.search} size={15} />
            </span>
            <input
              type="search"
              value={search}
              onChange={function(e) { setSearch(e.target.value); }}
              placeholder="Search by name, org, email, or role..."
              style={{ width:'100%', paddingLeft:'34px', paddingRight:'12px', paddingTop:'9px', paddingBottom:'9px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', color:textPrimary, background:'#FFFFFF', outline:'none', boxSizing:'border-box' }}
              className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search contacts"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={function(e) { setCategoryFilter(e.target.value); }}
            style={{ padding:'9px 14px', border:'1px solid #E2E8F0', borderRadius:'8px', fontSize:'13px', color: categoryFilter === 'all' ? textMuted : textPrimary, background:'#FFFFFF', cursor:'pointer', outline:'none', minWidth:'160px' }}
            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(function(cat) {
              return (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              );
            })}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <ContactSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState filtered={isFiltered} onAdd={openAdd} />
        ) : (
          <div role="list" aria-label="Contacts list" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px' }}>
            {filtered.map(function(contact) {
              return (
                <div key={contact.id} role="listitem">
                  <ContactCard
                    contact={contact}
                    onView={function(c) { setViewContact(c); }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* View modal */}
      {viewContact && (
        <ViewModal
          contact={viewContact}
          categories={uniqueCategories}
          onClose={function() { setViewContact(null); }}
          onEdit={function(c) { setViewContact(null); openEdit(c); }}
          onDelete={function(c) { setViewContact(null); setDeleteContact(c); }}
        />
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <ContactModal
          contact={editContact}
          organizationId={organizationId}
          categories={uniqueCategories}
          onClose={function() { setShowModal(false); setEditContact(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm modal */}
      {deleteContact && (
        <DeleteModal
          contact={deleteContact}
          onClose={function() { setDeleteContact(null); }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

export default AdminContacts;