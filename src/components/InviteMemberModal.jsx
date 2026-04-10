import { useState, useEffect } from 'react';
import { X, UserPlus, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from './MascotToast';

export default function InviteMemberModal({ isOpen, onClose, currentUserId, adminOrgs }) {
  var [email, setEmail] = useState('');
  var [role, setRole] = useState('member');
  var [message, setMessage] = useState('');
  var [selectedOrgId, setSelectedOrgId] = useState('');
  var [submitting, setSubmitting] = useState(false);
  var [emailError, setEmailError] = useState('');

  useEffect(function() {
    if (isOpen) {
      setEmail('');
      setRole('member');
      setMessage('');
      setEmailError('');
      setSelectedOrgId(adminOrgs && adminOrgs.length === 1 ? adminOrgs[0].id : '');
    }
  }, [isOpen]);

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEmailError('');

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (!selectedOrgId) {
      toast.error('Please select an organization.');
      return;
    }

    setSubmitting(true);
    try {
      var expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      var { error } = await supabase.from('invitations').insert({
        email: email.trim().toLowerCase(),
        organization_id: selectedOrgId,
        role: role,
        message: message.trim() || null,
        invited_by: currentUserId,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      });

      if (error) throw error;

      // Send email via edge function
      var selectedOrg = adminOrgs.find(function(o) { return o.id === selectedOrgId; });
      await supabase.functions.invoke('send-email', {
        body: {
          to: email.trim().toLowerCase(),
          subject: 'You have been invited to join ' + (selectedOrg ? selectedOrg.name : 'an organization') + ' on Syndicade',
          html: '<p>You have been invited to join <strong>' + (selectedOrg ? selectedOrg.name : 'an organization') + '</strong> on Syndicade.</p>' +
                (message.trim() ? '<p>' + message.trim() + '</p>' : '') +
                '<p>Accept your invitation at <a href="https://syndicade-git-main-syndicades-projects.vercel.app">syndicade.com</a></p>'
        }
      });

      mascotSuccessToast('Invitation sent!', email + ' will receive an email shortly.');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background: 'rgba(0,0,0,0.7)'}}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-title"
    >
      <div
        className="w-full max-w-md rounded-xl border"
        style={{background: '#1A2035', borderColor: '#2A3550'}}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{borderColor: '#2A3550'}}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{background: 'rgba(59,130,246,0.15)'}}
            >
              <UserPlus size={16} className="text-blue-400" aria-hidden="true" />
            </div>
            <h2
              id="invite-member-title"
              className="font-bold text-white"
              style={{fontSize: '16px'}}
            >
              Invite a Member
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close invite member dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 flex flex-col gap-4">

            {/* Org selector — only show if admin of multiple orgs */}
            {adminOrgs && adminOrgs.length > 1 && (
              <div>
                <label
                  htmlFor="invite-org-select"
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{color: '#F5B731', letterSpacing: '4px'}}
                >
                  Organization
                </label>
                <div className="relative">
                  <select
                    id="invite-org-select"
                    value={selectedOrgId}
                    onChange={function(e) { setSelectedOrgId(e.target.value); }}
                    required
                    aria-required="true"
                    className="w-full rounded-lg px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{background: '#0E1523', border: '1px solid #2A3550', color: '#CBD5E1'}}
                  >
                    <option value="">Select an organization...</option>
                    {adminOrgs.map(function(org) {
                      return (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="invite-email"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{color: '#F5B731', letterSpacing: '4px'}}
              >
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); setEmailError(''); }}
                placeholder="name@example.com"
                required
                aria-required="true"
                aria-describedby={emailError ? 'invite-email-error' : undefined}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{background: '#0E1523', border: '1px solid ' + (emailError ? '#EF4444' : '#2A3550'), color: '#CBD5E1'}}
              />
              {emailError && (
                <p
                  id="invite-email-error"
                  role="alert"
                  className="mt-1 text-xs"
                  style={{color: '#EF4444'}}
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{color: '#F5B731', letterSpacing: '4px'}}
              >
                Role
              </label>
              <div className="flex gap-3">
                {['member', 'admin'].map(function(r) {
                  return (
                    <label
                      key={r}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="invite-role"
                        value={r}
                        checked={role === r}
                        onChange={function() { setRole(r); }}
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                      <span
                        className="text-sm capitalize"
                        style={{color: '#CBD5E1'}}
                      >
                        {r}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="invite-message"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{color: '#F5B731', letterSpacing: '4px'}}
              >
                Personal Message
                <span className="ml-1 normal-case font-normal" style={{color: '#64748B', letterSpacing: '0'}}>
                  (optional)
                </span>
              </label>
              <textarea
                id="invite-message"
                value={message}
                onChange={function(e) { setMessage(e.target.value); }}
                placeholder="Add a personal note to your invitation..."
                rows={3}
                maxLength={300}
                className="w-full rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{background: '#0E1523', border: '1px solid #2A3550', color: '#CBD5E1'}}
              />
              <p className="mt-1 text-right text-xs" style={{color: '#64748B'}}>
                {message.length}/300
              </p>
            </div>

          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{borderColor: '#2A3550'}}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-gray-500"
              style={{background: 'transparent', borderColor: '#2A3550', color: '#94A3B8'}}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}