import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast } from '../components/MascotToast';
import EmailAnalyticsModal from '../components/EmailAnalyticsModal';
import NewsletterBuilder from '../components/NewsletterBuilder';
import {
  Mail, Send, FileText, Clock, Users, ChevronDown,
  Plus, Trash2, Edit2, X, AlertCircle, CheckCircle,
  Eye, Save, BarChart2, Layout, TrendingUp, Lock, ArrowRight
} from 'lucide-react';

// ── Plan limits ───────────────────────────────────────────────────────────────
var PLAN_LIMITS = {
  starter: 0,
  growth: 500,
  pro: Infinity
};

// ── Built-in templates ────────────────────────────────────────────────────────
var BUILTIN_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome New Member',
    category: 'Members',
    subject: 'Welcome to {{org_name}}!',
    body: '<p>Hi {{first_name}},</p><p>We\'re so glad you\'ve joined <strong>{{org_name}}</strong>! We\'re a community of passionate people working together to make a difference.</p><p>Here are a few things to get started:</p><ul><li>Complete your member profile</li><li>Check out our upcoming events</li><li>Introduce yourself to the group</li></ul><p>Don\'t hesitate to reach out if you have any questions. We\'re happy to help.</p><p>Warmly,<br/>The {{org_name}} Team</p>'
  },
  {
    id: 'event',
    name: 'Event Announcement',
    category: 'Events',
    subject: 'You\'re invited: {{event_name}}',
    body: '<p>Hi {{first_name}},</p><p>We\'re excited to invite you to an upcoming event!</p><p><strong>{{event_name}}</strong><br/>Date: {{event_date}}<br/>Location: {{event_location}}</p><p>{{event_description}}</p><p>We hope to see you there. RSVP by visiting your member portal.</p><p>Best,<br/>The {{org_name}} Team</p>'
  },
  {
    id: 'dues',
    name: 'Dues Reminder',
    category: 'Finance',
    subject: 'Action needed: Your membership dues are due',
    body: '<p>Hi {{first_name}},</p><p>This is a friendly reminder that your membership dues for <strong>{{org_name}}</strong> are coming up.</p><p>Keeping your dues current ensures you continue to enjoy full member benefits, including access to events, resources, and our member community.</p><p>Please log in to your member portal to update your payment status.</p><p>If you have any questions or need assistance, please don\'t hesitate to reach out.</p><p>Thank you for your continued support,<br/>The {{org_name}} Team</p>'
  },
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    category: 'General',
    subject: '{{org_name}} — {{month}} Update',
    body: '<p>Hi {{first_name}},</p><p>Here\'s what\'s been happening at <strong>{{org_name}}</strong> this month.</p><h3 style="color:#1d4ed8;">Highlights</h3><p>{{highlights}}</p><h3 style="color:#1d4ed8;">Upcoming Events</h3><p>{{upcoming_events}}</p><h3 style="color:#1d4ed8;">In the Community</h3><p>{{community_news}}</p><p>As always, thank you for being a valued member of our community.</p><p>Until next time,<br/>The {{org_name}} Team</p>'
  },
  {
    id: 'volunteer',
    name: 'Volunteer Callout',
    category: 'Volunteers',
    subject: 'We need your help — volunteer opportunity at {{org_name}}',
    body: '<p>Hi {{first_name}},</p><p>We\'re looking for volunteers to help with an upcoming initiative at <strong>{{org_name}}</strong>, and we thought of you!</p><p><strong>What we need:</strong><br/>{{volunteer_details}}</p><p><strong>When:</strong> {{volunteer_date}}<br/><strong>Time commitment:</strong> {{time_commitment}}</p><p>Even a few hours of your time makes a huge difference. If you\'re interested or have questions, please reply to this email or log in to your member portal to sign up.</p><p>Thank you for everything you do,<br/>The {{org_name}} Team</p>'
  }
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={'animate-pulse bg-[#1E2845] rounded ' + (className || '')} aria-hidden="true" />;
}

// ── Usage bar ─────────────────────────────────────────────────────────────────
function UsageBar({ used, limit }) {
  var pct = limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100));
  var color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F5B731' : '#22C55E';
  var isUnlimited = limit === Infinity;
  return (
    <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-700 uppercase tracking-widest text-[#F5B731]">Monthly Usage</span>
        <span className="text-xs text-[#94A3B8]">
          {isUnlimited ? (used + ' sent (unlimited)') : (used + ' / ' + limit + ' emails')}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-[#0E1523] rounded-full h-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={'Email usage: ' + pct + ' percent'}>
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} />
        </div>
      )}
      {!isUnlimited && pct >= 80 && pct < 100 && (
        <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
          <AlertCircle size={12} aria-hidden="true" />
          {limit - used} emails remaining this month.
        </p>
      )}
      {!isUnlimited && pct >= 90 && (
        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
          <AlertCircle size={12} aria-hidden="true" />
          Approaching monthly limit. Upgrade to Pro for unlimited sends.
        </p>
      )}
    </div>
  );
}

// ── Body editor ───────────────────────────────────────────────────────────────
function BodyEditor({ value, onChange }) {
  function wrap(tag) {
    var sel = window.getSelection();
    if (sel && sel.toString()) {
      document.execCommand('insertHTML', false, '<' + tag + '>' + sel.toString() + '</' + tag + '>');
    }
  }
  return (
    <div className="border border-[#2A3550] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      <div className="flex items-center gap-1 px-3 py-2 bg-[#1E2845] border-b border-[#2A3550]">
        {[{ label: 'Bold', tag: 'b', display: 'B' }, { label: 'Italic', tag: 'i', display: 'I' }, { label: 'Underline', tag: 'u', display: 'U' }].map(function(btn) {
          return (
            <button key={btn.tag} type="button" onClick={function() { wrap(btn.tag); }} aria-label={btn.label}
              className={'w-7 h-7 rounded text-sm font-semibold text-[#CBD5E1] hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (btn.tag === 'b' ? 'font-bold' : btn.tag === 'i' ? 'italic' : 'underline')}>
              {btn.display}
            </button>
          );
        })}
        <div className="w-px h-4 bg-[#2A3550] mx-1" aria-hidden="true" />
        <span className="text-xs text-[#64748B]">Use {'{{first_name}}'}, {'{{org_name}}'} for merge tags</span>
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Email body"
        className="min-h-[240px] p-4 text-sm text-[#CBD5E1] bg-[#1A2035] outline-none"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={function(e) { onChange(e.currentTarget.innerHTML); }}
      />
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template, onUse, onDelete, onEdit, isCustom }) {
  var categoryColors = {
    Members: 'bg-[#1D3461] text-blue-400', Events: 'bg-[#1B3A2F] text-green-400',
    Finance: 'bg-[#2D1B4E] text-purple-400', General: 'bg-[#1E2845] text-[#94A3B8]',
    Volunteers: 'bg-[#1B3A2F] text-yellow-400', Newsletter: 'bg-[#2D1B4E] text-purple-400'
  };
  var catClass = categoryColors[template.category] || categoryColors.General;
  return (
    <article className="bg-[#1A2035] border border-[#2A3550] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ' + catClass}>{template.category}</span>
            {isCustom && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#1E2845] text-[#F5B731]">Custom</span>}
          </div>
          <h3 className="text-sm font-700 text-white truncate">{template.name}</h3>
          <p className="text-xs text-[#64748B] mt-0.5 truncate">{template.subject}</p>
        </div>
        {isCustom && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={function() { onEdit(template); }} aria-label={'Edit ' + template.name}
              className="w-7 h-7 flex items-center justify-center rounded text-[#94A3B8] hover:text-white hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Edit2 size={13} aria-hidden="true" />
            </button>
            <button onClick={function() { onDelete(template.id); }} aria-label={'Delete ' + template.name}
              className="w-7 h-7 flex items-center justify-center rounded text-[#94A3B8] hover:text-red-400 hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <button onClick={function() { onUse(template); }}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] flex items-center justify-center gap-1.5">
        <Edit2 size={12} aria-hidden="true" />Use Template
      </button>
    </article>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({ blast, blastStats, planKey, onViewAnalytics }) {
  var date = new Date(blast.sent_at);
  var formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  var time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  var audienceLabel = blast.audience === 'all_members' ? 'All Members' : 'Admins Only';
  var isGrowthPlus = planKey === 'growth' || planKey === 'pro';
  var stats = blastStats[blast.id] || null;

  return (
    <tr className="border-b border-[#2A3550] hover:bg-[#1E2845] transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-white truncate max-w-[240px]">{blast.subject}</p>
        {blast.template_name && <p className="text-xs text-[#64748B] mt-0.5">Template: {blast.template_name}</p>}
        {isGrowthPlus && stats && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-green-400">
              <TrendingUp size={10} aria-hidden="true" />
              {stats.openRate}% opened
            </span>
            <span className="flex items-center gap-1 text-xs text-purple-400">
              <Eye size={10} aria-hidden="true" />
              {stats.clickRate}% clicked
            </span>
            {stats.bounced > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={10} aria-hidden="true" />
                {stats.bounced} bounced
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-[#94A3B8] whitespace-nowrap">{audienceLabel}</td>
      <td className="px-4 py-3 text-sm text-[#94A3B8] whitespace-nowrap">
        <span className="flex items-center gap-1"><Users size={12} aria-hidden="true" />{blast.recipient_count}</span>
      </td>
      <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">{formatted} at {time}</td>
      <td className="px-4 py-3">
        <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ' + (blast.status === 'sent' ? 'bg-[#1B3A2F] text-green-400' : 'bg-[#3B1A1A] text-red-400')}>
          {blast.status === 'sent' ? <CheckCircle size={11} aria-hidden="true" /> : <AlertCircle size={11} aria-hidden="true" />}
          {blast.status === 'sent' ? 'Sent' : 'Failed'}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={function() { onViewAnalytics(blast); }}
          aria-label={'View analytics for ' + blast.subject}
          className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ' + (isGrowthPlus ? 'bg-[#1E2845] hover:bg-[#2A3550] text-[#94A3B8] hover:text-white border border-[#2A3550]' : 'bg-[#1A2035] text-[#2A3550] cursor-default border border-[#2A3550]')}
          title={isGrowthPlus ? 'View analytics' : 'Analytics available on Growth and Pro plans'}
        >
          <BarChart2 size={12} aria-hidden="true" />
          Analytics
        </button>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmailBlasts() {
  var context = useOutletContext();
  var organization = context ? context.organization : null;
  var organizationId = organization ? organization.id : null;
  var isAdmin = context ? context.isAdmin : false;
  var navigate = useNavigate();

  var [tab, setTab] = useState('compose');
  var [loading, setLoading] = useState(true);
  var [sending, setSending] = useState(false);

  // Compose state
  var [subject, setSubject] = useState('');
  var [body, setBody] = useState('');
  var [audience, setAudience] = useState('all_members');
  var [activeTemplateName, setActiveTemplateName] = useState('');

  // Data
  var [blastHistory, setBlastHistory] = useState([]);
  var [customTemplates, setCustomTemplates] = useState([]);
  var [usedThisMonth, setUsedThisMonth] = useState(0);
  var [memberCount, setMemberCount] = useState(0);
  var [planKey, setPlanKey] = useState('starter');
  var [blastStats, setBlastStats] = useState({});

  // Modals
  var [showSaveModal, setShowSaveModal] = useState(false);
  var [saveName, setSaveName] = useState('');
  var [saveCategory, setSaveCategory] = useState('General');
  var [editingTemplate, setEditingTemplate] = useState(null);
  var [showPreview, setShowPreview] = useState(false);
  var [showConfirm, setShowConfirm] = useState(false);
  var [analyticsBlast, setAnalyticsBlast] = useState(null);

  var planLimit = PLAN_LIMITS[planKey] !== undefined ? PLAN_LIMITS[planKey] : 0;
  var remainingEmails = planLimit === Infinity ? Infinity : Math.max(0, planLimit - usedThisMonth);
  var isGrowthPlus = planKey === 'growth' || planKey === 'pro';

  useEffect(function() {
    if (organizationId) loadData();
  }, [organizationId]);

  async function loadData() {
    setLoading(true);
    try {
      // Plan
      var { data: sub } = await supabase
        .from('subscriptions').select('plan').eq('organization_id', organizationId).eq('status', 'active').maybeSingle();
      var plan = sub ? sub.plan : 'starter';
      setPlanKey(plan);

      // Usage this month
      var now = new Date();
      var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      var { data: blasts } = await supabase
        .from('email_blasts').select('*').eq('org_id', organizationId).order('sent_at', { ascending: false });

      var thisMonthBlasts = (blasts || []).filter(function(b) { return b.sent_at >= startOfMonth && b.status === 'sent'; });
      var emailsSent = thisMonthBlasts.reduce(function(sum, b) { return sum + (b.recipient_count || 0); }, 0);
      setUsedThisMonth(emailsSent);
      setBlastHistory(blasts || []);

      // Load analytics summary for Growth/Pro
      if (plan !== 'starter' && (blasts || []).length > 0) {
        var blastIds = (blasts || []).map(function(b) { return b.id; });
        var { data: eventsData } = await supabase
          .from('email_events')
          .select('blast_id, resend_email_id, event_type')
          .in('blast_id', blastIds);

        var statsMap = {};
        blastIds.forEach(function(id) { statsMap[id] = { opened: new Set(), clicked: new Set(), bounced: new Set() }; });
        (eventsData || []).forEach(function(e) {
          if (!statsMap[e.blast_id] || !e.resend_email_id) return;
          if (e.event_type === 'opened')  statsMap[e.blast_id].opened.add(e.resend_email_id);
          if (e.event_type === 'clicked') statsMap[e.blast_id].clicked.add(e.resend_email_id);
          if (e.event_type === 'bounced') statsMap[e.blast_id].bounced.add(e.resend_email_id);
        });

        var computedStats = {};
        blastIds.forEach(function(id) {
          var blast = (blasts || []).find(function(b) { return b.id === id; });
          var total = blast ? (blast.recipient_count || 1) : 1;
          var s = statsMap[id];
          computedStats[id] = {
            opened:    s.opened.size,
            clicked:   s.clicked.size,
            bounced:   s.bounced.size,
            openRate:  Math.round((s.opened.size / total) * 100),
            clickRate: Math.round((s.clicked.size / total) * 100)
          };
        });
        setBlastStats(computedStats);
      }

      // Templates
      var { data: templates } = await supabase.from('email_templates').select('*').eq('org_id', organizationId).order('created_at', { ascending: false });
      setCustomTemplates(templates || []);

      // Member count
      var { count } = await supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active');
      setMemberCount(count || 0);

    } catch (err) {
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  }

  function useTemplate(template) {
    setSubject(template.subject);
    setBody(template.body);
    setActiveTemplateName(template.name);
    setTab('compose');
    toast('Template loaded — customize it before sending.', { icon: null, style: { background: '#1A2035', color: '#CBD5E1', border: '1px solid #2A3550' } });
  }

  async function saveTemplate() {
    if (!saveName.trim()) { toast.error('Please enter a template name'); return; }
    if (!subject.trim() || !body.trim()) { toast.error('Write your email first, then save as template'); return; }
    try {
      var { data: { user } } = await supabase.auth.getUser();
      if (editingTemplate) {
        var { error } = await supabase.from('email_templates').update({ name: saveName.trim(), subject: subject, body: body, category: saveCategory, updated_at: new Date().toISOString() }).eq('id', editingTemplate.id);
        if (error) throw error;
        mascotSuccessToast('Template updated!', saveName.trim() + ' has been saved.');
      } else {
        var { error: insertError } = await supabase.from('email_templates').insert({ org_id: organizationId, name: saveName.trim(), subject: subject, body: body, category: saveCategory, created_by: user.id });
        if (insertError) throw insertError;
        mascotSuccessToast('Template saved!', saveName.trim() + ' is now in your templates.');
      }
      setShowSaveModal(false); setSaveName(''); setEditingTemplate(null);
      loadData();
    } catch (err) { toast.error('Failed to save template'); }
  }

  function openEditTemplate(template) {
    setSubject(template.subject); setBody(template.body); setActiveTemplateName(template.name);
    setEditingTemplate(template); setSaveName(template.name); setSaveCategory(template.category);
    setShowSaveModal(true); setTab('compose');
  }

  async function deleteTemplate(id) {
    try {
      var { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      setCustomTemplates(customTemplates.filter(function(t) { return t.id !== id; }));
      mascotSuccessToast('Template deleted');
    } catch (err) { toast.error('Failed to delete template'); }
  }

  async function sendBlast() {
    setShowConfirm(false); setSending(true);
    try {
      var { data: { session } } = await supabase.auth.getSession();
      var res = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/send-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({ org_id: organizationId, subject: subject, html_body: body, audience: audience, template_name: activeTemplateName || null })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      mascotSuccessToast('Email blast sent!', data.sent_count + ' member' + (data.sent_count !== 1 ? 's' : '') + ' received your message.');
      setSubject(''); setBody(''); setActiveTemplateName(''); setAudience('all_members');
      loadData(); setTab('history');
    } catch (err) { toast.error(err.message || 'Failed to send email blast');
    } finally { setSending(false); }
  }

  var canSend = subject.trim() && body.trim() && !sending && isGrowthPlus && (planLimit === Infinity || usedThisMonth < planLimit);
  var recipientEstimate = audience === 'admins_only' ? 'Admins only' : memberCount + ' active member' + (memberCount !== 1 ? 's' : '');

  // ── Access guard: admin only ──────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <main className="flex-1 p-6 bg-[#0E1523] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Mail size={48} className="text-[#2A3550] mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-700 text-white mb-2">Admin Access Required</h2>
          <p className="text-sm text-[#64748B]">Only organization admins can send email blasts.</p>
        </div>
      </main>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex-1 bg-[#0E1523] min-h-screen" aria-label="Email Blasts loading">
        <div className="bg-[#151B2D] border-b border-[#2A3550] px-6 py-5">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-48" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
      </main>
    );
  }

  // ── Plan gate: Starter — render page dimmed with overlay modal ───────────
  if (planKey === 'starter') {
    return (
      <main className="flex-1 bg-[#0E1523] min-h-screen" aria-label="Email Blasts">
        {/* Page header */}
        <div className="bg-[#151B2D] border-b border-[#2A3550] px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-1">Communications</p>
              <h1 className="text-2xl font-800 text-white">Email Blasts</h1>
              <p className="text-sm text-[#94A3B8] mt-0.5">Send announcements and updates directly to your members.</p>
            </div>
          </div>
          {/* Tabs — dimmed */}
          <div className="flex mt-5 border-b border-[#2A3550] opacity-40 pointer-events-none select-none" aria-hidden="true">
            {[
              { key: 'compose', label: 'Compose', Icon: Mail },
              { key: 'newsletter', label: 'Newsletter', Icon: Layout },
              { key: 'templates', label: 'Templates', Icon: FileText },
              { key: 'history', label: 'Send History', Icon: Clock },
            ].map(function(t) {
              return (
                <div key={t.key} className={'flex items-center gap-2 px-4 py-2.5 text-sm font-600 border-b-2 -mb-px ' + (t.key === 'compose' ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#64748B]')}>
                  <t.Icon size={14} />
                  {t.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dimmed page body + overlay */}
        <div className="relative">
          {/* Dimmed background content — non-interactive */}
          <div className="p-6 opacity-20 pointer-events-none select-none" aria-hidden="true">
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="h-12 bg-[#1A2035] border border-[#2A3550] rounded-lg" />
              <div className="h-12 bg-[#1A2035] border border-[#2A3550] rounded-lg" />
              <div className="h-48 bg-[#1A2035] border border-[#2A3550] rounded-lg" />
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <div className="h-10 w-24 bg-[#1A2035] border border-[#2A3550] rounded-lg" />
                  <div className="h-10 w-36 bg-[#1A2035] border border-[#2A3550] rounded-lg" />
                </div>
                <div className="h-10 w-28 bg-blue-500 bg-opacity-30 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Upgrade overlay */}
          <div className="absolute inset-0 flex items-start justify-center pt-16 px-4" style={{ background: 'rgba(14,21,35,0.7)' }}>
            <div className="w-full max-w-md bg-[#1A2035] border border-[#2A3550] rounded-2xl p-8 shadow-2xl">

              <div className="w-14 h-14 rounded-2xl bg-[#1E2845] border border-[#2A3550] flex items-center justify-center mx-auto mb-5" aria-hidden="true">
                <Lock size={24} className="text-[#64748B]" />
              </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-700 uppercase tracking-widest bg-blue-500 bg-opacity-15 border border-blue-500 border-opacity-30 text-blue-400 mb-4">
                Available on Growth
              </span>

              <h2 className="text-xl font-800 text-white mb-2">Email Blasts &amp; Newsletter Builder</h2>
              <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
                Send announcements, updates, and beautifully designed newsletters directly to your members.
              </p>

              <ul className="text-left space-y-3 mb-8" role="list" aria-label="Features included with Growth">
                {[
                  { icon: Send,     text: 'Email blasts to all members or admins — up to 500/month' },
                  { icon: Layout,   text: 'Drag-and-drop newsletter builder with 11 block types' },
                  { icon: BarChart2,text: 'Open rates, click rates, and bounce tracking per campaign' },
                  { icon: FileText, text: 'Reusable templates for announcements, events, and more' },
                ].map(function(item, i) {
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#1E2845] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                        <item.icon size={13} className="text-blue-400" />
                      </div>
                      <span className="text-sm text-[#CBD5E1]">{item.text}</span>
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1A2035] transition-colors"
              >
                Upgrade to Growth
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <p className="text-xs text-[#64748B] mt-3 text-center">$39/mo — or $390/yr (2 months free)</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Full page (Growth / Pro) ──────────────────────────────────────────────
  return (
    <main className="flex-1 bg-[#0E1523] min-h-screen" aria-label="Email Blasts">

      {/* Page header */}
      <div className="bg-[#151B2D] border-b border-[#2A3550] px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-1">Communications</p>
            <h1 className="text-2xl font-800 text-white">Email Blasts</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">Send announcements and updates directly to your members.</p>
          </div>
          <UsageBar used={usedThisMonth} limit={planLimit} />
        </div>

        {/* Tabs */}
        <div className="flex mt-5 border-b border-[#2A3550]" role="tablist" aria-label="Email blast sections">
          {[
            { key: 'compose',    label: 'Compose',      Icon: Mail },
            { key: 'newsletter', label: 'Newsletter',   Icon: Layout },
            { key: 'templates',  label: 'Templates',    Icon: FileText },
            { key: 'history',    label: 'Send History', Icon: Clock }
          ].map(function(t) {
            var active = tab === t.key;
            return (
              <button key={t.key} role="tab" aria-selected={active} onClick={function() { setTab(t.key); }}
                className={'flex items-center gap-2 px-4 py-2.5 text-sm font-600 border-b-2 -mb-px transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (active ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#64748B] hover:text-[#94A3B8]')}>
                <t.Icon size={14} aria-hidden="true" />
                {t.label}
                {t.key === 'history' && blastHistory.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#1E2845] text-[#94A3B8]">{blastHistory.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">

        {/* ── COMPOSE TAB ───────────────────────────────────────────────── */}
        {tab === 'compose' && (
          <div className="max-w-3xl mx-auto space-y-5">
            {planLimit !== Infinity && remainingEmails === 0 && (
              <div role="alert" className="flex items-start gap-3 p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-xl">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Monthly limit reached</p>
                  <p className="text-xs text-red-400 text-opacity-80 mt-0.5">
                    You've used all {planLimit} emails for this month. Upgrade to Pro for unlimited sends.
                  </p>
                  <button
                    onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
                    className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    View upgrade options
                  </button>
                </div>
              </div>
            )}
            {activeTemplateName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1E2845] border border-[#2A3550] rounded-lg">
                <FileText size={13} className="text-[#F5B731]" aria-hidden="true" />
                <span className="text-xs text-[#CBD5E1]">Template: <strong>{activeTemplateName}</strong></span>
                <button onClick={function() { setActiveTemplateName(''); }} aria-label="Clear template" className="ml-auto text-[#64748B] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            )}
            <div>
              <label htmlFor="blast-subject" className="block text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-2">Subject Line</label>
              <input id="blast-subject" type="text" value={subject} onChange={function(e) { setSubject(e.target.value); }} placeholder="Enter email subject..." aria-required="true"
                className="w-full px-4 py-3 bg-[#1A2035] border border-[#2A3550] rounded-lg text-white placeholder-[#64748B] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="blast-audience" className="block text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-2">Send To</label>
              <div className="relative">
                <select id="blast-audience" value={audience} onChange={function(e) { setAudience(e.target.value); }}
                  className="w-full px-4 py-3 bg-[#1A2035] border border-[#2A3550] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10">
                  <option value="all_members">All Active Members ({memberCount})</option>
                  <option value="admins_only">Admins Only</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" aria-hidden="true" />
              </div>
              <p className="text-xs text-[#64748B] mt-1.5 flex items-center gap-1">
                <Users size={11} aria-hidden="true" />Estimated recipients: {recipientEstimate}
              </p>
            </div>
            <div>
              <label className="block text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-2">Message Body</label>
              <BodyEditor value={body} onChange={setBody} />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <div className="flex items-center gap-2">
                <button onClick={function() { setShowPreview(true); }} disabled={!body.trim()} aria-label="Preview email"
                  className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[#2A3550] text-[#94A3B8] hover:text-white hover:border-[#94A3B8] text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
                  <Eye size={14} aria-hidden="true" />Preview
                </button>
                <button onClick={function() { setSaveName(activeTemplateName || ''); setShowSaveModal(true); }} disabled={!subject.trim() || !body.trim()} aria-label="Save as template"
                  className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[#2A3550] text-[#94A3B8] hover:text-white hover:border-[#94A3B8] text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
                  <Save size={14} aria-hidden="true" />Save as Template
                </button>
              </div>
              <button onClick={function() { setShowConfirm(true); }} disabled={!canSend}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0E1523] disabled:opacity-40 disabled:cursor-not-allowed">
                {sending
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />Sending...</>
                  : <><Send size={14} aria-hidden="true" />Send Blast</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── NEWSLETTER TAB ────────────────────────────────────────────── */}
        {tab === 'newsletter' && (
          <div className="-mx-6 -mb-6" style={{ height: 'calc(100vh - 220px)' }}>
            <NewsletterBuilder
              organization={organization}
              planKey={planKey}
              organizationId={organizationId}
              usedThisMonth={usedThisMonth}
              planLimit={planLimit}
              onSent={function() { loadData(); setTab('history'); }}
            />
          </div>
        )}

        {/* ── TEMPLATES TAB ─────────────────────────────────────────────── */}
        {tab === 'templates' && (
          <div className="space-y-6">
            <section aria-labelledby="builtin-heading">
              <h2 id="builtin-heading" className="text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-3">Built-in Templates</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BUILTIN_TEMPLATES.map(function(t) { return <TemplateCard key={t.id} template={t} onUse={useTemplate} isCustom={false} />; })}
              </div>
            </section>
            <section aria-labelledby="custom-heading">
              <div className="flex items-center justify-between mb-3">
                <h2 id="custom-heading" className="text-xs font-700 uppercase tracking-widest text-[#F5B731]">Your Templates</h2>
                <button onClick={function() { setTab('compose'); setTimeout(function() { setShowSaveModal(true); }, 100); }}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">
                  <Plus size={13} aria-hidden="true" />New Template
                </button>
              </div>
              {customTemplates.length === 0 ? (
                <div className="text-center py-12 bg-[#1A2035] border border-[#2A3550] rounded-xl">
                  <FileText size={36} className="text-[#2A3550] mx-auto mb-3" aria-hidden="true" />
                  <h3 className="text-sm font-700 text-white mb-1">No saved templates yet</h3>
                  <p className="text-xs text-[#64748B] mb-4">Write an email and click "Save as Template" to build your library.</p>
                  <button onClick={function() { setTab('compose'); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Compose an Email
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {customTemplates.map(function(t) { return <TemplateCard key={t.id} template={t} onUse={useTemplate} onDelete={deleteTemplate} onEdit={openEditTemplate} isCustom={true} />; })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div>
            {blastHistory.length === 0 ? (
              <div className="text-center py-16 bg-[#1A2035] border border-[#2A3550] rounded-xl">
                <BarChart2 size={40} className="text-[#2A3550] mx-auto mb-3" aria-hidden="true" />
                <h3 className="text-sm font-700 text-white mb-1">No emails sent yet</h3>
                <p className="text-xs text-[#64748B] mb-4">Your send history will appear here after your first blast.</p>
                <button onClick={function() { setTab('compose'); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Send Your First Blast
                </button>
              </div>
            ) : (
              <div className="bg-[#1A2035] border border-[#2A3550] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" role="table" aria-label="Email send history">
                    <thead>
                      <tr className="bg-[#1E2845] text-left">
                        <th scope="col" className="px-4 py-3 text-xs font-700 uppercase tracking-widest text-[#F5B731]">Subject</th>
                        <th scope="col" className="px-4 py-3 text-xs font-700 uppercase tracking-widest text-[#F5B731]">Audience</th>
                        <th scope="col" className="px-4 py-3 text-xs font-700 uppercase tracking-widest text-[#F5B731]">Recipients</th>
                        <th scope="col" className="px-4 py-3 text-xs font-700 uppercase tracking-widest text-[#F5B731]">Sent</th>
                        <th scope="col" className="px-4 py-3 text-xs font-700 uppercase tracking-widest text-[#F5B731]">Status</th>
                        <th scope="col" className="px-4 py-3 text-xs font-700 uppercase tracking-widest text-[#F5B731]">Analytics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blastHistory.map(function(blast) {
                        return (
                          <HistoryRow
                            key={blast.id}
                            blast={blast}
                            blastStats={blastStats}
                            planKey={planKey}
                            onViewAnalytics={setAnalyticsBlast}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Preview modal ─────────────────────────────────────────────────── */}
      {showPreview && (
        <div role="dialog" aria-modal="true" aria-labelledby="preview-title" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3550]">
              <h2 id="preview-title" className="text-base font-700 text-white">Email Preview</h2>
              <button onClick={function() { setShowPreview(false); }} aria-label="Close preview" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="bg-white rounded-xl overflow-hidden max-w-lg mx-auto">
                <div className="bg-[#0E1523] px-6 py-5 text-center">
                  <span className="text-lg font-extrabold text-white">{organization ? organization.name : 'Your Organization'}</span>
                </div>
                <div className="px-6 py-6">
                  <p className="text-sm text-gray-700 mb-1"><strong>Subject:</strong> {subject}</p>
                  <hr className="my-3 border-gray-200" />
                  <p className="text-sm text-gray-700 mb-3">Hi [Member Name],</p>
                  <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-400">
                    You received this email as a member of <strong>{organization ? organization.name : 'your organization'}</strong>.<br />
                    Powered by <span style={{ color: '#F5B731', fontWeight: 700 }}>Syndi</span><span style={{ color: '#374151', fontWeight: 700 }}>cade</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm send modal ─────────────────────────────────────────────── */}
      {showConfirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-15 flex items-center justify-center flex-shrink-0">
                <Send size={18} className="text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h2 id="confirm-title" className="text-base font-700 text-white mb-1">Confirm Send</h2>
                <p className="text-sm text-[#94A3B8]">
                  You're about to send <strong className="text-white">"{subject}"</strong> to <strong className="text-white">{recipientEstimate}</strong>.
                  {planLimit !== Infinity && (
                    <span className="block mt-1 text-xs text-[#64748B]">
                      This will use approximately {audience === 'admins_only' ? 'a few' : memberCount} of your {remainingEmails} remaining emails this month.
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={function() { setShowConfirm(false); }} className="px-4 py-2 bg-transparent border border-[#2A3550] text-[#94A3B8] hover:text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">Cancel</button>
              <button onClick={sendBlast} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2">
                <Send size={14} aria-hidden="true" />Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save template modal ────────────────────────────────────────────── */}
      {showSaveModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="save-template-title" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-[#1A2035] border border-[#2A3550] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 id="save-template-title" className="text-base font-700 text-white">{editingTemplate ? 'Update Template' : 'Save as Template'}</h2>
              <button onClick={function() { setShowSaveModal(false); setEditingTemplate(null); }} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#2A3550] focus:outline-none focus:ring-2 focus:ring-blue-500">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-2">Template Name</label>
                <input id="template-name" type="text" value={saveName} onChange={function(e) { setSaveName(e.target.value); }} placeholder="e.g. Spring Fundraiser Invite" aria-required="true"
                  className="w-full px-4 py-3 bg-[#0E1523] border border-[#2A3550] rounded-lg text-white placeholder-[#64748B] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="template-category" className="block text-xs font-700 uppercase tracking-widest text-[#F5B731] mb-2">Category</label>
                <div className="relative">
                  <select id="template-category" value={saveCategory} onChange={function(e) { setSaveCategory(e.target.value); }}
                    className="w-full px-4 py-3 bg-[#0E1523] border border-[#2A3550] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10">
                    {['General', 'Members', 'Events', 'Finance', 'Volunteers'].map(function(cat) { return <option key={cat} value={cat}>{cat}</option>; })}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={function() { setShowSaveModal(false); setEditingTemplate(null); }} className="px-4 py-2 bg-transparent border border-[#2A3550] text-[#94A3B8] hover:text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">Cancel</button>
              <button onClick={saveTemplate} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2">
                <Save size={14} aria-hidden="true" />{editingTemplate ? 'Update' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics modal ────────────────────────────────────────────────── */}
      {analyticsBlast && (
        <EmailAnalyticsModal
          blast={analyticsBlast}
          planKey={planKey}
          onClose={function() { setAnalyticsBlast(null); }}
        />
      )}
    </main>
  );
}