import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import { Download } from 'lucide-react';
import ListPageLayout from '../components/design-system/ListPageLayout';
import Chip from '../components/design-system/Chip';
import CreateSignupForm from '../components/CreateSignupForm';
import SignupFormCard from '../components/SignupFormCard';
import TemplatePickerModal, { PLATFORM_TEMPLATES } from '../components/TemplatePickerModal';

var STATUS_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'closed', label: 'Closed' }
];

function SignupFormsList() {
  var { organizationId } = useParams();
  var { isAdmin } = useOutletContext();

  var [forms, setForms] = useState([]);
  var [filteredForms, setFilteredForms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [showCreateModal, setShowCreateModal] = useState(false);
  var [showTemplatePicker, setShowTemplatePicker] = useState(false);
  var [templateData, setTemplateData] = useState(null);
  var [searchTerm, setSearchTerm] = useState('');
  var [statusFilter, setStatusFilter] = useState('all');
  var [sortBy, setSortBy] = useState('recent');
  var [selectMode, setSelectMode] = useState(false);
  var [selectedIds, setSelectedIds] = useState([]);
  var [currentUser, setCurrentUser] = useState(null);
  var [memberCount, setMemberCount] = useState(0);

  useEffect(function() {
    loadData();
  }, [organizationId]);

  useEffect(function() {
    applyFilters();
  }, [forms, searchTerm, statusFilter, sortBy]);

  var loadData = async function() {
    try {
      setLoading(true);
      setError(null);

      var formsQuery = supabase
        .from('signup_forms')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_template', false)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        formsQuery = formsQuery.neq('visibility', 'draft');
      }

      var results = await Promise.all([
        supabase.auth.getUser(),
        formsQuery,
        supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active')
      ]);

      var authResult = results[0];
      var formsResult = results[1];
      var countResult = results[2];

      if (authResult.data && authResult.data.user) setCurrentUser(authResult.data.user);
      if (formsResult.error) throw formsResult.error;
      setForms(formsResult.data || []);
      setMemberCount(countResult.count || 0);
    } catch (err) {
      console.error('Error loading signup forms:', err);
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
        return form.title.toLowerCase().includes(search) || (form.description && form.description.toLowerCase().includes(search));
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(function(form) {
        if (statusFilter === 'active') return !isFormClosed(form);
        if (statusFilter === 'closed') return isFormClosed(form);
        return true;
      });
    }

    filtered.sort(function(a, b) {
      // Pinned always floats to top, regardless of which sort criterion is active (§8)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      if (sortBy === 'closing') {
        if (!a.closes_at && !b.closes_at) return 0;
        if (!a.closes_at) return 1;
        if (!b.closes_at) return -1;
        return new Date(a.closes_at) - new Date(b.closes_at);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredForms(filtered);
  };

  var clearFilters = function() {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('recent');
  };

  var hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || sortBy !== 'recent';

  var handleFormCreated = async function(newForm, meta) {
    loadData();
    setShowCreateModal(false);
    setTemplateData(null);
    if (!meta || !meta.firstPublish) return;
    try {
      var notifModule = await import('../lib/notificationService');
      await notifModule.notifyOrganizationMembers({
        organizationId: organizationId,
        type: 'new_signup_form',
        title: newForm && newForm.title ? newForm.title : 'New Sign-Up Form',
        message: 'A new sign-up form is available. Claim your spot!',
        link: '/organizations/' + organizationId + '/signup-forms',
        excludeUserId: currentUser ? currentUser.id : null
      });
      window.dispatchEvent(new CustomEvent('notificationCreated'));
    } catch (ne) {
      console.error('Signup form notification failed:', ne);
    }
  };

  var handleTemplateSelect = function(template, name) {
    setTemplateData(Object.assign({}, template, { _templateName: name }));
    setShowTemplatePicker(false);
    setShowCreateModal(true);
  };

  var handleCreateModalClose = function() {
    setShowCreateModal(false);
    setTemplateData(null);
  };

  var toggleSelectMode = function() {
    setSelectMode(!selectMode);
    setSelectedIds([]);
  };

  var toggleSelectOne = function(formId) {
    setSelectedIds(function(prev) {
      return prev.indexOf(formId) !== -1 ? prev.filter(function(id) { return id !== formId; }) : prev.concat([formId]);
    });
  };

  var toggleSelectAll = function() {
    if (selectedIds.length === filteredForms.length) setSelectedIds([]);
    else setSelectedIds(filteredForms.map(function(f) { return f.id; }));
  };

  var handleBulkExport = async function() {
    if (selectedIds.length === 0) return;
    try {
      var itemsRes = await supabase.from('signup_items').select('*').in('form_id', selectedIds).order('order_number', { ascending: true });
      if (itemsRes.error) throw itemsRes.error;
      var items = itemsRes.data || [];
      var itemIds = items.map(function(i) { return i.id; });

      var responses = [];
      if (itemIds.length > 0) {
        var responsesRes = await supabase
          .from('signup_responses')
          .select('*, member:members!signup_responses_member_id_fkey(user_id,first_name,last_name,email)')
          .in('item_id', itemIds);
        if (responsesRes.error) throw responsesRes.error;
        responses = responsesRes.data || [];
      }

      var formTitleById = {};
      forms.forEach(function(f) { formTitleById[f.id] = f.title; });

      var rows = [['Form', 'Item', 'Member Name', 'Email', 'Quantity', 'Signed Up At']];
      items.forEach(function(item) {
        var itemResponses = responses.filter(function(r) { return r.item_id === item.id; });
        var formTitle = formTitleById[item.form_id] || '';
        if (itemResponses.length === 0) {
          rows.push([formTitle, item.item_name, '', '', '', '']);
        } else {
          itemResponses.forEach(function(r) {
            var name = r.member ? ((r.member.first_name || '') + ' ' + (r.member.last_name || '')).trim() : 'Unknown';
            rows.push([formTitle, item.item_name, name, r.member ? (r.member.email || '') : '', r.quantity || 1, r.created_at ? new Date(r.created_at).toLocaleString() : '']);
          });
        }
      });

      var csv = rows.map(function(row) {
        return row.map(function(cell) {
          var str = String(cell === null || cell === undefined ? '' : cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) return '"' + str.replace(/"/g, '""') + '"';
          return str;
        }).join(',');
      }).join('\n');

      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'signup_forms_export_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);

      mascotSuccessToast('Export ready.', selectedIds.length + ' form' + (selectedIds.length !== 1 ? 's' : '') + ' exported.');
      setSelectMode(false);
      setSelectedIds([]);
    } catch (err) {
      mascotErrorToast('Failed to export selected forms.', err.message);
    }
  };

  var activeForms = forms.filter(function(f) { return !isFormClosed(f); }).length;
  var closedForms = forms.filter(function(f) { return isFormClosed(f); }).length;
  var pinnedForms = forms.filter(function(f) { return f.is_pinned; }).length;

  var chipCounts = { all: forms.length, active: activeForms, closed: closedForms };
  var signupTemplates = PLATFORM_TEMPLATES.signup_form || [];

  var subtitleText = forms.length + ' form' + (forms.length !== 1 ? 's' : '') + (pinnedForms > 0 ? ' \u00b7 ' + pinnedForms + ' pinned' : '');

  var status = 'ready';
  if (loading) status = 'loading';
  else if (error) status = 'error';
  else if (forms.length === 0) status = 'empty';
  else if (filteredForms.length === 0) status = 'no-results';

  var headerActions = isAdmin ? (
    <>
      <button
        onClick={toggleSelectMode}
        style={{ height: '44px', padding: '0 24px', background: selectMode ? '#F1F5F9' : 'transparent', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        aria-pressed={selectMode}
        aria-label={selectMode ? 'Cancel selecting forms' : 'Select forms to export'}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-slate-50"
      >
        {selectMode ? 'Cancel' : 'Select'}
      </button>
      <button
        onClick={function() { setShowTemplatePicker(true); }}
        style={{ height: '44px', padding: '0 24px', background: 'transparent', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        aria-label="Browse sign-up form templates"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-slate-50"
      >
        Templates
      </button>
      <button
        onClick={function() { setShowCreateModal(true); }}
        style={{ height: '44px', padding: '0 24px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        aria-label="Create new sign-up form"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600"
      >
        Create Form
      </button>
    </>
  ) : null;

  var filtersContent = selectMode ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1E40AF', fontWeight: 600, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={selectedIds.length === filteredForms.length && filteredForms.length > 0}
          onChange={toggleSelectAll}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedIds.length} selected
      </label>
      <button
        onClick={handleBulkExport}
        disabled={selectedIds.length === 0}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', background: selectedIds.length === 0 ? '#93C5FD' : '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer' }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600"
      >
        <Download size={14} aria-hidden="true" />
        Export CSV
      </button>
    </div>
  ) : (
    <>
      {STATUS_CHIPS.map(function(chip) {
        return (
          <Chip key={chip.id} selected={statusFilter === chip.id} onClick={function() { setStatusFilter(chip.id); }} activeColor="blue">
            {chip.label} ({chipCounts[chip.id]})
          </Chip>
        );
      })}

      <select
        value={sortBy}
        onChange={function(e) { setSortBy(e.target.value); }}
        style={{ padding: '8px 12px', background: '#FFFFFF', border: '0.5px solid #E2E8F0', borderRadius: '8px', color: '#0E1523', fontSize: '14px', cursor: 'pointer' }}
        aria-label="Sort forms"
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="recent">Most Recent</option>
        <option value="closing">Closing Soon</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          style={{ padding: '8px 14px', background: '#F1F5F9', border: '0.5px solid #E2E8F0', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          aria-label="Clear all filters"
          className="hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Clear
        </button>
      )}
    </>
  );

  return (
    <>
      <ListPageLayout
        title="Sign-Up Forms"
        subtitle={subtitleText}
        headerActions={headerActions}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search forms..."
        searchLabel="Search sign-up forms"
        filters={filtersContent}
        status={status}
        onRetry={loadData}
        onClearFilters={clearFilters}
        emptyStateConfig={{
          heading: 'No Sign-Up Forms Yet',
          description: 'Create your first sign-up form to collect volunteer slots, potluck items, or time sign-ups.',
          primaryActionLabel: isAdmin ? 'Create Your First Form' : undefined,
          onPrimaryAction: isAdmin ? function() { setShowCreateModal(true); } : undefined,
          secondaryActionLabel: isAdmin && signupTemplates.length > 0 ? 'Browse Templates' : undefined,
          onSecondaryAction: isAdmin && signupTemplates.length > 0 ? function() { setShowTemplatePicker(true); } : undefined
        }}
        itemListLabel="Sign-up forms"
      >
        {filteredForms.map(function(form) {
          return (
            <SignupFormCard
              key={form.id}
              form={form}
              currentUserId={currentUser ? currentUser.id : null}
              isAdmin={isAdmin}
              memberCount={memberCount}
              onDelete={loadData}
              onUpdate={loadData}
              onDuplicate={loadData}
              selectMode={selectMode}
              selected={selectedIds.indexOf(form.id) !== -1}
              onToggleSelect={toggleSelectOne}
            />
          );
        })}
      </ListPageLayout>

      {/* Rendered as siblings, not children — ListPageLayout only renders children when
          status === 'ready', so a modal opened from the empty/no-results/error state's
          action button would never appear if nested inside it. */}
      {showCreateModal && (
        <CreateSignupForm
          organizationId={organizationId}
          currentUserId={currentUser ? currentUser.id : null}
          templateData={templateData}
          onClose={handleCreateModalClose}
          onSaved={handleFormCreated}
        />
      )}

      {showTemplatePicker && (
        <TemplatePickerModal
          contentType="signup_form"
          organizationId={organizationId}
          onClose={function() { setShowTemplatePicker(false); }}
          onSelect={handleTemplateSelect}
        />
      )}
    </>
  );
}

export default SignupFormsList;