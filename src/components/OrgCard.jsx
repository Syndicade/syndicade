import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Globe, Bookmark, BookmarkCheck, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { t } from '../lib/discoveryTranslations';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  veteran: 'bg-blue-100 text-blue-800',
  lgbtq: 'bg-purple-100 text-purple-800',
  latino: 'bg-orange-100 text-orange-800',
  black: 'bg-yellow-100 text-yellow-800',
  women: 'bg-pink-100 text-pink-800',
  youth: 'bg-green-100 text-green-800',
  'faith-based': 'bg-indigo-100 text-indigo-800',
  'food-assistance': 'bg-red-100 text-red-800',
  housing: 'bg-teal-100 text-teal-800',
  education: 'bg-cyan-100 text-cyan-800',
  health: 'bg-emerald-100 text-emerald-800',
};

const LANGUAGE_LABELS = {
  en: 'English',
  es: 'Español',
  zh: '中文',
  tl: 'Tagalog',
  vi: 'Tiếng Việt',
  ar: 'العربية',
};

function isRecentlyActive(lastActiveAt) {
  if (!lastActiveAt) return false;
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  return diff < 1000 * 60 * 60 * 24 * 30;
}

export default function OrgCard({ org, lang = 'en', session, initialFollowed = false }) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [followLoading, setFollowLoading] = useState(false);

  const displayName = org.translations?.[lang]?.name || org.name;
  const displayDescription = org.translations?.[lang]?.description || org.description || org.tagline;
  const active = isRecentlyActive(org.last_active_at);

  async function handleFollow() {
    if (!session) {
      toast(t(lang, 'signInToSave'), { icon: null });
      return;
    }
    setFollowLoading(true);
    try {
      if (followed) {
        const { error } = await supabase
          .from('org_followers')
          .delete()
          .eq('org_id', org.id)
          .eq('user_id', session.user.id);
        if (error) throw error;
        setFollowed(false);
        toast.success('Removed from saved organizations');
      } else {
        const { error } = await supabase
          .from('org_followers')
          .insert({ org_id: org.id, user_id: session.user.id });
        if (error) throw error;
        setFollowed(true);
        toast.success('Organization saved');
      }
    } catch (err) {
      toast.error('Could not update saved organizations');
    } finally {
      setFollowLoading(false);
    }
  }

  return (
    <article
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex flex-col gap-3"
      aria-label={`Organization: ${displayName}`}
    >
      <div className="flex items-start gap-3">
        {org.logo_url ? (
          <img
            src={org.logo_url}
            alt={`${displayName} logo`}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200"
            aria-hidden="true"
          >
            <span className="text-xl font-bold text-gray-400">
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900 truncate">{displayName}</h2>
            {active && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"
                title={t(lang, 'recentlyActive')}
                aria-label={t(lang, 'recentlyActive')}
              >
                <Zap size={11} aria-hidden="true" />
                {t(lang, 'recentlyActive')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
            <MapPin size={13} aria-hidden="true" />
            <span>
              {[org.city, org.state].filter(Boolean).join(', ') || 'Location not listed'}
            </span>
            {org.distance_miles != null && (
              <span className="ml-1 text-gray-400">
                &bull; {org.distance_miles} {t(lang, 'miles')}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleFollow}
          disabled={followLoading}
          aria-label={followed ? t(lang, 'unfollow') : t(lang, 'follow')}
          aria-pressed={followed}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
        >
          {followed
            ? <BookmarkCheck size={18} className="text-blue-600" aria-hidden="true" />
            : <Bookmark size={18} aria-hidden="true" />
          }
        </button>
      </div>

      {displayDescription && (
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {displayDescription}
        </p>
      )}

      {org.service_categories?.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Service categories">
          {org.service_categories.slice(0, 4).map((cat) => (
            <span
              key={cat}
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700'}`}
            >
              {t(lang, cat)}
            </span>
          ))}
          {org.service_categories.length > 4 && (
            <span className="text-xs text-gray-500 px-2 py-0.5">
              +{org.service_categories.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {org.upcoming_events_count > 0 && (
            <span className="flex items-center gap-1">
              <Calendar size={13} aria-hidden="true" />
              {t(lang, 'upcomingEvents')}: {org.upcoming_events_count}
            </span>
          )}
          {org.languages?.length > 0 && (
            <span className="flex items-center gap-1">
              <Globe size={13} aria-hidden="true" />
              {org.languages.map((l) => LANGUAGE_LABELS[l] || l).join(', ')}
            </span>
          )}
        </div>

        <Link
          to={`/org/${org.slug || org.id}`}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label={`${t(lang, 'viewOrganization')}: ${displayName}`}
        >
          {t(lang, 'viewOrganization')}
        </Link>
      </div>
    </article>
  );
}