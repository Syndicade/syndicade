// src/pages/OrgOpportunities.jsx
// Syndicade — Opportunities Retrofit, Step 5 (part 2 of 2)
// Thin ListPageLayout page. Modals render as siblings, never children, per §13.1
// (Sign-Up Forms-discovered status-gated-rendering rule).
// CODE RULE (§21): var only — never const/let.
//
// Fixes rolled in this step:
//   - Skeleton loading -> shared CardSkeleton (via ListPageLayout's built-in LoadingGrid)
//   - Brand yellow template-grid label -> removed along with the custom starter-card grid
//     (dropped in favor of ListPageLayout's standard empty state; "Browse templates" still
//     opens the full TemplatePickerModal)
//   - Dead `_openTab` code in openEdit() -> removed
//   - Unused `Briefcase` import -> removed
//   - Applications drawer: proper mascot empty state (was plain Inbox icon), no longer
//     closes on backdrop click (kept consistent with Modal's rule per your prior decision)
//   - Real error state + retry added (page previously had no load-failure handling at all)
//   - BUG FIX: non-admin members of an unverified org previously saw a blank page (list was
//     gated behind isVerified for everyone). Now only the admin "Get Verified" prompt is
//     gated by isAdmin — everyone else sees the normal list.

import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import TemplatePickerModal from '../components/TemplatePickerModal';
import { X, AlertCircle, Users, Globe, Lock } from 'lucide-react';
import { useModalKeyboard } from '../hooks/useModalKeyboard';
import PageHeader from '../components/PageHeader';
import ListPageLayout from '../components/design-system/ListPageLayout';
import Chip from '../components/design-system/Chip';
import OpportunityCard from '../components/OpportunityCard';
import CreateOpportunity from '../components/CreateOpportunity';

// ── Tokens ────────────────────────────────────────────────────────────────────
var cardBg        = '#FFFFFF';
var borderColor   = '#E2E8F0';
var elevatedBg    = '#F1F5F9';
var textPrimary   = '#0E1523';
var textSecondary = '#475569';
var textMuted     = '#64748B';

var VISIBILITY_FILTERS = [
  { value: 'all',           label: 'All' },
  { value: 'draft',         label: 'Draft' },
  { value: 'members_only',  label: 'Members Only' },
  { value: 'public',        label: 'Public' },
];

