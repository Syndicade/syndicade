import { useState } from 'react';
import OrganizationForm from '../components/OrganizationForm';
import WebsitePreview from '../components/WebsitePreview';

function WebsiteBuilder() {
  const [orgData, setOrgData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const handleDataChange = (newData) => {
    setOrgData(newData);
  };

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
  };

  const handlePublish = () => {
    console.log('Publishing website with data:', orgData);
    alert('Publishing feature coming in Phase 3!\n\nYour organization data:\n' + JSON.stringify(orgData, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header 
        className="bg-white shadow-sm"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Syndicade Website Builder
          </h1>
          <p className="mt-2 text-gray-600">
            Create your organization's website in minutes
          </p>
        </div>
      </header>

      <main 
        id="main-content"
        className="max-w-7xl mx-auto px-4 py-8"
        role="main"
      >
        <section 
          className="mb-8 bg-white rounded-lg shadow p-6"
          aria-labelledby="template-heading"
        >
          <h2 id="template-heading" className="text-xl font-semibold mb-4 text-gray-900">
            Choose a Template
          </h2>
          <div className="flex gap-4" role="group" aria-label="Template selection">
            <button
              onClick={() => handleTemplateChange('modern')}
              className={`px-6 py-3 rounded-lg font-semibold border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                selectedTemplate === 'modern'
                  ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
              }`}
              aria-pressed={selectedTemplate === 'modern'}
            >
              Modern
            </button>
            <button
              onClick={() => handleTemplateChange('classic')}
              className={`px-6 py-3 rounded-lg font-semibold border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                selectedTemplate === 'classic'
                  ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                  : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
              }`}
              aria-pressed={selectedTemplate === 'classic'}
            >
              Classic
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <OrganizationForm onDataChange={handleDataChange} />
            
            <div className="mt-6">
              <button
  onClick={handlePublish}
  disabled={!orgData.orgName || !orgData.mission || !orgData.contactEmail}
  className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
  aria-label="Publish your website"
>
  Publish Website
</button>
              {(!orgData.orgName || !orgData.mission || !orgData.contactEmail) && (
                <p className="mt-2 text-sm text-gray-500 text-center" role="status">
                  Please fill in all required fields to publish
                </p>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:h-fit">
            <WebsitePreview orgData={orgData} template={selectedTemplate} />
          </div>
        </div>
      </main>

      <footer 
        className="bg-white border-t border-gray-200 mt-16"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2025 Syndicade. Building stronger communities together.</p>
        </div>
      </footer>
    </div>
  );
}

export default WebsiteBuilder;