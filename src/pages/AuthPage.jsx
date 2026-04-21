import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ d, size, color, strokeWidth, style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 20} height={size || 20}
      viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'}
      strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round"
      style={style || {}} aria-hidden="true">
      {Array.isArray(d)
        ? d.map(function(p, i) { return <path key={i} d={p} />; })
        : <path d={d} />}
    </svg>
  );
}

var EYE_OPEN   = ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'];
var EYE_OFF    = ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'];
var ALERT_ICON = 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z';
var CHECK      = 'M5 13l4 4L19 7';

var inputBase = {
  width: '100%', padding: '11px 14px', background: '#1E2845',
  border: '1px solid #2A3550', borderRadius: '8px', color: '#FFFFFF',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

var labelSt = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731',
  textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px',
};

function iFocus(e) { e.target.style.borderColor = '#3B82F6'; }
function iBlur(e, err) { e.target.style.borderColor = err ? '#EF4444' : '#2A3550'; }

function ErrMsg({ id, msg }) {
  return (
    <p id={id} role="alert" style={{ marginTop: '4px', fontSize: '12px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Icon d={ALERT_ICON} size={12} color="#f87171" />{msg}
    </p>
  );
}

function PwField({ id, label, value, onChange, placeholder, autoComplete, error, hintId, hintText }) {
  var [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={labelSt}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange}
          placeholder={placeholder || ''} autoComplete={autoComplete || 'new-password'}
          required aria-required="true" aria-invalid={!!error}
          aria-describedby={error ? id + '-err' : hintId}
          style={Object.assign({}, inputBase, { paddingRight: '44px' }, error ? { borderColor: '#EF4444' } : {})}
          onFocus={iFocus} onBlur={function(e) { iBlur(e, !!error); }} />
        <button type="button" onClick={function() { setShow(function(s) { return !s; }); }}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'flex' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={show ? 'Hide password' : 'Show password'}>
          <Icon d={show ? EYE_OFF : EYE_OPEN} size={16} />
        </button>
      </div>
      {error
        ? <ErrMsg id={id + '-err'} msg={error} />
        : hintText && <p id={hintId} style={{ marginTop: '4px', fontSize: '12px', color: '#64748B' }}>{hintText}</p>
      }
    </div>
  );
}

function PwStrength({ password }) {
  if (!password) return null;
  var score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  var labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  var colors = ['', '#EF4444', '#F5B731', '#3B82F6', '#22C55E'];
  return (
    <div style={{ marginTop: '6px' }} aria-live="polite" aria-label={'Password strength: ' + (labels[score] || '')}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
        {[1,2,3,4].map(function(i) {
          return <div key={i} style={{ height: '3px', flex: 1, borderRadius: '99px', background: i <= score ? colors[score] : '#2A3550', transition: 'background 0.2s' }} />;
        })}
      </div>
      {labels[score] && <p style={{ fontSize: '11px', color: colors[score], margin: 0 }}>{labels[score]}</p>}
    </div>
  );
}

function TermsBox({ checked, onChange, error }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
        <div role="checkbox" aria-checked={checked} tabIndex={0}
          onClick={function() { onChange(!checked); }}
          onKeyDown={function(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]"
          style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px', border: '2px solid ' + (checked ? '#3B82F6' : error ? '#EF4444' : '#2A3550'), background: checked ? '#3B82F6' : '#1E2845', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
          aria-describedby={error ? 'terms-err' : undefined} aria-invalid={!!error}>
          {checked && <Icon d={CHECK} size={11} color="#fff" strokeWidth={3} />}
        </div>
        <span style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5 }}>
          I agree to Syndicade&apos;s{' '}
          <Link to="/legal" style={{ color: '#3B82F6', fontWeight: 600 }}>Terms of Service</Link>
          {' '}and{' '}
          <Link to="/legal" style={{ color: '#3B82F6', fontWeight: 600 }}>Privacy Policy</Link>
        </span>
      </label>
      {error && <ErrMsg id="terms-err" msg={error} />}
    </div>
  );
}

