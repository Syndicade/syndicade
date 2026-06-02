/**
 * ContentEditor.jsx
 * Zero-code content editing for staff. Drop this in as the "Content" tab
 * inside StaffDashboard.jsx.
 *
 * Draft/Publish flow:
 *   Edit → Save as Draft (draft_value, is_draft=true) → Preview → Publish (value=draft_value, is_draft=false, published_at=now)
 *   Live site reads `value` only. Draft changes never go live until explicitly published.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { mascotSuccessToast, mascotErrorToast } from '../components/MascotToast';
import toast from 'react-hot-toast';
import { Edit2, Check, X, AlertCircle, Globe, RefreshCw, ChevronDown, ChevronRight, FileText, Search, Eye, EyeOff, Upload, Clock } from 'lucide-react';

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function EditorSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: 3 }).map(function (_, si) {
        return (
          <div key={si} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-100 ml-2" />
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 3 }).map(function (_, fi) {
                return (
                  <div key={fi} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded bg-slate-200" />
                      <div className="h-8 w-full rounded bg-slate-100" />
                    </div>
                    <div className="w-32 h-8 rounded bg-slate-100 mt-5 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Google preview ────────────────────────────────────────────────────────────
function GooglePreview({ title, description }) {
  return (
    <div className="mt-3 bg-white rounded-lg p-4 border border-slate-200 max-w-lg shadow-sm" aria-label="Google search preview">
      <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Globe size={11} aria-hidden="true" />
        Google Preview
      </p>
      <p className="text-[#1a0dab] text-[16px] font-normal mb-0.5 truncate">{title || 'Page Title'}</p>
      <p className="text-[#006621] text-[12px] mb-0.5">syndicade.com</p>
      <p className="text-[#545454] text-[13px] leading-snug line-clamp-2">{description || 'Page description will appear here.'}</p>
    </div>
  );
}

// ─── Preview modal ─────────────────────────────────────────────────────────────
function PreviewModal({ field, onClose, onPublish, publishing }) {
  var liveValue = field.value || '';
  var draftValue = field.draft_value || '';
  var isMetaDesc = field.key === 'meta_description';
  var isMetaTitle = field.key === 'meta_title';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={'Preview changes for ' + field.label}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-[16px] font-bold text-[#0E1523]">Preview Changes</h2>
            <p className="text-[12px] text-[#64748B] mt-0.5">{field.label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#0E1523] rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
            aria-label="Close preview"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Live value */}
          <div>
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <EyeOff size={11} aria-hidden="true" />
              Current live value
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-[14px] text-[#475569] whitespace-pre-wrap">
              {liveValue || <span className="italic text-[#94A3B8]">Empty</span>}
            </div>
            {isMetaDesc && <GooglePreview title="Syndicade — Where Community Work Connects" description={liveValue} />}
            {isMetaTitle && <GooglePreview title={liveValue} description="(current meta description)" />}
          </div>

          {/* Draft value */}
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye size={11} aria-hidden="true" />
              Draft — will go live after publish
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[14px] text-[#0E1523] whitespace-pre-wrap">
              {draftValue || <span className="italic text-[#94A3B8]">Empty</span>}
            </div>
            {isMetaDesc && <GooglePreview title="Syndicade — Where Community Work Connects" description={draftValue} />}
            {isMetaTitle && <GooglePreview title={draftValue} description="(draft meta description)" />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-[12px] text-[#64748B]">Publishing will make the draft value live immediately.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-[#475569] text-[13px] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onPublish}
              disabled={publishing}
              className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white text-[13px] font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              <Upload size={14} aria-hidden="true" />
              {publishing ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Single editable field row ─────────────────────────────────────────────────
function ContentField({ field, onSaved }) {
  var [editing, setEditing] = useState(false);
  var [draft, setDraft] = useState(field.draft_value || field.value || '');
  var [saving, setSaving] = useState(false);
  var [publishing, setPublishing] = useState(false);
  var [showPreview, setShowPreview] = useState(false);
  var inputRef = useRef(null);

  var isMetaDesc = field.key === 'meta_description';
  var isOverLimit = isMetaDesc && draft.length > 160;
  var hasDraft = field.is_draft && field.draft_value !== null;
  var isEmpty = !field.value || field.value.trim() === '';

  useEffect(function () {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function handleStartEdit() {
    setDraft(field.draft_value || field.value || '');
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  // Save as draft — writes to draft_value, sets is_draft=true, does NOT touch value
  async function handleSaveDraft() {
    var currentVal = field.draft_value || field.value || '';
    if (draft === currentVal) { setEditing(false); return; }
    setSaving(true);

    var updateResult = await supabase
      .from('site_content')
      .update({ draft_value: draft, is_draft: true })
      .eq('key', field.key);

    if (updateResult.error) {
      mascotErrorToast('Failed to save draft.', 'Check your connection and try again.');
      setSaving(false);
      return;
    }

    var authResult = await supabase.auth.getUser();
    var user = authResult.data.user;
    await supabase.from('staff_audit_log').insert({
      staff_user_id: user.id,
      action: 'content_draft_saved',
      target_type: 'site_content',
      target_id: field.key,
      details: { label: field.label, draft_value: draft.slice(0, 100) },
    });

    mascotSuccessToast('Draft saved.', '"' + field.label + '" is ready to preview and publish.');
    setSaving(false);
    setEditing(false);
    onSaved(field.key, { draft_value: draft, is_draft: true });
  }

  // Publish — copies draft_value → value, clears is_draft, sets published_at
  async function handlePublish() {
    setPublishing(true);
    var newValue = field.draft_value || draft;

    var updateResult = await supabase
      .from('site_content')
      .update({ value: newValue, is_draft: false, draft_value: null, published_at: new Date().toISOString() })
      .eq('key', field.key);

    if (updateResult.error) {
      mascotErrorToast('Publish failed.', 'Check your connection and try again.');
      setPublishing(false);
      return;
    }

    var authResult = await supabase.auth.getUser();
    var user = authResult.data.user;
    await supabase.from('staff_audit_log').insert({
      staff_user_id: user.id,
      action: 'content_published',
      target_type: 'site_content',
      target_id: field.key,
      details: { label: field.label, published_value: newValue.slice(0, 100) },
    });

    mascotSuccessToast('"' + field.label + '" is now live!');
    setPublishing(false);
    setShowPreview(false);
    onSaved(field.key, { value: newValue, is_draft: false, draft_value: null, published_at: new Date().toISOString() });
  }

  function handleKeyDown(e) {
    if (field.field_type === 'text' && e.key === 'Enter') { e.preventDefault(); handleSaveDraft(); }
    if (e.key === 'Escape') handleCancel();
  }

  function formatPublishedAt(ts) {
    if (!ts) return null;
    var d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <>
      <div className={'px-6 py-4 border-b border-slate-100 last:border-b-0 ' + (editing ? 'bg-blue-50/40' : hasDraft ? 'bg-amber-50/30' : 'hover:bg-slate-50/60')}>
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <label htmlFor={'field-' + field.key} className="text-[13px] font-semibold text-[#0E1523]">
                {field.label}
              </label>
              {isEmpty && !hasDraft && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  Empty
                </span>
              )}
              {hasDraft && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={9} aria-hidden="true" />
                  Unpublished draft
                </span>
              )}
              {field.published_at && !hasDraft && (
                <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                  <Check size={9} className="text-green-500" aria-hidden="true" />
                  Live — {formatPublishedAt(field.published_at)}
                </span>
              )}
            </div>

            {field.description && (
              <p className="text-[12px] text-[#64748B] mb-2">{field.description}</p>
            )}

            {/* Input or display */}
            {editing ? (
              <div>
                {field.field_type === 'textarea' ? (
                  <textarea
                    id={'field-' + field.key}
                    ref={inputRef}
                    value={draft}
                    onChange={function (e) { setDraft(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    rows={4}
                    className={'w-full bg-white border rounded-lg px-3 py-2 text-[14px] text-[#0E1523] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (isOverLimit ? 'border-red-400' : 'border-blue-400')}
                    aria-describedby={field.key + '-hint'}
                  />
                ) : (
                  <input
                    id={'field-' + field.key}
                    ref={inputRef}
                    type={field.field_type === 'url' ? 'url' : 'text'}
                    value={draft}
                    onChange={function (e) { setDraft(e.target.value); }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-white border border-blue-400 rounded-lg px-3 py-2 text-[14px] text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-describedby={field.key + '-hint'}
                  />
                )}

                {field.field_type === 'textarea' && (
                  <div id={field.key + '-hint'} className={'flex items-center justify-between mt-1 ' + (isOverLimit ? 'text-red-500' : 'text-[#64748B]')}>
                    <span className="text-[11px]">
                      {isOverLimit && <AlertCircle size={11} className="inline mr-1" aria-hidden="true" />}
                      {draft.length}{isMetaDesc ? ' / 160 recommended' : ' characters'}
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">Esc to cancel</span>
                  </div>
                )}

                {isMetaDesc && <GooglePreview title="Syndicade — Where Community Work Connects" description={draft} />}
                {field.key === 'meta_title' && <GooglePreview title={draft} description="Update your meta description too." />}
              </div>
            ) : (
              <div
                className="text-[14px] text-[#475569] cursor-pointer"
                onClick={handleStartEdit}
                role="button"
                tabIndex={0}
                onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') handleStartEdit(); }}
                aria-label={'Edit ' + field.label}
              >
                {hasDraft ? (
                  <span className={field.field_type === 'textarea' ? 'line-clamp-2 text-amber-800' : 'truncate block text-amber-800'}>
                    {field.draft_value}
                  </span>
                ) : isEmpty ? (
                  <span className="text-[#94A3B8] italic">Click to add content...</span>
                ) : (
                  <span className={field.field_type === 'textarea' ? 'line-clamp-2' : 'truncate block'}>
                    {field.value}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-5">
            {editing ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || isOverLimit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-[12px] font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  aria-label={'Save draft for ' + field.label}
                >
                  <Check size={13} aria-hidden="true" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#475569] text-[12px] font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors"
                  aria-label="Cancel edit"
                >
                  <X size={13} aria-hidden="true" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                {hasDraft && (
                  <button
                    onClick={function () { setShowPreview(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-700 text-[12px] font-semibold rounded-lg hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-colors"
                    aria-label={'Preview and publish draft for ' + field.label}
                  >
                    <Eye size={13} aria-hidden="true" />
                    Preview &amp; Publish
                  </button>
                )}
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[#475569] text-[12px] font-semibold rounded-lg hover:border-blue-300 hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  aria-label={'Edit ' + field.label}
                >
                  <Edit2 size={13} aria-hidden="true" />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          field={field}
          onClose={function () { setShowPreview(false); }}
          onPublish={handlePublish}
          publishing={publishing}
        />
      )}
    </>
  );
}

// ─── Publish All button ────────────────────────────────────────────────────────
function PublishAllButton({ fields, onAllPublished }) {
  var [publishing, setPublishing] = useState(false);
  var draftFields = fields.filter(function (f) { return f.is_draft && f.draft_value !== null; });

  if (draftFields.length === 0) return null;

  async function handlePublishAll() {
    setPublishing(true);
    var now = new Date().toISOString();
    var authResult = await supabase.auth.getUser();
    var user = authResult.data.user;
    var failed = 0;

    for (var i = 0; i < draftFields.length; i++) {
      var f = draftFields[i];
      var result = await supabase
        .from('site_content')
        .update({ value: f.draft_value, is_draft: false, draft_value: null, published_at: now })
        .eq('key', f.key);

      if (result.error) {
        failed++;
      } else {
        await supabase.from('staff_audit_log').insert({
          staff_user_id: user.id,
          action: 'content_published',
          target_type: 'site_content',
          target_id: f.key,
          details: { label: f.label, published_value: (f.draft_value || '').slice(0, 100), bulk: true },
        });
      }
    }

    setPublishing(false);

    if (failed > 0) {
      mascotErrorToast(failed + ' field' + (failed !== 1 ? 's' : '') + ' failed to publish.', 'The rest were published successfully.');
    } else {
      mascotSuccessToast('All ' + draftFields.length + ' draft' + (draftFields.length !== 1 ? 's' : '') + ' are now live!');
    }

    onAllPublished(now);
  }

  return (
    <button
      onClick={handlePublishAll}
      disabled={publishing}
      className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white text-[13px] font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
      aria-label={'Publish all ' + draftFields.length + ' drafts'}
    >
      <Upload size={14} aria-hidden="true" />
      {publishing ? 'Publishing...' : 'Publish All (' + draftFields.length + ')'}
    </button>
  );
}

// ─── Section group ─────────────────────────────────────────────────────────────
function ContentSection({ sectionName, fields, onFieldSaved }) {
  var [collapsed, setCollapsed] = useState(false);
  var emptyCount = fields.filter(function (f) { return !f.value || f.value.trim() === ''; }).length;
  var draftCount = fields.filter(function (f) { return f.is_draft && f.draft_value !== null; }).length;

  return (
    <div className={'bg-white border rounded-xl overflow-hidden ' + (draftCount > 0 ? 'border-amber-200' : 'border-slate-200')}>
      <button
        onClick={function () { setCollapsed(!collapsed); }}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors"
        aria-expanded={!collapsed}
        aria-controls={'section-' + sectionName.replace(/\s/g, '-')}
      >
        <div className="flex items-center gap-3">
          {collapsed
            ? <ChevronRight size={15} className="text-[#94A3B8]" aria-hidden="true" />
            : <ChevronDown size={15} className="text-[#94A3B8]" aria-hidden="true" />
          }
          <span className="text-[13px] font-bold text-[#0E1523]">{sectionName}</span>
          <span className="text-[11px] text-[#64748B]">{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
          {draftCount > 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock size={9} aria-hidden="true" />
              {draftCount} unpublished
            </span>
          )}
          {emptyCount > 0 && draftCount === 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              {emptyCount} empty
            </span>
          )}
        </div>
      </button>

      {!collapsed && (
        <div id={'section-' + sectionName.replace(/\s/g, '-')}>
          {fields.map(function (field) {
            return (
              <ContentField
                key={field.key}
                field={field}
                onSaved={onFieldSaved}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ContentEditor ────────────────────────────────────────────────────────
export default function ContentEditor({ staffUserId }) {
  var [allFields, setAllFields] = useState([]);
  var [loading, setLoading] = useState(true);
  var [refreshing, setRefreshing] = useState(false);
  var [searchQuery, setSearchQuery] = useState('');

  useEffect(function () { loadContent(false); }, []);

  async function loadContent(showRefresh) {
    if (showRefresh) setRefreshing(true);
    var result = await supabase
      .from('site_content')
      .select('*')
      .order('section')
      .order('sort_order');

    setAllFields(result.data || []);
    setLoading(false);
    setRefreshing(false);
  }

  function handleFieldSaved(key, updates) {
    setAllFields(function (prev) {
      return prev.map(function (f) {
        return f.key === key ? Object.assign({}, f, updates) : f;
      });
    });
  }

  function handleAllPublished(publishedAt) {
    setAllFields(function (prev) {
      return prev.map(function (f) {
        if (f.is_draft && f.draft_value !== null) {
          return Object.assign({}, f, { value: f.draft_value, is_draft: false, draft_value: null, published_at: publishedAt });
        }
        return f;
      });
    });
  }

  var filteredFields = searchQuery.trim()
    ? allFields.filter(function (f) {
        var q = searchQuery.toLowerCase();
        return (
          (f.label || '').toLowerCase().includes(q) ||
          (f.key || '').toLowerCase().includes(q) ||
          (f.value || '').toLowerCase().includes(q) ||
          (f.section || '').toLowerCase().includes(q)
        );
      })
    : allFields;

  var sections = {};
  filteredFields.forEach(function (field) {
    var sec = field.section || 'General';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(field);
  });

  var sectionNames = Object.keys(sections).sort();
  var totalEmpty = allFields.filter(function (f) { return !f.value || f.value.trim() === ''; }).length;
  var totalDrafts = allFields.filter(function (f) { return f.is_draft && f.draft_value !== null; }).length;

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <p className="flex-1 min-w-0 text-[13px] text-[#64748B]">
          Edits are saved as drafts first. Preview changes, then publish to make them live.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {totalEmpty > 0 && !loading && (
            <span className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold">
              {totalEmpty} empty field{totalEmpty !== 1 ? 's' : ''}
            </span>
          )}
          {!loading && totalDrafts > 0 && (
            <PublishAllButton fields={allFields} onAllPublished={handleAllPublished} />
          )}
          <button
            onClick={function () { loadContent(true); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-[#475569] font-semibold hover:border-blue-300 hover:text-[#0E1523] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            aria-label="Refresh content fields"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Draft banner */}
      {!loading && totalDrafts > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-5" role="status">
          <Clock size={16} className="text-amber-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-[13px] text-amber-800 font-semibold">
            {totalDrafts} unpublished draft{totalDrafts !== 1 ? 's' : ''} — these changes are not live yet.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" aria-hidden="true" />
        <label htmlFor="content-search" className="sr-only">Search content fields</label>
        <input
          id="content-search"
          type="search"
          value={searchQuery}
          onChange={function (e) { setSearchQuery(e.target.value); }}
          placeholder="Search fields by name, section, or current value..."
          className="w-full bg-white border border-slate-200 text-[#0E1523] text-[14px] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-[#94A3B8]"
          autoComplete="off"
        />
      </div>

      {/* Content */}
      {loading ? (
        <EditorSkeleton />
      ) : sectionNames.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-16 text-center">
          <FileText size={40} className="text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-[#0E1523] font-bold text-[16px] mb-2">
            {searchQuery ? 'No fields match your search' : 'No content fields found'}
          </p>
          <p className="text-[14px] text-[#64748B] mb-5">
            {searchQuery
              ? 'Try a different search term or clear the search to see all fields.'
              : 'Run the site_content SQL migration first, then refresh.'}
          </p>
          {searchQuery ? (
            <button
              onClick={function () { setSearchQuery(''); }}
              className="px-5 py-2.5 bg-blue-500 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Clear search
            </button>
          ) : (
            <button
              onClick={function () { loadContent(true); }}
              className="px-5 py-2.5 bg-blue-500 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4" role="list" aria-label="Content sections">
          {sectionNames.map(function (sectionName) {
            return (
              <div key={sectionName} role="listitem">
                <ContentSection
                  sectionName={sectionName}
                  fields={sections[sectionName]}
                  onFieldSaved={handleFieldSaved}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && (
        <p className="text-[12px] text-[#94A3B8] text-center mt-6">
          To add new editable fields, insert a row into the{' '}
          <span className="font-mono text-[#64748B]">site_content</span> table in Supabase. No code changes needed.
        </p>
      )}
    </div>
  );
}