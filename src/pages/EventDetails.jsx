import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function EventDetails() {
  const { eventId } = useParams();
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

  useEffect(() => {
    async function fetchEventDetails() {
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
    }

    if (eventId) {
      fetchEventDetails();
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

  const handleDelete = async () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/events" className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
              ← Back to Events
            </Link>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>
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
    </div>
  );
}

export default EventDetails;