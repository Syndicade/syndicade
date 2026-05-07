import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import MembershipTiers from '../components/MembershipTiers';
import NonprofitVerificationForm from './NonprofitVerificationForm';
import { getStorageBreakdown, formatBytes, getStorageUsage } from '../lib/storageUtils';
import usePlanLimits from '../hooks/usePlanLimits';

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

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d,i){ return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/>; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path}/>}
    </svg>
  );
}

function Skeleton({ className, isDark }) {
  return <div className={'animate-pulse rounded ' + (isDark ? 'bg-[#2A3550]' : 'bg-gray-200') + ' ' + (className||'')} aria-hidden="true"/>;
}

function SettingsSkeleton({ isDark }) {
  return (
    <div className="w-full" aria-busy="true" aria-label="Loading settings">
      <div className={(isDark ? 'bg-[#1A2035] border border-[#2A3550]' : 'bg-white shadow-lg') + ' rounded-lg p-6 space-y-4'}>
        <Skeleton className="h-7 w-48" isDark={isDark}/>
        <Skeleton className="h-4 w-72" isDark={isDark}/>
        <div className="flex gap-2 pt-2">
          {[1,2,3,4].map(function(i){ return <Skeleton key={i} className="h-9 w-24" isDark={isDark}/>; })}
        </div>
        <div className="space-y-4 pt-4">
          {[1,2,3].map(function(i){ return (
            <div key={i}><Skeleton className="h-4 w-32 mb-2" isDark={isDark}/><Skeleton className="h-11 w-full" isDark={isDark}/></div>
          ); })}
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, id, label, isDark }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} onClick={onChange}
      className={'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 ' + (isDark ? 'focus:ring-offset-[#1A2035] ' : '') + (checked ? 'bg-blue-500' : (isDark ? 'bg-[#2A3550]' : 'bg-gray-300'))}>
      <span className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ' + (checked ? 'left-[22px]' : 'left-0.5')} aria-hidden="true"/>
    </button>
  );
}

function KeywordInput({ keywords, onChange, placeholder, ariaLabel }) {
  var { isDark } = useTheme();
  var [input, setInput] = useState('');
  var inputCls = isDark
    ? 'w-full px-4 py-3 border border-[#2A3550] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-[#1E2845] text-white placeholder-[#64748B]'
    : 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900';
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
            <span key={kw} role="listitem" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-900 text-blue-200 text-sm font-medium rounded-full">
              {kw}
              <button type="button" onClick={function(){ onChange(keywords.filter(function(k){ return k !== kw; })); }}
                className="text-blue-400 hover:text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-full" aria-label={'Remove ' + kw}>
                <Icon path="M6 18L18 6M6 6l12 12" className="h-3 w-3"/>
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={function(e){ setInput(e.target.value); }} onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type and press Enter'} className={inputCls + ' flex-1'} maxLength={50} aria-label={'Add ' + (ariaLabel || 'tag')}/>
        <button type="button" onClick={add} className="px-4 py-2 bg-blue-900 text-blue-300 font-semibold rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">Add</button>
      </div>
      <p className={'text-xs mt-1 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>Press Enter or comma to add.</p>
    </div>
  );
}

function ChecklistGroup({ options, selected, onChange, legend, max }) {
  var { isDark } = useTheme();
  function toggle(val) {
    if (!selected.includes(val) && max && selected.length >= max) { toast.error('Maximum ' + max + ' categories allowed'); return; }
    onChange(selected.includes(val) ? selected.filter(function(v){ return v !== val; }) : selected.concat([val]));
  }
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(function(opt){
          var checked = selected.includes(opt);
          return (
            <label key={opt} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ' + (checked ? (isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-400 bg-blue-50') : (isDark ? 'border-[#2A3550] bg-[#1E2845] hover:border-blue-600' : 'border-gray-200 bg-white hover:border-gray-300'))}>
              <input type="checkbox" checked={checked} onChange={function(){ toggle(opt); }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
              <span className={'text-sm ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-700')}>{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PlanLimitBadge({ label, used, limit, isDark }) {
  if (limit === null || limit === undefined) {
    return (
      <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ' + (isDark ? 'bg-green-900/30 text-green-400 border-green-700/40' : 'bg-green-50 text-green-700 border-green-200')}>
        {label}: Unlimited
      </span>
    );
  }
  var atLimit = used >= limit;
  return (
    <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ' + (atLimit ? (isDark ? 'bg-red-900/30 text-red-400 border-red-700/40' : 'bg-red-50 text-red-700 border-red-200') : (isDark ? 'bg-[#1E2845] text-[#94A3B8] border-[#2A3550]' : 'bg-gray-50 text-gray-600 border-gray-200'))}>
      {label}: {used} / {limit}
      {atLimit && <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="h-3 w-3"/>}
    </span>
  );
}

function RolesTab({ organizationId, adminLimit, editorLimit, planName }) {
  var { isDark } = useTheme();
  var [members, setMembers] = useState([]);
  var [customRoles, setCustomRoles] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showRoleForm, setShowRoleForm] = useState(false);
  var [editingRole, setEditingRole] = useState(null);
  var [roleForm, setRoleForm] = useState({ name: '', color: '#6B7280', permissions: Object.assign({}, DEFAULT_PERMISSIONS) });
  var [savingRole, setSavingRole] = useState(false);
  var [updatingMemberId, setUpdatingMemberId] = useState(null);

  var inputCls = isDark
    ? 'w-full px-4 py-3 border border-[#2A3550] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-[#1E2845] text-white placeholder-[#64748B]'
    : 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900';
  var labelCls = 'block text-sm font-semibold mb-2 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900');
  var rowCls = isDark ? 'bg-[#1E2845] border-[#2A3550]' : 'bg-white border-gray-200';
  var selectCls = isDark
    ? 'text-sm border border-[#2A3550] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1E2845] text-[#CBD5E1] disabled:opacity-50'
    : 'text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50';

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
    var current = members.find(function(m){ return m.id === membershipId; });
    if (!current || current.role === newRole) return;
    if (newRole === 'admin') {
      var curAdmins = members.filter(function(m){ return m.role === 'admin' && m.id !== membershipId; }).length;
      if (adminLimit !== null && adminLimit !== undefined && curAdmins >= adminLimit) {
        var pl = planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : 'Your plan';
        toast.error(pl + ' allows ' + adminLimit + ' admin' + (adminLimit !== 1 ? 's' : '') + '. Upgrade to add more.');
        return;
      }
    }
    if (newRole === 'editor') {
      var curEditors = members.filter(function(m){ return m.role === 'editor' && m.id !== membershipId; }).length;
      if (editorLimit !== null && editorLimit !== undefined && curEditors >= editorLimit) {
        var pl2 = planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : 'Your plan';
        toast.error(pl2 + ' allows ' + editorLimit + ' editor' + (editorLimit !== 1 ? 's' : '') + '. Upgrade to add more.');
        return;
      }
    }
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
      setShowRoleForm(false); await fetchAll();
    } catch(err) { toast.error('Failed to save role: '+err.message); } finally { setSavingRole(false); }
  }

  async function deleteRole(roleId) {
    if (!window.confirm('Delete this role? Members assigned to it will lose this tag.')) return;
    try {
      var { error } = await supabase.from('org_roles').delete().eq('id', roleId);
      if (error) throw error;
      mascotSuccessToast('Role deleted'); await fetchAll();
    } catch(err) { toast.error('Failed to delete role'); }
  }

  function togglePermission(key) {
    setRoleForm(function(prev){ return Object.assign({},prev,{ permissions: Object.assign({},prev.permissions,{ [key]: !prev.permissions[key] }) }); });
  }

  if (loading) return <div className="space-y-3">{[1,2,3,4].map(function(i){ return <Skeleton key={i} className="h-16 w-full" isDark={isDark}/>; })}</div>;

  var adminCount  = members.filter(function(m){ return m.role === 'admin'; }).length;
  var editorCount = members.filter(function(m){ return m.role === 'editor'; }).length;
  var atAdminLimit  = adminLimit !== null && adminLimit !== undefined && adminCount >= adminLimit;
  var atEditorLimit = editorLimit !== null && editorLimit !== undefined && editorCount >= editorLimit;

  return (
    <div className="space-y-8">

      {/* Plan limits banner */}
      <div className={'flex items-center gap-3 p-4 rounded-xl border flex-wrap ' + (isDark ? 'bg-[#1E2845] border-[#2A3550]' : 'bg-gray-50 border-gray-200')} role="region" aria-label="Plan role limits">
        <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" className={'h-4 w-4 flex-shrink-0 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}/>
        <p className={'text-xs font-semibold flex-shrink-0 ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>
          {planName ? planName.charAt(0).toUpperCase() + planName.slice(1) + ' plan limits:' : 'Plan limits:'}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <PlanLimitBadge label="Admins"  used={adminCount}  limit={adminLimit}  isDark={isDark}/>
          <PlanLimitBadge label="Editors" used={editorCount} limit={editorLimit} isDark={isDark}/>
        </div>
        {(atAdminLimit || atEditorLimit) && (
          <a href="/billing" className={'ml-auto text-xs font-semibold underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded flex-shrink-0 ' + (isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700')}>
            Upgrade plan
          </a>
        )}
      </div>

      {/* Custom Role Tags */}
      <section aria-labelledby="custom-roles-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 id="custom-roles-heading" className={'text-lg font-bold ' + (isDark ? 'text-white' : 'text-gray-900')}>Custom Role Tags</h3>
            <p className={'text-xs mt-0.5 ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>Create tags like "Women Vets" or "Board Member" to organize and target your members.</p>
          </div>
          <button type="button" onClick={openNewRole} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
            <Icon path="M12 4v16m8-8H4" className="h-4 w-4"/>New Role
          </button>
        </div>

        {customRoles.length === 0 && !showRoleForm ? (
          <div className={'text-center py-8 border border-dashed rounded-xl ' + (isDark ? 'bg-[#1E2845] border-[#2A3550]' : 'bg-gray-50 border-gray-300')}>
            <Icon path="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" className={'h-10 w-10 mx-auto mb-2 ' + (isDark ? 'text-[#2A3550]' : 'text-gray-300')}/>
            <p className={'text-sm font-medium ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>No custom roles yet</p>
            <p className={'text-xs mt-1 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>Create tags to organize your members and target content.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customRoles.map(function(role){
              var memberCount = members.filter(function(m){ return m.custom_role_id===role.id; }).length;
              return (
                <div key={role.id} className={'flex items-center justify-between p-4 border rounded-xl ' + rowCls}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} aria-hidden="true"/>
                    <div>
                      <p className={'font-semibold text-sm ' + (isDark ? 'text-white' : 'text-gray-900')}>{role.name}</p>
                      <p className={'text-xs ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>{memberCount} member{memberCount!==1?'s':''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={function(){ openEditRole(role); }} className={'p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ' + (isDark ? 'text-[#64748B] hover:text-blue-400 hover:bg-blue-900/30' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50')} aria-label={'Edit '+role.name}>
                      <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="h-4 w-4"/>
                    </button>
                    <button type="button" onClick={function(){ deleteRole(role.id); }} className={'p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ' + (isDark ? 'text-[#64748B] hover:text-red-400 hover:bg-red-900/30' : 'text-gray-400 hover:text-red-600 hover:bg-red-50')} aria-label={'Delete '+role.name}>
                      <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="h-4 w-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showRoleForm && (
          <div className={'mt-4 p-5 border rounded-xl space-y-4 ' + (isDark ? 'bg-[#0E1523] border-[#2A3550]' : 'bg-gray-50 border-gray-200')}>
            <h4 className={'font-bold text-sm ' + (isDark ? 'text-white' : 'text-gray-900')}>{editingRole ? 'Edit Role' : 'Create New Role'}</h4>
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
                      className={'w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all ' + (roleForm.color===c ? 'border-white scale-110' : 'border-transparent')}
                      style={{ backgroundColor: c }} aria-label={'Select color '+c}/>
                  ); })}
                </div>
              </div>
            </div>
            <div>
              <p className={labelCls}>Permissions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERMISSION_KEYS.map(function(pk){ return (
                  <label key={pk.key} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ' + (roleForm.permissions[pk.key] ? (isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-400 bg-blue-50') : (isDark ? 'border-[#2A3550] bg-[#1E2845] hover:border-blue-500' : 'border-gray-200 bg-white hover:border-gray-300'))}>
                    <input type="checkbox" checked={roleForm.permissions[pk.key]||false} onChange={function(){ togglePermission(pk.key); }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
                    <span className={'text-sm ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-700')}>{pk.label}</span>
                  </label>
                ); })}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={saveRole} disabled={savingRole} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all">
                {savingRole ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
              </button>
              <button type="button" onClick={function(){ setShowRoleForm(false); }} className={'px-4 py-2 border text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ' + (isDark ? 'bg-[#1E2845] border-[#2A3550] text-[#CBD5E1] hover:bg-[#2A3550]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Member Roles */}
      <section aria-labelledby="members-roles-heading">
        <h3 id="members-roles-heading" className={'text-lg font-bold mb-4 ' + (isDark ? 'text-white' : 'text-gray-900')}>
          Member Roles <span className={'text-sm font-normal ml-1 ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>({members.length})</span>
        </h3>

        {(atAdminLimit || atEditorLimit) && (
          <div className="flex items-start gap-3 p-4 mb-4 rounded-lg border border-amber-700/40 bg-amber-900/20" role="alert">
            <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {atAdminLimit && atEditorLimit ? 'Admin and editor limits reached' : atAdminLimit ? 'Admin limit reached' : 'Editor limit reached'}
              </p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                {'You\'ve reached the limit for your ' + (planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : 'current') + ' plan. '}
                <a href="/billing" className="font-semibold underline hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded">Upgrade your plan</a>
                {' to add more.'}
              </p>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className={'text-center py-8 rounded-xl border ' + (isDark ? 'bg-[#1E2845] border-[#2A3550]' : 'bg-gray-50 border-gray-200')}>
            <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" className={'h-10 w-10 mx-auto mb-2 ' + (isDark ? 'text-[#2A3550]' : 'text-gray-300')}/>
            <p className={'text-sm ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>No active members found</p>
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Member list">
            {members.map(function(m){
              var p = m.profile || {};
              var name = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || p.email || 'Unknown';
              var isUpdating = updatingMemberId === m.id;
              var wouldHitAdminLimit  = adminLimit  !== null && adminLimit  !== undefined && m.role !== 'admin'  && members.filter(function(x){ return x.role==='admin'  && x.id!==m.id; }).length >= adminLimit;
              var wouldHitEditorLimit = editorLimit !== null && editorLimit !== undefined && m.role !== 'editor' && members.filter(function(x){ return x.role==='editor' && x.id!==m.id; }).length >= editorLimit;
              return (
                <div key={m.id} role="listitem" className={'flex items-center gap-4 p-4 border rounded-xl flex-wrap ' + rowCls}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={'font-semibold text-sm truncate ' + (isDark ? 'text-white' : 'text-gray-900')}>{name}</p>
                    {p.email && <p className={'text-xs truncate ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')}>{p.email}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor={'sys-role-'+m.id} className="sr-only">System role for {name}</label>
                    <select id={'sys-role-'+m.id} value={m.role} disabled={isUpdating} onChange={function(e){ updateSystemRole(m.id, e.target.value); }} className={selectCls} aria-label={'System role for '+name}>
                      {SYSTEM_ROLES.map(function(r){
                        var blocked = (r==='admin' && wouldHitAdminLimit) || (r==='editor' && wouldHitEditorLimit);
                        return <option key={r} value={r} disabled={blocked}>{r.charAt(0).toUpperCase()+r.slice(1)}{blocked ? ' (plan limit)' : ''}</option>;
                      })}
                    </select>
                    {(wouldHitAdminLimit || wouldHitEditorLimit) && (
                      <span title="Some roles are at plan capacity" aria-label="Some roles are at plan capacity">
                        <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="h-4 w-4 text-amber-400 flex-shrink-0"/>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label htmlFor={'custom-role-'+m.id} className="sr-only">Custom tag for {name}</label>
                    <select id={'custom-role-'+m.id} value={m.custom_role_id||''} disabled={isUpdating||customRoles.length===0} onChange={function(e){ updateCustomRole(m.id, e.target.value||null); }} className={selectCls} aria-label={'Custom tag for '+name}>
                      <option value="">No tag</option>
                      {customRoles.map(function(r){ return <option key={r.id} value={r.id}>{r.name}</option>; })}
                    </select>
                    {m.customRole && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: m.customRole.color }} aria-hidden="true">{m.customRole.name}</span>
                    )}
                  </div>
                  {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 flex-shrink-0" aria-hidden="true"/>}
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
  var { isDark } = useTheme();
  var [organization, setOrganization] = useState(null);
  var [loading, setLoading] = useState(true);
  var [isAdmin, setIsAdmin] = useState(null);
  var [saving, setSaving] = useState(false);
  var [activeTab, setActiveTab] = useState('basic');
  var [deleteConfirmText, setDeleteConfirmText] = useState('');
  var [deleting, setDeleting] = useState(false);
  var [connectLoading, setConnectLoading] = useState(false);
  var [connectStatus, setConnectStatus] = useState('not_connected');
  var [storageLimit, setStorageLimit] = useState(null);
  var [storageBreakdown, setStorageBreakdown] = useState(null);
  var [storageLoading, setStorageLoading] = useState(false);
  var [storageSortField, setStorageSortField] = useState('size');
  var [storageSortDir, setStorageSortDir] = useState('desc');
  var [deletingFile, setDeletingFile] = useState(null);

  var planData   = usePlanLimits(organizationId);
  var planLimits = planData ? planData.limits : {};
  var planName   = planData ? planData.plan   : null;
  var adminLimit  = planLimits ? planLimits.admin_limit  : undefined;
  var editorLimit = planLimits ? planLimits.editor_limit : undefined;

  // Theme helpers
  var inputCls   = isDark ? 'w-full px-4 py-3 border border-[#2A3550] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-[#1E2845] text-white placeholder-[#64748B]' : 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900';
  var labelCls   = 'block text-sm font-semibold mb-2 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900');
  var headingCls = 'text-lg font-bold ' + (isDark ? 'text-white' : 'text-gray-900');
  var subTextCls = 'text-sm mt-0.5 ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500');
  var mutedCls   = 'text-xs ' + (isDark ? 'text-[#64748B]' : 'text-gray-400');
  var dividerCls = isDark ? 'border-[#2A3550]' : 'border-gray-200';
  var sectionRowCls = isDark ? 'bg-[#1E2845] border-[#2A3550]' : 'bg-gray-50 border-gray-200';

  var [form, setForm] = useState({
    name: '', description: '', type: 'community',
    settings: { allowMemberInvites: true, requireApproval: false },
    join_mode: 'invite_only', is_public: false, collect_dues: true,
    city: '', county: '', state: '', zip_code: '', contact_phone: '', address: '',
    mailing_same: true, mailing_address: '', mailing_city: '', mailing_state: '', mailing_zip: '',
    service_categories: [], languages: [], keywords: [], discovery_about: '',
    allow_following: true, search_tags: [], enable_donations: false,
    donation_suggested_amount: '', donation_external_link: '', donation_title: '', donation_description: '',
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

  useEffect(function() {
    if (activeTab !== 'storage' || storageBreakdown) return;
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
        var { error: dbErr } = await supabase.from('documents').delete().eq('id', file.id);
        if (dbErr) throw dbErr;
        if (file.path) await supabase.storage.from('documents').remove([file.path]);
      } else if (file.category === 'event_fliers') {
        var { error: fe } = await supabase.storage.from('event-fliers').remove([file.path]);
        if (fe) throw fe;
      } else if (file.category === 'newsletters') {
        var { error: ne } = await supabase.storage.from('newsletter-images').remove([file.path]);
        if (ne) throw ne;
      }
      mascotSuccessToast('File deleted.');
      setStorageBreakdown(null); await loadStorageBreakdown();
    } catch(err) { mascotErrorToast('Failed to delete file.', err.message); } finally { setDeletingFile(null); }
  }

  function handleStorageSort(field) {
    if (storageSortField === field) { setStorageSortDir(storageSortDir === 'asc' ? 'desc' : 'asc'); }
    else { setStorageSortField(field); setStorageSortDir('desc'); }
  }

  async function fetchOrganization() {
    try {
      var { data: authData } = await supabase.auth.getUser();
      var user = authData ? authData.user : null;
      if (user) {
        var { data: membership } = await supabase.from('memberships').select('role').eq('organization_id', organizationId).eq('member_id', user.id).single();
        if (!membership || membership.role !== 'admin') { setIsAdmin(false); setLoading(false); return; }
        setIsAdmin(true);
      }
      var { data, error } = await supabase.from('organizations').select('*').eq('id', organizationId).single();
      if (error) throw error;
      setOrganization(data);
      setConnectStatus(data.stripe_connect_status || 'not_connected');
      setForm({
        name: data.name||'', description: data.description||'', type: data.type||'community',
        settings: Object.assign({ allowMemberInvites: true, requireApproval: false }, data.settings||{}),
        join_mode: data.join_mode||'invite_only', is_public: data.is_public||false, collect_dues: data.collect_dues!==false,
        county: data.county||'', city: data.city||'', state: data.state||'', zip_code: data.zip_code||'',
        contact_phone: data.contact_phone||'', address: data.address||'', mailing_same: true,
        mailing_address: data.mailing_address||'', mailing_city: data.mailing_city||'', mailing_state: data.mailing_state||'', mailing_zip: data.mailing_zip||'',
        service_categories: data.service_categories||[], languages: data.languages||[], keywords: data.keywords||[],
        discovery_about: data.discovery_about||'', allow_following: data.allow_following!==false, search_tags: data.search_tags||[],
        enable_donations: data.enable_donations||false, donation_suggested_amount: data.donation_suggested_amount||'',
        donation_external_link: data.donation_external_link||'', donation_title: data.donation_title||'', donation_description: data.donation_description||'',
        manual_payment_instructions: data.manual_payment_instructions||'',
      });
    } catch(err) { toast.error('Failed to load settings'); } finally { setLoading(false); }
  }

  async function handleStripeConnect() {
    setConnectLoading(true);
    try {
      var res = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/create-connect-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organization_id: organizationId }) });
      var data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to create connect link');
      window.location.href = data.url;
    } catch(err) { mascotErrorToast('Failed to start Stripe setup.', err.message); } finally { setConnectLoading(false); }
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
        name: form.name.trim(), description: form.description.trim(), type: form.type, settings: form.settings,
        join_mode: form.join_mode, is_public: form.is_public, collect_dues: form.collect_dues,
        city: form.city.trim(), county: form.county.trim(), state: form.state.trim(), zip_code: form.zip_code.trim(),
        contact_phone: form.contact_phone.trim(), address: form.address.trim(),
        mailing_address: form.mailing_same ? form.address.trim() : form.mailing_address.trim(),
        mailing_city: form.mailing_same ? form.city.trim() : form.mailing_city.trim(),
        mailing_state: form.mailing_same ? form.state.trim() : form.mailing_state.trim(),
        mailing_zip: form.mailing_same ? form.zip_code.trim() : form.mailing_zip.trim(),
        service_categories: form.service_categories, languages: form.languages, keywords: form.keywords,
        discovery_about: form.discovery_about.trim() || null, allow_following: form.allow_following, search_tags: form.search_tags,
        enable_donations: form.enable_donations,
        donation_suggested_amount: form.donation_suggested_amount ? parseFloat(form.donation_suggested_amount) : null,
        donation_external_link: form.donation_external_link ? form.donation_external_link.trim() : null,
        donation_title: form.donation_title ? form.donation_title.trim() : null,
        donation_description: form.donation_description ? form.donation_description.trim() : null,
        manual_payment_instructions: form.manual_payment_instructions ? form.manual_payment_instructions.trim() : null,
      }).eq('id', organizationId);
      if (error) throw error;
      mascotSuccessToast('Settings saved!', 'Your changes are live.');
      if (onUpdate) onUpdate(form);
    } catch(err) { mascotErrorToast('Save failed', err.message); } finally { setSaving(false); }
  }

  async function handleDeleteOrg() {
    if (deleteConfirmText !== 'DELETE') return;
    if (!window.confirm('Are you absolutely sure? This will permanently delete ' + organization.name + ' and all its data.')) return;
    setDeleting(true);
    try {
      var tables = ['memberships','events','announcements','chat_channels','documents','polls','surveys','org_programs','org_site_config','org_followers','signup_forms','org_photos','notifications'];
      for (var i = 0; i < tables.length; i++) { await supabase.from(tables[i]).delete().eq('organization_id', organizationId); }
      var delRes = await supabase.from('organizations').delete().eq('id', organizationId);
      if (delRes.error) throw delRes.error;
      mascotSuccessToast('Organization deleted.');
      window.location.href = '/dashboard';
    } catch(err) { mascotErrorToast('Delete failed', err.message); setDeleting(false); }
  }

  if (loading) return <SettingsSkeleton isDark={isDark}/>;

  // Admin-only gate
  if (isAdmin === false) {
    return (
      <div className={'rounded-xl border p-12 text-center ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200 shadow-lg')} role="alert">
        <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className={'h-12 w-12 mx-auto mb-4 ' + (isDark ? 'text-[#2A3550]' : 'text-gray-300')}/>
        <h2 className={'text-lg font-bold mb-2 ' + (isDark ? 'text-white' : 'text-gray-900')}>Admin Access Required</h2>
        <p className={'text-sm mb-6 ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>Organization settings are only accessible to admins.</p>
        <a href="../overview" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all">
          <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" className="h-4 w-4"/>
          Back to Overview
        </a>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className={'rounded-xl border p-6 text-center ' + (isDark ? 'bg-[#1A2035] border-[#2A3550]' : 'bg-white border-gray-200')} role="alert">
        <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className={'h-10 w-10 mx-auto mb-2 ' + (isDark ? 'text-amber-500' : 'text-yellow-400')}/>
        <p className={'font-semibold ' + (isDark ? 'text-amber-400' : 'text-yellow-800')}>Organization not found</p>
      </div>
    );
  }

  var publicPageUrl = organization.slug ? '/org/'+organization.slug : null;

  var allStorageFiles = [];
  if (storageBreakdown) {
    allStorageFiles = [].concat(storageBreakdown.documents.files).concat(storageBreakdown.event_fliers.files).concat(storageBreakdown.newsletters.files);
    allStorageFiles.sort(function(a, b) {
      if (storageSortField === 'size') return storageSortDir === 'desc' ? b.size_bytes - a.size_bytes : a.size_bytes - b.size_bytes;
      var na = (a.name||'').toLowerCase(); var nb = (b.name||'').toLowerCase();
      return storageSortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
    });
  }

  var storageCategoryLabels = { documents:'Documents', event_fliers:'Event Fliers', newsletters:'Newsletters', org_photos:'Photos', org_images:'Org Images' };
  var storageCategoryColors = { documents:'#3B82F6', event_fliers:'#F5B731', newsletters:'#8B5CF6', org_photos:'#22C55E', org_images:'#06B6D4' };

  function ToggleRow(props) {
    return (
      <div className={'flex items-center justify-between p-5 rounded-xl border-2 ' + (props.active ? (isDark ? 'border-green-600 bg-green-900/20' : 'border-green-400 bg-green-50') : (isDark ? 'border-[#2A3550] bg-[#1E2845]' : 'border-gray-200 bg-gray-50'))}>
        <div>
          <p className={'font-semibold text-sm ' + (isDark ? 'text-white' : 'text-gray-900')}>{props.label}</p>
          <p className={'text-xs mt-0.5 ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>{props.desc}</p>
        </div>
        <Toggle checked={props.active} onChange={props.onToggle} id={props.id} label={props.ariaLabel} isDark={isDark}/>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={(isDark ? 'bg-[#1A2035] border border-[#2A3550]' : 'bg-white shadow-lg') + ' rounded-lg overflow-hidden'}>

        {/* Header */}
        <div className={'border-b ' + dividerCls + ' px-6 py-4 flex items-center justify-between flex-wrap gap-3'}>
          <div>
            <h2 className={'text-2xl font-bold ' + (isDark ? 'text-white' : 'text-gray-900')}>Organization Settings</h2>
            <p className={subTextCls}>Manage your organization's configuration and preferences.</p>
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

        {/* Tab bar */}
        <div className={'border-b ' + dividerCls + ' px-6'}>
          <nav className="flex gap-1 overflow-x-auto" aria-label="Settings tabs" style={{ scrollbarWidth: 'thin' }}>
            {tabs.map(function(tab){
              var active = activeTab === tab.id;
              var isDanger = tab.id === 'danger';
              return (
                <button key={tab.id} type="button" onClick={function(){ setActiveTab(tab.id); }}
                  className={'py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg ' + (
                    isDanger
                      ? (active ? 'border-red-500 text-red-400' : 'border-transparent text-red-400/70 hover:text-red-400 hover:border-red-500/50')
                      : (active ? 'border-blue-500 text-blue-400' : 'border-transparent ' + (isDark ? 'text-[#94A3B8] hover:text-white' : 'text-gray-500 hover:text-gray-700') + ' hover:border-gray-400')
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

            {/* Public URL notice */}
            {publicPageUrl && activeTab !== 'roles' && activeTab !== 'membership' && activeTab !== 'danger' && activeTab !== 'storage' && (
              <div className={'border rounded-lg px-4 py-3 flex items-center gap-2 mb-6 ' + (isDark ? 'bg-blue-900/20 border-blue-700/40' : 'bg-blue-50 border-blue-200')}>
                <Icon path={['M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101','M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1']} className={'h-4 w-4 flex-shrink-0 ' + (isDark ? 'text-blue-400' : 'text-blue-500')}/>
                <p className={'text-sm ' + (isDark ? 'text-blue-300' : 'text-blue-800')}>
                  Public URL:{' '}
                  <a href={publicPageUrl} target="_blank" rel="noopener noreferrer" className={'font-mono font-semibold underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ' + (isDark ? 'hover:text-blue-200' : 'hover:text-blue-600')}>
                    {window.location.origin}{publicPageUrl}
                  </a>
                </p>
              </div>
            )}

            {/* ── BASIC ── */}
            {activeTab === 'basic' && (
              <section aria-labelledby="basic-heading" className="space-y-5">
                <h3 id="basic-heading" className={headingCls}>Basic Information</h3>
                {organization.org_number && (
                  <div className={'flex items-center gap-2 p-3 border rounded-lg ' + sectionRowCls}>
                    <span className={'text-xs font-semibold uppercase tracking-wide ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>Org Number</span>
                    <span className={'text-sm font-semibold ' + (isDark ? 'text-white' : 'text-gray-900')}>{organization.org_number}</span>
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
                  <p id="desc-count" className={mutedCls + ' mt-1 text-right'} aria-live="polite">{form.description.length}/500</p>
                </div>
                <div>
                  <label htmlFor="org-phone" className={labelCls}>Phone Number</label>
                  <input id="org-phone" name="contact_phone" type="tel" value={form.contact_phone} onChange={handleField} placeholder="e.g. (419) 555-0100" className={inputCls}/>
                </div>
                <div>
                  <p className={'text-sm font-bold mb-3 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900')}>Physical Address</p>
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
                    <p className={'text-sm font-bold ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900')}>Mailing Address</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.mailing_same} onChange={function(){ setForm(function(prev){ return Object.assign({},prev,{mailing_same:!prev.mailing_same}); }); }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                      <span className={'text-sm ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-600')}>Same as physical address</span>
                    </label>
                  </div>
                  {!form.mailing_same && (
                    <div className={'space-y-3 p-4 border rounded-xl ' + sectionRowCls}>
                      <div>
                        <label htmlFor="mailing-address" className={labelCls}>Street Address</label>
                        <input id="mailing-address" name="mailing_address" type="text" value={form.mailing_address} onChange={handleField} placeholder="e.g. PO Box 123" className={inputCls}/>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1"><label htmlFor="mailing-city" className={labelCls}>City</label><input id="mailing-city" name="mailing_city" type="text" value={form.mailing_city} onChange={handleField} className={inputCls}/></div>
                        <div><label htmlFor="mailing-state" className={labelCls}>State</label><input id="mailing-state" name="mailing_state" type="text" value={form.mailing_state} onChange={handleField} maxLength={2} className={inputCls+' uppercase'}/></div>
                        <div><label htmlFor="mailing-zip" className={labelCls}>ZIP Code</label><input id="mailing-zip" name="mailing_zip" type="text" value={form.mailing_zip} onChange={handleField} maxLength={10} className={inputCls}/></div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === 'privacy' && (
              <section aria-labelledby="privacy-heading" className="space-y-6">
                <h3 id="privacy-heading" className={headingCls}>Privacy & Access</h3>
                <div>
                  <p className={'text-sm font-bold mb-3 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900')}>How can people join?</p>
                  <div className="space-y-2" role="radiogroup" aria-label="Join mode">
                    {[
                      { value:'invite_only',     label:'Invite Only',     desc:'Only admins can invite new members.' },
                      { value:'request_to_join', label:'Request to Join', desc:'Anyone can request to join. Admins approve or deny requests.' },
                      { value:'both',            label:'Both',            desc:'Admins can invite members, and anyone can also request to join.' },
                    ].map(function(opt){
                      var checked = form.join_mode === opt.value;
                      return (
                        <label key={opt.value} className={'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ' + (checked ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') : (isDark ? 'border-[#2A3550] bg-[#1E2845] hover:border-blue-600' : 'border-gray-200 bg-white hover:border-gray-300'))}>
                          <input type="radio" name="join_mode" value={opt.value} checked={checked} onChange={handleField} className="mt-0.5 w-4 h-4 border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"/>
                          <div>
                            <p className={'font-semibold text-sm ' + (isDark ? 'text-white' : 'text-gray-900')}>{opt.label}</p>
                            <p className={'text-xs mt-0.5 ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>{opt.desc}</p>
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
                      <div key={item.id} className={'flex items-start gap-3 p-4 rounded-xl border ' + sectionRowCls}>
                        <input id={item.id} name={item.name} type="checkbox" checked={item.checked} onChange={handleField} className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0"/>
                        <div>
                          <label htmlFor={item.id} className={'font-semibold text-sm ' + (isDark ? 'text-white' : 'text-gray-900')}>{item.label}</label>
                          <p className={'text-xs mt-0.5 ' + (isDark ? 'text-[#94A3B8]' : 'text-gray-500')}>{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                  <ToggleRow active={form.allow_following} onToggle={function(){ setForm(function(p){ return Object.assign({},p,{allow_following:!p.allow_following}); }); }} id="allow-following-toggle" label="Allow Following" desc="Let people follow your organization from the Discover page and their dashboard." ariaLabel={form.allow_following ? 'Disable following' : 'Enable following'}/>
                </div>
              </section>
            )}

            {activeTab === 'roles' && <RolesTab organizationId={organizationId} adminLimit={adminLimit} editorLimit={editorLimit} planName={planName}/>}

            {activeTab === 'membership' && (
              <section aria-labelledby="membership-heading" className="space-y-6">
                <div><h3 id="membership-heading" className={headingCls}>Membership Settings</h3><p className={subTextCls}>Configure dues collection, tiers, amounts, and durations.</p></div>
                <ToggleRow active={form.collect_dues} onToggle={function(){ setForm(function(p){ return Object.assign({},p,{collect_dues:!p.collect_dues}); }); }} id="collect-dues-toggle" label="Collect Dues" desc={form.collect_dues ? 'Dues tracking is enabled.' : 'Dues tracking is off.'} ariaLabel={form.collect_dues ? 'Disable dues' : 'Enable dues'}/>
                {form.collect_dues && <MembershipTiers organizationId={organizationId}/>}
              </section>
            )}

            {activeTab === 'discover' && (
              <section aria-labelledby="discover-heading" className="space-y-6">
                <div><h3 id="discover-heading" className={headingCls}>Discover Orgs Page</h3><p className={subTextCls}>Control how your organization appears in public search results.</p></div>
                <ToggleRow active={form.is_public} onToggle={function(){ setForm(function(p){ return Object.assign({},p,{is_public:!p.is_public}); }); }} id="discovery-toggle" label="List on Discover Orgs page" desc={form.is_public ? 'Your organization is visible to the public.' : 'Hidden from public discovery.'} ariaLabel={form.is_public ? 'Remove from Discover' : 'List on Discover'}/>
                {form.is_public && (
                  <div className="space-y-8">
                    <div>
                      <label htmlFor="discovery-about" className={labelCls}>Discovery Blurb</label>
                      <p className={mutedCls + ' mb-2'}>Shown on org cards in the Discover page. Keep it to 1–2 sentences.</p>
                      <textarea id="discovery-about" value={form.discovery_about} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{discovery_about:e.target.value}); }); }} maxLength={280} rows={3} placeholder="e.g. We connect local volunteers with food-insecure families across Lucas County." className={inputCls + ' resize-none'} aria-describedby="discovery-about-count"/>
                      <p id="discovery-about-count" className={mutedCls + ' mt-1 text-right'} aria-live="polite">{form.discovery_about.length} / 280</p>
                    </div>
                    <div>
                      <p className={'text-sm font-bold mb-1 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900')}>Service Categories <span className={mutedCls}>({form.service_categories.length}/6)</span></p>
                      <p className={mutedCls + ' mb-3'}>Select up to 6 that apply.</p>
                      <ChecklistGroup options={SERVICE_CATEGORIES} selected={form.service_categories} onChange={function(val){ setForm(function(p){ return Object.assign({},p,{service_categories:val}); }); }} legend="Service categories" max={6}/>
                    </div>
                    <div>
                      <p className={'text-sm font-bold mb-1 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900')}>Languages Served</p>
                      <p className={mutedCls + ' mb-3'}>Which languages does your organization serve?</p>
                      <ChecklistGroup options={LANGUAGES} selected={form.languages} onChange={function(val){ setForm(function(p){ return Object.assign({},p,{languages:val}); }); }} legend="Languages served"/>
                    </div>
                    <div>
                      <p className={'text-sm font-bold mb-1 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900')}>Search Tags</p>
                      <p className={mutedCls + ' mb-3'}>Short tags shown on your card and used for keyword search.</p>
                      <KeywordInput keywords={form.search_tags} onChange={function(val){ setForm(function(p){ return Object.assign({},p,{search_tags:val}); }); }} placeholder="e.g. food pantry, after school" ariaLabel="Search tags"/>
                    </div>
                    <div>
                      <p className={'text-sm font-bold mb-1 ' + (isDark ? 'text-[#CBD5E1]' : 'text-gray-900')}>Additional Search Keywords</p>
                      <p className={mutedCls + ' mb-3'}>Used for search matching only — not displayed on your card.</p>
                      <KeywordInput keywords={form.keywords} onChange={function(val){ setForm(function(p){ return Object.assign({},p,{keywords:val}); }); }} placeholder="e.g. Toledo, northwest Ohio" ariaLabel="Additional keywords"/>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'donations' && (
              <section aria-labelledby="donations-heading" className="space-y-6">
                <div><h3 id="donations-heading" className={headingCls}>Donation Settings</h3><p className={subTextCls}>Accept donations on your public page via Stripe or an external link.</p></div>
                <ToggleRow active={form.enable_donations} onToggle={function(){ setForm(function(p){ return Object.assign({},p,{enable_donations:!p.enable_donations}); }); }} id="enable-donations-toggle" label="Enable Donations" desc={form.enable_donations ? 'A donation section is showing on your public page.' : 'No donation section on your public page.'} ariaLabel={form.enable_donations ? 'Disable donations' : 'Enable donations'}/>
                {form.enable_donations && (
                  <div className="space-y-4">
                    <div><label htmlFor="donation-title" className={labelCls}>Donation Section Title</label><input id="donation-title" type="text" value={form.donation_title} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_title:e.target.value}); }); }} placeholder={'Support '+(form.name||'Us')} className={inputCls} maxLength={100}/></div>
                    <div><label htmlFor="donation-description" className={labelCls}>Description</label><textarea id="donation-description" value={form.donation_description} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_description:e.target.value}); }); }} rows={3} placeholder="Your donation helps us continue our work in the community." className={inputCls+' resize-none'} maxLength={300}/></div>
                    <div>
                      <label htmlFor="donation-amount" className={labelCls}>Suggested Amount (optional)</label>
                      <div className="relative max-w-xs">
                        <span className={'absolute inset-y-0 left-3 flex items-center text-sm pointer-events-none ' + (isDark ? 'text-[#64748B]' : 'text-gray-400')} aria-hidden="true">$</span>
                        <input id="donation-amount" type="number" min="1" step="1" value={form.donation_suggested_amount} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_suggested_amount:e.target.value}); }); }} placeholder="25" className={inputCls+' pl-7'}/>
                      </div>
                    </div>
                    <div><label htmlFor="donation-external" className={labelCls}>External Donation Link (optional)</label><input id="donation-external" type="url" value={form.donation_external_link} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{donation_external_link:e.target.value}); }); }} placeholder="https://paypal.me/yourorg" className={inputCls}/></div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'payments' && (
              <section aria-labelledby="payments-heading" className="space-y-6">
                <div><h3 id="payments-heading" className={headingCls}>Payment Settings</h3><p className={subTextCls}>Connect Stripe to collect dues and ticket payments directly into your bank account.</p></div>
                <div className={'rounded-xl border-2 p-5 ' + (connectStatus==='active' ? (isDark?'border-green-600 bg-green-900/20':'border-green-400 bg-green-50') : connectStatus==='pending' ? (isDark?'border-yellow-600 bg-yellow-900/20':'border-yellow-400 bg-yellow-50') : (isDark?'border-[#2A3550] bg-[#1E2845]':'border-gray-200 bg-gray-50'))}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ' + (connectStatus==='active'?'bg-green-500/20':connectStatus==='pending'?'bg-yellow-500/20':(isDark?'bg-[#2A3550]':'bg-gray-200'))}>
                        {connectStatus==='active' ? <Icon path="M5 13l4 4L19 7" className="h-5 w-5 text-green-400"/>
                          : connectStatus==='pending' ? <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="h-5 w-5 text-yellow-400"/>
                          : <Icon path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" className={'h-5 w-5 '+(isDark?'text-[#64748B]':'text-gray-500')}/>}
                      </div>
                      <div>
                        <p className={'font-semibold text-sm '+(isDark?'text-white':'text-gray-900')}>Stripe Connect</p>
                        <p className={'text-xs mt-0.5 '+(connectStatus==='active'?'text-green-400':connectStatus==='pending'?'text-yellow-400':(isDark?'text-[#94A3B8]':'text-gray-500'))}>
                          {connectStatus==='active'?'Connected — payments go directly to your bank account':connectStatus==='pending'?'Setup in progress — finish Stripe onboarding to activate':'Not connected — connect to accept dues and ticket payments'}
                        </p>
                      </div>
                    </div>
                    {connectStatus !== 'active' && (
                      <button type="button" onClick={handleStripeConnect} disabled={connectLoading} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0" aria-busy={connectLoading}>
                        {connectLoading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Connecting...</> : <><Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="h-4 w-4"/>{connectStatus==='pending'?'Continue Setup':'Connect Stripe'}</>}
                      </button>
                    )}
                  </div>
                  {connectStatus === 'not_connected' && (
                    <div className={'mt-4 pt-4 border-t ' + dividerCls}>
                      <p className={'text-xs font-semibold mb-2 '+(isDark?'text-[#94A3B8]':'text-gray-500')}>What you get by connecting:</p>
                      <ul className="space-y-1" role="list">
                        {['Dues payments go directly to your bank account','Ticket sales go directly to your bank account','Stripe handles all card processing — you never see card numbers','Payouts within 2 business days'].map(function(item){
                          return <li key={item} className={'flex items-center gap-2 text-xs '+(isDark?'text-[#94A3B8]':'text-gray-600')} role="listitem"><Icon path="M5 13l4 4L19 7" className="h-3.5 w-3.5 text-green-500 flex-shrink-0"/>{item}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="manual-payment" className={labelCls}>Manual Payment Instructions (optional)</label>
                  <p className={mutedCls + ' mb-2'}>Shown to members on their dues page. Use this for PayPal, Venmo, Zelle, checks, or cash.</p>
                  <textarea id="manual-payment" name="manual_payment_instructions" value={form.manual_payment_instructions} onChange={handleField} rows={4} maxLength={500} placeholder="e.g. Pay via Venmo @YourOrg or mail a check to 123 Main St, Toledo OH 43601." className={inputCls + ' resize-none'} aria-describedby="manual-payment-count"/>
                  <p id="manual-payment-count" className={mutedCls + ' mt-1 text-right'} aria-live="polite">{form.manual_payment_instructions.length}/500</p>
                </div>
              </section>
            )}

            {activeTab === 'storage' && (
              <section aria-labelledby="storage-heading" className="space-y-6">
                <div><h3 id="storage-heading" className={headingCls}>Storage</h3><p className={subTextCls}>See how your storage is used across documents, photos, newsletters, and more.</p></div>
                {storageLoading ? (
                  <div className="space-y-4" aria-busy="true">
                    <Skeleton className="h-4 w-40" isDark={isDark}/><Skeleton className="h-4 w-full rounded-full" isDark={isDark}/>
                    <div className="grid grid-cols-3 gap-4">{[1,2,3].map(function(i){ return <Skeleton key={i} className="h-20 rounded-xl" isDark={isDark}/>; })}</div>
                    <Skeleton className="h-48 rounded-xl" isDark={isDark}/>
                  </div>
                ) : !storageBreakdown || storageBreakdown.total_bytes === 0 ? (
                  <div className={'text-center py-12 border border-dashed rounded-xl ' + (isDark?'bg-[#1E2845] border-[#2A3550]':'bg-gray-50 border-gray-300')}>
                    <Icon path="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" className={'h-10 w-10 mx-auto mb-3 '+(isDark?'text-[#2A3550]':'text-gray-300')}/>
                    <p className={'font-semibold text-sm '+(isDark?'text-[#94A3B8]':'text-gray-500')}>No storage used yet</p>
                    <p className={mutedCls+' mt-1'}>Upload documents or event fliers to see your breakdown here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className={'text-xs font-semibold uppercase tracking-wide '+(isDark?'text-[#94A3B8]':'text-gray-500')}>Usage by Category</p>
                        <p className={'text-sm font-bold '+(isDark?'text-white':'text-gray-900')}>{formatBytes(storageBreakdown.total_bytes)}{storageLimit?' of '+formatBytes(storageLimit)+' used':' total'}</p>
                      </div>
                      <div className={'w-full h-3 rounded-full overflow-hidden '+(isDark?'bg-[#2A3550]':'bg-gray-100')} role="img" aria-label="Storage usage bar">
                        <div className="flex h-full rounded-full overflow-hidden" style={{ width: storageLimit ? Math.min((storageBreakdown.total_bytes/storageLimit)*100,100)+'%' : '100%' }}>
                          {['documents','event_fliers','newsletters','org_photos','org_images'].map(function(cat) {
                            var bytes = storageBreakdown[cat].total_bytes;
                            var pct = storageBreakdown.total_bytes > 0 ? (bytes/storageBreakdown.total_bytes)*100 : 0;
                            if (pct <= 0) return null;
                            return <div key={cat} style={{ width:pct+'%', backgroundColor:storageCategoryColors[cat] }} title={storageCategoryLabels[cat]+': '+formatBytes(bytes)}/>;
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                        {['documents','event_fliers','newsletters','org_photos','org_images'].map(function(cat) {
                          return (
                            <div key={cat} className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor:storageCategoryColors[cat] }} aria-hidden="true"/>
                              <span className={mutedCls}>{storageCategoryLabels[cat]}</span>
                              <span className={'text-xs font-semibold '+(isDark?'text-[#CBD5E1]':'text-gray-800')}>{formatBytes(storageBreakdown[cat].total_bytes)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {['documents','event_fliers','newsletters','org_photos','org_images'].map(function(cat) {
                        var count = storageBreakdown[cat].files.length;
                        return (
                          <div key={cat} className={'p-4 rounded-xl border '+(isDark?'bg-[#1E2845] border-[#2A3550]':'bg-gray-50 border-gray-200')}>
                            <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-sm flex-shrink-0" style={{backgroundColor:storageCategoryColors[cat]}} aria-hidden="true"/><p className={'text-xs font-semibold uppercase tracking-wide '+(isDark?'text-[#94A3B8]':'text-gray-600')}>{storageCategoryLabels[cat]}</p></div>
                            <p className={'text-xl font-extrabold '+(isDark?'text-white':'text-gray-900')}>{formatBytes(storageBreakdown[cat].total_bytes)}</p>
                            <p className={mutedCls+' mt-0.5'}>{count} {count===1?'file':'files'}</p>
                          </div>
                        );
                      })}
                    </div>
                    {allStorageFiles.length > 0 && (
                      <div>
                        <p className={'text-xs font-semibold uppercase tracking-wide mb-3 '+(isDark?'text-[#94A3B8]':'text-gray-500')}>All Files</p>
                        <div className={'border rounded-xl overflow-hidden '+(isDark?'border-[#2A3550]':'border-gray-200')}>
                          <table className="w-full text-sm" role="table" aria-label="All storage files">
                            <thead>
                              <tr className={'border-b '+(isDark?'bg-[#1E2845] border-[#2A3550]':'bg-gray-50 border-gray-200')}>
                                <th scope="col" className="text-left px-4 py-3">
                                  <button type="button" onClick={function(){ handleStorageSort('name'); }} className={'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 rounded '+(isDark?'text-[#94A3B8] hover:text-white':'text-gray-500 hover:text-gray-800')} aria-label="Sort by name">
                                    File Name {storageSortField==='name' && <Icon path={storageSortDir==='asc'?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'} className="h-3 w-3"/>}
                                  </button>
                                </th>
                                <th scope="col" className="text-left px-4 py-3 hidden sm:table-cell"><span className={'text-xs font-semibold uppercase tracking-wide '+(isDark?'text-[#94A3B8]':'text-gray-500')}>Category</span></th>
                                <th scope="col" className="text-right px-4 py-3">
                                  <button type="button" onClick={function(){ handleStorageSort('size'); }} className={'flex items-center gap-1 ml-auto text-xs font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500 rounded '+(isDark?'text-[#94A3B8] hover:text-white':'text-gray-500 hover:text-gray-800')} aria-label="Sort by size">
                                    Size {storageSortField==='size' && <Icon path={storageSortDir==='asc'?'M5 15l7-7 7 7':'M19 9l-7 7-7-7'} className="h-3 w-3"/>}
                                  </button>
                                </th>
                                <th scope="col" className="px-4 py-3 w-12"><span className="sr-only">Actions</span></th>
                              </tr>
                            </thead>
                            <tbody>
                              {allStorageFiles.map(function(file, idx) {
                                var isDeleting = deletingFile === file.id;
                                return (
                                  <tr key={file.id+'-'+idx} className={'border-b last:border-0 '+(isDark?'border-[#2A3550] '+(isDeleting?'opacity-50':'hover:bg-[#1E2845]'):(isDeleting?'opacity-50':'hover:bg-gray-50'))}>
                                    <td className="px-4 py-3"><p className={'font-medium text-sm truncate max-w-[200px] '+(isDark?'text-white':'text-gray-900')} title={file.name}>{file.name}</p></td>
                                    <td className="px-4 py-3 hidden sm:table-cell"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm flex-shrink-0" style={{backgroundColor:storageCategoryColors[file.category]}} aria-hidden="true"/><span className={mutedCls}>{storageCategoryLabels[file.category]}</span></div></td>
                                    <td className="px-4 py-3 text-right"><span className={'text-sm font-medium '+(isDark?'text-[#CBD5E1]':'text-gray-700')}>{formatBytes(file.size_bytes)}</span></td>
                                    <td className="px-4 py-3 text-center">
                                      <button type="button" onClick={function(){ handleDeleteStorageFile(file); }} disabled={isDeleting} className={'p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-40 '+(isDark?'text-[#64748B] hover:text-red-400 hover:bg-red-900/30':'text-gray-400 hover:text-red-600 hover:bg-red-50')} aria-label={'Delete '+file.name}>
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

            {activeTab === 'verification' && <section aria-label="Nonprofit verification"><NonprofitVerificationForm organizationId={organizationId}/></section>}

            {activeTab === 'danger' && (
              <section aria-labelledby="danger-heading" className="space-y-6">
                <div><h3 id="danger-heading" className={headingCls}>Danger Zone</h3><p className={subTextCls}>Irreversible actions. Proceed with caution.</p></div>
                <div className={'border-2 border-red-700/50 rounded-xl p-6 space-y-5 '+(isDark?'bg-red-900/10':'')}>
                  <div>
                    <h4 className="text-base font-bold text-red-500">Delete Organization</h4>
                    <p className={'text-sm mt-1 '+(isDark?'text-[#94A3B8]':'text-gray-600')}>Permanently deletes <strong>{organization.name}</strong> and all associated data. This cannot be undone.</p>
                  </div>
                  <div role="alert" className="flex items-start gap-3 p-4 rounded-lg" style={{ border:'1px solid rgba(239,68,68,0.4)', backgroundColor:'rgba(239,68,68,0.08)' }}>
                    <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5"/>
                    <p className="text-sm text-red-400"><strong>Before deleting, you must disconnect your Stripe account.</strong> Syndicade cannot recover funds, payouts, or account data after deletion.</p>
                  </div>
                  <div>
                    <label htmlFor="delete-confirm" className={'block text-sm font-semibold mb-2 '+(isDark?'text-[#CBD5E1]':'text-gray-900')}>
                      Type <span className={'font-mono px-1.5 py-0.5 rounded text-red-400 '+(isDark?'bg-red-900/30':'bg-gray-100')}>DELETE</span> to confirm
                    </label>
                    <input id="delete-confirm" type="text" value={deleteConfirmText} onChange={function(e){ setDeleteConfirmText(e.target.value); }} placeholder="DELETE" className={'w-full max-w-xs px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm '+(isDark?'bg-[#1E2845] border-red-700/50 text-white':'bg-white border-red-300 text-gray-900')} aria-describedby="delete-confirm-hint"/>
                    <p id="delete-confirm-hint" className={mutedCls+' mt-1'}>This action is permanent and cannot be reversed.</p>
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
              <div className={'flex items-center justify-end pt-6 mt-6 border-t ' + dividerCls}>
                <button type="submit" disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  aria-label={saving?'Saving':'Save changes'} aria-busy={saving}>
                  {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving...</> : <><Icon path="M5 13l4 4L19 7" className="h-4 w-4"/>Save Changes</>}
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