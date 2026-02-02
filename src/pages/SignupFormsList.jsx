import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Search, Filter } from 'lucide-react';
import CreateSignupForm from '../components/CreateSignupForm';
import SignupFormCard from '../components/SignupFormCard';

/**
 * SignupFormsList Page
 * Displays all sign-up forms for an organization
 * Allows admins to create new forms and members to sign up
 */
function SignupFormsList() {
  const { organizationId } = useParams();
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Fetch current user and their role
  useEffect(() => {
    fetchUserRole();
  }, [organizationId]);

  // Fetch forms when component mounts or after changes
  useEffect(() => {
    if (organizationId) {
      fetchForms();
    }
  }, [organizationId]);

  // Apply filters when forms, search, or status changes
  useEffect(() => {
    applyFilters();
  }, [forms, searchTerm, statusFilter]);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);

      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('member_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      setUserRole(membership?.role || 'member');
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('signup_forms')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setForms(data || []);
      setFilteredForms(data || []);

    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...forms];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(form =>
        form.title.toLowerCase().includes(search) ||
        (form.description && form.description.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(form => {
        const isClosed = form.status === 'closed' || 
          (form.closes_at && new Date(form.closes_at) < new Date());
        
        if (statusFilter === 'active') return !isClosed;
        if (statusFilter === 'closed') return isClosed;
        return true;
      });
    }

    setFilteredForms(filtered);
  };

  const handleFormCreated = () => {
    fetchForms();
    setShowCreateModal(false);
  };

  const handleFormDeleted = () => {
    fetchForms();
  };

  const handleFormUpdated = () => {
    fetchForms();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Sign-Up Forms</h1>
            {userRole === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Create new sign-up form"
              >
                <Plus size={20} />
                Create Form
              </button>
            )}
          </div>
          <p className="text-gray-600">
            Volunteer sign-ups, time slots, potluck items, and more
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Search forms"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                aria-label="Filter by status"
              >
                <option value="all">All Forms</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredForms.length} of {forms.length} form{forms.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
            {error}
          </div>
        )}

        {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {forms.length === 0 ? 'No Sign-Up Forms Yet' : 'No Forms Found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {forms.length === 0
                  ? 'Create your first sign-up form for volunteers, time slots, or potluck items.'
                  : 'Try adjusting your search or filters to find what you\'re looking for.'}
              </p>
              {userRole === 'admin' && forms.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  Create Your First Form
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredForms.map((form) => (
              <SignupFormCard
                key={form.id}
                form={form}
                currentUserId={currentUser?.id}
                userRole={userRole}
                onDelete={handleFormDeleted}
                onUpdate={handleFormUpdated}
              />
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateSignupForm
            organizationId={organizationId}
            onClose={() => setShowCreateModal(false)}
            onFormCreated={handleFormCreated}
          />
        )}
      </div>
    </div>
  );
}

export default SignupFormsList;