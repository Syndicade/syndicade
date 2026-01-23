import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AnnouncementCard from '../components/AnnouncementCard';

/**
 * AnnouncementFeed Page
 * 
 * Displays all announcements for an organization with search, filter,
 * and sort capabilities. Shows pinned announcements first, then by
 * priority and date.
 * 
 * Route: /organizations/:organizationId/announcements
 * 
 * Features:
 * - Display announcements sorted by pinned > priority > date
 * - Search by title/content
 * - Filter by priority (all, urgent, normal, low)
 * - Mark all as read button
 * - Unread count badge
 * - Empty states
 * - Loading skeleton
 * - ADA compliant
 */
function AnnouncementFeed() {
  const { organizationId } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch organization and check admin status
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        // Check if user is admin
        const { data: membership, error: memberError } = await supabase
          .from('memberships')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('member_id', user.id)
          .eq('status', 'active')
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError;
        }

        setIsAdmin(membership?.role === 'admin');
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err.message);
      }
    }

    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  // Fetch announcements
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch announcements with read status
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            announcement_reads!left(id, member_id)
          `)
          .eq('organization_id', organizationId)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Process announcements to add is_read flag
        const processedAnnouncements = data.map(announcement => ({
          ...announcement,
          is_read: announcement.announcement_reads?.some(
            read => read.member_id === user.id
          ) || false
        }));

        // Filter out expired announcements (optional - you can show them with indicator)
        const activeAnnouncements = processedAnnouncements.filter(a => 
          !a.expires_at || new Date(a.expires_at) > new Date()
        );

        setAnnouncements(activeAnnouncements);
        setFilteredAnnouncements(activeAnnouncements);

        // Calculate unread count
        const unread = activeAnnouncements.filter(a => !a.is_read).length;
        setUnreadCount(unread);

      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchAnnouncements();
    }
  }, [organizationId]);

  // Apply search and filter
  useEffect(() => {
    let filtered = [...announcements];

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.content.toLowerCase().includes(term)
      );
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(a => a.priority === priorityFilter);
    }

    // Sort: pinned first, then by priority (urgent > normal > low), then by date
    filtered.sort((a, b) => {
      // Pinned first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Then by priority
      const priorityOrder = { urgent: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Finally by date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, priorityFilter]);

  // Handle announcement read
  const handleAnnouncementRead = (announcementId) => {
    setAnnouncements(prev =>
      prev.map(a =>
        a.id === announcementId ? { ...a, is_read: true } : a
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Handle announcement delete
  const handleAnnouncementDelete = (announcementId) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const unreadAnnouncements = announcements.filter(a => !a.is_read);
      
      if (unreadAnnouncements.length === 0) {
        alert('All announcements are already marked as read!');
        return;
      }

      // Insert read records for all unread announcements
      const readRecords = unreadAnnouncements.map(a => ({
        announcement_id: a.id,
        member_id: user.id
      }));

      const { error } = await supabase
        .from('announcement_reads')
        .insert(readRecords);

      if (error) throw error;

      // Update local state
      setAnnouncements(prev =>
        prev.map(a => ({ ...a, is_read: true }))
      );
      setUnreadCount(0);

      alert('✅ All announcements marked as read!');

    } catch (err) {
      console.error('Error marking all as read:', err);
      alert('Failed to mark all as read. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center p-12">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            role="status"
            aria-label="Loading announcements"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <p className="text-red-800 font-semibold">Error Loading Announcements</p>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📢 Announcements
        </h1>
        {organization && (
          <p className="text-gray-600">
            {organization.name}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="flex-1 w-full">
            <label htmlFor="search-announcements" className="sr-only">
              Search announcements
            </label>
            <input
              id="search-announcements"
              type="text"
              placeholder="🔍 Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 items-center">
            <label htmlFor="priority-filter" className="text-sm font-semibold text-gray-700">
              Filter:
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({announcements.length})</option>
              <option value="urgent">🚨 Urgent</option>
              <option value="normal">ℹ️ Normal</option>
              <option value="low">📋 Low</option>
            </select>
          </div>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all whitespace-nowrap"
            >
              ✓ Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        // Empty state
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm || priorityFilter !== 'all'
              ? '🔍 No announcements match your filters'
              : '📭 No announcements yet'}
          </p>
          <p className="text-gray-500">
            {searchTerm || priorityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : isAdmin
              ? 'Create your first announcement to get started!'
              : 'Check back later for updates'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map(announcement => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onRead={handleAnnouncementRead}
              onDelete={handleAnnouncementDelete}
              isAdmin={isAdmin}
              showOrganization={false}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredAnnouncements.length > 0 && (
        <p className="text-center text-gray-500 text-sm mt-6">
          Showing {filteredAnnouncements.length} of {announcements.length} announcements
        </p>
      )}
    </div>
  );
}

export default AnnouncementFeed;