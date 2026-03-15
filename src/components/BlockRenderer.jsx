import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ── WCAG contrast helper ──────────────────────────────────────────────────────
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

// ── Contact form (self-contained) ─────────────────────────────────────────────
function BlockContactForm({ org, primary, borderRadius }) {
  var [form, setForm] = useState({ name: '', email: '', message: '' });
  var [submitting, setSubmitting] = useState(false);
  var [submitted, setSubmitted] = useState(false);

  function set(k, v) { setForm(function(p) { return Object.assign({}, p, { [k]: v }); }); }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.message) { toast.error('Please fill in all fields'); return; }
    setSubmitting(true);
    try {
      var res = await supabase.from('contact_submissions').insert([{
        organization_id: org.id,
        name: form.name,
        email: form.email,
        message: form.message,
      }]);
      if (res.error) throw res.error;
      setSubmitted(true);
      toast.success('Message sent!');
    } catch (err) {
      toast.error('Could not send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return (
    <div className="text-center py-8">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primary + '20' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primary }} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="font-bold text-gray-900 text-lg mb-1">Message sent!</p>
      <p className="text-gray-500 text-sm">We'll get back to you soon.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="block-contact-name" className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
          <input id="block-contact-name" type="text" value={form.name} onChange={function(e) { set('name', e.target.value); }}
            placeholder="Your name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="block-contact-email" className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input id="block-contact-email" type="email" value={form.email} onChange={function(e) { set('email', e.target.value); }}
            placeholder="your@email.com" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label htmlFor="block-contact-msg" className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
        <textarea id="block-contact-msg" value={form.message} onChange={function(e) { set('message', e.target.value); }}
          rows={4} placeholder="How can we help?" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <button onClick={handleSubmit} disabled={submitting}
        className="w-full py-3 font-bold text-sm rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
}

// ── Smart Events List Block ───────────────────────────────────────────────────
function EventsListBlock({ block, primary, borderRadius }) {
  var c = block.content || {};
  var [events, setEvents] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    async function fetch() {
      setLoading(true);
      try {
        var now = new Date().toISOString();
        var result = await supabase
          .from('events')
          .select('id, title, description, start_time, end_time, location, event_type, is_virtual, virtual_link, flier_url')
          .eq('organization_id', block.organization_id)
          .eq('publish_to_website', true)
          .eq('is_cancelled', false)
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(c.limit || 3);
        if (!result.error) setEvents(result.data || []);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [block.organization_id, c.limit]);

  function formatDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  function formatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div>
      {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8">{c.heading || 'Upcoming Events'}</h2>}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(function(i) { return <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />; })}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">No upcoming events</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon for new events.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(function(event) {
            return (
              <div key={event.id} className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center"
                  style={{ backgroundColor: primary, color: getContrastColor(primary) }}>
                  <p className="text-xs font-bold leading-tight uppercase">{new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}</p>
                  <p className="text-xl font-extrabold leading-tight">{new Date(event.start_time).getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-tight mb-1">{event.title}</p>
                  <p className="text-xs text-gray-500 mb-1">{formatDate(event.start_time)} at {formatTime(event.start_time)}</p>
                  {event.is_virtual
                    ? <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Virtual</span>
                    : event.location && <p className="text-xs text-gray-400 truncate">{event.location}</p>
                  }
                </div>
                {event.virtual_link && event.is_virtual && (
                  <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 self-center px-3 py-1.5 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
                    Join
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Smart Team Grid Block ─────────────────────────────────────────────────────
function TeamGridBlock({ block, primary, org }) {
  var c = block.content || {};
  var [members, setMembers] = useState([]);
  var [loading, setLoading] = useState(true);
  var mode = c.mode || 'auto';

  useEffect(function() {
    if (mode !== 'auto') { setLoading(false); return; }
    async function fetch() {
      setLoading(true);
      try {
        var result = await supabase
          .from('memberships')
          .select('role, custom_title, member_id, members(first_name, last_name, display_name, bio, profile_photo_url, avatar_url, is_public_profile)')
          .eq('organization_id', block.organization_id)
          .eq('show_in_profile', true)
          .eq('status', 'active');
        if (!result.error) {
          var data = (result.data || []).filter(function(m) {
            return m.members && m.members.is_public_profile !== false;
          });
          setMembers(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [block.organization_id, mode]);

  var manualMembers = c.members || [];

  return (
    <div>
      {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{c.heading}</h2>}
      {mode === 'auto' ? (
        loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(function(i) { return <div key={i} className="text-center"><div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse mx-auto mb-3" /><div className="h-3 bg-gray-100 rounded animate-pulse w-20 mx-auto mb-1" /><div className="h-2 bg-gray-100 rounded animate-pulse w-16 mx-auto" /></div>; })}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-500 font-medium">No public team members yet</p>
            <p className="text-gray-400 text-sm mt-1">Members can enable public profiles in their settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {members.map(function(m, i) {
              var member = m.members;
              var name = member.display_name || (member.first_name + ' ' + member.last_name).trim();
              var title = m.custom_title || m.role;
              var photo = member.profile_photo_url || member.avatar_url;
              return (
                <div key={i} className="text-center">
                  {photo
                    ? <img src={photo} alt={'Photo of ' + name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3 shadow-md" />
                    : <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold shadow-md"
                        style={{ backgroundColor: primary, color: getContrastColor(primary) }}>
                        {(name || 'T').charAt(0)}
                      </div>
                  }
                  {name && <p className="font-bold text-gray-900 text-sm">{name}</p>}
                  {title && <p className="text-xs text-gray-500 mt-0.5 capitalize">{title}</p>}
                  {member.bio && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{member.bio}</p>}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {manualMembers.map(function(member, i) {
            return (
              <div key={i} className="text-center">
                {member.photo_url
                  ? <img src={member.photo_url} alt={member.photo_alt || (member.name ? 'Photo of ' + member.name : 'Team member')} className="w-24 h-24 rounded-full object-cover mx-auto mb-3 shadow-md" />
                  : <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold shadow-md"
                      style={{ backgroundColor: primary, color: getContrastColor(primary) }}>
                      {(member.name || 'T').charAt(0)}
                    </div>
                }
                {member.name && <p className="font-bold text-gray-900 text-sm">{member.name}</p>}
                {member.title && <p className="text-xs text-gray-500 mt-0.5">{member.title}</p>}
                {member.bio && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{member.bio}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export function renderBlock(block, primary, secondary, borderRadius, fontFamily, org) {
  var c = block.content || {};
  var type = block.block_type;
  var key = block.id;

  // HERO
  if (type === 'hero') {
    var heroAlign = c.align === 'left' ? 'text-left items-start' : c.align === 'right' ? 'text-right items-end' : 'text-center items-center';
    var heroBg = c.image_url
      ? { backgroundImage: 'url(' + c.image_url + ')', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }
      : { background: 'linear-gradient(135deg, ' + primary + '15 0%, ' + secondary + '08 100%)' };
    return (
      <div key={key} className={'py-20 px-8 rounded-2xl flex flex-col gap-6 ' + heroAlign} style={heroBg} role={c.image_url ? 'img' : undefined} aria-label={c.image_url ? (c.image_alt || 'Hero banner image') : undefined}>
        {c.image_url && <div className="absolute inset-0 bg-black bg-opacity-30 rounded-2xl" aria-hidden="true" />}
        <div className={'relative z-10 flex flex-col gap-6 ' + heroAlign}>
          {c.headline && <h1 className={'text-4xl md:text-5xl font-extrabold leading-tight max-w-3xl ' + (c.image_url ? 'text-white' : 'text-gray-900')}>{c.headline}</h1>}
          {c.subtext && <p className={'text-lg max-w-2xl ' + (c.image_url ? 'text-white text-opacity-90' : 'text-gray-600')}>{c.subtext}</p>}
          {c.cta_label && (
            <a href={c.cta_url || '#'}
              className="inline-block font-bold px-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
              {c.cta_label}
            </a>
          )}
        </div>
      </div>
    );
  }

  // RICH TEXT
  if (type === 'rich_text') {
    return (
      <div key={key} className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: c.body || '' }} />
    );
  }

  // IMAGE + TEXT
  if (type === 'image_text') {
    var isLeft = c.image_position !== 'right';
    return (
      <div key={key} className={'flex flex-col md:flex-row gap-10 items-center ' + (isLeft ? '' : 'md:flex-row-reverse')}>
        {c.image_url && <img src={c.image_url} alt={c.image_alt || c.heading || 'Section image'} className="w-full md:w-1/2 rounded-xl object-cover shadow-md" style={{ maxHeight: '380px' }} />}
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
      <div key={key} className="rounded-xl overflow-hidden shadow-md">
        {c.image_url
          ? <img src={c.image_url} alt={c.image_alt || c.caption || 'Section image'} className="w-full object-cover" style={{ height: heightMap[c.height] || '380px' }} />
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
      <div key={key}>
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
      <div key={key} className="border-l-4 pl-8 py-4" style={{ borderColor: primary }}>
        {c.quote && <p className="text-xl text-gray-700 italic leading-relaxed mb-4">"{c.quote}"</p>}
        {c.attribution && (
          <p className="font-bold text-gray-900">
            {c.attribution}
            {c.role && <span className="text-gray-500 font-normal">, {c.role}</span>}
          </p>
        )}
      </div>
    );
  }

  // STATS
  if (type === 'stats') {
    var statCount = (c.items || []).length;
    var cols = statCount <= 2 ? 'grid-cols-2' : statCount === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4';
    return (
      <div key={key} className="text-center">
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-10">{c.heading}</h2>}
        <div className={'grid gap-8 ' + cols}>
          {(c.items || []).map(function(item, i) {
            return (
              <div key={i} className="flex flex-col items-center">
                <p className="text-4xl font-extrabold mb-2" style={{ color: primary }}>
                  {item.prefix || ''}{item.value || '0'}{item.suffix || ''}
                </p>
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
      <div key={key} className="rounded-2xl px-10 py-12 text-center" style={{ backgroundColor: c.bg_color || primary, color: getContrastColor(c.bg_color || primary) }}>
        {c.heading && <h2 className="text-3xl font-extrabold mb-3">{c.heading}</h2>}
        {c.subtext && <p className="text-lg opacity-90 mb-8">{c.subtext}</p>}
        {c.cta_label && (
          <a href={c.cta_url || '#'}
            className="inline-block bg-white font-bold px-8 py-3 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-opacity"
            style={{ color: c.bg_color || primary, borderRadius: borderRadius }}>
            {c.cta_label}
          </a>
        )}
      </div>
    );
  }

  // EMAIL SIGNUP
  if (type === 'email_signup') {
    return (
      <div key={key} className="bg-gray-50 rounded-2xl px-10 py-12 text-center border border-gray-200">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        <div className="flex gap-3 max-w-md mx-auto">
          <input type="email" placeholder={c.placeholder || 'Enter your email'}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button className="px-6 py-3 font-bold text-sm rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
            style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
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
      <div key={key} className="max-w-lg mx-auto">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6 text-center">{c.subtext}</p>}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <BlockContactForm org={org} primary={primary} borderRadius={borderRadius} />
        </div>
      </div>
    );
  }

  // DONATION BUTTON
  if (type === 'donation_button') {
    return (
      <div key={key} className="text-center py-8">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        <a href={c.url || '#'}
          className="inline-block font-bold px-10 py-4 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
          style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
          {c.button_label || 'Donate Now'}
        </a>
        <p className="text-xs text-gray-400 mt-3">Donation integration coming soon.</p>
      </div>
    );
  }

  // VOLUNTEER SIGNUP
  if (type === 'volunteer_signup') {
    return (
      <div key={key} className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        <button className="font-bold px-10 py-4 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
          style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
          {c.button_label || 'Sign Up to Volunteer'}
        </button>
        <p className="text-xs text-gray-400 mt-3">Volunteer signup integration coming soon.</p>
      </div>
    );
  }

  // PETITION
  if (type === 'petition') {
    return (
      <div key={key} className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
        {c.heading && <h2 className="text-2xl font-bold text-gray-900 mb-2">{c.heading}</h2>}
        {c.subtext && <p className="text-gray-500 mb-6">{c.subtext}</p>}
        {c.goal && <p className="text-sm text-gray-500 mb-4">Goal: {c.goal} signatures</p>}
        <button className="font-bold px-10 py-4 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
          style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
          {c.button_label || 'Sign the Petition'}
        </button>
        <p className="text-xs text-gray-400 mt-3">Petition integration coming soon.</p>
      </div>
    );
  }

  // EVENTS LIST
  if (type === 'events_list') {
    return <EventsListBlock key={key} block={block} primary={primary} borderRadius={borderRadius} />;
  }

  // PROGRAMS LIST
  if (type === 'programs_list') {
    return (
      <div key={key}>
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
    return <TeamGridBlock key={key} block={block} primary={primary} org={org} />;
  }

  // MEMBERSHIP TIERS
  if (type === 'membership_tiers') {
    var tierCount = (c.tiers || []).length;
    var tierCols = tierCount === 2 ? 'grid-cols-2' : tierCount >= 3 ? 'grid-cols-3' : 'grid-cols-1';
    return (
      <div key={key}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{c.heading}</h2>}
        <div className={'grid gap-6 ' + tierCols}>
          {(c.tiers || []).map(function(tier, i) {
            return (
              <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center shadow-sm hover:border-blue-300 transition-colors">
                {tier.name && <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>{tier.name}</p>}
                {tier.price && <p className="text-4xl font-extrabold text-gray-900 mb-1">{tier.price}</p>}
                {tier.period && <p className="text-sm text-gray-400 mb-6">{tier.period}</p>}
                {(tier.features || []).filter(Boolean).length > 0 && (
                  <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
                    {tier.features.filter(Boolean).map(function(f, fi) {
                      return (
                        <li key={fi} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: primary + '20' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primary }} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          {f}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {tier.cta_label && (
                  <a href="#contact"
                    className="block w-full text-center font-bold py-3 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
                    style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
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
      <div key={key}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8">{c.heading}</h2>}
        <div className="space-y-3">
          {(c.items || []).map(function(item, i) {
            return (
              <details key={i} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 list-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  {item.question}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
      <div key={key} className="text-center">
        {c.heading && <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">{c.heading}</p>}
        <div className="flex flex-wrap items-center justify-center gap-8">
          {(c.partners || []).map(function(partner, i) {
            var inner = partner.logo_url
              ? <img src={partner.logo_url} alt={partner.logo_alt || (partner.name ? partner.name + ' logo' : 'Partner logo')} className="h-12 object-contain grayscale hover:grayscale-0 transition-all" />
              : <span className="text-gray-400 font-semibold text-sm">{partner.name}</span>;
            return partner.url
              ? <a key={i} href={partner.url} target="_blank" rel="noopener noreferrer" aria-label={partner.name}>{inner}</a>
              : <div key={i}>{inner}</div>;
          })}
        </div>
      </div>
    );
  }

  // COLUMN CONTAINER
  if (type === 'column_container') {
    var colCount = c.columns || 2;
    var colGrid = colCount === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';
    var items = c.items || [];
    while (items.length < colCount) { items = items.concat([{ heading: '', body: '', image_url: '', image_alt: '', button_label: '', button_url: '' }]); }
    items = items.slice(0, colCount);

    return (
      <div key={key}>
        {c.heading && <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{c.heading}</h2>}
        <div className={'grid gap-8 ' + colGrid}>
          {items.map(function(col, i) {
            var align = c.align === 'center' ? 'text-center items-center' : c.align === 'right' ? 'text-right items-end' : 'text-left items-start';
            return (
              <div key={i} className={'flex flex-col gap-4 ' + align}>
                {col.image_url && (
                  <img
                    src={col.image_url}
                    alt={col.image_alt || col.heading || ('Column ' + (i + 1) + ' image')}
                    className="w-full rounded-xl object-cover shadow-sm"
                    style={{ maxHeight: '240px' }}
                  />
                )}
                {col.heading && (
                  <h3 className="text-xl font-bold text-gray-900">{col.heading}</h3>
                )}
                {col.body && (
                  <p className="text-gray-600 leading-relaxed text-sm">{col.body}</p>
                )}
                {col.button_label && (
                  <a
                    href={col.button_url || '#'}
                    className="inline-block font-bold px-6 py-2.5 text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
                    style={{ backgroundColor: primary, color: getContrastColor(primary), borderRadius: borderRadius }}>
                    {col.button_label}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // DIVIDER
  if (type === 'divider') {
    var sizeMap = { small: '16px', medium: '40px', large: '80px' };
    return c.style === 'line'
      ? <hr key={key} style={{ margin: (sizeMap[c.size] || '40px') + ' 0', borderColor: '#e5e7eb' }} />
      : <div key={key} style={{ height: sizeMap[c.size] || '40px' }} aria-hidden="true" />;
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
      <div key={key} className="text-center">
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

// ── Block preview wrapper (used in editor) ────────────────────────────────────
export function BlockPreview({ block, primary, secondary, borderRadius, fontFamily, org }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 overflow-auto max-h-96 pointer-events-none select-none">
      <div style={{ fontFamily: fontFamily || 'Inter, system-ui, sans-serif', fontSize: '14px', transform: 'scale(0.85)', transformOrigin: 'top left', width: '117%' }}>
        {renderBlock(block, primary || '#3B82F6', secondary || '#1E40AF', borderRadius || '8px', fontFamily || 'Inter, system-ui, sans-serif', org || {})}
      </div>
    </div>
  );
}