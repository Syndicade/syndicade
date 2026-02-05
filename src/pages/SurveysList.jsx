import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CreateSurvey from '../components/CreateSurvey';
import SurveyCard from '../components/SurveyCard';
import PageHeader from '../components/PageHeader';


function SurveysList() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrganizationAndSurveys();
  }, [organizationId]);

  useEffect(() => {
    applyFilters();
  }, [surveys, searchTerm, statusFilter]);

  const loadOrganizationAndSurveys = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Check membership and role
      const { data: membership, error: memberError } = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) throw memberError;

      if (!membership) {
        alert('You are not a member of this organization');
        navigate('/organizations');
        return;
      }

      setIsAdmin(['admin', 'owner'].includes(membership.role));

      // Load surveys
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (surveysError) throw surveysError;
      setSurveys(surveysData || []);

    } catch (err) {
      console.error('Error loading surveys:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...surveys];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(search) ||
        (survey.description && survey.description.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(survey => {
        const isExpired = survey.closing_date && new Date(survey.closing_date) < new Date();
        const isClosed = survey.status === 'closed' || isExpired;
        
        if (statusFilter === 'active') return !isClosed;
        if (statusFilter === 'closed') return isClosed;
        return true;
      });
    }

    setFilteredSurveys(filtered);
  };

  const handleSurveyCreated = () => {
    loadOrganizationAndSurveys();
  };

  const handleSurveyDeleted = () => {
    loadOrganizationAndSurveys();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading surveys...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Organization not found</div>
      </div>
    );
  }

  const activeSurveys = surveys.filter(s => {
    const isExpired = s.closing_date && new Date(s.closing_date) < new Date();
    return s.status === 'active' && !isExpired;
  });

  const closedSurveys = surveys.filter(s => {
    const isExpired = s.closing_date && new Date(s.closing_date) < new Date();
    return s.status === 'closed' || isExpired;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="Surveys"
          subtitle="Create surveys and collect member feedback"
          icon="📋"
          organizationName={organization?.name}
          organizationId={organizationId}
          backTo={`/organizations/${organizationId}`}
          backLabel="Back to Dashboard"
          actions={
            isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                Create Survey
              </button>
            )
          }
        />

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{surveys.length}</div>
            <div className="text-sm text-gray-600">Total Surveys</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">{activeSurveys.length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{closedSurveys.length}</div>
            <div className="text-sm text-gray-600">Closed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Search surveys"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter by status"
              >
                <option value="all">All Surveys</option>
                <option value="active">Active Only</option>
                <option value="closed">Closed Only</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredSurveys.length} of {surveys.length} surveys
          </div>
        </div>

        {/* Surveys List */}
        {filteredSurveys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No surveys found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No surveys yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {isAdmin 
                    ? "Create your first survey to gather feedback from members"
                    : "Check back later for surveys from your organization"
                  }
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Your First Survey
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onDelete={handleSurveyDeleted}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        {/* Create Survey Modal */}
        {showCreateModal && (
          <CreateSurvey
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleSurveyCreated}
            organizationId={organizationId}
            organizationName={organization.name}
          />
        )}
      </div>
    </div>
  );
}

export default SurveysList;