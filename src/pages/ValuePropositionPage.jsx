import { useState } from 'react';
import {
  Calculator, Download, CheckCircle, TrendingDown, TrendingUp,
  Plus, Trash2, Users, Mail, Globe, FileText, Folder, Tag,
  ArrowRight, Info, RotateCcw,
} from 'lucide-react';

var PLANS = [
  { id:'starter', name:'Starter', monthlyPrice:29.99, annualPrice:299.90, annualMonthlyRate:24.99, color:'#3B82F6', highlight:false, memberLimit:'50 members', features:['Up to 50 members','1 public page','2 GB document storage','Events & RSVPs','Polls, surveys & forms','Announcements'] },
  { id:'growth',  name:'Growth',  monthlyPrice:49.99, annualPrice:499.90, annualMonthlyRate:41.66, color:'#22C55E', highlight:true,  memberLimit:'150 members', features:['Up to 150 members','7 public pages','10 GB document storage','Email blasts (500/mo)','Newsletter builder','Paid ticketing & dues'] },
  { id:'pro',     name:'Pro',     monthlyPrice:69.99, annualPrice:699.90, annualMonthlyRate:58.32, color:'#8B5CF6', highlight:false, memberLimit:'300 members', features:['Up to 300 members','Unlimited pages','30 GB document storage','Unlimited email blasts','AI assistant','Priority support'] },
];

var CATEGORIES = [
  { id:'member_mgmt', label:'Member Management',     hint:'Wild Apricot, MemberClicks, Neon CRM', Icon:Users    },
  { id:'email',       label:'Email Marketing',        hint:'Mailchimp, Constant Contact, Klaviyo',  Icon:Mail     },
  { id:'website',     label:'Website / Page Builder', hint:'Squarespace, Wix, WordPress',           Icon:Globe    },
  { id:'forms',       label:'Forms & Surveys',        hint:'Typeform, SurveyMonkey, Jotform',       Icon:FileText },
  { id:'storage',     label:'Document Storage',       hint:'Google Drive, Dropbox, Box',            Icon:Folder   },
];

var STARTER_FEATURES = ['Member directory + profiles','Multi-org unified dashboard','Events, RSVPs, recurring events','QR codes + attendance check-in','Public events (no login required)','Announcements + document library','Polls, surveys, sign-up forms','Programs','Chat','Donation pages (no revenue cut)','Basic analytics + CSV exports','orgname.syndicade.com subdomain','Up to 3 admins, 2 editors','Community Board (verified nonprofits)','Email support'];
var GROWTH_FEATURES  = ['Paid event tickets ($1/ticket flat fee)','200 ticket max per paid event','Membership dues collection','Membership tiers','Email blasts + newsletter builder','500 emails/month','Email analytics (open/click/bounce)','Full analytics dashboard','Attendance + revenue reports','Admin inbox','Up to 5 admins, unlimited editors','Add-on: Custom domain +$50/yr','Add-on: Remove branding +$10/mo','Add-on: Extra storage +$10/mo per 10 GB'];
var PRO_FEATURES     = ['500 ticket max per paid event','Custom checkout fields per event','Unlimited email blasts + newsletter','Unlimited pages','Custom domain — included','Remove Syndicade branding — included','1 free featured event placement/yr','Unlimited admins and editors','AI assistant','Priority support','Add-on: Extra storage +$15/mo per 20 GB'];

function fmt(v)    { return '$'+Math.round(v).toLocaleString('en-US'); }
function fmtDec(v) { return '$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function buildInitialCosts() { var o={}; CATEGORIES.forEach(function(c){o[c.id]={monthly:'',toolName:''};});  return o; }

export default function ValuePropositionPage() {
  var [orgName,         setOrgName]         = useState('');
  var [billingCycle,    setBillingCycle]    = useState('annual');
  var [costs,           setCosts]           = useState(buildInitialCosts);
  var [ticketing,       setTicketing]       = useState({toolName:'',flatFeePerTicket:'',pctFeePerTicket:'',avgTicketPrice:'',ticketsPerYear:''});
  var [additionalCosts, setAdditionalCosts] = useState([]);

  function updateCost(id,field,val){ setCosts(function(p){var n=Object.assign({},p);n[id]=Object.assign({},p[id],{[field]:val});return n;}); }
  function updateTicketing(field,val){ setTicketing(function(p){return Object.assign({},p,{[field]:val});}); }
  function addAdditional(){ setAdditionalCosts(function(p){return p.concat([{id:Date.now(),label:'',monthly:''}]);}); }
  function removeAdditional(id){ setAdditionalCosts(function(p){return p.filter(function(i){return i.id!==id;});}); }
  function updateAdditional(id,field,val){ setAdditionalCosts(function(p){return p.map(function(i){return i.id===id?Object.assign({},i,{[field]:val}):i;});}); }
  function handleReset(){ setCosts(buildInitialCosts()); setTicketing({toolName:'',flatFeePerTicket:'',pctFeePerTicket:'',avgTicketPrice:'',ticketsPerYear:''}); setAdditionalCosts([]); setOrgName(''); }

  function getTicketAnnual(){ var t=parseFloat(ticketing.ticketsPerYear)||0,f=parseFloat(ticketing.flatFeePerTicket)||0,p=parseFloat(ticketing.pctFeePerTicket)||0,a=parseFloat(ticketing.avgTicketPrice)||0; return (t*f)+(t*a*(p/100)); }
  function getCurrentTotal(){ var total=0; CATEGORIES.forEach(function(c){total+=(parseFloat(costs[c.id].monthly)||0)*12;}); additionalCosts.forEach(function(i){total+=(parseFloat(i.monthly)||0)*12;}); return total+getTicketAnnual(); }
  function getSynCost(plan){ return (billingCycle==='annual'?plan.annualPrice:plan.monthlyPrice*12)+((parseFloat(ticketing.ticketsPerYear)||0)*1); }
  function getSavings(plan){ return getCurrentTotal()-getSynCost(plan); }

  var currentTotal = getCurrentTotal();
  var hasData      = currentTotal > 0;
  var today        = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

  var ib  = {padding:'9px 12px',border:'1px solid #E2E8F0',borderRadius:'8px',fontSize:'14px',background:'#FFFFFF',color:'#0E1523',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"};
  var id  = Object.assign({},ib,{paddingLeft:'24px'});
  var lsm = {display:'block',fontSize:'12px',fontWeight:600,color:'#64748B',marginBottom:'4px'};

  // ── shared print header ────────────────────────────────────────────────────
  function PrintHeader(props) {
    return (
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderBottom:'3px solid #F5B731',paddingBottom:'14px',marginBottom:'20px'}}>
        <div>
          <div style={{fontSize:'22px',fontWeight:800,letterSpacing:'-0.5px'}}><span style={{color:'#0E1523'}}>Syndi</span><span style={{color:'#F5B731'}}>cade</span></div>
          <div style={{fontSize:'11px',color:'#475569',marginTop:'2px'}}>{props.subtitle}</div>
        </div>
        <div style={{textAlign:'right'}}>
          {orgName&&<div style={{fontSize:'12px',fontWeight:700,color:'#0E1523'}}>{orgName}</div>}
          <div style={{fontSize:'10px',color:'#64748B'}}>{today}</div>
          <div style={{fontSize:'10px',color:'#94A3B8'}}>syndicade.org</div>
        </div>
      </div>
    );
  }

  function SectionLabel(props) {
    return <div style={{fontSize:'9px',fontWeight:700,color:'#B45309',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'8px'}}>{props.children}</div>;
  }

  return (
    <main style={{background:'#F8FAFC',minHeight:'100vh',fontFamily:"'Inter','Segoe UI',system-ui,-apple-system,sans-serif"}} aria-label="Syndicade cost comparison tool">

      <style>{`
        /*
          Print strategy:
          - #vp-screen gets display:none — truly removed from layout, zero height, no blank pages
          - #syndicade-print gets display:block — renders in normal flow, position:static
          - position:static means page-break-after works correctly
          - main min-height zeroed so it doesn't add extra pages
        */
        @media print {
          #vp-screen        { display: none !important; }
          #syndicade-print  { display: block !important; width: 100% !important; }
          html, body, main  { min-height: 0 !important; height: auto !important; background: white !important; padding: 0 !important; margin: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0.6in; size: letter; }
        }
        @media screen { #syndicade-print { display: none; } }
        .vp-focus:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; border-radius: 4px; }
        .vp-input:focus { border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
      `}</style>

      {/* ══ SCREEN CONTENT ══════════════════════════════════════════════════ */}
      <div id="vp-screen">
        <div style={{maxWidth:'1140px',margin:'0 auto',padding:'56px 24px 88px'}}>

          <header style={{marginBottom:'48px'}}>
            <div style={{fontSize:'11px',fontWeight:700,color:'#F5B731',letterSpacing:'4px',textTransform:'uppercase',marginBottom:'14px'}}>Cost Comparison Tool</div>
            <h1 style={{fontSize:'42px',fontWeight:800,color:'#0E1523',lineHeight:1.15,margin:'0 0 18px'}}>Build Your Case for{' '}<span style={{color:'#0E1523'}}>Syndi</span><span style={{color:'#F5B731'}}>cade</span></h1>
            <p style={{fontSize:'18px',color:'#475569',maxWidth:'580px',lineHeight:1.65,margin:0}}>Enter what you currently pay for separate tools. See exactly how much your organization could save — then download a PDF to share with your board.</p>
          </header>

          {/* Org + billing row */}
          <div style={{display:'flex',gap:'20px',alignItems:'flex-end',marginBottom:'44px',flexWrap:'wrap'}}>
            <div>
              <label htmlFor="org-name" style={lsm}>Organization name (shown on PDF)</label>
              <input id="org-name" type="text" className="vp-input" value={orgName} onChange={function(e){setOrgName(e.target.value);}} placeholder="e.g. Toledo Food Bank" style={Object.assign({},ib,{width:'260px'})}/>
            </div>
            <div>
              <div style={lsm} id="billing-label">Compare on</div>
              <div role="group" aria-labelledby="billing-label" style={{display:'flex',border:'1px solid #E2E8F0',borderRadius:'8px',overflow:'hidden',background:'#FFFFFF'}}>
                {['annual','monthly'].map(function(c){var a=billingCycle===c; return <button key={c} onClick={function(){setBillingCycle(c);}} aria-pressed={a} className="vp-focus" style={{padding:'9px 20px',fontSize:'14px',fontWeight:600,border:'none',cursor:'pointer',background:a?'#0E1523':'#FFFFFF',color:a?'#FFFFFF':'#475569'}}>{c==='annual'?'Annual':'Monthly'}</button>;})}
              </div>
            </div>
            {billingCycle==='annual'&&<div style={{paddingBottom:'8px',fontSize:'13px',color:'#22C55E',fontWeight:600,display:'flex',alignItems:'center',gap:'5px'}}><CheckCircle size={13} aria-hidden="true"/>Annual saves 2 months vs monthly</div>}
            <button onClick={handleReset} className="vp-focus" aria-label="Reset" style={{display:'flex',alignItems:'center',gap:'6px',padding:'9px 14px',background:'transparent',border:'1px solid #E2E8F0',borderRadius:'8px',fontSize:'13px',color:'#64748B',cursor:'pointer',marginLeft:'auto'}}><RotateCcw size={13} aria-hidden="true"/> Reset</button>
          </div>

          <div className="grid lg:grid-cols-2 grid-cols-1 gap-8" style={{alignItems:'start'}}>

            {/* LEFT */}
            <section aria-label="Enter current tool costs">
              <div style={{background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'16px',padding:'32px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}><Calculator size={20} color="#3B82F6" aria-hidden="true"/><h2 style={{fontSize:'20px',fontWeight:700,color:'#0E1523',margin:0}}>Your Current Tools</h2></div>
                <p style={{fontSize:'14px',color:'#64748B',marginBottom:'28px',lineHeight:1.5}}>Enter your current monthly cost for each category. Leave blank for tools you don't use.</p>

                {CATEGORIES.map(function(cat){
                  var IC=cat.Icon;
                  return (
                    <div key={cat.id} style={{marginBottom:'22px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px'}}><IC size={14} color="#94A3B8" aria-hidden="true"/><span style={{fontSize:'14px',fontWeight:600,color:'#0E1523'}}>{cat.label}</span></div>
                      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                        <div style={{position:'relative',flex:'0 0 112px'}}><span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:'13px',pointerEvents:'none'}}>$</span><input type="number" min="0" step="0.01" className="vp-input" value={costs[cat.id].monthly} onChange={function(e){updateCost(cat.id,'monthly',e.target.value);}} placeholder="0.00" aria-label={cat.label+' monthly cost'} style={Object.assign({},id)}/></div>
                        <span style={{fontSize:'12px',color:'#94A3B8',whiteSpace:'nowrap'}}>/mo</span>
                        <input type="text" className="vp-input" value={costs[cat.id].toolName} onChange={function(e){updateCost(cat.id,'toolName',e.target.value);}} placeholder={cat.hint} aria-label={cat.label+' tool name'} style={Object.assign({},ib,{flex:1,fontSize:'13px',color:'#475569'})}/>
                      </div>
                    </div>
                  );
                })}

                {additionalCosts.map(function(item){
                  return (
                    <div key={item.id} style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'10px'}}>
                      <div style={{position:'relative',flex:'0 0 112px'}}><span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:'13px',pointerEvents:'none'}}>$</span><input type="number" min="0" step="0.01" className="vp-input" value={item.monthly} onChange={function(e){updateAdditional(item.id,'monthly',e.target.value);}} placeholder="0.00" aria-label="Monthly cost" style={Object.assign({},id,{fontSize:'13px'})}/></div>
                      <span style={{fontSize:'12px',color:'#94A3B8',whiteSpace:'nowrap'}}>/mo</span>
                      <input type="text" className="vp-input" value={item.label} onChange={function(e){updateAdditional(item.id,'label',e.target.value);}} placeholder="Tool name" aria-label="Tool name" style={Object.assign({},ib,{flex:1,fontSize:'13px'})}/>
                      <button onClick={function(){removeAdditional(item.id);}} aria-label="Remove" className="vp-focus" style={{padding:'8px',border:'1px solid #E2E8F0',borderRadius:'6px',background:'#FFFFFF',cursor:'pointer',color:'#EF4444',display:'flex',alignItems:'center',flexShrink:0}}><Trash2 size={13} aria-hidden="true"/></button>
                    </div>
                  );
                })}

                <button onClick={addAdditional} className="vp-focus" style={{display:'flex',alignItems:'center',gap:'6px',padding:'9px 14px',border:'1px dashed #CBD5E1',borderRadius:'8px',background:'transparent',cursor:'pointer',fontSize:'13px',color:'#64748B',marginBottom:'22px'}}><Plus size={13} aria-hidden="true"/> Add another tool</button>

                <div style={{borderTop:'1px solid #E2E8F0',paddingTop:'22px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'6px'}}><Tag size={14} color="#94A3B8" aria-hidden="true"/><span style={{fontSize:'14px',fontWeight:600,color:'#0E1523'}}>Event Ticketing Fees</span></div>
                  <p style={{fontSize:'13px',color:'#64748B',marginBottom:'14px',lineHeight:1.5}}>Eventbrite charges ~$0.99–$1.79 flat + 3.7% per ticket. Enter whatever your platform charges.</p>
                  <div style={{marginBottom:'12px'}}><label htmlFor="t-tool" style={lsm}>Ticketing platform (optional)</label><input id="t-tool" type="text" className="vp-input" value={ticketing.toolName} onChange={function(e){updateTicketing('toolName',e.target.value);}} placeholder="e.g. Eventbrite" style={Object.assign({},ib,{fontSize:'13px'})}/></div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                    <div><label htmlFor="flat-fee" style={lsm}>Flat fee / ticket</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:'13px',pointerEvents:'none'}}>$</span><input id="flat-fee" type="number" min="0" step="0.01" className="vp-input" value={ticketing.flatFeePerTicket} onChange={function(e){updateTicketing('flatFeePerTicket',e.target.value);}} placeholder="0.99" style={Object.assign({},id,{fontSize:'13px'})}/></div></div>
                    <div><label htmlFor="pct-fee" style={lsm}>Percentage fee / ticket</label><div style={{position:'relative'}}><input id="pct-fee" type="number" min="0" step="0.1" className="vp-input" value={ticketing.pctFeePerTicket} onChange={function(e){updateTicketing('pctFeePerTicket',e.target.value);}} placeholder="3.7" style={Object.assign({},ib,{paddingRight:'28px',fontSize:'13px'})}/><span style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:'13px',pointerEvents:'none'}}>%</span></div></div>
                    <div><label htmlFor="avg-px" style={lsm}>Avg ticket price</label><div style={{position:'relative'}}><span style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#94A3B8',fontSize:'13px',pointerEvents:'none'}}>$</span><input id="avg-px" type="number" min="0" step="1" className="vp-input" value={ticketing.avgTicketPrice} onChange={function(e){updateTicketing('avgTicketPrice',e.target.value);}} placeholder="25" style={Object.assign({},id,{fontSize:'13px'})}/></div></div>
                    <div><label htmlFor="tix-yr" style={lsm}>Tickets sold / year</label><input id="tix-yr" type="number" min="0" step="1" className="vp-input" value={ticketing.ticketsPerYear} onChange={function(e){updateTicketing('ticketsPerYear',e.target.value);}} placeholder="200" style={Object.assign({},ib,{fontSize:'13px'})}/></div>
                  </div>
                  {getTicketAnnual()>0&&<div style={{fontSize:'13px',color:'#475569',background:'#F8FAFC',border:'1px solid #E2E8F0',padding:'8px 12px',borderRadius:'6px',display:'flex',alignItems:'center',gap:'6px'}}><Info size={13} color="#94A3B8" aria-hidden="true"/>Estimated annual ticketing cost: <strong style={{color:'#0E1523'}}>{fmt(getTicketAnnual())}</strong></div>}
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section aria-label="Cost comparison results">
              <div style={{background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'16px',padding:'28px',marginBottom:'20px'}}>
                <div style={{fontSize:'11px',fontWeight:700,color:'#64748B',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'10px'}}>Your Current Annual Spend</div>
                <div aria-live="polite" style={{fontSize:'52px',fontWeight:800,lineHeight:1,color:hasData?'#EF4444':'#CBD5E1'}}>{hasData?fmt(currentTotal):'$—'}</div>
                <div style={{fontSize:'14px',color:'#64748B',marginTop:'8px'}}>{hasData?fmt(currentTotal/12)+'/month across all tools':'Enter your current tool costs to see a comparison'}</div>
              </div>

              {PLANS.map(function(plan){
                var sc=getSynCost(plan),sv=getSavings(plan),pct=currentTotal>0?Math.round((sv/currentTotal)*100):0;
                return (
                  <article key={plan.id} aria-label={'Syndicade '+plan.name+' plan'} style={{background:'#FFFFFF',border:plan.highlight?('2px solid '+plan.color):'1px solid #E2E8F0',borderRadius:'16px',padding:'24px',marginBottom:'16px',position:'relative'}}>
                    {plan.highlight&&<div style={{position:'absolute',top:'-12px',left:'24px',background:plan.color,color:'#FFFFFF',fontSize:'10px',fontWeight:700,padding:'3px 10px',borderRadius:'99px',textTransform:'uppercase',letterSpacing:'1px'}}>Most Popular</div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                      <div><div style={{fontSize:'19px',fontWeight:700,color:'#0E1523'}}>{plan.name}</div><div style={{fontSize:'13px',color:'#64748B',marginTop:'2px'}}>{billingCycle==='annual'?(fmtDec(plan.annualPrice)+'/yr \u00b7 '+fmtDec(plan.annualMonthlyRate)+'/mo effective'):(fmtDec(plan.monthlyPrice)+'/month')}</div></div>
                      <div style={{textAlign:'right'}}><div aria-live="polite" style={{fontSize:'30px',fontWeight:800,color:plan.color,lineHeight:1}}>{fmt(sc)}</div><div style={{fontSize:'12px',color:'#94A3B8',marginTop:'2px'}}>per year total</div></div>
                    </div>
                    {hasData&&<div style={{background:sv>0?'#F0FDF4':'#FEF2F2',border:'1px solid '+(sv>0?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'),borderRadius:'10px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
                      {sv>0?<TrendingDown size={16} color="#22C55E" aria-hidden="true"/>:<TrendingUp size={16} color="#EF4444" aria-hidden="true"/>}
                      <div><div style={{fontSize:'15px',fontWeight:700,color:sv>0?'#15803D':'#DC2626'}}>{sv>0?('Save '+fmt(sv)+'/yr ('+pct+'% less)'):('Costs '+fmt(Math.abs(sv))+' more per year')}</div>{sv>0&&<div style={{fontSize:'12px',color:'#64748B',marginTop:'2px'}}>That's {fmt(sv/12)}/month back in your mission budget</div>}</div>
                    </div>}
                    <div style={{display:'flex',flexWrap:'wrap',gap:'8px 20px',marginBottom:parseFloat(ticketing.ticketsPerYear)>0?'12px':'0'}}>
                      {plan.features.map(function(f){return <div key={f} style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',color:'#475569'}}><CheckCircle size={12} color={plan.color} aria-hidden="true"/>{f}</div>;})}
                    </div>
                    {parseFloat(ticketing.ticketsPerYear)>0&&<div style={{borderTop:'1px solid #F1F5F9',paddingTop:'10px',marginTop:'12px',fontSize:'12px',color:'#64748B'}}>Ticket fees: {parseFloat(ticketing.ticketsPerYear)||0} tickets &times; $1 flat = <strong style={{color:'#0E1523'}}>{fmt((parseFloat(ticketing.ticketsPerYear)||0))}</strong> — no percentage cut<span style={{display:'block',marginTop:'3px',color:'#94A3B8'}}>Stripe processing fees (2.9% + $0.30/transaction) apply separately.</span></div>}
                  </article>
                );
              })}

              {hasData&&<>
                <button onClick={function(){window.print();}} className="vp-focus" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'14px',background:'#0E1523',color:'#FFFFFF',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:700,cursor:'pointer',marginBottom:'8px'}}>
                  <Download size={17} aria-hidden="true"/> Download PDF Comparison
                </button>
                <div style={{background:'#DBEAFE',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'12px',color:'#1E40AF',lineHeight:1.5}}>
                  <strong>For the cleanest PDF:</strong> In Chrome's print dialog → More settings → uncheck <strong>"Headers and footers"</strong> to remove the browser URL line.
                </div>
              </>}
              <a href="/signup" className="vp-focus" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'14px',background:'#F5B731',color:'#0E1523',borderRadius:'12px',fontSize:'15px',fontWeight:700,cursor:'pointer',textDecoration:'none',boxSizing:'border-box'}}>Start Your Free Trial <ArrowRight size={17} aria-hidden="true"/></a>
            </section>
          </div>

          <section aria-label="How pricing works" style={{marginTop:'56px',background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'16px',padding:'40px'}}>
            <h2 style={{fontSize:'22px',fontWeight:700,color:'#0E1523',margin:'0 0 28px'}}>How Syndicade's Pricing Works</h2>
            <div className="grid md:grid-cols-3 grid-cols-1 gap-8">
              {[{label:'No Platform Revenue Cut',body:"Flat $1 per paid ticket — no percentage cut on your ticket sales. Standard Stripe processing fees (2.9% + $0.30/transaction) go directly to Stripe, not to us."},{label:'Everything Included',body:'Member management, events, a public website, email marketing, forms, announcements, and document storage — one flat monthly fee.'},{label:'Free Trial',body:'All plans include a 14-day free trial, no credit card required. Verified 501(c)(3) nonprofits receive a 30-day free trial.'}].map(function(item){return <div key={item.label}><div style={{fontSize:'11px',fontWeight:700,color:'#F5B731',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'10px'}}>{item.label}</div><p style={{fontSize:'14px',color:'#475569',lineHeight:1.65,margin:0}}>{item.body}</p></div>;})}
            </div>
          </section>
        </div>
      </div>{/* end #vp-screen */}

      {/* ══ PRINT ONLY ══════════════════════════════════════════════════════
          #vp-screen is display:none in print so it contributes zero height.
          This div renders in normal flow (position:static) so page-break-after works.
          main min-height is zeroed in print CSS so no blank pages.
      ══════════════════════════════════════════════════════════════════════ */}
      <div id="syndicade-print" style={{fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:'#0E1523',background:'#FFFFFF',width:'100%'}}>

        {/* ── PAGE 1 — page-break-after forces a hard break after this div ── */}
        <div style={{pageBreakAfter:'always',breakAfter:'page'}}>
          <PrintHeader subtitle="Cost Comparison Report"/>

          <SectionLabel>Current Annual Software Costs</SectionLabel>
          <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'20px',fontSize:'11px',tableLayout:'fixed'}}>
            <thead>
              <tr style={{backgroundColor:'#F1F5F9'}}>
                <th style={{padding:'7px 10px',textAlign:'left',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'35%'}}>Category</th>
                <th style={{padding:'7px 10px',textAlign:'left',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'35%'}}>Tool / Platform</th>
                <th style={{padding:'7px 10px',textAlign:'right',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'15%'}}>Monthly</th>
                <th style={{padding:'7px 10px',textAlign:'right',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'15%'}}>Annual</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(function(cat){
                var m=parseFloat(costs[cat.id].monthly)||0;
                if(m===0&&!costs[cat.id].toolName) return null;
                return <tr key={cat.id}><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',color:'#0E1523'}}>{cat.label}</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',color:'#475569'}}>{costs[cat.id].toolName||'—'}</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>{m>0?fmtDec(m):'—'}</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>{m>0?fmt(m*12):'—'}</td></tr>;
              })}
              {additionalCosts.map(function(item){
                var m=parseFloat(item.monthly)||0;
                if(m===0&&!item.label) return null;
                return <tr key={item.id}><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',color:'#0E1523'}}>{item.label||'Other'}</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',color:'#475569'}}>—</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>{m>0?fmtDec(m):'—'}</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>{m>0?fmt(m*12):'—'}</td></tr>;
              })}
              {getTicketAnnual()>0&&<tr><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',color:'#0E1523'}}>Event Ticketing Fees</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',color:'#475569',fontSize:'10px'}}>{ticketing.toolName||'Current platform'} — {parseFloat(ticketing.ticketsPerYear)||0} tickets/yr{parseFloat(ticketing.flatFeePerTicket)>0?' @ $'+ticketing.flatFeePerTicket+'/ticket':''}{parseFloat(ticketing.pctFeePerTicket)>0?' + '+ticketing.pctFeePerTicket+'%':''}{parseFloat(ticketing.avgTicketPrice)>0?' · avg $'+ticketing.avgTicketPrice:''}</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>—</td><td style={{padding:'7px 10px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>{fmt(getTicketAnnual())}</td></tr>}
              <tr style={{backgroundColor:'#FEF2F2'}}><td colSpan="3" style={{padding:'9px 10px',border:'1px solid #E2E8F0',fontWeight:700,color:'#0E1523'}}>Total Current Annual Cost</td><td style={{padding:'9px 10px',border:'1px solid #E2E8F0',textAlign:'right',fontWeight:800,fontSize:'14px',color:'#DC2626'}}>{fmt(currentTotal)}</td></tr>
            </tbody>
          </table>

          <SectionLabel>Syndicade Cost Comparison — {billingCycle==='annual'?'Annual Billing':'Monthly Billing'}</SectionLabel>
          <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'16px',fontSize:'11px',tableLayout:'fixed'}}>
            <thead>
              <tr style={{backgroundColor:'#F1F5F9'}}>
                <th style={{padding:'7px 8px',textAlign:'left',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'14%'}}>Plan</th>
                <th style={{padding:'7px 8px',textAlign:'left',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'32%'}}>Included</th>
                <th style={{padding:'7px 8px',textAlign:'right',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'16%'}}>{billingCycle==='annual'?'Annual Plan':'Plan (×12mo)'}</th>
                <th style={{padding:'7px 8px',textAlign:'right',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'13%'}}>Ticket Fees</th>
                <th style={{padding:'7px 8px',textAlign:'right',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'13%'}}>Total/yr</th>
                <th style={{padding:'7px 8px',textAlign:'right',color:'#475569',fontWeight:600,border:'1px solid #E2E8F0',width:'12%'}}>Savings</th>
              </tr>
            </thead>
            <tbody>
              {PLANS.map(function(plan){
                var sc=getSynCost(plan),sv=getSavings(plan),pct=currentTotal>0?Math.round((sv/currentTotal)*100):0;
                var base=billingCycle==='annual'?plan.annualPrice:plan.monthlyPrice*12;
                var tix=(parseFloat(ticketing.ticketsPerYear)||0)*1;
                return <tr key={plan.id} style={{backgroundColor:plan.highlight?'#F0FDF4':'#FFFFFF'}}><td style={{padding:'7px 8px',border:'1px solid #E2E8F0',fontWeight:plan.highlight?700:400,color:'#0E1523'}}>{plan.name}{plan.highlight?' ★':''}</td><td style={{padding:'7px 8px',border:'1px solid #E2E8F0',fontSize:'10px',color:'#475569'}}>{plan.memberLimit} · email · website · storage · events</td><td style={{padding:'7px 8px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>{fmtDec(base)}</td><td style={{padding:'7px 8px',border:'1px solid #E2E8F0',textAlign:'right',color:'#0E1523'}}>{tix>0?fmt(tix):'—'}</td><td style={{padding:'7px 8px',border:'1px solid #E2E8F0',textAlign:'right',fontWeight:700,color:'#0E1523'}}>{fmt(sc)}</td><td style={{padding:'7px 8px',border:'1px solid #E2E8F0',textAlign:'right',fontWeight:700,color:sv>0?'#15803D':'#DC2626'}}>{sv>0?('Save '+fmt(sv)+' ('+pct+'%)'):'+'+fmt(Math.abs(sv))}</td></tr>;
              })}
            </tbody>
          </table>

          <div style={{border:'1px solid #E2E8F0',borderRadius:'6px',padding:'11px 14px',fontSize:'10px',color:'#475569',lineHeight:1.6,backgroundColor:'#F8FAFC'}}>
            <strong style={{color:'#0E1523'}}>About Syndicade: </strong>
            Flat $1/ticket fee, no percentage cut on revenue. Standard Stripe processing fees (2.9% + $0.30/transaction) go directly to Stripe.
            Every plan includes member management, events, a public website, email marketing, polls, surveys, announcements, and document storage.
            {billingCycle==='annual'?' Annual billing saves 2 months vs monthly.':''}{' '}
            14-day free trial, no credit card required. <strong>Verified 501(c)(3) organizations receive a 30-day free trial.</strong>
          </div>
        </div>{/* end page 1 — pageBreakAfter fires here */}

        {/* ── PAGE 2: Plan overview ── */}
        <div>
          <PrintHeader subtitle="Plan Overview"/>

          <SectionLabel>Simple Pricing for Every Org — 14-Day Free Trial · Verified 501(c)(3) Nonprofits Get 30 Days Free</SectionLabel>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'16px'}}>

            {/* Starter */}
            <div style={{border:'1px solid #E2E8F0',borderRadius:'8px',padding:'14px',backgroundColor:'#FFFFFF'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#0E1523',marginBottom:'4px'}}>Starter</div>
              <div style={{fontSize:'20px',fontWeight:800,color:'#3B82F6',lineHeight:1}}>{billingCycle==='annual'?'$24.99':'$29.99'}<span style={{fontSize:'10px',fontWeight:400,color:'#64748B'}}>/mo</span></div>
              <div style={{fontSize:'9px',color:'#22C55E',fontWeight:600,marginBottom:'8px',marginTop:'2px'}}>{billingCycle==='annual'?'$299.90/yr — 2 months free':'Billed monthly'}</div>
              <div style={{fontSize:'10px',color:'#475569',marginBottom:'8px'}}>50 members · 2 GB · 1 page</div>
              <div style={{borderTop:'1px solid #F1F5F9',paddingTop:'8px'}}>
                {STARTER_FEATURES.map(function(f){return <div key={f} style={{display:'flex',alignItems:'flex-start',gap:'4px',marginBottom:'3px',fontSize:'9px',color:'#374151'}}><span style={{color:'#3B82F6',flexShrink:0}}>✓</span>{f}</div>;})}
              </div>
            </div>

            {/* Growth */}
            <div style={{border:'2px solid #22C55E',borderRadius:'8px',padding:'14px',backgroundColor:'#F0FDF4',position:'relative'}}>
              <div style={{position:'absolute',top:'-9px',left:'12px',background:'#22C55E',color:'#FFFFFF',fontSize:'8px',fontWeight:700,padding:'2px 7px',borderRadius:'99px',textTransform:'uppercase'}}>Most Popular</div>
              <div style={{fontSize:'13px',fontWeight:700,color:'#0E1523',marginBottom:'4px'}}>Growth</div>
              <div style={{fontSize:'20px',fontWeight:800,color:'#22C55E',lineHeight:1}}>{billingCycle==='annual'?'$41.66':'$49.99'}<span style={{fontSize:'10px',fontWeight:400,color:'#64748B'}}>/mo</span></div>
              <div style={{fontSize:'9px',color:'#22C55E',fontWeight:600,marginBottom:'8px',marginTop:'2px'}}>{billingCycle==='annual'?'$499.90/yr — 2 months free':'Billed monthly'}</div>
              <div style={{fontSize:'10px',color:'#475569',marginBottom:'8px'}}>150 members · 10 GB · 7 pages</div>
              <div style={{borderTop:'1px solid #D1FAE5',paddingTop:'8px'}}>
                <div style={{fontSize:'9px',fontWeight:700,color:'#22C55E',marginBottom:'5px'}}>Everything in Starter, plus:</div>
                {GROWTH_FEATURES.map(function(f){return <div key={f} style={{display:'flex',alignItems:'flex-start',gap:'4px',marginBottom:'3px',fontSize:'9px',color:'#374151'}}><span style={{color:'#22C55E',flexShrink:0}}>✓</span>{f}</div>;})}
              </div>
            </div>

            {/* Pro */}
            <div style={{border:'1px solid #E2E8F0',borderRadius:'8px',padding:'14px',backgroundColor:'#FFFFFF'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#0E1523',marginBottom:'4px'}}>Pro</div>
              <div style={{fontSize:'20px',fontWeight:800,color:'#8B5CF6',lineHeight:1}}>{billingCycle==='annual'?'$58.32':'$69.99'}<span style={{fontSize:'10px',fontWeight:400,color:'#64748B'}}>/mo</span></div>
              <div style={{fontSize:'9px',color:'#22C55E',fontWeight:600,marginBottom:'8px',marginTop:'2px'}}>{billingCycle==='annual'?'$699.90/yr — 2 months free':'Billed monthly'}</div>
              <div style={{fontSize:'10px',color:'#475569',marginBottom:'8px'}}>300 members · 30 GB · Unlimited pages</div>
              <div style={{borderTop:'1px solid #F1F5F9',paddingTop:'8px'}}>
                <div style={{fontSize:'9px',fontWeight:700,color:'#8B5CF6',marginBottom:'5px'}}>Everything in Growth, plus:</div>
                {PRO_FEATURES.map(function(f){return <div key={f} style={{display:'flex',alignItems:'flex-start',gap:'4px',marginBottom:'3px',fontSize:'9px',color:'#374151'}}><span style={{color:'#8B5CF6',flexShrink:0}}>✓</span>{f}</div>;})}
              </div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
            <div style={{border:'1px solid #E2E8F0',borderRadius:'6px',padding:'11px 14px',fontSize:'10px',color:'#475569',lineHeight:1.6,backgroundColor:'#F8FAFC'}}>
              <strong style={{color:'#0E1523'}}>Per-use fees: </strong>$1 flat/ticket (no revenue cut) · Featured event $15/wk or $40/30 days (Growth+; Pro gets 1 free/yr) · Member overage $1/member/mo · Stripe processing 2.9% + $0.30/transaction goes directly to Stripe.
            </div>
            <div style={{border:'1px solid rgba(34,197,94,0.3)',borderRadius:'6px',padding:'11px 14px',fontSize:'10px',color:'#475569',lineHeight:1.6,backgroundColor:'#F0FDF4'}}>
              <strong style={{color:'#15803D'}}>Free trial: </strong>All plans include a <strong>14-day free trial</strong>, no credit card required. <strong>Verified 501(c)(3) nonprofits receive a 30-day free trial.</strong> Cancel anytime.
            </div>
          </div>

          <div style={{textAlign:'center',fontSize:'10px',color:'#94A3B8'}}>syndicade.org · syndicade.org/signup</div>
        </div>{/* end page 2 */}

      </div>{/* end #syndicade-print */}

    </main>
  );
}