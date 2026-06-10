import { supabase } from './supabase';

/**
 * Check whether a user wants a specific notification type for an org.
 * Missing row = opted in (opt-out model).
 * Returns true if the notification should be sent.
 */
async function userWantsNotification(userId, orgId, type) {
  try {
    var { data, error } = await supabase
      .from('member_notification_prefs')
      .select('muted, overrides')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      console.error('Error checking notification prefs:', error);
      return true; // fail open — send notification if pref check fails
    }

    if (!data) return true; // no row = all notifications on

    if (data.muted === true) return false; // org muted entirely

    // Check per-type override
    if (data.overrides && typeof data.overrides === 'object') {
      if (data.overrides[type] === false) return false;
    }

    return true;
  } catch (err) {
    console.error('userWantsNotification error:', err);
    return true; // fail open
  }
}

/**
 * Create a notification for a single user (no preference check — use directly
 * only when you've already confirmed the user wants this, e.g. admin alerts).
 */
export async function createNotification({ userId, organizationId, type, title, message, link }) {
  try {
    var { data, error } = await supabase
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
 * Respects member_notification_prefs (muted + per-type overrides).
 * Uses two-step query to avoid RLS 400 errors.
 */
export async function notifyOrganizationMembers({ organizationId, type, title, message, link, excludeUserId }) {
  try {
    // Step 1: get active member IDs
    var { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('member_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      throw membershipsError;
    }

    if (!memberships || memberships.length === 0) {
      return { data: [], error: null };
    }

    var memberIds = memberships
      .map(function(m) { return m.member_id; })
      .filter(function(id) { return id !== excludeUserId; });

    if (memberIds.length === 0) return { data: [], error: null };

    // Step 2: check preferences for all members
    // Fetch all pref rows for this org in one query
    var { data: prefs } = await supabase
      .from('member_notification_prefs')
      .select('user_id, muted, overrides')
      .eq('org_id', organizationId)
      .in('user_id', memberIds);

    var prefMap = {};
    if (prefs) {
      prefs.forEach(function(p) { prefMap[p.user_id] = p; });
    }

    // Filter out members who have opted out
    var eligibleIds = memberIds.filter(function(userId) {
      var pref = prefMap[userId];
      if (!pref) return true; // no row = opted in
      if (pref.muted === true) return false;
      if (pref.overrides && pref.overrides[type] === false) return false;
      return true;
    });

    if (eligibleIds.length === 0) return { data: [], error: null };

    // Step 3: insert notifications
    var notifications = eligibleIds.map(function(memberId) {
      return {
        user_id: memberId,
        organization_id: organizationId,
        type: type,
        title: title,
        message: message,
        link: link,
        read: false,
      };
    });

    var { data, error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error notifying organization members:', error);
    return { data: null, error };
  }
}

/**
 * Notify org admins only (for admin-only types: member_joined, event_rsvp, inbox_message).
 * Respects member_notification_prefs.
 */
export async function notifyOrgAdmins({ organizationId, type, title, message, link, excludeUserId }) {
  try {
    var { data: admins, error: adminErr } = await supabase
      .from('memberships')
      .select('member_id')
      .eq('organization_id', organizationId)
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminErr) throw adminErr;
    if (!admins || admins.length === 0) return { data: [], error: null };

    var adminIds = admins
      .map(function(a) { return a.member_id; })
      .filter(function(id) { return id !== excludeUserId; });

    if (adminIds.length === 0) return { data: [], error: null };

    // Check preferences
    var { data: prefs } = await supabase
      .from('member_notification_prefs')
      .select('user_id, muted, overrides')
      .eq('org_id', organizationId)
      .in('user_id', adminIds);

    var prefMap = {};
    if (prefs) {
      prefs.forEach(function(p) { prefMap[p.user_id] = p; });
    }

    var eligibleIds = adminIds.filter(function(userId) {
      var pref = prefMap[userId];
      if (!pref) return true;
      if (pref.muted === true) return false;
      if (pref.overrides && pref.overrides[type] === false) return false;
      return true;
    });

    if (eligibleIds.length === 0) return { data: [], error: null };

    var notifications = eligibleIds.map(function(adminId) {
      return {
        user_id: adminId,
        organization_id: organizationId,
        type: type,
        title: title,
        message: message,
        link: link,
        read: false,
      };
    });

    var { data, error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error notifying org admins:', error);
    return { data: null, error };
  }
}

/**
 * Notify a specific list of users (no preference check — caller is responsible).
 */
export async function notifyUsers({ userIds, organizationId, type, title, message, link }) {
  try {
    var notifications = userIds.map(function(userId) {
      return {
        user_id: userId,
        organization_id: organizationId,
        type: type,
        title: title,
        message: message,
        link: link,
        read: false,
      };
    });

    var { data, error } = await supabase
      .from('notifications')
      .insert(notifications)

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
    var { data, error } = await supabase
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
    var thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    var { error } = await supabase
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