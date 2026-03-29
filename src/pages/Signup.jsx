import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Signup() {
  var [accountType, setAccountType] = useState(null); // 'org' | 'member'
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);
  var [message, setMessage] = useState('');

  var navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    try {
      setError('');
      setMessage('');
      setLoading(true);

      var { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      setMessage('Account created! Setting things up...');
      setTimeout(function() {
        navigate('/onboarding?type=' + accountType);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  // ── Choice screen ────────────────────────────────────────────────────────────
  if (!accountType) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0E1523',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>Syndi</span>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#F5B731' }}>cade</span>
            </a>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '8px' }}>Where Community Work Connects</p>
          </div>

          <div style={{
            background: '#1A2035', border: '1px solid #2A3550',
            borderRadius: '16px', padding: '32px'
          }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px', textAlign: 'center' }}>
              How are you joining?
            </h1>
            <p style={{ fontSize: '14px', color: '#94A3B8', textAlign: 'center', marginBottom: '28px' }}>
              Choose how you'd like to use Syndicade.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Org option */}
              <button
                onClick={function() { setAccountType('org'); }}
                style={{
                  background: '#0E1523', border: '1px solid #2A3550',
                  borderRadius: '12px', padding: '20px', cursor: 'pointer',
                  textAlign: 'left', transition: 'border-color 0.15s', width: '100%',
                  display: 'flex', alignItems: 'flex-start', gap: '16px'
                }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = '#3B82F6'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#2A3550'; }}
                aria-label="Create an organization account"
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'rgba(59,130,246,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" aria-hidden="true">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                    I represent an organization
                  </p>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                    Nonprofits, clubs, associations, and community groups. Set up your org page and manage your members.
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Member option */}
              <button
                onClick={function() { setAccountType('member'); }}
                style={{
                  background: '#0E1523', border: '1px solid #2A3550',
                  borderRadius: '12px', padding: '20px', cursor: 'pointer',
                  textAlign: 'left', transition: 'border-color 0.15s', width: '100%',
                  display: 'flex', alignItems: 'flex-start', gap: '16px'
                }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = '#22C55E'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#2A3550'; }}
                aria-label="Create a member account"
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'rgba(34,197,94,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                    I'm joining as a member
                  </p>
                  <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                    Find and join local organizations, track events, and stay connected with your community.
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '24px' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Email/password form ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0E1523',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>Syndi</span>
            <span style={{ fontSize: '28px', fontWeight: 800, color: '#F5B731' }}>cade</span>
          </a>
        </div>

        <div style={{
          background: '#1A2035', border: '1px solid #2A3550',
          borderRadius: '16px', padding: '32px'
        }}>
          {/* Back button + context badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={function() { setAccountType(null); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'flex', alignItems: 'center' }}
              aria-label="Go back to account type selection"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
              background: accountType === 'org' ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)',
              color: accountType === 'org' ? '#3B82F6' : '#22C55E',
              border: '1px solid ' + (accountType === 'org' ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)')
            }}>
              {accountType === 'org' ? 'Organization account' : 'Member account'}
            </span>
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            Create your account
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>
            {accountType === 'org'
              ? "You'll set up your organization details on the next screen."
              : "You'll complete your profile and find organizations on the next screen."}
          </p>

          {error && (
            <div role="alert" style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#FCA5A5', padding: '12px 16px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div role="alert" style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              color: '#86EFAC', padding: '12px 16px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '16px'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="email" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  id="email" type="email" required value={email}
                  onChange={function(e) { setEmail(e.target.value); }}
                  placeholder="you@example.com" disabled={loading}
                  aria-required="true"
                  style={{ width: '100%', padding: '10px 14px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
                  onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
                />
              </div>

              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  id="password" type="password" required value={password}
                  onChange={function(e) { setPassword(e.target.value); }}
                  placeholder="At least 6 characters" disabled={loading}
                  aria-required="true" aria-describedby="pw-hint"
                  style={{ width: '100%', padding: '10px 14px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
                  onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
                />
                <p id="pw-hint" style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword" type="password" required value={confirmPassword}
                  onChange={function(e) { setConfirmPassword(e.target.value); }}
                  placeholder="Re-enter your password" disabled={loading}
                  aria-required="true"
                  style={{ width: '100%', padding: '10px 14px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
                  onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', marginTop: '24px', padding: '12px',
                background: loading ? '#1E2845' : '#3B82F6',
                color: '#FFFFFF', fontWeight: 700, fontSize: '15px',
                borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s'
              }}
              aria-busy={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;