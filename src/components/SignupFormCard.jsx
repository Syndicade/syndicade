import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { Calendar, Users, Check, X, Trash2, ClipboardList } from 'lucide-react';

function SignupFormCard({ form, currentUserId, userRole, onDelete, onUpdate }) {
  var { isDark } = useTheme();
  var [items, setItems] = useState([]);
  var [responses, setResponses] = useState([]);
  var [loading, setLoading] = useState(true);
  var [submitting, setSubmitting] = useState(false);
  var [signupQuantities, setSignupQuantities] = useState({});

  useEffect(function() { fetchData(); }, [form.id]);

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

      var { data: responsesData, error: responsesError } = await supabase
        .from('signup_responses')
        .select('*, member:members!signup_responses_member_id_fkey(user_id,first_name,last_name,email)')
        .in('item_id', (itemsData || []).map(function(i) { return i.id; }));
      if (responsesError) throw responsesError;
      setResponses(responsesData || []);
    } catch (err) {
      console.error('Error fetching signup data:', err);
      toast.error('Failed to load sign-up data.');
    } finally {
      setLoading(false);
    }
  };

  var hasUserSignedUp = function(itemId) {
    return responses.some(function(r) { return r.item_id === itemId && r.member_id === currentUserId; });
  };

  var getItemResponses = function(itemId) {
    return responses.filter(function(r) { return r.item_id === itemId; });
  };

  var isItemFull = function(item) {
    return item.current_signups >= item.max_slots;
  };

  var handleSignUp = async function(itemId) {
    if (submitting) return;
    var quantity = parseInt(signupQuantities[itemId]) || 1;
    var item = items.find(function(i) { return i.id === itemId; });
    var available = item.max_slots - item.current_signups;
    if (quantity > available) {
      toast.error('Only ' + available + ' slot' + (available !== 1 ? 's' : '') + ' available.');
      return;
    }
    try {
      setSubmitting(true);
      var { error: signupError } = await supabase
        .from('signup_responses')
        .insert({ item_id: itemId, member_id: currentUserId, quantity: quantity });
      if (signupError) throw signupError;
      setSignupQuantities(function(prev) { return Object.assign({}, prev, { [itemId]: 1 }); });
      await fetchData();
      if (onUpdate) onUpdate();
      mascotSuccessToast('Signed up!', item.item_name);
    } catch (err) {
      console.error('Error signing up:', err);
      mascotErrorToast('Failed to sign up.', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  var handleUnsignUp = async function(itemId) {
    if (submitting) return;
    try {
      setSubmitting(true);
      var { error: deleteError } = await supabase
        .from('signup_responses')
        .delete()
        .eq('item_id', itemId)
        .eq('member_id', currentUserId);
      if (deleteError) throw deleteError;
      setSignupQuantities(function(prev) { return Object.assign({}, prev, { [itemId]: 1 }); });
      await fetchData();
      if (onUpdate) onUpdate();
      mascotSuccessToast('Removed from sign-up.');
    } catch (err) {
      console.error('Error unsigning up:', err);
      mascotErrorToast('Failed to remove sign-up.', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  var handleDelete = async function() {
    if (!window.confirm('Delete this sign-up form? This cannot be undone.')) return;
    try {
      var { error: deleteError } = await supabase
        .from('signup_forms')
        .delete()
        .eq('id', form.id);
      if (deleteError) throw deleteError;
      mascotSuccessToast('Form deleted.');
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting form:', err);
      mascotErrorToast('Failed to delete form.', err.message);
    }
  };

  var formatDate = function(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  var isClosed = form.status === 'closed' || (form.closes_at && new Date(form.closes_at) < new Date());

  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var cardBorder = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var textMuted = isDark ? '#94A3B8' : '#64748B';
  var itemBg = isDark ? '#0E1523' : '#F8FAFC';
  var itemBorder = isDark ? '#2A3550' : '#E2E8F0';
  var responsesBg = isDark ? '#151B2D' : '#F1F5F9';
  var inputBg = isDark ? '#1E2845' : '#FFFFFF';
  var inputBorder = isDark ? '#2A3550' : '#CBD5E1';

  if (loading) {
    return (
      <div style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '24px', borderRadius: '6px', background: isDark ? '#1E2845' : '#E2E8F0', width: '60%' }} className="animate-pulse" />
          <div style={{ height: '16px', borderRadius: '6px', background: isDark ? '#1E2845' : '#E2E8F0', width: '40%' }} className="animate-pulse" />
          <div style={{ height: '80px', borderRadius: '8px', background: isDark ? '#1E2845' : '#E2E8F0' }} className="animate-pulse" />
          <div style={{ height: '80px', borderRadius: '8px', background: isDark ? '#1E2845' : '#E2E8F0' }} className="animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <article style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid ' + cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, margin: 0 }}>{form.title}</h3>
              {isClosed && (
                <span style={{ padding: '2px 8px', background: isDark ? '#1E2845' : '#F1F5F9', color: textMuted, fontSize: '11px', fontWeight: 600, borderRadius: '99px', border: '1px solid ' + cardBorder }}>
                  Closed
                </span>
              )}
            </div>
            {form.description && (
              <p style={{ fontSize: '14px', color: textSecondary, marginBottom: '12px', lineHeight: '1.6' }}>{form.description}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: textMuted }}>
                <Calendar size={14} aria-hidden="true" />
                <span>Created {formatDate(form.created_at)}</span>
              </div>
              {form.closes_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: textMuted }}>
                  <Calendar size={14} aria-hidden="true" />
                  <span>Closes {formatDate(form.closes_at)}</span>
                </div>
              )}
            </div>
          </div>

          {userRole === 'admin' && (
            <button
              onClick={handleDelete}
              style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label={'Delete form: ' + form.title}
              className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <ClipboardList size={36} style={{ color: textMuted, margin: '0 auto 12px' }} aria-hidden="true" />
            <p style={{ fontSize: '14px', color: textMuted }}>No items in this form yet.</p>
          </div>
        ) : (
          items.map(function(item) {
            var itemResponses = getItemResponses(item.id);
            var userSignedUp = hasUserSignedUp(item.id);
            var itemFull = isItemFull(item);
            var spotsRemaining = item.max_slots - item.current_signups;

            return (
              <div
                key={item.id}
                style={{ background: itemBg, border: '1px solid ' + itemBorder, borderRadius: '10px', padding: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: textPrimary, margin: '0 0 4px' }}>{item.item_name}</h4>
                    {item.description && (
                      <p style={{ fontSize: '13px', color: textSecondary, marginBottom: '8px' }}>{item.description}</p>
                    )}

                    {/* Slots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Users size={14} style={{ color: itemFull ? '#EF4444' : '#3B82F6', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ fontSize: '13px', color: itemFull ? '#EF4444' : textSecondary, fontWeight: itemFull ? 600 : 400 }}>
                        {item.current_signups} of {item.max_slots} {item.max_slots === 1 ? 'spot' : 'spots'} filled
                      </span>
                      {!itemFull && spotsRemaining > 0 && (
                        <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>
                          ({spotsRemaining} left)
                        </span>
                      )}
                    </div>

                    {/* Who signed up */}
                    {form.show_responses && itemResponses.length > 0 && (
                      <div style={{ background: responsesBg, borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Signed up</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {itemResponses.map(function(response) {
                            return (
                              <div key={response.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <Check size={13} style={{ color: '#22C55E', flexShrink: 0 }} aria-hidden="true" />
                                <span style={{ color: textSecondary }}>
                                  {response.member?.first_name} {response.member?.last_name}
                                  {response.quantity > 1 && (
                                    <span style={{ color: '#3B82F6', fontWeight: 600 }}> &times;{response.quantity}</span>
                                  )}
                                </span>
                                {response.member?.user_id === currentUserId && (
                                  <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>(You)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action column */}
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
                              <label htmlFor={'qty-' + item.id} style={{ fontSize: '11px', fontWeight: 600, color: textMuted, display: 'block', marginBottom: '4px' }}>
                                Quantity
                              </label>
                              <input
                                type="number"
                                id={'qty-' + item.id}
                                min="1"
                                max={spotsRemaining}
                                value={signupQuantities[item.id] || ''}
                                placeholder="1"
                                onChange={function(e) { setSignupQuantities(function(prev) { return Object.assign({}, prev, { [item.id]: e.target.value }); }); }}
                                style={{ width: '100%', padding: '6px 10px', background: inputBg, border: '1px solid ' + inputBorder, borderRadius: '6px', color: textPrimary, fontSize: '13px' }}
                                disabled={submitting}
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label={'Quantity for ' + item.item_name}
                              />
                            </div>
                          )}
                          <button
                            onClick={function() { handleSignUp(item.id); }}
                            disabled={submitting || itemFull}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 14px', background: itemFull ? (isDark ? '#1E2845' : '#E2E8F0') : '#3B82F6', color: itemFull ? textMuted : '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: (submitting || itemFull) ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}
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
    </article>
  );
}

export default SignupFormCard;