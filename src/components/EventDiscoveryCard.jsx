import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Globe, Bookmark, BookmarkCheck, Share2, Users, Handshake, Package, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { et } from '../lib/eventDiscoveryTranslations';
import toast from 'react-hot-toast';

const EVENT_TYPE_COLORS = {
  'advocacy-event': { bg: '#3B1A1A', color: '#F87171' },
  'blood-drive': { bg: '#3B1A2A', color: '#FB7185' },
  'clothing-drive': { bg: '#2D1B4E', color: '#C084FC' },
  'community-meeting': { bg: '#1D3461', color: '#60A5FA' },
  'cultural-event': { bg: '#3B2A1A', color: '#FB923C' },
  'education-workshop': { bg: '#1A2E3B', color: '#22D3EE' },
  'faith-based-event': { bg: '#1E1B4B', color: '#818CF8' },
  'food-drive': { bg: '#3B3A1A', color: '#FBBF24' },
  'fundraiser': { bg: '#1B3A2F', color: '#4ADE80' },
  'health-wellness': { bg: '#1B3A2F', color: '#34D399' },
  'volunteer-opportunity': { bg: '#1A3B3B', color: '#2DD4BF' },
  'youth-event': { bg: '#3B1A2E', color: '#F472B6' },
};

const LANGUAGE_LABELS = {
  en: 'English', es: 'Español', zh: '中文',
  tl: 'Tagalog', vi: 'Tiếng Việt', ar: 'العربية',
};

function formatEventDate(startTime, endTime, allDay) {
  if (!startTime) return '';
  var start = new Date(startTime);
  var dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (allDay) return dateStr;
  var timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (endTime) {
    var end = new Date(endTime);
    var endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return dateStr + ' · ' + timeStr + ' – ' + endTimeStr;
  }
  return dateStr + ' · ' + timeStr;
}

