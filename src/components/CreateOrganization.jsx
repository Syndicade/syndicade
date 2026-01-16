import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * CreateOrganization Component
 * 
 * Modal form for creating new organizations.
 * Automatically makes the creator an admin member.
 */
function CreateOrganization({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'community'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Organization type options
  const orgTypes = [
    { value: 'nonprofit', label: 'Nonprofit Organization', icon: '🤝' },
    { value: 'club', label: 'Club or Social Group', icon: '🎭' },
    { value: 'association', label: 'Professional Association', icon: '💼' },
    { value: 'community', label: 'Community Group', icon: '🏘️' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate form
      if (formData.name.trim().length < 3) {
        throw new Error('Organization name must be at least 3 characters');
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to create an organization');

      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          created_by: user.id,
          settings: {}
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // Make creator an admin member
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert([{
          member_id: user.id,
          organization_id: newOrg.id,
          role: 'admin',
          status: 'active',
          approved_date: new Date().toISOString()
        }]);

      if (membershipError) throw membershipError;

      // Success!
      if (onSuccess) {
        onSuccess(newOrg);
      }
      
      // Reset form
      setFormData({ name: '', description: '', type: 'community' });
      onClose();

    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-org-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 
            id="create-org-title"
            className="text-2xl font-bold text-gray-900"
          >
            Create New Organization
          </h2>
          <p className="text-gray-600 mt-1">
            Set up your community organization to start managing members and events.
          </p>
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

          {/* Organization Name */}
          <div>
            <label 
              htmlFor="org-name"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Organization Name *
            </label>
            <input
              id="org-name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Toledo Tech Community"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              aria-describedby="name-help"
              maxLength={100}
            />
            <p id="name-help" className="text-sm text-gray-500 mt-1">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Organization Type */}
          <div>
            <label 
              htmlFor="org-type"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Organization Type *
            </label>
            <select
              id="org-type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
            >
              {orgTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label 
              htmlFor="org-description"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="org-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your organization's purpose and activities..."
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
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.name.trim().length < 3}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-label={loading ? 'Creating organization...' : 'Create organization'}
            >
              {loading ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                    role="status"
                    aria-label="Loading"
                  >
                    <span className="sr-only">Creating...</span>
                  </div>
                  Creating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Create Organization
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOrganization;