import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * EditEvent Component - COMPLETE VERSION WITH RECURRING EDITING
 * 
 * Full-featured event editor matching CreateEvent's capabilities.
 * Includes recurring event pattern editing when editing entire series.
 * Prevents duplicates by using UPDATE instead of INSERT.
 * 
 * ADA Compliant: Full keyboard navigation, ARIA labels, focus management
 */
function EditEvent({ isOpen, onClose, onSuccess, event, editScope = null, isRecurring = false }) {
  
  // Form state - initialize with event data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('in-person');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [virtualLink, setVirtualLink] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState('');
  const [visibility, setVisibility] = useState('members');
  const [isPublic, setIsPublic] = useState(false);
  const [requireRsvp, setRequireRsvp] = useState(false);
  
  // Recurring event state
  const [canEditRecurrence, setCanEditRecurrence] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with event data when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      
      // Determine event type
      if (event.is_virtual && event.location && event.location !== 'Virtual Event' && event.location !== 'Virtual') {
        setEventType('hybrid');
      } else if (event.is_virtual) {
        setEventType('virtual');
      } else {
        setEventType('in-person');
      }
      
      // Parse start_time
      if (event.start_time) {
        const startDateTime = new Date(event.start_time);
        setStartDate(startDateTime.toISOString().split('T')[0]);
        setStartTime(startDateTime.toTimeString().slice(0, 5));
      }
      
      // Parse end_time
      if (event.end_time) {
        const endDateTime = new Date(event.end_time);
        setEndTime(endDateTime.toTimeString().slice(0, 5));
        setEndDate(endDateTime.toISOString().split('T')[0]);
      } else {
        setEndDate(startDate);
      }
      
      setLocation(event.location && event.location !== 'Virtual Event' ? event.location : '');
      setLocationLink(event.location_link || '');
      setCity(event.city || '');
      setState(event.state || '');
      setZipCode(event.zip_code || '');
      setVirtualLink(event.virtual_link || '');
      setIsVirtual(event.is_virtual || false);
      setMaxAttendees(event.max_attendees || '');
      setVisibility(event.visibility || 'members');
      setIsPublic(event.visibility === 'public');
      setRequireRsvp(event.require_rsvp !== false);
      
      // Initialize recurring event data
      if (event.recurrence_rule) {
        setDayOfWeek(event.recurrence_rule.dayOfWeek || 1);
        setWeekOfMonth(event.recurrence_rule.weekOfMonth || 1);
      }
      if (event.recurrence_end_date) {
        setRecurrenceEndDate(new Date(event.recurrence_end_date).toISOString().split('T')[0]);
      }
      // Can only edit recurrence pattern if editing "all events in series"
      setCanEditRecurrence(isRecurring && editScope === 'all');
    }
  }, [isOpen, event, editScope, isRecurring]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
    }
  }, [isOpen]);

  // Form validation
  const validateForm = () => {
    if (!title.trim()) {
      setError('Event title is required');
      return false;
    }

    if (!startDate && (!isRecurring || editScope === 'this')) {
      setError('Start date is required');
      return false;
    }

    if (!startTime) {
      setError('Start time is required');
      return false;
    }

    if (endTime && startTime && (!isRecurring || editScope === 'this')) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate || startDate}T${endTime}`);
      if (end <= start) {
        setError('End time must be after start time');
        return false;
      }
    }

    if ((eventType === 'virtual' || eventType === 'hybrid') && !virtualLink.trim()) {
      setError('Virtual link is required for virtual and hybrid events');
      return false;
    }

    if ((eventType === 'in-person' || eventType === 'hybrid') && !location.trim()) {
      setError('Location is required for in-person and hybrid events');
      return false;
    }

    if (maxAttendees && parseInt(maxAttendees) < 1) {
      setError('Max attendees must be at least 1');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into timestamps
      let startTimestamp, endTimestamp;
      
      if (editScope === 'all' && isRecurring) {
        // For "all events" editing, we only update the time, not the date
        // Use the existing event's date
        const existingStart = new Date(event.start_time);
        const [hours, minutes] = startTime.split(':');
        existingStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        startTimestamp = existingStart.toISOString();
        
        if (endTime) {
          const existingEnd = event.end_time ? new Date(event.end_time) : new Date(event.start_time);
          const [endHours, endMinutes] = endTime.split(':');
          existingEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
          endTimestamp = existingEnd.toISOString();
        } else {
          endTimestamp = null;
        }
      } else {
        // For single instance or non-recurring, use the selected date
        startTimestamp = startTime 
          ? new Date(`${startDate}T${startTime}:00`).toISOString()
          : new Date(`${startDate}T00:00:00`).toISOString();
        
        endTimestamp = endTime
          ? new Date(`${endDate || startDate}T${endTime}:00`).toISOString()
          : null;
      }

      // Determine location based on event type
      let finalLocation = '';
      if (eventType === 'virtual') {
        finalLocation = 'Virtual Event';
      } else {
        finalLocation = location;
      }

      // Prepare update data
      const updateData = {
        title,
        description,
        start_time: startTimestamp,
        end_time: endTimestamp,
        location: finalLocation,
        location_link: locationLink || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        virtual_link: (eventType === 'virtual' || eventType === 'hybrid') ? virtualLink : null,
        is_virtual: eventType === 'virtual' || eventType === 'hybrid',
        max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        visibility: isPublic ? 'public' : visibility,
        require_rsvp: requireRsvp,
        updated_at: new Date().toISOString()
      };

      // Add recurring event updates if editing entire series
      if (canEditRecurrence) {
updateData.recurrence_rule = {
  type: 'monthly',
  dayOfWeek: dayOfWeek,
  weekOfMonth: weekOfMonth,
  time: startTime.includes(':') && startTime.split(':').length === 2 
    ? startTime + ':00' 
    : startTime
};
        updateData.recurrence_end_date = recurrenceEndDate 
          ? new Date(recurrenceEndDate).toISOString() 
          : null;
      }

      let result;

      // Handle different edit scopes for recurring events
      if (isRecurring && editScope) {
        const apiData = {
          p_new_title: title,
          p_new_description: description,
          p_new_start_time: startTimestamp,
          p_new_end_time: endTimestamp,
          p_new_location: finalLocation,
          p_new_virtual_link: (eventType === 'virtual' || eventType === 'hybrid') ? virtualLink : null,
          p_new_is_virtual: eventType === 'virtual' || eventType === 'hybrid',
          p_new_max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
          p_new_visibility: isPublic ? 'public' : visibility
        };

        if (editScope === 'this') {
          // Edit only this instance - detach from series
          result = await supabase.rpc('edit_recurring_event_instance', {
            p_event_id: event.id,
            ...apiData
          });
} else if (editScope === 'all') {
  // Edit entire series - need parent event ID
  const parentId = event.parent_event_id || event.id;
  
  // CRITICAL: Delete ALL instances first (not the parent yet)
  const { error: deleteInstancesError } = await supabase
    .from('events')
    .delete()
    .eq('parent_event_id', parentId);

  if (deleteInstancesError) throw deleteInstancesError;

  // Now update the parent event with new pattern
  const { error: parentUpdateError } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', parentId);

  if (parentUpdateError) throw parentUpdateError;

          // Regenerate instances with new pattern
          const { error: regenerateError } = await supabase.rpc('generate_recurring_instances', {
            p_parent_event_id: parentId,
            p_months_ahead: 6
          });

          if (regenerateError) throw regenerateError;

          result = { data: { success: true, message: 'Series updated and regenerated' } };
        }

        if (result.error) throw result.error;

        // Check the result from the function
        if (result.data && !result.data.success) {
          throw new Error(result.data.error || 'Failed to update recurring event');
        }

        console.log('✅ Recurring event updated:', result.data);
        onSuccess(result.data);
      } else {
        // Regular event - direct update (PREVENTS DUPLICATES)
        const { data, error: updateError } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', event.id)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log('✅ Event updated:', data);
        onSuccess(data);
      }

      alert('Event updated successfully!' + (canEditRecurrence ? ' Recurring instances have been regenerated.' : ''));
      onClose();

    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message || 'Failed to update event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get scope description for recurring events
  const getScopeDescription = () => {
    if (!isRecurring || !editScope) return '';
    
    const descriptions = {
      'this': 'Editing only this event (will detach from series)',
      'all': 'Editing all events in the series'
    };
    
    return descriptions[editScope] || '';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-event-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="edit-event-title" className="text-2xl font-bold text-gray-900">
            📝 Edit Event
          </h2>
          {isRecurring && editScope && (
            <p className="text-sm text-blue-600 mt-1">
              {getScopeDescription()}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div 
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Community Cleanup Day"
              required
              maxLength={200}
              aria-required="true"
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Describe your event..."
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Event Type */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Type *
            </label>
            <div className="space-y-2">
              <label 
                className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: eventType === 'in-person' ? '#3b82f6' : '#d1d5db' }}
              >
                <input
                  type="radio"
                  value="in-person"
                  checked={eventType === 'in-person'}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">📍 In-Person Event</p>
                  <p className="text-sm text-gray-600">Physical location only</p>
                </div>
              </label>

              <label 
                className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: eventType === 'virtual' ? '#3b82f6' : '#d1d5db' }}
              >
                <input
                  type="radio"
                  value="virtual"
                  checked={eventType === 'virtual'}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">💻 Virtual Event</p>
                  <p className="text-sm text-gray-600">Online only (Zoom, Google Meet, etc.)</p>
                </div>
              </label>

              <label 
                className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: eventType === 'hybrid' ? '#3b82f6' : '#d1d5db' }}
              >
                <input
                  type="radio"
                  value="hybrid"
                  checked={eventType === 'hybrid'}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">🌐 Hybrid Event</p>
                  <p className="text-sm text-gray-600">Both in-person and virtual options</p>
                </div>
              </label>
            </div>
          </div>

          {/* Date and Time */}
          {(!isRecurring || editScope === 'this') ? (
            // Show full date/time editing for non-recurring or single instance
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label htmlFor="edit-start-date" className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="edit-start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-required="true"
                />
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="edit-end-date" className="block text-sm font-semibold text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="edit-end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="edit-start-time" className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  id="edit-start-time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-required="true"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="edit-end-time" className="block text-sm font-semibold text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="edit-end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            // For "All events in series" - only show time (not date)
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>📌 Note:</strong> You're editing the entire series. Use the "Recurring Event Pattern" section below to change which day events occur. Here you can only change the time.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <label htmlFor="edit-start-time" className="block text-sm font-semibold text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    id="edit-start-time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-required="true"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label htmlFor="edit-end-time" className="block text-sm font-semibold text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="edit-end-time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Virtual Link */}
          {(eventType === 'virtual' || eventType === 'hybrid') && (
            <div className="mb-4">
              <label htmlFor="edit-virtual-link" className="block text-sm font-semibold text-gray-700 mb-1">
                Virtual Meeting Link *
              </label>
              <input
                type="url"
                id="edit-virtual-link"
                value={virtualLink}
                onChange={(e) => setVirtualLink(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://zoom.us/j/123456789"
                required={eventType === 'virtual' || eventType === 'hybrid'}
                aria-required={eventType === 'virtual' || eventType === 'hybrid'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Zoom, Google Meet, Microsoft Teams, etc.
              </p>
            </div>
          )}

          {/* Location */}
          {(eventType === 'in-person' || eventType === 'hybrid') && (
            <>
              <div className="mb-4">
                <label htmlFor="edit-location" className="block text-sm font-semibold text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St, City, State ZIP"
                  required={eventType === 'in-person' || eventType === 'hybrid'}
                  aria-required={eventType === 'in-person' || eventType === 'hybrid'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Full address including city, state, and ZIP
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="edit-location-link" className="block text-sm font-semibold text-gray-700 mb-1">
                  Location Link (Optional)
                </label>
                <input
                  type="url"
                  id="edit-location-link"
                  value={locationLink}
                  onChange={(e) => setLocationLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Google Maps or directions URL
                </p>
              </div>
            </>
          )}

          {/* Max Attendees */}
          <div className="mb-4">
            <label htmlFor="edit-max-attendees" className="block text-sm font-semibold text-gray-700 mb-1">
              Maximum Attendees (Optional)
            </label>
            <input
              type="number"
              id="edit-max-attendees"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave blank for unlimited"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional - leave blank for no limit
            </p>
          </div>

          {/* Recurring Event Pattern - Only show when editing all events in series */}
          {canEditRecurrence && (
            <div className="mb-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  🔄 Recurring Event Pattern
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Change when events occur (e.g., move from Tuesday to Wednesday).
                </p>

                <div className="space-y-4 pl-2 border-l-4 border-blue-400">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Repeat Pattern
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Week of Month */}
                      <div>
                        <label htmlFor="edit-weekOfMonth" className="block text-xs text-gray-600 mb-1">
                          Which week?
                        </label>
                        <select
                          id="edit-weekOfMonth"
                          value={weekOfMonth}
                          onChange={(e) => setWeekOfMonth(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="Select which week of the month"
                        >
                          <option value="1">First week</option>
                          <option value="2">Second week</option>
                          <option value="3">Third week</option>
                          <option value="4">Fourth week</option>
                          <option value="-1">Last week</option>
                        </select>
                      </div>

                      {/* Day of Week */}
                      <div>
                        <label htmlFor="edit-dayOfWeek" className="block text-xs text-gray-600 mb-1">
                          Which day?
                        </label>
                        <select
                          id="edit-dayOfWeek"
                          value={dayOfWeek}
                          onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="Select day of the week"
                        >
                          <option value="0">Sunday</option>
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                        </select>
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="mt-3 text-sm text-blue-700 bg-blue-100 p-3 rounded-lg border border-blue-300">
                      <strong>📅 Preview:</strong> Events will repeat on the{' '}
                      <span className="font-bold">
                        {weekOfMonth === -1 ? 'Last' : 
                         weekOfMonth === 1 ? 'First' :
                         weekOfMonth === 2 ? 'Second' :
                         weekOfMonth === 3 ? 'Third' : 'Fourth'}
                      </span>{' '}
                      <span className="font-bold">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}
                      </span>{' '}
                      of every month at{' '}
                      <span className="font-bold">
                        {startTime || '(time not set)'}
                      </span>
                    </div>
                  </div>

                  {/* Optional End Date */}
                  <div>
                    <label htmlFor="edit-recurrenceEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="edit-recurrenceEndDate"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Select when this recurring event should stop"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      💡 Leave blank to continue indefinitely. All instances will be regenerated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Settings */}
          <div className="mb-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Event Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="edit-public"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="edit-public" className="font-semibold text-gray-900 text-sm">
                    🌍 Public Event
                  </label>
                  <p className="text-xs text-gray-600">
                    Allow anyone to see this event (appears in event discovery)
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="edit-require-rsvp"
                    type="checkbox"
                    checked={requireRsvp}
                    onChange={(e) => setRequireRsvp(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="edit-require-rsvp" className="font-semibold text-gray-900 text-sm">
                    ✓ Require RSVP
                  </label>
                  <p className="text-xs text-gray-600">
                    Members must RSVP to attend this event
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEvent;