import { useState } from 'react';
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
  x:          'M6 18L18 6M6 6l12 12',
  arrowRight: 'M13 7l5 5m0 0l-5 5m5-5H6',
  bookmark:   'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
};

export default function ProgramDiscoveryCard({ program, session, initialSaved }) {
  if (!program || !program.id) return null;

  var [saved, setSaved] = useState(initialSaved || false);
  var [savingBookmark, setSavingBookmark] = useState(false);
  var [showModal, setShowModal] = useState(false);

  var location = [program.org_city, program.org_state].filter(Boolean).join(', ');
  var orgInitials = ((program.org_name || 'O').charAt(0)).toUpperCase();
  var orgUrl = program.org_slug ? '/org/' + program.org_slug : null;

  async function handleSave() {
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

  return (
    <>
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
        {/* Card body */}
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Org row — verified badge + save button */}
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

            {/* Org name + verified badge — nowrap so dot never orphans */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden', flexWrap: 'nowrap' }}>
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

          {/* Program name — no status badge */}
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0E1523', margin: 0 }}>
            {program.name || 'Untitled Program'}
          </h2>

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
            {program.contact_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                <Icon path={ICONS.mail} className="h-3.5 w-3.5" />
                <a
                  href={'mailto:' + program.contact_email}
                  style={{ color: '#3B82F6' }}
                  className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                  aria-label={'Contact ' + (program.contact_name || program.org_name || 'organization') + ' by email'}
                >
                  {program.contact_name ? program.contact_name + ' — ' + program.contact_email : program.contact_email}
                </a>
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
          <button
            onClick={function() { setShowModal(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#8B5CF6', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label={'View details for ' + (program.name || 'program')}
          >
            View Details
            <Icon path={ICONS.arrowRight} className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>

      {/* Detail modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={'program-detail-' + program.id}
          onClick={function() { setShowModal(false); }}
        >
          <div
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '512px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={function(e) { e.stopPropagation(); }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E2E8F0', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'nowrap' }}>
                  {program.org_logo_url ? (
                    <img src={program.org_logo_url} alt={(program.org_name || 'Org') + ' logo'} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
                      <span style={{ color: '#3B82F6', fontWeight: 800, fontSize: '11px' }}>{orgInitials}</span>
                    </div>
                  )}
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{program.org_name || 'Unknown Organization'}</span>
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
                <h2 id={'program-detail-' + program.id} style={{ fontSize: '19px', fontWeight: 800, color: '#0E1523', margin: 0 }}>
                  {program.name || 'Untitled Program'}
                </h2>
              </div>
              <button
                onClick={function() { setShowModal(false); }}
                style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', flexShrink: 0 }}
                className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-label="Close"
              >
                <Icon path={ICONS.x} className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {program.description && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>About This Program</p>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7, margin: 0 }}>{program.description}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {program.audience && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569' }}>
                    <Icon path={ICONS.user} className="h-4 w-4" />
                    <span><strong style={{ color: '#0E1523' }}>Who it's for:</strong> {program.audience}</span>
                  </div>
                )}
                {program.schedule && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569' }}>
                    <Icon path={ICONS.clock} className="h-4 w-4" />
                    <span><strong style={{ color: '#0E1523' }}>Schedule:</strong> {program.schedule}</span>
                  </div>
                )}
                {location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569' }}>
                    <Icon path={ICONS.mapPin} className="h-4 w-4" />
                    <span><strong style={{ color: '#0E1523' }}>Location:</strong> {location}</span>
                  </div>
                )}
              </div>

              {program.how_to_apply && (
                <div style={{ padding: '12px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px' }}>How to Apply</p>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{program.how_to_apply}</p>
                </div>
              )}

              {(program.contact_name || program.contact_email) && (
                <div style={{ padding: '12px 14px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}>Contact</p>
                  {program.contact_name && (
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 4px' }}>{program.contact_name}</p>
                  )}
                  {program.contact_email && (
                    <a
                      href={'mailto:' + program.contact_email}
                      style={{ fontSize: '13px', color: '#3B82F6', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    >
                      <Icon path={ICONS.mail} className="h-3.5 w-3.5" />
                      {program.contact_email}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
              {orgUrl && (
                <a
                  href={orgUrl}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: 600, borderRadius: '8px', textDecoration: 'none' }}
                  className="hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <Icon path={ICONS.globe} className="h-4 w-4" />
                  Visit Page
                </a>
              )}
              {program.contact_email && (
                <a
                  href={'mailto:' + program.contact_email}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#8B5CF6', color: '#FFFFFF', fontSize: '13px', fontWeight: 700, borderRadius: '8px', textDecoration: 'none', border: 'none' }}
                  className="hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <Icon path={ICONS.mail} className="h-4 w-4" />
                  Contact Us
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}