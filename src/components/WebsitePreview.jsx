/**
 * WebsitePreview Component
 * Shows a live preview of the organization's website
 * Updates in real-time as the form is filled out
 */

// Modern Template - defined OUTSIDE the component
const ModernTemplate = ({ orgName, mission, contactEmail, logoUrl }) => (
  <div className="h-full bg-gradient-to-br from-primary-50 to-white">
    {/* Header */}
    <header 
      className="bg-primary-600 text-white py-8 px-6"
      role="banner"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt={`${orgName} logo`} 
            className="h-16 w-16 object-contain bg-white rounded-lg p-2"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <h1 className="text-3xl font-bold">{orgName}</h1>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-4xl mx-auto py-12 px-6" role="main">
      <section aria-labelledby="mission-heading">
        <h2 
          id="mission-heading" 
          className="text-2xl font-semibold mb-4 text-gray-900"
        >
          Our Mission
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          {mission}
        </p>
      </section>

      <section className="mt-12" aria-labelledby="contact-heading">
        <h2 
          id="contact-heading" 
          className="text-2xl font-semibold mb-4 text-gray-900"
        >
          Get in Touch
        </h2>
        <p className="text-lg text-gray-700">
          Email us at:{' '}
          <a 
            href={`mailto:${contactEmail}`}
            className="text-primary-600 hover:text-primary-700 underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          >
            {contactEmail}
          </a>
        </p>
      </section>
    </main>

    {/* Footer */}
    <footer 
      className="bg-gray-100 py-6 px-6 mt-16"
      role="contentinfo"
    >
      <div className="max-w-4xl mx-auto text-center text-gray-600">
        <p>© 2025 {orgName}. All rights reserved.</p>
        <p className="text-sm mt-2">
          Powered by <span className="text-primary-600 font-semibold">Syndicade</span>
        </p>
      </div>
    </footer>
  </div>
);

// Classic Template - defined OUTSIDE the component
const ClassicTemplate = ({ orgName, mission, contactEmail, logoUrl }) => (
  <div className="h-full bg-white">
    {/* Header */}
    <header 
      className="border-b-4 border-gray-800 py-6 px-6"
      role="banner"
    >
      <div className="max-w-4xl mx-auto text-center">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt={`${orgName} logo`} 
            className="h-20 w-20 object-contain mx-auto mb-4"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <h1 className="text-4xl font-serif font-bold text-gray-900">{orgName}</h1>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-4xl mx-auto py-12 px-6" role="main">
      <section 
        className="border-l-4 border-gray-800 pl-6"
        aria-labelledby="mission-heading-classic"
      >
        <h2 
          id="mission-heading-classic" 
          className="text-2xl font-serif font-semibold mb-4 text-gray-900"
        >
          Mission Statement
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed font-serif">
          {mission}
        </p>
      </section>

      <section className="mt-12" aria-labelledby="contact-heading-classic">
        <h2 
          id="contact-heading-classic" 
          className="text-2xl font-serif font-semibold mb-4 text-gray-900"
        >
          Contact Information
        </h2>
        <p className="text-lg text-gray-700 font-serif">
          <a 
            href={`mailto:${contactEmail}`}
            className="text-gray-900 hover:text-gray-600 underline focus:outline-none focus:ring-2 focus:ring-gray-800 rounded"
          >
            {contactEmail}
          </a>
        </p>
      </section>
    </main>

    {/* Footer */}
    <footer 
      className="border-t-4 border-gray-800 py-6 px-6 mt-16"
      role="contentinfo"
    >
      <div className="max-w-4xl mx-auto text-center text-gray-600 font-serif">
        <p>© 2025 {orgName}</p>
        <p className="text-sm mt-2">Built with Syndicade</p>
      </div>
    </footer>
  </div>
);

// Main component
function WebsitePreview({ orgData, template = 'modern' }) {
  // Default values if data is empty
  const {
    orgName = 'Your Organization Name',
    mission = 'Your mission statement will appear here...',
    contactEmail = 'contact@email.com',
    logoUrl = ''
  } = orgData;

  // Return the selected template
  return (
    <section 
      className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] overflow-y-auto"
      aria-labelledby="preview-heading"
    >
      <div className="sticky top-0 bg-gray-800 text-white py-2 px-4 z-10">
        <h2 id="preview-heading" className="text-sm font-semibold">
          Live Preview
        </h2>
      </div>
      {template === 'modern' ? (
        <ModernTemplate 
          orgName={orgName}
          mission={mission}
          contactEmail={contactEmail}
          logoUrl={logoUrl}
        />
      ) : (
        <ClassicTemplate 
          orgName={orgName}
          mission={mission}
          contactEmail={contactEmail}
          logoUrl={logoUrl}
        />
      )}
    </section>
  );
}

export default WebsitePreview;