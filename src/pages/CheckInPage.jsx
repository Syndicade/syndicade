import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function CheckInPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchEventAndUser();
  }, [eventId]);

  const fetchEventAndUser = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Get event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: 'Event not found' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentUser) {
      navigate('/login', { state: { returnTo: `/check-in/${eventId}` } });
      return;
    }

    setChecking(true);
    setMessage(null);

    try {
      // Check if user has RSVP'd
      const { data: rsvp } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('member_id', currentUser.id)
        .single();

      if (!rsvp) {
        setMessage({ 
          type: 'warning', 
          text: 'You need to RSVP before checking in. Redirecting to event page...' 
        });
        setTimeout(() => navigate(`/events/${eventId}`), 2000);
        return;
      }

      // Mark attendance
      const { error } = await supabase
        .from('attendance_records')
        .insert([{
          event_id: eventId,
          member_id: currentUser.id,
          checked_in_by: currentUser.id
        }]);

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'info', text: '✓ You are already checked in!' });
        } else {
          throw error;
        }
      } else {
        setMessage({ type: 'success', text: '✅ Successfully checked in!' });
      }

      // Redirect to event page after 2 seconds
      setTimeout(() => navigate(`/events/${eventId}`), 2000);

    } catch (err) {
      console.error('Check-in error:', err);
      setMessage({ type: 'error', text: 'Failed to check in. Please try again.' });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-800 mb-2">Event Not Found</h2>
          <p className="text-red-700 mb-4">This event does not exist.</p>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        {/* Event Info */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
          <p className="text-gray-600">
            {new Date(event.start_time).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            message.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`font-semibold text-center ${
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' :
              message.type === 'warning' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Check-In Button */}
        {!message && (
          <button
            onClick={handleCheckIn}
            disabled={checking}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
          >
            {checking ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Checking In...
              </span>
            ) : (
              '✓ Check In to Event'
            )}
          </button>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
          >
            View Event Details →
          </button>
          {!currentUser && (
            <p className="text-sm text-gray-600">
              Not logged in?{' '}
              <button
                onClick={() => navigate('/login', { state: { returnTo: `/check-in/${eventId}` } })}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckInPage;