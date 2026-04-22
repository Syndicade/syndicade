import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import MembershipTiers from '../components/MembershipTiers';
import NonprofitVerificationForm from './NonprofitVerificationForm';
import { getStorageBreakdown, formatBytes, getStorageUsage } from '../lib/storageUtils';

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
  { key: 'create_events',        label: 'Create Events'        },
  { key: 'create_announcements', label: 'Create Announcements' },
  { key: 'create_polls',         label: 'Create Polls'         },
  { key: 'create_surveys',       label: 'Create Surveys'       },
  { key: 'create_signup_forms',  label: 'Create Sign-Up Forms' },
  { key: 'view_members',         label: 'View Members'         },
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

var inputCls = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900';
var labelCls = 'block text-sm font-semibold text-gray-900 mb-2';

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

function KeywordInput({ keywords, onChange, placeholder, ariaLabel }) {
  var [input, setInput] = useState('');
  function add() {
    var v = input.trim().toLowerCase();
    if (!v || keywords.includes(v)) { setInput(''); return; }
    onChange(keywords.concat([v])); setInput('');
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input && keywords.length > 0) onChange(keywords.slice(0, -1));
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]" role="list" aria-label={ariaLabel || 'Tags'}>
        {keywords.map(function(kw) {
          return (
            <span key={kw} role="listitem" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {kw}
              <button type="button" onClick={function(){ onChange(keywords.filter(function(k){ return k !== kw; })); }}
                className="text-blue-500 hover:text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full" aria-label={'Remove ' + kw}>
                <Icon path="M6 18L18 6M6 6l12 12" className="h-3 w-3"/>
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={function(e){ setInput(e.target.value); }} onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type and press Enter'} className={inputCls + ' flex-1'} maxLength={50} aria-label={'Add ' + (ariaLabel || 'tag')}/>
        <button type="button" onClick={add} className="px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">Add</button>
      </div>
      <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add.</p>
    </div>
  );
}

function ChecklistGroup({ options, selected, onChange, legend, max }) {
  function toggle(val) {
    if (!selected.includes(val) && max && selected.length >= max) {
      toast.error('Maximum ' + max + ' categories allowed');
      return;
    }
    onChange(selected.includes(val) ? selected.filter(function(v){ return v !== val; }) : selected.concat([val]));
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
        merged.sort(function(a,b){ var order = { admin:0, editor:1, member:2 }; return (order[a.role]||2) - (order[b.role]||2); });
        setMembers(merged);
      }
    } catch(err) { toast.error('Failed to load members'); } finally { setLoading(false); }
  }

  async function updateSystemRole(membershipId, newRole) {
    setUpdatingMemberId(membershipId);
    try {
      var { error } = await supabase.from('memberships').update({ role: newRole }).eq('id', membershipId);
      if (error) throw error;
      setMembers(function(prev){ return prev.map(function(m){ return m.id===membershipId ? Object.assign({},m,{role:newRole}) : m; }); });
      mascotSuccessToast('Role updated');
    } catch(err) { toast.error('Failed to update role'); } finally { setUpdatingMemberId(null); }
  }

  async function updateCustomRole(membershipId, customRoleId) {
    setUpdatingMemberId(membershipId);
    try {
      var { error } = await supabase.from('memberships').update({ custom_role_id: customRoleId || null }).eq('id', membershipId);
      if (error) throw error;
      var customRole = customRoles.find(function(r){ return r.id===customRoleId; }) || null;
      setMembers(function(prev){ return prev.map(function(m){ return m.id===membershipId ? Object.assign({},m,{custom_role_id:customRoleId,customRole:customRole}) : m; }); });
      mascotSuccessToast('Tag updated');
    } catch(err) { toast.error('Failed to update tag'); } finally { setUpdatingMemberId(null); }
  }

  function openNewRole() { setEditingRole(null); setRoleForm({ name: '', color: '#6B7280', permissions: Object.assign({}, DEFAULT_PERMISSIONS) }); setShowRoleForm(true); }
  function openEditRole(role) { setEditingRole(role); setRoleForm({ name: role.name, color: role.color || '#6B7280', permissions: Object.assign({}, DEFAULT_PERMISSIONS, role.permissions || {}) }); setShowRoleForm(true); }

  async function saveRole() {
    if (!roleForm.name.trim()) { toast.error('Role name is required'); return; }
    setSavingRole(true);
    try {
      if (editingRole) {
        var { error } = await supabase.from('org_roles').update({ name: roleForm.name.trim(), color: roleForm.color, permissions: roleForm.permissions }).eq('id', editingRole.id);
        if (error) throw error;
        mascotSuccessToast('Role updated');
      } else {
        var { error: insErr } = await supabase.from('org_roles').insert({ organization_id: organizationId, name: roleForm.name.trim(), color: roleForm.color, permissions: roleForm.permissions });
        if (insErr) throw insErr;
        mascotSuccessToast('Role created');
      }
      setShowRoleForm(false);
      await fetchAll();
    } catch(err) { toast.error('Failed to save role: '+err.message); } finally { setSavingRole(false); }
  }

  async function deleteRole(roleId) {
    if (!window.confirm('Delete this role? Members assigned to it will lose this tag.')) return;
    try {
      var { error } = await supabase.from('org_roles').delete().eq('id', roleId);
      if (error) throw error;
      mascotSuccessToast('Role deleted');
      await fetchAll();
    } catch(err) { toast.error('Failed to delete role'); }
  }

  function togglePermission(key) {
    setRoleForm(function(prev){ return Object.assign({},prev,{ permissions: Object.assign({},prev.permissions,{ [key]: !prev.permissions[key] }) }); });
  }

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(function(i){ return <Skeleton key={i} className="h-16 w-full"/>; })}</div>;

  return (
    <div className="space-y-8">
      <section aria-labelledby="custom-roles-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 id="custom-roles-heading" className="text-lg font-bold text-gray-900">Custom Role Tags</h3>
            <p className="text-xs text-gray-500 mt-0.5">Create tags like "Women Vets" or "Board Member" to organize and target your members.</p>
          </div>
          <button type="button" onClick={openNewRole} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
            <Icon path="M12 4v16m8-8H4" className="h-4 w-4"/>New Role
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
                    <button type="button" onClick={function(){ openEditRole(role); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" aria-label={'Edit '+role.name}>
                      <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="h-4 w-4"/>
                    </button>
                    <button type="button" onClick={function(){ deleteRole(role.id); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" aria-label={'Delete '+role.name}>
                      <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showRoleForm && (
          <div className="mt-4 p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
            <h4 className="font-bold text-gray-900 text-sm">{editingRole ? 'Edit Role' : 'Create New Role'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role-name" className={labelCls}>Role Name</label>
                <input id="role-name" type="text" value={roleForm.name} onChange={function(e){ setRoleForm(function(p){ return Object.assign({},p,{name:e.target.value}); }); }} placeholder="e.g. Women Veterans, Board Member" className={inputCls} maxLength={50}/>
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
                    <input type="checkbox" checked={roleForm.permissions[pk.key]||false} onChange={function(){ togglePermission(pk.key); }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
                    <span className="text-sm text-gray-700">{pk.label}</span>
                  </label>
                ); })}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={saveRole} disabled={savingRole} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all">
                {savingRole ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
              </button>
              <button type="button" onClick={function(){ setShowRoleForm(false); }} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

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
                <div key={m.id} role="listitem" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                    {m.profile.email && <p className="text-xs text-gray-400 truncate">{m.profile.email}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor={'sys-role-'+m.id} className="sr-only">System role for {name}</label>
                    <select id={'sys-role-'+m.id} value={m.role} disabled={isUpdating} onChange={function(e){ updateSystemRole(m.id, e.target.value); }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50" aria-label={'System role for '+name}>
                      {SYSTEM_ROLES.map(function(r){ return <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>; })}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor={'custom-role-'+m.id} className="sr-only">Custom tag for {name}</label>
                    <select id={'custom-role-'+m.id} value={m.custom_role_id||''} disabled={isUpdating||customRoles.length===0} onChange={function(e){ updateCustomRole(m.id, e.target.value||null); }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50" aria-label={'Custom tag for '+name}>
                      <option value="">No tag</option>
                      {customRoles.map(function(r){ return <option key={r.id} value={r.id}>{r.name}</option>; })}
                    </select>
                    {m.customRole && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: m.customRole.color }} aria-hidden="true">
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

function OrganizationSettings({ organizationId, onUpdate }) {
  var [organization, setOrganization] = useState(null);
  var [loading, setLoading] = useState(true);
  var [saving, setSaving] = useState(false);
  var [activeTab, setActiveTab] = useState('basic');
  var [deleteConfirmText, setDeleteConfirmText] = useState('');
  var [deleting, setDeleting] = useState(false);
  var [connectLoading, setConnectLoading] = useState(false);
  var [connectStatus, setConnectStatus] = useState('not_connected');
  var [storageLimit, setStorageLimit] = useState(null);

  // Storage tab state
  var [storageBreakdown, setStorageBreakdown] = useState(null);
  var [storageLoading, setStorageLoading] = useState(false);
  var [storageSortField, setStorageSortField] = useState('size');
  var [storageSortDir, setStorageSortDir] = useState('desc');
  var [deletingFile, setDeletingFile] = useState(null);

  var [form, setForm] = useState({
    name: '', description: '', type: 'community',
    settings: { allowMemberInvites: true, requireApproval: false },
    join_mode: 'invite_only',
    is_public: false,
    collect_dues: true,
    city: '', county: '', state: '', zip_code: '',
    contact_phone: '', address: '',
    mailing_same: true,
    mailing_address: '', mailing_city: '', mailing_state: '', mailing_zip: '',
    service_categories: [], languages: [], keywords: [],
    discovery_about: '',
    allow_following: true,
    search_tags: [],
    enable_donations: false,
    donation_suggested_amount: '',
    donation_external_link: '',
    donation_title: '',
    donation_description: '',
    manual_payment_instructions: '',
  });

  var tabs = [
    { id: 'basic',        label: 'Basic Information' },
    { id: 'privacy',      label: 'Privacy & Access'  },
    { id: 'roles',        label: 'Roles'             },
    { id: 'membership',   label: 'Membership'        },
    { id: 'discover',     label: 'Discover Orgs'     },
    { id: 'donations',    label: 'Donations'         },
    { id: 'payments',     label: 'Payments'          },
    { id: 'storage',      label: 'Storage'           },
    { id: 'verification', label: 'Verification'      },
    { id: 'danger',       label: 'Danger Zone'       },
  ];

  useEffect(function(){
    fetchOrganization();
    var params = new URLSearchParams(window.location.search);
    if (params.get('connect') === 'success') {
      setActiveTab('payments');
      mascotSuccessToast('Stripe connected!', 'Your account is being verified. This may take a few minutes.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('connect') === 'refresh') {
      setActiveTab('payments');
      toast.error('Stripe setup was not completed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [organizationId]);

  // Load storage breakdown when tab becomes active
  useEffect(function() {
    if (activeTab !== 'storage') return;
    if (storageBreakdown) return; // already loaded
    loadStorageBreakdown();
  }, [activeTab]);

async function loadStorageBreakdown() {
  setStorageLoading(true);
  var breakdown = await getStorageBreakdown(organizationId);
  setStorageBreakdown(breakdown);
  var usage = await getStorageUsage(organizationId);
  if (usage) setStorageLimit(usage.limitBytes);
  setStorageLoading(false);
}

  async function handleDeleteStorageFile(file) {
    if (!window.confirm('Permanently delete "' + file.name + '"? This cannot be undone.')) return;
    setDeletingFile(file.id);
    try {
      if (file.category === 'documents') {
        // Delete from documents table (storage file cleanup handled by existing logic)
        var { error: dbErr } = await supabase.from('documents').delete().eq('id', file.id);
        if (dbErr) throw dbErr;
        // Also remove from storage bucket
        if (file.path) {
          await supabase.storage.from('documents').remove([file.path]);
        }
      } else if (file.category === 'event_fliers') {
        var { error: flierErr } = await supabase.storage.from('event-fliers').remove([file.path]);
        if (flierErr) throw flierErr;
      } else if (file.category === 'newsletters') {
        var { error: nlErr } = await supabase.storage.from('newsletter-images').remove([file.path]);
        if (nlErr) throw nlErr;
      }
      mascotSuccessToast('File deleted.');
      // Refresh breakdown
      setStorageBreakdown(null);
      await loadStorageBreakdown();
    } catch(err) {
      mascotErrorToast('Failed to delete file.', err.message);
    } finally {
      setDeletingFile(null);
    }
  }

  function handleStorageSort(field) {
    if (storageSortField === field) {
      setStorageSortDir(storageSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setStorageSortField(field);
      setStorageSortDir('desc');
    }
  }

  async function fetchOrganization() {
    try {
      var { data, error } = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (error) throw error;
      setOrganization(data);
      setConnectStatus(data.stripe_connect_status || 'not_connected');
      setForm({
        name:                  data.name || '',
        description:           data.description || '',
        type:                  data.type || 'community',
        settings:              Object.assign({ allowMemberInvites: true, requireApproval: false }, data.settings || {}),
        join_mode:             data.join_mode || 'invite_only',
        is_public:             data.is_public || false,
        collect_dues:          data.collect_dues !== false,
        county:                data.county || '',
        city:                  data.city || '',
        state:                 data.state || '',
        zip_code:              data.zip_code || '',
        contact_phone:         data.contact_phone || '',
        address:               data.address || '',
        mailing_same:          true,
        mailing_address:       data.mailing_address || '',
        mailing_city:          data.mailing_city || '',
        mailing_state:         data.mailing_state || '',
        mailing_zip:           data.mailing_zip || '',
        service_categories:    data.service_categories || [],
        languages:             data.languages || [],
        keywords:              data.keywords || [],
        discovery_about:       data.discovery_about || '',
        allow_following:       data.allow_following !== false,
        search_tags:           data.search_tags || [],
        enable_donations:      data.enable_donations || false,
        donation_suggested_amount: data.donation_suggested_amount || '',
        donation_external_link:    data.donation_external_link || '',
        donation_title:            data.donation_title || '',
        donation_description:      data.donation_description || '',
        manual_payment_instructions: data.manual_payment_instructions || '',
      });
    } catch(err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeConnect() {
    setConnectLoading(true);
    try {
      var res = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId }),
      });
      var data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create connect link');
      window.location.href = data.url;
    } catch(err) {
      mascotErrorToast('Failed to start Stripe setup.', err.message);
    } finally {
      setConnectLoading(false);
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
        name:             form.name.trim(),
        description:      form.description.trim(),
        type:             form.type,
        settings:         form.settings,
        join_mode:        form.join_mode,
        is_public:        form.is_public,
        collect_dues:     form.collect_dues,
        city:             form.city.trim(),
        county:           form.county.trim(),
        state:            form.state.trim(),
        zip_code:         form.zip_code.trim(),
        contact_phone:    form.contact_phone.trim(),
        address:          form.address.trim(),
        mailing_address:  form.mailing_same ? form.address.trim() : form.mailing_address.trim(),
        mailing_city:     form.mailing_same ? form.city.trim() : form.mailing_city.trim(),
        mailing_state:    form.mailing_same ? form.state.trim() : form.mailing_state.trim(),
        mailing_zip:      form.mailing_same ? form.zip_code.trim() : form.mailing_zip.trim(),
        service_categories:    form.service_categories,
        languages:             form.languages,
        keywords:              form.keywords,
        discovery_about:       form.discovery_about.trim() || null,
        allow_following:       form.allow_following,
        search_tags:           form.search_tags,
        enable_donations:             form.enable_donations,
        donation_suggested_amount:    form.donation_suggested_amount ? parseFloat(form.donation_suggested_amount) : null,
        donation_external_link:       form.donation_external_link ? form.donation_external_link.trim() : null,
        donation_title:               form.donation_title ? form.donation_title.trim() : null,
        donation_description:         form.donation_description ? form.donation_description.trim() : null,
        manual_payment_instructions:  form.manual_payment_instructions ? form.manual_payment_instructions.trim() : null,
      }).eq('id', organizationId);
      if (error) throw error;
      mascotSuccessToast('Settings saved!', 'Your changes are live.');
      if (onUpdate) onUpdate(form);
    } catch(err) {
      mascotErrorToast('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOrg() {
    if (deleteConfirmText !== 'DELETE') return;
    if (!window.confirm('Are you absolutely sure? This will permanently delete ' + organization.name + ' and all its data.')) return;
    setDeleting(true);
    try {
      var tables = [
        'memberships', 'events', 'announcements', 'chat_channels',
        'documents', 'polls', 'surveys', 'org_programs',
        'org_site_config', 'org_followers', 'signup_forms',
        'org_photos', 'notifications',
      ];
      for (var i = 0; i < tables.length; i++) {
        await supabase.from(tables[i]).delete().eq('organization_id', organizationId);
      }
      var delRes = await supabase.from('organizations').delete().eq('id', organizationId);
      if (delRes.error) throw delRes.error;
      mascotSuccessToast('Organization deleted.');
      window.location.href = '/dashboard';
    } catch(err) {
      mascotErrorToast('Delete failed', err.message);
      setDeleting(false);
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

  // Build sorted all-files list for storage tab
  var allStorageFiles = [];
  if (storageBreakdown) {
    allStorageFiles = allStorageFiles
      .concat(storageBreakdown.documents.files)
      .concat(storageBreakdown.event_fliers.files)
      .concat(storageBreakdown.newsletters.files);
    allStorageFiles.sort(function(a, b) {
      if (storageSortField === 'size') {
        return storageSortDir === 'desc' ? b.size_bytes - a.size_bytes : a.size_bytes - b.size_bytes;
      } else {
        var na = (a.name || '').toLowerCase();
        var nb = (b.name || '').toLowerCase();
        return storageSortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
      }
    });
  }

var storageCategoryLabels = {
  documents:    'Documents',
  event_fliers: 'Event Fliers',
  newsletters:  'Newsletters',
  org_photos:   'Photos',
  org_images:   'Org Images'
};

var storageCategoryColors = {
  documents:    '#3B82F6',
  event_fliers: '#F5B731',
  newsletters:  '#8B5CF6',
  org_photos:   '#22C55E',
  org_images:   '#06B6D4'
};

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">

        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
            <p className="text-gray-500 text-sm mt-0.5">Manage your organization's configuration and preferences.</p>
          </div>
          {publicPageUrl && (
            <a href={publicPageUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all text-sm"
              aria-label="View public page, opens in new tab">
              <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="h-4 w-4"/>
              View Public Page
            </a>
          )}
        </div>

        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Settings tabs" style={{ scrollbarWidth: 'thin' }}>
            {tabs.map(function(tab){
              var active = activeTab === tab.id;
              var isDanger = tab.id === 'danger';
              return (
                <button key={tab.id} type="button" onClick={function(){ setActiveTab(tab.id); }}
                  className={'py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg ' + (
                    isDanger
                      ? (active ? 'border-red-500 text-red-600' : 'border-transparent text-red-400 hover:text-red-600 hover:border-red-300')
                      : (active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
                  )}
                  aria-current={active?'page':undefined}>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-6">

            {publicPageUrl && activeTab !== 'roles' && activeTab !== 'membership' && activeTab !== 'danger' && activeTab !== 'storage' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2 mb-6">
                <Icon path={['M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101','M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1']} className="h-4 w-4 text-blue-500 flex-shrink-0"/>
                <p className="text-sm text-blue-800">
                  Public URL:{' '}
                  <a href={publicPageUrl} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold underline hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    {window.location.origin}{publicPageUrl}
                  </a>
                </p>
              </div>
            )}

            {/* ── BASIC ── */}
            {activeTab === 'basic' && (
              <section aria-labelledby="basic-heading" className="space-y-5">
                <h3 id="basic-heading" className="text-lg font-bold text-gray-900">Basic Information</h3>
                {organization.org_number && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Org Number</span>
                    <span className="text-sm font-semibold text-gray-900">{organization.org_number}</span>
                  </div>
                )}
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
                  <textarea id="org-description" name="description" value={form.description} onChange={handleField} rows={4} maxLength={500} className={inputCls+' resize-none'} aria-describedby="desc-count"/>
                  <p id="desc-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{form.description.length}/500</p>
                </div>
                <div>
                  <label htmlFor="org-phone" className={labelCls}>Phone Number</label>
                  <input id="org-phone" name="contact_phone" type="tel" value={form.contact_phone} onChange={handleField} placeholder="e.g. (419) 555-0100" className={inputCls}/>
                </div>
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
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900">Mailing Address</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.mailing_same} onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{mailing_same:!prev.mailing_same}); }); }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
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

            {/* ── PRIVACY ── */}
            {activeTab === 'privacy' && (
              <section aria-labelledby="privacy-heading" className="space-y-6">
                <h3 id="privacy-heading" className="text-lg font-bold text-gray-900">Privacy & Access</h3>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">How can people join?</p>
                  <div className="space-y-2" role="radiogroup" aria-label="Join mode">
                    {[
                      { value: 'invite_only',     label: 'Invite Only',     desc: 'Only admins can invite new members.' },
                      { value: 'request_to_join', label: 'Request to Join', desc: 'Anyone can request to join. Admins approve or deny requests.' },
                      { value: 'both',            label: 'Both',            desc: 'Admins can invite members, and anyone can also request to join.' },
                    ].map(function(opt){
                      var checked = form.join_mode === opt.value;
                      return (
                        <label key={opt.value} className={'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all '+(checked?'border-blue-500 bg-blue-50':'border-gray-200 bg-white hover:border-gray-300')}>
                          <input type="radio" name="join_mode" value={opt.value} checked={checked} onChange={handleField} className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { id:'allow-invites',    name:'settings.allowMemberInvites', checked:form.settings.allowMemberInvites, label:'Allow Member Invitations', desc:'Let members invite others to join the organization.' },
                    { id:'require-approval', name:'settings.requireApproval',    checked:form.settings.requireApproval,   label:'Require Admin Approval',    desc:'New members must be approved by an admin before joining.' },
                  ].map(function(item){
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <input id={item.id} name={item.name} type="checkbox" checked={item.checked} onChange={handleField} className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"/>
                        <div>
                          <label htmlFor={item.id} className="font-semibold text-gray-900 text-sm">{item.label}</label>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Allow Following</p>
                      <p className="text-xs text-gray-500 mt-0.5">Let people follow your organization from the Discover page and their dashboard.</p>
                    </div>
                    <Toggle checked={form.allow_following} onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{allow_following:!prev.allow_following}); }); }} id="allow-following-toggle" label={form.allow_following ? 'Disable following' : 'Enable following'}/>
                  </div>
                </div>
              </section>
            )}

            {/* ── ROLES ── */}
            {activeTab === 'roles' && <RolesTab organizationId={organizationId}/>}

            {/* ── MEMBERSHIP ── */}
            {activeTab === 'membership' && (
              <section aria-labelledby="membership-heading" className="space-y-6">
                <div>
                  <h3 id="membership-heading" className="text-lg font-bold text-gray-900">Membership Settings</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Configure dues collection, tiers, amounts, and durations.</p>
                </div>
                <div className={'flex items-center justify-between p-5 rounded-xl border-2 '+(form.collect_dues?'border-green-400 bg-green-50':'border-gray-200 bg-gray-50')}>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Collect Dues</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.collect_dues?'Dues tracking is enabled.':'Dues tracking is off.'}</p>
                  </div>
                  <Toggle checked={form.collect_dues} onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{collect_dues:!prev.collect_dues}); }); }} id="collect-dues-toggle" label={form.collect_dues?'Disable dues tracking':'Enable dues tracking'}/>
                </div>
                {form.collect_dues && <MembershipTiers organizationId={organizationId}/>}
              </section>
            )}

            {/* ── DISCOVER ── */}
            {activeTab === 'discover' && (
              <section aria-labelledby="discover-heading" className="space-y-6">
                <div>
                  <h3 id="discover-heading" className="text-lg font-bold text-gray-900">Discover Orgs Page</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Control how your organization appears in public search results.</p>
                </div>
                <div className={'flex items-center justify-between p-5 rounded-xl border-2 '+(form.is_public?'border-green-400 bg-green-50':'border-gray-200 bg-gray-50')}>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">List on Discover Orgs page</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.is_public?'Your organization is visible to the public.':'Your organization is hidden from public discovery.'}</p>
                  </div>
                  <Toggle checked={form.is_public} onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{is_public:!prev.is_public}); }); }} id="discovery-toggle" label={form.is_public?'Remove from Discover Orgs':'List on Discover Orgs'}/>
                </div>
                {form.is_public && (
                  <div className="space-y-8">
                    <div>
                      <label htmlFor="discovery-about" className={labelCls}>Discovery Blurb</label>
                      <p className="text-xs text-gray-500 mb-2">Shown on org cards in the Discover page. Keep it to 1–2 sentences.</p>
                      <textarea id="discovery-about" value={form.discovery_about} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{discovery_about:e.target.value}); }); }} maxLength={280} rows={3} placeholder="e.g. We connect local volunteers with food-insecure families across Lucas County." className={inputCls + ' resize-none'} aria-describedby="discovery-about-count"/>
                      <p id="discovery-about-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{form.discovery_about.length} / 280</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Service Categories <span className="text-xs font-normal text-gray-400">({form.service_categories.length}/6 selected)</span></p>
                      <p className="text-xs text-gray-500 mb-3">Select up to 6 that apply.</p>
                      <ChecklistGroup options={SERVICE_CATEGORIES} selected={form.service_categories} onChange={function(val){ setForm(function(prev){ return Object.assign({},prev,{service_categories:val}); }); }} legend="Service categories" max={6}/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Languages Served</p>
                      <p className="text-xs text-gray-500 mb-3">Which languages does your organization serve?</p>
                      <ChecklistGroup options={LANGUAGES} selected={form.languages} onChange={function(val){ setForm(function(prev){ return Object.assign({},prev,{languages:val}); }); }} legend="Languages served"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Search Tags</p>
                      <p className="text-xs text-gray-500 mb-3">Short tags shown on your card and used for keyword search.</p>
                      <KeywordInput keywords={form.search_tags} onChange={function(val){ setForm(function(prev){ return Object.assign({},prev,{search_tags:val}); }); }} placeholder="e.g. food pantry, after school, veteran support" ariaLabel="Search tags"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Additional Search Keywords</p>
                      <p className="text-xs text-gray-500 mb-3">Used for search matching only — not displayed on your card.</p>
                      <KeywordInput keywords={form.keywords} onChange={function(val){ setForm(function(prev){ return Object.assign({},prev,{keywords:val}); }); }} placeholder="e.g. Toledo, northwest Ohio, nonprofit" ariaLabel="Additional search keywords"/>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── DONATIONS ── */}
            {activeTab === 'donations' && (
              <section aria-labelledby="donations-heading" className="space-y-6">
                <div>
                  <h3 id="donations-heading" className="text-lg font-bold text-gray-900">Donation Settings</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Accept donations on your public page via Stripe or an external link.</p>
                </div>
                <div className={'flex items-center justify-between p-5 rounded-xl border-2 '+(form.enable_donations?'border-green-400 bg-green-50':'border-gray-200 bg-gray-50')}>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Enable Donations</p>
                    <p className="text-xs text-gray-500 mt-0.5">{form.enable_donations?'A donation section is showing on your public page.':'No donation section on your public page.'}</p>
                  </div>
                  <Toggle checked={form.enable_donations} onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{enable_donations:!prev.enable_donations}); }); }} id="enable-donations-toggle" label={form.enable_donations?'Disable donations':'Enable donations'}/>
                </div>
                {form.enable_donations && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="donation-title" className={labelCls}>Donation Section Title</label>
                      <input id="donation-title" type="text" value={form.donation_title} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_title:e.target.value}); }); }} placeholder={'Support '+(form.name||'Us')} className={inputCls} maxLength={100}/>
                    </div>
                    <div>
                      <label htmlFor="donation-description" className={labelCls}>Description</label>
                      <textarea id="donation-description" value={form.donation_description} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_description:e.target.value}); }); }} rows={3} placeholder="Your donation helps us continue our work in the community." className={inputCls+' resize-none'} maxLength={300}/>
                    </div>
                    <div>
                      <label htmlFor="donation-amount" className={labelCls}>Suggested Amount (optional)</label>
                      <div className="relative max-w-xs">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none" aria-hidden="true">$</span>
                        <input id="donation-amount" type="number" min="1" step="1" value={form.donation_suggested_amount} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_suggested_amount:e.target.value}); }); }} placeholder="25" className={inputCls+' pl-7'}/>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="donation-external" className={labelCls}>External Donation Link (optional)</label>
                      <input id="donation-external" type="url" value={form.donation_external_link} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_external_link:e.target.value}); }); }} placeholder="https://paypal.me/yourorg" className={inputCls}/>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── PAYMENTS ── */}
            {activeTab === 'payments' && (
              <section aria-labelledby="payments-heading" className="space-y-6">
                <div>
                  <h3 id="payments-heading" className="text-lg font-bold text-gray-900">Payment Settings</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Connect Stripe to collect dues and ticket payments directly into your bank account.</p>
                </div>
                <div className={'rounded-xl border-2 p-5 ' + (connectStatus === 'active' ? 'border-green-400 bg-green-50' : connectStatus === 'pending' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50')}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ' + (connectStatus === 'active' ? 'bg-green-100' : connectStatus === 'pending' ? 'bg-yellow-100' : 'bg-gray-200')}>
                        {connectStatus === 'active'
                          ? <Icon path="M5 13l4 4L19 7" className={'h-5 w-5 text-green-600'}/>
                          : connectStatus === 'pending'
                          ? <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className={'h-5 w-5 text-yellow-600'}/>
                          : <Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" className={'h-5 w-5 text-gray-500'}/>
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Stripe Connect</p>
                        <p className={'text-xs mt-0.5 ' + (connectStatus === 'active' ? 'text-green-700' : connectStatus === 'pending' ? 'text-yellow-700' : 'text-gray-500')}>
                          {connectStatus === 'active' ? 'Connected — payments go directly to your bank account'
                            : connectStatus === 'pending' ? 'Setup in progress — finish Stripe onboarding to activate'
                            : 'Not connected — connect to accept dues and ticket payments'}
                        </p>
                      </div>
                    </div>
                    {connectStatus !== 'active' && (
                      <button type="button" onClick={handleStripeConnect} disabled={connectLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                        aria-busy={connectLoading}>
                        {connectLoading
                          ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Connecting...</>
                          : <><Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="h-4 w-4"/>{connectStatus === 'pending' ? 'Continue Setup' : 'Connect Stripe'}</>}
                      </button>
                    )}
                  </div>
                  {connectStatus === 'not_connected' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-semibold mb-2">What you get by connecting:</p>
                      <ul className="space-y-1" role="list">
                        {['Dues payments go directly to your bank account','Ticket sales go directly to your bank account','Stripe handles all card processing — you never see card numbers','Payouts within 2 business days'].map(function(item){
                          return (
                            <li key={item} className="flex items-center gap-2 text-xs text-gray-600" role="listitem">
                              <Icon path="M5 13l4 4L19 7" className="h-3.5 w-3.5 text-green-500 flex-shrink-0"/>
                              {item}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="manual-payment" className={labelCls}>Manual Payment Instructions (optional)</label>
                  <p className="text-xs text-gray-500 mb-2">Shown to members on their dues page. Use this for PayPal, Venmo, Zelle, checks, or cash.</p>
                  <textarea id="manual-payment" name="manual_payment_instructions" value={form.manual_payment_instructions} onChange={handleField} rows={4} maxLength={500} placeholder="e.g. Pay via Venmo @YourOrg or mail a check to 123 Main St, Toledo OH 43601." className={inputCls + ' resize-none'} aria-describedby="manual-payment-count"/>
                  <p id="manual-payment-count" className="text-xs text-gray-400 mt-1 text-right" aria-live="polite">{form.manual_payment_instructions.length}/500</p>
                </div>
              </section>
            )}

            {/* ── STORAGE ── */}
            {activeTab === 'storage' && (
              <section aria-labelledby="storage-heading" className="space-y-6">
                <div>
                  <h3 id="storage-heading" className="text-lg font-bold text-gray-900">Storage</h3>
                  <p className="text-gray-500 text-sm mt-0.5">See how your storage is used across documents, photos, newsletters, and more.</p>
                </div>

                {storageLoading ? (
                  <div className="space-y-4" aria-busy="true" aria-label="Loading storage data">
                    <Skeleton className="h-4 w-40 mb-2"/>
                    <Skeleton className="h-4 w-full rounded-full"/>
                    <div className="grid grid-cols-3 gap-4">
                      {[1,2,3].map(function(i){ return <Skeleton key={i} className="h-20 rounded-xl"/>; })}
                    </div>
                    <Skeleton className="h-48 rounded-xl"/>
                  </div>
                ) : !storageBreakdown || storageBreakdown.total_bytes === 0 ? (
                  <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                    <Icon path="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" className="h-10 w-10 text-gray-300 mx-auto mb-3"/>
                    <p className="text-gray-500 font-semibold text-sm">No storage used yet</p>
                    <p className="text-gray-400 text-xs mt-1">Upload documents or event fliers to see your breakdown here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">

<div>
  <div className="flex items-center justify-between mb-2">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage by Category</p>
    <p className="text-sm font-bold text-gray-900">
      {formatBytes(storageBreakdown.total_bytes)}
      {storageLimit ? ' of ' + formatBytes(storageLimit) + ' used' : ' total'}
    </p>
  </div>
  <div className="w-full h-3 rounded-full overflow-hidden bg-gray-100" role="img" aria-label={'Storage used: ' + formatBytes(storageBreakdown.total_bytes) + (storageLimit ? ' of ' + formatBytes(storageLimit) : '')}>
    <div className="flex h-full rounded-full overflow-hidden" style={{ width: storageLimit ? Math.min((storageBreakdown.total_bytes / storageLimit) * 100, 100) + '%' : '100%' }}>
      {['documents','event_fliers','newsletters','org_photos','org_images'].map(function(cat) {
        var bytes = storageBreakdown[cat].total_bytes;
        var pct = storageBreakdown.total_bytes > 0 ? (bytes / storageBreakdown.total_bytes) * 100 : 0;
        if (pct <= 0) return null;
        return (
          <div key={cat} style={{ width: pct + '%', backgroundColor: storageCategoryColors[cat] }} title={storageCategoryLabels[cat] + ': ' + formatBytes(bytes)}/>
        );
      })}
    </div>
  </div>
  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
    {['documents','event_fliers','newsletters','org_photos','org_images'].map(function(cat) {
      return (
        <div key={cat} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: storageCategoryColors[cat] }} aria-hidden="true"/>
          <span className="text-xs text-gray-500">{storageCategoryLabels[cat]}</span>
          <span className="text-xs font-semibold text-gray-800">{formatBytes(storageBreakdown[cat].total_bytes)}</span>
        </div>
      );
    })}
  </div>
</div>

                    {/* Category cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {['documents','event_fliers','newsletters','org_photos','org_images'].map(function(cat) {
                        var count = storageBreakdown[cat].files.length;
                        return (
                          <div key={cat} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: storageCategoryColors[cat] }} aria-hidden="true"/>
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{storageCategoryLabels[cat]}</p>
                            </div>
                            <p className="text-xl font-extrabold text-gray-900">{formatBytes(storageBreakdown[cat].total_bytes)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{count} {count === 1 ? 'file' : 'files'}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* All files table */}
                    {allStorageFiles.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">All Files</p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-sm" role="table" aria-label="All storage files">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th scope="col" className="text-left px-4 py-3">
                                  <button type="button" onClick={function(){ handleStorageSort('name'); }} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Sort by name ' + (storageSortField === 'name' ? (storageSortDir === 'asc' ? 'descending' : 'ascending') : 'ascending')}>
                                    File Name
                                    {storageSortField === 'name' && (
                                      <Icon path={storageSortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} className="h-3 w-3"/>
                                    )}
                                  </button>
                                </th>
                                <th scope="col" className="text-left px-4 py-3 hidden sm:table-cell">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</span>
                                </th>
                                <th scope="col" className="text-right px-4 py-3">
                                  <button type="button" onClick={function(){ handleStorageSort('size'); }} className="flex items-center gap-1 ml-auto text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Sort by size ' + (storageSortField === 'size' ? (storageSortDir === 'asc' ? 'descending' : 'ascending') : 'descending')}>
                                    Size
                                    {storageSortField === 'size' && (
                                      <Icon path={storageSortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} className="h-3 w-3"/>
                                    )}
                                  </button>
                                </th>
                                <th scope="col" className="px-4 py-3 w-12">
                                  <span className="sr-only">Actions</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {allStorageFiles.map(function(file, idx) {
                                var isDeleting = deletingFile === file.id;
                                return (
                                  <tr key={file.id + '-' + idx} className={'border-b border-gray-100 last:border-0 ' + (isDeleting ? 'opacity-50' : 'hover:bg-gray-50')}>
                                    <td className="px-4 py-3">
                                      <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]" title={file.name}>{file.name}</p>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: storageCategoryColors[file.category] }} aria-hidden="true"/>
                                        <span className="text-xs text-gray-500">{storageCategoryLabels[file.category]}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <span className="text-sm text-gray-700 font-medium">{formatBytes(file.size_bytes)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        type="button"
                                        onClick={function(){ handleDeleteStorageFile(file); }}
                                        disabled={isDeleting}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-40"
                                        aria-label={'Delete ' + file.name}
                                      >
                                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4"/>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </section>
            )}

            {/* ── VERIFICATION ── */}
            {activeTab === 'verification' && (
              <section aria-label="Nonprofit verification">
                <NonprofitVerificationForm organizationId={organizationId}/>
              </section>
            )}

            {/* ── DANGER ZONE ── */}
            {activeTab === 'danger' && (
              <section aria-labelledby="danger-heading" className="space-y-6">
                <div>
                  <h3 id="danger-heading" className="text-lg font-bold text-gray-900">Danger Zone</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Irreversible actions. Proceed with caution.</p>
                </div>
                <div className="border-2 border-red-200 rounded-xl p-6 space-y-5">
                  <div>
                    <h4 className="text-base font-bold text-red-700">Delete Organization</h4>
                    <p className="text-sm text-gray-600 mt-1">Permanently deletes <strong>{organization.name}</strong> and all associated data. This cannot be undone.</p>
                  </div>
                  <div role="alert" className="flex items-start gap-3 p-4 rounded-lg" style={{ border: '1px solid #EF4444', backgroundColor: '#FEF2F2' }}>
                    <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5"/>
                    <p className="text-sm text-red-700"><strong>Before deleting this organization, you must disconnect your Stripe account.</strong> Syndicade has no access to your Stripe account and cannot recover funds, payouts, or account data after deletion.</p>
                  </div>
                  <div>
                    <label htmlFor="delete-confirm" className="block text-sm font-semibold text-gray-900 mb-2">
                      Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-700">DELETE</span> to confirm
                    </label>
                    <input id="delete-confirm" type="text" value={deleteConfirmText} onChange={function(e) { setDeleteConfirmText(e.target.value); }} placeholder="DELETE" className="w-full max-w-xs px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white text-gray-900" aria-describedby="delete-confirm-hint"/>
                    <p id="delete-confirm-hint" className="text-xs text-gray-400 mt-1">This action is permanent and cannot be reversed.</p>
                  </div>
                  <button type="button" disabled={deleteConfirmText !== 'DELETE' || deleting} onClick={handleDeleteOrg}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    aria-label="Delete organization permanently">
                    <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4"/>
                    {deleting ? 'Deleting...' : 'Delete Organization'}
                  </button>
                </div>
              </section>
            )}

            {/* Save button */}
            {activeTab !== 'roles' && activeTab !== 'danger' && activeTab !== 'storage' && (
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