import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { mascotSuccessToast } from '../components/MascotToast'
import { mascotErrorToast } from '../components/MascotToast'
import CreateOrganization from '../components/CreateOrganization'
import CreateEvent from '../components/CreateEvent.jsx'
import MySignups from '../components/MySignups'
import InviteMemberModal from '../components/InviteMemberModal'
import InviteOrgModal from '../components/InviteOrgModal'
import { UserPlus, Building2 } from 'lucide-react'

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

// ─── Post-it note color presets (for org announcements) ──────────────────
var NOTE_PRESETS = [
  '#FEF9C3','#DCFCE7','#FFEDD5','#FCE7F3',
  '#E0F2FE','#F3E8FF','#FFF7ED','#ECFDF5',
]

// ─── Sidebar org/group avatar colors ─────────────────────────────────────
var AVATAR_COLORS = ['#3B82F6','#8B5CF6','#F5B731','#22C55E','#EF4444','#EC4899']
var GROUP_COLORS  = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6']

// ─── Available widgets ────────────────────────────────────────────────────
var WIDGET_DEFS = [
  { key: 'orgs',      label: 'My Organizations', desc: 'Org list with unread counts' },
  { key: 'chats',     label: 'Recent Chats',      desc: 'Latest channel messages'     },
  { key: 'saved',     label: 'Saved Events',      desc: 'Events you bookmarked'       },
  { key: 'following', label: 'Following',          desc: 'Orgs you follow publicly'   },
  { key: 'signups',   label: 'My Sign-Ups',        desc: 'Volunteer sign-up slots'    },
  { key: 'groups',    label: 'My Groups',          desc: 'Committees and teams'       },
]

// ─── Tour steps ───────────────────────────────────────────────────────────
var TOUR_STEPS = [
  { title: 'Stats at a glance',   desc: 'See your org count, upcoming events, and unread announcements right here.' },
  { title: 'Your activity board', desc: 'Announcements, events, and documents appear as color-coded Post-it cards. Use the tabs to filter by type.' },
  { title: 'My Organizations',    desc: 'Quick access to every org you belong to. Red badges show unread announcements. Tap the color dot to choose a note color.' },
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

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skel({ w, h, radius }) {
  return <div style={{ width: w || '100%', height: h || '13px', background: '#E2E8F0', borderRadius: radius || '4px', flexShrink: 0 }} />
}

// ─── StatCard ─────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, accentColor, loading }) {
  return (
    <div
      role="region"
      aria-label={label + ': ' + value}
      style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', padding: '14px 16px' }}
    >
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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={'Filter by organization: ' + selectedName}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 11px', borderRadius: '99px',
          border: '1px solid ' + (isFiltered ? BLUE : BDR),
          background: isFiltered ? 'rgba(59,130,246,0.08)' : 'transparent',
          cursor: 'pointer', fontSize: '12px',
          fontWeight: isFiltered ? 700 : 500,
          color: isFiltered ? BLUE : MUTED, whiteSpace: 'nowrap',
        }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <IcoOrgs />{selectedName}<IcoChevronDown />
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 5px)', left: 0,
            background: CARD, border: '1px solid ' + BDR,
            borderRadius: '10px', padding: '5px', minWidth: '190px',
            zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
        >
          {[{ id: 'all', name: 'All Organizations' }, ...organizations].map(function(org) {
            var isSel = selectedOrgId === org.id
            return (
              <button
                key={org.id}
                role="option"
                aria-selected={isSel}
                onClick={function() { onChange(org.id); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', borderRadius: '6px', border: 'none',
                  background: isSel ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: isSel ? BLUE : TEXT, fontSize: '13px',
                  fontWeight: isSel ? 700 : 400, cursor: 'pointer',
                }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              >{org.name}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── OrgColorPicker ───────────────────────────────────────────────────────
function OrgColorPicker({ orgId, currentColor, onSelect }) {
  var [open, setOpen] = useState(false)
  var ref = useRef(null)

  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return function() { document.removeEventListener('mousedown', handler) }
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={function(e) { e.stopPropagation(); setOpen(function(v) { return !v }) }}
        aria-label="Change note color for this organization"
        title="Change note color"
        style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: currentColor, border: '2px solid ' + BDR,
          cursor: 'pointer', padding: 0, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span style={{ color: 'rgba(0,0,0,0.3)', lineHeight: 1, fontSize: '8px' }}>
          <IcoPalette />
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Pick a note color"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: CARD, border: '1px solid ' + BDR,
            borderRadius: '10px', padding: '10px', zIndex: 200,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px',
            width: '120px',
          }}
        >
          {NOTE_PRESETS.map(function(color) {
            var isSelected = currentColor === color
            return (
              <button
                key={color}
                aria-label={'Select color ' + color + (isSelected ? ', currently selected' : '')}
                onClick={function() { onSelect(orgId, color); setOpen(false) }}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: color, border: isSelected ? '2px solid ' + TEXT : '2px solid transparent',
                  cursor: 'pointer', padding: 0,
                  outline: isSelected ? '2px solid white' : 'none',
                  outlineOffset: '-4px',
                }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
  } else {
    bg = orgNoteBg || '#FEF9C3'; accentColor = '#92400E'
    tagBgColor = 'rgba(0,0,0,0.1)'; tagTxtColor = '#374151'
    tagLabel = 'Announcement'; TagIcon = IcoMegaphone
  }

  return (
    <article
      aria-label={tagLabel + ' from ' + item.organizationName + (isImportant ? ', starred' : '')}
      className="postit-card"
      style={{
        background: bg,
        borderRadius: '12px',
        padding: '14px',
        minHeight: '150px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isImportant
          ? '3px 4px 14px rgba(0,0,0,0.12), inset 0 0 0 2px ' + YELLOW
          : '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        position: 'relative',
      }}
    >
      {/* Tag + action buttons */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '2px 7px', borderRadius: '4px',
            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: tagBgColor, color: tagTxtColor,
          }}>
            <TagIcon />{tagLabel}
          </span>
          {isImportant && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '2px',
              padding: '2px 6px', borderRadius: '4px',
              fontSize: '9px', fontWeight: 700,
              background: 'rgba(245,183,49,0.25)', color: '#92400E',
            }}>
              <IcoStar filled={true} /> Starred
            </span>
          )}
        </div>
        <div className="card-actions" style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          <button
            onClick={function(e) { e.stopPropagation(); onToggleImportant(item.id) }}
            aria-label={isImportant ? 'Remove star' : 'Star this item'}
            title={isImportant ? 'Remove star' : 'Star'}
            style={{
              width: '22px', height: '22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              background: isImportant ? 'rgba(245,183,49,0.3)' : 'rgba(0,0,0,0.07)',
              color: isImportant ? '#D97706' : '#9CA3AF',
            }}
            className="focus:outline-none focus:ring-2 focus:ring-yellow-400"
          ><IcoStar filled={isImportant} /></button>
          <button
            onClick={function(e) { e.stopPropagation(); onDismiss(item.id) }}
            aria-label={'Dismiss: ' + item.title}
            title="Dismiss"
            style={{
              width: '22px', height: '22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              background: 'rgba(0,0,0,0.07)', color: '#9CA3AF',
            }}
            className="focus:outline-none focus:ring-2 focus:ring-red-400"
          ><IcoX /></button>
        </div>
      </div>

      {/* Body text — Patrick Hand */}
      <p style={{
        fontFamily: "'Patrick Hand', sans-serif",
        fontSize: '17px',
        fontWeight: 400,
        color: '#374151',
        lineHeight: 1.5,
        flex: 1,
        margin: '0 0 10px',
        wordBreak: 'break-word',
      }}>{item.title}</p>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.07)',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, color: accentColor,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1, marginRight: '6px',
        }}>{item.organizationName}</span>
        <span style={{ fontSize: '10px', color: MUTED, flexShrink: 0 }}>{item.time}</span>
      </div>
    </article>
  )
}

// ─── 2-column note grid ────────────────────────────────────────────────────
function NoteGrid({ items, orgColors, orgIndexMap, onDismiss, onToggleImportant, importantActivities }) {
  var col0 = [], col1 = []
  items.forEach(function(item, i) {
    if (i % 2 === 0) col0.push(item)
    else col1.push(item)
  })

  function getNoteBg(item) {
    if (item.type !== 'announcement' || item.priority === 'urgent') return null
    if (orgColors[item.organizationId]) return orgColors[item.organizationId]
    var idx = orgIndexMap[item.organizationId] || 0
    return NOTE_PRESETS[idx % NOTE_PRESETS.length]
  }

  function renderCol(colItems) {
    return colItems.map(function(item) {
      return (
        <div key={item.id} className="postit-wrap" style={{ marginBottom: '14px' }}>
          <PostItCard
            item={item}
            orgNoteBg={getNoteBg(item)}
            onDismiss={onDismiss}
            onToggleImportant={onToggleImportant}
            isImportant={importantActivities.includes(item.id)}
          />
        </div>
      )
    })
  }

  var colStyle = { flex: '1 1 0', minWidth: 0, paddingTop: '10px', display: 'flex', flexDirection: 'column' }

  return (
    <div role="list" aria-label="Activity feed" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={colStyle}>{renderCol(col0)}</div>
      <div style={colStyle}>{renderCol(col1)}</div>
    </div>
  )
}

// ─── TourOverlay ──────────────────────────────────────────────────────────
function TourOverlay({ step, refs, onNext, onSkip }) {
  var current = TOUR_STEPS[step]
  var [pos, setPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' })

  useEffect(function() {
    if (!current) return
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
      <div
        role="dialog"
        aria-modal="false"
        aria-label={'Tour step ' + (step + 1) + ' of ' + TOUR_STEPS.length + ': ' + current.title}
        style={{
          position: 'fixed', zIndex: 1002, width: '300px',
          background: CARD, border: '1px solid ' + BDR,
          borderRadius: '12px', padding: '20px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          top: pos.top, left: pos.left, transform: pos.transform || 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: YELLOW, letterSpacing: '3px', textTransform: 'uppercase' }}>
            Step {step + 1} of {TOUR_STEPS.length}
          </span>
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
          <button
            onClick={onNext}
            autoFocus
            style={{ padding: '8px 20px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >{isLast ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </>
  )
}

// ─── TourEndModal ─────────────────────────────────────────────────────────
function TourEndModal({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-end-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(14,21,35,0.55)', padding: '24px',
      }}
    >
      <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '16px', padding: '40px 36px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
        <img src="/mascot-onboarding.png" alt="" aria-hidden="true" style={{ width: '160px', height: 'auto', margin: '0 auto 20px', display: 'block' }} />
        <h2 id="tour-end-title" style={{ fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>You're all set!</h2>
        <p style={{ fontSize: '13px', color: TEXT2, lineHeight: 1.65, marginBottom: '24px' }}>
          You know your way around the board. Explore your organizations, follow new ones, and stay on top of what matters.
        </p>
        <button
          onClick={onClose}
          autoFocus
          style={{ padding: '11px 32px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >Get Started</button>
      </div>
    </div>
  )
}

// ─── Event list row (used in Events tab + Upcoming section) ──────────────
function EventRow({ event, to }) {
  var d = fmtDate(event.start_time)
  return (
    <Link
      to={to || ('/organizations/' + (event.organization && event.organization.id) + '/events')}
      aria-label={'Event: ' + event.title}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        background: CARD, border: '1px solid ' + BDR,
        borderRadius: '10px', padding: '10px 14px', textDecoration: 'none',
        marginBottom: '6px',
      }}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div style={{ flexShrink: 0, width: '42px', textAlign: 'center', background: '#EFF6FF', borderRadius: '8px', padding: '5px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '1px' }}>{d.mon}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: BLUE, lineHeight: 1 }}>{d.day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
        <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>
          {event.organization ? event.organization.name : ''}{event.location ? ' · ' + event.location : ''}
        </p>
      </div>
      <span style={{ fontSize: '11px', color: MUTED, flexShrink: 0 }}>{d.time}</span>
    </Link>
  )
}

// ─── SavedRow ─────────────────────────────────────────────────────────────
function SavedRow({ evt }) {
  if (!evt) return null
  var d = fmtDate(evt.start_time)
  return (
    <Link
      to={'/events/' + evt.id}
      aria-label={'Saved event: ' + evt.title}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        background: CARD, border: '1px solid ' + BDR,
        borderRadius: '10px', padding: '10px 14px', textDecoration: 'none',
        marginBottom: '6px',
      }}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div style={{ flexShrink: 0, width: '42px', textAlign: 'center', background: 'rgba(245,183,49,0.1)', borderRadius: '8px', padding: '5px 0' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '1px' }}>{d.mon}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>{d.day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
        <p style={{ fontSize: '11px', color: MUTED, margin: 0 }}>
          {evt.organizations ? evt.organizations.name : ''}{evt.location ? ' · ' + evt.location : ''}
        </p>
      </div>
      <span style={{ color: '#B45309', opacity: 0.6 }}><IcoBookmark /></span>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, actionLabel, onAction }) {
  return (
    <div role="status" style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed ' + BDR, borderRadius: '12px' }}>
      <div style={{ color: MUTED, opacity: 0.4, margin: '0 auto 14px', width: 'fit-content' }}>{icon}</div>
      <p style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>{title}</p>
      <p style={{ fontSize: '13px', color: MUTED, marginBottom: onAction ? '20px' : 0 }}>{desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          style={{ padding: '9px 18px', background: BLUE, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >{actionLabel}</button>
      )}
    </div>
  )
}

// ─── WidgetShell ─────────────────────────────────────────────────────────
function WidgetShell({ id, label, onRemove, children }) {
  return (
    <section
      aria-labelledby={id + '-heading'}
      style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', padding: '16px 18px', marginBottom: '14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 id={id + '-heading'} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: YELLOW, margin: 0 }}>{label}</h2>
        <button
          onClick={onRemove}
          aria-label={'Remove ' + label + ' widget'}
          title="Remove widget"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: '2px', borderRadius: '4px', display: 'flex' }}
          className="focus:outline-none focus:ring-2 focus:ring-gray-400"
        ><IcoX /></button>
      </div>
      {children}
    </section>
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
  var [loading,             setLoading]              = useState(true)
  var [error,               setError]                = useState(null)
  var [currentUserId,       setCurrentUserId]        = useState(null)
  var [memberName,          setMemberName]           = useState('')
  var [unfollowingId,       setUnfollowingId]        = useState(null)

  // ── UI state ──
  var [activeTab,           setActiveTab]            = useState('all')
  var [orgFilter,           setOrgFilter]            = useState('all')
  var [dateFilter,          setDateFilter]           = useState('2weeks')
  var [dismissedActivities, setDismissedActivities]  = useState(function() {
    try { return JSON.parse(localStorage.getItem('dismissedActivities') || '[]') } catch { return [] }
  })
  var [importantActivities, setImportantActivities]  = useState(function() {
    try { return JSON.parse(localStorage.getItem('importantActivities') || '[]') } catch { return [] }
  })

  // ── Preferences state (saved to DB) ──
  var [activeWidgets,       setActiveWidgets]        = useState(['orgs', 'chats'])
  var [orgColors,           setOrgColors]            = useState({})
  var [showCustomize,       setShowCustomize]        = useState(false)
  var [prefLoaded,          setPrefLoaded]           = useState(false)

  // ── Modal state ──
  var [showCreateModal,     setShowCreateModal]      = useState(false)
  var [showCreateEvent,     setShowCreateEvent]      = useState(false)
  var [showInviteMember,    setShowInviteMember]     = useState(false)
  var [showInviteOrg,       setShowInviteOrg]        = useState(false)
  var [selectedOrgForEvent, setSelectedOrgForEvent]  = useState(null)

  // ── Tour state ──
  var [tourStep,   setTourStep]   = useState(-1)
  var [showTourEnd,setShowTourEnd]= useState(false)

  // ── Tour refs ──
  var statsRef    = useRef(null)
  var feedRef     = useRef(null)
  var orgsRef     = useRef(null)
  var customizeRef= useRef(null)
  var tourRefs    = [statsRef, feedRef, orgsRef, customizeRef]

  // ── Load Caveat font ──
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
    return function() { sub.data.subscription?.unsubscribe() }
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

  // ── Load preferences ──
  async function loadPreferences(userId) {
    var res = await supabase
      .from('dashboard_preferences')
      .select('widgets, org_colors')
      .eq('user_id', userId)
      .single()
    if (res.data) {
      if (res.data.widgets && res.data.widgets.length > 0) setActiveWidgets(res.data.widgets)
      if (res.data.org_colors) setOrgColors(res.data.org_colors)
    }
    setPrefLoaded(true)
  }

  // ── Save preferences ──
  async function savePreferences(widgets, colors) {
    if (!currentUserId) return
    await supabase
      .from('dashboard_preferences')
      .upsert({
        user_id:    currentUserId,
        widgets:    widgets,
        org_colors: colors,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
  }

  // ── Main data fetch ──
  async function fetchAll() {
    try {
      setLoading(true); setError(null)
      var userRes = await supabase.auth.getUser()
      if (userRes.error) throw userRes.error
      var user = userRes.data.user
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)

      // Load preferences
      await loadPreferences(user.id)

      // Profile
      var profileRes = await supabase.from('members').select('full_name').eq('id', user.id).single()
      if (profileRes.data) setMemberName(profileRes.data.full_name || '')

      // Orgs + unread counts
      var orgsRes = await supabase
        .from('memberships')
        .select('id, role, status, custom_title, joined_date, organization:organizations (id, name, description, type, logo_url)')
        .eq('member_id', user.id)
        .eq('status', 'active')
        .order('joined_date', { ascending: false })
      if (orgsRes.error) throw orgsRes.error

      var orgsWithStats = await Promise.all((orgsRes.data || []).map(async function(membership) {
        var orgId = membership.organization.id
        var annRes = await supabase.from('announcements').select('id').eq('organization_id', orgId).in('visibility', ['public', 'members'])
        var announcementIds = (annRes.data || []).map(function(a) { return a.id })
        var unreadCount = 0
        if (announcementIds.length > 0) {
          var reads = (await supabase.from('announcement_reads').select('announcement_id').eq('member_id', user.id).in('announcement_id', announcementIds)).data
          var readIds = new Set((reads || []).map(function(r) { return r.announcement_id }))
          unreadCount = announcementIds.length - readIds.size
        }
        var eventCount = (await supabase.from('events').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('start_time', new Date().toISOString()).in('visibility', ['public', 'members'])).count
        return {
          ...membership.organization,
          role: membership.role,
          custom_title: membership.custom_title,
          eventCount: eventCount || 0,
          unreadCount,
        }
      }))
      setOrganizations(orgsWithStats)

      // Groups
      try {
        var groupsRes = await supabase.from('group_members').select('group:groups (id, name, organization_id, type, organizations(name))').eq('member_id', user.id).eq('status', 'active')
        if (groupsRes.data) setMyGroups(groupsRes.data.map(function(gm) { return gm.group }).filter(Boolean))
      } catch { setMyGroups([]) }

      // Followed orgs
      var followRes = await supabase.from('org_followers').select('org_id, organizations (id, name, logo_url, type)').eq('user_id', user.id)
      var followedOrgData = (followRes.data || []).map(function(f) { return f.organizations }).filter(Boolean)
      setFollowedOrgs(followedOrgData)

      if (followedOrgData.length > 0) {
        var followedOrgIds = followedOrgData.map(function(o) { return o.id })
        var followedEvtRes = await supabase
          .from('events')
          .select('id, title, start_time, location, organization:organizations (id, name)')
          .in('organization_id', followedOrgIds)
          .gte('start_time', new Date().toISOString())
          .eq('visibility', 'public')
          .order('start_time', { ascending: true })
          .limit(6)
        setFollowedEvents(followedEvtRes.data || [])
      }

      // Saved events
      var savesRes = await supabase
        .from('event_saves')
        .select('id, events(id, title, start_time, location, organizations(id, name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)
      setSavedEvents((savesRes.data || []).map(function(s) { return s.events }).filter(Boolean))

      var orgIds = orgsWithStats.map(function(o) { return o.id })
      if (orgIds.length > 0) {
        // Upcoming events
        var evtRes = await supabase
          .from('events')
          .select('id, title, start_time, location, organization:organizations (id, name, type)')
          .in('organization_id', orgIds)
          .gte('start_time', new Date().toISOString())
          .in('visibility', ['public', 'members'])
          .order('start_time', { ascending: true })
          .limit(5)
        setUpcomingEvents(evtRes.data || [])

        // Activity feed
        var annFeed = await supabase.from('announcements').select('id, title, created_at, priority, organization:organizations (id, name)').in('organization_id', orgIds).in('visibility', ['public', 'members']).order('created_at', { ascending: false }).limit(30)
        var evtFeed = await supabase.from('events').select('id, title, created_at, organization:organizations (id, name)').in('organization_id', orgIds).in('visibility', ['public', 'members']).order('created_at', { ascending: false }).limit(30)
        var docFeed = await supabase.from('documents').select('id, title, created_at, organization:organizations (id, name)').in('organization_id', orgIds).order('created_at', { ascending: false }).limit(30)

        var all = [
          ...(annFeed.data || []).map(function(item) { return { id: 'announcement-' + item.id, type: 'announcement', title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, priority: item.priority, time: timeAgo(item.created_at) } }),
          ...(evtFeed.data  || []).map(function(item) { return { id: 'event-' + item.id,        type: 'event',        title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) } }),
          ...(docFeed.data  || []).map(function(item) { return { id: 'document-' + item.id,     type: 'document',     title: item.title, organizationName: item.organization.name, organizationId: item.organization.id, timestamp: item.created_at, time: timeAgo(item.created_at) } }),
        ]
        all.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp) })
        setActivities(all)

        // Chats
        var chatRes = await supabase.from('chat_messages').select('id, content, created_at, chat_channels(name, organization_id, organizations(name))').order('created_at', { ascending: false }).limit(4)
        if (chatRes.data) setRecentChats(chatRes.data)
      }
    } catch (err) {
      console.error(err); setError(err.message)
      toast.error('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers ──
  function handleDismiss(id) {
    var updated = [...dismissedActivities, id]
    setDismissedActivities(updated)
    localStorage.setItem('dismissedActivities', JSON.stringify(updated))
    mascotSuccessToast('Removed from board.')
  }

  function handleToggleImportant(id) {
    var updated = importantActivities.includes(id)
      ? importantActivities.filter(function(i) { return i !== id })
      : [...importantActivities, id]
    setImportantActivities(updated)
    localStorage.setItem('importantActivities', JSON.stringify(updated))
    mascotSuccessToast(updated.includes(id) ? 'Starred.' : 'Star removed.')
  }

  async function handleUnfollow(orgId, orgName) {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    setUnfollowingId(orgId)
    var { error: err } = await supabase.from('org_followers').delete().eq('user_id', user.id).eq('org_id', orgId)
    setUnfollowingId(null)
    if (err) {
      toast.error('Failed to unfollow.')
    } else {
      setFollowedOrgs(function(prev) { return prev.filter(function(o) { return o.id !== orgId }) })
      setFollowedEvents(function(prev) { return prev.filter(function(e) { return e.organization && e.organization.id !== orgId }) })
      mascotSuccessToast('Unfollowed ' + (orgName || 'organization') + '.')
    }
  }

  function handleToggleWidget(key) {
    var updated = activeWidgets.includes(key)
      ? activeWidgets.filter(function(k) { return k !== key })
      : [...activeWidgets, key]
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
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(function(s) { return s + 1 })
    } else {
      setTourStep(-1)
      setShowTourEnd(true)
      localStorage.setItem('ud_tour_done', '1')
    }
  }

  function handleTourSkip() {
    setTourStep(-1)
    localStorage.setItem('ud_tour_done', '1')
  }

  // ── Derived data ──
  var orgIndexMap = {}
  organizations.forEach(function(org, idx) { orgIndexMap[org.id] = idx })

  var totalUnread = organizations.reduce(function(sum, org) { return sum + (org.unreadCount || 0) }, 0)

  var visibleActivities = activities.filter(function(a) { return !dismissedActivities.includes(a.id) })

  // Date filter options
  var DATE_FILTER_OPTIONS = [
    { key: 'week',    label: 'This week'     },
    { key: '2weeks',  label: 'Last 2 weeks'  },
    { key: 'month',   label: 'Last month'    },
    { key: '3months', label: 'Last 3 months' },
    { key: 'all',     label: 'All time'      },
  ]

  function getDateCutoff(filter) {
    var days = { week: 7, '2weeks': 14, month: 30, '3months': 90 }
    if (!days[filter]) return null
    return new Date(Date.now() - days[filter] * 86400000)
  }

  function getFilteredFeed(typeFilter) {
    var cutoff = getDateCutoff(dateFilter)
    return visibleActivities
      .filter(function(a) {
        var typeMatch = typeFilter === 'all' || a.type === typeFilter
        var orgMatch  = orgFilter === 'all' || a.organizationId === orgFilter
        var dateMatch = !cutoff || new Date(a.timestamp) >= cutoff
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

  // Tab badge counts — new items in last 7 days
  var sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  var tabCounts = {
    events:        visibleActivities.filter(function(a) { return a.type === 'event'        && new Date(a.timestamp) >= sevenDaysAgo }).length,
    announcements: visibleActivities.filter(function(a) { return a.type === 'announcement' && new Date(a.timestamp) >= sevenDaysAgo }).length,
    documents:     visibleActivities.filter(function(a) { return a.type === 'document'     && new Date(a.timestamp) >= sevenDaysAgo }).length,
  }

  var TABS = [
    { key: 'all',           label: 'All Updates'                              },
    { key: 'events',        label: 'Events',        count: tabCounts.events        },
    { key: 'announcements', label: 'Announcements', count: tabCounts.announcements },
    { key: 'documents',     label: 'Documents',     count: tabCounts.documents     },
    { key: 'saved',         label: 'Saved'                                    },
  ]

  var isFeedTab = activeTab === 'all' || activeTab === 'events' || activeTab === 'announcements' || activeTab === 'documents'

  // ── Feed content by tab ──
  function renderFeedContent() {
    if (activeTab === 'saved') {
      return (
        <div>
          {savedEvents.length === 0 ? (
            <EmptyState
              icon={<IcoBookmark />}
              title="No saved events yet"
              desc="Bookmark events from the discovery page to find them here."
              actionLabel="Discover Events"
              onAction={function() { navigate('/discover') }}
            />
          ) : (
            <div style={{ marginTop: '8px' }}>
              {savedEvents.map(function(evt) { return <SavedRow key={evt.id} evt={evt} /> })}
              <Link to="/saved-events" style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '12px', fontWeight: 600, color: BLUE, textDecoration: 'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">View all saved events</Link>
            </div>
          )}
        </div>
      )
    }

    // Feed tabs
    var typeKey = activeTab === 'all' ? 'all' : activeTab === 'announcements' ? 'announcement' : activeTab
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
      return (
        <EmptyState
          icon={<IcoBuilding />}
          title="No organizations yet"
          desc="Create or join an organization to see updates here."
          actionLabel="Create Organization"
          onAction={function() { setShowCreateModal(true) }}
        />
      )
    }

    if (feed.length === 0) {
      return (
        <div role="status" style={{ textAlign: 'center', padding: '40px 24px', border: '1px dashed ' + BDR, borderRadius: '12px', marginTop: '8px', color: MUTED }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>Nothing here</p>
          <p style={{ fontSize: '12px' }}>Try a different filter, or check back when your orgs post updates.</p>
          {dismissedActivities.length > 0 && (
            <button
              onClick={function() { setDismissedActivities([]); localStorage.removeItem('dismissedActivities'); mascotSuccessToast('Board restored.') }}
              style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >Restore {dismissedActivities.length} dismissed items</button>
          )}
        </div>
      )
    }

    return (
      <div ref={feedRef}>
        <NoteGrid
          items={feed}
          orgColors={orgColors}
          orgIndexMap={orgIndexMap}
          onDismiss={handleDismiss}
          onToggleImportant={handleToggleImportant}
          importantActivities={importantActivities}
        />
        {dismissedActivities.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              onClick={function() { setDismissedActivities([]); localStorage.removeItem('dismissedActivities'); mascotSuccessToast('Board restored.') }}
              style={{ fontSize: '11px', fontWeight: 600, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >Restore {dismissedActivities.length} dismissed</button>
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
            [1,2,3].map(function(i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <Skel w="32px" h="32px" radius="8px" />
                  <div style={{ flex: 1 }}><Skel w="75%" h="12px" /><div style={{ marginTop: '4px' }}><Skel w="45%" h="10px" /></div></div>
                </div>
              )
            })
          ) : organizations.length === 0 ? (
            <p style={{ fontSize: '12px', color: MUTED, textAlign: 'center', padding: '8px 0' }}>No organizations yet.</p>
          ) : (
            <div ref={orgsRef}>
              {organizations.map(function(org, idx) {
                var avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                var noteColor   = orgColors[org.id] || NOTE_PRESETS[idx % NOTE_PRESETS.length]
                return (
                  <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: idx < organizations.length - 1 ? '1px solid ' + BDR : 'none', marginBottom: idx < organizations.length - 1 ? '6px' : 0 }}>
                    <Link
                      to={'/organizations/' + org.id}
                      aria-label={'Go to ' + org.name}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flex: 1, minWidth: 0 }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      {org.logo_url
                        ? <img src={org.logo_url} alt={org.name + ' logo'} style={{ width: '30px', height: '30px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0, background: avatarColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{getInitials(org.name)}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{org.name}</p>
                        <p style={{ fontSize: '10px', color: org.unreadCount > 0 ? RED : MUTED, margin: 0 }}>
                          {org.unreadCount > 0 ? org.unreadCount + ' unread' : (org.custom_title || org.role)}
                        </p>
                      </div>
                    </Link>
                    <OrgColorPicker orgId={org.id} currentColor={noteColor} onSelect={handleOrgColorChange} />
                  </div>
                )
              })}
              <button
                onClick={function() { setShowCreateModal(true) }}
                aria-label="Create a new organization"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', padding: '8px', background: 'transparent', border: '1px dashed ' + BDR, borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: MUTED }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              ><IcoPlus /> New organization</button>
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
            <div style={{ textAlign: 'center', padding: '8px 0', color: MUTED }}>
              <p style={{ fontSize: '12px', marginBottom: '10px' }}>No messages yet.</p>
              {organizations.length > 0 && (
                <button onClick={function() { navigate('/organizations/' + organizations[0].id + '/chat') }} style={{ padding: '6px 14px', background: BLUE, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">Start chatting</button>
              )}
            </div>
          ) : (
            recentChats.map(function(msg) {
              var channelName = msg.chat_channels ? msg.chat_channels.name : 'channel'
              var orgId = msg.chat_channels ? msg.chat_channels.organization_id : null
              var orgName = (msg.chat_channels && msg.chat_channels.organizations) ? msg.chat_channels.organizations.name : ''
              return (
                <button
                  key={msg.id}
                  onClick={function() { if (orgId) navigate('/organizations/' + orgId + '/chat') }}
                  aria-label={'Open ' + channelName + ' channel'}
                  style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', borderRadius: '6px', textAlign: 'left', marginBottom: '4px' }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
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
              : savedEvents.slice(0, 3).map(function(evt) {
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
              <p style={{ fontSize: '12px', lineHeight: 1.55, marginBottom: '10px' }}>Follow organizations to see their public events.</p>
              <Link to="/explore" style={{ display: 'inline-block', padding: '5px 12px', background: 'rgba(139,92,246,0.1)', color: PURPLE, border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }} className="focus:outline-none focus:ring-2 focus:ring-purple-500">Find organizations</Link>
            </div>
          ) : (
            followedOrgs.map(function(org, idx) {
              var color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              var isUnfollowing = unfollowingId === org.id
              return (
                <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Link to={'/organizations/' + org.id} aria-label={'View ' + org.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, textDecoration: 'none' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    {org.logo_url
                      ? <img src={org.logo_url} alt={org.name + ' logo'} style={{ width: '28px', height: '28px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0, background: color, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{getInitials(org.name)}</div>
                    }
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
      `}</style>

      {tourStep >= 0 && (
        <TourOverlay step={tourStep} refs={tourRefs} onNext={handleTourNext} onSkip={handleTourSkip} />
      )}
      {showTourEnd && (
        <TourEndModal onClose={function() { setShowTourEnd(false) }} />
      )}

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
              <p style={{ fontSize: '12px', color: MUTED, marginTop: '3px' }}>
                Updates from your {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={function() { setTourStep(0) }}
                aria-label="Take the guided tour"
                style={{ fontSize: '12px', fontWeight: 600, color: MUTED, background: 'transparent', border: '1px solid ' + BDR, padding: '5px 14px', borderRadius: '8px', cursor: 'pointer' }}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500"
              >Take the tour</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={function() { setShowInviteMember(true) }}
                  aria-label="Invite a member to your organization"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: BLUE, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <UserPlus size={13} aria-hidden="true" /> Invite Member
                </button>
                <button
                  onClick={function() { setShowInviteOrg(true) }}
                  aria-label="Invite an organization"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: PURPLE, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  className="focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <Building2 size={13} aria-hidden="true" /> Invite Org
                </button>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            <StatCard label="Orgs"       value={organizations.length}  Icon={IcoOrgs}     accentColor={PURPLE} loading={loading} />
            <StatCard label="Events This Week"  value={upcomingEvents.length} Icon={IcoCalendar} accentColor={BLUE}   loading={loading} />
            <StatCard label="Unread"     value={totalUnread}           Icon={IcoBell}     accentColor={RED}    loading={loading} />
          </div>

          {/* Tab bar */}
          <div style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Dashboard sections"
              style={{ display: 'flex', borderBottom: '1px solid ' + BDR, paddingLeft: '4px', overflowX: 'auto' }}
            >
              {TABS.map(function(tab) {
                var isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={function() { setActiveTab(tab.key) }}
                    aria-label={tab.label + (tab.count ? ', ' + tab.count + ' new this week' : '')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '12px 16px', fontSize: '13px', fontWeight: isActive ? 700 : 500,
                      color: isActive ? BLUE : MUTED,
                      background: 'transparent', border: 'none',
                      borderBottom: isActive ? '2px solid ' + BLUE : '2px solid transparent',
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      marginBottom: '-1px',
                    }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: '18px', height: '18px', padding: '0 5px',
                          borderRadius: '99px', fontSize: '10px', fontWeight: 700,
                          background: isActive ? BLUE : '#E2E8F0',
                          color: isActive ? '#FFFFFF' : MUTED,
                        }}
                      >{tab.count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Filter row (feed tabs only) */}
            {isFeedTab && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderBottom: '1px solid ' + BDR, flexWrap: 'wrap' }}>
                <OrgFilterDropdown organizations={organizations} selectedOrgId={orgFilter} onChange={setOrgFilter} />
                <div style={{ width: '1px', height: '18px', background: BDR, flexShrink: 0 }} aria-hidden="true" />
                {/* Date filter */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {DATE_FILTER_OPTIONS.map(function(opt) {
                    var isSelected = dateFilter === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={function() { setDateFilter(opt.key) }}
                        aria-pressed={isSelected}
                        style={{
                          padding: '4px 10px', borderRadius: '99px', border: '1px solid ' + (isSelected ? YELLOW : BDR),
                          background: isSelected ? 'rgba(245,183,49,0.1)' : 'transparent',
                          color: isSelected ? '#B45309' : MUTED,
                          fontSize: '11px', fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                        className="focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >{opt.label}</button>
                    )
                  })}
                </div>
                <div style={{ flex: 1 }} />
                {dismissedActivities.length > 0 && (
                  <button
                    onClick={function() { setDismissedActivities([]); localStorage.removeItem('dismissedActivities'); mascotSuccessToast('Board restored.') }}
                    style={{ fontSize: '11px', fontWeight: 600, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >Restore {dismissedActivities.length} hidden</button>
                )}
              </div>
            )}

            {/* Tab content */}
            <div style={{ padding: '16px' }}>
              {renderFeedContent()}
            </div>
          </div>

          {/* Upcoming events (below feed, for All tab) */}
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

          {/* Active widgets */}
          {activeWidgets.map(function(key) { return renderWidget(key) })}

          {/* Customize button */}
          <div ref={customizeRef}>
            <button
              onClick={function() { setShowCustomize(function(v) { return !v }) }}
              aria-expanded={showCustomize}
              aria-controls="widget-picker"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '10px',
                background: '#F8FAFC', border: '1.5px dashed ' + BDR,
                borderRadius: '10px', fontSize: '12px', fontWeight: 500, color: MUTED,
                cursor: 'pointer', marginBottom: '10px',
              }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <IcoSettings /> Customize widgets
            </button>

            {showCustomize && (
              <div
                id="widget-picker"
                style={{ background: CARD, border: '1px solid ' + BDR, borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}
              >
                <div style={{ padding: '10px 14px', background: BG, borderBottom: '1px solid ' + BDR, fontSize: '12px', fontWeight: 600, color: TEXT2 }}>
                  Add or remove widgets
                </div>
                {WIDGET_DEFS.map(function(def) {
                  var isOn = activeWidgets.includes(def.key)
                  return (
                    <button
                      key={def.key}
                      onClick={function() { handleToggleWidget(def.key) }}
                      aria-pressed={isOn}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', padding: '10px 14px',
                        border: 'none', borderBottom: '1px solid ' + BDR,
                        background: 'transparent', cursor: 'pointer', textAlign: 'left',
                      }}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {/* Checkbox visual */}
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                        border: '1.5px solid ' + (isOn ? BLUE : BDR),
                        background: isOn ? BLUE : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isOn && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
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
      <CreateOrganization
        isOpen={showCreateModal}
        onClose={function() { setShowCreateModal(false) }}
        onSuccess={function() { fetchAll(); setShowCreateModal(false) }}
      />
      {selectedOrgForEvent && (
        <CreateEvent
          isOpen={showCreateEvent}
          onClose={function() { setShowCreateEvent(false); setSelectedOrgForEvent(null) }}
          onSuccess={fetchAll}
          organizationId={selectedOrgForEvent.id}
          organizationName={selectedOrgForEvent.name}
        />
      )}
      <InviteMemberModal isOpen={showInviteMember} onClose={function() { setShowInviteMember(false) }} />
      <InviteOrgModal    isOpen={showInviteOrg}    onClose={function() { setShowInviteOrg(false) }} />

    </div>
  )
}

export default UnifiedDashboard