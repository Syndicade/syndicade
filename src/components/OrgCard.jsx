import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { t } from '../lib/discoveryTranslations';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';

var LANGUAGE_LABELS = {
  en: 'English', es: 'Español', zh: '中文', tl: 'Tagalog', vi: 'Tiếng Việt', ar: 'العربية',
};

var AVATAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B',
  '#EF4444', '#14B8A6', '#EC4899', '#6366F1',
];

function getAvatarColor(name) {
  var char = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[char % AVATAR_COLORS.length];
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '11px', height: '11px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '11px', height: '11px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function OrgTagChips({ tags }) {
  var [expanded, setExpanded] = useState(false);
  var visible = expanded ? tags : tags.slice(0, 3);
  var overflow = tags.length - 3;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
        {visible.map(function(tag) {
          return (
            <span key={tag} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
              {tag}
            </span>
          );
        })}
        {!expanded && overflow > 0 && (
          <button
            type="button"
            onClick={function(e) { e.preventDefault(); setExpanded(true); }}
            style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, background: 'none', border: '1px solid #E2E8F0', color: '#94A3B8', cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={'Show ' + overflow + ' more tags'}
          >
            + {overflow} more
          </button>
        )}
        {expanded && (
          <button
            type="button"
            onClick={function(e) { e.preventDefault(); setExpanded(false); }}
            style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, background: 'none', border: '1px solid #E2E8F0', color: '#94A3B8', cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Show fewer tags"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrgCard({ org, lang, session, initialFollowed }) {
  lang = lang || 'en';
  initialFollowed = initialFollowed || false;

  var [followed, setFollowed] = useState(initialFollowed);
  var [followLoading, setFollowLoading] = useState(false);

  var displayName = (org.translations && org.translations[lang] && org.translations[lang].name) || org.name;
  var aboutText   = org.discovery_about || null;
  var location    = [org.city, org.state].filter(Boolean).join(', ') || 'Location not listed';
  var avatarColor = getAvatarColor(displayName);
  var isDemo      = org.is_demo || (org.id && org.id.startsWith('a0000000-0000-0000-0000-00000000000'));

  async function handleFollow(e) {
    e.preventDefault();
    if (!session) { toast(t(lang, 'signInToSave') || 'Sign in to save organizations'); return; }
    setFollowLoading(true);
    try {
      if (followed) {
        var r = await supabase.from('org_followers').delete().eq('org_id', org.id).eq('user_id', session.user.id);
        if (r.error) throw r.error;
        setFollowed(false);
        toast('Removed from saved organizations');
      } else {
        var r2 = await supabase.from('org_followers').insert({ org_id: org.id, user_id: session.user.id });
        if (r2.error) throw r2.error;
        setFollowed(true);
        mascotSuccessToast('Organization saved!');
      }
    } catch {
      toast.error('Could not update saved organizations');
    } finally {
      setFollowLoading(false);
    }
  }

  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
      }}
      aria-label={'Organization: ' + displayName}
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* ── Top row: avatar + name + location + bookmark ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>

          {/* Circular avatar */}
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={displayName + ' logo'}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #E2E8F0' }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                {(displayName || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Name inline with verified dot + location */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + verified dot in one inline flow — dot never orphans */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', flexWrap: 'nowrap' }}>
  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0E1523', lineHeight: 1.4, margin: 0 }}>
    {displayName}
  </h2>
  {org.is_verified_nonprofit && (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '15px', height: '15px', marginTop: '2px', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2} aria-label="Verified nonprofit" title="Verified nonprofit">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )}
</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: '#64748B', fontSize: '12px' }}>
              <MapPinIcon />
              <span>{location}</span>
              {org.distance_miles != null && <span>&bull; {org.distance_miles} mi</span>}
            </div>
          </div>

          {/* Bookmark */}
          <button
            onClick={handleFollow}
            disabled={followLoading}
            aria-label={followed ? 'Unsave organization' : 'Save organization'}
            aria-pressed={followed}
            style={{ flexShrink: 0, padding: '5px', borderRadius: '7px', background: 'none', border: 'none', cursor: followLoading ? 'not-allowed' : 'pointer', color: followed ? '#3B82F6' : '#64748B', opacity: followLoading ? 0.5 : 1 }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:bg-slate-100"
          >
            {followed ? (
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '17px', height: '17px' }} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '17px', height: '17px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Description — fixed min-height so footer aligns across all cards ── */}
        <div style={{ minHeight: '54px', marginBottom: '12px' }}>
          {aboutText ? (
            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {aboutText}
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
              No description available.
            </p>
          )}
        </div>

{/* ── Footer: events + sample data | View ── */}
        <div style={{ paddingTop: '10px', borderTop: '1px solid #E2E8F0', marginTop: 'auto' }}>
          {(org.tags || []).length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <OrgTagChips tags={org.tags} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>

          {/* Left: events badge + sample data pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {org.upcoming_events_count > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#3B82F6', background: '#EFF6FF', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                <CalendarIcon />
                {org.upcoming_events_count} event{org.upcoming_events_count !== 1 ? 's' : ''}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>No upcoming events</span>
            )}
            {isDemo && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#92400E', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', padding: '2px 7px', borderRadius: '99px' }}>
                Sample Data
              </span>
            )}
          </div>

          <Link
            to={'/org/' + (org.slug || org.id)}
            style={{ flexShrink: 0, display: 'inline-block', padding: '6px 14px', background: '#3B82F6', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={'View organization: ' + displayName}
          >
            View
          </Link>
</div>
        </div>

      </div>
    </article>
  );
}