import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';

import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import WelcomePage from './pages/WelcomePage';
import UnifiedDashboard from './pages/UnifiedDashboard';
import Login from './pages/Login';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import EventCalendar from './pages/EventCalendar';
import AnnouncementFeed from './pages/AnnouncementFeed';
import OrganizationList from './pages/OrganizationList';
import OrganizationDashboard from './pages/OrganizationDashboard';
import EventDiscovery from './pages/EventDiscovery';
import DocumentLibrary from './pages/DocumentLibrary';
import MemberDirectory from './pages/MemberDirectory';
import CheckInPage from './pages/CheckInPage';
import GuestCheckInPage from './pages/GuestCheckInPage';
import PollsList from './pages/PollsList';
import SurveysList from './pages/SurveysList';
import SignupFormsList from './pages/SignupFormsList';
import PublicOrganizationPage from './pages/PublicOrganizationPage';
import OrgPageEditor from './pages/OrgPageEditor';
import AccountSettings from './pages/AccountSettings';
import SchedulingPolls from './pages/SchedulingPolls';
import GroupsList from './pages/GroupsList';
import GroupDetail from './pages/GroupDetail';
import Signup from './pages/Signup';
import OnboardingPage from './pages/OnboardingPage';


function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"
            role="status"
            aria-label="Loading application"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-gray-600 text-lg">Loading Syndicade...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { duration: 4000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Router>
        <div className="min-h-screen bg-gray-50">
  {session &&
    !window.location.pathname.startsWith('/org/') &&
    !window.location.pathname.startsWith('/home') &&
    window.location.pathname !== '/about' &&
    window.location.pathname !== '/onboarding' &&
    window.location.pathname !== '/welcome' &&
    <Header />}
            <Routes>

            <Route path="/" element={session ? <UnifiedDashboard /> : <LandingPage />} />
            <Route path="/dashboard" element={session ? <UnifiedDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <Signup />} />
            <Route path="/onboarding" element={session ? <OnboardingPage /> : <Navigate to="/login" replace />} />
            <Route path="/welcome" element={session ? <WelcomePage /> : <Navigate to="/login" replace />} />

            <Route path="/events" element={session ? <EventList /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/events" element={session ? <EventList /> : <Navigate to="/login" replace />} />
            <Route path="/events/:eventId" element={session ? <EventDetails /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/events/:eventId" element={session ? <EventDetails /> : <Navigate to="/login" replace />} />

            <Route path="/discover" element={<EventDiscovery />} />
            <Route path="/calendar" element={session ? <EventCalendar /> : <Navigate to="/login" replace />} />

            <Route path="/organizations" element={session ? <OrganizationList /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId" element={session ? <OrganizationDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/announcements" element={session ? <AnnouncementFeed /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/members" element={session ? <MemberDirectory /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/documents" element={session ? <DocumentLibrary /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/polls" element={session ? <PollsList /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/signup-forms" element={session ? <SignupFormsList /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/surveys" element={session ? <SurveysList /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/scheduling" element={session ? <SchedulingPolls /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/groups" element={session ? <GroupsList /> : <Navigate to="/login" replace />} />
            <Route path="/organizations/:organizationId/groups/:groupId" element={session ? <GroupDetail /> : <Navigate to="/login" replace />} />

            <Route path="/check-in/:eventId" element={<CheckInPage />} />
            <Route path="/guest-check-in/:eventId" element={<GuestCheckInPage />} />

            <Route path="/org/:slug" element={<PublicOrganizationPage />} />
            <Route path="/organizations/:organizationId/page-editor" element={session ? <OrgPageEditor /> : <Navigate to="/login" replace />} />
            <Route path="/account-settings" element={session ? <AccountSettings /> : <Navigate to="/login" replace />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-6">Page not found</p>
                    <a href="/" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-block">
                      Go Home
                    </a>
                  </div>
                </div>
              }
            />

          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;