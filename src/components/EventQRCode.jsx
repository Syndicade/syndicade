import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

export default function EventQRCode({ event }) {
  var [qrDataUrl, setQrDataUrl] = useState('');
  var [loading, setLoading] = useState(true);
  var canvasRef = useRef(null);

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
      toast.error('Could not generate QR code.');
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
    toast.success('QR code downloaded.');
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(eventUrl).then(function() {
      toast.success('Event link copied to clipboard.');
    });
  }

  return (
    <section
      className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-6"
      aria-label="Event QR code"
    >
      <p style={{fontSize:'11px', fontWeight:700, color:'#F5B731', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'12px'}}>
        Share This Event
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6">

        {/* QR code */}
        <div className="flex-shrink-0">
          {loading ? (
            <div className="w-[120px] h-[120px] bg-[#1E2845] rounded-lg animate-pulse" aria-label="Generating QR code" />
          ) : qrDataUrl ? (
            <div className="bg-white p-2 rounded-lg inline-block">
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
          <p className="text-[#CBD5E1] text-sm mb-1 font-semibold">Scan to view event</p>
          <p className="text-[#64748B] text-xs mb-4 break-all">{eventUrl}</p>

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              onClick={handleDownload}
              disabled={loading || !qrDataUrl}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] disabled:opacity-50"
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
              className="flex items-center gap-2 px-4 py-2 bg-[#1E2845] border border-[#2A3550] text-[#CBD5E1] text-sm font-semibold rounded-lg hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035]"
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