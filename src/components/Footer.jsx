import { useNavigate } from 'react-router-dom';

function Footer() {
  var navigate = useNavigate();
  var year = new Date().getFullYear();

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: '#151B2D', borderColor: '#2A3550' }}
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Top row: logo + tagline */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
          <div>
            <button
              onClick={function() { navigate('/dashboard'); }}
              className="flex items-baseline gap-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Go to Syndicade dashboard"
            >
              <span className="text-white font-extrabold text-2xl">Syndi</span>
              <span className="font-extrabold text-2xl" style={{ color: '#F5B731' }}>cade</span>
            </button>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Connecting communities.</p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center gap-6 justify-center sm:justify-end" aria-label="Footer navigation">
            {[
              { label: 'Dashboard',      path: '/dashboard'   },
              { label: 'Discover Events',path: '/discover'    },
              { label: 'Discover Orgs',  path: '/explore'     },
              { label: 'Calendar',       path: '/calendar'    },
            ].map(function(link) {
              return (
                <button
                  key={link.path}
                  onClick={function() { navigate(link.path); }}
                  className="text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={function(e) { e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t mb-6" style={{ borderColor: '#2A3550' }} />

        {/* Bottom row: copyright + legal link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: '#64748B' }}>
            {'© ' + year + ' Syndicade. All rights reserved.'}
          </p>
          <button
            onClick={function() { navigate('/legal'); }}
            className="text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            style={{ color: '#64748B' }}
            onMouseEnter={function(e) { e.currentTarget.style.color = '#F5B731'; }}
            onMouseLeave={function(e) { e.currentTarget.style.color = '#64748B'; }}
          >
            Legal Information
          </button>
        </div>

      </div>
    </footer>
  );
}

export default Footer;