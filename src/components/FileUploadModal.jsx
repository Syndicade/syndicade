import { useState, useEffect } from 'react';
import { uploadDocument, validateFile } from '../lib/documentService';
import { notifyOrganizationMembers } from '../lib/notificationService';
import { supabase } from '../lib/supabase';
import { Upload, X, FileText, Calendar, Users } from 'lucide-react';

function FileUploadModal({ isOpen, onClose, organizationId, folderId, groupId, onSuccess }) {
  var [file, setFile] = useState(null);
  var [title, setTitle] = useState('');
  var [description, setDescription] = useState('');
  var [category, setCategory] = useState('');
  var [deleteAfter, setDeleteAfter] = useState('');
  var [visibility, setVisibility] = useState(groupId ? 'groups' : 'members');
  var [selectedGroupIds, setSelectedGroupIds] = useState(groupId ? [groupId] : []);
  var [groups, setGroups] = useState([]);
  var [groupsLoading, setGroupsLoading] = useState(false);
  var [uploading, setUploading] = useState(false);
  var [error, setError] = useState(null);
  var [dragActive, setDragActive] = useState(false);

  var TITLE_MAX = 200;
  var DESC_MAX = 500;
  var CATEGORY_MAX = 50;
  var todayStr = new Date().toISOString().split('T')[0];

  // Fetch org groups when visibility switches to 'groups'
  useEffect(function() {
    if (visibility !== 'groups') return;
    if (groups.length > 0) return;
    setGroupsLoading(true);
    supabase
      .from('org_groups')
      .select('id, name, color')
      .eq('organization_id', organizationId)
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

  function handleFileSelect(selectedFile) {
    var validation = validateFile(selectedFile);
    if (!validation.isValid) { setError(validation.errors.join(', ')); return; }
    setFile(selectedFile);
    if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').slice(0, TITLE_MAX));
    setError(null);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    if (visibility === 'groups' && selectedGroupIds.length === 0) {
      setError('Select at least one group.');
      return;
    }

    setUploading(true);
    setError(null);

    var uploadOptions = {
      organizationId: organizationId,
      folderId: folderId,
      title: title,
      description: description,
      visibility: visibility,
      allowedGroups: visibility === 'groups' ? selectedGroupIds : [],
    };

    var uploadResult = await uploadDocument(file, uploadOptions);
    if (uploadResult.error) { setError(uploadResult.error); setUploading(false); return; }

    var uploadedDoc = uploadResult.data;

    // Save delete_after and/or category if set
    var extraFields = {};
    if (deleteAfter) extraFields.delete_after = deleteAfter;
    if (category.trim()) extraFields.category = category.trim();

    if (Object.keys(extraFields).length > 0 && uploadedDoc && uploadedDoc.id) {
      var updateResult = await supabase
        .from('documents')
        .update(extraFields)
        .eq('id', uploadedDoc.id);
      if (!updateResult.error) {
        uploadedDoc = Object.assign({}, uploadedDoc, extraFields);
      }
    }

    // Notify members
    try {
      var notifResult = await notifyOrganizationMembers({
        organizationId: organizationId,
        type: 'document',
        title: 'New Document',
        message: title || file.name,
        link: '/organizations/' + organizationId + '/documents',
        excludeUserId: null,
      });
      if (!notifResult.error) window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch (notifError) {
      console.error('Notification error (document still uploaded):', notifError);
    }

    onSuccess(uploadedDoc);
    setFile(null);
    setTitle('');
    setDescription('');
    setCategory('');
    setDeleteAfter('');
    setVisibility('members');
    setSelectedGroupIds([]);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{background:'rgba(0,0,0,0.45)'}}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'}}
        onClick={function(e) { e.stopPropagation(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2
            id="upload-modal-title"
            style={{fontSize:'18px', fontWeight:800, color:'#0E1523', margin:0}}
          >
            Upload Document
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Close upload modal"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert" aria-live="assertive">
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={'border-2 border-dashed rounded-xl transition-colors ' + (dragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400')}
            aria-label="File drop zone"
          >
            {file ? (
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-green-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0E1523] truncate">{file.name}</p>
                  <p className="text-xs" style={{color:'#64748B'}}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={function() { setFile(null); setTitle(''); }}
                  className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-[#475569] mb-3">Drag and drop a file here, or</p>
                <input
                  type="file"
                  onChange={function(e) { if (e.target.files[0]) handleFileSelect(e.target.files[0]); }}
                  className="hidden"
                  id="file-input"
                  aria-label="Select file to upload"
                />
                <label
                  htmlFor="file-input"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-600 inline-block focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                >
                  Choose File
                </label>
                <p className="text-xs mt-2.5" style={{color:'#94A3B8'}}>Max 25 MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="upload-doc-title" className="text-sm font-semibold" style={{color:'#0E1523'}}>
                Title <span aria-hidden="true" style={{color:'#EF4444'}}>*</span>
              </label>
              <span
                className={'text-xs ' + (title.length >= TITLE_MAX ? 'text-red-500 font-semibold' : 'text-[#94A3B8]')}
                aria-live="polite"
              >
                {TITLE_MAX - title.length}
              </span>
            </div>
            <input
              id="upload-doc-title"
              type="text"
              required
              value={title}
              onChange={function(e) { if (e.target.value.length <= TITLE_MAX) setTitle(e.target.value); }}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-[#0E1523] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={TITLE_MAX}
              aria-required="true"
              placeholder="Document title"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="upload-doc-description" className="text-sm font-semibold" style={{color:'#0E1523'}}>
                Description{' '}
                <span className="font-normal" style={{color:'#94A3B8'}}>(Optional)</span>
              </label>
              <span
                className={'text-xs ' + (description.length >= DESC_MAX ? 'text-red-500 font-semibold' : 'text-[#94A3B8]')}
                aria-live="polite"
              >
                {DESC_MAX - description.length}
              </span>
            </div>
            <textarea
              id="upload-doc-description"
              value={description}
              onChange={function(e) { if (e.target.value.length <= DESC_MAX) setDescription(e.target.value); }}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-[#0E1523] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={DESC_MAX}
              placeholder="Optional notes about this document"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="upload-doc-category" className="text-sm font-semibold" style={{color:'#0E1523'}}>
                Category{' '}
                <span className="font-normal" style={{color:'#94A3B8'}}>(Optional)</span>
              </label>
              {category.length > 0 && (
                <span
                  className={'text-xs ' + (category.length >= CATEGORY_MAX ? 'text-red-500 font-semibold' : 'text-[#94A3B8]')}
                  aria-live="polite"
                >
                  {CATEGORY_MAX - category.length}
                </span>
              )}
            </div>
            <input
              id="upload-doc-category"
              type="text"
              value={category}
              onChange={function(e) { if (e.target.value.length <= CATEGORY_MAX) setCategory(e.target.value); }}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-[#0E1523] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={CATEGORY_MAX}
              placeholder="e.g. Minutes, Policies, Forms, Financials"
              aria-describedby="upload-category-hint"
            />
            <p id="upload-category-hint" className="text-xs mt-1" style={{color:'#94A3B8'}}>
              Used to filter documents in the library.
            </p>
          </div>

          {/* Visibility */}
          <div>
            <label htmlFor="upload-doc-visibility" className="block text-sm font-semibold mb-1.5" style={{color:'#0E1523'}}>
              Who can see this?
            </label>
            <select
              id="upload-doc-visibility"
              value={visibility}
              onChange={function(e) { setVisibility(e.target.value); if (e.target.value !== 'groups') setSelectedGroupIds([]); }}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-[#0E1523] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="members">All Members</option>
              <option value="admin">Admins Only</option>
              <option value="groups">Specific Groups</option>
            </select>
          </div>

          {/* Group picker — shown when visibility = 'groups' */}
          {visibility === 'groups' && (
            <div
              className="border border-slate-200 rounded-xl overflow-hidden"
              role="group"
              aria-labelledby="upload-groups-label"
            >
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
                <span
                  id="upload-groups-label"
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

              {visibility === 'groups' && selectedGroupIds.length === 0 && !groupsLoading && groups.length > 0 && (
                <p className="px-3 py-2 text-xs border-t border-slate-200" style={{color:'#EF4444'}}>
                  Select at least one group.
                </p>
              )}
            </div>
          )}

          {/* Auto-delete date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="upload-doc-delete-after" className="text-sm font-semibold" style={{color:'#0E1523'}}>
                Auto-delete after{' '}
                <span className="font-normal" style={{color:'#94A3B8'}}>(Optional)</span>
              </label>
              {deleteAfter && (
                <button
                  type="button"
                  onClick={function() { setDeleteAfter(''); }}
                  className="text-xs text-[#64748B] hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
                  aria-label="Clear auto-delete date"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
              <input
                id="upload-doc-delete-after"
                type="date"
                value={deleteAfter}
                min={todayStr}
                onChange={function(e) { setDeleteAfter(e.target.value); }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {deleteAfter ? (
              <p className="text-xs mt-1.5 font-semibold" style={{color:'#F59E0B'}}>
                {'Will auto-delete on ' + new Date(deleteAfter + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'}) + '.'}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{color:'#94A3B8'}}>
                Useful for event fliers or time-sensitive files.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 border border-slate-300 text-[#475569] font-semibold rounded-lg text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || (visibility === 'groups' && selectedGroupIds.length === 0)}
              className="px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              aria-busy={uploading}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Uploading" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Upload
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default FileUploadModal;