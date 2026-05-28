import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import CreateSurvey from '../components/CreateSurvey';
import SurveyCard from '../components/SurveyCard';

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
  pin:       ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
  x:         'M6 18L18 6M6 6l12 12',
  alert:     ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

function StatSkeleton() {
  return (
    <div className="rounded-xl p-5 animate-pulse border bg-gray-100 border-gray-200">
      <div className="h-7 w-10 rounded mb-2 bg-gray-300" />
      <div className="h-4 w-20 rounded bg-gray-200" />
    </div>
  );
}

function SurveyCardSkeleton() {
  return (
    <div className="rounded-xl p-6 animate-pulse border bg-white border-slate-200">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-100" />
        </div>
        <div className="h-6 w-16 rounded-full flex-shrink-0 bg-gray-200" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-28 rounded-lg bg-gray-100" />
        <div className="h-9 w-20 rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

function SurveysList() {
  var params         = useParams();
  var organizationId = params.organizationId;
  var navigate       = useNavigate();
  var outletContext   = useOutletContext() || {};
  var isAdmin        = !!(outletContext.isAdmin);

  var [organization, setOrganization]   = useState(null);
  var [surveys, setSurveys]             = useState([]);
  var [filteredSurveys, setFilteredSurveys] = useState([]);
  var [loading, setLoading]             = useState(true);
  var [error, setError]                 = useState(null);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [editingSurvey, setEditingSurvey] = useState(null);
  var [searchTerm, setSearchTerm]       = useState('');
  var [statusFilter, setStatusFilter]   = useState('all');
  var [sortBy, setSortBy]               = useState('pinned_recent');
  var [memberCount, setMemberCount]     = useState(0);

  useEffect(function() { if (organizationId) loadData(); }, [organizationId]);
  useEffect(function() { applyFiltersAndSort(); }, [surveys, searchTerm, statusFilter, sortBy]);

  function isSurveyClosed(s) {
    var expired = s.closes_at && new Date(s.closes_at) < new Date();
    return s.status === 'closed' || expired;
  }

  function applyFiltersAndSort() {
    var filtered = surveys.slice();
    if (searchTerm.trim()) {
      var term = searchTerm.toLowerCase();
      filtered = filtered.filter(function(s) {
        return s.title.toLowerCase().includes(term) ||
          (s.description && s.description.toLowerCase().includes(term));
      });
    }
    if (statusFilter === 'active') filtered = filtered.filter(function(s) { return !isSurveyClosed(s); });
    if (statusFilter === 'closed') filtered = filtered.filter(function(s) { return  isSurveyClosed(s); });

    filtered.sort(function(a, b) {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (sortBy === 'closing') {
        if (!a.closes_at && !b.closes_at) return new Date(b.created_at) - new Date(a.created_at);
        if (!a.closes_at) return 1; if (!b.closes_at) return -1;
        return new Date(a.closes_at) - new Date(b.closes_at);
      }
      var aClosed = isSurveyClosed(a); var bClosed = isSurveyClosed(b);
      if (!aClosed && bClosed) return -1; if (aClosed && !bClosed) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    setFilteredSurveys(filtered);
  }

  async function loadData() {
    try {
      setLoading(true); setError(null);
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { navigate('/login'); return; }
      var user = authResult.data.user;

      var orgResult = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memberResult = await supabase.from('memberships').select('role')
        .eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').maybeSingle();
      if (memberResult.error) throw memberResult.error;
      if (!memberResult.data) { toast.error('You are not a member of this organization.'); navigate('/organizations'); return; }

      var countR = await supabase.from('memberships').select('*', { count:'exact', head:true })
        .eq('organization_id', organizationId).eq('status', 'active');
      setMemberCount(countR.count || 0);

      var surveysResult = await supabase.from('surveys').select('*')
        .eq('organization_id', organizationId).order('created_at', { ascending:false });
      if (surveysResult.error) throw surveysResult.error;
      setSurveys(surveysResult.data || []);
    } catch (err) {
      console.error('Error loading surveys:', err); setError(err.message);
      mascotErrorToast('Failed to load surveys.', 'Please try again.');
    } finally { setLoading(false); }
  }

  function handleSurveyCreated()       { loadData(); setShowCreateModal(false); setEditingSurvey(null); }
  function handleSurveyDeleted()       { loadData(); }
  function handleSurveyUpdated(updated) {
    setSurveys(function(prev) { return prev.map(function(s) { return s.id === updated.id ? updated : s; }); });
  }
  function handleDuplicate(newSurvey) {
    setSurveys(function(prev) { return [newSurvey].concat(prev); });
  }
  function handleEditSurvey(survey) {
    setEditingSurvey(survey);
    setShowCreateModal(true);
  }
  function handleModalClose() {
    setShowCreateModal(false);
    setEditingSurvey(null);
  }

  var activeSurveys = surveys.filter(function(s) { return !isSurveyClosed(s); });
  var closedSurveys = surveys.filter(function(s) { return  isSurveyClosed(s); });
  var pinnedCount   = surveys.filter(function(s) { return s.is_pinned; }).length;
  var hasFilters    = searchTerm || statusFilter !== 'all';

  // ── Subtitle (dynamic, count-based) ──────────────────────────────────────
  var subtitleParts = [];
  if (activeSurveys.length > 0) subtitleParts.push(activeSurveys.length + ' active');
  if (closedSurveys.length > 0) subtitleParts.push(closedSurveys.length + ' closed');
  if (pinnedCount > 0)          subtitleParts.push(pinnedCount + ' pinned');
  var subtitle = subtitleParts.join(' \u00b7 ');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="px-6 py-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 w-32 rounded bg-gray-200 mb-2" />
            <div className="h-4 w-48 rounded bg-gray-100" />
          </div>
          <div className="grid grid-cols-3 gap-4"><StatSkeleton /><StatSkeleton /><StatSkeleton /></div>
          <div className="rounded-xl border p-4 animate-pulse bg-white border-slate-200"><div className="h-10 rounded-lg bg-gray-100" /></div>
          <div className="space-y-4">{[1,2,3].map(function(i){return <SurveyCardSkeleton key={i} />;})}</div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4"><Icon path={ICONS.alert} className="h-14 w-14 text-red-300" /></div>
          <h2 className="text-xl font-bold mb-2 text-[#0E1523]">Failed to Load Surveys</h2>
          <p className="text-sm mb-6 text-[#475569]">{error || 'Organization not found.'}</p>
          <button onClick={function(){setError(null);loadData();}}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="px-6 py-6 space-y-6">

        {/* ── Page header (standardized) ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 style={{ fontSize:'30px', fontWeight:800, color:'#0E1523', margin:0, lineHeight:1.2 }}>Surveys</h1>
            {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
          </div>
          {isAdmin && (
            <button onClick={function(){setShowCreateModal(true);}}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm flex-shrink-0">
              <Icon path={ICONS.plus} className="h-4 w-4" />Create Survey
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className={'rounded-xl p-5 border-2 ' + (activeSurveys.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (activeSurveys.length > 0 ? 'text-green-700' : 'text-gray-500')}>{activeSurveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.check} className={'h-4 w-4 ' + (activeSurveys.length > 0 ? 'text-green-500' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (activeSurveys.length > 0 ? 'text-green-600' : 'text-gray-500')}>Active</p>
            </div>
          </div>
          <div className="rounded-xl p-5 border-2 bg-gray-50 border-gray-200">
            <p className="text-2xl font-extrabold text-gray-600">{closedSurveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.lock} className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-500">Closed</p>
            </div>
          </div>
          <div className={'rounded-xl p-5 border-2 ' + (pinnedCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (pinnedCount > 0 ? 'text-yellow-700' : 'text-gray-500')}>{pinnedCount}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.pin} className={'h-4 w-4 ' + (pinnedCount > 0 ? 'text-yellow-500' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (pinnedCount > 0 ? 'text-yellow-600' : 'text-gray-500')}>Pinned</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-xl border p-4 bg-white border-slate-200">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
            <div className="flex-1 w-full relative min-w-[160px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon path={ICONS.search} className="h-4 w-4 text-gray-400" />
              </div>
              <label htmlFor="search-surveys" className="sr-only">Search surveys</label>
              <input id="search-surveys" type="text" placeholder="Search surveys..."
                value={searchTerm} onChange={function(e){setSearchTerm(e.target.value);}}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-xs font-bold uppercase tracking-wide whitespace-nowrap text-[#F5B731]">Status:</label>
              <select id="status-filter" value={statusFilter} onChange={function(e){setStatusFilter(e.target.value);}}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900">
                <option value="all">{'All (' + surveys.length + ')'}</option>
                <option value="active">{'Active (' + activeSurveys.length + ')'}</option>
                <option value="closed">{'Closed (' + closedSurveys.length + ')'}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-surveys" className="text-xs font-bold uppercase tracking-wide whitespace-nowrap text-[#F5B731]">Sort:</label>
              <select id="sort-surveys" value={sortBy} onChange={function(e){setSortBy(e.target.value);}}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900">
                <option value="pinned_recent">Pinned First</option>
                <option value="recent">Most Recent</option>
                <option value="closing">Closing Soon</option>
              </select>
            </div>
            {hasFilters && (
              <button onClick={function(){setSearchTerm('');setStatusFilter('all');}}
                className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors whitespace-nowrap"
                aria-label="Clear all filters">
                <Icon path={ICONS.x} className="h-3.5 w-3.5" />Clear
              </button>
            )}
          </div>
          {filteredSurveys.length > 0 && (
            <p className="text-xs mt-3 text-[#64748B]">
              {'Showing ' + filteredSurveys.length + ' of ' + surveys.length + ' survey' + (surveys.length!==1?'s':'')}
            </p>
          )}
        </div>

        {/* List or empty state */}
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white border-slate-200">
            <div className="flex justify-center mb-4"><Icon path={ICONS.clipboard} className="h-12 w-12 text-gray-300" /></div>
            <h3 className="text-lg font-semibold mb-1 text-[#0E1523]">
              {hasFilters ? 'No surveys match your filters' : 'No surveys yet'}
            </h3>
            <p className="text-sm mb-6 text-[#475569]">
              {hasFilters ? 'Try adjusting your search or filters.'
                : isAdmin ? 'Create your first survey to gather member feedback.'
                : 'Check back later for surveys from your organization.'}
            </p>
            {isAdmin && !hasFilters && (
              <button onClick={function(){setShowCreateModal(true);}}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm">
                <Icon path={ICONS.plus} className="h-4 w-4" />Create Survey
              </button>
            )}
            {hasFilters && (
              <button onClick={function(){setSearchTerm('');setStatusFilter('all');}}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm">
                <Icon path={ICONS.x} className="h-4 w-4" />Clear Filters
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
                    onSurveyUpdated={handleSurveyUpdated}
                    onDuplicate={handleDuplicate}
                    onEdit={handleEditSurvey}
                    isAdmin={isAdmin}
                    memberCount={memberCount}
                  />
                </div>
              );
            })}
          </div>
        )}

      </div>

      <CreateSurvey
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleSurveyCreated}
        organizationId={organizationId}
        organizationName={organization ? organization.name : ''}
        editSurvey={editingSurvey}
      />
    </div>
  );
}

export default SurveysList;