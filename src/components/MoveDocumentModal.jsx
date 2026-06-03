import { useState, useEffect } from 'react';
import { fetchFolders, moveDocument } from '../lib/documentService';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import { Folder, FolderInput, X } from 'lucide-react';

function MoveDocumentModal({ isOpen, onClose, document, organizationId, onSuccess }) {
  var [folders, setFolders] = useState([]);
  var [selectedFolderId, setSelectedFolderId] = useState(null);
  var [loading, setLoading] = useState(false);
  var [fetching, setFetching] = useState(true);
  var [error, setError] = useState(null);

  useEffect(function() {
    if (!isOpen || !organizationId) return;
    setFetching(true);
    setError(null);
    fetchFolders(organizationId).then(function(result) {
      if (result.error) {
        setError(result.error);
      } else {
        var allFolders = [{ id: null, name: 'Document Library (root)' }].concat(
          (result.data || []).map(function(f) { return Object.assign({}, f); })
        );
        setFolders(allFolders);
        setSelectedFolderId(document.folder_id || null);
      }
      setFetching(false);
    });
  }, [isOpen, organizationId, document]);

  useEffect(function() {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !loading) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return function() { window.removeEventListener('keydown', handleKeyDown); };
  }, [isOpen, loading, onClose]);

  async function handleMove() {
    if (selectedFolderId === (document.folder_id || null)) {
      setError('Select a different folder to move this document.');
      return;
    }
    setLoading(true);
    setError(null);
    var result = await moveDocument(document.id, selectedFolderId);
    if (result.error) {
      mascotErrorToast('Failed to move document.', 'Please try again.');
      setError(result.error);
      setLoading(false);
    } else {
      mascotSuccessToast('Document moved!');
      if (onSuccess) onSuccess(result.data);
      onClose();
    }
  }

  if (!isOpen || !document) return null;

  var currentFolder = folders.find(function(f) { return f.id === (document.folder_id || null); });
  var currentFolderName = currentFolder ? currentFolder.name : 'Document Library (root)';
  var isSameFolder = selectedFolderId === (document.folder_id || null);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{background:'rgba(0,0,0,0.45)'}}
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-doc-title"
      onClick={function(e) { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md"
        style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'}}
        onClick={function(e) { e.stopPropagation(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="move-doc-title" style={{fontSize:'18px', fontWeight:800, color:'#0E1523', margin:0}}>
              Move Document
            </h2>
            <p className="text-sm mt-0.5" style={{color:'#64748B'}}>
              Move <strong style={{color:'#0E1523'}}>{document.title}</strong> to a different folder
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert" aria-live="assertive">
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}

          {/* Current location */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{color:'#3B82F6'}}>Current location</p>
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium" style={{color:'#0E1523'}}>{currentFolderName}</span>
            </div>
          </div>

          {/* Folder selector */}
          <div>
            <label htmlFor="folder-select" className="block text-sm font-semibold mb-1.5" style={{color:'#0E1523'}}>
              Move to <span aria-hidden="true" style={{color:'#EF4444'}}>*</span>
            </label>
            {fetching ? (
              <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
                <span className="text-sm" style={{color:'#64748B'}}>Loading folders...</span>
              </div>
            ) : (
              <select
                id="folder-select"
                value={selectedFolderId === null ? '' : selectedFolderId}
                onChange={function(e) { setSelectedFolderId(e.target.value === '' ? null : e.target.value); setError(null); }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true"
                disabled={loading}
              >
                {folders.map(function(folder) {
                  var val = folder.id === null ? '' : folder.id;
                  var isCurrent = folder.id === (document.folder_id || null);
                  return (
                    <option key={folder.id || 'root'} value={val}>
                      {folder.name}{isCurrent ? ' (current)' : ''}
                    </option>
                  );
                })}
              </select>
            )}
            <p className="text-xs mt-1" style={{color:'#94A3B8'}}>
              Select a different folder to move this document.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-slate-300 text-[#475569] font-semibold rounded-lg text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={loading || fetching || isSameFolder}
            className="px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Moving" />
                Moving...
              </>
            ) : (
              <>
                <FolderInput className="w-4 h-4" aria-hidden="true" />
                Move Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveDocumentModal;