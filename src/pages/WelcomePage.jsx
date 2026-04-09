import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ d, size, color, strokeWidth, style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 20} height={size || 20}
      viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'}
      strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"
      style={style || {}} aria-hidden="true">
      {Array.isArray(d)
        ? d.map(function(p, i) { return <path key={i} d={p} />; })
        : <path d={d} />}
    </svg>
  );
}

var CHECK     = 'M5 13l4 4L19 7';
var CHEVRON_R = 'M9 18l6-6-6-6';
var CHEVRON_L = 'M15 18l-6-6 6-6';
var SEARCH_D  = ['M21 21l-4.35-4.35', 'M17 11A6 6 0 105 11a6 6 0 0012 0z'];
var ORG_ICON  = 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
var BELL_ICON = ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'];
var PIN_ICON  = ['M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', 'M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z'];
var LOCK_ICON = ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'];

var INTERESTS = [
  'Civic & Community', 'Arts & Culture', 'Sports & Fitness',
  'Education', 'Faith & Spirituality', 'Environment',
  'Health & Wellness', 'Technology', 'Volunteering', 'Youth & Family',
  'Neighborhood', 'Seniors', 'Animals & Pets', 'Music',
];

var inputBase = {
  width: '100%', padding: '11px 14px', background: '#1E2845',
  border: '1px solid #2A3550', borderRadius: '8px', color: '#FFFFFF',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

// ---------------------------------------------------------------------------
// Step dots
// ---------------------------------------------------------------------------
function StepDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' }}
      aria-label={'Step ' + current + ' of ' + total}>
      {Array.from({ length: total }).map(function(_, i) {
        var done = i + 1 < current; var active = i + 1 === current;
        return <div key={i} aria-hidden="true" style={{ width: active ? '24px' : '8px', height: '8px', borderRadius: '4px', background: done ? '#22C55E' : active ? '#3B82F6' : '#2A3550', transition: 'all 0.3s' }} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 1 — Interests
// ---------------------------------------------------------------------------
function StepInterests({ firstName, selected, onToggle, onNext, onSkip }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        {/* Bigger mascot */}
        <img src="/mascot-onboarding.png" alt="" aria-hidden="true"
          style={{ width: "260px", height: 'auto', display: 'block', margin: '0 auto 20px' }} />
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
          Welcome, {firstName}!
        </h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
          Select your interests so we can suggest organizations near you.
        </p>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px' }}>
          Your Interests
          <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px', marginLeft: '6px' }}>(optional — pick any that apply)</span>
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} role="group" aria-label="Interest categories">
          {INTERESTS.map(function(interest) {
            var sel = selected.includes(interest);
            return (
              <button key={interest} type="button" onClick={function() { onToggle(interest); }}
                aria-pressed={sel}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ padding: '8px 16px', borderRadius: '99px', fontSize: '13px', fontWeight: 600, border: '1px solid ' + (sel ? '#3B82F6' : '#2A3550'), background: sel ? 'rgba(59,130,246,0.15)' : '#1E2845', color: sel ? '#3B82F6' : '#94A3B8', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {sel && <Icon d={CHECK} size={11} color="#3B82F6" strokeWidth={3} />}
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onNext}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px 24px', background: '#3B82F6', color: '#FFFFFF', fontWeight: 800, fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]">
        Continue
        <Icon d={CHEVRON_R} size={16} color="#FFFFFF" />
      </button>

      <button onClick={onSkip}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px', padding: '12px', textAlign: 'center', width: '100%', textDecoration: 'underline', marginTop: '4px' }}
        className="focus:outline-none focus:ring-2 focus:ring-gray-500 rounded">
        Skip for now
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 2 — Find / follow orgs
// ---------------------------------------------------------------------------
function StepFindOrgs({ onFinish, onBack, userId, interests }) {
  var [location, setLocation]           = useState('');
  var [searchQuery, setSearchQuery]     = useState('');
  var [searchResults, setSearchResults] = useState([]);
  var [searching, setSearching]         = useState(false);
  var [followedOrgs, setFollowedOrgs]   = useState({});
  var [hasSearched, setHasSearched]     = useState(false);
  var searchTimeout                     = useRef(null);

  // Auto-search when location is entered
  useEffect(function() {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    var combined = (location + ' ' + searchQuery).trim();
    if (!combined) { setSearchResults([]); setHasSearched(false); return; }
    searchTimeout.current = setTimeout(function() { runSearch(location.trim(), searchQuery.trim()); }, 400);
    return function() { clearTimeout(searchTimeout.current); };
  }, [location, searchQuery]);

  async function runSearch(loc, query) {
    setSearching(true);
    setHasSearched(true);
    try {
      var conditions = [];

      // Each word in location as OR against name + description
      if (loc) {
        loc.split(/[\s,]+/).filter(Boolean).forEach(function(word) {
          if (word.length >= 2) {
            conditions.push("name.ilike.%" + word + "%");
            conditions.push("description.ilike.%" + word + "%");
          }
        });
      }

      // Keyword as OR against name + description
      if (query) {
        query.split(/\s+/).filter(Boolean).forEach(function(word) {
          if (word.length >= 2) {
            conditions.push("name.ilike.%" + word + "%");
            conditions.push("description.ilike.%" + word + "%");
          }
        });
      }

      // Always include interests as OR conditions
      if (interests && interests.length > 0) {
        interests.forEach(function(interest) {
          var keyword = interest.split(" & ")[0].split(" ")[0];
          conditions.push("name.ilike.%" + keyword + "%");
          conditions.push("description.ilike.%" + keyword + "%");
        });
      }

      if (conditions.length === 0) { setSearchResults([]); setSearching(false); return; }

      // Deduplicate
      conditions = conditions.filter(function(c, i) { return conditions.indexOf(c) === i; });

      var result = await supabase
        .from("organizations")
        .select("id, name, type, logo_url, description")
        .or(conditions.join(","))
        .limit(10);

      setSearchResults(result.data || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleFollow(org) {
    if (!userId || followedOrgs[org.id] === 'followed' || followedOrgs[org.id] === 'loading') return;
    setFollowedOrgs(function(prev) { return Object.assign({}, prev, { [org.id]: 'loading' }); });
    try {
      // org_followers columns: user_id + org_id (confirmed from DB)
      var { error } = await supabase.from('org_followers').insert({
        user_id: userId,
        org_id: org.id,
      });
      // Ignore duplicate key error (user already follows this org)
      if (error && error.code !== '23505') throw error;
      setFollowedOrgs(function(prev) { return Object.assign({}, prev, { [org.id]: 'followed' }); });
      mascotSuccessToast('Following ' + org.name + '!', 'Their public events will appear on your dashboard.');
    } catch (err) {
      toast.error('Could not follow ' + org.name + '. Please try again from their org page.');
      setFollowedOrgs(function(prev) { var n = Object.assign({}, prev); delete n[org.id]; return n; });
    }
  }

  var followedCount = Object.values(followedOrgs).filter(function(v) { return v === 'followed'; }).length;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
          Find organizations near you
        </h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
          Enter your city or zip code to discover organizations based on your interests.
        </p>
      </div>

      {/* Following vs Member explanation */}
      <div style={{ background: '#151B2D', border: '1px solid #2A3550', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '140px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={BELL_ICON} size={14} color="#3B82F6" strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px' }}>Following</p>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>See public events on your dashboard. Free and open.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '140px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={ORG_ICON} size={14} color="#22C55E" strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px' }}>Member</p>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>Full access — announcements, alerts, and private events.</p>
            </div>
          </div>
        </div>
        {/* Privacy note */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #2A3550' }}>
          <Icon d={LOCK_ICON} size={13} color="#64748B" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Some organizations keep their events private and do not appear in search. They may choose to restrict visibility to members only.
          </p>
        </div>
      </div>

      {/* Location input */}
      <div style={{ marginBottom: '8px' }}>
        <label htmlFor="location-input" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
          Your City or Zip Code
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <Icon d={PIN_ICON} size={16} color="#64748B" />
          </div>
          <input
            id="location-input"
            type="text"
            value={location}
            onChange={function(e) { setLocation(e.target.value); }}
            placeholder="e.g. Toledo, OH or 43604"
            aria-label="Your city or zip code"
            style={Object.assign({}, inputBase, { paddingLeft: '40px' })}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>
      </div>

      {/* Keyword search */}
      <div style={{ marginBottom: '14px' }}>
        <label htmlFor="keyword-input" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
          Name or Keyword
          <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px', marginLeft: '6px' }}>(optional)</span>
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <Icon d={SEARCH_D} size={16} color="#64748B" />
          </div>
          <input
            id="keyword-input"
            type="search"
            value={searchQuery}
            onChange={function(e) { setSearchQuery(e.target.value); }}
            placeholder="e.g. youth sports, arts council..."
            aria-label="Search by name or keyword"
            style={Object.assign({}, inputBase, { paddingLeft: '40px', paddingRight: searching ? '40px' : '14px' })}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="#3B82F6" strokeWidth="3" opacity="0.25" />
                <path fill="#3B82F6" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Interest chips shown as active filters */}
      {interests && interests.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          <span style={{ fontSize: '11px', color: '#64748B', alignSelf: 'center', marginRight: '2px' }}>Filtering by:</span>
          {interests.slice(0, 4).map(function(interest) {
            return (
              <span key={interest} style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#3B82F6' }}>
                {interest}
              </span>
            );
          })}
          {interests.length > 4 && (
            <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: '#1E2845', border: '1px solid #2A3550', color: '#64748B' }}>
              +{interests.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {searchResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', maxHeight: '320px', overflowY: 'auto' }}
          role="list" aria-label="Organization search results">
          {searchResults.map(function(org) {
            var status = followedOrgs[org.id];
            var isFollowed = status === 'followed';
            var isLoading  = status === 'loading';
            return (
              <div key={org.id} role="listitem"
                style={{ background: '#0E1523', border: '1px solid ' + (isFollowed ? 'rgba(34,197,94,0.3)' : '#2A3550'), borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#1E2845', border: '1px solid #2A3550', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {org.logo_url
                    ? <img src={org.logo_url} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '15px', fontWeight: 700, color: '#64748B' }}>{(org.name || '?').charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{org.name}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, textTransform: 'capitalize' }}>
                    {(org.type || '').replace(/_/g, ' ')}
                    {org.location ? ' · ' + org.location : ''}
                  </p>
                </div>
                {isFollowed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', flexShrink: 0 }}>
                    <Icon d={CHECK} size={12} color="#22C55E" strokeWidth={3} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#22C55E' }}>Following</span>
                  </div>
                ) : (
                  <button
                    onClick={function() { handleFollow(org); }}
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '99px', background: '#1E2845', border: '1px solid #2A3550', color: '#CBD5E1', fontSize: '12px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={'Follow ' + org.name}
                    onMouseEnter={function(e) { if (!isLoading) { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#22C55E'; } }}
                    onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#2A3550'; e.currentTarget.style.color = '#CBD5E1'; }}>
                    {isLoading
                      ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" /></svg>
                      : <Icon d={BELL_ICON} size={12} color="currentColor" strokeWidth={2} />
                    }
                    Follow
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {hasSearched && !searching && searchResults.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '10px', marginBottom: '14px' }}>
          <Icon d={SEARCH_D} size={28} color="#2A3550" style={{ margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 4px' }}>No organizations found in that area yet.</p>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>You can always browse from the <a href="/explore" style={{ color: '#3B82F6' }}>Explore page</a> after setup.</p>
        </div>
      )}

      {/* Empty prompt — nothing typed yet */}
      {!hasSearched && !searching && (
        <div style={{ textAlign: 'center', padding: '20px', background: '#0E1523', border: '1px dashed #2A3550', borderRadius: '10px', marginBottom: '14px' }}>
          <Icon d={PIN_ICON} size={28} color="#2A3550" style={{ margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Enter your city or zip above to find organizations near you.</p>
        </div>
      )}

      {/* Followed count */}
      {followedCount > 0 && (
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon d={CHECK} size={14} color="#22C55E" strokeWidth={2.5} />
          <p style={{ fontSize: '13px', color: '#22C55E', fontWeight: 600, margin: 0 }}>
            Following {followedCount} {followedCount === 1 ? 'organization' : 'organizations'} — their public events will appear on your dashboard.
          </p>
        </div>
      )}

      <button onClick={onFinish}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px 24px', background: '#F5B731', color: '#0E1523', fontWeight: 800, fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
        className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-[#1A2035]">
        Go to My Dashboard
        <Icon d={CHEVRON_R} size={16} color="#0E1523" />
      </button>

      <button onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, padding: '10px', width: '100%', marginTop: '4px' }}
        className="focus:outline-none focus:ring-2 focus:ring-gray-500 rounded" aria-label="Go back">
        <Icon d={CHEVRON_L} size={14} color="#64748B" />
        Back
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main WelcomePage
// ---------------------------------------------------------------------------
export default function WelcomePage() {
  var navigate = useNavigate();
  var [member, setMember]       = useState(null);
  var [loading, setLoading]     = useState(true);
  var [step, setStep]           = useState(1);
  var [interests, setInterests] = useState([]);

  useEffect(function() { fetchMember(); }, []);

  async function fetchMember() {
    try {
      var { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login', { replace: true }); return; }
      var { data } = await supabase.from('members').select('*').eq('user_id', user.id).single();
      setMember(data || { user_id: user.id, first_name: 'there' });
    } catch (e) {
      setMember({ first_name: 'there' });
    } finally {
      setLoading(false);
    }
  }

  function toggleInterest(interest) {
    setInterests(function(prev) {
      return prev.includes(interest)
        ? prev.filter(function(i) { return i !== interest; })
        : prev.concat([interest]);
    });
  }

  async function handleInterestsContinue() {
    if (interests.length > 0 && member && member.user_id) {
      try {
        await supabase.from('members').update({ interests: interests }).eq('user_id', member.user_id);
      } catch (e) { /* non-blocking */ }
    }
    setStep(2);
  }

  async function handleFinish() {
    if (member && member.user_id) {
      await supabase.from('members').update({ onboarding_completed: true }).eq('user_id', member.user_id);
    }
    navigate('/dashboard', { replace: true });
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E1523', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        role="status" aria-label="Loading">
        <img src="/mascot-loading.png" alt="" aria-hidden="true" style={{ width: '160px' }} />
      </div>
    );
  }

  var firstName = member ? (member.first_name || 'there') : 'there';

  return (
    <div style={{ minHeight: '100vh', background: '#0E1523', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '16px', textAlign: 'center' }}>
          Getting Started
        </p>

        <StepDots current={step} total={2} />

        <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '540px' }}>
          {step === 1 && (
            <StepInterests
              firstName={firstName}
              selected={interests}
              onToggle={toggleInterest}
              onNext={handleInterestsContinue}
              onSkip={function() { setStep(2); }}
            />
          )}
          {step === 2 && (
            <StepFindOrgs
              onFinish={handleFinish}
              onBack={function() { setStep(1); }}
              userId={member ? member.user_id : null}
              interests={interests}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}