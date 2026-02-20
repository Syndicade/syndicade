import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OrganizationSettings from '../components/OrganizationSettings';
import InviteMember from '../components/InviteMember';
import CreateEvent from '../components/CreateEvent';
import CreateAnnouncement from '../components/CreateAnnouncement';
import AnnouncementCard from '../components/AnnouncementCard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import GroupCard from '../components/GroupCard';
import CreateGroup from '../components/CreateGroup';

// ─── Icon Components ──────────────────────────────────────────────────────────

function Icon({ path, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />)
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={path} />}
    </svg>
  );
}

const ICONS = {
  chart:      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  members:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  building:   ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  folder:     'M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  photo:      ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  megaphone:  ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  inbox:      ['M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'],
  mail:       ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  trendUp:    'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  settings:   ['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  calendar:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clipboard:  ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  pencil:     ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  globe:      ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  clock:      ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  userPlus:   ['M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'],
  check:      'M5 13l4 4L19 7',
  x:          'M6 18L18 6M6 6l12 12',
  plus:       'M12 4v16m8-8H4',
  chevLeft:   'M15 19l-7-7 7-7',
  eye:        ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  location:   ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  video:      'M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  shuffle:    ['M7 16V4m0 0L3 8m4-4l4 4', 'M17 8v12m0 0l4-4m-4 4l-4-4'],
};

