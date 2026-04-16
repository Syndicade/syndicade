import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { getStorageUsage, formatBytes } from '../lib/storageUtils';
import { useTheme } from '../context/ThemeContext';
import DocumentCard from '../components/DocumentCard';
import FileUploadModal from '../components/FileUploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import {
  LayoutGrid,
  List,
  FolderPlus,
  Upload,
  Search,
  X,
  Folder,
  Trash2,
  FileText,
  HardDrive,
  AlertTriangle
} from 'lucide-react';

function DocumentLibrary() {
  var { organizationId } = useParams();
  var { isDark } = useTheme();

  var [folders, setFolders] = useState([]);
  var [documents, setDocuments] = useState([]);
  var [currentFolder, setCurrentFolder] = useState(null);
  var [breadcrumbs, setBreadcrumbs] = useState([]);
  var [storageUsage, setStorageUsage] = useState(null);
  var [storageInfo, setStorageInfo] = useState(null);
  var [organization, setOrganization] = useState(null);

  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [viewMode, setViewMode] = useState('grid');
  var [showUploadModal, setShowUploadModal] = useState(false);
  var [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  var [userRole, setUserRole] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);

  // Theme classes
  var bg = isDark ? 'bg-[#0E1523]' : 'bg-gray-50';
  var card = isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200';
  var textPrimary = isDark ? 'text-white' : 'text-gray-900';
  var textSecondary = isDark ? 'text-[#CBD5E1]' : 'text-gray-600';
  var textMuted = isDark ? 'text-[#94A3B8]' : 'text-gray-500';
  var inputBg = isDark ? 'bg-[#1E2845] border-[#2A3550] text-white placeholder-[#64748B]' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  var folderCard = isDark ? 'bg-[#1A2035] border-[#2A3550] hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500';

  useEffect(function() {
    async function fetchOrganization() {
      var { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();
      if (data) setOrganization(data);
    }
    fetchOrganization();
  }, [organizationId]);

  useEffect(function() {
    async function checkRole() {
      var { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      var { data } = await supabase
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

  useEffect(function() {
    fetchData();
  }, [organizationId, currentFolder]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      var { data: foldersData, error: foldersError } = await fetchFolders(organizationId);
      if (foldersError) throw new Error(foldersError);
      setFolders(foldersData || []);

      var { data: docsData, error: docsError } = await fetchDocuments(
        organizationId,
        currentFolder ? currentFolder.id : null
      );
      if (docsError) throw new Error(docsError);

      var uniqueDocs = docsData
        ? Array.from(new Map(docsData.map(function(d) { return [d.id, d]; })).values())
        : [];
      setDocuments(uniqueDocs);

      var { data: usageData, error: usageError } = await fetchStorageUsage(organizationId);
      if (usageError) throw new Error(usageError);
      setStorageUsage(usageData);

      var info = await getStorageUsage(organizationId);
      setStorageInfo(info);

      if (currentFolder) {
        setBreadcrumbs([
          { id: null, name: 'Documents' },
          { id: currentFolder.id, name: currentFolder.name }
        ]);
      } else {
        setBreadcrumbs([{ id: null, name: 'Documents' }]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchData();
      return;
    }
    setLoading(true);
    var { data, error: searchError } = await searchDocuments(organizationId, searchTerm);
    if (searchError) {
      setError(searchError);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  }

  function navigateToFolder(folder) {
    setCurrentFolder(folder);
  }

  function handleFolderCreated(newFolder) {
    setFolders([...folders, newFolder]);
    setShowCreateFolderModal(false);
    mascotSuccessToast('Folder created!');
  }

  function handleDocumentUploaded(newDoc) {
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    fetchData(); // refresh storage meter
    mascotSuccessToast('Document uploaded!');
  }

  async function handleDeleteFolder(folderId) {
    if (!confirm('Delete this folder? This will delete all documents inside it.')) return;
    var { error: deleteError } = await deleteFolder(folderId);
    if (deleteError) {
      toast.error('Error deleting folder.');
    } else {
      setFolders(folders.filter(function(f) { return f.id !== folderId; }));
      mascotSuccessToast('Folder deleted.');
    }
  }

  async function handleDeleteDocument(documentId) {
    if (!confirm('Delete this document permanently?')) return;
    var { error: deleteError } = await deleteDocument(documentId);
    if (deleteError) {
      toast.error('Error deleting document.');
    } else {
      setDocuments(documents.filter(function(d) { return d.id !== documentId; }));
      fetchData();
      mascotSuccessToast('Document deleted.');
    }
  }

  function handleUpdateDocument(updatedDoc) {
    setDocuments(function(prev) {
      var exists = prev.some(function(d) { return d.id === updatedDoc.id; });
      if (exists) {
        return prev.map(function(d) { return d.id === updatedDoc.id ? updatedDoc : d; });
      }
      return prev;
    });
  }

  function handleUploadClick() {
    if (storageInfo && storageInfo.isBlocked) {
      toast.error('Storage limit reached. Upgrade your plan to upload more files.');
      return;
    }
    if (storageInfo && storageInfo.isWarning) {
      toast('Storage is above 90% — consider upgrading soon.', { icon: null });
    }
    setShowUploadModal(true);
  }

  var currentFolders = folders.filter(function(f) {
    return currentFolder ? f.parent_folder_id === currentFolder.id : !f.parent_folder_id;
  });

  // Storage meter colors
  var storagePercent = storageInfo ? Math.min(storageInfo.percent, 100) : 0;
  var storageMeterColor = storagePercent >= 100 ? '#EF4444'
    : storagePercent >= 90 ? '#EF4444'
    : storagePercent >= 80 ? '#F5B731'
    : '#3B82F6';

  // Loading state — skeletons
  if (loading && !documents.length) {
    return (
      <div className={'min-h-screen ' + bg}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={'h-8 w-48 rounded-lg mb-2 animate-pulse ' + (isDark ? 'bg-[#1A2035]' : 'bg-gray-200')} />
          <div className={'h-4 w-32 rounded mb-8 animate-pulse ' + (isDark ? 'bg-[#1A2035]' : 'bg-gray-200')} />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6].map(function(i) {
              return (
                <div key={i} className={'h-32 rounded-xl animate-pulse ' + (isDark ? 'bg-[#1A2035]' : 'bg-gray-200')} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={'min-h-screen ' + bg}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={'border rounded-xl p-8 text-center ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')} role="alert">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" aria-hidden="true" />
            <h2 className={'text-lg font-semibold mb-2 ' + textPrimary}>Error Loading Documents</h2>
            <p className={'mb-4 ' + textSecondary}>{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen ' + bg}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page Title Row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={'text-2xl font-extrabold ' + textPrimary}>Document Library</h1>
            <p className={'text-sm mt-1 ' + textMuted}>
              {storageUsage ? (storageUsage.total_files + ' files \u2022 ' + formatFileSize(storageUsage.total_bytes) + ' used') : 'Loading...'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className={'flex items-center rounded-lg p-1 border ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-100 border-gray-200')}>
              <button
                onClick={function() { setViewMode('grid'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'grid' ? (isDark ? 'bg-[#2A3550] text-white' : 'bg-white text-blue-600 shadow-sm') : textMuted)}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={function() { setViewMode('list'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'list' ? (isDark ? 'bg-[#2A3550] text-white' : 'bg-white text-blue-600 shadow-sm') : textMuted)}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={function() { setShowCreateFolderModal(true); }}
                className={'px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ' + (isDark ? 'bg-[#1A2035] border-[#2A3550] text-white hover:bg-[#1E2845]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')}
                aria-label="Create new folder"
              >
                <FolderPlus className="w-4 h-4" aria-hidden="true" />
                New Folder
              </button>
            )}

            <button
              onClick={handleUploadClick}
              disabled={storageInfo && storageInfo.isBlocked}
              className={'px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ' + (storageInfo && storageInfo.isBlocked ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600')}
              aria-label="Upload document"
              aria-disabled={storageInfo && storageInfo.isBlocked}
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              Upload
            </button>
          </div>
        </div>

        {/* Storage Meter */}
        {storageInfo && (
          <div className={'rounded-xl border p-4 mb-6 ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className={'w-4 h-4 ' + (storageInfo.isBlocked ? 'text-red-400' : storageInfo.isWarning ? 'text-yellow-400' : 'text-blue-400')} aria-hidden="true" />
                <span className={'text-sm font-semibold ' + textPrimary}>Storage</span>
              </div>
              <span className={'text-sm ' + textMuted}>
                {formatBytes(storageInfo.usedBytes)} / {formatBytes(storageInfo.limitBytes)}
              </span>
            </div>
            <div className={'w-full rounded-full h-2 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} role="progressbar" aria-valuenow={Math.round(storagePercent)} aria-valuemin={0} aria-valuemax={100} aria-label={'Storage used: ' + Math.round(storagePercent) + '%'}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: Math.min(storagePercent, 100) + '%', backgroundColor: storageMeterColor }}
              />
            </div>
            {storageInfo.isBlocked && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                Storage full — upgrade your plan to upload more files.
              </p>
            )}
            {!storageInfo.isBlocked && storageInfo.isWarning && (
              <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                Storage above 90% — consider upgrading soon.
              </p>
            )}
          </div>
        )}

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map(function(crumb, index) {
              return (
                <li key={crumb.id || 'root'} className="flex items-center gap-2">
                  {index > 0 && <span className={textMuted}>/</span>}
                  <button
                    onClick={function() { navigateToFolder(crumb.id ? folders.find(function(f) { return f.id === crumb.id; }) : null); }}
                    className={'hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ' + (index === breadcrumbs.length - 1 ? textPrimary + ' font-semibold' : 'text-blue-400 hover:text-blue-300')}
                  >
                    {crumb.name}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className={'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ' + textMuted} aria-hidden="true" />
              <input
                type="text"
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                placeholder="Search documents by name, description, or tags..."
                className={'w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ' + inputBg}
                aria-label="Search documents"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold text-sm"
            >
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={function() { setSearchTerm(''); fetchData(); }}
                className={'px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm ' + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1A2035]' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        {/* Folders */}
        {currentFolders.length > 0 && (
          <section className="mb-8" aria-label="Folders">
            <h2 className={'text-base font-semibold mb-4 ' + textPrimary}>Folders</h2>
            <div className={'grid gap-4 ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
              {currentFolders.map(function(folder) {
                return (
                  <div
                    key={folder.id}
                    className={'border rounded-xl p-4 cursor-pointer transition-all group ' + folderCard}
                    onClick={function() { navigateToFolder(folder); }}
                    onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { navigateToFolder(folder); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={'Open folder: ' + folder.name}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Folder className="w-8 h-8 text-blue-400 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <h3 className={'font-semibold truncate ' + textPrimary}>{folder.name}</h3>
                          {folder.description && (
                            <p className={'text-sm truncate mt-0.5 ' + textSecondary}>{folder.description}</p>
                          )}
                          <p className={'text-xs mt-1 ' + textMuted}>
                            {folder.file_count} {folder.file_count === 1 ? 'file' : 'files'}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={function(e) { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500 hover:bg-opacity-10 rounded transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={'Delete folder: ' + folder.name}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Documents */}
        <section aria-label="Documents">
          <h2 className={'text-base font-semibold mb-4 ' + textPrimary}>
            {'Documents' + (documents.length > 0 ? ' (' + documents.length + ')' : '')}
          </h2>

          {documents.length === 0 ? (
            <div className={'rounded-xl border-2 border-dashed p-12 text-center ' + (isDark ? 'border-[#2A3550]' : 'border-gray-300')}>
              <FileText className={'w-10 h-10 mx-auto mb-3 ' + textMuted} aria-hidden="true" />
              <h3 className={'font-semibold mb-1 ' + textPrimary}>
                {searchTerm ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className={'text-sm mb-4 ' + textSecondary}>
                {searchTerm ? 'Try a different search term.' : 'Upload your first document to get started.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleUploadClick}
                  disabled={storageInfo && storageInfo.isBlocked}
                  className={'px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (storageInfo && storageInfo.isBlocked ? 'opacity-50 cursor-not-allowed' : '')}
                >
                  Upload Your First Document
                </button>
              )}
            </div>
          ) : (
            <div className={'grid gap-4 ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
              {documents.map(function(doc) {
                return (
                  <DocumentCard
                    key={doc.id + '-' + (doc.updated_at || doc.uploaded_at)}
                    document={doc}
                    viewMode={viewMode}
                    isAdmin={isAdmin}
                    organizationId={organizationId}
                    onDelete={handleDeleteDocument}
                    onUpdate={handleUpdateDocument}
                  />
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Modals */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={function() { setShowUploadModal(false); }}
          organizationId={organizationId}
          folderId={currentFolder ? currentFolder.id : null}
          onSuccess={handleDocumentUploaded}
        />
      )}

      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={function() { setShowCreateFolderModal(false); }}
          organizationId={organizationId}
          parentFolderId={currentFolder ? currentFolder.id : null}
          onSuccess={handleFolderCreated}
        />
      )}
    </div>
  );
}

export default DocumentLibrary;