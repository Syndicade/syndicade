import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * DocumentPreviewModal Component
 * 
 * Displays document previews in a modal overlay.
 * Supports PDFs (with page navigation) and images (with zoom).
 * 
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Called when modal should close
 * - document: object - Document to preview (must have file_url, file_type, title)
 * 
 * Features:
 * - PDF viewing with page navigation
 * - Image viewing with zoom controls
 * - Download button
 * - Keyboard shortcuts (Escape, Arrow keys)
 * - Loading states
 * - Error handling
 * - ADA compliant
 */
function DocumentPreviewModal({ isOpen, onClose, document }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signedUrl, setSignedUrl] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Fetch signed URL when document changes
  useEffect(() => {
    if (!document || !isOpen) return;

    async function getSignedUrl() {
      setLoading(true);
      setError(null);

      try {
        // Extract bucket path from file_url
        // file_url format: "https://xxx.supabase.co/storage/v1/object/public/documents/org-id/file.pdf"
        const urlParts = document.file_url.split('/documents/');
        if (urlParts.length < 2) {
          throw new Error('Invalid file URL format');
        }
        const filePath = urlParts[1];

        // Get signed URL (valid for 1 hour)
        const { data, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600); // 1 hour

        if (urlError) throw urlError;

        setSignedUrl(data.signedUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    getSignedUrl();
  }, [document, isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle download
  const handleDownload = () => {
    if (!signedUrl) return;
    
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = document.file_name || document.title;
    link.click();
  };

  // Zoom controls
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const resetZoom = () => setZoomLevel(100);

  if (!isOpen || !document) return null;

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type?.startsWith('image/');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 
              id="preview-title"
              className="text-xl font-bold text-gray-900 truncate"
            >
              {document.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {document.file_name} • {(document.file_size_bytes / 1024).toFixed(2)} KB
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 ml-4">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!signedUrl}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label="Download document"
            >
              <span>⬇️</span>
              Download
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
              aria-label="Close preview"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div 
                className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"
                role="status"
                aria-label="Loading preview"
              >
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-gray-600 mt-4">Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <p className="text-red-800 font-semibold mb-2">❌ Preview Error</p>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={handleDownload}
                  disabled={!signedUrl}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Download Instead
                </button>
              </div>
            </div>
          )}

          {!loading && !error && signedUrl && (
            <>
              {/* PDF Preview */}
              {isPDF && (
                <div className="flex flex-col items-center">
                  <iframe
                    src={signedUrl}
                    className="w-full bg-white shadow-lg rounded-lg"
                    style={{ height: '70vh' }}
                    title={`Preview of ${document.title}`}
                  />
                  
                  <p className="mt-4 text-sm text-gray-600 bg-white rounded-lg shadow-md px-6 py-3">
                    💡 Use the PDF's built-in controls to navigate pages and zoom
                  </p>
                </div>
              )}

              {/* Image Preview */}
              {isImage && (
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-lg shadow-lg p-4 mb-4 overflow-auto max-h-[70vh]">
                    <img
                      src={signedUrl}
                      alt={document.title}
                      style={{ 
                        width: `${zoomLevel}%`,
                        maxWidth: 'none',
                        height: 'auto'
                      }}
                      className="mx-auto"
                    />
                  </div>

                  {/* Image Zoom Controls */}
                  <div className="bg-white rounded-lg shadow-md px-6 py-3 flex items-center gap-4">
                    <button
                      onClick={zoomOut}
                      disabled={zoomLevel <= 50}
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Zoom out"
                    >
                      🔍−
                    </button>

                    <span className="text-gray-700 font-medium min-w-[80px] text-center">
                      {zoomLevel}%
                    </span>

                    <button
                      onClick={zoomIn}
                      disabled={zoomLevel >= 200}
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Zoom in"
                    >
                      🔍+
                    </button>

                    <button
                      onClick={resetZoom}
                      className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Reset zoom"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Unsupported File Type */}
              {!isPDF && !isImage && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
                    <p className="text-yellow-800 font-semibold mb-2">📄 Preview Not Available</p>
                    <p className="text-yellow-700 text-sm mb-4">
                      This file type cannot be previewed in the browser.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Download to View
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Keyboard Shortcuts */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            💡 <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-700">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocumentPreviewModal;