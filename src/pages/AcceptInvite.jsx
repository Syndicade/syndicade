import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Building2, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { notifyOrgAdmins } from '../lib/notificationService';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AcceptInvite() {
  var [searchParams] = useSearchParams();
  var navigate = useNavigate();
  var token = searchParams.get('token');

  var [loading, setLoading] = useState(true);
  var [accepting, setAccepting] = useState(false);
  var [invite, setInvite] = useState(null);
  var [org, setOrg] = useState(null);
  var [user, setUser] = useState(null);
  var [alreadyMember, setAlreadyMember] = useState(false);
  var [accepted, setAccepted] = useState(false);
  var [errorState, setErrorState] = useState(null); // 'invalid' | 'expired' | 'used'

  useEffect(function () {
    loadInvite();
  }, [token]);

  async function loadInvite() {
    setLoading(true);

    if (!token) {
      setErrorState('invalid');
      setLoading(false);
      return;
    }

    var { data: sessionData } = await supabase.auth.getSession();
    var currentUser = sessionData?.session?.user || null;
    setUser(currentUser);

    var { data: inviteData, error } = await supabase
      .from('invitations')
      .select('*, organizations(id, name, logo_url, location, is_verified_nonprofit)')
      .eq('id', token)
      .maybeSingle();

    if (error || !inviteData) {
      setErrorState('invalid');
      setLoading(false);
      return;
    }

    if (inviteData.status === 'accepted') {
      setErrorState('used');
      setLoading(false);
      return;
    }

    if (inviteData.status === 'revoked') {
      setErrorState('invalid');
      setLoading(false);
      return;
    }

    if (new Date(inviteData.expires_at) < new Date()) {
      setErrorState('expired');
      setLoading(false);
      return;
    }

    setInvite(inviteData);
    setOrg(inviteData.organizations);

    if (currentUser) {
      var { data: membership } = await supabase
        .from('memberships')
        .select('id')
        .eq('organization_id', inviteData.organization_id)
        .eq('member_id', currentUser.id)
        .maybeSingle();

      if (membership) setAlreadyMember(true);
    }

    setLoading(false);
  }

  async function handleAccept() {
    if (!user) return;
    setAccepting(true);

    // Get member's display name for the notification
    var { data: memberData } = await supabase
      .from('members')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();

    var memberName = memberData
      ? (memberData.first_name + ' ' + memberData.last_name).trim()
      : user.email;

    // Create membership
    var { error: memberError } = await supabase
      .from('memberships')
      .insert({
        member_id: user.id,
        organization_id: invite.organization_id,
        role: invite.role,
        status: 'active',
        joined_date: new Date().toISOString()
      });

    if (memberError) {
      if (memberError.code === '23505') {
        toast.error('You are already a member of this organization.');
        setAlreadyMember(true);
        setAccepting(false);
        return;
      }
      mascotErrorToast('Failed to join organization.', 'Please try again or contact support.');
      setAccepting(false);
      return;
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    // Notify org admins — fire and forget, non-fatal
    notifyOrgAdmins({
      organizationId: invite.organization_id,
      type: 'member_joined',
      title: memberName + ' joined ' + org.name,
      message: memberName + ' accepted an invitation and joined as ' + getRoleLabel(invite.role) + '.',
      link: '/organizations/' + invite.organization_id + '/members',
      excludeUserId: user.id
    }).catch(function (err) {
      console.error('member_joined notification failed (non-fatal):', err);
    });

    mascotSuccessToast('Welcome to ' + org.name + '!', "You've joined as " + getRoleLabel(invite.role) + '.');
    setAccepted(true);
    setAccepting(false);

    setTimeout(function () {
      navigate('/dashboard');
    }, 2000);
  }

  function getRoleBadgeStyle(role) {
    if (role === 'admin') return { bg: 'rgba(139,92,246,0.1)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.25)' };
    if (role === 'editor') return { bg: 'rgba(245,183,49,0.1)', color: '#B45309', border: '1px solid rgba(245,183,49,0.3)' };
    return { bg: 'rgba(59,130,246,0.1)', color: '#2563EB', border: '1px solid rgba(59,130,246,0.25)' };
  }

  function getRoleLabel(role) {
    if (role === 'admin') return 'Admin';
    if (role === 'editor') return 'Editor';
    return 'Member';
  }

  function getRoleDescription(role) {
    if (role === 'member') return 'As a member, you can view org content and RSVP to events.';
    if (role === 'editor') return 'As an editor, you can create and manage events, announcements, and content.';
    if (role === 'admin') return "As an admin, you'll have full access including member management and settings.";
    return '';
  }

  // ─── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <Header />
        <main className="flex items-center justify-center px-4 py-24">
          <div
            className="w-full max-w-md rounded-xl border p-8 flex flex-col gap-4"
            style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
            aria-busy="true"
            aria-label="Loading invitation"
          >
            <div className="h-16 w-16 rounded-full animate-pulse mx-auto" style={{ background: '#F1F5F9' }} />
            <div className="h-5 rounded-lg animate-pulse w-3/4 mx-auto" style={{ background: '#F1F5F9' }} />
            <div className="h-4 rounded-lg animate-pulse w-1/2 mx-auto" style={{ background: '#F1F5F9' }} />
            <div className="h-4 rounded-lg animate-pulse w-2/3 mx-auto" style={{ background: '#F1F5F9' }} />
            <div className="h-11 rounded-lg animate-pulse mt-2" style={{ background: '#F1F5F9' }} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Error states ────────────────────────────────────────────────────────────
  if (errorState) {
    var errorConfig = {
      invalid: {
        icon: XCircle,
        iconColor: '#EF4444',
        iconBg: 'rgba(239,68,68,0.08)',
        title: 'Invalid Invitation',
        description: 'This invitation link is not valid or has been revoked. Please contact the organization admin for a new invite.'
      },
      expired: {
        icon: Clock,
        iconColor: '#F5B731',
        iconBg: 'rgba(245,183,49,0.1)',
        title: 'Invitation Expired',
        description: 'This invitation link has expired. Please contact the organization admin to send you a new one.'
      },
      used: {
        icon: CheckCircle,
        iconColor: '#22C55E',
        iconBg: 'rgba(34,197,94,0.08)',
        title: 'Already Accepted',
        description: 'This invitation has already been used. If you need access to this organization, please contact the admin.'
      }
    };

    var cfg = errorConfig[errorState];
    var ErrIcon = cfg.icon;

    return (
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <Header />
        <main className="flex items-center justify-center px-4 py-24" role="main">
          <div
            className="w-full max-w-md rounded-xl border p-8 flex flex-col items-center text-center gap-4"
            style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: cfg.iconBg }}
            >
              <ErrIcon size={30} style={{ color: cfg.iconColor }} aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: '#0E1523' }}>{cfg.title}</h1>
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
              {cfg.description}
            </p>
            <Link
              to="/dashboard"
              className="mt-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ background: '#3B82F6' }}
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Already a member ────────────────────────────────────────────────────────
  if (alreadyMember) {
    return (
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <Header />
        <main className="flex items-center justify-center px-4 py-24" role="main">
          <div
            className="w-full max-w-md rounded-xl border p-8 flex flex-col items-center text-center gap-4"
            style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.08)' }}
            >
              <CheckCircle size={30} style={{ color: '#22C55E' }} aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: '#0E1523' }}>Already a Member</h1>
            <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
              You are already a member of <strong style={{ color: '#0E1523' }}>{org?.name}</strong>. Head to your dashboard to manage your organizations.
            </p>
            <Link
              to="/dashboard"
              className="mt-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ background: '#3B82F6' }}
            >
              Go to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Success state ───────────────────────────────────────────────────────────
  if (accepted) {
    return (
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <Header />
        <main className="flex items-center justify-center px-4 py-24" role="main">
          <div
            className="w-full max-w-md rounded-xl border p-8 flex flex-col items-center text-center gap-4"
            style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
          >
            <img
              src="/mascot-onboarding.png"
              alt=""
              aria-hidden="true"
              style={{ width: '160px', height: 'auto', mixBlendMode: 'multiply' }}
            />
            <h1 className="text-xl font-bold" style={{ color: '#0E1523' }}>
              Welcome to {org?.name}!
            </h1>
            <p className="text-sm" style={{ color: '#475569' }}>
              Redirecting you to your dashboard...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Main invite view ────────────────────────────────────────────────────────
  var roleBadge = getRoleBadgeStyle(invite.role);

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <Header />
      <main className="flex items-center justify-center px-4 py-24" role="main">
        <div
          className="w-full max-w-md rounded-xl border overflow-hidden"
          style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
        >
          {/* Org header band */}
          <div
            className="px-8 py-6 flex flex-col items-center gap-3 border-b"
            style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
          >
            {org?.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name + ' logo'}
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: '#E2E8F0' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                style={{ background: '#F1F5F9', borderColor: '#E2E8F0' }}
              >
                <Building2 size={28} style={{ color: '#94A3B8' }} aria-hidden="true" />
              </div>
            )}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: '#0E1523' }}>{org?.name}</h1>
                {org?.is_verified_nonprofit && (
                  <ShieldCheck
                    size={18}
                    style={{ color: '#22C55E' }}
                    aria-label="Verified nonprofit"
                  />
                )}
              </div>
              {org?.location && (
                <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>
                  {org.location}
                </p>
              )}
            </div>
          </div>

          {/* Invite details */}
          <div className="px-8 py-6 flex flex-col gap-5">
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: '#0E1523' }}>
                You've been invited to join
              </p>
              <p className="text-sm mt-1" style={{ color: '#475569' }}>
                as a
              </p>
              <span
                className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold capitalize"
                style={{
                  background: roleBadge.bg,
                  color: roleBadge.color,
                  border: roleBadge.border
                }}
              >
                {getRoleLabel(invite.role)}
              </span>
            </div>

            {/* Personal message */}
            {invite.message && (
              <div
                className="rounded-lg px-4 py-3"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderLeft: '3px solid #3B82F6'
                }}
              >
                <p className="text-sm italic leading-relaxed" style={{ color: '#475569' }}>
                  "{invite.message}"
                </p>
              </div>
            )}

            {/* Role description */}
            <p className="text-sm text-center" style={{ color: '#64748B' }}>
              {getRoleDescription(invite.role)}
            </p>

            {/* CTA — logged in */}
            {user ? (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#3B82F6', color: 'white' }}
              >
                <CheckCircle size={16} aria-hidden="true" />
                {accepting ? 'Joining...' : 'Accept Invitation'}
              </button>
            ) : (
              /* CTA — not logged in */
              <div className="flex flex-col gap-3">
                <p
                  className="text-xs text-center px-3 py-2 rounded-lg"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}
                >
                  You need a Syndicade account to accept this invitation.
                </p>
                <Link
                  to={'/signup?invite=' + token}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{ background: '#3B82F6', color: 'white' }}
                >
                  <UserPlus size={16} aria-hidden="true" />
                  Create Account &amp; Accept
                </Link>
                <Link
                  to={'/login?invite=' + token}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{ background: 'transparent', borderColor: '#E2E8F0', color: '#475569' }}
                >
                  <LogIn size={16} aria-hidden="true" />
                  Log In &amp; Accept
                </Link>
              </div>
            )}

            {/* Expiry note */}
            <p className="text-xs text-center" style={{ color: '#94A3B8' }}>
              This invitation expires on{' '}
              {new Date(invite.expires_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}