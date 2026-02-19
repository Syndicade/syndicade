import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * MemberProfile Component
 *
 * Displays detailed member information including:
 * - Profile photo or initials
 * - Name and contact information (respecting privacy settings)
 * - Organization memberships and roles
 * - Group memberships per organization
 * - Custom field values
 */
function MemberProfile() {
  const { userId } = useParams();
  const [member, setMember] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [groupMemberships, setGroupMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current logged-in user
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    getCurrentUser();
  }, []);

  // Fetch member profile, memberships, and group memberships
  useEffect(() => {
    async function fetchMemberData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch member basic info
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (memberError) throw memberError;
        setMember(memberData);

        // Fetch member's organization memberships
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select(`
            id,
            role,
            status,
            joined_date,
            member_since_year,
            member_since_month,
            notes_public,
            organizations (
              id,
              name,
              type
            )
          `)
          .eq('member_id', userId)
          .eq('status', 'active')
          .order('joined_date', { ascending: false });

        if (membershipError) throw membershipError;
        setMemberships(membershipData || []);

        // Fetch member's group memberships
        const { data: groupData, error: groupError } = await supabase
          .from('group_memberships')
          .select(`
            id,
            role,
            status,
            joined_at,
            groups (
              id,
              name,
              description,
              type,
              organization_id,
              organizations (
                id,
                name
              )
            )
          `)
          .eq('member_id', userId)
          .eq('status', 'active')
          .order('joined_at', { ascending: false });

        if (groupError) {
          // Don't throw — groups feature may not exist for all orgs
          console.warn('Could not load group memberships:', groupError.message);
          setGroupMemberships([]);
        } else {
          setGroupMemberships(groupData || []);
        }

      } catch (err) {
        console.error('Error fetching member data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchMemberData();
    } else {
      setError('No user ID provided');
      setLoading(false);
    }
  }, [userId]);

  // Check if current user can see private info
  const canSeePrivateInfo = currentUserId === userId;

  // Check visibility of fields based on privacy settings
  const canSeeField = (visibility) => {
    if (canSeePrivateInfo) return true;
    if (visibility === 'public') return true;
    if (visibility === 'members') {
      return memberships.length > 0;
    }
    return false;
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!member) return '?';
    const firstInitial = member.first_name?.charAt(0) || '';
    const lastInitial = member.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Get role display name
  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'member': 'Member',
      'guest': 'Guest',
      'lead': 'Lead',
    };
    return roleMap[role] || role;
  };

  // Get group type badge color
  const getGroupTypeBadge = (type) => {
    const typeMap = {
      'committee': 'bg-purple-100 text-purple-800',
      'board': 'bg-blue-100 text-blue-800',
      'team': 'bg-green-100 text-green-800',
      'volunteer': 'bg-orange-100 text-orange-800',
    };
    return typeMap[type] || 'bg-gray-100 text-gray-800';
  };

  // Group the group memberships by organization
  const groupsByOrg = groupMemberships.reduce((acc, gm) => {
    const orgId = gm.groups?.organization_id;
    const orgName = gm.groups?.organizations?.name || 'Unknown Organization';
    if (!orgId) return acc;
    if (!acc[orgId]) acc[orgId] = { orgName, groups: [] };
    acc[orgId].groups.push(gm);
    return acc;
  }, {});

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8" role="status" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          aria-hidden="true"
        />
        <span className="sr-only">Loading member profile...</span>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto"
        role="alert"
        aria-live="assertive"
      >
        <h3 className="text-red-800 font-semibold mb-1">Error Loading Profile</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // No Member Found State
  if (!member) {
    return (
      <div
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto"
        role="status"
      >
        <h3 className="text-yellow-800 font-semibold mb-1">Profile Not Found</h3>
        <p className="text-yellow-700">
          This member profile doesn't exist or you don't have permission to view it.
        </p>
      </div>
    );
  }

  // Main Render
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article
        className="bg-white shadow-lg rounded-lg overflow-hidden"
        aria-labelledby="member-name"
      >
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
          <div className="flex items-center space-x-6">
            {/* Profile Photo or Initials */}
            {member.profile_photo_url ? (
              <img
                src={member.profile_photo_url}
                alt={`${member.first_name} ${member.last_name}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg"
                aria-hidden="true"
              >
                {getInitials()}
              </div>
            )}

            {/* Name */}
            <div className="flex-1">
              <h1
                id="member-name"
                className="text-3xl font-bold text-white"
              >
                {member.display_name || `${member.first_name} ${member.last_name}`}
              </h1>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">

          {/* Contact Information */}
          <section className="mb-8" aria-labelledby="contact-heading">
            <h2
              id="contact-heading"
              className="text-xl font-semibold text-gray-900 mb-4 flex items-center"
            >
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              {member.email && canSeeField(member.email_visibility) && (
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  
                    href={`mailto:${member.email}`}
                    className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={`Send email to ${member.first_name}`}
                  >
                    {member.email}
                  </a>
                </div>
              )}

              {/* Phone */}
              {member.phone && canSeeField(member.phone_visibility) && (
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  
                    href={`tel:${member.phone}`}
                    className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {formatPhone(member.phone)}
                  </a>
                </div>
              )}

              {/* Location */}
              {member.city && member.state && canSeeField(member.location_visibility) && (
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{member.city}, {member.state}</span>
                </div>
              )}
            </div>
          </section>

          {/* Bio Section */}
          {member.bio && (
            <section className="mb-8" aria-labelledby="bio-heading">
              <h2 id="bio-heading" className="text-xl font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed">{member.bio}</p>
            </section>
          )}

          {/* Organization Memberships */}
          {memberships.length > 0 && (
            <section className="mb-8" aria-labelledby="orgs-heading">
              <h2
                id="orgs-heading"
                className="text-xl font-semibold text-gray-900 mb-4 flex items-center"
              >
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Organizations
              </h2>

              <div className="space-y-3">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {membership.organizations.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {membership.organizations.type}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {getRoleDisplay(membership.role)}
                      </span>
                    </div>

                    {membership.member_since_year && (
                      <p className="text-sm text-gray-500 mt-2">
                        Member since {membership.member_since_month &&
                          new Date(2000, membership.member_since_month - 1).toLocaleString('en-US', { month: 'long' }) + ' '
                        }{membership.member_since_year}
                      </p>
                    )}

                    {membership.notes_public && (
                      <p className="text-sm text-blue-600 font-medium mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {membership.notes_public}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Group Memberships */}
          {Object.keys(groupsByOrg).length > 0 && (
            <section className="mb-8" aria-labelledby="groups-heading">
              <h2
                id="groups-heading"
                className="text-xl font-semibold text-gray-900 mb-4 flex items-center"
              >
                <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Groups &amp; Committees
              </h2>

              <div className="space-y-4">
                {Object.entries(groupsByOrg).map(([orgId, { orgName, groups }]) => (
                  <div key={orgId}>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      {orgName}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groups.map((gm) => (
                        <div
                          key={gm.id}
                          className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-start justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {gm.groups?.name}
                            </p>
                            {gm.groups?.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {gm.groups.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-2 flex flex-col items-end gap-1 shrink-0">
                            {gm.groups?.type && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getGroupTypeBadge(gm.groups.type)}`}
                              >
                                {gm.groups.type}
                              </span>
                            )}
                            {gm.role === 'lead' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Lead
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer Information */}
          <footer className="pt-6 border-t border-gray-200 flex items-center justify-end text-sm text-gray-500">
            {member.is_public_profile && (
              <span
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                title="This profile is visible to the public"
              >
                Public Profile
              </span>
            )}
          </footer>
        </div>
      </article>
    </div>
  );
}

export default MemberProfile;