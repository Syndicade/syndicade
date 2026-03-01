import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MemberCard from '../components/MemberCard';
import PageHeader from '../components/PageHeader';
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
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  users:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  x:      'M6 18L18 6M6 6l12 12',
  tag:    ['M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z'],
  alert:  ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded-full" />
          <div className="h-3 w-40 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-16 bg-gray-100 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

function MemberDirectory() {
  var params = useParams();
  var organizationId = params.organizationId;

  var [members, setMembers] = useState([]);
  var [filteredMembers, setFilteredMembers] = useState([]);
  var [orgTags, setOrgTags] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  var [organizationName, setOrganizationName] = useState('');

  // Filters
  var [searchQuery, setSearchQuery] = useState('');
  var [roleFilter, setRoleFilter] = useState('all');
  var [tagFilter, setTagFilter] = useState('all');

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  useEffect(function() {
    applyFilters();
  }, [searchQuery, roleFilter, tagFilter, members]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Get current user + admin status
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;

      var [orgResult, membershipResult, membersResult, tagsResult] = await Promise.all([
        supabase.from('organizations').select('name').eq('id', organizationId).single(),
        user ? supabase.from('memberships').select('role').eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('memberships').select('role, member_id, members(user_id, first_name, last_name, display_name, email, bio, profile_photo_url, avatar_url, city, state, phone, location_visibility, phone_visibility, email_visibility)').eq('organization_id', organizationId).eq('status', 'active').order('members(last_name)', { ascending: true }),
        supabase.from('member_tags').select('id, name, color').eq('organization_id', organizationId).order('name'),
      ]);

      if (orgResult.error) throw orgResult.error;
      if (membersResult.error) throw membersResult.error;

      setOrganizationName(orgResult.data.name);
      setIsAdmin(membershipResult.data && ['admin', 'owner'].includes(membershipResult.data.role));
      setOrgTags(tagsResult.data || []);

      // Load tag assignments for all members
      var assignmentsResult = await supabase
        .from('member_tag_assignments')
        .select('member_id, tag_id')
        .eq('organization_id', organizationId);
      var assignments = assignmentsResult.data || [];

      var membersList = (membersResult.data || [])
        .filter(function(item) { return item.members !== null; })
        .map(function(item) {
          var tagIds = assignments
            .filter(function(a) { return a.member_id === item.members.user_id; })
            .map(function(a) { return a.tag_id; });
          return Object.assign({}, item.members, { role: item.role, tagIds: tagIds });
        });

      setMembers(membersList);
      setFilteredMembers(membersList);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err.message);
      toast.error('Failed to load members.');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    var result = members.slice();

    if (roleFilter !== 'all') {
      result = result.filter(function(m) { return m.role === roleFilter; });
    }

    if (tagFilter !== 'all') {
      result = result.filter(function(m) { return m.tagIds && m.tagIds.includes(tagFilter); });
    }

    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      result = result.filter(function(m) {
        var fullName = ((m.first_name || '') + ' ' + (m.last_name || '')).toLowerCase();
        var display = (m.display_name || '').toLowerCase();
        var email = (m.email || '').toLowerCase();
        var city = (m.city || '').toLowerCase();
        return fullName.includes(q) || display.includes(q) || email.includes(q) || city.includes(q);
      });
    }

    setFilteredMembers(result);
  }

  function handleClearFilters() {
    setSearchQuery('');
    setRoleFilter('all');
    setTagFilter('all');
  }

  var hasFilters = searchQuery || roleFilter !== 'all' || tagFilter !== 'all';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-3">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map(function(i) { return <CardSkeleton key={i} />; })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Icon path={ICONS.alert} className="h-12 w-12 text-red-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Failed to Load Members</h3>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={function() { setError(null); loadData(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <PageHeader
          title="Members"
          subtitle={filteredMembers.length + ' ' + (filteredMembers.length === 1 ? 'member' : 'members') + (searchQuery ? ' matching "' + searchQuery + '"' : '') + (roleFilter !== 'all' ? ' · role: ' + roleFilter : '') + (tagFilter !== 'all' ? ' · filtered by tag' : '')}
          icon={<Icon path={ICONS.users} className="h-7 w-7 text-blue-600" />}
          organizationName={organizationName}
          organizationId={organizationId}
          backTo={'/organizations/' + organizationId}
          backLabel="Back to Dashboard"
        />

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Search */}
            <div className="md:col-span-1 relative">
              <label htmlFor="member-search" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Icon path={ICONS.search} className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="member-search"
                  type="text"
                  placeholder="Name, email, location..."
                  value={searchQuery}
                  onChange={function(e) { setSearchQuery(e.target.value); }}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Role filter */}
            <div>
              <label htmlFor="role-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Role</label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={function(e) { setRoleFilter(e.target.value); }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="moderator">Moderators</option>
                <option value="member">Members</option>
                <option value="guest">Guests</option>
              </select>
            </div>

            {/* Tag filter */}
            <div>
              <label htmlFor="tag-filter" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tag</label>
              <select
                id="tag-filter"
                value={tagFilter}
                onChange={function(e) { setTagFilter(e.target.value); }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={orgTags.length === 0}
              >
                <option value="all">All Tags</option>
                {orgTags.map(function(tag) {
                  return <option key={tag.id} value={tag.id}>{tag.name}</option>;
                })}
              </select>
              {orgTags.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No tags defined yet.</p>
              )}
            </div>
          </div>

          {/* Active tag filter pill */}
          {tagFilter !== 'all' && (function() {
            var activeTag = orgTags.find(function(t) { return t.id === tagFilter; });
            return activeTag ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Filtering by:</span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: activeTag.color }}
                >
                  {activeTag.name}
                  <button
                    onClick={function() { setTagFilter('all'); }}
                    className="hover:opacity-75 focus:outline-none"
                    aria-label={'Remove tag filter ' + activeTag.name}
                  >
                    <Icon path={ICONS.x} className="h-3 w-3" />
                  </button>
                </span>
              </div>
            ) : null;
          })()}

          {/* Clear filters */}
          {hasFilters && (
            <div>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
              >
                <Icon path={ICONS.x} className="h-3.5 w-3.5" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Members grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Icon path={ICONS.users} className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Members Found</h3>
            <p className="text-gray-500 text-sm mb-6">
              {hasFilters
                ? 'No members match your current filters. Try adjusting your search.'
                : 'This organization has no members yet.'}
            </p>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
              >
                <Icon path={ICONS.x} className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              role="list"
              aria-label="Organization members"
            >
              {filteredMembers.map(function(member) {
                return (
                  <div key={member.user_id} role="listitem">
                    <MemberCard
                      member={member}
                      role={member.role}
                      organizationId={organizationId}
                      isAdmin={isAdmin}
                    />
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-400 pb-4">
              {'Showing ' + filteredMembers.length + ' of ' + members.length + ' member' + (members.length !== 1 ? 's' : '')}
            </p>
          </>
        )}

      </div>
    </div>
  );
}

export default MemberDirectory;