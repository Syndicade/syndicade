import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
  building: ['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  link:     'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  globe:    ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  tag:      ['M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z'],
  check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  checkSm:  'M5 13l4 4L19 7',
  alert:    ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
  external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  dollar:   ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
};

function formatPhone(phone) {
  if (!phone) return null;
  var cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return '(' + cleaned.slice(0,3) + ') ' + cleaned.slice(3,6) + '-' + cleaned.slice(6);
  return phone;
}

function getRoleDisplay(role) {
  var map = { admin: 'Administrator', moderator: 'Moderator', member: 'Member', guest: 'Guest', lead: 'Lead' };
  return map[role] || role;
}

function getGroupTypeBadge(type) {
  var map = { committee: 'bg-purple-100 text-purple-800', board: 'bg-blue-100 text-blue-800', team: 'bg-green-100 text-green-800', volunteer: 'bg-orange-100 text-orange-800' };
  return map[type] || 'bg-gray-100 text-gray-800';
}

var sectionLabelCls = 'text-xs font-bold uppercase tracking-widest mb-4';

function SectionHeading({ icon, iconColor, label, id }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (iconColor || 'bg-blue-100')}>
        <Icon path={icon} className="h-4 w-4 text-blue-600" />
      </div>
      <h2 id={id} className={sectionLabelCls + ' mb-0'} style={{ color: '#F5B731' }}>{label}</h2>
    </div>
  );
}

