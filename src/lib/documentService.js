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
    const { data, error } = await supabase
      .from('document_folders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('parent_folder_id', { nullsFirst: true })
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching folders:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchFolderBreadcrumbs(folderId) {
  try {
    const { data, error } = await supabase
      .rpc('get_folder_breadcrumbs', { folder_uuid: folderId });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching breadcrumbs:', error);
    return { data: null, error: error.message };
  }
}

export async function createFolder(folderData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('document_folders')
      .insert([{ ...folderData, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating folder:', error);
    return { data: null, error: error.message };
  }
}

export async function updateFolder(folderId, updates) {
  try {
    const { data, error } = await supabase
      .from('document_folders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating folder:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteFolder(folderId) {
  try {
    const { error } = await supabase
      .from('document_folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting folder:', error);
    return { error: error.message };
  }
}

export async function createDefaultFolders(organizationId) {
  try {
    const { error } = await supabase
      .rpc('create_default_folders', { org_uuid: organizationId });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error creating default folders:', error);
    return { error: error.message };
  }
}

// ============================================
// DOCUMENT OPERATIONS
// ============================================

export async function fetchDocuments(organizationId, folderId = null) {
  try {
    let query = supabase
      .from('documents')
      .select('*, folder:document_folders(id, name, color)')
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }

    query = query.order('uploaded_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { data: null, error: error.message };
  }
}

export async function searchDocuments(organizationId, searchTerm, filters = {}) {
  try {
    let query = supabase
      .from('documents')
      .select('*, folder:document_folders(name)')
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%`);
    }

    if (filters.fileType) query = query.eq('file_type', filters.fileType);
    if (filters.folderId) query = query.eq('folder_id', filters.folderId);
    if (filters.tags && filters.tags.length > 0) query = query.contains('tags', filters.tags);

    const { data, error } = await query.order('uploaded_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching documents:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchDocument(documentId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*, folder:document_folders(id, name)')
      .eq('id', documentId)
      .single();

    if (error) throw error;
    await logAccess(documentId, 'view');
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching document:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Upload document to storage and create database record.
 * Accepts optional allowedGroups (array of group UUIDs) and visibility.
 */
export async function uploadDocument(file, metadata) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (file.size > 26214400) {
      throw new Error('File size exceeds 25MB limit');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${metadata.organizationId}/${metadata.folderId || 'root'}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { data: docData, error: docError } = await supabase
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

    if (docError) {
      await supabase.storage.from('documents').remove([filePath]);
      throw docError;
    }

    await logAccess(docData.id, 'upload');
    return { data: docData, error: null };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { data: null, error: error.message };
  }
}

export async function downloadDocument(documentId) {
  try {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('file_url, file_name, allow_download, storage_path')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;
    if (!doc.allow_download) throw new Error('Download not allowed for this document');

    // Use storage_path if available, fall back to parsing file_url
    const filePath = doc.storage_path || (() => {
      const urlParts = doc.file_url.split('/documents/');
      if (urlParts.length < 2) throw new Error('Invalid file URL');
      return urlParts[1];
    })();

    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (signedError) throw signedError;
    await logAccess(documentId, 'download');
    return { data: { signedUrl: signedData.signedUrl, fileName: doc.file_name }, error: null };
  } catch (error) {
    console.error('Error downloading document:', error);
    return { data: null, error: error.message };
  }
}

export async function updateDocument(documentId, updates) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    await logAccess(documentId, 'edit');
    return { data, error: null };
  } catch (error) {
    console.error('Error updating document:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteDocument(documentId) {
  try {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('file_url, storage_path')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;

    const filePath = doc.storage_path || (() => {
      const urlParts = doc.file_url.split('/documents/');
      return urlParts.length >= 2 ? urlParts[1] : null;
    })();

    if (filePath) {
      await supabase.storage.from('documents').remove([filePath]);
    }

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;
    return { error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { error: error.message };
  }
}

export async function moveDocument(documentId, newFolderId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ folder_id: newFolderId, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    await logAccess(documentId, 'edit');
    return { data, error: null };
  } catch (error) {
    console.error('Error moving document:', error);
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
    const { data, error } = await supabase
      .from('document_access_log')
      .select('*, member:member_id(id)')
      .eq('document_id', documentId)
      .order('accessed_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching access log:', error);
    return { data: null, error: error.message };
  }
}

export async function markAsRead(documentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('document_reads')
      .insert([{ document_id: documentId, member_id: user.id, completed: true }])
      .select();

    if (error && error.code !== '23505') throw error;
    return { error: null };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { error: error.message };
  }
}

export async function hasUserRead(documentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasRead: false, error: null };

    const { data, error } = await supabase
      .from('document_reads')
      .select('id')
      .eq('document_id', documentId)
      .eq('member_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { hasRead: !!data, error: null };
  } catch (error) {
    console.error('Error checking read status:', error);
    return { hasRead: false, error: error.message };
  }
}

export async function fetchReadingStats(documentId) {
  try {
    const { data, error } = await supabase
      .from('document_reads')
      .select('member_id, read_at, completed')
      .eq('document_id', documentId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    return { data: null, error: error.message };
  }
}

// ============================================
// STORAGE & ANALYTICS
// ============================================

export async function fetchStorageUsage(organizationId) {
  try {
    const { data, error } = await supabase
      .rpc('get_organization_storage_usage', { org_uuid: organizationId });

    if (error) throw error;
    return { data: data[0] || { total_files: 0, total_bytes: 0, total_mb: 0 }, error: null };
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return { data: null, error: error.message };
  }
}

export async function fetchDocumentStats(organizationId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('file_type, file_size_bytes, uploaded_at')
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (error) throw error;

    const stats = {
      totalFiles: data.length,
      totalSize: data.reduce((sum, doc) => sum + doc.file_size_bytes, 0),
      byType: {},
      recentUploads: data.slice(0, 10).map(d => ({ date: d.uploaded_at, size: d.file_size_bytes })),
    };

    data.forEach(doc => {
      const type = doc.file_type.split('/')[0];
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
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
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

export function validateFile(file, maxSize = 26214400) {
  const errors = [];
  if (file.size > maxSize) errors.push(`File size exceeds ${formatFileSize(maxSize)} limit`);
  if (!file || file.size === 0) errors.push('File is empty or invalid');
  return { isValid: errors.length === 0, errors };
}