import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PublicOrganizationPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [joinForm, setJoinForm] = useState({ name: '', email: '', message: '' });
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, [slug]);

  async function fetchOrganization() {
    try {
      setLoading(true);

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (orgError) throw orgError;
      setOrganization(org);

      const [eventsResult, announcementsResult, photosResult] = await Promise.allSettled([
        supabase
          .from('events')
          .select('*')
          .eq('organization_id', org.id)
          .eq('visibility', 'public')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(3),
        supabase
          .from('announcements')
          .select('*')
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('org_photos')
          .select('*')
          .eq('organization_id', org.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
      ]);

      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value.data || []);
      if (announcementsResult.status === 'fulfilled') setAnnouncements(announcementsResult.value.data || []);
      if (photosResult.status === 'fulfilled') setPhotos(photosResult.value.data || []);

    } catch (err) {
      console.error('Error:', err);
      setError('Organization not found');
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = useCallback((e) => {
    if (!lightboxPhoto) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
  }, [lightboxPhoto, lightboxIndex, photos]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function openLightbox(photo, index) {
    setLightboxPhoto(photo);
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    setLightboxPhoto(null);
    setLightboxIndex(null);
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    const newIndex = lightboxIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setLightboxPhoto(photos[newIndex]);
      setLightboxIndex(newIndex);
    }
  }

  const handleJoinChange = (e) => {
    const { name, value } = e.target;
    setJoinForm(prev => ({ ...prev, [name]: value }));
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setJoinError(null);
    setJoinLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('contact_inquiries')
        .insert([{
          organization_id: organization.id,
          name: joinForm.name.trim(),
          email: joinForm.email.trim(),
          message: joinForm.message.trim(),
          created_at: new Date().toISOString()
        }]);
      if (insertError) throw insertError;
      setJoinSuccess(true);
      setJoinForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Error submitting form:', err);
      setJoinError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"
          role="status"
          aria-label="Loading organization"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-600 mb-6">This organization doesn't exist or has been removed.</p>
          <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Header */}
      <header
        className="relative text-white py-16 px-6"
        role="banner"
        style={{
          background: organization.banner_url
            ? 'none'
            : 'linear-gradient(to right, #2563eb, #4338ca)',
        }}
      >
        {organization.banner_url && (
          <div
            className="absolute inset-0 z-0"
            aria-hidden="true"
            style={{
              backgroundImage: 'url(' + organization.banner_url + ')',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
        )}
        <div className="relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {organization.logo_url && (
              <img
                src={organization.logo_url}
                alt={organization.name + ' logo'}
                className="h-24 w-24 object-contain bg-white rounded-full mx-auto mb-6 p-2"
              />
            )}
            <h1 className="text-4xl font-bold mb-3">{organization.name}</h1>
            {organization.tagline && (
              <p className="text-xl text-blue-100 mb-4">{organization.tagline}</p>
            )}
            <p className="text-blue-100 capitalize">{organization.type}</p>
            <div className="mt-8">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all shadow-lg text-lg"
                aria-label="Member login portal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Member Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12" role="main">

        {/* About Section */}
        {organization.description && (
          <section className="mb-12" aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-2xl font-bold text-gray-900 mb-4">About Us</h2>
            <p className="text-lg text-gray-700 leading-relaxed">{organization.description}</p>
          </section>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <section className="mb-12" aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photo Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3" role="list" aria-label="Organization photo gallery">
              {photos.map((photo, index) => (
                <div key={photo.id} role="listitem">
                  <button
                    onClick={() => openLightbox(photo, index)}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg overflow-hidden group"
                    aria-label={'View photo' + (photo.caption ? ': ' + photo.caption : ' ' + (index + 1))}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || ('Photo ' + (index + 1) + ' from ' + organization.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section className="mb-12" aria-labelledby="events-heading">
            <h2 id="events-heading" className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-blue-600 font-medium mb-2">
                    {new Date(event.start_time).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long',
                      day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {event.location && (
                    <p className="text-gray-600 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-gray-700 mt-3">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <section className="mb-12" aria-labelledby="announcements-heading">
            <h2 id="announcements-heading" className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Latest News
            </h2>
            <div className="space-y-4">
              {announcements.map(announcement => (
                <div key={announcement.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{announcement.title}</h3>
                  <p className="text-gray-500 text-sm mb-3">{new Date(announcement.created_at).toLocaleDateString()}</p>
                  <p className="text-gray-700">{announcement.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact Info */}
        {(organization.contact_email || organization.contact_phone || organization.address) && (
          <section className="mb-12" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-3">
{organization.contact_email && (
                <p className="text-gray-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a
                    href={'mailto:' + organization.contact_email}
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {organization.contact_email}
                  </a>
                </p>
              )}
              {organization.contact_phone && (
                <p className="text-gray-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href={'tel:' + organization.contact_phone}
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {organization.contact_phone}
                  </a>
                </p>
              )}
              {organization.address && (
                <p className="text-gray-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {organization.address}
                  {organization.city && ', ' + organization.city}
                  {organization.state && ', ' + organization.state}
                  {organization.zip_code && ' ' + organization.zip_code}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Join Us Form */}
        <section className="mb-12 bg-blue-50 border border-blue-200 rounded-xl p-8" aria-labelledby="join-heading">
          <h2 id="join-heading" className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Join Us
          </h2>
          <p className="text-gray-600 mb-6">Interested in getting involved? Send us a message and we'll be in touch.</p>

          {joinSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center" role="status" aria-live="polite">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-bold text-lg">Message sent!</p>
              <p className="text-green-700 mt-1">Thanks for reaching out. {organization.name} will get back to you soon.</p>
              <button
                onClick={() => setJoinSuccess(false)}
                className="mt-4 px-4 py-2 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} noValidate aria-label={'Contact form for ' + organization.name}>
              {joinError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert" aria-live="assertive">
                  <p className="text-red-700">{joinError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="join-name" className="block text-sm font-semibold text-gray-900 mb-2">Your Name *</label>
                  <input
                    id="join-name"
                    name="name"
                    type="text"
                    required
                    value={joinForm.name}
                    onChange={handleJoinChange}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-required="true"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label htmlFor="join-email" className="block text-sm font-semibold text-gray-900 mb-2">Email Address *</label>
                  <input
                    id="join-email"
                    name="email"
                    type="email"
                    required
                    value={joinForm.email}
                    onChange={handleJoinChange}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-required="true"
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="join-message" className="block text-sm font-semibold text-gray-900 mb-2">Message *</label>
                <textarea
                  id="join-message"
                  name="message"
                  required
                  value={joinForm.message}
                  onChange={handleJoinChange}
                  placeholder="Tell us a bit about yourself and why you'd like to get involved..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  aria-required="true"
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 mt-1" aria-live="polite">{joinForm.message.length}/1000 characters</p>
              </div>
              <button
                type="submit"
                disabled={joinLoading || !joinForm.name.trim() || !joinForm.email.trim() || !joinForm.message.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                aria-label={joinLoading ? 'Sending your message, please wait' : 'Send message'}
              >
                {joinLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6 text-center" role="contentinfo">
        <p className="text-gray-400">
          Powered by <span className="text-white font-bold">Syndicade</span> — Building stronger communities
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 mt-4 text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          Member Login
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </footer>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
              aria-label="Close photo lightbox"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxPhoto.photo_url}
              alt={lightboxPhoto.caption || ('Photo ' + (lightboxIndex + 1) + ' from ' + organization.name)}
              className="w-full object-contain rounded-lg"
              style={{ maxHeight: '75vh' }}
            />
            {lightboxPhoto.caption && (
              <p className="text-white text-center mt-4 text-sm">{lightboxPhoto.caption}</p>
            )}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => navigateLightbox(-1)}
                disabled={lightboxIndex === 0}
                className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="text-gray-400 text-sm" aria-live="polite">{lightboxIndex + 1} / {photos.length}</p>
              <button
                onClick={() => navigateLightbox(1)}
                disabled={lightboxIndex === photos.length - 1}
                className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}