import { useState } from 'react';
import { downloadDocument, formatFileSize, getFileIcon } from '../lib/documentService';
import EditDocumentModal from './EditDocumentModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import MoveDocumentModal from './MoveDocumentModal';

/**
 * DocumentCard Component
 * Displays a single document with download, edit, view, and delete actions
 * 
 * Props:
 * - document: Document object from database
 * - viewMode: 'grid' or 'list'
 * - isAdmin: Boolean - whether current user is admin
 * - onDelete: Function to call when delete button clicked
 * - onUpdate: Function to call when document is updated (OPTIONAL)
 * 
 * ADA Compliant:
 * - ARIA labels on all buttons
 * - Keyboard accessible
 * - Screen reader friendly
 */
function DocumentCard({ document, viewMode = 'grid', isAdmin = false, organizationId, onDelete, onUpdate }) {
  const [downloading, setDownloading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [localDoc, setLocalDoc] = useState(document);

  async function handleDownload() {
    setDownloading(true);
    const { data, error } = await downloadDocument(localDoc.id);
    
    if (error) {
      alert(`Error downloading: ${error}`);
    } else if (data?.signedUrl) {
      // Trigger download using window.document
      const link = window.document.createElement('a');
      link.href = data.signedUrl;
      link.download = data.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
    setDownloading(false);
  }

  const handleEditSuccess = (updatedDoc) => {
    // Update local state
    setLocalDoc(updatedDoc);
    
    // Call parent's onUpdate if provided
    if (onUpdate) {
      onUpdate(updatedDoc);
    }
  };

  const handleMoveSuccess = (movedDoc) => {
    // Update local state
    setLocalDoc(movedDoc);
    
    // Call parent's onUpdate if provided
    if (onUpdate) {
      onUpdate(movedDoc);
    }
  };

  const isImage = localDoc.file_type?.startsWith('image/');
  const isPDF = localDoc.file_type?.includes('pdf');

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <>
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center gap-4">
          {/* File Icon */}
          <div className="text-2xl flex-shrink-0" aria-hidden="true">
            {isImage ? '🖼️' : isPDF ? '📄' : '📎'}
          </div>
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {localDoc.title}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {localDoc.file_name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(localDoc.file_size_bytes)} • 
              {' '}{new Date(localDoc.uploaded_at).toLocaleDateString()}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowPreview(true)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label={`Preview ${localDoc.title}`}
            >
              👁️ Preview
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Download ${localDoc.title}`}
            >
              {downloading ? 'Downloading...' : '⬇️ Download'}
            </button>
            
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Edit ${localDoc.title}`}
                  title="Edit document"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label={`Move ${localDoc.title}`}
                  title="Move to folder"
                >
                  📦
                </button>
                <button
                  onClick={() => onDelete && onDelete(localDoc.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Delete ${localDoc.title}`}
                  title="Delete document"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <EditDocumentModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            document={localDoc}
            onSuccess={handleEditSuccess}
          />
        )}

        {/* Preview Modal */}
        {showPreview && (
          <DocumentPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            document={localDoc}
          />
        )}

        {/* Move Modal */}
        {showMoveModal && (
          <MoveDocumentModal
            isOpen={showMoveModal}
            onClose={() => setShowMoveModal(false)}
            document={localDoc}
            organizationId={organizationId}
            onSuccess={handleMoveSuccess}
          />
        )}
      </>
    );
  }

  // GRID VIEW
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Preview/Icon Section - CLICKABLE */}
        <button
          onClick={() => setShowPreview(true)}
          className="w-full h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          aria-label={`Preview ${localDoc.title}`}
        >
          {isImage ? (
            <img
              src={localDoc.file_url}
              alt={localDoc.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-6xl" aria-hidden="true">
              {isPDF ? '📄' : '📎'}
            </div>
          )}
          
          {/* Quick Preview Overlay (appears on hover) */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="text-white text-5xl">
              👁️
            </div>
          </div>
        </button>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate mb-1" title={localDoc.title}>
            {localDoc.title}
          </h3>
          
          <p className="text-sm text-gray-600 truncate mb-2" title={localDoc.file_name}>
            {localDoc.file_name}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{formatFileSize(localDoc.file_size_bytes)}</span>
            <span>{new Date(localDoc.uploaded_at).toLocaleDateString()}</span>
          </div>

          {/* Description (if exists) */}
          {localDoc.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">
              {localDoc.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={`Download ${localDoc.title}`}
            >
              {downloading ? (
                <>
                  <span className="inline-block animate-spin mr-1">⏳</span>
                  Downloading...
                </>
              ) : (
                '⬇️ Download'
              )}
            </button>
            
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  aria-label={`Edit ${localDoc.title}`}
                  title="Edit document"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  aria-label={`Move ${localDoc.title}`}
                  title="Move to folder"
                >
                  📦
                </button>
                <button
                  onClick={() => onDelete && onDelete(localDoc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  aria-label={`Delete ${localDoc.title}`}
                  title="Delete document"
                >
                  🗑️
                </button>
              </>
            )}
          </div>

          {/* File Type Badge */}
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
              {localDoc.file_extension?.toUpperCase() || 'FILE'}
            </span>
            
            {localDoc.view_count > 0 && (
              <span className="text-xs text-gray-500" title="View count">
                👁️ {localDoc.view_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditDocumentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          document={localDoc}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <DocumentPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          document={localDoc}
        />
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <MoveDocumentModal
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          document={localDoc}
          organizationId={organizationId}
          onSuccess={handleMoveSuccess}
        />
      )}
    </>
  );
}

export default DocumentCard;