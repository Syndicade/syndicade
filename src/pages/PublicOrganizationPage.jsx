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

  // Join Us form state
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

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', org.id)
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      setEvents(eventsData || []);

      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setAnnouncements(announcementsData || []);

      const { data: photosData } = await supabase
        .from('org_photos')
        .select('*')
        .eq('organization_id', org.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      setPhotos(photosData || []);

    } catch (err) {
      console.error('Error:', err);
      setError('Organization not found');
    } finally {
      setLoading(false);
    }
  }

  // Lightbox keyboard navigation
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
          <p className="text-6xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-600 mb-6">This organization doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
                &#128273; Member Login
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
            <h2 id="about-heading" className="text-2xl font-bold text-gray-900 mb-4">
              About Us
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {organization.description}
            </p>
          </section>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <section className="mb-12" aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="text-2xl font-bold text-gray-900 mb-6">
              &#128247; Photo Gallery
            </h2>
            <div
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
              role="list"
              aria-label="Organization photo gallery"
            >
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
            <h2 id="events-heading" className="text-2xl font-bold text-gray-900 mb-6">
              &#128197; Upcoming Events
            </h2>
            <div className="space-y-4">
              {events.map(event => (
                <div
                  key={event.id}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-blue-600 font-medium mb-2">
                    {new Date(event.start_time).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long',
                      day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {event.location && (
                    <p className="text-gray-600">&#128205; {event.location}</p>
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
            <h2 id="announcements-heading" className="text-2xl font-bold text-gray-900 mb-6">
              &#128226; Latest News
            </h2>
            <div className="space-y-4">
              {announcements.map(announcement => (
                <div
                  key={announcement.id}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{announcement.title}</h3>
                  <p className="text-gray-500 text-sm mb-3">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700">{announcement.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

{/* Contact Info */}
        {(organization.contact_email || organization.contact_phone || organization.address) && (
          <section className="mb-12" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="text-2xl font-bold text-gray-900 mb-6">
              Contact Us
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-3">
{organization.contact_email && (
                <p className="text-gray-700"><a
                  
                    href={'mailto:' + organization.contact_email}
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {organization.contact_email}
                  </a>
                </p>
              )}
              {organization.contact_phone && (
                <p className="text-gray-700"><a
                  
                    href={'tel:' + organization.contact_phone}
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {'📞 ' + organization.contact_phone}
                  </a>
                </p>
              )}
              {organization.address && (
                <p className="text-gray-700">
                  {'📍 ' + organization.address}
                  {organization.city && ', ' + organization.city}
                  {organization.state && ', ' + organization.state}
                  {organization.zip_code && ' ' + organization.zip_code}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Join Us Form */}
        <section
          className="mb-12 bg-blue-50 border border-blue-200 rounded-xl p-8"
          aria-labelledby="join-heading"
        >
          <h2 id="join-heading" className="text-2xl font-bold text-gray-900 mb-2">
            &#128587; Join Us
          </h2>
          <p className="text-gray-600 mb-6">
            Interested in getting involved? Send us a message and we'll be in touch.
          </p>

          {joinSuccess ? (
            <div
              className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
              role="status"
              aria-live="polite"
            >
              <p className="text-4xl mb-3">&#127881;</p>
              <p className="text-green-800 font-bold text-lg">Message sent!</p>
              <p className="text-green-700 mt-1">
                Thanks for reaching out. {organization.name} will get back to you soon.
              </p>
              <button
                onClick={() => setJoinSuccess(false)}
                className="mt-4 px-4 py-2 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleJoinSubmit}
              noValidate
              aria-label={'Contact form for ' + organization.name}
            >
              {joinError && (
                <div
                  className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="text-red-700">{joinError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="join-name"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Your Name *
                  </label>
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
                  <label
                    htmlFor="join-email"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Email Address *
                  </label>
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
                <label
                  htmlFor="join-message"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Message *
                </label>
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
                <p className="text-sm text-gray-500 mt-1" aria-live="polite">
                  {joinForm.message.length}/1000 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={joinLoading || !joinForm.name.trim() || !joinForm.email.trim() || !joinForm.message.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                aria-label={joinLoading ? 'Sending your message, please wait' : 'Send message'}
              >
                {joinLoading ? (
                  <>
                    <div
                      className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                      aria-hidden="true"
                    ></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">&#9993;</span>
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer
        className="bg-gray-900 text-white py-8 px-6 text-center"
        role="contentinfo"
      >
        <p className="text-gray-400">
          Powered by{' '}
          <span className="text-white font-bold">Syndicade</span>
          {' '}— Building stronger communities
        </p>
        <Link
          to="/login"
          className="inline-block mt-4 text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          Member Login &#8594;
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
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
              aria-label="Close photo lightbox"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={lightboxPhoto.photo_url}
              alt={lightboxPhoto.caption || ('Photo ' + (lightboxIndex + 1) + ' from ' + organization.name)}
              className="w-full max-h-screen-3/4 object-contain rounded-lg"
              style={{ maxHeight: '75vh' }}
            />

            {/* Caption */}
            {lightboxPhoto.caption && (
              <p className="text-white text-center mt-4 text-sm">{lightboxPhoto.caption}</p>
            )}

            {/* Navigation */}
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

              <p className="text-gray-400 text-sm" aria-live="polite">
                {lightboxIndex + 1} / {photos.length}
              </p>

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