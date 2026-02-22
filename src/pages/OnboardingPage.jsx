import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function Icon({ path, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map((d, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />)
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={path} />}
    </svg>
  );
}

const ICONS = {
  arrow:   'M13 7l5 5m0 0l-5 5m5-5H6',
  check:   'M5 13l4 4L19 7',
  plus:    'M12 4v16m8-8H4',
  eye:     ['M15 12a3 3 0 11-6 0 3 3 0 016 0z','M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'],
  globe:   ['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  mail:    ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  users:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  calendar:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  building:['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'],
  checkCircle: ['M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'],
};

const STEPS = [
  { id: 'org',     label: 'Your Org',       icon: 'building'  },
  { id: 'event',   label: 'First Event',    icon: 'calendar'  },
  { id: 'invite',  label: 'Invite Members', icon: 'users'     },
  { id: 'publish', label: 'Public Page',    icon: 'globe'     },
  { id: 'done',    label: 'Dashboard',      icon: 'check'     },
];

const ORG_TYPES = ['Nonprofit','Community Group','Civic Organization','Religious Organization','Sports / Recreation','Neighborhood Association','Alumni Group','Other'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Org
  const [org, setOrg] = useState({ name: '', type: '', mission: '', city: '' });
  const [orgId, setOrgId] = useState(null);

  // Step 2 — Event
  const [event, setEvent] = useState({ name: '', date: '', time: '', location: '', description: '' });

  // Step 3 — Invites
  const [invites, setInvites] = useState(['', '', '']);

  // Step 4 — Publish toggles
  const [pub, setPub] = useState({ showEvents: true, allowJoin: true, showCount: false });

  const progress = ((step + 1) / STEPS.length) * 100;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function updateInvite(i, val) {
    setInvites(prev => prev.map((v, idx) => idx === i ? val : v));
  }
  function addInviteRow() {
    if (invites.length < 10) setInvites(prev => [...prev, '']);
  }

  // ── Step save handlers ────────────────────────────────────────────────────
  async function saveOrg() {
    if (!org.name || !org.type) { toast.error('Please enter your organization name and type.'); return false; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data, error } = await supabase.from('organizations').insert({
        name: org.name.trim(),
        description: org.mission.trim() || null,
        location: org.city.trim() || null,
        type: org.type,
        slug,
        created_by: user.id,
        settings: { template: 'classic', showEvents: true, allowJoin: true, showCount: false },
      }).select().single();
      if (error) throw error;
      // Add creator as admin member
      await supabase.from('memberships').insert({ organization_id: data.id, member_id: user.id, role: 'admin', status: 'active' });
      setOrgId(data.id);
      toast.success('Organization created!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not create organization.');
      return false;
    } finally { setSaving(false); }
  }

  async function saveEvent() {
    if (!event.name || !event.date) { toast.error('Please enter an event name and date.'); return false; }
    if (!orgId) { toast.error('Organization not found. Please go back.'); return false; }
    setSaving(true);
    try {
      const startDate = event.time ? `${event.date}T${event.time}:00` : `${event.date}T09:00:00`;
      const { error } = await supabase.from('events').insert({
        organization_id: orgId,
        title: event.name.trim(),
        description: event.description.trim() || null,
        location: event.location.trim() || null,
        start_date: startDate,
        end_date: startDate,
        status: 'published',
      });
      if (error) throw error;
      toast.success('Event created!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not create event.');
      return false;
    } finally { setSaving(false); }
  }

  async function sendInvites() {
    const valid = invites.filter(e => e.trim() && e.includes('@'));
    if (valid.length === 0) { toast.error('Please enter at least one valid email address.'); return false; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = valid.map(email => ({
        organization_id: orgId,
        email: email.trim().toLowerCase(),
        invited_by: user.id,
        status: 'pending',
        created_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('invitations').insert(rows);
      if (error) throw error;
      toast.success(`${valid.length} invite${valid.length > 1 ? 's' : ''} sent!`);
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not send invites.');
      return false;
    } finally { setSaving(false); }
  }

  async function savePublishSettings() {
    if (!orgId) return true;
    try {
      await supabase.from('organizations').update({
        settings: { template: 'classic', ...pub },
      }).eq('id', orgId);
      toast.success('Public page is live!');
      return true;
    } catch { return true; } // non-critical, proceed anyway
  }

  async function handleNext() {
    let ok = true;
    if (step === 0) ok = await saveOrg();
    if (step === 1) ok = await saveEvent();
    if (step === 2) ok = await sendInvites();
    if (step === 3) ok = await savePublishSettings();
    if (ok) setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() { setStep(s => Math.max(s - 1, 0)); }
  function handleSkip()  { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function goToDashboard() { navigate(orgId ? `/organizations/${orgId}` : '/dashboard', { replace: true }); }

  // ── Render steps ──────────────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent';
  const inputBg  = { background: '#0d1526' };
  const labelCls = 'block text-sm font-semibold text-slate-300 mb-1.5';

  function renderStep() {
    switch (step) {
      case 0: return (
        <>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Step 1 of 5</p>
          <h2 className="text-2xl font-black text-white mb-2">Tell us about your organization</h2>
          <p className="text-slate-400 text-sm mb-6">Takes about 2 minutes. You can change everything later.</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="ob-org-name" className={labelCls}>Organization name <span aria-hidden="true">*</span></label>
              <input id="ob-org-name" type="text" className={inputCls} style={inputBg} placeholder="e.g. Toledo Food Bank" value={org.name} onChange={e => setOrg(p => ({ ...p, name: e.target.value }))} required aria-required="true" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ob-org-type" className={labelCls}>Organization type <span aria-hidden="true">*</span></label>
                <select id="ob-org-type" className={inputCls} style={inputBg} value={org.type} onChange={e => setOrg(p => ({ ...p, type: e.target.value }))} required aria-required="true">
                  <option value="">Select type…</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="ob-city" className={labelCls}>City / Location</label>
                <input id="ob-city" type="text" className={inputCls} style={inputBg} placeholder="Toledo, OH" value={org.city} onChange={e => setOrg(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div>
              <label htmlFor="ob-mission" className={labelCls}>
                Mission statement <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea id="ob-mission" rows={3} className={inputCls} style={{ ...inputBg, resize: 'none' }} placeholder="What does your organization do and why does it matter?" value={org.mission} onChange={e => setOrg(p => ({ ...p, mission: e.target.value }))} />
            </div>
          </div>
        </>
      );

      case 1: return (
        <>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Step 2 of 5</p>
          <h2 className="text-2xl font-black text-white mb-2">Create your first event</h2>
          <p className="text-slate-400 text-sm mb-6">Give your members something to RSVP to right away.</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="ob-ev-name" className={labelCls}>Event name <span aria-hidden="true">*</span></label>
              <input id="ob-ev-name" type="text" className={inputCls} style={inputBg} placeholder="e.g. Spring Volunteer Day" value={event.name} onChange={e => setEvent(p => ({ ...p, name: e.target.value }))} required aria-required="true" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ob-ev-date" className={labelCls}>Date <span aria-hidden="true">*</span></label>
                <input id="ob-ev-date" type="date" className={inputCls} style={inputBg} value={event.date} onChange={e => setEvent(p => ({ ...p, date: e.target.value }))} required aria-required="true" />
              </div>
              <div>
                <label htmlFor="ob-ev-time" className={labelCls}>Time</label>
                <input id="ob-ev-time" type="time" className={inputCls} style={inputBg} value={event.time} onChange={e => setEvent(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label htmlFor="ob-ev-loc" className={labelCls}>Location</label>
              <input id="ob-ev-loc" type="text" className={inputCls} style={inputBg} placeholder="Address or 'Virtual'" value={event.location} onChange={e => setEvent(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="ob-ev-desc" className={labelCls}>Brief description</label>
              <textarea id="ob-ev-desc" rows={2} className={inputCls} style={{ ...inputBg, resize: 'none' }} placeholder="What should members know?" value={event.description} onChange={e => setEvent(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
        </>
      );

      case 2: return (
        <>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Step 3 of 5</p>
          <h2 className="text-2xl font-black text-white mb-2">Invite your first members</h2>
          <p className="text-slate-400 text-sm mb-6">They'll receive an email invitation to join your organization.</p>

          <fieldset>
            <legend className="sr-only">Member email invitations</legend>
            <div className="space-y-3">
              {invites.map((inv, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0" style={{ background: '#0d1526' }} aria-hidden="true">{i + 1}</div>
                  <input
                    type="email"
                    className={inputCls + ' flex-1'}
                    style={inputBg}
                    placeholder={`member${i + 1}@email.com`}
                    value={inv}
                    onChange={e => updateInvite(i, e.target.value)}
                    aria-label={`Invite email ${i + 1}`}
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {invites.length < 10 && (
            <button
              type="button"
              onClick={addInviteRow}
              className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 text-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <Icon path={ICONS.plus} className="h-4 w-4" />
              Add another
            </button>
          )}

          <div className="mt-4 p-3 rounded-xl border border-blue-800/50 text-sm text-blue-300" style={{ background: 'rgba(30,58,138,0.3)' }}>
            Invites are sent immediately. Members will receive a link to join your organization and RSVP to your first event.
          </div>
        </>
      );

      case 3: return (
        <>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Step 4 of 5</p>
          <h2 className="text-2xl font-black text-white mb-2">Publish your public page</h2>
          <p className="text-slate-400 text-sm mb-6">Let the world find your organization. You control what's visible.</p>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden border border-white/10 mb-6" role="img" aria-label="Public organization page preview">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10" style={{ background: '#060e1a' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" aria-hidden="true" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" aria-hidden="true" />
              <span className="text-xs text-slate-500 ml-2 font-mono">
                syndicade.com/org/{org.name ? org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'your-org'}
              </span>
            </div>
            <div className="p-5" style={{ background: '#0a1220' }}>
              <div className="text-lg font-black text-white mb-1">{org.name || 'Your Organization'}</div>
              <div className="text-xs text-slate-400 mb-3">{org.type || 'Community Group'}{org.city ? ` · ${org.city}` : ''}</div>
              {event.name && (
                <div className="rounded-lg p-3 border border-white/10" style={{ background: '#111d35' }}>
                  <div className="text-xs text-slate-400 mb-1">Upcoming event</div>
                  <div className="text-sm text-white font-medium">{event.name}{event.date ? ` — ${new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</div>
                </div>
              )}
              <button className="mt-3 px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-400 text-slate-900" tabIndex={-1} aria-hidden="true">Join this organization</button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-1" role="group" aria-label="Public page settings">
            {[
              { key: 'showEvents', label: 'Show upcoming events', desc: 'Let the public see your events' },
              { key: 'allowJoin',  label: 'Allow join requests',  desc: 'Anyone can request to join' },
              { key: 'showCount',  label: 'Show member count',    desc: 'Display how many members you have' },
            ].map(t => (
              <div key={t.key} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-white">{t.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pub[t.key]}
                  onClick={() => setPub(p => ({ ...p, [t.key]: !p[t.key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 flex-shrink-0 ${pub[t.key] ? 'bg-blue-600' : 'bg-white/20'}`}
                  aria-label={t.label}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${pub[t.key] ? 'left-[22px]' : 'left-0.5'}`} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </>
      );

      case 4: return (
        <div className="text-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Icon path={ICONS.checkCircle} className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">You're all set!</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">Your organization is live, your event is posted, and invites are on their way.</p>

          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            {[
              { label: 'Members invited', value: invites.filter(e => e.includes('@')).length || '0', sub: 'Invites sent' },
              { label: 'Your event',      value: event.name ? '1' : '0', sub: 'Visible to members' },
              { label: 'Public page',     value: 'Live', sub: `syndicade.com/org/…` },
              { label: 'Dashboard',       value: 'Ready', sub: 'All features unlocked' },
            ].map(c => (
              <div key={c.label} className="rounded-xl border border-white/10 p-4" style={{ background: '#111d35' }}>
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">{c.label}</div>
                <div className="text-2xl font-black text-white">{c.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-blue-800/50 p-4 text-sm text-blue-300 text-left mb-8" style={{ background: 'rgba(30,58,138,0.3)' }}>
            <strong className="text-white">This event is now visible in your members' unified dashboard.</strong> When they log in, they'll see it alongside events from all their other organizations.
          </div>

          <button
            onClick={goToDashboard}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Go to my dashboard
            <Icon path={ICONS.arrow} className="h-4 w-4" />
          </button>
        </div>
      );

      default: return null;
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1526', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <a href="#ob-main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-slate-900 focus:rounded-lg focus:font-semibold focus:outline-none">
        Skip to content
      </a>

      {/* ── Header ── */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(13,21,38,0.98)' }} role="banner">
        <div className="text-xl font-black text-white">
          Syndi<span className="text-amber-400">cade</span>
        </div>

        {/* Progress bar */}
        <div
          className="flex-1 max-w-xs mx-6"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].label}`}
        >
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-slate-400 text-right mt-1">{step + 1} of {STEPS.length}</div>
        </div>

        {step < 4 && (
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 hover:text-white underline transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
          >
            Skip
          </button>
        )}
      </header>

      {/* ── Step indicators ── */}
      <nav aria-label="Setup progress" className="px-6 py-4 flex justify-center">
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex items-center">
              {i > 0 && (
                <div className={`w-8 h-px mx-1 ${i <= step ? 'bg-blue-500' : 'bg-white/15'}`} aria-hidden="true" />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step  ? 'bg-emerald-600 text-white' :
                  i === step ? 'bg-blue-600 text-white ring-4 ring-blue-600/30' :
                               'text-slate-500 border border-white/20'
                }`}
                style={i > step ? { background: '#111d35' } : {}}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step
                  ? <Icon path={ICONS.check} className="h-4 w-4" strokeWidth={3} />
                  : i + 1
                }
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── Main card ── */}
      <main id="ob-main" className="flex-1 flex justify-center px-4 pb-12">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-white/10 p-8" style={{ background: '#111d35' }}>
            {renderStep()}

            {/* Actions */}
            {step < 4 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                {step > 0 ? (
                  <button
                    onClick={handleBack}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:border-white/40 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40"
                  >
                    Back
                  </button>
                ) : <div />}

                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      {step === 3 ? 'Publish' : 'Continue'}
                      <Icon path={ICONS.arrow} className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}