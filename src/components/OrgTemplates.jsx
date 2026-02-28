import { useState } from 'react';
import { Link } from 'react-router-dom';

var FONT_MAP = {
  inter: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono:  "'Fira Code', 'Courier New', Courier, monospace",
};

var RADIUS_MAP = {
  rounded: '8px',
  sharp:   '0px',
  pill:    '9999px',
};

export function getThemeVars(org) {
  var settings = org.settings || {};
  var theme    = settings.theme || {};
  var colors   = theme.customColors || [];
  var raw      = colors[0] || '';
  var valid    = /^#([0-9A-Fa-f]{3}){1,2}$/.test(raw);
  return {
    primaryColor: valid ? raw : '#3B82F6',
    fontFamily:   FONT_MAP[theme.fontPairing] || FONT_MAP.inter,
    btnRadius:    RADIUS_MAP[theme.buttonStyle] || RADIUS_MAP.rounded,
  };
}

export function getNavLinks(org) {
  var settings = org.settings || {};
  var links    = settings.nav_links;
  if (!links || !links.length) {
    return [
      { id: 'home',    label: 'Home',    href: '#home',    visible: true },
      { id: 'about',   label: 'About',   href: '#about',   visible: true },
      { id: 'events',  label: 'Events',  href: '#events',  visible: true },
      { id: 'news',    label: 'News',    href: '#news',    visible: true },
      { id: 'contact', label: 'Contact', href: '#contact', visible: true },
    ];
  }
  return links.filter(function(l) { return l.visible; });
}

// ─── OrgNav ────────────────────────────────────────────────────────
export function OrgNav({ org, navLinks, themeVars }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20" role="navigation" aria-label="Organization navigation">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name + ' logo'} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeVars.primaryColor }} aria-hidden="true">
              <span className="text-white text-xs font-bold">{org.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="font-bold text-gray-900 truncate">{org.name}</span>
        </div>
        <div className="hidden md:flex items-center gap-5" role="list">
          {navLinks.map(function(link) {
            var ext = link.type === 'external';
            return (
              <a key={link.id} href={link.href} target={ext ? '_blank' : undefined} rel={ext ? 'noopener noreferrer' : undefined}
                className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors" role="listitem">
                {link.label}
              </a>
            );
          })}
        </div>
        <Link to="/login"
          className="px-4 py-2 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex-shrink-0"
          style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}
          aria-label="Member login portal">
          Member Login
        </Link>
      </div>
    </nav>
  );
}

// ─── OrgFooter ─────────────────────────────────────────────────────
export function OrgFooter({ org, navLinks }) {
  return (
    <footer className="bg-gray-900 text-white py-10 px-6" role="contentinfo">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <p className="font-bold text-white text-lg">{org.name}</p>
          <p className="text-gray-400 text-sm mt-1">Powered by <span className="text-white font-semibold">Syndicade</span></p>
        </div>
        <div className="flex items-center gap-6 flex-wrap" role="list">
          {navLinks.map(function(link) {
            var ext = link.type === 'external';
            return (
              <a key={link.id} href={link.href} target={ext ? '_blank' : undefined} rel={ext ? 'noopener noreferrer' : undefined}
                className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 rounded transition-colors" role="listitem">
                {link.label}
              </a>
            );
          })}
        </div>
        <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 rounded flex-shrink-0">
          Member Login
        </Link>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-xs">{'Copyright ' + new Date().getFullYear() + ' ' + org.name + '. All rights reserved.'}</p>
      </div>
    </footer>
  );
}

// ─── EventCardCompact ───────────────────────────────────────────────
export function EventCardCompact({ event, themeVars }) {
  var date  = new Date(event.start_time);
  var month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  var day   = date.getDate();
  return (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: themeVars.primaryColor }} aria-hidden="true">
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

// ─── AnnouncementCardCompact ────────────────────────────────────────
export function AnnouncementCardCompact({ announcement }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="font-semibold text-gray-900 text-sm">{announcement.title}</p>
      <p className="text-gray-400 text-xs mt-0.5">{new Date(announcement.created_at).toLocaleDateString()}</p>
      {announcement.content && <p className="text-gray-600 text-sm mt-1 line-clamp-2">{announcement.content}</p>}
    </div>
  );
}

// ─── ContactBlock ───────────────────────────────────────────────────
export function ContactBlock({ org, compact, themeVars }) {
  if (!org.contact_email && !org.contact_phone && !org.address) return null;
  var cls = compact ? 'space-y-2' : 'bg-gray-50 rounded-lg p-5 border border-gray-200 space-y-3';
  return (
    <div className={cls}>
      {org.contact_email && (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <a href={'mailto:' + org.contact_email} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" style={{ color: themeVars.primaryColor }}>{org.contact_email}</a>
        </p>
      )}
      {org.contact_phone && (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          <a href={'tel:' + org.contact_phone} className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" style={{ color: themeVars.primaryColor }}>{org.contact_phone}</a>
        </p>
      )}
      {org.address && (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>{org.address}{org.city ? ', ' + org.city : ''}{org.state ? ', ' + org.state : ''}{org.zip_code ? ' ' + org.zip_code : ''}</span>
        </p>
      )}
    </div>
  );
}

// ─── JoinFormSection ────────────────────────────────────────────────
export function JoinFormSection({ org, joinForm, joinLoading, joinError, joinSuccess, onChange, onSubmit, onReset, themeVars, isPreview }) {
  var form = joinForm || { name: '', email: '', message: '' };
  return (
    <section id="join" aria-labelledby="join-heading">
      <h2 id="join-heading" className="text-xl font-bold text-gray-900 mb-1">Join Us</h2>
      <p className="text-gray-500 text-sm mb-5">Interested in getting involved? Send us a message.</p>
      {joinSuccess ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center" role="status" aria-live="polite">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-green-800 font-bold">Message sent!</p>
          <p className="text-green-700 text-sm mt-1">{org.name} will get back to you soon.</p>
          <button onClick={onReset} className="mt-3 px-4 py-2 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">Send another message</button>
        </div>
      ) : (
        <form onSubmit={isPreview ? function(e) { e.preventDefault(); } : onSubmit} noValidate aria-label={'Contact form for ' + org.name} className="space-y-4">
          {joinError && <div className="bg-red-50 border border-red-200 rounded-lg p-3" role="alert"><p className="text-red-700 text-sm">{joinError}</p></div>}
          <div>
            <label htmlFor={isPreview ? 'p-join-name' : 'join-name'} className="block text-sm font-semibold text-gray-900 mb-1">Your Name <span aria-hidden="true">*</span></label>
            <input id={isPreview ? 'p-join-name' : 'join-name'} name="name" type="text" value={form.name} onChange={onChange || function() {}} placeholder="Jane Smith" maxLength={100} readOnly={isPreview}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>
          <div>
            <label htmlFor={isPreview ? 'p-join-email' : 'join-email'} className="block text-sm font-semibold text-gray-900 mb-1">Email <span aria-hidden="true">*</span></label>
            <input id={isPreview ? 'p-join-email' : 'join-email'} name="email" type="email" value={form.email} onChange={onChange || function() {}} placeholder="jane@example.com" maxLength={200} readOnly={isPreview}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>
          <div>
            <label htmlFor={isPreview ? 'p-join-msg' : 'join-message'} className="block text-sm font-semibold text-gray-900 mb-1">Message <span aria-hidden="true">*</span></label>
            <textarea id={isPreview ? 'p-join-msg' : 'join-message'} name="message" value={form.message} onChange={onChange || function() {}} placeholder="Tell us about yourself..." rows={3} maxLength={1000} readOnly={isPreview}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm" />
            {!isPreview && <p className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{form.message.length}/1000</p>}
          </div>
          <button type="submit" disabled={isPreview || joinLoading || (!isPreview && (!form.name.trim() || !form.email.trim() || !form.message.trim()))}
            className="w-full px-5 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}>
            {joinLoading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />Sending...</>) : 'Send Message'}
          </button>
        </form>
      )}
    </section>
  );
}

// ─── PhotoGallerySection ────────────────────────────────────────────
export function PhotoGallerySection({ photos, openLightbox, orgName }) {
  if (!photos || !photos.length) return null;
  return (
    <section id="gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="text-xl font-bold text-gray-900 mb-4">Photo Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2" role="list" aria-label="Organization photo gallery">
        {photos.slice(0, 6).map(function(photo, i) {
          return (
            <div key={photo.id} role="listitem">
              <button onClick={function() { openLightbox && openLightbox(photo, i); }}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg overflow-hidden group"
                aria-label={'View photo' + (photo.caption ? ': ' + photo.caption : ' ' + (i + 1))}>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img src={photo.photo_url} alt={photo.caption || ('Photo ' + (i + 1) + ' from ' + orgName)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Shared: no events empty state ─────────────────────────────────
function NoEvents() {
  return (
    <div className="text-center py-8">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      <p className="text-gray-400 text-sm font-medium">No upcoming events</p>
      <p className="text-gray-300 text-xs mt-1">Check back soon!</p>
    </div>
  );
}

// ─── Template: Classic ──────────────────────────────────────────────
export function ClassicTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox, navLinks, themeVars }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: themeVars.fontFamily }}>
      <OrgNav org={org} navLinks={navLinks} themeVars={themeVars} />
      <section id="home" className="bg-gray-50 border-b border-gray-200 py-16 px-6" aria-labelledby="classic-heading">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 id="classic-heading" className="text-4xl font-bold text-gray-900 mb-3">{org.name}</h1>
            <p className="text-lg text-gray-600 mb-6">{org.tagline || org.description || 'Welcome to our organization.'}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link to="/login" className="px-5 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}>Member Portal</Link>
              <a href="#about" className="px-5 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
                style={{ borderRadius: themeVars.btnRadius }}>Learn More</a>
            </div>
          </div>
          {org.banner_url ? (
            <div className="flex-shrink-0 w-full md:w-72 h-48 rounded-xl overflow-hidden shadow-md"><img src={org.banner_url} alt={org.name + ' banner'} className="w-full h-full object-cover" /></div>
          ) : (
            <div className="flex-shrink-0 w-full md:w-72 h-48 bg-gray-200 rounded-xl flex items-center justify-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-12" role="main">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.events && (
            <section id="events" aria-labelledby="c-events-h">
              <h2 id="c-events-h" className="text-xl font-bold text-gray-900 mb-5">Upcoming Events</h2>
              {events.length > 0 ? (
                <><div className="space-y-3">{events.map(function(e) { return <EventCardCompact key={e.id} event={e} themeVars={themeVars} />; })}</div>
                <a href="#events" className="inline-flex items-center gap-1 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mt-3" style={{ color: themeVars.primaryColor }}>
                  View All Events <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </a></>
              ) : <NoEvents />}
            </section>
          )}
          <div className="space-y-8">
            {sections.about && org.description && (
              <section id="about" aria-labelledby="c-about-h">
                <h2 id="c-about-h" className="text-xl font-bold text-gray-900 mb-3">About Us</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{org.description}</p>
              </section>
            )}
            {sections.announcements && announcements.length > 0 && (
              <section id="news" aria-labelledby="c-news-h">
                <h2 id="c-news-h" className="text-xl font-bold text-gray-900 mb-3">Latest News</h2>
                <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div>
              </section>
            )}
            {sections.contact && <ContactBlock org={org} themeVars={themeVars} />}
          </div>
        </div>
        {sections.photos && photos.length > 0 && <div className="mt-12"><PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} /></div>}
        {sections.join && <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-8"><JoinFormSection org={org} {...joinProps} themeVars={themeVars} /></div>}
      </main>
      <OrgFooter org={org} navLinks={navLinks} />
    </div>
  );
}

// ─── Template: Modern ───────────────────────────────────────────────
export function ModernTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox, navLinks, themeVars }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: themeVars.fontFamily }}>
      <OrgNav org={org} navLinks={navLinks} themeVars={themeVars} />
      <section id="home" className="py-16 px-6 border-b border-gray-100" aria-labelledby="m-heading">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-10">
          <div className="flex-1">
            <h1 id="m-heading" className="text-4xl font-bold text-gray-900 mb-3">{'Welcome to ' + org.name}</h1>
            <p className="text-lg text-gray-500 mb-6">{org.tagline || 'Unified platform for nonprofits & community groups.'}</p>
            <Link to="/login" className="px-6 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
              style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}>Member Portal</Link>
          </div>
          {org.banner_url ? (
            <div className="flex-shrink-0 w-full md:w-72 h-44 rounded-xl overflow-hidden shadow-sm border border-gray-100"><img src={org.banner_url} alt={org.name + ' banner'} className="w-full h-full object-cover" /></div>
          ) : (
            <div className="flex-shrink-0 w-full md:w-64 space-y-2 pt-2" aria-hidden="true">
              <div className="h-4 bg-gray-200 rounded w-full" /><div className="h-4 bg-gray-200 rounded w-5/6" /><div className="h-4 bg-gray-200 rounded w-4/6" /><div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          )}
        </div>
      </section>
      <main className="max-w-6xl mx-auto px-6 py-12" role="main">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.events && (
            <section id="events" aria-labelledby="m-events-h">
              <h2 id="m-events-h" className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Upcoming Events</h2>
              {events.length > 0 ? <div className="space-y-3">{events.map(function(e) { return <EventCardCompact key={e.id} event={e} themeVars={themeVars} />; })}</div>
                : <div className="text-center py-6"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-gray-400 text-sm">No upcoming events</p></div>}
            </section>
          )}
          {sections.about && (
            <section id="about" aria-labelledby="m-about-h">
              <h2 id="m-about-h" className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">About Us</h2>
              {org.description ? <p className="text-gray-600 text-sm leading-relaxed">{org.description}</p> : <p className="text-gray-400 text-sm">No description provided.</p>}
            </section>
          )}
          {sections.announcements && (
            <section id="news" aria-labelledby="m-news-h">
              <h2 id="m-news-h" className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Recent News</h2>
              {announcements.length > 0 ? <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div> : <p className="text-gray-400 text-sm">No recent news.</p>}
            </section>
          )}
        </div>
        {sections.photos && photos.length > 0 && <div className="mt-12"><PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} /></div>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.contact && <section id="contact" aria-labelledby="m-contact-h"><h2 id="m-contact-h" className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2><ContactBlock org={org} themeVars={themeVars} /></section>}
          {sections.join && <JoinFormSection org={org} {...joinProps} themeVars={themeVars} />}
        </div>
      </main>
      <OrgFooter org={org} navLinks={navLinks} />
    </div>
  );
}

// ─── Template: Banner ───────────────────────────────────────────────
export function BannerTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox, navLinks, themeVars }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: themeVars.fontFamily }}>
      <OrgNav org={org} navLinks={navLinks} themeVars={themeVars} />
      <header id="home" className="relative overflow-hidden" role="banner" style={{ minHeight: '240px' }}>
        {org.banner_url ? (
          <div className="absolute inset-0" aria-hidden="true" style={{ backgroundImage: 'url(' + org.banner_url + ')', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute inset-0 bg-black bg-opacity-45" />
          </div>
        ) : (
          <div className="absolute inset-0" aria-hidden="true" style={{ backgroundColor: themeVars.primaryColor, opacity: 0.85 }} />
        )}
        <div className="relative z-10 flex items-center justify-center py-16 px-6 text-center">
          <div>
            {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="w-16 h-16 rounded-full object-cover border-2 border-white mx-auto mb-4" />}
            <h1 className="text-4xl font-bold text-white mb-2">{org.name}</h1>
            {org.tagline && <p className="text-white text-opacity-80 text-lg mt-1">{org.tagline}</p>}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12" role="main">
        {sections.about && org.description && <section id="about" className="mb-10 text-center"><p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">{org.description}</p></section>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.events && (
            <section id="events" aria-labelledby="b-events-h">
              <h2 id="b-events-h" className="text-xl font-bold text-gray-900 mb-5">Upcoming Events</h2>
              {events.length > 0 ? (
                <><div className="space-y-3">{events.map(function(e) { return <EventCardCompact key={e.id} event={e} themeVars={themeVars} />; })}</div>
                <a href="#events" className="inline-flex items-center gap-1 text-sm font-medium hover:underline mt-3" style={{ color: themeVars.primaryColor }}>View All Events</a></>
              ) : <NoEvents />}
            </section>
          )}
          {sections.announcements && (
            <section id="news" aria-labelledby="b-news-h">
              <h2 id="b-news-h" className="text-xl font-bold text-gray-900 mb-5">Recent News</h2>
              {announcements.length > 0 ? <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div> : <p className="text-gray-400 text-sm">No recent news.</p>}
            </section>
          )}
        </div>
        {sections.photos && photos.length > 0 && <div className="mt-12"><PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} /></div>}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
          {sections.contact && <section id="contact" aria-labelledby="b-contact-h"><h2 id="b-contact-h" className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2><ContactBlock org={org} themeVars={themeVars} /></section>}
          {sections.join && <JoinFormSection org={org} {...joinProps} themeVars={themeVars} />}
        </div>
      </main>
      <OrgFooter org={org} navLinks={navLinks} />
    </div>
  );
}

