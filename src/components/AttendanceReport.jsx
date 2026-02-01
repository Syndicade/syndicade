import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function AttendanceReport({ event, onClose }) {
  const [rsvps, setRsvps] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRsvps: 0,
    attended: 0,
    noShows: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    if (event) {
      fetchAttendanceData();
    }
  }, [event]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Fetch RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          members (
            user_id,
            first_name,
            last_name,
            email,
            profile_photo_url
          )
        `)
        .eq('event_id', event.id)
        .eq('status', 'going');

      if (rsvpError) throw rsvpError;

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          members (
            user_id,
            first_name,
            last_name,
            email,
            profile_photo_url
          )
        `)
        .eq('event_id', event.id);

      if (attendanceError) throw attendanceError;

      setRsvps(rsvpData || []);
      setAttendance(attendanceData || []);

      // Calculate stats
      const totalRsvps = (rsvpData || []).length;
      const attended = (attendanceData || []).length;
      const noShows = totalRsvps - attended;
      const attendanceRate = totalRsvps > 0 ? ((attended / totalRsvps) * 100).toFixed(1) : 0;

      setStats({
        totalRsvps,
        attended,
        noShows,
        attendanceRate
      });

    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttended = async (memberId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('attendance_records')
        .insert([{
          event_id: event.id,
          member_id: memberId,
          checked_in_by: user.id
        }]);

      if (error) throw error;

      // Refresh data
      await fetchAttendanceData();
    } catch (err) {
      console.error('Error marking attendance:', err);
      alert('Failed to mark attendance. Please try again.');
    }
  };

  const handleRemoveAttendance = async (memberId) => {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('event_id', event.id)
        .eq('member_id', memberId);

      if (error) throw error;

      // Refresh data
      await fetchAttendanceData();
    } catch (err) {
      console.error('Error removing attendance:', err);
      alert('Failed to remove attendance. Please try again.');
    }
  };

  const exportToCSV = () => {
    const csvData = rsvps.map(rsvp => {
      const member = rsvp.members;
      const attended = attendance.some(a => a.member_id === member.user_id);
      const attendanceRecord = attendance.find(a => a.member_id === member.user_id);

      return {
        'Name': `${member.first_name} ${member.last_name}`,
        'Email': member.email,
        'RSVP Status': 'Going',
        'Attended': attended ? 'Yes' : 'No',
        'Check-in Time': attended ? new Date(attendanceRecord.checked_in_at).toLocaleString() : 'N/A'
      };
    });

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${event.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  const attendedMemberIds = new Set(attendance.map(a => a.member_id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 Attendance Report</h2>
              <p className="text-gray-600 mt-1">{event.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total RSVPs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalRsvps}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Attended</p>
              <p className="text-2xl font-bold text-green-600">{stats.attended}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">No-Shows</p>
              <p className="text-2xl font-bold text-red-600">{stats.noShows}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</p>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Attendance List */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Attendee List</h3>
          
          {rsvps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No RSVPs for this event yet.
            </div>
          ) : (
            <div className="space-y-2">
              {rsvps.map(rsvp => {
                const member = rsvp.members;
                const hasAttended = attendedMemberIds.has(member.user_id);

                return (
                  <div 
                    key={rsvp.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      hasAttended 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {member.profile_photo_url ? (
                        <img 
                          src={member.profile_photo_url} 
                          alt={`${member.first_name} ${member.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                      )}
                      
                      <div>
                        <p className="font-semibold text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasAttended ? (
                        <>
                          <span className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-full">
                            ✓ Attended
                          </span>
                          <button
                            onClick={() => handleRemoveAttendance(member.user_id)}
                            className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleMarkAttended(member.user_id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Mark Attended
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceReport;