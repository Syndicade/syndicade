import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────────────────
var SERVICE_CATEGORIES = [
  'Arts & Culture','Community Advocacy','Education & Tutoring',
  'Food & Nutrition','Health & Wellness','Housing & Shelter',
  'Immigration & Legal Aid','Job Training & Employment',
  'Mental Health Support','Senior Services','Youth Programs',
];

var LANGUAGES = [
  'Arabic','Chinese (Mandarin)','English','French','Haitian Creole',
  'Hindi','Portuguese','Russian','Somali','Spanish','Tagalog','Vietnamese',
];

var ORG_TYPES = [
  { value: 'nonprofit',   label: 'Nonprofit Organization'  },
  { value: 'club',        label: 'Club or Social Group'    },
  { value: 'association', label: 'Professional Association' },
  { value: 'community',   label: 'Community Group'         },
];

var SYSTEM_ROLES = ['admin', 'editor', 'member'];

var PERMISSION_KEYS = [
  { key: 'create_events',       label: 'Create Events'       },
  { key: 'create_announcements',label: 'Create Announcements'},
  { key: 'create_polls',        label: 'Create Polls'        },
  { key: 'create_surveys',      label: 'Create Surveys'      },
  { key: 'create_signup_forms', label: 'Create Sign-Up Forms'},
  { key: 'view_members',        label: 'View Members'        },
];

var DEFAULT_PERMISSIONS = {
  create_events: false, create_announcements: false,
  create_polls: false, create_surveys: false,
  create_signup_forms: false, view_members: true,
};

var ROLE_COLORS = [
  '#6B7280','#3B82F6','#8B5CF6','#10B981',
  '#F59E0B','#EF4444','#EC4899','#06B6D4',
];

var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white';
var labelCls = 'block text-sm font-semibold text-gray-900 mb-2';

// ── Primitives ───────────────────────────────────────────────────────────────
function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d,i){ return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/>; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path}/>}
    </svg>
  );
}

function Toggle({ checked, onChange, id, label }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} onClick={onChange}
      className={'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 '+(checked?'bg-blue-500':'bg-gray-300')}>
      <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all '+(checked?'left-[22px]':'left-0.5')} aria-hidden="true"/>
    </button>
  );
}

function Skeleton({ className }) {
  return <div className={'animate-pulse rounded bg-gray-200 '+(className||'')} aria-hidden="true"/>;
}

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto" aria-busy="true" aria-label="Loading settings">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <Skeleton className="h-7 w-48"/>
        <Skeleton className="h-4 w-72"/>
        <div className="flex gap-2 pt-2">
          {[1,2,3,4].map(function(i){ return <Skeleton key={i} className="h-9 w-24"/>; })}
        </div>
        <div className="space-y-4 pt-4">
          {[1,2,3].map(function(i){ return <div key={i}><Skeleton className="h-4 w-32 mb-2"/><Skeleton className="h-11 w-full"/></div>; })}
        </div>
      </div>
    </div>
  );
}

function KeywordInput({ keywords, onChange }) {
  var [input, setInput] = useState('');
  function add() {
    var v = input.trim().toLowerCase();
    if (!v || keywords.includes(v)) { setInput(''); return; }
    onChange(keywords.concat([v])); setInput('');
  }
  function handleKeyDown(e) {
    if (e.key==='Enter'||e.key===',') { e.preventDefault(); add(); }
    if (e.key==='Backspace'&&!input&&keywords.length>0) onChange(keywords.slice(0,-1));
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]" role="list" aria-label="Keywords">
        {keywords.map(function(kw){ return (
          <span key={kw} role="listitem" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {kw}
            <button type="button" onClick={function(){ onChange(keywords.filter(function(k){ return k!==kw; })); }}
              className="text-blue-500 hover:text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full" aria-label={'Remove '+kw}>
              <Icon path="M6 18L18 6M6 6l12 12" className="h-3 w-3"/>
            </button>
          </span>
        ); })}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={function(e){ setInput(e.target.value); }} onKeyDown={handleKeyDown}
          placeholder="Type a keyword and press Enter" className={inputCls+' flex-1'} maxLength={50} aria-label="Add keyword"/>
        <button type="button" onClick={add} className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">Add</button>
      </div>
      <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add.</p>
    </div>
  );
}

