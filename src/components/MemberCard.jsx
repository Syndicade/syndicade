import { Link } from 'react-router-dom';

/**
 * MemberCard Component
 * 
 * A compact, clickable card showing member summary.
 * Used in member directories and search results.
 * 
 * @param {Object} member - The member object from database
 * @param {string} role - The member's role in the organization (optional)
 * @param {string} organizationId - Optional org ID for navigation
 */
function MemberCard({ member, role, organizationId }) {
  if (!member) return null;

  // Get initials for avatar
  const getInitials = () => {
    const firstInitial = member.first_name?.charAt(0) || '';
    const lastInitial = member.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Get display name
  const displayName = member.display_name || `${member.first_name} ${member.last_name}`;

  // Get role display name
  const getRoleDisplay = (roleValue) => {
    const roleMap = {
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'member': 'Member',
      'guest': 'Guest'
    };
    return roleMap[roleValue] || roleValue;
  };

  // Determine role badge color
  const getRoleBadgeColor = (roleValue) => {
    const colorMap = {
      'admin': 'bg-purple-100 text-purple-800',
      'moderator': 'bg-blue-100 text-blue-800',
      'member': 'bg-gray-100 text-gray-800',
      'guest': 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[roleValue] || 'bg-gray-100 text-gray-800';
  };

  return (
    <article 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
      aria-label={`${displayName}'s profile card`}
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
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md"
            aria-hidden="true"
          >
            {getInitials()}
          </div>
        )}

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
            {displayName}
          </h3>
          
          {/* Role Badge */}
          {role && (
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
            >
              {getRoleDisplay(role)}
            </span>
          )}
          
          {/* Email */}
          {member.email && (
            <p className="text-sm text-gray-600 truncate mt-1">
              {member.email}
            </p>
          )}
          
          {/* Location */}
          {member.city && member.state && (
            <p className="text-sm text-gray-500 truncate mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {member.city}, {member.state}
            </p>
          )}
        </div>

        {/* View Profile Link */}
        <Link
          to={`/members/${member.user_id}`}
          className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          aria-label={`View ${displayName}'s full profile`}
        >
          View
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Bio Preview (if exists) */}
      {member.bio && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {member.bio}
        </p>
      )}
    </article>
  );
}

export default MemberCard;