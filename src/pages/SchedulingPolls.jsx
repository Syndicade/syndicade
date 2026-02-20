import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function heatmapColor(count, max) {
  if (max === 0 || count === 0) return 'bg-gray-100 hover:bg-gray-200';
  const ratio = count / max;
  if (ratio >= 0.75) return 'bg-blue-600 hover:bg-blue-700 text-white';
  if (ratio >= 0.5)  return 'bg-blue-400 hover:bg-blue-500 text-white';
  if (ratio >= 0.25) return 'bg-blue-200 hover:bg-blue-300';
  return 'bg-blue-100 hover:bg-blue-200';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchedulingPolls() {
  const { organizationId } = useParams();
  const [polls, setPolls] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    initPage();
  }, [organizationId]);

  async function initPage() {
    setLoading(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error('Not authenticated');
      setLoading(false);
      return;
    }
    setCurrentUser(user);

    const [orgResult, memberResult] = await Promise.allSettled([
      supabase.from('organizations').select('id, name').eq('id', organizationId).single(),
      supabase.from('memberships').select('role').eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').single()
    ]);

    if (orgResult.status === 'fulfilled') setOrganization(orgResult.value.data);
    if (memberResult.status === 'fulfilled') {
      setIsAdmin(memberResult.value.data?.role === 'admin');
    }

    await fetchPolls();
    setLoading(false);
  }

