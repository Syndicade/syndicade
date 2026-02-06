import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';

function Header() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Syndicade
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/organizations')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Organizations
            </button>
            <button
              onClick={() => navigate('/discover')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Discover Events
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Calendar
            </button>
          </nav>

          {/* Right Side - Notification Bell + User Menu */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;