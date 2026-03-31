/**
 * DemoBadge — src/components/DemoBadge.jsx
 *
 * Inline badge used to label demo/sample data throughout the platform.
 * Renders a small pill: "Sample Data" with a flask icon.
 *
 * Usage:
 *   import DemoBadge from '../components/DemoBadge';
 *
 *   // Default (inline, e.g. inside a card)
 *   <DemoBadge />
 *
 *   // Small variant (e.g. tight spaces, table rows)
 *   <DemoBadge size="sm" />
 *
 *   // With tooltip disabled
 *   <DemoBadge showTooltip={false} />
 */

import { TestTube2 } from 'lucide-react';
import { useState } from 'react';

export default function DemoBadge({ size, showTooltip }) {
  var isSmall = size === 'sm';
  var tooltipEnabled = showTooltip !== false;
  var [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <span
        role="img"
        aria-label="Sample data — this is a demo record, not a real organization or event"
        onMouseEnter={function() { if (tooltipEnabled) setTooltipVisible(true); }}
        onMouseLeave={function() { setTooltipVisible(false); }}
        onFocus={function() { if (tooltipEnabled) setTooltipVisible(true); }}
        onBlur={function() { setTooltipVisible(false); }}
        tabIndex={tooltipEnabled ? 0 : -1}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isSmall ? '3px' : '4px',
          padding: isSmall ? '1px 6px' : '2px 8px',
          borderRadius: '99px',
          background: 'rgba(251,146,60,0.12)',
          border: '1px solid rgba(251,146,60,0.35)',
          color: '#FB923C',
          fontSize: isSmall ? '9px' : '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: tooltipEnabled ? 'default' : 'inherit',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <TestTube2 size={isSmall ? 9 : 10} aria-hidden="true" />
        Sample Data
      </span>

      {/* Tooltip */}
      {tooltipEnabled && tooltipVisible && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1E2845',
            border: '1px solid #2A3550',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            color: '#CBD5E1',
            whiteSpace: 'nowrap',
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        >
          This is demo data for preview purposes only.
          {/* Arrow */}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #2A3550',
          }} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}