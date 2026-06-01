import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadICS } from '../lib/icalGenerator';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import RecurringEventOptions from '../components/RecurringEventOptions';
import EditEvent from '../components/EditEvent';
import AttendanceReport from '../components/AttendanceReport';
import AttendanceCheckIn from '../components/AttendanceCheckIn';
import EventQRCode from '../components/EventQRCode';

var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';
var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG1ocXJ5Z2tua29keWRidW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzc0NjksImV4cCI6MjA4NDA1MzQ2OX0.B7DsLVNZuG1l39ABXDk1Km_737tCvbWAZGhqVCC3ddE';
var APP_URL = 'https://syndicade-git-main-syndicades-projects.vercel.app';

function getActivePrice(tt) {
  if (tt.early_bird_price != null && tt.early_bird_ends_at != null) {
    if (new Date(tt.early_bird_ends_at) > new Date()) {
      return { price: tt.early_bird_price, isEarlyBird: true };
    }
  }
  return { price: tt.price, isEarlyBird: false };
}

function formatPrice(price) {
  return '$' + parseFloat(price).toFixed(2);
}

function isEventDay(startTime) {
  var now = new Date();
  var eventDate = new Date(startTime);
  return now.getFullYear() === eventDate.getFullYear() &&
    now.getMonth() === eventDate.getMonth() &&
    now.getDate() === eventDate.getDate();
}