export default function EventDiscoveryCard({ event, lang, session, initialSaved, onRSVP, adminOrgs }) {
  lang = lang || 'en';
  initialSaved = initialSaved || false;
  adminOrgs = adminOrgs || [];

  var [saved, setSaved] = useState(initialSaved);
  var [saveLoading, setSaveLoading] = useState(false);
  var [colabModal, setColabModal] = useState(false);
  var [selectedOrgId, setSelectedOrgId] = useState('');
  var [colabLoading, setColabLoading] = useState(false);

  var isAdmin = adminOrgs.length > 0;
  var isOwnEvent = adminOrgs.some(function(org) { return org.id === event.organization_id; });
  var showCollaborate = isAdmin && !isOwnEvent;

  async function handleSave() {
    if (!session) {
      toast(et(lang, 'signInToSave'), { icon: null });
      return;
    }
    setSaveLoading(true);
    try {
      if (saved) {
        var { error } = await supabase
          .from('event_saves')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', session.user.id);
        if (error) throw error;
        setSaved(false);
        toast.success('Removed from saved events');
      } else {
        var { error: insertError } = await supabase
          .from('event_saves')
          .insert({ event_id: event.id, user_id: session.user.id });
        if (insertError) throw insertError;
        setSaved(true);
        toast.success('Event saved');
      }
    } catch {
      toast.error('Could not update saved events');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleShare() {
    var url = window.location.origin + '/events/' + event.id;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(et(lang, 'linkCopied'));
    } catch {
      toast.error('Could not copy link');
    }
  }

  function openColabModal() {
    if (adminOrgs.length === 1) {
      setSelectedOrgId(adminOrgs[0].id);
    }
    setColabModal(true);
  }

  async function submitCollab() {
    var orgId = selectedOrgId || (adminOrgs.length === 1 ? adminOrgs[0].id : '');
    if (!orgId) {
      toast.error('Please select an organization');
      return;
    }
    setColabLoading(true);
    try {
      var org = adminOrgs.find(function(o) { return o.id === orgId; });
      var orgName = org ? org.name : 'An organization';

      // Insert collaboration request
      var { error: collabError } = await supabase
        .from('event_collaborators')
        .insert({
          event_id: event.id,
          requesting_org_id: orgId,
          host_org_id: event.organization_id,
          status: 'pending',
          message: orgName + ' wants to collaborate on this event.',
        });
      if (collabError) {
        if (collabError.code === '23505') throw new Error('You have already sent a collaboration request for this event');
        throw collabError;
      }

      // Notify host org admins
      var { data: hostAdmins } = await supabase
        .from('memberships')
        .select('member_id')
        .eq('organization_id', event.organization_id)
        .eq('role', 'admin')
        .eq('status', 'active');

      if (hostAdmins && hostAdmins.length > 0) {
        var notifications = hostAdmins.map(function(m) {
          return {
            user_id: m.member_id,
            type: 'collaboration_request',
            title: 'Collaboration Request',
            message: orgName + ' wants to collaborate on "' + event.title + '"',
            data: { event_id: event.id, requesting_org_id: orgId },
            is_read: false,
          };
        });
        await supabase.from('notifications').insert(notifications);
      }

      toast.success('Collaboration request sent!');
      setColabModal(false);
    } catch (err) {
      toast.error(err.message || 'Could not send request');
    } finally {
      setColabLoading(false);
    }
  }

  var locationDisplay = [event.city, event.state].filter(Boolean).join(', ');
  var isFeatured = event.is_featured;

  var cardStyle = {
    background: '#1A2035',
    border: isFeatured ? '2px solid #F5B731' : '1px solid #2A3550',
    borderRadius: '12px',
    overflow: 'hidden',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  return (
    <>
      <article style={cardStyle} aria-label={'Event: ' + event.title}>

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white leading-snug">{event.title}</h2>
            {event.org_name && (
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <Link
                  to={'/org/' + (event.org_slug || event.organization_id)}
                  className="text-sm text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={'Hosted by ' + event.org_name}
                >
                  {event.org_name}
                </Link>
                {event.collaborator_orgs && event.collaborator_orgs.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {'+ ' + event.collaborator_orgs.join(', ')}
                  </span>
                )}
                {isFeatured && (
                  <span style={{
                    marginLeft: 'auto',
                    background: 'rgba(245,183,49,0.12)',
                    border: '1px solid rgba(245,183,49,0.35)',
                    color: '#F5B731',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    flexShrink: 0,
                  }}>
                    Featured
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saveLoading}
              aria-label={saved ? et(lang, 'savedEvent') : et(lang, 'saveEvent')}
              aria-pressed={saved}
              className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 disabled:opacity-50"
            >
              {saved
                ? <BookmarkCheck size={16} className="text-yellow-400" aria-hidden="true" />
                : <Bookmark size={16} aria-hidden="true" />
              }
            </button>
            <button
              onClick={handleShare}
              aria-label={et(lang, 'shareEvent')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <Share2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Date & Location */}
        <div className="flex flex-col gap-1 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} aria-hidden="true" />
            {formatEventDate(event.start_time, event.end_time, event.all_day)}
          </span>
          {(locationDisplay || event.is_virtual) && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} aria-hidden="true" />
              {event.is_virtual
                ? event.location ? ('Hybrid · ' + locationDisplay) : 'Virtual'
                : locationDisplay || event.location || 'Location not listed'
              }
              {event.distance_miles != null && (
                <span className="text-gray-500 ml-1">· {event.distance_miles} mi</span>
              )}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Event Type Tags */}
        {event.event_types && event.event_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Event types">
            {event.event_types.slice(0, 3).map(function(type) {
              var colors = EVENT_TYPE_COLORS[type] || { bg: '#1A2035', color: '#94A3B8' };
              return (
                <span
                  key={type}
                  style={{ background: colors.bg, color: colors.color, fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px' }}
                >
                  {et(lang, type)}
                </span>
              );
            })}
            {event.event_types.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-0.5">+{event.event_types.length - 3} more</span>
            )}
          </div>
        )}

        {/* Audience Tags */}
        {event.audience && event.audience.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Audience served">
            {event.audience.slice(0, 3).map(function(a) {
              return (
                <span key={a} className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#1E2845', color: '#94A3B8' }}>
                  <Users size={10} aria-hidden="true" />
                  {et(lang, a)}
                </span>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-auto flex-wrap gap-2" style={{ borderTop: '1px solid #2A3550' }}>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {event.languages && event.languages.length > 0 && (
              <span className="flex items-center gap-1">
                <Globe size={12} aria-hidden="true" />
                {event.languages.map(function(l) { return LANGUAGE_LABELS[l] || l; }).join(', ')}
              </span>
            )}
            {event.volunteer_signup && (
              <span className="flex items-center gap-1 text-teal-400">
                <Handshake size={12} aria-hidden="true" />
                Volunteer
              </span>
            )}
            {event.donation_dropoff && (
              <span className="flex items-center gap-1 text-orange-400">
                <Package size={12} aria-hidden="true" />
                Donations
              </span>
            )}
            {event.requires_rsvp && (
              <span className="flex items-center gap-1 text-blue-400">
                <Heart size={12} aria-hidden="true" />
                RSVP
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showCollaborate && (
              <button
                onClick={openColabModal}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA' }}
                aria-label={'Request to collaborate on ' + event.title}
              >
                Collaborate
              </button>
            )}
            <Link
              to={'/events/' + event.id}
              className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              style={{ background: '#3B82F6' }}
              aria-label={(et(lang, 'viewEvent')) + ': ' + event.title}
            >
              {event.requires_rsvp ? et(lang, 'rsvpButton') : et(lang, 'viewEvent')}
            </Link>
          </div>
        </div>
      </article>

      {/* Collaborate Modal */}
      {colabModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={function() { setColabModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="collab-modal-title"
        >
          <div
            className="rounded-xl shadow-xl max-w-md w-full"
            style={{ background: '#1A2035', border: '1px solid #2A3550' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #2A3550' }}>
              <h2 id="collab-modal-title" className="text-lg font-bold text-white">Request Collaboration</h2>
              <p className="text-sm text-gray-400 mt-1">{event.title}</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-300">
                Your collaboration request will be sent to the admins of this organization. If accepted, both org names will appear on the event.
              </p>

              {adminOrgs.length > 1 && (
                <div>
                  <label htmlFor="collab-org-select" className="block text-sm font-semibold text-white mb-1.5">
                    Requesting as
                  </label>
                  <select
                    id="collab-org-select"
                    value={selectedOrgId}
                    onChange={function(e) { setSelectedOrgId(e.target.value); }}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ background: '#0E1523', border: '1px solid #2A3550' }}
                    aria-required="true"
                  >
                    <option value="">Select your organization...</option>
                    {adminOrgs.map(function(org) {
                      return (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      );
                    })}
                  </select>
                </div>
              )}

              {adminOrgs.length === 1 && (
                <p className="text-sm text-gray-400">
                  Requesting as <span className="text-white font-semibold">{adminOrgs[0].name}</span>
                </p>
              )}
            </div>

            <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: '1px solid #2A3550' }}>
              <button
                onClick={function() { setColabModal(false); }}
                disabled={colabLoading}
                className="px-4 py-2 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                style={{ background: 'transparent', border: '1px solid #2A3550', color: '#94A3B8' }}
              >
                Cancel
              </button>
              <button
                onClick={submitCollab}
                disabled={colabLoading || (adminOrgs.length > 1 && !selectedOrgId)}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                style={{ background: '#3B82F6' }}
              >
                {colabLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}