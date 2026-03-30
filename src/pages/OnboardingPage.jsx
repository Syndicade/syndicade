import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast } from '../components/MascotToast';
import toast from 'react-hot-toast';

// ── Shared UI helpers ──────────────────────────────────────────────────────────

var LABEL_STYLE = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px'
};

var INPUT_STYLE = {
  width: '100%', padding: '10px 14px',
  background: '#1E2845', border: '1px solid #2A3550',
  borderRadius: '8px', color: '#FFFFFF', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box'
};

var INPUT_DISABLED_STYLE = Object.assign({}, INPUT_STYLE, {
  background: '#151B2D', color: '#64748B', cursor: 'not-allowed'
});

function ProgressBar({ step, total }) {
  var pct = total === 1 ? 100 : ((step - 1) / (total - 1)) * 100;
  return (
    <div style={{ width: '100%', height: '4px', background: '#1E2845', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: '2px',
        background: 'linear-gradient(90deg, #3B82F6, #F5B731)',
        width: pct + '%', transition: 'width 0.4s ease'
      }} />
    </div>
  );
}

function StepDots({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
      {Array.from({ length: total }).map(function(_, i) {
        var isActive = i + 1 === step;
        var isDone = i + 1 < step;
        return (
          <div key={i} style={{
            width: isActive ? '24px' : '8px', height: '8px', borderRadius: '4px',
            background: isDone ? '#22C55E' : isActive ? '#3B82F6' : '#2A3550',
            transition: 'all 0.3s ease'
          }} aria-hidden="true" />
        );
      })}
    </div>
  );
}

