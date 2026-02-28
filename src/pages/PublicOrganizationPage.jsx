import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  getThemeVars,
  getNavLinks,
  ClassicTemplate,
  ModernTemplate,
  BannerTemplate,
  SidebarTemplate,
  FeaturedTemplate,
} from '../components/OrgTemplates';

function PublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading organization page">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="hidden md:flex gap-5">
            {[1,2,3,4].map(function(i) { return <div key={i} className="h-4 w-14 bg-gray-200 rounded animate-pulse" />; })}
          </div>
          <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="bg-gray-50 border-b border-gray-200 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-80 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-36 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          {[1,2,3].map(function(i) { return <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />; })}
        </div>
        <div className="space-y-3">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          {[1,2,3].map(function(i) { return <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />; })}
        </div>
      </div>
    </div>
  );
}

export default function PublicOrganizationPage() {
  var { slug } = useParams();
  var [organization, setOrganization] = useState(null);
  var [events, setEvents] = useState([]);
  var [announcements, setAnnouncements] = useState([]);
  var [photos, setPhotos] = useState([]);
  var [lightboxPhoto, setLightboxPhoto] = useState(null);
  var [lightboxIndex, setLightboxIndex] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [joinForm, setJoinForm] = useState({ name: '', email: '', message: '' });
  var [joinLoading, setJoinLoading] = useState(false);
  var [joinError, setJoinError] = useState(null);
  var [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(function() { fetchOrganization(); }, [slug]);

  async function fetchOrganization() {
    try {
      setLoading(true);
      var { data: org, error: orgError } = await supabase.from('organizations').select('*').eq('slug', slug).single();
      if (orgError) throw orgError;
      setOrganization(org);
      var [eventsRes, announcementsRes, photosRes] = await Promise.allSettled([
        supabase.from('events').select('*').eq('organization_id', org.id).eq('visibility', 'public').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(3),
        supabase.from('announcements').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('org_photos').select('*').eq('organization_id', org.id).order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      ]);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data || []);
      if (announcementsRes.status === 'fulfilled') setAnnouncements(announcementsRes.value.data || []);
      if (photosRes.status === 'fulfilled') setPhotos(photosRes.value.data || []);
    } catch (err) {
      setError('Organization not found');
    } finally {
      setLoading(false);
    }
  }

  var handleKeyDown = useCallback(function(e) {
    if (!lightboxPhoto) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
  }, [lightboxPhoto, lightboxIndex, photos]);

  useEffect(function() {
    window.addEventListener('keydown', handleKeyDown);
    return function() { window.removeEventListener('keydown', handleKeyDown); };
  }, [handleKeyDown]);

  function openLightbox(photo, index) { setLightboxPhoto(photo); setLightboxIndex(index); document.body.style.overflow = 'hidden'; }
  function closeLightbox() { setLightboxPhoto(null); setLightboxIndex(null); document.body.style.overflow = ''; }
  function navigateLightbox(dir) {
    var next = lightboxIndex + dir;
    if (next >= 0 && next < photos.length) { setLightboxPhoto(photos[next]); setLightboxIndex(next); }
  }

  function handleJoinChange(e) {
    var n = e.target.name; var v = e.target.value;
    setJoinForm(function(p) { return Object.assign({}, p, { [n]: v }); });
  }

  async function handleJoinSubmit(e) {
    e.preventDefault();
    setJoinError(null);
    setJoinLoading(true);
    try {
      var { error: err } = await supabase.from('contact_inquiries').insert([{
        organization_id: organization.id,
        name: joinForm.name.trim(),
        email: joinForm.email.trim(),
        message: joinForm.message.trim(),
        created_at: new Date().toISOString(),
      }]);
      if (err) throw err;
      setJoinSuccess(true);
      setJoinForm({ name: '', email: '', message: '' });
    } catch (err) {
      setJoinError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setJoinLoading(false);
    }
  }

  if (loading) return <PublicPageSkeleton />;

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">This organization doesn't exist or has been removed.</p>
          <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  var themeVars = getThemeVars(organization);
  var navLinks  = getNavLinks(organization);
  var template  = (organization.settings && organization.settings.template) || 'classic';
  var sections  = Object.assign(
    { about: true, events: true, announcements: true, photos: true, members: false, contact: true, join: true },
    organization.page_sections || {}
  );

  var joinProps = {
    joinForm: joinForm, joinLoading: joinLoading, joinError: joinError, joinSuccess: joinSuccess,
    onChange: handleJoinChange, onSubmit: handleJoinSubmit,
    onReset: function() { setJoinSuccess(false); },
  };

  var templateProps = { org: organization, events, announcements, photos, sections, joinProps, openLightbox, navLinks, themeVars };

  return (
    <>
      {template === 'classic'  && <ClassicTemplate  {...templateProps} />}
      {template === 'modern'   && <ModernTemplate   {...templateProps} />}
      {template === 'banner'   && <BannerTemplate   {...templateProps} />}
      {template === 'sidebar'  && <SidebarTemplate  {...templateProps} />}
      {template === 'featured' && <FeaturedTemplate {...templateProps} />}
      {template !== 'classic' && template !== 'modern' && template !== 'banner' && template !== 'sidebar' && template !== 'featured' && <ClassicTemplate {...templateProps} />}

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo lightbox" onClick={closeLightbox}>
          <div className="relative max-w-4xl w-full" onClick={function(e) { e.stopPropagation(); }}>
            <button onClick={closeLightbox} className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1" aria-label="Close photo lightbox">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={lightboxPhoto.photo_url} alt={lightboxPhoto.caption || ('Photo ' + (lightboxIndex + 1) + ' from ' + organization.name)} className="w-full object-contain rounded-lg" style={{ maxHeight: '75vh' }} />
            {lightboxPhoto.caption && <p className="text-white text-center mt-4 text-sm">{lightboxPhoto.caption}</p>}
            <div className="flex justify-between items-center mt-4">
              <button onClick={function() { navigateLightbox(-1); }} disabled={lightboxIndex === 0} className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Previous photo">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <p className="text-gray-400 text-sm" aria-live="polite">{lightboxIndex + 1} / {photos.length}</p>
              <button onClick={function() { navigateLightbox(1); }} disabled={lightboxIndex === photos.length - 1} className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next photo">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}