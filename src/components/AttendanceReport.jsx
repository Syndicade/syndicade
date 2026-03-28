import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function AttendanceReport({ event, onClose }) {
  var [rows, setRows] = useState([]);
  var [checkoutFields, setCheckoutFields] = useState([]);
  var [loading, setLoading] = useState(true);
  var [stats, setStats] = useState({ totalRsvps: 0, attended: 0, noShows: 0, attendanceRate: 0, totalRevenue: 0 });
  var isPaidEvent = event.is_paid;

  useEffect(function() {
    if (event) fetchData();
  }, [event]);

  async function fetchData() {
    try {
      setLoading(true);

      // RSVPs (going)
      var { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('member_id, members(user_id, first_name, last_name, email, phone, profile_photo_url)')
        .eq('event_id', event.id)
        .eq('status', 'going');

      // Attendance records
      var { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('member_id, checked_in_at')
        .eq('event_id', event.id);

      // Ticket purchases
      var purchasesByMember = {};
      if (isPaidEvent) {
        var { data: purchaseData } = await supabase
          .from('ticket_purchases')
          .select('member_id, ticket_type_name, quantity, unit_price, total_amount, stripe_session_id')
          .eq('event_id', event.id);

        if (purchaseData) {
          purchaseData.forEach(function(p) {
            if (!purchasesByMember[p.member_id]) {
              purchasesByMember[p.member_id] = { items: [], totalAmount: 0, sessionId: p.stripe_session_id };
            }
            if (p.stripe_session_id !== purchasesByMember[p.member_id].sessionId) {
              if (p.stripe_session_id > purchasesByMember[p.member_id].sessionId) {
                purchasesByMember[p.member_id] = { items: [], totalAmount: 0, sessionId: p.stripe_session_id };
              }
            }
            if (p.stripe_session_id === purchasesByMember[p.member_id].sessionId) {
              purchasesByMember[p.member_id].items.push(p);
              purchasesByMember[p.member_id].totalAmount += parseFloat(p.total_amount);
            }
          });
        }
      }

      // Checkout fields + responses
      var fields = [];
      var responsesByMember = {};
      if (isPaidEvent) {
        var { data: fieldsData } = await supabase
          .from('event_checkout_fields')
          .select('*')
          .eq('event_id', event.id)
          .order('sort_order');
        fields = fieldsData || [];
        setCheckoutFields(fields);

        var { data: responsesData } = await supabase
          .from('ticket_checkout_responses')
          .select('member_id, responses')
          .eq('event_id', event.id);

        if (responsesData) {
          responsesData.forEach(function(r) {
            // Keep most recent if multiple
            if (!responsesByMember[r.member_id]) {
              responsesByMember[r.member_id] = r.responses || {};
            }
          });
        }
      }

      var attendedIds = new Set((attendanceData || []).map(function(a) { return a.member_id; }));
      var attendanceMap = {};
      (attendanceData || []).forEach(function(a) { attendanceMap[a.member_id] = a; });

      var combined = (rsvpData || []).map(function(rsvp) {
        var m = rsvp.members;
        var memberId = rsvp.member_id;
        var checkedIn = attendedIds.has(memberId);
        var purchases = purchasesByMember[memberId] || null;
        var responses = responsesByMember[memberId] || {};
        return {
          memberId: memberId,
          photo: m?.profile_photo_url || null,
          name: (m?.first_name || '') + ' ' + (m?.last_name || ''),
          email: m?.email || '',
          phone: m?.phone || '',
          checkedIn: checkedIn,
          checkedInAt: checkedIn ? attendanceMap[memberId]?.checked_in_at : null,
          tickets: purchases ? purchases.items : [],
          totalPaid: purchases ? purchases.totalAmount : 0,
          responses: responses,
        };
      });

      setRows(combined);

      var totalRsvps = combined.length;
      var attended = combined.filter(function(r) { return r.checkedIn; }).length;
      var totalRevenue = combined.reduce(function(sum, r) { return sum + r.totalPaid; }, 0);
      setStats({
        totalRsvps: totalRsvps,
        attended: attended,
        noShows: totalRsvps - attended,
        attendanceRate: totalRsvps > 0 ? ((attended / totalRsvps) * 100).toFixed(1) : 0,
        totalRevenue: totalRevenue,
      });

    } catch (err) {
      console.error('AttendanceReport error:', err);
      toast.error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleCheckIn(row) {
    var { data: { user } } = await supabase.auth.getUser();
    if (row.checkedIn) {
      var { error } = await supabase.from('attendance_records').delete()
        .eq('event_id', event.id).eq('member_id', row.memberId);
      if (error) { toast.error('Could not remove attendance.'); return; }
      toast.success('Attendance removed.');
    } else {
      var { error } = await supabase.from('attendance_records')
        .insert([{ event_id: event.id, member_id: row.memberId, checked_in_by: user.id }]);
      if (error) { toast.error('Could not mark attendance.'); return; }
      toast.success('Marked as attended.');
    }
    fetchData();
  }

  function exportToCSV() {
    if (rows.length === 0) { toast.error('No data to export.'); return; }

    var headers = ['Name', 'Email', 'Phone'];
    if (isPaidEvent) {
      headers = headers.concat(['Tickets', 'Amount Paid']);
      checkoutFields.forEach(function(f) { headers.push(f.label); });
    }
    headers = headers.concat(['Check-In Status', 'Check-In Time']);

    var csvRows = rows.map(function(row) {
      var ticketSummary = row.tickets.map(function(t) {
        return t.ticket_type_name + ' x' + t.quantity;
      }).join(' | ');

      var base = [
        '"' + row.name.trim() + '"',
        '"' + row.email + '"',
        '"' + (row.phone || '') + '"',
      ];
      if (isPaidEvent) {
        base.push('"' + ticketSummary + '"');
        base.push('$' + row.totalPaid.toFixed(2));
        checkoutFields.forEach(function(f) {
          var val = row.responses[f.id] || '';
          base.push('"' + String(val).replace(/"/g, '""') + '"');
        });
      }
      base.push(row.checkedIn ? 'Attended' : 'No Show');
      base.push(row.checkedInAt ? '"' + new Date(row.checkedInAt).toLocaleString() + '"' : 'N/A');
      return base.join(',');
    });

    var csvContent = [headers.join(',')].concat(csvRows).join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'report-' + event.title.replace(/\s+/g, '-') + '-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported.');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto"
      role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl shadow-xl w-full max-w-6xl my-8">

        {/* Header */}
        <div className="border-b border-[#2A3550] px-6 py-5 flex items-center justify-between">
          <div>
            <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px',marginBottom:'4px'}}>
              Full Report
            </p>
            <h2 id="report-title" className="text-xl font-bold text-white">{event.title}</h2>
          </div>
          <button onClick={onClose}
            className="p-2 text-[#64748B] hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close report">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-5 border-b border-[#2A3550]">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(function(i){ return <div key={i} className="h-20 bg-[#1E2845] rounded-xl animate-pulse"/>; })}
            </div>
          ) : (
            <div className={'grid gap-4 ' + (isPaidEvent ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4')}>
              <div className="bg-[#1D3461] rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-blue-400">{stats.totalRsvps}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mt-1">{isPaidEvent ? 'Tickets Sold' : 'RSVPs'}</p>
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
              {isPaidEvent && (
                <div className="bg-[#2A1F00] rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-yellow-400">${stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mt-1">Revenue</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'4px'}}>
                Attendee List
              </p>
              {isPaidEvent && checkoutFields.length > 0 && (
                <p className="text-[#64748B] text-xs mt-1">Scroll right to see checkout form responses.</p>
              )}
            </div>
            <button onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E2845] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(function(i){
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#0E1523] rounded-lg animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-[#1E2845]"/>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#1E2845] rounded w-36"/>
                      <div className="h-2 bg-[#1E2845] rounded w-48"/>
                    </div>
                    <div className="h-8 w-24 bg-[#1E2845] rounded-lg"/>
                  </div>
                );
              })}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12" role="status">
              <div className="w-12 h-12 rounded-full bg-[#1E2845] flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">No attendees yet</p>
              <p className="text-[#64748B] text-sm">No one has RSVPed as Going to this event.</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] rounded-lg border border-[#2A3550]">
              <table className="w-full text-sm whitespace-nowrap" role="table">
                <thead className="sticky top-0 bg-[#1E2845] z-10">
                  <tr>
                    <th className="text-left px-4 py-3 text-[#64748B] text-xs font-semibold uppercase tracking-wide">Attendee</th>
                    <th className="text-left px-4 py-3 text-[#64748B] text-xs font-semibold uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-[#64748B] text-xs font-semibold uppercase tracking-wide">Phone</th>
                    {isPaidEvent && <th className="text-left px-4 py-3 text-[#64748B] text-xs font-semibold uppercase tracking-wide">Tickets</th>}
                    {isPaidEvent && <th className="text-right px-4 py-3 text-[#64748B] text-xs font-semibold uppercase tracking-wide">Paid</th>}
                    {/* Dynamic checkout field columns */}
                    {isPaidEvent && checkoutFields.map(function(f) {
                      return (
                        <th key={f.id} className="text-left px-4 py-3 text-[#64748B] text-xs font-semibold uppercase tracking-wide">
                          {f.label}
                        </th>
                      );
                    })}
                    <th className="text-left px-4 py-3 text-[#64748B] text-xs font-semibold uppercase tracking-wide">Check-In</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A3550]">
                  {rows.map(function(row) {
                    var initials = row.name.trim().split(' ').map(function(n){ return n[0]; }).join('').slice(0,2).toUpperCase();
                    return (
                      <tr key={row.memberId} className={'transition-colors ' + (row.checkedIn ? 'bg-[#0E1F16]' : 'bg-transparent hover:bg-[#1E2845]')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {row.photo ? (
                              <img src={row.photo} alt={row.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#1D3461] text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0" aria-hidden="true">
                                {initials}
                              </div>
                            )}
                            <span className="text-white font-semibold">{row.name.trim() || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#CBD5E1]">{row.email || '—'}</td>
                        <td className="px-4 py-3 text-[#CBD5E1]">{row.phone || '—'}</td>
                        {isPaidEvent && (
                          <td className="px-4 py-3">
                            {row.tickets.length > 0 ? (
                              <div className="space-y-0.5">
                                {row.tickets.map(function(t, i) {
                                  return (
                                    <p key={i} className="text-[#CBD5E1] text-xs">
                                      {t.ticket_type_name} <span className="text-[#64748B]">×{t.quantity}</span>
                                    </p>
                                  );
                                })}
                              </div>
                            ) : <span className="text-[#64748B]">—</span>}
                          </td>
                        )}
                        {isPaidEvent && (
                          <td className="px-4 py-3 text-right">
                            {row.totalPaid > 0
                              ? <span className="text-[#F5B731] font-bold">${row.totalPaid.toFixed(2)}</span>
                              : <span className="text-[#64748B]">—</span>}
                          </td>
                        )}
                        {/* Dynamic checkout field values */}
                        {isPaidEvent && checkoutFields.map(function(f) {
                          var val = row.responses[f.id];
                          return (
                            <td key={f.id} className="px-4 py-3 text-[#CBD5E1] max-w-[180px]">
                              {val ? (
                                <span className="block truncate" title={String(val)}>{String(val)}</span>
                              ) : (
                                <span className="text-[#64748B]">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3">
                          {row.checkedIn ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1B3A2F] text-green-400 border border-green-800">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                                Attended
                              </span>
                              {row.checkedInAt && (
                                <p className="text-[#64748B] text-xs mt-0.5">
                                  {new Date(row.checkedInAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1E2845] text-[#64748B] border border-[#2A3550]">
                              No Show
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.checkedIn ? (
                            <button onClick={function() { handleToggleCheckIn(row); }}
                              className="px-2.5 py-1 text-xs font-semibold text-[#94A3B8] border border-[#2A3550] rounded-lg hover:border-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                              aria-label={'Remove attendance for ' + row.name}>
                              Remove
                            </button>
                          ) : (
                            <button onClick={function() { handleToggleCheckIn(row); }}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label={'Mark ' + row.name + ' as attended'}>
                              Mark Attended
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2A3550] px-6 py-4 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 bg-transparent border border-[#2A3550] text-[#CBD5E1] font-semibold rounded-lg hover:bg-[#1E2845] focus:outline-none focus:ring-2 focus:ring-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceReport;