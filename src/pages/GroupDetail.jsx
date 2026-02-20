import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import CreateEvent from '../components/CreateEvent';
import FileUploadModal from '../components/FileUploadModal';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const TabUserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const TabCalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const TabFolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  committee: 'Committee', board: 'Board', team: 'Team', volunteer: 'Volunteer', other: 'Other',
};

const ROLE_LABELS = { chair: 'Chair', co_chair: 'Co-Chair', member: 'Member' };
const ROLE_COLORS = {
  chair: 'bg-purple-100 text-purple-800',
  co_chair: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-700',
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function MemberSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading members">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-32" />
          </div>
          <div className="h-7 w-20 bg-gray-200 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading events">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-40" />
            <div className="h-3 bg-gray-200 rounded w-56" />
          </div>
          <div className="w-4 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading documents">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-200 rounded w-36" />
          </div>
          <div className="h-7 w-20 bg-gray-200 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({ groupId, organizationId, existingMemberIds, onClose, onSaved }) {
  const [orgMembers, setOrgMembers] = useState([]);
  const [selected, setSelected] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('memberships')
        .select('member_id, members(user_id, first_name, last_name)')
        .eq('organization_id', organizationId)
        .eq('status', 'active');
      const available = (data || []).filter(m => !existingMemberIds.includes(m.member_id));
      setOrgMembers(available);
      setLoading(false);
    };
    fetchMembers();
  }, [groupId, organizationId, existingMemberIds]);

  const handleAdd = async () => {
    if (!selected) { toast.error('Select a member'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId, member_id: selected, role, status: 'active', added_by: user.id,
      });
      if (error) throw error;
      toast.success('Member added successfully');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog" aria-modal="true" aria-labelledby="add-member-title">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="add-member-title" className="text-xl font-bold text-gray-900">Add Member to Group</h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          ) : orgMembers.length === 0 ? (
            <p className="text-gray-500 text-sm">All organization members are already in this group.</p>
          ) : (
            <>
              <div>
                <label htmlFor="select-member" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Member <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select id="select-member" value={selected} onChange={e => setSelected(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required="true">
                  <option value="">-- Choose a member --</option>
                  {orgMembers.map(m => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.members?.first_name} {m.members?.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select id="member-role" value={role} onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="member">Member</option>
                  <option value="chair">Chair</option>
                  <option value="co_chair">Co-Chair</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400">
            Cancel
          </button>
          {orgMembers.length > 0 && (
            <button onClick={handleAdd} disabled={saving || !selected}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-busy={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" role="status">
                    <span className="sr-only">Adding...</span>
                  </div>
                  Adding...
                </>
              ) : 'Add Member'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ groupId, organizationId, isAdmin }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('group_members')
      .select('*, members(user_id, first_name, last_name, profile_photo_url)')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('role')
      .order('joined_at');
    if (!error) setMembers(data || []);
    setLoading(false);
  }, [groupId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRemove = async (gm) => {
    if (!window.confirm(`Remove ${gm.members?.first_name} ${gm.members?.last_name} from this group?`)) return;
    const { error } = await supabase.from('group_members').update({ status: 'removed' }).eq('id', gm.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Member removed');
    fetchMembers();
  };

  const handleRoleChange = async (gm, newRole) => {
    const { error } = await supabase.from('group_members').update({ role: newRole }).eq('id', gm.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Role updated');
    fetchMembers();
  };

  const existingIds = members.map(m => m.member_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading ? <span className="inline-block h-3 w-16 bg-gray-200 rounded animate-pulse" /> : `${members.length} ${members.length === 1 ? 'member' : 'members'}`}
        </p>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add member to group">
            <PlusIcon />
            Add Member
          </button>
        )}
      </div>

      {loading ? <MemberSkeleton /> : members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="flex justify-center text-gray-300 mb-3"><UserIcon /></div>
          <p className="text-gray-800 font-semibold text-base mb-1">No members yet</p>
          <p className="text-gray-500 text-sm mb-4">Add organization members to get this group started.</p>
          {isAdmin && (
            <button onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon />
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Group members">
          {members.map(gm => (
            <li key={gm.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0" aria-hidden="true">
                {gm.members?.first_name?.[0]}{gm.members?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {gm.members?.first_name} {gm.members?.last_name}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin ? (
                  <select value={gm.role} onChange={e => handleRoleChange(gm, e.target.value)}
                    className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Change role for ${gm.members?.first_name} ${gm.members?.last_name}`}>
                    <option value="member">Member</option>
                    <option value="chair">Chair</option>
                    <option value="co_chair">Co-Chair</option>
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[gm.role]}`}>
                    {ROLE_LABELS[gm.role]}
                  </span>
                )}
                {isAdmin && (
                  <button onClick={() => handleRemove(gm)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    aria-label={`Remove ${gm.members?.first_name} ${gm.members?.last_name}`}>
                    <TrashIcon />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAddModal && (
        <AddMemberModal
          groupId={groupId}
          organizationId={organizationId}
          existingMemberIds={existingIds}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchMembers(); }}
        />
      )}
    </div>
  );
}

// ─── Events Tab ───────────────────────────────────────────────────────────────

function EventsTab({ groupId, organizationId, orgName, isAdmin }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Query through the event_groups junction table
      const { data, error } = await supabase
        .from('event_groups')
        .select('event_id, events(id, title, start_time, end_time, location, visibility)')
        .eq('group_id', groupId);

      if (error) throw error;

      // Extract and sort the nested events
      const extracted = (data || [])
        .map(row => row.events)
        .filter(Boolean)
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      setEvents(extracted);
    } catch (err) {
      console.error('Error fetching group events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleEventCreated = (newEvent) => {
    fetchEvents();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading
            ? <span className="inline-block h-3 w-40 bg-gray-200 rounded animate-pulse" />
            : `${events.length} ${events.length === 1 ? 'event' : 'events'} assigned to this group`}
        </p>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Create new event for this group">
              <PlusIcon />
              Create Event
            </button>
          )}
          <Link
            to={`/organizations/${organizationId}/events`}
            className="text-sm text-blue-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            View all events
          </Link>
        </div>
      </div>

      {loading ? <EventSkeleton /> : events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="flex justify-center text-gray-300 mb-3"><CalendarIcon /></div>
          <p className="text-gray-800 font-semibold text-base mb-1">No events yet</p>
          <p className="text-gray-500 text-sm mb-1">
            {isAdmin
              ? 'Create an event for this group using the button above.'
              : 'No events have been assigned to this group yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateEvent(true)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon />
              Create First Event
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Group events">
          {events.map(event => (
            <li key={event.id}>
              <Link
                to={`/organizations/${organizationId}/events/${event.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`View event: ${event.title}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(event.start_time).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                    {event.location && ` — ${event.location}`}
                  </p>
                </div>
                <ChevronRightIcon />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pass groupId so CreateEvent always links the event to this group */}
      <CreateEvent
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSuccess={handleEventCreated}
        organizationId={organizationId}
        organizationName={orgName}
        groupId={groupId}
      />
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function DocumentsTab({ groupId, organizationId, isAdmin }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('id, title, file_name, file_type, file_size_bytes, uploaded_at, storage_path, visibility')
      .eq('organization_id', organizationId)
      .contains('allowed_groups', [groupId])
      .eq('status', 'approved')
      .eq('is_current_version', true)
      .order('uploaded_at', { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  }, [groupId, organizationId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error('Failed to generate download link');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      if (doc.storage_path) {
        await supabase.storage.from('documents').remove([doc.storage_path]);
      }
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
      toast.success('Document deleted');
      fetchDocs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Document uploaded successfully');
    setShowUpload(false);
    fetchDocs();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading
            ? <span className="inline-block h-3 w-44 bg-gray-200 rounded animate-pulse" />
            : `${documents.length} ${documents.length === 1 ? 'document' : 'documents'} shared with this group`}
        </p>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Upload document">
              <PlusIcon />
              Upload Document
            </button>
          )}
          <Link
            to={`/organizations/${organizationId}/documents`}
            className="text-sm text-blue-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            Document library
          </Link>
        </div>
      </div>

      {loading ? <DocumentSkeleton /> : documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="flex justify-center text-gray-300 mb-3"><FolderIcon /></div>
          <p className="text-gray-800 font-semibold text-base mb-1">No documents yet</p>
          <p className="text-gray-500 text-sm mb-1">
            {isAdmin
              ? 'Upload a document and assign it to this group, or visit the document library to assign existing documents.'
              : 'No documents have been shared with this group yet.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <PlusIcon />
              Upload First Document
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Group documents">
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(doc.file_extension || doc.file_name?.split('.').pop() || 'FILE').toUpperCase()}
                  {doc.file_size_bytes ? ` — ${formatSize(doc.file_size_bytes)}` : ''}
                  {' — '}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  aria-label={`Download ${doc.title}`}>
                  <DownloadIcon />
                  Download
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                    aria-label={`Delete ${doc.title}`}>
                    <TrashIcon />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showUpload && (
        <FileUploadModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
          organizationId={organizationId}
          folderId={null}
          groupId={groupId}
        />
      )}
    </div>
  );
}

// ─── Page Skeleton ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-3 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-3 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 flex gap-0">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-5 py-3.5">
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="p-6">
            <MemberSkeleton />
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function GroupDetail() {
  const { organizationId, groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const [{ data: groupData }, { data: org }, { data: membership }] = await Promise.all([
          supabase.from('org_groups').select('*').eq('id', groupId).single(),
          supabase.from('organizations').select('name').eq('id', organizationId).single(),
          supabase.from('memberships').select('role')
            .eq('organization_id', organizationId)
            .eq('member_id', user.id)
            .eq('status', 'active')
            .single(),
        ]);
        setGroup(groupData);
        setOrgName(org?.name || '');
        setIsAdmin(membership?.role === 'admin');
      } catch {
        toast.error('Failed to load group');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organizationId, groupId]);

  const tabs = [
    { id: 'members', label: 'Members', icon: <TabUserIcon /> },
    { id: 'events', label: 'Events', icon: <TabCalendarIcon /> },
    { id: 'documents', label: 'Documents', icon: <TabFolderIcon /> },
  ];

  if (loading) return <PageSkeleton />;

  if (!group) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center text-gray-300 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-gray-800 font-semibold text-lg mb-1">Group not found</p>
        <p className="text-gray-500 text-sm mb-4">This group may have been deleted or you may not have access.</p>
        <button
          onClick={() => navigate(`/organizations/${organizationId}/groups`)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Back to Groups
        </button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50" aria-label={`${group.name} detail`}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Breadcrumb + Header */}
        <div className="mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-3 flex-wrap">
            <button onClick={() => navigate(`/organizations/${organizationId}`)}
              className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              {orgName}
            </button>
            <ChevronRightIcon />
            <button onClick={() => navigate(`/organizations/${organizationId}/groups`)}
              className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              Groups &amp; Committees
            </button>
            <ChevronRightIcon />
            <span className="text-gray-900 font-medium">{group.name}</span>
          </nav>

          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(`/organizations/${organizationId}/groups`)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors mt-0.5"
              aria-label="Back to groups list">
              <ArrowLeftIcon />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} aria-hidden="true" />
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {TYPE_LABELS[group.type] || group.type}
                </span>
              </div>
              {group.description && (
                <p className="text-gray-500 text-sm mt-1 ml-7">{group.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200" role="tablist" aria-label="Group sections">
            <div className="flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="p-6">
            {activeTab === 'members' && (
              <MembersTab groupId={groupId} organizationId={organizationId} isAdmin={isAdmin} />
            )}
            {activeTab === 'events' && (
              <EventsTab groupId={groupId} organizationId={organizationId} orgName={orgName} isAdmin={isAdmin} />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab groupId={groupId} organizationId={organizationId} isAdmin={isAdmin} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default GroupDetail;