async function fetchPolls() {
    // Step 1: fetch polls
    const { data: pollsData, error: pollsError } = await supabase
      .from('scheduling_polls')
      .select('id, title, description, status, finalized_slot_id, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (pollsError) {
      console.error('fetchPolls polls error:', JSON.stringify(pollsError));
      toast.error('Failed to load scheduling polls');
      return;
    }

    if (!pollsData || pollsData.length === 0) {
      setPolls([]);
      return;
    }

    // Step 2: fetch slots for those polls
    const pollIds = pollsData.map(p => p.id);
    const { data: slotsData, error: slotsError } = await supabase
      .from('scheduling_slots')
      .select('id, poll_id, start_time, end_time')
      .in('poll_id', pollIds);

    if (slotsError) {
      console.error('fetchPolls slots error:', JSON.stringify(slotsError));
      toast.error('Failed to load time slots');
      return;
    }

    // Step 3: fetch responses for those slots
    const slotIds = (slotsData || []).map(s => s.id);
    let responsesData = [];
    if (slotIds.length > 0) {
      const { data: rData, error: rError } = await supabase
        .from('scheduling_responses')
        .select('id, slot_id, member_id, availability')
        .in('slot_id', slotIds);

      if (rError) {
        console.error('fetchPolls responses error:', JSON.stringify(rError));
      } else {
        responsesData = rData || [];
      }
    }

    // Step 4: assemble
    const assembled = pollsData.map(poll => ({
      ...poll,
      scheduling_slots: (slotsData || [])
        .filter(s => s.poll_id === poll.id)
        .map(slot => ({
          ...slot,
          scheduling_responses: responsesData.filter(r => r.slot_id === slot.id)
        }))
    }));

    setPolls(assembled);
  }

  async function deletePoll(pollId) {
    if (!window.confirm('Delete this scheduling poll? This cannot be undone.')) return;
    const { error } = await supabase.from('scheduling_polls').delete().eq('id', pollId);
    if (error) {
      console.error('deletePoll error:', error);
      toast.error('Failed to delete poll');
    } else {
      toast.success('Poll deleted');
      fetchPolls();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600" role="status" aria-label="Loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="mb-6">
          <Link
            to={'/organizations/' + organizationId}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mb-4"
            aria-label="Back to dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Group Scheduling
              </h1>
              {organization && <p className="text-gray-500 mt-1">{organization.name}</p>}
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                aria-label="Create new scheduling poll"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Poll
              </button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <CreatePollForm
            organizationId={organizationId}
            currentUser={currentUser}
            onCreated={() => { setShowCreateForm(false); fetchPolls(); }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Legend */}
        {polls.length > 0 && (
          <div className="flex items-center gap-3 mb-4 text-xs text-gray-500" aria-label="Heatmap legend">
            <span className="font-medium">Availability:</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-gray-100 border border-gray-200" aria-hidden="true"></span>None</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-blue-100" aria-hidden="true"></span>Some</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-blue-400" aria-hidden="true"></span>Most</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-blue-600" aria-hidden="true"></span>All</span>
          </div>
        )}

        {/* Polls List */}
        {polls.length === 0 && !showCreateForm ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">No scheduling polls yet</h2>
            <p className="text-gray-500 text-sm">
              {isAdmin ? 'Create a poll to find the best meeting time for your group.' : 'No scheduling polls have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map(poll => (
              <HeatmapPollCard
                key={poll.id}
                poll={poll}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onDelete={() => deletePoll(poll.id)}
                onUpdated={fetchPolls}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Create Poll Form ─────────────────────────────────────────────────────────

function CreatePollForm({ organizationId, currentUser, onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [endHour, setEndHour] = useState('17');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState([]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  function generateSlots(sDate, eDate, sHour, eHour) {
    if (!sDate || !eDate || !sHour || !eHour) return [];
    const slots = [];
    const start = new Date(sDate + 'T00:00:00');
    const end = new Date(eDate + 'T00:00:00');
    if (end < start) return [];
    const diffDays = Math.round((end - start) / 86400000);
    if (diffDays > 13) return []; // cap at 14 days
    for (let d = 0; d <= diffDays; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      const dateStr = day.toISOString().split('T')[0];
      for (let h = parseInt(sHour); h < parseInt(eHour); h++) {
        slots.push({
          date: dateStr,
          hour: h,
          start_time: dateStr + 'T' + String(h).padStart(2, '0') + ':00:00',
          end_time: dateStr + 'T' + String(h + 1).padStart(2, '0') + ':00:00',
        });
      }
    }
    return slots;
  }

  useEffect(() => {
    setPreview(generateSlots(startDate, endDate, startHour, endHour));
  }, [startDate, endDate, startHour, endHour]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required.'); return; }
    if (!startDate || !endDate) { setError('Select a date range.'); return; }
    if (parseInt(startHour) >= parseInt(endHour)) { setError('End hour must be after start hour.'); return; }
    if (preview.length === 0) { setError('No time slots generated. Check your date range (max 14 days).'); return; }

    setSaving(true);
    try {
      console.log('Inserting poll for org:', organizationId, 'by user:', currentUser.id);

      const { data: poll, error: pollError } = await supabase
        .from('scheduling_polls')
        .insert([{
          organization_id: organizationId,
          created_by: currentUser.id,
          title: title.trim(),
          description: description.trim() || null,
          status: 'open'
        }])
        .select()
        .single();

      if (pollError) {
        console.error('Poll insert error:', pollError);
        throw pollError;
      }
      console.log('Poll created:', poll.id);

      const slotRows = preview.map(s => ({
        poll_id: poll.id,
        start_time: s.start_time,
        end_time: s.end_time,
      }));

      const { error: slotsError } = await supabase.from('scheduling_slots').insert(slotRows);
      if (slotsError) {
        console.error('Slots insert error:', slotsError);
        throw slotsError;
      }
      console.log('Slots created:', slotRows.length);

      toast.success('Poll created! Members can now mark their availability.');
      onCreated();
    } catch (err) {
      console.error('Full error:', err);
      setError('Failed to create poll: ' + (err.message || 'Unknown error. Check console.'));
    } finally {
      setSaving(false);
    }
  }

  const uniqueDates = [...new Set(preview.map(s => s.date))];

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Scheduling Poll
      </h2>
      <p className="text-sm text-gray-500 mb-4">Members will click a grid to mark when they are available.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4" role="alert">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label htmlFor="poll-title" className="block text-sm font-semibold text-gray-900 mb-1">
              Poll Title <span aria-hidden="true">*</span>
            </label>
            <input
              id="poll-title"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Monthly Board Meeting — March"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={150}
              aria-required="true"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="poll-description" className="block text-sm font-semibold text-gray-900 mb-1">
              Description (optional)
            </label>
            <textarea
              id="poll-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add any notes for members..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <fieldset className="border border-gray-200 rounded-lg p-4 mb-4">
          <legend className="text-sm font-semibold text-gray-900 px-1">Date Range <span aria-hidden="true">*</span></legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1">From</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">To (max 14 days)</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 rounded-lg p-4 mb-4">
          <legend className="text-sm font-semibold text-gray-900 px-1">Time Range <span aria-hidden="true">*</span></legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-hour" className="block text-xs text-gray-600 mb-1">From hour</label>
              <select
                id="start-hour"
                value={startHour}
                onChange={e => setStartHour(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {hours.map(h => (
                  <option key={h} value={h}>
                    {parseInt(h) === 0 ? '12:00 AM' : parseInt(h) < 12 ? parseInt(h) + ':00 AM' : parseInt(h) === 12 ? '12:00 PM' : (parseInt(h) - 12) + ':00 PM'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="end-hour" className="block text-xs text-gray-600 mb-1">To hour</label>
              <select
                id="end-hour"
                value={endHour}
                onChange={e => setEndHour(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {hours.map(h => (
                  <option key={h} value={h}>
                    {parseInt(h) === 0 ? '12:00 AM' : parseInt(h) < 12 ? parseInt(h) + ':00 AM' : parseInt(h) === 12 ? '12:00 PM' : (parseInt(h) - 12) + ':00 PM'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4" role="status" aria-live="polite">
            <p className="text-sm text-blue-700 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This will create <strong>{preview.length} time slots</strong> across <strong>{uniqueDates.length} day{uniqueDates.length !== 1 ? 's' : ''}</strong>
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={saving || !title.trim() || preview.length === 0}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Creating...' : 'Create Poll'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Heatmap Poll Card ────────────────────────────────────────────────────────

function HeatmapPollCard({ poll, currentUser, isAdmin, onDelete, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(null); // true = marking available, false = clearing

  // Build grid structure: unique dates (columns) x unique hours (rows)
  const slots = poll.scheduling_slots || [];

  const uniqueDates = [...new Set(slots.map(s => s.start_time.slice(0, 10)))].sort();
  const uniqueHours = [...new Set(slots.map(s => parseInt(s.start_time.slice(11, 13))))].sort((a, b) => a - b);

  // Map: "date|hour" -> slot
  const slotMap = {};
  slots.forEach(slot => {
    const date = slot.start_time.slice(0, 10);
    const hour = parseInt(slot.start_time.slice(11, 13));
    slotMap[date + '|' + hour] = slot;
  });

  // My availability: slotId -> true/false
  const myAvailability = {};
  slots.forEach(slot => {
    const mine = (slot.scheduling_responses || []).find(r => r.member_id === currentUser.id);
    if (mine) myAvailability[slot.id] = mine.availability === 'yes';
  });

  // Max respondents for any single slot (for heatmap scaling)
  const maxCount = Math.max(...slots.map(s => (s.scheduling_responses || []).filter(r => r.availability === 'yes').length), 1);

  async function toggleSlot(slot, forceValue) {
    if (poll.status !== 'open') return;
    const newVal = forceValue !== undefined ? forceValue : !myAvailability[slot.id];
    setSaving(true);
    const { error } = await supabase
      .from('scheduling_responses')
      .upsert(
        [{ slot_id: slot.id, member_id: currentUser.id, availability: newVal ? 'yes' : 'no' }],
        { onConflict: 'slot_id,member_id' }
      );
    if (error) {
      console.error('toggleSlot error:', error);
      toast.error('Failed to save: ' + error.message);
    } else {
      onUpdated();
    }
    setSaving(false);
  }

  async function finalizeSlot(slot) {
    const { error } = await supabase
      .from('scheduling_polls')
      .update({ finalized_slot_id: slot.id, status: 'finalized' })
      .eq('id', poll.id);
    if (error) {
      console.error('finalizeSlot error:', error);
      toast.error('Failed to finalize: ' + error.message);
    } else {
      const date = formatDate(slot.start_time.slice(0, 10));
      const time = formatTime(slot.start_time);
      toast.success('Meeting set for ' + date + ' at ' + time);
      onUpdated();
    }
  }

  function handleMouseDown(slot) {
    if (poll.status !== 'open' || saving) return;
    const newVal = !myAvailability[slot.id];
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

  const statusColors = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
    finalized: 'bg-blue-100 text-blue-700',
  };

  const totalResponders = new Set(
    slots.flatMap(s => (s.scheduling_responses || []).map(r => r.member_id))
  ).size;

  return (
    <article
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
      aria-labelledby={'poll-title-' + poll.id}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Poll Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 id={'poll-title-' + poll.id} className="text-lg font-bold text-gray-900">{poll.title}</h2>
            <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (statusColors[poll.status] || 'bg-gray-100 text-gray-600')}>
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
          </div>
          {poll.description && <p className="text-gray-600 text-sm">{poll.description}</p>}
          {totalResponders > 0 && (
            <p className="text-xs text-gray-400 mt-1">{totalResponders} member{totalResponders !== 1 ? 's' : ''} responded</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all flex-shrink-0"
            aria-label={'Delete poll: ' + poll.title}
          >
            Delete
          </button>
        )}
      </div>

      {/* Finalized banner */}
      {poll.status === 'finalized' && poll.finalized_slot_id && (() => {
        const finalSlot = slots.find(s => s.id === poll.finalized_slot_id);
        if (!finalSlot) return null;
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2" role="status">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800">Meeting Scheduled</p>
              <p className="text-sm text-blue-700">
                {formatDate(finalSlot.start_time.slice(0, 10))} &middot; {formatTime(finalSlot.start_time)} &ndash; {formatTime(finalSlot.end_time)}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Instructions */}
      {poll.status === 'open' && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click or drag to mark when you are available. Darker blue = more members available.
        </p>
      )}
      {isAdmin && poll.status === 'open' && (
        <p className="text-xs text-blue-600 mb-3 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Admin: right-click any cell to finalize that time slot.
        </p>
      )}

      {/* Heatmap Grid */}
      {uniqueDates.length > 0 && uniqueHours.length > 0 ? (
        <div className="overflow-x-auto" role="region" aria-label={'Availability grid for ' + poll.title}>
          <table className="border-collapse text-xs select-none" role="grid">
            <thead>
              <tr>
                <th scope="col" className="w-16 pr-2 text-right text-gray-400 font-normal pb-1" aria-label="Time">
                  Time
                </th>
                {uniqueDates.map(date => (
                  <th key={date} scope="col" className="text-center text-gray-600 font-semibold pb-1 px-0.5 min-w-12">
                    <div>{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className="font-normal text-gray-400">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueHours.map(hour => {
                const timeLabel = hour === 0 ? '12 AM' : hour < 12 ? hour + ' AM' : hour === 12 ? '12 PM' : (hour - 12) + ' PM';
                return (
                  <tr key={hour}>
                    <td className="pr-2 text-right text-gray-400 font-normal py-0.5 whitespace-nowrap" aria-label={timeLabel}>
                      {timeLabel}
                    </td>
                    {uniqueDates.map(date => {
                      const slot = slotMap[date + '|' + hour];
                      if (!slot) {
                        return <td key={date} className="px-0.5 py-0.5"><div className="w-11 h-7 rounded bg-gray-50 border border-gray-100" /></td>;
                      }
                      const yesCount = (slot.scheduling_responses || []).filter(r => r.availability === 'yes').length;
                      const isMine = myAvailability[slot.id] === true;
                      const isFinalized = poll.finalized_slot_id === slot.id;
                      const colorClass = heatmapColor(yesCount, maxCount);
                      const isOpen = poll.status === 'open';

                      return (
                        <td key={date} className="px-0.5 py-0.5">
                          <div
                            role={isOpen ? 'button' : 'cell'}
                            tabIndex={isOpen ? 0 : -1}
                            aria-pressed={isOpen ? isMine : undefined}
                            aria-label={timeLabel + ' on ' + formatDate(date) + (isMine ? ', marked available' : '') + ', ' + yesCount + ' available'}
                            className={
                              'w-11 h-7 rounded border transition-all duration-100 flex items-center justify-center cursor-pointer ' +
                              (isFinalized
                                ? 'border-blue-500 bg-blue-600 ring-2 ring-blue-400 ring-offset-1'
                                : isMine
                                  ? 'border-blue-400 ring-1 ring-blue-300 ' + colorClass
                                  : 'border-gray-200 ' + colorClass) +
                              (isOpen ? ' cursor-pointer' : ' cursor-default')
                            }
                            onMouseDown={() => handleMouseDown(slot)}
                            onMouseEnter={() => handleMouseEnter(slot)}
                            onContextMenu={e => {
                              if (isAdmin && isOpen) {
                                e.preventDefault();
                                if (window.confirm('Set meeting time to ' + timeLabel + ' on ' + formatDate(date) + '?')) {
                                  finalizeSlot(slot);
                                }
                              }
                            }}
                            onKeyDown={e => {
                              if (isOpen && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                toggleSlot(slot);
                              }
                            }}
                          >
                            {isFinalized && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {!isFinalized && isMine && yesCount === 0 && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {!isFinalized && yesCount > 0 && (
                              <span className={'text-xs font-bold leading-none ' + (yesCount / maxCount >= 0.5 ? 'text-white' : 'text-blue-700')}>
                                {yesCount}
                              </span>
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
        <p className="text-sm text-gray-400 italic">No time slots found for this poll.</p>
      )}

      {/* Admin finalize hint */}
      {isAdmin && poll.status === 'open' && totalResponders > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          Right-click a cell to finalize that time slot as the meeting time.
        </p>
      )}
    </article>
  );
}