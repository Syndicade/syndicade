import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MemberTagAssigner from './MemberTagAssigner';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAvatarColor(name) {
  var colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-green-400 to-green-600',
    'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
  ];
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getRoleDisplay(role) {
  var map = { admin: 'Administrator', moderator: 'Moderator', member: 'Member', guest: 'Guest' };
  return map[role] || role;
}

function getRoleBadgeColor(role) {
  var map = { admin: 'bg-purple-100 text-purple-800', moderator: 'bg-blue-100 text-blue-800', member: 'bg-gray-100 text-gray-800', guest: 'bg-yellow-100 text-yellow-800' };
  return map[role] || 'bg-gray-100 text-gray-800';
}

function formatPhone(phone) {
  if (!phone) return null;
  var cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return '(' + cleaned.slice(0, 3) + ') ' + cleaned.slice(3, 6) + '-' + cleaned.slice(6);
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
  user:     ['M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'],
  email:    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  location: ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  x:        'M6 18L18 6M6 6l12 12',
  chevron:  'M9 5l7 7-7 7',
};

// ── Tag pills (read-only display) ─────────────────────────────────────────────
function MemberTagPills({ memberId, organizationId }) {
  var [tags, setTags] = useState([]);

  useEffect(function() {
    if (!memberId || !organizationId) return;
    supabase
      .from('member_tag_assignments')
      .select('member_tags(id, name, color)')
      .eq('member_id', memberId)
      .eq('organization_id', organizationId)
      .then(function(result) {
        if (!result.error) {
          setTags((result.data || []).map(function(a) { return a.member_tags; }).filter(Boolean));
        }
      });
  }, [memberId, organizationId]);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2" aria-label="Member tags">
      {tags.map(function(tag) {
        return (
          <span
            key={tag.id}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}

// ── Member Modal ──────────────────────────────────────────────────────────────
function MemberModal({ member, role, organizationId, isAdmin, onClose }) {
  var [loadingPrivacy, setLoadingPrivacy] = useState(true);
  var [showEmail, setShowEmail] = useState(false);
  var [showPhone, setShowPhone] = useState(false);
  var [showBio, setShowBio] = useState(true);

  var displayName = member.display_name || (member.first_name + ' ' + member.last_name);
  var initials = ((member.first_name && member.first_name.charAt(0)) || '') + ((member.last_name && member.last_name.charAt(0)) || '');
  var gradientColor = getAvatarColor(displayName);
  var avatarUrl = member.avatar_url || member.profile_photo_url;

  useEffect(function() {
    async function fetchPrivacy() {
      try {
        var result = await supabase
          .from('members')
          .select('privacy_settings')
          .eq('user_id', member.user_id)
          .maybeSingle();
        var ps = result.data && result.data.privacy_settings;
        setShowEmail(isAdmin || (ps ? ps.show_email : member.email_visibility !== 'private'));
        setShowPhone(isAdmin || (ps ? ps.show_phone : member.phone_visibility !== 'private'));
        setShowBio(ps ? true : true);
      } catch {
        setShowEmail(false);
        setShowPhone(false);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-name"
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">

        {/* Gradient header */}
        <div className={'bg-gradient-to-r ' + gradientColor + ' px-6 pt-6 pb-10 flex-shrink-0'}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
            aria-label="Close member profile"
          >
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
              {role && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white bg-opacity-25 text-white">
                  {getRoleDisplay(role)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 -mt-4 mx-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 space-y-5">

            {loadingPrivacy ? (
              <div className="flex justify-center py-4 space-y-2" role="status">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-hidden="true" />
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <>
                {/* Contact info */}
                <div className="space-y-3">
                  {member.email && showEmail && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Icon path={ICONS.email} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href={'mailto:' + member.email} className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded truncate" aria-label={'Send email to ' + displayName}>
                        {member.email}
                      </a>
                    </div>
                  )}
                  {member.phone && showPhone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Icon path={ICONS.phone} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href={'tel:' + member.phone} className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Call ' + displayName}>
                        {formatPhone(member.phone)}
                      </a>
                    </div>
                  )}
                  {member.city && member.state && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Icon path={ICONS.location} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">{member.city + ', ' + member.state}</span>
                    </div>
                  )}
                  {!member.email && !member.phone && !member.city && (
                    <p className="text-sm text-gray-400 text-center py-2 italic">No contact information available.</p>
                  )}
                </div>

                {/* Bio */}
                {member.bio && showBio && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">About</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{member.bio}</p>
                  </div>
                )}

                {/* Tags — admin can assign; everyone sees assigned tags */}
                <div className="pt-4 border-t border-gray-100">
                  {isAdmin ? (
                    <MemberTagAssigner
                      memberId={member.user_id}
                      memberName={displayName}
                      organizationId={organizationId}
                      isAdmin={isAdmin}
                    />
                  ) : (
                    <MemberTagPills memberId={member.user_id} organizationId={organizationId} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex-shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MemberCard ────────────────────────────────────────────────────────────────
function MemberCard({ member, role, organizationId, isAdmin }) {
  var [showModal, setShowModal] = useState(false);

  if (!member) return null;

  var displayName = member.display_name || (member.first_name + ' ' + member.last_name);
  var initials = ((member.first_name && member.first_name.charAt(0)) || '') + ((member.last_name && member.last_name.charAt(0)) || '');
  var gradientColor = getAvatarColor(displayName);
  var avatarUrl = member.avatar_url || member.profile_photo_url;

  return (
    <>
      <article
        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
        aria-label={displayName + "'s profile card"}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" aria-hidden="true" />
          ) : (
            <div
              className={'w-14 h-14 rounded-full bg-gradient-to-br ' + gradientColor + ' flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md'}
              aria-hidden="true"
            >
              {initials.toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{displayName}</h3>

            {role && (
              <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ' + getRoleBadgeColor(role)}>
                {getRoleDisplay(role)}
              </span>
            )}

            {member.email && member.email_visibility !== 'private' && (
              <p className="text-sm text-gray-500 truncate mt-1">{member.email}</p>
            )}

            {member.city && member.state && member.location_visibility !== 'private' && (
              <p className="text-sm text-gray-500 truncate mt-1 flex items-center gap-1">
                <Icon path={ICONS.location} className="h-3.5 w-3.5 flex-shrink-0" />
                {member.city + ', ' + member.state}
              </p>
            )}

            {/* Tag pills on card */}
            <MemberTagPills memberId={member.user_id} organizationId={organizationId} />
          </div>

          {/* View button */}
          <button
            onClick={function() { setShowModal(true); }}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label={'View ' + displayName + "'s profile"}
          >
            <Icon path={ICONS.user} className="h-4 w-4" />
            View
            <Icon path={ICONS.chevron} className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bio preview */}
        {member.bio && (
          <p className="mt-3 text-sm text-gray-500 line-clamp-2 pl-[4.5rem]">{member.bio}</p>
        )}
      </article>

      {showModal && (
        <MemberModal
          member={member}
          role={role}
          organizationId={organizationId}
          isAdmin={isAdmin}
          onClose={function() { setShowModal(false); }}
        />
      )}
    </>
  );
}

export default MemberCard;