import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { AlertTriangle, BookmarkIcon, BookmarkCheck, RefreshCw } from 'lucide-react';

var PAGE_BG  = '#F8FAFC';
var CARD_BG  = '#FFFFFF';
var ELEVATED = '#F1F5F9';
var BDR      = '#E2E8F0';
var TEXT     = '#0E1523';
var TEXT2    = '#475569';
var MUTED    = '#64748B';

var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';

function Icon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={props.className || 'h-5 w-5'} style={props.style} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(props.path)
        ? props.path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={props.sw || 2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={props.sw || 2} d={props.path} />}
    </svg>
  );
}

var ICONS = {
  programs: ['M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
  calendar: ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
  clock:    ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:    ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'],
  mail:     ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  tag:      ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
  globe:    ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  lock:     ['M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'],
  info:     ['M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  check:    'M5 13l4 4L19 7',
  x:        'M6 18L18 6M6 6l12 12',
  xCircle:  ['M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'],
  chevLeft: 'M15 19l-7-7 7-7',
  trash:    ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  dollar:   ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  eyeOff:   ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  creditCard: ['M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'],
};

function formatDate(ds) {
  if (!ds) return null;
  var d = new Date(ds + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

function useFocusTrap(isActive) {
  var ref = useRef(null);
  useEffect(function() {
    if (!isActive || !ref.current) return;
    var el = ref.current;
    var focusable = el.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    function trap(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    el.addEventListener('keydown', trap);
    if (first) first.focus();
    return function() { el.removeEventListener('keydown', trap); };
  }, [isActive]);
  return ref;
}

function ConfirmModal(props) {
  var trapRef = useFocusTrap(props.isOpen);
  useEffect(function() {
    if (!props.isOpen) return;
    function handleKey(e) { if (e.key === 'Escape') props.onCancel(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [props.isOpen]);
  if (!props.isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }} role="dialog" aria-modal="true" aria-labelledby="confirm-pd-title" onClick={function(e) { if (e.target === e.currentTarget) props.onCancel(); }}>
      <div ref={trapRef} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '3px 4px 14px rgba(0,0,0,0.12)' }} onClick={function(e) { e.stopPropagation(); }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-pd-title" style={{ fontSize: '16px', fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>{props.title}</h2>
            <p style={{ fontSize: '13px', color: TEXT2, margin: 0, lineHeight: 1.5 }}>{props.message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={props.onCancel} style={{ flex: 1, padding: '10px', border: '1px solid ' + BDR, borderRadius: '8px', background: 'transparent', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          <button onClick={props.onConfirm} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: props.confirmBg || '#EF4444', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className={'focus:outline-none focus:ring-2 focus:ring-offset-2 ' + (props.confirmRing || 'focus:ring-red-500') + ' ' + (props.confirmHover || 'hover:bg-red-600')}>{props.confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }) {
  if (!status || status === 'not_required') return null;
  var cfg = {
    paid:    { label: 'Paid',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    pending: { label: 'Payment pending', color: '#F59E0B', bg: 'rgba(245,183,49,0.12)' },
    refunded:{ label: 'Refunded', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  };
  var c = cfg[status];
  if (!c) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: c.bg, color: c.color }}>
      <Icon path={ICONS.creditCard} className="h-3 w-3" />{c.label}
    </span>
  );
}

function Skeleton() {
  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, padding: '0', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ height: '280px', background: ELEVATED }} className="animate-pulse" />
      <div style={{ padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '24px', maxWidth: '1100px', margin: '0 auto', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(function(i) { return <div key={i} style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', height: '120px' }} className="animate-pulse" />; })}
          </div>
          <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', height: '200px' }} className="animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ProgramDetail() {
  var params         = useParams();
  var organizationId = params.id || params.organizationId;
  var programId      = params.programId;
  var navigate       = useNavigate();
  var location       = useLocation();
  var outletCtx      = useOutletContext() || {};
  var isAdmin        = outletCtx.isAdmin === true;

  // Determine where the back button should go
  // If navigated from discover page, go back to /discover
  // Otherwise go to the org's programs list
var backLabel = 'Back';

  var [program, setProgram]           = useState(null);
  var [organization, setOrganization] = useState(null);
  var [loading, setLoading]           = useState(true);
  var [loadError, setLoadError]       = useState(false);
  var [currentUserId, setCurrentUserId] = useState(null);

  var [myReg, setMyReg]     = useState(null);
  var [isSaved, setIsSaved] = useState(false);

  var [enrolled, setEnrolled]     = useState([]);
  var [pending, setPending]       = useState([]);
  var [loadingReg, setLoadingReg] = useState(false);

  var [editingNoteId, setEditingNoteId] = useState(null);
  var [noteText, setNoteText]           = useState('');

  var [confirmModal, setConfirmModal] = useState({ open: false });
  var [acting, setActing]             = useState(false);

  // Payment redirect feedback
  var paymentParam = new URLSearchParams(location.search).get('payment');
  var [paymentBanner, setPaymentBanner] = useState(paymentParam || null);

  function openConfirm(opts) { setConfirmModal(Object.assign({ open: true }, opts)); }
  function closeConfirm()    { setConfirmModal({ open: false }); }

  useEffect(function() { init(); }, [organizationId, programId]);

  // Show toast on payment return
  useEffect(function() {
    if (paymentParam === 'success') {
      mascotSuccessToast('Payment complete!', 'Your registration has been confirmed.');
      // Clean URL without reload
      window.history.replaceState({}, '', location.pathname);
    } else if (paymentParam === 'cancelled') {
      toast('Payment cancelled — your registration was not completed.');
      window.history.replaceState({}, '', location.pathname);
    }
  }, []);

  async function init() {
    setLoadError(false);
    setLoading(true);
    try {
      var authRes = await supabase.auth.getUser();
      if (!authRes.data.user) { navigate('/login'); return; }
      var uid = authRes.data.user.id;
      setCurrentUserId(uid);

      var [progRes, orgRes] = await Promise.all([
        supabase.from('org_programs').select('*').eq('id', programId).single(),
        supabase.from('organizations').select('id, name, logo_url, slug').eq('id', organizationId).single(),
      ]);
      if (progRes.error) throw progRes.error;
      if (orgRes.error)  throw orgRes.error;

      setProgram(progRes.data);
      setOrganization(orgRes.data);

      await Promise.all([
        fetchMyReg(uid, progRes.data.id),
        fetchSave(uid, progRes.data.id),
        isAdmin ? fetchRegistrations(progRes.data.id) : Promise.resolve(),
      ]);
    } catch(err) {
      console.error('ProgramDetail init error:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyReg(uid, pid) {
    var res = await supabase
      .from('program_registrations')
      .select('id, status, created_at, payment_status, payment_intent_id')
      .eq('program_id', pid)
      .eq('user_id', uid)
      .maybeSingle();
    setMyReg(res.data || null);
  }

  async function fetchSave(uid, pid) {
    var res = await supabase.from('program_saves').select('id').eq('program_id', pid).eq('user_id', uid).maybeSingle();
    setIsSaved(!!res.data);
  }

  async function fetchRegistrations(pid) {
    setLoadingReg(true);
    var res = await supabase
      .from('program_registrations')
      .select('id, status, created_at, notes, user_id, payment_status, payment_intent_id')
      .eq('program_id', pid)
      .in('status', ['enrolled', 'pending'])
      .order('created_at', { ascending: true });
    if (res.error) { setLoadingReg(false); return; }
    var rows = res.data || [];
    if (rows.length === 0) { setEnrolled([]); setPending([]); setLoadingReg(false); return; }
    var uids = rows.map(function(r) { return r.user_id; });
    var mRes = await supabase.from('members').select('user_id, first_name, last_name').in('user_id', uids);
    var mMap = {};
    if (mRes.data) mRes.data.forEach(function(m) { mMap[m.user_id] = m.first_name + ' ' + m.last_name; });
    var hydrated = rows.map(function(r) { return Object.assign({}, r, { member_name: mMap[r.user_id] || 'Unknown member' }); });
    setEnrolled(hydrated.filter(function(r) { return r.status === 'enrolled'; }));
    setPending(hydrated.filter(function(r) { return r.status === 'pending'; }));
    setLoadingReg(false);
  }

  async function fetchProgram() {
    var res = await supabase.from('org_programs').select('*').eq('id', programId).single();
    if (!res.error) setProgram(res.data);
  }

  // ── Registration handler ──────────────────────────────────────────────────
  async function handleRegister() {
    if (!currentUserId) { navigate('/login'); return; }
    setActing(true);

    // For paid programs — route through Stripe
    if (program.cost_type === 'paid' && program.cost_amount && parseFloat(program.cost_amount) > 0) {
      var hasConnect = organization &&
        organization.stripe_connect_account_id &&
        organization.stripe_connect_status === 'active';

      if (!hasConnect) {
        toast.error('This program cannot accept payments right now. Contact the organization.');
        setActing(false);
        return;
      }

      try {
        var authRes = await supabase.auth.getSession();
        var token = authRes.data.session ? authRes.data.session.access_token : '';
        var res = await fetch(SUPABASE_URL + '/functions/v1/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
          body: JSON.stringify({
            type: 'program',
            program_id: program.id,
            organization_id: organizationId,
            success_url: window.location.href,
            cancel_url: window.location.href,
          }),
        });
        var data = await res.json();
        if (!res.ok || !data.url) {
          mascotErrorToast('Could not start checkout.', data.error || 'Please try again.');
          setActing(false);
          return;
        }
        window.location.href = data.url;
        // Don't setActing(false) — page is navigating away
        return;
      } catch(err) {
        mascotErrorToast('Checkout failed.', 'Check your connection and try again.');
        setActing(false);
        return;
      }
    }

    // Free / donation programs — direct insert
    var countRes = await supabase
      .from('program_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('status', 'enrolled');
    if (program.capacity != null && countRes.count >= program.capacity) {
      toast.error('This program is full.');
      setActing(false);
      return;
    }
    var status = program.requires_approval ? 'pending' : 'enrolled';
    var insertRes = await supabase.from('program_registrations').insert({
      program_id: program.id,
      user_id: currentUserId,
      organization_id: organizationId,
      status: status,
      payment_status: 'not_required',
    });
    setActing(false);
    if (insertRes.error) {
      if (insertRes.error.code === '23505') { toast.error('You are already registered.'); return; }
      mascotErrorToast('Registration failed.', 'Please try again.');
      return;
    }
    setMyReg({ status: status, created_at: new Date().toISOString(), payment_status: 'not_required' });
    mascotSuccessToast(
      status === 'enrolled' ? 'Registered!' : 'Request submitted!',
      status === 'enrolled' ? 'You are now enrolled in ' + program.name + '.' : 'Your registration is pending admin approval.'
    );
    try {
      var notifModule = await import('../lib/notificationService');
      var mRes2 = await supabase.from('members').select('first_name, last_name').eq('user_id', currentUserId).single();
      var memberName = mRes2.data ? mRes2.data.first_name + ' ' + mRes2.data.last_name : 'A member';
      await notifModule.notifyOrgAdmins({
        organizationId,
        type: 'program_registration',
        title: program.name,
        message: memberName + (status === 'enrolled' ? ' registered for ' : ' requested to join ') + program.name + '.',
        link: '/organizations/' + organizationId + '/programs/' + program.id,
        excludeUserId: currentUserId,
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch(ne) { console.error('Registration notification failed:', ne); }
  }

  function handleCancelRegistration() {
    openConfirm({
      title: 'Cancel registration?',
      message: 'You will be removed from ' + program.name + '. You can re-register later if spots are available.',
      confirmLabel: 'Cancel Registration',
      confirmBg: '#EF4444', confirmRing: 'focus:ring-red-500', confirmHover: 'hover:bg-red-600',
      onConfirm: async function() {
        closeConfirm();
        var res = await supabase.from('program_registrations')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', myReg.id);
        if (res.error) { mascotErrorToast('Failed to cancel registration.'); return; }
        setMyReg(null);
        mascotSuccessToast('Registration cancelled.');
      },
    });
  }

  async function toggleSave() {
    if (!currentUserId) return;
    if (isSaved) {
      var res = await supabase.from('program_saves').delete().eq('program_id', program.id).eq('user_id', currentUserId);
      if (res.error) { mascotErrorToast('Failed to remove bookmark.'); return; }
      setIsSaved(false);
    } else {
      var res2 = await supabase.from('program_saves').insert({ program_id: program.id, user_id: currentUserId });
      if (res2.error) { mascotErrorToast('Failed to save program.'); return; }
      setIsSaved(true);
    }
  }

  async function updateRegStatus(regId, memberName, newStatus) {
    var authRes = await supabase.auth.getUser();
    var res = await supabase.from('program_registrations')
      .update({ status: newStatus, reviewed_by: authRes.data.user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', regId);
    if (res.error) { mascotErrorToast('Failed to update registration.'); return; }
    mascotSuccessToast(newStatus === 'enrolled' ? memberName + ' approved.' : memberName + ' declined.');
    fetchRegistrations(program.id);
    fetchProgram();
  }

  function handleRemoveMember(reg) {
    openConfirm({
      title: 'Remove ' + reg.member_name + '?',
      message: reg.member_name + ' will be removed from this program.',
      confirmLabel: 'Remove',
      confirmBg: '#EF4444', confirmRing: 'focus:ring-red-500', confirmHover: 'hover:bg-red-600',
      onConfirm: async function() {
        closeConfirm();
        var authRes = await supabase.auth.getUser();
        var res = await supabase.from('program_registrations')
          .update({ status: 'cancelled', reviewed_by: authRes.data.user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', reg.id);
        if (res.error) { mascotErrorToast('Failed to remove member.'); return; }
        mascotSuccessToast(reg.member_name + ' removed from program.');
        fetchRegistrations(program.id);
        fetchProgram();
      },
    });
  }

  async function saveNote(regId) {
    var res = await supabase.from('program_registrations')
      .update({ notes: noteText, updated_at: new Date().toISOString() })
      .eq('id', regId);
    if (res.error) { mascotErrorToast('Failed to save note.'); return; }
    mascotSuccessToast('Note saved.');
    setEditingNoteId(null);
    fetchRegistrations(program.id);
  }

  if (loading) return <Skeleton />;

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '360px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertTriangle size={24} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: '0 0 8px' }}>Failed to load program</h1>
          <p style={{ fontSize: '13px', color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>Something went wrong. Check your connection and try again.</p>
          <button onClick={init} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <RefreshCw size={14} aria-hidden="true" />Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '360px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: MUTED }}><Icon path={ICONS.programs} className="h-14 w-14" sw={1} /></div>
          <h1 style={{ fontSize: '17px', fontWeight: 800, color: TEXT, margin: '0 0 8px' }}>Program not found</h1>
          <p style={{ fontSize: '13px', color: MUTED, margin: '0 0 24px' }}>This program may have been removed or you may not have access.</p>
          <button onClick={function() { navigate(-1); }} style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {fromDiscover ? 'Back to Discover' : 'View All Programs'}
          </button>
        </div>
      </div>
    );
  }

  var isClosed      = program.status === 'closed';
  var regOpen       = program.registration_open !== false && !isClosed;
  var enrolledCount = isAdmin ? enrolled.length : (program.enrolled_count || 0);
  var cap           = program.capacity;
  var capPct        = cap ? Math.min(100, Math.round(enrolledCount / cap * 100)) : null;
  var capBarColor   = capPct >= 100 ? '#EF4444' : capPct >= 75 ? '#F59E0B' : '#22C55E';
  var isFull        = cap != null && enrolledCount >= cap;
  var startFmt      = formatDate(program.start_date);
  var endFmt        = formatDate(program.end_date);
  var startTimeFmt  = formatTime(program.start_time);
  var endTimeFmt    = formatTime(program.end_time);
  var showEnrolled  = isAdmin || program.show_enrolled_public !== false;

  var isPaidProgram = program.cost_type === 'paid' && program.cost_amount && parseFloat(program.cost_amount) > 0;
var hasStripeConnect = true;

  var canRegister = !isAdmin && regOpen && !isFull && !myReg;
  var isEnrolled  = myReg && myReg.status === 'enrolled';
  var isPending   = myReg && myReg.status === 'pending';
  var isDeclined  = myReg && myReg.status === 'declined';

  // If paid program and user has a pending payment row, show payment pending state
  var hasPaymentPending = myReg && myReg.payment_status === 'pending';

  function statusBadgeStyle(status) {
    var cfg = {
      active:   { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E' },
      upcoming: { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6' },
      closed:   { bg: 'rgba(100,116,139,0.12)', color: '#64748B' },
    };
    return cfg[status] || cfg.closed;
  }
  var sbs = statusBadgeStyle(program.status);

  function costBadge() {
    if (!program.cost_type || program.cost_type === 'free') return { label: 'Free', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (program.cost_type === 'donation') return { label: 'Donation', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' };
    var amt = program.cost_amount ? '$' + parseFloat(program.cost_amount).toFixed(2) : 'Paid';
    return { label: amt, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' };
  }
  var cost = costBadge();

  var orgInitials = organization && organization.name
    ? organization.name.split(' ').slice(0,2).map(function(w) { return w[0]; }).join('').toUpperCase()
    : '?';

  var labelStyle = { fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 12px', display: 'block' };
  var inputStyle = { width: '100%', padding: '7px 10px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '12px', color: TEXT, resize: 'none', outline: 'none', boxSizing: 'border-box' };

  return (
    <>
      <main style={{ minHeight: '100vh', background: PAGE_BG, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", boxSizing: 'border-box' }} aria-labelledby="pd-title">

        {/* Hero image — full width */}
        {program.image_url ? (
          <div style={{ position: 'relative', width: '100%', height: '280px', overflow: 'hidden' }}>
            <img src={program.image_url} alt={program.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(14,21,35,0.65) 100%)' }} aria-hidden="true" />
            <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
              <button
                onClick={function() { navigate(-1) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: '6px', marginBottom: '10px', backdropFilter: 'blur(4px)' }}
                className="hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded"
                aria-label={'Back to ' + backLabel}
              >
                <Icon path={ICONS.chevLeft} className="h-3.5 w-3.5" />{backLabel}
              </button>
            </div>
          </div>
        ) : (
<div style={{ background: '#FFFFFF', borderBottom: '1px solid ' + BDR, padding: '20px 24px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <button
                onClick={function() { navigate(-1); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: '12px' }}
                className="hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={'Back to ' + backLabel}
              >
                <Icon path={ICONS.chevLeft} className="h-4 w-4" />Back
              </button>
              <h1 id="pd-title" style={{ fontSize: '30px', fontWeight: 800, color: TEXT, margin: 0 }}>{program ? program.name : ''}</h1>
              {organization && (organization.slug
                ? <a href={'/org/' + organization.slug} style={{ fontSize: '14px', color: '#3B82F6', margin: '4px 0 0', display: 'block', textDecoration: 'none', fontWeight: 600 }} className="hover:underline">{organization.name}</a>
                : <p style={{ fontSize: '14px', color: TEXT2, margin: '4px 0 0' }}>{organization.name}</p>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: program.image_url ? '24px 24px 32px' : '0 24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '24px', maxWidth: '1100px', margin: '0 auto', alignItems: 'start' }}>

            {/* ── LEFT COLUMN ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

              {/* Hero card */}
              <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  {organization && organization.logo_url
                    ? <img src={organization.logo_url} alt={organization.name + ' logo'} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid ' + BDR, flexShrink: 0 }} />
                    : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>{orgInitials}</div>
                  }
                  <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT2 }}>{organization ? organization.name : ''}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '2px 8px', borderRadius: '99px', background: sbs.bg, color: sbs.color, marginLeft: 'auto' }}>
                    {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.25, flex: 1 }}>{program.name}</p>
                  {!isAdmin && (
                    <button
                      onClick={toggleSave}
                      style={{ padding: '6px', borderRadius: '8px', background: 'none', border: '1px solid ' + BDR, cursor: 'pointer', color: isSaved ? '#F5B731' : MUTED, flexShrink: 0 }}
                      className={'focus:outline-none focus:ring-2 focus:ring-yellow-400 ' + (isSaved ? '' : 'hover:border-yellow-400 hover:text-yellow-500')}
                      aria-label={isSaved ? 'Remove bookmark' : 'Bookmark this program'}
                      aria-pressed={isSaved}
                    >
                      {isSaved ? <BookmarkCheck size={18} aria-hidden="true" /> : <BookmarkIcon size={18} aria-hidden="true" />}
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: cost.bg, color: cost.color }}>{cost.label}</span>
                  {program.publish_to_discovery && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                      <Icon path={ICONS.globe} className="h-3 w-3" />On Discover
                    </span>
                  )}
                  {program.requires_approval && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(100,116,139,0.1)', color: '#475569' }}>
                      <Icon path={ICONS.lock} className="h-3 w-3" />Approval required
                    </span>
                  )}
                  {!program.registration_open && !isClosed && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Registration closed</span>
                  )}
                  {isAdmin && !program.is_public && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(245,183,49,0.12)', color: '#B45309' }}>Hidden</span>
                  )}
                  {!showEnrolled && isAdmin && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(100,116,139,0.1)', color: MUTED }}>
                      <Icon path={ICONS.eyeOff} className="h-3 w-3" />Enrollment hidden from public
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {program.description && (
                <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px 28px' }}>
                  <p style={labelStyle}>About This Program</p>
                  <p style={{ fontSize: '15px', color: TEXT2, lineHeight: 1.7, margin: 0 }}>{program.description}</p>
                </div>
              )}

              {/* Details */}
              <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px 28px' }}>
                <p style={labelStyle}>Program Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {(startFmt || endFmt) && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon path={ICONS.calendar} className="h-4 w-4" style={{ color: '#3B82F6' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Dates</p>
                        <p style={{ fontSize: '14px', color: TEXT2, margin: 0 }}>{startFmt && endFmt ? startFmt + ' – ' + endFmt : startFmt ? 'Starts ' + startFmt : 'Ends ' + endFmt}</p>
                        {(startTimeFmt || endTimeFmt) && (
                          <p style={{ fontSize: '13px', color: MUTED, margin: '3px 0 0' }}>
                            {startTimeFmt && endTimeFmt ? startTimeFmt + ' – ' + endTimeFmt : startTimeFmt || endTimeFmt}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {program.schedule && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon path={ICONS.clock} className="h-4 w-4" style={{ color: '#22C55E' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Schedule</p>
                        <p style={{ fontSize: '14px', color: TEXT2, margin: 0 }}>{program.schedule}</p>
                      </div>
                    </div>
                  )}

                  {program.audience && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon path={ICONS.user} className="h-4 w-4" style={{ color: '#8B5CF6' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Who It's For</p>
                        <p style={{ fontSize: '14px', color: TEXT2, margin: 0 }}>{program.audience}</p>
                      </div>
                    </div>
                  )}

                  {program.cost_type && program.cost_type !== 'free' && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon path={ICONS.dollar} className="h-4 w-4" style={{ color: '#3B82F6' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Cost</p>
                        <p style={{ fontSize: '14px', color: TEXT2, margin: 0 }}>
                          {program.cost_type === 'donation'
                            ? 'Donation-based' + (program.cost_amount ? ' (suggested $' + parseFloat(program.cost_amount).toFixed(2) + ')' : '')
                            : program.cost_amount ? '$' + parseFloat(program.cost_amount).toFixed(2) : 'Paid — contact org for details'}
                        </p>
                      </div>
                    </div>
                  )}

                  {cap != null && showEnrolled && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon path={ICONS.users} className="h-4 w-4" style={{ color: '#B45309' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Capacity</p>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: capPct >= 100 ? '#EF4444' : TEXT2 }}>{capPct >= 100 ? 'Full' : enrolledCount + ' / ' + cap + ' enrolled'}</span>
                        </div>
                        <div style={{ height: '8px', background: BDR, borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: capPct + '%', height: '100%', background: capBarColor, borderRadius: '99px', transition: 'width 0.4s' }} role="progressbar" aria-valuenow={enrolledCount} aria-valuemin={0} aria-valuemax={cap} aria-label={'Enrollment: ' + enrolledCount + ' of ' + cap} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {program.tags && program.tags.length > 0 && (
                <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '20px 28px' }}>
                  <p style={labelStyle}>Tags</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }} role="list" aria-label="Program tags">
                    {program.tags.map(function(tag) {
                      return (
                        <span key={tag} role="listitem" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: ELEVATED, color: TEXT2, border: '1px solid ' + BDR }}>
                          <Icon path={ICONS.tag} className="h-3 w-3" style={{ color: MUTED }} />{tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* How to apply */}
              {program.how_to_apply && (
                <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px 28px' }}>
                  <p style={labelStyle}>How To Apply / Sign Up</p>
                  <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.7, margin: 0 }}>{program.how_to_apply}</p>
                </div>
              )}

              {/* Contact */}
              {(program.contact_name || program.contact_email) && (
                <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '20px 28px' }}>
                  <p style={labelStyle}>Contact</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ELEVATED, border: '1px solid ' + BDR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon path={ICONS.user} className="h-4 w-4" style={{ color: MUTED }} />
                    </div>
                    <div>
                      {program.contact_name && <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{program.contact_name}</p>}
                      {program.contact_email && (
                        <a href={'mailto:' + program.contact_email} style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Email ' + (program.contact_name || program.contact_email)}>
                          <Icon path={ICONS.mail} className="h-3.5 w-3.5" />{program.contact_email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ADMIN: Pending approval queue ── */}
              {isAdmin && program.requires_approval && (
                <section aria-labelledby="pd-pending-title">
                  <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px 28px' }}>
                    <h2 id="pd-pending-title" style={{ fontSize: '15px', fontWeight: 800, color: TEXT, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Pending Approval
                      {pending.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: '#F59E0B', color: '#FFFFFF', fontSize: '11px', fontWeight: 800 }}>{pending.length}</span>
                      )}
                    </h2>
                    {loadingReg ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[1,2].map(function(i) { return <div key={i} style={{ height: '52px', background: ELEVATED, borderRadius: '8px' }} className="animate-pulse" />; })}</div>
                    ) : pending.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: MUTED }}><Icon path={ICONS.check} className="h-8 w-8" /></div>
                        <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>No pending requests — you're all caught up.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="list" aria-label="Pending registration requests">
                        {pending.map(function(reg) {
                          var isEditing = editingNoteId === reg.id;
                          return (
                            <div key={reg.id} role="listitem" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: 'rgba(245,183,49,0.06)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div>
                                  <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{reg.member_name}</p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>Requested {new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    <PaymentStatusBadge status={reg.payment_status} />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                  <button onClick={function() { updateRegStatus(reg.id, reg.member_name, 'enrolled'); }} style={{ padding: '5px 14px', background: '#22C55E', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label={'Approve ' + reg.member_name}>Approve</button>
                                  <button onClick={function() { updateRegStatus(reg.id, reg.member_name, 'declined'); }} style={{ padding: '5px 14px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label={'Decline ' + reg.member_name}>Decline</button>
                                </div>
                              </div>
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <textarea value={noteText} onChange={function(e) { setNoteText(e.target.value); }} rows={2} placeholder="Private note..." aria-label={'Note for ' + reg.member_name} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={function() { saveNote(reg.id); }} style={{ padding: '4px 12px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Save</button>
                                    <button onClick={function() { setEditingNoteId(null); }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '12px', color: TEXT2, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={function() { setEditingNoteId(reg.id); setNoteText(reg.notes || ''); }} style={{ alignSelf: 'flex-start', fontSize: '11px', color: reg.notes ? '#3B82F6' : MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} className="hover:underline focus:outline-none" aria-label={(reg.notes ? 'Edit note for ' : 'Add note for ') + reg.member_name}>
                                  {reg.notes ? reg.notes : '+ Add private note'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── ADMIN: Enrolled members list ── */}
              {isAdmin && (
                <section aria-labelledby="pd-enrolled-title">
                  <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px 28px' }}>
                    <h2 id="pd-enrolled-title" style={{ fontSize: '15px', fontWeight: 800, color: TEXT, margin: '0 0 16px' }}>
                      Enrolled Members <span style={{ fontSize: '13px', fontWeight: 600, color: MUTED }}>({enrolled.length})</span>
                    </h2>
                    {loadingReg ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[1,2,3].map(function(i) { return <div key={i} style={{ height: '48px', background: ELEVATED, borderRadius: '8px' }} className="animate-pulse" />; })}</div>
                    ) : enrolled.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: MUTED }}><Icon path={ICONS.users} className="h-8 w-8" /></div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>No enrolled members yet</p>
                        <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>Members who register or get approved will appear here.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} role="list" aria-label="Enrolled members">
                        {enrolled.map(function(reg) {
                          var isEditing = editingNoteId === reg.id;
                          return (
                            <div key={reg.id} role="listitem" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#DBEAFE', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>
                                    {reg.member_name.split(' ').slice(0,2).map(function(w) { return w[0]; }).join('').toUpperCase()}
                                  </div>
                                  <div>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 1px' }}>{reg.member_name}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>Enrolled {new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                      <PaymentStatusBadge status={reg.payment_status} />
                                    </div>
                                  </div>
                                </div>
                                <button onClick={function() { handleRemoveMember(reg); }} style={{ padding: '4px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, flexShrink: 0 }} className="hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400" aria-label={'Remove ' + reg.member_name + ' from program'}>
                                  <Icon path={ICONS.xCircle} className="h-4 w-4" />
                                </button>
                              </div>
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <textarea value={noteText} onChange={function(e) { setNoteText(e.target.value); }} rows={2} placeholder="Private note..." aria-label={'Note for ' + reg.member_name} style={inputStyle} className="focus:ring-2 focus:ring-blue-500" />
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={function() { saveNote(reg.id); }} style={{ padding: '4px 12px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">Save</button>
                                    <button onClick={function() { setEditingNoteId(null); }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '12px', color: TEXT2, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={function() { setEditingNoteId(reg.id); setNoteText(reg.notes || ''); }} style={{ alignSelf: 'flex-start', fontSize: '11px', color: reg.notes ? '#3B82F6' : MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} className="hover:underline focus:outline-none" aria-label={(reg.notes ? 'Edit note for ' : 'Add note for ') + reg.member_name}>
                                  {reg.notes ? reg.notes : '+ Add private note'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <aside aria-label="Registration" style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Registration CTA */}
              <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={labelStyle}>Registration</p>

                {(isClosed || !regOpen) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: '8px', marginBottom: '16px' }}>
                    <Icon path={ICONS.info} className="h-4 w-4" style={{ color: MUTED, flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '12px', color: MUTED, margin: 0, lineHeight: 1.5 }}>{isClosed ? 'This program has ended.' : 'Registration is currently closed.'}</p>
                  </div>
                )}

                {isAdmin && (
                  <p style={{ fontSize: '13px', color: MUTED, margin: 0, lineHeight: 1.5 }}>You're viewing as an admin. Registration actions are available to members.</p>
                )}

                {/* Payment pending — waiting for Stripe webhook */}
                {!isAdmin && hasPaymentPending && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '10px' }}>
                    <Icon path={ICONS.creditCard} className="h-4 w-4" style={{ color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '13px', color: '#B45309', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>Payment processing — your registration will be confirmed shortly.</p>
                  </div>
                )}

                {!isAdmin && isEnrolled && !hasPaymentPending && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', marginBottom: '12px' }}>
                      <Icon path={ICONS.check} className="h-4 w-4" style={{ color: '#22C55E' }} />
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#22C55E', margin: 0 }}>You're enrolled</p>
                    </div>
                    {myReg && myReg.created_at && (
                      <p style={{ fontSize: '12px', color: MUTED, margin: '0 0 12px' }}>
                        Enrolled on {new Date(myReg.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    <button onClick={handleCancelRegistration} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500">Cancel Registration</button>
                  </div>
                )}

                {!isAdmin && isPending && !hasPaymentPending && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '10px', marginBottom: '12px' }}>
                      <Icon path={ICONS.clock} className="h-4 w-4" style={{ color: '#F59E0B' }} />
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#B45309', margin: 0 }}>Pending approval</p>
                    </div>
                    <p style={{ fontSize: '12px', color: MUTED, margin: '0 0 12px', lineHeight: 1.5 }}>Your request is awaiting review by an admin.</p>
                    <button onClick={handleCancelRegistration} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500">Withdraw Request</button>
                  </div>
                )}

                {!isAdmin && isDeclined && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                    <Icon path={ICONS.xCircle} className="h-4 w-4" style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '13px', color: '#EF4444', margin: 0, lineHeight: 1.5 }}>Your registration request was declined. Contact the organization if you have questions.</p>
                  </div>
                )}

                {canRegister && (
                  <div>
                    {isPaidProgram && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#DBEAFE', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', marginBottom: '12px' }}>
                        <Icon path={ICONS.creditCard} className="h-4 w-4" style={{ color: '#3B82F6', flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', color: '#1D4ED8', margin: 0, lineHeight: 1.5 }}>
                          {'$' + parseFloat(program.cost_amount).toFixed(2) + ' \u2014 you will be redirected to checkout.'}
                          {!hasStripeConnect && ' (Payments not yet enabled)'}
                        </p>
                      </div>
                    )}
                    {program.requires_approval && !isPaidProgram && (
                      <p style={{ fontSize: '12px', color: MUTED, margin: '0 0 12px', lineHeight: 1.5 }}>This program requires admin approval. Submit a request and an admin will review it.</p>
                    )}
                    {isFull ? (
                      <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444', margin: 0 }}>This program is full</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleRegister}
                        disabled={acting || (isPaidProgram && !hasStripeConnect)}
                        style={{ width: '100%', padding: '12px', background: isPaidProgram ? '#0EA5E9' : '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: (acting || (isPaidProgram && !hasStripeConnect)) ? 'not-allowed' : 'pointer', opacity: (acting || (isPaidProgram && !hasStripeConnect)) ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        className="hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-busy={acting}
                      >
                        {acting ? 'Redirecting to checkout...' : isPaidProgram ? (
                          <>
                            <Icon path={ICONS.creditCard} className="h-4 w-4" />
                            {'Pay $' + parseFloat(program.cost_amount).toFixed(2) + ' & Register'}
                          </>
                        ) : (
                          program.requires_approval ? 'Request to Join' : 'Register Now'
                        )}
                      </button>
                    )}
                  </div>
                )}

                {!isAdmin && !myReg && !canRegister && !isFull && (
                  <p style={{ fontSize: '13px', color: MUTED, margin: 0 }}>Registration is not currently available.</p>
                )}
              </div>

              {/* Admin stats */}
              {isAdmin && (
                <div style={{ background: CARD_BG, border: '1px solid ' + BDR, borderRadius: '16px', padding: '20px 24px' }}>
                  <p style={labelStyle}>Overview</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { label: 'Enrolled',   value: enrolled.length,   color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
                      { label: 'Pending',    value: pending.length,    color: '#F59E0B', bg: 'rgba(245,183,49,0.1)' },
                      cap != null
                        ? { label: 'Capacity', value: cap,             color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' }
                        : { label: 'Capacity', value: '\u221E',        color: MUTED,     bg: ELEVATED },
                      { label: 'Spots Left', value: cap != null ? Math.max(0, cap - enrolled.length) : '\u221E', color: TEXT, bg: ELEVATED },
                    ].map(function(s) {
                      return (
                        <div key={s.label} style={{ padding: '12px', borderRadius: '10px', background: s.bg, textAlign: 'center' }}>
                          <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                          <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>{s.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  {isPaidProgram && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: ELEVATED, border: '1px solid ' + BDR, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon path={ICONS.creditCard} className="h-3.5 w-3.5" style={{ color: MUTED, flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>
                        {'Paid program · $' + parseFloat(program.cost_amount).toFixed(2) + ' per registration'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmBg={confirmModal.confirmBg}
        confirmRing={confirmModal.confirmRing}
        confirmHover={confirmModal.confirmHover}
        onConfirm={confirmModal.onConfirm || function() {}}
        onCancel={closeConfirm}
      />
    </>
  );
}

export default ProgramDetail;