import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ─── Responsive CSS injected once ────────────────────────────────────────────
var RESPONSIVE_CSS = [
  '.ft-grid {',
  '  display: grid;',
  '  grid-template-columns: minmax(0,1fr) minmax(0,360px);',
  '  gap: 48px;',
  '  align-items: center;',
  '  max-width: 1040px;',
  '  margin: 0 auto;',
  '}',
  '@media (max-width: 880px) {',
  '  .ft-grid { grid-template-columns: 1fr; gap: 32px; }',
  '  .ft-carousel-col { order: -1; }',
  '}',
].join('\n');

// ─── SVG icon helper ──────────────────────────────────────────────────────────
function Icon(props) {
  var s = props.size || 18;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Array.isArray(props.d)
        ? props.d.map(function(p, i) { return <path key={i} d={p} />; })
        : <path d={props.d} />}
    </svg>
  );
}

var IC = {
  check:    'M5 13l4 4L19 7',
  arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
  chevL:    'M15 19l-7-7 7-7',
  chevR:    'M9 5l7 7-7 7',
  plus:     'M12 4v16m8-8H4',
  users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  mega:     ['M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z'],
  doc:      ['M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
  chart:    ['M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
  globe:    ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  credit:   'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  monitor:  'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  ticket:   ['M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'],
  share:    'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
  zap:      ['M13 10V3L4 14h7v7l9-11h-7z'],
  qr:       ['M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 4h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'],
};

// ─── Plan badge ───────────────────────────────────────────────────────────────
var PLAN_STYLES = {
  Starter: { bg: 'rgba(245,183,49,0.15)',  text: '#D4A017', border: 'rgba(245,183,49,0.35)'  },
  Growth:  { bg: 'rgba(59,130,246,0.15)',  text: '#60A5FA', border: 'rgba(59,130,246,0.35)'  },
  Pro:     { bg: 'rgba(34,197,94,0.15)',   text: '#4ADE80', border: 'rgba(34,197,94,0.35)'   },
};
function PlanBadge(props) {
  var s = PLAN_STYLES[props.plan];
  if (!s) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '99px',
      fontSize: '10px', fontWeight: 700, background: s.bg, color: s.text, border: '1px solid ' + s.border, whiteSpace: 'nowrap' }}>
      {props.plan}
    </span>
  );
}

// ─── Screenshot slide wrapper ─────────────────────────────────────────────────
// Tries to load a real screenshot first. If missing, renders the mock UI fallback.
function ScreenshotSlide(props) {
  var [failed, setFailed] = useState(false);
  if (!failed && props.src) {
    return (
      <div style={{ minHeight: '240px', display: 'flex', alignItems: 'stretch' }}>
        <img
          src={props.src}
          alt={props.alt || ''}
          style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: '0 0 4px 4px' }}
          onError={function() { setFailed(true); }}
        />
      </div>
    );
  }
  return <div>{props.children}</div>;
}

// ─── Carousel ─────────────────────────────────────────────────────────────────
function Carousel(props) {
  var slides = props.slides;
  var color  = props.color || '#3B82F6';
  var [idx, setIdx] = useState(0);
  function prev() { setIdx(function(i) { return i === 0 ? slides.length - 1 : i - 1; }); }
  function next() { setIdx(function(i) { return i === slides.length - 1 ? 0 : i + 1; }); }
  return (
    <div role="region" aria-label={props.label + ' preview'}>
      <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #2A3550', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
        {/* Slide content — no browser chrome */}
        <div style={{ background: '#0E1523', minHeight: '240px' }} key={idx}>
          {slides[idx]}
        </div>
        {/* Pagination dots */}
        {slides.length > 1 && (
          <div style={{ background: '#151B2D', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #2A3550' }}>
            <button onClick={prev} aria-label="Previous screenshot"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
              <Icon d={IC.chevL} size={13} />
            </button>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              {slides.map(function(_, i) {
                return (
                  <button key={i} onClick={function() { setIdx(i); }}
                    aria-label={'View screenshot ' + (i + 1)}
                    aria-pressed={i === idx}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                    style={{ width: i === idx ? '18px' : '6px', height: '6px', borderRadius: '99px', background: i === idx ? color : '#2A3550', border: 'none', padding: 0, cursor: 'pointer', transition: 'width 0.2s, background 0.2s' }} />
                );
              })}
            </div>
            <button onClick={next} aria-label="Next screenshot"
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '7px', padding: '5px 9px', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
              <Icon d={IC.chevR} size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mock UI fallbacks (shown when screenshot not yet available) ───────────────

function Mock_MemberDirectory() {
  var rows = [
    { initials: 'AL', name: 'Ana Lopez',   role: 'Admin',  roleC: '#A78BFA', status: 'Active'   },
    { initials: 'JM', name: 'James Moore', role: 'Editor', roleC: '#60A5FA', status: 'Active'   },
    { initials: 'SR', name: 'Sara Ruiz',   role: 'Member', roleC: '#4ADE80', status: 'Active'   },
    { initials: 'TD', name: 'Tom Diaz',    role: 'Member', roleC: '#4ADE80', status: 'Inactive' },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Members</span>
        <span style={{ fontSize: '10px', color: '#64748B', background: '#1A2035', padding: '2px 8px', borderRadius: '99px', border: '1px solid #2A3550' }}>4 total</span>
      </div>
      {rows.map(function(r) {
        return (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: '#1A2035', marginBottom: '5px', border: '1px solid #2A3550' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1E2845', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#94A3B8', flexShrink: 0 }}>{r.initials}</div>
            <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{r.name}</span>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: 'rgba(139,92,246,0.12)', color: r.roleC }}>{r.role}</span>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: r.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.15)', color: r.status === 'Active' ? '#4ADE80' : '#94A3B8' }}>{r.status}</span>
          </div>
        );
      })}
    </div>
  );
}

function Mock_Committees() {
  var groups = [
    { name: 'Board of Directors',  members: 7,  color: '#8B5CF6' },
    { name: 'Events Committee',    members: 12, color: '#3B82F6' },
    { name: 'Volunteer Team',      members: 23, color: '#22C55E' },
    { name: 'Finance Committee',   members: 4,  color: '#F97316' },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Committees &amp; Groups</p>
      {groups.map(function(g) {
        return (
          <div key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '8px', background: '#1A2035', marginBottom: '6px', border: '1px solid #2A3550' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: g.color }} aria-hidden="true" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{g.name}</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748B' }}>{g.members} members</span>
          </div>
        );
      })}
    </div>
  );
}

function Mock_Dues() {
  var tiers = [
    { tier: 'General Member', amount: '$50/yr',  count: 94, pct: 80, color: '#3B82F6' },
    { tier: 'Supporting',     amount: '$100/yr', count: 18, pct: 45, color: '#8B5CF6' },
    { tier: 'Board',          amount: '$25/yr',  count: 7,  pct: 20, color: '#F5B731' },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Membership Tiers &amp; Dues</p>
      {tiers.map(function(t) {
        return (
          <div key={t.tier} style={{ padding: '10px 12px', borderRadius: '8px', background: '#1A2035', marginBottom: '8px', border: '1px solid #2A3550' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{t.tier}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: t.color }}>{t.amount}</span>
            </div>
            <div style={{ height: '5px', background: '#2A3550', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: t.pct + '%', height: '100%', background: t.color, borderRadius: '99px' }} aria-hidden="true" />
            </div>
            <p style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>{t.count} members</p>
          </div>
        );
      })}
    </div>
  );
}

function Mock_Calendar() {
  var mos   = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  var bars  = [30,52,45,68,41,77,60,85,92,74,55,40];
  var days  = ['S','M','T','W','T','F','S'];
  var dates = [null,null,null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
  var dots  = { 5:'#3B82F6', 12:'#F5B731', 19:'#22C55E', 26:'#8B5CF6' };
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>April 2026</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
        {days.map(function(d, i) { return <div key={i} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600, color: '#64748B' }}>{d}</div>; })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '12px' }}>
        {dates.map(function(d, i) {
          var ev = d && dots[d];
          return (
            <div key={i} style={{ aspectRatio: '1', borderRadius: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: d === 8 ? '#1E2845' : 'transparent', border: d === 8 ? '1px solid #3B82F6' : '1px solid transparent' }}>
              {d && <span style={{ fontSize: '9px', color: d === 8 ? '#60A5FA' : '#CBD5E1' }}>{d}</span>}
              {ev && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: dots[d], marginTop: '1px' }} aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '50px' }}>
        {bars.map(function(h, i) {
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <div style={{ width: '100%', borderRadius: '2px 2px 0 0', background: 'rgba(59,130,246,0.6)', height: (h / 100 * 42) + 'px' }} aria-hidden="true" />
              <span style={{ fontSize: '7px', color: '#64748B' }}>{mos[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mock_EventCard() {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ background: '#1A2035', borderRadius: '10px', border: '1px solid #2A3550', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ height: '64px', background: 'linear-gradient(135deg,#1D3461,#2D1B4E)', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Spring Fundraiser Gala</span>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Sat, Apr 26 · 6:00 PM</span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Toledo Museum</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={{ flex: 1, padding: '6px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Going</button>
            <button style={{ flex: 1, padding: '6px', background: '#1E2845', color: '#94A3B8', border: '1px solid #2A3550', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Maybe</button>
            <button style={{ flex: 1, padding: '6px', background: '#1E2845', color: '#94A3B8', border: '1px solid #2A3550', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Can't Go</button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 12px', background: '#1A2035', borderRadius: '8px', border: '1px solid #2A3550' }}>
        <span style={{ color: '#22C55E' }}><Icon d={IC.qr} size={16} /></span>
        <span style={{ fontSize: '11px', color: '#CBD5E1' }}>QR check-in enabled · 43 attending</span>
      </div>
    </div>
  );
}

function Mock_Tickets() {
  var types = [
    { label: 'General Admission', price: '$25', sold: 64, cap: 100, full: false },
    { label: 'Early Bird',        price: '$18', sold: 30, cap: 30,  full: true  },
    { label: 'VIP Table (8)',     price: '$200',sold: 2,  cap: 10,  full: false },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Ticket Types</p>
      {types.map(function(t) {
        return (
          <div key={t.label} style={{ padding: '9px 12px', borderRadius: '8px', background: '#1A2035', marginBottom: '6px', border: '1px solid ' + (t.full ? 'rgba(239,68,68,0.3)' : '#2A3550') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: t.full ? '#94A3B8' : '#FFFFFF' }}>{t.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {t.full && <span style={{ fontSize: '9px', fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.12)', padding: '1px 6px', borderRadius: '99px' }}>Sold Out</span>}
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#F5B731' }}>{t.price}</span>
              </div>
            </div>
            <div style={{ height: '4px', background: '#2A3550', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: (t.sold / t.cap * 100) + '%', height: '100%', background: t.full ? '#EF4444' : '#22C55E', borderRadius: '99px' }} aria-hidden="true" />
            </div>
            <p style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>{t.sold} / {t.cap} sold</p>
          </div>
        );
      })}
    </div>
  );
}

function Mock_Announcements() {
  var posts = [
    { badge: 'Urgent', bC: '#EF4444', bBg: 'rgba(239,68,68,0.12)', title: 'Board meeting rescheduled to April 22', time: '2h ago', unread: true },
    { badge: 'Normal', bC: '#3B82F6', bBg: 'rgba(59,130,246,0.12)', title: 'Volunteer sign-ups open for spring cleanup', time: '1d ago', unread: false },
    { badge: 'Normal', bC: '#3B82F6', bBg: 'rgba(59,130,246,0.12)', title: 'Grant application window closes May 1', time: '3d ago', unread: false },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Announcements</p>
      {posts.map(function(a, i) {
        return (
          <div key={i} style={{ padding: '9px 12px', borderRadius: '8px', background: a.unread ? '#1E2845' : '#1A2035', marginBottom: '6px', border: '1px solid ' + (a.unread ? '#2A3550' : '#1E2845'), display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            {a.unread && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0, marginTop: '5px' }} aria-hidden="true" />}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '3px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px', background: a.bBg, color: a.bC }}>{a.badge}</span>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.4, marginBottom: '3px' }}>{a.title}</p>
              <p style={{ fontSize: '10px', color: '#64748B' }}>{a.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Mock_EmailBlast() {
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Email Blast</p>
      <div style={{ background: '#1A2035', borderRadius: '10px', border: '1px solid #2A3550', padding: '14px' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '3px' }}>To</div>
          <div style={{ background: '#151B2D', border: '1px solid #2A3550', borderRadius: '6px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#CBD5E1' }}>All members (94)</span>
            <span style={{ fontSize: '10px', color: '#64748B' }}>Change</span>
          </div>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '3px' }}>Subject</div>
          <div style={{ background: '#151B2D', border: '1px solid #2A3550', borderRadius: '6px', padding: '6px 10px' }}>
            <span style={{ fontSize: '11px', color: '#FFFFFF' }}>April Newsletter — Spring Events</span>
          </div>
        </div>
        <div style={{ background: '#151B2D', border: '1px solid #2A3550', borderRadius: '6px', padding: '10px', minHeight: '50px' }}>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Message content...</span>
        </div>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button style={{ padding: '5px 12px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '6px', color: '#94A3B8', fontSize: '11px', cursor: 'pointer' }}>Save Draft</button>
          <button style={{ padding: '5px 12px', background: '#3B82F6', border: 'none', borderRadius: '6px', color: '#FFFFFF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Send Blast</button>
        </div>
      </div>
    </div>
  );
}

function Mock_EmailAnalytics() {
  var stats = [
    { label: 'Delivered', val: '92',  pct: 92, color: '#22C55E' },
    { label: 'Opened',    val: '61%', pct: 61, color: '#3B82F6' },
    { label: 'Clicked',   val: '22%', pct: 22, color: '#8B5CF6' },
    { label: 'Bounced',   val: '2',   pct: 2,  color: '#EF4444' },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '12px' }}>Email Analytics</p>
      {stats.map(function(s) {
        return (
          <div key={s.label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>{s.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: s.color }}>{s.val}</span>
            </div>
            <div style={{ height: '6px', background: '#2A3550', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: s.pct + '%', height: '100%', background: s.color, borderRadius: '99px' }} aria-hidden="true" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Mock_DocLibrary() {
  var files = [
    { name: 'Meeting Minutes — Mar 2026.pdf', size: '142 KB', color: '#3B82F6' },
    { name: 'Annual Report 2025.pdf',          size: '2.1 MB', color: '#22C55E' },
    { name: 'Grant Application Template.docx', size: '84 KB',  color: '#8B5CF6' },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {['All Files','Minutes','Bylaws','Forms'].map(function(t, i) {
          return <button key={t} style={{ padding: '4px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: i === 0 ? '#1E2845' : 'transparent', border: i === 0 ? '1px solid #3B82F6' : '1px solid transparent', color: i === 0 ? '#60A5FA' : '#64748B', cursor: 'pointer' }}>{t}</button>;
        })}
      </div>
      {files.map(function(f) {
        return (
          <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', background: '#1A2035', marginBottom: '5px', border: '1px solid #2A3550' }}>
            <span style={{ color: f.color }}><Icon d={IC.doc} size={16} /></span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF' }}>{f.name}</p>
              <p style={{ fontSize: '10px', color: '#64748B' }}>{f.size}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Mock_Poll() {
  var opts = [
    { label: 'Saturday morning', pct: 52 },
    { label: 'Weekday evening',  pct: 30 },
    { label: 'Sunday afternoon', pct: 18 },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ background: '#1A2035', borderRadius: '10px', border: '1px solid #2A3550', padding: '14px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>Best time for the annual meeting?</p>
        {opts.map(function(o) {
          return (
            <div key={o.label} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '11px', color: '#CBD5E1' }}>{o.label}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731' }}>{o.pct}%</span>
              </div>
              <div style={{ height: '7px', background: '#2A3550', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: o.pct + '%', height: '100%', background: '#F5B731', opacity: 0.8, borderRadius: '99px' }} aria-hidden="true" />
              </div>
            </div>
          );
        })}
        <p style={{ fontSize: '10px', color: '#64748B', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2A3550' }}>60 votes total · Closes in 2 days</p>
      </div>
    </div>
  );
}

function Mock_PublicPage() {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ border: '1px solid #2A3550', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '64px', background: 'linear-gradient(135deg,#1D3461,#2D1B4E)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#FFF' }}>TF</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>Toledo Food Bank</div>
            <div style={{ fontSize: '9px', color: '#94A3B8' }}>toledobank.syndicade.com</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '8px', fontWeight: 700, padding: '2px 6px', borderRadius: '99px', background: 'rgba(245,183,49,0.2)', color: '#F5B731', border: '1px solid rgba(245,183,49,0.3)' }}>Verified Nonprofit</span>
        </div>
        <div style={{ padding: '12px 14px', background: '#0E1523' }}>
          <p style={{ fontSize: '11px', color: '#CBD5E1', marginBottom: '10px', lineHeight: 1.5 }}>Serving the Toledo community since 1974. No family should go hungry.</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={{ flex: 1, padding: '6px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Donate</button>
            <button style={{ flex: 1, padding: '6px', background: '#1A2035', color: '#94A3B8', border: '1px solid #2A3550', borderRadius: '6px', fontSize: '10px', cursor: 'pointer' }}>Volunteer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mock_PageEditor() {
  return (
    <div style={{ padding: '14px', display: 'flex', gap: '10px' }}>
      <div style={{ width: '100px', flexShrink: 0, background: '#151B2D', borderRadius: '8px', border: '1px solid #2A3550', padding: '8px' }}>
        <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#F5B731', marginBottom: '6px' }}>Pages</p>
        {['Home','About','Programs','Team','Gallery','Donate'].map(function(p, i) {
          return <div key={p} style={{ padding: '4px 7px', borderRadius: '5px', fontSize: '10px', color: i === 0 ? '#FFFFFF' : '#94A3B8', background: i === 0 ? '#1E2845' : 'transparent', marginBottom: '2px' }}>{p}</div>;
        })}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>Page Blocks</p>
        {['Hero Section','Events List','About Section','Contact Form'].map(function(b) {
          return (
            <div key={b} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#1A2035', borderRadius: '7px', marginBottom: '5px', border: '1px solid #2A3550' }}>
              <span style={{ fontSize: '10px', color: '#CBD5E1' }}>{b}</span>
              <span style={{ fontSize: '9px', color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '1px 5px', borderRadius: '99px' }}>Live</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mock_OrgDiscovery() {
  return (
    <div style={{ padding: '12px' }}>
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #2A3550', display: 'flex', gap: '6px' }}>
          <div style={{ flex: 1, background: '#151B2D', border: '1px solid #2A3550', borderRadius: '6px', padding: '5px 9px' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Search organizations...</span>
          </div>
          <button style={{ padding: '5px 10px', background: '#3B82F6', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#FFF', cursor: 'pointer' }}>Search</button>
        </div>
        {[
          { name: 'Toledo Food Bank',  cats: ['Food Security','Community'], color: '#22C55E' },
          { name: 'Riverview Gardens', cats: ['Environment','Youth'],       color: '#3B82F6' },
        ].map(function(org) {
          return (
            <div key={org.name} style={{ padding: '10px 12px', borderBottom: '1px solid #1A2035', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: org.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#FFF', flexShrink: 0 }}>{org.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{org.name}</span>
                  <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '99px', background: 'rgba(245,183,49,0.15)', color: '#F5B731', border: '1px solid rgba(245,183,49,0.3)' }}>Verified</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {org.cats.map(function(c) { return <span key={c} style={{ fontSize: '9px', color: '#64748B', background: '#151B2D', padding: '1px 5px', borderRadius: '99px', border: '1px solid #2A3550' }}>{c}</span>; })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mock_CommunityBoard() {
  var posts = [
    { tag: 'Supplies', org: 'TF', orgName: 'Toledo Family Services', text: '"A family of 4 needs 2 twin beds — urgently."', time: '2h ago' },
    { tag: 'Skills',   org: 'NA', orgName: 'NW Advocacy Center',     text: '"Looking for a Spanish interpreter for May 7."', time: '3d ago' },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#A78BFA', marginBottom: '10px' }}>Community Board — Ask Board</p>
      {posts.map(function(post, i) {
        return (
          <div key={i} style={{ background: '#E1BEE7', borderRadius: '4px', padding: '10px 12px', marginBottom: '10px', marginTop: '8px', position: 'relative',
            backgroundImage: 'repeating-linear-gradient(transparent,transparent 23px,rgba(0,0,0,0.06) 24px)', backgroundPositionY: '32px' }}>
            <div aria-hidden="true" style={{ width: '10px', height: '10px', borderRadius: '50%', position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle at 38% 32%,rgba(255,255,255,0.5) 0%,#6A1B9A 52%,rgba(0,0,0,0.2) 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }} />
            <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: '3px', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', background: '#9C27B0', color: '#F3E5F5', marginBottom: '5px' }}>{post.tag}</span>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#9C27B0', color: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: 700 }}>{post.org}</div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#374151' }}>{post.orgName}</span>
            </div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#111827', fontFamily: 'Georgia,serif', lineHeight: 1.4, marginBottom: '4px' }}>{post.text}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: '#6B7280' }}>{post.time}</span>
              <button style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, border: 'none', cursor: 'pointer', background: '#9C27B0', color: '#F3E5F5' }}>Respond</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Mock_AnalyticsChart() {
  var bars = [30,52,45,68,41,77,60,85,92,74,88,95];
  var mos  = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {[['247','Attendees','#3B82F6'],['18','Events','#22C55E'],['83%','Capacity','#8B5CF6']].map(function(s) {
          return <div key={s[1]} style={{ flex: 1, padding: '8px', background: '#1A2035', borderRadius: '8px', border: '1px solid #2A3550', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: s[2] }}>{s[0]}</div>
            <div style={{ fontSize: '9px', color: '#64748B', marginTop: '2px' }}>{s[1]}</div>
          </div>;
        })}
      </div>
      <p style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>Attendance by month</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px' }}>
        {bars.map(function(h, i) {
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '100%', borderRadius: '2px 2px 0 0', background: 'rgba(59,130,246,0.65)', height: (h / 100 * 50) + 'px' }} aria-hidden="true" />
              <span style={{ fontSize: '7px', color: '#64748B' }}>{mos[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mock_AttendanceReport() {
  var rows = [
    { name: 'Ana Lopez',   rsvp: 'Going', checkin: true  },
    { name: 'James Moore', rsvp: 'Going', checkin: true  },
    { name: 'Sara Ruiz',   rsvp: 'Going', checkin: false },
    { name: 'Tom Diaz',    rsvp: 'Maybe', checkin: false },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Attendance Report</p>
      <div style={{ border: '1px solid #2A3550', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: '#1E2845', padding: '6px 12px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Member</span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', padding: '0 12px', textAlign: 'center' }}>RSVP</span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Check-In</span>
        </div>
        {rows.map(function(r) {
          return (
            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '7px 12px', borderTop: '1px solid #1A2035', background: '#0E1523' }}>
              <span style={{ fontSize: '11px', color: '#CBD5E1' }}>{r.name}</span>
              <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', padding: '0 12px' }}>{r.rsvp}</span>
              <span style={{ fontSize: '10px', color: r.checkin ? '#22C55E' : '#64748B' }}>{r.checkin ? 'Yes' : '—'}</span>
            </div>
          );
        })}
      </div>
      <button style={{ width: '100%', marginTop: '8px', padding: '6px', background: '#1A2035', border: '1px solid #2A3550', borderRadius: '7px', fontSize: '11px', fontWeight: 600, color: '#94A3B8', cursor: 'pointer' }}>Export CSV</button>
    </div>
  );
}

function Mock_Revenue() {
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Revenue Overview</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {[['$2,840','Ticket Sales','#22C55E'],['$1,200','Donations','#3B82F6'],['$3,750','Dues','#8B5CF6'],['$0','Platform Fee','#64748B']].map(function(s) {
          return <div key={s[1]} style={{ padding: '9px', background: '#1A2035', borderRadius: '8px', border: '1px solid #2A3550' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: s[2] }}>{s[0]}</div>
            <div style={{ fontSize: '9px', color: '#64748B', marginTop: '2px' }}>{s[1]}</div>
          </div>;
        })}
      </div>
      <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#4ADE80' }}>$7,790 total — you kept all of it.</p>
        <p style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>No revenue cut from Syndicade.</p>
      </div>
    </div>
  );
}

function Mock_DuesStatus() {
  var members = [
    { name: 'Ana Lopez',   tier: 'General',   status: 'Paid',    amount: '$50' },
    { name: 'James Moore', tier: 'Supporting', status: 'Paid',    amount: '$100' },
    { name: 'Sara Ruiz',   tier: 'General',   status: 'Overdue', amount: '$50'  },
    { name: 'Tom Diaz',    tier: 'Board',     status: 'Pending', amount: '$25'  },
  ];
  return (
    <div style={{ padding: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#F5B731', marginBottom: '10px' }}>Dues Status</p>
      {members.map(function(m) {
        var sc = m.status === 'Paid' ? { bg: 'rgba(34,197,94,0.12)', c: '#4ADE80', bd: 'rgba(34,197,94,0.25)' }
               : m.status === 'Overdue' ? { bg: 'rgba(239,68,68,0.12)', c: '#F87171', bd: 'rgba(239,68,68,0.25)' }
               : { bg: 'rgba(245,183,49,0.12)', c: '#FCD34D', bd: 'rgba(245,183,49,0.25)' };
        return (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: '#1A2035', marginBottom: '5px', border: '1px solid #2A3550' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF' }}>{m.name}</p>
              <p style={{ fontSize: '10px', color: '#64748B' }}>{m.tier} · {m.amount}/yr</p>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: sc.bg, color: sc.c, border: '1px solid ' + sc.bd }}>{m.status}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section definitions ──────────────────────────────────────────────────────
// src: paths to real screenshots in /public/screenshots/
// When you have real screenshots, drop them in /public/screenshots/ and they'll
// automatically replace the mock UI below. File names are listed per slide.
var SECTIONS = [
  {
    id: 'members', label: 'Member Management', color: '#3B82F6', icon: IC.users,
    headline: 'Manage your members, not a spreadsheet',
    description: 'A real member directory built for volunteer orgs — roles, committees, dues, and custom assignments in one place.',
    features: [
      { name: 'Member directory with profiles', desc: 'Photos, bios, contact info, and custom fields per org.', plans: ['Starter','Growth','Pro'] },
      { name: 'Invite members by email', desc: 'Bulk or individual invitations with role assignment on signup.', plans: ['Starter','Growth','Pro'] },
      { name: 'Role management (Admin, Editor, Member)', desc: 'Admins manage everything. Editors create and publish content. Members participate.', plans: ['Starter','Growth','Pro'] },
      { name: 'Custom role assignments', desc: 'Give any member a descriptive title — Board Chair, Treasurer, Committee Lead.', plans: ['Starter','Growth','Pro'] },
      { name: 'Committees and groups', desc: 'Create sub-groups for boards, committees, and volunteer teams.', plans: ['Starter','Growth','Pro'] },
      { name: 'Membership tiers', desc: 'Create levels (General, Supporting, Board) with separate dues amounts.', plans: ['Growth','Pro'] },
      { name: 'Dues collection + paid status tracking', desc: 'Collect recurring dues via Stripe. Track paid, overdue, and pending status per member.', plans: ['Growth','Pro'] },
      { name: 'Multi-org unified dashboard', desc: 'Members in multiple orgs see events and updates from all of them in one place.', plans: ['Starter','Growth','Pro'] },
    ],
    slides: [
      { src: '/screenshots/members-directory.png', alt: 'Member directory', mock: <Mock_MemberDirectory /> },
      { src: '/screenshots/members-committees.png', alt: 'Committees and groups', mock: <Mock_Committees /> },
      { src: '/screenshots/members-dues.png', alt: 'Membership tiers and dues', mock: <Mock_Dues /> },
    ],
  },
  {
    id: 'events', label: 'Events', color: '#22C55E', icon: IC.calendar,
    headline: 'Events that actually fill up',
    description: 'From free neighborhood meetups to paid fundraising galas — one system handles both.',
    features: [
      { name: 'Event creation + calendar', desc: 'Public or members-only events with date, location, and rich details.', plans: ['Starter','Growth','Pro'] },
      { name: 'RSVP + guest tracking', desc: 'Going / Maybe / Not Going with guest count per RSVP.', plans: ['Starter','Growth','Pro'] },
      { name: 'Recurring events', desc: 'Weekly, monthly, or custom recurrence patterns.', plans: ['Starter','Growth','Pro'] },
      { name: 'Public events (no login required)', desc: 'Anyone can view and RSVP without creating an account.', plans: ['Starter','Growth','Pro'] },
      { name: 'QR codes + attendance check-in', desc: 'Day-of QR scan on any device. No hardware or extra app needed.', plans: ['Starter','Growth','Pro'] },
      { name: 'Export to .ics (Google Calendar / iCal)', desc: 'One-click calendar file download for any event.', plans: ['Starter','Growth','Pro'] },
      { name: 'Paid event tickets + early bird pricing', desc: 'Flat $1/ticket fee. No percentage cuts.', plans: ['Growth','Pro'] },
      { name: 'Ticket confirmation emails', desc: 'Automatic email with ticket details and calendar invite.', plans: ['Growth','Pro'] },
      { name: 'Custom checkout fields', desc: 'Collect t-shirt sizes, dietary restrictions, or any custom data at checkout.', plans: ['Pro'] },
      { name: 'Featured event placement', desc: 'Highlight your event on the discovery board. $15/wk or $40/30 days.', plans: ['Growth','Pro'] },
    ],
    slides: [
      { src: '/screenshots/events-calendar.png', alt: 'Event calendar', mock: <Mock_Calendar /> },
      { src: '/screenshots/events-rsvp.png', alt: 'Event RSVP', mock: <Mock_EventCard /> },
      { src: '/screenshots/events-tickets.png', alt: 'Ticket types', mock: <Mock_Tickets /> },
    ],
  },
  {
    id: 'communications', label: 'Communications', color: '#EC4899', icon: IC.mega,
    headline: 'Reach every member, every time',
    description: 'No algorithm. No feed burial. When you post an announcement, every member sees it.',
    features: [
      { name: 'Announcements', desc: 'Pinned updates, priority levels (Urgent / Normal / Low), and read tracking per member.', plans: ['Starter','Growth','Pro'] },
      { name: 'Dashboard notifications', desc: 'Real-time notification bell for events, announcements, and org activity — visible right in the dashboard.', plans: ['Starter','Growth','Pro'] },
      { name: 'Transactional emails', desc: 'System emails for event reminders, RSVP confirmations, invitations, and ticket receipts.', plans: ['Starter','Growth','Pro'] },
      { name: 'Chat channels', desc: 'Internal org chat for members and committees. Organized by channel.', plans: ['Starter','Growth','Pro'] },
      { name: 'Email blasts', desc: 'Manual sends to your full member list or targeted segments. 500/mo included on Growth.', plans: ['Growth','Pro'] },
      { name: 'Newsletter builder', desc: 'Drag-and-drop editor with 11 block types, live preview, and send scheduling.', plans: ['Growth','Pro'] },
      { name: 'Email analytics', desc: 'Open rates, click rates, bounce rates, and per-recipient tracking.', plans: ['Growth','Pro'] },
      { name: 'Admin inbox', desc: 'Centralized inbox for contact form submissions and member requests.', plans: ['Growth','Pro'] },
      { name: 'Unlimited email sends', desc: 'No monthly cap on email sends.', plans: ['Pro'] },
      { name: 'AI content assistant', desc: 'Draft announcements, event descriptions, and member bios with AI.', plans: ['Pro'] },
    ],
    slides: [
      { src: '/screenshots/comm-announcements.png', alt: 'Announcements', mock: <Mock_Announcements /> },
      { src: '/screenshots/comm-email-blast.png', alt: 'Email blast', mock: <Mock_EmailBlast /> },
      { src: '/screenshots/comm-email-analytics.png', alt: 'Email analytics', mock: <Mock_EmailAnalytics /> },
    ],
  },
  {
    id: 'content', label: 'Content & Documents', color: '#F97316', icon: IC.doc,
    headline: 'Stop losing files in email threads',
    description: 'A searchable document library, polls, surveys, and sign-up forms — all organized and accessible.',
    features: [
      { name: 'Document library', desc: 'Upload PDFs, Word docs, spreadsheets, and more. Searchable with folder organization.', plans: ['Starter','Growth','Pro'] },
      { name: 'Polls', desc: 'Single choice, multiple choice, or yes/no/abstain. Anonymous voting option available.', plans: ['Starter','Growth','Pro'] },
      { name: 'Surveys', desc: 'Multi-page surveys with skip logic. Export results to CSV.', plans: ['Starter','Growth','Pro'] },
      { name: 'Sign-up forms', desc: 'Volunteer slots with live spot counts. No phone tag, no over-booking.', plans: ['Starter','Growth','Pro'] },
      { name: 'Programs', desc: 'Publish recurring programs with descriptions, schedules, and enrollment.', plans: ['Starter','Growth','Pro'] },
      { name: '2 GB storage (Starter)', desc: 'Documents, photos, and attachments — all in one unified bucket.', plans: ['Starter'] },
      { name: '10 GB storage (Growth)', desc: '', plans: ['Growth'] },
      { name: '30 GB storage (Pro)', desc: 'Plus add-on storage available if needed.', plans: ['Pro'] },
    ],
    slides: [
      { src: '/screenshots/docs-library.png', alt: 'Document library', mock: <Mock_DocLibrary /> },
      { src: '/screenshots/docs-poll.png', alt: 'Poll results', mock: <Mock_Poll /> },
    ],
  },
  {
    id: 'website', label: 'Public Website', color: '#8B5CF6', icon: IC.monitor,
    headline: 'Your public page, no developer needed',
    description: 'Every org gets a mobile-ready public website. Set it up in the guided wizard, update it any time.',
    features: [
      { name: 'orgname.syndicade.com subdomain', desc: 'Clean public URL included on every plan.', plans: ['Starter','Growth','Pro'] },
      { name: 'Website setup wizard', desc: 'Step-by-step guided setup. Live in minutes — no developer needed.', plans: ['Starter','Growth','Pro'] },
      { name: 'Public event listing', desc: 'Public events auto-populate on your org page.', plans: ['Starter','Growth','Pro'] },
      { name: 'Donation page', desc: 'Stripe-powered donation button included. No revenue cut.', plans: ['Starter','Growth','Pro'] },
      { name: '1 scrollable page (Starter)', desc: 'One full-length page with unlimited content blocks.', plans: ['Starter'] },
      { name: 'Up to 7 pages (Growth)', desc: 'Main page + About, Programs, Team, Gallery, Donate, and Contact.', plans: ['Growth'] },
      { name: 'Unlimited pages (Pro)', desc: 'Campaign pages, program pages, and more. No ceiling.', plans: ['Pro'] },
      { name: 'Custom domain', desc: 'Connect a domain you already own. $50/yr add-on on Growth, included free on Pro.', plans: ['Growth','Pro'] },
      { name: 'Remove Syndicade branding', desc: '$10/mo or $99/yr add-on on Growth, included free on Pro.', plans: ['Growth','Pro'] },
    ],
    slides: [
      { src: '/screenshots/website-public-page.png', alt: 'Public org page', mock: <Mock_PublicPage /> },
      { src: '/screenshots/website-editor.png', alt: 'Page editor', mock: <Mock_PageEditor /> },
    ],
  },
  {
    id: 'discovery', label: 'Discovery & Community', color: '#14B8A6', icon: IC.globe,
    headline: 'Get found. Build together.',
    description: 'Verified 501(c)(3) organizations appear on the public discovery board. Community members can find your org and events without needing an account.',
    verifiedOnly: true,
    features: [
      { name: 'Public org discovery (/explore)', desc: 'Searchable directory of verified nonprofits by cause, location, and keyword.', plans: ['Starter','Growth','Pro'] },
      { name: 'Public event discovery (/discover)', desc: 'Anyone can browse upcoming events from verified orgs — no account needed.', plans: ['Starter','Growth','Pro'] },
      { name: 'Verified nonprofit badge', desc: '501(c)(3) badge displayed on your public org page and in search results.', plans: ['Starter','Growth','Pro'] },
      { name: 'Community Board access', desc: 'Private board for verified org admins to post needs, share resources, and find collaboration partners.', plans: ['Starter','Growth','Pro'] },
      { name: 'Featured event placement', desc: 'Promote events on the discovery board. $15/wk or $40/30 days.', plans: ['Growth','Pro'] },
    ],
    slides: [
      { src: '/screenshots/discovery-orgs.png', alt: 'Organization discovery', mock: <Mock_OrgDiscovery /> },
      { src: '/screenshots/discovery-community-board.png', alt: 'Community board', mock: <Mock_CommunityBoard /> },
    ],
  },
  {
    id: 'analytics', label: 'Analytics & Reporting', color: '#F5B731', icon: IC.chart,
    headline: 'Know what is working',
    description: 'Real data about your members, events, and communications — not vanity metrics.',
    features: [
      { name: 'Basic stats', desc: 'Member count, event attendance summaries, and document usage.', plans: ['Starter','Growth','Pro'] },
      { name: 'CSV exports', desc: 'Export members, attendance, and event data any time.', plans: ['Starter','Growth','Pro'] },
      { name: 'Full analytics dashboard', desc: 'Engagement trends, RSVP rates, and member activity over time.', plans: ['Growth','Pro'] },
      { name: 'Attendance + revenue reports', desc: 'Per-event attendance breakdowns with ticket revenue and capacity tracking.', plans: ['Growth','Pro'] },
      { name: 'Email analytics', desc: 'Open, click, and bounce rates per blast — with per-recipient tracking.', plans: ['Growth','Pro'] },
    ],
    slides: [
      { src: '/screenshots/analytics-chart.png', alt: 'Analytics chart', mock: <Mock_AnalyticsChart /> },
      { src: '/screenshots/analytics-attendance.png', alt: 'Attendance report', mock: <Mock_AttendanceReport /> },
    ],
  },
  {
    id: 'payments', label: 'Payments', color: '#22C55E', icon: IC.credit,
    headline: 'We never take a cut of your revenue.',
    description: 'Dues, ticket sales, donations — Syndicade never takes a percentage. Paid events use a flat $1/ticket fee. Stripe processing fees are paid by the buyer.',
    features: [
      { name: 'Donation pages', desc: 'One-time and recurring donations via Stripe. No revenue cut.', plans: ['Starter','Growth','Pro'] },
      { name: 'Paid event ticket sales', desc: 'Flat $1/ticket fee. No percentage cuts.', plans: ['Growth','Pro'] },
      { name: 'Membership dues collection', desc: 'Collect recurring annual or monthly dues via Stripe.', plans: ['Growth','Pro'] },
      { name: 'Paid status tracking', desc: 'Track paid, overdue, and pending dues status per member.', plans: ['Growth','Pro'] },
      { name: 'Membership tiers + pricing', desc: 'Different dues amounts per tier. Members pay online, you track in the dashboard.', plans: ['Growth','Pro'] },
      { name: 'Stripe Customer Portal', desc: 'Members manage their own payment methods and billing history.', plans: ['Growth','Pro'] },
      { name: '200 tickets max per paid event (Growth)', desc: '', plans: ['Growth'] },
      { name: '500 tickets max per paid event (Pro)', desc: 'Need more? Contact us.', plans: ['Pro'] },
    ],
    slides: [
      { src: '/screenshots/payments-revenue.png', alt: 'Revenue overview', mock: <Mock_Revenue /> },
      { src: '/screenshots/payments-dues.png', alt: 'Dues status', mock: <Mock_DuesStatus /> },
    ],
  },
];

// ─── Comparison table data ────────────────────────────────────────────────────
var COMPARE = [
  { alt: 'Legacy nonprofit platforms',   price: '$60–$800+/mo',       issue: 'Outdated UI, expensive, poor support after acquisitions' },
  { alt: 'Creator community tools',      price: '$40–$100/mo',        issue: 'Built for online creators and courses, not member orgs' },
  { alt: 'Free social platforms',        price: 'Free',               issue: 'Algorithm-driven, no member management, data tradeoffs' },
  { alt: 'Per-transaction ticketing',    price: '3–5% + per-ticket',  issue: 'Percentage cuts compound fast on large events' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FeaturesPage() {
  var navigate = useNavigate();

  return (
    <div style={{ background: '#0E1523', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif", color: '#FFFFFF' }}>

      {/* Responsive + layout CSS */}
      <style>{RESPONSIVE_CSS}</style>

      <a href="#features-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:outline-none" style={{ background: '#F5B731', color: '#111827' }}>
        Skip to main content
      </a>

      <Header />

      <main id="features-main">

        {/* ── Hero ── */}
        <section aria-labelledby="features-h1" style={{ background: '#0E1523', padding: '80px 24px 64px', textAlign: 'center', borderBottom: '1px solid #2A3550' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '16px' }}>Complete feature list</p>
            <h1 id="features-h1" style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '20px' }}>
              Every feature your org needs,<br /><span style={{ color: '#F5B731' }}>in one place.</span>
            </h1>
            <p style={{ fontSize: '17px', color: '#CBD5E1', lineHeight: 1.7, marginBottom: '36px' }}>
              Syndicade replaces the fragmented stack of spreadsheets, email chains, and disconnected tools most volunteer orgs rely on.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '36px' }}>
              <button onClick={function() { navigate('/signup'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', fontSize: '15px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,183,49,0.35)' }}
                onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }}
                onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Start Free — 14 Days <Icon d={IC.arrow} size={16} />
              </button>
              <Link to="/pricing"
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded-xl"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 24px', fontSize: '15px', fontWeight: 600, background: 'none', color: '#CBD5E1', border: '1px solid #2A3550', borderRadius: '12px', textDecoration: 'none' }}
                onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                onMouseOut={function(e) { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.borderColor = '#2A3550'; }}>
                View Pricing
              </Link>
            </div>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              {['Starter','Growth','Pro'].map(function(p) { return <PlanBadge key={p} plan={p} />; })}
              <span style={{ fontSize: '12px', color: '#64748B' }}>— badge shows which plans include each feature</span>
            </div>
          </div>
        </section>

        {/* ── Feature sections ── */}
        {SECTIONS.map(function(sec, si) {
          var altBg = si % 2 !== 0;
          return (
            <section
              key={sec.id}
              id={'feature-' + sec.id}
              aria-labelledby={'sh-' + sec.id}
              style={{ padding: '80px 24px', background: altBg ? '#151B2D' : '#0E1523', borderBottom: '1px solid #2A3550' }}
            >
              <div className="ft-grid">

                {/* Left — content */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: sec.color + '1A', border: '1px solid ' + sec.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sec.color, flexShrink: 0 }}>
                      <Icon d={sec.icon} size={22} />
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: sec.color }}>{sec.label}</p>
                  </div>
                  <h2 id={'sh-' + sec.id} style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: '#FFFFFF', marginBottom: '10px', lineHeight: 1.2 }}>
                    {sec.headline}
                  </h2>
                  <p style={{ fontSize: '15px', color: '#CBD5E1', lineHeight: 1.65, marginBottom: '6px' }}>{sec.description}</p>
                  {sec.verifiedOnly && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: 'rgba(245,183,49,0.12)', color: '#F5B731', border: '1px solid rgba(245,183,49,0.3)', marginBottom: '6px' }}>
                      Verified nonprofits only
                    </span>
                  )}

                  {/* Feature rows */}
                  <div style={{ border: '1px solid #2A3550', borderRadius: '14px', overflow: 'hidden', marginTop: '24px' }} role="list" aria-label={sec.label + ' features'}>
                    {sec.features.map(function(feat, fi) {
                      return (
                        <div
                          key={feat.name}
                          role="listitem"
                          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', padding: '13px 16px', background: altBg ? '#151B2D' : '#0E1523', borderTop: fi > 0 ? '1px solid #2A3550' : 'none', flexWrap: 'wrap', transition: 'background 0.15s' }}
                          onMouseEnter={function(e) { e.currentTarget.style.background = '#1A2035'; }}
                          onMouseLeave={function(e) { e.currentTarget.style.background = altBg ? '#151B2D' : '#0E1523'; }}
                        >
                          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: 0 }}>
                            <span aria-hidden="true" style={{ flexShrink: 0, marginTop: '3px', color: sec.color }}>
                              <Icon d={IC.check} size={14} />
                            </span>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: feat.desc ? '2px' : 0 }}>{feat.name}</p>
                              {feat.desc && <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5 }}>{feat.desc}</p>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                            {feat.plans.map(function(p) { return <PlanBadge key={p} plan={p} />; })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right — carousel (centered via CSS, responsive via ft-carousel-col) */}
                <div className="ft-carousel-col">
                  <Carousel
                    color={sec.color}
                    label={sec.label}
                    slides={sec.slides.map(function(slide) {
                      return (
                        <ScreenshotSlide key={slide.src} src={slide.src} alt={slide.alt}>
                          {slide.mock}
                        </ScreenshotSlide>
                      );
                    })}
                  />
                </div>

              </div>
            </section>
          );
        })}

        {/* ── Create once, share on your terms ── */}
        <section aria-labelledby="create-once-h2" style={{ padding: '80px 24px', background: '#0E1523', borderBottom: '1px solid #2A3550' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '14px' }}>Publish on your terms</p>
              <h2 id="create-once-h2" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, color: '#FFFFFF', marginBottom: '16px', lineHeight: 1.2 }}>
                Create once,<br /><span style={{ color: '#F5B731' }}>share on your terms.</span>
              </h2>
              <p style={{ fontSize: '16px', color: '#CBD5E1', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto' }}>
                You control exactly where your content appears. Create an event once — then decide if it goes to your members only, your public page, or the discovery board. No duplicate entry, no copy-pasting across tools.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '18px', marginBottom: '40px' }}>
              {[
                { step: '1', d: IC.plus,    title: 'Create an event',            desc: 'Add your details once — title, date, location, description.', color: '#3B82F6' },
                { step: '2', d: IC.users,   title: 'Members see it first',       desc: 'It automatically appears in the member dashboard and calendar.', color: '#8B5CF6' },
                { step: '3', d: IC.monitor, title: 'Opt in to your public page', desc: 'Choose to publish it on your org website. Appears there automatically — no copy-paste.', color: '#22C55E' },
                { step: '4', d: IC.globe,   title: 'Opt in to discovery',        desc: 'Verified nonprofits can also opt in to the public Syndicade discovery board.', color: '#F5B731' },
              ].map(function(step) {
                return (
                  <div key={step.step} style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '14px', padding: '22px', position: 'relative' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '12px', background: step.color + '1A', border: '1px solid ' + step.color + '44', color: step.color, marginBottom: '12px' }}>
                      <Icon d={step.d} size={20} />
                    </div>
                    <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontWeight: 700, color: '#64748B', background: '#151B2D', padding: '2px 8px', borderRadius: '99px', border: '1px solid #2A3550' }}>Step {step.step}</div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>{step.title}</h3>
                    <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.55 }}>{step.desc}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'rgba(245,183,49,0.06)', border: '1px solid rgba(245,183,49,0.2)', borderRadius: '14px', padding: '24px 28px', display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ color: '#F5B731', flexShrink: 0 }}><Icon d={IC.zap} size={26} /></div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>The same event, visible everywhere you choose — entered once.</h3>
                <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.65 }}>
                  With other tools you post your event in multiple places and keep them in sync manually. With Syndicade, you create it once and opt in to wherever it should appear. One source of truth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section aria-labelledby="compare-h2" style={{ padding: '80px 24px', background: '#151B2D', borderBottom: '1px solid #2A3550' }}>
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#F5B731', marginBottom: '14px' }}>How we stack up</p>
              <h2 id="compare-h2" style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                Built for nonprofits.<br />Not adapted from something else.
              </h2>
            </div>

            <div style={{ border: '1px solid #2A3550', borderRadius: '14px', overflow: 'hidden', marginBottom: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', background: '#1E2845', padding: '11px 22px', borderBottom: '1px solid #2A3550' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#64748B' }}>Alternative</span>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#64748B', textAlign: 'center' }}>Typical price</span>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#64748B' }}>The catch</span>
              </div>
              {COMPARE.map(function(row, i) {
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', padding: '13px 22px', borderTop: '1px solid #1A2035', background: '#151B2D' }}>
                    <span style={{ fontSize: '14px', color: '#CBD5E1', fontWeight: 500 }}>{row.alt}</span>
                    <span style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>{row.price}</span>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>{row.issue}</span>
                  </div>
                );
              })}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', padding: '15px 22px', background: 'rgba(245,183,49,0.05)', borderTop: '1px solid rgba(245,183,49,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>Syndi<span style={{ color: '#F5B731' }}>cade</span></span>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px', background: 'rgba(245,183,49,0.15)', color: '#F5B731', border: '1px solid rgba(245,183,49,0.3)' }}>That's us</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#F5B731', textAlign: 'center' }}>From $19.99/mo</span>
                <span style={{ fontSize: '13px', color: '#4ADE80', fontWeight: 600 }}>Purpose-built for member orgs. No revenue cuts. No fragmented stack.</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '18px' }}>
              <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '14px', padding: '22px' }}>
                <div style={{ marginBottom: '12px', color: '#F5B731' }}><Icon d={IC.ticket} size={22} /></div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px' }}>The ticketing math</h3>
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.65, marginBottom: '12px' }}>
                  Selling 50 tickets at $25? Percentage platforms charge 3–5% plus per-ticket fees — often $125+ on a $1,250 event.
                </p>
                <div style={{ background: '#0E1523', border: '1px solid #2A3550', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Syndicade (flat $1/ticket)</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#4ADE80' }}>$50 total</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Typical % platform</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#F87171' }}>$100–$140+</span>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '10px' }}>Stripe processing fees apply and are paid by the buyer.</p>
              </div>
              <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '14px', padding: '22px' }}>
                <div style={{ marginBottom: '12px', color: '#3B82F6' }}><Icon d={IC.share} size={22} /></div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px' }}>Create once, share on your terms</h3>
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.65, marginBottom: '14px' }}>
                  Create an event or program once. Then choose exactly where it appears — no copy-pasting across platforms.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {['Members see it in their dashboard','Opt in to your public org page','Opt in to the discovery board'].map(function(item) {
                    return (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#22C55E', flexShrink: 0 }}><Icon d={IC.check} size={13} /></span>
                        <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section aria-labelledby="features-cta-h2" style={{ padding: '96px 24px', background: '#0E1523', textAlign: 'center' }}>
          <div style={{ maxWidth: '540px', margin: '0 auto' }}>
            <img src="/mascot-pair.png" alt="" aria-hidden="true" style={{ width: '140px', height: 'auto', marginBottom: '28px' }} onError={function(e) { e.currentTarget.style.display = 'none'; }} />
            <h2 id="features-cta-h2" style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px' }}>
              Ready to replace your fragmented stack?
            </h2>
            <p style={{ fontSize: '16px', color: '#CBD5E1', marginBottom: '12px', lineHeight: 1.6 }}>
              Everything above is included. Start with the plan that fits and upgrade when you're ready.
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '36px' }}>14-day free trial · No credit card · Cancel any time</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <button onClick={function() { navigate('/signup'); }}
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '16px', fontWeight: 700, background: '#F5B731', color: '#111827', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,183,49,0.4)' }}
                onMouseOver={function(e) { e.currentTarget.style.background = '#E5A820'; }}
                onMouseOut={function(e) { e.currentTarget.style.background = '#F5B731'; }}>
                Start Free — 14 Days <Icon d={IC.arrow} size={18} />
              </button>
              <Link to="/pricing"
                className="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 rounded-xl"
                style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', fontSize: '16px', fontWeight: 600, background: 'none', color: '#CBD5E1', border: '1px solid #2A3550', borderRadius: '12px', textDecoration: 'none' }}
                onMouseOver={function(e) { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                onMouseOut={function(e) { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.borderColor = '#2A3550'; }}>
                Compare Plans
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />

    </div>
  );
}