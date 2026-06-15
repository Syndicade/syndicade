import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from './MascotToast';

function Icon({ path, className, strokeWidth }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'h-5 w-5'}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      {Array.isArray(path)
        ? path.map(function(d, i) {
            return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={d} />;
          })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth || 2} d={path} />}
    </svg>
  );
}

var ICONS = {
  user:       'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock:      ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'],
  mail:       ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  globe:      ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  mapPin:     ['M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'],
  arrowRight: 'M13 7l5 5m0 0l-5 5m5-5H6',
  bookmark:   'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  dollar:     ['M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
};

export default function ProgramDiscoveryCard({ program, session, initialSaved }) {
  if (!program || !program.id) return null;

  var [saved, setSaved] = useState(initialSaved || false);
  var [savingBookmark, setSavingBookmark] = useState(false);

  var location = [program.org_city, program.org_state].filter(Boolean).join(', ');
  var orgInitials = ((program.org_name || 'O').charAt(0)).toUpperCase();
  var orgUrl = program.org_slug ? '/org/' + program.org_slug : null;
  var orgId = program.organization_id;

  function costBadge() {
    if (!program.cost_type || program.cost_type === 'free') return { label: 'Free', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (program.cost_type === 'donation') return { label: 'Donation', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' };
    var amt = program.cost_amount ? '$' + parseFloat(program.cost_amount).toFixed(2) : 'Paid';
    return { label: amt, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' };
  }
  var cost = costBadge();

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { toast.error('Sign in to save programs'); return; }
    setSavingBookmark(true);
    try {
      if (saved) {
        var del = await supabase
          .from('program_saves')
          .delete()
          .eq('user_id', session.user.id)
          .eq('program_id', program.id);
        if (del.error) throw del.error;
        setSaved(false);
        toast('Removed from saved');
      } else {
        var ins = await supabase
          .from('program_saves')
          .insert([{ user_id: session.user.id, program_id: program.id }]);
        if (ins.error) throw ins.error;
        setSaved(true);
        mascotSuccessToast('Program saved!');
      }
    } catch (err) {
      toast.error('Could not update saved programs');
    } finally {
      setSavingBookmark(false);
    }
  }

  // Detail page link — state tracks where we came from for back navigation
  var detailTo = orgId
    ? { pathname: '/organizations/' + orgId + '/programs/' + program.id, state: { from: 'programs' } }
    : null;

  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
      }}
      aria-label={(program.name || 'Program') + ' by ' + (program.org_name || 'unknown organization')}
    >
      {/* Program image */}
      {program.image_url && (
        <div style={{ height: '120px', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={program.image_url}
            alt={program.name || 'Program image'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Org row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {program.org_logo_url ? (
            <img
              src={program.org_logo_url}
              alt={(program.org_name || 'Organization') + ' logo'}
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              aria-hidden="true"
            >
              <span style={{ color: '#3B82F6', fontWeight: 800, fontSize: '10px' }}>{orgInitials}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {program.org_name || 'Unknown Organization'}
            </span>
            {(program.is_verified_nonprofit || program.org_is_verified_nonprofit) && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '15px', height: '15px', flexShrink: 0 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="#22C55E"
                strokeWidth={2}
                aria-label="Verified nonprofit"
                title="Verified nonprofit"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={savingBookmark}
            style={{ padding: '4px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', color: saved ? '#F5B731' : '#64748B', flexShrink: 0, display: 'flex' }}
            className={'hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400'}
            aria-label={saved ? 'Unsave ' + (program.name || 'program') : 'Save ' + (program.name || 'program')}
            aria-pressed={saved}
          >
            {saved ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="#F5B731" aria-hidden="true">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            ) : (
              <Icon path={ICONS.bookmark} className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Program name */}
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523', margin: 0 }}>
          {program.name || 'Untitled Program'}
        </h2>

        {/* Cost badge */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: cost.bg, color: cost.color }}>
            {cost.label}
          </span>
        </div>

        {/* Description */}
        {program.description && (
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {program.description}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {program.audience && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
              <Icon path={ICONS.user} className="h-3.5 w-3.5" />
              <span>For: {program.audience}</span>
            </div>
          )}
          {program.schedule && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
              <Icon path={ICONS.clock} className="h-3.5 w-3.5" />
              <span>{program.schedule}</span>
            </div>
          )}
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
              <Icon path={ICONS.mapPin} className="h-3.5 w-3.5" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {orgUrl ? (
          <a
            href={orgUrl}
            style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            className="hover:text-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            aria-label={'Visit ' + (program.org_name || 'organization') + ' page'}
          >
            <Icon path={ICONS.globe} className="h-3.5 w-3.5" />
            Visit page
          </a>
        ) : (
          <span />
        )}

        {detailTo ? (
          <Link
            to={detailTo}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#8B5CF6', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, borderRadius: '8px', textDecoration: 'none' }}
            className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label={'View details for ' + (program.name || 'program')}
          >
            View Details
            <Icon path={ICONS.arrowRight} className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>Details unavailable</span>
        )}
      </div>
    </article>
  );
}