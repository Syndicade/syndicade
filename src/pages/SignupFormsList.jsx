import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, ClipboardList } from 'lucide-react';
import CreateSignupForm from '../components/CreateSignupForm';
import SignupFormCard from '../components/SignupFormCard';

function SignupFormsList() {
  var { organizationId } = useParams();
  var { isDark } = useTheme();
  var [forms, setForms] = useState([]);
  var [filteredForms, setFilteredForms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [searchTerm, setSearchTerm] = useState('');
  var [statusFilter, setStatusFilter] = useState('all');
  var [currentUser, setCurrentUser] = useState(null);
  var [userRole, setUserRole] = useState(null);

  useEffect(function() {
    fetchUserRole();
  }, [organizationId]);

  useEffect(function() {
    if (organizationId) fetchForms();
  }, [organizationId]);

  useEffect(function() {
    applyFilters();
  }, [forms, searchTerm, statusFilter]);

  var fetchUserRole = async function() {
    try {
      var { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      var { data: membership } = await supabase
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

  var fetchForms = async function() {
    try {
      setLoading(true);
      setError(null);
      var { data, error: fetchError } = await supabase
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

  var applyFilters = function() {
    var filtered = forms.slice();
    if (searchTerm.trim()) {
      var search = searchTerm.toLowerCase();
      filtered = filtered.filter(function(form) {
        return form.title.toLowerCase().includes(search) ||
          (form.description && form.description.toLowerCase().includes(search));
      });
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(function(form) {
        var isClosed = form.status === 'closed' || (form.closes_at && new Date(form.closes_at) < new Date());
        if (statusFilter === 'active') return !isClosed;
        if (statusFilter === 'closed') return isClosed;
        return true;
      });
    }
    setFilteredForms(filtered);
  };

  var handleFormCreated = function() {
    fetchForms();
    setShowCreateModal(false);
  };

  // Color tokens
  var pageBg = isDark ? '#0E1523' : '#F8FAFC';
  var cardBg = isDark ? '#1A2035' : '#FFFFFF';
  var cardBorder = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  var textSecondary = isDark ? '#CBD5E1' : '#475569';
  var textMuted = isDark ? '#94A3B8' : '#64748B';
  var inputBg = isDark ? '#1E2845' : '#FFFFFF';
  var inputBorder = isDark ? '#2A3550' : '#CBD5E1';
  var inputColor = isDark ? '#FFFFFF' : '#0F172A';

  // Skeleton
  if (loading) {
    return (
      <main style={{ background: pageBg, minHeight: '100vh', padding: '32px' }} aria-label="Sign-Up Forms">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ height: '28px', width: '200px', borderRadius: '6px', background: isDark ? '#1E2845' : '#E2E8F0', marginBottom: '8px' }} className="animate-pulse" />
              <div style={{ height: '16px', width: '280px', borderRadius: '6px', background: isDark ? '#1E2845' : '#E2E8F0' }} className="animate-pulse" />
            </div>
            <div style={{ height: '44px', width: '140px', borderRadius: '8px', background: isDark ? '#1E2845' : '#E2E8F0' }} className="animate-pulse" />
          </div>
          {/* Filter bar skeleton */}
          <div style={{ height: '64px', borderRadius: '12px', background: isDark ? '#1A2035' : '#FFFFFF', border: '1px solid ' + (isDark ? '#2A3550' : '#E2E8F0') }} className="animate-pulse" />
          {/* Cards skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map(function(n) {
              return (
                <div key={n} style={{ height: '220px', borderRadius: '12px', background: isDark ? '#1A2035' : '#FFFFFF', border: '1px solid ' + (isDark ? '#2A3550' : '#E2E8F0') }} className="animate-pulse" />
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: pageBg, minHeight: '100vh', padding: '32px' }} aria-label="Sign-Up Forms">

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
            Sign-Up Forms
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: textPrimary, margin: 0 }}>
            Manage Sign-Ups
          </h1>
          <p style={{ fontSize: '14px', color: textMuted, marginTop: '4px' }}>
            Volunteer slots, potluck items, time sign-ups, and more.
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={function() { setShowCreateModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
            aria-label="Create new sign-up form"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600"
          >
            <Plus size={18} aria-hidden="true" />
            Create Form
          </button>
        )}
      </div>

      {/* Search + Filter bar */}
      <div style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchTerm}
              onChange={function(e) { setSearchTerm(e.target.value); }}
              style={{ width: '100%', paddingLeft: '38px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', background: inputBg, border: '1px solid ' + inputBorder, borderRadius: '8px', color: inputColor, fontSize: '14px', boxSizing: 'border-box' }}
              aria-label="Search sign-up forms"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={15} style={{ position: 'absolute', left: '10px', color: textMuted, pointerEvents: 'none' }} aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={function(e) { setStatusFilter(e.target.value); }}
              style={{ paddingLeft: '32px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', background: inputBg, border: '1px solid ' + inputBorder, borderRadius: '8px', color: inputColor, fontSize: '14px', cursor: 'pointer', appearance: 'none' }}
              aria-label="Filter by status"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Forms</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: textMuted, marginTop: '10px' }}>
          Showing {filteredForms.length} of {forms.length} form{forms.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', color: '#EF4444', fontSize: '14px' }}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {filteredForms.length === 0 ? (
        <div style={{ background: cardBg, border: '1px solid ' + cardBorder, borderRadius: '12px', padding: '64px 24px', textAlign: 'center' }}>
          <ClipboardList size={44} style={{ color: textMuted, margin: '0 auto 16px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>
            {forms.length === 0 ? 'No Sign-Up Forms Yet' : 'No Forms Match Your Search'}
          </h2>
          <p style={{ fontSize: '14px', color: textMuted, maxWidth: '360px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            {forms.length === 0
              ? 'Create your first sign-up form to collect volunteer slots, potluck items, or time sign-ups.'
              : 'Try adjusting your search or status filter.'}
          </p>
          {userRole === 'admin' && forms.length === 0 && (
            <button
              onClick={function() { setShowCreateModal(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600"
            >
              <Plus size={18} aria-hidden="true" />
              Create Your First Form
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {filteredForms.map(function(form) {
            return (
              <SignupFormCard
                key={form.id}
                form={form}
                currentUserId={currentUser?.id}
                userRole={userRole}
                onDelete={fetchForms}
                onUpdate={fetchForms}
              />
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateSignupForm
          organizationId={organizationId}
          onClose={function() { setShowCreateModal(false); }}
          onFormCreated={handleFormCreated}
        />
      )}
    </main>
  );
}

export default SignupFormsList;