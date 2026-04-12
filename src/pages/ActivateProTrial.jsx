import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ActivateProTrial() {
  var [searchParams] = useSearchParams();
  var navigate = useNavigate();
  var token = searchParams.get('token');
  var orgId = searchParams.get('org');

  var [status, setStatus] = useState('loading'); // loading | success | invalid | used | error
  var [orgName, setOrgName] = useState('');

  useEffect(function() {
    if (!token || !orgId) { setStatus('invalid'); return; }
    activate();
  }, []);

  async function activate() {
    try {
      // Look up the token in enforcement_log
      var { data: logRow, error: logErr } = await supabase
        .from('enforcement_log')
        .select('id, org_id, token, token_expires_at, token_used_at')
        .eq('org_id', orgId)
        .eq('token', token)
        .eq('event_type', 'pro_upsell_offer')
        .maybeSingle();

      if (logErr || !logRow) { setStatus('invalid'); return; }
      if (logRow.token_used_at) { setStatus('used'); return; }
      if (new Date(logRow.token_expires_at) < new Date()) { setStatus('invalid'); return; }

      // Fetch org name
      var { data: org } = await supabase
        .from('organizations')
        .select('name, account_status')
        .eq('id', orgId)
        .single();

      if (org) setOrgName(org.name);

      // Extend trial by 14 days from now (Pro trial)
      var newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + 14);

      var { error: updateErr } = await supabase
        .from('organizations')
        .update({
          trial_started_at: new Date().toISOString(),
          trial_length_days: 14,
          account_status: 'active'
        })
        .eq('id', orgId);

      if (updateErr) throw updateErr;

      // Mark token as used
      await supabase
        .from('enforcement_log')
        .update({ token_used_at: new Date().toISOString() })
        .eq('id', logRow.id);

      setStatus('success');
    } catch (err) {
      console.error('ActivateProTrial error:', err);
      setStatus('error');
    }
  }

  var content = {
    loading: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      label: 'Activating',
      title: 'Activating your Pro trial…',
      body: 'Just a moment.',
      btn: null,
    },
    success: {
      icon: <img src="/mascot-success.png" alt="" aria-hidden="true" style={{ width: '160px', display: 'block', margin: '0 auto' }} />,
      label: 'Trial Activated',
      title: 'Your free Pro trial is active!',
      body: (orgName || 'Your organization') + ' now has 14 days of full Pro access — no credit card required. Explore email blasts, unlimited pages, and more.',
      btn: { label: 'Go to My Dashboard', action: function() { navigate('/organizations/' + orgId); }, color: '#3B82F6' },
    },
    used: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F5B731" strokeWidth="1.5" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      label: 'Already Used',
      title: 'This trial link has already been used',
      body: 'Each Pro trial link can only be activated once. If you need help, contact us.',
      btn: { label: 'View Pricing', action: function() { navigate('/pricing'); }, color: '#3B82F6' },
    },
    invalid: {
      icon: <img src="/mascot-error.png" alt="" aria-hidden="true" style={{ width: '160px', display: 'block', margin: '0 auto' }} />,
      label: 'Invalid Link',
      title: 'This link is invalid or expired',
      body: 'Trial activation links expire after 7 days. Contact us if you think this is a mistake.',
      btn: { label: 'Go to Pricing', action: function() { navigate('/pricing'); }, color: '#3B82F6' },
    },
    error: {
      icon: <img src="/mascot-error.png" alt="" aria-hidden="true" style={{ width: '160px', display: 'block', margin: '0 auto' }} />,
      label: 'Error',
      title: 'Something went wrong',
      body: 'We could not activate your trial. Please try again or contact support.',
      btn: { label: 'Go to Dashboard', action: function() { navigate('/dashboard'); }, color: '#3B82F6' },
    },
  };

  var c = content[status];

  return (
    <div
      role="main"
      style={{
        minHeight: '100vh',
        background: '#0E1523',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>{c.icon}</div>

        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#F5B731',
          textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px'
        }}>
          {c.label}
        </p>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
          {c.title}
        </h1>

        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.7, marginBottom: '32px' }}>
          {c.body}
        </p>

        {c.btn && (
          <button
            onClick={c.btn.action}
            style={{
              padding: '13px 28px',
              background: c.btn.color,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '15px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            {c.btn.label}
          </button>
        )}
      </div>
    </div>
  );
}