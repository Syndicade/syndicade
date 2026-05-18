import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, ClipboardList, ArrowUpDown } from 'lucide-react';
import CreateSignupForm from '../components/CreateSignupForm';
import SignupFormCard from '../components/SignupFormCard';

function SignupFormsList() {
  var { organizationId } = useParams();
  var [forms, setForms] = useState([]);
  var [filteredForms, setFilteredForms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [searchTerm, setSearchTerm] = useState('');
  var [statusFilter, setStatusFilter] = useState('all');
  var [sortBy, setSortBy] = useState('recent');
  var [currentUser, setCurrentUser] = useState(null);
  var [userRole, setUserRole] = useState(null);
  var [memberCount, setMemberCount] = useState(0);

  useEffect(function() {
    fetchUserRole();
    fetchMemberCount();
  }, [organizationId]);

  useEffect(function() {
    if (organizationId) fetchForms();
  }, [organizationId]);

  useEffect(function() {
    applyFilters();
  }, [forms, searchTerm, statusFilter, sortBy]);

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

  var fetchMemberCount = async function() {
    try {
      var { count } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');
      setMemberCount(count || 0);
    } catch (err) {
      console.error('Error fetching member count:', err);
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
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err.message);
      mascotErrorToast('Failed to load sign-up forms.', 'Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  var isFormClosed = function(form) {
    return form.status === 'closed' || (form.closes_at && new Date(form.closes_at) < new Date());
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
        if (statusFilter === 'active') return !isFormClosed(form);
        if (statusFilter === 'closed') return isFormClosed(form);
        return true;
      });
    }

    // Sort
    filtered.sort(function(a, b) {
      if (sortBy === 'closing') {
        // Forms with no closes_at go last
        if (!a.closes_at && !b.closes_at) return 0;
        if (!a.closes_at) return 1;
        if (!b.closes_at) return -1;
        return new Date(a.closes_at) - new Date(b.closes_at);
      }
      // Default: most recent
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredForms(filtered);
  };

  var handleFormCreated = function() {
    fetchForms();
    setShowCreateModal(false);
  };

  var handleFormUpdated = function() {
    fetchForms();
  };

  var handleDuplicate = function() {
    fetchForms();
  };

  // Stats
  var activeForms = forms.filter(function(f) { return !isFormClosed(f); }).length;
  var closedForms = forms.filter(function(f) { return isFormClosed(f); }).length;

  // Skeleton
  if (loading) {
    return (
      <main style={{ background: '#F8FAFC', minHeight: '100vh', padding: '32px' }} aria-label="Sign-Up Forms">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ height: '12px', width: '120px', borderRadius: '6px', background: '#E2E8F0', marginBottom: '10px' }} className="animate-pulse" />
              <div style={{ height: '28px', width: '200px', borderRadius: '6px', background: '#E2E8F0', marginBottom: '8px' }} className="animate-pulse" />
              <div style={{ height: '16px', width: '280px', borderRadius: '6px', background: '#E2E8F0' }} className="animate-pulse" />
            </div>
            <div style={{ height: '44px', width: '140px', borderRadius: '8px', background: '#E2E8F0' }} className="animate-pulse" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[1, 2, 3].map(function(n) {
              return <div key={n} style={{ height: '80px', borderRadius: '12px', background: '#E2E8F0' }} className="animate-pulse" />;
            })}
          </div>
          <div style={{ height: '64px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }} className="animate-pulse" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map(function(n) {
              return <div key={n} style={{ height: '220px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }} className="animate-pulse" />;
            })}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', padding: '32px' }} aria-label="Sign-Up Forms">

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
            Sign-Up Forms
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0E1523', margin: 0 }}>
            Manage Sign-Ups
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }} role="region" aria-label="Sign-up forms summary">
        <div style={{ background: '#DBEAFE', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563EB' }}>{forms.length}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#475569', marginTop: '4px' }}>Total Forms</div>
        </div>
        <div style={{ background: '#DCFCE7', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A' }}>{activeForms}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#475569', marginTop: '4px' }}>Active</div>
        </div>
        <div style={{ background: '#F1F5F9', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#64748B' }}>{closedForms}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#475569', marginTop: '4px' }}>Closed</div>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchTerm}
              onChange={function(e) { setSearchTerm(e.target.value); }}
              style={{ width: '100%', paddingLeft: '38px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0E1523', fontSize: '14px', boxSizing: 'border-box' }}
              aria-label="Search sign-up forms"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={15} style={{ position: 'absolute', left: '10px', color: '#64748B', pointerEvents: 'none' }} aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={function(e) { setStatusFilter(e.target.value); }}
              style={{ paddingLeft: '32px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0E1523', fontSize: '14px', cursor: 'pointer', appearance: 'none' }}
              aria-label="Filter by status"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Forms</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Sort */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ArrowUpDown size={15} style={{ position: 'absolute', left: '10px', color: '#64748B', pointerEvents: 'none' }} aria-hidden="true" />
            <select
              value={sortBy}
              onChange={function(e) { setSortBy(e.target.value); }}
              style={{ paddingLeft: '32px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0E1523', fontSize: '14px', cursor: 'pointer', appearance: 'none' }}
              aria-label="Sort forms"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="closing">Closing Soon</option>
            </select>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '10px' }}>
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
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '64px 24px', textAlign: 'center' }}>
          <ClipboardList size={44} style={{ color: '#94A3B8', margin: '0 auto 16px' }} aria-hidden="true" />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0E1523', marginBottom: '8px' }}>
            {forms.length === 0 ? 'No Sign-Up Forms Yet' : 'No Forms Match Your Search'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '360px', margin: '0 auto 24px', lineHeight: '1.6' }}>
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
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}
          role="list"
          aria-label="Sign-up forms"
        >
          {filteredForms.map(function(form) {
            return (
              <SignupFormCard
                key={form.id}
                form={form}
                currentUserId={currentUser?.id}
                userRole={userRole}
                memberCount={memberCount}
                onDelete={fetchForms}
                onUpdate={handleFormUpdated}
                onDuplicate={handleDuplicate}
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