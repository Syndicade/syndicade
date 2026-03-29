import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from './MascotToast';
import { supabase } from '../lib/supabase';
import NonprofitVerificationForm from './NonprofitVerificationForm';

var TOTAL_STEPS = 4;

function ProgressBar({ step }) {
  var pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div style={{ width: '100%', height: '4px', background: '#1E2845', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: '2px',
        background: 'linear-gradient(90deg, #3B82F6, #F5B731)',
        width: pct + '%',
        transition: 'width 0.4s ease'
      }} />
    </div>
  );
}

function StepDots({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
      {Array.from({ length: TOTAL_STEPS }).map(function(_, i) {
        var isActive = i + 1 === step;
        var isDone = i + 1 < step;
        return (
          <div key={i} style={{
            width: isActive ? '24px' : '8px',
            height: '8px',
            borderRadius: '4px',
            background: isDone ? '#22C55E' : isActive ? '#3B82F6' : '#2A3550',
            transition: 'all 0.3s ease'
          }} aria-hidden="true" />
        );
      })}
    </div>
  );
}

// Step 1 — Confirm org details
function Step1({ org, onNext, onUpdate }) {
  var [name, setName] = useState(org.name || '');
  var [type, setType] = useState(org.type || 'nonprofit');
  var [mission, setMission] = useState(org.description || '');
  var [saving, setSaving] = useState(false);

  var orgTypes = [
    { value: 'nonprofit',   label: 'Nonprofit' },
    { value: 'club',        label: 'Club' },
    { value: 'association', label: 'Association' },
    { value: 'community',   label: 'Community Group' },
    { value: 'faith',       label: 'Faith Organization' },
    { value: 'hoa',         label: 'HOA' },
    { value: 'school',      label: 'School / Student Group' },
  ];

  async function handleSave() {
    if (!name.trim()) { toast.error('Organization name is required.'); return; }
    setSaving(true);
    var { error } = await supabase
      .from('organizations')
      .update({ name: name.trim(), type, description: mission.trim() })
      .eq('id', org.id);
    setSaving(false);
    if (error) { toast.error('Could not save: ' + error.message); return; }
    onUpdate({ name: name.trim(), type, description: mission.trim() });
    onNext();
  }

  var labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' };
  var inputStyle = { width: '100%', padding: '10px 14px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <img src="/mascot-pair.png" alt="" style={{ width: '160px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>Welcome to Syndicade!</h2>
        <p style={{ fontSize: '14px', color: '#94A3B8' }}>Let's get your organization set up. This takes about 3 minutes.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="ob-name" style={labelStyle}>Organization Name</label>
          <input
            id="ob-name" type="text" value={name}
            onChange={function(e) { setName(e.target.value); }}
            style={inputStyle} aria-required="true"
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>

        <div>
          <label htmlFor="ob-type" style={labelStyle}>Organization Type</label>
          <select
            id="ob-type" value={type}
            onChange={function(e) { setType(e.target.value); }}
            style={Object.assign({}, inputStyle, { cursor: 'pointer' })}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          >
            {orgTypes.map(function(t) { return <option key={t.value} value={t.value}>{t.label}</option>; })}
          </select>
        </div>

        <div>
          <label htmlFor="ob-mission" style={labelStyle}>
            Mission Statement{' '}
            <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>(optional)</span>
          </label>
          <textarea
            id="ob-mission" value={mission}
            onChange={function(e) { setMission(e.target.value); }}
            rows={3} placeholder="What does your organization do?"
            style={Object.assign({}, inputStyle, { resize: 'none' })}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>
      </div>

      <button
        onClick={handleSave} disabled={saving}
        className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{ marginTop: '24px', fontSize: '14px', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving...' : 'Save and Continue'}
      </button>
    </div>
  );
}

// Step 2 — Public page setup
function Step2({ org, onNext, onSkip }) {
  var [logoFile, setLogoFile] = useState(null);
  var [logoPreview, setLogoPreview] = useState(org.logo_url || null);
  var [tagline, setTagline] = useState('');
  var [saving, setSaving] = useState(false);

  function handleLogoChange(e) {
    var f = e.target.files[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  }

  async function handleSave() {
    setSaving(true);
    try {
      var logoUrl = org.logo_url;
      if (logoFile) {
        var ext = logoFile.name.split('.').pop();
        var path = org.id + '/logo.' + ext;
        var { error: upErr } = await supabase.storage.from('org-assets').upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        var { data: urlData } = supabase.storage.from('org-assets').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }
      var updates = { logo_url: logoUrl };
      if (tagline.trim()) updates.tagline = tagline.trim();
      var { error } = await supabase.from('organizations').update(updates).eq('id', org.id);
      if (error) throw error;
      mascotSuccessToast('Public page updated!', 'Your logo and tagline are saved.');
      onNext();
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  var labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' };
  var inputStyle = { width: '100%', padding: '10px 14px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>Set Up Your Public Page</h2>
        <p style={{ fontSize: '13px', color: '#94A3B8' }}>This is what people see when they find your org on Syndicade.</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Organization Logo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: logoPreview ? 'transparent' : '#1E2845',
            border: '2px solid #2A3550', overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            }
          </div>
          <div>
            <label htmlFor="ob-logo"
              className="px-4 py-2 bg-transparent border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
              style={{ fontSize: '13px', display: 'inline-block' }}
            >
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>
            <input id="ob-logo" type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>PNG, JPG, SVG recommended</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label htmlFor="ob-tagline" style={labelStyle}>
          Tagline{' '}
          <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>(optional)</span>
        </label>
        <input
          id="ob-tagline" type="text" value={tagline}
          onChange={function(e) { setTagline(e.target.value); }}
          placeholder="A short description of your org" maxLength={120}
          style={inputStyle}
          onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
          onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onSkip}
          className="px-6 py-3 bg-transparent border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          style={{ fontSize: '14px', flex: 1 }}>Skip for now</button>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{ fontSize: '14px', flex: 2, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}

// Step 3 — Nonprofit verification
function Step3({ org, onNext, onSkip }) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Nonprofit Verification</h2>
          <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: 'rgba(100,116,139,0.2)', color: '#94A3B8', border: '1px solid #2A3550' }}>Optional</span>
        </div>
        <p style={{ fontSize: '13px', color: '#94A3B8' }}>
          Verified 501(c)(3) orgs appear on the public discovery board and get 1 free month on any plan.
        </p>
      </div>
      <div style={{ background: '#151B2D', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <NonprofitVerificationForm organizationId={org.id} onSubmitted={onNext} />
      </div>
      <button onClick={onSkip}
        className="w-full px-6 py-3 bg-transparent border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        style={{ fontSize: '14px' }}>
        Skip for now — I'll do this later
      </button>
    </div>
  );
}

// Step 4 — You're all set
function Step4({ org, onDone }) {
  var actions = [
    {
      label: 'Create an Event',
      description: 'Schedule your first meeting or activity',
      action: 'event',
      hoverBorder: '#3B82F6',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      label: 'Post an Announcement',
      description: 'Share news or updates with your members',
      action: 'announcement',
      hoverBorder: '#F5B731',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5B731" strokeWidth="1.5" aria-hidden="true">
          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    },
    {
      label: 'Invite Members',
      description: 'Add members by email or upload a list from the Invite tab',
      action: 'invite',
      hoverBorder: '#22C55E',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="23" y1="11" x2="17" y2="11" /><line x1="20" y1="8" x2="20" y2="14" />
        </svg>
      )
    },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <img src="/mascot-pair.png" alt="" style={{ width: '120px', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>You're all set!</h2>
      <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '28px' }}>
        {org.name} is ready. What do you want to do first?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {actions.map(function(a) {
          return (
            <button
              key={a.action}
              onClick={function() { onDone(a.action); }}
              style={{
                background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px',
                padding: '16px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'border-color 0.15s', width: '100%'
              }}
              onMouseEnter={function(e) { e.currentTarget.style.borderColor = a.hoverBorder; }}
              onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#2A3550'; }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={a.label}
            >
              <div style={{ flexShrink: 0 }}>{a.icon}</div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>{a.label}</p>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{a.description}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ flexShrink: 0 }} aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        })}
      </div>

      <button
        onClick={function() { onDone('dashboard'); }}
        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
      >
        Go to my dashboard
      </button>
    </div>
  );
}

// Main wizard
export default function OrgOnboardingWizard({ org: initialOrg, organizationId, onComplete }) {
  var [step, setStep] = useState(1);
  var [org, setOrg] = useState(initialOrg || null);
  var [loading, setLoading] = useState(!initialOrg);
  var [dismissed, setDismissed] = useState(false);

  useEffect(function() {
    if (!initialOrg && organizationId) fetchOrg();
  }, [organizationId]);

  async function fetchOrg() {
    var { data } = await supabase.from('organizations').select('*').eq('id', organizationId).single();
    setOrg(data);
    setLoading(false);
  }

  function handleUpdate(updates) {
    setOrg(function(prev) { return Object.assign({}, prev, updates); });
  }

  async function markComplete() {
    await supabase.from('organizations').update({ onboarding_completed: true }).eq('id', org.id);
  }

  async function handleDismiss() {
    await markComplete();
    setDismissed(true);
    if (onComplete) onComplete('dismissed');
  }

  async function handleDone(action) {
    await markComplete();
    setDismissed(true);
    if (onComplete) onComplete(action);
  }

  function nextStep() { setStep(function(s) { return s + 1; }); }
  function skipStep() { setStep(function(s) { return s + 1; }); }

  if (dismissed) return null;
  if (loading || !org) return null;

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Organization setup wizard"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(14,21,35,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
      }}
    >
      <div style={{
        background: '#0E1523', border: '1px solid #2A3550', borderRadius: '16px',
        width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
      }}>
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px' }}>
              Step {step} of {TOTAL_STEPS}
            </span>
            {step > 1 && (
              <button onClick={handleDismiss} aria-label="Close setup wizard"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px', display: 'flex', alignItems: 'center' }}
                className="focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <ProgressBar step={step} />
          <div style={{ marginTop: '12px', marginBottom: '4px' }}>
            <StepDots step={step} />
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {step === 1 && <Step1 org={org} onNext={nextStep} onUpdate={handleUpdate} />}
          {step === 2 && <Step2 org={org} onNext={nextStep} onSkip={skipStep} />}
          {step === 3 && <Step3 org={org} onNext={nextStep} onSkip={skipStep} />}
          {step === 4 && <Step4 org={org} onDone={handleDone} />}
        </div>
      </div>
    </div>
  );
}