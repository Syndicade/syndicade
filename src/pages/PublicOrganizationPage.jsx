import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ─── Shared: Nav ──────────────────────────────────────────────────
function OrgNav({ org }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20" role="navigation" aria-label="Organization navigation">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name + ' logo'} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <span className="text-white text-xs font-bold">{org.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="font-bold text-gray-900 truncate">{org.name}</span>
        </div>
        <div className="hidden md:flex items-center gap-5">
          {['Home', 'About', 'Events', 'News', 'Documents'].map(function(link) {
            return (
              <a key={link} href={'#' + link.toLowerCase()} className="text-sm text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors">
                {link}
              </a>
            );
          })}
        </div>
        <Link
          to="/login"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex-shrink-0"
          aria-label="Member login portal"
        >
          Member Login
        </Link>
      </div>
    </nav>
  );
}

// ─── Shared: Footer ───────────────────────────────────────────────
function OrgFooter({ org }) {
  return (
    <footer className="bg-gray-900 text-white py-10 px-6" role="contentinfo">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <p className="font-bold text-white text-lg">{org.name}</p>
          <p className="text-gray-400 text-sm mt-1">
            Powered by <span className="text-white font-semibold">Syndicade</span>
          </p>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          {['Home', 'Events', 'News', 'Documents', 'Contact'].map(function(link) {
            return (
              <a key={link} href={'#' + link.toLowerCase()} className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 rounded transition-colors">
                {link}
              </a>
            );
          })}
        </div>
        <Link
          to="/login"
          className="text-blue-400 hover:text-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 rounded flex-shrink-0"
        >
          Member Login
        </Link>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-xs">{'Copyright ' + new Date().getFullYear() + ' ' + org.name + '. All rights reserved.'}</p>
      </div>
    </footer>
  );
}

// ─── Shared: Event card ───────────────────────────────────────────
function EventCardCompact({ event }) {
  var date = new Date(event.start_time);
  var month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  var day = date.getDate();
  return (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white" aria-hidden="true">
        <span className="text-xs font-bold leading-none">{month}</span>
        <span className="text-lg font-bold leading-none">{day}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{event.title}</p>
        {event.location && <p className="text-gray-500 text-xs mt-0.5 truncate">{event.location}</p>}
        <p className="text-gray-400 text-xs mt-0.5">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}

// ─── Shared: Announcement card ────────────────────────────────────
function AnnouncementCardCompact({ announcement }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="font-semibold text-gray-900 text-sm">{announcement.title}</p>
      <p className="text-gray-400 text-xs mt-0.5">{new Date(announcement.created_at).toLocaleDateString()}</p>
      {announcement.content && (
        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{announcement.content}</p>
      )}
    </div>
  );
}

// ─── Shared: Contact block ────────────────────────────────────────
function ContactBlock({ org, compact }) {
  if (!org.contact_email && !org.contact_phone && !org.address) return null;
  var wrapClass = compact ? 'space-y-2' : 'bg-gray-50 rounded-lg p-5 border border-gray-200 space-y-3';
  return (
    <div className={wrapClass}>
      {org.contact_email && (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a href={'mailto:' + org.contact_email} className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{org.contact_email}</a>
        </p>
      )}
      {org.contact_phone && (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a href={'tel:' + org.contact_phone} className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">{org.contact_phone}</a>
        </p>
      )}
      {org.address && (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{org.address}{org.city ? ', ' + org.city : ''}{org.state ? ', ' + org.state : ''}{org.zip_code ? ' ' + org.zip_code : ''}</span>
        </p>
      )}
    </div>
  );
}