// ── Not-verified admin state ──────────────────────────────────────────────────
function NotVerifiedState() {
  return (
    <div>
      <PageHeader title="Opportunities" subtitle="Verification required" />
      <div style={{ padding: '20px 24px 32px' }}>
        <div style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '24px' }}>
          <div style={{ textAlign: 'center', padding: '36px 24px' }}>
            <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '200px', margin: '0 auto 20px', display: 'block', mixBlendMode: 'multiply' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>Verified Nonprofits Only</h2>
            <p style={{ fontSize: '14px', color: textSecondary, maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              Posting opportunities is available to verified 501(c)(3) organizations. Get verified to connect with job seekers, volunteers, and board candidates.
            </p>
            <a href="settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
              className="hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Get Verified</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Confirm delete modal (local — shared ConfirmModal.jsx swap tracked separately) ────
function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  var modalRef = useRef(null);
  useModalKeyboard(true, onCancel, modalRef);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
      <div ref={modalRef} style={{ background: cardBg, borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
          <AlertCircle size={22} color="#EF4444" />
        </div>
        <h3 id="confirm-delete-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, textAlign: 'center', marginBottom: '8px' }}>Delete Opportunity?</h3>
        <p style={{ fontSize: '13px', color: textSecondary, textAlign: 'center', lineHeight: 1.6, marginBottom: '24px' }}>
          <strong style={{ color: textPrimary }}>{item.title}</strong> will be permanently removed. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button autoFocus onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: textMuted, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Make Template modal ───────────────────────────────────────────────────────
function MakeTemplateModal({ item, onClose, onSaved }) {
  var [name, setName] = useState(item.title);
  var [saving, setSaving] = useState(false);
  var modalRef = useRef(null);
  useModalKeyboard(true, onClose, modalRef);

  async function handleSave() {
    if (!name.trim()) { toast.error('Template name is required.'); return; }
    setSaving(true);
    var payload = Object.assign({}, item, {
      id: undefined,
      title: name.trim(),
      is_template: true,
      visibility: 'draft',
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      updated_at: new Date().toISOString(),
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_opportunities').insert(payload);
    setSaving(false);
    if (result.error) { mascotErrorToast('Failed to save template.', result.error.message); return; }
    mascotSuccessToast('Template saved!');
    onSaved();
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60 }}
      role="dialog" aria-modal="true" aria-labelledby="tmpl-opp-title">
      <div ref={modalRef} style={{ background: cardBg, borderRadius: '14px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 id="tmpl-opp-title" style={{ fontSize: '16px', fontWeight: 800, color: textPrimary, marginBottom: '6px' }}>Save as Template</h3>
        <p style={{ fontSize: '13px', color: textMuted, marginBottom: '20px' }}>This opportunity will be saved as a reusable template for your org.</p>
        <label htmlFor="tmpl-opp-name" style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, display: 'block', marginBottom: '6px' }}>Template name</label>
        <input id="tmpl-opp-name" value={name} onChange={function(e) { setName(e.target.value); }}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', color: textPrimary, outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
          className="focus:ring-2 focus:ring-blue-500" aria-required="true" />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: textMuted, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }} className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Applications drawer ───────────────────────────────────────────────────────
// Fix: proper mascot empty state (was plain Inbox icon). No backdrop-click-close
// (kept consistent with Modal's no-close-on-backdrop rule per your prior decision).
function ApplicationsDrawer({ item, onClose }) {
  var [apps, setApps]       = useState([]);
  var [loading, setLoading] = useState(true);
  var modalRef = useRef(null);
  useModalKeyboard(true, onClose, modalRef);

  useEffect(function() {
    async function load() {
      var r = await supabase.from('opportunity_applications').select('*').eq('opportunity_id', item.id).order('created_at', { ascending: false });
      setApps(r.data || []); setLoading(false);
    }
    load();
  }, [item.id]);

  async function updateStatus(appId, status) {
    var r = await supabase.from('opportunity_applications').update({ status: status }).eq('id', appId);
    if (r.error) { toast.error('Failed to update status.'); return; }
    setApps(function(prev) { return prev.map(function(a) { return a.id === appId ? Object.assign({}, a, { status: status }) : a; }); });
    mascotSuccessToast('Status updated.');
  }

  var STATUS_COLORS = { new: '#3B82F6', reviewed: '#D97706', contacted: '#8B5CF6', closed: '#64748B' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}
      role="dialog" aria-modal="true" aria-labelledby="apps-drawer-title">
      <div ref={modalRef} style={{ width: '100%', maxWidth: '460px', background: cardBg, height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + borderColor, position: 'sticky', top: 0, background: cardBg, zIndex: 1 }}>
          <div>
            <h2 id="apps-drawer-title" style={{ fontSize: '15px', fontWeight: 800, color: textPrimary, margin: 0 }}>Applications</h2>
            <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>{item.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label="Close drawer"><X size={18} /></button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {loading && (
            <div aria-busy="true" aria-label="Loading applications">
              {[1, 2, 3].map(function(i) { return <div key={i} style={{ height: '80px', background: elevatedBg, borderRadius: '10px', marginBottom: '10px' }} className="animate-pulse" />; })}
            </div>
          )}
          {!loading && apps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <img src="/mascots-empty.png" alt="" aria-hidden="true" style={{ maxWidth: '140px', margin: '0 auto 14px', display: 'block', mixBlendMode: 'multiply' }} />
              <p style={{ fontSize: '14px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>No applications yet</p>
              <p style={{ fontSize: '13px', color: textMuted }}>Applications submitted through the platform will appear here.</p>
            </div>
          )}
          {!loading && apps.map(function(app) {
            return (
              <div key={app.id} style={{ background: '#F8FAFC', border: '1px solid ' + borderColor, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>{app.applicant_name}</p>
                    <a href={'mailto:' + app.applicant_email} style={{ fontSize: '12px', color: '#3B82F6', textDecoration: 'none' }}>{app.applicant_email}</a>
                  </div>
                  <select value={app.status} onChange={function(e) { updateStatus(app.id, e.target.value); }}
                    style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', border: '1px solid ' + borderColor, background: cardBg, color: STATUS_COLORS[app.status] || textMuted, cursor: 'pointer' }}
                    aria-label={'Status for ' + app.applicant_name} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                {app.message && <p style={{ fontSize: '12px', color: textSecondary, lineHeight: 1.5, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{app.message}</p>}
                <p style={{ fontSize: '11px', color: textMuted, marginTop: '8px' }}>
                  {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function OrgOpportunities() {
  var context        = useOutletContext();
  var organizationId = context.organizationId;
  var organization   = context.organization;
  var isAdmin        = context.isAdmin;
  var isVerified     = !!(organization && organization.is_verified_nonprofit);

  var [currentUserId, setCurrentUserId]   = useState(null);
  var [items, setItems]                   = useState([]);
  var [appCounts, setAppCounts]           = useState({});
  var [loading, setLoading]               = useState(true);
  var [loadError, setLoadError]           = useState(false);
  var [showModal, setShowModal]           = useState(false);
  var [editing, setEditing]               = useState(null);
  var [templateBanner, setTemplateBanner] = useState(null);
  var [showTemplatePicker, setShowTemplatePicker] = useState(false);
  var [deleting, setDeleting]             = useState(null);
  var [makingTemplate, setMakingTemplate] = useState(null);
  var [viewingApps, setViewingApps]       = useState(null);
  var [search, setSearch]                 = useState('');
  var [filterVis, setFilterVis]           = useState('all');

  useEffect(function() {
    supabase.auth.getUser().then(function(r) { if (r.data && r.data.user) setCurrentUserId(r.data.user.id); });
  }, []);

  useEffect(function() { loadItems(); }, [organizationId, isAdmin]);

  async function loadItems() {
    setLoading(true);
    setLoadError(false);
    var query = supabase.from('org_opportunities').select('*')
      .eq('organization_id', organizationId)
      .eq('is_template', false)
      .order('created_at', { ascending: false });
    if (!isAdmin) query = query.neq('visibility', 'draft');
    var r = await query;

    if (r.error) {
      setLoading(false);
      setLoadError(true);
      return;
    }

    var rows = r.data || [];
    setItems(rows);

    var formIds = rows.filter(function(i) { return i.apply_method === 'form'; }).map(function(i) { return i.id; });
    if (formIds.length > 0) {
      var countResult = await supabase.from('opportunity_applications').select('opportunity_id').in('opportunity_id', formIds);
      var counts = {};
      (countResult.data || []).forEach(function(row) { counts[row.opportunity_id] = (counts[row.opportunity_id] || 0) + 1; });
      setAppCounts(counts);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setTemplateBanner(null);
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setTemplateBanner(null);
    setShowModal(true);
  }

  function handleTemplateSelect(template, name) {
    setShowTemplatePicker(false);
    var clean = Object.assign({}, template);
    delete clean._id;
    delete clean._desc;
    delete clean.id;
    setEditing(clean);
    setTemplateBanner(name);
    setShowModal(true);
  }

  async function handleDuplicate(item) {
    var payload = Object.assign({}, item, {
      title: item.title + ' (Copy)',
      visibility: 'draft',
      show_on_website: false,
      show_on_discover: false,
      is_featured: false,
      is_template: false,
      group_ids: [],
      updated_at: new Date().toISOString(),
    });
    delete payload.id;
    delete payload.created_at;
    var result = await supabase.from('org_opportunities').insert(payload);
    if (result.error) { mascotErrorToast('Failed to duplicate.', result.error.message); return; }
    mascotSuccessToast('Opportunity duplicated — saved as draft.');
    loadItems();
  }

  async function handleUnpublish(item) {
    var result = await supabase.from('org_opportunities').update({ visibility: 'members_only', updated_at: new Date().toISOString() }).eq('id', item.id);
    if (result.error) { mascotErrorToast('Failed to unpublish.', result.error.message); return; }
    mascotSuccessToast('Opportunity unpublished.', 'Now visible to members only.');
    loadItems();
  }

  async function handleDelete() {
    if (!deleting) return;
    var r = await supabase.from('org_opportunities').delete().eq('id', deleting.id);
    if (r.error) { mascotErrorToast('Failed to delete.'); setDeleting(null); return; }
    mascotSuccessToast('Opportunity deleted.');
    setDeleting(null); loadItems();
  }

  // Admin-only verification gate — everyone else sees the normal list (bug fix, see header note)
  if (isAdmin && !isVerified) {
    return <NotVerifiedState />;
  }

  var filtered = items.filter(function(item) {
    var matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    var matchVis    = filterVis === 'all' || item.visibility === filterVis;
    return matchSearch && matchVis;
  });

  var counts = { all: items.length, draft: 0, members_only: 0, public: 0 };
  items.forEach(function(item) { if (counts[item.visibility] !== undefined) counts[item.visibility]++; });

  var visibleFilters = isAdmin ? VISIBILITY_FILTERS : VISIBILITY_FILTERS.filter(function(f) { return f.value !== 'draft'; });

  var status = loading ? 'loading' : loadError ? 'error' : items.length === 0 ? 'empty' : filtered.length === 0 ? 'no-results' : 'ready';

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <ListPageLayout
        title="Opportunities"
        subtitle={items.length + ' listing' + (items.length !== 1 ? 's' : '')}
        headerActions={isAdmin ? (
          <>
            <button onClick={function() { setShowTemplatePicker(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'transparent', color: textSecondary, border: '1px solid ' + borderColor, borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">
              Templates
            </button>
            <button onClick={openCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}
              className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Post Opportunity
            </button>
          </>
        ) : null}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search opportunities..."
        searchLabel="Search opportunities"
        filters={
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} role="group" aria-label="Filter by visibility">
            {visibleFilters.map(function(f) {
              return (
                <Chip key={f.value} selected={filterVis === f.value} onClick={function() { setFilterVis(f.value); }}>
                  {f.label}{counts[f.value] > 0 ? ' (' + counts[f.value] + ')' : ''}
                </Chip>
              );
            })}
          </div>
        }
        status={status}
        onRetry={loadItems}
        onClearFilters={function() { setSearch(''); setFilterVis('all'); }}
        emptyStateConfig={{
          heading: 'No opportunities yet',
          description: 'Post roles, board positions, internships, and volunteer opportunities to share with members or publish to the public directory.',
          primaryActionLabel: isAdmin ? 'Post Opportunity' : undefined,
          onPrimaryAction: isAdmin ? openCreate : undefined,
          secondaryActionLabel: isAdmin ? 'Browse templates' : undefined,
          onSecondaryAction: isAdmin ? function() { setShowTemplatePicker(true); } : undefined,
        }}
        itemListLabel="Opportunities"
      >
        {filtered.map(function(item) {
          return (
            <OpportunityCard key={item.id} item={item} appCount={appCounts[item.id] || 0}
              onEdit={openEdit}
              onDuplicate={handleDuplicate}
              onMakeTemplate={function(i) { setMakingTemplate(i); }}
              onDelete={function(i) { setDeleting(i); }}
              onUnpublish={handleUnpublish}
              onViewApps={function(i) { setViewingApps(i); }} />
          );
        })}
      </ListPageLayout>

      {/* Modals render as siblings, never children, per §13.1 */}

      {showModal && (
        <CreateOpportunity organizationId={organizationId} currentUserId={currentUserId} existing={editing}
          templateBanner={templateBanner}
          onClose={function() { setShowModal(false); setEditing(null); setTemplateBanner(null); }} onSaved={loadItems} />
      )}

      {showTemplatePicker && (
        <TemplatePickerModal
          contentType="opportunity"
          organizationId={organizationId}
          onClose={function() { setShowTemplatePicker(false); }}
          onSelect={handleTemplateSelect}
        />
      )}

      {deleting && <ConfirmDeleteModal item={deleting} onConfirm={handleDelete} onCancel={function() { setDeleting(null); }} />}

      {makingTemplate && (
        <MakeTemplateModal item={makingTemplate} onClose={function() { setMakingTemplate(null); }} onSaved={loadItems} />
      )}

      {viewingApps && <ApplicationsDrawer item={viewingApps} onClose={function() { setViewingApps(null); }} />}
    </div>
  );
}

export default OrgOpportunities;