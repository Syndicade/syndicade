import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Users, Check, X, Trash2 } from 'lucide-react';

/**
 * SignupFormCard Component
 * Displays a sign-up form with items and allows members to sign up/unsign up
 * Shows who has signed up if form allows it
 */
function SignupFormCard({ form, currentUserId, userRole, onDelete, onUpdate }) {
  const [items, setItems] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch items and responses
  useEffect(() => {
    fetchData();
  }, [form.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('signup_items')
        .select('*')
        .eq('form_id', form.id)
        .order('order_number', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('signup_responses')
        .select(`
          *,
          member:member_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .in('item_id', (itemsData || []).map(item => item.id));

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);

    } catch (err) {
      console.error('Error fetching signup data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has signed up for an item
  const hasUserSignedUp = (itemId) => {
    return responses.some(r => r.item_id === itemId && r.member_id === currentUserId);
  };

  // Get responses for an item
  const getItemResponses = (itemId) => {
    return responses.filter(r => r.item_id === itemId);
  };

  // Check if item is full
  const isItemFull = (item) => {
    return item.current_signups >= item.max_slots;
  };

  // Handle sign up
  const handleSignUp = async (itemId) => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const { error: signupError } = await supabase
        .from('signup_responses')
        .insert({
          item_id: itemId,
          member_id: currentUserId
        });

      if (signupError) throw signupError;

      // Refresh data
      await fetchData();
      if (onUpdate) onUpdate();

    } catch (err) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle unsign up
  const handleUnsignUp = async (itemId) => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('signup_responses')
        .delete()
        .eq('item_id', itemId)
        .eq('member_id', currentUserId);

      if (deleteError) throw deleteError;

      // Refresh data
      await fetchData();
      if (onUpdate) onUpdate();

    } catch (err) {
      console.error('Error unsigning up:', err);
      setError(err.message || 'Failed to unsign up');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete form (admin only)
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this sign-up form? This cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('signup_forms')
        .delete()
        .eq('id', form.id);

      if (deleteError) throw deleteError;

      if (onDelete) onDelete();

    } catch (err) {
      console.error('Error deleting form:', err);
      alert('Failed to delete form: ' + err.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Check if form is closed
  const isClosed = form.status === 'closed' || (form.closes_at && new Date(form.closes_at) < new Date());

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{form.title}</h3>
              {isClosed && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                  Closed
                </span>
              )}
            </div>
            {form.description && (
              <p className="text-gray-600 text-sm mb-3">{form.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Created {formatDate(form.created_at)}</span>
              </div>
              {form.closes_at && (
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>Closes {formatDate(form.closes_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {userRole === 'admin' && (
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 transition-colors p-2"
              aria-label="Delete form"
              title="Delete form"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Items List */}
      <div className="p-6 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p>No items in this sign-up form yet.</p>
          </div>
        ) : (
          items.map((item) => {
            const itemResponses = getItemResponses(item.id);
            const userSignedUp = hasUserSignedUp(item.id);
            const itemFull = isItemFull(item);
            const spotsRemaining = item.max_slots - item.current_signups;

            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {item.item_name}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}

                    {/* Availability */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={16} className={itemFull ? 'text-red-500' : 'text-blue-600'} />
                        <span className={itemFull ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {item.current_signups} of {item.max_slots} {item.max_slots === 1 ? 'spot' : 'spots'} filled
                        </span>
                      </div>
                      {!itemFull && spotsRemaining > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          ({spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} left)
                        </span>
                      )}
                    </div>

                    {/* Who Signed Up (if allowed) */}
                    {form.show_responses && itemResponses.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Signed up:</p>
                        <div className="space-y-1">
                          {itemResponses.map((response) => (
                            <div key={response.id} className="flex items-center gap-2 text-sm">
                              <Check size={14} className="text-green-600" />
                              <span className="text-gray-700">
                                {response.member?.first_name} {response.member?.last_name}
                              </span>
                              {response.member_id === currentUserId && (
                                <span className="text-xs text-blue-600">(You)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sign Up Button */}
                  <div>
                    {!isClosed && (
                      <>
                        {userSignedUp ? (
                          <button
                            onClick={() => handleUnsignUp(item.id)}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Unsign up"
                          >
                            <X size={16} />
                            <span className="text-sm font-medium">Unsign Up</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSignUp(item.id)}
                            disabled={submitting || itemFull}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Sign up"
                          >
                            <Check size={16} />
                            <span className="text-sm font-medium">
                              {itemFull ? 'Full' : 'Sign Up'}
                            </span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SignupFormCard;