function OrganizationDashboard() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingInvites: 0,
    activeEvents: 0,
    unreadAnnouncements: 0,
    totalGroups: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [viewMode, setViewMode] = useState('admin');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [unreadInquiriesCount, setUnreadInquiriesCount] = useState(0);

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupTypeFilter, setGroupTypeFilter] = useState('all');
  const [managingGroup, setManagingGroup] = useState(null);

  const [orgMembers, setOrgMembers] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState(null);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');
  const [memberActionLoading, setMemberActionLoading] = useState(null);

  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoError, setPhotoError] = useState(null);
  const [photoSuccess, setPhotoSuccess] = useState(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const allTabs = [
    { id: 'overview',       label: 'Overview',       iconKey: 'chart',      roles: ['admin', 'member'] },
    { id: 'members',        label: 'Members',         iconKey: 'members',    roles: ['admin', 'member'] },
    { id: 'groups',         label: 'Groups',          iconKey: 'building',   roles: ['admin', 'member'] },
    { id: 'documents',      label: 'Documents',       iconKey: 'folder',     roles: ['admin', 'member'] },
    { id: 'photos',         label: 'Photos',          iconKey: 'photo',      roles: ['admin', 'member'] },
    { id: 'announcements',  label: 'Announcements',   iconKey: 'megaphone',  badge: stats.unreadAnnouncements, roles: ['admin', 'member'] },
    { id: 'inbox',          label: 'Inbox',           iconKey: 'inbox',      badge: unreadInquiriesCount, roles: ['admin'] },
    { id: 'invite',         label: 'Invite',          iconKey: 'mail',       roles: ['admin'] },
    { id: 'analytics',      label: 'Analytics',       iconKey: 'trendUp',    roles: ['admin'] },
    { id: 'settings',       label: 'Settings',        iconKey: 'settings',   roles: ['admin'] },
  ];

  const effectiveRole = (membership?.role === 'admin' && viewMode === 'admin') ? 'admin' : 'member';
  const tabs = allTabs.filter(tab => tab.roles.includes(effectiveRole));

  useEffect(() => { fetchData(); }, [organizationId]);
  useEffect(() => { if (activeTab === 'announcements' && currentUserId) fetchAnnouncements(); }, [activeTab, organizationId, currentUserId]);
  useEffect(() => { if (activeTab === 'overview' && organizationId) fetchRecentActivity(); }, [activeTab, organizationId]);
  useEffect(() => { if (activeTab === 'inbox' && organizationId) fetchInquiries(); }, [activeTab, organizationId]);
  useEffect(() => { if (activeTab === 'groups' && organizationId) fetchGroups(); }, [activeTab, organizationId]);
  useEffect(() => { if (activeTab === 'members' && organizationId) fetchMembers(); }, [activeTab, organizationId]);
  useEffect(() => { if (activeTab === 'photos' && organizationId) fetchPhotos(); }, [activeTab, organizationId]);
  useEffect(() => {
    if (managingGroup && organizationId) {
      fetchOrgMembers();
      setAddMemberSearch('');
      setAddMemberError(null);
      setAddMemberSuccess(null);
    }
  }, [managingGroup?.id]);

  async function fetchPhotos() {
    try {
      setPhotosLoading(true);
      const { data, error } = await supabase.from('org_photos').select('*').eq('organization_id', organizationId).order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      if (error) throw error;
      setPhotos(data || []);
    } catch (err) { console.error('Error fetching photos:', err); }
    finally { setPhotosLoading(false); }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { setPhotoError('Only JPG, PNG, GIF, and WebP images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be under 5MB.'); return; }
    try {
      setPhotoUploading(true); setPhotoError(null); setPhotoSuccess(null);
      const ext = file.name.split('.').pop();
      const fileName = organizationId + '/' + Date.now() + '.' + ext;
      const { error: uploadError } = await supabase.storage.from('organization-images').upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('organization-images').getPublicUrl(fileName);
      const { error: insertError } = await supabase.from('org_photos').insert({ organization_id: organizationId, uploaded_by: currentUserId, photo_url: urlData.publicUrl, caption: photoCaption.trim() || null });
      if (insertError) throw insertError;
      setPhotoCaption(''); setPhotoSuccess('Photo uploaded successfully!'); e.target.value = '';
      await fetchPhotos();
    } catch (err) { console.error('Error uploading photo:', err); setPhotoError('Upload failed: ' + err.message); }
    finally { setPhotoUploading(false); }
  }

  async function handleDeletePhoto(photo) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    try {
      setDeletingPhotoId(photo.id);
      const urlParts = photo.photo_url.split('/organization-images/');
      if (urlParts.length === 2) await supabase.storage.from('organization-images').remove([urlParts[1]]);
      const { error } = await supabase.from('org_photos').delete().eq('id', photo.id);
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (err) { console.error('Error deleting photo:', err); alert('Could not delete photo: ' + err.message); }
    finally { setDeletingPhotoId(null); }
  }

  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const { data: membershipData, error: membershipError } = await supabase.from('memberships').select('id, role, status, joined_date, member_id').eq('organization_id', organizationId).in('status', ['active', 'pending']).order('joined_date', { ascending: true });
      if (membershipError) throw membershipError;
      if (!membershipData || membershipData.length === 0) { setMembers([]); return; }
      const memberIds = membershipData.map(m => m.member_id);
      const { data: memberProfiles, error: profileError } = await supabase.from('members').select('user_id, first_name, last_name, profile_photo_url').in('user_id', memberIds);
      if (profileError) throw profileError;
      const profileMap = {};
      (memberProfiles || []).forEach(p => { profileMap[p.user_id] = p; });
      setMembers(membershipData.map(m => ({ ...m, members: profileMap[m.member_id] || null })));
    } catch (err) { console.error('Error fetching members:', err); }
    finally { setMembersLoading(false); }
  }

  async function handleChangeRole(membershipId, newRole, memberName) {
    if (!window.confirm('Change ' + memberName + "'s role to " + newRole + '?')) return;
    try {
      setMemberActionLoading(membershipId + '-role');
      const { error } = await supabase.from('memberships').update({ role: newRole }).eq('id', membershipId);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === membershipId ? { ...m, role: newRole } : m));
    } catch (err) { console.error('Error changing role:', err); alert('Could not change role: ' + err.message); }
    finally { setMemberActionLoading(null); }
  }

  async function handleRemoveMemberFromOrg(membershipId, memberName) {
    if (!window.confirm('Remove ' + memberName + ' from this organization? This cannot be undone.')) return;
    try {
      setMemberActionLoading(membershipId + '-remove');
      const { error } = await supabase.from('memberships').delete().eq('id', membershipId);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== membershipId));
      await fetchStats(currentUserId);
    } catch (err) { console.error('Error removing member:', err); alert('Could not remove member: ' + err.message); }
    finally { setMemberActionLoading(null); }
  }

  function exportMembersCSV() {
    const rows = [['First Name', 'Last Name', 'Role', 'Status', 'Joined Date']];
    filteredMembers.forEach(m => { rows.push([m.members?.first_name || '', m.members?.last_name || '', m.role, m.status, m.joined_date ? new Date(m.joined_date).toLocaleDateString() : '']); });
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = (organization?.name || 'members') + '_members.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function getAvatarColor(name) {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    return colors[(name || 'A').charCodeAt(0) % colors.length];
  }

  const filteredMembers = members.filter(m => {
    const fullName = ((m.members?.first_name || '') + ' ' + (m.members?.last_name || '')).toLowerCase();
    return (memberSearch === '' || fullName.includes(memberSearch.toLowerCase())) && (memberRoleFilter === 'all' || m.role === memberRoleFilter);
  });

  async function fetchOrgMembers() {
    try {
      const { data, error } = await supabase.from('memberships').select('member_id, members(user_id, first_name, last_name, profile_photo_url)').eq('organization_id', organizationId).eq('status', 'active');
      if (error) throw error;
      setOrgMembers(data || []);
    } catch (err) { console.error('Error fetching org members:', err); }
  }

  async function handleAddMemberToGroup(memberId) {
    if (!managingGroup) return;
    try {
      setAddMemberLoading(true); setAddMemberError(null); setAddMemberSuccess(null);
      const { error } = await supabase.from('group_memberships').insert({ group_id: managingGroup.id, member_id: memberId, status: 'active' });
      if (error) { if (error.code === '23505') { setAddMemberError('This member is already in the group.'); } else { throw error; } return; }
      const added = orgMembers.find(m => m.member_id === memberId);
      const name = added?.members ? added.members.first_name + ' ' + added.members.last_name : 'Member';
      setAddMemberSuccess(name + ' added to group.'); setAddMemberSearch('');
      await fetchGroups();
    } catch (err) { console.error('Error adding member to group:', err); setAddMemberError('Could not add member: ' + err.message); }
    finally { setAddMemberLoading(false); }
  }

  async function fetchData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) { navigate('/login'); return; }
      setCurrentUserId(user.id);
      const { data: orgData, error: orgError } = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (orgError) throw orgError;
      setOrganization(orgData);
      const { data: membershipData, error: membershipError } = await supabase.from('memberships').select('*').eq('organization_id', organizationId).eq('member_id', user.id).single();
      if (membershipError) { setError('You are not a member of this organization'); setLoading(false); return; }
      setMembership(membershipData);
      await fetchStats(user.id);
      await fetchRecentActivity();
      if (membershipData.role === 'admin') {
        const { count } = await supabase.from('contact_inquiries').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('is_read', false);
        setUnreadInquiriesCount(count || 0);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function fetchGroups() {
    try {
      setGroupsLoading(true);
      const { data, error } = await supabase.from('groups').select('*, lead_member:members!groups_lead_member_id_fkey(user_id, first_name, last_name, profile_photo_url), group_memberships(id, member_id, status, members(user_id, first_name, last_name, profile_photo_url))').eq('organization_id', organizationId).order('created_at', { ascending: false });
      if (error) throw error;
      setGroups(data || []);
      if (managingGroup) { const refreshed = (data || []).find(g => g.id === managingGroup.id); if (refreshed) setManagingGroup(refreshed); }
    } catch (err) { console.error('Error fetching groups:', err); }
    finally { setGroupsLoading(false); }
  }

  async function handleGroupCreated(newGroup) { setGroups(prev => [newGroup, ...prev]); setStats(prev => ({ ...prev, totalGroups: prev.totalGroups + 1 })); }

  async function handleJoinGroup(group) {
    try {
      const status = group.join_mode === 'open' ? 'active' : 'pending';
      const { error } = await supabase.from('group_memberships').insert({ group_id: group.id, member_id: currentUserId, status });
      if (error) throw error;
      await fetchGroups();
    } catch (err) { console.error('Error joining group:', err); alert('Could not join group: ' + err.message); }
  }

  async function handleLeaveGroup(group) {
    if (!window.confirm('Leave ' + group.name + '?')) return;
    try {
      const { error } = await supabase.from('group_memberships').delete().eq('group_id', group.id).eq('member_id', currentUserId);
      if (error) throw error;
      await fetchGroups();
    } catch (err) { console.error('Error leaving group:', err); alert('Could not leave group: ' + err.message); }
  }

  async function handleDeleteGroup(group) {
    if (!window.confirm('Delete "' + group.name + '"? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('groups').delete().eq('id', group.id);
      if (error) throw error;
      setGroups(prev => prev.filter(g => g.id !== group.id));
      setStats(prev => ({ ...prev, totalGroups: Math.max(0, prev.totalGroups - 1) }));
      if (managingGroup?.id === group.id) setManagingGroup(null);
    } catch (err) { console.error('Error deleting group:', err); alert('Could not delete group: ' + err.message); }
  }

  function handleUpdateGroup(updatedGroup) { setGroups(prev => prev.map(g => g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g)); }
  async function handleManageGroup(group) { setManagingGroup(group); }

  async function handleApproveMember(groupId, memberId) {
    try {
      const { error } = await supabase.from('group_memberships').update({ status: 'active' }).eq('group_id', groupId).eq('member_id', memberId);
      if (error) throw error;
      await fetchGroups();
    } catch (err) { console.error('Error approving member:', err); alert('Could not approve member: ' + err.message); }
  }

  async function handleRemoveMember(groupId, memberId) {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      const { error } = await supabase.from('group_memberships').delete().eq('group_id', groupId).eq('member_id', memberId);
      if (error) throw error;
      await fetchGroups();
    } catch (err) { console.error('Error removing member:', err); alert('Could not remove member: ' + err.message); }
  }

  async function fetchInquiries() {
    try {
      setInquiriesLoading(true);
      const { data, error } = await supabase.from('contact_inquiries').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false });
      if (error) throw error;
      setInquiries(data || []);
      setUnreadInquiriesCount((data || []).filter(i => !i.is_read).length);
    } catch (err) { console.error('Error fetching inquiries:', err); }
    finally { setInquiriesLoading(false); }
  }

  async function handleMarkInquiryRead(inquiryId) {
    try {
      const { error } = await supabase.from('contact_inquiries').update({ is_read: true }).eq('id', inquiryId);
      if (error) throw error;
      setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, is_read: true } : i));
      setUnreadInquiriesCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error('Error marking inquiry as read:', err); }
  }

  async function handleDeleteInquiry(inquiryId) {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('contact_inquiries').delete().eq('id', inquiryId);
      if (error) throw error;
      const deleted = inquiries.find(i => i.id === inquiryId);
      setInquiries(prev => prev.filter(i => i.id !== inquiryId));
      if (deleted && !deleted.is_read) setUnreadInquiriesCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error('Error deleting inquiry:', err); }
  }

  async function fetchStats(userId) {
    try {
      const { count: memberCount } = await supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active');
      const { count: inviteCount } = await supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'pending');
      const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).gte('start_time', new Date().toISOString());
      const { count: groupCount } = await supabase.from('groups').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId);
      const { data: allAnnouncements } = await supabase.from('announcements').select('id').eq('organization_id', organizationId);
      const announcementIds = (allAnnouncements || []).map(a => a.id);
      let unreadCount = 0;
      if (announcementIds.length > 0 && userId) {
        const { data: reads } = await supabase.from('announcement_reads').select('announcement_id').eq('member_id', userId).in('announcement_id', announcementIds);
        const readIds = new Set((reads || []).map(r => r.announcement_id));
        unreadCount = announcementIds.length - readIds.size;
      }
      setStats({ totalMembers: memberCount || 0, pendingInvites: inviteCount || 0, activeEvents: eventCount || 0, unreadAnnouncements: unreadCount, totalGroups: groupCount || 0 });
    } catch (err) { console.error('Error fetching stats:', err); }
  }

  async function fetchRecentActivity() {
    try {
      setActivityLoading(true);
      const activities = [];
      const { data: events } = await supabase.from('events').select('id, title, start_time, created_at, event_type').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(5);
      if (events) events.forEach(event => activities.push({ id: 'event-' + event.id, type: 'event', title: 'New event: ' + event.title, iconKey: event.event_type === 'virtual' ? 'video' : event.event_type === 'hybrid' ? 'shuffle' : 'location', timestamp: event.created_at }));
      const { data: announcementsData } = await supabase.from('announcements').select('id, title, created_at, priority').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(5);
      if (announcementsData) announcementsData.forEach(a => activities.push({ id: 'announcement-' + a.id, type: 'announcement', title: a.title, iconKey: 'megaphone', timestamp: a.created_at }));
      const { data: newMembers } = await supabase.from('memberships').select('id, created_at, members!inner(first_name, last_name)').eq('organization_id', organizationId).eq('status', 'active').order('created_at', { ascending: false }).limit(5);
      if (newMembers) newMembers.forEach(m => activities.push({ id: 'member-' + m.id, type: 'member', title: m.members.first_name + ' ' + m.members.last_name + ' joined', iconKey: 'userPlus', timestamp: m.created_at }));
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activities.slice(0, 10));
    } catch (err) { console.error('Error fetching recent activity:', err); }
    finally { setActivityLoading(false); }
  }

  async function fetchAnnouncements() {
    try {
      setAnnouncementsLoading(true);
      const { data, error } = await supabase.from('announcements').select('*, announcement_reads!left(id, member_id)').eq('organization_id', organizationId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements((data || []).map(a => ({ ...a, is_read: a.announcement_reads?.some(r => r.member_id === currentUserId) || false })));
    } catch (err) { console.error('Error fetching announcements:', err); }
    finally { setAnnouncementsLoading(false); }
  }

  async function handleEventCreated() { await fetchStats(currentUserId); }
  async function handleAnnouncementCreated(newAnnouncement) { setAnnouncements(prev => [{ ...newAnnouncement, is_read: false }, ...prev]); await fetchStats(currentUserId); }
  async function handleAnnouncementRead(announcementId) { setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, is_read: true } : a)); setStats(prev => ({ ...prev, unreadAnnouncements: Math.max(0, prev.unreadAnnouncements - 1) })); }
  async function handleAnnouncementDelete(announcementId) { setAnnouncements(prev => prev.filter(a => a.id !== announcementId)); await fetchStats(currentUserId); }

  async function handleMarkAllAsRead() {
    if (!currentUserId) return;
    const unread = announcements.filter(a => !a.is_read);
    if (unread.length === 0) return;
    try {
      const { error } = await supabase.from('announcement_reads').insert(unread.map(a => ({ announcement_id: a.id, member_id: currentUserId })));
      if (error && error.code !== '23505') throw error;
      setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
      setStats(prev => ({ ...prev, unreadAnnouncements: 0 }));
    } catch (err) { console.error('Error marking all as read:', err); }
  }

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = announcementSearch === '' || a.title.toLowerCase().includes(announcementSearch.toLowerCase()) || a.content.toLowerCase().includes(announcementSearch.toLowerCase());
    const matchesPriority = announcementFilter === 'all' || a.priority === announcementFilter;
    return matchesSearch && matchesPriority && !(a.expires_at && new Date(a.expires_at) < new Date());
  });

  const filteredGroups = groups.filter(g => {
    const matchesSearch = groupSearch === '' || g.name.toLowerCase().includes(groupSearch.toLowerCase()) || (g.description || '').toLowerCase().includes(groupSearch.toLowerCase());
    return matchesSearch && (groupTypeFilter === 'all' || g.group_type === groupTypeFilter);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" role="status" aria-label="Loading dashboard">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <p className="text-red-800 font-semibold text-lg">Access Denied</p>
          <p className="text-red-700 mt-2">{error}</p>
          <button onClick={() => navigate('/organizations')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">Back to Organizations</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Org Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url && (
                <img src={organization.logo_url} alt={organization.name + ' logo'} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-600 mt-1">{organization.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">{organization.type}</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">{membership.role === 'admin' ? 'Admin' : 'Member'}</span>
                </div>
              </div>
            </div>
            {membership?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <span className={'text-sm font-medium ' + (viewMode === 'admin' ? 'text-purple-700' : 'text-gray-500')}>Admin View</span>
                <button
                  onClick={() => setViewMode(viewMode === 'admin' ? 'member' : 'admin')}
                  className={'relative inline-flex h-8 w-14 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors ' + (viewMode === 'member' ? 'bg-blue-600' : 'bg-purple-600')}
                  role="switch" aria-checked={viewMode === 'admin'} aria-label="Toggle between admin and member view"
                >
                  <span className={'inline-block h-6 w-6 transform rounded-full bg-white transition-transform ' + (viewMode === 'admin' ? 'translate-x-1' : 'translate-x-7')} />
                </button>
                <span className={'text-sm font-medium ' + (viewMode === 'member' ? 'text-blue-700' : 'text-gray-500')}>Member View</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 px-6 overflow-x-auto" aria-label="Organization tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={'py-4 px-3 border-b-2 font-medium text-sm transition-all relative whitespace-nowrap inline-flex items-center gap-1.5 ' + (activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon path={ICONS[tab.iconKey]} className="h-4 w-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full" aria-label={tab.badge + ' unread'}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">

            {/* ── MEMBERS TAB ── */}
            {activeTab === 'members' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                    <p className="text-gray-600 mt-1">{filteredMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}</p>
                  </div>
                  {effectiveRole === 'admin' && (
                    <button onClick={exportMembersCSV} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors border border-gray-300" aria-label="Export members to CSV">
                      Export CSV
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1">
                    <label htmlFor="member-search" className="sr-only">Search members by name</label>
                    <input id="member-search" type="text" placeholder="Search members by name..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="member-role-filter" className="sr-only">Filter by role</label>
                    <select id="member-role-filter" value={memberRoleFilter} onChange={e => setMemberRoleFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="all">All Roles</option>
                      <option value="admin">Admins</option>
                      <option value="member">Members</option>
                    </select>
                  </div>
                </div>
                {membersLoading ? (
                  <div className="flex justify-center items-center py-12" role="status" aria-label="Loading members">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" aria-hidden="true"></div>
                    <span className="sr-only">Loading members...</span>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <p className="text-gray-500 font-semibold text-lg">{memberSearch || memberRoleFilter !== 'all' ? 'No members match your search' : 'No members yet'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Organization members">
                    {filteredMembers.map(m => {
                      const firstName = m.members?.first_name || '';
                      const lastName = m.members?.last_name || '';
                      const fullName = (firstName + ' ' + lastName).trim() || 'Unknown Member';
                      const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
                      const isCurrentUser = m.members?.user_id === currentUserId;
                      const joinDate = m.joined_date ? new Date(m.joined_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';
                      return (
                        <div key={m.id} role="listitem" className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            {m.members?.profile_photo_url ? (
                              <img src={m.members.profile_photo_url} alt={fullName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className={'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ' + getAvatarColor(firstName)} aria-hidden="true">{initials}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-900 truncate">{fullName}</p>
                                {isCurrentUser && <span className="text-xs text-gray-400">(you)</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ' + (m.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800')}>{m.role === 'admin' ? 'Admin' : 'Member'}</span>
                                {m.status === 'pending' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">Joined {joinDate}</p>
                          {effectiveRole === 'admin' && !isCurrentUser && (
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                              <button onClick={() => handleChangeRole(m.id, m.role === 'admin' ? 'member' : 'admin', fullName)} disabled={memberActionLoading === m.id + '-role'} className="flex-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 transition-colors border border-gray-200" aria-label={(m.role === 'admin' ? 'Remove admin from ' : 'Make admin: ') + fullName}>
                                {memberActionLoading === m.id + '-role' ? 'Saving...' : m.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              <button onClick={() => handleRemoveMemberFromOrg(m.id, fullName)} disabled={memberActionLoading === m.id + '-remove'} className="px-3 py-1.5 text-xs font-semibold bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors" aria-label={'Remove ' + fullName + ' from organization'}>
                                {memberActionLoading === m.id + '-remove' ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── GROUPS TAB ── */}
            {activeTab === 'groups' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Groups & Committees</h2>
                    <p className="text-gray-600 mt-1">{groups.length} group{groups.length !== 1 ? 's' : ''} in this organization</p>
                  </div>
                  {effectiveRole === 'admin' && (
                    <button onClick={() => setShowCreateGroup(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors" aria-label="Create new group or committee">
                      + Create Group
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="flex-1">
                    <label htmlFor="group-search" className="sr-only">Search groups</label>
                    <input id="group-search" type="text" placeholder="Search groups..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor="group-type-filter" className="sr-only">Filter by type</label>
                    <select id="group-type-filter" value={groupTypeFilter} onChange={e => setGroupTypeFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="all">All Types</option>
                      <option value="committee">Committee</option>
                      <option value="board">Board</option>
                      <option value="volunteer_team">Volunteer Team</option>
                      <option value="working_group">Working Group</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                {managingGroup && effectiveRole === 'admin' && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-blue-900">Managing: {managingGroup.name}</h3>
                      <button onClick={() => setManagingGroup(null)} className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close manage panel">Close</button>
                    </div>
                    <div className="mb-5 p-4 bg-white border border-blue-100 rounded-lg">
                      <h4 className="text-sm font-bold text-gray-800 mb-3">Add Member to Group</h4>
                      {addMemberError && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700" role="alert">{addMemberError}</div>}
                      {addMemberSuccess && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700" role="status">{addMemberSuccess}</div>}
                      {(() => {
                        const liveGroup = groups.find(g => g.id === managingGroup.id);
                        const currentGroupMemberIds = new Set((liveGroup?.group_memberships || []).map(gm => gm.member_id));
                        const availableToAdd = orgMembers.filter(m => !currentGroupMemberIds.has(m.member_id) && (addMemberSearch === '' || (m.members?.first_name + ' ' + m.members?.last_name).toLowerCase().includes(addMemberSearch.toLowerCase())));
                        return (
                          <div>
                            <label htmlFor="add-member-search" className="sr-only">Search org members to add</label>
                            <input id="add-member-search" type="text" placeholder="Search members by name..." value={addMemberSearch} onChange={e => { setAddMemberSearch(e.target.value); setAddMemberError(null); setAddMemberSuccess(null); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" aria-label="Search organization members to add to group" />
                            {addMemberSearch && availableToAdd.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No members found — they may already be in this group.</p>}
                            {availableToAdd.length > 0 && (
                              <ul className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100" aria-label="Members available to add">
                                {availableToAdd.map(m => (
                                  <li key={m.member_id} className="flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50">
                                    <span className="text-sm text-gray-900">{m.members ? m.members.first_name + ' ' + m.members.last_name : 'Unknown'}</span>
                                    <button onClick={() => handleAddMemberToGroup(m.member_id)} disabled={addMemberLoading} className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors" aria-label={'Add ' + (m.members?.first_name || 'member') + ' to group'}>
                                      {addMemberLoading ? 'Adding...' : 'Add'}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {!addMemberSearch && <p className="text-xs text-gray-400 mt-1">Type a name above to find org members to add.</p>}
                          </div>
                        );
                      })()}
                    </div>
                    {(() => {
                      const liveGroup = groups.find(g => g.id === managingGroup.id);
                      const pending = (liveGroup?.group_memberships || []).filter(gm => gm.status === 'pending');
                      const active = (liveGroup?.group_memberships || []).filter(gm => gm.status === 'active');
                      return (
                        <div className="space-y-4">
                          {pending.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-orange-700 uppercase tracking-wide mb-2">Pending Requests ({pending.length})</h4>
                              <ul className="space-y-2" aria-label="Pending join requests">
                                {pending.map(gm => (
                                  <li key={gm.member_id} className="flex items-center justify-between bg-white border border-orange-200 rounded-lg p-3">
                                    <span className="text-sm font-medium text-gray-900">{gm.members ? gm.members.first_name + ' ' + gm.members.last_name : 'Unknown Member'}</span>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleApproveMember(managingGroup.id, gm.member_id)} className="px-3 py-1 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors" aria-label={'Approve ' + (gm.members?.first_name || 'member')}>Approve</button>
                                      <button onClick={() => handleRemoveMember(managingGroup.id, gm.member_id)} className="px-3 py-1 text-xs font-semibold bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label={'Decline ' + (gm.members?.first_name || 'member')}>Decline</button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {active.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Members ({active.length})</h4>
                              <ul className="space-y-2" aria-label="Active group members">
                                {active.map(gm => (
                                  <li key={gm.member_id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900">{gm.members ? gm.members.first_name + ' ' + gm.members.last_name : 'Unknown Member'}</span>
                                      {liveGroup.lead_member_id === gm.member_id && <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Lead</span>}
                                    </div>
                                    <button onClick={() => handleRemoveMember(managingGroup.id, gm.member_id)} className="px-3 py-1 text-xs font-semibold bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label={'Remove ' + (gm.members?.first_name || 'member') + ' from group'}>Remove</button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {pending.length === 0 && active.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No members yet.</p>}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {groupsLoading ? (
                  <div className="flex justify-center items-center py-12" role="status" aria-label="Loading groups">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" aria-hidden="true"></div>
                    <span className="sr-only">Loading groups...</span>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <p className="text-gray-600 font-semibold text-lg">{groupSearch || groupTypeFilter !== 'all' ? 'No groups match your search' : 'No groups yet'}</p>
                    {!groupSearch && groupTypeFilter === 'all' && effectiveRole === 'admin' && (
                      <button onClick={() => setShowCreateGroup(true)} className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">Create First Group</button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="list" aria-label="Groups and committees">
                    {filteredGroups.map(group => (
                      <div key={group.id} role="listitem">
                        <GroupCard group={group} currentUserId={currentUserId} isAdmin={effectiveRole === 'admin'} onManage={handleManageGroup} onJoin={handleJoinGroup} onLeave={handleLeaveGroup} onDelete={handleDeleteGroup} onUpdate={handleUpdateGroup} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── INBOX TAB ── */}
            {activeTab === 'inbox' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
                    <p className="text-gray-600 mt-1">Messages submitted via the public Join Us form</p>
                  </div>
                  {inquiries.length > 0 && <span className="text-sm text-gray-500">{inquiries.filter(i => !i.is_read).length} unread · {inquiries.length} total</span>}
                </div>
                {inquiriesLoading ? (
                  <div className="flex justify-center items-center py-12" role="status" aria-label="Loading messages">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" aria-hidden="true"></div>
                    <span className="sr-only">Loading messages...</span>
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <p className="text-gray-600 font-semibold text-lg">No messages yet</p>
                    <p className="text-gray-500 text-sm mt-2">Messages submitted via your public page will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4" role="list" aria-label="Contact inquiries">
                    {inquiries.map(inquiry => (
                      <div key={inquiry.id} role="listitem" className={'rounded-lg border p-5 transition-all ' + (inquiry.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-300')}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-gray-900">{inquiry.name}</span>
                              {!inquiry.is_read && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">New</span>}
                              <span className="text-sm text-gray-500">{new Date(inquiry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <a href={'mailto:' + inquiry.email} className="text-blue-600 hover:underline text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Email ' + inquiry.name + ' at ' + inquiry.email}>{inquiry.email}</a>
                            <p className="text-gray-700 mt-3 leading-relaxed">{inquiry.message}</p>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {!inquiry.is_read && (
                              <button onClick={() => handleMarkInquiryRead(inquiry.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all whitespace-nowrap" aria-label={'Mark message from ' + inquiry.name + ' as read'}>Mark Read</button>
                            )}
                            <button onClick={() => handleDeleteInquiry(inquiry.id)} className="px-3 py-1.5 text-sm bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all whitespace-nowrap" aria-label={'Delete message from ' + inquiry.name}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <button onClick={() => setActiveTab('members')} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label={'View ' + stats.totalMembers + ' total members'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Members</p>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalMembers}</p>
                        <p className="text-xs text-blue-700 mt-1">Click to view directory</p>
                      </div>
                      <Icon path={ICONS.members} className="h-10 w-10 text-blue-300" strokeWidth={1.5} />
                    </div>
                  </button>
                  {effectiveRole === 'admin' && (
                    <button onClick={() => setActiveTab('invite')} className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2" aria-label={'Manage ' + stats.pendingInvites + ' pending invitations'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-semibold uppercase tracking-wide">Pending Invites</p>
                          <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingInvites}</p>
                          <p className="text-xs text-yellow-700 mt-1">{stats.pendingInvites === 0 ? 'All caught up!' : 'Click to manage'}</p>
                        </div>
                        <Icon path={ICONS.mail} className="h-10 w-10 text-yellow-300" strokeWidth={1.5} />
                      </div>
                    </button>
                  )}
                  <button onClick={() => navigate('/organizations/' + organizationId + '/events')} className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" aria-label={'View ' + stats.activeEvents + ' upcoming events'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Upcoming Events</p>
                        <p className="text-3xl font-bold text-green-900 mt-2">{stats.activeEvents}</p>
                        <p className="text-xs text-green-700 mt-1">Click to view calendar</p>
                      </div>
                      <Icon path={ICONS.calendar} className="h-10 w-10 text-green-300" strokeWidth={1.5} />
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('announcements')} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2" aria-label={'Read ' + stats.unreadAnnouncements + ' unread announcements'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-semibold uppercase tracking-wide">Unread News</p>
                        <p className="text-3xl font-bold text-orange-900 mt-2">{stats.unreadAnnouncements}</p>
                        <p className="text-xs text-orange-700 mt-1">{stats.unreadAnnouncements === 0 ? 'All caught up!' : 'Click to read'}</p>
                      </div>
                      <Icon path={ICONS.megaphone} className="h-10 w-10 text-orange-300" strokeWidth={1.5} />
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('groups')} className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" aria-label={'View ' + stats.totalGroups + ' groups and committees'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Groups</p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalGroups}</p>
                        <p className="text-xs text-purple-700 mt-1">Click to view all</p>
                      </div>
                      <Icon path={ICONS.building} className="h-10 w-10 text-purple-300" strokeWidth={1.5} />
                    </div>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setShowCreateEvent(true)} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Create event">
                      <Icon path={ICONS.calendar} className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Create Event</span>
                    </button>
                    {effectiveRole === 'admin' && (
                      <button onClick={() => setShowCreateAnnouncement(true)} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Create announcement">
                        <Icon path={ICONS.megaphone} className="h-6 w-6 text-orange-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">Create Announcement</span>
                      </button>
                    )}
                    <button onClick={() => navigate('/organizations/' + organizationId + '/members')} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="View member directory">
                      <Icon path={ICONS.members} className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">View Member Directory</span>
                    </button>
                    <button onClick={() => setActiveTab('groups')} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Groups and committees">
                      <Icon path={ICONS.building} className="h-6 w-6 text-purple-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Groups &amp; Committees</span>
                    </button>
                    <button onClick={() => navigate('/organizations/' + organizationId + '/scheduling')} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Group scheduling">
                      <Icon path={ICONS.clock} className="h-6 w-6 text-teal-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Group Scheduling</span>
                    </button>
                    <button onClick={() => navigate('/organizations/' + organizationId + '/polls')} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="View polls">
                      <Icon path={ICONS.chart} className="h-6 w-6 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Polls</span>
                    </button>
                    <button onClick={() => navigate('/organizations/' + organizationId + '/surveys')} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="View surveys">
                      <Icon path={ICONS.clipboard} className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">Surveys</span>
                    </button>
                    <button onClick={() => navigate('/organizations/' + organizationId + '/signup-forms')} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="View sign-up forms">
                      <Icon path={ICONS.pencil} className="h-6 w-6 text-indigo-500 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Sign-Up Forms</div>
                        <div className="text-sm text-gray-500">Volunteer lists &amp; time slots</div>
                      </div>
                    </button>
                    {effectiveRole === 'admin' && (
                      <button onClick={() => navigate('/organizations/' + organizationId + '/page-editor')} className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Edit public page">
                        <Icon path={ICONS.globe} className="h-6 w-6 text-gray-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900">Edit Public Page</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                    <button onClick={fetchRecentActivity} className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1" aria-label="Refresh activity feed">Refresh</button>
                  </div>
                  {activityLoading ? (
                    <div className="flex justify-center items-center py-8" role="status">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
                      <span className="sr-only">Loading activity...</span>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8"><p className="text-gray-500">No recent activity</p></div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="mt-0.5 text-gray-400 flex-shrink-0">
                            <Icon path={ICONS[activity.iconKey] || ICONS.clock} className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Document Library</h2>
                      <p className="text-gray-600 mt-1">Access organization documents, files, and resources</p>
                    </div>
                    {effectiveRole === 'admin' && (
                      <button onClick={() => navigate('/organizations/' + organizationId + '/documents')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">Manage Documents</button>
                    )}
                  </div>
                  <div className="mt-6 text-center">
                    <button onClick={() => navigate('/organizations/' + organizationId + '/documents')} className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                      View All Documents <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PHOTOS TAB ── */}
            {activeTab === 'photos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Photo Gallery</h2>
                    <p className="text-gray-600 mt-1">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {effectiveRole === 'admin' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                    <h3 className="text-base font-bold text-blue-900 mb-4">Upload Photo</h3>
                    {photoError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">{photoError}</div>}
                    {photoSuccess && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700" role="status">{photoSuccess}</div>}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label htmlFor="photo-caption" className="sr-only">Photo caption (optional)</label>
                        <input id="photo-caption" type="text" placeholder="Caption (optional)" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" maxLength={200} />
                      </div>
                      <div>
                        <label htmlFor="photo-upload" className={'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors focus-within:ring-2 focus-within:ring-blue-500 ' + (photoUploading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')}>
                          {photoUploading ? 'Uploading...' : '+ Upload Photo'}
                          <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePhotoUpload} disabled={photoUploading} className="sr-only" aria-label="Choose a photo to upload" />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP · Max 5MB</p>
                      </div>
                    </div>
                  </div>
                )}
                {photosLoading ? (
                  <div className="flex justify-center items-center py-12" role="status" aria-label="Loading photos">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" aria-hidden="true"></div>
                    <span className="sr-only">Loading photos...</span>
                  </div>
                ) : photos.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <Icon path={ICONS.photo} className="h-12 w-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-gray-600 font-semibold text-lg">No photos yet</p>
                    {effectiveRole === 'admin' && <p className="text-gray-500 text-sm mt-2">Upload your first photo using the panel above.</p>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" role="list" aria-label="Photo gallery">
                    {photos.map(photo => (
                      <div key={photo.id} role="listitem" className="relative group rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <button onClick={() => setLightboxPhoto(photo)} className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" aria-label={'View photo' + (photo.caption ? ': ' + photo.caption : '')}>
                          <img src={photo.photo_url} alt={photo.caption || 'Organization photo'} className="w-full h-40 object-cover" loading="lazy" />
                        </button>
                        {photo.caption && <div className="px-2 py-1.5 bg-white"><p className="text-xs text-gray-600 truncate">{photo.caption}</p></div>}
                        {effectiveRole === 'admin' && (
                          <button onClick={() => handleDeletePhoto(photo)} disabled={deletingPhotoId === photo.id} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50" aria-label={'Delete photo' + (photo.caption ? ': ' + photo.caption : '')}>
                            <Icon path={ICONS.x} className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {lightboxPhoto && (
                  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLightboxPhoto(null)}>
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setLightboxPhoto(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded" aria-label="Close photo viewer">
                        <Icon path={ICONS.x} className="h-7 w-7" strokeWidth={2.5} />
                      </button>
                      <img src={lightboxPhoto.photo_url} alt={lightboxPhoto.caption || 'Organization photo'} className="w-full max-h-screen object-contain rounded-lg" />
                      {lightboxPhoto.caption && <p className="text-white text-center mt-3 text-sm">{lightboxPhoto.caption}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ANNOUNCEMENTS TAB ── */}
            {activeTab === 'announcements' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
                  {effectiveRole === 'admin' && (
                    <button type="button" onClick={() => setShowCreateAnnouncement(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all font-semibold">
                      + Create Announcement
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label htmlFor="announcement-search" className="sr-only">Search announcements</label>
                    <input id="announcement-search" type="text" placeholder="Search announcements..." value={announcementSearch} onChange={e => setAnnouncementSearch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <label htmlFor="announcement-filter" className="sr-only">Filter by priority</label>
                  <select id="announcement-filter" value={announcementFilter} onChange={e => setAnnouncementFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All ({announcements.length})</option>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                  {stats.unreadAnnouncements > 0 && (
                    <button type="button" onClick={handleMarkAllAsRead} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all whitespace-nowrap">
                      Mark All Read ({stats.unreadAnnouncements})
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">Showing {filteredAnnouncements.length} of {announcements.length} announcements</p>
                {announcementsLoading ? (
                  <div className="flex justify-center items-center py-12" role="status">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
                    <span className="sr-only">Loading announcements...</span>
                  </div>
                ) : filteredAnnouncements.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
                    <p className="text-gray-600 font-semibold">{announcementSearch || announcementFilter !== 'all' ? 'No announcements match your filters' : 'No announcements yet'}</p>
                    {!announcementSearch && announcementFilter === 'all' && effectiveRole === 'admin' && (
                      <button type="button" onClick={() => setShowCreateAnnouncement(true)} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">Create First Announcement</button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAnnouncements.map(announcement => (
                      <AnnouncementCard key={announcement.id} announcement={announcement} onRead={handleAnnouncementRead} onDelete={handleAnnouncementDelete} isAdmin={effectiveRole === 'admin'} showOrganization={false} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── INVITE TAB ── */}
            {activeTab === 'invite' && (
              <>
                {membership.role === 'admin' || organization.settings?.allowMemberInvites ? (
                  <InviteMember organizationId={organizationId} organizationName={organization.name} onInviteSent={() => fetchStats(currentUserId)} />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" role="alert">
                    <p className="text-yellow-800 font-semibold">Permission Required</p>
                    <p className="text-yellow-700">Member invitations are disabled. Contact an admin to enable this feature.</p>
                  </div>
                )}
              </>
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'analytics' && <AnalyticsDashboard organizationId={organizationId} />}

            {/* ── SETTINGS TAB ── */}
            {activeTab === 'settings' && (
              <>
                {membership.role === 'admin' ? (
                  <OrganizationSettings organizationId={organizationId} onUpdate={updatedData => setOrganization(prev => ({ ...prev, ...updatedData }))} />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" role="alert">
                    <p className="text-yellow-800 font-semibold">Admin Access Required</p>
                    <p className="text-yellow-700">Only organization admins can modify settings.</p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      <CreateEvent isOpen={showCreateEvent} onClose={() => setShowCreateEvent(false)} onSuccess={handleEventCreated} organizationId={organizationId} organizationName={organization?.name || 'Your Organization'} />
      <CreateAnnouncement isOpen={showCreateAnnouncement} onClose={() => setShowCreateAnnouncement(false)} onSuccess={handleAnnouncementCreated} organizationId={organizationId} organizationName={organization?.name || 'Your Organization'} />
      <CreateGroup isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} onSuccess={handleGroupCreated} organizationId={organizationId} organizationName={organization?.name || 'Your Organization'} />
    </div>
  );
}

export default OrganizationDashboard;