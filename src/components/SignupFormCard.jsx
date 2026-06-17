import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import { Calendar, Users, Check, X, Trash2, ClipboardList, Pin, Download, Copy, Lock, Unlock, AlertTriangle, Pencil, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import EditSignupForm from './EditSignupForm';

var CARD_BG      = '#FFFFFF';
var CARD_BDR     = '#E2E8F0';
var TEXT_PRIMARY = '#0E1523';
var TEXT_SEC     = '#475569';
var TEXT_MUTED   = '#64748B';
var ITEM_BG      = '#F8FAFC';
var RESPONSES_BG = '#F1F5F9';

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(function() {
    if (!isOpen) return;
    function handleKey(e) { if (e.key === 'Escape') onCancel(); }
    document.addEventListener('keydown', handleKey);
    return function() { document.removeEventListener('keydown', handleKey); };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-sfc-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)' }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: '#EF4444' }} aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-sfc-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0E1523', margin: '0 0 4px' }}>{title}</h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            autoFocus
            style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'transparent', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#EF4444', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ActionsMenu — position:fixed dropdown that escapes card clipping ──────────
function ActionsMenu({ form, isPinned, isClosed, adminActing, onEdit, onPinToggle, onCloseToggle, onDuplicate, onExportCSV, onDelete }) {
  var [isOpen, setIsOpen] = useState(false);
  var [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  var btnRef = useRef(null);
  var menuRef = useRef(null);

  function openMenu() {
    if (btnRef.current) {
      var rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.right - 200 });
    }
    setIsOpen(true);
  }

  function closeMenu() { setIsOpen(false); }

  useEffect(function() {
    if (!isOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        closeMenu();
      }
    }
    function handleKey(e) { if (e.key === 'Escape') closeMenu(); }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return function() {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  function wrapAction(fn) {
    return function() {
      closeMenu();
      if (fn) fn();
    };
  }

  var menuItemStyle = {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '9px 14px',
    background: 'transparent', border: 'none',
    fontSize: '13px', fontWeight: 600, color: TEXT_SEC,
    cursor: 'pointer', textAlign: 'left'
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={function() { isOpen ? closeMenu() : openMenu(); }}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', background: '#FFFFFF', color: TEXT_SEC, border: '1px solid ' + CARD_BDR, borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Form actions"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:bg-slate-50"
      >
        Actions
        <ChevronDown size={13} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed',
            top: menuPos.top + 'px',
            left: menuPos.left + 'px',
            width: '200px',
            background: '#FFFFFF',
            border: '1px solid ' + CARD_BDR,
            borderRadius: '10px',
            boxShadow: '3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
            zIndex: 70,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <button onClick={wrapAction(onEdit)} style={menuItemStyle} role="menuitem" className="hover:bg-slate-50">
            <Pencil size={14} aria-hidden="true" /> Edit
          </button>
          <button onClick={wrapAction(onPinToggle)} disabled={adminActing} style={Object.assign({}, menuItemStyle, { color: isPinned ? '#B45309' : TEXT_SEC, opacity: adminActing ? 0.6 : 1 })} role="menuitem" className="hover:bg-slate-50">
            <Pin size={14} aria-hidden="true" /> {isPinned ? 'Unpin' : 'Pin'}
          </button>
          <button onClick={wrapAction(onCloseToggle)} disabled={adminActing} style={Object.assign({}, menuItemStyle, { color: isClosed ? '#22C55E' : TEXT_SEC, opacity: adminActing ? 0.6 : 1 })} role="menuitem" className="hover:bg-slate-50">
            {isClosed ? <Unlock size={14} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />} {isClosed ? 'Reopen' : 'Close Now'}
          </button>
          <button onClick={wrapAction(onDuplicate)} disabled={adminActing} style={Object.assign({}, menuItemStyle, { opacity: adminActing ? 0.6 : 1 })} role="menuitem" className="hover:bg-slate-50">
            <Copy size={14} aria-hidden="true" /> Duplicate
          </button>
          <button onClick={wrapAction(onExportCSV)} style={menuItemStyle} role="menuitem" className="hover:bg-slate-50">
            <Download size={14} aria-hidden="true" /> Export CSV
          </button>
          <div style={{ height: '1px', background: CARD_BDR, margin: '4px 0' }} />
          <button onClick={wrapAction(onDelete)} style={Object.assign({}, menuItemStyle, { color: '#EF4444' })} role="menuitem" className="hover:bg-red-50">
            <Trash2 size={14} aria-hidden="true" /> Delete
          </button>
        </div>
      )}
    </>
  );
}

// ── SignupFormCard ─────────────────────────────────────────────────────────────
function SignupFormCard({ form, currentUserId, isAdmin, onDelete, onUpdate, memberCount, onDuplicate }) {
  var [isExpanded, setIsExpanded]     = useState(false);
  var [items, setItems]               = useState([]);
  var [responses, setResponses]       = useState([]);
  var [loading, setLoading]           = useState(true);
  var [loadedOnce, setLoadedOnce]     = useState(false);
  var [submitting, setSubmitting]     = useState(false);
  var [adminActing, setAdminActing]   = useState(false);
  var [signupQuantities, setSignupQuantities] = useState({});
  var [showEditModal, setShowEditModal] = useState(false);

  var pinnedInit = form ? form.is_pinned === true : false;
  var [isPinned, setIsPinned]         = useState(pinnedInit);

  var closedInit = form
    ? form.status === 'closed' || !!(form.closes_at && new Date(form.closes_at) < new Date())
    : false;
  var [isClosed, setIsClosed]         = useState(closedInit);

  var [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });

  function openConfirm(title, message, confirmLabel, onConfirmFn) {
    setConfirmModal({ open: true, title: title, message: message, confirmLabel: confirmLabel, onConfirm: onConfirmFn });
  }
  function closeConfirm() {
    setConfirmModal({ open: false, title: '', message: '', confirmLabel: '', onConfirm: null });
  }

  var formId = form ? form.id : null;

  // Fetch data only once the card is expanded for the first time
  useEffect(function() {
    if (form && isExpanded && !loadedOnce) {
      fetchData();
      setLoadedOnce(true);
    }
  }, [formId, isExpanded]);

  var fetchData = async function() {
    try {
      setLoading(true);
      var { data: itemsData, error: itemsError } = await supabase
        .from('signup_items')
        .select('*')
        .eq('form_id', form.id)
        .order('order_number', { ascending: true });
      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      var itemIds = (itemsData || []).map(function(i) { return i.id; });
      if (itemIds.length > 0) {
        var { data: responsesData, error: responsesError } = await supabase
          .from('signup_responses')
          .select('*, member:members!signup_responses_member_id_fkey(user_id,first_name,last_name,email)')
          .in('item_id', itemIds);
        if (responsesError) throw responsesError;
        setResponses(responsesData || []);
      } else {
        setResponses([]);
      }
    } catch (err) {
      console.error('Error fetching signup data:', err);
      mascotErrorToast('Failed to load sign-up data.', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived helpers ─────────────────────────────────────────────────────────

  var hasUserSignedUp = function(itemId) {
    return responses.some(function(r) { return r.item_id === itemId && r.member_id === currentUserId; });
  };

  var getItemResponses = function(itemId) {
    return responses.filter(function(r) { return r.item_id === itemId; });
  };

  var isItemFull = function(item) {
    return item.current_signups >= item.max_slots;
  };

  var totalSlots   = items.reduce(function(sum, item) { return sum + (item.max_slots || 0); }, 0);
  var totalSignups = responses.length;
  var responseRate = (memberCount && memberCount > 0)
    ? Math.round((totalSignups / memberCount) * 100)
    : null;

  var getRetentionLabel = function(days) {
    if (!days) return null;
    if (days === 30) return '30 days';
    if (days === 90) return '90 days';
    if (days === 365) return '1 year';
    return days + ' days';
  };

  var formatDate = function(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  var formatDateShort = function(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  var isClosingSoon = function() {
    if (!form.closes_at || isClosed) return false;
    var diff = new Date(form.closes_at) - new Date();
    return diff > 0 && diff < 86400000 * 3;
  };

  // ── Admin actions ───────────────────────────────────────────────────────────

  var handlePinToggle = async function() {
    if (adminActing) return;
    try {
      setAdminActing(true);
      var newPinned = !isPinned;
      var { error } = await supabase
        .from('signup_forms')
        .update({ is_pinned: newPinned })
        .eq('id', form.id);
      if (error) throw error;
      setIsPinned(newPinned);
      mascotSuccessToast(newPinned ? 'Form pinned.' : 'Form unpinned.');
    } catch (err) {
      mascotErrorToast('Failed to update pin.', err.message);
    } finally {
      setAdminActing(false);
    }
  };

  var handleCloseToggle = async function() {
    if (adminActing) return;
    try {
      setAdminActing(true);
      var newStatus = isClosed ? 'active' : 'closed';
      var { error } = await supabase
        .from('signup_forms')
        .update({ status: newStatus })
        .eq('id', form.id);
      if (error) throw error;
      setIsClosed(!isClosed);
      mascotSuccessToast(isClosed ? 'Form reopened.' : 'Form closed.');
    } catch (err) {
      mascotErrorToast('Failed to update form status.', err.message);
    } finally {
      setAdminActing(false);
    }
  };

  var handleDuplicate = async function() {
    if (adminActing) return;
    try {
      setAdminActing(true);
      var { data: newForm, error: formError } = await supabase
        .from('signup_forms')
        .insert({
          organization_id: form.organization_id,
          title: form.title + ' (Copy)',
          description: form.description,
          status: 'active',
          show_responses: form.show_responses,
          visibility: form.visibility,
          retention_days: form.retention_days,
          is_pinned: false
        })
        .select()
        .single();
      if (formError) throw formError;

      if (items.length > 0) {
        var itemInserts = items.map(function(item) {
          return {
            form_id: newForm.id,
            item_name: item.item_name,
            description: item.description,
            max_slots: item.max_slots,
            current_signups: 0,
            order_number: item.order_number
          };
        });
        var { error: itemsError } = await supabase.from('signup_items').insert(itemInserts);
        if (itemsError) throw itemsError;
      }

      mascotSuccessToast('Form duplicated.', form.title + ' (Copy) created.');
      if (onDuplicate) onDuplicate();
    } catch (err) {
      mascotErrorToast('Failed to duplicate form.', err.message);
    } finally {
      setAdminActing(false);
    }
  };

  var handleExportCSV = function() {
    var rows = [['Form', 'Item', 'Member Name', 'Email', 'Quantity', 'Signed Up At']];
    items.forEach(function(item) {
      var itemResponses = getItemResponses(item.id);
      if (itemResponses.length === 0) {
        rows.push([form.title, item.item_name, '', '', '', '']);
      } else {
        itemResponses.forEach(function(r) {
          var name = r.member
            ? ((r.member.first_name || '') + ' ' + (r.member.last_name || '')).trim()
            : 'Unknown';
          rows.push([
            form.title, item.item_name, name,
            r.member ? (r.member.email || '') : '',
            r.quantity || 1,
            r.created_at ? new Date(r.created_at).toLocaleString() : ''
          ]);
        });
      }
    });
    var csv = rows.map(function(row) {
      return row.map(function(cell) {
        var str = String(cell === null || cell === undefined ? '' : cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = form.title.replace(/[^a-z0-9]/gi, '_') + '_signups.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  var handleDelete = function() {
    openConfirm(
      'Delete "' + form.title + '"?',
      'This sign-up form and all responses will be permanently deleted. This cannot be undone.',
      'Delete Form',
      async function() {
        closeConfirm();
        try {
          var { error: deleteError } = await supabase
            .from('signup_forms')
            .delete()
            .eq('id', form.id);
          if (deleteError) throw deleteError;
          mascotSuccessToast('Form deleted.');
          if (onDelete) onDelete();
        } catch (err) {
          mascotErrorToast('Failed to delete form.', err.message);
        }
      }
    );
  };

  var handleEditSaved = function() {
    fetchData();
    if (onUpdate) onUpdate();
  };

  // ── Member actions — optimistic updates ────────────────────────────────────

  var handleSignUp = async function(itemId) {
    if (submitting) return;
    var quantity = parseInt(signupQuantities[itemId]) || 1;
    var item = items.find(function(i) { return i.id === itemId; });
    var available = item.max_slots - item.current_signups;
    if (quantity > available) {
      toast.error('Only ' + available + ' slot' + (available !== 1 ? 's' : '') + ' available.');
      return;
    }

    // Optimistic: bump current_signups and add a placeholder response
    var optimisticResponse = { id: '__optimistic__' + itemId, item_id: itemId, member_id: currentUserId, quantity: quantity, created_at: new Date().toISOString(), member: null };
    setItems(function(prev) {
      return prev.map(function(i) {
        if (i.id !== itemId) return i;
        return Object.assign({}, i, { current_signups: i.current_signups + quantity });
      });
    });
    setResponses(function(prev) { return prev.concat([optimisticResponse]); });
    setSignupQuantities(function(prev) { return Object.assign({}, prev, { [itemId]: 1 }); });

    try {
      setSubmitting(true);
      var { error: signupError } = await supabase
        .from('signup_responses')
        .insert({ item_id: itemId, member_id: currentUserId, quantity: quantity });
      if (signupError) throw signupError;
      // Refresh to get real DB state (member name etc.)
      await fetchData();
      mascotSuccessToast('Signed up!', item.item_name);
    } catch (err) {
      // Rollback optimistic update
      setItems(function(prev) {
        return prev.map(function(i) {
          if (i.id !== itemId) return i;
          return Object.assign({}, i, { current_signups: i.current_signups - quantity });
        });
      });
      setResponses(function(prev) { return prev.filter(function(r) { return r.id !== '__optimistic__' + itemId; }); });
      mascotErrorToast('Failed to sign up.', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  var handleUnsignUp = async function(itemId) {
    if (submitting) return;
    var existingResponse = responses.find(function(r) { return r.item_id === itemId && r.member_id === currentUserId; });
    var quantity = existingResponse ? (existingResponse.quantity || 1) : 1;

    // Optimistic: remove response and decrement count
    setItems(function(prev) {
      return prev.map(function(i) {
        if (i.id !== itemId) return i;
        return Object.assign({}, i, { current_signups: Math.max(0, i.current_signups - quantity) });
      });
    });
    setResponses(function(prev) {
      return prev.filter(function(r) { return !(r.item_id === itemId && r.member_id === currentUserId); });
    });

    try {
      setSubmitting(true);
      var { error: deleteError } = await supabase
        .from('signup_responses')
        .delete()
        .eq('item_id', itemId)
        .eq('member_id', currentUserId);
      if (deleteError) throw deleteError;
      mascotSuccessToast('Removed from sign-up.');
    } catch (err) {
      // Rollback optimistic update
      await fetchData();
      mascotErrorToast('Failed to remove sign-up.', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!form) return null;

  var retentionLabel = getRetentionLabel(form.retention_days);

  return (
    <>
      <article
        role="listitem"
        style={{
          background: CARD_BG,
          border: isPinned ? '2px solid #F5B731' : '1px solid ' + CARD_BDR,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: isPinned
            ? '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05), inset 0 0 0 2px #F5B731'
            : '0 1px 3px rgba(0,0,0,0.05)'
        }}
        aria-label={'Sign-up form: ' + form.title}
      >
        {/* Card header — clickable to expand/collapse */}
        <div
          style={{ padding: '20px 24px', borderBottom: isExpanded ? '1px solid ' + CARD_BDR : 'none', cursor: 'pointer' }}
          onClick={function() { setIsExpanded(!isExpanded); }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={(isExpanded ? 'Collapse' : 'Expand') + ' ' + form.title}
          onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded); } }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ paddingTop: '2px', flexShrink: 0, color: TEXT_MUTED }}>
              {isExpanded ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>{form.title}</h3>
                {isPinned && (
                  <span style={{ padding: '2px 8px', background: 'rgba(245,183,49,0.12)', color: '#B45309', fontSize: '11px', fontWeight: 700, borderRadius: '99px', border: '1px solid rgba(245,183,49,0.35)' }}>
                    Pinned
                  </span>
                )}
                {isClosed && (
                  <span style={{ padding: '2px 8px', background: '#F1F5F9', color: TEXT_MUTED, fontSize: '11px', fontWeight: 600, borderRadius: '99px', border: '1px solid ' + CARD_BDR }}>
                    Closed
                  </span>
                )}
                {isClosingSoon() && (
                  <span style={{ padding: '2px 8px', background: 'rgba(217,119,6,0.1)', color: '#D97706', fontSize: '11px', fontWeight: 700, borderRadius: '99px', border: '1px solid rgba(217,119,6,0.3)' }}>
                    Closing Soon
                  </span>
                )}
              </div>

              {form.description && (
                <p style={{ fontSize: '14px', color: TEXT_SEC, marginBottom: '10px', lineHeight: '1.6' }}>{form.description}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: TEXT_MUTED }}>
                  <Calendar size={13} aria-hidden="true" />
                  <span>Created {formatDateShort(form.created_at)}</span>
                </div>
                {form.closes_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: isClosed ? TEXT_MUTED : (isClosingSoon() ? '#D97706' : TEXT_MUTED) }}>
                    <Calendar size={13} aria-hidden="true" />
                    <span>{isClosed ? 'Closed' : 'Closes'} {formatDate(form.closes_at)}</span>
                  </div>
                )}
                {retentionLabel && (
                  <span style={{ fontSize: '12px', color: TEXT_MUTED }}>Retained: {retentionLabel}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed-state content stops here */}
        {isExpanded && (
          <>
            {/* Admin action bar — Actions dropdown only, escapes card clipping */}
            {isAdmin && (
              <div style={{ padding: '10px 24px', borderBottom: '1px solid ' + CARD_BDR, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <ActionsMenu
                  form={form}
                  isPinned={isPinned}
                  isClosed={isClosed}
                  adminActing={adminActing}
                  onEdit={function() { setShowEditModal(true); }}
                  onPinToggle={handlePinToggle}
                  onCloseToggle={handleCloseToggle}
                  onDuplicate={handleDuplicate}
                  onExportCSV={handleExportCSV}
                  onDelete={handleDelete}
                />
              </div>
            )}

            {/* Items list */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ height: '80px', borderRadius: '8px', background: '#E2E8F0' }} className="animate-pulse" />
                  <div style={{ height: '80px', borderRadius: '8px', background: '#E2E8F0' }} className="animate-pulse" />
                </div>
              ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <ClipboardList size={36} style={{ color: TEXT_MUTED, margin: '0 auto 12px', display: 'block' }} aria-hidden="true" />
                  <p style={{ fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '4px' }}>No items yet</p>
                  <p style={{ fontSize: '14px', color: TEXT_MUTED }}>This form has no sign-up slots added.</p>
                </div>
              ) : (
                items.map(function(item) {
                  var itemResponses   = getItemResponses(item.id);
                  var userSignedUp    = hasUserSignedUp(item.id);
                  var itemFull        = isItemFull(item);
                  var spotsRemaining  = item.max_slots - item.current_signups;

                  // show_responses: always true for admins, otherwise respect form setting
                  var showResponses = isAdmin || form.show_responses;

                  return (
                    <div key={item.id} style={{ background: ITEM_BG, border: '1px solid ' + CARD_BDR, borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 4px' }}>{item.item_name}</h4>
                          {item.description && (
                            <p style={{ fontSize: '13px', color: TEXT_SEC, marginBottom: '8px' }}>{item.description}</p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: itemResponses.length > 0 && showResponses ? '8px' : 0 }}>
                            <Users size={14} style={{ color: itemFull ? '#EF4444' : '#3B82F6', flexShrink: 0 }} aria-hidden="true" />
                            <span style={{ fontSize: '13px', color: itemFull ? '#EF4444' : TEXT_SEC, fontWeight: itemFull ? 600 : 400 }}>
                              {item.current_signups} of {item.max_slots} {item.max_slots === 1 ? 'spot' : 'spots'} filled
                            </span>
                            {!itemFull && spotsRemaining > 0 && (
                              <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>({spotsRemaining} left)</span>
                            )}
                          </div>

                          {/* Responses — always shown to admins, gated by show_responses for members */}
                          {showResponses && itemResponses.length > 0 && (
                            <div style={{ background: RESPONSES_BG, borderRadius: '8px', padding: '10px', marginTop: '8px' }}>
                              <p style={{ fontSize: '11px', fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Signed up</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {itemResponses.map(function(response) {
                                  return (
                                    <div key={response.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                      <Check size={13} style={{ color: '#22C55E', flexShrink: 0 }} aria-hidden="true" />
                                      <span style={{ color: TEXT_SEC }}>
                                        {response.member ? (response.member.first_name + ' ' + response.member.last_name) : '(loading)'}
                                        {response.quantity > 1 && (
                                          <span style={{ color: '#3B82F6', fontWeight: 600 }}> &times;{response.quantity}</span>
                                        )}
                                      </span>
                                      {response.member_id === currentUserId && (
                                        <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>(You)</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sign-up action column — hidden when closed */}
                        {!isClosed && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                            {userSignedUp ? (
                              <button
                                onClick={function() { handleUnsignUp(item.id); }}
                                disabled={submitting}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
                                aria-label={'Remove sign-up for ' + item.item_name}
                                className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                <X size={14} aria-hidden="true" />
                                Unsign Up
                              </button>
                            ) : (
                              <>
                                {item.max_slots > 1 && !itemFull && (
                                  <div>
                                    <label htmlFor={'qty-' + item.id} style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, display: 'block', marginBottom: '4px' }}>Quantity</label>
                                    <input
                                      type="number"
                                      id={'qty-' + item.id}
                                      min="1"
                                      max={spotsRemaining}
                                      value={signupQuantities[item.id] || ''}
                                      placeholder="1"
                                      onChange={function(e) {
                                        setSignupQuantities(function(prev) {
                                          return Object.assign({}, prev, { [item.id]: e.target.value });
                                        });
                                      }}
                                      style={{ width: '100%', padding: '6px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', color: TEXT_PRIMARY, fontSize: '13px' }}
                                      disabled={submitting}
                                      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      aria-label={'Quantity for ' + item.item_name}
                                    />
                                  </div>
                                )}
                                <button
                                  onClick={function() { handleSignUp(item.id); }}
                                  disabled={submitting || itemFull}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 14px', background: itemFull ? '#E2E8F0' : '#3B82F6', color: itemFull ? TEXT_MUTED : '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: (submitting || itemFull) ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
                                  aria-label={itemFull ? (item.item_name + ' is full') : ('Sign up for ' + item.item_name)}
                                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                  <Check size={14} aria-hidden="true" />
                                  {itemFull ? 'Full' : 'Sign Up'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer — response summary */}
            {totalSignups > 0 && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid ' + CARD_BDR, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: TEXT_MUTED }}>
                  {totalSignups} {totalSignups === 1 ? 'response' : 'responses'}
                  {responseRate !== null && ' (' + responseRate + '% of members)'}
                </span>
                {totalSlots > 0 && (
                  <span style={{ fontSize: '12px', color: TEXT_MUTED }}>
                    {Math.round((totalSignups / totalSlots) * 100)}% capacity filled
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </article>

      {/* Edit modal */}
      {showEditModal && (
        <EditSignupForm
          form={form}
          items={items}
          onClose={function() { setShowEditModal(false); }}
          onSaved={handleEditSaved}
        />
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm || function() {}}
        onCancel={closeConfirm}
      />
    </>
  );
}

export default SignupFormCard;