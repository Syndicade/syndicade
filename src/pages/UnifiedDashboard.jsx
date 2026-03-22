import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import CreateOrganization from '../components/CreateOrganization'
import CreateEvent from '../components/CreateEvent.jsx'
import MySignups from '../components/MySignups'

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconOrgs() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
function IconHeart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function IconMegaphone() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  )
}
function IconEventTag() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function IconDocument() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}
function IconChat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function IconGroup() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function IconX() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function IconStar({ filled }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function IconChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
function IconBuilding() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}

// ─── Card type config ─────────────────────────────────────────────────────────
var CARD_TYPES = {
  announcement: { label: 'ANNOUNCEMENT', bg: '#FFFDE7', tack: '#E65100', tagBg: '#F57F17', tagText: '#FFFFFF', Icon: IconMegaphone },
  event:        { label: 'EVENT',         bg: '#E3F2FD', tack: '#1565C0', tagBg: '#2196F3', tagText: '#FFFFFF', Icon: IconEventTag },
  document:     { label: 'DOCUMENT',      bg: '#EDE7F6', tack: '#4527A0', tagBg: '#7E57C2', tagText: '#FFFFFF', Icon: IconDocument },
}

// ─── Post-it Card — content drives height ─────────────────────────────────────
function FeedCard({ item, onDismiss, onToggleImportant, isImportant }) {
  var type = CARD_TYPES[item.type] || CARD_TYPES.event
  var Icon = type.Icon

  return (
    <article
      aria-label={type.label + ' from ' + item.organizationName + (isImportant ? ', marked important' : '')}
      style={{
        background: type.bg,
        borderRadius: '3px',
        // Top padding makes room for the tack that sits at top:-6px
        padding: '16px 12px 12px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        // Lined-paper texture
        backgroundImage: 'repeating-linear-gradient(transparent,transparent 22px,rgba(0,0,0,0.05) 23px)',
        backgroundPositionY: '34px',
        boxShadow: isImportant
          ? 'inset 0 0 0 2px #F5B731, 0 3px 12px rgba(245,183,49,0.15)'
          : '0 1px 4px rgba(0,0,0,0.08)',
        // Width is controlled by the column container
      }}
    >
      {/* Tack */}
      <div aria-hidden="true" style={{
        width: '12px', height: '12px', borderRadius: '50%',
        position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)',
        background: 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.5) 0%, ' + type.tack + ' 52%, rgba(0,0,0,0.2) 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }} />

      {/* Tag row + action buttons */}
      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '4px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap', flex: 1, minWidth: 0}}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '2px 6px', borderRadius: '3px', flexShrink: 0,
            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px',
            background: type.tagBg, color: type.tagText,
          }}>
            <Icon />{type.label}
          </span>
          {item.priority === 'urgent' && (
            <span style={{padding: '2px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', background: '#EF4444', color: '#FFFFFF', flexShrink: 0}}>URGENT</span>
          )}
          {isImportant && (
            <span style={{display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, background: 'rgba(245,183,49,0.25)', color: '#92400E', flexShrink: 0}}>
              <IconStar filled={true} />
            </span>
          )}
        </div>
        {/* Hover-revealed action buttons */}
        <div style={{display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0}} className="card-actions">
          <button onClick={function(e) { e.stopPropagation(); onToggleImportant(item.id) }}
            aria-label={isImportant ? 'Remove important flag' : 'Mark as important'} title={isImportant ? 'Remove important' : 'Mark important'}
            style={{width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '3px', cursor: 'pointer', background: isImportant ? 'rgba(245,183,49,0.3)' : 'rgba(0,0,0,0.09)', color: isImportant ? '#D97706' : '#6B7280'}}
            className="focus:outline-none focus:ring-2 focus:ring-yellow-400"
          ><IconStar filled={isImportant} /></button>
          <button onClick={function(e) { e.stopPropagation(); onDismiss(item.id) }}
            aria-label={'Dismiss: ' + item.title} title="Dismiss"
            style={{width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '3px', cursor: 'pointer', background: 'rgba(0,0,0,0.09)', color: '#6B7280'}}
            className="focus:outline-none focus:ring-2 focus:ring-red-400"
          ><IconX /></button>
        </div>
      </div>

      {/* Title — no line clamp; full content shows, card grows to fit */}
      <div style={{fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.45, marginBottom: '10px'}}>
        {item.title}
      </div>

      {/* Footer pinned to bottom of whatever height the card ends up */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.07)', gap: '4px', marginTop: 'auto'}}>
        <span style={{fontSize: '10px', fontWeight: 700, color: type.tagBg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1}}>
          {item.organizationName}
        </span>
        <span style={{fontSize: '10px', color: '#6B7280', flexShrink: 0}}>{item.time}</span>
      </div>
    </article>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, statBg, statColor, loading, isDark }) {
  return (
    <div style={{background: isDark ? statBg : '#FFFFFF', border: isDark ? 'none' : '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px'}} role="region" aria-label={label + ' count: ' + value}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px'}}>
        <span style={{fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: isDark ? '#94A3B8' : '#64748B'}}>{label}</span>
        <span style={{color: statColor, opacity: 0.7}}><Icon /></span>
      </div>
      {loading
        ? <div style={{width: '40px', height: '28px', background: isDark ? '#2A3550' : '#E2E8F0', borderRadius: '5px'}} />
        : <span style={{fontSize: '28px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0E1523', lineHeight: 1}}>{value}</span>
      }
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w, h, isDark, radius }) {
  return <div style={{width: w || '100%', height: h || '13px', background: isDark ? '#2A3550' : '#E2E8F0', borderRadius: radius || '4px', flexShrink: 0}} />
}

// ─── Org filter dropdown ──────────────────────────────────────────────────────
function OrgFilterDropdown({ organizations, selectedOrgId, onChange, isDark }) {
  var [open, setOpen] = useState(false)
  var ref = useRef(null)
  var border = isDark ? '#2A3550' : '#E2E8F0'
  var cardBg = isDark ? '#1A2035' : '#FFFFFF'
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523'
  var textMuted = isDark ? '#94A3B8' : '#64748B'
  var isFiltered = selectedOrgId !== 'all'
  var selectedName = isFiltered ? ((organizations.find(function(o) { return o.id === selectedOrgId }) || {}).name || 'Org') : 'All Orgs'

  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return function() { document.removeEventListener('mousedown', handler) }
  }, [])

  return (
    <div ref={ref} style={{position: 'relative'}}>
      <button onClick={function() { setOpen(function(v) { return !v }) }} aria-haspopup="listbox" aria-expanded={open} aria-label={'Filter by organization: ' + selectedName}
        style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '99px', border: '1px solid ' + (isFiltered ? '#3B82F6' : border), background: isFiltered ? 'rgba(59,130,246,0.1)' : 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: isFiltered ? 700 : 500, color: isFiltered ? '#3B82F6' : textMuted, whiteSpace: 'nowrap'}}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <IconOrgs />{selectedName}<IconChevronDown />
      </button>
      {open && (
        <div role="listbox" style={{position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: cardBg, border: '1px solid ' + border, borderRadius: '10px', padding: '5px', minWidth: '190px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.15)'}}>
          {[{ id: 'all', name: 'All Organizations' }, ...organizations].map(function(org) {
            var isSel = selectedOrgId === org.id
            return (
              <button key={org.id} role="option" aria-selected={isSel} onClick={function() { onChange(org.id); setOpen(false) }}
                style={{display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: 'none', background: isSel ? 'rgba(59,130,246,0.12)' : 'transparent', color: isSel ? '#3B82F6' : textPrimary, fontSize: '13px', fontWeight: isSel ? 700 : 400, cursor: 'pointer'}}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              >{org.name}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Show count dropdown ──────────────────────────────────────────────────────
function ShowCountDropdown({ value, onChange, isDark }) {
  var [open, setOpen] = useState(false)
  var ref = useRef(null)
  var border = isDark ? '#2A3550' : '#E2E8F0'
  var cardBg = isDark ? '#1A2035' : '#FFFFFF'
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523'
  var textMuted = isDark ? '#94A3B8' : '#64748B'
  var options = [{ value: 10, label: 'Show 10' }, { value: 20, label: 'Show 20' }, { value: 30, label: 'Show 30' }, { value: 0, label: 'Show all' }]

  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return function() { document.removeEventListener('mousedown', handler) }
  }, [])

  return (
    <div ref={ref} style={{position: 'relative'}}>
      <button onClick={function() { setOpen(function(v) { return !v }) }} aria-haspopup="listbox" aria-expanded={open} aria-label={'Items to show: ' + (value === 0 ? 'all' : value)}
        style={{display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 11px', borderRadius: '99px', border: '1px solid ' + border, background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: textMuted, whiteSpace: 'nowrap'}}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {value === 0 ? 'Show all' : 'Show ' + value}<IconChevronDown />
      </button>
      {open && (
        <div role="listbox" style={{position: 'absolute', top: 'calc(100% + 5px)', right: 0, background: cardBg, border: '1px solid ' + border, borderRadius: '10px', padding: '5px', minWidth: '130px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.15)'}}>
          {options.map(function(opt) {
            var isSel = value === opt.value
            return (
              <button key={opt.value} role="option" aria-selected={isSel} onClick={function() { onChange(opt.value); setOpen(false) }}
                style={{display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: 'none', background: isSel ? 'rgba(59,130,246,0.12)' : 'transparent', color: isSel ? '#3B82F6' : textPrimary, fontSize: '13px', fontWeight: isSel ? 700 : 400, cursor: 'pointer'}}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              >{opt.label}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 3-column masonry feed ────────────────────────────────────────────────────
// Distributes items round-robin across 3 explicit column divs.
// Each column is a separate flex container — no CSS columns, no bleed.
// paddingTop on each column gives the tacks visible space above the first card.
function MasonryFeed({ items, onDismiss, onToggleImportant, importantActivities }) {
  // Split into 3 columns: 0→col0, 1→col1, 2→col2, 3→col0, ...
  var col0 = [], col1 = [], col2 = []
  items.forEach(function(item, i) {
    if (i % 3 === 0) col0.push(item)
    else if (i % 3 === 1) col1.push(item)
    else col2.push(item)
  })

  function renderCol(colItems) {
    return colItems.map(function(item) {
      return (
        <div key={item.id} className="feed-card-wrap" style={{marginBottom: '14px'}}>
          <FeedCard
            item={item}
            onDismiss={onDismiss}
            onToggleImportant={onToggleImportant}
            isImportant={importantActivities.includes(item.id)}
          />
        </div>
      )
    })
  }

  var colStyle = {
    flex: '1 1 0',
    minWidth: 0,
    // paddingTop gives the tacks above each first card visible space
    paddingTop: '10px',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div
      role="list"
      aria-label="Board activity feed"
      style={{display: 'flex', gap: '14px', alignItems: 'flex-start'}}
    >
      <div style={colStyle}>{renderCol(col0)}</div>
      <div style={colStyle}>{renderCol(col1)}</div>
      <div style={colStyle}>{renderCol(col2)}</div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function UnifiedDashboard() {
  var { isDark } = useTheme()
  var navigate = useNavigate()

  var [organizations, setOrganizations] = useState([])
  var [myGroups, setMyGroups] = useState([])
  var [activities, setActivities] = useState([])
  var [dismissedActivities, setDismissedActivities] = useState(function() {
    try { return JSON.parse(localStorage.getItem('dismissedActivities') || '[]') } catch { return [] }
  })
  var [importantActivities, setImportantActivities] = useState(function() {
    try { return JSON.parse(localStorage.getItem('importantActivities') || '[]') } catch { return [] }
  })
  var [upcomingEvents, setUpcomingEvents] = useState([])
  var [recentChats, setRecentChats] = useState([])
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState(null)
  var [showCreateModal, setShowCreateModal] = useState(false)
  var [showCreateEvent, setShowCreateEvent] = useState(false)
  var [selectedOrgForEvent, setSelectedOrgForEvent] = useState(null)
  var [memberName, setMemberName] = useState('')
  var [activeFilter, setActiveFilter] = useState('all')
  var [orgFilter, setOrgFilter] = useState('all')
  var [showCount, setShowCount] = useState(10)
  var [notifCount, setNotifCount] = useState(0)

  var pageBg = isDark ? '#0E1523' : '#F8FAFC'
  var cardBg = isDark ? '#1A2035' : '#FFFFFF'
  var border = isDark ? '#2A3550' : '#E2E8F0'
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523'
  var textSecondary = isDark ? '#CBD5E1' : '#475569'
  var textMuted = isDark ? '#94A3B8' : '#64748B'
  var ORG_COLORS = ['#3B82F6', '#8B5CF6', '#F5B731', '#22C55E', '#EF4444', '#EC4899']
  var GROUP_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  useEffect(function() {
    var sub = supabase.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_IN' && session) fetchDashboardData()
      else if (event === 'SIGNED_OUT') navigate('/login')
    })
    var check = async function() {
      var res = await supabase.auth.getSession()
      if (res.data.session) fetchDashboardData()
      else setLoading(false)
    }
    check()
    return function() { sub.data.subscription?.unsubscribe() }
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true); setError(null)
      var userRes = await supabase.auth.getUser()
      if (userRes.error) throw userRes.error
      var user = userRes.data.user
      if (!user) { setLoading(false); return }

      var profileRes = await supabase.from('members').select('full_name').eq('id', user.id).single()
      if (profileRes.data) setMemberName(profileRes.data.full_name || '')

      var orgsRes = await supabase.from('memberships').select('id, role, status, custom_title, joined_date, organization:organizations (id, name, description, type, logo_url)').eq('member_id', user.id).eq('status', 'active').order('joined_date', { ascending: false })
      if (orgsRes.error) throw orgsRes.error

      var orgsWithStats = await Promise.all((orgsRes.data || []).map(async function(membership) {
        var orgId = membership.organization.id
        var memberCount = (await supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active')).count
        var eventCount = (await supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('start_time', new Date().toISOString()).in('visibility', ['public', 'members'])).count
        var annRes = await supabase.from('announcements').select('id').eq('organization_id', orgId).in('visibility', ['public', 'members'])
        var announcementIds = (annRes.data || []).map(function(a) { return a.id })
        var unreadCount = 0
        if (announcementIds.length > 0) {
          var reads = (await supabase.from('announcement_reads').select('announcement_id').eq('member_id', user.id).in('announcement_id', announcementIds)).data
          var readIds = new Set((reads || []).map(function(r) { return r.announcement_id }))
          unreadCount = announcementIds.length - readIds.size
        }
        return { ...membership.organization, role: membership.role, custom_title: membership.custom_title, memberCount: memberCount || 0, eventCount: eventCount || 0, unreadCount }
      }))
      setOrganizations(orgsWithStats)

      try {
        var groupsRes = await supabase.from('group_members').select('group:groups (id, name, organization_id, type, organizations(name))').eq('member_id', user.id).eq('status', 'active')
        if (groupsRes.data) setMyGroups(groupsRes.data.map(function(gm) { return gm.group }).filter(Boolean))
      } catch { setMyGroups([]) }

      var notifRes = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('member_id', user.id).eq('is_read', false)
      if (notifRes.count !== null) setNotifCount(notifRes.count)

      var orgIds = orgsWithStats.map(function(o) { return o.id })
      if (orgIds.length > 0) {
        var evtRes = await supabase.from('events').select('id, title, start_time, location, organization:organizations (id, name, type)').in('organization_id', orgIds).gte('start_time', new Date().toISOString()).in('visibility', ['public', 'members']).order('start_time', { ascending: true }).limit(5)
        setUpcomingEvents(evtRes.data || [])

        var annFeed = await supabase.from('announcements').select('id, title, created_at, priority, organization:organizations (id, name)').in('organization_id', orgIds).in('visibility', ['public', 'members']).order('created_at', { ascending: false }).limit(30)
        var evtFeed = await supabase.from('events').select('id, title, created_at, organization:organizations (id, name)').in('organization_id', orgIds).in('visibility', ['public', 'members']).order('created_at', { ascending: false }).limit(30)
        var docFeed = await supabase.from('documents').select('id, title, created_at, organization:organizations (id, name)').in('organization_id', orgIds).order('created_at', { ascending: false }).limit(30)

        var allActivities = [
          ...(annFeed.data || []).map(function(item) { return { id: 'announcement-' + item.id, type: 'announcement', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, priority: item.priority, time: timeAgo(item.created_at) } }),
          ...(evtFeed.data || []).map(function(item) { return { id: 'event-' + item.id, type: 'event', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) } }),
          ...(docFeed.data || []).map(function(item) { return { id: 'document-' + item.id, type: 'document', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) } }),
        ]
        allActivities.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp) })
        setActivities(allActivities)

        var chatRes = await supabase.from('chat_messages').select('id, content, created_at, chat_channels(name, organization_id, organizations(name))').order('created_at', { ascending: false }).limit(4)
        if (chatRes.data) setRecentChats(chatRes.data)
      }
    } catch (err) {
      console.error(err); setError(err.message); toast.error('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function getInitials(name) {
    if (!name) return '?'
    var parts = name.trim().split(' ')
    return parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function handleDismiss(id) {
    var updated = [...dismissedActivities, id]
    setDismissedActivities(updated)
    localStorage.setItem('dismissedActivities', JSON.stringify(updated))
    toast.success('Removed from board.')
  }

  function handleToggleImportant(id) {
    var updated = importantActivities.includes(id)
      ? importantActivities.filter(function(i) { return i !== id })
      : [...importantActivities, id]
    setImportantActivities(updated)
    localStorage.setItem('importantActivities', JSON.stringify(updated))
    toast.success(updated.includes(id) ? 'Marked as important.' : 'Removed important flag.')
  }

  var visibleActivities = activities.filter(function(a) { return !dismissedActivities.includes(a.id) })
  var filteredFeed = visibleActivities.filter(function(a) {
    return (activeFilter === 'all' || a.type === activeFilter) && (orgFilter === 'all' || a.organizationId === orgFilter)
  })
  var sortedFeed = filteredFeed.slice().sort(function(a, b) {
    var ai = importantActivities.includes(a.id) ? 0 : 1
    var bi = importantActivities.includes(b.id) ? 0 : 1
    if (ai !== bi) return ai - bi
    return new Date(b.timestamp) - new Date(a.timestamp)
  })
  // Only ever render exactly these items — no bleed possible
  var displayedFeed = showCount === 0 ? sortedFeed : sortedFeed.slice(0, showCount)
  var totalUnread = organizations.reduce(function(sum, org) { return sum + (org.unreadCount || 0) }, 0)

  if (!loading && error) {
    return (
      <div style={{minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter',system-ui,sans-serif"}}>
        <div role="alert" style={{background: cardBg, border: '1px solid #EF4444', borderRadius: '12px', padding: '40px', maxWidth: '420px', textAlign: 'center'}}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" style={{margin: '0 auto 16px'}} aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h2 style={{fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '8px'}}>Something went wrong</h2>
          <p style={{fontSize: '13px', color: textMuted, marginBottom: '20px'}}>{error}</p>
          <button onClick={fetchDashboardData} style={{padding: '9px 20px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{background: pageBg, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: textPrimary}}>

      <style>{`
        .feed-card-wrap .card-actions { opacity: 0; transition: opacity 0.1s ease; }
        .feed-card-wrap:hover .card-actions,
        .feed-card-wrap:focus-within .card-actions { opacity: 1; }
      `}</style>

      <main role="main" style={{maxWidth: '1280px', margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 288px', gap: '28px', alignItems: 'start'}}>

        {/* ── Left column ───────────────────────────────────────────────── */}
        <div>
          {/* Welcome */}
          <div style={{marginBottom: '20px'}}>
            <p style={{fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '3px'}}>WELCOME BACK</p>
            <h1 style={{fontSize: '24px', fontWeight: 800, color: textPrimary, margin: 0}}>
              {loading ? 'Loading…' : memberName ? memberName.split(' ')[0] + "'s Board" : 'My Board'}
            </h1>
            <p style={{fontSize: '12px', color: textMuted, marginTop: '3px'}}>
              Updates from your {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Stat cards */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px'}}>
            <StatCard label="ORGS"       value={organizations.length}  Icon={IconOrgs}     statBg="#1D3461" statColor="#60A5FA" loading={loading} isDark={isDark} />
            <StatCard label="EVENTS"     value={upcomingEvents.length} Icon={IconCalendar} statBg="#1B3A2F" statColor="#4ADE80" loading={loading} isDark={isDark} />
            <StatCard label="VOLUNTEERS" value={0}                     Icon={IconHeart}    statBg="#2D1B4E" statColor="#C084FC" loading={loading} isDark={isDark} />
            <StatCard label="UNREAD"     value={totalUnread}           Icon={IconBell}     statBg="#3B1A1A" statColor="#FB7185" loading={loading} isDark={isDark} />
          </div>

          {/* Filter bar */}
          <div style={{display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap'}}>
            <div role="tablist" aria-label="Filter by content type" style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
              {[
                { key: 'all',          label: 'All' },
                { key: 'event',        label: 'Events' },
                { key: 'announcement', label: 'Announcements' },
                { key: 'document',     label: 'Documents' },
              ].map(function(tab) {
                var isActive = activeFilter === tab.key
                return (
                  <button key={tab.key} role="tab" aria-selected={isActive} onClick={function() { setActiveFilter(tab.key) }}
                    style={{padding: '5px 12px', borderRadius: '99px', border: '1px solid ' + (isActive ? '#F5B731' : border), background: isActive ? '#F5B731' : 'transparent', color: isActive ? '#0E1523' : textSecondary, fontSize: '12px', fontWeight: isActive ? 700 : 500, cursor: 'pointer'}}
                    className="focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >{tab.label}</button>
                )
              })}
            </div>
            <div style={{width: '1px', height: '20px', background: border, flexShrink: 0}} aria-hidden="true" />
            <OrgFilterDropdown organizations={organizations} selectedOrgId={orgFilter} onChange={setOrgFilter} isDark={isDark} />
            <div style={{flex: 1}} />
            {dismissedActivities.length > 0 && (
              <button onClick={function() { setDismissedActivities([]); localStorage.removeItem('dismissedActivities'); toast.success('Board restored.') }}
                style={{fontSize: '11px', fontWeight: 600, color: textMuted, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap'}}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >Restore {dismissedActivities.length} hidden</button>
            )}
            <ShowCountDropdown value={showCount} onChange={setShowCount} isDark={isDark} />
          </div>

          {/* Feed area — 24px top margin gives the tack pins room without clipping */}
          <div style={{marginTop: '24px'}}>
            {loading ? (
              <div style={{display: 'flex', gap: '14px', alignItems: 'flex-start'}}>
                {[0,1,2].map(function(col) {
                  var heights = col === 0 ? [90,120,100] : col === 1 ? [110,85,130] : [95,115,88]
                  return (
                    <div key={col} style={{flex: '1 1 0', minWidth: 0, paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '14px'}}>
                      {heights.map(function(h, i) {
                        return (
                          <div key={i} style={{background: isDark ? '#1A2035' : '#FFFFFF', border: '1px solid ' + border, borderRadius: '6px', padding: '14px', height: h + 'px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <Skel w="60px" h="16px" isDark={isDark} radius="3px" />
                            <Skel h="12px" isDark={isDark} />
                            <Skel w="75%" h="12px" isDark={isDark} />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ) : organizations.length === 0 ? (
              <div role="status" style={{textAlign: 'center', padding: '56px 24px', border: '1px dashed ' + border, borderRadius: '12px'}}>
                <div style={{color: textMuted, margin: '0 auto 14px', width: 'fit-content'}}><IconBuilding /></div>
                <p style={{fontSize: '16px', fontWeight: 700, color: textPrimary, marginBottom: '6px'}}>No organizations yet</p>
                <p style={{fontSize: '13px', color: textMuted, marginBottom: '20px'}}>Create or join an organization to see updates here.</p>
                <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
                  <button onClick={function() { setShowCreateModal(true) }} style={{padding: '9px 18px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Create Organization</button>
                  <button onClick={function() { navigate('/explore') }} style={{padding: '9px 18px', background: 'transparent', color: textSecondary, border: '1px solid ' + border, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Discover Organizations</button>
                </div>
              </div>
            ) : displayedFeed.length === 0 ? (
              <div role="status" style={{textAlign: 'center', padding: '40px 24px', border: '1px dashed ' + border, borderRadius: '12px', color: textMuted}}>
                <p style={{fontSize: '14px', fontWeight: 600, color: textPrimary, marginBottom: '4px'}}>Nothing here</p>
                <p style={{fontSize: '12px'}}>Try a different filter or check back when your orgs post updates.</p>
              </div>
            ) : (
              <MasonryFeed
                items={displayedFeed}
                onDismiss={handleDismiss}
                onToggleImportant={handleToggleImportant}
                importantActivities={importantActivities}
              />
            )}
          </div>

          {/* Show more hint */}
          {!loading && sortedFeed.length > 0 && showCount !== 0 && sortedFeed.length > showCount && (
            <p style={{fontSize: '12px', color: textMuted, textAlign: 'center', marginTop: '16px'}}>
              Showing {displayedFeed.length} of {sortedFeed.length} items —{' '}
              <button onClick={function() { setShowCount(0) }} style={{background: 'none', border: 'none', color: '#3B82F6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">show all</button>
            </p>
          )}

          {/* Upcoming Events */}
          {!loading && upcomingEvents.length > 0 && (
            <section aria-labelledby="events-strip-heading" style={{marginTop: '36px'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
                <h2 id="events-strip-heading" style={{fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#F5B731', margin: 0}}>UPCOMING EVENTS</h2>
                <Link to="/events" style={{fontSize: '12px', fontWeight: 600, color: '#3B82F6', textDecoration: 'none'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">View all</Link>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                {upcomingEvents.slice(0, 4).map(function(event) {
                  var d = new Date(event.start_time)
                  return (
                    <Link key={event.id} to={'/organizations/' + event.organization.id + '/events'} aria-label={'Event: ' + event.title}
                      style={{display: 'flex', alignItems: 'center', gap: '14px', background: cardBg, border: '1px solid ' + border, borderRadius: '10px', padding: '10px 14px', textDecoration: 'none'}}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div style={{flexShrink: 0, width: '40px', textAlign: 'center', background: isDark ? '#1E2845' : '#F1F5F9', borderRadius: '7px', padding: '5px 0'}}>
                        <div style={{fontSize: '9px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '1px'}}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div style={{fontSize: '18px', fontWeight: 800, color: textPrimary, lineHeight: 1}}>{d.getDate()}</div>
                      </div>
                      <div style={{flex: 1, minWidth: 0}}>
                        <p style={{fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{event.title}</p>
                        <p style={{fontSize: '11px', color: textMuted, margin: 0}}>{event.organization.name}{event.location ? ' · ' + event.location : ''}</p>
                      </div>
                      <span style={{fontSize: '11px', color: textMuted, flexShrink: 0}}>{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <aside role="complementary" aria-label="Dashboard sidebar" style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>

          {/* My Organizations */}
          <section aria-labelledby="orgs-heading" style={{background: cardBg, border: '1px solid ' + border, borderRadius: '12px', padding: '18px'}}>
            <h2 id="orgs-heading" style={{fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '14px'}}>MY ORGANIZATIONS</h2>
            {loading ? (
              [1,2,3].map(function(i) { return (<div key={i} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'}}><Skel w="36px" h="36px" isDark={isDark} radius="8px" /><div style={{flex: 1}}><Skel w="80%" h="12px" isDark={isDark} /><div style={{marginTop: '5px'}}><Skel w="45%" h="10px" isDark={isDark} /></div></div></div>) })
            ) : organizations.length === 0 ? (
              <p style={{fontSize: '13px', color: textMuted, textAlign: 'center', padding: '12px 0'}}>No organizations yet.</p>
            ) : (
              organizations.map(function(org, idx) {
                var color = ORG_COLORS[idx % ORG_COLORS.length]
                return (
                  <Link key={org.id} to={'/organizations/' + org.id} aria-label={'Go to ' + org.name}
                    style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 8px', borderRadius: '8px', marginBottom: '2px', textDecoration: 'none'}}
                    className={'focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isDark ? 'hover:bg-white hover:bg-opacity-5' : 'hover:bg-gray-50')}
                  >
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name + ' logo'} style={{width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0}} />
                    ) : (
                      <div style={{width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0, background: color, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700}}>
                        {getInitials(org.name)}
                      </div>
                    )}
                    <div style={{flex: 1, minWidth: 0}}>
                      <p style={{fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{org.name}</p>
                      <p style={{fontSize: '11px', color: textMuted, margin: 0, textTransform: 'capitalize'}}>{org.custom_title || org.role}</p>
                    </div>
                    {org.unreadCount > 0 && (
                      <span aria-label={org.unreadCount + ' unread'} style={{background: '#EF4444', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, borderRadius: '99px', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0}}>
                        {org.unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })
            )}
            <button onClick={function() { setShowCreateModal(true) }} aria-label="Create a new organization"
              style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', padding: '8px 12px', background: 'transparent', border: '1px dashed ' + border, borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: textMuted}}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <IconPlus /> New organization
            </button>
          </section>

          {/* My Groups */}
          <section aria-labelledby="groups-heading" style={{background: cardBg, border: '1px solid ' + border, borderRadius: '12px', padding: '18px'}}>
            <h2 id="groups-heading" style={{fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '14px'}}>MY GROUPS</h2>
            {loading ? (
              [1,2].map(function(i) { return (<div key={i} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'}}><Skel w="32px" h="32px" isDark={isDark} radius="6px" /><div style={{flex: 1}}><Skel w="70%" h="12px" isDark={isDark} /><div style={{marginTop: '5px'}}><Skel w="50%" h="10px" isDark={isDark} /></div></div></div>) })
            ) : myGroups.length === 0 ? (
              <div style={{textAlign: 'center', padding: '8px 0', color: textMuted}}>
                <div style={{opacity: 0.35, margin: '0 auto 8px', width: 'fit-content'}}><IconGroup /></div>
                <p style={{fontSize: '12px', lineHeight: 1.5}}>No groups yet. Join a committee or team inside one of your organizations.</p>
              </div>
            ) : (
              myGroups.map(function(group, idx) {
                var color = GROUP_COLORS[idx % GROUP_COLORS.length]
                return (
                  <Link key={group.id} to={'/organizations/' + group.organization_id + '?tab=groups'} aria-label={'Go to ' + group.name + ' group'}
                    style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 8px', borderRadius: '8px', marginBottom: '2px', textDecoration: 'none'}}
                    className={'focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isDark ? 'hover:bg-white hover:bg-opacity-5' : 'hover:bg-gray-50')}
                  >
                    <div style={{width: '32px', height: '32px', borderRadius: '6px', flexShrink: 0, background: color, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700}}>
                      {getInitials(group.name)}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <p style={{fontSize: '13px', fontWeight: 600, color: textPrimary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{group.name}</p>
                      <p style={{fontSize: '11px', color: textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {group.organizations ? group.organizations.name : ''}
                        {group.type ? ' · ' + group.type : ''}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </section>

          {/* Recent Chats */}
          <section aria-labelledby="chats-heading" style={{background: cardBg, border: '1px solid ' + border, borderRadius: '12px', padding: '18px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px'}}>
              <h2 id="chats-heading" style={{fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', margin: 0}}>RECENT CHATS</h2>
              {organizations.length > 0 && (
                <button onClick={function() { navigate('/organizations/' + organizations[0].id + '/chat') }} aria-label="Open chat" style={{background: 'transparent', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: '12px', fontWeight: 600}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">View all</button>
              )}
            </div>
            {loading ? (
              [1,2].map(function(i) { return (<div key={i} style={{display: 'flex', gap: '10px', marginBottom: '12px'}}><Skel w="26px" h="26px" isDark={isDark} radius="50%" /><div style={{flex: 1}}><Skel w="60%" h="11px" isDark={isDark} /><div style={{marginTop: '5px'}}><Skel w="85%" h="10px" isDark={isDark} /></div></div></div>) })
            ) : recentChats.length === 0 ? (
              <div style={{textAlign: 'center', padding: '8px 0', color: textMuted}}>
                <div style={{opacity: 0.35, margin: '0 auto 8px', width: 'fit-content'}}><IconChat /></div>
                <p style={{fontSize: '12px', marginBottom: '12px'}}>No messages yet.</p>
                {organizations.length > 0 && (
                  <button onClick={function() { navigate('/organizations/' + organizations[0].id + '/chat') }} style={{padding: '6px 14px', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Start Chatting</button>
                )}
              </div>
            ) : (
              recentChats.map(function(msg) {
                var channelName = msg.chat_channels ? msg.chat_channels.name : 'channel'
                var orgId = msg.chat_channels ? msg.chat_channels.organization_id : null
                var orgName = (msg.chat_channels && msg.chat_channels.organizations) ? msg.chat_channels.organizations.name : ''
                return (
                  <button key={msg.id} onClick={function() { if (orgId) navigate('/organizations/' + orgId + '/chat') }} aria-label={'Open ' + channelName + ' channel'}
                    style={{display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '7px 8px', borderRadius: '8px', marginBottom: '2px', textAlign: 'left'}}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div style={{width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: '#3B82F6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><IconChat /></div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <p style={{fontSize: '12px', fontWeight: 700, color: textPrimary, margin: 0}}>#{channelName}{orgName && <span style={{fontWeight: 400, color: textMuted}}> · {orgName}</span>}</p>
                      <p style={{fontSize: '11px', color: textMuted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{msg.content || '(message)'}</p>
                    </div>
                    <span style={{fontSize: '10px', color: textMuted, flexShrink: 0}}>{timeAgo(msg.created_at)}</span>
                  </button>
                )
              })
            )}
          </section>

          {/* My Sign-Ups */}
          <section aria-labelledby="signups-heading" style={{background: cardBg, border: '1px solid ' + border, borderRadius: '12px', overflow: 'hidden'}}>
            <div style={{padding: '18px 18px 0'}}>
              <h2 id="signups-heading" style={{fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#F5B731', marginBottom: '0'}}>MY SIGN-UPS</h2>
            </div>
            <MySignups showFilter={false} headingId="signups-heading" />
          </section>

        </aside>
      </main>

      <CreateOrganization isOpen={showCreateModal} onClose={function() { setShowCreateModal(false) }} onSuccess={function() { fetchDashboardData(); setShowCreateModal(false) }} />
      {selectedOrgForEvent && (
        <CreateEvent isOpen={showCreateEvent} onClose={function() { setShowCreateEvent(false); setSelectedOrgForEvent(null) }} onSuccess={fetchDashboardData} organizationId={selectedOrgForEvent.id} organizationName={selectedOrgForEvent.name} />
      )}
    </div>
  )
}

export default UnifiedDashboard