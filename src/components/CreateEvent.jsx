import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function CreateEvent({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    isMultiDay: false,
    endDate: '',
    locationName: '',
    fullAddress: '',
    city: '',
    state: '',
    zipCode: '',
    isVirtual: false,
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

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      const stateAbbr = usStates.find(s => 
        state.toLowerCase().includes(s.toLowerCase())
      ) || state.substring(0, 2).toUpperCase();
      parts.push(stateAbbr);
    }
    if (postcode) parts.push(postcode);

    return parts.join(', ');
  };

  const searchAddresses = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setSearchingAddress(true);
      
      const searchUrl = `https://nominatim.openstreetmap.org/search?` + 
        `format=json&` +
        `q=${encodeURIComponent(query)}&` +
        `limit=8&` +
        `countrycodes=us&` +
        `addressdetails=1`;

      console.log('Searching addresses for:', query);

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Syndicade Community Platform'
        }
      });

      if (!response.ok) {
        console.error('Address search failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Address results:', data);
      
      const formattedSuggestions = data
        .filter(item => {
          const addr = item.address || {};
          return (addr.road || addr.house_number) && (addr.city || addr.town || addr.village);
        })
        .map(item => ({
          ...item,
          formatted: formatAddressDisplay(item.address)
        }));

      console.log('Formatted suggestions:', formattedSuggestions);
      
      setAddressSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (err) {
      console.error('Address search error:', err);
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleAddressInput = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, fullAddress: value }));
    
    if (value.length >= 3) {
      searchAddresses(value);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const extractStateAbbreviation = (stateName) => {
    if (!stateName) return '';
    
    const stateAbbr = usStates.find(s => 
      stateName.toLowerCase().includes(s.toLowerCase())
    );
    
    return stateAbbr || stateName.substring(0, 2).toUpperCase();
  };

  const selectAddress = (suggestion) => {
    console.log('Selected address:', suggestion);
    
    const addr = suggestion.address;
    
    const houseNumber = addr.house_number || '';
    const road = addr.road || '';
    const streetAddress = `${houseNumber} ${road}`.trim();
    const city = addr.city || addr.town || addr.village || '';
    const state = extractStateAbbreviation(addr.state || '');
    const zip = addr.postcode || '';
    
    setFormData(prev => ({
      ...prev,
      fullAddress: suggestion.formatted,
      city: city,
      state: state,
      zipCode: zip
    }));
    
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const geocodeAddress = async (address) => {
    try {
      setGeocoding(true);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Syndicade Community Platform'
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

      if (!formData.date || !formData.startTime) {
        throw new Error('Please provide date and start time');
      }

      if (formData.isMultiDay && !formData.endDate) {
        throw new Error('Please provide end date for multi-day event');
      }

      if (formData.isVirtual && !formData.virtualLink.trim()) {
        throw new Error('Virtual events require a meeting link');
      }

      if (!formData.isVirtual && !formData.locationName.trim()) {
        throw new Error('Please provide a location name');
      }

      if (!formData.isVirtual && !formData.fullAddress.trim()) {
        throw new Error('Please provide an address');
      }

      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      let endDateTime = null;
      
      if (formData.isMultiDay && formData.endDate && formData.endTime) {
        endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      } else if (formData.endTime) {
        endDateTime = new Date(`${formData.date}T${formData.endTime}`);
      }
      
      if (endDateTime && endDateTime <= startDateTime) {
        throw new Error('End time must be after start time');
      }

      if (formData.maxAttendees && parseInt(formData.maxAttendees) < 1) {
        throw new Error('Maximum attendees must be at least 1');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to create events');

      let latitude = null;
      let longitude = null;

      if (!formData.isVirtual && formData.fullAddress) {
        const coords = await geocodeAddress(formData.fullAddress);
        
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        } else {
          console.warn('Geocoding failed, event will not appear in location search');
        }
      }

      const eventData = {
        organization_id: organizationId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime ? endDateTime.toISOString() : null,
        location: formData.isVirtual ? 'Virtual Event' : formData.locationName.trim(),
        full_address: formData.isVirtual ? null : formData.fullAddress.trim(),
        city: formData.isVirtual ? null : formData.city.trim(),
        state: formData.isVirtual ? null : formData.state,
        zip_code: formData.isVirtual ? null : formData.zipCode.trim(),
        latitude: latitude,
        longitude: longitude,
        is_virtual: formData.isVirtual,
        virtual_link: formData.isVirtual ? formData.virtualLink.trim() : null,
        location_link: formData.locationLink.trim() || null,
        max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        visibility: formData.visibility,
        require_rsvp: formData.requireRSVP,
        created_by: user.id
      };

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) throw eventError;

      if (onSuccess) {
        onSuccess(newEvent);
      }

      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        isMultiDay: false,
        endDate: '',
        locationName: '',
        fullAddress: '',
        city: '',
        state: '',
        zipCode: '',
        isVirtual: false,
        virtualLink: '',
        locationLink: '',
        maxAttendees: '',
        visibility: 'members',
        requireRSVP: false
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
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
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
              aria-required="true"
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
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
              placeholder="Describe what this event is about..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Date & Time *
            </label>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="event-date" className="block text-xs text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    id="event-date"
                    name="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="start-time" className="block text-xs text-gray-600 mb-1">
                    Start Time
                  </label>
                  <input
                    id="start-time"
                    name="startTime"
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="end-time" className="block text-xs text-gray-600 mb-1">
                    End Time
                  </label>
                  <input
                    id="end-time"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

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

              {formData.isMultiDay && (
                <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">
                      End Date
                    </label>
                    <input
                      id="end-date"
                      name="endDate"
                      type="date"
                      required={formData.isMultiDay}
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <p className="text-sm text-blue-800">
                      Event runs from <strong>{formData.date || '(start date)'}</strong> to <strong>{formData.endDate || '(end date)'}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="is-virtual"
                name="isVirtual"
                type="checkbox"
                checked={formData.isVirtual}
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

          {formData.isVirtual ? (
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
                required={formData.isVirtual}
                value={formData.virtualLink}
                onChange={handleChange}
                placeholder="https://zoom.us/j/123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-required={formData.isVirtual}
              />
            </div>
          ) : (
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
                  required={!formData.isVirtual}
                  value={formData.locationName}
                  onChange={handleChange}
                  placeholder="123 Main St, Toledo, OH 43604"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-required={!formData.isVirtual}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Street address or venue name
                </p>
              </div>

              <div className="relative">
                <label 
                  htmlFor="full-address"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Address Search
                </label>
                <input
                  id="full-address"
                  name="fullAddress"
                  type="text"
                  value={formData.fullAddress}
                  onChange={handleAddressInput}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Type to search for address..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete="off"
                />
                
                {searchingAddress && (
                  <div className="absolute right-3 top-11">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
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
                  Type at least 3 characters to search
                  {addressSuggestions.length > 0 && ` - ${addressSuggestions.length} results found`}
                </p>
              </div>

              {(formData.city || formData.state || formData.zipCode) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">Auto-detected:</p>
                      <div className="space-y-1">
                        {formData.city && (
                          <p>City: <span className="font-medium">{formData.city}</span></p>
                        )}
                        {formData.state && (
                          <p>State: <span className="font-medium">{formData.state}</span></p>
                        )}
                        {formData.zipCode && (
                          <p>ZIP: <span className="font-medium">{formData.zipCode}</span></p>
                        )}
                      </div>
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
              name="maxAttendees"
              type="number"
              min="1"
              value={formData.maxAttendees}
              onChange={handleChange}
              placeholder="Leave empty for unlimited"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Set a capacity limit for your event
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Event Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="public-event"
                    name="visibility"
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
                  <label htmlFor="public-event" className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>🌍</span> Public Event
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
                  <label htmlFor="require-rsvp" className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>✓</span> Require RSVP
                  </label>
                  <p className="text-sm text-gray-600">
                    Members must RSVP to attend this event
                  </p>
                </div>
              </div>
            </div>
          </div>

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
              aria-label={loading ? 'Creating event...' : geocoding ? 'Geocoding address...' : 'Create event'}
            >
              {loading || geocoding ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                    role="status"
                    aria-label="Loading"
                  >
                    <span className="sr-only">{geocoding ? 'Finding location...' : 'Creating...'}</span>
                  </div>
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