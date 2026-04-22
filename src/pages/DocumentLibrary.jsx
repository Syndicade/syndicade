import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import {
  fetchFolders,
  fetchDocuments,
  searchDocuments,
  fetchStorageUsage,
  deleteFolder,
  deleteDocument,
  formatFileSize
} from '../lib/documentService';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import DocumentCard from '../components/DocumentCard';
import FileUploadModal from '../components/FileUploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
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

  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [viewMode, setViewMode] = useState('grid');
  var [showUploadModal, setShowUploadModal] = useState(false);
  var [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  // userRole: 'admin' | 'editor' | 'member' | null
  var [userRole, setUserRole] = useState(null);

  // Read viewMode from OrgLayout outlet context so Admin/Member toggle is respected
  var outletCtx = useOutletContext() || {};
  var orgViewMode = outletCtx.viewMode || 'admin';
  var effectiveRole = (userRole === 'admin' && orgViewMode === 'member') ? 'member' : userRole;

  // Theme tokens
  var bg = isDark ? 'bg-[#0E1523]' : 'bg-gray-50';
  var card = isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200';
  var textPrimary = isDark ? 'text-white' : 'text-gray-900';
  var textSecondary = isDark ? 'text-[#CBD5E1]' : 'text-[#475569]';
  var textMuted = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  var inputBg = isDark
    ? 'bg-[#1E2845] border-[#2A3550] text-white placeholder-[#64748B]'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  var folderCard = isDark
    ? 'bg-[#1A2035] border-[#2A3550] hover:border-blue-500'
    : 'bg-white border-gray-200 hover:border-blue-500';
  var toggleActive = isDark ? 'bg-[#2A3550] text-white' : 'bg-white text-blue-600 shadow-sm';
  var toggleWrap = isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-100 border-gray-200';

  var isAdmin = effectiveRole === 'admin';
  var canManage = effectiveRole === 'admin' || effectiveRole === 'editor';
  var canUpload = effectiveRole === 'admin' || effectiveRole === 'editor';

  useEffect(function() {
    async function checkRole() {
      var userResult = await supabase.auth.getUser();
      if (!userResult.data || !userResult.data.user) return;
      var user = userResult.data.user;
      var result = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .single();
      if (result.data) {
        setUserRole(result.data.role);
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
      var foldersResult = await fetchFolders(organizationId);
      if (foldersResult.error) throw new Error(foldersResult.error);
      setFolders(foldersResult.data || []);

      var docsResult = await fetchDocuments(
        organizationId,
        currentFolder ? currentFolder.id : null
      );
      if (docsResult.error) throw new Error(docsResult.error);

      var uniqueDocs = docsResult.data
        ? Array.from(new Map(docsResult.data.map(function(d) { return [d.id, d]; })).values())
        : [];
      setDocuments(uniqueDocs);

      var usageResult = await fetchStorageUsage(organizationId);
      if (!usageResult.error) setStorageUsage(usageResult.data);

      if (currentFolder) {
        setBreadcrumbs([
          { id: null, name: 'Documents' },
          { id: currentFolder.id, name: currentFolder.name }
        ]);
      } else {
        setBreadcrumbs([{ id: null, name: 'Documents' }]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load documents.');
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
    var result = await searchDocuments(organizationId, searchTerm);
    if (result.error) {
      setError(result.error);
    } else {
      setDocuments(result.data || []);
    }
    setLoading(false);
  }

  function navigateToFolder(folder) {
    setCurrentFolder(folder || null);
  }

  function handleFolderCreated(newFolder) {
    setFolders([...folders, newFolder]);
    setShowCreateFolderModal(false);
    mascotSuccessToast('Folder created!');
  }

  function handleDocumentUploaded(newDoc) {
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    fetchData();
    mascotSuccessToast('Document uploaded!');
  }

  async function handleDeleteFolder(folderId, folderName) {
    if (!confirm('Delete "' + folderName + '"? All documents inside will be permanently deleted.')) return;
    var result = await deleteFolder(folderId);
    if (result.error) {
      mascotErrorToast('Failed to delete folder.', 'Please try again.');
    } else {
      setFolders(folders.filter(function(f) { return f.id !== folderId; }));
      mascotSuccessToast('Folder deleted.');
    }
  }

  async function handleDeleteDocument(documentId) {
    if (!confirm('Permanently delete this document?')) return;
    var result = await deleteDocument(documentId);
    if (result.error) {
      mascotErrorToast('Failed to delete document.', 'Please try again.');
    } else {
      setDocuments(documents.filter(function(d) { return d.id !== documentId; }));
      fetchData();
      mascotSuccessToast('Document deleted.');
    }
  }

  function handleUpdateDocument(updatedDoc) {
    setDocuments(function(prev) {
      return prev.map(function(d) { return d.id === updatedDoc.id ? updatedDoc : d; });
    });
  }

  var currentFolders = folders.filter(function(f) {
    return currentFolder ? f.parent_folder_id === currentFolder.id : !f.parent_folder_id;
  });

  var sectionLabel = isDark
    ? 'text-[#F5B731] text-xs font-bold uppercase tracking-widest mb-4'
    : 'text-[#64748B] text-xs font-bold uppercase tracking-widest mb-4';

  // ─── LOADING SKELETONS ───────────────────────────────────────────────────
  if (loading && !documents.length && !folders.length) {
    return (
      <div className={'min-h-screen ' + bg}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={'h-8 w-52 rounded-lg mb-2 animate-pulse ' + (isDark ? 'bg-[#1A2035]' : 'bg-gray-200')} />
          <div className={'h-4 w-36 rounded mb-6 animate-pulse ' + (isDark ? 'bg-[#1A2035]' : 'bg-gray-200')} />
          <div className={'h-10 w-full rounded-xl mb-6 animate-pulse ' + (isDark ? 'bg-[#1A2035]' : 'bg-gray-200')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(function(i) {
              return (
                <div key={i} className={'h-52 rounded-xl animate-pulse ' + (isDark ? 'bg-[#1A2035]' : 'bg-gray-200')} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── ERROR STATE ─────────────────────────────────────────────────────────
  if (error && !documents.length) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + bg}>
        <div className={'border rounded-xl p-10 text-center max-w-sm w-full ' + card} role="alert">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" aria-hidden="true" />
          <h2 className={'text-lg font-semibold mb-2 ' + textPrimary}>Failed to Load Documents</h2>
          <p className={'text-sm mb-5 ' + textMuted}>{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={'min-h-screen ' + bg}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className={'text-2xl font-extrabold ' + textPrimary}>Document Library</h1>
            <p className={'text-sm mt-1 ' + textMuted}>
              {storageUsage
                ? (storageUsage.total_files + ' files \u2022 ' + formatFileSize(storageUsage.total_bytes) + ' used')
                : '\u00a0'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Toggle */}
            <div className={'flex items-center rounded-lg p-1 border ' + toggleWrap}>
              <button
                onClick={function() { setViewMode('grid'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'grid' ? toggleActive : textMuted)}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={function() { setViewMode('list'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'list' ? toggleActive : textMuted)}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {canManage && (
              <button
                onClick={function() { setShowCreateFolderModal(true); }}
                className={'px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ' + (isDark ? 'bg-[#1A2035] border-[#2A3550] text-white hover:bg-[#1E2845]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')}
                aria-label="Create new folder"
              >
                <FolderPlus className="w-4 h-4" aria-hidden="true" />
                New Folder
              </button>
            )}

            {canUpload && (
              <button
                onClick={function() { setShowUploadModal(true); }}
                className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Upload document"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Upload
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav aria-label="Folder navigation" className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map(function(crumb, index) {
              var isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.id || 'root'} className="flex items-center gap-2">
                  {index > 0 && <span className={textMuted} aria-hidden="true">/</span>}
                  <button
                    onClick={function() {
                      navigateToFolder(crumb.id ? folders.find(function(f) { return f.id === crumb.id; }) : null);
                    }}
                    className={'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors '
                      + (isLast ? textPrimary + ' font-semibold cursor-default' : 'text-blue-400 hover:text-blue-300 hover:underline')}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.name}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6" role="search">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className={'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ' + textMuted} aria-hidden="true" />
              <input
                id="doc-search"
                type="search"
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                placeholder="Search by name, description, or tags..."
                className={'w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ' + inputBg}
                aria-label="Search documents"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={function() { setSearchTerm(''); fetchData(); }}
                className={'px-3 py-2.5 rounded-lg border text-sm flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 '
                  + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1A2035]' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Folders */}
        {currentFolders.length > 0 && (
          <section className="mb-8" aria-label="Folders">
            <h2 className={sectionLabel}>Folders</h2>
            <div className={'grid gap-4 ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
              {currentFolders.map(function(folder) {
                return (
                  <div
                    key={folder.id}
                    className={'border rounded-xl p-4 cursor-pointer transition-all group ' + folderCard}
                    onClick={function() { navigateToFolder(folder); }}
                    onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToFolder(folder); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={'Open folder: ' + folder.name}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Folder className="w-8 h-8 text-blue-400 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <h3 className={'font-semibold truncate text-sm ' + textPrimary}>{folder.name}</h3>
                          {folder.description && (
                            <p className={'text-xs truncate mt-0.5 ' + textSecondary}>{folder.description}</p>
                          )}
                          <p className={'text-xs mt-1 ' + textMuted}>
                            {folder.file_count || 0} {folder.file_count === 1 ? 'file' : 'files'}
                          </p>
                        </div>
                      </div>
                      {canManage && (
                        <button
                          onClick={function(e) { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded text-red-400 hover:bg-red-500 hover:bg-opacity-10 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
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
          <h2 className={sectionLabel}>
            {'Documents' + (documents.length > 0 ? ' (' + documents.length + ')' : '')}
          </h2>

          {documents.length === 0 ? (
            <div className={'rounded-xl border-2 border-dashed p-12 text-center ' + (isDark ? 'border-[#2A3550]' : 'border-gray-300')}>
              <FileText className={'w-10 h-10 mx-auto mb-3 ' + textMuted} aria-hidden="true" />
              <h3 className={'font-semibold mb-1 ' + textPrimary}>
                {searchTerm ? 'No Documents Found' : 'No Documents Yet'}
              </h3>
              <p className={'text-sm mb-5 ' + textSecondary}>
                {searchTerm
                  ? 'Try a different search term or clear the filter.'
                  : canUpload
                    ? 'Upload your first document to get started.'
                    : 'No documents have been added yet.'}
              </p>
              {!searchTerm && canUpload && (
                <button
                  onClick={function() { setShowUploadModal(true); }}
                  className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Upload Your First Document
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={function() { setSearchTerm(''); fetchData(); }}
                  className={'px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto border focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 '
                    + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1A2035]' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  Clear Search
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
                    userRole={effectiveRole}
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