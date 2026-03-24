import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadICS } from '../lib/icalGenerator';
import RecurringEventOptions from '../components/RecurringEventOptions';
import EditEvent from '../components/EditEvent';
import AttendanceReport from '../components/AttendanceReport';
import AttendanceCheckIn from '../components/AttendanceCheckIn';

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
  const [recurringAction, setRecurringAction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editScope, setEditScope] = useState(null);
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);

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
          .insert([{ event_id: eventId, member_id: currentUser.id, status: status, guest_count: 0 }]);
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

      if (status === 'going') {
        var memberRes = await supabase
          .from('members')
          .select('email, first_name')
          .eq('user_id', currentUser.id)
          .single();

        if (memberRes.data && memberRes.data.email) {
          var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';
          var eventDate = new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          var eventTime = new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          await fetch(SUPABASE_URL + '/functions/v1/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdG1ocXJ5Z2tua29keWRidW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Nzc0NjksImV4cCI6MjA4NDA1MzQ2OX0.B7DsLVNZuG1l39ABXDk1Km_737tCvbWAZGhqVCC3ddE',
            },
            body: JSON.stringify({
              type: 'rsvp_confirmation',
              data: {
                memberEmail: memberRes.data.email,
                eventTitle: event.title,
                orgName: organization ? organization.name : '',
                eventDate: eventDate + ' at ' + eventTime,
                eventLocation: event.is_virtual ? 'Virtual Event' : (event.location || ''),
                eventUrl: window.location.href,
                startISO: event.start_time,
                endISO: event.end_time || event.start_time,
                eventId: event.id,
              },
            }),
          });
        }
      }

      setTimeout(() => setRsvpSuccess(false), 3000);

    } catch (err) {
      console.error('Error updating RSVP:', err);
      alert('Failed to update RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleEditClick = () => {
    if (event.is_recurring || event.parent_event_id) {
      setRecurringAction('edit');
      setShowRecurringOptions(true);
    } else {
      setEditScope(null);
      setShowEditModal(true);
    }
  };

  const handleRecurringEditOptionSelect = (option) => {
    setShowRecurringOptions(false);
    setEditScope(option);
    setTimeout(() => {
      setShowEditModal(true);
    }, 100);
  };

  const handleEventUpdated = (updatedEvent) => {
    setShowEditModal(false);
    setEditScope(null);
    fetchEvent();
  };

  const handleDeleteClick = () => {
    if (event.is_recurring || event.parent_event_id) {
      setRecurringAction('delete');
      setShowRecurringOptions(true);
    } else {
      handleDeleteRegular();
    }
  };

  const handleDeleteRegular = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      alert('Event deleted successfully');
      navigate('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleRecurringOptionSelect = async (option) => {
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

  const handleDeleteInstance = async () => {
    if (!confirm('Delete only this event instance?')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      alert('Event instance deleted successfully');
      navigate('/events');
    } catch (err) {
      console.error('Error deleting instance:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

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

  const handleDeleteSeries = async () => {
    if (!confirm('Delete this recurring event series?\n\nThis will permanently delete all current and future occurrences. Past occurrences will be preserved.\n\nThis action CANNOT be undone.')) {
      return;
    }
    try {
      const parentId = event.parent_event_id || event.id;
      const now = new Date().toISOString();

      const { error: parentDeleteError } = await supabase.from('events').delete().eq('id', parentId);
      if (parentDeleteError) throw parentDeleteError;

      const { error: futureDeleteError } = await supabase
        .from('events')
        .delete()
        .eq('parent_event_id', parentId)
        .gte('start_time', now);
      if (futureDeleteError) throw futureDeleteError;

      alert('Recurring event series deleted. Past occurrences have been preserved.');
      navigate('/events');
    } catch (err) {
      console.error('Error deleting series:', err);
      alert('Failed to delete series. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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
      <div className="min-h-screen bg-[#0E1523] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-5xl mx-auto px-6">
          <div className="h-8 bg-[#1A2035] rounded-lg animate-pulse w-48" />
          <div className="h-12 bg-[#1A2035] rounded-lg animate-pulse w-2/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-[#1A2035] rounded-xl animate-pulse" />
              <div className="h-40 bg-[#1A2035] rounded-xl animate-pulse" />
              <div className="h-60 bg-[#1A2035] rounded-xl animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-[#1A2035] rounded-xl animate-pulse" />
              <div className="h-32 bg-[#1A2035] rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0E1523] flex items-center justify-center p-4">
        <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-8 max-w-md w-full text-center" role="alert">
          <div className="w-14 h-14 rounded-full bg-[#1E2845] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-[#94A3B8] mb-6">{error || 'This event does not exist or you do not have permission to view it.'}</p>
          <Link
            to="/events"
            className="inline-block px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const counts = getRsvpCounts();
  const isPastEvent = new Date(event.start_time) < new Date();

  return (
    <div className="min-h-screen bg-[#0E1523]">

      {/* Header bar */}
      <div className="bg-[#151B2D] border-b border-[#2A3550]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/events"
              className="flex items-center gap-2 text-[#CBD5E1] hover:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Events
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadICS(event)}
                className="px-3 py-2 bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]"
              >
                Add to Calendar
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]"
              >
                Print
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAttendanceReport(true)}
                    className="px-3 py-2 bg-[#1A2035] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]"
                  >
                    Full Report
                  </button>
                  <button
                    onClick={handleEditClick}
                    className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="px-3 py-2 bg-transparent border border-[#EF4444] text-[#EF4444] text-sm font-semibold rounded-lg hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#151B2D]"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="flex items-start gap-3">
            {event.is_recurring && (
              <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-semibold bg-[#1D3461] text-blue-400">
                Recurring
              </span>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-white">{event.title}</h1>
              {event.is_recurring && (
                <p className="text-sm text-blue-400 mt-1 font-semibold">
                  {event.parent_event_id ? 'Part of recurring series' : 'Recurring event series'}
                </p>
              )}
            </div>
          </div>

          {organization && (
            <p className="text-[#94A3B8] mt-1">{organization.name}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {rsvpSuccess && (
              <div className="bg-[#1B3A2F] border border-green-700 rounded-xl p-4" role="alert">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <p className="text-green-400 font-semibold text-sm">RSVP updated successfully!</p>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
              <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>Date & Time</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Date</p>
                  <p className="text-white font-semibold">{formatDate(event.start_time)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-1">Time</p>
                  <p className="text-white font-semibold">
                    {formatTime(event.start_time)}
                    {event.end_time && ' – ' + formatTime(event.end_time)}
                  </p>
                </div>
                {isPastEvent && (
                  <div className="mt-2 bg-[#1E2845] border border-[#2A3550] rounded-lg p-3">
                    <p className="text-sm text-[#94A3B8]">This event has already occurred.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
              <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>
                {event.is_virtual ? 'Virtual Event' : 'Location'}
              </p>
              {event.is_virtual ? (
                <div>
                  <p className="text-[#CBD5E1] mb-3">This is a virtual event.</p>
                  {event.virtual_link ? (
                    userRsvp === 'going' ? (
                      <a
                        href={event.virtual_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]"
                      >
                        Join Virtual Event
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ) : (
                      <p className="text-sm text-[#64748B]">RSVP "Going" to see the virtual event link.</p>
                    )
                  ) : (
                    <p className="text-sm text-[#64748B]">Virtual event link will be shared closer to the event date.</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-white font-semibold mb-3">{event.location}</p>
                  <a
                    href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(event.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    View on Map →
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>Description</p>
                <p className="text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Capacity */}
            {event.max_attendees && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>Capacity</p>
                <div className="flex items-center justify-between">
                  <p className="text-[#CBD5E1]">
                    <span className="text-2xl font-extrabold text-white">{counts.going}</span>
                    <span className="text-[#94A3B8]"> / {event.max_attendees} spots filled</span>
                  </p>
                  {counts.going >= event.max_attendees && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-red-300">
                      Event Full
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Check-In */}
            <AttendanceCheckIn
              event={event}
              currentUser={currentUser}
              userRole={isAdmin ? 'admin' : 'member'}
              organizationId={event.organization_id}
            />

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* RSVP */}
            {!isPastEvent && currentUser && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>Your RSVP</p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleRsvp('going')}
                    disabled={rsvpLoading}
                    className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp === 'going' ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' : 'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}
                  >
                    Going
                  </button>
                  <button
                    onClick={() => handleRsvp('maybe')}
                    disabled={rsvpLoading}
                    className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp === 'maybe' ? 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}
                  >
                    Maybe
                  </button>
                  <button
                    onClick={() => handleRsvp('not_going')}
                    disabled={rsvpLoading}
                    className={'w-full px-4 py-3 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-all disabled:opacity-50 ' + (userRsvp === 'not_going' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' : 'bg-[#0E1523] border border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845] focus:ring-gray-500')}
                  >
                    Can't Go
                  </button>
                </div>
              </div>
            )}

            {/* Response counts */}
            <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
              <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>Responses</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#CBD5E1] text-sm">Going</span>
                  <span className="font-bold text-green-400">{counts.going}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#CBD5E1] text-sm">Maybe</span>
                  <span className="font-bold text-yellow-400">{counts.maybe}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#CBD5E1] text-sm">Can't Go</span>
                  <span className="font-bold text-red-400">{counts.not_going}</span>
                </div>
              </div>
            </div>

            {/* Going list */}
            {counts.going > 0 && (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6">
                <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>
                  {'Going (' + counts.going + ')'}
                </p>
                <ul className="space-y-2" role="list">
                  {rsvps.filter(r => r.status === 'going').slice(0, 10).map(rsvp => (
                    <li key={rsvp.id} className="flex items-center gap-3" role="listitem">
                      {rsvp.members?.profile_photo_url ? (
                        <img
                          src={rsvp.members.profile_photo_url}
                          alt={rsvp.members.first_name + ' ' + rsvp.members.last_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1D3461] text-blue-400 flex items-center justify-center font-bold text-xs" aria-hidden="true">
                          {rsvp.members?.first_name?.[0]}{rsvp.members?.last_name?.[0]}
                        </div>
                      )}
                      <span className="text-sm text-[#CBD5E1]">
                        {rsvp.members?.first_name} {rsvp.members?.last_name}
                      </span>
                    </li>
                  ))}
                  {counts.going > 10 && (
                    <p className="text-sm text-[#64748B] mt-2">+ {counts.going - 10} more</p>
                  )}
                </ul>
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

    </div>
  );
}

export default EventDetails;