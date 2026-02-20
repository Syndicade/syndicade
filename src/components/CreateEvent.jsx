import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { notifyOrganizationMembers } from '../lib/notificationService';
import toast from 'react-hot-toast';

function CreateEvent({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'in-person',
    isMultiDay: false,
    schedule: [
      { date: '', startTime: '', endTime: '' }
    ],
    locationName: '',
    fullAddress: '',
    city: '',
    state: '',
    zipCode: '',
    virtualLink: '',
    locationLink: '',
    maxAttendees: '',
    visibility: 'members',
    requireRSVP: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Group selector state
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Recurring event state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('monthly');
  
  // Monthly state
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  
  // Weekly state
  const [weeklyDays, setWeeklyDays] = useState([1]);
  
  // Daily state
  const [dailyInterval, setDailyInterval] = useState(1);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Timezone selector state
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const stateMap = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY'
  };

  const formatTimezone = (tz) => {
    const tzMap = {
      'America/New_York': 'Eastern Time (EST/EDT)',
      'America/Chicago': 'Central Time (CST/CDT)',
      'America/Denver': 'Mountain Time (MST/MDT)',
      'America/Phoenix': 'Mountain Time (MST - no DST)',
      'America/Los_Angeles': 'Pacific Time (PST/PDT)',
      'America/Anchorage': 'Alaska Time (AKST/AKDT)',
      'Pacific/Honolulu': 'Hawaii Time (HST)',
      'America/Toronto': 'Eastern Time (EST/EDT)',
      'Europe/London': 'London (GMT/BST)',
      'Europe/Paris': 'Central Europe (CET/CEST)',
      'Asia/Tokyo': 'Japan (JST)',
      'Asia/Kolkata': 'India (IST)',
      'Australia/Sydney': 'Australia East (AEST/AEDT)'
    };
    return tzMap[tz] || tz;
  };

  // Fetch groups when visibility changes to 'groups'
  useEffect(() => {
    if (formData.visibility === 'groups' && organizationId) {
      fetchGroups();
    }
  }, [formData.visibility, organizationId]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('groups')
        .select('id, name, description')
        .eq('organization_id', organizationId)
        .order('name');

      if (fetchError) throw fetchError;
      setAvailableGroups(data || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
      toast.error('Could not load groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsRecurring(false);
      setRecurrenceType('monthly');
      setDayOfWeek(1);
      setWeekOfMonth(1);
      setWeeklyDays([1]);
      setDailyInterval(1);
      setWeekdaysOnly(false);
      setRecurrenceEndDate('');
      setShowTimezoneSelector(false);
      setSelectedTimezone(null);
      setSelectedGroupIds([]);
      setAvailableGroups([]);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index][field] = value;
    setFormData(prev => ({ ...prev, schedule: newSchedule }));
  };

  const addDay = () => {
    if (formData.schedule.length < 5) {
      setFormData(prev => ({
        ...prev,
        schedule: [...prev.schedule, { date: '', startTime: '', endTime: '' }]
      }));
    }
  };

  const removeDay = (index) => {
    if (formData.schedule.length > 1) {
      const newSchedule = formData.schedule.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, schedule: newSchedule }));
    }
  };

  const toggleWeeklyDay = (day) => {
    setWeeklyDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort((a, b) => a - b);
      }
    });
  };

  const extractStateAbbreviation = (stateName) => {
    if (!stateName) return '';
    const normalized = stateName.toLowerCase().trim();
    if (stateMap[normalized]) return stateMap[normalized];
    if (stateName.length === 2) return stateName.toUpperCase();
    return stateName.substring(0, 2).toUpperCase();
  };

  const formatAddressDisplay = (address) => {
    const houseNumber = address.house_number || '';
    const road = address.road || '';
    const city = address.city || address.town || address.village || '';
    const state = address.state || '';
    const postcode = address.postcode || '';
    const streetAddress = (houseNumber + ' ' + road).trim();
    const parts = [];
    if (streetAddress) parts.push(streetAddress);
    if (city) parts.push(city);
    if (state) parts.push(extractStateAbbreviation(state));
    if (postcode) parts.push(postcode);
    return parts.join(', ');
  };

  const searchAddresses = async (query) => {
    try {
      setSearchingAddress(true);
      const searchUrl = 'https://nominatim.openstreetmap.org/search?' +
        'format=json&' +
        'q=' + encodeURIComponent(query) + ',USA&' +
        'limit=8&' +
        'addressdetails=1';
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return;
      const data = await response.json();
      const formattedSuggestions = data
        .filter(item => {
          const addr = item.address || {};
          return (addr.road || addr.house_number) && (addr.city || addr.town || addr.village);
        })
        .map(item => ({ ...item, formatted: formatAddressDisplay(item.address) }));
      setAddressSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleAddressInputChange = (e) => {
    const value = e.target.value;
    setAddressInput(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (value.length >= 3) {
      const newTimeout = setTimeout(() => { searchAddresses(value); }, 500);
      setSearchTimeout(newTimeout);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectAddress = (suggestion) => {
    const addr = suggestion.address;
    const city = addr.city || addr.town || addr.village || '';
    const state = extractStateAbbreviation(addr.state || '');
    const zip = addr.postcode || '';
    setFormData(prev => ({
      ...prev,
      locationName: suggestion.formatted,
      fullAddress: suggestion.formatted,
      city: city,
      state: state,
      zipCode: zip
    }));
    setAddressInput('');
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const geocodeAddress = async (address) => {
    try {
      setGeocoding(true);
      const response = await fetch(
        'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address) + ',USA&limit=1&addressdetails=1',
        { headers: { 'Accept': 'application/json' } }
      );
      if (!response.ok) throw new Error('Geocoding service unavailable');
      const data = await response.json();
      if (data && data.length > 0) {
        return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.title.trim().length < 3) throw new Error('Event title must be at least 3 characters');
      if (formData.schedule[0].date === '' || formData.schedule[0].startTime === '') throw new Error('Please provide date and start time');
      if (formData.eventType === 'virtual' && !formData.virtualLink.trim()) throw new Error('Virtual events require a meeting link');
      if ((formData.eventType === 'in-person' || formData.eventType === 'hybrid') && !formData.locationName.trim()) throw new Error('Please provide a location');
      if (formData.eventType === 'hybrid' && !formData.virtualLink.trim()) throw new Error('Hybrid events require a virtual meeting link');

      // Validate group selection
      if (formData.visibility === 'groups' && selectedGroupIds.length === 0) {
        throw new Error('Please select at least one group for group-restricted events');
      }

      if (isRecurring) {
        if (recurrenceType === 'weekly' && weeklyDays.length === 0) throw new Error('Please select at least one day for weekly recurring events');
        if (recurrenceType === 'daily' && dailyInterval < 1) throw new Error('Daily interval must be at least 1');
      }

      const firstDay = formData.schedule[0];
      const [year, month, day] = firstDay.date.split('-');
      const [hours, minutes] = firstDay.startTime.split(':');
      const startDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);

      let endDateTime = null;
      if (formData.isMultiDay && formData.schedule.length > 1) {
        const lastDay = formData.schedule[formData.schedule.length - 1];
        if (lastDay.date && lastDay.endTime) {
          const [endYear, endMonth, endDay] = lastDay.date.split('-');
          const [endHours, endMinutes] = lastDay.endTime.split(':');
          endDateTime = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay), parseInt(endHours), parseInt(endMinutes), 0);
        }
      } else if (firstDay.endTime) {
        const [endHours, endMinutes] = firstDay.endTime.split(':');
        endDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHours), parseInt(endMinutes), 0);
      }

      if (formData.maxAttendees && parseInt(formData.maxAttendees) < 1) throw new Error('Maximum attendees must be at least 1');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to create events');

      let latitude = null;
      let longitude = null;
      if ((formData.eventType === 'in-person' || formData.eventType === 'hybrid') && formData.locationName) {
        const coords = await geocodeAddress(formData.locationName);
        if (coords) { latitude = coords.latitude; longitude = coords.longitude; }
      }

      const formatForPostgres = (date) => {
        const yr = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, '0');
        const dy = String(date.getDate()).padStart(2, '0');
        const hr = String(date.getHours()).padStart(2, '0');
        const mn = String(date.getMinutes()).padStart(2, '0');
        const sc = String(date.getSeconds()).padStart(2, '0');
        const offset = -date.getTimezoneOffset();
        const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
        const offsetSign = offset >= 0 ? '+' : '-';
        return yr + '-' + mo + '-' + dy + ' ' + hr + ':' + mn + ':' + sc + offsetSign + offsetHours + ':' + offsetMinutes;
      };

      const eventData = {
        organization_id: organizationId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_time: formatForPostgres(startDateTime),
        end_time: endDateTime ? formatForPostgres(endDateTime) : null,
        location: formData.eventType === 'virtual' ? 'Virtual Event' : formData.locationName.trim(),
        full_address: (formData.eventType === 'in-person' || formData.eventType === 'hybrid') ? formData.locationName.trim() : null,
        city: formData.city.trim() || null,
        state: formData.state || null,
        zip_code: formData.zipCode.trim() || null,
        latitude: latitude,
        longitude: longitude,
        is_virtual: formData.eventType === 'virtual' || formData.eventType === 'hybrid',
        virtual_link: (formData.eventType === 'virtual' || formData.eventType === 'hybrid') ? formData.virtualLink.trim() : null,
        location_link: formData.locationLink.trim() || null,
        max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        visibility: formData.visibility,
        require_rsvp: formData.requireRSVP,
        created_by: user.id,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? (
          recurrenceType === 'monthly' ? { type: 'monthly', dayOfWeek: dayOfWeek, weekOfMonth: weekOfMonth, time: formData.schedule[0].startTime + ':00' } :
          recurrenceType === 'weekly' ? { type: 'weekly', daysOfWeek: weeklyDays, time: formData.schedule[0].startTime + ':00' } :
          recurrenceType === 'daily' ? { type: 'daily', interval: dailyInterval, weekdaysOnly: weekdaysOnly, time: formData.schedule[0].startTime + ':00' } : null
        ) : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
        parent_event_id: null,
        event_timezone: showTimezoneSelector ? selectedTimezone : null
      };

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) throw eventError;

      // Save group restrictions if visibility is 'groups'
      if (formData.visibility === 'groups' && selectedGroupIds.length > 0) {
        const groupRows = selectedGroupIds.map(groupId => ({
          event_id: newEvent.id,
          group_id: groupId
        }));
        const { error: groupError } = await supabase
          .from('event_groups')
          .insert(groupRows);
        if (groupError) {
          console.error('Warning: event created but group restrictions failed:', groupError);
          toast.error('Event created but group restrictions could not be saved. Please edit the event.');
        }
      }

      const recurringMsg = isRecurring ? ' Recurring instances have been generated for the next 6 months!' : '';
      toast.success('Event "' + newEvent.title + '" created successfully!' + recurringMsg);

      if (onSuccess) onSuccess(newEvent);

      // Send notifications
      try {
        const eventTypeIcon = formData.eventType === 'in_person' ? '📍' : formData.eventType === 'virtual' ? '💻' : '🔀';
        const notificationResult = await notifyOrganizationMembers({
          organizationId: organizationId,
          type: 'event',
          title: eventTypeIcon + ' New Event',
          message: formData.title + ' - ' + new Date(formData.schedule[0].date).toLocaleDateString(),
          link: '/organizations/' + organizationId + '/events',
          excludeUserId: null
        });
        if (notificationResult.error) {
          console.error('Notification error:', notificationResult.error);
        } else {
          window.dispatchEvent(new CustomEvent('notificationCreated'));
        }
      } catch (notifError) {
        console.error('Failed to send event notifications (event still created):', notifError);
      }

      setFormData({
        title: '', description: '', eventType: 'in-person', isMultiDay: false,
        schedule: [{ date: '', startTime: '', endTime: '' }],
        locationName: '', fullAddress: '', city: '', state: '', zipCode: '',
        virtualLink: '', locationLink: '', maxAttendees: '', visibility: 'members', requireRSVP: false
      });
      setAddressInput('');
      setSelectedGroupIds([]);
      onClose();

    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event: ' + err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 id="create-event-title" className="text-2xl font-bold text-gray-900">
            📅 Create New Event
          </h2>
          <p className="text-gray-600 mt-1">Create an event for {organizationName}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="event-title" className="block text-sm font-semibold text-gray-900 mb-2">
              Event Title *
            </label>
            <input
              id="event-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Community Cleanup Day"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">{formData.title.length}/200 characters</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="event-description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="event-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this event is about..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="text-sm text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Event Type *</label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: formData.eventType === 'in-person' ? '#3b82f6' : '#d1d5db' }}>
                <input type="radio" name="eventType" value="in-person"
                  checked={formData.eventType === 'in-person'} onChange={handleChange}
                  className="w-4 h-4 text-blue-600" />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">📍 In-Person Event</p>
                  <p className="text-sm text-gray-600">Physical location only</p>
                </div>
              </label>
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: formData.eventType === 'virtual' ? '#3b82f6' : '#d1d5db' }}>
                <input type="radio" name="eventType" value="virtual"
                  checked={formData.eventType === 'virtual'} onChange={handleChange}
                  className="w-4 h-4 text-blue-600" />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">💻 Virtual Event</p>
                  <p className="text-sm text-gray-600">Online only (Zoom, Google Meet, etc.)</p>
                </div>
              </label>
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: formData.eventType === 'hybrid' ? '#3b82f6' : '#d1d5db' }}>
                <input type="radio" name="eventType" value="hybrid"
                  checked={formData.eventType === 'hybrid'} onChange={handleChange}
                  className="w-4 h-4 text-blue-600" />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">🌐 Hybrid Event</p>
                  <p className="text-sm text-gray-600">Both in-person and virtual options</p>
                </div>
              </label>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Schedule *</label>
            <div className="space-y-4">
              {formData.schedule.map((day, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-900">
                      {formData.isMultiDay ? 'Day ' + (index + 1) : 'Event Date & Time'}
                    </p>
                    {formData.isMultiDay && formData.schedule.length > 1 && (
                      <button type="button" onClick={() => removeDay(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-semibold">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={'date-' + index} className="block text-xs text-gray-600 mb-1">Date</label>
                      <input id={'date-' + index} type="date" required value={day.date}
                        onChange={(e) => handleScheduleChange(index, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor={'start-' + index} className="block text-xs text-gray-600 mb-1">Start Time</label>
                      <input id={'start-' + index} type="time" required value={day.startTime}
                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor={'end-' + index} className="block text-xs text-gray-600 mb-1">End Time</label>
                      <input id={'end-' + index} type="time" value={day.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="multi-day" name="isMultiDay" type="checkbox"
                      checked={formData.isMultiDay} onChange={handleChange}
                      className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500" />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="multi-day" className="font-semibold text-gray-900">Multiple Day Event</label>
                    <p className="text-sm text-gray-600">Event spans across multiple days</p>
                  </div>
                </div>
                {formData.isMultiDay && formData.schedule.length < 5 && (
                  <button type="button" onClick={addDay}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    + Add Day
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Virtual Link */}
          {(formData.eventType === 'virtual' || formData.eventType === 'hybrid') && (
            <div>
              <label htmlFor="virtual-link" className="block text-sm font-semibold text-gray-900 mb-2">
                Meeting Link *
              </label>
              <input id="virtual-link" name="virtualLink" type="url" required
                value={formData.virtualLink} onChange={handleChange}
                placeholder="https://zoom.us/j/123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <p className="text-sm text-gray-500 mt-1">Zoom, Google Meet, Microsoft Teams, etc.</p>
            </div>
          )}

          {/* Physical Location */}
          {(formData.eventType === 'in-person' || formData.eventType === 'hybrid') && (
            <>
              <div>
                <label htmlFor="location-name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Location *
                </label>
                <input id="location-name" name="locationName" type="text" required
                  value={formData.locationName} onChange={handleChange}
                  placeholder="123 Main St, Toledo, OH 43604"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="text-sm text-gray-500 mt-1">Full address including city, state, and ZIP</p>
              </div>

              <div className="relative">
                <label htmlFor="address-search" className="block text-sm font-semibold text-gray-900 mb-2">
                  Address Search Helper
                </label>
                <div className="relative">
                  <input id="address-search" type="text" value={addressInput}
                    onChange={handleAddressInputChange}
                    placeholder="Type to search for address..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="off" />
                  {searchingAddress && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button key={index} type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectAddress(suggestion); }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">📍</span>
                          <p className="text-sm font-medium text-gray-900">{suggestion.formatted}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {searchingAddress ? 'Searching...' :
                    addressSuggestions.length > 0 ? addressSuggestions.length + ' results found' :
                    'Type at least 3 characters to search'}
                </p>
              </div>

              {(formData.city || formData.state || formData.zipCode) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">Auto-detected:</p>
                      {formData.city && <p>City: {formData.city}</p>}
                      {formData.state && <p>State: {formData.state}</p>}
                      {formData.zipCode && <p>ZIP: {formData.zipCode}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="location-link" className="block text-sm font-semibold text-gray-900 mb-2">
                  Location Link (Optional)
                </label>
                <input id="location-link" name="locationLink" type="url"
                  value={formData.locationLink} onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="text-sm text-gray-500 mt-1">Google Maps or directions URL</p>
              </div>
            </>
          )}

          {/* Max Attendees */}
          <div>
            <label htmlFor="max-attendees" className="block text-sm font-semibold text-gray-900 mb-2">
              Maximum Attendees (Optional)
            </label>
            <input id="max-attendees" name="maxAttendees" type="number" min="1"
              value={formData.maxAttendees} onChange={handleChange}
              placeholder="Leave empty for unlimited"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* Recurring Event Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <input type="checkbox" id="isRecurring" checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                aria-describedby="recurring-description" />
              <label htmlFor="isRecurring" className="text-base font-semibold text-gray-900 cursor-pointer">
                🔄 Make this a recurring event
              </label>
            </div>
            <p id="recurring-description" className="text-sm text-gray-600 mb-4">
              Automatically create this event on a regular schedule
            </p>

            {isRecurring && (
              <div className="space-y-4 pl-2 border-l-4 border-blue-400">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['daily', 'weekly', 'monthly'].map(type => (
                      <button key={type} type="button" onClick={() => setRecurrenceType(type)}
                        className={'px-4 py-2 rounded-lg font-medium text-sm transition-all ' +
                          (recurrenceType === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                        {type === 'daily' ? '📆 Daily' : type === 'weekly' ? '📅 Weekly' : '🗓️ Monthly'}
                      </button>
                    ))}
                  </div>
                </div>

                {recurrenceType === 'daily' && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="dailyInterval" className="block text-sm font-medium text-gray-700 mb-2">Repeat every</label>
                      <div className="flex items-center gap-2">
                        <input type="number" id="dailyInterval" min="1" max="30" value={dailyInterval}
                          onChange={(e) => setDailyInterval(parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">day(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="weekdaysOnly" checked={weekdaysOnly}
                        onChange={(e) => setWeekdaysOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="weekdaysOnly" className="text-sm text-gray-700">Weekdays only (Monday - Friday)</label>
                    </div>
                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                      <strong>📅 Preview:</strong> Repeats every {dailyInterval} day{dailyInterval > 1 ? 's' : ''}
                      {weekdaysOnly && ' (weekdays only)'} at <strong>{formData.schedule[0].startTime || '(time not set)'}</strong>
                    </div>
                  </div>
                )}

                {recurrenceType === 'weekly' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Select days of the week</label>
                    <div className="grid grid-cols-7 gap-2">
                      {dayNames.map((day, index) => (
                        <button key={index} type="button" onClick={() => toggleWeeklyDay(index)}
                          className={'px-2 py-2 rounded-lg font-medium text-sm transition-all ' +
                            (weeklyDays.includes(index) ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50')}>
                          {day}
                        </button>
                      ))}
                    </div>
                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                      <strong>📅 Preview:</strong> Repeats every {weeklyDays.map(d => fullDayNames[d]).join(', ')} at{' '}
                      <strong>{formData.schedule[0].startTime || '(time not set)'}</strong>
                    </div>
                  </div>
                )}

                {recurrenceType === 'monthly' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="weekOfMonth" className="block text-xs text-gray-600 mb-1">Which week?</label>
                        <select id="weekOfMonth" value={weekOfMonth}
                          onChange={(e) => setWeekOfMonth(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option value="1">First week</option>
                          <option value="2">Second week</option>
                          <option value="3">Third week</option>
                          <option value="4">Fourth week</option>
                          <option value="-1">Last week</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="dayOfWeek" className="block text-xs text-gray-600 mb-1">Which day?</label>
                        <select id="dayOfWeek" value={dayOfWeek}
                          onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          {fullDayNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                      <strong>📅 Preview:</strong> Repeats on the{' '}
                      {weekOfMonth === -1 ? 'Last' : weekOfMonth === 1 ? 'First' : weekOfMonth === 2 ? 'Second' : weekOfMonth === 3 ? 'Third' : 'Fourth'}{' '}
                      {fullDayNames[dayOfWeek]} of every month at{' '}
                      <strong>{formData.schedule[0].startTime || '(time not set)'}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                  <input type="date" id="recurrenceEndDate" value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={formData.schedule[0].date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to continue indefinitely. Instances are generated 6 months in advance.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Timezone Selector */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">🌍 Event Timezone</span>
                <span className="text-xs text-gray-500">(Optional)</span>
              </div>
              <button type="button" onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {showTimezoneSelector ? 'Use Auto-Detect' : 'Specify Different Timezone'}
              </button>
            </div>
            {!showTimezoneSelector ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Auto-detected: <strong>{formatTimezone(userTimezone)}</strong></span>
              </div>
            ) : (
              <div>
                <label htmlFor="eventTimezone" className="block text-sm font-medium text-gray-700 mb-2">Select Event Timezone</label>
                <select id="eventTimezone" value={selectedTimezone || userTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <optgroup label="🇺🇸 United States">
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Phoenix">Mountain Time - Arizona (No DST)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                  </optgroup>
                  <optgroup label="🇨🇦 Canada">
                    <option value="America/Toronto">Eastern Time - Toronto</option>
                    <option value="America/Winnipeg">Central Time - Winnipeg</option>
                    <option value="America/Edmonton">Mountain Time - Edmonton</option>
                    <option value="America/Vancouver">Pacific Time - Vancouver</option>
                  </optgroup>
                  <optgroup label="🌍 International">
                    <option value="Europe/London">United Kingdom (GMT/BST)</option>
                    <option value="Europe/Paris">Central Europe (CET/CEST)</option>
                    <option value="Asia/Tokyo">Japan (JST)</option>
                    <option value="Asia/Shanghai">China (CST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Australia/Sydney">Australia East (AEST/AEDT)</option>
                  </optgroup>
                </select>
                {selectedTimezone && selectedTimezone !== userTimezone && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Different Timezone Selected</p>
                      <p className="text-yellow-700 mt-1">
                        You're in <strong>{formatTimezone(userTimezone)}</strong> but creating event in{' '}
                        <strong>{formatTimezone(selectedTimezone)}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Event Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Event Settings</h3>
            <div className="space-y-4">

              {/* Visibility Selector */}
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-900 mb-3">
                  👁️ Who can see this event?
                </legend>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: '🌍 Public', desc: 'Anyone can see this event (appears in event discovery)' },
                    { value: 'members', label: '👥 All Members', desc: 'All active members of this organization' },
                    { value: 'groups', label: '🔒 Specific Groups Only', desc: 'Only members of the groups you select below' },
                    { value: 'draft', label: '📝 Draft', desc: 'Only visible to you and other admins' }
                  ].map(option => (
                    <label key={option.value}
                      className={'flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ' +
                        (formData.visibility === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200')}>
                      <input type="radio" name="visibility" value={option.value}
                        checked={formData.visibility === option.value}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900 text-sm">{option.label}</p>
                        <p className="text-xs text-gray-600">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Group Selector — shown only when visibility = groups */}
              {formData.visibility === 'groups' && (
                <div
                  className="bg-purple-50 border border-purple-200 rounded-lg p-4"
                  role="group"
                  aria-labelledby="group-selector-label"
                >
                  <p id="group-selector-label" className="text-sm font-semibold text-purple-900 mb-3">
                    🔒 Select which groups can see this event *
                  </p>

                  {loadingGroups ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Loading groups...
                    </div>
                  ) : availableGroups.length === 0 ? (
                    <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-3">
                      <p className="font-semibold text-gray-800 mb-1">No groups found</p>
                      <p>This organization has no groups yet. Create groups first in the Groups tab, then come back to restrict event visibility.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableGroups.map(group => (
                        <label key={group.id}
                          className={'flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ' +
                            (selectedGroupIds.includes(group.id)
                              ? 'border-purple-500 bg-white'
                              : 'border-gray-200 bg-white hover:border-purple-300')}>
                          <input
                            type="checkbox"
                            checked={selectedGroupIds.includes(group.id)}
                            onChange={() => toggleGroupSelection(group.id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
                            aria-label={'Select group ' + group.name}
                          />
                          <div className="ml-3">
                            <p className="font-semibold text-gray-900 text-sm">{group.name}</p>
                            {group.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {selectedGroupIds.length > 0 && (
                    <p className="mt-3 text-xs text-purple-700 font-medium">
                      ✓ {selectedGroupIds.length} group{selectedGroupIds.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}

              {/* Require RSVP */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input id="require-rsvp" name="requireRSVP" type="checkbox"
                    checked={formData.requireRSVP} onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500" />
                </div>
                <div className="ml-3">
                  <label htmlFor="require-rsvp" className="font-semibold text-gray-900">✓ Require RSVP</label>
                  <p className="text-sm text-gray-600">Members must RSVP to attend this event</p>
                </div>
              </div>

            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={loading || geocoding}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button type="submit" disabled={loading || geocoding}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading || geocoding ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {geocoding ? 'Finding Location...' : 'Creating Event...'}
                </>
              ) : (
                <><span>✨</span> Create Event</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;