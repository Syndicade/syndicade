import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import { mascotErrorToast } from '../components/MascotToast';

// ── Tokens ────────────────────────────────────────────────────────────────────
var pageBg      = '#F8FAFC';
var cardBg      = '#FFFFFF';
var borderColor = '#E2E8F0';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

// ── Inline SVG icon helper ────────────────────────────────────────────────────
function Icon({ d, size, color, style }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 18}
      height={size || 18}
      fill="none"
      viewBox="0 0 24 24"
      stroke={color || 'currentColor'}
      strokeWidth={2}
      aria-hidden="true"
      style={style}
    >
      {Array.isArray(d)
        ? d.map(function(path, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" d={path} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" d={d} />}
    </svg>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow({ width }) {
  return (
    <div style={{ height:'14px', background:'#E2E8F0', borderRadius:'6px', width: width || '100%', marginBottom:'8px' }} aria-hidden="true" />
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }) {
  var [input, setInput] = useState('');

  function addTag() {
    var val = input.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
    if (!val || tags.includes(val) || tags.length >= 10) return;
    onChange(tags.concat([val]));
    setInput('');
  }

  function removeTag(tag) {
    onChange(tags.filter(function(t) { return t !== tag; }));
  }

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'8px' }}>
        {tags.map(function(tag) {
          return (
            <span key={tag} style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#EFF6FF', color:'#3B82F6', fontSize:'12px', fontWeight:600, padding:'3px 10px', borderRadius:'99px', border:'1px solid #BFDBFE' }}>
              {tag}
              <button
                onClick={function() { removeTag(tag); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#3B82F6', padding:'0 0 0 2px', lineHeight:1, display:'flex', alignItems:'center' }}
                aria-label={'Remove tag ' + tag}
                className="focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
              >
                <Icon d="M6 18L18 6M6 6l12 12" size={10} />
              </button>
            </span>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <input
          type="text"
          value={input}
          onChange={function(e) { setInput(e.target.value); }}
          onKeyDown={function(e) { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Add a tag and press Enter"
          style={{ flex:1, padding:'8px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'13px', color:textPrimary, background:'#FFFFFF', outline:'none' }}
          aria-label="Add tag"
          className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={30}
        />
        <button
          onClick={addTag}
          style={{ padding:'8px 14px', background:'#EFF6FF', color:'#3B82F6', border:'1px solid #BFDBFE', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}
          className="hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          Add
        </button>
      </div>
      <p style={{ fontSize:'11px', color:textMuted, marginTop:'4px' }}>{tags.length}/10 tags</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ListedOrgDashboard() {
  var { organizationId } = useParams();
  var navigate = useNavigate();

  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [org, setOrg] = useState(null);
  var [events, setEvents] = useState([]);
  var [eventsLoading, setEventsLoading] = useState(true);
  var [subscriptionAge, setSubscriptionAge] = useState(0); // months
  var [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  // Editable listing fields
  var [name, setName] = useState('');
  var [description, setDescription] = useState('');
  var [website, setWebsite] = useState('');
  var [location, setLocation] = useState('');
  var [tags, setTags] = useState([]);

  // Create event modal state
  var [showEventModal, setShowEventModal] = useState(false);
  var [eventTitle, setEventTitle] = useState('');
  var [eventDate, setEventDate] = useState('');
  var [eventTime, setEventTime] = useState('');
  var [eventLocation, setEventLocation] = useState('');
  var [eventDescription, setEventDescription] = useState('');
  var [creatingEvent, setCreatingEvent] = useState(false);

  useEffect(function() { init(); }, [organizationId]);

  async function init() {
    try {
      var authResult = await supabase.auth.getUser();
      if (authResult.error || !authResult.data.user) { navigate('/login'); return; }
      var userId = authResult.data.user.id;

      // Verify membership
      var memResult = await supabase
        .from('memberships')
        .select('role,status')
        .eq('organization_id', organizationId)
        .eq('member_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!memResult.data) { navigate('/dashboard'); return; }

      // Load org
      var orgResult = await supabase
        .from('organizations')
        .select('id,name,description,logo_url,location,search_tags,is_verified_nonprofit')
        .eq('id', organizationId)
        .single();

      if (orgResult.error) throw orgResult.error;
      var orgData = orgResult.data;
      setOrg(orgData);
      setName(orgData.name || '');
      setDescription(orgData.description || '');
      setLocation(orgData.location || '');
      setTags(orgData.search_tags || []);

      // Load website from org_site_config if available
      var siteResult = await supabase
        .from('org_site_config')
        .select('website_url')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (siteResult.data && siteResult.data.website_url) {
        setWebsite(siteResult.data.website_url);
      }

      // Load subscription age
      var subResult = await supabase
        .from('subscriptions')
        .select('created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .maybeSingle();

      if (subResult.data && subResult.data.created_at) {
        var months = Math.floor((Date.now() - new Date(subResult.data.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30));
        setSubscriptionAge(months);
      }

    } catch(err) {
      toast.error('Failed to load listing.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(function() {
    if (!organizationId) return;
    loadEvents();
  }, [organizationId]);

  async function loadEvents() {
    setEventsLoading(true);
    try {
      var result = await supabase
        .from('events')
        .select('id,title,start_time,location,is_public')
        .eq('organization_id', organizationId)
        .order('start_time', { ascending: false })
        .limit(20);

      var evList = result.data || [];
      setEvents(evList);

      // Show upgrade nudge after 6+ months OR 3+ events posted
      if (subscriptionAge >= 6 || evList.length >= 3) {
        setShowUpgradeNudge(true);
      }
    } catch(err) {
      // non-critical
    } finally {
      setEventsLoading(false);
    }
  }

  // Re-evaluate nudge when subscription age or events load
  useEffect(function() {
    if (subscriptionAge >= 6 || events.length >= 3) {
      setShowUpgradeNudge(true);
    }
  }, [subscriptionAge, events.length]);

  async function saveListing() {
    if (!name.trim()) { toast.error('Organization name is required.'); return; }
    setSaving(true);
    try {
      var { error } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          description: description.trim(),
          location: location.trim(),
          search_tags: tags,
        })
        .eq('id', organizationId);

      if (error) throw error;

      // Save website to org_site_config
      if (website.trim()) {
        await supabase
          .from('org_site_config')
          .upsert({ organization_id: organizationId, website_url: website.trim() }, { onConflict: 'organization_id' });
      }

      mascotSuccessToast('Listing saved!', 'Your public profile has been updated.');
    } catch(err) {
      mascotErrorToast('Failed to save listing.', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function createEvent() {
    if (!eventTitle.trim()) { toast.error('Event title is required.'); return; }
    if (!eventDate) { toast.error('Event date is required.'); return; }
    setCreatingEvent(true);
    try {
      var startTime = eventDate + (eventTime ? 'T' + eventTime + ':00' : 'T00:00:00');
      var { error } = await supabase
        .from('events')
        .insert({
          organization_id: organizationId,
          title: eventTitle.trim(),
          start_time: startTime,
          location: eventLocation.trim() || null,
          description: eventDescription.trim() || null,
          is_public: true,
          approval_status: 'approved',
        });

      if (error) throw error;

      mascotSuccessToast('Event submitted!', 'It will appear on the public events page.');
      setShowEventModal(false);
      setEventTitle(''); setEventDate(''); setEventTime(''); setEventLocation(''); setEventDescription('');
      loadEvents();
    } catch(err) {
      mascotErrorToast('Failed to create event.', 'Please try again.');
    } finally {
      setCreatingEvent(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    } catch(e) { return iso; }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background:pageBg, minHeight:'100vh', padding:'32px 16px' }} aria-busy="true" aria-label="Loading listing">
        <div style={{ maxWidth:'720px', margin:'0 auto' }}>
          <SkeletonRow width="200px" />
          <SkeletonRow width="120px" />
          <div style={{ height:'32px' }} />
          <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'24px', marginBottom:'16px' }}>
            {[1,2,3,4].map(function(i) { return <SkeletonRow key={i} width={i % 2 === 0 ? '60%' : '90%'} />; })}
          </div>
          <div style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'24px' }}>
            {[1,2,3].map(function(i) { return <SkeletonRow key={i} width="80%" />; })}
          </div>
        </div>
      </div>
    );
  }

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:pageBg, minHeight:'100vh', padding:'32px 16px' }}>
      <div style={{ maxWidth:'720px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px', gap:'12px', flexWrap:'wrap' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <h1 style={{ fontSize:'28px', fontWeight:800, color:textPrimary, margin:0 }}>
                {org ? org.name : 'Your Listing'}
              </h1>
              <span style={{ fontSize:'10px', fontWeight:700, color:'#3B82F6', background:'#EFF6FF', border:'1px solid #BFDBFE', padding:'2px 8px', borderRadius:'99px', textTransform:'uppercase', letterSpacing:'1px', flexShrink:0 }}>
                Listed Plan
              </span>
            </div>
            <p style={{ color:textMuted, fontSize:'14px', margin:0 }}>
              Manage your public listing and submit events to the Syndicade directory.
            </p>
          </div>
          <button
            onClick={function() { navigate('/dashboard'); }}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:cardBg, border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'13px', fontWeight:600, color:textSecondary, cursor:'pointer', flexShrink:0 }}
            className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
          >
            <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" size={14} />
            Dashboard
          </button>
        </div>

        {/* Upgrade nudge */}
        {showUpgradeNudge && (
          <div
            role="region"
            aria-label="Upgrade prompt"
            style={{ background:'rgba(245,183,49,0.07)', border:'1px solid rgba(245,183,49,0.35)', borderRadius:'12px', padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'flex-start', gap:'14px' }}
          >
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(245,183,49,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} aria-hidden="true">
              <Icon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" size={16} color="#B45309" />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'14px', fontWeight:700, color:'#92400E', margin:'0 0 2px' }}>
                {events.length >= 3
                  ? "You've posted " + events.length + ' events — ready for more?'
                  : "You've been listed for " + subscriptionAge + ' months — ready for more?'
                }
              </p>
              <p style={{ fontSize:'13px', color:'#B45309', margin:'0 0 10px', lineHeight:1.5 }}>
                Upgrade to Starter to manage RSVPs, build a member community, send announcements, and more.
              </p>
              <button
                onClick={function() { navigate('/pricing'); }}
                style={{ padding:'7px 16px', background:'#F5B731', color:'#1A0000', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                className="hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1"
              >
                See Plans
              </button>
            </div>
            <button
              onClick={function() { setShowUpgradeNudge(false); }}
              style={{ background:'none', border:'none', cursor:'pointer', color:textMuted, padding:'2px', flexShrink:0 }}
              aria-label="Dismiss upgrade prompt"
              className="focus:outline-none focus:ring-1 focus:ring-slate-400 rounded"
            >
              <Icon d="M6 18L18 6M6 6l12 12" size={14} />
            </button>
          </div>
        )}

        {/* Listing info card */}
        <section
          aria-labelledby="listing-info-heading"
          style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'24px', marginBottom:'16px' }}
        >
          <h2 id="listing-info-heading" style={{ fontSize:'16px', fontWeight:800, color:textPrimary, margin:'0 0 20px' }}>
            Listing Information
          </h2>

          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Name */}
            <div>
              <label htmlFor="listing-name" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'6px' }}>
                Organization Name <span style={{ color:'#EF4444' }} aria-hidden="true">*</span>
              </label>
              <input
                id="listing-name"
                type="text"
                value={name}
                onChange={function(e) { setName(e.target.value); }}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, background:'#FFFFFF', boxSizing:'border-box', outline:'none' }}
                aria-required="true"
                maxLength={120}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="listing-description" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'6px' }}>
                Description
                <span style={{ fontSize:'11px', fontWeight:400, color:textMuted, marginLeft:'6px' }}>Shown on your public profile (max 280 chars)</span>
              </label>
              <textarea
                id="listing-description"
                value={description}
                onChange={function(e) { setDescription(e.target.value); }}
                rows={3}
                maxLength={280}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, background:'#FFFFFF', resize:'vertical', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p style={{ fontSize:'11px', color:textMuted, marginTop:'2px', textAlign:'right' }}>{description.length}/280</p>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="listing-website" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'6px' }}>
                Website URL
              </label>
              <input
                id="listing-website"
                type="url"
                value={website}
                onChange={function(e) { setWebsite(e.target.value); }}
                placeholder="https://yourorg.org"
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, background:'#FFFFFF', boxSizing:'border-box', outline:'none' }}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="listing-location" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'6px' }}>
                Location
                <span style={{ fontSize:'11px', fontWeight:400, color:textMuted, marginLeft:'6px' }}>e.g. Toledo, OH</span>
              </label>
              <input
                id="listing-location"
                type="text"
                value={location}
                onChange={function(e) { setLocation(e.target.value); }}
                placeholder="City, State"
                style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, background:'#FFFFFF', boxSizing:'border-box', outline:'none' }}
                maxLength={100}
                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'6px' }}>
                Discovery Tags
                <span style={{ fontSize:'11px', fontWeight:400, color:textMuted, marginLeft:'6px' }}>Help people find you on /explore</span>
              </label>
              <TagInput tags={tags} onChange={setTags} />
            </div>

          </div>

          <div style={{ marginTop:'24px', paddingTop:'20px', borderTop:'1px solid '+borderColor, display:'flex', justifyContent:'flex-end' }}>
            <button
              onClick={saveListing}
              disabled={saving}
              style={{ padding:'10px 24px', background: saving ? '#93C5FD' : '#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}
              aria-busy={saving}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {saving ? 'Saving...' : 'Save Listing'}
            </button>
          </div>
        </section>

        {/* Events card */}
        <section
          aria-labelledby="events-heading"
          style={{ background:cardBg, border:'1px solid '+borderColor, borderRadius:'12px', padding:'24px', marginBottom:'16px' }}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', gap:'12px', flexWrap:'wrap' }}>
            <div>
              <h2 id="events-heading" style={{ fontSize:'16px', fontWeight:800, color:textPrimary, margin:'0 0 2px' }}>Your Events</h2>
              <p style={{ fontSize:'13px', color:textMuted, margin:0 }}>Events appear publicly on the Syndicade event directory.</p>
            </div>
            <button
              onClick={function() { setShowEventModal(true); }}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', flexShrink:0 }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Icon d="M12 4v16m8-8H4" size={14} color="#FFFFFF" />
              Submit Event
            </button>
          </div>

          {eventsLoading ? (
            <div aria-busy="true" aria-label="Loading events">
              {[1,2,3].map(function(i) {
                return (
                  <div key={i} style={{ display:'flex', gap:'12px', padding:'12px 0', borderBottom:'1px solid '+borderColor }}>
                    <div style={{ width:'44px', height:'44px', background:'#F1F5F9', borderRadius:'8px', flexShrink:0 }} aria-hidden="true" />
                    <div style={{ flex:1 }}>
                      <SkeletonRow width="60%" />
                      <SkeletonRow width="40%" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 16px' }} role="status">
              <div style={{ width:'48px', height:'48px', background:'#F1F5F9', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }} aria-hidden="true">
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={22} color="#94A3B8" />
              </div>
              <p style={{ fontSize:'15px', fontWeight:700, color:textPrimary, margin:'0 0 4px' }}>No events yet</p>
              <p style={{ fontSize:'13px', color:textMuted, margin:'0 0 16px' }}>Submit your first event to appear in the public directory.</p>
              <button
                onClick={function() { setShowEventModal(true); }}
                style={{ padding:'8px 20px', background:'#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Submit Your First Event
              </button>
            </div>
          ) : (
            <div role="list" aria-label="Your events">
              {events.map(function(ev, idx) {
                return (
                  <div
                    key={ev.id}
                    role="listitem"
                    style={{ display:'flex', alignItems:'center', gap:'14px', padding:'12px 0', borderBottom: idx < events.length - 1 ? '1px solid '+borderColor : 'none' }}
                  >
                    <div style={{ width:'44px', height:'44px', background:'#DBEAFE', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} aria-hidden="true">
                      <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={18} color="#3B82F6" />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'14px', fontWeight:600, color:textPrimary, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</p>
                      <p style={{ fontSize:'12px', color:textMuted, margin:0 }}>
                        {formatDate(ev.start_time)}
                        {ev.location ? ' · ' + ev.location : ''}
                      </p>
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background: ev.is_public ? '#DCFCE7' : '#F1F5F9', color: ev.is_public ? '#16A34A' : textMuted, flexShrink:0 }}>
                      {ev.is_public ? 'Public' : 'Draft'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* What's not included card */}
        <section
          aria-labelledby="plan-limits-heading"
          style={{ background:'#FAFAFA', border:'1px solid '+borderColor, borderRadius:'12px', padding:'20px 24px' }}
        >
          <h2 id="plan-limits-heading" style={{ fontSize:'14px', fontWeight:700, color:textMuted, margin:'0 0 12px', textTransform:'uppercase', letterSpacing:'1px' }}>
            Listed Plan Includes
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {[
              { label:'Public org profile on /explore', included:true },
              { label:'Events listed on /discover', included:true },
              { label:'Website link on your profile', included:true },
              { label:'Discovery tags', included:true },
              { label:'Member management', included:false },
              { label:'Email blasts', included:false },
              { label:'Community board', included:false },
              { label:'Analytics & RSVPs', included:false },
            ].map(function(item) {
              return (
                <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'16px', height:'16px', borderRadius:'50%', background: item.included ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} aria-hidden="true">
                    <Icon
                      d={item.included ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
                      size={9}
                      color={item.included ? '#16A34A' : '#EF4444'}
                    />
                  </div>
                  <span style={{ fontSize:'12px', color: item.included ? textSecondary : textMuted }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid '+borderColor, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
            <p style={{ fontSize:'13px', color:textMuted, margin:0 }}>Need more? Upgrade to Starter for $29.99/mo.</p>
            <button
              onClick={function() { navigate('/pricing'); }}
              style={{ padding:'7px 16px', background:'transparent', color:'#3B82F6', border:'1px solid #BFDBFE', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}
              className="hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              View Plans
            </button>
          </div>
        </section>

      </div>

      {/* Submit Event modal */}
      {showEventModal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', zIndex:60 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
          onClick={function(e) { if (e.target === e.currentTarget) setShowEventModal(false); }}
        >
          <div style={{ background:cardBg, borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'480px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <h2 id="event-modal-title" style={{ fontSize:'18px', fontWeight:800, color:textPrimary, margin:0 }}>Submit an Event</h2>
              <button
                onClick={function() { setShowEventModal(false); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:textMuted, padding:'4px' }}
                aria-label="Close modal"
                className="focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
              >
                <Icon d="M6 18L18 6M6 6l12 12" size={18} />
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label htmlFor="ev-title" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'5px' }}>
                  Event Title <span style={{ color:'#EF4444' }} aria-hidden="true">*</span>
                </label>
                <input
                  id="ev-title"
                  type="text"
                  value={eventTitle}
                  onChange={function(e) { setEventTitle(e.target.value); }}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, boxSizing:'border-box', outline:'none' }}
                  aria-required="true"
                  maxLength={120}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label htmlFor="ev-date" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'5px' }}>
                    Date <span style={{ color:'#EF4444' }} aria-hidden="true">*</span>
                  </label>
                  <input
                    id="ev-date"
                    type="date"
                    value={eventDate}
                    onChange={function(e) { setEventDate(e.target.value); }}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, boxSizing:'border-box', outline:'none' }}
                    aria-required="true"
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="ev-time" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'5px' }}>
                    Time <span style={{ fontSize:'11px', fontWeight:400, color:textMuted }}>(optional)</span>
                  </label>
                  <input
                    id="ev-time"
                    type="time"
                    value={eventTime}
                    onChange={function(e) { setEventTime(e.target.value); }}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, boxSizing:'border-box', outline:'none' }}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ev-location" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'5px' }}>
                  Location <span style={{ fontSize:'11px', fontWeight:400, color:textMuted }}>(optional)</span>
                </label>
                <input
                  id="ev-location"
                  type="text"
                  value={eventLocation}
                  onChange={function(e) { setEventLocation(e.target.value); }}
                  placeholder="Address or venue name"
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, boxSizing:'border-box', outline:'none' }}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ev-description" style={{ display:'block', fontSize:'13px', fontWeight:600, color:textPrimary, marginBottom:'5px' }}>
                  Description <span style={{ fontSize:'11px', fontWeight:400, color:textMuted }}>(optional)</span>
                </label>
                <textarea
                  id="ev-description"
                  value={eventDescription}
                  onChange={function(e) { setEventDescription(e.target.value); }}
                  rows={3}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', color:textPrimary, resize:'vertical', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
              <button
                onClick={createEvent}
                disabled={creatingEvent}
                style={{ flex:1, padding:'11px', background: creatingEvent ? '#93C5FD' : '#3B82F6', color:'#FFFFFF', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:700, cursor: creatingEvent ? 'not-allowed' : 'pointer' }}
                aria-busy={creatingEvent}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {creatingEvent ? 'Submitting...' : 'Submit Event'}
              </button>
              <button
                onClick={function() { setShowEventModal(false); }}
                style={{ padding:'11px 20px', background:'transparent', color:textMuted, border:'1px solid '+borderColor, borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}
                className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListedOrgDashboard;