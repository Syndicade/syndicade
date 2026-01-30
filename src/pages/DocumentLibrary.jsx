import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchFolders, 
  fetchDocuments, 
  searchDocuments,
  fetchStorageUsage,
  createFolder,
  deleteFolder,
  deleteDocument,
  formatFileSize,
  getFileIcon
} from '../lib/documentService';
import { supabase } from '../lib/supabase';
import DocumentCard from '../components/DocumentCard';
import FileUploadModal from '../components/FileUploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import { Skeleton } from '../components/Skeletons';

/**
 * DocumentLibrary Component
 * 
 * Main page for document management with:
 * - Folder navigation
 * - Document grid/list view
 * - Search and filters
 * - Upload functionality
 * - Storage usage display
 * 
 * ADA Compliant:
 * - Keyboard navigation
 * - ARIA labels
 * - Screen reader support
 * - Focus management
 */
function DocumentLibrary() {
  const { organizationId } = useParams();
  const navigate = useNavigate();

  // State
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [storageUsage, setStorageUsage] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  
  // Permissions
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user role
  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .single();

      if (data) {
        setUserRole(data.role);
        setIsAdmin(data.role === 'admin');
      }
    }

    checkRole();
  }, [organizationId]);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [organizationId, currentFolder]);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch folders
      const { data: foldersData, error: foldersError } = await fetchFolders(organizationId);
      if (foldersError) throw new Error(foldersError);
      setFolders(foldersData || []);

      // Fetch documents
      const { data: docsData, error: docsError } = await fetchDocuments(
        organizationId, 
        currentFolder?.id || null
      );
      if (docsError) throw new Error(docsError);
      
      // Deduplicate documents by ID (in case database has duplicates)
      const uniqueDocs = docsData ? 
        Array.from(new Map(docsData.map(d => [d.id, d])).values()) : 
        [];
      setDocuments(uniqueDocs);

      // Fetch storage usage
      const { data: usageData, error: usageError } = await fetchStorageUsage(organizationId);
      if (usageError) throw new Error(usageError);
      setStorageUsage(usageData);

      // Update breadcrumbs
      if (currentFolder) {
        // Build breadcrumb trail
        const trail = [{ id: null, name: 'Documents' }];
        // Add parent folders... (simplified for MVP)
        trail.push({ id: currentFolder.id, name: currentFolder.name });
        setBreadcrumbs(trail);
      } else {
        setBreadcrumbs([{ id: null, name: 'Documents' }]);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Search handler
  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchData();
      return;
    }

    setLoading(true);
    const { data, error: searchError } = await searchDocuments(organizationId, searchTerm);
    if (searchError) {
      setError(searchError);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  }

  // Navigate to folder
  function navigateToFolder(folder) {
    setCurrentFolder(folder);
  }

  // Handle folder creation
  async function handleFolderCreated(newFolder) {
    setFolders([...folders, newFolder]);
    setShowCreateFolderModal(false);
  }

  // Handle document upload
  async function handleDocumentUploaded(newDoc) {
    console.log('📤 handleDocumentUploaded called (THIS SHOULD ONLY HAPPEN ON UPLOAD!)');
    console.log('   New doc ID:', newDoc.id);
    console.log('   New doc title:', newDoc.title);
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
  }

  // Handle folder delete
  async function handleDeleteFolder(folderId) {
    if (!confirm('Delete this folder? This will delete all documents inside it.')) return;

    const { error: deleteError } = await deleteFolder(folderId);
    if (deleteError) {
      alert(`Error deleting folder: ${deleteError}`);
    } else {
      setFolders(folders.filter(f => f.id !== folderId));
    }
  }

  // Handle document delete
  async function handleDeleteDocument(documentId) {
    if (!confirm('Delete this document permanently?')) return;

    const { error: deleteError } = await deleteDocument(documentId);
    if (deleteError) {
      alert(`Error deleting document: ${deleteError}`);
    } else {
      setDocuments(documents.filter(d => d.id !== documentId));
    }
  }

  // Handle document update
  function handleUpdateDocument(updatedDoc) {
    console.log('📝 handleUpdateDocument called');
    console.log('   Updated doc ID:', updatedDoc.id);
    console.log('   Updated doc title:', updatedDoc.title);
    console.log('   Current documents count:', documents.length);
    console.log('   Current document IDs:', documents.map(d => d.id));
    
    setDocuments(prevDocuments => {
      console.log('   Previous documents:', prevDocuments.length);
      
      // Check if document already exists
      const exists = prevDocuments.some(d => d.id === updatedDoc.id);
      console.log('   Document exists?', exists);
      
      if (exists) {
        // Replace existing document
        const updated = prevDocuments.map(d => 
          d.id === updatedDoc.id ? updatedDoc : d
        );
        console.log('   After update:', updated.length);
        return updated;
      } else {
        // This shouldn't happen, but just in case
        console.warn('   ⚠️ Document not found in list, not adding:', updatedDoc.id);
        return prevDocuments;
      }
    });
  }

  // Get folders for current level
  const currentFolders = folders.filter(f => 
    currentFolder ? f.parent_folder_id === currentFolder.id : !f.parent_folder_id
  );

  if (loading && !documents.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton variant="title" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} variant="card" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Documents</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
          {storageUsage && (
            <p className="text-sm text-gray-600 mt-1">
              {storageUsage.total_files} files • {formatFileSize(storageUsage.total_bytes)} used
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Grid view"
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="List view"
            >
              ☰ List
            </button>
          </div>

          {/* Create Folder Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Create new folder"
            >
              📁 New Folder
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Upload document"
          >
            ⬆️ Upload
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.id || 'root'} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={() => navigateToFolder(crumb.id ? folders.find(f => f.id === crumb.id) : null)}
                className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {crumb.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by name, description, or tags..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search documents"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            🔍 Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchData();
              }}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-lg"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Folders Grid */}
      {currentFolders.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {currentFolders.map(folder => (
              <div
                key={folder.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigateToFolder(folder)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigateToFolder(folder);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open folder: ${folder.name}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="text-3xl flex-shrink-0"
                      style={{ color: folder.color || '#6B7280' }}
                      aria-hidden="true"
                    >
                      📁
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {folder.name}
                      </h3>
                      {folder.description && (
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {folder.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {folder.file_count} {folder.file_count === 1 ? 'file' : 'files'}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete folder: ${folder.name}`}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Documents Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Documents {documents.length > 0 && `(${documents.length})`}
        </h2>

        {documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 text-lg mb-4">
              {searchTerm ? 'No documents found matching your search.' : 'No documents yet.'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {documents.map(doc => (
              <DocumentCard
                key={`${doc.id}-${doc.updated_at || doc.uploaded_at}`}
                document={doc}
                viewMode={viewMode}
                isAdmin={isAdmin}
                organizationId={organizationId}
                onDelete={handleDeleteDocument}
                onUpdate={handleUpdateDocument}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          organizationId={organizationId}
          folderId={currentFolder?.id}
          onSuccess={handleDocumentUploaded}
        />
      )}

      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          organizationId={organizationId}
          parentFolderId={currentFolder?.id}
          onSuccess={handleFolderCreated}
        />
      )}
    </div>
  );
}

export default DocumentLibrary;