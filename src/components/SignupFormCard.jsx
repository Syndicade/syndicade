import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import Card from './design-system/Card';
import ActionsDropdown from './design-system/ActionsDropdown';
import { Skeleton } from './Skeletons';
import ConfirmModal from './ConfirmModal';
import CreateSignupForm from './CreateSignupForm';

var CARD_BDR     = '#E2E8F0';
var TEXT_PRIMARY = '#0E1523';
var TEXT_SEC     = '#475569';
var TEXT_MUTED   = '#64748B';
var ITEM_BG      = '#F8FAFC';
var RESPONSES_BG = '#F1F5F9';

// ── MakeTemplateModal — minimal name-entry per §16 ──────────────────────────────
function MakeTemplateModal({ defaultName, onSave, onCancel }) {
  var [name, setName] = useState(defaultName || '');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '16px' }} role="dialog" aria-modal="true" aria-labelledby="mtm-title">
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '380px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <h2 id="mtm-title" style={{ fontSize: '16px', fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 12px' }}>Save as Template</h2>
        <label htmlFor="mtm-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: TEXT_PRIMARY, marginBottom: '6px' }}>Template Name</label>
        <input
          id="mtm-name"
          type="text"
          value={name}
          onChange={function(e) { setName(e.target.value); }}
          autoFocus
          style={{ width: '100%', padding: '8px 12px', border: '0.5px solid ' + CARD_BDR, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '16px' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', border: '0.5px solid ' + CARD_BDR, borderRadius: '8px', background: 'transparent', color: TEXT_SEC, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
          <button onClick={function() { onSave(name.trim() || defaultName); }} disabled={!name.trim()} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed', opacity: name.trim() ? 1 : 0.5 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Save</button>
        </div>
      </div>
    </div>
  );
}

