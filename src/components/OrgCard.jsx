import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Globe, Bookmark, BookmarkCheck, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { t } from '../lib/discoveryTranslations';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import DemoBadge from '../components/DemoBadge';

var CATEGORY_COLORS_DARK = {
  veteran:           { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)',  color: '#93C5FD' },
  lgbtq:             { bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.35)',  color: '#C4B5FD' },
  latino:            { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.35)',  color: '#FDBA74' },
  black:             { bg: 'rgba(245,183,49,0.12)',  border: 'rgba(245,183,49,0.35)',  color: '#F5B731' },
  women:             { bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.35)',  color: '#F9A8D4' },
  youth:             { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',    color: '#86EFAC' },
  'faith-based':     { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.35)', color: '#A5B4FC' },
  'food-assistance': { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   color: '#FCA5A5' },
  housing:           { bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)',  color: '#5EEAD4' },
  education:         { bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)',   color: '#67E8F9' },
  health:            { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  color: '#6EE7B7' },
};

var CATEGORY_COLORS_LIGHT = {
  veteran:           { bg: '#DBEAFE', border: '#BFDBFE', color: '#1E40AF' },
  lgbtq:             { bg: '#EDE9FE', border: '#DDD6FE', color: '#5B21B6' },
  latino:            { bg: '#FFEDD5', border: '#FED7AA', color: '#9A3412' },
  black:             { bg: '#FEF9C3', border: '#FEF08A', color: '#854D0E' },
  women:             { bg: '#FCE7F3', border: '#FBCFE8', color: '#9D174D' },
  youth:             { bg: '#DCFCE7', border: '#BBF7D0', color: '#166534' },
  'faith-based':     { bg: '#E0E7FF', border: '#C7D2FE', color: '#3730A3' },
  'food-assistance': { bg: '#FEE2E2', border: '#FECACA', color: '#991B1B' },
  housing:           { bg: '#CCFBF1', border: '#99F6E4', color: '#115E59' },
  education:         { bg: '#CFFAFE', border: '#A5F3FC', color: '#155E75' },
  health:            { bg: '#D1FAE5', border: '#A7F3D0', color: '#065F46' },
};

var CATEGORY_LABELS = {
  veteran: 'Veteran Services', lgbtq: 'LGBTQ+', latino: 'Latino-Led',
  black: 'Black-Led', women: 'Women-Led', youth: 'Youth & Families',
  'faith-based': 'Faith-Based', 'food-assistance': 'Food Assistance',
  housing: 'Housing', education: 'Education', health: 'Health & Wellness',
};

var LANGUAGE_LABELS = {
  en: 'English', es: 'Español', zh: '中文', tl: 'Tagalog', vi: 'Tiếng Việt', ar: 'العربية',
};

function isRecentlyActive(lastActiveAt) {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 1000 * 60 * 60 * 24 * 30;
}

export default function OrgCard({ org, lang = 'en', session, initialFollowed = false }) {
  var { isDark } = useTheme();
  var [followed, setFollowed] = useState(initialFollowed);
  var [followLoading, setFollowLoading] = useState(false);

  var displayName = (org.translations && org.translations[lang] && org.translations[lang].name) || org.name;
  var aboutText   = org.discovery_about || null;
  var active      = isRecentlyActive(org.last_active_at);

  var cardBg     = isDark ? '#1A2035' : '#FFFFFF';
  var cardBorder = isDark ? '#2A3550' : '#E2E8F0';
  var nameTxt    = isDark ? '#FFFFFF'  : '#0E1523';
  var metaTxt    = isDark ? '#94A3B8'  : '#64748B';
  var aboutTxt   = isDark ? '#CBD5E1'  : '#475569';
  var divider    = isDark ? '#2A3550'  : '#F1F5F9';
  var logoBg     = isDark ? '#1E2845'  : '#F1F5F9';
  var logoTxt    = isDark ? '#2A3550'  : '#CBD5E1';
  var tackCore   = isDark ? '#1D4ED8'  : '#2563EB';
  var pillsDivider = isDark ? '#1E2845' : '#F8FAFC';

  var colors      = isDark ? CATEGORY_COLORS_DARK : CATEGORY_COLORS_LIGHT;
  var fallbackCat = isDark
    ? { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', color: '#94A3B8' }
    : { bg: '#F1F5F9', border: '#E2E8F0', color: '#475569' };

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
    } catch (err) {
      toast.error('Could not update saved organizations');
    } finally {
      setFollowLoading(false);
    }
  }

  var categories = org.service_categories || [];

  return (
    <article
      style={{
        background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '12px',
        overflow: 'visible', display: 'flex', flexDirection: 'column',
        position: 'relative', marginTop: '10px',
      }}
      aria-label={'Organization: ' + displayName}
    >
      {/* Brand tack */}
      <div aria-hidden="true" style={{
        width: '16px', height: '16px', borderRadius: '50%',
        position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
        background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, ' + tackCore + ' 52%, rgba(0,0,0,0.25) 100%)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.35)', zIndex: 2,
      }} />

      <div style={{ padding: '18px 16px 0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>

        {/* ── 1. Top row: logo + name + bookmark ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {org.logo_url ? (
            <img src={org.logo_url} alt={displayName + ' logo'} style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid ' + cardBorder }} />
          ) : (
            <div aria-hidden="true" style={{ width: '46px', height: '46px', borderRadius: '10px', flexShrink: 0, background: logoBg, border: '1px solid ' + cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: logoTxt }}>{(displayName || '?').charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: nameTxt, lineHeight: 1.3, wordBreak: 'break-word' }}>{displayName}</h2>
              {(org.is_demo || (org.id && org.id.startsWith('a0000000-0000-0000-0000-00000000000'))) && <DemoBadge size="sm" />}
{org.is_verified_nonprofit && (
  <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', fontSize:'10px', fontWeight:700, color:'#22C55E', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'99px', padding:'2px 7px', flexShrink:0 }} aria-label="Verified nonprofit">
    <svg xmlns="http://www.w3.org/2000/svg" style={{width:'9px',height:'9px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
    Verified
  </span>
)}
              {active && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '99px', padding: '2px 7px', flexShrink: 0 }} aria-label="Recently active">
                  <Zap size={9} aria-hidden="true" />Active
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: metaTxt, fontSize: '12px' }}>
              <MapPin size={11} aria-hidden="true" />
              <span>{[org.city, org.state].filter(Boolean).join(', ') || 'Location not listed'}</span>
              {org.distance_miles != null && <span style={{ marginLeft: '4px' }}>&bull; {org.distance_miles} mi</span>}
            </div>
          </div>
          <button
            onClick={handleFollow} disabled={followLoading}
            aria-label={followed ? 'Unsave organization' : 'Save organization'} aria-pressed={followed}
            style={{ flexShrink: 0, padding: '5px', borderRadius: '7px', background: 'none', border: 'none', cursor: followLoading ? 'not-allowed' : 'pointer', color: followed ? '#3B82F6' : metaTxt, opacity: followLoading ? 0.5 : 1, display: 'flex' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {followed ? <BookmarkCheck size={17} aria-hidden="true" /> : <Bookmark size={17} aria-hidden="true" />}
          </button>
        </div>

        {/* ── 2. About blurb ── */}
        {aboutText && (
          <p style={{ fontSize: '12px', color: aboutTxt, lineHeight: 1.6, margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {aboutText}
          </p>
        )}

        {/* ── 3. Footer: events + languages | View Org ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '10px', paddingBottom: '12px', borderTop: '1px solid ' + divider, marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
            {org.upcoming_events_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: metaTxt }}>
                <Calendar size={11} aria-hidden="true" />
                {org.upcoming_events_count} upcoming event{org.upcoming_events_count !== 1 ? 's' : ''}
              </span>
            )}
            {org.languages && org.languages.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: metaTxt }}>
                <Globe size={11} aria-hidden="true" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {org.languages.map(function (l) { return LANGUAGE_LABELS[l] || l; }).join(', ')}
                </span>
              </span>
            )}
          </div>
          <Link
            to={'/org/' + (org.slug || org.id)}
            style={{ flexShrink: 0, display: 'inline-block', padding: '7px 14px', background: '#3B82F6', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}
            className="hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label={'View organization: ' + displayName}
          >
            View Org
          </Link>
        </div>
      </div>

{/* ── 4. Category pills — hidden (used for search only) ── */}
      {false && categories.length > 0 && (
        <div
          style={{
            padding: '10px 16px 12px',
            borderTop: '1px solid ' + divider,
            background: pillsDivider,
            borderRadius: '0 0 12px 12px',
            display: 'flex', flexWrap: 'wrap', gap: '5px',
          }}
          aria-label="Service categories"
        >
          {categories.slice(0, 6).map(function (cat) {
            var c = colors[cat] || fallbackCat;
            return (
              <span key={cat} style={{ display: 'inline-block', background: c.bg, border: '1px solid ' + c.border, color: c.color, borderRadius: '99px', padding: '2px 9px', fontSize: '11px', fontWeight: 600 }}>
                {t(lang, cat) || CATEGORY_LABELS[cat] || cat}
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}