// ─── Template: Sidebar ──────────────────────────────────────────────
export function SidebarTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox, navLinks, themeVars }) {
  var [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: themeVars.fontFamily }}>
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20" role="navigation" aria-label="Organization navigation">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={function() { setSidebarOpen(!sidebarOpen); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 md:hidden" aria-label={sidebarOpen ? 'Close menu' : 'Open menu'} aria-expanded={sidebarOpen}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />}
            <span className="font-bold text-gray-900 truncate">{org.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-5">{navLinks.slice(0, 4).map(function(l) { return <a key={l.id} href={l.href} className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors">{l.label}</a>; })}</div>
          <Link to="/login" className="px-4 py-2 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex-shrink-0"
            style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}>Member Login</Link>
        </div>
      </nav>
      <div className="flex min-h-screen">
        <aside className={'flex-shrink-0 bg-gray-50 border-r border-gray-200 pt-6 ' + (sidebarOpen ? 'w-52 block' : 'hidden md:block md:w-52')} aria-label="Side navigation">
          <nav>
            <ul className="space-y-0.5 px-3" role="list">
              {navLinks.map(function(l) {
                return <li key={l.id}><a href={l.href} target={l.type === 'external' ? '_blank' : undefined} rel={l.type === 'external' ? 'noopener noreferrer' : undefined}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">{l.label}</a></li>;
              })}
            </ul>
            <div className="mt-6 px-4">
              <Link to="/login" className="block w-full text-center px-4 py-2.5 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}>Member Login</Link>
            </div>
          </nav>
        </aside>
        <main className="flex-1 min-w-0 px-8 py-10" role="main">
          <section id="home" className="mb-10" aria-labelledby="s-heading">
            <h1 id="s-heading" className="text-3xl font-bold text-gray-900 mb-2">{'Welcome to ' + org.name}</h1>
            <p className="text-gray-500 mb-5">{org.tagline || 'Unified platform for nonprofits & community groups.'}</p>
            <Link to="/login" className="px-5 py-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
              style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}>Member Portal</Link>
          </section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {sections.events && (
              <section id="events" aria-labelledby="s-events-h">
                <h2 id="s-events-h" className="text-lg font-bold text-gray-900 mb-4">Upcoming Events</h2>
                {events.length > 0 ? <div className="space-y-3">{events.map(function(e) { return <EventCardCompact key={e.id} event={e} themeVars={themeVars} />; })}</div>
                  : <div className="text-center py-6"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-gray-400 text-sm">No upcoming events</p></div>}
              </section>
            )}
            <div className="space-y-8">
              {sections.announcements && <section id="news" aria-labelledby="s-news-h"><h2 id="s-news-h" className="text-lg font-bold text-gray-900 mb-4">Recent News</h2>{announcements.length > 0 ? <div>{announcements.map(function(a) { return <AnnouncementCardCompact key={a.id} announcement={a} />; })}</div> : <p className="text-gray-400 text-sm">No recent news.</p>}</section>}
              {sections.contact && <section id="contact" aria-labelledby="s-contact-h"><h2 id="s-contact-h" className="text-lg font-bold text-gray-900 mb-3">Contact Information</h2><ContactBlock org={org} compact={true} themeVars={themeVars} /></section>}
            </div>
          </div>
          {sections.photos && photos.length > 0 && <div className="mt-10"><PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} /></div>}
          {sections.join && <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-6"><JoinFormSection org={org} {...joinProps} themeVars={themeVars} /></div>}
        </main>
      </div>
      <OrgFooter org={org} navLinks={navLinks} />
    </div>
  );
}

