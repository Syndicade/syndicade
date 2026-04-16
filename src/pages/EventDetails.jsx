import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadICS } from '../lib/icalGenerator';
import toast from 'react-hot-toast';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog" aria-modal="true" aria-labelledby="checkout-form-title">
      <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl shadow-xl w-full max-w-lg my-8">

        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2A3550]">
          <div>
            <h2 id="checkout-form-title" className="text-lg font-bold text-white">Almost there</h2>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              {totalQty} ticket{totalQty !== 1 ? 's' : ''} — {formatPrice(orderTotal)} total
            </p>
          </div>
          <button type="button" onClick={onCancel}
            className="p-2 text-[#64748B] hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor={inputId} className="block text-sm font-semibold text-[#CBD5E1] mb-1.5">
                    {f.label}
                    {f.is_required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
                    {!f.is_required && <span className="text-[#64748B] text-xs font-normal ml-1">(optional)</span>}
                  </label>
                  {f.field_type === 'dropdown' ? (
                    <select id={inputId} value={values[f.id]} required={f.is_required}
                      onChange={function(e) { handleChange(f.id, e.target.value); }}
                      className="w-full px-4 py-3 bg-[#0E1523] border border-[#2A3550] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select an option...</option>
                      {(f.options || []).map(function(opt) {
                        return <option key={opt} value={opt}>{opt}</option>;
                      })}
                    </select>
                  ) : f.field_type === 'checkbox' ? (
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0E1523] border border-[#2A3550] rounded-lg">
                      <input type="checkbox" id={inputId} checked={values[f.id] === 'yes'}
                        onChange={function(e) { handleChange(f.id, e.target.checked ? 'yes' : ''); }}
                        className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"/>
                      <span className="text-sm text-[#CBD5E1]">Yes</span>
                    </label>
                  ) : (
                    <input id={inputId}
                      type={f.field_type === 'email' ? 'email' : f.field_type === 'phone' ? 'tel' : 'text'}
                      value={values[f.id]}
                      required={f.is_required}
                      onChange={function(e) { handleChange(f.id, e.target.value); }}
                      placeholder={f.field_type === 'email' ? 'your@email.com' : f.field_type === 'phone' ? '(555) 000-0000' : ''}
                      className="w-full px-4 py-3 bg-[#0E1523] border border-[#2A3550] rounded-lg text-white text-sm placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-[#2A3550] flex items-center gap-3">
            <button type="button" onClick={onCancel}
              className="px-5 py-2.5 bg-transparent border border-[#2A3550] text-[#CBD5E1] font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm">
              Back
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-5 py-2.5 bg-[#F5B731] text-[#0E1523] font-bold rounded-lg hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {submitting ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Redirecting...</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Continue to Payment — {formatPrice(orderTotal)}</>
              )}
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

      // Fetch org — include logo_url and slug for email branding
      var { data: orgData } = await supabase
        .from('organizations')
        .select('name, logo_url, slug')
        .eq('id', eventData.organization_id)
        .single();
      if (orgData) setOrganization(orgData);

      if (user) {
        var { data: membership } = await supabase
          .from('memberships').select('role')
          .eq('member_id', user.id).eq('organization_id', eventData.organization_id).eq('status', 'active').single();
        if (membership) {
          setIsMember(true);
          if (membership.role === 'admin') setIsAdmin(true);
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

  // Build org URL for emails
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
          toast.success('Payment confirmed — you\'re going!');
        } else {
          toast.success('RSVP updated — you\'re going!');
        }

        var memberRes = await supabase.from('members').select('email, first_name').eq('user_id', currentUser.id).single();
        if (memberRes.data && memberRes.data.email) {
          var eventDate = new Date(event.start_time).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
          var eventTime = new Date(event.start_time).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
// Re-fetch org to ensure data is available (state may not be set yet on Stripe return)
          var orgName = organization ? organization.name : '';
          var orgLogoUrl = organization ? (organization.logo_url || '') : '';
          var orgUrl = getOrgUrl();
          if (!orgName && event.organization_id) {
            var orgRefetch = await supabase.from('organizations')
              .select('name, logo_url, slug').eq('id', event.organization_id).single();
            if (orgRefetch.data) {
              orgName = orgRefetch.data.name || '';
              orgLogoUrl = orgRefetch.data.logo_url || '';
              orgUrl = orgRefetch.data.slug
                ? APP_URL + '/org/' + orgRefetch.data.slug
                : APP_URL;
            }
          }

          if (fromTicket) {
var purchaseRes = await supabase.from('ticket_purchases').select('*')
              .eq('event_id', event.id).eq('member_id', currentUser.id).order('purchased_at', { ascending: false }).limit(10);
            var allPurchases = purchaseRes.data || [];
            // Only use purchases from the most recent Stripe session
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
        toast.success('RSVP updated.');
      }

      setTimeout(function() { setRsvpSuccess(false); }, 3000);
    } catch (err) {
      console.error('RSVP error:', err);
      toast.error('Failed to update RSVP. Please try again.');
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
            eventUrl: window.location.href,
          },
        }),
      });
    } catch (err) {
      toast.error('Failed to submit RSVP. Please try again.');
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
      toast.error('Could not start checkout: ' + err.message);
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
      toast.success('Event deleted.'); navigate('/events');
    } catch (err) { toast.error('Failed to delete event. Please try again.'); }
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
      toast.success('Event instance deleted.'); navigate('/events');
    } catch (err) { toast.error('Failed to delete event. Please try again.'); }
  };

  var handleDeleteFutureInstances = async function() {
    if (!confirm('Delete this and all future instances of this event?')) return;
    try {
      var parentId = event.parent_event_id || event.id;
      var { error } = await supabase.from('events').delete()
        .or('id.eq.' + eventId + ',and(parent_event_id.eq.' + parentId + ',start_time.gte.' + event.start_time + ')');
      if (error) throw error;
      toast.success('Future instances deleted.'); navigate('/events');
    } catch (err) { toast.error('Failed to delete future instances. Please try again.'); }
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
      toast.success('Recurring event series deleted. Past occurrences preserved.'); navigate('/events');
    } catch (err) { toast.error('Failed to delete series. Please try again.'); }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1523] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-5xl mx-auto px-6">
          <div className="h-8 bg-[#1A2035] rounded-lg animate-pulse w-48"/>
          <div className="h-12 bg-[#1A2035] rounded-lg animate-pulse w-2/3"/>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-[#1A2035] rounded-xl animate-pulse"/>
              <div className="h-40 bg-[#1A2035] rounded-xl animate-pulse"/>
              <div className="h-60 bg-[#1A2035] rounded-xl animate-pulse"/>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-[#1A2035] rounded-xl animate-pulse"/>
              <div className="h-32 bg-[#1A2035] rounded-xl animate-pulse"/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0E1523] flex items-center justify-center p-4">
        <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-8 max-w-md w-full text-center" role="alert">
          <div className="w-14 h-14 rounded-full bg-[#1E2845] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-[#94A3B8] mb-6">{error || 'This event does not exist or you do not have permission to view it.'}</p>
          <Link to="/events" className="inline-block px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]">
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

  return (
    <div className="min-h-screen bg-[#0E1523]">

      {/* Header */}
      <div className="bg-[#151B2D] border-b border-[#2A3550]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <Link to="/events"
              className="flex items-center gap-2 text-[#CBD5E1] hover:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Events
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={function() { downloadICS(event); }}
                className="px-3 py-2 bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]">
                Add to Calendar
              </button>
              <button onClick={function() { window.print(); }}
                className="px-3 py-2 bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]">
                Print
              </button>
              {isAdmin && (
                <>
                  <button onClick={function() { setShowAttendanceReport(true); }}
                    className="px-3 py-2 bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]">
                    Full Report
                  </button>
                  <button onClick={handleEditClick}
                    className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]">
                    Edit
                  </button>
                  <button onClick={handleDeleteClick}
                    className="px-3 py-2 bg-transparent border border-[#EF4444] text-[#EF4444] text-sm font-semibold rounded-lg hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 flex-wrap">
            {event.is_recurring && (
              <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-semibold bg-[#1D3461] text-blue-400">Recurring</span>
            )}
            {isPaidEvent && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full text-xs font-semibold bg-[#2A1F00] border border-[#F5B731] text-[#F5B731]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Ticketed Event
              </span>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-white">{event.title}</h1>
              {event.is_recurring && (
                <p className="text-sm text-blue-400 mt-1 font-semibold">
                  {event.parent_event_id ? 'Part of recurring series' : 'Recurring event series'}
                </p>
              )}
            </div>
          </div>
          {organization && <p className="text-[#94A3B8] mt-1">{organization.name}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {rsvpSuccess && (
              <div className="bg-[#1B3A2F] border border-green-700 rounded-xl p-4" role="alert">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-green-400 font-semibold text-sm">
                    {isPaidEvent ? 'Ticket confirmed — see you there!' : 'RSVP updated successfully!'}
                  </p>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
              <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>Date & Time</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Date</p>
                  <p className="text-white font-semibold">{formatDate(event.start_time)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Time</p>
                  <p className="text-white font-semibold">
                    {formatTime(event.start_time)}{event.end_time && ' – ' + formatTime(event.end_time)}
                  </p>
                </div>
                {isPastEvent && (
                  <div className="mt-2 bg-[#1E2845] border border-[#2A3550] rounded-lg p-3">
                    <p className="text-sm text-[#94A3B8]">This event has already occurred.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
              <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>
                {event.is_virtual ? 'Virtual Event' : 'Location'}
              </p>
              {event.is_virtual ? (
                <div>
                  <p className="text-[#CBD5E1] mb-3">This is a virtual event.</p>
                  {event.virtual_link ? (
                    userRsvp === 'going' ? (
                      <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]">
                        Join Virtual Event
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ) : (
                      <p className="text-sm text-[#64748B]">
                        {isPaidEvent ? 'Purchase a ticket to see the virtual event link.' : 'RSVP "Going" to see the virtual event link.'}
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-[#64748B]">Virtual event link will be shared closer to the event date.</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-white font-semibold mb-3">{event.location}</p>
                  <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(event.location)}
                    target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    View on Map →
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>Description</p>
                <p className="text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Capacity */}
            {event.max_attendees && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>Capacity</p>
                <div className="flex items-center justify-between">
                  <p className="text-[#CBD5E1]">
                    <span className="text-2xl font-extrabold text-white">{counts.going + guestRsvpCount}</span>
                    <span className="text-[#94A3B8]"> / {event.max_attendees} spots filled</span>
                  </p>
                  {(counts.going + guestRsvpCount) >= event.max_attendees && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-red-300">Event Full</span>
                  )}
                </div>
              </div>
            )}

            {/* QR Code */}
            <EventQRCode event={event}/>

            {/* Attendance Check-In — only on event day if enabled */}
            {showCheckIn && (
              <AttendanceCheckIn
                event={event}
                currentUser={currentUser}
                userRole={isAdmin ? 'admin' : 'member'}
                organizationId={event.organization_id}
              />
            )}

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* RSVP / Ticket card — members only */}
            {!isPastEvent && currentUser && isMember && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                {isPaidEvent ? (
                  <>
                    <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'4px'}}>Tickets</p>
                    <p className="text-[#94A3B8] text-xs mb-4">Processed securely via Stripe.</p>

                    {hasTicket ? (
                      <div className="space-y-3">
                        <div className="w-full px-4 py-3 rounded-lg font-semibold text-sm text-center bg-green-600 text-white flex items-center justify-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Ticket Confirmed
                        </div>
                        <div className="border-t border-[#2A3550] pt-3 space-y-2">
                          <button onClick={function() { handleRsvp('maybe'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp==='maybe'?'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500':'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}>
                            Maybe
                          </button>
                          <button onClick={function() { handleRsvp('not_going'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp==='not_going'?'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500':'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}>
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
                            <div key={tt.id} className={'rounded-xl border p-3 ' + (soldOut?'border-[#2A3550] opacity-50':'border-[#2A3550] bg-[#0E1523]')}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold text-sm">{tt.name}</p>
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    <span className="text-[#F5B731] font-bold text-sm">{formatPrice(active.price)}</span>
                                    {active.isEarlyBird && (
                                      <>
                                        <span className="text-[#64748B] line-through text-xs">{formatPrice(tt.price)}</span>
                                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-yellow-900 text-yellow-300">Early Bird</span>
                                      </>
                                    )}
                                  </div>
                                  {active.isEarlyBird && tt.early_bird_ends_at && (
                                    <p className="text-xs text-[#64748B] mt-0.5">Ends {new Date(tt.early_bird_ends_at).toLocaleDateString('en-US', {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</p>
                                  )}
                                  {remaining != null && !soldOut && <p className="text-xs text-[#64748B] mt-0.5">{remaining} remaining</p>}
                                  {soldOut && <p className="text-xs text-red-400 mt-0.5 font-semibold">Sold Out</p>}
                                </div>
                                {!soldOut && (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button type="button" onClick={function() { updateQty(tt.id, -1); }} disabled={qty===0}
                                      aria-label={'Decrease quantity for ' + tt.name}
                                      className="w-8 h-8 rounded-lg bg-[#1E2845] border border-[#2A3550] text-white font-bold flex items-center justify-center hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-30">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    </button>
                                    <span className="w-6 text-center text-white font-bold text-sm" aria-live="polite">{qty}</span>
                                    <button type="button" onClick={function() { updateQty(tt.id, 1); }} disabled={remaining!=null&&qty>=remaining}
                                      aria-label={'Increase quantity for ' + tt.name}
                                      className="w-8 h-8 rounded-lg bg-[#1E2845] border border-[#2A3550] text-white font-bold flex items-center justify-center hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-30">
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
                            <span className="text-[#94A3B8] text-sm">{totalQty} ticket{totalQty!==1?'s':''}</span>
                            <span className="text-white font-bold">{formatPrice(orderTotal)}</span>
                          </div>
                        )}

                        <button onClick={handleCheckoutClick} disabled={ticketLoading||totalQty===0}
                          className="w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-[#F5B731] text-[#0E1523] hover:bg-yellow-300">
                          {ticketLoading ? (
                            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Redirecting...</>
                          ) : totalQty === 0 ? 'Select tickets above' : (
                            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Checkout — {formatPrice(orderTotal)}</>
                          )}
                        </button>

                        <div className="border-t border-[#2A3550] pt-3 space-y-2">
                          <button onClick={function() { handleRsvp('maybe'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp==='maybe'?'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500':'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}>
                            Maybe
                          </button>
                          <button onClick={function() { handleRsvp('not_going'); }} disabled={rsvpLoading}
                            className={'w-full px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp==='not_going'?'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500':'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}>
                            Can't Go
                          </button>
                        </div>
                        <p className="text-xs text-[#64748B] text-center">You'll be redirected to Stripe to complete payment.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>Your RSVP</p>
                    <div className="space-y-3">
                      <button onClick={function() { handleRsvp('going'); }} disabled={rsvpLoading}
                        className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp==='going'?'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500':'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}>
                        Going
                      </button>
                      <button onClick={function() { handleRsvp('maybe'); }} disabled={rsvpLoading}
                        className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp==='maybe'?'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500':'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}>
                        Maybe
                      </button>
                      <button onClick={function() { handleRsvp('not_going'); }} disabled={rsvpLoading}
                        className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp==='not_going'?'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500':'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}>
                        Can't Go
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Response counts — members only */}
            {isMember && <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
              <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>Responses</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#CBD5E1] text-sm">{isPaidEvent?'Tickets Sold':'Going'}</span>
                  <span className="font-bold text-green-400">{counts.going}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#CBD5E1] text-sm">Maybe</span>
                  <span className="font-bold text-yellow-400">{counts.maybe}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#CBD5E1] text-sm">Can't Go</span>
                  <span className="font-bold text-red-400">{counts.not_going}</span>
                </div>
              </div>
            </div>} 

            {/* Going list — members only */}
            {isMember && counts.going > 0 && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>
                  {(isPaidEvent?'Attending (':'Going (') + counts.going + ')'}
                </p>
                <ul className="space-y-2" role="list">
                  {rsvps.filter(function(r) { return r.status==='going'; }).slice(0,10).map(function(rsvp) {
                    return (
                      <li key={rsvp.id} className="flex items-center gap-3" role="listitem">
                        {rsvp.members?.profile_photo_url ? (
                          <img src={rsvp.members.profile_photo_url} alt={rsvp.members.first_name+' '+rsvp.members.last_name} className="w-8 h-8 rounded-full object-cover"/>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1D3461] text-blue-400 flex items-center justify-center font-bold text-xs" aria-hidden="true">
                            {rsvp.members?.first_name?.[0]}{rsvp.members?.last_name?.[0]}
                          </div>
                        )}
                        <span className="text-sm text-[#CBD5E1]">{rsvp.members?.first_name} {rsvp.members?.last_name}</span>
                      </li>
                    );
                  })}
                  {counts.going > 10 && <p className="text-sm text-[#64748B] mt-2">+ {counts.going-10} more</p>}
                </ul>
              </div>
            )}

{/* Guest RSVP — for non-members on free public events */}
            {!isPastEvent && !isMember && !isPaidEvent && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>RSVP to this Event</p>
                {guestRsvpSuccess ? (
                  <div className="text-center py-4" role="status">
                    <div className="w-12 h-12 rounded-full bg-[#1B3A2F] border border-green-700 flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-white font-bold text-base mb-1">You're on the list!</p>
                    <p className="text-[#94A3B8] text-sm">A confirmation has been sent to {guestInfo.email}.</p>
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
                            <label htmlFor={f.id} className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                              {f.label}{f.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
                            </label>
                            <input
                              id={f.id} type={f.type} required={f.required}
                              value={guestInfo[f.key]}
                              placeholder={f.placeholder}
                              onChange={function(e) { var u = {}; u[f.key] = e.target.value; setGuestInfo(function(p) { return Object.assign({}, p, u); }); }}
                              className="w-full px-3 py-2.5 bg-[#0E1523] border border-[#2A3550] rounded-lg text-white text-sm placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-required={f.required}
                            />
                          </div>
                        );
                      })}
                      <button type="submit" disabled={guestRsvpLoading}
                        className="w-full px-4 py-3 bg-blue-500 text-white font-bold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50 flex items-center justify-center gap-2">
                        {guestRsvpLoading ? (
                          <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting...</>
                        ) : 'RSVP to this Event'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Paid event prompt for non-members */}
            {!isPastEvent && !isMember && isPaidEvent && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6 text-center">
                <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'12px'}}>Tickets</p>
                <p className="text-[#CBD5E1] text-sm mb-4">You need to be a member of this organization to purchase tickets.</p>
                <Link to="/signup" className="inline-block px-5 py-2.5 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]">
                  Join to Get Tickets
                </Link>
              </div>
            )}
            
          </div>
        </div>
      </div>

      {showCheckoutForm && (
        <CheckoutFormModal
          fields={checkoutFields}
          totalQty={totalQty}
          orderTotal={orderTotal}
          onSubmit={handleGetTicket}
          onCancel={function() { setShowCheckoutForm(false); }}
        />
      )}

      {showRecurringOptions && (
        <RecurringEventOptions event={event} action={recurringAction} onSelect={handleRecurringOptionSelect}
          onCancel={function() { setShowRecurringOptions(false); setRecurringAction(null); }}/>
      )}

      {showEditModal && (
        <EditEvent isOpen={showEditModal} onClose={function() { setShowEditModal(false); setEditScope(null); }}
          onSuccess={handleEventUpdated} event={event} editScope={editScope}
          isRecurring={event.is_recurring||!!event.parent_event_id}/>
      )}

      {showAttendanceReport && (
        <AttendanceReport event={event} onClose={function() { setShowAttendanceReport(false); }}/>
      )}

    </div>
  );
}

export default EventDetails;