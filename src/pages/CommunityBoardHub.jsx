/**
 * Syndicade — CommunityBoardHub.jsx
 * Board discovery, search, create, and join flow.
 * Accessible to all org admins. Create restricted to verified nonprofit admins.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

// ─── Light theme tokens ────────────────────────────────────────────────────────

var BG     = '#F8FAFC';
var CARD   = '#FFFFFF';
var BDR    = '#E2E8F0';
var ELEV   = '#F1F5F9';
var TEXT   = '#0E1523';
var TEXT2  = '#475569';
var MUTED  = '#64748B';
var YELLOW = '#F5B731';
var BLUE   = '#3B82F6';
var GREEN  = '#22C55E';
var PURPLE = '#8B5CF6';
var RED    = '#EF4444';

// ─── Helpers ───────────────────────────────────────────────────────────────────

var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
function getAvatarColor(name) {
  var char = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[char % AVATAR_COLORS.length];
}
function getInitials(name) {
  if (!name) return '??';
  var words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── Theme config ──────────────────────────────────────────────────────────────

var THEMES = [
  { value: 'general',    label: 'General',         color: '#64748B', bg: '#F1F5F9' },
  { value: 'latino',     label: 'Latino',          color: '#DC2626', bg: '#FEE2E2' },
  { value: 'black',      label: 'Black-led',       color: '#92400E', bg: '#FEF3C7' },
  { value: 'lgbtq',      label: 'LGBTQ+',          color: '#7C3AED', bg: '#EDE9FE' },
  { value: 'faith',      label: 'Faith-based',     color: '#0369A1', bg: '#E0F2FE' },
  { value: 'immigrant',  label: 'Immigrant',       color: '#065F46', bg: '#D1FAE5' },
  { value: 'women',      label: 'Women-led',       color: '#BE185D', bg: '#FCE7F3' },
  { value: 'disability', label: 'Disability',      color: '#1D4ED8', bg: '#DBEAFE' },
  { value: 'asian',      label: 'Asian & AAPI',    color: '#B45309', bg: '#FEF3C7' },
  { value: 'indigenous', label: 'Indigenous',      color: '#166534', bg: '#DCFCE7' },
  { value: 'youth',      label: 'Youth',           color: '#0E7490', bg: '#CFFAFE' },
  { value: 'other',      label: 'Other',           color: '#475569', bg: '#F1F5F9' },
];

function getTheme(value) {
  return THEMES.find(function(t) { return t.value === value; }) || THEMES[0];
}

var US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
];

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconSearch(p) {
  return (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconPlus(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconX(p) {
  return (
    <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IconLock(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconGlobe(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
function IconUsers(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconMapPin(p) {
  return (
    <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function IconShield(p) {
  return (
    <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconArrowRight(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
function IconArrowLeft(p) {
  return (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}
function IconCheck(p) {
  return (
    <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconClock(p) {
  return (
    <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function BoardCardSkeleton() {
  return (
    <div aria-hidden="true" style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '64px', height: '22px', background: ELEV, borderRadius: '99px' }} />
        <div style={{ width: '48px', height: '22px', background: ELEV, borderRadius: '99px' }} />
      </div>
      <div style={{ width: '70%', height: '16px', background: BDR, borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ width: '90%', height: '12px', background: ELEV, borderRadius: '4px', marginBottom: '4px' }} />
      <div style={{ width: '60%', height: '12px', background: ELEV, borderRadius: '4px', marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ width: '80px', height: '12px', background: ELEV, borderRadius: '4px' }} />
        <div style={{ width: '60px', height: '12px', background: ELEV, borderRadius: '4px' }} />
      </div>
    </div>
  );
}

// ─── Board Card ────────────────────────────────────────────────────────────────

function BoardCard(props) {
  var board = props.board;
  var memberStatus = props.memberStatus; // 'approved' | 'pending' | 'denied' | null
  var navigate = useNavigate();
  var theme = getTheme(board.theme);

  var location = [board.city, board.state].filter(Boolean).join(', ');
  if (board.county && !board.city) location = board.county + ' County' + (board.state ? ', ' + board.state : '');

  return (
    <article
      style={{
        background: CARD,
        border: '1px solid ' + (memberStatus === 'approved' ? 'rgba(34,197,94,0.3)' : BDR),
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'box-shadow 0.15s'
      }}
      aria-label={board.name + ' community board'}
    >
      {/* Top row — theme + visibility */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: theme.bg, color: theme.color }}>
          {theme.label}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: board.visibility === 'hidden' ? MUTED : GREEN }}>
          {board.visibility === 'hidden' ? <IconLock size={11} /> : <IconGlobe size={11} />}
          {board.visibility === 'hidden' ? 'Private' : 'Public'}
        </span>
      </div>

      {/* Name + description */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, margin: '0 0 6px', lineHeight: 1.3 }}>{board.name}</h3>
        {board.description && (
          <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {board.description}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {location && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: MUTED }}>
            <IconMapPin size={12} />{location}
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: MUTED }}>
          <IconUsers size={12} />{board.member_count || 1} {(board.member_count || 1) === 1 ? 'org' : 'orgs'}
        </span>
      </div>

      {/* Status / action */}
      <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
        {memberStatus === 'approved' && (
          <button
            onClick={function() { navigate('/community-board/' + board.id); }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ width: '100%', padding: '9px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            Open Board <IconArrowRight size={13} />
          </button>
        )}
        {memberStatus === 'pending' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.25)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#B45309' }}>
            <IconClock size={13} />Request pending approval
          </div>
        )}
        {memberStatus === 'denied' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: RED }}>
            Request not approved
          </div>
        )}
        {!memberStatus && (
          <button
            onClick={function() { props.onRequestJoin(board); }}
            className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            style={{ width: '100%', padding: '9px', background: YELLOW, color: '#0E1523', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Request to Join
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Request to Join Modal ─────────────────────────────────────────────────────

function RequestJoinModal(props) {
  var board = props.board;
  var userOrgs = props.userOrgs;
  var [orgId, setOrgId] = useState(userOrgs.length === 1 ? userOrgs[0].id : '');
  var [sending, setSending] = useState(false);
  var theme = getTheme(board.theme);

  async function handleSend() {
    if (!orgId) { toast.error('Select which org is requesting to join.'); return; }
    setSending(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      var { error } = await supabase.from('community_board_memberships').insert({
        board_id: board.id,
        org_id: orgId,
        role: 'member',
        status: 'pending',
        requested_by_user_id: authData.user.id
      });
      if (error) throw error;
      mascotSuccessToast('Request sent!', 'The board admins will review your request.');
      props.onSuccess(orgId);
      props.onClose();
    } catch (err) {
      if (err.code === '23505') {
        toast.error('This org has already requested to join this board.');
      } else {
        mascotErrorToast('Could not send request.', 'Please try again.');
      }
    } finally {
      setSending(false);
    }
  }

  var inputStyle = { width: '100%', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  return (
    <div
      role="dialog" aria-modal="true" aria-label={'Request to join ' + board.name}
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
    >
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: TEXT, margin: 0 }}>Request to Join</h2>
          <button onClick={props.onClose} aria-label="Close" className="focus:outline-none focus:ring-2 focus:ring-slate-400" style={{ width: '28px', height: '28px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2 }}>
            <IconX size={12} />
          </button>
        </div>

        {/* Board preview */}
        <div style={{ background: ELEV, borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: theme.bg, color: theme.color }}>{theme.label}</span>
            <span style={{ fontSize: '11px', color: MUTED, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              {board.visibility === 'hidden' ? <IconLock size={10} /> : <IconGlobe size={10} />}
              {board.visibility === 'hidden' ? 'Private' : 'Public'}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{board.name}</div>
          {board.city && <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{[board.city, board.state].filter(Boolean).join(', ')}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {userOrgs.length > 1 && (
            <div>
              <label htmlFor="rj-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' }}>Requesting as</label>
              <select id="rj-org" value={orgId} onChange={function(e) { setOrgId(e.target.value); }} style={inputStyle}>
                <option value="">Select organization...</option>
                {userOrgs.map(function(o) { return <option key={o.id} value={o.id}>{o.name}</option>; })}
              </select>
            </div>
          )}
          <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.65, margin: 0 }}>
            Your request will be sent to the board admins for review. You'll be able to participate once approved.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={props.onClose} className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2" style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSend} disabled={sending} aria-busy={sending} className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2" style={{ flex: 1, padding: '10px', background: YELLOW, border: 'none', borderRadius: '8px', color: '#0E1523', fontSize: '13px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Board Modal ────────────────────────────────────────────────────────

function CreateBoardModal(props) {
  var verifiedOrgs = props.verifiedOrgs;
  var [orgId, setOrgId] = useState(verifiedOrgs.length === 1 ? verifiedOrgs[0].id : '');
  var [name, setName] = useState('');
  var [description, setDescription] = useState('');
  var [city, setCity] = useState('');
  var [state, setState] = useState('');
  var [county, setCounty] = useState('');
  var [zipCode, setZipCode] = useState('');
  var [theme, setTheme] = useState('general');
  var [visibility, setVisibility] = useState('public');
  var [saving, setSaving] = useState(false);

  var inputStyle = { width: '100%', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  var labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '6px' };

  async function handleCreate() {
    if (!orgId) { toast.error('Select which org is creating this board.'); return; }
    if (!name.trim()) { toast.error('Give your board a name.'); return; }
    if (!city.trim() && !county.trim() && !zipCode.trim()) { toast.error('Add at least a city, county, or zip code.'); return; }
    setSaving(true);
    try {
      var { data: authData } = await supabase.auth.getUser();

      // Create the board
      var { data: board, error: be } = await supabase.from('community_boards').insert({
        name: name.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        state: state || null,
        county: county.trim() || null,
        zip_code: zipCode.trim() || null,
        theme: theme,
        visibility: visibility,
        created_by_org_id: orgId,
        created_by_user_id: authData.user.id,
        member_count: 1
      }).select().single();
      if (be) throw be;

      // Add creating org as admin member (approved immediately)
      var { error: me } = await supabase.from('community_board_memberships').insert({
        board_id: board.id,
        org_id: orgId,
        role: 'admin',
        status: 'approved',
        requested_by_user_id: authData.user.id,
        reviewed_by_user_id: authData.user.id,
        reviewed_at: new Date().toISOString()
      });
      if (me) throw me;

      mascotSuccessToast('Board created!', name.trim() + ' is ready.');
      props.onSuccess(board);
      props.onClose();
    } catch (err) {
      mascotErrorToast('Could not create board.', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Create a new community board"
      onClick={function(e) { if (e.target === e.currentTarget) props.onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px' }}
    >
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Create a Community Board</h2>
            <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>Only verified nonprofit admins can create boards.</p>
          </div>
          <button onClick={props.onClose} aria-label="Close" className="focus:outline-none focus:ring-2 focus:ring-slate-400" style={{ width: '28px', height: '28px', borderRadius: '50%', background: BDR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT2, flexShrink: 0 }}>
            <IconX size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Creating org */}
          {verifiedOrgs.length > 1 && (
            <div>
              <label htmlFor="cb-org" style={labelStyle}>Creating as</label>
              <select id="cb-org" value={orgId} onChange={function(e) { setOrgId(e.target.value); }} style={inputStyle}>
                <option value="">Select organization...</option>
                {verifiedOrgs.map(function(o) { return <option key={o.id} value={o.id}>{o.name}</option>; })}
              </select>
            </div>
          )}

          {/* Board name */}
          <div>
            <label htmlFor="cb-name" style={labelStyle}>Board Name <span style={{ color: RED }}>*</span></label>
            <input id="cb-name" type="text" value={name} onChange={function(e) { setName(e.target.value); }} maxLength={80} aria-required="true" placeholder="e.g. Latino Nonprofits of Columbus" style={inputStyle} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{name.length}/80</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="cb-desc" style={labelStyle}>Description</label>
            <textarea id="cb-desc" value={description} onChange={function(e) { setDescription(e.target.value); }} rows={3} maxLength={300} placeholder="What is this board for? Who should join?" style={Object.assign({}, inputStyle, { resize: 'vertical', lineHeight: 1.6 })} />
            <p style={{ fontSize: '11px', color: MUTED, margin: '4px 0 0', textAlign: 'right' }}>{description.length}/300</p>
          </div>

          {/* Theme */}
          <div>
            <label htmlFor="cb-theme" style={labelStyle}>Community Theme</label>
            <select id="cb-theme" value={theme} onChange={function(e) { setTheme(e.target.value); }} style={inputStyle}>
              {THEMES.map(function(t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
            </select>
          </div>

          {/* Location */}
          <div>
            <p style={Object.assign({}, labelStyle, { marginBottom: '10px' })}>Location <span style={{ fontWeight: 400, color: MUTED }}>(at least one field required)</span></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label htmlFor="cb-city" style={{ fontSize: '11px', color: MUTED, display: 'block', marginBottom: '4px' }}>City</label>
                <input id="cb-city" type="text" value={city} onChange={function(e) { setCity(e.target.value); }} placeholder="Columbus" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="cb-state" style={{ fontSize: '11px', color: MUTED, display: 'block', marginBottom: '4px' }}>State</label>
                <select id="cb-state" value={state} onChange={function(e) { setState(e.target.value); }} style={inputStyle}>
                  <option value="">Select...</option>
                  {US_STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                </select>
              </div>
              <div>
                <label htmlFor="cb-county" style={{ fontSize: '11px', color: MUTED, display: 'block', marginBottom: '4px' }}>County</label>
                <input id="cb-county" type="text" value={county} onChange={function(e) { setCounty(e.target.value); }} placeholder="Franklin" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="cb-zip" style={{ fontSize: '11px', color: MUTED, display: 'block', marginBottom: '4px' }}>ZIP Code</label>
                <input id="cb-zip" type="text" value={zipCode} onChange={function(e) { setZipCode(e.target.value); }} placeholder="43215" maxLength={10} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <p style={Object.assign({}, labelStyle, { marginBottom: '10px' })}>Visibility</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { value: 'public',  label: 'Public', desc: 'Appears in search. Any verified nonprofit admin can request to join.', icon: IconGlobe },
                { value: 'hidden',  label: 'Private', desc: 'Not searchable. Members join by invite link only. Ideal for sensitive communities.', icon: IconLock }
              ].map(function(opt) {
                var isSelected = visibility === opt.value;
                var Ic = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={function() { setVisibility(opt.value); }}
                    aria-pressed={isSelected}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', background: isSelected ? 'rgba(59,130,246,0.06)' : ELEV, border: '1px solid ' + (isSelected ? 'rgba(59,130,246,0.35)' : BDR), borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isSelected ? 'rgba(59,130,246,0.12)' : CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? BLUE : MUTED, flexShrink: 0, marginTop: '1px' }}>
                      <Ic size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? BLUE : TEXT, marginBottom: '2px' }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', color: TEXT2, lineHeight: 1.5 }}>{opt.desc}</div>
                    </div>
                    {isSelected && (
                      <div style={{ marginLeft: 'auto', flexShrink: 0, color: BLUE }}>
                        <IconCheck size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button onClick={props.onClose} className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2" style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT2, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving} aria-busy={saving} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" style={{ flex: 2, padding: '11px', background: BLUE, border: 'none', borderRadius: '8px', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CommunityBoardHub() {
  var navigate = useNavigate();

  var [hasAccess, setHasAccess]         = useState(null);
  var [userOrgs, setUserOrgs]           = useState([]);
  var [verifiedOrgs, setVerifiedOrgs]   = useState([]);
  var [userOrgIds, setUserOrgIds]       = useState([]);
  var [boards, setBoards]               = useState([]);
  var [memberships, setMemberships]     = useState([]);
  var [loading, setLoading]             = useState(true);
  var [showCreate, setShowCreate]       = useState(false);
  var [requestBoard, setRequestBoard]   = useState(null);

  // ── Filters ──
  var [searchName, setSearchName]   = useState('');
  var [filterCity, setFilterCity]   = useState('');
  var [filterCounty, setFilterCounty] = useState('');
  var [filterState, setFilterState] = useState('');
  var [filterZip, setFilterZip]     = useState('');
  var [filterTheme, setFilterTheme] = useState('');

  useEffect(function() { checkAccess(); }, []);

  async function checkAccess() {
    try {
      var { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { setHasAccess(false); return; }
      var { data, error } = await supabase
        .from('memberships')
        .select('organization_id, role, organizations(id, name, type, logo_url, is_verified_nonprofit)')
        .eq('member_id', authData.user.id)
        .eq('role', 'admin')
        .eq('status', 'active');
      if (error) throw error;
      if (!data || data.length === 0) { setHasAccess(false); return; }
      var orgs = data.map(function(m) { return m.organizations; });
      var ids = orgs.map(function(o) { return o.id; });
      setUserOrgs(orgs);
      setUserOrgIds(ids);
      setVerifiedOrgs(orgs.filter(function(o) { return o.is_verified_nonprofit; }));
      setHasAccess(true);
      loadBoards(ids);
    } catch (err) {
      setHasAccess(false);
    }
  }

  async function loadBoards(orgIds) {
    setLoading(true);
    try {
      // Load all public boards
      var { data: publicBoards, error: pe } = await supabase
        .from('community_boards')
        .select('*')
        .eq('is_active', true)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      if (pe) throw pe;

      // Load boards the user's orgs are members of (includes hidden)
      var { data: memberBoards, error: mbe } = await supabase
        .from('community_board_memberships')
        .select('board_id, org_id, status, role, community_boards(*)')
        .in('org_id', orgIds);
      if (mbe) throw mbe;

      // Build membership map: board_id -> { status, role }
      var membershipMap = {};
      (memberBoards || []).forEach(function(m) {
        if (!membershipMap[m.board_id] || m.status === 'approved') {
          membershipMap[m.board_id] = { status: m.status, role: m.role, org_id: m.org_id };
        }
      });
      setMemberships(membershipMap);

      // Combine: public boards + hidden boards we're members of
      var hiddenMemberBoards = (memberBoards || [])
        .filter(function(m) { return m.community_boards && m.community_boards.visibility === 'hidden'; })
        .map(function(m) { return m.community_boards; });

      var allBoards = (publicBoards || []).concat(hiddenMemberBoards);
      // Deduplicate by id
      var seen = {};
      allBoards = allBoards.filter(function(b) {
        if (seen[b.id]) return false;
        seen[b.id] = true;
        return true;
      });

      setBoards(allBoards);
    } catch (err) {
      mascotErrorToast('Could not load boards.');
    } finally {
      setLoading(false);
    }
  }

  // ── Filtering ──
  var filteredBoards = boards.filter(function(b) {
    if (searchName && b.name.toLowerCase().indexOf(searchName.toLowerCase()) === -1) return false;
    if (filterCity && (!b.city || b.city.toLowerCase().indexOf(filterCity.toLowerCase()) === -1)) return false;
    if (filterCounty && (!b.county || b.county.toLowerCase().indexOf(filterCounty.toLowerCase()) === -1)) return false;
    if (filterState && b.state !== filterState) return false;
    if (filterZip && (!b.zip_code || b.zip_code.indexOf(filterZip) === -1)) return false;
    if (filterTheme && b.theme !== filterTheme) return false;
    return true;
  });

  var myBoards = filteredBoards.filter(function(b) { return memberships[b.id] && memberships[b.id].status === 'approved'; });
  var otherBoards = filteredBoards.filter(function(b) { return !memberships[b.id] || memberships[b.id].status !== 'approved'; });

  var hasFilters = searchName || filterCity || filterCounty || filterState || filterZip || filterTheme;

  function clearFilters() {
    setSearchName(''); setFilterCity(''); setFilterCounty('');
    setFilterState(''); setFilterZip(''); setFilterTheme('');
  }

  var inputStyle = { padding: '9px 12px', background: CARD, border: '1px solid ' + BDR, borderRadius: '8px', fontSize: '13px', color: TEXT, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

  // ── Access loading ──
  if (hasAccess === null) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div aria-busy="true" aria-label="Checking access" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {[280, 220, 160].map(function(w, i) {
            return <div key={i} style={{ width: w + 'px', height: '12px', background: BDR, borderRadius: '6px' }} />;
          })}
        </div>
      </div>
    );
  }

  // ── Access denied ──
  if (!hasAccess) {
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: CARD, border: '1px solid ' + BDR, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: MUTED }}>
            <IconLock size={26} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Admin Access Required</h1>
          <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, margin: '0 0 24px' }}>
            The Community Board is available to verified org admins only.
          </p>
          <a href="/dashboard" className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            <IconArrowLeft size={14} />Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  // ── Main ──
  return (
    <main style={{ background: BG, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }} aria-label="Community Board Hub">

      {/* ── Header ── */}
      <header style={{ background: CARD, borderBottom: '1px solid ' + BDR, padding: '32px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <img src="/mascot-community-board.png" alt="" aria-hidden="true" style={{ width: '36px', height: 'auto', mixBlendMode: 'multiply' }} />
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: TEXT, margin: 0 }}>Community Boards</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '99px', fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
                  <IconShield size={10} />Admins Only
                </span>
              </div>
              <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, margin: 0, maxWidth: '560px' }}>
                Private spaces where verified nonprofits collaborate, share resources, and build community — organized by location and focus area.
              </p>
            </div>
            {verifiedOrgs.length > 0 && (
              <button
                onClick={function() { setShowCreate(true); }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                <IconPlus size={14} />Create a Board
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Search + Filters ── */}
      <section style={{ background: CARD, borderBottom: '1px solid ' + BDR, padding: '16px 24px' }} aria-label="Search and filter boards">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', alignItems: 'end' }}>

            {/* Board name search */}
            <div style={{ position: 'relative', gridColumn: 'span 2' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }}>
                <IconSearch size={14} />
              </span>
              <input
                type="search" value={searchName}
                onChange={function(e) { setSearchName(e.target.value); }}
                placeholder="Search by board name..."
                aria-label="Search by board name"
                style={Object.assign({}, inputStyle, { paddingLeft: '32px' })}
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="f-city" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '4px' }}>City</label>
              <input id="f-city" type="text" value={filterCity} onChange={function(e) { setFilterCity(e.target.value); }} placeholder="Columbus" style={inputStyle} />
            </div>

            {/* County */}
            <div>
              <label htmlFor="f-county" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '4px' }}>County</label>
              <input id="f-county" type="text" value={filterCounty} onChange={function(e) { setFilterCounty(e.target.value); }} placeholder="Franklin" style={inputStyle} />
            </div>

            {/* State */}
            <div>
              <label htmlFor="f-state" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '4px' }}>State</label>
              <select id="f-state" value={filterState} onChange={function(e) { setFilterState(e.target.value); }} style={inputStyle}>
                <option value="">All states</option>
                {US_STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
            </div>

            {/* ZIP */}
            <div>
              <label htmlFor="f-zip" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '4px' }}>ZIP Code</label>
              <input id="f-zip" type="text" value={filterZip} onChange={function(e) { setFilterZip(e.target.value); }} placeholder="43215" maxLength={10} style={inputStyle} />
            </div>

            {/* Theme */}
            <div>
              <label htmlFor="f-theme" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: MUTED, marginBottom: '4px' }}>Theme</label>
              <select id="f-theme" value={filterTheme} onChange={function(e) { setFilterTheme(e.target.value); }} style={inputStyle}>
                <option value="">All themes</option>
                {THEMES.map(function(t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
              </select>
            </div>

          </div>

          {hasFilters && (
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={clearFilters}
                className="focus:outline-none focus:ring-2 focus:ring-slate-400"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
              >
                <IconX size={11} />Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Board Grid ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {loading ? (
          <div aria-busy="true" aria-label="Loading boards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1,2,3,4,5,6].map(function(i) { return <BoardCardSkeleton key={i} />; })}
          </div>
        ) : filteredBoards.length === 0 ? (
          <div role="status" style={{ textAlign: 'center', padding: '72px 32px' }}>
            <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ width: '140px', height: 'auto', mixBlendMode: 'multiply', margin: '0 auto 20px', display: 'block' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>
              {hasFilters ? 'No boards match your search' : 'No boards yet'}
            </h2>
            <p style={{ fontSize: '14px', color: TEXT2, maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.65 }}>
              {hasFilters ? 'Try adjusting your filters or search by a different location.' : 'Be the first to create a Community Board in your area.'}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" style={{ padding: '10px 24px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Clear Filters
              </button>
            ) : verifiedOrgs.length > 0 ? (
              <button onClick={function() { setShowCreate(true); }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" style={{ padding: '10px 24px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <IconPlus size={13} />Create a Board
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* My Boards */}
            {myBoards.length > 0 && (
              <section aria-label="Your boards" style={{ marginBottom: '40px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 16px' }}>
                  Your Boards
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {myBoards.map(function(board) {
                    return (
                      <BoardCard
                        key={board.id}
                        board={board}
                        memberStatus={memberships[board.id] ? memberships[board.id].status : null}
                        onRequestJoin={function(b) { setRequestBoard(b); }}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Other Boards */}
            {otherBoards.length > 0 && (
              <section aria-label="Available boards">
                {myBoards.length > 0 && (
                  <p style={{ fontSize: '11px', fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: '4px', margin: '0 0 16px' }}>
                    Other Boards
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {otherBoards.map(function(board) {
                    return (
                      <BoardCard
                        key={board.id}
                        board={board}
                        memberStatus={memberships[board.id] ? memberships[board.id].status : null}
                        onRequestJoin={function(b) { setRequestBoard(b); }}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
{showCreate && (
  <CreateBoardModal
    verifiedOrgs={verifiedOrgs}
    onClose={function() { setShowCreate(false); }}
    onSuccess={function() {
      setShowCreate(false);
      loadBoards(userOrgIds);
    }}
  />
)}

      {requestBoard && (
        <RequestJoinModal
          board={requestBoard}
          userOrgs={userOrgs}
          onClose={function() { setRequestBoard(null); }}
          onSuccess={function(orgId) {
            setMemberships(function(prev) {
              return Object.assign({}, prev, { [requestBoard.id]: { status: 'pending', org_id: orgId } });
            });
            setRequestBoard(null);
          }}
        />
      )}
    </main>
  );
}