// ─── Shared: Join form ────────────────────────────────────────────
function JoinFormSection({ org, joinForm, joinLoading, joinError, joinSuccess, onChange, onSubmit, onReset }) {
  return (
    <section id="join" aria-labelledby="join-heading">
      <h2 id="join-heading" className="text-xl font-bold text-gray-900 mb-1">Join Us</h2>
      <p className="text-gray-500 text-sm mb-5">Interested in getting involved? Send us a message.</p>
      {joinSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center" role="status" aria-live="polite">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-800 font-bold">Message sent!</p>
          <p className="text-green-700 text-sm mt-1">{org.name} will get back to you soon.</p>
          <button onClick={onReset} className="mt-3 px-4 py-2 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate aria-label={'Contact form for ' + org.name} className="space-y-4">
          {joinError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3" role="alert" aria-live="assertive">
              <p className="text-red-700 text-sm">{joinError}</p>
            </div>
          )}
          <div>
            <label htmlFor="join-name" className="block text-sm font-semibold text-gray-900 mb-1">Your Name *</label>
            <input id="join-name" name="name" type="text" required aria-required="true" value={joinForm.name} onChange={onChange} placeholder="Jane Smith" maxLength={100} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>
          <div>
            <label htmlFor="join-email" className="block text-sm font-semibold text-gray-900 mb-1">Email *</label>
            <input id="join-email" name="email" type="email" required aria-required="true" value={joinForm.email} onChange={onChange} placeholder="jane@example.com" maxLength={200} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>
          <div>
            <label htmlFor="join-message" className="block text-sm font-semibold text-gray-900 mb-1">Message *</label>
            <textarea id="join-message" name="message" required aria-required="true" value={joinForm.message} onChange={onChange} placeholder="Tell us about yourself..." rows={3} maxLength={1000} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm" />
            <p className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{joinForm.message.length}/1000</p>
          </div>
          <button
            type="submit"
            disabled={joinLoading || !joinForm.name.trim() || !joinForm.email.trim() || !joinForm.message.trim()}
            className="w-full px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            aria-label={joinLoading ? 'Sending message' : 'Send message'}
          >
            {joinLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                Sending...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Message
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
}

// ─── Shared: Photo gallery ────────────────────────────────────────
function PhotoGallerySection({ photos, openLightbox, orgName }) {
  if (!photos || !photos.length) return null;
  return (
    <section id="gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="text-xl font-bold text-gray-900 mb-4">Photo Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2" role="list" aria-label="Organization photo gallery">
        {photos.slice(0, 6).map(function(photo, index) {
          return (
            <div key={photo.id} role="listitem">
              <button
                onClick={() => openLightbox(photo, index)}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg overflow-hidden group"
                aria-label={'View photo' + (photo.caption ? ': ' + photo.caption : ' ' + (index + 1))}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img src={photo.photo_url} alt={photo.caption || ('Photo ' + (index + 1) + ' from ' + orgName)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Template 1: Classic ──────────────────────────────────────────
function ClassicTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox }) {
  return (
    <div className="min-h-screen bg-white">
      <OrgNav org={org} />

      <section id="home" className="bg-gray-50 border-b border-gray-200 py-16 px-6" aria-labelledby="classic-heading">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 id="classic-heading" className="text-4xl font-bold text-gray-900 mb-3">{org.name}</h1>
            <p className="text-lg text-gray-600 mb-6">{org.tagline || org.description || 'Welcome to our organization.'}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link to="/login" className="px-5 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all">
                Start Now
              </Link>
              <a href="#about" className="px-5 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all">
                See How It Works
              </a>
            </div>
          </div>
          {org.banner_url ? (
            <div className="flex-shrink-0 w-full md:w-72 h-48 rounded-xl overflow-hidden shadow-md">
              <img src={org.banner_url} alt={org.name + ' banner'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-full md:w-72 h-48 bg-gray-200 rounded-xl flex items-center justify-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-12" role="main">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.events && (
            <section id="events" aria-labelledby="classic-events-heading">
              <h2 id="classic-events-heading" className="text-xl font-bold text-gray-900 mb-5">Upcoming Events</h2>
              {events.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {events.map(function(event) { return <EventCardCompact key={event.id} event={event} />; })}
                  </div>
                  <a href="#events" className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mt-3">
                    View All Events
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </a>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No upcoming events at this time.</p>
              )}
            </section>
          )}

          <div className="space-y-8">
            {sections.about && org.description && (
              <section id="about" aria-labelledby="classic-about-heading">
                <h2 id="classic-about-heading" className="text-xl font-bold text-gray-900 mb-3">Further Down the Page</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{org.description}</p>
              </section>
            )}
            {sections.announcements && announcements.length > 0 && (
              <section id="news" aria-labelledby="classic-news-heading">
                <h2 id="classic-news-heading" className="text-xl font-bold text-gray-900 mb-3">Latest News</h2>
                <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div>
              </section>
            )}
            {sections.contact && <ContactBlock org={org} />}
          </div>
        </div>

        {sections.photos && photos.length > 0 && (
          <div className="mt-12">
            <PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} />
          </div>
        )}

        {sections.join && (
          <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-8">
            <JoinFormSection org={org} {...joinProps} />
          </div>
        )}
      </main>
      <OrgFooter org={org} />
    </div>
  );
}

// ─── Template 2: Modern ───────────────────────────────────────────
function ModernTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox }) {
  return (
    <div className="min-h-screen bg-white">
      <OrgNav org={org} />

      <section id="home" className="py-16 px-6 border-b border-gray-100" aria-labelledby="modern-heading">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-10">
          <div className="flex-1">
            <h1 id="modern-heading" className="text-4xl font-bold text-gray-900 mb-3">{'Welcome to ' + org.name}</h1>
            <p className="text-lg text-gray-500 mb-6">{org.tagline || 'Unified platform for nonprofits & community groups.'}</p>
            <Link to="/login" className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all">
              Member Portal
            </Link>
          </div>
          {org.banner_url ? (
            <div className="flex-shrink-0 w-full md:w-72 h-44 rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <img src={org.banner_url} alt={org.name + ' banner'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-full md:w-64 space-y-2 pt-2" aria-hidden="true">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-12" role="main">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.events && (
            <section id="events" aria-labelledby="modern-events-heading">
              <h2 id="modern-events-heading" className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Upcoming Events</h2>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map(function(event) { return <EventCardCompact key={event.id} event={event} />; })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No upcoming events.</p>
              )}
            </section>
          )}

          <section id="about" aria-labelledby="modern-pages-heading">
            <h2 id="modern-pages-heading" className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Pages / Folders</h2>
            {sections.about && org.description ? (
              <p className="text-gray-600 text-sm leading-relaxed">{org.description}</p>
            ) : (
              <div className="space-y-2">
                {['Updates', 'Event Recaps', 'News Articles'].map(function(item) {
                  return (
                    <div key={item} className="flex items-center gap-2 py-2 border-b border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">{item}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {sections.announcements && (
            <section id="news" aria-labelledby="modern-news-heading">
              <h2 id="modern-news-heading" className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Recent News</h2>
              {announcements.length > 0 ? (
                <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div>
              ) : (
                <p className="text-gray-400 text-sm">No recent news.</p>
              )}
            </section>
          )}
        </div>

        {sections.photos && photos.length > 0 && (
          <div className="mt-12">
            <PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} />
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.contact && (
            <section id="contact" aria-labelledby="modern-contact-heading">
              <h2 id="modern-contact-heading" className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <ContactBlock org={org} />
            </section>
          )}
          {sections.join && <JoinFormSection org={org} {...joinProps} />}
        </div>
      </main>
      <OrgFooter org={org} />
    </div>
  );
}

// ─── Template 3: Banner ───────────────────────────────────────────
function BannerTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox }) {
  return (
    <div className="min-h-screen bg-white">
      <OrgNav org={org} />

      <header id="home" className="relative overflow-hidden" role="banner" style={{ minHeight: '240px' }}>
        {org.banner_url ? (
          <div className="absolute inset-0" aria-hidden="true" style={{ backgroundImage: 'url(' + org.banner_url + ')', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-black bg-opacity-45"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-800" aria-hidden="true"></div>
        )}
        <div className="relative z-10 flex items-center justify-center py-16 px-6 text-center">
          <div>
            {org.logo_url && (
              <img src={org.logo_url} alt={org.name + ' logo'} className="w-16 h-16 rounded-full object-cover border-2 border-white mx-auto mb-4" />
            )}
            <h1 className="text-4xl font-bold text-white mb-2">{org.name}</h1>
            {org.tagline && <p className="text-blue-100 text-lg mt-1">{org.tagline}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12" role="main">
        {sections.about && org.description && (
          <section id="about" className="mb-10 text-center" aria-labelledby="banner-about-heading">
            <p id="banner-about-heading" className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">{org.description}</p>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.events && (
            <section id="events" aria-labelledby="banner-events-heading">
              <h2 id="banner-events-heading" className="text-xl font-bold text-gray-900 mb-5">Upcoming Events</h2>
              {events.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {events.map(function(event) { return <EventCardCompact key={event.id} event={event} />; })}
                  </div>
                  <a href="#events" className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mt-3">
                    View All Events
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </a>
                </>
              ) : (
                <p className="text-gray-400 text-sm">No upcoming events.</p>
              )}
            </section>
          )}

          {sections.announcements && (
            <section id="news" aria-labelledby="banner-news-heading">
              <h2 id="banner-news-heading" className="text-xl font-bold text-gray-900 mb-5">Recent News</h2>
              {announcements.length > 0 ? (
                <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div>
              ) : (
                <p className="text-gray-400 text-sm">No recent news.</p>
              )}
            </section>
          )}
        </div>

        {sections.photos && photos.length > 0 && (
          <div className="mt-12">
            <PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} />
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.contact && (
            <section id="contact" aria-labelledby="banner-contact-heading">
              <h2 id="banner-contact-heading" className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <ContactBlock org={org} />
            </section>
          )}
          {sections.join && <JoinFormSection org={org} {...joinProps} />}
        </div>
      </main>
      <OrgFooter org={org} />
    </div>
  );
}

// ─── Template 4: Sidebar ──────────────────────────────────────────
function SidebarTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox }) {
  var [sidebarOpen, setSidebarOpen] = useState(false);
  var sidebarLinks = ['Home', 'About', 'Events', 'News', 'Documents', 'Member Directory', 'Contact'];

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20" role="navigation" aria-label="Organization navigation">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 md:hidden"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />}
            <span className="font-bold text-gray-900 truncate">{org.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-5">
            {['Home', 'About', 'Events', 'News'].map(function(link) {
              return <a key={link} href={'#' + link.toLowerCase()} className="text-sm text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors">{link}</a>;
            })}
          </div>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex-shrink-0">
            Member Login
          </Link>
        </div>
      </nav>

      <div className="flex min-h-screen">
        <aside className={'flex-shrink-0 bg-gray-50 border-r border-gray-200 pt-6 ' + (sidebarOpen ? 'w-52 block' : 'hidden md:block md:w-52')} aria-label="Side navigation">
          <nav>
            <ul className="space-y-0.5 px-3" role="list">
              {sidebarLinks.map(function(link) {
                return (
                  <li key={link}>
                    <a href={'#' + link.toLowerCase().replace(' ', '-')} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                      {link}
                    </a>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 px-4">
              <Link to="/login" className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                Member Login
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 px-8 py-10" role="main">
          <section id="home" className="mb-10" aria-labelledby="sidebar-heading">
            <h1 id="sidebar-heading" className="text-3xl font-bold text-gray-900 mb-2">{'Welcome to ' + org.name}</h1>
            <p className="text-gray-500 mb-5">{org.tagline || 'Unified platform for nonprofits & community groups.'}</p>
            <Link to="/login" className="px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all">
              Member Portal
            </Link>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {sections.events && (
              <section id="events" aria-labelledby="sidebar-events-heading">
                <h2 id="sidebar-events-heading" className="text-lg font-bold text-gray-900 mb-4">Upcoming Events</h2>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map(function(event) { return <EventCardCompact key={event.id} event={event} />; })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No upcoming events.</p>
                )}
              </section>
            )}

            <div className="space-y-8">
              {sections.announcements && (
                <section id="news" aria-labelledby="sidebar-news-heading">
                  <h2 id="sidebar-news-heading" className="text-lg font-bold text-gray-900 mb-4">Recent News</h2>
                  {announcements.length > 0 ? (
                    <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div>
                  ) : (
                    <p className="text-gray-400 text-sm">No recent news.</p>
                  )}
                </section>
              )}

              {sections.members && (
                <section id="member-directory" aria-labelledby="sidebar-members-heading">
                  <h2 id="sidebar-members-heading" className="text-lg font-bold text-gray-900 mb-3">Member Directory</h2>
                  <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View Members
                  </Link>
                </section>
              )}

              {sections.contact && (
                <section id="contact" aria-labelledby="sidebar-contact-heading">
                  <h2 id="sidebar-contact-heading" className="text-lg font-bold text-gray-900 mb-3">Contact Information</h2>
                  <ContactBlock org={org} compact={true} />
                </section>
              )}
            </div>
          </div>

          {sections.photos && photos.length > 0 && (
            <div className="mt-10">
              <PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} />
            </div>
          )}

          {sections.join && (
            <div className="mt-10 bg-blue-50 border border-blue-100 rounded-xl p-6">
              <JoinFormSection org={org} {...joinProps} />
            </div>
          )}
        </main>
      </div>
      <OrgFooter org={org} />
    </div>
  );
}

// ─── Template 5: Featured ─────────────────────────────────────────
function FeaturedTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox }) {
  return (
    <div className="min-h-screen bg-white">
      <OrgNav org={org} />

      <section id="home" className="py-16 px-6 text-center border-b border-gray-100" aria-labelledby="featured-heading">
        <div className="max-w-2xl mx-auto">
          {org.logo_url && (
            <img src={org.logo_url} alt={org.name + ' logo'} className="w-16 h-16 rounded-full object-cover mx-auto mb-5 border-2 border-gray-100 shadow-sm" />
          )}
          <h1 id="featured-heading" className="text-4xl font-bold text-gray-900 mb-3">{'Welcome to ' + org.name}</h1>
          <p className="text-lg text-gray-500 mb-7">{org.tagline || 'Unified platform for nonprofits & groups.'}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/login" className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all">
              Member Portal
            </Link>
            <a href="#about" className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-12" role="main">
        {sections.about && org.description && (
          <section id="about" className="mb-10" aria-labelledby="featured-about-heading">
            <h2 id="featured-about-heading" className="text-xl font-bold text-gray-900 mb-3">About Us</h2>
            <p className="text-gray-600 leading-relaxed">{org.description}</p>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          {sections.events && (
            <section id="events" aria-labelledby="featured-events-heading">
              <h2 id="featured-events-heading" className="text-xl font-bold text-gray-900 mb-5">Upcoming Events</h2>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map(function(event) { return <EventCardCompact key={event.id} event={event} />; })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No upcoming events.</p>
              )}
            </section>
          )}

          <div className="space-y-6">
            {sections.members && (
              <section aria-labelledby="featured-connect-heading">
                <h2 id="featured-connect-heading" className="text-xl font-bold text-gray-900 mb-4">Connect with Us</h2>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{org.name} Members</p>
                    <p className="text-gray-500 text-xs">Login to view the full member directory</p>
                  </div>
                  <Link to="/login" className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 flex-shrink-0 transition-all">
                    View Members
                  </Link>
                </div>
              </section>
            )}

            {sections.contact && (
              <section id="contact" aria-labelledby="featured-contact-heading">
                <h2 id="featured-contact-heading" className="text-lg font-bold text-gray-900 mb-3">Contact Information</h2>
                <ContactBlock org={org} compact={true} />
              </section>
            )}
          </div>
        </div>

        {sections.announcements && announcements.length > 0 && (
          <section id="news" className="mb-12" aria-labelledby="featured-news-heading">
            <h2 id="featured-news-heading" className="text-xl font-bold text-gray-900 mb-5">Latest News</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {announcements.map(function(a) {
                return (
                  <div key={a.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{a.title}</p>
                    <p className="text-gray-400 text-xs mb-2">{new Date(a.created_at).toLocaleDateString()}</p>
                    {a.content && <p className="text-gray-600 text-xs line-clamp-3">{a.content}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {sections.photos && photos.length > 0 && (
          <div className="mb-12">
            <PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} />
          </div>
        )}

        {sections.join && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-8">
            <JoinFormSection org={org} {...joinProps} />
          </div>
        )}
      </main>
      <OrgFooter org={org} />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────
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
      var [eventsResult, announcementsResult, photosResult] = await Promise.allSettled([
        supabase.from('events').select('*').eq('organization_id', org.id).eq('visibility', 'public').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(3),
        supabase.from('announcements').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('org_photos').select('*').eq('organization_id', org.id).order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
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
    var newIndex = lightboxIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setLightboxPhoto(photos[newIndex]);
      setLightboxIndex(newIndex);
    }
  }

  function handleJoinChange(e) {
    var name = e.target.name;
    var value = e.target.value;
    setJoinForm(function(prev) { return Object.assign({}, prev, { [name]: value }); });
  }

  async function handleJoinSubmit(e) {
    e.preventDefault();
    setJoinError(null);
    setJoinLoading(true);
    try {
      var { error: insertError } = await supabase.from('contact_inquiries').insert([{
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
      setJoinError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setJoinLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" role="status" aria-label="Loading organization"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
          <span className="sr-only">Loading organization page</span>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-600 mb-6">This organization doesn't exist or has been removed.</p>
          <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  var template = (organization.settings && organization.settings.template) || 'classic';
  var sections = Object.assign(
    { about: true, events: true, announcements: true, photos: true, members: false, contact: true, join: true },
    organization.page_sections || {}
  );

  var joinProps = {
    joinForm: joinForm,
    joinLoading: joinLoading,
    joinError: joinError,
    joinSuccess: joinSuccess,
    onChange: handleJoinChange,
    onSubmit: handleJoinSubmit,
    onReset: function() { setJoinSuccess(false); },
  };

  var templateProps = {
    org: organization,
    events: events,
    announcements: announcements,
    photos: photos,
    sections: sections,
    joinProps: joinProps,
    openLightbox: openLightbox,
  };

  return (
    <>
      {template === 'classic' && <ClassicTemplate {...templateProps} />}
      {template === 'modern' && <ModernTemplate {...templateProps} />}
      {template === 'banner' && <BannerTemplate {...templateProps} />}
      {template === 'sidebar' && <SidebarTemplate {...templateProps} />}
      {template === 'featured' && <FeaturedTemplate {...templateProps} />}
      {template !== 'classic' && template !== 'modern' && template !== 'banner' && template !== 'sidebar' && template !== 'featured' && <ClassicTemplate {...templateProps} />}

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo lightbox" onClick={closeLightbox}>
          <div className="relative max-w-4xl w-full" onClick={function(e) { e.stopPropagation(); }}>
            <button onClick={closeLightbox} className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1" aria-label="Close photo lightbox">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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