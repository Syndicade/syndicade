import { useState, useEffect } from 'react';
import { updateDocument } from '../lib/documentService';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { X, Users } from 'lucide-react';

function EditDocumentModal({ isOpen, onClose, document, onSuccess }) {
  var today = new Date().toISOString().split('T')[0];

  var [formData, setFormData] = useState({
    title: document?.title || '',
    description: document?.description || '',
    delete_after: document?.delete_after || ''
  });
  var [visibility, setVisibility] = useState(document?.visibility || 'all');
  var [selectedGroupIds, setSelectedGroupIds] = useState(document?.allowed_groups || []);
  var [groups, setGroups] = useState([]);
  var [groupsLoading, setGroupsLoading] = useState(false);
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState(null);

  // Fetch org groups when visibility switches to 'groups'
  useEffect(function() {
    if (visibility !== 'groups') return;
    if (groups.length > 0) return;
    if (!document || !document.organization_id) return;
    setGroupsLoading(true);
    supabase
      .from('org_groups')
      .select('id, name, color')
      .eq('organization_id', document.organization_id)
      .eq('is_active', true)
      .order('name')
      .then(function(result) {
        if (!result.error) setGroups(result.data || []);
        setGroupsLoading(false);
      });
  }, [visibility]);

  function toggleGroup(gid) {
    setSelectedGroupIds(function(prev) {
      if (prev.indexOf(gid) !== -1) return prev.filter(function(id) { return id !== gid; });
      return prev.concat([gid]);
    });
  }

  var handleSubmit = async function(e) {
    e.preventDefault();
    setError(null);

    if (formData.title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }
    if (visibility === 'groups' && selectedGroupIds.length === 0) {
      toast.error('Select at least one group.');
      return;
    }

    setSaving(true);
    try {
      var updatePayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        delete_after: formData.delete_after || null,
        visibility: visibility,
        allowed_groups: visibility === 'groups' ? selectedGroupIds : []
      };

      var result = await updateDocument(document.id, updatePayload);
      if (result.error) throw new Error(result.error);

      mascotSuccessToast('Document updated!');
      if (onSuccess) onSuccess(result.data);
      onClose();
    } catch (err) {
      console.error('Error updating document:', err);
      mascotErrorToast('Failed to save changes.', 'Please try again.');
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  var handleChange = function(e) {
    var name = e.target.name;
    var value = e.target.value;
    setFormData(function(prev) { return Object.assign({}, prev, { [name]: value }); });
  };

  var handleClearDate = function() {
    setFormData(function(prev) { return Object.assign({}, prev, { delete_after: '' }); });
  };

  var handleKeyDown = function(e) {
    if (e.key === 'Escape' && !saving) onClose();
  };

  var getDeleteConfirmText = function() {
    if (!formData.delete_after) return null;
    var d = new Date(formData.delete_after + 'T00:00:00');
    var now = new Date();
    var diffDays = Math.round((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return 'Warning: This document will be deleted in ' + diffDays + ' day' + (diffDays === 1 ? '' : 's') + '.';
    }
    return 'Will auto-delete on ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '.';
  };

  if (!isOpen || !document) return null;

  var deleteConfirmText = getDeleteConfirmText();
  var isWarning = formData.delete_after && deleteConfirmText && deleteConfirmText.startsWith('Warning');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-doc-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2
            id="edit-doc-modal-title"
            style={{ fontSize: '20px', fontWeight: 700, color: '#0E1523', margin: 0 }}
          >
            Edit Document
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3" role="alert" aria-live="assertive">
              <p style={{ fontSize: '13px', color: '#EF4444', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* File name (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              File Name
            </label>
            <div
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
              style={{ fontSize: '13px', color: '#64748B' }}
            >
              {document.file_name}
            </div>
            <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
              The file name cannot be changed. Edit the display title below.
            </p>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="edit-doc-title"
              className="block text-sm font-semibold text-slate-900 mb-1"
            >
              Display Title <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
            </label>
            <input
              id="edit-doc-title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Board Meeting Minutes — January 2026"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-required="true"
              aria-describedby="edit-title-count"
              maxLength={200}
              autoFocus
            />
            <p
              id="edit-title-count"
              style={{ fontSize: '11px', color: formData.title.length >= 190 ? '#EF4444' : '#94A3B8', marginTop: '4px' }}
            >
              {formData.title.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="edit-doc-description"
              className="block text-sm font-semibold text-slate-900 mb-1"
            >
              Description{' '}
              <span style={{ fontWeight: 400, color: '#64748B' }}>(optional)</span>
            </label>
            <textarea
              id="edit-doc-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes or context about this document..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              aria-describedby="edit-desc-count"
              maxLength={500}
            />
            <p
              id="edit-desc-count"
              style={{ fontSize: '11px', color: formData.description.length >= 480 ? '#EF4444' : '#94A3B8', marginTop: '4px' }}
            >
              {formData.description.length}/500
            </p>
          </div>

          {/* Visibility */}
          <div>
            <label
              htmlFor="edit-doc-visibility"
              className="block text-sm font-semibold text-slate-900 mb-1"
            >
              Who can see this?
            </label>
            <select
              id="edit-doc-visibility"
              value={visibility}
              onChange={function(e) {
                setVisibility(e.target.value);
                if (e.target.value !== 'groups') setSelectedGroupIds([]);
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: '14px', color: '#0E1523' }}
            >
              <option value="all">All Members</option>
              <option value="admins">Admins Only</option>
              <option value="groups">Specific Groups</option>
            </select>
          </div>

          {/* Group picker — shown when visibility = 'groups' */}
          {visibility === 'groups' && (
            <div
              className="border border-slate-200 rounded-xl overflow-hidden"
              role="group"
              aria-labelledby="edit-groups-label"
            >
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
                <span
                  id="edit-groups-label"
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{color:'#64748B'}}
                >
                  Select Groups
                </span>
                {selectedGroupIds.length > 0 && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                    {selectedGroupIds.length} selected
                  </span>
                )}
              </div>

              {groupsLoading ? (
                <div className="px-3 py-4 space-y-2" aria-busy="true" aria-label="Loading groups">
                  {[1,2,3].map(function(i) {
                    return <div key={i} className="h-8 rounded-lg animate-pulse bg-slate-100" />;
                  })}
                </div>
              ) : groups.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm" style={{color:'#64748B'}}>No groups found for this organization.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                  {groups.map(function(g) {
                    var checked = selectedGroupIds.indexOf(g.id) !== -1;
                    return (
                      <label
                        key={g.id}
                        className={'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ' + (checked ? 'bg-blue-50' : 'hover:bg-slate-50')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={function() { toggleGroup(g.id); }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 flex-shrink-0"
                          aria-label={'Include group: ' + g.name}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{background: g.color || '#3B82F6'}}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium flex-1" style={{color:'#0E1523'}}>{g.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedGroupIds.length === 0 && !groupsLoading && groups.length > 0 && (
                <p className="px-3 py-2 text-xs border-t border-slate-200" style={{color:'#EF4444'}}>
                  Select at least one group.
                </p>
              )}
            </div>
          )}

          {/* Auto-delete after */}
          <div>
            <label
              htmlFor="edit-doc-delete-after"
              className="block text-sm font-semibold text-slate-900 mb-1"
            >
              Auto-delete after{' '}
              <span style={{ fontWeight: 400, color: '#64748B' }}>(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="edit-doc-delete-after"
                name="delete_after"
                type="date"
                value={formData.delete_after || ''}
                onChange={handleChange}
                min={today}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="edit-delete-after-help"
              />
              {formData.delete_after && (
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="px-3 py-3 text-sm font-semibold border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label="Clear auto-delete date"
                >
                  Clear
                </button>
              )}
            </div>
            <p
              id="edit-delete-after-help"
              style={{
                fontSize: '11px',
                color: isWarning ? '#EF4444' : (formData.delete_after ? '#92400E' : '#94A3B8'),
                marginTop: '4px'
              }}
            >
              {deleteConfirmText || 'Document will be automatically deleted on this date.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 bg-transparent border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || formData.title.trim().length < 3 || (visibility === 'groups' && selectedGroupIds.length === 0)}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditDocumentModal;