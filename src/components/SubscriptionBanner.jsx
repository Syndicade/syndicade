import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SubscriptionBanner — shown at the top of OrgLayout when trial is expiring or expired.
 *
 * Props:
 *   status    — 'trialing' | 'expired'
 *   daysLeft  — number (positive = days remaining, negative = days past expiry)
 *   orgId     — string
 *   isAdmin   — bool (hide billing link for non-admins)
 */
export default function SubscriptionBanner({ status, daysLeft, orgId, isAdmin }) {
  var [dismissed, setDismissed] = useState(false);
  var navigate = useNavigate();

  if (dismissed) return null;

  // Only show banner for trialing (7 days or fewer left) or expired
  var shouldShow = status === 'expired' || (status === 'trialing' && daysLeft <= 7);
  if (!shouldShow) return null;

  var isExpired = status === 'expired';
  var daysPast = isExpired ? Math.abs(daysLeft) : 0;

  // Colors
  var bg = isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(245,183,49,0.1)';
  var border = isExpired ? 'rgba(239,68,68,0.3)' : 'rgba(245,183,49,0.3)';
  var accent = isExpired ? '#EF4444' : '#F5B731';

  // Message
  var message = '';
  var sub = '';
  if (isExpired) {
    message = 'Your free trial has ended.';
    sub = daysPast <= 30
      ? 'Your org is in read-only mode. Subscribe to restore full access. (' + daysPast + ' of 30 grace days used)'
      : 'Your account will be frozen soon. Subscribe now to keep your data.';
  } else {
    message = daysLeft === 1 ? 'Your trial ends tomorrow.' : 'Your trial ends in ' + daysLeft + ' days.';
    sub = 'Subscribe now to keep full access after your trial ends.';
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: bg,
        borderBottom: '1px solid ' + border,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        {/* Icon */}
        {isExpired ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" style={{ flexShrink: 0 }} aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" style={{ flexShrink: 0 }} aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}

        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: accent }}>{message} </span>
          <span style={{ fontSize: '13px', color: '#CBD5E1' }}>{sub}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isAdmin && (
          <button
            onClick={function() { navigate('/organizations/' + orgId + '/billing'); }}
            style={{
              padding: '6px 14px',
              background: accent,
              color: isExpired ? '#FFFFFF' : '#0E1523',
              fontWeight: 700,
              fontSize: '12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="Go to billing to subscribe"
          >
            Subscribe
          </button>
        )}
        {!isExpired && (
          <button
            onClick={function() { setDismissed(true); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748B', display: 'flex', alignItems: 'center' }}
            aria-label="Dismiss banner"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
