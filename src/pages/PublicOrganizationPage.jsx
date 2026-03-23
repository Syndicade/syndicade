import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { renderBlock } from '../components/BlockRenderer';
import {
  getThemeVars,
  getNavLinks,
  ClassicTemplate,
  ModernTemplate,
  BannerTemplate,
  SidebarTemplate,
  FeaturedTemplate,
} from '../components/OrgTemplates';

function getContrastColor(hex) {
  if (!hex) return '#ffffff';
  var clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean[0]+clean[0]+clean[1]+clean[1]+clean[2]+clean[2];
  var r = parseInt(clean.substring(0,2), 16);
  var g = parseInt(clean.substring(2,4), 16);
  var b = parseInt(clean.substring(4,6), 16);
  var toLinear = function(c) {
    var s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  var L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.179 ? '#111827' : '#ffffff';
}
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

// ── Page Not Found ────────────────────────────────────────────────────────────
function PageNotFound({ org, slug, primary, borderRadius }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">This page doesn't exist for {org.name}.</p>
        <Link
          to={'/org/' + slug}
          className="inline-block text-white font-bold px-6 py-3 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
          style={{ backgroundColor: primary, borderRadius: borderRadius }}
        >
          Back to Home
        </Link>
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

    // Fetch org admin email
    var adminRes = await supabase
      .from('memberships')
      .select('members(email)')
      .eq('organization_id', org.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (adminRes.data && adminRes.data.members && adminRes.data.members.email) {
      var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';
      await fetch(SUPABASE_URL + '/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact_inquiry',
          data: {
            adminEmail: adminRes.data.members.email,
            orgName: org.name,
            senderName: form.name.trim(),
            senderEmail: form.email.trim(),
            message: form.message.trim(),
            inboxUrl: window.location.origin + '/organizations/' + org.id + '/inbox',
          },
        }),
      });
    }

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
        <button onClick={function() { setSuccess(false); }} className="text-sm font-semibold focus:outline-none focus:underline" style={{ color: primary }}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Contact form">
      <div>
        <label htmlFor="join-name" className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
        <input id="join-name" type="text" name="name" value={form.name} onChange={handleChange} required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
          placeholder="Jane Smith" />
      </div>
      <div>
        <label htmlFor="join-email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
        <input id="join-email" type="email" name="email" value={form.email} onChange={handleChange} required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
          placeholder="jane@example.com" />
      </div>
      <div>
        <label htmlFor="join-message" className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
        <textarea id="join-message" name="message" value={form.message} onChange={handleChange} rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none"
          placeholder={"Tell us why you'd like to connect with " + org.name + '...'} />
      </div>
      {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
      <button type="submit" disabled={loading || !form.name || !form.email}
        className="w-full py-3 font-bold text-white text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: primary, borderRadius: borderRadius }}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

// ── New Website Builder Public Page ──────────────────────────────────────────
function NewPublicPage({ org, slug, siteConfig, pages, navItems, events, announcements, blocks, activePageSlug }) {
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

  // Non-footer enabled pages only
  var enabledPages = pages.filter(function(p) {
    return p.is_enabled && p.page_key !== '__footer__';
  });

  // Build nav items
  var enabledNavItems = navItems.length > 0
    ? navItems
    : enabledPages.filter(function(p) { return p.is_visible_in_nav; }).map(function(p) {
        return { label: p.nav_label || p.title, page_key: p.page_key, id: p.id };
      });

  // Multi-page mode = has enabled pages beyond home
  var nonHomePages = enabledPages.filter(function(p) { return p.page_key !== 'home'; });
  var isMultiPage = nonHomePages.length > 0;

  // Active page object
  var activePage = activePageSlug
    ? enabledPages.find(function(p) { return p.page_key === activePageSlug; })
    : enabledPages.find(function(p) { return p.page_key === 'home'; }) || enabledPages[0];

  // Group blocks by page_id
  var blocksByPage = {};
  (blocks || []).forEach(function(b) {
    if (!blocksByPage[b.page_id]) blocksByPage[b.page_id] = [];
    blocksByPage[b.page_id].push(b);
  });

  // Build nav href
  function navHref(item) {
    if (!isMultiPage) return '#section-' + (item.page_key || item.id);
    if (item.url && item.url.startsWith('http')) return item.url;
    if (item.page_key === 'home' || !item.page_key) return '/org/' + slug;
    return '/org/' + slug + '/' + item.page_key;
  }

  // Contact destination
  var contactPage = enabledPages.find(function(p) { return p.page_key === 'contact' || p.page_key === 'involved'; });
  var contactHref = contactPage && isMultiPage ? '/org/' + slug + '/' + contactPage.page_key : '#section-contact';

  // ── Nav bar ───────────────────────────────────────────────────────────────
  var navBar = (
    <nav
      style={{ backgroundColor: navBg, borderBottom: '1px solid ' + navBorder }}
      className="sticky top-0 z-20"
      role="navigation"
      aria-label={org.name + ' navigation'}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to={'/org/' + slug} className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name + ' logo'} className="h-9 w-9 rounded-full object-cover" />
            : <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primary }}>{(org.name || 'O').charAt(0)}</div>
          }
          <span style={{ color: logoTextColor, fontWeight: 700, fontSize: '16px' }}>{org.name}</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {enabledNavItems.map(function(item) {
            var href = navHref(item);
            var isActive = activePageSlug
              ? item.page_key === activePageSlug
              : (item.page_key === 'home' || !activePageSlug);
            var linkColor = isActive ? primary : navTextColor;
            var linkWeight = isActive ? '700' : '500';

            if (item.url && item.url.startsWith('http')) {
              return (
                <a key={item.page_key || item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{ color: linkColor, fontSize: '14px', textDecoration: 'none', fontWeight: linkWeight }}
                  className="hover:opacity-70 transition-opacity focus:outline-none focus:underline">
                  {item.label}
                </a>
              );
            }
            return (
              <Link key={item.page_key || item.id} to={href}
                style={{ color: linkColor, fontSize: '14px', textDecoration: 'none', fontWeight: linkWeight }}
                className="hover:opacity-70 transition-opacity focus:outline-none focus:underline">
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold focus:outline-none focus:underline" style={{ color: navTextColor }}>
            Member Login
          </Link>
          <Link to={contactHref}
            className="text-white text-sm font-bold px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary, borderRadius: borderRadius, color: getContrastColor(primary) }}>
  Join Us
          </Link>
        </div>
      </div>
    </nav>
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  var footerPage = pages.find(function(p) { return p.page_key === '__footer__'; });
  var footerBlocks = footerPage ? (blocksByPage[footerPage.id] || []) : [];

  var footer = (
    <footer className="border-t border-gray-200" style={{ backgroundColor: headerDark ? '#111827' : '#f9fafb' }}>
      {footerBlocks.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
          {footerBlocks.map(function(block) {
            return (
              <div key={block.id}>
                {renderBlock(block, primary, secondary, borderRadius, fontFamily, org)}
              </div>
            );
          })}
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: footerBlocks.length > 0 ? '1px solid ' + (headerDark ? '#374151' : '#e5e7eb') : 'none' }}>
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

  // ── Render blocks for a page ──────────────────────────────────────────────
  function renderPageBlocks(page) {
    var pageBlocks = blocksByPage[page.id] || [];
    if (pageBlocks.length === 0) return null;
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        {pageBlocks.map(function(block) {
          return (
            <div key={block.id}>
              {renderBlock(block, primary, secondary, borderRadius, fontFamily, org)}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Hardcoded fallback content for known page types ───────────────────────
  function renderFallbackContent(page) {
    var key = page.page_key;

    if (key === 'events') {
      return (
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h1>
          {events.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-semibold text-gray-500 mb-1">No upcoming events</p>
              <p className="text-sm text-gray-400">Check back soon for new events.</p>
            </div>
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
                    {event.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{event.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (key === 'news') {
      return (
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Latest Updates</h1>
          {announcements.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.952 9.168-5" />
              </svg>
              <p className="font-semibold text-gray-500 mb-1">No announcements yet</p>
              <p className="text-sm text-gray-400">Check back soon for updates.</p>
            </div>
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
      );
    }

    if (key === 'contact' || key === 'involved') {
      return (
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Get in Touch</h1>
            <p className="text-gray-500">Interested in joining or learning more? Send us a message.</p>
          </div>
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <JoinForm org={org} primary={primary} borderRadius={borderRadius} />
          </div>
        </div>
      );
    }

    if (key === 'about' || key === 'mission') {
      return (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{key === 'mission' ? 'Our Mission' : 'About Us'}</h1>
          {org.description
            ? <p className="text-gray-600 leading-relaxed text-lg">{org.description}</p>
            : <p className="text-gray-400 text-sm">Coming soon.</p>
          }
        </div>
      );
    }

    if (key === 'membership') {
      return (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Become a Member</h1>
          <p className="text-gray-500 mb-8">Join our community and make a difference.</p>
          <Link to={contactHref}
            className="inline-block text-white font-bold px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary, borderRadius: borderRadius }}>
            Apply for Membership
          </Link>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>{page.title}</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
        <p className="text-gray-400 text-sm">Content coming soon.</p>
      </div>
    );
  }

  // ── Render a single sub-page ──────────────────────────────────────────────
  function renderSubPage(page) {
    var pageBlocks = blocksByPage[page.id] || [];
    return (
      <main id="main-content" style={{ fontFamily: fontFamily, minHeight: '60vh', backgroundColor: '#ffffff' }}>
        {pageBlocks.length > 0
          ? renderPageBlocks(page)
          : renderFallbackContent(page)
        }
      </main>
    );
  }

  // ── Hero ──────────────────────────────────────────────────────────────────
  function renderHero() {
    if (template === 'classic') {
      return (
        <section id="section-home" className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: primary }} aria-label="Hero">
          <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="h-20 w-20 rounded-lg object-cover mb-5 border-4 border-white shadow-lg" />}
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{org.name}</h1>
              {org.tagline && <p className="text-lg text-white opacity-90 mb-8 max-w-lg">{org.tagline}</p>}
              <div className="flex gap-4 flex-wrap">
                <Link to={contactHref} className="bg-white font-bold px-7 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white hover:opacity-90 transition-opacity" style={{ color: primary, borderRadius: borderRadius }}>
                  Join Us
                </Link>
                <Link to={'/org/' + slug + '/about'} className="text-white font-bold px-7 py-3 text-sm border-2 border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white hover:opacity-90 transition-opacity" style={{ borderRadius: borderRadius }}>
                  Our Story
                </Link>
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
      );
    }

    if (template === 'impact') {
      return (
        <section id="section-home" className="py-28 px-6 text-center relative overflow-hidden" style={{ backgroundColor: '#0f172a' }} aria-label="Hero">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 60% 50%, ' + primary + ', transparent 70%)' }} />
          <div className="relative z-10 max-w-3xl mx-auto">
            {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="h-28 w-28 rounded-full object-cover mx-auto mb-6 border-4 shadow-2xl" style={{ borderColor: primary }} />}
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight uppercase tracking-tight">{org.name}</h1>
            {org.tagline && <p className="text-xl text-white opacity-70 mb-10 max-w-xl mx-auto">{org.tagline}</p>}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to={contactHref} className="text-white font-black px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius, color: getContrastColor(primary) }}>
                Take Action
              </Link>
              <Link to={'/org/' + slug + '/about'} className="text-white font-black px-8 py-3 text-sm border-2 border-white border-opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ borderRadius: borderRadius }}>
                Our Story
              </Link>
            </div>
          </div>
        </section>
      );
    }

    // Default: modern
    return (
      <section id="section-home" className="px-6 py-20 text-center" style={{ background: 'linear-gradient(135deg, ' + primary + '15 0%, ' + secondary + '08 100%)' }} aria-label="Hero">
        <div className="max-w-3xl mx-auto">
          {org.logo_url && <img src={org.logo_url} alt={org.name + ' logo'} className="h-24 w-24 rounded-full object-cover mx-auto mb-6 border-4 border-white shadow-lg" />}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">{org.name}</h1>
          {org.tagline && <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">{org.tagline}</p>}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to={contactHref} className="text-white font-bold px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: primary, borderRadius: borderRadius, color: getContrastColor(primary) }}>
              Get Involved
            </Link>
            <Link to={'/org/' + slug + '/about'} className="font-bold px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity" style={{ color: primary, border: '2px solid ' + primary, borderRadius: borderRadius }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Home page ─────────────────────────────────────────────────────────────
  function renderHomePage() {
    var homePage = enabledPages.find(function(p) { return p.page_key === 'home'; });
    var homeBlocks = homePage ? (blocksByPage[homePage.id] || []) : [];

    var hasHeroBlock = homeBlocks.some(function(b) { return b.block_type === 'hero'; });

    return (
      <main id="main-content" style={{ fontFamily: fontFamily }}>
        {!hasHeroBlock && renderHero()}

        {homeBlocks.length > 0 && (
          <div style={{ backgroundColor: '#ffffff' }}>
            <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
              {homeBlocks.map(function(block) {
                return (
                  <div key={block.id}>
                    {renderBlock(block, primary, secondary, borderRadius, fontFamily, org)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Single-page mode: render all other pages inline as stacked sections */}
        {!isMultiPage && enabledPages
          .filter(function(p) { return p.page_key !== 'home'; })
          .map(function(page, i) {
            var bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
            var pageBlocks = blocksByPage[page.id] || [];
            return (
              <section key={page.id} id={'section-' + page.page_key} style={{ backgroundColor: bg }} aria-label={page.title}>
                {pageBlocks.length > 0
                  ? renderPageBlocks(page)
                  : renderFallbackContent(page)
                }
              </section>
            );
          })
        }
      </main>
    );
  }

  // ── Route decision ────────────────────────────────────────────────────────

  // 404: slug given but page not found
  if (activePageSlug && !activePage) {
    return (
      <div style={{ fontFamily: fontFamily }}>
        {navBar}
        <PageNotFound org={org} slug={slug} primary={primary} borderRadius={borderRadius} />
        {footer}
      </div>
    );
  }

  // Sub-page
  if (activePageSlug && activePage && activePage.page_key !== 'home') {
    return (
      <div style={{ fontFamily: fontFamily }}>
        {navBar}
        {renderSubPage(activePage)}
        {footer}
      </div>
    );
  }

  // Home
  return (
    <div style={{ fontFamily: fontFamily }}>
      {navBar}
      {renderHomePage()}
      {footer}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function PublicOrganizationPage() {
  var { slug, pageSlug } = useParams();
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
        supabase.from('events').select('*').eq('organization_id', org.id).eq('publish_to_website', true).gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(6),
        supabase.from('announcements').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(5),
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

    // Fetch org admin email
    var adminRes = await supabase
      .from('memberships')
      .select('members(email)')
      .eq('organization_id', organization.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (adminRes.data && adminRes.data.members && adminRes.data.members.email) {
      var SUPABASE_URL = 'https://zktmhqrygknkodydbumq.supabase.co';
      await fetch(SUPABASE_URL + '/functions/v1/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact_inquiry',
          data: {
            adminEmail: adminRes.data.members.email,
            orgName: organization.name,
            senderName: joinForm.name.trim(),
            senderEmail: joinForm.email.trim(),
            message: joinForm.message.trim(),
            inboxUrl: window.location.origin + '/organizations/' + organization.id + '/inbox',
          },
        }),
      });
    }

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

  // ── Use new block-based renderer if site is configured and published ───────
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
          slug={slug}
          siteConfig={effectiveSiteConfig}
          pages={sitePages}
          navItems={siteNav}
          events={events}
          announcements={announcements}
          blocks={blocks}
          activePageSlug={pageSlug || null}
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