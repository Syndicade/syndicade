import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { mascotSuccessToast, mascotErrorToast } from './MascotToast'
import NonprofitVerificationForm from './NonprofitVerificationForm'
import { getOrgTagSets } from '../lib/platformTags'

function generateSlug(name) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 50)
}

function IconX() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function IconCheck() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
}
function IconChevronRight() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
}
function IconImage() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
}

var TOTAL_STEPS = 5

var ORG_TYPES = [
  { value: 'nonprofit_501c3', label: 'Nonprofit — 501(c)(3)' },
  { value: 'nonprofit_other', label: 'Nonprofit — Other' },
  { value: 'faith',           label: 'Religious / Faith Organization' },
  { value: 'club',            label: 'Club or Social Group' },
  { value: 'association',     label: 'Professional Association' },
  { value: 'community',       label: 'Community / Civic Group' },
  { value: 'hoa',             label: 'HOA / Neighborhood Association' },
  { value: 'school',          label: 'School or Student Group' },
  { value: 'sports',          label: 'Sports & Recreation' },
  { value: 'pta',             label: 'Parent Group / PTA' },
  { value: 'union',           label: 'Union or Labor Organization' },
]

var PLANS = [
  {
    key: 'starter', name: 'Starter', monthly: 29.99, annual: 299.90, annualPerMonth: 24.99,
    members: 50, storage: '2 GB', color: '#3B82F6',
    features: ['Up to 50 members','Events, RSVP & check-in','Announcements & documents','Polls, surveys & sign-up forms','Chat & notifications','Free events only','1 scrollable public page','orgname.syndicade.com subdomain'],
  },
  {
    key: 'growth', name: 'Growth', monthly: 49.99, annual: 499.90, annualPerMonth: 41.66,
    members: 150, storage: '10 GB', color: '#F5B731', popular: true,
    features: ['Up to 150 members','Everything in Starter','Paid event tickets ($1/ticket fee)','Membership dues collection','Email blasts & newsletter builder','Full analytics & revenue reports','7 public pages','Custom domain add-on ($50/yr)'],
  },
  {
    key: 'pro', name: 'Pro', monthly: 69.99, annual: 699.90, annualPerMonth: 58.32,
    members: 300, storage: '30 GB', color: '#8B5CF6',
    features: ['Up to 300 members','Everything in Growth','Unlimited pages','Custom domain — included','Remove Syndicade branding','AI content assistant','Unlimited email blasts','1 free featured event/year'],
  },
  {
    key: 'student', name: 'Student', monthly: 19.99, annual: null, annualPerMonth: null,
    members: 50, storage: '2 GB', color: '#22C55E',
    features: ['Same features as Starter','Monthly billing only','Pause up to 6 months/year','Verified .edu email required'],
    monthlyOnly: true,
  },
]

var inputStyle = {
  width: '100%', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0',
  borderRadius: '8px', color: '#0E1523', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
}
var labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#0E1523',
  textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '6px',
}
var optStyle = { color: '#94A3B8', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }
var hintStyle = { fontSize: '11px', color: '#64748B', marginTop: '4px' }

function focusIn(e) { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }
function focusOut(e) { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }

function btnPrimary(disabled) {
  return {
    flex:1, padding:'12px', background:disabled?'#E2E8F0':'#3B82F6', color:disabled?'#94A3B8':'#FFFFFF',
    border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:700,
    cursor:disabled?'not-allowed':'pointer', display:'flex', alignItems:'center',
    justifyContent:'center', gap:'8px', transition:'background 0.15s',
  }
}
function btnBack() {
  return {
    padding:'12px 20px', background:'#FFFFFF', color:'#475569',
    border:'1px solid #E2E8F0', borderRadius:'10px', fontSize:'14px',
    fontWeight:600, cursor:'pointer',
  }
}

function ProgressBar({ step }) {
  var pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100
  return (
    <div style={{width:'100%',height:'3px',background:'#E2E8F0',borderRadius:'2px',overflow:'hidden'}}>
      <div style={{height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#3B82F6,#8B5CF6)',width:pct+'%',transition:'width 0.35s ease'}} />
    </div>
  )
}

function StepDots({ step }) {
  var labels = ['Basics','Contact','Brand','Plan','Verify']
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'10px'}} role="list" aria-label="Setup progress">
      {Array.from({length:TOTAL_STEPS}).map(function(_,i) {
        var isActive = i+1===step; var isDone = i+1<step
        return (
          <div key={i} role="listitem" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}} aria-label={labels[i]+(isDone?' — complete':isActive?' — current':'')}>
            <div style={{width:isActive?'24px':'8px',height:'8px',borderRadius:'4px',background:isDone?'#22C55E':isActive?'#3B82F6':'#E2E8F0',transition:'all 0.3s ease'}} aria-hidden="true" />
            {isActive && <span style={{fontSize:'10px',fontWeight:600,color:'#3B82F6'}}>{labels[i]}</span>}
          </div>
        )
      })}
    </div>
  )
}

function PillInput({ label, id, values, onChange, placeholder, maxItems, hint }) {
  var [inputVal, setInputVal] = useState('')
  function addTag(raw) {
    var tag = raw.trim(); if (!tag) return
    if (maxItems && values.length >= maxItems) { toast.error('Maximum '+maxItems+' items reached.'); return }
    if (!values.includes(tag)) onChange([...values, tag]); setInputVal('')
  }
  function handleKey(e) {
    if (e.key==='Enter'||e.key===',') { e.preventDefault(); addTag(inputVal.replace(',','')) }
    else if (e.key==='Backspace'&&!inputVal&&values.length>0) onChange(values.slice(0,-1))
  }
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}{maxItems&&<span style={optStyle}> (max {maxItems})</span>}</label>
      <div style={{display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center',padding:'8px 10px',background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:'8px',minHeight:'44px',cursor:'text'}} onClick={function(){document.getElementById(id)&&document.getElementById(id).focus()}}>
        {values.map(function(tag){return(
          <span key={tag} style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'3px 9px',background:'#DBEAFE',border:'1px solid #BFDBFE',borderRadius:'99px',fontSize:'12px',fontWeight:600,color:'#1D4ED8'}}>
            {tag}
            <button type="button" onClick={function(e){e.stopPropagation();onChange(values.filter(function(v){return v!==tag}))}} aria-label={'Remove '+tag} style={{background:'none',border:'none',cursor:'pointer',padding:0,color:'#93C5FD',display:'flex',alignItems:'center',lineHeight:1}} className="focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
        )})}
        <input id={id} type="text" value={inputVal} onChange={function(e){setInputVal(e.target.value)}} onKeyDown={handleKey} onBlur={function(){if(inputVal.trim())addTag(inputVal)}} placeholder={values.length===0?placeholder:''} style={{flex:1,minWidth:'100px',background:'transparent',border:'none',outline:'none',color:'#0E1523',fontSize:'13px',fontFamily:'inherit'}} aria-label={label+' — type and press Enter to add'} disabled={!!(maxItems&&values.length>=maxItems)} />
      </div>
      {hint&&<p style={hintStyle}>{hint}</p>}
    </div>
  )
}

// ─── STEP 1 — Basics (no DB write) ───────────────────────────────────────────
function Step1({ data, onChange, onNext }) {
  var slugPreview = data.name.trim().length>=3 ? generateSlug(data.name) : ''
  var disabled = data.name.trim().length < 3
  function handleNext() {
    if (data.name.trim().length < 3) { toast.error('Name must be at least 3 characters.'); return }
    onNext()
  }
  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#3B82F6',marginBottom:'4px'}}>Step 1 of 5</p>
        <h2 style={{fontSize:'22px',fontWeight:800,color:'#0E1523',marginBottom:'6px'}}>The Basics</h2>
        <p style={{fontSize:'14px',color:'#475569'}}>Tell us about your organization. You can update everything later.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
        <div>
          <label htmlFor="co-name" style={labelStyle}>Organization Name <span style={{color:'#EF4444'}}>*</span></label>
          <input id="co-name" type="text" value={data.name} onChange={function(e){onChange('name',e.target.value)}} placeholder="e.g., Toledo Neighborhood Coalition" maxLength={100} style={inputStyle} onFocus={focusIn} onBlur={focusOut} aria-required="true" aria-describedby="co-name-hint" />
          <p id="co-name-hint" style={hintStyle}>{data.name.length}/100{slugPreview&&' · syndicade.com/org/'+slugPreview}</p>
        </div>
        <div>
          <label htmlFor="co-type" style={labelStyle}>Organization Type <span style={{color:'#EF4444'}}>*</span></label>
          <select id="co-type" value={data.type} onChange={function(e){onChange('type',e.target.value)}} style={Object.assign({},inputStyle,{cursor:'pointer'})} onFocus={focusIn} onBlur={focusOut} aria-required="true">
            {ORG_TYPES.map(function(t){return <option key={t.value} value={t.value}>{t.label}</option>})}
          </select>
        </div>
        <div>
          <label htmlFor="co-mission" style={labelStyle}>Mission / Description <span style={optStyle}>(optional)</span></label>
          <textarea id="co-mission" value={data.description} onChange={function(e){onChange('description',e.target.value)}} placeholder="What does your organization do? Who do you serve?" rows={3} maxLength={500} style={Object.assign({},inputStyle,{resize:'none'})} onFocus={focusIn} onBlur={focusOut} aria-describedby="co-mission-hint" />
          <p id="co-mission-hint" style={{...hintStyle,textAlign:'right'}}>{data.description.length}/500</p>
        </div>
        <div>
          <label htmlFor="co-website" style={labelStyle}>Website <span style={optStyle}>(optional)</span></label>
          <input id="co-website" type="url" value={data.website} onChange={function(e){onChange('website',e.target.value)}} placeholder="https://yourorg.org" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
      </div>
      <button type="button" onClick={handleNext} disabled={disabled} style={Object.assign({},btnPrimary(disabled),{marginTop:'28px',width:'100%'})} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Continue <IconChevronRight />
      </button>
    </div>
  )
}

// ─── STEP 2 — Contact (no DB write) ──────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack }) {
  var disabled = !data.contact_email.trim()
  function handleNext() {
    if (!data.contact_email.trim()) { toast.error('Contact email is required.'); return }
    onNext()
  }
  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#3B82F6',marginBottom:'4px'}}>Step 2 of 5</p>
        <h2 style={{fontSize:'22px',fontWeight:800,color:'#0E1523',marginBottom:'6px'}}>Contact & Location</h2>
        <p style={{fontSize:'14px',color:'#475569'}}>How can people reach you? This appears on your public page.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
        <div>
          <label htmlFor="co-email" style={labelStyle}>Contact Email <span style={{color:'#EF4444'}}>*</span></label>
          <input id="co-email" type="email" value={data.contact_email} onChange={function(e){onChange('contact_email',e.target.value)}} placeholder="info@yourorg.org" style={inputStyle} onFocus={focusIn} onBlur={focusOut} aria-required="true" />
        </div>
        <div>
          <label htmlFor="co-phone" style={labelStyle}>Phone Number <span style={optStyle}>(optional)</span></label>
          <input id="co-phone" type="tel" value={data.contact_phone} onChange={function(e){onChange('contact_phone',e.target.value)}} placeholder="(419) 555-0100" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div>
          <label htmlFor="co-address" style={labelStyle}>Street Address <span style={optStyle}>(optional)</span></label>
          <input id="co-address" type="text" value={data.address} onChange={function(e){onChange('address',e.target.value)}} placeholder="123 Main St" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div>
            <label htmlFor="co-city" style={labelStyle}>City</label>
            <input id="co-city" type="text" value={data.city} onChange={function(e){onChange('city',e.target.value)}} placeholder="Toledo" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
          <div>
            <label htmlFor="co-state" style={labelStyle}>State</label>
            <input id="co-state" type="text" value={data.state} onChange={function(e){onChange('state',e.target.value)}} placeholder="OH" maxLength={2} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
        </div>
        <div style={{maxWidth:'160px'}}>
          <label htmlFor="co-zip" style={labelStyle}>ZIP Code</label>
          <input id="co-zip" type="text" value={data.zip_code} onChange={function(e){onChange('zip_code',e.target.value)}} placeholder="43601" maxLength={10} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
      </div>
      <div style={{display:'flex',gap:'12px',marginTop:'28px'}}>
        <button type="button" onClick={onBack} style={btnBack()} className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Back</button>
        <button type="button" onClick={handleNext} disabled={disabled} style={btnPrimary(disabled)} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Continue <IconChevronRight />
        </button>
      </div>
    </div>
  )
}

