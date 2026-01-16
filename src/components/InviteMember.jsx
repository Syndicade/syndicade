import { useState } from 'react';
import { supabase } from '../lib/supabase';

function InviteMember({ organizationId, organizationName, onInviteSent }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const roles = [
    { value: 'admin', label: 'Admin', description: 'Can manage organization and members' },
    { value: 'member', label: 'Member', description: 'Standard member access' },
    { value: 'guest', label: 'Guest', description: 'Limited access to public content' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: existingMember, error: memberCheckError } = await supabase
        .from('members')
        .select('user_id, first_name, last_name')
        .eq('email', email.toLowerCase())
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError;
      }

      if (existingMember) {
        const { data: existingMembership } = await supabase
          .from('memberships')
          .select('status')
          .eq('member_id', existingMember.user_id)
          .eq('organization_id', organizationId)
          .single();

        if (existingMembership) {
          if (existingMembership.status === 'active') {
            throw new Error(`${existingMember.first_name} ${existingMember.last_name} is already a member`);
          } else if (existingMembership.status === 'pending') {
            throw new Error(`${existingMember.first_name} ${existingMember.last_name} already has a pending invitation`);
          }
        }

        const { error: membershipError } = await supabase
          .from('memberships')
          .insert([{
            member_id: existingMember.user_id,
            organization_id: organizationId,
            role: role,
            status: 'pending',
            invited_by: user.id,
            invited_at: new Date().toISOString()
          }]);

        if (membershipError) throw membershipError;

        setSuccess(true);
        setEmail('');
        setMessage('');
        
        if (onInviteSent) {
          onInviteSent({
            email,
            name: `${existingMember.first_name} ${existingMember.last_name}`,
            role
          });
        }

      } else {
        const { error: inviteError } = await supabase
          .from('invitations')
          .insert([{
            email: email.toLowerCase(),
            organization_id: organizationId,
            role: role,
            message: message,
            invited_by: user.id,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }]);

        if (inviteError) throw inviteError;

        setSuccess(true);
        setEmail('');
        setMessage('');

        if (onInviteSent) {
          onInviteSent({ email, role, isNewUser: true });
        }
      }

      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Error inviting member:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Invite New Member</h3>
        <p className="text-gray-600 mt-1">
          Send an invitation to join {organizationName}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">✓ Invitation sent!</p>
            <p className="text-green-700">The member will receive an email notification.</p>
          </div>
        )}

        <div>
          <label htmlFor="invite-email" className="block text-sm font-semibold text-gray-900 mb-2">
            Email Address *
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="invite-role" className="block text-sm font-semibold text-gray-900 mb-2">
            Member Role *
          </label>
          <select
            id="invite-role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>
                {r.label} - {r.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="invite-message" className="block text-sm font-semibold text-gray-900 mb-2">
            Personal Message (Optional)
          </label>
          <textarea
            id="invite-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal note to the invitation..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={300}
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length}/300 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Sending Invitation...
            </>
          ) : (
            <>✉️ Send Invitation</>
          )}
        </button>
      </form>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Invited members will receive an email with a link to join. 
          They can accept or decline the invitation.
        </p>
      </div>
    </div>
  );
}

export default InviteMember;
