import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from './MascotToast';

export default function InviteOrgModal({ isOpen, onClose }) {
  var [orgName, setOrgName] = useState('');
  var [contactName, setContactName] = useState('');
  var [email, setEmail] = useState('');
  var [message, setMessage] = useState('');
  var [submitting, setSubmitting] = useState(false);
  var [emailError, setEmailError] = useState('');

  useEffect(function() {
    if (isOpen) {
      setOrgName('');
      setContactName('');
      setEmail('');
      setMessage('');
      setEmailError('');
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

    setSubmitting(true);
    try {
      var { error } = await supabase.from('marketing_contacts').insert({
        name: contactName.trim(),
        email: email.trim().toLowerCase(),
        organization: orgName.trim(),
        message: message.trim() || 'Invited via Syndicade member dashboard'
      });

      if (error) throw error;

      mascotSuccessToast('Invitation sent!', orgName + ' will receive an email about joining Syndicade.');
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
      aria-labelledby="invite-org-title"
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
              style={{background: 'rgba(139,92,246,0.15)'}}
            >
              <Building2 size={16} className="text-purple-400" aria-hidden="true" />
            </div>
            <h2
              id="invite-org-title"
              className="font-bold text-white"
              style={{fontSize: '16px'}}
            >
              Invite an Organization
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close invite organization dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 flex flex-col gap-4">

            <p className="text-sm" style={{color: '#94A3B8'}}>
              Know an organization that should be on Syndicade? We'll reach out and introduce them to the platform.
            </p>

            {/* Org Name */}
            <div>
              <label
                htmlFor="invite-org-name"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{color: '#F5B731', letterSpacing: '4px'}}
              >
                Organization Name
              </label>
              <input
                id="invite-org-name"
                type="text"
                value={orgName}
                onChange={function(e) { setOrgName(e.target.value); }}
                placeholder="Toledo Food Bank"
                required
                aria-required="true"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{background: '#0E1523', border: '1px solid #2A3550', color: '#CBD5E1'}}
              />
            </div>

            {/* Contact Name */}
            <div>
              <label
                htmlFor="invite-contact-name"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{color: '#F5B731', letterSpacing: '4px'}}
              >
                Contact Name
              </label>
              <input
                id="invite-contact-name"
                type="text"
                value={contactName}
                onChange={function(e) { setContactName(e.target.value); }}
                placeholder="Jane Smith"
                required
                aria-required="true"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{background: '#0E1523', border: '1px solid #2A3550', color: '#CBD5E1'}}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="invite-org-email"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{color: '#F5B731', letterSpacing: '4px'}}
              >
                Contact Email
              </label>
              <input
                id="invite-org-email"
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); setEmailError(''); }}
                placeholder="jane@toledofoodbank.org"
                required
                aria-required="true"
                aria-describedby={emailError ? 'invite-org-email-error' : undefined}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{background: '#0E1523', border: '1px solid ' + (emailError ? '#EF4444' : '#2A3550'), color: '#CBD5E1'}}
              />
              {emailError && (
                <p
                  id="invite-org-email-error"
                  role="alert"
                  className="mt-1 text-xs"
                  style={{color: '#EF4444'}}
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="invite-org-message"
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{color: '#F5B731', letterSpacing: '4px'}}
              >
                Message
                <span className="ml-1 normal-case font-normal" style={{color: '#64748B', letterSpacing: '0'}}>
                  (optional)
                </span>
              </label>
              <textarea
                id="invite-org-message"
                value={message}
                onChange={function(e) { setMessage(e.target.value); }}
                placeholder="Why should they join Syndicade? What's your connection to this org?"
                rows={3}
                maxLength={400}
                className="w-full rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{background: '#0E1523', border: '1px solid #2A3550', color: '#CBD5E1'}}
              />
              <p className="mt-1 text-right text-xs" style={{color: '#64748B'}}>
                {message.length}/400
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
              className="px-5 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background: '#8B5CF6', color: '#FFFFFF'}}
            >
              {submitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}