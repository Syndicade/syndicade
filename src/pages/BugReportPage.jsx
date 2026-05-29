import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { AlertCircle, Lightbulb, ChevronDown, Upload, X, Image } from 'lucide-react';

var APP_AREAS = [
  'Dashboard',
  'Events',
  'Announcements',
  'Member Directory',
  'Groups',
  'Documents',
  'Community Board',
  'Organization Settings',
  'Email Blasts',
  'Newsletters',
  'Chat',
  'Programs',
  'Polls & Surveys',
  'Signup Forms',
  'Analytics',
  'Notifications',
  'Billing & Plans',
  'Public Org Page',
  'Other',
];

var SEVERITY_OPTIONS = [
  { value: 'low',      label: 'Low',      desc: 'Minor visual or cosmetic issue' },
  { value: 'medium',   label: 'Medium',   desc: 'Feature works but behaves unexpectedly' },
  { value: 'high',     label: 'High',     desc: 'Feature is broken or unusable' },
  { value: 'critical', label: 'Critical', desc: 'Data loss, security issue, or full outage' },
];

var SEVERITY_COLORS = {
  low:      { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  medium:   { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
  high:     { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' },
  critical: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

var MAX_DESC_LENGTH = 2000;

export default function BugReportPage() {
  var [type, setType] = useState('bug');
  var [title, setTitle] = useState('');
  var [description, setDescription] = useState('');
  var [steps, setSteps] = useState('');
  var [severity, setSeverity] = useState('medium');
  var [appArea, setAppArea] = useState('');
  var [otherArea, setOtherArea] = useState('');
  var [email, setEmail] = useState('');
  var [screenshot, setScreenshot] = useState(null);
  var [screenshotPreview, setScreenshotPreview] = useState(null);
  var [screenshotError, setScreenshotError] = useState('');
  var [submitting, setSubmitting] = useState(false);
  var [submitted, setSubmitted] = useState(false);
  var [errors, setErrors] = useState({});
  var [userId, setUserId] = useState(null);
  var fileInputRef = useRef(null);

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      if (res.data && res.data.session && res.data.session.user) {
        setUserId(res.data.session.user.id);
        setEmail(res.data.session.user.email || '');
      }
    });
  }, []);

  function handleScreenshotChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError('Screenshot must be under 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Only image files are allowed.');
      return;
    }
    setScreenshotError('');
    setScreenshot(file);
    var reader = new FileReader();
    reader.onload = function(ev) { setScreenshotPreview(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function handleScreenshotDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      var fakeEvent = { target: { files: [file] } };
      handleScreenshotChange(fakeEvent);
    }
  }

  function removeScreenshot() {
    setScreenshot(null);
    setScreenshotPreview(null);
    setScreenshotError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    var errs = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!description.trim()) errs.description = 'Description is required.';
    if (!appArea) errs.appArea = 'Please select an area of the app.';
    if (appArea === 'Other' && !otherArea.trim()) errs.otherArea = 'Please describe the area.';
    if (type === 'bug' && !severity) errs.severity = 'Please select a severity level.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      var firstKey = Object.keys(errs)[0];
      var el = document.getElementById('field-' + firstKey);
      if (el) el.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);

    var toastId = toast.loading('Submitting your report...');

    // Upload screenshot if present
    var screenshotUrl = null;
    if (screenshot) {
      var ext = screenshot.name.split('.').pop();
      var filename = 'report-' + Date.now() + '.' + ext;
      var { data: uploadData, error: uploadError } = await supabase.storage
        .from('bug-report-screenshots')
        .upload(filename, screenshot, { contentType: screenshot.type, upsert: false });
      if (uploadError) {
        toast.dismiss(toastId);
        setSubmitting(false);
        mascotErrorToast('Screenshot upload failed.', 'Try removing the screenshot and resubmitting.');
        return;
      }
      var { data: urlData } = supabase.storage.from('bug-report-screenshots').getPublicUrl(uploadData.path);
      screenshotUrl = urlData.publicUrl;
    }

    var finalArea = appArea === 'Other' ? ('Other: ' + otherArea.trim()) : appArea;

    var payload = {
      type: type,
      title: title.trim(),
      description: description.trim(),
      steps_to_reproduce: type === 'bug' ? (steps.trim() || null) : null,
      severity: type === 'bug' ? severity : null,
      app_area: finalArea,
      other_area: appArea === 'Other' ? otherArea.trim() : null,
      reporter_email: email.trim() || null,
      reporter_user_id: userId || null,
      screenshot_url: screenshotUrl,
      user_agent: navigator.userAgent,
      reported_url: window.location.href,
      status: 'new',
    };

    var { error } = await supabase.from('bug_reports').insert([payload]);

    toast.dismiss(toastId);
    setSubmitting(false);

    if (error) {
      mascotErrorToast('Failed to submit report.', 'Check your connection and try again.');
      return;
    }

