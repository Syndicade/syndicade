import { supabase } from './supabase';

/**
 * Announcement Service
 * Handles all announcement-related API calls
 */

// Fetch announcements for an organization
export async function fetchAnnouncements(organizationId, options = {}) {
  try {
    let query = supabase
      .from('announcements')
      .select(`
        *,
        organization:organizations(id, name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return { data: null, error };
  }
}

// Fetch single announcement with full details
export async function fetchAnnouncementById(announcementId) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        organization:organizations(id, name, type)
      `)
      .eq('id', announcementId)
      .single();

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: readData } = await supabase
        .from('announcement_reads')
        .select('read_at')
        .eq('announcement_id', announcementId)
        .eq('member_id', user.id)
        .single();

      data.is_read = !!readData;
      data.read_at = readData?.read_at;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return { data: null, error };
  }
}

// Create new announcement
export async function createAnnouncement(announcementData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        ...announcementData,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating announcement:', error);
    return { data: null, error };
  }
}

// Update announcement
export async function updateAnnouncement(announcementId, updates) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', announcementId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating announcement:', error);
    return { data: null, error };
  }
}

// Delete announcement
export async function deleteAnnouncement(announcementId) {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return { error };
  }
}

// Mark announcement as read
export async function markAsRead(announcementId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: null };

    const { error } = await supabase
      .from('announcement_reads')
      .upsert({
        announcement_id: announcementId,
        member_id: user.id,
        read_at: new Date().toISOString()
      }, {
        onConflict: 'announcement_id,member_id'
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { error };
  }
}

// Get unread count for current user
export async function getUnreadCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { count: 0, error: null };

    const { data: memberships } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('member_id', user.id)
      .eq('status', 'active');

    if (!memberships || memberships.length === 0) {
      return { count: 0, error: null };
    }

    const orgIds = memberships.map(m => m.organization_id);

    const { data: announcements } = await supabase
      .from('announcements')
      .select('id')
      .in('organization_id', orgIds)
      .eq('status', 'published')
      .eq('visibility', 'members');

    if (!announcements) return { count: 0, error: null };

    let unreadCount = 0;
    for (const announcement of announcements) {
      const { data: readData } = await supabase
        .from('announcement_reads')
        .select('id')
        .eq('announcement_id', announcement.id)
        .eq('member_id', user.id)
        .single();

      if (!readData) unreadCount++;
    }

    return { count: unreadCount, error: null };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { count: 0, error };
  }
}

// Get read statistics for announcement (admin only)
export async function getAnnouncementStats(announcementId) {
  try {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('organization_id')
      .eq('id', announcementId)
      .single();

    if (!announcement) throw new Error('Announcement not found');

    const { count: totalMembers } = await supabase
      .from('memberships')
      .select('member_id', { count: 'exact', head: true })
      .eq('organization_id', announcement.organization_id)
      .eq('status', 'active');

    const { count: readCount } = await supabase
      .from('announcement_reads')
      .select('id', { count: 'exact', head: true })
      .eq('announcement_id', announcementId);

    return {
      data: {
        total_members: totalMembers || 0,
        read_count: readCount || 0,
        unread_count: (totalMembers || 0) - (readCount || 0),
        read_percentage: totalMembers ? Math.round((readCount / totalMembers) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting announcement stats:', error);
    return { data: null, error };
  }
}