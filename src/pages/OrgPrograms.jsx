import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

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
  programs: ['M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'],
  plus:     'M12 4v16m8-8H4',
  pencil:   ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  trash:    ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  x:        'M6 18L18 6M6 6l12 12',
  chevLeft: 'M15 19l-7-7 7-7',
  mail:     ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock:    ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  globe:    ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
};

var EMPTY_FORM = {
  name: '', description: '', audience: '', schedule: '',
  how_to_apply: '', contact_name: '', contact_email: '',
  status: 'active', is_public: true, publish_to_discovery: false,
};

function OrgPrograms() {
  var params = useParams();
  var organizationId = params.organizationId;
  var navigate = useNavigate();
  var { isDark } = useTheme();

  // ── Theme tokens ──────────────────────────────────────────────────────────────
  var pageBg        = isDark ? '#0E1523' : '#F8FAFC';
  var cardBg        = isDark ? '#1A2035' : '#FFFFFF';
  var cardBgAlt     = isDark ? '#151B2D' : '#F1F5F9';
  var elevatedBg    = isDark ? '#1E2845' : '#F1F5F9';
  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var inputBg       = isDark ? '#151B2D'  : '#F8FAFC';

  var [programs, setPrograms] = useState([]);
  var [loading, setLoading] = useState(true);
  var [organization, setOrganization] = useState(null);
  var [effectiveRole, setEffectiveRole] = useState('member');
  var [showModal, setShowModal] = useState(false);
  var [editingProgram, setEditingProgram] = useState(null);
  var [form, setForm] = useState(EMPTY_FORM);
  var [saving, setSaving] = useState(false);

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

      if (memberResult.data) setEffectiveRole(memberResult.data.role);
      await fetchPrograms();
    } catch (err) {
      console.error('OrgPrograms init error:', err);
      toast.error('Failed to load page');
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
    if (result.error) { toast.error('Failed to load programs'); return; }
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
      publish_to_discovery: program.publish_to_discovery === true,
    });
    setShowModal(true);
  }

  async function saveProgram() {
    if (!form.name.trim()) { toast.error('Program name is required'); return; }
    setSaving(true);
    var safeForm = Object.assign({}, form);
    if (!safeForm.is_public) safeForm.publish_to_discovery = false;
    var payload = Object.assign({}, safeForm, { organization_id: organizationId, updated_at: new Date().toISOString() });
    var result = editingProgram
      ? await supabase.from('org_programs').update(payload).eq('id', editingProgram.id)
      : await supabase.from('org_programs').insert(payload);
    setSaving(false);
    if (result.error) { toast.error('Failed to save program'); return; }
    toast.success(editingProgram ? 'Program updated' : 'Program created');
    setShowModal(false);
    fetchPrograms();
  }

  async function deleteProgram(id) {
    if (!window.confirm('Delete this program? This cannot be undone.')) return;
    var result = await supabase.from('org_programs').delete().eq('id', id);
    if (result.error) { toast.error('Failed to delete program'); return; }
    toast.success('Program deleted');
    fetchPrograms();
  }

  async function togglePublic(program) {
    var newIsPublic = !program.is_public;
    var updates = { is_public: newIsPublic };
    if (!newIsPublic) updates.publish_to_discovery = false;
    var result = await supabase.from('org_programs').update(updates).eq('id', program.id);
    if (result.error) { toast.error('Failed to update program'); return; }
    setPrograms(function(prev) {
      return prev.map(function(p) { return p.id === program.id ? Object.assign({}, p, updates) : p; });
    });
  }

  async function toggleDiscovery(program) {
    if (!program.is_public) { toast.error('Enable "Show on org page" first'); return; }
    var newVal = !program.publish_to_discovery;
    var result = await supabase.from('org_programs').update({ publish_to_discovery: newVal }).eq('id', program.id);
    if (result.error) { toast.error('Failed to update program'); return; }
    setPrograms(function(prev) {
      return prev.map(function(p) { return p.id === program.id ? Object.assign({}, p, { publish_to_discovery: newVal }) : p; });
    });
    toast.success(newVal ? 'Program added to Discover' : 'Program removed from Discover');
  }

  function setField(key, value) {
    setForm(function(prev) {
      var update = {};
      update[key] = value;
      if (key === 'is_public' && !value) update.publish_to_discovery = false;
      return Object.assign({}, prev, update);
    });
  }

  var isAdmin = effectiveRole === 'admin';

  // ── Loading skeletons ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: pageBg, padding: '32px 16px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <div style={{ height: '14px', width: '120px', background: borderColor, borderRadius: '4px', marginBottom: '24px' }} className="animate-pulse" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ height: '28px', width: '160px', background: borderColor, borderRadius: '8px' }} className="animate-pulse" />
            <div style={{ height: '36px', width: '120px', background: borderColor, borderRadius: '8px' }} className="animate-pulse" />
          </div>
          {[1, 2, 3].map(function(i) {
            return (
              <div key={i} style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '24px', marginBottom: '12px' }} className="animate-pulse">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '18px', width: '45%', background: borderColor, borderRadius: '4px', marginBottom: '12px' }} />
                    <div style={{ height: '13px', width: '75%', background: elevatedBg, borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ height: '13px', width: '55%', background: elevatedBg, borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                    <div style={{ width: '80px', height: '20px', background: borderColor, borderRadius: '99px' }} />
                    <div style={{ width: '80px', height: '20px', background: borderColor, borderRadius: '99px' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: '32px 16px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>

          {/* Back link */}
          <button
            onClick={function() { navigate('/organizations/' + organizationId); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: textMuted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: '4px 6px', borderRadius: '6px' }}
            className="hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Icon path={ICONS.chevLeft} className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {organization && organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name + ' logo'}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + borderColor, flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1D3461', border: '2px solid #2A3550', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <span style={{ color: '#60A5FA', fontWeight: 800, fontSize: '14px' }}>
                    {organization ? (organization.name || 'O').charAt(0) : 'O'}
                  </span>
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: textPrimary, margin: 0 }}>Programs</h1>
                {organization && (
                  <p style={{ fontSize: '13px', color: textMuted, margin: '2px 0 0' }}>{organization.name}</p>
                )}
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={openNew}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Icon path={ICONS.plus} className="h-4 w-4" />
                Add Program
              </button>
            )}
          </div>

          {/* Empty state */}
          {programs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: cardBg, border: '2px dashed ' + borderColor, borderRadius: '12px' }}>
              <div style={{ color: textMuted, marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <Icon path={ICONS.programs} className="h-14 w-14" strokeWidth={1} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, marginBottom: '8px' }}>No programs yet</h2>
              <p style={{ color: textMuted, fontSize: '13px', maxWidth: '280px', margin: '0 auto 24px' }}>
                {isAdmin
                  ? 'Add your first program to share with your community.'
                  : 'This organization has not added any programs yet.'}
              </p>
              {isAdmin && (
                <button
                  onClick={openNew}
                  style={{ padding: '10px 20px', background: '#3B82F6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Your First Program
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {programs.map(function(program) {
                return (
                  <div
                    key={program.id}
                    style={{ background: program.is_public ? cardBg : cardBgAlt, border: '1px solid ' + borderColor, borderRadius: '12px', padding: '20px 24px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>

                        {/* Title + badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: 0 }}>{program.name}</h2>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px',
                            background: program.status === 'active' ? 'rgba(34,197,94,0.15)' : program.status === 'upcoming' ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)',
                            color: program.status === 'active' ? '#22C55E' : program.status === 'upcoming' ? '#3B82F6' : '#94A3B8',
                          }}>
                            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                          </span>
                          {program.publish_to_discovery && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                              <Icon path={ICONS.globe} className="h-3 w-3" />
                              On Discover
                            </span>
                          )}
                          {isAdmin && !program.is_public && (
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: 'rgba(245,183,49,0.12)', color: '#F5B731' }}>
                              Hidden
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {program.description && (
                          <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.6, marginBottom: '12px' }}>{program.description}</p>
                        )}

                        {/* Meta row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                          {program.audience && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: textMuted }}>
                              <Icon path={ICONS.user} className="h-3.5 w-3.5" />
                              <span>For: {program.audience}</span>
                            </div>
                          )}
                          {program.schedule && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: textMuted }}>
                              <Icon path={ICONS.clock} className="h-3.5 w-3.5" />
                              <span>{program.schedule}</span>
                            </div>
                          )}
                          {program.contact_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: textMuted }}>
                              <Icon path={ICONS.user} className="h-3.5 w-3.5" />
                              <span>Contact: {program.contact_name}</span>
                              {program.contact_email && (
                                <a
                                  href={'mailto:' + program.contact_email}
                                  style={{ color: '#3B82F6', display: 'flex' }}
                                  className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
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
                          <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '4px' }}>How to Apply</p>
                            <p style={{ fontSize: '13px', color: textSecondary }}>{program.how_to_apply}</p>
                          </div>
                        )}
                      </div>

                      {/* Admin controls */}
                      {isAdmin && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, alignItems: 'flex-end' }}>
                          {/* Org page toggle */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: textMuted, whiteSpace: 'nowrap' }}>Org page</span>
                            <button
                              onClick={function() { togglePublic(program); }}
                              style={{
                                position: 'relative', display: 'inline-flex', height: '20px', width: '36px',
                                alignItems: 'center', borderRadius: '99px', border: 'none', cursor: 'pointer',
                                background: program.is_public ? '#3B82F6' : borderColor, transition: 'background 0.2s',
                              }}
                              role="switch"
                              aria-checked={program.is_public}
                              aria-label={'Toggle ' + program.name + ' org page visibility'}
                              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              <span style={{
                                display: 'inline-block', height: '14px', width: '14px', borderRadius: '50%',
                                background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                transform: program.is_public ? 'translateX(19px)' : 'translateX(3px)', transition: 'transform 0.2s',
                              }} />
                            </button>
                          </div>

                          {/* Discover toggle */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', whiteSpace: 'nowrap', color: program.is_public ? textMuted : borderColor }}>Discover</span>
                            <button
                              onClick={function() { toggleDiscovery(program); }}
                              disabled={!program.is_public}
                              style={{
                                position: 'relative', display: 'inline-flex', height: '20px', width: '36px',
                                alignItems: 'center', borderRadius: '99px', border: 'none',
                                cursor: program.is_public ? 'pointer' : 'not-allowed',
                                background: program.publish_to_discovery ? '#8B5CF6' : borderColor,
                                opacity: program.is_public ? 1 : 0.4, transition: 'background 0.2s',
                              }}
                              role="switch"
                              aria-checked={program.publish_to_discovery}
                              aria-label={'Toggle ' + program.name + ' on Discover page'}
                              aria-disabled={!program.is_public}
                              className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                            >
                              <span style={{
                                display: 'inline-block', height: '14px', width: '14px', borderRadius: '50%',
                                background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                transform: program.publish_to_discovery ? 'translateX(19px)' : 'translateX(3px)', transition: 'transform 0.2s',
                              }} />
                            </button>
                          </div>

                          {/* Edit / Delete */}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <button
                              onClick={function() { openEdit(program); }}
                              style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}
                              className="hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              aria-label={'Edit ' + program.name}
                            >
                              <Icon path={ICONS.pencil} className="h-4 w-4" />
                            </button>
                            <button
                              onClick={function() { deleteProgram(program.id); }}
                              style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}
                              className="hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              aria-label={'Delete ' + program.name}
                            >
                              <Icon path={ICONS.trash} className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="program-modal-title"
          onClick={function() { setShowModal(false); }}
        >
          <div
            style={{ background: cardBg, border: '1px solid ' + borderColor, borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', width: '100%', maxWidth: '512px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid ' + borderColor }}>
              <h2 id="program-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: textPrimary, margin: 0 }}>
                {editingProgram ? 'Edit Program' : 'Add Program'}
              </h2>
              <button
                onClick={function() { setShowModal(false); }}
                style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}
                className="hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Close modal"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label htmlFor="prog-name" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>
                  Program Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
                </label>
                <input
                  id="prog-name"
                  type="text"
                  value={form.name}
                  onChange={function(e) { setField('name', e.target.value); }}
                  placeholder="e.g. After School Tutoring"
                  style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                  className="focus:ring-2 focus:ring-blue-500"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="prog-desc" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>Description</label>
                <textarea
                  id="prog-desc"
                  value={form.description}
                  onChange={function(e) { setField('description', e.target.value); }}
                  rows={3}
                  placeholder="What does this program do?"
                  style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="prog-audience" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>Who Is It For?</label>
                <input
                  id="prog-audience"
                  type="text"
                  value={form.audience}
                  onChange={function(e) { setField('audience', e.target.value); }}
                  placeholder="e.g. Youth ages 6-18"
                  style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="prog-schedule" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>Schedule</label>
                <input
                  id="prog-schedule"
                  type="text"
                  value={form.schedule}
                  onChange={function(e) { setField('schedule', e.target.value); }}
                  placeholder="e.g. Every Monday 3-5pm"
                  style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="prog-apply" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>How To Apply / Sign Up</label>
                <textarea
                  id="prog-apply"
                  value={form.how_to_apply}
                  onChange={function(e) { setField('how_to_apply', e.target.value); }}
                  rows={2}
                  placeholder="e.g. Fill out form at front desk or call us"
                  style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="prog-contact-name" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>Contact Name</label>
                  <input
                    id="prog-contact-name"
                    type="text"
                    value={form.contact_name}
                    onChange={function(e) { setField('contact_name', e.target.value); }}
                    placeholder="Jane Smith"
                    style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="prog-contact-email" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>Contact Email</label>
                  <input
                    id="prog-contact-email"
                    type="email"
                    value={form.contact_email}
                    onChange={function(e) { setField('contact_email', e.target.value); }}
                    placeholder="jane@org.org"
                    style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none', boxSizing: 'border-box' }}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="prog-status" style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>Status</label>
                <select
                  id="prog-status"
                  value={form.status}
                  onChange={function(e) { setField('status', e.target.value); }}
                  style={{ width: '100%', padding: '8px 12px', background: inputBg, border: '1px solid ' + borderColor, borderRadius: '8px', fontSize: '14px', color: textPrimary, outline: 'none' }}
                  className="focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Visibility toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Show on org page */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: elevatedBg, borderRadius: '8px', border: '1px solid ' + borderColor }}>
                  <button
                    onClick={function() { setField('is_public', !form.is_public); }}
                    style={{
                      position: 'relative', display: 'inline-flex', height: '22px', width: '40px', flexShrink: 0,
                      alignItems: 'center', borderRadius: '99px', border: 'none', cursor: 'pointer',
                      background: form.is_public ? '#3B82F6' : borderColor, transition: 'background 0.2s',
                    }}
                    role="switch"
                    aria-checked={form.is_public}
                    aria-label="Toggle visibility on org page"
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span style={{
                      display: 'inline-block', height: '16px', width: '16px', borderRadius: '50%',
                      background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      transform: form.is_public ? 'translateX(21px)' : 'translateX(3px)', transition: 'transform 0.2s',
                    }} />
                  </button>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>Show on org page</p>
                    <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>Visitors to your public page will see this program</p>
                  </div>
                </div>

                {/* Show on Discover */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: elevatedBg, borderRadius: '8px', border: '1px solid ' + borderColor, opacity: form.is_public ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                  <button
                    onClick={function() { setField('publish_to_discovery', !form.publish_to_discovery); }}
                    disabled={!form.is_public}
                    style={{
                      position: 'relative', display: 'inline-flex', height: '22px', width: '40px', flexShrink: 0,
                      alignItems: 'center', borderRadius: '99px', border: 'none',
                      cursor: form.is_public ? 'pointer' : 'not-allowed',
                      background: form.publish_to_discovery ? '#8B5CF6' : borderColor, transition: 'background 0.2s',
                    }}
                    role="switch"
                    aria-checked={form.publish_to_discovery}
                    aria-label="Toggle visibility on Discover page"
                    aria-disabled={!form.is_public}
                    className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <span style={{
                      display: 'inline-block', height: '16px', width: '16px', borderRadius: '50%',
                      background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      transform: form.publish_to_discovery ? 'translateX(21px)' : 'translateX(3px)', transition: 'transform 0.2s',
                    }} />
                  </button>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, margin: 0 }}>Show on Discover</p>
                    <p style={{ fontSize: '12px', color: textMuted, margin: '2px 0 0' }}>
                      {form.is_public ? 'Anyone browsing /discover can find this program' : 'Enable "Show on org page" first'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderTop: '1px solid ' + borderColor }}>
              <button
                onClick={function() { setShowModal(false); }}
                style={{ flex: 1, padding: '10px', border: '1px solid ' + borderColor, color: textSecondary, fontSize: '14px', fontWeight: 600, borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
                className="hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveProgram}
                disabled={saving}
                style={{ flex: 1, padding: '10px', background: '#3B82F6', color: '#FFFFFF', fontSize: '14px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                className="hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {saving ? 'Saving...' : (editingProgram ? 'Save Changes' : 'Add Program')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrgPrograms;