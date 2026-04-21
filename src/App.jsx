import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Header from './components/Header';
import Footer from './components/Footer';
import LegalCenter from './pages/LegalCenter';
import { Toaster } from 'react-hot-toast';
import StaffDashboard from './pages/StaffDashboard';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import WelcomePage from './pages/WelcomePage';
import UnifiedDashboard from './pages/UnifiedDashboard';
import VerifyEmailPage from './pages/VerifyEmailPage';
import MemberProfileSettings from './components/MemberProfileSettings';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import EventCalendar from './pages/EventCalendar';
import AnnouncementFeed from './pages/AnnouncementFeed';
import EmailBlasts from './pages/EmailBlasts';
import OrganizationList from './pages/OrganizationList';
import OrganizationDashboard from './pages/OrganizationDashboard';
import OrgLayout from './pages/OrgLayout';
import AdminInbox from './pages/AdminInbox';
import EventDiscovery from './pages/EventDiscovery';
import DocumentLibrary from './pages/DocumentLibrary';
import MemberDirectory from './pages/MemberDirectory';
import CheckInPage from './pages/CheckInPage';
import GuestCheckInPage from './pages/GuestCheckInPage';
import PollsList from './pages/PollsList';
import OrgChat from './pages/OrgChat';
import SurveysList from './pages/SurveysList';
import SignupFormsList from './pages/SignupFormsList';
import OrgPrograms from './pages/OrgPrograms';
import PublicOrganizationPage from './pages/PublicOrganizationPage';
import OrgPageEditor from './pages/OrgPageEditor';
import AccountSettings from './pages/AccountSettings';
import SchedulingPolls from './pages/SchedulingPolls';
import GroupsList from './pages/GroupsList';
import GroupDetail from './pages/GroupDetail';
import OnboardingPage from './pages/OnboardingPage';
import WishlistPage from './pages/WishlistPage';
import OrganizationDiscovery from './pages/OrganizationDiscovery';
import { ThemeProvider } from './context/ThemeContext';
import CommunityBoard from './pages/CommunityBoard';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';
import BillingPage from './pages/BillingPage';
import NotFound from './pages/NotFound';
import ActivateProTrial from './pages/ActivateProTrial';
import AcceptInvite from './pages/AcceptInvite';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#0E1523' }} role="status" aria-label="Loading Syndicade">
        <div className="text-center">
          <img src="/mascot-loading.png" alt="" aria-hidden="true"
            style={{ width: '180px', display: 'block', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>
            Loading Syndicade...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
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
        <AppShell session={session} />
      </Router>
    </ThemeProvider>
  );
}

// AppShell lives inside Router so useLocation updates reactively on every navigation
function AppShell({ session }) {
  var location = useLocation();
  var path = location.pathname;

  // Pages that manage their own Header/Footer — suppress global chrome
  // /welcome is NOT here — WelcomePage renders its own Header + Footer
var hideChrome = (
  path === '/' ||
  path === '/home' ||
  path === '/about' ||
  path === '/login' ||
  path === '/signup' ||
  path === '/pricing' ||
  path === '/features' ||
  path === '/onboarding' ||
  path === '/discover' ||
  path === '/explore' ||
  path.startsWith('/org/')
);
  return (
    <div className="min-h-screen bg-gray-50" style={{ display: 'flex', flexDirection: 'column' }}>
      {!hideChrome && <Header />}

      <div style={{ flex: 1 }}>
        <Routes>
            {/* ── Public / auth ──────────────────────────────────── */}
            <Route path="/" element={session ? <UnifiedDashboard /> : <LandingPage />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/dashboard" element={session ? <UnifiedDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/login"  element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
            <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/welcome" element={session ? <WelcomePage /> : <Navigate to="/login" replace />} />
            <Route path="/onboarding" element={session ? <OnboardingPage /> : <Navigate to="/login" replace />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/legal" element={<LegalCenter />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/activate-pro" element={<ActivateProTrial />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* ── Discovery ──────────────────────────────────────── */}
            <Route path="/discover" element={<EventDiscovery />} />
            <Route path="/explore" element={<OrganizationDiscovery />} />
            <Route path="/calendar" element={session ? <EventCalendar /> : <Navigate to="/login" replace />} />
            <Route path="/events" element={session ? <EventList /> : <Navigate to="/login" replace />} />
            <Route path="/events/:eventId" element={<EventDetails />} />

            {/* ── Check-in ───────────────────────────────────────── */}
            <Route path="/check-in/:eventId" element={<CheckInPage />} />
            <Route path="/guest-check-in/:eventId" element={<GuestCheckInPage />} />

            {/* ── Public org pages ───────────────────────────────── */}
            <Route path="/org/:slug" element={<PublicOrganizationPage />} />
            <Route path="/org/:slug/:pageSlug" element={<PublicOrganizationPage />} />

            {/* ── Account / profile ──────────────────────────────── */}
            <Route path="/account-settings" element={session ? <AccountSettings /> : <Navigate to="/login" replace />} />
            <Route path="/profile/settings" element={<MemberProfileSettings />} />
            <Route path="/community-board" element={session ? <CommunityBoard /> : <Navigate to="/login" replace />} />

            {/* ── Organization list ──────────────────────────────── */}
            <Route path="/organizations" element={session ? <OrganizationList /> : <Navigate to="/login" replace />} />

            {/* ── Organization pages ─────────────────────────────── */}
            <Route path="/organizations/:organizationId"
              element={session ? <OrgLayout /> : <Navigate to="/login" replace />}>
              <Route index element={<OrganizationDashboard />} />
              <Route path="photos"    element={<OrganizationDashboard />} />
              <Route path="approvals" element={<OrganizationDashboard />} />
              <Route path="analytics" element={<OrganizationDashboard />} />
              <Route path="settings"  element={<OrganizationDashboard />} />
              <Route path="invite"    element={<OrganizationDashboard />} />
              <Route path="events" element={<EventList />} />
              <Route path="events/:eventId" element={<EventDetails />} />
              <Route path="calendar" element={<EventCalendar />} />
              <Route path="announcements" element={<AnnouncementFeed />} />
              <Route path="email-blasts" element={<EmailBlasts />} />
              <Route path="members" element={<MemberDirectory />} />
              <Route path="chat" element={<OrgChat />} />
              <Route path="documents" element={<DocumentLibrary />} />
              <Route path="polls" element={<PollsList />} />
              <Route path="signup-forms" element={<SignupFormsList />} />
              <Route path="surveys" element={<SurveysList />} />
              <Route path="programs" element={<OrgPrograms />} />
              <Route path="scheduling" element={<SchedulingPolls />} />
              <Route path="groups" element={<GroupsList />} />
              <Route path="groups/:groupId" element={<GroupDetail />} />
              <Route path="inbox" element={<AdminInbox />} />
              <Route path="page-editor" element={<OrgPageEditor />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="community-board" element={<CommunityBoard />} />
            </Route>

            {/* ── 404 ────────────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </div>

      {!hideChrome && <Footer />}
    </div>
  );
}

export default App;