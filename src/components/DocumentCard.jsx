import { useState } from 'react';
import { downloadDocument, formatFileSize, recordDocumentView, getUploaderName } from '../lib/documentService';
import { supabase } from '../lib/supabase';
import EditDocumentModal from './EditDocumentModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import MoveDocumentModal from './MoveDocumentModal';
import DocumentViewersModal from './DocumentViewersModal';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import {
  Eye, Download, Pencil, FolderInput, Trash2,
  FileText, Image, File, User, Tag, Layers
} from 'lucide-react';

var iconBtnBase = 'p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors';

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00');
}

function getExpiryStatus(deleteAfter) {
  if (!deleteAfter) return null;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var expiry = parseLocalDate(deleteAfter);
  var diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'expired';
  if (diffDays <= 3) return 'danger';
  if (diffDays <= 7) return 'warning';
  return 'scheduled';
}

function getDaysLeft(deleteAfter) {
  if (!deleteAfter) return null;
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var expiry = parseLocalDate(deleteAfter);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function isNewDoc(uploadedAt, createdAt) {
  var ts = uploadedAt || createdAt;
  if (!ts) return false;
  return (Date.now() - new Date(ts).getTime()) < 7 * 24 * 60 * 60 * 1000;
}

function DocumentCard({ document: doc, viewMode, userRole, organizationId, onDelete, onUpdate }) {
  var [downloading, setDownloading] = useState(false);
  var [showEditModal, setShowEditModal] = useState(false);
  var [showPreview, setShowPreview] = useState(false);
  var [showMoveModal, setShowMoveModal] = useState(false);
  var [showViewers, setShowViewers] = useState(false);
  var [localDoc, setLocalDoc] = useState(doc);

  var canManage = userRole === 'admin' || userRole === 'editor';
  var canSeeViewers = userRole === 'admin' || userRole === 'editor';
  var isAdmin = userRole === 'admin';

  var isImage = localDoc.file_type && localDoc.file_type.startsWith('image/');
  var isPDF = localDoc.file_type && localDoc.file_type.includes('pdf');
  var uploaderName = getUploaderName(localDoc.uploader);
  var viewCount = (typeof localDoc.view_count === 'number') ? localDoc.view_count : 0;

  var expiryStatus = getExpiryStatus(localDoc.delete_after);
  var daysLeft = getDaysLeft(localDoc.delete_after);
  var docIsNew = isNewDoc(localDoc.uploaded_at, localDoc.created_at);

  var docTags = Array.isArray(localDoc.tags) ? localDoc.tags : [];
  var docCategory = localDoc.category || null;

  var expiryBadgeText = '';
  var expiryBadgeClass = '';
  if (expiryStatus === 'expired') {
    expiryBadgeText = 'Expired';
    expiryBadgeClass = 'bg-red-100 text-red-600 border-red-200';
  } else if (expiryStatus === 'danger') {
    expiryBadgeText = daysLeft === 1 ? 'Deletes tomorrow' : 'Deletes in ' + daysLeft + 'd';
    expiryBadgeClass = 'bg-red-100 text-red-600 border-red-200';
  } else if (expiryStatus === 'warning') {
    expiryBadgeText = 'Expires in ' + daysLeft + 'd';
    expiryBadgeClass = 'bg-amber-100 text-amber-700 border-amber-200';
  } else if (expiryStatus === 'scheduled') {
    expiryBadgeText = 'Auto-delete set';
    expiryBadgeClass = 'bg-slate-100 text-[#64748B] border-slate-200';
  }

  function getFileIconNode(sizeClass) {
    if (isImage) return <Image className={sizeClass + ' text-purple-400'} aria-hidden="true" />;
    if (isPDF)   return <FileText className={sizeClass + ' text-red-400'} aria-hidden="true" />;
    return <File className={sizeClass + ' text-blue-400'} aria-hidden="true" />;
  }

  function getIconBgClass() {
    if (isImage) return 'bg-purple-50 border-purple-100';
    if (isPDF)   return 'bg-red-50 border-red-100';
    return 'bg-blue-50 border-blue-100';
  }

  async function handlePreviewOpen() {
    setShowPreview(true);
    await recordDocumentView(localDoc.id);
    setLocalDoc(function(prev) {
      var current = (typeof prev.view_count === 'number') ? prev.view_count : 0;
      return Object.assign({}, prev, { view_count: current + 1 });
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

  async function handleKeep() {
    var result = await supabase
      .from('documents')
      .update({ delete_after: null })
      .eq('id', localDoc.id);
    if (result.error) {
      mascotErrorToast('Failed to update document.');
    } else {
      var updated = Object.assign({}, localDoc, { delete_after: null });
      setLocalDoc(updated);
      if (onUpdate) onUpdate(updated);
      mascotSuccessToast('Document kept!', 'Auto-delete removed.');
    }
  }

  function handleEditSuccess(updatedDoc) {
    setLocalDoc(updatedDoc);
    if (onUpdate) onUpdate(updatedDoc);
  }

  function handleMoveSuccess(movedDoc) {
    setLocalDoc(movedDoc);
    if (onUpdate) onUpdate(movedDoc);
  }

  function renderViewCount() {
    if (viewCount === 0) return null;
    if (canSeeViewers) {
      return (
        <button
          onClick={function() { setShowViewers(true); }}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B] hover:bg-blue-50 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={'See ' + viewCount + ' members who viewed this document'}
        >
          <Eye className="w-3 h-3" aria-hidden="true" />
          {viewCount}
        </button>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B]">
        <Eye className="w-3 h-3" aria-hidden="true" />
        {viewCount}
      </span>
    );
  }

  function renderManageButtons() {
    if (!canManage) return null;
    return (
      <>
        <button
          onClick={function() { setShowEditModal(true); }}
          className={iconBtnBase + ' text-blue-400 hover:bg-blue-50 focus:ring-blue-400'}
          aria-label={'Edit ' + localDoc.title}
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          onClick={function() { setShowMoveModal(true); }}
          className={iconBtnBase + ' text-purple-400 hover:bg-purple-50 focus:ring-purple-400'}
          aria-label={'Move ' + localDoc.title + ' to a folder'}
          title="Move to folder"
        >
          <FolderInput className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          onClick={function() { if (onDelete) onDelete(localDoc.id); }}
          className={iconBtnBase + ' text-red-400 hover:bg-red-50 focus:ring-red-400'}
          aria-label={'Delete ' + localDoc.title}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </>
    );
  }

  // Tags + category chips — visible to all members
  function renderLabels(compact) {
    var hasLabels = docCategory || docTags.length > 0;
    if (!hasLabels) return null;
    var maxTags = compact ? 3 : docTags.length;
    var visibleTags = docTags.slice(0, maxTags);
    var overflow = docTags.length - visibleTags.length;
    return (
      <div className="flex items-center flex-wrap gap-1" aria-label="Document labels">
        {docCategory && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
            <Layers className="w-2.5 h-2.5" aria-hidden="true" />
            {docCategory}
          </span>
        )}
        {visibleTags.map(function(tag) {
          return (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
              <Tag className="w-2.5 h-2.5" aria-hidden="true" />
              {tag}
            </span>
          );
        })}
        {overflow > 0 && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-[#64748B]">
            +{overflow}
          </span>
        )}
      </div>
    );
  }

  function renderFooter() {
    return (
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide bg-slate-100 text-[#64748B]">
            {getFileIconNode('w-3 h-3')}
            {localDoc.file_extension ? localDoc.file_extension.toUpperCase() : 'FILE'}
          </span>
          {expiryBadgeText && (
            <span className={'text-xs font-semibold px-2 py-0.5 rounded-full border ' + expiryBadgeClass}>
              {expiryBadgeText}
            </span>
          )}
          {docIsNew && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {canManage && expiryStatus && expiryStatus !== 'expired' && (
            <button
              onClick={handleKeep}
              className="text-xs font-bold px-2 py-1 rounded-md text-green-700 hover:bg-green-50 border border-green-200 mr-1 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              aria-label={'Remove auto-delete from ' + localDoc.title}
              title="Remove auto-delete"
            >
              Keep
            </button>
          )}
          {renderManageButtons()}
        </div>
      </div>
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
            isAdmin={isAdmin}
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

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <>
        <div
          className="border rounded-xl p-4 flex items-center gap-4 transition-all bg-white border-slate-200 hover:border-blue-400"
          style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)'}}
        >
          <div className={'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ' + getIconBgClass()}>
            {getFileIconNode('w-5 h-5')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-semibold truncate text-sm" style={{color:'#0E1523'}}>{localDoc.title}</h3>
              {expiryBadgeText && (
                <span className={'text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ' + expiryBadgeClass}>
                  {expiryBadgeText}
                </span>
              )}
              {docIsNew && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 flex-shrink-0">
                  New
                </span>
              )}
            </div>
            <p className="text-xs truncate" style={{color:'#64748B'}}>{localDoc.file_name}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs" style={{color:'#64748B'}}>
                <User className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                {uploaderName}
              </span>
              <span className="text-xs" style={{color:'#94A3B8'}}>
                {formatFileSize(localDoc.file_size_bytes)}
                {' \u00b7 '}
                {new Date(localDoc.uploaded_at).toLocaleDateString()}
              </span>
            </div>
            {localDoc.description && (
              <p className="text-xs mt-1 truncate" style={{color:'#475569'}}>{localDoc.description}</p>
            )}
            {/* Labels row in list view */}
            {(docCategory || docTags.length > 0) && (
              <div className="mt-1.5">
                {renderLabels(true)}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">{renderViewCount()}</div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePreviewOpen}
              className="px-3 py-1.5 text-sm rounded-lg border font-medium flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors border-slate-300 text-[#475569] hover:bg-slate-50"
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
              <Download className="w-4 h-4" aria-hidden="true" />
              {downloading ? 'Downloading...' : 'Download'}
            </button>
            {canManage && expiryStatus && expiryStatus !== 'expired' && (
              <button
                onClick={handleKeep}
                className="px-3 py-1.5 text-sm rounded-lg border font-medium text-green-700 border-green-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Keep
              </button>
            )}
            {canManage && (
              <>
                <div className="w-px h-5 flex-shrink-0 bg-slate-200" aria-hidden="true" />
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
      <div
        className="border rounded-xl overflow-hidden transition-all bg-white border-slate-200 hover:border-blue-400 h-full flex flex-col"
        style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)'}}
      >
      <div className="p-4 flex flex-col flex-1">

          {/* Title row */}
          <div className="flex items-start gap-2.5 mb-2">
            <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ' + getIconBgClass()}>
              {getFileIconNode('w-4 h-4')}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="font-semibold text-sm leading-tight line-clamp-1" style={{color:'#0E1523'}} title={localDoc.title}>
                {localDoc.title}
              </h3>
              <p className="text-xs truncate mt-0.5" style={{color:'#94A3B8'}} title={localDoc.file_name}>
                {localDoc.file_name}
              </p>
            </div>
          </div>

          {/* Uploader */}
          <div className="flex items-center gap-1.5 mb-2 h-4">
            <User className="w-3 h-3 flex-shrink-0 text-[#94A3B8]" aria-hidden="true" />
            <span className="text-xs truncate" style={{color:'#64748B'}}>{uploaderName}</span>
          </div>

          {/* Size + date + view count */}
          <div className="flex items-center justify-between mb-2 h-4">
            <span className="text-xs" style={{color:'#94A3B8'}}>
              {formatFileSize(localDoc.file_size_bytes)}
              {' \u00b7 '}
              {new Date(localDoc.uploaded_at).toLocaleDateString()}
            </span>
            {renderViewCount()}
          </div>

          {/* Description — reserves 2-line height */}
          <div className="mb-2" style={{minHeight:'2.5rem'}}>
            {localDoc.description && (
              <p className="text-xs line-clamp-2" style={{color:'#475569', lineHeight:'1.4'}}>
                {localDoc.description}
              </p>
            )}
          </div>

          {/* Labels — category + tags. Reserve min height so cards stay equal */}
          <div className="mb-3" style={{minHeight:'1.5rem'}}>
            {renderLabels(true)}
          </div>

          {/* Actions — pinned to bottom */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handlePreviewOpen}
                className="flex-1 px-3 py-2 text-sm rounded-lg font-medium flex items-center justify-center gap-1.5 border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label={'Preview ' + localDoc.title}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                Preview
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={'Download ' + localDoc.title}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                {downloading ? 'Saving...' : 'Download'}
              </button>
            </div>
            {renderFooter()}
          </div>
        </div>
      </div>

      {renderModals()}
    </>
  );
}

export default DocumentCard;