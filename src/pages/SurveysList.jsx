import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
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
  list:      'M4 6h16M4 10h16M4 14h16M4 18h16',
  x:         'M6 18L18 6M6 6l12 12',
  alert:     ['M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'],
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
function StatSkeleton({ isDark }) {
  return (
    <div className={'rounded-xl p-5 animate-pulse border ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-100 border-gray-200')}>
      <div className={'h-7 w-10 rounded mb-2 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-300')} />
      <div className={'h-4 w-20 rounded ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-200')} />
    </div>
  );
}

function SurveyCardSkeleton({ isDark }) {
  return (
    <div className={'rounded-xl p-6 animate-pulse border ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 space-y-2">
          <div className={'h-5 w-2/3 rounded ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
          <div className={'h-4 w-full rounded ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
          <div className={'h-4 w-1/2 rounded ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
        </div>
        <div className={'h-6 w-16 rounded-full flex-shrink-0 ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
      </div>
      <div className="flex gap-3">
        <div className={'h-9 w-28 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
        <div className={'h-9 w-20 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
      </div>
    </div>
  );
}

function SurveysList() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();
  var themeCtx = useTheme();
  var isDark = themeCtx.isDark;

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
      mascotErrorToast('Failed to load surveys.', 'Please try again.');
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
    mascotSuccessToast('Survey deleted.');
  }

  var activeSurveys = surveys.filter(function(s) { return !isSurveyClosed(s); });
  var closedSurveys = surveys.filter(function(s) { return isSurveyClosed(s); });
  var hasFilters = searchTerm || statusFilter !== 'all';

  // ── Theme shorthands ──────────────────────────────────────────────────────────
  var pageBg    = isDark ? 'bg-[#0E1523]'    : 'bg-gray-50';
  var cardBg    = isDark ? 'bg-[#1A2035]'    : 'bg-white';
  var border    = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var textPri   = isDark ? 'text-white'       : 'text-gray-900';
  var textSec   = isDark ? 'text-[#CBD5E1]'  : 'text-[#475569]';
  var textMuted = isDark ? 'text-[#94A3B8]'  : 'text-[#64748B]';
  var inputBg   = isDark ? 'bg-[#1E2845] border-[#2A3550] text-white placeholder-[#64748B]' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  var selectBg  = isDark ? 'bg-[#1E2845] border-[#2A3550] text-white' : 'bg-white border-gray-300 text-gray-900';
  var labelCls  = isDark ? 'text-[#F5B731]'  : 'text-gray-500';

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={'min-h-screen ' + pageBg}>
        <div className="px-6 py-6 space-y-6">
          <div className={'rounded-xl border p-6 animate-pulse ' + cardBg + ' ' + border}>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className={'h-7 w-28 rounded ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
                <div className={'h-4 w-56 rounded ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
              </div>
              <div className={'h-10 w-36 rounded-lg ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200')} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatSkeleton isDark={isDark} />
            <StatSkeleton isDark={isDark} />
            <StatSkeleton isDark={isDark} />
          </div>
          <div className={'rounded-xl border p-4 animate-pulse ' + cardBg + ' ' + border}>
            <div className={'h-10 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-gray-100')} />
          </div>
          <div className="space-y-4">
            {[1,2,3].map(function(i) { return <SurveyCardSkeleton key={i} isDark={isDark} />; })}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error || !organization) {
    return (
      <div className={'min-h-screen flex items-center justify-center p-6 ' + pageBg}>
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <Icon path={ICONS.alert} className={'h-14 w-14 ' + (isDark ? 'text-red-400' : 'text-red-300')} />
          </div>
          <h2 className={'text-xl font-bold mb-2 ' + textPri}>Failed to Load Surveys</h2>
          <p className={'text-sm mb-6 ' + textSec}>{error || 'Organization not found.'}</p>
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
    <div className={'min-h-screen ' + pageBg}>
      <div className="px-6 py-6 space-y-6">

        {/* Page header */}
        <div className={'rounded-xl border p-5 ' + cardBg + ' ' + border}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={'p-2 rounded-lg ' + (isDark ? 'bg-[#1E2845]' : 'bg-green-50')}>
                <Icon path={ICONS.clipboard} className={'h-6 w-6 ' + (isDark ? 'text-green-400' : 'text-green-600')} />
              </div>
              <div>
                <h1 className={'text-xl font-bold ' + textPri}>Surveys</h1>
                <p className={'text-sm ' + textMuted}>Create surveys and collect member feedback</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={function() { setShowCreateModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Create Survey
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={'rounded-xl p-5 border-2 ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-700')}>{surveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.list} className={'h-4 w-4 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>Total Surveys</p>
            </div>
          </div>

          <div className={'rounded-xl p-5 border-2 ' + (activeSurveys.length > 0
            ? (isDark ? 'bg-[#1B3A2F] border-[#22C55E]/30' : 'bg-green-50 border-green-200')
            : (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-50 border-gray-200'))}>
            <p className={'text-2xl font-extrabold ' + (activeSurveys.length > 0
              ? (isDark ? 'text-green-400' : 'text-green-700')
              : (isDark ? 'text-[#CBD5E1]' : 'text-gray-500'))}>{activeSurveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.check} className={'h-4 w-4 ' + (activeSurveys.length > 0
                ? (isDark ? 'text-green-400' : 'text-green-500')
                : (isDark ? 'text-[#64748B]' : 'text-gray-400'))} />
              <p className={'text-sm font-semibold ' + (activeSurveys.length > 0
                ? (isDark ? 'text-green-400' : 'text-green-600')
                : (isDark ? 'text-[#94A3B8]' : 'text-gray-500'))}>Active</p>
            </div>
          </div>

          <div className={'rounded-xl p-5 border-2 ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-gray-50 border-gray-200')}>
            <p className={'text-2xl font-extrabold ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-600')}>{closedSurveys.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <Icon path={ICONS.lock} className={'h-4 w-4 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')} />
              <p className={'text-sm font-semibold ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>Closed</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={'rounded-xl border p-4 ' + cardBg + ' ' + border}>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">

            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Icon path={ICONS.search} className={'h-4 w-4 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')} />
              </div>
              <label htmlFor="search-surveys" className="sr-only">Search surveys</label>
              <input
                id="search-surveys"
                type="text"
                placeholder="Search surveys..."
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                className={'w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ' + inputBg}
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className={'text-xs font-bold uppercase tracking-wide whitespace-nowrap ' + labelCls}>Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={function(e) { setStatusFilter(e.target.value); }}
                className={'px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ' + selectBg}
              >
                <option value="all">{'All (' + surveys.length + ')'}</option>
                <option value="active">{'Active (' + activeSurveys.length + ')'}</option>
                <option value="closed">{'Closed (' + closedSurveys.length + ')'}</option>
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={function() { setSearchTerm(''); setStatusFilter('all'); }}
                className={'flex items-center gap-1 px-3 py-2.5 text-xs font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors whitespace-nowrap ' + (isDark ? 'border-[#2A3550] text-[#94A3B8] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10' : 'border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50')}
                aria-label="Clear all filters"
              >
                <Icon path={ICONS.x} className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {filteredSurveys.length > 0 && (
            <p className={'text-xs mt-3 ' + textMuted}>
              {'Showing ' + filteredSurveys.length + ' of ' + surveys.length + ' survey' + (surveys.length !== 1 ? 's' : '')}
            </p>
          )}
        </div>

        {/* Survey list or empty state */}
        {filteredSurveys.length === 0 ? (
          <div className={'text-center py-16 rounded-xl border ' + cardBg + ' ' + border}>
            <div className="flex justify-center mb-4">
              <Icon path={ICONS.clipboard} className={'h-12 w-12 ' + (isDark ? 'text-[#2A3550]' : 'text-gray-300')} />
            </div>
            <h3 className={'text-lg font-semibold mb-1 ' + textPri}>
              {hasFilters ? 'No surveys match your filters' : 'No surveys yet'}
            </h3>
            <p className={'text-sm mb-6 ' + textSec}>
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
                className={'inline-flex items-center gap-2 px-5 py-2.5 border font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm ' + (isDark ? 'border-[#2A3550] text-[#CBD5E1] hover:bg-[#1E2845]' : 'border-gray-300 text-gray-700 hover:bg-gray-50')}
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
                    isDark={isDark}
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