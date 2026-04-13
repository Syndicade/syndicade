import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * StorageMeter — shows storage usage bar for an org.
 *
 * Props:
 *   usageBytes     — number (bytes used) — optional, fetches from DB if omitted
 *   limitGb        — number (GB allowed on plan) — optional, defaults to 2
 *   organizationId — string
 *   compact        — bool (smaller inline version for nav/header)
 *   isAdmin        — bool (show upgrade CTA only to admins)
 */
export default function StorageMeter({ usageBytes, limitGb, organizationId, compact, isAdmin }) {
  var navigate = useNavigate();
  var [fetchedBytes, setFetchedBytes] = useState(0);
  var [fetchedLimitGb, setFetchedLimitGb] = useState(null);

  useEffect(function() {
    if (!organizationId) return;
    if (usageBytes !== undefined && usageBytes !== null && limitGb) return;
    supabase
      .from('organizations')
      .select('storage_used_bytes')
      .eq('id', organizationId)
      .single()
      .then(function(r) {
        if (r.data) setFetchedBytes(r.data.storage_used_bytes || 0);
      });
  }, [organizationId]);

  var effectiveBytes = (usageBytes !== undefined && usageBytes !== null) ? usageBytes : fetchedBytes;
  var effectiveLimitGb = limitGb || fetchedLimitGb || 2;

  var limitBytes = effectiveLimitGb * 1024 * 1024 * 1024;
  var pct = Math.min(100, Math.round((effectiveBytes / limitBytes) * 100)) || 0;

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  // Color thresholds
  var barColor = '#22C55E';
  var textColor = '#22C55E';
  if (pct >= 90) { barColor = '#EF4444'; textColor = '#EF4444'; }
  else if (pct >= 80) { barColor = '#F5B731'; textColor = '#F5B731'; }

  var isBlocked = pct >= 100;

  // ── Compact version (for dashboard / quick actions) ───────────────────────
  if (compact) {
    return (
      <div role="region" aria-label={'Storage: ' + pct + '% used'}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
          <span style={{ fontSize:'10px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'2px' }}>Storage</span>
          <span style={{ fontSize:'10px', fontWeight:700, color:textColor }}>{pct}%</span>
        </div>
        <div
          style={{ width:'100%', height:'4px', background:'#1E2845', borderRadius:'2px', overflow:'hidden' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={pct + '% of storage used'}
        >
          <div style={{ width:pct + '%', height:'100%', background:barColor, borderRadius:'2px', transition:'width 0.4s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'4px' }}>
          <p style={{ fontSize:'10px', color:'#64748B', margin:0 }}>
            {formatBytes(effectiveBytes)} of {effectiveLimitGb} GB
          </p>
          {pct >= 80 && isAdmin && (
            <button
              onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
              style={{ fontSize:'9px', fontWeight:700, color: pct >= 90 ? '#EF4444' : '#F5B731', background:'none', border:'none', cursor:'pointer', padding:0 }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Upgrade storage plan"
            >
              Upgrade
            </button>
          )}
        </div>
        {isBlocked && (
          <p style={{ fontSize:'10px', color:'#EF4444', fontWeight:700, marginTop:'4px' }} role="alert">
            Uploads blocked — storage full
          </p>
        )}
      </div>
    );
  }

  // ── Full version (for billing page, org dashboard) ────────────────────────
  return (
    <div
      style={{
        background:'#151B2D',
        border:'1px solid ' + (isBlocked ? 'rgba(239,68,68,0.4)' : '#2A3550'),
        borderRadius:'10px',
        padding:'16px',
      }}
      role="region"
      aria-label="Storage usage"
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" aria-hidden="true">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#FFFFFF' }}>Storage</span>
        </div>
        <span style={{
          fontSize:'11px', fontWeight:700, color:textColor,
          background: pct >= 80 ? (pct >= 100 ? 'rgba(239,68,68,0.1)' : 'rgba(245,183,49,0.1)') : 'rgba(34,197,94,0.1)',
          border:'1px solid ' + (pct >= 80 ? (pct >= 100 ? 'rgba(239,68,68,0.3)' : 'rgba(245,183,49,0.3)') : 'rgba(34,197,94,0.3)'),
          padding:'2px 8px', borderRadius:'99px',
        }}>
          {pct}% used
        </span>
      </div>

      {/* Bar */}
      <div
        style={{ width:'100%', height:'8px', background:'#1E2845', borderRadius:'4px', overflow:'hidden', marginBottom:'8px' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={pct + '% of ' + effectiveLimitGb + ' GB storage used'}
      >
        <div style={{ width:pct + '%', height:'100%', background:barColor, borderRadius:'4px', transition:'width 0.4s ease' }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'12px', color:'#94A3B8' }}>
          {formatBytes(effectiveBytes)} <span style={{ color:'#64748B' }}>of {effectiveLimitGb} GB used</span>
        </span>
        <span style={{ fontSize:'12px', color:'#64748B' }}>
          {formatBytes(Math.max(0, limitBytes - effectiveBytes))} free
        </span>
      </div>

      {/* Warning messages */}
      {isBlocked && (
        <div style={{ marginTop:'12px', padding:'10px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px' }} role="alert">
          <p style={{ fontSize:'12px', color:'#EF4444', fontWeight:700, margin:'0 0 4px' }}>Storage full — uploads blocked</p>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:0 }}>Free up space or upgrade your plan to continue uploading.</p>
          {isAdmin && (
            <button
              onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
              style={{ marginTop:'8px', padding:'6px 14px', background:'#EF4444', color:'#FFFFFF', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}
              className="hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Go to billing to upgrade storage"
            >
              Upgrade Storage
            </button>
          )}
        </div>
      )}

      {pct >= 90 && !isBlocked && (
        <div style={{ marginTop:'12px', padding:'10px 12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px' }} role="alert" aria-live="polite">
          <p style={{ fontSize:'12px', color:'#EF4444', margin:'0 0 2px', fontWeight:700 }}>Almost full</p>
          <p style={{ fontSize:'12px', color:'#94A3B8', margin:0 }}>You're at {pct}% capacity. Upgrade soon to avoid upload blocks.</p>
        </div>
      )}

      {pct >= 80 && pct < 90 && (
        <div style={{ marginTop:'12px', padding:'10px 12px', background:'rgba(245,183,49,0.06)', border:'1px solid rgba(245,183,49,0.2)', borderRadius:'8px' }} role="status" aria-live="polite">
          <p style={{ fontSize:'12px', color:'#F5B731', margin:0 }}>You're using {pct}% of your storage. Consider cleaning up old files.</p>
        </div>
      )}
    </div>
  );
}