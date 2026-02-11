import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PublicOrganizationPage() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      // Fetch upcoming public events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organization_id', org.id)
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      setEvents(eventsData || []);

      // Fetch public announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setAnnouncements(announcementsData || []);

    } catch (err) {
      console.error('Error:', err);
      setError('Organization not found');
    } finally {
      setLoading(false);
    }
  }

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
        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-6"
        role="banner"
      >
        <div className="max-w-4xl mx-auto text-center">
          {organization.logo_url && (
            <img
              src={organization.logo_url}
              alt={`${organization.name} logo`}
              className="h-24 w-24 object-contain bg-white rounded-full mx-auto mb-6 p-2"
            />
          )}
          <h1 className="text-4xl font-bold mb-3">{organization.name}</h1>
          {organization.tagline && (
            <p className="text-xl text-blue-100 mb-4">{organization.tagline}</p>
          )}
          <p className="text-blue-100 capitalize">{organization.type}</p>

          {/* Member Login Button */}
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all shadow-lg text-lg"
              aria-label="Member login portal"
            >
              🔑 Member Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12" role="main">

        {/* About Section */}
        {organization.description && (
          <section className="mb-12" aria-labelledby="about-heading">
            <h2 
              id="about-heading"
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              About Us
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              {organization.description}
            </p>
          </section>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section className="mb-12" aria-labelledby="events-heading">
            <h2 
              id="events-heading"
              className="text-2xl font-bold text-gray-900 mb-6"
            >
              📅 Upcoming Events
            </h2>
            <div className="space-y-4">
              {events.map(event => (
                <div 
                  key={event.id}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-blue-600 font-medium mb-2">
                    📅 {new Date(event.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {event.location && (
                    <p className="text-gray-600">📍 {event.location}</p>
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
            <h2 
              id="announcements-heading"
              className="text-2xl font-bold text-gray-900 mb-6"
            >
              📢 Latest News
            </h2>
            <div className="space-y-4">
              {announcements.map(announcement => (
                <div 
                  key={announcement.id}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700">{announcement.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact Section */}
        {(organization.contact_email || organization.contact_phone || organization.address) && (
          <section className="mb-12" aria-labelledby="contact-heading">
            <h2 
              id="contact-heading"
              className="text-2xl font-bold text-gray-900 mb-6"
            >
              📬 Contact Us
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-3">
              {organization.contact_email && (
                <p className="text-gray-700">
                  ✉️{' '}
                  <a 
                    href={`mailto:${organization.contact_email}`}
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {organization.contact_email}
                  </a>
                </p>
              )}
              {organization.contact_phone && (
                <p className="text-gray-700">
                  📞{' '}
                  <a 
                    href={`tel:${organization.contact_phone}`}
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {organization.contact_phone}
                  </a>
                </p>
              )}
              {organization.address && (
                <p className="text-gray-700">
                  📍 {organization.address}
                  {organization.city && `, ${organization.city}`}
                  {organization.state && `, ${organization.state}`}
                  {organization.zip_code && ` ${organization.zip_code}`}
                </p>
              )}
            </div>
          </section>
        )}

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
          Member Login →
        </Link>
      </footer>

    </div>
  );
}