function Spinner({ dark }) {
  var c = dark ? '#0E1523' : 'currentColor';
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="4" opacity="0.25" />
      <path fill={c} d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Signup form
// ---------------------------------------------------------------------------
function SignupForm({ onSwitchToLogin }) {
  var navigate = useNavigate();
  var [firstName, setFirstName]             = useState('');
  var [lastName, setLastName]               = useState('');
  var [email, setEmail]                     = useState('');
  var [password, setPassword]               = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [agreed, setAgreed]                   = useState(false);
  var [errors, setErrors]                   = useState({});
  var [loading, setLoading]                 = useState(false);

  function clearError(key) {
    setErrors(function(prev) { var n = Object.assign({}, prev); delete n[key]; return n; });
  }

  function validate() {
    var errs = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!agreed) errs.agreed = 'You must agree to the Terms of Service to continue.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      var result = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } }
      });
      if (result.error) throw result.error;

      if (result.data && result.data.user) {
        await supabase.from('members').insert({
          user_id: result.data.user.id,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          onboarding_completed: false,
        });
      }

      // Navigate to /welcome — the WelcomePage handles the post-signup setup
      navigate('/welcome', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Mascot — centered */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <img src="/mascot-pair.png" alt="" aria-hidden="true"
          style={{ width: '80px', height: 'auto', display: 'block', marginBottom: '14px' }} />
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px', textAlign: 'center' }}>
          Create your free account
        </h1>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>
          Join organizations and stay connected with your community.
        </p>
      </div>

      <form id="signup-form" onSubmit={handleSubmit} noValidate aria-label="Create account form">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="sig-first" style={labelSt}>First Name</label>
              <input id="sig-first" type="text" value={firstName}
                onChange={function(e) { setFirstName(e.target.value); clearError('firstName'); }}
                placeholder="Jane" autoComplete="given-name"
                required aria-required="true" aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'sig-first-err' : undefined}
                style={Object.assign({}, inputBase, errors.firstName ? { borderColor: '#EF4444' } : {})}
                onFocus={iFocus} onBlur={function(e) { iBlur(e, !!errors.firstName); }} />
              {errors.firstName && <ErrMsg id="sig-first-err" msg={errors.firstName} />}
            </div>
            <div>
              <label htmlFor="sig-last" style={labelSt}>Last Name</label>
              <input id="sig-last" type="text" value={lastName}
                onChange={function(e) { setLastName(e.target.value); clearError('lastName'); }}
                placeholder="Smith" autoComplete="family-name"
                required aria-required="true" aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'sig-last-err' : undefined}
                style={Object.assign({}, inputBase, errors.lastName ? { borderColor: '#EF4444' } : {})}
                onFocus={iFocus} onBlur={function(e) { iBlur(e, !!errors.lastName); }} />
              {errors.lastName && <ErrMsg id="sig-last-err" msg={errors.lastName} />}
            </div>
          </div>

          <div>
            <label htmlFor="sig-email" style={labelSt}>Email Address</label>
            <input id="sig-email" type="email" value={email}
              onChange={function(e) { setEmail(e.target.value); clearError('email'); }}
              placeholder="you@example.com" autoComplete="email"
              required aria-required="true" aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'sig-email-err' : undefined}
              style={Object.assign({}, inputBase, errors.email ? { borderColor: '#EF4444' } : {})}
              onFocus={iFocus} onBlur={function(e) { iBlur(e, !!errors.email); }} />
            {errors.email && <ErrMsg id="sig-email-err" msg={errors.email} />}
          </div>

          <div>
            <PwField id="sig-pw" label="Password" value={password}
              onChange={function(e) { setPassword(e.target.value); clearError('password'); }}
              placeholder="At least 8 characters" autoComplete="new-password"
              error={errors.password} hintId="sig-pw-hint"
              hintText="Use uppercase, numbers, and symbols for a stronger password." />
            <PwStrength password={password} />
          </div>

          <PwField id="sig-confirm" label="Confirm Password" value={confirmPassword}
            onChange={function(e) { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
            placeholder="Re-enter your password" autoComplete="new-password"
            error={errors.confirmPassword} />

          <TermsBox checked={agreed} onChange={function(v) { setAgreed(v); clearError('agreed'); }} error={errors.agreed} />
        </div>

        <button type="submit" disabled={loading} aria-busy={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '24px', padding: '13px 24px', background: loading ? '#F5B731AA' : '#F5B731', color: '#0E1523', fontWeight: 800, fontSize: '15px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-[#1A2035]">
          {loading ? <><Spinner dark />Creating your account...</> : 'Create My Free Account'}
        </button>
      </form>

      {/* Trust bar */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #2A3550' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
          {[
            { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Free for individuals' },
            { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', text: 'No credit card needed' },
          ].map(function(item) {
            return (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Icon d={item.icon} size={13} color="#22C55E" strokeWidth={2.5} />
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{item.text}</span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', margin: 0 }}>
          Individual accounts are always free. Organizations pay a monthly plan.{' '}
          <Link to="/pricing" style={{ color: '#3B82F6' }}>See pricing</Link>
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '16px' }}>
        Already have an account?{' '}
        <button onClick={onSwitchToLogin}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontWeight: 600, fontSize: '13px' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
          Sign in
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login form
// ---------------------------------------------------------------------------
function LoginForm({ onSwitchToSignup }) {
  var navigate = useNavigate();
  var [email, setEmail]       = useState('');
  var [password, setPassword] = useState('');
  var [errors, setErrors]     = useState({});
  var [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    var errs = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      var result = await supabase.auth.signInWithPassword({ email: email.trim(), password: password });
      if (result.error) throw result.error;

      // Fire-and-forget login log
      try {
        fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/log-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: result.data.user.id,
            user_agent: navigator.userAgent
          })
        });
      } catch (_) {}

      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={16} color="#3B82F6" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Welcome back</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>Sign in to your Syndicade account.</p>
      </div>

      <form id="login-form" onSubmit={handleLogin} noValidate aria-label="Sign in form">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label htmlFor="log-email" style={labelSt}>Email Address</label>
            <input id="log-email" type="email" value={email}
              onChange={function(e) { setEmail(e.target.value); setErrors(function(p) { var n = Object.assign({}, p); delete n.email; return n; }); }}
              placeholder="you@example.com" autoComplete="email"
              required aria-required="true" aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'log-email-err' : undefined}
              style={Object.assign({}, inputBase, errors.email ? { borderColor: '#EF4444' } : {})}
              onFocus={iFocus} onBlur={function(e) { iBlur(e, !!errors.email); }} />
            {errors.email && <ErrMsg id="log-email-err" msg={errors.email} />}
          </div>
          <PwField id="log-pw" label="Password" value={password}
            onChange={function(e) { setPassword(e.target.value); setErrors(function(p) { var n = Object.assign({}, p); delete n.password; return n; }); }}
            placeholder="Your password" autoComplete="current-password"
            error={errors.password} />
        </div>

        <button type="submit" disabled={loading} aria-busy={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '24px', padding: '13px 24px', background: loading ? 'rgba(59,130,246,0.6)' : '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '15px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]">
          {loading ? <><Spinner />Signing in...</> : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '20px' }}>
        Don&apos;t have an account?{' '}
        <button onClick={onSwitchToSignup}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontWeight: 600, fontSize: '13px' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
          Create one free
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AuthPage
// ---------------------------------------------------------------------------
export default function AuthPage() {
  var location   = useLocation();
  var initialTab = location.pathname === '/signup' ? 'signup' : 'login';
  var [tab, setTab] = useState(initialTab);

  useEffect(function() {
    var path = tab === 'signup' ? '/signup' : '/login';
    if (location.pathname !== path) window.history.replaceState(null, '', path);
  }, [tab]);

  return (
    <div style={{ minHeight: '100vh', background: '#0E1523', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <a href={tab === 'signup' ? '#signup-form' : '#login-form'}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none"
        style={{ background: '#F5B731', color: '#0E1523' }}>
        Skip to form
      </a>

      <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' }}>
        <div role="tablist" aria-label="Authentication options"
          style={{ display: 'flex', background: '#151B2D', border: '1px solid #2A3550', borderRadius: '12px', padding: '4px', marginBottom: '24px', gap: '4px' }}>
          {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Create Account' }].map(function(t) {
            var active = tab === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active}
                onClick={function() { setTab(t.id); }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-all"
                style={{ padding: '8px 24px', borderRadius: '9px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', background: active ? '#1A2035' : 'transparent', color: active ? '#FFFFFF' : '#64748B', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '460px' }}>
          {tab === 'login'
            ? <LoginForm onSwitchToSignup={function() { setTab('signup'); }} />
            : <SignupForm onSwitchToLogin={function() { setTab('login'); }} />
          }
        </div>
      </main>

      <Footer />
    </div>
  );
}