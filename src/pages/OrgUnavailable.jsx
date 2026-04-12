import { useNavigate } from 'react-router-dom';

export default function OrgUnavailable({ orgName }) {
  var navigate = useNavigate();

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
        <img
          src="/mascot-error.png"
          alt=""
          aria-hidden="true"
          style={{ width: '200px', margin: '0 auto 28px', display: 'block' }}
        />

        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#F5B731',
          textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px'
        }}>
          Temporarily Unavailable
        </p>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
          {orgName ? orgName : 'This organization'} is paused
        </h1>

        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.7, marginBottom: '32px' }}>
          This organization's free trial has ended and their account is currently inactive.
          If you're a member, reach out to your admin to get things back up and running.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={function() { navigate('/dashboard'); }}
            style={{
              padding: '12px',
              background: '#3B82F6',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="Go to your dashboard"
          >
            Back to Your Dashboard
          </button>

          <button
            onClick={function() { navigate('/explore'); }}
            style={{
              padding: '12px',
              background: 'transparent',
              color: '#94A3B8',
              fontWeight: 600,
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #2A3550',
              cursor: 'pointer'
            }}
            aria-label="Browse other organizations"
          >
            Browse Other Organizations
          </button>
        </div>
      </div>
    </div>
  );
}