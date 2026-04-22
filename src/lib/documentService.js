/**
 * Document Service
 * API functions for Phase 6: Document Management
 */

import { supabase } from './supabase';

// ============================================
// FOLDER OPERATIONS
// ============================================

export async function fetchFolders(organizationId) {
  try {
    var result = await supabase
      .from('document_folders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('parent_folder_id', { nullsFirst: true })
      .order('sort_order')
      .order('name');

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching folders:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchFolderBreadcrumbs(folderId) {
  try {
    var result = await supabase
      .rpc('get_folder_breadcrumbs', { folder_uuid: folderId });

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching breadcrumbs:', error);
    return { data: null, error: error.message };
  }
}

export async function createFolder(folderData) {
  try {
    var userResult = await supabase.auth.getUser();
    if (!userResult.data || !userResult.data.user) throw new Error('Not authenticated');
    var user = userResult.data.user;

    var result = await supabase
      .from('document_folders')
      .insert([{ ...folderData, created_by: user.id }])
      .select()
      .single();

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error creating folder:', error);
    return { data: null, error: error.message };
  }
}

export async function updateFolder(folderId, updates) {
  try {
    var result = await supabase
      .from('document_folders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error updating folder:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteFolder(folderId) {
  try {
    var result = await supabase
      .from('document_folders')
      .delete()
      .eq('id', folderId);

    if (result.error) throw result.error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting folder:', error);
    return { error: error.message };
  }
}

export async function createDefaultFolders(organizationId) {
  try {
    var result = await supabase
      .rpc('create_default_folders', { org_uuid: organizationId });

    if (result.error) throw result.error;
    return { error: null };
  } catch (error) {
    console.error('Error creating default folders:', error);
    return { error: error.message };
  }
}

// ============================================
// DOCUMENT OPERATIONS
// ============================================

export async function fetchDocuments(organizationId, folderId) {
  try {
    var query = supabase
      .from('documents')
      .select(
        '*, ' +
        'folder:document_folders(id, name, color), ' +
        'uploader:members!uploaded_by(user_id, first_name, last_name, display_name, avatar_url), ' +
        'view_count:document_views(count)'
      )
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }

    query = query.order('uploaded_at', { ascending: false });

    var result = await query;
    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { data: null, error: error.message };
  }
}

export async function searchDocuments(organizationId, searchTerm, filters) {
  try {
    var query = supabase
      .from('documents')
      .select(
        '*, ' +
        'folder:document_folders(name), ' +
        'uploader:members!uploaded_by(user_id, first_name, last_name, display_name, avatar_url), ' +
        'view_count:document_views(count)'
      )
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (searchTerm) {
      query = query.or(
        'title.ilike.%' + searchTerm + '%,' +
        'description.ilike.%' + searchTerm + '%,' +
        'file_name.ilike.%' + searchTerm + '%'
      );
    }

    if (filters) {
      if (filters.fileType) query = query.eq('file_type', filters.fileType);
      if (filters.folderId) query = query.eq('folder_id', filters.folderId);
      if (filters.tags && filters.tags.length > 0) query = query.contains('tags', filters.tags);
    }

    var result = await query.order('uploaded_at', { ascending: false });
    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error searching documents:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchDocument(documentId) {
  try {
    var result = await supabase
      .from('documents')
      .select(
        '*, ' +
        'folder:document_folders(id, name), ' +
        'uploader:members!uploaded_by(user_id, first_name, last_name, display_name, avatar_url)'
      )
      .eq('id', documentId)
      .single();

    if (result.error) throw result.error;
    await logAccess(documentId, 'view');
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching document:', error);
    return { data: null, error: error.message };
  }
}

export async function uploadDocument(file, metadata) {
  try {
    var userResult = await supabase.auth.getUser();
    if (!userResult.data || !userResult.data.user) throw new Error('Not authenticated');
    var user = userResult.data.user;

    if (file.size > 26214400) {
      throw new Error('File size exceeds 25MB limit');
    }

    var fileExt = file.name.split('.').pop();
    var fileName = Date.now() + '-' + Math.random().toString(36).substring(7) + '.' + fileExt;
    var filePath = metadata.organizationId + '/' + (metadata.folderId || 'root') + '/' + fileName;

    var uploadResult = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadResult.error) throw uploadResult.error;

    var urlResult = supabase.storage.from('documents').getPublicUrl(filePath);
    var publicUrl = urlResult.data.publicUrl;

    var docResult = await supabase
      .from('documents')
      .insert([{
        organization_id: metadata.organizationId,
        folder_id: metadata.folderId || null,
        title: metadata.title || file.name,
        description: metadata.description || null,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_extension: fileExt,
        file_size_bytes: file.size,
        storage_path: filePath,
        tags: metadata.tags || [],
        category: metadata.category || null,
        visibility: metadata.visibility || 'members',
        allowed_groups: metadata.allowedGroups || [],
        uploaded_by: user.id,
        status: 'approved',
      }])
      .select()
      .single();

    if (docResult.error) {
      await supabase.storage.from('documents').remove([filePath]);
      throw docResult.error;
    }

    await logAccess(docResult.data.id, 'upload');
    return { data: docResult.data, error: null };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { data: null, error: error.message };
  }
}

export async function downloadDocument(documentId) {
  try {
    var docResult = await supabase
      .from('documents')
      .select('file_url, file_name, allow_download, storage_path')
      .eq('id', documentId)
      .single();

    if (docResult.error) throw docResult.error;
    if (!docResult.data.allow_download) throw new Error('Download not allowed for this document');

    var filePath = docResult.data.storage_path || (function() {
      var urlParts = docResult.data.file_url.split('/documents/');
      if (urlParts.length < 2) throw new Error('Invalid file URL');
      return urlParts[1];
    })();

    var signedResult = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (signedResult.error) throw signedResult.error;
    await logAccess(documentId, 'download');
    return { data: { signedUrl: signedResult.data.signedUrl, fileName: docResult.data.file_name }, error: null };
  } catch (error) {
    console.error('Error downloading document:', error);
    return { data: null, error: error.message };
  }
}

export async function updateDocument(documentId, updates) {
  try {
    var result = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();

    if (result.error) throw result.error;
    await logAccess(documentId, 'edit');
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error updating document:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteDocument(documentId) {
  try {
    var docResult = await supabase
      .from('documents')
      .select('file_url, storage_path')
      .eq('id', documentId)
      .single();

    if (docResult.error) throw docResult.error;

    var filePath = docResult.data.storage_path || (function() {
      var urlParts = docResult.data.file_url.split('/documents/');
      return urlParts.length >= 2 ? urlParts[1] : null;
    })();

    if (filePath) {
      await supabase.storage.from('documents').remove([filePath]);
    }

    var deleteResult = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteResult.error) throw deleteResult.error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { error: error.message };
  }
}

export async function moveDocument(documentId, newFolderId) {
  try {
    var result = await supabase
      .from('documents')
      .update({ folder_id: newFolderId, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();

    if (result.error) throw result.error;
    await logAccess(documentId, 'edit');
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error moving document:', error);
    return { data: null, error: error.message };
  }
}

// ============================================
// DOCUMENT VIEWS
// ============================================

/**
 * Record that the current user viewed a document.
 * Uses upsert — each member gets one row per document, updated_at refreshes on repeat views.
 */
export async function recordDocumentView(documentId) {
  try {
    var userResult = await supabase.auth.getUser();
    if (!userResult.data || !userResult.data.user) return { error: null }; // silently skip if not authed

    var user = userResult.data.user;

    var result = await supabase
      .from('document_views')
      .upsert(
        { document_id: documentId, member_id: user.id, viewed_at: new Date().toISOString() },
        { onConflict: 'document_id,member_id' }
      );

    if (result.error) throw result.error;
    return { error: null };
  } catch (error) {
    console.error('Error recording document view:', error);
    return { error: error.message };
  }
}

/**
 * Fetch list of members who have viewed a document.
 * Admin/editor only — enforced in UI, backed by RLS.
 * Returns: [{ member_id, viewed_at, member: { first_name, last_name, display_name, avatar_url } }]
 */
export async function getDocumentViewers(documentId) {
  try {
    var result = await supabase
      .from('document_views')
      .select(
        'member_id, viewed_at, ' +
        'member:members!member_id(user_id, first_name, last_name, display_name, avatar_url)'
      )
      .eq('document_id', documentId)
      .order('viewed_at', { ascending: false });

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching document viewers:', error);
    return { data: null, error: error.message };
  }
}

// ============================================
// ACCESS CONTROL & LOGGING
// ============================================

async function logAccess(documentId, action) {
  try {
    await supabase.rpc('log_document_access', {
      doc_uuid: documentId,
      action_type: action,
    });
  } catch (error) {
    console.error('Error logging access:', error);
  }
}

export async function fetchAccessLog(documentId) {
  try {
    var result = await supabase
      .from('document_access_log')
      .select('*, member:member_id(id)')
      .eq('document_id', documentId)
      .order('accessed_at', { ascending: false })
      .limit(50);

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching access log:', error);
    return { data: null, error: error.message };
  }
}

export async function markAsRead(documentId) {
  try {
    var userResult = await supabase.auth.getUser();
    if (!userResult.data || !userResult.data.user) throw new Error('Not authenticated');
    var user = userResult.data.user;

    var result = await supabase
      .from('document_reads')
      .insert([{ document_id: documentId, member_id: user.id, completed: true }])
      .select();

    if (result.error && result.error.code !== '23505') throw result.error;
    return { error: null };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { error: error.message };
  }
}

export async function hasUserRead(documentId) {
  try {
    var userResult = await supabase.auth.getUser();
    if (!userResult.data || !userResult.data.user) return { hasRead: false, error: null };
    var user = userResult.data.user;

    var result = await supabase
      .from('document_reads')
      .select('id')
      .eq('document_id', documentId)
      .eq('member_id', user.id)
      .single();

    if (result.error && result.error.code !== 'PGRST116') throw result.error;
    return { hasRead: !!result.data, error: null };
  } catch (error) {
    console.error('Error checking read status:', error);
    return { hasRead: false, error: error.message };
  }
}

export async function fetchReadingStats(documentId) {
  try {
    var result = await supabase
      .from('document_reads')
      .select('member_id, read_at, completed')
      .eq('document_id', documentId);

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    return { data: result.data, error: error.message };
  }
}

// ============================================
// STORAGE & ANALYTICS
// ============================================

export async function fetchStorageUsage(organizationId) {
  try {
    var result = await supabase
      .rpc('get_organization_storage_usage', { org_uuid: organizationId });

    if (result.error) throw result.error;
    return { data: result.data[0] || { total_files: 0, total_bytes: 0, total_mb: 0 }, error: null };
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchDocumentStats(organizationId) {
  try {
    var result = await supabase
      .from('documents')
      .select('file_type, file_size_bytes, uploaded_at')
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (result.error) throw result.error;

    var stats = {
      totalFiles: result.data.length,
      totalSize: result.data.reduce(function(sum, doc) { return sum + doc.file_size_bytes; }, 0),
      byType: {},
      recentUploads: result.data.slice(0, 10).map(function(d) { return { date: d.uploaded_at, size: d.file_size_bytes }; }),
    };

    result.data.forEach(function(doc) {
      var type = doc.file_type.split('/')[0];
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching document stats:', error);
    return { data: null, error: error.message };
  }
}

// ============================================
// UTILITIES
// ============================================

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  var k = 1024;
  var sizes = ['Bytes', 'KB', 'MB', 'GB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function getFileIcon(fileType) {
  if (!fileType) return 'file';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'music';
  if (fileType.includes('pdf')) return 'file-text';
  if (fileType.includes('word') || fileType.includes('document')) return 'file-text';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'table';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'presentation';
  if (fileType.includes('zip') || fileType.includes('rar')) return 'archive';
  return 'file';
}

export function validateFile(file, maxSize) {
  var limit = maxSize || 26214400;
  var errors = [];
  if (file.size > limit) errors.push('File size exceeds ' + formatFileSize(limit) + ' limit');
  if (!file || file.size === 0) errors.push('File is empty or invalid');
  return { isValid: errors.length === 0, errors: errors };
}

/**
 * Get a member's display name from an uploader object.
 * Prefers display_name, falls back to first + last, then 'Unknown'.
 */
export function getUploaderName(uploader) {
  if (!uploader) return 'Unknown';
  if (uploader.display_name) return uploader.display_name;
  var parts = [uploader.first_name, uploader.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}