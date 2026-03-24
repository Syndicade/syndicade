import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function AttendanceReport({ event, onClose }) {
  var [rsvps, setRsvps] = useState([]);
  var [attendance, setAttendance] = useState([]);
  var [loading, setLoading] = useState(true);
  var [stats, setStats] = useState({ totalRsvps: 0, attended: 0, noShows: 0, attendanceRate: 0 });

  useEffect(function() {
    if (event) fetchAttendanceData();
  }, [event]);

  async function fetchAttendanceData() {
    try {
      setLoading(true);

      var { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('*, members(user_id, first_name, last_name, email, profile_photo_url)')
        .eq('event_id', event.id)
        .eq('status', 'going');

      if (rsvpError) throw rsvpError;

      var { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*, members(user_id, first_name, last_name, email, profile_photo_url)')
        .eq('event_id', event.id);

      if (attendanceError) throw attendanceError;

      setRsvps(rsvpData || []);
      setAttendance(attendanceData || []);

      var totalRsvps = (rsvpData || []).length;
      var attended = (attendanceData || []).length;
      var noShows = totalRsvps - attended;
      var attendanceRate = totalRsvps > 0 ? ((attended / totalRsvps) * 100).toFixed(1) : 0;
      setStats({ totalRsvps, attended, noShows, attendanceRate });

    } catch (err) {
      console.error('Error fetching attendance data:', err);
      toast.error('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAttended(memberId) {
    var { data: { user } } = await supabase.auth.getUser();
    var { error } = await supabase
      .from('attendance_records')
      .insert([{ event_id: event.id, member_id: memberId, checked_in_by: user.id }]);
    if (error) {
      toast.error('Failed to mark attendance.');
    } else {
      toast.success('Member marked as attended.');
      fetchAttendanceData();
    }
  }

  async function handleRemoveAttendance(memberId) {
    var { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('event_id', event.id)
      .eq('member_id', memberId);
    if (error) {
      toast.error('Failed to remove attendance.');
    } else {
      toast.success('Attendance removed.');
      fetchAttendanceData();
    }
  }

  function exportToCSV() {
    if (rsvps.length === 0) {
      toast.error('No data to export.');
      return;
    }
    var attendedIds = new Set(attendance.map(function(a) { return a.member_id; }));
    var csvData = rsvps.map(function(rsvp) {
      var member = rsvp.members;
      var attended = attendedIds.has(member.user_id);
      var record = attendance.find(function(a) { return a.member_id === member.user_id; });
      return {
        'Name': member.first_name + ' ' + member.last_name,
        'Email': member.email,
        'RSVP Status': 'Going',
        'Attended': attended ? 'Yes' : 'No',
        'Check-in Time': attended ? new Date(record.checked_in_at).toLocaleString() : 'N/A'
      };
    });

    var headers = Object.keys(csvData[0]);
    var csvContent = [
      headers.join(','),
      ...csvData.map(function(row) {
        return headers.map(function(header) {
          var value = row[header] || '';
          return value.includes(',') ? '"' + value.replace(/"/g, '""') + '"' : value;
        }).join(',');
      })
    ].join('\n');

    var blob = new Blob([csvContent], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-' + event.title.replace(/\s+/g, '-') + '-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported.');
  }

  var attendedMemberIds = new Set(attendance.map(function(a) { return a.member_id; }));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Attendance report"
    >
      <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl shadow-xl max-w-4xl w-full my-8">

        {/* Header */}
        <div className="border-b border-[#2A3550] px-6 py-5 flex items-center justify-between">
          <div>
            <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'4px'}}>
              Attendance Report
            </p>
            <h2 className="text-xl font-bold text-white">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close attendance report"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-5 border-b border-[#2A3550]">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(function(i) {
                return <div key={i} className="h-20 bg-[#1E2845] rounded-xl animate-pulse" />;
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-[#1D3461] rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-blue-400">{stats.totalRsvps}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mt-1">RSVPs</p>
                </div>
                <div className="bg-[#1B3A2F] rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-green-400">{stats.attended}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mt-1">Attended</p>
                </div>
                <div className="bg-[#2D1B1B] rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-red-400">{stats.noShows}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mt-1">No-Shows</p>
                </div>
                <div className="bg-[#2D1B4E] rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-purple-400">{stats.attendanceRate}%</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mt-1">Rate</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1E2845] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export CSV
                </button>
              </div>
            </>
          )}
        </div>

        {/* Attendee list */}
        <div className="px-6 py-5 max-h-96 overflow-y-auto">
          <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'16px'}}>
            Attendee List
          </p>

          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading attendees">
              {[1,2,3,4].map(function(i) {
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#0E1523] rounded-lg animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-[#1E2845]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#1E2845] rounded w-36" />
                      <div className="h-2 bg-[#1E2845] rounded w-48" />
                    </div>
                    <div className="h-8 w-24 bg-[#1E2845] rounded-lg" />
                  </div>
                );
              })}
            </div>
          ) : rsvps.length === 0 ? (
            <div className="text-center py-10" role="status">
              <div className="w-12 h-12 rounded-full bg-[#1E2845] flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">No RSVPs yet</p>
              <p className="text-[#64748B] text-sm">No one has RSVPed as Going to this event.</p>
            </div>
          ) : (
            <ul className="space-y-2" role="list" aria-label="RSVP attendees">
              {rsvps.map(function(rsvp) {
                var member = rsvp.members;
                var hasAttended = attendedMemberIds.has(member.user_id);
                return (
                  <li
                    key={rsvp.id}
                    className={'flex items-center justify-between p-3 rounded-lg border ' + (hasAttended ? 'bg-[#1B3A2F] border-green-800' : 'bg-[#0E1523] border-[#2A3550]')}
                    role="listitem"
                  >
                    <div className="flex items-center gap-3">
                      {member.profile_photo_url ? (
                        <img
                          src={member.profile_photo_url}
                          alt={member.first_name + ' ' + member.last_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1D3461] text-blue-400 flex items-center justify-center font-bold text-sm" aria-hidden="true">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white text-sm">{member.first_name} {member.last_name}</p>
                        <p className="text-xs text-[#94A3B8]">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasAttended ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1B3A2F] text-green-400 border border-green-800">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Attended
                          </span>
                          <button
                            onClick={function() { handleRemoveAttendance(member.user_id); }}
                            className="px-3 py-1.5 bg-transparent border border-[#2A3550] text-[#94A3B8] text-xs font-semibold rounded-lg hover:border-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={'Remove attendance for ' + member.first_name + ' ' + member.last_name}
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={function() { handleMarkAttended(member.user_id); }}
                          className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={'Mark ' + member.first_name + ' ' + member.last_name + ' as attended'}
                        >
                          Mark Attended
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2A3550] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-transparent border border-[#2A3550] text-[#CBD5E1] font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceReport;