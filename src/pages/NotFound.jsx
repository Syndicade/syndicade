import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  var navigate = useNavigate();

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#0E1523' }}
      role="main"
      aria-labelledby="not-found-heading"
    >
      <div className="text-center" style={{ maxWidth: '480px', width: '100%' }}>

        <img
          src="/mascots-empty.png"
          alt=""
          aria-hidden="true"
          style={{ width: '100%', maxWidth: '380px', display: 'block', margin: '0 auto 8px' }}
        />

        <h1
          id="not-found-heading"
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 10px',
            letterSpacing: '-0.3px',
            fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
          }}
        >
          Nothing's pinned here yet.
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#64748B',
          margin: '0 0 32px',
          lineHeight: 1.6,
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
        }}>
          This page doesn't exist — or it's been moved.<br />
          Try heading back to your board.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>

          <button
            onClick={function() { navigate(-1); }}
            aria-label="Go back to previous page"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              background: 'transparent',
              border: '1px solid #2A3550',
              borderRadius: '8px',
              color: '#CBD5E1',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
            }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Go Back
          </button>

          <button
            onClick={function() { navigate('/dashboard'); }}
            aria-label="Go to your dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              background: '#3B82F6',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
            }}
            className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <LayoutDashboard size={15} aria-hidden="true" />
            Back to Your Board
          </button>

        </div>

        <p style={{
          fontSize: '11px',
          color: '#2A3550',
          margin: '28px 0 0',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontWeight: 700,
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
        }}>
          Error 404
        </p>

      </div>
    </main>
  );
}