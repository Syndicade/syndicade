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

// ── Skeleton ──────────────────────────────────────────────────────────────────
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

// ── Join Us Form ──────────────────────────────────────────────────────────────
function JoinForm({ org, primary, borderRadius }) {
  var [form, setForm] = useState({ name: '', email: '', message: '' });
  var [loading, setLoading] = useState(false);
  var [success, setSuccess] = useState(false);
  var [error, setError] = useState(null);

  function handleChange(e) {
    var n = e.target.name; var v = e.target.value;
    setForm(function(p) { return Object.assign({}, p, { [n]: v }); });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      var result = await supabase.from('contact_inquiries').insert([{
        organization_id: org.id,
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        created_at: new Date().toISOString(),
      }]);
      if (result.error) throw result.error;
      setSuccess(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primary + '20' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primary }} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-500 mb-4">Thank you for reaching out to {org.name}. We'll be in touch soon.</p>
        <button
          onClick={function() { setSuccess(false); }}
          className="text-sm font-semibold focus:outline-none focus:underline"
          style={{ color: primary }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Contact form">
      <div>
        <label htmlFor="join-name" className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
        <input
          id="join-name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{ '--tw-ring-color': primary }}
          placeholder="Jane Smith"
        />
      </div>
      <div>
        <label htmlFor="join-email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
        <input
          id="join-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
          placeholder="jane@example.com"
        />
      </div>
      <div>
        <label htmlFor="join-message" className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
        <textarea
          id="join-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none"
          placeholder={"Tell us why you'd like to connect with " + org.name + '...'}
        />
      </div>
      {error && (
        <p className="text-red-600 text-sm" role="alert">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !form.name || !form.email}
        className="w-full py-3 font-bold text-white text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: primary, borderRadius: borderRadius }}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

// ── New Website Builder Public Page ──────────────────────────────────────────
function NewPublicPage({ org, siteConfig, pages, navItems, events, announcements }) {
  var primary = siteConfig.primary_color || '#3B82F6';
  var secondary = siteConfig.secondary_color || '#1E40AF';
  var headerDark = siteConfig.header_style === 'dark';
  var template = siteConfig.template_id || 'modern';

  var borderRadius;
  if (siteConfig.button_style === 'pill') { borderRadius = '9999px'; }
  else if (siteConfig.button_style === 'sharp') { borderRadius = '0px'; }
  else { borderRadius = '8px'; }

  var fontFamily;
  if (siteConfig.font_pairing === 'serif') { fontFamily = 'Georgia, serif'; }
  else if (siteConfig.font_pairing === 'mono') { fontFamily = '"Roboto Slab", Georgia, serif'; }
  else { fontFamily = 'Inter, system-ui, sans-serif'; }

  var navBg = headerDark ? '#111827' : '#ffffff';
  var navBorder = headerDark ? '#374151' : '#e5e7eb';
  var navTextColor = headerDark ? '#d1d5db' : '#374151';
  var logoTextColor = headerDark ? '#ffffff' : '#111827';

  var enabledPages = pages.filter(function(p) { return p.is_enabled; });
  var enabledNavItems = navItems.length > 0
    ? navItems
    : enabledPages.filter(function(p) { return p.is_visible_in_nav; }).map(function(p) {
        return { label: p.nav_label, page_key: p.page_key };
      });

  var navBar = (
    <nav
      style={{ backgroundColor: navBg, borderBottom: '1px solid ' + navBorder }}
      className="sticky top-0 z-20"
      role="navigation"
      aria-label={org.name + ' navigation'}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name + ' logo'} className="h-9 w-9 rounded-full object-cover" />
            : <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primary }}>{(org.name || 'O').charAt(0)}</div>
          }
          <span style={{ color: logoTextColor, fontWeight: 700, fontSize: '16px' }}>{org.name}</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {enabledNavItems.map(function(item) {
            return (
              <a
                key={item.page_key || item.id}
                href={'#section-' + (item.page_key || item.id)}
                style={{ color: navTextColor, fontSize: '14px', textDecoration: 'none' }}
                className="hover:opacity-70 transition-opacity focus:outline-none focus:underline"
              >
                {item.label}
              </a>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold focus:outline-none focus:underline"
            style={{ color: navTextColor }}
          >
            Member Login
          </Link>
          <a
            href="#section-contact"
            className="text-white text-sm font-bold px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary, borderRadius: borderRadius }}
          >
            Join Us
          </a>
        </div>
      </div>
    </nav>
  );

  var footer = (
    <footer className="px-6 py-10 border-t border-gray-200" style={{ backgroundColor: headerDark ? '#111827' : '#f9fafb' }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {org.logo_url && <img src={org.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" aria-hidden="true" />}
          <span style={{ color: headerDark ? '#ffffff' : '#111827', fontWeight: 700 }}>{org.name}</span>
        </div>
        {org.contact_email && (
          <a href={'mailto:' + org.contact_email} style={{ color: headerDark ? '#9ca3af' : '#6b7280', fontSize: '14px' }}>
            {org.contact_email}
          </a>
        )}
        <p style={{ color: headerDark ? '#6b7280' : '#9ca3af', fontSize: '13px' }}>
          {'© ' + new Date().getFullYear() + ' ' + org.name + '. Powered by Syndicade.'}
        </p>
      </div>
    </footer>
  );

  // ── Section renderer ──────────────────────────────────────────────────────
  function renderSection(page, index) {
    var key = page.page_key;
    var bg = index % 2 === 0 ? '#ffffff' : '#f9fafb';

    // Events section
    if (key === 'events') {
      return (
        <section key={page.id} id="section-events" style={{ backgroundColor: bg, fontFamily: fontFamily }} className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
            {events.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming events at this time. Check back soon.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.map(function(event) {
                  var d = new Date(event.start_time);
                  return (
                    <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: primary }}>
                          <span>{d.toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                          <span className="text-lg leading-tight">{d.getDate()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-tight">{event.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {event.location ? ' · ' + event.location : ''}
                          </p>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      );
    }

    // News / announcements section
    if (key === 'news') {
      return (
        <section key={page.id} id="section-news" style={{ backgroundColor: bg, fontFamily: fontFamily }} className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Updates</h2>
            {announcements.length === 0 ? (
              <p className="text-gray-400 text-sm">No announcements at this time.</p>
            ) : (
              <div className="space-y-6">
                {announcements.map(function(a) {
                  return (
                    <div key={a.id} className="border-l-4 pl-5 py-1" style={{ borderColor: primary }}>
                      <p className="font-bold text-gray-900 mb-1">{a.title}</p>
                      {a.content && <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{a.content}</p>}
                      <p className="text-xs text-gray-400 mt-2">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      );
    }

    // Contact / Get Involved / Join section
    if (key === 'contact' || key === 'involved') {
      return (
        <section key={page.id} id="section-contact" style={{ backgroundColor: bg, fontFamily: fontFamily }} className="px-6 py-16">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Get in Touch</h2>
            <p className="text-gray-500">Interested in joining or learning more? Send us a message.</p>
          </div>
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <JoinForm org={org} primary={primary} borderRadius={borderRadius} />
          </div>
        </section>
      );
    }

    // About / Mission section
    if (key === 'about' || key === 'mission') {
      return (
        <section key={page.id} id={'section-' + key} style={{ backgroundColor: bg, fontFamily: fontFamily }} className="px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{key === 'mission' ? 'Our Mission' : 'About Us'}</h2>
            {org.description && (
              <p className="text-gray-600 leading-relaxed text-lg">{org.description}</p>
            )}
          </div>
        </section>
      );
    }

    // Membership section
    if (key === 'membership') {
      return (
        <section key={page.id} id="section-membership" style={{ backgroundColor: bg, fontFamily: fontFamily }} className="px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Become a Member</h2>
            <p className="text-gray-500 mb-8">Join our community and make a difference.</p>
            <a
              href="#section-contact"
              className="inline-block text-white font-bold px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary, borderRadius: borderRadius }}
            >
              Apply for Membership
            </a>
          </div>
        </section>
      );
    }
// Render blocks for this page if any exist
    var pageBlocks = blocks.filter(function(b) { return b.page_id === page.id; });
    if (pageBlocks.length > 0) {
      return (
        <section key={page.id} id={'section-' + key} style={{ backgroundColor: bg, fontFamily: fontFamily }} className="px-6 py-16">
          <div className="max-w-5xl mx-auto space-y-12">
            {pageBlocks.map(function(block) { return renderBlock(block, primary, secondary, borderRadius, fontFamily, org); })}
          </div>
        </section>
      );
    }
    // Home section → skip (handled by hero)
    if (key === 'home') return null;

    // Generic fallback for any other page
    return (
      <section key={page.id} id={'section-' + key} style={{ backgroundColor: bg, fontFamily: fontFamily }} className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h2>
          <p className="text-gray-400 text-sm">Content coming soon.</p>
        </div>
      </section>
    );
  }

  // ── MODERN ────────────────────────────────────────────────────────────────
  if (template === 'modern') {
    return (
      <div style={{ fontFamily: fontFamily }}>
        {navBar}
        <section id="section-home" className="px-6 py-20 text-center" style={{ background: 'linear-gradient(135deg, ' + primary + '15 0%, ' + secondary + '08 100%)' }}>
          <div className="max-w-3xl mx-auto">
            {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="h-24 w-24 rounded-full object-cover mx-auto mb-6 border-4 border-white shadow-lg" />}
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">{org.name}</h1>
            {org.tagline && <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">{org.tagline}</p>}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="#section-contact" className="text-white font-bold px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius }}>
                Get Involved
              </a>
              <a href="#section-about" className="font-bold px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ color: primary, border: '2px solid ' + primary, borderRadius: borderRadius }}>
                Learn More
              </a>
            </div>
          </div>
        </section>
        {enabledPages.filter(function(p) { return p.page_key !== 'home'; }).map(function(page, i) { return renderSection(page, i); })}
        {footer}
      </div>
    );
  }

  // ── CLASSIC ───────────────────────────────────────────────────────────────
  if (template === 'classic') {
    return (
      <div style={{ fontFamily: fontFamily }}>
        {navBar}
        <section id="section-home" className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: primary }}>
          <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="h-20 w-20 rounded-lg object-cover mb-5 border-4 border-white shadow-lg" />}
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{org.name}</h1>
              {org.tagline && <p className="text-lg text-white opacity-90 mb-8 max-w-lg">{org.tagline}</p>}
              <div className="flex gap-4 flex-wrap">
                <a href="#section-contact" className="bg-white font-bold px-7 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white hover:opacity-90 transition-opacity" style={{ color: primary, borderRadius: borderRadius }}>
                  Join Us
                </a>
                <a href="#section-about" className="text-white font-bold px-7 py-3 text-sm border-2 border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white hover:opacity-90 transition-opacity" style={{ borderRadius: borderRadius }}>
                  Our Story
                </a>
              </div>
            </div>
            {org.banner_url && (
              <div className="flex-shrink-0">
                <img src={org.banner_url} alt="" className="h-48 w-72 object-cover rounded-xl shadow-xl opacity-80" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10" style={{ backgroundColor: secondary }} />
        </section>
        {enabledPages.filter(function(p) { return p.page_key !== 'home'; }).map(function(page, i) { return renderSection(page, i); })}
        {footer}
      </div>
    );
  }

  // ── IMPACT ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: fontFamily }}>
      {navBar}
      <section id="section-home" className="py-28 px-6 text-center relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 60% 50%, ' + primary + ', transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="h-28 w-28 rounded-full object-cover mx-auto mb-6 border-4 shadow-2xl" style={{ borderColor: primary }} />}
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight uppercase tracking-tight">{org.name}</h1>
          {org.tagline && <p className="text-xl text-white opacity-70 mb-10 max-w-xl mx-auto">{org.tagline}</p>}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#section-contact" className="text-white font-black px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius }}>
              Take Action
            </a>
            <a href="#section-about" className="text-white font-black px-8 py-3 text-sm border-2 border-white border-opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ borderRadius: borderRadius }}>
              Our Story
            </a>
          </div>
        </div>
      </section>
      {enabledPages.filter(function(p) { return p.page_key !== 'home'; }).map(function(page, i) { return renderSection(page, i); })}
      {footer}
    </div>
  );
}
// ── Block renderer ────────────────────────────────────────────────────────────
function renderBlock(block, primary, secondary, borderRadius, fontFamily, org) {
  var c = block.content || {};
  var type = block.block_type;

  // HERO
  if (type === 'hero') {
    var heroAlign = c.align === 'left' ? 'text-left items-start' : c.align === 'right' ? 'text-right items-end' : 'text-center items-center';
    return (
      <div key={block.id} className={'py-16 px-6 rounded-2xl flex flex-col gap-6 ' + heroAlign}
        style={{ background: c.image_url ? 'url(' + c.image_url + ') center/cover no-repeat' : 'linear-gradient(135deg, ' + primary + '15 0%, ' + secondary + '08 100%)' }}>
        {c.headline && <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight max-w-3xl">{c.headline}</h1>}
        {c.subtext && <p className="text-lg text-gray-600 max-w-2xl">{c.subtext}</p>}
        {c.cta_label && (
          <a href={c.cta_url || '#'} className="inline-block font-bold px-8 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary, borderRadius: borderRadius }}>
            {c.cta_label}
          </a>
        )}
      </div>
    );
  }

  // RICH TEXT
  if (type === 'rich_text') {
    return (
      <div key={block.id} className="prose prose-gray max-w-none">
        {(c.body || '').split('\n').map(function(line, i) {
          return line ? <p key={i} className="text-gray-600 leading-relaxed mb-4">{line}</p> : <br key={i} />;
        })}
      </div>
    );
  }

  // IMAGE + TEXT
  if (type === 'image_text') {
    var isLeft = c.image_position !== 'right';
    return (
      <div key={block.id} className={'flex flex-col md:flex-row gap-10 items-center ' + (isLeft ? '' : 'md:flex-row-reverse')}>
        {c.image_url && <img src={c.image_url} alt={c.heading || ''} className="w-full md:w-1/2 rounded-xl object-cover shadow-md" style={{ maxHeight: '380px' }} />}
        <div className={'flex-1 ' + (!c.image_url ? 'w-full' : '')}>
          {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-4">{c.heading}</h2>}
          {c.body && <p className="text-gray-600 leading-relaxed">{c.body}</p>}
        </div>
      </div>
    );
  }

  // FULL WIDTH IMAGE
  if (type === 'full_width_image') {
    var heightMap = { small: '200px', medium: '380px', large: '520px' };
    return (
      <div key={block.id} className="rounded-xl overflow-hidden shadow-md">
        {c.image_url
          ? <img src={c.image_url} alt={c.caption || ''} className="w-full object-cover" style={{ height: heightMap[c.height] || '380px' }} />
          : <div className="w-full bg-gray-100 flex items-center justify-center" style={{ height: heightMap[c.height] || '380px' }}>
              <p className="text-gray-400 text-sm">No image uploaded</p>
            </div>
        }
        {c.caption && <p className="text-center text-sm text-gray-500 mt-3 italic">{c.caption}</p>}
      </div>
    );
  }

  // VIDEO
  if (type === 'video') {
    function getEmbedUrl(url) {
      if (!url) return null;
      var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1];
      var vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) return 'https://player.vimeo.com/video/' + vimeoMatch[1];
      return null;
    }
    var embedUrl = getEmbedUrl(c.url);
    return (
      <div key={block.id}>
        {embedUrl
          ? <div className="relative rounded-xl overflow-hidden shadow-md" style={{ paddingBottom: '56.25%' }}>
              <iframe src={embedUrl} title={c.caption || 'Video'} className="absolute inset-0 w-full h-full" allowFullScreen frameBorder="0" />
            </div>
          : <div className="w-full bg-gray-100 rounded-xl flex items-center justify-center py-16">
              <p className="text-gray-400 text-sm">No video URL provided</p>
            </div>
        }
        {c.caption && <p className="text-center text-sm text-gray-500 mt-3 italic">{c.caption}</p>}
      </div>
    );
  }

  // QUOTE
  if (type === 'quote') {
    return (
      <div key={block.id} className="border-l-4 pl-8 py-4" style={{ borderColor: primary }}>
        {c.quote && <p className="text-xl text-gray-700 italic leading-relaxed mb-4">"{c.quote}"</p>}
        {c.attribution && <p className="font-bold text-gray-900">{c.attribution}{c.role ? <span className="text-gray-500 font-normal">, {c.role}</span> : ''}</p>}
      </div>
    );
  }

  // STATS
  if (type === 'stats') {
    return (
      <div key={block.id} className="text-center">
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-10">{c.heading}</h2>}
        <div className={'grid gap-8 ' + ((c.items || []).length <= 2 ? 'grid-cols-2' : (c.items || []).length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4')}>
          {(c.items || []).map(function(item, i) {
            return (
              <div key={i} className="flex flex-col items-center">
                <p className="text-4xl font-extrabold mb-2" style={{ color: primary }}>{item.prefix || ''}{item.value || '0'}{item.suffix || ''}</p>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // CTA BANNER
  if (type === 'cta_banner') {
    return (
      <div key={block.id} className="rounded-2xl px-10 py-12 text-center text-white" style={{ backgroundColor: c.bg_color || primary }}>
        {c.heading && <h2 className="text-3xl font-extrabold mb-3">{c.heading}</h2>}
        {c.subtext && <p className="text-lg opacity-90 mb-8">{c.subtext}</p>}
        {c.cta_label && (
          <a href={c.cta_url || '#'} className="inline-block bg-white font-bold px-8 py-3 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-opacity"
            style={{ color: c.bg_color || primary, borderRadius: borderRadius }}>
            {c.cta_label}
          </a>
        )}
      </div>
    );
  }

  // EMAIL SIGNUP (placeholder)
  if (type === 'email_signup') {
    return (
      <div key={block.id} className="bg-gray-50 rounded-2xl px-10 py-12 text-center border border-gray-200">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        <div className="flex gap-3 max-w-md mx-auto">
          <input type="email" placeholder={c.placeholder || 'Enter your email'} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="px-6 py-3 text-white font-bold text-sm rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius }}>
            {c.button_label || 'Subscribe'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Email signup integration coming soon.</p>
      </div>
    );
  }

  // CONTACT FORM
  if (type === 'contact_form') {
    return (
      <div key={block.id} className="max-w-lg mx-auto text-center">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <JoinForm org={org} primary={primary} borderRadius={borderRadius} />
        </div>
      </div>
    );
  }

  // DONATION BUTTON (placeholder)
  if (type === 'donation_button') {
    return (
      <div key={block.id} className="text-center py-8">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        <a href={c.url || '#'} className="inline-block text-white font-bold px-10 py-4 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius }}>
          {c.button_label || 'Donate Now'}
        </a>
        <p className="text-xs text-gray-400 mt-3">Donation integration coming soon.</p>
      </div>
    );
  }

  // VOLUNTEER SIGNUP (placeholder)
  if (type === 'volunteer_signup') {
    return (
      <div key={block.id} className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        <button className="text-white font-bold px-10 py-4 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius }}>
          {c.button_label || 'Sign Up to Volunteer'}
        </button>
        <p className="text-xs text-gray-400 mt-3">Volunteer signup integration coming soon.</p>
      </div>
    );
  }

  // PETITION (placeholder)
  if (type === 'petition') {
    return (
      <div key={block.id} className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        {c.goal && <p className="text-sm text-gray-500 mb-4">Goal: {c.goal} signatures</p>}
        <button className="text-white font-bold px-10 py-4 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius }}>
          {c.button_label || 'Sign the Petition'}
        </button>
        <p className="text-xs text-gray-400 mt-3">Petition integration coming soon.</p>
      </div>
    );
  }

  // EVENTS LIST
  if (type === 'events_list') {
    return (
      <div key={block.id}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8">{c.heading}</h2>}
        <p className="text-gray-400 text-sm">Events are rendered from the page's built-in events section.</p>
      </div>
    );
  }

  // PROGRAMS LIST
  if (type === 'programs_list') {
    return (
      <div key={block.id}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8">{c.heading}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(c.items || []).map(function(item, i) {
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                {item.name && <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>}
                {item.description && <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // TEAM GRID
  if (type === 'team_grid') {
    return (
      <div key={block.id}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{c.heading}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(c.members || []).map(function(member, i) {
            return (
              <div key={i} className="text-center">
                {member.photo_url
                  ? <img src={member.photo_url} alt={member.name || 'Team member'} className="w-24 h-24 rounded-full object-cover mx-auto mb-3 shadow-md" />
                  : <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-md" style={{ backgroundColor: primary }}>{(member.name || 'T').charAt(0)}</div>
                }
                {member.name && <p className="font-bold text-gray-900 text-sm">{member.name}</p>}
                {member.title && <p className="text-xs text-gray-500 mt-0.5">{member.title}</p>}
                {member.bio && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{member.bio}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // MEMBERSHIP TIERS
  if (type === 'membership_tiers') {
    return (
      <div key={block.id}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{c.heading}</h2>}
        <div className={'grid gap-6 ' + ((c.tiers || []).length === 2 ? 'grid-cols-2' : (c.tiers || []).length >= 3 ? 'grid-cols-3' : 'grid-cols-1')}>
          {(c.tiers || []).map(function(tier, i) {
            return (
              <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center shadow-sm hover:border-blue-300 transition-colors">
                {tier.name && <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>{tier.name}</p>}
                {tier.price && <p className="text-4xl font-extrabold text-gray-900 mb-1">{tier.price}</p>}
                {tier.period && <p className="text-sm text-gray-400 mb-6">{tier.period}</p>}
                {(tier.features || []).filter(Boolean).length > 0 && (
                  <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
                    {tier.features.filter(Boolean).map(function(f, fi) {
                      return <li key={fi} className="flex items-center gap-2"><span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: primary + '20' }}><svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primary }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>{f}</li>;
                    })}
                  </ul>
                )}
                {tier.cta_label && (
                  <a href="#contact" className="block w-full text-center text-white font-bold py-3 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius }}>
                    {tier.cta_label}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // FAQ
  if (type === 'faq') {
    return (
      <div key={block.id}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8">{c.heading}</h2>}
        <div className="space-y-3">
          {(c.items || []).map(function(item, i) {
            return (
              <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  {item.question}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">{item.answer}</div>
              </details>
            );
          })}
        </div>
      </div>
    );
  }

  // PARTNER LOGOS
  if (type === 'partner_logos') {
    return (
      <div key={block.id} className="text-center">
        {c.heading && <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">{c.heading}</p>}
        <div className="flex flex-wrap items-center justify-center gap-8">
          {(c.partners || []).map(function(partner, i) {
            var inner = partner.logo_url
              ? <img src={partner.logo_url} alt={partner.name || 'Partner'} className="h-12 object-contain grayscale hover:grayscale-0 transition-all" />
              : <span className="text-gray-400 font-semibold text-sm">{partner.name}</span>;
            return partner.url
              ? <a key={i} href={partner.url} target="_blank" rel="noopener noreferrer" aria-label={partner.name}>{inner}</a>
              : <div key={i}>{inner}</div>;
          })}
        </div>
      </div>
    );
  }

  // DIVIDER
  if (type === 'divider') {
    var sizeMap = { small: '16px', medium: '40px', large: '80px' };
    return c.style === 'line'
      ? <hr key={block.id} style={{ margin: (sizeMap[c.size] || '40px') + ' 0', borderColor: '#e5e7eb' }} />
      : <div key={block.id} style={{ height: sizeMap[c.size] || '40px' }} aria-hidden="true" />;
  }

  // SOCIAL LINKS
  if (type === 'social_links') {
    var platformIcons = {
      facebook:  'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
      instagram: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z',
      twitter:   'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
      linkedin:  'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z',
      youtube:   'M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z M9.75 15.02l5.75-3.02-5.75-3.02v6.04z',
    };
    return (
      <div key={block.id} className="text-center">
        {c.heading && <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">{c.heading}</p>}
        <div className="flex items-center justify-center gap-4">
          {(c.links || []).map(function(link, i) {
            return (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.platform}
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-200 hover:border-blue-400 hover:text-blue-500 text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={platformIcons[link.platform] || 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101'} />
                </svg>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
// ── Main Export ───────────────────────────────────────────────────────────────
export default function PublicOrganizationPage() {
  var { slug } = useParams();
  var [organization, setOrganization] = useState(null);
  var [siteConfig, setSiteConfig] = useState(null);
  var [sitePages, setSitePages] = useState([]);
  var [siteNav, setSiteNav] = useState([]);
  var [blocks, setBlocks] = useState([]);
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

  useEffect(function() { fetchAll(); }, [slug]);

  async function fetchAll() {
    try {
      setLoading(true);

      var { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();
      if (orgError) throw orgError;
      setOrganization(org);

      var [configRes, pagesRes, navRes, eventsRes, announcementsRes, photosRes, blocksRes] = await Promise.allSettled([
        supabase.from('org_site_config').select('*').eq('organization_id', org.id).maybeSingle(),
        supabase.from('org_site_pages').select('*').eq('organization_id', org.id).order('sort_order', { ascending: true }),
        supabase.from('org_site_nav').select('*').eq('organization_id', org.id).maybeSingle(),
        supabase.from('events').select('*').eq('organization_id', org.id).eq('visibility', 'public').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(3),
        supabase.from('announcements').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('org_photos').select('*').eq('organization_id', org.id).order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('org_site_blocks').select('*').eq('organization_id', org.id).eq('is_visible', true).order('sort_order', { ascending: true }),
      ]);

      if (configRes.status === 'fulfilled' && configRes.value.data) setSiteConfig(configRes.value.data);
      if (pagesRes.status === 'fulfilled') setSitePages(pagesRes.value.data || []);
      if (navRes.status === 'fulfilled' && navRes.value.data) setSiteNav(navRes.value.data.items || []);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data || []);
      if (announcementsRes.status === 'fulfilled') setAnnouncements(announcementsRes.value.data || []);
      if (photosRes.status === 'fulfilled') setPhotos(photosRes.value.data || []);
      if (blocksRes.status === 'fulfilled') setBlocks(blocksRes.value.data || []);

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

// ── Route: use new WebsiteBuilder render if published ─────────────────────
  var effectiveSiteConfig = siteConfig || (organization.settings ? {
    primary_color: (organization.settings.theme && organization.settings.theme.customColors && organization.settings.theme.customColors[0]) || '#3B82F6',
    secondary_color: '#1E40AF',
    template_id: organization.settings.template || 'modern',
    button_style: (organization.settings.theme && organization.settings.theme.buttonStyle) || 'rounded',
    font_pairing: (organization.settings.theme && organization.settings.theme.fontPairing) || 'inter',
    header_style: 'light',
    is_published: organization.is_public,
  } : null);

  if (effectiveSiteConfig && organization.is_public && sitePages.length > 0) {
    return (
      <>
        <NewPublicPage
          org={organization}
          siteConfig={effectiveSiteConfig}
          pages={sitePages}
          navItems={siteNav}
          events={events}
          announcements={announcements}
        />
        {lightboxPhoto && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Photo lightbox" onClick={closeLightbox}>
            <div className="relative max-w-4xl w-full" onClick={function(e) { e.stopPropagation(); }}>
              <button onClick={closeLightbox} className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-1" aria-label="Close photo lightbox">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <img src={lightboxPhoto.photo_url} alt={lightboxPhoto.caption || ('Photo ' + (lightboxIndex + 1) + ' from ' + organization.name)} className="w-full object-contain rounded-lg" style={{ maxHeight: '75vh' }} />
              {lightboxPhoto.caption && <p className="text-white text-center mt-4 text-sm">{lightboxPhoto.caption}</p>}
              <div className="flex justify-between items-center mt-4">
                <button onClick={function() { navigateLightbox(-1); }} disabled={lightboxIndex === 0} className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30" aria-label="Previous photo">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <p className="text-gray-400 text-sm" aria-live="polite">{lightboxIndex + 1} / {photos.length}</p>
                <button onClick={function() { navigateLightbox(1); }} disabled={lightboxIndex === photos.length - 1} className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30" aria-label="Next photo">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Fallback: legacy OrgTemplates system ──────────────────────────────────
  var themeVars = getThemeVars(organization);
  var navLinks  = getNavLinks(organization);
  var template  = (organization.settings && organization.settings.template) || 'classic';
  var sections  = Object.assign(
    { about: true, events: true, announcements: true, photos: true, members: false, contact: true, join: true },
    organization.page_sections || {}
  );

  var joinProps = {
    joinForm, joinLoading, joinError, joinSuccess,
    onChange: handleJoinChange,
    onSubmit: handleJoinSubmit,
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
              <button onClick={function() { navigateLightbox(-1); }} disabled={lightboxIndex === 0} className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30" aria-label="Previous photo">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <p className="text-gray-400 text-sm" aria-live="polite">{lightboxIndex + 1} / {photos.length}</p>
              <button onClick={function() { navigateLightbox(1); }} disabled={lightboxIndex === photos.length - 1} className="text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded p-2 disabled:opacity-30" aria-label="Next photo">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}