function DuesBadge({ membership }) {
  var paid = membership.dues_paid;
  var until = membership.dues_paid_until ? new Date(membership.dues_paid_until) : null;
  var expired = until && until < new Date();
  var status = !paid ? 'unpaid' : expired ? 'expired' : 'paid';

  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <Icon path={ICONS.checkSm} className="h-3 w-3" />
        {'Dues paid' + (until ? ' · Through ' + until.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
        <Icon path={ICONS.clock} className="h-3 w-3" />
        {'Dues expired ' + until.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
      <Icon path={ICONS.dollar} className="h-3 w-3" />
      Dues outstanding
    </span>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white bg-opacity-30 flex-shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-7 w-48 bg-white bg-opacity-30 rounded" />
            <div className="h-4 w-32 bg-white bg-opacity-20 rounded" />
          </div>
        </div>
      </div>
      {[1,2,3].map(function(i) {
        return (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
          </div>
        );
      })}
    </div>
  );
}

function MemberProfile() {
  var params = useParams();
  var userId = params.userId;

  var [member, setMember] = useState(null);
  var [memberships, setMemberships] = useState([]);
  var [groupMemberships, setGroupMemberships] = useState([]);
  var [tags, setTags] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [currentUserId, setCurrentUserId] = useState(null);

  useEffect(function() {
    supabase.auth.getUser().then(function(result) {
      if (result.data.user) setCurrentUserId(result.data.user.id);
    });
  }, []);

  useEffect(function() {
    if (userId) fetchAll();
    else { setError('No user ID provided'); setLoading(false); }
  }, [userId]);

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      var memberResult = await supabase.from('members').select('*').eq('user_id', userId).single();
      if (memberResult.error) throw memberResult.error;
      setMember(memberResult.data);

      var [membershipResult, groupResult, tagResult] = await Promise.all([
        supabase.from('memberships').select('id, role, status, joined_date, member_since_year, member_since_month, notes_public, dues_paid, dues_paid_until, dues_amount, organizations(id, name, type)').eq('member_id', userId).eq('status', 'active').order('joined_date', { ascending: false }),
        supabase.from('group_memberships').select('id, role, status, joined_at, groups(id, name, description, type, organization_id, organizations(id, name))').eq('member_id', userId).eq('status', 'active').order('joined_at', { ascending: false }),
        supabase.from('member_tag_assignments').select('member_tags(id, name, color, organization_id, member_tags_organizations:organizations(name))').eq('member_id', userId),
      ]);

      setMemberships(membershipResult.data || []);
      setGroupMemberships(groupResult.error ? [] : (groupResult.data || []));
      setTags((tagResult.data || []).map(function(a) { return a.member_tags; }).filter(Boolean));
    } catch (err) {
      console.error('Error fetching member data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  var isOwnProfile = currentUserId === userId;

  function canSee(field) {
    if (isOwnProfile) return true;
    var ps = member && member.privacy_settings;
    if (!ps) return false;
    return !!ps[field];
  }

  var groupsByOrg = groupMemberships.reduce(function(acc, gm) {
    var orgId = gm.groups && gm.groups.organization_id;
    var orgName = (gm.groups && gm.groups.organizations && gm.groups.organizations.name) || 'Unknown Organization';
    if (!orgId) return acc;
    if (!acc[orgId]) acc[orgId] = { orgName: orgName, groups: [] };
    acc[orgId].groups.push(gm);
    return acc;
  }, {});

  var externalOrgs = (member && Array.isArray(member.external_orgs)) ? member.external_orgs : [];

  var SOCIAL_LINKS = member ? [
    { key: 'website',   label: 'Website',     icon: ICONS.globe, href: member.website   },
    { key: 'linkedin',  label: 'LinkedIn',    icon: ICONS.link,  href: member.linkedin  },
    { key: 'instagram', label: 'Instagram',   icon: ICONS.link,  href: member.instagram },
    { key: 'facebook',  label: 'Facebook',    icon: ICONS.link,  href: member.facebook  },
    { key: 'twitter',   label: 'X / Twitter', icon: ICONS.link,  href: member.twitter   },
  ].filter(function(s) { return s.href && s.href.trim(); }) : [];

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Icon path={ICONS.alert} className="h-12 w-12 text-red-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Error Loading Profile</h3>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button onClick={fetchAll} className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Icon path={ICONS.user} className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Profile Not Found</h3>
        <p className="text-gray-500 text-sm">This profile doesn't exist or you don't have permission to view it.</p>
      </div>
    );
  }

  var displayName = member.display_name || ((member.first_name || '') + ' ' + (member.last_name || '')).trim();
  var initials = ((member.first_name && member.first_name.charAt(0)) || '') + ((member.last_name && member.last_name.charAt(0)) || '');
  var avatarUrl = member.avatar_url || member.profile_photo_url;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <article aria-labelledby="member-name">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-8 py-8">
          <div className="flex items-center gap-6 flex-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-extrabold shadow-lg flex-shrink-0" aria-hidden="true">
                {initials.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 id="member-name" className="text-3xl font-extrabold text-white truncate">{displayName}</h1>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3" aria-label="Member tags">
                  {tags.map(function(tag) {
                    return (
                      <span key={tag.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Contact ── */}
        {(member.email || member.phone || (member.city && member.state)) && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SectionHeading icon={ICONS.user} label="Contact Information" id="contact-heading" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {member.email && canSee('show_email') && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Icon path={ICONS.email} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <a href={'mailto:' + member.email} className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded truncate" aria-label={'Send email to ' + displayName}>
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && canSee('show_phone') && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Icon path={ICONS.phone} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <a href={'tel:' + member.phone} className="text-sm hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Call ' + displayName}>
                    {formatPhone(member.phone)}
                  </a>
                </div>
              )}
              {member.city && member.state && canSee('show_address') && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Icon path={ICONS.location} className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">{member.city + ', ' + member.state}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bio ── */}
        {member.bio && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SectionHeading icon={ICONS.user} label="About" id="bio-heading" />
            <p className="text-gray-700 leading-relaxed text-sm">{member.bio}</p>
          </div>
        )}

        {/* ── Social Links ── */}
        {SOCIAL_LINKS.length > 0 && canSee('show_social') && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SectionHeading icon={ICONS.link} label="Social Links" id="social-heading" />
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map(function(s) {
                return (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label={'Visit ' + displayName + "'s " + s.label}
                  >
                    <Icon path={s.icon} className="h-4 w-4" />
                    {s.label}
                    <Icon path={ICONS.external} className="h-3.5 w-3.5 text-gray-400" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Syndicade Org Memberships ── */}
        {memberships.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SectionHeading icon={ICONS.building} label="Organizations" id="orgs-heading" />
            <div className="space-y-3" role="list">
              {memberships.map(function(m) {
                return (
                  <div key={m.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" role="listitem">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{m.organizations && m.organizations.name}</p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{m.organizations && m.organizations.type}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex-shrink-0">
                        {getRoleDisplay(m.role)}
                      </span>
                    </div>
                    {m.member_since_year && (
                      <p className="text-xs text-gray-400 mt-2">
                        {'Member since ' + (m.member_since_month ? new Date(2000, m.member_since_month - 1).toLocaleString('en-US', { month: 'long' }) + ' ' : '') + m.member_since_year}
                      </p>
                    )}
                    {m.notes_public && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Icon path={ICONS.check} className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <p className="text-xs text-blue-700 font-medium">{m.notes_public}</p>
                      </div>
                    )}
                    {isOwnProfile && (
                      <div className="mt-2">
                        <DuesBadge membership={m} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── External Orgs ── */}
        {externalOrgs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SectionHeading icon={ICONS.globe} label="Other Organizations" id="external-orgs-heading" />
            <div className="space-y-3" role="list">
              {externalOrgs.map(function(org, i) {
                return (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl" role="listitem">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{org.name}</p>
                        {org.role && <p className="text-sm text-gray-600 mt-0.5">{org.role}</p>}
                      </div>
                      {org.duration && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 flex-shrink-0">
                          {org.duration}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Groups & Committees ── */}
        {Object.keys(groupsByOrg).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <SectionHeading icon={ICONS.users} label="Groups & Committees" id="groups-heading" />
            <div className="space-y-5">
              {Object.entries(groupsByOrg).map(function(entry) {
                var orgId = entry[0];
                var orgName = entry[1].orgName;
                var groups = entry[1].groups;
                return (
                  <div key={orgId}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{orgName}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groups.map(function(gm) {
                        return (
                          <div key={gm.id} className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{gm.groups && gm.groups.name}</p>
                              {gm.groups && gm.groups.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{gm.groups.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {gm.groups && gm.groups.type && (
                                <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ' + getGroupTypeBadge(gm.groups.type)}>
                                  {gm.groups.type}
                                </span>
                              )}
                              {gm.role === 'lead' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Lead</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Own profile edit prompt ── */}
        {isOwnProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-blue-700 font-medium">This is your public profile. Keep it up to date!</p>
            <a
              href="/profile/settings"
              className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex-shrink-0"
            >
              Edit Profile
            </a>
          </div>
        )}

      </article>
    </div>
  );
}

export default MemberProfile;