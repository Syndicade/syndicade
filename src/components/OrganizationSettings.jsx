import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function OrganizationSettings({ organizationId, onUpdate }) {
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'community',
    settings: {
      isPublic: true,
      allowMemberInvites: true,
      requireApproval: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const orgTypes = [
    { value: 'nonprofit', label: 'Nonprofit Organization' },
    { value: 'club', label: 'Club or Social Group' },
    { value: 'association', label: 'Professional Association' },
    { value: 'community', label: 'Community Group' }
  ];

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  async function fetchOrganization() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      setOrganization(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        type: data.type,
        settings: data.settings || {
          isPublic: true,
          allowMemberInvites: true,
          requireApproval: false
        }
      });
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: formData.type,
          settings: formData.settings
        })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      setSuccess(true);
      if (onUpdate) {
        onUpdate(formData);
      }

      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Error updating organization:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12" role="status" aria-label="Loading organization settings">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" role="alert">
        <p className="text-yellow-800 font-semibold">Organization not found</p>
      </div>
    );
  }

  const publicPageUrl = organization.slug ? `/org/${organization.slug}` : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
            <p className="text-gray-600 mt-1">Manage your organization's configuration and preferences.</p>
          </div>

          {/* View Public Page button — only shown if org has a slug */}
          {publicPageUrl && (
            <a
              href={publicPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
              aria-label={`View public page for ${organization.name}, opens in new tab`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Public Page
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status">
              <p className="text-green-800 font-semibold">✓ Settings saved successfully!</p>
            </div>
          )}

          {/* Public URL display */}
          {publicPageUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-sm text-blue-800">
                Public URL:{' '}
                <a
                  href={publicPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-semibold underline hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={`Public URL: ${publicPageUrl}, opens in new tab`}
                >
                  {window.location.origin}{publicPageUrl}
                </a>
              </p>
            </div>
          )}

          <section aria-labelledby="basic-info-heading">
            <h3 id="basic-info-heading" className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="org-name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Organization Name *
                </label>
                <input
                  id="org-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required="true"
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="org-type" className="block text-sm font-semibold text-gray-900 mb-2">
                  Organization Type
                </label>
                <select
                  id="org-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {orgTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="org-description" className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  id="org-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  aria-describedby="description-count"
                  maxLength={500}
                />
                <p id="description-count" className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="privacy-heading">
            <h3 id="privacy-heading" className="text-lg font-bold text-gray-900 mb-4">Privacy & Access</h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="is-public"
                    name="settings.isPublic"
                    type="checkbox"
                    checked={formData.settings.isPublic}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="is-public" className="font-semibold text-gray-900">
                    Public Organization
                  </label>
                  <p className="text-sm text-gray-600">
                    Allow anyone to view your organization's profile and public events.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allow-invites"
                    name="settings.allowMemberInvites"
                    type="checkbox"
                    checked={formData.settings.allowMemberInvites}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="allow-invites" className="font-semibold text-gray-900">
                    Allow Member Invitations
                  </label>
                  <p className="text-sm text-gray-600">
                    Let members invite others to join the organization.
                  </p>
                </div>
                </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="require-approval"
                    name="settings.requireApproval"
                    type="checkbox"
                    checked={formData.settings.requireApproval}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="require-approval" className="font-semibold text-gray-900">
                    Require Admin Approval
                  </label>
                  <p className="text-sm text-gray-600">
                    New members must be approved by an admin before joining.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2"
              aria-label={saving ? 'Saving changes, please wait' : 'Save changes'}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <><span aria-hidden="true">💾</span> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrganizationSettings;