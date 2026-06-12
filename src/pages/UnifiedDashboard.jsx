import { useState, useEffect, useRef } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { mascotSuccessToast } from '../components/MascotToast'
import { mascotErrorToast } from '../components/MascotToast'
import CreateOrganization from '../components/CreateOrganization'
import CreateEvent from '../components/CreateEvent.jsx'
import MySignups from '../components/MySignups'
import TasksWidget from '../components/TasksWidget';
import InviteOrgModal from '../components/InviteOrgModal'
import { UserPlus, Building2, BookmarkCheck, Bookmark, CalendarCheck, ClipboardList } from 'lucide-react'

// ─── react-big-calendar localizer ─────────────────────────────────────────
var _locales = { 'en-US': enUS }
var _localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: _locales })

// ─── Post-it color palette ────────────────────────────────────────────────
var PALETTE = [
  { color:'#3B82F6', card:'#DBEAFE', tagText:'#1e3a8a' },
  { color:'#10B981', card:'#D1FAE5', tagText:'#064e3b' },
  { color:'#F59E0B', card:'#FEF3C7', tagText:'#78350f' },
  { color:'#EF4444', card:'#FEE2E2', tagText:'#7f1d1d' },
  { color:'#8B5CF6', card:'#EDE9FE', tagText:'#3b0764' },
  { color:'#EC4899', card:'#FCE7F3', tagText:'#831843' },
  { color:'#14B8A6', card:'#CCFBF1', tagText:'#134e4a' },
  { color:'#F97316', card:'#FFEDD5', tagText:'#7c2d12' },
  { color:'#6366F1', card:'#E0E7FF', tagText:'#3730a3' },
  { color:'#84CC16', card:'#ECFCCB', tagText:'#365314' },
  { color:'#06B6D4', card:'#CFFAFE', tagText:'#164e63' },
  { color:'#F43F5E', card:'#FFE4E6', tagText:'#881337' },
]

// ─── Light theme tokens ────────────────────────────────────────────────────
var BG     = '#F8FAFC'
var CARD   = '#FFFFFF'
var BDR    = '#E2E8F0'
var TEXT   = '#0E1523'
var TEXT2  = '#475569'
var MUTED  = '#64748B'
var YELLOW = '#F5B731'
var BLUE   = '#3B82F6'
var PURPLE = '#8B5CF6'
var RED    = '#EF4444'
var GREEN  = '#22C55E'

// ─── Post-it note color presets (kept for feed bg rotation) ───────────────
var NOTE_PRESETS = [
  '#FEF9C3','#DCFCE7','#FFEDD5','#FCE7F3',
  '#E0F2FE','#F3E8FF','#FFF7ED','#ECFDF5',
]

// ─── Sidebar colors ───────────────────────────────────────────────────────
var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#F5B731','#22C55E','#EF4444','#EC4899']
var GROUP_COLORS  = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']

// ─── localStorage cap helper ──────────────────────────────────────────────
var LS_CAP = 200
function lsWrite(key, arr) {
  try {
    var capped = arr.slice(-LS_CAP)
    localStorage.setItem(key, JSON.stringify(capped))
    return capped
  } catch(e) { return arr }
}
function lsRead(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

// ─── Available widgets ────────────────────────────────────────────────────
var WIDGET_DEFS = [
  { key: 'orgs',      label: 'My Organizations', desc: 'Org list with unread counts' },
  { key: 'chats',     label: 'Recent Chats',      desc: 'Latest channel messages'     },
  { key: 'saved',     label: 'Saved Events',      desc: 'Events you bookmarked'       },
  { key: 'following', label: 'Following',          desc: 'Orgs you follow publicly'   },
  { key: 'tasks',     label: 'My Tasks',           desc: 'Tasks assigned to you across orgs' },
  { key: 'signups',   label: 'My Sign-Ups',        desc: 'Volunteer sign-up slots'    },
  { key: 'groups',    label: 'My Groups',          desc: 'Committees and teams'       },
]

// ─── Tour steps ───────────────────────────────────────────────────────────
var TOUR_STEPS = [
  { title: 'Stats at a glance',   desc: 'See your org count, upcoming events, and unread announcements right here.' },
  { title: 'Your activity board', desc: 'Announcements, events, and documents appear as color-coded Post-it cards. Use the tabs to filter by type.' },
  { title: 'My Organizations',    desc: 'Quick access to every org you belong to. Red badges show unread announcements.' },
  { title: 'Customize widgets',   desc: 'Add or remove sidebar widgets — your choices are saved to your account.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return ''
  var diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400)  return Math.floor(diff / 3600) + 'h ago'
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function getInitials(name) {
  if (!name) return '?'
  var parts = name.trim().split(' ')
  return parts.length === 1
    ? parts[0].substring(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
function fmtDate(iso) {
  if (!iso) return { mon: '—', day: '—', time: '' }
  var d = new Date(iso)
  return {
    mon:  d.toLocaleDateString('en-US', { month: 'short' }),
    day:  d.getDate(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}
function formatDateShort(ds) {
  if (!ds) return ''
  var d = new Date(ds + (ds.includes('T') ? '' : 'T00:00:00'))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function toInputDate(date) {
  // Returns YYYY-MM-DD string for date input value
  var d = date instanceof Date ? date : new Date(date)
  var mm = String(d.getMonth() + 1).padStart(2, '0')
  var dd = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + mm + '-' + dd
}

// ─── Icons ────────────────────────────────────────────────────────────────
function IcoOrgs() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IcoCalendar() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function IcoBell() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
function IcoStar({ filled }) {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function IcoX() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function IcoChevronDown() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
}
function IcoPlus() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function IcoBookmark() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
}
function IcoCompass() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
}
function IcoChat() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function IcoGroup() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IcoBuilding() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}
function IcoSettings() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}
function IcoPalette() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
}
function IcoMegaphone() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
}
function IcoAlert() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}
function IcoDoc() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
function IcoCalSmall() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
}
function IcoCheck() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
}
function IcoTrash() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
}
function IcoEye() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function IcoEyeOff() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skel({ w, h, radius }) {
  return <div style={{ width: w || '100%', height: h || '13px', background: '#E2E8F0', borderRadius: radius || '4px', flexShrink: 0 }} />
}

// ─── StatCard ─────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, accentColor, loading }) {
  return (
    <div role="region" aria-label={label + ': ' + value} style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: MUTED }}>{label}</span>
        <span style={{ color: accentColor, opacity: 0.7 }}><Icon /></span>
      </div>
      {loading
        ? <Skel w="40px" h="28px" />
        : <span style={{ fontSize: '28px', fontWeight: 800, color: TEXT, lineHeight: 1 }}>{value}</span>
      }
    </div>
  )
}

// ─── OrgFilterDropdown ────────────────────────────────────────────────────
function OrgFilterDropdown({ organizations, selectedOrgId, onChange }) {
  var [open, setOpen] = useState(false)
  var ref = useRef(null)
  var isFiltered = selectedOrgId !== 'all'
  var selectedName = isFiltered
    ? ((organizations.find(function(o) { return o.id === selectedOrgId }) || {}).name || 'Org')
    : 'All Orgs'
  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return function() { document.removeEventListener('mousedown', handler) }
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={function() { setOpen(function(v) { return !v }) }}
        aria-haspopup="listbox" aria-expanded={open}
        aria-label={'Filter by organization: ' + selectedName}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '99px', border: '1px solid ' + (isFiltered ? BLUE : BDR), background: isFiltered ? 'rgba(59,130,246,0.08)' : 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: isFiltered ? 700 : 500, color: isFiltered ? BLUE : MUTED, whiteSpace: 'nowrap' }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <IcoOrgs />{selectedName}<IcoChevronDown />
      </button>
      {open && (
        <div role="listbox" style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', padding: '5px', minWidth: '190px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
          {[{ id: 'all', name: 'All Organizations' }, ...organizations].map(function(org) {
            var isSel = selectedOrgId === org.id
            return (
              <button key={org.id} role="option" aria-selected={isSel} onClick={function() { onChange(org.id); setOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: 'none', background: isSel ? 'rgba(59,130,246,0.1)' : 'transparent', color: isSel ? BLUE : TEXT, fontSize: '13px', fontWeight: isSel ? 700 : 400, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                {org.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── OrgColorPicker — unified with PALETTE ────────────────────────────────
function OrgColorPicker({ orgId, currentColor, onSelect }) {
  var [open, setOpen] = useState(false)
  var ref = useRef(null)
  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return function() { document.removeEventListener('mousedown', handler) }
  }, [])
  // Rec #4: show card swatch (not accent color) so picker preview matches feed cards
  var currentCard = (PALETTE.find(function(p) { return p.color === currentColor }) || { card: currentColor }).card
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={function(e) { e.stopPropagation(); setOpen(function(v) { return !v }) }} aria-label="Change note color for this organization" title="Change note color" style={{ width: '18px', height: '18px', borderRadius: '50%', background: currentCard, border: '2px solid ' + BDR, cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
        <span style={{ color: 'rgba(0,0,0,0.3)', lineHeight: 1, fontSize: '8px' }}><IcoPalette /></span>
      </button>
      {open && (
        <div role="dialog" aria-label="Pick a note color" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', padding: '10px', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', width: '136px' }}>
          {PALETTE.map(function(p) {
            var isSelected = currentColor === p.color
            return (
              <button key={p.color} aria-label={'Select color ' + p.color + (isSelected ? ', currently selected' : '')} onClick={function() { onSelect(orgId, p.color); setOpen(false) }} style={{ width: '22px', height: '22px', borderRadius: '5px', background: p.card, border: isSelected ? '3px solid ' + TEXT : '2px solid ' + p.color, cursor: 'pointer', padding: 0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── PostItCard ───────────────────────────────────────────────────────────
function PostItCard({ item, orgNoteBg, onDismiss, onToggleImportant, isImportant }) {
  var bg, accentColor, tagBgColor, tagTxtColor, tagLabel, TagIcon
  if (item.type === 'event') {
    bg = '#DBEAFE'; accentColor = '#1D4ED8'
    tagBgColor = 'rgba(59,130,246,0.2)'; tagTxtColor = '#1E40AF'
    tagLabel = 'Event'; TagIcon = IcoCalSmall
  } else if (item.type === 'document') {
    bg = '#EDE9FE'; accentColor = '#5B21B6'
    tagBgColor = 'rgba(139,92,246,0.2)'; tagTxtColor = '#5B21B6'
    tagLabel = 'Document'; TagIcon = IcoDoc
} else if (item.priority === 'urgent') {
    bg = '#FEE2E2'; accentColor = '#B91C1C'
    tagBgColor = 'rgba(239,68,68,0.2)'; tagTxtColor = '#B91C1C'
    tagLabel = 'Urgent'; TagIcon = IcoAlert
  } else if (item.type === 'opportunity') {
    bg = '#DBEAFE'; accentColor = '#1D4ED8'
    tagBgColor = 'rgba(59,130,246,0.2)'; tagTxtColor = '#1E40AF'
    tagLabel = 'Opportunity'; TagIcon = IcoDoc
  } else if (item.type === 'funding') {
    bg = '#DCFCE7'; accentColor = '#15803D'
    tagBgColor = 'rgba(34,197,94,0.2)'; tagTxtColor = '#15803D'
    tagLabel = 'Funding'; TagIcon = IcoDoc
  } else if (item.type === 'program') {
    bg = '#EDE9FE'; accentColor = '#5B21B6'
    tagBgColor = 'rgba(139,92,246,0.2)'; tagTxtColor = '#5B21B6'
    tagLabel = 'Program'; TagIcon = IcoDoc
  } else {
    bg = orgNoteBg || '#FEF9C3'; accentColor = '#92400E'
    tagBgColor = 'rgba(0,0,0,0.1)'; tagTxtColor = '#374151'
    tagLabel = 'Announcement'; TagIcon = IcoMegaphone
  }
  return (
    <article
      aria-label={tagLabel + ' from ' + item.organizationName + (isImportant ? ', starred' : '')}
      className="postit-card"
      style={{ background: (orgNoteBg && item.priority !== 'urgent') ? orgNoteBg : bg, borderRadius: '12px', padding: '14px', minHeight: '150px', display: 'flex', flexDirection: 'column', boxShadow: isImportant ? '3px 4px 14px rgba(0,0,0,0.12), inset 0 0 0 2px ' + YELLOW : '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', background: tagBgColor, color: tagTxtColor }}>
            <TagIcon />{tagLabel}
          </span>
          {isImportant && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, background: 'rgba(245,183,49,0.25)', color: '#92400E' }}>
              <IcoStar filled={true} /> Starred
            </span>
          )}
        </div>
        <div className="card-actions" style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          <button onClick={function(e) { e.stopPropagation(); onToggleImportant(item.id) }} aria-label={isImportant ? 'Remove star' : 'Star this item'} title={isImportant ? 'Remove star' : 'Star'} style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '4px', cursor: 'pointer', background: isImportant ? 'rgba(245,183,49,0.3)' : 'rgba(0,0,0,0.07)', color: isImportant ? '#D97706' : '#9CA3AF' }} className="focus:outline-none focus:ring-2 focus:ring-yellow-400"><IcoStar filled={isImportant} /></button>
          <button onClick={function(e) { e.stopPropagation(); onDismiss(item.id) }} aria-label={'Dismiss: ' + item.title} title="Dismiss" style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'rgba(0,0,0,0.07)', color: '#9CA3AF' }} className="focus:outline-none focus:ring-2 focus:ring-red-400"><IcoX /></button>
        </div>
      </div>
      <p style={{ fontFamily: "'Patrick Hand', sans-serif", fontSize: '17px', fontWeight: 400, color: '#374151', lineHeight: 1.5, flex: 1, margin: '0 0 10px', wordBreak: 'break-word' }}>{item.title}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: accentColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '6px' }}>{item.organizationName}</span>
        <span style={{ fontSize: '10px', color: MUTED, flexShrink: 0 }}>{item.time}</span>
      </div>
    </article>
  )
}

// ─── 3-column note grid ───────────────────────────────────────────────────
function NoteGrid({ items, orgColors, orgIndexMap, onDismiss, onToggleImportant, importantActivities }) {
  var col0 = [], col1 = [], col2 = []
  items.forEach(function(item, i) {
    if (i % 3 === 0) col0.push(item)
    else if (i % 3 === 1) col1.push(item)
    else col2.push(item)
  })
  function getNoteBg(item) {
    if (item.priority === 'urgent') return null
    if (orgColors[item.organizationId]) {
      var match = PALETTE.find(function(p) { return p.color === orgColors[item.organizationId] })
      return match ? match.card : null
    }
    if (item.type !== 'announcement') return null
    var idx = orgIndexMap[item.organizationId] || 0
    return NOTE_PRESETS[idx % NOTE_PRESETS.length]
  }
  function renderCol(colItems) {
    return colItems.map(function(item) {
      return (
        <div key={item.id} className="postit-wrap" style={{ marginBottom: '14px' }}>
          <PostItCard item={item} orgNoteBg={getNoteBg(item)} onDismiss={onDismiss} onToggleImportant={onToggleImportant} isImportant={importantActivities.includes(item.id)} />
        </div>
      )
    })
  }
  var colStyle = { flex: '1 1 0', minWidth: 0, paddingTop: '10px', display: 'flex', flexDirection: 'column' }
  return (
    <div role="list" aria-label="Activity feed" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={colStyle}>{renderCol(col0)}</div>
      <div style={colStyle}>{renderCol(col1)}</div>
      <div style={colStyle}>{renderCol(col2)}</div>
    </div>
  )
}

// ─── MyProgramsEvents tab ─────────────────────────────────────────────────
function MyProgramsEvents({ currentUserId, organizations, loading: parentLoading }) {
  var navigate = useNavigate()
  var [myRsvps,          setMyRsvps]          = useState([])
  var [myRegistrations,  setMyRegistrations]  = useState([])
  var [savedPrograms,    setSavedPrograms]     = useState([])
  var [savedEventsList,  setSavedEventsList]   = useState([])
  var [loading,          setLoading]          = useState(true)
  var [activeSubTab,     setActiveSubTab]     = useState('registered')

  useEffect(function() {
    if (!currentUserId) return
    loadAll()
  }, [currentUserId])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([
        loadRsvps(),
        loadRegistrations(),
        loadSavedPrograms(),
        loadSavedEvents(),
      ])
    } catch(e) { console.error('MyProgramsEvents loadAll error:', e) }
    finally { setLoading(false) }
  }

  async function loadRsvps() {
    var res = await supabase
      .from('event_rsvps')
      .select('id, status, guest_count, events(id, title, start_time, location, organization_id, organizations(id, name))')
      .eq('member_id', currentUserId)
      .in('status', ['going', 'maybe'])
      .order('created_at', { ascending: false })
      .limit(20)
    if (res.error) { console.error('loadRsvps error:', res.error); return }
    setMyRsvps(res.data || [])
  }

  async function loadRegistrations() {
    var res = await supabase
      .from('program_registrations')
      .select('id, status, created_at, org_programs(id, name, start_date, end_date, organization_id, organizations(id, name))')
      .eq('user_id', currentUserId)
      .in('status', ['enrolled', 'pending'])
      .order('created_at', { ascending: false })
      .limit(20)
    if (res.error) { console.error('loadRegistrations error:', res.error); return }
    setMyRegistrations(res.data || [])
  }

  async function loadSavedPrograms() {
    var res = await supabase
      .from('program_saves')
      .select('id, program_id, org_programs(id, name, start_date, status, organization_id, organizations(id, name))')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (res.error) { console.error('loadSavedPrograms error:', res.error); return }
    setSavedPrograms(res.data || [])
  }

  async function loadSavedEvents() {
    var res = await supabase
      .from('event_saves')
      .select('id, events(id, title, start_time, location, organizations(id, name))')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (res.error) { console.error('loadSavedEvents error:', res.error); return }
    setSavedEventsList(res.data || [])
  }

  async function unsaveProgram(saveId) {
    var res = await supabase.from('program_saves').delete().eq('id', saveId)
    if (res.error) { mascotErrorToast('Failed to remove bookmark.'); return }
    setSavedPrograms(function(prev) { return prev.filter(function(s) { return s.id !== saveId }) })
    mascotSuccessToast('Bookmark removed.')
  }

  async function unsaveEvent(saveId) {
    var res = await supabase.from('event_saves').delete().eq('id', saveId)
    if (res.error) { mascotErrorToast('Failed to remove bookmark.'); return }
    setSavedEventsList(function(prev) { return prev.filter(function(s) { return s.id !== saveId }) })
    mascotSuccessToast('Bookmark removed.')
  }

  function statusBadge(status) {
    var cfg = {
      going:    { bg: 'rgba(34,197,94,0.1)',   color: '#22C55E', label: 'Going'    },
      maybe:    { bg: 'rgba(245,183,49,0.15)',  color: '#B45309', label: 'Maybe'   },
      enrolled: { bg: 'rgba(34,197,94,0.1)',    color: '#22C55E', label: 'Enrolled' },
      pending:  { bg: 'rgba(245,183,49,0.15)',  color: '#B45309', label: 'Pending approval' },
    }
    var c = cfg[status] || { bg: 'rgba(100,116,139,0.1)', color: '#64748B', label: status }
    return (
      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '99px', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
        {c.label}
      </span>
    )
  }

  var totalRegistered = myRsvps.length + myRegistrations.length
  var totalSaved      = savedPrograms.length + savedEventsList.length

  if (loading || parentLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' }} aria-busy="true" aria-label="Loading your programs and events">
        {[1,2,3,4].map(function(i) {
          return (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '10px' }} className="animate-pulse">
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: BDR, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: '13px', width: '55%', background: BDR, borderRadius: '4px', marginBottom: '6px' }} />
                <div style={{ height: '11px', width: '35%', background: '#F1F5F9', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '70px', height: '22px', background: '#F1F5F9', borderRadius: '99px' }} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div role="tablist" aria-label="My programs and events sections" style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[
          { key: 'registered', label: 'RSVPs & Registrations', count: totalRegistered },
          { key: 'saved',      label: 'Saved',                 count: totalSaved      },
        ].map(function(tab) {
          var isActive = activeSubTab === tab.key
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={function() { setActiveSubTab(tab.key) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '99px', border: '1px solid ' + (isActive ? BLUE : BDR), background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent', color: isActive ? BLUE : MUTED, fontSize: '12px', fontWeight: isActive ? 700 : 500, cursor: 'pointer' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: isActive ? BLUE : '#E2E8F0', color: isActive ? '#FFFFFF' : MUTED }}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeSubTab === 'registered' && (
        <div>
          {totalRegistered === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed ' + BDR, borderRadius: '12px' }}>
              <CalendarCheck size={36} style={{ color: MUTED, opacity: 0.4, margin: '0 auto 12px', display: 'block' }} aria-hidden="true" />
              <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>No RSVPs or registrations yet</p>
              <p style={{ fontSize: '13px', color: MUTED, marginBottom: '20px' }}>Events you RSVP to and programs you register for will appear here.</p>
              <button onClick={function() { navigate('/discover') }} style={{ padding: '9px 18px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Discover Events
              </button>
            </div>
          ) : (
            <div role="list" aria-label="Your RSVPs and registrations" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myRsvps.map(function(rsvp) {
                var evt = rsvp.events
                if (!evt) return null
                var d = fmtDate(evt.start_time)
                var org = evt.organizations
                return (
                  <div key={'rsvp-' + rsvp.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: CARD, border: '1px solid ' + BDR, borderRadius: '10px' }}>
                    <div style={{ flexShrink: 0, width: '44px', textAlign: 'center', background: '#EFF6FF', borderRadius: '8px', padding: '6px 0' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '1px' }}>{d.mon}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: BLUE, lineHeight: 1 }}>{d.day}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '99px', background: 'rgba(59,130,246,0.1)', color: BLUE }}>Event</span>
                        {org && <span style={{ fontSize: '11px', color: MUTED }}>{org.name}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {statusBadge(rsvp.status)}
                      <button onClick={function() { navigate('/events/' + evt.id) }} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: TEXT2, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={'View event: ' + evt.title}>View</button>
                    </div>
                  </div>
                )
              })}
              {myRegistrations.map(function(reg) {
                var prog = reg.org_programs
                if (!prog) return null
                var org = prog.organizations
                var startFmt = prog.start_date ? formatDateShort(prog.start_date) : null
                return (
                  <div key={'reg-' + reg.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: CARD, border: '1px solid ' + BDR, borderRadius: '10px' }}>
                    <div style={{ flexShrink: 0, width: '44px', height: '44px', background: '#EDE9FE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={20} style={{ color: PURPLE }} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prog.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '99px', background: 'rgba(139,92,246,0.1)', color: PURPLE }}>Program</span>
                        {org && <span style={{ fontSize: '11px', color: MUTED }}>{org.name}</span>}
                        {startFmt && <span style={{ fontSize: '11px', color: MUTED }}>Starts {startFmt}</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>{statusBadge(reg.status)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'saved' && (
        <div>
          {totalSaved === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed ' + BDR, borderRadius: '12px' }}>
              <Bookmark size={36} style={{ color: MUTED, opacity: 0.4, margin: '0 auto 12px', display: 'block' }} aria-hidden="true" />
              <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>Nothing saved yet</p>
              <p style={{ fontSize: '13px', color: MUTED, marginBottom: '20px' }}>Bookmark events and programs to find them here.</p>
              <button onClick={function() { navigate('/discover') }} style={{ padding: '9px 18px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Discover Events
              </button>
            </div>
          ) : (
            <div role="list" aria-label="Your saved events and programs" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedEventsList.map(function(save) {
                var evt = save.events
                if (!evt) return null
                var d = fmtDate(evt.start_time)
                var org = evt.organizations
                return (
                  <div key={'sevt-' + save.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: CARD, border: '1px solid ' + BDR, borderRadius: '10px' }}>
                    <div style={{ flexShrink: 0, width: '44px', textAlign: 'center', background: 'rgba(245,183,49,0.1)', borderRadius: '8px', padding: '6px 0' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '1px' }}>{d.mon}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>{d.day}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '99px', background: 'rgba(245,183,49,0.1)', color: '#B45309' }}>Event</span>
                        {org && <span style={{ fontSize: '11px', color: MUTED }}>{org.name}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button onClick={function() { unsaveEvent(save.id) }} style={{ padding: '5px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: YELLOW }} className="hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400" aria-label={'Remove bookmark for ' + evt.title} title="Remove bookmark">
                        <BookmarkCheck size={16} aria-hidden="true" />
                      </button>
                      <button onClick={function() { navigate('/events/' + evt.id) }} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: TEXT2, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={'View event: ' + evt.title}>View</button>
                    </div>
                  </div>
                )
              })}
              {savedPrograms.map(function(save) {
                var prog = save.org_programs
                if (!prog) return null
                var org = prog.organizations
                return (
                  <div key={'sprog-' + save.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: CARD, border: '1px solid ' + BDR, borderRadius: '10px' }}>
                    <div style={{ flexShrink: 0, width: '44px', height: '44px', background: '#EDE9FE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClipboardList size={20} style={{ color: PURPLE }} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prog.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '99px', background: 'rgba(139,92,246,0.1)', color: PURPLE }}>Program</span>
                        {org && <span style={{ fontSize: '11px', color: MUTED }}>{org.name}</span>}
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '99px', background: prog.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', color: prog.status === 'active' ? '#22C55E' : MUTED }}>
                          {prog.status ? prog.status.charAt(0).toUpperCase() + prog.status.slice(1) : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button onClick={function() { unsaveProgram(save.id) }} style={{ padding: '5px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: YELLOW }} className="hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400" aria-label={'Remove bookmark for ' + prog.name} title="Remove bookmark">
                        <BookmarkCheck size={16} aria-hidden="true" />
                      </button>
                      <button onClick={function() { navigate('/organizations/' + prog.organization_id + '/programs') }} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: TEXT2, cursor: 'pointer' }} className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={'View program: ' + prog.name}>View</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── TourOverlay ──────────────────────────────────────────────────────────
function TourOverlay({ step, refs, onNext, onSkip }) {
  var current = TOUR_STEPS[step]
  var [pos, setPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' })
  useEffect(function() {
    if (!current) return
    // Rec #6: guard — only highlight if element exists
    var el = refs[step] && refs[step].current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    var origBox = el.style.boxShadow
    var origZ   = el.style.zIndex
    var origRad = el.style.borderRadius
    el.style.zIndex      = '1001'
    el.style.boxShadow   = '0 0 0 3px ' + YELLOW
    el.style.borderRadius = '12px'
    var timer = setTimeout(function() {
      if (!el) return
      var r = el.getBoundingClientRect()
      var tipW = 300, tipH = 180
      var tipTop = r.bottom + tipH + 16 < window.innerHeight ? r.bottom + 12 : r.top - tipH - 12
      var tipLeft = Math.max(16, Math.min(r.left + r.width / 2 - tipW / 2, window.innerWidth - tipW - 16))
      tipTop = Math.max(16, Math.min(tipTop, window.innerHeight - tipH - 16))
      setPos({ top: tipTop + 'px', left: tipLeft + 'px' })
    }, 450)
    return function() {
      clearTimeout(timer)
      if (!el) return
      el.style.boxShadow    = origBox
      el.style.zIndex       = origZ
      el.style.borderRadius = origRad
    }
  }, [step])
  if (!current) return null
  var isLast = step === TOUR_STEPS.length - 1
  return (
    <>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(14,21,35,0.55)', pointerEvents: 'none' }} />
      <div role="dialog" aria-modal="false" aria-label={'Tour step ' + (step + 1) + ' of ' + TOUR_STEPS.length + ': ' + current.title} style={{ position: 'fixed', zIndex: 1002, width: '300px', background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', padding: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', top: pos.top, left: pos.left, transform: pos.transform || 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: YELLOW, letterSpacing: '3px', textTransform: 'uppercase' }}>Step {step + 1} of {TOUR_STEPS.length}</span>
          <button onClick={onSkip} aria-label="Skip tour" style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Skip</button>
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>{current.title}</h3>
        <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.6, marginBottom: '16px' }}>{current.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '4px' }} aria-hidden="true">
            {TOUR_STEPS.map(function(_, i) {
              return <div key={i} style={{ width: i === step ? '16px' : '5px', height: '5px', borderRadius: '99px', background: i === step ? YELLOW : BDR, transition: 'all 0.2s ease' }} />
            })}
          </div>
          <button onClick={onNext} autoFocus style={{ padding: '8px 20px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{isLast ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </>
  )
}

// ─── TourEndModal ─────────────────────────────────────────────────────────
function TourEndModal({ onClose }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tour-end-title" style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,21,35,0.55)', padding: '24px' }}>
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '40px 36px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
        <img src="/mascot-onboarding.png" alt="" aria-hidden="true" style={{ width: '160px', height: 'auto', margin: '0 auto 20px', display: 'block' }} />
        <h2 id="tour-end-title" style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>You're all set!</h2>
        <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.65, marginBottom: '24px' }}>You know your way around the board. Explore your organizations, follow new ones, and stay on top of what matters.</p>
        <button onClick={onClose} autoFocus style={{ padding: '11px 32px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Get Started</button>
      </div>
    </div>
  )
}

// ─── EventRow ─────────────────────────────────────────────────────────────
function EventRow({ event, to }) {
  var d = fmtDate(event.start_time)
  return (
    <Link to={to || ('/organizations/' + (event.organization && event.organization.id) + '/events')} aria-label={'Event: ' + event.title} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', padding: '10px 14px', textDecoration: 'none', marginBottom: '6px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
      <div style={{ flexShrink: 0, width: '42px', textAlign: 'center', background: '#EFF6FF', borderRadius: '8px', padding: '5px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '1px' }}>{d.mon}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: BLUE, lineHeight: 1 }}>{d.day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
        <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>{event.organization ? event.organization.name : ''}{event.location ? ' · ' + event.location : ''}</p>
      </div>
      <span style={{ fontSize: '11px', color: MUTED, flexShrink: 0 }}>{d.time}</span>
    </Link>
  )
}

// ─── SavedEventCard ───────────────────────────────────────────────────────
var _cardShadow = '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'

function SavedEventCard({ save, onUnsave, removing }) {
  var navigate = useNavigate()
  var evt = save.events
  if (!evt) return null
  var org = evt.organizations
  var orgInitials = org && org.name ? org.name.split(' ').map(function(w) { return w[0] }).join('').slice(0,2).toUpperCase() : '?'
  var d = fmtDate(evt.start_time)
  return (
    <article role="listitem" style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: _cardShadow }} aria-label={evt.title + ' saved event'}>
      <div style={{ height: '120px', background: '#F1F5F9', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={function() { navigate('/events/' + evt.id) }} role="link" tabIndex={0} aria-label={'View ' + evt.title} onKeyDown={function(e) { if (e.key === 'Enter') navigate('/events/' + evt.id) }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <button onClick={function(e) { e.stopPropagation(); onUnsave(save.id, evt.title) }} disabled={removing === save.id} aria-label={'Remove ' + evt.title + ' from saved events'} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: removing === save.id ? 0.5 : 1 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5B731" stroke="#F5B731" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '8px', lineHeight: 1.35, cursor: 'pointer' }} onClick={function() { navigate('/events/' + evt.id) }}>{evt.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          {org && org.logo_url
            ? <img src={org.logo_url} alt="" aria-hidden="true" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#3B82F6', color: '#fff', fontSize: '7px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{orgInitials}</div>
          }
          <span style={{ fontSize: '11px', color: TEXT2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org ? org.name : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: '11px', color: MUTED }}>{d.mon} {d.day}{d.time ? ' · ' + d.time : ''}</span>
        </div>
        {evt.location && <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span style={{ fontSize: '11px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.location}</span></div>}
        <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
          <button onClick={function() { navigate('/events/' + evt.id) }} style={{ width: '100%', padding: '6px 12px', background: BLUE, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Event
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, actionLabel, onAction }) {
  return (
    <div role="status" style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed ' + BDR, borderRadius: '12px' }}>
      <div style={{ color: MUTED, opacity: 0.4, margin: '0 auto 14px', width: 'fit-content' }}>{icon}</div>
      <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: MUTED, marginBottom: onAction ? '20px' : 0 }}>{desc}</p>
      {onAction && (
        <button onClick={onAction} style={{ padding: '9px 18px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">{actionLabel}</button>
      )}
    </div>
  )
}

// ─── WidgetShell ──────────────────────────────────────────────────────────
function WidgetShell({ id, label, onRemove, children }) {
  return (
    <section aria-labelledby={id + '-heading'} style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', padding: '16px 18px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 id={id + '-heading'} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: YELLOW, margin: 0 }}>{label}</h2>
        <button onClick={onRemove} aria-label={'Remove ' + label + ' widget'} title="Remove widget" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: '2px', borderRadius: '4px', display: 'flex' }} className="focus:outline-none focus:ring-2 focus:ring-gray-400"><IcoX /></button>
      </div>
      {children}
    </section>
  )
}

// ─── ActivityIcon + RecentActivityFeed ───────────────────────────────────
function ActivityIcon({ type }) {
  var s = { width:'16px', height:'16px', flexShrink:0 }
  if (type === 'member_joined') return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
  if (type === 'document')      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  if (type === 'poll')          return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  if (type === 'survey')        return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
  if (type === 'signup_form')   return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
  if (type === 'program')       return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
  if (type === 'opportunity')   return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
  if (type === 'funding')       return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
function getActivityConfig(type) {
  if (type === 'member_joined') return { bg:'#DBEAFE', color:'#3B82F6', label:'New Member'  }
  if (type === 'document')      return { bg:'#EDE9FE', color:'#8B5CF6', label:'Document'    }
  if (type === 'poll')          return { bg:'#DCFCE7', color:'#22C55E', label:'Poll'         }
  if (type === 'survey')        return { bg:'#FEF3C7', color:'#F59E0B', label:'Survey'       }
  if (type === 'signup_form')   return { bg:'#CCFBF1', color:'#14B8A6', label:'Sign-Up Form' }
  if (type === 'program')       return { bg:'#E0E7FF', color:'#6366F1', label:'Program'      }
  if (type === 'opportunity')   return { bg:'#DBEAFE', color:'#3B82F6', label:'Opportunity'  }
  if (type === 'funding')       return { bg:'#DCFCE7', color:'#22C55E', label:'Funding'      }
  return { bg:'#F1F5F9', color:'#64748B', label:'Activity' }
}

// ─── Task 41 — RecentActivityFeed with read state, bulk actions, checkboxes ─
function RecentActivityFeed({ items, loading, orgColors, organizations, readActivityIds, onMarkRead, onMarkUnread, onMarkAllRead, onDeleteAll }) {
  var [actOrgFilter, setActOrgFilter] = useState('all')
  var [selectedIds,  setSelectedIds]  = useState([])   // checkbox selection

  var orgs = []
  var seen = {}
  ;(items || []).forEach(function(item) {
    if (item.orgId && !seen[item.orgId]) { seen[item.orgId] = true; orgs.push({ id: item.orgId, name: item.orgName }) }
  })
  var filtered = actOrgFilter === 'all' ? (items || []) : (items || []).filter(function(i) { return i.orgId === actOrgFilter })

  // Clear selection when filter changes so counts stay accurate
  function setOrgFilter(id) { setActOrgFilter(id); setSelectedIds([]) }

  var filteredIds    = filtered.map(function(i) { return i.id })
  var allSelected    = filteredIds.length > 0 && filteredIds.every(function(id) { return selectedIds.includes(id) })
  var someSelected   = selectedIds.length > 0 && !allSelected

  function toggleSelectAll() {
    if (allSelected) { setSelectedIds([]) }
    else { setSelectedIds(filteredIds) }
  }
  function toggleSelectOne(id) {
    setSelectedIds(function(prev) {
      return prev.includes(id) ? prev.filter(function(i) { return i !== id }) : prev.concat([id])
    })
  }
  function handleDeleteSelected() {
    onDeleteAll(selectedIds)   // pass selected IDs — parent deletes only those
    setSelectedIds([])
  }

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading recent activity">
        {[1,2,3,4,5].map(function(i) {
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 0', borderBottom:'1px solid ' + BDR }}>
              <div style={{ width:'16px', height:'16px', borderRadius:'4px', background:'#E2E8F0', flexShrink:0 }} />
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#E2E8F0', flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ width:'55%', height:'13px', background:'#E2E8F0', borderRadius:'4px', marginBottom:'6px' }} />
                <div style={{ width:'35%', height:'11px', background:'#F1F5F9', borderRadius:'4px' }} />
              </div>
              <div style={{ width:'60px', height:'20px', background:'#F1F5F9', borderRadius:'99px' }} />
            </div>
          )
        })}
      </div>
    )
  }
  if (!items || items.length === 0) {
    return (
      <div role="status" style={{ textAlign:'center', padding:'48px 24px', border:'1px dashed ' + BDR, borderRadius:'12px' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:MUTED }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <p style={{ fontSize:'15px', fontWeight:700, color:TEXT, marginBottom:'6px' }}>No recent activity</p>
        <p style={{ fontSize:'13px', color:MUTED }}>Activity from your organizations will appear here as it happens.</p>
      </div>
    )
  }

  var unreadCount = filtered.filter(function(i) { return !readActivityIds.includes(i.id) }).length

  return (
    <div>
      {/* Bulk actions row */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        {orgs.length > 1 && (
          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
            {[{ id:'all', name:'All Orgs' }].concat(orgs).map(function(org) {
              var isActive = actOrgFilter === org.id
              return (
                <button key={org.id} onClick={function() { setOrgFilter(org.id) }} aria-pressed={isActive} style={{ padding:'4px 11px', borderRadius:'99px', fontSize:'12px', fontWeight: isActive ? 700 : 500, border:'1px solid ' + (isActive ? BLUE : BDR), background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent', color: isActive ? BLUE : MUTED, cursor:'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">{org.name}</button>
              )
            })}
          </div>
        )}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
          {/* Delete selected — only shown when items are checked */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              aria-label={'Delete ' + selectedIds.length + ' selected items'}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'8px', border:'1px solid rgba(239,68,68,0.35)', background:'rgba(239,68,68,0.06)', color:RED, fontSize:'12px', fontWeight:700, cursor:'pointer' }}
              className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <IcoTrash /> Delete selected ({selectedIds.length})
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              aria-label={'Mark all ' + unreadCount + ' items as read'}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'8px', border:'1px solid ' + BDR, background:'transparent', color:TEXT2, fontSize:'12px', fontWeight:600, cursor:'pointer' }}
              className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <IcoCheck /> Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={function() { onDeleteAll(null); setSelectedIds([]) }}
              aria-label="Clear all recent activity"
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'8px', border:'1px solid rgba(239,68,68,0.25)', background:'transparent', color:RED, fontSize:'12px', fontWeight:600, cursor:'pointer' }}
              className="hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <IcoTrash /> Clear all
            </button>
          )}
          <span style={{ fontSize:'12px', color:MUTED }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign:'center', fontSize:'13px', color:MUTED, padding:'24px 0' }}>No activity for this organization yet.</p>
      ) : (
        <div role="list" aria-label="Recent activity">
          {/* Select-all header row */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'6px 0 10px', borderBottom:'1px solid ' + BDR, marginBottom:'2px' }}>
            <input
              type="checkbox"
              id="act-select-all"
              checked={allSelected}
              ref={function(el) { if (el) el.indeterminate = someSelected }}
              onChange={toggleSelectAll}
              aria-label={allSelected ? 'Deselect all items' : 'Select all items'}
              style={{ width:'15px', height:'15px', accentColor:BLUE, cursor:'pointer', flexShrink:0 }}
            />
            <label htmlFor="act-select-all" style={{ fontSize:'11px', fontWeight:600, color:MUTED, cursor:'pointer', userSelect:'none' }}>
              {allSelected ? 'Deselect all' : someSelected ? selectedIds.length + ' selected' : 'Select all'}
            </label>
          </div>

          {filtered.map(function(item, idx) {
            var cfg       = getActivityConfig(item.type)
            var isRead    = readActivityIds.includes(item.id)
            var isChecked = selectedIds.includes(item.id)
            var org       = (organizations || []).find(function(o) { return o.id === item.orgId })
            var orgIdx    = (organizations || []).findIndex(function(o) { return o.id === item.orgId })
            var fallbackBg = AVATAR_COLORS[orgIdx >= 0 ? orgIdx % AVATAR_COLORS.length : 0]
            return (
              <div
                key={item.id}
                role="listitem"
                style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'12px 0', borderBottom: idx < filtered.length - 1 ? '1px solid ' + BDR : 'none', opacity: isRead ? 0.55 : 1, transition: 'opacity 0.15s', background: isChecked ? 'rgba(59,130,246,0.04)' : 'transparent', borderRadius: isChecked ? '6px' : 0 }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={function() { toggleSelectOne(item.id) }}
                  aria-label={'Select: ' + item.title}
                  style={{ width:'15px', height:'15px', accentColor:BLUE, cursor:'pointer', flexShrink:0, marginTop:'10px' }}
                />
                {/* Org avatar */}
                {org && org.logo_url
                  ? <img src={org.logo_url} alt={org.name + ' logo'} style={{ width:'36px', height:'36px', borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'1px solid ' + BDR }} />
                  : <div style={{ width:'36px', height:'36px', borderRadius:'50%', flexShrink:0, background: fallbackBg, color:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700 }}>{getInitials(item.orgName)}</div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight: isRead ? 400 : 600, color: isRead ? TEXT2 : TEXT, margin:'0 0 3px', lineHeight:1.4 }}>{item.title}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                    {item.orgName && <span style={{ fontSize:'11px', fontWeight:600, color:BLUE }}>{item.orgName}</span>}
                    <span style={{ fontSize:'11px', color:MUTED }}>{timeAgo(item.timestamp)}</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                  <span style={{ fontSize:'11px', fontWeight:500, color:MUTED }}>{cfg.label}</span>
                  <button
                    onClick={function() { isRead ? onMarkUnread(item.id) : onMarkRead(item.id) }}
                    aria-label={isRead ? 'Mark ' + item.title + ' as unread' : 'Mark ' + item.title + ' as read'}
                    title={isRead ? 'Mark unread' : 'Mark read'}
                    style={{ width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid ' + BDR, borderRadius:'6px', background: isRead ? '#F1F5F9' : 'transparent', color: isRead ? MUTED : GREEN, cursor:'pointer', flexShrink:0 }}
                    className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isRead ? <IcoEyeOff /> : <IcoEye />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── OrgColorLegend ───────────────────────────────────────────────────────
function OrgColorLegend({ organizations, orgColors, onColorChange }) {
  var [openFor, setOpenFor] = useState(null)
  var ref = useRef(null)
  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpenFor(null) }
    document.addEventListener('mousedown', handler)
    return function() { document.removeEventListener('mousedown', handler) }
  }, [])
  if (!organizations || organizations.length === 0) return null
  return (
    <div ref={ref} style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', padding: '14px', marginBottom: '14px', boxShadow: _cardShadow }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: YELLOW, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '10px' }}>Card Colors</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {organizations.map(function(org, idx) {
          var savedColor   = orgColors[org.id]
          var paletteMatch = savedColor ? PALETTE.find(function(p) { return p.color === savedColor }) : null
          var scheme       = paletteMatch ? { card: paletteMatch.card, tag: paletteMatch.color } : { card: PALETTE[idx % PALETTE.length].card, tag: PALETTE[idx % PALETTE.length].color }
          var isOpen = openFor === org.id
          return (
            <div key={org.id} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: BG, borderRadius: '8px', border: '1px solid ' + BDR }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: scheme.card, border: '1px solid ' + scheme.tag, flexShrink: 0 }} aria-hidden="true" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: TEXT }}>{org.name}</span>
                <button onClick={function(e) { e.stopPropagation(); setOpenFor(isOpen ? null : org.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: '2px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" aria-label={'Change card color for ' + org.name}><IcoPalette /></button>
              </div>
              {isOpen && (
                <div onClick={function(e) { e.stopPropagation() }} style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50, background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', padding: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '6px', width: '172px' }} role="listbox" aria-label={'Color options for ' + org.name}>
                  {PALETTE.map(function(p) {
                    var selected = (orgColors[org.id] || PALETTE[idx % PALETTE.length].color) === p.color
                    return (
                      <button key={p.color} role="option" aria-selected={selected} onClick={function() { onColorChange(org.id, p.color); setOpenFor(null) }} style={{ width: '22px', height: '22px', borderRadius: '5px', background: p.card, border: selected ? '3px solid ' + TEXT : '2px solid ' + p.color, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={p.color} />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── InlineDashboardCalendar ──────────────────────────────────────────────
function InlineDashboardCalendar({ events, organizations, orgColors, onColorChange, onSelectSlot }) {
  var navigate = useNavigate()
  var [calView,     setCalView]     = useState('month')
  var [calDate,     setCalDate]     = useState(new Date())
  var [selectedOrg, setSelectedOrg] = useState('all')
  function getOrgColor(orgId, fallbackIdx) { return orgColors[orgId] || PALETTE[fallbackIdx % PALETTE.length].color }
  var calEvents = events
    .filter(function(ev) { return selectedOrg === 'all' || (ev.organization_id || (ev.organization && ev.organization.id)) === selectedOrg })
    .map(function(ev) {
      var orgId  = ev.organization_id || (ev.organization && ev.organization.id)
      var orgIdx = organizations.findIndex(function(o) { return o.id === orgId })
      var color  = getOrgColor(orgId, orgIdx >= 0 ? orgIdx : 0)
      return { id: ev.id, title: ev.title, start: new Date(ev.start_time), end: ev.end_time ? new Date(ev.end_time) : new Date(ev.start_time), resource: { orgName: ev.organization ? ev.organization.name : '', color: color } }
    })
  function eventStyleGetter(event) { return { style: { backgroundColor: event.resource.color, borderRadius: '6px', opacity: 0.9, color: 'white', border: '2px solid ' + event.resource.color, fontSize: '0.8rem', fontWeight: '500', padding: '2px 5px' } } }
  function handleSelectEvent(event) { navigate('/events/' + event.id) }
  function CustomToolbar(toolbar) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={function() { toolbar.onNavigate('TODAY') }} style={{ padding: '6px 14px', background: BLUE, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Go to today">Today</button>
          <button onClick={function() { toolbar.onNavigate('PREV') }} style={{ padding: '6px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Previous"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT, minWidth: '140px', textAlign: 'center' }}>{format(toolbar.date, 'MMMM yyyy')}</span>
          <button onClick={function() { toolbar.onNavigate('NEXT') }} style={{ padding: '6px', background: 'transparent', border: '1px solid ' + BDR, borderRadius: '8px', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Next"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {['month','week','day'].map(function(v) {
              var active = calView === v
              return <button key={v} onClick={function() { setCalView(v); toolbar.onView(v) }} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? '#FFFFFF' : 'transparent', color: active ? TEXT : MUTED, boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={v + ' view'} aria-pressed={active}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            })}
          </div>
          {organizations.length > 1 && (
            <select value={selectedOrg} onChange={function(e) { setSelectedOrg(e.target.value) }} style={{ padding: '6px 12px', background: '#F8FAFC', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, fontSize: '13px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Filter by organization">
              <option value="all">All Organizations</option>
              {organizations.map(function(org) { return <option key={org.id} value={org.id}>{org.name}</option> })}
            </select>
          )}
        </div>
      </div>
    )
  }
  return (
    <div>
      <OrgColorLegend organizations={organizations} orgColors={orgColors} onColorChange={onColorChange} />
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', padding: '20px', boxShadow: _cardShadow }}>
        <div style={{ height: '620px' }}>
          <Calendar localizer={_localizer} events={calEvents} startAccessor="start" endAccessor="end" view={calView} onView={setCalView} date={calDate} onNavigate={setCalDate} onSelectEvent={handleSelectEvent} selectable onSelectSlot={onSelectSlot} eventPropGetter={eventStyleGetter} components={{ toolbar: CustomToolbar }} popup tooltipAccessor={function(event) { return event.title + ' — ' + event.resource.orgName }} style={{ height: '100%' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Task 40 — InlineDashboardEventList with date range filter ────────────
var DATE_RANGE_PRESETS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'thisweek', label: 'This week' },
  { key: 'thismonth', label: 'This month' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
  { key: 'custom', label: 'Custom range' },
]

function InlineDashboardEventList({ events, organizations, orgColors, onColorChange }) {
  var navigate = useNavigate()
  var [listSearch,    setListSearch]    = useState('')
  var [listDateRange, setListDateRange] = useState('upcoming')   // replaces listDateFilter
  var [customFrom,    setCustomFrom]    = useState('')
  var [customTo,      setCustomTo]      = useState('')
  var [listOrgFilter, setListOrgFilter] = useState('all')
  var [listSort,      setListSort]      = useState('asc')

  function getScheme(orgId, fallbackIdx) {
    var saved = orgColors[orgId]
    if (saved) { var match = PALETTE.find(function(p) { return p.color === saved }); if (match) return { card: match.card, tag: match.color, tagText: match.tagText } }
    var p = PALETTE[fallbackIdx % PALETTE.length]
    return { card: p.card, tag: p.color, tagText: p.tagText }
  }

  var now = new Date()

  // Build date bounds from preset or custom
  function getDateBounds() {
    if (listDateRange === 'upcoming') return { from: now, to: null }
    if (listDateRange === 'past')     return { from: null, to: now }
    if (listDateRange === 'all')      return { from: null, to: null }
    if (listDateRange === 'thisweek') {
      var startOfWk = new Date(now); startOfWk.setDate(now.getDate() - now.getDay()); startOfWk.setHours(0,0,0,0)
      var endOfWk   = new Date(startOfWk); endOfWk.setDate(startOfWk.getDate() + 6); endOfWk.setHours(23,59,59,999)
      return { from: startOfWk, to: endOfWk }
    }
    if (listDateRange === 'thismonth') {
      var startOfMo = new Date(now.getFullYear(), now.getMonth(), 1)
      var endOfMo   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return { from: startOfMo, to: endOfMo }
    }
    if (listDateRange === 'custom') {
      return {
        from: customFrom ? new Date(customFrom + 'T00:00:00') : null,
        to:   customTo   ? new Date(customTo   + 'T23:59:59') : null,
      }
    }
    return { from: null, to: null }
  }

  var bounds   = getDateBounds()
  var filtered = events.slice()
  if (listSearch)              filtered = filtered.filter(function(ev) { return ev.title.toLowerCase().includes(listSearch.toLowerCase()) || (ev.location && ev.location.toLowerCase().includes(listSearch.toLowerCase())) })
  if (listOrgFilter !== 'all') filtered = filtered.filter(function(ev) { return (ev.organization_id || (ev.organization && ev.organization.id)) === listOrgFilter })
  if (bounds.from)             filtered = filtered.filter(function(ev) { return new Date(ev.start_time) >= bounds.from })
  if (bounds.to)               filtered = filtered.filter(function(ev) { return new Date(ev.start_time) <= bounds.to })
  filtered.sort(function(a, b) { var da = new Date(a.start_time), db = new Date(b.start_time); return listSort === 'asc' ? da - db : db - da })

  var inpStyle = { width: '100%', padding: '7px 10px', fontSize: '13px', background: '#FFFFFF', border: '1px solid ' + BDR, borderRadius: '8px', color: TEXT, outline: 'none' }
  var lblStyle = { display: 'block', fontSize: '10px', fontWeight: 700, color: MUTED, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div>
      {/* Filter panel */}
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', padding: '14px', marginBottom: '12px', boxShadow: _cardShadow }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: '12px', marginBottom: listDateRange === 'custom' ? '12px' : 0 }}>
          <div>
            <label htmlFor="il-search" style={lblStyle}>Search</label>
            <input id="il-search" type="text" placeholder="Name, location..." value={listSearch} onChange={function(e) { setListSearch(e.target.value) }} style={inpStyle} className="focus:ring-2 focus:ring-blue-500" />
          </div>
          {organizations.length > 1 && (
            <div>
              <label htmlFor="il-org" style={lblStyle}>Organization</label>
              <select id="il-org" value={listOrgFilter} onChange={function(e) { setListOrgFilter(e.target.value) }} style={inpStyle} className="focus:ring-2 focus:ring-blue-500">
                <option value="all">All Organizations</option>
                {organizations.map(function(org) { return <option key={org.id} value={org.id}>{org.name}</option> })}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="il-sort" style={lblStyle}>Sort</label>
            <select id="il-sort" value={listSort} onChange={function(e) { setListSort(e.target.value) }} style={inpStyle} className="focus:ring-2 focus:ring-blue-500">
              <option value="asc">Earliest First</option>
              <option value="desc">Latest First</option>
            </select>
          </div>
        </div>

        {/* Date range preset chips — replaces "Time Period" dropdown */}
        <div style={{ marginTop: '12px' }}>
          <p style={lblStyle}>Date Range</p>
          <div role="group" aria-label="Date range filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {DATE_RANGE_PRESETS.map(function(preset) {
              var isActive = listDateRange === preset.key
              return (
                <button
                  key={preset.key}
                  onClick={function() { setListDateRange(preset.key) }}
                  aria-pressed={isActive}
                  style={{ padding: '5px 13px', borderRadius: '99px', border: '1px solid ' + (isActive ? BLUE : BDR), background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent', color: isActive ? BLUE : MUTED, fontSize: '12px', fontWeight: isActive ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom date inputs — only shown when custom is selected */}
        {listDateRange === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label htmlFor="il-from" style={lblStyle}>From</label>
              <input id="il-from" type="date" value={customFrom} onChange={function(e) { setCustomFrom(e.target.value) }} style={inpStyle} className="focus:ring-2 focus:ring-blue-500" aria-label="Start date" />
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label htmlFor="il-to" style={lblStyle}>To</label>
              <input id="il-to" type="date" value={customTo} min={customFrom} onChange={function(e) { setCustomTo(e.target.value) }} style={inpStyle} className="focus:ring-2 focus:ring-blue-500" aria-label="End date" />
            </div>
          </div>
        )}
      </div>

      <OrgColorLegend organizations={organizations} orgColors={orgColors} onColorChange={onColorChange} />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px dashed ' + BDR, borderRadius: '12px', color: MUTED }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>No events found</p>
          <p style={{ fontSize: '13px' }}>Try adjusting your filters.</p>
        </div>
      ) : (
        <div role="list" aria-label="Events" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '20px' }}>
          {filtered.map(function(event, index) {
            var orgId  = event.organization_id || (event.organization && event.organization.id)
            var orgIdx = organizations.findIndex(function(o) { return o.id === orgId })
            var scheme = getScheme(orgId, orgIdx >= 0 ? orgIdx : index)
            var d      = fmtDate(event.start_time)
            return (
              <article key={event.id} role="listitem" style={{ background: scheme.card, borderRadius: '12px', padding: '16px', cursor: 'pointer', boxShadow: _cardShadow }} onClick={function() { navigate('/events/' + event.id) }} tabIndex={0} onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/events/' + event.id) } }} aria-label={event.title + ' event'}>
                <div style={{ fontSize: '17px', fontWeight: 400, color: '#374151', lineHeight: 1.5, marginBottom: '10px', fontFamily: "'Patrick Hand', sans-serif" }}>{event.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', marginBottom: '4px' }}><IcoCalendar /><span>{d.mon} {d.day}{d.time ? ' · ' + d.time : ''}</span></div>
                {event.location && event.location !== 'Virtual Event' && <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>{event.location}</div>}
                {event.organization && <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px' }}>{event.organization.name}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={function(e) { e.stopPropagation(); navigate('/events/' + event.id) }} style={{ padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: scheme.tag, color: scheme.tagText }} aria-label={'View ' + event.title} className="focus:outline-none focus:ring-2 focus:ring-blue-500">View Event</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────
function UnifiedDashboard() {
  var navigate = useNavigate()

  // ── Data state ──
  var [organizations,       setOrganizations]       = useState([])
  var [activities,          setActivities]          = useState([])
  var [upcomingEvents,      setUpcomingEvents]       = useState([])
  var [savedEvents,         setSavedEvents]          = useState([])
  var [recentChats,         setRecentChats]          = useState([])
  var [followedOrgs,        setFollowedOrgs]         = useState([])
  var [followedEvents,      setFollowedEvents]       = useState([])
  var [myGroups,            setMyGroups]             = useState([])
  var [calendarEvents,      setCalendarEvents]       = useState([])
  var [recentActivity,      setRecentActivity]       = useState([])
  var [loading,             setLoading]              = useState(true)
  var [error,               setError]                = useState(null)
  var [currentUserId,       setCurrentUserId]        = useState(null)
  var [memberName,          setMemberName]           = useState('')
  var [removingSaved,       setRemovingSaved]        = useState(null)
  var [unfollowingId,       setUnfollowingId]        = useState(null)
  var [activityLoading,     setActivityLoading]      = useState(false)

  // ── UI state ──
  var [activeTab,           setActiveTab]            = useState('all')
  var [eventsView,          setEventsView]           = useState('list')
  var [orgFilter,           setOrgFilter]            = useState('all')
  var [dateFilter,          setDateFilter]           = useState('week')

  // ── localStorage state (Rec #2: capped at LS_CAP) ──
  var [dismissedActivities, setDismissedActivities]  = useState(function() { return lsRead('dismissedActivities') })
  var [importantActivities, setImportantActivities]  = useState(function() { return lsRead('importantActivities') })
  // Task 41 — read activity ids
  var [readActivityIds,     setReadActivityIds]      = useState(function() { return lsRead('readActivityIds') })

  // ── Preferences state ──
  var [activeWidgets,       setActiveWidgets]        = useState(['orgs', 'chats'])
  var [orgColors,           setOrgColors]            = useState({})
  var [showCustomize,       setShowCustomize]        = useState(false)
  var [prefLoaded,          setPrefLoaded]           = useState(false)

  // ── Modal state ──
  var [showCreateModal,     setShowCreateModal]      = useState(false)
  var [showCreateEvent,     setShowCreateEvent]      = useState(false)
  var [showInviteOrg,       setShowInviteOrg]        = useState(false)
  var [selectedOrgForEvent, setSelectedOrgForEvent]  = useState(null)
  var [createEventPrefill,  setCreateEventPrefill]   = useState(null)

  // ── Tour state ──
  var [tourStep,    setTourStep]    = useState(-1)
  var [showTourEnd, setShowTourEnd] = useState(false)

  // ── Tour refs ──
  var statsRef     = useRef(null)
  var feedRef      = useRef(null)
  var orgsRef      = useRef(null)
  var customizeRef = useRef(null)
  var tourRefs     = [statsRef, feedRef, orgsRef, customizeRef]

  // ── Load Patrick Hand font ──
  useEffect(function() {
    var link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap&subset=latin'
    link.rel  = 'stylesheet'
    document.head.appendChild(link)
    return function() { if (document.head.contains(link)) document.head.removeChild(link) }
  }, [])

  // ── Auth ──
  useEffect(function() {
    var sub = supabase.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_IN' && session) fetchAll()
      else if (event === 'SIGNED_OUT') navigate('/login')
    })
    async function check() {
      var res = await supabase.auth.getSession()
      if (res.data.session) fetchAll()
      else setLoading(false)
    }
    check()
    return function() { sub.data.subscription && sub.data.subscription.unsubscribe() }
  }, [])

  // ── Auto-start tour ──
  useEffect(function() {
    if (loading) return
    var done = localStorage.getItem('ud_tour_done')
    if (!done) {
      var timer = setTimeout(function() { setTourStep(0) }, 900)
      return function() { clearTimeout(timer) }
    }
  }, [loading])

  // ── Preferences ──
  async function loadPreferences(userId) {
    var res = await supabase.from('dashboard_preferences').select('widgets, org_colors').eq('user_id', userId).single()
    if (res.data) {
      if (res.data.widgets && res.data.widgets.length > 0) {
        var saved = res.data.widgets
        var withTasks = saved.includes('tasks') ? saved : saved.concat(['tasks'])
        setActiveWidgets(withTasks)
      }
      if (res.data.org_colors) setOrgColors(res.data.org_colors)
    }
    setPrefLoaded(true)
  }

  async function savePreferences(widgets, colors) {
    if (!currentUserId) return
    await supabase.from('dashboard_preferences').upsert({ user_id: currentUserId, widgets: widgets, org_colors: colors, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }

  // ── Rec #3: Split fetch functions ─────────────────────────────────────────

  async function loadProfile(userId) {
    var res = await supabase.from('members').select('first_name, last_name').eq('user_id', userId).single()
    if (res.data) setMemberName((res.data.first_name + ' ' + (res.data.last_name || '')).trim())
  }

  async function loadOrgs(userId) {
    var res = await supabase
      .from('memberships')
      .select('id, role, status, custom_title, joined_date, organization:organizations (id, name, description, type, logo_url)')
      .eq('member_id', userId)
      .eq('status', 'active')
      .order('joined_date', { ascending: false })
    if (res.error) throw res.error
    var orgsWithStats = await Promise.all((res.data || []).map(async function(membership) {
      var orgId = membership.organization.id
      var annRes = await supabase.from('announcements').select('id').eq('organization_id', orgId).in('visibility', ['public', 'members'])
      var announcementIds = (annRes.data || []).map(function(a) { return a.id })
      var unreadCount = 0
      if (announcementIds.length > 0) {
        var reads = (await supabase.from('announcement_reads').select('announcement_id').eq('member_id', userId).in('announcement_id', announcementIds)).data
        var readIds = new Set((reads || []).map(function(r) { return r.announcement_id }))
        unreadCount = announcementIds.length - readIds.size
      }
      var eventCount = (await supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('start_time', new Date().toISOString()).in('visibility', ['public', 'members'])).count
      return Object.assign({}, membership.organization, { role: membership.role, custom_title: membership.custom_title, eventCount: eventCount || 0, unreadCount: unreadCount })
    }))
    setOrganizations(orgsWithStats)
    return orgsWithStats
  }

  async function loadGroups(userId) {
    try {
      var res = await supabase
        .from('org_group_members')
        .select('group:org_groups (id, name, organization_id, type, organizations(name))')
        .eq('member_id', userId)
        .eq('status', 'active')
      if (res.data) setMyGroups(res.data.map(function(gm) { return gm.group }).filter(Boolean))
    } catch(e) { console.error('loadGroups error:', e); setMyGroups([]) }
  }

  async function loadFollowed(userId) {
    var followRes = await supabase
      .from('org_followers')
      .select('org_id, organizations (id, name, logo_url, type)')
      .eq('user_id', userId)
    var followedOrgData = (followRes.data || []).map(function(f) { return f.organizations }).filter(Boolean)
    setFollowedOrgs(followedOrgData)
    if (followedOrgData.length > 0) {
      var followedOrgIds = followedOrgData.map(function(o) { return o.id })
      var evtRes = await supabase
        .from('events')
        .select('id, title, start_time, location, organization:organizations (id, name)')
        .in('organization_id', followedOrgIds)
        .gte('start_time', new Date().toISOString())
        .eq('visibility', 'public')
        .order('start_time', { ascending: true })
        .limit(12)
      setFollowedEvents(evtRes.data || [])
    }
  }

  async function loadSaved(userId) {
    var res = await supabase
      .from('event_saves')
      .select('id, events(id, title, start_time, location, organizations(id, name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12)
    setSavedEvents(res.data || [])
  }

  async function loadChats() {
    var res = await supabase
      .from('chat_messages')
      .select('id, content, created_at, chat_channels(name, organization_id, organizations(name))')
      .order('created_at', { ascending: false })
      .limit(4)
    if (res.data) setRecentChats(res.data)
  }

  // Task 42: include start_time in event feed query
  async function loadFeed(orgIds) {
    var evtUpcoming = await supabase
      .from('events')
      .select('id, title, start_time, location, organization:organizations (id, name, type)')
      .in('organization_id', orgIds)
      .gte('start_time', new Date().toISOString())
      .in('visibility', ['public', 'members'])
      .order('start_time', { ascending: true })
      .limit(5)
    setUpcomingEvents(evtUpcoming.data || [])

    var annFeed = await supabase
      .from('announcements')
      .select('id, title, created_at, priority, organization:organizations (id, name)')
      .in('organization_id', orgIds)
      .in('visibility', ['public', 'members'])
      .order('created_at', { ascending: false })
      .limit(30)

    // Task 42: fetch start_time alongside events in the feed
    var evtFeed = await supabase
      .from('events')
      .select('id, title, start_time, created_at, organization:organizations (id, name)')
      .in('organization_id', orgIds)
      .in('visibility', ['public', 'members'])
      .order('created_at', { ascending: false })
      .limit(30)

    var docFeed = await supabase
      .from('documents')
      .select('id, title, created_at, organization:organizations (id, name)')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(30)

      var programFeed = await supabase
      .from('org_programs')
      .select('id, name, created_at, organization:organizations (id, name)')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
      .limit(20)

var oppFeed = await supabase
      .from('org_opportunities')
      .select('id, title, created_at, organization:organizations (id, name)')
      .in('organization_id', orgIds)
      .neq('visibility', 'draft')
      .order('created_at', { ascending: false })
      .limit(20)

    var fundFeed = await supabase
      .from('org_funding')
      .select('id, title, created_at, organization:organizations (id, name)')
      .in('organization_id', orgIds)
      .neq('visibility', 'draft')
      .order('created_at', { ascending: false })
      .limit(20)

    var all = [
      ...(annFeed.data || []).map(function(item) {
        return { id: 'announcement-' + item.id, type: 'announcement', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, priority: item.priority, time: timeAgo(item.created_at) }
      }),
      ...(evtFeed.data || []).map(function(item) {
        return { id: 'event-' + item.id, type: 'event', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, startTime: item.start_time, time: timeAgo(item.created_at) }
      }),
      ...(docFeed.data || []).map(function(item) {
        return { id: 'document-' + item.id, type: 'document', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) }
      }),
      ...(programFeed.data || []).map(function(item) {
        return { id: 'program-' + item.id, type: 'program', title: item.name, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) }
      }),
      ...(oppFeed.data || []).map(function(item) {
        return { id: 'opportunity-' + item.id, type: 'opportunity', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) }
      }),
      ...(fundFeed.data || []).map(function(item) {
        return { id: 'funding-' + item.id, type: 'funding', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) }
      }),
    ]
    all.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp) })
    setActivities(all)
  }

  async function loadCalendar(orgIds) {
    var res = await supabase
      .from('events')
      .select('id, title, start_time, location, organization:organizations (id, name)')
      .in('organization_id', orgIds)
      .in('visibility', ['public', 'members'])
      .order('start_time', { ascending: true })
      .limit(200)
    setCalendarEvents(res.data || [])
  }

  async function loadRecentActivity(orgIds) {
    if (!orgIds || orgIds.length === 0) return
    setActivityLoading(true)
    try {
      var cutoff = new Date(Date.now() - 90 * 86400000).toISOString()
      var membersRes  = await supabase.from('memberships').select('id, joined_date, role, members(first_name, last_name), organizations(id, name)').in('organization_id', orgIds).eq('status', 'active').gte('joined_date', cutoff).order('joined_date', { ascending: false }).limit(30)
      var docsRes     = await supabase.from('documents').select('id, title, created_at, organizations(id, name)').in('organization_id', orgIds).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(20)
      var pollsRes    = await supabase.from('polls').select('id, question, created_at, organizations(id, name)').in('organization_id', orgIds).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(20)
      var surveysRes  = await supabase.from('surveys').select('id, title, created_at, organizations(id, name)').in('organization_id', orgIds).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(20)
      var formsRes    = await supabase.from('signup_forms').select('id, title, created_at, organizations(id, name)').in('organization_id', orgIds).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(10)
      var programsRes      = await supabase.from('org_programs').select('id, name, created_at, organizations(id, name)').in('organization_id', orgIds).gte('created_at', cutoff).order('created_at', { ascending: false }).limit(10)
      var opportunitiesRes = await supabase.from('org_opportunities').select('id, title, created_at, organizations(id, name)').in('organization_id', orgIds).neq('visibility', 'draft').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(10)
      var fundingRes       = await supabase.from('org_funding').select('id, title, created_at, organizations(id, name)').in('organization_id', orgIds).neq('visibility', 'draft').gte('created_at', cutoff).order('created_at', { ascending: false }).limit(10)
      var items = []
      ;(membersRes.data || []).forEach(function(m) {
        var mn = m.members ? (m.members.first_name + ' ' + m.members.last_name).trim() : 'A new member'
        items.push({ id: 'member-' + m.id, type: 'member_joined', title: (mn || 'Someone') + ' joined as ' + (m.role || 'member'), orgName: m.organizations ? m.organizations.name : '', orgId: m.organizations ? m.organizations.id : null, timestamp: m.joined_date })
      })
      ;(docsRes.data     || []).forEach(function(d)  { items.push({ id: 'doc-'     + d.id,  type: 'document',    title: d.title,    orgName: d.organizations  ? d.organizations.name  : '', orgId: d.organizations  ? d.organizations.id  : null, timestamp: d.created_at  }) })
      ;(pollsRes.data    || []).forEach(function(p)  { items.push({ id: 'poll-'    + p.id,  type: 'poll',        title: p.question, orgName: p.organizations  ? p.organizations.name  : '', orgId: p.organizations  ? p.organizations.id  : null, timestamp: p.created_at  }) })
      ;(surveysRes.data  || []).forEach(function(s)  { items.push({ id: 'survey-'  + s.id,  type: 'survey',      title: s.title,    orgName: s.organizations  ? s.organizations.name  : '', orgId: s.organizations  ? s.organizations.id  : null, timestamp: s.created_at  }) })
      ;(formsRes.data    || []).forEach(function(f)  { items.push({ id: 'form-'    + f.id,  type: 'signup_form', title: f.title,    orgName: f.organizations  ? f.organizations.name  : '', orgId: f.organizations  ? f.organizations.id  : null, timestamp: f.created_at  }) })
      ;(programsRes.data      || []).forEach(function(pr) { items.push({ id: 'program-'     + pr.id, type: 'program',     title: pr.name,  orgName: pr.organizations ? pr.organizations.name : '', orgId: pr.organizations ? pr.organizations.id : null, timestamp: pr.created_at }) })
      ;(opportunitiesRes.data || []).forEach(function(op) { items.push({ id: 'opportunity-' + op.id, type: 'opportunity', title: op.title, orgName: op.organizations ? op.organizations.name : '', orgId: op.organizations ? op.organizations.id : null, timestamp: op.created_at }) })
      ;(fundingRes.data       || []).forEach(function(fn) { items.push({ id: 'funding-'     + fn.id, type: 'funding',     title: fn.title, orgName: fn.organizations ? fn.organizations.name : '', orgId: fn.organizations ? fn.organizations.id : null, timestamp: fn.created_at }) })
      items.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp) })
      setRecentActivity(items)
    } catch(err) { console.error('loadRecentActivity error:', err) }
    finally { setActivityLoading(false) }
  }

  // ── Rec #3: fetchAll now orchestrates the split loaders ──────────────────
  async function fetchAll() {
    try {
      setLoading(true); setError(null)
      var userRes = await supabase.auth.getUser()
      if (userRes.error) throw userRes.error
      var user = userRes.data.user
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)

      await Promise.all([
        loadPreferences(user.id),
        loadProfile(user.id),
        loadFollowed(user.id),
        loadSaved(user.id),
        loadChats(),
        loadGroups(user.id),
      ])

      var orgsWithStats = await loadOrgs(user.id)
      var orgIds = orgsWithStats.map(function(o) { return o.id })

      if (orgIds.length > 0) {
        await Promise.all([
          loadFeed(orgIds),
          loadCalendar(orgIds),
          loadRecentActivity(orgIds),
        ])
      }
    } catch(err) {
      console.error(err); setError(err.message)
      toast.error('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers ──
  function handleDismiss(id) {
    var updated = lsWrite('dismissedActivities', dismissedActivities.concat([id]))
    setDismissedActivities(updated)
    mascotSuccessToast('Removed from board.')
  }
  function handleToggleImportant(id) {
    var updated = importantActivities.includes(id)
      ? importantActivities.filter(function(i) { return i !== id })
      : importantActivities.concat([id])
    updated = lsWrite('importantActivities', updated)
    setImportantActivities(updated)
    mascotSuccessToast(updated.includes(id) ? 'Starred.' : 'Star removed.')
  }

  // Task 41 handlers
  function handleMarkRead(id) {
    var updated = lsWrite('readActivityIds', readActivityIds.concat([id]))
    setReadActivityIds(updated)
  }
  function handleMarkUnread(id) {
    var updated = lsWrite('readActivityIds', readActivityIds.filter(function(i) { return i !== id }))
    setReadActivityIds(updated)
  }
  function handleMarkAllRead() {
    var allIds = recentActivity.map(function(i) { return i.id })
    var merged = Array.from(new Set(readActivityIds.concat(allIds)))
    var updated = lsWrite('readActivityIds', merged)
    setReadActivityIds(updated)
    mascotSuccessToast('All activity marked as read.')
  }
  function handleDeleteAllActivity(idsToDelete) {
    // idsToDelete = array of specific IDs (delete selected), or null (clear all)
    var toRemove = idsToDelete ? new Set(idsToDelete) : new Set(recentActivity.map(function(i) { return i.id }))
    setRecentActivity(function(prev) { return prev.filter(function(i) { return !toRemove.has(i.id) }) })
    var updated = lsWrite('readActivityIds', readActivityIds.filter(function(i) { return !toRemove.has(i) }))
    setReadActivityIds(updated)
    var count = toRemove.size
    mascotSuccessToast(idsToDelete ? count + ' item' + (count !== 1 ? 's' : '') + ' deleted.' : 'Activity cleared.')
  }

  async function handleUnfollow(orgId, orgName) {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    setUnfollowingId(orgId)
    var res = await supabase.from('org_followers').delete().eq('user_id', user.id).eq('org_id', orgId)
    setUnfollowingId(null)
    if (res.error) { toast.error('Failed to unfollow.') }
    else {
      setFollowedOrgs(function(prev) { return prev.filter(function(o) { return o.id !== orgId }) })
      setFollowedEvents(function(prev) { return prev.filter(function(e) { return e.organization && e.organization.id !== orgId }) })
      mascotSuccessToast('Unfollowed ' + (orgName || 'organization') + '.')
    }
  }
  async function handleUnsave(saveId, eventTitle) {
    setRemovingSaved(saveId)
    var res = await supabase.from('event_saves').delete().eq('id', saveId)
    setRemovingSaved(null)
    if (res.error) { toast.error('Could not remove event.') }
    else {
      setSavedEvents(function(prev) { return prev.filter(function(e) { return e && e.id !== saveId }) })
      mascotSuccessToast('Removed from saved events.')
    }
  }
  function handleToggleWidget(key) {
    var updated = activeWidgets.includes(key)
      ? activeWidgets.filter(function(k) { return k !== key })
      : activeWidgets.concat([key])
    setActiveWidgets(updated)
    savePreferences(updated, orgColors)
    mascotSuccessToast(activeWidgets.includes(key) ? 'Widget removed.' : 'Widget added.')
  }
  function handleOrgColorChange(orgId, color) {
    var updated = Object.assign({}, orgColors)
    updated[orgId] = color
    setOrgColors(updated)
    savePreferences(activeWidgets, updated)
  }
  function handleTourNext() {
    if (tourStep < TOUR_STEPS.length - 1) { setTourStep(function(s) { return s + 1 }) }
    else { setTourStep(-1); setShowTourEnd(true); localStorage.setItem('ud_tour_done', '1') }
  }
  function handleTourSkip() { setTourStep(-1); localStorage.setItem('ud_tour_done', '1') }

  // ── Derived data ──
  var orgIndexMap = {}
  organizations.forEach(function(org, idx) { orgIndexMap[org.id] = idx })
  var totalUnread = organizations.reduce(function(sum, org) { return sum + (org.unreadCount || 0) }, 0)
  var visibleActivities = activities.filter(function(a) { return !dismissedActivities.includes(a.id) })
  var now = new Date()

var DATE_FILTER_OPTIONS = [
    { key: 'week',      label: 'This week'   },
    { key: 'nextmonth', label: 'Next month'  },
    { key: 'month',     label: 'Last month'  },
    { key: 'all',       label: 'All time'    },
  ]
function getDateCutoff(filter) {
    if (filter === 'nextmonth') return null
    var days = { week: 7, month: 30 }
    if (!days[filter]) return null
    return new Date(Date.now() - days[filter] * 86400000)
  }

  function getFilteredFeed(typeFilter) {
var cutoff = getDateCutoff(dateFilter)
    var nextMonthEnd = dateFilter === 'nextmonth' ? new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59) : null
    return visibleActivities
      .filter(function(a) {
        var typeMatch = typeFilter === 'all' || a.type === typeFilter
        var orgMatch  = orgFilter === 'all' || a.organizationId === orgFilter
        var dateMatch = !cutoff || new Date(a.timestamp) >= cutoff
        if (dateFilter === 'nextmonth') {
          var ts = new Date(a.timestamp)
          dateMatch = ts >= now && ts <= nextMonthEnd
        }
        if (a.type === 'event' && a.startTime && new Date(a.startTime) < now) return false
        return typeMatch && orgMatch && dateMatch
      })
      .slice()
      .sort(function(a, b) {
        var ai = importantActivities.includes(a.id) ? 0 : 1
        var bi = importantActivities.includes(b.id) ? 0 : 1
        if (ai !== bi) return ai - bi
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
  }

  var sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  var tabCounts = {
    events:        visibleActivities.filter(function(a) { return a.type === 'event'        && new Date(a.timestamp) >= sevenDaysAgo && !(a.startTime && new Date(a.startTime) < now) }).length,
    announcements: visibleActivities.filter(function(a) { return a.type === 'announcement' && new Date(a.timestamp) >= sevenDaysAgo }).length,
  }
  var TABS = [
    { key: 'all',           label: 'All Updates'                                   },
    { key: 'events',        label: 'Events',        count: tabCounts.events        },
    { key: 'announcements', label: 'Announcements', count: tabCounts.announcements },
    { key: 'my_programs',   label: 'My Programs & Events'                          },
    { key: 'activity',      label: 'Recent Activity'                               },
  ]
  var isFeedTab = activeTab === 'all' || activeTab === 'announcements'

  // ── Feed content by tab ──
  function renderFeedContent() {
    if (activeTab === 'my_programs') {
      return <MyProgramsEvents currentUserId={currentUserId} organizations={organizations} loading={loading} />
    }
    if (activeTab === 'events' && eventsView === 'calendar') {
      return <InlineDashboardCalendar events={calendarEvents} organizations={organizations} orgColors={orgColors} onColorChange={handleOrgColorChange} />
    }
    if (activeTab === 'events' && eventsView === 'saved') {
      return (
        <div>
          {savedEvents.length === 0 ? (
            <EmptyState icon={<IcoBookmark />} title="No saved events yet" desc="Bookmark events from the discovery page to find them here." actionLabel="Discover Events" onAction={function() { navigate('/discover') }} />
          ) : (
            <div role="list" aria-label="Saved events" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '8px' }}>
              {savedEvents.map(function(save) { return <SavedEventCard key={save.id} save={save} onUnsave={handleUnsave} removing={removingSaved} /> })}
            </div>
          )}
        </div>
      )
    }
    if (activeTab === 'activity') {
      return (
        <RecentActivityFeed
          items={recentActivity}
          loading={activityLoading}
          orgColors={orgColors}
          organizations={organizations}
          readActivityIds={readActivityIds}
          onMarkRead={handleMarkRead}
          onMarkUnread={handleMarkUnread}
          onMarkAllRead={handleMarkAllRead}
          onDeleteAll={handleDeleteAllActivity}
        />
      )
    }
    if (activeTab === 'events' && eventsView === 'list') {
      return <InlineDashboardEventList events={calendarEvents} organizations={organizations} orgColors={orgColors} onColorChange={handleOrgColorChange} />
    }
    var typeKey = activeTab === 'all' ? 'all' : activeTab === 'announcements' ? 'announcement' : 'event'
    var feed = getFilteredFeed(typeKey)
    if (loading) {
      return (
        <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
          {[0, 1].map(function(col) {
            return (
              <div key={col} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
                {[160, 140, 170].map(function(h, i) {
                  return (
                    <div key={i} style={{ background: '#F1F5F9', borderRadius: '12px', padding: '14px', height: h + 'px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Skel w="60px" h="16px" radius="4px" />
                      <Skel h="14px" />
                      <Skel w="80%" h="14px" />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )
    }
    if (organizations.length === 0) {
      return <EmptyState icon={<IcoBuilding />} title="No organizations yet" desc="Create or join an organization to see updates here." actionLabel="Create Organization" onAction={function() { setShowCreateModal(true) }} />
    }
    if (feed.length === 0) {
      return (
        <div role="status" style={{ textAlign: 'center', padding: '40px 24px', border: '1px dashed ' + BDR, borderRadius: '12px', marginTop: '8px', color: MUTED }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>Nothing here</p>
          <p style={{ fontSize: '12px' }}>Try a different filter, or check back when your orgs post updates.</p>
          {dismissedActivities.length > 0 && (
            <button onClick={function() { var u = lsWrite('dismissedActivities', []); setDismissedActivities(u); mascotSuccessToast('Board restored.') }} style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              Restore {dismissedActivities.length} dismissed items
            </button>
          )}
        </div>
      )
    }
    return (
      <div ref={feedRef}>
        {activeTab === 'all' && <OrgColorLegend organizations={organizations} orgColors={orgColors} onColorChange={handleOrgColorChange} />}
        <NoteGrid items={feed} orgColors={orgColors} orgIndexMap={orgIndexMap} onDismiss={handleDismiss} onToggleImportant={handleToggleImportant} importantActivities={importantActivities} />
        {dismissedActivities.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button onClick={function() { var u = lsWrite('dismissedActivities', []); setDismissedActivities(u); mascotSuccessToast('Board restored.') }} style={{ fontSize: '11px', fontWeight: 600, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              Restore {dismissedActivities.length} dismissed
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Sidebar widget renderers ──
  function renderWidget(key) {
    if (key === 'orgs') {
      return (
        <WidgetShell key="orgs" id="orgs" label="My Organizations" onRemove={function() { handleToggleWidget('orgs') }}>
          {loading ? (
            [1,2,3].map(function(i) { return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}><Skel w="32px" h="32px" radius="8px" /><div style={{ flex: 1 }}><Skel w="75%" h="12px" /><div style={{ marginTop: '4px' }}><Skel w="45%" h="10px" /></div></div></div> })
          ) : organizations.length === 0 ? (
            <p style={{ fontSize: '12px', color: MUTED, textAlign: 'center', padding: '8px 0' }}>No organizations yet.</p>
          ) : (
            <div ref={orgsRef}>
              {organizations.map(function(org, idx) {
                var avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                return (
                  <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: idx < organizations.length - 1 ? '1px solid ' + BDR : 'none', marginBottom: idx < organizations.length - 1 ? '6px' : 0 }}>
                    <Link to={'/organizations/' + org.id} aria-label={'Go to ' + org.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flex: 1, minWidth: 0 }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                      {org.logo_url
                        ? <img src={org.logo_url} alt={org.name + ' logo'} style={{ width: '30px', height: '30px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0, background: avatarColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{getInitials(org.name)}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{org.name}</p>
                        <p style={{ fontSize: '10px', color: org.unreadCount > 0 ? RED : MUTED, margin: 0 }}>{org.unreadCount > 0 ? org.unreadCount + ' unread' : (org.custom_title || org.role)}</p>
                      </div>
                    </Link>
                  </div>
                )
              })}
              <button onClick={function() { setShowCreateModal(true) }} aria-label="Create a new organization" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', padding: '8px', background: 'transparent', border: '1px dashed ' + BDR, borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: MUTED }} className="focus:outline-none focus:ring-2 focus:ring-blue-500"><IcoPlus /> New organization</button>
            </div>
          )}
        </WidgetShell>
      )
    }
    if (key === 'chats') {
      return (
        <WidgetShell key="chats" id="chats" label="Recent Chats" onRemove={function() { handleToggleWidget('chats') }}>
          {loading ? (
            [1,2].map(function(i) { return <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}><Skel w="26px" h="26px" radius="50%" /><div style={{ flex: 1 }}><Skel w="60%" h="11px" /><div style={{ marginTop: '4px' }}><Skel w="85%" h="10px" /></div></div></div> })
          ) : recentChats.length === 0 ? (
            // Rec #5: more helpful empty state
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: BLUE }}>
                <IcoChat />
              </div>
              <p style={{ fontSize: '12px', color: TEXT, fontWeight: 600, marginBottom: '4px' }}>No messages yet</p>
              <p style={{ fontSize: '11px', color: MUTED, lineHeight: 1.5, marginBottom: '10px' }}>Chat channels live inside each organization. Head to your org to start a conversation.</p>
              {organizations.length > 0 && (
                <button onClick={function() { navigate('/organizations/' + organizations[0].id + '/chat') }} style={{ padding: '6px 14px', background: BLUE, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Open Chat
                </button>
              )}
            </div>
          ) : (
            recentChats.map(function(msg) {
              var channelName = msg.chat_channels ? msg.chat_channels.name : 'channel'
              var orgId = msg.chat_channels ? msg.chat_channels.organization_id : null
              var orgName = (msg.chat_channels && msg.chat_channels.organizations) ? msg.chat_channels.organizations.name : ''
              return (
                <button key={msg.id} onClick={function() { if (orgId) navigate('/organizations/' + orgId + '/chat') }} aria-label={'Open ' + channelName + ' channel'} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', borderRadius: '6px', textAlign: 'left', marginBottom: '4px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: '#EFF6FF', color: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IcoChat /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: TEXT, margin: 0 }}>#{channelName}{orgName && <span style={{ fontWeight: 400, color: MUTED }}> · {orgName}</span>}</p>
                    <p style={{ fontSize: '11px', color: MUTED, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.content || '(message)'}</p>
                  </div>
                  <span style={{ fontSize: '10px', color: MUTED, flexShrink: 0 }}>{timeAgo(msg.created_at)}</span>
                </button>
              )
            })
          )}
        </WidgetShell>
      )
    }
    if (key === 'saved') {
      return (
        <WidgetShell key="saved" id="saved" label="Saved Events" onRemove={function() { handleToggleWidget('saved') }}>
          {loading
            ? [1,2].map(function(i) { return <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}><Skel w="36px" h="36px" radius="8px" /><div style={{ flex: 1 }}><Skel w="80%" h="12px" /><div style={{ marginTop: '4px' }}><Skel w="55%" h="10px" /></div></div></div> })
            : savedEvents.length === 0
              ? <p style={{ fontSize: '12px', color: MUTED }}>No saved events yet.</p>
              : savedEvents.slice(0, 3).map(function(save) {
                  var evt = save.events
                  if (!evt) return null
                  var d = fmtDate(evt.start_time)
                  return (
                    <Link key={evt.id} to={'/events/' + evt.id} aria-label={'Saved: ' + evt.title} style={{ display: 'flex', gap: '8px', alignItems: 'center', textDecoration: 'none', marginBottom: '8px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                      <div style={{ background: 'rgba(245,183,49,0.1)', borderRadius: '6px', padding: '5px 8px', textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>{d.mon}</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>{d.day}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                        <p style={{ fontSize: '10px', color: MUTED, margin: 0 }}>{evt.organizations ? evt.organizations.name : ''}</p>
                      </div>
                    </Link>
                  )
                })
          }
        </WidgetShell>
      )
    }
    if (key === 'following') {
      return (
        <WidgetShell key="following" id="following" label="Following" onRemove={function() { handleToggleWidget('following') }}>
          {loading ? (
            [1,2].map(function(i) { return <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}><Skel w="28px" h="28px" radius="7px" /><div style={{ flex: 1 }}><Skel w="70%" h="11px" /><div style={{ marginTop: '4px' }}><Skel w="45%" h="10px" /></div></div></div> })
          ) : followedOrgs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6px 0', color: MUTED }}>
              <div style={{ opacity: 0.3, margin: '0 auto 8px', width: 'fit-content' }}><IcoCompass /></div>
              <p style={{ fontSize: '12px', lineHeight: 1.55, marginBottom: '10px' }}>Follow local nonprofits and see their public events here, even without being a member.</p>
              <Link to="/explore" style={{ display: 'inline-block', padding: '5px 12px', background: 'rgba(139,92,246,0.1)', color: PURPLE, border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }} className="focus:outline-none focus:ring-2 focus:ring-purple-500">Find organizations</Link>
            </div>
          ) : (
            followedOrgs.map(function(org, idx) {
              var color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              var isUnfollowing = unfollowingId === org.id
              return (
                <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Link to={'/organizations/' + org.id} aria-label={'View ' + org.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, textDecoration: 'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    {org.logo_url ? <img src={org.logo_url} alt={org.name + ' logo'} style={{ width: '28px', height: '28px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0, background: color, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{getInitials(org.name)}</div>}
                    <p style={{ fontSize: '12px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{org.name}</p>
                  </Link>
                  <button onClick={function() { handleUnfollow(org.id, org.name) }} disabled={isUnfollowing} aria-label={'Unfollow ' + org.name} style={{ flexShrink: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + BDR, borderRadius: '6px', background: 'transparent', color: isUnfollowing ? MUTED : RED, cursor: isUnfollowing ? 'not-allowed' : 'pointer', opacity: isUnfollowing ? 0.5 : 1 }} className="focus:outline-none focus:ring-2 focus:ring-red-400"><IcoX /></button>
                </div>
              )
            })
          )}
        </WidgetShell>
      )
    }
    if (key === 'signups') {
      return (
        <WidgetShell key="signups" id="signups" label="My Sign-Ups" onRemove={function() { handleToggleWidget('signups') }}>
          <MySignups showFilter={false} headingId="signups-heading" />
        </WidgetShell>
      )
    }
    if (key === 'groups') {
      return (
        <WidgetShell key="groups" id="groups" label="My Groups" onRemove={function() { handleToggleWidget('groups') }}>
          {loading ? (
            [1,2].map(function(i) { return <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}><Skel w="28px" h="28px" radius="6px" /><div style={{ flex: 1 }}><Skel w="70%" h="12px" /><div style={{ marginTop: '4px' }}><Skel w="50%" h="10px" /></div></div></div> })
          ) : myGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6px 0', color: MUTED }}>
              <div style={{ opacity: 0.3, margin: '0 auto 8px', width: 'fit-content' }}><IcoGroup /></div>
              <p style={{ fontSize: '12px', lineHeight: 1.5 }}>No groups yet. Join a committee or team inside one of your organizations.</p>
            </div>
          ) : (
            myGroups.map(function(group, idx) {
              var color = GROUP_COLORS[idx % GROUP_COLORS.length]
              return (
                <Link key={group.id} to={'/organizations/' + group.organization_id + '?tab=groups'} aria-label={'Go to ' + group.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', textDecoration: 'none', marginBottom: '4px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0, background: color, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{getInitials(group.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</p>
                    <p style={{ fontSize: '10px', color: MUTED, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.organizations ? group.organizations.name : ''}</p>
                  </div>
                </Link>
              )
            })
          )}
        </WidgetShell>
      )
    }
    if (key === 'tasks') {
      return (
        <WidgetShell key="tasks" id="tasks" label="My Tasks" onRemove={function() { handleToggleWidget('tasks') }}>
          <TasksWidget />
        </WidgetShell>
      )
    }
    return null
  }

  // ── Error page ──
  if (!loading && error) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter',system-ui,sans-serif" }}>
        <div role="alert" style={{ background: CARD, border: '1px solid ' + RED, borderRadius: '12px', padding: '40px', maxWidth: '420px', textAlign: 'center' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.5" style={{ margin: '0 auto 16px' }} aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ fontSize: '13px', color: MUTED, marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchAll} style={{ padding: '9px 20px', background: BLUE, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Try Again</button>
        </div>
      </div>
    )
  }

  // ── Render ──
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: TEXT }}>
      <style>{`
        .postit-wrap .card-actions { opacity: 0; transition: opacity 0.12s; }
        .postit-wrap:hover .card-actions,
        .postit-wrap:focus-within .card-actions { opacity: 1; }
        .rbc-time-header-content > .rbc-row { min-height: 50px !important; }
        .rbc-header { padding: 8px 4px !important; white-space: normal !important; min-height: 50px !important; color: #475569; background: #FFFFFF; border-color: #E2E8F0 !important; }
        .rbc-allday-cell { display: none !important; }
        .rbc-month-view, .rbc-time-view { border-color: #E2E8F0 !important; background: #FFFFFF; }
        .rbc-day-bg { background: #FFFFFF; }
        .rbc-off-range-bg { background: #F8FAFC; }
        .rbc-today { background: #EFF6FF !important; }
        .rbc-date-cell { color: #475569; padding: 4px 8px; }
        .rbc-date-cell.rbc-off-range { color: #94A3B8; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #E2E8F0; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #E2E8F0; }
        .rbc-time-content { border-color: #E2E8F0 !important; }
        .rbc-time-slot { color: #94A3B8; border-color: #E2E8F0; }
        .rbc-timeslot-group { border-color: #E2E8F0; }
        .rbc-current-time-indicator { background: #3B82F6; }
        .rbc-show-more { color: #3B82F6; font-weight: 600; font-size: 12px; }
        .rbc-event:focus { outline: 2px solid #3B82F6; outline-offset: 2px; }
      `}</style>

      {tourStep >= 0 && <TourOverlay step={tourStep} refs={tourRefs} onNext={handleTourNext} onSkip={handleTourSkip} />}
      {showTourEnd && <TourEndModal onClose={function() { setShowTourEnd(false) }} />}

      <main role="main" style={{ maxWidth: '1300px', margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 252px', gap: '28px', alignItems: 'start' }}>
        {/* ── Left column ── */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: YELLOW, marginBottom: '3px' }}>Welcome back</p>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: TEXT, margin: 0 }}>
                {loading ? 'Loading…' : memberName ? memberName.split(' ')[0] + "'s Board" : 'My Board'}
              </h1>
              <p style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>Updates from your {organizations.length} organization{organizations.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
              <button onClick={function() { setTourStep(0) }} aria-label="Take the guided tour" style={{ fontSize: '12px', fontWeight: 600, color: MUTED, background: 'transparent', border: '1px solid ' + BDR, padding: '5px 14px', borderRadius: '8px', cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Take the tour</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={function() { setShowInviteOrg(true) }} aria-label="Invite an organization" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: PURPLE, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }} className="focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <Building2 size={13} aria-hidden="true" /> Invite Org
                </button>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            <StatCard label="Orgs"            value={organizations.length}  Icon={IcoOrgs}     accentColor={PURPLE} loading={loading} />
            <StatCard label="Upcoming Events"  value={upcomingEvents.length} Icon={IcoCalendar} accentColor={BLUE}   loading={loading} />
            <StatCard label="Unread"           value={totalUnread}           Icon={IcoBell}     accentColor={RED}    loading={loading} />
          </div>

          {/* Tab bar */}
          <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div role="tablist" aria-label="Dashboard sections" style={{ display: 'flex', borderBottom: '1px solid ' + BDR, paddingLeft: '4px', overflowX: 'auto' }}>
              {TABS.map(function(tab) {
                var isActive = activeTab === tab.key
                return (
                  <button key={tab.key} role="tab" aria-selected={isActive} onClick={function() { setActiveTab(tab.key) }} aria-label={tab.label + (tab.count ? ', ' + tab.count + ' new this week' : '')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? BLUE : MUTED, background: 'transparent', border: 'none', borderBottom: isActive ? '2px solid ' + BLUE : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginBottom: '-1px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {tab.label}
                    {tab.count > 0 && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: isActive ? BLUE : '#E2E8F0', color: isActive ? '#FFFFFF' : MUTED }}>{tab.count}</span>}
                  </button>
                )
              })}
            </div>

            {/* Events sub-bar */}
            {activeTab === 'events' && (
              <div role="group" aria-label="Events view" style={{ display: 'flex', gap: '4px', padding: '10px 16px', borderBottom: '1px solid ' + BDR }}>
                {[{ key: 'list', label: 'List' }, { key: 'calendar', label: 'Calendar' }, { key: 'saved', label: 'Saved Events' }].map(function(view) {
                  var isActive = eventsView === view.key
                  return <button key={view.key} onClick={function() { setEventsView(view.key) }} aria-pressed={isActive} style={{ padding: '5px 14px', borderRadius: '99px', border: '1px solid ' + (isActive ? BLUE : BDR), background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent', color: isActive ? BLUE : MUTED, fontSize: '12px', fontWeight: isActive ? 700 : 500, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">{view.label}</button>
                })}
              </div>
            )}

            {/* Filter row — only for feed tabs */}
            {isFeedTab && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderBottom: '1px solid ' + BDR, flexWrap: 'wrap' }}>
                <OrgFilterDropdown organizations={organizations} selectedOrgId={orgFilter} onChange={setOrgFilter} />
                <div style={{ width: '1px', height: '18px', background: BDR, flexShrink: 0 }} aria-hidden="true" />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {DATE_FILTER_OPTIONS.map(function(opt) {
                    var isSelected = dateFilter === opt.key
                    return <button key={opt.key} onClick={function() { setDateFilter(opt.key) }} aria-pressed={isSelected} style={{ padding: '4px 10px', borderRadius: '99px', border: '1px solid ' + (isSelected ? YELLOW : BDR), background: isSelected ? 'rgba(245,183,49,0.1)' : 'transparent', color: isSelected ? '#B45309' : MUTED, fontSize: '11px', fontWeight: isSelected ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }} className="focus:outline-none focus:ring-2 focus:ring-yellow-400">{opt.label}</button>
                  })}
                </div>
                <div style={{ flex: 1 }} />
                {dismissedActivities.length > 0 && (
                  <button onClick={function() { var u = lsWrite('dismissedActivities', []); setDismissedActivities(u); mascotSuccessToast('Board restored.') }} style={{ fontSize: '11px', fontWeight: 600, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    Restore {dismissedActivities.length} hidden
                  </button>
                )}
              </div>
            )}

            {/* Tab content */}
            <div style={{ padding: '16px' }}>
              {renderFeedContent()}
            </div>
          </div>

          {/* Upcoming events */}
          {!loading && activeTab === 'all' && upcomingEvents.length > 0 && (
            <section aria-labelledby="upcoming-heading" style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h2 id="upcoming-heading" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: YELLOW, margin: 0 }}>Upcoming Events</h2>
                <Link to="/events" style={{ fontSize: '12px', fontWeight: 600, color: BLUE, textDecoration: 'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">View all</Link>
              </div>
              {upcomingEvents.slice(0, 4).map(function(event) { return <EventRow key={event.id} event={event} /> })}
            </section>
          )}

          {/* Followed org events */}
          {!loading && activeTab === 'all' && followedOrgs.length > 0 && followedEvents.length > 0 && (
            <section aria-labelledby="followed-heading" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h2 id="followed-heading" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: YELLOW, margin: 0 }}>From Orgs You Follow</h2>
                <Link to="/explore" style={{ fontSize: '12px', fontWeight: 600, color: BLUE, textDecoration: 'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">Discover more</Link>
              </div>
              {followedEvents.map(function(event) { return <EventRow key={event.id} event={event} to={'/events/' + event.id} /> })}
            </section>
          )}

          {/* Follow prompt */}
          {!loading && activeTab === 'all' && followedOrgs.length === 0 && organizations.length > 0 && (
            <div style={{ marginTop: '24px', padding: '16px 20px', background: CARD, border: '1px dashed ' + BDR, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ color: PURPLE, opacity: 0.7 }}><IcoBookmark /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>Follow organizations</p>
                <p style={{ fontSize: '12px', color: MUTED, margin: 0 }}>Follow local nonprofits and see their public events here, even without being a member.</p>
              </div>
              <button onClick={function() { navigate('/explore') }} style={{ padding: '7px 16px', background: PURPLE, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }} className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">Explore organizations</button>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside role="complementary" aria-label="Dashboard sidebar">
          {activeWidgets.map(function(key) { return renderWidget(key) })}
          <div ref={customizeRef}>
            <button onClick={function() { setShowCustomize(function(v) { return !v }) }} aria-expanded={showCustomize} aria-controls="widget-picker" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', background: '#F8FAFC', border: '1.5px dashed ' + BDR, borderRadius: '10px', fontSize: '12px', fontWeight: 500, color: MUTED, cursor: 'pointer', marginBottom: '10px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
              <IcoSettings /> Customize widgets
            </button>
            {showCustomize && (
              <div id="widget-picker" style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ padding: '10px 14px', background: BG, borderBottom: '1px solid ' + BDR, fontSize: '12px', fontWeight: 600, color: TEXT2 }}>Add or remove widgets</div>
                {WIDGET_DEFS.map(function(def) {
                  var isOn = activeWidgets.includes(def.key)
                  return (
                    <button key={def.key} onClick={function() { handleToggleWidget(def.key) }} aria-pressed={isOn} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid ' + BDR, background: 'transparent', cursor: 'pointer', textAlign: 'left' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, border: '1.5px solid ' + (isOn ? BLUE : BDR), background: isOn ? BLUE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isOn && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT }}>{def.label}</div>
                        <div style={{ fontSize: '10px', color: MUTED }}>{def.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Modals */}
      <CreateOrganization isOpen={showCreateModal} onClose={function() { setShowCreateModal(false) }} onSuccess={function() { fetchAll(); setShowCreateModal(false) }} />
      {selectedOrgForEvent && (
        <CreateEvent isOpen={showCreateEvent} onClose={function() { setShowCreateEvent(false); setSelectedOrgForEvent(null); setCreateEventPrefill(null) }} onSuccess={fetchAll} organizationId={selectedOrgForEvent.id} organizationName={selectedOrgForEvent.name} prefillData={createEventPrefill} />
      )}
      <InviteOrgModal    isOpen={showInviteOrg}    onClose={function() { setShowInviteOrg(false) }} />
    </div>
  )
}

export default UnifiedDashboard