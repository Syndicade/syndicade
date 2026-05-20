import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MemberTagAssigner from './MemberTagAssigner';
import toast from 'react-hot-toast';
import { mascotErrorToast } from './MascotToast';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAvatarColor(name) {
  var colors = [
    'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600',
    'from-green-400 to-green-600', 'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-600', 'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600', 'from-teal-400 to-teal-600',
  ];
  var hash = 0;
  for (var i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return colors[Math.abs(hash) % colors.length];
}

function getRoleDisplay(role) {
  var map = { admin: 'Administrator', editor: 'Editor', member: 'Member', guest: 'Guest' };
  return map[role] || role;
}

function getRoleBadgeColor(role) {
  var map = { admin: 'bg-purple-100 text-purple-800', editor: 'bg-blue-100 text-blue-800', member: 'bg-gray-100 text-gray-800', guest: 'bg-yellow-100 text-yellow-800' };
  return map[role] || 'bg-gray-100 text-gray-800';
}

function formatPhone(phone) {
  if (!phone) return null;
  var cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return '(' + cleaned.slice(0,3) + ') ' + cleaned.slice(3,6) + '-' + cleaned.slice(6);
  return phone;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
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
  email:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  location: ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  building: ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  x:        'M6 18L18 6M6 6l12 12',
  chevron:  'M9 5l7 7-7 7',
  users:    ['M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'],
};

// ── Tag pills ─────────────────────────────────────────────────────────────────
function MemberTagPills({ memberId, organizationId }) {
  var [tags, setTags] = useState([]);
  useEffect(function() {
    if (!memberId || !organizationId) return;
    supabase.from('member_tag_assignments').select('member_tags(id, name, color)').eq('member_id', memberId).eq('organization_id', organizationId)
      .then(function(result) {
        if (!result.error) setTags((result.data || []).map(function(a) { return a.member_tags; }).filter(Boolean));
      });
  }, [memberId, organizationId]);
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5" aria-label="Member tags">
      {tags.map(function(tag) {
        return <span key={tag.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>;
      })}
    </div>
  );
}

// ── Group pills ───────────────────────────────────────────────────────────────
function GroupPills({ groups }) {
  if (!groups || groups.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5" aria-label="Group memberships">
      {groups.map(function(group) {
        return <span key={group.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: group.color || '#64748B' }}>{group.name}</span>;
      })}
    </div>
  );
}

// ── Interests pills ───────────────────────────────────────────────────────────
function InterestPills({ interests }) {
  if (!interests || interests.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5" aria-label="Interests">
      {interests.map(function(interest) {
        return <span key={interest} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">{interest}</span>;
      })}
    </div>
  );
}

