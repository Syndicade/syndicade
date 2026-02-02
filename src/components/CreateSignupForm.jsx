import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';

/**
 * CreateSignupForm Component
 * Allows admins to create sign-up forms with multiple items/slots
 * Similar to surveys but for volunteer lists, time slots, potluck items, etc.
 */
function CreateSignupForm({ organizationId, onClose, onFormCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allow_multiple_signups: false,
    show_responses: true,
    closes_at: ''
  });
  
  const [items, setItems] = useState([
    { item_name: '', description: '', max_slots: 1 }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add new item to the list
  const addItem = () => {
    setItems([...items, { item_name: '', description: '', max_slots: 1 }]);
  };

  // Remove item from list
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a form title');
      return false;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].item_name.trim()) {
        setError(`Item ${i + 1} needs a name`);
        return false;
      }
      if (items[i].max_slots < 1) {
        setError(`Item ${i + 1} must have at least 1 slot`);
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the form
      const { data: newForm, error: formError } = await supabase
        .from('signup_forms')
        .insert({
          organization_id: organizationId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          allow_multiple_signups: formData.allow_multiple_signups,
          show_responses: formData.show_responses,
          closes_at: formData.closes_at || null,
          created_by: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (formError) throw formError;

      // Create items with order numbers
      const itemsToInsert = items.map((item, index) => ({
        form_id: newForm.id,
        item_name: item.item_name.trim(),
        description: item.description.trim() || null,
        max_slots: parseInt(item.max_slots),
        order_number: index + 1
      }));

      const { error: itemsError } = await supabase
        .from('signup_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Success!
      if (onFormCreated) onFormCreated();
      onClose();

    } catch (err) {
      console.error('Error creating signup form:', err);
      setError(err.message || 'Failed to create sign-up form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-signup-form-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 id="create-signup-form-title" className="text-2xl font-bold text-gray-900">
            Create Sign-Up Form
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div 
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form Title */}
          <div>
            <label htmlFor="form-title" className="block text-sm font-medium text-gray-700 mb-2">
              Form Title *
            </label>
            <input
              type="text"
              id="form-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Volunteer Sign-Up, Potluck Items, Time Slots"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="form-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="form-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide additional details about this sign-up..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow-multiple"
                checked={formData.allow_multiple_signups}
                onChange={(e) => setFormData({ ...formData, allow_multiple_signups: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allow-multiple" className="ml-2 text-sm text-gray-700">
                Allow members to sign up for multiple items
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-responses"
                checked={formData.show_responses}
                onChange={(e) => setFormData({ ...formData, show_responses: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-responses" className="ml-2 text-sm text-gray-700">
                Show who signed up to all members
              </label>
            </div>
          </div>

          {/* Close Date */}
          <div>
            <label htmlFor="close-date" className="block text-sm font-medium text-gray-700 mb-2">
              Close Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="close-date"
              value={formData.closes_at}
              onChange={(e) => setFormData({ ...formData, closes_at: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Form will automatically close at this date/time
            </p>
          </div>

          {/* Items Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Sign-Up Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Add new item"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-2 text-gray-400">
                      <GripVertical size={20} />
                    </div>

                    <div className="flex-1 space-y-3">
                      {/* Item Name */}
                      <div>
                        <label htmlFor={`item-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          id={`item-name-${index}`}
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                          placeholder="e.g., Bring dessert, 9:00 AM slot, Setup help"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      {/* Item Description */}
                      <div>
                        <label htmlFor={`item-desc-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          id={`item-desc-${index}`}
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Additional details..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Max Slots */}
                      <div>
                        <label htmlFor={`max-slots-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Spots
                        </label>
                        <input
                          type="number"
                          id={`max-slots-${index}`}
                          value={item.max_slots}
                          onChange={(e) => updateItem(index, 'max_slots', e.target.value)}
                          min="1"
                          max="100"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          How many people can sign up for this?
                        </p>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-2 text-red-600 hover:text-red-700 transition-colors"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Sign-Up Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSignupForm;