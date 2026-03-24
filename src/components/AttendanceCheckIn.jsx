import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AttendanceCheckIn({ event, currentUser, userRole, organizationId }) {
  var [attendance, setAttendance] = useState([]);
  var [members, setMembers] = useState([]);
  var [isCheckedIn, setIsCheckedIn] = useState(false);
  var [loading, setLoading] = useState(true);
  var [checkingIn, setCheckingIn] = useState(false);
  var [showManualModal, setShowManualModal] = useState(false);
  var [manualMemberId, setManualMemberId] = useState('');
  var [submittingManual, setSubmittingManual] = useState(false);

  var isAdmin = userRole === 'admin';

  useEffect(function() {
    if (!event?.id) return;
    fetchAttendance();
    if (isAdmin) fetchMembers();

    var channel = supabase
      .channel('attendance-' + event.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance_records',
        filter: 'event_id=eq.' + event.id
      }, function() {
        fetchAttendance();
      })
      .subscribe();

    return function() { supabase.removeChannel(channel); };
  }, [event?.id]);

  async function fetchAttendance() {
    var { data, error } = await supabase
      .from('attendance_records')
      .select('*, member:members!attendance_records_member_id_fkey(user_id, full_name, profile_photo_url)')
      .eq('event_id', event.id)
      .order('checked_in_at', { ascending: true });

    if (!error && data) {
      setAttendance(data);
      setIsCheckedIn(data.some(function(r) { return r.member_id === currentUser?.id; }));
    }
    setLoading(false);
  }

  async function fetchMembers() {
    var { data } = await supabase
      .from('memberships')
      .select('member_id, members!memberships_member_id_fkey(user_id, full_name)')
      .eq('organization_id', organizationId)
      .eq('status', 'active');
    if (data) setMembers(data);
  }

  async function handleCheckIn() {
    if (!currentUser?.id) return;
    setCheckingIn(true);
    var { error } = await supabase
      .from('attendance_records')
      .insert({ event_id: event.id, member_id: currentUser.id, checked_in_by: currentUser.id });
    if (error) {
      toast.error('Check-in failed. Please try again.');
    } else {
      toast.success('You are checked in!');
      setIsCheckedIn(true);
    }
    setCheckingIn(false);
  }

  async function handleUndoCheckIn() {
    setCheckingIn(true);
    var { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('event_id', event.id)
      .eq('member_id', currentUser.id);
    if (error) {
      toast.error('Could not undo check-in.');
    } else {
      toast.success('Check-in removed.');
      setIsCheckedIn(false);
    }
    setCheckingIn(false);
  }

  async function handleManualCheckIn() {
    if (!manualMemberId) return;
    setSubmittingManual(true);
    var { error } = await supabase
      .from('attendance_records')
      .insert({ event_id: event.id, member_id: manualMemberId, checked_in_by: currentUser.id });
    if (error) {
      toast.error('Could not check in member. They may already be checked in.');
    } else {
      toast.success('Member checked in.');
      setShowManualModal(false);
      setManualMemberId('');
    }
    setSubmittingManual(false);
  }

  async function handleRemoveAttendee(memberId) {
    var { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('event_id', event.id)
      .eq('member_id', memberId);
    if (error) {
      toast.error('Could not remove attendee.');
    } else {
      toast.success('Attendee removed.');
    }
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  var notCheckedIn = members.filter(function(m) {
    return !attendance.some(function(a) { return a.member_id === m.member_id; });
  });

  return (
    <section
      className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6"
      aria-label="Event attendance"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'4px'}}>
            Attendance
          </p>
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-lg">Check-In</h2>
            {!loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1B3A2F] text-green-400">
                {attendance.length} checked in
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={function() { setShowManualModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E2845] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]"
            aria-label="Manually check in a member"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Manual Check-In
          </button>
        )}
      </div>

      {/* Member self check-in */}
      {!isAdmin && (
        <div className="mb-6 p-4 bg-[#0E1523] rounded-lg border border-[#2A3550]">
          {loading ? (
            <div className="h-10 bg-[#1E2845] rounded-lg animate-pulse" />
          ) : isCheckedIn ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1B3A2F] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-white font-semibold">You're checked in</span>
              </div>
              <button
                onClick={handleUndoCheckIn}
                disabled={checkingIn}
                className="text-sm text-[#94A3B8] hover:text-white underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Undo check-in"
              >
                Undo
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[#CBD5E1] text-sm">Mark yourself as present at this event.</span>
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50"
              >
                {checkingIn ? 'Checking in...' : 'Check In'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attendance list */}
      {loading ? (
        <div className="space-y-3" aria-label="Loading attendance" aria-busy="true">
          {[1,2,3].map(function(i) {
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#0E1523] rounded-lg animate-pulse">
                <div className="w-9 h-9 rounded-full bg-[#1E2845]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#1E2845] rounded w-32" />
                  <div className="h-2 bg-[#1E2845] rounded w-20" />
                </div>
              </div>
            );
          })}
        </div>
      ) : attendance.length === 0 ? (
        <div className="text-center py-10" role="status">
          <div className="w-12 h-12 rounded-full bg-[#1E2845] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="text-white font-semibold mb-1">No one checked in yet</p>
          <p className="text-[#64748B] text-sm">Be the first to check in to this event.</p>
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Checked-in attendees">
          {attendance.map(function(record) {
            var member = record.member;
            var initials = member?.full_name ? member.full_name.split(' ').map(function(n) { return n[0]; }).join('').slice(0,2).toUpperCase() : '?';
            return (
              <li
                key={record.id}
                className="flex items-center gap-3 p-3 bg-[#0E1523] rounded-lg"
                role="listitem"
              >
                {member?.profile_photo_url ? (
                  <img src={member.profile_photo_url} alt={member.full_name + ' profile photo'} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#1D3461] flex items-center justify-center text-blue-400 text-xs font-bold" aria-hidden="true">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{member?.full_name || 'Unknown Member'}</p>
                  <p className="text-[#94A3B8] text-xs">Checked in at {formatTime(record.checked_in_at)}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={function() { handleRemoveAttendee(record.member_id); }}
                    className="p-1.5 text-[#64748B] hover:text-red-400 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={'Remove ' + (member?.full_name || 'member') + ' from attendance'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6"/>
                      <path d="M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Manual check-in modal */}
      {showManualModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Manual member check-in"
        >
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-4">Manual Check-In</h3>
            <p className="text-[#94A3B8] text-sm mb-4">Select a member to check in on their behalf.</p>

            <label htmlFor="manual-member-select" className="block text-sm font-semibold text-[#CBD5E1] mb-2">
              Select Member
            </label>
            <select
              id="manual-member-select"
              value={manualMemberId}
              onChange={function(e) { setManualMemberId(e.target.value); }}
              className="w-full bg-[#0E1523] border border-[#2A3550] text-white rounded-lg px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            >
              <option value="">-- Choose a member --</option>
              {notCheckedIn.map(function(m) {
                return (
                  <option key={m.member_id} value={m.member_id}>
                    {m.members?.full_name || m.member_id}
                  </option>
                );
              })}
            </select>

            <div className="flex gap-3 justify-end">
              <button
                onClick={function() { setShowManualModal(false); setManualMemberId(''); }}
                className="px-4 py-2 bg-transparent border border-[#2A3550] text-[#CBD5E1] font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleManualCheckIn}
                disabled={!manualMemberId || submittingManual}
                className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50"
              >
                {submittingManual ? 'Checking in...' : 'Check In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}