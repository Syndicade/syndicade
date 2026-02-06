import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadICS } from '../lib/icalGenerator';
import RecurringEventOptions from '../components/RecurringEventOptions';
import EditEvent from '../components/EditEvent';
import AttendanceReport from '../components/AttendanceReport';
import EventCheckIn from '../components/EventCheckIn';

function EventDetails() {
const { eventId, organizationId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [userRsvp, setUserRsvp] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Recurring event modal state
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [recurringAction, setRecurringAction] = useState(null); // 'edit' or 'delete'
  const [showEditModal, setShowEditModal] = useState(false);
  const [editScope, setEditScope] = useState(null); // 'this', 'future', 'all'
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Fetch event details
  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        setError('Event not found');
        setLoading(false);
        return;
      }
      setEvent(eventData);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', eventData.organization_id)
        .single();

      if (!orgError && orgData) {
        setOrganization(orgData);
      }

      if (user) {
        const { data: membership, error: membershipError } = await supabase
          .from('memberships')
          .select('role')
          .eq('member_id', user.id)
          .eq('organization_id', eventData.organization_id)
          .eq('status', 'active')
          .single();

        if (!membershipError && membership && membership.role === 'admin') {
          setIsAdmin(true);
        }
      }

      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('*, members(first_name, last_name, profile_photo_url)')
        .eq('event_id', eventId);

      if (!rsvpError && rsvpData) {
        setRsvps(rsvpData);

        if (user) {
          const userResponse = rsvpData.find(r => r.member_id === user.id);
          if (userResponse) {
            setUserRsvp(userResponse.status);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleRsvp = async (status) => {
    if (!currentUser) {
      alert('Please log in to RSVP');
      navigate('/login');
      return;
    }

    try {
      setRsvpLoading(true);
      setRsvpSuccess(false);

      if (userRsvp) {
        const { error } = await supabase
          .from('event_rsvps')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('event_id', eventId)
          .eq('member_id', currentUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_rsvps')
          .insert([{
            event_id: eventId,
            member_id: currentUser.id,
            status: status,
            guest_count: 0
          }]);

        if (error) throw error;
      }

      setUserRsvp(status);
      setRsvpSuccess(true);

      const { data: updatedRsvps } = await supabase
        .from('event_rsvps')
        .select('*, members(first_name, last_name, profile_photo_url)')
        .eq('event_id', eventId);

      if (updatedRsvps) {
        setRsvps(updatedRsvps);
      }

      setTimeout(() => setRsvpSuccess(false), 3000);

    } catch (err) {
      console.error('Error updating RSVP:', err);
      alert('Failed to update RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle edit button click
  const handleEditClick = () => {
    console.log('🔍 Edit clicked. Event data:', {
      is_recurring: event.is_recurring,
      parent_event_id: event.parent_event_id,
      id: event.id
    });

    // Check if this is a recurring event (either parent or instance)
    if (event.is_recurring || event.parent_event_id) {
      setRecurringAction('edit');
      setShowRecurringOptions(true);
    } else {
      // Regular event - open edit modal directly
      setEditScope(null);
      setShowEditModal(true);
    }
  };

  // Handle recurring edit option selection
  const handleRecurringEditOptionSelect = (option) => {
    console.log('🎯 Recurring edit option selected:', option);
    setShowRecurringOptions(false);
    setEditScope(option); // 'this', 'future', or 'all'
    
    // Small delay to ensure state is updated before opening modal
    setTimeout(() => {
      setShowEditModal(true);
    }, 100);
  };

  // Handle event updated successfully
  const handleEventUpdated = (updatedEvent) => {
    console.log('✅ Event updated:', updatedEvent);
    
    // Close modal first
    setShowEditModal(false);
    setEditScope(null);
    
    // Refresh event data
    fetchEvent();
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    // Check if this is a recurring event
    if (event.is_recurring || event.parent_event_id) {
      setRecurringAction('delete');
      setShowRecurringOptions(true);
    } else {
      // Regular event - show confirmation directly
      handleDeleteRegular();
    }
  };

  // Handle regular event delete
  const handleDeleteRegular = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      alert('Event deleted successfully');
      navigate('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  // Handle recurring options selection
  const handleRecurringOptionSelect = async (option) => {
    console.log('🎯 Recurring option selected:', option, 'Action:', recurringAction);
    setShowRecurringOptions(false);

    if (recurringAction === 'edit') {
      handleRecurringEditOptionSelect(option);
    } else if (recurringAction === 'delete') {
      if (option === 'this') {
        await handleDeleteInstance();
      } else if (option === 'future') {
        await handleDeleteFutureInstances();
      } else if (option === 'all') {
        await handleDeleteSeries();
      }
    }
  };

  // Delete single instance
  const handleDeleteInstance = async () => {
    if (!confirm('Delete only this event instance?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      alert('Event instance deleted successfully');
      navigate('/events');
    } catch (err) {
      console.error('Error deleting instance:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  // Delete future instances
  const handleDeleteFutureInstances = async () => {
    if (!confirm('Delete this and all future instances of this event?')) return;

    try {
      const parentId = event.parent_event_id || event.id;

      const { error } = await supabase
        .from('events')
        .delete()
        .or(`id.eq.${eventId},and(parent_event_id.eq.${parentId},start_time.gte.${event.start_time})`);

      if (error) throw error;

      alert('Future instances deleted successfully');
      navigate('/events');
    } catch (err) {
      console.error('Error deleting future instances:', err);
      alert('Failed to delete future instances. Please try again.');
    }
  };

// Delete entire series (current and future only)
const handleDeleteSeries = async () => {
  if (!confirm('⚠️ Delete this recurring event series?\n\nThis will permanently delete:\n- All current and future occurrences\n- Past occurrences will be preserved\n\nThis action CANNOT be undone.')) {
    return;
  }

  try {
    const parentId = event.parent_event_id || event.id;
    const now = new Date().toISOString();

    console.log('🗑️ Deleting current and future instances for parent ID:', parentId);

    // Delete parent event
    const { error: parentDeleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', parentId);

    if (parentDeleteError) throw parentDeleteError;

    // Delete all future instances (keep past ones for history)
    const { error: futureDeleteError } = await supabase
      .from('events')
      .delete()
      .eq('parent_event_id', parentId)
      .gte('start_time', now);

    if (futureDeleteError) throw futureDeleteError;

    alert('✅ Recurring event series deleted. Past occurrences have been preserved for history.');
    navigate('/events');
  } catch (err) {
    console.error('❌ Error deleting series:', err);
    alert('Failed to delete series. Please try again.');
  }
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRsvpCounts = () => {
    return {
      going: rsvps.filter(r => r.status === 'going').length,
      maybe: rsvps.filter(r => r.status === 'maybe').length,
      not_going: rsvps.filter(r => r.status === 'not_going').length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto" role="status" aria-label="Loading event details">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600 font-semibold">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full" role="alert">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-red-800">Event Not Found</h2>
          </div>
          <p className="text-red-700 mb-4">{error || 'This event does not exist or you do not have permission to view it.'}</p>
          <Link to="/events" className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const counts = getRsvpCounts();
  const isPastEvent = new Date(event.start_time) < new Date();

  // Check-In Button Component
  const CheckInButton = ({ eventId }) => {
    const [checking, setChecking] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);
    const [checkInMessage, setCheckInMessage] = useState('');

    useEffect(() => {
      checkIfAlreadyCheckedIn();
    }, []);

    const checkIfAlreadyCheckedIn = async () => {
      if (!currentUser) return;

      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('event_id', eventId)
        .eq('member_id', currentUser.id)
        .single();

      if (data) {
        setCheckedIn(true);
      }
    };

    const handleCheckIn = async () => {
      if (!currentUser) return;

      setChecking(true);
      try {
        const { error } = await supabase
          .from('attendance_records')
          .insert([{
            event_id: eventId,
            member_id: currentUser.id,
            checked_in_by: currentUser.id
          }]);

        if (error) {
          if (error.code === '23505') {
            setCheckInMessage('Already checked in!');
            setCheckedIn(true);
          } else {
            throw error;
          }
        } else {
          setCheckInMessage('✅ Checked in successfully!');
          setCheckedIn(true);
          setTimeout(() => setCheckInMessage(''), 3000);
        }
      } catch (err) {
        console.error('Check-in error:', err);
        setCheckInMessage('❌ Failed to check in');
      } finally {
        setChecking(false);
      }
    };

    if (checkedIn) {
      return (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
          <p className="text-green-800 font-bold text-lg">✓ You're Checked In!</p>
          {checkInMessage && <p className="text-green-700 text-sm mt-1">{checkInMessage}</p>}
        </div>
      );
    }

    return (
      <div>
        <button
          onClick={handleCheckIn}
          disabled={checking}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white text-lg font-bold rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
        >
          {checking ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Checking In...
            </span>
          ) : (
            '✓ Check In Now'
          )}
        </button>
        {checkInMessage && (
          <p className="text-center mt-2 text-sm font-semibold text-gray-700">{checkInMessage}</p>
        )}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/events" className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              ← Back to Events
            </Link>
<div className="flex items-center gap-2">
              {/* iCal Export - Available to everyone */}
              <button
                onClick={() => downloadICS(event)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title="Add to Calendar"
              >
                📅 Add to Calendar
              </button>

              {/* Print Button - Available to everyone */}
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 print-button"
                title="Print Event Details"
              >
                🖨️ Print
              </button>

              {/* Admin-only buttons */}
              {isAdmin && (
                <>
                
                  {/* Check-In Button - Admin Only */}
                  <button
                    onClick={() => setShowCheckIn(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    title="Event Check-In"
                  >
                    🎫 Check-In
                  </button>

                 {/* Attendance Report Button - Admin Only */}
                  <button
                    onClick={() => setShowAttendanceReport(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    title="View Attendance Report"
                  >
                    📊 Attendance
                  </button>

                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Title with recurring indicator */}
          <div className="flex items-start gap-3">
            {event.is_recurring && (
              <span className="text-3xl mt-1" title="Recurring Event">🔄</span>
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>
              {event.is_recurring && (
                <p className="text-sm text-blue-600 mt-1 font-semibold">
                  {event.parent_event_id ? 'Part of recurring series' : 'Recurring event series'}
                </p>
              )}
            </div>
          </div>
          
          {organization && (
            <p className="text-lg text-gray-600 mt-2">{organization.name}</p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {rsvpSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="alert">
                <p className="text-green-800 font-semibold">✓ RSVP updated successfully!</p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Date & Time</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Date</p>
                  <p className="text-lg text-gray-900">{formatDate(event.start_time)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Time</p>
                  <p className="text-lg text-gray-900">
                    {formatTime(event.start_time)}
                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                  </p>
                </div>
                {isPastEvent && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-semibold">⏰ This event has already occurred</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {event.is_virtual ? '💻 Virtual Event' : '📍 Location'}
              </h2>
              {event.is_virtual ? (
                <div>
                  <p className="text-gray-700 mb-3">This is a virtual event</p>
                  {event.virtual_link ? (
                    userRsvp === 'going' ? (
                      <a href={event.virtual_link} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Join Virtual Event →
                      </a>
                    ) : (
                      <p className="text-sm text-gray-600">RSVP "Going" to see the virtual event link</p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500">Virtual event link will be shared closer to the event date</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-900 mb-3">{event.location}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    View on Map →
                  </a>
                </div>
              )}
            </div>

            {event.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {event.max_attendees && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Capacity</h2>
                <div className="flex items-center justify-between">
                  <p className="text-gray-700">
                    <span className="text-2xl font-bold text-blue-600">{counts.going}</span>
                    <span className="text-gray-600"> / {event.max_attendees} spots filled</span>
                  </p>
                  {counts.going >= event.max_attendees && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">Event Full</span>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="space-y-6">
            
            {/* Member Check-In (Show on event day) */}
            {!isPastEvent && currentUser && new Date(event.start_time).toDateString() === new Date().toDateString() && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm border-2 border-green-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">✓ Check In</h2>
                <p className="text-sm text-gray-600 mb-4">Event is happening today! Check in to confirm your attendance.</p>
                <CheckInButton eventId={event.id} />
              </div>
            )}

            {!isPastEvent && currentUser && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your RSVP</h2>
                <div className="space-y-3">
                  <button onClick={() => handleRsvp('going')} disabled={rsvpLoading} className={`w-full px-4 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${userRsvp === 'going' ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    ✓ Going
                  </button>
                  <button onClick={() => handleRsvp('maybe')} disabled={rsvpLoading} className={`w-full px-4 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${userRsvp === 'maybe' ? 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    ? Maybe
                  </button>
                  <button onClick={() => handleRsvp('not_going')} disabled={rsvpLoading} className={`w-full px-4 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${userRsvp === 'not_going' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    ✗ Can't Go
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Responses</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center gap-2">
                    <span className="text-green-600 font-semibold">✓</span> Going
                  </span>
                  <span className="font-bold text-gray-900">{counts.going}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center gap-2">
                    <span className="text-yellow-600 font-semibold">?</span> Maybe
                  </span>
                  <span className="font-bold text-gray-900">{counts.maybe}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 flex items-center gap-2">
                    <span className="text-red-600 font-semibold">✗</span> Can't Go
                  </span>
                  <span className="font-bold text-gray-900">{counts.not_going}</span>
                </div>
              </div>
            </div>

            {counts.going > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Going ({counts.going})</h2>
                <div className="space-y-2">
                  {rsvps.filter(r => r.status === 'going').slice(0, 10).map(rsvp => (
                    <div key={rsvp.id} className="flex items-center gap-3">
                      {rsvp.members?.profile_photo_url ? (
                        <img src={rsvp.members.profile_photo_url} alt={`${rsvp.members.first_name} ${rsvp.members.last_name}`} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                          {rsvp.members?.first_name?.[0]}{rsvp.members?.last_name?.[0]}
                        </div>
                      )}
                      <span className="text-sm text-gray-700">
                        {rsvp.members?.first_name} {rsvp.members?.last_name}
                      </span>
                    </div>
                  ))}
                  {counts.going > 10 && (
                    <p className="text-sm text-gray-600 mt-2">+ {counts.going - 10} more</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Recurring Event Options Modal */}
      {showRecurringOptions && (
        <RecurringEventOptions
          event={event}
          action={recurringAction}
          onSelect={handleRecurringOptionSelect}
          onCancel={() => {
            setShowRecurringOptions(false);
            setRecurringAction(null);
          }}
        />
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <EditEvent
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditScope(null);
          }}
          onSuccess={handleEventUpdated}
          event={event}
          editScope={editScope}
          isRecurring={event.is_recurring || !!event.parent_event_id}
        />
      )}
      
       {/* Attendance Report Modal */}
      {showAttendanceReport && (
        <AttendanceReport
          event={event}
          onClose={() => setShowAttendanceReport(false)}
        />
      )}
      

      {/* Event Check-In Modal */}
      {showCheckIn && (
        <EventCheckIn
          event={event}
          onClose={() => setShowCheckIn(false)}
        />
      )}
    </div>
  );
  }

export default EventDetails;