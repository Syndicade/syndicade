import { useState } from 'react';
import { downloadDocument, formatFileSize, recordDocumentView, getUploaderName } from '../lib/documentService';
import EditDocumentModal from './EditDocumentModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import MoveDocumentModal from './MoveDocumentModal';
import DocumentViewersModal from './DocumentViewersModal';
import { useTheme } from '../context/ThemeContext';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import {
  Eye,
  Download,
  Pencil,
  FolderInput,
  Trash2,
  FileText,
  Image,
  File,
  Loader2,
  User
} from 'lucide-react';

/**
 * DocumentCard
 *
 * Props:
 * - document: object from DB (includes uploader, view_count)
 * - viewMode: 'grid' | 'list'
 * - userRole: 'admin' | 'editor' | 'member'
 * - organizationId: string
 * - onDelete: function(documentId)
 * - onUpdate: function(updatedDoc) — optional
 */
function DocumentCard({ document: doc, viewMode, userRole, organizationId, onDelete, onUpdate }) {
  var { isDark } = useTheme();
  var [downloading, setDownloading] = useState(false);
  var [showEditModal, setShowEditModal] = useState(false);
  var [showPreview, setShowPreview] = useState(false);
  var [showMoveModal, setShowMoveModal] = useState(false);
  var [showViewers, setShowViewers] = useState(false);
  var [localDoc, setLocalDoc] = useState(doc);

  var canManage = userRole === 'admin' || userRole === 'editor';
  var canSeeViewers = userRole === 'admin' || userRole === 'editor';

  // Theme tokens
  var card = isDark
    ? 'bg-[#1A2035] border-[#2A3550] hover:border-[#3B82F6]'
    : 'bg-white border-gray-200 hover:border-blue-400';
  var textPrimary = isDark ? 'text-white' : 'text-gray-900';
  var textSecondary = isDark ? 'text-[#CBD5E1]' : 'text-[#475569]';
  var textMuted = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  var previewBg = isDark ? 'bg-[#0E1523]' : 'bg-gray-100';
  var badgeBg = isDark ? 'bg-[#0E1523] text-[#94A3B8]' : 'bg-gray-100 text-gray-600';
  var dividerColor = isDark ? 'bg-[#2A3550]' : 'bg-gray-200';
  var iconBtnBase = 'p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';

  var isImage = localDoc.file_type && localDoc.file_type.startsWith('image/');
  var isPDF = localDoc.file_type && localDoc.file_type.includes('pdf');
  var uploaderName = getUploaderName(localDoc.uploader);

  // Safe integer extraction — guards against Supabase returning {count:N} objects
  var rawCount = localDoc.view_count;
  var viewCount = (typeof rawCount === 'number') ? rawCount : 0;

  function getFileIconNode(sizeClass) {
    if (isImage) return <Image className={sizeClass + ' text-purple-400'} aria-hidden="true" />;
    if (isPDF) return <FileText className={sizeClass + ' text-red-400'} aria-hidden="true" />;
    return <File className={sizeClass + ' text-blue-400'} aria-hidden="true" />;
  }

  async function handlePreviewOpen() {
    setShowPreview(true);
    await recordDocumentView(localDoc.id);
    setLocalDoc(function(prev) {
      var current = (typeof prev.view_count === 'number') ? prev.view_count : 0;
      return { ...prev, view_count: current + 1 };
    });
  }

  async function handleDownload() {
    setDownloading(true);
    var toastId = toast.loading('Preparing download...');
    var result = await downloadDocument(localDoc.id);
    toast.dismiss(toastId);
    if (result.error) {
      mascotErrorToast('Download failed.', result.error);
    } else if (result.data && result.data.signedUrl) {
      var link = window.document.createElement('a');
      link.href = result.data.signedUrl;
      link.download = result.data.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      mascotSuccessToast('Download started!');
    }
    setDownloading(false);
  }

  function handleEditSuccess(updatedDoc) {
    setLocalDoc(updatedDoc);
    if (onUpdate) onUpdate(updatedDoc);
  }

  function handleMoveSuccess(movedDoc) {
    setLocalDoc(movedDoc);
    if (onUpdate) onUpdate(movedDoc);
  }

  // ─── INLINE HELPERS (not JSX components — called as expressions) ──────────

  function renderFileIcon(sizeClass) {
    return getFileIconNode(sizeClass);
  }

  function renderUploaderRow() {
    return (
      <p className={'flex items-center gap-1 text-xs truncate ' + textMuted}>
        <User className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        {uploaderName}
      </p>
    );
  }

  function renderViewCount() {
    if (viewCount === 0) return null;
    if (canSeeViewers) {
      return (
        <button
          onClick={function() { setShowViewers(true); }}
          className={'flex items-center gap-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors '
            + (isDark ? 'text-[#94A3B8] hover:text-blue-400' : 'text-[#64748B] hover:text-blue-500')}
          aria-label={'See ' + viewCount + ' members who viewed this document'}
          title="See who viewed this document"
        >
          <Eye className="w-3 h-3" aria-hidden="true" />
          {viewCount}
        </button>
      );
    }
    return (
      <span className={'flex items-center gap-1 text-xs ' + textMuted} aria-label={viewCount + ' views'}>
        <Eye className="w-3 h-3" aria-hidden="true" />
        {viewCount}
      </span>
    );
  }

  function renderModals() {
    return (
      <>
        {showEditModal && (
          <EditDocumentModal
            isOpen={showEditModal}
            onClose={function() { setShowEditModal(false); }}
            document={localDoc}
            onSuccess={handleEditSuccess}
          />
        )}
        {showPreview && (
          <DocumentPreviewModal
            isOpen={showPreview}
            onClose={function() { setShowPreview(false); }}
            document={localDoc}
          />
        )}
        {showMoveModal && (
          <MoveDocumentModal
            isOpen={showMoveModal}
            onClose={function() { setShowMoveModal(false); }}
            document={localDoc}
            organizationId={organizationId}
            onSuccess={handleMoveSuccess}
          />
        )}
        {showViewers && (
          <DocumentViewersModal
            isOpen={showViewers}
            onClose={function() { setShowViewers(false); }}
            document={localDoc}
          />
        )}
      </>
    );
  }

  function renderManageButtons() {
    if (!canManage) return null;
    return (
      <>
        <button
          onClick={function() { setShowEditModal(true); }}
          className={iconBtnBase + ' text-blue-400 hover:bg-blue-500 hover:bg-opacity-10 focus:ring-blue-500'}
          aria-label={'Edit ' + localDoc.title}
          title="Edit"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={function() { setShowMoveModal(true); }}
          className={iconBtnBase + ' text-purple-400 hover:bg-purple-500 hover:bg-opacity-10 focus:ring-purple-500'}
          aria-label={'Move ' + localDoc.title + ' to a folder'}
          title="Move to folder"
        >
          <FolderInput className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={function() { if (onDelete) onDelete(localDoc.id); }}
          className={iconBtnBase + ' text-red-400 hover:bg-red-500 hover:bg-opacity-10 focus:ring-red-500'}
          aria-label={'Delete ' + localDoc.title}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <>
        <div className={'border rounded-xl p-4 flex items-center gap-4 transition-all ' + card}>
          <div className={'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ' + previewBg}>
            {renderFileIcon('w-5 h-5')}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={'font-semibold truncate text-sm ' + textPrimary}>{localDoc.title}</h3>
            <p className={'text-xs truncate mt-0.5 ' + textMuted}>{localDoc.file_name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={'text-xs ' + textMuted}>
                {formatFileSize(localDoc.file_size_bytes)}
                {' \u2022 '}
                {new Date(localDoc.uploaded_at).toLocaleDateString()}
              </span>
              {renderUploaderRow()}
            </div>
          </div>

          <div className="flex-shrink-0">
            {renderViewCount()}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePreviewOpen}
              className={'px-3 py-1.5 text-sm rounded-lg border font-medium flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors '
                + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845]' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}
              aria-label={'Preview ' + localDoc.title}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              Preview
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg font-medium flex items-center gap-1.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={'Download ' + localDoc.title}
            >
              {downloading
                ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                : <Download className="w-4 h-4" aria-hidden="true" />}
              {downloading ? 'Downloading...' : 'Download'}
            </button>

            {canManage && (
              <>
                <div className={'w-px h-5 flex-shrink-0 ' + dividerColor} aria-hidden="true" />
                {renderManageButtons()}
              </>
            )}
          </div>
        </div>
        {renderModals()}
      </>
    );
  }

  // ─── GRID VIEW ────────────────────────────────────────────────────────────
  return (
    <>
      <div className={'border rounded-xl overflow-hidden transition-all group ' + card}>

        <button
          onClick={handlePreviewOpen}
          className={'w-full h-40 flex items-center justify-center relative overflow-hidden transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ' + previewBg}
          aria-label={'Preview ' + localDoc.title}
        >
          {isImage ? (
            <img
              src={localDoc.file_url}
              alt={localDoc.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={'w-16 h-16 rounded-2xl flex items-center justify-center ' + (isDark ? 'bg-[#1A2035]' : 'bg-white shadow-sm')}>
              {renderFileIcon('w-8 h-8')}
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              <Eye className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
          </div>
        </button>

        <div className="p-4">
          <h3 className={'font-semibold truncate text-sm mb-0.5 ' + textPrimary} title={localDoc.title}>
            {localDoc.title}
          </h3>
          <p className={'text-xs truncate mb-1 ' + textMuted} title={localDoc.file_name}>
            {localDoc.file_name}
          </p>

          <div className="mb-2">
            {renderUploaderRow()}
          </div>

          <div className={'flex items-center justify-between text-xs mb-3 ' + textMuted}>
            <span>{formatFileSize(localDoc.file_size_bytes)}</span>
            <span>{new Date(localDoc.uploaded_at).toLocaleDateString()}</span>
          </div>

          {localDoc.description && (
            <p className={'text-xs mb-3 line-clamp-2 ' + textSecondary}>
              {localDoc.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={'Download ' + localDoc.title}
            >
              {downloading
                ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                : <Download className="w-4 h-4" aria-hidden="true" />}
              {downloading ? 'Downloading...' : 'Download'}
            </button>

            {renderManageButtons()}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className={'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ' + badgeBg}>
              {renderFileIcon('w-3 h-3')}
              {localDoc.file_extension ? localDoc.file_extension.toUpperCase() : 'FILE'}
            </span>
            {renderViewCount()}
          </div>
        </div>
      </div>

      {renderModals()}
    </>
  );
}

export default DocumentCard;