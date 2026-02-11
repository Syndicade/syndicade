import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Generates a URL-safe slug from the org name
// e.g. "Toledo Tech Community!" -> "toledo-tech-community"
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .substring(0, 50);               // max 50 chars
};

function CreateOrganization({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'community'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (formData.name.trim().length < 3) {
        throw new Error('Organization name must be at least 3 characters');
      }

      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;

      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to create an organization');

      // Generate base slug from name
      let slug = generateSlug(formData.name);

      // Check if slug already exists; append random suffix if so
      const { data: existing } = await supabase
        .from('organizations')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      const orgData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        created_by: user.id,
        slug,
        settings: {}
      };

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert([orgData])
        .select()
        .single();

      if (orgError) throw orgError;

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

      if (onSuccess) {
        onSuccess(newOrg);
      }

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

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
            >
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

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
              aria-describedby="name-hint"
              maxLength={100}
            />
            <p id="name-hint" className="text-sm text-gray-500 mt-1">
              {formData.name.length}/100 characters
              {formData.name.trim().length >= 3 && (
                <span className="ml-2 text-gray-400">
                  · Public URL: /org/{generateSlug(formData.name)}
                </span>
              )}
            </p>
          </div>

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
              aria-describedby="description-hint"
              maxLength={500}
            />
            <p id="description-hint" className="text-sm text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.name.trim().length < 3}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2"
              aria-label={loading ? 'Creating organization, please wait' : 'Create organization'}
            >
              {loading ? (
                <>
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                    role="status"
                    aria-hidden="true"
                  ></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">✨</span>
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