// ── SignupFormCard ──────────────────────────────────────────────────────────────
function SignupFormCard({ form, currentUserId, isAdmin, onDelete, onUpdate, memberCount, onDuplicate, selectMode, selected, onToggleSelect }) {
  var [isExpanded, setIsExpanded]   = useState(false);
  var [items, setItems]             = useState([]);
  var [responses, setResponses]     = useState([]);
  var [loading, setLoading]         = useState(true);
  var [loadedOnce, setLoadedOnce]   = useState(false);
  var [submitting, setSubmitting]   = useState(false);
  var [adminActing, setAdminActing] = useState(false);
  var [signupQuantities, setSignupQuantities] = useState({});
  var [showEditModal, setShowEditModal] = useState(false);
  var [showTemplateModal, setShowTemplateModal] = useState(false);

  var pinnedInit = form ? form.is_pinned === true : false;
  var [isPinned, setIsPinned] = useState(pinnedInit);

  var closedInit = form ? (form.status === 'closed' || !!(form.closes_at && new Date(form.closes_at) < new Date())) : false;
  var [isClosed, setIsClosed] = useState(closedInit);

  var [deleteConfirm, setDeleteConfirm] = useState(false);

  var formId = form ? form.id : null;
  var isLive = form ? (form.visibility && form.visibility !== 'draft') : false;

  useEffect(function() {
    if (form && isExpanded && !loadedOnce) {
      fetchData();
      setLoadedOnce(true);
    }
  }, [formId, isExpanded]);

  var fetchData = async function() {
    try {
      setLoading(true);
      var itemsRes = await supabase.from('signup_items').select('*').eq('form_id', form.id).order('order_number', { ascending: true });
      if (itemsRes.error) throw itemsRes.error;
      setItems(itemsRes.data || []);

      var itemIds = (itemsRes.data || []).map(function(i) { return i.id; });
      if (itemIds.length > 0) {
        var responsesRes = await supabase
          .from('signup_responses')
          .select('*, member:members!signup_responses_member_id_fkey(user_id,first_name,last_name,email)')
          .in('item_id', itemIds);
        if (responsesRes.error) throw responsesRes.error;
        setResponses(responsesRes.data || []);
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

  var hasUserSignedUp = function(itemId) { return responses.some(function(r) { return r.item_id === itemId && r.member_id === currentUserId; }); };
  var getItemResponses = function(itemId) { return responses.filter(function(r) { return r.item_id === itemId; }); };
  var isItemFull = function(item) { return item.current_signups >= item.max_slots; };

  var totalSlots = items.reduce(function(sum, item) { return sum + (item.max_slots || 0); }, 0);
  var totalSignups = responses.length;
  var responseRate = (memberCount && memberCount > 0) ? Math.round((totalSignups / memberCount) * 100) : null;

  var formatDate = function(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  var formatDateShort = function(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  var isClosingSoon = function() {
    if (!form.closes_at || isClosed) return false;
    var diff = new Date(form.closes_at) - new Date();
    return diff > 0 && diff < 86400000 * 3;
  };

  // ── Admin actions ─────────────────────────────────────────────────────────────

  var handlePinToggle = async function() {
    if (adminActing) return;
    try {
      setAdminActing(true);
      var newPinned = !isPinned;
      var res = await supabase.from('signup_forms').update({ is_pinned: newPinned }).eq('id', form.id);
      if (res.error) throw res.error;
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
      var res = await supabase.from('signup_forms').update({ status: newStatus }).eq('id', form.id);
      if (res.error) throw res.error;
      setIsClosed(!isClosed);
      mascotSuccessToast(isClosed ? 'Form reopened.' : 'Form closed.');
    } catch (err) {
      mascotErrorToast('Failed to update form status.', err.message);
    } finally {
      setAdminActing(false);
    }
  };

  var handleUnpublish = async function() {
    if (adminActing) return;
    try {
      setAdminActing(true);
      var res = await supabase.from('signup_forms').update({ visibility: 'draft' }).eq('id', form.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Form unpublished.', 'Only admins can see it now.');
      if (onUpdate) onUpdate();
    } catch (err) {
      mascotErrorToast('Failed to unpublish form.', err.message);
    } finally {
      setAdminActing(false);
    }
  };

  var handleDuplicate = async function() {
    if (adminActing) return;
    try {
      setAdminActing(true);
      var newFormRes = await supabase
        .from('signup_forms')
        .insert({
          organization_id: form.organization_id,
          title: form.title + ' (Copy)',
          description: form.description,
          status: 'active',
          show_responses: form.show_responses,
          allow_multiple_signups: form.allow_multiple_signups,
          visibility: 'draft',
          group_ids: form.group_ids || [],
          is_pinned: false
        })
        .select()
        .single();
      if (newFormRes.error) throw newFormRes.error;
      var newForm = newFormRes.data;

      if (items.length > 0) {
        var itemInserts = items.map(function(item) {
          return { form_id: newForm.id, item_name: item.item_name, description: item.description, max_slots: item.max_slots, current_signups: 0, order_number: item.order_number };
        });
        var itemsRes = await supabase.from('signup_items').insert(itemInserts);
        if (itemsRes.error) throw itemsRes.error;
      }

      mascotSuccessToast('Form duplicated.', form.title + ' (Copy) created as a draft.');
      if (onDuplicate) onDuplicate();
    } catch (err) {
      mascotErrorToast('Failed to duplicate form.', err.message);
    } finally {
      setAdminActing(false);
    }
  };

  var handleMakeTemplate = async function(templateName) {
    setShowTemplateModal(false);
    try {
      var newFormRes = await supabase
        .from('signup_forms')
        .insert({
          organization_id: form.organization_id,
          title: templateName,
          description: form.description,
          status: 'active',
          show_responses: form.show_responses,
          allow_multiple_signups: form.allow_multiple_signups,
          visibility: 'draft',
          is_template: true
        })
        .select()
        .single();
      if (newFormRes.error) throw newFormRes.error;
      var newForm = newFormRes.data;

      if (items.length > 0) {
        var itemInserts = items.map(function(item) {
          return { form_id: newForm.id, item_name: item.item_name, description: item.description, max_slots: item.max_slots, current_signups: 0, order_number: item.order_number };
        });
        var itemsRes = await supabase.from('signup_items').insert(itemInserts);
        if (itemsRes.error) throw itemsRes.error;
      }

      mascotSuccessToast('Template saved!');
    } catch (err) {
      mascotErrorToast('Failed to save template.', err.message);
    }
  };

  var handleRemind = async function() {
    if (form.last_reminded_at) {
      var hoursSince = (new Date() - new Date(form.last_reminded_at)) / 3600000;
      if (hoursSince < 24) {
        toast.error('A reminder was already sent recently. Try again later.');
        return;
      }
    }
    try {
      var notifModule = await import('../lib/notificationService');
      await notifModule.notifyOrganizationMembers({
        organizationId: form.organization_id,
        type: 'new_signup_form',
        title: 'Reminder: ' + form.title,
        message: 'Don\u2019t forget to sign up — spots are still open.',
        link: '/organizations/' + form.organization_id + '/signup-forms',
        excludeUserId: currentUserId
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
      var res = await supabase.from('signup_forms').update({ last_reminded_at: new Date().toISOString() }).eq('id', form.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Reminder sent.');
      if (onUpdate) onUpdate();
    } catch (err) {
      mascotErrorToast('Failed to send reminder.', err.message);
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
          var name = r.member ? ((r.member.first_name || '') + ' ' + (r.member.last_name || '')).trim() : 'Unknown';
          rows.push([form.title, item.item_name, name, r.member ? (r.member.email || '') : '', r.quantity || 1, r.created_at ? new Date(r.created_at).toLocaleString() : '']);
        });
      }
    });
    var csv = rows.map(function(row) {
      return row.map(function(cell) {
        var str = String(cell === null || cell === undefined ? '' : cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"';
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

  var handleDelete = async function() {
    setDeleteConfirm(false);
    try {
      var res = await supabase.from('signup_forms').delete().eq('id', form.id);
      if (res.error) throw res.error;
      mascotSuccessToast('Form deleted.');
      if (onDelete) onDelete();
    } catch (err) {
      mascotErrorToast('Failed to delete form.', err.message);
    }
  };

  var handleEditSaved = function(savedForm, meta) {
    fetchData();
    if (onUpdate) onUpdate();
    if (meta && meta.firstPublish) {
      import('../lib/notificationService').then(function(notifModule) {
        notifModule.notifyOrganizationMembers({
          organizationId: form.organization_id,
          type: 'new_signup_form',
          title: savedForm.title,
          message: 'A new sign-up form is available. Claim your spot!',
          link: '/organizations/' + form.organization_id + '/signup-forms',
          excludeUserId: currentUserId
        }).then(function() {
          window.dispatchEvent(new CustomEvent('notificationCreated'));
        });
      }).catch(function(ne) { console.error('Signup form notification failed:', ne); });
    }
  };

  // ── Member actions — optimistic ─────────────────────────────────────────────

  var handleSignUp = async function(itemId) {
    if (submitting) return;
    var quantity = parseInt(signupQuantities[itemId]) || 1;
    var item = items.find(function(i) { return i.id === itemId; });
    var available = item.max_slots - item.current_signups;
    if (quantity > available) {
      toast.error('Only ' + available + ' slot' + (available !== 1 ? 's' : '') + ' available.');
      return;
    }

    var optimisticResponse = { id: '__optimistic__' + itemId, item_id: itemId, member_id: currentUserId, quantity: quantity, created_at: new Date().toISOString(), member: null };
    setItems(items.map(function(i) { return i.id !== itemId ? i : Object.assign({}, i, { current_signups: i.current_signups + quantity }); }));
    setResponses(responses.concat([optimisticResponse]));
    setSignupQuantities(Object.assign({}, signupQuantities, { [itemId]: 1 }));

    try {
      setSubmitting(true);
      var res = await supabase.from('signup_responses').insert({ item_id: itemId, member_id: currentUserId, quantity: quantity });
      if (res.error) throw res.error;
      await fetchData();
      mascotSuccessToast('Signed up!', item.item_name);
    } catch (err) {
      setItems(items.map(function(i) { return i.id !== itemId ? i : Object.assign({}, i, { current_signups: i.current_signups - quantity }); }));
      setResponses(responses.filter(function(r) { return r.id !== '__optimistic__' + itemId; }));
      mascotErrorToast('Failed to sign up.', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  var handleUnsignUp = async function(itemId) {
    if (submitting) return;
    var existingResponse = responses.find(function(r) { return r.item_id === itemId && r.member_id === currentUserId; });
    var quantity = existingResponse ? (existingResponse.quantity || 1) : 1;

    setItems(items.map(function(i) { return i.id !== itemId ? i : Object.assign({}, i, { current_signups: Math.max(0, i.current_signups - quantity) }); }));
    setResponses(responses.filter(function(r) { return !(r.item_id === itemId && r.member_id === currentUserId); }));

    try {
      setSubmitting(true);
      var res = await supabase.from('signup_responses').delete().eq('item_id', itemId).eq('member_id', currentUserId);
      if (res.error) throw res.error;
      mascotSuccessToast('Removed from sign-up.');
    } catch (err) {
      await fetchData();
      mascotErrorToast('Failed to remove sign-up.', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Map to <Card/> props ────────────────────────────────────────────────────

  if (!form) return null;

  var metadata = [{ type: 'calendar', text: 'Created ' + formatDateShort(form.created_at) }];
  if (form.closes_at) {
    metadata.push({ type: 'calendar', text: (isClosed ? 'Closed ' : 'Closes ') + formatDate(form.closes_at) });
  }

  var badges = [];
  if (isAdmin && !isLive) badges.push({ variant: 'neutral', label: 'Draft' });
  if (isClosed) badges.push({ variant: 'neutral', label: 'Closed' });
  if (isClosingSoon()) badges.push({ variant: 'pending', label: 'Closing Soon' });

  var footerLeftText = totalSignups > 0
    ? totalSignups + ' ' + (totalSignups === 1 ? 'response' : 'responses') + (responseRate !== null ? ' (' + responseRate + '% of members)' : '')
    : 'No responses yet';

  var expandableContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {selectMode && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={function() { if (onToggleSelect) onToggleSelect(form.id); }}
          aria-label={'Select ' + form.title}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton variant="card" className="block" />
          <Skeleton variant="card" className="block" />
        </div>
      ) : items.length === 0 ? (
        <p style={{ fontSize: '14px', color: TEXT_MUTED, textAlign: 'center', padding: '24px 0' }}>This form has no sign-up slots added.</p>
      ) : (
        items.map(function(item) {
          var itemResponses = getItemResponses(item.id);
          var userSignedUp = hasUserSignedUp(item.id);
          var itemFull = isItemFull(item);
          var spotsRemaining = item.max_slots - item.current_signups;
          var showResponses = isAdmin || form.show_responses;

          return (
            <div key={item.id} style={{ background: ITEM_BG, border: '0.5px solid ' + CARD_BDR, borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 4px' }}>{item.item_name}</h4>
                  {item.description && <p style={{ fontSize: '13px', color: TEXT_SEC, marginBottom: '8px' }}>{item.description}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: itemResponses.length > 0 && showResponses ? '8px' : 0 }}>
                    <span style={{ fontSize: '13px', color: itemFull ? '#EF4444' : TEXT_SEC, fontWeight: itemFull ? 600 : 400 }}>
                      {item.current_signups} of {item.max_slots} {item.max_slots === 1 ? 'spot' : 'spots'} filled
                    </span>
                    {!itemFull && spotsRemaining > 0 && <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>({spotsRemaining} left)</span>}
                  </div>

                  {showResponses && itemResponses.length > 0 && (
                    <div style={{ background: RESPONSES_BG, borderRadius: '8px', padding: '10px', marginTop: '8px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Signed up</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {itemResponses.map(function(response) {
                          return (
                            <div key={response.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                              <span style={{ color: TEXT_SEC }}>
                                {response.member ? (response.member.first_name + ' ' + response.member.last_name) : '(loading)'}
                                {response.quantity > 1 && <span style={{ color: '#3B82F6', fontWeight: 600 }}> &times;{response.quantity}</span>}
                              </span>
                              {response.member_id === currentUserId && <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>(You)</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

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
                              onChange={function(e) { setSignupQuantities(Object.assign({}, signupQuantities, { [item.id]: e.target.value })); }}
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
  );

  var footerRight = isAdmin ? (
    <ActionsDropdown
      triggerLabel={'Actions for ' + form.title}
      onEdit={function() { setShowEditModal(true); }}
      onDuplicate={handleDuplicate}
      onExport={handleExportCSV}
      onMakeTemplate={function() { setShowTemplateModal(true); }}
      pinState={isPinned ? 'pinned' : 'unpinned'}
      onPinToggle={handlePinToggle}
      onRemind={handleRemind}
      closeState={isClosed ? 'closed' : 'open'}
      onCloseToggle={handleCloseToggle}
      isLive={isLive}
      onUnpublish={handleUnpublish}
      onDelete={function() { setDeleteConfirm(true); }}
    />
  ) : null;

  return (
    <>
      <Card
        title={form.title}
        description={form.description}
        metadata={metadata}
        badges={badges}
        pinned={isPinned}
        expandable={true}
        isExpanded={isExpanded}
        onToggleExpand={function() { setIsExpanded(!isExpanded); }}
        expandableContent={expandableContent}
        footerLeft={footerLeftText}
        footerRight={footerRight}
        ariaLabel={'Sign-up form: ' + form.title}
      />

      {showEditModal && (
        <CreateSignupForm
          organizationId={form.organization_id}
          currentUserId={currentUserId}
          editingItem={Object.assign({}, form, { items: items })}
          onClose={function() { setShowEditModal(false); }}
          onSaved={handleEditSaved}
        />
      )}

      {showTemplateModal && (
        <MakeTemplateModal
          defaultName={form.title + ' Template'}
          onSave={handleMakeTemplate}
          onCancel={function() { setShowTemplateModal(false); }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title={'Delete "' + form.title + '"?'}
          message="This sign-up form and all responses will be permanently deleted. This cannot be undone."
          confirmLabel="Delete Form"
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={function() { setDeleteConfirm(false); }}
        />
      )}
    </>
  );
}

export default SignupFormCard;