import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function Icon({ path, className, strokeWidth }) {
  var cls = className || 'h-5 w-5';
  var sw = strokeWidth || 2;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={path} />}
    </svg>
  );
}

export default function Login() {
  var navigate = useNavigate();
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [loading, setLoading] = useState(false);
  var [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      var result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (result.error) throw result.error;
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  var inputCls = 'w-full px-4 py-3 bg-[#1E2845] border border-[#2A3550] text-white placeholder-[#64748B] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#0E1523]">

      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#F5B731] focus:text-[#0E1523] focus:rounded-lg focus:font-semibold focus:outline-none"
      >
        Skip to login form
      </a>

      {/* Logo */}
      <div className="mb-8 text-center">
        <Link to="/home" className="inline-block text-3xl font-black text-white focus:outline-none focus:ring-2 focus:ring-[#F5B731] rounded">
          Syndi<span className="text-[#F5B731]">cade</span>
        </Link>
        <p className="text-[#94A3B8] text-sm mt-2">Sign in to your account</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#1A2035] border border-[#2A3550] rounded-2xl p-8">
        <form id="login-form" onSubmit={handleLogin} noValidate aria-label="Login form">
          <div className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#94A3B8] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                placeholder="you@example.com"
                required
                aria-required="true"
                autoComplete="email"
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#94A3B8] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={function(e) { setPassword(e.target.value); }}
                  placeholder="Your password"
                  required
                  aria-required="true"
                  autoComplete="current-password"
                  className={inputCls + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={function() { setShowPassword(function(prev) { return !prev; }); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <Icon path={['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21']} className="h-4 w-4" />
                  ) : (
                    <Icon path={['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z']} className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2A3550]" aria-hidden="true" />
          <span className="text-xs text-[#64748B]">or</span>
          <div className="flex-1 h-px bg-[#2A3550]" aria-hidden="true" />
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-[#94A3B8]">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
          >
            Sign up free
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#64748B] text-center">
        {'Copyright ' + new Date().getFullYear() + ' Syndicade. All rights reserved.'}
      </p>
    </div>
  );
}