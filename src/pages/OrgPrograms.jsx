import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Icon({ path, className, strokeWidth }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'h-5 w-5'}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {Array.isArray(path)
        ? path.map(function(d, i) {
            return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />;
          })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
    </svg>
  );
}

var ICONS = {
  programs:  ['M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
  plus:      'M12 4v16m8-8H4',
  pencil:    ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  trash:     ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:         'M6 18L18 6M6 6l12 12',
  chevLeft:  'M15 19l-7-7 7-7',
  mail:      ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  user:      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock:     ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
};

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite" aria-label="Notifications">
      {toasts.map(function(t) {
        return (
          <div
            key={t.id}
            className={'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium min-w-64 max-w-sm ' +
              (t.type === 'error' ? 'bg-red-600' : 'bg-green-600')}
            role="alert"
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={function() { removeToast(t.id); }}
              className="text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <Icon path={ICONS.x} className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

var EMPTY_FORM = {
  name: '', description: '', audience: '', schedule: '',
  how_to_apply: '', contact_name: '', contact_email: '',
  status: 'active', is_public: true,
};

function OrgPrograms() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();

  var [programs, setPrograms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [organization, setOrganization] = useState(null);
  var [effectiveRole, setEffectiveRole] = useState('member');

  var [showModal, setShowModal] = useState(false);
  var [editingProgram, setEditingProgram] = useState(null);
  var [form, setForm] = useState(EMPTY_FORM);
  var [saving, setSaving] = useState(false);

  var [toasts, setToasts] = useState([]);
  function addToast(message, type) {
    var id = Date.now() + Math.random();
    setToasts(function(prev) { return prev.concat([{ id: id, message: message, type: type || 'success' }]); });
    setTimeout(function() { setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }, 4000);
  }
  function removeToast(id) { setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }

  useEffect(function() { init(); }, [organizationId]);

  async function init() {
    try {
      var authResult = await supabase.auth.getUser();
      if (!authResult.data.user) { navigate('/login'); return; }

      var orgResult = await supabase.from('organizations').select('id, name, logo_url').eq('id', organizationId).single();
      if (orgResult.error) throw orgResult.error;
      setOrganization(orgResult.data);

      var memberResult = await supabase
        .from('memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('member_id', authResult.data.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (memberResult.data) {
        setEffectiveRole(memberResult.data.role);
      }

      await fetchPrograms();
    } catch (err) {
      console.error('OrgPrograms init error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrograms() {
    var result = await supabase
      .from('org_programs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order')
      .order('created_at');
    if (result.error) { addToast('Failed to load programs', 'error'); return; }
    setPrograms(result.data || []);
  }

  function openNew() {
    setEditingProgram(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(program) {
    setEditingProgram(program);
    setForm({
      name: program.name || '',
      description: program.description || '',
      audience: program.audience || '',
      schedule: program.schedule || '',
      how_to_apply: program.how_to_apply || '',
      contact_name: program.contact_name || '',
      contact_email: program.contact_email || '',
      status: program.status || 'active',
      is_public: program.is_public !== false,
    });
    setShowModal(true);
  }

  async function saveProgram() {
    if (!form.name.trim()) { addToast('Program name is required', 'error'); return; }
    setSaving(true);
    var payload = Object.assign({}, form, { organization_id: organizationId, updated_at: new Date().toISOString() });
    var result = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);
    setSaving(false);
    if (result.error) { addToast('Failed to save program', 'error'); return; }
    addToast(editingProgram ? 'Program updated' : 'Program created');
    setShowModal(false);
    fetchPrograms();
  }

  async function deleteProgram(id) {
    if (!window.confirm('Delete this program? This cannot be undone.')) return;
    var result = await supabase.from('org_programs').delete().eq('id', id);
    if (result.error) { addToast('Failed to delete program', 'error'); return; }
    addToast('Program deleted');
    fetchPrograms();
  }

  async function togglePublic(program) {
    var result = await supabase.from('org_programs').update({ is_public: !program.is_public }).eq('id', program.id);
    if (result.error) { addToast('Failed to update program', 'error'); return; }
    setPrograms(function(prev) {
      return prev.map(function(p) { return p.id === program.id ? Object.assign({}, p, { is_public: !p.is_public }) : p; });
    });
  }

  function setField(key, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [key]: value }); });
  }

  var isAdmin = effectiveRole === 'admin';

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
          {[1, 2, 3].map(function(i) {
            return <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />;
          })}
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-6">
            <button
              onClick={function() { navigate('/organizations/' + organizationId); }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <Icon path={ICONS.chevLeft} className="h-4 w-4" />
              Back to Dashboard
            </button>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {organization && organization.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.name + ' logo'}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 border border-blue-200" aria-hidden="true">
                    <span className="text-blue-600 font-extrabold text-sm">
                      {organization ? (organization.name || 'O').charAt(0) : 'O'}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
                  {organization && (
                    <p className="text-sm text-gray-500">{organization.name}</p>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={openNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Icon path={ICONS.plus} className="h-4 w-4" />
                  Add Program
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {programs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <Icon path={ICONS.programs} className="h-14 w-14 text-gray-300 mx-auto mb-4" strokeWidth={1} />
              <h2 className="text-lg font-semibold text-gray-700 mb-1">No programs yet</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                {isAdmin
                  ? 'Add your first program to share with your community.'
                  : 'This organization has not added any programs yet.'}
              </p>
              {isAdmin && (
                <button
                  onClick={openNew}
                  className="px-5 py-2 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Your First Program
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {programs.map(function(program) {
                return (
                  <div
                    key={program.id}
                    className={'rounded-xl border bg-white p-6 transition-shadow hover:shadow-sm ' +
                      (program.is_public ? 'border-gray-200' : 'border-gray-100 bg-gray-50')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">

                        {/* Title row */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h2 className="font-bold text-gray-900 text-base">{program.name}</h2>
                          <span className={'text-xs font-semibold px-2.5 py-0.5 rounded-full ' +
                            (program.status === 'active'   ? 'bg-green-100 text-green-700' :
                             program.status === 'upcoming' ? 'bg-blue-100 text-blue-700'  : 'bg-gray-100 text-gray-500')}>
                            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                          </span>
                          {isAdmin && !program.is_public && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                              Hidden from public
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {program.description && (
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{program.description}</p>
                        )}

                        {/* Meta pills */}
                        <div className="flex flex-wrap gap-4">
                          {program.audience && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Icon path={ICONS.user} className="h-3.5 w-3.5 text-gray-400" />
                              <span>For: {program.audience}</span>
                            </div>
                          )}
                          {program.schedule && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Icon path={ICONS.clock} className="h-3.5 w-3.5 text-gray-400" />
                              <span>{program.schedule}</span>
                            </div>
                          )}
                          {program.contact_name && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Icon path={ICONS.user} className="h-3.5 w-3.5 text-gray-400" />
                              <span>Contact: {program.contact_name}</span>
                              {program.contact_email && (
                                <a
                                  href={'mailto:' + program.contact_email}
                                  className="text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                                  aria-label={'Email ' + program.contact_name}
                                >
                                  <Icon path={ICONS.mail} className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* How to apply */}
                        {program.how_to_apply && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">How to Apply</p>
                            <p className="text-sm text-blue-800">{program.how_to_apply}</p>
                          </div>
                        )}
                      </div>

                      {/* Admin controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={function() { togglePublic(program); }}
                            className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ' +
                              (program.is_public ? 'bg-blue-600' : 'bg-gray-200')}
                            role="switch"
                            aria-checked={program.is_public}
                            aria-label={'Toggle ' + program.name + ' public visibility'}
                          >
                            <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
                              (program.is_public ? 'translate-x-6' : 'translate-x-1')} />
                          </button>
                          <button
                            onClick={function() { openEdit(program); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={'Edit ' + program.name}
                          >
                            <Icon path={ICONS.pencil} className="h-4 w-4" />
                          </button>
                          <button
                            onClick={function() { deleteProgram(program.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={'Delete ' + program.name}
                          >
                            <Icon path={ICONS.trash} className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="program-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 id="program-modal-title" className="text-lg font-bold text-gray-900">
                {editingProgram ? 'Edit Program' : 'Add Program'}
              </h2>
              <button
                onClick={function() { setShowModal(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close modal"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="prog-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Program Name <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="prog-name"
                  type="text"
                  value={form.name}
                  onChange={function(e) { setField('name', e.target.value); }}
                  placeholder="e.g. After School Tutoring"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="prog-desc" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  id="prog-desc"
                  value={form.description}
                  onChange={function(e) { setField('description', e.target.value); }}
                  rows={3}
                  placeholder="What does this program do?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label htmlFor="prog-audience" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Who Is It For?</label>
                <input
                  id="prog-audience"
                  type="text"
                  value={form.audience}
                  onChange={function(e) { setField('audience', e.target.value); }}
                  placeholder="e.g. Youth ages 6-18"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="prog-schedule" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Schedule</label>
                <input
                  id="prog-schedule"
                  type="text"
                  value={form.schedule}
                  onChange={function(e) { setField('schedule', e.target.value); }}
                  placeholder="e.g. Every Monday 3-5pm"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="prog-apply" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">How To Apply / Sign Up</label>
                <textarea
                  id="prog-apply"
                  value={form.how_to_apply}
                  onChange={function(e) { setField('how_to_apply', e.target.value); }}
                  rows={2}
                  placeholder="e.g. Fill out form at front desk or call us"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prog-contact-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Contact Name</label>
                  <input
                    id="prog-contact-name"
                    type="text"
                    value={form.contact_name}
                    onChange={function(e) { setField('contact_name', e.target.value); }}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="prog-contact-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Contact Email</label>
                  <input
                    id="prog-contact-email"
                    type="email"
                    value={form.contact_email}
                    onChange={function(e) { setField('contact_email', e.target.value); }}
                    placeholder="jane@org.org"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prog-status" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Status</label>
                <select
                  id="prog-status"
                  value={form.status}
                  onChange={function(e) { setField('status', e.target.value); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={function() { setField('is_public', !form.is_public); }}
                  className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
                    (form.is_public ? 'bg-blue-600' : 'bg-gray-200')}
                  role="switch"
                  aria-checked={form.is_public}
                  aria-label="Toggle public visibility"
                >
                  <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
                    (form.is_public ? 'translate-x-6' : 'translate-x-1')} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Show on public website</p>
                  <p className="text-xs text-gray-400">Visitors to your page will see this program</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={function() { setShowModal(false); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveProgram}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {saving ? 'Saving...' : (editingProgram ? 'Save Changes' : 'Add Program')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default OrgPrograms;