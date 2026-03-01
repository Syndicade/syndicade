import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  shield:  ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  doc:     ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  cookie:  ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  access:  ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  chevDown:'M19 9l-7 7-7-7',
  chevUp:  'M5 15l7-7 7 7',
  link:    'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
};

var DOCUMENTS = [
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    icon: ICONS.shield,
    iconColor: 'bg-blue-900',
    iconTextColor: 'text-blue-400',
    updated: 'March 1, 2026',
    content: [
      {
        heading: '1. Introduction',
        body: 'Syndicade ("we," "us," or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using Syndicade, you consent to the practices described in this policy.',
      },
      {
        heading: '2. Information We Collect',
        body: 'We collect information you provide directly, including your name, email address, phone number, organization memberships, and profile information. We also collect usage data automatically, such as IP addresses, browser type, pages visited, and interactions with the platform.',
      },
      {
        heading: '3. How We Use Your Information',
        body: 'We use collected information to provide and improve our services, communicate with you about events and announcements, facilitate organization management, send notifications you have opted into, and comply with legal obligations. We do not sell your personal information to third parties.',
      },
      {
        heading: '4. Information Sharing',
        body: 'We may share your information with organizations you are a member of (subject to their privacy settings), service providers who assist in platform operations, and law enforcement when required by law. Organization admins can see member information within their organizations.',
      },
      {
        heading: '5. Data Retention',
        body: 'We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at privacy@syndicade.com.',
      },
      {
        heading: '6. Your Rights',
        body: 'You have the right to access, correct, or delete your personal information. You may also opt out of non-essential communications at any time through your notification preferences in Profile Settings. To exercise these rights, contact us at privacy@syndicade.com.',
      },
      {
        heading: '7. Security',
        body: 'We implement industry-standard security measures including encryption, secure data storage, and regular security audits. However, no method of electronic transmission is 100% secure, and we cannot guarantee absolute security.',
      },
      {
        heading: '8. Children\'s Privacy',
        body: 'Syndicade is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.',
      },
      {
        heading: '9. Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page with an updated date. Continued use of Syndicade after changes constitutes acceptance of the revised policy.',
      },
      {
        heading: '10. Contact Us',
        body: 'If you have questions about this Privacy Policy, please contact us at privacy@syndicade.com.',
      },
    ],
  },
  {
    id: 'terms-of-use',
    title: 'Terms of Use',
    icon: ICONS.doc,
    iconColor: 'bg-yellow-900',
    iconTextColor: 'text-yellow-400',
    updated: 'March 1, 2026',
    content: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using Syndicade, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.',
      },
      {
        heading: '2. Use License',
        body: 'Syndicade grants you a limited, non-exclusive, non-transferable license to use the platform for personal and organizational purposes in accordance with these Terms. This license does not include the right to resell, reproduce, or commercially exploit any portion of the platform.',
      },
      {
        heading: '3. User Accounts',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these Terms.',
      },
      {
        heading: '4. User Content',
        body: 'You retain ownership of content you submit to Syndicade. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute that content within the platform. You are responsible for ensuring your content does not violate any laws or third-party rights.',
      },
      {
        heading: '5. Prohibited Activities',
        body: 'You may not use Syndicade to harass, threaten, or harm others; distribute spam or unsolicited communications; upload malicious code or interfere with platform operations; impersonate any person or organization; collect user information without consent; or violate any applicable laws.',
      },
      {
        heading: '6. Organization Administrators',
        body: 'Organization administrators are responsible for managing their organization\'s content, members, and settings in compliance with these Terms. Administrators must not abuse their access or use the platform to discriminate against members based on protected characteristics.',
      },
      {
        heading: '7. Disclaimer of Warranties',
        body: 'Syndicade is provided "as is" without any warranties, express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or other harmful components. Use of the platform is at your own risk.',
      },
      {
        heading: '8. Limitation of Liability',
        body: 'To the fullest extent permitted by law, Syndicade shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, even if we have been advised of the possibility of such damages.',
      },
      {
        heading: '9. Termination',
        body: 'We may terminate or suspend your access to Syndicade at any time, with or without cause, with or without notice. Upon termination, your right to use the platform ceases immediately.',
      },
      {
        heading: '10. Governing Law',
        body: 'These Terms shall be governed by the laws of the United States. Any disputes arising from these Terms or your use of Syndicade shall be resolved through binding arbitration in accordance with applicable law.',
      },
      {
        heading: '11. Changes to Terms',
        body: 'We reserve the right to modify these Terms at any time. We will provide notice of significant changes. Your continued use of Syndicade after changes take effect constitutes your acceptance of the revised Terms.',
      },
      {
        heading: '12. Contact',
        body: 'For questions about these Terms, contact us at legal@syndicade.com.',
      },
    ],
  },
  {
    id: 'cookie-policy',
    title: 'Cookie Policy',
    icon: ICONS.cookie,
    iconColor: 'bg-orange-900',
    iconTextColor: 'text-orange-400',
    updated: 'March 1, 2026',
    content: [
      {
        heading: '1. What Are Cookies',
        body: 'Cookies are small text files placed on your device when you visit a website. They help the site remember information about your visit, making your experience more convenient and the site more useful.',
      },
      {
        heading: '2. Cookies We Use',
        body: 'We use essential cookies required for the platform to function (such as authentication tokens and session management), preference cookies to remember your settings, and analytics cookies to understand how users interact with our platform. We do not use advertising or tracking cookies.',
      },
      {
        heading: '3. Essential Cookies',
        body: 'These cookies are strictly necessary for Syndicade to work. They include session identifiers that keep you logged in, security tokens that protect against CSRF attacks, and preference cookies that remember your theme and language settings. These cannot be disabled.',
      },
      {
        heading: '4. Analytics Cookies',
        body: 'We use anonymized analytics to understand platform usage patterns and improve our service. This data does not identify individual users and is not shared with third parties for advertising purposes.',
      },
      {
        heading: '5. Managing Cookies',
        body: 'Most web browsers allow you to control cookies through browser settings. Disabling certain cookies may affect the functionality of Syndicade. Essential cookies cannot be disabled as they are required for the platform to operate.',
      },
      {
        heading: '6. Updates',
        body: 'We may update this Cookie Policy as our use of cookies changes. We will notify users of significant changes. Continued use of Syndicade after changes constitutes acceptance of the updated policy.',
      },
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility Statement',
    icon: ICONS.access,
    iconColor: 'bg-green-900',
    iconTextColor: 'text-green-400',
    updated: 'March 1, 2026',
    content: [
      {
        heading: 'Our Commitment',
        body: 'Syndicade is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards to our platform.',
      },
      {
        heading: 'Standards',
        body: 'We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. Our platform is designed and built with accessibility in mind, including support for keyboard navigation, screen readers, and sufficient color contrast.',
      },
      {
        heading: 'Features',
        body: 'Syndicade includes the following accessibility features: full keyboard navigation support, ARIA labels on interactive elements, sufficient color contrast ratios, focus indicators on all interactive elements, alternative text for images, and semantic HTML structure.',
      },
      {
        heading: 'Known Limitations',
        body: 'While we strive for full accessibility, some user-uploaded content (such as images and documents) may not meet accessibility standards. We encourage organization administrators to ensure their uploaded content is accessible.',
      },
      {
        heading: 'Feedback & Contact',
        body: 'We welcome feedback on the accessibility of Syndicade. If you experience any barriers or have suggestions for improvement, please contact us at accessibility@syndicade.com. We aim to respond to accessibility feedback within 2 business days.',
      },
      {
        heading: 'Ongoing Effort',
        body: 'Accessibility is an ongoing effort. We regularly review our platform, conduct user testing, and update our implementation to address accessibility issues as they are identified.',
      },
    ],
  },
];

function DocSection({ doc, isOpen, onToggle }) {
  return (
    <div
      className="border rounded-xl overflow-hidden transition-all"
      style={{ borderColor: '#2A3550', backgroundColor: '#1A2035' }}
    >
      {/* Header button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-expanded={isOpen}
        aria-controls={'doc-' + doc.id}
        id={'btn-' + doc.id}
      >
        <div className="flex items-center gap-4">
          <div className={'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ' + doc.iconColor}>
            <Icon path={doc.icon} className={'h-5 w-5 ' + doc.iconTextColor} />
          </div>
          <div>
            <p className="font-bold text-white text-base">{doc.title}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{'Last updated: ' + doc.updated}</p>
          </div>
        </div>
        <Icon
          path={isOpen ? ICONS.chevUp : ICONS.chevDown}
          className={'h-5 w-5 flex-shrink-0 transition-transform ' + (isOpen ? 'text-blue-400' : 'text-gray-500')}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div
          id={'doc-' + doc.id}
          role="region"
          aria-labelledby={'btn-' + doc.id}
          className="px-6 pb-8 space-y-6 border-t"
          style={{ borderColor: '#2A3550' }}
        >
          <div className="pt-6 space-y-5">
            {doc.content.map(function(section, i) {
              return (
                <div key={i}>
                  <h3 className="text-sm font-bold text-white mb-1.5">{section.heading}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{section.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LegalCenter() {
  var location = useLocation();
  var navigate = useNavigate();
  var [openId, setOpenId] = useState(null);

  // Auto-open if a hash is in the URL e.g. /legal#privacy-policy
  useEffect(function() {
    if (location.hash) {
      var id = location.hash.replace('#', '');
      var found = DOCUMENTS.find(function(d) { return d.id === id; });
      if (found) setOpenId(id);
    }
  }, [location.hash]);

  function toggleDoc(id) {
    setOpenId(function(prev) { return prev === id ? null : id; });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0E1523' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Page header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731', letterSpacing: '4px' }}>
            Legal Information
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Legal Center</h1>
          <p className="text-base" style={{ color: '#94A3B8' }}>
            Access our legal documents, policies, and terms of service. Click any document to expand it.
          </p>
        </div>

        {/* Document list */}
        <div className="space-y-3" role="list" aria-label="Legal documents">
          {DOCUMENTS.map(function(doc) {
            return (
              <div key={doc.id} role="listitem">
                <DocSection
                  doc={doc}
                  isOpen={openId === doc.id}
                  onToggle={function() { toggleDoc(doc.id); }}
                />
              </div>
            );
          })}
        </div>

        {/* Contact block */}
        <div
          className="mt-12 rounded-xl p-6 text-center border"
          style={{ backgroundColor: '#1A2035', borderColor: '#2A3550' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#F5B731', letterSpacing: '4px' }}>Questions?</p>
          <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
            If you have questions about any of our legal documents, please reach out.
          </p>
          <a
            href="mailto:legal@syndicade.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            style={{ '--tw-ring-offset-color': '#1A2035' }}
          >
            <Icon path={ICONS.link} className="h-4 w-4" />
            legal@syndicade.com
          </a>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <button
            onClick={function() { navigate(-1); }}
            className="text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
            onMouseLeave={function(e) { e.currentTarget.style.color = '#64748B'; }}
          >
            Go back
          </button>
        </div>

      </div>
    </div>
  );
}

export default LegalCenter;