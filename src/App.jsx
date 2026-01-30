import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Import your pages
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

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session ? 'logged in' : 'logged out');
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
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Home Route */}
          <Route 
            path="/" 
            element={
              session ? (
                <UnifiedDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              session ? (
                <UnifiedDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              session ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            } 
          />

          {/* Event Routes - PROTECTED */}
          <Route 
            path="/events" 
            element={
              session ? (
                <EventList />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route 
            path="/events/:eventId" 
            element={
              session ? (
                <EventDetails />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
<Route path="/discover" element={<EventDiscovery />} />

          {/* Calendar Route - PROTECTED */}
          <Route 
            path="/calendar" 
            element={
              session ? (
                <EventCalendar />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
{/* Organization Routes - PROTECTED */}
<Route 
  path="/organizations" 
  element={
    session ? (
      <OrganizationList />
    ) : (
      <Navigate to="/login" replace />
    )
  } 
/>

<Route 
  path="/organizations/:organizationId" 
  element={
    session ? (
      <OrganizationDashboard />
    ) : (
      <Navigate to="/login" replace />
    )
  } 
/>

<Route 
  path="/organizations/:organizationId/announcements" 
  element={
    session ? (
      <AnnouncementFeed />
    ) : (
      <Navigate to="/login" replace />
    )
  } 
/>
<Route 
          path="/organizations/:organizationId/documents" 
          element={session ? <DocumentLibrary /> : <Navigate to="/login" replace />} 
        />
          {/* 404 - Catch All Route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-6">Page not found</p>
                  <a 
                    href="/"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-block"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;