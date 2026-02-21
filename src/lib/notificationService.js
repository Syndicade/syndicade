import { supabase } from './supabase';

/**
 * Create a notification for a single user.
 */
export async function createNotification({ userId, organizationId, type, title, message, link }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, organization_id: organizationId, type, title, message, link, read: false }])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

/**
 * Notify all active members of an organization.
 * Uses two-step query to avoid RLS 400 errors.
 */
export async function notifyOrganizationMembers({ organizationId, type, title, message, link, excludeUserId }) {
  try {
    // Step 1: get member IDs
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('member_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      throw membershipsError;
    }

    if (!memberships || memberships.length === 0) {
      console.warn('No active members found for organization:', organizationId);
      return { data: [], error: null };
    }

    const memberIds = memberships
      .map(m => m.member_id)
      .filter(id => id !== excludeUserId);

    if (memberIds.length === 0) {
      console.warn('No members to notify after filtering.');
      return { data: [], error: null };
    }

    // Step 2: insert notifications
    const notifications = memberIds.map(memberId => ({
      user_id: memberId,
      organization_id: organizationId,
      type,
      title,
      message,
      link,
      read: false,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error notifying organization members:', error);
    return { data: null, error };
  }
}

/**
 * Notify a specific list of users.
 */
export async function notifyUsers({ userIds, organizationId, type, title, message, link }) {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      organization_id: organizationId,
      type,
      title,
      message,
      link,
      read: false,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error notifying users:', error);
    return { data: null, error };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
}

/**
 * Delete notifications older than 30 days for a user.
 */
export async function deleteOldNotifications(userId) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    return { error };
  }
}