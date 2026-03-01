import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CreateSurvey from '../components/CreateSurvey';
import SurveyCard from '../components/SurveyCard';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

var ICONS = {
  clipboard: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  plus:      'M12 4v16m8-8H4',
  search:    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  check:     'M5 13l4 4L19 7',
  lock:      'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  list:      'M4 6h16M4 10h16M4 14h16M4 18h16',
  x:         'M6 18L18 6M6 6l12 12',
  alert:     ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-gray-100 border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="h-7 w-10 bg-gray-300 rounded mb-2" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
    </div>
  );
}

function SurveyCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-1/2 bg-gray-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full flex-shrink-0" />
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
        <div className="h-9 w-20 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function SurveysList() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();

  var [organization, setOrganization] = useState(null);
  var [surveys, setSurveys] = useState([]);
  var [filteredSurveys, setFilteredSurveys] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [isAdmin, setIsAdmin] = useState(false);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [searchTerm, setSearchTerm] = useState('');
  var [statusFilter, setStatusFilter] = useState('all');

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  useEffect(function() {
    applyFilters();
  }, [surveys, searchTerm, statusFilter]);

  function isSurveyClosed(s) {
    var expired = s.closing_date && new Date(s.closing_date) < new Date();
    return s.status === 'closed' || expired;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { navigate('/login'); return; }
      var user = authResult.data.user;

      var orgResult = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memberResult = await supabase
        .from('memberships').select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (memberResult.error) throw memberResult.error;

      if (!memberResult.data) {
        toast.error('You are not a member of this organization.');
        navigate('/organizations');
        return;
      }

      setIsAdmin(['admin', 'owner'].includes(memberResult.data.role));

      var surveysResult = await supabase
        .from('surveys').select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (surveysResult.error) throw surveysResult.error;
      setSurveys(surveysResult.data || []);

    } catch (err) {
      console.error('Error loading surveys:', err);
      setError(err.message);
      toast.error('Failed to load surveys.');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    var filtered = surveys.slice();
    if (searchTerm.trim()) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function(s) {
        return s.title.toLowerCase().includes(term) ||
          (s.description && s.description.toLowerCase().includes(term));
      });
    }
    if (statusFilter === 'active') filtered = filtered.filter(function(s) { return !isSurveyClosed(s); });
    if (statusFilter === 'closed') filtered = filtered.filter(function(s) { return isSurveyClosed(s); });
    setFilteredSurveys(filtered);
  }

  function handleSurveyCreated() { loadData(); }
  function handleSurveyDeleted() {
    loadData();
    toast.success('Survey deleted.');
  }

  var activeSurveys = surveys.filter(function(s) { return !isSurveyClosed(s); });
  var closedSurveys = surveys.filter(function(s) { return isSurveyClosed(s); });
  var hasFilters = searchTerm || statusFilter !== 'all';

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-7 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-56 bg-gray-100 rounded" />
              </div>
              <div className="h-11 w-36 bg-gray-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatSkeleton /><StatSkeleton /><StatSkeleton />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
          <div className="space-y-4">
            <SurveyCardSkeleton /><SurveyCardSkeleton /><SurveyCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-3">
            <Icon path={ICONS.alert} className="h-12 w-12 text-red-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Failed to Load Surveys</h3>
          <p className="text-gray-500 text-sm mb-6">{error || 'Organization not found.'}</p>
          <button
            onClick={function() { setError(null); setLoading(true); loadData(); }}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <PageHeader
          title="Surveys"
          subtitle="Create surveys and collect member feedback"
          icon={<Icon path={ICONS.clipboard} className="h-7 w-7 text-green-600" />}
          organizationName={organization.name}
          organizationId={organizationId}
          backTo={'/organizations/' + organizationId}
          backLabel="Back to Dashboard"
          actions={
            isAdmin && (
              <button
                onClick={function() { setShowCreateModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Create Survey
              </button>
            )
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
            <p className="text-2xl font-extrabold text-gray-700">{surveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.list} className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-500">Total Surveys</p>
            </div>
          </div>
          <div className={'rounded-xl p-5 border-2 ' + (activeSurveys.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (activeSurveys.length > 0 ? 'text-green-700' : 'text-gray-500')}>{activeSurveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.check} className={'h-4 w-4 ' + (activeSurveys.length > 0 ? 'text-green-500' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (activeSurveys.length > 0 ? 'text-green-600' : 'text-gray-500')}>Active</p>
            </div>
          </div>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
            <p className="text-2xl font-extrabold text-gray-600">{closedSurveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.lock} className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-500">Closed</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">

            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon path={ICONS.search} className="h-4 w-4 text-gray-400" />
              </div>
              <label htmlFor="search-surveys" className="sr-only">Search surveys</label>
              <input
                id="search-surveys"
                type="text"
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={function(e) { setStatusFilter(e.target.value); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                aria-label="Filter by status"
              >
                <option value="all">{'All (' + surveys.length + ')'}</option>
                <option value="active">{'Active (' + activeSurveys.length + ')'}</option>
                <option value="closed">{'Closed (' + closedSurveys.length + ')'}</option>
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={function() { setSearchTerm(''); setStatusFilter('all'); }}
                className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors whitespace-nowrap"
                aria-label="Clear all filters"
              >
                <Icon path={ICONS.x} className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {filteredSurveys.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              {'Showing ' + filteredSurveys.length + ' of ' + surveys.length + ' survey' + (surveys.length !== 1 ? 's' : '')}
            </p>
          )}
        </div>

        {/* Surveys list or empty state */}
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="flex justify-center mb-3">
              <Icon path={ICONS.clipboard} className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {hasFilters ? 'No surveys match your filters' : 'No surveys yet'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {hasFilters
                ? 'Try adjusting your search or filters.'
                : isAdmin
                ? 'Create your first survey to gather member feedback.'
                : 'Check back later for surveys from your organization.'}
            </p>
            {isAdmin && !hasFilters && (
              <button
                onClick={function() { setShowCreateModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Create Survey
              </button>
            )}
            {hasFilters && (
              <button
                onClick={function() { setSearchTerm(''); setStatusFilter('all'); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
              >
                <Icon path={ICONS.x} className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Surveys">
            {filteredSurveys.map(function(survey) {
              return (
                <div key={survey.id} role="listitem">
                  <SurveyCard
                    survey={survey}
                    onDelete={handleSurveyDeleted}
                    isAdmin={isAdmin}
                  />
                </div>
              );
            })}
          </div>
        )}

      </div>

      <CreateSurvey
        isOpen={showCreateModal}
        onClose={function() { setShowCreateModal(false); }}
        onSuccess={handleSurveyCreated}
        organizationId={organizationId}
        organizationName={organization.name}
      />
    </div>
  );
}

export default SurveysList;