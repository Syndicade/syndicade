import { useState } from 'react';
import { supabase } from '../lib/supabase';

// ─── Icon ────────────────────────────────────────────────────────────────────
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
  globe:   'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  check:   'M5 13l4 4L19 7',
  chevRight: 'M9 5l7 7-7 7',
  chevLeft:  'M15 19l-7-7 7-7',
  x:       'M6 18L18 6M6 6l12 12',
  photo:   ['M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'],
  sparkle: ['M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'],
  tag:     ['M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z'],
  rocket:  ['M12 19l9 2-9-18-9 18 9-2zm0 0v-8'],
};

var STEPS = [
  { id: 'welcome',    label: 'Welcome'    },
  { id: 'basic',      label: 'Basic Info' },
  { id: 'media',      label: 'Logo & Banner' },
  { id: 'publish',    label: 'Go Live'    },
];

// ─── Main Component ───────────────────────────────────────────────────────────
// Props:
//   organizationId  — string
//   orgData         — { name, description, logo_url, banner_url, tagline, is_published }
//   onComplete(data) — called when wizard finishes; receives updated org data
//   onDismiss()      — called when user skips/closes without completing
function WebsiteSetupWizard({ organizationId, orgData, onComplete, onDismiss }) {
  var [step, setStep] = useState(0);
  var [saving, setSaving] = useState(false);
  var [logoUploading, setLogoUploading] = useState(false);
  var [bannerUploading, setBannerUploading] = useState(false);

  // Form state — pre-fill from orgData if available
  var [form, setForm] = useState({
    name:        (orgData && orgData.name)        || '',
    tagline:     (orgData && orgData.tagline)      || '',
    description: (orgData && orgData.description)  || '',
    logo_url:    (orgData && orgData.logo_url)     || '',
    banner_url:  (orgData && orgData.banner_url)   || '',
    is_published: false,
  });

  function setField(key, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [key]: value }); });
  }

  // Skip for now: just close, wizard reappears next visit
  function dismiss() {
    if (onDismiss) onDismiss();
  }

  // Don't show again: persist to DB
  async function dismissForever() {
    await supabase
      .from('org_site_config')
      .upsert(
        { organization_id: organizationId, setup_wizard_dismissed: true },
        { onConflict: 'organization_id' }
      );
    if (onDismiss) onDismiss();
  }

  // ── Complete wizard ─────────────────────────────────────────────────────────
  async function complete() {
    setSaving(true);
    try {
      // Save org basic info
      var orgUpdate = {
        name: form.name,
        description: form.description,
      };
      if (form.tagline)    orgUpdate.tagline    = form.tagline;
      if (form.logo_url)   orgUpdate.logo_url   = form.logo_url;
      if (form.banner_url) orgUpdate.banner_url = form.banner_url;

      await supabase.from('organizations').update(orgUpdate).eq('id', organizationId);

      // Save publish state + dismiss wizard
      await supabase
        .from('org_site_config')
        .upsert(
          {
            organization_id: organizationId,
            is_published: form.is_published,
            setup_wizard_dismissed: true,
          },
          { onConflict: 'organization_id' }
        );

      if (onComplete) onComplete(form);
    } catch (err) {
      console.error('Wizard save error:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── File upload helpers ──────────────────────────────────────────────────────
  async function uploadFile(file, field, setUploading) {
    setUploading(true);
    try {
      var ext  = file.name.split('.').pop();
      var path = organizationId + '/' + field + '-' + Date.now() + '.' + ext;
      var { error: uploadErr } = await supabase.storage
        .from('organization-images')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      var { data: urlData } = supabase.storage
        .from('organization-images')
        .getPublicUrl(path);

      setField(field, urlData.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  var currentStep = STEPS[step];
  var isLast      = step === STEPS.length - 1;

  // ─── Step content ────────────────────────────────────────────────────────────
  function renderStep() {
    // ── Step 0: Welcome ────────────────────────────────────────────────────────
    if (currentStep.id === 'welcome') {
      return (
        <div className="text-center py-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #1D3461 0%, #1A2035 100%)', border: '1px solid #2A3550' }}
            aria-hidden="true"
          >
            <Icon path={ICONS.globe} className="h-8 w-8" style={{ color: '#F5B731' }} />
          </div>
          <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#FFFFFF' }}>
            Let's build your public page
          </h2>
          <p className="text-base mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: '#94A3B8' }}>
            In just a few steps, you'll have a polished public presence for{' '}
            <span style={{ color: '#F5B731', fontWeight: 700 }}>{orgData && orgData.name ? orgData.name : 'your organization'}</span>.
            It only takes 2 minutes.
          </p>

          {/* Feature bullets */}
          <div className="text-left space-y-3 max-w-xs mx-auto mb-8">
            {[
              ['sparkle', 'Add your name, tagline & description'],
              ['photo',   'Upload a logo and banner image'],
              ['rocket',  'Publish your page with one click'],
            ].map(function(item, i) {
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#1A2035', border: '1px solid #2A3550' }}
                    aria-hidden="true"
                  >
                    <Icon path={ICONS[item[0]]} className="h-3.5 w-3.5" style={{ color: '#F5B731' }} />
                  </div>
                  <span className="text-sm" style={{ color: '#94A3B8' }}>{item[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Step 1: Basic Info ─────────────────────────────────────────────────────
    if (currentStep.id === 'basic') {
      return (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold mb-1" style={{ color: '#FFFFFF' }}>Basic Info</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>This is what visitors will see on your public page.</p>
          </div>

          <div>
            <label htmlFor="wiz-name" className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#F5B731' }}>
              Organization Name <span style={{ color: '#EF4444' }} aria-hidden="true">*</span>
            </label>
            <input
              id="wiz-name"
              type="text"
              value={form.name}
              onChange={function(e) { setField('name', e.target.value); }}
              placeholder="e.g. Toledo Food Bank"
              aria-required="true"
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: '#1A2035', border: '1px solid #2A3550', color: '#FFFFFF' }}
            />
          </div>

          <div>
            <label htmlFor="wiz-tagline" className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#F5B731' }}>
              Tagline
            </label>
            <input
              id="wiz-tagline"
              type="text"
              value={form.tagline}
              onChange={function(e) { setField('tagline', e.target.value); }}
              placeholder="e.g. Fighting hunger in Northwest Ohio"
              maxLength={120}
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: '#1A2035', border: '1px solid #2A3550', color: '#FFFFFF' }}
            />
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>A short, memorable description shown under your name.</p>
          </div>

          <div>
            <label htmlFor="wiz-desc" className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#F5B731' }}>
              About Your Organization
            </label>
            <textarea
              id="wiz-desc"
              value={form.description}
              onChange={function(e) { setField('description', e.target.value); }}
              rows={4}
              placeholder="Tell visitors who you are, what you do, and who you serve..."
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ background: '#1A2035', border: '1px solid #2A3550', color: '#FFFFFF' }}
            />
          </div>
        </div>
      );
    }

    // ── Step 2: Media ──────────────────────────────────────────────────────────
    if (currentStep.id === 'media') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold mb-1" style={{ color: '#FFFFFF' }}>Logo & Banner</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Optional — you can always add these later from Settings.</p>
          </div>

          {/* Logo upload */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731' }}>Logo</p>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Organization logo preview"
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  style={{ border: '1px solid #2A3550' }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#1A2035', border: '2px dashed #2A3550' }}
                  aria-hidden="true"
                >
                  <Icon path={ICONS.photo} className="h-7 w-7" style={{ color: '#64748B' }} />
                </div>
              )}
              <div>
                <label
                  htmlFor="wiz-logo"
                  className={'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 ' +
                    (logoUploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90')}
                  style={{ background: '#1A2035', border: '1px solid #2A3550', color: '#94A3B8' }}
                >
                  <Icon path={ICONS.photo} className="h-4 w-4" />
                  {logoUploading ? 'Uploading...' : (form.logo_url ? 'Change Logo' : 'Upload Logo')}
                  <input
                    id="wiz-logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={logoUploading}
                    onChange={function(e) {
                      if (e.target.files && e.target.files[0]) {
                        uploadFile(e.target.files[0], 'logo_url', setLogoUploading);
                      }
                    }}
                    className="sr-only"
                    aria-label="Upload organization logo"
                  />
                </label>
                <p className="text-xs mt-1" style={{ color: '#64748B' }}>PNG, JPG, WebP · Recommended 400×400px</p>
              </div>
            </div>
          </div>

          {/* Banner upload */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731' }}>Banner Image</p>
            {form.banner_url ? (
              <div className="relative rounded-xl overflow-hidden mb-3" style={{ border: '1px solid #2A3550' }}>
                <img
                  src={form.banner_url}
                  alt="Banner preview"
                  className="w-full h-28 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <label
                    htmlFor="wiz-banner"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: '#1A2035', color: '#FFFFFF', border: '1px solid #2A3550' }}
                  >
                    Change Banner
                    <input
                      id="wiz-banner"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={bannerUploading}
                      onChange={function(e) {
                        if (e.target.files && e.target.files[0]) {
                          uploadFile(e.target.files[0], 'banner_url', setBannerUploading);
                        }
                      }}
                      className="sr-only"
                      aria-label="Change banner image"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor="wiz-banner2"
                className={'flex flex-col items-center justify-center rounded-xl h-28 cursor-pointer transition-colors ' +
                  (bannerUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500')}
                style={{ background: '#1A2035', border: '2px dashed #2A3550' }}
              >
                <Icon path={ICONS.photo} className="h-7 w-7 mb-2" style={{ color: '#64748B' }} />
                <span className="text-sm font-medium" style={{ color: '#64748B' }}>
                  {bannerUploading ? 'Uploading...' : 'Click to upload a banner'}
                </span>
                <span className="text-xs mt-1" style={{ color: '#64748B' }}>1200×400px recommended</span>
                <input
                  id="wiz-banner2"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={bannerUploading}
                  onChange={function(e) {
                    if (e.target.files && e.target.files[0]) {
                      uploadFile(e.target.files[0], 'banner_url', setBannerUploading);
                    }
                  }}
                  className="sr-only"
                  aria-label="Upload banner image"
                />
              </label>
            )}
          </div>
        </div>
      );
    }

    // ── Step 3: Publish ────────────────────────────────────────────────────────
    if (currentStep.id === 'publish') {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold mb-1" style={{ color: '#FFFFFF' }}>Ready to go live?</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              You can publish now or keep your page private while you finish setting it up.
            </p>
          </div>

          {/* Publish toggle card */}
          <button
            onClick={function() { setField('is_published', !form.is_published); }}
            className="w-full text-left rounded-xl p-5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              background: form.is_published ? '#1B3A2F' : '#1A2035',
              border: '2px solid ' + (form.is_published ? '#22C55E' : '#2A3550'),
            }}
            role="switch"
            aria-checked={form.is_published}
            aria-label="Toggle public page visibility"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: form.is_published ? '#22C55E22' : '#1E2845' }}
                  aria-hidden="true"
                >
                  <Icon
                    path={ICONS.globe}
                    className="h-5 w-5"
                    style={{ color: form.is_published ? '#22C55E' : '#64748B' }}
                  />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#FFFFFF' }}>
                    {form.is_published ? 'Page is public' : 'Keep page private for now'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                    {form.is_published
                      ? 'Anyone with the link can view your page'
                      : 'Only you and your team can see it'}
                  </p>
                </div>
              </div>
              {/* Toggle pill */}
              <div
                className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ' +
                  (form.is_published ? 'bg-green-500' : 'bg-gray-600')}
                aria-hidden="true"
              >
                <span
                  className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
                    (form.is_published ? 'translate-x-6' : 'translate-x-1')}
                />
              </div>
            </div>
          </button>

          {/* Summary of what was set up */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: '#1A2035', border: '1px solid #2A3550' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F5B731' }}>Summary</p>
            {[
              ['Name',    form.name || '—'],
              ['Tagline', form.tagline || 'Not set'],
              ['Logo',    form.logo_url ? 'Uploaded' : 'Not set'],
              ['Banner',  form.banner_url ? 'Uploaded' : 'Not set'],
            ].map(function(row) {
              return (
                <div key={row[0]} className="flex items-center justify-between text-sm">
                  <span style={{ color: '#64748B' }}>{row[0]}</span>
                  <span style={{ color: row[1] === 'Not set' || row[1] === '—' ? '#64748B' : '#94A3B8' }}>
                    {row[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0E1523', border: '1px solid #2A3550' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #2A3550', background: '#151B2D' }}
        >
          {/* Wordmark */}
          <span className="text-base font-extrabold tracking-tight" id="wizard-title">
            <span style={{ color: '#FFFFFF' }}>Syndi</span>
            <span style={{ color: '#F5B731' }}>cade</span>
            <span className="ml-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>
              Setup
            </span>
          </span>

          {/* Step dots */}
          <div className="flex items-center gap-1.5" aria-label={'Step ' + (step + 1) + ' of ' + STEPS.length}>
            {STEPS.map(function(s, i) {
              return (
                <div
                  key={s.id}
                  className="rounded-full transition-all"
                  style={{
                    width:  i === step ? '20px' : '6px',
                    height: '6px',
                    background: i < step ? '#22C55E' : i === step ? '#F5B731' : '#2A3550',
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>

          {/* Close / skip */}
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            style={{ color: '#64748B' }}
            onMouseEnter={function(e) { e.currentTarget.style.color = '#94A3B8'; }}
            onMouseLeave={function(e) { e.currentTarget.style.color = '#64748B'; }}
            aria-label="Skip setup wizard"
          >
            <Icon path={ICONS.x} className="h-4 w-4" />
          </button>
        </div>

        {/* ── Step content ── */}
        <div className="px-6 py-6 min-h-64">
          {renderStep()}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid #2A3550', background: '#151B2D' }}
        >
          {/* Back / Skip */}
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <button
                onClick={function() { setStep(function(s) { return s - 1; }); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                style={{ color: '#94A3B8', background: '#1A2035', border: '1px solid #2A3550' }}
              >
                <Icon path={ICONS.chevLeft} className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <button
                  onClick={dismiss}
                  className="text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 rounded px-2 py-1 text-left"
                  style={{ color: '#64748B' }}
                >
                  Skip for now
                </button>
                <button
                  onClick={dismissForever}
                  className="text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 rounded px-2 py-1 text-left"
                  style={{ color: '#475569' }}
                >
                  Don't show again
                </button>
              </div>
            )}
          </div>

          {/* Next / Finish */}
          {isLast ? (
            <button
              onClick={complete}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{
                background: saving ? '#1D3461' : '#3B82F6',
                color: '#FFFFFF',
                focusRingOffset: '#0E1523',
              }}
            >
              {saving ? 'Saving...' : (
                <>
                  <Icon path={ICONS.check} className="h-4 w-4" />
                  Finish Setup
                </>
              )}
            </button>
          ) : (
            <button
              onClick={function() { setStep(function(s) { return s + 1; }); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: '#3B82F6', color: '#FFFFFF' }}
            >
              {step === 0 ? "Let's go" : 'Continue'}
              <Icon path={ICONS.chevRight} className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebsiteSetupWizard;