/**
 * Syndicade — CommunityBoardJoin.jsx
 * Handles invite link redemption for community boards.
 * Route: /community-board/join?token=xxx
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

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
var RED    = '#EF4444';

var THEMES = [
  { value: 'general',    label: 'General',      color: '#64748B', bg: '#F1F5F9' },
  { value: 'latino',     label: 'Latino',        color: '#DC2626', bg: '#FEE2E2' },
  { value: 'black',      label: 'Black-led',     color: '#92400E', bg: '#FEF3C7' },
  { value: 'lgbtq',      label: 'LGBTQ+',        color: '#7C3AED', bg: '#EDE9FE' },
  { value: 'faith',      label: 'Faith-based',   color: '#0369A1', bg: '#E0F2FE' },
  { value: 'immigrant',  label: 'Immigrant',     color: '#065F46', bg: '#D1FAE5' },
  { value: 'women',      label: 'Women-led',     color: '#BE185D', bg: '#FCE7F3' },
  { value: 'disability', label: 'Disability',    color: '#1D4ED8', bg: '#DBEAFE' },
  { value: 'asian',      label: 'Asian & AAPI',  color: '#B45309', bg: '#FEF3C7' },
  { value: 'indigenous', label: 'Indigenous',    color: '#166534', bg: '#DCFCE7' },
  { value: 'youth',      label: 'Youth',         color: '#0E7490', bg: '#CFFAFE' },
  { value: 'other',      label: 'Other',         color: '#475569', bg: '#F1F5F9' },
];
function getTheme(value) { return THEMES.find(function(t) { return t.value === value; }) || THEMES[0]; }

var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
function getAvatarColor(name) { return AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length]; }
function getInitials(name) {
  if (!name) return '??';
  var w = name.trim().split(/\s+/);
  return w.length === 1 ? w[0].slice(0,2).toUpperCase() : (w[0][0]+w[1][0]).toUpperCase();
}

function IconLock(p) { return <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IconGlobe(p) { return <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function IconMapPin(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconUsers(p) { return <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconCheck(p) { return <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconArrowLeft(p) { return <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
function IconClock(p) { return <svg width={p.size||24} height={p.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconX(p) { return <svg width={p.size||12} height={p.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

export default function CommunityBoardJoin() {
  var [searchParams] = useSearchParams();
  var navigate = useNavigate();
  var token = searchParams.get('token');

  var [loading, setLoading]           = useState(true);
  var [inviteData, setInviteData]     = useState(null); // from get_board_invite RPC
  var [error, setError]               = useState(null); // 'invalid' | 'expired' | 'used'
  var [userOrgs, setUserOrgs]         = useState([]);
  var [selectedOrgId, setSelectedOrgId] = useState('');
  var [joining, setJoining]           = useState(false);
  var [joined, setJoined]             = useState(null); // { status, boardId }
  var [currentUser, setCurrentUser]   = useState(null);

  useEffect(function() {
    if (!token) { setError('invalid'); setLoading(false); return; }
    loadInvite();
  }, [token]);

  async function loadInvite() {
    setLoading(true);
    try {
      var { data: authData } = await supabase.auth.getUser();
      setCurrentUser(authData.user);

      // Load invite details
      var { data, error: rpcErr } = await supabase.rpc('get_board_invite', { p_token: token });
      if (rpcErr || !data || data.length === 0) { setError('invalid'); return; }
      var inv = data[0];
      if (!inv.is_valid) {
        if (inv.used_at && inv.invited_org_id) { setError('used'); }
        else { setError('expired'); }
        return;
      }
      setInviteData(inv);

      // Load user's admin orgs (if logged in)
      if (authData.user) {
        var { data: mems } = await supabase
          .from('memberships')
          .select('organization_id, organizations(id, name, logo_url, is_verified_nonprofit)')
          .eq('member_id', authData.user.id)
          .eq('role', 'admin')
          .eq('status', 'active');
        var orgs = (mems || []).map(function(m) { return m.organizations; });
        setUserOrgs(orgs);
        if (orgs.length === 1) setSelectedOrgId(orgs[0].id);
      }
    } catch (err) {
      setError('invalid');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!selectedOrgId) { toast.error('Select which org is joining.'); return; }
    if (!currentUser) { navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search)); return; }
    setJoining(true);
    try {
      var { data, error: rpcErr } = await supabase.rpc('use_board_invite', {
        p_token: token,
        p_org_id: selectedOrgId,
        p_user_id: currentUser.id
      });
      if (rpcErr) throw rpcErr;
      var result = data && data[0];
      if (!result) throw new Error('No result');
      if (result.error_message) {
  mascotErrorToast('Could not join board.', result.error_message);
  return;
}

      if (result.membership_status === 'already_member') {
        mascotSuccessToast('You are already a member of this board.');
        setTimeout(function() { navigate('/community-board/' + result.board_id); }, 1500);
        return;
      }
      setJoined({ status: result.membership_status, boardId: result.board_id });
    } catch (err) {
      mascotErrorToast('Could not join board.', 'Please try again.');
    } finally {
      setJoining(false);
    }
  }

  var inputStyle = { width: '100%', padding: '10px 12px', background: ELEV, border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div aria-busy="true" aria-label="Loading invite" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          {[220, 180, 140].map(function(w, i) { return <div key={i} style={{ width: w+'px', height: '12px', background: BDR, borderRadius: '6px' }} />; })}
        </div>
      </div>
    );
  }

  // ── Success — approved (direct invite) ──
  if (joined && joined.status === 'approved') {
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <img src="/mascot-success.png" alt="" aria-hidden="true" style={{ width: '120px', mixBlendMode: 'multiply', margin: '0 auto 20px', display: 'block' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Welcome aboard!</h1>
          <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, marginBottom: '24px' }}>
            You have been approved and can now participate in the board.
          </p>
          <button onClick={function() { navigate('/community-board/' + joined.boardId); }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ padding: '12px 28px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
            Open the Board
          </button>
        </div>
      </main>
    );
  }

  // ── Success — pending (general link) ──
  if (joined && joined.status === 'pending') {
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245,183,49,0.12)', border: '1px solid rgba(245,183,49,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: YELLOW }}>
            <IconClock size={28} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>Request Sent</h1>
          <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, marginBottom: '24px' }}>
            Your request to join has been sent to the board admins. You will be able to participate once approved.
          </p>
          <button onClick={function() { navigate('/community-board/hub'); }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            <IconArrowLeft size={14} />Back to Boards
          </button>
        </div>
      </main>
    );
  }

  // ── Error states ──
  if (error) {
    var errorConfig = {
      invalid:  { icon: IconX,     color: RED,    title: 'Invalid Invite Link',     desc: 'This invite link is not valid. It may have been removed or never existed.' },
      expired:  { icon: IconClock, color: YELLOW, title: 'Invite Link Expired',     desc: 'This invite link has expired. Ask a board admin to generate a new one.' },
      used:     { icon: IconCheck, color: GREEN,  title: 'Link Already Used',       desc: 'This direct invite has already been accepted. Ask a board admin to send a new one.' }
    };
    var ec = errorConfig[error] || errorConfig.invalid;
    var Ic = ec.icon;
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '32px', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: CARD, border: '1px solid ' + BDR, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: ec.color }}>
            <Ic size={24} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>{ec.title}</h1>
          <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65, marginBottom: '24px' }}>{ec.desc}</p>
          <button onClick={function() { navigate('/community-board/hub'); }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            <IconArrowLeft size={14} />Browse Boards
          </button>
        </div>
      </main>
    );
  }

  // ── Main join flow ──
  var theme = getTheme(inviteData.board_theme);
  var location = [inviteData.board_city, inviteData.board_state].filter(Boolean).join(', ');
  var isDirect = !!inviteData.invited_org_id;

  return (
    <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Board preview card */}
        <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src="/mascot-community-board.png" alt="" aria-hidden="true" style={{ width: '32px', mixBlendMode: 'multiply' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: MUTED }}>You have been invited to join</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: theme.bg, color: theme.color }}>{theme.label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: inviteData.board_visibility === 'hidden' ? MUTED : GREEN }}>
              {inviteData.board_visibility === 'hidden' ? <IconLock size={11} /> : <IconGlobe size={11} />}
              {inviteData.board_visibility === 'hidden' ? 'Private' : 'Public'}
            </span>
            {isDirect && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '99px', fontSize: '10px', fontWeight: 700, color: '#16A34A' }}>
                Direct Invite — Auto Approved
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: TEXT, margin: '0 0 8px' }}>{inviteData.board_name}</h1>
          {inviteData.board_description && (
            <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, margin: '0 0 12px' }}>{inviteData.board_description}</p>
          )}
          {location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: MUTED }}>
              <IconMapPin size={12} />{location}
            </span>
          )}
        </div>

        {/* Join form */}
        {!currentUser ? (
          <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Sign in to join</h2>
            <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, marginBottom: '20px' }}>
              You need to be signed in as an org admin to join this board.
            </p>
            <button onClick={function() { navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search)); }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ width: '100%', padding: '12px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Sign In
            </button>
          </div>
        ) : userOrgs.length === 0 ? (
          <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: TEXT2, lineHeight: 1.65 }}>
              You need to be an admin of an organization to join this board.
            </p>
          </div>
        ) : (
          <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>Join as</h2>

            {userOrgs.length === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: ELEV, borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getAvatarColor(userOrgs[0].name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                  {getInitials(userOrgs[0].name)}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{userOrgs[0].name}</span>
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="join-org" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: TEXT2, marginBottom: '8px' }}>Select organization</label>
                <select id="join-org" value={selectedOrgId} onChange={function(e) { setSelectedOrgId(e.target.value); }} style={inputStyle}>
                  <option value="">Select organization...</option>
                  {userOrgs.map(function(o) { return <option key={o.id} value={o.id}>{o.name}</option>; })}
                </select>
              </div>
            )}

            <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.6, marginBottom: '16px' }}>
              {isDirect
                ? 'You have been directly invited. You will be approved automatically.'
                : 'Your request will be sent to the board admins for review.'}
            </p>

            <button onClick={handleJoin} disabled={!selectedOrgId || joining} aria-busy={joining}
              className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              style={{ width: '100%', padding: '13px', background: YELLOW, color: '#0E1523', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: (selectedOrgId && !joining) ? 'pointer' : 'not-allowed', opacity: (!selectedOrgId || joining) ? 0.7 : 1 }}>
              {joining ? 'Joining...' : (isDirect ? 'Accept Invite & Join Board' : 'Request to Join Board')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}