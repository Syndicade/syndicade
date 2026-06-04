import { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import EmailAnalyticsModal from '../components/EmailAnalyticsModal';
import NewsletterBuilder from '../components/NewsletterBuilder';
import {
  Mail, Send, FileText, Clock, Users, ChevronDown,
  Plus, Trash2, Edit2, X, AlertCircle, CheckCircle,
  Eye, Save, BarChart2, Layout, TrendingUp, Lock, ArrowRight
} from 'lucide-react';

var PLAN_LIMITS = {
  starter: 0,
  growth: 500,
  pro: Infinity
};

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
    body: '<p>Hi {{first_name}},</p><p>This is a friendly reminder that your membership dues for <strong>{{org_name}}</strong> are coming up.</p><p>Keeping your dues current ensures you continue to enjoy full member benefits, including access to events, resources, and our member community.</p><p>Please log in to your member portal to update your payment status.</p><p>Thank you for your continued support,<br/>The {{org_name}} Team</p>'
  },
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    category: 'General',
    subject: '{{org_name}} — {{month}} Update',
    body: '<p>Hi {{first_name}},</p><p>Here\'s what\'s been happening at <strong>{{org_name}}</strong> this month.</p><h3 style="color:#1d4ed8;">Highlights</h3><p>{{highlights}}</p><h3 style="color:#1d4ed8;">Upcoming Events</h3><p>{{upcoming_events}}</p><p>Until next time,<br/>The {{org_name}} Team</p>'
  },
  {
    id: 'volunteer',
    name: 'Volunteer Callout',
    category: 'Volunteers',
    subject: 'We need your help — volunteer opportunity at {{org_name}}',
    body: '<p>Hi {{first_name}},</p><p>We\'re looking for volunteers to help with an upcoming initiative at <strong>{{org_name}}</strong>, and we thought of you!</p><p><strong>What we need:</strong><br/>{{volunteer_details}}</p><p><strong>When:</strong> {{volunteer_date}}</p><p>Thank you for everything you do,<br/>The {{org_name}} Team</p>'
  }
];

function Skeleton({ className }) {
  return <div className={'animate-pulse bg-slate-200 rounded ' + (className || '')} aria-hidden="true" />;
}

function UsageBar({ used, limit }) {
  var pct = limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100));
  var color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F5B731' : '#22C55E';
  var isUnlimited = limit === Infinity;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#F5B731]">Monthly Usage</span>
        <span className="text-xs text-slate-500">
          {isUnlimited ? (used + ' sent (unlimited)') : (used + ' / ' + limit + ' emails')}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-slate-100 rounded-full h-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={'Email usage: ' + pct + ' percent'}>
          <div className="h-2 rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} />
        </div>
      )}
      {!isUnlimited && pct >= 80 && pct < 100 && (
        <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
          <AlertCircle size={12} aria-hidden="true" />{limit - used} emails remaining this month.
        </p>
      )}
      {!isUnlimited && pct >= 90 && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <AlertCircle size={12} aria-hidden="true" />Approaching monthly limit. Upgrade to Pro for unlimited sends.
        </p>
      )}
    </div>
  );
}

function BodyEditor({ value, onChange }) {
  var editorRef = useRef(null);
  var lastValueRef = useRef(value);

  useEffect(function() {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, []);

  useEffect(function() {
    if (editorRef.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  function wrap(tag) {
    if (editorRef.current) editorRef.current.focus();
    var sel = window.getSelection();
    if (sel && sel.toString()) {
      document.execCommand('insertHTML', false, '<' + tag + '>' + sel.toString() + '</' + tag + '>');
      if (editorRef.current) {
        var newVal = editorRef.current.innerHTML;
        lastValueRef.current = newVal;
        onChange(newVal);
      }
    }
  }

  function insertTag(tag) {
    if (editorRef.current) editorRef.current.focus();
    document.execCommand('insertText', false, tag);
    if (editorRef.current) {
      var newVal = editorRef.current.innerHTML;
      lastValueRef.current = newVal;
      onChange(newVal);
    }
  }

  var mergeTags = ['{{first_name}}', '{{last_name}}'];

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 flex-wrap">
        {[{ label: 'Bold', tag: 'b', display: 'B' }, { label: 'Italic', tag: 'i', display: 'I' }, { label: 'Underline', tag: 'u', display: 'U' }].map(function(btn) {
          return (
            <button key={btn.tag} type="button"
              onMouseDown={function(e) { e.preventDefault(); wrap(btn.tag); }}
              aria-label={btn.label}
              className={'w-7 h-7 rounded text-sm font-semibold text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (btn.tag === 'b' ? 'font-bold' : btn.tag === 'i' ? 'italic' : 'underline')}>
              {btn.display}
            </button>
          );
        })}
        <div className="w-px h-4 bg-slate-200 mx-1" aria-hidden="true" />
        <span className="text-xs text-slate-400 font-semibold mr-1">Insert:</span>
        {mergeTags.map(function(tag) {
          return (
            <button key={tag} type="button"
              onMouseDown={function(e) { e.preventDefault(); insertTag(tag); }}
              aria-label={'Insert ' + tag}
              className="px-1.5 py-0.5 rounded text-xs font-mono bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
              {tag}
            </button>
          );
        })}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Email body"
        className="min-h-[240px] p-4 text-sm text-slate-700 bg-white outline-none"
        onInput={function(e) {
          var newVal = e.currentTarget.innerHTML;
          lastValueRef.current = newVal;
          onChange(newVal);
        }}
      />
    </div>
  );
}

function TemplateCard({ template, onUse, onDelete, onEdit, isCustom }) {
  var categoryColors = {
    Members: 'bg-blue-50 text-blue-700', Events: 'bg-green-50 text-green-700',
    Finance: 'bg-purple-50 text-purple-700', General: 'bg-slate-100 text-slate-600',
    Volunteers: 'bg-yellow-50 text-yellow-700', Newsletter: 'bg-purple-50 text-purple-700'
  };
  var catClass = categoryColors[template.category] || categoryColors.General;
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ' + catClass}>{template.category}</span>
            {isCustom && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-50 text-yellow-700">Custom</span>}
          </div>
          <h3 className="text-sm font-bold text-slate-900 truncate">{template.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{template.subject}</p>
        </div>
        {isCustom && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={function() { onEdit(template); }} aria-label={'Edit ' + template.name}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Edit2 size={13} aria-hidden="true" />
            </button>
            <button onClick={function() { onDelete(template.id); }} aria-label={'Delete ' + template.name}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <button onClick={function() { onUse(template); }}
        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-1.5">
        <Edit2 size={12} aria-hidden="true" />Use Template
      </button>
    </article>
  );
}

function HistoryRow({ blast, blastStats, planKey, onViewAnalytics }) {
  var date = new Date(blast.sent_at);
  var formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  var time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  var isGrowthPlus = planKey === 'growth' || planKey === 'pro';
  var stats = blastStats[blast.id] || null;
  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-900 truncate max-w-[240px]">{blast.subject}</p>
        {blast.template_name && <p className="text-xs text-slate-400 mt-0.5">Template: {blast.template_name}</p>}
        {isGrowthPlus && stats && (
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-green-600"><TrendingUp size={10} aria-hidden="true" />{stats.openRate}% opened</span>
            <span className="flex items-center gap-1 text-xs text-purple-600"><Eye size={10} aria-hidden="true" />{stats.clickRate}% clicked</span>
            {stats.bounced > 0 && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle size={10} aria-hidden="true" />{stats.bounced} bounced</span>}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 max-w-[180px]">
        <span className="truncate block">{blast.audience || '—'}</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
        <span className="flex items-center gap-1"><Users size={12} aria-hidden="true" />{blast.recipient_count}</span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatted} at {time}</td>
      <td className="px-4 py-3">
        <span className={'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ' + (blast.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
          {blast.status === 'sent' ? <CheckCircle size={11} aria-hidden="true" /> : <AlertCircle size={11} aria-hidden="true" />}
          {blast.status === 'sent' ? 'Sent' : 'Failed'}
        </span>
      </td>
      <td className="px-4 py-3">
        <button onClick={function() { onViewAnalytics(blast); }} aria-label={'View analytics for ' + blast.subject}
          className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ' + (isGrowthPlus ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200' : 'bg-slate-50 text-slate-300 cursor-default border border-slate-200')}
          title={isGrowthPlus ? 'View analytics' : 'Analytics available on Growth and Pro plans'}>
          <BarChart2 size={12} aria-hidden="true" />Analytics
        </button>
      </td>
    </tr>
  );
}

// ── Recipient Builder ─────────────────────────────────────────────────────────
function RecipientBuilder({ audiences, onChange, memberCount, orgGroups, orgEvents, organizationId, allOrgMembers, membersLoaded, onLoadMembers }) {
  var [showPicker, setShowPicker] = useState(false);
  var [searchQuery, setSearchQuery] = useState('');
  var pickerRef = useRef(null);

  useEffect(function() {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  function openPicker() {
    setShowPicker(!showPicker);
    if (!membersLoaded) onLoadMembers();
  }

  function addAudience(aud) {
    var exists = audiences.some(function(a) {
      if (a.type !== aud.type) return false;
      if (aud.type === 'group') return a.group_id === aud.group_id;
      if (aud.type === 'event') return a.event_id === aud.event_id;
      if (aud.type === 'individual') return a.email === aud.email;
      return true;
    });
    if (!exists) onChange(audiences.concat([aud]));
  }

  function removeAudience(index) {
    onChange(audiences.filter(function(_, i) { return i !== index; }));
  }

  var searchResults = searchQuery.trim()
    ? allOrgMembers.filter(function(m) {
        var name = (m.full_name || '').toLowerCase();
        var email = (m.email || '').toLowerCase();
        var q = searchQuery.toLowerCase();
        return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
      }).slice(0, 8)
    : [];

  var CHIP_COLORS = {
    all_active:             { bg: '#DBEAFE', text: '#1e3a8a' },
    all_including_inactive: { bg: '#E0E7FF', text: '#3730a3' },
    admins_only:            { bg: '#EDE9FE', text: '#4c1d95' },
    group:                  { bg: '#D1FAE5', text: '#064e3b' },
    event:                  { bg: '#FEF3C7', text: '#78350f' },
    individual:             { bg: '#F1F5F9', text: '#334155' },
  };

  var presets = [
    { type: 'all_active',             label: 'All Active Members' },
    { type: 'all_including_inactive', label: 'All Members (incl. inactive)' },
    { type: 'admins_only',            label: 'Admins Only' },
  ];

  return (
    <div>
      {/* Selected chips */}
      {audiences.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {audiences.map(function(aud, i) {
            var colors = CHIP_COLORS[aud.type] || CHIP_COLORS.individual;
            return (
              <span key={i} style={{ background: colors.bg, color: colors.text }}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-semibold">
                {aud.label}
                <button onClick={function() { removeAudience(i); }} aria-label={'Remove ' + aud.label}
                  style={{ color: colors.text }}
                  className="w-4 h-4 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <X size={10} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Picker trigger */}
      <div ref={pickerRef} className="relative inline-block">
        <button onClick={openPicker} aria-expanded={showPicker} aria-haspopup="listbox"
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          <Plus size={14} aria-hidden="true" />Add Recipients
          <ChevronDown size={13} aria-hidden="true" />
        </button>

        {showPicker && (
          <div role="listbox" aria-label="Select recipients"
            className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-y-auto"
            style={{ minWidth: '288px', maxHeight: '420px' }}>

            <div className="py-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#F5B731] px-4 pt-1 pb-2">Member Groups</p>
              {presets.map(function(preset) {
                var isSelected = audiences.some(function(a) { return a.type === preset.type; });
                return (
                  <button key={preset.type} role="option" aria-selected={isSelected}
                    onClick={function() { addAudience(preset); }}
                    className={'w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50 transition-colors ' + (isSelected ? 'text-blue-500 font-semibold' : 'text-slate-700')}>
                    {preset.label}
                    {isSelected && <CheckCircle size={13} className="text-blue-500 flex-shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {orgGroups.length > 0 && (
              <div className="py-2 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest text-[#F5B731] px-4 pt-1 pb-2">Groups</p>
                {orgGroups.map(function(group) {
                  var isSelected = audiences.some(function(a) { return a.type === 'group' && a.group_id === group.id; });
                  return (
                    <button key={group.id} role="option" aria-selected={isSelected}
                      onClick={function() { addAudience({ type: 'group', group_id: group.id, label: group.name }); }}
                      className={'w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50 transition-colors ' + (isSelected ? 'text-blue-500 font-semibold' : 'text-slate-700')}>
                      {group.name}
                      {isSelected && <CheckCircle size={13} className="text-blue-500 flex-shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}

            {orgEvents.length > 0 && (
              <div className="py-2 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest text-[#F5B731] px-4 pt-1 pb-2">Event Attendees</p>
                {orgEvents.map(function(event) {
                  var isSelected = audiences.some(function(a) { return a.type === 'event' && a.event_id === event.id; });
                  var eventDate = event.start_time ? new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                  return (
                    <button key={event.id} role="option" aria-selected={isSelected}
                      onClick={function() { addAudience({ type: 'event', event_id: event.id, label: event.title + ' attendees' }); }}
                      className={'w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50 transition-colors ' + (isSelected ? 'text-blue-500' : 'text-slate-700')}>
                      <span className="flex-1 text-sm truncate">{event.title}</span>
                      {eventDate && <span className="text-xs text-slate-400 flex-shrink-0">{eventDate}</span>}
                      {isSelected && <CheckCircle size={13} className="text-blue-500 flex-shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="py-2 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-widest text-[#F5B731] px-4 pt-1 pb-2">Individual Members</p>
              <div className="px-3 pb-2">
                <input type="text" value={searchQuery}
                  onChange={function(e) { setSearchQuery(e.target.value); }}
                  placeholder="Search by name or email..."
                  aria-label="Search individual members"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {!membersLoaded && (
                <p className="text-xs text-slate-400 px-4 py-1">Loading members...</p>
              )}
              {membersLoaded && searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-slate-400 px-4 py-1">No members found</p>
              )}
              {membersLoaded && !searchQuery && (
                <p className="text-xs text-slate-400 px-4 py-1">Type a name or email to search</p>
              )}
              {searchResults.map(function(m) {
                var email = m.email;
                var name = m.full_name || email;
                var isSelected = audiences.some(function(a) { return a.type === 'individual' && a.email === email; });
                return (
                  <button key={m.member_id} role="option" aria-selected={isSelected}
                    onClick={function() { addAudience({ type: 'individual', email: email, name: name, label: name }); }}
                    className={'w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50 transition-colors ' + (isSelected ? 'bg-blue-50' : '')}>
                    <div>
                      <p className={'text-sm font-medium ' + (isSelected ? 'text-blue-500' : 'text-slate-900')}>{name}</p>
                      <p className="text-xs text-slate-400">{email}</p>
                    </div>
                    {isSelected && <CheckCircle size={13} className="text-blue-500 flex-shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {audiences.length > 0 && (
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <Users size={11} aria-hidden="true" />
          {audiences.length === 1 && audiences[0].type === 'all_active'
            ? 'Estimated: ' + memberCount + ' active member' + (memberCount !== 1 ? 's' : '')
            : 'Sending to: ' + audiences.map(function(a) { return a.label; }).join(', ')}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmailBlasts() {
  var context = useOutletContext();
  var organization = context ? context.organization : null;
  var organizationId = organization ? organization.id : null;
  var isAdmin = context ? context.isAdmin : false;
  var navigate = useNavigate();
  var location = useLocation();

  var [tab, setTab] = useState('compose');
  var [loading, setLoading] = useState(true);
  var [sending, setSending] = useState(false);
  var [subject, setSubject] = useState('');
  var [body, setBody] = useState('');
  var [audiences, setAudiences] = useState([{ type: 'all_active', label: 'All Active Members' }]);
  var [activeTemplateName, setActiveTemplateName] = useState('');
  var [blastHistory, setBlastHistory] = useState([]);
  var [customTemplates, setCustomTemplates] = useState([]);
  var [usedThisMonth, setUsedThisMonth] = useState(0);
  var [memberCount, setMemberCount] = useState(0);
  var [planKey, setPlanKey] = useState('starter');
  var [blastStats, setBlastStats] = useState({});
  var [showSaveModal, setShowSaveModal] = useState(false);
  var [saveName, setSaveName] = useState('');
  var [saveCategory, setSaveCategory] = useState('General');
  var [editingTemplate, setEditingTemplate] = useState(null);
  var [showPreview, setShowPreview] = useState(false);
  var [showConfirm, setShowConfirm] = useState(false);
  var [analyticsBlast, setAnalyticsBlast] = useState(null);

  var [orgGroups, setOrgGroups] = useState([]);
  var [orgEvents, setOrgEvents] = useState([]);
  var [allOrgMembers, setAllOrgMembers] = useState([]);
  var [membersLoaded, setMembersLoaded] = useState(false);

  var planLimit = PLAN_LIMITS[planKey] !== undefined ? PLAN_LIMITS[planKey] : 0;
  var remainingEmails = planLimit === Infinity ? Infinity : Math.max(0, planLimit - usedThisMonth);
  var isGrowthPlus = planKey === 'growth' || planKey === 'pro';

  useEffect(function() { if (organizationId) loadData(); }, [organizationId]);

  async function loadData() {
    setLoading(true);
    try {
      var subRes = await supabase.from('subscriptions').select('plan').eq('organization_id', organizationId).eq('status', 'active').maybeSingle();
      var plan = subRes.data ? subRes.data.plan : 'starter';
      setPlanKey(plan);

      var now = new Date();
      var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      var blastsRes = await supabase.from('email_blasts').select('*').eq('org_id', organizationId).order('sent_at', { ascending: false });
      var blasts = blastsRes.data || [];
      var thisMonthBlasts = blasts.filter(function(b) { return b.sent_at >= startOfMonth && b.status === 'sent'; });
      setUsedThisMonth(thisMonthBlasts.reduce(function(sum, b) { return sum + (b.recipient_count || 0); }, 0));
      setBlastHistory(blasts);

      if (plan !== 'starter' && blasts.length > 0) {
        var blastIds = blasts.map(function(b) { return b.id; });
        var eventsRes = await supabase.from('email_events').select('blast_id, resend_email_id, event_type').in('blast_id', blastIds);
        var statsMap = {};
        blastIds.forEach(function(id) { statsMap[id] = { opened: new Set(), clicked: new Set(), bounced: new Set() }; });
        (eventsRes.data || []).forEach(function(e) {
          if (!statsMap[e.blast_id] || !e.resend_email_id) return;
          if (e.event_type === 'opened')  statsMap[e.blast_id].opened.add(e.resend_email_id);
          if (e.event_type === 'clicked') statsMap[e.blast_id].clicked.add(e.resend_email_id);
          if (e.event_type === 'bounced') statsMap[e.blast_id].bounced.add(e.resend_email_id);
        });
        var computedStats = {};
        blastIds.forEach(function(id) {
          var blast = blasts.find(function(b) { return b.id === id; });
          var total = blast ? (blast.recipient_count || 1) : 1;
          var s = statsMap[id];
          computedStats[id] = { opened: s.opened.size, clicked: s.clicked.size, bounced: s.bounced.size, openRate: Math.round((s.opened.size / total) * 100), clickRate: Math.round((s.clicked.size / total) * 100) };
        });
        setBlastStats(computedStats);
      }

      var templatesRes = await supabase.from('email_templates').select('*').eq('org_id', organizationId).order('created_at', { ascending: false });
      setCustomTemplates(templatesRes.data || []);

      var countRes = await supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active');
      setMemberCount(countRes.count || 0);

      // Load groups for recipient builder — T6: pre-select group from ?group= query param
      try {
        var groupsRes = await supabase.from('org_groups').select('id, name').eq('organization_id', organizationId).eq('is_active', true).order('name');
        var groups = groupsRes.data || [];
        setOrgGroups(groups);

        var params = new URLSearchParams(location.search);
        var preselectedGroupId = params.get('group');
        if (preselectedGroupId) {
          var matchedGroup = groups.find(function(g) { return g.id === preselectedGroupId; });
          if (matchedGroup) {
            setAudiences([{ type: 'group', group_id: matchedGroup.id, label: matchedGroup.name }]);
            setTab('compose');
          }
        }
      } catch (_e) { setOrgGroups([]); }

      var recentEventsRes = await supabase.from('events').select('id, title, start_time').eq('organization_id', organizationId).order('start_time', { ascending: false }).limit(20);
      setOrgEvents(recentEventsRes.data || []);

    } catch (err) {
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllMembers() {
    if (membersLoaded) return;
    try {
      // Two-step: get member_ids then names (members table uses user_id as PK, no full_name column)
      var memRes = await supabase.from('memberships').select('member_id').eq('organization_id', organizationId).eq('status', 'active');
      var ids = (memRes.data || []).map(function(m) { return m.member_id; });
      if (ids.length === 0) { setAllOrgMembers([]); setMembersLoaded(true); return; }
      var namesRes = await supabase.from('members').select('user_id, first_name, last_name, email').in('user_id', ids);
      var normalized = (namesRes.data || []).map(function(m) {
        return {
          member_id: m.user_id,
          full_name: ((m.first_name || '') + ' ' + (m.last_name || '')).trim() || m.user_id,
          email: m.email || '',
        };
      });
      setAllOrgMembers(normalized);
    } catch (_e) {
      setAllOrgMembers([]);
    } finally {
      setMembersLoaded(true);
    }
  }

  function useTemplate(template) {
    setSubject(template.subject);
    setBody(template.body);
    setActiveTemplateName(template.name);
    setTab('compose');
    toast('Template loaded — customize it before sending.', { icon: null });
  }

  async function saveTemplate() {
    if (!saveName.trim()) { toast.error('Please enter a template name'); return; }
    if (!subject.trim() || !body.trim()) { toast.error('Write your email first, then save as template'); return; }
    try {
      var userRes = await supabase.auth.getUser();
      var user = userRes.data.user;
      if (editingTemplate) {
        var updRes = await supabase.from('email_templates').update({ name: saveName.trim(), subject: subject, body: body, category: saveCategory, updated_at: new Date().toISOString() }).eq('id', editingTemplate.id);
        if (updRes.error) throw updRes.error;
        mascotSuccessToast('Template updated!', saveName.trim() + ' has been saved.');
      } else {
        var insRes = await supabase.from('email_templates').insert({ org_id: organizationId, name: saveName.trim(), subject: subject, body: body, category: saveCategory, created_by: user.id });
        if (insRes.error) throw insRes.error;
        mascotSuccessToast('Template saved!', saveName.trim() + ' is now in your templates.');
      }
      setShowSaveModal(false);
      setSaveName('');
      setEditingTemplate(null);
      loadData();
    } catch (err) { mascotErrorToast('Failed to save template.', err.message || ''); }
  }

  function openEditTemplate(template) {
    setSubject(template.subject);
    setBody(template.body);
    setActiveTemplateName(template.name);
    setEditingTemplate(template);
    setSaveName(template.name);
    setSaveCategory(template.category);
    setShowSaveModal(true);
    setTab('compose');
  }

  async function deleteTemplate(id) {
    try {
      var delRes = await supabase.from('email_templates').delete().eq('id', id);
      if (delRes.error) throw delRes.error;
      setCustomTemplates(customTemplates.filter(function(t) { return t.id !== id; }));
      mascotSuccessToast('Template deleted');
    } catch (err) { mascotErrorToast('Failed to delete template.', err.message || ''); }
  }

  async function sendBlast() {
    setShowConfirm(false);
    setSending(true);
    try {
      var sessionRes = await supabase.auth.getSession();
      var session = sessionRes.data.session;
      var res = await fetch('https://zktmhqrygknkodydbumq.supabase.co/functions/v1/send-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({
          org_id: organizationId,
          subject: subject,
          html_body: body,
          audiences: audiences,
          template_name: activeTemplateName || null
        })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      mascotSuccessToast('Email blast sent!', data.sent_count + ' recipient' + (data.sent_count !== 1 ? 's' : '') + ' received your message.');
      setSubject('');
      setBody('');
      setActiveTemplateName('');
      setAudiences([{ type: 'all_active', label: 'All Active Members' }]);
      loadData();
      setTab('history');
    } catch (err) {
      mascotErrorToast('Failed to send email blast.', err.message || '');
    } finally { setSending(false); }
  }

  var canSend = subject.trim() && body.trim() && !sending && isGrowthPlus && audiences.length > 0 && (planLimit === Infinity || usedThisMonth < planLimit);
  var audienceSummary = audiences.map(function(a) { return a.label; }).join(', ');

  if (!isAdmin) {
    return (
      <main className="flex-1 p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-slate-300" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Admin Access Required</h2>
          <p className="text-sm text-slate-500">Only organization admins can send email blasts.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 bg-[#F8FAFC] min-h-screen" aria-label="Email Blasts loading">
        <div className="px-6 py-6 border-b border-slate-200 bg-white">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
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

  if (planKey === 'starter') {
    return (
      <main className="flex-1 bg-[#F8FAFC] min-h-screen" aria-label="Email Blasts">
        {/* ── Standard page header ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0E1523', lineHeight: 1.15 }}>
                Email Blasts
              </h1>
              <p className="text-sm text-[#64748B] mt-1">Send announcements and updates directly to your members.</p>
            </div>
          </div>
          <div className="flex mt-5 border-b border-slate-200 opacity-40 pointer-events-none select-none" aria-hidden="true">
            {[{ key: 'compose', label: 'Compose', Icon: Mail }, { key: 'newsletter', label: 'Newsletter', Icon: Layout }, { key: 'templates', label: 'Templates', Icon: FileText }, { key: 'history', label: 'Send History', Icon: Clock }].map(function(t) {
              return (
                <div key={t.key} className={'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ' + (t.key === 'compose' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-400')}>
                  <t.Icon size={14} />{t.label}
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative">
          <div className="p-6 opacity-20 pointer-events-none select-none" aria-hidden="true">
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="h-12 bg-slate-100 border border-slate-200 rounded-lg" />
              <div className="h-12 bg-slate-100 border border-slate-200 rounded-lg" />
              <div className="h-48 bg-slate-100 border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-start justify-center pt-16 px-4" style={{ background: 'rgba(248,250,252,0.85)' }}>
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
                <Lock size={24} className="text-slate-400" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-50 border border-blue-200 text-blue-600 mb-4">Available on Growth</span>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">Email Blasts &amp; Newsletter Builder</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">Send announcements, updates, and beautifully designed newsletters directly to your members.</p>
              <ul className="text-left space-y-3 mb-8" role="list">
                {[{ icon: Send, text: 'Email blasts to all members or admins — up to 500/month' }, { icon: Layout, text: 'Drag-and-drop newsletter builder with 11 block types' }, { icon: BarChart2, text: 'Open rates, click rates, and bounce tracking per campaign' }, { icon: FileText, text: 'Reusable templates for announcements, events, and more' }].map(function(item, i) {
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                        <item.icon size={13} className="text-blue-500" />
                      </div>
                      <span className="text-sm text-slate-700">{item.text}</span>
                    </li>
                  );
                })}
              </ul>
              <button onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Upgrade to Growth <ArrowRight size={16} aria-hidden="true" />
              </button>
              <p className="text-xs text-slate-400 mt-3 text-center">$49.99/mo — or $499.90/yr (2 months free)</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#F8FAFC] min-h-screen" aria-label="Email Blasts">
      {/* ── Standard page header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0E1523', lineHeight: 1.15 }}>
              Email Blasts
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              {usedThisMonth + ' email' + (usedThisMonth !== 1 ? 's' : '') + ' sent this month'}
            </p>
          </div>
          <UsageBar used={usedThisMonth} limit={planLimit} />
        </div>
        <div className="flex mt-5 border-b border-slate-200" role="tablist" aria-label="Email blast sections">
          {[{ key: 'compose', label: 'Compose', Icon: Mail }, { key: 'newsletter', label: 'Newsletter', Icon: Layout }, { key: 'templates', label: 'Templates', Icon: FileText }, { key: 'history', label: 'Send History', Icon: Clock }].map(function(t) {
            var active = tab === t.key;
            return (
              <button key={t.key} role="tab" aria-selected={active} onClick={function() { setTab(t.key); }}
                className={'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (active ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-700')}>
                <t.Icon size={14} aria-hidden="true" />
                {t.label}
                {t.key === 'history' && blastHistory.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">{blastHistory.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">

        {tab === 'compose' && (
          <div className="max-w-3xl mx-auto space-y-5">
            {planLimit !== Infinity && remainingEmails === 0 && (
              <div role="alert" className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-red-600">Monthly limit reached</p>
                  <p className="text-xs text-red-500 mt-0.5">You've used all {planLimit} emails for this month. Upgrade to Pro for unlimited sends.</p>
                  <button onClick={function() { navigate('/organizations/' + organizationId + '/billing'); }}
                    className="mt-2 text-xs font-semibold text-blue-500 hover:text-blue-600 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    View upgrade options
                  </button>
                </div>
              </div>
            )}
            {activeTemplateName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <FileText size={13} className="text-[#F5B731]" aria-hidden="true" />
                <span className="text-xs text-slate-700">Template: <strong>{activeTemplateName}</strong></span>
                <button onClick={function() { setActiveTemplateName(''); }} aria-label="Clear template" className="ml-auto text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            )}
            <div>
              <label htmlFor="blast-subject" className="block text-xs font-bold uppercase tracking-widest text-[#F5B731] mb-2">Subject Line</label>
              <input id="blast-subject" type="text" value={subject} onChange={function(e) { setSubject(e.target.value); }} placeholder="Enter email subject..." aria-required="true"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#F5B731] mb-2">Send To</label>
              <RecipientBuilder
                audiences={audiences}
                onChange={setAudiences}
                memberCount={memberCount}
                orgGroups={orgGroups}
                orgEvents={orgEvents}
                organizationId={organizationId}
                allOrgMembers={allOrgMembers}
                membersLoaded={membersLoaded}
                onLoadMembers={loadAllMembers}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#F5B731] mb-2">Message Body</label>
              <BodyEditor value={body} onChange={setBody} />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <div className="flex items-center gap-2">
                <button onClick={function() { setShowPreview(true); }} disabled={!body.trim()} aria-label="Preview email"
                  className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
                  <Eye size={14} aria-hidden="true" />Preview
                </button>
                <button onClick={function() { setSaveName(activeTemplateName || ''); setShowSaveModal(true); }} disabled={!subject.trim() || !body.trim()} aria-label="Save as template"
                  className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
                  <Save size={14} aria-hidden="true" />Save as Template
                </button>
              </div>
              <button onClick={function() { setShowConfirm(true); }} disabled={!canSend}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {sending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />Sending...</> : <><Send size={14} aria-hidden="true" />Send Blast</>}
              </button>
            </div>
          </div>
        )}

        {tab === 'newsletter' && (
          <div className="-mx-6 -mb-6" style={{ height: 'calc(100vh - 220px)' }}>
            <NewsletterBuilder organization={organization} planKey={planKey} organizationId={organizationId} usedThisMonth={usedThisMonth} planLimit={planLimit} onSent={function() { loadData(); setTab('history'); }} />
          </div>
        )}

        {tab === 'templates' && (
          <div className="space-y-6">
            <section aria-labelledby="builtin-heading">
              <h2 id="builtin-heading" className="text-xs font-bold uppercase tracking-widest text-[#F5B731] mb-3">Built-in Templates</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BUILTIN_TEMPLATES.map(function(t) { return <TemplateCard key={t.id} template={t} onUse={useTemplate} isCustom={false} />; })}
              </div>
            </section>
            <section aria-labelledby="custom-heading">
              <div className="flex items-center justify-between mb-3">
                <h2 id="custom-heading" className="text-xs font-bold uppercase tracking-widest text-[#F5B731]">Your Templates</h2>
                <button onClick={function() { setTab('compose'); setTimeout(function() { setShowSaveModal(true); }, 100); }}
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">
                  <Plus size={13} aria-hidden="true" />New Template
                </button>
              </div>
              {customTemplates.length === 0 ? (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <FileText size={22} className="text-slate-300" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">No saved templates yet</h3>
                  <p className="text-xs text-slate-400 mb-4">Write an email and click "Save as Template" to build your library.</p>
                  <button onClick={function() { setTab('compose'); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">Compose an Email</button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {customTemplates.map(function(t) { return <TemplateCard key={t.id} template={t} onUse={useTemplate} onDelete={deleteTemplate} onEdit={openEditTemplate} isCustom={true} />; })}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {blastHistory.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <BarChart2 size={22} className="text-slate-300" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No emails sent yet</h3>
                <p className="text-xs text-slate-400 mb-4">Your send history will appear here after your first blast.</p>
                <button onClick={function() { setTab('compose'); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">Send Your First Blast</button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" role="table" aria-label="Email send history">
                    <thead>
                      <tr className="bg-slate-50 text-left border-b border-slate-200">
                        <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#F5B731]">Subject</th>
                        <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#F5B731]">Sent To</th>
                        <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#F5B731]">Recipients</th>
                        <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#F5B731]">Sent</th>
                        <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#F5B731]">Status</th>
                        <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#F5B731]">Analytics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blastHistory.map(function(blast) { return <HistoryRow key={blast.id} blast={blast} blastStats={blastStats} planKey={planKey} onViewAnalytics={setAnalyticsBlast} />; })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div role="dialog" aria-modal="true" aria-labelledby="preview-title" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 id="preview-title" className="text-base font-bold text-slate-900">Email Preview</h2>
              <button onClick={function() { setShowPreview(false); }} aria-label="Close preview" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="bg-white rounded-xl overflow-hidden max-w-lg mx-auto border border-slate-200">
                <div className="bg-[#0E1523] px-6 py-5 text-center">
                  <span className="text-lg font-extrabold text-white">{organization ? organization.name : 'Your Organization'}</span>
                </div>
                <div className="px-6 py-6">
                  <p className="text-sm text-slate-700 mb-1"><strong>Subject:</strong> {subject}</p>
                  <hr className="my-3 border-slate-200" />
                  <p className="text-sm text-slate-700 mb-3">Hi [Member Name],</p>
                  <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
                </div>
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-400">
                    You received this email as a member of <strong>{organization ? organization.name : 'your organization'}</strong>.<br />
                    Powered by <span style={{ color: '#F5B731', fontWeight: 700 }}>Syndi</span><span style={{ color: '#374151', fontWeight: 700 }}>cade</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm send modal */}
      {showConfirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Send size={18} className="text-blue-500" aria-hidden="true" />
              </div>
              <div>
                <h2 id="confirm-title" className="text-base font-bold text-slate-900 mb-1">Confirm Send</h2>
                <p className="text-sm text-slate-500">
                  You're about to send <strong className="text-slate-900">"{subject}"</strong> to <strong className="text-slate-900">{audienceSummary}</strong>.
                  {planLimit !== Infinity && <span className="block mt-1 text-xs text-slate-400">{remainingEmails} emails remaining this month after sending.</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={function() { setShowConfirm(false); }} className="px-4 py-2 bg-transparent border border-slate-200 text-slate-500 hover:text-slate-900 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">Cancel</button>
              <button onClick={sendBlast} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2">
                <Send size={14} aria-hidden="true" />Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save template modal */}
      {showSaveModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="save-template-title" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 id="save-template-title" className="text-base font-bold text-slate-900">{editingTemplate ? 'Update Template' : 'Save as Template'}</h2>
              <button onClick={function() { setShowSaveModal(false); setEditingTemplate(null); }} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-xs font-bold uppercase tracking-widest text-[#F5B731] mb-2">Template Name</label>
                <input id="template-name" type="text" value={saveName} onChange={function(e) { setSaveName(e.target.value); }} placeholder="e.g. Spring Fundraiser Invite" aria-required="true"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="template-category" className="block text-xs font-bold uppercase tracking-widest text-[#F5B731] mb-2">Category</label>
                <select id="template-category" value={saveCategory} onChange={function(e) { setSaveCategory(e.target.value); }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['General', 'Members', 'Events', 'Finance', 'Volunteers'].map(function(cat) { return <option key={cat} value={cat}>{cat}</option>; })}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={function() { setShowSaveModal(false); setEditingTemplate(null); }} className="px-4 py-2 bg-transparent border border-slate-200 text-slate-500 hover:text-slate-900 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">Cancel</button>
              <button onClick={saveTemplate} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2">
                <Save size={14} aria-hidden="true" />{editingTemplate ? 'Update' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {analyticsBlast && (
        <EmailAnalyticsModal blast={analyticsBlast} planKey={planKey} onClose={function() { setAnalyticsBlast(null); }} />
      )}
    </main>
  );
}