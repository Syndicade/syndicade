import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import usePlanLimits from '../hooks/usePlanLimits';
import { Lock } from 'lucide-react';

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
  plus:   'M12 4v16m8-8H4',
  edit:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash:  ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  tag:    ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z'],
  x:      'M6 18L18 6M6 6l12 12',
};

var UNIT_OPTIONS = [
  { label: 'Days',   value: 'days'   },
  { label: 'Weeks',  value: 'weeks'  },
  { label: 'Months', value: 'months' },
  { label: 'Years',  value: 'years'  },
];

function unitToMonths(value, unit) {
  var n = parseInt(value, 10) || 0;
  if (unit === 'days')   return Math.round(n / 30.4375);
  if (unit === 'weeks')  return Math.round(n / 4.345);
  if (unit === 'months') return n;
  if (unit === 'years')  return n * 12;
  return n;
}

function monthsToDisplay(months) {
  if (!months) return '';
  if (months % 12 === 0) return (months / 12) + ' ' + (months / 12 === 1 ? 'year' : 'years');
  return months + ' ' + (months === 1 ? 'month' : 'months');
}

var EMPTY_FORM = { name: '', dues_amount: '', duration_value: '12', duration_unit: 'months' };

function TierModal({ tier, organizationId, onSave, onClose }) {
  var isEdit = !!tier;
  var [form, setForm] = useState(function() {
    if (isEdit) {
      var months = tier.duration_months || 12;
      var unit = 'months';
      var value = String(months);
      if (months % 12 === 0) { unit = 'years'; value = String(months / 12); }
      return { name: tier.name || '', dues_amount: tier.dues_amount != null ? String(tier.dues_amount) : '', duration_value: value, duration_unit: unit };
    }
    return Object.assign({}, EMPTY_FORM);
  });
  var [saving, setSaving] = useState(false);

  var months = unitToMonths(form.duration_value, form.duration_unit);
  var until = new Date();
  until.setMonth(until.getMonth() + months);
  var untilStr = months > 0 ? until.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  function set(field, val) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: val }); });
  }

  useEffect(function() {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return function() { document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Tier name is required.'); return; }
    if (!form.duration_value || parseInt(form.duration_value, 10) < 1) { toast.error('Duration must be at least 1.'); return; }

    setSaving(true);
    try {
      var payload = {
        organization_id: organizationId,
        name: form.name.trim(),
        dues_amount: form.dues_amount ? parseFloat(form.dues_amount) : null,
        duration_months: months,
      };

      var result;
      if (isEdit) {
        result = await supabase.from('membership_tiers').update(payload).eq('id', tier.id).select().single();
      } else {
        result = await supabase.from('membership_tiers').insert(payload).select().single();
      }
      if (result.error) throw result.error;
      toast.success(isEdit ? 'Tier updated.' : 'Tier created.');
      onSave(result.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save tier.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="tier-modal-title">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 id="tier-modal-title" className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Tier' : 'New Membership Tier'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Close">
            <Icon path={ICONS.x} className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="tier-name" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tier Name <span aria-hidden="true">*</span></label>
            <input
              id="tier-name"
              type="text"
              placeholder="e.g. General, Senior, Student"
              value={form.name}
              onChange={function(e) { set('name', e.target.value); }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="tier-amount" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Dues Amount (optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none" aria-hidden="true">$</span>
              <input
                id="tier-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.dues_amount}
                onChange={function(e) { set('dues_amount', e.target.value); }}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Duration <span aria-hidden="true">*</span></label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="12"
                value={form.duration_value}
                onChange={function(e) { set('duration_value', e.target.value); }}
                className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Duration amount"
              />
              <select
                value={form.duration_unit}
                onChange={function(e) { set('duration_unit', e.target.value); }}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Duration unit"
              >
                {UNIT_OPTIONS.map(function(u) { return <option key={u.value} value={u.value}>{u.label}</option>; })}
              </select>
            </div>
            {untilStr && (
              <p className="text-xs text-gray-400 mt-1.5">If paid today: expires <strong className="text-gray-600">{untilStr}</strong></p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Tier')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ tier, onConfirm, onClose }) {
  var [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      var result = await supabase.from('membership_tiers').delete().eq('id', tier.id);
      if (result.error) throw result.error;
      toast.success(tier.name + ' tier deleted.');
      onConfirm(tier.id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete tier.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-tier-title">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 id="delete-tier-title" className="text-lg font-bold text-gray-900 mb-2">Delete Tier</h2>
        <p className="text-sm text-gray-500 mb-6">
          Delete <strong className="text-gray-700">{tier.name}</strong>? Members assigned to this tier will be unassigned but their paid status won't change.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembershipTiers({ organizationId }) {
  var [tiers, setTiers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [editTarget, setEditTarget] = useState(null);
  var [deleteTarget, setDeleteTarget] = useState(null);
  var [showCreate, setShowCreate] = useState(false);
  var { plan } = usePlanLimits(organizationId);
  var isGrowthPlus = plan === 'growth' || plan === 'pro';

  if (!isGrowthPlus) {
  return (
    <div className="relative" style={{ minHeight: '60vh' }}>
      <div className="opacity-20 pointer-events-none select-none" aria-hidden="true">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Membership Tiers</h3>
            <p className="text-sm text-gray-500 mt-0.5">Define tiers with preset dues amounts and durations.</p>
          </div>
        </div>
        <ul className="space-y-2">
          {['General', 'Senior', 'Student'].map(function(n) {
            return <li key={n} className="h-14 bg-gray-100 border border-gray-200 rounded-lg" />;
          })}
        </ul>
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-16 px-4" style={{ background: 'rgba(14,21,35,0.6)' }}>
        <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-8 max-w-md w-full text-center" role="region" aria-label="Feature locked">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Lock size={20} color="#8B5CF6" aria-hidden="true" />
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
            Available on Growth
          </span>
          <h2 className="text-xl font-bold text-white mb-2">Membership Tiers</h2>
          <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
            Create paid and free membership levels, set renewal schedules, and collect dues — all in one place.
          </p>
          <ul className="text-left text-sm mb-6 space-y-2" style={{ color: '#CBD5E1' }}>
            {['Create unlimited membership tiers', 'Set monthly or annual dues', 'Collect payments via Stripe', 'Track member payment status'].map(function(item) {
              return (
                <li key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" aria-hidden="true" />
                  {item}
                </li>
              );
            })}
          </ul>
          <a href="billing" className="block w-full py-3 rounded-lg font-semibold text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" style={{ background: '#3B82F6' }}>
            Upgrade to Growth →
          </a>
        </div>
      </div>
    </div>
  );
}

  useEffect(function() {
    if (organizationId) fetchTiers();
  }, [organizationId]);

  async function fetchTiers() {
    setLoading(true);
    var result = await supabase
      .from('membership_tiers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    if (!result.error) setTiers(result.data || []);
    setLoading(false);
  }

  function handleSaved(tier) {
    setTiers(function(prev) {
      var exists = prev.find(function(t) { return t.id === tier.id; });
      if (exists) return prev.map(function(t) { return t.id === tier.id ? tier : t; });
      return prev.concat([tier]).sort(function(a, b) { return a.name.localeCompare(b.name); });
    });
    setEditTarget(null);
    setShowCreate(false);
  }

  function handleDeleted(id) {
    setTiers(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
    setDeleteTarget(null);
  }

  return (
    <section aria-labelledby="tiers-heading">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 id="tiers-heading" className="text-base font-bold text-gray-900">Membership Tiers</h3>
          <p className="text-sm text-gray-500 mt-0.5">Define tiers with preset dues amounts and durations.</p>
        </div>
        <button
          onClick={function() { setShowCreate(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Add new membership tier"
        >
          <Icon path={ICONS.plus} className="h-4 w-4" />
          Add Tier
        </button>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading tiers">
          {[1,2].map(function(i) { return <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />; })}
        </div>
      ) : tiers.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <Icon path={ICONS.tag} className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500">No tiers yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Add tiers like General, Senior, or Student to assign members.</p>
          <button
            onClick={function() { setShowCreate(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Icon path={ICONS.plus} className="h-4 w-4" />
            Add First Tier
          </button>
        </div>
      ) : (
        <ul className="space-y-2" role="list" aria-label="Membership tiers">
          {tiers.map(function(tier) {
            return (
              <li key={tier.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <span className="text-sm font-semibold text-gray-900">{tier.name}</span>
                  <span className="ml-3 text-xs text-gray-500">
                    {tier.dues_amount != null ? '$' + Number(tier.dues_amount).toFixed(2) + ' · ' : ''}
                    {monthsToDisplay(tier.duration_months)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={function() { setEditTarget(tier); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label={'Edit ' + tier.name + ' tier'}
                  >
                    <Icon path={ICONS.edit} className="h-4 w-4" />
                  </button>
                  <button
                    onClick={function() { setDeleteTarget(tier); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
                    aria-label={'Delete ' + tier.name + ' tier'}
                  >
                    <Icon path={ICONS.trash} className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(showCreate || editTarget) && (
        <TierModal
          tier={editTarget || null}
          organizationId={organizationId}
          onSave={handleSaved}
          onClose={function() { setEditTarget(null); setShowCreate(false); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          tier={deleteTarget}
          onConfirm={handleDeleted}
          onClose={function() { setDeleteTarget(null); }}
        />
      )}
    </section>
  );
}