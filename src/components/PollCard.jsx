import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { notifyUsers } from '../lib/notificationService';
import ConfirmDeleteModal from '../components/ConfirmModal';
import { useDropdownKeyboard } from '../hooks/useModalKeyboard';

function Icon({ path, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      {Array.isArray(path)
        ? path.map(function(d, i) { return <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />; })
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />}
    </svg>
  );
}

// Trimmed unused keys (chart/bell/repeat/download were never referenced in this file's JSX).
var ICONS = {
  check:    'M5 13l4 4L19 7',
  lock:     'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  pin:      ['M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'],
  eyeOff:   ['M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'],
  pieChart: ['M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z', 'M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z'],
  barChart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  x:        'M6 18L18 6M6 6l12 12',
  chevDown: 'M19 9l-7 7-7-7',
  chevUp:   'M5 15l7-7 7 7',
};

var CHART_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16'];

var QUESTION_TYPE_LABELS = {
  single_choice:   'Single Choice',
  multiple_choice: 'Multiple Choice',
  yes_no_abstain:  'Yes / No / Abstain',
};

// ── ActionsDropdown ───────────────────────────────────────────────────────────
function ActionsDropdown({ poll, isClosed, duplicating, notifying, onEdit, onPin, onToggleStatus, onDuplicate, onRemind, onSaveTemplate, onExportCSV, onDelete, canExport }) {
  var [open, setOpen] = useState(false);
  var [menuStyle, setMenuStyle] = useState({});
  var triggerRef   = useRef(null);
  var menuRef      = useRef(null);
  var containerRef = useRef(null); // wraps both trigger + menu — required by useDropdownKeyboard

  function calcMenuPosition() {
    if (!triggerRef.current) return;
    var rect = triggerRef.current.getBoundingClientRect();
    var menuHeight = 260;
    var spaceBelow = window.innerHeight - rect.bottom;
    var openUpward = spaceBelow < menuHeight && rect.top > menuHeight;
    if (openUpward) {
      setMenuStyle({ position:'fixed', bottom: window.innerHeight - rect.top + 4, right: window.innerWidth - rect.right, top:'auto' });
    } else {
      setMenuStyle({ position:'fixed', top: rect.bottom + 4, right: window.innerWidth - rect.right, bottom:'auto' });
    }
  }

  // Position calc stays custom — useDropdownKeyboard doesn't handle dynamic up/down flipping.
  useEffect(function() {
    if (!open) return;
    calcMenuPosition();
    window.addEventListener('scroll', calcMenuPosition, true);
    window.addEventListener('resize', calcMenuPosition);
    return function() {
      window.removeEventListener('scroll', calcMenuPosition, true);
      window.removeEventListener('resize', calcMenuPosition);
    };
  }, [open]);

  useEffect(function() {
    if (open && menuRef.current) { var first = menuRef.current.querySelector('[role="menuitem"]:not([disabled])'); if (first) first.focus(); }
  }, [open]);

  // Shared hook now owns Escape, outside-click, Arrow/Home/End nav, and focus-return to the trigger.
  useDropdownKeyboard(open, function() { setOpen(false); }, containerRef);

  function close() { setOpen(false); }
  function action(fn) { return function() { close(); fn(); }; }

  var menuItemBase = { display:'block', width:'100%', textAlign:'left', padding:'7px 14px', fontSize:'13px', fontWeight:500, color:'#475569', background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap' };
  var menuItemCls  = 'hover:bg-slate-50 focus:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400';

  return (
    <div ref={containerRef} style={{display:'inline-block'}}>
      <button ref={triggerRef}
        onClick={function(e) { e.stopPropagation(); setOpen(function(v){ return !v; }); }}
        aria-haspopup="true" aria-expanded={open}
        aria-label={'Actions for poll: ' + poll.title}
        style={{fontSize:'12px',fontWeight:500,color:'#475569',background:'#F8FAFC',border:'0.5px solid #E2E8F0',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px'}}
        className="hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors">
        Actions ▾
      </button>
      {open && (
        <div ref={menuRef} role="menu" aria-label={'Poll actions for ' + poll.title}
          style={Object.assign({background:'#FFFFFF',border:'0.5px solid #E2E8F0',borderRadius:'8px',boxShadow:'0 4px 20px rgba(0,0,0,0.12)',minWidth:'160px',zIndex:9999,padding:'4px 0'}, menuStyle)}>
          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(function(){ onEdit(poll); })}>Edit</button>
          <button role="menuitem" style={menuItemBase} className={menuItemCls} disabled={duplicating} onClick={action(onDuplicate)} aria-disabled={duplicating}>{duplicating ? 'Duplicating...' : 'Duplicate'}</button>
          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onSaveTemplate)}>Make Template</button>
          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onPin)}>{poll.is_pinned ? 'Unpin' : 'Pin'}</button>
          {!isClosed && <button role="menuitem" style={menuItemBase} className={menuItemCls} disabled={notifying} onClick={action(onRemind)} aria-disabled={notifying}>{notifying ? 'Sending...' : 'Remind'}</button>}
          <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onToggleStatus)}>{isClosed ? 'Reopen' : 'Close'}</button>
          {canExport && <button role="menuitem" style={menuItemBase} className={menuItemCls} onClick={action(onExportCSV)}>Export CSV</button>}
          <div style={{borderTop:'0.5px solid #E2E8F0',margin:'4px 0'}} role="separator" />
          <button role="menuitem" style={Object.assign({},menuItemBase,{color:'#EF4444'})}
            className="hover:bg-red-50 focus:bg-red-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-400"
            onClick={action(onDelete)}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({ options, results, totalVotes }) {
  var CX=60,CY=60,R=45,IR=28,segments=[],angle=-90;
  options.forEach(function(opt,i){
    var result=results.find(function(r){return r.option_id===opt.id;});
    var pct=result?Number(result.percentage):0;
    if(pct<=0)return;
    var sweep=(pct/100)*360,s=angle*Math.PI/180,e=(angle+sweep)*Math.PI/180,large=sweep>180?1:0;
    var d=['M',CX+R*Math.cos(s),CY+R*Math.sin(s),'A',R,R,0,large,1,CX+R*Math.cos(e),CY+R*Math.sin(e),'L',CX+IR*Math.cos(e),CY+IR*Math.sin(e),'A',IR,IR,0,large,0,CX+IR*Math.cos(s),CY+IR*Math.sin(s),'Z'].join(' ');
    segments.push({d:d,color:CHART_COLORS[i%CHART_COLORS.length]});angle+=sweep;
  });
  return (
    <div className="flex items-center gap-6 py-2">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true" className="flex-shrink-0">
        {segments.length>0?segments.map(function(s,i){return<path key={i} d={s.d} fill={s.color}/>;}):<circle cx={CX} cy={CY} r={R} fill="#E2E8F0"/>}
        <circle cx={CX} cy={CY} r={IR} fill="white"/>
        <text x={CX} y={CY-3} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0E1523">{totalVotes}</text>
        <text x={CX} y={CY+11} textAnchor="middle" fontSize="9" fill="#64748B">votes</text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {options.map(function(opt,i){
          var result=results.find(function(r){return r.option_id===opt.id;});
          var pct=result?Number(result.percentage):0,count=result?Number(result.vote_count):0;
          return(<div key={opt.id} className="flex items-center gap-2 text-xs"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:CHART_COLORS[i%CHART_COLORS.length]}} aria-hidden="true"/><span className="text-[#475569] flex-1 truncate">{opt.option_text}</span><span className="text-[#64748B] font-semibold tabular-nums">{count} ({pct}%)</span></div>);
        })}
      </div>
    </div>
  );
}

// ── QuestionSection ───────────────────────────────────────────────────────────
function QuestionSection({ question, options, results, userVoteOptionIds, canVote, canSeeResults, effectiveVisibility, selectedOptions, onOptionSelect, chartMode, isAdmin }) {
  var totalVotes=results.reduce(function(s,r){return s+Number(r.vote_count);},0);
  var leadingResult=results.length>0?results.reduce(function(best,r){return Number(r.vote_count)>Number(best.vote_count)?r:best;},results[0]):null;
  var leadingText=leadingResult?(options.find(function(o){return o.id===leadingResult.option_id;})||{}).option_text:null;
  return (
    <div className="space-y-2">
      {canSeeResults&&effectiveVisibility==='full'&&(
        <div>{chartMode==='pie'&&totalVotes>0?(<DonutChart options={options} results={results} totalVotes={totalVotes}/>):(
          <div className="space-y-1.5">{options.map(function(option){
            var result=results.find(function(r){return r.option_id===option.id;});
            var voteCount=result?Number(result.vote_count):0,percentage=result?Number(result.percentage):0,isUserVote=userVoteOptionIds.includes(option.id);
            return(<div key={option.id} className={'rounded-lg p-2.5 border '+(isUserVote?'bg-purple-50 border-purple-200':'bg-slate-50 border-slate-200')}>
              <div className="flex items-center justify-between mb-1"><span className={'text-xs font-semibold flex items-center gap-1 '+(isUserVote?'text-purple-700':'text-[#0E1523]')}>{isUserVote&&<Icon path={ICONS.check} className="h-3 w-3"/>}{option.option_text}</span><span className="text-xs text-[#64748B] tabular-nums">{voteCount} &middot; {percentage}%</span></div>
              <div className="w-full rounded-full h-1.5 overflow-hidden bg-gray-200"><div className={'h-full rounded-full transition-all '+(isUserVote?'bg-purple-500':'bg-blue-500')} style={{width:percentage+'%'}} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={option.option_text+': '+percentage+'%'}/></div>
            </div>);
          })}</div>
        )}</div>
      )}
      {canSeeResults&&effectiveVisibility==='summary'&&(<div className="p-3 rounded-lg bg-slate-50 border border-slate-200"><p className="text-sm font-semibold text-[#0E1523] mb-0.5">{totalVotes} vote{totalVotes!==1?'s':''} cast</p>{leadingText&&totalVotes>0&&<p className="text-xs text-[#475569]">Leading: <span className="font-semibold text-[#0E1523]">{leadingText}</span> ({leadingResult?leadingResult.percentage:0}%)</p>}{totalVotes===0&&<p className="text-xs text-[#64748B]">No votes yet.</p>}</div>)}
      {canSeeResults&&effectiveVisibility==='none'&&!isAdmin&&(<div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2"><Icon path={ICONS.eyeOff} className="h-4 w-4 text-gray-400 flex-shrink-0"/><p className="text-xs text-[#64748B]">Results are not shared for this question.</p></div>)}
      {canVote&&!canSeeResults&&(
        <div className="space-y-1.5">{options.map(function(option){
          var isSelected=selectedOptions.includes(option.id),inputType=question.question_type==='multiple_choice'?'checkbox':'radio',optId='poll-'+question.id+'-opt-'+option.id;
          return(<label key={option.id} htmlFor={optId} className={'flex items-center gap-2.5 p-2.5 border-2 rounded-lg cursor-pointer transition-all '+(isSelected?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}><input id={optId} type={inputType} name={'poll-q-'+question.id} checked={isSelected} onChange={function(){onOptionSelect(option.id);}} className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500 flex-shrink-0"/><span className="text-sm font-semibold text-[#0E1523]">{option.option_text}</span></label>);
        })}</div>
      )}
      {canVote&&canSeeResults&&userVoteOptionIds.length>0&&(
        <div className="mt-2 space-y-1.5"><p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Change your vote</p>{options.map(function(option){var isSelected=selectedOptions.includes(option.id),optId='poll-change-'+question.id+'-opt-'+option.id;return(<label key={option.id} htmlFor={optId} className={'flex items-center gap-2.5 p-2.5 border-2 rounded-lg cursor-pointer transition-all '+(isSelected?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300 hover:bg-gray-50')}><input id={optId} type="radio" name={'poll-change-'+question.id} checked={isSelected} onChange={function(){onOptionSelect(option.id);}} className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-2 focus:ring-blue-500 flex-shrink-0"/><span className="text-sm font-semibold text-[#0E1523]">{option.option_text}</span></label>);})}</div>
      )}
      {!canVote&&!canSeeResults&&(<div className="space-y-1.5">{options.map(function(option){return(<div key={option.id} className="p-2.5 border rounded-lg bg-slate-50 border-slate-200"><span className="text-sm text-[#475569]">{option.option_text}</span></div>);})}</div>)}
    </div>
  );
}

// ── Shared collapsed header ───────────────────────────────────────────────────
// Used by both admin and member — renders title, badges, vote count, chevron
function CollapsedHeader({ poll, isClosed, questionsData, totalVotes, responseRate, hasVotedAny, urgentClose, soonClose, hoursLeft, daysLeft, expanded, onToggle, rightSlot }) {
  return (
    <div
      className="flex items-center gap-3 p-4 cursor-pointer select-none"
      onClick={function(e) {
        if (e.target.closest('[data-no-collapse]')) return;
        onToggle();
      }}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={function(e){ if(e.key===' '||e.key==='Enter'){e.preventDefault();onToggle();} }}
    >
      <div className="flex-shrink-0 text-[#94A3B8]">
        <Icon path={expanded ? ICONS.chevUp : ICONS.chevDown} className="h-4 w-4"/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {poll.is_pinned && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">Pinned</span>}
          <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold '+(isClosed?'bg-gray-100 text-gray-600':'bg-green-100 text-green-700')}>{isClosed?'Closed':'Active'}</span>
          {questionsData.length > 1 && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{questionsData.length} Questions</span>}
          {hasVotedAny && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700"><Icon path={ICONS.check} className="h-3 w-3"/>Voted</span>}
          {urgentClose && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">{'Closes in '+hoursLeft+'h'}</span>}
          {soonClose && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200">{'Closes in '+daysLeft+'d'}</span>}
        </div>
        <h3 style={{fontSize:'15px',fontWeight:500,color:'#0E1523',margin:0,lineHeight:1.3}}>{poll.title}</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          {totalVotes} vote{totalVotes!==1?'s':''}
          {responseRate !== null ? ' \u00b7 '+responseRate+'% participation' : ''}
        </p>
      </div>
      {rightSlot && (
        <div data-no-collapse="true" onClick={function(e){e.stopPropagation();}}>
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// ── PollCard ──────────────────────────────────────────────────────────────────
function PollCard({ poll, onVote, onDelete, onPollUpdated, onDuplicate, onEdit, onRemind, isAdmin, showOrganization, memberCount }) {
  var [questionsData, setQuestionsData]   = useState([]);
  var [loading, setLoading]               = useState(true);
  var [voting, setVoting]                 = useState(false);
  var [duplicating, setDuplicating]       = useState(false);
  var [notifying, setNotifying]           = useState(false);
  var [savingTemplate, setSavingTemplate] = useState(false);
  var [chartMode, setChartMode]           = useState('bar');
  var [lastRemindedAt, setLastRemindedAt] = useState(poll.last_reminded_at || null);
  var [selectedOptions, setSelectedOptions] = useState({});
  var [showSaveTemplate, setShowSaveTemplate] = useState(false);
  var [templateName, setTemplateName]     = useState('');
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Both admin and member start collapsed
  var [expanded, setExpanded]             = useState(false);

  var isExpired   = poll.closes_at && new Date(poll.closes_at) < new Date();
  var isClosed    = poll.status === 'closed' || isExpired;
  var msLeft      = !isClosed && poll.closes_at ? new Date(poll.closes_at) - new Date() : null;
  var hoursLeft   = msLeft ? Math.ceil(msLeft/(1000*60*60)) : null;
  var daysLeft    = msLeft ? Math.ceil(msLeft/(1000*60*60*24)) : null;
  var urgentClose = !isClosed && msLeft !== null && msLeft < 24*60*60*1000;
  var soonClose   = !isClosed && daysLeft !== null && daysLeft <= 3 && !urgentClose;

  var canSeeResults = isAdmin || isClosed || (poll.show_results_before_close && questionsData.some(function(qd){ return qd.userVoteOptionIds.length > 0; }));
  var effectiveVis  = isAdmin ? 'full' : (poll.result_visibility || 'full');
  var hasVotedAny   = questionsData.some(function(qd){ return qd.userVoteOptionIds.length > 0; });
  var canVote       = !isClosed && (!hasVotedAny || poll.allow_vote_changes);

  var firstQResults = questionsData.length > 0 ? questionsData[0].results : [];
  var totalVotes    = firstQResults.reduce(function(s,r){ return s+Number(r.vote_count); }, 0);
  var responseRate  = memberCount > 0 ? Math.round((totalVotes/memberCount)*100) : null;
  var hasAnySelection = Object.values(selectedOptions).some(function(arr){ return arr&&arr.length>0; });

  useEffect(function(){ setLastRemindedAt(poll.last_reminded_at||null); }, [poll.last_reminded_at]);
  useEffect(function(){ loadPollData(); }, [poll.id]);

  async function loadPollData() {
    setLoading(true);
    try {
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;
      var qRes = await supabase.from('poll_questions').select('*').eq('poll_id', poll.id).order('display_order');
      if (qRes.error) throw qRes.error;
      var dbQuestions = qRes.data || [];
      if (!dbQuestions.length) { setQuestionsData([]); setLoading(false); return; }
      var questionIds = dbQuestions.map(function(q){ return q.id; });
      var optsRes = await supabase.from('poll_options').select('*').in('question_id', questionIds).order('display_order');
      if (optsRes.error) throw optsRes.error;
      var allOptions = optsRes.data || [];
      var userVoteIds = [];
      if (user) { var uvRes = await supabase.from('poll_votes').select('option_id,question_id').eq('poll_id', poll.id).eq('member_id', user.id); if (!uvRes.error) userVoteIds = uvRes.data || []; }
      var hasUserVotes = userVoteIds.length > 0;
      var shouldLoadResults = isAdmin || isClosed || (poll.show_results_before_close && hasUserVotes);
      var allVotes = [];
      if (shouldLoadResults) { var allVotesRes = await supabase.from('poll_votes').select('option_id,question_id').eq('poll_id', poll.id); if (!allVotesRes.error) allVotes = allVotesRes.data || []; }
      var built = dbQuestions.map(function(q) {
        var qOptions = allOptions.filter(function(o){ return o.question_id===q.id; });
        var qUserVoteIds = userVoteIds.filter(function(v){ return v.question_id===q.id; }).map(function(v){ return v.option_id; });
        var qAllVotes = allVotes.filter(function(v){ return v.question_id===q.id; });
        var total=qAllVotes.length, counts={};
        qAllVotes.forEach(function(v){ counts[v.option_id]=(counts[v.option_id]||0)+1; });
        var qResults = qOptions.map(function(opt){ var c=counts[opt.id]||0; return {option_id:opt.id,vote_count:c,percentage:total>0?Math.round((c/total)*100):0}; });
        return {question:q,options:qOptions,results:qResults,userVoteOptionIds:qUserVoteIds};
      });
      setQuestionsData(built);
    } catch(err){ console.error('Error loading poll:', err); }
    finally { setLoading(false); }
  }

  function handleOptionSelect(questionId, optionId, questionType) {
    setSelectedOptions(function(prev) {
      var cur=prev[questionId]||[];
      if (questionType==='multiple_choice') { var next=cur.includes(optionId)?cur.filter(function(id){return id!==optionId;}):cur.concat([optionId]); return Object.assign({},prev,{[questionId]:next}); }
      return Object.assign({},prev,{[questionId]:[optionId]});
    });
  }

  async function handleSubmitVote() {
    if (voting) return;
    if (!hasAnySelection) { toast.error('Please select at least one option.'); return; }
    setVoting(true);
    var loadingToast = toast.loading('Submitting vote...');
    try {
      var authResult = await supabase.auth.getUser();
      var user = authResult.data.user;
      if (!user) throw new Error('You must be logged in to vote.');
      if (hasVotedAny && poll.allow_vote_changes) { var del = await supabase.from('poll_votes').delete().eq('poll_id', poll.id).eq('member_id', user.id); if (del.error) throw del.error; }
      var inserts = [];
      Object.keys(selectedOptions).forEach(function(questionId){ (selectedOptions[questionId]||[]).forEach(function(optId){ inserts.push({poll_id:poll.id,question_id:questionId,option_id:optId,member_id:user.id,is_anonymous:poll.allow_anonymous}); }); });
      if (inserts.length > 0) { var ins = await supabase.from('poll_votes').insert(inserts); if (ins.error) throw ins.error; }
      toast.dismiss(loadingToast);
      mascotSuccessToast(hasVotedAny?'Vote updated!':'Vote submitted!');
      setSelectedOptions({});
      await loadPollData();
      if (onVote) onVote(poll.id);
    } catch(err){ toast.dismiss(loadingToast); mascotErrorToast('Failed to submit vote.', err.message); }
    finally { setVoting(false); }
  }

  async function handlePin() { try { var next=!poll.is_pinned; var r=await supabase.from('polls').update({is_pinned:next}).eq('id',poll.id); if(r.error)throw r.error; mascotSuccessToast(next?'Poll pinned.':'Poll unpinned.'); if(onPollUpdated)onPollUpdated(Object.assign({},poll,{is_pinned:next})); } catch(err){ mascotErrorToast('Failed to update poll.'); } }
  async function handleToggleStatus() { try { var next=isClosed?'active':'closed'; var r=await supabase.from('polls').update({status:next}).eq('id',poll.id); if(r.error)throw r.error; mascotSuccessToast(next==='closed'?'Poll closed.':'Poll reopened.'); if(onPollUpdated)onPollUpdated(Object.assign({},poll,{status:next})); await loadPollData(); } catch(err){ mascotErrorToast('Failed to update poll status.'); } }

  async function handleDuplicate() {
    if (duplicating) return; setDuplicating(true);
    try {
      var authResult=await supabase.auth.getUser(); var user=authResult.data.user;
      var newPoll=await supabase.from('polls').insert({organization_id:poll.organization_id,title:poll.title+' (Copy)',description:poll.description,poll_type:poll.poll_type,visibility:poll.visibility,allow_anonymous:poll.allow_anonymous,show_results_before_close:poll.show_results_before_close,allow_vote_changes:poll.allow_vote_changes,closes_at:null,retention_days:poll.retention_days,result_visibility:poll.result_visibility||'full',status:'active',is_pinned:false,created_by:user.id,approval_status:'approved'}).select().single();
      if (newPoll.error) throw newPoll.error;
      var newPollId=newPoll.data.id;
      for (var qi=0;qi<questionsData.length;qi++) {
        var qd=questionsData[qi];
        var nqRes=await supabase.from('poll_questions').insert({poll_id:newPollId,question_text:qd.question.question_text,question_type:qd.question.question_type,display_order:qi}).select().single();
        if(nqRes.error)throw nqRes.error;
        var nqId=nqRes.data.id;
        if(qd.question.question_type==='yes_no_abstain'){await supabase.from('poll_options').insert([{poll_id:newPollId,question_id:nqId,option_text:'Yes',display_order:0},{poll_id:newPollId,question_id:nqId,option_text:'No',display_order:1},{poll_id:newPollId,question_id:nqId,option_text:'Abstain',display_order:2}]);}
        else{var optInserts=qd.options.map(function(o,oi){return{poll_id:newPollId,question_id:nqId,option_text:o.option_text,display_order:oi};});if(optInserts.length>0)await supabase.from('poll_options').insert(optInserts);}
      }
      mascotSuccessToast('Poll duplicated!',poll.title+' (Copy) created.');
      if (onDuplicate) onDuplicate(newPoll.data);
    } catch(err){ mascotErrorToast('Failed to duplicate poll.',err.message); }
    finally { setDuplicating(false); }
  }

  function openSaveTemplate() { setTemplateName(poll.title||'My Poll Template'); setShowSaveTemplate(true); }

  async function handleSaveTemplate() {
    var name=templateName.trim(); if(!name){toast.error('Template name cannot be empty.');return;} setSavingTemplate(true);
    try {
      var auth=await supabase.auth.getUser(); if(!auth.data.user)throw new Error('Not authenticated');
      var templateQuestions=questionsData.map(function(qd){var isYesNo=qd.question.question_type==='yes_no_abstain';return{question_text:qd.question.question_text,question_type:qd.question.question_type,options:isYesNo?[]:qd.options.map(function(o){return o.option_text;})};});
      var r=await supabase.from('poll_survey_templates').insert({organization_id:poll.organization_id,type:'poll',name:name,template_data:{title:poll.title,description:poll.description,visibility:poll.visibility,allow_anonymous:poll.allow_anonymous,show_results_before_close:poll.show_results_before_close,allow_vote_changes:poll.allow_vote_changes,result_visibility:poll.result_visibility||'full',questions:templateQuestions},created_by:auth.data.user.id});
      if(r.error)throw r.error;
      mascotSuccessToast('Template saved!','"'+name+'" added to your templates.');
      setShowSaveTemplate(false); setTemplateName('');
    } catch(err){ mascotErrorToast('Failed to save template.',err.message); }
    finally { setSavingTemplate(false); }
  }

  async function handleNotifyNonVoters() {
    if(notifying||isClosed)return; setNotifying(true); var loadId=toast.loading('Sending reminders...');
    try {
      var membersResult=await supabase.from('memberships').select('member_id').eq('organization_id',poll.organization_id).eq('status','active'); if(membersResult.error)throw membersResult.error;
      var votersResult=await supabase.from('poll_votes').select('member_id').eq('poll_id',poll.id); if(votersResult.error)throw votersResult.error;
      var voterIds=new Set((votersResult.data||[]).map(function(v){return v.member_id;}));
      var auth=await supabase.auth.getUser(); var currentUserId=auth.data.user?auth.data.user.id:null;
      var recipientIds=(membersResult.data||[]).map(function(m){return m.member_id;}).filter(function(id){return id!=null&&!voterIds.has(id)&&id!==currentUserId;});
      toast.dismiss(loadId);
      if(recipientIds.length===0){toast.error('Everyone has already voted.');return;}
      var closesText=poll.closes_at?' Closes '+format(new Date(poll.closes_at),'MMM d')+'.':'';
      await notifyUsers({userIds:recipientIds,organizationId:poll.organization_id,type:'new_poll',title:'Reminder: '+poll.title,message:"You haven't voted on this poll yet."+closesText,link:'/organizations/'+poll.organization_id+'/polls'});
      var now=new Date().toISOString();
      await supabase.from('polls').update({last_reminded_at:now}).eq('id',poll.id);
      setLastRemindedAt(now); if(onRemind)onRemind(poll.id,now);
      window.dispatchEvent(new CustomEvent('notificationCreated'));
      mascotSuccessToast(recipientIds.length+' reminder'+(recipientIds.length!==1?'s':'')+' sent!');
    } catch(err){ toast.dismiss(loadId); mascotErrorToast('Failed to send reminders.',err.message); }
    finally { setNotifying(false); }
  }

  async function handleDelete() {
    try { var r=await supabase.from('polls').delete().eq('id',poll.id); if(r.error)throw r.error; if(onDelete)onDelete(poll.id); }
    catch(err){ mascotErrorToast('Failed to delete poll.','Please try again.'); }
  }

  function handleExportCSV() {
    var rows=[['Poll','Question','Question Type','Option','Votes','Percentage']];
    questionsData.forEach(function(qd){
      var qTotal=qd.results.reduce(function(s,r){return s+Number(r.vote_count);},0);
      qd.options.forEach(function(opt,oi){var result=qd.results.find(function(r){return r.option_id===opt.id;});rows.push([oi===0?poll.title:'',oi===0?qd.question.question_text:'',oi===0?(QUESTION_TYPE_LABELS[qd.question.question_type]||qd.question.question_type):'',opt.option_text,result?result.vote_count:0,(result?result.percentage:0)+'%']);});
      if(qd.options.length>0){rows.push(['','','','TOTAL',qTotal,'100%']);rows.push(['','','','','','']);}
    });
    var csv=rows.map(function(row){return row.map(function(cell){return'"'+String(cell).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var blob=new Blob([csv],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=poll.title.replace(/[^a-z0-9]/gi,'_').toLowerCase()+'_results.csv';a.click();URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="rounded-xl border p-4 animate-pulse bg-white border-slate-200"><div className="h-5 w-2/3 rounded mb-2 bg-gray-200"/><div className="h-4 w-1/3 rounded bg-gray-100"/></div>;
  }

  var articleBorder = poll.is_pinned ? 'border-[#F5B731] border-2' : urgentClose ? 'border-red-300 border-2' : soonClose ? 'border-orange-300 border-2' : 'border-slate-200';

  // ── Shared expanded body (same for admin and member) ──────────────────────
  function renderExpandedBody() {
    return (
      <div id={'poll-body-'+poll.id} className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">

        {/* Make Template inline panel — admin only */}
        {isAdmin && showSaveTemplate && (
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-3 space-y-2" data-no-collapse="true">
            <p className="text-xs font-semibold text-[#0E1523]">Save as Template</p>
            <div className="flex items-center gap-2">
              <label htmlFor={'tname-'+poll.id} className="sr-only">Template name</label>
              <input id={'tname-'+poll.id} type="text" value={templateName} onChange={function(e){setTemplateName(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter'){e.preventDefault();handleSaveTemplate();}if(e.key==='Escape'){setShowSaveTemplate(false);setTemplateName('');}}} maxLength={100} autoFocus placeholder="Template name" className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white text-gray-900"/>
              <button type="button" onClick={handleSaveTemplate} disabled={savingTemplate||!templateName.trim()} className="px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">{savingTemplate?'Saving...':'Save'}</button>
              <button type="button" onClick={function(){setShowSaveTemplate(false);setTemplateName('');}} className="p-1.5 text-[#94A3B8] hover:text-[#475569] rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" aria-label="Cancel"><Icon path={ICONS.x} className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}

        {poll.description && <p className="text-sm text-[#475569]">{poll.description}</p>}

        {/* Chart toggle */}
        {canSeeResults && effectiveVis === 'full' && totalVotes > 0 && (
          <div className="flex items-center justify-end gap-1">
            <button onClick={function(){setChartMode('bar');}} className={'p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 '+(chartMode==='bar'?'bg-blue-50 text-blue-600':'text-gray-400 hover:bg-gray-100')} aria-label="Bar chart" aria-pressed={chartMode==='bar'}><Icon path={ICONS.barChart} className="h-3.5 w-3.5"/></button>
            <button onClick={function(){setChartMode('pie');}} className={'p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 '+(chartMode==='pie'?'bg-blue-50 text-blue-600':'text-gray-400 hover:bg-gray-100')} aria-label="Pie chart" aria-pressed={chartMode==='pie'}><Icon path={ICONS.pieChart} className="h-3.5 w-3.5"/></button>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {questionsData.map(function(qd,qi){
            var qHasVoted=qd.userVoteOptionIds.length>0,qCanVote=!isClosed&&(!qHasVoted||poll.allow_vote_changes),qSelected=selectedOptions[qd.question.id]||[];
            return(
              <div key={qd.question.id}>
                {questionsData.length>1&&(<div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-[#F5B731] uppercase tracking-widest">Q{qi+1}</span><span className="text-sm font-semibold text-[#0E1523]">{qd.question.question_text}</span><span className="ml-auto text-xs text-[#94A3B8]">{QUESTION_TYPE_LABELS[qd.question.question_type]||qd.question.question_type}</span></div>)}
                {questionsData.length===1&&<p className="text-sm font-semibold text-[#0E1523] mb-2">{qd.question.question_text}</p>}
                <QuestionSection question={qd.question} options={qd.options} results={qd.results} userVoteOptionIds={qd.userVoteOptionIds} canVote={qCanVote} canSeeResults={canSeeResults} effectiveVisibility={effectiveVis} selectedOptions={qSelected} onOptionSelect={function(optId){handleOptionSelect(qd.question.id,optId,qd.question.question_type);}} chartMode={chartMode} isAdmin={isAdmin}/>
              </div>
            );
          })}
        </div>

        {/* Submit vote */}
        {canVote && hasAnySelection && (
          <button onClick={handleSubmitVote} disabled={voting} className="w-full px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {voting?<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"/>Submitting...</>:(hasVotedAny?'Update Vote':'Submit Vote')}
          </button>
        )}

        {/* Participation bar — admin only */}
        {isAdmin && memberCount > 0 && totalVotes > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1"><span className="text-xs text-[#64748B]">Participation</span><span className="text-xs font-semibold text-[#475569] tabular-nums">{totalVotes}/{memberCount} ({responseRate}%)</span></div>
            <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={responseRate} aria-valuemin={0} aria-valuemax={100} aria-label={'Poll participation: '+responseRate+'%'}>
              <div className={'h-full rounded-full transition-all '+(responseRate>=75?'bg-green-500':responseRate>=40?'bg-blue-500':'bg-orange-400')} style={{width:Math.min(responseRate,100)+'%'}}/>
            </div>
          </div>
        )}

        {/* Footer meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] border-t border-slate-100 pt-3">
          <span>Created {format(new Date(poll.created_at),'MMM d, yyyy')}</span>
          {poll.closes_at&&<span>{isClosed?'Closed':'Closes'} {format(new Date(poll.closes_at),'MMM d, yyyy')}</span>}
          {isAdmin&&lastRemindedAt&&<span>{'Reminded '+formatDistanceToNow(new Date(lastRemindedAt),{addSuffix:true})}</span>}
          {poll.retention_days&&<span>Deletes after {poll.retention_days===365?'1 year':poll.retention_days+' days'}</span>}
        </div>
      </div>
    );
  }

  return (
    <article className={'rounded-xl border bg-white ' + articleBorder} aria-label={poll.title + ' poll'}>
      <CollapsedHeader
        poll={poll}
        isClosed={isClosed}
        questionsData={questionsData}
        totalVotes={totalVotes}
        responseRate={isAdmin ? responseRate : null}
        hasVotedAny={hasVotedAny}
        urgentClose={urgentClose}
        soonClose={soonClose}
        hoursLeft={hoursLeft}
        daysLeft={daysLeft}
        expanded={expanded}
        onToggle={function(){ setExpanded(function(v){ return !v; }); }}
        rightSlot={isAdmin ? (
          <ActionsDropdown
            poll={poll} isClosed={isClosed} duplicating={duplicating} notifying={notifying}
            onEdit={onEdit} onPin={handlePin} onToggleStatus={handleToggleStatus}
            onDuplicate={handleDuplicate} onRemind={handleNotifyNonVoters}
            onSaveTemplate={openSaveTemplate} onExportCSV={handleExportCSV}
            onDelete={function() { setShowDeleteConfirm(true); }} canExport={canSeeResults && totalVotes > 0}
          />
        ) : null}
      />
      {expanded && renderExpandedBody()}

      {showDeleteConfirm && (
        <ConfirmDeleteModal
          title="Delete Poll?"
          message={<>This will permanently remove <strong style={{color:'#0E1523'}}>{poll.title}</strong> and all its votes. This cannot be undone.</>}
          onConfirm={function() { setShowDeleteConfirm(false); handleDelete(); }}
          onCancel={function() { setShowDeleteConfirm(false); }}
        />
      )}
    </article>
  );
}

export default PollCard;