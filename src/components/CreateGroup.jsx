import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * CreateGroup Component
 *
 * Modal for admins to create a new group/committee within an organization.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onSuccess: function(newGroup) - called after successful creation
 * - organizationId: string
 * - organizationName: string
 */
function CreateGroup({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'committee',
    join_mode: 'approval',
    is_public: false,
    lead_member_id: ''
  });
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);

  // Fetch org members for lead selection
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchMembers();
    }
  }, [isOpen, organizationId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        group_type: 'committee',
        join_mode: 'approval',
        is_public: false,
        lead_member_id: ''
      });
      setError(null);
    }
  }, [isOpen]);

  async function fetchMembers() {
    try {
      setMembersLoading(true);
      const { data, error } = await supabase
        .from('memberships')
        .select('member_id, role, members(user_id, first_name, last_name, profile_photo_url)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('role', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Group name is required.');
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();

      const insertData = {
        organization_id: organizationId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        group_type: formData.group_type,
        join_mode: formData.join_mode,
        is_public: formData.is_public,
        lead_member_id: formData.lead_member_id || null,
        created_by: user.id
      };

      const { data, error: insertError } = await supabase
        .from('groups')
        .insert(insertData)
        .select(`
          *,
          lead_member:members!groups_lead_member_id_fkey(user_id, first_name, last_name, profile_photo_url),
          group_memberships(id, member_id, status, members(user_id, first_name, last_name, profile_photo_url))
        `)
        .single();

      if (insertError) throw insertError;

      onSuccess && onSuccess(data);
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="create-group-title" className="text-xl font-bold text-gray-900">
              Create Group or Committee
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{organizationName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-5">

            {/* Error */}
            {error && (
              <div
                className="bg-red-50 border border-red-200 rounded-lg p-3"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Group Name */}
            <div>
              <label
                htmlFor="group-name"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Group Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="group-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Finance Committee"
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                aria-required="true"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="group-description"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="group-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What does this group do?"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.description.length}/500
              </p>
            </div>

            {/* Group Type */}
            <div>
              <label
                htmlFor="group-type"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Group Type
              </label>
              <select
                id="group-type"
                name="group_type"
                value={formData.group_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="committee">Committee</option>
                <option value="board">Board</option>
                <option value="volunteer_team">Volunteer Team</option>
                <option value="working_group">Working Group</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Join Mode */}
            <fieldset>
              <legend className="block text-sm font-semibold text-gray-700 mb-2">
                Membership Access
              </legend>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50 transition-colors">
                  <input
                    type="radio"
                    name="join_mode"
                    value="approval"
                    checked={formData.join_mode === 'approval'}
                    onChange={handleChange}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approval Required</p>
                    <p className="text-xs text-gray-500">Members must request to join; admin approves</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50 transition-colors">
                  <input
                    type="radio"
                    name="join_mode"
                    value="open"
                    checked={formData.join_mode === 'open'}
                    onChange={handleChange}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Open</p>
                    <p className="text-xs text-gray-500">Any org member can join immediately</p>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Group Lead */}
            <div>
              <label
                htmlFor="group-lead"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Group Lead <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              {membersLoading ? (
                <div className="flex items-center gap-2 py-2" role="status">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" aria-hidden="true" />
                  <span className="text-sm text-gray-500">Loading members...</span>
                </div>
              ) : (
                <select
                  id="group-lead"
                  name="lead_member_id"
                  value={formData.lead_member_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">No lead assigned</option>
                  {members.map((m) => (
                    <option key={m.member_id} value={m.member_id}>
                      {m.members?.first_name + ' ' + m.members?.last_name + (m.role === 'admin' ? ' (Admin)' : '')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Visibility */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                id="group-public"
                name="is_public"
                type="checkbox"
                checked={formData.is_public}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label htmlFor="group-public" className="text-sm font-semibold text-gray-900 cursor-pointer">
                  Visible to all org members
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  When checked, all members can see this group exists. When unchecked, only group members and admins see it.
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;