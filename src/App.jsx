import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Builder from "./pages/Builder";
import MemberProfile from "./components/MemberProfile";
import MemberDirectory from "./pages/MemberDirectory";
import OrganizationList from "./pages/OrganizationList";
import OrganizationDashboard from "./pages/OrganizationDashboard";

function ProtectedRoute({ children }) {
  // Your protected route logic here
  return children;
}

function PublicRoute({ children }) {
  // Your public route logic here
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/builder" 
            element={
              <ProtectedRoute>
                <Builder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/builder/:id" 
            element={
              <ProtectedRoute>
                <Builder />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/members/:userId" 
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizations/:organizationId/members" 
            element={
              <ProtectedRoute>
                <MemberDirectory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizations" 
            element={
              <ProtectedRoute>
                <OrganizationList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizations/:organizationId" 
            element={
              <ProtectedRoute>
                <OrganizationDashboard />
              </ProtectedRoute>
            } 
          />
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* 404 Not Found */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600">Page not found</p>
                </div>
              </div>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;