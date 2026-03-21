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
  check: 'M5 13l4 4L19 7',
  plus:  'M12 4v16m8-8H4',
  x:     'M6 18L18 6M6 6l12 12',
};

/**
 * MemberTagAssigner
 * Props:
 *   memberId       — user_id of the member being tagged
 *   memberName     — display name (for aria labels)
 *   organizationId — scopes tags to this org
 *   isAdmin        — only renders if true
 */
function MemberTagAssigner({ memberId, memberName, organizationId, isAdmin }) {
  var [allTags, setAllTags] = useState([]);
  var [assignedTagIds, setAssignedTagIds] = useState([]);
  var [loading, setLoading] = useState(true);
  var [togglingId, setTogglingId] = useState(null);

  useEffect(function() {
    if (organizationId && memberId && isAdmin) loadData();
  }, [organizationId, memberId, isAdmin]);

  async function loadData() {
    try {
      setLoading(true);
      var [tagsResult, assignedResult] = await Promise.all([
        supabase.from('member_tags').select('id, name, color').eq('organization_id', organizationId).order('name'),
        supabase.from('member_tag_assignments').select('tag_id')
          .eq('organization_id', organizationId).eq('member_id', memberId),
      ]);
      if (tagsResult.error) throw tagsResult.error;
      setAllTags(tagsResult.data || []);
      setAssignedTagIds((assignedResult.data || []).map(function(a) { return a.tag_id; }));
    } catch (err) {
      toast.error('Failed to load tags: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTag(tag) {
    var isAssigned = assignedTagIds.includes(tag.id);
    try {
      setTogglingId(tag.id);
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;

      if (isAssigned) {
        var removeResult = await supabase
          .from('member_tag_assignments')
          .delete()
          .eq('tag_id', tag.id)
          .eq('member_id', memberId)
          .eq('organization_id', organizationId);
        if (removeResult.error) throw removeResult.error;
        setAssignedTagIds(function(prev) { return prev.filter(function(id) { return id !== tag.id; }); });
        toast.success('Removed "' + tag.name + '" from ' + memberName + '.');
      } else {
        var addResult = await supabase
          .from('member_tag_assignments')
          .insert({ tag_id: tag.id, member_id: memberId, organization_id: organizationId, assigned_by: user.id });
        if (addResult.error) throw addResult.error;
        setAssignedTagIds(function(prev) { return prev.concat([tag.id]); });
        toast.success('Added "' + tag.name + '" to ' + memberName + '.');
      }
    } catch (err) {
      toast.error('Failed to update tag: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
        <Icon path={ICONS.tag} className="h-3.5 w-3.5" />
        Tags
      </p>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map(function(i) {
            return <div key={i} className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />;
          })}
        </div>
      ) : allTags.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No tags defined for this organization.</p>
      ) : (
        <div className="flex flex-wrap gap-2" role="group" aria-label={'Tags for ' + memberName}>
          {allTags.map(function(tag) {
            var isAssigned = assignedTagIds.includes(tag.id);
            var isToggling = togglingId === tag.id;
            return (
              <button
                key={tag.id}
                onClick={function() { toggleTag(tag); }}
                disabled={isToggling}
                aria-pressed={isAssigned}
                aria-label={(isAssigned ? 'Remove tag ' : 'Add tag ') + tag.name + (isAssigned ? ' from ' : ' to ') + memberName}
                className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ' +
                  (isAssigned
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}
                style={isAssigned ? { backgroundColor: tag.color, borderColor: tag.color, '--tw-ring-color': tag.color } : {}}
              >
                {isToggling ? (
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : isAssigned ? (
                  <Icon path={ICONS.check} className="h-3 w-3" />
                ) : (
                  <Icon path={ICONS.plus} className="h-3 w-3" />
                )}
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MemberTagAssigner;