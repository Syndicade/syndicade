import { useState } from 'react';
import { supabase } from '../lib/supabase';

function CreateEvent({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    all_day: false,
    location: '',
    location_url: '',
    event_type: '',
    is_virtual: false,
    virtual_link: '',
    max_attendees: '',
    is_public: false,
    requires_rsvp: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const eventTypes = [
    { value: 'meeting', label: 'Meeting', icon: '👥' },
    { value: 'workshop', label: 'Workshop', icon: '🛠️' },
    { value: 'fundraiser', label: 'Fundraiser', icon: '💰' },
    { value: 'social', label: 'Social Event', icon: '🎉' },
    { value: 'volunteer', label: 'Volunteer Activity', icon: '🤝' },
    { value: 'training', label: 'Training', icon: '📚' },
    { value: 'other', label: 'Other', icon: '📌' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.title.trim().length < 3) {
        throw new Error('Event title must be at least 3 characters');
      }

      if (!formData.all_day) {
        if (!formData.start_date || !formData.start_time) {
          throw new Error('Start date and time are required');
        }
      } else {
        if (!formData.start_date) {
          throw new Error('Start date is required');
        }
      }

      let startDateTime;
      if (formData.all_day) {
        startDateTime = new Date(`${formData.start_date}T00:00:00`);
      } else {
        startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      }
      
      let endDateTime = null;
      if (formData.all_day && formData.end_date) {
        endDateTime = new Date(`${formData.end_date}T23:59:59`);
      } else if (!formData.all_day && formData.end_date && formData.end_time) {
        endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
        
        if (endDateTime <= startDateTime) {
          throw new Error('End time must be after start time');
        }
      }

      if (formData.is_virtual && formData.virtual_link) {
        try {
          new URL(formData.virtual_link);
        } catch {
          throw new Error('Please enter a valid URL for the virtual link');
        }
      }

      if (formData.location_url && formData.location_url.trim()) {
        try {
          new URL(formData.location_url);
        } catch {
          throw new Error('Please enter a valid URL for the location link');
        }
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const eventData = {
        organization_id: organizationId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime ? endDateTime.toISOString() : null,
        all_day: formData.all_day,
        location: formData.is_virtual ? 'Virtual' : formData.location.trim() || null,
        location_url: formData.location_url.trim() || null,
        event_type: formData.event_type || null,
        is_virtual: formData.is_virtual,
        virtual_link: formData.is_virtual ? formData.virtual_link.trim() : null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        is_public: formData.is_public,
        requires_rsvp: formData.requires_rsvp,
        created_by: user.id,
        created_at: new Date().toISOString(),
        is_cancelled: false,
        cancelled_reason: null,
        latitude: null,
        longitude: null,
        group_ids: null
      };

      const { data, error: createError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (createError) throw createError;

      if (onSuccess) {
        onSuccess(data);
      }

      setFormData({
        title: '',
        description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        all_day: false,
        location: '',
        location_url: '',
        event_type: '',
        is_virtual: false,
        virtual_link: '',
        max_attendees: '',
        is_public: false,
        requires_rsvp: true
      });

      onClose();

    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !loading) {
      onClose();
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={!loading ? onClose : undefined}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white z-10">
          <h2 
            id="create-event-title"
            className="text-2xl font-bold text-gray-900"
          >
            Create Event
          </h2>
          <p className="text-gray-600 mt-1">
            For {organizationName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
            >
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label 
              htmlFor="event-title"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Event Title *
            </label>
            <input
              id="event-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Monthly Board Meeting"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              aria-describedby="title-help"
              maxLength={200}
            />
            <p id="title-help" className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div>
            <label 
              htmlFor="event-type"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Event Type (Optional)
            </label>
            <select
              id="event-type"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a type...</option>
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label 
              htmlFor="event-description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Description
            </label>
            <textarea
              id="event-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What's this event about? What should attendees know?"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              aria-describedby="description-help"
              maxLength={2000}
            />
            <p id="description-help" className="text-sm text-gray-500 mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="all-day"
                name="all_day"
                type="checkbox"
                checked={formData.all_day}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="all-day" className="font-semibold text-gray-900">
                All-Day Event
              </label>
              <p className="text-sm text-gray-600">
                This event lasts the entire day (no specific start/end time)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="start-date"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Start Date *
              </label>
              <input
                id="start-date"
                name="start_date"
                type="date"
                required
                min={today}
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-required="true"
              />
            </div>

            {!formData.all_day && (
              <div>
                <label 
                  htmlFor="start-time"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Start Time *
                </label>
                <input
                  id="start-time"
                  name="start_time"
                  type="time"
                  required={!formData.all_day}
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-required={!formData.all_day}
                />
              </div>
            )}

            <div>
              <label 
                htmlFor="end-date"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                End Date (Optional)
              </label>
              <input
                id="end-date"
                name="end_date"
                type="date"
                min={formData.start_date || today}
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {!formData.all_day && (
              <div>
                <label 
                  htmlFor="end-time"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  End Time (Optional)
                </label>
                <input
                  id="end-time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="is-virtual"
                name="is_virtual"
                type="checkbox"
                checked={formData.is_virtual}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="is-virtual" className="font-semibold text-gray-900">
                Virtual Event
              </label>
              <p className="text-sm text-gray-600">
                This event will be held online (Zoom, Google Meet, etc.)
              </p>
            </div>
          </div>

          {formData.is_virtual ? (
            <div>
              <label 
                htmlFor="virtual-link"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Virtual Meeting Link
              </label>
              <input
                id="virtual-link"
                name="virtual_link"
                type="url"
                value={formData.virtual_link}
                onChange={handleChange}
                placeholder="https://zoom.us/j/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="virtual-link-help"
              />
              <p id="virtual-link-help" className="text-sm text-gray-500 mt-1">
                Zoom, Google Meet, or other video call link
              </p>
            </div>
          ) : (
            <>
              <div>
                <label 
                  htmlFor="location"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="123 Main St, Toledo, OH 43604"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="location-help"
                />
                <p id="location-help" className="text-sm text-gray-500 mt-1">
                  Street address or venue name
                </p>
              </div>

              <div>
                <label 
                  htmlFor="location-url"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Location Link (Optional)
                </label>
                <input
                  id="location-url"
                  name="location_url"
                  type="url"
                  value={formData.location_url}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="location-url-help"
                />
                <p id="location-url-help" className="text-sm text-gray-500 mt-1">
                  Google Maps link or directions URL
                </p>
              </div>
            </>
          )}

          <div>
            <label 
              htmlFor="max-attendees"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Maximum Attendees (Optional)
            </label>
            <input
              id="max-attendees"
              name="max_attendees"
              type="number"
              min="1"
              max="10000"
              value={formData.max_attendees}
              onChange={handleChange}
              placeholder="Leave empty for unlimited"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="max-attendees-help"
            />
            <p id="max-attendees-help" className="text-sm text-gray-500 mt-1">
              Set a capacity limit for your event
            </p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900">Event Settings</h3>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="is-public"
                  name="is_public"
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="is-public" className="font-semibold text-gray-900">
                  🌍 Public Event
                </label>
                <p className="text-sm text-gray-600">
                  Allow anyone to see this event (appears in event discovery)
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="requires-rsvp"
                  name="requires_rsvp"
                  type="checkbox"
                  checked={formData.requires_rsvp}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="requires-rsvp" className="font-semibold text-gray-900">
                  ✓ Require RSVP
                </label>
                <p className="text-sm text-gray-600">
                  Members must RSVP to attend this event
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.start_date}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label={loading ? 'Creating event...' : 'Create event'}
            >
              {loading ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                    role="status"
                    aria-label="Loading"
                  >
                    <span className="sr-only">Creating...</span>
                  </div>
                  Creating Event...
                </>
              ) : (
                <>
                  <span>📅</span>
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;