import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            AI Website Builder
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              {user?.email}
            </p>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
              aria-label="Sign out of your account"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            You're successfully logged in! In the next steps, we'll add the website builder here.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              What's Next?
            </h3>
            <ul className="list-disc list-inside text-blue-800 space-y-2">
              <li>We'll integrate your Phase 2 website builder</li>
              <li>Add database functionality to save projects</li>
              <li>Create a projects list view</li>
              <li>Add edit and delete capabilities</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard