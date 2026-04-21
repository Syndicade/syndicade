import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function VerifyEmailPage() {
  var [status, setStatus] = useState('loading');
  var [searchParams] = useSearchParams();
  var navigate = useNavigate();

  useEffect(function() {
    var token = searchParams.get('token');
    if (!token) { setStatus('invalid'); return; }
    fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/verify-contact-email?token=' + token)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) { setStatus('success'); }
        else { setStatus('invalid'); }
      })
      .catch(function() { setStatus('invalid'); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0E1523', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '16px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ width: '48px', height: '48px', border: '3px solid #2A3550', borderTop: '3px solid #3B82F6', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} aria-hidden="true" />
            <style>{'.spin-anim{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}'}</style>
            <p style={{ color: '#CBD5E1', fontSize: '16px' }}>Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: '56px', height: '56px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Email Verified</h1>
            <p style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>Your organization's contact email has been verified. You're all set.</p>
            <button
              onClick={function() { navigate('/dashboard'); }}
              style={{ background: '#3B82F6', color: '#FFFFFF', fontWeight: '700', fontSize: '15px', padding: '14px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%' }}
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Invalid Link</h1>
            <p style={{ color: '#CBD5E1', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>This verification link is invalid or has already been used. If you need a new link, go to your organization settings.</p>
            <button
              onClick={function() { navigate('/dashboard'); }}
              style={{ background: '#1E2845', color: '#CBD5E1', fontWeight: '700', fontSize: '15px', padding: '14px 28px', borderRadius: '8px', border: '1px solid #2A3550', cursor: 'pointer', width: '100%' }}
            >
              Go to Dashboard
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default VerifyEmailPage;