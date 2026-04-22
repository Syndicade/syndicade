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
  if (!bytes || bytes === 0) return '0 B';
  var k = 1024;
  var sizes = ['B', 'KB', 'MB', 'GB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Get per-category storage breakdown for an org
export async function getStorageBreakdown(orgId) {
  var result = {
    documents:    { total_bytes: 0, files: [] },
    event_fliers: { total_bytes: 0, files: [] },
    newsletters:  { total_bytes: 0, files: [] },
    org_photos:   { total_bytes: 0, files: [] },
    org_images:   { total_bytes: 0, files: [] },
    total_bytes: 0
  };

  function nameFromPath(path, fallback) {
    if (fallback) return fallback;
    if (!path) return 'Unknown';
    return path.split('/').pop() || path;
  }

  // --- Documents (from DB) ---
  var { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .eq('organization_id', orgId);

  if (!docsError && docs) {
    for (var i = 0; i < docs.length; i++) {
      var d = docs[i];
      var sz = d.file_size_bytes || d.file_size || 0;
      if (!sz) continue;
      result.documents.total_bytes += sz;
      result.documents.files.push({
        id: d.id,
        name: d.name || d.file_name || nameFromPath(d.storage_path || d.file_url),
        size_bytes: sz,
        path: d.storage_path || null,
        created_at: d.created_at || null,
        bucket: 'documents',
        category: 'documents'
      });
    }
  }

  // --- Storage buckets helper ---
  async function listBucket(bucketName, category) {
    var { data: files, error } = await supabase
      .storage
      .from(bucketName)
      .list(orgId + '/', { limit: 500, offset: 0 });

    if (!error && files) {
      for (var j = 0; j < files.length; j++) {
        var f = files[j];
        var sz = (f.metadata && f.metadata.size) ? f.metadata.size : 0;
        result[category].total_bytes += sz;
        result[category].files.push({
          id: f.id || f.name,
          name: f.name,
          size_bytes: sz,
          path: orgId + '/' + f.name,
          created_at: f.created_at || null,
          bucket: bucketName,
          category: category
        });
      }
    }
  }

  await listBucket('event-fliers',        'event_fliers');
  await listBucket('newsletter-images',   'newsletters');
  await listBucket('org-photos',          'org_photos');
  await listBucket('organization-images', 'org_images');

  result.total_bytes =
    result.documents.total_bytes +
    result.event_fliers.total_bytes +
    result.newsletters.total_bytes +
    result.org_photos.total_bytes +
    result.org_images.total_bytes;

  return result;
}