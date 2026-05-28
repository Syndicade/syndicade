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
import DocumentCard from '../components/DocumentCard';
import FileUploadModal from '../components/FileUploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import {
  LayoutGrid, List, FolderPlus, Upload, Search, X, Folder,
  Trash2, FileText, AlertTriangle, CheckSquare, Calendar
} from 'lucide-react';

function DocumentLibrary() {
  var { organizationId } = useParams();
  var outletCtx = useOutletContext() || {};
  var isAdmin = outletCtx.isAdmin || false;

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
  var [isEditor, setIsEditor] = useState(false);

  // Expiry filter + sort
  var [expiryFilter, setExpiryFilter] = useState('all');
  var [sortBy, setSortBy] = useState('date_desc');

  // Bulk select
  var [bulkSelectMode, setBulkSelectMode] = useState(false);
  var [selectedDocIds, setSelectedDocIds] = useState([]);
  var [showBulkExpiryModal, setShowBulkExpiryModal] = useState(false);
  var [bulkExpiryDate, setBulkExpiryDate] = useState('');
  var [bulkExpiryLoading, setBulkExpiryLoading] = useState(false);

  var canManage = isAdmin || isEditor;
  var canUpload = isAdmin || isEditor;

  // Only query DB for editor role — isAdmin already comes from outlet
  useEffect(function() {
    if (isAdmin) return;
    async function checkEditorRole() {
      var userResult = await supabase.auth.getUser();
      if (!userResult.data || !userResult.data.user) return;
      var result = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', userResult.data.user.id)
        .eq('status', 'active')
        .single();
      if (result.data && result.data.role === 'editor') setIsEditor(true);
    }
    checkEditorRole();
  }, [organizationId, isAdmin]);

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

      var docsResult = await fetchDocuments(organizationId, currentFolder ? currentFolder.id : null);
      if (docsResult.error) throw new Error(docsResult.error);

      var uniqueDocs = docsResult.data
        ? Array.from(new Map(docsResult.data.map(function(d) { return [d.id, d]; })).values())
        : [];
      setDocuments(uniqueDocs);

      var usageResult = await fetchStorageUsage(organizationId);
      if (!usageResult.error) setStorageUsage(usageResult.data);

      if (currentFolder) {
        setBreadcrumbs([{ id: null, name: 'Documents' }, { id: currentFolder.id, name: currentFolder.name }]);
      } else {
        setBreadcrumbs([{ id: null, name: 'Documents' }]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }

  // Returns: null | 'scheduled' | 'warning' (≤7d) | 'danger' (≤3d) | 'expired'
  function getExpiryStatus(doc) {
    if (!doc.delete_after) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var expiry = new Date(doc.delete_after + 'T00:00:00');
    expiry.setHours(0, 0, 0, 0);
    var diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 3) return 'danger';
    if (diffDays <= 7) return 'warning';
    return 'scheduled';
  }

  function getDaysUntilExpiry(doc) {
    if (!doc.delete_after) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var expiry = new Date(doc.delete_after + 'T00:00:00');
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  }

  // Expiry counts for filter tabs
  var expiringCount = documents.filter(function(d) {
    var days = getDaysUntilExpiry(d);
    return days !== null && days > 0 && days <= 7;
  }).length;

  var expiredCount = documents.filter(function(d) {
    var days = getDaysUntilExpiry(d);
    return days !== null && days <= 0;
  }).length;

  // Filter by expiry tab
  var filteredDocs = documents.filter(function(d) {
    if (expiryFilter === 'expiring_soon') {
      var days = getDaysUntilExpiry(d);
      return days !== null && days > 0 && days <= 7;
    }
    if (expiryFilter === 'expired') {
      var days = getDaysUntilExpiry(d);
      return days !== null && days <= 0;
    }
    return true;
  });

  // Sort
  var sortedDocs = filteredDocs.slice().sort(function(a, b) {
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'date_asc') {
      return new Date(a.uploaded_at || a.created_at) - new Date(b.uploaded_at || b.created_at);
    }
    if (sortBy === 'expiry_asc') {
      if (!a.delete_after && !b.delete_after) return 0;
      if (!a.delete_after) return 1;
      if (!b.delete_after) return -1;
      return new Date(a.delete_after) - new Date(b.delete_after);
    }
    // date_desc default
    return new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at);
  });

  // Storage bar
  var storagePercent = (storageUsage && storageUsage.max_bytes && storageUsage.max_bytes > 0)
    ? Math.min(100, (storageUsage.total_bytes / storageUsage.max_bytes) * 100)
    : 0;
  var storageBarColor = storagePercent >= 90 ? '#EF4444' : storagePercent >= 80 ? '#F59E0B' : '#22C55E';

  // Dynamic subtitle
  var subtitleParts = [];
  if (documents.length > 0) subtitleParts.push(documents.length + (documents.length === 1 ? ' document' : ' documents'));
  if (expiringCount > 0) subtitleParts.push(expiringCount + ' expiring soon');
  if (expiredCount > 0) subtitleParts.push(expiredCount + ' expired');
  if (storageUsage && !storageUsage.max_bytes) subtitleParts.push(formatFileSize(storageUsage.total_bytes) + ' used');
  var subtitle = subtitleParts.join(' \u00b7 ');

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim()) { fetchData(); return; }
    setLoading(true);
    var result = await searchDocuments(organizationId, searchTerm);
    if (result.error) { setError(result.error); } else { setDocuments(result.data || []); }
    setLoading(false);
  }

  function navigateToFolder(folder) {
    setCurrentFolder(folder || null);
    setSelectedDocIds([]);
    setBulkSelectMode(false);
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
    if (result.error) { mascotErrorToast('Failed to delete folder.', 'Please try again.'); }
    else { setFolders(folders.filter(function(f) { return f.id !== folderId; })); mascotSuccessToast('Folder deleted.'); }
  }

  async function handleDeleteDocument(documentId) {
    var doc = documents.find(function(d) { return d.id === documentId; });
    var expiryStatus = doc ? getExpiryStatus(doc) : null;
    var days = doc ? getDaysUntilExpiry(doc) : null;
    var confirmMsg = 'Permanently delete this document?';
    if (expiryStatus === 'danger') {
      confirmMsg = 'This document is scheduled to auto-delete in ' + days + ' day' + (days === 1 ? '' : 's') + '. Permanently delete it now?';
    } else if (expiryStatus === 'warning') {
      confirmMsg = 'This document is expiring soon. Permanently delete it now?';
    }
    if (!confirm(confirmMsg)) return;
    var result = await deleteDocument(documentId);
    if (result.error) { mascotErrorToast('Failed to delete document.', 'Please try again.'); }
    else {
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

  async function handleBulkSetExpiry() {
    if (!bulkExpiryDate || selectedDocIds.length === 0) return;
    setBulkExpiryLoading(true);
    var result = await supabase
      .from('documents')
      .update({ delete_after: bulkExpiryDate })
      .in('id', selectedDocIds);
    setBulkExpiryLoading(false);
    if (result.error) {
      mascotErrorToast('Failed to set expiry dates.', 'Please try again.');
    } else {
      var updatedIds = selectedDocIds.slice();
      setDocuments(function(prev) {
        return prev.map(function(d) {
          return updatedIds.indexOf(d.id) !== -1 ? Object.assign({}, d, { delete_after: bulkExpiryDate }) : d;
        });
      });
      setShowBulkExpiryModal(false);
      setBulkSelectMode(false);
      setSelectedDocIds([]);
      setBulkExpiryDate('');
      mascotSuccessToast('Expiry dates set!', updatedIds.length + ' documents updated.');
    }
  }

  async function handleBulkClearExpiry() {
    if (!confirm('Remove auto-delete from ' + selectedDocIds.length + ' document(s)?')) return;
    var updatedIds = selectedDocIds.slice();
    var result = await supabase
      .from('documents')
      .update({ delete_after: null })
      .in('id', updatedIds);
    if (result.error) {
      mascotErrorToast('Failed to clear expiry dates.');
    } else {
      setDocuments(function(prev) {
        return prev.map(function(d) {
          return updatedIds.indexOf(d.id) !== -1 ? Object.assign({}, d, { delete_after: null }) : d;
        });
      });
      setSelectedDocIds([]);
      setBulkSelectMode(false);
      mascotSuccessToast('Expiry dates cleared!', updatedIds.length + ' documents updated.');
    }
  }

  function toggleDocSelection(docId) {
    setSelectedDocIds(function(prev) {
      if (prev.indexOf(docId) !== -1) return prev.filter(function(id) { return id !== docId; });
      return prev.concat([docId]);
    });
  }

  function selectAllDocs() {
    if (selectedDocIds.length === sortedDocs.length && sortedDocs.length > 0) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(sortedDocs.map(function(d) { return d.id; }));
    }
  }

  var currentFolders = folders.filter(function(f) {
    return currentFolder ? f.parent_folder_id === currentFolder.id : !f.parent_folder_id;
  });

  var todayStr = new Date().toISOString().split('T')[0];

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading && !documents.length && !folders.length) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="px-6 py-6" aria-busy="true" aria-label="Loading documents">
          <div className="h-8 w-52 rounded-lg mb-2 animate-pulse bg-slate-200" />
          <div className="h-4 w-36 rounded mb-6 animate-pulse bg-slate-200" />
          <div className="h-10 w-full rounded-xl mb-6 animate-pulse bg-slate-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(function(i) {
              return <div key={i} className="h-52 rounded-xl animate-pulse bg-slate-200" />;
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error && !documents.length) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div
          className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-sm w-full"
          role="alert"
          style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'}}
        >
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-[#0E1523] mb-2">Failed to Load Documents</h2>
          <p className="text-sm text-[#64748B] mb-5">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="px-6 py-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
          <div>
            <h1 style={{fontSize:'30px', fontWeight:800, color:'#0E1523', margin:0}}>Document Library</h1>
            {subtitle && (
              <p className="text-sm mt-1" style={{color:'#64748B'}}>{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* View toggle */}
            <div className="flex items-center rounded-lg p-1 border bg-slate-100 border-slate-200" role="group" aria-label="View mode">
              <button
                onClick={function() { setViewMode('grid'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-[#64748B]')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={function() { setViewMode('list'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-[#64748B]')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Bulk select toggle */}
            {canManage && documents.length > 0 && (
              <button
                onClick={function() { setBulkSelectMode(!bulkSelectMode); setSelectedDocIds([]); }}
                className={'px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (bulkSelectMode ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-300 text-[#475569] hover:bg-slate-50')}
                aria-pressed={bulkSelectMode}
                aria-label="Toggle bulk select mode"
              >
                <CheckSquare className="w-4 h-4" aria-hidden="true" />
                {bulkSelectMode ? 'Cancel' : 'Select'}
              </button>
            )}

            {canManage && (
              <button
                onClick={function() { setShowCreateFolderModal(true); }}
                className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-white border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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

        {/* ── Storage bar ── */}
        {storageUsage && storageUsage.max_bytes > 0 && (
          <div className="mb-5 mt-3">
            <div className="flex justify-between text-xs mb-1.5" style={{color:'#64748B'}}>
              <span>{formatFileSize(storageUsage.total_bytes)} used</span>
              <span>{formatFileSize(storageUsage.max_bytes)} total</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{width: storagePercent + '%', background: storageBarColor, height: '100%', borderRadius: '9999px', transition: 'width 0.3s ease'}}
                role="progressbar"
                aria-valuenow={Math.round(storagePercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={'Storage ' + Math.round(storagePercent) + '% used'}
              />
            </div>
            {storagePercent >= 80 && (
              <p className="text-xs mt-1.5" style={{color: storagePercent >= 90 ? '#EF4444' : '#F59E0B'}}>
                {storagePercent >= 90 ? 'Storage almost full — consider deleting old files.' : 'Storage is getting full.'}
              </p>
            )}
          </div>
        )}

        {/* ── Bulk action bar ── */}
        {bulkSelectMode && (
          <div
            className="mb-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex-wrap"
            role="toolbar"
            aria-label="Bulk actions"
          >
            <button
              onClick={selectAllDocs}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {selectedDocIds.length === sortedDocs.length && sortedDocs.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm" style={{color:'#64748B'}} aria-live="polite">
              {selectedDocIds.length} selected
            </span>
            {selectedDocIds.length > 0 && (
              <>
                <button
                  onClick={function() { setShowBulkExpiryModal(true); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  Set Expiry Date
                </button>
                <button
                  onClick={handleBulkClearExpiry}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-slate-300 text-[#475569] hover:bg-slate-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  Clear Expiry
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Folder navigation" className="mb-5">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map(function(crumb, index) {
              var isLast = index === breadcrumbs.length - 1;
              return (
                <li key={crumb.id || 'root'} className="flex items-center gap-2">
                  {index > 0 && <span className="text-[#94A3B8]" aria-hidden="true">/</span>}
                  <button
                    onClick={function() { navigateToFolder(crumb.id ? folders.find(function(f) { return f.id === crumb.id; }) : null); }}
                    className={'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors ' + (isLast ? 'text-[#0E1523] font-semibold cursor-default' : 'text-blue-500 hover:text-blue-600 hover:underline')}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.name}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── Search + Sort + Expiry filters ── */}
        <div className="mb-6 flex flex-col gap-3">
          <form onSubmit={handleSearch} role="search" className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" aria-hidden="true" />
              <input
                id="doc-search"
                type="search"
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                placeholder="Search by name or description..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-[#0E1523] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2.5 rounded-lg border border-slate-300 text-[#475569] text-sm flex items-center gap-1 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </form>

          {/* Expiry filter tabs + Sort control */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2" role="group" aria-label="Filter by expiry status">
              {[
                { key: 'all', label: 'All' },
                { key: 'expiring_soon', label: 'Expiring Soon', count: expiringCount },
                { key: 'expired', label: 'Expired', count: expiredCount },
              ].map(function(tab) {
                var isActive = expiryFilter === tab.key;
                var activeClass = tab.key === 'expired'
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : tab.key === 'expiring_soon'
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-blue-50 border-blue-300 text-blue-600';
                var countClass = tab.key === 'expired'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-700';
                return (
                  <button
                    key={tab.key}
                    onClick={function() { setExpiryFilter(tab.key); }}
                    aria-pressed={isActive}
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ' + (isActive ? activeClass : 'bg-white border-slate-200 text-[#64748B] hover:border-slate-300 hover:text-[#0E1523]')}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={'ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ' + countClass}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="doc-sort" className="text-xs font-medium" style={{color:'#64748B'}}>Sort</label>
              <select
                id="doc-sort"
                value={sortBy}
                onChange={function(e) { setSortBy(e.target.value); }}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort documents"
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="expiry_asc">Expiry date</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Folders ── */}
        {currentFolders.length > 0 && (
          <section className="mb-8" aria-label="Folders">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#F5B731] mb-4">Folders</h2>
            <div className={'grid gap-4 ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
              {currentFolders.map(function(folder) {
                return (
                  <div
                    key={folder.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer transition-all group hover:border-blue-400"
                    style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'}}
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
                          <h3 className="font-semibold truncate text-sm text-[#0E1523]">{folder.name}</h3>
                          {folder.description && (
                            <p className="text-xs truncate mt-0.5 text-[#475569]">{folder.description}</p>
                          )}
                          <p className="text-xs mt-1 text-[#64748B]">
                            {folder.file_count || 0} {folder.file_count === 1 ? 'file' : 'files'}
                          </p>
                        </div>
                      </div>
                      {canManage && (
                        <button
                          onClick={function(e) { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded text-red-400 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
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

        {/* ── Documents ── */}
        <section aria-label="Documents">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#F5B731] mb-4">
            {'Documents' + (sortedDocs.length > 0 ? ' (' + sortedDocs.length + ')' : '')}
          </h2>

          {sortedDocs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-[#64748B]" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-[#0E1523] mb-1">
                {expiryFilter === 'expiring_soon' ? 'Nothing Expiring Soon'
                  : expiryFilter === 'expired' ? 'No Expired Documents'
                  : searchTerm ? 'No Documents Found'
                  : 'No Documents Yet'}
              </h3>
              <p className="text-sm mb-5" style={{color:'#475569'}}>
                {expiryFilter === 'expiring_soon' ? 'No documents are expiring in the next 7 days.'
                  : expiryFilter === 'expired' ? 'No documents have passed their auto-delete date.'
                  : searchTerm ? 'Try a different search term or clear the filter.'
                  : canUpload ? 'Upload your first document to get started.'
                  : 'No documents have been added yet.'}
              </p>
              {expiryFilter !== 'all' ? (
                <button
                  onClick={function() { setExpiryFilter('all'); }}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  Show All Documents
                </button>
              ) : searchTerm ? (
                <button
                  onClick={function() { setSearchTerm(''); fetchData(); }}
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  Clear Search
                </button>
              ) : canUpload ? (
                <button
                  onClick={function() { setShowUploadModal(true); }}
                  className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Upload Your First Document
                </button>
              ) : null}
            </div>
          ) : (
            <div
              className={'grid gap-4 items-stretch ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}
              role="list"
              aria-label="Documents list"
            >
              {sortedDocs.map(function(doc) {
                var isSelected = selectedDocIds.indexOf(doc.id) !== -1;

return (
  <div
    key={doc.id + '-' + (doc.updated_at || doc.uploaded_at)}
    role="listitem"
    className={'relative ' + (isSelected ? 'ring-2 ring-blue-400 rounded-xl' : '')}
  >
    {bulkSelectMode && (
      <button
        onClick={function() { toggleDocSelection(doc.id); }}
        className={'absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 hover:border-blue-400')}
        aria-label={(isSelected ? 'Deselect' : 'Select') + ' ' + doc.name}
        aria-pressed={isSelected}
      >
        {isSelected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    )}
    <DocumentCard
      document={doc}
      viewMode={viewMode}
      userRole={isAdmin ? 'admin' : isEditor ? 'editor' : 'member'}
      organizationId={organizationId}
      onDelete={handleDeleteDocument}
      onUpdate={handleUpdateDocument}
    />
  </div>
);
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Bulk expiry date modal ── */}
      {showBulkExpiryModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{background:'rgba(0,0,0,0.4)'}}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-expiry-title"
          onClick={function(e) { if (e.target === e.currentTarget) setShowBulkExpiryModal(false); }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'}}
          >
            <h2 id="bulk-expiry-title" style={{fontSize:'18px', fontWeight:800, color:'#0E1523', marginBottom:'8px'}}>
              Set Auto-Delete Date
            </h2>
            <p className="text-sm mb-5" style={{color:'#64748B'}}>
              {selectedDocIds.length} document{selectedDocIds.length !== 1 ? 's' : ''} will be automatically deleted on this date.
            </p>
            <label htmlFor="bulk-expiry-input" className="block text-sm font-semibold mb-2" style={{color:'#0E1523'}}>
              Auto-delete after
            </label>
            <input
              id="bulk-expiry-input"
              type="date"
              value={bulkExpiryDate}
              min={todayStr}
              onChange={function(e) { setBulkExpiryDate(e.target.value); }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-[#0E1523] mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
            <div className="flex gap-3">
              <button
                onClick={function() { setShowBulkExpiryModal(false); }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-[#475569] font-semibold text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSetExpiry}
                disabled={!bulkExpiryDate || bulkExpiryLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {bulkExpiryLoading ? 'Saving...' : 'Set Date'}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </main>
  );
}

export default DocumentLibrary;