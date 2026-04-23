import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

var HOUR_HEIGHT = 64;
var GRID_START  = 6;
var GRID_END    = 23;

var HOURS = (function () {
  var arr = [];
  for (var h = GRID_START; h <= GRID_END; h++) arr.push(h);
  return arr;
})();

var DAY_NAMES_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

var EVENT_TYPE_COLORS_DARK = {
  'advocacy-event':        { bg: '#3B1A1A', color: '#F87171' },
  'blood-drive':           { bg: '#3B1A2A', color: '#FB7185' },
  'clothing-drive':        { bg: '#2D1B4E', color: '#C084FC' },
  'community-meeting':     { bg: '#1D3461', color: '#60A5FA' },
  'cultural-event':        { bg: '#3B2A1A', color: '#FB923C' },
  'education-workshop':    { bg: '#1A2E3B', color: '#22D3EE' },
  'faith-based-event':     { bg: '#1E1B4B', color: '#818CF8' },
  'food-drive':            { bg: '#3B3A1A', color: '#FBBF24' },
  'fundraiser':            { bg: '#1B3A2F', color: '#4ADE80' },
  'health-wellness':       { bg: '#1B3A2F', color: '#34D399' },
  'volunteer-opportunity': { bg: '#1A3B3B', color: '#2DD4BF' },
  'youth-event':           { bg: '#3B1A2E', color: '#F472B6' },
};

var EVENT_TYPE_COLORS_LIGHT = {
  'advocacy-event':        { bg: '#FEE2E2', color: '#B91C1C' },
  'blood-drive':           { bg: '#FFE4E6', color: '#BE123C' },
  'clothing-drive':        { bg: '#F3E8FF', color: '#7E22CE' },
  'community-meeting':     { bg: '#DBEAFE', color: '#1D4ED8' },
  'cultural-event':        { bg: '#FFEDD5', color: '#C2410C' },
  'education-workshop':    { bg: '#CFFAFE', color: '#0E7490' },
  'faith-based-event':     { bg: '#EDE9FE', color: '#5B21B6' },
  'food-drive':            { bg: '#FEF9C3', color: '#B45309' },
  'fundraiser':            { bg: '#DCFCE7', color: '#15803D' },
  'health-wellness':       { bg: '#D1FAE5', color: '#065F46' },
  'volunteer-opportunity': { bg: '#CCFBF1', color: '#0F766E' },
  'youth-event':           { bg: '#FCE7F3', color: '#BE185D' },
};

/* ─── Date utilities ────────────────────────────────────────── */

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}

function startOfWeekSun(date) {
  var d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthCells(date) {
  var year  = date.getFullYear();
  var month = date.getMonth();
  var first = new Date(year, month, 1);
  var start = startOfWeekSun(first);
  var cells = [];
  for (var i = 0; i < 42; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function getWeekDays(date) {
  var start = startOfWeekSun(date);
  var days  = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function getDayEvents(events, day) {
  return events.filter(function (e) {
    if (!e.start_time) return false;
    return isSameDay(new Date(e.start_time), day);
  });
}

function fmtTime(dateStr) {
  if (!dateStr) return '';
  var d    = new Date(dateStr);
  var h    = d.getHours();
  var m    = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12  = h % 12 || 12;
  return h12 + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ampm;
}

function fmtHour(h) {
  var ampm = h >= 12 ? 'PM' : 'AM';
  return (h % 12 || 12) + ' ' + ampm;
}

/* ─── Layout helpers ────────────────────────────────────────── */

function getTimePos(startStr, endStr) {
  var start    = new Date(startStr);
  var startMin = (start.getHours() - GRID_START) * 60 + start.getMinutes();
  var endMin;
  if (endStr) {
    var end = new Date(endStr);
    endMin  = (end.getHours() - GRID_START) * 60 + end.getMinutes();
  } else {
    endMin = startMin + 60;
  }
  var gridMins = (GRID_END - GRID_START + 1) * 60;
  startMin = Math.max(0, Math.min(startMin, gridMins - 30));
  endMin   = Math.max(startMin + 30, Math.min(endMin, gridMins));
  return {
    top:    startMin * (HOUR_HEIGHT / 60),
    height: Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 28),
  };
}

function resolveColumns(dayEvents) {
  var sorted = dayEvents.slice().sort(function (a, b) {
    return new Date(a.start_time) - new Date(b.start_time);
  });
  var cloned = sorted.map(function (ev) { return Object.assign({}, ev); });
  var cols   = [];
  cloned.forEach(function (ev) {
    var evStart = new Date(ev.start_time).getTime();
    var evEnd   = ev.end_time ? new Date(ev.end_time).getTime() : evStart + 3600000;
    var placed  = false;
    for (var ci = 0; ci < cols.length; ci++) {
      var last    = cols[ci][cols[ci].length - 1];
      var lastEnd = last.end_time
        ? new Date(last.end_time).getTime()
        : new Date(last.start_time).getTime() + 3600000;
      if (evStart >= lastEnd) {
        cols[ci].push(ev);
        ev._col = ci;
        placed  = true;
        break;
      }
    }
    if (!placed) {
      cols.push([ev]);
      ev._col = cols.length - 1;
    }
  });
  cloned.forEach(function (ev) { ev._totalCols = cols.length; });
  return cloned;
}

function getEventStyle(event, isDark) {
  var c    = isDark ? EVENT_TYPE_COLORS_DARK : EVENT_TYPE_COLORS_LIGHT;
  var type = event.event_types && event.event_types[0];
  if (event.is_featured) {
    return {
      background:  isDark ? 'rgba(245,183,49,0.18)' : 'rgba(245,183,49,0.22)',
      color:       isDark ? '#F5B731' : '#B45309',
      borderLeft:  '3px solid #F5B731',
    };
  }
  if (type && c[type]) {
    return {
      background: c[type].bg,
      color:      c[type].color,
      borderLeft: '3px solid ' + c[type].color,
    };
  }
  return {
    background: isDark ? '#1A2845' : '#DBEAFE',
    color:      isDark ? '#60A5FA' : '#1D4ED8',
    borderLeft: '3px solid ' + (isDark ? '#60A5FA' : '#3B82F6'),
  };
}

/* ─── Skeleton ──────────────────────────────────────────────── */

function CalSkeleton({ subView, isDark }) {
  var s1 = isDark ? '#1E2845' : '#F1F5F9';
  var s2 = isDark ? '#2A3550' : '#E2E8F0';
  var bg = isDark ? '#1A2035' : '#FFFFFF';

  if (subView === 'month') {
    return (
      <div className="animate-pulse" aria-hidden="true">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: s2, borderRadius: '8px', overflow: 'hidden' }}>
          {Array.from({ length: 42 }, function (_, i) {
            return (
              <div key={i} style={{ background: bg, padding: '8px', minHeight: '90px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: s2, marginBottom: '6px' }} />
                {i % 4 === 0 && <div style={{ height: '14px', background: s1, borderRadius: '3px', marginBottom: '3px', width: '90%' }} />}
                {i % 7 === 2 && <div style={{ height: '14px', background: s1, borderRadius: '3px', width: '75%' }} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  var colCount = subView === 'day' ? 1 : 7;
  return (
    <div className="animate-pulse" aria-hidden="true" style={{ display: 'flex', border: '1px solid ' + s2, borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ width: '56px', flexShrink: 0, borderRight: '1px solid ' + s2 }}>
        <div style={{ height: '48px', borderBottom: '1px solid ' + s2 }} />
        {HOURS.map(function (h) {
          return <div key={h} style={{ height: HOUR_HEIGHT + 'px', borderBottom: '1px solid ' + s2 }} />;
        })}
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        {Array.from({ length: colCount }, function (_, ci) {
          return (
            <div key={ci} style={{ flex: 1, borderLeft: ci > 0 ? '1px solid ' + s2 : 'none', position: 'relative' }}>
              <div style={{ height: '48px', borderBottom: '1px solid ' + s2, background: isDark ? '#151B2D' : '#F8FAFC' }} />
              <div style={{ position: 'relative' }}>
                {HOURS.map(function (h) {
                  return <div key={h} style={{ height: HOUR_HEIGHT + 'px', borderBottom: '1px solid ' + s2 }} />;
                })}
                {ci % 2 === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: (2.2 * HOUR_HEIGHT) + 'px',
                    left: '4px', right: '4px',
                    height: (1.4 * HOUR_HEIGHT) + 'px',
                    background: s1, borderRadius: '6px',
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────── */

function CalEmpty({ isDark }) {
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textMuted   = isDark ? '#94A3B8' : '#64748B';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
      <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', color: textMuted, marginBottom: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p style={{ fontSize: '16px', fontWeight: 700, color: textPrimary, marginBottom: '6px' }}>No events this period</p>
      <p style={{ fontSize: '14px', color: textMuted }}>Try adjusting your filters or navigate to a different date.</p>
    </div>
  );
}

/* ─── Month view ────────────────────────────────────────────── */

function MonthView({ cells, events, today, currentMonth, isDark, borderColor, onDayClick }) {
  var textPrimary = isDark ? '#FFFFFF' : '#0E1523';
  var textMuted   = isDark ? '#94A3B8' : '#64748B';
  var cellBg      = isDark ? '#1A2035' : '#FFFFFF';
  var cellBgOther = isDark ? '#131928' : '#F8FAFC';
  var headerBg    = isDark ? '#151B2D' : '#F1F5F9';

  return (
    <div style={{ border: '1px solid ' + borderColor, borderRadius: '8px', overflow: 'hidden' }} role="grid" aria-label="Monthly calendar view">
      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: headerBg, borderBottom: '1px solid ' + borderColor }} role="row">
        {DAY_NAMES_SHORT.map(function (d) {
          return (
            <div key={d} role="columnheader" aria-label={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {d}
            </div>
          );
        })}
      </div>

      {/* Cell grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map(function (day, idx) {
          var inMonth  = day.getMonth() === currentMonth;
          var isToday  = isSameDay(day, today);
          var dayEvs   = getDayEvents(events, day);
          var visible  = dayEvs.slice(0, 3);
          var overflow = dayEvs.length - visible.length;

          return (
            <div
              key={idx}
              role="gridcell"
              aria-label={
                day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                + (dayEvs.length ? ', ' + dayEvs.length + ' event' + (dayEvs.length !== 1 ? 's' : '') : '')
              }
              style={{
                background:  inMonth ? cellBg : cellBgOther,
                borderTop:   '1px solid ' + borderColor,
                borderLeft:  idx % 7 !== 0 ? '1px solid ' + borderColor : 'none',
                padding:     '6px',
                minHeight:   '100px',
                overflow:    'hidden',
              }}
            >
              {/* Date number */}
              <div style={{ marginBottom: '4px' }}>
                <button
                  onClick={function () { onDayClick(day); }}
                  style={{
                    display:         'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width:           '26px', height: '26px', borderRadius: '50%',
                    fontSize:        '12px', fontWeight: isToday ? 700 : 500,
                    background:      isToday ? '#3B82F6' : 'transparent',
                    color:           isToday ? '#FFFFFF' : (inMonth ? textPrimary : textMuted),
                    border:          'none', cursor: 'pointer',
                  }}
                  aria-label={'View day: ' + day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {day.getDate()}
                </button>
              </div>

              {/* Event pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {visible.map(function (ev) {
                  var s = getEventStyle(ev, isDark);
                  return (
                    <Link
                      key={ev.id}
                      to={'/events/' + ev.id}
                      style={{
                        display:       'block',
                        fontSize:      '10px', fontWeight: 600,
                        padding:       '2px 5px',
                        borderRadius:  '3px',
                        background:    s.background,
                        color:         s.color,
                        borderLeft:    s.borderLeft,
                        overflow:      'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration:'none',
                      }}
                      aria-label={ev.title + ' at ' + fmtTime(ev.start_time)}
                      className="focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {fmtTime(ev.start_time)} {ev.title}
                    </Link>
                  );
                })}
                {overflow > 0 && (
                  <button
                    onClick={function () { onDayClick(day); }}
                    style={{
                      fontSize:   '10px', fontWeight: 600, color: textMuted,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      textAlign:  'left', padding: '2px 5px',
                    }}
                    aria-label={'Show ' + overflow + ' more events on ' + day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    className="focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Time grid (week + day) ────────────────────────────────── */

function TimeGrid({ days, events, isDark, borderColor, scrollRef }) {
  var textPrimary = isDark ? '#FFFFFF'  : '#0E1523';
  var textMuted   = isDark ? '#94A3B8'  : '#64748B';
  var today       = new Date();
  var totalH      = HOURS.length * HOUR_HEIGHT;

  return (
    <div
      ref={scrollRef}
      style={{ overflowY: 'auto', maxHeight: '640px', border: '1px solid ' + borderColor, borderRadius: '8px' }}
      aria-label="Time grid calendar view"
    >
      <div style={{ display: 'flex', minWidth: days.length > 1 ? '560px' : 'auto' }}>

        {/* Time gutter */}
        <div style={{ width: '56px', flexShrink: 0, borderRight: '1px solid ' + borderColor }}>
          <div style={{ height: '48px', borderBottom: '1px solid ' + borderColor, background: isDark ? '#151B2D' : '#F8FAFC' }} />
          {HOURS.map(function (h) {
            return (
              <div key={h} style={{ height: HOUR_HEIGHT + 'px', borderBottom: '1px solid ' + borderColor, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px' }}>
                <span style={{ fontSize: '10px', color: textMuted, transform: 'translateY(-6px)', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  {fmtHour(h)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        {days.map(function (day, di) {
          var isToday  = isSameDay(day, today);
          var dayEvs   = getDayEvents(events, day);
          var resolved = resolveColumns(dayEvs);

          return (
            <div
              key={di}
              style={{ flex: 1, borderLeft: di > 0 ? '1px solid ' + borderColor : 'none', display: 'flex', flexDirection: 'column' }}
              aria-label={day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            >
              {/* Column header */}
              <div style={{
                height: '48px', flexShrink: 0,
                borderBottom: '1px solid ' + borderColor,
                background:   isDark ? '#151B2D' : '#F8FAFC',
                display:      'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                position:     'sticky', top: 0, zIndex: 1,
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isToday ? '#3B82F6' : textMuted }}>
                  {days.length === 1 ? day.toLocaleDateString('en-US', { weekday: 'long' }) : DAY_NAMES_SHORT[day.getDay()]}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '50%',
                  fontSize: '13px', fontWeight: 700,
                  background: isToday ? '#3B82F6' : 'transparent',
                  color:      isToday ? '#FFFFFF'  : textPrimary,
                }}>
                  {day.getDate()}
                </span>
              </div>

              {/* Timed grid */}
              <div style={{ position: 'relative', height: totalH + 'px' }}>
                {/* Hour lines */}
                {HOURS.map(function (h) {
                  return (
                    <div
                      key={h}
                      style={{ position: 'absolute', left: 0, right: 0, top: ((h - GRID_START) * HOUR_HEIGHT) + 'px', borderTop: '1px solid ' + borderColor }}
                      aria-hidden="true"
                    />
                  );
                })}

                {/* Half-hour lighter lines */}
                {HOURS.map(function (h) {
                  return (
                    <div
                      key={'half-' + h}
                      style={{ position: 'absolute', left: 0, right: 0, top: ((h - GRID_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2) + 'px', borderTop: '1px dashed ' + (isDark ? 'rgba(42,53,80,0.6)' : 'rgba(226,232,240,0.7)') }}
                      aria-hidden="true"
                    />
                  );
                })}

                {/* Events */}
                {resolved.map(function (ev) {
                  var pos   = getTimePos(ev.start_time, ev.end_time);
                  var s     = getEventStyle(ev, isDark);
                  var col   = ev._col   || 0;
                  var total = ev._totalCols || 1;
                  var pct   = 100 / total;
                  var leftPct = col * pct;

                  return (
                    <Link
                      key={ev.id}
                      to={'/events/' + ev.id}
                      style={{
                        position:       'absolute',
                        top:            pos.top + 'px',
                        height:         pos.height + 'px',
                        left:           'calc(' + leftPct + '% + 2px)',
                        width:          'calc(' + pct + '% - 4px)',
                        background:     s.background,
                        color:          s.color,
                        borderLeft:     s.borderLeft,
                        borderRadius:   '4px',
                        padding:        '3px 6px',
                        overflow:       'hidden',
                        textDecoration: 'none',
                        display:        'flex',
                        flexDirection:  'column',
                        gap:            '1px',
                        zIndex:         2,
                        boxShadow:      isDark ? '0 1px 4px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.1)',
                        transition:     'opacity 0.1s',
                      }}
                      aria-label={ev.title + ', ' + fmtTime(ev.start_time) + (ev.end_time ? ' to ' + fmtTime(ev.end_time) : '')}
                      className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                        {ev.title}
                      </span>
                      {pos.height >= 42 && (
                        <span style={{ fontSize: '10px', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fmtTime(ev.start_time)}{ev.end_time ? ' \u2013 ' + fmtTime(ev.end_time) : ''}
                        </span>
                      )}
                      {pos.height >= 72 && ev.org_name && (
                        <span style={{ fontSize: '10px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.org_name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────── */

export default function DiscoveryCalendar({ events, loading, isDark, calendarDate, onNavigate, subView, onSubViewChange }) {
  var scrollRef = useRef(null);

  useEffect(function () {
    if ((subView === 'week' || subView === 'day') && scrollRef.current) {
      scrollRef.current.scrollTop = (8 - GRID_START) * HOUR_HEIGHT;
    }
  }, [subView]);

  var borderColor   = isDark ? '#2A3550' : '#E2E8F0';
  var textPrimary   = isDark ? '#FFFFFF'  : '#0E1523';
  var textSecondary = isDark ? '#CBD5E1'  : '#475569';
  var textMuted     = isDark ? '#94A3B8'  : '#64748B';
  var cardBg        = isDark ? '#1A2035'  : '#FFFFFF';
  var sectionBg     = isDark ? '#151B2D'  : '#F8FAFC';

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function navigate(dir) {
    var d = new Date(calendarDate);
    if (subView === 'month')     d.setMonth(d.getMonth() + dir);
    else if (subView === 'week') d.setDate(d.getDate() + dir * 7);
    else                         d.setDate(d.getDate() + dir);
    onNavigate(d);
  }

  function goToday() { onNavigate(new Date()); }

  function getPeriodLabel() {
    if (subView === 'month') {
      return MONTH_NAMES_FULL[calendarDate.getMonth()] + ' ' + calendarDate.getFullYear();
    }
    if (subView === 'week') {
      var wdays = getWeekDays(calendarDate);
      var first = wdays[0], last = wdays[6];
      if (first.getMonth() === last.getMonth()) {
        return MONTH_NAMES_FULL[first.getMonth()] + ' ' + first.getDate() + '\u2013' + last.getDate() + ', ' + first.getFullYear();
      }
      return MONTH_NAMES_FULL[first.getMonth()] + ' ' + first.getDate() + ' \u2013 ' + MONTH_NAMES_FULL[last.getMonth()] + ' ' + last.getDate() + ', ' + last.getFullYear();
    }
    return DAY_NAMES_SHORT[calendarDate.getDay()] + ', ' + MONTH_NAMES_FULL[calendarDate.getMonth()] + ' ' + calendarDate.getDate() + ', ' + calendarDate.getFullYear();
  }

  var cells    = subView === 'month' ? getMonthCells(calendarDate) : null;
  var gridDays = subView === 'week'  ? getWeekDays(calendarDate)   : (subView === 'day' ? [calendarDate] : null);

  return (
    <div>

      {/* ── Navigation bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>

        {/* Left: Today + arrows + period label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={goToday}
            style={{
              padding: '6px 14px', fontSize: '13px', fontWeight: 700,
              borderRadius: '8px', border: '1px solid ' + borderColor,
              background: cardBg, color: textSecondary, cursor: 'pointer',
            }}
            aria-label="Go to today"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Today
          </button>

          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={function () { navigate(-1); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid ' + borderColor, background: cardBg, color: textSecondary, cursor: 'pointer',
              }}
              aria-label={'Previous ' + subView}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={function () { navigate(1); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                border: '1px solid ' + borderColor, background: cardBg, color: textSecondary, cursor: 'pointer',
              }}
              aria-label={'Next ' + subView}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, margin: 0 }}>
            {getPeriodLabel()}
          </h2>
        </div>

        {/* Right: Month / Week / Day toggle */}
        <div
          style={{ display: 'inline-flex', background: sectionBg, border: '1px solid ' + borderColor, borderRadius: '10px', padding: '3px' }}
          role="group"
          aria-label="Calendar sub-view"
        >
          {[['month', 'Month'], ['week', 'Week'], ['day', 'Day']].map(function (pair) {
            var v      = pair[0];
            var label  = pair[1];
            var active = subView === v;
            return (
              <button
                key={v}
                onClick={function () { onSubViewChange(v); }}
                aria-pressed={active}
                style={{
                  padding: '5px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '7px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? '#F5B731' : 'transparent',
                  color:      active ? '#0E1523'  : textMuted,
                }}
                className="focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Calendar body ── */}
      {loading ? (
        <CalSkeleton subView={subView} isDark={isDark} />
      ) : events.length === 0 ? (
        <CalEmpty isDark={isDark} />
      ) : subView === 'month' ? (
        <MonthView
          cells={cells}
          events={events}
          today={today}
          currentMonth={calendarDate.getMonth()}
          isDark={isDark}
          borderColor={borderColor}
          onDayClick={function (day) { onNavigate(day); onSubViewChange('day'); }}
        />
      ) : (
        <TimeGrid
          days={gridDays}
          events={events}
          isDark={isDark}
          borderColor={borderColor}
          scrollRef={scrollRef}
        />
      )}
    </div>
  );
}