// ── Affiliations list ─────────────────────────────────────────────────────────
function AffiliationsList({ affiliations }) {
  if (!affiliations || affiliations.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Also a member of</p>
      <ul className="space-y-0.5">
        {affiliations.map(function(aff) {
          return (
            <li key={aff.id} className="text-xs text-slate-500 flex items-center gap-1">
              <Icon path={ICONS.building} className="h-3 w-3 text-slate-300 flex-shrink-0" />
              <span>
                {aff.role_title && <span className="font-medium text-slate-600">{aff.role_title}</span>}
                {aff.role_title && <span className="text-slate-300"> · </span>}
                {aff.org_name}
                {aff.joined_year && <span className="text-slate-400">{' · since ' + aff.joined_year}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Group Assigner ────────────────────────────────────────────────────────────
function GroupAssigner({ memberId, organizationId, allGroups, initialGroups, onGroupsChange }) {
  var [memberGroups, setMemberGroups] = useState(initialGroups || []);
  var [saving, setSaving]             = useState(null);

  async function toggleGroup(group) {
    var isMember = memberGroups.some(function(g) { return g.id === group.id; });
    setSaving(group.id);
    try {
      if (isMember) {
        var result = await supabase.from('org_group_members').delete().eq('group_id', group.id).eq('member_id', memberId);
        if (result.error) throw result.error;
        var updated = memberGroups.filter(function(g) { return g.id !== group.id; });
        setMemberGroups(updated);
        if (onGroupsChange) onGroupsChange(updated);
      } else {
        var insertResult = await supabase.from('org_group_members').insert({ group_id: group.id, member_id: memberId, organization_id: organizationId });
        if (insertResult.error) throw insertResult.error;
        var updated = memberGroups.concat([group]);
        setMemberGroups(updated);
        if (onGroupsChange) onGroupsChange(updated);
      }
    } catch (err) {
      mascotErrorToast('Failed to update group membership.', err.message);
    } finally {
      setSaving(null);
    }
  }

  if (allGroups.length === 0) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Groups & Committees</p>
        <p className="text-xs text-slate-400 italic">No groups have been created yet.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Groups & Committees</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Toggle group memberships">
        {allGroups.map(function(group) {
          var isMember  = memberGroups.some(function(g) { return g.id === group.id; });
          var isLoading = saving === group.id;
          var color     = group.color || '#64748B';
          return (
            <button
              key={group.id}
              onClick={function() { toggleGroup(group); }}
              disabled={isLoading}
              className={'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ' + (isMember ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50')}
              style={isMember ? { backgroundColor: color, borderColor: color } : {}}
              aria-pressed={isMember}
              aria-label={(isMember ? 'Remove from ' : 'Add to ') + group.name}
            >
              {isLoading ? '...' : group.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Member Modal ──────────────────────────────────────────────────────────────
function MemberModal({ member, role, organizationId, isAdmin, isAdminOrEditor, allGroups, initialGroups, affiliations, onGroupsChange, onClose }) {
  var [loadingPrivacy, setLoadingPrivacy] = useState(true);
  var [showEmail, setShowEmail]           = useState(false);
  var [showPhone, setShowPhone]           = useState(false);

  var displayName   = member.display_name || (member.first_name + ' ' + member.last_name);
  var initials      = ((member.first_name && member.first_name.charAt(0)) || '') + ((member.last_name && member.last_name.charAt(0)) || '');
  var gradientColor = getAvatarColor(displayName);
  var avatarUrl     = member.avatar_url || member.profile_photo_url;

  useEffect(function() {
    async function fetchPrivacy() {
      try {
        var result = await supabase.from('members').select('privacy_settings').eq('user_id', member.user_id).maybeSingle();
        var ps = result.data && result.data.privacy_settings;
        setShowEmail(isAdmin || (ps ? ps.show_email : member.email_visibility !== 'private'));
        setShowPhone(isAdmin || (ps ? ps.show_phone : member.phone_visibility !== 'private'));
      } catch {
        setShowEmail(false); setShowPhone(false);
      } finally {
        setLoadingPrivacy(false);
      }
    }
    if (member.user_id) fetchPrivacy();
    else setLoadingPrivacy(false);
  }, [member.user_id]);

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="member-modal-name">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className={'bg-gradient-to-r ' + gradientColor + ' px-6 pt-6 pb-10 flex-shrink-0'}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors" aria-label="Close member profile">
            <Icon path={ICONS.x} className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0" aria-hidden="true">
                <span className="text-gray-700">{initials.toUpperCase()}</span>
              </div>
            )}
            <div>
              <h2 id="member-modal-name" className="text-2xl font-bold text-white">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {role && <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white bg-opacity-25 text-white">{getRoleDisplay(role)}</span>}
                {member.pronouns && member.show_pronouns && <span className="text-white text-opacity-75 text-xs">{member.pronouns}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 -mt-4 mx-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 space-y-5">
            {loadingPrivacy ? (
              <div className="animate-pulse space-y-2 w-full">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ) : (
              <>
                {/* Contact */}
                <div className="space-y-3">
                  {member.email && showEmail && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Icon path={ICONS.email} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href={'mailto:' + member.email} className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded truncate">{member.email}</a>
                    </div>
                  )}
                  {member.phone && showPhone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Icon path={ICONS.phone} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href={'tel:' + member.phone} className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{formatPhone(member.phone)}</a>
                    </div>
                  )}
                  {member.city && member.state && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Icon path={ICONS.location} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{member.city + ', ' + member.state}</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {member.bio && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">About</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{member.bio}</p>
                  </div>
                )}

                {/* Interests */}
                {member.interests && member.interests.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Interests</p>
                    <InterestPills interests={member.interests} />
                  </div>
                )}

                {/* Affiliations */}
                {affiliations && affiliations.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Also a member of</p>
                    <ul className="space-y-1.5">
                      {affiliations.map(function(aff) {
                        return (
                          <li key={aff.id} className="flex items-start gap-2 text-sm text-gray-600">
                            <Icon path={ICONS.building} className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                            <span>
                              {aff.role_title && <span className="font-semibold text-gray-700">{aff.role_title + ' · '}</span>}
                              {aff.org_name}
                              {aff.joined_year && <span className="text-gray-400">{' · since ' + aff.joined_year}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                <div className="pt-4 border-t border-gray-100">
                  {isAdmin ? (
                    <MemberTagAssigner memberId={member.user_id} memberName={displayName} organizationId={organizationId} isAdmin={isAdmin} />
                  ) : (
                    <MemberTagPills memberId={member.user_id} organizationId={organizationId} />
                  )}
                </div>

                {/* Groups */}
                {isAdminOrEditor && (
                  <div className="pt-4 border-t border-gray-100">
                    <GroupAssigner memberId={member.user_id} organizationId={organizationId} allGroups={allGroups || []} initialGroups={initialGroups || []} onGroupsChange={onGroupsChange} />
                  </div>
                )}
                {!isAdminOrEditor && initialGroups && initialGroups.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Groups & Committees</p>
                    <GroupPills groups={initialGroups} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 flex-shrink-0 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── MemberCard ────────────────────────────────────────────────────────────────
function MemberCard({ member, role, organizationId, isAdmin, isAdminOrEditor, allGroups }) {
  var [showModal, setShowModal]     = useState(false);
  var [localGroups, setLocalGroups] = useState(member.groups || []);

  if (!member) return null;

  var displayName   = member.display_name || (member.first_name + ' ' + member.last_name);
  var initials      = ((member.first_name && member.first_name.charAt(0)) || '') + ((member.last_name && member.last_name.charAt(0)) || '');
  var gradientColor = getAvatarColor(displayName);
  var avatarUrl     = member.avatar_url || member.profile_photo_url;

  return (
    <>
      <article
        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 flex-1"
        aria-label={displayName + "'s profile card"}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" aria-hidden="true" />
          ) : (
            <div className={'w-12 h-12 rounded-full bg-gradient-to-br ' + gradientColor + ' flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm'} aria-hidden="true">
              {initials.toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h3>
                {/* Pronouns — shown only if member opted in */}
                {member.pronouns && member.show_pronouns && (
                  <p className="text-xs text-slate-400 mt-0.5">{member.pronouns}</p>
                )}
              </div>
              <button
                onClick={function() { setShowModal(true); }}
                className="flex-shrink-0 inline-flex items-center gap-0.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                aria-label={'View ' + displayName + "'s profile"}
              >
                View
                <Icon path={ICONS.chevron} className="h-3 w-3" />
              </button>
            </div>

            {role && (
              <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ' + getRoleBadgeColor(role)}>
                {getRoleDisplay(role)}
              </span>
            )}

            {member.city && member.state && member.location_visibility !== 'private' && (
              <p className="text-xs text-gray-400 truncate mt-1 flex items-center gap-1">
                <Icon path={ICONS.location} className="h-3 w-3 flex-shrink-0" />
                {member.city + ', ' + member.state}
              </p>
            )}

            {/* Group pills */}
            <GroupPills groups={localGroups} />

            {/* Tag pills */}
            <MemberTagPills memberId={member.user_id} organizationId={organizationId} />

            {/* Interests */}
            <InterestPills interests={member.interests} />
          </div>
        </div>

        {/* Bio preview */}
        {member.bio && (
          <p className="mt-2 text-xs text-gray-500 line-clamp-2">{member.bio}</p>
        )}

        {/* Affiliations preview */}
        <AffiliationsList affiliations={member.affiliations} />
      </article>

      {showModal && (
        <MemberModal
          member={member}
          role={role}
          organizationId={organizationId}
          isAdmin={isAdmin}
          isAdminOrEditor={isAdminOrEditor}
          allGroups={allGroups || []}
          initialGroups={localGroups}
          affiliations={member.affiliations || []}
          onGroupsChange={function(updated) { setLocalGroups(updated); }}
          onClose={function() { setShowModal(false); }}
        />
      )}
    </>
  );
}

export default MemberCard;