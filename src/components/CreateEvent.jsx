import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

  // Recurring event state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('monthly');
  
  // Monthly state
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  
  // Weekly state
  const [weeklyDays, setWeeklyDays] = useState([1]); // Array of days (0=Sun, 6=Sat)
  
  // Daily state
  const [dailyInterval, setDailyInterval] = useState(1); // Every X days
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Timezone selector state
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Proper state name to abbreviation mapping
  const stateMap = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY'
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

  // Reset recurring state when modal closes
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
        // Don't allow removing all days
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
    
    if (stateMap[normalized]) {
      return stateMap[normalized];
    }
    
    if (stateName.length === 2) {
      return stateName.toUpperCase();
    }
    
    return stateName.substring(0, 2).toUpperCase();
  };

  const formatAddressDisplay = (address) => {
    const houseNumber = address.house_number || '';
    const road = address.road || '';
    const city = address.city || address.town || address.village || '';
    const state = address.state || '';
    const postcode = address.postcode || '';

    const streetAddress = `${houseNumber} ${road}`.trim();
    
    const parts = [];
    if (streetAddress) parts.push(streetAddress);
    if (city) parts.push(city);
    if (state) {
      const stateAbbr = extractStateAbbreviation(state);
      parts.push(stateAbbr);
    }
    if (postcode) parts.push(postcode);

    return parts.join(', ');
  };

  const searchAddresses = async (query) => {
    try {
      setSearchingAddress(true);
      
      const searchUrl = `https://nominatim.openstreetmap.org/search?` + 
        `format=json&` +
        `q=${encodeURIComponent(query)},USA&` +
        `limit=8&` +
        `addressdetails=1`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Search failed:', response.statusText);
        return;
      }

      const data = await response.json();
      
      const formattedSuggestions = data
        .filter(item => {
          const addr = item.address || {};
          const hasStreet = addr.road || addr.house_number;
          const hasCity = addr.city || addr.town || addr.village;
          return hasStreet && hasCity;
        })
        .map(item => ({
          ...item,
          formatted: formatAddressDisplay(item.address)
        }));
      
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
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.length >= 3) {
      const newTimeout = setTimeout(() => {
        searchAddresses(value);
      }, 500);
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)},USA&limit=1&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
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
      if (formData.title.trim().length < 3) {
        throw new Error('Event title must be at least 3 characters');
      }

      if (formData.schedule[0].date === '' || formData.schedule[0].startTime === '') {
        throw new Error('Please provide date and start time');
      }

      if (formData.eventType === 'virtual' && !formData.virtualLink.trim()) {
        throw new Error('Virtual events require a meeting link');
      }

      if ((formData.eventType === 'in-person' || formData.eventType === 'hybrid') && !formData.locationName.trim()) {
        throw new Error('Please provide a location');
      }

      if (formData.eventType === 'hybrid' && !formData.virtualLink.trim()) {
        throw new Error('Hybrid events require a virtual meeting link');
      }

      // Validate recurring event settings
      if (isRecurring) {
        if (recurrenceType === 'weekly' && weeklyDays.length === 0) {
          throw new Error('Please select at least one day for weekly recurring events');
        }
        if (recurrenceType === 'daily' && dailyInterval < 1) {
          throw new Error('Daily interval must be at least 1');
        }
      }

      // FIXED: Create timestamps in local timezone (not UTC)
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

      if (formData.maxAttendees && parseInt(formData.maxAttendees) < 1) {
        throw new Error('Maximum attendees must be at least 1');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to create events');

      let latitude = null;
      let longitude = null;

      if ((formData.eventType === 'in-person' || formData.eventType === 'hybrid') && formData.locationName) {
        const coords = await geocodeAddress(formData.locationName);
        
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }

      // Helper function to format datetime for Postgres with timezone
      const formatForPostgres = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // Get timezone offset
        const offset = -date.getTimezoneOffset();
        const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
        const offsetSign = offset >= 0 ? '+' : '-';
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
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
          recurrenceType === 'monthly' ? {
            type: 'monthly',
            dayOfWeek: dayOfWeek,
            weekOfMonth: weekOfMonth,
            time: formData.schedule[0].startTime + ':00'
          } :
          recurrenceType === 'weekly' ? {
            type: 'weekly',
            daysOfWeek: weeklyDays,
            time: formData.schedule[0].startTime + ':00'
          } :
          recurrenceType === 'daily' ? {
            type: 'daily',
            interval: dailyInterval,
            weekdaysOnly: weekdaysOnly,
            time: formData.schedule[0].startTime + ':00'
          } : null
        ) : null,
        recurrence_end_date: isRecurring && recurrenceEndDate 
          ? new Date(recurrenceEndDate).toISOString() 
          : null,
        parent_event_id: null,
        event_timezone: showTimezoneSelector ? selectedTimezone : null
      };

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) throw eventError;

      // Success message with recurring info
      const recurringMsg = isRecurring 
        ? ' 🔄 Recurring instances have been generated for the next 6 months!' 
        : '';
      alert(`✅ Event "${newEvent.title}" created successfully!${recurringMsg}`);

      if (onSuccess) {
        onSuccess(newEvent);
      }

      setFormData({
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
      setAddressInput('');

      onClose();

    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
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
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 
            id="create-event-title"
            className="text-2xl font-bold text-gray-900"
          >
            📅 Create New Event
          </h2>
          <p className="text-gray-600 mt-1">
            Create an event for {organizationName}
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

          {/* Title */}
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
              placeholder="e.g., Community Cleanup Day"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
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
              placeholder="Describe what this event is about..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Event Type *
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: formData.eventType === 'in-person' ? '#3b82f6' : '#d1d5db' }}>
                <input
                  type="radio"
                  name="eventType"
                  value="in-person"
                  checked={formData.eventType === 'in-person'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">📍 In-Person Event</p>
                  <p className="text-sm text-gray-600">Physical location only</p>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: formData.eventType === 'virtual' ? '#3b82f6' : '#d1d5db' }}>
                <input
                  type="radio"
                  name="eventType"
                  value="virtual"
                  checked={formData.eventType === 'virtual'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">💻 Virtual Event</p>
                  <p className="text-sm text-gray-600">Online only (Zoom, Google Meet, etc.)</p>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: formData.eventType === 'hybrid' ? '#3b82f6' : '#d1d5db' }}>
                <input
                  type="radio"
                  name="eventType"
                  value="hybrid"
                  checked={formData.eventType === 'hybrid'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">🌐 Hybrid Event</p>
                  <p className="text-sm text-gray-600">Both in-person and virtual options</p>
                </div>
              </label>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Schedule *
            </label>
            
            <div className="space-y-4">
              {formData.schedule.map((day, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-900">
                      {formData.isMultiDay ? `Day ${index + 1}` : 'Event Date & Time'}
                    </p>
                    {formData.isMultiDay && formData.schedule.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDay(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`date-${index}`} className="block text-xs text-gray-600 mb-1">
                        Date
                      </label>
                      <input
                        id={`date-${index}`}
                        type="date"
                        required
                        value={day.date}
                        onChange={(e) => handleScheduleChange(index, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor={`start-${index}`} className="block text-xs text-gray-600 mb-1">
                        Start Time
                      </label>
                      <input
                        id={`start-${index}`}
                        type="time"
                        required
                        value={day.startTime}
                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor={`end-${index}`} className="block text-xs text-gray-600 mb-1">
                        End Time
                      </label>
                      <input
                        id={`end-${index}`}
                        type="time"
                        value={day.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="multi-day"
                      name="isMultiDay"
                      type="checkbox"
                      checked={formData.isMultiDay}
                      onChange={handleChange}
                      className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="multi-day" className="font-semibold text-gray-900">
                      Multiple Day Event
                    </label>
                    <p className="text-sm text-gray-600">
                      Event spans across multiple days
                    </p>
                  </div>
                </div>

                {formData.isMultiDay && formData.schedule.length < 5 && (
                  <button
                    type="button"
                    onClick={addDay}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Add Day
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Virtual Link */}
          {(formData.eventType === 'virtual' || formData.eventType === 'hybrid') && (
            <div>
              <label 
                htmlFor="virtual-link"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Meeting Link *
              </label>
              <input
                id="virtual-link"
                name="virtualLink"
                type="url"
                required
                value={formData.virtualLink}
                onChange={handleChange}
                placeholder="https://zoom.us/j/123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Zoom, Google Meet, Microsoft Teams, etc.
              </p>
            </div>
          )}

          {/* Physical Location */}
          {(formData.eventType === 'in-person' || formData.eventType === 'hybrid') && (
            <>
              <div>
                <label 
                  htmlFor="location-name"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Location *
                </label>
                <input
                  id="location-name"
                  name="locationName"
                  type="text"
                  required
                  value={formData.locationName}
                  onChange={handleChange}
                  placeholder="123 Main St, Toledo, OH 43604"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Full address including city, state, and ZIP
                </p>
              </div>

              <div className="relative">
                <label 
                  htmlFor="address-search"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Address Search Helper
                </label>
                <div className="relative">
                  <input
                    id="address-search"
                    type="text"
                    value={addressInput}
                    onChange={handleAddressInputChange}
                    placeholder="Type to search for address..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="off"
                  />
                  
                  {searchingAddress && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectAddress(suggestion);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">📍</span>
                          <p className="text-sm font-medium text-gray-900">
                            {suggestion.formatted}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-1">
                  {searchingAddress ? 'Searching...' : 
                   addressSuggestions.length > 0 ? `${addressSuggestions.length} results found` :
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
                <label 
                  htmlFor="location-link"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Location Link (Optional)
                </label>
                <input
                  id="location-link"
                  name="locationLink"
                  type="url"
                  value={formData.locationLink}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Google Maps or directions URL
                </p>
              </div>
            </>
          )}

          {/* Max Attendees */}
          <div>
            <label 
              htmlFor="max-attendees"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Maximum Attendees (Optional)
            </label>
            <input
              id="max-attendees"
              name="maxAttendees"
              type="number"
              min="1"
              value={formData.maxAttendees}
              onChange={handleChange}
              placeholder="Leave empty for unlimited"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ===== RECURRING EVENT SECTION ===== */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                aria-describedby="recurring-description"
              />
              <label 
                htmlFor="isRecurring" 
                className="text-base font-semibold text-gray-900 cursor-pointer"
              >
                🔄 Make this a recurring event
              </label>
            </div>
            
            <p id="recurring-description" className="text-sm text-gray-600 mb-4">
              Automatically create this event on a regular schedule
            </p>

            {isRecurring && (
              <div className="space-y-4 pl-2 border-l-4 border-blue-400">
                {/* Recurrence Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recurrence Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecurrenceType('daily')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        recurrenceType === 'daily'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      📆 Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceType('weekly')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        recurrenceType === 'weekly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      📅 Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceType('monthly')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        recurrenceType === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🗓️ Monthly
                    </button>
                  </div>
                </div>

                {/* DAILY PATTERN */}
                {recurrenceType === 'daily' && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="dailyInterval" className="block text-sm font-medium text-gray-700 mb-2">
                        Repeat every
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          id="dailyInterval"
                          min="1"
                          max="30"
                          value={dailyInterval}
                          onChange={(e) => setDailyInterval(parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">day(s)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="weekdaysOnly"
                        checked={weekdaysOnly}
                        onChange={(e) => setWeekdaysOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="weekdaysOnly" className="text-sm text-gray-700">
                        Weekdays only (Monday - Friday)
                      </label>
                    </div>

                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                      <strong>📅 Preview:</strong> Repeats every {dailyInterval} day{dailyInterval > 1 ? 's' : ''}
                      {weekdaysOnly && ' (weekdays only)'} at{' '}
                      <strong>{formData.schedule[0].startTime || '(time not set)'}</strong>
                    </div>
                  </div>
                )}

                {/* WEEKLY PATTERN */}
                {recurrenceType === 'weekly' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Select days of the week
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {dayNames.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleWeeklyDay(index)}
                          className={`px-2 py-2 rounded-lg font-medium text-sm transition-all ${
                            weeklyDays.includes(index)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                      <strong>📅 Preview:</strong> Repeats every{' '}
                      {weeklyDays.map(d => fullDayNames[d]).join(', ')} at{' '}
                      <strong>{formData.schedule[0].startTime || '(time not set)'}</strong>
                    </div>
                  </div>
                )}

                {/* MONTHLY PATTERN */}
                {recurrenceType === 'monthly' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="weekOfMonth" className="block text-xs text-gray-600 mb-1">
                          Which week?
                        </label>
                        <select
                          id="weekOfMonth"
                          value={weekOfMonth}
                          onChange={(e) => setWeekOfMonth(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="1">First week</option>
                          <option value="2">Second week</option>
                          <option value="3">Third week</option>
                          <option value="4">Fourth week</option>
                          <option value="-1">Last week</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="dayOfWeek" className="block text-xs text-gray-600 mb-1">
                          Which day?
                        </label>
                        <select
                          id="dayOfWeek"
                          value={dayOfWeek}
                          onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                      <strong>📅 Preview:</strong> Repeats on the{' '}
                      {weekOfMonth === -1 ? 'Last' : 
                       weekOfMonth === 1 ? 'First' :
                       weekOfMonth === 2 ? 'Second' :
                       weekOfMonth === 3 ? 'Third' : 'Fourth'}{' '}
                      {fullDayNames[dayOfWeek]} of every month at{' '}
                      <strong>{formData.schedule[0].startTime || '(time not set)'}</strong>
                    </div>
                  </div>
                )}

                {/* Optional End Date */}
                <div>
                  <label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={formData.schedule[0].date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Leave blank to continue indefinitely. We'll generate instances 6 months in advance.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ===== TIMEZONE SELECTOR SECTION ===== */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  🌍 Event Timezone
                </span>
                <span className="text-xs text-gray-500">
                  (Optional)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showTimezoneSelector ? 'Use Auto-Detect' : 'Specify Different Timezone'}
              </button>
            </div>

            {!showTimezoneSelector ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Auto-detected: <strong>{formatTimezone(userTimezone)}</strong>
                </span>
              </div>
            ) : (
              <div>
                <label htmlFor="eventTimezone" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event Timezone
                </label>
                <select
                  id="eventTimezone"
                  value={selectedTimezone || userTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="🇺🇸 United States">
                    <option value="America/New_York">Eastern Time (ET) - New York, Miami, Boston</option>
                    <option value="America/Chicago">Central Time (CT) - Chicago, Dallas, Houston</option>
                    <option value="America/Denver">Mountain Time (MT) - Denver, Salt Lake City</option>
                    <option value="America/Phoenix">Mountain Time (MT) - Arizona (No DST)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT) - LA, Seattle, San Francisco</option>
                    <option value="America/Anchorage">Alaska Time (AKT) - Anchorage</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HST) - Honolulu</option>
                  </optgroup>
                  <optgroup label="🇨🇦 Canada">
                    <option value="America/Toronto">Eastern Time - Toronto, Ottawa</option>
                    <option value="America/Winnipeg">Central Time - Winnipeg</option>
                    <option value="America/Edmonton">Mountain Time - Edmonton, Calgary</option>
                    <option value="America/Vancouver">Pacific Time - Vancouver</option>
                  </optgroup>
                  <optgroup label="🌍 International">
                    <option value="Europe/London">United Kingdom (GMT/BST) - London</option>
                    <option value="Europe/Paris">Central Europe (CET/CEST) - Paris, Berlin, Rome</option>
                    <option value="Asia/Tokyo">Japan (JST) - Tokyo</option>
                    <option value="Asia/Shanghai">China (CST) - Beijing, Shanghai</option>
                    <option value="Asia/Kolkata">India (IST) - Mumbai, Delhi</option>
                    <option value="Australia/Sydney">Australia East (AEST/AEDT) - Sydney</option>
                  </optgroup>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  ℹ️ This is the timezone where the event takes place. Attendees will see the time converted to their local timezone.
                </p>

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
                        Make sure the time you entered ({formData.schedule[0].startTime}) is correct for{' '}
                        {formatTimezone(selectedTimezone)}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Event Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="public-event"
                    type="checkbox"
                    checked={formData.visibility === 'public'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      visibility: e.target.checked ? 'public' : 'members' 
                    }))}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="public-event" className="font-semibold text-gray-900">
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
                    id="require-rsvp"
                    name="requireRSVP"
                    type="checkbox"
                    checked={formData.requireRSVP}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="require-rsvp" className="font-semibold text-gray-900">
                    ✓ Require RSVP
                  </label>
                  <p className="text-sm text-gray-600">
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
              disabled={loading || geocoding}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || geocoding}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading || geocoding ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {geocoding ? 'Finding Location...' : 'Creating Event...'}
                </>
              ) : (
                <>
                  <span>✨</span>
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