// ─── Template: Featured ─────────────────────────────────────────────
export function FeaturedTemplate({ org, events, announcements, photos, sections, joinProps, openLightbox, navLinks, themeVars }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: themeVars.fontFamily }}>
      <OrgNav org={org} navLinks={navLinks} themeVars={themeVars} />
      <section id="home" className="py-16 px-6 text-center border-b border-gray-100" aria-labelledby="f-heading">
        <div className="max-w-2xl mx-auto">
          {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="w-16 h-16 rounded-full object-cover mx-auto mb-5 border-2 border-gray-100 shadow-sm" />}
          <h1 id="f-heading" className="text-4xl font-bold text-gray-900 mb-3">{'Welcome to ' + org.name}</h1>
          <p className="text-lg text-gray-500 mb-7">{org.tagline || 'Unified platform for nonprofits & groups.'}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/login" className="px-6 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
              style={{ backgroundColor: themeVars.primaryColor, borderRadius: themeVars.btnRadius }}>Member Portal</Link>
            <a href="#about" className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
              style={{ borderRadius: themeVars.btnRadius }}>Learn More</a>
          </div>
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-12" role="main">
        {sections.about && org.description && <section id="about" className="mb-10" aria-labelledby="f-about-h"><h2 id="f-about-h" className="text-xl font-bold text-gray-900 mb-3">About Us</h2><p className="text-gray-600 leading-relaxed">{org.description}</p></section>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          {sections.events && (
            <section id="events" aria-labelledby="f-events-h">
              <h2 id="f-events-h" className="text-xl font-bold text-gray-900 mb-5">Upcoming Events</h2>
              {events.length > 0 ? <div className="space-y-3">{events.map(function(e) { return <EventCardCompact key={e.id} event={e} themeVars={themeVars} />; })}</div> : <NoEvents />}
            </section>
          )}
          <div className="space-y-6">
            {sections.contact && <section id="contact" aria-labelledby="f-contact-h"><h2 id="f-contact-h" className="text-lg font-bold text-gray-900 mb-3">Contact Information</h2><ContactBlock org={org} compact={true} themeVars={themeVars} /></section>}
          </div>
        </div>
        {sections.announcements && announcements.length > 0 && (
          <section id="news" className="mb-12" aria-labelledby="f-news-h">
            <h2 id="f-news-h" className="text-xl font-bold text-gray-900 mb-5">Latest News</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {announcements.map(function(a) { return <div key={a.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200"><p className="font-semibold text-gray-900 text-sm mb-1">{a.title}</p><p className="text-gray-400 text-xs mb-2">{new Date(a.created_at).toLocaleDateString()}</p>{a.content && <p className="text-gray-600 text-xs line-clamp-3">{a.content}</p>}</div>; })}
            </div>
          </section>
        )}
        {sections.photos && photos.length > 0 && <div className="mb-12"><PhotoGallerySection photos={photos} openLightbox={openLightbox} orgName={org.name} /></div>}
        {sections.join && <div className="bg-gray-50 border border-gray-200 rounded-xl p-8"><JoinFormSection org={org} {...joinProps} themeVars={themeVars} /></div>}
      </main>
      <OrgFooter org={org} navLinks={navLinks} />
    </div>
  );
}