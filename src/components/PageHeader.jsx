import { useNavigate } from 'react-router-dom';

/**
 * PageHeader Component
 * 
 * Provides consistent page headers with back navigation and breadcrumbs
 * throughout the application.
 * 
 * Props:
 * - title: string (required) - Main page title
 * - subtitle: string (optional) - Subtitle/description
 * - icon: string (optional) - Emoji icon for the page
 * - backTo: string (optional) - Path to navigate back to
 * - backLabel: string (optional) - Label for back button (default: "Back")
 * - organizationName: string (optional) - Show organization context
 * - organizationId: string (optional) - Link back to org dashboard
 * - actions: ReactNode (optional) - Action buttons to display on right
 * 
 * @example
 * <PageHeader
 *   title="Announcements"
 *   subtitle="View and manage announcements"
 *   icon="📢"
 *   organizationName="SQAC"
 *   organizationId="123"
 *   backTo="/organizations/123"
 *   backLabel="Back to Dashboard"
 *   actions={<button>Create Announcement</button>}
 * />
 */
function PageHeader({
  title,
  subtitle,
  icon,
  backTo,
  backLabel = 'Back',
  organizationName,
  organizationId,
  actions
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1); // Go back one page in history
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button & Breadcrumbs */}
        {(backTo || organizationName) && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
              aria-label={backLabel}
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
              {backLabel}
            </button>

            {organizationName && (
              <>
                <span className="text-gray-400">/</span>
                {organizationId ? (
                  <button
                    onClick={() => navigate(`/organizations/${organizationId}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
                  >
                    {organizationName}
                  </button>
                ) : (
                  <span className="text-gray-600 font-medium">{organizationName}</span>
                )}
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-semibold">{title}</span>
              </>
            )}
          </div>
        )}

        {/* Title & Actions */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {icon && (
                <span className="text-4xl" role="img" aria-label={`${title} icon`}>
                  {icon}
                </span>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {actions && (
            <div className="ml-4 flex-shrink-0 flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;