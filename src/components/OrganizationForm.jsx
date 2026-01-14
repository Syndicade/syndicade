import { useState } from 'react';

/**
 * OrganizationForm Component
 * ADA-compliant form for organizations to enter their information
 * All form fields include proper ARIA labels and semantic HTML
 */
function OrganizationForm({ onDataChange }) {
  // State to hold form data
  // This is like a container that remembers what the user typed
  const [formData, setFormData] = useState({
    orgName: '',
    mission: '',
    contactEmail: '',
    logoUrl: ''
  });

  // Handle input changes and notify parent component
  // This function runs every time the user types in any field
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = {
      ...formData,  // Keep all existing data
      [name]: value  // Update only the field that changed
    };
    setFormData(newData);
    onDataChange(newData); // Send data to parent for live preview
  };

  return (
    <section 
      className="bg-white rounded-lg shadow-lg p-6"
      aria-labelledby="form-heading"
    >
      {/* Form Title */}
      <h2 
        id="form-heading" 
        className="text-2xl font-bold mb-6 text-gray-900"
      >
        Organization Information
      </h2>

      <form className="space-y-6">
        {/* Organization Name Field */}
        <div>
          <label 
            htmlFor="orgName" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Organization Name{' '}
            <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            type="text"
            id="orgName"
            name="orgName"
            value={formData.orgName}
            onChange={handleChange}
            required
            aria-required="true"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="e.g., Toledo Alumni Association"
            aria-describedby="orgName-description"
          />
          <p className="mt-1 text-sm text-gray-500" id="orgName-description">
            The official name of your organization
          </p>
        </div>

        {/* Mission Statement Field */}
        <div>
          <label 
            htmlFor="mission" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Mission Statement{' '}
            <span className="text-red-600" aria-label="required">*</span>
          </label>
          <textarea
            id="mission"
            name="mission"
            value={formData.mission}
            onChange={handleChange}
            required
            aria-required="true"
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-vertical"
            placeholder="Describe your organization's purpose and goals..."
            aria-describedby="mission-description"
          />
          <p className="mt-1 text-sm text-gray-500" id="mission-description">
            A brief description of what your organization does (2-3 sentences)
          </p>
        </div>

        {/* Contact Email Field */}
        <div>
          <label 
            htmlFor="contactEmail" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Contact Email{' '}
            <span className="text-red-600" aria-label="required">*</span>
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            required
            aria-required="true"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="info@yourorganization.org"
            aria-describedby="email-description"
          />
          <p className="mt-1 text-sm text-gray-500" id="email-description">
            Public email address for inquiries
          </p>
        </div>

        {/* Logo URL Field (Optional) */}
        <div>
          <label 
            htmlFor="logoUrl" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Logo URL{' '}
            <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="url"
            id="logoUrl"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            placeholder="https://example.com/logo.png"
            aria-describedby="logo-description"
          />
          <p className="mt-1 text-sm text-gray-500" id="logo-description">
            Direct link to your organization's logo image
          </p>
        </div>
      </form>
    </section>
  );
}

export default OrganizationForm;