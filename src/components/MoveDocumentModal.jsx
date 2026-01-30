import { useState, useEffect } from 'react';
import { fetchFolders, moveDocument } from '../lib/documentService';

/**
 * MoveDocumentModal Component
 * 
 * Allows admins to move documents to different folders.
 * 
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Called when modal should close
 * - document: object - Document to move (must have id, title, folder_id)
 * - organizationId: string - Organization ID to fetch folders
 * - onSuccess: function - Called when document is moved successfully
 * 
 * Features:
 * - Dropdown to select destination folder
 * - Shows current folder
 * - Prevents moving to same folder
 * - Loading states
 * - Error handling
 * - ADA compliant
 */
function MoveDocumentModal({ isOpen, onClose, document, organizationId, onSuccess }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  // Fetch folders when modal opens
  useEffect(() => {
    if (!isOpen || !organizationId) return;

    async function loadFolders() {
      setFetching(true);
      setError(null);

      const { data, error } = await fetchFolders(organizationId);
      
      if (error) {
        setError(error);
      } else {
        // Add "Root" option
        const allFolders = [
          { id: null, name: '📁 Root (No Folder)' },
          ...data.map(f => ({ ...f, name: `${f.icon || '📁'} ${f.name}` }))
        ];
        setFolders(allFolders);
        
        // Pre-select current folder
        setSelectedFolderId(document.folder_id);
      }
      
      setFetching(false);
    }

    loadFolders();
  }, [isOpen, organizationId, document]);

  // Handle move
  const handleMove = async () => {
    if (selectedFolderId === document.folder_id) {
      setError('Please select a different folder');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: moveError } = await moveDocument(document.id, selectedFolderId);

    if (moveError) {
      setError(moveError);
      setLoading(false);
    } else {
      // Success!
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    }
  };

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

  if (!isOpen || !document) return null;

  // Find current folder name
  const currentFolder = folders.find(f => f.id === document.folder_id);
  const currentFolderName = currentFolder?.name || '📁 Root (No Folder)';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-doc-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 
            id="move-doc-title"
            className="text-xl font-bold text-gray-900"
          >
            📦 Move Document
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Move <strong>{document.title}</strong> to a different folder
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-3"
              role="alert"
            >
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Current Location */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Current location:</strong><br />
              {currentFolderName}
            </p>
          </div>

          {/* Folder Selector */}
          <div>
            <label 
              htmlFor="folder-select"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Move to: *
            </label>
            
            {fetching ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span className="text-sm">Loading folders...</span>
              </div>
            ) : (
              <select
                id="folder-select"
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-required="true"
                disabled={loading}
              >
                {folders.map(folder => (
                  <option 
                    key={folder.id || 'root'} 
                    value={folder.id || ''}
                    disabled={folder.id === document.folder_id}
                  >
                    {folder.name}
                    {folder.id === document.folder_id && ' (current)'}
                  </option>
                ))}
              </select>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Select a different folder to move this document
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleMove}
            disabled={loading || fetching || selectedFolderId === document.folder_id}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div 
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                  role="status"
                >
                  <span className="sr-only">Moving...</span>
                </div>
                Moving...
              </>
            ) : (
              <>
                📦 Move Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveDocumentModal;