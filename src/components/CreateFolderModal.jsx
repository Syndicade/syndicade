import { useState } from 'react';
import { createFolder } from '../lib/documentService';

function CreateFolderModal({ isOpen, onClose, organizationId, parentFolderId, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const colors = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#EF4444', label: 'Red' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#6B7280', label: 'Gray' }
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const { data, error: createError } = await createFolder({
      organization_id: organizationId,
      parent_folder_id: parentFolderId || null,
      name,
      description,
      color,
      depth: parentFolderId ? 1 : 0 // Simplified depth calculation
    });

    if (createError) {
      setError(createError);
      setCreating(false);
    } else {
      onSuccess(data);
      setName('');
      setDescription('');
      setColor('#3B82F6');
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Create Folder</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="folder-name" className="block text-sm font-semibold text-gray-900 mb-2">
              Folder Name *
            </label>
            <input
              id="folder-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meeting Minutes"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="folder-desc" className="block text-sm font-semibold text-gray-900 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="folder-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Folder Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-lg border-2 ${
                    color === c.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                  } transition-transform`}
                  style={{ backgroundColor: c.value }}
                  aria-label={`${c.label} color`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : '📁 Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateFolderModal;