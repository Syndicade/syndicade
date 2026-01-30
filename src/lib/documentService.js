/**
 * Document Service
 * API functions for Phase 6: Document Management
 * 
 * Handles:
 * - Folder CRUD operations
 * - Document upload/download
 * - Permissions and access control
 * - Storage usage tracking
 * - Access logging
 */

import { supabase } from './supabase';

// ============================================
// FOLDER OPERATIONS
// ============================================

/**
 * Fetch all folders for an organization
 */
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

/**
 * Fetch folder breadcrumbs (path from root to current folder)
 */
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

/**
 * Create a new folder
 */
export async function createFolder(folderData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('document_folders')
      .insert([{
        ...folderData,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating folder:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Update folder
 */
export async function updateFolder(folderId, updates) {
  try {
    const { data, error } = await supabase
      .from('document_folders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
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

/**
 * Delete folder (will cascade delete contents)
 */
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

/**
 * Create default folders for new organization
 */
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

/**
 * Fetch documents for an organization or folder
 */
export async function fetchDocuments(organizationId, folderId = null) {
  try {
    let query = supabase
      .from('documents')
      .select(`
        *,
        folder:document_folders(id, name, color)
      `)
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null); // Root level only
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

/**
 * Search documents across organization
 */
export async function searchDocuments(organizationId, searchTerm, filters = {}) {
  try {
    let query = supabase
      .from('documents')
      .select('*, folder:document_folders(name)')
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    // Text search
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%`);
    }

    // Filter by file type
    if (filters.fileType) {
      query = query.eq('file_type', filters.fileType);
    }

    // Filter by folder
    if (filters.folderId) {
      query = query.eq('folder_id', filters.folderId);
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching documents:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch single document details
 */
export async function fetchDocument(documentId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        folder:document_folders(id, name)
      `)
      .eq('id', documentId)
      .single();

    if (error) throw error;

    // Log the view
    await logAccess(documentId, 'view');

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching document:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Upload document to storage and create database record
 */
export async function uploadDocument(file, metadata) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate file size (25MB max)
    if (file.size > 26214400) {
      throw new Error('File size exceeds 25MB limit');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${metadata.organizationId}/${metadata.folderId || 'root'}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL (even though bucket is private, we need the path)
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create database record
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
        tags: metadata.tags || [],
        category: metadata.category || null,
        visibility: metadata.visibility || 'members',
        uploaded_by: user.id,
        status: 'approved' // Auto-approve for now, can add workflow later
      }])
      .select()
      .single();

    if (docError) {
      // If database insert fails, delete the uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      throw docError;
    }

    // Log the upload
    await logAccess(docData.id, 'upload');

    return { data: docData, error: null };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Download document (creates signed URL)
 */
export async function downloadDocument(documentId) {
  try {
    // Get document details
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('file_url, file_name, allow_download, organization_id, folder_id')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;
    if (!doc.allow_download) throw new Error('Download not allowed for this document');

    // Extract path from file_url
    const urlParts = doc.file_url.split('/documents/');
    if (urlParts.length < 2) throw new Error('Invalid file URL');
    const filePath = urlParts[1];

    // Create signed URL (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (signedError) throw signedError;

    // Log the download
    await logAccess(documentId, 'download');

    return { data: { signedUrl: signedData.signedUrl, fileName: doc.file_name }, error: null };
  } catch (error) {
    console.error('Error downloading document:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Update document metadata
 */
export async function updateDocument(documentId, updates) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;

    // Log the edit
    await logAccess(documentId, 'edit');

    return { data, error: null };
  } catch (error) {
    console.error('Error updating document:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Delete document (removes file from storage and database record)
 */
export async function deleteDocument(documentId) {
  try {
    // Get document details
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;

    // Extract path from URL
    const urlParts = doc.file_url.split('/documents/');
    if (urlParts.length >= 2) {
      const filePath = urlParts[1];
      
      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([filePath]);
    }

    // Delete database record (will cascade to access logs, reads, etc.)
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

/**
 * Move document to a different folder
 * Updates folder_id and triggers folder stats update via database trigger
 */
export async function moveDocument(documentId, newFolderId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        folder_id: newFolderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;

    // Log the move
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

/**
 * Log document access (view, download, upload, edit, delete)
 */
async function logAccess(documentId, action) {
  try {
    await supabase.rpc('log_document_access', {
      doc_uuid: documentId,
      action_type: action
    });
  } catch (error) {
    // Don't fail the operation if logging fails
    console.error('Error logging access:', error);
  }
}

/**
 * Get access log for a document (admin only)
 */
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

/**
 * Mark document as read (for required reading)
 */
export async function markAsRead(documentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('document_reads')
      .insert([{
        document_id: documentId,
        member_id: user.id,
        completed: true
      }])
      .select();

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { error: error.message };
  }
}

/**
 * Check if current user has read a document
 */
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

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error;
    }

    return { hasRead: !!data, error: null };
  } catch (error) {
    console.error('Error checking read status:', error);
    return { hasRead: false, error: error.message };
  }
}

/**
 * Get reading statistics for required reading (admin only)
 */
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

/**
 * Get organization storage usage
 */
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

/**
 * Get document statistics
 */
export async function fetchDocumentStats(organizationId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('file_type, file_size_bytes, uploaded_at')
      .eq('organization_id', organizationId)
      .eq('is_current_version', true)
      .eq('status', 'approved');

    if (error) throw error;

    // Calculate stats
    const stats = {
      totalFiles: data.length,
      totalSize: data.reduce((sum, doc) => sum + doc.file_size_bytes, 0),
      byType: {},
      recentUploads: data.slice(0, 10).map(d => ({
        date: d.uploaded_at,
        size: d.file_size_bytes
      }))
    };

    // Group by file type
    data.forEach(doc => {
      const type = doc.file_type.split('/')[0]; // Get main type (e.g., 'image' from 'image/png')
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

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 */
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

/**
 * Validate file for upload
 */
export function validateFile(file, maxSize = 26214400) {
  const errors = [];

  // Check size
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${formatFileSize(maxSize)} limit`);
  }

  // Check if file exists
  if (!file || file.size === 0) {
    errors.push('File is empty or invalid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}