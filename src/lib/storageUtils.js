import { supabase } from './supabase';
import { PLAN_LIMITS } from './planLimits';

// Fetch current storage usage for an org
export async function getStorageUsage(organizationId) {
  var { data, error } = await supabase
    .from('organizations')
    .select('storage_used_bytes, subscriptions(plan)')
    .eq('id', organizationId)
    .single();

  if (error || !data) return null;

  var plan = (data.subscriptions && data.subscriptions[0] && data.subscriptions[0].plan) || 'starter';
  var limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
  var limitBytes = (limits.storage_gb || 2) * 1024 * 1024 * 1024;
  var usedBytes = data.storage_used_bytes || 0;
  var percent = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;

  return {
    usedBytes: usedBytes,
    limitBytes: limitBytes,
    percent: percent,
    isWarning: percent >= 90,
    isBlocked: percent >= 100,
    plan: plan
  };
}

// Add bytes to org storage counter after a successful upload
export async function incrementStorage(organizationId, bytes) {
  var { data } = await supabase
    .from('organizations')
    .select('storage_used_bytes')
    .eq('id', organizationId)
    .single();

  var current = (data && data.storage_used_bytes) || 0;

  await supabase
    .from('organizations')
    .update({ storage_used_bytes: current + bytes })
    .eq('id', organizationId);
}

// Subtract bytes from org storage counter after a delete
export async function decrementStorage(organizationId, bytes) {
  var { data } = await supabase
    .from('organizations')
    .select('storage_used_bytes')
    .eq('id', organizationId)
    .single();

  var current = (data && data.storage_used_bytes) || 0;
  var updated = Math.max(0, current - bytes);

  await supabase
    .from('organizations')
    .update({ storage_used_bytes: updated })
    .eq('id', organizationId);
}

// Format bytes to human-readable string
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 MB';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}