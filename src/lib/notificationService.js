import { supabase } from './supabase';

/**
 * Create a notification for a user
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - User ID to notify
 * @param {string} params.organizationId - Organization ID (optional)
 * @param {string} params.type - Type: 'announcement', 'event', 'member', 'invitation', 'document'
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.link - Link to navigate to (optional)
 */
export async function createNotification({ userId, organizationId, type, title, message, link }) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          organization_id: organizationId,
          type,
          title,
          message,
          link,
          read: false
        }
      ])
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
 * Notify all members of an organization
 * @param {Object} params - Notification parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.link - Link to navigate to (optional)
 * @param {string} params.excludeUserId - User ID to exclude (optional, e.g., the creator)
 */
export async function notifyOrganizationMembers({ organizationId, type, title, message, link, excludeUserId }) {
  try {
    // Get all active members of the organization
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('member_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (membershipsError) throw membershipsError;

    // Filter out excluded user if provided
    const memberIds = memberships
      .map(m => m.member_id)
      .filter(id => id !== excludeUserId);

    // Create notifications for all members
    const notifications = memberIds.map(memberId => ({
      user_id: memberId,
      organization_id: organizationId,
      type,
      title,
      message,
      link,
      read: false
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
 * Notify specific users
 * @param {Object} params - Notification parameters
 * @param {string[]} params.userIds - Array of user IDs to notify
 * @param {string} params.organizationId - Organization ID (optional)
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.link - Link to navigate to (optional)
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
      read: false
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
 * Mark notification as read
 * @param {string} notificationId - Notification ID
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
 * Delete old notifications (older than 30 days)
 * @param {string} userId - User ID
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