import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { AlertTriangle, BookmarkIcon, BookmarkCheck, Users, RefreshCw } from 'lucide-react';

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

// ── Predefined tags ───────────────────────────────────────────────────────────
var PROGRAM_TAGS = [
  'Education','Youth','Seniors','Health','Food Access','Housing',
  'Employment','Legal Aid','Arts','Environment','Immigration',
  'Disability','Mental Health','Sports','Technology','Financial Aid',
];

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
  mail:        ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  user:        'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:       ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'],
  clock:       ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  calendar:    ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
  globe:       ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  tag:         ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronUp:   'M5 15l7-7 7 7',
  grip:        'M4 6h16M4 10h16M4 14h16',
  check:       'M5 13l4 4L19 7',
  settings:    ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  lock:        ['M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'],
  unlock:      ['M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'],
  xCircle:     ['M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'],
  refresh:     ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
};

var EMPTY_FORM = {
  name: '', description: '', audience: '', schedule: '',
  start_date: '', end_date: '',
  capacity: '', enrolled_count: '',
  how_to_apply: '', contact_name: '', contact_email: '',
  status: 'active', is_public: true, publish_to_discovery: false,
  requires_approval: false, registration_open: true,
  tags: [],
};

function formatDate(ds) {
  if (!ds) return null;
  var d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            <h2 id="confirm-prog-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0E1523', margin: '0 0 4px' }}>{title}</h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'transparent', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#EF4444', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >{confirmLabel || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Registrations drawer ──────────────────────────────────────────────────────
function RegistrationsDrawer({ program, organizationId, onClose }) {
  var trapRef = useFocusTrap(true);
  var [registrations, setRegistrations] = useState([]);
  var [loading, setLoading]             = useState(true);

  useEffect(function() {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, []);

  useEffect(function() {
    loadRegistrations();
  }, [program.id]);

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

    // Fetch member names
    var userIds = rows.map(function(r) { return r.user_id; });
    var membersResult = await supabase
      .from('members')
      .select('user_id, first_name, last_name')
      .in('user_id', userIds);
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

  var enrolled = registrations.filter(function(r) { return r.status === 'enrolled'; });
  var pending  = registrations.filter(function(r) { return r.status === 'pending'; });
  var declined = registrations.filter(function(r) { return r.status === 'declined'; });
  var cancelled = registrations.filter(function(r) { return r.status === 'cancelled'; });

  function statusBadge(status) {
    var cfg = {
      enrolled:  { bg: 'rgba(34,197,94,0.1)',  color: '#22C55E', label: 'Enrolled' },
      pending:   { bg: 'rgba(245,183,49,0.15)', color: '#B45309', label: 'Pending' },
      declined:  { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', label: 'Declined' },
      cancelled: { bg: 'rgba(100,116,139,0.1)', color: '#64748B', label: 'Cancelled' },
    };
    var c = cfg[status] || cfg.pending;
    return (
      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: c.bg, color: c.color }}>
        {c.label}
      </span>
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
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid ' + BDR, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h2 id="reg-drawer-title" style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: '0 0 2px' }}>Registrations</h2>
            <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>{program.name}</p>
          </div>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, flexShrink: 0 }} className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Close registrations">
            <Icon path={ICONS.x} className="h-5 w-5" />
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: BDR, borderBottom: '1px solid ' + BDR }}>
          {[
            { label: 'Enrolled', count: enrolled.length, color: '#22C55E' },
            { label: 'Pending',  count: pending.length,  color: '#F59E0B' },
            { label: 'Declined', count: declined.length, color: '#EF4444' },
          ].map(function(s) {
            return (
              <div key={s.label} style={{ background: CARD_BG, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '11px', color: MUTED }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ padding: '16px 24px', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(function(i) {
                return (
                  <div key={i} style={{ height: '60px', background: ELEVATED, borderRadius: '8px' }} className="animate-pulse" />
                );
              })}
            </div>
          ) : registrations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <Users size={36} style={{ color: MUTED, margin: '0 auto 12px' }} aria-hidden="true" />
              <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>No registrations yet</p>
              <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>Members who register will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pending.length > 0 && (
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 4px' }}>Needs Review</p>
              )}
              {pending.map(function(r) {
                return (
                  <div key={r.id} style={{ background: 'rgba(245,183,49,0.06)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{r.member_name}</p>
                      <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={function() { updateStatus(r.id, 'enrolled'); }}
                        style={{ padding: '5px 12px', background: '#22C55E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        aria-label={'Approve ' + r.member_name}
                      >Approve</button>
                      <button
                        onClick={function() { updateStatus(r.id, 'declined'); }}
                        style={{ padding: '5px 12px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={'Decline ' + r.member_name}
                      >Decline</button>
                    </div>
                  </div>
                );
              })}

              {enrolled.length > 0 && (
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '8px 0 4px' }}>Enrolled</p>
              )}
              {enrolled.map(function(r) {
                return (
                  <div key={r.id} style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{r.member_name}</p>
                      <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                );
              })}

              {(declined.length > 0 || cancelled.length > 0) && (
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '8px 0 4px' }}>Other</p>
              )}
              {declined.concat(cancelled).map(function(r) {
                return (
                  <div key={r.id} style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', opacity: 0.65 }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{r.member_name}</p>
                      <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function OrgPrograms() {
  var params         = useParams();
  var organizationId = params.organizationId;
  var navigate       = useNavigate();
  var outletCtx      = useOutletContext() || {};
  var isAdmin        = outletCtx.isAdmin === true;

  var [programs, setPrograms]         = useState([]);
  var [loading, setLoading]           = useState(true);
  var [loadError, setLoadError]       = useState(false);
  var [organization, setOrganization] = useState(null);
  var [currentUserId, setCurrentUserId] = useState(null);

  // Saves (bookmarks) — set of program IDs saved by current user
  var [savedIds, setSavedIds]         = useState(new Set());
  // Registrations — map of program_id -> registration row for current user
  var [myRegistrations, setMyRegistrations] = useState({});

  // Modal
  var [showModal, setShowModal]           = useState(false);
  var [editingProgram, setEditingProgram] = useState(null);
  var [form, setForm]                     = useState(EMPTY_FORM);
  var [saving, setSaving]                 = useState(false);
  var [newTagInput, setNewTagInput]       = useState('');
  var [showSettingsTab, setShowSettingsTab] = useState(false);
  var modalTrapRef = useFocusTrap(showModal);

  // ConfirmModal
  var [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });

  // Registrations drawer
  var [drawerProgram, setDrawerProgram] = useState(null);

  // Card UI
  var [expandedId, setExpandedId]   = useState(null);

  // Drag & drop
  var [draggingId, setDraggingId]   = useState(null);
  var [dragOverId, setDragOverId]   = useState(null);
  var [savingOrder, setSavingOrder] = useState(false);

  // Filters
  var [statusFilter, setStatusFilter] = useState('all');
  var [sortBy, setSortBy]             = useState('custom');
  var [searchQuery, setSearchQuery]   = useState('');

  function openConfirm(title, message, confirmLabel, onConfirmFn) {
    setConfirmModal({ open: true, title: title, message: message, confirmLabel: confirmLabel, onConfirm: onConfirmFn });
  }
  function closeConfirm() {
    setConfirmModal({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });
  }

  useEffect(function() { init(); }, [organizationId]);

  // Close modal on Escape
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
        .from('organizations').select('id, name, logo_url')
        .eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

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
      .from('org_programs').select('*')
      .eq('organization_id', organizationId)
      .order('sort_order').order('created_at');
    if (result.error) throw result.error;
    setPrograms(result.data || []);
  }

  async function fetchSaves(uid) {
    var result = await supabase
      .from('program_saves')
      .select('program_id')
      .eq('user_id', uid);
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

  // ── CRUD ──────────────────────────────────────────────────────────────────
  function openNew() {
    setEditingProgram(null);
    setForm(EMPTY_FORM);
    setNewTagInput('');
    setShowSettingsTab(false);
    setShowModal(true);
  }

  function openEdit(program) {
    setEditingProgram(program);
    setForm({
      name:                 program.name || '',
      description:          program.description || '',
      audience:             program.audience || '',
      schedule:             program.schedule || '',
      start_date:           program.start_date || '',
      end_date:             program.end_date || '',
      capacity:             program.capacity != null ? String(program.capacity) : '',
      enrolled_count:       '',
      how_to_apply:         program.how_to_apply || '',
      contact_name:         program.contact_name || '',
      contact_email:        program.contact_email || '',
      status:               program.status || 'active',
      is_public:            program.is_public !== false,
      publish_to_discovery: program.publish_to_discovery === true,
      requires_approval:    program.requires_approval === true,
      registration_open:    program.registration_open !== false,
      tags:                 program.tags || [],
    });
    setNewTagInput('');
    setShowSettingsTab(false);
    setShowModal(true);
  }

  async function saveProgram() {
    if (!form.name.trim()) { toast.error('Program name is required'); return; }
    setSaving(true);
    var safeForm = Object.assign({}, form);
    if (!safeForm.is_public) safeForm.publish_to_discovery = false;
    var payload = {
      organization_id:      organizationId,
      name:                 safeForm.name.trim(),
      description:          safeForm.description || null,
      audience:             safeForm.audience || null,
      schedule:             safeForm.schedule || null,
      start_date:           safeForm.start_date || null,
      end_date:             safeForm.end_date || null,
      capacity:             safeForm.capacity !== '' ? parseInt(safeForm.capacity, 10) : null,
      how_to_apply:         safeForm.how_to_apply || null,
      contact_name:         safeForm.contact_name || null,
      contact_email:        safeForm.contact_email || null,
      status:               safeForm.status,
      is_public:            safeForm.is_public,
      publish_to_discovery: safeForm.publish_to_discovery,
      requires_approval:    safeForm.requires_approval,
      registration_open:    safeForm.registration_open,
      tags:                 safeForm.tags || [],
      updated_at:           new Date().toISOString(),
    };
    var result = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);
    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save program.', 'Check your connection and try again.'); return; }
    mascotSuccessToast(editingProgram ? 'Program updated!' : 'Program created!');
    setShowModal(false);
    fetchPrograms();
    if (!editingProgram) {
      try {
        var notifModule = await import('../lib/notificationService');
        var authRes = await supabase.auth.getUser();
        await notifModule.notifyOrganizationMembers({
          organizationId: organizationId,
          type: 'new_program',
          title: form.name.trim(),
          message: (organization ? organization.name : 'Your organization') + ' added a new program.',
          link: '/organizations/' + organizationId + '/programs',
          excludeUserId: authRes.data.user ? authRes.data.user.id : null,
        });
        window.dispatchEvent(new CustomEvent('notificationCreated'));
      } catch(ne) { console.error('Program notification failed:', ne); }
    }
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
    var payload = {
      organization_id:      organizationId,
      name:                 program.name + ' (Copy)',
      description:          program.description || null,
      audience:             program.audience || null,
      schedule:             program.schedule || null,
      start_date:           program.start_date || null,
      end_date:             program.end_date || null,
      capacity:             program.capacity || null,
      how_to_apply:         program.how_to_apply || null,
      contact_name:         program.contact_name || null,
      contact_email:        program.contact_email || null,
      status:               program.status,
      is_public:            false,
      publish_to_discovery: false,
      requires_approval:    program.requires_approval,
      registration_open:    program.registration_open,
      tags:                 program.tags || [],
      sort_order:           programs.length,
      updated_at:           new Date().toISOString(),
    };
    var result = await supabase.from('org_programs').insert(payload);
    if (result.error) { mascotErrorToast('Failed to copy program.', result.error.message); return; }
    mascotSuccessToast('Program copied — it is hidden until you publish it.');
    fetchPrograms();
  }

  // ── Visibility toggles ────────────────────────────────────────────────────
  async function togglePublic(program) {
    var updates = { is_public: !program.is_public };
    if (!updates.is_public) updates.publish_to_discovery = false;
    var result = await supabase.from('org_programs').update(updates).eq('id', program.id);
    if (result.error) { mascotErrorToast('Failed to update visibility.'); return; }
    setPrograms(function(prev) {
      return prev.map(function(p) { return p.id === program.id ? Object.assign({}, p, updates) : p; });
    });
  }

  async function toggleDiscovery(program) {
    if (!program.is_public) { toast.error('Enable "Show on org page" first'); return; }
    var newVal = !program.publish_to_discovery;
    var result = await supabase.from('org_programs').update({ publish_to_discovery: newVal }).eq('id', program.id);
    if (result.error) { mascotErrorToast('Failed to update Discover visibility.'); return; }
    setPrograms(function(prev) {
      return prev.map(function(p) { return p.id === program.id ? Object.assign({}, p, { publish_to_discovery: newVal }) : p; });
    });
    mascotSuccessToast(newVal ? 'Added to Discover.' : 'Removed from Discover.');
  }

  // ── Bookmark (save) ───────────────────────────────────────────────────────
  async function toggleSave(programId) {
    if (!currentUserId) return;
    var isSaved = savedIds.has(programId);
    if (isSaved) {
      var result = await supabase.from('program_saves').delete()
        .eq('program_id', programId).eq('user_id', currentUserId);
      if (result.error) { mascotErrorToast('Failed to remove bookmark.'); return; }
      setSavedIds(function(prev) { var next = new Set(prev); next.delete(programId); return next; });
    } else {
      var result2 = await supabase.from('program_saves').insert({ program_id: programId, user_id: currentUserId });
      if (result2.error) { mascotErrorToast('Failed to save program.'); return; }
      setSavedIds(function(prev) { var next = new Set(prev); next.add(programId); return next; });
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────
  async function handleRegister(program) {
    if (!currentUserId) { navigate('/login'); return; }

    // Check capacity
    var enrolledCount = await supabase
      .from('program_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('status', 'enrolled');
    var cap = program.capacity;
    if (cap != null && enrolledCount.count >= cap) {
      toast.error('This program is full.');
      return;
    }

    var status = program.requires_approval ? 'pending' : 'enrolled';
    var result = await supabase.from('program_registrations').insert({
      program_id: program.id,
      user_id: currentUserId,
      organization_id: organizationId,
      status: status,
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

    // Notify admins
    try {
      var notifModule = await import('../lib/notificationService');
      var authRes = await supabase.auth.getUser();
      var membersRes = await supabase.from('members').select('first_name, last_name').eq('user_id', authRes.data.user.id).single();
      var memberName = membersRes.data ? membersRes.data.first_name + ' ' + membersRes.data.last_name : 'A member';
      await notifModule.notifyOrgAdmins({
        organizationId: organizationId,
        type: 'program_registration',
        title: program.name,
        message: memberName + (status === 'enrolled' ? ' registered for ' : ' requested to join ') + program.name + '.',
        link: '/organizations/' + organizationId + '/programs',
        excludeUserId: currentUserId,
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch(ne) { console.error('Registration notification failed:', ne); }
  }

  async function handleCancelRegistration(program) {
    var reg = myRegistrations[program.id];
    if (!reg) return;
    openConfirm(
      'Cancel registration?',
      'You will be removed from ' + program.name + '. You can re-register later if spots are available.',
      'Cancel Registration',
      async function() {
        closeConfirm();
        var result = await supabase.from('program_registrations')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', reg.id);
        if (result.error) { mascotErrorToast('Failed to cancel registration.'); return; }
        setMyRegistrations(function(prev) {
          var next = Object.assign({}, prev);
          delete next[program.id];
          return next;
        });
        mascotSuccessToast('Registration cancelled.');
      }
    );
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  function toggleTag(tag) {
    setForm(function(prev) {
      var tags = prev.tags || [];
      var idx  = tags.indexOf(tag);
      return Object.assign({}, prev, {
        tags: idx === -1 ? tags.concat([tag]) : tags.filter(function(t) { return t !== tag; }),
      });
    });
  }

  function addCustomTag() {
    var tag = newTagInput.trim();
    if (!tag) return;
    setForm(function(prev) {
      var tags = prev.tags || [];
      if (tags.indexOf(tag) === -1) tags = tags.concat([tag]);
      return Object.assign({}, prev, { tags: tags });
    });
    setNewTagInput('');
  }

  function removeTag(tag) {
    setForm(function(prev) {
      return Object.assign({}, prev, { tags: (prev.tags || []).filter(function(t) { return t !== tag; }) });
    });
  }

  function setField(key, value) {
    setForm(function(prev) {
      var update = {};
      update[key] = value;
      if (key === 'is_public' && !value) update.publish_to_discovery = false;
      return Object.assign({}, prev, update);
    });
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function handleDragStart(id, e) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }

  function handleDragOver(id, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  }

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
    var promises = ordered.map(function(p, i) {
      return supabase.from('org_programs').update({ sort_order: i }).eq('id', p.id);
    });
    var results = await Promise.all(promises);
    setSavingOrder(false);
    if (results.some(function(r) { return r.error; })) {
      toast.error('Failed to save order — try again');
    } else {
      mascotSuccessToast('Order saved.');
    }
  }

  // ── Computed view ─────────────────────────────────────────────────────────
  var isDragEnabled = isAdmin && sortBy === 'custom' && statusFilter === 'all' && !searchQuery.trim();

  var statusCounts = {
    all:      programs.length,
    active:   programs.filter(function(p) { return p.status === 'active'; }).length,
    upcoming: programs.filter(function(p) { return p.status === 'upcoming'; }).length,
    closed:   programs.filter(function(p) { return p.status === 'closed'; }).length,
  };

  var displayPrograms = programs
    .filter(function(p) {
      if (!isAdmin && !p.is_public) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        var q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().indexOf(q) !== -1 ||
          (p.description || '').toLowerCase().indexOf(q) !== -1 ||
          (p.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) !== -1; })
        );
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

  var inputStyle  = { width: '100%', padding: '8px 12px', background: INPUT_BG, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '14px', color: TEXT, outline: 'none', boxSizing: 'border-box' };
  var labelStyle  = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' };

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
              <div key={i} style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '12px', padding: '20px' }} className="animate-pulse">
                <div style={{ height: '15px', width: '60%', background: BDR, borderRadius: '4px', marginBottom: '10px' }} />
                <div style={{ height: '20px', width: '80px', background: ELEVATED, borderRadius: '99px', marginBottom: '12px' }} />
                <div style={{ height: '12px', width: '90%', background: ELEVATED, borderRadius: '4px', marginBottom: '6px' }} />
                <div style={{ height: '12px', width: '70%', background: ELEVATED, borderRadius: '4px', marginBottom: '16px' }} />
                <div style={{ height: '32px', background: ELEVATED, borderRadius: '8px' }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '360px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={24} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: '0 0 8px' }}>Failed to load programs</h2>
          <p style={{ fontSize: '13px', color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>Something went wrong. Check your connection and try again.</p>
          <button
            onClick={init}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Try Again
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
            <p style={{ fontSize: '14px', color: MUTED, margin: '4px 0 0' }}>
              {programs.length + ' program' + (programs.length !== 1 ? 's' : '')}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openNew}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Icon path={ICONS.plus} className="h-4 w-4" />
              Add Program
            </button>
          )}
        </div>

        {/* Filter / sort bar */}
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
              {[
                { key: 'all',      label: 'All' },
                { key: 'active',   label: 'Active' },
                { key: 'upcoming', label: 'Upcoming' },
                { key: 'closed',   label: 'Closed' },
              ].map(function(f) {
                var active = statusFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={function() { setStatusFilter(f.key); }}
                    style={{ padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', background: active ? '#0E1523' : ELEVATED, color: active ? '#FFFFFF' : TEXT2 }}
                    className="focus:outline-none focus:ring-2 focus:ring-slate-400"
                    aria-pressed={active}
                  >
                    {f.label}
                    <span style={{ marginLeft: '5px', fontSize: '11px', opacity: 0.7 }}>{statusCounts[f.key]}</span>
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

        {/* Empty state — no programs */}
        {programs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: CARD_BG, border: '2px dashed ' + BDR, borderRadius: '12px' }} role="region" aria-label="No programs">
            <div style={{ color: MUTED, marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Icon path={ICONS.programs} className="h-14 w-14" sw={1} />
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>No programs yet</h2>
            <p style={{ color: MUTED, fontSize: '13px', maxWidth: '280px', margin: '0 auto 24px' }}>
              {isAdmin ? 'Add your first program to share with your community.' : 'This organization has not added any programs yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={openNew}
                style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >Add Your First Program</button>
            )}
          </div>
        ) : displayPrograms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '12px' }}>
            <div style={{ color: MUTED, marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <Icon path={ICONS.search} className="h-10 w-10" sw={1} />
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>No programs match your filters</h2>
            <p style={{ color: MUTED, fontSize: '13px', marginBottom: '16px' }}>Try adjusting your search or status filter.</p>
            <button
              onClick={function() { setSearchQuery(''); setStatusFilter('all'); }}
              style={{ padding: '8px 16px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: TEXT2, cursor: 'pointer' }}
              className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >Clear Filters</button>
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}
            role="list" aria-label="Programs"
          >
            {displayPrograms.map(function(program) {
              var enrolled     = program.enrolled_count || 0;
              var cap          = program.capacity;
              var capPct       = cap ? Math.min(100, Math.round(enrolled / cap * 100)) : null;
              var capBarColor  = capPct >= 100 ? '#EF4444' : capPct >= 75 ? '#F59E0B' : '#22C55E';
              var isClosed     = program.status === 'closed';
              var isExpanded   = expandedId === program.id;
              var isDragging   = draggingId === program.id;
              var isDragTarget = dragOverId === program.id && draggingId !== program.id;
              var startFmt     = formatDate(program.start_date);
              var endFmt       = formatDate(program.end_date);
              var hasExpand    = !!(program.how_to_apply || program.contact_name);
              var isSaved      = savedIds.has(program.id);
              var myReg        = myRegistrations[program.id];
              var isFull       = cap != null && enrolled >= cap;
              var regOpen      = program.registration_open !== false && !isClosed;

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
                    background:    program.is_public ? CARD_BG : CARD_ALT,
                    border:        isDragTarget ? '2px solid #3B82F6' : '1px solid ' + BDR,
                    borderRadius:  '12px',
                    padding:       '20px',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           '10px',
                    opacity:       isClosed ? 0.65 : isDragging ? 0.4 : 1,
                    cursor:        isDragEnabled ? 'grab' : 'default',
                    transition:    'opacity 0.2s, border-color 0.15s',
                  }}
                >
                  {isDragEnabled && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-4px', color: MUTED, opacity: 0.4 }} aria-hidden="true">
                      <Icon path={ICONS.grip} className="h-4 w-4" />
                    </div>
                  )}

                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.3 }}>{program.name}</h2>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      {/* Bookmark button — always visible to non-admins */}
                      {!isAdmin && (
                        <button
                          onClick={function(e) { e.stopPropagation(); toggleSave(program.id); }}
                          style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#F5B731' : MUTED }}
                          className={'focus:outline-none focus:ring-2 focus:ring-yellow-400 ' + (isSaved ? '' : 'hover:text-yellow-500')}
                          aria-label={isSaved ? 'Remove bookmark for ' + program.name : 'Bookmark ' + program.name}
                          aria-pressed={isSaved}
                        >
                          {isSaved
                            ? <BookmarkCheck size={16} aria-hidden="true" />
                            : <BookmarkIcon size={16} aria-hidden="true" />}
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={function(e) { e.stopPropagation(); setDrawerProgram(program); }}
                            style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                            className="hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            aria-label={'View registrations for ' + program.name}
                          >
                            <Icon path={ICONS.users} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={function(e) { e.stopPropagation(); openEdit(program); }}
                            style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                            className="hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={'Edit ' + program.name}
                          >
                            <Icon path={ICONS.pencil} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={function(e) { e.stopPropagation(); copyProgram(program); }}
                            style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                            className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            aria-label={'Copy ' + program.name}
                          >
                            <Icon path={ICONS.copy} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={function(e) { e.stopPropagation(); deleteProgram(program.id, program.name); }}
                            style={{ padding: '5px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
                            className="hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={'Delete ' + program.name}
                          >
                            <Icon path={ICONS.trash} className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status + visibility badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px',
                      background: program.status === 'active'   ? 'rgba(34,197,94,0.12)'
                                : program.status === 'upcoming' ? 'rgba(59,130,246,0.12)'
                                :                                  'rgba(100,116,139,0.12)',
                      color:      program.status === 'active'   ? '#22C55E'
                                : program.status === 'upcoming' ? '#3B82F6'
                                :                                  '#64748B',
                    }}>
                      {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                    </span>
                    {program.publish_to_discovery && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                        <Icon path={ICONS.globe} className="h-3 w-3" />
                        On Discover
                      </span>
                    )}
                    {isAdmin && !program.is_public && (
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(245,183,49,0.12)', color: '#B45309' }}>Hidden</span>
                    )}
                    {program.requires_approval && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(100,116,139,0.1)', color: '#475569' }}>
                        <Icon path={ICONS.lock} className="h-3 w-3" />
                        Approval required
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
                        return (
                          <span key={tag} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: ELEVATED, color: TEXT2, border: '1px solid ' + BDR }}>
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Capacity bar */}
                  {cap != null && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: MUTED }}>
                          <Icon path={ICONS.users} className="h-3.5 w-3.5" />
                          <span>Enrolled</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: capPct >= 100 ? '#EF4444' : TEXT2 }}>
                          {capPct >= 100 ? 'Full' : enrolled + ' / ' + cap}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: BDR, borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: capPct + '%', height: '100%', background: capBarColor, borderRadius: '99px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {program.description && (
                    <p style={{
                      fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0,
                      overflow: isExpanded ? 'visible' : 'hidden',
                      display: isExpanded ? 'block' : '-webkit-box',
                      WebkitLineClamp: isExpanded ? 'unset' : 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {program.description}
                    </p>
                  )}

                  {/* Date range */}
                  {(startFmt || endFmt) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                      <Icon path={ICONS.calendar} className="h-3.5 w-3.5" />
                      <span>
                        {startFmt && endFmt ? startFmt + ' – ' + endFmt : startFmt ? 'Starts ' + startFmt : 'Ends ' + endFmt}
                      </span>
                    </div>
                  )}

                  {/* Audience / schedule */}
                  {(program.audience || program.schedule) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {program.audience && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                          <Icon path={ICONS.user} className="h-3.5 w-3.5" />
                          <span>For: {program.audience}</span>
                        </div>
                      )}
                      {program.schedule && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                          <Icon path={ICONS.clock} className="h-3.5 w-3.5" />
                          <span>{program.schedule}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expandable section */}
                  {hasExpand && (
                    <>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {program.how_to_apply && (
                            <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '8px' }}>
                              <p style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 4px' }}>How to Apply</p>
                              <p style={{ fontSize: '13px', color: TEXT2, margin: 0 }}>{program.how_to_apply}</p>
                            </div>
                          )}
                          {program.contact_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: MUTED }}>
                              <Icon path={ICONS.user} className="h-3.5 w-3.5" />
                              <span>Contact: {program.contact_name}</span>
                              {program.contact_email && (
                                <a href={'mailto:' + program.contact_email} style={{ color: '#3B82F6', display: 'flex', marginLeft: '2px' }} className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded" aria-label={'Email ' + program.contact_name}>
                                  <Icon path={ICONS.mail} className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={function(e) { e.stopPropagation(); setExpandedId(isExpanded ? null : program.id); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', alignSelf: 'flex-start' }}
                        className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                        aria-expanded={isExpanded}
                        aria-label={(isExpanded ? 'Collapse ' : 'Expand ') + program.name + ' details'}
                      >
                        <Icon path={isExpanded ? ICONS.chevronUp : ICONS.chevronDown} className="h-3.5 w-3.5" />
                        {isExpanded ? 'Show less' : 'View details'}
                      </button>
                    </>
                  )}

                  {/* Register / Bookmark footer — member view */}
                  {!isAdmin && (
                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid ' + BDR, display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {myReg ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{
                            fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '99px',
                            background: myReg.status === 'enrolled' ? 'rgba(34,197,94,0.12)' : myReg.status === 'pending' ? 'rgba(245,183,49,0.15)' : 'rgba(100,116,139,0.1)',
                            color: myReg.status === 'enrolled' ? '#22C55E' : myReg.status === 'pending' ? '#B45309' : '#64748B',
                          }}>
                            {myReg.status === 'enrolled' ? 'Enrolled' : myReg.status === 'pending' ? 'Pending approval' : 'Cancelled'}
                          </span>
                          {(myReg.status === 'enrolled' || myReg.status === 'pending') && (
                            <button
                              onClick={function(e) { e.stopPropagation(); handleCancelRegistration(program); }}
                              style={{ fontSize: '12px', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                              className="hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400"
                              aria-label={'Cancel registration for ' + program.name}
                            >Cancel</button>
                          )}
                        </div>
                      ) : regOpen && !isFull ? (
                        <button
                          onClick={function(e) { e.stopPropagation(); handleRegister(program); }}
                          style={{ flex: 1, padding: '8px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
                          className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={'Register for ' + program.name}
                        >
                          {program.requires_approval ? 'Request to Join' : 'Register'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: MUTED, fontStyle: 'italic' }}>
                          {isFull ? 'Program is full' : 'Registration closed'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Admin toggles footer */}
                  {isAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid ' + BDR }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: MUTED }}>Org page</span>
                        <Toggle small checked={program.is_public} onClick={function(e) { e.stopPropagation(); togglePublic(program); }} label={'Toggle ' + program.name + ' org page visibility'} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: MUTED }}>Discover</span>
                        <Toggle small checked={program.publish_to_discovery} disabled={!program.is_public} onClick={function(e) { e.stopPropagation(); toggleDiscovery(program); }} label={'Toggle ' + program.name + ' on Discover'} color="#8B5CF6" ringColor="focus:ring-purple-500" />
                      </div>
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
            style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + BDR, flexShrink: 0 }}>
              <h2 id="prog-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: 0 }}>
                {editingProgram ? 'Edit Program' : 'Add Program'}
              </h2>
              <button onClick={function() { setShowModal(false); }} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }} className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Close modal">
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid ' + BDR, flexShrink: 0 }}>
              {[
                { key: false, label: 'Details' },
                { key: true,  label: 'Settings' },
              ].map(function(tab) {
                var active = showSettingsTab === tab.key;
                return (
                  <button
                    key={String(tab.key)}
                    onClick={function() { setShowSettingsTab(tab.key); }}
                    style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 700, color: active ? TEXT : MUTED, background: 'none', border: 'none', borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent', cursor: 'pointer', transition: 'color 0.15s' }}
                    className="hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    aria-selected={active}
                    role="tab"
                  >{tab.label}</button>
                );
              })}
            </div>

            {/* Details tab */}
            {!showSettingsTab && (
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                <div>
                  <label htmlFor="prog-name" style={labelStyle}>Program Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span></label>
                  <input id="prog-name" type="text" value={form.name} onChange={function(e) { setField('name', e.target.value); }} placeholder="e.g. After School Tutoring" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
                </div>
                <div>
                  <label htmlFor="prog-desc" style={labelStyle}>Description</label>
                  <textarea id="prog-desc" value={form.description} rows={3} onChange={function(e) { setField('description', e.target.value); }} placeholder="What does this program do?" style={Object.assign({}, inputStyle, { resize: 'none' })} className="focus:ring-2 focus:ring-blue-500" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label htmlFor="prog-start" style={labelStyle}>Start Date</label>
                    <input id="prog-start" type="date" value={form.start_date} onChange={function(e) { setField('start_date', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="prog-end" style={labelStyle}>End Date</label>
                    <input id="prog-end" type="date" value={form.end_date} onChange={function(e) { setField('end_date', e.target.value); }} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label htmlFor="prog-capacity" style={labelStyle}>Capacity (Max Spots)</label>
                  <input id="prog-capacity" type="number" min="0" value={form.capacity} onChange={function(e) { setField('capacity', e.target.value); }} placeholder="Leave blank for unlimited" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label style={labelStyle}>Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {PROGRAM_TAGS.map(function(tag) {
                      var sel = (form.tags || []).indexOf(tag) !== -1;
                      return (
                        <button key={tag} type="button" onClick={function() { toggleTag(tag); }} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: sel ? 'none' : '1px solid ' + BDR, background: sel ? '#3B82F6' : 'transparent', color: sel ? '#FFFFFF' : TEXT2 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-pressed={sel}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={newTagInput} onChange={function(e) { setNewTagInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }} placeholder="Custom tag — press Enter to add" aria-label="Add custom tag" style={Object.assign({}, inputStyle, { flex: 1 })} className="focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={addCustomTag} style={{ padding: '8px 14px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: TEXT2, cursor: 'pointer', whiteSpace: 'nowrap' }} className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400">Add</button>
                  </div>
                  {/* Custom tags always shown so user gets feedback */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', minHeight: '28px' }}>
                    {(form.tags || []).filter(function(t) { return PROGRAM_TAGS.indexOf(t) === -1; }).map(function(tag) {
                      return (
                        <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: '#0E1523', color: '#FFFFFF' }}>
                          {tag}
                          <button type="button" onClick={function() { removeTag(tag); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', color: 'rgba(255,255,255,0.7)' }} className="hover:text-white focus:outline-none" aria-label={'Remove tag ' + tag}>
                            <Icon path={ICONS.x} className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                    {(form.tags || []).filter(function(t) { return PROGRAM_TAGS.indexOf(t) === -1; }).length === 0 && newTagInput.trim() === '' && (
                      <span style={{ fontSize: '12px', color: MUTED, fontStyle: 'italic', lineHeight: '28px' }}>Custom tags will appear here</span>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="prog-audience" style={labelStyle}>Who Is It For?</label>
                  <input id="prog-audience" type="text" value={form.audience} onChange={function(e) { setField('audience', e.target.value); }} placeholder="e.g. Youth ages 6–18" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="prog-schedule" style={labelStyle}>Schedule</label>
                  <input id="prog-schedule" type="text" value={form.schedule} onChange={function(e) { setField('schedule', e.target.value); }} placeholder="e.g. Every Monday 3–5pm" style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="prog-apply" style={labelStyle}>How To Apply / Sign Up</label>
                  <textarea id="prog-apply" value={form.how_to_apply} rows={2} onChange={function(e) { setField('how_to_apply', e.target.value); }} placeholder="e.g. Fill out form at front desk or call us" style={Object.assign({}, inputStyle, { resize: 'none' })} className="focus:ring-2 focus:ring-blue-500" />
                </div>
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
                <div>
                  <label htmlFor="prog-status" style={labelStyle}>Status</label>
                  <select id="prog-status" value={form.status} onChange={function(e) { setField('status', e.target.value); }} style={Object.assign({}, inputStyle, { width: '100%' })} className="focus:ring-2 focus:ring-blue-500">
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            )}

            {/* Settings tab */}
            {showSettingsTab && (
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>Control how members interact with this program.</p>

                {/* Visibility section */}
                <div>
                  <p style={labelStyle}>Visibility</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                      <Toggle checked={form.is_public} onClick={function() { setField('is_public', !form.is_public); }} label="Toggle visibility on org page" />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>Show on org page</p>
                        <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>Visitors to your public page will see this program</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR, opacity: form.is_public ? 1 : 0.5 }}>
                      <Toggle checked={form.publish_to_discovery} disabled={!form.is_public} onClick={function() { setField('publish_to_discovery', !form.publish_to_discovery); }} label="Toggle visibility on Discover page" color="#8B5CF6" ringColor="focus:ring-purple-500" />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>Show on Discover</p>
                        <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>
                          {form.is_public ? 'Anyone browsing /discover can find this program' : 'Enable "Show on org page" first'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration section */}
                <div>
                  <p style={labelStyle}>Registration</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                      <Toggle checked={form.registration_open} onClick={function() { setField('registration_open', !form.registration_open); }} label="Toggle registration open" />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>Registration open</p>
                        <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>Members can register or request to join</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ELEVATED, borderRadius: '8px', border: '1px solid ' + BDR }}>
                      <Toggle checked={form.requires_approval} onClick={function() { setField('requires_approval', !form.requires_approval); }} label="Toggle approval required" color="#8B5CF6" ringColor="focus:ring-purple-500" />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: 0 }}>Require approval</p>
                        <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>
                          {form.requires_approval
                            ? 'Registrations are held for your review before enrolling'
                            : 'Members are enrolled automatically on registration'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal footer */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid ' + BDR, flexShrink: 0 }}>
              <button onClick={function() { setShowModal(false); }} style={{ flex: 1, padding: '10px', border: '1px solid ' + BDR, color: TEXT2, fontSize: '14px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
              <button onClick={saveProgram} disabled={saving} style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {saving ? 'Saving...' : (editingProgram ? 'Save Changes' : 'Add Program')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmModal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm || function() {}}
        onCancel={closeConfirm}
      />

      {/* Registrations drawer */}
      {drawerProgram && (
        <RegistrationsDrawer
          program={drawerProgram}
          organizationId={organizationId}
          onClose={function() { setDrawerProgram(null); }}
        />
      )}
    </>
  );
}

export default OrgPrograms;