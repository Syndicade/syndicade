/**
 * StaffFinancials.jsx
 * Full financial dashboard for Syndicade staff.
 * Tracks all business expenses + subscription/ticket revenue.
 * Exports QuickBooks-compatible IIF and standard CSV.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from './MascotToast';
import toast from 'react-hot-toast';
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, AlertTriangle, Plus, Search,
  Download, X, ChevronDown, Edit2, Trash2, Tag,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

var EXPENSE_CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure & Hosting', group: 'Technology' },
  { value: 'software', label: 'Software & SaaS', group: 'Technology' },
  { value: 'email', label: 'Email & Communications', group: 'Technology' },
  { value: 'domain', label: 'Domain & DNS', group: 'Technology' },
  { value: 'marketing_ads', label: 'Advertising & Paid Media', group: 'Marketing' },
  { value: 'marketing_design', label: 'Design & Creative', group: 'Marketing' },
  { value: 'marketing_content', label: 'Content & Copywriting', group: 'Marketing' },
  { value: 'marketing_social', label: 'Social Media Tools', group: 'Marketing' },
  { value: 'marketing_print', label: 'Print & Promotional Materials', group: 'Marketing' },
  { value: 'legal', label: 'Legal Fees', group: 'Professional Services' },
  { value: 'accounting', label: 'Accounting & Bookkeeping', group: 'Professional Services' },
  { value: 'consultant', label: 'Consultants & Contractors', group: 'Professional Services' },
  { value: 'agency', label: 'Agency Fees', group: 'Professional Services' },
  { value: 'travel_transport', label: 'Transportation & Flights', group: 'Travel' },
  { value: 'travel_lodging', label: 'Lodging & Hotels', group: 'Travel' },
  { value: 'travel_meals', label: 'Meals & Entertainment', group: 'Travel' },
  { value: 'conference', label: 'Conferences & Events', group: 'Events' },
  { value: 'membership', label: 'Memberships & Associations', group: 'Events' },
  { value: 'supplies', label: 'Office Supplies', group: 'Operations' },
  { value: 'equipment', label: 'Equipment & Hardware', group: 'Operations' },
  { value: 'utilities', label: 'Utilities & Internet', group: 'Operations' },
  { value: 'insurance', label: 'Insurance', group: 'Operations' },
  { value: 'taxes_fees', label: 'Taxes & Government Fees', group: 'Operations' },
  { value: 'other', label: 'Other', group: 'Other' },
];

var PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer / ACH' },
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Cash' },
  { value: 'stripe', label: 'Stripe (auto-billed)' },
  { value: 'other', label: 'Other' },
];

var PLAN_PRICES = {
  starter_month: 14.99, starter_year: 12.49,
  growth_month: 29.00,  growth_year: 24.17,
  pro_month: 59.00,     pro_year: 49.17,
};
var ANNUAL_PRICES = {
  starter_year: 149.88,
  growth_year: 290.00,
  pro_year: 590.00,
};
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var QB_ACCOUNT_MAP = {
  infrastructure: 'Infrastructure & Hosting', software: 'Software & SaaS',
  email: 'Email & Communications', domain: 'Domain & DNS',
  marketing_ads: 'Advertising', marketing_design: 'Design & Creative',
  marketing_content: 'Content & Copywriting', marketing_social: 'Social Media',
  marketing_print: 'Printing & Reproduction', legal: 'Legal & Professional',
  accounting: 'Accounting', consultant: 'Consulting',
  agency: 'Professional Fees', travel_transport: 'Travel - Transportation',
  travel_lodging: 'Travel - Lodging', travel_meals: 'Meals & Entertainment',
  conference: 'Conferences & Seminars', membership: 'Dues & Memberships',
  supplies: 'Office Supplies', equipment: 'Equipment',
  utilities: 'Utilities', insurance: 'Insurance',
  taxes_fees: 'Taxes & Licenses', other: 'Miscellaneous',
};

var QB_MAP_KEY = 'qb_account_map';
var CUSTOM_CATS_KEY = 'custom_expense_categories';

var CATEGORY_GROUPS = [];
EXPENSE_CATEGORIES.forEach(function(cat) {
  var existing = CATEGORY_GROUPS.find(function(g) { return g.group === cat.group; });
  if (existing) { existing.items.push(cat); }
  else { CATEGORY_GROUPS.push({ group: cat.group, items: [cat] }); }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(val) {
  return '$' + parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getCategoryLabel(val, customCats) {
  var cat = EXPENSE_CATEGORIES.find(function(c) { return c.value === val; });
  if (cat) return cat.label;
  if (customCats) {
    var custom = customCats.find(function(c) { return c.value === val; });
    if (custom) return custom.label;
  }
  return val;
}
function getCategoryGroup(val, customCats) {
  var cat = EXPENSE_CATEGORIES.find(function(c) { return c.value === val; });
  if (cat) return cat.group;
  if (customCats) {
    var custom = customCats.find(function(c) { return c.value === val; });
    if (custom) return 'Custom';
  }
  return 'Other';
}
function getPaymentLabel(val) {
  var pm = PAYMENT_METHODS.find(function(p) { return p.value === val; });
  return pm ? pm.label : val;
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

var inputCls = 'w-full bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-[#94A3B8]';

// ─── Skeletons ────────────────────────────────────────────────────────────────

function MetricSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse" aria-hidden="true">
      <div className="w-9 h-9 rounded-lg bg-slate-100 mb-3" />
      <div className="h-3 w-20 rounded bg-slate-200 mb-2" />
      <div className="h-8 w-24 rounded bg-slate-100 mb-2" />
      <div className="h-3 w-32 rounded bg-slate-100" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-hidden="true">
      {Array.from({ length: 5 }).map(function(_, i) {
        return (
          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="flex-1 h-3 rounded bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, cardBg, iconBg, iconColor, valueColor }) {
  return (
    <div className={'border rounded-xl p-5 ' + (cardBg || 'bg-white border-slate-200')} role="region" aria-label={label + ' metric'}>
      <div className={'w-9 h-9 rounded-lg flex items-center justify-center mb-3 ' + (iconBg || 'bg-slate-100')}>
        <Icon size={18} className={iconColor || 'text-slate-500'} aria-hidden="true" />
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[4px] text-[#F5B731] mb-1">{label}</div>
      <div className={'text-3xl font-extrabold mb-1 ' + (valueColor || 'text-[#0E1523]')}>{value}</div>
      {sub && <div className="text-[12px] text-[#64748B]">{sub}</div>}
    </div>
  );
}

// ─── Expense Form Modal ───────────────────────────────────────────────────────

function ExpenseModal({ expense, staffUserId, customCategories, onClose, onSaved }) {
  var isEditing = !!expense;
  var [form, setForm] = useState({
    expense_date: expense ? expense.expense_date : todayISO(),
    category: expense ? expense.category : 'infrastructure',
    vendor: expense ? (expense.vendor || '') : '',
    description: expense ? (expense.description || '') : '',
    amount: expense ? expense.amount.toString() : '',
    payment_method: expense ? (expense.payment_method || 'credit_card') : 'credit_card',
    notes: expense ? (expense.notes || '') : '',
  });
  var [saving, setSaving] = useState(false);
  var firstRef = useRef(null);

  useEffect(function() { if (firstRef.current) firstRef.current.focus(); }, []);

  function setField(key, val) {
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = val;
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }
    if (!form.expense_date) {
      toast.error('Select an expense date.');
      return;
    }
    setSaving(true);
    var payload = {
      expense_date: form.expense_date,
      category: form.category,
      vendor: form.vendor.trim() || null,
      description: form.description.trim() || null,
      amount: parseFloat(parseFloat(form.amount).toFixed(2)),
      payment_method: form.payment_method,
      notes: form.notes.trim() || null,
      created_by: staffUserId,
    };
    var op = isEditing
      ? supabase.from('staff_expenses').update(payload).eq('id', expense.id)
      : supabase.from('staff_expenses').insert(payload);
    var { error } = await op;
    if (error) {
      mascotErrorToast('Failed to save expense.', error.message);
      setSaving(false);
      return;
    }
    mascotSuccessToast(isEditing ? 'Expense updated.' : 'Expense added.');
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
      role="dialog" aria-modal="true"
      aria-label={isEditing ? 'Edit expense' : 'Add expense'}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-[#0E1523] font-extrabold text-[16px]">{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
            <p className="text-[12px] text-[#64748B]">{isEditing ? 'Update the details below.' : 'Enter the details for this business expense.'}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#0E1523] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors" aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="exp-date" className="block text-[12px] font-bold text-[#475569] mb-1.5">Date <span className="text-red-500" aria-hidden="true">*</span></label>
              <input ref={firstRef} id="exp-date" type="date" required value={form.expense_date} onChange={function(e) { setField('expense_date', e.target.value); }} className={inputCls} aria-required="true" />
            </div>
            <div>
              <label htmlFor="exp-amount" className="block text-[12px] font-bold text-[#475569] mb-1.5">Amount <span className="text-red-500" aria-hidden="true">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[13px]" aria-hidden="true">$</span>
                <input id="exp-amount" type="number" required min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={function(e) { setField('amount', e.target.value); }} className="w-full bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-[#94A3B8]" aria-required="true" aria-label="Amount in dollars" />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="exp-category" className="block text-[12px] font-bold text-[#475569] mb-1.5">Category <span className="text-red-500" aria-hidden="true">*</span></label>
            <div className="relative">
              <select id="exp-category" required value={form.category} onChange={function(e) { setField('category', e.target.value); }} className={'appearance-none ' + inputCls + ' pr-8'} aria-required="true">
                {CATEGORY_GROUPS.map(function(group) {
                  return (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map(function(cat) { return <option key={cat.value} value={cat.value}>{cat.label}</option>; })}
                    </optgroup>
                  );
                })}
                {customCategories && customCategories.length > 0 && (
                  <optgroup label="Custom">
                    {customCategories.map(function(cat) { return <option key={cat.value} value={cat.value}>{cat.label}</option>; })}
                  </optgroup>
                )}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
            </div>
          </div>
          <div>
            <label htmlFor="exp-vendor" className="block text-[12px] font-bold text-[#475569] mb-1.5">Vendor / Payee</label>
            <input id="exp-vendor" type="text" placeholder="e.g. AWS, Google, FedEx" value={form.vendor} onChange={function(e) { setField('vendor', e.target.value); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="exp-description" className="block text-[12px] font-bold text-[#475569] mb-1.5">Description</label>
            <input id="exp-description" type="text" placeholder="Brief description of this expense" value={form.description} onChange={function(e) { setField('description', e.target.value); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="exp-payment" className="block text-[12px] font-bold text-[#475569] mb-1.5">Payment Method</label>
            <div className="relative">
              <select id="exp-payment" value={form.payment_method} onChange={function(e) { setField('payment_method', e.target.value); }} className={'appearance-none ' + inputCls + ' pr-8'}>
                {PAYMENT_METHODS.map(function(pm) { return <option key={pm.value} value={pm.value}>{pm.label}</option>; })}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
            </div>
          </div>
          <div>
            <label htmlFor="exp-notes" className="block text-[12px] font-bold text-[#475569] mb-1.5">Notes</label>
            <textarea id="exp-notes" rows={3} placeholder="Additional notes, receipt reference, etc." value={form.notes} onChange={function(e) { setField('notes', e.target.value); }} className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-500 text-white text-[14px] font-bold rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : (isEditing ? 'Update Expense' : 'Add Expense')}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-[#475569] text-[14px] font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ expense, customCategories, onClose, onDeleted }) {
  var [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    var { error } = await supabase.from('staff_expenses').delete().eq('id', expense.id);
    if (error) {
      mascotErrorToast('Failed to delete expense.', 'Check your connection and try again.');
      setDeleting(false);
      return;
    }
    mascotSuccessToast('Expense deleted.');
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Confirm delete expense" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl" onClick={function(e) { e.stopPropagation(); }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-[#0E1523] font-extrabold text-[15px]">Delete Expense</h2>
            <p className="text-[12px] text-[#64748B]">This cannot be undone.</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
          <p className="text-[13px] text-[#0E1523] font-semibold">{getCategoryLabel(expense.category, customCategories)}</p>
          <p className="text-[12px] text-[#64748B]">{expense.vendor ? expense.vendor + ' · ' : ''}{formatCurrency(expense.amount)} · {expense.expense_date}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-500 text-white text-[14px] font-bold rounded-xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-[#475569] text-[14px] font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── QB Settings Modal ────────────────────────────────────────────────────────

function QbSettingsModal({ qbMap, customCategories, onClose, onSaved }) {
  var [form, setForm] = useState(Object.assign({}, qbMap));
  var [customCats, setCustomCats] = useState(customCategories ? customCategories.slice() : []);
  var [saving, setSaving] = useState(false);
  var [newCatLabel, setNewCatLabel] = useState('');
  var [newCatQbName, setNewCatQbName] = useState('');
  var [addingCat, setAddingCat] = useState(false);

  var qbInputCls = 'w-full bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 placeholder-[#94A3B8]';

  function setField(key, val) {
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = val;
      return next;
    });
  }

  function addCustomCategory() {
    if (!newCatLabel.trim()) return;
    var value = 'custom_' + newCatLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (customCats.find(function(c) { return c.value === value; })) {
      toast.error('A category with that name already exists.');
      return;
    }
    var newCat = { value: value, label: newCatLabel.trim() };
    setCustomCats(function(prev) { return prev.concat([newCat]); });
    if (newCatQbName.trim()) {
      setForm(function(prev) {
        var next = Object.assign({}, prev);
        next[value] = newCatQbName.trim();
        return next;
      });
    }
    setNewCatLabel('');
    setNewCatQbName('');
    setAddingCat(false);
  }

  function removeCustomCategory(value) {
    setCustomCats(function(prev) { return prev.filter(function(c) { return c.value !== value; }); });
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      delete next[value];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    var { error: mapError } = await supabase.from('site_content').upsert({
      key: QB_MAP_KEY, value: JSON.stringify(form),
      label: 'QuickBooks Account Name Map',
      description: 'Maps Syndicade expense categories to QuickBooks Chart of Accounts names',
      section: 'Financials', field_type: 'text', sort_order: 998,
    }, { onConflict: 'key' });
    var { error: catError } = await supabase.from('site_content').upsert({
      key: CUSTOM_CATS_KEY, value: JSON.stringify(customCats),
      label: 'Custom Expense Categories',
      description: 'Staff-defined custom expense categories',
      section: 'Financials', field_type: 'text', sort_order: 997,
    }, { onConflict: 'key' });
    if (mapError || catError) {
      mascotErrorToast('Failed to save settings.', 'Check your connection and try again.');
      setSaving(false);
      return;
    }
    mascotSuccessToast('Settings saved.');
    setSaving(false);
    onSaved(form, customCats);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" role="dialog" aria-modal="true" aria-label="QuickBooks account settings" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={function(e) { e.stopPropagation(); }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-[#0E1523] font-extrabold text-[16px]">Expense Categories & QuickBooks Accounts</h2>
            <p className="text-[12px] text-[#64748B]">Add custom categories and map all categories to your QuickBooks Chart of Accounts.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#0E1523] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors" aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5">
          {/* Custom categories */}
          <div className="mb-8">
            <div className="text-[11px] font-bold uppercase tracking-[4px] text-[#F5B731] mb-3">Custom Categories</div>
            {customCats.length > 0 && (
              <div className="space-y-2 mb-3">
                {customCats.map(function(cat) {
                  return (
                    <div key={cat.value} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-[#0E1523]">{cat.label}</div>
                      <input type="text" value={form[cat.value] || ''} onChange={function(e) { setField(cat.value, e.target.value); }} placeholder="QuickBooks account name" className={qbInputCls} aria-label={'QuickBooks account name for ' + cat.label} />
                      <button onClick={function() { removeCustomCategory(cat.value); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label={'Remove ' + cat.label}>
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {addingCat ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="new-cat-label" className="block text-[11px] font-bold text-[#475569] mb-1">Category Name</label>
                    <input id="new-cat-label" type="text" placeholder="e.g. R&D, Sponsorships" value={newCatLabel} onChange={function(e) { setNewCatLabel(e.target.value); }} className={qbInputCls} />
                  </div>
                  <div>
                    <label htmlFor="new-cat-qb" className="block text-[11px] font-bold text-[#475569] mb-1">QuickBooks Account Name</label>
                    <input id="new-cat-qb" type="text" placeholder="Leave blank to set later" value={newCatQbName} onChange={function(e) { setNewCatQbName(e.target.value); }} className={qbInputCls} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addCustomCategory} disabled={!newCatLabel.trim()} className="px-4 py-2 bg-blue-500 text-white text-[12px] font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 transition-colors">Add Category</button>
                  <button onClick={function() { setAddingCat(false); setNewCatLabel(''); setNewCatQbName(''); }} className="px-4 py-2 bg-white border border-slate-200 text-[#475569] text-[12px] font-bold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={function() { setAddingCat(true); }} className="flex items-center gap-2 text-[13px] text-blue-500 hover:text-blue-600 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                <Plus size={14} aria-hidden="true" /> Add custom category
              </button>
            )}
          </div>
          {/* QB mapping */}
          <div className="text-[11px] font-bold uppercase tracking-[4px] text-[#F5B731] mb-3">QuickBooks Account Names</div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-[12px] text-blue-700">
            These names must exactly match your QuickBooks Chart of Accounts. Ask your CPA if unsure.
          </div>
          {CATEGORY_GROUPS.map(function(group) {
            return (
              <div key={group.group} className="mb-6">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2">{group.group}</div>
                <div className="space-y-2">
                  {group.items.map(function(cat) {
                    return (
                      <div key={cat.value} className="grid grid-cols-[180px_1fr] gap-3 items-center">
                        <label htmlFor={'qb-' + cat.value} className="text-[13px] text-[#475569]">{cat.label}</label>
                        <input id={'qb-' + cat.value} type="text" value={form[cat.value] || ''} onChange={function(e) { setField(cat.value, e.target.value); }} placeholder={QB_ACCOUNT_MAP[cat.value] || 'Account name'} className={qbInputCls} aria-label={'QuickBooks account name for ' + cat.label} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-500 text-white text-[14px] font-bold rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-[#475569] text-[14px] font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StaffFinancials({ staffUserId }) {
  var NOW = new Date();
  var NOW_YEAR = NOW.getFullYear();

  var [expenses, setExpenses] = useState([]);
  var [allSubs, setAllSubs] = useState([]);
  var [ticketData, setTicketData] = useState([]);
  var [loading, setLoading] = useState(true);
  var [qbMap, setQbMap] = useState(QB_ACCOUNT_MAP);
  var [customCategories, setCustomCategories] = useState([]);

  var [selectedYear, setSelectedYear] = useState(NOW_YEAR);
  var [selectedMonth, setSelectedMonth] = useState(null);
  var [filterCategory, setFilterCategory] = useState('');
  var [filterPayment, setFilterPayment] = useState('');
  var [searchQuery, setSearchQuery] = useState('');

  var [activeView, setActiveView] = useState('overview');
  var [showModal, setShowModal] = useState(false);
  var [editingExpense, setEditingExpense] = useState(null);
  var [deletingExpense, setDeletingExpense] = useState(null);
  var [showQbSettings, setShowQbSettings] = useState(false);
  var [showExportMenu, setShowExportMenu] = useState(false);

  var YEARS = [NOW_YEAR - 2, NOW_YEAR - 1, NOW_YEAR, NOW_YEAR + 1];

  useEffect(function() { loadAll(); }, [selectedYear]);

  async function loadAll() {
    setLoading(true);
    try {
      var yearStart = selectedYear + '-01-01';
      var yearEnd = selectedYear + '-12-31';
      var [expRes, subsRes, ticketsRes, qbRes, customCatRes] = await Promise.all([
        supabase.from('staff_expenses').select('*').gte('expense_date', yearStart).lte('expense_date', yearEnd).order('expense_date', { ascending: false }),
        supabase.from('subscriptions').select('organization_id, plan, status, created_at, current_period_end, trial_ends_at'),
        supabase.from('ticket_purchases').select('total_amount, purchased_at').gte('purchased_at', yearStart + 'T00:00:00').lte('purchased_at', yearEnd + 'T23:59:59'),
        supabase.from('site_content').select('value').eq('key', QB_MAP_KEY).maybeSingle(),
        supabase.from('site_content').select('value').eq('key', CUSTOM_CATS_KEY).maybeSingle(),
      ]);
      if (expRes.error) mascotErrorToast('Failed to load expenses.', expRes.error.message);
      setExpenses(expRes.data || []);
      setAllSubs(subsRes.data || []);
      setTicketData(ticketsRes.data || []);
      if (qbRes.data && qbRes.data.value) {
        try { setQbMap(Object.assign({}, QB_ACCOUNT_MAP, JSON.parse(qbRes.data.value))); } catch (e) {}
      }
      if (customCatRes.data && customCatRes.data.value) {
        try { setCustomCategories(JSON.parse(customCatRes.data.value)); } catch (e) {}
      }
    } catch (err) {
      mascotErrorToast('Failed to load financials.', err.message);
    }
    setLoading(false);
  }

  function getMonthRevenue(monthIdx) {
    var monthStart = new Date(selectedYear, monthIdx, 1);
    var monthEnd = new Date(selectedYear, monthIdx + 1, 0, 23, 59, 59);
    var subRev = 0; var subCount = 0;
    allSubs.forEach(function(s) {
      if (!s.plan || s.status === 'trialing' || s.status === 'canceled') return;
      var createdDate = new Date(s.created_at);
      var isAnnual = s.plan.endsWith('_year');
      if (isAnnual) {
        if (createdDate >= monthStart && createdDate <= monthEnd) { subRev += (ANNUAL_PRICES[s.plan] || (PLAN_PRICES[s.plan] * 12)); subCount++; }
      } else {
        var periodEnd = s.current_period_end ? new Date(s.current_period_end) : new Date('2099-01-01');
        if (createdDate <= monthEnd && periodEnd >= monthStart) { subRev += (PLAN_PRICES[s.plan] || 0); subCount++; }
      }
    });
    var monthTickets = ticketData.filter(function(t) { var d = new Date(t.purchased_at); return d >= monthStart && d <= monthEnd; });
    var ticketRev = monthTickets.reduce(function(acc, t) { var amt = t.total_amount || 0; return acc + (amt > 100 ? amt / 100 : amt); }, 0);
    var grossRev = subRev + ticketRev;
    var stripeFees = grossRev * 0.029 + (subCount + monthTickets.length) * 0.30;
    return { subRev: subRev, ticketRev: ticketRev, grossRev: grossRev, stripeFees: stripeFees, subCount: subCount, ticketCount: monthTickets.length };
  }

  function getYearRevenue() {
    var totals = { subRev: 0, ticketRev: 0, grossRev: 0, stripeFees: 0 };
    for (var m = 0; m < 12; m++) { var r = getMonthRevenue(m); totals.subRev += r.subRev; totals.ticketRev += r.ticketRev; totals.grossRev += r.grossRev; totals.stripeFees += r.stripeFees; }
    return totals;
  }

  var filteredExpenses = expenses.filter(function(e) {
    if (selectedMonth !== null) { var expMonth = new Date(e.expense_date + 'T00:00:00').getMonth(); if (expMonth !== selectedMonth) return false; }
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterPayment && e.payment_method !== filterPayment) return false;
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      var searchable = [e.vendor || '', e.description || '', e.notes || '', getCategoryLabel(e.category, customCategories)].join(' ').toLowerCase();
      if (searchable.indexOf(q) === -1) return false;
    }
    return true;
  });

  var totalExpenses = filteredExpenses.reduce(function(acc, e) { return acc + e.amount; }, 0);

  var categoryBreakdown = (function() {
    var map = {};
    filteredExpenses.forEach(function(e) { if (!map[e.category]) map[e.category] = { count: 0, total: 0 }; map[e.category].count++; map[e.category].total += e.amount; });
    return Object.keys(map).map(function(k) { return { category: k, label: getCategoryLabel(k, customCategories), group: getCategoryGroup(k, customCategories), count: map[k].count, total: map[k].total }; }).sort(function(a, b) { return b.total - a.total; });
  })();

  var periodRevenue = selectedMonth !== null ? getMonthRevenue(selectedMonth) : getYearRevenue();
  var netRevenue = periodRevenue.grossRev - periodRevenue.stripeFees;
  var netIncome = netRevenue - totalExpenses;
  var periodLabel = selectedMonth !== null ? (MONTHS[selectedMonth] + ' ' + selectedYear) : (selectedYear + ' Full Year');

  var monthlyTableData = Array.from({ length: 12 }).map(function(_, m) {
    var rev = getMonthRevenue(m);
    var monthStr = selectedYear + '-' + (m + 1).toString().padStart(2, '0');
    var monthExp = expenses.filter(function(e) { return e.expense_date && e.expense_date.startsWith(monthStr); });
    var expTotal = monthExp.reduce(function(acc, e) { return acc + e.amount; }, 0);
    return { month: m, rev: rev, expTotal: expTotal, net: rev.grossRev - rev.stripeFees - expTotal, expCount: monthExp.length };
  });

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function exportStandardCSV() {
    var rows = [['Date','Category','Category Group','Vendor','Description','Amount','Payment Method','Notes']];
    filteredExpenses.forEach(function(e) { rows.push([e.expense_date, getCategoryLabel(e.category, customCategories), getCategoryGroup(e.category, customCategories), e.vendor||'', e.description||'', e.amount.toFixed(2), getPaymentLabel(e.payment_method), e.notes||'']); });
    rows.push(['TOTAL','','','','',totalExpenses.toFixed(2),'','']);
    downloadFile(rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n'), 'syndicade_expenses_' + selectedYear + (selectedMonth!==null?'_'+MONTHS_SHORT[selectedMonth]:'') + '.csv', 'text/csv');
  }

  function exportQuickBooksIIF() {
    var lines = ['!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tTOPRINT','!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\tQNTY\tREPRICE\tTAXABLE\tSERVICEDATE\tOTHER2','!ENDTRNS'];
    filteredExpenses.forEach(function(e, idx) {
      var d = new Date(e.expense_date+'T00:00:00');
      var qbDate = (d.getMonth()+1).toString().padStart(2,'0')+'/'+d.getDate().toString().padStart(2,'0')+'/'+d.getFullYear();
      var qbAccount = qbMap[e.category] || 'Miscellaneous';
      var memo = [e.description||'',e.notes||''].filter(Boolean).join(' - ') || e.vendor || qbAccount;
      lines.push('TRNS\t'+(idx+1)+'\tCHECK\t'+qbDate+'\t'+getPaymentLabel(e.payment_method||'credit_card')+'\t'+(e.vendor||'')+'\t-'+e.amount.toFixed(2)+'\t\t'+memo+'\tN\tN');
      lines.push('SPL\t'+(idx+1)+'\tCHECK\t'+qbDate+'\t'+qbAccount+'\t'+(e.vendor||'')+'\t'+e.amount.toFixed(2)+'\t\t'+memo+'\t\t\tN\t\t');
      lines.push('ENDTRNS');
    });
    downloadFile(lines.join('\n'), 'syndicade_quickbooks_' + selectedYear + (selectedMonth!==null?'_'+MONTHS_SHORT[selectedMonth]:'') + '.iif', 'text/plain');
  }

  function exportFullReport() {
    var rows = [['SYNDICADE FINANCIAL REPORT — '+selectedYear+(selectedMonth!==null?' '+MONTHS[selectedMonth]:' Full Year')],['Generated',new Date().toLocaleDateString()],[],['REVENUE SUMMARY'],['Subscription Revenue',formatCurrency(periodRevenue.subRev)],['Ticket Revenue',formatCurrency(periodRevenue.ticketRev)],['Gross Revenue',formatCurrency(periodRevenue.grossRev)],['Est. Stripe Fees',formatCurrency(periodRevenue.stripeFees)],['Net Revenue (after fees)',formatCurrency(netRevenue)],[],['EXPENSE SUMMARY BY CATEGORY'],['Category','Count','Total']];
    categoryBreakdown.forEach(function(cat){rows.push([cat.label,cat.count,formatCurrency(cat.total)]);});
    rows.push(['TOTAL EXPENSES',filteredExpenses.length,formatCurrency(totalExpenses)],[],['NET INCOME','',formatCurrency(netIncome)],[],['EXPENSE LEDGER'],['Date','Category','Vendor','Description','Amount','Payment Method','Notes']);
    filteredExpenses.forEach(function(e){rows.push([e.expense_date,getCategoryLabel(e.category,customCategories),e.vendor||'',e.description||'',formatCurrency(e.amount),getPaymentLabel(e.payment_method),e.notes||'']);});
    downloadFile(rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n'), 'syndicade_full_report_'+selectedYear+(selectedMonth!==null?'_'+MONTHS_SHORT[selectedMonth]:'')+'.csv','text/csv');
  }

  function openExpenseModal(expense) { setEditingExpense(expense || null); setShowModal(true); }
  function closeExpenseModal() { setShowModal(false); setEditingExpense(null); }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <p className="text-[13px] text-[#64748B]">Track all revenue and business expenses. Revenue is estimated from subscription data.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button
              onClick={function() { setShowExportMenu(function(v) { return !v; }); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-[#475569] font-semibold hover:border-blue-300 hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-haspopup="true" aria-expanded={showExportMenu} aria-label="Export options"
            >
              <Download size={14} aria-hidden="true" /> Export <ChevronDown size={12} aria-hidden="true" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {[{label:'Expenses CSV',fn:exportStandardCSV},{label:'QuickBooks IIF',fn:exportQuickBooksIIF},{label:'Full P&L Report',fn:exportFullReport}].map(function(opt) {
                  return (
                    <button key={opt.label} onClick={function() { setShowExportMenu(false); opt.fn(); }} className="w-full text-left px-4 py-3 text-[13px] text-[#475569] hover:bg-slate-50 hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors border-b border-slate-100 last:border-0">
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={function() { setShowQbSettings(true); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-[#475569] font-semibold hover:border-purple-300 hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors" aria-label="QuickBooks account name settings">
            <Tag size={14} aria-hidden="true" /> QB Accounts
          </button>
          <button onClick={function() { openExpenseModal(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-[13px] font-bold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            <Plus size={15} aria-hidden="true" /> Add Expense
          </button>
        </div>
      </div>

      {/* Period controls */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="relative">
          <label htmlFor="fin-year" className="sr-only">Year</label>
          <select id="fin-year" value={selectedYear} onChange={function(e) { setSelectedYear(parseInt(e.target.value)); setSelectedMonth(null); }} className="appearance-none bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={function() { setSelectedMonth(null); }} className={'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (selectedMonth === null ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#0E1523]')} aria-pressed={selectedMonth === null}>All Year</button>
          {MONTHS_SHORT.map(function(m, i) {
            return (
              <button key={i} onClick={function() { setSelectedMonth(i); }} className={'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (selectedMonth === i ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-[#64748B] hover:text-[#0E1523]')} aria-pressed={selectedMonth === i} aria-label={MONTHS[i] + ' ' + selectedYear}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric cards */}
      <section aria-label={'Financial summary for ' + periodLabel} className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map(function(_, i) { return <MetricSkeleton key={i} />; })
          ) : (
            <>
              <MetricCard icon={DollarSign} label="Gross Revenue" value={formatCurrency(periodRevenue.grossRev)} sub={'Subs: ' + formatCurrency(periodRevenue.subRev) + ' · Tickets: ' + formatCurrency(periodRevenue.ticketRev)} cardBg="bg-green-50 border-green-100" iconBg="bg-green-100" iconColor="text-green-600" valueColor="text-green-700" />
              <MetricCard icon={Receipt} label="Est. Stripe Fees" value={formatCurrency(periodRevenue.stripeFees)} sub="2.9% + $0.30 per transaction" cardBg="bg-amber-50 border-amber-100" iconBg="bg-amber-100" iconColor="text-amber-600" valueColor="text-amber-700" />
              <MetricCard icon={TrendingDown} label="Total Expenses" value={formatCurrency(totalExpenses)} sub={filteredExpenses.length + ' transactions · ' + periodLabel} cardBg="bg-red-50 border-red-100" iconBg="bg-red-100" iconColor="text-red-500" valueColor="text-red-600" />
              <MetricCard icon={netIncome >= 0 ? TrendingUp : AlertTriangle} label="Net Income" value={formatCurrency(netIncome)} sub="After fees and expenses" cardBg={netIncome >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'} iconBg={netIncome >= 0 ? 'bg-blue-100' : 'bg-red-100'} iconColor={netIncome >= 0 ? 'text-blue-600' : 'text-red-500'} valueColor={netIncome >= 0 ? 'text-blue-700' : 'text-red-600'} />
            </>
          )}
        </div>
      </section>

      {/* View tabs */}
      <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 mb-6 w-fit" role="tablist" aria-label="Financial view">
        {[{key:'overview',label:'Monthly Overview'},{key:'ledger',label:'Expense Ledger'},{key:'byCategory',label:'By Category'}].map(function(tab) {
          return (
            <button key={tab.key} role="tab" aria-selected={activeView === tab.key} onClick={function() { setActiveView(tab.key); }} className={'px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (activeView === tab.key ? 'bg-white text-[#0E1523] shadow-sm' : 'text-[#64748B] hover:text-[#0E1523]')}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Monthly Overview */}
      {activeView === 'overview' && (
        <section aria-label={'Monthly breakdown for ' + selectedYear}>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {loading ? <TableSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]" role="table" aria-label={'Monthly financial breakdown ' + selectedYear}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Month','Gross Revenue','Stripe Fees','Total Expenses','Transactions','Net Income'].map(function(h) {
                        return <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-[#64748B] px-5 py-3 whitespace-nowrap" scope="col">{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTableData.map(function(row) {
                      var isSelected = selectedMonth === row.month;
                      return (
                        <tr key={row.month} className={'border-b border-slate-100 cursor-pointer transition-colors ' + (isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : row.month % 2 === 1 ? 'bg-slate-50/50 hover:bg-blue-50/40' : 'hover:bg-blue-50/40')} onClick={function() { setSelectedMonth(selectedMonth === row.month ? null : row.month); }} aria-selected={isSelected} role="row">
                          <td className={'px-5 py-3 text-[13px] font-semibold whitespace-nowrap ' + (isSelected ? 'text-blue-600' : 'text-[#0E1523]')}>{MONTHS[row.month]}</td>
                          <td className="px-5 py-3 text-[13px] text-green-600 font-semibold whitespace-nowrap">{formatCurrency(row.rev.grossRev)}</td>
                          <td className="px-5 py-3 text-[13px] text-amber-600 whitespace-nowrap">{formatCurrency(row.rev.stripeFees)}</td>
                          <td className="px-5 py-3 text-[13px] text-red-500 whitespace-nowrap">{formatCurrency(row.expTotal)}</td>
                          <td className="px-5 py-3 text-[13px] text-[#64748B] whitespace-nowrap">{row.expCount}</td>
                          <td className={'px-5 py-3 text-[13px] font-bold whitespace-nowrap ' + (row.net >= 0 ? 'text-blue-600' : 'text-red-500')}>{formatCurrency(row.net)}</td>
                        </tr>
                      );
                    })}
                    {(function() {
                      var tR=monthlyTableData.reduce(function(a,r){return a+r.rev.grossRev;},0);
                      var tF=monthlyTableData.reduce(function(a,r){return a+r.rev.stripeFees;},0);
                      var tE=monthlyTableData.reduce(function(a,r){return a+r.expTotal;},0);
                      var tC=monthlyTableData.reduce(function(a,r){return a+r.expCount;},0);
                      var tN=monthlyTableData.reduce(function(a,r){return a+r.net;},0);
                      return (
                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                          <td className="px-5 py-3 text-[11px] font-bold text-[#F5B731] uppercase tracking-widest whitespace-nowrap">Total {selectedYear}</td>
                          <td className="px-5 py-3 text-[13px] text-green-600 font-bold whitespace-nowrap">{formatCurrency(tR)}</td>
                          <td className="px-5 py-3 text-[13px] text-amber-600 font-bold whitespace-nowrap">{formatCurrency(tF)}</td>
                          <td className="px-5 py-3 text-[13px] text-red-500 font-bold whitespace-nowrap">{formatCurrency(tE)}</td>
                          <td className="px-5 py-3 text-[13px] text-[#64748B] font-bold whitespace-nowrap">{tC}</td>
                          <td className={'px-5 py-3 text-[13px] font-bold whitespace-nowrap ' + (tN >= 0 ? 'text-blue-600' : 'text-red-500')}>{formatCurrency(tN)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-2">Click any row to filter the ledger and category view to that month.</p>
        </section>
      )}

      {/* Expense Ledger */}
      {activeView === 'ledger' && (
        <section aria-label="Expense ledger">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
              <label htmlFor="ledger-search" className="sr-only">Search expenses</label>
              <input id="ledger-search" type="search" placeholder="Search vendor, description, notes..." value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }} className="w-full bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-[#94A3B8]" />
            </div>
            <div className="relative">
              <label htmlFor="ledger-cat" className="sr-only">Filter by category</label>
              <select id="ledger-cat" value={filterCategory} onChange={function(e) { setFilterCategory(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Categories</option>
                {CATEGORY_GROUPS.map(function(group) { return (<optgroup key={group.group} label={group.group}>{group.items.map(function(cat) { return <option key={cat.value} value={cat.value}>{cat.label}</option>; })}</optgroup>); })}
                {customCategories.length > 0 && <optgroup label="Custom">{customCategories.map(function(cat) { return <option key={cat.value} value={cat.value}>{cat.label}</option>; })}</optgroup>}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
            </div>
            <div className="relative">
              <label htmlFor="ledger-payment" className="sr-only">Filter by payment method</label>
              <select id="ledger-payment" value={filterPayment} onChange={function(e) { setFilterPayment(e.target.value); }} className="appearance-none bg-white border border-slate-200 text-[#0E1523] text-[13px] rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Payment Methods</option>
                {PAYMENT_METHODS.map(function(pm) { return <option key={pm.value} value={pm.value}>{pm.label}</option>; })}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
            </div>
            {(filterCategory || filterPayment || searchQuery) && (
              <button onClick={function() { setFilterCategory(''); setFilterPayment(''); setSearchQuery(''); }} className="text-[12px] text-[#64748B] hover:text-[#0E1523] underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Clear filters</button>
            )}
            <span className="text-[12px] text-[#64748B] ml-auto">{filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''} · {formatCurrency(totalExpenses)}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {loading ? <TableSkeleton /> : filteredExpenses.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Receipt size={40} className="text-slate-300 mx-auto mb-4" aria-hidden="true" />
                <p className="text-[#0E1523] font-bold text-[16px] mb-2">No expenses found</p>
                <p className="text-[14px] text-[#64748B] mb-5">{expenses.length === 0 ? 'Add your first expense to start tracking your business costs.' : 'Try adjusting your filters or search term.'}</p>
                {expenses.length === 0 ? (
                  <button onClick={function() { openExpenseModal(null); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-[13px] font-bold rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"><Plus size={15} aria-hidden="true" /> Add First Expense</button>
                ) : (
                  <button onClick={function() { setFilterCategory(''); setFilterPayment(''); setSearchQuery(''); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[#475569] text-[13px] font-semibold rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">Clear filters</button>
                )}
              </div>
            ) : (
              <div role="list" aria-label="Expense transactions">
                <div className="hidden sm:grid grid-cols-[120px_1fr_1fr_130px_100px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
                  {['Date','Category','Vendor / Description','Payment','Amount',''].map(function(h) { return <div key={h} className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{h}</div>; })}
                </div>
                {filteredExpenses.map(function(exp) {
                  return (
                    <div key={exp.id} role="listitem" className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_130px_100px_80px] gap-2 sm:gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="text-[13px] text-[#64748B] whitespace-nowrap">{exp.expense_date}</div>
                      <div>
                        <div className="text-[12px] font-semibold text-[#0E1523]">{getCategoryLabel(exp.category, customCategories)}</div>
                        <div className="text-[11px] text-[#94A3B8]">{getCategoryGroup(exp.category, customCategories)}</div>
                      </div>
                      <div>
                        {exp.vendor && <div className="text-[13px] text-[#0E1523] font-semibold">{exp.vendor}</div>}
                        {exp.description && <div className="text-[12px] text-[#475569]">{exp.description}</div>}
                        {exp.notes && <div className="text-[11px] text-[#94A3B8] mt-0.5 italic">{exp.notes}</div>}
                      </div>
                      <div className="text-[12px] text-[#64748B]">{getPaymentLabel(exp.payment_method)}</div>
                      <div className="text-[14px] text-red-500 font-bold">{formatCurrency(exp.amount)}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={function() { openExpenseModal(exp); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#0E1523] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label={'Edit expense: ' + (exp.vendor || getCategoryLabel(exp.category, customCategories))}>
                          <Edit2 size={13} aria-hidden="true" />
                        </button>
                        <button onClick={function() { setDeletingExpense(exp); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label={'Delete expense: ' + (exp.vendor || getCategoryLabel(exp.category, customCategories))}>
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t-2 border-slate-200">
                  <span className="text-[11px] font-bold text-[#F5B731] uppercase tracking-widest">{filteredExpenses.length} transactions</span>
                  <span className="text-[15px] font-extrabold text-red-500">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* By Category */}
      {activeView === 'byCategory' && (
        <section aria-label="Expenses by category">
          {loading ? <TableSkeleton /> : categoryBreakdown.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl px-6 py-16 text-center">
              <Tag size={40} className="text-slate-300 mx-auto mb-4" aria-hidden="true" />
              <p className="text-[#0E1523] font-bold text-[16px] mb-2">No expenses to categorize</p>
              <p className="text-[14px] text-[#64748B] mb-5">Add expenses to see a breakdown by category.</p>
              <button onClick={function() { openExpenseModal(null); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-[13px] font-bold rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                <Plus size={15} aria-hidden="true" /> Add Expense
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_120px_120px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
                {['Category','Count','Total','% of Spend'].map(function(h) { return <div key={h} className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">{h}</div>; })}
              </div>
              {categoryBreakdown.map(function(cat, i) {
                var pct = totalExpenses > 0 ? (cat.total / totalExpenses * 100) : 0;
                return (
                  <div key={cat.category} className={'grid grid-cols-[1fr_80px_120px_120px] gap-4 items-center px-5 py-3 border-b border-slate-100 last:border-0 ' + (i % 2 === 1 ? 'bg-slate-50/50' : '')}>
                    <div>
                      <div className="text-[13px] text-[#0E1523] font-semibold">{cat.label}</div>
                      <div className="text-[11px] text-[#94A3B8]">{cat.group}</div>
                    </div>
                    <div className="text-[13px] text-[#64748B]">{cat.count}</div>
                    <div className="text-[13px] text-red-500 font-bold">{formatCurrency(cat.total)}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-red-400" style={{ width: pct.toFixed(1) + '%' }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={cat.label + ' percentage of total spend'} />
                      </div>
                      <span className="text-[12px] text-[#64748B] w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
              <div className="grid grid-cols-[1fr_80px_120px_120px] gap-4 px-5 py-3 bg-slate-50 border-t-2 border-slate-200">
                <div className="text-[11px] font-bold text-[#F5B731] uppercase tracking-widest">Total</div>
                <div className="text-[13px] text-[#475569] font-bold">{filteredExpenses.length}</div>
                <div className="text-[13px] text-red-500 font-extrabold">{formatCurrency(totalExpenses)}</div>
                <div />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      {showModal && <ExpenseModal expense={editingExpense} staffUserId={staffUserId} customCategories={customCategories} onClose={closeExpenseModal} onSaved={function() { closeExpenseModal(); loadAll(); }} />}
      {deletingExpense && <DeleteConfirm expense={deletingExpense} customCategories={customCategories} onClose={function() { setDeletingExpense(null); }} onDeleted={function() { setDeletingExpense(null); loadAll(); }} />}
      {showQbSettings && <QbSettingsModal qbMap={qbMap} customCategories={customCategories} onClose={function() { setShowQbSettings(false); }} onSaved={function(updatedMap, updatedCats) { setQbMap(updatedMap); setCustomCategories(updatedCats); setShowQbSettings(false); }} />}
    </div>
  );
}