import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { mascotSuccessToast } from './MascotToast'
import NonprofitVerificationForm from './NonprofitVerificationForm'

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
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
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

var SERVICE_CATEGORIES = [
  'Arts & Culture', 'Animal Welfare', 'Civic Engagement', 'Community Building',
  'Disability Services', 'Education & Literacy', 'Environment & Conservation',
  'Faith-Based Services', 'Food & Hunger', 'Health & Wellness',
  'Housing & Homelessness', 'Immigrant & Refugee Services', 'LGBTQ+ Services',
  'Legal Aid', 'Mental Health', 'Senior Services', 'Sports & Recreation',
  'Technology & Digital Equity', 'Workforce Development', 'Youth Development',
]

var PLANS = [
  {
    key: 'starter', name: 'Starter', monthly: 19.99, annual: 199.90, annualPerMonth: 16.66,
    members: 50, storage: '2 GB', color: '#3B82F6',
    features: ['Up to 50 members','Events, RSVP & check-in','Announcements & documents','Polls, surveys & sign-up forms','Chat & notifications','Free events only','1 scrollable public page','orgname.syndicade.com subdomain'],
  },
  {
    key: 'growth', name: 'Growth', monthly: 39, annual: 390, annualPerMonth: 32.50,
    members: 150, storage: '10 GB', color: '#F5B731', popular: true,
    features: ['Up to 150 members','Everything in Starter','Paid event tickets ($1/ticket fee)','Membership dues collection','Email blasts & newsletter builder','Full analytics & revenue reports','7 public pages','Custom domain add-on ($50/yr)'],
  },
  {
    key: 'pro', name: 'Pro', monthly: 69, annual: 690, annualPerMonth: 57.50,
    members: 300, storage: '30 GB', color: '#8B5CF6',
    features: ['Up to 300 members','Everything in Growth','Unlimited pages','Custom domain — included','Remove Syndicade branding','AI content assistant','Unlimited email blasts','1 free featured event/year'],
  },
]

var inputStyle = {
  width: '100%', padding: '10px 14px', background: '#1E2845', border: '1px solid #2A3550',
  borderRadius: '8px', color: '#FFFFFF', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
}
var labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#F5B731',
  textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '6px',
}
var optStyle = { color: '#64748B', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '11px' }
function focusIn(e) { e.target.style.borderColor = '#3B82F6' }
function focusOut(e) { e.target.style.borderColor = '#2A3550' }

function ProgressBar({ step }) {
  var pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100
  return (
    <div style={{width:'100%',height:'3px',background:'#1E2845',borderRadius:'2px',overflow:'hidden'}}>
      <div style={{height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#3B82F6,#F5B731)',width:pct+'%',transition:'width 0.35s ease'}} />
    </div>
  )
}

function StepDots({ step }) {
  var labels = ['Basics','Contact','Brand','Plan','Verify']
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}} role="list" aria-label="Setup progress">
      {Array.from({length:TOTAL_STEPS}).map(function(_,i) {
        var isActive = i+1===step; var isDone = i+1<step
        return (
          <div key={i} role="listitem" aria-label={labels[i]+(isDone?' — complete':isActive?' — current':'')}>
            <div style={{width:isActive?'22px':'7px',height:'7px',borderRadius:'4px',background:isDone?'#22C55E':isActive?'#3B82F6':'#2A3550',transition:'all 0.3s ease'}} aria-hidden="true" />
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
      <div style={{display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center',padding:'8px 10px',background:'#1E2845',border:'1px solid #2A3550',borderRadius:'8px',minHeight:'44px',cursor:'text'}} onClick={function(){document.getElementById(id)&&document.getElementById(id).focus()}}>
        {values.map(function(tag){return(
          <span key={tag} style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'3px 9px',background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'99px',fontSize:'12px',fontWeight:600,color:'#93C5FD'}}>
            {tag}
            <button type="button" onClick={function(e){e.stopPropagation();onChange(values.filter(function(v){return v!==tag}))}} aria-label={'Remove '+tag} style={{background:'none',border:'none',cursor:'pointer',padding:0,color:'#64748B',display:'flex',alignItems:'center',lineHeight:1}} className="focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
        )})}
        <input id={id} type="text" value={inputVal} onChange={function(e){setInputVal(e.target.value)}} onKeyDown={handleKey} onBlur={function(){if(inputVal.trim())addTag(inputVal)}} placeholder={values.length===0?placeholder:''} style={{flex:1,minWidth:'100px',background:'transparent',border:'none',outline:'none',color:'#FFFFFF',fontSize:'13px',fontFamily:'inherit'}} aria-label={label+' — type and press Enter to add'} disabled={!!(maxItems&&values.length>=maxItems)} />
      </div>
      {hint&&<p style={{fontSize:'11px',color:'#64748B',marginTop:'4px'}}>{hint}</p>}
    </div>
  )
}

function CategorySelector({ selected, onChange, max }) {
  function toggle(cat) {
    if (selected.includes(cat)) { onChange(selected.filter(function(c){return c!==cat})) }
    else { if (selected.length>=max){toast.error('Maximum '+max+' categories.');return} onChange([...selected,cat]) }
  }
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}} role="group" aria-label="Service categories">
      {SERVICE_CATEGORIES.map(function(cat){
        var isOn=selected.includes(cat)
        return (
          <button key={cat} type="button" onClick={function(){toggle(cat)}} aria-pressed={isOn} style={{padding:'5px 12px',borderRadius:'99px',fontSize:'12px',fontWeight:600,border:'1px solid '+(isOn?'#3B82F6':'#2A3550'),background:isOn?'rgba(59,130,246,0.15)':'transparent',color:isOn?'#93C5FD':'#64748B',cursor:'pointer',transition:'all 0.15s'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
            {isOn&&<span style={{marginRight:'4px',display:'inline-flex',verticalAlign:'middle'}}><IconCheck /></span>}{cat}
          </button>
        )
      })}
    </div>
  )
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
function Step1({ data, onChange, onNext, creating }) {
  var slugPreview = data.name.trim().length>=3 ? generateSlug(data.name) : ''
  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'4px',textTransform:'uppercase',color:'#F5B731',marginBottom:'4px'}}>STEP 1 OF 5</p>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#FFFFFF',marginBottom:'6px'}}>The Basics</h2>
        <p style={{fontSize:'13px',color:'#94A3B8'}}>Tell us about your organization. You can update everything later.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
        <div>
          <label htmlFor="co-name" style={labelStyle}>Organization Name <span style={{color:'#EF4444'}}>*</span></label>
          <input id="co-name" type="text" value={data.name} onChange={function(e){onChange('name',e.target.value)}} placeholder="e.g., Toledo Neighborhood Coalition" maxLength={100} style={inputStyle} onFocus={focusIn} onBlur={focusOut} aria-required="true" aria-describedby="co-name-hint" />
          <p id="co-name-hint" style={{fontSize:'11px',color:'#64748B',marginTop:'4px'}}>{data.name.length}/100{slugPreview&&' · syndicade.com/org/'+slugPreview}</p>
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
          <p id="co-mission-hint" style={{fontSize:'11px',color:'#64748B',marginTop:'4px'}}>{data.description.length}/500</p>
        </div>
        <div>
          <label htmlFor="co-website" style={labelStyle}>Website <span style={optStyle}>(optional)</span></label>
          <input id="co-website" type="url" value={data.website} onChange={function(e){onChange('website',e.target.value)}} placeholder="https://yourorg.org" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
      </div>
      <button type="button" onClick={onNext} disabled={creating||data.name.trim().length<3} style={{marginTop:'28px',width:'100%',padding:'12px',background:'#3B82F6',color:'#FFFFFF',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:creating||data.name.trim().length<3?'not-allowed':'pointer',opacity:creating||data.name.trim().length<3?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label={creating?'Creating organization, please wait':'Save and continue to contact information'}>
        {creating?'Creating…':'Save and Continue'}{!creating&&<IconChevronRight />}
      </button>
    </div>
  )
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack, saving }) {
  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'4px',textTransform:'uppercase',color:'#F5B731',marginBottom:'4px'}}>STEP 2 OF 5</p>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#FFFFFF',marginBottom:'6px'}}>Contact & Location</h2>
        <p style={{fontSize:'13px',color:'#94A3B8'}}>How can people reach you? This appears on your public page.</p>
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
          <label htmlFor="co-zip" style={labelStyle}>Zip Code</label>
          <input id="co-zip" type="text" value={data.zip_code} onChange={function(e){onChange('zip_code',e.target.value)}} placeholder="43601" maxLength={10} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
        </div>
      </div>
      <div style={{display:'flex',gap:'12px',marginTop:'28px'}}>
        <button type="button" onClick={onBack} style={{padding:'12px 20px',background:'transparent',color:'#94A3B8',border:'1px solid #2A3550',borderRadius:'10px',fontSize:'14px',fontWeight:600,cursor:'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Back</button>
        <button type="button" onClick={onNext} disabled={saving||!data.contact_email.trim()} style={{flex:1,padding:'12px',background:'#3B82F6',color:'#FFFFFF',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:saving||!data.contact_email.trim()?'not-allowed':'pointer',opacity:saving||!data.contact_email.trim()?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {saving?'Saving…':'Save and Continue'}{!saving&&<IconChevronRight />}
        </button>
      </div>
    </div>
  )
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────
function Step3({ data, onChange, onNext, onBack, saving, orgId }) {
  var [logoFile, setLogoFile] = useState(null)
  var [logoPreview, setLogoPreview] = useState(data.logo_url||null)
  var [uploading, setUploading] = useState(false)
  var fileInputRef = useRef(null)

  function handleLogoChange(e) {
    var f=e.target.files[0]; if(!f) return
    setLogoFile(f); setLogoPreview(URL.createObjectURL(f))
  }

  async function handleNext() {
    if (logoFile&&orgId) {
      setUploading(true)
      try {
        var ext=logoFile.name.split('.').pop()
        var path=orgId+'/logo.'+ext
        var {error:upErr}=await supabase.storage.from('org-assets').upload(path,logoFile,{upsert:true})
        if(upErr) throw upErr
        var {data:urlData}=supabase.storage.from('org-assets').getPublicUrl(path)
        onChange('logo_url',urlData.publicUrl)
      } catch(err) { toast.error('Logo upload failed: '+err.message); setUploading(false); return }
      setUploading(false)
    }
    onNext()
  }

  var isBusy=saving||uploading
  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'4px',textTransform:'uppercase',color:'#F5B731',marginBottom:'4px'}}>STEP 3 OF 5</p>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#FFFFFF',marginBottom:'6px'}}>Brand & Discovery</h2>
        <p style={{fontSize:'13px',color:'#94A3B8'}}>Help people find and recognize your organization.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
        <div>
          <p style={labelStyle}>Organization Logo <span style={optStyle}>(optional)</span></p>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'68px',height:'68px',borderRadius:'50%',flexShrink:0,background:logoPreview?'transparent':'#1E2845',border:'2px solid #2A3550',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {logoPreview?<img src={logoPreview} alt="Logo preview" style={{width:'100%',height:'100%',objectFit:'cover'}} />:<IconImage />}
            </div>
            <div>
              <button type="button" onClick={function(){fileInputRef.current&&fileInputRef.current.click()}} style={{padding:'7px 16px',background:'transparent',border:'1px solid #2A3550',borderRadius:'8px',color:'#CBD5E1',fontSize:'13px',fontWeight:600,cursor:'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={logoPreview?'Change organization logo':'Upload organization logo'}>{logoPreview?'Change Logo':'Upload Logo'}</button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{display:'none'}} aria-hidden="true" tabIndex={-1} />
              <p style={{fontSize:'11px',color:'#64748B',marginTop:'4px'}}>PNG, JPG, SVG · Recommended: 400×400px</p>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="co-tagline" style={labelStyle}>Tagline <span style={optStyle}>(optional)</span></label>
          <input id="co-tagline" type="text" value={data.tagline} onChange={function(e){onChange('tagline',e.target.value)}} placeholder="A short phrase describing your org" maxLength={120} style={inputStyle} onFocus={focusIn} onBlur={focusOut} aria-describedby="co-tagline-hint" />
          <p id="co-tagline-hint" style={{fontSize:'11px',color:'#64748B',marginTop:'4px'}}>{data.tagline.length}/120</p>
        </div>
        <div>
          <label htmlFor="co-discovery" style={labelStyle}>Discovery Blurb <span style={optStyle}>(optional)</span></label>
          <textarea id="co-discovery" value={data.discovery_about} onChange={function(e){onChange('discovery_about',e.target.value)}} placeholder="A 1–2 sentence description shown on the public discovery board. What makes your org unique?" rows={2} maxLength={280} style={Object.assign({},inputStyle,{resize:'none'})} onFocus={focusIn} onBlur={focusOut} aria-describedby="co-discovery-hint" />
          <p id="co-discovery-hint" style={{fontSize:'11px',color:'#64748B',marginTop:'4px'}}>{data.discovery_about.length}/280</p>
        </div>
        <div>
          <p style={labelStyle}>Service Categories <span style={optStyle}>(up to 6)</span></p>
          <CategorySelector selected={data.service_categories} onChange={function(v){onChange('service_categories',v)}} max={6} />
        </div>
        <PillInput label="Search Tags" id="co-tags" values={data.search_tags} onChange={function(v){onChange('search_tags',v)}} placeholder="Type a tag and press Enter…" hint="e.g. 'food bank', 'tutoring', 'veterans'" />
        <PillInput label="Additional Keywords" id="co-keywords" values={data.keywords} onChange={function(v){onChange('keywords',v)}} placeholder="Type a keyword and press Enter…" hint="Internal search only — not shown publicly." />
      </div>
      <div style={{display:'flex',gap:'12px',marginTop:'28px'}}>
        <button type="button" onClick={onBack} style={{padding:'12px 20px',background:'transparent',color:'#94A3B8',border:'1px solid #2A3550',borderRadius:'10px',fontSize:'14px',fontWeight:600,cursor:'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Back</button>
        <button type="button" onClick={handleNext} disabled={isBusy} style={{flex:1,padding:'12px',background:'#3B82F6',color:'#FFFFFF',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:isBusy?'not-allowed':'pointer',opacity:isBusy?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {isBusy?'Saving…':'Save and Continue'}{!isBusy&&<IconChevronRight />}
        </button>
      </div>
    </div>
  )
}

// ─── STEP 4 ───────────────────────────────────────────────────────────────────
function Step4({ onNext, onBack, selectedPlan, onSelectPlan }) {
  var [annual, setAnnual] = useState(false)
  return (
    <div>
      <div style={{marginBottom:'20px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'4px',textTransform:'uppercase',color:'#F5B731',marginBottom:'4px'}}>STEP 4 OF 5</p>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#FFFFFF',marginBottom:'6px'}}>Choose Your Plan</h2>
        <p style={{fontSize:'13px',color:'#94A3B8'}}>All plans include a 14-day free trial — no credit card required.</p>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'20px'}}>
        <span style={{fontSize:'13px',fontWeight:annual?400:700,color:annual?'#64748B':'#FFFFFF'}}>Monthly</span>
        <button type="button" onClick={function(){setAnnual(function(v){return !v})}} role="switch" aria-checked={annual} aria-label="Toggle annual billing for 2 months free" style={{width:'44px',height:'24px',borderRadius:'12px',border:'none',cursor:'pointer',background:annual?'#F5B731':'#2A3550',position:'relative',flexShrink:0,transition:'background 0.2s'}} className="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2">
          <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'#FFFFFF',position:'absolute',top:'3px',left:annual?'23px':'3px',transition:'left 0.2s'}} aria-hidden="true" />
        </button>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <span style={{fontSize:'13px',fontWeight:annual?700:400,color:annual?'#FFFFFF':'#64748B'}}>Annual</span>
          <span style={{fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'99px',background:'rgba(245,183,49,0.15)',color:'#F5B731',border:'1px solid rgba(245,183,49,0.3)'}}>2 months free</span>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
        {PLANS.map(function(plan){
          var isSelected=selectedPlan===plan.key
          var priceLabel=annual?plan.annualPerMonth.toFixed(2)+'/mo':plan.monthly.toFixed(2)+'/mo'
          var billedLabel=annual?'Billed $'+plan.annual.toFixed(2)+'/yr':'Billed monthly'
          return (
            <div key={plan.key} style={{background:'#1A2035',border:'2px solid '+(isSelected?plan.color:plan.popular&&!isSelected?'rgba(245,183,49,0.3)':'#2A3550'),borderRadius:'12px',padding:'16px',cursor:'pointer',transition:'border-color 0.15s',position:'relative'}} onClick={function(){onSelectPlan(plan.key)}} onKeyDown={function(e){if(e.key==='Enter'||e.key===' ')onSelectPlan(plan.key)}} tabIndex={0} role="radio" aria-checked={isSelected} aria-label={plan.name+' plan, $'+priceLabel}>
              {plan.popular&&<span style={{position:'absolute',top:'-1px',right:'16px',background:'#F5B731',color:'#0E1523',fontSize:'9px',fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',padding:'3px 10px',borderRadius:'0 0 6px 6px'}}>MOST POPULAR</span>}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                    <div style={{width:'10px',height:'10px',borderRadius:'50%',background:isSelected?plan.color:'#2A3550',border:'2px solid '+(isSelected?plan.color:'#64748B'),transition:'all 0.15s'}} aria-hidden="true" />
                    <span style={{fontSize:'15px',fontWeight:800,color:'#FFFFFF'}}>{plan.name}</span>
                  </div>
                  <span style={{fontSize:'11px',color:'#64748B',marginLeft:'18px'}}>{plan.members} members · {plan.storage} storage</span>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'20px',fontWeight:800,color:isSelected?plan.color:'#FFFFFF'}}>${priceLabel}</div>
                  <div style={{fontSize:'10px',color:'#64748B'}}>{billedLabel}</div>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'4px',marginLeft:'18px'}}>
                {plan.features.slice(0,isSelected?plan.features.length:4).map(function(f,i){return(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:isSelected?'#CBD5E1':'#64748B'}}>
                    <span style={{color:isSelected?plan.color:'#2A3550',flexShrink:0}}><IconCheck /></span>{f}
                  </div>
                )})}
                {!isSelected&&plan.features.length>4&&<span style={{fontSize:'11px',color:'#64748B',marginLeft:'19px'}}>+ {plan.features.length-4} more features</span>}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{fontSize:'11px',color:'#64748B',textAlign:'center',marginBottom:'16px'}}>No credit card required for trial. No platform fee on dues or donations — Stripe pass-through only.</p>
      <div style={{display:'flex',gap:'12px'}}>
        <button type="button" onClick={onBack} style={{padding:'12px 20px',background:'transparent',color:'#94A3B8',border:'1px solid #2A3550',borderRadius:'10px',fontSize:'14px',fontWeight:600,cursor:'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Back</button>
        <button type="button" onClick={onNext} disabled={!selectedPlan} style={{flex:1,padding:'12px',background:selectedPlan?'#3B82F6':'#1E2845',color:'#FFFFFF',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:selectedPlan?'pointer':'not-allowed',opacity:selectedPlan?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label={selectedPlan?'Continue with '+selectedPlan+' plan':'Select a plan to continue'}>
          Start Free Trial{selectedPlan&&<IconChevronRight />}
        </button>
      </div>
    </div>
  )
}

// ─── STEP 5 — Nonprofit Verification ─────────────────────────────────────────
function Step5({ orgId, onNext, onBack }) {
  var [submitted, setSubmitted] = useState(false)
  return (
    <div>
      <div style={{marginBottom:'20px'}}>
        <p style={{fontSize:'11px',fontWeight:700,letterSpacing:'4px',textTransform:'uppercase',color:'#F5B731',marginBottom:'4px'}}>STEP 5 OF 5</p>
        <h2 style={{fontSize:'20px',fontWeight:800,color:'#FFFFFF',marginBottom:'6px'}}>Nonprofit Verification</h2>
        <p style={{fontSize:'13px',color:'#94A3B8',lineHeight:1.6}}>
          Are you a verified 501(c)(3)? Submit your EIN or IRS determination letter and we'll extend your free trial to <strong style={{color:'#FFFFFF'}}>30 days</strong> and grant access to the Community Board.
        </p>
      </div>
      <div style={{display:'flex',gap:'8px',padding:'14px 16px',background:'rgba(34,197,94,0.07)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px',marginBottom:'24px',flexWrap:'wrap'}} role="region" aria-label="Verified nonprofit perks">
        {['30-day free trial','Community Board access','Verified badge on your page'].map(function(perk){return(
          <div key={perk} style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontSize:'12px',color:'#22C55E',fontWeight:600}}>{perk}</span>
          </div>
        )})}
      </div>
      <NonprofitVerificationForm organizationId={orgId} onSubmitted={function(){setSubmitted(true)}} />
      <div style={{display:'flex',gap:'12px',marginTop:'20px'}}>
        <button type="button" onClick={onBack} style={{padding:'12px 20px',background:'transparent',color:'#94A3B8',border:'1px solid #2A3550',borderRadius:'10px',fontSize:'14px',fontWeight:600,cursor:'pointer'}} className="focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Back</button>
        <button type="button" onClick={onNext} style={{flex:1,padding:'12px',background:submitted?'#22C55E':'transparent',color:submitted?'#FFFFFF':'#94A3B8',border:'1px solid '+(submitted?'#22C55E':'#2A3550'),borderRadius:'10px',fontSize:'14px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label={submitted?'Continue to guided tour':'Skip verification and continue'}>
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
  var [creating, setCreating] = useState(false)
  var [saving, setSaving] = useState(false)
  var [data, setData] = useState({
    name:'', type:'nonprofit_501c3', description:'', website:'',
    contact_email:'', contact_phone:'', address:'', city:'', state:'', zip_code:'',
    logo_url:'', tagline:'', discovery_about:'',
    service_categories:[], search_tags:[], keywords:[],
    selected_plan:'',
  })

  function setField(key, value) {
    setData(function(prev){
      var next={}; Object.keys(prev).forEach(function(k){next[k]=prev[k]}); next[key]=value; return next
    })
  }

  function resetState() {
    setStep(1); setCreatedOrgId(null)
    setData({name:'',type:'nonprofit_501c3',description:'',website:'',contact_email:'',contact_phone:'',address:'',city:'',state:'',zip_code:'',logo_url:'',tagline:'',discovery_about:'',service_categories:[],search_tags:[],keywords:[],selected_plan:''})
  }

  function resetAndClose() { resetState(); onClose() }

  async function handleStep1Next() {
    if (data.name.trim().length<3){toast.error('Name must be at least 3 characters.');return}
    setCreating(true)
    try {
      var userRes=await supabase.auth.getUser(); var user=userRes.data.user
      if(!user) throw new Error('You must be logged in.')
      var slug=generateSlug(data.name)
      var {data:existing}=await supabase.from('organizations').select('slug').eq('slug',slug).maybeSingle()
      if(existing) slug=slug+'-'+Math.random().toString(36).substring(2,6)
      var {data:newOrg,error:orgErr}=await supabase.from('organizations').insert([{name:data.name.trim(),type:data.type,description:data.description.trim(),website:data.website.trim()||null,created_by:user.id,slug:slug,settings:{},trial_started_at:new Date().toISOString(),trial_length_days:14,account_status:'active'}]).select().single()
      if(orgErr) throw orgErr
      var {error:memErr}=await supabase.from('memberships').insert([{member_id:user.id,organization_id:newOrg.id,role:'admin',status:'active',approved_date:new Date().toISOString()}])
      if(memErr) throw memErr
      setCreatedOrgId(newOrg.id); setStep(2)
    } catch(err){toast.error(err.message||'Could not create organization.')}
    finally{setCreating(false)}
  }

  async function handleStep2Next() {
    if(!data.contact_email.trim()){toast.error('Contact email is required.');return}
    setSaving(true)
    try {
      var location=[data.city.trim(),data.state.trim()].filter(Boolean).join(', ')
      var {error}=await supabase.from('organizations').update({contact_email:data.contact_email.trim(),contact_phone:data.contact_phone.trim()||null,address:data.address.trim()||null,city:data.city.trim()||null,state:data.state.trim()||null,zip_code:data.zip_code.trim()||null,location:location||null}).eq('id',createdOrgId)
      if(error) throw error; setStep(3)
    } catch(err){toast.error(err.message||'Could not save contact info.')}
    finally{setSaving(false)}
  }

  async function handleStep3Next() {
    setSaving(true)
    try {
      var updates={tagline:data.tagline.trim()||null,discovery_about:data.discovery_about.trim()||null,service_categories:data.service_categories.length>0?data.service_categories:null,search_tags:data.search_tags.length>0?data.search_tags:null,keywords:data.keywords.length>0?data.keywords:null}
      if(data.logo_url) updates.logo_url=data.logo_url
      var {error}=await supabase.from('organizations').update(updates).eq('id',createdOrgId)
      if(error) throw error; setStep(4)
    } catch(err){toast.error(err.message||'Could not save brand info.')}
    finally{setSaving(false)}
  }

  async function handleStep4Next() {
    if(!data.selected_plan){toast.error('Please select a plan to continue.');return}
    await supabase.from('organizations').update({onboarding_completed:true}).eq('id',createdOrgId)
    mascotSuccessToast(data.name+' is ready!','Your organization has been created.')
    setStep(5)
  }

  // Step 5 done — close wizard, navigate to org with ?tour=1
  function handleStep5Next() {
    var orgId=createdOrgId; var orgName=data.name
    resetState(); onClose()
    if(onSuccess) onSuccess({id:orgId,name:orgName})
    navigate('/organizations/'+orgId+'?tour=1')
  }

  if (!isOpen) return null

  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(14,21,35,0.85)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={resetAndClose} onKeyDown={function(e){if(e.key==='Escape')resetAndClose()}} role="dialog" aria-modal="true" aria-labelledby="create-org-title">
      <div style={{background:'#0E1523',border:'1px solid #2A3550',borderRadius:'16px',width:'100%',maxWidth:'540px',maxHeight:'92vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.6)',fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}} onClick={function(e){e.stopPropagation()}}>
        <div style={{padding:'20px 24px 0',position:'sticky',top:0,background:'#0E1523',zIndex:10,borderBottom:'1px solid #2A3550',paddingBottom:'16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <h1 id="create-org-title" style={{fontSize:'14px',fontWeight:700,color:'#F5B731',textTransform:'uppercase',letterSpacing:'3px',margin:0}}>New Organization</h1>
            <button onClick={resetAndClose} aria-label="Close and cancel organization creation" style={{background:'none',border:'none',cursor:'pointer',color:'#64748B',display:'flex',alignItems:'center',padding:'4px',borderRadius:'6px'}} className="focus:outline-none focus:ring-2 focus:ring-gray-500"><IconX /></button>
          </div>
          <ProgressBar step={step} />
          <div style={{marginTop:'10px'}}><StepDots step={step} /></div>
        </div>
        <div style={{padding:'24px'}}>
          {step===1&&<Step1 data={data} onChange={setField} onNext={handleStep1Next} creating={creating} />}
          {step===2&&<Step2 data={data} onChange={setField} onNext={handleStep2Next} onBack={function(){setStep(1)}} saving={saving} />}
          {step===3&&<Step3 data={data} onChange={setField} onNext={handleStep3Next} onBack={function(){setStep(2)}} saving={saving} orgId={createdOrgId} />}
          {step===4&&<Step4 selectedPlan={data.selected_plan} onSelectPlan={function(p){setField('selected_plan',p)}} onNext={handleStep4Next} onBack={function(){setStep(3)}} />}
          {step===5&&<Step5 orgId={createdOrgId} onNext={handleStep5Next} onBack={function(){setStep(4)}} />}
        </div>
      </div>
    </div>
  )
}

export default CreateOrganization