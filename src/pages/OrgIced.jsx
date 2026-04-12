import { useNavigate } from 'react-router-dom';

export default function OrgIced({ orgName, orgId }) {
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
      <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <img
          src="/mascot-error.png"
          alt=""
          aria-hidden="true"
          style={{ width: '200px', margin: '0 auto 28px', display: 'block' }}
        />

        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#EF4444',
          textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px'
        }}>
          Account Frozen
        </p>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
          {orgName ? orgName : 'This organization'} is frozen
        </h1>

        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.7, marginBottom: '24px' }}>
          Your free trial ended more than 30 days ago. Your data is safe, but all features are frozen until you subscribe.
        </p>

        {/* What you can still do */}
        <div style={{
          background: '#151B2D',
          border: '1px solid #2A3550',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
          textAlign: 'left'
        }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, color: '#F5B731',
            textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '14px'
          }}>
            What you can still do
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Download your member list and documents',
              'Subscribe to restore full access instantly',
              'Contact support if you need help'
            ].map(function(item, i) {
              return (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>{item}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={function() { navigate('/organizations/' + orgId + '/billing'); }}
            style={{
              padding: '13px',
              background: '#3B82F6',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '15px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="Go to billing to reactivate your organization"
          >
            Reactivate — Choose a Plan
          </button>

          <button
            onClick={function() { navigate('/dashboard'); }}
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
            aria-label="Go to your dashboard"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}