import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  tag:   ['M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z'],
  plus:  'M12 4v16m8-8H4',
  trash: ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:     'M6 18L18 6M6 6l12 12',
};

var PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#22C55E', '#F5B731',
  '#EF4444', '#F97316', '#14B8A6', '#EC4899',
  '#64748B', '#0EA5E9', '#A855F7', '#84CC16',
];

function TagSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-gray-300" />
        <div className="h-5 w-24 bg-gray-200 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-7 w-7 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

function MemberTagManager({ organizationId, isAdmin }) {
  var [tags, setTags] = useState([]);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [showForm, setShowForm] = useState(false);
  var [newTagName, setNewTagName] = useState('');
  var [newTagColor, setNewTagColor] = useState('#3B82F6');
  var [deletingId, setDeletingId] = useState(null);

  useEffect(function() {
    if (organizationId) loadTags();
  }, [organizationId]);

  async function loadTags() {
    try {
      setLoading(true);
      var result = await supabase
        .from('member_tags')
        .select('id, name, color, created_at')
        .eq('organization_id', organizationId)
        .order('name');
      if (result.error) throw result.error;

      // Also get usage counts
      var countResult = await supabase
        .from('member_tag_assignments')
        .select('tag_id')
        .eq('organization_id', organizationId);

      var counts = {};
      (countResult.data || []).forEach(function(a) {
        counts[a.tag_id] = (counts[a.tag_id] || 0) + 1;
      });

      setTags((result.data || []).map(function(t) {
        return Object.assign({}, t, { count: counts[t.id] || 0 });
      }));
    } catch (err) {
      toast.error('Failed to load tags: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTag(e) {
    e.preventDefault();
    if (!newTagName.trim()) { toast.error('Tag name is required.'); return; }
    if (newTagName.trim().length > 30) { toast.error('Tag name must be 30 characters or less.'); return; }

    try {
      setSaving(true);
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;

      var result = await supabase
        .from('member_tags')
        .insert({
          organization_id: organizationId,
          name: newTagName.trim(),
          color: newTagColor,
          created_by: user.id,
        })
        .select()
        .single();

      if (result.error) {
        if (result.error.code === '23505') {
          toast.error('A tag with that name already exists.');
        } else {
          throw result.error;
        }
        return;
      }

      toast.success('Tag "' + newTagName.trim() + '" created.');
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowForm(false);
      loadTags();
    } catch (err) {
      toast.error('Failed to create tag: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTag(tag) {
    if (!window.confirm('Delete tag "' + tag.name + '"? It will be removed from all members.')) return;
    try {
      setDeletingId(tag.id);
      var result = await supabase.from('member_tags').delete().eq('id', tag.id);
      if (result.error) throw result.error;
      toast.success('Tag "' + tag.name + '" deleted.');
      setTags(function(prev) { return prev.filter(function(t) { return t.id !== tag.id; }); });
    } catch (err) {
      toast.error('Failed to delete tag: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Icon path={ICONS.tag} className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F5B731' }}>Member Tags</p>
            <p className="text-xs text-gray-500">{tags.length + ' tag' + (tags.length !== 1 ? 's' : '') + ' defined'}</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={function() { setShowForm(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white font-semibold text-xs rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Icon path={ICONS.plus} className="h-3.5 w-3.5" />
            New Tag
          </button>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Create tag form */}
        {showForm && (
          <form
            onSubmit={handleCreateTag}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4"
            aria-label="Create new tag"
          >
            <p className="text-sm font-bold text-blue-800">Create New Tag</p>

            <div>
              <label htmlFor="tag-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tag Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="tag-name"
                type="text"
                value={newTagName}
                onChange={function(e) { setNewTagName(e.target.value); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g., Volunteer, Board Member, Alumni"
                maxLength={30}
                required
                aria-required="true"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">{newTagName.length}/30</p>
            </div>

            {/* Color picker */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Tag Color</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tag color">
                {PRESET_COLORS.map(function(color) {
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={function() { setNewTagColor(color); }}
                      className={'w-7 h-7 rounded-full border-2 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ' +
                        (newTagColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105')}
                      style={{ backgroundColor: color }}
                      aria-label={'Color ' + color}
                      aria-pressed={newTagColor === color}
                    />
                  );
                })}
              </div>
              {/* Preview */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">Preview:</span>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: newTagColor }}
                >
                  {newTagName || 'Tag Name'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || !newTagName.trim()}
                className="px-4 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Tag'}
              </button>
              <button
                type="button"
                onClick={function() { setShowForm(false); setNewTagName(''); setNewTagColor('#3B82F6'); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tag list */}
        {loading ? (
          <div className="space-y-2">
            <TagSkeleton /><TagSkeleton /><TagSkeleton />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Icon path={ICONS.tag} className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">No tags yet</p>
            <p className="text-xs text-gray-400 mt-1">Create tags to categorize and filter members.</p>
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Organization tags" role="list">
            {tags.map(function(tag) {
              return (
                <li key={tag.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} aria-hidden="true" />
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{tag.count + ' member' + (tag.count !== 1 ? 's' : '')}</span>
                    <button
                      onClick={function() { handleDeleteTag(tag); }}
                      disabled={deletingId === tag.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors disabled:opacity-50"
                      aria-label={'Delete tag ' + tag.name}
                    >
                      <Icon path={ICONS.trash} className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MemberTagManager;