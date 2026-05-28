import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// ─── Constants ────────────────────────────────────────────────────────────────

var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColor(name) {
  var char = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[char % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name || !name.trim()) return '?';
  var parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function heatmapBg(count, max) {
  if (max === 0 || count === 0) return '#F1F5F9';
  var ratio = count / max;
  if (ratio >= 0.75) return '#1D4ED8';
  if (ratio >= 0.5)  return '#3B82F6';
  if (ratio >= 0.25) return '#93C5FD';
  return '#DBEAFE';
}

function heatmapText(count, max) {
  if (max === 0 || count === 0) return '#94A3B8';
  var ratio = count / max;
  return ratio >= 0.5 ? '#FFFFFF' : '#1E3A8A';
}

function getDeadlineInfo(deadline, status) {
  if (!deadline || status !== 'open') return null;
  var now = new Date();
  var dl = new Date(deadline);
  var msLeft = dl.getTime() - now.getTime();
  var daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Deadline passed', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
  if (daysLeft === 0) return { label: 'Closes today', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
  if (daysLeft === 1) return { label: 'Closes tomorrow', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' };
  if (daysLeft <= 3) return { label: 'Closes in ' + daysLeft + ' days', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' };
  return {
    label: 'Closes ' + dl.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    color: '#475569', bg: '#F8FAFC', border: '#E2E8F0'
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PollSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6" aria-hidden="true">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-5 w-48 bg-slate-100 rounded animate-pulse mb-2" />
          <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
      </div>
      <div className="h-3 w-56 bg-slate-100 rounded animate-pulse mb-4" />
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
        {Array.from({ length: 40 }).map(function(_, i) {
          return (
            <div
              key={i}
              className="h-7 rounded animate-pulse"
              style={{ background: '#F1F5F9', animationDelay: (i * 20) + 'ms' }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Best Times Banner ────────────────────────────────────────────────────────

function BestTimesBanner({ slots }) {
  var topSlots = slots
    .map(function(s) {
      return {
        slot: s,
        count: (s.scheduling_responses || []).filter(function(r) { return r.availability === 'yes'; }).length
      };
    })
    .filter(function(x) { return x.count > 0; })
    .sort(function(a, b) { return b.count - a.count; })
    .slice(0, 3);

  if (topSlots.length === 0) return null;

  return (
    <div
      className="border rounded-lg p-3 mb-4"
      style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
      role="region"
      aria-label="Best available times"
    >
      <p className="text-xs font-bold uppercase mb-2" style={{ color: '#92400E', letterSpacing: '3px' }}>
        Best Times
      </p>
      <div className="flex flex-wrap gap-2">
        {topSlots.map(function(x, idx) {
          var dateStr = x.slot.start_time.slice(0, 10);
          var medal = ['#F5B731', '#94A3B8', '#CD7C2F'][idx];
          return (
            <div
              key={x.slot.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{ background: '#FFFFFF', borderColor: '#FDE68A' }}
            >
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
                style={{ background: medal, color: idx === 0 ? '#111827' : '#FFFFFF', fontSize: '9px' }}
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <span className="text-xs font-semibold" style={{ color: '#0E1523' }}>
                {formatDate(dateStr)}
              </span>
              <span className="text-xs" style={{ color: '#475569' }}>
                {formatTime(x.slot.start_time)}
              </span>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#DBEAFE', color: '#1E3A8A' }}
              >
                {x.count} {x.count === 1 ? 'person' : 'people'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Respondent Tracker ───────────────────────────────────────────────────────

function RespondentTracker({ slots, orgMembers }) {
  if (!orgMembers || orgMembers.length === 0) return null;

  var respondedIds = new Set(
    slots.flatMap(function(s) {
      return (s.scheduling_responses || []).map(function(r) { return r.member_id; });
    })
  );

  var responded = orgMembers.filter(function(m) { return respondedIds.has(m.member_id); });
  var pending   = orgMembers.filter(function(m) { return !respondedIds.has(m.member_id); });
  var SHOW_MAX = 10;

  function AvatarPill(m, hasResponded) {
    var name = m.display_name || ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || 'Member';
    var initials = getInitials(name);
    var bg = hasResponded ? getAvatarColor(name) : '#E2E8F0';
    var textColor = hasResponded ? '#FFFFFF' : '#94A3B8';
    var ring = hasResponded ? '2px solid #22C55E' : '2px solid transparent';

    return (
      <div
        key={m.member_id}
        title={name + (hasResponded ? ' — responded' : ' — pending')}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0"
        style={{ background: bg, color: textColor, border: ring }}
        aria-label={name + (hasResponded ? ', responded' : ', has not responded')}
      >
        {initials}
      </div>
    );
  }

  var allSorted = responded.concat(pending);
  var visible = allSorted.slice(0, SHOW_MAX);
  var overflow = allSorted.length - SHOW_MAX;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E2E8F0' }} role="region" aria-label="Respondent tracker">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold" style={{ color: '#475569' }}>
          Responses
        </p>
        <span className="text-xs" style={{ color: '#64748B' }}>
          <span style={{ color: '#22C55E', fontWeight: 700 }}>{responded.length}</span>
          {' of ' + orgMembers.length + ' responded'}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {visible.map(function(m) {
          var hasResponded = respondedIds.has(m.member_id);
          return AvatarPill(m, hasResponded);
        })}
        {overflow > 0 && (
          <div
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0"
            style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}
            aria-label={overflow + ' more members'}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchedulingPolls() {
  var { organizationId } = useParams();
  var { isAdmin } = useOutletContext();
  var navigate = useNavigate();
  var [polls, setPolls] = useState([]);
  var [orgMembers, setOrgMembers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [currentUser, setCurrentUser] = useState(null);
  var [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(function() {
    initPage();
  }, [organizationId]);

  async function initPage() {
    setLoading(true);
    var authResult = await supabase.auth.getUser();
    var user = authResult.data.user;
    if (authResult.error || !user) {
      toast.error('Not authenticated');
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    await Promise.all([fetchPolls(), fetchOrgMembers()]);
    setLoading(false);
  }

  async function fetchOrgMembers() {
    var { data } = await supabase
      .from('memberships')
      .select('member_id, members(display_name, first_name, last_name)')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (data) {
      setOrgMembers(data.map(function(m) {
        return {
          member_id: m.member_id,
          display_name: (m.members && m.members.display_name) || null,
          first_name:   (m.members && m.members.first_name)   || '',
          last_name:    (m.members && m.members.last_name)    || '',
        };
      }));
    }
  }

  async function fetchPolls() {
    var pollsResult = await supabase
      .from('scheduling_polls')
      .select('id, title, description, status, finalized_slot_id, deadline, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (pollsResult.error) {
      mascotErrorToast('Failed to load scheduling polls.');
      return;
    }

    var pollsData = pollsResult.data || [];
    if (pollsData.length === 0) { setPolls([]); return; }

    var pollIds = pollsData.map(function(p) { return p.id; });

    var slotsResult = await supabase
      .from('scheduling_slots')
      .select('id, poll_id, start_time, end_time')
      .in('poll_id', pollIds);

    if (slotsResult.error) { mascotErrorToast('Failed to load time slots.'); return; }

    var slotsData = slotsResult.data || [];
    var slotIds = slotsData.map(function(s) { return s.id; });
    var responsesData = [];

    if (slotIds.length > 0) {
      var rResult = await supabase
        .from('scheduling_responses')
        .select('id, slot_id, member_id, availability')
        .in('slot_id', slotIds);
      if (!rResult.error) responsesData = rResult.data || [];
    }

    var assembled = pollsData.map(function(poll) {
      return Object.assign({}, poll, {
        scheduling_slots: slotsData
          .filter(function(s) { return s.poll_id === poll.id; })
          .map(function(slot) {
            return Object.assign({}, slot, {
              scheduling_responses: responsesData.filter(function(r) { return r.slot_id === slot.id; })
            });
          })
      });
    });

    setPolls(assembled);
  }

  async function deletePoll(pollId) {
    if (!window.confirm('Delete this scheduling poll? This cannot be undone.')) return;
    var result = await supabase.from('scheduling_polls').delete().eq('id', pollId);
    if (result.error) {
      mascotErrorToast('Failed to delete poll.');
    } else {
      mascotSuccessToast('Poll deleted.');
      fetchPolls();
    }
  }

  async function closePoll(pollId, pollTitle) {
    if (!window.confirm('Close "' + pollTitle + '"? Members will no longer be able to update their availability.')) return;
    var result = await supabase.from('scheduling_polls').update({ status: 'closed' }).eq('id', pollId);
    if (result.error) {
      mascotErrorToast('Failed to close poll.');
    } else {
      mascotSuccessToast('Poll closed.', '"' + pollTitle + '" is now closed.');
      fetchPolls();
    }
  }

  // Subtitle
  var openCount      = polls.filter(function(p) { return p.status === 'open'; }).length;
  var finalizedCount = polls.filter(function(p) { return p.status === 'finalized'; }).length;
  var closedCount    = polls.filter(function(p) { return p.status === 'closed'; }).length;
  var subtitleParts  = [];
  if (!loading) {
    if (openCount > 0)      subtitleParts.push(openCount + ' open');
    if (finalizedCount > 0) subtitleParts.push(finalizedCount + ' finalized');
    if (closedCount > 0)    subtitleParts.push(closedCount + ' closed');
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
      <div className="px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0E1523', margin: 0 }}>
              Group Scheduling
            </h1>
            {subtitleParts.length > 0 && (
              <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
                {subtitleParts.join(' · ')}
              </p>
            )}
          </div>
          {isAdmin && !showCreateForm && (
            <button
              onClick={function() { setShowCreateForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ background: '#3B82F6', color: '#FFFFFF' }}
              aria-label="Create new scheduling poll"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Poll
            </button>
          )}
        </div>

        {/* ── Create Form ── */}
        {showCreateForm && (
          <CreatePollForm
            organizationId={organizationId}
            currentUser={currentUser}
            onCreated={function() { setShowCreateForm(false); fetchPolls(); }}
            onCancel={function() { setShowCreateForm(false); }}
          />
        )}

        {/* ── Legend ── */}
        {polls.length > 0 && (
          <div className="flex items-center gap-4 mb-5" aria-label="Heatmap legend">
            <span className="text-xs font-bold uppercase" style={{ color: '#F5B731', letterSpacing: '4px' }}>
              Availability
            </span>
            {[
              { bg: '#F1F5F9', label: 'None' },
              { bg: '#DBEAFE', label: 'Low' },
              { bg: '#93C5FD', label: 'Some' },
              { bg: '#3B82F6', label: 'Most' },
              { bg: '#1D4ED8', label: 'All' },
            ].map(function(item) {
              return (
                <span key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                  <span className="inline-block w-4 h-4 rounded" style={{ background: item.bg, border: '1px solid #E2E8F0' }} aria-hidden="true" />
                  {item.label}
                </span>
              );
            })}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="space-y-6" aria-label="Loading polls" aria-busy="true">
            <PollSkeleton />
            <PollSkeleton />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && polls.length === 0 && !showCreateForm && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl" role="region" aria-label="No scheduling polls">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-base font-semibold mb-1" style={{ color: '#0E1523' }}>No scheduling polls yet</h2>
            <p className="text-sm mb-5" style={{ color: '#64748B' }}>
              {isAdmin
                ? 'Create a poll so your group can vote on the best meeting time.'
                : 'No scheduling polls have been created yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={function() { setShowCreateForm(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{ background: '#3B82F6', color: '#FFFFFF' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create First Poll
              </button>
            )}
          </div>
        )}

        {/* ── Poll cards ── */}
        {!loading && polls.length > 0 && (
          <div className="space-y-6">
            {polls.map(function(poll) {
              return (
                <HeatmapPollCard
                  key={poll.id}
                  poll={poll}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  orgMembers={orgMembers}
                  organizationId={organizationId}
                  onDelete={function() { deletePoll(poll.id); }}
                  onClose={function() { closePoll(poll.id, poll.title); }}
                  onUpdated={fetchPolls}
                  navigate={navigate}
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Create Poll Form ─────────────────────────────────────────────────────────

function CreatePollForm({ organizationId, currentUser, onCreated, onCancel }) {
  var [title, setTitle]           = useState('');
  var [description, setDescription] = useState('');
  var [startDate, setStartDate]   = useState('');
  var [endDate, setEndDate]       = useState('');
  var [startHour, setStartHour]   = useState('09');
  var [endHour, setEndHour]       = useState('17');
  var [deadline, setDeadline]     = useState('');
  var [notifyMembers, setNotifyMembers] = useState(true);
  var [saving, setSaving]         = useState(false);
  var [formError, setFormError]   = useState(null);
  var [preview, setPreview]       = useState([]);

  var hours = Array.from({ length: 24 }, function(_, i) { return String(i).padStart(2, '0'); });

  function hourLabel(h) {
    var n = parseInt(h);
    if (n === 0) return '12:00 AM';
    if (n < 12) return n + ':00 AM';
    if (n === 12) return '12:00 PM';
    return (n - 12) + ':00 PM';
  }

  function generateSlots(sDate, eDate, sHour, eHour) {
    if (!sDate || !eDate || !sHour || !eHour) return [];
    var slots = [];
    var start = new Date(sDate + 'T00:00:00');
    var end   = new Date(eDate + 'T00:00:00');
    if (end < start) return [];
    var diffDays = Math.round((end - start) / 86400000);
    if (diffDays > 13) return [];
    for (var d = 0; d <= diffDays; d++) {
      var day = new Date(start);
      day.setDate(day.getDate() + d);
      var dateStr = day.toISOString().split('T')[0];
      for (var hh = parseInt(sHour); hh < parseInt(eHour); hh++) {
        slots.push({
          date: dateStr,
          hour: hh,
          start_time: dateStr + 'T' + String(hh).padStart(2, '0') + ':00:00',
          end_time:   dateStr + 'T' + String(hh + 1).padStart(2, '0') + ':00:00',
        });
      }
    }
    return slots;
  }

  useEffect(function() {
    setPreview(generateSlots(startDate, endDate, startHour, endHour));
  }, [startDate, endDate, startHour, endHour]);

  var todayStr = new Date().toISOString().slice(0, 16);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim())                          { setFormError('Title is required.'); return; }
    if (!startDate || !endDate)                 { setFormError('Select a date range.'); return; }
    if (parseInt(startHour) >= parseInt(endHour)) { setFormError('End hour must be after start hour.'); return; }
    if (preview.length === 0)                   { setFormError('No time slots generated. Check your date range (max 14 days).'); return; }

    setSaving(true);
    try {
      var pollResult = await supabase
        .from('scheduling_polls')
        .insert([{
          organization_id: organizationId,
          created_by: currentUser.id,
          title: title.trim(),
          description: description.trim() || null,
          status: 'open',
          deadline: deadline ? new Date(deadline).toISOString() : null,
        }])
        .select()
        .single();

      if (pollResult.error) throw pollResult.error;

      var slotRows = preview.map(function(s) {
        return { poll_id: pollResult.data.id, start_time: s.start_time, end_time: s.end_time };
      });
      var slotsResult = await supabase.from('scheduling_slots').insert(slotRows);
      if (slotsResult.error) throw slotsResult.error;

      // Notify members
      if (notifyMembers) {
        var { data: memberRows } = await supabase
          .from('memberships')
          .select('member_id')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .neq('member_id', currentUser.id);

        if (memberRows && memberRows.length > 0) {
          await supabase.from('notifications').insert(
            memberRows.map(function(m) {
              return {
                user_id: m.member_id,
                organization_id: organizationId,
                type: 'announcement',
                title: 'New scheduling poll',
                message: title.trim(),
                read: false,
              };
            })
          );
        }
      }

      mascotSuccessToast('Poll created!', 'Members can now mark their availability.');
      onCreated();
    } catch (err) {
      mascotErrorToast('Failed to create poll.', err.message || 'Please try again.');
      setFormError('Failed to create poll: ' + (err.message || 'Unknown error.'));
    } finally {
      setSaving(false);
    }
  }

  var uniqueDates = Array.from(new Set(preview.map(function(s) { return s.date; })));

  return (
    <div
      className="bg-white border rounded-xl p-6 mb-6"
      style={{ borderColor: '#BFDBFE', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      role="region"
      aria-label="Create scheduling poll"
    >
      <h2 className="text-base font-bold mb-1" style={{ color: '#0E1523' }}>
        Create Scheduling Poll
      </h2>
      <p className="text-sm mb-5" style={{ color: '#64748B' }}>
        Members will click the grid to mark when they are free.
      </p>

      {formError && (
        <div className="border rounded-lg p-3 mb-4" style={{ background: '#FEF2F2', borderColor: '#FECACA' }} role="alert">
          <p className="text-sm" style={{ color: '#B91C1C' }}>{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          <div className="sm:col-span-2">
            <label htmlFor="poll-title" className="block text-sm font-semibold mb-1" style={{ color: '#0E1523' }}>
              Poll Title <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id="poll-title"
              type="text"
              required
              value={title}
              onChange={function(e) { setTitle(e.target.value); }}
              placeholder="e.g. Monthly Board Meeting — June"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E2E8F0', color: '#0E1523', fontSize: '15px' }}
              maxLength={150}
              aria-required="true"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="poll-description" className="block text-sm font-semibold mb-1" style={{ color: '#0E1523' }}>
              Description <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="poll-description"
              value={description}
              onChange={function(e) { setDescription(e.target.value); }}
              placeholder="Add any notes for members..."
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ borderColor: '#E2E8F0', color: '#0E1523', fontSize: '15px' }}
              maxLength={500}
            />
          </div>
        </div>

        {/* Date range */}
        <fieldset className="border rounded-lg p-4 mb-4" style={{ borderColor: '#E2E8F0' }}>
          <legend className="text-sm font-semibold px-1" style={{ color: '#0E1523' }}>
            Date Range <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-xs mb-1" style={{ color: '#475569' }}>From</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={function(e) { setStartDate(e.target.value); }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E2E8F0', color: '#0E1523' }}
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs mb-1" style={{ color: '#475569' }}>
                To <span style={{ color: '#94A3B8' }}>(max 14 days)</span>
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={function(e) { setEndDate(e.target.value); }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E2E8F0', color: '#0E1523' }}
                aria-required="true"
              />
            </div>
          </div>
        </fieldset>

        {/* Time window */}
        <fieldset className="border rounded-lg p-4 mb-4" style={{ borderColor: '#E2E8F0' }}>
          <legend className="text-sm font-semibold px-1" style={{ color: '#0E1523' }}>
            Time Window <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-hour" className="block text-xs mb-1" style={{ color: '#475569' }}>From hour</label>
              <select
                id="start-hour"
                value={startHour}
                onChange={function(e) { setStartHour(e.target.value); }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E2E8F0', color: '#0E1523' }}
              >
                {hours.map(function(h) { return <option key={h} value={h}>{hourLabel(h)}</option>; })}
              </select>
            </div>
            <div>
              <label htmlFor="end-hour" className="block text-xs mb-1" style={{ color: '#475569' }}>To hour</label>
              <select
                id="end-hour"
                value={endHour}
                onChange={function(e) { setEndHour(e.target.value); }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#E2E8F0', color: '#0E1523' }}
              >
                {hours.map(function(h) { return <option key={h} value={h}>{hourLabel(h)}</option>; })}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Deadline */}
        <div className="mb-4">
          <label htmlFor="poll-deadline" className="block text-sm font-semibold mb-1" style={{ color: '#0E1523' }}>
            Voting Deadline <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="poll-deadline"
            type="datetime-local"
            value={deadline}
            min={todayStr}
            onChange={function(e) { setDeadline(e.target.value); }}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: '#E2E8F0', color: '#0E1523', maxWidth: '280px' }}
          />
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            Poll will show a countdown and auto-close at this date/time.
          </p>
        </div>

        {/* Notify members toggle */}
        <div className="flex items-center gap-3 mb-4 p-3 border rounded-lg" style={{ borderColor: '#E2E8F0', background: '#F8FAFC' }}>
          <input
            id="notify-members"
            type="checkbox"
            checked={notifyMembers}
            onChange={function(e) { setNotifyMembers(e.target.checked); }}
            className="w-4 h-4 rounded focus:ring-2 focus:ring-blue-500"
            style={{ accentColor: '#3B82F6' }}
          />
          <label htmlFor="notify-members" className="text-sm font-medium cursor-pointer" style={{ color: '#0E1523' }}>
            Notify members when poll is created
          </label>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div
            className="border rounded-lg p-3 mb-4"
            style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium" style={{ color: '#1D4ED8' }}>
              This will create <strong>{preview.length} time slots</strong> across <strong>{uniqueDates.length} day{uniqueDates.length !== 1 ? 's' : ''}</strong>.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={saving || !title.trim() || preview.length === 0}
            className="px-5 py-2.5 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#3B82F6', color: '#FFFFFF' }}
          >
            {saving ? 'Creating...' : 'Create Poll'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ background: '#FFFFFF', borderColor: '#E2E8F0', color: '#475569' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Heatmap Poll Card ────────────────────────────────────────────────────────

function HeatmapPollCard({ poll, currentUser, isAdmin, orgMembers, organizationId, onDelete, onClose, onUpdated, navigate }) {
  var [saving, setSaving]               = useState(false);
  var [isDragging, setIsDragging]       = useState(false);
  var [dragValue, setDragValue]         = useState(null);
  var [finalizeTarget, setFinalizeTarget] = useState(null);

  var slots       = poll.scheduling_slots || [];
  var uniqueDates = Array.from(new Set(slots.map(function(s) { return s.start_time.slice(0, 10); }))).sort();
  var uniqueHours = Array.from(new Set(slots.map(function(s) { return parseInt(s.start_time.slice(11, 13)); }))).sort(function(a, b) { return a - b; });

  var slotMap = {};
  slots.forEach(function(slot) {
    var date = slot.start_time.slice(0, 10);
    var hour = parseInt(slot.start_time.slice(11, 13));
    slotMap[date + '|' + hour] = slot;
  });

  var myAvailability = {};
  slots.forEach(function(slot) {
    var mine = (slot.scheduling_responses || []).find(function(r) { return r.member_id === currentUser.id; });
    if (mine) myAvailability[slot.id] = mine.availability === 'yes';
  });

  var maxCount = Math.max.apply(null, slots.map(function(s) {
    return (s.scheduling_responses || []).filter(function(r) { return r.availability === 'yes'; }).length;
  }).concat([1]));

  var totalResponders = new Set(
    slots.flatMap(function(s) { return (s.scheduling_responses || []).map(function(r) { return r.member_id; }); })
  ).size;

  var deadlineInfo = getDeadlineInfo(poll.deadline, poll.status);

  var finalSlot = poll.finalized_slot_id
    ? slots.find(function(s) { return s.id === poll.finalized_slot_id; })
    : null;

  async function toggleSlot(slot, forceValue) {
    if (poll.status !== 'open') return;
    var newVal = forceValue !== undefined ? forceValue : !myAvailability[slot.id];
    setSaving(true);
    var result = await supabase
      .from('scheduling_responses')
      .upsert(
        [{ slot_id: slot.id, member_id: currentUser.id, availability: newVal ? 'yes' : 'no' }],
        { onConflict: 'slot_id,member_id' }
      );
    if (result.error) {
      toast.error('Could not save — try again.');
    } else {
      onUpdated();
    }
    setSaving(false);
  }

  async function finalizeSlot(slot) {
    var result = await supabase
      .from('scheduling_polls')
      .update({ finalized_slot_id: slot.id, status: 'finalized' })
      .eq('id', poll.id);
    if (result.error) {
      mascotErrorToast('Failed to finalize time slot.');
    } else {
      mascotSuccessToast('Meeting scheduled!', formatDate(slot.start_time.slice(0, 10)) + ' at ' + formatTime(slot.start_time));
      onUpdated();
    }
    setFinalizeTarget(null);
  }

  function handleMouseDown(slot) {
    if (poll.status !== 'open' || saving) return;
    var newVal = !myAvailability[slot.id];
    setIsDragging(true);
    setDragValue(newVal);
    toggleSlot(slot, newVal);
  }

  function handleMouseEnter(slot) {
    if (!isDragging || poll.status !== 'open' || saving) return;
    toggleSlot(slot, dragValue);
  }

  function handleMouseUp() {
    setIsDragging(false);
    setDragValue(null);
  }

  function handleCreateEvent() {
    if (!finalSlot) return;
    var date  = finalSlot.start_time.slice(0, 10);
    var time  = finalSlot.start_time.slice(11, 16);
    navigate('/organizations/' + organizationId + '/events/create?date=' + date + '&start_time=' + encodeURIComponent(time) + '&title=' + encodeURIComponent(poll.title));
  }

  var statusStyle = {
    open:      { background: '#DCFCE7', color: '#15803D' },
    closed:    { background: '#F1F5F9', color: '#475569' },
    finalized: { background: '#DBEAFE', color: '#1D4ED8' },
  };

  return (
    <article
      className="bg-white border rounded-xl p-6"
      style={{ borderColor: '#E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      aria-labelledby={'poll-title-' + poll.id}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ── Poll header ── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 id={'poll-title-' + poll.id} className="text-base font-bold" style={{ color: '#0E1523' }}>
              {poll.title}
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={statusStyle[poll.status] || statusStyle.closed}
            >
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
            {deadlineInfo && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border"
                style={{ background: deadlineInfo.bg, color: deadlineInfo.color, borderColor: deadlineInfo.border }}
              >
                {deadlineInfo.label}
              </span>
            )}
          </div>
          {poll.description && (
            <p className="text-sm" style={{ color: '#475569' }}>{poll.description}</p>
          )}
          {totalResponders > 0 && (
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
              {totalResponders} member{totalResponders !== 1 ? 's' : ''} responded
            </p>
          )}
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {poll.status === 'open' && (
              <button
                onClick={onClose}
                className="text-xs px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                style={{ borderColor: '#E2E8F0', color: '#475569', background: '#FFFFFF' }}
                aria-label={'Close poll: ' + poll.title}
              >
                Close
              </button>
            )}
            <button
              onClick={onDelete}
              className="text-xs px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
              style={{ borderColor: '#FECACA', color: '#EF4444', background: '#FFFFFF' }}
              aria-label={'Delete poll: ' + poll.title}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* ── Finalized banner ── */}
      {poll.status === 'finalized' && finalSlot && (
        <div
          className="border rounded-lg p-3 mb-4"
          style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}
          role="status"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1E3A8A' }}>Meeting Scheduled</p>
                <p className="text-sm" style={{ color: '#1D4ED8' }}>
                  {formatDate(finalSlot.start_time.slice(0, 10))} &middot; {formatTime(finalSlot.start_time)} &ndash; {formatTime(finalSlot.end_time)}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleCreateEvent}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: '#FFFFFF', borderColor: '#BFDBFE', color: '#1D4ED8' }}
                aria-label="Create event from this scheduled time"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Closed banner ── */}
      {poll.status === 'closed' && (
        <div
          className="border rounded-lg p-3 mb-4 flex items-center gap-3"
          style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
          role="status"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm" style={{ color: '#64748B' }}>
            This poll is closed. No more responses can be submitted.
          </p>
        </div>
      )}

      {/* ── Best Times Banner ── */}
      {(poll.status === 'open' || poll.status === 'closed') && totalResponders > 0 && (
        <BestTimesBanner slots={slots} />
      )}

      {/* ── Instructions ── */}
      {poll.status === 'open' && (
        <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#64748B' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click or drag to mark when you are available. Darker blue = more members free.
          {isAdmin && ' Click a cell to select it as the meeting time.'}
        </p>
      )}

      {/* ── Finalize confirm ── */}
      {finalizeTarget && (
        <div
          className="border rounded-lg p-3 mb-4 flex items-center justify-between gap-3"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
          role="alertdialog"
          aria-label="Confirm meeting time"
        >
          <p className="text-sm font-medium" style={{ color: '#92400E' }}>
            Set meeting time to {formatDate(finalizeTarget.start_time.slice(0, 10))} at {formatTime(finalizeTarget.start_time)}?
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={function() { finalizeSlot(finalizeTarget); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: '#3B82F6', color: '#FFFFFF' }}
            >
              Confirm
            </button>
            <button
              onClick={function() { setFinalizeTarget(null); }}
              className="px-3 py-1.5 text-xs font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
              style={{ background: '#FFFFFF', borderColor: '#E2E8F0', color: '#475569' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Heatmap Grid ── */}
      {uniqueDates.length > 0 && uniqueHours.length > 0 ? (
        <div className="overflow-x-auto" role="region" aria-label={'Availability grid for ' + poll.title}>
          <table className="border-collapse text-xs select-none" role="grid">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="pr-3 text-right font-normal pb-2"
                  style={{ color: '#94A3B8', minWidth: '52px' }}
                  aria-label="Time"
                />
                {uniqueDates.map(function(date) {
                  return (
                    <th key={date} scope="col" className="text-center pb-2 px-0.5" style={{ minWidth: '48px' }}>
                      <div className="font-semibold" style={{ color: '#0E1523' }}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="font-normal" style={{ color: '#94A3B8' }}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {uniqueHours.map(function(hour) {
                var timeLabel = hour === 0 ? '12 AM' : hour < 12 ? hour + ' AM' : hour === 12 ? '12 PM' : (hour - 12) + ' PM';
                return (
                  <tr key={hour}>
                    <td className="pr-3 text-right py-0.5 whitespace-nowrap" style={{ color: '#94A3B8' }}>
                      {timeLabel}
                    </td>
                    {uniqueDates.map(function(date) {
                      var slot = slotMap[date + '|' + hour];
                      if (!slot) {
                        return (
                          <td key={date} className="px-0.5 py-0.5">
                            <div className="w-11 h-7 rounded" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                          </td>
                        );
                      }
                      var yesCount   = (slot.scheduling_responses || []).filter(function(r) { return r.availability === 'yes'; }).length;
                      var isMine     = myAvailability[slot.id] === true;
                      var isFinalized = poll.finalized_slot_id === slot.id;
                      var isOpen     = poll.status === 'open';
                      var isTarget   = finalizeTarget && finalizeTarget.id === slot.id;
                      var bg         = isFinalized ? '#1D4ED8' : heatmapBg(yesCount, maxCount);
                      var txtColor   = isFinalized ? '#FFFFFF' : heatmapText(yesCount, maxCount);
                      var borderStyle = isFinalized
                        ? '2px solid #3B82F6'
                        : isMine
                          ? '2px solid #60A5FA'
                          : isTarget
                            ? '2px solid #F5B731'
                            : '1px solid #E2E8F0';

                      return (
                        <td key={date} className="px-0.5 py-0.5">
                          <div
                            role={isOpen ? 'button' : 'cell'}
                            tabIndex={isOpen ? 0 : -1}
                            aria-pressed={isOpen ? isMine : undefined}
                            aria-label={
                              timeLabel + ' on ' + formatDate(date) +
                              (isMine ? ', you are available' : '') +
                              ', ' + yesCount + ' available'
                            }
                            className="w-11 h-7 rounded flex items-center justify-center transition-opacity duration-75"
                            style={{
                              background: bg,
                              border: borderStyle,
                              cursor: isOpen ? 'pointer' : 'default',
                              outline: isTarget ? '2px solid #F5B731' : undefined,
                            }}
                            onMouseDown={function() { handleMouseDown(slot); }}
                            onMouseEnter={function() { handleMouseEnter(slot); }}
                            onClick={function() {
                              if (isAdmin && isOpen && !isDragging) setFinalizeTarget(slot);
                            }}
                            onKeyDown={function(e) {
                              if (isOpen && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                toggleSlot(slot);
                              }
                            }}
                          >
                            {isFinalized && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="#FFFFFF" strokeWidth={3} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {!isFinalized && yesCount > 0 && (
                              <span className="text-xs font-bold leading-none" style={{ color: txtColor }}>
                                {yesCount}
                              </span>
                            )}
                            {!isFinalized && isMine && yesCount === 0 && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="#60A5FA" strokeWidth={3} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm italic" style={{ color: '#94A3B8' }}>No time slots found for this poll.</p>
      )}

      {/* ── Respondent Tracker ── */}
      <RespondentTracker slots={slots} orgMembers={orgMembers} />

    </article>
  );
}