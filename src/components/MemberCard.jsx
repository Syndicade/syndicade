import { useState } from 'react';
import { supabase } from '../lib/supabase';

const getAvatarColor = (name) => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-green-400 to-green-600',
    'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// SVG Icons
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const getRoleDisplay = (roleValue) => {
  const roleMap = {
    admin: 'Administrator',
    moderator: 'Moderator',
    member: 'Member',
    guest: 'Guest',
  };
  return roleMap[roleValue] || roleValue;
};

const getRoleBadgeColor = (roleValue) => {
  const colorMap = {
    admin: 'bg-purple-100 text-purple-800',
    moderator: 'bg-blue-100 text-blue-800',
    member: 'bg-gray-100 text-gray-800',
    guest: 'bg-yellow-100 text-yellow-800',
  };
  return colorMap[roleValue] || 'bg-gray-100 text-gray-800';
};

const formatPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return '(' + cleaned.slice(0, 3) + ') ' + cleaned.slice(3, 6) + '-' + cleaned.slice(6);
  }
  return phone;
};

// ── Member Detail Modal ─────────────────────────────────────────────────────
function MemberModal({ member, role, organizationId, onClose }) {
  const [privacySettings, setPrivacySettings] = useState(null);
  const [loadingPrivacy, setLoadingPrivacy] = useState(true);

  // Fetch per-org privacy overrides for this member
  useState(() => {
    async function fetchPrivacy() {
      try {
        const { data } = await supabase
          .from('member_privacy')
          .select('show_email, show_phone, show_bio')
          .eq('user_id', member.user_id)
          .eq('organization_id', organizationId)
          .maybeSingle();
        setPrivacySettings(data);
      } catch {
        setPrivacySettings(null);
      } finally {
        setLoadingPrivacy(false);
      }
    }
    if (member?.user_id && organizationId) {
      fetchPrivacy();
    } else {
      setLoadingPrivacy(false);
    }
  }, [member?.user_id, organizationId]);

  const showEmail = privacySettings ? privacySettings.show_email : member.email_visibility !== 'private';
  const showPhone = privacySettings ? privacySettings.show_phone : member.phone_visibility !== 'private';
  const showBio   = privacySettings ? privacySettings.show_bio   : true;

  const displayName = member.display_name || (member.first_name + ' ' + member.last_name);
  const initials = (member.first_name?.charAt(0) || '') + (member.last_name?.charAt(0) || '');
  const gradientColor = getAvatarColor(displayName);

  // Trap focus inside modal on mount
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-name"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header with gradient */}
        <div className={'bg-gradient-to-r ' + gradientColor + ' px-6 pt-6 pb-10'}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
            aria-label="Close member profile"
          >
            <CloseIcon />
          </button>

          <div className="flex items-center gap-4">
            {member.profile_photo_url ? (
              <img
                src={member.profile_photo_url}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0"
                style={{ color: 'inherit' }}
                aria-hidden="true"
              >
                <span className="text-gray-700">{initials.toUpperCase()}</span>
              </div>
            )}
            <div>
              <h2 id="member-modal-name" className="text-2xl font-bold text-white">
                {displayName}
              </h2>
              {role && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white bg-opacity-25 text-white">
                  {getRoleDisplay(role)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="-mt-4 mx-4 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 space-y-4">

          {loadingPrivacy ? (
            <div className="flex justify-center py-4" role="status" aria-label="Loading member details">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" aria-hidden="true" />
              <span className="sr-only">Loading...</span>
            </div>
          ) : (
            <>
              {/* Email */}
              {member.email && showEmail && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="flex-shrink-0 text-gray-400"><EmailIcon /></span>
                  <a
                    href={'mailto:' + member.email}
                    className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded truncate"
                    aria-label={'Send email to ' + displayName}
                  >
                    {member.email}
                  </a>
                </div>
              )}

              {/* Phone */}
              {member.phone && showPhone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="flex-shrink-0 text-gray-400"><PhoneIcon /></span>
                  <a
                    href={'tel:' + member.phone}
                    className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={'Call ' + displayName}
                  >
                    {formatPhone(member.phone)}
                  </a>
                </div>
              )}

              {/* Location */}
              {member.city && member.state && member.location_visibility !== 'private' && (
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="flex-shrink-0 text-gray-400"><LocationIcon /></span>
                  <span className="text-sm">{member.city}, {member.state}</span>
                </div>
              )}

              {/* If no visible contact info */}
              {!member.email && !member.phone && !member.city && (
                <p className="text-sm text-gray-500 text-center py-2">No contact information available.</p>
              )}

              {/* Bio */}
              {member.bio && showBio && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{member.bio}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MemberCard ──────────────────────────────────────────────────────────────
function MemberCard({ member, role, organizationId }) {
  const [showModal, setShowModal] = useState(false);

  if (!member) return null;

  const displayName = member.display_name || (member.first_name + ' ' + member.last_name);
  const initials = ((member.first_name?.charAt(0) || '') + (member.last_name?.charAt(0) || '')).toUpperCase();
  const gradientColor = getAvatarColor(displayName);

  return (
    <>
      <article
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
        aria-label={displayName + "'s profile card"}
      >
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          {member.profile_photo_url ? (
            <img
              src={member.profile_photo_url}
              alt=""
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
              aria-hidden="true"
            />
          ) : (
            <div
              className={'w-14 h-14 rounded-full bg-gradient-to-br ' + gradientColor + ' flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md'}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
              {displayName}
            </h3>

            {role && (
              <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getRoleBadgeColor(role)}>
                {getRoleDisplay(role)}
              </span>
            )}

            {member.email && member.email_visibility !== 'private' && (
              <p className="text-sm text-gray-500 truncate mt-1">{member.email}</p>
            )}

            {member.city && member.state && member.location_visibility !== 'private' && (
              <p className="text-sm text-gray-500 truncate mt-1 flex items-center gap-1">
                <LocationIcon />
                {member.city}, {member.state}
              </p>
            )}
          </div>

          {/* View Button — opens modal instead of navigating */}
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label={'View ' + displayName + "'s profile"}
          >
            <UserIcon />
            <span className="ml-1">View</span>
            <ChevronRightIcon />
          </button>
        </div>

        {/* Bio Preview */}
        {member.bio && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">{member.bio}</p>
        )}
      </article>

      {/* Member Detail Modal */}
      {showModal && (
        <MemberModal
          member={member}
          role={role}
          organizationId={organizationId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default MemberCard;