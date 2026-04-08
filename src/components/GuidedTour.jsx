/**
 * GuidedTour.jsx
 * Tooltip-based guided tour engine (Notion/Linear style).
 * Renders via portal — tooltips point at real DOM elements.
 *
 * Props:
 *   steps      — array of step objects
 *   orgId      — org UUID (used when tourType === 'org')
 *   memberId   — member user_id (used when tourType === 'member')
 *   tourType   — 'org' | 'member'
 *   show       — boolean: if true, skips Supabase check and forces tour open immediately
 *   onDone     — optional callback when tour completes or is skipped
 *
 * Step shape:
 *   { target: string | null, title: string, description: string, placement: 'top'|'bottom'|'left'|'right'|'auto' }
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

var TOOLTIP_W = 300;
var GAP = 14;
var ARROW = 8;

export default function GuidedTour({ steps, orgId, memberId, tourType, show, onDone }) {
  var [stepIdx, setStepIdx] = useState(0);
  var [active, setActive] = useState(false);
  var [ready, setReady] = useState(false);
  var [pos, setPos] = useState(null);
  var tooltipRef = useRef(null);

  var step = steps[stepIdx];
  var isCenter = !step || !step.target;
  var isLast = stepIdx === steps.length - 1;

  // ── 1. Decide whether to show the tour ───────────────────────────────────
  useEffect(function () {
    var cancelled = false;

    // If parent passes show={true}, skip the DB check and open immediately.
    // This is used when the wizard completes — onboarding_completed is now true
    // so we can't rely on the DB check any more.
    if (show === true) {
      setActive(true);
      setReady(true);
      return;
    }

    async function check() {
      try {
        if (tourType === 'org' && orgId) {
          var orgRes = await supabase
            .from('organizations')
            .select('onboarding_completed')
            .eq('id', orgId)
            .single();
          if (!cancelled && orgRes.data && orgRes.data.onboarding_completed === false) {
            setActive(true);
          }
        } else if (tourType === 'member' && memberId) {
          var memRes = await supabase
            .from('members')
            .select('onboarding_completed')
            .eq('user_id', memberId)
            .single();
          if (!cancelled && memRes.data && memRes.data.onboarding_completed === false) {
            setActive(true);
          }
        }
      } catch (_) { /* silent — never block the app */ }

      if (!cancelled) setReady(true);
    }

    check();
    return function () { cancelled = true; };
  }, [orgId, memberId, tourType, show]);

  // ── 2. Position tooltip whenever step changes ─────────────────────────────
  useLayoutEffect(function () {
  if (!active) return;

  function measure() {
    if (isCenter) {
      setPos(null);
      setTimeout(function () { if (tooltipRef.current) tooltipRef.current.focus(); }, 30);
      return;
    }

var el = document.querySelector('[data-tour="' + step.target + '"]');
console.log('Tour step', stepIdx, '| target:', step.target, '| el found:', el);
console.log('ALL data-tour elements in DOM:', document.querySelectorAll('[data-tour]'));
    if (!el) { setPos(null); return; }

    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    var rect = el.getBoundingClientRect();
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var p = step.placement || 'auto';
    if (p === 'auto') {
      if (vh - rect.bottom > 220)                p = 'bottom';
      else if (rect.top > 220)                   p = 'top';
      else if (vw - rect.right > TOOLTIP_W + 40) p = 'right';
      else                                        p = 'left';
    }

    var tooltipL;
    var style = { position: 'fixed', width: TOOLTIP_W + 'px', zIndex: 10000 };

    if (p === 'bottom') {
      style.top = (rect.bottom + GAP) + 'px';
      tooltipL = Math.min(Math.max(rect.left + rect.width / 2 - TOOLTIP_W / 2, 16), vw - TOOLTIP_W - 16);
      style.left = tooltipL + 'px';
    } else if (p === 'top') {
      style.bottom = (vh - rect.top + GAP) + 'px';
      tooltipL = Math.min(Math.max(rect.left + rect.width / 2 - TOOLTIP_W / 2, 16), vw - TOOLTIP_W - 16);
      style.left = tooltipL + 'px';
    } else if (p === 'right') {
      style.top = (rect.top + rect.height / 2) + 'px';
      style.transform = 'translateY(-50%)';
      tooltipL = rect.right + GAP;
      style.left = tooltipL + 'px';
    } else {
      style.top = (rect.top + rect.height / 2) + 'px';
      style.transform = 'translateY(-50%)';
      tooltipL = Math.max(rect.left - TOOLTIP_W - GAP, 16);
      style.left = tooltipL + 'px';
    }

    var targetCX = rect.left + rect.width / 2;
    var arrowOffset = Math.max(16, Math.min(TOOLTIP_W - 24, targetCX - tooltipL));
    setPos({ style: style, placement: p, arrowOffset: arrowOffset, rect: rect });
    setTimeout(function () { if (tooltipRef.current) tooltipRef.current.focus(); }, 30);
  }

  // Delay to let OrgLayout's nav render into the DOM before querying
  var timer = setTimeout(measure, 80);
  return function () { clearTimeout(timer); };

}, [stepIdx, active]);

  // ── 3. Keyboard navigation ────────────────────────────────────────────────
  useEffect(function () {
    if (!active) return;
    function onKey(e) {
      if (e.key === 'Escape') { doSkip(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (isLast) doComplete(); else doNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return function () { window.removeEventListener('keydown', onKey); };
  }, [active, stepIdx, isLast]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function doNext() { setStepIdx(function (i) { return i + 1; }); }

  function doSkip() { setActive(false); markDone(); if (onDone) onDone(); }

  function doComplete() { setActive(false); markDone(); if (onDone) onDone(); }

  async function markDone() {
    try {
      if (tourType === 'org' && orgId) {
        await supabase.from('organizations').update({ onboarding_completed: true }).eq('id', orgId);
      } else if (tourType === 'member' && memberId) {
        await supabase.from('members').update({ onboarding_completed: true }).eq('user_id', memberId);
      }
    } catch (_) { /* silent */ }
  }

  // ── Early exit ────────────────────────────────────────────────────────────
  if (!ready || !active || !step) return null;

  // ── Arrow ─────────────────────────────────────────────────────────────────
  function buildArrowStyle() {
    if (!pos) return null;
    var p = pos.placement;
    var ao = pos.arrowOffset;
    var base = { position: 'absolute', width: 0, height: 0 };
    if (p === 'bottom') return Object.assign({}, base, { top: (0 - ARROW) + 'px', left: (ao - ARROW) + 'px', borderLeft: ARROW + 'px solid transparent', borderRight: ARROW + 'px solid transparent', borderBottom: ARROW + 'px solid #1E2845' });
    if (p === 'top')    return Object.assign({}, base, { bottom: (0 - ARROW) + 'px', left: (ao - ARROW) + 'px', borderLeft: ARROW + 'px solid transparent', borderRight: ARROW + 'px solid transparent', borderTop: ARROW + 'px solid #1E2845' });
    if (p === 'right')  return Object.assign({}, base, { left: (0 - ARROW) + 'px', top: '50%', transform: 'translateY(-50%)', borderTop: ARROW + 'px solid transparent', borderBottom: ARROW + 'px solid transparent', borderRight: ARROW + 'px solid #1E2845' });
    return Object.assign({}, base, { right: (0 - ARROW) + 'px', top: '50%', transform: 'translateY(-50%)', borderTop: ARROW + 'px solid transparent', borderBottom: ARROW + 'px solid transparent', borderLeft: ARROW + 'px solid #1E2845' });
  }

var tooltipStyle = (isCenter || !pos)
  ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: TOOLTIP_W + 'px', zIndex: 10000 }
  : pos.style;

  var highlightRect = pos ? pos.rect : null;
  var arrowS = !isCenter && pos ? buildArrowStyle() : null;

  return createPortal(
    <div>
      {/* Backdrop */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(14,21,35,0.72)', zIndex: 9998, pointerEvents: 'none' }} />

      {/* Yellow highlight ring */}
      {highlightRect && (
        <div aria-hidden="true" style={{ position: 'fixed', top: (highlightRect.top - 4) + 'px', left: (highlightRect.left - 4) + 'px', width: (highlightRect.width + 8) + 'px', height: (highlightRect.height + 8) + 'px', border: '2px solid #F5B731', borderRadius: '10px', boxShadow: '0 0 0 4px rgba(245,183,49,0.1)', zIndex: 9999, pointerEvents: 'none' }} />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="false"
        aria-label={'Guided tour: ' + step.title}
        tabIndex={-1}
        style={Object.assign({}, tooltipStyle, { background: '#1E2845', border: '1px solid #2A3550', borderRadius: '12px', padding: '20px', boxShadow: '0 24px 64px rgba(0,0,0,0.55)', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", outline: 'none' })}
      >
        {arrowS && <div aria-hidden="true" style={arrowS} />}

        {/* Step label */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#F5B731', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '6px' }}>
          {'STEP ' + (stepIdx + 1) + ' OF ' + steps.length}
        </div>

        {/* Title + skip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.35, paddingRight: '8px' }}>{step.title}</div>
          <button onClick={doSkip} aria-label="Skip tour" className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-[#1E2845]" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* Description */}
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.65, margin: '0 0 18px 0' }}>{step.description}</p>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }} role="progressbar" aria-valuenow={stepIdx + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label={'Step ' + (stepIdx + 1) + ' of ' + steps.length}>
            {steps.map(function (_, i) {
              return <div key={i} aria-hidden="true" style={{ width: i === stepIdx ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === stepIdx ? '#F5B731' : '#2A3550', transition: 'width 0.2s ease, background 0.2s ease' }} />;
            })}
          </div>
          <button onClick={isLast ? doComplete : doNext} aria-label={isLast ? 'Finish guided tour' : 'Next step'} className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 focus:ring-offset-[#1E2845]" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#F5B731', border: 'none', borderRadius: '8px', color: '#0E1523', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            {isLast ? 'Done' : 'Next'}
            {isLast ? <Check size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}