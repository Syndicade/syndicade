import { useState } from 'react';
import { X, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';

export default function CollaborationRequestModal({ event, userOrgs, onClose, onSuccess }) {
  var [selectedOrgId, setSelectedOrgId] = var_state(userOrgs.length === 1 ? userOrgs[0].id : '');
  var [message, setMessage] = useState('');
  var [submitting, setSubmitting] = useState(false);

  function var_state(initial) { return useState(initial); }

  async function handleSubmit() {
    if (!selectedOrgId) {
      toast.error('Please select an organization.');
      return;
    }

    setSubmitting(true);

    try {
      // Check for existing request
      var { data: existing } = await supabase
        .from('event_collaborators')
        .select('id, status')
        .eq('event_id', event.id)
        .eq('requesting_org_id', selectedOrgId)
        .maybeSingle();

      if (existing) {
        toast.error(
          existing.status === 'declined'
            ? 'Your previous request was declined.'
            : 'A request already exists for this event.'
        );
        setSubmitting(false);
        return;
      }

      var { error } = await supabase
        .from('event_collaborators')
        .insert({
          event_id: event.id,
          requesting_org_id: selectedOrgId,
          host_org_id: event.organization_id,
          status: 'pending',
          message: message.trim() || null,
        });

      if (error) throw error;

      // Notify host org admins
      var { data: hostAdmins } = await supabase
        .from('memberships')
        .select('member_id')
        .eq('organization_id', event.organization_id)
        .eq('role', 'admin');

      var selectedOrg = userOrgs.find(function(o) { return o.id === selectedOrgId; });

      if (hostAdmins && hostAdmins.length > 0) {
var notifications = hostAdmins.map(function(a) {
        return {
            user_id: a.member_id,
            organization_id: event.organization_id,
            type: 'collab_request',
            title: 'Co-host Request',
            message: (selectedOrg ? selectedOrg.name : 'An organization') + ' wants to co-host "' + event.title + '"',
            link: '/org/' + event.organization_id + '/events',
            read: false,
        };
        });
        await supabase.from('notifications').insert(notifications);
      }

      mascotSuccessToast('Request sent!', 'The event organizer will be notified.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      mascotErrorToast('Failed to send request.', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-modal-title"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)' }}
    >
      <div
        style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="#3B82F6" aria-hidden="true" />
            <h2 id="collab-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
              Request to Co-Host
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Event name */}
        <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#CBD5E1' }}>
          Sending a co-host request for <strong style={{ color: '#FFFFFF' }}>{event.title}</strong>
        </p>

        {/* Org selector */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="collab-org-select"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}
          >
            Your Organization
          </label>
          {userOrgs.length === 1 ? (
            <div
              style={{ background: '#0E1523', border: '1px solid #2A3550', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#FFFFFF' }}
            >
              {userOrgs[0].name}
            </div>
          ) : (
            <select
              id="collab-org-select"
              value={selectedOrgId}
              onChange={function(e) { setSelectedOrgId(e.target.value); }}
              aria-required="true"
              style={{ width: '100%', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#FFFFFF', outline: 'none' }}
              className="focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an organization...</option>
              {userOrgs.map(function(org) {
                return (
                  <option key={org.id} value={org.id}>{org.name}</option>
                );
              })}
            </select>
          )}
        </div>

        {/* Message */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="collab-message"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}
          >
            Message <span style={{ color: '#64748B', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="collab-message"
            value={message}
            onChange={function(e) { setMessage(e.target.value); }}
            placeholder="Introduce your organization or explain how you'd like to collaborate..."
            rows={3}
            maxLength={500}
            style={{ width: '100%', background: '#0E1523', border: '1px solid #2A3550', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#FFFFFF', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            className="focus:ring-2 focus:ring-blue-500"
          />
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
            {message.length}/500
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2A3550', borderRadius: '8px', color: '#CBD5E1', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedOrgId}
            style={{
              padding: '10px 20px',
              background: submitting || !selectedOrgId ? '#1E2845' : '#3B82F6',
              border: 'none',
              borderRadius: '8px',
              color: submitting || !selectedOrgId ? '#64748B' : '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: submitting || !selectedOrgId ? 'not-allowed' : 'pointer',
            }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}