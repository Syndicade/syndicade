import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

export default function EventQRCode({ event }) {
  var [qrDataUrl, setQrDataUrl] = useState('');
  var [loading, setLoading] = useState(true);

  var eventUrl = window.location.origin + '/events/' + event.id;

  useEffect(function() {
    generateQR();
  }, [event.id]);

  async function generateQR() {
    try {
      var dataUrl = await QRCode.toDataURL(eventUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#0E1523', light: '#FFFFFF' }
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation failed:', err);
      mascotErrorToast('Could not generate QR code.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    var a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qr-' + event.title.replace(/\s+/g, '-').toLowerCase() + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    mascotSuccessToast('QR code downloaded.');
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(eventUrl).then(function() {
      mascotSuccessToast('Link copied to clipboard.');
    });
  }

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
      }}
      aria-label="Event QR code"
    >
      <p style={{ fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px' }}>
        Share This Event
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6">

        {/* QR code */}
        <div className="flex-shrink-0">
          {loading ? (
            <div
              className="animate-pulse"
              style={{ width:'120px', height:'120px', background:'#F1F5F9', borderRadius:'8px' }}
              aria-label="Generating QR code"
            />
          ) : qrDataUrl ? (
            <div style={{ background:'#FFFFFF', padding:'8px', borderRadius:'8px', border:'1px solid #E2E8F0', display:'inline-block' }}>
              <img
                src={qrDataUrl}
                alt={'QR code linking to ' + event.title + ' event page'}
                width={120}
                height={120}
              />
            </div>
          ) : null}
        </div>

        {/* Info + actions */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p style={{ color:'#0E1523', fontSize:'14px', fontWeight:600, marginBottom:'4px' }}>Scan to view event</p>
          <p style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'16px', wordBreak:'break-all' }}>{eventUrl}</p>

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              onClick={handleDownload}
              disabled={loading || !qrDataUrl}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label="Download QR code as PNG"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Copy event link to clipboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}