function ChecklistGroup({ options, selected, onChange, legend }) {
  function toggle(val) {
    onChange(selected.includes(val) ? selected.filter(function(v){ return v!==val; }) : selected.concat([val]));
  }
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(function(opt){
          var checked = selected.includes(opt);
          return (
            <label key={opt} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all '+(checked?'border-blue-400 bg-blue-50':'border-gray-200 bg-white hover:border-gray-300')}>
              <input type="checkbox" checked={checked} onChange={function(){ toggle(opt); }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// ── Roles Tab ────────────────────────────────────────────────────────────────
function RolesTab({ organizationId }) {
  var [members, setMembers] = useState([]);
  var [customRoles, setCustomRoles] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showRoleForm, setShowRoleForm] = useState(false);
  var [editingRole, setEditingRole] = useState(null);
  var [roleForm, setRoleForm] = useState({ name: '', color: '#6B7280', permissions: Object.assign({}, DEFAULT_PERMISSIONS) });
  var [savingRole, setSavingRole] = useState(false);
  var [updatingMemberId, setUpdatingMemberId] = useState(null);

  useEffect(function(){ fetchAll(); }, [organizationId]);

  async function fetchAll() {
    setLoading(true);
    try {
      var [membershipsRes, rolesRes] = await Promise.all([
        supabase.from('memberships').select('id, role, status, member_id, custom_role_id').eq('organization_id', organizationId).eq('status', 'active'),
        supabase.from('org_roles').select('*').eq('organization_id', organizationId).order('name'),
      ]);

      var memberships = membershipsRes.data || [];
      var roles = rolesRes.data || [];
      setCustomRoles(roles);

      if (memberships.length > 0) {
        var memberIds = memberships.map(function(m){ return m.member_id; });
        var { data: profiles } = await supabase.from('members').select('user_id, first_name, last_name, email').in('user_id', memberIds);
        var profileMap = {};
        (profiles || []).forEach(function(p){ profileMap[p.user_id] = p; });
        var merged = memberships.map(function(m){
          var p = profileMap[m.member_id] || {};
          var customRole = roles.find(function(r){ return r.id === m.custom_role_id; }) || null;
          return Object.assign({}, m, { profile: p, customRole: customRole });
        });
        merged.sort(function(a,b){
          var order = { admin:0, editor:1, member:2 };
          return (order[a.role]||2) - (order[b.role]||2);
        });
        setMembers(merged);
      }
    } catch(err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  async function updateSystemRole(membershipId, newRole) {
    setUpdatingMemberId(membershipId);
    try {
      var { error } = await supabase.from('memberships').update({ role: newRole }).eq('id', membershipId);
      if (error) throw error;
      setMembers(function(prev){ return prev.map(function(m){ return m.id===membershipId ? Object.assign({},m,{role:newRole}) : m; }); });
      toast.success('Role updated');
    } catch(err) {
      toast.error('Failed to update role');
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function updateCustomRole(membershipId, customRoleId) {
    setUpdatingMemberId(membershipId);
    try {
      var { error } = await supabase.from('memberships').update({ custom_role_id: customRoleId || null }).eq('id', membershipId);
      if (error) throw error;
      var customRole = customRoles.find(function(r){ return r.id===customRoleId; }) || null;
      setMembers(function(prev){ return prev.map(function(m){ return m.id===membershipId ? Object.assign({},m,{custom_role_id:customRoleId,customRole:customRole}) : m; }); });
      toast.success('Tag updated');
    } catch(err) {
      toast.error('Failed to update tag');
    } finally {
      setUpdatingMemberId(null);
    }
  }

  function openNewRole() {
    setEditingRole(null);
    setRoleForm({ name: '', color: '#6B7280', permissions: Object.assign({}, DEFAULT_PERMISSIONS) });
    setShowRoleForm(true);
  }

  function openEditRole(role) {
    setEditingRole(role);
    setRoleForm({ name: role.name, color: role.color || '#6B7280', permissions: Object.assign({}, DEFAULT_PERMISSIONS, role.permissions || {}) });
    setShowRoleForm(true);
  }

  async function saveRole() {
    if (!roleForm.name.trim()) { toast.error('Role name is required'); return; }
    setSavingRole(true);
    try {
      if (editingRole) {
        var { error } = await supabase.from('org_roles').update({ name: roleForm.name.trim(), color: roleForm.color, permissions: roleForm.permissions }).eq('id', editingRole.id);
        if (error) throw error;
        toast.success('Role updated');
      } else {
        var { error: insErr } = await supabase.from('org_roles').insert({ organization_id: organizationId, name: roleForm.name.trim(), color: roleForm.color, permissions: roleForm.permissions });
        if (insErr) throw insErr;
        toast.success('Role created');
      }
      setShowRoleForm(false);
      await fetchAll();
    } catch(err) {
      toast.error('Failed to save role: '+err.message);
    } finally {
      setSavingRole(false);
    }
  }

  async function deleteRole(roleId) {
    if (!window.confirm('Delete this role? Members assigned to it will lose this tag.')) return;
    try {
      var { error } = await supabase.from('org_roles').delete().eq('id', roleId);
      if (error) throw error;
      toast.success('Role deleted');
      await fetchAll();
    } catch(err) {
      toast.error('Failed to delete role');
    }
  }

  function togglePermission(key) {
    setRoleForm(function(prev){ return Object.assign({},prev,{ permissions: Object.assign({},prev.permissions,{ [key]: !prev.permissions[key] }) }); });
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(function(i){ return <Skeleton key={i} className="h-16 w-full"/>; })}
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Custom Roles */}
      <section aria-labelledby="custom-roles-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 id="custom-roles-heading" className="text-lg font-bold text-gray-900">Custom Role Tags</h3>
            <p className="text-xs text-gray-500 mt-0.5">Create tags like "Women Vets" or "Board Member" to organize and target your members.</p>
          </div>
          <button type="button" onClick={openNewRole}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
            <Icon path="M12 4v16m8-8H4" className="h-4 w-4"/>
            New Role
          </button>
        </div>

        {customRoles.length === 0 && !showRoleForm ? (
          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            <Icon path="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
            <p className="text-gray-500 text-sm font-medium">No custom roles yet</p>
            <p className="text-gray-400 text-xs mt-1">Create tags to organize your members and target content.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customRoles.map(function(role){
              var memberCount = members.filter(function(m){ return m.custom_role_id===role.id; }).length;
              return (
                <div key={role.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} aria-hidden="true"/>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{role.name}</p>
                      <p className="text-xs text-gray-400">{memberCount} member{memberCount!==1?'s':''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={function(){ openEditRole(role); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label={'Edit '+role.name}>
                      <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="h-4 w-4"/>
                    </button>
                    <button type="button" onClick={function(){ deleteRole(role.id); }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label={'Delete '+role.name}>
                      <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Role form */}
        {showRoleForm && (
          <div className="mt-4 p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
            <h4 className="font-bold text-gray-900 text-sm">{editingRole ? 'Edit Role' : 'Create New Role'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role-name" className={labelCls}>Role Name</label>
                <input id="role-name" type="text" value={roleForm.name} onChange={function(e){ setRoleForm(function(p){ return Object.assign({},p,{name:e.target.value}); }); }}
                  placeholder="e.g. Women Veterans, Board Member" className={inputCls} maxLength={50}/>
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ROLE_COLORS.map(function(c){ return (
                    <button key={c} type="button" onClick={function(){ setRoleForm(function(p){ return Object.assign({},p,{color:c}); }); }}
                      className={'w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all '+(roleForm.color===c?'border-gray-900 scale-110':'border-transparent')}
                      style={{ backgroundColor: c }} aria-label={'Select color '+c}/>
                  ); })}
                </div>
              </div>
            </div>
            <div>
              <p className={labelCls}>Permissions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERMISSION_KEYS.map(function(pk){ return (
                  <label key={pk.key} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all '+(roleForm.permissions[pk.key]?'border-blue-400 bg-blue-50':'border-gray-200 bg-white hover:border-gray-300')}>
                    <input type="checkbox" checked={roleForm.permissions[pk.key]||false} onChange={function(){ togglePermission(pk.key); }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
                    <span className="text-sm text-gray-700">{pk.label}</span>
                  </label>
                ); })}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={saveRole} disabled={savingRole}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all">
                {savingRole ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
              </button>
              <button type="button" onClick={function(){ setShowRoleForm(false); }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Member List */}
      <section aria-labelledby="members-roles-heading">
        <h3 id="members-roles-heading" className="text-lg font-bold text-gray-900 mb-4">
          Member Roles <span className="text-sm font-normal text-gray-400 ml-1">({members.length})</span>
        </h3>
        {members.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
            <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
            <p className="text-gray-400 text-sm">No active members found</p>
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Member list">
            {members.map(function(m){
              var name = m.profile ? (m.profile.first_name+' '+m.profile.last_name).trim() || m.profile.email : 'Unknown';
              var isUpdating = updatingMemberId === m.id;
              return (
                <div key={m.id} role="listitem"
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl flex-wrap">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                    {m.profile.email && <p className="text-xs text-gray-400 truncate">{m.profile.email}</p>}
                  </div>
                  {/* System role */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor={'sys-role-'+m.id} className="sr-only">System role for {name}</label>
                    <select id={'sys-role-'+m.id} value={m.role} disabled={isUpdating}
                      onChange={function(e){ updateSystemRole(m.id, e.target.value); }}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                      aria-label={'System role for '+name}>
                      {SYSTEM_ROLES.map(function(r){ return (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                      ); })}
                    </select>
                  </div>
                  {/* Custom role tag */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor={'custom-role-'+m.id} className="sr-only">Custom tag for {name}</label>
                    <select id={'custom-role-'+m.id} value={m.custom_role_id||''} disabled={isUpdating||customRoles.length===0}
                      onChange={function(e){ updateCustomRole(m.id, e.target.value||null); }}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                      aria-label={'Custom tag for '+name}>
                      <option value="">No tag</option>
                      {customRoles.map(function(r){ return (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ); })}
                    </select>
                    {m.customRole && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: m.customRole.color }} aria-hidden="true">
                        {m.customRole.name}
                      </span>
                    )}
                  </div>
                  {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 flex-shrink-0" aria-hidden="true"/>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
function OrganizationSettings({ organizationId, onUpdate }) {
  var [organization, setOrganization] = useState(null);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [activeTab, setActiveTab] = useState('basic');

var [form, setForm] = useState({
    name: '', description: '', type: 'community',
    settings: { allowMemberInvites: true, requireApproval: false },
    join_mode: 'invite_only',
    is_public: false,
    city: '', county: '', state: '', zip_code: '',
    contact_phone: '', address: '',
    mailing_same: true,
    mailing_address: '', mailing_city: '', mailing_state: '', mailing_zip: '',
    service_categories: [], languages: [], keywords: [],
  });

  var tabs = [
    { id: 'basic',   label: 'Basic Information' },
    { id: 'privacy', label: 'Privacy & Access'  },
    { id: 'roles',   label: 'Roles'             },
    { id: 'discover',label: 'Discover Orgs'     },
  ];

  useEffect(function(){ fetchOrganization(); }, [organizationId]);

  async function fetchOrganization() {
    try {
      var { data, error } = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (error) throw error;
      setOrganization(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        type: data.type || 'community',
        settings: Object.assign({ allowMemberInvites: true, requireApproval: false }, data.settings || {}),
        join_mode: data.join_mode || 'invite_only',
        is_public: data.is_public || false,
        county: data.county || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        service_categories: data.service_categories || [],
        languages: data.languages || [],
        keywords: data.keywords || [],
      });
    } catch(err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  function handleField(e) {
    var name = e.target.name;
    var value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (name.startsWith('settings.')) {
      var key = name.split('.')[1];
      setForm(function(prev){ return Object.assign({},prev,{ settings: Object.assign({},prev.settings,{[key]:value}) }); });
    } else {
      setForm(function(prev){ var u={}; u[name]=value; return Object.assign({},prev,u); });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Organization name is required'); return; }
    setSaving(true);
    try {
      var { error } = await supabase.from('organizations').update({
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        settings: form.settings,
        join_mode: form.join_mode,
is_public: form.is_public,
        city: form.city.trim(),
        county: form.county.trim(),
        state: form.state.trim(),
        zip_code: form.zip_code.trim(),
        contact_phone: form.contact_phone.trim(),
        address: form.address.trim(),
        mailing_address: form.mailing_same ? form.address.trim() : form.mailing_address.trim(),
        mailing_city: form.mailing_same ? form.city.trim() : form.mailing_city.trim(),
        mailing_state: form.mailing_same ? form.state.trim() : form.mailing_state.trim(),
        mailing_zip: form.mailing_same ? form.zip_code.trim() : form.mailing_zip.trim(),
        service_categories: form.service_categories,
        languages: form.languages,
        keywords: form.keywords,
      }).eq('id', organizationId);
      if (error) throw error;
      toast.success('Settings saved!');
      if (onUpdate) onUpdate(form);
    } catch(err) {
      toast.error('Save failed: '+err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SettingsSkeleton/>;

  if (!organization) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center" role="alert">
        <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="h-10 w-10 text-yellow-400 mx-auto mb-2"/>
        <p className="text-yellow-800 font-semibold">Organization not found</p>
      </div>
    );
  }

  var publicPageUrl = organization.slug ? '/org/'+organization.slug : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">

        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
            <p className="text-gray-500 text-sm mt-0.5">Manage your organization's configuration and preferences.</p>
          </div>
          {publicPageUrl && (
            <a href={publicPageUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all text-sm"
              aria-label={'View public page, opens in new tab'}>
              <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="h-4 w-4"/>
              View Public Page
            </a>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Settings tabs" style={{ scrollbarWidth:'thin' }}>
            {tabs.map(function(tab){
              var active = activeTab === tab.id;
              return (
                <button key={tab.id} type="button" onClick={function(){ setActiveTab(tab.id); }}
                  className={'py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg '+(active?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
                  aria-current={active?'page':undefined}>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-6">

            {/* Public URL banner */}
            {publicPageUrl && activeTab !== 'roles' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2 mb-6">
                <Icon path={['M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101','M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1']} className="h-4 w-4 text-blue-500 flex-shrink-0"/>
                <p className="text-sm text-blue-800">
                  Public URL:{' '}
                  <a href={publicPageUrl} target="_blank" rel="noopener noreferrer"
                    className="font-mono font-semibold underline hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    {window.location.origin}{publicPageUrl}
                  </a>
                </p>
              </div>
            )}

            {/* ── BASIC INFORMATION ── */}
            {activeTab === 'basic' && (
              <section aria-labelledby="basic-heading" className="space-y-5">
                <h3 id="basic-heading" className="text-lg font-bold text-gray-900">Basic Information</h3>
                <div>
                  <label htmlFor="org-name" className={labelCls}>Organization Name <span className="text-red-400" aria-hidden="true">*</span></label>
                  <input id="org-name" name="name" type="text" required aria-required="true" value={form.name} onChange={handleField} maxLength={100} className={inputCls}/>
                </div>
                <div>
                  <label htmlFor="org-type" className={labelCls}>Organization Type</label>
                  <select id="org-type" name="type" value={form.type} onChange={handleField} className={inputCls}>
                    {ORG_TYPES.map(function(t){ return <option key={t.value} value={t.value}>{t.label}</option>; })}
                  </select>
                </div>
<div>
                  <label htmlFor="org-description" className={labelCls}>Description</label>
                  <textarea id="org-description" name="description" value={form.description} onChange={handleField} rows={4} maxLength={500}
                    className={inputCls+' resize-none'} aria-describedby="desc-count"/>
                  <p id="desc-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{form.description.length}/500</p>
                </div>

                {/* Contact */}
                <div>
                  <label htmlFor="org-phone" className={labelCls}>Phone Number</label>
                  <input id="org-phone" name="contact_phone" type="tel" value={form.contact_phone} onChange={handleField} placeholder="e.g. (419) 555-0100" className={inputCls}/>
                </div>

                {/* Physical Address */}
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Physical Address</p>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="org-address" className={labelCls}>Street Address</label>
                      <input id="org-address" name="address" type="text" value={form.address} onChange={handleField} placeholder="e.g. 123 Main St" className={inputCls}/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label htmlFor="org-city" className={labelCls}>City</label>
                        <input id="org-city" name="city" type="text" value={form.city} onChange={handleField} placeholder="e.g. Toledo" className={inputCls}/>
                      </div>
                      <div>
                        <label htmlFor="org-county" className={labelCls}>County</label>
                        <input id="org-county" name="county" type="text" value={form.county} onChange={handleField} placeholder="e.g. Lucas" className={inputCls}/>
                      </div>
                      <div>
                        <label htmlFor="org-state" className={labelCls}>State</label>
                        <input id="org-state" name="state" type="text" value={form.state} onChange={handleField} placeholder="OH" maxLength={2} className={inputCls+' uppercase'}/>
                      </div>
                    </div>
                    <div className="max-w-xs">
                      <label htmlFor="org-zip" className={labelCls}>ZIP Code</label>
                      <input id="org-zip" name="zip_code" type="text" value={form.zip_code} onChange={handleField} placeholder="e.g. 43601" maxLength={10} className={inputCls}/>
                    </div>
                  </div>
                </div>

                {/* Mailing Address */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900">Mailing Address</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.mailing_same}
                        onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{mailing_same:!prev.mailing_same}); }); }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                      <span className="text-sm text-gray-600">Same as physical address</span>
                    </label>
                  </div>
                  {!form.mailing_same && (
                    <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div>
                        <label htmlFor="mailing-address" className={labelCls}>Street Address</label>
                        <input id="mailing-address" name="mailing_address" type="text" value={form.mailing_address} onChange={handleField} placeholder="e.g. PO Box 123" className={inputCls}/>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label htmlFor="mailing-city" className={labelCls}>City</label>
                          <input id="mailing-city" name="mailing_city" type="text" value={form.mailing_city} onChange={handleField} className={inputCls}/>
                        </div>
                        <div>
                          <label htmlFor="mailing-state" className={labelCls}>State</label>
                          <input id="mailing-state" name="mailing_state" type="text" value={form.mailing_state} onChange={handleField} maxLength={2} className={inputCls+' uppercase'}/>
                        </div>
                        <div>
                          <label htmlFor="mailing-zip" className={labelCls}>ZIP Code</label>
                          <input id="mailing-zip" name="mailing_zip" type="text" value={form.mailing_zip} onChange={handleField} maxLength={10} className={inputCls}/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── PRIVACY & ACCESS ── */}
            {activeTab === 'privacy' && (
              <section aria-labelledby="privacy-heading" className="space-y-6">
                <h3 id="privacy-heading" className="text-lg font-bold text-gray-900">Privacy & Access</h3>

                {/* Join mode */}
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">How can people join?</p>
                  <div className="space-y-2" role="radiogroup" aria-label="Join mode">
                    {[
                      { value: 'invite_only',    label: 'Invite Only',          desc: 'Only admins can invite new members.'                                      },
                      { value: 'request_to_join',label: 'Request to Join',      desc: 'Anyone can request to join. Admins approve or deny requests.'             },
                      { value: 'both',           label: 'Both',                 desc: 'Admins can invite members, and anyone can also request to join.'          },
                    ].map(function(opt){
                      var checked = form.join_mode === opt.value;
                      return (
                        <label key={opt.value} className={'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all '+(checked?'border-blue-500 bg-blue-50':'border-gray-200 bg-white hover:border-gray-300')}>
                          <input type="radio" name="join_mode" value={opt.value} checked={checked} onChange={handleField}
                            className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  {[
                    { id:'allow-invites',  name:'settings.allowMemberInvites', checked:form.settings.allowMemberInvites, label:'Allow Member Invitations', desc:'Let members invite others to join the organization.' },
                    { id:'require-approval',name:'settings.requireApproval',   checked:form.settings.requireApproval,   label:'Require Admin Approval',    desc:'New members must be approved by an admin before joining.' },
                  ].map(function(item){
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <input id={item.id} name={item.name} type="checkbox" checked={item.checked} onChange={handleField}
                          className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"/>
                        <div>
                          <label htmlFor={item.id} className="font-semibold text-gray-900 text-sm">{item.label}</label>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── ROLES ── */}
            {activeTab === 'roles' && (
              <RolesTab organizationId={organizationId}/>
            )}

            {/* ── DISCOVER ORGS ── */}
            {activeTab === 'discover' && (
              <section aria-labelledby="discover-heading" className="space-y-6">
                <div>
                  <h3 id="discover-heading" className="text-lg font-bold text-gray-900">Discover Orgs Page</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Control how your organization appears in public search.</p>
                </div>

                {/* Toggle */}
                <div className={'flex items-center justify-between p-5 rounded-xl border-2 '+(form.is_public?'border-green-400 bg-green-50':'border-gray-200 bg-gray-50')}>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">List on Discover Orgs page</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.is_public?'Your organization is visible to the public.':'Your organization is hidden from public discovery.'}</p>
                  </div>
                  <Toggle checked={form.is_public} onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{is_public:!prev.is_public}); }); }}
                    id="discovery-toggle" label={form.is_public?'Remove from Discover Orgs':'List on Discover Orgs'}/>
                </div>

                {form.is_public && (
                  <div className="space-y-6">

                    {/* Service Categories */}
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Service Categories</p>
                      <p className="text-xs text-gray-500 mb-3">Select all that apply.</p>
                      <ChecklistGroup options={SERVICE_CATEGORIES} selected={form.service_categories}
                        onChange={function(val){ setForm(function(prev){ return Object.assign({},prev,{service_categories:val}); }); }}
                        legend="Service categories"/>
                    </div>

                    {/* Languages */}
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Languages Served</p>
                      <p className="text-xs text-gray-500 mb-3">Which languages does your organization serve?</p>
                      <ChecklistGroup options={LANGUAGES} selected={form.languages}
                        onChange={function(val){ setForm(function(prev){ return Object.assign({},prev,{languages:val}); }); }}
                        legend="Languages served"/>
                    </div>

                    {/* Keywords */}
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Search Keywords</p>
                      <p className="text-xs text-gray-500 mb-3">Add words people might search that aren't in categories above (e.g. <span className="font-mono">queer</span>, <span className="font-mono">veterans</span>).</p>
                      <KeywordInput keywords={form.keywords}
                        onChange={function(val){ setForm(function(prev){ return Object.assign({},prev,{keywords:val}); }); }}/>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Save button — not shown on Roles tab */}
            {activeTab !== 'roles' && (
              <div className="flex items-center justify-end pt-6 mt-6 border-t border-gray-200">
                <button type="submit" disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  aria-label={saving?'Saving':'Save changes'} aria-busy={saving}>
                  {saving
                    ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving...</>
                    : <><Icon path="M5 13l4 4L19 7" className="h-4 w-4"/>Save Changes</>}
                </button>
              </div>
            )}

          </div>
        </form>
      </div>
    </div>
  );
}

export default OrganizationSettings;