function InfoBox({ children, color }) {
  var c = color || '#3B82F6';
  return (
    <div style={{
      background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
      borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
      display: 'flex', gap: '10px', alignItems: 'flex-start'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function WarningBox({ children }) {
  return (
    <div style={{
      background: 'rgba(245,183,49,0.08)', border: '1px solid rgba(245,183,49,0.3)',
      borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
      display: 'flex', gap: '10px', alignItems: 'flex-start'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5B731" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

// ── ORG ONBOARDING ─────────────────────────────────────────────────────────────

var ORG_TOTAL_STEPS = 4;

var AUDIENCE_OPTIONS = [
  'Youth & Children', 'Teens', 'Adults', 'Seniors', 'Families',
  'Veterans', 'Immigrants & Refugees', 'LGBTQ+', 'People with Disabilities',
  'Low-Income Households', 'General Public'
];

var CAUSE_OPTIONS = [
  'Arts & Culture', 'Animal Welfare', 'Civil Rights', 'Community Development',
  'Education', 'Environment', 'Food & Hunger', 'Health & Wellness',
  'Housing', 'Immigration', 'Mental Health', 'Recreation & Sports',
  'Religion & Faith', 'Social Services', 'Technology', 'Workforce Development'
];

// Org Step 1 — Basics + email clarity
function OrgStep1({ userEmail, onNext }) {
  var [orgName, setOrgName] = useState('');
  var [orgEmail, setOrgEmail] = useState('');
  var [orgPhone, setOrgPhone] = useState('');
  var [address, setAddress] = useState('');
  var [city, setCity] = useState('');
  var [state, setState] = useState('');
  var [zip, setZip] = useState('');
  var [saving, setSaving] = useState(false);

  function formatPhone(val) {
    var digits = val.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return '(' + digits.slice(0,3) + ') ' + digits.slice(3);
    return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6,10);
  }

  async function handleNext() {
    if (!orgName.trim()) { toast.error('Organization name is required.'); return; }
    if (!orgEmail.trim()) { toast.error('Organization contact email is required.'); return; }
    if (orgEmail.trim().toLowerCase() === userEmail.toLowerCase()) {
      toast.error('Your organization contact email should be different from your personal login email.');
      return;
    }
    setSaving(true);
    try {
      var { data: { user } } = await supabase.auth.getUser();
      var { data: org, error } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          contact_email: orgEmail.trim().toLowerCase(),
          contact_phone: orgPhone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip_code: zip.trim() || null,
          type: 'nonprofit',
          onboarding_completed: false,
          created_by: user.id
        })
        .select()
        .single();
      if (error) throw error;

// Ensure member profile exists
var { error: memberInsertError } = await supabase.from('members').insert({
  user_id: user.id,
  email: user.email,
  first_name: 'Admin',
  last_name: ''
});
// Ignore duplicate error (409) — member already exists
if (memberInsertError && memberInsertError.code !== '23505') {
  throw memberInsertError;
}
console.log('org.id:', org.id, 'user.id:', user.id);

// Auto-add creator as admin
var { error: membershipError } = await supabase.from('memberships').insert({
  organization_id: org.id,
  member_id: user.id,
  role: 'admin',
  status: 'active',
  joined_date: new Date().toISOString()
});
if (membershipError) throw membershipError;

      onNext({ org });
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
        Tell us about your organization
      </h2>
      <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
        This information will appear on your public profile.
      </p>

      <WarningBox>
        <strong style={{ color: '#F5B731' }}>Important:</strong> Your personal login email is <strong style={{ color: '#FFFFFF' }}>{userEmail}</strong>. The contact email below should be your <strong style={{ color: '#FFFFFF' }}>organization's email</strong> (e.g. info@yourorg.com) — not your personal email. This keeps your org accessible even if leadership changes.
      </WarningBox>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="ob-org-name" style={LABEL_STYLE}>Organization Name <span style={{ color: '#EF4444' }}>*</span></label>
          <input id="ob-org-name" type="text" value={orgName}
            onChange={function(e) { setOrgName(e.target.value); }}
            placeholder="e.g. Toledo Food Bank" style={INPUT_STYLE} aria-required="true"
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Your Personal Login Email</label>
          <input type="email" value={userEmail} disabled style={INPUT_DISABLED_STYLE} aria-label="Your personal login email — cannot be changed here" />
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>This is your personal Syndicade account. Manage it in Account Settings.</p>
        </div>

        <div>
          <label htmlFor="ob-org-email" style={LABEL_STYLE}>Organization Contact Email <span style={{ color: '#EF4444' }}>*</span></label>
          <input id="ob-org-email" type="email" value={orgEmail}
            onChange={function(e) { setOrgEmail(e.target.value); }}
            placeholder="info@yourorg.com" style={INPUT_STYLE} aria-required="true"
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Use a shared org email so future admins can always access it.
          </p>
        </div>

        <div>
          <label htmlFor="ob-org-phone" style={LABEL_STYLE}>Organization Phone <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input id="ob-org-phone" type="tel" value={orgPhone}
            onChange={function(e) { setOrgPhone(formatPhone(e.target.value)); }}
            placeholder="(419) 555-0100" maxLength={14} style={INPUT_STYLE}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>

        <div>
          <label htmlFor="ob-address" style={LABEL_STYLE}>Mailing Address <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input id="ob-address" type="text" value={address}
            onChange={function(e) { setAddress(e.target.value); }}
            placeholder="123 Main St" style={INPUT_STYLE}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: '8px' }}>
          <div>
            <label htmlFor="ob-city" style={LABEL_STYLE}>City</label>
            <input id="ob-city" type="text" value={city}
              onChange={function(e) { setCity(e.target.value); }}
              placeholder="Toledo" style={INPUT_STYLE}
              onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
            />
          </div>
          <div>
            <label htmlFor="ob-state" style={LABEL_STYLE}>State</label>
            <input id="ob-state" type="text" value={state}
              onChange={function(e) { setState(e.target.value.toUpperCase().slice(0, 2)); }}
              placeholder="OH" maxLength={2} style={INPUT_STYLE}
              onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
            />
          </div>
          <div>
            <label htmlFor="ob-zip" style={LABEL_STYLE}>ZIP</label>
            <input id="ob-zip" type="text" value={zip}
              onChange={function(e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)); }}
              placeholder="43601" maxLength={5} style={INPUT_STYLE}
              onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
            />
          </div>
        </div>
      </div>

      <button onClick={handleNext} disabled={saving}
        style={{ width: '100%', marginTop: '24px', padding: '12px', background: saving ? '#1E2845' : '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '15px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
      >
        {saving ? 'Saving...' : 'Save and Continue'}
      </button>
    </div>
  );
}

// Org Step 2 — Logo, mission, about
function OrgStep2({ org, onNext, onSkip, onUpdate }) {
  var [logoFile, setLogoFile] = useState(null);
  var [logoPreview, setLogoPreview] = useState(org.logo_url || null);
  var [mission, setMission] = useState(org.description || '');
  var [about, setAbout] = useState('');
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
      var logoUrl = org.logo_url || null;
      if (logoFile) {
        var ext = logoFile.name.split('.').pop();
        var path = org.id + '/logo.' + ext;
        var { error: upErr } = await supabase.storage.from('org-assets').upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        var { data: urlData } = supabase.storage.from('org-assets').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }
      var { error } = await supabase.from('organizations').update({
        logo_url: logoUrl,
        description: mission.trim() || null,
        about: about.trim() || null
      }).eq('id', org.id);
      if (error) throw error;
      onUpdate({ logo_url: logoUrl, description: mission.trim(), about: about.trim() });
      mascotSuccessToast('Profile saved!', 'Your logo and mission are looking great.');
      onNext();
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>Your public profile</h2>
      <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>This is what visitors see on your public org page and the discovery board.</p>

      {/* Logo */}
      <div style={{ marginBottom: '20px' }}>
        <label style={LABEL_STYLE}>Organization Logo <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1E2845', border: '2px solid #2A3550', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            }
          </div>
          <div>
            <label htmlFor="ob2-logo" style={{ display: 'inline-block', padding: '8px 16px', background: '#1E2845', border: '1px solid #2A3550', borderRadius: '8px', color: '#CBD5E1', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </label>
            <input id="ob2-logo" type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>PNG, JPG, SVG — square images work best</p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="ob2-mission" style={LABEL_STYLE}>Mission Statement <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <textarea id="ob2-mission" value={mission} onChange={function(e) { setMission(e.target.value); }}
          rows={2} maxLength={280} placeholder="Our mission is to..."
          style={Object.assign({}, INPUT_STYLE, { resize: 'none' })}
          onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
          onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
        />
        <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', textAlign: 'right' }}>{mission.length}/280</p>
      </div>

      {/* About */}
      <div style={{ marginBottom: '24px' }}>
        <label htmlFor="ob2-about" style={LABEL_STYLE}>About <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <textarea id="ob2-about" value={about} onChange={function(e) { setAbout(e.target.value); }}
          rows={4} placeholder="Share your history, programs, and what makes your organization unique..."
          style={Object.assign({}, INPUT_STYLE, { resize: 'none' })}
          onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
          onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onSkip} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #2A3550', color: '#94A3B8', fontWeight: 600, fontSize: '14px', borderRadius: '8px', cursor: 'pointer' }}>
          Skip for now
        </button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', background: saving ? '#1E2845' : '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}

// Org Step 3 — Who you serve + discovery
function OrgStep3({ org, onNext, onSkip, onUpdate }) {
  var [selectedAudience, setSelectedAudience] = useState([]);
  var [selectedCauses, setSelectedCauses] = useState([]);
  var [serviceArea, setServiceArea] = useState('');
  var [showOnDiscover, setShowOnDiscover] = useState(true);
  var [saving, setSaving] = useState(false);

  function toggleItem(list, setList, item) {
    setList(function(prev) {
      return prev.includes(item) ? prev.filter(function(i) { return i !== item; }) : prev.concat([item]);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      var { error } = await supabase.from('organizations').update({
        audience: selectedAudience,
        service_categories: selectedCauses,
        county: serviceArea.trim() || null,
        is_public: showOnDiscover
      }).eq('id', org.id);
      if (error) throw error;
      onUpdate({ audience: selectedAudience, service_categories: selectedCauses, is_public: showOnDiscover });
      onNext();
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  var chipStyle = function(selected) {
    return {
      display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
      borderRadius: '99px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
      border: '1px solid ' + (selected ? '#3B82F6' : '#2A3550'),
      background: selected ? 'rgba(59,130,246,0.15)' : '#1E2845',
      color: selected ? '#93C5FD' : '#94A3B8',
      transition: 'all 0.15s', margin: '3px'
    };
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>Who do you serve?</h2>
      <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '20px' }}>
        This helps community members find your organization on the discovery page.
      </p>

      {/* Service area */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="ob3-area" style={LABEL_STYLE}>Service Area <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(city, county, or region)</span></label>
        <input id="ob3-area" type="text" value={serviceArea}
          onChange={function(e) { setServiceArea(e.target.value); }}
          placeholder="e.g. Lucas County, Toledo metro area, Northwest Ohio"
          style={INPUT_STYLE}
          onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
          onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
        />
      </div>

      {/* Audience */}
      <div style={{ marginBottom: '20px' }}>
        <label style={LABEL_STYLE}>Audience Served <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-3px' }}>
          {AUDIENCE_OPTIONS.map(function(a) {
            var sel = selectedAudience.includes(a);
            return (
              <button key={a} onClick={function() { toggleItem(selectedAudience, setSelectedAudience, a); }}
                style={chipStyle(sel)} aria-pressed={sel} type="button"
              >{a}</button>
            );
          })}
        </div>
      </div>

      {/* Cause areas */}
      <div style={{ marginBottom: '20px' }}>
        <label style={LABEL_STYLE}>Cause Areas <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-3px' }}>
          {CAUSE_OPTIONS.map(function(c) {
            var sel = selectedCauses.includes(c);
            return (
              <button key={c} onClick={function() { toggleItem(selectedCauses, setSelectedCauses, c); }}
                style={chipStyle(sel)} aria-pressed={sel} type="button"
              >{c}</button>
            );
          })}
        </div>
      </div>

      {/* Discovery toggle */}
      <div style={{ background: '#151B2D', border: '1px solid #2A3550', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>Show on Discover Orgs page</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
              Let community members find your organization at syndicade.com/explore. Verified nonprofits also appear on the public discovery board.
            </p>
          </div>
          <button
            onClick={function() { setShowOnDiscover(function(prev) { return !prev; }); }}
            role="switch" aria-checked={showOnDiscover}
            aria-label={showOnDiscover ? 'Hide from discovery' : 'Show on discovery'}
            style={{ flexShrink: 0, width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: showOnDiscover ? '#3B82F6' : '#2A3550', position: 'relative', transition: 'background 0.2s' }}
          >
            <span style={{ position: 'absolute', top: '2px', left: showOnDiscover ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s' }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onSkip} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #2A3550', color: '#94A3B8', fontWeight: 600, fontSize: '14px', borderRadius: '8px', cursor: 'pointer' }}>
          Skip for now
        </button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', background: saving ? '#1E2845' : '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}

// Org Step 4 — Done
function OrgStep4({ org, onDone }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <img src="/mascot-pair.png" alt="" style={{ width: '140px', objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>You're all set!</h2>
      <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '32px', lineHeight: 1.6 }}>
        <strong style={{ color: '#FFFFFF' }}>{org.name}</strong> is ready on Syndicade. Next, we'll give you a quick tour of the key features.
      </p>

      <div style={{ background: '#151B2D', border: '1px solid #2A3550', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '12px' }}>A quick reminder</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Add other admins from the Members tab so you\'re never the only one with access',
            'Use the Invite tab to bring in your team by email',
            'Your org contact email (' + (org.contact_email || 'not set') + ') is separate from your personal login',
          ].map(function(tip, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>{tip}</p>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={onDone}
        style={{ width: '100%', padding: '14px', background: '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
      >
        Take me to my dashboard
      </button>
    </div>
  );
}

// ── MEMBER ONBOARDING ──────────────────────────────────────────────────────────

var MEMBER_TOTAL_STEPS = 3;

function MemberStep1({ userEmail, onNext }) {
  var [firstName, setFirstName] = useState('');
  var [lastName, setLastName] = useState('');
  var [phone, setPhone] = useState('');
  var [bio, setBio] = useState('');
  var [saving, setSaving] = useState(false);

  function formatPhone(val) {
    var digits = val.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return '(' + digits.slice(0,3) + ') ' + digits.slice(3);
    return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6,10);
  }

  async function handleSave() {
    if (!firstName.trim()) { toast.error('First name is required.'); return; }
    setSaving(true);
    try {
      var { data: { user } } = await supabase.auth.getUser();
      var { error } = await supabase.from('members').update({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        onboarding_completed: false
      }).eq('user_id', user.id);
      if (error) throw error;
      onNext();
    } catch (err) {
      toast.error('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src="/mascot-pair.png" alt="" style={{ width: '120px', objectFit: 'contain', margin: '0 auto 12px', display: 'block' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>Welcome to Syndicade!</h2>
        <p style={{ fontSize: '13px', color: '#94A3B8' }}>Let's set up your member profile.</p>
      </div>

      <InfoBox>
        Your login email is <strong style={{ color: '#FFFFFF' }}>{userEmail}</strong>. This is your personal Syndicade account — it stays with you across all the organizations you join.
      </InfoBox>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label htmlFor="m-first" style={LABEL_STYLE}>First Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input id="m-first" type="text" value={firstName}
              onChange={function(e) { setFirstName(e.target.value); }}
              placeholder="Jane" style={INPUT_STYLE} aria-required="true"
              onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
            />
          </div>
          <div>
            <label htmlFor="m-last" style={LABEL_STYLE}>Last Name</label>
            <input id="m-last" type="text" value={lastName}
              onChange={function(e) { setLastName(e.target.value); }}
              placeholder="Smith" style={INPUT_STYLE}
              onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
              onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="m-phone" style={LABEL_STYLE}>Phone <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input id="m-phone" type="tel" value={phone}
            onChange={function(e) { setPhone(formatPhone(e.target.value)); }}
            placeholder="(419) 555-0100" maxLength={14} style={INPUT_STYLE}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>

        <div>
          <label htmlFor="m-bio" style={LABEL_STYLE}>Bio <span style={{ color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <textarea id="m-bio" value={bio}
            onChange={function(e) { setBio(e.target.value); }}
            rows={3} maxLength={300} placeholder="Tell organizations a little about yourself..."
            style={Object.assign({}, INPUT_STYLE, { resize: 'none' })}
            onFocus={function(e) { e.target.style.borderColor = '#3B82F6'; }}
            onBlur={function(e) { e.target.style.borderColor = '#2A3550'; }}
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ width: '100%', marginTop: '24px', padding: '12px', background: saving ? '#1E2845' : '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '15px', borderRadius: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
      >
        {saving ? 'Saving...' : 'Save and Continue'}
      </button>
    </div>
  );
}

function MemberStep2({ onNext, onSkip }) {
  var navigate = useNavigate();
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>Find organizations</h2>
      <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>
        Browse local organizations and request to join, or use an invite link sent to you by an org admin.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={function() { onNext(); navigate('/explore'); }}
          style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}
          onMouseEnter={function(e) { e.currentTarget.style.borderColor = '#3B82F6'; }}
          onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#2A3550'; }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 3px' }}>Browse the Discover page</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Find verified nonprofits and community orgs near you</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>

        <button
          onClick={function() { onNext(); navigate('/dashboard'); }}
          style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '12px', padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}
          onMouseEnter={function(e) { e.currentTarget.style.borderColor = '#22C55E'; }}
          onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#2A3550'; }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 3px' }}>I have an invite link</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Check your email for an invitation from an org admin</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <button onClick={onSkip} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #2A3550', color: '#94A3B8', fontWeight: 600, fontSize: '14px', borderRadius: '8px', cursor: 'pointer' }}>
        I'll find organizations later
      </button>
    </div>
  );
}

function MemberStep3({ onDone }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <img src="/mascot-pair.png" alt="" style={{ width: '140px', objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>Welcome aboard!</h2>
      <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '28px', lineHeight: 1.6 }}>
        Your profile is set up. We'll give you a quick tour of your dashboard so you know where everything is.
      </p>
      <button onClick={onDone}
        style={{ width: '100%', padding: '14px', background: '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
      >
        Take me to my dashboard
      </button>
    </div>
  );
}

// ── GUIDED TOUR MODAL ──────────────────────────────────────────────────────────

var TOUR_CARDS = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Your Overview Board',
    description: 'Your dashboard shows upcoming events and announcements as Post-it notes. Everything your org needs at a glance.'
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Events & Calendar',
    description: 'Create events, manage RSVPs, sell tickets, and let members check in with a QR code. One-time or recurring — your call.'
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5B731" strokeWidth="1.5" aria-hidden="true">
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Announcements',
    description: 'Post updates to your members. Mark them urgent, pin them to the top, and send email notifications automatically.'
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <line x1="23" y1="11" x2="17" y2="11" /><line x1="20" y1="8" x2="20" y2="14" />
      </svg>
    ),
    title: 'Members & Invites',
    description: 'Invite members by email from the Invite tab. Track dues, assign roles, and manage your directory all in one place.'
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
      </svg>
    ),
    title: 'Public Page & Settings',
    description: 'Edit your public org page from the Page Editor. Configure privacy, membership, and discovery settings from the Settings tab.'
  }
];

function GuidedTourModal({ onClose }) {
  var [card, setCard] = useState(0);
  var isLast = card === TOUR_CARDS.length - 1;
  var current = TOUR_CARDS[card];

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Feature tour"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(14,21,35,0.9)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#F5B731', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '24px' }}>
          Quick Tour — {card + 1} of {TOUR_CARDS.length}
        </p>

        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#0E1523', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          {current.icon}
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>{current.title}</h3>
        <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.7, marginBottom: '32px' }}>{current.description}</p>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
          {TOUR_CARDS.map(function(_, i) {
            return (
              <div key={i} style={{ width: i === card ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === card ? '#3B82F6' : '#2A3550', transition: 'all 0.3s' }} aria-hidden="true" />
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2A3550', color: '#64748B', fontWeight: 600, fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}>
            Skip tour
          </button>
          <button
            onClick={function() { isLast ? onClose() : setCard(function(c) { return c + 1; }); }}
            style={{ flex: 2, padding: '11px', background: '#3B82F6', color: '#FFFFFF', fontWeight: 700, fontSize: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            {isLast ? "Let's go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main OnboardingPage ────────────────────────────────────────────────────────

export default function OnboardingPage() {
  var [searchParams] = useSearchParams();
  var accountType = searchParams.get('type') || 'member';
  var navigate = useNavigate();

  var [userEmail, setUserEmail] = useState('');
  var [step, setStep] = useState(1);
  var [org, setOrg] = useState(null);
  var [showTour, setShowTour] = useState(false);

  var totalSteps = accountType === 'org' ? ORG_TOTAL_STEPS : MEMBER_TOTAL_STEPS;

  useEffect(function() {
    supabase.auth.getUser().then(function(result) {
      if (result.data && result.data.user) {
        setUserEmail(result.data.user.email || '');
      }
    });
  }, []);

  function nextStep() { setStep(function(s) { return s + 1; }); }
  function skipStep() { setStep(function(s) { return s + 1; }); }

  function handleOrgUpdate(updates) {
    setOrg(function(prev) { return Object.assign({}, prev, updates); });
  }

  async function handleDone() {
    // Mark member onboarding complete
    var { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('members').update({ onboarding_completed: true }).eq('user_id', user.id);
    }
    setShowTour(true);
  }

  function handleTourClose() {
    setShowTour(false);
    if (accountType === 'org' && org) {
      navigate('/organizations/' + org.id);
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0E1523',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif"
    }}>
      {/* Top bar */}
      <div style={{ background: '#151B2D', borderBottom: '1px solid #2A3550', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>Syndi</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#F5B731' }}>cade</span>
        </a>
        <span style={{ fontSize: '12px', color: '#64748B' }}>
          {accountType === 'org' ? 'Organization Setup' : 'Member Setup'} · Step {step} of {totalSteps}
        </span>
      </div>

      {/* Wizard card */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', minHeight: 'calc(100vh - 57px)' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          {/* Progress */}
          <div style={{ marginBottom: '24px' }}>
            <ProgressBar step={step} total={totalSteps} />
            <div style={{ marginTop: '10px' }}>
              <StepDots step={step} total={totalSteps} />
            </div>
          </div>

          {/* Card */}
          <div style={{ background: '#1A2035', border: '1px solid #2A3550', borderRadius: '16px', padding: '32px' }}>
            {accountType === 'org' && (
              <>
                {step === 1 && <OrgStep1 userEmail={userEmail} onNext={function(data) { setOrg(data.org); nextStep(); }} />}
                {step === 2 && <OrgStep2 org={org} onNext={nextStep} onSkip={skipStep} onUpdate={handleOrgUpdate} />}
                {step === 3 && <OrgStep3 org={org} onNext={nextStep} onSkip={skipStep} onUpdate={handleOrgUpdate} />}
                {step === 4 && <OrgStep4 org={org} onDone={handleDone} />}
              </>
            )}
            {accountType === 'member' && (
              <>
                {step === 1 && <MemberStep1 userEmail={userEmail} onNext={nextStep} />}
                {step === 2 && <MemberStep2 onNext={nextStep} onSkip={skipStep} />}
                {step === 3 && <MemberStep3 onDone={handleDone} />}
              </>
            )}
          </div>
        </div>
      </div>

      {showTour && <GuidedTourModal onClose={handleTourClose} />}
    </div>
  );
}