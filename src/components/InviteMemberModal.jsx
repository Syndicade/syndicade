import { useState, useEffect } from 'react';
import { X, UserPlus, Mail, ChevronDown, Clock, Trash2, Send, Copy, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';

export default function OrgInviteMemberModal({ isOpen, onClose, organizationId, organizationName, currentUserId }) {
  var [email, setEmail] = useState('');
  var [role, setRole] = useState('member');
  var [message, setMessage] = useState('');
  var [sending, setSending] = useState(false);
  var [pendingInvites, setPendingInvites] = useState([]);
  var [loadingInvites, setLoadingInvites] = useState(true);
  var [revoking, setRevoking] = useState(null);
  var [resending, setResending] = useState(null);

  useEffect(function () {
    if (isOpen) {
      loadPendingInvites();
    }
  }, [isOpen]);

  async function loadPendingInvites() {
    setLoadingInvites(true);
    var { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error) setPendingInvites(data || []);
    setLoadingInvites(false);
  }

  async function handleSend() {
    if (!email.trim()) {
      toast.error('Email address is required.');
      return;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSending(true);

    // Check for existing pending invite
    var { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email.trim().toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      toast.error('This email already has a pending invitation.');
      setSending(false);
      return;
    }

    var expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    var { data: invite, error: insertError } = await supabase
      .from('invitations')
      .insert({
        email: email.trim().toLowerCase(),
        organization_id: organizationId,
        role: role,
        message: message.trim() || null,
        invited_by: currentUserId,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      mascotErrorToast('Failed to create invitation.', 'Please try again.');
      setSending(false);
      return;
    }

    await sendInviteEmail(invite, email.trim().toLowerCase());

    setEmail('');
    setRole('member');
    setMessage('');
    setSending(false);
    loadPendingInvites();
  }

  async function sendInviteEmail(invite, recipientEmail) {
    var inviteUrl = 'https://syndicade.org/accept-invite?token=' + invite.id;
    var personalHtml = invite.message
      ? '<blockquote style="border-left:3px solid #3B82F6;padding-left:12px;color:#475569;margin:16px 0;">' + invite.message + '</blockquote>'
      : '';

    var { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail,
        subject: "You've been invited to join " + organizationName + ' on Syndicade',
        html:
          '<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#F8FAFC;color:#475569;padding:32px;border-radius:12px;border:1px solid #E2E8F0;">' +
          '<p style="font-size:16px;font-weight:700;color:#0E1523;margin-bottom:8px;">You\'ve been invited!</p>' +
          '<p style="color:#475569;margin-bottom:16px;">You\'ve been invited to join <strong style="color:#0E1523;">' + organizationName + '</strong> on Syndicade as a <strong style="color:#0E1523;">' + invite.role + '</strong>.</p>' +
          personalHtml +
          '<a href="' + inviteUrl + '" style="display:inline-block;background:#3B82F6;color:#FFFFFF;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;margin-top:8px;">Accept Invitation</a>' +
          '<p style="color:#94A3B8;font-size:12px;margin-top:24px;">This invitation expires in 7 days. If you don\'t have a Syndicade account yet, you\'ll be prompted to create one.</p>' +
          '</div>'
      }
    });

    if (emailError) {
      mascotSuccessToast('Invitation created.', 'Email delivery may be delayed — link is saved.');
    } else {
      mascotSuccessToast('Invitation sent!', recipientEmail + ' will receive an email shortly.');
    }
  }

  async function handleRevoke(inviteId, inviteEmail) {
    setRevoking(inviteId);
    var { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', inviteId);

    if (error) {
      mascotErrorToast('Failed to revoke invitation.', 'Please try again.');
    } else {
      mascotSuccessToast('Invitation revoked.', inviteEmail + ' can no longer use this invite.');
      loadPendingInvites();
    }
    setRevoking(null);
  }

  async function handleResend(invite) {
    setResending(invite.id);
    // Extend expiry by 7 days from now
    var newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    var { error: updateError } = await supabase
      .from('invitations')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('id', invite.id);

    if (updateError) {
      mascotErrorToast('Failed to resend invitation.', 'Please try again.');
      setResending(null);
      return;
    }

    await sendInviteEmail({ ...invite, expires_at: newExpiry.toISOString() }, invite.email);
    loadPendingInvites();
    setResending(null);
  }

  function handleCopyLink(inviteId) {
    var link = 'https://syndicade.org/accept-invite?token=' + inviteId;
    navigator.clipboard.writeText(link).then(function () {
      toast.success('Invite link copied!');
    }).catch(function () {
      toast.error('Could not copy to clipboard.');
    });
  }

  function formatExpiry(dateStr) {
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function isExpiringSoon(dateStr) {
    var d = new Date(dateStr);
    var diff = d - new Date();
    return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000; // within 48 hours
  }

  function getRoleDescription(r) {
    if (r === 'member') return 'Can view org content and RSVP to events.';
    if (r === 'editor') return 'Can create and manage events, announcements, and content.';
    if (r === 'admin') return 'Full access — can manage members, billing, and settings.';
    return '';
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(14,21,35,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-invite-title"
    >
      <div
        className="w-full max-w-lg rounded-xl border flex flex-col"
        style={{ background: '#FFFFFF', borderColor: '#E2E8F0', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: '#E2E8F0' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.1)' }}
            >
              <UserPlus size={16} style={{ color: '#3B82F6' }} aria-hidden="true" />
            </div>
            <h2
              id="org-invite-title"
              className="font-bold"
              style={{ fontSize: '16px', color: '#0E1523' }}
            >
              Invite Member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ color: '#64748B' }}
            aria-label="Close invite member dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Email */}
          <div>
            <label
              htmlFor="invite-email"
              className="block text-xs font-bold uppercase mb-2"
              style={{ color: '#F5B731', letterSpacing: '4px' }}
            >
              Email Address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={function (e) { setEmail(e.target.value); }}
              onKeyDown={function (e) { if (e.key === 'Enter') handleSend(); }}
              placeholder="member@example.com"
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#0E1523'
              }}
              aria-required="true"
              autoComplete="email"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="invite-role"
              className="block text-xs font-bold uppercase mb-2"
              style={{ color: '#F5B731', letterSpacing: '4px' }}
            >
              Role
            </label>
            <div className="relative">
              <select
                id="invite-role"
                value={role}
                onChange={function (e) { setRole(e.target.value); }}
                className="w-full rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#0E1523'
                }}
              >
                <option value="member">Member</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#94A3B8' }}
                aria-hidden="true"
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: '#64748B' }}>
              {getRoleDescription(role)}
            </p>
          </div>

          {/* Personal message */}
          <div>
            <label
              htmlFor="invite-message"
              className="block text-xs font-bold uppercase mb-2"
              style={{ color: '#F5B731', letterSpacing: '4px' }}
            >
              Personal Message{' '}
              <span style={{ color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', fontSize: '11px' }}>
                (optional)
              </span>
            </label>
            <textarea
              id="invite-message"
              value={message}
              onChange={function (e) { setMessage(e.target.value); }}
              placeholder="Add a personal note to include in the invite email..."
              rows={3}
              className="w-full rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#0E1523'
              }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#3B82F6', color: 'white' }}
          >
            <Send size={14} aria-hidden="true" />
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: '#E2E8F0' }} />

          {/* Pending invites */}
          <div>
            <p
              className="text-xs font-bold uppercase mb-3"
              style={{ color: '#F5B731', letterSpacing: '4px' }}
            >
              Pending Invitations
            </p>

            {loadingInvites ? (
              <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading pending invitations">
                {[1, 2].map(function (i) {
                  return (
                    <div
                      key={i}
                      className="h-16 rounded-lg animate-pulse"
                      style={{ background: '#F1F5F9' }}
                    />
                  );
                })}
              </div>
            ) : pendingInvites.length === 0 ? (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <Mail size={14} style={{ color: '#94A3B8' }} className="shrink-0" aria-hidden="true" />
                <p className="text-sm" style={{ color: '#64748B' }}>
                  No pending invitations.
                </p>
              </div>
            ) : (
              <ul
                className="flex flex-col gap-2"
                role="list"
                aria-label="Pending invitations list"
              >
                {pendingInvites.map(function (inv) {
                  var expiring = isExpiringSoon(inv.expires_at);
                  return (
                    <li
                      key={inv.id}
                      className="rounded-lg px-4 py-3"
                      style={{ background: '#F8FAFC', border: '1px solid ' + (expiring ? 'rgba(245,183,49,0.4)' : '#E2E8F0') }}
                      role="listitem"
                      aria-label={'Pending invitation for ' + inv.email}
                    >
                      {/* Email + expiry row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="text-sm font-semibold truncate block" style={{ color: '#0E1523' }}>
                            {inv.email}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs capitalize" style={{ color: '#475569' }}>
                              {inv.role}
                            </span>
                            <span style={{ color: '#CBD5E1' }}>·</span>
                            <div className="flex items-center gap-1">
                              <Clock size={10} style={{ color: expiring ? '#F5B731' : '#94A3B8' }} aria-hidden="true" />
                              <span
                                className="text-xs"
                                style={{ color: expiring ? '#B45309' : '#64748B' }}
                              >
                                {expiring ? 'Expires soon — ' : 'Expires '}
                                {formatExpiry(inv.expires_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Action buttons row */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={function () { handleCopyLink(inv.id); }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            background: 'rgba(59,130,246,0.08)',
                            color: '#3B82F6',
                            border: '1px solid rgba(59,130,246,0.2)'
                          }}
                          aria-label={'Copy invite link for ' + inv.email}
                        >
                          <Copy size={10} aria-hidden="true" />
                          Copy Link
                        </button>
                        <button
                          onClick={function () { handleResend(inv); }}
                          disabled={resending === inv.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: '#F8FAFC',
                            color: '#475569',
                            border: '1px solid #E2E8F0'
                          }}
                          aria-label={'Resend invitation to ' + inv.email}
                        >
                          <RotateCcw size={10} aria-hidden="true" />
                          {resending === inv.id ? 'Resending...' : 'Resend'}
                        </button>
                        <button
                          onClick={function () { handleRevoke(inv.id, inv.email); }}
                          disabled={revoking === inv.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ml-auto focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'rgba(239,68,68,0.06)',
                            color: '#EF4444',
                            border: '1px solid rgba(239,68,68,0.2)'
                          }}
                          aria-label={'Revoke invitation for ' + inv.email}
                        >
                          <Trash2 size={10} aria-hidden="true" />
                          {revoking === inv.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end px-6 py-4 border-t shrink-0"
          style={{ borderColor: '#E2E8F0' }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            style={{ background: 'transparent', borderColor: '#E2E8F0', color: '#475569' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}