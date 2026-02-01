import { QRCodeSVG } from 'qrcode.react';

function EventCheckIn({ event, onClose }) {
  // Generate GUEST check-in URL (not member check-in)
  const guestCheckInUrl = `${window.location.origin}/guest-check-in/${event.id}`;

  const downloadQR = () => {
    const svg = document.getElementById('guest-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `guest-checkin-${event.title.replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🎫 Guest Check-In QR Code</h2>
              <p className="text-gray-600 mt-1">{event.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="bg-white p-8 rounded-lg border-4 border-purple-300 shadow-lg">
              <QRCodeSVG
                id="guest-qr-code"
                value={guestCheckInUrl}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-5">
            <h3 className="font-bold text-purple-900 mb-3 text-lg">📱 For Walk-In Guests:</h3>
            <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
              <li>Display this QR code at your event entrance</li>
              <li>Guests scan with their phone camera</li>
              <li>They fill out a quick form (name, email, phone)</li>
              <li>Instant check-in - no account needed!</li>
            </ol>
          </div>

          {/* Member Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Note:</strong> Members with accounts should use the "Check In" button on the event page instead.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={downloadQR}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-semibold flex items-center justify-center gap-2"
            >
              <span>📥</span> Download QR
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(guestCheckInUrl);
                alert('✓ Guest check-in link copied!');
              }}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold flex items-center justify-center gap-2"
            >
              <span>📋</span> Copy Link
            </button>
          </div>

          {/* URL Display */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Guest Check-In URL:
            </label>
            <input
              type="text"
              value={guestCheckInUrl}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              onClick={(e) => e.target.select()}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCheckIn;