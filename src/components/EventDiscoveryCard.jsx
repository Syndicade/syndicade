import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Globe, Bookmark, BookmarkCheck, Share2, Users, Heart, Package, Handshake } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { et } from '../lib/eventDiscoveryTranslations';
import toast from 'react-hot-toast';

const EVENT_TYPE_COLORS = {
  'advocacy-event': 'bg-red-100 text-red-800',
  'blood-drive': 'bg-rose-100 text-rose-800',
  'clothing-drive': 'bg-purple-100 text-purple-800',
  'community-meeting': 'bg-blue-100 text-blue-800',
  'cultural-event': 'bg-orange-100 text-orange-800',
  'education-workshop': 'bg-cyan-100 text-cyan-800',
  'faith-based-event': 'bg-indigo-100 text-indigo-800',
  'food-drive': 'bg-yellow-100 text-yellow-800',
  'fundraiser': 'bg-green-100 text-green-800',
  'health-wellness': 'bg-emerald-100 text-emerald-800',
  'volunteer-opportunity': 'bg-teal-100 text-teal-800',
  'youth-event': 'bg-pink-100 text-pink-800',
};

const LANGUAGE_LABELS = {
  en: 'English', es: 'Español', zh: '中文',
  tl: 'Tagalog', vi: 'Tiếng Việt', ar: 'العربية',
};

function formatEventDate(startTime, endTime, allDay) {
  if (!startTime) return '';
  const start = new Date(startTime);
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (allDay) return dateStr;
  const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (endTime) {
    const end = new Date(endTime);
    const endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr} · ${timeStr} – ${endTimeStr}`;
  }
  return `${dateStr} · ${timeStr}`;
}

export default function EventDiscoveryCard({ event, lang = 'en', session, initialSaved = false }) {
  const [saved, setSaved] = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);

  async function handleSave() {
    if (!session) {
      toast(et(lang, 'signInToSave'), { icon: null });
      return;
    }
    setSaveLoading(true);
    try {
      if (saved) {
        const { error } = await supabase
          .from('event_saves')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', session.user.id);
        if (error) throw error;
        setSaved(false);
        toast.success('Removed from saved events');
      } else {
        const { error } = await supabase
          .from('event_saves')
          .insert({ event_id: event.id, user_id: session.user.id });
        if (error) throw error;
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
    const url = `${window.location.origin}/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(et(lang, 'linkCopied'));
    } catch {
      toast.error('Could not copy link');
    }
  }

  const locationDisplay = [event.city, event.state].filter(Boolean).join(', ');

  return (
    <article
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex flex-col gap-3"
      aria-label={`Event: ${event.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 leading-snug">{event.title}</h2>
          {event.org_name && (
            <Link
              to={`/org/${event.org_slug || event.organization_id}`}
              className="text-sm text-blue-600 hover:underline mt-0.5 inline-block"
              aria-label={`${et(lang, 'hostedBy')} ${event.org_name}`}
            >
              {et(lang, 'hostedBy')} {event.org_name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saveLoading}
            aria-label={saved ? et(lang, 'savedEvent') : et(lang, 'saveEvent')}
            aria-pressed={saved}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
          >
            {saved
              ? <BookmarkCheck size={16} className="text-blue-600" aria-hidden="true" />
              : <Bookmark size={16} aria-hidden="true" />
            }
          </button>
          <button
            onClick={handleShare}
            aria-label={et(lang, 'shareEvent')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <Share2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Date & Location */}
      <div className="flex flex-col gap-1 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} aria-hidden="true" />
          {formatEventDate(event.start_time, event.end_time, event.all_day)}
        </span>
        {(locationDisplay || event.is_virtual) && (
          <span className="flex items-center gap-1.5">
            <MapPin size={13} aria-hidden="true" />
            {event.is_virtual
              ? event.location
                ? `${et(lang, 'hybrid')} · ${locationDisplay}`
                : et(lang, 'virtual')
              : locationDisplay || event.location || 'Location not listed'
            }
            {event.distance_miles != null && (
              <span className="text-gray-400 ml-1">· {event.distance_miles} mi</span>
            )}
          </span>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {event.description}
        </p>
      )}

      {/* Event Type Tags */}
      {event.event_types?.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Event types">
          {event.event_types.slice(0, 3).map((type) => (
            <span
              key={type}
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700'}`}
            >
              {et(lang, type)}
            </span>
          ))}
          {event.event_types.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-0.5">+{event.event_types.length - 3} more</span>
          )}
        </div>
      )}

      {/* Audience Tags */}
      {event.audience?.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Audience served">
          {event.audience.slice(0, 3).map((a) => (
            <span key={a} className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
              <Users size={10} aria-hidden="true" />
              {et(lang, a)}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {event.languages?.length > 0 && (
            <span className="flex items-center gap-1">
              <Globe size={12} aria-hidden="true" />
              {event.languages.map((l) => LANGUAGE_LABELS[l] || l).join(', ')}
            </span>
          )}
          {event.volunteer_signup && (
            <span className="flex items-center gap-1 text-teal-600">
              <Handshake size={12} aria-hidden="true" />
              Volunteer
            </span>
          )}
          {event.donation_dropoff && (
            <span className="flex items-center gap-1 text-orange-600">
              <Package size={12} aria-hidden="true" />
              Donations
            </span>
          )}
          {event.requires_rsvp && (
            <span className="flex items-center gap-1 text-blue-600">
              <Heart size={12} aria-hidden="true" />
              RSVP
            </span>
          )}
        </div>

        <Link
          to={`/events/${event.id}`}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label={`${et(lang, 'viewEvent')}: ${event.title}`}
        >
          {event.requires_rsvp ? et(lang, 'rsvpButton') : et(lang, 'viewEvent')}
        </Link>
      </div>
    </article>
  );
}