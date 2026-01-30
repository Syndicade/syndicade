import { useState } from 'react';
import { updateDocument } from '../lib/documentService';

/**
 * EditDocumentModal Component
 * Modal for editing document title and description
 * 
 * Props:
 * - isOpen: Boolean - controls modal visibility
 * - onClose: Function - called when modal closes
 * - document: Object - the document to edit
 * - onSuccess: Function - called after successful update
 * 
 * ADA Compliant:
 * - ARIA labels
 * - Keyboard navigation (Escape to close)
 * - Focus management
 */
function EditDocumentModal({ isOpen, onClose, document, onSuccess }) {
  const [formData, setFormData] = useState({
    title: document?.title || '',
    description: document?.description || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate
      if (formData.title.trim().length < 3) {
        throw new Error('Title must be at least 3 characters');
      }

      // Update document
      const { data, error: updateError } = await updateDocument(document.id, {
        title: formData.title.trim(),
        description: formData.description.trim()
      });

      if (updateError) throw new Error(updateError);

      // Success!
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();

    } catch (err) {
      console.error('Error updating document:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !saving) {
      onClose();
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-doc-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 
            id="edit-doc-title"
            className="text-2xl font-bold text-gray-900"
          >
            ✏️ Edit Document
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 disabled:opacity-50"
            aria-label="Close modal"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Error Message */}
          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
            >
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Current File Name (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              File Name (cannot be changed)
            </label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              {document.file_name}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The actual file name stays the same. You can change the display title below.
            </p>
          </div>

          {/* Document Title */}
          <div>
            <label 
              htmlFor="doc-title"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Display Title *
            </label>
            <input
              id="doc-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Board Meeting Minutes - January 2026"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              aria-describedby="title-help"
              maxLength={200}
              autoFocus
            />
            <p id="title-help" className="text-sm text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label 
              htmlFor="doc-description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="doc-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes or context about this document..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              aria-describedby="description-help"
              maxLength={500}
            />
            <p id="description-help" className="text-sm text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || formData.title.trim().length < 3}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label={saving ? 'Saving changes...' : 'Save changes'}
            >
              {saving ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                    role="status"
                    aria-label="Saving"
                  >
                    <span className="sr-only">Saving...</span>
                  </div>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDocumentModal;