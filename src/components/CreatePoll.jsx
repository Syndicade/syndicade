import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
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
  chart:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  plus:    'M12 4v16m8-8H4',
  x:       'M6 18L18 6M6 6l12 12',
  clock:   ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  eye:     ['M15 12a3 3 0 11-6 0 3 3 0 016 0z', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  eyeOff:  ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  shield:  ['M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
  trash:   'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  repeat:  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  list:    'M4 6h16M4 10h16M4 14h16M4 18h7',
};

var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900';
var labelCls = 'block text-sm font-semibold text-[#0E1523] mb-2';

var POLL_TYPES = [
  { value: 'single_choice',   label: 'Single Choice',      description: 'Members pick one option' },
  { value: 'multiple_choice', label: 'Multiple Choice',    description: 'Members pick multiple options' },
  { value: 'yes_no_abstain',  label: 'Yes / No / Abstain', description: 'Simple voting' },
];

var RETENTION_OPTIONS = [
  { value: '',    label: 'Keep forever' },
  { value: '30',  label: '30 days' },
  { value: '90',  label: '90 days' },
  { value: '365', label: '1 year' },
];

var RESULT_VISIBILITY_OPTIONS = [
  { value: 'full',    label: 'Full results',    desc: 'Members see all options with vote counts and percentages' },
  { value: 'summary', label: 'Summary only',    desc: 'Members see total votes and the leading option only' },
  { value: 'none',    label: 'Hidden',          desc: 'Only admins can see results — members see nothing' },
];

var RECURRING_INTERVALS = [
  { value: 'weekly',    label: 'Weekly' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Yearly' },
];

function CreatePoll({ isOpen, onClose, onSuccess, organizationId, organizationName }) {
  var [formData, setFormData] = useState({
    title: '',
    description: '',
    poll_type: 'single_choice',
    visibility: 'all_members',
    allow_anonymous: false,
    show_results_before_close: false,
    allow_vote_changes: true,
    closes_at: '',
    retention_days: '',
    result_visibility: 'full',
    is_recurring: false,
    recurring_interval: 'monthly',
    recurring_ends_at: '',
  });
  var [options, setOptions] = useState(['', '']);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);
  var [orgRoles, setOrgRoles] = useState([]);
  var [rolesLoading, setRolesLoading] = useState(false);

  useEffect(function() {
    if (isOpen && organizationId) loadOrgRoles();
  }, [isOpen, organizationId]);

  async function loadOrgRoles() {
    setRolesLoading(true);
    try {
      var result = await supabase
        .from('membership_tiers').select('id, name')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });
      if (!result.error && result.data) setOrgRoles(result.data);
    } catch (err) { console.error('Error loading roles:', err); }
    finally { setRolesLoading(false); }
  }

  function handleChange(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(function(prev) { return Object.assign({}, prev, { [name]: value }); });
  }

  function handleOptionChange(index, value) {
    var next = options.slice(); next[index] = value; setOptions(next);
  }
  function addOption() { if (options.length < 10) setOptions(options.concat([''])); }
  function removeOption(index) { if (options.length > 2) setOptions(options.filter(function(_, i) { return i !== index; })); }

  function resetForm() {
    setFormData({ title:'', description:'', poll_type:'single_choice', visibility:'all_members', allow_anonymous:false, show_results_before_close:false, allow_vote_changes:true, closes_at:'', retention_days:'', result_visibility:'full', is_recurring:false, recurring_interval:'monthly', recurring_ends_at:'' });
    setOptions(['', '']); setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (formData.title.trim().length < 3) throw new Error('Poll question must be at least 3 characters');
      if (formData.poll_type !== 'yes_no_abstain') {
        if (options.filter(function(o) { return o.trim().length > 0; }).length < 2) throw new Error('Please provide at least 2 options');
      }

      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) throw new Error('You must be logged in');
      var user = authResult.data.user;

      var memberResult = await supabase.from('memberships').select('role')
        .eq('organization_id', organizationId).eq('member_id', user.id).eq('status', 'active').maybeSingle();
      var userRole = memberResult.data ? memberResult.data.role : 'member';
      var approvalStatus = userRole === 'admin' ? 'approved' : 'pending';

      var pollResult = await supabase.from('polls').insert([{
        organization_id: organizationId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        poll_type: formData.poll_type,
        visibility: formData.visibility,
        allow_anonymous: formData.allow_anonymous,
        show_results_before_close: formData.show_results_before_close,
        allow_vote_changes: formData.allow_vote_changes,
        closes_at: formData.closes_at || null,
        retention_days: formData.retention_days ? parseInt(formData.retention_days, 10) : null,
        result_visibility: formData.result_visibility,
        recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
        recurring_ends_at: formData.is_recurring && formData.recurring_ends_at ? formData.recurring_ends_at : null,
        status: 'active',
        is_pinned: false,
        created_by: user.id,
        approval_status: approvalStatus,
      }]).select().single();
      if (pollResult.error) throw pollResult.error;

      var optionsToInsert;
      if (formData.poll_type === 'yes_no_abstain') {
        optionsToInsert = [
          { poll_id: pollResult.data.id, option_text: 'Yes',     display_order: 0 },
          { poll_id: pollResult.data.id, option_text: 'No',      display_order: 1 },
          { poll_id: pollResult.data.id, option_text: 'Abstain', display_order: 2 },
        ];
      } else {
        optionsToInsert = options.filter(function(o) { return o.trim().length > 0; })
          .map(function(o, i) { return { poll_id: pollResult.data.id, option_text: o.trim(), display_order: i }; });
      }
      var optsR = await supabase.from('poll_options').insert(optionsToInsert);
      if (optsR.error) throw optsR.error;

      if (onSuccess) onSuccess(pollResult.data);
      resetForm();
      mascotSuccessToast(approvalStatus === 'pending' ? 'Poll submitted for approval.' : 'Poll created!');
      onClose();
    } catch (err) {
      console.error('Error creating poll:', err);
      mascotErrorToast('Failed to create poll.', err.message);
      setError(err.message);
    } finally { setLoading(false); }
  }

  if (!isOpen) return null;

  var isYesNo = formData.poll_type === 'yes_no_abstain';
  var canSubmit = !loading && formData.title.trim().length >= 3 &&
    (isYesNo || options.filter(function(o) { return o.trim().length > 0; }).length >= 2);

  var visibilityOptions = [{ value: 'all_members', label: 'All Members' }];
  orgRoles.forEach(function(tier) { visibilityOptions.push({ value: 'tier_' + tier.id, label: tier.name }); });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose} onKeyDown={function(e) { if (e.key === 'Escape') onClose(); }}
      role="dialog" aria-modal="true" aria-labelledby="create-poll-title">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col"
        onClick={function(e) { e.stopPropagation(); }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon path={ICONS.chart} className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 id="create-poll-title" className="text-xl font-bold text-[#0E1523]">Create Poll</h2>
              <p className="text-[#64748B] text-sm">{organizationName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0E1523] hover:bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Close dialog">
            <Icon path={ICONS.x} className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
              <p className="text-red-800 font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Question */}
          <div>
            <label htmlFor="poll-title" className={labelCls}>Poll Question <span className="text-red-500" aria-hidden="true">*</span></label>
            <input id="poll-title" name="title" type="text" required aria-required="true"
              value={formData.title} onChange={handleChange}
              placeholder="e.g., What time should we meet?"
              className={inputCls} maxLength={200} />
            <p className="text-xs text-[#94A3B8] mt-1" aria-live="polite">{formData.title.length}/200</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="poll-description" className={labelCls}>Description <span className="text-[#94A3B8] font-normal">(optional)</span></label>
            <textarea id="poll-description" name="description" value={formData.description} onChange={handleChange}
              placeholder="Add context or additional information..." rows={3}
              className={inputCls + ' resize-none'} maxLength={500} />
            <p className="text-xs text-[#94A3B8] mt-1" aria-live="polite">{formData.description.length}/500</p>
          </div>

          {/* Poll Type */}
          <div>
            <p className={labelCls} id="poll-type-label">Poll Type <span className="text-red-500" aria-hidden="true">*</span></p>
            <div className="space-y-2" role="radiogroup" aria-labelledby="poll-type-label">
              {POLL_TYPES.map(function(opt) {
                var checked = formData.poll_type === opt.value;
                return (
                  <label key={opt.value} className={'flex items-center p-3 border-2 rounded-xl cursor-pointer transition-colors ' + (checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}>
                    <input type="radio" name="poll_type" value={opt.value} checked={checked} onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <div className="ml-3">
                      <p className="font-semibold text-[#0E1523] text-sm">{opt.label}</p>
                      <p className="text-xs text-[#64748B]">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Options */}
          {!isYesNo && (
            <div>
              <label className={labelCls}>Poll Options <span className="text-red-500" aria-hidden="true">*</span></label>
              <div className="space-y-2">
                {options.map(function(opt, index) {
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-[#94A3B8] text-xs font-bold w-5 text-right flex-shrink-0">{index + 1}.</span>
                      <input type="text" value={opt} onChange={function(e) { handleOptionChange(index, e.target.value); }}
                        placeholder={'Option ' + (index + 1)} className={inputCls} maxLength={100}
                        aria-label={'Option ' + (index + 1)} />
                      {options.length > 2 && (
                        <button type="button" onClick={function() { removeOption(index); }}
                          className="p-2 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex-shrink-0"
                          aria-label={'Remove option ' + (index + 1)}>
                          <Icon path={ICONS.x} className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {options.length < 10 && (
                <button type="button" onClick={addOption}
                  className="mt-3 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                  <Icon path={ICONS.plus} className="h-4 w-4" />Add Option
                </button>
              )}
            </div>
          )}

          {isYesNo && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">Auto-generated options</p>
              <div className="flex gap-2">
                {['Yes','No','Abstain'].map(function(l) {
                  return <span key={l} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#475569]">{l}</span>;
                })}
              </div>
            </div>
          )}

          {/* Who Can Vote */}
          <div>
            <label htmlFor="poll-visibility" className={labelCls}>Who Can Vote <span className="text-red-500" aria-hidden="true">*</span></label>
            {rolesLoading ? (
              <div className="h-12 bg-slate-100 rounded-lg animate-pulse" aria-hidden="true" />
            ) : (
              <select id="poll-visibility" name="visibility" value={formData.visibility} onChange={handleChange}
                className={inputCls} aria-describedby="visibility-hint">
                {visibilityOptions.map(function(opt) {
                  return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                })}
              </select>
            )}
            <p id="visibility-hint" className="text-xs text-[#94A3B8] mt-1">Roles managed in Organization Settings</p>
          </div>

          {/* Result Visibility */}
          <div>
            <p className={labelCls} id="result-vis-label">
              <span className="flex items-center gap-2">
                <Icon path={ICONS.eye} className="h-4 w-4 text-[#94A3B8]" />
                Result Visibility
              </span>
            </p>
            <div className="space-y-2" role="radiogroup" aria-labelledby="result-vis-label">
              {RESULT_VISIBILITY_OPTIONS.map(function(opt) {
                var checked = formData.result_visibility === opt.value;
                return (
                  <label key={opt.value} className={'flex items-start p-3 border-2 rounded-xl cursor-pointer transition-colors ' + (checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}>
                    <input type="radio" name="result_visibility" value={opt.value} checked={checked} onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="font-semibold text-[#0E1523] text-sm">{opt.label}</p>
                      <p className="text-xs text-[#64748B]">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Poll Settings */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4">Poll Settings</p>
            <div className="space-y-3">
              {[
                { id:'allow-changes', name:'allow_vote_changes',        checked:formData.allow_vote_changes,        icon:ICONS.refresh, color:'text-blue-500',   label:'Allow Vote Changes',    desc:'Members can change their vote before poll closes' },
                { id:'show-results',  name:'show_results_before_close', checked:formData.show_results_before_close, icon:ICONS.eye,     color:'text-green-500',  label:'Show Live Results',     desc:'Display results while poll is active (after voting)' },
                { id:'anon',          name:'allow_anonymous',           checked:formData.allow_anonymous,           icon:ICONS.shield,  color:'text-purple-500', label:'Anonymous Voting',      desc:"Don't show who voted for what" },
              ].map(function(item) {
                return (
                  <label key={item.id} className={'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ' + (item.checked ? 'border-blue-300 bg-white' : 'border-transparent hover:bg-white')}>
                    <input id={item.id} name={item.name} type="checkbox" checked={item.checked} onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon path={item.icon} className={'h-4 w-4 flex-shrink-0 ' + item.color} />
                        <span className="font-semibold text-[#0E1523] text-sm">{item.label}</span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Closing Date */}
          <div>
            <label htmlFor="poll-closing" className={labelCls}>
              <span className="flex items-center gap-2">
                <Icon path={ICONS.clock} className="h-4 w-4 text-[#94A3B8]" />
                Closing Date <span className="text-[#94A3B8] font-normal">(optional)</span>
              </span>
            </label>
            <input id="poll-closing" name="closes_at" type="datetime-local" value={formData.closes_at} onChange={handleChange}
              className={inputCls} />
            <p className="text-xs text-[#94A3B8] mt-1">Poll closes automatically at this time</p>
          </div>

          {/* Recurring */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Icon path={ICONS.repeat} className="h-4 w-4 text-[#94A3B8]" />
                <span className="text-sm font-semibold text-[#0E1523]">Recurring Poll</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle recurring">
                <input type="checkbox" name="is_recurring" checked={formData.is_recurring} onChange={handleChange}
                  className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
              </label>
            </div>
            <p className="text-xs text-[#64748B] mb-3">Automatically create a new copy of this poll on a schedule</p>
            {formData.is_recurring && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="recurring-interval" className="block text-xs font-semibold text-[#475569] mb-1">Repeat every</label>
                    <select id="recurring-interval" name="recurring_interval" value={formData.recurring_interval} onChange={handleChange}
                      className={inputCls}>
                      {RECURRING_INTERVALS.map(function(opt) {
                        return <option key={opt.value} value={opt.value}>{opt.label}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="recurring-ends" className="block text-xs font-semibold text-[#475569] mb-1">
                      Ends on <span className="text-[#94A3B8] font-normal">(optional)</span>
                    </label>
                    <input id="recurring-ends" name="recurring_ends_at" type="date" value={formData.recurring_ends_at} onChange={handleChange}
                      className={inputCls} />
                  </div>
                </div>
                <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  A new poll will be created automatically when the current one closes.
                </p>
              </div>
            )}
          </div>

          {/* Retention */}
          <div>
            <label htmlFor="poll-retention" className={labelCls}>
              <span className="flex items-center gap-2">
                <Icon path={ICONS.trash} className="h-4 w-4 text-[#94A3B8]" />
                Data Retention
              </span>
            </label>
            <select id="poll-retention" name="retention_days" value={formData.retention_days} onChange={handleChange}
              className={inputCls} aria-describedby="retention-hint">
              {RETENTION_OPTIONS.map(function(opt) {
                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
              })}
            </select>
            <p id="retention-hint" className="text-xs text-[#94A3B8] mt-1">Poll and all responses deleted automatically after this period</p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-6 py-3 bg-transparent border border-slate-300 text-[#475569] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all disabled:opacity-50 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 flex items-center gap-2 text-sm">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Creating...</>
            ) : (
              <><Icon path={ICONS.chart} className="h-4 w-4" />Create Poll</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CreatePoll;