import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import {
  fetchFolders,
  fetchDocuments,
  searchDocuments,
  fetchStorageUsage,
  deleteFolder,
  deleteDocument,
  formatFileSize
} from '../lib/documentService';
import { supabase } from '../lib/supabase';
import DocumentCard from '../components/DocumentCard';
import FileUploadModal from '../components/FileUploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import {
  LayoutGrid, List, FolderPlus, Upload, Search, X, Folder,
  Trash2, FileText, AlertTriangle, CheckSquare, Calendar, Tag,
  Layers, Pencil, Check, Plus, Filter
} from 'lucide-react';

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] px-4"
      style={{background:'rgba(0,0,0,0.45)'}}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={function(e) { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm"
        style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'}}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-modal-title" style={{fontSize:'16px', fontWeight:800, color:'#0E1523', margin:'0 0 4px 0'}}>
              {title}
            </h2>
            <p className="text-sm" style={{color:'#475569'}}>{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-[#475569] font-semibold text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={'flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ' + (confirmClass || 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500')}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Labels Modal ───────────────────────────────────────────────────────
function ManageLabelsModal({ isOpen, onClose, organizationId, onLabelsChanged }) {
  var [activeTab, setActiveTab] = useState('categories');
  var [categories, setCategories] = useState([]);
  var [catsLoading, setCatsLoading] = useState(false);
  var [newCat, setNewCat] = useState('');
  var [editingCatIdx, setEditingCatIdx] = useState(null);
  var [editingCatVal, setEditingCatVal] = useState('');
  var [catSaving, setCatSaving] = useState(false);
  var [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  var [tags, setTags] = useState([]);
  var [tagsLoading, setTagsLoading] = useState(false);
  var [newTag, setNewTag] = useState('');
  var [editingTagIdx, setEditingTagIdx] = useState(null);
  var [editingTagVal, setEditingTagVal] = useState('');
  var [tagSaving, setTagSaving] = useState(false);
  var [confirmDeleteTag, setConfirmDeleteTag] = useState(null);

  useEffect(function() {
    if (!isOpen || !organizationId) return;
    loadCategories();
    loadTags();
  }, [isOpen]);

  async function loadCategories() {
    setCatsLoading(true);
    var key = 'doc_categories_' + organizationId;
    var scResult = await supabase
      .from('site_content')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!scResult.error && scResult.data) {
      try {
        var parsed = JSON.parse(scResult.data.value);
        setCategories(Array.isArray(parsed) ? parsed : []);
        setCatsLoading(false);
        return;
      } catch(e) {}
    }
    // Fallback: derive from documents
    var result = await supabase
      .from('documents')
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null);
    if (!result.error && result.data) {
      var unique = [];
      result.data.forEach(function(d) {
        if (d.category && unique.indexOf(d.category) === -1) unique.push(d.category);
      });
      unique.sort();
      setCategories(unique);
    }
    setCatsLoading(false);
  }

  async function loadTags() {
    setTagsLoading(true);
    var result = await supabase
      .from('documents')
      .select('tags')
      .eq('organization_id', organizationId)
      .not('tags', 'is', null);
    if (!result.error && result.data) {
      var unique = [];
      result.data.forEach(function(d) {
        if (Array.isArray(d.tags)) {
          d.tags.forEach(function(t) {
            if (t && unique.indexOf(t) === -1) unique.push(t);
          });
        }
      });
      unique.sort();
      setTags(unique);
    }
    setTagsLoading(false);
  }

  async function persistCategories(list) {
    var key = 'doc_categories_' + organizationId;
    await supabase
      .from('site_content')
      .upsert({ key: key, value: JSON.stringify(list) }, { onConflict: 'key' });
  }

  async function handleAddCategory() {
    var val = newCat.trim();
    if (!val) return;
    if (categories.indexOf(val) !== -1) { toast.error('Category already exists.'); return; }
    setCatSaving(true);
    var newList = categories.concat([val]).sort();
    var res = await persistCategories(newList);
    if (res && res.error) {
      mascotErrorToast('Failed to add category.');
    } else {
      setCategories(newList);
      setNewCat('');
      if (onLabelsChanged) onLabelsChanged();
    }
    setCatSaving(false);
  }

  async function handleRenameCategory(oldVal) {
    var newVal = editingCatVal.trim();
    if (!newVal || newVal === oldVal) { setEditingCatIdx(null); return; }
    if (categories.indexOf(newVal) !== -1) { toast.error('A category with that name already exists.'); return; }
    setCatSaving(true);
    var docsResult = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('category', oldVal);
    if (!docsResult.error && docsResult.data && docsResult.data.length > 0) {
      var ids = docsResult.data.map(function(d) { return d.id; });
      await supabase.from('documents').update({ category: newVal }).in('id', ids);
    }
    var newList = categories.map(function(c) { return c === oldVal ? newVal : c; }).sort();
    await persistCategories(newList);
    setCategories(newList);
    setEditingCatIdx(null);
    setCatSaving(false);
    if (onLabelsChanged) onLabelsChanged();
    mascotSuccessToast('Category renamed!');
  }

  async function handleDeleteCategory(val) {
    setCatSaving(true);
    var docsResult = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('category', val);
    if (!docsResult.error && docsResult.data && docsResult.data.length > 0) {
      var ids = docsResult.data.map(function(d) { return d.id; });
      await supabase.from('documents').update({ category: null }).in('id', ids);
    }
    var newList = categories.filter(function(c) { return c !== val; });
    await persistCategories(newList);
    setCategories(newList);
    setConfirmDeleteCat(null);
    setCatSaving(false);
    if (onLabelsChanged) onLabelsChanged();
    mascotSuccessToast('Category deleted.');
  }

  async function handleAddTag() {
    var val = newTag.trim().slice(0, 30);
    if (!val) return;
    if (tags.indexOf(val) !== -1) { toast.error('Tag already exists.'); return; }
    setTagSaving(true);
    // Tags live on documents — a new tag with no docs is stored as a site_content key so it shows in suggestions
    var key = 'doc_tags_' + organizationId;
    var scResult = await supabase.from('site_content').select('value').eq('key', key).maybeSingle();
    var existing = [];
    if (!scResult.error && scResult.data) {
      try { existing = JSON.parse(scResult.data.value); } catch(e) {}
    }
    // Merge with live tags from docs
    var merged = existing.concat(tags).filter(function(t, i, arr) { return arr.indexOf(t) === i; });
    if (merged.indexOf(val) === -1) merged.push(val);
    merged.sort();
    await supabase.from('site_content').upsert({ key: key, value: JSON.stringify(merged) }, { onConflict: 'key' });
    var newList = tags.concat([val]).sort();
    setTags(newList);
    setNewTag('');
    setTagSaving(false);
    if (onLabelsChanged) onLabelsChanged();
  }

  async function handleRenameTag(oldVal) {
    var newVal = editingTagVal.trim();
    if (!newVal || newVal === oldVal) { setEditingTagIdx(null); return; }
    if (tags.indexOf(newVal) !== -1) { toast.error('A tag with that name already exists.'); return; }
    setTagSaving(true);
    var docsResult = await supabase
      .from('documents')
      .select('id, tags')
      .eq('organization_id', organizationId)
      .contains('tags', [oldVal]);
    if (!docsResult.error && docsResult.data) {
      for (var i = 0; i < docsResult.data.length; i++) {
        var d = docsResult.data[i];
        var updatedTags = d.tags.map(function(t) { return t === oldVal ? newVal : t; });
        await supabase.from('documents').update({ tags: updatedTags }).eq('id', d.id);
      }
    }
    var newList = tags.map(function(t) { return t === oldVal ? newVal : t; }).sort();
    setTags(newList);
    setEditingTagIdx(null);
    setTagSaving(false);
    if (onLabelsChanged) onLabelsChanged();
    mascotSuccessToast('Tag renamed!');
  }

  async function handleDeleteTag(val) {
    setTagSaving(true);
    var docsResult = await supabase
      .from('documents')
      .select('id, tags')
      .eq('organization_id', organizationId)
      .contains('tags', [val]);
    if (!docsResult.error && docsResult.data) {
      for (var i = 0; i < docsResult.data.length; i++) {
        var d = docsResult.data[i];
        var updatedTags = d.tags.filter(function(t) { return t !== val; });
        await supabase.from('documents').update({ tags: updatedTags.length > 0 ? updatedTags : null }).eq('id', d.id);
      }
    }
    var newList = tags.filter(function(t) { return t !== val; });
    setTags(newList);
    setConfirmDeleteTag(null);
    setTagSaving(false);
    if (onLabelsChanged) onLabelsChanged();
    mascotSuccessToast('Tag deleted.');
  }

  if (!isOpen) return null;

  return (
    <div>
      <div
        className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{background:'rgba(0,0,0,0.45)'}}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-labels-title"
        onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col"
          style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'}}
          onClick={function(e) { e.stopPropagation(); }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <h2 id="manage-labels-title" style={{fontSize:'18px', fontWeight:800, color:'#0E1523', margin:0}}>
              Manage Labels
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Close manage labels"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 flex-shrink-0" role="tablist" aria-label="Label types">
            {[
              { key: 'categories', label: 'Categories', Icon: Layers },
              { key: 'tags', label: 'Tags', Icon: Tag }
            ].map(function(tab) {
              var isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={function() { setActiveTab(tab.key); }}
                  className={'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ' + (isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-[#64748B] hover:text-[#0E1523]')}
                >
                  <tab.Icon className="w-4 h-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

            {/* Categories tab */}
            {activeTab === 'categories' && (
              <div className="space-y-3">
                <p className="text-xs" style={{color:'#64748B'}}>
                  Categories organise documents into groups. Renaming or deleting a category updates all documents using it.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCat}
                    onChange={function(e) { setNewCat(e.target.value.slice(0, 50)); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                    placeholder="New category name..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-[#0E1523] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="New category name"
                    maxLength={50}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCat.trim() || catSaving}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    aria-label="Add category"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add
                  </button>
                </div>
                {catsLoading ? (
                  <div className="space-y-2" aria-busy="true">
                    {[1,2,3].map(function(i) { return <div key={i} className="h-10 rounded-lg animate-pulse bg-slate-100" />; })}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="py-8 text-center">
                    <Layers className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-semibold" style={{color:'#0E1523'}}>No categories yet</p>
                    <p className="text-xs mt-1" style={{color:'#64748B'}}>Add your first category above.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden" role="list" aria-label="Categories">
                    {categories.map(function(cat, idx) {
                      var isEditing = editingCatIdx === idx;
                      return (
                        <div key={cat} role="listitem" className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50">
                          <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" aria-hidden="true" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingCatVal}
                              onChange={function(e) { setEditingCatVal(e.target.value.slice(0, 50)); }}
                              onKeyDown={function(e) {
                                if (e.key === 'Enter') handleRenameCategory(cat);
                                if (e.key === 'Escape') setEditingCatIdx(null);
                              }}
                              className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                              aria-label={'Rename category ' + cat}
                              maxLength={50}
                            />
                          ) : (
                            <span className="flex-1 text-sm font-medium" style={{color:'#0E1523'}}>{cat}</span>
                          )}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isEditing ? (
                              <button
                                onClick={function() { handleRenameCategory(cat); }}
                                disabled={catSaving}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                aria-label="Save rename"
                              >
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                onClick={function() { setEditingCatIdx(idx); setEditingCatVal(cat); }}
                                className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                aria-label={'Rename category ' + cat}
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              onClick={function() { setConfirmDeleteCat(cat); }}
                              disabled={catSaving}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                              aria-label={'Delete category ' + cat}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tags tab */}
            {activeTab === 'tags' && (
              <div className="space-y-3">
                <p className="text-xs" style={{color:'#64748B'}}>
                  Tags are added per-document when uploading or editing. You can also pre-create tags here, or rename and delete existing ones.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={function(e) { setNewTag(e.target.value.slice(0, 30)); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="New tag name..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-[#0E1523] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="New tag name"
                    maxLength={30}
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || tagSaving}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    aria-label="Add tag"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add
                  </button>
                </div>
                {tagsLoading ? (
                  <div className="space-y-2" aria-busy="true">
                    {[1,2,3].map(function(i) { return <div key={i} className="h-10 rounded-lg animate-pulse bg-slate-100" />; })}
                  </div>
                ) : tags.length === 0 ? (
                  <div className="py-8 text-center">
                    <Tag className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm font-semibold" style={{color:'#0E1523'}}>No tags yet</p>
                    <p className="text-xs mt-1" style={{color:'#64748B'}}>Tags are added when uploading or editing documents.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden" role="list" aria-label="Tags">
                    {tags.map(function(tag, idx) {
                      var isEditing = editingTagIdx === idx;
                      return (
                        <div key={tag} role="listitem" className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50">
                          <Tag className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" aria-hidden="true" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingTagVal}
                              onChange={function(e) { setEditingTagVal(e.target.value.slice(0, 30)); }}
                              onKeyDown={function(e) {
                                if (e.key === 'Enter') handleRenameTag(tag);
                                if (e.key === 'Escape') setEditingTagIdx(null);
                              }}
                              className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                              aria-label={'Rename tag ' + tag}
                              maxLength={30}
                            />
                          ) : (
                            <span className="flex-1 text-sm font-medium" style={{color:'#0E1523'}}>{tag}</span>
                          )}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isEditing ? (
                              <button
                                onClick={function() { handleRenameTag(tag); }}
                                disabled={tagSaving}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                aria-label="Save rename"
                              >
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                onClick={function() { setEditingTagIdx(idx); setEditingTagVal(tag); }}
                                className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                aria-label={'Rename tag ' + tag}
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              onClick={function() { setConfirmDeleteTag(tag); }}
                              disabled={tagSaving}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                              aria-label={'Delete tag ' + tag}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-slate-300 text-[#475569] font-semibold rounded-lg text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmDeleteCat}
        title={'Delete "' + (confirmDeleteCat || '') + '"?'}
        message="This will remove the category from all documents using it. This cannot be undone."
        confirmLabel="Delete Category"
        onConfirm={function() { handleDeleteCategory(confirmDeleteCat); }}
        onCancel={function() { setConfirmDeleteCat(null); }}
      />
      <ConfirmModal
        isOpen={!!confirmDeleteTag}
        title={'Delete "' + (confirmDeleteTag || '') + '"?'}
        message="This will remove the tag from all documents using it. This cannot be undone."
        confirmLabel="Delete Tag"
        onConfirm={function() { handleDeleteTag(confirmDeleteTag); }}
        onCancel={function() { setConfirmDeleteTag(null); }}
      />
    </div>
  );
}

// ─── DocumentLibrary ──────────────────────────────────────────────────────────
function DocumentLibrary() {
  var { organizationId } = useParams();
  var outletCtx = useOutletContext() || {};
  var isAdmin = outletCtx.isAdmin || false;

  var [folders, setFolders] = useState([]);
  var [documents, setDocuments] = useState([]);
  var [currentFolder, setCurrentFolder] = useState(null);
  var [breadcrumbs, setBreadcrumbs] = useState([]);
  var [storageUsage, setStorageUsage] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [viewMode, setViewMode] = useState('grid');
  var [showUploadModal, setShowUploadModal] = useState(false);
  var [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  var [showManageLabels, setShowManageLabels] = useState(false);
  var [isEditor, setIsEditor] = useState(false);

  var [expiryFilter, setExpiryFilter] = useState('all');
  var [categoryFilter, setCategoryFilter] = useState('');
  var [activeTagFilters, setActiveTagFilters] = useState([]);
  var [sortBy, setSortBy] = useState('date_desc');
  var [showFilterDropdown, setShowFilterDropdown] = useState(false);

  var [bulkSelectMode, setBulkSelectMode] = useState(false);
  var [selectedDocIds, setSelectedDocIds] = useState([]);
  var [showBulkExpiryModal, setShowBulkExpiryModal] = useState(false);
  var [bulkExpiryDate, setBulkExpiryDate] = useState('');
  var [bulkExpiryLoading, setBulkExpiryLoading] = useState(false);

  var [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);
  var [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  var [confirmBulkClear, setConfirmBulkClear] = useState(false);
  var [renamingFolderId, setRenamingFolderId] = useState(null);
  var [renamingFolderVal, setRenamingFolderVal] = useState('');
  var [folderRenameSaving, setFolderRenameSaving] = useState(false);
  var [folderDocCounts, setFolderDocCounts] = useState({});

  var canManage = isAdmin || isEditor;
  var canUpload = isAdmin || isEditor;

  useEffect(function() {
    if (isAdmin) return;
    async function checkEditorRole() {
      var userResult = await supabase.auth.getUser();
      if (!userResult.data || !userResult.data.user) return;
      var result = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', userResult.data.user.id)
        .eq('status', 'active')
        .single();
      if (result.data && result.data.role === 'editor') setIsEditor(true);
    }
    checkEditorRole();
  }, [organizationId, isAdmin]);

  useEffect(function() {
    fetchData();
  }, [organizationId, currentFolder]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      var foldersResult = await fetchFolders(organizationId);
      if (foldersResult.error) throw new Error(foldersResult.error);
      setFolders(foldersResult.data || []);

      var docsResult = await fetchDocuments(organizationId, currentFolder ? currentFolder.id : null);
      if (docsResult.error) throw new Error(docsResult.error);

      var uniqueDocs = docsResult.data
        ? Array.from(new Map(docsResult.data.map(function(d) { return [d.id, d]; })).values())
        : [];
      setDocuments(uniqueDocs);

      // Fetch folder file counts from DB
      var countsResult = await supabase
        .from('documents')
        .select('folder_id')
        .eq('organization_id', organizationId);
      if (!countsResult.error && countsResult.data) {
        var counts = {};
        countsResult.data.forEach(function(d) {
          var fid = d.folder_id || '__root__';
          counts[fid] = (counts[fid] || 0) + 1;
        });
        setFolderDocCounts(counts);
      }

      var usageResult = await fetchStorageUsage(organizationId);
      if (!usageResult.error) setStorageUsage(usageResult.data);

      if (currentFolder) {
        setBreadcrumbs([{ id: null, name: 'Documents' }, { id: currentFolder.id, name: currentFolder.name }]);
      } else {
        setBreadcrumbs([{ id: null, name: 'Documents' }]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }

  function getExpiryStatus(doc) {
    if (!doc.delete_after) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var expiry = new Date(doc.delete_after + 'T00:00:00');
    expiry.setHours(0, 0, 0, 0);
    var diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 3) return 'danger';
    if (diffDays <= 7) return 'warning';
    return 'scheduled';
  }

  function getDaysUntilExpiry(doc) {
    if (!doc.delete_after) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var expiry = new Date(doc.delete_after + 'T00:00:00');
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  }

  var expiringCount = documents.filter(function(d) {
    var days = getDaysUntilExpiry(d);
    return days !== null && days > 0 && days <= 7;
  }).length;

  var expiredCount = documents.filter(function(d) {
    var days = getDaysUntilExpiry(d);
    return days !== null && days <= 0;
  }).length;

  var categories = documents
    .map(function(d) { return d.category; })
    .filter(function(c) { return c && c.trim() !== ''; })
    .filter(function(c, i, arr) { return arr.indexOf(c) === i; })
    .sort();

  var allTagsInDocs = [];
  documents.forEach(function(d) {
    if (Array.isArray(d.tags)) {
      d.tags.forEach(function(t) {
        if (t && allTagsInDocs.indexOf(t) === -1) allTagsInDocs.push(t);
      });
    }
  });
  allTagsInDocs.sort();

  function toggleTagFilter(tag) {
    setActiveTagFilters(function(prev) {
      if (prev.indexOf(tag) !== -1) return prev.filter(function(t) { return t !== tag; });
      return prev.concat([tag]);
    });
  }

  var filteredDocs = documents.filter(function(d) {
    if (expiryFilter === 'expiring_soon') {
      var days = getDaysUntilExpiry(d);
      if (!(days !== null && days > 0 && days <= 7)) return false;
    }
    if (expiryFilter === 'expired') {
      var days2 = getDaysUntilExpiry(d);
      if (!(days2 !== null && days2 <= 0)) return false;
    }
    if (categoryFilter) {
      if ((d.category || '') !== categoryFilter) return false;
    }
    if (activeTagFilters.length > 0) {
      var docTags = Array.isArray(d.tags) ? d.tags : [];
      var hasAll = activeTagFilters.every(function(ft) { return docTags.indexOf(ft) !== -1; });
      if (!hasAll) return false;
    }
    return true;
  });

  // Sort — fixed: a.title not a.name
  var sortedDocs = filteredDocs.slice().sort(function(a, b) {
    if (sortBy === 'name_asc') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'name_desc') return (b.title || '').localeCompare(a.title || '');
    if (sortBy === 'date_asc') return new Date(a.uploaded_at || a.created_at) - new Date(b.uploaded_at || b.created_at);
    if (sortBy === 'expiry_asc') {
      if (!a.delete_after && !b.delete_after) return 0;
      if (!a.delete_after) return 1;
      if (!b.delete_after) return -1;
      return new Date(a.delete_after) - new Date(b.delete_after);
    }
    return new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at);
  });

  var storagePercent = (storageUsage && storageUsage.max_bytes && storageUsage.max_bytes > 0)
    ? Math.min(100, (storageUsage.total_bytes / storageUsage.max_bytes) * 100)
    : 0;
  var storageBarColor = storagePercent >= 90 ? '#EF4444' : storagePercent >= 80 ? '#F59E0B' : '#22C55E';

  var subtitleParts = [];
  if (documents.length > 0) subtitleParts.push(documents.length + (documents.length === 1 ? ' document' : ' documents'));
  if (expiringCount > 0) subtitleParts.push(expiringCount + ' expiring soon');
  if (expiredCount > 0) subtitleParts.push(expiredCount + ' expired');
  if (storageUsage && !storageUsage.max_bytes) subtitleParts.push(formatFileSize(storageUsage.total_bytes) + ' used');
  var subtitle = subtitleParts.join(' \u00b7 ');

  var hasActiveFilter = expiryFilter !== 'all' || categoryFilter !== '' || activeTagFilters.length > 0;

  function clearAllFilters() {
    setExpiryFilter('all');
    setCategoryFilter('');
    setActiveTagFilters([]);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim()) { fetchData(); return; }
    setLoading(true);
    var result = await searchDocuments(organizationId, searchTerm);
    if (result.error) { setError(result.error); } else { setDocuments(result.data || []); }
    setLoading(false);
  }

  function navigateToFolder(folder) {
    setCurrentFolder(folder || null);
    setSelectedDocIds([]);
    setBulkSelectMode(false);
  }

  function handleFolderCreated(newFolder) {
    setFolders([...folders, newFolder]);
    setShowCreateFolderModal(false);
    mascotSuccessToast('Folder created!');
  }

  function handleDocumentUploaded(newDoc) {
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    fetchData();
    mascotSuccessToast('Document uploaded!');
  }

  async function executeDeleteFolder(folderId) {
    var result = await deleteFolder(folderId);
    if (result.error) { mascotErrorToast('Failed to delete folder.', 'Please try again.'); }
    else {
      setFolders(folders.filter(function(f) { return f.id !== folderId; }));
      if (currentFolder && currentFolder.id === folderId) navigateToFolder(null);
      mascotSuccessToast('Folder deleted.');
    }
    setConfirmDeleteFolder(null);
  }

  async function executeFolderRename(folderId, newName) {
    var val = newName.trim();
    if (!val) { setRenamingFolderId(null); return; }
    setFolderRenameSaving(true);
    var result = await supabase
      .from('org_folders')
      .update({ name: val })
      .eq('id', folderId);
    setFolderRenameSaving(false);
    if (result.error) {
      mascotErrorToast('Failed to rename folder.');
    } else {
      setFolders(function(prev) {
        return prev.map(function(f) { return f.id === folderId ? Object.assign({}, f, { name: val }) : f; });
      });
      if (currentFolder && currentFolder.id === folderId) {
        setCurrentFolder(Object.assign({}, currentFolder, { name: val }));
        setBreadcrumbs([{ id: null, name: 'Documents' }, { id: folderId, name: val }]);
      }
      mascotSuccessToast('Folder renamed!');
    }
    setRenamingFolderId(null);
  }

  function handleDeleteDocument(documentId) {
    var doc = documents.find(function(d) { return d.id === documentId; });
    var expiryStatus = doc ? getExpiryStatus(doc) : null;
    var days = doc ? getDaysUntilExpiry(doc) : null;
    var message = 'This document will be permanently deleted and cannot be recovered.';
    if (expiryStatus === 'danger') {
      message = 'Scheduled to auto-delete in ' + days + ' day' + (days === 1 ? '' : 's') + '. Delete it now permanently?';
    } else if (expiryStatus === 'warning') {
      message = 'This document is expiring soon. Delete it now permanently?';
    }
    setConfirmDeleteDoc({ id: documentId, message: message });
  }

  async function executeDeleteDocument(documentId) {
    var result = await deleteDocument(documentId);
    if (result.error) { mascotErrorToast('Failed to delete document.', 'Please try again.'); }
    else {
      setDocuments(documents.filter(function(d) { return d.id !== documentId; }));
      fetchData();
      mascotSuccessToast('Document deleted.');
    }
    setConfirmDeleteDoc(null);
  }

  function handleUpdateDocument(updatedDoc) {
    // If doc was moved to a different folder, remove it from current view
    var currentFolderId = currentFolder ? currentFolder.id : null;
    var docNewFolderId = updatedDoc.folder_id || null;
    if (docNewFolderId !== currentFolderId) {
      setDocuments(function(prev) {
        return prev.filter(function(d) { return d.id !== updatedDoc.id; });
      });
      // Refresh to update folder counts
      fetchData();
    } else {
      setDocuments(function(prev) {
        return prev.map(function(d) { return d.id === updatedDoc.id ? updatedDoc : d; });
      });
    }
  }

  async function handleBulkSetExpiry() {
    if (!bulkExpiryDate || selectedDocIds.length === 0) return;
    setBulkExpiryLoading(true);
    var result = await supabase.from('documents').update({ delete_after: bulkExpiryDate }).in('id', selectedDocIds);
    setBulkExpiryLoading(false);
    if (result.error) {
      mascotErrorToast('Failed to set expiry dates.', 'Please try again.');
    } else {
      var updatedIds = selectedDocIds.slice();
      setDocuments(function(prev) {
        return prev.map(function(d) {
          return updatedIds.indexOf(d.id) !== -1 ? Object.assign({}, d, { delete_after: bulkExpiryDate }) : d;
        });
      });
      setShowBulkExpiryModal(false);
      setBulkSelectMode(false);
      setSelectedDocIds([]);
      setBulkExpiryDate('');
      mascotSuccessToast('Expiry dates set!', updatedIds.length + ' documents updated.');
    }
  }

  async function executeBulkClearExpiry() {
    var updatedIds = selectedDocIds.slice();
    var result = await supabase.from('documents').update({ delete_after: null }).in('id', updatedIds);
    if (result.error) {
      mascotErrorToast('Failed to clear expiry dates.');
    } else {
      setDocuments(function(prev) {
        return prev.map(function(d) {
          return updatedIds.indexOf(d.id) !== -1 ? Object.assign({}, d, { delete_after: null }) : d;
        });
      });
      setSelectedDocIds([]);
      setBulkSelectMode(false);
      mascotSuccessToast('Expiry dates cleared!', updatedIds.length + ' documents updated.');
    }
    setConfirmBulkClear(false);
  }

  function toggleDocSelection(docId) {
    setSelectedDocIds(function(prev) {
      if (prev.indexOf(docId) !== -1) return prev.filter(function(id) { return id !== docId; });
      return prev.concat([docId]);
    });
  }

  function selectAllDocs() {
    if (selectedDocIds.length === sortedDocs.length && sortedDocs.length > 0) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(sortedDocs.map(function(d) { return d.id; }));
    }
  }

  var currentFolders = folders.filter(function(f) {
    return currentFolder ? f.parent_folder_id === currentFolder.id : !f.parent_folder_id;
  });

  var todayStr = new Date().toISOString().split('T')[0];

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading && !documents.length && !folders.length) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="px-6 py-6" aria-busy="true" aria-label="Loading documents">
          <div className="h-8 w-52 rounded-lg mb-2 animate-pulse bg-slate-200" />
          <div className="h-4 w-36 rounded mb-6 animate-pulse bg-slate-200" />
          <div className="h-10 w-full rounded-xl mb-6 animate-pulse bg-slate-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(function(i) {
              return <div key={i} className="h-52 rounded-xl animate-pulse bg-slate-200" />;
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !documents.length) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div
          className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-sm w-full"
          role="alert"
          style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'}}
        >
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-[#0E1523] mb-2">Failed to Load Documents</h2>
          <p className="text-sm text-[#64748B] mb-5">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <div className="px-6 py-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
          <div>
            <h1 style={{fontSize:'30px', fontWeight:800, color:'#0E1523', margin:0}}>Document Library</h1>
            {subtitle && <p className="text-sm mt-1" style={{color:'#64748B'}}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-lg p-1 border bg-slate-100 border-slate-200" role="group" aria-label="View mode">
              <button
                onClick={function() { setViewMode('grid'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-[#64748B]')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={function() { setViewMode('list'); }}
                className={'px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-[#64748B]')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={function() { setShowManageLabels(true); }}
                className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-white border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Manage labels"
              >
                <Tag className="w-4 h-4" aria-hidden="true" />
                Manage Labels
              </button>
            )}

            {/* Rename / Delete folder — shown when inside a folder */}
            {currentFolder && canManage && (
              <div className="flex items-center gap-3">
                <button
                  onClick={function() { setRenamingFolderId(currentFolder.id); setRenamingFolderVal(currentFolder.name); }}
                  className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-white border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  aria-label={'Rename folder ' + currentFolder.name}
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  Rename Folder
                </button>
                <button
                  onClick={function() { setConfirmDeleteFolder({ id: currentFolder.id, name: currentFolder.name }); }}
                  className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  aria-label={'Delete folder ' + currentFolder.name}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Delete Folder
                </button>
              </div>
            )}

            {canManage && documents.length > 0 && (
              <button
                onClick={function() { setBulkSelectMode(!bulkSelectMode); setSelectedDocIds([]); }}
                className={'px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (bulkSelectMode ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-300 text-[#475569] hover:bg-slate-50')}
                aria-pressed={bulkSelectMode}
                aria-label="Toggle bulk select mode"
              >
                <CheckSquare className="w-4 h-4" aria-hidden="true" />
                {bulkSelectMode ? 'Cancel' : 'Select'}
              </button>
            )}

            {canManage && (
              <button
                onClick={function() { setShowCreateFolderModal(true); }}
                className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-white border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Create new folder"
              >
                <FolderPlus className="w-4 h-4" aria-hidden="true" />
                New Folder
              </button>
            )}
            {canUpload && (
              <button
                onClick={function() { setShowUploadModal(true); }}
                className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                aria-label="Upload document"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Upload
              </button>
            )}
          </div>
        </div>

        {/* ── Storage bar ── */}
        {storageUsage && storageUsage.max_bytes > 0 && (
          <div className="mb-5 mt-3">
            <div className="flex justify-between text-xs mb-1.5" style={{color:'#64748B'}}>
              <span>{formatFileSize(storageUsage.total_bytes)} used</span>
              <span>{formatFileSize(storageUsage.max_bytes)} total</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{width: storagePercent + '%', background: storageBarColor, height: '100%', borderRadius: '9999px', transition: 'width 0.3s ease'}}
                role="progressbar"
                aria-valuenow={Math.round(storagePercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={'Storage ' + Math.round(storagePercent) + '% used'}
              />
            </div>
            {storagePercent >= 80 && (
              <p className="text-xs mt-1.5" style={{color: storagePercent >= 90 ? '#EF4444' : '#F59E0B'}}>
                {storagePercent >= 90 ? 'Storage almost full — consider deleting old files.' : 'Storage is getting full.'}
              </p>
            )}
          </div>
        )}

        {/* ── Bulk action bar ── */}
        {bulkSelectMode && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex-wrap" role="toolbar" aria-label="Bulk actions">
            <button
              onClick={selectAllDocs}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {selectedDocIds.length === sortedDocs.length && sortedDocs.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm" style={{color:'#64748B'}} aria-live="polite">{selectedDocIds.length} selected</span>
            {selectedDocIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={function() { setShowBulkExpiryModal(true); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  Set Expiry Date
                </button>
                <button
                  onClick={function() { setConfirmBulkClear(true); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-slate-300 text-[#475569] hover:bg-slate-50 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  Clear Expiry
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Breadcrumbs ── */}
        <nav aria-label="Folder navigation" className="mb-5">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map(function(crumb, index) {
              var isLast = index === breadcrumbs.length - 1;
              var label = (!isLast && index === 0) ? 'Back to all documents' : crumb.name;
              return (
                <li key={crumb.id || 'root'} className="flex items-center gap-2">
                  {index > 0 && <span className="text-[#94A3B8]" aria-hidden="true">/</span>}
                  {isLast && crumb.id && renamingFolderId === crumb.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={renamingFolderVal}
                        onChange={function(e) { setRenamingFolderVal(e.target.value); }}
                        onKeyDown={function(e) {
                          if (e.key === 'Enter') executeFolderRename(crumb.id, renamingFolderVal);
                          if (e.key === 'Escape') setRenamingFolderId(null);
                        }}
                        className="px-2 py-1 border border-blue-300 rounded text-sm text-[#0E1523] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        aria-label="Folder name"
                        maxLength={100}
                      />
                      <button
                        onClick={function() { executeFolderRename(crumb.id, renamingFolderVal); }}
                        disabled={folderRenameSaving}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        aria-label="Save folder name"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={function() { setRenamingFolderId(null); }}
                        className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        aria-label="Cancel rename"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={function() { navigateToFolder(crumb.id ? folders.find(function(f) { return f.id === crumb.id; }) : null); }}
                      className={'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors ' + (isLast ? 'text-[#0E1523] font-semibold cursor-default' : 'text-blue-500 hover:text-blue-600 hover:underline')}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {label}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── Search + Filters + Sort ── */}
        <div className="mb-6 flex flex-col gap-3">
          <form onSubmit={handleSearch} role="search" className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" aria-hidden="true" />
              <input
                id="doc-search"
                type="search"
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                placeholder="Search by name or description..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-[#0E1523] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search documents"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={function() { setSearchTerm(''); fetchData(); }}
                className="px-3 py-2.5 rounded-lg border border-slate-300 text-[#475569] text-sm flex items-center gap-1 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </form>

          {/* Expiry tabs + Filter button + Sort row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2" role="group" aria-label="Filter by expiry status">
              {[
                { key: 'all', label: 'All' },
                { key: 'expiring_soon', label: 'Expiring Soon', count: expiringCount },
                { key: 'expired', label: 'Expired', count: expiredCount },
              ].map(function(tab) {
                var isActive = expiryFilter === tab.key;
                var activeClass = tab.key === 'expired'
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : tab.key === 'expiring_soon'
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-blue-50 border-blue-300 text-blue-600';
                var countClass = tab.key === 'expired' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700';
                return (
                  <button
                    key={tab.key}
                    onClick={function() { setExpiryFilter(tab.key); }}
                    aria-pressed={isActive}
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ' + (isActive ? activeClass : 'bg-white border-slate-200 text-[#64748B] hover:border-slate-300 hover:text-[#0E1523]')}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={'ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ' + countClass}>{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter dropdown button — categories + tags */}
              {(categories.length > 0 || allTagsInDocs.length > 0) && (
                <div className="relative">
                  <button
                    onClick={function() { setShowFilterDropdown(!showFilterDropdown); }}
                    aria-expanded={showFilterDropdown}
                    aria-haspopup="true"
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center gap-1.5 ' + ((categoryFilter || activeTagFilters.length > 0) ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-[#64748B] hover:border-slate-300 hover:text-[#0E1523]')}
                  >
                    <Filter className="w-3 h-3" aria-hidden="true" />
                    Filter
                    {(categoryFilter || activeTagFilters.length > 0) && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                        {(categoryFilter ? 1 : 0) + activeTagFilters.length}
                      </span>
                    )}
                  </button>

                  {showFilterDropdown && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl z-20 p-4 space-y-4"
                      style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)'}}
                    >
                      {/* Click outside to close */}
                      <div
                        className="fixed inset-0 z-[-1]"
                        onClick={function() { setShowFilterDropdown(false); }}
                        aria-hidden="true"
                      />

                      {/* Category filter */}
                      {categories.length > 0 && (
                        <div>
                          <label htmlFor="doc-category-dd" className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{color:'#0E1523'}}>
                            <Layers className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                            Category
                          </label>
                          <select
                            id="doc-category-dd"
                            value={categoryFilter}
                            onChange={function(e) { setCategoryFilter(e.target.value); }}
                            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Filter by category"
                          >
                            <option value="">All Categories</option>
                            {categories.map(function(cat) { return <option key={cat} value={cat}>{cat}</option>; })}
                          </select>
                        </div>
                      )}

                      {/* Tag filter */}
                      {allTagsInDocs.length > 0 && (
                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{color:'#0E1523'}}>
                            <Tag className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                            Tags
                          </p>
                          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
                            {allTagsInDocs.map(function(tag) {
                              var isActive = activeTagFilters.indexOf(tag) !== -1;
                              return (
                                <button
                                  key={tag}
                                  onClick={function() { toggleTagFilter(tag); }}
                                  aria-pressed={isActive}
                                  className={'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isActive ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-slate-200 text-[#64748B] hover:border-blue-300 hover:text-blue-600')}
                                >
                                  <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Clear filters */}
                      {(categoryFilter || activeTagFilters.length > 0) && (
                        <button
                          onClick={function() { setCategoryFilter(''); setActiveTagFilters([]); }}
                          className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        >
                          <X className="w-3 h-3" aria-hidden="true" />
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label htmlFor="doc-sort" className="text-xs font-medium" style={{color:'#64748B'}}>Sort</label>
                <select
                  id="doc-sort"
                  value={sortBy}
                  onChange={function(e) { setSortBy(e.target.value); }}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Sort documents"
                >
                  <option value="date_desc">Newest first</option>
                  <option value="date_asc">Oldest first</option>
                  <option value="name_asc">Name A–Z</option>
                  <option value="name_desc">Name Z–A</option>
                  <option value="expiry_asc">Expiry date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filter summary */}
          {hasActiveFilter && (
            <div className="flex items-center gap-2" aria-live="polite">
              <span className="text-xs" style={{color:'#64748B'}}>
                Showing {sortedDocs.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* ── Folders ── */}
        {currentFolders.length > 0 && (
          <section className="mb-8" aria-label="Folders">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#F5B731] mb-4">Folders</h2>
            <div className={'grid gap-4 ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}>
              {currentFolders.map(function(folder) {
                return (
                  <div
                    key={folder.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer transition-all hover:border-blue-400"
                    style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'}}
                    onClick={function() { navigateToFolder(folder); }}
                    onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToFolder(folder); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={'Open folder: ' + folder.name}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Folder className="w-8 h-8 text-blue-400 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate text-sm text-[#0E1523]">{folder.name}</h3>
                          {folder.description && <p className="text-xs truncate mt-0.5 text-[#475569]">{folder.description}</p>}
                          <p className="text-xs mt-1 text-[#64748B]">{folderDocCounts[folder.id] || 0} {(folderDocCounts[folder.id] || 0) === 1 ? 'file' : 'files'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Documents ── */}
        <section aria-label="Documents">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#F5B731] mb-4">
            {'Documents' + (sortedDocs.length > 0 ? ' (' + sortedDocs.length + ')' : '')}
          </h2>

          {sortedDocs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-[#64748B]" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-[#0E1523] mb-1">
                {expiryFilter === 'expiring_soon' ? 'Nothing Expiring Soon'
                  : expiryFilter === 'expired' ? 'No Expired Documents'
                  : categoryFilter ? 'No Documents in This Category'
                  : activeTagFilters.length > 0 ? 'No Documents Match These Tags'
                  : searchTerm ? 'No Documents Found'
                  : 'No Documents Yet'}
              </h3>
              <p className="text-sm mb-5" style={{color:'#475569'}}>
                {expiryFilter === 'expiring_soon' ? 'No documents are expiring in the next 7 days.'
                  : expiryFilter === 'expired' ? 'No documents have passed their auto-delete date.'
                  : categoryFilter ? ('No documents are in the "' + categoryFilter + '" category.')
                  : activeTagFilters.length > 0 ? 'Try removing some tag filters.'
                  : searchTerm ? 'Try a different search term or clear the filter.'
                  : canUpload ? 'Upload your first document to get started.'
                  : 'No documents have been added yet.'}
              </p>
              {hasActiveFilter ? (
                <button onClick={clearAllFilters} className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                  <X className="w-4 h-4" aria-hidden="true" />
                  Clear Filters
                </button>
              ) : searchTerm ? (
                <button onClick={function() { setSearchTerm(''); fetchData(); }} className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto border border-slate-300 text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                  <X className="w-4 h-4" aria-hidden="true" />
                  Clear Search
                </button>
              ) : canUpload ? (
                <button onClick={function() { setShowUploadModal(true); }} className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Upload Your First Document
                </button>
              ) : null}
            </div>
          ) : (
            <div
              className={'grid gap-4 items-stretch ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1')}
              role="list"
              aria-label="Documents list"
            >
              {sortedDocs.map(function(doc) {
                var isSelected = selectedDocIds.indexOf(doc.id) !== -1;
                return (
                  <div
                    key={doc.id + '-' + (doc.updated_at || doc.uploaded_at)}
                    role="listitem"
                    className={'relative ' + (isSelected ? 'ring-2 ring-blue-400 rounded-xl' : '')}
                  >
                    {bulkSelectMode && (
                      <button
                        onClick={function() { toggleDocSelection(doc.id); }}
                        className={'absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 hover:border-blue-400')}
                        aria-label={(isSelected ? 'Deselect' : 'Select') + ' ' + doc.title}
                        aria-pressed={isSelected}
                      >
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    )}
                    <DocumentCard
                      document={doc}
                      viewMode={viewMode}
                      userRole={isAdmin ? 'admin' : isEditor ? 'editor' : 'member'}
                      organizationId={organizationId}
                      onDelete={handleDeleteDocument}
                      onUpdate={handleUpdateDocument}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Bulk expiry modal ── */}
      {showBulkExpiryModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{background:'rgba(0,0,0,0.4)'}}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-expiry-title"
          onClick={function(e) { if (e.target === e.currentTarget) setShowBulkExpiryModal(false); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{boxShadow:'3px 4px 14px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)'}}>
            <h2 id="bulk-expiry-title" style={{fontSize:'18px', fontWeight:800, color:'#0E1523', marginBottom:'8px'}}>Set Auto-Delete Date</h2>
            <p className="text-sm mb-5" style={{color:'#64748B'}}>
              {selectedDocIds.length} document{selectedDocIds.length !== 1 ? 's' : ''} will be automatically deleted on this date.
            </p>
            <label htmlFor="bulk-expiry-input" className="block text-sm font-semibold mb-2" style={{color:'#0E1523'}}>Auto-delete after</label>
            <input
              id="bulk-expiry-input"
              type="date"
              value={bulkExpiryDate}
              min={todayStr}
              onChange={function(e) { setBulkExpiryDate(e.target.value); }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-[#0E1523] mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
            <div className="flex gap-3">
              <button onClick={function() { setShowBulkExpiryModal(false); }} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-[#475569] font-semibold text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</button>
              <button onClick={handleBulkSetExpiry} disabled={!bulkExpiryDate || bulkExpiryLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {bulkExpiryLoading ? 'Saving...' : 'Set Date'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm modals ── */}
      <ConfirmModal
        isOpen={!!confirmDeleteFolder}
        title={'Delete "' + (confirmDeleteFolder ? confirmDeleteFolder.name : '') + '"?'}
        message="All documents inside this folder will be permanently deleted. This cannot be undone."
        confirmLabel="Delete Folder"
        onConfirm={function() { executeDeleteFolder(confirmDeleteFolder.id); }}
        onCancel={function() { setConfirmDeleteFolder(null); }}
      />
      <ConfirmModal
        isOpen={!!confirmDeleteDoc}
        title="Delete Document?"
        message={confirmDeleteDoc ? confirmDeleteDoc.message : ''}
        confirmLabel="Delete"
        onConfirm={function() { executeDeleteDocument(confirmDeleteDoc.id); }}
        onCancel={function() { setConfirmDeleteDoc(null); }}
      />
      <ConfirmModal
        isOpen={confirmBulkClear}
        title={'Clear Expiry from ' + selectedDocIds.length + ' Document' + (selectedDocIds.length !== 1 ? 's' : '') + '?'}
        message="Auto-delete will be removed from the selected documents."
        confirmLabel="Clear Expiry"
        confirmClass="bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
        onConfirm={executeBulkClearExpiry}
        onCancel={function() { setConfirmBulkClear(false); }}
      />

      {/* ── Manage Labels ── */}
      <ManageLabelsModal
        isOpen={showManageLabels}
        onClose={function() { setShowManageLabels(false); }}
        organizationId={organizationId}
        onLabelsChanged={fetchData}
      />

      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={function() { setShowUploadModal(false); }}
          organizationId={organizationId}
          folderId={currentFolder ? currentFolder.id : null}
          onSuccess={handleDocumentUploaded}
          isAdmin={isAdmin}
        />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={function() { setShowCreateFolderModal(false); }}
          organizationId={organizationId}
          parentFolderId={currentFolder ? currentFolder.id : null}
          onSuccess={handleFolderCreated}
        />
      )}
    </main>
  );
}

export default DocumentLibrary;