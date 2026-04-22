import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import {
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileQuestion,
  AlertTriangle,
  Loader2
} from 'lucide-react';

/**
 * DocumentPreviewModal
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - document: object (file_url, file_type, file_name, title, file_size_bytes)
 *
 * Supports PDF iframe preview and image preview with zoom controls.
 * ADA compliant: role="dialog", aria-modal, aria-labelledby, focus trap via Escape.
 */
function DocumentPreviewModal({ isOpen, onClose, document: doc }) {
  var { isDark } = useTheme();
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [signedUrl, setSignedUrl] = useState(null);
  var [zoomLevel, setZoomLevel] = useState(100);

  // Theme tokens
  var modalBg = isDark ? 'bg-[#1A2035]' : 'bg-white';
  var headerBorder = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var footerBg = isDark ? 'bg-[#151B2D] border-[#2A3550]' : 'bg-gray-50 border-gray-200';
  var previewBg = isDark ? 'bg-[#0E1523]' : 'bg-gray-100';
  var textPrimary = isDark ? 'text-white' : 'text-gray-900';
  var textMuted = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  var kbdStyle = isDark
    ? 'bg-[#0E1523] border-[#2A3550] text-[#CBD5E1]'
    : 'bg-white border-gray-300 text-gray-700';
  var zoomBtnBase = 'px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  var zoomBtnSecondary = isDark
    ? 'bg-[#0E1523] text-[#CBD5E1] hover:bg-[#2A3550]'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  // Fetch signed URL
  useEffect(function() {
    if (!doc || !isOpen) return;
    setLoading(true);
    setError(null);
    setSignedUrl(null);
    setZoomLevel(100);

    async function getSignedUrl() {
      try {
        var filePath = doc.storage_path || (doc.file_url.split('/documents/')[1] || null);
        if (!filePath) throw new Error('Could not determine file path.');

        var result = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600);

        if (result.error) throw result.error;
        setSignedUrl(result.data.signedUrl);
      } catch (err) {
        setError(err.message || 'Could not load preview.');
      } finally {
        setLoading(false);
      }
    }

    getSignedUrl();
  }, [doc, isOpen]);

  // Escape key to close
  useEffect(function() {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return function() { window.removeEventListener('keydown', handleKeyDown); };
  }, [isOpen, onClose]);

  function handleDownload() {
    if (!signedUrl) return;
    var toastId = toast.loading('Preparing download...');
    try {
      var link = window.document.createElement('a');
      link.href = signedUrl;
      link.download = doc.file_name || doc.title;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.dismiss(toastId);
    } catch (err) {
      toast.dismiss(toastId);
      mascotErrorToast('Download failed.', 'Please try again.');
    }
  }

  function zoomIn() { setZoomLevel(function(prev) { return Math.min(prev + 25, 200); }); }
  function zoomOut() { setZoomLevel(function(prev) { return Math.max(prev - 25, 50); }); }
  function resetZoom() { setZoomLevel(100); }

  if (!isOpen || !doc) return null;

  var isPDF = doc.file_type === 'application/pdf';
  var isImage = doc.file_type && doc.file_type.startsWith('image/');
  var fileSizeKB = doc.file_size_bytes ? (doc.file_size_bytes / 1024).toFixed(1) + ' KB' : '';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={'rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden ' + modalBg}>

        {/* Header */}
        <div className={'border-b px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0 ' + headerBorder}>
          <div className="flex-1 min-w-0">
            <h2
              id="preview-modal-title"
              className={'text-lg font-bold truncate ' + textPrimary}
            >
              {doc.title}
            </h2>
            {(doc.file_name || fileSizeKB) && (
              <p className={'text-xs mt-0.5 truncate ' + textMuted}>
                {doc.file_name}{fileSizeKB ? ' \u2022 ' + fileSizeKB : ''}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={!signedUrl}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg text-sm flex items-center gap-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Download document"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download
            </button>
            <button
              onClick={onClose}
              className={'p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 '
                + (isDark ? 'text-[#94A3B8] hover:text-white hover:bg-[#2A3550]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')}
              aria-label="Close preview"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className={'flex-1 overflow-auto p-6 flex flex-col items-center justify-center ' + previewBg}>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-4" role="status" aria-label="Loading preview">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" aria-hidden="true" />
              <p className={textMuted}>Loading preview...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className={'rounded-xl border p-8 max-w-sm text-center ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')} role="alert">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" aria-hidden="true" />
              <h3 className={'font-semibold mb-1 ' + textPrimary}>Preview Unavailable</h3>
              <p className={'text-sm mb-4 ' + textMuted}>{error}</p>
              <button
                onClick={handleDownload}
                disabled={!signedUrl}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Download Instead
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && signedUrl && (
            <>
              {/* PDF */}
              {isPDF && (
                <div className="w-full flex flex-col items-center gap-4">
                  <iframe
                    src={signedUrl}
                    className="w-full rounded-lg shadow-lg bg-white"
                    style={{ height: '68vh' }}
                    title={'Preview of ' + doc.title}
                  />
                  <p className={'text-xs ' + textMuted}>
                    Use the PDF viewer controls to navigate pages and zoom.
                  </p>
                </div>
              )}

              {/* Image */}
              {isImage && (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="overflow-auto max-h-[62vh] rounded-lg shadow-lg">
                    <img
                      src={signedUrl}
                      alt={doc.title}
                      style={{ width: zoomLevel + '%', maxWidth: 'none', height: 'auto' }}
                      className="block mx-auto"
                    />
                  </div>

                  {/* Zoom Controls */}
                  <div className={'flex items-center gap-3 rounded-xl border px-5 py-3 shadow-sm ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')}>
                    <button
                      onClick={zoomOut}
                      disabled={zoomLevel <= 50}
                      className={zoomBtnBase + ' ' + zoomBtnSecondary}
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" aria-hidden="true" />
                      Zoom Out
                    </button>

                    <span className={'text-sm font-semibold min-w-[52px] text-center ' + textPrimary}>
                      {zoomLevel}%
                    </span>

                    <button
                      onClick={zoomIn}
                      disabled={zoomLevel >= 200}
                      className={zoomBtnBase + ' ' + zoomBtnSecondary}
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" aria-hidden="true" />
                      Zoom In
                    </button>

                    <div className={'w-px h-5 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} aria-hidden="true" />

                    <button
                      onClick={resetZoom}
                      className={zoomBtnBase + ' text-blue-400 ' + (isDark ? 'hover:bg-[#2A3550]' : 'hover:bg-blue-50')}
                      aria-label="Reset zoom to 100%"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Unsupported */}
              {!isPDF && !isImage && (
                <div className={'rounded-xl border p-10 max-w-sm text-center ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')}>
                  <FileQuestion className={'w-12 h-12 mx-auto mb-3 ' + textMuted} aria-hidden="true" />
                  <h3 className={'font-semibold mb-1 ' + textPrimary}>Preview Not Available</h3>
                  <p className={'text-sm mb-5 ' + textMuted}>
                    This file type cannot be previewed in the browser.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 mx-auto"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Download to View
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={'border-t px-6 py-3 flex-shrink-0 ' + footerBg}>
          <p className={'text-xs text-center ' + textMuted}>
            Press{' '}
            <kbd className={'px-1.5 py-0.5 rounded border text-xs font-mono ' + kbdStyle}>Esc</kbd>
            {' '}to close
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocumentPreviewModal;