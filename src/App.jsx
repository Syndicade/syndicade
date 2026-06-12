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
import ValuePropositionPage from './pages/ValuePropositionPage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import WelcomePage from './pages/WelcomePage';
import UnifiedDashboard from './pages/UnifiedDashboard';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import EventCalendar from './pages/EventCalendar';
import AnnouncementFeed from './pages/AnnouncementFeed';
import EmailBlasts from './pages/EmailBlasts';
import ListedOrgDashboard from './pages/ListedOrgDashboard';
import OrganizationDashboard from './pages/OrganizationDashboard';
import OrgLayout from './pages/OrgLayout';
import AdminInbox from './pages/AdminInbox';
import AdminContacts from './pages/AdminContacts';
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
import ProgramDetail from './pages/ProgramDetail';
import OrgOpportunities from './pages/OrgOpportunities';
import OrgFunding from './pages/OrgFunding';
import FundingDiscovery from './pages/FundingDiscovery';
import PublicOrganizationPage from './pages/PublicOrganizationPage';
import OrgPageEditor from './pages/OrgPageEditor';
import AccountSettings from './pages/AccountSettings';
import AdminTasks from './pages/AdminTasks';
import NotificationsPage from './pages/NotificationsPage';
import SchedulingPolls from './pages/SchedulingPolls';
import GroupsList from './pages/GroupsList';
import GroupDetail from './pages/GroupDetail';
import OnboardingPage from './pages/OnboardingPage';
import WishlistPage from './pages/WishlistPage';
import OrganizationDiscovery from './pages/OrganizationDiscovery';
import OpportunityDiscovery from './pages/OpportunityDiscovery';
import CommunityBoardHub from './pages/CommunityBoardHub';
import CommunityBoard from './pages/CommunityBoard';
import CommunityBoardJoin from './pages/CommunityBoardJoin';
import PricingPage from './pages/PricingPage';
import FeaturesPage from './pages/FeaturesPage';
import BillingPage from './pages/BillingPage';
import NotFound from './pages/NotFound';
import ActivateProTrial from './pages/ActivateProTrial';
import AcceptInvite from './pages/AcceptInvite';
import BugReportPage from './pages/BugReportPage';

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
      style={{ background: '#F8FAFC' }} role="status" aria-label="Loading Syndicade">
      <div className="text-center">
        <img src="/mascot-loading.png" alt="" aria-hidden="true"
          style={{ width: '180px', display: 'block', margin: '0 auto 16px', mixBlendMode: 'multiply' }} />
        <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>
          Loading Syndicade...
        </p>
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
      <AppShell session={session} />
    </Router>
</>
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
  path.startsWith('/org/') ||
  path === '/accept-invite'
);
  return (
    <div className="min-h-screen bg-gray-50" style={{ display: 'flex', flexDirection: 'column' }}>
      {!hideChrome && <Header />}

      <div style={{ flex: 1 }}>
        <Routes>
            {/* ── Public / auth ──────────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/dashboard" element={session ? <UnifiedDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/login"  element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
            <Route path="/signup" element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/welcome" element={session ? <WelcomePage /> : <Navigate to="/login" replace />} />
            <Route path="/onboarding" element={session ? <OnboardingPage /> : <Navigate to="/login" replace />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/report-a-bug" element={<BugReportPage />} />
            <Route path="/legal" element={<LegalCenter />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/compare" element={<ValuePropositionPage />} />
            <Route path="/activate-pro" element={<ActivateProTrial />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* ── Discovery ──────────────────────────────────────── */}
            <Route path="/discover" element={<EventDiscovery />} />
            <Route path="/explore" element={<OrganizationDiscovery />} />
            <Route path="/calendar" element={session ? <EventCalendar /> : <Navigate to="/login" replace />} />
            <Route path="/events" element={session ? <EventList /> : <Navigate to="/login" replace />} />
            <Route path="/events/:eventId" element={<EventDetails />} />
            <Route path="/organizations/:organizationId/programs/:programId" element={<ProgramDetail />} />
            <Route path="/opportunities" element={<OpportunityDiscovery />} />
            <Route path="/funding" element={<FundingDiscovery />} />

            {/* ── Check-in ───────────────────────────────────────── */}
            <Route path="/check-in/:eventId" element={<CheckInPage />} />
            <Route path="/guest-check-in/:eventId" element={<GuestCheckInPage />} />

            {/* ── Public org pages ───────────────────────────────── */}
            <Route path="/org/:slug" element={<PublicOrganizationPage />} />
            <Route path="/org/:slug/:pageSlug" element={<PublicOrganizationPage />} />

            {/* ── Account / profile ──────────────────────────────── */}
            <Route path="/account-settings" element={session ? <AccountSettings /> : <Navigate to="/login" replace />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/community-board/hub" element={session ? <CommunityBoardHub /> : <Navigate to="/login" replace />} />
            <Route path="/community-board/:boardId" element={session ? <CommunityBoard /> : <Navigate to="/login" replace />} />
            <Route path="/community-board/join" element={<CommunityBoardJoin />} />

            {/* ── Organization list ──────────────────────────────── */}
            <Route path="/organizations/:organizationId/listing" element={session ? <ListedOrgDashboard /> : <Navigate to="/login" replace />} />

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
              <Route path="opportunities" element={<OrgOpportunities />} />
              <Route path="funding" element={<OrgFunding />} />
              <Route path="scheduling" element={<SchedulingPolls />} />
              <Route path="groups" element={<GroupsList />} />
              <Route path="groups/:groupId" element={<GroupDetail />} />
              <Route path="inbox" element={<AdminInbox />} />
              <Route path="tasks" element={<AdminTasks />} />
              <Route path="contacts" element={<AdminContacts />} />
              <Route path="page-editor" element={<OrgPageEditor />} />
              <Route path="billing" element={<BillingPage />} />
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