// Fire email alert — non-blocking, don't fail the submission if this errors
    supabase.functions.invoke('send-transactional', {
      body: {
        type: 'bug_report_submitted',
        data: {
          reportType: type,
          title: title.trim(),
          description: description.trim(),
          stepsToReproduce: type === 'bug' ? (steps.trim() || null) : null,
          severity: type === 'bug' ? severity : null,
          appArea: finalArea,
          reporterEmail: email.trim() || null,
          screenshotUrl: screenshotUrl,
          reportedUrl: window.location.href,
          userAgent: navigator.userAgent,
        },
      },
    }).catch(function(err) { console.error('Alert email failed:', err); });

    mascotSuccessToast('Report submitted!', 'Thanks for helping improve Syndicade.');
    setSubmitted(true);
  }

  function handleReset() {
    setType('bug');
    setTitle('');
    setDescription('');
    setSteps('');
    setSeverity('medium');
    setAppArea('');
    setOtherArea('');
    setEmail(email);
    setScreenshot(null);
    setScreenshotPreview(null);
    setScreenshotError('');
    setErrors({});
    setSubmitted(false);
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="bg-[#F8FAFC] min-h-screen" aria-label="Bug report submitted">
        <div style={{maxWidth:'520px',margin:'0 auto',padding:'80px 24px',textAlign:'center'}}>
          <img
            src="/mascot-onboarding.png"
            alt=""
            aria-hidden="true"
            style={{maxWidth:'220px',margin:'0 auto 32px',display:'block',mixBlendMode:'multiply'}}
          />
          <h1 style={{fontSize:'28px',fontWeight:800,color:'#0E1523',marginBottom:'12px'}}>
            Report received!
          </h1>
          <p style={{fontSize:'16px',color:'#475569',marginBottom:'32px',lineHeight:1.6}}>
            Thanks for taking the time to help us improve Syndicade. We review every submission.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit another report
          </button>
        </div>
      </main>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <main className="bg-[#F8FAFC] min-h-screen" aria-label="Submit a bug report or suggestion">

      {/* Page header */}
      <div style={{padding:'24px 24px 0'}}>
        <div style={{maxWidth:'680px',margin:'0 auto'}}>
          <p style={{fontSize:'11px',fontWeight:700,color:'#F5B731',letterSpacing:'4px',textTransform:'uppercase',marginBottom:'8px'}}>
            Beta Feedback
          </p>
          <h1 style={{fontSize:'30px',fontWeight:800,color:'#0E1523',margin:'0 0 4px'}}>
            Report a Bug or Share an Idea
          </h1>
          <p style={{fontSize:'16px',color:'#475569',margin:'0 0 32px'}}>
            Found something broken? Have a suggestion? We want to know.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div style={{maxWidth:'680px',margin:'0 auto',padding:'0 24px 64px'}}>
        <div className="bg-white border border-slate-200 rounded-xl p-6">

          <form onSubmit={handleSubmit} noValidate>

            {/* Type toggle */}
            <fieldset style={{marginBottom:'28px',border:'none',padding:0}}>
              <legend style={{fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'10px'}}>
                What are you submitting?
              </legend>
              <div style={{display:'flex',gap:'12px'}}>
                <label style={{flex:1,display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',borderRadius:'8px',border: type === 'bug' ? '2px solid #3B82F6' : '1px solid #E2E8F0',background: type === 'bug' ? '#EFF6FF' : '#FFFFFF',cursor:'pointer'}}>
                  <input type="radio" name="report-type" value="bug" checked={type === 'bug'} onChange={function() { setType('bug'); setErrors({}); }} className="focus:ring-2 focus:ring-blue-500" style={{accentColor:'#3B82F6'}} />
                  <AlertCircle size={16} color={type === 'bug' ? '#3B82F6' : '#64748B'} aria-hidden="true" />
                  <span style={{fontSize:'14px',fontWeight:600,color: type === 'bug' ? '#1D4ED8' : '#475569'}}>Bug Report</span>
                </label>
                <label style={{flex:1,display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',borderRadius:'8px',border: type === 'suggestion' ? '2px solid #3B82F6' : '1px solid #E2E8F0',background: type === 'suggestion' ? '#EFF6FF' : '#FFFFFF',cursor:'pointer'}}>
                  <input type="radio" name="report-type" value="suggestion" checked={type === 'suggestion'} onChange={function() { setType('suggestion'); setErrors({}); }} className="focus:ring-2 focus:ring-blue-500" style={{accentColor:'#3B82F6'}} />
                  <Lightbulb size={16} color={type === 'suggestion' ? '#3B82F6' : '#64748B'} aria-hidden="true" />
                  <span style={{fontSize:'14px',fontWeight:600,color: type === 'suggestion' ? '#1D4ED8' : '#475569'}}>Suggestion</span>
                </label>
              </div>
            </fieldset>

            {/* Title */}
            <div style={{marginBottom:'20px'}}>
              <label htmlFor="field-title" style={{display:'block',fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'6px'}}>
                Title <span aria-hidden="true" style={{color:'#EF4444'}}>*</span>
              </label>
              <input
                id="field-title"
                type="text"
                value={title}
                onChange={function(e) { setTitle(e.target.value); }}
                placeholder={type === 'bug' ? 'e.g. Save button not working on Events page' : 'e.g. Add export to CSV for member list'}
                aria-required="true"
                aria-describedby={errors.title ? 'error-title' : undefined}
                aria-invalid={!!errors.title}
                style={{width:'100%',padding:'10px 12px',fontSize:'15px',color:'#0E1523',border: errors.title ? '1px solid #EF4444' : '1px solid #E2E8F0',borderRadius:'8px',outline:'none',boxSizing:'border-box',background:'#FFFFFF'}}
                onFocus={function(e) { e.target.style.borderColor='#3B82F6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={function(e) { e.target.style.borderColor=errors.title?'#EF4444':'#E2E8F0'; e.target.style.boxShadow='none'; }}
              />
              {errors.title && <p id="error-title" role="alert" style={{fontSize:'13px',color:'#EF4444',marginTop:'4px'}}>{errors.title}</p>}
            </div>

            {/* App area */}
            <div style={{marginBottom:'20px'}}>
              <label htmlFor="field-appArea" style={{display:'block',fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'6px'}}>
                Where in the app? <span aria-hidden="true" style={{color:'#EF4444'}}>*</span>
              </label>
              <div style={{position:'relative'}}>
                <select
                  id="field-appArea"
                  value={appArea}
                  onChange={function(e) { setAppArea(e.target.value); setOtherArea(''); }}
                  aria-required="true"
                  aria-describedby={errors.appArea ? 'error-appArea' : undefined}
                  aria-invalid={!!errors.appArea}
                  style={{width:'100%',padding:'10px 36px 10px 12px',fontSize:'15px',color: appArea ? '#0E1523' : '#94A3B8',border: errors.appArea ? '1px solid #EF4444' : '1px solid #E2E8F0',borderRadius:'8px',outline:'none',appearance:'none',background:'#FFFFFF',cursor:'pointer',boxSizing:'border-box'}}
                >
                  <option value="">Select an area...</option>
                  {APP_AREAS.map(function(area) {
                    return <option key={area} value={area}>{area}</option>;
                  })}
                </select>
                <ChevronDown size={16} color="#64748B" aria-hidden="true" style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
              </div>
              {errors.appArea && <p id="error-appArea" role="alert" style={{fontSize:'13px',color:'#EF4444',marginTop:'4px'}}>{errors.appArea}</p>}
            </div>

            {/* Other area text field */}
            {appArea === 'Other' && (
              <div style={{marginBottom:'20px'}}>
                <label htmlFor="field-otherArea" style={{display:'block',fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'6px'}}>
                  Describe the area <span aria-hidden="true" style={{color:'#EF4444'}}>*</span>
                </label>
                <input
                  id="field-otherArea"
                  type="text"
                  value={otherArea}
                  onChange={function(e) { setOtherArea(e.target.value); }}
                  placeholder="e.g. Onboarding flow, Mobile view, Print view..."
                  aria-required="true"
                  aria-describedby={errors.otherArea ? 'error-otherArea' : undefined}
                  aria-invalid={!!errors.otherArea}
                  style={{width:'100%',padding:'10px 12px',fontSize:'15px',color:'#0E1523',border: errors.otherArea ? '1px solid #EF4444' : '1px solid #E2E8F0',borderRadius:'8px',outline:'none',boxSizing:'border-box',background:'#FFFFFF'}}
                  onFocus={function(e) { e.target.style.borderColor='#3B82F6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={function(e) { e.target.style.borderColor=errors.otherArea?'#EF4444':'#E2E8F0'; e.target.style.boxShadow='none'; }}
                />
                {errors.otherArea && <p id="error-otherArea" role="alert" style={{fontSize:'13px',color:'#EF4444',marginTop:'4px'}}>{errors.otherArea}</p>}
              </div>
            )}

            {/* Severity — bugs only */}
            {type === 'bug' && (
              <fieldset style={{marginBottom:'20px',border:'none',padding:0}}>
                <legend style={{fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'10px'}}>
                  Severity <span aria-hidden="true" style={{color:'#EF4444'}}>*</span>
                </legend>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  {SEVERITY_OPTIONS.map(function(opt) {
                    var active = severity === opt.value;
                    var colors = SEVERITY_COLORS[opt.value];
                    return (
                      <label key={opt.value} style={{display:'block',padding:'10px 12px',borderRadius:'8px',border: active ? ('2px solid ' + colors.border) : '1px solid #E2E8F0',background: active ? colors.bg : '#FFFFFF',cursor:'pointer'}}>
                        <input type="radio" name="severity" value={opt.value} checked={active} onChange={function() { setSeverity(opt.value); }} className="sr-only" />
                        <span style={{display:'block',fontSize:'13px',fontWeight:700,color: active ? colors.text : '#475569'}}>{opt.label}</span>
                        <span style={{display:'block',fontSize:'12px',color: active ? colors.text : '#64748B',opacity: active ? 0.85 : 1,marginTop:'2px'}}>{opt.desc}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Description */}
            <div style={{marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'6px'}}>
                <label htmlFor="field-description" style={{fontSize:'14px',fontWeight:600,color:'#0E1523'}}>
                  {type === 'bug' ? 'What happened?' : 'Describe your idea'} <span aria-hidden="true" style={{color:'#EF4444'}}>*</span>
                </label>
                <span style={{fontSize:'12px',color: description.length > MAX_DESC_LENGTH * 0.9 ? '#EF4444' : '#94A3B8'}} aria-live="polite">
                  {description.length}/{MAX_DESC_LENGTH}
                </span>
              </div>
              <textarea
                id="field-description"
                value={description}
                onChange={function(e) { if (e.target.value.length <= MAX_DESC_LENGTH) setDescription(e.target.value); }}
                rows={4}
                placeholder={type === 'bug' ? 'Describe what happened and what you expected instead.' : 'Describe the feature or improvement and the problem it would solve.'}
                aria-required="true"
                aria-describedby={errors.description ? 'error-description' : undefined}
                aria-invalid={!!errors.description}
                style={{width:'100%',padding:'10px 12px',fontSize:'15px',color:'#0E1523',border: errors.description ? '1px solid #EF4444' : '1px solid #E2E8F0',borderRadius:'8px',outline:'none',resize:'vertical',lineHeight:1.6,boxSizing:'border-box',fontFamily:'inherit',background:'#FFFFFF'}}
                onFocus={function(e) { e.target.style.borderColor='#3B82F6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={function(e) { e.target.style.borderColor=errors.description?'#EF4444':'#E2E8F0'; e.target.style.boxShadow='none'; }}
              />
              {errors.description && <p id="error-description" role="alert" style={{fontSize:'13px',color:'#EF4444',marginTop:'4px'}}>{errors.description}</p>}
            </div>

            {/* Steps to reproduce — bugs only */}
            {type === 'bug' && (
              <div style={{marginBottom:'20px'}}>
                <label htmlFor="field-steps" style={{display:'block',fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'4px'}}>
                  Steps to reproduce
                </label>
                <p style={{fontSize:'13px',color:'#64748B',marginBottom:'6px'}}>Optional but very helpful. One step per line.</p>
                <textarea
                  id="field-steps"
                  value={steps}
                  onChange={function(e) { setSteps(e.target.value); }}
                  rows={4}
                  placeholder={'1. Go to Events page\n2. Click Create Event\n3. Fill in the form and click Save\n4. Nothing happens'}
                  style={{width:'100%',padding:'10px 12px',fontSize:'14px',color:'#0E1523',border:'1px solid #E2E8F0',borderRadius:'8px',outline:'none',resize:'vertical',lineHeight:1.6,boxSizing:'border-box',fontFamily:'inherit',background:'#FFFFFF'}}
                  onFocus={function(e) { e.target.style.borderColor='#3B82F6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={function(e) { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
                />
              </div>
            )}

            {/* Screenshot upload */}
            <div style={{marginBottom:'20px'}}>
              <label style={{display:'block',fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'4px'}}>
                Screenshot
              </label>
              <p style={{fontSize:'13px',color:'#64748B',marginBottom:'8px'}}>Optional. PNG, JPG, or WebP. Max 5MB.</p>

              {!screenshotPreview ? (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload a screenshot. Click or drag and drop an image."
                  onClick={function() { fileInputRef.current && fileInputRef.current.click(); }}
                  onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current && fileInputRef.current.click(); } }}
                  onDragOver={function(e) { e.preventDefault(); e.currentTarget.style.borderColor='#3B82F6'; e.currentTarget.style.background='#EFF6FF'; }}
                  onDragLeave={function(e) { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.background='#FAFAFA'; }}
                  onDrop={function(e) { e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.background='#FAFAFA'; handleScreenshotDrop(e); }}
                  style={{border:'2px dashed #E2E8F0',borderRadius:'8px',padding:'24px',textAlign:'center',cursor:'pointer',background:'#FAFAFA',transition:'all 0.15s'}}
                >
                  <Image size={28} color="#94A3B8" aria-hidden="true" style={{margin:'0 auto 8px',display:'block'}} />
                  <p style={{fontSize:'14px',color:'#475569',margin:'0 0 4px'}}>
                    <span style={{color:'#3B82F6',fontWeight:600}}>Click to upload</span> or drag and drop
                  </p>
                  <p style={{fontSize:'12px',color:'#94A3B8',margin:0}}>PNG, JPG, WebP up to 5MB</p>
                </div>
              ) : (
                <div style={{position:'relative',display:'inline-block',width:'100%'}}>
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    style={{width:'100%',maxHeight:'240px',objectFit:'contain',borderRadius:'8px',border:'1px solid #E2E8F0',background:'#F8FAFC'}}
                  />
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    aria-label="Remove screenshot"
                    style={{position:'absolute',top:'8px',right:'8px',background:'#0E1523',border:'none',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:0.85}}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <X size={14} color="#FFFFFF" aria-hidden="true" />
                  </button>
                  <p style={{fontSize:'12px',color:'#64748B',marginTop:'6px'}}>{screenshot && screenshot.name}</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              />
              {screenshotError && <p role="alert" style={{fontSize:'13px',color:'#EF4444',marginTop:'6px'}}>{screenshotError}</p>}
            </div>

            {/* Email */}
            <div style={{marginBottom:'28px'}}>
              <label htmlFor="field-email" style={{display:'block',fontSize:'14px',fontWeight:600,color:'#0E1523',marginBottom:'4px'}}>
                Your email
              </label>
              <p style={{fontSize:'13px',color:'#64748B',marginBottom:'6px'}}>Optional. We'll only contact you if we need more info.</p>
              <input
                id="field-email"
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                placeholder="you@example.com"
                style={{width:'100%',padding:'10px 12px',fontSize:'15px',color:'#0E1523',border:'1px solid #E2E8F0',borderRadius:'8px',outline:'none',boxSizing:'border-box',background:'#FFFFFF'}}
                onFocus={function(e) { e.target.style.borderColor='#3B82F6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={function(e) { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className={'px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' + (submitting ? 'opacity-60 cursor-not-allowed' : '')}
              style={{width:'100%',fontSize:'15px'}}
              aria-disabled={submitting}
            >
              {submitting ? 'Submitting...' : (type === 'bug' ? 'Submit Bug Report' : 'Submit Suggestion')}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}