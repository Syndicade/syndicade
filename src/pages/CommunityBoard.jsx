/**
 * Syndicade — CommunityBoard.jsx
 * Task 9: Vendor contacts, endorsement count, mascot updates, Recommendations card redesign
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';

function usePatrickHand() {
  useEffect(function() {
    if (document.getElementById('patrick-hand-font')) return;
    var link = document.createElement('link');
    link.id = 'patrick-hand-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap';
    document.head.appendChild(link);
  }, []);
}

var BG='#F8FAFC',CARD='#FFFFFF',BDR='#E2E8F0',ELEV='#F1F5F9';
var TEXT='#0E1523',TEXT2='#475569',MUTED='#64748B';
var YELLOW='#F5B731',BLUE='#3B82F6',GREEN='#22C55E',RED='#EF4444',PURPLE='#8B5CF6';

var AVATAR_COLORS=['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#14B8A6','#EC4899','#6366F1'];
function getAvatarColor(name){var char=(name||'A').charCodeAt(0);return AVATAR_COLORS[char%AVATAR_COLORS.length];}
function getInitials(name){if(!name)return'??';var w=name.trim().split(/\s+/);if(w.length===1)return w[0].slice(0,2).toUpperCase();return(w[0][0]+w[1][0]).toUpperCase();}

var BOARD_CONFIG={
  ask:{label:'Ask Board',tabColor:'#A78BFA',description:'Post what your org needs — supplies, volunteers, skills, or anything a fellow member might have.',buttonLabel:'Post an Ask',cardBg:'#E1BEE7',tagBg:'#9C27B0',tagText:'#F3E5F5',emptyTitle:'No asks posted yet',emptyDesc:'Be the first to post something your org needs.',categories:['Supplies','Volunteers','Skills','Space','Equipment','Funding','Other'],primaryAction:'Offer Help',quickReactions:[{type:'can_help',label:'I Can Help'},{type:'interested',label:'Interested'}]},
  offer:{label:'Offer Board',tabColor:'#22C55E',description:'Share what your org has to give — surplus donations, unused equipment, available expertise.',buttonLabel:'Post an Offer',cardBg:'#C8E6C9',tagBg:'#66BB6A',tagText:'#1B5E20',emptyTitle:'No offers posted yet',emptyDesc:'Share surplus supplies, skills, or equipment with fellow board members.',categories:['Supplies','Volunteers','Skills','Space','Equipment','Other'],primaryAction:'Claim This',quickReactions:[{type:'can_help',label:'I Want This'},{type:'interested',label:'Interested'}]},
  collab:{label:'Collaboration',tabColor:'#3B82F6',description:'Find partner orgs to co-host events, run joint programs, or pool resources.',buttonLabel:'Post a Request',cardBg:'#BBDEFB',tagBg:'#42A5F5',tagText:'#0D47A1',emptyTitle:'No collaboration requests yet',emptyDesc:'Invite board members to co-host events or build programs together.',categories:['Co-Host','Program','Campaign','Fundraiser','Advocacy','Other'],primaryAction:"I'm Interested",quickReactions:[{type:'can_help',label:"I'm In"},{type:'interested',label:'Interested'}]},
  recommendations:{label:'Recommendations',tabColor:'#F59E0B',description:'Share trusted vendors, sponsors, and service providers your org has worked with.',buttonLabel:'Add a Recommendation',cardBg:'#FFF3E0',tagBg:'#FB8C00',tagText:'#FFF8E1',emptyTitle:'No recommendations yet',emptyDesc:'Share vendors, sponsors, or services your org trusts.',categories:['Vendor','Sponsor','Contractor','Tech & Software','Legal','Financial','Printing','Catering','Other'],primaryAction:'Endorse',quickReactions:[{type:'endorse',label:'Endorse'}]}
};

var TABS=[
  {key:'ask',label:'Ask Board',color:'#A78BFA'},
  {key:'offer',label:'Offer Board',color:'#22C55E'},
  {key:'collab',label:'Collaboration',color:'#3B82F6'},
  {key:'recommendations',label:'Recommendations',color:'#F59E0B'},
  {key:'activity',label:'Activity',color:'#64748B'}
];

var STATUS_CONFIG={
  open:{label:'Open',bg:'rgba(34,197,94,0.15)',border:'rgba(34,197,94,0.4)',text:'#16A34A'},
  pending:{label:'Pending',bg:'rgba(245,183,49,0.15)',border:'rgba(245,183,49,0.4)',text:'#B45309'},
  completed:{label:'Completed',bg:'rgba(100,116,139,0.15)',border:'rgba(100,116,139,0.4)',text:'#64748B'}
};

var THEMES=[{value:'general',label:'General'},{value:'latino',label:'Latino'},{value:'black',label:'Black-led'},{value:'lgbtq',label:'LGBTQ+'},{value:'faith',label:'Faith-based'},{value:'immigrant',label:'Immigrant'},{value:'women',label:'Women-led'},{value:'disability',label:'Disability'},{value:'asian',label:'Asian & AAPI'},{value:'indigenous',label:'Indigenous'},{value:'youth',label:'Youth'},{value:'other',label:'Other'}];
var US_STATES=['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

function IconArrowLeft(p){return<svg width={p.size||16}height={p.size||16}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><line x1="19"y1="12"x2="5"y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;}
function IconPlus(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"aria-hidden="true"><line x1="12"y1="5"x2="12"y2="19"/><line x1="5"y1="12"x2="19"y2="12"/></svg>;}
function IconX(p){return<svg width={p.size||12}height={p.size||12}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"aria-hidden="true"><line x1="18"y1="6"x2="6"y2="18"/><line x1="6"y1="6"x2="18"y2="18"/></svg>;}
function IconSettings(p){return<svg width={p.size||15}height={p.size||15}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><circle cx="12"cy="12"r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;}
function IconUsers(p){return<svg width={p.size||15}height={p.size||15}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7"r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;}
function IconBell(p){return<svg width={p.size||20}height={p.size||20}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;}
function IconEdit(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;}
function IconTrash(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;}
function IconChevronDown(p){return<svg width={p.size||12}height={p.size||12}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>;}
function IconChevronLeft(p){return<svg width={p.size||14}height={p.size||14}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>;}
function IconCheck(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2.5"aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>;}
function IconLock(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><rect x="3"y="11"width="18"height="11"rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;}
function IconGlobe(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><circle cx="12"cy="12"r="10"/><line x1="2"y1="12"x2="22"y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;}
function IconMapPin(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12"cy="10"r="3"/></svg>;}
function IconMessage(p){return<svg width={p.size||24}height={p.size||24}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="1.5"aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;}
function IconMessageCircle(p){return<svg width={p.size||14}height={p.size||14}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;}
function IconShield(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;}
function IconClock(p){return<svg width={p.size||26}height={p.size||26}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><circle cx="12"cy="12"r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}
function IconSend(p){return<svg width={p.size||14}height={p.size||14}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><line x1="22"y1="2"x2="11"y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;}
function IconPin(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><line x1="12"y1="17"x2="12"y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>;}
function IconRefresh(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;}
function IconInbox(p){return<svg width={p.size||15}height={p.size||15}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;}
function IconActivity(p){return<svg width={p.size||15}height={p.size||15}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;}
function IconSearch(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><circle cx="11"cy="11"r="8"/><line x1="21"y1="21"x2="16.65"y2="16.65"/></svg>;}
function IconPhone(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.57a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;}
function IconMail(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;}
function IconExternalLink(p){return<svg width={p.size||12}height={p.size||12}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10"y1="14"x2="21"y2="3"/></svg>;}
function IconThumbsUp(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;}
function IconUser(p){return<svg width={p.size||13}height={p.size||13}viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12"cy="7"r="4"/></svg>;}

function timeAgo(dateStr){var now=new Date(),then=new Date(dateStr);var s=Math.floor((now-then)/1000);if(s<60)return'just now';var m=Math.floor(s/60);if(m<60)return m+(m===1?' min ago':' mins ago');var h=Math.floor(m/60);if(h<24)return h+(h===1?' hour ago':' hours ago');var d=Math.floor(h/24);if(d<7)return d+(d===1?' day ago':' days ago');return Math.floor(d/7)+(Math.floor(d/7)===1?' week ago':' weeks ago');}
function formatDateTime(dateStr){var d=new Date(dateStr);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' at '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});}
function getThemeLabel(value){var t=THEMES.find(function(t){return t.value===value;});return t?t.label:'General';}
function getExpiryInfo(expiresAt){if(!expiresAt)return null;var now=new Date();var expiry=new Date(expiresAt);var msLeft=expiry-now;var daysLeft=Math.ceil(msLeft/(1000*60*60*24));return{daysLeft:daysLeft,isExpired:daysLeft<=0,isExpiringSoon:daysLeft<=14};}
function normalizeUrl(url){if(!url)return'';if(url.indexOf('http://')===0||url.indexOf('https://')===0)return url;return'https://'+url;}

async function insertCBNotifications(fromOrgId,toOrgId,boardName,boardId,userOrgs){
  try{
    var sendingOrg=(userOrgs||[]).find(function(o){return o.id===fromOrgId;});
    var sendingOrgName=sendingOrg?sendingOrg.name:'An organization';
    var{data:adminIds,error}=await supabase.rpc('get_org_admin_user_ids',{p_org_id:toOrgId});
    if(error||!adminIds||adminIds.length===0)return;
    var rows=adminIds.map(function(r){return{user_id:r.user_id,type:'board_reply',title:sendingOrgName+' sent you a message',message:'New message on '+boardName+' Community Board.',link:'/community-board/'+boardId,read:false};});
    await supabase.from('notifications').insert(rows);
    window.dispatchEvent(new Event('notificationCreated'));
    for(var i=0;i<adminIds.length;i++){(function(userId){var bc=supabase.channel('user-notif-'+userId);bc.subscribe(function(status){if(status==='SUBSCRIBED'){bc.send({type:'broadcast',event:'new_notification',payload:{}}).then(function(){supabase.removeChannel(bc);});}});})(adminIds[i].user_id);}
  }catch(err){console.error('Could not insert CB notifications:',err);}
}

function StatusBadge(props){
  var s=STATUS_CONFIG[props.status]||STATUS_CONFIG.open;
  var[open,setOpen]=useState(false);
  if(!props.isOwn)return<span style={{display:'inline-block',padding:'2px 8px',borderRadius:'99px',fontSize:'10px',fontWeight:700,background:s.bg,border:'1px solid '+s.border,color:s.text}}>{s.label}</span>;
  return(
    <div style={{position:'relative',display:'inline-block'}}>
      <button onClick={function(e){e.stopPropagation();setOpen(!open);}} aria-label={'Change status, currently '+s.label} aria-expanded={open}
        style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'99px',fontSize:'10px',fontWeight:700,background:s.bg,border:'1px solid '+s.border,color:s.text,cursor:'pointer',outline:'none'}}>
        {s.label}<IconChevronDown size={9}/>
      </button>
      {open&&(
        <div role="menu" style={{position:'absolute',top:'26px',left:0,zIndex:20,background:CARD,border:'1px solid '+BDR,borderRadius:'8px',padding:'4px',minWidth:'120px',boxShadow:'0 4px 16px rgba(0,0,0,0.10)'}}>
          {Object.keys(STATUS_CONFIG).map(function(key){var sc=STATUS_CONFIG[key];return<button key={key} role="menuitem" onClick={function(e){e.stopPropagation();setOpen(false);props.onChange(key);}} style={{display:'flex',width:'100%',padding:'7px 10px',background:'none',border:'none',color:sc.text,fontSize:'12px',fontWeight:600,cursor:'pointer',borderRadius:'6px',textAlign:'left'}}>{sc.label}</button>;})}
        </div>
      )}
    </div>
  );
}

function RecommendationCard(props){
  var post=props.post,cfg=BOARD_CONFIG.recommendations,isOwn=props.isOwn;
  var isBoardAdmin=props.isBoardAdmin||false;
  var contacts=props.contacts||[];
  var unreadCount=props.unreadCount||0;
  var postReactions=props.reactions||{};
  var endorseCount=postReactions['endorse_count']||0;
  var hasEndorsed=postReactions['my_endorse']||false;
  var expiryInfo=getExpiryInfo(post.expires_at);
  var isExpired=expiryInfo&&expiryInfo.isExpired;
  var isExpiringSoon=expiryInfo&&expiryInfo.isExpiringSoon&&!isExpired;
  var pinShadow=post.is_pinned?'3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05),inset 0 0 0 2px '+YELLOW:'3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)';
  var websiteUrl=post.website_url?normalizeUrl(post.website_url):null;
  return(
    <article role="listitem" aria-label={post.org_name+' recommendation: '+post.title}
      style={{background:cfg.cardBg,borderRadius:'12px',padding:'16px',position:'relative',boxShadow:pinShadow,display:'flex',flexDirection:'column',opacity:isExpired?0.65:1}}>
      {post.is_pinned&&<div aria-label="Pinned post" style={{position:'absolute',top:'-9px',left:'14px',display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',background:YELLOW,borderRadius:'99px',fontSize:'9px',fontWeight:800,color:'#111827',letterSpacing:'0.5px',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}><IconPin size={8}/>PINNED</div>}
      <div style={{position:'absolute',top:'10px',right:'10px',display:'flex',gap:'4px',zIndex:2}}>
        {isBoardAdmin&&<button onClick={function(){props.onTogglePin(post);}} aria-label={post.is_pinned?'Unpin post':'Pin post to top'} style={{width:'24px',height:'24px',borderRadius:'50%',background:post.is_pinned?'rgba(245,183,49,0.25)':'rgba(0,0,0,0.08)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:post.is_pinned?'#B45309':'#6B7280'}}><IconPin size={11}/></button>}
        {isOwn&&<><button onClick={function(){props.onEdit(post);}} aria-label="Edit recommendation" style={{width:'24px',height:'24px',borderRadius:'50%',background:'rgba(0,0,0,0.10)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#374151'}}><IconEdit size={11}/></button><button onClick={function(){props.onDelete(post);}} aria-label="Delete recommendation" style={{width:'24px',height:'24px',borderRadius:'50%',background:'rgba(239,68,68,0.12)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:RED}}><IconTrash size={11}/></button></>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'10px',flexWrap:'wrap',paddingRight:(isBoardAdmin||isOwn)?'64px':'0'}}>
        <span style={{display:'inline-block',padding:'2px 8px',borderRadius:'3px',fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',background:cfg.tagBg,color:cfg.tagText}}>{post.category}</span>
        <StatusBadge status={post.status||'open'} isOwn={isOwn} onChange={function(s){props.onStatusChange(post.id,s);}}/>
        {isExpired&&<span style={{display:'inline-block',padding:'2px 7px',borderRadius:'99px',fontSize:'10px',fontWeight:700,background:'rgba(100,116,139,0.15)',border:'1px solid rgba(100,116,139,0.3)',color:MUTED}}>Expired</span>}
        {isExpiringSoon&&!isExpired&&<span style={{display:'inline-block',padding:'2px 7px',borderRadius:'99px',fontSize:'10px',fontWeight:700,background:expiryInfo.daysLeft<=3?'rgba(239,68,68,0.12)':'rgba(245,183,49,0.12)',border:'1px solid '+(expiryInfo.daysLeft<=3?'rgba(239,68,68,0.3)':'rgba(245,183,49,0.3)'),color:expiryInfo.daysLeft<=3?RED:'#B45309'}}>{expiryInfo.daysLeft<=0?'Expires today':'Expires in '+expiryInfo.daysLeft+'d'}</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
        <div style={{width:'22px',height:'22px',borderRadius:'50%',background:cfg.tagBg,color:cfg.tagText,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0}}>{getInitials(post.org_name)}</div>
        <span style={{fontSize:'11px',fontWeight:700,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{post.org_name}</span>
        {endorseCount>0&&(
          <div aria-label={endorseCount+' endorsement'+(endorseCount===1?'':'s')} style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'2px 8px',borderRadius:'99px',fontSize:'11px',fontWeight:700,background:'rgba(251,140,0,0.15)',border:'1px solid rgba(251,140,0,0.35)',color:'#E65100',flexShrink:0}}>
            <IconThumbsUp size={11}/>{endorseCount}
          </div>
        )}
      </div>
      <div style={{fontSize:'15px',fontWeight:800,color:TEXT,lineHeight:1.3,marginBottom:'6px',paddingRight:'4px'}}>{post.title}</div>
      {websiteUrl&&(
        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={'Visit '+post.title+' website'}
          style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'12px',color:BLUE,marginBottom:'8px',textDecoration:'none',fontWeight:500}}>
          <IconGlobe size={11}/>{post.website_url.replace(/^https?:\/\//,'').replace(/\/$/,'')}<IconExternalLink size={11}/>
        </a>
      )}
      <div style={{fontSize:'17px',fontWeight:400,color:'#374151',lineHeight:1.5,marginBottom:'10px',fontFamily:"'Patrick Hand',sans-serif",display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{post.body}</div>
      {contacts.length>0&&(
        <div style={{marginBottom:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
          <p style={{fontSize:'10px',fontWeight:700,color:MUTED,textTransform:'uppercase',letterSpacing:'2px',margin:'0 0 4px'}}>Contacts</p>
          {contacts.map(function(c,i){return(
            <div key={c.id||i} style={{display:'flex',flexDirection:'column',gap:'2px',padding:'8px 10px',background:'rgba(255,255,255,0.65)',borderRadius:'8px',border:'1px solid rgba(251,140,0,0.20)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{width:'20px',height:'20px',borderRadius:'50%',background:cfg.tagBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IconUser size={10}/></div>
                <span style={{fontSize:'12px',fontWeight:700,color:TEXT}}>{c.name}</span>
                {c.title&&<span style={{fontSize:'11px',color:MUTED}}>{'· '+c.title}</span>}
              </div>
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap',paddingLeft:'26px'}}>
                {c.email&&<a href={'mailto:'+c.email} aria-label={'Email '+c.name} style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11px',color:BLUE,textDecoration:'none'}}><IconMail size={11}/>{c.email}</a>}
                {c.phone&&<a href={'tel:'+c.phone} aria-label={'Call '+c.name} style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11px',color:TEXT2,textDecoration:'none'}}><IconPhone size={11}/>{c.phone}</a>}
              </div>
            </div>
          );})}
        </div>
      )}
      <div style={{fontSize:'10px',color:'#6B7280',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}>
        <span>{formatDateTime(post.created_at)}</span>
        {post.response_count>0&&<span>{'· '+post.response_count+' '+(post.response_count===1?'response':'responses')}</span>}
      </div>
      {!isOwn&&!isExpired&&post.status!=='completed'&&(
        <div style={{marginBottom:'8px'}}>
          <button onClick={function(){props.onReact(post.id,'endorse');}} aria-pressed={hasEndorsed} aria-label={(hasEndorsed?'Remove endorsement':'Endorse this vendor')+(endorseCount>0?', '+endorseCount+' total':'')}
            style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'5px 12px',borderRadius:'99px',fontSize:'11px',fontWeight:700,border:'1px solid '+(hasEndorsed?'rgba(251,140,0,0.5)':'rgba(0,0,0,0.15)'),background:hasEndorsed?'rgba(251,140,0,0.15)':'rgba(255,255,255,0.55)',color:hasEndorsed?'#E65100':'#374151',cursor:'pointer',transition:'all 0.15s'}}>
            <IconThumbsUp size={12}/>{hasEndorsed?'Endorsed':'Endorse'}{endorseCount>0?' · '+endorseCount:''}
          </button>
        </div>
      )}
      {isOwn&&expiryInfo&&(isExpiringSoon||isExpired)&&(
        <div style={{marginBottom:'8px'}}>
          <button onClick={function(){props.onRenew(post.id);}} aria-label="Renew post for 60 more days"
            style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:700,border:'1px solid rgba(59,130,246,0.3)',background:'rgba(59,130,246,0.07)',color:BLUE,cursor:'pointer'}}>
            <IconRefresh size={11}/>Renew Post
          </button>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto'}}>
        {isOwn?<div style={{fontSize:'10px',color:'#6B7280',fontStyle:'italic'}}>{'Your recommendation · '+timeAgo(post.created_at)}</div>:<div/>}
        <button onClick={function(e){e.stopPropagation();props.onOpenChat(post);}} aria-label={'Open chat'+(unreadCount>0?', '+unreadCount+' unread':'')}
          style={{position:'relative',width:'30px',height:'30px',borderRadius:'50%',background:unreadCount>0?'rgba(59,130,246,0.15)':'rgba(0,0,0,0.07)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:unreadCount>0?BLUE:'#6B7280',flexShrink:0}}>
          <IconMessageCircle size={14}/>
          {unreadCount>0&&<span aria-hidden="true" style={{position:'absolute',top:'-2px',right:'-2px',background:BLUE,color:'#FFFFFF',borderRadius:'99px',padding:'0 4px',fontSize:'9px',fontWeight:700,minWidth:'14px',textAlign:'center',lineHeight:'14px'}}>{unreadCount>9?'9+':unreadCount}</span>}
        </button>
      </div>
    </article>
  );
}

function PostCard(props){
  var post=props.post,cfg=props.config,isOwn=props.isOwn;
  var unreadCount=props.unreadCount||0;
  var isBoardAdmin=props.isBoardAdmin||false;
  var postReactions=props.reactions||{};
  var expiryInfo=getExpiryInfo(post.expires_at);
  var isExpired=expiryInfo&&expiryInfo.isExpired;
  var isExpiringSoon=expiryInfo&&expiryInfo.isExpiringSoon&&!isExpired;
  var pinShadow=post.is_pinned?'3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05),inset 0 0 0 2px '+YELLOW:'3px 4px 14px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05)';
  return(
    <article role="listitem" aria-label={post.org_name+' '+post.category+' post'}
      style={{background:cfg.cardBg,borderRadius:'12px',padding:'16px',position:'relative',boxShadow:pinShadow,display:'flex',flexDirection:'column',minHeight:'240px',opacity:isExpired?0.65:1}}>
      {post.is_pinned&&<div aria-label="Pinned post" style={{position:'absolute',top:'-9px',left:'14px',display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',background:YELLOW,borderRadius:'99px',fontSize:'9px',fontWeight:800,color:'#111827',letterSpacing:'0.5px',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}><IconPin size={8}/>PINNED</div>}
      <div style={{position:'absolute',top:'10px',right:'10px',display:'flex',gap:'4px',zIndex:2}}>
        {isBoardAdmin&&<button onClick={function(){props.onTogglePin(post);}} aria-label={post.is_pinned?'Unpin post':'Pin post to top'} style={{width:'24px',height:'24px',borderRadius:'50%',background:post.is_pinned?'rgba(245,183,49,0.25)':'rgba(0,0,0,0.08)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:post.is_pinned?'#B45309':'#6B7280'}}><IconPin size={11}/></button>}
        {isOwn&&<><button onClick={function(){props.onEdit(post);}} aria-label="Edit post" style={{width:'24px',height:'24px',borderRadius:'50%',background:'rgba(0,0,0,0.10)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#374151'}}><IconEdit size={11}/></button><button onClick={function(){props.onDelete(post);}} aria-label="Delete post" style={{width:'24px',height:'24px',borderRadius:'50%',background:'rgba(239,68,68,0.12)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:RED}}><IconTrash size={11}/></button></>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px',flexWrap:'wrap',paddingRight:(isBoardAdmin||isOwn)?'64px':'0'}}>
        <span style={{display:'inline-block',padding:'2px 8px',borderRadius:'3px',fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',background:cfg.tagBg,color:cfg.tagText}}>{post.category}</span>
        <StatusBadge status={post.status||'open'} isOwn={isOwn} onChange={function(s){props.onStatusChange(post.id,s);}}/>
        {isExpired&&<span style={{display:'inline-block',padding:'2px 7px',borderRadius:'99px',fontSize:'10px',fontWeight:700,background:'rgba(100,116,139,0.15)',border:'1px solid rgba(100,116,139,0.3)',color:MUTED}}>Expired</span>}
        {isExpiringSoon&&<span style={{display:'inline-block',padding:'2px 7px',borderRadius:'99px',fontSize:'10px',fontWeight:700,background:expiryInfo.daysLeft<=3?'rgba(239,68,68,0.12)':'rgba(245,183,49,0.12)',border:'1px solid '+(expiryInfo.daysLeft<=3?'rgba(239,68,68,0.3)':'rgba(245,183,49,0.3)'),color:expiryInfo.daysLeft<=3?RED:'#B45309'}}>{expiryInfo.daysLeft<=0?'Expires today':'Expires in '+expiryInfo.daysLeft+'d'}</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
        <div style={{width:'22px',height:'22px',borderRadius:'50%',background:cfg.tagBg,color:cfg.tagText,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0}}>{getInitials(post.org_name)}</div>
        <span style={{fontSize:'11px',fontWeight:700,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{post.org_name}</span>
      </div>
      <div style={{fontSize:'13px',fontWeight:700,color:TEXT,lineHeight:1.4,marginBottom:'8px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{post.title}</div>
      <div style={{fontSize:'17px',fontWeight:400,color:'#374151',lineHeight:1.5,flex:1,marginBottom:'10px',fontFamily:"'Patrick Hand',sans-serif",display:'-webkit-box',WebkitLineClamp:4,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{post.body}</div>
      <div style={{fontSize:'10px',color:'#6B7280',marginBottom:'8px',display:'flex',alignItems:'center',gap:'6px'}}>
        <span>{formatDateTime(post.created_at)}</span>
        {post.response_count>0&&<span>{'· '+post.response_count+' '+(post.response_count===1?'response':'responses')}</span>}
      </div>
      {!isOwn&&!isExpired&&post.status!=='completed'&&cfg.quickReactions&&cfg.quickReactions.length>0&&(
        <div style={{display:'flex',gap:'6px',marginBottom:'8px',flexWrap:'wrap'}}>
          {cfg.quickReactions.map(function(rxn){
            var count=postReactions[rxn.type+'_count']||0;
            var hasReacted=postReactions['my_'+rxn.type]||false;
            return<button key={rxn.type} onClick={function(){props.onReact(post.id,rxn.type);}} aria-pressed={hasReacted} aria-label={(hasReacted?'Remove: ':'React: ')+rxn.label+(count>0?', '+count:'')}
              style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'99px',fontSize:'11px',fontWeight:600,border:'1px solid '+(hasReacted?'rgba(0,0,0,0.25)':'rgba(0,0,0,0.15)'),background:hasReacted?cfg.tagBg:'rgba(255,255,255,0.55)',color:hasReacted?cfg.tagText:'#374151',cursor:'pointer',transition:'all 0.15s'}}>{rxn.label}{count>0?' · '+count:''}</button>;
          })}
        </div>
      )}
      {!isOwn&&!isExpired&&post.status!=='completed'&&(
        <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px'}}>
          <button onClick={function(){props.onAction(post,'primary');}} style={{padding:'5px 12px',borderRadius:'4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',background:cfg.tagBg,color:cfg.tagText}}>{cfg.primaryAction}</button>
          <button onClick={function(){props.onAction(post,'info');}} style={{padding:'5px 12px',borderRadius:'4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',background:'rgba(0,0,0,0.10)',color:'#374151'}}>Get More Info</button>
        </div>
      )}
      {post.status==='completed'&&<div style={{fontSize:'11px',color:'#6B7280',fontStyle:'italic',marginBottom:'8px'}}>This has been fulfilled.</div>}
      {isOwn&&expiryInfo&&(isExpiringSoon||isExpired)&&(
        <div style={{marginBottom:'8px'}}>
          <button onClick={function(){props.onRenew(post.id);}} style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:700,border:'1px solid rgba(59,130,246,0.3)',background:'rgba(59,130,246,0.07)',color:BLUE,cursor:'pointer'}}>
            <IconRefresh size={11}/>Renew Post
          </button>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto'}}>
        {isOwn?<div style={{fontSize:'10px',color:'#6B7280',fontStyle:'italic'}}>{'Your post · '+timeAgo(post.created_at)}</div>:<div/>}
        <button onClick={function(e){e.stopPropagation();props.onOpenChat(post);}} aria-label={'Open chat'+(unreadCount>0?', '+unreadCount+' unread':'')}
          style={{position:'relative',width:'30px',height:'30px',borderRadius:'50%',background:unreadCount>0?'rgba(59,130,246,0.15)':'rgba(0,0,0,0.07)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:unreadCount>0?BLUE:'#6B7280',flexShrink:0}}>
          <IconMessageCircle size={14}/>
          {unreadCount>0&&<span aria-hidden="true" style={{position:'absolute',top:'-2px',right:'-2px',background:BLUE,color:'#FFFFFF',borderRadius:'99px',padding:'0 4px',fontSize:'9px',fontWeight:700,minWidth:'14px',textAlign:'center',lineHeight:'14px'}}>{unreadCount>9?'9+':unreadCount}</span>}
        </button>
      </div>
    </article>
  );
}

function SkeletonCard(props){
  return(
    <div aria-hidden="true" style={{background:props.cardBg,borderRadius:'12px',padding:'16px',minHeight:'240px',boxShadow:'3px 4px 14px rgba(0,0,0,0.08)',opacity:0.5}}>
      <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}><div style={{width:'56px',height:'18px',background:'rgba(0,0,0,0.12)',borderRadius:'3px'}}/><div style={{width:'48px',height:'18px',background:'rgba(0,0,0,0.08)',borderRadius:'99px'}}/></div>
      <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'12px'}}><div style={{width:'22px',height:'22px',borderRadius:'50%',background:'rgba(0,0,0,0.12)',flexShrink:0}}/><div style={{width:'110px',height:'11px',background:'rgba(0,0,0,0.08)',borderRadius:'3px'}}/></div>
      <div style={{width:'92%',height:'13px',background:'rgba(0,0,0,0.08)',borderRadius:'3px',marginBottom:'6px'}}/>
      <div style={{width:'78%',height:'13px',background:'rgba(0,0,0,0.06)',borderRadius:'3px',marginBottom:'6px'}}/>
      <div style={{width:'85%',height:'11px',background:'rgba(0,0,0,0.05)',borderRadius:'3px'}}/>
    </div>
  );
}

function FilterToolbar(props){
  var cfg=props.config;
  var hasActiveFilters=props.searchQuery||props.filterCategory||props.filterStatus!=='all'||props.sortBy!=='newest';
  var inputStyle={padding:'8px 12px',background:CARD,border:'1px solid '+BDR,borderRadius:'8px',color:TEXT,fontSize:'13px',outline:'none',fontFamily:'inherit',height:'36px',boxSizing:'border-box'};
  return(
    <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px',alignItems:'center'}}>
      <div style={{position:'relative',flex:1,minWidth:'180px'}}>
        <div style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:MUTED,pointerEvents:'none'}}><IconSearch size={13}/></div>
        <input type="search" value={props.searchQuery} onChange={function(e){props.onSearch(e.target.value);}} placeholder={'Search '+cfg.label.toLowerCase()+'...'} aria-label={'Search '+cfg.label} style={Object.assign({},inputStyle,{paddingLeft:'32px',width:'100%'})}/>
      </div>
      <select value={props.sortBy} onChange={function(e){props.onSort(e.target.value);}} aria-label="Sort posts" style={inputStyle}>
        <option value="newest">Newest</option>
        <option value="recently_active">Recently Active</option>
        <option value="most_responses">Most Responses</option>
      </select>
      <select value={props.filterCategory} onChange={function(e){props.onCategory(e.target.value);}} aria-label="Filter by category" style={inputStyle}>
        <option value="">All Categories</option>
        {cfg.categories.map(function(c){return<option key={c} value={c}>{c}</option>;})}
      </select>
      <select value={props.filterStatus} onChange={function(e){props.onStatus(e.target.value);}} aria-label="Filter by status" style={inputStyle}>
        <option value="all">All Status</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      {hasActiveFilters&&<button onClick={props.onClear} aria-label="Clear all filters" style={{padding:'7px 12px',background:'transparent',border:'1px solid '+BDR,borderRadius:'8px',color:TEXT2,fontSize:'12px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap',height:'36px',boxSizing:'border-box'}}><IconX size={11}/>Clear</button>}
    </div>
  );
}

function ActivityFeed(props){
  var feed=props.feed;
  var boardTypeColors={ask:'#A78BFA',offer:'#22C55E',collab:'#3B82F6',recommendations:'#F59E0B'};
  var boardTypeLabels={ask:'posted an ask',offer:'posted an offer',collab:'posted a collaboration request',recommendations:'added a recommendation'};
  var boardTypeReadable={ask:'Ask Board',offer:'Offer Board',collab:'Collaboration',recommendations:'Recommendations'};
  if(props.loading)return<div aria-busy="true" aria-label="Loading activity" style={{display:'flex',flexDirection:'column',gap:'10px'}}>{[1,2,3,4,5,6].map(function(i){return<div key={i} style={{height:'68px',background:ELEV,borderRadius:'10px'}}/>;})}</div>;
  if(feed.length===0)return(
    <div role="status" style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'64px 32px',gap:'12px'}}>
      <div style={{width:'56px',height:'56px',borderRadius:'12px',background:CARD,border:'1px solid '+BDR,display:'flex',alignItems:'center',justifyContent:'center',color:MUTED}}><IconActivity size={26}/></div>
      <h2 style={{fontSize:'17px',fontWeight:700,color:TEXT,margin:0}}>No activity yet</h2>
      <p style={{fontSize:'13px',color:TEXT2,maxWidth:'360px',lineHeight:1.65,margin:0}}>When orgs post to this board, their activity will appear here.</p>
    </div>
  );
  var groups=[];var seenDates={};
  feed.forEach(function(post){
    var date=new Date(post.created_at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
    if(!seenDates[date]){seenDates[date]=true;groups.push({date:date,posts:[]});}
    groups[groups.length-1].posts.push(post);
  });
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'28px'}}>
      {groups.map(function(group){return(
        <div key={group.date}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:YELLOW,textTransform:'uppercase',letterSpacing:'3px',margin:0,whiteSpace:'nowrap'}}>{group.date}</p>
            <div style={{flex:1,height:'1px',background:BDR}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {group.posts.map(function(post){
              var color=boardTypeColors[post.board_type]||MUTED;
              var label=boardTypeLabels[post.board_type]||'posted';
              var boardLabel=boardTypeReadable[post.board_type]||'';
              return(
                <div key={post.id} style={{display:'flex',gap:'12px',padding:'12px 14px',background:CARD,border:'1px solid '+BDR,borderRadius:'10px',alignItems:'flex-start'}}>
                  <div style={{width:'34px',height:'34px',borderRadius:'50%',background:getAvatarColor(post.org_name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(post.org_name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',color:TEXT,lineHeight:1.4}}><strong>{post.org_name}</strong><span style={{color:TEXT2}}>{' '+label}</span></div>
                    <div style={{fontSize:'12px',color:TEXT2,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'2px'}}>{'\"'+post.title+'\"'}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'5px'}}>
                      <div style={{width:'6px',height:'6px',borderRadius:'50%',background:color,flexShrink:0}}/>
                      <span style={{fontSize:'11px',color:MUTED}}>{boardLabel}</span>
                      {post.category&&<><span style={{fontSize:'11px',color:MUTED}}>·</span><span style={{fontSize:'11px',color:MUTED}}>{post.category}</span></>}
                    </div>
                  </div>
                  <div style={{fontSize:'11px',color:MUTED,flexShrink:0}}>{timeAgo(post.created_at)}</div>
                </div>
              );
            })}
          </div>
        </div>
      );})}
    </div>
  );
}

function DeleteConfirmModal(props){
  var[deleting,setDeleting]=useState(false);
  async function handleConfirm(){setDeleting(true);await props.onConfirm(props.post.id);setDeleting(false);}
  return(
    <div role="dialog" aria-modal="true" aria-label="Confirm delete post" onClick={function(e){if(e.target===e.currentTarget)props.onCancel();}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60,padding:'16px'}}>
      <div style={{background:CARD,border:'1px solid '+BDR,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'400px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(239,68,68,0.10)',display:'flex',alignItems:'center',justifyContent:'center',color:RED,flexShrink:0}}><IconTrash size={16}/></div>
          <h2 style={{fontSize:'16px',fontWeight:700,color:TEXT,margin:0}}>Remove this post?</h2>
        </div>
        <p style={{fontSize:'13px',color:TEXT2,lineHeight:1.6,marginBottom:'6px'}}>"{props.post.title}"</p>
        <p style={{fontSize:'12px',color:MUTED,marginBottom:'20px'}}>{formatDateTime(props.post.created_at)+'. This cannot be undone.'}</p>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={props.onCancel} style={{flex:1,padding:'10px',background:'transparent',border:'1px solid '+BDR,borderRadius:'8px',color:TEXT2,fontSize:'13px',fontWeight:600,cursor:'pointer'}}>Keep Post</button>
          <button onClick={handleConfirm} disabled={deleting} style={{flex:1,padding:'10px',background:RED,border:'none',borderRadius:'8px',color:'#FFFFFF',fontSize:'13px',fontWeight:600,cursor:deleting?'not-allowed':'pointer',opacity:deleting?0.7:1}}>
            {deleting?'Removing...':'Remove Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionModal(props){
  var post=props.post,cfg=props.config,userOrgs=props.userOrgs,actionType=props.actionType;
  var titles={primary:cfg.primaryAction,info:'Request More Information'};
  var[orgId,setOrgId]=useState(userOrgs.length===1?userOrgs[0].id:'');
  var[message,setMessage]=useState('');
  var[sending,setSending]=useState(false);
  var approvedOrgIds=props.approvedOrgIds||[];
  var inputStyle={width:'100%',padding:'10px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'8px',color:TEXT,fontSize:'14px',boxSizing:'border-box',outline:'none',fontFamily:'inherit'};
  async function handleSend(){
    if(!orgId){toast.error('Select which org is sending this.');return;}
    if(!message.trim()){toast.error('Write a message first.');return;}
    setSending(true);
    try{
      var{data:authData}=await supabase.auth.getUser();
      var{error}=await supabase.from('cb_post_messages').insert({post_id:post.id,from_org_id:orgId,to_org_id:post.org_id,sender_user_id:authData.user.id,message:'['+titles[actionType]+'] '+message.trim(),is_read:false});
      if(error)throw error;
      supabase.from('community_board_posts').update({last_activity_at:new Date().toISOString()}).eq('id',post.id).then(function(){});
      await supabase.from('community_board_posts').update({status:'pending'}).eq('id',post.id).eq('status','open');
      await insertCBNotifications(orgId,post.org_id,props.boardName,post.board_id,userOrgs);
      mascotSuccessToast('Message sent to '+post.org_name+'.');
      props.onSuccess();props.onClose();
    }catch(err){mascotErrorToast('Could not send message.','Please try again.');}
    finally{setSending(false);}
  }
  return(
    <div role="dialog" aria-modal="true" aria-label={titles[actionType]} onClick={function(e){if(e.target===e.currentTarget)props.onClose();}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60,padding:'16px'}}>
      <div style={{background:CARD,border:'1px solid '+BDR,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'440px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
          <h2 style={{fontSize:'16px',fontWeight:700,color:TEXT,margin:0}}>{titles[actionType]}</h2>
          <button onClick={props.onClose} aria-label="Close" style={{width:'28px',height:'28px',borderRadius:'50%',background:BDR,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:TEXT2}}><IconX size={12}/></button>
        </div>
        <div style={{background:cfg.cardBg,borderRadius:'8px',padding:'10px',marginBottom:'16px'}}>
          <span style={{display:'inline-block',padding:'2px 6px',borderRadius:'3px',fontSize:'10px',fontWeight:700,textTransform:'uppercase',marginBottom:'5px',background:cfg.tagBg,color:cfg.tagText}}>{post.category}</span>
          <div style={{fontSize:'12px',fontWeight:700,color:TEXT}}>{post.title}</div>
          <div style={{fontSize:'11px',color:'#6B7280',marginTop:'4px'}}>{post.org_name+' · '+timeAgo(post.created_at)}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {userOrgs.length>1&&<div><label htmlFor="am-org" style={{display:'block',fontSize:'12px',fontWeight:600,color:TEXT2,marginBottom:'6px'}}>From</label><select id="am-org" value={orgId} onChange={function(e){setOrgId(e.target.value);}} style={inputStyle}><option value="">Select organization...</option>{userOrgs.map(function(o){var isMember=approvedOrgIds.indexOf(o.id)!==-1;return<option key={o.id} value={o.id} disabled={!isMember}>{o.name+(!isMember?' (not on this board)':'')}</option>;})}</select></div>}
          <div>
            <label htmlFor="am-msg" style={{display:'block',fontSize:'12px',fontWeight:600,color:TEXT2,marginBottom:'6px'}}>Message</label>
            <textarea id="am-msg" value={message} onChange={function(e){setMessage(e.target.value);}} rows={4} maxLength={500} placeholder="Write your message..." style={Object.assign({},inputStyle,{resize:'vertical',lineHeight:1.6})}/>
            <p style={{fontSize:'11px',color:MUTED,margin:'4px 0 0',textAlign:'right'}}>{message.length+'/500'}</p>
          </div>
          <button onClick={handleSend} disabled={sending} style={{padding:'12px',background:cfg.tagBg,color:cfg.tagText,border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:sending?'not-allowed':'pointer',opacity:sending?0.7:1}}>
            {sending?'Sending...':'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorContactRow(props){
  var c=props.contact,idx=props.index;
  var inputStyle={padding:'8px 10px',background:ELEV,border:'1px solid '+BDR,borderRadius:'7px',color:TEXT,fontSize:'13px',boxSizing:'border-box',outline:'none',fontFamily:'inherit',width:'100%'};
  function update(field,val){props.onChange(idx,Object.assign({},c,{[field]:val}));}
  return(
    <div style={{padding:'12px',background:CARD,border:'1px solid '+BDR,borderRadius:'10px',position:'relative'}}>
      <button onClick={function(){props.onRemove(idx);}} aria-label={'Remove contact '+(idx+1)} style={{position:'absolute',top:'8px',right:'8px',width:'22px',height:'22px',borderRadius:'50%',background:'rgba(239,68,68,0.10)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:RED}}><IconX size={10}/></button>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',paddingRight:'28px'}}>
        <div>
          <label htmlFor={'vc-name-'+idx} style={{display:'block',fontSize:'11px',fontWeight:600,color:MUTED,marginBottom:'3px'}}>Name <span style={{color:RED}}>*</span></label>
          <input id={'vc-name-'+idx} type="text" value={c.name||''} onChange={function(e){update('name',e.target.value);}} maxLength={80} placeholder="Jane Smith" style={inputStyle}/>
        </div>
        <div>
          <label htmlFor={'vc-title-'+idx} style={{display:'block',fontSize:'11px',fontWeight:600,color:MUTED,marginBottom:'3px'}}>Title</label>
          <input id={'vc-title-'+idx} type="text" value={c.title||''} onChange={function(e){update('title',e.target.value);}} maxLength={80} placeholder="Account Manager" style={inputStyle}/>
        </div>
        <div>
          <label htmlFor={'vc-email-'+idx} style={{display:'block',fontSize:'11px',fontWeight:600,color:MUTED,marginBottom:'3px'}}>Email</label>
          <input id={'vc-email-'+idx} type="email" value={c.email||''} onChange={function(e){update('email',e.target.value);}} maxLength={120} placeholder="jane@vendor.com" style={inputStyle}/>
        </div>
        <div>
          <label htmlFor={'vc-phone-'+idx} style={{display:'block',fontSize:'11px',fontWeight:600,color:MUTED,marginBottom:'3px'}}>Phone</label>
          <input id={'vc-phone-'+idx} type="tel" value={c.phone||''} onChange={function(e){update('phone',e.target.value);}} maxLength={30} placeholder="555-123-4567" style={inputStyle}/>
        </div>
      </div>
    </div>
  );
}

function PostModal(props){
  var cfg=props.config,userOrgs=props.userOrgs,editingPost=props.editingPost;
  var isEditing=!!editingPost;
  var isRec=props.boardType==='recommendations';
  var[orgId,setOrgId]=useState(editingPost?editingPost.org_id:(userOrgs.length===1?userOrgs[0].id:''));
  var[category,setCategory]=useState(editingPost?editingPost.category:cfg.categories[0]);
  var[title,setTitle]=useState(editingPost?editingPost.title:'');
  var[body,setBody]=useState(editingPost?editingPost.body:'');
  var[websiteUrl,setWebsiteUrl]=useState(editingPost?editingPost.website_url||'':'');
  var[contacts,setContacts]=useState([]);
  var[contactsLoading,setContactsLoading]=useState(false);
  var[saving,setSaving]=useState(false);
  var inputStyle={width:'100%',padding:'10px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'8px',color:TEXT,fontSize:'14px',boxSizing:'border-box',outline:'none',fontFamily:'inherit'};
  useEffect(function(){
    if(isEditing&&isRec&&editingPost.id){
      setContactsLoading(true);
      supabase.from('vendor_contacts').select('*').eq('post_id',editingPost.id).order('display_order',{ascending:true})
        .then(function(result){setContacts(result.data||[]);setContactsLoading(false);});
    }
  },[]);
  function addContact(){setContacts(function(prev){return prev.concat([{name:'',title:'',email:'',phone:'',_isNew:true}]);});}
  function updateContact(idx,updated){setContacts(function(prev){return prev.map(function(c,i){return i===idx?updated:c;});});}
  function removeContact(idx){setContacts(function(prev){return prev.filter(function(_,i){return i!==idx;});});}
  async function saveContacts(postId){
    var existing=contacts.filter(function(c){return c.id;});
    var newOnes=contacts.filter(function(c){return!c.id;});
    var existingIds=existing.map(function(c){return c.id;});
    var{data:origContacts}=await supabase.from('vendor_contacts').select('id').eq('post_id',postId);
    var origIds=(origContacts||[]).map(function(c){return c.id;});
    var toDelete=origIds.filter(function(id){return existingIds.indexOf(id)===-1;});
    if(toDelete.length>0)await supabase.from('vendor_contacts').delete().in('id',toDelete);
    for(var i=0;i<existing.length;i++){var c=existing[i];await supabase.from('vendor_contacts').update({name:c.name,title:c.title||null,email:c.email||null,phone:c.phone||null,display_order:i}).eq('id',c.id);}
    if(newOnes.length>0){var rows=newOnes.map(function(c,ni){return{post_id:postId,name:c.name,title:c.title||null,email:c.email||null,phone:c.phone||null,display_order:existing.length+ni};});await supabase.from('vendor_contacts').insert(rows);}
  }
  async function handleSubmit(){
    if(!orgId){toast.error('Select which org is posting.');return;}
    if(!title.trim()){toast.error(isRec?'Add a vendor name.':'Add a headline.');return;}
    if(!body.trim()){toast.error('Add some details.');return;}
    if(isRec){var invalidContact=contacts.find(function(c){return!c.name||!c.name.trim();});if(invalidContact){toast.error('Each contact needs a name.');return;}}
    setSaving(true);
    try{
      if(isEditing){
        var updateData={category:category,title:title.trim(),body:body.trim()};
        if(isRec)updateData.website_url=websiteUrl.trim()||null;
        var{error}=await supabase.from('community_board_posts').update(updateData).eq('id',editingPost.id);
        if(error)throw error;
        if(isRec)await saveContacts(editingPost.id);
        mascotSuccessToast('Post updated.');
      }else{
        var{data:authData}=await supabase.auth.getUser();
        var now=new Date();
        var expiresAt=new Date(now.getTime()+60*24*60*60*1000).toISOString();
        var insertData={board_id:props.boardId,board_type:props.boardType,category:category,title:title.trim(),body:body.trim(),org_id:orgId,created_by:authData.user.id,status:'open',is_active:true,response_count:0,expires_at:expiresAt,last_activity_at:now.toISOString()};
        if(isRec)insertData.website_url=websiteUrl.trim()||null;
        var{data:newPost,error:ie}=await supabase.from('community_board_posts').insert(insertData).select().single();
        if(ie)throw ie;
        if(isRec&&contacts.length>0&&newPost)await saveContacts(newPost.id);
        mascotSuccessToast('Post published to the board.');
      }
      props.onSuccess();props.onClose();
    }catch(err){mascotErrorToast('Could not save post.','Please try again.');}
    finally{setSaving(false);}
  }
  return(
    <div role="dialog" aria-modal="true" aria-label={(isEditing?'Edit post':'Post to ')+cfg.label} onClick={function(e){if(e.target===e.currentTarget)props.onClose();}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:'16px'}}>
      <div style={{background:CARD,border:'1px solid '+BDR,borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'520px',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
          <h2 style={{fontSize:'16px',fontWeight:700,color:TEXT,margin:0}}>{isEditing?'Edit Post':cfg.buttonLabel}</h2>
          <button onClick={props.onClose} aria-label="Close" style={{width:'28px',height:'28px',borderRadius:'50%',background:BDR,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:TEXT2}}><IconX size={12}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {!isEditing&&userOrgs.length>1&&<div><label htmlFor="pm-org" style={{display:'block',fontSize:'12px',fontWeight:600,color:TEXT2,marginBottom:'6px'}}>Posting as</label><select id="pm-org" value={orgId} onChange={function(e){setOrgId(e.target.value);}} style={inputStyle}><option value="">Select organization...</option>{userOrgs.map(function(o){return<option key={o.id} value={o.id}>{o.name}</option>;})}</select></div>}
          <div><label htmlFor="pm-cat" style={{display:'block',fontSize:'12px',fontWeight:600,color:TEXT2,marginBottom:'6px'}}>Category</label><select id="pm-cat" value={category} onChange={function(e){setCategory(e.target.value);}} style={inputStyle}>{cfg.categories.map(function(c){return<option key={c} value={c}>{c}</option>;})}</select></div>
          <div>
            <label htmlFor="pm-title" style={{display:'block',fontSize:'12px',fontWeight:600,color:TEXT2,marginBottom:'6px'}}>{isRec?'Vendor / Provider Name':'Headline'}</label>
            <input id="pm-title" type="text" value={title} onChange={function(e){setTitle(e.target.value);}} maxLength={120} placeholder={isRec?'e.g. Toledo Print Solutions':'e.g. Looking for a printing vendor under $500'} style={inputStyle}/>
            <p style={{fontSize:'11px',color:MUTED,margin:'4px 0 0',textAlign:'right'}}>{title.length+'/120'}</p>
          </div>
          {isRec&&<div><label htmlFor="pm-website" style={{display:'block',fontSize:'12px',fontWeight:600,color:TEXT2,marginBottom:'6px'}}>Website <span style={{fontWeight:400,color:MUTED,fontSize:'11px'}}>(optional)</span></label><input id="pm-website" type="url" value={websiteUrl} onChange={function(e){setWebsiteUrl(e.target.value);}} maxLength={300} placeholder="https://vendor.com" style={inputStyle}/></div>}
          <div>
            <label htmlFor="pm-body" style={{display:'block',fontSize:'12px',fontWeight:600,color:TEXT2,marginBottom:'6px'}}>{isRec?'Why you recommend them':'Details'}</label>
            <textarea id="pm-body" value={body} onChange={function(e){setBody(e.target.value);}} rows={4} maxLength={500} placeholder={isRec?'Describe your experience, pricing range...':'Provide context — timeline, quantities...'} style={Object.assign({},inputStyle,{resize:'vertical',lineHeight:1.6})}/>
            <p style={{fontSize:'11px',color:MUTED,margin:'4px 0 0',textAlign:'right'}}>{body.length+'/500'}</p>
          </div>
          {isRec&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                <label style={{fontSize:'12px',fontWeight:600,color:TEXT2}}>Contacts <span style={{fontWeight:400,color:MUTED,fontSize:'11px'}}>(optional)</span></label>
                <button onClick={addContact} style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'6px',fontSize:'12px',fontWeight:600,background:ELEV,border:'1px solid '+BDR,color:TEXT2,cursor:'pointer'}}><IconPlus size={11}/>Add Contact</button>
              </div>
              {contactsLoading?<div aria-busy="true" style={{height:'60px',background:ELEV,borderRadius:'10px'}}/>
              :contacts.length===0?<div style={{padding:'16px',background:ELEV,borderRadius:'10px',textAlign:'center'}}><p style={{fontSize:'12px',color:MUTED,margin:0}}>No contacts added yet.</p></div>
              :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{contacts.map(function(c,i){return<VendorContactRow key={c.id||'new-'+i} contact={c} index={i} onChange={updateContact} onRemove={removeContact}/>;})}</div>}
            </div>
          )}
          {!isEditing&&<p style={{fontSize:'11px',color:MUTED,margin:'-8px 0 0',display:'flex',alignItems:'center',gap:'5px'}}><IconClock size={11}/>Posts expire after 60 days. You can renew anytime.</p>}
          <button onClick={handleSubmit} disabled={saving} style={{padding:'12px',background:BLUE,color:'#FFFFFF',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:600,cursor:saving?'not-allowed':'pointer',opacity:saving?0.7:1}}>
            {saving?(isEditing?'Saving...':'Publishing...'):(isEditing?'Save Changes':'Publish to Board')}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostChatPanel(props){
  var boardName=props.boardName,post=props.post,isOwn=props.isOwn,userOrgs=props.userOrgs,onClose=props.onClose,onMarkRead=props.onMarkRead;
  var approvedOrgIds=props.approvedOrgIds||[];
  var otherOrgs=userOrgs.filter(function(o){return o.id!==post.org_id;});
  var canReply=otherOrgs.length>0;
  var[replyMode,setReplyMode]=useState(false);
  var[myOrgId,setMyOrgId]=useState(isOwn?post.org_id:(userOrgs.length===1?userOrgs[0].id:null));
  var[view,setView]=useState(isOwn?'list':'thread');
  var[partnerOrgId,setPartnerOrgId]=useState(isOwn?null:post.org_id);
  var[partnerOrgName,setPartnerOrgName]=useState(isOwn?null:post.org_name);
  var[messages,setMessages]=useState([]);
  var[conversations,setConversations]=useState([]);
  var[loading,setLoading]=useState(true);
  var[newMsg,setNewMsg]=useState('');
  var[sending,setSending]=useState(false);
  var messagesEndRef=useRef(null);
  var channelRef=useRef(null);
  function enterReplyMode(){var eligibleOrgs=otherOrgs.filter(function(o){return approvedOrgIds.indexOf(o.id)!==-1;});var replyOrgId=eligibleOrgs.length===1?eligibleOrgs[0].id:null;setReplyMode(true);setMyOrgId(replyOrgId);setPartnerOrgId(post.org_id);setPartnerOrgName(post.org_name);setView('thread');setMessages([]);}
  function exitReplyMode(){setReplyMode(false);setMyOrgId(post.org_id);setPartnerOrgId(null);setPartnerOrgName(null);setView('list');setMessages([]);if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}}
  useEffect(function(){
    if(!myOrgId){setLoading(false);return;}
    if(view==='thread'&&partnerOrgId){loadThread();subscribeToThread();}
    else if(view==='list'){loadConversations();}
    return function(){if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}};
  },[view,myOrgId,partnerOrgId]);
  useEffect(function(){if(view==='thread'&&messagesEndRef.current)messagesEndRef.current.scrollIntoView({behavior:'smooth'});},[messages]);
  async function loadThread(){
    setLoading(true);
    try{
      var{data,error}=await supabase.from('cb_post_messages').select('*').eq('post_id',post.id)
        .or('and(from_org_id.eq.'+myOrgId+',to_org_id.eq.'+partnerOrgId+'),and(from_org_id.eq.'+partnerOrgId+',to_org_id.eq.'+myOrgId+')').order('created_at',{ascending:true});
      if(error)throw error;
      setMessages(data||[]);
      var unreadIds=(data||[]).filter(function(m){return!m.is_read&&m.to_org_id===myOrgId;}).map(function(m){return m.id;});
      if(unreadIds.length>0){await supabase.from('cb_post_messages').update({is_read:true}).in('id',unreadIds);if(onMarkRead)onMarkRead(post.id,unreadIds.length);}
    }catch(err){toast.error('Could not load messages.');}
    finally{setLoading(false);}
  }
  async function loadConversations(){
    setLoading(true);
    try{
      var{data,error}=await supabase.from('cb_post_messages').select('*').eq('post_id',post.id).or('from_org_id.eq.'+myOrgId+',to_org_id.eq.'+myOrgId).order('created_at',{ascending:false});
      if(error)throw error;
      var convMap={};
      (data||[]).forEach(function(m){var partnerId=m.from_org_id===myOrgId?m.to_org_id:m.from_org_id;if(!convMap[partnerId])convMap[partnerId]={orgId:partnerId,orgName:'',messages:[],unread:0};convMap[partnerId].messages.push(m);if(!m.is_read&&m.to_org_id===myOrgId)convMap[partnerId].unread++;});
      var partnerIds=Object.keys(convMap);
      if(partnerIds.length>0){var{data:orgs}=await supabase.from('organizations').select('id,name').in('id',partnerIds);(orgs||[]).forEach(function(o){if(convMap[o.id])convMap[o.id].orgName=o.name;});}
      setConversations(Object.values(convMap).map(function(c){return Object.assign({},c,{lastMessage:c.messages[0]});}));
    }catch(err){toast.error('Could not load conversations.');}
    finally{setLoading(false);}
  }
  function subscribeToThread(){
    if(channelRef.current)supabase.removeChannel(channelRef.current);
    channelRef.current=supabase.channel('cb-thread-'+post.id+'-'+myOrgId+'-'+(partnerOrgId||''))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'cb_post_messages',filter:'post_id=eq.'+post.id},function(payload){
        var msg=payload.new;
        var isRelevant=(msg.from_org_id===myOrgId&&msg.to_org_id===partnerOrgId)||(msg.from_org_id===partnerOrgId&&msg.to_org_id===myOrgId);
        if(!isRelevant)return;
        setMessages(function(prev){return prev.concat([msg]);});
        if(msg.to_org_id===myOrgId){supabase.from('cb_post_messages').update({is_read:true}).eq('id',msg.id);if(onMarkRead)onMarkRead(post.id,1);}
      }).subscribe();
  }
  async function handleSend(){
    if(!newMsg.trim())return;
    if(!myOrgId){toast.error('Select which org you are chatting as.');return;}
    setSending(true);
    try{
      var{data:authData}=await supabase.auth.getUser();
      var{error}=await supabase.from('cb_post_messages').insert({post_id:post.id,from_org_id:myOrgId,to_org_id:partnerOrgId,sender_user_id:authData.user.id,message:newMsg.trim(),is_read:false});
      if(error)throw error;
      setNewMsg('');
      insertCBNotifications(myOrgId,partnerOrgId,boardName,post.board_id,userOrgs);
      supabase.from('community_board_posts').update({last_activity_at:new Date().toISOString()}).eq('id',post.id).then(function(){});
    }catch(err){mascotErrorToast('Could not send message.','Please try again.');}
    finally{setSending(false);}
  }
  function openThread(conv){setPartnerOrgId(conv.orgId);setPartnerOrgName(conv.orgName);setView('thread');}
  function goBackToList(){setView('list');setPartnerOrgId(null);setPartnerOrgName(null);setMessages([]);if(channelRef.current){supabase.removeChannel(channelRef.current);channelRef.current=null;}loadConversations();}
  var inputStyle={width:'100%',padding:'9px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'8px',color:TEXT,fontSize:'13px',boxSizing:'border-box',outline:'none',fontFamily:'inherit'};
  var headerTitle=view==='thread'?(partnerOrgName||'Chat'):'Messages';
  var showBackButton=(view==='thread'&&isOwn&&!replyMode)||(view==='thread'&&replyMode&&otherOrgs.length>1);
  return(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.20)',zIndex:35}} aria-hidden="true"/>
      <div role="dialog" aria-modal="true" aria-label={'Chat: '+post.title} style={{position:'fixed',top:0,right:0,bottom:0,width:'380px',maxWidth:'100vw',background:CARD,borderLeft:'1px solid '+BDR,zIndex:36,display:'flex',flexDirection:'column',boxShadow:'-4px 0 24px rgba(0,0,0,0.08)'}}>
        <div style={{padding:'16px 16px 0',borderBottom:'1px solid '+BDR,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
            {showBackButton&&<button onClick={replyMode?exitReplyMode:goBackToList} aria-label="Back" style={{width:'28px',height:'28px',borderRadius:'50%',background:ELEV,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:TEXT2,flexShrink:0}}><IconChevronLeft size={14}/></button>}
            <div style={{flex:1,minWidth:0}}>
              <h2 style={{fontSize:'13px',fontWeight:700,color:TEXT,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{headerTitle}</h2>
              <p style={{fontSize:'11px',color:MUTED,margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{'\"'+post.title+'\"'}</p>
            </div>
            <button onClick={onClose} aria-label="Close chat" style={{width:'28px',height:'28px',borderRadius:'50%',background:ELEV,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,flexShrink:0}}><IconX size={12}/></button>
          </div>
          {isOwn&&canReply&&(
            <div style={{display:'flex',gap:'4px',marginBottom:'12px',background:ELEV,borderRadius:'8px',padding:'3px'}}>
              <button onClick={exitReplyMode} aria-pressed={!replyMode} style={{flex:1,padding:'6px',borderRadius:'6px',border:'none',fontSize:'12px',fontWeight:600,cursor:'pointer',background:!replyMode?CARD:'transparent',color:!replyMode?TEXT:MUTED,boxShadow:!replyMode?'0 1px 3px rgba(0,0,0,0.08)':'none'}}>Received</button>
              <button onClick={enterReplyMode} aria-pressed={replyMode} style={{flex:1,padding:'6px',borderRadius:'6px',border:'none',fontSize:'12px',fontWeight:600,cursor:'pointer',background:replyMode?CARD:'transparent',color:replyMode?TEXT:MUTED,boxShadow:replyMode?'0 1px 3px rgba(0,0,0,0.08)':'none'}}>Reply as Org</button>
            </div>
          )}
          {replyMode&&otherOrgs.length>1&&<div style={{marginBottom:'12px'}}><label htmlFor="cp-reply-org" style={{fontSize:'10px',fontWeight:600,color:MUTED,display:'block',marginBottom:'4px'}}>Replying as</label><select id="cp-reply-org" value={myOrgId||''} onChange={function(e){setMyOrgId(e.target.value);setMessages([]);}} style={Object.assign({},inputStyle,{fontSize:'12px',padding:'6px 10px'})}><option value="">Select...</option>{otherOrgs.map(function(o){var isMember=approvedOrgIds.indexOf(o.id)!==-1;return<option key={o.id} value={o.id} disabled={!isMember}>{o.name}</option>;})}</select></div>}
          {!isOwn&&!replyMode&&userOrgs.length>1&&<div style={{marginBottom:'12px'}}><label htmlFor="cp-org" style={{fontSize:'10px',fontWeight:600,color:MUTED,display:'block',marginBottom:'4px'}}>Chatting as</label><select id="cp-org" value={myOrgId||''} onChange={function(e){setMyOrgId(e.target.value);setMessages([]);}} style={Object.assign({},inputStyle,{fontSize:'12px',padding:'6px 10px'})}><option value="">Select...</option>{userOrgs.map(function(o){return<option key={o.id} value={o.id}>{o.name}</option>;})}</select></div>}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'12px 16px'}}>
          {loading?<div aria-busy="true" style={{display:'flex',flexDirection:'column',gap:'10px'}}>{[1,2,3].map(function(i){return<div key={i} style={{height:'52px',background:ELEV,borderRadius:'10px'}}/>;})}</div>
          :view==='list'?(
            conversations.length===0?<div role="status" style={{textAlign:'center',padding:'40px 16px'}}><div style={{width:'44px',height:'44px',borderRadius:'12px',background:ELEV,display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,margin:'0 auto 12px'}}><IconMessageCircle size={22}/></div><p style={{fontSize:'14px',fontWeight:700,color:TEXT,margin:'0 0 6px'}}>No messages yet</p><p style={{fontSize:'13px',color:TEXT2,lineHeight:1.6,margin:0}}>When other orgs respond, messages will appear here.</p></div>
            :<div style={{display:'flex',flexDirection:'column',gap:'6px'}}>{conversations.map(function(conv){return<button key={conv.orgId} onClick={function(){openThread(conv);}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'10px',cursor:'pointer',textAlign:'left',width:'100%'}}><div style={{width:'36px',height:'36px',borderRadius:'50%',background:getAvatarColor(conv.orgName),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(conv.orgName)}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',fontWeight:700,color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{conv.orgName}</div><div style={{fontSize:'11px',color:MUTED,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{conv.lastMessage?conv.lastMessage.message:''}</div></div>{conv.unread>0&&<span style={{background:BLUE,color:'#FFFFFF',borderRadius:'99px',padding:'1px 7px',fontSize:'10px',fontWeight:700}}>{conv.unread}</span>}</button>;})}</div>
          ):(
            messages.length===0?<div role="status" style={{textAlign:'center',padding:'40px 16px'}}><div style={{width:'44px',height:'44px',borderRadius:'12px',background:ELEV,display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,margin:'0 auto 12px'}}><IconMessageCircle size={22}/></div><p style={{fontSize:'14px',fontWeight:700,color:TEXT,margin:'0 0 6px'}}>Start the conversation</p><p style={{fontSize:'13px',color:TEXT2,lineHeight:1.6,margin:0}}>{'Send a message to '+(partnerOrgName||'this org')+'.'}</p></div>
            :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{messages.map(function(msg){var isMine=msg.from_org_id===myOrgId;return<div key={msg.id} style={{display:'flex',justifyContent:isMine?'flex-end':'flex-start',alignItems:'flex-end',gap:'6px'}}>{!isMine&&<div style={{width:'26px',height:'26px',borderRadius:'50%',background:getAvatarColor(partnerOrgName||''),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(partnerOrgName||'')}</div>}<div style={{maxWidth:'75%'}}><div style={{padding:'8px 12px',borderRadius:isMine?'12px 12px 2px 12px':'12px 12px 12px 2px',background:isMine?BLUE:ELEV,color:isMine?'#FFFFFF':TEXT,fontSize:'13px',lineHeight:1.5,wordBreak:'break-word'}}>{msg.message}</div><div style={{fontSize:'10px',color:MUTED,marginTop:'3px',textAlign:isMine?'right':'left'}}>{timeAgo(msg.created_at)}</div></div></div>;})}
            <div ref={messagesEndRef}/></div>
          )}
        </div>
        {view==='thread'&&myOrgId&&(
          <div style={{padding:'12px 16px',borderTop:'1px solid '+BDR,flexShrink:0}}>
            <div style={{display:'flex',gap:'8px',alignItems:'flex-end'}}>
              <textarea value={newMsg} onChange={function(e){setNewMsg(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}} placeholder="Type a message..." rows={2} maxLength={500} style={{flex:1,padding:'8px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'8px',color:TEXT,fontSize:'13px',resize:'none',lineHeight:1.5,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
              <button onClick={handleSend} disabled={sending||!newMsg.trim()} aria-label="Send" style={{width:'36px',height:'36px',borderRadius:'8px',background:(newMsg.trim()&&!sending)?BLUE:ELEV,border:'none',color:(newMsg.trim()&&!sending)?'#FFFFFF':MUTED,cursor:(newMsg.trim()&&!sending)?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IconSend size={14}/></button>
            </div>
            <p style={{fontSize:'10px',color:MUTED,margin:'4px 0 0'}}>Enter to send · Shift+Enter for new line</p>
          </div>
        )}
        {view==='thread'&&!myOrgId&&<div style={{padding:'12px 16px',borderTop:'1px solid '+BDR}}><p style={{fontSize:'12px',color:MUTED,margin:0,textAlign:'center'}}>Select an organization above to chat.</p></div>}
      </div>
    </>
  );
}

function AdminPanel(props){
  var board=props.board,boardId=props.boardId,userOrgIds=props.userOrgIds||[];
  var[adminTab,setAdminTab]=useState('requests');
  var[memberships,setMemberships]=useState([]);
  var[loading,setLoading]=useState(true);
  var[processing,setProcessing]=useState({});
  var[inboxMessages,setInboxMessages]=useState([]);
  var[inboxLoading,setInboxLoading]=useState(false);
  var[inboxFilter,setInboxFilter]=useState('all');
  var[editName,setEditName]=useState(board.name||'');
  var[editDesc,setEditDesc]=useState(board.description||'');
  var[editCity,setEditCity]=useState(board.city||'');
  var[editState,setEditState]=useState(board.state||'');
  var[editCounty,setEditCounty]=useState(board.county||'');
  var[editZip,setEditZip]=useState(board.zip_code||'');
  var[editVisibility,setEditVisibility]=useState(board.visibility||'public');
  var[editTheme,setEditTheme]=useState(board.theme||'general');
  var[savingSettings,setSavingSettings]=useState(false);
  var[inviteExpiry,setInviteExpiry]=useState('30');
  var[customExpiry,setCustomExpiry]=useState('');
  var[generatingLink,setGeneratingLink]=useState(false);
  var[generalInvites,setGeneralInvites]=useState([]);
  var[directInvites,setDirectInvites]=useState([]);
  var[loadingInvites,setLoadingInvites]=useState(false);
  var[orgSearch,setOrgSearch]=useState('');
  var[orgResults,setOrgResults]=useState([]);
  var[selectedInviteOrg,setSelectedInviteOrg]=useState(null);
  var[sendingOrgInvite,setSendingOrgInvite]=useState(false);
  var[copiedId,setCopiedId]=useState(null);
  useEffect(function(){loadMemberships();},[]);
  useEffect(function(){if(adminTab==='invites')loadInvites();if(adminTab==='inbox')loadInbox();},[adminTab]);
  async function loadMemberships(){setLoading(true);try{var{data,error}=await supabase.rpc('get_board_memberships',{p_board_id:boardId});if(error)throw error;setMemberships(data||[]);}catch(err){toast.error('Could not load members.');}finally{setLoading(false);}}
  async function loadInbox(){
    if(!userOrgIds||userOrgIds.length===0)return;setInboxLoading(true);
    try{
      var{data:boardPosts}=await supabase.from('community_board_posts').select('id,title,board_type').eq('board_id',boardId).eq('is_active',true);
      var postMap={};(boardPosts||[]).forEach(function(p){postMap[p.id]=p;});
      var postIds=Object.keys(postMap);
      if(postIds.length===0){setInboxMessages([]);setInboxLoading(false);return;}
      var{data:msgs}=await supabase.from('cb_post_messages').select('*').in('post_id',postIds).in('to_org_id',userOrgIds).order('created_at',{ascending:false});
      var senderOrgIds=[];(msgs||[]).forEach(function(m){if(senderOrgIds.indexOf(m.from_org_id)===-1)senderOrgIds.push(m.from_org_id);});
      var orgMap={};if(senderOrgIds.length>0){var{data:orgs}=await supabase.from('organizations').select('id,name').in('id',senderOrgIds);(orgs||[]).forEach(function(o){orgMap[o.id]=o.name;});}
      setInboxMessages((msgs||[]).map(function(m){return Object.assign({},m,{post_title:postMap[m.post_id]?postMap[m.post_id].title:'Unknown Post',from_org_name:orgMap[m.from_org_id]||'Unknown Org'});}));
    }catch(err){toast.error('Could not load inbox.');}finally{setInboxLoading(false);}
  }
  async function handleMarkInboxRead(messageId){try{await supabase.from('cb_post_messages').update({is_read:true}).eq('id',messageId);setInboxMessages(function(prev){return prev.map(function(m){return m.id===messageId?Object.assign({},m,{is_read:true}):m;});});}catch(err){}}
  async function handleMarkAllInboxRead(){var unreadIds=inboxMessages.filter(function(m){return!m.is_read;}).map(function(m){return m.id;});if(unreadIds.length===0)return;try{await supabase.from('cb_post_messages').update({is_read:true}).in('id',unreadIds);setInboxMessages(function(prev){return prev.map(function(m){return Object.assign({},m,{is_read:true});});});mascotSuccessToast('All messages marked as read.');}catch(err){mascotErrorToast('Could not mark messages read.');}}
  var inboxUnreadCount=inboxMessages.filter(function(m){return!m.is_read;}).length;
  var filteredInboxMessages=inboxFilter==='unread'?inboxMessages.filter(function(m){return!m.is_read;}):inboxMessages;
  async function handleApprove(membershipId,orgName){setProcessing(function(p){return Object.assign({},p,{[membershipId]:true});});try{var{data:authData}=await supabase.auth.getUser();var{data,error}=await supabase.rpc('approve_board_membership',{p_membership_id:membershipId,p_reviewer_id:authData.user.id});if(error)throw error;if(!data){toast.error('Could not approve.');return;}mascotSuccessToast(orgName+' approved.');loadMemberships();props.onMembershipChange();}catch(err){mascotErrorToast('Could not approve request.');}finally{setProcessing(function(p){return Object.assign({},p,{[membershipId]:false});});}}
  async function handleDeny(membershipId,orgName){setProcessing(function(p){return Object.assign({},p,{[membershipId]:true});});try{var{data:authData}=await supabase.auth.getUser();var{data,error}=await supabase.rpc('deny_board_membership',{p_membership_id:membershipId,p_reviewer_id:authData.user.id});if(error)throw error;if(!data){toast.error('Could not deny.');return;}toast.error(orgName+' request denied.');loadMemberships();}catch(err){mascotErrorToast('Could not deny request.');}finally{setProcessing(function(p){return Object.assign({},p,{[membershipId]:false});});}}
  async function handlePromote(membershipId,orgName,currentRole){var newRole=currentRole==='admin'?'member':'admin';setProcessing(function(p){return Object.assign({},p,{[membershipId+'r']:true});});try{var{error}=await supabase.from('community_board_memberships').update({role:newRole}).eq('id',membershipId);if(error)throw error;mascotSuccessToast(orgName+' is now a board '+newRole+'.');loadMemberships();}catch(err){mascotErrorToast('Could not update role.');}finally{setProcessing(function(p){return Object.assign({},p,{[membershipId+'r']:false});});}}
  async function handleRemove(membershipId,orgName){setProcessing(function(p){return Object.assign({},p,{[membershipId+'x']:true});});try{var{error}=await supabase.from('community_board_memberships').delete().eq('id',membershipId);if(error)throw error;mascotSuccessToast(orgName+' removed from board.');loadMemberships();props.onMembershipChange();}catch(err){mascotErrorToast('Could not remove org.');}finally{setProcessing(function(p){return Object.assign({},p,{[membershipId+'x']:false});});}}
  async function handleSaveSettings(){if(!editName.trim()){toast.error('Board name is required.');return;}setSavingSettings(true);try{var{error}=await supabase.from('community_boards').update({name:editName.trim(),description:editDesc.trim()||null,city:editCity.trim()||null,state:editState||null,county:editCounty.trim()||null,zip_code:editZip.trim()||null,visibility:editVisibility,theme:editTheme,updated_at:new Date().toISOString()}).eq('id',boardId);if(error)throw error;mascotSuccessToast('Board settings saved.');props.onSettingsChange();}catch(err){mascotErrorToast('Could not save settings.');}finally{setSavingSettings(false);}}
  async function loadInvites(){setLoadingInvites(true);try{var{data,error}=await supabase.from('community_board_invites').select('*').eq('board_id',boardId).order('created_at',{ascending:false});if(error)throw error;var generals=(data||[]).filter(function(i){return!i.invited_org_id;});var directs=(data||[]).filter(function(i){return!!i.invited_org_id;});if(directs.length>0){var orgIds=directs.map(function(i){return i.invited_org_id;});var{data:orgs}=await supabase.from('organizations').select('id,name').in('id',orgIds);var orgMap={};(orgs||[]).forEach(function(o){orgMap[o.id]=o.name;});directs=directs.map(function(i){return Object.assign({},i,{org_name:orgMap[i.invited_org_id]||'Unknown Org'});});}setGeneralInvites(generals);setDirectInvites(directs);}catch(err){toast.error('Could not load invites.');}finally{setLoadingInvites(false);}}
  async function generateInviteLink(){setGeneratingLink(true);try{var{data:authData}=await supabase.auth.getUser();var expiresAt=null;if(inviteExpiry==='custom'&&customExpiry){expiresAt=new Date(customExpiry).toISOString();}else if(inviteExpiry!=='none'){var d=new Date();d.setDate(d.getDate()+parseInt(inviteExpiry));expiresAt=d.toISOString();}var{data:inv,error}=await supabase.from('community_board_invites').insert({board_id:boardId,created_by_user_id:authData.user.id,invited_org_id:null,expires_at:expiresAt}).select().single();if(error)throw error;var link=window.location.origin+'/community-board/join?token='+inv.token;try{await navigator.clipboard.writeText(link);setCopiedId(inv.id);setTimeout(function(){setCopiedId(null);},3000);mascotSuccessToast('Invite link generated and copied.');}catch(clipErr){mascotSuccessToast('Invite link generated.');}loadInvites();}catch(err){mascotErrorToast('Could not generate link.');}finally{setGeneratingLink(false);}}
  async function searchOrgs(query){if(!query||query.length<2){setOrgResults([]);return;}try{var{data}=await supabase.from('organizations').select('id,name,type').ilike('name','%'+query+'%').limit(8);setOrgResults(data||[]);}catch(err){}}
  async function sendOrgInvite(){if(!selectedInviteOrg)return;setSendingOrgInvite(true);try{var{data:authData}=await supabase.auth.getUser();var{error}=await supabase.from('community_board_invites').insert({board_id:boardId,created_by_user_id:authData.user.id,invited_org_id:selectedInviteOrg.id,expires_at:null});if(error)throw error;mascotSuccessToast('Invite sent to '+selectedInviteOrg.name+'.');setSelectedInviteOrg(null);setOrgSearch('');setOrgResults([]);loadInvites();}catch(err){if(err.code==='23505'){toast.error('This org has already been invited.');}else{mascotErrorToast('Could not send invite.');}}finally{setSendingOrgInvite(false);}}
  async function deleteInvite(inviteId){try{var{error}=await supabase.from('community_board_invites').delete().eq('id',inviteId);if(error)throw error;mascotSuccessToast('Invite removed.');loadInvites();}catch(err){mascotErrorToast('Could not remove invite.');}}
  function copyInviteLink(token,id){var link=window.location.origin+'/community-board/join?token='+token;navigator.clipboard.writeText(link).then(function(){setCopiedId(id);setTimeout(function(){setCopiedId(null);},3000);mascotSuccessToast('Link copied.');});}
  function formatExpiry(dateStr){if(!dateStr)return'No expiry';var d=new Date(dateStr);if(d<new Date())return'Expired';return'Expires '+d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
  var pending=memberships.filter(function(m){return m.status==='pending';});
  var approved=memberships.filter(function(m){return m.status==='approved';});
  var inputStyle={width:'100%',padding:'9px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'8px',color:TEXT,fontSize:'13px',boxSizing:'border-box',outline:'none',fontFamily:'inherit'};
  var labelStyle={display:'block',fontSize:'11px',fontWeight:600,color:MUTED,marginBottom:'4px'};
  var badgeInbox=inboxMessages.length>0?inboxUnreadCount:(props.inboxUnreadCount||0);
  var adminTabs=[{key:'requests',label:'Requests',badge:pending.length},{key:'inbox',label:'Inbox',badge:badgeInbox},{key:'members',label:'Members',badge:0},{key:'invites',label:'Invites',badge:0},{key:'settings',label:'Settings',badge:0}];
  return(
    <>
      <div onClick={props.onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',zIndex:39}} aria-hidden="true"/>
      <div role="dialog" aria-modal="true" aria-label="Board Admin Panel" style={{position:'fixed',top:0,right:0,bottom:0,width:'440px',maxWidth:'100vw',background:CARD,borderLeft:'1px solid '+BDR,zIndex:40,display:'flex',flexDirection:'column',boxShadow:'-4px 0 24px rgba(0,0,0,0.08)'}}>
        <div style={{padding:'20px 20px 0',borderBottom:'1px solid '+BDR}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'rgba(139,92,246,0.10)',display:'flex',alignItems:'center',justifyContent:'center',color:PURPLE}}><IconSettings size={14}/></div>
              <h2 style={{fontSize:'15px',fontWeight:700,color:TEXT,margin:0}}>Manage Board</h2>
            </div>
            <button onClick={props.onClose} aria-label="Close admin panel" style={{width:'28px',height:'28px',borderRadius:'50%',background:ELEV,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:MUTED}}><IconX size={12}/></button>
          </div>
          <div style={{display:'flex',gap:'2px',overflowX:'auto'}}>
            {adminTabs.map(function(t){var isActive=adminTab===t.key;return(
              <button key={t.key} onClick={function(){setAdminTab(t.key);}} style={{padding:'8px 10px',border:'none',background:'transparent',fontSize:'12px',fontWeight:600,cursor:'pointer',color:isActive?BLUE:MUTED,borderBottom:isActive?'2px solid '+BLUE:'2px solid transparent',marginBottom:'-1px',display:'flex',alignItems:'center',gap:'5px',whiteSpace:'nowrap',flexShrink:0}}>
                {t.label}{t.badge>0&&<span style={{background:t.key==='inbox'?BLUE:RED,color:'#FFFFFF',borderRadius:'99px',padding:'1px 5px',fontSize:'10px',fontWeight:700}}>{t.badge}</span>}
              </button>
            );})}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
          {adminTab==='inbox'&&(
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <div style={{display:'flex',gap:'6px'}}>{['all','unread'].map(function(f){return<button key={f} onClick={function(){setInboxFilter(f);}} style={{padding:'5px 12px',borderRadius:'6px',fontSize:'12px',fontWeight:600,border:'1px solid '+BDR,background:inboxFilter===f?BLUE:CARD,color:inboxFilter===f?'#FFFFFF':TEXT2,cursor:'pointer'}}>{f==='all'?'All':'Unread'+(inboxUnreadCount>0?' ('+inboxUnreadCount+')':'')}</button>;})}</div>
                {inboxUnreadCount>0&&<button onClick={handleMarkAllInboxRead} style={{fontSize:'12px',fontWeight:600,color:BLUE,background:'none',border:'none',cursor:'pointer',padding:0}}>Mark all read</button>}
              </div>
              {inboxLoading?<div aria-busy="true" style={{display:'flex',flexDirection:'column',gap:'8px'}}>{[1,2,3].map(function(i){return<div key={i} style={{height:'88px',background:ELEV,borderRadius:'10px'}}/>;})}</div>
              :filteredInboxMessages.length===0?<div role="status" style={{textAlign:'center',padding:'40px 16px'}}><div style={{width:'44px',height:'44px',borderRadius:'12px',background:ELEV,display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,margin:'0 auto 12px'}}><IconInbox size={20}/></div><p style={{fontSize:'14px',fontWeight:700,color:TEXT,margin:'0 0 6px'}}>{inboxFilter==='unread'?'No unread messages':'No messages yet'}</p><p style={{fontSize:'13px',color:TEXT2,lineHeight:1.5,margin:0}}>{inboxFilter==='unread'?"You're all caught up.":'Messages from other orgs will appear here.'}</p></div>
              :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{filteredInboxMessages.map(function(msg){return(
                <div key={msg.id} style={{padding:'12px',background:msg.is_read?ELEV:'rgba(59,130,246,0.05)',border:'1px solid '+(msg.is_read?BDR:'rgba(59,130,246,0.22)'),borderRadius:'10px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:getAvatarColor(msg.from_org_name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(msg.from_org_name)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',marginBottom:'2px'}}><span style={{fontSize:'12px',fontWeight:700,color:TEXT}}>{msg.from_org_name}</span><span style={{fontSize:'10px',color:MUTED,flexShrink:0}}>{timeAgo(msg.created_at)}</span></div>
                      <div style={{fontSize:'11px',color:MUTED,marginBottom:'5px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{'Re: \"'+msg.post_title+'\"'}</div>
                      <div style={{fontSize:'12px',color:TEXT2,lineHeight:1.5,wordBreak:'break-word'}}>{msg.message}</div>
                    </div>
                  </div>
                  {!msg.is_read&&<div style={{display:'flex',justifyContent:'flex-end',marginTop:'8px'}}><button onClick={function(){handleMarkInboxRead(msg.id);}} style={{fontSize:'11px',fontWeight:600,color:BLUE,background:'none',border:'none',cursor:'pointer',padding:0}}>Mark as read</button></div>}
                </div>
              );})}
              </div>}
            </div>
          )}
          {adminTab==='requests'&&(
            loading?<div aria-busy="true" style={{display:'flex',flexDirection:'column',gap:'8px'}}>{[1,2,3].map(function(i){return<div key={i} style={{height:'72px',background:ELEV,borderRadius:'10px'}}/>;})}</div>
            :pending.length===0?<div role="status" style={{textAlign:'center',padding:'40px 16px'}}><div style={{width:'44px',height:'44px',borderRadius:'12px',background:ELEV,display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,margin:'0 auto 12px'}}><IconBell size={20}/></div><p style={{fontSize:'14px',fontWeight:700,color:TEXT,margin:'0 0 6px'}}>No pending requests</p><p style={{fontSize:'13px',color:TEXT2}}>New join requests will appear here.</p></div>
            :<div style={{display:'flex',flexDirection:'column',gap:'10px'}}>{pending.map(function(m){var busy=processing[m.id];return(
              <div key={m.id} style={{background:ELEV,border:'1px solid '+BDR,borderRadius:'10px',padding:'12px 14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'50%',background:getAvatarColor(m.org_name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(m.org_name)}</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',fontWeight:700,color:TEXT}}>{m.org_name}</div><div style={{fontSize:'11px',color:MUTED}}>{(m.org_type||'Organization')+' · '+timeAgo(m.created_at)}</div></div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={function(){handleApprove(m.id,m.org_name);}} disabled={busy} style={{flex:1,padding:'7px',background:'rgba(34,197,94,0.10)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:'6px',color:'#16A34A',fontSize:'12px',fontWeight:700,cursor:busy?'not-allowed':'pointer',opacity:busy?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}><IconCheck size={12}/>{busy?'...':'Approve'}</button>
                  <button onClick={function(){handleDeny(m.id,m.org_name);}} disabled={busy} style={{flex:1,padding:'7px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'6px',color:RED,fontSize:'12px',fontWeight:700,cursor:busy?'not-allowed':'pointer',opacity:busy?0.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}><IconX size={11}/>{busy?'...':'Deny'}</button>
                </div>
              </div>
            );})}
            </div>
          )}
          {adminTab==='members'&&(
            loading?<div aria-busy="true" style={{display:'flex',flexDirection:'column',gap:'8px'}}>{[1,2,3,4].map(function(i){return<div key={i} style={{height:'64px',background:ELEV,borderRadius:'10px'}}/>;})}</div>
            :approved.length===0?<div role="status" style={{textAlign:'center',padding:'40px 16px'}}><p style={{fontSize:'14px',color:TEXT2}}>No approved members yet.</p></div>
            :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{approved.map(function(m){var busyR=processing[m.id+'r'],busyX=processing[m.id+'x'];return(
              <div key={m.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'10px'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'50%',background:getAvatarColor(m.org_name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(m.org_name)}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',fontWeight:700,color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.org_name}</div><span style={{fontSize:'10px',fontWeight:700,padding:'1px 7px',borderRadius:'99px',background:m.role==='admin'?'rgba(139,92,246,0.12)':CARD,border:'1px solid '+(m.role==='admin'?'rgba(139,92,246,0.3)':BDR),color:m.role==='admin'?PURPLE:MUTED}}>{m.role==='admin'?'Admin':'Member'}</span></div>
                <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                  <button onClick={function(){handlePromote(m.id,m.org_name,m.role);}} disabled={busyR} style={{padding:'5px 8px',borderRadius:'6px',fontSize:'11px',fontWeight:600,border:'1px solid '+BDR,background:CARD,color:MUTED,cursor:busyR?'not-allowed':'pointer',opacity:busyR?0.6:1}}>{busyR?'...':(m.role==='admin'?'Demote':'Make Admin')}</button>
                  <button onClick={function(){handleRemove(m.id,m.org_name);}} disabled={busyX} style={{width:'28px',height:'28px',borderRadius:'6px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:RED,cursor:busyX?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:busyX?0.6:1}}><IconTrash size={12}/></button>
                </div>
              </div>
            );})}
            </div>
          )}
          {adminTab==='invites'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
              <div>
                <p style={{fontSize:'11px',fontWeight:700,color:YELLOW,textTransform:'uppercase',letterSpacing:'4px',margin:'0 0 8px'}}>Shareable Link</p>
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'12px'}}>
                  <div><label htmlFor="inv-expiry" style={labelStyle}>Link expires</label><select id="inv-expiry" value={inviteExpiry} onChange={function(e){setInviteExpiry(e.target.value);}} style={inputStyle}><option value="none">Never</option><option value="7">In 7 days</option><option value="30">In 30 days</option><option value="60">In 60 days</option><option value="custom">Custom date</option></select></div>
                  {inviteExpiry==='custom'&&<div><label htmlFor="inv-date" style={labelStyle}>Expiry date</label><input id="inv-date" type="date" value={customExpiry} onChange={function(e){setCustomExpiry(e.target.value);}} min={new Date().toISOString().split('T')[0]} style={inputStyle}/></div>}
                  <button onClick={generateInviteLink} disabled={generatingLink} style={{padding:'9px',background:BLUE,color:'#FFFFFF',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:generatingLink?'not-allowed':'pointer',opacity:generatingLink?0.7:1}}>{generatingLink?'Generating...':'Generate & Copy Link'}</button>
                </div>
                {generalInvites.length>0&&<div><p style={Object.assign({},labelStyle,{marginBottom:'8px'})}>Active Links</p><div style={{display:'flex',flexDirection:'column',gap:'6px'}}>{generalInvites.map(function(inv){var isCopied=copiedId===inv.id;var isExpired=inv.expires_at&&new Date(inv.expires_at)<new Date();return<div key={inv.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'8px',opacity:isExpired?0.5:1}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:'11px',fontFamily:'monospace',color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{'...'+inv.token.slice(-12)}</div><div style={{fontSize:'11px',color:isExpired?RED:MUTED}}>{formatExpiry(inv.expires_at)}</div></div><button onClick={function(){copyInviteLink(inv.token,inv.id);}} style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:700,border:'1px solid '+BDR,background:isCopied?'rgba(34,197,94,0.10)':CARD,color:isCopied?GREEN:TEXT2,cursor:'pointer',flexShrink:0}}>{isCopied?'Copied!':'Copy'}</button><button onClick={function(){deleteInvite(inv.id);}} style={{width:'28px',height:'28px',borderRadius:'6px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:RED,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IconTrash size={11}/></button></div>;})}</div></div>}
              </div>
              <div style={{height:'1px',background:BDR}}/>
              <div>
                <p style={{fontSize:'11px',fontWeight:700,color:YELLOW,textTransform:'uppercase',letterSpacing:'4px',margin:'0 0 8px'}}>Invite an Organization</p>
                <div style={{position:'relative'}}>
                  <input type="text" value={orgSearch} onChange={function(e){setOrgSearch(e.target.value);searchOrgs(e.target.value);}} placeholder="Search organizations by name..." style={inputStyle}/>
                  {orgResults.length>0&&<div style={{position:'absolute',top:'100%',left:0,right:0,background:CARD,border:'1px solid '+BDR,borderRadius:'8px',zIndex:10,maxHeight:'180px',overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.08)',marginTop:'4px'}}>{orgResults.map(function(org){return<button key={org.id} onClick={function(){setSelectedInviteOrg(org);setOrgSearch(org.name);setOrgResults([]);}} style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',padding:'10px 12px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}><div style={{width:'28px',height:'28px',borderRadius:'50%',background:getAvatarColor(org.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(org.name)}</div><div><div style={{fontSize:'13px',fontWeight:600,color:TEXT}}>{org.name}</div><div style={{fontSize:'11px',color:MUTED}}>{org.type||'Organization'}</div></div></button>;})}</div>}
                </div>
                {selectedInviteOrg&&<div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:'8px',marginTop:'8px'}}><div style={{width:'30px',height:'30px',borderRadius:'50%',background:getAvatarColor(selectedInviteOrg.name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(selectedInviteOrg.name)}</div><span style={{fontSize:'13px',fontWeight:600,color:TEXT,flex:1}}>{selectedInviteOrg.name}</span><button onClick={function(){setSelectedInviteOrg(null);setOrgSearch('');}} style={{width:'22px',height:'22px',borderRadius:'50%',background:BDR,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:MUTED}}><IconX size={10}/></button></div>}
                <button onClick={sendOrgInvite} disabled={!selectedInviteOrg||sendingOrgInvite} style={{width:'100%',padding:'9px',background:selectedInviteOrg?BLUE:ELEV,color:selectedInviteOrg?'#FFFFFF':MUTED,border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:(selectedInviteOrg&&!sendingOrgInvite)?'pointer':'not-allowed',marginTop:'10px',opacity:sendingOrgInvite?0.7:1}}>{sendingOrgInvite?'Sending...':'Send Direct Invite'}</button>
                {directInvites.length>0&&<div style={{marginTop:'16px'}}><p style={Object.assign({},labelStyle,{marginBottom:'8px'})}>Sent Invites</p><div style={{display:'flex',flexDirection:'column',gap:'6px'}}>{directInvites.map(function(inv){var isUsed=!!inv.used_at;return<div key={inv.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:ELEV,border:'1px solid '+BDR,borderRadius:'8px'}}><div style={{width:'28px',height:'28px',borderRadius:'50%',background:getAvatarColor(inv.org_name),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:'#FFFFFF',flexShrink:0}}>{getInitials(inv.org_name)}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'13px',fontWeight:600,color:TEXT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.org_name}</div><div style={{fontSize:'11px',color:isUsed?GREEN:MUTED}}>{isUsed?'Accepted':'Pending'}</div></div>{!isUsed&&<button onClick={function(){deleteInvite(inv.id);}} style={{width:'26px',height:'26px',borderRadius:'6px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:RED,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IconX size={10}/></button>}</div>;})}</div></div>}
              </div>
            </div>
          )}
          {adminTab==='settings'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div><label htmlFor="s-name" style={labelStyle}>Board Name</label><input id="s-name" type="text" value={editName} onChange={function(e){setEditName(e.target.value);}} maxLength={80} style={inputStyle}/></div>
              <div><label htmlFor="s-desc" style={labelStyle}>Description</label><textarea id="s-desc" value={editDesc} onChange={function(e){setEditDesc(e.target.value);}} rows={3} maxLength={300} style={Object.assign({},inputStyle,{resize:'vertical',lineHeight:1.5})}/></div>
              <div><label htmlFor="s-theme" style={labelStyle}>Theme</label><select id="s-theme" value={editTheme} onChange={function(e){setEditTheme(e.target.value);}} style={inputStyle}>{THEMES.map(function(t){return<option key={t.value} value={t.value}>{t.label}</option>;})}</select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div><label htmlFor="s-city" style={labelStyle}>City</label><input id="s-city" type="text" value={editCity} onChange={function(e){setEditCity(e.target.value);}} style={inputStyle}/></div>
                <div><label htmlFor="s-state" style={labelStyle}>State</label><select id="s-state" value={editState} onChange={function(e){setEditState(e.target.value);}} style={inputStyle}><option value="">Select...</option>{US_STATES.map(function(s){return<option key={s} value={s}>{s}</option>;})}</select></div>
                <div><label htmlFor="s-county" style={labelStyle}>County</label><input id="s-county" type="text" value={editCounty} onChange={function(e){setEditCounty(e.target.value);}} style={inputStyle}/></div>
                <div><label htmlFor="s-zip" style={labelStyle}>ZIP</label><input id="s-zip" type="text" value={editZip} onChange={function(e){setEditZip(e.target.value);}} maxLength={10} style={inputStyle}/></div>
              </div>
              <div>
                <p style={Object.assign({},labelStyle,{marginBottom:'8px'})}>Visibility</p>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {[{value:'public',label:'Public',desc:'Appears in search',icon:IconGlobe},{value:'hidden',label:'Private',desc:'Invite only',icon:IconLock}].map(function(opt){
                    var isSelected=editVisibility===opt.value;var Ic=opt.icon;
                    return<button key={opt.value} onClick={function(){setEditVisibility(opt.value);}} aria-pressed={isSelected} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:isSelected?'rgba(59,130,246,0.06)':ELEV,border:'1px solid '+(isSelected?'rgba(59,130,246,0.35)':BDR),borderRadius:'8px',cursor:'pointer',textAlign:'left'}}><Ic size={13}/><div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:700,color:isSelected?BLUE:TEXT}}>{opt.label}</div><div style={{fontSize:'11px',color:MUTED}}>{opt.desc}</div></div>{isSelected&&<IconCheck size={13}/>}</button>;
                  })}
                </div>
              </div>
              <button onClick={handleSaveSettings} disabled={savingSettings} style={{padding:'11px',background:BLUE,color:'#FFFFFF',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:savingSettings?'not-allowed':'pointer',opacity:savingSettings?0.7:1}}>{savingSettings?'Saving...':'Save Settings'}</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function CommunityBoard(){
  usePatrickHand();
  var{boardId}=useParams();
  var navigate=useNavigate();
  var[board,setBoard]=useState(null);
  var[pageLoading,setPageLoading]=useState(true);
  var[userOrgs,setUserOrgs]=useState([]);
  var[userOrgIds,setUserOrgIds]=useState([]);
  var[membership,setMembership]=useState(null);
  var[isBoardAdmin,setIsBoardAdmin]=useState(false);
  var[activeTab,setActiveTab]=useState('ask');
  var[posts,setPosts]=useState([]);
  var[postsLoading,setPostsLoading]=useState(false);
  var[tabCounts,setTabCounts]=useState({});
  var[showAdminPanel,setShowAdminPanel]=useState(false);
  var[showCreate,setShowCreate]=useState(false);
  var[editingPost,setEditingPost]=useState(null);
  var[deletingPost,setDeletingPost]=useState(null);
  var[actionModal,setActionModal]=useState(null);
  var[chatState,setChatState]=useState({post:null,isOwn:false});
  var[unreadCounts,setUnreadCounts]=useState({});
  var[approvedOrgIds,setApprovedOrgIds]=useState([]);
  var[reactions,setReactions]=useState({});
  var[vendorContacts,setVendorContacts]=useState({});
  var[searchQuery,setSearchQuery]=useState('');
  var[sortBy,setSortBy]=useState('newest');
  var[filterCategory,setFilterCategory]=useState('');
  var[filterStatus,setFilterStatus]=useState('all');
  var[activityFeed,setActivityFeed]=useState([]);
  var[activityLoading,setActivityLoading]=useState(false);
  var cfg=BOARD_CONFIG[activeTab]||BOARD_CONFIG.ask;
  useEffect(function(){setSearchQuery('');setFilterCategory('');setFilterStatus('all');},[activeTab]);
  useEffect(function(){loadPage();},[boardId]);
  async function loadPage(){
    setPageLoading(true);
    try{
      var{data:authData}=await supabase.auth.getUser();
      if(!authData.user){navigate('/login');return;}
      var{data:memberData}=await supabase.from('memberships').select('organization_id,organizations(id,name,logo_url)').eq('member_id',authData.user.id).eq('role','admin').eq('status','active');
      var orgs=(memberData||[]).map(function(m){return m.organizations;});
      var ids=orgs.map(function(o){return o.id;});
      setUserOrgs(orgs);setUserOrgIds(ids);
      var{data:boardData,error:be}=await supabase.from('community_boards').select('*').eq('id',boardId).single();
      if(be||!boardData){setBoard(null);setPageLoading(false);return;}
      setBoard(boardData);
      if(ids.length>0){
        var{data:mems}=await supabase.from('community_board_memberships').select('id,org_id,role,status').eq('board_id',boardId).in('org_id',ids);
        var best=null;var rank={approved:3,pending:2,invited:2,denied:1};
        (mems||[]).forEach(function(m){if(!best||(rank[m.status]||0)>(rank[best.status]||0))best=m;});
        setMembership(best);
        setIsBoardAdmin(!!best&&best.status==='approved'&&best.role==='admin');
        var approvedList=(mems||[]).filter(function(m){return m.status==='approved';}).map(function(m){return m.org_id;});
        setApprovedOrgIds(approvedList);
      }
    }catch(err){}finally{setPageLoading(false);}
  }
  useEffect(function(){
    if(membership&&membership.status==='approved'){
      if(activeTab==='activity'){loadActivityFeed();}else{loadPosts(activeTab);}
      loadTabCounts();loadUnreadCounts();
    }
  },[activeTab,membership]);
  async function loadPosts(boardType){
    setPostsLoading(true);
    try{
      var{data,error}=await supabase.from('community_board_posts').select('*').eq('board_id',boardId).eq('board_type',boardType).eq('is_active',true).order('created_at',{ascending:false});
      if(error)throw error;
      var orgIds=[];(data||[]).forEach(function(p){if(p.org_id&&orgIds.indexOf(p.org_id)===-1)orgIds.push(p.org_id);});
      var orgMap={};
      if(orgIds.length>0){var{data:orgs}=await supabase.from('organizations').select('id,name').in('id',orgIds);(orgs||[]).forEach(function(o){orgMap[o.id]=o.name;});}
      var enriched=(data||[]).map(function(p){return Object.assign({},p,{org_name:orgMap[p.org_id]||'Unknown Org'});});
      setPosts(enriched);
      var postIds=enriched.map(function(p){return p.id;});
      if(postIds.length>0){loadReactions(postIds);if(boardType==='recommendations')loadVendorContacts(postIds);}
    }catch(err){mascotErrorToast('Could not load posts.');setPosts([]);}
    finally{setPostsLoading(false);}
  }
  async function loadVendorContacts(postIds){
    try{
      var{data,error}=await supabase.from('vendor_contacts').select('*').in('post_id',postIds).order('display_order',{ascending:true});
      if(error)throw error;
      var map={};(data||[]).forEach(function(c){if(!map[c.post_id])map[c.post_id]=[];map[c.post_id].push(c);});
      setVendorContacts(map);
    }catch(err){console.error('Could not load vendor contacts:',err);}
  }
  async function loadActivityFeed(){
    setActivityLoading(true);
    try{
      var{data,error}=await supabase.from('community_board_posts').select('*').eq('board_id',boardId).eq('is_active',true).order('created_at',{ascending:false}).limit(60);
      if(error)throw error;
      var orgIds=[];(data||[]).forEach(function(p){if(p.org_id&&orgIds.indexOf(p.org_id)===-1)orgIds.push(p.org_id);});
      var orgMap={};if(orgIds.length>0){var{data:orgs}=await supabase.from('organizations').select('id,name').in('id',orgIds);(orgs||[]).forEach(function(o){orgMap[o.id]=o.name;});}
      setActivityFeed((data||[]).map(function(p){return Object.assign({},p,{org_name:orgMap[p.org_id]||'Unknown Org'});}));
    }catch(err){toast.error('Could not load activity.');setActivityFeed([]);}
    finally{setActivityLoading(false);}
  }
  async function loadTabCounts(){
    try{
      var boardTabs=TABS.filter(function(t){return t.key!=='activity';});
      var results=await Promise.all(boardTabs.map(function(t){return supabase.from('community_board_posts').select('id',{count:'exact',head:true}).eq('board_id',boardId).eq('board_type',t.key).eq('is_active',true);}));
      var counts={};boardTabs.forEach(function(t,i){counts[t.key]=results[i].count||0;});setTabCounts(counts);
    }catch(err){}
  }
  async function loadUnreadCounts(){
    if(!userOrgIds||userOrgIds.length===0)return;
    try{var{data}=await supabase.from('cb_post_messages').select('post_id').in('to_org_id',userOrgIds).eq('is_read',false);var counts={};(data||[]).forEach(function(m){counts[m.post_id]=(counts[m.post_id]||0)+1;});setUnreadCounts(counts);}catch(err){}
  }
  async function loadReactions(postIds){
    if(!userOrgIds||userOrgIds.length===0||!postIds||postIds.length===0)return;
    try{
      var{data}=await supabase.from('cb_post_reactions').select('*').in('post_id',postIds);
      var reactionMap={};
      (data||[]).forEach(function(r){if(!reactionMap[r.post_id])reactionMap[r.post_id]={};var countKey=r.reaction_type+'_count';reactionMap[r.post_id][countKey]=(reactionMap[r.post_id][countKey]||0)+1;if(userOrgIds.indexOf(r.org_id)!==-1)reactionMap[r.post_id]['my_'+r.reaction_type]=true;});
      setReactions(reactionMap);
    }catch(err){}
  }
  async function handleStatusChange(postId,newStatus){try{var{error}=await supabase.from('community_board_posts').update({status:newStatus}).eq('id',postId);if(error)throw error;setPosts(function(prev){return prev.map(function(p){return p.id===postId?Object.assign({},p,{status:newStatus}):p;});});mascotSuccessToast('Status updated.');}catch(err){mascotErrorToast('Could not update status.');}}
  async function handleDeleteConfirm(postId){try{var{error}=await supabase.from('community_board_posts').update({is_active:false}).eq('id',postId);if(error)throw error;mascotSuccessToast('Post removed.');setPosts(function(prev){return prev.filter(function(p){return p.id!==postId;});});setDeletingPost(null);loadTabCounts();}catch(err){mascotErrorToast('Could not remove post.','Please try again.');}}
  async function handleTogglePin(post){
    try{
      var{data:authData}=await supabase.auth.getUser();
      if(post.is_pinned){await supabase.rpc('unpin_board_post',{p_post_id:post.id});setPosts(function(prev){return prev.map(function(p){return p.id===post.id?Object.assign({},p,{is_pinned:false}):p;});});mascotSuccessToast('Post unpinned.');}
      else{await supabase.rpc('pin_board_post',{p_post_id:post.id,p_board_id:boardId,p_board_type:activeTab,p_user_id:authData.user.id});setPosts(function(prev){return prev.map(function(p){if(p.id===post.id)return Object.assign({},p,{is_pinned:true});return Object.assign({},p,{is_pinned:false});});});mascotSuccessToast('Post pinned to top.');}
    }catch(err){mascotErrorToast('Could not update pin.');}
  }
  async function handleRenew(postId){
    try{var{data:authData}=await supabase.auth.getUser();await supabase.rpc('renew_board_post',{p_post_id:postId,p_user_id:authData.user.id});var newExpiry=new Date();newExpiry.setDate(newExpiry.getDate()+60);setPosts(function(prev){return prev.map(function(p){return p.id===postId?Object.assign({},p,{expires_at:newExpiry.toISOString()}):p;});});mascotSuccessToast('Post renewed for 60 more days.');}
    catch(err){mascotErrorToast('Could not renew post.');}
  }
  async function handleReact(postId,reactionType){
    var myOrgId=approvedOrgIds.find(function(id){return userOrgIds.indexOf(id)!==-1;});
    if(!myOrgId){toast.error('Your org must be a board member to react.');return;}
    var postReactions=reactions[postId]||{};var hasReacted=postReactions['my_'+reactionType]||false;
    setReactions(function(prev){var next=Object.assign({},prev);var pr=Object.assign({},next[postId]||{});if(hasReacted){pr['my_'+reactionType]=false;pr[reactionType+'_count']=Math.max(0,(pr[reactionType+'_count']||0)-1);}else{pr['my_'+reactionType]=true;pr[reactionType+'_count']=(pr[reactionType+'_count']||0)+1;}next[postId]=pr;return next;});
    try{var{data:authData}=await supabase.auth.getUser();if(hasReacted){await supabase.from('cb_post_reactions').delete().eq('post_id',postId).eq('org_id',myOrgId).eq('reaction_type',reactionType);}else{await supabase.from('cb_post_reactions').insert({post_id:postId,org_id:myOrgId,user_id:authData.user.id,reaction_type:reactionType});}}
    catch(err){loadReactions(posts.map(function(p){return p.id;}));}
  }
  function handleOpenChat(post){var isOwn=userOrgIds.indexOf(post.org_id)!==-1;setChatState({post:post,isOwn:isOwn});}
  function handleMarkRead(postId,count){setUnreadCounts(function(prev){var next=Object.assign({},prev);next[postId]=Math.max(0,(next[postId]||0)-count);return next;});}
  var pinnedPost=posts.find(function(p){return p.is_pinned;})||null;
  var filteredPosts=posts.filter(function(p){
    if(p.is_pinned)return false;
    var q=searchQuery.toLowerCase().trim();
    if(q){var inTitle=p.title.toLowerCase().indexOf(q)!==-1;var inBody=p.body.toLowerCase().indexOf(q)!==-1;var inOrg=(p.org_name||'').toLowerCase().indexOf(q)!==-1;if(!inTitle&&!inBody&&!inOrg)return false;}
    if(filterCategory&&p.category!==filterCategory)return false;
    if(filterStatus!=='all'&&p.status!==filterStatus)return false;
    return true;
  });
  var displayPosts=filteredPosts.slice().sort(function(a,b){
    if(sortBy==='most_responses')return(b.response_count||0)-(a.response_count||0);
    if(sortBy==='recently_active')return new Date(b.last_activity_at||b.created_at)-new Date(a.last_activity_at||a.created_at);
    return new Date(b.created_at)-new Date(a.created_at);
  });
  var totalUnreadInbox=Object.values(unreadCounts).reduce(function(sum,c){return sum+c;},0);
  var locationStr=[board&&board.city,board&&board.state].filter(Boolean).join(', ');
  if(board&&board.county&&!board.city)locationStr=board.county+' County'+(board.state?', '+board.state:'');
  var hasActiveFilters=searchQuery||filterCategory||filterStatus!=='all'||sortBy!=='newest';
  var isRec=activeTab==='recommendations';
  function renderPostCard(post){
    var isOwn=userOrgIds.indexOf(post.org_id)!==-1;
    var sharedProps={key:post.id,post:post,isOwn:isOwn,isBoardAdmin:isBoardAdmin,unreadCount:unreadCounts[post.id]||0,reactions:reactions[post.id]||{},onEdit:function(p){setEditingPost(p);},onDelete:function(p){setDeletingPost(p);},onStatusChange:handleStatusChange,onOpenChat:handleOpenChat,onTogglePin:handleTogglePin,onRenew:handleRenew,onReact:handleReact};
    if(isRec)return<RecommendationCard {...sharedProps} contacts={vendorContacts[post.id]||[]}/>;
    return<PostCard {...sharedProps} config={cfg} onAction={function(p,type){setActionModal({post:p,type:type});}}/>;
  }
  if(pageLoading)return(
    <div style={{background:BG,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div aria-busy="true" aria-label="Loading board" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
        <img src="/mascot-loading.png" alt="" aria-hidden="true" style={{width:'180px',mixBlendMode:'multiply'}}/>
        <div style={{display:'flex',flexDirection:'column',gap:'8px',alignItems:'center'}}>
          {[200,160,120].map(function(w,i){return<div key={i} style={{width:w+'px',height:'10px',background:BDR,borderRadius:'6px'}}/>;})}</div>
      </div>
    </div>
  );
  if(!board)return(
    <main style={{background:BG,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'32px',maxWidth:'440px'}}>
        <img src="/mascot-error.png" alt="" aria-hidden="true" style={{width:'160px',mixBlendMode:'multiply',margin:'0 auto 16px',display:'block'}}/>
        <h1 style={{fontSize:'20px',fontWeight:800,color:TEXT,marginBottom:'8px'}}>Board Not Found</h1>
        <p style={{fontSize:'14px',color:TEXT2,marginBottom:'24px'}}>This board may have been removed or the link has expired.</p>
        <button onClick={function(){navigate('/community-board/hub');}} style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 24px',background:BLUE,color:'#FFFFFF',borderRadius:'8px',fontSize:'14px',fontWeight:600,border:'none',cursor:'pointer'}}><IconArrowLeft size={14}/>Back to Boards</button>
      </div>
    </main>
  );
  if(membership&&membership.status==='pending')return(
    <main style={{background:BG,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'32px',maxWidth:'440px'}}>
        <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(245,183,49,0.12)',border:'1px solid rgba(245,183,49,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:YELLOW}}><IconClock size={26}/></div>
        <h1 style={{fontSize:'20px',fontWeight:800,color:TEXT,marginBottom:'8px'}}>Request Pending</h1>
        <p style={{fontSize:'14px',color:TEXT2,lineHeight:1.65,marginBottom:'8px'}}>Your request to join <strong>{board.name}</strong> is waiting for board admin approval.</p>
        <p style={{fontSize:'13px',color:MUTED,marginBottom:'24px'}}>You will be able to participate once approved.</p>
        <button onClick={function(){navigate('/community-board/hub');}} style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 24px',background:BLUE,color:'#FFFFFF',borderRadius:'8px',fontSize:'14px',fontWeight:600,border:'none',cursor:'pointer'}}><IconArrowLeft size={14}/>Back to Boards</button>
      </div>
    </main>
  );
  if(!membership||membership.status==='denied')return(
    <main style={{background:BG,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:'32px',maxWidth:'440px'}}>
        <div style={{width:'56px',height:'56px',borderRadius:'16px',background:CARD,border:'1px solid '+BDR,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:MUTED}}><IconLock size={26}/></div>
        <h1 style={{fontSize:'20px',fontWeight:800,color:TEXT,marginBottom:'8px'}}>{board.name}</h1>
        <p style={{fontSize:'14px',color:TEXT2,lineHeight:1.65,marginBottom:'24px'}}>{membership&&membership.status==='denied'?'Your request to join this board was not approved.':board.visibility==='hidden'?'This is a private board. You need an invite to join.':'You are not a member of this board yet.'}</p>
        <button onClick={function(){navigate('/community-board/hub');}} style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 24px',background:BLUE,color:'#FFFFFF',borderRadius:'8px',fontSize:'14px',fontWeight:600,border:'none',cursor:'pointer'}}><IconArrowLeft size={14}/>Back to Boards</button>
      </div>
    </main>
  );
  return(
    <main style={{background:BG,minHeight:'100vh',fontFamily:"'Inter','Segoe UI',system-ui,sans-serif"}} aria-label={board.name+' community board'}>
      <header style={{background:CARD,borderBottom:'1px solid '+BDR,padding:'20px 24px'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
            <button onClick={function(){navigate('/community-board/hub');}} style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',fontWeight:600,color:MUTED,background:'none',border:'none',cursor:'pointer',padding:0}}><IconArrowLeft size={14}/>All Boards</button>
            {isBoardAdmin&&(
              <button onClick={function(){setShowAdminPanel(true);}} style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'8px 16px',background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.25)',borderRadius:'8px',color:PURPLE,fontSize:'13px',fontWeight:700,cursor:'pointer',position:'relative'}}>
                <IconSettings size={14}/>Manage Board
                {totalUnreadInbox>0&&<span aria-label={totalUnreadInbox+' unread messages'} style={{position:'absolute',top:'-6px',right:'-6px',background:BLUE,color:'#FFFFFF',borderRadius:'99px',padding:'1px 5px',fontSize:'10px',fontWeight:700}}>{totalUnreadInbox>9?'9+':totalUnreadInbox}</span>}
              </button>
            )}
          </div>
          <div style={{marginBottom:'16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px',flexWrap:'wrap'}}>
              <img src="/mascot-community-board.png" alt="" aria-hidden="true" style={{width:'36px',height:'36px',mixBlendMode:'multiply',flexShrink:0}}/>
              <h1 style={{fontSize:'22px',fontWeight:800,color:TEXT,margin:0}}>{board.name}</h1>
              <span style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11px',fontWeight:600,color:board.visibility==='hidden'?MUTED:GREEN}}>
                {board.visibility==='hidden'?<IconLock size={11}/>:<IconGlobe size={11}/>}{board.visibility==='hidden'?'Private':'Public'}
              </span>
              {isBoardAdmin&&<span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'2px 8px',background:'rgba(139,92,246,0.10)',border:'1px solid rgba(139,92,246,0.25)',borderRadius:'99px',fontSize:'10px',fontWeight:700,color:PURPLE}}><IconShield size={10}/>Board Admin</span>}
            </div>
            {board.description&&<p style={{fontSize:'13px',color:TEXT2,lineHeight:1.6,margin:'0 0 8px'}}>{board.description}</p>}
            <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
              {locationStr&&<span style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'12px',color:MUTED}}><IconMapPin size={12}/>{locationStr}</span>}
              <span style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'12px',color:MUTED}}><IconUsers size={12}/>{(board.member_count||1)+' '+((board.member_count||1)===1?'org':'orgs')}</span>
              <span style={{fontSize:'12px',color:MUTED}}>{getThemeLabel(board.theme)}</span>
            </div>
          </div>
          <nav role="tablist" aria-label="Board sections" style={{display:'flex',overflowX:'auto'}}>
            {TABS.map(function(tab){
              var isActive=activeTab===tab.key;var count=tabCounts[tab.key]||0;
              return(
                <button key={tab.key} role="tab" aria-selected={isActive} id={'tab-'+tab.key} onClick={function(){setActiveTab(tab.key);}}
                  style={{padding:'10px 16px',border:'none',background:'transparent',fontSize:'13px',fontWeight:600,cursor:'pointer',color:isActive?tab.color:MUTED,borderBottom:isActive?'2px solid '+tab.color:'2px solid transparent',marginBottom:'-1px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'6px'}}>
                  {tab.key==='activity'&&<IconActivity size={13}/>}{tab.label}
                  {count>0&&tab.key!=='activity'&&<span style={{borderRadius:'99px',padding:'1px 7px',fontSize:'10px',background:isActive?'rgba(0,0,0,0.08)':ELEV,color:isActive?tab.color:MUTED}}>{count}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'20px 24px'}}>
        {activeTab==='activity'?(
          <ActivityFeed feed={activityFeed} loading={activityLoading}/>
        ):(
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px',marginBottom:'16px',flexWrap:'wrap'}}>
              <p style={{fontSize:'13px',color:MUTED,flex:1,margin:0}}>{cfg.description}</p>
              <button onClick={function(){setShowCreate(true);}} style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'9px 16px',background:CARD,border:'1px solid '+BDR,borderRadius:'8px',color:TEXT2,fontSize:'13px',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
                <IconPlus size={13}/>{cfg.buttonLabel}
              </button>
            </div>
            <FilterToolbar config={cfg} searchQuery={searchQuery} sortBy={sortBy} filterCategory={filterCategory} filterStatus={filterStatus}
              onSearch={setSearchQuery} onSort={setSortBy} onCategory={setFilterCategory} onStatus={setFilterStatus}
              onClear={function(){setSearchQuery('');setSortBy('newest');setFilterCategory('');setFilterStatus('all');}}/>
            {postsLoading?(
              <div aria-busy="true" aria-label="Loading posts" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'20px'}}>
                {[1,2,3,4,5,6].map(function(i){return<SkeletonCard key={i} cardBg={cfg.cardBg}/>;})}</div>
            ):posts.length===0?(
              <div role="status" style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'64px 32px',gap:'16px'}}>
                <img src="/mascot-firstpost.png" alt="" aria-hidden="true" style={{width:'160px',mixBlendMode:'multiply'}}/>
                <h2 style={{fontSize:'17px',fontWeight:700,color:TEXT,margin:0}}>{cfg.emptyTitle}</h2>
                <p style={{fontSize:'13px',color:TEXT2,maxWidth:'360px',lineHeight:1.65,margin:0}}>{cfg.emptyDesc}</p>
                <button onClick={function(){setShowCreate(true);}} style={{marginTop:'4px',padding:'10px 20px',background:BLUE,color:'#FFFFFF',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                  <IconPlus size={13}/>{cfg.buttonLabel}
                </button>
              </div>
            ):(
              <>
                {hasActiveFilters&&<p role="status" style={{fontSize:'12px',color:MUTED,marginBottom:'12px'}}>{'Showing '+(displayPosts.length+(pinnedPost?1:0))+' of '+posts.length+' post'+(posts.length===1?'':'s')}</p>}
                {displayPosts.length===0&&!pinnedPost?(
                  <div role="status" style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'48px 32px',gap:'12px'}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'12px',background:CARD,border:'1px solid '+BDR,display:'flex',alignItems:'center',justifyContent:'center',color:MUTED}}><IconSearch size={20}/></div>
                    <h2 style={{fontSize:'16px',fontWeight:700,color:TEXT,margin:0}}>No results found</h2>
                    <p style={{fontSize:'13px',color:TEXT2,maxWidth:'320px',lineHeight:1.6,margin:0}}>Try adjusting your search or filters.</p>
                    <button onClick={function(){setSearchQuery('');setSortBy('newest');setFilterCategory('');setFilterStatus('all');}} style={{padding:'8px 16px',background:'transparent',border:'1px solid '+BDR,borderRadius:'8px',color:TEXT2,fontSize:'12px',fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                      <IconX size={11}/>Clear filters
                    </button>
                  </div>
                ):(
                  <div role="list" aria-label={cfg.label+' posts'} style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'20px'}}>
                    {pinnedPost&&renderPostCard(pinnedPost)}
                    {displayPosts.map(function(post){return renderPostCard(post);})}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      {(showCreate||editingPost)&&<PostModal boardId={boardId} boardType={activeTab} config={cfg} userOrgs={userOrgs} editingPost={editingPost||null} onClose={function(){setShowCreate(false);setEditingPost(null);}} onSuccess={function(){loadPosts(activeTab);loadTabCounts();}}/>}
      {deletingPost&&<DeleteConfirmModal post={deletingPost} onConfirm={handleDeleteConfirm} onCancel={function(){setDeletingPost(null);}}/>}
      {actionModal&&<ActionModal post={actionModal.post} actionType={actionModal.type} config={cfg} userOrgs={userOrgs} boardName={board.name} approvedOrgIds={approvedOrgIds} onClose={function(){setActionModal(null);}} onSuccess={function(){loadPosts(activeTab);}}/>}
      {showAdminPanel&&<AdminPanel board={board} boardId={boardId} userOrgIds={userOrgIds} inboxUnreadCount={totalUnreadInbox} onClose={function(){setShowAdminPanel(false);}} onMembershipChange={function(){loadPage();}} onSettingsChange={function(){loadPage();setShowAdminPanel(false);}}/>}
      {chatState.post&&<PostChatPanel post={chatState.post} isOwn={chatState.isOwn} userOrgs={userOrgs} boardName={board.name} onClose={function(){setChatState({post:null,isOwn:false});}} onMarkRead={handleMarkRead} approvedOrgIds={approvedOrgIds}/>}
    </main>
  );
}