// ── Add to Calendar dropdown ─────────────────────────────────────────────────
function AddToCalendarButton({ event }) {
  var [open, setOpen] = useState(false);

  function pad(n) { return String(n).padStart(2, '0'); }
  function toIcsDate(d) {
    var dt = new Date(d);
    return dt.getUTCFullYear() + pad(dt.getUTCMonth()+1) + pad(dt.getUTCDate()) +
      'T' + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + '00Z';
  }
  function toOutlookDate(d) { return new Date(d).toISOString(); }

  var start = event.start_time;
  var end = event.end_time || event.start_time;
  var title = encodeURIComponent(event.title || '');
  var loc = encodeURIComponent(event.location || '');
  var desc = encodeURIComponent(event.description || '');

  var googleUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + title +
    '&dates=' + toIcsDate(start) + '/' + toIcsDate(end) +
    '&details=' + desc +
    '&location=' + loc;

  var outlookUrl = 'https://outlook.live.com/calendar/0/deeplink/compose?subject=' + title +
    '&startdt=' + toOutlookDate(start) +
    '&enddt=' + toOutlookDate(end) +
    '&location=' + loc +
    '&body=' + desc;

  var yahooUrl = 'https://calendar.yahoo.com/?v=60&title=' + title +
    '&st=' + toIcsDate(start) +
    '&et=' + toIcsDate(end) +
    '&desc=' + desc +
    '&in_loc=' + loc;

  function handleDownloadIcs(e) {
    e.preventDefault();
    downloadICS(event);
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={function() { setOpen(function(v) { return !v; }); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
        className="hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Add to Calendar
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={function() { setOpen(false); }} aria-hidden="true" />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px', overflow: 'hidden' }} role="menu">
            {[
              { label: 'Google Calendar', href: googleUrl, icon: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18' },
              { label: 'Outlook', href: outlookUrl, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { label: 'Yahoo Calendar', href: yahooUrl, icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
            ].map(function(item) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={function() { setOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', color: '#475569', textDecoration: 'none' }}
                  className="hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                  role="menuitem"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={item.icon}/>
                  </svg>
                  {item.label}
                </a>
              );
            })}
            <button
              onClick={handleDownloadIcs}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', fontSize: '13px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', borderTop: '1px solid #F1F5F9' }}
              className="hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
              role="menuitem"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download .ics
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Map embed ────────────────────────────────────────────────────────────────
function MapEmbed({ location }) {
  if (!location) return null;
  var src = 'https://maps.google.com/maps?q=' + encodeURIComponent(location) + '&output=embed&z=15';
  return (
    <div style={{ marginTop: '16px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
      <iframe
        title="Event location map"
        src={src}
        width="100%"
        height="220"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

// ── Sponsors section ─────────────────────────────────────────────────────────
function SponsorsSection({ sponsors, cardStyle, sectionLabel }) {
  if (!sponsors || sponsors.length === 0) return null;

  // Group by tier for display ordering
  var tierOrder = ['Title Sponsor', 'Gold', 'Silver', 'Bronze', 'Community Partner', 'In-Kind Supporter'];

  function getTierColor(tier) {
    if (!tier) return { bg: '#F1F5F9', color: '#64748B' };
    var t = tier.toLowerCase();
    if (t.includes('title')) return { bg: 'rgba(245,183,49,0.15)', color: '#B45309', border: 'rgba(245,183,49,0.4)' };
    if (t.includes('gold')) return { bg: 'rgba(245,183,49,0.12)', color: '#B45309', border: 'rgba(245,183,49,0.35)' };
    if (t.includes('silver')) return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
    if (t.includes('bronze')) return { bg: 'rgba(180,83,9,0.08)', color: '#92400E', border: 'rgba(180,83,9,0.2)' };
    if (t.includes('community')) return { bg: 'rgba(59,130,246,0.08)', color: '#1D4ED8', border: 'rgba(59,130,246,0.2)' };
    return { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };
  }

  return (
    <section aria-labelledby="section-sponsors" style={cardStyle}>
      <span id="section-sponsors" style={sectionLabel}>Sponsors</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sponsors.map(function(sp) {
          var tierColors = getTierColor(sp.tier);
          return (
            <div
              key={sp.id}
              style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
            >
              {/* Logo or initials */}
              {sp.logo_url ? (
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: '6px' }}>
                  <img
                    src={sp.logo_url}
                    alt={sp.name + ' logo'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  style={{ width: '56px', height: '56px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px', fontWeight: 800, color: '#94A3B8' }}>
                  {sp.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name + tier */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {sp.website_url ? (
                  <a
                    href={sp.website_url.startsWith('http') ? sp.website_url : 'https://' + sp.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523', textDecoration: 'none', display: 'block' }}
                    className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={sp.name + ' website'}
                  >
                    {sp.name}
                  </a>
                ) : (
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523', margin: 0 }}>{sp.name}</p>
                )}
                {sp.tier && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    background: tierColors.bg,
                    color: tierColors.color,
                    border: '1px solid ' + (tierColors.border || tierColors.bg),
                  }}>
                    {sp.tier}
                  </span>
                )}
              </div>

              {/* External link icon if website */}
              {sp.website_url && (
                <a
                  href={sp.website_url.startsWith('http') ? sp.website_url : 'https://' + sp.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flexShrink: 0, color: '#94A3B8' }}
                  className="hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={'Visit ' + sp.name + ' website'}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Checkout Form Modal ──────────────────────────────────────────────────────
function CheckoutFormModal({ fields, onSubmit, onCancel, totalQty, orderTotal }) {
  var [values, setValues] = useState(function() {
    var init = {};
    fields.forEach(function(f) { init[f.id] = ''; });
    return init;
  });
  var [submitting, setSubmitting] = useState(false);

  function handleChange(fieldId, value) {
    setValues(function(prev) { return Object.assign({}, prev, { [fieldId]: value }); });
  }

  function handleSubmit(e) {
    e.preventDefault();
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (f.is_required && !values[f.id]) {
        toast.error(f.label + ' is required');
        return;
      }
    }
    setSubmitting(true);
    onSubmit(values);
  }

  var inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    color: '#0E1523',
    fontSize: '14px',
    outline: 'none',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog" aria-modal="true" aria-labelledby="checkout-form-title">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg my-8"
        style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'}}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 id="checkout-form-title" className="text-lg font-bold text-[#0E1523]">Almost there</h2>
            <p className="text-[#64748B] text-xs mt-0.5">
              {totalQty} ticket{totalQty !== 1 ? 's' : ''} — {formatPrice(orderTotal)} total
            </p>
          </div>
          <button type="button" onClick={onCancel}
            className="p-2 text-[#64748B] hover:text-[#0E1523] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cancel checkout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {fields.map(function(f) {
              var inputId = 'cf-' + f.id;
              return (
                <div key={f.id}>
                  <label htmlFor={inputId} className="block text-sm font-semibold text-[#475569] mb-1.5">
                    {f.label}
                    {f.is_required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
                    {!f.is_required && <span className="text-[#94A3B8] text-xs font-normal ml-1">(optional)</span>}
                  </label>
                  {f.field_type === 'dropdown' ? (
                    <select id={inputId} value={values[f.id]} required={f.is_required}
                      onChange={function(e) { handleChange(f.id, e.target.value); }}
                      style={inputStyle}
                      className="focus:ring-2 focus:ring-blue-500">
                      <option value="">Select an option...</option>
                      {(f.options || []).map(function(opt) {
                        return <option key={opt} value={opt}>{opt}</option>;
                      })}
                    </select>
                  ) : f.field_type === 'checkbox' ? (
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <input type="checkbox" id={inputId} checked={values[f.id] === 'yes'}
                        onChange={function(e) { handleChange(f.id, e.target.checked ? 'yes' : ''); }}
                        className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"/>
                      <span className="text-sm text-[#475569]">Yes</span>
                    </label>
                  ) : (
                    <input id={inputId}
                      type={f.field_type === 'email' ? 'email' : f.field_type === 'phone' ? 'tel' : 'text'}
                      value={values[f.id]}
                      required={f.is_required}
                      onChange={function(e) { handleChange(f.id, e.target.value); }}
                      placeholder={f.field_type === 'email' ? 'your@email.com' : f.field_type === 'phone' ? '(555) 000-0000' : ''}
                      style={inputStyle}
                      className="focus:ring-2 focus:ring-blue-500"
                      aria-required={f.is_required}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 flex items-center gap-3">
            <button type="button" onClick={onCancel}
              className="px-5 py-2.5 bg-transparent border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm">
              Back
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-5 py-2.5 bg-[#F5B731] text-[#0E1523] font-bold rounded-lg hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Redirecting...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Continue to Payment — {formatPrice(orderTotal)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Collaborate Modal ────────────────────────────────────────────────────────
function CollaborateModal({ event, userAdminOrgs, onClose }) {
  var [selectedOrgId, setSelectedOrgId] = useState(userAdminOrgs.length === 1 ? userAdminOrgs[0].id : '');
  var [message, setMessage] = useState('');
  var [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedOrgId) { toast.error('Please select your organization'); return; }
    setSending(true);
    try {
      var { data: existing } = await supabase
        .from('event_collaborators')
        .select('id, status')
        .eq('event_id', event.id)
        .eq('requesting_org_id', selectedOrgId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
          toast.error('Your organization is already a co-host for this event');
          setSending(false);
          return;
        }
        if (existing.status === 'pending') {
          toast.error('A collaboration request is already pending for this event');
          setSending(false);
          return;
        }
        var { error: updateErr } = await supabase
          .from('event_collaborators')
          .update({ status: 'pending', message: message.trim() || null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        var { error: insertErr } = await supabase
          .from('event_collaborators')
          .insert([{
            event_id: event.id,
            requesting_org_id: selectedOrgId,
            host_org_id: event.organization_id,
            status: 'pending',
            message: message.trim() || null,
          }]);
        if (insertErr) throw insertErr;
      }

      var selectedOrg = userAdminOrgs.find(function(o) { return o.id === selectedOrgId; });
      fetch(SUPABASE_URL + '/functions/v1/send-transactional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON_KEY },
        body: JSON.stringify({
          type: 'collab_request',
          data: {
            eventId: event.id,
            eventTitle: event.title,
            requestingOrgId: selectedOrgId,
            requestingOrgName: selectedOrg ? selectedOrg.name : '',
            hostOrgId: event.organization_id,
            message: message.trim() || '',
          },
        }),
      });

      mascotSuccessToast('Collaboration request sent!', 'The event organizer will review your request.');
      onClose();
    } catch (err) {
      mascotErrorToast('Failed to send request.', 'Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-modal-title"
      onClick={onClose}
    >
      <div
        style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '480px' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <h2 id="collab-modal-title" style={{ fontSize: '18px', fontWeight: 800, color: '#0E1523', margin: 0 }}>Request to Co-host</h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{event.title}</p>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userAdminOrgs.length > 1 && (
              <div>
                <label htmlFor="collab-org-select" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0E1523', marginBottom: '6px' }}>
                  Representing <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                </label>
                <select
                  id="collab-org-select"
                  value={selectedOrgId}
                  onChange={function(e) { setSelectedOrgId(e.target.value); }}
                  required
                  style={{ width: '100%', padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0E1523', outline: 'none' }}
                  className="focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select your organization...</option>
                  {userAdminOrgs.map(function(org) {
                    return <option key={org.id} value={org.id}>{org.name}</option>;
                  })}
                </select>
              </div>
            )}
            {userAdminOrgs.length === 1 && (
              <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
                Sending as <strong style={{ color: '#0E1523' }}>{userAdminOrgs[0].name}</strong>
              </div>
            )}
            <div>
              <label htmlFor="collab-message" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0E1523', marginBottom: '6px' }}>
                Message <span style={{ fontSize: '11px', fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
              </label>
              <textarea
                id="collab-message"
                value={message}
                onChange={function(e) { setMessage(e.target.value); }}
                placeholder="Briefly describe how your organization would like to collaborate..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', color: '#0E1523', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                className="focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
              The event organizer will receive your request and can accept or decline it in their inbox.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || (!selectedOrgId)}
              style={{ flex: 2, padding: '10px', background: '#8B5CF6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Sending...
                </>
              ) : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
function EventDetails() {
  var { eventId } = useParams();
  var navigate = useNavigate();
  var [event, setEvent] = useState(null);
  var [organization, setOrganization] = useState(null);
  var [coHosts, setCoHosts] = useState([]);
  var [sponsors, setSponsors] = useState([]);
  var [rsvps, setRsvps] = useState([]);
  var [userRsvp, setUserRsvp] = useState(null);
  var [currentUser, setCurrentUser] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [rsvpLoading, setRsvpLoading] = useState(false);
  var [rsvpSuccess, setRsvpSuccess] = useState(false);
  var [ticketLoading, setTicketLoading] = useState(false);
  var [ticketTypes, setTicketTypes] = useState([]);
  var [selections, setSelections] = useState({});
  var [checkoutFields, setCheckoutFields] = useState([]);
  var [showCheckoutForm, setShowCheckoutForm] = useState(false);
  var [showRecurringOptions, setShowRecurringOptions] = useState(false);
  var [recurringAction, setRecurringAction] = useState(null);
  var [showEditModal, setShowEditModal] = useState(false);
  var [editScope, setEditScope] = useState(null);
  var [showAttendanceReport, setShowAttendanceReport] = useState(false);
  var [isMember, setIsMember] = useState(false);
  var [guestRsvpCount, setGuestRsvpCount] = useState(0);
  var [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });
  var [guestRsvpLoading, setGuestRsvpLoading] = useState(false);
  var [guestRsvpSuccess, setGuestRsvpSuccess] = useState(false);
  var [savedEvent, setSavedEvent] = useState(false);
  var [savingEvent, setSavingEvent] = useState(false);
  var [showCollabModal, setShowCollabModal] = useState(false);
  var [userAdminOrgs, setUserAdminOrgs] = useState([]);

  var fetchEvent = async function() {
    try {
      setLoading(true);
      setError(null);
      var { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      var { data: eventData, error: eventError } = await supabase
        .from('events').select('*').eq('id', eventId).single();
      if (eventError) throw eventError;
      if (!eventData) { setError('Event not found'); setLoading(false); return; }
      setEvent(eventData);

      if (eventData.visibility !== 'public' && !user) { navigate('/login'); return; }

      var { data: orgData } = await supabase
        .from('organizations')
        .select('name, logo_url, slug')
        .eq('id', eventData.organization_id)
        .single();
      if (orgData) setOrganization(orgData);

      // Co-hosts
      var { data: collabRows } = await supabase
        .from('event_collaborators')
        .select('requesting_org_id')
        .eq('event_id', eventData.id)
        .eq('status', 'accepted');
      if (collabRows && collabRows.length > 0) {
        var coHostOrgIds = collabRows.map(function(r) { return r.requesting_org_id; });
        var { data: coHostOrgs } = await supabase
          .from('organizations')
          .select('id, name, logo_url')
          .in('id', coHostOrgIds);
        setCoHosts(coHostOrgs || []);
      } else {
        setCoHosts([]);
      }

      // Sponsors
      var { data: sponsorData } = await supabase
        .from('event_sponsors')
        .select('*')
        .eq('event_id', eventData.id)
        .order('display_order');
      setSponsors(sponsorData || []);

      if (user) {
        var { data: membership } = await supabase
          .from('memberships').select('role')
          .eq('member_id', user.id).eq('organization_id', eventData.organization_id).eq('status', 'active').single();
        if (membership) {
          setIsMember(true);
          if (membership.role === 'admin') setIsAdmin(true);
        }

        var saveResult = await supabase
          .from('event_saves')
          .select('event_id')
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .maybeSingle();
        setSavedEvent(!!saveResult.data);

        var { data: adminMemberships } = await supabase
          .from('memberships')
          .select('organization_id, organizations(id, name, logo_url)')
          .eq('member_id', user.id)
          .eq('role', 'admin')
          .eq('status', 'active')
          .neq('organization_id', eventData.organization_id);
        if (adminMemberships) {
          setUserAdminOrgs(adminMemberships.map(function(m) {
            return {
              id: m.organization_id,
              name: m.organizations ? m.organizations.name : '',
              logo_url: m.organizations ? m.organizations.logo_url : null,
            };
          }));
        }
      }

      var { count: guestCount } = await supabase
        .from('guest_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      setGuestRsvpCount(guestCount || 0);

      var { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('*, members(first_name, last_name, profile_photo_url)')
        .eq('event_id', eventId);
      if (rsvpData) {
        setRsvps(rsvpData);
        if (user) {
          var userResponse = rsvpData.find(function(r) { return r.member_id === user.id; });
          if (userResponse) setUserRsvp(userResponse.status);
        }
      }

      if (eventData.is_paid) {
        var { data: ttData } = await supabase
          .from('event_ticket_types').select('*').eq('event_id', eventData.id).order('sort_order');
        if (ttData && ttData.length > 0) {
          setTicketTypes(ttData);
          var initSel = {};
          ttData.forEach(function(tt) { initSel[tt.id] = 0; });
          setSelections(initSel);
        }
        var { data: cfData } = await supabase
          .from('event_checkout_fields').select('*').eq('event_id', eventData.id).order('sort_order');
        if (cfData) setCheckoutFields(cfData);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(function() {
    if (eventId) fetchEvent();
  }, [eventId]);

  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('ticket_success') !== '1') return;
    if (!currentUser || !event) return;
    window.history.replaceState({}, '', window.location.pathname);
    handleRsvp('going', true);
  }, [currentUser, event]);

  var handleSaveEvent = async function() {
    if (!currentUser) { toast.error('Please log in to save events'); return; }
    setSavingEvent(true);
    try {
      if (savedEvent) {
        var { error: delErr } = await supabase
          .from('event_saves')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('event_id', eventId);
        if (delErr) throw delErr;
        setSavedEvent(false);
        mascotSuccessToast('Removed from saved events.');
      } else {
        var { error: insErr } = await supabase
          .from('event_saves')
          .insert([{ user_id: currentUser.id, event_id: eventId }]);
        if (insErr) throw insErr;
        setSavedEvent(true);
        mascotSuccessToast('Event saved!');
      }
    } catch (err) {
      mascotErrorToast('Could not update saved events.', 'Please try again.');
    } finally {
      setSavingEvent(false);
    }
  };

  var getOrgUrl = function() {
    if (!organization) return APP_URL;
    if (organization.slug) return APP_URL + '/org/' + organization.slug;
    return APP_URL;
  };

  var handleRsvp = async function(status, fromTicket) {
    if (!currentUser) { toast.error('Please log in to RSVP'); navigate('/login'); return; }
    try {
      setRsvpLoading(true);
      setRsvpSuccess(false);
      var { error: upsertErr } = await supabase.from('event_rsvps')
        .upsert(
          { event_id: eventId, member_id: currentUser.id, status: status, guest_count: 0, updated_at: new Date().toISOString() },
          { onConflict: 'event_id,member_id' }
        );
      if (upsertErr) throw upsertErr;
      setUserRsvp(status);
      setRsvpSuccess(true);
      var { data: updatedRsvps } = await supabase
        .from('event_rsvps').select('*, members(first_name, last_name, profile_photo_url)').eq('event_id', eventId);
      if (updatedRsvps) setRsvps(updatedRsvps);
      if (status === 'going') {
        if (fromTicket) {
          mascotSuccessToast("You're going!", "Payment confirmed — see you there!");
        } else {
          mascotSuccessToast("You're going!", "RSVP updated successfully.");
        }
        var memberRes = await supabase.from('members').select('email, first_name').eq('user_id', currentUser.id).single();
        if (memberRes.data && memberRes.data.email) {
          var eventDate = new Date(event.start_time).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
          var eventTime = new Date(event.start_time).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
          var orgName = organization ? organization.name : '';
          var orgLogoUrl = organization ? (organization.logo_url || '') : '';
          var orgUrl = getOrgUrl();
          if (!orgName && event.organization_id) {
            var orgRefetch = await supabase.from('organizations')
              .select('name, logo_url, slug').eq('id', event.organization_id).single();
            if (orgRefetch.data) {
              orgName = orgRefetch.data.name || '';
              orgLogoUrl = orgRefetch.data.logo_url || '';
              orgUrl = orgRefetch.data.slug ? APP_URL + '/org/' + orgRefetch.data.slug : APP_URL;
            }
          }
          if (fromTicket) {
            var purchaseRes = await supabase.from('ticket_purchases').select('*')
              .eq('event_id', event.id).eq('member_id', currentUser.id).order('purchased_at', { ascending: false }).limit(10);
            var allPurchases = purchaseRes.data || [];
            var latestSessionId = allPurchases.length > 0 ? allPurchases[0].stripe_session_id : null;
            var purchases = latestSessionId
              ? allPurchases.filter(function(p) { return p.stripe_session_id === latestSessionId; })
              : allPurchases.slice(0, 1);
            var totalAmount = purchases.reduce(function(sum, p) { return sum + parseFloat(p.total_amount); }, 0);
            var lineItems = purchases.map(function(p) {
              return { name: p.ticket_type_name, quantity: p.quantity, unit_price: p.unit_price, total_amount: p.total_amount };
            });
            await fetch(SUPABASE_URL + '/functions/v1/send-transactional', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON_KEY },
              body: JSON.stringify({
                type: 'ticket_confirmation',
                data: {
                  memberEmail: memberRes.data.email,
                  eventTitle: event.title,
                  orgName: orgName,
                  orgLogoUrl: orgLogoUrl,
                  orgUrl: orgUrl,
                  eventDate: eventDate + ' at ' + eventTime,
                  eventLocation: event.is_virtual ? 'Virtual Event' : (event.location || ''),
                  eventUrl: window.location.origin + window.location.pathname,
                  startISO: event.start_time,
                  endISO: event.end_time || event.start_time,
                  eventId: event.id,
                  memberId: currentUser.id,
                  lineItems: lineItems,
                  totalAmount: totalAmount,
                },
              }),
            });
          } else {
            await fetch(SUPABASE_URL + '/functions/v1/send-transactional', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON_KEY },
              body: JSON.stringify({
                type: 'rsvp_confirmation',
                data: {
                  memberEmail: memberRes.data.email,
                  eventTitle: event.title,
                  orgName: orgName,
                  orgLogoUrl: orgLogoUrl,
                  orgUrl: orgUrl,
                  eventDate: eventDate + ' at ' + eventTime,
                  eventLocation: event.is_virtual ? 'Virtual Event' : (event.location || ''),
                  eventUrl: window.location.href,
                  startISO: event.start_time,
                  endISO: event.end_time || event.start_time,
                  eventId: event.id,
                },
              }),
            });
          }
        }
      } else {
        mascotSuccessToast('RSVP updated.');
      }
      setTimeout(function() { setRsvpSuccess(false); }, 3000);
    } catch (err) {
      console.error('RSVP error:', err);
      mascotErrorToast('Failed to update RSVP.', 'Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  var submitGuestRsvp = async function(e) {
    e.preventDefault();
    if (!guestInfo.name.trim() || !guestInfo.email.trim()) { toast.error('Name and email are required'); return; }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestInfo.email)) { toast.error('Please enter a valid email address'); return; }
    setGuestRsvpLoading(true);
    try {
      var { error: rsvpErr } = await supabase.from('guest_rsvps').insert([{
        event_id: eventId,
        guest_name: guestInfo.name.trim(),
        guest_email: guestInfo.email.toLowerCase().trim(),
        guest_phone: guestInfo.phone.trim() || null,
        status: 'going',
        guest_count: 1,
      }]);
      if (rsvpErr) {
        if (rsvpErr.code === '23505') { toast.error('You have already RSVP\'d to this event'); return; }
        throw rsvpErr;
      }
      setGuestRsvpSuccess(true);
      setGuestRsvpCount(function(prev) { return prev + 1; });
      var eventDate = new Date(event.start_time).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      var eventTime = new Date(event.start_time).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
      var orgName = organization ? organization.name : '';
      var orgLogoUrl = organization ? (organization.logo_url || '') : '';
      await fetch(SUPABASE_URL + '/functions/v1/send-transactional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON_KEY },
        body: JSON.stringify({
          type: 'guest_rsvp_confirmation',
          data: {
            guestEmail: guestInfo.email.toLowerCase().trim(),
            guestName: guestInfo.name.trim(),
            guestCount: 1,
            eventTitle: event.title,
            orgName: orgName,
            orgLogoUrl: orgLogoUrl,
            eventDate: eventDate + ' at ' + eventTime,
            eventLocation: event.is_virtual ? 'Virtual Event' : (event.location || ''),
            eventId: event.id,
            startISO: event.start_time,
            endISO: event.end_time || event.start_time,
            eventUrl: window.location.href,
          },
        }),
      });
    } catch (err) {
      mascotErrorToast('Failed to submit RSVP.', 'Please try again.');
    } finally {
      setGuestRsvpLoading(false);
    }
  };

  var getTotal = function() {
    var total = 0;
    ticketTypes.forEach(function(tt) {
      var qty = selections[tt.id] || 0;
      if (qty > 0) { var active = getActivePrice(tt); total += parseFloat(active.price) * qty; }
    });
    return total;
  };

  var getTotalQty = function() {
    var qty = 0;
    Object.values(selections).forEach(function(q) { qty += q; });
    return qty;
  };

  var updateQty = function(ttId, delta) {
    setSelections(function(prev) {
      var tt = ticketTypes.find(function(t) { return t.id === ttId; });
      var current = prev[ttId] || 0;
      var next = Math.max(0, current + delta);
      if (tt && tt.quantity_available != null) {
        var remaining = tt.quantity_available - (tt.quantity_sold || 0);
        next = Math.min(next, remaining);
      }
      next = Math.min(next, 20);
      var updated = Object.assign({}, prev);
      updated[ttId] = next;
      return updated;
    });
  };

  var handleCheckoutClick = function() {
    if (!currentUser) { toast.error('Please log in to purchase tickets'); navigate('/login'); return; }
    if (getTotalQty() === 0) { toast.error('Please select at least one ticket'); return; }
    if (checkoutFields.length > 0) {
      setShowCheckoutForm(true);
    } else {
      handleGetTicket(null);
    }
  };

  var handleGetTicket = async function(formResponses) {
    setShowCheckoutForm(false);
    try {
      setTicketLoading(true);
      if (formResponses && checkoutFields.length > 0) {
        await supabase.from('ticket_checkout_responses').insert([{
          event_id: event.id,
          member_id: currentUser.id,
          responses: formResponses,
        }]);
      }
      var memberRes = await supabase.from('members').select('email').eq('user_id', currentUser.id).single();
      var memberEmail = memberRes.data ? memberRes.data.email : '';
      var selArray = [];
      ticketTypes.forEach(function(tt) {
        var qty = selections[tt.id] || 0;
        if (qty > 0) selArray.push({ ticket_type_id: tt.id, quantity: qty });
      });
      var successUrl = window.location.origin + window.location.pathname + '?ticket_success=1';
      var cancelUrl = window.location.href;
      var res = await fetch(SUPABASE_URL + '/functions/v1/create-ticket-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON_KEY },
        body: JSON.stringify({
          event_id: event.id, member_id: currentUser.id, member_email: memberEmail,
          selections: selArray, success_url: successUrl, cancel_url: cancelUrl,
        }),
      });
      var data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not create checkout session');
      window.location.href = data.url;
    } catch (err) {
      console.error('Ticket error:', err);
      mascotErrorToast('Checkout failed.', err.message);
      setTicketLoading(false);
    }
  };

  var handleEditClick = function() {
    if (event.is_recurring || event.parent_event_id) { setRecurringAction('edit'); setShowRecurringOptions(true); }
    else { setEditScope(null); setShowEditModal(true); }
  };

  var handleRecurringEditOptionSelect = function(option) {
    setShowRecurringOptions(false); setEditScope(option);
    setTimeout(function() { setShowEditModal(true); }, 100);
  };

  var handleEventUpdated = function() { setShowEditModal(false); setEditScope(null); fetchEvent(); };

  var handleDeleteClick = function() {
    if (event.is_recurring || event.parent_event_id) { setRecurringAction('delete'); setShowRecurringOptions(true); }
    else handleDeleteRegular();
  };

  var handleDeleteRegular = async function() {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      var { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      mascotSuccessToast('Event deleted.');
      navigate('/events');
    } catch (err) {
      mascotErrorToast('Failed to delete event.', 'Please try again.');
    }
  };

  var handleRecurringOptionSelect = async function(option) {
    setShowRecurringOptions(false);
    if (recurringAction === 'edit') handleRecurringEditOptionSelect(option);
    else if (recurringAction === 'delete') {
      if (option === 'this') await handleDeleteInstance();
      else if (option === 'future') await handleDeleteFutureInstances();
      else if (option === 'all') await handleDeleteSeries();
    }
  };

  var handleDeleteInstance = async function() {
    if (!confirm('Delete only this event instance?')) return;
    try {
      var { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      mascotSuccessToast('Event deleted.');
      navigate('/events');
    } catch (err) {
      mascotErrorToast('Failed to delete event.', 'Please try again.');
    }
  };

  var handleDeleteFutureInstances = async function() {
    if (!confirm('Delete this and all future instances of this event?')) return;
    try {
      var parentId = event.parent_event_id || event.id;
      var { error } = await supabase.from('events').delete()
        .or('id.eq.' + eventId + ',and(parent_event_id.eq.' + parentId + ',start_time.gte.' + event.start_time + ')');
      if (error) throw error;
      mascotSuccessToast('Future instances deleted.');
      navigate('/events');
    } catch (err) {
      mascotErrorToast('Failed to delete event.', 'Please try again.');
    }
  };

  var handleDeleteSeries = async function() {
    if (!confirm('Delete this recurring event series?\n\nThis will permanently delete all current and future occurrences. Past occurrences will be preserved.\n\nThis action CANNOT be undone.')) return;
    try {
      var parentId = event.parent_event_id || event.id;
      var now = new Date().toISOString();
      var { error: e1 } = await supabase.from('events').delete().eq('id', parentId);
      if (e1) throw e1;
      var { error: e2 } = await supabase.from('events').delete().eq('parent_event_id', parentId).gte('start_time', now);
      if (e2) throw e2;
      mascotSuccessToast('Series deleted.', 'Past occurrences have been preserved.');
      navigate('/events');
    } catch (err) {
      mascotErrorToast('Failed to delete series.', 'Please try again.');
    }
  };

  var formatDate = function(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  };

  var formatTime = function(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
  };

  var getRsvpCounts = function() {
    return {
      going: rsvps.filter(function(r) { return r.status === 'going'; }).length,
      maybe: rsvps.filter(function(r) { return r.status === 'maybe'; }).length,
      not_going: rsvps.filter(function(r) { return r.status === 'not_going'; }).length,
    };
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]" aria-busy="true" aria-label="Loading event details">
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-5">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-28"/>
            <div className="h-8 bg-slate-200 rounded-lg animate-pulse w-2/3"/>
            <div className="h-4 bg-slate-200 rounded animate-pulse w-40"/>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-36 bg-slate-200 rounded-xl animate-pulse"/>
              <div className="h-36 bg-slate-200 rounded-xl animate-pulse"/>
              <div className="h-52 bg-slate-200 rounded-xl animate-pulse"/>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-slate-200 rounded-xl animate-pulse"/>
              <div className="h-32 bg-slate-200 rounded-xl animate-pulse"/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center"
          style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'}}
          role="alert">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#0E1523] mb-2">Event Not Found</h2>
          <p className="text-[#64748B] mb-6">{error || 'This event does not exist or you do not have permission to view it.'}</p>
          <Link to="/events"
            className="inline-block px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  var counts = getRsvpCounts();
  var isPastEvent = new Date(event.start_time) < new Date();
  var isPaidEvent = event.is_paid && ticketTypes.length > 0;
  var hasTicket = userRsvp === 'going';
  var totalQty = getTotalQty();
  var orderTotal = getTotal();
  var showCheckIn = event.enable_check_in !== false && isEventDay(event.start_time);

  var cardStyle = {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
  };

  var sectionLabel = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#F5B731',
    textTransform: 'uppercase',
    letterSpacing: '4px',
    marginBottom: '12px',
    display: 'block',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Top bar: back + save + admin actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={function() { navigate(-1); }}
              className="flex items-center gap-2 text-[#475569] hover:text-[#0E1523] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {currentUser && (
                <button
                  onClick={handleSaveEvent}
                  disabled={savingEvent}
                  aria-label={savedEvent ? 'Remove from saved events' : 'Save this event'}
                  aria-pressed={savedEvent}
                  className={'px-3 py-2 rounded-lg text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 flex items-center gap-1.5 ' + (savedEvent ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200')}
                >
                  {savedEvent ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5B731" stroke="#F5B731" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                  )}
                  {savedEvent ? 'Saved' : 'Save'}
                </button>
              )}
              <button onClick={function() { window.print(); }}
                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Print
              </button>
              {isAdmin && (
                <>
                  <button onClick={function() { setShowAttendanceReport(true); }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                    Full Report
                  </button>
                  <button onClick={handleEditClick}
                    className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Edit
                  </button>
                  <button onClick={handleDeleteClick}
                    className="px-3 py-2 bg-transparent border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title + badges */}
          <div className="flex items-start gap-3 flex-wrap">
            {event.is_recurring && (
              <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                Recurring
              </span>
            )}
            {isPaidEvent && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '8px',
                background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.35)',
                color: '#B45309', fontSize: '10px', fontWeight: 700, padding: '2px 10px',
                borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Ticketed Event
              </span>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-[#0E1523]">{event.title}</h1>
              {event.is_recurring && (
                <p className="text-sm text-blue-600 mt-1 font-semibold">
                  {event.parent_event_id ? 'Part of recurring series' : 'Recurring event series'}
                </p>
              )}
            </div>
          </div>

          {/* Org + co-hosts */}
          <div className="mt-2">
            {organization && (
              <p className="text-[#475569] font-medium">{organization.name}</p>
            )}
            {coHosts.length > 0 && (
              <div className="mt-1.5 space-y-1.5" aria-label="Co-hosting organizations">
                {coHosts.map(function(org) {
                  return (
                    <div key={org.id} className="flex items-center gap-2" aria-label={'Co-hosted with ' + org.name}>
                      <span style={{fontSize:'11px', fontWeight:600, color:'#94A3B8', minWidth:'84px'}}>Co-hosted with</span>
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name + ' logo'}
                          style={{width:'20px', height:'20px', borderRadius:'50%', objectFit:'cover', border:'1px solid #E2E8F0', flexShrink:0}}/>
                      ) : (
                        <div aria-hidden="true"
                          style={{width:'20px', height:'20px', borderRadius:'50%', background:'#F1F5F9', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700, color:'#64748B', flexShrink:0}}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{fontSize:'13px', fontWeight:600, color:'#475569'}}>{org.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {rsvpSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4" role="alert">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-green-700 font-semibold text-sm">
                    {isPaidEvent ? 'Ticket confirmed — see you there!' : 'RSVP updated successfully!'}
                  </p>
                </div>
              </div>
            )}

            {/* When & Where */}
            <section aria-labelledby="section-datetime" style={cardStyle}>
              <span id="section-datetime" style={sectionLabel}>When &amp; Where</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Date</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523' }}>{formatDate(event.start_time)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Time</p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523' }}>
                      {formatTime(event.start_time)}{event.end_time && ' – ' + formatTime(event.end_time)}
                    </p>
                  </div>
                  <AddToCalendarButton event={event} />
                </div>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    {event.is_virtual ? 'Format' : 'Location'}
                  </p>
                  {event.is_virtual ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#0E1523', margin: 0 }}>Virtual Event</p>
                      </div>
                      {event.virtual_link ? (
                        userRsvp === 'going' ? (
                          <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm">
                            Join Virtual Event
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </a>
                        ) : (
                          <p style={{ fontSize: '13px', color: '#64748B' }}>
                            {isPaidEvent ? 'Purchase a ticket to see the virtual event link.' : 'RSVP "Going" to see the virtual event link.'}
                          </p>
                        )
                      ) : (
                        <p style={{ fontSize: '13px', color: '#64748B' }}>Virtual event link will be shared closer to the event date.</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {event.location_name && (
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#0E1523', marginBottom: '2px' }}>{event.location_name}</p>
                      )}
                      {event.location && (
                        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>{event.location}</p>
                      )}
                      {event.location && (
                        <>
                          <a
                            href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((event.location_name ? event.location_name + ', ' : '') + (event.location || ''))}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600 }}
                            className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          >
                            Open in Maps →
                          </a>
                          <MapEmbed location={(event.location_name ? event.location_name + ', ' : '') + (event.location || '')} />
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Price</p>
                  {isPaidEvent && ticketTypes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {ticketTypes.map(function(tt) {
                        var active = getActivePrice(tt);
                        return (
                          <div key={tt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#475569' }}>{tt.name}</span>
                            <span style={{ fontWeight: 700, color: '#0E1523' }}>{formatPrice(active.price)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E' }}>Free</span>
                    </div>
                  )}
                </div>
                {isPastEvent && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>This event has already occurred.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Event flier */}
            {event.flier_url && (
              <section aria-labelledby="section-flier" style={cardStyle}>
                <span id="section-flier" style={sectionLabel}>Event Flier</span>
                <a href={event.flier_url} target="_blank" rel="noopener noreferrer" aria-label="View full event flier">
                  <img
                    src={event.flier_url}
                    alt={'Flier for ' + event.title}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'block' }}
                  />
                </a>
                <a
                  href={event.flier_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '13px', color: '#3B82F6', fontWeight: 600 }}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download flier
                </a>
              </section>
            )}

            {/* Description */}
            {event.description && (
              <section aria-labelledby="section-description" style={cardStyle}>
                <span id="section-description" style={sectionLabel}>Description</span>
                <p className="text-[#475569] whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </section>
            )}

            {/* Sponsors — shown to everyone, hidden if none */}
            <SponsorsSection sponsors={sponsors} cardStyle={cardStyle} sectionLabel={sectionLabel} />

            {/* Capacity */}
            {event.max_attendees && (
              <section aria-labelledby="section-capacity" style={cardStyle}>
                <span id="section-capacity" style={sectionLabel}>Capacity</span>
                <div className="flex items-center justify-between">
                  <p className="text-[#475569]">
                    <span className="text-2xl font-extrabold text-[#0E1523]">{counts.going + guestRsvpCount}</span>
                    <span className="text-[#64748B]"> / {event.max_attendees} spots filled</span>
                  </p>
                  {(counts.going + guestRsvpCount) >= event.max_attendees && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                      Event Full
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* QR Code */}
            <EventQRCode event={event} hideUrl />

            {/* Attendance Check-In — event day only */}
            {showCheckIn && (
              <AttendanceCheckIn
                event={event}
                currentUser={currentUser}
                userRole={isAdmin ? 'admin' : 'member'}
                organizationId={event.organization_id}
              />
            )}
          </div>

          {/* ── Right column ────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* RSVP / Ticket card — members only */}
            {!isPastEvent && currentUser && isMember && (
              <section aria-labelledby="section-rsvp" style={cardStyle}>
                {isPaidEvent ? (
                  <>
                    <span id="section-rsvp" style={sectionLabel}>Tickets</span>
                    <p className="text-[#64748B] text-xs mb-4">Processed securely via Stripe.</p>
                    {hasTicket ? (
                      <div className="space-y-3">
                        <div className="w-full px-4 py-3 rounded-lg font-semibold text-sm text-center bg-green-500 text-white flex items-center justify-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Ticket Confirmed
                        </div>
                        <div className="border-t border-slate-200 pt-3 space-y-2">
                          <button onClick={function() { handleRsvp('maybe'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 ' + (userRsvp==='maybe' ? 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-50 focus:ring-slate-400')}>
                            Maybe
                          </button>
                          <button onClick={function() { handleRsvp('not_going'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 ' + (userRsvp==='not_going' ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-50 focus:ring-slate-400')}>
                            Can't Go
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ticketTypes.map(function(tt) {
                          var active = getActivePrice(tt);
                          var qty = selections[tt.id] || 0;
                          var remaining = tt.quantity_available != null ? tt.quantity_available - (tt.quantity_sold || 0) : null;
                          var soldOut = remaining != null && remaining <= 0;
                          return (
                            <div key={tt.id} style={{
                              borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px',
                              background: soldOut ? '#F8FAFC' : '#FFFFFF', opacity: soldOut ? 0.55 : 1,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[#0E1523] font-semibold text-sm">{tt.name}</p>
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    <span className="text-[#B45309] font-bold text-sm">{formatPrice(active.price)}</span>
                                    {active.isEarlyBird && (
                                      <>
                                        <span className="text-[#94A3B8] line-through text-xs">{formatPrice(tt.price)}</span>
                                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Early Bird</span>
                                      </>
                                    )}
                                  </div>
                                  {active.isEarlyBird && tt.early_bird_ends_at && (
                                    <p className="text-xs text-[#64748B] mt-0.5">Ends {new Date(tt.early_bird_ends_at).toLocaleDateString('en-US', {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</p>
                                  )}
                                  {remaining != null && !soldOut && <p className="text-xs text-[#64748B] mt-0.5">{remaining} remaining</p>}
                                  {soldOut && <p className="text-xs text-red-500 mt-0.5 font-semibold">Sold Out</p>}
                                </div>
                                {!soldOut && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button type="button" onClick={function() { updateQty(tt.id, -1); }} disabled={qty===0}
                                      aria-label={'Decrease quantity for ' + tt.name}
                                      className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-[#0E1523] font-bold flex items-center justify-center hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-30">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                    <span className="w-6 text-center text-[#0E1523] font-bold text-sm" aria-live="polite">{qty}</span>
                                    <button type="button" onClick={function() { updateQty(tt.id, 1); }} disabled={remaining!=null&&qty>=remaining}
                                      aria-label={'Increase quantity for ' + tt.name}
                                      className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-[#0E1523] font-bold flex items-center justify-center hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-30">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {totalQty > 0 && (
                          <div className="flex items-center justify-between pt-1 px-1">
                            <span className="text-[#64748B] text-sm">{totalQty} ticket{totalQty!==1?'s':''}</span>
                            <span className="text-[#0E1523] font-bold">{formatPrice(orderTotal)}</span>
                          </div>
                        )}
                        <button onClick={handleCheckoutClick} disabled={ticketLoading||totalQty===0}
                          className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 ' + (totalQty===0 ? 'bg-slate-100 text-[#94A3B8] cursor-not-allowed' : 'bg-[#F5B731] text-[#0E1523] hover:bg-yellow-300') + (ticketLoading ? ' opacity-50' : '')}>
                          {ticketLoading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                              Redirecting...
                            </>
                          ) : totalQty === 0 ? 'Select tickets above' : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                              Checkout — {formatPrice(orderTotal)}
                            </>
                          )}
                        </button>
                        <div className="border-t border-slate-200 pt-3 space-y-2">
                          <button onClick={function() { handleRsvp('maybe'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 ' + (userRsvp==='maybe' ? 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-50 focus:ring-slate-400')}>
                            Maybe
                          </button>
                          <button onClick={function() { handleRsvp('not_going'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 ' + (userRsvp==='not_going' ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-50 focus:ring-slate-400')}>
                            Can't Go
                          </button>
                        </div>
                        <p className="text-xs text-[#94A3B8] text-center">You'll be redirected to Stripe to complete payment.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <span id="section-rsvp" style={sectionLabel}>Your RSVP</span>
                    <div className="space-y-3">
                      <button onClick={function() { handleRsvp('going'); }} disabled={rsvpLoading}
                        className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 ' + (userRsvp==='going' ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500' : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-50 focus:ring-slate-400')}>
                        Going
                      </button>
                      <button onClick={function() { handleRsvp('maybe'); }} disabled={rsvpLoading}
                        className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 ' + (userRsvp==='maybe' ? 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-50 focus:ring-slate-400')}>
                        Maybe
                      </button>
                      <button onClick={function() { handleRsvp('not_going'); }} disabled={rsvpLoading}
                        className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 ' + (userRsvp==='not_going' ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' : 'bg-white border border-slate-200 text-[#475569] hover:bg-slate-50 focus:ring-slate-400')}>
                        Can't Go
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Response counts — members only */}
            {isMember && (
              <section aria-labelledby="section-responses" style={cardStyle}>
                <span id="section-responses" style={sectionLabel}>Responses</span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569] text-sm">{isPaidEvent ? 'Tickets Sold' : 'Going'}</span>
                    <span className="font-bold text-green-600">{counts.going}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569] text-sm">Maybe</span>
                    <span className="font-bold text-yellow-600">{counts.maybe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#475569] text-sm">Can't Go</span>
                    <span className="font-bold text-red-500">{counts.not_going}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Going list — members only */}
            {isMember && counts.going > 0 && (
              <section aria-labelledby="section-going" style={cardStyle}>
                <span id="section-going" style={sectionLabel}>
                  {(isPaidEvent ? 'Attending (' : 'Going (') + counts.going + ')'}
                </span>
                <ul className="space-y-2" role="list">
                  {rsvps.filter(function(r) { return r.status==='going'; }).slice(0,10).map(function(rsvp) {
                    return (
                      <li key={rsvp.id} className="flex items-center gap-3" role="listitem">
                        {rsvp.members?.profile_photo_url ? (
                          <img src={rsvp.members.profile_photo_url}
                            alt={rsvp.members.first_name + ' ' + rsvp.members.last_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"/>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs" aria-hidden="true">
                            {rsvp.members?.first_name?.[0]}{rsvp.members?.last_name?.[0]}
                          </div>
                        )}
                        <span className="text-sm text-[#475569]">{rsvp.members?.first_name} {rsvp.members?.last_name}</span>
                      </li>
                    );
                  })}
                  {counts.going > 10 && <p className="text-sm text-[#64748B] mt-2">+ {counts.going - 10} more</p>}
                </ul>
              </section>
            )}

            {/* Guest RSVP — non-members, free public events */}
            {!isPastEvent && !isMember && !isPaidEvent && (
              <section aria-labelledby="section-guest-rsvp" style={cardStyle}>
                <span id="section-guest-rsvp" style={sectionLabel}>RSVP to this Event</span>
                {guestRsvpSuccess ? (
                  <div className="text-center py-4" role="status">
                    <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <p className="text-[#0E1523] font-bold text-base mb-1">You're on the list!</p>
                    <p className="text-[#64748B] text-sm">A confirmation has been sent to {guestInfo.email}.</p>
                  </div>
                ) : (
                  <form onSubmit={submitGuestRsvp} noValidate>
                    <div className="space-y-3">
                      {[
                        { id:'gr-name',  label:'Full Name',        type:'text',  key:'name',  required:true,  placeholder:'Jane Doe' },
                        { id:'gr-email', label:'Email Address',    type:'email', key:'email', required:true,  placeholder:'jane@example.com' },
                        { id:'gr-phone', label:'Phone (optional)', type:'tel',   key:'phone', required:false, placeholder:'(555) 123-4567' },
                      ].map(function(f) {
                        return (
                          <div key={f.id}>
                            <label htmlFor={f.id} className="block text-xs font-semibold text-[#475569] mb-1.5">
                              {f.label}
                              {f.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
                            </label>
                            <input
                              id={f.id} type={f.type} required={f.required}
                              value={guestInfo[f.key]}
                              placeholder={f.placeholder}
                              onChange={function(e) { var u = {}; u[f.key] = e.target.value; setGuestInfo(function(p) { return Object.assign({}, p, u); }); }}
                              className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[#0E1523] text-sm placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-required={f.required}
                            />
                          </div>
                        );
                      })}
                      <button type="submit" disabled={guestRsvpLoading}
                        className="w-full px-4 py-3 bg-blue-500 text-white font-bold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2">
                        {guestRsvpLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                            Submitting...
                          </>
                        ) : 'RSVP to this Event'}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* Paid event — non-members */}
            {!isPastEvent && !isMember && isPaidEvent && (
              <section aria-labelledby="section-tickets-gate" style={cardStyle} className="text-center">
                <span id="section-tickets-gate" style={sectionLabel}>Tickets</span>
                <p className="text-[#475569] text-sm mb-4">You need to be a member of this organization to purchase tickets.</p>
                <Link to="/signup"
                  className="inline-block px-5 py-2.5 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Join to Get Tickets
                </Link>
              </section>
            )}

            {/* Co-host request — org admins of other orgs */}
            {currentUser && userAdminOrgs.length > 0 && (
              <section aria-labelledby="section-cohost" style={cardStyle}>
                <span id="section-cohost" style={sectionLabel}>Co-host This Event</span>
                <p className="text-[#475569] text-sm mb-3">Interested in co-hosting? Send a collaboration request to the event organizer.</p>
                <button
                  onClick={function() { setShowCollabModal(true); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: '#8B5CF6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Request to Co-host
                </button>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showCheckoutForm && (
        <CheckoutFormModal
          fields={checkoutFields}
          totalQty={totalQty}
          orderTotal={orderTotal}
          onSubmit={handleGetTicket}
          onCancel={function() { setShowCheckoutForm(false); }}
        />
      )}
      {showCollabModal && (
        <CollaborateModal
          event={event}
          userAdminOrgs={userAdminOrgs}
          onClose={function() { setShowCollabModal(false); }}
        />
      )}
      {showRecurringOptions && (
        <RecurringEventOptions
          event={event}
          action={recurringAction}
          onSelect={handleRecurringOptionSelect}
          onCancel={function() { setShowRecurringOptions(false); setRecurringAction(null); }}
        />
      )}
      {showEditModal && (
        <EditEvent
          isOpen={showEditModal}
          onClose={function() { setShowEditModal(false); setEditScope(null); }}
          onSuccess={handleEventUpdated}
          event={event}
          editScope={editScope}
          isRecurring={event.is_recurring || !!event.parent_event_id}
        />
      )}
      {showAttendanceReport && (
        <AttendanceReport
          event={event}
          onClose={function() { setShowAttendanceReport(false); }}
        />
      )}
    </div>
  );
}

export default EventDetails;