// ─── STEP 3 — Brand & Discovery (no DB write) ─────────────────────────────────
function Step3({ data, onChange, onNext, onBack, tagSets }) {
  var fileInputRef = useRef(null)
  var causeAreaTags = tagSets.causeAreas
  var audienceTags  = tagSets.audience
  var languageTags  = tagSets.languages

  function handleLogoChange(e) {
    var f = e.target.files[0]; if (!f) return
    // Store file object in data for Step 4 to upload, preview URL for display
    onChange('logo_file', f)
    onChange('logo_preview', URL.createObjectURL(f))
  }

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#3B82F6',marginBottom:'4px'}}>Step 3 of 5</p>
        <h2 style={{fontSize:'22px',fontWeight:800,color:'#0E1523',marginBottom:'6px'}}>Brand & Discovery</h2>
        <p style={{fontSize:'14px',color:'#475569'}}>Help people find and recognize your organization.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

        {/* Logo */}
        <div>
          <p style={labelStyle}>Organization Logo <span style={optStyle}>(optional)</span></p>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'68px',height:'68px',borderRadius:'50%',flexShrink:0,background:'#F1F5F9',border:'2px solid #E2E8F0',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {data.logo_preview ? <img src={data.logo_preview} alt="Logo preview" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <IconImage />}
            </div>
            <div>
              <button type="button" onClick={function(){fileInputRef.current&&fileInputRef.current.click()}} style={{padding:'7px 16px',background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'8px',color:'#475569',fontSize:'13px',fontWeight:600,cursor:'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={data.logo_preview?'Change logo':'Upload logo'}>
                {data.logo_preview?'Change Logo':'Upload Logo'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{display:'none'}} aria-hidden="true" tabIndex={-1} />
              <p style={hintStyle}>PNG, JPG, SVG · Recommended: 400×400px</p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div>
          <label htmlFor="co-tagline" style={labelStyle}>Tagline <span style={optStyle}>(optional)</span></label>
          <input id="co-tagline" type="text" value={data.tagline} onChange={function(e){onChange('tagline',e.target.value)}} placeholder="A short phrase describing your org" maxLength={120} style={inputStyle} onFocus={focusIn} onBlur={focusOut} aria-describedby="co-tagline-hint" />
          <p id="co-tagline-hint" style={{...hintStyle,textAlign:'right'}}>{data.tagline.length}/120</p>
        </div>

        {/* Discovery blurb */}
        <div>
          <label htmlFor="co-discovery" style={labelStyle}>Discovery Blurb <span style={optStyle}>(optional)</span></label>
          <textarea id="co-discovery" value={data.discovery_about} onChange={function(e){onChange('discovery_about',e.target.value)}} placeholder="A 1–2 sentence description shown on the public discovery page." rows={2} maxLength={280} style={Object.assign({},inputStyle,{resize:'none'})} onFocus={focusIn} onBlur={focusOut} aria-describedby="co-discovery-hint" />
          <p id="co-discovery-hint" style={{...hintStyle,textAlign:'right'}}>{data.discovery_about.length}/280</p>
        </div>

        {/* Cause Areas */}
        <div>
          <p style={labelStyle}>Cause Areas <span style={optStyle}>(select all that apply)</span></p>
          <p style={hintStyle}>Appear on your discovery card and pre-fill tags when creating events and programs.</p>
          <div style={{marginTop:'8px',display:'flex',flexWrap:'wrap',gap:'6px'}} role="group" aria-label="Cause areas">
            {causeAreaTags.length === 0
              ? <p style={hintStyle}>Loading…</p>
              : causeAreaTags.map(function(tag) {
                  var isOn = data.cause_areas.includes(tag)
                  return (
                    <button key={tag} type="button"
                      onClick={function(){ onChange('cause_areas', isOn ? data.cause_areas.filter(function(t){return t!==tag}) : data.cause_areas.concat([tag])) }}
                      aria-pressed={isOn}
                      style={{padding:'5px 12px',borderRadius:'99px',fontSize:'12px',fontWeight:600,border:'1px solid '+(isOn?'#3B82F6':'#E2E8F0'),background:isOn?'#DBEAFE':'#FFFFFF',color:isOn?'#1D4ED8':'#475569',cursor:'pointer',transition:'all 0.15s'}}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {isOn&&<span style={{marginRight:'4px',display:'inline-flex',verticalAlign:'middle'}}><IconCheck /></span>}{tag}
                    </button>
                  )
                })
            }
          </div>
          {data.cause_areas.length > 0 && (
            <button type="button" onClick={function(){onChange('cause_areas',[])}} style={{marginTop:'8px',fontSize:'11px',color:'#94A3B8',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',padding:0}} className="focus:outline-none focus:ring-1 focus:ring-slate-400 rounded">Clear all</button>
          )}
        </div>

        {/* Audience Served */}
        <div>
          <p style={labelStyle}>Audience Served <span style={optStyle}>(select all that apply)</span></p>
          <p style={hintStyle}>Who does your organization primarily serve?</p>
          <div style={{marginTop:'8px',display:'flex',flexWrap:'wrap',gap:'6px'}} role="group" aria-label="Audience served">
            {audienceTags.length === 0
              ? <p style={hintStyle}>Loading…</p>
              : audienceTags.map(function(tag) {
                  var isOn = data.audience.includes(tag)
                  return (
                    <button key={tag} type="button"
                      onClick={function(){ onChange('audience', isOn ? data.audience.filter(function(t){return t!==tag}) : data.audience.concat([tag])) }}
                      aria-pressed={isOn}
                      style={{padding:'5px 12px',borderRadius:'99px',fontSize:'12px',fontWeight:600,border:'1px solid '+(isOn?'#22C55E':'#E2E8F0'),background:isOn?'#DCFCE7':'#FFFFFF',color:isOn?'#166534':'#475569',cursor:'pointer',transition:'all 0.15s'}}
                      className="focus:outline-none focus:ring-2 focus:ring-green-500">
                      {isOn&&<span style={{marginRight:'4px',display:'inline-flex',verticalAlign:'middle'}}><IconCheck /></span>}{tag}
                    </button>
                  )
                })
            }
          </div>
          {data.audience.length > 0 && (
            <button type="button" onClick={function(){onChange('audience',[])}} style={{marginTop:'8px',fontSize:'11px',color:'#94A3B8',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',padding:0}} className="focus:outline-none focus:ring-1 focus:ring-slate-400 rounded">Clear all</button>
          )}
        </div>

        {/* Languages */}
        <div>
          <p style={labelStyle}>Languages Served <span style={optStyle}>(select all that apply)</span></p>
          <p style={hintStyle}>Which languages does your organization serve?</p>
          {languageTags.length === 0
            ? <p style={{...hintStyle,marginTop:'8px'}}>Loading…</p>
            : (
              <fieldset style={{border:'none',padding:0,margin:'8px 0 0'}}>
                <legend className="sr-only">Languages served</legend>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px'}}>
                  {languageTags.map(function(lang) {
                    var isOn = data.languages.includes(lang)
                    var checkId = 'lang-' + lang.replace(/[\s()]/g,'-').toLowerCase()
                    return (
                      <label key={lang} htmlFor={checkId}
                        style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 8px',borderRadius:'6px',cursor:'pointer',background:isOn?'#F0FDF4':'transparent',border:'1px solid '+(isOn?'#BBF7D0':'transparent'),transition:'all 0.15s'}}>
                        <input id={checkId} type="checkbox" checked={isOn}
                          onChange={function(){
                            onChange('languages', isOn ? data.languages.filter(function(l){return l!==lang}) : data.languages.concat([lang]))
                          }}
                          style={{width:'14px',height:'14px',accentColor:'#22C55E',flexShrink:0,cursor:'pointer'}} />
                        <span style={{fontSize:'13px',color:isOn?'#166534':'#475569',fontWeight:isOn?600:400}}>{lang}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            )
          }
          {data.languages.length > 0 && (
            <button type="button" onClick={function(){onChange('languages',[])}} style={{marginTop:'8px',fontSize:'11px',color:'#94A3B8',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',padding:0}} className="focus:outline-none focus:ring-1 focus:ring-slate-400 rounded">
              Clear all ({data.languages.length} selected)
            </button>
          )}
        </div>

        <PillInput label="Search Tags" id="co-tags" values={data.search_tags} onChange={function(v){onChange('search_tags',v)}} placeholder="Type a tag and press Enter…" hint="Shown on your discovery card. Add anything missing from the cause areas above." />
        <PillInput label="Additional Keywords" id="co-keywords" values={data.keywords} onChange={function(v){onChange('keywords',v)}} placeholder="Type a keyword and press Enter…" hint="Used for search matching only — not displayed on your discovery card." />
      </div>

      <div style={{display:'flex',gap:'12px',marginTop:'28px'}}>
        <button type="button" onClick={onBack} style={btnBack()} className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Back</button>
        <button type="button" onClick={onNext} style={btnPrimary(false)} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Continue <IconChevronRight />
        </button>
      </div>
    </div>
  )
}

// ─── STEP 4 — Plan selection + single DB write ────────────────────────────────
function Step4({ data, onChange, onNext, onBack, submitting }) {
  var [annual, setAnnual] = useState(false)
  var [eduEmail, setEduEmail] = useState('')
  var [eduEmailError, setEduEmailError] = useState('')
  var selectedPlan = data.selected_plan
  var isStudentSelected = selectedPlan === 'student'

  function validateEduEmail(email) {
    if (!email || !email.trim()) return 'A .edu email address is required for the Student plan.'
    if (!email.toLowerCase().trim().endsWith('.edu')) return 'Must be a valid .edu email address.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
    return ''
  }
  function handleSelectPlan(planKey) {
    onChange('selected_plan', planKey)
    if (planKey !== 'student') { setEduEmail(''); setEduEmailError('') }
  }
  function handleNext() {
    if (!selectedPlan) { toast.error('Please select a plan to continue.'); return }
    if (isStudentSelected) {
      var err = validateEduEmail(eduEmail); setEduEmailError(err); if (err) return
    }
    onNext({
      annual: isStudentSelected ? false : annual,
      eduEmail: isStudentSelected ? eduEmail.trim().toLowerCase() : null,
    })
  }

  return (
    <div>
      <div style={{marginBottom:'20px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#3B82F6',marginBottom:'4px'}}>Step 4 of 5</p>
        <h2 style={{fontSize:'22px',fontWeight:800,color:'#0E1523',marginBottom:'6px'}}>Choose Your Plan</h2>
        <p style={{fontSize:'14px',color:'#475569'}}>All plans include a 14-day free trial — no credit card required.</p>
      </div>

      {!isStudentSelected && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'20px',padding:'12px',background:'#F8FAFC',borderRadius:'10px',border:'1px solid #E2E8F0'}}>
          <span style={{fontSize:'13px',fontWeight:annual?400:700,color:annual?'#94A3B8':'#0E1523'}}>Monthly</span>
          <button type="button" onClick={function(){setAnnual(function(v){return !v})}} role="switch" aria-checked={annual} aria-label="Toggle annual billing"
            style={{width:'44px',height:'24px',borderRadius:'12px',border:'none',cursor:'pointer',background:annual?'#3B82F6':'#E2E8F0',position:'relative',flexShrink:0,transition:'background 0.2s'}}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'#FFFFFF',position:'absolute',top:'3px',left:annual?'23px':'3px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}} aria-hidden="true" />
          </button>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <span style={{fontSize:'13px',fontWeight:annual?700:400,color:annual?'#0E1523':'#94A3B8'}}>Annual</span>
            <span style={{fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'99px',background:'#FEF3C7',color:'#92400E',border:'1px solid #FDE68A'}}>2 months free</span>
          </div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}} role="radiogroup" aria-label="Select a plan">
        {PLANS.map(function(plan){
          var isSelected = selectedPlan === plan.key
          var isStudent = plan.key === 'student'
          var priceLabel = isStudent ? plan.monthly.toFixed(2)+'/mo' : (annual ? plan.annualPerMonth.toFixed(2)+'/mo' : plan.monthly.toFixed(2)+'/mo')
          var billedLabel = isStudent ? 'Monthly only · pause up to 6 mo/yr' : (annual ? 'Billed $'+plan.annual.toFixed(2)+'/yr' : 'Billed monthly')
          return (
            <div key={plan.key}>
              <div
                style={{background:isSelected?'#F8FAFC':'#FFFFFF',border:'2px solid '+(isSelected?plan.color:plan.popular&&!isSelected?'rgba(245,183,49,0.4)':isStudent?'rgba(34,197,94,0.3)':'#E2E8F0'),borderRadius:'12px',padding:'16px',cursor:'pointer',transition:'border-color 0.15s',position:'relative',boxShadow:isSelected?'0 0 0 3px '+(plan.color+'22'):'none'}}
                onClick={function(){handleSelectPlan(plan.key)}}
                onKeyDown={function(e){if(e.key==='Enter'||e.key===' ')handleSelectPlan(plan.key)}}
                tabIndex={0} role="radio" aria-checked={isSelected}
                aria-label={plan.name+' plan, $'+priceLabel+(isStudent?' — requires .edu email':'')}>
                {plan.popular && <span style={{position:'absolute',top:'-1px',right:'16px',background:'#F5B731',color:'#0E1523',fontSize:'9px',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',padding:'3px 10px',borderRadius:'0 0 6px 6px'}}>MOST POPULAR</span>}
                {isStudent && <span style={{position:'absolute',top:'-1px',right:'16px',background:'#22C55E',color:'#FFFFFF',fontSize:'9px',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',padding:'3px 10px',borderRadius:'0 0 6px 6px'}}>STUDENT</span>}
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'50%',background:isSelected?plan.color:'#E2E8F0',border:'2px solid '+(isSelected?plan.color:'#CBD5E1'),transition:'all 0.15s'}} aria-hidden="true" />
                      <span style={{fontSize:'15px',fontWeight:800,color:'#0E1523'}}>{plan.name}</span>
                    </div>
                    <span style={{fontSize:'11px',color:'#64748B',marginLeft:'18px'}}>{plan.members} members · {plan.storage} storage</span>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'20px',fontWeight:800,color:isSelected?plan.color:'#0E1523'}}>${priceLabel}</div>
                    <div style={{fontSize:'10px',color:'#94A3B8'}}>{billedLabel}</div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',marginLeft:'18px'}}>
                  {plan.features.slice(0,isSelected?plan.features.length:4).map(function(f,i){return(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:isSelected?'#475569':'#94A3B8'}}>
                      <span style={{color:isSelected?plan.color:'#CBD5E1',flexShrink:0}}><IconCheck /></span>{f}
                    </div>
                  )})}
                  {!isSelected&&plan.features.length>4&&<span style={{fontSize:'11px',color:'#94A3B8',marginLeft:'19px'}}>+ {plan.features.length-4} more features</span>}
                </div>
              </div>
              {isSelected && isStudent && (
                <div style={{background:'#F0FDF4',border:'1px solid #BBF7D0',borderTop:'none',borderRadius:'0 0 10px 10px',padding:'14px 16px'}}>
                  <label htmlFor="edu-email" style={{display:'block',fontSize:'11px',fontWeight:700,color:'#166534',textTransform:'uppercase',letterSpacing:'3px',marginBottom:'6px'}}>
                    .edu Email Address <span style={{color:'#EF4444'}} aria-hidden="true">*</span>
                  </label>
                  <input id="edu-email" type="email" value={eduEmail}
                    onChange={function(e){ setEduEmail(e.target.value); if(eduEmailError) setEduEmailError(validateEduEmail(e.target.value)) }}
                    onFocus={function(e){e.target.style.borderColor='#22C55E'}}
                    onBlur={function(e){e.target.style.borderColor=eduEmailError?'#EF4444':'#E2E8F0'}}
                    placeholder="you@university.edu" aria-required="true"
                    aria-describedby={eduEmailError?'edu-email-error':'edu-email-hint'}
                    style={{width:'100%',padding:'10px 14px',background:'#FFFFFF',border:'1px solid '+(eduEmailError?'#EF4444':'#E2E8F0'),borderRadius:'8px',color:'#0E1523',fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}} />
                  {eduEmailError
                    ? <p id="edu-email-error" role="alert" style={{marginTop:'5px',fontSize:'12px',color:'#EF4444'}}>{eduEmailError}</p>
                    : <p id="edu-email-hint" style={hintStyle}>Must end in .edu. Used to verify student status.</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p style={{...hintStyle,textAlign:'center',marginBottom:'16px'}}>No credit card required for trial. No platform fee on dues or donations.</p>

      {/* Creating spinner shown while DB write is in progress */}
      {submitting && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',padding:'14px',background:'#F0F9FF',border:'1px solid #BAE6FD',borderRadius:'10px',marginBottom:'12px'}}>
          <div style={{width:'16px',height:'16px',border:'2px solid #BAE6FD',borderTopColor:'#3B82F6',borderRadius:'50%',animation:'spin 0.8s linear infinite',flexShrink:0}} aria-hidden="true" />
          <span style={{fontSize:'13px',color:'#0369A1',fontWeight:600}}>Creating your organization…</span>
        </div>
      )}

      <div style={{display:'flex',gap:'12px'}}>
        <button type="button" onClick={onBack} disabled={submitting} style={Object.assign({},btnBack(),{opacity:submitting?0.5:1,cursor:submitting?'not-allowed':'pointer'})} className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Back</button>
        <button type="button" onClick={handleNext} disabled={!selectedPlan||submitting} style={btnPrimary(!selectedPlan||submitting)} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label={selectedPlan?'Create organization with '+selectedPlan+' plan':'Select a plan to continue'}>
          {submitting ? 'Creating…' : 'Start Free Trial'}{!submitting&&selectedPlan&&<IconChevronRight />}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── STEP 5 — Verification (org already created) ──────────────────────────────
function Step5({ orgId, onNext, onBack }) {
  var [submitted, setSubmitted] = useState(false)
  return (
    <div>
      <div style={{marginBottom:'20px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#3B82F6',marginBottom:'4px'}}>Step 5 of 5</p>
        <h2 style={{fontSize:'22px',fontWeight:800,color:'#0E1523',marginBottom:'6px'}}>Nonprofit Verification</h2>
        <p style={{fontSize:'14px',color:'#475569',lineHeight:1.6}}>
          Are you a verified 501(c)(3)? Submit your EIN or IRS determination letter and we'll extend your free trial to <strong style={{color:'#0E1523'}}>30 days</strong> and grant access to the Community Board.
        </p>
      </div>
      <div style={{display:'flex',gap:'8px',padding:'14px 16px',background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'10px',marginBottom:'24px',flexWrap:'wrap'}} role="region" aria-label="Verified nonprofit perks">
        {['30-day free trial','Community Board access','Verified badge on your page'].map(function(perk){return(
          <div key={perk} style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontSize:'12px',color:'#166534',fontWeight:600}}>{perk}</span>
          </div>
        )})}
      </div>
      <NonprofitVerificationForm organizationId={orgId} onSubmitted={function(){setSubmitted(true)}} />
      <div style={{display:'flex',gap:'12px',marginTop:'20px'}}>
        <button type="button" onClick={onBack} style={btnBack()} className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Back</button>
        <button type="button" onClick={onNext}
          style={{flex:1,padding:'12px',background:submitted?'#22C55E':'#FFFFFF',color:submitted?'#FFFFFF':'#64748B',border:'1px solid '+(submitted?'#22C55E':'#E2E8F0'),borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={submitted?'Continue to your dashboard':'Skip verification and continue'}>
          {submitted?<><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Continue</>:'Skip for Now'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function CreateOrganization({ isOpen, onClose, onSuccess }) {
  var navigate = useNavigate()
  var [step, setStep] = useState(1)
  var [createdOrgId, setCreatedOrgId] = useState(null)
  var [submitting, setSubmitting] = useState(false)
  var [tagSets, setTagSets] = useState({ causeAreas: [], audience: [], languages: [] })
  var [data, setData] = useState({
    // Step 1
    name: '', type: 'nonprofit_501c3', description: '', website: '',
    // Step 2
    contact_email: '', contact_phone: '', address: '', city: '', state: '', zip_code: '',
    // Step 3
    logo_file: null, logo_preview: '', tagline: '', discovery_about: '',
    search_tags: [], keywords: [],
    cause_areas: [], audience: [], languages: [],
    // Step 4
    selected_plan: '',
  })

  useEffect(function() {
    getOrgTagSets().then(function(sets) {
      setTagSets(sets)
    }).catch(function(err) {
      console.error('[CreateOrganization] failed to load tag sets:', err)
    })
  }, [])

  function setField(key, value) {
    setData(function(prev){
      var next = {}; Object.keys(prev).forEach(function(k){ next[k] = prev[k] }); next[key] = value; return next
    })
  }

  function resetState() {
    setStep(1); setCreatedOrgId(null); setSubmitting(false)
    setData({
      name:'', type:'nonprofit_501c3', description:'', website:'',
      contact_email:'', contact_phone:'', address:'', city:'', state:'', zip_code:'',
      logo_file:null, logo_preview:'', tagline:'', discovery_about:'',
      search_tags:[], keywords:[],
      cause_areas:[], audience:[], languages:[],
      selected_plan:'',
    })
  }

  function resetAndClose() { resetState(); onClose() }

  // ── Single DB write: called from Step 4 ──────────────────────────────────
  async function handleStep4Next(planOptions) {
    if (!data.selected_plan) { toast.error('Please select a plan to continue.'); return }
    setSubmitting(true)
    try {
      var userRes = await supabase.auth.getUser()
      var user = userRes.data && userRes.data.user
      if (!user) throw new Error('You must be logged in.')

      // 1. Generate unique slug
      var slug = generateSlug(data.name)
      var {data:existing} = await supabase.from('organizations').select('slug').eq('slug', slug).maybeSingle()
      if (existing) slug = slug + '-' + Math.random().toString(36).substring(2, 6)

      // 2. Org number
      var orgNumResult = await supabase.rpc('generate_org_number')
      var orgNumber = orgNumResult.data || null

      // 3. Build location string
      var location = [data.city.trim(), data.state.trim()].filter(Boolean).join(', ')

      // 4. Build tag defaults from cause areas
      var tagDefaults = data.cause_areas.length > 0
        ? { org: data.cause_areas, event: data.cause_areas, program: data.cause_areas, opportunity: data.cause_areas, funding: data.cause_areas }
        : null

      // 5. Create org — all fields in one insert
      var orgPayload = {
        name:            data.name.trim(),
        type:            data.type,
        description:     data.description.trim() || null,
        website:         data.website.trim() || null,
        contact_email:   data.contact_email.trim(),
        contact_phone:   data.contact_phone.trim() || null,
        address:         data.address.trim() || null,
        city:            data.city.trim() || null,
        state:           data.state.trim() || null,
        zip_code:        data.zip_code.trim() || null,
        location:        location || null,
        tagline:         data.tagline.trim() || null,
        discovery_about: data.discovery_about.trim() || null,
        search_tags:     data.search_tags.length > 0 ? data.search_tags : null,
        keywords:        data.keywords.length > 0 ? data.keywords : null,
        tags:            data.cause_areas.length > 0 ? data.cause_areas : null,
        audience:        data.audience.length > 0 ? data.audience : null,
        languages:       data.languages.length > 0 ? data.languages : null,
        tag_defaults:    tagDefaults,
        created_by:      user.id,
        slug:            slug,
        settings:        {},
        trial_started_at:  new Date().toISOString(),
        trial_length_days: 14,
        account_status:    'active',
        org_number:        orgNumber,
        onboarding_completed: true,
      }

      // Student plan extras
      if (data.selected_plan === 'student' && planOptions && planOptions.eduEmail) {
        orgPayload.edu_email = planOptions.eduEmail
        orgPayload.edu_email_verified = false
      }

      var {data:newOrg, error:orgErr} = await supabase.from('organizations').insert([orgPayload]).select().single()
      if (orgErr) throw orgErr

      // 6. Create membership
      var {error:memErr} = await supabase.from('memberships').insert([{
        member_id: user.id, organization_id: newOrg.id,
        role: 'admin', status: 'active', approved_date: new Date().toISOString(),
      }])
      if (memErr) throw memErr

      // 7. Upload logo if provided
      if (data.logo_file) {
        try {
          var ext = data.logo_file.name.split('.').pop()
          var path = newOrg.id + '/logo.' + ext
          var {error:upErr} = await supabase.storage.from('org-assets').upload(path, data.logo_file, {upsert:true})
          if (!upErr) {
            var {data:urlData} = supabase.storage.from('org-assets').getPublicUrl(path)
            await supabase.from('organizations').update({logo_url: urlData.publicUrl}).eq('id', newOrg.id)
          }
        } catch(logoErr) {
          // Logo upload failure is non-fatal — org is created, just no logo
          console.warn('[CreateOrganization] logo upload failed:', logoErr)
        }
      }

      // 8. Send contact email verification
      try {
        await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/verify-contact-email', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({organization_id: newOrg.id})
        })
        if (data.selected_plan === 'student' && planOptions && planOptions.eduEmail) {
          await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/verify-contact-email', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({organization_id: newOrg.id, type: 'edu'})
          })
        }
      } catch(emailErr) {
        // Email verification failure is non-fatal
        console.warn('[CreateOrganization] email verification failed:', emailErr)
      }

      setCreatedOrgId(newOrg.id)
      mascotSuccessToast(data.name + ' is ready!', 'Your organization has been created.')
      setStep(5)
    } catch(err) {
      mascotErrorToast('Could not create organization.', err.message || 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleStep5Next() {
    var orgId = createdOrgId; var orgName = data.name
    resetState(); onClose()
    if (onSuccess) onSuccess({id: orgId, name: orgName})
    navigate('/organizations/' + orgId + '?tour=1')
  }

  if (!isOpen) return null

  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(14,21,35,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={resetAndClose} onKeyDown={function(e){if(e.key==='Escape'&&!submitting)resetAndClose()}} role="dialog" aria-modal="true" aria-labelledby="create-org-title">
      <div style={{background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'16px',width:'100%',maxWidth:'560px',maxHeight:'92vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.15)',fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}} onClick={function(e){e.stopPropagation()}}>

        {/* Sticky header */}
        <div style={{padding:'20px 24px 16px',position:'sticky',top:0,background:'#FFFFFF',zIndex:10,borderBottom:'1px solid #E2E8F0'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
            <div style={{display:'flex',alignItems:'center'}}>
              <span style={{fontSize:'15px',fontWeight:800,color:'#0E1523'}}>Syndi</span><span style={{fontSize:'15px',fontWeight:800,color:'#F5B731'}}>cade</span>
            </div>
            <button onClick={resetAndClose} disabled={submitting} aria-label="Close" style={{background:'none',border:'1px solid #E2E8F0',cursor:submitting?'not-allowed':'pointer',color:'#64748B',display:'flex',alignItems:'center',padding:'6px',borderRadius:'8px',opacity:submitting?0.4:1}} className="focus:outline-none focus:ring-2 focus:ring-slate-400"><IconX /></button>
          </div>
          <ProgressBar step={step} />
          <StepDots step={step} />
        </div>

        <div style={{padding:'24px'}}>
          {step===1 && <Step1 data={data} onChange={setField} onNext={function(){setStep(2)}} />}
          {step===2 && <Step2 data={data} onChange={setField} onNext={function(){setStep(3)}} onBack={function(){setStep(1)}} />}
          {step===3 && <Step3 data={data} onChange={setField} onNext={function(){setStep(4)}} onBack={function(){setStep(2)}} tagSets={tagSets} />}
          {step===4 && <Step4 data={data} onChange={setField} onNext={handleStep4Next} onBack={function(){setStep(3)}} submitting={submitting} />}
          {step===5 && <Step5 orgId={createdOrgId} onNext={handleStep5Next} onBack={function(){setStep(4)}} />}
        </div>
      </div>
    </div>
  )
}

export default CreateOrganization